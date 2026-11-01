import express from 'express';
import InAppNotification from '../models/InAppNotification.js';
import { requireMember, requireMemberSession } from '../middleware/authMiddleware.js';

const router = express.Router();

// Đọc / đánh dấu đã đọc chỉ cần phiên (Education Hugo dùng chung hộp thông báo, không đòi hồ sơ đủ).
// All inbox routes are scoped to the verified member token — a member can only
// ever read/mutate their own notifications.

// GET /api/inbox?limit=20
router.get('/', requireMemberSession, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const email = req.memberEmail;
    const items = await InAppNotification.find({ email })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    const unreadCount = await InAppNotification.countDocuments({ email, read: false });
    res.json({ notifications: items, unreadCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/inbox — a member creates a notification for themself (self-reminders
// from client flows). Server-internal senders call the model directly.
router.post('/', requireMember, async (req, res) => {
  try {
    const { type, category, title, message, actionUrl } = req.body;
    const email = req.memberEmail;
    if (!title) return res.status(400).json({ error: 'title required' });
    const notif = await InAppNotification.create({ email, type, category, title, message, actionUrl });
    res.status(201).json({ notification: notif });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/inbox/read-all — must come before /:id
router.patch('/read-all', requireMemberSession, async (req, res) => {
  try {
    const result = await InAppNotification.updateMany(
      { email: req.memberEmail, read: false },
      { $set: { read: true } },
    );
    res.json({
      success: true,
      modifiedCount: result.modifiedCount || 0,
      unreadCount: 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/inbox/:id/read
router.patch('/:id/read', requireMemberSession, async (req, res) => {
  try {
    await InAppNotification.findOneAndUpdate(
      { _id: req.params.id, email: req.memberEmail },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inbox/:id
router.delete('/:id', requireMember, async (req, res) => {
  try {
    await InAppNotification.findOneAndDelete({ _id: req.params.id, email: req.memberEmail });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
