import express from 'express';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { triggerSmartPushNow } from '../services/smartNotificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env vars are loaded even when run from test runner (Vitest)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const router = express.Router();

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('⚠️  Chưa phát hiện VAPID keys trong .env. Đang tự động tạo VAPID keys...');
  const keys = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  };
  console.log(`🔑 VAPID Public Key: ${vapidKeys.publicKey}`);
  console.log(`🔑 VAPID Private Key: ${vapidKeys.privateKey}`);

  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Parse lines and replace or append in-place to prevent duplicate keys
    const lines = envContent.split('\n');
    let hasPublic = false;
    let hasPrivate = false;
    const newLines = lines.map(line => {
      if (line.startsWith('VAPID_PUBLIC_KEY=')) {
        hasPublic = true;
        return `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
      }
      if (line.startsWith('VAPID_PRIVATE_KEY=')) {
        hasPrivate = true;
        return `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
      }
      return line;
    });

    if (!hasPublic) {
      newLines.push(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    }
    if (!hasPrivate) {
      newLines.push(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    console.log('✅ Đã tự động lưu VAPID keys vào file server/.env để tái sử dụng lâu dài!');
  } catch (err) {
    console.error('❌ Không thể tự động ghi VAPID keys vào .env:', err.message);
  }
}

export { vapidKeys };

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@hugostudio.vn';

webpush.setVapidDetails(
  vapidSubject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// API 1: Client lấy VAPID Public Key để thực hiện đăng ký phía trình duyệt
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// API 2: Nhận và lưu trữ Subscription Object từ client gửi lên
router.post('/subscribe', async (req, res) => {
  try {
    const { email, subscription } = req.body;

    if (!email || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Email và đối tượng Subscription đầy đủ là bắt buộc.' });
    }

    // Cập nhật subscription mới hoặc ghi đè nếu trùng endpoint
    const updatedSub = await NotificationSubscription.findOneAndUpdate(
      { "subscription.endpoint": subscription.endpoint },
      { email, subscription },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Đã lưu đăng ký thông báo đẩy thành công.', data: updatedSub });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Removes this device's push subscription — used by the Settings tab's
// notification toggle to actually stop push delivery, not just hide the UI.
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint là bắt buộc.' });
    await NotificationSubscription.deleteOne({ 'subscription.endpoint': endpoint });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 3 (Dùng thử): Gửi thông báo đẩy mẫu tới một email cụ thể
// requireAdmin: nội dung push (title/body/url) do client quyết định → chỉ admin,
// tránh biến thành kênh phishing/spam đẩy tới email bất kỳ đã đăng ký.
router.post('/send-test', requireAdmin, async (req, res) => {
  try {
    const { email, title, body, url } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc.' });
    }

    const subscriptions = await NotificationSubscription.find({ email });
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đăng ký thông báo đẩy cho email này.' });
    }

    const payload = JSON.stringify({
      title: title || 'Thông báo đẩy thử nghiệm',
      body: body || 'Xin chào! Đây là thông báo đẩy từ máy chủ của website.',
      icon: '/image/avt7.png',
      url: url || '/member/portal?tab=banhocduong'
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error(`Gửi thông báo thất bại cho endpoint: ${sub.subscription.endpoint}`, err);
          // Nếu lỗi do thiết bị đã thu hồi quyền (410 Gone / 404), xóa khỏi DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            return NotificationSubscription.deleteOne({ _id: sub._id });
          }
        })
    );

    await Promise.all(sendPromises);
    res.json({ success: true, message: `Đã phát thông báo mẫu tới ${subscriptions.length} thiết bị.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import { triggerProactivePushNow } from '../services/proactivePushService.js';

// API 4 (Dùng thử): Kích hoạt thủ công Cron Job AI Proactive Push để test
// requireAdmin: chạy job AI ngầm (tốn quota Gemini + đẩy push) → không để lộ công khai.
router.post('/test-proactive', requireAdmin, async (req, res) => {
  try {
    triggerProactivePushNow(); // Run async without blocking
    res.json({ success: true, message: 'Đã kích hoạt trình kích hoạt AI Proactive Push thủ công thành công. Tiến trình sẽ chạy ngầm và gửi thông báo nếu AI quyết định cần thiết.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Trigger smart notification push manual nudge (wellness, sleep, etc.)
router.post('/trigger-smart-push', requireAdmin, async (req, res) => {
  try {
    const { contextHint = 'wellness_nudge' } = req.body;
    await triggerSmartPushNow(contextHint);
    res.json({ success: true, message: `Đã gửi nudge "${contextHint}" thành công cho tất cả thành viên active.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// API: Phát sóng thông báo cho tất cả người dùng (Admin)
import Bio from '../models/Bio.js';
import InAppNotification, { pruneNotifications } from '../models/InAppNotification.js';

router.post('/broadcast-all', requireAdmin, async (req, res) => {
  try {
    const { title, message, type = 'info', category = 'system', actionUrl = '', targetEmail = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'Tiêu đề là bắt buộc.' });
    const normalizedTargetEmail = String(targetEmail || '').trim().toLowerCase();
    const isBroadcastAll = normalizedTargetEmail === '' || normalizedTargetEmail === 'all';

    // Nếu có targetEmail thì chỉ gửi cho đúng người đó. Nếu không, mới broadcast.
    const activeUsers = await Bio.find(
      isBroadcastAll ? { status: 'active' } : { status: 'active', email: normalizedTargetEmail },
      'email'
    );
    if (!activeUsers || activeUsers.length === 0) {
      return res.status(404).json({ error: isBroadcastAll ? 'Không tìm thấy người dùng hoạt động.' : 'Không tìm thấy thành viên active với email này.' });
    }

    // 1. Tạo InAppNotification cho từng người dùng
    const notifications = activeUsers.map(user => ({
      email: user.email,
      type,
      category,
      title,
      message,
      actionUrl
    }));
    await InAppNotification.insertMany(notifications);
    // insertMany() skips the schema's post-save prune hook — enforce the
    // 100-per-account cap manually for every user just notified.
    Promise.all(activeUsers.map(u => pruneNotifications(u.email))).catch(e => console.error('[broadcast prune]', e.message));

    // 2. Bắn thông báo Push qua webpush cho những người dùng đã đăng ký
    const subscriptions = await NotificationSubscription.find(
      isBroadcastAll ? { email: { $in: activeUsers.map(user => user.email) } } : { email: normalizedTargetEmail }
    );
    
    let sentCount = 0;
    let failedCount = 0;

    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: title,
        body: message,
        icon: '/image/avt7.png', // Default icon
        url: actionUrl || '/'
      });

      const sendPromises = subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload)
          .then(() => sentCount++)
          .catch(err => {
            failedCount++;
            console.error(`Broadcast: Gửi thông báo thất bại cho endpoint: ${sub.subscription.endpoint}`);
            // Xóa sub nếu hết hạn hoặc lỗi
            if (err.statusCode === 410 || err.statusCode === 404) {
              return NotificationSubscription.deleteOne({ _id: sub._id });
            }
          })
      );

      await Promise.allSettled(sendPromises);
    }

    res.json({ 
      success: true, 
      message: isBroadcastAll
        ? `Đã gửi in-app cho ${activeUsers.length} người. Gửi Push thành công ${sentCount}, thất bại ${failedCount}.`
        : `Đã gửi thông báo cho ${normalizedTargetEmail}. Push thành công ${sentCount}, thất bại ${failedCount}.`,
      stats: { inAppSent: activeUsers.length, pushSent: sentCount, pushFailed: failedCount }
    });
  } catch (error) {
    console.error('Lỗi Broadcast Notification:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
