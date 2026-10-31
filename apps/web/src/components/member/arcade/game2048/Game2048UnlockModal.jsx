import { BotAvatar } from "bot-avatars";

export default function Game2048UnlockModal({ character, onClose }) {
  if (!character) return null;

  const { tier, level, name, bonusJoy } = character;

  return (
    <div
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Nhân Vật Mới Đã Mở Khóa"
    >
      <div className="max-w-[340px] w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-5 flex flex-col items-center text-center shadow-[0_0_50px_rgba(251,191,36,0.6)]">
        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[13px] font-black uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-base text-amber-400">auto_awesome</span>
          Nhân Vật Mới Đã Mở Khóa!
        </span>

        <div className="w-32 h-32 my-3 rounded-2xl bg-slate-950 border-2 border-amber-400/60 flex items-center justify-center shadow-[inset_0_0_20px_rgba(251,191,36,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent animate-pulse" />
          <BotAvatar
            type={tier?.type || "drop"}
            color={tier?.color || "#00e5ff"}
            face={tier?.face || "mouth"}
            state="working"
            shading={tier?.shading || "fabric"}
            hat={tier?.hat}
            glasses={tier?.glasses}
            headphones={tier?.headphones}
            bowTie={tier?.bowTie}
            size={100}
          />
        </div>

        <h3 className="text-xl font-black text-white mb-0.5">
          {name}
        </h3>
        <span className="text-[13px] font-bold text-slate-400 mb-3">
          Cấp {level} • {tier?.value?.toLocaleString() || 0} điểm
        </span>

        <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/60 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between text-[13px]">
          <span className="text-amber-200 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-amber-400 text-base">military_tech</span>
            Thưởng Sưu Tầm Lần Đầu
          </span>
          <span className="font-black text-amber-300 font-mono text-base">
            +{bonusJoy} JOY
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl border border-amber-200 shadow-[0_4px_16px_rgba(251,191,36,0.4)] min-h-[44px] flex items-center justify-center text-[13px] active:scale-95 transition-all"
        >
          Thu nhận vào Kho!
        </button>
      </div>
    </div>
  );
}
