import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Chưa có jsdom trong repo — dựng đúng mấy global mà joyStore đụng tới.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const EMAIL = "player@example.com";
let calls;
let balance;

beforeEach(async () => {
  store.clear();
  calls = 0;
  balance = 100;
  globalThis.fetch = vi.fn(async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => ({ balance, referralCode: "ABC" }) };
  });
  vi.resetModules();
});

afterEach(() => {
  delete globalThis.fetch;
});

const load = async () => (await import("./joyStore.js")).useJoyStore;

describe("số dư JOY: cache 10 giây vs. đọc sau khi vừa cộng tiền", () => {
  it("đọc lần đầu thì gọi mạng", async () => {
    const useJoyStore = await load();
    await useJoyStore.getState().fetchBalance(EMAIL);
    expect(calls).toBe(1);
    expect(useJoyStore.getState().balance).toBe(100);
  });

  it("đọc lại ngay thì dùng cache, không gọi mạng thêm", async () => {
    const useJoyStore = await load();
    await useJoyStore.getState().fetchBalance(EMAIL);
    await useJoyStore.getState().fetchBalance(EMAIL);
    expect(calls).toBe(1);
  });

  it("KHÔNG force: thắng game xong ví vẫn hiện số cũ — đây là bug đã báo", async () => {
    const useJoyStore = await load();
    await useJoyStore.getState().fetchBalance(EMAIL);
    balance = 129; // server vừa cộng 29 JOY tiền thưởng
    await useJoyStore.getState().fetchBalance(EMAIL);
    expect(useJoyStore.getState().balance).toBe(100); // cache 10s trả số trước trận
    expect(calls).toBe(1);
  });

  it("force: bỏ qua cache và lấy đúng số dư mới", async () => {
    const useJoyStore = await load();
    await useJoyStore.getState().fetchBalance(EMAIL);
    balance = 129;
    await useJoyStore.getState().fetchBalance(EMAIL, undefined, { force: true });
    expect(useJoyStore.getState().balance).toBe(129);
    expect(calls).toBe(2);
  });

  it("force không dính vào request đã bay trước khi cộng tiền", async () => {
    const useJoyStore = await load();
    let release;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      const snapshot = balance;
      if (calls === 1) await new Promise((r) => { release = r; });
      return { ok: true, status: 200, json: async () => ({ balance: snapshot, referralCode: "" }) };
    });

    const stale = useJoyStore.getState().fetchBalance(EMAIL); // bay lúc còn 100
    balance = 129;                                            // thưởng rơi vào giữa chừng
    await useJoyStore.getState().fetchBalance(EMAIL, undefined, { force: true });
    expect(useJoyStore.getState().balance).toBe(129);

    release?.();
    await stale;
    expect(calls).toBe(2); // không gộp chung với request cũ
  });

  it("email viết hoa/thường khác nhau vẫn là một ví", async () => {
    const useJoyStore = await load();
    await useJoyStore.getState().fetchBalance(EMAIL);
    await useJoyStore.getState().fetchBalance(EMAIL.toUpperCase());
    expect(calls).toBe(1);
  });
});
