import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { securityHash } from '../services/securityEnforcement.js';
import { signedClientIp } from '../utils/clientIp.js';

const router = express.Router();

/**
 * Hỗ trợ không còn AI. Trước đây mỗi yêu cầu gửi lên đều bị `autoProcessTicket`
 * soạn sẵn một câu trả lời máy, và app thành viên còn có cả một khung chat bot
 * (`POST /chat` với system prompt + FAQ cứng) — cả hai đã gỡ. Yêu cầu bây giờ đi
 * thẳng tới quản trị viên, kèm đủ thông tin liên lạc để người thật gọi lại.
 *
 * Kho tri thức (`aiSupportAdminService`) vẫn còn vì webhook Messenger và bản tin
 * tóm tắt cho admin dùng nó; nó không còn dính gì tới app Hỗ trợ nữa.
 */
async function createTicket({ fullName, email, phone, issue, message, ipHash }) {
  return SupportTicket.create({
    fullName: fullName?.trim() || 'Thành viên Hugo Studio',
    email: email || 'guest@hugowishpax.studio',
    phone: phone?.trim() || 'N/A',
    issue: issue || message || 'Cần hỗ trợ',
    ...(ipHash && { ipHash }),
    status: 'pending'
  });
}

// One donation follow-up per verified client IP; the unique DB index survives restarts.
router.post('/donation-requests', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 254);
    const issue = String(req.body?.issue || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !issue || issue.length > 2000) {
      return res.status(400).json({ error: 'Vui lòng nhập email hợp lệ và nội dung dưới 2.000 ký tự.' });
    }
    const ip = signedClientIp(req) || (!req.headers['x-vercel-id'] ? req.ip : '');
    if (!ip && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Không thể xác minh kết nối. Vui lòng thử lại sau.' });
    }
    const ticket = await createTicket({
      email,
      issue,
      ipHash: ip ? securityHash('ip', ip) : '',
    });
    res.status(201).json({
      success: true,
      ticket: { id: ticket._id, status: ticket.status }
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.ipHash) {
      return res.status(429).json({ error: 'Thiết bị mạng này đã gửi yêu cầu hỗ trợ.' });
    }
    console.error('Error creating support ticket:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST: Create a support ticket (khách vãng lai gửi từ trang /support)
router.post('/tickets', async (req, res) => {
  try {
    const { fullName, email, phone, issue, message } = req.body || {};
    const ticket = await createTicket({ fullName, email, phone, issue, message });
    res.status(201).json({
      success: true,
      ticket: { id: ticket._id, status: ticket.status }
    });
  } catch (err) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET: Fetch all support tickets (Admin Only - in real system would check auth)
router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalCount, pendingCount] = await Promise.all([
      SupportTicket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      SupportTicket.countDocuments(query),
      SupportTicket.countDocuments({ status: 'pending' })
    ]);

    res.json({
      tickets,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      },
      pendingCount
    });
  } catch (err) {
    console.error('Error fetching support tickets:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Resolve a support ticket
router.patch('/tickets/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body || {};

    const updateData = { status: 'resolved' };
    if (adminReply) {
      updateData.adminReply = adminReply;
      // Schema chỉ có `resolvedAt`; ghi `repliedAt` thì mongoose lặng lẽ bỏ đi
      // nên trước giờ không bản ghi nào có mốc thời gian trả lời.
      updateData.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, { new: true });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    if (adminReply) {
      import('../services/aiSupportAdminService.js')
        .then(({ recordAdminResolution }) => recordAdminResolution(id, adminReply))
        .catch(() => {});
    }

    res.json(ticket);
  } catch (err) {
    console.error('Error resolving support ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Admin reply to a support ticket
router.post('/tickets/:id/reply', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;
    if (!adminReply) {
      return res.status(400).json({ error: 'Nội dung phản hồi không được để trống' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        status: 'resolved',
        adminReply,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    // Trigger AI Self-Learning Loop
    import('../services/aiSupportAdminService.js')
      .then(({ recordAdminResolution }) => recordAdminResolution(id, adminReply))
      .catch(() => {});

    res.json(ticket);
  } catch (err) {
    console.error('Error replying to support ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
