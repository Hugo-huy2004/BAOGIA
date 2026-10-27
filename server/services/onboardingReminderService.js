import cron from 'node-cron';
import Bio from '../models/Bio.js';
import notifyMember from '../utils/notifyMember.js';
import { missingProfileFields } from '../utils/profileRequirements.js';

/**
 * Nhắc hoàn tất hồ sơ — mỗi ngày một lần, bằng PUSH (kèm thông báo trong app).
 *
 * "Đến khi nào đủ thì thôi": job chỉ chọn tài khoản CÒN THIẾU thông tin bắt
 * buộc (tính bằng missingProfileFields — luật nằm một chỗ, không chép điều kiện
 * xuống query). Khai đủ là tự rớt khỏi danh sách, không cần cờ riêng.
 *
 * Email nhắc để pha sau; push là bước đầu theo yêu cầu.
 */
async function runOnboardingReminderJob() {
  try {
    // Lọc thô ở DB (chỉ tài khoản đang hoạt động), tính chính xác ở ứng dụng.
    const bios = await Bio.find({ status: 'active' })
      .select('email language birthYear birthMonth birthDay guardianConsentAt phone countryCode adminArea locality exactAddress')
      .lean();

    let reminded = 0;
    for (const bio of bios) {
      if (!missingProfileFields(bio).length) continue;
      // notifyMember tự dựng push theo ngôn ngữ từng thiết bị và lưu bản in-app.
      await notifyMember({
        email: bio.email,
        key: 'event.profileIncomplete',
        type: 'warning',
        category: 'system',
        actionUrl: '/member',
        push: true,
      }).catch((err) => console.error(`Nhắc hồ sơ cho ${bio.email} lỗi:`, err.message));
      reminded += 1;
    }
    console.log(`Nhắc hoàn tất hồ sơ: đã gửi ${reminded} lời nhắc.`);
  } catch (error) {
    console.error('Lỗi cron nhắc hồ sơ:', error);
  }
}

export function initOnboardingReminderService() {
  // 10:00 — khung sáng còn trống, tránh đè các job chiều/tối đã có.
  cron.schedule('0 10 * * *', () => { runOnboardingReminderJob(); }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });
  console.log('Đã thiết lập Cron Job: Nhắc hoàn tất hồ sơ (10:00 hàng ngày)');
}

