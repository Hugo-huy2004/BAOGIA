import cron from 'node-cron';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { FEATURE_PRICES } from './featureSubscriptionService.js';
import { computeRates } from './joyRateService.js';

export function initCronJobs() {
  // Nhắc "vượt mốc hoà vốn" của sàn ảo — giá bước 30s nhưng nhắc thì 5 phút là
  // đủ: đây là bài học chốt lời, không phải tín hiệu giao dịch tần suất cao.
  // Mỗi vị thế nhắc đúng MỘT lần mỗi phiên (notifiedSession), update có điều
  // kiện nên hai tiến trình chạy song song cũng không gửi trùng.
  cron.schedule('*/5 * * * *', async () => {
    try {
      const [{ default: StockPosition }, { default: StockCompany }, market, pricing, { notifyMember }] = await Promise.all([
        import('../models/StockPosition.js'),
        import('../models/StockCompany.js'),
        import('../services/stockMarket.js'),
        import('../../shared/stockPricing.js'),
        import('./notifyMember.js'),
      ]);
      await market.runSession();
      const session = market.sessionKey();
      const positions = await StockPosition.find({ quantity: { $gt: 0 }, avgCost: { $gt: 0 }, notifiedSession: { $ne: session } }).lean();
      if (!positions.length) return;

      const symbols = [...new Set(positions.map((p) => p.symbol))];
      const companies = await StockCompany.find({ symbol: { $in: symbols } }).lean();
      const priceOf = Object.fromEntries(companies.map((c) => [c.symbol, market.livePrice(c, { key: session })]));
      const threshold = 1 + pricing.breakEvenPct(false);

      for (const pos of positions) {
        const price = priceOf[pos.symbol];
        if (!price || price < pos.avgCost * threshold) continue;
        const claimed = await StockPosition.updateOne(
          { _id: pos._id, notifiedSession: { $ne: session } },
          { $set: { notifiedSession: session } },
        );
        if (!claimed.modifiedCount) continue;
        const pct = Math.round((price / pos.avgCost - 1) * 1000) / 10;
        await notifyMember({
          email: pos.email,
          key: 'event.stockBreakEven',
          params: { symbol: pos.symbol, pct: String(pct) },
          category: 'joy',
          actionUrl: '/member/utilities/invest',
          push: true,
        }).catch((err) => console.error('[CRON] Nhắc hoà vốn:', err.message));
      }
    } catch (error) {
      console.error('[CRON] Nhắc hoà vốn sàn ảo:', error.message);
    }
  });

  // Một điểm tỷ giá JOY mỗi giờ — đây là thứ vẽ nên đường trong màn Tỷ Giá.
  //
  // Job riêng vì nó gọi ra Internet (giá vàng): mạng treo cũng không được kéo
  // theo hai job dọn dẹp bên dưới. Bản thân `computeRates` đã tự chịu lỗi và
  // quay về hệ số nền, ở đây chỉ ghi lại cho người trực biết. Chỉ log mỗi 6 giờ
  // để log không thành 24 dòng giống nhau mỗi ngày.
  cron.schedule('2 * * * *', async () => {
    try {
      const rates = await computeRates({ force: true });
      if (new Date().getUTCHours() % 6 === 0) {
        // `gold` đã gỡ khỏi joyRateService — log theo tín hiệu nội bộ còn lại.
        console.log(`[CRON] Tỷ giá JOY ${rates.key}: thu nhập TB ${Math.round(rates.income?.overall || 0)} JOY/ngày, netFlow ${rates.flows?.netFlow ?? 0}`);
      }
    } catch (error) {
      console.error('[CRON] Không tính được tỷ giá JOY:', error.message);
    }
  });

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
