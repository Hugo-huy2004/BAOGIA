// Người dùng, học viên và bài nộp — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { buildUserOverview } from '../../services/adminUserOverview.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireAdmin, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { awardJoy } from '../../utils/joyService.js';
import Bio from '../../models/Bio.js';
import ReadingSession from '../../models/ReadingSession.js';
import { CODER_STAGE_SEQUENCE, isCoderLessonId } from '../../../shared/coderProgression.js';
import { sendPushNotification } from '../../utils/pushNotifier.js';
import { generate } from '../../services/aiGateway.js';
import { CODER_STEP_COUNT, logAdminAuditAction } from './adminShared.js';

const router = express.Router();

// Admin Reset User Password Route (Wipes all previous user passwords & sets new password)
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng' });
    }

    // Completely wipe out old passwords & security reset tokens
    const hashed = await bcrypt.hash(newPassword, 12);
    bio.password = hashed;
    if (bio.resetPasswordToken) bio.resetPasswordToken = undefined;
    if (bio.resetPasswordExpires) bio.resetPasswordExpires = undefined;

    // Wipe secret links old passwords if required
    if (Array.isArray(bio.secretLinks)) {
      bio.secretLinks = bio.secretLinks.map(link => ({
        ...link,
        password: hashed
      }));
    }

    bio.markModified('password');
    bio.markModified('secretLinks');
    await bio.save();

    res.json({
      success: true,
      message: `Đã xóa toàn bộ mật khẩu cũ và cập nhật mật khẩu mới cho ${bio.displayName || bio.email} thành công!`
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật mật khẩu người dùng' });
  }
});

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

