// HugoPSY / Bạn Học Đường đã gỡ 04/11/2026. Dữ liệu tâm lý còn nằm trên máy người
// dùng (nhật ký, tin nhắn, giấc ngủ, mô hình AI chạy trên máy) cũng phải xoá theo.
// ponytail: chạy mỗi lần mở app, rẻ và tự hết việc; gỡ file này sau vài tháng.
const PREFIXES = ["banhocduong_", "hugopsy_"];
const KEYS = ["hugo_sleep_v2", "device_sensors_connected"];
const CACHES = ["hugo-sleep-state-v1", "webllm/model", "webllm/config", "webllm/wasm"];

export function purgeRetiredData() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && (KEYS.includes(key) || PREFIXES.some((p) => key.startsWith(p)))) localStorage.removeItem(key);
    }
  } catch { /* storage blocked */ }
  if (typeof caches !== "undefined") CACHES.forEach((name) => caches.delete(name).catch(() => {}));
  navigator.serviceWorker?.ready
    .then((reg) => reg.periodicSync?.unregister("sleep-monitor"))
    .catch(() => {});
}
