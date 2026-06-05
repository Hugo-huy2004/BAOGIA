import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { vapidKeys } from '../routes/notificationRoutes.js';

// Setup VAPID details
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@hugostudio.vn';
if (vapidKeys && vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      vapidSubject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (err) {
    console.error('[Push Notifier] Error setting VAPID details:', err);
  }
}

/**
 * Gửi thông báo đẩy đến tất cả thiết bị của một người dùng theo email.
 * @param {string} email Email người nhận
 * @param {string} title Tiêu đề thông báo
 * @param {string} body Nội dung thông báo
 * @param {string} [url] Đường dẫn khi click vào thông báo
 */
export async function sendPushNotification(email, title, body, url = '/member/portal') {
  try {
    if (!email) return;

    // Tìm tất cả các subscription (thiết bị đăng ký) của email này
    const subscriptions = await NotificationSubscription.find({ email });
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/image/avt7.png',
      url: url || '/member/portal'
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error(`[Push Notifier] Gửi thất bại cho ${email} tại endpoint: ${sub.subscription.endpoint}`, err.message);
          // Nếu quyền bị hủy hoặc endpoint hỏng, xóa đăng ký
          if (err.statusCode === 410 || err.statusCode === 404) {
            return NotificationSubscription.deleteOne({ _id: sub._id }).catch(console.error);
          }
        })
    );

    await Promise.all(sendPromises);
    console.log(`[Push Notifier] Đã gửi thông báo đến ${subscriptions.length} thiết bị của ${email}`);
  } catch (error) {
    console.error('[Push Notifier] Lỗi gửi thông báo đẩy:', error);
  }
}
