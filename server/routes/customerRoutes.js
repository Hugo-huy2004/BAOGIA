import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin, requireCustomer, signCustomerToken } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import CustomerProject from '../models/CustomerProject.js';
import { createProject, transitionProject, historyEntry, saveRequirements, toCustomerView } from '../services/projectService.js';
import { PROJECT_ID_PATTERN } from '../../shared/projectWorkflow.js';
import CustomerMessage from '../models/CustomerMessage.js';
import { isEmailDeliverable, sendCustomEmail } from '../services/emailService.js';
import crypto from 'crypto';
import { isValidProjectPackage } from '../../shared/projectPackages.js';
import { CHECK_ITEMS, generateBacklog } from '../../shared/projectPhases.js';
import { openQuestions, QUESTION_IDS } from '../../shared/projectScope.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import '../utils/cloudinary.js';
import {
  addLedgerEntry, updateLedgerEntry, addWorklog, addWarrantyClaim, resolveWarrantyClaim,
  startMaintenance, stopMaintenance, verifyMaintenancePayment, acceptContract,
  customerPickAddons, recordTermination, bumpContract,
} from '../services/projectContractService.js';

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

// Khách mở cổng bằng link riêng (/customer-portal/<mã truy cập>) — sau /auth,
// danh tính nằm trong cookie. Hai route dưới đây CHỈ dành cho khách: admin không
// có "dự án của tôi", admin thao tác qua /:id.
const customerOnly = (req, res, next) => (req.customerRole === 'customer'
  ? next() : res.status(403).json({ error: 'Chỉ dành cho khách hàng của dự án' }));

router.get('/me', requireCustomer, customerOnly, async (req, res) => {
  try {
    const project = await CustomerProject.findById(req.projectId);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.json(toCustomerView(project));
  } catch (error) {
    console.error('Customer me error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Khách nộp hoặc sửa phiếu yêu cầu. Lần nộp ĐẦU khi dự án đang chờ phiếu thì máy
// tự chuyển sang "Đã nhận yêu cầu" — khách không phải báo, admin không phải bấm.
router.put('/me/requirements', requireCustomer, customerOnly, async (req, res) => {
  try {
    const project = await CustomerProject.findById(req.projectId);
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    const input = req.body?.requirements;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return res.status(400).json({ error: 'Phiếu yêu cầu không hợp lệ' });
    }
    const first = !project.requirementsSubmittedAt;
    await saveRequirements(project, input, { actor: 'customer', actorName: project.customer?.fullName || '' });
    if (first && project.status === 'awaiting_requirements') {
      await transitionProject(project, 'requirements_submitted', {
        actor: 'system', note: 'Khách đã nộp phiếu yêu cầu qua cổng dự án.',
      });
    }
    res.json(toCustomerView(project));
  } catch (error) {
    if (['SCOPE_LOCKED', 'EDIT_LIMIT'].includes(error.code)) return res.status(409).json({ error: error.message });
    console.error('Save requirements error:', error);
    res.status(500).json({ error: 'Lỗi lưu phiếu yêu cầu' });
  }
});

/**
 * Chạy một thao tác trên dự án rồi lưu MỘT lần. Lỗi nghiệp vụ (code) trả nguyên
 * văn cho người dùng đọc, không nuốt thành "có lỗi xảy ra".
 */
const ERROR_STATUS = { GATE: 409, BAD_INPUT: 400, NOT_FOUND: 404, BAD_TRANSITION: 409, SAME_STATUS: 409, MISSING_SOURCE: 409, SCOPE_LOCKED: 409, EDIT_LIMIT: 409 };
function projectAction(fn, { customer = false } = {}) {
  return async (req, res) => {
    try {
      const id = customer ? req.projectId : req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Mã dự án không hợp lệ' });
      const project = await CustomerProject.findById(id);
      if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
      const actorName = customer ? (project.customer?.fullName || '') : (req.admin?.id || 'admin');
      const extra = await fn(project, req, actorName);
      await project.save();
      res.json({ project: customer ? toCustomerView(project) : project, ...(extra || {}) });
    } catch (error) {
      if (ERROR_STATUS[error.code]) return res.status(ERROR_STATUS[error.code]).json({ error: error.message });
      console.error('Project action error:', error);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  };
}

// Khách xác nhận hợp đồng ở phiên bản hiện tại (giao kết điện tử).
router.post('/me/contract/accept', requireCustomer, customerOnly, projectAction((project, req) => {
  acceptContract(project, {
    name: req.body?.name,
    ip: (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim(),
    userAgent: req.headers['user-agent'] || '',
  });
}, { customer: true }));

router.post('/me/warranty/claims', requireCustomer, customerOnly, projectAction((project, req, actorName) => {
  const code = addWarrantyClaim(project, { description: req.body?.description, reportedBy: 'customer', actorName });
  return { code };
}, { customer: true }));

router.post('/me/addons', requireCustomer, customerOnly, projectAction((project, req) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  return { picked: customerPickAddons(project, ids) };
}, { customer: true }));

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
    const { fullName, servicePackage, phone, email, market } = req.body;

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
      market: market === 'international' ? 'international' : 'domestic',
      customer: { fullName, email, phone },
      actorName: req.admin?.id || 'admin',
    });

    // Mã truy cập chỉ hiện ĐÚNG MỘT LẦN, ngay lúc tạo, để admin chuyển cho
    // khách. Sau đó `select: false` giữ nó khỏi mọi truy vấn thường.
    res.status(201).json({
      ...project.toObject(),
      accessCode: project.accessCode,
      portalPath: `/customer-portal/${project.accessCode}`,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Lỗi tạo dự án' });
  }
});

// Link khách bấm là vào thẳng cổng dự án, không phải nhập mã. Mã truy cập là bí
// mật (`select: false`) nên chỉ admin xin được, và xin qua route riêng này.
router.get('/:id/share', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Mã dự án không hợp lệ' });
    const project = await CustomerProject.findById(req.params.id).select('+accessCode projectId');
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.json({ path: `/customer-portal/${project.accessCode}`, projectId: project.projectId });
  } catch (error) {
    console.error('Share link error:', error);
    res.status(500).json({ error: 'Lỗi lấy link dự án' });
  }
});

