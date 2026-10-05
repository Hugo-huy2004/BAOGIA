
export default function Game2048Controls({
  hammers = 0,
  isHammerMode = false,
  status = null,
  isSmashing = false,
  unlockedVaultCount = 0,
  onHammerClick,
  onVaultClick,
}) {
  return (
    <div className="w-full max-w-[420px] grid grid-cols-2 gap-2.5 py-2 z-10 px-1">
      {/* Nút 1: Búa Phá Ô (2 lượt miễn phí mỗi ván, hết lượt mua 50 JOY) */}
      <button
        type="button"
        onClick={onHammerClick}
        disabled={!!status || isSmashing}
        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-bold transition-all min-h-[50px] shadow-lg select-none ${
          isHammerMode
            ? "bg-amber-600/95 text-white ring-4 ring-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse"
            : hammers > 0
            ? "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] active:scale-95"
            : "bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
        }`}
        aria-label="Búa Phá Ô"
      >
        <img
          src="/images/wooden_hammer.png"
          alt="Búa"
          className={`w-7 h-7 object-contain drop-shadow transition-transform duration-200 ${
            isHammerMode ? "rotate-[-20deg] scale-110" : ""
          }`}
          loading="lazy"
        />
        {hammers > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-slate-300 font-bold">Búa:</span>
            <span className="text-lg font-black font-mono text-amber-300 drop-shadow">
              ×{hammers}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-amber-300 font-bold">Mua Búa</span>
            <span className="text-[13px] font-black font-mono px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
              50 JOY
            </span>
          </div>
        )}
      </button>

      {/* Nút 2: Kho Nhân Vật Sưu Tầm & Đua Top */}
      <button
        type="button"
        onClick={onVaultClick}
        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-bold transition-all min-h-[50px] shadow-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] active:scale-95 select-none"
        aria-label="Kho Sưu Tầm"
      >
        <span className="material-symbols-outlined text-cyan-400 text-2xl">
          inventory_2
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-slate-300 font-bold">Kho:</span>
          <span className="text-base font-black font-mono text-cyan-300 drop-shadow">
            {unlockedVaultCount}/20
          </span>
        </div>
      </button>
    </div>
  );
}
