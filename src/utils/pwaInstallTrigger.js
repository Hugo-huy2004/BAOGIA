/**
 * pwaInstallTrigger.js
 * Quản lý kích hoạt cài đặt PWA 1-Tap nhanh chóng trên mọi thiết bị (Android/iOS/Desktop).
 */

let globalInstallPrompt = null;

// Catch native beforeinstallprompt globally & Request Persistent Storage
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalInstallPrompt = e;
    window.deferredPWAInstallPrompt = e;
  });

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

export async function triggerPWAInstallDirectly(onShowIOSGuide) {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) {
    return { installed: true, status: "already_installed" };
  }

  const prompt = globalInstallPrompt || window.deferredPWAInstallPrompt;

  if (prompt) {
    try {
      const choice = await prompt.prompt();
      if (choice?.outcome === "accepted") {
        globalInstallPrompt = null;
        window.deferredPWAInstallPrompt = null;
        return { installed: true, status: "accepted" };
      }
    } catch (e) {
      console.warn("Lỗi kích hoạt PWA prompt:", e);
    }
  }

  // Nếu prompt chưa sẵn sàng hoặc trên iOS Safari, phát sự kiện mở Modal Hướng Dẫn Chuẩn Apple
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-pwa-install-guide"));
  }

  if (isIOS && typeof onShowIOSGuide === "function") {
    onShowIOSGuide();
  }

  return { installed: false, status: "guide_shown" };
}
