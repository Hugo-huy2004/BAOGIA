import { bioAge, ADULT_AGE, MEMBER_MIN_AGE } from './memberAge.js';

/**
 * Hạng thành viên KHÔNG lưu trong database (trừ cờ danh dự `starVip`) mà suy ra
 * từ ngày sinh mỗi lần đọc. Nhờ vậy Star-14 tự lên Star-18 đúng ngày sinh nhật
 * thứ 18 — không cần cron quét, không có cảnh tag cũ đọng lại vì job chạy lỗi.
 */
export const STAR_14 = 'star14';
export const STAR_18 = 'star18';
export const STAR_VIP = 'starVip';
export const ECO = 'eco';

export const STAR_MAX_AGE = 23; // Thành viên Star-18 đến hết tháng sinh nhật 23 tuổi

export const TIER_LABELS = {
  [STAR_14]: 'Star-14',
  [STAR_18]: 'Star-18',
  [STAR_VIP]: 'Star-VIP',
  [ECO]: 'Eco',
};

/** Quà sinh nhật theo hạng. days = số ngày cộng thêm hạn dùng tài khoản. */
export const TIER_BIRTHDAY_GIFTS = {
  [STAR_14]: {
    days: 15,
    vouchers: [],
  },
  [STAR_18]: {
    days: 30,
    vouchers: [
      { percent: 15, scope: 'web_static', label: 'Giảm 15% One-page landing page và Website nhiều trang' },
    ],
  },
  [STAR_VIP]: {
    days: 90,
    vouchers: [
      { percent: 15, scope: 'web_static', label: 'Giảm 15% One-page landing page và Website nhiều trang' },
      { percent: 10, scope: 'web_dynamic', label: 'Giảm 10% Dynamic web app' },
    ],
  },
  [ECO]: {
    days: 15,
    vouchers: [],
  },
};

export const VOUCHER_VALID_DAYS = 30;

/**
 * Kiểm tra xem đã qua hết tháng sinh nhật năm 23 tuổi chưa.
 * Thành viên Star-18 kết thúc vào cuối tháng sinh nhật tuổi 23.
 */
export function isPastStar18(birthYear, birthMonth) {
  const year = Number(birthYear);
  if (!Number.isInteger(year) || year < 1900) return true;
  const monthRaw = Number(birthMonth);
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : 12;
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const expYear = year + 23;
  if (curYear > expYear) return true;
  if (curYear === expYear && curMonth > month) return true;
  return false;
}

/** null = chưa khai ngày sinh hoặc người dùng thử nghiệm -> Eco. */
export function memberTier(bio) {
  if (bio?.starVip) return STAR_VIP;
  const age = bioAge(bio);
  if (age === null) return ECO;
  // Thành viên Star-18 chỉ từ 18 đến hết tháng sinh nhật 23 tuổi.
  // Qua tháng sinh nhật 23 tuổi (trên 23 tuổi) là hạng Eco.
  if (isPastStar18(bio?.birthYear, bio?.birthMonth)) return ECO;
  if (age >= ADULT_AGE) return STAR_18; // 18 đến hết tháng sinh nhật 23 tuổi
  if (age >= MEMBER_MIN_AGE) return STAR_14; // 14 đến dưới 18 tuổi
  return ECO;
}

export const tierGifts = (tier) => TIER_BIRTHDAY_GIFTS[tier] || null;

/** Mã voucher đủ ngắn để đọc qua điện thoại, đủ dài để không đoán được. */
export const voucherCode = (percent, randomPart) => `HUGO${percent}-${randomPart}`;
