import { memo } from "react";
import { BotAvatar } from "bot-avatars";
import { BOT_TIERS } from "./game2048Logic";

function Game2048Cell({
  r,
  c,
  tile,
  isSmashingThis,
  smashPhase,
  isHammerMode,
  isSliding,
  lastMoveDir,
  paused,
  onCellClick,
}) {
  const tier = tile ? BOT_TIERS[tile.level] || BOT_TIERS[1] : null;

  return (
    <div
      onClick={() => onCellClick(r, c)}
      className={`relative aspect-square rounded-2xl flex items-center justify-center p-1 select-none transition-all duration-150 ${
        isSmashingThis
          ? "z-40 overflow-visible bg-slate-950/90 ring-4 ring-amber-400 shadow-md shadow-amber-500/50"
          : isHammerMode && tile
          ? "ring-2 ring-rose-400 border-2 border-rose-500 shadow-sm shadow-rose-500/40 cursor-crosshair hover:scale-105 active:scale-95 overflow-hidden"
          : tile?.type === "ice"
          ? "bg-gradient-to-br from-sky-200 via-cyan-400 to-blue-600 border-2 border-cyan-100 shadow-sm shadow-cyan-500/30 overflow-hidden"
          : tile
          ? `bg-gradient-to-br ${tier?.bgClass || ""} ${tier?.glowClass || ""} border ${
              tile.isMerged ? "animate-fusion-pop z-20" : ""
            } overflow-hidden`
          : "bg-slate-900/60 border border-slate-800/60 shadow-inner overflow-hidden"
      }`}
    >
      {tile?.type === "ice" ? (
        <>
          <div
            style={{ transformOrigin: "bottom center" }}
            className={`w-full h-full rounded-xl select-none relative overflow-hidden flex items-center justify-center ${
              smashPhase === "squash"
                ? "animate-calm-squash"
                : smashPhase === "fade"
                ? "animate-calm-dissolve"
                : isSliding && lastMoveDir
                ? `animate-tile-flow-${lastMoveDir}`
                : tile.isNew
                ? "animate-tile-spring-pop"
                : ""
            }`}
          >
            <div className="absolute inset-0 border-t-2 border-l-2 border-white/80 border-b-2 border-r-2 border-blue-800/60 rounded-xl pointer-events-none" />
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/70 via-white/20 to-transparent rotate-45 pointer-events-none" />
            <div className="absolute top-1 left-1.5 w-6 h-1.5 bg-white/60 rounded-full rotate-[-25deg] pointer-events-none" />

            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
              viewBox="0 0 100 100"
              fill="none"
              stroke="white"
              strokeWidth={tile.turnsLeft <= 1 ? "2.5" : "1.8"}
              strokeLinecap="round"
            >
              <path d="M12 12 L35 38 L28 62 L48 88" />
              <path d="M88 15 L62 42 L68 70 L52 90" />
              {tile.turnsLeft <= 1 && (
                <>
                  <path d="M35 38 L62 42" stroke="#bae6fd" strokeWidth="2" />
                  <path d="M28 62 L68 70" stroke="#bae6fd" strokeWidth="2" />
                  <path d="M10 50 L28 62" stroke="#e0f2fe" strokeWidth="1.5" />
                  <path d="M90 50 L68 70" stroke="#e0f2fe" strokeWidth="1.5" />
                </>
              )}
            </svg>

            <span className="relative z-10 text-[36px] sm:text-[40px] font-black text-white font-mono leading-none tracking-tight filter drop-shadow-[0_2px_4px_rgba(2,132,199,0.9)]">
              {tile.turnsLeft}
            </span>
          </div>

          {isHammerMode && !isSmashingThis && !smashPhase && (
            <div className="absolute inset-0 bg-rose-500/20 rounded-2xl pointer-events-none flex items-center justify-center z-20">
              <span className="material-symbols-outlined text-rose-300 text-3xl animate-ping pointer-events-none drop-shadow">
                adjust
              </span>
            </div>
          )}

          {isSmashingThis && (
            <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
              <div className="absolute -top-7 -right-7 w-20 h-20 animate-calm-hammer">
                <img
                  src="/images/wooden_hammer.png"
                  alt="Búa đập"
                  className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                />
              </div>
              {(smashPhase === "squash" || smashPhase === "fade") && (
                <div className="absolute inset-2 rounded-2xl border-2 border-cyan-200/80 animate-gentle-halo pointer-events-none" />
              )}
            </div>
          )}
        </>
      ) : tile && tier ? (
        <>
          {tile.isMerged && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none z-30 flex items-center justify-center overflow-hidden">
              <span
                className="w-full h-full rounded-2xl border-2 animate-fusion-halo pointer-events-none"
                style={{ borderColor: tier.color }}
              />
            </div>
          )}

          <div
            style={{ transformOrigin: "bottom center" }}
            className={`w-full h-full flex items-center justify-center p-0.5 ${
              smashPhase === "squash"
                ? "animate-calm-squash"
                : smashPhase === "fade"
                ? "animate-calm-dissolve"
                : isSliding && lastMoveDir
                ? `animate-tile-flow-${lastMoveDir}`
                : tile.isNew
                ? "animate-tile-spring-pop"
                : ""
            }`}
          >
            <BotAvatar
              type={tier.type}
              color={tier.color}
              face={tier.face}
              state={tile.isMerged ? "working" : tier.state}
              shading={tier.shading}
              hat={tier.hat}
              glasses={tier.glasses}
              headphones={tier.headphones}
              bowTie={tier.bowTie}
              size={76}
              paused={paused}
            />
          </div>

          {isHammerMode && tile && !isSmashingThis && !smashPhase && (
            <div className="absolute inset-0 bg-rose-500/15 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-300 text-2xl animate-ping pointer-events-none drop-shadow">
                adjust
              </span>
            </div>
          )}

          {isSmashingThis && (
            <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
              <div className="absolute -top-7 -right-7 w-20 h-20 animate-calm-hammer">
                <img
                  src="/images/wooden_hammer.png"
                  alt="Búa đập"
                  className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                />
              </div>
              {(smashPhase === "squash" || smashPhase === "fade") && (
                <div className="absolute inset-2 rounded-2xl border-2 border-amber-300/80 animate-gentle-halo pointer-events-none" />
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default memo(Game2048Cell);
