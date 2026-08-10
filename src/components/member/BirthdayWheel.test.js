import { describe, it, expect } from 'vitest';
import { targetAngle, segmentUnderPointer } from './BirthdayWheel.jsx';

// Server bốc ô trúng, vòng quay chỉ có việc dừng đúng ô đó. Lệch một ô là
// người dùng thấy 10 JOY nhưng ví cộng 10.000 (hoặc ngược lại) — nên phép xoay
// phải có test, kể cả các mép ô.

const COUNT = 7;

describe('targetAngle', () => {
  it('dừng đúng ô server đã chọn, với mọi mức lệch', () => {
    for (let index = 0; index < COUNT; index += 1) {
      for (const jitter of [0, 0.5, -0.5, 0.98, -0.98]) {
        const angle = targetAngle(index, COUNT, 6, jitter);
        expect(segmentUnderPointer(angle, COUNT)).toBe(index);
      }
    }
  });

  it('kẹp mức lệch nên không bao giờ tràn sang ô bên cạnh', () => {
    for (let index = 0; index < COUNT; index += 1) {
      for (const jitter of [5, -5, Number.POSITIVE_INFINITY, -3.2]) {
        expect(segmentUnderPointer(targetAngle(index, COUNT, 6, jitter), COUNT)).toBe(index);
      }
    }
  });

  it('quay đủ số vòng trọn vẹn rồi mới dừng — không quay ngược', () => {
    expect(targetAngle(0, COUNT, 6, 0)).toBeGreaterThan(5 * 360);
    expect(targetAngle(COUNT - 1, COUNT, 6, 0)).toBeGreaterThan(5 * 360);
  });

  it('vẫn đúng nếu sau này đổi số ô phần thưởng', () => {
    for (const count of [3, 5, 8, 12]) {
      for (let index = 0; index < count; index += 1) {
        expect(segmentUnderPointer(targetAngle(index, count, 4, 0.7), count)).toBe(index);
      }
    }
  });
});
