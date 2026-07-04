// Weather preferences — now delegated to the tri-state autoPrefs brain so the
// same on/off getters transparently honour "auto" (Hugo decides by context).
// Kept as thin wrappers so existing consumers (WeatherLayer, alert watcher)
// don't need to change.
import { resolvePref, setPref } from "./autoPrefs";

export const isWeatherBgEnabled = () => resolvePref("weatherBg");
export const setWeatherBgEnabled = (on) => setPref("weatherBg", on ? "on" : "off");

export const isWeatherAlertEnabled = () => resolvePref("weatherAlert");
export const setWeatherAlertEnabled = (on) => setPref("weatherAlert", on ? "on" : "off");
