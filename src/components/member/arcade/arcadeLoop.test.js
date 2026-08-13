import { describe, expect, it } from "vitest";
import { createFrameGate, createFrameScaler, decay, STEP_MS } from "./arcadeLoop";

// Điều duy nhất đáng test ở đây: cùng một khoảng THỜI GIAN THỰC phải cho ra
// cùng số nhịp logic, bất kể màn hình quét 60 hay 120Hz. Đó chính là lỗi cũ.
// Chạy `seconds` giây thời gian thực ở tần số quét `hz`, trả về tổng số nhịp
// logic. Sai lệch ±1 là bình thường: một nhịp lẻ có thể còn nằm trong bộ đệm.
const runFor = (gate, seconds, hz) => {
  const frames = seconds * hz;
  let steps = 0;
  gate.steps(0);                                    // khung đầu, chưa tính
  for (let i = 1; i <= frames; i += 1) steps += gate.steps((i * 1000) / hz);
  return steps;
};

describe("createFrameGate", () => {
  it("chạy ~60 nhịp mỗi giây dù màn hình 60Hz hay 120Hz", () => {
    for (const hz of [60, 120, 144]) {
      expect(runFor(createFrameGate(), 1, hz), `${hz}Hz`).toBeCloseTo(60, -0.5);
    }
  });

  it("máy tụt fps thì chạy bù để tốc độ game không chậm lại", () => {
    // 30fps: mỗi khung 33ms ≈ 2 nhịp → vẫn ~60 nhịp trong 1 giây.
    expect(runFor(createFrameGate(), 1, 30)).toBeCloseTo(60, -0.5);
  });

  it("không trả nợ sau khi tab bị ẩn lâu", () => {
    const gate = createFrameGate();
    gate.steps(0);
    expect(gate.steps(30000)).toBe(1);   // 30 giây ≠ 1800 nhịp dồn một lúc
  });

  it("chặn số nhịp bù trong một khung hình", () => {
    const gate = createFrameGate(STEP_MS, 3);
    gate.steps(0);
    expect(gate.steps(200)).toBe(3);     // 200ms = 12 nhịp, chỉ bù tối đa 3
  });
});

describe("createFrameScaler", () => {
  it("hệ số ~1 ở 60Hz và ~0.5 ở 120Hz", () => {
    const a = createFrameScaler(); a.factor(0);
    expect(a.factor(STEP_MS)).toBeCloseTo(1, 5);
    const b = createFrameScaler(); b.factor(0);
    expect(b.factor(STEP_MS / 2)).toBeCloseTo(0.5, 5);
  });

  it("tổng hệ số trong 1 giây xấp xỉ 60 nhịp ở mọi tần số quét", () => {
    for (const hz of [60, 120, 144]) {
      const scaler = createFrameScaler();
      let total = 0;
      scaler.factor(0);
      for (let i = 1; i <= hz; i += 1) total += scaler.factor((i * 1000) / hz);
      expect(total, `${hz}Hz`).toBeCloseTo(60, -0.5);
    }
  });
});

describe("decay", () => {
  it("suy giảm nửa nhịp hai lần bằng đúng một nhịp", () => {
    expect(decay(0.9, 0.5) * decay(0.9, 0.5)).toBeCloseTo(0.9, 10);
  });
});
