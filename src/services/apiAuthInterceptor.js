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
        const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
        if (token && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return originalFetch(input, { credentials: "include", ...init, headers })
          .then((res) => {
            const durationMs = performance.now() - startedAt;
            // Never report 429s: they're expected backpressure, not actionable
            // errors, and each report is itself a request that would amplify the
            // rate-limit storm it's reacting to.
            if (res.status !== 429 && (!res.ok || durationMs >= SLOW_API_MS)) {
              record({
                type: res.ok ? "slow-api" : "api-error",
                status: res.status,
                message: res.ok ? `Slow API ${Math.round(durationMs)}ms` : `HTTP ${res.status}`,
              });
            }
            return res;
          })
          .catch((error) => {
            record({
              type: "api-network-error",
              message: error?.message || error,
              stack: error?.stack,
            });
            throw error;
          });
      }
    } catch {
      // Never let auth decoration break the request itself.
    }
    return originalFetch(input, init);
  };
}
