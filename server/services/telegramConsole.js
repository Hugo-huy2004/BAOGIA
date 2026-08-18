/**
 * Bảng điều khiển Telegram cho Boss — bấm nút thay vì thuộc cú pháp.
 *
 * Nguyên tắc dựng:
 *  • Mỗi lần bấm là SỬA tin đang mở, không đẩy tin mới. Một khung chat sạch,
 *    dùng như một app có nút Quay lại, chứ không phải bãi thẻ chết.
 *  • Tra cứu mở ô nhập tự do (ForceReply): gõ email, tên, slug hay số điện
 *    thoại đều được — Boss không phải nhớ mình đang tra theo trường nào.
 *  • Kết quả ra thành nút bấm. Chỉ khi cần một chuỗi tuỳ ý (số JOY lẻ) mới hỏi
 *    lại bằng ô nhập.
 *
 * `callback_data` của Telegram tối đa 64 byte, nên khoá theo _id của Mongo (24
 * ký tự) chứ không nhét email vào — địa chỉ dài là nút chết lặng, không báo lỗi.
 */
import Bio from '../models/Bio.js';
import SupportTicket from '../models/SupportTicket.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy } from '../utils/joyService.js';
import { bioAge, isMinorAge, GUARDIAN_CONSENT_AGE } from '../utils/memberAge.js';
import { revokeMemberSession } from '../utils/memberSession.js';
import { sendTelegramMessage, editTelegramMessage, askTelegramInput } from './telegramService.js';

// Boss đang được hỏi điều gì. ponytail: để trong RAM — khởi động lại thì Boss
// bấm nút lần nữa, không đáng đánh đổi thêm một collection trong Mongo.
const pendingInput = new Map(); // chatId -> { kind, id, messageId }

export function setPendingInput(chatId, value) {
  if (value) pendingInput.set(String(chatId), value);
  else pendingInput.delete(String(chatId));
}
export function takePendingInput(chatId) {
  const key = String(chatId);
  const value = pendingInput.get(key);
  pendingInput.delete(key);
  return value;
}

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const shortId = (bio) => String(bio._id);

// ─── MÀN HÌNH CHÍNH ──────────────────────────────────────────────────────────
export async function homeScreen() {
  const [members, tickets, frozen, dueChecks] = await Promise.all([
    Bio.countDocuments(),
    SupportTicket.countDocuments({ status: 'pending' }),
    Bio.countDocuments({ isJoyWalletFrozen: true }),
    Bio.countDocuments({ 'identityCheck.nextDueAt': { $lte: new Date() } }),
  ]);

  const text = [
    '👑 <b>BẢNG ĐIỀU KHIỂN HUGO STUDIO</b>',
    '',
    `👥 Thành viên: <b>${fmt(members)}</b>`,
    `📩 Ticket chờ: <b>${tickets}</b>`,
    `❄️ Ví đang đóng băng: <b>${frozen}</b>`,
    `🪪 Đang chờ kiểm tra thông tin: <b>${dueChecks}</b>`,
    `🔧 Bảo trì: <b>${global.IS_SYSTEM_MAINTENANCE ? 'ĐANG BẬT' : 'tắt'}</b>`,
    '',
    '<i>Chọn một mục bên dưới.</i>',
  ].join('\n');

  return {
    text,
    markup: {
      inline_keyboard: [
        [{ text: '🔍 Tra cứu thành viên', callback_data: 'k:find' }],
        [
          { text: '🆕 Mới nhất', callback_data: 'k:latest' },
          { text: '💰 Nhiều JOY nhất', callback_data: 'k:rich' },
        ],
        [
          { text: '🪪 Chờ kiểm tra', callback_data: 'k:due' },
          { text: '❄️ Ví đóng băng', callback_data: 'k:frozen' },
        ],
        [
          { text: '📋 Nhật ký', callback_data: 'k:log' },
          {
            text: global.IS_SYSTEM_MAINTENANCE ? '🟢 Tắt bảo trì' : '🔧 Bật bảo trì',
            callback_data: 'k:maint',
          },
        ],
      ],
    },
  };
}

