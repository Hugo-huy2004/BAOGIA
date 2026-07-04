// autoPrefs — tri-state, automation-first preferences.
//
// Philosophy shift: instead of forcing the user to flip binary on/off switches,
// every preference defaults to "auto" and Hugo decides intelligently from
// context (time of day, weather, granted permissions, device). The user only
// overrides ("on"/"off") when they truly want to; most never touch it.
//
//   getPref(key)            → 'auto' | 'on' | 'off'   (default 'auto')
//   setPref(key, value)     → persist a user choice
//   resolvePref(key, ctx)   → boolean effective value (auto rules applied)
//
// Consumers should read resolvePref(...) (or the delegating helpers in
// weatherPrefs/notificationSoundPref/floatingWidgetPref) — never the raw store.

const STORE_KEY = "hugo_auto_prefs_v1";
const VALID = new Set(["auto", "on", "off"]);

export const AUTO_PREF_KEYS = ["push", "sound", "weatherBg", "weatherAlert", "donation"];

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }
  catch { return {}; }
}
function writeStore(obj) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

export function getPref(key) {
  const v = readStore()[key];
  return VALID.has(v) ? v : "auto";
}

export function setPref(key, value) {
  if (!VALID.has(value)) return;
  const s = readStore();
  s[key] = value;
  writeStore(s);
  // Let live consumers (WeatherLayer, sound, widgets) react immediately.
  try { window.dispatchEvent(new CustomEvent("hugo:prefs-changed", { detail: { key, value } })); } catch { /* ignore */ }
}

// ── Context-aware "auto" rules ───────────────────────────────────────────────
const hour = () => new Date().getHours();
const isQuietHours = () => { const h = hour(); return h >= 22 || h < 7; }; // 22:00–07:00

// ctx may carry { isDay, condition, hasNotifPermission, hasLocation }.
const AUTO_RULES = {
  // Sound on by default, but muted during quiet night hours.
  sound: () => !isQuietHours(),
  // Weather background: alive during the day, or any time the weather is
  // visually interesting (rain/storm/snow) — off on plain nights to save power.
  weatherBg: (ctx = {}) => {
    if (ctx.condition && ["rain", "thunder", "snow"].includes(ctx.condition)) return true;
    return ctx.isDay !== false;
  },
  // Alerts auto-on only when the signals they need are actually available.
  weatherAlert: (ctx = {}) => ctx.hasNotifPermission !== false && ctx.hasLocation !== false,
  // Push follows the browser permission: auto = on iff already granted.
  push: (ctx = {}) => ctx.hasNotifPermission === true,
  // The donation widget is opt-in by nature — auto keeps it quiet.
  donation: () => false,
};

export function resolvePref(key, ctx = {}) {
  const pref = getPref(key);
  if (pref === "on") return true;
  if (pref === "off") return false;
  const rule = AUTO_RULES[key];
  return rule ? !!rule(ctx) : true;
}
