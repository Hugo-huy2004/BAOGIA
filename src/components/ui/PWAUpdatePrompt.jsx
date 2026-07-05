import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Silent auto-update: registers the service worker and, whenever a new version
// is available, applies it in the background (no "Cập nhật hệ thống" prompt).
// Combined with registerType 'autoUpdate' + skipWaiting/clientsClaim in
// vite.config, the fresh build is picked up automatically.
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      console.warn("PWA update registration failed:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
