// ─── 2048 Mega Fusion Core Game Logic & Audio Synthesizers ───────────────────
// Độc lập, không side-effects, 100% pure functions và Web Audio chuẩn xác.

export const JELLY_UNLOCK_BONUSES = {
  1: 5,   2: 10,  3: 15,  4: 20,  5: 30,  6: 40,  7: 50,  8: 75,
  9: 100, 10: 150, 11: 250, 12: 350, 13: 500, 14: 750,
  15: 1000, 16: 1500, 17: 2000, 18: 3000, 19: 4000, 20: 5000,
};

export const BOT_TIERS = {
  1: {
    level: 1,
    name: "Bé Giọt Nước",
    value: 2,
    unlockJoy: 5,
    type: "puddle",
    color: "#10f5a0",
    face: "mouth",
    state: "default",
    shading: "fabric",
    bgClass: "from-emerald-950/85 via-emerald-900/50 to-slate-950 border-emerald-400/50",
    glowClass: "shadow-md shadow-emerald-500/30",
  },
  2: {
    level: 2,
    name: "Bé Giọt Sương",
    value: 4,
    unlockJoy: 10,
    type: "drop",
    color: "#00e5ff",
    face: "mouth",
    state: "default",
    shading: "fabric",
    bgClass: "from-cyan-950/85 via-sky-900/50 to-slate-950 border-cyan-400/50",
    glowClass: "shadow-md shadow-cyan-500/30",
  },
  3: {
    level: 3,
    name: "Bé Thạch Tím",
    value: 8,
    unlockJoy: 15,
    type: "pebble",
    color: "#a855f7",
    face: "mouth",
    state: "default",
    shading: "fabric",
    bgClass: "from-purple-950/85 via-indigo-900/50 to-slate-950 border-purple-400/50",
    glowClass: "shadow-md shadow-purple-500/30",
  },
  4: {
    level: 4,
    name: "Bé Mây Bông",
    value: 16,
    unlockJoy: 20,
    type: "cloud",
    color: "#38bdf8",
    face: "mouth",
    state: "default",
    shading: "fabric",
    bgClass: "from-sky-950/85 via-blue-900/50 to-slate-950 border-sky-400/50",
    glowClass: "shadow-md shadow-sky-500/30",
  },
  5: {
    level: 5,
    name: "Cỏ 4 Lá May Mắn",
    value: 32,
    unlockJoy: 30,
    type: "clover",
    color: "#22ff77",
    face: "mouth",
    state: "working",
    shading: "fabric",
    hat: "beanie",
    bgClass: "from-green-950/90 via-emerald-900/60 to-slate-950 border-green-400/70",
    glowClass: "shadow-md shadow-green-500/35",
  },
  6: {
    level: 6,
    name: "Bé Tròn Xoe",
    value: 64,
    unlockJoy: 40,
    type: "circle",
    color: "#e040fb",
    face: "mouth",
    state: "default",
    shading: "fabric",
    glasses: "round",
    bgClass: "from-fuchsia-950/90 via-purple-900/60 to-slate-950 border-fuchsia-400/70",
    glowClass: "shadow-md shadow-fuchsia-500/35",
  },
  7: {
    level: 7,
    name: "Hoa Kẹo Ngọt",
    value: 128,
    unlockJoy: 50,
    type: "flower",
    color: "#ff2a55",
    face: "mouth",
    state: "working",
    shading: "fabric",
    hat: "party",
    bgClass: "from-rose-950/90 via-pink-900/60 to-slate-950 border-rose-400/70",
    glowClass: "shadow-md shadow-rose-500/35",
  },
  8: {
    level: 8,
    name: "Bé Ma Tinh Nghịch",
    value: 256,
    unlockJoy: 75,
    type: "ghost",
    color: "#ffffff",
    face: "mouth",
    state: "default",
    shading: "fabric",
    glasses: "shades",
    bgClass: "from-slate-900 via-cyan-950/70 to-slate-950 border-cyan-300/80",
    glowClass: "shadow-md shadow-cyan-400/35",
  },
  9: {
    level: 9,
    name: "Viên Năng Lượng",
    value: 512,
    unlockJoy: 100,
    type: "pill",
    color: "#0077ff",
    face: "mouth",
    state: "default",
    shading: "plastic",
    headphones: true,
    bgClass: "from-blue-950 via-indigo-900/70 to-slate-950 border-blue-400/80",
    glowClass: "shadow-md shadow-blue-500/35",
  },
  10: {
    level: 10,
    name: "Bé Mèo Cà Rốt",
    value: 1024,
    unlockJoy: 150,
    type: "cat",
    color: "#ff6a00",
    face: "mouth",
    state: "working",
    shading: "plastic",
    glasses: "square",
    bgClass: "from-amber-950 via-orange-900/70 to-slate-950 border-amber-400/80",
    glowClass: "shadow-md shadow-amber-500/40",
  },
  11: {
    level: 11,
    name: "Ngôi Sao Vàng 2048",
    value: 2048,
    unlockJoy: 250,
    type: "star",
    color: "#ffd700",
    face: "mouth",
    state: "working",
    shading: "plastic",
    bowTie: true,
    bgClass: "from-yellow-950 via-amber-900/70 to-slate-950 border-yellow-300",
    glowClass: "shadow-md shadow-yellow-500/40",
  },
  12: {
    level: 12,
    name: "Lục Giác Điện Tử",
    value: 4096,
    unlockJoy: 350,
    type: "hexagon",
    color: "#eaff00",
    face: "mouth",
    state: "working",
    shading: "plastic",
    headphones: true,
    bgClass: "from-lime-950 via-yellow-950/70 to-slate-950 border-lime-300",
    glowClass: "shadow-md shadow-lime-500/40",
  },
  13: {
    level: 13,
    name: "Tam Giác Neon",
    value: 8192,
    unlockJoy: 500,
    type: "triangle",
    color: "#ff0077",
    face: "mouth",
    state: "working",
    shading: "plastic",
    glasses: "shades",
    bgClass: "from-pink-950 via-fuchsia-950/80 to-slate-950 border-pink-400",
    glowClass: "shadow-md shadow-pink-500/40",
  },
  14: {
    level: 14,
    name: "Droid Thám Hiểm",
    value: 16384,
    unlockJoy: 750,
    type: "droid",
    color: "#00ff66",
    face: "mouth",
    state: "working",
    shading: "plastic",
    hat: "beret",
    bgClass: "from-emerald-950 via-green-950/80 to-slate-950 border-emerald-400",
    glowClass: "shadow-md shadow-emerald-500/40",
  },
  15: {
    level: 15,
    name: "Alien Biển Sâu",
    value: 32768,
    unlockJoy: 1000,
    type: "alien",
    color: "#00f5c4",
    face: "mouth",
    state: "working",
    shading: "plastic",
    glasses: "round",
    bgClass: "from-teal-950 via-emerald-950/80 to-slate-950 border-teal-300",
    glowClass: "shadow-md shadow-teal-500/45",
  },
  16: {
    level: 16,
    name: "Robot Chiến Binh",
    value: 65536,
    unlockJoy: 1500,
    type: "mech",
    color: "#00e1ff",
    face: "mouth",
    state: "working",
    shading: "plastic",
    glasses: "shades",
    bgClass: "from-cyan-950 via-blue-950/80 to-slate-950 border-cyan-300",
    glowClass: "shadow-md shadow-cyan-500/45",
  },
  17: {
    level: 17,
    name: "Vua Mèo Hoàng Gia",
    value: 131072,
    unlockJoy: 2000,
    type: "cat",
    color: "#ffaa00",
    face: "mouth",
    state: "working",
    shading: "plastic",
    hat: "crown",
    bowTie: true,
    bgClass: "from-amber-950 via-yellow-950 to-slate-950 border-2 border-amber-300",
    glowClass: "shadow-md shadow-amber-500/50",
  },
  18: {
    level: 18,
    name: "Đại Đế Tinh Cầu",
    value: 262144,
    unlockJoy: 3000,
    type: "star",
    color: "#bb00ff",
    face: "mouth",
    state: "working",
    shading: "plastic",
    hat: "crown",
    glasses: "shades",
    bgClass: "from-purple-950 via-fuchsia-950 to-slate-950 border-2 border-purple-300",
    glowClass: "shadow-md shadow-purple-500/50",
  },
  19: {
    level: 19,
    name: "Chúa Tể Cơ Khí",
    value: 524288,
    unlockJoy: 4000,
    type: "mech",
    color: "#ff003c",
    face: "mouth",
    state: "working",
    shading: "plastic",
    hat: "crown",
    headphones: true,
    bgClass: "from-rose-950 via-red-950 to-slate-950 border-2 border-rose-400",
    glowClass: "shadow-md shadow-rose-500/50",
  },
  20: {
    level: 20,
    name: "Vị Thần Vũ Trụ",
    value: 1048576,
    unlockJoy: 5000,
    type: "alien",
    color: "#ff0099",
    face: "mouth",
    state: "working",
    shading: "plastic",
    hat: "crown",
    glasses: "shades",
    headphones: true,
    bowTie: true,
    bgClass: "from-fuchsia-950 via-purple-950 to-slate-950 border-2 border-amber-300",
    glowClass: "shadow-lg shadow-fuchsia-500/60",
  },
};

