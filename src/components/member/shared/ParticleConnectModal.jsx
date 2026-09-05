import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Confetti from "react-confetti";
import ParticleGenerator from "./ParticleGenerator";
import ParticleScanner from "./ParticleScanner";
import { base64UrlToBytes } from "../../../utils/particleCloudCode";
import { searchJoyUser, getJoyQrPayload, resolveJoyQr, resolveNfcCode, transferJoy, checkHasPin, setTransactionPin } from "../../../services/joyApi";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { useNfc } from "../../../hooks/useNfc";
import { FaceIdPayHelper } from "../../../utils/faceIdPayHelper";
import { TRANSFER_FEE_RATE, TRANSFER_DAILY_CAP } from "../../../../shared/joyPrices.js";
import { useJoy } from "../../../lib/joyDisplay";
import { denomKey, transferBreakdown, CROSS_DENOM_FEE } from "../../../../shared/joyCurrency.js";

// Ngưỡng một lần gửi — cùng bộ số server kiểm lại khi nhận lệnh.
const MIN_SEND = 10;
const MAX_SEND = TRANSFER_DAILY_CAP;

const RECENT_KEY = "joy_recent_contacts";
const QUICK_AMOUNTS = [50, 100, 200, 500];
// Labels are resolved at render time, not here: a module constant would freeze
// whichever language happened to be active when the chunk first loaded.
const CONNECT_MODES = [
  { id: "search", icon: "send", key: "modeSend" },
  { id: "myqr", icon: "qr_code_2", key: "modeReceive" },
  { id: "scan", icon: "qr_code_scanner", key: "modeScan" },
];

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
/* ── Tấm thẻ chuyển JOY ────────────────────────────────────────────────────
   Kiểu Apple Pay: một tấm trồi lên từ mép dưới, nền trung tính, chữ TO, và
   đúng MỘT màu nhấn. Trước đây tấm này tím-violet từ đầu tới cuối với chữ
   9–11px: nhiều màu mà không màu nào có nghĩa, chữ thì phải nheo mắt.

   Màu lấy từ token theme (--card/--foreground/--border/--muted) nên tự lật
   sáng/tối, không cần nhân đôi mọi rule dưới ".dark" như bản cũ.

   KHÔNG dùng dấu huyền ngược trong khối này: toàn bộ biến css là một template
   literal, một dấu huyền ngược lọt vào đây sẽ đóng chuỗi sớm và phần còn lại bị
   đọc thành mã — đúng thứ đã làm màn Chuyển JOY vỡ trắng. */
.joy-modal-overlay {
  align-items: flex-end;
  justify-content: center;
}
.joy-modal-panel {
  /* MỘT màu nhấn duy nhất — hổ phách JOY, cùng màu với ví. Nút chính vẫn dùng
     --foreground (đen/trắng) đúng kiểu Apple: màu nhấn để chỉ số tiền, không để
     tô nút. */
  --jc-accent: 32 96% 42%;
  --jc-ok: 152 62% 36%;
  animation: jtSlideUp .35s cubic-bezier(.34,1.1,.64,1);
}

.joy-connect-select { padding: 4px 20px 8px; }

/* Bộ chọn Gửi / Nhận / Quét — thanh phân đoạn kiểu iOS, cao 44px cho ngón tay */
.joy-connect-modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
  margin-bottom: 18px;
  padding: 3px;
  border-radius: 14px;
  background: hsl(var(--muted));
}
.joy-connect-mode {
  display: flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 11px;
  background: none;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .16s ease, color .16s ease;
}
.joy-connect-mode .material-symbols-outlined { font-size: 19px; }
.joy-connect-mode.is-active {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font-weight: 700;
  box-shadow: 0 1px 3px hsl(0 0% 0% / .12);
}

/* Ô tìm người nhận — 17px như iOS, đủ to để đọc lúc đang cầm điện thoại */
.joy-connect-search { position: relative; }
.joy-connect-search > .material-symbols-outlined:first-child {
  position: absolute; z-index: 1; left: 15px; top: 17px;
  color: hsl(var(--muted-foreground)); font-size: 22px;
}
.joy-connect-search input {
  box-sizing: border-box;
  width: 100%;
  min-height: 56px;
  padding: 10px 44px;
  border: 1px solid transparent;
  border-radius: 15px;
  outline: none;
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-size: 17px;
  font-weight: 500;
}
.joy-connect-search input::placeholder { color: hsl(var(--muted-foreground)); font-weight: 400; }
.joy-connect-search input:focus { border-color: hsl(var(--foreground) / .35); background: hsl(var(--card)); }
.joy-connect-search > .is-loading {
  position: absolute; right: 15px; top: 18px;
  color: hsl(var(--muted-foreground)); font-size: 20px;
  animation: jtSpin 1s linear infinite;
}
.joy-connect-search-intent {
  display: flex; align-items: center; gap: 6px;
  margin: 9px 3px 16px;
  color: hsl(var(--muted-foreground)); font-size: 13px;
}
.joy-connect-search-intent .material-symbols-outlined { font-size: 16px; color: hsl(var(--jc-ok)); }

.joy-connect-list-label {
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 2px 8px;
  color: hsl(var(--muted-foreground));
  font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}

.joy-connect-empty {
  display: grid; place-items: center; gap: 8px;
  min-height: 160px; padding: 24px;
  border-radius: 18px;
  background: hsl(var(--muted) / .5);
  color: hsl(var(--muted-foreground)); text-align: center;
}
.joy-connect-empty > .material-symbols-outlined { font-size: 36px; opacity: .5; }
.joy-connect-empty strong { color: hsl(var(--foreground)); font-size: 15px; font-weight: 700; }
.joy-connect-empty small { max-width: 280px; font-size: 13px; line-height: 1.5; }

