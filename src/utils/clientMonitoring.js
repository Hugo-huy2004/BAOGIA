import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
// Dev chỉ chạy mỗi Vite (một cổng), không có backend 8081 để nhận telemetry —
// nên mặc định tắt khi dev, bật khi build production. Muốn ép thì đặt
// VITE_ENABLE_CLIENT_MONITORING=true/false, giá trị này thắng cả hai chiều.
const ENABLE_CLIENT_MONITORING =
  String(import.meta.env.VITE_ENABLE_CLIENT_MONITORING || (import.meta.env.DEV ? "false" : "true")) !== "false";
// Runtime toggle persisted short-term when the ops endpoint is absent/404ing.
let runtimeEnabled = ENABLE_CLIENT_MONITORING;
try {
  const until = Number(sessionStorage.getItem('clientMonitoringDisabledUntil') || '0');
  if (until && Date.now() < until) runtimeEnabled = false;
} catch { /* ignore */ }
const EVENT_URL = `${API_BASE}/ops/client-event`;
const SLOW_API_MS = Number(import.meta.env.VITE_SLOW_API_MS || 3000);
const SLOW_VITAL_RATINGS = new Set(["needs-improvement", "poor"]);
const MAX_FIELD_LEN = 500;
const CORE_VITALS = new Set(["CLS", "INP", "LCP"]);
const API_SUMMARY_INTERVAL_MS = 30_000;

let installed = false;
let apiRequestCount = 0;
let apiErrorCount = 0;

function truncate(value, limit = MAX_FIELD_LEN) {
  const str = String(value || "");
  return str.length > limit ? `${str.slice(0, limit)}...` : str;
}

function scrubUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin === window.location.origin ? "" : url.origin}${url.pathname}`;
  } catch {
    return String(value).split("?")[0].slice(0, 180);
  }
}

function safePayload(event) {
  const width = window.innerWidth || 0;
  const device = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
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
    requestCount: Number.isFinite(event.requestCount) ? event.requestCount : undefined,
    errorCount: Number.isFinite(event.errorCount) ? event.errorCount : undefined,
    device,
    network: truncate(navigator.connection?.effectiveType || "", 20),
    createdAt: new Date().toISOString(),
  };
}

export function reportClientEvent(event) {
  if (typeof window === "undefined") return;
  if (!runtimeEnabled) return;
  const payload = JSON.stringify(safePayload(event));

  // Không dùng sendBeacon: nó trả về true ngay khi request được xếp hàng, nên
  // endpoint có chết cũng không ai biết — nhánh tự-tắt bên dưới không bao giờ
  // chạy tới và console ăn lỗi mỗi 30 giây. fetch + keepalive vẫn gửi được lúc
  // rời trang, mà còn quan sát được kết quả.
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
        try { sessionStorage.setItem('clientMonitoringDisabledUntil', String(Date.now() + 10 * 60 * 1000)); } catch { /* ignore */ }
      }
    })
    .catch(() => {
      runtimeEnabled = false;
      try { sessionStorage.setItem('clientMonitoringDisabledUntil', String(Date.now() + 10 * 60 * 1000)); } catch { /* ignore */ }
    });
}

function installWebVitals() {
  const reportVital = (metric) => {
    if (!CORE_VITALS.has(metric.name) && !SLOW_VITAL_RATINGS.has(metric.rating)) return;
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

export function recordApiOutcome(ok) {
  apiRequestCount += 1;
  if (!ok) apiErrorCount += 1;
}

// `final` = lúc rời trang: gửi tổng kết phiên dù không có lỗi, để còn mẫu số
// tính tỉ lệ. Nhịp 30 giây thì chỉ gửi khi CÓ lỗi.
//
// Trước đây cứ 30 giây là gửi một bản "mọi thứ đều ổn": 352/622 bản ghi
// ClientMetric là loại đó — hơn nửa kho dữ liệu chỉ để nói không có gì xảy ra.
// Bỏ qua nhưng KHÔNG reset bộ đếm, nên lần gửi sau vẫn có đủ số của cả phiên.
function flushApiSummary(final = false) {
  if (!apiRequestCount) return;
  if (!final && !apiErrorCount) return;
  reportClientEvent({
    type: "api-summary",
    name: "api-error-rate",
    value: apiErrorCount / apiRequestCount,
    requestCount: apiRequestCount,
    errorCount: apiErrorCount,
  });
  apiRequestCount = 0;
  apiErrorCount = 0;
}

function installApiSummaryReporter() {
  const interval = window.setInterval(() => flushApiSummary(), API_SUMMARY_INTERVAL_MS);
  window.addEventListener("pagehide", () => flushApiSummary(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushApiSummary(true);
  });
  return () => window.clearInterval(interval);
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
  installApiSummaryReporter();
}

export { SLOW_API_MS };
