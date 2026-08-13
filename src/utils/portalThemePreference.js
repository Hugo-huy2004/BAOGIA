import { isAuraThemeId } from "../data/auraThemes";

const STORAGE_PREFIX = "hugo:portal-theme:";
const PENDING_PREFIX = "hugo:portal-theme-pending:";

const storageForBrowser = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
};

// Keep an email address out of the localStorage key while still scoping the
// cosmetic preference per member on shared devices. This is not a security
// hash; the selected theme itself is non-sensitive UI state.
const subjectToken = (subject) => {
  const value = String(subject || "guest").trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const preferenceKey = (subject) => `${STORAGE_PREFIX}${subjectToken(subject)}`;
const pendingKey = (subject) => `${PENDING_PREFIX}${subjectToken(subject)}`;

export function getPortalThemePreference(subject, storage = storageForBrowser()) {
  if (!storage || !subject) return null;
  try {
    const themeId = storage.getItem(preferenceKey(subject));
    return isAuraThemeId(themeId) ? themeId : null;
  } catch {
    return null;
  }
}

export function setPortalThemePreference(subject, themeId, storage = storageForBrowser()) {
  if (!storage || !subject || !isAuraThemeId(themeId)) return false;
  try {
    storage.setItem(preferenceKey(subject), themeId);
    return true;
  } catch {
    return false;
  }
}

export function getPendingPortalThemeSync(subject, storage = storageForBrowser()) {
  if (!storage || !subject) return null;
  try {
    const themeId = storage.getItem(pendingKey(subject));
    return isAuraThemeId(themeId) ? themeId : null;
  } catch {
    return null;
  }
}

export function setPendingPortalThemeSync(subject, themeId, storage = storageForBrowser()) {
  if (!storage || !subject || !isAuraThemeId(themeId)) return false;
  try {
    storage.setItem(pendingKey(subject), themeId);
    return true;
  } catch {
    return false;
  }
}

export function clearPendingPortalThemeSync(subject, storage = storageForBrowser()) {
  if (!storage || !subject) return false;
  try {
    storage.removeItem(pendingKey(subject));
    return true;
  } catch {
    return false;
  }
}
