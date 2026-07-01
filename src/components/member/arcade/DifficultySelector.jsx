import React, { useState } from "react";
import { motion } from "framer-motion";
import { DIFFICULTIES, HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const TIER_ICONS = { easy: "🌱", medium: "⚡", hard: "💀" };

export default function DifficultySelector({ game, bio, onBioUpdate, onSelect }) {
  const objectives = HOW_TO_PLAY[game]?.objective || {};
  const { active: subscribed } = useFeatureGate(bio, "hugoArcade");
  const [showInvoice, setShowInvoice] = useState(false);

  const handleConfirmCharge = async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey: "hugoArcade" })
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
        hugoArcade: { active: true, expiresAt: data.expiresAt }
      }
    });
  };

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <div className="arc-diff-header">
        <h2>Chọn độ khó</h2>
        <p>Thử thách cao hơn mang về nhiều JOY hơn — độ khó càng cao, phần thưởng càng đáng giá.</p>
      </div>

      <div className="arc-diff-grid">
        {DIFFICULTIES.map((d, i) => {
          const locked = d.id !== "easy" && !subscribed;
          return (
            <motion.button
              key={d.id}
              data-tier={d.id}
              className={`arc-diff-card${locked ? " is-locked" : ""}`}
              onClick={() => { if (!locked) onSelect(d.id); }}
              disabled={locked}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.25, ease: [.16,1,.3,1] }}
            >
              <div className="arc-diff-indicator" />
              <div className="arc-diff-icon">{locked ? "🔒" : TIER_ICONS[d.id]}</div>
              <div className="arc-diff-body">
                <div className="arc-diff-name">
                  {d.label}
                  {d.id === "medium" && !locked && <span className="arc-diff-kicker">Đề xuất</span>}
                  {locked && <span className="arc-diff-kicker" onClick={e => { e.stopPropagation(); setShowInvoice(true); }}>
                    Cần {ARCADE_PRICE_JOY} JOY
                  </span>}
                </div>
                <p className="arc-diff-obj">{objectives[d.id] || d.description}</p>
              </div>
              <div className="arc-diff-reward">
                <strong>{locked ? "???" : `+${d.win}`}</strong>
                <span>JOY / thắng</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!subscribed && (
        <p className="arc-diff-note">
          🔒 Bứt phá và Huyền thoại yêu cầu{" "}
          <button onClick={() => setShowInvoice(true)} style={{ color: "var(--arc-joy)", fontWeight: 700, textDecoration: "underline" }}>
            đăng ký {ARCADE_PRICE_JOY} JOY/tháng
          </button>
        </p>
      )}

      <p className="arc-diff-note" style={{ marginTop: 8 }}>Kết quả và phần thưởng ghi nhận tự động sau mỗi ván</p>

      <JoyExchangeModal
        open={showInvoice} bio={bio} item="hugoArcade"
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
