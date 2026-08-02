import { useState } from "react";
import { getEcoMode, setEcoMode, isEcoOn } from "./ecoMode";
import { autoReason, getEcoSignals, LOW_BATTERY } from "./ecoSignals";
import { readLedger, ecoMinutes, resetLedger, listSaved } from "./ecoStore";
import EcoImpact from "./EcoImpact";

/**
 * Tab "Xanh": sổ tiết kiệm của chính máy này + chọn mức chế độ.
 *
 * Nguyên tắc số liệu: mọi con số ở khối trên là ĐẾM ĐƯỢC (lượt gọi đã tránh,
 * byte lấy từ máy, phút chạy nền đen). Chỉ có dòng quy ra điện là ước tính, và
 * nó ghi rõ hệ số cùng nguồn. Không có "đã cứu N cái cây".
 */

// Chế độ thường tự làm mới bản tin mỗi 10 phút với 120 bài; chế độ này 24 bài
// và không hẹn giờ. Hai hệ số dưới đây suy ra từ đúng hai con số đó.
const REFRESH_EVERY_MIN = 10;
const NORMAL_OVER_ECO = 5;
// 0,06 kWh mỗi GB truyền qua mạng — Aslan et al., Journal of Industrial Ecology
// 2018 (xem phần Nguồn tham khảo bên dưới).
const WH_PER_BYTE = 0.06 * 1000 / 1e9;

const RING_TARGET = 100;

const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes)} B`;
};

const formatMinutes = (minutes) => {
  if (minutes >= 60) return `${Math.floor(minutes / 60)} giờ ${Math.round(minutes % 60)} phút`;
  return `${Math.round(minutes)} phút`;
};

const formatWh = (wh) => (wh >= 1 ? `${wh.toFixed(2)} Wh` : `${(wh * 1000).toFixed(1)} mWh`);

/* Vòng tuần hoàn: mỗi 100 lượt gọi tránh được là một vòng khép kín. Vẽ bằng
   stroke-dasharray, không animation — vòng chỉ đổi khi số liệu đổi. */
function RecycleRing({ progress, laps }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img"
      aria-label={`Đã khép ${laps} vòng tái chế, vòng hiện tại ${Math.round(progress * 100)}%`}>
      <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="7" opacity="0.16" />
      <circle
        cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${C * progress} ${C}`} transform="rotate(-90 60 60)"
      />
      <path d="M60 44c-6 0-11 5-11 11m11-11 6-6m-6 6 6 6" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M50 68c3 5 9 8 15 6m-15-6-8 1m8-1-2 8" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <path d="M71 62c1-6-2-11-7-14m7 14 7 3m-7-3-5 6" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

const MODE_OPTIONS = [
  { value: "auto", label: "Tự động", hint: "Máy tự bật khi pin yếu, mạng chậm hoặc bạn đang bật Tiết kiệm dữ liệu." },
  { value: "on", label: "Luôn bật", hint: "Ở lại chế độ này mọi lúc." },
  { value: "off", label: "Tắt", hint: "Quay về portal đầy đủ." },
];

export default function EcoGreen({ onExitEco }) {
  const [mode, setMode] = useState(getEcoMode);
  const [ledger, setLedger] = useState(readLedger);
  const signals = getEcoSignals();
  const minutes = ecoMinutes(ledger);

  const refreshesAvoided = Math.floor(minutes / REFRESH_EVERY_MIN);
  const requestsAvoided = ledger.feedHits + ledger.savedReads + refreshesAvoided;
  const bytesAvoided = ledger.bytesFromCache + refreshesAvoided * ledger.feedBytes * NORMAL_OVER_ECO;
  const laps = Math.floor(requestsAvoided / RING_TARGET);
  const progress = (requestsAvoided % RING_TARGET) / RING_TARGET;

  const choose = (value) => {
    setEcoMode(value);
    setMode(value);
    if (!isEcoOn()) onExitEco();
  };

  const clear = () => {
    resetLedger();
    setLedger(readLedger());
  };

  return (
    <>
      {/* ── Sổ tiết kiệm ── */}
      <section className="save-e-section" aria-labelledby="eco-ledger">
        <h2 id="eco-ledger">Máy này đã tiết kiệm</h2>
        <div className="save-e-card save-e-ledger">
          <div className="save-e-ring">
            <RecycleRing progress={progress} laps={laps} />
            <p>
              <strong>{laps}</strong>
              <small>vòng tái chế</small>
            </p>
          </div>
          <dl className="save-e-stats">
            <div>
              <dt>Lượt gọi máy chủ đã tránh</dt>
              <dd>{requestsAvoided.toLocaleString("vi-VN")}</dd>
            </div>
            <div>
              <dt>Dữ liệu lấy từ máy, không qua mạng</dt>
              <dd>{formatBytes(bytesAvoided)}</dd>
            </div>
            <div>
              <dt>Thời gian chạy nền đen</dt>
              <dd>{formatMinutes(minutes)}</dd>
            </div>
            <div>
              <dt>Bài đang giữ để đọc lại</dt>
              <dd>{listSaved().length}</dd>
            </div>
          </dl>
        </div>
        <p className="save-e-note">
          Ba số đầu là đếm thật từ máy này. Quy ra điện đường truyền thì khoảng{" "}
          <span className="save-e-strong-green">{formatWh(bytesAvoided * WH_PER_BYTE)}</span> — nhỏ,
          vì một người là nhỏ. Ý nghĩa nằm ở chỗ nó nhân lên theo số người dùng và ở việc phần mềm
          không đòi hỏi những gì nó không cần.
        </p>
        <button type="button" className="save-e-link" onClick={clear}>Đặt lại sổ</button>
      </section>

      {/* ── Mức chế độ ── */}
      <section className="save-e-section" aria-labelledby="eco-mode">
        <h2 id="eco-mode">Chế độ</h2>
        <div className="save-e-card">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="save-e-choice"
              aria-pressed={mode === option.value}
              onClick={() => choose(option.value)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {mode === option.value ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
            </button>
          ))}
        </div>
        {mode === "auto" ? (
          <p className="save-e-note">
            Máy đang báo: <span className="save-e-strong-green">{autoReason()}</span>.
            {signals.level != null
              ? ` Ngưỡng tự bật là pin ${Math.round(LOW_BATTERY * 100)}% khi chưa cắm sạc.`
              : ""}
          </p>
        ) : null}
      </section>

      {/* ── Giải thích ── */}
      <section className="save-e-section" aria-labelledby="eco-why">
        <h2 id="eco-why">Vì sao</h2>
        <div className="save-e-card">
          {/* EcoImpact tự có huy hiệu ở đầu, không lồng thêm cái nữa. */}
          <EcoImpact />
        </div>
      </section>
    </>
  );
}
