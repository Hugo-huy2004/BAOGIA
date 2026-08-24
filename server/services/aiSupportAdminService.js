import AISupportLog from '../models/AISupportLog.js';
import AISupportKB from '../models/AISupportKB.js';
import SupportTicket from '../models/SupportTicket.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { sendTelegramAlert } from './telegramService.js';

/**
 * Service Trợ Lý AI Support Admin Butler Agent (Quản gia AI tự động)
 *
 * Tính năng chính:
 *   1. Phân tích cảm xúc (Angry, Frustrated, Neutral, Happy).
 *   2. Tra cứu kho tri thức tự học (AISupportKB) kết hợp AI Gateway.
 *   3. Tự động trả lời & đóng ticket thường 24/7.
 *   4. Báo động khẩn cấp về Telegram Bot của Boss cho trường hợp nhạy cảm.
 *   5. Ghi nhận phản hồi của Boss khi trả lời ticket để học máy tự động (Self-learning loop).
 */

export function detectSentiment(text) {
  if (!text || typeof text !== 'string') return 'neutral';
  const lower = text.toLowerCase();
  const angryKeywords = ['lừa đảo', 'khóa tài khoản', 'mất tiền', 'chửi', 'tội', 'bức xúc', 'tệ', 'bẩn', 'tố cáo', 'tải quá lâu', 'nổ'];
  const frustratedKeywords = ['lỗi', 'không được', 'sao lại', 'chờ lâu', 'không vào được', 'bị hỏng', 'tại sao'];

  if (angryKeywords.some((k) => lower.includes(k))) return 'angry';
  if (frustratedKeywords.some((k) => lower.includes(k))) return 'frustrated';
  return 'neutral';
}

export async function autoProcessTicket(ticket) {
  if (!ticket || !ticket.email || (!ticket.message && !ticket.issue)) return;

  try {
    const messageText = String(ticket.message || ticket.issue).trim();
    const messageLower = messageText.toLowerCase();
    const sentiment = detectSentiment(messageText);

    // 1. Kiểm tra từ khóa nghi vấn rủi ro / rút tiền lớn / tố cáo gian lận / cảm xúc tức giận 🤬
    const isEscalationNeeded =
      sentiment === 'angry' ||
      messageLower.includes('rút tiền') ||
      messageLower.includes('khóa vĩnh viễn') ||
      messageLower.includes('tố cáo') ||
      messageLower.includes('hack') ||
      messageLower.includes('bản quyền');

    if (isEscalationNeeded) {
      // Gửi Telegram alert khẩn cho Boss
      const telegramText = `🚨 <b>[HUGO AI BUTLER ALERT]</b>\n<b>Ticket Cần Boss Duyệt Gấp</b>\n\n👤 <b>Member:</b> ${ticket.email}\n🤬 <b>Cảm xúc:</b> ${sentiment.toUpperCase()}\n📝 <b>Nội dung:</b> <i>"${messageText.slice(0, 150)}..."</i>`;
      await sendTelegramAlert(telegramText).catch(() => {});

      await AISupportLog.create({
        actionType: 'escalate',
        targetEmail: ticket.email,
        ticketId: String(ticket._id),
        summary: `🚨 [GẮP] Chuyển Ticket #${ticket._id} sang Boss do cảm xúc ${sentiment} / nội dung nhạy cảm`,
        reportedToAdmin: false,
        details: { sentiment, messageSnippet: messageText.slice(0, 100) },
      });

      await AdminAuditLog.create({
        adminId: 'AI_SUPPORT_BUTLER',
        adminUsername: 'AI_Support_Butler',
        action: 'escalate_ticket',
        targetEmail: ticket.email,
        details: `Ticket #${ticket._id} | Cảm xúc: ${sentiment} | Chuyển Boss do nhạy cảm`,
      });
      return;
    }

    // 2. Tra cứu Kho tri thức tự học (AISupportKB)
    let reply = '';
    const kbMatches = await AISupportKB.find({ active: true }).lean();
    for (const kb of kbMatches) {
      if (Array.isArray(kb.keywords) && kb.keywords.some((k) => messageLower.includes(k.toLowerCase()))) {
        reply = kb.solution;
        await AISupportKB.updateOne({ _id: kb._id }, { $inc: { usageCount: 1 } });
        break;
      }
    }

    // 3. Nếu chưa có trong KB -> Dùng Gemini AI để tự sáng tạo câu trả lời chuẩn xác
    if (!reply) {
      const { generateRaw } = await import('./aiGateway.js');
      const aiResponse = await generateRaw({
        systemInstruction: { parts: [{ text: 'Bạn là Trợ lý Hỗ trợ Khách hàng tự động của Hugo Studio. Trả lời ngắn gọn, lịch sự, thân thiện, giải quyết vấn đề cho khách.' }] },
        contents: [{ role: 'user', parts: [{ text: messageText }] }],
        generationConfig: { temperature: 0.3 },
      });
      reply = aiResponse || 'Cảm ơn bạn đã phản hồi! Yêu cầu của bạn đã được ghi nhận và đội ngũ hỗ trợ sẽ xử lý sớm nhất.';
    }

    // 4. Cập nhật Ticket & tạo Nhật ký
    ticket.status = 'resolved';
    ticket.adminReply = `🤖 [AI Support Butler]: ${reply}`;
    ticket.resolvedAt = new Date();
    await ticket.save();

    await AISupportLog.create({
      actionType: 'ticket_reply',
      targetEmail: ticket.email,
      ticketId: String(ticket._id),
      summary: `Tự động trả lời & đóng Ticket #${ticket._id} cho ${ticket.email}`,
      reportedToAdmin: false,
      details: { replySnippet: reply.slice(0, 100), sentiment },
    });

    await AdminAuditLog.create({
      adminId: 'AI_SUPPORT_BUTLER',
      adminUsername: 'AI_Support_Butler',
      action: 'auto_reply_ticket',
      targetEmail: ticket.email,
      details: `Ticket #${ticket._id} | Cảm xúc: ${sentiment} | Đã tự động trả lời`,
    });
  } catch (error) {
    console.error('[AI Support Butler autoProcessTicket]', error);
  }
}

