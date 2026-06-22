import express from 'express';
import Bio from '../models/Bio.js';
import { awardJoy, getJoyHistory } from '../utils/joyService.js';
import { ensureReferralCode } from '../utils/referralService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

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

export default router;
