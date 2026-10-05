import { BotAvatar } from "bot-avatars";

export default function Game2048EndModal({
  status,
  score,
  highestBot,
  onRestart,
}) {
  if (status !== "gameover" && status !== "win") return null;

  const isWin = status === "win";

  return (
    <div
      className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fadeIn ${
        isWin ? "bg-slate-950/90" : "bg-slate-950/85"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={isWin ? "Chiến Thắng Tối Thượng" : "Hết Nước Đi"}
    >
      <div
        className={`max-w-[340px] w-full bg-slate-900 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl ${
          isWin
            ? "border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)]"
            : "border border-slate-800"
        }`}
      >
        {isWin ? (
          <>
            <span className="material-symbols-outlined text-amber-400 text-5xl mb-2 animate-bounce">
              emoji_events
            </span>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 mb-1">
              CHIẾN THẮNG TỐI THƯỢNG!
            </h3>
            <p className="text-[13px] text-slate-300 mb-3">
              Bạn đã tạo ra nhân vật tối thượng cấp 20!
            </p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-rose-500 text-5xl mb-2">
              sentiment_very_dissatisfied
            </span>
            <h3 className="text-xl font-black text-white mb-2">
              Hết nước đi!
            </h3>
          </>
        )}

        {highestBot && (
          <>
            <div
              className={`w-24 h-24 my-2 rounded-2xl bg-slate-950 flex items-center justify-center ${
                isWin ? "border-2 border-amber-400/60" : "border border-slate-700"
              }`}
            >
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
                size={80}
              />
            </div>
            {!isWin && (
              <p className="text-[13px] text-slate-400 mb-3">
                Nhân vật đỉnh nhất đạt được trong ván
              </p>
            )}
          </>
        )}

        <div
          className={`w-full bg-slate-950 rounded-xl p-3 mb-4 flex items-center justify-around font-mono ${
            isWin ? "border border-amber-500/40" : "border border-slate-800"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-[13px] text-slate-400">Tổng điểm</span>
            <span className="text-lg font-bold text-cyan-400">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-[13px] text-slate-400">Phần thưởng</span>
            <span
              className={`text-[13px] font-bold flex items-center gap-1 ${
                isWin ? "text-amber-300" : "text-purple-300"
              }`}
            >
              <span
                className={`material-symbols-outlined text-base ${
                  isWin ? "text-amber-400" : "text-purple-400"
                }`}
              >
                {isWin ? "emoji_events" : "redeem"}
              </span>
              {isWin ? "Quà tối thượng" : "Quà bí mật"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className={`w-full py-2.5 font-bold rounded-xl shadow-lg min-h-[44px] flex items-center justify-center text-[13px] active:scale-95 transition-all ${
            isWin
              ? "bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black"
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          {isWin ? "Chơi Ván Mới" : "Chơi Lại Ván Mới"}
        </button>
      </div>
    </div>
  );
}
