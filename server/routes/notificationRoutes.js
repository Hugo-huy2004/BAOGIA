import express from 'express';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import {
  getVapidPublicKey,
  subscribeWebPush,
  unsubscribeWebPush,
  sendTestNotification,
  testProactivePush,
  triggerSmartPush,
  broadcastAllNotifications,
  subscribeNativeDevice,
  unsubscribeNativeDevice,
  vapidKeys,
} from '../modules/notification/notificationController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/notifications
// Điều phối các API con của phân hệ Thông Báo Đẩy (Web Push & Native Push)
// ==========================================

// --- 1. Client lấy VAPID Public Key (Công khai) ---
router.get('/vapid-public-key', async (req, res) => {
  return getVapidPublicKey(req, res);
});

// --- 2. Thành viên: Quản lý đăng ký Web Push ---
router.post('/subscribe', requireMember, async (req, res) => {
  return subscribeWebPush(req, res);
});

router.post('/unsubscribe', requireMember, async (req, res) => {
  return unsubscribeWebPush(req, res);
});

// --- 3. Thành viên: Quản lý thiết bị Native (iOS / Android) ---
router.post('/native/subscribe', requireMember, async (req, res) => {
  return subscribeNativeDevice(req, res);
});

router.post('/native/unsubscribe', requireMember, async (req, res) => {
  return unsubscribeNativeDevice(req, res);
});

// --- 4. Quản trị viên: Gửi thử nghiệm & Tác vụ Push AI ---
router.post('/send-test', requireAdmin, async (req, res) => {
  return sendTestNotification(req, res);
});

router.post('/test-proactive', requireAdmin, async (req, res) => {
  return testProactivePush(req, res);
});

router.post('/trigger-smart-push', requireAdmin, async (req, res) => {
  return triggerSmartPush(req, res);
});

router.post('/broadcast-all', requireAdmin, async (req, res) => {
  return broadcastAllNotifications(req, res);
});

export { vapidKeys };
export default router;
