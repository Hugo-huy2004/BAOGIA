import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// EmergencySiren — a loud, attention-grabbing SOS alarm for crisis moments.
//
// When a student in crisis taps it, the phone becomes a beacon: a two-tone
// siren at max volume (Web Audio, generated locally — works offline), strong
// vibration, and a full-screen red flashing overlay with an SOS message so
// ANYONE nearby notices and can help immediately. A Wake Lock keeps the
// screen on while the alarm runs. Everything stops with one tap.
//
// Web Audio needs a user gesture to start — the button tap IS that gesture,
// so autoplay policies never block it.
// ─────────────────────────────────────────────────────────────────────────────

const SIREN_CSS = `
@keyframes sosFlash { 0%,100%{background:rgba(190,18,60,.96)} 50%{background:rgba(255,241,242,.98)} }
@keyframes sosPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
`;

// Shared siren engine — used by the manual button AND the auto-trigger
// countdown prompt below, so both behave identically.
const safelyVibrate = (pattern) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
};

function useSiren() {
  const [active, setActive] = useState(false);
  const audioRef = useRef(null);   // { ctx, osc, gain, sweep }
  const vibrateRef = useRef(null);
  const wakeLockRef = useRef(null);

  const start = async () => {
    if (active) return;
    setActive(true);

    // 1) Two-tone siren (EU-ambulance style): square wave alternating
    //    660Hz ↔ 990Hz — square carries much farther than sine at equal gain.
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      // Some browsers hand us a suspended context — resume explicitly (allowed
      // thanks to sticky user activation from the message-send gesture).
      if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Full output: unity gain + a compressor stage so the square wave hits
      // max loudness without clipping distortion. (The web CANNOT raise the
      // device's system volume — 1.0 here is the loudest the platform allows.)
      const comp = ctx.createDynamicsCompressor();
      osc.type = "square";
      osc.frequency.value = 660;
      gain.gain.value = 1.0;
      osc.connect(gain).connect(comp).connect(ctx.destination);
      osc.start();
      let hi = false;
      const sweep = setInterval(() => {
        hi = !hi;
        try { osc.frequency.setTargetAtTime(hi ? 990 : 660, ctx.currentTime, 0.02); } catch { /* ignore */ }
      }, 450);
      audioRef.current = { ctx, osc, gain, sweep };
    } catch { /* no audio available — vibration + flash still run */ }

    // 2) Strong repeating vibration.
    safelyVibrate([500, 150, 500, 150]);
    vibrateRef.current = setInterval(() => safelyVibrate([500, 150, 500, 150]), 1400);

    // 3) Keep the screen awake so the flashing beacon stays visible.
    try {
      wakeLockRef.current = await navigator.wakeLock?.request?.("screen");
    } catch { /* ignore */ }
  };

  const stop = () => {
    setActive(false);
    const a = audioRef.current;
    if (a) {
      try { clearInterval(a.sweep); } catch { /* ignore */ }
      try { a.osc.stop(); } catch { /* ignore */ }
      try { a.ctx.close(); } catch { /* ignore */ }
      audioRef.current = null;
    }
    if (vibrateRef.current) { 
      try { clearInterval(vibrateRef.current); } catch { /* ignore */ }
      vibrateRef.current = null; 
    }
    safelyVibrate(0);
    try { wakeLockRef.current?.release?.(); } catch { /* ignore */ }
    wakeLockRef.current = null;
  };

  // Safety net: tear everything down if the component unmounts mid-alarm.
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { active, start, stop };
}

// Full-screen flashing SOS beacon shown while the siren is running.
// `onStop` renders a stop button (manual mode); `secondsLeft` renders a
// non-dismissable auto-off countdown instead (medical auto mode).
function SirenOverlay({ onStop, secondsLeft }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ animation: "sosFlash 0.6s linear infinite" }}
    >
      <style>{SIREN_CSS}</style>
      <span
        className="material-symbols-outlined text-[96px] text-rose-950 drop-shadow-lg"
        style={{ fontVariationSettings: "'FILL' 1", animation: "sosPulse 0.6s ease-in-out infinite" }}
      >
        sos
      </span>
      <div>
        <p className="text-3xl font-black text-rose-950 tracking-wider">CẦN GIÚP ĐỠ KHẨN CẤP</p>
        <p className="mt-2 text-base font-bold text-rose-950/90">
          Người này đang cần hỗ trợ ngay lập tức.
          <br />Hãy ở bên cạnh và gọi <a className="underline" href="tel:115">115</a> hoặc <a className="underline" href="tel:111">111</a>.
        </p>
      </div>
      {onStop ? (
        <button
          type="button"
          onClick={onStop}
          className="mt-4 px-10 py-4 rounded-2xl bg-rose-950 text-white text-base font-black shadow-2xl active:scale-95 transition-transform"
        >
          DỪNG BÁO ĐỘNG
        </button>
      ) : (
        <p className="mt-4 px-6 py-3 rounded-2xl bg-rose-950/80 text-white text-sm font-black tracking-wider">
          Báo động y tế tự động — tự tắt sau {secondsLeft}s
        </p>
      )}
    </div>
  );
}

export default function EmergencySiren({ compact = false }) {
  const { active, start, stop } = useSiren();
  return (
    <>
      <button
        type="button"
        onClick={start}
        className={compact
          ? "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-700 text-white text-[10px] font-black active:scale-95 transition-transform"
          : "flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-black transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"}
        title="Phát còi báo động để người xung quanh chú ý ngay"
      >
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
        {compact ? "SOS" : "Báo động SOS"}
      </button>
      {active && <SirenOverlay onStop={stop} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CrisisSosCountdown — MEDICAL AUTO ALARM. Fires the instant the local crisis
// detector matches a self-harm message: the siren sounds immediately at full
// output, runs for exactly AUTO_SOS_SECONDS, then shuts itself off. There is
// deliberately NO stop control (product decision: the beacon must not be
// silenceable by the person in crisis) — the strict 10s auto-cutoff is the
// safety valve for false positives.
// ─────────────────────────────────────────────────────────────────────────────
const AUTO_SOS_SECONDS = 10;

export function CrisisSosCountdown({ open, onClose }) {
  const { active, start, stop } = useSiren();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_SOS_SECONDS);

  useEffect(() => {
    if (!open) return undefined;
    setSecondsLeft(AUTO_SOS_SECONDS);
    start(); // sound the beacon IMMEDIATELY — no arming delay
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const cutoff = setTimeout(() => { stop(); onClose?.(); }, AUTO_SOS_SECONDS * 1000);
    return () => { clearInterval(tick); clearTimeout(cutoff); stop(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !active) return null;
  return <SirenOverlay secondsLeft={secondsLeft} />;
}
