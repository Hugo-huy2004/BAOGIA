/**
 * The Member Portal theme contract shared by the browser and Node server.
 *
 * Keep access policy next to the visual metadata so a theme cannot be shown as
 * free in the gallery while the API still treats it as a paid rental.
 */
export const AURA_THEMES = Object.freeze([
  {
    id: "default",
    category: "free",
    accent: "neutral",
    pattern: "plain",
    palette: ["#ffffff", "#f2f2f7", "#1c1c1e", "#000000"],
    free: true,
    price: 0,
  },
  {
    id: "ios27",
    category: "free",
    accent: "blue",
    pattern: "liquid",
    palette: ["#007aff", "#5ac8fa", "#af52de", "#34c759"],
    free: true,
    price: 0,
  },
  {
    id: "pride",
    category: "identity",
    accent: "pink",
    pattern: "pride",
    palette: ["#ff3b30", "#ffcc00", "#34c759", "#af52de"],
    free: true,
    price: 0,
  },
  {
    id: "ocean",
    category: "free",
    accent: "cyan",
    pattern: "waves",
    palette: ["#00c7be", "#32ade6", "#007aff", "#5856d6"],
    free: true,
    price: 0,
  },
  {
    id: "hugoStudio",
    category: "studio",
    accent: "violet",
    pattern: "studio",
    palette: ["#6d5dfc", "#c35cff", "#ff4d8d", "#35d3ff"],
    price: 50,
  },
  {
    id: "lotus",
    category: "studio",
    accent: "pink",
    pattern: "bloom",
    palette: ["#ff6fae", "#ffb3cf", "#8b5cf6", "#ffd166"],
    price: 50,
  },
  {
    id: "solar",
    category: "studio",
    accent: "orange",
    pattern: "rays",
    palette: ["#ff9f0a", "#ffd60a", "#ff375f", "#ff6b35"],
    price: 50,
  },
  {
    id: "sunset",
    category: "mood",
    accent: "orange",
    pattern: "horizon",
    palette: ["#ff9f0a", "#ff375f", "#ffd60a", "#ff453a"],
    price: 50,
    exclusiveTrack: { id: "sunset_exclusive", title: "Sunset Dreams", artist: "Aura Exclusives", url: "https://0nlineradio.radioho.st/0r-lo-fi" },
  },
  {
    id: "cyberpunk",
    category: "mood",
    accent: "violet",
    pattern: "grid",
    palette: ["#64d2ff", "#ff2d55", "#bf5af2", "#5e5ce6"],
    price: 50,
    exclusiveTrack: { id: "cyber_exclusive", title: "Neon City", artist: "Aura Exclusives", url: "https://listen.moe/stream" },
  },
  {
    id: "emerald",
    category: "mood",
    accent: "green",
    pattern: "forest",
    palette: ["#30d158", "#63e6be", "#0a84ff", "#ffd60a"],
    price: 50,
    exclusiveTrack: { id: "emerald_exclusive", title: "Nature's Breath", artist: "Aura Exclusives", url: "https://stream.zeno.fm/tabzverz0fctv" },
  },
  {
    id: "sakura",
    category: "mood",
    accent: "pink",
    pattern: "petals",
    palette: ["#ff8fab", "#ffc2d1", "#cdb4db", "#a2d2ff"],
    price: 50,
  },
  {
    id: "obsidian",
    category: "mood",
    accent: "violet",
    pattern: "stars",
    palette: ["#5e5ce6", "#2c2c2e", "#8e8e93", "#64d2ff"],
    price: 50,
    exclusiveTrack: { id: "obsidian_exclusive", title: "Dark Matter", artist: "Aura Exclusives", url: "https://radio.digitalmalayali.in/listen/stream/radio.mp3" },
  },
]);

const THEMES_BY_ID = new Map(AURA_THEMES.map((theme) => [theme.id, theme]));

export const getAuraTheme = (themeId) =>
  THEMES_BY_ID.get(themeId) || AURA_THEMES[0];

export const isAuraThemeId = (themeId) => THEMES_BY_ID.has(themeId);

export const isAuraThemeFree = (themeId) =>
  Boolean(THEMES_BY_ID.get(themeId)?.free);

export const resolveActivePortalTheme = (bio) => {
  const current = bio?.activePortalTheme;
  const legacy = bio?.activeAuraTheme;

  // Records created before activePortalTheme used activeAuraTheme. Mongoose can
  // hydrate the new field with its default before a migration is persisted, so
  // a non-default legacy choice must win over that synthetic default.
  if ((!current || current === "default") && legacy && legacy !== "default") {
    return isAuraThemeId(legacy) ? legacy : "default";
  }

  return isAuraThemeId(current)
    ? current
    : (isAuraThemeId(legacy) ? legacy : "default");
};

export const auraThemeTranslationKey = (themeId, suffix) =>
  `aura.theme${themeId.charAt(0).toUpperCase()}${themeId.slice(1)}${suffix}`;
