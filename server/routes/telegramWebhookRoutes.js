import express from 'express';
import Bio from '../models/Bio.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import SupportTicket from '../models/SupportTicket.js';
import { awardJoy } from '../utils/joyService.js';
import { sendTelegramAlert, sendTelegramMessage, editTelegramMessage, fetchTelegramFile } from '../services/telegramService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { JWT_SECRET } from '../utils/secrets.js';
import {
  DENOM_PATTERN, findCommand, helpScreen,
  stashCommand, takeCommand, inverseCommand, typedConfirmFor,
} from '../services/telegramCommands.js';
import TelegramState from '../models/TelegramState.js';
import crypto from 'crypto';

const router = express.Router();

// Trí nhớ hội thoại của quản gia: 8 lượt gần nhất mỗi khung chat, nằm dưới
// Mongo với TTL 24 giờ. Để trong RAM thì mỗi lần Render restart là quản gia
// quên sạch chuyện đang nói dở giữa chừng — Boss hỏi "còn cái kia thì sao?" và
// nhận về một người lạ.
const MAX_TURNS = 8;
const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;

async function recentTurns(chatId) {
  const doc = await TelegramState.findOne({ key: `memory:${chatId}` }).lean().catch(() => null);
  return doc?.data?.turns || [];
}

async function rememberTurn(chatId, userText, botText) {
  const turns = [
    ...(await recentTurns(chatId)),
    { role: 'user', parts: [{ text: userText }] },
    { role: 'model', parts: [{ text: String(botText).replace(/<[^>]+>/g, '') }] },
  ].slice(-MAX_TURNS * 2);
  await TelegramState.findOneAndUpdate(
    { key: `memory:${chatId}` },
    { $set: { kind: 'memory', data: { turns }, expiresAt: new Date(Date.now() + MEMORY_TTL_MS) } },
    { upsert: true },
  ).catch(() => {});
}