// ─── DANH SÁCH → NÚT ─────────────────────────────────────────────────────────
function listScreen(title, bios, emptyHint) {
  if (!bios.length) return { text: `${title}\n\n<i>${emptyHint}</i>`, markup: backOnly() };
  return {
    text: `${title}\n\n<i>Chọn một người để xem chi tiết.</i>`,
    markup: {
      inline_keyboard: [
        ...bios.map((b) => [{
          text: `${b.displayName || b.email} · ${fmt(b.joyBalance)} JOY${b.isJoyWalletFrozen ? ' ❄️' : ''}`.slice(0, 60),
          callback_data: `k:m:${shortId(b)}`,
        }]),
        [{ text: '⬅️ Về bảng chính', callback_data: 'k:home' }],
      ],
    },
  };
}

const backOnly = () => ({ inline_keyboard: [[{ text: '⬅️ Về bảng chính', callback_data: 'k:home' }]] });

export async function searchScreen(query) {
  const clean = String(query || '').trim();
  if (!clean) return { text: '🔍 Chưa có từ khoá nào.', markup: backOnly() };

  // Thoát ký tự đặc biệt: người ta gõ "a.b+c@…" là chuyện thường, để nguyên thì
  // chuỗi đó thành biểu thức chính quy và tìm ra kết quả vô nghĩa.
  const safe = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(safe, 'i');
  const bios = await Bio.find({
    $or: [{ email: rx }, { displayName: rx }, { slug: rx }, { phone: rx }],
  }).limit(8).lean();

  if (bios.length === 1) return memberScreen(bios[0]); // đã là Promise, nơi gọi await
  return listScreen(`🔍 <b>Kết quả cho “${clean}”</b> — ${bios.length} người`, bios, 'Không tìm thấy ai khớp.');
}

// ─── THẺ THÀNH VIÊN ──────────────────────────────────────────────────────────
/**
 * Thẻ đầy đủ: mọi thứ Boss cần để RA QUYẾT ĐỊNH đều nằm trên một màn, không
 * phải bấm qua ba lớp. Trạng thái khoá tài khoản phải tra riêng (lưu ở bảng
 * SecurityBlock dạng băm) nên hàm này bất đồng bộ.
 */