export const GRID_SIZE = 4;
let tileSeq = 0;

export const createTile = (level, extra = {}) => ({
  id: `bot-${++tileSeq}-${Date.now()}`,
  level: Math.min(20, Math.max(1, level)),
  ...extra,
});

export const createIceTile = (turns = 4, extra = {}) => ({
  id: `ice-${++tileSeq}-${Date.now()}`,
  type: "ice",
  level: 1,
  turnsLeft: turns,
  ...extra,
});

export function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

export function cloneGrid(grid) {
  return grid.map((row) => row.map((tile) => (tile ? { ...tile } : null)));
}

export function emptyCells(grid) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

export function addRandomBotTile(grid) {
  const next = cloneGrid(grid);
  const empty = emptyCells(next);
  if (!empty.length) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const level = Math.random() < 0.12 ? 2 : 1;
  next[r][c] = createTile(level, { isNew: true });
  return next;
}

export function createInitialGrid() {
  return addRandomBotTile(addRandomBotTile(emptyGrid()));
}

// Điểm thưởng hợp thể
export function getBotMergePoints(level, isTriple = false) {
  const BASE_SCORES = {
    2: 10,
    3: 20,
    4: 40,
    5: 80,
    6: 150,
    7: 250,
    8: 400,
    9: 600,
    10: 900,
    11: 1300,
    12: 1800,
    13: 2500,
    14: 3500,
    15: 5000,
    16: 7000,
    17: 10000,
    18: 14000,
    19: 19000,
    20: 25000,
  };
  const base = BASE_SCORES[level] || (level * 100);
  return isTriple ? Math.round(base * 1.5) : base;
}