// Ảnh chụp trạng thái trước khi đổi — không có nó thì "Đổi tên" không hoàn tác
// được, vì chẳng ai biết tên cũ là gì.
async function snapshotFor(command) {
  const email = String(command || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  if (!email) return {};
  const bio = await Bio.findOne({ email: email.toLowerCase() }, 'displayName slug').lean();
  return { displayName: bio?.displayName || '', slug: bio?.slug || '' };
}

// Thẻ xác nhận cho Boss thấy MÌNH SẮP ĐỘNG VÀO AI, trước khi bấm. Một câu AI
// hiểu nhầm thì hiện ra ở đây — đúng người hay nhầm người, nhìn là biết.
async function previewTarget(command) {
  const email = String(command || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  if (!email) return '';
  const bio = await Bio.findOne({ email: email.toLowerCase() }, 'displayName joyBalance isJoyWalletFrozen status').lean();
  if (!bio) return `\n\n⚠️ <b>Không tìm thấy tài khoản</b> <code>${email}</code> — em sẽ không làm gì cả.`;
  return `\n\n🎯 <b>Đối tượng:</b> ${bio.displayName || 'chưa đặt tên'} (<code>${email}</code>)`
    + `\n   Ví <b>${Number(bio.joyBalance || 0).toLocaleString('vi-VN')} JOY</b>`
    + ` · ${bio.isJoyWalletFrozen ? '❄️ ví đang khoá' : '✅ ví đang mở'}`
    + ` · ${bio.status === 'suspended' ? '🔴 tài khoản đang đình chỉ' : '🟢 tài khoản hoạt động'}`;
}

// Chạy một lệnh Boss đã duyệt, rồi mời hoàn tác trong 5 phút.
//
// Nghịch đảo phải tính TRƯỚC khi chạy (tên cũ, slug cũ mất ngay sau lệnh đổi).
// Việc nào không đảo ngược được — gửi thông báo, thu hồi phiên — thì không hiện
// nút: thà không có nút còn hơn có nút bấm vào chẳng trả lại được gì.
// ponytail: hoàn tác gắn ở đường lệnh do AI dịch, vì đó là chỗ có thể hiểu sai
// ý Boss. Lệnh Boss tự gõ là đúng chữ Boss viết, chưa cần tới.
async function runApprovedCommand(chatId, command) {
  const before = await snapshotFor(command);
  await AdminAuditLog.create({
    adminId: 'BOSS_TELEGRAM',
    adminUsername: 'Boss (duyệt lệnh AI)',
    action: 'telegram_ai_command_approved',
    details: { command },
  }).catch(() => {});

  await processTelegramUpdate({ message: { chat: { id: chatId }, text: command } }, { allowAi: false });

  const inverse = inverseCommand(command, before);
  if (!inverse) return;
  const undoId = await stashCommand(inverse, 'undo', 5 * 60 * 1000);
  await sendTelegramMessage(chatId, '↩️ <i>Lỡ tay? Bấm để trả lại như cũ (5 phút).</i>', 'HTML', {
    inline_keyboard: [[{ text: '↩️ Hoàn tác', callback_data: `cb_undo:${undoId}` }]],
  });
}

/**
 * Tạo thẻ báo cáo chi tiết thành viên cho AI Butler kèm nút tương tác 1-click
 */
async function buildButlerMemberReport(bioDoc) {
  const bio = typeof bioDoc.toObject === 'function' ? bioDoc.toObject() : bioDoc;
  const customDenom = bio.joyDenom || 'JOY';
  const rawJoy = Number(bio.joyBalance || 0);

  let formattedCustom = `${rawJoy.toLocaleString('vi-VN')} JOY`;
  try {
    const { toDenom } = await import('../../shared/joyCurrency.js');
    const customAmountObj = toDenom(rawJoy, customDenom);
    formattedCustom = `${customAmountObj.amount.toLocaleString('vi-VN')} ${customAmountObj.code}`;
  } catch {}

  const isFrozen = bio.isJoyWalletFrozen ? '❄️ <b>Đóng bằng (Frozen)</b>' : '✅ <b>Hoạt động (Active)</b>';
  const isEdu = bio.isEduVerified ? '🎓 <b>Đã xác minh Sinh viên</b>' : '❌ <b>Chưa xác minh</b>';
  const accStatus = bio.status === 'suspended' ? '🔴 <b>Tạm đình chỉ (Suspended)</b>' : '🟢 <b>Hoạt động (Active)</b>';
  const activeSessions = bio.securitySessions?.length || 0;
  const joinDate = new Date(bio.createdAt || Date.now()).toLocaleDateString('vi-VN');

  const reportText = `
👑 <b>[BÁO CÁO THÀNH VIÊN TỪ QUẢN GIA HUGO]</b>

👤 <b>Thành viên:</b> <b>${bio.displayName || 'Chưa đặt tên'}</b>
📧 <b>Email:</b> <code>${bio.email}</code>
🔗 <b>Trang Bio:</b> <code>/bio/${bio.slug || 'demo'}</code>

💰 <b>Số dư JOY gốc:</b> <b>${rawJoy.toLocaleString('vi-VN')} JOY</b>
🪙 <b>Đơn vị hiển thị:</b> <b>${formattedCustom}</b>

🛡️ <b>Trạng thái ví:</b> ${isFrozen}
🎓 <b>Trạng thái Edu:</b> ${isEdu}
🚪 <b>Trạng thái tài khoản:</b> ${accStatus}
📱 <b>Phiên kết nối:</b> ${activeSessions} thiết bị tin cậy
📅 <b>Ngày gia nhập:</b> ${joinDate}
  `.trim();

  const inlineButtons = {
    inline_keyboard: [
      [
        { text: '🎁 +1,000 JOY', callback_data: `cb_award_1000:${bio.email}` },
        { text: bio.isJoyWalletFrozen ? '✅ Mở Khóa Ví' : '❄️ Khóa Ví', callback_data: bio.isJoyWalletFrozen ? `cb_unfreeze:${bio.email}` : `cb_freeze:${bio.email}` },
      ],
      [
        { text: bio.isEduVerified ? '🎓 Hủy Edu' : '🎓 Bật Edu', callback_data: `cb_toggle_edu:${bio.email}` },
        { text: '🔄 Cập nhật thẻ', callback_data: `cb_lookup:${bio.email}` },
      ]
    ]
  };

  return { text: reportText, markup: inlineButtons };
}

/**
 * Super-Admin Telegram Remote Control Engine & AI Butler Companion
 * Tiếp nhận lệnh NLU, trò chuyện AI Butler và Callback Query từ Telegram.
 */
export async function processTelegramUpdate(update, { allowAi = true } = {}) {
  if (!update) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const bossChatId = process.env.TELEGRAM_CHAT_ID;

  // Không có chat_id của Boss thì KHÔNG có ai để đối chiếu — trước đây nhánh
  // này lọt xuống dưới và nhận lệnh của bất kỳ ai nhắn cho bot.
  if (!bossChatId) {
    console.warn('⚠️ Bỏ qua lệnh Telegram: chưa đặt TELEGRAM_CHAT_ID nên không xác minh được người gửi.');
    return;
  }

  // ─── 1. XỬ LÝ CALLBACK QUERY (NÚT BẤM TƯƠNG TÁC 1-CLICK) ─────────────────────
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = String(cb.message?.chat?.id || '');
    const cbData = String(cb.data || '');
    const callbackQueryId = cb.id;

    if (chatId !== String(bossChatId)) return;

    // Answer callback query so Telegram UI removes spinner
    if (token) {
      fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text: 'Đã nhận lệnh thực thi!' }),
      }).catch(() => {});
    }

    // Bảng điều khiển bấm nút (k:*). Các cb_* cũ bên dưới vẫn sống: chúng nằm
    // trong những thẻ cảnh báo đã gửi từ trước, bấm lại phải còn tác dụng.
    const { handleConsoleCallback } = await import('../services/telegramConsole.js');
    if (await handleConsoleCallback({ chatId, messageId: cb.message?.message_id, data: cbData })) return;

    if (cbData.startsWith('cb_award_1000:')) {
      const targetEmail = cbData.replace('cb_award_1000:', '');
      const bio = await Bio.findOne({ email: targetEmail });
      if (bio) {
        await awardJoy(targetEmail, 1000, 'admin_telegram_button', 'Thưởng 1,000 JOY qua Telegram Button', { bioDoc: bio });
        const rpt = await buildButlerMemberReport(bio);
        await editTelegramMessage(chatId, cb.message?.message_id, `🎁 <b>ĐÃ THƯỞNG +1,000 JOY CHO MEMBER!</b>\n\n${rpt.text}`, rpt.markup);
      }
      return;
    }

    if (cbData === 'cb_run_cancel') {
      await editTelegramMessage(chatId, cb.message?.message_id, '✋ <b>Đã huỷ.</b> Em không làm gì cả ạ.');
      return;
    }

    if (cbData.startsWith('cb_run:')) {
      const command = await takeCommand(cbData.replace('cb_run:', ''));
      if (!command) {
        await editTelegramMessage(chatId, cb.message?.message_id, '⌛ <b>Lệnh đã hết hạn hoặc đã chạy rồi.</b> Boss nói lại giúp em ạ.');
        return;
      }
      // Mọi thứ AI đề xuất đều phải qua lại hàng rào một lần nữa ngay trước khi
      // chạy: mã trong callback_data là thứ đến từ ngoài, không tin sẵn được.
      if (!findCommand(command)) {
        await editTelegramMessage(chatId, cb.message?.message_id, '🚫 <b>Lệnh không hợp lệ,</b> em từ chối thực thi ạ.');
        return;
      }

      // Việc đóng cửa cả hệ thống thì một cú bấm nhầm là quá rẻ.
      const phrase = typedConfirmFor(command);
      if (phrase) {
        await TelegramState.findOneAndUpdate(
          { key: `typed:${chatId}` },
          { $set: { kind: 'pending', data: { command, phrase }, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } },
          { upsert: true },
        );
        await editTelegramMessage(chatId, cb.message?.message_id,
          `⚠️ <b>Việc này ảnh hưởng toàn hệ thống.</b>\n\nGõ đúng dòng dưới đây để xác nhận (5 phút):\n<code>${phrase}</code>`);
        return;
      }

      await editTelegramMessage(chatId, cb.message?.message_id, `✅ <b>Boss đã duyệt.</b> Đang chạy:\n<code>${command}</code>`);
      await runApprovedCommand(chatId, command);
      return;
    }

    if (cbData.startsWith('cb_undo:')) {
      const inverse = await takeCommand(cbData.replace('cb_undo:', ''), 'undo');
      if (!inverse) {
        await editTelegramMessage(chatId, cb.message?.message_id, '⌛ <b>Quá hạn hoàn tác</b> (5 phút) hoặc đã hoàn tác rồi ạ.');
        return;
      }
      await editTelegramMessage(chatId, cb.message?.message_id, `↩️ <b>Đang hoàn tác:</b>\n<code>${inverse}</code>`);
      await AdminAuditLog.create({
        adminId: 'BOSS_TELEGRAM',
        adminUsername: 'Boss (hoàn tác)',
        action: 'telegram_command_undo',
        details: { command: inverse },
      }).catch(() => {});
      await processTelegramUpdate(
        { message: { chat: { id: chatId }, text: inverse } },
        { allowAi: false },
      );
      return;
    }

    if (cbData.startsWith('cb_freeze:')) {
      const targetEmail = cbData.replace('cb_freeze:', '');
      const bio = await Bio.findOne({ email: targetEmail });
      if (bio) {
        bio.isJoyWalletFrozen = true;
        await bio.save();
        const rpt = await buildButlerMemberReport(bio);
        await editTelegramMessage(chatId, cb.message?.message_id, `❄️ <b>ĐÃ ĐÓNG BẰNG VÍ JOY CỦA MEMBER!</b>\n\n${rpt.text}`, rpt.markup);
      }
      return;
    }

    if (cbData.startsWith('cb_unfreeze:')) {
      const targetEmail = cbData.replace('cb_unfreeze:', '');
      const bio = await Bio.findOne({ email: targetEmail });
      if (bio) {
        bio.isJoyWalletFrozen = false;
        await bio.save();
        const rpt = await buildButlerMemberReport(bio);
        await editTelegramMessage(chatId, cb.message?.message_id, `✅ <b>ĐÃ MỞ KHÓA VÍ JOY CỦA MEMBER!</b>\n\n${rpt.text}`, rpt.markup);
      }
      return;
    }

    if (cbData.startsWith('cb_toggle_edu:')) {
      const targetEmail = cbData.replace('cb_toggle_edu:', '');
      const bio = await Bio.findOne({ email: targetEmail });
      if (bio) {
        bio.isEduVerified = !bio.isEduVerified;
        await bio.save();
        const rpt = await buildButlerMemberReport(bio);
        await editTelegramMessage(chatId, cb.message?.message_id, `🎓 <b>ĐÃ CẬP NHẬT TRẠNG THÁI EDU CỦA MEMBER!</b>\n\n${rpt.text}`, rpt.markup);
      }
      return;
    }

    if (cbData.startsWith('cb_lookup:')) {
      const targetEmail = cbData.replace('cb_lookup:', '');
      const bio = await Bio.findOne({ email: targetEmail });
      if (bio) {
        const rpt = await buildButlerMemberReport(bio);
        await editTelegramMessage(chatId, cb.message?.message_id, rpt.text, rpt.markup);
      }
      return;
    }

    // ─── Xử lý ca khoá do kiểm tra thông tin định kỳ ─────────────────────────
    // Tra email qua sổ kiểm toán: SecurityEvent chỉ lưu bản băm, còn nhét email
    // vào callback_data thì vượt giới hạn 64 byte của Telegram với địa chỉ dài.
    if (cbData.startsWith('cb_id_unlock:') || cbData.startsWith('cb_id_docs:')) {
      const caseId = cbData.split(':')[1];
      const entry = await AdminAuditLog.findOne({ action: 'identity_check_blocked', 'details.caseId': caseId });
      if (!entry) {
        await sendTelegramAlert(`❌ Không tìm thấy ca <code>${caseId}</code>.`);
        return;
      }
      const targetEmail = entry.targetEmail;
      const bio = await Bio.findOne({ email: targetEmail });

      if (cbData.startsWith('cb_id_unlock:')) {
        const { findActiveSecurityBlock, revokeSecurityBlock } = await import('../services/securityEnforcement.js');
        for (const subject of [{ email: targetEmail }, { phone: bio?.phone || '' }]) {
          const blk = subject.phone === '' ? null : await findActiveSecurityBlock(subject);
          if (blk?._id) await revokeSecurityBlock(blk._id);
        }
        if (bio) {
          // Gỡ khoá xong phải xoá luôn ngòi nổ: còn attempts cũ thì lần hỏi kế
          // tiếp chỉ cần sai MỘT lần là khoá lại ngay.
          const IC = await import('../utils/identityCheck.js');
          bio.identityCheck = { ...(bio.identityCheck?.toObject?.() || {}), attempts: 0, failStreak: 0, pendingField: '' };
          IC.scheduleNext(bio, { advance: false });
          await bio.save();
        }
        await AdminAuditLog.create({
          adminId: 'TELEGRAM_BOT_ADMIN',
          adminUsername: 'SuperAdmin_Telegram',
          action: 'identity_check_unblocked',
          targetEmail,
          details: { caseId },
        });
        await sendTelegramAlert(`🔓 <b>Đã gỡ khoá:</b> <code>${targetEmail}</code>\nHẹn kiểm tra lại sau 7 ngày, bộ đếm sai đã xoá.`);
        return;
      }

      // Đòi giấy tờ: gửi thư cho chính thành viên, Boss không phải tự soạn.
      const { sendCustomEmail } = await import('../services/emailService.js');
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
          <h2 style="margin-top:0;">Yêu cầu xác minh thông tin tài khoản</h2>
          <p>Tài khoản <strong>${targetEmail}</strong> đang tạm khoá vì thông tin khai báo không khớp trong đợt kiểm tra định kỳ.</p>
          <p>Để mở khoá, vui lòng trả lời email này kèm:</p>
          <ul>
            <li>Ảnh giấy tờ tuỳ thân có ngày sinh (che số định danh, chỉ để lộ họ tên và ngày sinh);</li>
            <li>Số điện thoại đang dùng, và lý do thông tin trước đó không đúng.</li>
          </ul>
          <p style="color:#475569;font-size:13px;">Mã hồ sơ: <code>${caseId}</code>. Chúng tôi chỉ dùng giấy tờ để đối chiếu và xoá sau khi xác minh xong.</p>
        </div>`;
      await sendCustomEmail(targetEmail, 'Yêu cầu xác minh thông tin tài khoản Hugo Studio', html);
      await AdminAuditLog.create({
        adminId: 'TELEGRAM_BOT_ADMIN',
        adminUsername: 'SuperAdmin_Telegram',
        action: 'identity_check_docs_requested',
        targetEmail,
        details: { caseId },
      });
      await sendTelegramAlert(`📄 <b>Đã gửi thư đòi giấy tờ tới:</b> <code>${targetEmail}</code>\nTài khoản vẫn khoá tới khi Boss bấm "Gỡ khoá".`);
      return;
    }

    if (cbData.startsWith('cb_unblock_ip:')) {
      const ref = cbData.replace('cb_unblock_ip:', '');
      const SecurityBlock = (await import('../models/SecurityBlock.js')).default;
      // Thẻ cũ gửi mã băm, thẻ mới gửi Case ID — nhận cả hai để những thẻ đã
      // nằm sẵn trong khung chat vẫn bấm được.
      const filter = ref.startsWith('SEC-') ? { subjectType: 'ip', lastCaseId: ref } : { actorKey: `ip:${ref}` };
      // Gỡ ở tường lửa Cloudflare TRƯỚC khi xoá bản ghi — sau khi xoá là mất
      // luôn edgeIp/edgeRuleId, không còn gì để gỡ ngoài edge.
      const { unblockIpAtEdge } = await import('../services/cloudflareFirewall.js');
      let edgeMsg = '';
      for (const b of await SecurityBlock.find(filter).lean()) {
        if (b.edgeIp || b.edgeRuleId) {
          const r = await unblockIpAtEdge({ ip: b.edgeIp, ruleId: b.edgeRuleId });
          if (r.edge) edgeMsg = '\n🌐 Đã gỡ khỏi tường lửa Cloudflare.';
        }
      }
      const res = await SecurityBlock.deleteMany(filter);
      await sendTelegramAlert(`✅ <b>ĐÃ GIẢI KHÓA IP THÀNH CÔNG!</b>\n📌 Đã gỡ bỏ ${res.deletedCount || 0} bản ghi khóa IP cho Boss.${edgeMsg}`);
      return;
    }

    if (cbData.startsWith('cb_hold_ok:') || cbData.startsWith('cb_hold_no:')) {
      const approve = cbData.startsWith('cb_hold_ok:');
      const txCode = cbData.replace(/^cb_hold_(ok|no):/, '');
      const PendingTransfer = (await import('../models/PendingTransfer.js')).default;
      const pending = await PendingTransfer.findOne({ txCode });
      if (!pending || pending.status !== 'pending') {
        await sendTelegramAlert('ℹ️ <b>Giao dịch này đã được xử lý hoặc hết hạn.</b>');
        return;
      }
      const { notifyMember } = await import('../utils/notifyMember.js');
      if (approve) {
        try {
          const { executeHeldTransfer } = await import('../services/transferHold.js');
          await executeHeldTransfer(pending);
          pending.status = 'approved';
          await sendTelegramAlert(`✅ <b>ĐÃ DUYỆT & CHUYỂN:</b> ${pending.numAmount.toLocaleString('vi-VN')} JOY\n<code>${pending.fromEmail}</code> → <code>${pending.toEmail}</code>`);
        } catch (e) {
          await sendTelegramAlert(`❌ <b>Không chuyển được:</b> ${e.message}\nMã: <code>${txCode}</code>`);
          return;
        }
      } else {
        pending.status = 'rejected';
        await notifyMember({
          email: pending.fromEmail, type: 'warning', category: 'joy',
          key: 'source.transfer_rejected', actionUrl: '/member/account', push: true,
          refCode: pending.txCode, counterparty: pending.toName,
        }).catch(() => {});
        await sendTelegramAlert(`🚫 <b>ĐÃ TỪ CHỐI giao dịch:</b> <code>${txCode}</code> (tiền chưa rời ví người gửi)`);
      }
      pending.decidedBy = 'Boss_Telegram';
      pending.decidedAt = new Date();
      await pending.save();
      await AdminAuditLog.create({
        adminId: 'BOSS_TELEGRAM', adminUsername: 'Boss (rà soát giao dịch)',
        action: approve ? 'transfer_hold_approved' : 'transfer_hold_rejected',
        targetEmail: pending.fromEmail, details: { txCode, amount: pending.numAmount },
      }).catch(() => {});
      return;
    }

    if (cbData.startsWith('cb_appeal_ok:') || cbData.startsWith('cb_appeal_no:')) {
      const approve = cbData.startsWith('cb_appeal_ok:');
      const id = cbData.replace(/^cb_appeal_(ok|no):/, '');
      const SecurityAppeal = (await import('../models/SecurityAppeal.js')).default;
      const appeal = await SecurityAppeal.findById(id);
      if (!appeal || appeal.status !== 'pending') {
        await sendTelegramAlert('ℹ️ <b>Kháng nghị này đã được xử lý hoặc hết hạn.</b>');
        return;
      }
      appeal.status = approve ? 'approved' : 'rejected';
      appeal.decidedBy = 'Boss_Telegram';
      appeal.decidedAt = new Date();
      await appeal.save();

      if (approve) {
        // Gỡ mọi lệnh khoá đang treo trên email này (và IP/edge kèm theo).
        const SecurityBlock = (await import('../models/SecurityBlock.js')).default;
        const { securityHash } = await import('../services/securityEnforcement.js');
        const { unblockIpAtEdge } = await import('../services/cloudflareFirewall.js');
        const emailKey = `email:${securityHash('email', appeal.email)}`;
        for (const b of await SecurityBlock.find({ actorKey: emailKey }).lean()) {
          if (b.edgeIp || b.edgeRuleId) await unblockIpAtEdge({ ip: b.edgeIp, ruleId: b.edgeRuleId });
        }
        await SecurityBlock.deleteMany({ actorKey: emailKey });
      }

      // Dọn ảnh nhạy cảm khỏi Cloudinary ngay khi có quyết định — không giữ
      // selfie của người ta lâu hơn mức cần để xét duyệt.
      if (appeal.imageUrl) {
        const { deleteAvatar } = await import('../utils/cloudinary.js');
        await deleteAvatar(appeal.imageUrl).catch(() => {});
      }

      await AdminAuditLog.create({
        adminId: 'BOSS_TELEGRAM',
        adminUsername: 'Boss (xét kháng nghị)',
        action: approve ? 'appeal_approved' : 'appeal_rejected',
        targetEmail: appeal.email,
        details: { caseId: appeal.caseId },
      }).catch(() => {});

      await sendTelegramAlert(approve
        ? `✅ <b>ĐÃ MỞ KHOÁ theo kháng nghị:</b> <code>${appeal.email}</code>`
        : `🚫 <b>ĐÃ TỪ CHỐI kháng nghị:</b> <code>${appeal.email}</code> (tài khoản vẫn khoá)`);
      return;
    }

    if (cbData.startsWith('cb_sec_approve:')) {
      const caseId = cbData.replace('cb_sec_approve:', '');
      const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
      const mod = await SecurityModeration.findOne({ caseId });
      if (!mod) {
        await sendTelegramAlert(`⚠️ <b>Không tìm thấy yêu cầu duyệt:</b> <code>${caseId}</code>`);
        return;
      }
      if (mod.status !== 'pending') {
        await sendTelegramAlert(`ℹ️ <b>Yêu cầu này đã được xử lý từ trước:</b> Trạng thái <code>${mod.status}</code>`);
        return;
      }

      const { applyActorBlock } = await import('../services/securityEnforcement.js');
      // Nút ghi "24h" thì phải khoá đúng 24 giờ, và KHÔNG được đếm vào bậc
      // thang dẫn tới khoá vĩnh viễn — phạt nguội không phải bản án.
      await applyActorBlock({
        ip: mod.ip, email: mod.email, phone: mod.phone,
        caseId: mod.caseId, reasonCode: mod.category,
        durationMs: 24 * 60 * 60 * 1000,
        escalate: false,
      });
      mod.status = 'approved';
      mod.decidedBy = 'Boss_Telegram';
      mod.decidedAt = new Date();
      await mod.save();

      await sendTelegramAlert(`🚫 <b>BOT SECURITY ĐÃ THỰC THI KHÓA 24H!</b>\n📌 Đối tượng: <code>${mod.email || mod.ip}</code>\n⚠️ Lý do: <code>${mod.category} (${mod.ruleId})</code>`);
      return;
    }

    if (cbData.startsWith('cb_sec_dismiss:')) {
      const caseId = cbData.replace('cb_sec_dismiss:', '');
      const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
      const mod = await SecurityModeration.findOne({ caseId });
      if (mod) {
        mod.status = 'dismissed';
        mod.decidedBy = 'Boss_Telegram';
        mod.decidedAt = new Date();
        await mod.save();
      }
      await sendTelegramAlert(`🟢 <b>BOT SECURITY ĐÃ BỎ QUA & CHO PHÉP TRUY CẬP!</b>\n📌 Case ID: <code>${caseId}</code>`);
      return;
    }
  }

  // ─── 2. XỬ LÝ TIN NHẮN VĂN BẢN (NLU COMMANDS) ────────────────────────────────
  if (!update.message) return;

  const { message } = update;
  const chatId = String(message.chat?.id || '');
  const text = String(message.text || '').trim();

  if (chatId !== String(bossChatId)) {
    console.warn(`⚠️ Warning: Unauthorized Telegram command from chat_id: ${chatId}`);
    return;
  }

  // ─── BOSS GỬI ẢNH ──────────────────────────────────────────────────────────
  // Chụp màn hình lỗi rồi hỏi thẳng, không phải gõ lại nội dung lỗi bằng tay.
  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1];
    const file = await fetchTelegramFile(largest.file_id);
    if (!file) {
      await sendTelegramMessage(chatId, '📷 <b>Em không tải được ảnh này ạ</b> (quá nặng hoặc Telegram từ chối).');
      return;
    }
    const { generateRaw } = await import('../services/aiGateway.js');
    const answer = await generateRaw({
      systemInstruction: { parts: [{ text: 'Bạn là Quản Gia AI của Hugo Studio. Boss gửi một ảnh. Đọc kỹ rồi trả lời ngắn gọn, đúng trọng tâm, bằng tiếng Việt, định dạng HTML Telegram (<b>, <code>). Nếu là ảnh chụp lỗi thì chỉ ra nguyên nhân khả dĩ và việc nên làm tiếp.' }] },
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: file.mime, data: file.base64 } },
          { text: String(message.caption || 'Boss gửi ảnh này, em xem giúp.').slice(0, 1000) },
        ],
      }],
      generationConfig: { temperature: 0.4 },
    });
    await sendTelegramMessage(chatId, answer || '🤖 Dạ thưa Boss, em chưa đọc được ảnh này (AI đang quá tải). Boss thử lại sau ít phút ạ.');
    return;
  }

  if (!text) return;
  const lowerText = text.toLowerCase();

  const CONSOLE = await import('../services/telegramConsole.js');

  // Boss vừa gõ vào ô nhập của một nút đã bấm — chữ này là CÂU TRẢ LỜI, không
  // phải lệnh mới, nên chặn trước khi nó rơi xuống bộ lệnh gõ tay và AI.
  if (await CONSOLE.handlePendingInput(chatId, text)) return;

  // Boss đang được yêu cầu gõ lại một câu để xác nhận việc ảnh hưởng toàn hệ
  // thống — chữ này là CÂU XÁC NHẬN, không phải lệnh mới.
  const typed = await TelegramState.findOneAndDelete({ key: `typed:${chatId}` }).lean().catch(() => null);
  if (typed) {
    if (text.trim().toUpperCase() !== String(typed.data?.phrase || '').toUpperCase()) {
      await sendTelegramMessage(chatId, '✋ <b>Gõ không khớp — em đã huỷ,</b> không làm gì cả ạ.');
      return;
    }
    await sendTelegramMessage(chatId, `✅ <b>Xác nhận đúng.</b> Đang chạy:\n<code>${typed.data.command}</code>`);
    await runApprovedCommand(chatId, typed.data.command);
    return;
  }

  // ─── MÀN HÌNH CHÍNH ──────────────────────────────────────────────────────────
  if (['/start', 'start', 'menu', '/menu', 'bảng điều khiển', 'bang dieu khien'].includes(lowerText)) {
    const screen = await CONSOLE.homeScreen();
    await sendTelegramMessage(chatId, screen.text, 'HTML', screen.markup);
    return;
  }

  // ─── LỆNH: MỞ ROBOT / CAMERA ────────────────────────────────────────────────
  if (/^(mở vector|mo vector|open robot|mở robot|mo robot|mở cam|mở camera|mở cam|open cam)$/i.test(lowerText)) {
    try {
      const { createTelegramLinkSession } = await import('../routes/robotRoutes.js');
      const { link, expiresIn } = createTelegramLinkSession();
      const replyHtml = `
🤖 <b>ĐIỀU KHIỂN ROBOT CAMERA</b>

🔗 <b>Link truy cập trực tiếp:</b>
<a href="${link}">${link}</a>

⏱️ <i>Hiệu lực ${Math.round(expiresIn / 60)} phút. Nhấn vào link để mở điều khiển.</i>
      `.trim();
      await sendTelegramMessage(chatId, replyHtml, 'HTML');
    } catch (err) {
      console.error('[Telegram] Robot link error:', err.message);
      await sendTelegramAlert('❌ Lỗi kết nối server khi tạo link Robot.');
    }
    return;
  }

  // ─── THỰC THI QUA BỘ NÃO EXECUTIVE AUTONOMOUS ENGINE ĐỒNG BỘ ─────────────────
  const { executeAutonomousCommand } = await import('../services/executiveAutonomousEngine.js');
  const execResult = await executeAutonomousCommand(text, {
    adminUsername: 'SuperAdmin_Telegram',
    source: 'telegram'
  });

  if (execResult && execResult.reply) {
    await sendTelegramMessage(chatId, execResult.reply, 'HTML', execResult.markup);
    return;
  }

  // ─── LỆNH: KIỂM TRA USER / TRA CỨU HỒ SƠ CHI TIẾT ────────────────────────────
  const checkUserRegex = /(kiểm tra|kiem tra|info|tra cứu|tra cuu)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const checkMatch = text.match(checkUserRegex);
  if (checkMatch) {
    const searchEmail = checkMatch[2].trim().toLowerCase();
    const bio = await Bio.findOne({ email: searchEmail });

    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${searchEmail}</code>`);
      return;
    }

    const rpt = await buildButlerMemberReport(bio);
    await sendTelegramMessage(chatId, rpt.text, 'HTML', rpt.markup);
    return;
  }

  // ─── LỆNH BỘ LỌC ĐA DỤNG: LỌC / TÌM KIẾM THÀNH VIÊN NÂNG CAO ────────────────
  const filterRegex = /(lọc|loc|bộ lọc|bo loc|filter|tìm|tim|tìm kiếm|tim kiem)\s+(.+)/i;
  const filterMatch = text.match(filterRegex);
  if (filterMatch) {
    const filterQuery = filterMatch[2].trim();
    const lowerQuery = filterQuery.toLowerCase();

    let queryObj = {};
    let sortObj = { createdAt: -1 };
    let filterLabel = filterQuery;

    if (/ví đóng băng|ví khóa|vi dong bang|vi khoa|frozen/i.test(lowerQuery)) {
      queryObj = { isJoyWalletFrozen: true };
      filterLabel = 'Ví JOY bị đóng băng (isJoyWalletFrozen = true)';
    } else if (/ví mở|vi mo|unfrozen/i.test(lowerQuery)) {
      queryObj = { isJoyWalletFrozen: false };
      filterLabel = 'Ví JOY đang mở (isJoyWalletFrozen = false)';
    } else if (/sinh viên|edu|học đường|hoc duong/i.test(lowerQuery)) {
      queryObj = { isEduVerified: true };
      filterLabel = 'Đã xác minh sinh viên Edu (isEduVerified = true)';
    } else if (/chưa edu|chua edu|no edu/i.test(lowerQuery)) {
      queryObj = { isEduVerified: false };
      filterLabel = 'Chưa xác minh sinh viên Edu (isEduVerified = false)';
    } else if (/bị khóa|bị đình chỉ|bi khoa|bi dinh chi|suspended/i.test(lowerQuery)) {
      queryObj = { status: 'suspended' };
      filterLabel = 'Tài khoản bị tạm đình chỉ (status = suspended)';
    } else if (/hoạt động|active/i.test(lowerQuery)) {
      queryObj = { status: 'active' };
      filterLabel = 'Tài khoản đang hoạt động (status = active)';
    } else if (/vip|star vip|danh dự/i.test(lowerQuery)) {
      queryObj = { starVip: true };
      filterLabel = 'Thành viên VIP / Danh dự (starVip = true)';
    } else if (/nhiều joy|top joy|đại gia/i.test(lowerQuery)) {
      sortObj = { joyBalance: -1 };
      filterLabel = 'Top thành viên nhiều JOY nhất';
    } else if (/mới|mới nhất|newest/i.test(lowerQuery)) {
      sortObj = { createdAt: -1 };
      filterLabel = 'Thành viên mới đăng ký gần đây';
    } else {
      // Tìm kiếm đa trường: Email, Tên, Slug, Số điện thoại, Đơn vị
      const esc = filterQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rgx = new RegExp(esc, 'i');
      queryObj = {
        $or: [
          { email: rgx },
          { displayName: rgx },
          { slug: rgx },
          { phone: rgx },
          { joyDenom: rgx },
        ]
      };
      filterLabel = `Từ khóa: "${filterQuery}"`;
    }

    const matchedBios = await Bio.find(queryObj).sort(sortObj).limit(8).lean();

    if (!matchedBios.length) {
      await sendTelegramAlert(`🔍 <b>KHÔNG TÌM THẤY THÀNH VIÊN NÀO!</b>\n📌 Bộ lọc: <code>${filterLabel}</code>`);
      return;
    }

    let filterReport = `🔍 <b>[BỘ LỌC THÀNH VIÊN ĐA NĂNG]</b>\n📌 <b>Tiêu chí:</b> ${filterLabel}\n📊 <b>Kết quả:</b> Tìm thấy ${matchedBios.length} thành viên\n\n`;

    const inlineRow = [];
    matchedBios.forEach((u, i) => {
      const isFrozenIcon = u.isJoyWalletFrozen ? '❄️' : '✅';
      const isEduIcon = u.isEduVerified ? '🎓' : '';
      filterReport += `${i + 1}. <b>${u.displayName || 'Chưa đặt tên'}</b> (${isFrozenIcon}${isEduIcon})\n   • Email: <code>${u.email}</code> | Slug: <code>/bio/${u.slug || 'demo'}</code>\n   • Ví: <b>${(u.joyBalance || 0).toLocaleString('vi-VN')} JOY</b> (${u.joyDenom || 'JOY'})\n\n`;

      if (i < 4) {
        inlineRow.push({ text: `👤 ${u.displayName || u.email.split('@')[0]}`, callback_data: `cb_lookup:${u.email}` });
      }
    });

    const markup = { inline_keyboard: [inlineRow] };
    await sendTelegramMessage(chatId, filterReport.trim(), 'HTML', markup);
    return;
  }

  // ─── LỆNH: ĐĂNG XUẤT CƯỠNG CHẾ ─────────────────────────────────────────────
  // Thành viên đăng nhập bằng Google/WebAuthn nên KHÔNG có mật khẩu để reset —
  // lệnh "reset mật khẩu" cũ chỉ bịa ra một chuỗi ngẫu nhiên rồi báo "thành
  // công". Hành động cứu hộ thật là thu hồi phiên, y hệt nút trong Dashboard.
  const logoutRegex = /(đăng xuất|dang xuat|logout|thu hồi phiên|thu hoi phien|reset mật khẩu|reset mat khau|reset pass)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const logoutMatch = text.match(logoutRegex);
  if (logoutMatch) {
    const targetEmail = logoutMatch[2].trim().toLowerCase();
    const askedForPassword = /reset/i.test(logoutMatch[1]);
    const bio = await Bio.findOne({ email: targetEmail });

    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }

    const { revokeMemberSession } = await import('../utils/memberSession.js');
    await revokeMemberSession(bio, 'Boss (qua Telegram)');

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_revoke_session',
      targetEmail: bio.email,
      details: { command: text },
    });

    const replyHtml = `
🚪 <b>ĐÃ THU HỒI PHIÊN ĐĂNG NHẬP!</b>

👤 <b>Thành viên:</b> <code>${bio.email}</code> (${bio.displayName})
🛡️ <b>Hiệu lực:</b> thiết bị tin cậy đã bị xoá, lần vào sau phải xác thực lại.
${askedForPassword ? '\nℹ️ <i>Tài khoản thành viên đăng nhập bằng Google/WebAuthn nên không có mật khẩu để reset — thu hồi phiên là cách cứu hộ tương đương.</i>' : ''}
    `.trim();

    await sendTelegramAlert(replyHtml);
    return;
  }

  // ─── LỆNH: BẬT / TẮT BẢO TRÌ HỆ THỐNG ───────────────────────────────────────
  if (lowerText === 'bật bảo trì' || lowerText === 'bat bao tri' || lowerText === 'enable maintenance') {
    global.IS_SYSTEM_MAINTENANCE = true;
    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'enable_maintenance_mode',
    });
    await sendTelegramAlert('🚨 <b>CHẾ ĐỘ BẢO TRÌ HỆ THỐNG ĐÃ ĐƯỢC BẬT!</b>\nToàn bộ truy cập thành viên sẽ hiển thị màn hình bảo trì.');
    return;
  }

  if (lowerText === 'tắt bảo trì' || lowerText === 'tat bao tri' || lowerText === 'disable maintenance') {
    global.IS_SYSTEM_MAINTENANCE = false;
    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'disable_maintenance_mode',
    });
    await sendTelegramAlert('✅ <b>CHẾ ĐỘ BẢO TRÌ HỆ THỐNG ĐÃ ĐƯỢC TẮT!</b>\nHệ thống đã trở lại hoạt động bình thường.');
    return;
  }

  // ─── LỆNH: XEM AUDIT LOG QUẢN TRỊ ──────────────────────────────────────────
  if (lowerText === 'nhật ký' || lowerText === 'nhat ky' || lowerText === 'audit log') {
    const logs = await AdminAuditLog.find().sort({ createdAt: -1 }).limit(5);
    if (!logs.length) {
      await sendTelegramAlert('📋 <b>Chưa có nhật ký hoạt động nào gần đây.</b>');
      return;
    }

    let logText = `📋 <b>TOP 5 NHẬT KÝ QUẢN TRỊ GẦN NHẤT:</b>\n\n`;
    logs.forEach((l, idx) => {
      const timeStr = new Date(l.createdAt).toLocaleTimeString('vi-VN');
      logText += `${idx + 1}. <b>${l.action}</b> (${l.targetEmail || 'System'})\n   <i>Bởi: ${l.adminUsername} lúc ${timeStr}</i>\n`;
    });

    await sendTelegramAlert(logText);
    return;
  }

  // ─── THƯ VIỆN ĐƠN VỊ HUGO STUDIO (CUSTOM DENOMINATIONS) ─────────────────────
  const DENOM_UNIT_MAP = {
    joyka: { code: 'JOYka', name: 'Kavo', key: 'en', factor: 1 },
    joyve: { code: 'JOYve', name: 'Velu', key: 'es', factor: 5 },
    joyra: { code: 'JOYra', name: 'Rami', key: 'zh', factor: 10 },
    joyse: { code: 'JOYse', name: 'Sela', key: 'id', factor: 16 },
    joymi: { code: 'JOYmi', name: 'Mira', key: 'vi', factor: 25 },
    joyti: { code: 'JOYti', name: 'Tinu', key: 'th', factor: 50 },
    joyzo: { code: 'JOYzo', name: 'Zoma', key: 'ja', factor: 150 },
    joylu: { code: 'JOYlu', name: 'Luno', key: 'ko', factor: 1350 },
    kavo:  { code: 'JOYka', name: 'Kavo', key: 'en', factor: 1 },
    velu:  { code: 'JOYve', name: 'Velu', key: 'es', factor: 5 },
    rami:  { code: 'JOYra', name: 'Rami', key: 'zh', factor: 10 },
    sela:  { code: 'JOYse', name: 'Sela', key: 'id', factor: 16 },
    mira:  { code: 'JOYmi', name: 'Mira', key: 'vi', factor: 25 },
    tinu:  { code: 'JOYti', name: 'Tinu', key: 'th', factor: 50 },
    zoma:  { code: 'JOYzo', name: 'Zoma', key: 'ja', factor: 150 },
    luno:  { code: 'JOYlu', name: 'Luno', key: 'ko', factor: 1350 },
    joy:   { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
    xu:    { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
    điểm:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
    diem:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
    gem:   { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
    gold:  { code: 'JOY',   name: 'JOY',  key: 'vi', factor: 1 },
  };

  // ─── LỆNH 1: CỘNG / TRỪ / GỬI JOY CHO THÀNH VIÊN (HIỂU ĐƠN VỊ CÁ NHÂN HÓA) ─────
  const joyEmailFirstRegex = new RegExp(`(gửi|cộng|tặng|thưởng|trừ|chuyển)\\s+(?:đến|cho|vào|của)?\\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\s+([+-]?\\d+(?:[.,]\\d+)?)\\s*(${DENOM_PATTERN})?`, 'i');
  // `\d` một gạch trong template literal biến thành `d`, tức regex đòi CHỮ CÁI
  // "d" chứ không phải chữ số — dạng lệnh "cộng 500 joy cho a@b.com" không bao
  // giờ khớp. Dòng trên (joyEmailFirstRegex) viết đúng `\\d`.
  const joyAmountFirstRegex = new RegExp(`(gửi|cộng|tặng|thưởng|trừ|chuyển)\\s+([+-]?\\d+(?:[.,]\\d+)?)\\s*(${DENOM_PATTERN})?\\s+(?:đến|cho|vào|của)?\\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})`, 'i');

  let joyMatch = text.match(joyEmailFirstRegex);
  let actionWord = '', targetEmail = '', inputAmountNum = 0, unitStr = '';

  if (joyMatch) {
    actionWord = joyMatch[1].toLowerCase();
    targetEmail = joyMatch[2].trim().toLowerCase();
    inputAmountNum = parseFloat(joyMatch[3].replace(',', '.'));
    unitStr = (joyMatch[4] || '').toLowerCase();
  } else {
    joyMatch = text.match(joyAmountFirstRegex);
    if (joyMatch) {
      actionWord = joyMatch[1].toLowerCase();
      inputAmountNum = parseFloat(joyMatch[2].replace(',', '.'));
      unitStr = (joyMatch[3] || '').toLowerCase();
      targetEmail = joyMatch[4].trim().toLowerCase();
    }
  }

  if (targetEmail && !isNaN(inputAmountNum) && inputAmountNum !== 0) {
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }

    const matchedUnit = DENOM_UNIT_MAP[unitStr];
    const unitFactor = matchedUnit ? matchedUnit.factor : 1;
    const unitName = matchedUnit ? matchedUnit.name : (bio.joyDenom || 'JOY');

    // Quy đổi số lượng gõ theo đơn vị custom sang JOY gốc để lưu DB
    let rawJoyCalculated = Math.round(Math.abs(inputAmountNum) * unitFactor);
    if (actionWord === 'trừ') rawJoyCalculated = -rawJoyCalculated;

    const updatedBio = await awardJoy(
      targetEmail,
      rawJoyCalculated,
      'admin_adjustment',
      `Admin chuyển qua Telegram Bot: "${text}"`,
      { bioDoc: bio }
    );

    const sign = rawJoyCalculated > 0 ? '+' : '';
    const formattedRawJoy = `${sign}${rawJoyCalculated.toLocaleString('vi-VN')}`;
    const formattedInputUnit = `${sign}${Math.abs(inputAmountNum).toLocaleString('vi-VN')} ${unitName}`;

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_joy_transfer',
      targetEmail: bio.email,
      details: { command: text, inputAmountNum, unitStr, rawJoyCalculated, newBalance: updatedBio.joyBalance },
    });

    const replyHtml = `
✅ <b>ĐÃ THỰC THI THÀNH CÔNG!</b>

👤 <b>Thành viên:</b> <code>${bio.email}</code> (${bio.displayName || 'Chưa đặt tên'})
🪙 <b>Đơn vị nhận lệnh:</b> <b>${formattedInputUnit}</b>
💰 <b>Biến động JOY gốc:</b> <b>${formattedRawJoy} JOY</b>
📈 <b>Số dư mới:</b> <b>${updatedBio.joyBalance.toLocaleString('vi-VN')} JOY</b> (${bio.joyDenom || 'JOY'})
    `.trim();

    await sendTelegramAlert(replyHtml);
    return;
  }

  // ─── LỆNH 2: ĐỔI TÊN THÀNH VIÊN ──────────────────────────────────────────────
  const renameRegex = /(đổi tên|doi ten|change name)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:thành|thanh|to|=|:)?\s*(.+)/i;
  const renameMatch = text.match(renameRegex);
  if (renameMatch) {
    const targetEmail = renameMatch[2].trim().toLowerCase();
    const newName = renameMatch[3].trim();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }
    const oldName = bio.displayName;
    bio.displayName = newName;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_rename_user',
      targetEmail: bio.email,
      details: { oldName, newName },
    });

    await sendTelegramAlert(`✏️ <b>ĐÃ ĐỔI TÊN THÀNH VIÊN!</b>\n📧 Email: <code>${bio.email}</code>\n👤 Tên cũ: <i>${oldName || 'Chưa đặt'}</i>\n✨ Tên mới: <b>${newName}</b>`);
    return;
  }

  // ─── LỆNH 3: ĐỔI SLUG BIO ───────────────────────────────────────────────────
  const reslugRegex = /(đổi slug|doi slug|change slug)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:thành|thanh|to|=|:)?\s*([a-zA-Z0-9_-]+)/i;
  const reslugMatch = text.match(reslugRegex);
  if (reslugMatch) {
    const targetEmail = reslugMatch[2].trim().toLowerCase();
    const newSlug = reslugMatch[3].trim().toLowerCase();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }
    const existing = await Bio.findOne({ slug: newSlug, email: { $ne: targetEmail } });
    if (existing) {
      await sendTelegramAlert(`⚠️ <b>Slug <code>${newSlug}</code> đã được sử dụng bởi tài khoản khác!</b>`);
      return;
    }
    const oldSlug = bio.slug;
    bio.slug = newSlug;
    await bio.save();

    try {
      const { addSlug, deleteSlug } = await import('../services/redisSlugService.js');
      if (oldSlug) await deleteSlug(oldSlug);
      await addSlug(newSlug);
    } catch {}

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_reslug_user',
      targetEmail: bio.email,
      details: { oldSlug, newSlug },
    });

    await sendTelegramAlert(`🔗 <b>ĐÃ ĐỔI SLUG BIO THÀNH CÔNG!</b>\n📧 Email: <code>${bio.email}</code>\n📌 Slug cũ: <code>/bio/${oldSlug || 'none'}</code>\n✨ Slug mới: <b>/bio/${newSlug}</b>`);
    return;
  }

  // ─── LỆNH 4: BẬT / TẮT XÁC MINH EDU ─────────────────────────────────────────
  const eduRegex = /(bật edu|bat edu|duyệt edu|duyet edu|xác minh edu|xac minh edu|tắt edu|tat edu)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const eduMatch = text.match(eduRegex);
  if (eduMatch) {
    const eduCmd = eduMatch[1].toLowerCase();
    const targetEmail = eduMatch[2].trim().toLowerCase();
    const enableEdu = !eduCmd.includes('tắt') && !eduCmd.includes('tat');
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }
    bio.isEduVerified = enableEdu;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: enableEdu ? 'telegram_enable_edu' : 'telegram_disable_edu',
      targetEmail: bio.email,
    });

    await sendTelegramAlert(`🎓 <b>ĐÃ CẬP NHẬT XÁC MINH EDU!</b>\n📧 Email: <code>${bio.email}</code>\n🎓 Trạng thái: ${enableEdu ? '✅ <b>ĐÃ XÁC MINH SINH VIÊN</b>' : '❌ <b>HỦY XÁC MINH</b>'}`);
    return;
  }

  // ─── LỆNH 5: GỬI THÔNG BÁO CÁ NHÂN (IN-APP NOTIFICATION) ──────────────────────
  const notifyRegex = /(gửi thông báo|gui thong bao|thông báo|thong bao|notify)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:nội dung|noi dung|content|=|:)?\s*(.+)/i;
  const notifyMatch = text.match(notifyRegex);
  if (notifyMatch) {
    const targetEmail = notifyMatch[2].trim().toLowerCase();
    const noteContent = notifyMatch[3].trim();
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }

    const InAppNotification = (await import('../models/InAppNotification.js')).default;
    await InAppNotification.create({
      email: bio.email,
      title: '📢 Thông báo từ Quản Trị Viên',
      message: noteContent,
      icon: 'campaign',
      direction: 'none',
    });

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: 'telegram_send_notification',
      targetEmail: bio.email,
      details: { noteContent },
    });

    await sendTelegramAlert(`📩 <b>ĐÃ GỬI THÔNG BÁO VÀO ỨNG DỤNG!</b>\n📧 Gửi tới: <code>${bio.email}</code>\n📝 Nội dung: <i>"${noteContent}"</i>`);
    return;
  }

  // ─── LỆNH 6: KHÓA / MỞ KHÓA TÀI KHOẢN TOÀN PHẦN ─────────────────────────────
  const accLockRegex = /(khóa tài khoản|khoa tai khoan|mở tài khoản|mo tai khoan)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const accLockMatch = text.match(accLockRegex);
  if (accLockMatch) {
    const cmd = accLockMatch[1].toLowerCase();
    const targetEmail = accLockMatch[2].trim().toLowerCase();
    const shouldSuspend = cmd.includes('khóa') || cmd.includes('khoa');
    const bio = await Bio.findOne({ email: targetEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${targetEmail}</code>`);
      return;
    }
    bio.status = shouldSuspend ? 'suspended' : 'active';
    await bio.save();

    if (shouldSuspend) {
      const { revokeMemberSession } = await import('../utils/memberSession.js');
      await revokeMemberSession(bio, 'Boss khóa tài khoản qua Telegram');
    }

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: shouldSuspend ? 'telegram_suspend_account' : 'telegram_activate_account',
      targetEmail: bio.email,
    });

    await sendTelegramAlert(`🛡️ <b>ĐÃ CẬP NHẬT TRẠNG THÁI TÀI KHOẢN!</b>\n📧 Email: <code>${bio.email}</code>\n📌 Trạng thái: ${shouldSuspend ? '🔴 <b>TẠM ĐÌNH CHỈ (SUSPENDED)</b>' : '🟢 <b>HOẠT ĐỘNG (ACTIVE)</b>'}`);
    return;
  }

  // ─── LỆNH 7: KHÓA / MỞ KHÓA VÍ JOY ──────────────────────────────────────────
  const walletLockRegex = /(khóa ví|mở khóa ví|khoa vi|mo khoa vi)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const lockMatch = text.match(walletLockRegex);
  if (lockMatch) {
    const lockCmd = lockMatch[1].toLowerCase();
    const lockEmail = lockMatch[2].trim().toLowerCase();
    const shouldFreeze = lockCmd.includes('khóa') && !lockCmd.includes('mở');

    const bio = await Bio.findOne({ email: lockEmail });
    if (!bio) {
      await sendTelegramAlert(`❌ <b>Không tìm thấy thành viên:</b> <code>${lockEmail}</code>`);
      return;
    }

    bio.isJoyWalletFrozen = shouldFreeze;
    await bio.save();

    await AdminAuditLog.create({
      adminId: 'TELEGRAM_BOT_ADMIN',
      adminUsername: 'SuperAdmin_Telegram',
      action: shouldFreeze ? 'freeze_wallet' : 'unfreeze_wallet',
      targetEmail: bio.email,
    });

    const replyHtml = `
🔒 <b>ĐÃ CẬP NHẬT TRẠNG THÁI VÍ JOY!</b>

👤 <b>Thành viên:</b> <code>${bio.email}</code> (${bio.displayName})
🛡️ <b>Trạng thái ví:</b> ${shouldFreeze ? '❄️ <b>ĐÃ ĐÓNG BẰNG</b>' : '✅ <b>ĐÃ MỞ KHÓA</b>'}
    `.trim();

    await sendTelegramAlert(replyHtml);
    return;
  }

  // ─── LỆNH 3: BÁO CÁO / BRIEFING ──────────────────────────────────────────────
  // ─── LỆNH: TRỢ GIÚP ─────────────────────────────────────────────────────────
  if (findCommand(text)?.id === 'help') {
    await sendTelegramMessage(chatId, helpScreen());
    return;
  }

  // ─── LỆNH: CHẶN / BỎ CHẶN QUỐC GIA · ASN ────────────────────────────────────
  const geoCmd = findCommand(text)?.id;
  if (geoCmd === 'geoblock' || geoCmd === 'geounblock') {
    const m = text.match(/(quốc gia|quoc gia|country|asn)\s+(\S+)/i);
    const target = /asn/i.test(m?.[1] || '') ? 'asn' : 'country';
    const value = m?.[2] || '';
    const { blockScopeAtEdge, unblockScopeAtEdge, edgeFirewallEnabled } = await import('../services/cloudflareFirewall.js');
    if (!edgeFirewallEnabled()) {
      await sendTelegramMessage(chatId, '⚠️ <b>Chưa bật được tường lửa Cloudflare.</b>\nCần cấp token CLOUDFLARE_API_TOKEN quyền <i>Zone → Firewall Services → Edit</i> thì lệnh này mới chạy.');
      return;
    }
    const r = geoCmd === 'geoblock'
      ? await blockScopeAtEdge({ target, value, note: 'Boss geo-block qua Telegram' })
      : await unblockScopeAtEdge({ target, value });
    await sendTelegramMessage(chatId, r.edge
      ? `✅ <b>${geoCmd === 'geoblock' ? 'Đã chặn' : 'Đã bỏ chặn'}</b> ${target === 'asn' ? 'ASN' : 'quốc gia'} <code>${r.value || value}</code> ở tường lửa Cloudflare.`
      : `❌ <b>Không thực hiện được:</b> ${r.error || (r.notFound ? 'không tìm thấy lệnh chặn' : 'lỗi không rõ')}`);
    return;
  }

  // ─── LỆNH: TỔNG KẾT AN NINH ─────────────────────────────────────────────────
  // Cùng bản tin mà cron gửi 08:00 mỗi sáng — Boss gọi lại bất cứ lúc nào.
  if (findCommand(text)?.id === 'security') {
    const hours = Math.min(168, Number(text.match(/\d{1,3}/)?.[0] || 24));
    const { securityDigest } = await import('../services/securityEnforcement.js');
    await sendTelegramMessage(chatId, await securityDigest(hours));
    return;
  }

  // ─── LỆNH: LỖI MÁY CHỦ GẦN NHẤT ─────────────────────────────────────────────
  // Gộp theo nội dung: một lỗi lặp 200 lần là MỘT dòng kèm số đếm, chứ không
  // phải 200 dòng giống hệt nhau đẩy hết những lỗi khác ra khỏi màn hình.
  if (findCommand(text)?.id === 'errors') {
    const { errorDigest } = await import('../utils/alert.js');
    await sendTelegramMessage(chatId, await errorDigest(Number(text.match(/\d{1,2}/)?.[0] || 5)));
    return;
  }

  if (lowerText === 'báo cáo' || lowerText === 'bao cao' || lowerText === 'briefing' || lowerText === 'status') {
    const [totalUsers, pendingTickets, frozenWallets] = await Promise.all([
      Bio.countDocuments(),
      SupportTicket.countDocuments({ status: 'pending' }),
      Bio.countDocuments({ isJoyWalletFrozen: true }),
    ]);

    const reportHtml = `
📊 <b>BÁO CÁO TỔNG QUAN TỪ AI QUẢN GIA</b>

👥 <b>Tổng thành viên:</b> ${totalUsers.toLocaleString()} người
📩 <b>Support Ticket chờ duyệt:</b> ${pendingTickets} ticket
❄️ <b>Ví JOY đang đóng băng:</b> ${frozenWallets} tài khoản
🟢 <b>Bảo trì hệ thống:</b> ${global.IS_SYSTEM_MAINTENANCE ? '🔴 DANG BAT' : '🟢 KHONG'}
    `.trim();

    await sendTelegramMessage(chatId, reportHtml);
    return;
  }

  // ─── 5. QUẢN GIA AI: DỊCH TIẾNG NGƯỜI THÀNH HÀNH ĐỘNG ───────────────────────
  // Lệnh gõ tay ở trên đòi ĐÚNG cú pháp; nhớ hết 17 mẫu là việc của máy, không
  // phải của Boss. Ở đây quản gia đọc câu nói thường rồi CHỌN một lệnh trong
  // danh mục (telegramCommands.js) — chọn, chứ không tự chế ra lệnh mới.
  //
  // Việc chỉ đọc thì chạy luôn. Việc có ghi (tiền, khoá, danh tính, gửi cho
  // người dùng) thì dừng lại ở một nút xác nhận: đúng luật "hành động ghi phải
  // có người duyệt" của docs/ai-workforce.md, và cũng là cái đảm bảo một câu
  // hiểu nhầm không bao giờ tự trừ tiền của ai.
  if (!allowAi) return;
  try {
    // Quản gia TỰ tra dữ liệu nó cần (askButler gọi công cụ), thay vì mỗi tin
    // nhắn — kể cả "chào em" — đều nã 8 truy vấn Mongo dựng sẵn một cục ngữ
    // cảnh. Vẫn trả về { reply, command }; command phải khớp danh mục mới chạy.
    const { askButler } = await import('../services/telegramButler.js');
    const { reply, command: proposed } = await askButler({
      text,
      history: await recentTurns(chatId),
    });

    const replyText = reply
      || '🤖 <b>Quản Gia Hugo:</b> Dạ thưa Boss, AI đang quá tải hoặc hết hạn mức nên em chưa nghĩ ra câu trả lời. Boss thử lại sau ít phút, hoặc gõ <code>Trợ giúp</code> nhé.';
    await rememberTurn(chatId, text, replyText);

    // Lệnh AI đề xuất phải khớp trọn vẹn một mẫu trong danh mục. Không khớp thì
    // coi như AI chỉ đang trò chuyện — thà bỏ sót một hành động còn hơn chạy
    // một câu tự chế lên dữ liệu thật.
    const command = findCommand(proposed);

    if (command && !command.danger) {
      // Việc chỉ đọc: làm luôn, không bắt Boss bấm thêm nút nào.
      await sendTelegramMessage(chatId, replyText);
      return processTelegramUpdate(
        { message: { chat: { id: chatId }, text: proposed } },
        { allowAi: false },
      );
    }

    let inlineButtons = null;
    let finalReply = replyText;
    if (command) {
      inlineButtons = { inline_keyboard: [[
        { text: '✅ Đồng ý, làm đi', callback_data: `cb_run:${await stashCommand(proposed)}` },
        { text: '✋ Thôi', callback_data: 'cb_run_cancel' },
      ]] };
      finalReply += `\n\n⚡ <b>Em sẽ chạy lệnh:</b>\n<code>${proposed}</code>${await previewTarget(proposed)}`;
    }

    await sendTelegramMessage(chatId, finalReply, 'HTML', inlineButtons);
  } catch (err) {
    console.error('[Telegram AI Butler Error]', err);
    await sendTelegramMessage(chatId, `🤖 <b>Quản Gia Hugo:</b> Dạ thưa Boss, em đã nhận lệnh <code>${text}</code> nhưng gặp trục trặc. Boss gõ <code>Trợ giúp</code> để dùng lệnh trực tiếp nhé.`);
  }
}

// Bí mật webhook: Telegram gắn nó vào header X-Telegram-Bot-Api-Secret-Token,
// đây là THỨ DUY NHẤT chứng minh request đến từ Telegram. Không có nó thì ai
// biết URL cũng POST được `{message:{chat:{id:<id Boss>},text:"Gửi ... JOY"}}`
// và chiếm trọn quyền admin. Suy ra từ JWT_SECRET để khỏi thêm biến môi trường
// và vẫn ổn định qua mỗi lần khởi động lại.
// ponytail: đổi sang biến TELEGRAM_WEBHOOK_SECRET riêng nếu sau này cần xoay
// khóa webhook mà không xoay JWT_SECRET.
function webhookSecret() {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET;
  return crypto.createHash('sha256').update(`${JWT_SECRET}:telegram-webhook`).digest('hex').slice(0, 48);
}

// POST /api/telegram/webhook
// Cùng lý do như so mã OTP: `!==` rò rỉ độ dài khớp qua thời gian phản hồi.
function sameSecret(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

router.post('/webhook', async (req, res) => {
  if (!sameSecret(req.get('X-Telegram-Bot-Api-Secret-Token'), webhookSecret())) {
    console.warn(`⚠️ Telegram webhook: sai secret token, từ chối (IP ${req.ip}).`);
    return res.status(403).send('Forbidden');
  }
  res.status(200).send('OK');
  try {
    await processTelegramUpdate(req.body);
  } catch (error) {
    console.error('[Telegram Webhook Error]', error);
  }
});

// GET /api/telegram/status — thẻ "Bot Telegram" trong tab Giám sát hệ thống.
router.get('/status', requireAdmin, async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || token.includes('YOUR_') || !chatId) {
    return res.json({
      success: true,
      configured: false,
      mode: 'off',
      hint: 'Thiếu TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID trong server/.env — OTP 2FA sẽ không tới được Telegram.',
    });
  }
  try {
    const [me, wh] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json()),
    ]);
    res.json({
      success: true,
      configured: true,
      mode: currentMode,
      botUsername: me.ok ? me.result.username : null,
      botOk: Boolean(me.ok),
      botError: me.ok ? null : me.description,
      chatId,
      webhookUrl: wh.ok ? wh.result.url || '' : '',
      pendingUpdates: wh.ok ? wh.result.pending_update_count : null,
      lastError: wh.ok ? wh.result.last_error_message || null : null,
    });
  } catch (error) {
    res.status(502).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/test — bắn 1 tin thật về máy Boss để biết đường dây còn sống.
router.post('/test', requireAdmin, async (req, res) => {
  const result = await sendTelegramAlert(
    `✅ <b>[KIỂM TRA KẾT NỐI]</b>\nAdmin Dashboard vừa gửi thử một tin lúc <b>${new Date().toLocaleString('vi-VN')}</b>.\nBoss đọc được tin này nghĩa là đường gửi OTP 2FA đang thông.`
  );
  res.json({ success: Boolean(result.success && !result.simulated), ...result });
});

// ─── Khởi động bot ───────────────────────────────────────────────────────────
let currentMode = 'off'; // off | webhook | polling | send-only

/**
 * Production (có URL công khai) → webhook: Telegram tự đẩy tin sang, lúc rảnh
 * tốn 0 băng thông. Long-polling gọi api.telegram.org mỗi 10s suốt ngày đêm,
 * đúng cái kiểu poll đã ngốn băng thông outbound của Render lần trước.
 *
 * Dev thì MẶC ĐỊNH chỉ gửi, không nhận: bot chỉ có một token, máy dev mà bật
 * polling là Telegram gỡ webhook của production và bot thật câm lặng. Muốn thử
 * nhận lệnh dưới máy thì đặt TELEGRAM_ENABLE_POLLING=true (nhớ chạy lại
 * production một lần để đặt lại webhook).
 */
export async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('YOUR_')) {
    currentMode = 'off';
    console.warn('⚠️ Telegram bot TẮT: thiếu TELEGRAM_BOT_TOKEN trong server/.env — không nhận lệnh, không gửi được OTP 2FA admin.');
    return currentMode;
  }
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Thiếu TELEGRAM_CHAT_ID — bot sẽ không biết gửi OTP cho ai.');
  }

  const base = (process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  if (base) {
    const url = `${base}/api/telegram/webhook`;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          secret_token: webhookSecret(),
          allowed_updates: ['message', 'callback_query'],
          // Bỏ hàng đợi cũ: phát lại một lệnh "Gửi 5000 JOY" từ tuần trước là
          // cộng tiền lần hai.
          drop_pending_updates: true,
        }),
      }).then((x) => x.json());
      if (r.ok) {
        currentMode = 'webhook';
        console.log(`🤖 Telegram bot: webhook → ${url}`);
      } else {
        currentMode = 'off';
        console.error(`❌ Telegram setWebhook thất bại: ${r.description}`);
      }
    } catch (e) {
      currentMode = 'off';
      console.error(`❌ Telegram setWebhook lỗi mạng: ${e.message}`);
    }
    return currentMode;
  }

  // Chỉ bật khi được YÊU CẦU rõ ràng. Trước đây điều kiện còn kèm
  // `NODE_ENV !== 'production'`, nghĩa là mọi máy dev đều tự bật long-polling —
  // trái hẳn với chú thích ngay trên, và tệ hơn: dòng deleteWebhook bên dưới gỡ
  // luôn webhook của production, làm bot thật câm cho tới lần deploy sau. Triệu
  // chứng nhìn thấy được là log dev đầy "getUpdates lỗi 409" mỗi phút.
  if (process.env.TELEGRAM_ENABLE_POLLING === 'true') {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`).catch(() => {});
    startTelegramLongPolling();
    return currentMode;
  }

  currentMode = 'send-only';
  console.log('🤖 Telegram bot: chỉ GỬI (OTP 2FA + cảnh báo). Nhận lệnh tắt ở máy dev — bật bằng TELEGRAM_ENABLE_POLLING=true.');
  return currentMode;
}

