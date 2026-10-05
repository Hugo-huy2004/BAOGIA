/**
 * notificationController.js
 * Controller tập trung toàn bộ logic nghiệp vụ Web Push & Native Push Notification (APNs/FCM).
 */
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import NotificationSubscription from '../../models/NotificationSubscription.js';
import NativePushDevice from '../../models/NativePushDevice.js';
import Bio from '../../models/Bio.js';
import InAppNotification, { pruneNotifications } from '../../models/InAppNotification.js';
import { triggerSmartPushNow } from '../../services/smartNotificationService.js';
import { triggerProactivePushNow } from '../../services/proactivePushService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('⚠️  Chưa phát hiện VAPID keys trong .env. Đang tự động tạo VAPID keys...');
  const keys = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
  console.log(`🔑 VAPID Public Key: ${vapidKeys.publicKey}`);
  console.log('🔑 VAPID Private Key: đã tạo (không in ra log) — xem server/.env');

  try {
    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    let hasPublic = false;
    let hasPrivate = false;
    const newLines = lines.map((line) => {
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

    if (!hasPublic) newLines.push(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    if (!hasPrivate) newLines.push(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    console.log('✅ Đã tự động lưu VAPID keys vào file server/.env để tái sử dụng lâu dài!');
  } catch (err) {
    console.error('❌ Không thể tự động ghi VAPID keys vào .env:', err.message);
  }
}

export { vapidKeys };

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@hugostudio.vn';
webpush.setVapidDetails(vapidSubject, vapidKeys.publicKey, vapidKeys.privateKey);

/**
 * Lấy VAPID public key cho trình duyệt đăng ký Web Push
 */
export async function getVapidPublicKey(req, res) {
  return res.json({ publicKey: vapidKeys.publicKey });
}

/**
 * Đăng ký nhận thông báo Web Push
 */
export async function subscribeWebPush(req, res) {
  try {
    const { subscription, device = {} } = req.body;
    const email = req.memberEmail;

    if (!email || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Email và đối tượng Subscription đầy đủ là bắt buộc.' });
    }
    try {
      const endpointUrl = new URL(subscription.endpoint);
      if (endpointUrl.protocol !== 'https:') throw new Error('invalid protocol');
    } catch {
      return res.status(400).json({ error: 'Push endpoint không hợp lệ.' });
    }

    const updatedSub = await NotificationSubscription.findOneAndUpdate(
      { 'subscription.endpoint': subscription.endpoint },
      {
        $set: {
          email,
          subscription,
          device: {
            locale: String(device.locale || '').slice(0, 32),
            timezone: String(device.timezone || '').slice(0, 64),
            platform: String(device.platform || '').slice(0, 64),
            standalone: Boolean(device.standalone),
          },
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Đã lưu đăng ký thông báo đẩy thành công.', data: updatedSub });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Hủy đăng ký nhận thông báo Web Push của thiết bị
 */
export async function unsubscribeWebPush(req, res) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint là bắt buộc.' });
    await NotificationSubscription.deleteOne({
      email: req.memberEmail,
      'subscription.endpoint': endpoint,
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * [Admin] Gửi thông báo đẩy thử nghiệm
 */
export async function sendTestNotification(req, res) {
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
      url: url || '/member/utilities/psychology',
    });

    const sendPromises = subscriptions.map((sub) =>
      webpush.sendNotification(sub.subscription, payload).catch((err) => {
        console.error(`Gửi thông báo thất bại cho endpoint: ${sub.subscription.endpoint}`, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          return NotificationSubscription.deleteOne({ _id: sub._id });
        }
      })
    );

    await Promise.all(sendPromises);
    return res.json({ success: true, message: `Đã phát thông báo mẫu tới ${subscriptions.length} thiết bị.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * [Admin] Kích hoạt thủ công tiến trình AI Proactive Push
 */
export async function testProactivePush(req, res) {
  try {
    triggerProactivePushNow();
    return res.json({
      success: true,
      message: 'Đã kích hoạt trình kích hoạt AI Proactive Push thủ công thành công. Tiến trình sẽ chạy ngầm.',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * [Admin] Kích hoạt nhắc nhở thông minh Smart Push Nudge
 */
export async function triggerSmartPush(req, res) {
  try {
    const { contextHint = 'wellness_nudge' } = req.body;
    await triggerSmartPushNow(contextHint);
    return res.json({ success: true, message: `Đã gửi nudge "${contextHint}" thành công cho tất cả thành viên active.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * [Admin] Phát sóng thông báo cho toàn bộ hoặc một thành viên cụ thể
 */
export async function broadcastAllNotifications(req, res) {
  try {
    const { title, message, type = 'info', category = 'system', actionUrl = '', targetEmail = '' } = req.body;
    if (!title) return res.status(400).json({ error: 'Tiêu đề là bắt buộc.' });
    const normalizedTargetEmail = String(targetEmail || '').trim().toLowerCase();
    const isBroadcastAll = normalizedTargetEmail === '' || normalizedTargetEmail === 'all';

    const activeUsers = await Bio.find(
      isBroadcastAll ? { status: 'active' } : { status: 'active', email: normalizedTargetEmail },
      'email displayName'
    );
    if (!activeUsers || activeUsers.length === 0) {
      return res.status(404).json({
        error: isBroadcastAll ? 'Không tìm thấy người dùng hoạt động.' : 'Không tìm thấy thành viên active với email này.',
      });
    }

    const notifications = activeUsers.map((user) => {
      const userDisplayName = user.displayName || 'Thành viên';
      return {
        email: user.email,
        type,
        category,
        title: title.replace(/{{displayName}}/g, userDisplayName),
        message: message.replace(/{{displayName}}/g, userDisplayName),
        actionUrl,
      };
    });
    await InAppNotification.insertMany(notifications);
    Promise.all(activeUsers.map((u) => pruneNotifications(u.email))).catch((e) =>
      console.error('[broadcast prune]', e.message)
    );

    const subscriptions = await NotificationSubscription.find(
      isBroadcastAll ? { email: { $in: activeUsers.map((user) => user.email) } } : { email: normalizedTargetEmail }
    );

    let sentCount = 0;
    let failedCount = 0;

    if (subscriptions.length > 0) {
      const sendPromises = subscriptions.map((sub) => {
        const user = activeUsers.find((u) => u.email === sub.email);
        const userDisplayName = user ? user.displayName || 'Thành viên' : 'Thành viên';
        const userTitle = title.replace(/{{displayName}}/g, userDisplayName);
        const userBody = message.replace(/{{displayName}}/g, userDisplayName);

        const payload = JSON.stringify({
          title: userTitle,
          body: userBody,
          icon: '/image/avt7.png',
          url: actionUrl || '/',
        });

        return webpush
          .sendNotification(sub.subscription, payload)
          .then(() => sentCount++)
          .catch((err) => {
            failedCount++;
            console.error(`Broadcast: Gửi thông báo thất bại cho endpoint: ${sub.subscription.endpoint}`);
            if (err.statusCode === 410 || err.statusCode === 404) {
              return NotificationSubscription.deleteOne({ _id: sub._id });
            }
          });
      });

      await Promise.allSettled(sendPromises);
    }

    return res.json({
      success: true,
      message: isBroadcastAll
        ? `Đã gửi in-app cho ${activeUsers.length} người. Gửi Push thành công ${sentCount}, thất bại ${failedCount}.`
        : `Đã gửi thông báo cho ${normalizedTargetEmail}. Push thành công ${sentCount}, thất bại ${failedCount}.`,
      stats: { inAppSent: activeUsers.length, pushSent: sentCount, pushFailed: failedCount },
    });
  } catch (error) {
    console.error('Lỗi Broadcast Notification:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Đăng ký thiết bị Native (iOS APNs / Android FCM)
 */
export async function subscribeNativeDevice(req, res) {
  try {
    const { token, platform, appVersion = '', locale = '', timezone = '' } = req.body || {};
    const email = req.memberEmail;

    if (!token || typeof token !== 'string' || token.length > 512) {
      return res.status(400).json({ error: 'token là bắt buộc và phải là chuỗi hợp lệ.' });
    }
    if (platform !== 'ios' && platform !== 'android') {
      return res.status(400).json({ error: "platform phải là 'ios' hoặc 'android'." });
    }

    const device = await NativePushDevice.findOneAndUpdate(
      { token },
      {
        $set: {
          email,
          platform,
          appVersion: String(appVersion).slice(0, 32),
          locale: String(locale).slice(0, 32),
          timezone: String(timezone).slice(0, 64),
          lastSeenAt: new Date(),
        },
        $setOnInsert: { token, createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: { id: device._id, platform: device.platform } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Hủy đăng ký thiết bị Native khi đăng xuất hoặc tắt thông báo
 */
export async function unsubscribeNativeDevice(req, res) {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token là bắt buộc.' });
    const result = await NativePushDevice.deleteOne({ token, email: req.memberEmail });
    return res.json({ success: true, removed: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
