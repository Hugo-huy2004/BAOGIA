import { describe, it, expect, beforeEach } from "vitest";
import { winnerOf, pickMove } from "./ticTacToe";

describe("cờ ca-rô (chạy trong máy, không gọi mạng)", () => {
  it("nhận ra hàng thắng", () => {
    expect(winnerOf(["X", "X", "X", "", "", "", "", "", ""])).toBe("X");
    expect(winnerOf(["O", "", "", "O", "", "", "O", "", ""])).toBe("O");
    expect(winnerOf(Array(9).fill(""))).toBeNull();
  });

  it("thắng được thì thắng ngay", () => {
    expect(pickMove(["O", "O", "", "X", "X", "", "", "", ""])).toBe(2);
  });

  it("không thắng được thì chặn nước thắng của người chơi", () => {
    expect(pickMove(["X", "O", "", "X", "", "", "", "", ""])).toBe(6);
  });

  it("bàn trống thì chiếm ô giữa", () => {
    expect(pickMove(Array(9).fill(""))).toBe(4);
  });

  it("bàn đầy thì không còn nước nào", () => {
    expect(pickMove(["X", "O", "X", "X", "O", "O", "O", "X", "X"])).toBeUndefined();
  });
});

// Dựng sẵn vài global trước khi nạp module — dự án không cài jsdom và cũng
// không đáng thêm một dependency chỉ để kiểm tra một điều kiện.
const store = new Map();
let standalone = false;
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  clear: () => store.clear(),
};
globalThis.window = {
  matchMedia: (query) => ({ matches: query.includes("standalone") && standalone }),
  navigator: {},
  location: { hostname: "app.hugowishpax.studio" },
};
globalThis.document = { documentElement: { classList: { add() {}, remove() {}, toggle() {} } } };

const { setEcoMode, isEcoOn, isEcoFlagOn } = await import("./ecoMode.js");

describe("điều kiện bật chế độ Bảo vệ môi trường", () => {
  beforeEach(() => {
    store.clear();
    standalone = false;
  });

  it("gạt cờ trong tab trình duyệt thì KHÔNG áp dụng", () => {
    setEcoMode(true);
    expect(isEcoFlagOn()).toBe(true);
    // Khung trình duyệt vẫn sáng nên phần tiết kiệm pin gần như bằng không.
    expect(isEcoOn()).toBe(false);
  });

  it("áp dụng khi mở từ ứng dụng đã cài", () => {
    setEcoMode(true);
    standalone = true;
    expect(isEcoOn()).toBe(true);
  });

  it("tắt cờ là tắt hẳn dù đang chạy dạng ứng dụng", () => {
    standalone = true;
    setEcoMode(true);
    expect(isEcoOn()).toBe(true);
    setEcoMode(false);
    expect(isEcoOn()).toBe(false);
  });
});
