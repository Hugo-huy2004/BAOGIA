import { memo } from "react";

function SnakeHud({
  curStage,
  hud,
  isVi,
  muted,
  isFeverUI,
  isMagnetUI,
  isBoostingUI,
  stageBanner,
  popups,
  countdown,
  boostBarRef,
  boostTextRef,
  onOpenSkinMenu,
  onToggleMute,
}) {
  return (
    <>
      {/* ── VISOR HUD THÔNG MINH, SIÊU NHỎ GỌN TRÊN CÙNG ────────────────────── */}
      <div className="relative z-20 w-full max-w-xl px-3 pt-2.5 flex flex-col items-center gap-1.5 pointer-events-none">
        {/* Hàng Visor Chính: Kính mờ cao cấp, tối giản 1 dòng duy nhất */}
        <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-slate-950/75 border border-white/20 shadow-xl backdrop-blur-md pointer-events-auto">
          {/* Cụm Trái: Chặng & Tiến độ ăn mồi */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-300 text-[13px] font-black tracking-wide uppercase">
              {isVi ? `Ch.${curStage.chapter}` : `Ch.${curStage.chapter}`}
            </span>
            <div className="flex items-center gap-1 text-white font-bold text-[13px]">
              <span>🍎</span>
              <span className="font-mono text-emerald-400">
                {hud.eaten % curStage.goalFruits}/{curStage.goalFruits}
              </span>
            </div>
          </div>

          {/* Cụm Giữa: Điểm số nổi bật & Combo */}
          <div className="flex flex-col items-center leading-none">
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] uppercase font-bold text-slate-400 tracking-wider">
                {isVi ? "ĐIỂM" : "SCORE"}
              </span>
              <span className="text-[20px] font-black font-mono tracking-wider text-amber-300 drop-shadow">
                {hud.score.toLocaleString("vi-VN")}
              </span>
            </div>
            {hud.combo > 1 && (
              <span className="text-[13px] font-black text-rose-400 animate-pulse">
                COMBO x{hud.combo}!
              </span>
            )}
          </div>

          {/* Cụm Phải: Nút Ngoại Trang (Skin) & Âm Thanh */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSkinMenu}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 flex items-center justify-center text-[15px] shadow-sm transition-all"
              title={isVi ? "Đổi trang phục" : "Skins"}
              aria-label="Skins"
            >
              🎨
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 flex items-center justify-center text-white/90 shadow-sm transition-all"
              title={isVi ? "Bật/Tắt âm thanh" : "Mute/Unmute"}
              aria-label="Audio"
            >
              <span className="material-symbols-outlined text-[17px]">
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
          </div>
        </div>

        {/* Thanh Năng Lượng Boost Siêu Mảnh (Chỉ hiện khi cần, không chiếm chỗ) */}
        <div className="w-full max-w-xs flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-white/10 backdrop-blur-sm shadow-sm pointer-events-none">
          {isFeverUI ? (
            <span className="text-[13px] font-black text-amber-300 animate-pulse flex items-center gap-1">
              ⭐ FEVER!
            </span>
          ) : isMagnetUI ? (
            <span className="text-[13px] font-black text-rose-400 animate-pulse flex items-center gap-1">
              🧲 TỪ TÍNH!
            </span>
          ) : (
            <span className="material-symbols-outlined text-[14px] text-amber-400">bolt</span>
          )}

          <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              ref={boostBarRef}
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: "100%",
                background: isBoostingUI
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : "linear-gradient(90deg, #10b981, #38bdf8)",
              }}
            />
          </div>

          <span
            ref={boostTextRef}
            className="text-[13px] font-mono font-bold text-slate-300 min-w-[34px] text-right"
          >
            100%
          </span>
        </div>
      </div>

      {/* ── BANNER CHUYỂN CHẶNG NHỎ GỌN (TỰ BIẾN MẤT) ────────────────────────── */}
      {stageBanner && (
        <div className="absolute top-20 z-30 flex flex-col items-center justify-center pointer-events-none px-4 max-w-sm animate-bounce">
          <div className="px-4 py-2 rounded-2xl border border-white/30 bg-slate-950/85 text-white backdrop-blur-xl shadow-2xl flex items-center gap-2 text-center">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-300 text-[13px] font-black uppercase">
              {isVi ? `Chương ${stageBanner.chapter}` : `Ch.${stageBanner.chapter}`}
            </span>
            <span className="text-[13px] font-black text-amber-200">
              {isVi ? stageBanner.nameVi : stageBanner.nameEn}
            </span>
          </div>
        </div>
      )}

      {/* ── POPUPS ĐIỂM BAY TINH TẾ ────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-24 z-30 flex flex-col items-center gap-1 pointer-events-none">
        {popups.map((p) => (
          <div
            key={p.id}
            className="px-3 py-0.5 rounded-full font-black text-[13px] shadow-lg animate-in slide-in-from-bottom-2 fade-in"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              color: p.color,
              border: `1.5px solid ${p.color}`,
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* ── COUNTDOWN KHỞI ĐỘNG ────────────────────────────────────────────── */}
      {countdown > 0 && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
          <div className="w-24 h-24 rounded-full border-2 border-amber-400 bg-slate-950/90 flex flex-col items-center justify-center shadow-2xl animate-pulse">
            <small className="text-[13px] font-black tracking-widest text-amber-400">SẴN SÀNG</small>
            <span className="text-[44px] font-black leading-none text-white">{countdown}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(SnakeHud);
