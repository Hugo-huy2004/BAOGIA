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
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
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

// ── HugoArcade Enhanced Audio Synthesis FX ─────────────────────────────────