// GET /admin/coder-submissions
router.get('/coder-submissions', requireAdmin, async (req, res) => {
  try {
    // Trước đây lọc `completedLessons: 'lesson62'` kèm chú thích "bài cuối của
    // Chặng 5". Sai với lộ trình hiện tại: chặng 5 là bài 71–90, còn bài 62 nằm
    // giữa chặng 4 — nên danh sách duyệt đồ án hiện cả những người còn cách
    // ngày tốt nghiệp gần bốn mươi bài.
    //
    // Trang này để DUYỆT ĐỒ ÁN, nên điều kiện đúng là đã nộp đồ án.
    const submissions = await Bio.find({
      hugoCoderProjectUrl: { $exists: true, $nin: [null, ''] },
    }).select('email displayName avatarUrl completedLessons capstoneTrack hugoCoderProjectUrl hugoCoderProjectStatus hugoCoderCertificateUrl hugoCoderProjectSubmittedAt hugoCoderProjectNote hugoCoderProjectAdminNote')
      .sort({ hugoCoderProjectSubmittedAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching coder submissions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/learners — bảng theo dõi người học.
 *
 * Trước đây admin chỉ có trang duyệt đồ án, tức chỉ nhìn thấy người đã đi tới
 * cuối. Ai đang học dở, ai kẹt ở đâu, ai bỏ giữa chừng thì không có chỗ nào xem.
 *
 * `stuckAt` là thứ đáng nhìn nhất: bài đầu tiên chưa hoàn thành. Ba người cùng
 * kẹt ở một bài nghĩa là bài đó có vấn đề, không phải ba người đó lười.
 */
router.get('/learners', requireAdmin, async (req, res) => {
  try {
    const { q = '', track = '', status = 'all', page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));

    const filter = { completedLessons: { $exists: true, $ne: [] } };
    if (q.trim()) {
      // Người dùng nhập, nên thoát ký tự đặc biệt trước khi dựng biểu thức —
      // một dấu ngoặc lạc vào là truy vấn ném lỗi.
      const safe = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: safe, $options: 'i' } },
        { displayName: { $regex: safe, $options: 'i' } },
      ];
    }
    if (track) filter.capstoneTrack = track;
    if (status === 'graduating') filter.hugoCoderProjectStatus = 'pending';
    if (status === 'graduated') filter.hugoCoderProjectStatus = 'approved';

    const [rows, total] = await Promise.all([
      Bio.find(filter)
        .select('email displayName avatarUrl completedLessons capstoneTrack capstoneTrackChosenAt hugoCoderProjectStatus hugoCoderProjectSubmittedAt hugoCoderExamAttempts featureSubscriptions updatedAt')
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Bio.countDocuments(filter),
    ]);

    const emails = rows.map((row) => row.email).filter(Boolean);
    const readings = emails.length
      ? await ReadingSession.aggregate([
        { $match: { memberEmail: { $in: emails }, completedAt: { $ne: null } } },
        { $group: { _id: '$memberEmail', count: { $sum: 1 } } },
      ])
      : [];
    const readingByEmail = new Map(readings.map((item) => [item._id, item.count]));

    const learners = rows.map((row) => {
      const coderDone = (row.completedLessons || []).filter(isCoderLessonId);
      const stage = CODER_STAGE_SEQUENCE.find(
        (item) => coderDone.length >= item.from - 1 && coderDone.length < item.to,
      ) || CODER_STAGE_SEQUENCE.at(-1);

      // Bài đầu tiên chưa xong — nơi người học đang đứng.
      let stuckAt = null;
      for (let number = 1; number <= CODER_STEP_COUNT; number += 1) {
        if (!coderDone.includes(`step${number}`)) { stuckAt = number; break; }
      }

      return {
        email: row.email,
        displayName: row.displayName || '',
        avatarUrl: row.avatarUrl || '',
        lessonsDone: coderDone.length,
        stageId: stage?.id || null,
        stuckAt,
        capstoneTrack: row.capstoneTrack || '',
        readingsDone: readingByEmail.get(row.email) || 0,
        examAttempts: Object.values(row.hugoCoderExamAttempts || {}).reduce((sum, n) => sum + Number(n || 0), 0),
        projectStatus: row.hugoCoderProjectStatus || '',
        projectSubmittedAt: row.hugoCoderProjectSubmittedAt || null,
        maintenanceUntil: row.featureSubscriptions?.hugoCoder?.expiresAt || null,
        // `updatedAt` đổi theo MỌI thay đổi hồ sơ, không riêng việc học — nên
        // gọi đúng tên nó là "hồ sơ đổi lần cuối", đừng bày ra như "học lần cuối".
        profileUpdatedAt: row.updatedAt || null,
      };
    });

    res.json({
      learners,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching learners:', error);
    res.status(500).json({ error: error.message });
  }
});

/** GET /admin/learners/stuck — những bài đang chặn nhiều người nhất. */
router.get('/learners/stuck', requireAdmin, async (req, res) => {
  try {
    const rows = await Bio.find({ completedLessons: { $exists: true, $ne: [] } })
      .select('completedLessons')
      .lean();

    const counts = new Map();
    for (const row of rows) {
      const done = new Set((row.completedLessons || []).filter(isCoderLessonId));
      if (!done.size) continue;
      for (let number = 1; number <= CODER_STEP_COUNT; number += 1) {
        if (!done.has(`step${number}`)) {
          counts.set(number, (counts.get(number) || 0) + 1);
          break;
        }
      }
    }

    const stuck = [...counts.entries()]
      .map(([lesson, learners]) => ({ lesson, learners }))
      .sort((a, b) => b.learners - a.learners)
      .slice(0, 10);

    res.json({ stuck, totalLearners: rows.length });
  } catch (error) {
    console.error('Error computing stuck lessons:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/verify-graduation-project
router.post('/verify-graduation-project', requireAdmin, async (req, res) => {
  try {
    const { email, status, adminNote, certificateUrl } = req.body;
    if (!email || !status) {
      return res.status(400).json({ error: 'email and status are required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái xác thực không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    bio.hugoCoderProjectStatus = status;
    bio.hugoCoderProjectAdminNote = adminNote || '';

    if (status === 'approved') {
      bio.hugoCoderCertificateUrl = certificateUrl || '';
      
      // Award 4000 JOY if not already claimed
      if (!bio.hugoCoderRewardClaimed7) {
        await awardJoy(
          email,
          4000,
          'ide_course_completion',
          // Số JOY đã là field `amount` trên thông báo, không viết lại vào câu.
          'Đạt thành tích Xuất sắc khi tốt nghiệp bộ Phát triển Web.',
          { bioDoc: bio, refId: 'lesson100_completion' }
        );
        bio.hugoCoderRewardClaimed7 = true;
      }
    } else {
      // If rejected, allow them to re-submit
      bio.hugoCoderProjectStatus = 'rejected';
    }

    await bio.save();
    res.json({ success: true, data: bio });
  } catch (error) {
    console.error('Error verifying project:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/send-ai-notification (admin) - Sử dụng AI viết nội dung & gửi tin nhắn, email
router.post('/send-ai-notification', requireAdmin, async (req, res) => {
  try {
    const { recipient, prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Nội dung yêu cầu trống' });
    }

    console.log(`[AI Notification] Generating content for prompt: "${prompt}", recipient: "${recipient}"`);

    // 1. Generate content using Gemini AI
    const systemInstruction = `You are a professional copywriter for Hugo Studio.
Given a topic/prompt from the administrator: "${prompt}", write a beautiful email subject, a beautifully formatted HTML email body, and a short push notification (under 200 chars).
IMPORTANT: Use the placeholder "{{displayName}}" (with double curly braces) in the subject, HTML body, and pushText wherever the recipient's name or a personalized greeting is appropriate. Do not guess names; always use "{{displayName}}".
Return ONLY a valid JSON object matching this structure (no markdown code ticks):
{
  "subject": "Email Subject Line",
  "html": "<div style='font-family: Arial, sans-serif;'>HTML Body here...</div>",
  "pushText": "Push Notification message here (max 200 chars)"
}`;

    let responseText;
    try {
      responseText = await generate(`Generate message content for: ${prompt}`, {
        systemInstruction,
        generationConfig: { responseMimeType: 'application/json' }
      });
    } catch (aiErr) {
      console.warn('[AI Notification] Gemini call failed, using local templates:', aiErr.message);
    }

    let subject, html, pushText;
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText.trim());
        subject = parsed.subject;
        html = parsed.html;
        pushText = parsed.pushText;
      } catch (jsonErr) {
        console.error('Failed to parse AI response:', jsonErr);
      }
    }

    // Fallback if AI didn't respond or JSON was invalid
    if (!subject || !html || !pushText) {
      subject = `📢 Chào {{displayName}}, thông báo mới từ Hugo Studio: ${prompt}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0b0a0f;">Hugo Studio</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Chào {{displayName}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">${prompt}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Email này được gửi tự động từ quản trị viên Hugo Studio.</p>
        </div>
      `;
      pushText = `Chào {{displayName}}, thông báo mới: ${prompt}`;
    }

    // 2. Resolve recipients
    let recipients = [];
    if (recipient && recipient.toLowerCase() !== 'all') {
      const bio = await Bio.findOne({ $or: [{ email: recipient }, { phone: recipient }] });
      if (!bio) {
        return res.status(404).json({ error: `Không tìm thấy tài khoản người dùng: ${recipient}` });
      }
      recipients.push(bio);
    } else {
      recipients = await Bio.find({});
    }

    if (recipients.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng nào trong hệ thống.' });
    }

    // 3. Send Notification & Email
    const emailPromises = [];
    const pushPromises = [];

    const { sendCustomEmail } = await import('../../services/emailService.js');
    const InAppNotification = (await import('../../models/InAppNotification.js')).default;

    for (const bio of recipients) {
      const userDisplayName = bio.displayName || 'Thành viên';
      const userSubject = subject.replace(/{{displayName}}/g, userDisplayName);
      const userHtml = html.replace(/{{displayName}}/g, userDisplayName);
      const userPushText = pushText.replace(/{{displayName}}/g, userDisplayName);

      // In-app history entry
      bio.history.push({
        type: 'info',
        icon: 'notifications',
        title: userSubject,
        detail: userPushText,
        timestamp: new Date()
      });
      if (bio.history.length > 50) {
        bio.history = bio.history.slice(bio.history.length - 50);
      }
      emailPromises.push(bio.save());

      // Create InAppNotification document to display in UI Inbox list
      pushPromises.push(
        InAppNotification.create({
          email: bio.email,
          type: 'info',
          category: 'system',
          title: userSubject,
          message: userPushText,
          actionUrl: '/member/activity'
        }).catch(err => console.error(`Error creating InAppNotification for ${bio.email}:`, err.message))
      );

      // Send Push notification
      if (bio.email) {
        pushPromises.push(
          sendPushNotification(bio.email, userSubject, userPushText, '/member/activity').catch(() => {})
        );
        // Send email via SendGrid
        pushPromises.push(
          sendCustomEmail(bio.email, userSubject, userHtml).catch(err => console.error(`Error sending email to ${bio.email}:`, err.message))
        );
      }
    }

    await Promise.all([...emailPromises, ...pushPromises]);

    res.json({
      success: true,
      recipientCount: recipients.length,
      subject,
      pushText,
      html
    });
  } catch (error) {
    console.error('Send AI notification error:', error);
    res.status(500).json({ error: error.message });
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
// `/details` cũ chỉ đọc 5 nguồn; xem `server/services/adminUserOverview.js` để
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
    const PendingTransfer = (await import('../../models/PendingTransfer.js')).default;
    const tx = await PendingTransfer.findById(req.params.txId);
    if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    if (tx.status && !['pending', 'held', 'review'].includes(tx.status)) {
      return res.status(409).json({ error: `Giao dịch đã ở trạng thái "${tx.status}", không xử lý lại.` });
    }

    tx.status = decision === 'release' ? 'released' : 'blocked';
    tx.reviewedAt = new Date();
    tx.reviewerNote = String(note || '').slice(0, 1000);
    await tx.save();

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
      locationVerifiedAt, ethnicity, religion,
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
    if (ethnicity !== undefined) bio.ethnicity = ethnicity;
    if (religion !== undefined) bio.religion = religion;
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
    const memberGateChanged = [joyDenom, countryCode, adminArea, locality, exactAddress, verifiedLatitude, verifiedLongitude, locationVerifiedAt, ethnicity, religion, birthDay, birthMonth, birthYear, language].some((value) => value !== undefined);

    // Hạn dùng HIỆU LỰC: tài khoản chưa xác minh giáo dục đi theo hạn dùng thử
    // (trialExpiresAt) — cổng thành viên và lịch tự xoá tài khoản đọc hạn đó.
    // Trước đây chỉ dời expiresAt, nên admin gia hạn xong tài khoản vẫn bị khoá
    // và xoá đúng hạn cũ. Dời cả hai, giống extendAccess của chiến dịch partner.
    const followsTrial = !bio.isEduVerified && Boolean(bio.trialExpiresAt);
    const setAccessUntil = (date) => {
      bio.expiresAt = date;
      if (followsTrial) bio.trialExpiresAt = date;
    };
    if (addDays && !isNaN(Number(addDays))) {
      const effective = followsTrial ? bio.trialExpiresAt : bio.expiresAt;
      const currentExp = effective ? new Date(effective).getTime() : Date.now();
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
    const { sendCustomEmail } = await import('../../services/emailService.js');

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 20px;">
        <h2 style="color: #fbbf24;">${finalSubject}</h2>
        <p>${t.greeting}</p>
        <p>${t.body}</p>
        ${giftJoy > 0 ? `<div style="padding: 12px 16px; background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; border-radius: 12px; color: #fbbf24; font-weight: bold; font-size: 16px; margin: 16px 0;">${t.giftText}</div>` : ''}
        ${message ? `<p style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;"><strong>${t.msgLabel}</strong><br>${message}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Email này được tự động gửi và dịch theo ngôn ngữ của thành viên (${lang.toUpperCase()}).</p>
      </div>
    `;

    const mail = await sendCustomEmail(bio.email, finalSubject, emailHtml);

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
    const { sendCustomEmail } = await import('../../services/emailService.js');

    const bio = await Bio.findById(req.params.id).lean();
    if (!bio || !bio.email) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin email của người dùng' });
    }

    const bodyContent = htmlMessage || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
        <h2 style="color: #38bdf8;">${subject}</h2>
        <p>Chào <strong>${bio.displayName || bio.email}</strong>,</p>
        <p>${instructions || 'Bạn có một thông báo mới từ Quản trị viên Hugo Studio.'}</p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Email này được gửi trực tiếp từ Ban Quản Trị Hugo Studio.</p>
      </div>
    `;

    const result = await sendCustomEmail(bio.email, subject, bodyContent);
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

// POST /admin/users/:id/toggle-edu-status - Phê duyệt / Thu hồi EDU Status
router.post('/users/:id/toggle-edu-status', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    bio.isEduVerified = !bio.isEduVerified;
    bio.history.push({
      type: 'info',
      icon: 'school',
      title: bio.isEduVerified ? 'Xác minh Sinh viên EDU thành công' : 'Thu hồi trạng thái EDU',
      detail: bio.isEduVerified ? 'Admin đã phê duyệt xác minh ưu đãi Sinh viên EDU.' : 'Admin đã thu hồi trạng thái Sinh viên EDU.',
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'TOGGLE_EDU_STATUS', bio._id, bio.email, `${bio.isEduVerified ? 'Xác minh EDU' : 'Thu hồi EDU'} cho ${bio.displayName}`);

    res.json({
      success: true,
      isEduVerified: bio.isEduVerified,
      message: `Đã ${bio.isEduVerified ? 'phê duyệt xác minh EDU' : 'thu hồi trạng thái EDU'} cho ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error toggling EDU status:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
