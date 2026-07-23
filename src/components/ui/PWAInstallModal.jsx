/**
 * PWAInstallModal.jsx
 * Hướng dẫn Đẩy App Ra Màn Hình Chính Chuẩn Apple iOS & Android (Apple-Grade PWA Installer Sheet).
 * Tự động bật khi trình duyệt chưa nổ prompt hoặc trên iOS Safari.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !window.MSStream);

    const handleShowModal = () => setIsOpen(true);
    window.addEventListener("show-pwa-install-guide", handleShowModal);
    return () => window.removeEventListener("show-pwa-install-guide", handleShowModal);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] border border-white/20 dark:border-zinc-800 p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-2xl">install_mobile</span>
              </div>
              <div>
                <h3 className="text-base font-black text-foreground tracking-tight">
                  Thêm Vào Màn Hình Chính
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Cài đặt App độc lập 100% chuẩn Apple
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-3 bg-muted/40 p-4 rounded-2xl border border-border/50 text-xs">
            {isIOS ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">1</span>
                  <span>Nhấn vào biểu tượng <strong>Chia sẻ</strong> <span className="material-symbols-outlined text-sm align-middle text-blue-500">share</span> ở thanh công cụ trình duyệt Safari.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">2</span>
                  <span>Cuộn xuống và chọn <strong>Thêm vào Màn hình chính</strong> <span className="material-symbols-outlined text-sm align-middle text-emerald-500">add_box</span>.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">3</span>
                  <span>Nhấn <strong>Thêm</strong> ở góc trên bên phải để hoàn tất.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">1</span>
                  <span>Nhấn vào dấu <strong>3 chấm ⋮</strong> góc trên trình duyệt Chrome/Edge.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center shrink-0">2</span>
                  <span>Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>.</span>
                </div>
              </>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Đã Hiểu & Đóng
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
