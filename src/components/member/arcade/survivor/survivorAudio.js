// ─── Procedural Web Audio Engine for Space Wars 3D ───────────────────────────
// 100% Web Audio API: Zero external mp3/wav files, zero download overhead.
// Hỗ trợ BGM chiến tranh không gian kịch tính + SFX laser, nổ, warp cổng thời không.

let audioCtx = null;
let noiseBuffer = null;
let bgmInterval = null;
let isMuted = false;

try {
  isMuted = localStorage.getItem("hugo_arcade_survivor_muted") === "true";
} catch { /* ignore */ }

export function isAudioMuted() {
  return isMuted;
}

export function toggleAudioMuted() {
  isMuted = !isMuted;
  try {
    localStorage.setItem("hugo_arcade_survivor_muted", String(isMuted));
  } catch { /* ignore */ }
  if (isMuted) stopSpaceBgm();
  return isMuted;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function getNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const length = ctx.sampleRate * 1.5;
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// Helper gắn bộ cân bằng kênh âm thanh không gian 3D (Spatial Stereo Panner)
function connectWithPanner(ctx, node, panX = 0) {
  if (typeof ctx.createStereoPanner === "function") {
    try {
      const panner = ctx.createStereoPanner();
      const clampedPan = Math.max(-0.85, Math.min(0.85, panX));
      panner.pan.setValueAtTime(clampedPan, ctx.currentTime);
      node.connect(panner);
      panner.connect(ctx.destination);
      return;
    } catch { /* fallback */ }
  }
  node.connect(ctx.destination);
}

// ── TIẾNG BẮN LASER THEO CẤP ĐỘ NÒNG SÚNG (CINEMATIC FM SYNTH BLASTER) ─────────
export function playLaserShot(level = 1, panX = 0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  connectWithPanner(ctx, masterGain, panX);

  if (level >= 4) {
    // Nòng siêu laser Ray Tachyon: Xung điện từ trường cực mạnh, đanh thép
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(840, now);
    carrier.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    modulator.type = "sine";
    modulator.frequency.setValueAtTime(190, now);
    modGain.gain.setValueAtTime(600, now);
    modGain.gain.exponentialRampToValueAtTime(20, now + 0.12);

    modulator.connect(carrier.frequency);
    carrier.connect(gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    gain.connect(masterGain);
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 0.15);
    modulator.stop(now + 0.15);

    // Xung lực nén Sub-bass
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.1);
    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start(now);
    sub.stop(now + 0.12);
  } else if (level >= 2) {
    // Nòng kép / tứ nòng cánh S-Foil: Tiếng súng giòn, nén áp lực cao
    [0, 0.022].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const start = now + offset;
      const baseFreq = idx === 0 ? 1180 : 960;
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.exponentialRampToValueAtTime(220, start + 0.08);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  } else {
    // Cấp 1: Tiêu chuẩn tia laser ion hóa hiện đại (FM Pulse Blaster)
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    carrier.type = "sine";
    carrier.frequency.setValueAtTime(1250, now);
    carrier.frequency.exponentialRampToValueAtTime(240, now + 0.08);

    modulator.type = "sawtooth";
    modulator.frequency.setValueAtTime(280, now);
    modGain.gain.setValueAtTime(450, now);
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.08);

    modulator.connect(carrier.frequency);
    carrier.connect(gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    gain.connect(masterGain);
    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 0.095);
    modulator.stop(now + 0.095);
  }
}

// ── ĐẠN LASER ĐỊCH (TIE FIGHTER GREEN / RAIDER RED) VỚI SPATIAL PANNING ────────
export function playEnemyLaser(panX = 0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  connectWithPanner(ctx, masterGain, panX);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(560, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.085);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.1);
}

// ── NGƯ LÔI ION / TÊN LỬA TỰ DẪN ────────────────────────────────────────────
export function playTorpedoLaunch(panX = 0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  connectWithPanner(ctx, masterGain, panX);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.linearRampToValueAtTime(1200, now + 0.18);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.24);
}

// ── TIẾNG NỔ CHIẾN HẠM / TÀU ĐỊCH: NỔ TO, UY LỰC, SUB-BASS RỀN VANG ─────────────
export function playExplosion3D(size = 0.5, panX = 0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 0.35 + size * 0.55;

  const masterGain = ctx.createGain();
  connectWithPanner(ctx, masterGain, panX);

  // 1. Sóng kích chấn nổ xé toạc không khí (Noise Shockwave Burst)
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2800 + size * 2200, now);
  filter.frequency.exponentialRampToValueAtTime(60, now + dur);
  filter.Q.value = 2.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.38 + size * 0.32, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(now);
  src.stop(now + dur + 0.05);

  // 2. Tiếng nổ Sub-Bass siêu trầm làm rung màng loa (Concussive Deep Sub Drop)
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(140 + size * 60, now);
  sub.frequency.exponentialRampToValueAtTime(24, now + dur * 0.85);

  subGain.gain.setValueAtTime(0.48 + size * 0.28, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  sub.connect(subGain);
  subGain.connect(masterGain);
  sub.start(now);
  sub.stop(now + dur + 0.02);

  // 3. Tiếng vỡ vụn kim loại & tia lửa điện (Metallic Hull Crunch)
  const crunch = ctx.createOscillator();
  const crunchGain = ctx.createGain();
  crunch.type = "sawtooth";
  crunch.frequency.setValueAtTime(320, now);
  crunch.frequency.exponentialRampToValueAtTime(45, now + dur * 0.5);

  crunchGain.gain.setValueAtTime(0.001, now);
  crunchGain.gain.linearRampToValueAtTime(0.22, now + 0.02);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);

  crunch.connect(crunchGain);
  crunchGain.connect(masterGain);
  crunch.start(now);
  crunch.stop(now + dur * 0.52);
}

