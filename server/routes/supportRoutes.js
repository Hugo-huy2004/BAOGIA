import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';

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
async function createTicket({ fullName, email, phone, issue, message }) {
  return SupportTicket.create({
    fullName: fullName?.trim() || 'Thành viên Hugo Studio',
    email: email || 'guest@hugowishpax.studio',
    phone: phone?.trim() || 'N/A',
    issue: issue || message || 'Cần hỗ trợ',
    status: 'pending'
  });
}

// POST: Create a support ticket (khách vãng lai gửi từ trang /support)
router.post('/tickets', async (req, res) => {
  try {
    const ticket = await createTicket(req.body || {});
    res.status(201).json({
      success: true,
      ticket: { id: ticket._id, status: ticket.status }
    });
  } catch (err) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Yêu cầu hỗ trợ của chính thành viên. Danh tính lấy từ JWT (`req.memberEmail`)
// chứ không phải email trong body — nếu tin body thì ai cũng đọc được hộp thư
// hỗ trợ của người khác chỉ bằng cách đổi một chuỗi.
router.get('/my-tickets', requireMember, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ email: req.memberEmail })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('issue status adminReply phone createdAt resolvedAt')
      .lean();
    res.json({
      tickets,
      pendingCount: tickets.filter((ticket) => ticket.status === 'pending').length,
    });
  } catch (err) {
    console.error('Error fetching member support tickets:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/my-tickets', requireMember, async (req, res) => {
  try {
    const { fullName, phone, issue, message } = req.body || {};
    const text = String(issue || message || '').trim();
    if (text.length < 10) {
      return res.status(400).json({ error: 'Nội dung yêu cầu quá ngắn.' });
    }

    const ticket = await createTicket({
      fullName,
      phone,
      issue: text.slice(0, 4000),
      email: req.memberEmail,
    });
    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        issue: ticket.issue,
        status: ticket.status,
        createdAt: ticket.createdAt,
      }
    });
  } catch (err) {
    console.error('Error creating member support ticket:', err);
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
