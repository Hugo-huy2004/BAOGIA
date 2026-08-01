/**
 * Standardized SWR Fetcher for Hugo Studio Portal.
 * Uses window.fetch (which is auto-authenticated via apiAuthInterceptor)
 * and handles HTTP status codes properly for SWR error boundaries.
 */

export async function swrFetcher(url) {
  const res = await fetch(url, { credentials: 'include' });
  
  if (!res.ok) {
    const error = new Error('HTTP_ERROR');
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch (_) {
      error.info = null;
    }
    throw error;
  }
  
  return res.json();
}

export default swrFetcher;