/**
 * Hàm học máy tự động (Self-Learning Loop):
 * Khi Super Admin tự tay trả lời Ticket, AI Butler học câu giải quyết của Admin vào Kho tri thức (AISupportKB).
 */
export async function recordAdminResolution(ticketId, adminReply) {
  if (!ticketId || !adminReply || adminReply.length < 10) return;
  try {
    const ticket = await SupportTicket.findById(ticketId).lean();
    if (!ticket || !ticket.issue) return;

    const words = String(ticket.issue)
      .toLowerCase()
      .replace(/[^\w\sàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const keywords = Array.from(new Set(words)).slice(0, 5);
    if (!keywords.length) return;

    await AISupportKB.create({
      topic: `Admin Resolution for Ticket #${ticketId}`,
      keywords,
      pattern: String(ticket.issue).slice(0, 100),
      solution: String(adminReply).trim(),
      sourceTicketId: String(ticketId),
      learnedFromAdmin: 'superadmin',
    });

    console.log(`🧠 AI Support Butler has learned solution for ticket #${ticketId}`);
  } catch (error) {
    console.error('[AI Support Butler recordAdminResolution]', error);
  }
}

/**
 * Tổng hợp danh sách báo cáo cho Super Admin khi đăng nhập
 */
export async function getPendingBriefing() {
  try {
    const pendingLogs = await AISupportLog.find({ reportedToAdmin: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (!pendingLogs.length) {
      return { hasBriefing: false, totalCount: 0, items: [], summary: {} };
    }

    const counts = {
      ticket_reply: 0,
      location_unlock: 0,
      joy_refund: 0,
      flag_spam: 0,
      escalate: 0,
      totalJoyRefunded: 0,
    };

    pendingLogs.forEach((item) => {
      if (counts[item.actionType] !== undefined) {
        counts[item.actionType]++;
      }
      if (item.joyAmount > 0) {
        counts.totalJoyRefunded += item.joyAmount;
      }
    });

    return {
      hasBriefing: true,
      totalCount: pendingLogs.length,
      counts,
      items: pendingLogs,
    };
  } catch (error) {
    console.error('[AI Support Butler getPendingBriefing]', error);
    return { hasBriefing: false, totalCount: 0, items: [], summary: {} };
  }
}

/**
 * Đánh dấu đã báo cáo xong cho Super Admin
 */
export async function markBriefingReported(logIds) {
  try {
    if (!Array.isArray(logIds) || !logIds.length) {
      await AISupportLog.updateMany({ reportedToAdmin: false }, { $set: { reportedToAdmin: true } });
    } else {
      await AISupportLog.updateMany({ _id: { $in: logIds } }, { $set: { reportedToAdmin: true } });
    }
    return { success: true };
  } catch (error) {
    console.error('[AI Support Butler markBriefingReported]', error);
    return { success: false, error: error.message };
  }
}

export default {
  autoProcessTicket,
  recordAdminResolution,
  getPendingBriefing,
  markBriefingReported,
};
