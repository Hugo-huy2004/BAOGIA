// Theme registry for each language edition.
// Colors are 100% synchronized with system design tokens (hsl(var(--primary)), etc.)
// Language editions retain appropriate system typography without color discrepancies.

const SYSTEM_ACCENT = "hsl(var(--primary))";
const SYSTEM_ACCENT_FG = "hsl(var(--primary-foreground))";
const SYSTEM_SURFACE = "hsl(var(--card))";
const SYSTEM_SURFACE_ALT = "hsl(var(--muted))";

const CULTURAL_THEMES = {
  vi: {
    name: "Việt Nam",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "inherit",
    heroOpacity: 0,
  },
  en: {
    name: "United States",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "inherit",
    heroOpacity: 0,
  },
  zh: {
    name: "中国",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'Noto Sans SC', 'Source Han Sans SC', system-ui, sans-serif",
    heroOpacity: 0,
  },
  th: {
    name: "ประเทศไทย",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "'Noto Sans Thai', 'Sarabun', sans-serif",
    heroOpacity: 0,
  },
  ja: {
    name: "日本",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "'Hiragino Sans', 'Meiryo', 'Noto Sans JP', sans-serif",
    heroOpacity: 0,
  },
  ko: {
    name: "대한민국",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
    heroOpacity: 0,
  },
  id: {
    name: "Indonesia",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "inherit",
    heroOpacity: 0,
  },
  es: {
    name: "España",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "inherit",
    heroOpacity: 0,
  },
  fr: {
    name: "France",
    accent: SYSTEM_ACCENT,
    accentFg: SYSTEM_ACCENT_FG,
    surface: SYSTEM_SURFACE,
    surfaceAlt: SYSTEM_SURFACE_ALT,
    heroGradient: "transparent",
    pattern: "",
    fontFamily: "inherit",
    heroOpacity: 0,
  },
};

export default CULTURAL_THEMES;

// Helper: get theme for a language code, fallback to 'en'
export function getCulturalTheme(lang = "en") {
  return CULTURAL_THEMES[lang] || CULTURAL_THEMES.en;
}
