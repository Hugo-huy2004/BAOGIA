// Nhịp khung hình dùng chung cho các game canvas.
//
// VẤN ĐỀ GỐC: mọi vòng lặp game trước đây cập nhật vật lý "mỗi khung hình một
// nhịp" — `x += speed`, `timer -= 1`. requestAnimationFrame chạy theo TẦN SỐ
// QUÉT của màn hình, nên cùng một đoạn code:
//   ·  60Hz  → đúng tốc độ thiết kế
//   · 120Hz (iPhone ProMotion, Android 90/144Hz) → game chạy NHANH GẤP ĐÔI,
//     power-up chỉ còn nửa thời gian, độ khó vô tình tăng gấp đôi
//   · máy tụt fps → game chậm lại và giật
// Đó chính là cảm giác "chơi chưa mượt": không phải thiếu fps, mà là tốc độ
// game bị buộc vào phần cứng màn hình.
//
// Hai cách sửa, tuỳ vòng lặp đã viết kiểu nào:
//
// 1. `createFrameGate()` — cho vòng lặp có vật lý tính theo NHỊP (survivor).
//    Giữ nguyên toàn bộ code trong thân vòng lặp, chỉ gọi thân đó đúng số lần
//    tương ứng thời gian thực đã trôi qua. 120Hz: nửa số khung không gọi (không
//    có gì đổi thì cũng không cần vẽ lại). Máy chậm: gọi bù 2–3 lần.
//
// 2. `createFrameScaler()` — cho vòng lặp đã tính theo THỜI GIAN nhưng còn vài
//    chỗ suy giảm theo nhịp (snake: hạt lửa, rung màn, thời gian sống của mồi
//    vàng). Trả về hệ số "số nhịp 60Hz đã trôi qua" để nhân vào các chỗ đó,
//    nhờ vậy game vẫn vẽ ở đủ 120Hz cho mượt mắt mà thời lượng thì đúng.

export const STEP_MS = 1000 / 60;

// Ngưỡng bỏ qua: tab bị ẩn / máy treo vài giây thì không trả nợ nhịp, vì chạy
// bù 300 nhịp một lúc sẽ làm người chơi chết oan ngay khi quay lại.
const STALL_MS = 250;

/**
 * Cổng nhịp cố định: `steps(now)` trả về số lần cần chạy một nhịp logic.
 * @param {number} stepMs      độ dài một nhịp (mặc định 1/60 giây)
 * @param {number} maxCatchUp  số nhịp bù tối đa trong một khung hình
 */
export function createFrameGate(stepMs = STEP_MS, maxCatchUp = 3) {
  let acc = 0;
  let last = null;   // `null` chứ không phải 0: mốc thời gian 0 là hợp lệ
  return {
    steps(now) {
      if (last === null) { last = now; return 1; }  // khung đầu luôn chạy một nhịp
      const elapsed = now - last;
      last = now;
      if (elapsed > STALL_MS) { acc = 0; return 1; }
      acc += elapsed;
      let n = 0;
      while (acc >= stepMs && n < maxCatchUp) { acc -= stepMs; n += 1; }
      if (n === maxCatchUp) acc = 0;   // quá tải thì chấp nhận chậm, không nợ dồn
      return n;
    },
    reset() { acc = 0; last = null; },
  };
}

/**
 * Hệ số thời gian: `factor(now)` trả về số nhịp 60Hz đã trôi qua kể từ khung
 * trước (60Hz → ~1, 120Hz → ~0.5), chặn trên để một khung lag không nhảy vọt.
 */
export function createFrameScaler(stepMs = STEP_MS, maxFactor = 4) {
  let last = null;
  return {
    factor(now) {
      if (last === null) { last = now; return 1; }
      const elapsed = now - last;
      last = now;
      if (elapsed > STALL_MS) return 1;
      return Math.min(maxFactor, elapsed / stepMs);
    },
    reset() { last = null; },
  };
}

/** Suy giảm nhân (vd 0.9 mỗi nhịp) tính đúng cho `f` nhịp đã trôi qua. */
export const decay = (rate, f) => (f === 1 ? rate : Math.pow(rate, f));
