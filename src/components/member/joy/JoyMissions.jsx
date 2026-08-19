import { useState } from "react";
import { claimChallenge } from "../../../services/joyApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useTranslation } from "react-i18next";
import { hapticSelect } from "../../../utils/haptics";
import { useJoy } from "../../../lib/joyDisplay";

/**
 * NHIỆM VỤ PHẢI MỞ ĐƯỢC CHỖ LÀM NÓ.
 *
 * Bản trước nút "Thực Hiện" chỉ bắn một toast "Khởi động nhiệm vụ…" rồi thôi:
 * người dùng bấm bảy nút, không nút nào đi đâu, và không chỗ nào nói nhiệm vụ
 * ấy làm ở app nào. Đây là bảng tra chỗ làm — id nhiệm vụ do máy chủ đặt
 * (server/routes/companionRoutes.js · DAILY_CHALLENGES), đừng đổi.
 */
const MISSION_TARGETS = {
  breath: { icon: "air", utility: "psychology" },
  chat: { icon: "forum", utility: "psychology" },
  assessment: { icon: "assignment", utility: "psychology" },
  sleep: { icon: "bedtime", utility: "psychology" },
  arcade: { icon: "sports_esports", utility: "arcade" },
  focus: { icon: "timer", utility: "aura" },
  // Điểm danh nằm ngay trong ví, tab Tổng quan — không phải một app riêng.
  checkin: { icon: "event_available", walletTab: "overview" },
};

const FALLBACK_ICON = "task_alt";

export default function JoyMissions({ email, showToast, challenges = [], loading, onReload, onSelectUtility, onGoToWalletTab }) {
  const { t } = useTranslation();
  const joy = useJoy();
  const { text: money } = joy;
  const [claimingId, setClaimingId] = useState(null);
  const setBalance = useJoyStore((s) => s.setBalance);

  const pending = challenges.filter((c) => c.completed && !c.claimed);
  const completedCount = challenges.filter((c) => c.completed).length;

  async function claimOne(id) {
    if (claimingId) return;
    hapticSelect();
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

  async function claimAll() {
    if (!pending.length || claimingId) return;
    hapticSelect();
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

  /** Chỗ làm nhiệm vụ + nhãn của chỗ đó. Không có chỗ thì trả null, không vẽ nút chết. */
  function destinationOf(id) {
    const target = MISSION_TARGETS[id];
    if (!target) return null;
    if (target.walletTab) {
      if (!onGoToWalletTab) return null;
      return {
        label: t("memberPortal.accountHub.missionCopy.goOverview"),
        go: () => onGoToWalletTab(target.walletTab),
      };
    }
    if (!onSelectUtility) return null;
    return {
      label: t("memberPortal.accountHub.missionCopy.goTo", { app: t(`utilities.catalog.${target.utility}.title`) }),
      go: () => onSelectUtility(target.utility),
    };
  }

  const card = "rounded-2xl border border-border bg-card";

  return (
    <div className="space-y-3 select-none">
      {pending.length > 0 && (
        <button
          type="button"
          onClick={claimAll}
          disabled={claimingId === "all"}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]">redeem</span>
          <span>
            {claimingId === "all"
              ? t("memberPortal.accountHub.missionCopy.claiming")
              : t("memberPortal.accountHub.missionCopy.claimAll", { amount: pending.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) })}
          </span>
        </button>
      )}

      <section className="space-y-2">
        <h3 className="px-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
          {t("memberPortal.accountHub.missionCopy.heading", { completed: completedCount, total: challenges.length })}
        </h3>

        {loading ? (
          <p className={`p-6 text-center text-[13.5px] text-muted-foreground ${card}`}>
            {t("memberPortal.accountHub.missionCopy.loading")}
          </p>
        ) : challenges.length === 0 ? (
          <p className={`p-6 text-center text-[13.5px] text-muted-foreground ${card}`}>
            {t("memberPortal.accountHub.missionCopy.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {challenges.map((c) => {
              const icon = MISSION_TARGETS[c.id]?.icon || FALLBACK_ICON;
              const destination = c.claimed || c.completed ? null : destinationOf(c.id);
              const busy = claimingId === c.id || claimingId === "all";

              // Ba trạng thái, ba việc khác nhau — nên hàng cũng bấm khác nhau:
              // chưa xong thì CẢ HÀNG mở chỗ làm (vùng chạm to hơn nút con 28px
              // của bản cũ), xong rồi thì hàng đứng yên để nút Nhận không bị
              // bấm nhầm, đã nhận thì không bấm được nữa.
              const body = (
                <>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    c.claimed ? "bg-muted text-muted-foreground" : c.completed ? "bg-success/10 text-success" : "bg-muted text-foreground"
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">{c.claimed ? "check" : icon}</span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14.5px] font-bold leading-snug ${c.claimed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {c.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                      {c.claimed
                        ? t("memberPortal.accountHub.missionCopy.rewardClaimed")
                        : c.completed
                          ? t("memberPortal.accountHub.missionCopy.rewardReady", { amount: c.amount })
                          : `+${money(c.amount)}${destination ? ` · ${destination.label}` : ""}`}
                    </span>
                  </span>
                </>
              );

              if (c.claimed) {
                return (
                  <li key={c.id} className={`flex items-center gap-3 p-3.5 opacity-60 ${card}`}>
                    {body}
                  </li>
                );
              }

              if (c.completed) {
                return (
                  <li key={c.id} className={`flex items-center gap-3 p-3.5 border-success/40 ${card}`}>
                    {body}
                    <button
                      type="button"
                      onClick={() => claimOne(c.id)}
                      disabled={Boolean(claimingId)}
                      className="h-11 shrink-0 rounded-xl bg-success px-4 text-[14px] font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
                    >
                      {busy ? t("memberPortal.accountHub.missionCopy.claiming") : t("memberPortal.accountHub.missionCopy.claim")}
                    </button>
                  </li>
                );
              }

              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={!destination}
                    onClick={() => { hapticSelect(); destination?.go(); }}
                    className={`flex w-full items-center gap-3 p-3.5 text-left transition-transform ${card} ${
                      destination ? "active:scale-[0.99]" : "cursor-default"
                    }`}
                  >
                    {body}
                    {destination && (
                      <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground">chevron_right</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
