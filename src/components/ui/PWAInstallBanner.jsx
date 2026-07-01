import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

const DISMISS_KEY = 'hugo_pwa_install_dismissed_v2';
const DISMISS_MS = 7 * 86400000; // 7 days

function detectPlatform() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return { ios, standalone };
}

function wasDismissed() {
  const ts = localStorage.getItem(DISMISS_KEY);
  return ts ? Date.now() - Number(ts) < DISMISS_MS : false;
}

const IOS_STEPS = [
  {
    icon: 'ios_share',
    title: 'Nhấn nút Chia sẻ',
    desc: 'Biểu tượng mũi tên hướng lên ở thanh công cụ Safari',
  },
  {
    icon: 'add_box',
    title: 'Chọn "Thêm vào màn hình chính"',
    desc: 'Kéo xuống danh sách tùy chọn để tìm mục này',
  },
  {
    icon: 'check_circle',
    title: 'Nhấn "Thêm" để xác nhận',
    desc: 'Icon Hugo Studio sẽ xuất hiện ngay trên màn hình chính',
  },
];

export default function PWAInstallBanner() {
  const { canInstall, install } = usePWA();
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { ios, standalone } = detectPlatform();

  useEffect(() => {
    if (standalone || wasDismissed()) return;
    // Show after 5s so it doesn't interrupt initial load
    const t = setTimeout(() => {
      if (ios || canInstall) setVisible(true);
    }, 5000);
    return () => clearTimeout(t);
  }, [canInstall, ios, standalone]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowGuide(false);
  };

  const handlePrimary = async () => {
    if (ios) {
      setShowGuide(true);
      setVisible(false);
      return;
    }
    const ok = await install();
    if (ok) dismiss();
  };

  return (
    <>
      {/* Compact bottom banner */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="pwa-banner"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed z-[160] left-3 right-3 md:left-auto md:right-6 md:w-[360px]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
          >
            <div className="bg-white dark:bg-[#16151f] rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/[0.09] p-3.5 flex items-center gap-3">
              {/* App icon */}
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span
                  className="material-symbols-outlined text-white text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  phone_iphone
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                  Thêm vào màn hình chính
                </p>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                  {ios ? 'Mở trong Safari → Share → Add to Home Screen' : 'Mở nhanh hơn, dùng offline, như app thật'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrimary}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[11.5px] font-bold rounded-xl transition-all shadow-sm shadow-blue-500/30"
                >
                  {ios ? 'Hướng dẫn' : 'Cài ngay'}
                </button>
                <button
                  onClick={dismiss}
                  aria-label="Đóng"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS step-by-step bottom sheet */}
      <AnimatePresence>
        {showGuide && (
          <>
            {/* Scrim */}
            <motion.div
              key="ios-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              className="fixed inset-0 z-[170] bg-black/55 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="ios-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 390, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[175] bg-white dark:bg-[#16151f] rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.25)]"
              style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-5" />

              <div className="px-6">
                {/* Header */}
                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">
                  3 bước đơn giản
                </p>
                <h3 className="text-center text-[20px] font-extrabold text-zinc-900 dark:text-white mb-1 tracking-tight">
                  Thêm Hugo vào màn hình chính
                </h3>
                <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 mb-7">
                  Cần mở trang này bằng Safari để thực hiện
                </p>

                {/* Steps */}
                <div className="space-y-4 mb-7">
                  {IOS_STEPS.map(({ icon, title, desc }, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {icon}
                        </span>
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[13.5px] font-bold text-zinc-900 dark:text-white leading-tight">
                          {title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={dismiss}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-extrabold text-[14px] rounded-2xl transition-all shadow-lg shadow-blue-500/25"
                >
                  Đã hiểu rồi!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
