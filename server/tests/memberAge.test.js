import { describe, it, expect, afterEach, vi } from 'vitest';
import { ageFromBirth, isAdultAge, isMinorAge } from '../utils/memberAge.js';

// Cổng 18+ (HugoPSY, donate, ứng tuyển) đứng trên đúng hàm này. Sai một tháng
// là hoặc chặn nhầm người đủ tuổi, hoặc mở nhầm cho trẻ — nên mọi mốc chuyển
// đều phải có test, kể cả các nhánh dữ liệu thiếu.

// Mốc giờ ĐỊA PHƯƠNG: hàm tính tuổi đọc getMonth() theo múi giờ máy chủ, nên
// test dựng ngày bằng giờ địa phương để chạy giống nhau ở mọi múi giờ.
const freeze = (year, month, day, hour = 12) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month - 1, day, hour));
};

afterEach(() => vi.useRealTimers());

describe('ageFromBirth', () => {
  it('lên 18 đúng ngày sinh nhật', () => {
    freeze(2026, 8, 15);
    expect(ageFromBirth(2008, 9, 1)).toBe(17);  // sinh nhật tháng sau
    expect(ageFromBirth(2008, 8, 16)).toBe(17); // mai mới sinh nhật
    expect(ageFromBirth(2008, 8, 15)).toBe(18); // đúng hôm nay
    expect(ageFromBirth(2008, 8, 14)).toBe(18);
    expect(ageFromBirth(2008, 7, 30)).toBe(18);
  });

  it('qua sinh nhật là tự lên hạng, không cần thao tác gì', () => {
    freeze(2026, 8, 19, 23);
    expect(isAdultAge(ageFromBirth(2008, 8, 20))).toBe(false);
    freeze(2026, 8, 20, 0);
    expect(isAdultAge(ageFromBirth(2008, 8, 20))).toBe(true);
  });

  it('thiếu ngày/tháng thì lùi về mốc muộn nhất — fail-closed, không mở sớm', () => {
    freeze(2026, 8, 15);
    expect(ageFromBirth(2008, 8, undefined)).toBe(17); // coi như ngày 31
    expect(ageFromBirth(2008, 8, 0)).toBe(17);
    expect(ageFromBirth(2008, undefined, undefined)).toBe(17); // coi như 31/12
    expect(ageFromBirth(2008, 13, 40)).toBe(17);
  });

  it('thiếu hoặc sai năm sinh trả null — "chưa biết tuổi", không phải "đủ tuổi"', () => {
    freeze(2026, 8, 15);
    for (const bad of [undefined, null, '', 0, 1899, 2027, 'hai nghìn', NaN]) {
      expect(ageFromBirth(bad, 5, 10)).toBeNull();
    }
    expect(isAdultAge(null)).toBe(false);
    expect(isMinorAge(null)).toBe(false); // chưa biết ≠ vị thành niên
  });

  it('phân loại đúng ba nhóm của chính sách', () => {
    freeze(2026, 8, 15);
    expect(ageFromBirth(2013, 8, 1)).toBe(13); // dưới 14: không đủ điều kiện
    expect(ageFromBirth(2010, 1, 1)).toBe(16); // 14–17: có giám sát
    expect(isMinorAge(ageFromBirth(2010, 1, 1))).toBe(true);
    expect(isAdultAge(ageFromBirth(2000, 12, 31))).toBe(true);
  });
});
