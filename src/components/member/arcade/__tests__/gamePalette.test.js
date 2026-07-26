import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

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
