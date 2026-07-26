import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { withAlpha, shade, luminance } from "../arcadePalette";

import GAME_THEMES from "../gameThemes";
import en from "../../../../i18n/locales/en/translation.json";
import vi from "../../../../i18n/locales/vi/translation.json";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), "utf8");

// The shell is the authority on which games exist. Parsed as text rather than
// imported so this stays a cheap unit test (the module lazy-loads 8 games).
const shellSource = read("../StandaloneGameShell.jsx");
const gameIds = [
  ...shellSource
    .slice(shellSource.indexOf("const GAME_COMPONENTS"), shellSource.indexOf("// Semantic outcome"))
    .matchAll(/^\s+"?([\w-]+)"?:\s+React\.lazy/gm),
].map((m) => m[1]);

const introCss = read("../game-intro.css");

/** Đọc giá trị --intro-bg đã khai trong game-intro.css cho một game. */
function paletteToken(id, token) {
  const block = introCss.match(new RegExp(`\\.arcade-game--${id}\\s*\\{([^}]*)\\}`));
  const found = block?.[1].match(new RegExp(`${token}:\\s*([^;]+);`));
  return found?.[1].trim();
}

describe("arcadePalette helpers", () => {
  it("chuyển hex sang rgba giữ đúng kênh màu", () => {
    expect(withAlpha("#ff8800", 0.5)).toBe("rgba(255, 136, 0, 0.5)");
    expect(withAlpha("#f80", 1)).toBe("rgba(255, 136, 0, 1)");
    // Giá trị không phải hex phải trả nguyên si, không sinh "rgba(NaN...)".
    expect(withAlpha("rgba(0,0,0,.2)", 0.5)).toBe("rgba(0,0,0,.2)");
  });

  it("shade đi tới trắng và tới đen mà không tràn kênh", () => {
    expect(shade("#808080", 1)).toBe("#ffffff");
    expect(shade("#808080", -1)).toBe("#000000");
    expect(shade("#808080", 0)).toBe("#808080");
  });

  it("luminance xếp trắng cao hơn đen", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 2);
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeGreaterThan(luminance("#808080"));
  });
});

describe("arcade game presentation coverage", () => {
  it("finds every game registered in the shell", () => {
    expect(gameIds).toHaveLength(8);
    expect(gameIds).toContain("2048");
    expect(gameIds).toContain("chess");
  });

  it.each(gameIds)("%s has a palette on .arcade-game--<id>", (id) => {
    const block = introCss.match(new RegExp(`\\.arcade-game--${id}\\s*\\{([^}]*)\\}`));
    expect(block, `missing .arcade-game--${id} palette in game-intro.css`).toBeTruthy();
    // All five tokens must be set, or the chrome silently falls back to the
    // generic indigo default and the game stops looking like itself.
    for (const token of ["--intro-bg", "--intro-ink", "--intro-muted", "--intro-accent", "--intro-soft"]) {
      expect(block[1], `${id} is missing ${token}`).toContain(token);
    }
  });

  // Các engine canvas dùng ngưỡng sáng/tối này để chọn giữa quầng neon và
  // viền đậm. Phân loại sai = thực thể tàng hình trên bàn chơi.
  it.each([
    ["survivor", false],
    ["tetris", false],
    ["snake", true],
    ["flappy", true],
    ["2048", true],
    ["caro", true],
    ["wordguess", true],
    ["chess", true],
  ])("%s được xếp là nền sáng: %s", (id, expectedLight) => {
    const bg = paletteToken(id, "--intro-bg");
    expect(bg, `thiếu --intro-bg cho ${id}`).toBeTruthy();
    expect(luminance(bg) > 0.4).toBe(expectedLight);
  });

  it.each(gameIds)("%s has a display name and intro copy in both locales", (id) => {
    expect(GAME_THEMES[id]?.name).toBeTruthy();
    for (const [label, dict] of [["en", en], ["vi", vi]]) {
      const copy = dict.arcadeIntro.games[id];
      expect(copy, `${label} is missing arcadeIntro.games.${id}`).toBeTruthy();
      for (const field of ["eyebrow", "title", "description", "hint"]) {
        expect(copy[field], `${label} ${id}.${field}`).toBeTruthy();
      }
    }
  });

  it("keeps the in-game chrome strings in sync across locales", () => {
    const flatten = (o, p = "") =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === "object" && v !== null ? flatten(v, `${p}${k}.`) : [`${p}${k}`]
      );
    expect(flatten(vi.arcadeGame).sort()).toEqual(flatten(en.arcadeGame).sort());
  });
});