// ─── Long Polling Background Engine ──────────────────────────────────────────
let isPollingStarted = false;
let lastUpdateId = 0;
let lastPollErrorLog = 0;

export function startTelegramLongPolling() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('YOUR_')) {
    console.warn('⚠️ Telegram bot TẮT: thiếu TELEGRAM_BOT_TOKEN trong server/.env — không nhận lệnh, không gửi được OTP 2FA admin.');
    return;
  }
  if (isPollingStarted) return;

  isPollingStarted = true;
  currentMode = 'polling';
  console.log('🤖 Telegram bot: long-polling (chế độ dev — webhook production đã bị gỡ).');

  async function poll() {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await processTelegramUpdate(update);
        }
      } else if (!data.ok) {
        // 409 = có webhook đang bật, Telegram từ chối getUpdates. Nuốt im lặng
        // thì bot "chết" mà log sạch bong — phải nói ra, nhưng mỗi giây một
        // dòng thì lại nhấn chìm mọi log khác, nên 1 phút nhắc 1 lần.
        if (Date.now() - lastPollErrorLog > 60000) {
          lastPollErrorLog = Date.now();
          console.warn(`⚠️ Telegram getUpdates lỗi ${data.error_code}: ${data.description}`);
          if (data.error_code === 409) {
            console.warn('   → Đang có webhook (thường là production). Máy dev và production KHÔNG dùng chung một bot được: tắt TELEGRAM_ENABLE_POLLING, hoặc gỡ webhook nếu muốn nhận lệnh dưới máy.');
          }
        }
      }
    } catch {
      // Ignore network dropouts
    } finally {
      setTimeout(poll, 1000);
    }
  }

  poll();
}

export default router;
