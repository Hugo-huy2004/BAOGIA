// Public frontend entrypoint. The actual catalog lives in shared/ so the
// gallery and the API always agree on ids, prices and which themes are free.
export {
  AURA_THEMES,
  auraThemeTranslationKey,
  getAuraTheme,
  isAuraThemeFree,
  isAuraThemeId,
  resolveActivePortalTheme,
} from "../../shared/auraThemes.js";
