// Cultural theme registry for each language edition.
// Each theme defines CSS custom properties and a lightweight SVG pattern overlay.
// NO external assets — everything is inline and <1KB per language.
// Applied via `data-lang="xx"` attribute on .today-news-shell.

const CULTURAL_THEMES = {
  vi: {
    // Vietnam — giấy đỏ, trống đồng, hoa sen
    name: "Việt Nam",
    accent: "#C41E3A",
    accentFg: "#FFFFFF",
    surface: "#FFF8E7",        // giấy dó
    surfaceAlt: "#F5E6C8",
    heroGradient: "linear-gradient(135deg, #FFF8E7 0%, #FDE8C8 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='%23C41E3A' stroke-width='0.5' opacity='0.08'/%3E%3Ccircle cx='30' cy='30' r='18' fill='none' stroke='%23C41E3A' stroke-width='0.3' opacity='0.06'/%3E%3Ccircle cx='30' cy='30' r='8' fill='none' stroke='%23C41E3A' stroke-width='0.3' opacity='0.05'/%3E%3C/svg%3E`,
    // trống đồng circles — concentric rings pattern
    fontFamily: "'Newsreader', 'Noto Serif', Georgia, serif",
    heroOpacity: 0.06,
  },
  en: {
    // USA — navy editorial, clean broadsheet
    name: "United States",
    accent: "#1B365D",
    accentFg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F4F5F7",
    heroGradient: "linear-gradient(135deg, #FFFFFF 0%, #F0F2F5 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cline x1='0' y1='20' x2='40' y2='20' stroke='%231B365D' stroke-width='0.4' opacity='0.06'/%3E%3C/svg%3E`,
    // double-rule editorial lines
    fontFamily: "'Newsreader', 'Noto Serif', Georgia, serif",
    heroOpacity: 0.04,
  },
  zh: {
    // China — đỏ son, mây祥云
    name: "中国",
    accent: "#DE2910",
    accentFg: "#FFFFFF",
    surface: "#FAFAF5",
    surfaceAlt: "#F0EDE5",
    heroGradient: "linear-gradient(135deg, #FAFAF5 0%, #F5F0E8 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 10 Q55 10 55 25 Q55 40 40 40 Q25 40 25 25 Q25 10 40 10Z' fill='none' stroke='%23DE2910' stroke-width='0.4' opacity='0.05'/%3E%3Cpath d='M0 50 Q15 50 15 65 Q15 80 0 80' fill='none' stroke='%23DE2910' stroke-width='0.3' opacity='0.04'/%3E%3Cpath d='M80 50 Q65 50 65 65 Q65 80 80 80' fill='none' stroke='%23DE2910' stroke-width='0.3' opacity='0.04'/%3E%3C/svg%3E`,
    //祥云 cloud motif
    fontFamily: "'Noto Serif SC', 'Noto Serif CJK SC', 'Source Han Serif SC', serif",
    heroOpacity: 0.05,
  },
  th: {
    // Thailand — vàng hoàng gia, hoa sen
    name: "ประเทศไทย",
    accent: "#241D4F",
    accentFg: "#F4C430",
    surface: "#FFFEFB",
    surfaceAlt: "#FBF8F0",
    heroGradient: "linear-gradient(135deg, #FFFEFB 0%, #F9F5E8 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 5 L35 25 L55 25 L38 35 L45 55 L30 42 L15 55 L22 35 L5 25 L25 25Z' fill='none' stroke='%23241D4F' stroke-width='0.35' opacity='0.04'/%3E%3C/svg%3E`,
    // lotus star
    fontFamily: "'Noto Sans Thai', 'Sarabun', sans-serif",
    heroOpacity: 0.04,
  },
  ja: {
    // Japan — đỏ crimson, sóng青海波
    name: "日本",
    accent: "#BC002D",
    accentFg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F8F6F4",
    heroGradient: "linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='46'%3E%3Cpath d='M0 46 Q20 36 40 46 Q60 36 80 46' fill='none' stroke='%23BC002D' stroke-width='0.4' opacity='0.05'/%3E%3Cpath d='M0 36 Q20 26 40 36 Q60 26 80 36' fill='none' stroke='%23BC002D' stroke-width='0.3' opacity='0.04'/%3E%3Cpath d='M0 26 Q20 16 40 26 Q60 16 80 26' fill='none' stroke='%23BC002D' stroke-width='0.25' opacity='0.03'/%3E%3C/svg%3E`,
    //青海波 seigaiha waves
    fontFamily: "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
    heroOpacity: 0.04,
  },
  ko: {
    // Korea — xanh dương, ngũ cung
    name: "대한민국",
    accent: "#003478",
    accentFg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F7FA",
    heroGradient: "linear-gradient(135deg, #FFFFFF 0%, #F0F4F8 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,14 38,32 20,44 2,32 2,14' fill='none' stroke='%23003478' stroke-width='0.4' opacity='0.05'/%3E%3C/svg%3E`,
    // pentagon
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
    heroOpacity: 0.04,
  },
  id: {
    // Indonesia — đỏ + vàng batik
    name: "Indonesia",
    accent: "#CE1126",
    accentFg: "#FFFFFF",
    surface: "#FFFEF8",
    surfaceAlt: "#F8F3E8",
    heroGradient: "linear-gradient(135deg, #FFFEF8 0%, #F5EFE0 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='2' y='2' width='20' height='20' rx='2' fill='none' stroke='%23CE1126' stroke-width='0.4' opacity='0.05'/%3E%3Cline x1='12' y1='2' x2='12' y2='22' stroke='%23CE1126' stroke-width='0.3' opacity='0.04'/%3E%3Cline x1='2' y1='12' x2='22' y2='12' stroke='%23CE1126' stroke-width='0.3' opacity='0.04'/%3E%3C/svg%3E`,
    // batik grid
    fontFamily: "'Noto Sans', 'Noto Sans Latin', sans-serif",
    heroOpacity: 0.04,
  },
  es: {
    // Spain — đỏ son + vàng, gạch men Moorish
    name: "España",
    accent: "#AA151B",
    accentFg: "#F1BF00",
    surface: "#FFFDF5",
    surfaceAlt: "#FAF5E8",
    heroGradient: "linear-gradient(135deg, #FFFDF5 0%, #F8F0DD 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 0 L48 24 L24 48 L0 24Z' fill='none' stroke='%23AA151B' stroke-width='0.35' opacity='0.05'/%3E%3Ccircle cx='24' cy='24' r='8' fill='none' stroke='%23AA151B' stroke-width='0.25' opacity='0.04'/%3E%3C/svg%3E`,
    // diamond + circle Moorish tile
    fontFamily: "'Newsreader', 'Noto Serif', Georgia, serif",
    heroOpacity: 0.04,
  },
  fr: {
    // France — bleu royal, Art Nouveau curves
    name: "France",
    accent: "#002395",
    accentFg: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F6F8",
    heroGradient: "linear-gradient(135deg, #FFFFFF 0%, #F0F2F6 100%)",
    pattern: `%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 60 Q30 40 60 60' fill='none' stroke='%23002395' stroke-width='0.4' opacity='0.05'/%3E%3Cpath d='M0 45 Q30 25 60 45' fill='none' stroke='%23002395' stroke-width='0.3' opacity='0.04'/%3E%3C/svg%3E`,
    // Art Nouveau curves
    fontFamily: "'Newsreader', 'Noto Serif', Georgia, serif",
    heroOpacity: 0.04,
  },
};

export default CULTURAL_THEMES;

// Helper: get theme for a language code, fallback to 'en'
export function getCulturalTheme(lang = "en") {
  return CULTURAL_THEMES[lang] || CULTURAL_THEMES.en;
}
