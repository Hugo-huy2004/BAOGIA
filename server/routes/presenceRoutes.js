import express from 'express';
import { recordHeartbeat, getOnlineStatuses, isOnline, getDailyActiveCount, todayStr } from '../utils/presenceService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/presence/heartbeat  { email }
router.post('/heartbeat', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    await recordHeartbeat(email);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/presence/status?email=x@y.com  OR  ?emails=a@x.com,b@y.com
router.get('/status', async (req, res) => {
  try {
    const { email, emails } = req.query;
    if (email) {
      const online = await isOnline(email);
      return res.json({ [email]: online });
    }
    if (emails) {
      const list = emails.split(',').map(e => e.trim()).filter(Boolean);
      const statuses = await getOnlineStatuses(list);
      return res.json(statuses);
    }
    res.status(400).json({ error: 'email or emails query param is required' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/presence/dau?date=YYYY-MM-DD  (admin analytics — distinct active members that day)
router.get('/dau', requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const count = await getDailyActiveCount(date);
    res.json({ date: date || todayStr(), count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
