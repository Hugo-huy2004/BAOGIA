// Attaches the member session token to every fetch() aimed at our API.
//
// The codebase has dozens of call sites (services + components) that fetch
// `/api/...` directly; patching fetch once here means none of them need to
// know about auth transport, and no future call site can forget it. The
// HttpOnly cookie still flows on same-origin deployments — the Bearer header
// is the fallback that also works cross-origin (Vercel frontend + API host).
import { getMemberToken, getAdminToken, clearMemberSession } from "./authSession";
import { recordApiOutcome, reportClientEvent, SLOW_API_MS } from "../utils/clientMonitoring";

const AUTH_EXEMPT_PATHS = [
  "/api/auth/member/google",
  "/api/admin/login",
  "/api/webauthn/login-options",
  "/api/webauthn/login-verify",
  "/api/customer-projects/auth",
];

const apiTargets = () => {
  const browserOrigin = window.location.origin;
  const configured = import.meta.env.VITE_API_URL || "/api";
  const candidates = ["/api", configured];
  const unique = new Map();

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate, browserOrigin);
      const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
      unique.set(`${parsed.origin}${pathname}`, { origin: parsed.origin, pathname });
    } catch {
      // Invalid build-time API URL must never break fetch globally.
    }
  }
  return [...unique.values()];
};

const parseRequestUrl = (url) => {
  try {
    return new URL(url, window.location.origin);
  } catch {
    return null;
  }
};

const matchesApiTarget = (requestUrl, target) => (
  requestUrl.origin === target.origin
  && (
    requestUrl.pathname === target.pathname
    || requestUrl.pathname.startsWith(`${target.pathname}/`)
  )
);

// Services use both `/api/...` and absolute URLs such as
// `http://localhost:3000/api/...`. Compare parsed origin/pathname instead of
// string prefixes so both forms are authenticated without leaking a token to
// an unrelated origin that merely contains `/api/` in its URL.
export const isApiRequest = (url) => {
  const parsed = parseRequestUrl(url);
  return Boolean(parsed && apiTargets().some(target => matchesApiTarget(parsed, target)));
};

export const isAuthExemptRequest = (url) => {
  const parsed = parseRequestUrl(url);
  if (!parsed) return false;
  return AUTH_EXEMPT_PATHS.some(path => (
    parsed.pathname === path || parsed.pathname.startsWith(`${path}/`)
  ));
};

const shouldBypassInterception = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return false;
  if (/^(chrome-extension|moz-extension|safari-extension|edge-extension|data|blob|file):/i.test(url)) {
    return true;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(url) && !/^https?:/i.test(url)) {
    return true;
  }
  return false;
};

export function installApiAuthInterceptor() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const startedAt = performance.now();
    const url = typeof input === "string" ? input : input?.url || "";
    if (shouldBypassInterception(url)) {
      return originalFetch(input, init);
    }
    const method = (init.method || (typeof input !== "string" ? input.method : "") || "GET").toUpperCase();
    const shouldTrack = isApiRequest(url) && !url.includes("/api/ops/client-event");

    const record = (event) => {
      if (!shouldTrack) return;
      reportClientEvent({
        method,
        path: url,
        durationMs: performance.now() - startedAt,
        ...event,
      });
    };

    try {
      if (isApiRequest(url)) {
        const token = getAdminToken() || getMemberToken();
        const headersObj = {};

        // Robustly parse existing headers
        const rawHeaders = init.headers || (typeof input !== "string" ? input.headers : undefined);
        if (rawHeaders) {
          if (typeof rawHeaders.forEach === "function") {
            rawHeaders.forEach((value, key) => {
              headersObj[key] = value;
            });
          } else if (Array.isArray(rawHeaders)) {
            rawHeaders.forEach(([key, value]) => {
              headersObj[key] = value;
            });
          } else {
            Object.assign(headersObj, rawHeaders);
          }
        }

        // Discard malformed manual headers such as `Bearer undefined`. They
        // otherwise prevent this interceptor from attaching the live session.
        const authKey = Object.keys(headersObj).find(k => k.toLowerCase() === "authorization");
        const hasValidAuth = Boolean(
          authKey
          && /^Bearer\s+\S+$/i.test(String(headersObj[authKey]).trim())
          && !/^Bearer\s+(undefined|null)$/i.test(String(headersObj[authKey]).trim())
        );
        if (authKey && !hasValidAuth) {
          delete headersObj[authKey];
        }

        // Add the current Authorization token only when the caller did not
        // provide a valid one.
        const hasAuth = hasValidAuth;
        if (token && !hasAuth) {
          headersObj["Authorization"] = `Bearer ${token}`;
        }
        const sentAuth = hasAuth || Boolean(token);

        return originalFetch(input, { credentials: "include", ...init, headers: headersObj })
          .then((res) => {
            const durationMs = performance.now() - startedAt;
            if (shouldTrack) recordApiOutcome(res.ok);

            if (res.status === 401) {
              const isExempt = isAuthExemptRequest(url);
              if (!isExempt && sentAuth) {
                // Token rejected by server -> clear invalid member session to halt 401 loops
                clearMemberSession();
              }
            }

            // Don't report transient/non-actionable statuses: 401 (guest/unauthenticated),
            // 429 (backpressure), and 502/503/504 (gateway — backend restarting).
            const transient = res.status === 401 || res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
            if (!transient && (!res.ok || durationMs >= SLOW_API_MS)) {
              record({
                type: res.ok ? "slow-api" : "api-error",
                status: res.status,
                message: res.ok ? `Slow API ${Math.round(durationMs)}ms` : `HTTP ${res.status}`,
              });
            }
            return res;
          })
          .catch((error) => {
            // Network errors (backend down / restarting / offline) are transient
            // connectivity, not actionable app bugs — reporting them just fires
            // another doomed request. Swallow the report; still reject so the
            // caller's own retry/fallback logic runs.
            if (shouldTrack) recordApiOutcome(false);
            throw error;
          });
      }
    } catch {
      // Never let auth decoration break the request itself.
    }
    return originalFetch(input, init);
  };
}
