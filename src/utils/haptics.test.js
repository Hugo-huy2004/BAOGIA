import { describe, it, expect, beforeEach } from "vitest";
import { triggerHaptic, setNativeHaptics, hapticPinTap, hapticWin } from "./haptics";

// Không có jsdom: dựng đúng hai global mà triggerHaptic đụng tới.
globalThis.navigator ??= {};

const ImpactStyle = { Light: "LIGHT", Medium: "MEDIUM", Heavy: "HEAVY" };

function fakePlugin(calls) {
  return {
    ImpactStyle,
    Haptics: {
      impact: (arg) => { calls.push(["impact", arg.style]); return Promise.resolve(); },
      vibrate: (arg) => { calls.push(["vibrate", arg.duration]); return Promise.resolve(); },
    },
  };
}

describe("haptics", () => {
  let calls;
  beforeEach(() => {
    calls = [];
    setNativeHaptics(null);
    navigator.vibrate = (d) => calls.push(["web", d]);
    navigator.userActivation = { hasBeenActive: true };
  });

  it("trên web vẫn dùng navigator.vibrate", () => {
    triggerHaptic(8);
    expect(calls).toEqual([["web", 8]]);
  });

  it("có plugin native thì đi qua Capacitor, không đụng navigator.vibrate", () => {
    setNativeHaptics(fakePlugin(calls));
    triggerHaptic(8);
    expect(calls).toEqual([["impact", "LIGHT"]]);
  });

  it("chia cường độ theo ngưỡng 10 / 30", () => {
    setNativeHaptics(fakePlugin(calls));
    triggerHaptic(10);
    triggerHaptic(11);
    triggerHaptic(30);
    triggerHaptic(31);
    expect(calls.map(([, s]) => s)).toEqual(["LIGHT", "MEDIUM", "MEDIUM", "HEAVY"]);
  });

  it("pattern (mảng) gộp thành một lần vibrate theo tổng thời lượng", () => {
    setNativeHaptics(fakePlugin(calls));
    hapticWin(); // [20, 40, 20, 40, 30]
    expect(calls).toEqual([["vibrate", 150]]);
  });

  it("chưa có tương tác người dùng thì im lặng", () => {
    navigator.userActivation = { hasBeenActive: false };
    setNativeHaptics(fakePlugin(calls));
    hapticPinTap();
    expect(calls).toEqual([]);
  });
});