export async function memberScreen(bioDoc) {
  const bio = bioDoc;
  const ic = bio.identityCheck || {};
  const due = ic.nextDueAt && new Date(ic.nextDueAt) <= new Date();
  const id = shortId(bio);
  const age = bioAge(bio);

  const [ledgerCount, lastTx, tickets, block] = await Promise.all([
    JoyLedger.countDocuments({ email: bio.email }),
    JoyLedger.findOne({ email: bio.email }).sort({ createdAt: -1 }).lean(),
    SupportTicket.countDocuments({ email: bio.email, status: 'pending' }),
    findBlock(bio.email),
  ]);

  const hsd = bio.expiresAt ? new Date(bio.expiresAt) : null;
  const hsdLeft = hsd ? Math.ceil((hsd - Date.now()) / 86400000) : null;

  const text = [
    `👤 <b>${bio.displayName || 'Chưa đặt tên'}</b>${block ? '  🔒 <b>ĐANG BỊ KHOÁ</b>' : ''}`,
    `📧 <code>${bio.email}</code>`,
    `📱 ${bio.phone ? `<code>${bio.phone}</code>` : '<i>chưa khai</i>'}`,
    `🎂 ${bio.birthYear ? `${bio.birthDay || '?'}/${bio.birthMonth || '?'}/${bio.birthYear}` : '<i>chưa khai</i>'}`
      + (age !== null ? ` · <b>${age} tuổi</b>${isMinorAge(age) ? (age < GUARDIAN_CONSENT_AGE ? ' ⚠️ cần người giám hộ' : ' ⚠️ vị thành niên') : ''}` : ''),
    `🔗 /bio/${bio.slug || 'demo'}`,
    '',
    `💰 Số dư: <b>${fmt(bio.joyBalance)} JOY</b> · đơn vị <b>${bio.joyDenom || 'chưa chọn'}</b>`,
    `🛡️ Ví: <b>${bio.isJoyWalletFrozen ? '❄️ đang đóng băng' : 'hoạt động'}</b>`,
    `📊 Giao dịch: <b>${fmt(ledgerCount)}</b>`
      + (lastTx ? ` · gần nhất ${lastTx.amount > 0 ? '+' : ''}${fmt(lastTx.amount)} (${new Date(lastTx.createdAt).toLocaleDateString('vi-VN')})` : ''),
    '',
    `🪪 Kiểm tra thông tin: <b>${ic.failStreak ? `đã trượt ${ic.failStreak} đợt` : due ? 'đang chờ trả lời' : 'bình thường'}</b>`
      + (ic.nextDueAt ? ` · đợt kế ${new Date(ic.nextDueAt).toLocaleDateString('vi-VN')}` : '')
      + (ic.lastVerifiedAt ? `\n     ✓ xác minh gần nhất ${new Date(ic.lastVerifiedAt).toLocaleDateString('vi-VN')} (${ic.lastField || '—'})` : '\n     <i>chưa từng xác minh</i>'),
    `🎓 EDU: <b>${bio.isEduVerified ? 'đã xác minh' : 'chưa'}</b>`,
    `⏳ Hạn dùng: <b>${hsd ? hsd.toLocaleDateString('vi-VN') : '—'}</b>${hsdLeft !== null ? ` (còn ${hsdLeft} ngày)` : ''}`,
    `🎫 Ticket chờ: <b>${tickets}</b>`,
    `🔗 Mã giới thiệu: <code>${bio.referralCode || '—'}</code>`,
    `📅 Tham gia: ${new Date(bio.createdAt || Date.now()).toLocaleDateString('vi-VN')}`,
  ].join('\n');

  return {
    text,
    markup: {
      inline_keyboard: [
        [
          { text: '🎁 Cộng / trừ JOY', callback_data: `k:joy:${id}` },
          { text: bio.isJoyWalletFrozen ? '✅ Mở ví' : '❄️ Khoá ví', callback_data: `k:freeze:${id}` },
        ],
        [
          { text: '📜 Lịch sử JOY', callback_data: `k:hist:${id}` },
          { text: '🎫 Ticket', callback_data: `k:tickets:${id}` },
        ],
        [
          { text: '🪪 Bắt kiểm tra ngay', callback_data: `k:check:${id}` },
          { text: '🚪 Đăng xuất', callback_data: `k:logout:${id}` },
        ],
        [
          { text: '✉️ Gửi email', callback_data: `k:mail:${id}` },
          { text: '⏳ Gia hạn 30 ngày', callback_data: `k:extend:${id}` },
        ],
        block
          ? [{ text: '🔓 Gỡ khoá tài khoản', callback_data: `k:unlock:${id}` }]
          : [{ text: '🎓 ' + (bio.isEduVerified ? 'Gỡ xác minh EDU' : 'Xác minh EDU'), callback_data: `k:edu:${id}` }],
        [
          { text: '🔄 Làm mới', callback_data: `k:m:${id}` },
          { text: '🔍 Tra người khác', callback_data: 'k:find' },
          { text: '⬅️ Bảng chính', callback_data: 'k:home' },
        ],
      ],
    },
  };
}

async function findBlock(email) {
  const { findActiveSecurityBlock } = await import('./securityEnforcement.js');
  return findActiveSecurityBlock({ email }).catch(() => null);
}

function joyScreen(bio) {
  const id = shortId(bio);
  const amounts = [500, 1000, 5000];
  return {
    text: `🎁 <b>Điều chỉnh JOY</b>\n👤 ${bio.displayName || bio.email}\n💰 Hiện có: <b>${fmt(bio.joyBalance)} JOY</b>\n\n<i>Chọn mức, hoặc nhập số tuỳ ý.</i>`,
    markup: {
      inline_keyboard: [
        amounts.map((a) => ({ text: `+${fmt(a)}`, callback_data: `k:joyx:${id}:${a}` })),
        amounts.map((a) => ({ text: `−${fmt(a)}`, callback_data: `k:joyx:${id}:-${a}` })),
        [{ text: '✍️ Nhập số khác', callback_data: `k:joyask:${id}` }],
        [{ text: '⬅️ Về thẻ thành viên', callback_data: `k:m:${id}` }],
      ],
    },
  };
}

// ─── BỘ ĐỊNH TUYẾN NÚT ───────────────────────────────────────────────────────
/**
 * Trả về true nếu đã xử lý. Mọi màn hình đều SỬA tin đang mở để giữ một khung
 * chat sạch; riêng thao tác cần ô nhập thì phải gửi tin mới (ForceReply không
 * gắn được vào tin cũ).
 */
