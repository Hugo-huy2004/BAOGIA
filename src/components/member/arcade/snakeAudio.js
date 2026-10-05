// ─── Procedural Cartoon Web Audio Engine for 3D Snake Game ───────────────────
// Nhạc nền hoạt hình vui tươi (Cartoon BGM) + Hiệu ứng âm thanh ngọt ngào (SFX)
// 100% Web Audio API thuần, KHÔNG tải file âm thanh ngoài, chạy mượt mà offline,
// tiết kiệm băng thông và tối ưu hiệu năng cao nhất.

let audioCtx = null;
let bgmGainNode = null;
let sfxGainNode = null;
let bgmIntervalId = null;
let isFeverBgm = false;
let isMutedState = false;

// Đọc cài đặt âm thanh từ localStorage nếu có
try {
  const savedMute = localStorage.getItem("hugo_arcade_snake_muted");
  if (savedMute !== null) {
    isMutedState = savedMute === "true";
  }
} catch {
  // Bỏ qua lỗi trình duyệt chặn storage
}

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();

    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.setValueAtTime(isMutedState ? 0 : 0.18, audioCtx.currentTime);
    bgmGainNode.connect(audioCtx.destination);

    sfxGainNode = audioCtx.createGain();
    sfxGainNode.gain.setValueAtTime(isMutedState ? 0 : 0.28, audioCtx.currentTime);
    sfxGainNode.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isAudioMuted() {
  return isMutedState;
}

export function setAudioMuted(muted) {
  isMutedState = muted;
  try {
    localStorage.setItem("hugo_arcade_snake_muted", String(muted));
  } catch {
    // Ignore
  }

  const ctx = getContext();
  if (!ctx) return;

  if (bgmGainNode) {
    bgmGainNode.gain.setValueAtTime(muted ? 0 : 0.18, ctx.currentTime);
  }
  if (sfxGainNode) {
    sfxGainNode.gain.setValueAtTime(muted ? 0 : 0.28, ctx.currentTime);
  }
}

export function toggleAudioMuted() {
  const next = !isMutedState;
  setAudioMuted(next);
  return next;
}

// ── Bộ tạo giai điệu hoạt hình (Tone Synthesizers) ───────────────────────────
function playTone({ freq, endFreq, type = "sine", dur = 0.15, vol = 0.2, delay = 0, isBgm = false }) {
  const ctx = getContext();
  if (!ctx || isMutedState) return;

  const targetGain = isBgm ? bgmGainNode : sfxGainNode;
  if (!targetGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), startTime + dur);
  }

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc.connect(gain);
  gain.connect(targetGain);

  osc.start(startTime);
  osc.stop(startTime + dur + 0.05);
}

// ── Hiệu ứng âm thanh hoạt hình (Juicy Cartoon SFX) ──────────────────────────

/** Tiếng cắn hoa quả giòn tan: Nom Nom / Chomp! */
export function playChomp(type = "normal") {
  const ctx = getContext();
  if (!ctx || isMutedState) return;

  const baseFreq = type === "kiwi" ? 480 : type === "strawberry" ? 540 : 420;
  const randPitch = (Math.random() - 0.5) * 40;

  // Cắn giòn (crunch pop)
  playTone({ freq: baseFreq + randPitch, endFreq: (baseFreq + randPitch) * 1.6, type: "triangle", dur: 0.08, vol: 0.22 });
  playTone({ freq: (baseFreq + randPitch) * 1.8, endFreq: (baseFreq + randPitch) * 0.9, type: "sine", dur: 0.12, vol: 0.18, delay: 0.04 });
}

/** Tiếng ăn Donut kem dâu: Chuông phép thuật tưng bừng */
export function playDonutChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
  notes.forEach((freq, idx) => {
    playTone({ freq, type: "sine", dur: 0.22, vol: 0.24, delay: idx * 0.055 });
  });
}

/** Tiếng kích hoạt Nam Châm hút hoa quả (Magnet Whoosh) */
export function playMagnetWhoosh() {
  const ctx = getContext();
  if (!ctx || isMutedState) return;

  playTone({ freq: 280, endFreq: 880, type: "sine", dur: 0.26, vol: 0.2 });
  playTone({ freq: 440, endFreq: 1100, type: "triangle", dur: 0.28, vol: 0.16, delay: 0.06 });
}

/** Tiếng hoa quả bị hút vèo vèo vào miệng rắn */
export function playMagnetSuck() {
  playTone({ freq: 720, endFreq: 1200, type: "sine", dur: 0.07, vol: 0.14 });
}

/** Tiếng nhặt quả Sao Vàng Hoàng Kim (Fever Star) */
export function playStarFever() {
  const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
  arpeggio.forEach((freq, i) => {
    playTone({ freq, type: "triangle", dur: 0.25, vol: 0.28, delay: i * 0.045 });
  });
}

/** Tiếng chuối tăng tốc nhẹ nhàng (Banana Zip) */
export function playBananaZip() {
  playTone({ freq: 350, endFreq: 820, type: "triangle", dur: 0.16, vol: 0.2 });
}

/** Tiếng bẻ lái Boing nảy lò xo */
export function playCartoonBoing() {
  playTone({ freq: 190, endFreq: 380, type: "sine", dur: 0.14, vol: 0.18 });
  playTone({ freq: 380, endFreq: 240, type: "triangle", dur: 0.12, vol: 0.14, delay: 0.05 });
}

