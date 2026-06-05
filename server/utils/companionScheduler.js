import CompanionHistory from '../models/CompanionHistory.js';
import { sendPushNotification } from './pushNotifier.js';

/**
 * Lấy thời gian hiện tại ở múi giờ Việt Nam (UTC+7)
 */
function getVietnamTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

/**
 * Lấy chuỗi định dạng ngày YYYY-MM-DD theo múi giờ Việt Nam
 */
function getVietnamDateStr(dateInput) {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(date);
  const partMap = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });
  const year = partMap.year;
  const month = String(partMap.month).padStart(2, '0');
  const day = String(partMap.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chạy kiểm tra và gửi thông báo nhắc nhở
 */
export async function runCompanionReminders(timeStr) {
  try {
    console.log(`[Companion Scheduler] Bắt đầu quét người dùng cần nhắc nhở lúc ${timeStr}...`);
    
    // 1. Tìm tất cả hồ sơ đang kích hoạt chế độ đồng hành
    const activeCompanions = await CompanionHistory.find({ healingActive: true });
    console.log(`[Companion Scheduler] Phát hiện ${activeCompanions.length} người dùng đang tham gia lộ trình đồng hành.`);

    if (activeCompanions.length === 0) return;

    const todayVnStr = getVietnamDateStr(new Date());
    
    // Chuẩn bị nội dung thông báo theo từng mốc thời gian
    let title = 'Bạn Học Đường 🧡';
    let body = 'Hãy dành ít phút thực hiện bài tập trị liệu hoặc bài test hôm nay cùng mình nhé!';
    
    if (timeStr === '07:30') {
      title = 'Chào buổi sáng, người bạn của tôi ☀️';
      body = 'Hãy dành ít phút đầu ngày để thực hiện bài tập trị liệu hoặc chia sẻ với mình nhé. Chúc bạn một ngày bình yên!';
    } else if (timeStr === '15:00') {
      title = 'Một chút bình yên chiều nay 🍃';
      body = 'Cậu đã hoàn thành bài tập trị liệu hay làm bài test hôm nay chưa? Hãy nghỉ ngơi một chút và thực hiện cùng tớ nhé!';
    } else if (timeStr === '20:30') {
      title = 'Thời gian dành cho bản thân 🌙';
      body = 'Trước khi khép lại ngày hôm nay, hãy cùng tớ thực hiện hoạt động trị liệu để vỗ về tâm hồn nhé!';
    }

    let sentCount = 0;

    for (const companion of activeCompanions) {
      const { email, historyLogs } = companion;

      // 1. Calculate clinical test cycle & check if overdue
      const allTests = historyLogs.filter(l => l.test);
      let isTestOverdue = false;
      let nextCycleDays = 14;
      let overdueTestId = 'dass42';

      if (allTests.length > 0) {
        // Get the latest completed test
        const latestTest = [...allTests].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        overdueTestId = latestTest.test;

        let isSevere = false;
        let isModerate = false;

        const testId = latestTest.test;
        if (testId === 'dass42' && latestTest.severities) {
          const checkSevere = (sev) => {
            if (!sev) return false;
            const s = sev.toLowerCase();
            return s.includes('nặng') || s.includes('rất nặng') || s.includes('extremely');
          };
          const checkMod = (sev) => {
            if (!sev) return false;
            const s = sev.toLowerCase();
            return s.includes('vừa') || s.includes('trung bình') || s.includes('moderate');
          };
          if (checkSevere(latestTest.severities.D) || checkSevere(latestTest.severities.A) || checkSevere(latestTest.severities.S)) {
            isSevere = true;
          } else if (checkMod(latestTest.severities.D) || checkMod(latestTest.severities.A) || checkMod(latestTest.severities.S)) {
            isModerate = true;
          }
        } else if (testId === 'mmpi30') {
          const elev = latestTest.clinical ? latestTest.clinical.filter(c => c.score >= 70).length : 0;
          if (elev >= 3) isSevere = true;
          else if (elev >= 1) isModerate = true;
        } else if (testId === 'phq9') {
          if (latestTest.score >= 15) isSevere = true;
          else if (latestTest.score >= 10) isModerate = true;
        } else if (testId === 'gad7') {
          if (latestTest.score >= 15) isSevere = true;
          else if (latestTest.score >= 10) isModerate = true;
        } else if (testId === 'who5') {
          const percent = latestTest.score * 4;
          if (percent <= 28) isSevere = true;
          else if (percent <= 50) isModerate = true;
        }

        nextCycleDays = isSevere ? 3 : (isModerate ? 7 : 14);
        const lastTestDateObj = new Date(latestTest.date);
        const nextDueDateObj = new Date(lastTestDateObj.getTime() + nextCycleDays * 24 * 60 * 60 * 1000);
        isTestOverdue = new Date().getTime() >= nextDueDateObj.getTime();
      }

      // Check if user completed therapy or test today
      const hasCompletedToday = historyLogs.some(log => {
        if (!log.date) return false;
        const logDateStr = getVietnamDateStr(log.date);
        return logDateStr === todayVnStr && (log.type === 'therapy_activity' || log.type === 'clinical_test');
      });

      if (isTestOverdue) {
        // Send a specific overdue test reminder push notification!
        const alertTitle = 'Yêu cầu kiểm tra lại định kỳ 🧡';
        const alertBody = `Đã đến chu kỳ kiểm tra định kỳ (${nextCycleDays} ngày/lần) của lộ trình của cậu. Hãy click vào làm bài test ngay nhé!`;
        await sendPushNotification(email, alertTitle, alertBody, `/member/portal?tab=utilities&subtab=chat&preset=${overdueTestId}`);
        sentCount++;
      } else if (!hasCompletedToday) {
        // Send normal daily activity reminder
        await sendPushNotification(email, title, body, '/member/portal?tab=utilities');
        sentCount++;
      }
    }

    console.log(`[Companion Scheduler] Hoàn thành gửi nhắc nhở cho ${sentCount} người dùng.`);
  } catch (error) {
    console.error('[Companion Scheduler] Lỗi nghiêm trọng trong quá trình quét nhắc nhở:', error);
  }
}

/**
 * Khởi tạo Scheduler quét định kỳ
 */
export function initCompanionScheduler() {
  console.log('⏰ [Companion Scheduler] Đã khởi tạo bộ lập lịch nhắc nhở tự động (07:30, 15:00, 20:30)');
  
  let lastRunTime = '';
  
  // Kiểm tra mỗi 30 giây để đảm bảo không bỏ lỡ phút vàng và không chạy trùng lặp
  setInterval(async () => {
    try {
      const vnTime = getVietnamTime();
      const hour = vnTime.getHours();
      const minute = vnTime.getMinutes();
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      if (['07:30', '15:00', '20:30'].includes(timeStr)) {
        if (lastRunTime !== timeStr) {
          lastRunTime = timeStr;
          await runCompanionReminders(timeStr);
        }
      } else {
        // Reset lastRunTime nếu qua phút được cài đặt
        if (lastRunTime !== '') {
          lastRunTime = '';
        }
      }
    } catch (err) {
      console.error('[Companion Scheduler] Lỗi trong interval kiểm tra thời gian:', err);
    }
  }, 30000);
}
