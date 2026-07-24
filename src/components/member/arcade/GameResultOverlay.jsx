import React from "react";
import { motion } from "framer-motion";

const RESULTS = {
  win:  { label: "CHIẾN THẮNG RỰC RỠ", icon: "emoji_events", rank: "RANK S+", color: "text-amber-400", mult: "2.5x" },
  lose: { label: "CỐ GẮNG LẦN SAU", icon: "sports_score", rank: "RANK B", color: "text-rose-400", mult: "1.0x" },
  draw: { label: "HÒA CÂN SỨC", icon: "handshake", rank: "RANK A", color: "text-cyan-400", mult: "1.5x" },
};

const DIFF_LABEL = { easy: "Khởi Động", medium: "Bứt Phá", hard: "Huyền Thoại", expert: "Đại Sư" };

export default function GameResultOverlay({ result, score, difficulty, joyDelta, dailyCapReached, onReplay, onChangeDifficulty }) {
  const info = RESULTS[result] || RESULTS.draw;
  const earnedMult = result === "win" ? "x2.5 JOY Multiplier" : "x1.0 Multiplier";

  return (
    <motion.div
      className="arc-result p-6 rounded-[32px] bg-[#0c0c11]/95 border border-[#FF2D55]/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-white text-center max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Apple Arcade Rank Badge */}
      <motion.div
        className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF2D55]/20 via-purple-500/20 to-amber-500/20 border border-[#FF2D55]/40 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(255,45,85,0.3)]"
        initial={{ scale: 0.4, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 20 }}
      >
        <span className="material-symbols-outlined text-3xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
          {info.icon}
        </span>
      </motion.div>

      <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase bg-[#FF2D55]/10 px-3 py-1 rounded-full border border-[#FF2D55]/20 mb-2 inline-block">
        HugoArcade Performance
      </span>

      <h2 className="text-2xl font-black tracking-tight mb-1 bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
        {info.label}
      </h2>

      {/* Rank & Score Chips */}
      <div className="flex items-center justify-center gap-2 my-3">
        <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
          🏆 {info.rank} ({info.mult})
        </span>
        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold font-mono">
          {DIFF_LABEL[difficulty] || "Bứt Phá"} • {score.toLocaleString("vi-VN")} điểm
        </span>
      </div>

      {/* JOY reward card */}
      <motion.div
        className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 my-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <small className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
          {earnedMult}
        </small>
        <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-1 font-mono">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
          <span>{joyDelta > 0 ? `+${joyDelta}` : joyDelta || 0}</span>
          <span className="text-xs font-bold text-amber-200 ml-1">JOY</span>
        </div>
      </motion.div>

      {dailyCapReached && (
        <p className="text-[11px] text-amber-200/80 bg-amber-500/10 p-2 rounded-xl mb-4">
          Đã đạt giới hạn thưởng JOY hôm nay. Tiếp tục tích lũy vào ngày mai!
        </p>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          className="py-3 rounded-2xl bg-gradient-to-r from-[#FF2D55] to-[#E60039] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(255,45,85,0.4)] hover:brightness-110 active:scale-95 transition-all"
          onClick={onReplay}
        >
          Chơi Lại
        </button>
        <button
          className="py-3 rounded-2xl bg-white/10 border border-white/15 text-zinc-200 font-bold text-xs uppercase tracking-wider hover:bg-white/20 active:scale-95 transition-all"
          onClick={onChangeDifficulty}
        >
          Đổi Độ Khó
        </button>
      </div>
    </motion.div>
  );
}
