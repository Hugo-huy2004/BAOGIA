import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

/* ─── Toast ───────────────────────────────────────────────────────────────── */
const toastStyle = {
  position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
  zIndex: 9999, paddingTop: "env(safe-area-inset-top, 0px)",
  pointerEvents: "none",
};

function JoyToast({ amount, label, visible }) {
  return createPortal(
    <div style={toastStyle}>
      <div style={{
        marginTop: 12,
        background: "#111",
        color: "#fff",
        borderRadius: 16,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,.35)",
        border: "1px solid rgba(255,255,255,.08)",
        minWidth: 240,
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        opacity: visible ? 1 : 0,
        transition: "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s ease",
        willChange: "transform, opacity",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>toll</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", margin: 0, lineHeight: 1 }}>Đã trao đổi</p>
          <p style={{ fontSize: 13, fontWeight: 800, margin: "3px 0 0", color: "#f59e0b", letterSpacing: "-.02em" }}>
            -{amount?.toLocaleString("vi-VN")} JOY
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#22c55e", fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>check_circle</span>
      </div>
    </div>,
    document.body
  );
}

/* ─── PAID stamp ──────────────────────────────────────────────────────────── */
const stampKeyframes = `
@keyframes joyStampIn {
  0%   { transform: rotate(-18deg) scale(2.2); opacity: 0; }
  55%  { transform: rotate(-13deg) scale(0.93); opacity: 1; }
  75%  { transform: rotate(-15deg) scale(1.04); }
  100% { transform: rotate(-15deg) scale(1); opacity: 1; }
}`;

function PaidStamp({ show }) {
  return (
    <>
      <style>{stampKeyframes}</style>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 10,
      }}>
        <div style={{
          border: "3px solid #16a34a",
          borderRadius: 8,
          padding: "6px 18px",
          transform: show ? "rotate(-15deg) scale(1)" : "rotate(-18deg) scale(2.2)",
          opacity: show ? 1 : 0,
          animation: show ? "joyStampIn .5s cubic-bezier(.22,1,.36,1) forwards" : "none",
          transition: "opacity .1s",
        }}>
          <p style={{
            margin: 0, fontSize: 22, fontWeight: 900, color: "#16a34a",
            letterSpacing: ".18em", textTransform: "uppercase", lineHeight: 1,
            textShadow: "0 0 12px rgba(22,163,74,.3)",
          }}>ĐÃ THANH TOÁN</p>
        </div>
      </div>
    </>
  );
}

/* ─── Dashed divider with circular cutouts ────────────────────────────────── */
function TicketDivider() {
  return (
    <div style={{ position: "relative", height: 1, margin: "0 -1px" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 6px, transparent 6px, transparent 12px)",
        top: "50%",
      }} className="dark:[background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.12)_0,rgba(255,255,255,.12)_6px,transparent_6px,transparent_12px)]" />
      {/* Left circle cutout */}
      <div style={{
        position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
        width: 24, height: 24, borderRadius: "50%",
        background: "var(--ticket-bg, #f8fafc)",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box",
      }} />
      {/* Right circle cutout */}
      <div style={{
        position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
        width: 24, height: 24, borderRadius: "50%",
        background: "var(--ticket-bg, #f8fafc)",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box",
      }} />
    </div>
  );
}

/* ─── Row component ───────────────────────────────────────────────────────── */
function Row({ label, value, bold, accent, large, muted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{
        fontSize: large ? 13 : 11,
        fontWeight: bold ? 800 : 500,
        color: muted ? "#94a3b8" : bold ? "#0f172a" : "#64748b",
        letterSpacing: "-.01em",
      }} className="dark:text-slate-300">{label}</span>
      <span style={{
        fontSize: large ? 15 : 12,
        fontWeight: bold ? 900 : 700,
        color: accent ? "#6366f1" : bold ? "#0f172a" : "#1e293b",
        letterSpacing: "-.02em",
        fontVariantNumeric: "tabular-nums",
      }} className={accent ? "text-primary" : "dark:text-white"}>{value}</span>
    </div>
  );
}

