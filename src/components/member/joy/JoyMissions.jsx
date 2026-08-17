import { useState } from "react";
import { claimChallenge } from "../../../services/joyApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useTranslation } from "react-i18next";
import { hapticSelect } from "../../../utils/haptics";
import { useJoy } from "../../../lib/joyDisplay";

// Map Graphical Category Icons & Color Gradients
function getMissionGraphic(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hít thở") || n.includes("breathe")) {
    return { icon: "air", gradient: "from-cyan-500 to-blue-500", glow: "shadow-cyan-500/20" };
  }
  if (n.includes("trò chuyện") || n.includes("chat") || n.includes("ai")) {
    return { icon: "psychology", gradient: "from-indigo-500 to-purple-600", glow: "shadow-indigo-500/20" };
  }
  if (n.includes("test") || n.includes("tâm lý") || n.includes("quiz")) {
    return { icon: "quiz", gradient: "from-fuchsia-500 to-pink-500", glow: "shadow-fuchsia-500/20" };
  }
  if (n.includes("giấc ngủ") || n.includes("sleep") || n.includes("nhật ký")) {
    return { icon: "bedtime", gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" };
  }
  if (n.includes("arcade") || n.includes("game") || n.includes("chơi")) {
    return { icon: "sports_esports", gradient: "from-purple-600 to-indigo-600", glow: "shadow-purple-500/20" };
  }
  if (n.includes("điểm danh") || n.includes("checkin")) {
    return { icon: "verified", gradient: "from-amber-400 to-yellow-500", glow: "shadow-amber-400/25" };
  }
  if (n.includes("tập trung") || n.includes("focus") || n.includes("phiên")) {
    return { icon: "timer", gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20" };
  }
  return { icon: "task_alt", gradient: "from-blue-500 to-indigo-500", glow: "shadow-blue-500/20" };
}

/**
 * Danh sách Nhiệm Vụ 3D Gamified Hub (Hugo Quest Studio)
 * Giao diện thẻ đồ họa rực rỡ, icon 3D cá tính, hiệu ứng nhận thưởng sống động.
 */
export default function JoyMissions({ email, showToast, challenges = [], loading, onReload }) {
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

  return (
    <div className="space-y-4 select-none">
      {/* Mega Claim All Button */}
      {pending.length > 0 && (
        <button
          type="button"
          onClick={claimAll}
          disabled={claimingId === "all"}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-base shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl animate-spin" style={{ animationDuration: "3s" }}>
            auto_awesome
          </span>
          <span>
            {claimingId === "all"
              ? t("memberPortal.accountHub.missionCopy.claiming")
              : t("memberPortal.accountHub.missionCopy.claimAll", { amount: pending.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) })}
          </span>
        </button>
      )}

      {/* Mission List Section */}
      <section className="space-y-2.5">
        <header className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-500">assignment_turned_in</span>
            <span>{t("memberPortal.accountHub.missionCopy.heading", { completed: completedCount, total: challenges.length })}</span>
          </h3>
        </header>

        {loading ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-emerald-500 animate-spin">progress_activity</span>
            <p className="text-sm font-bold text-slate-400">{t("memberPortal.accountHub.missionCopy.loading")}</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-slate-400">task</span>
            <p className="text-sm font-bold text-slate-400">{t("memberPortal.accountHub.missionCopy.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {challenges.map((c) => {
              const gfx = getMissionGraphic(c.name);
              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex items-center gap-3.5 ${
                    c.claimed
                      ? "border-slate-200/60 dark:border-slate-800/60 opacity-75"
                      : c.completed
                        ? "border-emerald-400/60 dark:border-emerald-500/60 shadow-[0_4px_16px_rgba(16,185,129,0.12)]"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                  }`}
                >
                  {/* Graphical 3D Category Icon Box */}
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gfx.gradient} text-white flex items-center justify-center shrink-0 shadow-md ${gfx.glow}`}
                  >
                    <span className="material-symbols-outlined text-2xl font-bold">{gfx.icon}</span>
                  </div>

                  {/* Mission Title & Reward Tag */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[15px] font-extrabold truncate ${c.claimed ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                      {c.name}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-xs">monetization_on</span>
                        <span>+{money(c.amount)}</span>
                      </span>

                      {c.claimed && (
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
                          <span>Đã nhận thưởng</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Action Button */}
                  <div className="shrink-0">
                    {c.claimed ? (
                      <button
                        type="button"
                        disabled
                        className="py-1.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1 cursor-default"
                      >
                        <span className="material-symbols-outlined text-xs text-emerald-500">check</span>
                        <span>Đã nhận</span>
                      </button>
                    ) : c.completed ? (
                      <button
                        type="button"
                        onClick={() => claimOne(c.id)}
                        disabled={Boolean(claimingId)}
                        className="py-2 px-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all animate-pulse flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span>{claimingId === c.id ? "…" : "Nhận Thưởng"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          hapticSelect();
                          showToast?.(`🚀 Khởi động nhiệm vụ: ${c.name}! Hoàn thành để nhận +${money(c.amount)}`, "success");
                        }}
                        className="py-1.5 px-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all animate-pulse flex items-center gap-1"
                      >
                        <span>Thực Hiện</span>
                        <span className="material-symbols-outlined text-sm font-black">play_arrow</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
