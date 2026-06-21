import express from 'express';
import Bio from '../models/Bio.js';
import { ensureReferralCode, applyReferral } from '../utils/referralService.js';

const router = express.Router();

// GET /api/referral/me?email=
router.get('/me', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const referralCode = await ensureReferralCode(bio);
    res.json({ referralCode, referralCount: bio.referralCount, referredBy: bio.referredBy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/referral/apply  { email, referrerCode }
router.post('/apply', async (req, res) => {
  try {
    const { email, referrerCode } = req.body;
    if (!email || !referrerCode) {
      return res.status(400).json({ error: 'email and referrerCode are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const result = await applyReferral(bio, referrerCode);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
