import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import { HugoInlineNotice, HugoNoticeToast } from "../../shared/HugoNotice";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const ticketStyles = `
@keyframes joyTicketSpin { to { transform: rotate(360deg); } }
@keyframes joyTicketStamp {
  0% { transform: translate(-50%, -50%) rotate(-18deg) scale(1.9); opacity: 0; filter: blur(4px); }
  56% { transform: translate(-50%, -50%) rotate(-11deg) scale(.94); opacity: 1; filter: blur(0); }
  78% { transform: translate(-50%, -50%) rotate(-12deg) scale(1.04); }
  100% { transform: translate(-50%, -50%) rotate(-12deg) scale(1); opacity: 1; }
}
@keyframes joyTicketShine {
  0% { transform: translateX(-130%) rotate(12deg); opacity: 0; }
  35% { opacity: .45; }
  100% { transform: translateX(145%) rotate(12deg); opacity: 0; }
}
.joy-ticket-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px 10px max(12px, env(safe-area-inset-bottom, 0px));
  background: rgba(15, 23, 42, .62);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
}
.joy-ticket {
  --ticket-surface: #ffffff;
  --ticket-soft: #f8fafc;
  --ticket-ink: #0f172a;
  --ticket-muted: #64748b;
  --ticket-line: #e7ecf4;
  --ticket-accent: #695ff6;
  --ticket-accent-2: #8b5cf6;
  --ticket-success: #dc2626;
  --ticket-shadow: 0 32px 80px rgba(15, 23, 42, .30), 0 8px 22px rgba(15, 23, 42, .14);
  width: min(100%, 444px);
  color: var(--ticket-ink);
}
.dark .joy-ticket {
  --ticket-surface: #101119;
  --ticket-soft: #171924;
  --ticket-ink: #f8fafc;
  --ticket-muted: #94a3b8;
  --ticket-line: rgba(255,255,255,.10);
  --ticket-accent: #8b7cf8;
  --ticket-accent-2: #a78bfa;
  --ticket-success: #ef4444;
  --ticket-shadow: 0 34px 86px rgba(0, 0, 0, .56), 0 8px 24px rgba(0, 0, 0, .35);
}
.joy-ticket-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  background: var(--ticket-surface);
  border: 1px solid var(--ticket-line);
  box-shadow: var(--ticket-shadow);
}
.joy-ticket-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--ticket-accent) 16%, transparent), transparent 34%),
    radial-gradient(circle at 90% 10%, color-mix(in srgb, var(--ticket-accent-2) 14%, transparent), transparent 30%);
  opacity: .95;
}
.joy-ticket-header {
  position: relative;
  overflow: hidden;
  padding: 24px 24px 22px;
  background: linear-gradient(135deg, var(--ticket-accent), var(--ticket-accent-2));
  color: white;
}
.joy-ticket-header::after {
  content: "";
  position: absolute;
  top: -35%;
  bottom: -35%;
  width: 76px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent);
  animation: joyTicketShine 3.6s ease-in-out infinite;
}
.joy-ticket-header-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.joy-ticket-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.joy-ticket-logo {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
}
.joy-ticket-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(255,255,255,.66);
}
.joy-ticket-title {
  margin: 0;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -.035em;
  line-height: 1.08;
}
.joy-ticket-close {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: white;
  background: rgba(255,255,255,.16);
  cursor: pointer;
  transition: transform .18s ease, background .18s ease, opacity .18s ease;
}
.joy-ticket-close:hover { transform: translateY(-1px); background: rgba(255,255,255,.22); }
.joy-ticket-body {
  position: relative;
  z-index: 1;
  padding: 22px 24px 0;
  transition: filter .34s ease, opacity .34s ease;
}
.joy-ticket-person {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px;
  border-radius: 18px;
  border: 1px solid var(--ticket-line);
  background: var(--ticket-soft);
}
.joy-ticket-avatar {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  object-fit: cover;
  flex: 0 0 auto;
  border: 2px solid var(--ticket-surface);
}
.joy-ticket-avatar-fallback {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: white;
  background: linear-gradient(135deg, var(--ticket-accent), var(--ticket-accent-2));
}
.joy-ticket-label {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ticket-muted);
}
.joy-ticket-name {
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 950;
  color: var(--ticket-ink);
}
.joy-ticket-sub {
  margin: 3px 0 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ticket-muted);
}
.joy-ticket-section { margin-top: 22px; }
.joy-ticket-item-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 950;
  letter-spacing: -.025em;
  color: var(--ticket-ink);
}
.joy-ticket-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}
.joy-ticket-meta-item {
  min-width: 0;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--ticket-line);
  background: var(--ticket-soft);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  color: var(--ticket-muted);
}
.joy-ticket-meta-item span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 850;
  color: color-mix(in srgb, var(--ticket-ink) 72%, var(--ticket-muted));
}
.joy-ticket-divider {
  position: relative;
  height: 34px;
  margin: 10px -24px 4px;
}
.joy-ticket-divider::before {
  content: "";
  position: absolute;
  left: 36px;
  right: 36px;
  top: 50%;
  height: 1px;
  background-image: repeating-linear-gradient(90deg, var(--ticket-line) 0, var(--ticket-line) 8px, transparent 8px, transparent 16px);
}
.joy-ticket-cut {
  position: absolute;
  top: 50%;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ticket-surface) 86%, #000 14%);
  border: 1px solid var(--ticket-line);
  transform: translateY(-50%);
}
.joy-ticket-cut.left { left: -18px; }
.joy-ticket-cut.right { right: -18px; }
.joy-ticket-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 0;
}
.joy-ticket-row-label {
  font-size: 14px;
  color: var(--ticket-muted);
  font-weight: 650;
}
.joy-ticket-row-value {
  color: color-mix(in srgb, var(--ticket-ink) 86%, var(--ticket-accent));
  font-size: 15px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.joy-ticket-row.total { padding-top: 12px; }
.joy-ticket-row.total .joy-ticket-row-label {
  color: var(--ticket-ink);
  font-size: 17px;
  font-weight: 950;
}
.joy-ticket-row.total .joy-ticket-row-value {
  color: var(--ticket-accent);
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -.035em;
}
.joy-ticket-footer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  padding: 22px 24px 20px;
}
.joy-ticket-button {
  height: 58px;
  border-radius: 18px;
  border: 1px solid var(--ticket-line);
  font-size: 15px;
  font-weight: 950;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease, background .18s ease;
}
.joy-ticket-button:active { transform: scale(.98); }
.joy-ticket-button.cancel {
  background: var(--ticket-soft);
  color: color-mix(in srgb, var(--ticket-ink) 55%, var(--ticket-muted));
}
.joy-ticket-button.confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  color: white;
  background: linear-gradient(135deg, var(--ticket-accent), var(--ticket-accent-2));
  box-shadow: 0 18px 36px color-mix(in srgb, var(--ticket-accent) 28%, transparent);
}
.joy-ticket-button:disabled {
  opacity: .48;
  cursor: not-allowed;
  box-shadow: none;
}
.joy-ticket-disclaimer {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0 24px 20px;
  text-align: center;
  color: color-mix(in srgb, var(--ticket-muted) 72%, transparent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .02em;
}
.joy-ticket-stamp {
  position: absolute;
  left: 50%;
  top: 53%;
  z-index: 8;
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(-12deg);
  border: 4px solid var(--ticket-success);
  border-radius: 14px;
  padding: 12px 26px;
  color: var(--ticket-success);
  background: color-mix(in srgb, var(--ticket-surface) 72%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ticket-success) 10%, transparent) inset;
  animation: joyTicketStamp .62s cubic-bezier(.22,1,.36,1) both;
}
.joy-ticket-stamp span {
  display: block;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.joy-ticket-loading {
  display: grid;
  place-items: center;
  min-height: 260px;
  color: var(--ticket-accent);
}
@media (min-width: 768px) {
  .joy-ticket-backdrop { align-items: center; padding: 24px; }
}
@media (max-width: 380px) {
  .joy-ticket-header { padding: 20px; }
  .joy-ticket-body { padding: 18px 18px 0; }
  .joy-ticket-footer { padding: 18px; }
  .joy-ticket-meta { grid-template-columns: 1fr; }
}
`;

