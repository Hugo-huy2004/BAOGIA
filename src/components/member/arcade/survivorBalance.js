export const SURVIVOR_MAX_HP = 5;

export const SURVIVOR_POWERUPS = {
  repair: { color: "#4ade80", label: "HP", symbol: "+" },
  shield: { color: "#38bdf8", label: "SHD", symbol: "◇" },
  core: { color: "#ffc73a", label: "PWR", symbol: "◆" },
  overdrive: { color: "#c084fc", label: "OD", symbol: "✦" },
  rapid: { color: "#fb7185", label: "RPD", symbol: "»" },
};

export function chooseSurvivorDrop({ hp, maxHp = SURVIVOR_MAX_HP, weapon = 1 }, randomValue = Math.random()) {
  const roll = Math.max(0, Math.min(0.9999, randomValue));

  // Khi sắp hết máu, phần lớn hòm tiếp tế là hồi phục hoặc khiên. Đây là
  // cơ chế chống chuỗi thua do RNG, nhưng vẫn giữ một phần vật phẩm tấn công.
  if (hp <= Math.max(2, Math.floor(maxHp * 0.4))) {
    if (roll < 0.5) return "repair";
    if (roll < 0.72) return "shield";
    if (roll < 0.84) return "overdrive";
    if (roll < 0.93) return "rapid";
    return "core";
  }

  if (weapon < 3) {
    if (roll < 0.24) return "repair";
    if (roll < 0.43) return "shield";
    if (roll < 0.68) return "core";
    if (roll < 0.86) return "overdrive";
    return "rapid";
  }

  if (roll < 0.28) return "repair";
  if (roll < 0.5) return "shield";
  if (roll < 0.68) return "core";
  if (roll < 0.86) return "overdrive";
  return "rapid";
}

export const survivorDropChance = (hp, maxHp = SURVIVOR_MAX_HP) => (
  hp <= Math.max(2, Math.floor(maxHp * 0.4)) ? 0.48 : 0.3
);