export async function handleConsoleCallback({ chatId, messageId, data }) {
  if (!data.startsWith('k:')) return false;
  const [, action, arg, extra] = data.split(':');
  const show = (screen) => editTelegramMessage(chatId, messageId, screen.text, screen.markup);
  const byId = (id) => Bio.findById(id);

  switch (action) {
    case 'home':
      await show(await homeScreen());
      return true;

    case 'find':
      setPendingInput(chatId, { kind: 'find' });
      await askTelegramInput(
        chatId,
        '🔍 <b>Tra cứu thành viên</b>\nGõ email, tên, slug hoặc số điện thoại — gì cũng được:',
        'vd: an@gmail.com hoặc 0912…',
      );
      return true;

    case 'latest':
      await show(listScreen('🆕 <b>5 người mới nhất</b>',
        await Bio.find().sort({ createdAt: -1 }).limit(5).lean(), 'Chưa có ai.'));
      return true;

    case 'rich':
      await show(listScreen('💰 <b>5 người nhiều JOY nhất</b>',
        await Bio.find().sort({ joyBalance: -1 }).limit(5).lean(), 'Chưa có ai.'));
      return true;

    case 'due':
      await show(listScreen('🪪 <b>Đang chờ kiểm tra thông tin</b>',
        await Bio.find({ 'identityCheck.nextDueAt': { $lte: new Date() } }).limit(8).lean(),
        'Không ai đang chờ — mọi người đều đã xác minh đúng hạn.'));
      return true;

    case 'frozen':
      await show(listScreen('❄️ <b>Ví đang đóng băng</b>',
        await Bio.find({ isJoyWalletFrozen: true }).limit(8).lean(), 'Không có ví nào bị đóng băng.'));
      return true;

    case 'log': {
      const logs = await AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).lean();
      const body = logs.length
        ? logs.map((l) => `• <b>${l.action}</b> — ${l.targetEmail || 'hệ thống'}\n  <i>${l.adminUsername} · ${new Date(l.createdAt).toLocaleString('vi-VN')}</i>`).join('\n')
        : '<i>Chưa có hoạt động nào.</i>';
      await show({ text: `📋 <b>8 việc gần nhất</b>\n\n${body}`, markup: backOnly() });
      return true;
    }

    case 'maint':
      global.IS_SYSTEM_MAINTENANCE = !global.IS_SYSTEM_MAINTENANCE;
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN',
        adminUsername: 'SuperAdmin_Telegram',
        action: global.IS_SYSTEM_MAINTENANCE ? 'enable_maintenance_mode' : 'disable_maintenance_mode',
      });
      await show(await homeScreen());
      return true;

    case 'm': {
      const bio = await byId(arg);
      await show(bio ? await memberScreen(bio) : { text: '❌ Không còn hồ sơ này.', markup: backOnly() });
      return true;
    }

    case 'joy': {
      const bio = await byId(arg);
      await show(bio ? joyScreen(bio) : { text: '❌ Không còn hồ sơ này.', markup: backOnly() });
      return true;
    }

    case 'joyask':
      setPendingInput(chatId, { kind: 'joy', id: arg });
      await askTelegramInput(
        chatId,
        '✍️ <b>Nhập số JOY</b>\nSố dương là cộng, thêm dấu trừ là trừ (vd: <code>2500</code> hoặc <code>-800</code>):',
        'vd: 2500',
      );
      return true;

    case 'joyx': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      const amount = Number(extra);
      const updated = await applyJoy(bio, amount, 'Điều chỉnh bằng nút trên Telegram');
      await show(await memberScreen(updated));
      return true;
    }

    case 'freeze': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      bio.isJoyWalletFrozen = !bio.isJoyWalletFrozen;
      await bio.save();
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN',
        adminUsername: 'SuperAdmin_Telegram',
        action: bio.isJoyWalletFrozen ? 'freeze_wallet' : 'unfreeze_wallet',
        targetEmail: bio.email,
      });
      await show(await memberScreen(bio));
      return true;
    }

    case 'logout': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      await revokeMemberSession(bio, 'Boss (qua Telegram)');
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN',
        adminUsername: 'SuperAdmin_Telegram',
        action: 'telegram_revoke_session',
        targetEmail: bio.email,
      });
      await show(await memberScreen(bio));
      return true;
    }

    case 'check': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      // Hẹn tới hạn ngay: lần mở app kế tiếp là người này phải trả lời.
      bio.identityCheck = { ...(bio.identityCheck?.toObject?.() || {}), nextDueAt: new Date(), attempts: 0, pendingField: '' };
      await bio.save();
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN',
        adminUsername: 'SuperAdmin_Telegram',
        action: 'identity_check_forced',
        targetEmail: bio.email,
      });
      await show(await memberScreen(bio));
      return true;
    }

    case 'hist': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      const rows = await JoyLedger.find({ email: bio.email }).sort({ createdAt: -1 }).limit(10).lean();
      const body = rows.length
        ? rows.map((r) => `${r.amount > 0 ? '🟢 +' : '🔴 '}${fmt(r.amount)} · <b>${fmt(r.balanceAfter)}</b>\n  <i>${r.source} · ${new Date(r.createdAt).toLocaleString('vi-VN')}</i>${r.description ? `\n  ${String(r.description).slice(0, 60)}` : ''}`).join('\n')
        : '<i>Chưa có giao dịch nào.</i>';
      await show({
        text: `📜 <b>10 giao dịch gần nhất</b>\n👤 ${bio.displayName || bio.email}\n\n${body}`,
        markup: { inline_keyboard: [[{ text: '⬅️ Về thẻ thành viên', callback_data: `k:m:${arg}` }]] },
      });
      return true;
    }

    case 'tickets': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      const rows = await SupportTicket.find({ email: bio.email }).sort({ createdAt: -1 }).limit(5).lean();
      const body = rows.length
        ? rows.map((tk) => `• <b>${tk.status || 'pending'}</b> · ${new Date(tk.createdAt).toLocaleDateString('vi-VN')}\n  ${String(tk.message || tk.subject || '').slice(0, 90)}`).join('\n')
        : '<i>Người này chưa gửi ticket nào.</i>';
      await show({
        text: `🎫 <b>Ticket gần nhất</b>\n👤 ${bio.displayName || bio.email}\n\n${body}`,
        markup: { inline_keyboard: [[{ text: '⬅️ Về thẻ thành viên', callback_data: `k:m:${arg}` }]] },
      });
      return true;
    }

    case 'mail':
      setPendingInput(chatId, { kind: 'mail', id: arg });
      await askTelegramInput(
        chatId,
        '✉️ <b>Gửi email cho thành viên</b>\nGõ nội dung — dòng đầu là tiêu đề, phần còn lại là nội dung thư:',
        'vd: Nhắc gia hạn…',
      );
      return true;

    case 'extend': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      // Gia hạn từ mốc CÒN HIỆU LỰC: hạn đã qua thì tính từ hôm nay, chưa qua
      // thì cộng dồn — cộng vào một mốc đã hết hạn là biếu không 30 ngày âm.
      const base = bio.expiresAt && new Date(bio.expiresAt) > new Date() ? new Date(bio.expiresAt) : new Date();
      bio.expiresAt = new Date(base.getTime() + 30 * 86400000);
      await bio.save();
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN', adminUsername: 'SuperAdmin_Telegram',
        action: 'extend_expiry', targetEmail: bio.email,
        details: { days: 30, newExpiry: bio.expiresAt },
      });
      await show(await memberScreen(bio));
      return true;
    }

    case 'edu': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      bio.isEduVerified = !bio.isEduVerified;
      await bio.save();
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN', adminUsername: 'SuperAdmin_Telegram',
        action: bio.isEduVerified ? 'verify_edu' : 'unverify_edu', targetEmail: bio.email,
      });
      await show(await memberScreen(bio));
      return true;
    }

    case 'unlock': {
      const bio = await byId(arg);
      if (!bio) { await show({ text: '❌ Không còn hồ sơ này.', markup: backOnly() }); return true; }
      const { findActiveSecurityBlock, revokeSecurityBlock } = await import('./securityEnforcement.js');
      for (const subject of [{ email: bio.email }, ...(bio.phone ? [{ phone: bio.phone }] : [])]) {
        const blk = await findActiveSecurityBlock(subject);
        if (blk?._id) await revokeSecurityBlock(blk._id);
      }
      // Gỡ khoá mà để nguyên bộ đếm sai thì lần hỏi kế tiếp chỉ cần sai MỘT lần
      // là khoá lại ngay.
      bio.identityCheck = { ...(bio.identityCheck?.toObject?.() || {}), attempts: 0, failStreak: 0, pendingField: '' };
      await bio.save();
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN', adminUsername: 'SuperAdmin_Telegram',
        action: 'identity_check_unblocked', targetEmail: bio.email,
      });
      await show(await memberScreen(bio));
      return true;
    }

    default:
      return false;
  }
}

