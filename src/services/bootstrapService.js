import { BASE_URL } from './api';

const BOOTSTRAP_CACHE_KEY = 'price-doc-eager-bootstrap';
const BOOTSTRAP_ETAG_KEY = 'price-doc-eager-etag';
const scopedKey = (base, email) => {
  const account = String(email || '').trim().toLowerCase();
  return account ? `${base}:${account}` : null;
};

/**
 * Reads local cached eager bootstrap data synchronously (Instant UI boot in <100ms)
 */
export function getLocalBootstrapCache(email) {
  try {
    const key = scopedKey(BOOTSTRAP_CACHE_KEY, email);
    if (!key) return null;
    // Remove the pre-account-scoping cache so switching accounts can never
    // briefly paint another member's profile.
    localStorage.removeItem(BOOTSTRAP_CACHE_KEY);
    localStorage.removeItem(BOOTSTRAP_ETAG_KEY);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const cachedEmail = String(data?.bio?.email || data?.bio?.contactEmail || '').trim().toLowerCase();
    return cachedEmail === String(email).trim().toLowerCase() ? data : null;
  } catch (err) {
    console.warn('[Bootstrap Cache Read Error]', err);
    return null;
  }
}

/**
 * Saves fresh eager bootstrap data to local storage
 */
export function setLocalBootstrapCache(data, etag = null, email) {
  try {
    const account = email || data?.bio?.email || data?.bio?.contactEmail;
    const cacheKey = scopedKey(BOOTSTRAP_CACHE_KEY, account);
    const etagKey = scopedKey(BOOTSTRAP_ETAG_KEY, account);
    if (!cacheKey || !etagKey) return;
    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
    if (etag) {
      localStorage.setItem(etagKey, etag);
    }
  } catch (err) {
    console.warn('[Bootstrap Cache Write Error]', err);
  }
}

/**
 * Fetches fresh eager bootstrap data from server with ETag revalidation
 */
export async function fetchServerBootstrapData({ signal, email } = {}) {
  try {
    const etagKey = scopedKey(BOOTSTRAP_ETAG_KEY, email);
    const etag = etagKey ? localStorage.getItem(etagKey) : null;
    const headers = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(`${BASE_URL}/bios/me/bootstrap`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal,
    });

    if (response.status === 304) {
      const cached = getLocalBootstrapCache(email);
      if (cached) return cached;
      throw new Error('Bootstrap cache is missing');
    }
    if (!response.ok) {
      const error = new Error(`Bootstrap API failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (data?.bio) {
      setLocalBootstrapCache(data, response.headers.get('etag'), email);
      return data;
    }
    return getLocalBootstrapCache(email);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    // If HTTP 304 or network offline, return cached data
    const cached = getLocalBootstrapCache(email);
    if (cached) return cached;
    throw err;
  }
}
