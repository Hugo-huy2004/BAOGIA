import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AURA_THEMES, auraThemeTranslationKey } from "../../data/auraThemes";
import { isWeatherBgEnabled, setWeatherBgEnabled } from "../../utils/weatherPrefs";
import "../../styles/auraThemeGallery.css";

const FILTERS = ["all", "free", "studio", "identity", "mood"];

function ThemePreview({ theme, active }) {
  return (
    <div
      className="aura-theme-preview"
      data-pattern={theme.pattern}
      style={{
        "--aura-1": theme.palette[0],
        "--aura-2": theme.palette[1],
        "--aura-3": theme.palette[2],
        "--aura-4": theme.palette[3],
      }}
    >
      <span /><span /><span />
      {active ? (
        <strong><span className="material-symbols-outlined">check</span></strong>
      ) : null}
    </div>
  );
}

export default function ThemeGallery({
  activeThemeId,
  isThemeOwned,
  getExpiryText,
  onApply,
  onRent,
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [applying, setApplying] = useState("");
  const [weatherOn, setWeatherOn] = useState(() => isWeatherBgEnabled());

  const visibleThemes = useMemo(
    () => AURA_THEMES.filter((theme) => filter === "all" || theme.category === filter || (filter === "free" && theme.free)),
    [filter],
  );

  const applyTheme = async (themeId) => {
    setApplying(themeId);
    try {
      await onApply(themeId);
    } finally {
      setApplying("");
    }
  };

  const toggleWeather = () => {
    const next = !weatherOn;
    setWeatherOn(next);
    setWeatherBgEnabled(next);
    window.dispatchEvent(new CustomEvent("hugo:weather-bg-changed", { detail: { enabled: next } }));
  };

  return (
    <section className="aura-gallery" aria-labelledby="aura-gallery-title">
      <header className="aura-gallery-hero">
        <div>
          <span className="aura-gallery-kicker">{t("aura.galleryKicker")}</span>
          <h2 id="aura-gallery-title">{t("aura.galleryTitle")}</h2>
          <p>{t("aura.galleryDescription")}</p>
        </div>
        <button
          type="button"
          className={`aura-weather-toggle ${weatherOn ? "is-on" : ""}`}
          aria-pressed={weatherOn}
          onClick={toggleWeather}
        >
          <span className="material-symbols-outlined">partly_cloudy_day</span>
          <span><strong>{t("aura.liveWeather")}</strong><small>{weatherOn ? t("aura.weatherOn") : t("aura.weatherOff")}</small></span>
          <i aria-hidden="true"><b /></i>
        </button>
      </header>

      <div className="aura-gallery-filters" role="group" aria-label={t("aura.filterLabel")}>
        {FILTERS.map((id) => (
          <button
            type="button"
            key={id}
            className={filter === id ? "is-active" : ""}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {t(`aura.filter${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
          </button>
        ))}
      </div>

      <div className="aura-theme-grid">
        {visibleThemes.map((theme) => {
          const active = activeThemeId === theme.id;
          const owned = isThemeOwned(theme.id);
          const expiry = getExpiryText(theme.id);
          return (
            <article className={`aura-theme-card ${active ? "is-active" : ""}`} key={theme.id}>
              <ThemePreview theme={theme} active={active} />
              <div className="aura-theme-copy">
                <div className="aura-theme-labels">
                  <span>{theme.free ? t("aura.badgeFree") : theme.category === "studio" ? t("aura.badgeStudio") : t("aura.badgeAura")}</span>
                  {theme.id === "pride" ? <span className="is-pride">{t("aura.badgeRainbow")}</span> : null}
                  {expiry ? <span className="is-owned">{expiry}</span> : null}
                </div>
                <h3>{t(auraThemeTranslationKey(theme.id, "Name"))}</h3>
                <p>{t(auraThemeTranslationKey(theme.id, "Desc"))}</p>
                <div className="aura-theme-footer">
                  <div className="aura-theme-swatches" aria-hidden="true">
                    {theme.palette.map((color) => <i key={color} style={{ background: color }} />)}
                  </div>
                  {active ? (
                    <span className="aura-theme-active-label"><span className="material-symbols-outlined">check_circle</span>{t("aura.themeUsed")}</span>
                  ) : owned ? (
                    <button type="button" disabled={Boolean(applying)} onClick={() => applyTheme(theme.id)}>
                      {applying === theme.id ? t("aura.applying") : t("aura.themeApply")}
                    </button>
                  ) : (
                    <button type="button" className="is-premium" onClick={() => onRent(theme)}>
                      {t("aura.themeRentCost", { price: theme.price })}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
