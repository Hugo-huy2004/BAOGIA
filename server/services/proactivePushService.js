import cron from 'node-cron';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import CompanionHistory from '../models/CompanionHistory.js';
import Bio from '../models/Bio.js';

// The URL of the Python AI Server
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

async function runProactivePushJob() {
  console.log('Bắt đầu chạy cron job: AI Proactive Push Notifications...');

  try {
    // 1. Lấy tất cả user có đăng ký nhận thông báo
    const subscriptions = await NotificationSubscription.find({});
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

    // 2. Loop qua từng email để xử lý
    for (const [email, subs] of emailMap.entries()) {
      try {
        // Tìm lịch sử và bio
        const history = await CompanionHistory.findOne({ email });
        const bio = await Bio.findOne({ email });

        if (!history || !history.historyLogs || history.historyLogs.length === 0) {
          continue; // Chưa có hoạt động gì
        }

        // Lấy tối đa 15 log gần nhất
        const recentLogs = [...history.historyLogs].reverse().slice(0, 15);
        
        // Gọi sang Python AI Server
        const response = await fetch(`${PYTHON_AI_URL}/api/ai/proactive-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: recentLogs,
            bio: bio || {}
          })
        });

        if (!response.ok) {
          console.error(`AI Server lỗi khi xử lý cho email ${email}`);
          continue;
        }

        const aiResult = await response.json();
        
        // Cấu trúc dự kiến: { should_send: true/false, title: "...", body: "...", reason: "..." }
        if (aiResult && aiResult.should_send) {
          console.log(`🤖 AI quyết định gửi thông báo cho ${email}. Lý do: ${aiResult.reason}`);
          
          const payload = JSON.stringify({
            title: aiResult.title || 'Bạn Học Đường',
            body: aiResult.body || 'Cậu ơi, vào tâm sự với tớ một lát nhé!',
            icon: '/image/avt7.png',
            url: '/member/portal?tab=banhocduong'
          });

          // Gửi tới tất cả thiết bị của user này
          for (const sub of subs) {
            try {
              await webpush.sendNotification(sub.subscription, payload);
            } catch (err) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Xóa subscription lỗi/hết hạn
                await NotificationSubscription.deleteOne({ _id: sub._id });
              }
            }
          }
        }

      } catch (err) {
        console.error(`Lỗi khi xử lý proactive push cho ${email}:`, err);
      }
    }
    
    console.log('Hoàn tất chạy cron job proactive push.');
  } catch (error) {
    console.error('Lỗi nghiêm trọng trong cron job:', error);
  }
}

export function initProactivePushService() {
  // Chạy lúc 21:00 mỗi ngày
  cron.schedule('0 21 * * *', () => {
    runProactivePushJob();
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
  console.log('Đã thiết lập Cron Job: AI Proactive Push (21:00 hàng ngày)');
}

// Hàm này có thể được gọi thông qua 1 API ẩn để test ngay lập tức
export async function triggerProactivePushNow() {
  await runProactivePushJob();
}