async function applyJoy(bio, amount, note) {
  if (!Number.isFinite(amount) || amount === 0) return bio;
  const updated = await awardJoy(bio.email, amount, 'admin_adjustment', note, { bioDoc: bio });
  await AdminAuditLog.create({
    adminId: 'TELEGRAM_BOT_ADMIN',
    adminUsername: 'SuperAdmin_Telegram',
    action: 'telegram_joy_transfer',
    targetEmail: bio.email,
    details: { amount, newBalance: updated.joyBalance },
  });
  return updated;
}

/**
 * Boss vừa gõ vào ô nhập. Trả true nếu chữ đó là câu trả lời cho một nút đã bấm
 * — khi đó KHÔNG để nó rơi xuống bộ lệnh gõ tay hay AI bên dưới.
 */
export async function handlePendingInput(chatId, text) {
  const pending = takePendingInput(chatId);
  if (!pending) return false;

  if (pending.kind === 'find') {
    const screen = await searchScreen(text);
    await sendTelegramMessage(chatId, screen.text, 'HTML', screen.markup);
    return true;
  }

  if (pending.kind === 'joy') {
    const bio = await Bio.findById(pending.id);
    if (!bio) {
      await sendTelegramMessage(chatId, '❌ Không còn hồ sơ này.', 'HTML', backOnly());
      return true;
    }
    const amount = Number(String(text).replace(/[^\d-]/g, ''));
    if (!Number.isFinite(amount) || amount === 0) {
      await sendTelegramMessage(chatId, '❌ Không đọc được số. Thử lại: <code>2500</code> hoặc <code>-800</code>.', 'HTML',
        { inline_keyboard: [[{ text: '↩️ Nhập lại', callback_data: `k:joyask:${pending.id}` }]] });
      return true;
    }
    const updated = await applyJoy(bio, amount, `Nhập tay trên Telegram: ${amount}`);
    const screen = await memberScreen(updated);
    await sendTelegramMessage(chatId, `✅ Đã ${amount > 0 ? 'cộng' : 'trừ'} <b>${fmt(Math.abs(amount))} JOY</b>.\n\n${screen.text}`, 'HTML', screen.markup);
    return true;
  }

  if (pending.kind === 'mail') {
    const bio = await Bio.findById(pending.id);
    if (!bio) {
      await sendTelegramMessage(chatId, '❌ Không còn hồ sơ này.', 'HTML', backOnly());
      return true;
    }
    const [subject, ...rest] = String(text).split('\n');
    const body = rest.join('\n').trim() || subject;
    const { sendCustomEmail } = await import('./emailService.js');
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">`
      + `<p>Chào ${bio.displayName || 'bạn'},</p>`
      + `<p style="white-space:pre-wrap;">${body.replace(/</g, '&lt;')}</p>`
      + `<p style="color:#64748b;font-size:12px;">— Hugo Studio</p></div>`;
    const sent = await sendCustomEmail(bio.email, subject.slice(0, 120), html).catch((e) => ({ error: e.message }));
    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN', adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_send_email', targetEmail: bio.email, details: { subject: subject.slice(0, 120) },
    });
    const screen = await memberScreen(bio);
    await sendTelegramMessage(
      chatId,
      `${sent?.error ? `⚠️ Gửi thất bại: ${sent.error}` : '✅ Đã gửi email'} tới <code>${bio.email}</code>\n\n${screen.text}`,
      'HTML', screen.markup,
    );
    return true;
  }

  return false;
}

export default { homeScreen, searchScreen, memberScreen, handleConsoleCallback, handlePendingInput };
