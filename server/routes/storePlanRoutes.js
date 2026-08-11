import express from 'express';
import Bio from '../models/Bio.js';
import InAppNotification from '../models/InAppNotification.js';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  APP_PLANS,
  PLAN_APP_IDS,
  isPlanApp,
  planLadder,
  planState,
  startTrial,
  purchasePlan,
} from '../utils/appPlanService.js';

const router = express.Router();

/**
 * Thang bậc sở hữu ứng dụng của Hugo Store.
 *
 * Bậc THUÊ cố tình KHÔNG có endpoint riêng ở đây khi mua cho chính mình —
 * `POST /api/joy/subscribe-feature` đã làm đúng việc đó từ trước. Ở đây chỉ có
 * những thứ chưa từng tồn tại: dùng thử, sở hữu vĩnh viễn, và tặng cho bạn bè.
 */

/** Người nhận quà: tra bằng mã giới thiệu / email / số điện thoại. */
async function resolveRecipient({ toReferralCode, toEmail, toPhone }) {
  if (toReferralCode) {
    return Bio.findOne({ referralCode: String(toReferralCode).trim().toUpperCase() });
  }
  if (toEmail) {
    const value = String(toEmail).trim().toLowerCase();
    return Bio.findOne({ $or: [{ email: value }, { contactEmail: value }] });
  }
  if (toPhone) {
    return Bio.findOne({ phone: String(toPhone).trim() });
  }
  return null;
}

// ── GET /api/store/plans ────────────────────────────────────────────────────
// Bảng giá + bậc người dùng đang có, cho cả 5 ứng dụng có thu phí.
router.get('/plans', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email }).lean();
    if (!bio) bio = await Bio.findOne({ contactEmail: email }).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    res.json({
      balance: Number(bio.joyBalance) || 0,
      plans: PLAN_APP_IDS.map(appId => ({
        ...planLadder(appId),
        state: planState(bio, appId),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/store/plans/trial  { appId } ──────────────────────────────────
// Miễn phí nên không đi qua hoá đơn JOY; giới hạn một lần mỗi ứng dụng nằm ở
// startTrial(), không phải ở client.
router.post('/plans/trial', requireMember, async (req, res) => {
  try {
    const { appId } = req.body;
    if (!isPlanApp(appId)) return res.status(400).json({ error: 'Ứng dụng không hợp lệ.' });

    const result = await startTrial(req.memberEmail, appId);

    await InAppNotification.create({
      email: req.memberEmail,
      type: 'success',
      category: 'package',
      title: `Đã mở dùng thử ${APP_PLANS[appId].label}`,
      message: `Bạn có ${result.days} ngày dùng thử miễn phí. Hết hạn ngày ${new Date(result.expiresAt).toLocaleDateString('vi-VN')}.`,
      actionUrl: '/member/utilities/store',
    });

    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── POST /api/store/plans/own  { appId } ────────────────────────────────────
// Giá LUÔN tính lại ở server (purchasePlan); body không có trường giá nào.
router.post('/plans/own', requireMember, async (req, res) => {
  try {
    const { appId } = req.body;
    if (!isPlanApp(appId)) return res.status(400).json({ error: 'Ứng dụng không hợp lệ.' });

    const result = await purchasePlan({ payerEmail: req.memberEmail, appId, tier: 'own' });
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── POST /api/store/plans/gift ──────────────────────────────────────────────
// { appId, tier: 'rent'|'own', months?, toReferralCode|toEmail|toPhone, message? }
router.post('/plans/gift', requireMember, async (req, res) => {
  try {
    const { appId, tier, months, message = '', toReferralCode, toEmail, toPhone } = req.body;
    if (!isPlanApp(appId)) return res.status(400).json({ error: 'Ứng dụng không hợp lệ.' });
    if (tier !== 'rent' && tier !== 'own') return res.status(400).json({ error: 'Bậc quà tặng không hợp lệ.' });

    const recipient = await resolveRecipient({ toReferralCode, toEmail, toPhone });
    if (!recipient) return res.status(404).json({ error: 'Không tìm thấy người nhận.' });
    if (recipient.email === req.memberEmail) {
      return res.status(400).json({ error: 'Không thể tự tặng quà cho chính mình.' });
    }

    const result = await purchasePlan({
      payerEmail: req.memberEmail,
      appId,
      tier,
      months,
      recipientEmail: recipient.email,
    });

    let sender = await Bio.findOne({ email: req.memberEmail }).lean();
    if (!sender) sender = await Bio.findOne({ contactEmail: req.memberEmail }).lean();
    const senderName = sender?.displayName || 'Một người bạn';
    const what = tier === 'own'
      ? `${APP_PLANS[appId].label} — sở hữu vĩnh viễn`
      : `${APP_PLANS[appId].label} (${result.months} tháng)`;
    const note = String(message).trim().slice(0, 200);

    await InAppNotification.create({
      email: recipient.email,
      type: 'success',
      category: 'joy',
      title: `${senderName} đã tặng bạn ${what}`,
      message: note || 'Mở Hugo Store để bắt đầu dùng ngay.',
      actionUrl: '/member/utilities/store',
    });

    res.json({
      success: true,
      ...result,
      recipient: { displayName: recipient.displayName || '', avatarUrl: recipient.avatarUrl || '' },
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── GET /api/store/plans/lookup?handle= ─────────────────────────────────────
// Xem trước người nhận trước khi tặng — chỉ trả tên và ảnh, không lộ email/sđt.
router.get('/plans/lookup', requireMember, async (req, res) => {
  try {
    const handle = String(req.query.handle || '').trim();
    if (!handle) return res.status(400).json({ error: 'Thiếu thông tin người nhận.' });

    const recipient = await resolveRecipient(
      handle.includes('@') ? { toEmail: handle }
        : /^[0-9+\s.-]{8,}$/.test(handle) ? { toPhone: handle }
          : { toReferralCode: handle }
    );
    if (!recipient) return res.json({ found: false });
    if (recipient.email === req.memberEmail) {
      return res.json({ found: false, error: 'Đây là tài khoản của bạn.' });
    }

    res.json({
      found: true,
      recipient: {
        displayName: recipient.displayName || 'Thành viên Hugo',
        avatarUrl: recipient.avatarUrl || '',
        referralCode: recipient.referralCode || '',
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
