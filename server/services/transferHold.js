// Giữ giao dịch đáng ngờ để rà soát — lớp phòng gian lận trên cùng của 2FA.
//
// 2FA (PIN+OTP) trả lời "đúng chủ tài khoản không?". Lớp này trả lời câu khác:
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
      { refId: pending.txCode, bioDoc: sender, counterparty: pending.toName }),
    awardJoy(recipient.email, pending.numAmount, 'joy_gift_received',
      `${pending.fromName} đã chuyển JOY cho bạn.${customMsg}`,
      { refId: pending.txCode, bioDoc: recipient, counterparty: pending.fromName, pushNotify: true, actionUrl: '/member/account' }),
  ]);
  return { balance: sender.joyBalance };
}
