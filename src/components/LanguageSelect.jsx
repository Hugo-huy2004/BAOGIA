import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../i18n/config";
import { SUPPORTED_LANGUAGES, languageCode } from "../i18n/languages";

export default function LanguageSelect({ compact = false, className = "", onChange }) {
  const { t, i18n } = useTranslation();
  const [changing, setChanging] = useState(false);
  const currentLanguage = languageCode(i18n.resolvedLanguage || i18n.language);

  const selectLanguage = async (event) => {
    const nextLanguage = event.target.value;
    if (nextLanguage === currentLanguage) return;
    setChanging(true);
    try {
      await changeAppLanguage(nextLanguage);
      onChange?.(nextLanguage);
    } finally {
      setChanging(false);
    }
  };

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      {!compact && (
        <span className="material-symbols-outlined pointer-events-none absolute left-3 z-10 text-base" aria-hidden="true">
          language
        </span>
      )}
      <span className="sr-only">{t("navbar.language")}</span>
      <select
        value={currentLanguage}
        onChange={selectLanguage}
        disabled={changing}
        aria-label={t("navbar.chooseLanguage")}
        className={compact
          ? "h-8 min-w-[3.25rem] cursor-pointer appearance-none rounded-full bg-muted/75 px-2 text-center text-[10px] font-bold uppercase text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          : "min-h-11 w-full cursor-pointer appearance-none rounded-[1rem] border border-border/60 bg-card/75 py-2 pl-10 pr-8 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {compact ? language.code.toUpperCase() : language.label}
          </option>
        ))}
      </select>
      {!compact && (
        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 text-base text-muted-foreground" aria-hidden="true">
          expand_more
        </span>
      )}
    </label>
  );
}
