import React, { useState, useEffect } from "react";

export default function VacationNotificationBanner({ isVacationMode = false }) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto show when vacation mode is enabled
  useEffect(() => {
    if (isVacationMode) {
      setIsVisible(true);
    }
  }, [isVacationMode]);

  if (!isVacationMode || !isVisible) return null;

  return (
    <div className="sticky top-14 z-40 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 dark:from-amber-600 dark:via-orange-600 dark:to-rose-600 backdrop-blur-lg border-b border-amber-500/50 dark:border-amber-700/50 shadow-lg animate-slideDown overflow-hidden">
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-4 relative">
        {/* Right side: Full Image */}
        <div className="absolute right-0 top-0 bottom-0 h-full flex items-center justify-end opacity-75 sm:opacity-80 pointer-events-none">
          <img
            src="/image/avt6.png"
            alt=""
            className="h-full w-auto object-cover"
          />
        </div>

        {/* Left side: Message */}
        <div className="flex items-center gap-3 flex-1 min-w-0">

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold text-sm sm:text-base text-white dark:text-slate-900 tracking-tight leading-tight">
              Hugo Studio đi du lịch rùiiii!
            </p>
            <p className="text-xs sm:text-sm text-white/90 dark:text-slate-800/90 font-medium mt-0.5">
              Vài hôm nữa mình sẽ liên lạc lại bạn nha! 
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-2 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-full transition-colors text-white dark:text-slate-900 font-bold relative z-10"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
