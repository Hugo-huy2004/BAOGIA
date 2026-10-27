// Kiểm tra thông tin cá nhân định kỳ — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { requireAdmin, requireMember } from '../../middleware/authMiddleware.js';
import { maskEmail } from '../../utils/piiMasker.js';
import { identityAnswerLimiter, identityOtpLimiter } from './bioShared.js';

const router = express.Router();

// ─── KIỂM TRA THÔNG TIN CÁ NHÂN ĐỊNH KỲ ──────────────────────────────────────
// Chống khai man: hỏi lại một món thông tin vào những mốc thưa dần. Xem
// server/utils/identityCheck.js để hiểu lịch và vòng xoay câu hỏi.

// GET /api/bios/me/identity-check — tới hạn chưa, đang hỏi món gì.
router.get('/me/identity-check', requireMember, async (req, res) => {
  try {
    const IC = await import('../../utils/identityCheck.js');
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });

    // Thành viên chưa có lịch: hẹn mốc đầu tiên, chưa hỏi gì ngay lúc này.
    if (!bio.identityCheck?.nextDueAt) {
      IC.scheduleNext(bio, { advance: false });
      await bio.save();
      return res.json({ success: true, due: false, nextDueAt: bio.identityCheck.nextDueAt });
    }

    if (!IC.isDue(bio)) {
      return res.json({ success: true, due: false, nextDueAt: bio.identityCheck.nextDueAt });
    }

    // Giữ nguyên món đã mở để người dùng không "quay lại" đổi sang câu dễ hơn.
    const field = bio.identityCheck.pendingField || IC.nextField(bio);
    if (!field) {
      // Hồ sơ chưa khai gì để đối chiếu — hoãn sang mốc sau, không khoá ai cả.
      IC.scheduleNext(bio, { advance: false });
      await bio.save();
      return res.json({ success: true, due: false, nextDueAt: bio.identityCheck.nextDueAt });
    }

    if (bio.identityCheck.pendingField !== field) {
      bio.identityCheck.pendingField = field;
      await bio.save();
    }

    res.json({
      success: true,
      due: true,
      field,
      attemptsLeft: Math.max(0, IC.MAX_ATTEMPTS - (bio.identityCheck.attempts || 0)),
      // Gợi ý nhận dạng hòm thư mà không lộ nguyên địa chỉ cho người mượn máy.
      emailHint: field === 'email' ? maskEmail(bio.email) : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bios/me/identity-check/send-otp — gửi mã tới chính hòm thư đã đăng ký.
router.post('/me/identity-check/send-otp', requireMember, identityOtpLimiter, async (req, res) => {
  try {
    const IC = await import('../../utils/identityCheck.js');
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    if (!IC.isDue(bio) || bio.identityCheck?.pendingField !== 'email') {
      return res.status(400).json({ error: 'Đợt kiểm tra hiện tại không yêu cầu mã email.' });
    }

    const { issueEmailOtp, hasLiveEmailOtp } = await import('../../utils/emailOtp.js');
    // Mã cũ còn hiệu lực thì giữ nguyên: cấp mã mới sẽ vô hiệu hoá đúng cái mã
    // người dùng đang gõ dở, và mỗi lần cấp là thêm một email rời máy chủ.
    if (hasLiveEmailOtp(bio.email, 'identity')) {
      return res.json({ success: true, alreadySent: true, emailHint: maskEmail(bio.email) });
    }

    const { sendMagicLinkOtp } = await import('../../services/emailService.js');
    const code = issueEmailOtp(bio.email, 'identity');
    const mail = await sendMagicLinkOtp(bio.email, code, 'identity');

    // Thư CHỈ được mô phỏng (chưa cấu hình SendGrid) hoặc gửi hỏng: tuyệt đối
    // không được để đợt này chạy tiếp. Người dùng sẽ không bao giờ nhận được mã,
    // gõ sai hai lần rồi bị khoá tài khoản vì một lá thư chưa từng rời máy chủ.
    // Đổi sang mục khác để đợt kiểm tra vẫn diễn ra, chỉ là hỏi thứ khác.
    if (!mail?.success || mail.simulated) {
      console.warn(`⚠️ Kiểm tra thông tin: không gửi được mã tới ${maskEmail(bio.email)} — chuyển sang hỏi mục khác.`);
      const IC2 = await import('../../utils/identityCheck.js');
      const fallback = IC2.availableFields(bio).find((f) => f !== 'email');
      bio.identityCheck.pendingField = fallback || '';
      if (!fallback) IC2.scheduleNext(bio, { advance: false });
      await bio.save();
      // 409 chứ không 503: safeServerErrors viết đè mọi thân 5xx thành câu chung
      // chung, nên mã EMAIL_UNAVAILABLE không tới được giao diện.
      return res.status(409).json({
        success: false,
        error: 'EMAIL_UNAVAILABLE',
        switchedTo: fallback || null,
        message: 'Không gửi được mã xác minh. Hệ thống sẽ hỏi bằng cách khác.',
      });
    }

    res.json({ success: true, emailHint: maskEmail(bio.email) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bios/me/identity-check/answer  { value }
router.post('/me/identity-check/answer', requireMember, identityAnswerLimiter, async (req, res) => {
  try {
    const IC = await import('../../utils/identityCheck.js');
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    if (!IC.isDue(bio)) return res.json({ success: true, due: false });

    const field = bio.identityCheck?.pendingField || IC.nextField(bio);
    const value = String(req.body?.value || '').trim();
    if (!field) return res.json({ success: true, due: false });
    if (!value) return res.status(400).json({ error: 'Vui lòng nhập câu trả lời.' });

    // Giao diện gửi kèm câu hỏi nó đang hiển thị. Lệch nhau nghĩa là câu hỏi vừa
    // đổi (vd: gửi mã email hỏng nên hệ thống chuyển sang hỏi số điện thoại) và
    // người dùng bấm gửi trước khi màn hình kịp cập nhật — tính đó là một lần
    // sai là ghi nợ oan cho người trả lời đúng câu hỏi cũ.
    const askedField = String(req.body?.field || '').trim();
    if (askedField && askedField !== field) {
      return res.status(409).json({
        success: false,
        error: 'QUESTION_CHANGED',
        field,
        message: 'Câu hỏi đã thay đổi. Vui lòng trả lời câu hỏi mới.',
      });
    }

    let correct;
    if (field === 'email') {
      const { verifyEmailOtp, hasLiveEmailOtp } = await import('../../utils/emailOtp.js');
      // Không có mã nào đang sống thì đây không phải câu trả lời sai — chưa
      // từng có câu hỏi. Đếm nó là một lần sai là khoá người vô tội.
      if (!hasLiveEmailOtp(bio.email, 'identity')) {
        return res.status(409).json({
          success: false,
          error: 'NO_ACTIVE_CODE',
          message: 'Mã đã hết hạn hoặc chưa được gửi. Vui lòng yêu cầu mã mới.',
        });
      }
      correct = verifyEmailOtp(bio.email, value, 'identity').ok;
    } else {
      correct = IC.matchesProfile(bio, field, value);
    }

    if (correct) {
      await IC.recordPass(bio, field);
      return res.json({ success: true, correct: true, nextDueAt: bio.identityCheck.nextDueAt });
    }

    const result = await IC.recordFail(bio, field);
    if (!result.exhausted) {
      return res.status(400).json({
        success: true,
        correct: false,
        attemptsLeft: result.attemptsLeft,
        error: `Thông tin không khớp với hồ sơ. Bạn còn ${result.attemptsLeft} lần thử.`,
      });
    }

    // Hết lượt: khoá tài khoản bằng đúng cơ chế an ninh đang chạy, nên người
    // dùng thấy màn khoá kèm đường kháng nghị và admin có sẵn nút gỡ.
    const { recordSecurityViolation, sendSecurityBlockResponse, findActiveSecurityBlock } =
      await import('../../services/securityEnforcement.js');
    const { caseId } = await recordSecurityViolation({
      req,
      email: bio.email,
      phone: bio.phone || '',
      category: 'identity_fraud',
      severity: 'critical',
      ruleId: `identity_check_failed_${field}`,
      evidence: `Sai ${IC.MAX_ATTEMPTS} lần liên tiếp ở mục "${field}"`,
      enforcement: 'immediate',
    });

    // Sổ kiểm toán là NƠI DUY NHẤT còn giữ email dạng đọc được cho ca này:
    // SecurityEvent chỉ lưu bản băm. Nút xử lý trên Telegram tra ngược qua đây.
    const AdminAuditLog = (await import('../../models/AdminAuditLog.js')).default;
    await AdminAuditLog.create({
      adminId: 'SYSTEM_IDENTITY_CHECK',
      adminUsername: 'Kiểm tra thông tin định kỳ',
      action: 'identity_check_blocked',
      targetEmail: bio.email,
      details: { caseId, field, attempts: IC.MAX_ATTEMPTS },
    });

    // Báo Boss kèm hai nút xử lý — kháng nghị thường tới qua email, nhưng người
    // bị khoá oan thì nhắn ngay, và Boss cần gỡ được từ điện thoại.
    const { sendTelegramAlert } = await import('../../services/telegramService.js');
    sendTelegramAlert(
      `🪪 <b>[KIỂM TRA THÔNG TIN: ĐÃ KHOÁ TÀI KHOẢN]</b>\n\n`
      + `👤 <b>Thành viên:</b> <code>${bio.email}</code> (${bio.displayName || 'chưa đặt tên'})\n`
      + `❓ <b>Hỏi mục:</b> ${field}\n`
      + `❌ <b>Sai:</b> ${IC.MAX_ATTEMPTS} lần liên tiếp\n`
      + `📁 <b>Case:</b> <code>${caseId}</code>`,
      'HTML',
      {
        inline_keyboard: [[
          { text: '🔓 Gỡ khoá', callback_data: `cb_id_unlock:${caseId}` },
          { text: '📄 Đòi giấy tờ', callback_data: `cb_id_docs:${caseId}` },
        ]],
      },
    ).catch(() => {});

    const block = await findActiveSecurityBlock({ email: bio.email });
    if (block) return sendSecurityBlockResponse(res, block);
    return res.status(403).json({ error: 'ACCESS_BLOCKED' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /bios/:id — Admin xóa tài khoản người dùng
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng' });
    }
    await Bio.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Đã xóa tài khoản ${bio.email}` });
  } catch (err) {
    console.error('Error deleting bio user:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
