// Giữ giao dịch đáng ngờ để rà soát — lớp phòng gian lận trên cùng của 2FA.
//
// 2FA (PIN + Face ID/Google) trả lời "đúng chủ tài khoản không?". Lớp này trả lời câu khác:
// "giao dịch này có GIỐNG hành vi thường ngày của chủ không?". Kẻ chiếm được cả
// PIN vẫn lộ ở chỗ: lần đầu quét sạch ví sang một tài khoản lạ, số tiền gấp
// nhiều lần mọi lần trước. Ngân hàng giữ đúng loại lệnh đó lại để người rà.
//
// Ngưỡng + hệ số qua ENV (đặt MONEY_HOLD_THRESHOLD=0 để tắt):
//   MONEY_HOLD_THRESHOLD  (mặc định 20000 JOY gốc) — dưới mức này không bao giờ giữ
//   MONEY_HOLD_SPIKE      (mặc định 3)   — gấp mấy lần mức chuyển lớn nhất 30 ngày
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy } from '../utils/joyService.js';

const num = (name, fb) => (process.env[name] != null ? Number(process.env[name]) : fb);

/**
 * @returns {hold:boolean, reason?:string}
 * Giữ khi: số tiền ≥ ngưỡng VÀ (chưa từng chuyển lớn như vậy — gấp >N lần mức
 * cao nhất 30 ngày, hoặc đây là lần chuyển lớn đầu tiên).
 */
export async function assessTransferHold({ senderEmail, amountBaseJoy }) {
  const threshold = num('MONEY_HOLD_THRESHOLD', 20000);
  if (!threshold || threshold < 1) return { hold: false };
  const amount = Math.abs(Number(amountBaseJoy) || 0);
  if (amount < threshold) return { hold: false };

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const prior = await JoyLedger.find({
    email: String(senderEmail).toLowerCase(),
    source: { $in: ['joy_gift_sent', 'member_transfer_out'] },
    createdAt: { $gte: since },
  }, 'amount').lean();

  const recentMax = prior.reduce((m, r) => Math.max(m, Math.abs(r.amount || 0)), 0);
  return holdDecision(amount, recentMax, { threshold, spike: num('MONEY_HOLD_SPIKE', 3) });
}

// Quyết định thuần (không I/O) — tách ra để test được không cần DB. `amount` đã
// biết ≥ ngưỡng khi gọi từ assessTransferHold, nhưng hàm tự kiểm lại để đứng
// một mình cũng đúng.
export function holdDecision(amount, recentMax, { threshold = 20000, spike = 3 } = {}) {
  if (!threshold || threshold < 1 || amount < threshold) return { hold: false };
  if (recentMax === 0) {
    return { hold: true, reason: `Lần đầu chuyển khoản lớn (${amount.toLocaleString('vi-VN')} JOY), chưa có lịch sử để đối chiếu.` };
  }
  if (amount > recentMax * spike) {
    return { hold: true, reason: `Số tiền (${amount.toLocaleString('vi-VN')} JOY) gấp ${(amount / recentMax).toFixed(1)}× mức chuyển lớn nhất 30 ngày qua (${recentMax.toLocaleString('vi-VN')} JOY).` };
  }
  return { hold: false };
}

// Thực thi một giao dịch ĐÃ được duyệt — dùng đúng số liệu đã tính lúc giữ, nên
// không lệch một xu dù tỷ giá có đổi giữa chừng. Kiểm lại số dư ngay trước khi
// trừ: tiền có thể đã tiêu bớt trong lúc chờ duyệt.
export async function executeHeldTransfer(pending) {
  const Bio = (await import('../models/Bio.js')).default;
  const sender = await Bio.findOne({ email: pending.fromEmail });
  const recipient = await Bio.findOne({ email: pending.toEmail });
  if (!sender || !recipient) throw new Error('Tài khoản người gửi/nhận không còn tồn tại.');
  if (sender.joyBalance < pending.totalDeducted) throw new Error('Số dư người gửi không còn đủ.');

  const customMsg = pending.message ? ` Lời nhắn: "${pending.message}"` : '';
  await Promise.all([
    awardJoy(sender.email, -pending.totalDeducted, 'joy_gift_sent',
      `Gửi ${pending.numAmount} JOY cho ${pending.toName} (đã duyệt sau rà soát).${customMsg}`,
      { refId: pending.txCode, bioDoc: sender, counterparty: pending.toName, pushNotify: true }),
    awardJoy(recipient.email, pending.numAmount, 'joy_gift_received',
      `${pending.fromName} đã chuyển JOY cho bạn.${customMsg}`,
      { refId: pending.txCode, bioDoc: recipient, counterparty: pending.fromName, pushNotify: true, actionUrl: '/member/account' }),
  ]);
  return { balance: sender.joyBalance };
}

