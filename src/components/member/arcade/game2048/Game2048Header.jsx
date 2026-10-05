import { memo } from "react";
import { BotAvatar } from "bot-avatars";

function Game2048Header({
  score,
  scoreDelta,
  fever,
  comboMultiplier,
  highestBot,
  recordBot,
  isHammerMode,
  hammers,
  notice,
  paused,
  onCancelHammer,
}) {
  return (
    <div className="w-full max-w-[430px] flex flex-col gap-2 z-10">
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl px-3.5 py-2 shadow-md">
        {/* 1. Điểm số + Fever + Combo */}
        <div className="relative flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            stars
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight transition-all duration-150 ${
                scoreDelta
                  ? "text-cyan-200 scale-105 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  : "text-cyan-300 drop-shadow"
              }`}
            >
              {score.toLocaleString()}
            </span>
            {fever > 0 ? (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[13px] font-black animate-pulse">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                ×2
              </span>
            ) : comboMultiplier > 1 ? (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[13px] font-black animate-pulse">
                <span className="material-symbols-outlined text-sm">bolt</span>
                ×{comboMultiplier.toFixed(1)}
              </span>
            ) : null}
          </div>

          {scoreDelta && (
            <span className="absolute -top-5 left-7 text-[13px] font-black text-cyan-100 bg-cyan-950/95 border border-cyan-300/80 px-2 py-0.5 rounded-full shadow-md animate-float-up pointer-events-none whitespace-nowrap z-30">
              +{scoreDelta.amount.toLocaleString()}
            </span>
          )}
        </div>

        {/* 2. Cặp linh thú: Cao nhất ván này & Kỷ lục mọi thời đại */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-400 text-xl">
              workspace_premium
            </span>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/80 ring-2 ring-amber-400/60 flex items-center justify-center overflow-hidden shadow-sm">
              <BotAvatar
                type={highestBot.type}
                color={highestBot.color}
                face={highestBot.face}
                state={highestBot.state}
                shading={highestBot.shading}
                hat={highestBot.hat}
                glasses={highestBot.glasses}
                headphones={highestBot.headphones}
                bowTie={highestBot.bowTie}
                size={40}
                paused={paused}
              />
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800" />

          <div className="flex items-center gap-1.5 opacity-85">
            <span className="material-symbols-outlined text-purple-400 text-xl">
              emoji_events
            </span>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/80 ring-1 ring-purple-400/50 flex items-center justify-center overflow-hidden shadow-sm">
              <BotAvatar
                type={recordBot.type}
                color={recordBot.color}
                face={recordBot.face}
                state={recordBot.state}
                shading={recordBot.shading}
                hat={recordBot.hat}
                glasses={recordBot.glasses}
                headphones={recordBot.headphones}
                bowTie={recordBot.bowTie}
                size={38}
                paused={paused}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banner Chế độ Búa Phá Ô */}
      {isHammerMode && (
        <div className="flex items-center justify-between bg-amber-950/90 border border-amber-500/80 rounded-xl px-3.5 py-2 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5">
            <img src="/images/wooden_hammer.png" alt="Búa gỗ" className="w-6 h-6 object-contain" />
            <span className="text-[13px] font-bold text-amber-200">
              Chạm vào 1 ô để đập vỡ! (Còn ×{hammers})
            </span>
          </div>
          <button
            onClick={onCancelHammer}
            className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-[13px] font-bold rounded-lg border border-amber-400/50 min-h-[36px] flex items-center justify-center active:scale-95"
          >
            Huỷ
          </button>
        </div>
      )}

      {notice && !isHammerMode && (
        <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border border-amber-400/50 rounded-xl px-3 py-1.5 text-center shadow-md">
          <span className="text-[13px] font-bold text-amber-300 tracking-wide">
            {notice}
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(Game2048Header);
