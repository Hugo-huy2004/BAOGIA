import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { searchJoyUser, getJoyQrPayload, resolveJoyQr, transferJoy } from "../../../services/joyApi";

const RECENT_KEY = "joy_recent_contacts";
const QUICK_AMOUNTS = [50, 100, 200, 500];
const NOTE_CHIPS = ["Ăn uống", "Chi phí", "Cảm ơn!", "Tặng bạn", "Tiền học", "Game cùng", "Tự trả"];
const TRANSFER_FEE_RATE = 0.05;

const css = `
@keyframes jtRingPulse {
  0%   { transform: scale(1);   opacity: .35; }
  100% { transform: scale(1.65); opacity: 0; }
}
@keyframes jtSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes jtFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes jtSpin {
  to { transform: rotate(360deg); }
}
@keyframes jtScanLine {
  0%,100% { top: 10%; }
  50%      { top: 85%; }
}
@keyframes jtStampIn {
  0%   { transform: rotate(-18deg) scale(2.2); opacity: 0; }
  55%  { transform: rotate(-13deg) scale(.93); opacity: 1; }
  75%  { transform: rotate(-15deg) scale(1.04); }
  100% { transform: rotate(-15deg) scale(1); opacity: 1; }
}
@keyframes jtSuccessBounce {
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.12); }
}
`;

/* ─── Utilities ─────────────────────────────────────────────────────────── */
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(contact) {
  const list = getRecent().filter(c => c.referralCode !== contact.referralCode);
  list.unshift({ ...contact, lastSent: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
}

function Avatar({ name, url, size = 40 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 900, fontSize: size * 0.38,
    }}>{(name || "?")[0].toUpperCase()}</div>
  );
}

/* ─── Apple Pay Circular QR ──────────────────────────────────────────────── */
function CircularQR({ payload, displayName, avatarUrl, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "radial-gradient(ellipse at 50% 40%, #25154d 0%, #070713 56%, #000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "jtFadeIn .25s ease",
    }}>
      <style>{css}</style>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%",
        width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>

      <p style={{ color: "rgba(255,255,255,.62)", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 40 }}>
        QR Nhận JOY
      </p>

      {/* Ring container */}
      <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 0.5, 1].map((delay, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 260, height: 260, borderRadius: "50%",
            border: "1.5px solid rgba(99,102,241,.28)",
            animation: `jtRingPulse 2s ease-out ${delay}s infinite`,
          }} />
        ))}
        <div style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          background: "conic-gradient(from 180deg, #22d3ee, #8b5cf6, #ec4899, #f59e0b, #22c55e, #22d3ee)",
          filter: "blur(6px)",
          opacity: .22,
        }} />
        {/* QR circle */}
        <div style={{
          width: 220, height: 220, borderRadius: "50%",
          background: "conic-gradient(from 160deg, rgba(34,211,238,.18), rgba(139,92,246,.2), rgba(236,72,153,.2), rgba(245,158,11,.18), rgba(34,197,94,.18), rgba(34,211,238,.18))",
          padding: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 34px rgba(99,102,241,.38), 0 0 84px rgba(236,72,153,.12)",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.8)",
          }}>
            <QRCodeSVG
              value={payload}
              size={170}
              bgColor="#ffffff"
              fgColor="#0f0f1a"
              level="H"
              includeMargin={false}
              style={{ display: "block", borderRadius: "50%" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28, gap: 6 }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(139,92,246,.6)", marginBottom: 2 }} />
          : null}
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "-.02em" }}>{displayName}</p>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, fontWeight: 600 }}>Quét để gửi JOY cho tôi</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <button
          onClick={() => {
            if (navigator.share) navigator.share({ title: "JOY QR", text: `Gửi JOY cho tôi!\nMã: ${payload}` });
            else navigator.clipboard.writeText(payload);
          }}
          style={{
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 14, padding: "10px 20px",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
          Chia sẻ
        </button>
      </div>
    </div>
  );
}

