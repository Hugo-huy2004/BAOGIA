import cron from 'node-cron';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { FEATURE_PRICES } from './featureSubscriptionService.js';

export function initCronJobs() {
  // Báo cáo bình ổn JOY — 09:00 thứ Hai giờ VN (02:00 UTC).
  //
  // Gửi vào đầu tuần và báo về TUẦN TRƯỚC (tuần đã khép), không phải tuần đang
  // chạy: số liệu nửa tuần thì tỷ lệ thu/phát còn nhảy loạn, quyết định dựa trên
  // đó là quyết định theo nhiễu.
  //
  // Bản thân hàm đã tự chống gửi trùng bằng khoá tuần, nên nhiều process cùng
  // chạy cron cũng chỉ ra một báo cáo.
  cron.schedule('0 2 * * 1', async () => {
    try {
      const { sendWeeklyReport } = await import('../services/joyStabilityService.js');
      const result = await sendWeeklyReport();
      if (result.sent) {
        console.log(`[CRON] Báo cáo bình ổn JOY ${result.weekKey} — đề xuất: ${result.suggested}`);
      }
    } catch (error) {
      console.error('[CRON] Báo cáo bình ổn JOY:', error.message);
    }
  });

  // Cộng lãi JOYlater — 00:30 giờ VN (17:30 UTC hôm trước), mỗi ngày.
  //
  // Chạy TRƯỚC bộ chế tài vài giờ là cố ý: chế tài đọc số ngày quá hạn và dư
  // nợ, nên lãi của ngày hôm qua phải được ghi xong trước khi có ai bị leo bậc
  // vì con số đó.
  cron.schedule('30 17 * * *', async () => {
    try {
      const { accrueAll } = await import('../services/joyLaterAccrual.js');
      const result = await accrueAll();
      if (result.charged.length) {
        console.log(`[CRON] Lãi JOYlater: ${result.charged.length}/${result.scanned} khoản, cộng ${result.total} JOY`);
      }
    } catch (error) {
      console.error('[CRON] Lãi JOYlater:', error.message);
    }
  });

  // Xét lại hạn mức tín dụng — 17:00 thứ Bảy giờ VN (10:00 UTC thứ Bảy).
  //
  // Cuối tuần để một tuần tròn đã khép lại mới đem ra chấm. Hàm tự chống chạy
  // trùng bằng khoá tuần, nên nhiều process cùng chạy cron cũng chỉ xét một lần.
  cron.schedule('0 10 * * 6', async () => {
    try {
      const { evaluateAll } = await import('../services/joyCreditService.js');
      const result = await evaluateAll();
      console.log(`[CRON] Hạn mức JOYlater: xét ${result.scanned} hồ sơ, ${result.changed.length} hồ sơ đổi hạn mức`);
    } catch (error) {
      console.error('[CRON] Hạn mức JOYlater:', error.message);
    }
  });

  // Chế tài nợ JOYlater — 10:00 giờ VN (03:00 UTC), mỗi ngày một lần.
  //
  // MỖI NGÀY MỘT LẦN là cố ý. Bậc thang tính theo NGÀY quá hạn, nên quét dày
  // hơn cũng không đổi kết quả mà chỉ làm người dùng có thể nhận hai thông báo
  // cùng bậc. Giờ 10:00 để hồ sơ chờ duyệt rơi vào giờ hành chính, chứ không
  // nằm chờ suốt đêm.
  cron.schedule('0 3 * * *', async () => {
    try {
      const { enforceAll } = await import('../services/joyLaterEnforcement.js');
      const result = await enforceAll();
      if (result.changed.length) {
        console.log(`[CRON] JOYlater: quét ${result.scanned} khoản, ${result.changed.length} khoản leo bậc`);
      }
    } catch (error) {
      console.error('[CRON] Chế tài JOYlater:', error.message);
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
      // Nhóm số thẻ tới hạn theo người dùng + LẤY 3 THẺ ĐẾN HẠN SỚM NHẤT để kèm
      // vào nội dung nhắc ("hôm nay ôn: 学、书、我"). Giới hạn để cron không kéo dài.
      const due = await VocabProgress.aggregate([
        { $match: { dueAt: { $lte: new Date() } } },
        { $sort: { dueAt: 1 } },
        { $group: { _id: '$email', count: { $sum: 1 }, cards: { $firstN: { input: '$cardId', n: 3 } } } },
        { $sort: { count: -1 } },
        { $limit: 500 },
      ]);
      // Nạp chữ Hán cho toàn bộ cardId (một truy vấn) rồi map theo người.
      const wantIds = [...new Set(due.flatMap((u) => u.cards || []))];
      const wordCards = wantIds.length ? await VocabCard.find({ _id: { $in: wantIds } }, 'hanzi').lean() : [];
      const hanziById = Object.fromEntries(wordCards.map((c) => [String(c._id), c.hanzi]));
      // Bỏ ai đã TẮT push trong cài đặt app từ vựng.
      const VP = (await import('../models/VocabProfile.js')).default;
      const off = new Set(await VP.find({ pushEnabled: false }, 'email').distinct('email'));
      // Người có thẻ tới hạn → nhắc ôn; kèm actionUrl mở thẳng app.
      for (const u of due) {
        if (off.has(u._id)) continue;
        const words = (u.cards || []).map((id) => hanziById[String(id)]).filter(Boolean).join('、');
        await notifyMember({
          email: u._id, type: 'info', category: 'study',
          key: 'vocab.reminder', params: { count: String(u.count), words },
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

  // Bot tự gọi Boss khi có chuyện — MỖI GIỜ (anomalyWatch tự throttle 1h/lần nên
  // chạy dày hơn chỉ tốn DB vô ích; free tier cần nhẹ tải).
  cron.schedule('0 * * * *', async () => {
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

      // Toàn bộ 6 giao diện Bio (Classic, Frost, Graphite, Aurora, Brutalism, Flat)
      // hiện đã mở khóa miễn phí vĩnh viễn cho tất cả thành viên. Không cần quét thu hồi.

      console.log('[CRON] Quét hết hạn hoàn tất.');
    } catch (error) {
      console.error('[CRON] Lỗi khi quét hết hạn:', error);
    }
  });

  // Pre-warming định kỳ mỗi 10 phút cho bản tin Today:
  // Tải trước và giữ ấm cache cho 3 ấn bản chính (vi, en, zh) trên Node.js.
  // Người dùng mở tab Today sẽ luôn nhận dữ liệu tức thì (< 5ms) mà không phải đợi RSS fan-out.
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { studentNewsService } = await import('../services/studentNewsService.js');
      const coreEditions = ['vi', 'en', 'zh'];
      for (const lang of coreEditions) {
        await studentNewsService.getFeed({ language: lang, category: 'all', limit: 30 })
          .catch((err) => console.warn(`[CRON Today Prewarm Warning] ${lang}:`, err.message));
      }
    } catch (err) {
      console.warn('[CRON Today Prewarm Error]:', err.message);
    }
  });
}
