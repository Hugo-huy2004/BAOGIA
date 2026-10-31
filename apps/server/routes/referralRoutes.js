import express from 'express';
import Bio from '../models/Bio.js';
import { ensureReferralCode, applyReferral } from '../utils/referralService.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/referral/me — identity from the verified member token
router.get('/me', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const referralCode = await ensureReferralCode(bio);
    res.json({
      referralCode,
      referralCount: bio.referralCount,
      referralApplied: bio.referralApplied,
      referredBy: bio.referredBy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/referral/apply  { referrerCode }
router.post('/apply', requireMember, async (req, res) => {
  try {
    const { referrerCode } = req.body;
    const email = req.memberEmail;
    if (!referrerCode) {
      return res.status(400).json({ error: 'referrerCode is required' });
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
