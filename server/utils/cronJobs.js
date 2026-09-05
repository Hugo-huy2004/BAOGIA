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

  // Nhắc ôn từ vựng — 08:00 & 20:00 giờ VN (01:00 & 13:00 UTC). CHỈ nhắc người
  // ĐANG học (có thẻ tới hạn), nên tập gửi luôn nhỏ và tự thu hẹp khi ai ngừng
  // học. Kèm một từ mẫu để vừa nhắc vừa "lâu lâu hiện một từ dễ nhớ".
  cron.schedule('0 1,13 * * *', async () => {
    try {
      const [{ default: VocabProgress }, { default: VocabCard }, { notifyMember }] = await Promise.all([
        import('../models/VocabProgress.js'),
        import('../models/VocabCard.js'),
        import('./notifyMember.js'),
      ]);
      // Nhóm số thẻ tới hạn theo người dùng (giới hạn để một lượt cron không kéo dài).
      const due = await VocabProgress.aggregate([
        { $match: { dueAt: { $lte: new Date() } } },
        { $group: { _id: '$email', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 500 },
      ]);
      // Người có thẻ tới hạn → nhắc ôn; kèm actionUrl mở thẳng app.
      for (const u of due) {
        await notifyMember({
          email: u._id, type: 'info', category: 'study',
          key: 'vocab.reminder', params: { count: String(u.count) },
          actionUrl: '/member/utilities/vocab', push: true,
        }).catch(() => {});
      }

      // "Lâu lâu hiện một từ dễ nhớ": buổi tối (13:00 UTC), gửi MỘT từ ngẫu nhiên
      // cho người đã ôn xong (không còn thẻ tới hạn) — giữ tương tác, thấy là
      // nhớ. Người đang có thẻ tới hạn đã nhận nhắc ôn ở trên rồi, không gửi kép.
      if (new Date().getUTCHours() === 13) {
        const sample = await VocabCard.aggregate([{ $match: { status: 'approved' } }, { $sample: { size: 1 } }]);
        const word = sample[0];
        if (word) {
          const dueSet = new Set(due.map((u) => u._id));
          const learners = await VocabProgress.distinct('email');
          const caughtUp = learners.filter((e) => !dueSet.has(e)).slice(0, 500);
          for (const email of caughtUp) {
            await notifyMember({
              email, type: 'info', category: 'study',
              key: 'vocab.word', params: { hanzi: word.hanzi, pinyin: word.pinyin, meaning: word.meaning },
              actionUrl: '/member/utilities/vocab', push: true,
            }).catch(() => {});
          }
          console.log(`[CRON] Từ trong ngày "${word.hanzi}" gửi ${caughtUp.length} người đã ôn xong.`);
        }
      }
      console.log(`[CRON] Nhắc ôn từ vựng: ${due.length} người.`);
    } catch (error) {
      console.error('[CRON] Nhắc ôn từ vựng:', error.message);
    }
  });

  // Bot tự gọi Boss khi có chuyện — 15 phút một lượt soát. Ngưỡng và lý do
  // chọn ngưỡng nằm trong services/anomalyWatch.js.
  cron.schedule('*/15 * * * *', async () => {
    try {
      const { runAnomalyWatch } = await import('../services/anomalyWatch.js');
      await runAnomalyWatch();
    } catch (error) {
      console.error('[CRON] Soát bất thường:', error.message);
    }
  });

  // 08:00 giờ Việt Nam (01:00 UTC — Render chạy giờ UTC): một tin tổng kết an
  // ninh mỗi sáng. Thay cho kiểu bắn từng tin theo từng request, vốn biến máy
  // quét dạo thành 10+ thông báo/ngày và khiến tin thật lẫn vào tin rác.
  cron.schedule('0 1 * * *', async () => {
    try {
      const [{ securityDigest }, { sendTelegramAlert }] = await Promise.all([
        import('../services/securityEnforcement.js'),
        import('../services/telegramService.js'),
      ]);
      await sendTelegramAlert(await securityDigest(24));
    } catch (error) {
      console.error('[CRON] Tổng kết an ninh 24h:', error.message);
    }
  });

  // Chạy mỗi đêm lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Dọn nhiễu JOY quá 90 ngày (giữ giao dịch tiền vĩnh viễn)...');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // 1. CHỈ xoá các bản ghi "nhiễu" (điểm trò chơi, điểm danh…) cũ hơn 90
      // ngày. Chuyển khoản, mua bán, nạp/rút, cổ phiếu — dòng tiền thật — GIỮ
      // MÃI như sao kê ngân hàng. Danh mục nhiễu ở utils/joySources.js.
      const { JOY_NOISE_SOURCES } = await import('./joySources.js');
      const ledgerResult = await JoyLedger.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
        source: { $in: [...JOY_NOISE_SOURCES] },
      });
      console.log(`[CRON] Đã dọn ${ledgerResult.deletedCount} bản ghi nhiễu; sao kê tiền được giữ nguyên.`);

      // 2. Dọn lịch sử hiển thị trong Bio.history cũ hơn 90 ngày (đây KHÔNG phải
      // sao kê tiền — sao kê nằm ở JoyLedger).
      const bioResult = await Bio.updateMany(
        {},
        { $pull: { history: { timestamp: { $lt: ninetyDaysAgo } } } }
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