/* ─── QR Scanner ─────────────────────────────────────────────────────────── */
function QRScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [status, setStatus] = useState("init"); // init | active | error | unsupported

  const stopStream = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // Callback ref: called by React as soon as <video> is inserted into the DOM.
  // Guarantees the element exists before we try to assign srcObject.
  const videoCallbackRef = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setStatus("unsupported");
      return;
    }
    detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        streamRef.current = stream;
        // If videoRef is already mounted (callback ref already ran), attach now.
        // Otherwise videoCallbackRef will attach when the element mounts.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setStatus("active");
      })
      .catch(() => setStatus("error"));

    return stopStream;
  }, []);

  useEffect(() => {
    if (status !== "active") return;
    let active = true;

    const tick = async () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        if (active) animRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0 && active) {
          active = false;
          stopStream();
          onDetected(barcodes[0].rawValue);
          return;
        }
      } catch (_) {}
      if (active) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animRef.current); };
  }, [status, onDetected]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "jtFadeIn .25s ease",
    }}>
      <style>{css}</style>
      <button onClick={() => { stopStream(); onClose(); }} style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%",
        width: 36, height: 36, cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>

      <p style={{ color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 40 }}>
        Quét QR JOY
      </p>

      <div style={{ position: "relative", width: 260, height: 260, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(139,92,246,.6)", boxShadow: "0 0 40px rgba(139,92,246,.4)" }}>
        {/* Video always in DOM so ref is available when stream arrives */}
        <video
          ref={videoCallbackRef}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover",
            display: status === "active" ? "block" : "none",
          }}
          playsInline
          muted
        />

        {/* Scan line — only when actively scanning */}
        {status === "active" && (
          <div style={{
            position: "absolute", left: "5%", right: "5%", height: 2,
            background: "linear-gradient(90deg,transparent,#8b5cf6,transparent)",
            animation: "jtScanLine 2s ease-in-out infinite",
            boxShadow: "0 0 8px #8b5cf6",
            zIndex: 2,
          }} />
        )}

        {/* Overlay states */}
        {status === "init" && (
          <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#8b5cf6", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
          </div>
        )}
        {(status === "error" || status === "unsupported") && (
          <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#ef4444", marginBottom: 8 }}>camera_off</span>
            <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
              {status === "unsupported" ? "Trình duyệt chưa hỗ trợ quét QR" : "Không truy cập được camera"}
            </p>
          </div>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 24, fontWeight: 600 }}>
        Hướng camera vào mã QR JOY
      </p>

      {(status === "error" || status === "unsupported") && (
        <p style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginTop: 8 }}>
          Dùng tính năng Tìm kiếm bên dưới thay thế
        </p>
      )}
    </div>
  );
}

/* ─── Contact Card ───────────────────────────────────────────────────────── */
function ContactCard({ contact, onSelect }) {
  return (
    <button
      onClick={() => onSelect(contact)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 0", background: "none", border: "none", cursor: "pointer",
        textAlign: "left",
      }}
    >
      <Avatar name={contact.displayName} url={contact.avatarUrl} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--foreground,#0f172a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.displayName}</p>
        {contact.maskedPhone && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>{contact.maskedPhone}</p>}
        {contact.referralCode && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>#{contact.referralCode}</p>}
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#94a3b8" }}>chevron_right</span>
    </button>
  );
}

