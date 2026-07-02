import { useEffect, useRef, useState } from "react";
import { resolveCoords, fetchWeather } from "../utils/weather";

// Resolves location (silent IP by default, or GPS when `preferGeo`) then fetches
// current weather and refreshes it on an interval. Weather changes slowly, so
// the default 10-minute poll is plenty and keeps the app light/fast.
export function useWeather({ enabled = true, preferGeo = false, refreshMs = 10 * 60 * 1000 } = {}) {
  const [weather, setWeather] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const coordsRef = useRef(null);

  useEffect(() => {
    if (!enabled) return; // loading already starts false when disabled
    let active = true;

    const load = async () => {
      try {
        if (!coordsRef.current) {
          coordsRef.current = await resolveCoords({ preferGeo });
          if (active) setCoords(coordsRef.current);
        }
        const w = await fetchWeather(coordsRef.current.lat, coordsRef.current.lon);
        if (active) { setWeather(w); setError(null); }
      } catch (e) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    // Re-check when the app comes back to the foreground (weather may have moved on).
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, preferGeo, refreshMs]);

  return { weather, coords, loading, error };
}
