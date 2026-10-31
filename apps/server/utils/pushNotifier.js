import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { vapidKeys } from '../routes/notificationRoutes.js';
import { notificationLanguage } from '../../../packages/shared/notificationText.js';
import { renderNotification } from '../../../packages/shared/pushText.js';
import { denomKey } from '../../../packages/shared/joyCurrency.js';
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
 * Push của Education Hugo: chỉ tới máy đăng ký từ tên miền Edu (site 'edu'),
 * chạm vào thì mở trong app Edu. Edu chỉ có tiếng Việt nên chữ soạn sẵn.
 */
export async function sendEduPush(email, { title, body, url = '/learn', tag }) {
  return deliver(email, () => ({ title, body }), url, { site: 'edu', ...(tag ? { tag } : {}) });
}

/**
 * Gửi push dựng theo ngôn ngữ CỦA TỪNG THIẾT BỊ.
 *
 * Thông báo đẩy do hệ điều hành vẽ khi app đã đóng, nên không thể để client
 * dịch như trong hộp thư — chữ phải đúng ngôn ngữ ngay lúc gửi. Ngôn ngữ lấy từ
 * `device.locale` mà thiết bị gửi lên lúc đăng ký; thiếu thì rơi về tiếng Việt.
 *
 * @param {string} email
 * @param {string} key khoá trong packages/shared/notificationText.js
 * @param {object} params tham số của khoá
 * @param {string} url đường dẫn mở khi chạm vào thông báo
 */
export async function sendLocalizedPush(email, key, params = {}, url = '/member/today', money = null) {
  // Ngôn ngữ theo THIẾT BỊ, nhưng đơn vị tiền theo TÀI KHOẢN: người dùng chọn
  // đơn vị một lần và nó cố định, đổi máy hay đổi ngôn ngữ đều không đổi nó.
  const denom = await denomOfMember(email);
  return deliver(email, (sub) => {
    const language = notificationLanguage(sub.device?.locale);
    const text = renderNotification(key, params, language, denom);
    if (!text) return null;
    if (!money) return { title: text.title, body: text.message };
    return { title: text.title, body: [moneyLine(money, language, denom), text.message].filter(Boolean).join('\n') };
  }, url, money ? {
    // Thông báo hệ thống: ưu tiên cao, giữ trên màn hình tới khi người dùng chạm,
    // mỗi giao dịch một thẻ riêng (hai lần nhận liên tiếp không đè nhau).
    tag: `joy-${money.refCode || Date.now()}`,
    requireInteraction: true,
    kind: 'system',
    urgency: 'high',
  } : {});
}

/**
 * "+50.000 Kavo · Hugo" / "Số dư 120.000 Kavo · Mã GD JOYABC" — hai dòng chi
 * tiết của push biến động JOY, theo ngôn ngữ thiết bị và đơn vị tài khoản.
 */
function moneyLine({ amount, balanceAfter, refCode, counterparty }, language, denom) {
  const part = (key, params) => renderNotification(key, params, language, denom)?.title;
  const head = `${amount < 0 ? '−' : '+'}${part('push.joyAmount', { amount: Math.abs(amount) })}`
    + (counterparty ? ` · ${counterparty}` : '');
  const tail = [
    balanceAfter != null && part('push.joyBalance', { balance: balanceAfter }),
    refCode && part('push.joyRef', { ref: refCode }),
  ].filter(Boolean).join(' · ');
  return [head, tail].filter(Boolean).join('\n');
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

const DEAD = new Set([403, 404, 410]);
const maskEmail = (email) => String(email).replace(/^(.{2}).*(@.*)$/, '$1***$2');

/** Phần chung: tìm thiết bị, gửi, dọn đăng ký chết. */
async function deliver(email, textFor, url, extra = {}) {
  const { urgency = 'normal', site = 'www', ...shown } = extra;
  try {
    if (!email) return;

    // Tìm tất cả các subscription (thiết bị đăng ký) của email này
    // Máy Edu chỉ nhận push của Edu (đường dẫn www mở trong app Edu là trang trắng).
    const subscriptions = await NotificationSubscription.find({ email, site: site === 'edu' ? 'edu' : { $ne: 'edu' } });
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    let sent = 0;
    let removed = 0;
    let failed = 0;
    // Gửi theo batch để tránh bị chặn (ví dụ Apple Push rate limit) khi user có hàng trăm thiết bị
    const BATCH_SIZE = 10;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(sub => {
        const text = textFor(sub);
        if (!text?.title) return Promise.resolve();
        const payload = JSON.stringify({
          title: text.title,
          body: text.body || '',
          icon: site === 'edu' ? '/edu/icon-192.png' : '/image/avt7.png',
          url: url || '/member/today',
          ...shown,
        });
        return webpush.sendNotification(sub.subscription, payload, { urgency, TTL: 24 * 3600 })
          .then(() => { sent += 1; })
          .catch(err => {
            // 404/410: thiết bị đã huỷ. 403: đăng ký làm với cặp khoá VAPID khác —
            // không bao giờ gửi được nữa. 429/5xx/mạng là lỗi tạm: giữ lại, lần sau thử tiếp.
            if (DEAD.has(err.statusCode)) {
              removed += 1;
              return NotificationSubscription.deleteOne({ _id: sub._id }).catch(console.error);
            }
            failed += 1;
            console.error(`[Push Notifier] Lỗi tạm (${err.statusCode || 'mạng'}) tại ${new URL(sub.subscription.endpoint).host}:`, err.body || err.message);
          });
      });
      await Promise.all(batchPromises);
    }
    
    console.log(`[Push Notifier] ${maskEmail(email)}: gửi được ${sent}/${subscriptions.length}`
      + (removed ? `, xoá ${removed} đăng ký chết` : '') + (failed ? `, ${failed} lỗi tạm` : ''));
  } catch (error) {
    console.error('[Push Notifier] Lỗi gửi thông báo đẩy:', error);
  }
}
