import express from 'express';
import InAppNotification from '../models/InAppNotification.js';

const router = express.Router();

// GET /api/inbox?email=xxx&limit=20
router.get('/', async (req, res) => {
  try {
    const { email, limit = 20 } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const items = await InAppNotification.find({ email })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    const unreadCount = await InAppNotification.countDocuments({ email, read: false });
    res.json({ notifications: items, unreadCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/inbox — create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const { email, type, category, title, message, actionUrl } = req.body;
    if (!email || !title) return res.status(400).json({ error: 'email and title required' });
    const notif = await InAppNotification.create({ email, type, category, title, message, actionUrl });
    res.status(201).json({ notification: notif });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/inbox/read-all?email=xxx  — must come before /:id
router.patch('/read-all', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    await InAppNotification.updateMany({ email, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/inbox/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    await InAppNotification.findByIdAndUpdate(req.params.id, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inbox/:id
router.delete('/:id', async (req, res) => {
  try {
    await InAppNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
