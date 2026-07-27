import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useJoyStore } from "../../stores/joyStore";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function CheckinCard({ email, showToast }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);
  const setBalance = useJoyStore((s) => s.setBalance);

  const fetchStatus = useCallback(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`${apiBase}/checkin/status?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleClaim() {
    if (!email || claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    try {
      const r = await fetch(`${apiBase}/checkin/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.checkin.claimError"));
      setBalance(data.newBalance);
      const msg =
        data.bonusAwarded > 0
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
    return (
      <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 font-sans">
        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
        <span>{t("memberPortal.checkin.loading", "Đang tải dữ liệu điểm danh...")}</span>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="py-6 text-center text-xs text-rose-500 flex flex-col items-center gap-2 bg-rose-500/5 rounded-2xl border border-rose-500/20 p-4 font-sans">
        <span className="material-symbols-outlined text-lg">error</span>
        <span>{status.error}</span>
      </div>
    );
  }

  const rewardTable = status.rewardTable || [150, 240, 240, 240, 240, 240, 450];
  const claimedDays = status.claimedDaysThisWeek || [];

  return (
    <div className="bg-card border border-border/40 rounded-[22px] p-4 sm:p-5 space-y-4 shadow-xs text-left font-sans select-none">
      {/* ── 1. HEADER & STREAK BADGE ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 border-b border-border/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
              status.weekLocked ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {status.weekLocked ? "lock" : "local_fire_department"}
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span>{t("memberPortal.checkin.title", "Điểm Danh Nhận JOY")}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {status.weekLocked
                ? "Chuỗi bị ngắt do bỏ lỡ. Mở lại vào Thứ Hai."
                : t("memberPortal.checkin.subtitle", "Điểm danh liên tục 7 ngày để nhận quà JOY lớn")}
            </p>
          </div>
        </div>

        {/* Consecutive Streak Pill */}
        <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px] flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-xs text-amber-500">bolt</span>
          <span>{status.consecutiveDays} ngày</span>
        </div>
      </div>

      {/* ── 2. 7-DAY REWARD GRID (APPLE FITNESS TILES) ────────────────────── */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {rewardTable.map((amount, idx) => {
          const day = idx + 1;
          const claimed = claimedDays.includes(day);
          const isToday = status.todayDayOfWeek === day;
          const isDay7 = day === 7;

          return (
            <div
              key={day}
              className={`flex min-w-0 flex-col items-center justify-between py-2 px-1 rounded-2xl border text-center transition-all duration-200 ${
                claimed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : status.weekLocked
                  ? "bg-muted/40 border-border/20 opacity-50 grayscale"
                  : isToday && !status.alreadyClaimedToday
                  ? "bg-amber-500 text-white border-amber-400 shadow-sm scale-[1.03] ring-2 ring-amber-400/40"
                  : isToday
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold"
                  : "bg-background border-border/40 text-foreground/80 opacity-85"
              }`}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-tight opacity-75">
                N{day}
              </span>

              <div className="my-1">
                {claimed ? (
                  <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                ) : status.weekLocked ? (
                  <span className="material-symbols-outlined text-sm opacity-50">lock</span>
                ) : isDay7 ? (
                  <span className="material-symbols-outlined text-sm text-amber-400">card_giftcard</span>
                ) : (
                  <span className={`material-symbols-outlined text-sm ${isToday && !status.alreadyClaimedToday ? "text-white" : "text-amber-500"}`}>
                    paid
                  </span>
                )}
              </div>

              <span
                className={`text-[9px] font-mono font-black tracking-tight ${
                  claimed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isToday && !status.alreadyClaimedToday
                    ? "text-white"
                    : "text-foreground"
                }`}
              >
                +{amount}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── 3. MILESTONE BONUS PILLS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { threshold: 14, bonus: 2100, awarded: status.milestone14Awarded, label: "Mốc 14 ngày" },
          { threshold: 30, bonus: 4500, awarded: status.milestone30Awarded, label: "Mốc 30 ngày" }
        ].map((m) => (
          <div
            key={m.threshold}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
              m.awarded
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "bg-background/60 border-border/30 text-muted-foreground"
            }`}
          >
            <span className="flex min-w-0 items-center gap-1 font-bold truncate">
              <span className="material-symbols-outlined text-xs text-amber-500">
                {m.awarded ? "verified" : "military_tech"}
              </span>
              <span>{m.label}</span>
            </span>
            <span className={`font-mono font-bold ${m.awarded ? "text-emerald-500" : "text-amber-500"}`}>
              +{m.bonus.toLocaleString("vi-VN")}
            </span>
          </div>
        ))}
      </div>

      {/* ── 4. CLAIM BUTTON ────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-3">
        <div className="text-left">
          <span className="text-[10px] font-bold text-muted-foreground block">
            {status.weekLocked ? "Tự động reset:" : "Trạng thái hôm nay:"}
          </span>
          <span
            className={`text-xs font-bold block ${
              status.weekLocked
                ? "text-rose-500"
                : status.alreadyClaimedToday
                ? "text-emerald-500"
                : "text-amber-500"
            }`}
          >
            {status.weekLocked
              ? "Mở lại vào thứ Hai"
              : status.alreadyClaimedToday
              ? "✓ Đã nhận quà hôm nay"
              : "🔥 Sẵn sàng điểm danh"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClaim}
          disabled={!status.canClaimToday || claiming}
          className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all shrink-0 ${
            status.weekLocked
              ? "bg-muted text-muted-foreground border border-border/40 cursor-not-allowed opacity-60"
              : status.alreadyClaimedToday
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
          }`}
        >
          {claiming ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : status.weekLocked ? (
            <>
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Đã Khoá</span>
            </>
          ) : status.alreadyClaimedToday ? (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Đã Điểm Danh</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">touch_app</span>
              <span>Điểm Danh Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
