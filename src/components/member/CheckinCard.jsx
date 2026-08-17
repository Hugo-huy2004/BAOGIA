import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useJoyStore } from "../../stores/joyStore";
import { localeForLanguage } from "../../i18n/languages";
import { useJoy } from "../../lib/joyDisplay";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function CheckinCard({ email, showToast, onClaimed }) {
  const { t, i18n } = useTranslation();
  const joy = useJoy();
  const { text: money } = joy;
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);
  const setBalance = useJoyStore((s) => s.setBalance);
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);

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
      // Ví đang mở thẻ này ngay màn chính: sổ giao dịch và danh sách nhiệm vụ
      // phải đổi theo ngay, không đợi lần mở app sau.
      onClaimed?.();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      claimingRef.current = false;
      setClaiming(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="flex min-h-[112px] items-center justify-center rounded-2xl border border-border bg-card text-[13px] text-muted-foreground">
        {t("memberPortal.checkin.loading")}
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-[13px] text-rose-500">
        {status.error}
      </div>
    );
  }

  const rewardTable = status.rewardTable || [150, 240, 240, 240, 240, 240, 450];
  const claimedDays = status.claimedDaysThisWeek || [];
  const todayReward = rewardTable[(status.todayDayOfWeek || 1) - 1];
  // Chỉ nhắc những mốc CHƯA nhận — mốc đã nhận rồi thì nhắc làm gì nữa.
  const pendingMilestones = [
    { label: t("memberPortal.checkin.milestone", { days: 14 }), bonus: 2100, awarded: status.milestone14Awarded },
    { label: t("memberPortal.checkin.milestone", { days: 30 }), bonus: 4500, awarded: status.milestone30Awarded },
  ].filter((m) => !m.awarded);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-left font-sans select-none">
      {/* Một dòng tiêu đề + chuỗi ngày. Bản cũ dành nguyên một khối header có
          icon 36px, tiêu đề in hoa và hai dòng mô tả cho việc này. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-[15px] font-semibold text-foreground">
          {status.weekLocked
            ? t("memberPortal.checkin.weekLockedTitle")
            : t("memberPortal.checkin.title")}
        </h3>
        {/* Mốc thưởng và phần thưởng ngày 7 vào tooltip: đó là thông tin để TRA
            một lần, không đáng chiếm hai dòng chữ mỗi ngày. */}
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[13px] font-semibold tabular-nums text-foreground"
          title={t("memberPortal.checkin.streakTooltip", {
            count: status.consecutiveDays,
            reward: money(rewardTable[6]),
            milestones: pendingMilestones.length
              ? ` · ${pendingMilestones.map((m) => `${m.label} +${money(m.bonus)}`).join(" · ")}`
              : "",
          })}
        >
          <span className="material-symbols-outlined text-[16px] text-muted-foreground" aria-hidden="true">
            local_fire_department
          </span>
          {status.consecutiveDays}
        </span>
      </div>

      {/* Bảy ô một hàng, mỗi ô cao 32px: trạng thái nói bằng màu, số JOY của
          từng ngày nằm ở tooltip — nhét cả icon lẫn "+240" vào mỗi ô là thứ
          đẩy thẻ cao gấp đôi mà chẳng ai đọc bảy lần. */}
      <div className="mt-2.5 grid grid-cols-7 gap-1.5">
        {rewardTable.map((amount, idx) => {
          const day = idx + 1;
          const claimed = claimedDays.includes(day);
          const isToday = status.todayDayOfWeek === day;
          const pending = isToday && !status.alreadyClaimedToday && !status.weekLocked;

          return (
            <span
              key={day}
              title={t("memberPortal.checkin.dayReward", {
                day,
                amount: money(amount),
              })}
              className={`flex h-7 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                claimed
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : pending
                    ? "bg-amber-500 text-white"
                    : isToday
                      ? "bg-muted text-foreground ring-1 ring-inset ring-border"
                      : "bg-muted text-muted-foreground"
              } ${status.weekLocked && !claimed ? "opacity-50" : ""}`}
            >
              {claimed ? (
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>
              ) : day === 7 ? (
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">card_giftcard</span>
              ) : (
                day
              )}
            </span>
          );
        })}
      </div>

      {/* Nút nói luôn trạng thái hôm nay — không cần thêm một cột chữ bên cạnh. */}
      <button
        type="button"
        onClick={handleClaim}
        disabled={!status.canClaimToday || claiming}
        className={`mt-3 min-h-[44px] w-full rounded-xl text-[15px] font-semibold transition-transform active:scale-[0.99] ${
          status.canClaimToday && !claiming
            ? "bg-amber-500 text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {claiming
          ? t("memberPortal.checkin.claiming")
          : status.weekLocked
            ? t("memberPortal.checkin.reopensMonday")
            : status.alreadyClaimedToday
              ? t("memberPortal.checkin.alreadyClaimedToday")
              : t("memberPortal.checkin.claimToday", {
                amount: todayReward ? money(todayReward) : "—",
              })}
      </button>
    </div>
  );
}
