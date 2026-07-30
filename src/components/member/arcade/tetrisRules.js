export const LINES_PER_STAGE = 10;

export const tetrisStageForLines = (lines = 0) => (
  Math.floor(Math.max(0, lines) / LINES_PER_STAGE) + 1
);

export function tetrisLineScore({
  cleared,
  level = 1,
  multiplier = 1,
  backToBack = false,
  perfectClear = false,
}) {
  const base = [0, 100, 300, 500, 800][cleared] || 1000;
  const safeLevel = Math.max(1, level);
  const levelBonus = 1 + (safeLevel - 1) * 0.15;
  const b2bBonus = cleared === 4 && backToBack ? 1.5 : 1;
  const clearBonus = perfectClear ? 2000 * safeLevel : 0;
  return Math.round(base * levelBonus * multiplier * b2bBonus) + clearBonus;
}
