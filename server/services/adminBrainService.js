import { generate, generateRaw } from './aiGateway.js';
import SecurityEvent from '../models/SecurityEvent.js';
import SecurityBlock from '../models/SecurityBlock.js';
import SupportTicket from '../models/SupportTicket.js';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { sendCustomEmail } from './emailService.js';

/**
 * Service trung tâm cho "Bộ Não Máy Tính Admin" (Executive Autonomous Computer Brain)
 */

const SYSTEM_PROMPT = `
Bạn là "BỘ NÃO MÁY TÍNH ADMIN" (Executive Autonomous Admin Brain) - Trợ lý quản trị tối cao của hệ thống Hugo Studio / Price Doc / JOY Ecosystem.
Nhiệm vụ của bạn:
1. Phân tích dữ liệu hệ thống, cảnh báo an ninh, biến động điểm JOY và các hành vi bất thường.
2. Tự động soạn phản hồi chuẩn xác, lịch sự, đúng trọng tâm cho các yêu cầu/ticket hỗ trợ của người dùng.
3. Soạn email chuyên nghiệp đại diện cho Quản trị viên/Chủ sở hữu hệ thống gửi đến người dùng.
4. Đưa ra các quyết định điều hành có cấu trúc (Executive Decision Proposals) kèm nút thực thi 1-Click.
Format trả lời luôn rõ ràng, ngắn gọn, súc tích, mang phong cách chuyên nghiệp, hiện đại, uy quyền nhưng thân thiện.
`;

/**
 * Phân tích tổng thể sức khỏe hệ thống và an ninh
 */
export async function diagnoseSystemHealth() {
  try {
    const totalUsers = await Bio.countDocuments();
    const lockedUsers = await Bio.countDocuments({ status: 'locked' });
    const pendingUsers = await Bio.countDocuments({ status: 'pending' });

    const recentIncidents = await SecurityEvent.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activeBlocks = await SecurityBlock.countDocuments({
      $or: [{ permanent: true }, { expiresAt: { $gt: new Date() } }]
    });

    const pendingTickets = await SupportTicket.countDocuments({ status: 'pending' });

    const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
    const auditLogs24h = await AdminAuditLog.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const todayJoyStats = await JoyLedger.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$source',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const contextData = {
      totalUsers,
      lockedUsers,
      pendingUsers,
      activeSecurityBlocks: activeBlocks,
      pendingSupportTickets: pendingTickets,
      recentIncidentsCount: recentIncidents.length,
      adminAuditActions24h: auditLogs24h,
      todayJoyStats
    };

    const prompt = `
Dựa vào dữ liệu thống kê thời gian thực của hệ thống dưới đây:
${JSON.stringify(contextData, null, 2)}

Hãy đưa ra đánh giá tóm tắt ngắn gọn:
1. Trạng thái an ninh & Rủi ro (Đánh giá mức độ An toàn/Cảnh báo/Nguy hiểm).
2. Tình hình hoạt động của người dùng & Hàng chờ xử lý.
3. Đề xuất 2-3 hành động điều hành quan trọng nhất cần Admin chú ý hôm nay.
`;

    const aiAnalysis = await generate(prompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.3
    });

    return {
      metrics: contextData,
      analysis: aiAnalysis || 'Bộ Não Máy Tính hiện đã ghi nhận dữ liệu. Không phát hiện sự cố an ninh khẩn cấp.'
    };
  } catch (error) {
    console.error('Error diagnosing system health:', error);
    throw error;
  }
}

/**
 * Xử lý prompt trò chuyện hoặc câu lệnh từ Admin với AI Brain
 */
export async function processAdminPrompt(adminPrompt, extraContext = {}) {
  try {
    // Thu thập thêm context thực tế từ database nếu admin yêu cầu
    const pendingTickets = await SupportTicket.find({ status: 'pending' }).limit(5).lean();
    const recentBlocks = await SecurityBlock.find({}).sort({ lastLockedAt: -1 }).limit(5).lean();
    const userCount = await Bio.countDocuments();

    const fullPrompt = `
Yêu cầu/Câu hỏi từ Admin: "${adminPrompt}"

Ngữ cảnh hệ thống hiện tại:
- Tổng số người dùng: ${userCount}
- Số ticket đang chờ xử lý: ${pendingTickets.length}
- Các lệnh chặn an ninh gần đây: ${recentBlocks.length}
${extraContext ? `- Bổ sung: ${JSON.stringify(extraContext)}` : ''}

Hãy đưa ra câu trả lời chi tiết, chính xác. Nếu yêu cầu có chứa quyết định thực thi (ví dụ: gửi email, khóa tài khoản, duyệt ticket), hãy đính kèm khối JSON hành động có cấu trúc ở cuối câu trả lời dạng:
\`\`\`json
{
  "action": "send_email" | "adjust_joy" | "reply_ticket" | "lock_user" | "none",
  "payload": { ... }
}
\`\`\`
`;

    const response = await generate(fullPrompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4
    });

    return {
      reply: response || 'Bộ Não Máy Tính đã nhận lệnh nhưng không thể tạo câu phản hồi từ mô hình AI.'
    };
  } catch (error) {
    console.error('Error in processAdminPrompt:', error);
    throw error;
  }
}

