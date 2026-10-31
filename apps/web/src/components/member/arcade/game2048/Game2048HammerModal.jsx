
export default function Game2048HammerModal({
  isOpen,
  onClose,
  walletBalance,
  isPurchasing,
  onConfirm,
}) {
  if (!isOpen) return null;

  const canAfford = walletBalance === null || walletBalance >= 50;

  return (
    <div
      className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Mua Thêm Búa Phá Ô"
    >
      <div className="max-w-[340px] w-full bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 flex flex-col items-center text-center shadow-[0_0_35px_rgba(245,158,11,0.35)]">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center mb-3">
          <img
            src="/images/wooden_hammer.png"
            alt="Búa gỗ"
            className="w-12 h-12 object-contain drop-shadow"
            loading="lazy"
          />
        </div>
        <h3 className="text-lg font-black text-amber-300 mb-1">
          Mua Thêm Búa Phá Ô
        </h3>
        <p className="text-[13px] text-slate-300 mb-4 leading-relaxed">
          Mỗi ván chơi được tặng 2 lượt miễn phí. Bạn có muốn dùng 50 JOY để mua thêm 1 lượt búa giải cứu bàn cờ?
        </p>

        <div className="w-full bg-slate-950 rounded-xl p-3 mb-4 flex items-center justify-between border border-slate-800 text-[13px]">
          <span className="text-slate-400">Số dư ví của bạn:</span>
          <span className="font-bold text-amber-400 font-mono">
            {Number(walletBalance || 0).toLocaleString()} JOY
          </span>
        </div>

        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPurchasing}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[13px] min-h-[44px] transition-colors"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPurchasing || !canAfford}
            className={`flex-1 py-2.5 font-black rounded-xl text-[13px] min-h-[44px] flex items-center justify-center gap-1 shadow-lg transition-all ${
              !canAfford
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95"
            }`}
          >
            {isPurchasing ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Mua (-50 JOY)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