/* ─── Main modal ──────────────────────────────────────────────────────────── */
export default function JoyExchangeModal({ open, bio, item, onClose, onConfirm, onSuccess }) {
  const [quote, setQuote]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState("idle"); // idle | confirming | paid | error
  const [error, setError]       = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!open || !bio?.email || !item) return;
    setPhase("idle");
    setError("");
    setQuote(null);
    setLoading(true);
    fetch(`${API_BASE}/joy/exchange-quote?email=${encodeURIComponent(bio.email)}&item=${encodeURIComponent(item)}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Không tải được hóa đơn.");
        setQuote(d);
      })
      .catch(e => { setError(e.message); setPhase("error"); })
      .finally(() => setLoading(false));
  }, [open, bio?.email, item]);

  // Show toast then auto-close
  const triggerToast = () => {
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3200);
  };

  const handleConfirm = async () => {
    setPhase("confirming");
    setError("");
    try {
      const result = await onConfirm();
      setPhase("paid");
      triggerToast();
      // Let PAID stamp show for 1.8s, then call onSuccess + close
      setTimeout(() => {
        onSuccess?.(result);
        onClose();
        setPhase("idle");
      }, 1800);
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const insufficientBalance = quote && quote.balance < quote.total;

  if (!open && !toastVisible) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const txId = `JOY${Date.now().toString(36).toUpperCase().slice(-8)}`;

  return (
    <>
      {/* Toast — always rendered so it can animate out even after modal closes */}
      <JoyToast amount={quote?.total} label={quote?.label} visible={toastVisible} />

      {phase === "paid" && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget && phase !== "confirming") onClose(); }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              padding: "0 0 env(safe-area-inset-bottom,0px)",
              background: "rgba(0,0,0,.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "100%", maxWidth: 440,
              }}
            >

            {/* ── TICKET CARD ─────────────────────────────── */}
            <div style={{
              margin: "0 12px 12px",
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 -4px 40px rgba(0,0,0,.25), 0 2px 12px rgba(0,0,0,.15)",
              overflow: "visible",
              position: "relative",
              "--ticket-bg": "#ffffff",
            }} className="dark:[--ticket-bg:#1e1e2e] dark:bg-[#1e1e2e]">

              {/* PAID stamp overlay */}
              {phase === "paid" && <PaidStamp show={phase === "paid"} />}

              {/* ── Header strip ──── */}
              <div style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: "20px 20px 0 0",
                padding: "18px 20px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff", fontVariationSettings: "'FILL' 1" }}>toll</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.65)", letterSpacing: ".14em", textTransform: "uppercase" }}>HugoStudio</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-.02em", lineHeight: 1.2 }}>Phiếu trao đổi JOY</p>
                  </div>
                </div>
                <button onClick={onClose} disabled={phase === "confirming"} style={{
                  background: "rgba(255,255,255,.15)", border: "none",
                  width: 28, height: 28, borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", opacity: phase === "confirming" ? .4 : 1,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>

              {/* ── Body ──── */}
              <div style={{ padding: "18px 20px", filter: phase === "paid" ? "grayscale(.7) opacity(.7)" : "none", transition: "filter .4s" }}>

                {loading && (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#6366f1", animation: "spin 1s linear infinite" }}>progress_activity</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </div>
                )}

                {!loading && quote && (
                  <>
                    {/* Trader info */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#f8fafc", borderRadius: 12, padding: "10px 12px",
                      marginBottom: 14, border: "1px solid #f1f5f9",
                    }} className="dark:bg-white/5 dark:border-white/8">
                      {quote.trader?.avatarUrl
                        ? <img src={quote.trader.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        : (
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#fff" }}>person</span>
                          </div>
                        )
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase" }}>Người giao dịch</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="dark:text-white">{quote.trader?.displayName || quote.trader?.email}</p>
                        <p style={{ margin: "1px 0 0", fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quote.trader?.email}</p>
                      </div>
                    </div>

                    {/* Item */}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase" }}>Nội dung</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }} className="dark:text-white">{quote.label}</p>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {[
                        { icon: "calendar_today", text: dateStr },
                        { icon: "schedule", text: timeStr },
                        { icon: "tag", text: txId },
                      ].map(m => (
                        <div key={m.icon} style={{
                          flex: 1, display: "flex", alignItems: "center", gap: 4,
                          background: "#f8fafc", borderRadius: 8, padding: "5px 8px",
                          border: "1px solid #f1f5f9", overflow: "hidden",
                        }} className="dark:bg-white/5 dark:border-white/8">
                          <span className="material-symbols-outlined" style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{m.icon}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!loading && quote && (
                  <>
                    <TicketDivider />

                    {/* Breakdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0 10px" }}>
                      <Row label="Giá dịch vụ" value={`${quote.priceJoy.toLocaleString("vi-VN")} JOY`} />
                      <Row label="Phí sáng tạo (10%)" value={`${quote.tax.toLocaleString("vi-VN")} JOY`} muted />
                    </div>

                    <TicketDivider />

                    {/* Total */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0 0" }}>
                      <Row label="Tổng thanh toán" value={`${quote.total.toLocaleString("vi-VN")} JOY`} bold accent large />
                      <Row
                        label="Số dư hiện tại"
                        value={`${quote.balance.toLocaleString("vi-VN")} JOY`}
                        muted
                      />
                      {!insufficientBalance && (
                        <Row
                          label="Còn lại sau giao dịch"
                          value={`${(quote.balance - quote.total).toLocaleString("vi-VN")} JOY`}
                          muted
                        />
                      )}
                    </div>
                  </>
                )}

                {insufficientBalance && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ef4444", flexShrink: 0 }}>warning</span>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#ef4444" }}>
                      Số dư JOY chưa đủ. Cần thêm {(quote.total - quote.balance).toLocaleString("vi-VN")} JOY.
                    </p>
                  </div>
                )}

                {(phase === "error" || error) && (
                  <div style={{
                    marginTop: 10, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)",
                  }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#ef4444", textAlign: "center" }}>{error}</p>
                  </div>
                )}
              </div>

              {/* ── Footer buttons ──── */}
              {phase !== "paid" && (
                <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
                  <button
                    onClick={onClose}
                    disabled={phase === "confirming"}
                    style={{
                      flex: 1, padding: "13px 0", borderRadius: 14, border: "1px solid #e5e7eb",
                      background: "#f8fafc", color: "#64748b",
                      fontSize: 13, fontWeight: 700, cursor: "pointer", transition: ".15s",
                      opacity: phase === "confirming" ? .4 : 1,
                    }}
                    className="dark:bg-white/5 dark:border-white/10 dark:text-slate-400"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || phase === "confirming" || !quote || insufficientBalance}
                    style={{
                      flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
                      background: (loading || !quote || insufficientBalance) ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", fontSize: 13, fontWeight: 800,
                      cursor: (loading || !quote || insufficientBalance) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      boxShadow: (!loading && quote && !insufficientBalance) ? "0 4px 20px rgba(99,102,241,.4)" : "none",
                      transition: "all .2s",
                      transform: phase === "confirming" ? "scale(.98)" : "scale(1)",
                    }}
                  >
                    {phase === "confirming"
                      ? (<><span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span> Đang xử lý...</>)
                      : (<><span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span> Xác nhận</>)
                    }
                  </button>
                </div>
              )}

              {/* Disclaimer */}
              <p style={{
                margin: "0 20px 18px", textAlign: "center",
                fontSize: 9, fontWeight: 600, color: "#cbd5e1", letterSpacing: ".04em",
              }}>
                JOY là đồng tích góp phi lợi nhuận — không thể nạp bằng tiền mặt
              </p>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
