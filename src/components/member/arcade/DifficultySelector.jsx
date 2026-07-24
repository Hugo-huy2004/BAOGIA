import React, { useState } from "react";
import { motion } from "framer-motion";
import { DIFFICULTIES, HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const TIER_ICONS = {
  easy: "bolt",
  medium: "local_fire_department",
  hard: "military_tech",
};

const TIER_COLORS = {
  easy: {
    bg: "from-emerald-500/15 via-teal-950/20 to-emerald-950/40",
    border: "border-emerald-500/40 hover:border-emerald-400",
    iconBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    text: "text-emerald-400",
    shadow: "shadow-[0_8px_25px_rgba(16,185,129,0.25)]",
  },
  medium: {
    bg: "from-amber-500/15 via-orange-950/20 to-amber-950/40",
    border: "border-amber-500/40 hover:border-amber-400",
    iconBg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    text: "text-amber-400",
    shadow: "shadow-[0_8px_25px_rgba(245,158,11,0.25)]",
  },
  hard: {
    bg: "from-rose-500/15 via-purple-950/20 to-rose-950/40",
    border: "border-rose-500/40 hover:border-rose-400",
    iconBg: "bg-rose-500/20 border-rose-500/40 text-rose-400",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    text: "text-rose-400",
    shadow: "shadow-[0_8px_25px_rgba(244,63,94,0.25)]",
  },
};

export default function DifficultySelector({ game, bio, onBioUpdate, onSelect }) {
  const objectives = HOW_TO_PLAY[game]?.objective || {};
  const { active: subscribed } = useFeatureGate(bio, "hugoArcade");
  const [showInvoice, setShowInvoice] = useState(false);

  const handleConfirmCharge = async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey: "hugoArcade" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi trao đổi JOY.");
    return data;
  };

  const handleSuccess = (data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({
      ...bio,
      featureSubscriptions: {
        ...(bio.featureSubscriptions || {}),
        hugoArcade: { active: true, expiresAt: data.expiresAt },
      },
    });
  };

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-b from-[#1c1d2e]/95 via-[#141522]/95 to-[#0a0a0f]/95 border border-white/20 rounded-[36px] p-6 md:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-white">
      {/* Ambient Top Light Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-[#FF2D55]" />

      {/* Header */}
      <div className="mb-6 text-left">
        <span className="text-[10px] font-black tracking-widest text-[#FF2D55] uppercase bg-[#FF2D55]/10 px-3 py-1 rounded-full border border-[#FF2D55]/20 mb-2 inline-block">
          Thách Đấu Arcade
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
          Chọn Độ Khó Thử Thách
        </h2>
        <p className="text-xs md:text-sm text-zinc-300 mt-1 leading-relaxed max-w-md">
          Độ khó càng cao, chiến thắng càng mang về nhiều <strong className="text-amber-400">JOY Multiplier</strong> đáng giá.
        </p>
      </div>

      {/* Difficulty Cards Grid */}
      <div className="flex flex-col gap-3.5">
        {DIFFICULTIES.map((d) => {
          const locked = d.id !== "easy" && !subscribed;
          const theme = TIER_COLORS[d.id];

          return (
            <motion.button
              key={d.id}
              whileHover={{ scale: locked ? 1 : 1.015, x: locked ? 0 : 3 }}
              whileTap={{ scale: locked ? 1 : 0.985 }}
              onClick={() => {
                if (!locked) onSelect(d.id);
                else setShowInvoice(true);
              }}
              className={`relative w-full rounded-2xl border p-4 text-left flex items-center gap-4 transition-all ${theme.border} bg-gradient-to-r ${theme.bg} ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} shadow-lg backdrop-blur-xl group overflow-hidden`}
            >
              {/* Left Accent Glow Line */}
              <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${locked ? "bg-zinc-600" : theme.text} bg-current`} />

              {/* Icon Tile */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0 backdrop-blur-md shadow-inner transition-transform group-hover:scale-105 ${locked ? "bg-zinc-800/80 border-white/10 text-zinc-400" : theme.iconBg}`}>
                <span className="material-symbols-outlined text-2xl">
                  {locked ? "lock" : TIER_ICONS[d.id]}
                </span>
              </div>

              {/* Info Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-black tracking-wide text-white font-sans">
                    {d.label}
                  </span>
                  {d.id === "medium" && !locked && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Đề xuất
                    </span>
                  )}
                  {locked && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Cần Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 truncate font-medium">
                  {objectives[d.id] || d.description}
                </p>
              </div>

              {/* Reward Badge */}
              <div className="text-right flex-shrink-0 pl-2">
                <strong className={`text-xl md:text-2xl font-black block font-mono leading-none ${locked ? "text-zinc-500" : theme.text}`}>
                  {locked ? "???" : `+${d.win}`}
                </strong>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mt-1">
                  JOY / thắng
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Pro Upsell Notice */}
      {!subscribed && (
        <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-base">workspace_premium</span>
            <span>Mở khóa độ khó Bứt Phá &amp; Huyền Thoại</span>
          </div>
          <button
            onClick={() => setShowInvoice(true)}
            className="px-3 py-1.5 rounded-full bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider hover:bg-amber-300 transition-all shadow-sm"
          >
            {ARCADE_PRICE_JOY} JOY/tháng
          </button>
        </div>
      )}

      <p className="text-[10px] text-zinc-400 text-center mt-4 font-mono">
        ⚡ Phần thưởng JOY được tự động ghi nhận tức thì vào Ví sau mỗi trận đấu.
      </p>

      <JoyExchangeModal
        open={showInvoice}
        bio={bio}
        item="hugoArcade"
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
