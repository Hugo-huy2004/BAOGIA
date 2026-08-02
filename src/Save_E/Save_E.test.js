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
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};
globalThis.window = {
  matchMedia: (query) => ({ matches: query.includes("standalone") && standalone }),
  navigator: {},
  location: { hostname: "app.hugowishpax.studio" },
};
globalThis.document = { documentElement: { classList: { add() {}, remove() {}, toggle() {} } } };

// Mạng giả lập: bật/tắt được "Tiết kiệm dữ liệu" giữa chừng để kiểm tra mức tự động.
const netListeners = new Set();
const connection = {
  saveData: false,
  effectiveType: "4g",
  addEventListener: (_event, handler) => netListeners.add(handler),
};
const setSaveData = (value) => {
  connection.saveData = value;
  netListeners.forEach((handler) => handler());
};
Object.defineProperty(globalThis, "navigator", { value: { connection }, configurable: true });

const { setEcoMode, isEcoOn, getEcoMode } = await import("./ecoMode.js");
const ecoStore = await import("./ecoStore.js");

describe("điều kiện bật chế độ Bảo vệ môi trường", () => {
  beforeEach(() => {
    store.clear();
    standalone = false;
    setSaveData(false);
  });

  it("gạt cờ trong tab trình duyệt thì KHÔNG áp dụng", () => {
    setEcoMode("on");
    expect(getEcoMode()).toBe("on");
    // Khung trình duyệt vẫn sáng nên phần tiết kiệm pin gần như bằng không.
    expect(isEcoOn()).toBe(false);
  });

  it("áp dụng khi mở từ ứng dụng đã cài", () => {
    setEcoMode("on");
    standalone = true;
    expect(isEcoOn()).toBe(true);
  });

  it("tắt cờ là tắt hẳn dù đang chạy dạng ứng dụng", () => {
    standalone = true;
    setEcoMode("on");
    expect(isEcoOn()).toBe(true);
    setEcoMode("off");
    expect(isEcoOn()).toBe(false);
  });

  it("mức tự động bám theo tín hiệu máy", () => {
    standalone = true;
    setEcoMode("auto");
    expect(isEcoOn()).toBe(false); // mạng 4G, không bật tiết kiệm dữ liệu
    setSaveData(true);
    expect(isEcoOn()).toBe(true);
    setSaveData(false);
    expect(isEcoOn()).toBe(false);
  });

  it("giữ lựa chọn của bản cũ (chỉ có bật/tắt)", () => {
    store.clear();
    store.set("hugo.saveE.enabled", "1");
    expect(getEcoMode()).toBe("on");
  });
});

describe("kho cục bộ: bài đọc lại, đệm bản tin, sổ tiết kiệm", () => {
  beforeEach(() => store.clear());

  it("giữ bài rồi bỏ bài", () => {
    expect(ecoStore.saveArticle({ id: "a", title: "Bài A" })).toBe(true);
    expect(ecoStore.isSaved("a")).toBe(true);
    ecoStore.removeSaved("a");
    expect(ecoStore.listSaved()).toEqual([]);
  });

  it("giữ lại bài cũ thì thay chỗ, không nhân đôi", () => {
    ecoStore.saveArticle({ id: "a", title: "Bản cũ" });
    ecoStore.saveArticle({ id: "a", title: "Bản mới" });
    expect(ecoStore.listSaved()).toHaveLength(1);
    expect(ecoStore.listSaved()[0].title).toBe("Bản mới");
  });

  it("đệm bản tin dùng lại được, quá hạn thì bỏ", () => {
    ecoStore.cacheFeed("vi:all", { items: [1, 2, 3] });
    expect(ecoStore.readFeedCache("vi:all").data.items).toHaveLength(3);

    const stale = JSON.parse(store.get("hugo.saveE.feed.vi:all"));
    stale.at = Date.now() - ecoStore.CACHE_MAX_AGE - 1;
    store.set("hugo.saveE.feed.vi:all", JSON.stringify(stale));
    expect(ecoStore.readFeedCache("vi:all")).toBeNull();
  });

  it("sổ cộng dồn lượt gọi đã tránh và số byte", () => {
    ecoStore.recordFeedHit(1000);
    ecoStore.recordSavedRead(500);
    ecoStore.recordFeedHit(1000);
    const ledger = ecoStore.readLedger();
    expect(ledger.feedHits).toBe(2);
    expect(ledger.savedReads).toBe(1);
    expect(ledger.bytesFromCache).toBe(2500);
  });

  it("đồng hồ cộng dồn thời gian, không mất khi dừng rồi chạy lại", () => {
    ecoStore.startEcoClock();
    const first = ecoStore.stopEcoClock();
    expect(first.startedAt).toBeNull();
    ecoStore.startEcoClock();
    expect(ecoStore.ecoMinutes()).toBeGreaterThanOrEqual(first.minutes);
    ecoStore.resetLedger();
    expect(ecoStore.readLedger().feedHits).toBe(0);
  });
});
