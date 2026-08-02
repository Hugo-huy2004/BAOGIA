// Âm thanh riêng cho Space Survivor.
//
// useArcadeSound() chỉ có beep/win/lose dạng sóng đơn — nghe như đồ chơi khi
// một tàu trùm nổ tung. Ở đây dựng vài tiếng đúng chất bắn tàu bằng WebAudio
// thuần: KHÔNG tải tệp âm thanh nào (một gói mp3 nổ đàng hoàng cũng đã vài
// trăm KB, trong khi tiếng nổ chỉ là nhiễu trắng + lọc + tắt dần).

let ctx = null;
let noiseBuffer = null;

const audio = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // iOS treo context cho tới khi có thao tác của người dùng.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

const noise = (context) => {
  if (noiseBuffer) return noiseBuffer;
  const length = context.sampleRate * 1.2;
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
};

const tone = (context, { freq, endFreq, type = "sine", dur = 0.2, vol = 0.12, delay = 0 }) => {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const at = context.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), at + dur);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(context.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
};

/**
 * Tiếng nổ = nhiễu trắng qua bộ lọc thông thấp đang trượt xuống, cộng một cú
 * "thịch" trầm. `size` 0..1 quyết định độ to, độ dài và độ trầm — nổ drone khác
 * hẳn nổ tàu trùm.
 */
export function playExplosion(size = 0.5) {
  const context = audio();
  if (!context) return;
  const now = context.currentTime;
  const dur = 0.22 + size * 0.55;

  const src = context.createBufferSource();
  src.buffer = noise(context);
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800 + size * 2600, now);
  filter.frequency.exponentialRampToValueAtTime(140, now + dur);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1 + size * 0.22, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(context.destination);
  src.start(now);
  src.stop(now + dur + 0.05);

  // Cú đấm trầm cho cảm giác có khối lượng.
  tone(context, { freq: 120 + size * 60, endFreq: 32, type: "sine", dur: 0.18 + size * 0.3, vol: 0.09 + size * 0.12 });
}

/** Bắn: tiếng "tiu" ngắn, cố ý nhỏ vì bắn liên tục. */
export function playShot() {
  const context = audio();
  if (!context) return;
  tone(context, { freq: 880, endFreq: 320, type: "square", dur: 0.06, vol: 0.035 });
}

/** Còi báo trùm: hai nốt trầm dâng lên, đủ để giật mình. */
export function playBossWarning() {
  const context = audio();
  if (!context) return;
  tone(context, { freq: 180, endFreq: 420, type: "sawtooth", dur: 0.5, vol: 0.1 });
  tone(context, { freq: 90, endFreq: 210, type: "sawtooth", dur: 0.6, vol: 0.09, delay: 0.12 });
}

/** Dọn sạch đợt: hợp âm rải đi lên, ngắn gọn. */
export function playWaveClear() {
  const context = audio();
  if (!context) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    tone(context, { freq, type: "triangle", dur: 0.22, vol: 0.075, delay: index * 0.075 });
  });
}

/** Người chơi trúng đạn: tiếng rè ngắn, trầm. */
export function playHurt() {
  const context = audio();
  if (!context) return;
  tone(context, { freq: 260, endFreq: 70, type: "sawtooth", dur: 0.24, vol: 0.11 });
}