// Slide line
export function slideLine(line) {
  const tiles = line.filter((t) => t !== null);
  const out = [];
  let i = 0;
  let gained = 0;
  let triple = false;
  let merges = 0;

  while (i < tiles.length) {
    const cur = tiles[i];
    const n1 = tiles[i + 1];
    const n2 = tiles[i + 2];

    if (cur.type === "ice") {
      out.push({ ...cur, isNew: false });
      i += 1;
      continue;
    }

    if (n1 && n2 && n1.type !== "ice" && n2.type !== "ice" && cur.level === n1.level && cur.level === n2.level) {
      const newLvl = Math.min(20, cur.level + 1);
      out.push(createTile(newLvl, { isTriple: true, isMerged: true }));
      gained += getBotMergePoints(newLvl, true);
      triple = true;
      merges += 2;
      i += 3;
    } else if (n1 && n1.type !== "ice" && cur.level === n1.level) {
      const newLvl = Math.min(20, cur.level + 1);
      out.push(createTile(newLvl, { isMerged: true }));
      gained += getBotMergePoints(newLvl, false);
      merges += 1;
      i += 2;
    } else {
      out.push({ ...cur, isNew: false, isMerged: false, isTriple: false });
      i += 1;
    }
  }

  while (out.length < GRID_SIZE) out.push(null);
  return { out, gained, triple, merges };
}

