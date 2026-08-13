/**
 * Pure header logic for the fetch auth interceptor, kept free of any browser
 * dependency so scripts/check-api-auth.mjs can assert it under plain Node.
 * apiAuthInterceptor.js owns the fetch patching and the session lookups.
 */

/** Copy Headers / array-of-pairs / plain object into a plain object. */
const toHeaderObject = (raw) => {
  const out = {};
  if (!raw) return out;
  // Arrays must be tested first: they also have forEach, and the Headers branch
  // would read an array of pairs as (element, index) and produce {0: [k, v]},
  // silently dropping every header the caller set.
  if (Array.isArray(raw)) {
    for (const [key, value] of raw) out[key] = value;
  } else if (typeof raw.forEach === "function") {
    raw.forEach((value, key) => { out[key] = value; });
  } else {
    Object.assign(out, raw);
  }
  return out;
};

const BEARER = /^Bearer\s+\S+$/i;
const BEARER_EMPTY = /^Bearer\s+(undefined|null)$/i;

/**
 * Decide what this request needs. Returns null when the interceptor has nothing
 * to add — the caller then forwards the untouched arguments, which matters when
 * `input` is a Request: rebuilding one with a fresh init is what disturbs its
 * body stream, and that surfaced as sporadic failed POSTs.
 */
export const authDecision = (input, init, availableToken) => {
  const headers = toHeaderObject(init.headers ?? (typeof input !== "string" ? input?.headers : undefined));
  const authKey = Object.keys(headers).find(k => k.toLowerCase() === "authorization");
  const existing = authKey ? String(headers[authKey]).trim() : "";
  const hasValidAuth = Boolean(authKey && BEARER.test(existing) && !BEARER_EMPTY.test(existing));

  // Malformed manual headers such as `Bearer undefined` otherwise stop this
  // interceptor from attaching the live session.
  const mustStrip = Boolean(authKey) && !hasValidAuth;
  const token = hasValidAuth ? null : (availableToken || null);

  const existingToken = hasValidAuth ? existing.replace(/^Bearer\s+/i, "") : null;

  if (!mustStrip && !token) {
    return { headers: null, sentAuth: hasValidAuth, authToken: existingToken };
  }

  if (mustStrip) delete headers[authKey];
  if (token) headers.Authorization = `Bearer ${token}`;
  return {
    headers,
    sentAuth: hasValidAuth || Boolean(token),
    authToken: existingToken || token,
  };
};
