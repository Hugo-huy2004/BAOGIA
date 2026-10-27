// Đăng nhập, phiên và tài khoản quản trị — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Admin from '../../models/Admin.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { JWT_SECRET } from '../../utils/secrets.js';
import { ADMIN_PERMISSIONS, ADMIN_ROLES, resolveAdminPermissions } from '../../../shared/adminAccess.js';
import { sha256, TIMING_PAD_HASH, verifyAndUpgrade, adminLoginLimiter, otpVerifyLimiter, issueAdminOtp, ownerOnly, publicAdmin, auditAdminAccount, logAdminAuditAction } from './adminShared.js';

const router = express.Router();

// Đã xoá POST /api/admin/request-otp.
//
// Nó phát OTP cho BẤT KỲ AI gọi, không cần mật khẩu — nên toàn bộ bảo mật
// admin rút gọn thành đoán 6 chữ số (900.000 khả năng), với trần chặn tính
// theo IP. Một pool proxy vài nghìn địa chỉ đoán ra trong vài giờ. Tệ hơn:
// mỗi lần gọi gửi một tin Telegram, nhưng Telegram giới hạn ~1 tin/giây/chat
// nên khi tấn công tăng quy mô thì tin ngừng tới — mã VẪN phát ra và vẫn hợp
// lệ. Cuộc tấn công càng mạnh càng im lặng.
//
// /login bên dưới đã làm đúng việc này: mật khẩu ĐÚNG rồi mới phát OTP.
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    let matchingAdmin = null;

    if (username && typeof username === 'string') {
      // Bản ghi Admin lưu username dưới dạng BĂM tra cứu SHA-256 (xem phần seed
      // trong server.js), còn chỗ này lại đi tìm đúng chữ người dùng gõ — nên
      // findOne luôn trượt và mọi lượt đăng nhập đều trả 401, kể cả khi mật
      // khẩu đúng. Tìm theo cả ba dạng: băm của chữ gõ nguyên văn, băm của bản
      // viết thường, và chữ trần cho tài khoản tạo từ trước quy ước băm.
      const raw = username.trim();
      const cleanUser = raw.toLowerCase();
      const lookups = [...new Set([
        crypto.createHash('sha256').update(raw).digest('hex'),
        crypto.createHash('sha256').update(cleanUser).digest('hex'),
        cleanUser,
      ])];
      const adminCandidate = await Admin.findOne({ username: { $in: lookups } });
      if (adminCandidate && adminCandidate.active !== false) {
        if (await verifyAndUpgrade(adminCandidate, password)) matchingAdmin = adminCandidate;
      } else {
        // Không có tài khoản (hoặc đã khoá): vẫn tốn đúng một lượt bcrypt như
        // khi có, để thời gian phản hồi không lộ tên đăng nhập nào là thật.
        await bcrypt.compare(String(password), TIMING_PAD_HASH);
      }
    } else {
      // Bắt buộc có tên đăng nhập. Nhánh cũ bỏ trống username thì duyệt MỌI
      // bản ghi admin và bcrypt.compare từng cái — 12 vòng ≈ 250ms mỗi lần,
      // nên một request rỗng ghim CPU nhiều giây trên Render free. Nó cũng thu
      // hẹp thông tin cần đoán xuống chỉ còn mật khẩu.
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập.' });
    }

    if (!matchingAdmin) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Đường mật khẩu vẫn giữ làm lối vào dự phòng khi Telegram hỏng, nhưng nó
    // cũng phải qua đúng một cửa OTP như nút "Gửi mã" ở trang đăng nhập.
    const { tempToken, delivered, expiresIn } = await issueAdminOtp(matchingAdmin);
    return res.json({
      success: true,
      requireOtp: true,
      tempToken,
      otpDelivered: delivered,
      expiresIn,
      message: delivered
        ? 'Đã gửi mã 6 chữ số — dùng trong 30 giây.'
        : 'Không gửi được mã. Xem mã trong log máy chủ.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verify-otp  { tempToken, otpCode }
router.post('/verify-otp', otpVerifyLimiter, async (req, res) => {
  try {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã OTP 6 chữ số.' });
    }

    if (!global.ADMIN_2FA_OTPS || !global.ADMIN_2FA_OTPS.has(tempToken)) {
      return res.status(400).json({ error: 'Phiên đăng nhập đã hết hạn. Hãy yêu cầu mã OTP mới.' });
    }

    const record = global.ADMIN_2FA_OTPS.get(tempToken);
    if (Date.now() > record.expiresAt) {
      global.ADMIN_2FA_OTPS.delete(tempToken);
      return res.status(400).json({ error: 'Mã OTP đã hết hạn (quá 30 giây). Hãy bấm gửi lại mã.' });
    }

    if (String(otpCode).trim() !== String(record.otpCode)) {
      // OTP giờ là lớp bảo vệ duy nhất, nên phải có trần số lần đoán: không có
      // nó thì 5 phút đủ để thử hết mọi mã 6 chữ số bằng script.
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        global.ADMIN_2FA_OTPS.delete(tempToken);
        return res.status(429).json({ error: 'Sai mã 5 lần. Mã đã bị huỷ — hãy yêu cầu mã mới.' });
      }
      return res.status(401).json({ error: `Mã OTP không chính xác (còn ${5 - record.attempts} lần thử).` });
    }

    // OTP Verified successfully -> Issue 14-day Admin JWT
    global.ADMIN_2FA_OTPS.delete(tempToken);

    // requireAdmin đã có sẵn phần đối chiếu uaHash, nhưng CHỈ chạy khi token
    // mang trường đó — mà trước giờ không chỗ nào ký nó vào token admin, nên
    // lớp ràng buộc thiết bị là code chết. Nghịch lý: thành viên thường
    // (signMemberToken) có ràng buộc, còn admin — mục tiêu giá trị hơn hẳn —
    // thì không. Ký vào đây để token bị lấy cắp không dùng được ở máy khác.
    const uaHash = crypto
      .createHash('sha256')
      .update(req.headers['user-agent'] || '')
      .digest('hex');

    const token = jwt.sign(
      { id: record.adminId, role: 'admin', uaHash },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });

    try {
      const AdminAuditLog = (await import('../../models/AdminAuditLog.js')).default;
      await AdminAuditLog.create({
        adminId: String(record.adminId),
        adminUsername: record.adminUsername,
        action: 'login_2fa_telegram',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (e) {
      console.error('[AdminAuditLog login 2fa]', e.message);
    }

    res.json({
      success: true,
      token,
      admin: {
        id: record.adminId,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout route
router.post('/logout', requireAdmin, async (req, res) => {
  res.clearCookie('jwt');
  // Đẩy mốc thu hồi: xoá cookie chỉ dọn TRÌNH DUYỆT NÀY, token đã bị chép ra
  // vẫn sống tới hết 14 ngày. Đăng xuất giờ cắt mọi phiên admin đang mở.
  try {
    await Admin.findByIdAndUpdate(req.admin.id, { sessionsValidFrom: new Date() });
  } catch (error) {
    console.error('[admin logout revoke]', error.message);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify session route
router.get('/verify-session', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

router.get('/accounts', requireAdmin, ownerOnly, async (_req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 }).lean();
    res.json({
      admins: admins.map(publicAdmin),
      roles: ADMIN_ROLES,
      permissions: ADMIN_PERMISSIONS,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/accounts', requireAdmin, ownerOnly, async (req, res) => {
  try {
    const loginName = String(req.body?.loginName || '').trim().toLowerCase();
    const displayName = String(req.body?.displayName || '').trim();
    const password = String(req.body?.password || '');
    const role = String(req.body?.role || 'viewer');
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    if (!/^[a-z0-9._-]{4,50}$/.test(loginName)) {
      return res.status(400).json({ error: 'Tên đăng nhập cần 4–50 ký tự: chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.' });
    }
    if (!displayName) return res.status(400).json({ error: 'Vui lòng nhập tên hiển thị.' });
    if (password.length < 10) return res.status(400).json({ error: 'Mật khẩu cần ít nhất 10 ký tự.' });
    if (!ADMIN_ROLES[role]) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });

    const username = sha256(loginName);
    if (await Admin.exists({ username })) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });
    const admin = await Admin.create({
      username,
      displayName,
      password: await bcrypt.hash(password, 12),
      role,
      permissions: role === 'owner' ? [] : resolveAdminPermissions(role, permissions),
      active: true,
    });
    await auditAdminAccount(req, 'admin_account_created', `${displayName}:${role}`);
    res.status(201).json({ admin: publicAdmin(admin) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/accounts/:id', requireAdmin, ownerOnly, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản quản trị.' });
    const role = req.body?.role === undefined ? admin.role : String(req.body.role);
    if (!ADMIN_ROLES[role]) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
    // Danh sách rỗng chỉ hợp lệ khi đổi vai trò (= dùng mặc định của vai trò mới).
    // Bỏ hết quyền mà giữ vai trò thì resolveAdminPermissions sẽ hiểu thành "mặc
    // định" và cấp lại đủ quyền — ngược hẳn ý người bấm.
    if (req.body?.role === undefined && Array.isArray(req.body?.permissions) && req.body.permissions.length === 0 && role !== 'owner') {
      return res.status(400).json({ error: 'Tài khoản cần ít nhất một quyền. Muốn chặn hẳn, hãy khóa tài khoản.' });
    }
    if (String(admin._id) === String(req.admin.id) && (role !== 'owner' || req.body?.active === false)) {
      return res.status(400).json({ error: 'Bạn không thể tự hạ quyền hoặc khóa tài khoản đang đăng nhập.' });
    }
    if (admin.role === 'owner' && role !== 'owner' && await Admin.countDocuments({ role: 'owner', active: { $ne: false } }) <= 1) {
      return res.status(400).json({ error: 'Hệ thống phải còn ít nhất một Chủ hệ thống đang hoạt động.' });
    }
    if (req.body?.displayName !== undefined) admin.displayName = String(req.body.displayName).trim().slice(0, 80);
    if (req.body?.active !== undefined) admin.active = Boolean(req.body.active);
    admin.role = role;
    admin.permissions = role === 'owner' ? [] : resolveAdminPermissions(role, Array.isArray(req.body?.permissions) ? req.body.permissions : admin.permissions);
    if (req.body?.password) {
      const password = String(req.body.password);
      if (password.length < 10) return res.status(400).json({ error: 'Mật khẩu cần ít nhất 10 ký tự.' });
      admin.password = await bcrypt.hash(password, 12);
      admin.sessionsValidFrom = new Date();
    }
    await admin.save();
    await auditAdminAccount(req, 'admin_account_updated', `${admin.displayName}:${admin.role}`);
    res.json({ admin: publicAdmin(admin) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/accounts/:id', requireAdmin, ownerOnly, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản quản trị.' });
    if (String(admin._id) === String(req.admin.id)) return res.status(400).json({ error: 'Bạn không thể xóa tài khoản đang đăng nhập.' });
    if (admin.role === 'owner' && await Admin.countDocuments({ role: 'owner', active: { $ne: false } }) <= 1) {
      return res.status(400).json({ error: 'Hệ thống phải còn ít nhất một Chủ hệ thống đang hoạt động.' });
    }
    await admin.deleteOne();
    await auditAdminAccount(req, 'admin_account_deleted', admin.displayName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify password route
router.post('/verify-password', requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Mật khẩu là bắt buộc' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản admin' });
    }

    if (!(await verifyAndUpgrade(admin, password))) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Change admin password route (Wipes all old passwords & sets new bcrypt hash)
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản admin' });
    }

    if (!(await verifyAndUpgrade(admin, currentPassword))) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    // Completely wipe old password hash & save fresh 12-round bcrypt hash
    admin.password = await bcrypt.hash(newPassword, 12);
    // Đổi mật khẩu mà phiên cũ vẫn chạy thì việc đổi gần như vô nghĩa khi lý do
    // đổi là NGHI BỊ LỘ. Cắt hết, kể cả phiên đang thao tác.
    admin.sessionsValidFrom = new Date();
    admin.markModified('password');
    await admin.save();

    res.json({ success: true, message: 'Đã xóa toàn bộ mật khẩu cũ và cập nhật mật khẩu mới thành công!' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /admin/account-settings - Đổi mật khẩu & Cấu hình tài khoản Admin
router.put('/account-settings', requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword, adminEmail } = req.body;
    const adminId = req.admin?.id;

    let admin = await Admin.findOne({ username: adminId });
    if (!admin) {
      admin = await Admin.findOne({});
    }
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản Admin' });
    }

    if (oldPassword && newPassword) {
      const isMatch = await verifyAndUpgrade(admin, oldPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu cũ không chính xác' });
      }
      admin.password = await bcrypt.hash(newPassword, 12);
    }

    if (adminEmail) {
      admin.email = adminEmail;
    }

    await admin.save();

    logAdminAuditAction(req, 'UPDATE_ADMIN_SETTINGS', admin._id, admin.email || 'admin', 'Cập nhật tài khoản và đổi mật khẩu Admin');

    res.json({
      success: true,
      message: 'Đã cập nhật cài đặt tài khoản Admin thành công'
    });
  } catch (err) {
    console.error('Error updating admin account settings:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
