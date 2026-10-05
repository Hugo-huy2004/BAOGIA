import { memo, useState } from "react";

function SurvivorHud({
  hp = 5,
  maxHp = 5,
  weaponLevel = 1,
  score = 0,
  stage = 1,
  wave = 1,
  bossInfo = null,
  notice = "",
  muted = false,
  onToggleMute,
  stageProgress = null,
  waveProgress = null,
}) {
  const currentStage = stage || wave || 1;
  const progress = stageProgress || waveProgress;
  const [highScore] = useState(() => {
    try {
      return Number(localStorage.getItem("hugo_space_wars_highscore") || 0);
    } catch {
      return 0;
    }
  });
  const currentBest = Math.max(highScore, score);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 select-none overflow-hidden font-sans">
      {/* ── KÍNH BUỒNG LÁI SIÊU MỎNG (ULTRA-SLIM SCI-FI VISOR - TỐI ĐA KHÔNG GIAN CHIẾN ĐẤU) ── */}
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center justify-between gap-1.5 px-3 py-1 rounded-xl bg-slate-950/50 border border-cyan-500/30 backdrop-blur-md shadow-sm">
          {/* Cụm Trái: Nano Khiên & Cấp Nòng */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5" title="Năng lượng khiên">
              {Array.from({ length: maxHp }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-1.5 rounded-[2px] transition-all duration-150 ${
                    i < hp
                      ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee] border border-cyan-200"
                      : "bg-slate-800/60 opacity-25"
                  }`}
                />
              ))}
            </div>

            <div className="px-1.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/40 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px] text-amber-400">bolt</span>
              <span className="text-[13px] font-mono font-black text-cyan-200">
                L{weaponLevel}
              </span>
            </div>
          </div>

          {/* Cụm Giữa: Điểm Số & Kỷ Lục Gọn Gàng */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-mono font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
              {score.toLocaleString()}
            </span>
            <span className="text-[13px] font-mono text-slate-400 hidden sm:inline">
              TOP: {currentBest.toLocaleString()}
            </span>
          </div>

          {/* Cụm Phải: Chặng & Tiến Trình & Âm Thanh */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-mono font-black text-indigo-200 px-1.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-400/40">
                C{currentStage}
              </span>
              {progress && !bossInfo && (
                <span className="text-[13px] font-mono font-bold text-cyan-300">
                  {progress.kills}/{progress.total}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className="w-6 h-6 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-700/50 text-slate-300 flex items-center justify-center active:scale-90 transition-all"
              aria-label="Âm thanh"
            >
              <span className="material-symbols-outlined text-[13px]">
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
          </div>
        </div>

        {/* ── THANH MÁU TRÙM (MỎNG DẸT 2PX, CHỈ HIỆN KHI CÓ BOSS) ── */}
        {bossInfo && (
          <div className="w-full px-2.5 py-1 rounded-lg bg-slate-950/80 border border-rose-500/50 backdrop-blur-md animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-[13px] font-mono font-bold mb-0.5">
              <span className="text-rose-300 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                {bossInfo.nameVi} <span className="text-amber-400 font-bold">(X{bossInfo.stage || currentStage})</span>
              </span>
              <span className="text-rose-400 font-mono text-[13px]">
                {Math.max(0, Math.ceil(bossInfo.hp))}/{bossInfo.maxHp}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-rose-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-150 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                style={{
                  width: `${Math.max(0, (bossInfo.hp / bossInfo.maxHp) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Thông báo sự kiện chiến trường (tự ẩn sau 1.5s, không che mắt) */}
        {notice && (
          <div className="self-center bg-slate-950/85 border border-cyan-400/50 rounded-full px-3 py-0.5 text-center shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-in slide-in-from-top-1">
            <span className="text-[13px] font-black text-cyan-200 tracking-wider uppercase font-mono">
              {notice}
            </span>
          </div>
        )}
      </div>

      {/* Gợi ý điều khiển Desktop */}
      <div className="w-full text-center pb-0.5 text-[13px] font-mono text-cyan-400/40 hidden md:block uppercase tracking-wider">
        [A/D/◀/▶]: LÁI · [SPACE]: BẮN · [E]: SIÊU LASER
      </div>
    </div>
  );
}

export default memo(SurvivorHud);
