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
    return <div className="py-8 text-center text-xs text-zinc-400">{t("memberPortal.checkin.loading")}</div>;
  }

  const rewardTable = status.rewardTable || [150, 240, 240, 240, 240, 240, 450];

  return (
    <div className="bg-white dark:bg-[#15131e] rounded-3xl border border-zinc-200 dark:border-white/10 border-t-4 border-t-warning p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-warning text-base">event_available</span>
            {t("memberPortal.checkin.title")}
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t("memberPortal.checkin.subtitle")}</p>
        </div>
        {status.weekLocked && (
          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20">
            {t("memberPortal.checkin.locked")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {rewardTable.map((amount, idx) => {
          const day = idx + 1;
          const claimed = status.claimedDaysThisWeek.includes(day);
          const isToday = status.todayDayOfWeek === day;
          return (
            <div
              key={day}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all ${
                claimed
                  ? "bg-success/10 border-success/50"
                  : isToday
                    ? "bg-warning/10 dark:bg-warning/10 border-warning ring-2 ring-warning/40"
                    : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60 opacity-70"
              }`}
            >
              <span className="text-[8px] font-bold uppercase text-zinc-400">{t("memberPortal.checkin.dayLabel", { day })}</span>
              {claimed ? (
                <span className="material-symbols-outlined text-success text-base">check_circle</span>
              ) : (
                <span className="material-symbols-outlined text-warning text-base">paid</span>
              )}
              <span className="text-[9px] font-mono font-bold text-zinc-700 dark:text-zinc-300">{amount}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {[
          { threshold: 14, bonus: 2100, awarded: status.milestone14Awarded },
          { threshold: 30, bonus: 4500, awarded: status.milestone30Awarded },
        ].map(m => (
          <div key={m.threshold} className={`flex-1 flex items-center justify-between gap-1 px-3 py-2 rounded-xl border text-[10px] ${
            m.awarded ? "bg-success/10 border-success/40" : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/60"
          }`}>
            <span className="font-bold text-zinc-600 dark:text-zinc-300">{t("memberPortal.checkin.milestone", { days: m.threshold })}</span>
            <span className="font-mono font-bold text-warning">+{m.bonus}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {t("memberPortal.checkin.streakLabel", { count: status.consecutiveDays })}
        </p>
        <button
          onClick={handleClaim}
          disabled={!status.canClaimToday || claiming}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {claiming
            ? "..."
            : status.alreadyClaimedToday
              ? t("memberPortal.checkin.alreadyClaimed")
              : status.weekLocked
                ? t("memberPortal.checkin.locked")
                : t("memberPortal.checkin.claimButton")}
        </button>
      </div>
    </div>
  );
}
