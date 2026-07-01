import React from "react";
import { motion } from "framer-motion";

const RESULTS = {
  win:  { label: "Chiến thắng!", icon: "✓", symbol: "emoji_events" },
  lose: { label: "Chưa phá đảo", icon: "↻", symbol: "refresh" },
  draw: { label: "Bất phân thắng bại", icon: "=", symbol: "handshake" },
};

const DIFF_LABEL = { easy: "Khởi động 🌱", medium: "Bứt phá ⚡", hard: "Huyền thoại 💀" };

export default function GameResultOverlay({ result, score, difficulty, joyDelta, joyAwarded, dailyCapReached, onReplay, onChangeDifficulty }) {
  const info = RESULTS[result] || RESULTS.draw;

  return (
    <motion.div
      className="arc-result"
      data-result={result}
      initial={{ opacity: 0, scale: 0.93, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [.16,1,.3,1] }}
    >
      {/* Icon */}
      <motion.div
        className="arc-result-icon"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: .1, type: "spring", stiffness: 380, damping: 22 }}
      >
        <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {info.symbol}
        </span>
      </motion.div>

      <p className="arc-result-label">Kết quả thử thách</p>
      <h2>{info.label}</h2>

      {/* Chips */}
      <div className="arc-result-chips">
        <span className="arc-result-chip">{DIFF_LABEL[difficulty]}</span>
        <span className="arc-result-chip">{score.toLocaleString("vi-VN")} điểm</span>
      </div>

      {/* JOY reward */}
      <motion.div
        className="arc-result-reward"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .2 }}
      >
        <small>Phần thưởng JOY</small>
        <strong>
          {joyDelta > 0 ? `+${joyDelta}` : joyDelta}
          <em> JOY</em>
        </strong>
      </motion.div>

      {dailyCapReached && (
        <p className="arc-result-cap">
          Đã đạt giới hạn JOY hôm nay. Phần thưởng sẽ tiếp tục vào ngày mai!
        </p>
      )}

      {/* Actions */}
      <div className="arc-result-actions">
        <button className="arc-result-primary" onClick={onReplay}>
          Chơi lại
        </button>
        <button className="arc-result-secondary" onClick={onChangeDifficulty}>
          Đổi độ khó
        </button>
      </div>
    </motion.div>
  );
}
