import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Both locales used to be static imports: 366 KB of translation JSON in the
// entry chunk, parsed before first paint, on every load — 41% of the entry,
// when nobody ever needs two languages at once and the eager shell (navbar +
// footer, the only things that render before a route resolves) uses 0.8 KB of
// it.
//
// So the shell's keys ship eagerly and everything else is fetched per
// language. `core.json` is a generated subset of `translation.json`, which
// stays the single canonical file and overwrites core when it lands — if the
// two ever drift, the full file wins.
import coreVI from './locales/vi/core.json';
import coreEN from './locales/en/core.json';
import { registerJoyFormat } from '../lib/joyDisplay';
import {
  APP_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  getStoredAppLanguage,
  languageCode,
  persistAppLanguage,
} from './languages';
import { MEMBER_TODAY_TRANSLATIONS } from './locales/memberTodayTranslations';
import { MEMBER_APP_TRANSLATIONS } from './locales/memberAppTranslations';
import { ensureLanguageFont } from './languageFont';

const FULL_LOCALES = {
  vi: () => import('./locales/vi/translation.json'),
  en: () => import('./locales/en/translation.json'),
  zh: () => import('./locales/zh/translation.json'),
  th: () => import('./locales/th/translation.json'),
  ja: () => import('./locales/ja/translation.json'),
  ko: () => import('./locales/ko/translation.json'),
  id: () => import('./locales/id/translation.json'),
  es: () => import('./locales/es/translation.json'),
  fr: () => import('./locales/fr/translation.json'),
};

const resources = Object.fromEntries(
  // i18next treats a completely empty bundle as unavailable and immediately
  // resolves the language to the fallback. A tiny internal sentinel keeps the
  // detected/saved language active until its lazy dictionary is attached.
  SUPPORTED_LANGUAGES.map(({ code }) => [code, { translation: { __locale: code } }]),
);
resources.vi.translation = coreVI;
resources.en.translation = coreEN;

const storedLanguage = getStoredAppLanguage();
if (storedLanguage) persistAppLanguage(storedLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ...(storedLanguage ? { lng: storedLanguage } : {}),
    fallbackLng: ['en', 'vi'],
    supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: false,

    detection: {
      // Never let an old cookie or a stray `?lng=en` overwrite the choice the
      // user made in Settings. Browser language is only consulted once, when
      // this app has no saved preference at all.
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: APP_LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: languageCode,
    },

    interpolation: {
      escapeValue: false,
    },
  });

// "{{amount, joy}}" trong chuỗi dịch → số tiền viết theo ĐƠN VỊ CỦA TÀI KHOẢN.
// Đăng ký sau init vì bộ định dạng chỉ tồn tại khi i18next đã dựng xong service.
registerJoyFormat(i18n);

const inFlight = new Map();

/**
 * Resolves once the full dictionary for `language` is in i18next.
 *
 * Every screen outside the shell sits behind a `lazy()` route, so App.jsx
 * awaits this alongside the route's own chunk (see `lazyRoute`). Suspense
 * covers both, which is why no screen ever flashes raw `a.b.c` keys.
 */
export function ensureTranslations(language = i18n.language) {
  const load = languageCode(language);
  if (i18n.hasResourceBundle(load, 'translation') && inFlight.get(load) === 'done') {
    return Promise.resolve();
  }
  if (!inFlight.has(load)) {
    // Partial locale packs deliberately fall back to the complete English
    // dictionary. Load that dictionary first so a language switch never
    // exposes raw translation keys while the fallback bundle is still small.
    const fallbackReady = ['vi', 'en'].includes(load)
      ? Promise.resolve()
      : ensureTranslations('en');
    const p = fallbackReady
      .then(() => FULL_LOCALES[load]())
      .then((mod) => {
        const appCopy = MEMBER_APP_TRANSLATIONS[load];
        const todayCopy = MEMBER_TODAY_TRANSLATIONS[load];
        const dictionary = {
          ...mod.default,
          ...(appCopy ? {
            utilities: {
              ...(mod.default.utilities || {}),
              categories: appCopy.categories,
              badges: appCopy.badges,
              catalog: {
                ...(mod.default.utilities?.catalog || {}),
                ...appCopy.catalog,
              },
            },
          } : {}),
          ...(todayCopy ? {
            memberPortal: {
              ...(mod.default.memberPortal || {}),
              today: todayCopy,
            },
          } : {}),
        };
        i18n.addResourceBundle(load, 'translation', dictionary, true, true);
        inFlight.set(load, 'done');
        // i18next resolved this language against the core bundle already;
        // nudge it so mounted components pick up the real strings.
        if (i18n.resolvedLanguage === load || i18n.language === load) {
          i18n.changeLanguage(load);
        }
      })
      .catch(() => {
        // Leave the shell keys in place rather than blocking the route.
        inFlight.delete(load);
      });
    inFlight.set(load, p);
    return p;
  }
  const v = inFlight.get(load);
  return v === 'done' ? Promise.resolve() : v;
}

const syncDocumentLanguage = (language) => {
  if (typeof document === 'undefined') return;
  const code = languageCode(language);
  document.documentElement.lang = code;
  // Font viết tay của th/zh/ja/ko nạp TẠI ĐÂY, không nằm sẵn trong index.html.
  // Đây là chỗ duy nhất biết ngôn ngữ hiện tại ở cả lúc khởi động lẫn lúc đổi.
  ensureLanguageFont(code);
};

// Kick the fetch immediately: by the time the first route chunk arrives this
// is usually already resolved, so `lazyRoute` waits on nothing.
ensureTranslations(i18n.language);
syncDocumentLanguage(i18n.resolvedLanguage);
i18n.on('languageChanged', (lng) => {
  persistAppLanguage(lng);
  ensureTranslations(lng);
  syncDocumentLanguage(lng);
});

/** The only language-changing entry point used by application UI. */
export async function changeAppLanguage(language) {
  const code = languageCode(language);
  await ensureTranslations(code);
  persistAppLanguage(code);
  await i18n.changeLanguage(code);
  // Thông báo đẩy được máy chủ soạn sẵn theo ngôn ngữ đã đăng ký của thiết bị,
  // nên đổi ngôn ngữ ở đây phải báo lên server. Nạp động để phần push không bị
  // kéo vào bundle chính chỉ vì i18n.
  import("../utils/webPushHelper")
    .then(({ webPushHelper }) => webPushHelper.syncLanguage())
    .catch(() => {});
  return code;
}

export default i18n;
