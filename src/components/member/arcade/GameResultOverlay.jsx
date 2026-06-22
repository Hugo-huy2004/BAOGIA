import React from "react";
import { motion } from "framer-motion";
import { DIFFICULTY_STYLES } from "./arcadeConstants";

const RESULT_TEXT = {
  win: { label: "Cậu thắng! 🎉", color: "text-emerald-500" },
  lose: { label: "Thua rồi, thử lại nhé!", color: "text-rose-500" },
  draw: { label: "Hòa!", color: "text-zinc-500" }
};

export default function GameResultOverlay({ result, score, difficulty, joyDelta, joyAwarded, dailyCapReached, onReplay, onChangeDifficulty }) {
  const info = RESULT_TEXT[result] || RESULT_TEXT.draw;
  const style = DIFFICULTY_STYLES[difficulty];

  const joyPillClass =
    joyDelta > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
    joyDelta < 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
    "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-4 py-10 px-4"
    >
      <p className={`text-2xl font-black ${info.color}`}>{info.label}</p>

      <div className="flex items-center gap-2.5">
        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full border ${style?.pillIdle || ""}`}>
          {difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung Bình" : "Khó"}
        </span>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Điểm: {score}</span>
      </div>

      <div className={`px-5 py-2 rounded-full text-lg font-black ${joyPillClass}`}>
        {joyDelta > 0 ? `+${joyDelta}` : joyDelta} JOY
      </div>

      {dailyCapReached && (
        <p className="text-xs text-zinc-400 text-center max-w-[280px]">
          Đã đạt giới hạn JOY hôm nay từ HugoArcade, mai quay lại nhé. Điểm số vẫn được ghi nhận.
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onReplay}
          className="px-5 h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold active:scale-95 transition-transform"
        >
          Chơi lại
        </button>
        <button
          onClick={onChangeDifficulty}
          className="px-5 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-bold active:scale-95 transition-transform"
        >
          Đổi độ khó
        </button>
      </div>
    </motion.div>
  );
}
