import React from "react";
import { motion } from "framer-motion";
import { DIFFICULTY_STYLES } from "./arcadeConstants";

const RESULT_TEXT = {
  win: { label: "Chiến thắng!", icon: "trophy", type: "win" },
  lose: { label: "Chưa phá đảo", icon: "replay", type: "lose" },
  draw: { label: "Bất phân thắng bại", icon: "handshake", type: "draw" }
};

export default function GameResultOverlay({ result, score, difficulty, joyDelta, joyAwarded, onReplay, onChangeDifficulty }) {
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
      className={`arcade-result result-${info.type}`}
    >
      <div className="result-icon"><span className="material-symbols-outlined">{info.icon}</span></div>
      <span className="result-kicker">KẾT QUẢ THỬ THÁCH</span><h2>{info.label}</h2>

      <div className="flex items-center gap-2.5">
        <span className="result-difficulty">
          {difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung Bình" : "Khó"}
        </span>
        <span className="result-score">{score.toLocaleString("vi-VN")} điểm</span>
      </div>

      <div className={`result-reward ${joyPillClass}`}><small>PHẦN THƯỞNG</small>
        <strong>{joyDelta > 0 ? `+${joyDelta}` : joyDelta} <span>JOY</span></strong>
      </div>

      <div className="result-actions">
        <button
          onClick={onReplay}
          className="result-primary"
        >
          Chơi lại
        </button>
        <button
          onClick={onChangeDifficulty}
          className="result-secondary"
        >
          Đổi độ khó
        </button>
      </div>
    </motion.div>
  );
}
