/**
 * Âm thanh của Education Hugo — tổng hợp bằng Web Audio, không tải tệp nào.
 *
 * Trình duyệt chỉ cho phát tiếng sau khi người dùng chạm/bấm lần đầu, nên âm thanh
 * tự động (nhân vật rơi xuống trang giới thiệu) chỉ kêu khi bối cảnh đã được mở
 * bằng một lần chạm. Tắt theo công tắc "Âm thanh trong bài" (khoá coding.sound).
 */
let ctx = null;

const enabled = () => {
  try { return localStorage.getItem("coding.sound") !== "off"; } catch { return true; }
};

function audio(unlock) {
  if (!ctx) {
    if (!unlock) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") {
    if (!unlock) return null;
    ctx.resume();
  }
  return ctx;
}

function tone(ac, { freq, to = freq, type = "sine", at = 0, dur = 0.12, vol = 0.12 }) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  pop: (ac) => tone(ac, { freq: 520, to: 880, dur: 0.09, vol: 0.1 }),                       // bấm nút
  tick: (ac) => tone(ac, { freq: 1200, type: "triangle", dur: 0.05, vol: 0.06 }),            // đổi tab
  thud: (ac) => tone(ac, { freq: 180, to: 60, type: "sine", dur: 0.18, vol: 0.16 }),         // chạm đất
  boing: (ac) => tone(ac, { freq: 220, to: 520, type: "triangle", dur: 0.22, vol: 0.08 }),   // bật nhảy
  coin: (ac) => { tone(ac, { freq: 988, type: "square", dur: 0.08, vol: 0.05 }); tone(ac, { freq: 1319, type: "square", at: 0.08, dur: 0.22, vol: 0.05 }); },
  success: (ac) => [523, 659, 784, 1047].forEach((freq, i) => tone(ac, { freq, type: "triangle", at: i * 0.08, dur: 0.18, vol: 0.08 })),
  whoosh: (ac) => tone(ac, { freq: 300, to: 1400, type: "sawtooth", dur: 0.18, vol: 0.025 }),
};

/** `unlock`: gọi từ một lần chạm của người dùng (được phép mở âm thanh). */
export function playEduSound(name, { unlock = false } = {}) {
  if (!enabled()) return;
  try {
    const ac = audio(unlock);
    if (ac) SOUNDS[name]?.(ac);
  } catch { /* âm thanh hỏng thì im lặng, không ảnh hưởng thao tác */ }
}

// Chạm vào đâu kêu gì: nút → pop, mục điều hướng → tick, đáp án → pop.
const TAP = [
  [".edu-tabs a, .edu-nav, .edu-seg button, .edu-footer-langs a", "tick"],
  [".edu-btn, .cmap-hex, .cmap-info, .quiz-option, .edu-quiz-options button, .lesson-player-foot button, .edu-welcome-lang", "pop"],
];

/** Gắn một lần cho cả site Edu; trả hàm gỡ. */
export function installEduTapSounds() {
  const onDown = (event) => {
    const hit = TAP.find(([selector]) => event.target.closest?.(selector));
    if (hit && !event.target.closest("[disabled]")) playEduSound(hit[1], { unlock: true });
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  return () => document.removeEventListener("pointerdown", onDown);
}
