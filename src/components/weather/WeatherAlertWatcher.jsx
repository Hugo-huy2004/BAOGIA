import React, { useEffect, useState } from "react";
import { useWeather } from "../../hooks/useWeather";
import { assessWeather, describeCondition } from "../../utils/weather";
import { isWeatherAlertEnabled } from "../../utils/weatherPrefs";

const LAST_ALERT_KEY = "hugo_weather_last_alert";
const THROTTLE_MS = 3 * 60 * 60 * 1000; // at most one alert every 3 hours

// Watches the member's OWN weather (precise GPS) and, when it turns abnormal,
// nudges them to prepare before going out — both as a phone notification (works
// while the app/PWA is open) and an in-app banner. Background push for when the
// app is CLOSED is a server job (see the follow-up), not this component.
export default function WeatherAlertWatcher() {
  const enabled = isWeatherAlertEnabled();
  const { weather } = useWeather({ enabled, preferGeo: true, refreshMs: 15 * 60 * 1000 });
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!enabled || !weather) return;
    const { abnormal, advice } = assessWeather(weather);
    if (!abnormal) return;

    let last = 0;
    try { last = Number(localStorage.getItem(LAST_ALERT_KEY)) || 0; } catch { /* ignore */ }
    if (Date.now() - last < THROTTLE_MS) return;
    try { localStorage.setItem(LAST_ALERT_KEY, String(Date.now())); } catch { /* ignore */ }

    // Fire a system notification if the user granted permission.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const { label } = describeCondition(weather.condition, weather.isDay);
      try {
        new Notification("Hugo Studio · Thời tiết", {
          body: `${label} ${weather.tempC}°C — ${advice}`,
          icon: "/pwa-192x192.png",
          tag: "hugo-weather",
        });
      } catch { /* ignore */ }
    }

    // Surface the in-app banner on the next tick (not synchronously in the effect).
    const id = setTimeout(() => setBanner(advice), 0);
    return () => clearTimeout(id);
  }, [enabled, weather]);

  if (!banner) return null;

  return (
    <div
      className="fixed left-1/2 z-[200] w-[calc(100vw-24px)] max-w-md -translate-x-1/2"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-300/40 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur dark:bg-[#15151f]/95">
        <span className="material-symbols-outlined shrink-0 text-2xl text-indigo-500">storm</span>
        <p className="flex-1 text-xs font-semibold leading-snug text-zinc-800 dark:text-zinc-100">{banner}</p>
        <button onClick={() => setBanner(null)} aria-label="Đóng" className="shrink-0 text-zinc-400 hover:text-zinc-600">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
