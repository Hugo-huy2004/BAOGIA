/**
 * HugoOS — tín hiệu "app đang mở từ icon này". Chỗ bấm (Trang chủ, Gần đây)
 * chỉ báo vị trí icon; `AppLaunchLayer` vẽ hiệu ứng phóng to. Tách thành một
 * kênh nhỏ để nơi bấm không phải biết lớp hiệu ứng nằm ở đâu trong cây React.
 */
const listeners = new Set();
// Mở app làm portal dựng lại cây (vỏ toàn màn khác vỏ thường), nên lớp hiệu ứng
// bị gỡ rồi gắn lại ngay giữa chừng. Giữ lần mở gần nhất ở đây để lớp mới gắn
// chạy tiếp thay vì mất hiệu ứng.
let lastLaunch = null;
export const LAUNCH_TOTAL_MS = 460;

export function currentLaunch() {
  return lastLaunch && Date.now() - lastLaunch.at < LAUNCH_TOTAL_MS ? lastLaunch : null;
}

export function onAppLaunch(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function announceAppLaunch(app, element) {
  if (!app || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const box = element?.getBoundingClientRect?.();
  if (!box || box.width === 0) return;
  const rect = { x: box.left, y: box.top, width: box.width, height: box.height };
  lastLaunch = { app, rect, at: Date.now() };
  for (const listener of listeners) listener(lastLaunch);
}