/**
 * Tự động soạn câu trả lời ticket hỗ trợ dựa trên nội dung ticket
 */
export async function autoDraftTicketReply(ticketId) {
  try {
    const ticket = await SupportTicket.findById(ticketId).lean();
    if (!ticket) {
      throw new Error('Ticket không tồn tại');
    }

    const prompt = `
Hãy soạn câu trả lời hỗ trợ khách hàng chuyên nghiệp, lịch sự và giải quyết triệt để vấn đề sau:
- Tên người dùng: ${ticket.name || ticket.email}
- Trò chuyện/Chủ đề: ${ticket.subject || 'Hỗ trợ dịch vụ'}
- Nội dung yêu cầu: "${ticket.message || ticket.content || ''}"

Câu trả lời phải mang danh nghĩa Đội ngũ Hỗ trợ Hugo Studio, đầy đủ lời chào, giải pháp cụ thể và lời chúc.
`;

    const draft = await generate(prompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4
    });

    return {
      ticketId,
      userEmail: ticket.email,
      draftReply: draft || 'Chào bạn, chúng tôi đã nhận được thông tin và đang xử lý yêu cầu của bạn.'
    };
  } catch (error) {
    console.error('Error auto drafting ticket reply:', error);
    throw error;
  }
}

/**
 * Tự động soạn & gửi Email cho người dùng theo chỉ thị từ Admin
 */
export async function generateAndSendUserEmail({ toEmail, subject, instructions, fromName = 'Hugo Studio Executive' }) {
  try {
    const user = await Bio.findOne({ email: toEmail }).lean();
    const displayName = user?.displayName || toEmail.split('@')[0];

    const prompt = `
Hãy soạn một email HTML hoàn chỉnh, đẹp mắt theo chủ đề và chỉ thị sau:
- Gửi tới: ${displayName} (${toEmail})
- Tiêu đề mong muốn: "${subject}"
- Yêu cầu/Chỉ thị nội dung: "${instructions}"

Email cần có cấu trúc HTML chuẩn inline CSS (font Arial, tông màu dark/slate thanh lịch, có nút bấm call-to-action nếu phù hợp, và chữ ký từ ${fromName}).
Chỉ trả về nội dung HTML chính giữa cặp thẻ <div>...</div>. Không đính kèm markdown codeblock.
`;

    let htmlContent = await generate(prompt, {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.5
    });

    if (!htmlContent) {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
          <h2 style="color: #38bdf8;">Thông báo từ ${fromName}</h2>
          <p>Chào ${displayName},</p>
          <p>${instructions}</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Trân trọng,<br>${fromName}</p>
        </div>
      `;
    } else {
      // Clean up markdown block tags if AI accidentally added them
      htmlContent = htmlContent.replace(/```html/g, '').replace(/```/g, '').trim();
    }

    const emailResult = await sendCustomEmail(toEmail, subject, htmlContent);

    return {
      success: emailResult.success,
      toEmail,
      subject,
      htmlContent,
      error: emailResult.error
    };
  } catch (error) {
    console.error('Error generating and sending user email:', error);
    throw error;
  }
}

/**
 * Quét tự động phát hiện rủi ro an ninh & biến động JOY bất thường (AI Auto-Moderator)
 */
export async function runAutoModerationScan() {
  try {
    const bios = await Bio.find({}).lean();
    const riskItems = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const bio of bios) {
      const joyLedger24h = await JoyLedger.find({
        email: bio.email,
        createdAt: { $gte: oneDayAgo }
      }).lean();

      const total24hJoyGain = joyLedger24h
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      // Rule 1: Anomaly JOY spike (> 50,000 JOY in 24h)
      if (total24hJoyGain >= 50000) {
        riskItems.push({
          userId: bio._id,
          email: bio.email,
          displayName: bio.displayName,
          riskLevel: 'CRITICAL',
          riskType: 'JOY_SPIKE',
          reason: `Số dư JOY tăng bất thường +${total24hJoyGain.toLocaleString()} JOY trong 24h qua.`,
          joyBalance: bio.joyBalance || 0,
          isFrozen: bio.isJoyWalletFrozen || false,
          countryCode: bio.preferredLanguage || bio.countryCode || 'VI'
        });
      }
      // Rule 2: Wallet currently frozen
      else if (bio.isJoyWalletFrozen) {
        riskItems.push({
          userId: bio._id,
          email: bio.email,
          displayName: bio.displayName,
          riskLevel: 'MEDIUM',
          riskType: 'WALLET_FROZEN',
          reason: `Tài khoản đang trong trạng thái đóng băng Ví JOY khẩn cấp.`,
          joyBalance: bio.joyBalance || 0,
          isFrozen: true,
          countryCode: bio.preferredLanguage || bio.countryCode || 'VI'
        });
      }
    }

    return {
      scannedCount: bios.length,
      riskCount: riskItems.length,
      riskItems
    };
  } catch (error) {
    console.error('Error running AI Auto-Moderation scan:', error);
    throw error;
  }
}

export default {
  diagnoseSystemHealth,
  processAdminPrompt,
  autoDraftTicketReply,
  generateAndSendUserEmail,
  runAutoModerationScan
};