export function moveGrid(grid, direction) {
  let moved = false;
  let gained = 0;
  let merges = 0;
  let tripleBonus = false;
  const mergedPositions = [];

  const nextGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  for (let idx = 0; idx < GRID_SIZE; idx++) {
    let line = [];
    if (direction === "left") {
      line = [grid[idx][0], grid[idx][1], grid[idx][2], grid[idx][3]];
    } else if (direction === "right") {
      line = [grid[idx][3], grid[idx][2], grid[idx][1], grid[idx][0]];
    } else if (direction === "up") {
      line = [grid[0][idx], grid[1][idx], grid[2][idx], grid[3][idx]];
    } else if (direction === "down") {
      line = [grid[3][idx], grid[2][idx], grid[1][idx], grid[0][idx]];
    }

    const { out, gained: lineGained, triple: lineTriple, merges: lineMerges } = slideLine(line);
    gained += lineGained;
    merges += lineMerges;
    if (lineTriple) tripleBonus = true;

    for (let i = 0; i < GRID_SIZE; i++) {
      const orig = line[i];
      const res = out[i];
      if (orig !== res) {
        if (!orig || !res || orig.id !== res.id || orig.level !== res.level || orig.type !== res.type) {
          moved = true;
        }
      }

      if (res && res.isMerged) {
        let actualR = idx;
        let actualC = i;
        if (direction === "right") {
          actualC = 3 - i;
        } else if (direction === "up") {
          actualR = i;
          actualC = idx;
        } else if (direction === "down") {
          actualR = 3 - i;
          actualC = idx;
        }
        mergedPositions.push({
          r: actualR,
          c: actualC,
          level: res.level,
          isTriple: !!res.isTriple,
        });
      }
    }

    if (direction === "left") {
      for (let c = 0; c < GRID_SIZE; c++) nextGrid[idx][c] = out[c];
    } else if (direction === "right") {
      for (let c = 0; c < GRID_SIZE; c++) nextGrid[idx][3 - c] = out[c];
    } else if (direction === "up") {
      for (let r = 0; r < GRID_SIZE; r++) nextGrid[r][idx] = out[r];
    } else if (direction === "down") {
      for (let r = 0; r < GRID_SIZE; r++) nextGrid[3 - r][idx] = out[r];
    }
  }

  return { nextGrid, moved, gained, merges, tripleBonus, mergedPositions };
}

export function checkHasValidMoves(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) return true;
      if (grid[r][c].type === "ice") return true;
      const curLvl = grid[r][c].level;
      if (c < GRID_SIZE - 1 && grid[r][c + 1] && grid[r][c + 1].type !== "ice" && grid[r][c + 1].level === curLvl) return true;
      if (r < GRID_SIZE - 1 && grid[r + 1][c] && grid[r + 1][c].type !== "ice" && grid[r + 1][c].level === curLvl) return true;
    }
  }
  return false;
}

// ── ÂM THANH WEB AUDIO SYNTHESIS CHO 2048 ─────────────────────────────────────
let audioCtxCache = null;
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtxCache) audioCtxCache = new AudioCtx();
  if (audioCtxCache.state === "suspended") audioCtxCache.resume().catch(() => {});
  return audioCtxCache;
}

export function playBotFusionSound(level = 1, isTriple = false) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (isTriple) {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const start = now + idx * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.33);
      });
    } else {
      const baseFreq = Math.min(840, 360 + level * 24);
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 1 ? "triangle" : "sine";
        const start = now + idx * 0.035;
        osc.frequency.setValueAtTime(freq * 0.92, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, start + 0.07);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    }
  } catch { /* ignore */ }
}

export function playIceFreezeSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch { /* ignore */ }
}

export function playIceCrackSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch { /* ignore */ }
}

export function playIceMeltSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [783.99, 987.77, 1174.66, 1567.98, 2349.32];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch { /* ignore */ }
}

export function playStoneShatterSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const crunchOsc = ctx.createOscillator();
    const crunchGain = ctx.createGain();
    crunchOsc.type = "sawtooth";
    crunchOsc.frequency.setValueAtTime(240, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    crunchGain.gain.setValueAtTime(0.2, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    crunchOsc.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.3);
  } catch { /* ignore */ }
}

export function playVaultUnlockSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  } catch { /* ignore */ }
}

export function playCalmHammerSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = "sine";
    woodOsc.frequency.setValueAtTime(155, now);
    woodOsc.frequency.exponentialRampToValueAtTime(75, now + 0.16);
    woodGain.gain.setValueAtTime(0.25, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.2);

    const softChime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    softChime.type = "sine";
    softChime.frequency.setValueAtTime(440, now + 0.06);
    softChime.frequency.exponentialRampToValueAtTime(660, now + 0.32);
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.07, now + 0.1);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    softChime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    softChime.start(now + 0.06);
    softChime.stop(now + 0.38);
  } catch { /* ignore */ }
}