// ── Giai đoạn: ô tích tay + backlog Scrum ──
const bad = (message) => Object.assign(new Error(message), { code: 'BAD_INPUT' });

// Chỉ điều kiện `manual` được tích tay; điều kiện tự động do dữ liệu quyết định.
router.post('/:id/checklist', requireAdmin, projectAction((project, req, actorName) => {
  const { itemId, done } = req.body || {};
  const item = CHECK_ITEMS[itemId];
  if (!item?.manual) throw bad('Điều kiện này hệ thống tự kiểm, không tích tay được.');
  project.checklist = { ...(project.checklist || {}), [itemId]: { done: Boolean(done), at: new Date(), by: actorName } };
  project.markModified('checklist');
  project.history.push(historyEntry({ actor: 'admin', actorName, action: done ? 'Xong điều kiện' : 'Bỏ tích điều kiện', note: item.label }));
}));

// ── Bản phạm vi công việc (Phụ lục A) ──
const txt = (v, n) => String(v ?? '').trim().slice(0, n);
const lines = (v) => (Array.isArray(v) ? v : []).map((x) => txt(x, 300)).filter(Boolean).slice(0, 20);
const scopeLocked = () => Object.assign(new Error('Phạm vi đã chốt. Việc ngoài phạm vi ghi thành phát sinh ở thẻ "Tiền & phát sinh".'), { code: 'SCOPE_LOCKED' });

// Mỗi lần lưu là một phiên bản hợp đồng mới: khách phải xác nhận lại bản có phạm vi này.
router.put('/:id/scope', requireAdmin, projectAction((project, req, actorName) => {
  if (project.scopeLockedAt) throw scopeLocked();
  const b = req.body || {};
  const answers = {};
  for (const id of QUESTION_IDS) if (txt(b.answers?.[id], 1000)) answers[id] = txt(b.answers[id], 1000);
  const scope = {
    objective: txt(b.objective, 500),
    kpis: (Array.isArray(b.kpis) ? b.kpis : []).slice(0, 5).map((k) => ({ metric: txt(k?.metric, 200), baseline: txt(k?.baseline, 200), target: txt(k?.target, 200), measure: txt(k?.measure, 200) })).filter((k) => k.metric),
    persona: txt(b.persona, 1500),
    journey: txt(b.journey, 500),
    pages: (Array.isArray(b.pages) ? b.pages : []).slice(0, 30).map((p) => ({ name: txt(p?.name, 80), purpose: txt(p?.purpose, 400), primaryAction: txt(p?.primaryAction, 200), acceptance: txt(p?.acceptance, 400) })).filter((p) => p.name),
    features: (Array.isArray(b.features) ? b.features : []).slice(0, 40).map((f) => ({ name: txt(f?.name, 120), moscow: ['must', 'should', 'could'].includes(f?.moscow) ? f.moscow : 'should', acceptance: txt(f?.acceptance, 400) })).filter((f) => f.name),
    outOfScope: lines(b.outOfScope),
    assumptions: lines(b.assumptions),
    risks: lines(b.risks),
    answers,
  };
  if (!scope.objective) throw bad('Ghi mục tiêu dự án.');
  bumpContract(project, 'Cập nhật bản phạm vi công việc (Phụ lục A)');
  project.scope = { ...scope, savedAt: new Date(), savedBy: actorName, contractVersion: project.contract.version };
  project.markModified('scope');
  project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Lưu bản phạm vi công việc', note: `${scope.pages.length} trang · ${scope.features.length} tính năng · hợp đồng phiên bản ${project.contract.version}` }));
}));

