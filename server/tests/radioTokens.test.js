import { describe, it, expect } from 'vitest';
import {
  applyListening, isPeakHour, PEAK_MULTIPLIER,
  toTokens, ensureWeeklyReset, nextResetAt, WEEKLY_FREE_MINUTES, WEEKLY_FREE_TOKENS,
} from '../utils/radioTokens.js';

// Hạn mức: 5 giờ miễn phí mỗi tuần = 300 phút, hết mới đụng tới phần đã mua.
const fresh = (overrides = {}) => ({
  weeklyFreeMinutes: 300,
  weeklyUsedMinutes: 0,
  purchasedMinutes: 0,
  ...overrides,
});

describe('trừ giờ nghe radio vào hạn mức 5 giờ/tuần', () => {
  it('trừ đúng số phút đã nghe, kể cả phút lẻ', () => {
    const tokens = fresh();
    const result = applyListening(tokens, 4.5);
    expect(tokens.weeklyUsedMinutes).toBe(4.5);
    expect(result.freeRemaining).toBe(295.5);
    expect(result.deducted).toBe(4.5);
  });

  it('nghe 0 phút thì không trừ gì (trước đây bị tính thành 5 phút)', () => {
    const tokens = fresh({ weeklyUsedMinutes: 10 });
    const result = applyListening(tokens, 0);
    expect(tokens.weeklyUsedMinutes).toBe(10);
    expect(result.deducted).toBe(0);
  });

  it('cộng dồn hàng trăm nhịp lẻ không bị trôi số', () => {
    const tokens = fresh();
    for (let i = 0; i < 300; i += 1) applyListening(tokens, 0.1);
    expect(tokens.weeklyUsedMinutes).toBe(30);
  });

  it('hết miễn phí mới trừ sang phần đã mua', () => {
    const tokens = fresh({ weeklyUsedMinutes: 298, purchasedMinutes: 60 });
    const result = applyListening(tokens, 5);
    expect(tokens.weeklyUsedMinutes).toBe(300);   // dùng nốt 2 phút miễn phí
    expect(tokens.purchasedMinutes).toBe(57);     // 3 phút còn lại lấy từ gói mua
    expect(result.deducted).toBe(5);
    expect(result.canListen).toBe(true);
  });

  it('hết sạch thì canListen = false và không trừ âm', () => {
    const tokens = fresh({ weeklyUsedMinutes: 300, purchasedMinutes: 2 });
    const result = applyListening(tokens, 10);
    expect(tokens.purchasedMinutes).toBe(0);
    expect(result.deducted).toBe(2);   // chỉ trừ được 2 phút còn lại
    expect(result.totalRemaining).toBe(0);
    expect(result.canListen).toBe(false);
  });
});

describe('giờ cao điểm (peak multiplier)', () => {
  it('peak multiplier 2x trừ gấp đôi số phút', () => {
    const tokens = fresh();
    const result = applyListening(tokens, 5, 2);
    expect(tokens.weeklyUsedMinutes).toBe(10);
    expect(result.freeRemaining).toBe(290);
    expect(result.deducted).toBe(10);
  });

  it('peak multiplier 1x (bình thường) trừ đúng số phút', () => {
    const tokens = fresh();
    const result = applyListening(tokens, 5, 1);
    expect(tokens.weeklyUsedMinutes).toBe(5);
    expect(result.deducted).toBe(5);
  });

  it('peak hour detect: 02:00 UTC+7 = peak', () => {
    // 02:00 VN = 19:00 UTC previous day
    const d = new Date('2025-01-15T19:00:00Z');
    expect(isPeakHour(d)).toBe(true);
  });

  it('peak hour detect: 12:00 UTC+7 = peak', () => {
    const d = new Date('2025-01-15T05:00:00Z');
    expect(isPeakHour(d)).toBe(true);
  });

  it('peak hour detect: 08:00 UTC+7 = NOT peak', () => {
    const d = new Date('2025-01-15T01:00:00Z');
    expect(isPeakHour(d)).toBe(false);
  });

  it('peak hour detect: 15:00 UTC+7 = NOT peak', () => {
    const d = new Date('2025-01-15T08:00:00Z');
    expect(isPeakHour(d)).toBe(false);
  });

  it('peak multiplier hết miễn phí rồi mới trừ sang mua', () => {
    const tokens = fresh({ weeklyUsedMinutes: 295, purchasedMinutes: 30 });
    // 5 phút thực * 2 = 10 phút hiệu quả. 5 phút miễn phí + 5 phút mua.
    const result = applyListening(tokens, 5, 2);
    expect(tokens.weeklyUsedMinutes).toBe(300);
    expect(tokens.purchasedMinutes).toBe(25);
    expect(result.deducted).toBe(10);
  });
});

describe('quy đổi phút → token (đơn vị người dùng nhìn thấy)', () => {
  it('1 token = 10 phút, làm tròn XUỐNG', () => {
    expect(toTokens(300)).toBe(30);
    expect(toTokens(299)).toBe(29);   // 29.9 token mà hiện 30 là hứa hão
    expect(toTokens(9)).toBe(0);
    expect(toTokens(0)).toBe(0);
    expect(toTokens(-5)).toBe(0);
  });

  it('hạn mức tuần miễn phí đúng 30 token', () => {
    expect(WEEKLY_FREE_TOKENS).toBe(30);
    expect(toTokens(WEEKLY_FREE_MINUTES)).toBe(WEEKLY_FREE_TOKENS);
  });
});

describe('mốc nạp lại hàng tuần', () => {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  it('chưa hết tuần thì KHÔNG đụng vào số liệu và báo "không đổi"', () => {
    const tokens = fresh({ weeklyUsedMinutes: 120, weeklyResetAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) });
    expect(ensureWeeklyReset(tokens)).toBe(false);
    expect(tokens.weeklyUsedMinutes).toBe(120);
  });

  it('quá 7 ngày thì nạp lại và báo "có đổi" (để route biết mà ghi database)', () => {
    const tokens = fresh({ weeklyUsedMinutes: 300, weeklyResetAt: new Date(Date.now() - WEEK_MS - 1000) });
    expect(ensureWeeklyReset(tokens)).toBe(true);
    expect(tokens.weeklyUsedMinutes).toBe(0);
    expect(tokens.weeklyFreeMinutes).toBe(WEEKLY_FREE_MINUTES);
  });

  it('token đã mua KHÔNG bị tuần mới xoá', () => {
    const tokens = fresh({ purchasedMinutes: 240, weeklyResetAt: new Date(Date.now() - WEEK_MS - 1000) });
    ensureWeeklyReset(tokens);
    expect(tokens.purchasedMinutes).toBe(240);
  });

  it('nextResetAt luôn cách mốc reset đúng một tuần', () => {
    const start = new Date('2026-08-10T00:00:00Z');
    expect(nextResetAt({ weeklyResetAt: start }).getTime()).toBe(start.getTime() + WEEK_MS);
  });
});
