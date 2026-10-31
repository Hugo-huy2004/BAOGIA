import express from 'express';
import { claimCheckin, getCheckinStatus } from '../utils/checkinService.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/checkin/status — identity from the verified member token
router.get('/status', requireMember, async (req, res) => {
  try {
    const status = await getCheckinStatus(req.memberEmail);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/checkin/claim
router.post('/claim', requireMember, async (req, res) => {
  try {
    const result = await claimCheckin(req.memberEmail);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
