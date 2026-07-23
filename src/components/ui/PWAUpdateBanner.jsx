/**
 * PWAUpdateBanner.jsx
 * Banner Cập Nhật 1-Chạm Chuẩn Apple (1-Tap Hot Update Capsule Banner).
 * Tự động ẩn hoàn toàn nếu người dùng đã ở phiên bản mới nhất.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PWAUpdateManager } from "../../utils/pwaUpdateManager";

export default function PWAUpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      PWAUpdateManager.init(registration);

      if (registration.waiting) {
        setHasUpdate(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setHasUpdate(true);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!hasUpdate) return null;

  const handleUpdate = async () => {
    setUpdating(true);
    await PWAUpdateManager.applyHotUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] max-w-md w-[calc(100%-32px)]"
      >
        <div className="p-4 bg-zinc-950/95 text-white border border-zinc-800 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-[20px]">system_update</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
                Đã Có Bản Cập Nhật Mới
              </h4>
              <p className="text-[11px] text-zinc-400 truncate">
                Tối ưu hiệu năng & tính năng mới
              </p>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-4 py-2 rounded-full bg-primary text-white font-extrabold text-[11px] uppercase tracking-wider shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all duration-200 shrink-0 flex items-center gap-1.5"
          >
            {updating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang nâng cấp...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>Cập Nhật</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
