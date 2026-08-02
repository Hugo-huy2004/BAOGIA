// Chế độ Bảo vệ môi trường (Save_E).
//
// Ý tưởng: cắt những thứ tiêu tốn tài nguyên thật — pin máy (nền sáng trên màn
// OLED), điện của máy chủ (gọi API lặp lại) và điện của trung tâm dữ liệu (mọi
// tính năng AI). Đổi lại người dùng nhận một portal rút gọn, chữ to, nền tối.
//
// Ba mức: tắt / bật / tự động. "Tự động" nhường quyền quyết định cho máy —
// pin yếu, mạng 2G hoặc hệ điều hành đang bật Tiết kiệm dữ liệu thì bật, sạc
// đầy thì trả lại portal thường (xem `ecoSignals.js`).
//
// Chỉ bật được trong PWA đã cài: ở tab trình duyệt thường, thanh địa chỉ và
// chrome của trình duyệt vẫn sáng nên phần tiết kiệm gần như vô nghĩa.

import { shouldAutoEco, subscribeEcoSignals } from "./ecoSignals";
import { startEcoClock, stopEcoClock } from "./ecoStore";

const KEY = "hugo.saveE.mode";
const LEGACY_KEY = "hugo.saveE.enabled";
const listeners = new Set();

export const MODES = ["off", "on", "auto"];

export const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
};

// Cửa hậu CHỈ để lập trình viên thử: mở ?eco=force một lần, nhớ trong phiên.
// Không hiện ở bất kỳ đâu trong giao diện.
const FORCE_KEY = "hugo.saveE.force";
const hasForceFlag = () => {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("eco") === "force") {
      sessionStorage.setItem(FORCE_KEY, "1");
    }
    return sessionStorage.getItem(FORCE_KEY) === "1";
  } catch { return false; }
};

/**
 * Chỉ ứng dụng đã cài (PWA) mới được dùng chế độ này. Trên web/desktop, ô cài
 * đặt ẩn hẳn và người đang bật sẽ tự quay về portal thường — nền tối trong một
 * cửa sổ trình duyệt sáng thì không tiết kiệm được gì đáng kể, mà lại cắt mất
 * tính năng của họ.
 */
export const canUseEco = () => isStandalonePwa() || hasForceFlag();

/** Mức người dùng đã chọn, không quan tâm PWA — dùng cho ô gạt trong Cài đặt. */
export function getEcoMode() {
  try {
    const stored = localStorage.getItem(KEY);
    if (MODES.includes(stored)) return stored;
    // Bản đầu chỉ có bật/tắt; giữ lựa chọn cũ của người đang dùng.
    return localStorage.getItem(LEGACY_KEY) === "1" ? "on" : "off";
  } catch { return "off"; }
}

/** Bật thật sự hay không: mức đã chọn (có xét tín hiệu máy) VÀ đang chạy dạng ứng dụng. */
export function isEcoOn() {
  const mode = getEcoMode();
  if (mode === "off") return false;
  if (mode === "auto" && !shouldAutoEco()) return false;
  return canUseEco();
}

// index.html có sẵn hai thẻ theme-color theo sáng/tối. Trình duyệt lấy thẻ KHỚP
// ĐẦU TIÊN, nên chèn thêm một thẻ không kèm media lên đầu <head> là đè được cả
// hai; tắt chế độ thì gỡ ra, trả lại đúng như cũ.
const THEME_TAG_ID = "save-e-theme-color";
function applyThemeColor(on) {
  if (!document.head) return;
  const existing = document.getElementById(THEME_TAG_ID);
  if (!on) { existing?.remove(); return; }
  if (existing) return;
  const meta = document.createElement("meta");
  meta.id = THEME_TAG_ID;
  meta.name = "theme-color";
  meta.content = "#000000";
  document.head.prepend(meta);
}

function apply() {
  const on = isEcoOn();
  const root = document.documentElement;
  root.classList.toggle("save-e-active", on);
  // Chạy ngay lúc nạp, trước cả khi chunk giao diện của chế độ này tải xong —
  // nếu chỉ dựa vào CSS thì có một nhịp nền trắng loé lên.
  // Kể cả thanh trạng thái của Android: nó cũng là điểm ảnh OLED.
  if (root.style) {
    root.style.background = on ? "#000000" : "";
    root.style.colorScheme = on ? "dark" : "";
  }
  applyThemeColor(on);
  // Đồng hồ tiết kiệm chỉ chạy khi chế độ thực sự đang bật.
  if (on) startEcoClock();
  else stopEcoClock();
  return on;
}

export function setEcoMode(mode) {
  const next = MODES.includes(mode) ? mode : "off";
  try {
    localStorage.setItem(KEY, next);
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* chế độ riêng tư */ }
  apply();
  listeners.forEach((listener) => listener());
}

export function subscribeEcoMode(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof document !== "undefined") {
  // Gắn class ngay khi nạp để không nháy nền sáng một nhịp rồi mới tối.
  apply();
  // Pin tụt hay cắm sạc giữa chừng: mức "tự động" phải đổi theo, không đợi
  // người dùng mở lại app.
  subscribeEcoSignals(() => {
    if (getEcoMode() !== "auto") return;
    apply();
    listeners.forEach((listener) => listener());
  });
}
