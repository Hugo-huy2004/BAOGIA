import { memo } from "react";

function SurvivorControls({
  isOverdriveReady = false,
  isOverdriveActive = false,
  overdrivePercent = 0,
  isAutoFire = true,
  onToggleAutoFire,
  onTriggerOverdrive,
  joystickUI,
}) {
  return (
    <>
      {/* ── VIRTUAL JOYSTICK KHI CHẠM VUỐT ─────────────────────────────────── */}
      {joystickUI?.active && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickUI.x, top: joystickUI.y }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/60 bg-slate-950/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-sky-300 border-2 border-white shadow-md"
              style={{
                transform: `translate(${joystickUI.dx}px, ${joystickUI.dy}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── CỤM NÚT ĐIỀU KHIỂN DƯỚI CÙNG CHO MOBILE ───────────────────────── */}
      <div className="absolute inset-x-0 bottom-3 z-30 px-3 flex items-end justify-between pointer-events-auto md:hidden select-none">
        {/* Vùng gợi ý lái */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-300 text-[13px] font-bold backdrop-blur-sm shadow-md">
          <span className="material-symbols-outlined text-sm text-cyan-400">touch_app</span>
          <span>Vuốt để lái</span>
        </div>

        {/* Cụm Nút Phải: Auto Fire & Siêu Laser */}
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt Tự Động Bắn */}
          <button
            type="button"
            onClick={onToggleAutoFire}
            className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center text-[13px] font-bold shadow-lg active:scale-95 transition-all ${
              isAutoFire
                ? "bg-cyan-500/25 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "bg-slate-900/90 border-slate-700 text-slate-400"
            }`}
            aria-label="Tự Động Bắn"
          >
            <span className="material-symbols-outlined text-xl">
              {isAutoFire ? "bolt" : "power_settings_new"}
            </span>
            <span className="text-[13px]">{isAutoFire ? "AUTO" : "MANUAL"}</span>
          </button>

          {/* Nút Siêu Laser Overdrive với thanh tiến trình tích hợp */}
          <button
            type="button"
            onClick={onTriggerOverdrive}
            disabled={!isOverdriveReady && !isOverdriveActive}
            className={`relative h-12 px-4 rounded-2xl overflow-hidden flex items-center gap-1.5 font-mono font-black text-[13px] tracking-wider border-2 shadow-xl backdrop-blur-md active:scale-95 transition-all ${
              isOverdriveActive
                ? "bg-gradient-to-r from-amber-400 to-rose-600 text-slate-950 border-amber-200 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.9)]"
                : isOverdriveReady
                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-slate-950 border-white shadow-[0_0_20px_rgba(236,72,153,0.7)] animate-bounce"
                : "bg-slate-900/90 text-slate-400 border-slate-700/60"
            }`}
            aria-label="Kích Hoạt Siêu Laser"
          >
            {/* Thanh nạp tiến trình ngầm phía sau */}
            {!isOverdriveReady && !isOverdriveActive && (
              <div
                className="absolute inset-y-0 left-0 bg-purple-600/35 transition-all duration-100"
                style={{ width: `${Math.min(100, overdrivePercent)}%` }}
              />
            )}

            <span className="material-symbols-outlined text-lg relative z-10">
              auto_awesome
            </span>
            <span className="relative z-10">
              {isOverdriveActive
                ? "ĐANG BẮN!"
                : isOverdriveReady
                ? "SIÊU LASER!"
                : `${Math.floor(overdrivePercent)}%`}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(SurvivorControls);
