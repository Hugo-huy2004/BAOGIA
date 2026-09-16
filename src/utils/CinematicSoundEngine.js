// Subliminal Velvet Acoustic Engine for Hugo Studio
// 100% Autonomous, zero-latency Web Audio procedural synthesis.
// ZERO continuous drone or background hum (prevents ear fatigue).
// 100% SILENCE when idle.
// Rich, warm, organic acoustic chimes and Apple/Switch-style tactile feedback.

let audioCtx = null;
let masterGain = null;
let masterFilter = null;
let isAudioUnlocked = false;
let currentSceneIndex = -1;
let lastChimeTime = 0;
let lastHoverTime = 0;

// Warm organic chords (432Hz harmonic Solfeggio & Pentatonic scales)
// Clear, soothing, easily audible on phone & laptop speakers without harshness.
const SCENE_CHORDS = [
  { name: "Horizon", freqs: [216.0, 324.0, 432.0] },       // A3 - E4 - A4 (Warm, expansive)
  { name: "Craft", freqs: [261.6, 329.6, 392.0] },         // C4 - E4 - G4 (Harmonious, grounded)
  { name: "Systems", freqs: [293.7, 370.0, 440.0] },       // D4 - F#4 - A4 (Precision, airy)
  { name: "Constellation", freqs: [246.9, 311.1, 370.0] }, // B3 - D#4 - F#4 (Nocturnal, dreamy)
  { name: "Epilogue", freqs: [216.0, 270.0, 324.0] },      // A3 - C#4 - E4 (Peaceful resolution)
];

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
 * Plays an organic, soothing acoustic chime chord when crossing into a new chapter.
 * - Attack: 25ms soft swell
 * - Decay: 750ms gentle acoustic ring out
 * - Filtered through 1200Hz warm lowpass
 */
export function playSceneCutChime(index = 0) {
  const now = performance.now();
  if (now - lastChimeTime < 1800) return; // 1.8s cooldown
  lastChimeTime = now;

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
    const chordData = SCENE_CHORDS[index % SCENE_CHORDS.length] || SCENE_CHORDS[0];
    const nowCtx = ctx.currentTime;

    // Trigger warm 3-voice chord
    chordData.freqs.forEach((freq, voiceIdx) => {
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();

      osc.type = "sine";
      // Gentle detuning for acoustic chorus richness
      const detune = voiceIdx === 2 ? 0.8 : voiceIdx === 1 ? -0.5 : 0;
      osc.frequency.setValueAtTime(freq + detune, nowCtx);

      // Voice volume balance
      const voiceVol = voiceIdx === 0 ? 0.16 : voiceIdx === 1 ? 0.12 : 0.09;

      voiceGain.gain.setValueAtTime(0.0001, nowCtx);
      voiceGain.gain.linearRampToValueAtTime(voiceVol, nowCtx + 0.035); // 35ms soft swell
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, nowCtx + 0.85); // 850ms decay

      osc.connect(voiceGain);
      voiceGain.connect(masterFilter);

      osc.start(nowCtx);
      osc.stop(nowCtx + 0.9);
    });
  } catch {}
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

/**
 * Ultra-soft acoustic hover whisper for interactive cards and badges.
 * Debounced to 75ms to prevent flutter.
 */
export function playHapticHover() {
  const now = performance.now();
  if (now - lastHoverTime < 75) return;
  lastHoverTime = now;

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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(432, nowCtx);
    osc.frequency.exponentialRampToValueAtTime(324, nowCtx + 0.02);

    gain.gain.setValueAtTime(0.035, nowCtx);
    gain.gain.exponentialRampToValueAtTime(0.0001, nowCtx + 0.025);

    osc.connect(gain);
    gain.connect(masterFilter);
    osc.start(nowCtx);
    osc.stop(nowCtx + 0.03);
  } catch {}
}

/**
 * Synchronizes scroll thresholds with scene transition cues.
 */
export function syncScrollFilmBeat(progress, thresholds = [0.14, 0.38, 0.65, 0.88]) {
  if (typeof progress !== "number" || progress < 0 || progress > 1) return;

  let activeIndex = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (progress >= thresholds[i]) {
      activeIndex = i + 1;
    }
  }

  if (activeIndex !== currentSceneIndex) {
    if (currentSceneIndex !== -1) {
      playSceneCutChime(activeIndex);
    }
    currentSceneIndex = activeIndex;
  }
}
