import cron from 'node-cron';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { FEATURE_PRICES } from './featureSubscriptionService.js';

export function initCronJobs() {
  // Chạy mỗi đêm lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Đang bắt đầu dọn dẹp lịch sử JOY quá 14 ngày...');
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      // 1. Xoá JoyLedger cũ hơn 14 ngày
      const ledgerResult = await JoyLedger.deleteMany({ createdAt: { $lt: fourteenDaysAgo } });
      console.log(`[CRON] Đã xoá ${ledgerResult.deletedCount} giao dịch từ JoyLedger.`);

      // 2. Xoá các lịch sử cũ trong mảng Bio.history
      const bioResult = await Bio.updateMany(
        {},
        { $pull: { history: { timestamp: { $lt: fourteenDaysAgo } } } }
      );
      console.log(`[CRON] Đã làm sạch Bio.history cho các tài khoản.`);

      console.log('[CRON] Dọn dẹp hoàn tất.');
    } catch (error) {
      console.error('[CRON] Lỗi khi dọn dẹp lịch sử:', error);
    }
  });

  // Quét hết hạn các gói trao đổi JOY (HugoCoder/Aura/Radio/Arcade) và giao
  // diện Bio thuê theo tháng (Brutalism/Flat). Đăng ký riêng job thứ hai (cùng
  // giờ 00:00) để lỗi ở job này không ảnh hưởng job dọn dẹp lịch sử bên trên.
  // `active` chỉ là cache hiển thị — việc khóa tính năng thực tế luôn dựa vào
  // so sánh `expiresAt` trực tiếp (xem featureSubscriptionService.isFeatureActive),
  // nên job này không phải là điểm chặn bảo mật duy nhất.
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Đang quét hết hạn các gói trao đổi JOY...');
      const now = new Date();

      for (const featureKey of Object.keys(FEATURE_PRICES)) {
        const result = await Bio.updateMany(
          { [`featureSubscriptions.${featureKey}.expiresAt`]: { $lt: now }, [`featureSubscriptions.${featureKey}.active`]: true },
          { $set: { [`featureSubscriptions.${featureKey}.active`]: false } }
        );
        if (result.modifiedCount > 0) {
          console.log(`[CRON] ${featureKey}: đã khóa lại ${result.modifiedCount} tài khoản hết hạn.`);
        }
      }

      // Giao diện Bio thuê (Brutalism/Flat) hết hạn -> trả về Classic, kể cả
      // với chủ tài khoản không đăng nhập lại, vì người khác vẫn xem được bio công khai.
      const expiredThemes = await Bio.updateMany(
        { 'bioThemeRental.expiresAt': { $lt: now }, 'theme.template': { $ne: 'default' } },
        { $set: { 'theme.template': 'default', 'bioThemeRental.template': 'default', 'bioThemeRental.expiresAt': null } }
      );
      if (expiredThemes.modifiedCount > 0) {
        console.log(`[CRON] Đã hoàn trả ${expiredThemes.modifiedCount} bio về giao diện Classic.`);
      }

      console.log('[CRON] Quét hết hạn hoàn tất.');
    } catch (error) {
      console.error('[CRON] Lỗi khi quét hết hạn:', error);
    }
  });
}
