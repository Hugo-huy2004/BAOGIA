import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin, requireCustomer, signCustomerToken } from '../middleware/authMiddleware.js';
import CustomerProject from '../models/CustomerProject.js';
import CustomerMessage from '../models/CustomerMessage.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to generate 6 char random code
function generateLoginCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars hex
}

// A 6-hex loginCode is only 24 bits — throttle /auth per IP so the code space
// can't be brute-forced. 20 tries / 15 min in prod makes it infeasible.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần thử mã đăng nhập. Vui lòng thử lại sau 15 phút.' }
});

const CUSTOMER_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 14 * 24 * 60 * 60 * 1000
};

// The customer's own loginCode is a bearer secret — never echo it back to the
// portal (the session cookie replaces it). Admin routes keep the full doc.
function stripSecrets(projectDoc) {
  const obj = projectDoc.toObject ? projectDoc.toObject() : { ...projectDoc };
  delete obj.loginCode;
  return obj;
}

// ----------------------------------------------------
// PUBLIC ROUTES (Customer Portal)
// ----------------------------------------------------

// Login via Code — exchanges the loginCode for a project-scoped session cookie.
router.post('/auth', authLimiter, async (req, res) => {
  try {
    const { loginCode } = req.body;
    if (!loginCode) return res.status(400).json({ error: 'Mã đăng nhập là bắt buộc' });

    const project = await CustomerProject.findOne({ loginCode: loginCode.trim().toUpperCase() });
    if (!project) return res.status(401).json({ error: 'Mã đăng nhập không hợp lệ hoặc không tồn tại' });

    res.cookie('customer_jwt', signCustomerToken(project._id), CUSTOMER_COOKIE);
    res.json({ project: stripSecrets(project) });
  } catch (error) {
    console.error('Customer Auth Error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// From here down, identity comes from the session (req.projectId). The :id in
// the path is decorative for customers — they can only ever touch their own
// project; admins act on the project named by :id.
router.put('/:id/profile', requireCustomer, async (req, res) => {
  try {
    const { fullName, phone, birthday, email, address } = req.body;

    const project = await CustomerProject.findById(req.projectId);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    if (fullName) project.fullName = fullName;
    if (phone) project.phone = phone;

    project.customerProfile = {
      ...project.customerProfile,
      birthday: birthday !== undefined ? birthday : project.customerProfile.birthday,
      email: email !== undefined ? email : project.customerProfile.email,
      address: address !== undefined ? address : project.customerProfile.address
    };

    await project.save();
    res.json(stripSecrets(project));
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Get Unread Count — messages from the other party still unread.
router.get('/:id/messages/unread-count', requireCustomer, async (req, res) => {
  try {
    const other = req.customerRole === 'admin' ? 'customer' : 'admin';
    const count = await CustomerMessage.countDocuments({ projectId: req.projectId, sender: other, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Get Messages
router.get('/:id/messages', requireCustomer, async (req, res) => {
  try {
    const messages = await CustomerMessage.find({ projectId: req.projectId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Send Message — sender is derived from the session role, never the request
// body, so a customer can't post as 'admin' (studio impersonation).
router.post('/:id/messages', requireCustomer, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Tin nhắn rỗng' });

    const project = await CustomerProject.findById(req.projectId);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    // If project is completed, do not allow sending messages
    if (project.status === 'Hoàn tất') {
      return res.status(403).json({ error: 'Dự án đã hoàn tất, không thể gửi thêm yêu cầu' });
    }

    const newMessage = await CustomerMessage.create({
      projectId: req.projectId,
      sender: req.customerRole,
      message: message.trim()
    });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Mark messages as read — marks the other party's messages read.
router.put('/:id/messages/read', requireCustomer, async (req, res) => {
  try {
    const senderToMark = req.customerRole === 'admin' ? 'customer' : 'admin';

    await CustomerMessage.updateMany(
      { projectId: req.projectId, sender: senderToMark, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ----------------------------------------------------
// ADMIN ROUTES
// ----------------------------------------------------

// Get total unread count for admin
router.get('/unread-total', requireAdmin, async (req, res) => {
  try {
    const total = await CustomerMessage.countDocuments({ sender: 'customer', isRead: false });
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi' });
  }
});

// Get all projects with unread counts
router.get('/', requireAdmin, async (req, res) => {
  try {
    const projects = await CustomerProject.find().sort({ createdAt: -1 }).lean();
    
    // Fetch unread messages sent by customer
    const unreadCounts = await CustomerMessage.aggregate([
      { $match: { sender: 'customer', isRead: false } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    
    const countMap = {};
    unreadCounts.forEach(c => countMap[c._id.toString()] = c.count);
    
    projects.forEach(p => {
      p.unreadCount = countMap[p._id.toString()] || 0;
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách dự án' });
  }
});

// Create new project
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { fullName, servicePackage, phone, handlerName, handlerPhone } = req.body;
    
    // Generate unique code
    let loginCode;
    let isUnique = false;
    while (!isUnique) {
      loginCode = generateLoginCode();
      const existing = await CustomerProject.findOne({ loginCode });
      if (!existing) isUnique = true;
    }

    const project = await CustomerProject.create({
      fullName,
      servicePackage,
      phone,
      handlerName,
      handlerPhone,
      loginCode,
      status: 'Đang liên hệ',
      progressNotes: [{
        note: 'Dự án được khởi tạo và đang trong quá trình liên hệ.',
        status: 'Đang liên hệ',
        createdAt: new Date()
      }]
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Lỗi tạo dự án' });
  }
});

// Update project status & details
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, note, finalNote } = req.body;
    const project = await CustomerProject.findById(req.params.id);
    
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    let statusChanged = status && status !== project.status;
    let hasNote = note && note.trim().length > 0;

    if (statusChanged) {
      project.status = status;
    }

    if (statusChanged || hasNote) {
      project.progressNotes.push({
        note: hasNote ? note : `Cập nhật trạng thái sang ${status}`,
        status: status || project.status,
        createdAt: new Date()
      });
    }

    if (status === 'Hoàn tất' && finalNote !== undefined) {
      project.finalNote = finalNote;
      project.progressNotes.push({
        note: finalNote,
        status: 'Hỗ trợ và bảo trì',
        createdAt: new Date()
      });
    }

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật dự án' });
  }
});

// Delete project
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await CustomerMessage.deleteMany({ projectId: req.params.id });
    await CustomerProject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa dự án' });
  }
});

export default router;
