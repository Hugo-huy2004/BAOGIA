// Người dùng, học viên và bài nộp — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { buildUserOverview } from '../../services/adminUserOverview.js';
import crypto from 'crypto';
import { requireAdmin, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { awardJoy } from '../../utils/joyService.js';
import Bio from '../../models/Bio.js';
import { logAdminAuditAction } from './adminShared.js';

const router = express.Router();

router.get('/users/search', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const searchRegex = new RegExp(q, 'i');
    
    // Search by email, displayName, or phone
    const users = await Bio.find({
      $or: [
        { email: searchRegex },
        { displayName: searchRegex },
        { phone: searchRegex }
      ]
    }).select('email displayName avatarUrl joyBalance phone packages').limit(10).lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Lỗi tìm kiếm' });
  }
});

// ─── DEEP USER MANAGEMENT ROUTES ─────────────────────────────────────────────

// GET /admin/users/:id/details - Soi thông tin chi tiết người dùng
router.get('/users/:id/details', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const JoyLedger = (await import('../../models/JoyLedger.js')).default;
    const SecurityEvent = (await import('../../models/SecurityEvent.js')).default;
    const SupportTicket = (await import('../../models/SupportTicket.js')).default;
    const UtilityOrder = (await import('../../models/UtilityOrder.js')).default;

    const bioDoc = await Bio.findById(req.params.id);
    if (!bioDoc) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng' });
    }
    const bio = bioDoc.toObject({ getters: true });

    const [joyLedger, tickets, securityCount, orders] = await Promise.all([
      JoyLedger.find({ email: bio.email }).sort({ createdAt: -1 }).limit(20).lean(),
      SupportTicket.find({ email: bio.email }).sort({ createdAt: -1 }).limit(10).lean(),
      SecurityEvent.countDocuments({ emailHash: crypto.createHash('sha256').update(bio.email).digest('hex') }),
      UtilityOrder.find({ email: bio.email }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    res.json({
      success: true,
      bio,
      joyLedger,
      tickets,
      securityCount,
      orders
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/users/:id/overview — hồ sơ 360°, gom mọi domain phía Member.
// `/details` cũ chỉ đọc 5 nguồn; xem `apps/server/services/adminUserOverview.js` để
// biết vì sao khoá tra cứu của từng model không giống nhau.
router.get('/users/:id/overview', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const bioDoc = await Bio.findById(req.params.id);
    if (!bioDoc) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng' });

    const bio = bioDoc.toObject({ getters: true });
    const { overview, failed } = await buildUserOverview(String(bio.email || '').toLowerCase(), bio._id);

    // `failed` đi kèm phản hồi thay vì bị nuốt: admin phải biết mảng nào chưa
    // đọc được, chứ không phải nhìn một ô trống rồi tưởng người dùng sạch.
    res.json({ success: true, bio, ...overview, failed });
  } catch (err) {
    console.error('[admin] user overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/appeal/:appealId — duyệt hoặc từ chối kháng nghị mở khoá.
// Trước đây không có đường nào: người dùng gửi kháng nghị kèm ảnh và vị trí rồi
// nằm đó vĩnh viễn vì admin không có nút bấm.
router.post('/users/:id/appeal/:appealId', requireAdmin, async (req, res) => {
  try {
    const { decision, note } = req.body || {};
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'decision phải là approve hoặc reject' });
    }
    const SecurityAppeal = (await import('../../models/SecurityAppeal.js')).default;
    const appeal = await SecurityAppeal.findById(req.params.appealId);
    if (!appeal) return res.status(404).json({ error: 'Không tìm thấy đơn kháng nghị' });

    const status = decision === 'approve' ? 'approved' : 'rejected';

    if (decision === 'approve') {
      const SecurityBlock = (await import('../../models/SecurityBlock.js')).default;
      await SecurityBlock.updateMany(
        { email: appeal.email, active: true },
        { $set: { active: false, releasedAt: new Date(), releasedBy: 'admin-appeal' } },
      );
    }

    // Có quyết định là xoá sạch: selfie trên Cloudinary lẫn bản ghi vị trí/IP.
    const { purgeSecurityAppeal } = await import('../../services/memberAccountLifecycle.js');
    await purgeSecurityAppeal(appeal).catch((e) => console.error('[appeal purge]', e.message));

    await logAdminAuditAction(req, `appeal_${decision}`, null, appeal.email, `Kháng nghị mở khoá: ${decision}`, { appealId: String(appeal._id), note });
    res.json({ success: true, status });
  } catch (err) {
    console.error('[admin] appeal review:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/held-transfer/:txId — thả hoặc chặn một giao dịch bị giữ.
// Ví giữ giao dịch đáng ngờ lại chờ người duyệt, nhưng chưa có ai duyệt được.
router.post('/users/:id/held-transfer/:txId', requireAdmin, async (req, res) => {
  try {
    const { decision, note } = req.body || {};
    if (!['release', 'block'].includes(decision)) {
      return res.status(400).json({ error: 'decision phải là release hoặc block' });
    }
    // Trước 31/10/2026 nhánh này ghi trạng thái ngoài enum (released/blocked) nên
    // luôn 500, và "release" chưa từng chuyển tiền. Giờ đi chung một cửa với
    // Telegram và chính chủ (services/transferHold.js).
    const { decideHeldTransfer } = await import('../../services/transferHold.js');
    const result = await decideHeldTransfer({ _id: req.params.txId }, {
      approve: decision === 'release', decidedBy: req.admin?.username || req.admin?.email || 'admin',
    });
    if (!result.ok) return res.status(409).json({ error: result.error });
    const tx = result.pending;

    await logAdminAuditAction(req, `held_transfer_${decision}`, null, tx.fromEmail,
      `Giao dịch bị giữ: ${decision}`, { txCode: tx.txCode, amount: tx.numAmount, note });
    res.json({ success: true, status: tx.status });
  } catch (err) {
    console.error('[admin] held transfer:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/users/:id/update-profile - Chỉnh sửa thông tin hồ sơ & Gia hạn ngày hết hạn (expiresAt)
router.put('/users/:id/update-profile', requireAdmin, async (req, res) => {
  try {
    const {
      displayName, headline, phone, address, jobTitle, education, expiresAt, addDays, joyDenom,
      countryCode, adminArea, locality, exactAddress, verifiedLatitude, verifiedLongitude,
      locationVerifiedAt,
      birthDay, birthMonth, birthYear, birthday, language, contactEmail, bio: bioText, avatarUrl,
    } = req.body;
    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (displayName !== undefined) bio.displayName = displayName;
    if (headline !== undefined) bio.headline = headline;
    if (phone !== undefined) bio.phone = phone;
    if (address !== undefined) bio.address = address;
    if (jobTitle !== undefined) bio.jobTitle = jobTitle;
    if (education !== undefined) bio.education = education;
    if (countryCode !== undefined) bio.countryCode = String(countryCode).toUpperCase();
    if (adminArea !== undefined) bio.adminArea = adminArea;
    if (locality !== undefined) bio.locality = locality;
    if (exactAddress !== undefined) bio.exactAddress = exactAddress;
    if (verifiedLatitude !== undefined) bio.verifiedLatitude = verifiedLatitude;
    if (verifiedLongitude !== undefined) bio.verifiedLongitude = verifiedLongitude;
    if (locationVerifiedAt !== undefined) bio.locationVerifiedAt = locationVerifiedAt ? new Date(locationVerifiedAt) : null;
    // Toạ độ do admin nhập tay: không có số đo GPS hay kết quả bản đồ đi kèm.
    if (verifiedLatitude !== undefined || verifiedLongitude !== undefined) {
      bio.locationMatch = verifiedLatitude || verifiedLongitude ? 'admin' : '';
      bio.locationAccuracy = 0;
      bio.locationGeocode = '';
    }
    if (joyDenom !== undefined) bio.joyDenom = joyDenom;
    // Ảnh đại diện: data:image → tải lên Cloudinary (thay ảnh cũ), '' → xoá.
    // Admin được vượt khoá chống giả mạo (antiDeepfakeLock) — khoá đó chặn kẻ
    // chiếm tài khoản đổi ảnh, không chặn người kiểm duyệt gỡ ảnh vi phạm.
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
        const { uploadAvatar } = await import('../../utils/cloudinary.js');
        bio.avatarUrl = await uploadAvatar(avatarUrl, bio.email, bio.avatarUrl);
      } else if (avatarUrl === '') {
        if (bio.avatarUrl) {
          const { deleteAvatar } = await import('../../utils/cloudinary.js');
          await deleteAvatar(bio.avatarUrl).catch((error) => console.warn('[admin avatar delete]', error.message));
        }
        bio.avatarUrl = '';
      } else {
        return res.status(400).json({ error: 'Ảnh đại diện phải là ảnh tải lên hoặc rỗng để xoá.' });
      }
    }
    if (birthday !== undefined) bio.birthday = String(birthday).slice(0, 60);
    if (contactEmail !== undefined) bio.contactEmail = String(contactEmail).trim().toLowerCase().slice(0, 200);
    if (bioText !== undefined) bio.bio = String(bioText).slice(0, 2000);
    if (language !== undefined) {
      const code = String(language || '').toLowerCase();
      if (code && !['vi', 'en', 'zh'].includes(code)) return res.status(400).json({ error: 'Ngôn ngữ phải là vi, en hoặc zh.' });
      bio.language = code;
    }
    // Ngày sinh: thành viên chỉ khai được một lần rồi khoá — admin là người duy
    // nhất sửa được khi khai nhầm. Gửi cả ba số 0 (hoặc rỗng) để xoá, thành viên
    // sẽ được hỏi lại ở onboarding.
    if (birthDay !== undefined || birthMonth !== undefined || birthYear !== undefined) {
      const day = Number(birthDay) || 0;
      const month = Number(birthMonth) || 0;
      const year = Number(birthYear) || 0;
      const cleared = !day && !month && !year;
      const valid = Number.isInteger(day) && day >= 1 && day <= 31
        && Number.isInteger(month) && month >= 1 && month <= 12
        && Number.isInteger(year) && year >= 1900 && year <= new Date().getFullYear()
        && new Date(year, month - 1, day).getDate() === day;
      if (!cleared && !valid) return res.status(400).json({ error: 'Ngày sinh không hợp lệ.' });
      bio.birthDay = day;
      bio.birthMonth = month;
      bio.birthYear = year;
    }
    // Một số điện thoại chỉ thuộc một tài khoản (index unique) — báo rõ thay vì 500.
    if (bio.isModified('phone') && bio.phone && await Bio.exists({ phone: bio.phone, _id: { $ne: bio._id } })) {
      return res.status(409).json({ error: 'Số điện thoại này đã thuộc một tài khoản khác.' });
    }
    const memberGateChanged = [joyDenom, countryCode, adminArea, locality, exactAddress, verifiedLatitude, verifiedLongitude, locationVerifiedAt, birthDay, birthMonth, birthYear, language].some((value) => value !== undefined);

    // Gia hạn là quyền của admin (04/11/2026): cổng thành viên chỉ đọc expiresAt.
    const setAccessUntil = (date) => { bio.expiresAt = date; };
    if (addDays && !isNaN(Number(addDays))) {
      const currentExp = bio.expiresAt ? new Date(bio.expiresAt).getTime() : Date.now();
      const baseTime = Math.max(Date.now(), currentExp);
      setAccessUntil(new Date(baseTime + Number(addDays) * 24 * 60 * 60 * 1000));
    } else if (expiresAt) {
      const date = new Date(expiresAt);
      if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Ngày hết hạn không hợp lệ.' });
      setAccessUntil(date);
    }

    if (!Array.isArray(bio.history)) {
      bio.history = [];
    }

    const expDateStr = bio.expiresAt && !isNaN(new Date(bio.expiresAt).getTime())
      ? new Date(bio.expiresAt).toLocaleDateString('vi-VN')
      : 'Vĩnh viễn';

    bio.history.push({
      type: 'info',
      icon: 'edit_note',
      title: 'Hồ sơ cập nhật bởi Admin',
      detail: `Admin đã điều chỉnh thông tin cá nhân và thời hạn sử dụng (${expDateStr}).`,
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    const changedFields = bio.modifiedPaths().filter((path) => !path.includes('.') && path !== 'history');
    await bio.save({ validateModifiedOnly: true });
    // Hạn dùng cũng nằm trong cổng thành viên (đã cache) — làm mới luôn.
    if (memberGateChanged || addDays || expiresAt) invalidateMemberGate(bio.email);

    // Ghi TÊN trường đã sửa (không ghi giá trị: nhật ký không được thành bản
    // sao thứ hai của dữ liệu nhạy cảm).
    logAdminAuditAction(req, 'UPDATE_USER_PROFILE', bio._id, bio.email, `Cập nhật hồ sơ & thời hạn HSD (${expDateStr}) cho ${bio.displayName}`, { fields: changedFields });

    res.json({
      success: true,
      message: `Đã cập nhật hồ sơ và thời hạn sử dụng cho ${bio.displayName}`,
      bio
    });
  } catch (err) {
    console.error('Error updating user profile & expiration:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/adjust-joy - Điều chỉnh số dư JOY (Cộng/Trừ) trực tiếp theo đơn vị
router.post('/users/:id/adjust-joy', requireAdmin, async (req, res) => {
  try {
    const { amount, description, unit = 'JOY' } = req.body;
    const rawNum = Number(amount);
    if (!rawNum || isNaN(rawNum)) {
      return res.status(400).json({ error: 'Số lượng JOY không hợp lệ' });
    }

    let multiplier = 1;
    if (unit === 'kJOY') multiplier = 1000;
    if (unit === 'MJOY') multiplier = 1000000;

    const baseJoyAmount = Math.round(rawNum * multiplier);
    if (!baseJoyAmount) {
      return res.status(400).json({ error: 'Số lượng quy đổi bằng 0' });
    }

    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const unitTag = unit !== 'JOY' ? ` (${rawNum > 0 ? '+' : ''}${rawNum} ${unit})` : '';
    const desc = description ? `${description}${unitTag}` : `Admin điều chỉnh số dư JOY${unitTag}`;
    const updatedBio = await awardJoy(bio.email, baseJoyAmount, 'admin_adjustment', desc);

    bio.history.push({
      type: 'info',
      icon: 'account_balance_wallet',
      title: 'Số dư JOY thay đổi bởi Admin',
      detail: `${baseJoyAmount > 0 ? '+' : ''}${baseJoyAmount.toLocaleString()} JOY (${desc})`,
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'ADJUST_JOY', bio._id, bio.email, desc, {
      rawNum,
      unit,
      baseJoyAmount,
      newBalance: updatedBio.joyBalance
    });

    res.json({
      success: true,
      message: `Đã ${baseJoyAmount > 0 ? 'cộng' : 'trừ'} ${Math.abs(baseJoyAmount).toLocaleString()} JOY cho ${bio.displayName}`,
      newBalance: updatedBio.joyBalance,
      baseJoyAmount
    });
  } catch (err) {
    console.error('Error adjusting user JOY:', err);
    res.status(500).json({ error: err.message || 'Lỗi khi điều chỉnh JOY' });
  }
});

// GET /admin/users/:id/joy-reconciliation - Kiểm tra đối soát số dư JOY với tổng sổ cái JoyLedger
router.get('/users/:id/joy-reconciliation', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const { reconcileJoyBalance } = await import('../../utils/joyService.js');
    const bio = await Bio.findById(req.params.id).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const recon = await reconcileJoyBalance(bio.email, false);
    res.json({ success: true, reconciliation: recon });
  } catch (err) {
    console.error('Error checking JOY reconciliation:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/reconcile-joy - Khôi phục & Đồng bộ hóa chuẩn số dư Ví JOY theo Sổ cái
router.post('/users/:id/reconcile-joy', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const { reconcileJoyBalance } = await import('../../utils/joyService.js');
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const userEmail = bio.email || bio.contactEmail || bio._id;
    const recon = await reconcileJoyBalance(userEmail, true);

    logAdminAuditAction(req, 'RECONCILE_JOY', bio._id, bio.email, `Đồng bộ chuẩn hóa Ví JOY từ ${recon.currentBalance} thành ${recon.totalLedgerSum} JOY`, {
      oldBalance: recon.currentBalance,
      newBalance: recon.totalLedgerSum,
      drift: recon.drift
    });

    res.json({
      success: true,
      message: `Đã đối soát và đồng bộ chuẩn hóa số dư ${recon.totalLedgerSum.toLocaleString()} JOY cho ${bio.displayName}`,
      reconciliation: recon
    });
  } catch (err) {
    console.error('Error executing JOY reconciliation:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/send-voucher - Gửi tặng Voucher / JOY quà tặng kèm Tự động dịch sang ngôn ngữ thành viên
router.post('/users/:id/send-voucher', requireAdmin, async (req, res) => {
  try {
    const { voucherCode, joyReward, message } = req.body;
    const Bio = (await import('../../models/Bio.js')).default;
    const { awardJoy } = await import('../../utils/joyService.js');
    const { sendAdminLetter, escapeHtml } = await import('../../services/emailService.js');

    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    let giftJoy = Number(joyReward) || 0;
    if (giftJoy > 0) {
      await awardJoy(bio.email, giftJoy, 'admin_voucher', `Nhận Voucher Quà Tặng Admin (${voucherCode || 'GIFT-VOUCHER'})`);
    }

    const lang = (bio.preferredLanguage || bio.countryCode || 'vi').toLowerCase();
    
    // Auto-translation dictionary for voucher notification emails
    const translations = {
      en: {
        subject: `🎁 You've Received a Special JOY Voucher (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `Hello ${bio.displayName || 'Member'},`,
        body: `You have received a special voucher/gift from Hugo Studio Admin!`,
        giftText: giftJoy > 0 ? `Gift JOY Awarded: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `Message from Admin:`
      },
      ja: {
        subject: `🎁 特別なJOYバウチャーを受け取りました (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `こんにちは ${bio.displayName || '会員様'},`,
        body: `Hugo Studio Adminより特別なバウチャー/ギフトが贈られました！`,
        giftText: giftJoy > 0 ? `付与されたJOY: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `管理者からのメッセージ:`
      },
      ko: {
        subject: `🎁 특별한 JOY 바우처를 받으셨습니다 (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `안녕하세요 ${bio.displayName || '회원님'},`,
        body: `Hugo Studio Admin으로부터 특별한 바우처/선물을 받으셨습니다!`,
        giftText: giftJoy > 0 ? `지급된 JOY: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `관리자 메시지:`
      },
      vi: {
        subject: `Bạn đã nhận được Voucher JOY Đặc biệt (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `Chào ${bio.displayName || 'Thành viên'},`,
        body: `Bạn đã nhận được voucher/quà tặng đặc biệt từ Ban Quản Trị Hugo Studio!`,
        giftText: giftJoy > 0 ? `JOY Tặng kèm: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `Thông điệp từ Admin:`
      }
    };

    const t = translations[lang] || translations.vi;
    const finalSubject = t.subject;
    const emailHtml = `
        <p style="margin:0;">${escapeHtml(t.greeting)}</p>
        <p>${escapeHtml(t.body)}</p>
        ${giftJoy > 0 ? `<p style="margin:16px 0;padding:14px 16px;background:#f1f6ff;border:1px solid #cfe0ff;border-radius:12px;font-size:17px;font-weight:800;color:#0b1220;">${escapeHtml(t.giftText)}</p>` : ''}
        ${message ? `<p style="padding:14px 16px;background:#f6f7f9;border-radius:10px;"><strong>${escapeHtml(t.msgLabel)}</strong><br>${escapeHtml(message)}</p>` : ''}`;

    const mail = await sendAdminLetter(bio.email, finalSubject, emailHtml);

    logAdminAuditAction(req, 'SEND_VOUCHER', bio._id, bio.email, `Gửi Voucher "${voucherCode || 'GIFT'}" (+${giftJoy} JOY) cho ${bio.displayName} (Tự động dịch: ${lang.toUpperCase()})`);

    // JOY đã cộng ở trên; email hỏng thì vẫn báo rõ để admin biết người nhận chưa có thư.
    res.json({
      success: true,
      emailSent: Boolean(mail?.success),
      message: mail?.success
        ? `Đã gửi voucher và ${giftJoy > 0 ? `tặng +${giftJoy.toLocaleString()} JOY` : ''} cho ${bio.displayName} (Đã dịch tự động sang ${lang.toUpperCase()})`
        : `${giftJoy > 0 ? `Đã tặng +${giftJoy.toLocaleString()} JOY cho ${bio.displayName}, nhưng ` : ''}email voucher CHƯA gửi được: ${mail?.error || 'không rõ lỗi'}`,
    });
  } catch (err) {
    console.error('Error sending voucher to user:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/revoke-session - Đăng xuất cưỡng chế & Thu hồi phiên làm việc
router.post('/users/:id/revoke-session', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const { revokeMemberSession } = await import('../../utils/memberSession.js');
    await revokeMemberSession(bio, 'Admin');

    logAdminAuditAction(req, 'REVOKE_SESSION', bio._id, bio.email, `Thu hồi phiên đăng nhập của ${bio.displayName}`);

    res.json({
      success: true,
      message: `Đã thu hồi phiên làm việc và đăng xuất cưỡng chế người dùng ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error revoking user session:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/send-email - Gửi email trực tiếp cho người dùng
router.post('/users/:id/send-email', requireAdmin, async (req, res) => {
  try {
    const { subject, htmlMessage, instructions } = req.body;
    if (!subject) {
      return res.status(400).json({ error: 'Tiêu đề email (subject) là bắt buộc' });
    }

    const Bio = (await import('../../models/Bio.js')).default;
    const { sendAdminLetter, escapeHtml } = await import('../../services/emailService.js');

    const bio = await Bio.findById(req.params.id).lean();
    if (!bio || !bio.email) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin email của người dùng' });
    }

    const bodyContent = htmlMessage || `
        <p style="margin:0;">Kính gửi <strong>${escapeHtml(bio.displayName || bio.email)}</strong>,</p>
        <p style="white-space:pre-wrap;">${escapeHtml(instructions || 'Bạn có một thông báo mới từ Ban Quản trị Hugo Studio.')}</p>`;

    const result = await sendAdminLetter(bio.email, subject, bodyContent);
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Gửi email thất bại' });
    }

    logAdminAuditAction(req, 'SEND_EMAIL', bio._id, bio.email, `Gửi email "${subject}" đến ${bio.email}`);

    res.json({
      success: true,
      message: `Đã gửi email thành công tới ${bio.email}`
    });
  } catch (err) {
    console.error('Error sending direct email to user:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/toggle-wallet-freeze - Đóng băng / Mở đóng băng Ví JOY
router.post('/users/:id/toggle-wallet-freeze', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    bio.isJoyWalletFrozen = !bio.isJoyWalletFrozen;
    bio.history.push({
      type: bio.isJoyWalletFrozen ? 'warning' : 'info',
      icon: 'ac_unit',
      title: bio.isJoyWalletFrozen ? 'Ví JOY bị đóng băng' : 'Mở đóng băng Ví JOY',
      detail: bio.isJoyWalletFrozen ? 'Ví JOY đã bị Admin tạm thời đóng băng kiểm soát.' : 'Admin đã mở đóng băng Ví JOY.',
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'TOGGLE_WALLET_FREEZE', bio._id, bio.email, `${bio.isJoyWalletFrozen ? 'Đóng băng' : 'Mở đóng băng'} Ví JOY của ${bio.displayName}`);

    res.json({
      success: true,
      isJoyWalletFrozen: bio.isJoyWalletFrozen,
      message: `Đã ${bio.isJoyWalletFrozen ? 'đóng băng' : 'mở đóng băng'} Ví JOY của ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error toggling wallet freeze:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
