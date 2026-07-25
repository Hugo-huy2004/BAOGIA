import { apiFetch } from './api';

const BOOTSTRAP_CACHE_KEY = 'price-doc-eager-bootstrap';
const BOOTSTRAP_ETAG_KEY = 'price-doc-eager-etag';

/**
 * Reads local cached eager bootstrap data synchronously (Instant UI boot in <100ms)
 */
export function getLocalBootstrapCache() {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Bootstrap Cache Read Error]', err);
    return null;
  }
}

/**
 * Saves fresh eager bootstrap data to local storage
 */
export function setLocalBootstrapCache(data, etag = null) {
  try {
    if (data) {
      localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(data));
    }
    if (etag) {
      localStorage.setItem(BOOTSTRAP_ETAG_KEY, etag);
    }
  } catch (err) {
    console.warn('[Bootstrap Cache Write Error]', err);
  }
}

/**
 * Fetches fresh eager bootstrap data from server with ETag revalidation
 */
export async function fetchServerBootstrapData() {
  try {
    const etag = localStorage.getItem(BOOTSTRAP_ETAG_KEY);
    const headers = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const data = await apiFetch('/bios/me/bootstrap', {
      method: 'GET',
      headers
    });

    if (data && data.bio) {
      setLocalBootstrapCache(data);
      return { data, notModified: false };
    }
    return { data: getLocalBootstrapCache(), notModified: true };
  } catch (err) {
    // If HTTP 304 or network offline, return cached data
    const cached = getLocalBootstrapCache();
    if (cached) return { data: cached, notModified: true };
    throw err;
  }
}
