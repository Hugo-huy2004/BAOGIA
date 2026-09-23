import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin, requireCustomer, signCustomerToken } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import CustomerProject from '../models/CustomerProject.js';
import { createProject, transitionProject, historyEntry } from '../services/projectService.js';
import { PROJECT_ID_PATTERN } from '../../shared/projectWorkflow.js';
import CustomerMessage from '../models/CustomerMessage.js';
import crypto from 'crypto';
import { isValidProjectPackage } from '../../shared/projectPackages.js';

const router = express.Router();

// Helper to generate 6 char random code

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
  delete obj.accessCode;
  delete obj.formToken;
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

    // Mã truy cập là bí mật nên `select: false` trong schema — phải xin lại rõ ràng.
    const project = await CustomerProject.findOne({ accessCode: loginCode.trim().toUpperCase() }).select('+accessCode');
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

    if (fullName) project.customer.fullName = fullName;
    if (phone) project.phone = phone;

    project.customer = {
      ...(project.customer?.toObject?.() || project.customer || {}),
      email: email !== undefined ? email : project.customer?.email,
      // `birthday` và `address` không còn trong hồ sơ dự án: chúng thuộc về tài
      // khoản người dùng, lưu hai nơi thì sớm muộn lệch nhau.
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
  } catch {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Get Messages
router.get('/:id/messages', requireCustomer, async (req, res) => {
  try {
    const messages = await CustomerMessage.find({ projectId: req.projectId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch {
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
    // Trạng thái nay là mã máy, không phải chữ tiếng Việt.
    if (['closed', 'cancelled'].includes(project.status)) {
      return res.status(403).json({ error: 'Dự án đã hoàn tất, không thể gửi thêm yêu cầu' });
    }

    const newMessage = await CustomerMessage.create({
      projectId: req.projectId,
      sender: req.customerRole,
      message: message.trim()
    });

    res.json(newMessage);
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Lỗi lấy danh sách dự án' });
  }
});

// Create new project
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { fullName, servicePackage, phone, email } = req.body;

    // Tên gói phải nằm trong danh mục dùng chung với trang quản trị. Không có
    // bước này thì một lần gõ nhầm sẽ nằm vĩnh viễn trong cơ sở dữ liệu và
    // hiện thẳng ra cổng khách.
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Thiếu tên khách hàng' });
    }
    if (servicePackage && !isValidProjectPackage(servicePackage)) {
      return res.status(400).json({ error: 'Gói dịch vụ không hợp lệ' });
    }

    // Mã dự án, mã truy cập và mã form đều do server sinh (xem projectService).
    const project = await createProject({
      name: String(fullName).trim(),
      packageId: servicePackage || '',
      customer: { fullName, email, phone },
      actorName: req.admin?.id || 'admin',
    });

    // Mã truy cập chỉ hiện ĐÚNG MỘT LẦN, ngay lúc tạo, để admin chuyển cho
    // khách. Sau đó `select: false` giữ nó khỏi mọi truy vấn thường.
    res.status(201).json({
      ...project.toObject(),
      accessCode: project.accessCode,
      requirementFormPath: `/du-an/yeu-cau/${project.formToken}`,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Lỗi tạo dự án' });
  }
});

// Lấy MỘT dự án. Nhận cả mã người-đọc (HG-2609-007) lẫn _id, vì địa chỉ trên
// thanh URL dùng mã người-đọc còn các endpoint tin nhắn vẫn dùng _id.
// Trước đây trang chi tiết tải TOÀN BỘ danh sách rồi lọc ở client — chính nó tự
// ghi chú "there's no GET /:id in backend yet". Giờ thì có.
router.get('/:idOrCode', requireAdmin, async (req, res) => {
  try {
    const { idOrCode } = req.params;
    const query = PROJECT_ID_PATTERN.test(idOrCode)
      ? { projectId: idOrCode }
      : (mongoose.Types.ObjectId.isValid(idOrCode) ? { _id: idOrCode } : null);
    if (!query) return res.status(400).json({ error: 'Mã dự án không hợp lệ' });

    const project = await CustomerProject.findOne(query);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Lỗi lấy dự án' });
  }
});

// Đổi trạng thái dự án. Đây là cửa DUY NHẤT — mọi bước nhảy đều qua máy trạng
// thái, mọi thay đổi đều để lại dấu vết trong `history`.
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const project = await CustomerProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    if (!status) {
      // Chỉ ghi chú, không đổi trạng thái.
      if (!note?.trim()) return res.status(400).json({ error: 'Không có gì để cập nhật' });
      project.history.push(historyEntry({
        actor: 'admin', actorName: req.admin?.id || 'admin',
        action: 'Ghi chú', note: note.trim(),
      }));
      await project.save();
      return res.json(project);
    }

    const { project: updated, shouldNotify } = await transitionProject(project, status, {
      actor: 'admin', actorName: req.admin?.id || 'admin', note: note || '',
    });

    // Thư gửi khách để ở bước sau (projectMailer); ở đây trả cờ ra để lớp gọi
    // biết có phải gửi không, và để phần kiểm thử không bắn thư thật.
    res.json({ ...updated.toObject(), shouldNotify });
  } catch (error) {
    if (['BAD_TRANSITION', 'SAME_STATUS', 'MISSING_SOURCE'].includes(error.code)) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Lỗi cập nhật dự án' });
  }
});

// Delete project
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await CustomerMessage.deleteMany({ projectId: req.params.id });
    await CustomerProject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Lỗi xóa dự án' });
  }
});

export default router;
