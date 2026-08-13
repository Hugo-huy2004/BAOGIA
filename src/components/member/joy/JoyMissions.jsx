import { useState } from "react";
import { claimChallenge } from "../../../services/joyApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useTranslation } from "react-i18next";

/**
 * Danh sách nhiệm vụ nhận JOY. Thẻ điểm danh KHÔNG ở đây: nó là thao tác một
 * chạm mỗi ngày nên nằm thẳng ngoài trang Tài khoản, mở sheet mới bấm được thì
 * thừa một lớp.
 *
 * Danh sách nhiệm vụ do trang Tài khoản nạp (nó cũng cần con số để hiện trên
 * hàng "Nhiệm vụ"), truyền xuống đây — một lượt gọi cho cả hai chỗ.
 */
export default function JoyMissions({ email, showToast, challenges = [], loading, onReload }) {
  const { t } = useTranslation();
  const [claimingId, setClaimingId] = useState(null);
  const setBalance = useJoyStore((s) => s.setBalance);

  const pending = challenges.filter((c) => c.completed && !c.claimed);
  const completedCount = challenges.filter((c) => c.completed).length;

  async function claimOne(id) {
    if (claimingId) return;
    setClaimingId(id);
    try {
      const data = await claimChallenge(email, id);
      setBalance(data.balance);
      const def = challenges.find((c) => c.id === id);
      showToast?.(t("memberPortal.accountHub.missionCopy.claimedJoy", { amount: def?.amount ?? "" }), "success");
      onReload?.();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaimingId(null);
    }
  }

  // Nhận hết một lượt. Ba nhiệm vụ xong mà bắt bấm ba lần là ba lần chờ mạng.
  async function claimAll() {
    if (!pending.length || claimingId) return;
    setClaimingId("all");
    let total = 0;
    try {
      for (const mission of pending) {
        const data = await claimChallenge(email, mission.id);
        setBalance(data.balance);
        total += Number(mission.amount) || 0;
      }
      showToast?.(t("memberPortal.accountHub.missionCopy.claimedAll", { total, count: pending.length }), "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaimingId(null);
      onReload?.();
    }
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={claimAll}
          disabled={claimingId === "all"}
          className="min-h-[52px] w-full rounded-2xl bg-primary text-[16px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {claimingId === "all"
            ? t("memberPortal.accountHub.missionCopy.claiming")
            : t("memberPortal.accountHub.missionCopy.claimAll", { amount: pending.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) })}
        </button>
      )}

      <section className="space-y-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("memberPortal.accountHub.missionCopy.heading", { completed: completedCount, total: challenges.length })}
        </h3>

        {loading ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.missionCopy.loading")}</p>
        ) : challenges.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.missionCopy.empty")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {challenges.map((c, i) => (
              <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <span className={`material-symbols-outlined text-[22px] ${c.claimed ? "text-muted-foreground" : "text-foreground"}`}>
                  {c.claimed ? "check_circle" : c.completed ? "redeem" : "radio_button_unchecked"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] font-medium ${c.claimed ? "text-muted-foreground" : "text-foreground"}`}>{c.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {c.claimed
                      ? t("memberPortal.accountHub.missionCopy.rewardClaimed")
                      : c.completed
                        ? t("memberPortal.accountHub.missionCopy.rewardReady", { amount: c.amount })
                        : t("memberPortal.accountHub.missionCopy.incomplete", { amount: c.amount })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => claimOne(c.id)}
                  disabled={!c.completed || c.claimed || Boolean(claimingId)}
                  className="min-h-[36px] shrink-0 rounded-full bg-muted px-3.5 text-[13px] font-semibold text-foreground transition-colors disabled:opacity-45 enabled:hover:bg-border"
                >
                  {claimingId === c.id ? "…" : c.claimed ? t("memberPortal.accountHub.missionCopy.claimed") : t("memberPortal.accountHub.missionCopy.claim")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
