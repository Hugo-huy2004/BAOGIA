/**
 * HugoArcade JOY Calculation — per-game tiered formulas.
 *
 * Each game has its own scoring curve, so a flat rate × score doesn't work.
 * Instead, each game defines score→JOY tiers:
 *   [threshold, baseJoy, perPoint]
 *
 * joy = baseJoy + floor((score - threshold) × perPoint)
 *
 * Minimum 1 JOY for any game (even score 0 on crash).
 */

// ─── Per-game tiered formulas ─────────────────────────────────────
// [scoreThreshold, baseJoy, joyPerPointAboveThreshold]
// Tiers must be sorted ascending by threshold.
// Each tier's baseJoy should be ≥ previous tier's max to avoid dips.
//
// 2026-07-27 — cách tính điểm trong game đổi (combo, hệ số nhân, thưởng cấp),
// nên cùng một trình độ chơi giờ ra con số điểm lớn hơn trước. Các mốc dưới đây
// đã được NHÂN theo đúng hệ số lạm phát của từng game (và perPoint chia lại),
// nên JOY nhận được cho cùng một màn chơi vẫn y như cũ — chỉ con số điểm to lên.
// Hệ số: snake ×6, survivor ×3, 2048 ×2.
const JOY_TIERS = {
  snake: [
    [0,    2,  0.0833333],  // ~0-10 mồi cũ:    2-7 JOY
    [60,   7,  0.0583333],
    [240, 17,  0.0333333],
    [600, 29,  0.0200],
    [1200,41,  0.0133333],
  ],
  survivor: [
    [0,     1,  0.00150],
    [600,   2,  0.00100],
    [3000,  5,  0.00050],
    [9000,  8,  0.00030],
  ],
  "2048": [
    [0,     5.5,  0.0055],
    [1000,  11,   0.0055],
    [2000,  16.5, 0.0055],
    [4000,  27.5, 0.0055],
  ],
  caro: [
    [0,   2,  0.40],   // 0-15 pts:    2-8 JOY
    [15,  8,  0.25],   // 15-50 pts:   8-17 JOY
    [50, 17,  0.20],   // 50-120 pts:  17-31 JOY
    [120,31,  0.12],   // 120+ pts:    31+ JOY
  ],
  chess: [
    [0,   2,  0.03],   // 0-100 pts:    2-5 JOY
    [100, 5,  0.015],  // 100-500 pts:  5-11 JOY
    [500,11,  0.008],  // 500-2000:     11-23 JOY
    [2000,23, 0.004],  // 2000+ pts:    23+ JOY
  ],
};

/**
 * Calculate JOY earned from a game score using per-game tiered formula.
 * @param {string} game  - game id
 * @param {number} score - integer score
 * @returns {number} JOY earned (minimum 1)
 */
export function calcJoy(game, score) {
  const tiers = JOY_TIERS[game];
  if (!tiers) return Math.max(1, Math.floor(score * 0.01));

  // Find the highest tier whose threshold ≤ score
  let baseJoy = 1;
  let perPoint = 0;
  let threshold = 0;

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (score >= tiers[i][0]) {
      threshold = tiers[i][0];
      baseJoy = tiers[i][1];
      perPoint = tiers[i][2];
      break;
    }
  }

  return Math.max(1, Math.floor(baseJoy + (score - threshold) * perPoint));
}

/**
 * Get human-readable formula description for a game.
 * @param {string} game
 * @returns {{ tiers: Array, description: string }}
 */
export function getJoyFormula(game) {
  const tiers = JOY_TIERS[game];
  if (!tiers) return { tiers: [], description: "1% điểm" };

  const lines = tiers.map(([threshold, base, per]) => {
    if (threshold === 0) return `Đầu: ${per} JOY/điểm`;
    return `Từ ${threshold}: +${base} JOY + ${per}/điểm`;
  });

  return { tiers, description: lines.join(" → ") };
}

/** All supported game ids */
export const ARCADE_GAMES = Object.keys(JOY_TIERS);

export default JOY_TIERS;
