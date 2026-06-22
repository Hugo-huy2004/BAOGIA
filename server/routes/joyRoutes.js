import express from 'express';
import Bio from '../models/Bio.js';
import { awardJoy, getJoyHistory } from '../utils/joyService.js';
import { ensureReferralCode } from '../utils/referralService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Phone-based P2P JOY transfer — "send JOY by phone like MoMo" without real
// SMS/OTP infra (none exists in this codebase): Bio.phone is enforced unique
// at the DB level (see Bio.js's partial index), so "verified" here means
// guaranteed-single-owner, not SMS-verified. A 5% friction fee discourages
// spammy transfers without acting as a platform revenue cut ("phi lợi nhuận").
const TRANSFER_MIN = 10;
const TRANSFER_MAX = 1000;
const TRANSFER_DAILY_CAP = 1000;
const TRANSFER_FEE_RATE = 0.05;
const TRANSFER_MIN_ACCOUNT_AGE_DAYS = 3;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/joy/balance?email=
router.get('/balance', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const referralCode = await ensureReferralCode(bio);
    res.json({ balance: bio.joyBalance, referralCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/history?email=&limit=20
router.get('/history', async (req, res) => {
  try {
    const { email, limit } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    const transactions = await getJoyHistory(email, limit);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/adjust (admin-only manual correction tool)
router.post('/adjust', requireAdmin, async (req, res) => {
  try {
    const { email, amount, description } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'email and amount are required' });

    const result = await awardJoy(email, Number(amount), 'admin_adjustment', description || 'Điều chỉnh JOY bởi quản trị viên');
    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-learning
router.post('/award-learning', async (req, res) => {
  try {
    const { email, lessonId } = req.body;
    if (!email || !lessonId) return res.status(400).json({ error: 'Email and lessonId are required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!bio.completedLessons) {
      bio.completedLessons = [];
    }

    if (bio.completedLessons.includes(lessonId)) {
      return res.json({ success: true, alreadyCompleted: true, balance: bio.joyBalance });
    }

    const result = await awardJoy(email, 10, 'ide_learning', `Hoàn thành bài học IDE: ${lessonId}`);
    bio.completedLessons.push(lessonId);
    bio.markModified('completedLessons');
    await bio.save();

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-focus
router.post('/award-focus', async (req, res) => {
  try {
    const { email, minutes } = req.body;
    if (!email || !minutes) return res.status(400).json({ error: 'Email and minutes are required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    let joyAmount = 0;
    if (minutes >= 180) joyAmount = 50;
    else if (minutes >= 60) joyAmount = 15;
    else if (minutes >= 25) joyAmount = 5;

    if (joyAmount <= 0) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    const result = await awardJoy(email, joyAmount, 'focus_session', `Tập trung sâu HugoAura: ${minutes} phút`);

    res.json({ success: true, balance: result.balance, awarded: joyAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/rent-theme
router.post('/rent-theme', async (req, res) => {
  try {
    const { email, themeId } = req.body;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const price = 50;
    if (bio.joyBalance < price) {
      return res.status(400).json({ error: `Bạn cần ít nhất ${price} JOY để thuê giao diện này.` });
    }

    // Deduct 50 JOY and create ledger record
    const result = await awardJoy(bio.email, -price, 'aura_theme_rent', `Thuê giao diện Aura: ${themeId} (1 ngày)`);
    
    // Extends or creates theme expiration in rentedThemes
    const extensionMs = 24 * 60 * 60 * 1000; // 1 day
    const existingTheme = result.bio.rentedThemes.find(t => t.themeId === themeId);

    if (existingTheme) {
      // If it exists and is still active, extend. If it's expired, start fresh.
      const currentExpiry = new Date(existingTheme.expiresAt).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      existingTheme.expiresAt = new Date(baseTime + extensionMs);
    } else {
      result.bio.rentedThemes.push({
        themeId,
        expiresAt: new Date(Date.now() + extensionMs)
      });
    }

    // Automatically set it as active
    result.bio.activeAuraTheme = themeId;
    result.bio.markModified('rentedThemes');
    await result.bio.save();

    res.json({ success: true, balance: result.bio.joyBalance, bio: result.bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/set-theme
router.post('/set-theme', async (req, res) => {
  try {
    const { email, themeId } = req.body;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (themeId !== 'default') {
      const existingTheme = bio.rentedThemes.find(t => t.themeId === themeId);
      if (!existingTheme || new Date(existingTheme.expiresAt).getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Giao diện chưa được thuê hoặc đã hết hạn sử dụng.' });
      }
    }

    bio.activeAuraTheme = themeId;
    await bio.save();

    res.json({ success: true, bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/resolve-phone?phone= — lookup before sending, MoMo-style confirm.
// Never returns email (privacy) — only what's needed to show "Gửi tới: <name>".
router.get('/resolve-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc.' });

    const bio = await Bio.findOne({ phone: String(phone).trim() });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng với số điện thoại này.' });

    res.json({ displayName: bio.displayName || 'Người dùng Hugo Studio', avatar: bio.avatarUrl || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/transfer  { fromEmail, toPhone, amount, message }
router.post('/transfer', async (req, res) => {
  try {
    const { fromEmail, toPhone, amount, message } = req.body;
    if (!fromEmail || !toPhone) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi hoặc số điện thoại người nhận.' });
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || !Number.isInteger(numAmount) || numAmount < TRANSFER_MIN || numAmount > TRANSFER_MAX) {
      return res.status(400).json({ error: `Số JOY gửi phải từ ${TRANSFER_MIN} đến ${TRANSFER_MAX}.` });
    }

    const sender = await Bio.findOne({ email: fromEmail });
    if (!sender) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người gửi.' });

    if (sender.joyBalance < 20) {
      return res.status(400).json({ error: 'Số dư của bạn phải có ít nhất 20 JOY mới được phép chuyển.' });
    }

    const accountAgeMs = Date.now() - new Date(sender.createdAt).getTime();
    if (accountAgeMs < TRANSFER_MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: `Tài khoản cần đủ ${TRANSFER_MIN_ACCOUNT_AGE_DAYS} ngày tuổi mới được gửi JOY.` });
    }

    const recipient = await Bio.findOne({ phone: String(toPhone).trim() });
    if (!recipient) return res.status(404).json({ error: 'Không tìm thấy người nhận với số điện thoại này.' });
    if (recipient.email === sender.email) {
      return res.status(400).json({ error: 'Không thể tự gửi JOY cho chính mình.' });
    }

    const today = todayStr();
    const sentTodaySoFar = sender.joySentDate === today ? sender.joySentToday : 0;
    if (sentTodaySoFar + numAmount > TRANSFER_DAILY_CAP) {
      return res.status(400).json({ error: `Vượt giới hạn gửi ${TRANSFER_DAILY_CAP} JOY/ngày. Cậu đã gửi ${sentTodaySoFar} JOY hôm nay.` });
    }

    const feeAmount = Math.floor(numAmount * TRANSFER_FEE_RATE);
    const totalDeducted = numAmount + feeAmount;

    if (sender.joyBalance < totalDeducted) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Bạn cần ${totalDeducted} JOY (bao gồm ${feeAmount} JOY phí giao dịch).` });
    }

    const customMsg = message ? ` Lời nhắn: "${message}"` : '';
    const recipientName = recipient.displayName || 'bạn bè';

    const senderResult = await awardJoy(
      sender.email, -totalDeducted, 'joy_gift_sent',
      `Gửi JOY cho ${recipientName} (-${numAmount} JOY, phí -${feeAmount} JOY).${customMsg}`,
      { refId: recipient.email }
    );
    const senderName = sender.displayName || 'Một người bạn';
    await awardJoy(
      recipient.email, numAmount, 'joy_gift_received',
      `${senderName} đã chuyển ${numAmount} JOY đến bạn.${customMsg}`,
      {
        refId: sender.email,
        notificationTitle: 'Bạn vừa nhận được JOY',
        notificationMessage: `${senderName} đã chuyển ${numAmount} JOY đến bạn.${customMsg} Số dư: ${Math.max(0, recipient.joyBalance + numAmount)} JOY.`,
        pushNotify: true,
        pushTitle: 'Bạn vừa nhận được JOY',
        pushBody: `${senderName} đã chuyển ${numAmount} JOY đến bạn.${customMsg}`,
        actionUrl: '/member/joy'
      }
    );

    // Atomic increment — avoids overwriting the balance awardJoy() just wrote
    // by saving a stale in-memory `sender` document.
    await Bio.updateOne(
      { email: sender.email },
      sender.joySentDate !== today
        ? { $set: { joySentDate: today, joySentToday: numAmount } }
        : { $set: { joySentDate: today }, $inc: { joySentToday: numAmount } }
    );

    res.json({
      success: true,
      balance: senderResult.balance,
      sentAmount: numAmount,
      netAmount,
      feeAmount,
      recipientName: recipient.displayName || ''
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
