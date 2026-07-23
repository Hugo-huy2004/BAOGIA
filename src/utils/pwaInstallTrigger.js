/**
 * pwaInstallTrigger.js
 * Quản lý kích hoạt cài đặt PWA 1-Tap nhanh chóng trên mọi thiết bị (Android/iOS/Desktop).
 */

let globalInstallPrompt = null;

// Catch native beforeinstallprompt globally
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalInstallPrompt = e;
    window.deferredPWAInstallPrompt = e;
  });
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

  // Nếu là iOS hoặc trình duyệt chưa nổ event, mở Hướng dẫn 1-Tap iOS/Safari
  if (isIOS && typeof onShowIOSGuide === "function") {
    onShowIOSGuide();
    return { installed: false, status: "ios_guided" };
  }

  return { installed: false, status: "prompt_unavailable" };
}
