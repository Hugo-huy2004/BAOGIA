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
            '/member/portal?tab=history'
          ).catch(console.error);
          console.log(`[Birthday Automation] Birthday greeting queued for ${bio.displayName} (${bio.email})`);
        }
      }

      // 2. Automated birthday voucher
      if (month === currentMonth) {
        const voucherSent = bio.history.some(
          h => h.type === 'birthday_voucher' && 
               new Date(h.timestamp).getMonth() + 1 === currentMonth && 
               new Date(h.timestamp).getFullYear() === currentYear
        );

        if (!voucherSent) {
          let remainingDays = 0;
          if (bio.expiresAt) {
            const diffTime = new Date(bio.expiresAt).getTime() - now.getTime();
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          // Conditions: expiresAt not set or remaining days < 365
          if (!bio.expiresAt || remainingDays < 365) {
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const voucherCode = `BDAY-${month.toString().padStart(2, '0')}-${randomSuffix}`;

            bio.birthdayVoucherCode = voucherCode;
            bio.birthdayVoucherClaimed = false;
            bio.birthdayVoucherYear = currentYear;

            bio.history.push({
              type: 'birthday_voucher',
              icon: 'card_giftcard',
              title: `Quà tặng sinh nhật từ Hugo Studio! 🎁`,
              detail: `Hugo Studio gửi tặng bạn mã voucher sinh nhật: ${voucherCode} (thêm 14 ngày sử dụng và Card sinh nhật vào phần gói dịch vụ của bạn).\nHiệu lực mã: Từ 01/${month.toString().padStart(2, '0')}/${currentYear} đến ngày cuối của tháng.`,
              timestamp: new Date()
            });
            sendPushNotification(
              bio.email,
              'Quà tặng sinh nhật từ Hugo Studio! 🎁',
              `Bạn vừa nhận được mã quà tặng sinh nhật mới. Kích hoạt ngay nhé!`,
              '/member/portal?tab=history'
            ).catch(console.error);
            console.log(`[Birthday Automation] Birthday voucher code generated: ${voucherCode} for ${bio.displayName} (${bio.email})`);
          }
        }
      }

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
