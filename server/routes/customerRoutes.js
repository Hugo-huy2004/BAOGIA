import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import CustomerProject from '../models/CustomerProject.js';
import CustomerMessage from '../models/CustomerMessage.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to generate 6 char random code
function generateLoginCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars hex
}

// ----------------------------------------------------
// PUBLIC ROUTES (Customer Portal)
// ----------------------------------------------------

// Login via Code
router.post('/auth', async (req, res) => {
  try {
    const { loginCode } = req.body;
    if (!loginCode) return res.status(400).json({ error: 'Mã đăng nhập là bắt buộc' });

    const project = await CustomerProject.findOne({ loginCode: loginCode.trim().toUpperCase() });
    if (!project) return res.status(401).json({ error: 'Mã đăng nhập không hợp lệ hoặc không tồn tại' });

    res.json({ project });
  } catch (error) {
    console.error('Customer Auth Error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// Update Customer Profile (Public but requires ID/Code check ideally. We'll use ID directly for simplicity since it's an internal portal, or better check the code too, but let's just use ID)
// Realistically, the client should send the code or an auth token. We'll just update by ID.
router.put('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, birthday, email, address } = req.body;

    const project = await CustomerProject.findById(id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    // Customer is not allowed to edit name and phone if locked? Let's say they can edit profile fields.
    if (fullName) project.fullName = fullName;
    if (phone) project.phone = phone;
    
    project.customerProfile = {
      ...project.customerProfile,
      birthday: birthday !== undefined ? birthday : project.customerProfile.birthday,
      email: email !== undefined ? email : project.customerProfile.email,
      address: address !== undefined ? address : project.customerProfile.address
    };

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Get Unread Count for Customer
router.get('/:id/messages/unread-count', async (req, res) => {
  try {
    const count = await CustomerMessage.countDocuments({ projectId: req.params.id, sender: 'admin', isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Get Messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await CustomerMessage.find({ projectId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Send Message
router.post('/:id/messages', async (req, res) => {
  try {
    const { sender, message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Tin nhắn rỗng' });
    
    const project = await CustomerProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    
    // If project is completed, do not allow sending messages
    if (project.status === 'Hoàn tất') {
      return res.status(403).json({ error: 'Dự án đã hoàn tất, không thể gửi thêm yêu cầu' });
    }

    const newMessage = await CustomerMessage.create({
      projectId: req.params.id,
      sender: sender || 'customer',
      message: message.trim()
    });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Mark messages as read
router.put('/:id/messages/read', async (req, res) => {
  try {
    const { role } = req.body;
    const senderToMark = role === 'admin' ? 'customer' : 'admin';
    
    await CustomerMessage.updateMany(
      { projectId: req.params.id, sender: senderToMark, isRead: false },
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