/* Mã nhận JOY */
.joy-connect-receive { display: grid; justify-items: center; gap: 14px; padding: 2px 0; }
.joy-connect-receive-card {
  position: relative;
  display: grid; width: 100%; justify-items: center;
  padding: 22px 16px 18px;
  overflow: hidden;
  border-radius: 22px;
  background: hsl(var(--muted) / .6);
}
.joy-connect-live {
  position: absolute; top: 12px; right: 12px;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 9px; border-radius: 999px;
  background: hsl(var(--jc-ok) / .12); color: hsl(var(--jc-ok));
  font-size: 11px; font-weight: 700; letter-spacing: .04em;
}
.joy-connect-live i {
  width: 6px; height: 6px; border-radius: 50%;
  background: hsl(var(--jc-ok)); box-shadow: 0 0 0 4px hsl(var(--jc-ok) / .16);
}
.joy-connect-receive-name { display: grid; justify-items: center; gap: 3px; }
.joy-connect-receive-name strong { color: hsl(var(--foreground)); font-size: 17px; font-weight: 700; }
.joy-connect-receive-name small { color: hsl(var(--muted-foreground)); font-size: 13px; }
.joy-connect-receive-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.joy-connect-receive-actions button {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 50px;
  border: 0; border-radius: 15px;
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-size: 15px; font-weight: 650;
  cursor: pointer;
}
.joy-connect-receive-actions button:first-child {
  background: hsl(var(--foreground));
  color: hsl(var(--background));
}
.joy-connect-receive-actions .material-symbols-outlined { font-size: 20px; }
.joy-connect-share-status { min-height: 18px; color: hsl(var(--jc-ok)); font-size: 13px; font-weight: 650; }

/* Quét mã */
.joy-connect-scan { display: grid; gap: 12px; }
.joy-connect-scan-status {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 15px;
  background: hsl(var(--jc-ok) / .1); color: hsl(var(--jc-ok));
}
.joy-connect-scan-status > span { font-size: 21px; }
.joy-connect-scan-status div { display: grid; gap: 2px; }
.joy-connect-scan-status strong { font-size: 14px; font-weight: 700; }
.joy-connect-scan-status small { opacity: .8; font-size: 12px; }
.joy-connect-scan-frame { overflow: hidden; padding: 6px; border-radius: 22px; background: hsl(var(--muted)); }
.joy-connect-scan-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.joy-connect-scan-tools button {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 48px; border: 0; border-radius: 14px;
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-size: 14px; font-weight: 650;
  cursor: pointer;
}
.joy-connect-scan-tools .material-symbols-outlined { font-size: 20px; }

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
      background: "hsl(var(--muted))",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "hsl(var(--foreground) / .7)", fontWeight: 800, fontSize: size * 0.4,
    }}>{(name || "?")[0].toUpperCase()}</div>
  );
}

