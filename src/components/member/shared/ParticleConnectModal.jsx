import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Confetti from "react-confetti";
import ParticleGenerator from "./ParticleGenerator";
import ParticleScanner from "./ParticleScanner";
import { base64UrlToBytes } from "../../../utils/particleCloudCode";
import { searchJoyUser, getJoyQrPayload, resolveJoyQr, transferJoy } from "../../../services/joyApi";
import { useArcadeSound } from "../../../hooks/useArcadeSound";

const RECENT_KEY = "joy_recent_contacts";
const QUICK_AMOUNTS = [50, 100, 200, 500];
const NOTE_CHIPS = ["Cảm ơn!", "Tặng bạn" ];
const TRANSFER_FEE_RATE = 0.05;

// The particle code carries an opaque, server-signed token (base64url). The
// client never interprets it — it just decodes base64url to the raw bytes the
// generator draws, and hands the scanned token straight back to the server.
const tokenToBytes = (b64) => {
  try { return b64 ? base64UrlToBytes(b64) : null; } catch { return null; }
};

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
@keyframes jtRuneRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes jtRuneRotateRev {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg); }
}
@keyframes jtSigilBreathe {
  0%,100% { opacity: .55; transform: scale(1); }
  50%     { opacity: 1;   transform: scale(1.05); }
}
@keyframes jtStarTwinkle {
  0%,100% { opacity: .15; transform: scale(.7); }
  50%     { opacity: 1;   transform: scale(1.15); }
}
@keyframes jtShimmerSweep {
  0%   { transform: translate(-60%, -60%) rotate(0deg); }
  100% { transform: translate(-60%, -60%) rotate(360deg); }
}
@keyframes jtModalPop {
  from { transform: scale(.94) translateY(8px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}
.joy-modal-overlay {
  align-items: flex-end;
  justify-content: center;
}
.joy-modal-panel {
  animation: jtSlideUp .35s cubic-bezier(.34,1.1,.64,1);
}
@media (min-width: 640px) {
  .joy-modal-overlay {
    align-items: center;
    padding: 24px;
  }
  .joy-modal-panel {
    animation: jtModalPop .3s cubic-bezier(.34,1.4,.64,1);
  }
}
`;

const RUNES = ["ᚠ", "ᚱ", "ᚨ", "ᛟ", "ᛝ", "ᛚ", "ᛒ", "ᛗ", "ᚦ", "ᛊ", "ᛖ", "ᚹ"];

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

function JoySeal({ payload, tokenBytes, displayName, avatarUrl, onOpen, compact = false, interactive = true }) {
  const code = String(payload || "");
  const shortCode = code ? `${code.slice(0, 2)} ✦ ${code.slice(-2)}` : "JOY";
  const size = compact ? 190 : 262;
  const haloSize = compact ? 196 : 268;
  const OrbRoot = interactive ? "button" : "div";

  const runeRadius = size / 2 + (compact ? 6 : 8);
  const sigilRadius = size / 2 - (compact ? 26 : 30);

  return (
    <OrbRoot
      type={interactive ? "button" : undefined}
      onClick={interactive ? onOpen : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        cursor: interactive ? "pointer" : "default",
        background: "transparent",
        position: "relative",
        padding: 0,
        overflow: "visible",
      }}
      aria-label={interactive ? "Mở JOY Seal" : undefined}
    >
      <div style={{
        position: "absolute",
        inset: -(compact ? 12 : 14),
        width: haloSize,
        height: haloSize,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,.22) 0%, rgba(217,119,6,.12) 26%, rgba(0,0,0,0) 60%)",
        filter: "blur(12px)",
        opacity: .95,
        animation: "jtSigilBreathe 4.5s ease-in-out infinite",
        willChange: "transform, opacity, filter",
      }} />

      {/* Rotating rune ring */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        animation: "jtRuneRotate 26s linear infinite",
        willChange: "transform",
        pointerEvents: "none",
      }}>
        {RUNES.map((r, i) => {
          const angle = (360 / RUNES.length) * i;
          return (
            <span key={i} style={{
              position: "absolute",
              left: "50%", top: "50%",
              transform: `rotate(${angle}deg) translateY(-${runeRadius}px) rotate(-${angle}deg)`,
              fontSize: compact ? 10 : 12,
              color: "rgba(250,204,21,.55)",
              textShadow: "0 0 6px rgba(250,204,21,.55)",
            }}>{r}</span>
          );
        })}
      </div>

      {/* Counter-rotating sigil dots */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        animation: "jtRuneRotateRev 18s linear infinite",
        willChange: "transform",
        pointerEvents: "none",
      }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (360 / 8) * i;
          return (
            <div key={i} style={{
              position: "absolute",
              left: "50%", top: "50%",
              width: 3, height: 3, borderRadius: "50%",
              background: "#c4b5fd",
              boxShadow: "0 0 6px 1px rgba(196,181,253,.9)",
              transform: `rotate(${angle}deg) translateY(-${sigilRadius}px)`,
              animation: `jtStarTwinkle ${2 + (i % 3)}s ease-in-out ${i * .3}s infinite`,
              willChange: "transform, opacity",
            }} />
          );
        })}
      </div>

      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 46%, #170f2b 0%, #0d0819 34%, #060310 58%, #020103 100%)",
        boxShadow: "0 0 0 1px rgba(250,204,21,.08), inset 0 0 26px rgba(255,255,255,.03), inset 0 0 60px rgba(76, 29, 149, .55)",
      }} />
      <div style={{
        position: "absolute",
        inset: compact ? 9 : 10,
        borderRadius: "50%",
        background: "conic-gradient(from 200deg, rgba(250,204,21,.14), rgba(168,85,247,.7), rgba(76,29,149,.95), rgba(168,85,247,.75), rgba(250,204,21,.14))",
        filter: "blur(8px)",
        opacity: .95,
        animation: "jtRuneRotate 7s linear infinite",
      }} />
      <div style={{
        position: "absolute",
        inset: compact ? 14 : 16,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 40%, rgba(46,16,101,.9), rgba(8,3,18,.98) 58%, rgba(0,0,0,1) 100%)",
        border: "1px solid rgba(250,204,21,.14)",
        boxShadow: "inset 0 0 30px rgba(168,85,247,.16), inset 0 -8px 24px rgba(76,29,149,.12)",
        overflow: "hidden",
      }}>
        {/* Continuous shimmer sweep */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "220%",
          height: "220%",
          background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,.22) 12deg, transparent 40deg, transparent 360deg)",
          animation: "jtShimmerSweep 3.5s linear infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          left: "50%",
          top: "12%",
          width: compact ? 96 : 114,
          height: compact ? 96 : 114,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(216,180,254,.72) 0%, rgba(147,51,234,.42) 24%, rgba(88,28,135,.18) 44%, rgba(0,0,0,0) 72%)",
          filter: "blur(4px)",
          opacity: .92,
          animation: "jtSigilBreathe 3.6s ease-in-out infinite",
          willChange: "transform, opacity, filter",
        }} />
        <div style={{
          position: "absolute",
          inset: compact ? 22 : 24,
          borderRadius: "50%",
          background: "radial-gradient(circle at 42% 38%, rgba(255,255,255,.9) 0%, rgba(255,255,255,.28) 10%, rgba(250,204,21,.2) 18%, rgba(147,51,234,.28) 33%, rgba(23,15,43,.95) 67%, rgba(3,7,18,1) 100%)",
          transform: "scale(1.02)",
          boxShadow: "inset -10px -16px 30px rgba(0,0,0,.45), 0 0 30px rgba(196,181,253,.18)",
        }} />
        <div style={{
          position: "absolute",
          left: "50%",
          top: "18%",
          width: compact ? 98 : 118,
          height: compact ? 98 : 118,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(216,180,254,.22) 0%, rgba(147,51,234,.12) 18%, rgba(147,51,234,.08) 34%, rgba(0,0,0,0) 68%)",
          filter: "blur(1px)",
        }} />
        <div style={{
          position: "absolute",
          left: "50%",
          bottom: compact ? 18 : 20,
          transform: "translateX(-50%)",
          width: compact ? 96 : 112,
          height: compact ? 18 : 20,
          borderRadius: 999,
          background: "linear-gradient(180deg, rgba(250,204,21,.18), rgba(255,255,255,0))",
          filter: "blur(2px)",
          opacity: .5,
        }} />
      </div>
      <div style={{
        position: "absolute",
        inset: compact ? 7 : 10,
        borderRadius: "50%",
        border: "1px solid rgba(250,204,21,.1)",
      }} />

      {/* Particle Cloud Code — a custom circular, continuously-spinning dot code
          (not a QR). Encoding/rendering lives in ParticleGenerator.jsx; the
          matching decoder lives in ParticleScanner.jsx + utils/particleCloudCode.js. */}
      {tokenBytes && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: "48%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 22px rgba(56,189,248,.35), 0 8px 24px rgba(0,0,0,.5)",
          borderRadius: "50%",
          animation: "jtSigilBreathe 5s ease-in-out infinite",
        }}>
          <ParticleGenerator bytes={tokenBytes} size={compact ? 140 : 190} />
        </div>
      )}

      <div style={{
        position: "absolute",
        left: "50%",
        bottom: compact ? 12 : 14,
        transform: "translateX(-50%)",
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(10,4,24,.55)",
        border: "1px solid rgba(250,204,21,.3)",
        backdropFilter: "blur(8px)",
        color: "rgba(253,230,138,.95)",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: ".18em",
        textShadow: "0 0 8px rgba(250,204,21,.4)",
      }}>{shortCode}</div>
    </OrbRoot>
  );
}

function CircularQR({ payload, tokenBytes, displayName, avatarUrl, onClose }) {
  const { t } = useTranslation();
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "radial-gradient(ellipse at 50% 40%, #2c1352 0%, #0a0616 56%, #000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "jtFadeIn .25s ease",
      overflow: "hidden",
    }}>
      <style>{css}</style>

      {/* Ambient drifting starfield */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 53) % 100;
          return (
            <div key={i} style={{
              position: "absolute", left: `${left}%`, top: `${top}%`,
              width: 2, height: 2, borderRadius: "50%",
              background: i % 3 === 0 ? "#fde68a" : "#c4b5fd",
              boxShadow: `0 0 5px 1px ${i % 3 === 0 ? "rgba(253,230,138,.8)" : "rgba(196,181,253,.8)"}`,
              animation: `jtStarTwinkle ${2.5 + (i % 4)}s ease-in-out ${(i % 5) * .4}s infinite`,
            }} />
          );
        })}
      </div>

      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%",
        width: 36, height: 36, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>

      <p style={{ color: "rgba(253,230,138,.75)", fontSize: 11, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 40, textShadow: "0 0 12px rgba(250,204,21,.35)" }}>
        {t("joy.particle.qrTitle", "Mã QR JOY")}
      </p>

      {/* Ring container */}
      <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 0.5, 1].map((delay, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 260, height: 260, borderRadius: "50%",
            border: "1.5px solid rgba(168,85,247,.3)",
            animation: `jtRingPulse 2s ease-out ${delay}s infinite`,
          }} />
        ))}
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, rgba(250,204,21,.16), rgba(168,85,247,.14) 35%, rgba(0,0,0,0) 70%)", filter: "blur(6px)", opacity: .7 }} />
        <JoySeal payload={payload} tokenBytes={tokenBytes} displayName={displayName} avatarUrl={avatarUrl} compact={false} interactive={false} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 28, gap: 6 }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(168,85,247,.6)", marginBottom: 2 }} />
          : null}
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "-.02em" }}>{displayName}</p>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, fontWeight: 600 }}>{t("joy.particle.internalCode", "Mã nội bộ để gửi JOY")}</p>
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
          {t("joy.particle.share", "Chia sẻ")}
        </button>
      </div>
    </div>
  );
}

/* ─── Particle Cloud Code Scanner ────────────────────────────────────────── */
// The camera scanner now lives in its own reusable component
// (ParticleScanner.jsx): getUserMedia -> center-crop -> getImageData -> custom
// CV pipeline (threshold, blob detection, anchor/geometry fit) -> CRC + UTF-8
// decode, with an anti-photo liveness gate. No QR library is involved anymore.

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
export default function ParticleConnectModal({ open, bio, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { playWin, playLose, playBeep } = useArcadeSound();
  const [step, setStep] = useState("select"); // select | contact | amount | invoice | sending | success
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

  // Match the Particle Cloud Code's disc to the modal card so it blends in
  // seamlessly (white in light mode, near-black in dark mode). The generator
  // then auto-picks dark or bright dot colors for contrast against it.
  const cardBg =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "#1a1924"
      : "#ffffff";

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

  // Load My QR when "my code" is shown, and refresh it periodically so the
  // signed, time-bound token never expires while on screen (server rotates it
  // ~every 2 min; we refetch at 90s to stay comfortably inside the window).
  useEffect(() => {
    if (mode !== "myqr" || !bio?.email) return;
    let active = true;
    const load = () => getJoyQrPayload(bio.email).then(d => { if (active) setMyQR(d); }).catch(() => {});
    load();
    const id = setInterval(load, 90000);
    return () => { active = false; clearInterval(id); };
  }, [mode, bio?.email]);

  // Opaque token bytes for the generator; recomputed only when the token changes.
  const myTokenBytes = useMemo(() => tokenToBytes(myQR?.payload), [myQR?.payload]);

  const selectRecipient = useCallback((contact) => {
    setRecipient(contact);
    setStep("contact");
    setError("");
  }, []);

  const handleQRDetected = useCallback(async (rawValue) => {
    setScanResolving(true);
    setScanOpen(false);
    try {
      // rawValue is the opaque server token (base64url) read off the code; the
      // server verifies its HMAC before returning the recipient.
      const data = await resolveJoyQr(rawValue);
      playBeep();
      selectRecipient(data);
    } catch (e) {
      playLose();
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
      playWin();
      onSuccess?.(data);
      setStep("success");
    } catch (e) {
      playLose();
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

      {/* Confetti on success */}
      {step === "success" && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      {/* Apple Pay QR fullscreen */}
      {qrFullscreen && myQR && (
        <CircularQR
          payload={myQR.payload}
          tokenBytes={myTokenBytes}
          displayName={myQR.displayName}
          avatarUrl={myQR.avatarUrl}
          onClose={() => setQrFullscreen(false)}
        />
      )}



      {/* Main modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          className="joy-modal-overlay"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex",
            background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)",
            animation: "jtFadeIn .2s ease",
          }}
        >
          <div className="joy-modal-panel" style={{
            width: "100%", maxWidth: 440,
            "--joy-modal-bg": "#fff",
          }}>
            <div style={{
              margin: 12,
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
                    onClick={() => { setStep(step === "contact" ? "select" : step === "amount" ? "contact" : step === "invoice" ? "amount" : "select"); setError(""); }}
                    style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back_ios_new</span>
                  </button>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", letterSpacing: ".14em", textTransform: "uppercase" }}>HugoStudio</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-.02em" }}>
                    {step === "select" && t("joy.particle.title", "Hugo Studio - Intelligent Connection")}
                    {step === "contact" && `${t("joy.particle.profile", "Hồ sơ")}: ${recipient?.displayName}`}
                    {step === "amount" && `${t("joy.particle.sendTo", "Gửi")} → ${recipient?.displayName}`}
                    {step === "invoice" && t("joy.particle.confirm", "Xác nhận")}
                    {step === "sending" && t("joy.particle.sending", "Đang xử lý...")}
                    {step === "success" && t("joy.particle.success", "Thành công!")}
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
                      { id: "search", icon: "person_search", label: t("joy.particle.tabSearch", "Tìm kiếm") },
                      { id: "myqr", icon: "qr_code_2", label: t("joy.particle.tabMyQr", "Mã của tôi") },
                      { id: "scan", icon: "qr_code_scanner", label: t("joy.particle.tabScanQr", "Quét QR") },
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
                          placeholder={t("joy.particle.searchPlaceholder", "Tên, SĐT, mã giới thiệu...")}
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
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>{t("joy.particle.searchResults", "Kết quả tìm kiếm")}</p>
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
                        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "12px 0" }}>{t("joy.particle.noUserFound", "Không tìm thấy người dùng")}</p>
                      )}

                      {/* Recent contacts */}
                      {!searchQ.trim() && recentContacts.length > 0 && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>{t("joy.particle.recent", "Gần đây")}</p>
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
                          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>{t("joy.particle.searchHint", "Tìm theo tên, SĐT hoặc mã giới thiệu")}</p>
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
                          <div style={{ borderRadius: "50%", lineHeight: 0 }}>
                            <ParticleGenerator bytes={myTokenBytes} size={240} background={cardBg} />
                          </div>
                          <p style={{ color: "#0f172a", fontWeight: 900, fontSize: 14, marginTop: 12 }} className="dark:text-white">{myQR.displayName}</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Scan mode - inline camera */}
                  {mode === "scan" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {scanResolving ? (
                        <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#6366f1", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                          <p style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>{t("joy.particle.verifying", "Đang xác minh mã...")}</p>
                        </div>
                      ) : (
                        <ParticleScanner
                          inline
                          onScanSuccess={handleQRDetected}
                          scanBoxSize={240}
                        />
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
                      <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{t("joy.particle.recipientLabel", "Người nhận")}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">{recipient.displayName}</p>
                    </div>
                    <button onClick={() => { setStep("select"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>{t("joy.particle.changeBtn", "Đổi")}</button>
                  </div>

                  {/* Amount input */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".1em" }}>{t("joy.particle.amountTitle", "Số JOY gửi")}</p>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" min="10" max="1000"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder={t("joy.particle.amountPlaceholder", "Tối thiểu 10 JOY")}
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
                        {t("joy.particle.fee", "Phí sáng tạo")}: <strong style={{ color: "#6366f1" }}>{fee} JOY</strong>
                        {" · "}{t("joy.particle.total", "Tổng")}: <strong style={{ color: "#0f172a" }}>{total} JOY</strong>
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
                    <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".1em" }}>{t("joy.particle.noteTitle", "Nội dung (tùy chọn)")}</p>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={t("joy.particle.notePlaceholder", "Nhập nội dung...")}
                      maxLength={100}
                      style={{
                        width: "100%", padding: "11px 14px", borderRadius: 12,
                        border: "1.5px solid #e5e7eb", background: "#f8fafc",
                        fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box",
                      }}
                    />
                    {/* Suggestion chips */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {[t("joy.particle.chipThanks", "Cảm ơn!"), t("joy.particle.chipGift", "Tặng bạn")].map(chip => (
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
                    {t("joy.particle.next", "Tiếp theo")}
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
                          <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{t("joy.particle.sendTo", "Gửi tới")}</p>
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
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{t("joy.particle.amountTitle", "Số JOY gửi")}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">{numAmount.toLocaleString("vi-VN")} JOY</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{t("joy.particle.fee", "Phí sáng tạo")} ({TRANSFER_FEE_RATE * 100}%)</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{fee.toLocaleString("vi-VN")} JOY</span>
                      </div>
                    </div>

                    <Divider />

                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }} className="dark:text-white">{t("joy.particle.totalDeduction", "Tổng khấu trừ")}</span>
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
                    {t("joy.particle.warning", "Giao dịch JOY không thể hoàn lại — kiểm tra kỹ trước khi xác nhận")}
                  </p>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep("amount")} style={{
                      flex: 1, padding: "13px 0", borderRadius: 14, border: "1px solid #e5e7eb",
                      background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>{t("joy.particle.back", "Quay lại")}</button>
                    <button onClick={handleSend} style={{
                      flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 20px rgba(99,102,241,.4)",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>send</span>
                      {t("joy.particle.sendNow", "Chuyển ngay")}
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