// ── SIÊU LASER QUY MÔ LỚN (OVERDRIVE / HYPER BEAM) ────────────────────────────
export function playHyperLaserBeam() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Tiếng hú nạp năng lượng lượng tử
  const charge = ctx.createOscillator();
  const chargeGain = ctx.createGain();
  charge.type = "sawtooth";
  charge.frequency.setValueAtTime(180, now);
  charge.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  chargeGain.gain.setValueAtTime(0.001, now);
  chargeGain.gain.linearRampToValueAtTime(0.2, now + 0.25);
  chargeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  charge.connect(chargeGain);
  chargeGain.connect(ctx.destination);
  charge.start(now);
  charge.stop(now + 0.72);

  // Tiếng chùm laser plasma rền vang
  const beamSrc = ctx.createBufferSource();
  beamSrc.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, now + 0.2);
  filter.Q.value = 4.0;
  const beamGain = ctx.createGain();
  beamGain.gain.setValueAtTime(0.001, now + 0.2);
  beamGain.gain.linearRampToValueAtTime(0.25, now + 0.35);
  beamGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  beamSrc.connect(filter);
  filter.connect(beamGain);
  beamGain.connect(ctx.destination);
  beamSrc.start(now + 0.2);
  beamSrc.stop(now + 1.25);
}

// ── NHẶT LÕI NÂNG CẤP VŨ KHÍ ──────────────────────────────────────────────────
export function playUpgradePickup() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 (hợp âm khải hoàn)
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    const start = now + idx * 0.045;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  });
}

// ── ÂM BÁO BẮN TRÚNG ĐÍCH (HIT MARKER CONFIRMATION) ──────────────────────────
export function playHitMarker() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2600, now);
  osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

// ── KHIÊN BẢO VỆ CHỐNG ĐẠN ───────────────────────────────────────────────────
export function playShieldHit() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// ── CẢNH BÁO TRÙM / CỔNG KHÔNG GIAN (WARP JUMP) ───────────────────────────────
export function playWarpPortalOpen() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Còi không gian trầm rợn
  const horn = ctx.createOscillator();
  const hornGain = ctx.createGain();
  horn.type = "sawtooth";
  horn.frequency.setValueAtTime(95, now);
  horn.frequency.linearRampToValueAtTime(175, now + 0.4);
  hornGain.gain.setValueAtTime(0.001, now);
  hornGain.gain.linearRampToValueAtTime(0.16, now + 0.08);
  hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
  horn.connect(hornGain);
  hornGain.connect(ctx.destination);
  horn.start(now);
  horn.stop(now + 0.9);
}

// ── BGM KHÔNG GIAN PROCEDURAL (SPACE WARS SYNTH) ──────────────────────────────
export function startSpaceBgm() {
  if (isMuted || bgmInterval) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const bassNotes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81]; // A2 bassline
  const leadNotes = [440, 523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 440];
  let step = 0;

  bgmInterval = setInterval(() => {
    if (isMuted) return;
    try {
      const now = ctx.currentTime;
      const bFreq = bassNotes[step % bassNotes.length];
      const lFreq = leadNotes[(step * 2) % leadNotes.length];

      // Bassline arpeggiator
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = "sawtooth";
      bOsc.frequency.setValueAtTime(bFreq, now);
      bGain.gain.setValueAtTime(0.001, now);
      bGain.gain.linearRampToValueAtTime(0.045, now + 0.02);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + 0.18);

      // Lead sci-fi pulse
      if (step % 2 === 0) {
        const lOsc = ctx.createOscillator();
        const lGain = ctx.createGain();
        lOsc.type = "sine";
        lOsc.frequency.setValueAtTime(lFreq, now);
        lGain.gain.setValueAtTime(0.001, now);
        lGain.gain.linearRampToValueAtTime(0.03, now + 0.03);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        lOsc.connect(lGain);
        lGain.connect(ctx.destination);
        lOsc.start(now);
        lOsc.stop(now + 0.3);
      }

      step++;
    } catch { /* ignore */ }
  }, 190);
}

export function stopSpaceBgm() {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}