function JoySeal({ payload, tokenBytes, onOpen, compact = false, interactive = true }) {
  const { t } = useTranslation();
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
      aria-label={interactive ? t("memberPortal.joy.particle.openSeal") : undefined}
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

      <p style={{ color: "rgba(253,230,138,.75)", fontSize: 13, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 40, textShadow: "0 0 12px rgba(250,204,21,.35)" }}>
        {t("memberPortal.joy.particle.qrTitle", "Mã QR JOY")}
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
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, fontWeight: 600 }}>{t("memberPortal.joy.particle.internalCode", "Mã nội bộ để gửi JOY")}</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <button
          onClick={() => {
            if (navigator.share) navigator.share({ title: "JOY QR", text: t("memberPortal.joy.particle.shareInvite", { code: payload }) });
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
          {t("memberPortal.joy.particle.share", "Chia sẻ")}
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
      className="flex items-center gap-3 w-full min-h-[64px] px-3 py-2.5 bg-muted/60 active:bg-muted rounded-2xl text-left transition-colors"
    >
      <Avatar name={contact.displayName} url={contact.avatarUrl} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 17px — cỡ chữ danh sách của iOS. Bản cũ 14px đậm nhìn như chú thích. */}
        <p className="m-0 truncate text-[17px] font-semibold text-foreground">
          {contact.displayName}
        </p>
        {contact.maskedPhone && <p className="m-0 text-[14px] text-muted-foreground">{contact.maskedPhone}</p>}
        {contact.referralCode && <p className="m-0 text-[14px] text-muted-foreground">#{contact.referralCode}</p>}
      </div>
      <span className="material-symbols-outlined text-[22px] text-muted-foreground">chevron_right</span>
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
export default function ParticleConnectModal({ open, bio, onClose, onSuccess, initialMode }) {
  const { t } = useTranslation();
  const { playWin, playLose, playBeep } = useArcadeSound();
  const [step, setStep] = useState("select"); // select | contact | amount | invoice | sending | success
  const [mode, setMode] = useState(initialMode || "search"); // search | myqr | scan
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [myQR, setMyQR] = useState(null);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [scanResolving, setScanResolving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [ignoredScanPayloads, setIgnoredScanPayloads] = useState(() => new Set());
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState(""); // "" | "writing" | "done" | "error"
  const [shareStatus, setShareStatus] = useState("");
  const {
    supported: nfcSupported,
    writeTag: writeNfcTag,
    startScan: startNfcScan,
    stopScan: stopNfcScan,
  } = useNfc();
  const [hasPin, setHasPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [setupPinStep, setSetupPinStep] = useState(1);
  const [tempPin, setTempPin] = useState("");
  const [lastPin, setLastPin] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const debounceRef = useRef(null);
  const scanResolvingRef = useRef(false);
  // A live, spinning particle code (or decode noise) yields a *different*
  // valid-shaped token almost every frame, so the exact-value ignore set never
  // catches a bad one twice. Without a time gate that turns into a flood of
  // failing /joy/resolve-qr calls (one per decoded frame). This blocks any new
  // resolve for a short window after a failure.
  const scanCooldownUntilRef = useRef(0);

  const joy = useJoy();

  // Người dùng gõ theo ĐƠN VỊ CỦA HỌ; `numAmount` là JOY gốc — con số duy nhất
  // được gửi lên server và dùng để tính phí. Không bao giờ gửi số hiển thị đi.
  const numAmount = joy.toRaw(amount);
  // Cùng một hàm server dùng để trừ ví (shared/joyCurrency.js) — màn xác nhận và
  // lệnh trừ không thể lệch nhau. Đơn vị người nhận do endpoint tra cứu trả về;
  // server vẫn tính lại theo `Bio.joyDenom` nên client không quyết được phí.
  const myDenom = denomKey(bio?.joyDenom);
  const theirDenom = denomKey(recipient?.joyDenom || myDenom);
  const bill = transferBreakdown(numAmount, myDenom, theirDenom, TRANSFER_FEE_RATE);
  const fee = bill.creativeFee;
  const conversionFee = bill.conversionFee;
  const total = bill.totalDeducted;
  const availableBalance = Number(bio?.joyBalance);
  const balanceKnown = Number.isFinite(availableBalance) && availableBalance >= 0;
  const insufficientBalance = balanceKnown && total > availableBalance;
  const suggestedAmounts = useMemo(() => {
    if (!balanceKnown) return QUICK_AMOUNTS;
    const feeLoad = 1 + TRANSFER_FEE_RATE + (bill.crossDenom ? CROSS_DENOM_FEE : 0);
    const maxSend = Math.min(MAX_SEND, Math.floor(availableBalance / feeLoad));
    const adaptive = [50, 100, 200, 500, Math.floor(maxSend / 2 / 10) * 10, maxSend]
      .filter((value) => value >= 10 && value <= maxSend);
    const unique = [...new Set(adaptive)].sort((a, b) => a - b);
    return unique.slice(Math.max(0, unique.length - 4));
  }, [availableBalance, balanceKnown, bill.crossDenom]);
  const visibleMode = mode === "nfc" ? "scan" : mode;
  const activeConnectMode = CONNECT_MODES.find((item) => item.id === visibleMode) || CONNECT_MODES[0];
  const searchIntent = useMemo(() => {
    const query = searchQ.trim();
    if (!query) return t("memberPortal.joy.particle.intentEmpty");
    if (/^#?[a-z0-9_-]{5,}$/i.test(query) && !/\s/.test(query)) return t("memberPortal.joy.particle.intentCode");
    if (/^[+\d][\d\s.-]{6,}$/.test(query)) return t("memberPortal.joy.particle.intentPhone");
    return t("memberPortal.joy.particle.intentName");
  }, [searchQ, t]);

  // Match the Particle Cloud Code's disc to the modal card so it blends in
  // seamlessly (white in light mode, near-black in dark mode). The generator
  // then auto-picks dark or bright dot colors for contrast against it.
  const cardBg =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "#1a1924"
      : "#ffffff";

  useEffect(() => {
    if (!open) return;
    // initialMode "setup-pin": mở thẳng màn đặt PIN. Trước đây PIN chỉ đặt được
    // giữa chừng một lượt chuyển JOY, nên muốn khoá ví trước là không có đường.
    const pinOnly = initialMode === "setup-pin";
    setStep(pinOnly ? "setup-pin" : "select");
    setMode(pinOnly ? "search" : (initialMode || "search"));
    setRecipient(null);
    setAmount(""); setNote(""); setSearchQ(""); setSearchResults([]);
    setError(""); setResult(null); setIgnoredScanPayloads(new Set());
    setShareStatus("");
    scanResolvingRef.current = false;
    setNfcScanning(false); setNfcWriteStatus("");
    stopNfcScan();
    setRecentContacts(getRecent());
    setPinInput("");
    setSetupPinStep(1);
    setTempPin("");
    checkHasPin()
      .then(d => setHasPin(d.hasPin))
      .catch(() => setHasPin(false));
  }, [open, initialMode, stopNfcScan]);

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

  // Load once and refresh at most once if the sheet stays open unusually long.
  useEffect(() => {
    if (mode !== "myqr" || !bio?.email) return;
    let active = true;
    const load = () => getJoyQrPayload(bio.email).then(d => { if (active) setMyQR(d); }).catch(() => {});
    load();
    const id = setTimeout(load, 90000);
    return () => { active = false; clearTimeout(id); };
  }, [mode, bio?.email]);

  // Opaque token bytes for the generator; recomputed only when the token changes.
  const myTokenBytes = useMemo(() => tokenToBytes(myQR?.payload), [myQR?.payload]);

  const selectRecipient = useCallback((contact) => {
    setRecipient(contact);
    setStep("amount");
    setError("");
  }, []);

  const shareReceiveCode = useCallback(async () => {
    if (!myQR?.payload) return;
    const shareData = {
      title: t("memberPortal.joy.particle.modeReceiveTitle"),
      text: t("memberPortal.joy.particle.shareInviteNamed", {
        name: myQR.displayName || bio?.displayName || t("memberPortal.joy.particle.me"),
        code: myQR.payload,
      }),
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(myQR.payload);
      setShareStatus(navigator.share ? t("memberPortal.joy.particle.sharePanelOpened") : t("memberPortal.joy.particle.codeCopied"));
      window.setTimeout(() => setShareStatus(""), 2200);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") setShareStatus(t("memberPortal.joy.particle.shareFailed"));
    }
  }, [bio?.displayName, myQR, t]);

  const handleQRDetected = useCallback(async (rawValue) => {
    if (!rawValue || scanResolvingRef.current || Date.now() < scanCooldownUntilRef.current || ignoredScanPayloads.has(rawValue)) return;
    scanResolvingRef.current = true;
    setScanResolving(true);
    try {
      // rawValue is the opaque server token (base64url) read off the code; the
      // server verifies its HMAC before returning the recipient.
      const data = await resolveJoyQr(rawValue);
      playBeep();
      setIgnoredScanPayloads(new Set());
      selectRecipient(data);
    } catch (e) {
      playLose();
      // Throttle the whole scanner briefly so a stream of distinct bad tokens
      // can't flood the server with resolve-qr calls (each already 400s).
      scanCooldownUntilRef.current = Date.now() + 1500;
      setIgnoredScanPayloads(prev => {
        const next = new Set(prev);
        next.add(rawValue);
        return next;
      });
      window.setTimeout(() => {
        setIgnoredScanPayloads(prev => {
          if (!prev.has(rawValue)) return prev;
          const next = new Set(prev);
          next.delete(rawValue);
          return next;
        });
      }, 30000);
      setError(e.message || t("memberPortal.joy.particle.invalidQr", "Mã JOY không hợp lệ hoặc đã hết hạn. Hãy quét mã mới hơn."));
    } finally {
      scanResolvingRef.current = false;
      setScanResolving(false);
    }
  }, [ignoredScanPayloads, playBeep, playLose, selectRecipient, t]);

  const handleVerifyAndSend = async (enteredPin, enteredOtp) => {
    setStep("sending");
    setError("");
    const idempotencyKey = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      const data = await transferJoy({
        fromEmail: bio.email,
        toReferralCode: recipient.referralCode,
        amount: numAmount,
        message: note.trim(),
        pin: enteredPin,
        otp: enteredOtp,
        idempotencyKey
      });
      // Giao dịch lớn: server đã gửi OTP về email, mở bước nhập mã. Nhớ PIN vừa
      // nhập để gửi kèm khi xác nhận OTP.
      if (data?.stepUp === "OTP_SENT") {
        setLastPin(enteredPin);
        setOtpInput("");
        setError("");
        setStep("otp");
        return;
      }
      if (data?.stepUp) { setError(data.message || t("memberPortal.joy.particle.needMoreAuth", "Cần xác thực thêm.")); setStep("pin"); return; }
      setResult(data);
      saveRecent({ displayName: recipient.displayName, avatarUrl: recipient.avatarUrl, referralCode: recipient.referralCode });
      playWin();
      onSuccess?.(data);
      setStep("success");
    } catch (e) {
      playLose();
      setError(e.message);
      setPinInput("");
      setStep("pin");
    }
  };

  const handleSetupPin = async (enteredPin) => {
    setError("");
    if (setupPinStep === 1) {
      setTempPin(enteredPin);
      setPinInput("");
      setSetupPinStep(2);
    } else {
      if (enteredPin !== tempPin) {
        setError(t("memberPortal.joy.particle.pinMismatch"));
        setPinInput("");
        setTempPin("");
        setSetupPinStep(1);
        playLose();
        return;
      }
      setStep("sending");
      try {
        await setTransactionPin(enteredPin);
        setHasPin(true);
        // Đặt PIN đứng một mình (mở từ ví) thì xong là xong — không có giao
        // dịch nào phía sau để gửi.
        if (!recipient || !Number(amount)) {
          window.dispatchEvent(new CustomEvent("hugo:pin-set"));
          playWin();
          onClose();
          return;
        }
        handleVerifyAndSend(enteredPin);
      } catch (e) {
        setError(e.message || t("memberPortal.joy.particle.pinSetupFailed"));
        setPinInput("");
        setTempPin("");
        setSetupPinStep(1);
        setStep("setup-pin");
        playLose();
      }
    }
  };

  const handleSend = async () => {
    setError("");
    setPinInput("");
    if (!hasPin) {
      setSetupPinStep(1);
      setTempPin("");
      setStep("setup-pin");
    } else {
      setStep("pin");
    }
  };

  const close = () => {
    if (step === "sending") return;
    onClose();
  };



  if (!open && !qrFullscreen) return null;

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
            {/* Tràn tới mép dưới màn hình và chỉ bo hai góc trên — tấm trồi lên từ
                đáy, không phải cái thẻ lơ lửng giữa màn. */}
            <div
              className="bg-card text-foreground rounded-t-[28px] sm:rounded-[28px] sm:m-3 shadow-2xl overflow-hidden"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
            >

              {/* ── Đầu thẻ ──
                  Tay nắm + một dòng tiêu đề TO. Bản cũ là dải gradient tím với
                  eyebrow "HUGOSTUDIO" 9px và tiêu đề 14px: dải màu chiếm chỗ mà
                  không nói gì, tiêu đề thì nhỏ hơn cả tên người nhận bên dưới. */}
              <div style={{ display: "grid", placeItems: "center", padding: "8px 0 2px" }}>
                <i style={{ width: 36, height: 5, borderRadius: 999, background: "hsl(var(--border))" }} />
              </div>
              <div style={{
                padding: "6px 20px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {step !== "select" && (
                  <button
                    onClick={() => {
                      if (step === "pin" || step === "setup-pin") {
                        setStep("invoice");
                      } else {
                        setStep(step === "amount" ? "select" : step === "invoice" ? "amount" : "select");
                      }
                      setError("");
                    }}
                    aria-label={t("memberPortal.joy.particle.back", "Quay lại")}
                    style={{ background: "hsl(var(--muted))", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "hsl(var(--foreground))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back_ios_new</span>
                  </button>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1.2 }}>
                    {step === "select" && t(`memberPortal.joy.particle.${activeConnectMode.key}Title`)}
                    {step === "amount" && `${t("memberPortal.joy.particle.sendTo", "Gửi")} → ${recipient?.displayName}`}
                    {step === "invoice" && t("memberPortal.joy.particle.confirm", "Xác nhận")}
                    {step === "pin" && t("memberPortal.joy.particle.pinTitle")}
                    {step === "setup-pin" && t("memberPortal.joy.particle.pinSetupTitle")}
                    {step === "otp" && t("memberPortal.joy.particle.otpTitle", "Nhập mã xác nhận")}
                    {step === "sending" && t("memberPortal.joy.particle.sending", "Đang xử lý...")}
                    {step === "success" && t("memberPortal.joy.particle.success", "Thành công!")}
                  </p>
                </div>
                <button onClick={close} disabled={step === "sending"} aria-label={t("memberPortal.joy.particle.close", "Đóng")} style={{
                  background: "hsl(var(--muted))", border: "none", borderRadius: "50%",
                  width: 34, height: 34, cursor: "pointer", color: "hsl(var(--foreground) / .7)", opacity: step === "sending" ? .4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>

              {/* ── Step: Select ── */}
              {step === "select" && (
                <div className="joy-connect-select">
                  {/* Mode tabs */}
                  <div className="joy-connect-modes" role="tablist" aria-label={t("memberPortal.joy.particle.connectMode")}>
                    {CONNECT_MODES.map(m => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={visibleMode === m.id}
                        key={m.id}
                        onClick={() => { setMode(m.id); setError(""); }}
                        className={`joy-connect-mode ${visibleMode === m.id ? "is-active" : ""}`}
                      >
                        <span className="material-symbols-outlined">{m.icon}</span>
                        <span>{t(`memberPortal.joy.particle.${m.key}Label`)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search mode */}
                  {mode === "search" && (
                    <>
                      <div className="joy-connect-search">
                        <span className="material-symbols-outlined">person_search</span>
                        <input
                          value={searchQ}
                          onChange={e => setSearchQ(e.target.value)}
                          placeholder={t("memberPortal.joy.particle.searchPlaceholder", "Tên, số điện thoại hoặc mã giới thiệu")}
                          autoComplete="off"
                          inputMode="search"
                        />
                        {searching && (
                          <span className="material-symbols-outlined is-loading">progress_activity</span>
                        )}
                      </div>
                      <p className="joy-connect-search-intent"><span className="material-symbols-outlined">verified_user</span>{searchIntent}</p>

                      {/* Results */}
                      {searchQ.trim() && searchResults.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p className="joy-connect-list-label"><span>{t("memberPortal.joy.particle.searchResults", "Kết quả phù hợp")}</span><span>{searchResults.length} người</span></p>
                          <div className="grid gap-2">
                            {searchResults.map(c => (
                              <div key={c.referralCode}>
                                <ContactCard contact={c} onSelect={selectRecipient} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQ.trim() && !searching && searchResults.length === 0 && (
                        <div className="joy-connect-empty"><span className="material-symbols-outlined">person_off</span><strong>{t("memberPortal.joy.particle.noUserFound", "Không tìm thấy người dùng")}</strong><small>{t("memberPortal.joy.particle.noUserFoundHint")}</small></div>
                      )}

                      {/* Recent contacts */}
                      {!searchQ.trim() && recentContacts.length > 0 && (
                        <div>
                          <p className="joy-connect-list-label"><span>{t("memberPortal.joy.particle.recent", "Gửi gần đây")}</span><span>{t("memberPortal.joy.particle.tapToSelect")}</span></p>
                          <div className="grid gap-2">
                            {recentContacts.map(c => (
                              <div key={c.referralCode}>
                                <ContactCard contact={c} onSelect={selectRecipient} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!searchQ.trim() && recentContacts.length === 0 && (
                        <div className="joy-connect-empty"><span className="material-symbols-outlined">group_add</span><strong>{t("memberPortal.joy.particle.pickFirstRecipient")}</strong><small>{t("memberPortal.joy.particle.searchHint", "Tìm theo tên, số điện thoại hoặc mã giới thiệu. Người đã gửi sẽ xuất hiện ở đây lần sau.")}</small></div>
                      )}
                    </>
                  )}

                  {/* My QR mode */}
                  {mode === "myqr" && (
                    <div className="joy-connect-receive">
                      {!myQR ? (
                        <div style={{ padding: "32px 0" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "hsl(var(--foreground) / .55)", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                        </div>
                      ) : (
                        <>
                          <section className="joy-connect-receive-card">
                            <span className="joy-connect-live"><i />{t("memberPortal.joy.particle.dynamicCode")}</span>
                            <button type="button" onClick={() => setQrFullscreen(true)} aria-label={t("memberPortal.joy.particle.openFullscreen")} style={{ borderRadius: "50%", lineHeight: 0 }}>
                              <ParticleGenerator bytes={myTokenBytes} size={226} background={cardBg} />
                            </button>
                            <div className="joy-connect-receive-name">
                              <strong>{myQR.displayName}</strong>
                              <small>{t("memberPortal.joy.particle.fullscreenHint")}</small>
                            </div>
                          </section>
                          <div className="joy-connect-receive-actions">
                            <button type="button" onClick={shareReceiveCode}><span className="material-symbols-outlined">ios_share</span>{t("memberPortal.joy.particle.shareCode")}</button>
                            <button type="button" onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(myQR.payload);
                                setShareStatus(t("memberPortal.joy.particle.receiveCodeCopied"));
                                window.setTimeout(() => setShareStatus(""), 2200);
                              } catch { setShareStatus(t("memberPortal.joy.particle.copyFailed")); }
                            }}><span className="material-symbols-outlined">content_copy</span>{t("memberPortal.joy.particle.copy")}</button>
                          </div>
                          <p className="joy-connect-share-status" role="status">{shareStatus}</p>
                          {/* Write NFC button */}
                          {nfcSupported && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                              {nfcWriteStatus === "writing" ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "hsl(var(--muted))" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "hsl(var(--foreground) / .55)", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground) / .55)" }}>{t("memberPortal.joy.particle.nfcWrite", "Đang ghi NFC...")}</span>
                                </div>
                              ) : nfcWriteStatus === "done" ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(34,197,94,.08)" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#22c55e" }}>check_circle</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{t("memberPortal.joy.particle.nfcWriteSuccess", "Đã ghi NFC thành công!")}</span>
                                </div>
                              ) : (
                                <button onClick={async () => {
                                  if (!myQR?.referralCode) return;
                                  setNfcWriteStatus("writing");
                                  try {
                                    await writeNfcTag(myQR.referralCode);
                                    setNfcWriteStatus("done");
                                    playBeep();
                                    setTimeout(() => setNfcWriteStatus(""), 3000);
                                  } catch {
                                    setNfcWriteStatus("error");
                                    playLose();
                                    setTimeout(() => setNfcWriteStatus(""), 3000);
                                  }
                                }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-white/10">
                                  <span className="material-symbols-outlined text-base text-indigo-500">nfc</span>
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">{t("memberPortal.joy.particle.nfcWriteBtn", "Ghi NFC")}</span>
                                </button>
                              )}
                              {nfcWriteStatus !== "writing" && (
                                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center">{t("memberPortal.joy.particle.nfcWriteHint", "Tuỳ chọn: ghi mã nhận JOY lên thẻ NFC cá nhân")}</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Scan mode - inline camera */}
                  {mode === "scan" && (
                    <div className="joy-connect-scan">
                      <div className="joy-connect-scan-status">
                        <span className="material-symbols-outlined">shield_lock</span>
                        <div>
                          <strong>{t("memberPortal.joy.particle.autoVerifyTitle")}</strong>
                          <small>{t("memberPortal.joy.particle.autoVerifyDesc")}</small>
                        </div>
                      </div>
                      {scanResolving ? (
                        <div className="joy-connect-empty">
                          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "hsl(var(--foreground) / .55)", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                          <strong>{t("memberPortal.joy.particle.verifying", "Đang xác minh người nhận…")}</strong>
                          <small>{t("memberPortal.joy.particle.holdStill")}</small>
                        </div>
                      ) : (
                        <div className="joy-connect-scan-frame">
                          <ParticleScanner
                            inline
                            onScanSuccess={handleQRDetected}
                            onError={(err) => setError(err?.message?.includes("not supported")
                              ? t("memberPortal.joy.particle.cameraUnsupportedHint")
                              : t("memberPortal.joy.particle.cameraErrorHint"))}
                            ignoredPayloads={ignoredScanPayloads}
                            scanBoxSize={250}
                          />
                        </div>
                      )}
                      {error && <p className="text-center text-[10px] font-semibold text-red-500">{error}</p>}
                      <div className="joy-connect-scan-tools">
                        <button type="button" onClick={() => { setMode("search"); setError(""); }}><span className="material-symbols-outlined">person_search</span>{t("memberPortal.joy.particle.findManually")}</button>
                        {nfcSupported ? (
                          <button type="button" onClick={() => { setMode("nfc"); setError(""); }}><span className="material-symbols-outlined">nfc</span>{t("memberPortal.joy.particle.useNfcBtn")}</button>
                        ) : (
                          <button type="button" onClick={() => { setMode("myqr"); setError(""); }}><span className="material-symbols-outlined">qr_code_2</span>{t("memberPortal.joy.particle.tabMyQr")}</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* NFC mode — tap a physical NFC tag */}
                  {mode === "nfc" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 4px" }}>
                      {scanResolving ? (
                        <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "hsl(var(--foreground) / .55)", animation: "jtSpin 1s linear infinite" }}>progress_activity</span>
                          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 600 }}>{t("memberPortal.joy.particle.verifying", "Đang xác minh mã...")}</p>
                        </div>
                      ) : nfcScanning ? (
                        <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                          <div style={{ position: "relative", width: 120, height: 120 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 80, color: "hsl(var(--foreground) / .55)", animation: "jtSigilBreathe 2s ease-in-out infinite" }}>nfc</span>
                          </div>
                          <p style={{ color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 700, textAlign: "center" }} className="dark:text-white">
                            {t("memberPortal.joy.particle.nfcScanHint", "Đặt thẻ NFC vào mặt sau điện thoại")}
                          </p>
                          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, textAlign: "center" }}>
                            {t("memberPortal.joy.particle.nfcScanTitle", "Đang tìm thẻ NFC...")}
                          </p>
                          <button onClick={() => { setNfcScanning(false); stopNfcScan(); }} style={{
                            padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb",
                            background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}>{t("memberPortal.joy.particle.cancel", "Hủy")}</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 56, color: "hsl(var(--muted-foreground) / .6)" }}>nfc</span>
                          <p style={{ color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 700, textAlign: "center" }} className="dark:text-white">
                            {t("memberPortal.joy.particle.nfcTapHint", "Chạm thẻ NFC của người nhận để bắt đầu chuyển JOY")}
                          </p>
                          {error && (
                            <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, textAlign: "center" }}>{error}</p>
                          )}
                          <button onClick={async () => {
                            setError("");
                            setNfcScanning(true);
                            const cleanup = startNfcScan((code) => {
                              setNfcScanning(false);
                              setScanResolving(true);
                              resolveNfcCode(code)
                                .then(data => { playBeep(); selectRecipient(data); })
                                .catch(e => { playLose(); setError(e.message || t("memberPortal.joy.particle.nfcReadError", "Không đọc được thẻ NFC")); })
                                .finally(() => setScanResolving(false));
                            });
                            // Auto-timeout after 30s
                            setTimeout(() => { if (nfcScanning) { cleanup(); setNfcScanning(false); } }, 30000);
                          }} style={{
                            padding: "12px 32px", borderRadius: 14, border: "none",
                            background: "hsl(var(--foreground))", color: "hsl(var(--background))",
                            fontSize: 13, fontWeight: 800, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 8,
                            boxShadow: "none",
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>nfc</span>
                            {t("memberPortal.joy.particle.nfcStartScan", "Bắt đầu quét NFC")}
                          </button>
                        </div>
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
                    background: "hsl(var(--muted))", borderRadius: 14, padding: "10px 14px", marginBottom: 16,
                    border: "1px solid #f1f5f9",
                  }}>
                    <Avatar name={recipient.displayName} url={recipient.avatarUrl} size={38} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{t("memberPortal.joy.particle.recipientLabel", "Người nhận")}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "hsl(var(--foreground))" }} className="dark:text-white">{recipient.displayName}</p>
                    </div>
                    <button onClick={() => { setStep("select"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: 13, fontWeight: 700 }}>{t("memberPortal.joy.particle.changeBtn", "Đổi")}</button>
                  </div>

                  {/* Amount input */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: ".1em" }}>{t("memberPortal.joy.particle.amountTitle", "Số JOY gửi")}</p>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        min={joy.value(MIN_SEND)} max={joy.value(MAX_SEND)} step={joy.value(1)}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onBlur={() => amount && setAmount(String(joy.value(joy.toRaw(amount))))}
                        placeholder={t("memberPortal.joy.particle.amountPlaceholder", { amount: MIN_SEND })}
                        className="w-full py-3 pl-3.5 pr-14 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-lg font-black outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 800, color: "hsl(var(--muted-foreground))" }}>{joy.code}</span>
                    </div>
                    {numAmount > 0 && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {t("memberPortal.joy.particle.fee", "Phí sáng tạo")}: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{joy.text(fee)}</strong>
                        {" · "}{t("memberPortal.joy.particle.total", "Tổng")}: <strong className="text-slate-900 dark:text-white font-black">{joy.text(total)}</strong>
                      </p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {suggestedAmounts.map(q => (
                      <button
                        key={q}
                        onClick={() => setAmount(String(joy.value(q)))}
                        className={`flex-1 py-1.5 rounded-full text-xs font-black transition-all ${
                          amount === String(joy.value(q))
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {balanceKnown && (
                    <div className={`mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold ${insufficientBalance ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{insufficientBalance ? "error" : "account_balance_wallet"}</span>{insufficientBalance ? t("memberPortal.joy.particle.insufficientBalance") : t("memberPortal.joy.particle.balanceAfter")}</span>
                      <strong>{joy.text(Math.max(0, availableBalance - total))}</strong>
                    </div>
                  )}

                  {/* Note */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: ".1em" }}>{t("memberPortal.joy.particle.noteTitle", "Nội dung (tùy chọn)")}</p>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={t("memberPortal.joy.particle.notePlaceholder", "Nhập nội dung...")}
                      maxLength={100}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {/* Suggestion chips */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {[t("memberPortal.joy.particle.chipThanks", "Cảm ơn!"), t("memberPortal.joy.particle.chipGift", "Tặng bạn")].map(chip => (
                        <button
                          key={chip}
                          onClick={() => setNote(chip)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                            note === chip
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={numAmount < MIN_SEND || numAmount > MAX_SEND || insufficientBalance}
                    onClick={() => { setStep("invoice"); setError(""); }}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
                      background: numAmount < 10 || insufficientBalance ? "hsl(var(--muted))" : "hsl(var(--foreground))",
                      color: "#fff", fontWeight: 800, fontSize: 13, cursor: numAmount < 10 || insufficientBalance ? "not-allowed" : "pointer",
                      boxShadow: "none",
                    }}
                  >
                    {t("memberPortal.joy.particle.next", "Tiếp theo")}
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
                          <p style={{ margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{t("memberPortal.joy.particle.sendTo", "Gửi tới")}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "hsl(var(--foreground))" }} className="dark:text-white">{recipient.displayName}</p>
                        </div>
                      </div>
                      {note.trim() && (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 mb-2 border border-slate-200/70 dark:border-white/10">
                          <p className="m-0 text-xs text-slate-600 dark:text-slate-300 italic font-medium">"{note.trim()}"</p>
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{t("memberPortal.joy.particle.amountTitle", "Số JOY gửi")}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "hsl(var(--foreground))" }} className="dark:text-white">{joy.text(numAmount)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{t("memberPortal.joy.particle.fee", "Phí sáng tạo")} ({TRANSFER_FEE_RATE * 100}%)</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>{joy.text(fee)}</span>
                      </div>
                      {/* Chỉ hiện khi thật sự phải đổi đơn vị — nói rõ đổi từ gì sang gì */}
                      {bill.crossDenom && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>
                            {t("memberPortal.joy.particle.conversionFee", {
                              from: bill.fromCode, to: bill.toCode, percent: Math.round(CROSS_DENOM_FEE * 100),
                            })}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>{joy.text(conversionFee)}</span>
                        </div>
                      )}
                    </div>

                    <Divider />

                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "hsl(var(--foreground))" }} className="dark:text-white">{t("memberPortal.joy.particle.totalDeduction", "Tổng khấu trừ")}</span>
                        <span style={{ fontSize: 19, fontWeight: 900, color: "hsl(var(--jc-accent))" }}>{joy.text(total)}</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ef4444", textAlign: "center" }}>{error}</p>
                    </div>
                  )}

                  <p style={{ textAlign: "center", fontSize: 12, color: "hsl(var(--muted-foreground) / .6)", marginTop: 10, marginBottom: 14, fontWeight: 600, letterSpacing: ".04em" }}>
                    {t("memberPortal.joy.particle.warning", "Giao dịch JOY không thể hoàn lại — kiểm tra kỹ trước khi xác nhận")}
                  </p>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setStep("amount")}
                      className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {t("memberPortal.joy.particle.back", "Quay lại")}
                    </button>
                    <button onClick={handleSend} style={{
                      flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
                      background: "hsl(var(--foreground))", color: "hsl(var(--background))",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "none",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>send</span>
                      {t("memberPortal.joy.particle.sendNow", "Chuyển ngay")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: PIN ── */}
              {step === "pin" && (
                <div style={{ padding: "16px 18px 24px", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "hsl(var(--muted-foreground))", textAlign: "center" }} className="dark:text-slate-400">
                    {t("memberPortal.joy.particle.pinHint", { amount: numAmount, name: recipient?.displayName })}
                  </p>
                  
                  {/* Password Circles */}
                  <div style={{ display: "flex", gap: 14, margin: "20px 0 16px 0" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "2px solid #cbd5e1",
                          background: pinInput.length > i ? "hsl(var(--foreground))" : "transparent",
                          borderColor: pinInput.length > i ? "hsl(var(--foreground))" : "hsl(var(--border))",
                          transition: "all 0.15s ease"
                        }}
                        className="dark:border-white/20 dark:bg-transparent"
                      />
                    ))}
                  </div>

                  {/* Face ID Quick Pay Button */}
                  {FaceIdPayHelper.isAvailable() && (
                    <button
                      onClick={async () => {
                        try {
                          await FaceIdPayHelper.authenticateBiometricPay();
                          handleVerifyAndSend("BIOMETRIC_PASSED");
                        } catch (err) {
                          setError(err.message || t("memberPortal.joy.particle.faceIdFailed"));
                        }
                      }}
                      className="mb-4 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-2 hover:bg-indigo-100 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">fingerprint</span>
                      Xác nhận nhanh bằng Face ID / Touch ID
                    </button>
                  )}

                  {error && (
                    <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, margin: "0 0 16px 0", textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  {/* Keyboard Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px 24px",
                    width: "100%",
                    maxWidth: 240,
                    margin: "0 auto"
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          playBeep();
                          if (pinInput.length < 6) {
                            const next = pinInput + num;
                            setPinInput(next);
                            if (next.length === 6) {
                              handleVerifyAndSend(next);
                            }
                          }
                        }}
                        style={{
                          borderRadius: "50%",
                          width: 50,
                          height: 50,
                          fontSize: 18,
                          fontWeight: 850,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                          transition: "all 0.2s"
                        }}
                        className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button
                      onClick={() => {
                        playBeep();
                        if (pinInput.length < 6) {
                          const next = pinInput + "0";
                          setPinInput(next);
                          if (next.length === 6) {
                            handleVerifyAndSend(next);
                          }
                        }
                      }}
                      style={{
                        borderRadius: "50%",
                        width: 50,
                        height: 50,
                        fontSize: 18,
                        fontWeight: 850,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        transition: "all 0.2s"
                      }}
                      className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      onClick={() => {
                        playBeep();
                        setPinInput(prev => prev.slice(0, -1));
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        width: 50,
                        height: 50,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto"
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>backspace</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: OTP email (giao dịch lớn) ── */}
              {step === "otp" && (
                <div style={{ padding: "16px 18px 28px", display: "flex", flexDirection: "column", alignItems: "center" }} className="text-slate-900 dark:text-white">
                  <span className="material-symbols-outlined text-[32px] text-indigo-500 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                  <p style={{ margin: "0 0 16px 0", fontSize: 13, textAlign: "center" }} className="text-slate-500 dark:text-slate-400">
                    {t("memberPortal.joy.particle.otpHint", "Giao dịch lớn cần xác nhận thêm. Chúng tôi đã gửi một mã 6 số tới email của bạn.")}
                  </p>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoFocus
                    placeholder="••••••"
                    className="w-full max-w-[220px] text-center tracking-[0.5em] text-2xl font-black rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3 outline-none focus:border-indigo-500"
                  />
                  {error && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, margin: "14px 0 0", textAlign: "center" }}>{error}</div>}
                  <button
                    onClick={() => { if (otpInput.length === 6) handleVerifyAndSend(lastPin, otpInput); }}
                    disabled={otpInput.length !== 6}
                    className="mt-5 w-full max-w-[220px] rounded-xl bg-indigo-600 text-white font-bold py-3 disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                  >
                    {t("memberPortal.joy.particle.otpConfirm", "Xác nhận & gửi")}
                  </button>
                  <button
                    onClick={() => { setStep("pin"); setError(""); setOtpInput(""); }}
                    className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {t("memberPortal.joy.particle.back", "Quay lại")}
                  </button>
                </div>
              )}

              {/* ── Step: Setup PIN ── */}
              {step === "setup-pin" && (
                <div style={{ padding: "16px 18px 24px", color: "hsl(var(--foreground))", display: "flex", flexDirection: "column", alignItems: "center" }} className="dark:text-white">
                  <span className="material-symbols-outlined text-[32px] text-amber-500 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                  <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 800, color: "hsl(var(--foreground))", textAlign: "center" }} className="dark:text-white">
                    {setupPinStep === 1 ? t("memberPortal.joy.particle.pinSetupHeading") : t("memberPortal.joy.particle.pinConfirmHeading")}
                  </p>
                  <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "hsl(var(--muted-foreground))", textAlign: "center" }} className="dark:text-slate-400">
                    {setupPinStep === 1
                      ? t("memberPortal.joy.particle.pinSetupBody")
                      : t("memberPortal.joy.particle.pinConfirmBody")}
                  </p>
                  
                  {/* Password Circles */}
                  <div style={{ display: "flex", gap: 14, margin: "14px 0 24px 0" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "2px solid #cbd5e1",
                          background: pinInput.length > i ? "hsl(var(--foreground))" : "transparent",
                          borderColor: pinInput.length > i ? "hsl(var(--foreground))" : "hsl(var(--border))",
                          transition: "all 0.15s ease"
                        }}
                        className="dark:border-white/20 dark:bg-transparent"
                      />
                    ))}
                  </div>

                  {error && (
                    <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, margin: "0 0 16px 0", textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  {/* Keyboard Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px 24px",
                    width: "100%",
                    maxWidth: 240,
                    margin: "0 auto"
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          playBeep();
                          if (pinInput.length < 6) {
                            const next = pinInput + num;
                            setPinInput(next);
                            if (next.length === 6) {
                              handleSetupPin(next);
                            }
                          }
                        }}
                        style={{
                          borderRadius: "50%",
                          width: 50,
                          height: 50,
                          fontSize: 18,
                          fontWeight: 850,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                          transition: "all 0.2s"
                        }}
                        className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button
                      onClick={() => {
                        playBeep();
                        if (pinInput.length < 6) {
                          const next = pinInput + "0";
                          setPinInput(next);
                          if (next.length === 6) {
                            handleSetupPin(next);
                          }
                        }
                      }}
                      style={{
                        borderRadius: "50%",
                        width: 50,
                        height: 50,
                        fontSize: 18,
                        fontWeight: 850,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        transition: "all 0.2s"
                      }}
                      className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      onClick={() => {
                        playBeep();
                        setPinInput(prev => prev.slice(0, -1));
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        width: 50,
                        height: 50,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto"
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>backspace</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: Sending ── */}
              {step === "sending" && (
                <div style={{ padding: "40px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", width: 72, height: 72 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid hsl(var(--border))" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "hsl(var(--foreground))", animation: "jtSpin 1s linear infinite" }} />
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, color: "hsl(var(--foreground) / .55)", fontVariationSettings: "'FILL' 1",
                    }}>toll</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "hsl(var(--foreground))" }} className="dark:text-white">{t("memberPortal.joy.particle.transferring")}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>{t("memberPortal.joy.particle.dontClose")}</p>
                  </div>
                </div>
              )}

              {/* ── Step: Success — GIỮ CHỜ RÀ SOÁT ── */}
              {step === "success" && result?.held && (
                <div style={{ padding: "28px 20px 20px", textAlign: "center" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                    boxShadow: "0 0 24px rgba(99,102,241,.35)",
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#fff", fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900 }} className="text-slate-900 dark:text-white">
                    {t("memberPortal.joy.particle.heldTitle", "Đang rà soát an toàn")}
                  </p>
                  <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6 }} className="text-slate-500 dark:text-slate-400">
                    {result.message || t("memberPortal.joy.particle.heldBody", "Giao dịch lớn này đang được rà soát để bảo vệ ví của bạn. Chúng tôi sẽ thông báo ngay khi hoàn tất, thường trong ít phút. Tiền chưa bị trừ.")}
                  </p>
                  {result.txCode && (
                    <p style={{ margin: "14px 0 0", fontSize: 11, fontFamily: "monospace" }} className="text-slate-400">
                      {t("memberPortal.joy.particle.receiptId", "Mã GD")}: {result.txCode}
                    </p>
                  )}
                  <button onClick={onClose} className="mt-5 w-full py-3 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition-all cursor-pointer">
                    {t("memberPortal.joy.particle.understood", "Đã hiểu")}
                  </button>
                </div>
              )}

              {/* ── Step: Success ── */}
              {step === "success" && result && !result.held && (
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
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "hsl(var(--foreground))" }} className="dark:text-white">{t("memberPortal.joy.particle.transferSuccess")}</p>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, margin: "10px 0" }}>
                      <span style={{ fontSize: 34, fontWeight: 900, color: "hsl(var(--jc-accent))" }}>-{joy.number(result.sentAmount)}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "hsl(var(--muted-foreground))" }}>{joy.code}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3.5 mb-4 border border-slate-200/70 dark:border-white/10">
                    {[
                      { label: t("memberPortal.joy.particle.receiptId"), value: result.txCode, mono: true },
                      { label: t("memberPortal.joy.particle.recipientLabel"), value: result.recipientName },
                      { label: t("memberPortal.joy.particle.receiptFee"), value: joy.text(result.feeAmount) },
                      ...(result.conversionFee
                        ? [{
                            label: t("memberPortal.joy.particle.conversionFee", {
                              from: result.fromDenom, to: result.toDenom, percent: Math.round(CROSS_DENOM_FEE * 100),
                            }),
                            value: joy.text(result.conversionFee),
                          }]
                        : []),
                      ...(result.message ? [{ label: t("memberPortal.joy.particle.receiptNote"), value: result.message }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-200/50 dark:border-white/10 last:border-0">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{row.label}</span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white" style={{ fontFamily: row.mono ? "monospace" : "inherit" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              )}

              <p className="mx-4 mb-4 text-center text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none">
                JOY không thể nạp bằng tiền mặt
              </p>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
