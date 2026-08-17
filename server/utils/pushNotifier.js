import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { vapidKeys } from '../routes/notificationRoutes.js';
import { renderNotification, notificationLanguage } from '../../shared/notificationText.js';
import { denomKey } from '../../shared/joyCurrency.js';
import Bio from '../models/Bio.js';

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
export async function sendPushNotification(email, title, body, url = '/member/today') {
  return deliver(email, () => ({ title, body }), url);
}

/**
 * Gửi push dựng theo ngôn ngữ CỦA TỪNG THIẾT BỊ.
 *
 * Thông báo đẩy do hệ điều hành vẽ khi app đã đóng, nên không thể để client
 * dịch như trong hộp thư — chữ phải đúng ngôn ngữ ngay lúc gửi. Ngôn ngữ lấy từ
 * `device.locale` mà thiết bị gửi lên lúc đăng ký; thiếu thì rơi về tiếng Việt.
 *
 * @param {string} email
 * @param {string} key khoá trong shared/notificationText.js
 * @param {object} params tham số của khoá
 * @param {string} url đường dẫn mở khi chạm vào thông báo
 */
export async function sendLocalizedPush(email, key, params = {}, url = '/member/today') {
  // Ngôn ngữ theo THIẾT BỊ, nhưng đơn vị tiền theo TÀI KHOẢN: người dùng chọn
  // đơn vị một lần và nó cố định, đổi máy hay đổi ngôn ngữ đều không đổi nó.
  const denom = await denomOfMember(email);
  return deliver(email, (sub) => {
    const language = notificationLanguage(sub.device?.locale);
    const text = renderNotification(key, params, language, denom);
    return text ? { title: text.title, body: text.message } : null;
  }, url);
}

/** Đơn vị hiển thị của một thành viên; hỏng hay thiếu thì về đơn vị mặc định. */
async function denomOfMember(email) {
  try {
    const bio = await Bio.findOne({ email }).select('joyDenom').lean();
    return denomKey(bio?.joyDenom);
  } catch {
    return denomKey(null);
  }
}

/** Phần chung: tìm thiết bị, gửi, dọn đăng ký chết. */
async function deliver(email, textFor, url) {
  try {
    if (!email) return;

    // Tìm tất cả các subscription (thiết bị đăng ký) của email này
    const subscriptions = await NotificationSubscription.find({ email });
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const sendPromises = subscriptions.map(sub => {
      const text = textFor(sub);
      if (!text?.title) return Promise.resolve();
      const payload = JSON.stringify({
        title: text.title,
        body: text.body || '',
        icon: '/image/avt7.png',
        url: url || '/member/today'
      });
      return webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error(`[Push Notifier] Gửi thất bại cho ${email} tại endpoint: ${sub.subscription.endpoint}`, err.message);
          // Nếu quyền bị hủy hoặc endpoint hỏng, xóa đăng ký
          if (err.statusCode === 410 || err.statusCode === 404) {
            return NotificationSubscription.deleteOne({ _id: sub._id }).catch(console.error);
          }
        });
    });

    await Promise.all(sendPromises);
    console.log(`[Push Notifier] Đã gửi thông báo đến ${subscriptions.length} thiết bị của ${email}`);
  } catch (error) {
    console.error('[Push Notifier] Lỗi gửi thông báo đẩy:', error);
  }
}
