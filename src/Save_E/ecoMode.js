// Chế độ Bảo vệ môi trường (Save_E).
//
// Ý tưởng: cắt những thứ tiêu tốn tài nguyên thật — pin máy (nền sáng trên màn
// OLED), điện của máy chủ (gọi API lặp lại) và điện của trung tâm dữ liệu (mọi
// tính năng AI). Đổi lại người dùng nhận một portal rút gọn, chữ to, nền tối.
//
// Chỉ bật được trong PWA đã cài: ở tab trình duyệt thường, thanh địa chỉ và
// chrome của trình duyệt vẫn sáng nên phần tiết kiệm gần như vô nghĩa.

const KEY = "hugo.saveE.enabled";
const listeners = new Set();

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

const readFlag = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

/** Bật thật sự hay không: cờ đã lưu VÀ đang chạy dạng ứng dụng đã cài. */
export const isEcoOn = () => readFlag() && canUseEco();

/** Cờ đã lưu, không quan tâm PWA — dùng cho ô gạt trong Cài đặt. */
export const isEcoFlagOn = () => readFlag();

export function setEcoMode(enabled) {
  try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch { /* chế độ riêng tư */ }
  document.documentElement.classList.toggle("save-e-active", enabled && canUseEco());
  listeners.forEach((listener) => listener());
}

export function subscribeEcoMode(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Gắn class ngay khi nạp để không nháy nền sáng một nhịp rồi mới tối.
if (typeof document !== "undefined" && isEcoOn()) {
  document.documentElement.classList.add("save-e-active");
}
