// Viewer-side preferences for the weather experience (localStorage, per device).
// Both default ON for the background (so bios get the upgrade out of the box) and
// OFF for alerts (which need a GPS permission the user should opt into).

const BG_KEY = "hugo_weather_bg";       // animated weather background on/off
const ALERT_KEY = "hugo_weather_alert"; // abnormal-weather alerts on/off

const read = (key, dflt) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? dflt : v === "1";
  } catch {
    return dflt;
  }
};
const write = (key, on) => {
  try { localStorage.setItem(key, on ? "1" : "0"); } catch { /* ignore */ }
};

export const isWeatherBgEnabled = () => read(BG_KEY, true);
export const setWeatherBgEnabled = (on) => write(BG_KEY, on);

export const isWeatherAlertEnabled = () => read(ALERT_KEY, false);
export const setWeatherAlertEnabled = (on) => write(ALERT_KEY, on);