/** Tiếng lướt nhanh rít gió hoạt hình (Boost Wind) */
export function playBoostWhoosh() {
  playTone({ freq: 220, endFreq: 480, type: "triangle", dur: 0.18, vol: 0.15 });
}

/** Tiếng nổ kẹo dẻo khi đụng mìn / chướng ngại trong Fever */
export function playCandySmash() {
  playTone({ freq: 650, endFreq: 120, type: "sawtooth", dur: 0.2, vol: 0.22 });
  playTone({ freq: 280, endFreq: 60, type: "sine", dur: 0.25, vol: 0.25 });
}

/** Tiếng qua chặng / Thăng hoa (Level Up Fanfare) */
export function playLevelUpFanfare() {
  const fanfare = [
    { freq: 523.25, dur: 0.12, delay: 0 },
    { freq: 659.25, dur: 0.12, delay: 0.12 },
    { freq: 783.99, dur: 0.14, delay: 0.24 },
    { freq: 1046.5, dur: 0.45, delay: 0.38 },
  ];
  fanfare.forEach((n) => {
    playTone({ freq: n.freq, type: "triangle", dur: n.dur, vol: 0.28, delay: n.delay });
    playTone({ freq: n.freq * 1.5, type: "sine", dur: n.dur, vol: 0.14, delay: n.delay });
  });
}

/** Tiếng thua cuộc vui nhộn (Comical Cartoon Bump / Slide Trombone) */
export function playCartoonLose() {
  const steps = [
    { freq: 380, endFreq: 340, dur: 0.2, delay: 0 },
    { freq: 340, endFreq: 300, dur: 0.22, delay: 0.22 },
    { freq: 300, endFreq: 240, dur: 0.26, delay: 0.46 },
    { freq: 240, endFreq: 120, dur: 0.45, delay: 0.74 },
  ];
  steps.forEach((s) => {
    playTone({ freq: s.freq, endFreq: s.endFreq, type: "sawtooth", dur: s.dur, vol: 0.2, delay: s.delay });
  });
}

// ── Vòng Lặp Nhạc Nền Hoạt Hình (Procedural Cartoon BGM Loop) ────────────────
// Giai điệu Marimba vui nhộn theo nhịp 4/4 tươi vui, thân thiện như Super Mario / Animal Crossing

const MELODY_NORMAL = [
  // Cú nhảy vui (Measure 1)
  { note: 523.25, dur: 0.16, step: 0 },   // C5
  { note: 659.25, dur: 0.16, step: 1 },   // E5
  { note: 783.99, dur: 0.20, step: 2 },   // G5
  { note: 880.00, dur: 0.16, step: 3 },   // A5
  { note: 783.99, dur: 0.22, step: 4 },   // G5
  { note: 659.25, dur: 0.16, step: 6 },   // E5
  { note: 587.33, dur: 0.20, step: 7 },   // D5

  // Cú nhảy vui (Measure 2)
  { note: 523.25, dur: 0.16, step: 8 },   // C5
  { note: 587.33, dur: 0.16, step: 9 },   // D5
  { note: 659.25, dur: 0.24, step: 10 },  // E5
  { note: 523.25, dur: 0.16, step: 12 },  // C5
  { note: 440.00, dur: 0.22, step: 14 },  // A4
  { note: 392.00, dur: 0.28, step: 15 },  // G4
];

const BASS_NORMAL = [
  { note: 130.81, dur: 0.16, step: 0 },   // C3
  { note: 196.00, dur: 0.16, step: 4 },   // G3
  { note: 146.83, dur: 0.16, step: 8 },   // D3
  { note: 196.00, dur: 0.16, step: 12 },  // G3
];

let bgmStep = 0;
const TOTAL_STEPS = 16;
const STEP_TIME_MS = 145; // ~103 BPM vui vẻ nảy nhịp

export function startCartoonBgm({ fever = false } = {}) {
  const ctx = getContext();
  if (!ctx) return;

  isFeverBgm = fever;
  if (bgmIntervalId) clearInterval(bgmIntervalId);

  bgmStep = 0;
  const interval = isFeverBgm ? STEP_TIME_MS * 0.75 : STEP_TIME_MS;

  bgmIntervalId = setInterval(() => {
    if (isMutedState) return;

    // Chơi nốt Giai Điệu (Melody - Marimba synth)
    const notesAtStep = MELODY_NORMAL.filter((m) => m.step === bgmStep);
    notesAtStep.forEach((m) => {
      const freq = isFeverBgm ? m.note * 1.25 : m.note;
      playTone({
        freq,
        type: isFeverBgm ? "triangle" : "sine",
        dur: m.dur,
        vol: 0.12,
        isBgm: true,
      });
      // Âm bội leng keng
      playTone({
        freq: freq * 2,
        type: "sine",
        dur: m.dur * 0.5,
        vol: 0.04,
        isBgm: true,
      });
    });

    // Chơi nốt Bassline nảy tưng tưng
    const bassAtStep = BASS_NORMAL.find((b) => b.step === bgmStep);
    if (bassAtStep) {
      const bassFreq = isFeverBgm ? bassAtStep.note * 1.25 : bassAtStep.note;
      playTone({
        freq: bassFreq,
        endFreq: bassFreq * 0.85,
        type: "triangle",
        dur: bassAtStep.dur,
        vol: 0.15,
        isBgm: true,
      });
    }

    bgmStep = (bgmStep + 1) % TOTAL_STEPS;
  }, interval);
}

export function setBgmFever(fever) {
  if (isFeverBgm === fever) return;
  startCartoonBgm({ fever });
}

export function stopCartoonBgm() {
  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
}