// Gửi những câu còn mơ hồ vào khung trao đổi, theo ngôn ngữ hợp đồng của khách.
router.post('/:id/scope/ask', requireAdmin, projectAction(async (project, req, actorName) => {
  if (project.scopeLockedAt) throw scopeLocked();
  const pick = Array.isArray(req.body?.ids) ? req.body.ids : null;
  const qs = openQuestions(project).filter((q) => !pick || pick.includes(q.id));
  const extra = txt(req.body?.extra, 1000);
  if (!qs.length && !extra) throw bad('Không còn câu hỏi nào để gửi.');
  const intl = project.market === 'international';
  const items = [...qs.map((q) => (intl ? q.en : q.q)), ...(extra ? [extra] : [])];
  const message = (intl
    ? 'To lock the scope correctly, please answer the questions below. Short answers are fine.\n\n'
    : 'Để chốt phạm vi đúng ý, kính mời Quý khách trả lời các câu dưới đây. Trả lời ngắn cũng được ạ.\n\n')
    + items.map((x, i) => `${i + 1}. ${x}`).join('\n');
  await CustomerMessage.create({ projectId: project._id, sender: 'admin', message: message.slice(0, 4000) });
  project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Gửi câu hỏi làm rõ yêu cầu', note: `${items.length} câu` }));
  return { sent: items.length };
}));

// BA chia việc: sinh backlog từ phiếu yêu cầu. Chỉ khi backlog đang trống, để
// không đè lên việc admin đã sắp.
router.post('/:id/backlog/generate', requireAdmin, projectAction((project, req, actorName) => {
  if ((project.backlog || []).length) throw bad('Backlog đã có. Thêm việc lẻ bằng ô "Thêm việc".');
  const tasks = generateBacklog(project);
  project.backlog = tasks;
  project.currentSprint = 1;
  const sprints = Math.max(...tasks.map((t) => t.sprint));
  project.history.push(historyEntry({ actor: 'system', actorName, action: 'Chia việc tự động', note: `${tasks.length} việc · ${sprints} sprint` }));
}));

router.post('/:id/backlog', requireAdmin, projectAction((project, req, actorName) => {
  const title = String(req.body?.title || '').trim().slice(0, 200);
  if (title.length < 3) throw bad('Ghi tên việc.');
  const moscow = ['must', 'should', 'could'].includes(req.body?.moscow) ? req.body.moscow : 'should';
  project.backlog.push({ title, moscow, points: Math.min(8, Math.max(1, Number(req.body?.points) || 2)), sprint: project.currentSprint || 1, detail: String(req.body?.detail || '').slice(0, 1000) });
  project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Thêm việc vào backlog', note: title }));
}));

router.patch('/:id/backlog/:taskId', requireAdmin, projectAction((project, req, actorName) => {
  const task = project.backlog.id(req.params.taskId);
  if (!task) throw Object.assign(new Error('Không tìm thấy việc.'), { code: 'NOT_FOUND' });
  const { state, remove } = req.body || {};
  if (remove) {
    if (task.state === 'done') throw bad('Việc đã xong thì giữ lại để làm bằng chứng.');
    task.deleteOne();
    project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Bỏ việc khỏi backlog', note: task.title }));
    return;
  }
  if (!['todo', 'doing', 'review', 'done'].includes(state)) throw bad('Trạng thái việc không hợp lệ.');
  task.state = state;
  task.doneAt = state === 'done' ? new Date() : null;
  if (state === 'done') project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Xong việc', note: task.title }));
}));