// ── Chính chủ tự giải phóng (31/10/2026) ─────────────────────────────────────
// Như "Độ trễ bảo mật" của Apple: giao dịch bị giữ chờ HOLD_DELAY_MS, rồi chính
// chủ mở Face ID/Google là tiền đi — không cần admin. Kẻ trộm máy phải giữ được
// máy qua cả giờ chờ lẫn Face ID; còn chủ thật thì không phải chờ người duyệt.
// Admin chỉ còn phải nhìn lệnh mà chủ không xác nhận sau 24 giờ.
export const HOLD_DELAY_MS = 60 * 60 * 1000;

export const holdReadyAt = (pending) => new Date(new Date(pending.createdAt).getTime() + HOLD_DELAY_MS);

/**
 * Một cửa cho MỌI quyết định về lệnh bị giữ (chính chủ, admin web, Telegram).
 * Chiếm lệnh nguyên tử rồi mới chuyển: hai bên bấm cùng lúc thì chỉ một bên
 * thắng, tiền không đi hai lần. Chuyển hỏng thì trả lệnh về chờ.
 */
export async function decideHeldTransfer(match, { approve, decidedBy }) {
  const PendingTransfer = (await import('../models/PendingTransfer.js')).default;
  const pending = await PendingTransfer.findOneAndUpdate(
    { ...match, status: 'pending' },
    { $set: { status: approve ? 'approved' : 'rejected', decidedBy, decidedAt: new Date() } },
    { new: true },
  );
  if (!pending) return { ok: false, error: 'Giao dịch đã được xử lý hoặc hết hạn.' };
  if (!approve) {
    const { notifyMember } = await import('../utils/notifyMember.js');
    await notifyMember({
      email: pending.fromEmail, type: 'warning', category: 'joy',
      key: 'source.transfer_rejected', actionUrl: '/member/account', push: true,
      refCode: pending.txCode, counterparty: pending.toName,
    }).catch(() => {});
    return { ok: true, pending };
  }
  try {
    await executeHeldTransfer(pending);
    return { ok: true, pending };
  } catch (error) {
    await PendingTransfer.updateOne({ _id: pending._id }, { $set: { status: 'pending', decidedBy: '', decidedAt: null } });
    return { ok: false, error: error.message };
  }
}

/** Chính chủ, đã qua giờ chờ, vừa mở Face ID/Google. */
export const releaseHeldTransfer = (txCode, email) => decideHeldTransfer(
  { txCode, fromEmail: email, createdAt: { $lte: new Date(Date.now() - HOLD_DELAY_MS) } },
  { approve: true, decidedBy: 'owner-faceid' },
);

/** Cron 10 phút: lệnh vừa hết giờ chờ thì báo chủ vào xác nhận bằng Face ID. */
export async function notifyReadyHolds() {
  const PendingTransfer = (await import('../models/PendingTransfer.js')).default;
  const { notifyMember } = await import('../utils/notifyMember.js');
  const ready = await PendingTransfer.find({
    status: 'pending', readyNotifiedAt: null, createdAt: { $lte: new Date(Date.now() - HOLD_DELAY_MS) },
  }).limit(100).lean();
  for (const p of ready) {
    await PendingTransfer.updateOne({ _id: p._id }, { $set: { readyNotifiedAt: new Date() } });
    await notifyMember({
      email: p.fromEmail, key: 'event.holdReady', params: { amount: p.numAmount, recipient: p.toName },
      type: 'info', category: 'joy', actionUrl: '/member/account', push: true, refCode: p.txCode,
    }).catch(() => {});
  }
  return ready.length;
}
