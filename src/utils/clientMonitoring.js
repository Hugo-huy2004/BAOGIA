import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
// Toggle client-side event reporting in environments where the ops endpoint
// isn't available. Set `VITE_ENABLE_CLIENT_MONITORING=false` to disable.
const ENABLE_CLIENT_MONITORING = String(import.meta.env.VITE_ENABLE_CLIENT_MONITORING || "true") !== "false";
// Runtime toggle persisted short-term when the ops endpoint is absent/404ing.
let runtimeEnabled = ENABLE_CLIENT_MONITORING;
try {
  const until = Number(sessionStorage.getItem('clientMonitoringDisabledUntil') || '0');
  if (until && Date.now() < until) runtimeEnabled = false;
} catch (_) {}
const EVENT_URL = `${API_BASE}/ops/client-event`;
const SLOW_API_MS = Number(import.meta.env.VITE_SLOW_API_MS || 3000);
const SLOW_VITAL_RATINGS = new Set(["needs-improvement", "poor"]);
const MAX_FIELD_LEN = 500;

let installed = false;

function truncate(value, limit = MAX_FIELD_LEN) {
  const str = String(value || "");
  return str.length > limit ? `${str.slice(0, limit)}...` : str;
}

function scrubUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin === window.location.origin ? "" : url.origin}${url.pathname}`;
  } catch (_) {
    return String(value).split("?")[0].slice(0, 180);
  }
}

function safePayload(event) {
  return {
    type: truncate(event.type, 40),
    name: truncate(event.name, 80),
    rating: truncate(event.rating, 40),
    value: Number.isFinite(event.value) ? Math.round(event.value) : undefined,
    durationMs: Number.isFinite(event.durationMs) ? Math.round(event.durationMs) : undefined,
    status: Number.isFinite(event.status) ? event.status : undefined,
    method: truncate(event.method, 12),
    path: scrubUrl(event.path || window.location.href),
    page: scrubUrl(window.location.href),
    message: truncate(event.message, 220),
    stack: truncate(event.stack, 500),
    source: "web",
    createdAt: new Date().toISOString(),
  };
}

export function reportClientEvent(event) {
  if (typeof window === "undefined") return;
  if (!runtimeEnabled) return;
  const payload = JSON.stringify(safePayload(event));

  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(EVENT_URL, new Blob([payload], { type: "application/json" }));
      if (ok) return;
    }
  } catch (_) {
    /* fall through */
  }

  fetch(EVENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok && (res.status === 404 || res.status === 410)) {
        // Ops endpoint missing — disable reporting for 10 minutes to avoid spam.
        runtimeEnabled = false;
        try { sessionStorage.setItem('clientMonitoringDisabledUntil', String(Date.now() + 10 * 60 * 1000)); } catch (_) {}
      }
    })
    .catch(() => {
      runtimeEnabled = false;
      try { sessionStorage.setItem('clientMonitoringDisabledUntil', String(Date.now() + 10 * 60 * 1000)); } catch (_) {}
    });
}

function installWebVitals() {
  const reportVital = (metric) => {
    if (!SLOW_VITAL_RATINGS.has(metric.rating)) return;
    reportClientEvent({
      type: "web-vital",
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  };

  onCLS(reportVital);
  onFCP(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onTTFB(reportVital);
}

function installGlobalErrorHandlers() {
  window.addEventListener("error", (event) => {
    reportClientEvent({
      type: "runtime-error",
      name: event.error?.name || "Error",
      message: event.message || event.error?.message,
      stack: event.error?.stack,
      path: event.filename || window.location.href,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportClientEvent({
      type: "unhandled-rejection",
      name: reason?.name || "PromiseRejection",
      message: reason?.message || reason,
      stack: reason?.stack,
    });
  });
}

export function installClientMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  installWebVitals();
  installGlobalErrorHandlers();
}

export { SLOW_API_MS };
