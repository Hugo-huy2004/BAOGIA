import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { isHBotVisible, HBOT_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      console.warn("PWA update registration failed:", error);
    },
  });

  const [hbotVisible, setHbotVisible] = useState(() => isHBotVisible());

  useEffect(() => {
    const onVisibilityChange = (e) => setHbotVisible(e.detail.visible);
    window.addEventListener(HBOT_VISIBILITY_EVENT, onVisibilityChange);
    return () => window.removeEventListener(HBOT_VISIBILITY_EVENT, onVisibilityChange);
  }, []);

  useEffect(() => {
    if (needRefresh) {
      window.dispatchEvent(new CustomEvent('pwa-update-available', { 
        detail: { updateServiceWorker } 
      }));
    }
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh || hbotVisible) return null;

  return (
    <div
      className="fixed z-[180] top-4 md:top-6 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[360px]"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16151f] shadow-2xl p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[22px]">system_update_alt</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold text-zinc-900 dark:text-white leading-tight">
            Có bản Hugo mới
          </p>
          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
            Cập nhật để nhận sửa lỗi và cải thiện ổn định.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[11px] font-bold transition-all"
          >
            Cập nhật
          </button>
          <button
            type="button"
            aria-label="Để sau"
            onClick={() => setNeedRefresh(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
