import { describe, it, expect, beforeEach } from "vitest";
import { getBest, recordBest, nearMissGap } from "./arcadeBest";

// Không có jsdom: dựng đúng localStorage mà module này đụng tới.
//
// Phải defineProperty chứ không `??=`: Node 25 đã có sẵn globalThis.localStorage
// (Web Storage thử nghiệm), nên `??=` không chèn gì cả, còn bản có sẵn thì
// không lưu được nếu thiếu cờ --localstorage-file — mọi lần đọc trả về null và
// bài test hoá ra đang kiểm tra một cái kho luôn rỗng.
const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
});

describe("arcadeBest", () => {
  beforeEach(() => store.clear());

  it("chưa chơi thì kỷ lục là 0", () => {
    expect(getBest("snake")).toBe(0);
  });

  it("chỉ ghi khi thật sự cao hơn", () => {
    expect(recordBest("snake", 100)).toBe(true);
    expect(recordBest("snake", 80)).toBe(false);
    expect(recordBest("snake", 100)).toBe(false);
    expect(getBest("snake")).toBe(100);
  });

  it("kỷ lục tách riêng theo từng game", () => {
    recordBest("snake", 100);
    expect(getBest("tetris")).toBe(0);
  });

  it("hụt trong 15% tính là sát nút, xa hơn thì không", () => {
    expect(nearMissGap("snake", 90, 100)).toBe(10);
    expect(nearMissGap("snake", 80, 100)).toBe(0);
  });

  // Với kỷ lục nhỏ, 15% ra chưa tới 1 điểm — sàn 3 điểm giữ cho cơ chế còn
  // hoạt động ở những ván đầu, đúng lúc người chơi dễ bỏ cuộc nhất.
  it("kỷ lục nhỏ vẫn có ngưỡng sát nút tối thiểu", () => {
    expect(nearMissGap("caro", 8, 10)).toBe(2);
  });

  it("bằng hoặc hơn kỷ lục thì không phải hụt", () => {
    expect(nearMissGap("snake", 100, 100)).toBe(0);
    expect(nearMissGap("snake", 120, 100)).toBe(0);
  });

  it("điểm hỏng không ghi đè kỷ lục", () => {
    recordBest("snake", 100);
    expect(recordBest("snake", NaN)).toBe(false);
    expect(recordBest("snake", -5)).toBe(false);
    expect(getBest("snake")).toBe(100);
  });
});
