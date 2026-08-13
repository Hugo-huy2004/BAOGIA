export const SUPPORTED_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", locale: "vi-VN" },
  { code: "en", label: "English", locale: "en-US" },
  { code: "zh", label: "简体中文", locale: "zh-CN" },
  { code: "th", label: "ไทย", locale: "th-TH" },
  { code: "ja", label: "日本語", locale: "ja-JP" },
  { code: "ko", label: "한국어", locale: "ko-KR" },
  { code: "id", label: "Bahasa Indonesia", locale: "id-ID" },
  { code: "es", label: "Español", locale: "es-ES" },
  { code: "fr", label: "Français", locale: "fr-FR" },
];

// One app-owned key is the source of truth. `i18nextLng` and `ui-store` are
// kept as migration targets because older releases wrote the preference there.
export const APP_LANGUAGE_STORAGE_KEY = "hugo-language";
export const LEGACY_I18NEXT_LANGUAGE_STORAGE_KEY = "i18nextLng";
export const LEGACY_UI_STORAGE_KEY = "ui-store";
export const DEFAULT_LANGUAGE = "vi";

const LANGUAGE_BY_CODE = new Map(SUPPORTED_LANGUAGES.map((language) => [language.code, language]));

function supportedLanguageCode(language) {
  const code = String(language || "").trim().toLowerCase().split("-")[0];
  return LANGUAGE_BY_CODE.has(code) ? code : null;
}

export function languageCode(language = "en") {
  const code = String(language || "en").toLowerCase().split("-")[0];
  return LANGUAGE_BY_CODE.has(code) ? code : "en";
}

export function localeForLanguage(language = "en") {
  return LANGUAGE_BY_CODE.get(languageCode(language))?.locale || "en-US";
}

export function languageLabel(language = "en") {
  return LANGUAGE_BY_CODE.get(languageCode(language))?.label || "English";
}

function browserStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function legacyUiLanguage(storage) {
  try {
    const value = JSON.parse(storage?.getItem(LEGACY_UI_STORAGE_KEY) || "null");
    return supportedLanguageCode(value?.state?.language || value?.language);
  } catch {
    return null;
  }
}

/** Returns only an explicit preference previously chosen inside the app. */
export function getStoredAppLanguage(storage = browserStorage()) {
  if (!storage) return null;
  try {
    return supportedLanguageCode(storage.getItem(APP_LANGUAGE_STORAGE_KEY))
      || supportedLanguageCode(storage.getItem(LEGACY_I18NEXT_LANGUAGE_STORAGE_KEY))
      || legacyUiLanguage(storage);
  } catch {
    return null;
  }
}

/**
 * Persists a normalized language and mirrors it to keys used by older builds.
 * This lets a deployment migrate preferences without sending users back to
 * their browser language on the first reload.
 */
export function persistAppLanguage(language, storage = browserStorage()) {
  const code = supportedLanguageCode(language) || DEFAULT_LANGUAGE;
  if (!storage) return code;

  try {
    storage.setItem(APP_LANGUAGE_STORAGE_KEY, code);
    storage.setItem(LEGACY_I18NEXT_LANGUAGE_STORAGE_KEY, code);

    const legacyUi = JSON.parse(storage.getItem(LEGACY_UI_STORAGE_KEY) || "null");
    if (legacyUi?.state) {
      storage.setItem(LEGACY_UI_STORAGE_KEY, JSON.stringify({
        ...legacyUi,
        state: { ...legacyUi.state, language: code },
      }));
    }
  } catch {
    // Private browsing and full storage must not prevent a language switch in
    // the current tab; i18next still keeps the in-memory preference.
  }
  return code;
}

export function isVietnameseLanguage(language) {
  return languageCode(language) === "vi";
}
