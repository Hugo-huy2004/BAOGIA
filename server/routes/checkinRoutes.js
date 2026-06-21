import express from 'express';
import { claimCheckin, getCheckinStatus } from '../utils/checkinService.js';

const router = express.Router();

// GET /api/checkin/status?email=
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });
    const status = await getCheckinStatus(email);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/checkin/claim  { email }
router.post('/claim', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    const result = await claimCheckin(email);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
