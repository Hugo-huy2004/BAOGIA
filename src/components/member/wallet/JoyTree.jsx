import { useTranslation } from "react-i18next";
import { TREE_STAGES, TREE_BONUS_JOY, treeStage } from "../../../../shared/joyPrices.js";

/**
 * Cây Nhiệm Vụ 3D Chuẩn Đồ Họa (Hugo Quest Studio)
 * Thiết kế đồ họa liền khối 100% — không bị rời rạc hay lệch các bộ phận.
 */
export default function JoyTree({ claimed = 0, total = 0, bonusClaimed = false, busy = false, onClaimBonus }) {
  const { t } = useTranslation();
  const stage = treeStage(claimed, total);
  const complete = total > 0 && claimed >= total;
  const stageName = TREE_STAGES[stage];

  return (
    <section className={`relative overflow-hidden rounded-3xl p-4 transition-all duration-300 ${
      complete
        ? "bg-gradient-to-br from-amber-500/15 via-yellow-400/20 to-emerald-500/15 border-2 border-amber-400/60 shadow-[0_12px_32px_rgba(245,158,11,0.25)]"
        : "bg-gradient-to-br from-emerald-500/10 via-teal-500/15 to-emerald-600/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm"
    }`}>
      {/* Background Aura Glow */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        {/* Animated 3D Graphic Tree Canvas */}
        <div className="relative shrink-0 w-24 h-24 flex items-center justify-center p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white dark:border-slate-800 shadow-sm">
          <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="leafGradMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="leafGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Bóng đất mầm */}
            <ellipse cx="60" cy="104" rx="36" ry="7" className="fill-emerald-800/20 dark:fill-emerald-400/20" />
            <path d="M 34 104 Q 60 94 86 104 Q 60 112 34 104 Z" className="fill-emerald-700/30 dark:fill-emerald-500/30" />

            {/* GIAI ĐOẠN 0: Hạt mầm mới nhú */}
            {stage === 0 && (
              <g className="animate-pulse">
                <ellipse cx="60" cy="100" rx="6" ry="4.5" className="fill-amber-800 dark:fill-amber-700" />
                <path d="M 60 97 C 60 91 63 88 64 84" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="64" cy="83" r="2.5" className="fill-emerald-400" />
              </g>
            )}

            {/* GIAI ĐOẠN 1: Mầm cây vươn lá (LIỀN MẠCH 100%) */}
            {stage === 1 && (
              <g className="animate-bounce" style={{ animationDuration: "2.5s" }}>
                {/* Thân mầm */}
                <path d="M 60 102 C 60 90 60 80 60 74" stroke="#059669" strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Lá trái gắn chặt thân */}
                <path d="M 60 84 Q 44 74 42 86 Q 54 92 60 84 Z" fill="url(#leafGradLight)" />
                {/* Lá phải gắn chặt thân */}
                <path d="M 60 80 Q 76 70 78 82 Q 66 88 60 80 Z" fill="url(#leafGradMain)" />
                {/* Chồi non ở đỉnh */}
                <circle cx="60" cy="72" r="4" fill="#a7f3d0" />
              </g>
            )}

            {/* GIAI ĐOẠN 2: Cây con vươn cành */}
            {stage === 2 && (
              <g>
                <path d="M 56 102 L 57 65 L 63 65 L 64 102 Z" fill="url(#trunkGrad)" />
                <circle cx="60" cy="54" r="16" fill="url(#leafGradMain)" />
                <circle cx="46" cy="62" r="13" fill="url(#leafGradLight)" />
                <circle cx="74" cy="62" r="13" fill="url(#leafGradMain)" />
                <circle cx="60" cy="44" r="12" fill="url(#leafGradLight)" />
              </g>
            )}

            {/* GIAI ĐOẠN 3-4: Cây lớn xum xuê */}
            {stage >= 3 && stage < 5 && (
              <g>
                <path d="M 54 103 L 56 50 L 64 50 L 66 103 Z" fill="url(#trunkGrad)" />
                <circle cx="60" cy="50" r="20" fill="url(#leafGradMain)" />
                <circle cx="42" cy="60" r="16" fill="url(#leafGradLight)" />
                <circle cx="78" cy="60" r="16" fill="url(#leafGradMain)" />
                <circle cx="50" cy="38" r="15" fill="url(#leafGradLight)" />
                <circle cx="70" cy="38" r="15" fill="url(#leafGradMain)" />
                <circle cx="60" cy="28" r="14" fill="url(#leafGradLight)" />
              </g>
            )}

            {/* GIAI ĐOẠN 5+: Cổ thụ thần cây huyền thoại (100% Hoàn Thành) */}
            {stage >= 5 && (
              <g>
                <path d="M 52 104 L 55 42 L 65 42 L 68 104 Z" fill="url(#trunkGrad)" />
                <circle cx="60" cy="46" r="24" fill="url(#leafGradMain)" />
                <circle cx="38" cy="58" r="18" fill="url(#leafGradLight)" />
                <circle cx="82" cy="58" r="18" fill="url(#leafGradMain)" />
                <circle cx="46" cy="32" r="17" fill="url(#leafGradLight)" />
                <circle cx="74" cy="32" r="17" fill="url(#leafGradMain)" />
                <circle cx="60" cy="22" r="16" fill="url(#leafGradLight)" />

                {/* Quả JOY vàng óng tỏa sáng */}
                {[{ cx: 42, cy: 52 }, { cx: 78, cy: 50 }, { cx: 60, cy: 34 }].map((f, i) => (
                  <g key={i} className="animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>
                    <circle cx={f.cx} cy={f.cy} r="6" className="fill-amber-400 stroke-amber-200 stroke-1" />
                    <circle cx={f.cx - 2} cy={f.cy - 2} r="1.8" className="fill-white opacity-90" />
                  </g>
                ))}
              </g>
            )}
          </svg>

          {/* Vương miện Thần Cây */}
          {complete && (
            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg text-xs animate-pulse">
              👑
            </span>
          )}
        </div>

        {/* Tree Progress & Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t(`memberPortal.walletApp.tree.${stageName}`)}
            </h4>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {claimed}/{total} {t("memberPortal.walletApp.tabMissions")}
            </span>
          </div>

          {/* 3D Segmented Progress Bar */}
          <div className="flex items-center gap-1.5 py-0.5">
            {Array.from({ length: total }, (_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  index < claimed
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>

          {/* Reward CTA / Hint Text */}
          {complete ? (
            bonusClaimed ? (
              <div className="flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>{t("memberPortal.walletApp.tree.bonusTaken", { amount: TREE_BONUS_JOY })}</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onClaimBonus}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 animate-bounce"
              >
                <span className="material-symbols-outlined text-sm">stars</span>
                <span>{t("memberPortal.walletApp.tree.claimBonus", { amount: TREE_BONUS_JOY })}</span>
              </button>
            )
          ) : (
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-emerald-500">park</span>
              <span>{t("memberPortal.walletApp.tree.keepGoing", { count: total - claimed, amount: TREE_BONUS_JOY })}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
