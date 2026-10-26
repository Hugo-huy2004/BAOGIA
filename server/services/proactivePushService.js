import cron from 'node-cron';
import NotificationSubscription from '../models/NotificationSubscription.js';
import CompanionHistory from '../models/CompanionHistory.js';
import Bio from '../models/Bio.js';
import { sendPushToUser, askPushAI } from './pushGuard.js';
import { notificationLanguage, renderNotification } from '../../shared/notificationText.js';

async function pMap(items, limit, fn) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function runProactivePushJob() {
  console.log('Bắt đầu chạy cron job: AI Proactive Push Notifications...');

  try {
    // 1. Lấy tất cả user có đăng ký nhận thông báo (dùng lean)
    const subscriptions = await NotificationSubscription.find({}).lean();
    if (!subscriptions || subscriptions.length === 0) {
      console.log('Không có thiết bị nào đăng ký nhận thông báo.');
      return;
    }

    // Gộp theo email (mỗi người dùng có thể có nhiều thiết bị)
    const emailMap = new Map();
    for (const sub of subscriptions) {
      if (!emailMap.has(sub.email)) {
        emailMap.set(sub.email, []);
      }
      emailMap.get(sub.email).push(sub);
    }

    const entries = Array.from(emailMap.entries());

    // 2. Xử lý song song với pool tối đa 5 request cùng lúc
    await pMap(entries, 5, async ([email, subs]) => {
      try {
        // Tìm lịch sử và bio (dùng lean để tăng tốc đọc DB)
        const [history, bio] = await Promise.all([
          CompanionHistory.findOne({ email }).lean(),
          Bio.findOne({ email }).lean(),
        ]);

        // Chưa có lịch sử thì AI không có gì để đọc — vẫn gửi lời mời trò
        // chuyện soạn sẵn, vì đây chính là người cần được mời nhất.
        const recentLogs = (history?.historyLogs || []).slice(-15).reverse();
        const ai = recentLogs.length
          ? await askPushAI('/api/ai/proactive-push', { logs: recentLogs, bio: bio || {} })
          : null;

        // Cấu trúc dự kiến: { should_send, title, body, reason }. AI viết được
        // thì dùng chữ của AI; không thì câu soạn sẵn theo ngôn ngữ thiết bị.
        const aiResult = ai?.should_send && ai.title ? ai : {};
        const fallback = renderNotification('push.checkin', {}, notificationLanguage(subs[0]?.device?.locale));
        await sendPushToUser(email, subs, {
          title: aiResult.title || fallback.title,
          body: aiResult.body || fallback.message,
          icon: '/image/avt7.png',
          url: '/member/utilities/psychology',
          tag: 'checkin',
        });

      } catch (err) {
        console.error(`Lỗi khi xử lý proactive push cho ${email}:`, err);
      }
    });

    console.log('Hoàn tất chạy cron job proactive push.');
  } catch (error) {
    console.error('Lỗi nghiêm trọng trong cron job:', error);
  }
}

export function initProactivePushService() {
  // 15:30 — giờ uể oải giữa chiều, khung giờ vàng duy nhất còn trống (21:00 đã
  // là của nhắc ngủ; trước đây hai job cùng 21:00 nên một cái luôn bị nuốt).
  cron.schedule('30 15 * * *', () => {
    runProactivePushJob();
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
  console.log('Đã thiết lập Cron Job: AI Proactive Push (15:30 hàng ngày)');
}

// Hàm này có thể được gọi thông qua 1 API ẩn để test ngay lập tức
export async function triggerProactivePushNow() {
  await runProactivePushJob();
}
