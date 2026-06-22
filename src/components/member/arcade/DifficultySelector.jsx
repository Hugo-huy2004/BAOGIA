import React from "react";
import { DIFFICULTIES, HOW_TO_PLAY } from "./arcadeConstants";

export default function DifficultySelector({ game, onSelect, title = "Chọn thử thách" }) {
  const objectives = HOW_TO_PLAY[game]?.objective || {};
  return (
    <div className="arcade-challenges">
      <div className="challenge-heading"><div><span>CHỌN HÀNH TRÌNH</span><h3>{title}</h3></div><p>Thử thách cao hơn mang về nhiều JOY hơn</p></div>
      <div className="challenge-grid">
        {DIFFICULTIES.map((d, index) => (
          <button key={d.id} onClick={() => onSelect(d.id)} className={`challenge-card tier-${d.id}`}>
            {d.id === "medium" && <span className="challenge-popular">ĐỀ XUẤT</span>}
            <div className="challenge-card-head"><span className="challenge-icon material-symbols-outlined">{d.icon}</span><span className="challenge-number">0{index+1}</span></div>
            <span className="challenge-kicker">{d.kicker}</span><h4>{d.label}</h4>
            <p>{d.description}</p>
            <div className="challenge-objective"><span className="material-symbols-outlined">flag</span><div><small>MỤC TIÊU</small><strong>{objectives[d.id]}</strong></div></div>
            <div className="challenge-reward"><div><small>THẮNG NHẬN</small><strong>+{d.win} <span>JOY</span></strong></div><span className="challenge-go material-symbols-outlined">arrow_forward</span></div>
          </button>
        ))}
      </div>
      <p className="challenge-note"><span className="material-symbols-outlined">shield</span> Điểm và phần thưởng được ghi nhận tự động sau mỗi ván</p>
    </div>
  );
}