// Đóng sprint: việc chưa xong của sprint này dời sang sprint sau (không mất việc).
router.post('/:id/sprint/next', requireAdmin, projectAction((project, req, actorName) => {
  const current = project.currentSprint || 1;
  let moved = 0;
  for (const t of project.backlog) if (t.sprint === current && t.state !== 'done') { t.sprint = current + 1; moved += 1; }
  project.currentSprint = current + 1;
  project.history.push(historyEntry({ actor: 'admin', actorName, action: `Đóng sprint ${current}`, note: moved ? `Dời ${moved} việc chưa xong sang sprint ${current + 1}` : 'Xong trọn sprint' }));
}));

// ── Hợp đồng · sổ chi phí · nhật ký · bảo hành · duy trì · bàn giao · chấm dứt ──
router.post('/:id/ledger', requireAdmin, projectAction((project, req, actorName) => {
  addLedgerEntry(project, req.body || {}, { actor: 'admin', actorName });
}));

router.patch('/:id/ledger/:entryId', requireAdmin, projectAction((project, req, actorName) => {
  updateLedgerEntry(project, req.params.entryId, req.body || {}, { actorName });
}));

router.post('/:id/worklog', requireAdmin, projectAction((project, req, actorName) => {
  addWorklog(project, req.body || {}, { actorName });
}));

router.post('/:id/warranty/claims', requireAdmin, projectAction((project, req, actorName) => {
  return { code: addWarrantyClaim(project, { description: req.body?.description, reportedBy: 'admin', actorName }) };
}));

router.patch('/:id/warranty/claims/:claimId', requireAdmin, projectAction((project, req, actorName) => {
  resolveWarrantyClaim(project, req.params.claimId, { ...(req.body || {}), actorName });
}));

router.post('/:id/maintenance', requireAdmin, projectAction((project, req, actorName) => {
  const { action, amount, note, fee } = req.body || {};
  if (action === 'start') { startMaintenance(project, { actorName, fee: fee === undefined || fee === '' ? undefined : Number(fee) }); bumpContract(project, 'Bắt đầu gói duy trì'); }
  else if (action === 'stop') stopMaintenance(project, { actorName, reason: note });
  else if (action === 'verify') verifyMaintenancePayment(project, { amount, note, actorName });
  else throw Object.assign(new Error('Thao tác duy trì không hợp lệ.'), { code: 'BAD_INPUT' });
}));

/**
 * Chấm dứt do khách vi phạm. Điều 428 BLDS: bên chấm dứt phải THÔNG BÁO NGAY cho
 * bên kia — nên thông báo luôn được đăng vào cổng dự án (có dấu thời gian), và
 * gửi thêm email nếu SendGrid đã cấu hình. Trả về kênh nào đã gửi, để admin biết
 * có cần báo thêm qua Zalo/email thủ công hay không.
 */
router.post('/:id/terminate', requireAdmin, projectAction(async (project, req, actorName) => {
  recordTermination(project, { clause: req.body?.clause, reason: req.body?.reason, actorName });
  await transitionProject(project, 'terminated', {
    actor: 'admin', actorName, note: `${req.body?.clause} — ${String(req.body?.reason || '').slice(0, 300)}`,
  });
  const intl = project.market === 'international';
  const when = new Date().toLocaleString(intl ? 'en-GB' : 'vi-VN');
  const notice = intl
    ? `NOTICE OF TERMINATION — Project ${project.projectId}. Under Article 11.2 ${req.body?.clause} of the Agreement, Hugo Studio terminates the Agreement effective ${when}. Reason: ${req.body?.reason}. Work and care stop from this time; amounts owed remain payable. The full record is in your Project Portal. You may respond or dispute this by email within 15 days.`
    : `THÔNG BÁO CHẤM DỨT HỢP ĐỒNG — Dự án ${project.projectId}. Căn cứ Điều 11.2 khoản ${req.body?.clause} của hợp đồng, Hugo Studio chấm dứt hợp đồng có hiệu lực từ ${when}. Lý do: ${req.body?.reason}. Kể từ thời điểm này, việc thực hiện và duy trì dừng lại; các khoản còn nợ vẫn phải thanh toán. Toàn bộ hồ sơ nằm trong Cổng dự án của Quý khách. Quý khách có quyền phản hồi hoặc khiếu nại qua email trong 15 ngày.`;
  await CustomerMessage.create({ projectId: project._id, sender: 'admin', message: notice });
  let emailSent = false;
  if (isEmailDeliverable() && project.customer?.email) {
    try {
      await sendCustomEmail(project.customer.email, intl ? `Notice of termination — ${project.projectId}` : `Thông báo chấm dứt hợp đồng — ${project.projectId}`, `<p>${notice.replace(/</g, '&lt;')}</p>`);
      emailSent = true;
    } catch (err) { console.error('Termination email failed:', err.message); }
  }
  project.history.push(historyEntry({ actor: 'system', action: 'Gửi thông báo chấm dứt', note: emailSent ? 'Cổng dự án + email' : 'Cổng dự án (email chưa cấu hình hoặc gửi lỗi)' }));
  return { notice: { portal: true, email: emailSent } };
}));

