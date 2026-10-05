/**
 * planController.js
 * Controller tập trung toàn bộ logic nghiệp vụ thang bậc sở hữu ứng dụng, dùng thử, mua vĩnh viễn và tặng quà.
 */
import Bio from '../../models/Bio.js';
import {
  APP_PLANS,
  PLAN_APP_IDS,
  isPlanApp,
  planLadder,
  planState,
  startTrial,
  purchasePlan,
} from '../../utils/appPlanService.js';
import { notifyMember } from '../../utils/notifyMember.js';

/**
 * Tra cứu người nhận quà bằng mã giới thiệu / email / số điện thoại
 */
export async function resolveRecipient({ toReferralCode, toEmail, toPhone }) {
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

/**
 * Lấy bảng giá & tình trạng gói sở hữu của thành viên cho các ứng dụng
 */
export async function getStorePlans(req, res) {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email }).lean();
    if (!bio) bio = await Bio.findOne({ contactEmail: email }).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    return res.json({
      balance: Number(bio.joyBalance) || 0,
      plans: PLAN_APP_IDS.map((appId) => ({
        ...planLadder(appId),
        state: planState(bio, appId),
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * Bắt đầu dùng thử ứng dụng
 */
export async function startAppTrial(req, res) {
  try {
    const { appId } = req.body;
    if (!isPlanApp(appId)) return res.status(400).json({ error: 'Ứng dụng không hợp lệ.' });

    const result = await startTrial(req.memberEmail, appId);

    await notifyMember({
      email: req.memberEmail,
      type: 'success',
      category: 'package',
      key: 'event.trialStarted',
      params: {
        app: APP_PLANS[appId].label,
        days: result.days,
        date: new Date(result.expiresAt).toISOString(),
      },
      actionUrl: '/member/utilities/store',
    });

    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/**
 * Mua quyền sở hữu vĩnh viễn ứng dụng
 */
export async function purchaseOwnApp(req, res) {
  try {
    const { appId } = req.body;
    if (!isPlanApp(appId)) return res.status(400).json({ error: 'Ứng dụng không hợp lệ.' });

    const result = await purchasePlan({ payerEmail: req.memberEmail, appId, tier: 'own' });
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/**
 * Tặng gói ứng dụng cho bạn bè
 */
export async function giftAppPlan(req, res) {
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
    const what =
      tier === 'own'
        ? `${APP_PLANS[appId].label} — sở hữu vĩnh viễn`
        : `${APP_PLANS[appId].label} (${result.months} tháng)`;
    const note = String(message).trim().slice(0, 200);

    await notifyMember({
      email: recipient.email,
      type: 'success',
      category: 'joy',
      key: 'event.appGift',
      params: { sender: senderName, item: what, ...(note ? { note } : {}) },
      actionUrl: '/member/utilities/store',
    });

    return res.json({
      success: true,
      ...result,
      recipient: { displayName: recipient.displayName || '', avatarUrl: recipient.avatarUrl || '' },
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

/**
 * Tra cứu thông tin người nhận trước khi tặng
 */
export async function lookupPlanRecipient(req, res) {
  try {
    const handle = String(req.query.handle || '').trim();
    if (!handle) return res.status(400).json({ error: 'Thiếu thông tin người nhận.' });

    const recipient = await resolveRecipient(
      handle.includes('@')
        ? { toEmail: handle }
        : /^[0-9+\s.-]{8,}$/.test(handle)
          ? { toPhone: handle }
          : { toReferralCode: handle }
    );
    if (!recipient) return res.json({ found: false });
    if (recipient.email === req.memberEmail) {
      return res.json({ found: false, error: 'Đây là tài khoản của bạn.' });
    }

    return res.json({
      found: true,
      recipient: {
        displayName: recipient.displayName || 'Thành viên Hugo',
        avatarUrl: recipient.avatarUrl || '',
        referralCode: recipient.referralCode || '',
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
