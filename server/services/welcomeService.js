import UserProfile from '../models/UserProfile.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import NativePushDevice from '../models/NativePushDevice.js';
import { sendWelcomeEmail } from './lifecycleEmailService.js';

/**
 * Thành viên bật thông báo ứng dụng lần đầu → một push chào mừng và một thư
 * chào mừng, một lần trong đời tài khoản. Thư chào mừng là thư TÀI KHOẢN (không
 * quảng cáo) nên không cần đã đồng ý nhận email ưu đãi.
 */
async function maybeWelcome(email) {
  const [webPush, nativePush] = await Promise.all([
    NotificationSubscription.exists({ email }),
    NativePushDevice.exists({ email }),
  ]);
  if (!webPush && !nativePush) return false;

  // Thành viên mới có thể chưa có UserProfile. Tạo trước, rồi mới giành quyền
  // gửi nguyên tử: hai request bật song song chỉ một bên lọt qua.
  await UserProfile.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  const claimed = await UserProfile.findOneAndUpdate({ email, welcomedAt: null }, { $set: { welcomedAt: new Date() } });
  if (!claimed) return false;

  // Nạp trễ: notifyMember → pushNotifier cần vapidKeys của notificationController,
  // mà controller lại nạp file này — import tĩnh sẽ thành vòng.
  const { notifyMember } = await import('../utils/notifyMember.js');
  await notifyMember({ email, key: 'event.welcome', type: 'success', category: 'system', actionUrl: '/member', push: true });
  await sendWelcomeEmail(email);
  return true;
}

/** Cho route gọi kiểu bắn-rồi-quên: lời chào lỗi không được làm hỏng việc bật kênh. */
export function welcomeInBackground(email) {
  maybeWelcome(email).catch((err) => console.error('[welcome]', err.message));
}