/**
 * Bàn giao mã nguồn: tải tệp .ZIP lên kho tệp, hoặc dán đường dẫn nếu tệp lớn
 * hơn giới hạn kho. Mã kiểm tra SHA-256 tính TẠI MÁY CHỦ từ chính tệp — đó là
 * căn cứ đối chiếu "mã đã bị sửa" khi bảo hành.
 */
const zipUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
router.post('/:id/source', requireAdmin, zipUpload.single('file'), projectAction(async (project, req, actorName) => {
  let file;
  if (req.file) {
    if (!/\.zip$/i.test(req.file.originalname)) throw Object.assign(new Error('Chỉ nhận tệp .zip'), { code: 'BAD_INPUT' });
    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'raw', folder: `hugo_wishpax/projects/${project.projectId}`,
        public_id: `${crypto.randomBytes(12).toString('hex')}-${req.file.originalname.replace(/[^\w.-]+/g, '_')}`,
      }, (err, out) => (err ? reject(err) : resolve(out))).end(req.file.buffer);
    }).catch((err) => {
      throw Object.assign(new Error(`Chưa tải được lên kho tệp (${err.message || 'lỗi kho'}). Dán đường dẫn tệp ZIP thay thế.`), { code: 'BAD_INPUT' });
    });
    file = { fileUrl: uploaded.secure_url, fileName: req.file.originalname, sizeBytes: req.file.size, checksum, notes: req.body?.notes || '' };
  } else {
    const url = String(req.body?.fileUrl || '').trim();
    if (!/^https:\/\//.test(url)) throw Object.assign(new Error('Tải tệp .zip lên hoặc dán đường dẫn https.'), { code: 'BAD_INPUT' });
    file = { fileUrl: url, fileName: req.body?.fileName || 'source.zip', sizeBytes: Number(req.body?.sizeBytes) || 0, checksum: String(req.body?.checksum || '').trim(), notes: req.body?.notes || '' };
  }
  project.sourceDelivery = { ...file, uploadedAt: new Date() };
  project.history.push(historyEntry({ actor: 'admin', actorName, action: 'Tải lên mã nguồn', note: `${file.fileName}${file.checksum ? ` · SHA-256 ${file.checksum.slice(0, 12)}…` : ''}` }));
  // Bản bàn giao mới thay bản cũ làm căn cứ bảo hành.
  if (project.warranty?.startsAt) project.warranty.checksum = file.checksum;
  bumpContract(project, `Bản bàn giao: ${file.fileName}`);
}));

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

    // Mọi bước đều phải có nội dung chi tiết — nó đi thẳng vào Phụ lục C của hợp đồng.
    if (String(note || '').trim().length < 10) {
      return res.status(400).json({ error: 'Ghi nội dung chi tiết cho bước này (ít nhất một câu): đã làm gì, bàn giao gì, khách cần làm gì.' });
    }
    const { project: updated, shouldNotify } = await transitionProject(project, status, {
      actor: 'admin', actorName: req.admin?.id || 'admin', note: note || '',
    });

    // Thư gửi khách để ở bước sau (projectMailer); ở đây trả cờ ra để lớp gọi
    // biết có phải gửi không, và để phần kiểm thử không bắn thư thật.
    res.json({ ...updated.toObject(), shouldNotify });
  } catch (error) {
    if (['BAD_TRANSITION', 'SAME_STATUS', 'MISSING_SOURCE', 'GATE'].includes(error.code)) {
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
