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

export default router;
