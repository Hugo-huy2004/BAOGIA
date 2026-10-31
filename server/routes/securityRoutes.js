import express from 'express';
import { requireAdmin, requireMember, requireRecentAuth } from '../middleware/authMiddleware.js';
import { holdReadyAt, releaseHeldTransfer } from '../services/transferHold.js';
import SecurityBlock from '../models/SecurityBlock.js';
import SecurityEvent from '../models/SecurityEvent.js';
import SecurityAppeal from '../models/SecurityAppeal.js';
import { revokeSecurityBlock, findActiveSecurityBlock } from '../services/securityEnforcement.js';
import { uploadAppealImage } from '../utils/cloudinary.js';
import Bio from '../models/Bio.js';
import PendingTransfer from '../models/PendingTransfer.js';
import { stepUpThreshold } from '../services/moneyStepUp.js';
import { memberAuth } from '../auth/betterAuth.js';
import { sendTelegramPhoto } from '../services/telegramService.js';

const router = express.Router();

// Admin-only audit feed. It exposes rule ids and keyed hashes, never raw IP,
// email, phone, request body or internal stack details.
router.get('/incidents', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const incidents = await SecurityEvent.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ incidents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blocks', requireAdmin, async (_req, res) => {
  try {
    const now = new Date();
    const blocks = await SecurityBlock.find({
      $or: [{ permanent: true }, { expiresAt: { $gt: now } }],
    }).sort({ permanent: -1, lastLockedAt: -1 }).limit(500).lean();
    res.json({ blocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Human review remains the recovery path for a false positive. Revocation does
// not delete the audit event; it only ends enforcement and records admin state.
router.post('/blocks/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const block = await revokeSecurityBlock(req.params.id);
    if (!block) return res.status(404).json({ error: 'Không tìm thấy lệnh chặn.' });
    return res.json({ success: true, block });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Kháng nghị mở khoá TỰ NGUYỆN: người bị khoá TỰ bấm nút, TỰ chụp ảnh + chia sẻ
// vị trí (trình duyệt xin quyền rõ ràng), gửi về cho Boss xem rồi bấm duyệt.
// Đây là chỗ camera + vị trí dùng ĐÚNG và HỢP PHÁP: có đồng ý minh bạch, phục
// vụ chính người dùng đang muốn mở khoá cho mình. KHÔNG auth vì người này đang
// bị khoá ngoài cổng; danh tính lấy từ email họ khai + lệnh khoá đang tồn tại.
// ponytail: "rate-limit" chính là phải ĐANG bị khoá mới gửi được, cộng giới hạn
// một kháng nghị chờ mỗi ca — chưa cần thêm rate-limiter riêng.
router.post('/appeal', async (req, res) => {
  try {
    const { caseId = '', email = '', image = '', lat, lng, accuracy } = req.body || {};
    const cleanEmail = String(email).trim().toLowerCase();

    // Chỉ nhận kháng nghị từ người ĐANG THỰC SỰ bị khoá — không mở một cổng
    // nhận-ảnh cho bất kỳ ai gửi selfie vào hệ thống.
    const block = await findActiveSecurityBlock({ email: cleanEmail });
    if (!block) return res.status(400).json({ error: 'Không tìm thấy tài khoản đang bị khoá khớp thông tin.' });

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Thiếu ảnh xác minh.' });
    }
    // ~4MB base64 ≈ 3MB ảnh: đủ cho một selfie, chặn tải nặng.
    if (image.length > 5_600_000) return res.status(413).json({ error: 'Ảnh quá lớn (tối đa ~4MB).' });

    // Một ca chỉ một kháng nghị chờ: chống spam ảnh về Boss.
    const existing = await SecurityAppeal.findOne({ email: cleanEmail, status: 'pending' }).lean();
    if (existing) return res.json({ success: true, message: 'Đã nhận kháng nghị trước đó, đang chờ xét duyệt.' });

    const imageUrl = await uploadAppealImage(image);
    const hasGeo = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    const appeal = await SecurityAppeal.create({
      caseId: caseId || block.lastCaseId || '',
      email: cleanEmail,
      imageUrl,
      lat: hasGeo ? Number(lat) : null,
      lng: hasGeo ? Number(lng) : null,
      accuracy: Number(accuracy) || null,
      ip: req.ip,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const mapLink = hasGeo ? `https://www.google.com/maps?q=${lat},${lng}` : null;
    const geoLine = hasGeo
      ? `📍 Vị trí: <a href="${mapLink}">${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}</a> (±${Math.round(Number(accuracy) || 0)}m)\n`
      : '📍 Người dùng không chia sẻ vị trí\n';
    const caption = `🙋 <b>[KHÁNG NGHỊ MỞ KHOÁ — TỰ NGUYỆN]</b>\n\n`
      + `👤 <code>${cleanEmail}</code>\n`
      + `📌 Case: <code>${appeal.caseId || 'N/A'}</code>\n`
      + geoLine
      + `\n<i>Ảnh do người dùng tự chụp để chứng minh chính chủ.</i>`;

    await sendTelegramPhoto(imageUrl, caption, {
      inline_keyboard: [[
        { text: '✅ Mở khoá', callback_data: `cb_appeal_ok:${appeal._id}` },
        { text: '🚫 Từ chối', callback_data: `cb_appeal_no:${appeal._id}` },
      ]],
    });

    return res.json({ success: true, message: 'Đã gửi kháng nghị. Chúng tôi sẽ xem xét sớm.' });
  } catch (error) {
    console.error('[security appeal]', error.message);
    return res.status(500).json({ error: 'Không gửi được kháng nghị, vui lòng thử lại.' });
  }
});

// GET /api/security/my-status — Trung tâm An ninh của thành viên: một màn để
// người dùng THẤY mình được bảo vệ (tạo lòng tin, đúng tinh thần "như ngân
// hàng"). Chỉ đọc, chỉ về chính mình.
router.get('/my-status', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail }, 'transactionPin isJoyWalletFrozen status').lean();
    const pinSet = Boolean(bio?.transactionPin);
    const ctx = await memberAuth().$context;
    const user = await ctx.internalAdapter.findUserByEmail(req.memberEmail);
    const [holds, passkeys] = await Promise.all([
      PendingTransfer.find({ fromEmail: req.memberEmail, status: 'pending' }, 'txCode numAmount toName createdAt').sort({ createdAt: 1 }).limit(10).lean(),
      user?.user ? ctx.adapter.count({ model: 'passkey', where: [{ field: 'userId', value: user.user.id }] }) : 0,
    ]);

    // Danh sách "lớp bảo vệ" cho UI dựng thẳng — nguồn sự thật ở server, client
    // không tự đoán trạng thái an ninh. Giao dịch lớn = PIN + Face ID/Google,
    // nên lớp 2 bật ngay khi có PIN (Google luôn sẵn); có passkey thì nhanh hơn.
    const protections = [
      { id: 'passkey', on: passkeys > 0 },
      { id: 'pin', on: pinSet },
      { id: 'money2fa', on: pinSet },
      { id: 'hold', on: true },
      { id: 'wallet', on: !bio?.isJoyWalletFrozen },
    ];
    const activeCount = protections.filter((p) => p.on).length;

    res.json({
      pinSet,
      stepUpThreshold: stepUpThreshold(),
      holdEnabled: (process.env.MONEY_HOLD_THRESHOLD == null ? 20000 : Number(process.env.MONEY_HOLD_THRESHOLD)) > 0,
      pendingHolds: holds.length,
      // Lệnh đang giữ của chính mình: hết giờ chờ thì tự xác nhận bằng Face ID.
      holds: holds.map((h) => ({ txCode: h.txCode, amount: h.numAmount, to: h.toName, readyAt: holdReadyAt(h) })),
      protections,
      score: Math.round((activeCount / protections.length) * 100),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/security/holds/:txCode/confirm — chính chủ giải phóng lệnh bị giữ sau
// giờ chờ an toàn, bằng Face ID/Google vừa xong. Không cần admin.
router.post('/holds/:txCode/confirm', requireMember, requireRecentAuth(), async (req, res) => {
  try {
    const result = await releaseHeldTransfer(String(req.params.txCode), req.memberEmail);
    if (!result.ok) return res.status(409).json({ error: result.error || 'Lệnh chưa hết giờ chờ hoặc đã được xử lý.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
