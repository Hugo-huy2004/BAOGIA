// Lightweight localStorage cache for the member's own Bio document. Lets the
// portal paint instantly from the last-known-good copy on mount/reload
// instead of always showing a loading spinner while GET /bios/me resolves —
// the real fetch still runs in the background and overwrites this as soon as
// it returns, so mutations (save/delete/redeem) always hit the real API and
// the cache is just a same-tick render shortcut, never the source of truth.
const PREFIX = 'hugo_bio_cache_';

export function getCachedBio(email) {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(PREFIX + email);
    if (!raw) return null;
    const { bio } = JSON.parse(raw);
    return bio || null;
  } catch (_) {
    return null;
  }
}

export function setCachedBio(email, bio) {
  if (!email || !bio) return;
  try {
    localStorage.setItem(PREFIX + email, JSON.stringify({ bio, cachedAt: Date.now() }));
  } catch (_) {
    // localStorage full/unavailable (private browsing) — just skip caching.
  }
}

export function clearCachedBio(email) {
  if (!email) return;
  try { localStorage.removeItem(PREFIX + email); } catch (_) { /* ignore */ }
}
