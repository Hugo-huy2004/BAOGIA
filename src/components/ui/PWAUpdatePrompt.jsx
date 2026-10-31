import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";
import HugoDrop from "../system/HugoDrop";
import StatusScreen from "../system/StatusScreen";
import { notify } from "../../lib/notify";

const POLL_MS = 30 * 60 * 1000;
const BOOT_REASON = "hugo:boot-reason";
const VERSION = import.meta.env.VITE_APP_VERSION || "";

/*
 * Bản mới KHÔNG còn tự tải lại giữa chừng (trước đây updateServiceWorker(true)
 * chạy ngay khi có bản mới — đang gõ dở hay đang thanh toán cũng bị tải lại).
 * Giờ: hiện tấm báo nhỏ; bấm "Cập nhật" hoặc rời app (ẩn tab) là áp dụng — rời
 * app thì không ai thấy trang tải lại. Lúc cập nhật có màn giọt nước, mở lại
 * báo "Đã cập nhật lên phiên bản X".
 */
export default function PWAUpdatePrompt() {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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
    let reason = "";
    try { reason = sessionStorage.getItem(BOOT_REASON) || ""; sessionStorage.removeItem(BOOT_REASON); } catch { /* ignore */ }
    if (reason === "update") {
      notify.success(t("system.update.done", { version: VERSION, defaultValue: "Đã cập nhật lên phiên bản {{version}}" }));
    }
  }, [t]);

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

  const apply = (visible) => {
    try { sessionStorage.setItem(BOOT_REASON, "update"); } catch { /* ignore */ }
    if (visible) setUpdating(true);
    updateServiceWorker(true);
  };

  // Rời app khi đang có bản mới → cập nhật ngầm, quay lại là đã mới.
  useEffect(() => {
    if (!needRefresh) return undefined;
    const onHide = () => { if (document.hidden) apply(false); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needRefresh]);

  if (updating) return <div className="fixed inset-0 z-[500]"><StatusScreen kind="updating" /></div>;
  if (!needRefresh || dismissed) return null;

  return (
    <div className="hs-sheet" role="dialog" aria-live="polite" aria-label={t("system.update.title", { defaultValue: "Đã có phiên bản mới" })}>
      <HugoDrop mode="fill" className="h-9 w-9 shrink-0" label="" />
      <p className="hs-sheet__text">
        {t("system.update.title", { defaultValue: "Đã có phiên bản mới" })}
        <small>{t("system.update.body", { defaultValue: "Tự cập nhật khi rời ứng dụng, hoặc cập nhật ngay." })}</small>
      </p>
      <button type="button" className="hs-btn" onClick={() => setDismissed(true)} aria-label={t("system.update.later", { defaultValue: "Để sau" })}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
      </button>
      <button type="button" className="hs-btn hs-btn--primary" onClick={() => apply(true)}>
        {t("system.update.now", { defaultValue: "Cập nhật" })}
      </button>
    </div>
  );
}
