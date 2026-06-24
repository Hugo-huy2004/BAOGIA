// Whether incoming notifications should play a sound — checked by
// useNotifications.js before playing the chime, set by MemberSettingsTab.jsx.
// Defaults to on (most members expect sound unless they turn it off).
const KEY = "hugo_notification_sound";

export function isNotificationSoundEnabled() {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch (_) {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled) {
  try {
    localStorage.setItem(KEY, enabled ? "1" : "0");
  } catch (_) {}
}
