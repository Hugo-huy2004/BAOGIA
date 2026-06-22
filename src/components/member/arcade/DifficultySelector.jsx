import React, { useState } from "react";
import { DIFFICULTIES, HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export default function DifficultySelector({ game, bio, onBioUpdate, onSelect, title = "Chọn thử thách" }) {
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
    <div className="arcade-challenges">
      <div className="challenge-heading"><div><span>CHỌN HÀNH TRÌNH</span><h3>{title}</h3></div><p>Thử thách cao hơn mang về nhiều JOY hơn</p></div>

      {!subscribed && (
        <div className="arcade-instruction" style={{ borderColor: "var(--warning, #f59e0b)" }}>
          <span className="arcade-instruction-icon"><span className="material-symbols-outlined">workspace_premium</span></span>
          <div>
            <strong>Bứt phá & Huyền thoại đang chờ</strong>
            <p>
              Trao đổi {ARCADE_PRICE_JOY} JOY/tháng để mở khóa hai độ khó này. "Khởi động" luôn miễn phí cho mọi người.
              {" "}
              <button onClick={(e) => { e.stopPropagation(); setShowInvoice(true); }} style={{ fontWeight: 700, textDecoration: "underline" }}>
                Trao đổi {ARCADE_PRICE_JOY} JOY ngay
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="challenge-grid">
        {DIFFICULTIES.map((d, index) => {
          const locked = d.id !== "easy" && !subscribed;
          return (
            <button
              key={d.id}
              onClick={() => !locked && onSelect(d.id)}
              className={`challenge-card tier-${d.id}`}
              disabled={locked}
              style={locked ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
            >
              {d.id === "medium" && !locked && <span className="challenge-popular">ĐỀ XUẤT</span>}
              {locked && <span className="challenge-popular" style={{ background: "var(--warning, #f59e0b)" }}>CẦN JOY</span>}
              <div className="challenge-card-head"><span className="challenge-icon material-symbols-outlined">{locked ? "lock" : d.icon}</span><span className="challenge-number">0{index+1}</span></div>
              <span className="challenge-kicker">{d.kicker}</span><h4>{d.label}</h4>
              <p>{d.description}</p>
              <div className="challenge-objective"><span className="material-symbols-outlined">flag</span><div><small>MỤC TIÊU</small><strong>{objectives[d.id]}</strong></div></div>
              <div className="challenge-reward"><div><small>THẮNG NHẬN</small><strong>+{d.win} <span>JOY</span></strong></div><span className="challenge-go material-symbols-outlined">{locked ? "lock" : "arrow_forward"}</span></div>
            </button>
          );
        })}
      </div>
      <p className="challenge-note"><span className="material-symbols-outlined">shield</span> Điểm và phần thưởng được ghi nhận tự động sau mỗi ván</p>

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
