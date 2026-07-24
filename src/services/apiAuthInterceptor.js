// Attaches the member session token to every fetch() aimed at our API.
//
// The codebase has dozens of call sites (services + components) that fetch
// `/api/...` directly; patching fetch once here means none of them need to
// know about auth transport, and no future call site can forget it. The
// HttpOnly cookie still flows on same-origin deployments — the Bearer header
// is the fallback that also works cross-origin (Vercel frontend + API host).
import { getMemberToken } from "./authSession";
import { reportClientEvent, SLOW_API_MS } from "../utils/clientMonitoring";

const API_PREFIXES = (() => {
  const prefixes = ["/api/"];
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) prefixes.push(envUrl);
  return prefixes;
})();

const isApiRequest = (url) => API_PREFIXES.some((p) => url.startsWith(p));

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
        const token = getMemberToken();
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

        // Add Authorization Bearer header if not already present
        const hasAuth = Object.keys(headersObj).some(k => k.toLowerCase() === "authorization");
        if (token && !hasAuth) {
          headersObj["Authorization"] = `Bearer ${token}`;
        }

        return originalFetch(input, { credentials: "include", ...init, headers: headersObj })
          .then((res) => {
            const durationMs = performance.now() - startedAt;
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
            throw error;
          });
      }
    } catch {
      // Never let auth decoration break the request itself.
    }
    return originalFetch(input, init);
  };
}
