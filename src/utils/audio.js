// Centralized Web Audio utility to cache and reuse a single AudioContext instance.
// This prevents browser memory leaks and "too many AudioContexts" warnings.

let globalAudioCtx = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio pop effect failed:", e);
  }
};

// Two-tone "ding-dong" chime for incoming notifications (toasts, real-time
// JOY/verification updates) — distinct from the UI pop/tick sounds above so
// it's recognizable as "something happened" rather than a button click.
export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    const notes = [{ hz: 880, at: 0 }, { hz: 1320, at: 0.12 }];
    notes.forEach(({ hz, at }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, ctx.currentTime + at);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.32);
    });
  } catch (e) {
    console.warn("Notification sound failed:", e);
  }
};

// ── HugoArcade interaction sounds ──────────────────────────────────────────
// Small, generic primitives reused across 2048/Caro/Snake/Survivor/Word Guess
// so every game has *some* audio feedback instead of being silent — each game
// just picks whichever of these fits its own interaction (move, place a
// stone, eat food, win/lose) rather than each game inventing its own tones.

export const playGameMove = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { /* ignore */ }
};

export const playGameSelect = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) { /* ignore */ }
};

export const playGameMerge = () => {
  try {
    const ctx = getAudioContext();
    [660, 990].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const at = ctx.currentTime + i * 0.06;
      osc.frequency.setValueAtTime(hz, at);
      gain.gain.setValueAtTime(0.12, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.15);
    });
  } catch (e) { /* ignore */ }
};

export const playGameWin = () => {
  try {
    const ctx = getAudioContext();
    [523, 659, 784, 1046].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const at = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(hz, at);
      gain.gain.setValueAtTime(0.001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.3);
    });
  } catch (e) { /* ignore */ }
};

export const playGameLose = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch (e) { /* ignore */ }
};

export const playTick = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio tick effect failed:", e);
  }
};
