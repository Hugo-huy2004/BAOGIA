import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Mỗi lần build lên là máy đang cài PWA nhận bản mới ngay.
//
// registerType 'autoUpdate' + skipWaiting/clientsClaim trong vite.config đã lo
// phần ÁP bản mới. Phần thiếu là phần DÒ: trình duyệt chỉ tự kiểm tra service
// worker mới lúc tải trang — mà PWA đã cài thì người dùng bấm icon là khôi
// phục từ nền, không tải lại lần nào. Không gọi registration.update() thì một
// app mở suốt tuần vẫn chạy bản build của tuần trước.
//
// Nên dò ở đúng hai thời điểm: mỗi lần app quay lại tiền cảnh (đây mới là
// "mở app" thật trên iOS/Android), và một nhịp nền thưa cho máy để app mở
// liên tục.
const POLL_MS = 30 * 60 * 1000;

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Bọc try/catch: update() ném khi mất mạng hoặc khi SW đang bị thay.
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };

      const onVisible = () => {
        if (!document.hidden) check();
      };

      check();
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("online", check);
      window.setInterval(check, POLL_MS);
    },
    onRegisterError(error) {
      console.warn("PWA update registration failed:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
