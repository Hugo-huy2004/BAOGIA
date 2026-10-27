// Notification sound — delegated to the tri-state autoPrefs brain. "auto" mutes
// during quiet night hours (22:00–07:00) automatically; users can force on/off.
// Same getter/setter names so useNotifications.js needs no change.
import { resolvePref } from "./autoPrefs";

export function isNotificationSoundEnabled() {
  return resolvePref("sound");
}

