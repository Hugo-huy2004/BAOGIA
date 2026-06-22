import cron from 'node-cron';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';

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
}
