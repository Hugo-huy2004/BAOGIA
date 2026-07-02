// Weather engine — powered by Open-Meteo (https://open-meteo.com).
// Chosen because it's modern, fast, free, and needs NO API key (zero setup /
// no secret to leak), returning current conditions + is_day in one call.

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
// No-key IP geolocation fallback (city-level) so a public bio can show local
// weather WITHOUT prompting every visitor for GPS permission.
const IP_GEO_URL = "https://ipwho.is/";

// Sensible default if both GPS and IP lookup fail (Ho Chi Minh City).
export const DEFAULT_COORDS = { lat: 10.7769, lon: 106.7009, city: "TP. Hồ Chí Minh" };

// WMO weather codes -> a small set of visual "conditions" the background renders.
export function codeToCondition(code) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

const CONDITION_LABELS = {
  clear: { day: "Trời quang", night: "Đêm quang đãng", icon: "clear_day" },
  "partly-cloudy": { day: "Ít mây", night: "Đêm nhiều mây thưa", icon: "partly_cloudy_day" },
  cloudy: { day: "Nhiều mây", night: "Đêm nhiều mây", icon: "cloud" },
  fog: { day: "Sương mù", night: "Sương mù", icon: "foggy" },
  rain: { day: "Có mưa", night: "Mưa đêm", icon: "rainy" },
  snow: { day: "Có tuyết", night: "Tuyết đêm", icon: "weather_snowy" },
  thunder: { day: "Giông bão", night: "Giông đêm", icon: "thunderstorm" },
};

export function describeCondition(condition, isDay) {
  const c = CONDITION_LABELS[condition] || CONDITION_LABELS.cloudy;
  return { label: isDay ? c.day : c.night, icon: c.icon };
}

// Flags weather worth warning a user about before they head out.
export function assessWeather(w) {
  if (!w) return { abnormal: false };
  const { code, tempC, windKph, condition } = w;
  const reasons = [];
  if (condition === "thunder") reasons.push("giông sét");
  if ([65, 67, 82].includes(code)) reasons.push("mưa lớn");
  if (condition === "snow") reasons.push("tuyết rơi");
  if (windKph >= 40) reasons.push("gió mạnh");
  if (tempC >= 38) reasons.push("nắng nóng gay gắt");
  if (tempC <= 8) reasons.push("trời rất lạnh");
  const abnormal = reasons.length > 0;
  return {
    abnormal,
    reasons,
    advice: abnormal
      ? `Thời tiết đang bất thường (${reasons.join(", ")}). Hugo Studio nhắc bạn chuẩn bị kỹ trước khi ra ngoài nhé!`
      : "",
  };
}

// Resolve coordinates. `preferGeo` asks the browser for precise GPS (prompts the
// user); otherwise we go straight to silent IP-based lookup. Always resolves —
// falls back to DEFAULT_COORDS — so callers never have to handle "no location".
export async function resolveCoords({ preferGeo = false, timeoutMs = 8000 } = {}) {
  if (preferGeo && typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: timeoutMs,
          maximumAge: 5 * 60 * 1000,
        });
      });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude, city: "", source: "gps" };
    } catch {
      /* fall through to IP */
    }
  }
  try {
    const res = await fetch(IP_GEO_URL, { signal: AbortSignal.timeout?.(6000) });
    const data = await res.json();
    if (data && data.success !== false && typeof data.latitude === "number") {
      return { lat: data.latitude, lon: data.longitude, city: data.city || "", source: "ip" };
    }
  } catch {
    /* fall through to default */
  }
  return { ...DEFAULT_COORDS, source: "default" };
}

// Fetch current weather for coordinates. Returns a normalized object or throws.
export async function fetchWeather(lat, lon) {
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,apparent_temperature` +
    `&wind_speed_unit=kmh&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout?.(8000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  const cur = data.current || {};
  const code = Number(cur.weather_code ?? 3);
  return {
    code,
    condition: codeToCondition(code),
    isDay: cur.is_day === 1,
    tempC: Math.round(cur.temperature_2m ?? 0),
    feelsC: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
    windKph: Math.round(cur.wind_speed_10m ?? 0),
    humidity: Math.round(cur.relative_humidity_2m ?? 0),
    at: Date.now(),
  };
}
