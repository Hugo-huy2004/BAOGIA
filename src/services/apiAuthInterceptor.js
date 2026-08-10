// Attaches the member session token to every fetch() aimed at our API.
//
// The codebase has dozens of call sites (services + components) that fetch
// `/api/...` directly; patching fetch once here means none of them need to
// know about auth transport, and no future call site can forget it. The
// HttpOnly cookie still flows on same-origin deployments — the Bearer header
// is the fallback that also works cross-origin (Vercel frontend + API host).
import { getMemberToken, getAdminToken, clearMemberSession } from "./authSession";
import { recordApiOutcome, reportClientEvent, SLOW_API_MS } from "../utils/clientMonitoring";
import { authDecision } from "./apiAuthHeaders";
import { SECURITY_BLOCK_STORAGE_KEY } from "../components/SecurityBlockScreen";

const AUTH_EXEMPT_PATHS = [
  "/api/auth/member/google",
  "/api/admin/login",
  "/api/webauthn/login-options",
  "/api/webauthn/login-verify",
  "/api/customer-projects/auth",
];

// The target list depends only on the build-time API URL and the page origin,
// neither of which changes while the tab is open. It used to be rebuilt — two
// URL parses and a Map — on every isApiRequest() call, and isApiRequest() ran
// twice per fetch, so a single request cost four parses for a constant answer.
let cachedTargets = null;

const apiTargets = () => {
  if (cachedTargets) return cachedTargets;
  const browserOrigin = window.location.origin;
  const configured = import.meta.env?.VITE_API_URL || "/api";
  const unique = new Map();

  for (const candidate of ["/api", configured]) {
    try {
      const parsed = new URL(candidate, browserOrigin);
      const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
      unique.set(`${parsed.origin}${pathname}`, { origin: parsed.origin, pathname });
    } catch {
      // Invalid build-time API URL must never break fetch globally.
    }
  }
  cachedTargets = [...unique.values()];
  return cachedTargets;
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

/** Monitoring must never turn a healthy response into a rejected promise. */
const safely = (fn) => {
  try {
    fn();
  } catch {
    /* reporting is best-effort */
  }
};

const publishSecurityBlock = (payload) => {
  if (!payload || payload.error !== "ACCESS_BLOCKED") return;
  safely(() => sessionStorage.setItem(SECURITY_BLOCK_STORAGE_KEY, JSON.stringify(payload)));
  safely(() => window.dispatchEvent(new CustomEvent("hugo:security-blocked", { detail: payload })));
};

export function installApiAuthInterceptor() {
  // Guard against a second install stacking another wrapper on top of the
  // first: every layer would re-decorate headers and double-report metrics.
  // Vite's HMR re-runs the entry module, so this fired in every dev session.
  if (window.__hugoApiAuthInterceptorInstalled) return;
  window.__hugoApiAuthInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const startedAt = performance.now();
    const url = typeof input === "string" ? input : input?.url || "";
    if (shouldBypassInterception(url)) {
      return originalFetch(input, init);
    }

    let isApi = false;
    let decision = null;
    try {
      isApi = isApiRequest(url);
      if (isApi) decision = authDecision(input, init, getAdminToken() || getMemberToken());
    } catch {
      // Never let auth decoration break the request itself.
      return originalFetch(input, init);
    }

    if (!isApi) return originalFetch(input, init);

    const method = (init.method || (typeof input !== "string" ? input.method : "") || "GET").toUpperCase();
    const shouldTrack = !url.includes("/api/ops/client-event");
    const { headers, sentAuth } = decision;

    const response = headers
      ? originalFetch(input, { credentials: "include", ...init, headers })
      : originalFetch(input, { credentials: "include", ...init });

    return response
      .then((res) => {
        const durationMs = performance.now() - startedAt;
        if (shouldTrack) safely(() => recordApiOutcome(res.ok));

        if (res.status === 401 && sentAuth && !isAuthExemptRequest(url)) {
          // Token rejected by server -> clear invalid member session to halt 401 loops
          safely(clearMemberSession);
        }

        if (res.status === 403) {
          // Read a clone so callers retain the original body. A blocked SSE
          // response advertises itself by header because JSON parsing an event
          // stream would be invalid.
          if (res.headers.get("x-security-blocked") === "1") {
            publishSecurityBlock({
              error: "ACCESS_BLOCKED",
              message: "Tài khoản và mạng truy cập đã bị khóa theo tiêu chuẩn an toàn.",
              caseId: res.headers.get("x-security-case") || "",
              permanent: res.headers.get("x-security-permanent") === "1",
              blockedUntil: res.headers.get("x-security-until") || null,
            });
          } else {
            res.clone().json().then(publishSecurityBlock).catch(() => {});
          }
        }

        // Don't report transient/non-actionable statuses: 401 (guest/unauthenticated),
        // 429 (backpressure), and 502/503/504 (gateway — backend restarting).
        const transient = [401, 429, 502, 503, 504].includes(res.status);
        if (shouldTrack && !transient && (!res.ok || durationMs >= SLOW_API_MS)) {
          safely(() => reportClientEvent({
            method,
            path: url,
            durationMs,
            type: res.ok ? "slow-api" : "api-error",
            status: res.status,
            message: res.ok ? `Slow API ${Math.round(durationMs)}ms` : `HTTP ${res.status}`,
          }));
        }
        return res;
      })
      .catch((error) => {
        // Network errors (backend down / restarting / offline) are transient
        // connectivity, not actionable app bugs — reporting them just fires
        // another doomed request. Swallow the report; still reject so the
        // caller's own retry/fallback logic runs.
        if (shouldTrack) safely(() => recordApiOutcome(false));
        throw error;
      });
  };
}
