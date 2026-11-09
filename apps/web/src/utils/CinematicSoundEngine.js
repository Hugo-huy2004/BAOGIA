// Subliminal Velvet Acoustic Engine for Hugo Studio
// 100% Autonomous, zero-latency Web Audio procedural synthesis.
// ZERO continuous drone or background hum (prevents ear fatigue).
// 100% SILENCE when idle.
// Rich, warm, organic acoustic chimes and Apple/Switch-style tactile feedback.

let audioCtx = null;
let masterGain = null;
let masterFilter = null;
let isAudioUnlocked = false;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function initMaster() {
  const ctx = getContext();
  if (!ctx || masterGain) return;
  try {
    // Warm acoustic filter: gentle low-pass cutoff at 1200Hz.
    // Removes electronic harshness/sizzle while keeping crystal bell clarity.
    masterFilter = ctx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    masterFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    masterGain = ctx.createGain();
    // Audible, comfortable volume (around -12dB to -14dB)
    masterGain.gain.setValueAtTime(0.22, ctx.currentTime);

    masterFilter.connect(masterGain);
    masterGain.connect(ctx.destination);
    isAudioUnlocked = true;
  } catch {}
}

/**
 * Universal unlocker on ANY first user gesture (pointer, touch, key, scroll).
 */
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    initMaster();
    ["pointerdown", "click", "touchstart", "keydown", "wheel", "scroll"].forEach((ev) => {
      window.removeEventListener(ev, unlock);
    });
  };

  ["pointerdown", "click", "touchstart", "keydown", "wheel", "scroll"].forEach((ev) => {
    window.addEventListener(ev, unlock, { passive: true, once: true });
  });
}

/**
 * Apple/Nintendo-style warm acoustic haptic drop for button and card clicks.
 * Clean, tactile, satisfying (two-tone marimba micro-harmonic: 360Hz & 540Hz).
 */
export function playHapticTick() {
  const ctx = getContext();
  if (!ctx) return;
  if (!isAudioUnlocked || !masterGain || !masterFilter) {
    initMaster();
  }
  if (!masterFilter) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const nowCtx = ctx.currentTime;
    // Harmonic 1: warm punch
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(360, nowCtx);
    osc1.frequency.exponentialRampToValueAtTime(140, nowCtx + 0.035);

    gain1.gain.setValueAtTime(0.18, nowCtx);
    gain1.gain.exponentialRampToValueAtTime(0.0001, nowCtx + 0.035);

    osc1.connect(gain1);
    gain1.connect(masterFilter);
    osc1.start(nowCtx);
    osc1.stop(nowCtx + 0.04);

    // Harmonic 2: subtle acoustic glass overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(540, nowCtx);
    osc2.frequency.exponentialRampToValueAtTime(270, nowCtx + 0.025);

    gain2.gain.setValueAtTime(0.08, nowCtx);
    gain2.gain.exponentialRampToValueAtTime(0.0001, nowCtx + 0.025);

    osc2.connect(gain2);
    gain2.connect(masterFilter);
    osc2.start(nowCtx);
    osc2.stop(nowCtx + 0.03);
  } catch {}
}
