import Bio from '../models/Bio.js';
import { sendPushNotification } from './pushNotifier.js';

export const parseBirthday = (birthdayStr) => {
  if (!birthdayStr) return null;
  const cleaned = birthdayStr.trim();
  
  // Format DD/MM/YYYY or DD-MM-YYYY
  let match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    return { day: parseInt(match[1]), month: parseInt(match[2]), year: parseInt(match[3]) };
  }
  
  // Format YYYY-MM-DD
  match = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return { day: parseInt(match[3]), month: parseInt(match[2]), year: parseInt(match[1]) };
  }
  
  // Format DD/MM or DD-MM
  match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return { day: parseInt(match[1]), month: parseInt(match[2]), year: null };
  }
  
  return null;
};

export const runBirthdayAutomation = async () => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentYear = now.getFullYear();

  try {
    const bios = await Bio.find({});
    console.log(`[Birthday Automation] Checking ${bios.length} user records...`);

    for (const bio of bios) {
      if (!bio.birthday) continue;
      const parsed = parseBirthday(bio.birthday);
      if (!parsed) continue;

      const { day, month } = parsed;

      // 1. Birthday greeting at 00:00
      if (day === currentDay && month === currentMonth) {
        const greetingSent = bio.history.some(
          h => h.type === 'birthday_wish' && new Date(h.timestamp).getFullYear() === currentYear
        );

        if (!greetingSent) {
          bio.history.push({
            type: 'birthday_wish',
            icon: 'cake',
            title: `Chúc mừng sinh nhật! 🎂`,
            detail: `Háp..pi..Bết...đê... Hugo Studio chúc mừng bạn ${bio.displayName} đã thêm một tuổi mới.\nHugo Studio xin chúc bạn có một sinh nhật thật vui tươi, thành công và chuẩn bị gặt hái nhiều ngôi sao may mắn trong hành trình thanh xuân mới.`,
            timestamp: new Date()
          });
          sendPushNotification(
            bio.email,
            'Chúc mừng sinh nhật! 🎂',
            `Hugo Studio chúc mừng sinh nhật bạn ${bio.displayName}!`,
            '/member/activity'
          ).catch(console.error);
          console.log(`[Birthday Automation] Birthday greeting queued for ${bio.displayName} (${bio.email})`);
        }
      }

      // Trước đây chỗ này tự phát mã BDAY-xx (thêm 14 ngày, phải tự đi đổi ở
      // trang Gói dịch vụ). Quà sinh nhật giờ nằm gọn trong lượt quay theo hạng
      // Star (xem POST /api/joy/birthday-spin): cộng ngày và voucher ngay khi
      // quay, không bắt người dùng nhớ mã. Phần đổi mã cũ trong packageRoutes
      // vẫn giữ để những mã đã phát trước đó không chết.

      await bio.save();
    }
  } catch (error) {
    console.error('[Birthday Automation] Error running task:', error);
  }
};

export const cleanupExpiredBirthdayNotifications = async (bio) => {
  if (!bio) return;
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentYear = now.getFullYear();

  let modified = false;

  if (bio.history && bio.history.length > 0) {
    const originalLength = bio.history.length;
    bio.history = bio.history.filter(h => {
      if (h.type === 'birthday_voucher') {
        const itemDate = new Date(h.timestamp);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();

        const isPast = (itemYear < currentYear) || (itemYear === currentYear && itemMonth !== currentMonth);
        if (isPast && !bio.birthdayVoucherClaimed) {
          // If past and not claimed, delete it
          return false;
        }
      }
      return true;
    });

    if (bio.history.length !== originalLength) {
      modified = true;
    }
  }

  if (modified) {
    await bio.save();
  }
};