function formatJoy(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} JOY`;
}

function SuccessStamp({ show }) {
  if (!show) return null;
  return (
    <div className="joy-ticket-stamp">
      <span>[Thành công]</span>
    </div>
  );
}

function TicketDivider() {
  return (
    <div className="joy-ticket-divider">
      <span className="joy-ticket-cut left" />
      <span className="joy-ticket-cut right" />
    </div>
  );
}

function Row({ label, value, total = false, muted = false }) {
  return (
    <div className={`joy-ticket-row ${total ? "total" : ""}`}>
      <span className="joy-ticket-row-label">{label}</span>
      <span className="joy-ticket-row-value">{value}</span>
    </div>
  );
}

export default function JoyExchangeModal({ open, bio, item, onClose, onConfirm, onSuccess }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!open || !bio?.email || !item) return;
    setPhase("idle");
    setError("");
    setQuote(null);
    setLoading(true);
    fetch(`${API_BASE}/joy/exchange-quote?email=${encodeURIComponent(bio.email)}&item=${encodeURIComponent(item)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Không tải được phiếu trao đổi.");
        setQuote(d);
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      })
      .finally(() => setLoading(false));
  }, [open, bio?.email, item]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const now = useMemo(() => new Date(), [open, quote?.label]);
  const dateStr = useMemo(() => now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }), [now]);
  const timeStr = useMemo(() => now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), [now]);
  const txId = useMemo(() => `JOY${Math.random().toString(36).slice(2, 10).toUpperCase()}`, [open, quote?.label]);
  const insufficientBalance = quote && quote.balance < quote.total;

  const triggerToast = () => {
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  };

  const handleConfirm = async () => {
    setPhase("confirming");
    setError("");
    try {
      const result = await onConfirm();
      setPhase("paid");
      triggerToast();
      setTimeout(() => {
        onSuccess?.(result);
        onClose();
        setPhase("idle");
      }, 1750);
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  };

  if (!open && !toastVisible) return null;

  return (
    <>
      <style>{ticketStyles}</style>
      <HugoNoticeToast
        open={toastVisible}
        type="success"
        title="Thành công"
        message={quote?.total ? `Đã trao đổi ${formatJoy(quote.total)}` : "Giao dịch đã hoàn tất"}
        detail={quote?.label}
        onClose={() => setToastVisible(false)}
        zIndex={10001}
      />

      {phase === "paid" && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}
          recycle={false}
          numberOfPieces={170}
          gravity={0.18}
          tweenDuration={900}
        />
      )}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="joy-ticket-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .22 }}
              onClick={(e) => {
                if (e.target === e.currentTarget && phase !== "confirming") onClose();
              }}
            >
              <motion.div
                className="joy-ticket"
                initial={{ y: 38, opacity: 0, scale: .96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 34, opacity: 0, scale: .97 }}
                transition={{ type: "spring", damping: 28, stiffness: 360 }}
              >
                <div className="joy-ticket-card">
                  <SuccessStamp show={phase === "paid"} />

                  <header className="joy-ticket-header">
                    <div className="joy-ticket-header-inner">
                      <div className="joy-ticket-brand">
                        <div className="joy-ticket-logo">
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                        </div>
                        <div className="min-w-0">
                          <p className="joy-ticket-kicker">Hugo Studio</p>
                          <h2 className="joy-ticket-title">Phiếu trao đổi JOY</h2>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="joy-ticket-close"
                        onClick={onClose}
                        disabled={phase === "confirming"}
                        aria-label="Đóng phiếu trao đổi JOY"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </header>

                  <main className="joy-ticket-body" style={phase === "paid" ? { filter: "grayscale(.35)", opacity: .72 } : undefined}>
                    {loading && (
                      <div className="joy-ticket-loading">
                        <span className="material-symbols-outlined text-[34px]" style={{ animation: "joyTicketSpin 1s linear infinite" }}>progress_activity</span>
                      </div>
                    )}

                    {!loading && quote && (
                      <>
                        <section className="joy-ticket-person">
                          {quote.trader?.avatarUrl ? (
                            <img className="joy-ticket-avatar" src={quote.trader.avatarUrl} alt="" />
                          ) : (
                            <div className="joy-ticket-avatar-fallback">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="joy-ticket-label">Người giao dịch</p>
                            <p className="joy-ticket-name">{quote.trader?.displayName || quote.trader?.email}</p>
                            <p className="joy-ticket-sub">{quote.trader?.email}</p>
                          </div>
                        </section>

                        <section className="joy-ticket-section">
                          <p className="joy-ticket-label">Nội dung</p>
                          <h3 className="joy-ticket-item-title">{quote.label}</h3>
                          <div className="joy-ticket-meta">
                            {[
                              { icon: "calendar_today", text: dateStr },
                              { icon: "schedule", text: timeStr },
                              { icon: "tag", text: txId },
                            ].map((meta) => (
                              <div key={meta.icon} className="joy-ticket-meta-item">
                                <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                                <span>{meta.text}</span>
                              </div>
                            ))}
                          </div>
                        </section>

                        <TicketDivider />

                        <section>
                          <Row label="Giá dịch vụ" value={formatJoy(quote.priceJoy)} />
                          <Row label="Phí sáng tạo (10%)" value={formatJoy(quote.tax)} muted />
                        </section>

                        <TicketDivider />

                        <section>
                          <Row label="Tổng thanh toán" value={formatJoy(quote.total)} total />
                          <Row label="Số dư hiện tại" value={formatJoy(quote.balance)} muted />
                        </section>
                      </>
                    )}

                    {insufficientBalance && (
                      <HugoInlineNotice
                        type="warning"
                        title="Chưa đủ JOY"
                        message={`Số dư JOY chưa đủ. Cần thêm ${formatJoy(quote.total - quote.balance)}.`}
                        className="mt-3.5"
                      />
                    )}

                    {(phase === "error" || error) && (
                      <HugoInlineNotice
                        type="error"
                        title="Không thể trao đổi"
                        message={error}
                        className="mt-3.5"
                      />
                    )}
                  </main>

                  {phase !== "paid" && (
                    <footer className="joy-ticket-footer">
                      <button
                        type="button"
                        className="joy-ticket-button cancel"
                        onClick={onClose}
                        disabled={phase === "confirming"}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="joy-ticket-button confirm"
                        onClick={handleConfirm}
                        disabled={loading || phase === "confirming" || !quote || insufficientBalance}
                      >
                        {phase === "confirming" ? (
                          <>
                            <span className="material-symbols-outlined text-[18px]" style={{ animation: "joyTicketSpin 1s linear infinite" }}>progress_activity</span>
                            Đang xử lý
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Xác nhận
                          </>
                        )}
                      </button>
                    </footer>
                  )}

                  <p className="joy-ticket-disclaimer">JOY là đồng tích góp phi lợi nhuận - không thể nạp bằng tiền mặt</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
