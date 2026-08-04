import { describe, it, expect } from 'vitest';
import { applyListening } from '../routes/radioRoutes.js';

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
