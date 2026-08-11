import { bioAge, ADULT_AGE, MEMBER_MIN_AGE } from './memberAge.js';

/**
 * Hạng thành viên KHÔNG lưu trong database (trừ cờ danh dự `starVip`) mà suy ra
 * từ ngày sinh mỗi lần đọc. Nhờ vậy Star-14 tự lên Star-18 đúng ngày sinh nhật
 * thứ 18 — không cần cron quét, không có cảnh tag cũ đọng lại vì job chạy lỗi.
 */
export const STAR_14 = 'star14';
export const STAR_18 = 'star18';
export const STAR_VIP = 'starVip';

export const TIER_LABELS = {
  [STAR_14]: 'Star-14',
  [STAR_18]: 'Star-18',
  [STAR_VIP]: 'Star-VIP',
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
};

export const VOUCHER_VALID_DAYS = 30;

/** null = chưa khai ngày sinh, hoặc chưa đủ tuổi thành viên. */
export function memberTier(bio) {
  if (bio?.starVip) return STAR_VIP;
  const age = bioAge(bio);
  if (age === null) return null;
  if (age >= ADULT_AGE) return STAR_18;
  if (age >= MEMBER_MIN_AGE) return STAR_14;
  return null;
}

export const tierGifts = (tier) => TIER_BIRTHDAY_GIFTS[tier] || null;

/** Mã voucher đủ ngắn để đọc qua điện thoại, đủ dài để không đoán được. */
export const voucherCode = (percent, randomPart) => `HUGO${percent}-${randomPart}`;
