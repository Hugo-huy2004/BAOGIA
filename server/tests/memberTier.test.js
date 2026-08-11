import { describe, it, expect, afterEach, vi } from 'vitest';
import { memberTier, tierGifts, STAR_14, STAR_18, STAR_VIP } from '../utils/memberTier.js';

// Hạng quyết định quà sinh nhật (ngày duy trì + voucher giảm giá thật), nên
// mốc lên hạng và bảng quà đều phải khoá bằng test.

const freeze = (year, month, day) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month - 1, day, 12));
};

afterEach(() => vi.useRealTimers());

const born = (year, month, day, extra = {}) => ({ birthYear: year, birthMonth: month, birthDay: day, ...extra });

describe('memberTier', () => {
  it('tự lên Star-18 đúng ngày sinh nhật thứ 18, không cần cron', () => {
    freeze(2026, 8, 19);
    expect(memberTier(born(2008, 8, 20))).toBe(STAR_14);
    freeze(2026, 8, 20);
    expect(memberTier(born(2008, 8, 20))).toBe(STAR_18);
  });

  it('Star-14 cho 14 đến dưới 18, chưa đủ 14 thì không có hạng', () => {
    freeze(2026, 8, 11);
    expect(memberTier(born(2012, 8, 11))).toBe(STAR_14); // vừa tròn 14
    expect(memberTier(born(2012, 8, 12))).toBeNull();    // còn thiếu một ngày
    expect(memberTier(born(2015, 1, 1))).toBeNull();
  });

  it('Star-VIP đè lên mọi hạng theo tuổi, kể cả thành viên 14 tuổi', () => {
    freeze(2026, 8, 11);
    expect(memberTier(born(2010, 1, 1, { starVip: true }))).toBe(STAR_VIP);
    expect(memberTier(born(1990, 1, 1, { starVip: true }))).toBe(STAR_VIP);
  });

  it('chưa khai ngày sinh thì chưa có hạng — không mặc định thành Star-18', () => {
    freeze(2026, 8, 11);
    expect(memberTier({})).toBeNull();
    expect(memberTier(null)).toBeNull();
    expect(memberTier({ birthMonth: 8, birthDay: 11 })).toBeNull();
  });
});

describe('tierGifts', () => {
  it('đúng bảng quà đã chốt', () => {
    expect(tierGifts(STAR_14)).toMatchObject({ days: 15, vouchers: [] });

    const star18 = tierGifts(STAR_18);
    expect(star18.days).toBe(30);
    expect(star18.vouchers.map((v) => v.percent)).toEqual([15]);

    const vip = tierGifts(STAR_VIP);
    expect(vip.days).toBe(90);
    expect(vip.vouchers.map((v) => v.percent)).toEqual([15, 10]);
    expect(vip.vouchers.map((v) => v.scope)).toEqual(['web_static', 'web_dynamic']);
  });

  it('không có hạng thì không có quà', () => {
    expect(tierGifts(null)).toBeNull();
    expect(tierGifts('star99')).toBeNull();
  });
});
