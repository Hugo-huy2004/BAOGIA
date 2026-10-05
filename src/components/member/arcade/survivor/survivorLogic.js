// ── Pure Logic & Data Models for Space Wars 3D (Chiến Tranh Vũ Trụ 3D) ────────

export const SURVIVOR_MAX_HP = 5;
export const MAX_WEAPON_LEVEL = 5;

export const WEAPON_TIERS = {
  1: {
    level: 1,
    nameVi: "Nòng Laser Song Đôi",
    nameEn: "Dual Pulse Lasers",
    descVi: "2 tia laser năng lượng xanh gắn trước mũi tiêm kích",
    cooldownMs: 180,
    barrels: 2,
    damage: 1,
    laserColor: "#00f0ff",
  },
  2: {
    level: 2,
    nameVi: "Tứ Nòng Cánh S-Foil",
    nameEn: "Quad Wingtip Cannons",
    descVi: "4 nòng laser gắn đầu cánh quét diện rộng",
    cooldownMs: 150,
    barrels: 4,
    damage: 1.25,
    laserColor: "#38bdf8",
  },
  3: {
    level: 3,
    nameVi: "Ngư Lôi Ion & Plasma",
    nameEn: "Ion Plasma Torpedoes",
    descVi: "Gắn thêm ống phóng ngư lôi tự tìm mục tiêu địch",
    cooldownMs: 135,
    barrels: 6,
    damage: 1.6,
    hasTorpedo: true,
    laserColor: "#f59e0b",
  },
  4: {
    level: 4,
    nameVi: "Tháp Pháo Ray Tachyon",
    nameEn: "Tachyon Rail-Turret",
    descVi: "Tháp pháo lưng phóng tia laser xuyên thấu giáp",
    cooldownMs: 110,
    barrels: 8,
    damage: 2.2,
    hasTorpedo: true,
    laserColor: "#c084fc",
  },
  5: {
    level: 5,
    nameVi: "Lõi Lượng Tử Tối Thượng",
    nameEn: "Quantum Overdrive Core",
    descVi: "Sức mạnh tối tân bảo vệ hòa bình vũ trụ",
    cooldownMs: 90,
    barrels: 10,
    damage: 3.0,
    hasTorpedo: true,
    laserColor: "#fbbf24",
  },
};

export const ENEMY_ARCHETYPES = {
  tie: {
    type: "tie",
    nameVi: "Tiêm Kích Hắc Ám (TIE)",
    hp: 1,
    speed: 24,
    score: 100,
    fireRateMs: 1400,
    radius: 1.2,
  },
  pod: {
    type: "pod",
    nameVi: "Tàu Đua Plasma Hỗn Loạn",
    hp: 2,
    speed: 34,
    score: 160,
    fireRateMs: 1100,
    radius: 1.4,
  },
  heavy: {
    type: "heavy",
    nameVi: "Chiến Hạm Xuyên Không",
    hp: 5,
    speed: 16,
    score: 300,
    fireRateMs: 850,
    radius: 2.2,
  },
};

export const BOSS_ARCHETYPES = [
  {
    id: "hyperspace_ring",
    nameVi: "Thống Soái Vòng Xuyên Không",
    nameEn: "Hyperspace Ring Dreadnought",
    maxHp: 65,
    score: 3000,
    radius: 4.2,
  },
  {
    id: "tachyon_overlord",
    nameVi: "Bá Chủ Hố Đen Lượng Tử",
    nameEn: "Quantum Void Overlord",
    maxHp: 95,
    score: 5000,
    radius: 4.6,
  },
];

export const POWERUP_TYPES = {
  core: { type: "core", label: "LÕI NÂNG CẤP LASER", color: "#facc15", symbol: "⚡" },
  shield: { type: "shield", label: "KHIÊN NĂNG LƯỢNG", color: "#38bdf8", symbol: "🛡️" },
  overdrive: { type: "overdrive", label: "NẠP SIÊU LASER", color: "#c084fc", symbol: "✦" },
  repair: { type: "repair", label: "HỒI PHỤC THÂN TÀU", color: "#4ade80", symbol: "✚" },
};

