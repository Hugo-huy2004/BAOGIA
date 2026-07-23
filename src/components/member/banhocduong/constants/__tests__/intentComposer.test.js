import { describe, it, expect, beforeEach } from "vitest";
import { findMatchingIntent } from "../intentClassifier";

// Node's own global `localStorage` shadows jsdom's window.localStorage in
// this Vitest setup, so tests that touch it need the in-memory mock (same
// pattern as workspaceUtils.test.js).
function installLocalStorageMock() {
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    },
    configurable: true,
  });
}

// Sanity check for the compositional reply engine: local intents must no
// longer return the exact same sentence every time, must never leak the
// {name}/{who} template tokens, and must weave in the detected "who" when
// the raw message names one. Each test uses a distinct displayName so their
// secureMemory (keyed by name) doesn't collide across tests/runs.
describe("composeIntentReply (via findMatchingIntent)", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it("varies the reply across repeated matches of the same intent", () => {
    const bio = { displayName: "Nguyễn Gia Huy Variance Test" };
    const seen = new Set();
    for (let i = 0; i < 6; i++) {
      const result = findMatchingIntent("bố mẹ áp đặt tớ quá", bio, []);
      expect(result?.id).toBe("family_conflict");
      seen.add(result.reply.join(" | "));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("never leaks unresolved {name}/{who} template tokens", () => {
    const bio = { displayName: "Trần Bảo An Token Test" };
    for (let i = 0; i < 6; i++) {
      const result = findMatchingIntent("tớ vừa chia tay người yêu", bio, []);
      result.reply.forEach((bubble) => {
        expect(bubble).not.toMatch(/\{name\}|\{who\}/);
      });
    }
  });

  it("weaves in the detected 'who' from the raw message", () => {
    const bio = { displayName: "Lê Thị Mai Who Test" };
    const result = findMatchingIntent("cãi nhau với bố mẹ hoài", bio, []);
    expect(result?.id).toBe("family_conflict");
    expect(result.reply.some((b) => b.includes("bố mẹ"))).toBe(true);
  });

  it("does not fire a fast-path intent when the keyword is negated", () => {
    const bio = { displayName: "Phạm Văn Đức Negation Test" };
    const result = findMatchingIntent("hôm nay tớ không buồn tí nào cả", bio, []);
    expect(result?.id).not.toBe("sadness");
  });

  it("still fires the intent when the keyword is not negated", () => {
    const bio = { displayName: "Phạm Văn Đức Negation Control" };
    const result = findMatchingIntent("tớ buồn quá", bio, []);
    expect(result?.id).toBe("sadness");
  });

  it("adds an extra grounding bubble for high-neuroticism users on intense messages", () => {
    const bio = { displayName: "Vũ Thị Lan Neurotic Test" };
    const historyLogs = [
      { date: "2026-01-01", test: "bigfive", traits: { extraversion: 3, agreeableness: 3, conscientiousness: 3, neuroticism: 4.5, openness: 3 } },
    ];
    const result = findMatchingIntent("bố mẹ áp đặt tớ quá", bio, historyLogs);
    expect(result?.id).toBe("family_conflict");
    expect(result.reply.some((b) => b.includes("cảm nhận"))).toBe(true);
  });

  // Regression: "sleep" and "academic_stress" used to return a fixed 3-sentence
  // script (no _rotate, ignoring rawText/memory entirely) — the exact "robotic,
  // repeats itself" complaint. Now routed through composeIntentReply like the
  // other emotional intents.
  it("varies sleep replies across repeated matches instead of a fixed script", () => {
    const bio = { displayName: "Đỗ Minh Khang Sleep Test" };
    const seen = new Set();
    for (let i = 0; i < 6; i++) {
      const result = findMatchingIntent("tớ bị mất ngủ", bio, []);
      expect(result?.id).toBe("sleep");
      seen.add(result.reply.join(" | "));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("varies academic_stress replies and still injects the exam-date token", () => {
    const bio = { displayName: "Ngô Thị Hà Exam Test" };
    const seen = new Set();
    for (let i = 0; i < 6; i++) {
      const result = findMatchingIntent("áp lực học tập quá", bio, []);
      expect(result?.id).toBe("academic_stress");
      result.reply.forEach((b) => expect(b).not.toMatch(/\{exam\}/));
      seen.add(result.reply.join(" | "));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
