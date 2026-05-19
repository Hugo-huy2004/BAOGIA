import React, { useState, useEffect } from "react";

export default function VacationNotificationBanner() {
  const [isVacation, setIsVacation] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("hugoStudioVacationMode");
    if (saved) {
      setIsVacation(JSON.parse(saved));
    }

    // Listen for storage changes (when settings change in another tab)
    const handleStorageChange = () => {
      const updated = localStorage.getItem("hugoStudioVacationMode");
      setIsVacation(updated ? JSON.parse(updated) : false);
      setIsVisible(true); // Reset visibility when mode changes
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!isVacation || !isVisible) return null;

  return (
    <div className="sticky top-14 z-40 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 dark:from-amber-600 dark:via-orange-600 dark:to-rose-600 backdrop-blur-lg border-b border-amber-500/50 dark:border-amber-700/50 shadow-lg animate-slideDown">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">

          {/* Message */}
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold text-base sm:text-lg text-white dark:text-slate-900 tracking-tight">
              Hugo Studio đi du lịch rùiiii!
            </p>
            <p className="text-sm text-white/90 dark:text-slate-800/90 font-medium mt-1">
              Vài hôm nữa mình sẽ liên lạc lại bạn nha! 
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-2 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-full transition-colors text-white dark:text-slate-900 font-bold"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