export function choosePowerupDrop(currentHp, currentWeapon) {
  const roll = Math.random();
  if (currentHp <= 2) {
    if (roll < 0.45) return "repair";
    if (roll < 0.75) return "shield";
    return "core";
  }
  if (currentWeapon < 3) {
    if (roll < 0.5) return "core";
    if (roll < 0.75) return "overdrive";
    return "shield";
  }
  if (roll < 0.35) return "core";
  if (roll < 0.65) return "overdrive";
  if (roll < 0.85) return "shield";
  return "repair";
}

// ── CẤU HÌNH TIẾN TRÌNH THEO CHẶNG (STAGE SYSTEM: N * X TÀU LÍNH, BOSS MÁU GẤP X) ──
export const BASE_MINIONS_PER_STAGE = 8; // Chặng 1: N = 8 tàu nhỏ
export const BASE_BOSS_HP = 60; // Chặng 1: Máu Boss = 60 HP

export function getStageConfig(stage) {
  const currentStage = Math.max(1, stage || 1);
  // chặng x: n lần của x đó
  const totalMinions = BASE_MINIONS_PER_STAGE * currentStage;
  // Số lượng quái duy trì đồng thời trên màn hình (để chiến trường luôn sôi động, không bao giờ trống trơn)
  const maxActive = Math.min(6, 3 + Math.floor(currentStage * 0.5));
  // tàu boss máu gấp x
  const bossHp = BASE_BOSS_HP * currentStage;

  return {
    stage: currentStage,
    totalMinions,
    maxActive,
    bossHp,
  };
}

export function createStageMinion(stage, index) {
  const s = Math.max(1, stage || 1);
  // Càng chơi lâu càng khó: Tỉ lệ tàu Pod nhanh nhẹn và tàu Heavy chiến hạm tăng theo chặng
  let archetype = ENEMY_ARCHETYPES.tie;
  if (s >= 3) {
    const roll = Math.random();
    if (roll < 0.25) {
      archetype = ENEMY_ARCHETYPES.heavy;
    } else if (roll < 0.6) {
      archetype = ENEMY_ARCHETYPES.pod;
    }
  } else if (s >= 2) {
    if (Math.random() < 0.35) {
      archetype = ENEMY_ARCHETYPES.pod;
    }
  }

  // Tốc độ tăng theo chặng (tối đa 1.45x)
  const speedMult = 1 + Math.min(0.45, (s - 1) * 0.05);
  // Nhịp bắn nhanh dần theo chặng
  const fireRateMult = Math.max(0.45, 1 - (s - 1) * 0.04);
  // Máu lính tăng nhẹ ở chặng cao
  const extraHp = Math.floor((s - 1) / 3);

  const x = (Math.random() - 0.5) * 22;
  const z = -62 - Math.random() * 22;

  return {
    id: `minion-${s}-${index}-${Date.now()}-${Math.random()}`,
    archetype: {
      ...archetype,
      speed: archetype.speed * speedMult,
      fireRateMs: Math.max(380, archetype.fireRateMs * fireRateMult),
    },
    hp: archetype.hp + extraHp,
    maxHp: archetype.hp + extraHp,
    x,
    y: 0,
    z,
    targetX: x,
    targetZ: z + 80,
    lastShotTime: Date.now() + Math.random() * 800,
    hitFlashUntil: 0,
  };
}

export function createStageBoss(stage) {
  const s = Math.max(1, stage || 1);
  const bossIndex = (s - 1) % BOSS_ARCHETYPES.length;
  const template = BOSS_ARCHETYPES[bossIndex];
  // Tàu boss máu gấp x (Chặng 1 = 60, Chặng 2 = 120, Chặng 3 = 180...)
  const bossHp = BASE_BOSS_HP * s;
  // Nhịp bắn của Boss tăng tốc dần theo chặng
  const fireRateMs = Math.max(450, 1400 - (s - 1) * 85);
  // Điểm thưởng tăng mạnh
  const score = 2000 + s * 1200;

  return {
    ...template,
    hp: bossHp,
    maxHp: bossHp,
    stage: s,
    score,
    x: 0,
    y: 0,
    z: -70,
    targetZ: -28,
    angle: 0,
    lastShotTime: Date.now() + 1000,
    fireRateMs,
  };
}

// Fallback tương thích cho wave cũ
export function generateWaveEnemies(waveNumber) {
  const cfg = getStageConfig(waveNumber);
  const enemies = [];
  for (let i = 0; i < cfg.totalMinions; i++) {
    enemies.push(createStageMinion(waveNumber, i));
  }
  return { isBoss: false, enemies, totalCount: cfg.totalMinions };
}