/* ─── Dashed divider ─────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ position: "relative", margin: "4px -1px", height: 1 }}>
      <div style={{
        backgroundImage: "repeating-linear-gradient(90deg,#e5e7eb 0,#e5e7eb 6px,transparent 6px,transparent 12px)",
        position: "absolute", inset: 0, top: "50%",
      }} />
      {["left", "right"].map(side => (
        <div key={side} style={{
          position: "absolute", [side]: -12, top: "50%", transform: "translateY(-50%)",
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--joy-modal-bg, #fff)",
          border: "1px solid #e5e7eb", boxSizing: "border-box",
        }} />
      ))}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function JoyTransferModal({ open, bio, onClose, onSuccess }) {
  const [step, setStep] = useState("select"); // select | amount | invoice | sending | success
  const [mode, setMode] = useState("search"); // search | myqr | scan
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [myQR, setMyQR] = useState(null);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResolving, setScanResolving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const numAmount = parseInt(amount, 10) || 0;
  const fee = Math.floor(numAmount * TRANSFER_FEE_RATE);
  const total = numAmount + fee;

  useEffect(() => {
    if (!open) return;
    setStep("select"); setMode("search"); setRecipient(null);
    setAmount(""); setNote(""); setSearchQ(""); setSearchResults([]);
    setError(""); setResult(null);
    setRecentContacts(getRecent());
  }, [open]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQ.trim() || !bio?.email) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchJoyUser(searchQ, bio.email);
        setSearchResults(data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 320);
    return () => clearTimeout(debounceRef.current);
  }, [searchQ, bio?.email]);

  // Load My QR when mode changes
  useEffect(() => {
    if (mode !== "myqr" || !bio?.email || myQR) return;
    getJoyQrPayload(bio.email).then(setMyQR).catch(() => {});
  }, [mode, bio?.email, myQR]);

  const selectRecipient = useCallback((contact) => {
    setRecipient(contact);
    setStep("amount");
    setError("");
  }, []);

  const handleQRDetected = useCallback(async (rawValue) => {
    setScanResolving(true);
    setScanOpen(false);
    try {
      const data = await resolveJoyQr(rawValue);
      selectRecipient(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanResolving(false);
    }
  }, [selectRecipient]);

  const handleSend = async () => {
    setStep("sending");
    setError("");
    try {
      const data = await transferJoy({
        fromEmail: bio.email,
        toReferralCode: recipient.referralCode,
        amount: numAmount,
        message: note.trim(),
      });
      setResult(data);
      saveRecent({ displayName: recipient.displayName, avatarUrl: recipient.avatarUrl, referralCode: recipient.referralCode });
      onSuccess?.(data);
      setStep("success");
    } catch (e) {
      setError(e.message);
      setStep("invoice");
    }
  };

  const close = () => {
    if (step === "sending") return;
    onClose();
  };

  if (!open && !qrFullscreen && !scanOpen) return null;

  return createPortal(
    <>
      <style>{css}</style>

      {/* Apple Pay QR fullscreen */}
      {qrFullscreen && myQR && (
        <CircularQR
          payload={myQR.payload}
          displayName={myQR.displayName}
          avatarUrl={myQR.avatarUrl}
          onClose={() => setQrFullscreen(false)}
        />
      )}

      {/* QR Scanner fullscreen */}
      {scanOpen && (
        <QRScanner
          onDetected={handleQRDetected}
          onClose={() => setScanOpen(false)}
        />
      )}

      {/* Main modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)",
            animation: "jtFadeIn .2s ease",
          }}
        >
          <div style={{
            width: "100%", maxWidth: 440,
            animation: "jtSlideUp .35s cubic-bezier(.34,1.1,.64,1)",
            "--joy-modal-bg": "#fff",
          }}>
            <div style={{
              margin: "0 12px 12px",
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 -4px 40px rgba(0,0,0,.2), 0 2px 12px rgba(0,0,0,.1)",
              overflow: "hidden",
            }} className="dark:bg-[#1a1924]">

              {/* ── Header ── */}
              <div style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                padding: "16px 18px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {step !== "select" && (
                  <button
                    onClick={() => { setStep(step === "amount" ? "select" : step === "invoice" ? "amount" : "select"); setError(""); }}
                    style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back_ios_new</span>
                  </button>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".14em", textTransform: "uppercase" }}>HugoStudio</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-.02em" }}>
                    {step === "select" && "Chuyển JOY"}
                    {step === "amount" && `Gửi → ${recipient?.displayName}`}
                    {step === "invoice" && "Xác nhận"}
                    {step === "sending" && "Đang xử lý..."}
                    {step === "success" && "Thành công!"}
                  </p>
                </div>
                <button onClick={close} disabled={step === "sending"} style={{
                  background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
                  width: 28, height: 28, cursor: "pointer", color: "#fff", opacity: step === "sending" ? .4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>

              {/* ── Step: Select ── */}
              {step === "select" && (
                <div style={{ padding: "14px 18px 18px" }}>
                  {/* Mode tabs */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {[
                      { id: "search", icon: "person_search", label: "Tìm kiếm" },
                      { id: "myqr", icon: "qr_code_2", label: "Mã QR của tôi" },
                      { id: "scan", icon: "qr_code_scanner", label: "Quét QR" },
                    ].map(m => (
                      <button key={m.id} onClick={() => setMode(m.id)} style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                        padding: "8px 4px",
                        borderRadius: 12, border: mode === m.id ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
                        background: mode === m.id ? "rgba(99,102,241,.08)" : "transparent",
                        cursor: "pointer", transition: ".15s",
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: mode === m.id ? "#6366f1" : "#94a3b8", fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: mode === m.id ? "#6366f1" : "#94a3b8", letterSpacing: ".04em" }}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search mode */}
                  {mode === "search" && (
                    <>
                      <div style={{ position: "relative", marginBottom: 12 }}>
                        <span className="material-symbols-outlined" style={{
                          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                          fontSize: 18, color: "#94a3b8",
                        }}>search</span>
                        <input
                          autoFocus
                          value={searchQ}
                          onChange={e => setSearchQ(e.target.value)}
                          placeholder="Tên, SĐT, mã giới thiệu..."
                          style={{
                            width: "100%", padding: "11px 12px 11px 38px", borderRadius: 12,
                            border: "1.5px solid #e5e7eb", background: "#f8fafc",
                            fontSize: 13, fontWeight: 600, outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        {searching && (
                          <span className="material-symbols-outlined" style={{
                            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                            fontSize: 16, color: "#6366f1", animation: "jtSpin 1s linear infinite",
                          }}>progress_activity</span>
                        )}
                      </div>

                      {/* Results */}
                      {searchQ.trim() && searchResults.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Kết quả tìm kiếm</p>
                          <div style={{ borderTop: "1px solid #f1f5f9" }}>
                            {searchResults.map(c => (
                              <div key={c.referralCode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <ContactCard contact={c} onSelect={selectRecipient} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQ.trim() && !searching && searchResults.length === 0 && (
                        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "12px 0" }}>Không tìm thấy người dùng</p>
                      )}

                      {/* Recent contacts */}
                      {!searchQ.trim() && recentContacts.length > 0 && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Gần đây</p>
                          <div style={{ borderTop: "1px solid #f1f5f9" }}>
                            {recentContacts.map(c => (
                              <div key={c.referralCode} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <ContactCard contact={c} onSelect={selectRecipient} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!searchQ.trim() && recentContacts.length === 0 && (
                        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#e5e7eb" }}>person_search</span>
                          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>Tìm theo tên, SĐT hoặc mã giới thiệu</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* My QR mode */}
                  {mode === "myqr" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 4px" }}>
                      {!myQR ? (
                        <div style={{ padding: "32px 0" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#6366f1", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                        </div>
                      ) : (
                        <>
                          {/* Mini circular preview */}
                          <div
                            onClick={() => setQrFullscreen(true)}
                            style={{
                              position: "relative", width: 200, height: 200,
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                            }}
                          >
                            {[0, 0.4, 0.8].map((delay, i) => (
                              <div key={i} style={{
                                position: "absolute", width: 200, height: 200, borderRadius: "50%",
                                border: "1.5px solid rgba(99,102,241,.22)",
                                animation: `jtRingPulse 2s ease-out ${delay}s infinite`,
                              }} />
                            ))}
                            <div style={{
                              position: "absolute",
                              inset: 10,
                              borderRadius: "50%",
                              background: "conic-gradient(from 180deg, #22d3ee, #8b5cf6, #ec4899, #f59e0b, #22c55e, #22d3ee)",
                              filter: "blur(5px)",
                              opacity: .18,
                            }} />
                            <div style={{
                              width: 164, height: 164, borderRadius: "50%",
                              background: "conic-gradient(from 160deg, rgba(34,211,238,.18), rgba(139,92,246,.2), rgba(236,72,153,.2), rgba(245,158,11,.18), rgba(34,197,94,.18), rgba(34,211,238,.18))",
                              padding: 8,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              overflow: "hidden", boxShadow: "0 4px 24px rgba(99,102,241,.18)",
                            }}>
                              <div style={{
                                width: "100%", height: "100%", borderRadius: "50%",
                                background: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden",
                              }}>
                                <QRCodeSVG value={myQR.payload} size={130} bgColor="#fff" fgColor="#0f0f1a" level="H" includeMargin={false} />
                              </div>
                            </div>
                          </div>
                          <p style={{ color: "#0f172a", fontWeight: 900, fontSize: 14, marginTop: 12 }} className="dark:text-white">{myQR.displayName}</p>
                          <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Chạm để phóng to</p>
                          <button
                            onClick={() => setQrFullscreen(true)}
                            style={{
                              marginTop: 14, padding: "10px 24px", borderRadius: 999,
                              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
                              color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                              boxShadow: "0 4px 16px rgba(99,102,241,.4)",
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>fullscreen</span>
                            Hiển thị QR
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Scan mode */}
                  {mode === "scan" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0" }}>
                      {scanResolving ? (
                        <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#6366f1", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                          <p style={{ color: "#94a3b8", fontSize: 12 }}>Đang xác minh mã...</p>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            width: 120, height: 120, borderRadius: "50%",
                            background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1))",
                            border: "2px dashed rgba(99,102,241,.4)",
                            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#6366f1", fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                          </div>
                          <p style={{ color: "#0f172a", fontWeight: 800, fontSize: 14, marginBottom: 4 }} className="dark:text-white">Quét QR để gửi JOY</p>
                          <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 18, textAlign: "center" }}>Mở QR của người nhận rồi bấm quét</p>
                          <button
                            onClick={() => setScanOpen(true)}
                            style={{
                              padding: "12px 32px", borderRadius: 999,
                              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
                              color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 8,
                              boxShadow: "0 4px 16px rgba(99,102,241,.35)",
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>camera_alt</span>
                            Mở camera quét
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step: Amount ── */}
              {step === "amount" && recipient && (
                <div style={{ padding: "14px 18px 18px" }}>
                  {/* Recipient chip */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#f8fafc", borderRadius: 14, padding: "10px 14px", marginBottom: 16,
                    border: "1px solid #f1f5f9",
                  }}>
                    <Avatar name={recipient.displayName} url={recipient.avatarUrl} size={38} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Người nhận</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">{recipient.displayName}</p>
                    </div>
                    <button onClick={() => { setStep("select"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>Đổi</button>
                  </div>

                  {/* Amount input */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".1em" }}>Số JOY gửi</p>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" min="10" max="1000"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Tối thiểu 10 JOY"
                        style={{
                          width: "100%", padding: "13px 56px 13px 14px", borderRadius: 14,
                          border: "1.5px solid #e5e7eb", background: "#f8fafc",
                          fontSize: 18, fontWeight: 900, outline: "none", boxSizing: "border-box",
                          color: "#0f172a",
                        }}
                      />
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>JOY</span>
                    </div>
                    {numAmount > 0 && (
                      <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        Phí sáng tạo: <strong style={{ color: "#6366f1" }}>{fee} JOY</strong>
                        {" · "}Tổng: <strong style={{ color: "#0f172a" }}>{total} JOY</strong>
                      </p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {QUICK_AMOUNTS.map(q => (
                      <button key={q} onClick={() => setAmount(String(q))} style={{
                        flex: 1, padding: "7px 0", borderRadius: 999,
                        border: amount === String(q) ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
                        background: amount === String(q) ? "rgba(99,102,241,.08)" : "#f8fafc",
                        color: amount === String(q) ? "#6366f1" : "#64748b",
                        fontSize: 11, fontWeight: 800, cursor: "pointer",
                      }}>{q}</button>
                    ))}
                  </div>

                  {/* Note */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".1em" }}>Nội dung (tùy chọn)</p>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Nhập nội dung..."
                      maxLength={100}
                      style={{
                        width: "100%", padding: "11px 14px", borderRadius: 12,
                        border: "1.5px solid #e5e7eb", background: "#f8fafc",
                        fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box",
                      }}
                    />
                    {/* Suggestion chips */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {NOTE_CHIPS.map(chip => (
                        <button key={chip} onClick={() => setNote(chip)} style={{
                          padding: "4px 10px", borderRadius: 999,
                          border: "1px solid #e5e7eb", background: note === chip ? "rgba(99,102,241,.08)" : "#f8fafc",
                          color: note === chip ? "#6366f1" : "#64748b",
                          fontSize: 10, fontWeight: 700, cursor: "pointer",
                        }}>{chip}</button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={numAmount < 10 || numAmount > 1000}
                    onClick={() => { setStep("invoice"); setError(""); }}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
                      background: numAmount < 10 ? "#c7d2fe" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff", fontWeight: 800, fontSize: 13, cursor: numAmount < 10 ? "not-allowed" : "pointer",
                      boxShadow: numAmount >= 10 ? "0 4px 20px rgba(99,102,241,.4)" : "none",
                    }}
                  >
                    Tiếp theo
                  </button>
                </div>
              )}

              {/* ── Step: Invoice (ticket) ── */}
              {step === "invoice" && recipient && (
                <div style={{ padding: "14px 18px 18px" }}>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "visible", position: "relative" }} className="dark:bg-white/5 dark:border-white/10">
                    {/* Recipient + meta */}
                    <div style={{ padding: "14px 14px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <Avatar name={recipient.displayName} url={recipient.avatarUrl} size={42} />
                        <div>
                          <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Gửi tới</p>
                          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "#0f172a" }} className="dark:text-white">{recipient.displayName}</p>
                        </div>
                      </div>
                      {note.trim() && (
                        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "8px 12px", marginBottom: 8, border: "1px solid #f1f5f9" }}>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontStyle: "italic" }}>"{note.trim()}"</p>
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Số JOY gửi</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">{numAmount.toLocaleString("vi-VN")} JOY</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Phí sáng tạo (5%)</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{fee.toLocaleString("vi-VN")} JOY</span>
                      </div>
                    </div>

                    <Divider />

                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">Tổng khấu trừ</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#6366f1" }}>{total.toLocaleString("vi-VN")} JOY</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#ef4444", textAlign: "center" }}>{error}</p>
                    </div>
                  )}

                  <p style={{ textAlign: "center", fontSize: 9, color: "#cbd5e1", marginTop: 10, marginBottom: 14, fontWeight: 600, letterSpacing: ".04em" }}>
                    Giao dịch JOY không thể hoàn lại — kiểm tra kỹ trước khi xác nhận
                  </p>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep("amount")} style={{
                      flex: 1, padding: "13px 0", borderRadius: 14, border: "1px solid #e5e7eb",
                      background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>Quay lại</button>
                    <button onClick={handleSend} style={{
                      flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 20px rgba(99,102,241,.4)",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>send</span>
                      Chuyển ngay
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: Sending ── */}
              {step === "sending" && (
                <div style={{ padding: "40px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", width: 72, height: 72 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(99,102,241,.2)" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", animation: "jtSpin 1s linear infinite" }} />
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, color: "#6366f1", fontVariationSettings: "'FILL' 1",
                    }}>toll</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0f172a" }} className="dark:text-white">Đang chuyển JOY...</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Vui lòng không đóng cửa sổ này</p>
                  </div>
                </div>
              )}

              {/* ── Step: Success ── */}
              {step === "success" && result && (
                <div style={{ padding: "20px 18px 18px" }}>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
                      boxShadow: "0 0 24px rgba(34,197,94,.35)",
                      animation: "jtSuccessBounce .6s ease",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#fff", fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0f172a" }} className="dark:text-white">Chuyển JOY thành công!</p>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, margin: "10px 0" }}>
                      <span style={{ fontSize: 32, fontWeight: 900, color: "#6366f1" }}>-{result.sentAmount}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>JOY</span>
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: 14, padding: "12px 14px", marginBottom: 16, border: "1px solid #f1f5f9" }}>
                    {[
                      { label: "Mã GD", value: result.txCode, mono: true },
                      { label: "Người nhận", value: result.recipientName },
                      { label: "Phí sáng tạo", value: `${result.feeAmount} JOY` },
                      ...(result.message ? [{ label: "Nội dung", value: result.message }] : []),
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em" }}>{row.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", fontFamily: row.mono ? "monospace" : "inherit" }} className="dark:text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={onClose} style={{
                    width: "100%", padding: "13px 0", borderRadius: 14, border: "1px solid #e5e7eb",
                    background: "#f8fafc", color: "#64748b", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}>Đóng</button>
                </div>
              )}

              <p style={{
                margin: "0 18px 16px", textAlign: "center",
                fontSize: 9, fontWeight: 600, color: "#cbd5e1", letterSpacing: ".04em",
              }}>JOY không thể nạp bằng tiền mặt</p>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
