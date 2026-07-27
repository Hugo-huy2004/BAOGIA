// Nguồn duy nhất cho ba thứ mọi game arcade đều cần: độ khó tự động, chuỗi
// combo và chữ điểm bay lên trên canvas.
//
// Trước đây mỗi game tự chế một công thức tăng tốc riêng (snake: score/3,
// tetris: score/400, flappy: không có gì cả), nên "độ khó" mỗi game một kiểu và
// không game nào cho người chơi biết mình đang ở đâu. Giờ tất cả đọc chung
// `levelFor()` + `ramp()`, và HUD hiển thị đúng cấp đó.

// Mỗi game: `step` = số điểm để lên 1 cấp, `max` = cấp trần (độ khó bão hoà).
// Cân theo thang điểm MỚI của từng game (xem chú thích ở mỗi file game).
const CURVES = {
  snake:     { step: 60,   max: 12 },
  flappy:    { step: 55,   max: 12 },
  tetris:    { step: 1500, max: 15 },
  survivor:  { step: 900,  max: 15 },
  "2048":    { step: 1400, max: 10 },
  wordguess: { step: 150,  max: 8 },
  caro:      { step: 40,   max: 5 },
};

const DEFAULT_CURVE = { step: 500, max: 10 };

const curveOf = (gameId) => CURVES[gameId] || DEFAULT_CURVE;

/** Cấp độ hiện tại (bắt đầu từ 1) suy ra từ điểm — không cần state riêng. */
export function levelFor(gameId, score) {
  const { step, max } = curveOf(gameId);
  return Math.min(max, 1 + Math.floor(Math.max(0, score) / step));
}

/** Tiến độ 0→1 tới cấp kế tiếp; đạt trần thì luôn 1 (thanh HUD đầy). */
export function levelProgress(gameId, score) {
  const { step, max } = curveOf(gameId);
  if (levelFor(gameId, score) >= max) return 1;
  return (Math.max(0, score) % step) / step;
}

export const maxLevel = (gameId) => curveOf(gameId).max;

/**
 * Nội suy tuyến tính một tham số theo cấp độ: cấp 1 → `from`, cấp trần → `to`.
 * Dùng cho tốc độ rơi, khoảng hở ống, nhịp sinh quái… mọi thứ cần khó dần.
 */
export function ramp(gameId, level, from, to) {
  const max = curveOf(gameId).max;
  if (max <= 1) return to;
  const t = Math.min(1, Math.max(0, (level - 1) / (max - 1)));
  return from + (to - from) * t;
}

/**
 * Chuỗi combo theo thời gian: ăn/ghi điểm liên tiếp trong `windowMs` thì hệ số
 * nhân tăng dần, dừng tay là mất. Đây là phần "kỹ năng" của cách tính điểm —
 * cùng số lần ghi điểm nhưng chơi dồn dập sẽ hơn điểm chơi rời rạc.
 */
export function createCombo({ windowMs = 2600, step = 0.25, max = 3 } = {}) {
  let chain = 0;
  let last = -Infinity;
  return {
    get chain() { return chain; },
    get mult() { return Math.min(max, 1 + chain * step); },
    /** Ghi một nhịp combo, trả về hệ số nhân áp dụng NGAY cho nhịp này. */
    hit(now = performance.now()) {
      // `last === -Infinity` phải tính là "chưa có nhịp nào" — nếu chỉ so
      // `now - last <= windowMs` thì với windowMs = Infinity nhịp đầu tiên đã
      // tự cộng chuỗi (Infinity <= Infinity).
      chain = last !== -Infinity && now - last <= windowMs ? chain + 1 : 0;
      last = now;
      return Math.min(max, 1 + chain * step);
    },
    /** Gọi mỗi khung hình để chuỗi tự rơi khi người chơi ngừng ghi điểm. */
    tick(now = performance.now()) {
      if (chain > 0 && now - last > windowMs) { chain = 0; last = -Infinity; }
    },
    reset() { chain = 0; last = -Infinity; },
  };
}

// ── Chữ điểm bay lên (canvas) ─────────────────────────────────────
// Người chơi phải THẤY điểm mình vừa ăn được là bao nhiêu, nếu không thì
// combo/hệ số nhân chỉ là con số vô hình trong code.

export function pushPopup(list, x, y, text, color, size = 15) {
  list.push({ x, y, text, color, size, life: 1, vy: -0.85 });
}

export function updatePopups(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.y += p.vy;
    p.vy *= 0.97;
    p.life -= 0.018;
    if (p.life <= 0) list.splice(i, 1);
  }
}

export function drawPopups(ctx, list) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const p of list) {
    const eased = p.life > 0.85 ? (1 - p.life) / 0.15 : 1; // bung ra lúc mới hiện
    ctx.globalAlpha = Math.min(1, p.life * 1.6);
    ctx.font = `900 ${p.size * (0.7 + eased * 0.3)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export default { levelFor, levelProgress, ramp, createCombo, maxLevel };
