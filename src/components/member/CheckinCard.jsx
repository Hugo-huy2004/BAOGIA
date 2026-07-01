import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useJoyStore } from "../../stores/joyStore";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function CheckinCard({ email, showToast }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  // Ref-based lock prevents double-submit race where state update hasn't
  // flushed yet when a second click fires (e.g., rapid tap on mobile).
  const claimingRef = useRef(false);
  const setBalance = useJoyStore(s => s.setBalance);

  const fetchStatus = useCallback(() => {
    if (!email) return;
    fetch(`${apiBase}/checkin/status?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleClaim() {
    if (!email || claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    try {
      const r = await fetch(`${apiBase}/checkin/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.checkin.claimError"));
      setBalance(data.newBalance);
      const msg = data.bonusAwarded > 0
        ? t("memberPortal.checkin.claimSuccessBonus", { total: data.totalReward, bonus: data.bonusAwarded })
        : t("memberPortal.checkin.claimSuccess", { amount: data.dailyReward });
      showToast?.(msg, "success");
      fetchStatus();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      claimingRef.current = false;
      setClaiming(false);
    }
  }

  if (loading || !status) {
    return <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
      <span className="material-symbols-outlined animate-spin">sync</span>
      {t("memberPortal.checkin.loading")}
    </div>;
  }

  const rewardTable = status.rewardTable || [150, 240, 240, 240, 240, 240, 450];

  return (
    <div className={`bg-white dark:bg-[#15131e] rounded-3xl border border-zinc-200 dark:border-white/10 border-t-4 p-5 space-y-5 shadow-sm transition-all duration-300 ${
      status.weekLocked ? 'border-t-destructive ring-1 ring-destructive/10' : 'border-t-warning'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-black flex items-center gap-1.5 ${status.weekLocked ? 'text-destructive' : 'text-zinc-900 dark:text-white'}`}>
            <span className={`material-symbols-outlined text-base ${status.weekLocked ? 'text-destructive' : 'text-warning'}`}>
              {status.weekLocked ? 'lock' : 'event_available'}
            </span>
            {t("memberPortal.checkin.title")}
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            {status.weekLocked 
              ? "Chuỗi điểm danh đã bị huỷ do bạn bỏ lỡ 1 ngày. Vui lòng quay lại vào Thứ Hai tuần sau."
              : t("memberPortal.checkin.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {rewardTable.map((amount, idx) => {
          const day = idx + 1;
          const claimed = status.claimedDaysThisWeek.includes(day);
          const isToday = status.todayDayOfWeek === day;
          return (
            <div
              key={day}
              className={`flex flex-col items-center gap-1 py-2 sm:py-3 rounded-xl border text-center transition-all ${
                claimed
                  ? "bg-success/10 border-success/40 shadow-sm shadow-success/10"
                  : status.weekLocked
                    ? "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 opacity-40 grayscale"
                    : isToday
                      ? "bg-warning/10 dark:bg-warning/10 border-warning ring-2 ring-warning/40 shadow-sm shadow-warning/20 transform scale-105"
                      : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60 opacity-80"
              }`}
            >
              <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-400">{t("memberPortal.checkin.dayLabel", { day })}</span>
              {claimed ? (
                <span className="material-symbols-outlined text-success text-sm sm:text-base">check_circle</span>
              ) : status.weekLocked ? (
                <span className="material-symbols-outlined text-zinc-400 text-sm sm:text-base">lock</span>
              ) : (
                <span className="material-symbols-outlined text-warning text-sm sm:text-base">paid</span>
              )}
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold ${claimed ? 'text-success' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {amount}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        {[
          { threshold: 14, bonus: 2100, awarded: status.milestone14Awarded },
          { threshold: 30, bonus: 4500, awarded: status.milestone30Awarded },
        ].map(m => (
          <div key={m.threshold} className={`w-full flex-1 flex items-center justify-between gap-1 px-3 py-2.5 rounded-xl border text-[10px] transition-all ${
            m.awarded 
              ? "bg-success/10 border-success/40 shadow-sm" 
              : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60"
          }`}>
            <span className={`font-bold flex items-center ${m.awarded ? 'text-success' : 'text-zinc-600 dark:text-zinc-300'}`}>
              {m.awarded && <span className="material-symbols-outlined text-[12px] mr-1.5">verified</span>}
              {t("memberPortal.checkin.milestone", { days: m.threshold })}
            </span>
            <span className={`font-mono font-bold ${m.awarded ? 'text-success' : 'text-warning'}`}>+{m.bonus}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-col">
          <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            {t("memberPortal.checkin.streakLabel", { count: status.consecutiveDays })}
          </p>
          {status.weekLocked && (
            <span className="text-[9px] text-destructive font-semibold mt-0.5">Mở lại vào thứ Hai</span>
          )}
        </div>
        <button
          onClick={handleClaim}
          disabled={!status.canClaimToday || claiming}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 ${
            status.weekLocked
              ? "bg-destructive/10 text-destructive border border-destructive/20 cursor-not-allowed opacity-80"
              : status.alreadyClaimedToday
                ? "bg-success/10 text-success border border-success/20 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
          }`}
        >
          {claiming ? (
            <span className="material-symbols-outlined text-sm animate-spin">hourglass_empty</span>
          ) : status.weekLocked ? (
            <><span className="material-symbols-outlined text-sm">lock</span> {t("memberPortal.checkin.locked")}</>
          ) : status.alreadyClaimedToday ? (
            <><span className="material-symbols-outlined text-sm">done_all</span> {t("memberPortal.checkin.alreadyClaimed")}</>
          ) : (
            <><span className="material-symbols-outlined text-sm animate-bounce">touch_app</span> {t("memberPortal.checkin.claimButton")}</>
          )}
        </button>
      </div>
    </div>
  );
}
