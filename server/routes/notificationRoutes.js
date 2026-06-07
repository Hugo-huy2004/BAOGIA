import express from 'express';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';

const router = express.Router();

// Lấy cặp khóa từ environment, nếu chưa có thì khởi tạo động để hỗ trợ dev
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('⚠️  Chưa phát hiện VAPID keys trong .env. Đang tự động tạo VAPID keys tạm thời cho phiên chạy hiện tại...');
  const keys = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  };
  console.log(`🔑 VAPID Public Key: ${vapidKeys.publicKey}`);
  console.log(`🔑 VAPID Private Key: ${vapidKeys.privateKey}`);
  console.log('💡 Hãy sao chép 2 khóa này và dán vào file server/.env để duy trì lâu dài!');
}

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

// API 3 (Dùng thử): Gửi thông báo đẩy mẫu tới một email cụ thể
router.post('/send-test', async (req, res) => {
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
router.post('/test-proactive', async (req, res) => {
  try {
    triggerProactivePushNow(); // Run async without blocking
    res.json({ success: true, message: 'Đã kích hoạt trình kích hoạt AI Proactive Push thủ công thành công. Tiến trình sẽ chạy ngầm và gửi thông báo nếu AI quyết định cần thiết.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
export { vapidKeys };
