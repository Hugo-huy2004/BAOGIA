import { memo } from "react";

function SnakeControls({
  isBoostingUI,
  onTriggerBoost,
  swipeUI,
  isVi,
}) {
  return (
    <>
      {/* ── HIỆU ỨNG VÒNG TRÒN CẢM ỨNG KHI VUỐT TRÊN MÀN HÌNH ────────────────── */}
      {swipeUI?.active && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-100"
          style={{ left: swipeUI.currX, top: swipeUI.currY }}
        >
          <div className="w-14 h-14 rounded-full border-2 border-amber-400/80 bg-amber-400/20 backdrop-blur-xs flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <div className="w-4 h-4 rounded-full bg-amber-300 shadow-md animate-ping" />
          </div>
        </div>
      )}

      {/* ── NÚT TĂNG TỐC (BOOST) NỔI BẬT GÓC PHẢI DƯỚI ─────────────────────── */}
      <div className="absolute right-4 bottom-5 z-20 pointer-events-auto">
        <button
          type="button"
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl backdrop-blur-md active:scale-90 transition-all select-none touch-none ${
            isBoostingUI
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 border-white text-white shadow-[0_0_25px_rgba(244,63,94,0.65)] scale-95"
              : "bg-slate-950/75 hover:bg-slate-900 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(0,0,0,0.6)]"
          }`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerBoost(true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            onTriggerBoost(false);
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            onTriggerBoost(false);
          }}
          aria-label={isVi ? "Tăng tốc bé rắn" : "Boost snake speed"}
        >
          <span className="material-symbols-outlined text-[26px]">bolt</span>
          <span className="text-[13px] font-black tracking-wider uppercase">BOOST</span>
        </button>
      </div>

      {/* ── GỢI Ý ĐIỀU KHIỂN TRÊN MÁY TÍNH (TỰ ẨN TRÊN ĐIỆN THOẠI) ──────────── */}
      <div className="relative z-10 pb-2 text-center text-slate-300/60 font-medium text-[13px] hidden md:block pointer-events-none">
        {isVi
          ? "Phím W/A/S/D hoặc ◀ ▲ ▼ ▶ để đổi hướng · Giữ Space để Tăng Tốc"
          : "WASD or Arrow Keys to steer · Hold Space to Boost"}
      </div>
    </>
  );
}

export default memo(SnakeControls);
