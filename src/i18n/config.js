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

const FULL_LOCALES = {
  vi: () => import('./locales/vi/translation.json'),
  en: () => import('./locales/en/translation.json'),
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: coreVI },
      en: { translation: coreEN },
    },
    fallbackLng: 'vi',
    debug: false,

    interpolation: {
      escapeValue: false,
    },
  });

const inFlight = new Map();

/**
 * Resolves once the full dictionary for `language` is in i18next.
 *
 * Every screen outside the shell sits behind a `lazy()` route, so App.jsx
 * awaits this alongside the route's own chunk (see `lazyRoute`). Suspense
 * covers both, which is why no screen ever flashes raw `a.b.c` keys.
 */
export function ensureTranslations(language = i18n.language) {
  const lng = String(language || 'vi').split('-')[0];
  const load = FULL_LOCALES[lng] ? lng : 'vi';
  if (i18n.hasResourceBundle(load, 'translation') && inFlight.get(load) === 'done') {
    return Promise.resolve();
  }
  if (!inFlight.has(load)) {
    const p = FULL_LOCALES[load]()
      .then((mod) => {
        i18n.addResourceBundle(load, 'translation', mod.default, true, true);
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
  document.documentElement.lang = String(language || 'vi').split('-')[0];
};

// Kick the fetch immediately: by the time the first route chunk arrives this
// is usually already resolved, so `lazyRoute` waits on nothing.
ensureTranslations(i18n.language);
syncDocumentLanguage(i18n.resolvedLanguage);
i18n.on('languageChanged', (lng) => {
  ensureTranslations(lng);
  syncDocumentLanguage(lng);
});

export default i18n;
