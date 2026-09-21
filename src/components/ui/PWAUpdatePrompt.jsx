import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const POLL_MS = 30 * 60 * 1000;

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
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return undefined;
    let disposed = false;
    let interval;
    let lastCheck = Date.now(); // Registration already checks on a fresh navigation.
    let check;
    let onVisible;

    navigator.serviceWorker.ready.then((registration) => {
      if (disposed) return;
      check = () => {
        if (document.hidden || !navigator.onLine || Date.now() - lastCheck < 60_000) return;
        lastCheck = Date.now();
        registration.update().catch(() => {});
      };
      onVisible = () => check();
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("online", check);
      interval = window.setInterval(check, POLL_MS);
    }).catch(() => {});

    return () => {
      disposed = true;
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
      if (check) window.removeEventListener("online", check);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
}
