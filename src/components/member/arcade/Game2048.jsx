import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BotAvatar } from "bot-avatars";
import confetti from "canvas-confetti";
import {
  playGameMove,
  playGameLose,
} from "../../../utils/audio";
import {
  hapticMove,
  hapticMerge,
  hapticLose,
} from "../../../utils/haptics";
import { createCombo } from "./arcadeProgression";
import { useJoyStore } from "../../../stores/joyStore";
import {
  buyHammer2048,
  unlockCharacter2048,
  fetchCollection2048,
  fetchCollectionLeaderboard2048,
} from "../../../services/api/modules/arcadeApi";
import { notify } from "../../../lib/notify";


// ── 20 CẤP ĐỘ NHÂN VẬT BOT-AVATARS (LEVEL 1 → 20) ───────────────────────────
const JELLY_UNLOCK_BONUSES = {
  1: 5,   2: 10,  3: 15,  4: 20,  5: 30,  6: 40,  7: 50,  8: 75,
  9: 100, 10: 150, 11: 250, 12: 350, 13: 500, 14: 750,
  15: 1000, 16: 1500, 17: 2000, 18: 3000, 19: 4000, 20: 5000,
};

const BOT_TIERS = {
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
    glowClass: "shadow-[0_0_14px_rgba(16,245,160,0.45)]",
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
    glowClass: "shadow-[0_0_15px_rgba(0,229,255,0.45)]",
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
    glowClass: "shadow-[0_0_16px_rgba(168,85,247,0.5)]",
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
    glowClass: "shadow-[0_0_16px_rgba(56,189,248,0.5)]",
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
    glowClass: "shadow-[0_0_20px_rgba(34,255,119,0.55)] ring-1 ring-green-400/50",
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
    glowClass: "shadow-[0_0_20px_rgba(224,64,251,0.55)] ring-1 ring-fuchsia-400/50",
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
    glowClass: "shadow-[0_0_22px_rgba(255,42,85,0.6)] ring-1 ring-rose-400/50",
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
    glowClass: "shadow-[0_0_24px_rgba(103,232,249,0.7)] ring-1 ring-cyan-300/60",
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
    glowClass: "shadow-[0_0_26px_rgba(0,119,255,0.7)] ring-1 ring-blue-400/60",
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
    glowClass: "shadow-[0_0_28px_rgba(255,106,0,0.75)] ring-2 ring-amber-400/70",
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
    glowClass: "shadow-[0_0_30px_rgba(255,215,0,0.8)] ring-2 ring-yellow-400/80",
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
    glowClass: "shadow-[0_0_32px_rgba(234,255,0,0.85)] ring-2 ring-lime-300/80",
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
    glowClass: "shadow-[0_0_34px_rgba(255,0,119,0.9)] ring-2 ring-pink-400",
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
    glowClass: "shadow-[0_0_36px_rgba(0,255,102,0.9)] ring-2 ring-emerald-400",
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
    glowClass: "shadow-[0_0_38px_rgba(0,245,196,0.95)] ring-2 ring-teal-300",
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
    glowClass: "shadow-[0_0_40px_rgba(0,225,255,1)] ring-2 ring-cyan-300",
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
    glowClass: "shadow-[0_0_44px_rgba(255,170,0,1)] ring-2 ring-amber-300",
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
    glowClass: "shadow-[0_0_48px_rgba(187,0,255,1)] ring-2 ring-purple-300",
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
    glowClass: "shadow-[0_0_52px_rgba(255,0,60,1)] ring-2 ring-rose-300",
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
    bgClass: "from-fuchsia-950 via-purple-950 to-slate-950 border-2 border-amber-300 animate-pulse",
    glowClass: "shadow-[0_0_60px_rgba(255,0,153,1)] ring-4 ring-amber-300",
  },
};

const GRID_SIZE = 4;
let tileSeq = 0;
const createTile = (level, extra = {}) => ({
  id: `bot-${++tileSeq}-${Date.now()}`,
  level: Math.min(20, Math.max(1, level)),
  ...extra,
});

const createIceTile = (turns = 4, extra = {}) => ({
  id: `ice-${++tileSeq}-${Date.now()}`,
  type: "ice",
  level: 1,
  turnsLeft: turns,
  ...extra,
});

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function cloneGrid(grid) {
  return grid.map((row) => row.map((tile) => (tile ? { ...tile } : null)));
}

function emptyCells(grid) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomBotTile(grid) {
  const next = cloneGrid(grid);
  const empty = emptyCells(next);
  if (!empty.length) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const level = Math.random() < 0.12 ? 2 : 1;
  next[r][c] = createTile(level, { isNew: true });
  return next;
}

function createInitialGrid() {
  return addRandomBotTile(addRandomBotTile(emptyGrid()));
}

// ── ÂM THANH HỢP THỂ DỄ THƯƠNG (CUTE MELODIC WEB AUDIO SYNTHESIS) ─────────────
function playBotFusionSound(level = 1, isTriple = false) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window._botAudioCtx) window._botAudioCtx = new AudioCtx();
    const ctx = window._botAudioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    if (isTriple) {
      // Siêu hợp thể 3 con: Chuỗi chuông ngân C5 → E5 → G5 → C6 → E6 rực rỡ
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const start = now + idx * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.36);
      });
    } else {
      // Hợp thể 2 con: Âm bọt nước boing vui tươi (tần số leo thang theo cấp bot)
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
        gain.gain.linearRampToValueAtTime(0.22, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    }
  } catch { /* ignore */ }
}

// ── ÂM THANH BĂNG THIÊN HÀ (COSMIC ICE AUDIO EFFECTS) ────────────────────────
function playIceFreezeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window._botAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  } catch { /* ignore */ }
}

function playIceCrackSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window._botAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.04);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch { /* ignore */ }
}

function playIceMeltSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window._botAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const freqs = [783.99, 987.77, 1174.66, 1567.98, 2349.32];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  } catch { /* ignore */ }
}

function playStoneShatterSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window._botAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const crunchOsc = ctx.createOscillator();
    const crunchGain = ctx.createGain();
    crunchOsc.type = "sawtooth";
    crunchOsc.frequency.setValueAtTime(240, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
    crunchGain.gain.setValueAtTime(0.25, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    crunchOsc.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.33);

    [480, 680, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const start = now + 0.05 + idx * 0.04;
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, start + 0.12);
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  } catch { /* ignore */ }
}

function playVaultUnlockSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window._botAudioCtx || new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.42);
    });
  } catch { /* ignore */ }
}

// ── Điểm thưởng hợp thể Bot (Hệ thống điểm hào hứng & bùng nổ) ───────────
// Cấp 2 → 20: Tăng dần lũy tiến, điểm càng cao chơi càng cuốn hút.
// Người chơi luôn nhận đủ toàn bộ điểm thưởng và trọn vẹn số JOY xứng đáng!
function getBotMergePoints(level, isTriple = false) {
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

// ── Thuật toán trượt 1 hàng / cột ──────────────────────────────────────────
// · Gộp 2 con cùng cấp → 1 con cấp kế tiếp (cộng điểm chuẩn getBotMergePoints)
// · Gộp 3 con cùng cấp liên tiếp → 1 con cấp kế tiếp (thưởng thêm 50% điểm!)
// · Khối băng (ice): trượt cùng hàng/cột nhưng không bao giờ bị gộp với bot khác
function slideLine(line) {
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

    // Nếu cur là khối băng (ice): trượt lấp đầy ô trống nhưng không hợp thể với bot
    if (cur.type === "ice") {
      out.push({ ...cur, isNew: false });
      i += 1;
      continue;
    }

    // Gộp 3 con bot giống nhau liên tiếp
    if (n1 && n2 && n1.type !== "ice" && n2.type !== "ice" && cur.level === n1.level && cur.level === n2.level) {
      const newLvl = Math.min(20, cur.level + 1);
      out.push(createTile(newLvl, { isTriple: true, isMerged: true }));
      gained += getBotMergePoints(newLvl, true);
      triple = true;
      merges += 2;
      i += 3;
    } else if (n1 && n1.type !== "ice" && cur.level === n1.level) {
      // Gộp 2 con bot giống nhau
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

function moveGrid(grid, direction) {
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

      // Lưu lại toạ độ thực tế của ô vừa được hợp thể
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

function checkHasValidMoves(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) return true;
      // Khối băng trên bàn cờ: Khi các ô khác không còn nước gộp, băng tan sẽ cứu nguy
      if (grid[r][c].type === "ice") return true;
      const curLvl = grid[r][c].level;
      if (c < GRID_SIZE - 1 && grid[r][c + 1] && grid[r][c + 1].type !== "ice" && grid[r][c + 1].level === curLvl) return true;
      if (r < GRID_SIZE - 1 && grid[r + 1][c] && grid[r + 1][c].type !== "ice" && grid[r + 1][c].level === curLvl) return true;
    }
  }
  return false;
}

// Âm thanh gõ búa gỗ tự nhiên, trầm ấm & tiếng tan biến êm dịu (Calm Acoustic Mallet & Soft Chime)
const playCalmHammerSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Tiếng gõ búa gỗ trầm ấm, chắc chắn mà êm dịu (Warm wooden mallet thump)
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = "sine";
    woodOsc.frequency.setValueAtTime(155, now);
    woodOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
    woodGain.gain.setValueAtTime(0.3, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.22);

    // 2. Thân gỗ vang tự nhiên (Resonant wooden block body)
    const resOsc = ctx.createOscillator();
    const resGain = ctx.createGain();
    resOsc.type = "triangle";
    resOsc.frequency.setValueAtTime(290, now);
    resOsc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
    resGain.gain.setValueAtTime(0.15, now);
    resGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    resOsc.connect(resGain);
    resGain.connect(ctx.destination);
    resOsc.start(now);
    resOsc.stop(now + 0.15);

    // 3. Tiếng tan biến êm ái, nhẹ nhàng như làn gió (Gentle airy dissolve whisper)
    const softChime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    softChime.type = "sine";
    softChime.frequency.setValueAtTime(440, now + 0.08);
    softChime.frequency.exponentialRampToValueAtTime(660, now + 0.38);
    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.12);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    softChime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    softChime.start(now + 0.08);
    softChime.stop(now + 0.45);
  } catch { /* ignore */ }
};

// ── COMPONENT CHÍNH ─────────────────────────────────────────────────────────
export default function Game2048({ paused = false, onGameOver, bio }) {
  const { t } = useTranslation();
  const walletBalance = useJoyStore((s) => s.balance);
  const [grid, setGrid] = useState(createInitialGrid);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(2);
  const [bestBotEver, setBestBotEver] = useState(() => {
    try {
      return parseInt(localStorage.getItem("hugo_arcade_2048_best_bot") || "2", 10);
    } catch {
      return 2;
    }
  });

  // Mỗi màn chơi người dùng chỉ có 2 lượt đập miễn phí (hết 2 lượt mua 50 JOY)
  const [hammers, setHammers] = useState(2);
  const [isHammerMode, setIsHammerMode] = useState(false);
  const [smashTarget, setSmashTarget] = useState(null); // null | { r, c, phase: "strike" | "squash" | "fade", level, isIce }
  const [showBuyHammerModal, setShowBuyHammerModal] = useState(false);
  const [isPurchasingHammer, setIsPurchasingHammer] = useState(false);

  // Kho lưu nhân vật sưu tầm (Vault)
  const VAULT_STORAGE_KEY = "hugo_arcade_2048_unlocked_vault";
  const [unlockedVault, setUnlockedVault] = useState(() => {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(Number);
      }
    } catch { /* ignore */ }
    return [1, 2];
  });
  const [newCharacterReveal, setNewCharacterReveal] = useState(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultTab, setVaultTab] = useState("vault");
  const [vaultLeaderboard, setVaultLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Hiệu ứng tương tác sống động: Hạt tim sao & Thẻ điểm bay
  const [particles, setParticles] = useState([]);
  const [floatingBadges, setFloatingBadges] = useState([]);

  const [status, setStatus] = useState(null); // null | "gameover" | "win"
  const [shake, setShake] = useState(0); // 0 = none, 1 = merge, 2 = hammer smash
  const [fever, setFever] = useState(0);
  const [feverChain, setFeverChain] = useState(0);
  const [notice, setNotice] = useState("");

  // Hiệu ứng di chuyển & quán tính vuốt trượt
  const [lastMoveDir, setLastMoveDir] = useState(null); // null | "left" | "right" | "up" | "down"
  const [isSliding, setIsSliding] = useState(false);

  // Công nhận điểm tức thì
  const [scoreDelta, setScoreDelta] = useState(null); // null | { amount: number, id: number }
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // Theo dõi số lượt đi & ô đóng băng vũ trụ
  const [movesCount, setMovesCount] = useState(0);
  const [lastIceSpawnMove, setLastIceSpawnMove] = useState(0);

  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);
  const gridRef = useRef(grid);
  const comboRef = useRef(createCombo({ windowMs: 2800, step: 0.25, max: 3 }));
  const historyRef = useRef([]);

  gridRef.current = grid;

  // Tự hạ combo multiplier sau 2.8s không gộp
  useEffect(() => {
    if (comboMultiplier <= 1) return undefined;
    const t = setTimeout(() => setComboMultiplier(1), 2800);
    return () => clearTimeout(t);
  }, [comboMultiplier]);

  // Cập nhật điểm mượt mà
  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.max(1, Math.ceil(diff / 10));
    const timer = setTimeout(() => setDisplayScore((s) => Math.min(score, s + step)), 16);
    return () => clearTimeout(timer);
  }, [score, displayScore]);

  // Hết rung màn sau 250ms
  useEffect(() => {
    if (!shake) return undefined;
    const t = setTimeout(() => setShake(0), 250);
    return () => clearTimeout(t);
  }, [shake]);

  // Đếm ngược Fever
  useEffect(() => {
    if (fever <= 0) return undefined;
    const t = setTimeout(() => {
      setFever((f) => {
        const next = f - 1;
        if (next <= 0) setFeverChain(0);
        return next;
      });
    }, 900);
    return () => clearTimeout(t);
  }, [fever]);

  // Tự tắt thông báo sau 2s
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  // Pháo hoa khi mở khóa nhân vật mới vào kho
  useEffect(() => {
    if (!newCharacterReveal) return undefined;
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 } });
    } catch { /* ignore */ }
    return undefined;
  }, [newCharacterReveal]);

  // Đồng bộ kho sưu tầm từ server khi khởi động game
  useEffect(() => {
    let active = true;
    fetchCollection2048()
      .then((data) => {
        if (active && data?.unlockedCharacters?.length) {
          setUnlockedVault((prev) => {
            const merged = Array.from(new Set([...prev, ...data.unlockedCharacters.map(Number)])).sort((a, b) => a - b);
            try { localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const loadVaultLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const list = await fetchCollectionLeaderboard2048();
      setVaultLeaderboard(list);
    } catch {
      setVaultLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    if (showVaultModal && vaultTab === "leaderboard") {
      loadVaultLeaderboard();
    }
  }, [showVaultModal, vaultTab, loadVaultLeaderboard]);

  // ── Xử lý Di chuyển & Gộp ────────────────────────────────────────────────
  const handleMove = useCallback((direction) => {
    if (status || paused || isHammerMode || smashTarget) return;

    const { nextGrid, moved, gained, merges, tripleBonus, mergedPositions } = moveGrid(gridRef.current, direction);
    if (!moved) return;

    // Kích hoạt hiệu ứng quán tính bàn cờ và lướt trượt các nhân vật theo hướng vuốt
    setLastMoveDir(direction);
    setIsSliding(true);
    setTimeout(() => setIsSliding(false), 220);

    // Lưu snapshot cho Undo
    historyRef.current = [
      ...historyRef.current.slice(-3),
      { grid: gridRef.current, score, maxLevel },
    ];

    let newGrid = nextGrid;
    newGrid = addRandomBotTile(newGrid);

    const nextMoves = movesCount + 1;
    setMovesCount(nextMoves);

    let addedScore = 0;
    if (gained > 0) {
      const combo = comboRef.current;
      const mult = Math.min(1.5, combo.hit());
      setComboMultiplier(mult);
      const feverMult = fever > 0 ? 1.2 : 1;
      const chainMult = 1 + (merges - 1) * 0.1;
      addedScore = Math.round(gained * mult * feverMult * chainMult);

      // Âm thanh hợp thể & Haptic tương tác sống động
      const maxMergedLvl = mergedPositions.reduce((max, p) => Math.max(max, p.level), 1);
      playBotFusionSound(maxMergedLvl, tripleBonus);
      hapticMerge();

      // Bùng nổ hạt tim & sao lấp lánh tại các ô hợp thể
      if (mergedPositions.length > 0) {
        const newParts = [];
        const ICONS = ["✦", "◆", "★", "▲"];
        mergedPositions.forEach((pos) => {
          [45, 135, 225, 315].forEach((deg, sIdx) => {
            const rad = (deg * Math.PI) / 180;
            const dist = 34;
            newParts.push({
              id: `p-${Date.now()}-${pos.r}-${pos.c}-${sIdx}`,
              x: (pos.c * 25) + 12.5,
              y: (pos.r * 25) + 12.5,
              tx: Math.round(Math.cos(rad) * dist),
              ty: Math.round(Math.sin(rad) * dist),
              symbol: ICONS[sIdx % ICONS.length],
              color: BOT_TIERS[pos.level]?.color || "#facc15",
            });
          });
        });
        setParticles(newParts);
        setTimeout(() => setParticles([]), 550);

        // Nhãn điểm thưởng bay lên từ ô hợp thể (công nhận điểm số và siêu gộp)
        const badges = mergedPositions.map((pos, bIdx) => {
          const pts = getBotMergePoints(pos.level, pos.isTriple);
          return {
            id: `badge-${Date.now()}-${bIdx}`,
            x: (pos.c * 25) + 12.5,
            y: (pos.r * 25) + 12.5,
            text: pos.isTriple ? `SIÊU GỘP ×1.5! +${pts}` : `+${pts}`,
            isTriple: pos.isTriple,
          };
        });
        setFloatingBadges(badges);
        setTimeout(() => setFloatingBadges([]), 700);

        // Reset cờ isMerged sau khi bot hoàn thành điệu nhảy ăn mừng (500ms)
        setTimeout(() => {
          setGrid((prevGrid) =>
            prevGrid.map((row) =>
              row.map((cell) => (cell ? { ...cell, isMerged: false, isTriple: false } : null))
            )
          );
        }, 500);
      }

      // Thông báo gộp 3 con
      if (tripleBonus) {
        setNotice(t("arcadeGame.g2048Triple", "SIÊU GỘP 3 CON!"));
        setShake(1);
      } else if (gained >= 80) {
        setShake(1);
      }

      // Fever chain
      const nextChain = feverChain + merges;
      setFeverChain(nextChain);
      if (nextChain >= 4 && fever <= 0) {
        setFever(4);
        setNotice(t("arcadeGame.g2048Fever", "FEVER MODE ×1.2 ĐIỂM!"));
      }
    } else {
      playGameMove();
      hapticMove();
    }

    // ── XỬ LÝ Ô ĐÓNG BĂNG VŨ TRỤ (COSMIC FREEZE): Đóng băng ô trong vài lượt ──
    let icePos = null;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c]?.type === "ice") {
          icePos = { r, c, tile: newGrid[r][c] };
          break;
        }
      }
      if (icePos) break;
    }

    if (icePos) {
      // Mỗi lượt đi thường làm đá tan bớt 1 lượt.
      // Nếu có hợp thể (gộp bot) tạo nhiệt lượng, giảm thêm 1 lượt.
      // Nếu có hợp thể ngay kề cạnh khối đá, nhiệt lượng cực mạnh giảm thêm 2 lượt!
      let decrement = 1;
      if (merges > 0) decrement += 1;
      const adjacentMerge = mergedPositions.some(
        (p) => Math.abs(p.r - icePos.r) + Math.abs(p.c - icePos.c) === 1
      );
      if (adjacentMerge) decrement += 2;

      const remainingTurns = icePos.tile.turnsLeft - decrement;

      if (remainingTurns <= 0) {
        // KHỐI BĂNG ĐÃ TAN HOÀN TOÀN! GIẢI PHÓNG Ô TRỐNG & THƯỞNG ĐIỂM
        newGrid[icePos.r][icePos.c] = null;
        addedScore += 80;
        playIceMeltSound();
        playStoneShatterSound();
        hapticMerge();
        setShake(1);
        setNotice("Khối băng đã tan hoàn toàn! Giải phóng 1 ô trống (+80 Điểm)");

        setFloatingBadges((prev) => [
          ...prev,
          {
            id: `melt-${Date.now()}`,
            x: (icePos.c * 25) + 12.5,
            y: (icePos.r * 25) + 12.5,
            text: "BĂNG TAN! +80",
            isTriple: true,
          },
        ]);
        setTimeout(() => setFloatingBadges([]), 850);
      } else {
        newGrid[icePos.r][icePos.c] = {
          ...icePos.tile,
          turnsLeft: remainingTurns,
          isNew: false,
        };
        playIceCrackSound();
        if (adjacentMerge) {
          setNotice(`🔥 Nhiệt lượng hợp thể làm rạn nứt đá! Còn ${remainingTurns} lần nữa sẽ tan`);
        } else {
          setNotice(`🪨 Ô hóa đá: Còn ${remainingTurns} lần nữa sẽ tan!`);
        }
      }
    } else {
      // Chưa có ô đá: Hóa đá ngẫu nhiên 1 ô sau mỗi 14-20 nước đi
      if (nextMoves >= 14 && (nextMoves - lastIceSpawnMove) >= 22) {
        const empties = emptyCells(newGrid);
        if (empties.length >= 3) {
          const [ir, ic] = empties[Math.floor(Math.random() * empties.length)];
          newGrid[ir][ic] = createIceTile(4, { isNew: true });
          setLastIceSpawnMove(nextMoves);
          playIceFreezeSound();
          setNotice("Một ô đã bị đóng băng! Còn 4 lượt nữa sẽ tan.");
        }
      }
    }

    // Tìm nhân vật cao nhất hiện tại trên bàn cờ
    let highestOnBoard = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] && newGrid[r][c].type !== "ice" && newGrid[r][c].level > highestOnBoard) {
          highestOnBoard = newGrid[r][c].level;
        }
      }
    }

    // Cập nhật cấp độ kỷ lục trong ván
    if (highestOnBoard > maxLevel) {
      const tierBonus = highestOnBoard * 30;
      addedScore += tierBonus;
      setMaxLevel(highestOnBoard);

      if (highestOnBoard > bestBotEver) {
        setBestBotEver(highestOnBoard);
        try {
          localStorage.setItem("hugo_arcade_2048_best_bot", String(highestOnBoard));
        } catch { /* ignore */ }
      }
    }

    // ── KIỂM TRA MỞ KHÓA NHÂN VẬT SƯU TẦM MỚI (CHỈ THƯỞNG 1 LẦN DUY NHẤT) ─────
    const unvaultedNew = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tObj = newGrid[r][c];
        if (tObj && tObj.type !== "ice" && tObj.level) {
          if (!unlockedVault.includes(tObj.level) && !unvaultedNew.includes(tObj.level)) {
            unvaultedNew.push(tObj.level);
          }
        }
      }
    }

    if (unvaultedNew.length > 0) {
      const highestNew = Math.max(...unvaultedNew);
      const tierData = BOT_TIERS[highestNew];
      const bonusJoy = JELLY_UNLOCK_BONUSES[highestNew] || 10;

      // Cập nhật kho sưu tầm
      const updatedVault = Array.from(new Set([...unlockedVault, highestNew])).sort((a, b) => a - b);
      setUnlockedVault(updatedVault);
      try {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updatedVault));
      } catch { /* ignore */ }

      // Ghi nhận lên server & nhận thưởng JOY lần đầu
      unlockCharacter2048(highestNew)
        .then(() => {
          if (bio?.email) {
            useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
          }
        })
        .catch(() => {});

      // Kích hoạt thông báo/quảng cáo nhân vật mới 1 lần duy nhất
      playVaultUnlockSound();
      setNewCharacterReveal({
        level: highestNew,
        name: tierData?.name || `Jelly Cấp ${highestNew}`,
        bonusJoy,
        tier: tierData,
      });
    }

    if (highestOnBoard >= 20) {
      setStatus("win");
      if (onGameOver && !reportedRef.current) {
        reportedRef.current = true;
        onGameOver(score + addedScore, "win");
      }
    }

    if (addedScore > 0) {
      setScoreDelta({ amount: addedScore, id: Date.now() });
      setTimeout(() => setScoreDelta(null), 850);
    }

    setScore((s) => s + addedScore);
    setGrid(newGrid);

    // Kiểm tra hết nước đi
    const hasMoves = checkHasValidMoves(newGrid);
    if (!hasMoves) {
      if (hammers > 0) {
        setNotice(t("arcadeGame.g2048StuckNotice", "Bàn cờ đang kẹt! Dùng Búa Phá Ô để giải cứu!"));
      } else {
        setStatus("gameover");
        playGameLose();
        hapticLose();
        setTimeout(() => {
          if (onGameOver && !reportedRef.current) {
            reportedRef.current = true;
            onGameOver(score + addedScore, "lose");
          }
        }, 1000);
      }
    }
  }, [status, paused, isHammerMode, smashTarget, score, maxLevel, fever, feverChain, bestBotEver, hammers, movesCount, lastIceSpawnMove, t, onGameOver, bio?.email, unlockedVault]);

  // ── Đập Búa Phá Ô (2 Búa miễn phí mỗi màn, hết lượt mua 50 JOY) ───────────
  const handleHammerButtonClick = () => {
    if (status || paused || smashTarget) return;
    if (hammers > 0) {
      setIsHammerMode((prev) => !prev);
    } else {
      setShowBuyHammerModal(true);
    }
  };

  const handleBuyHammerConfirm = async () => {
    if (isPurchasingHammer) return;
    setIsPurchasingHammer(true);
    try {
      const res = await buyHammer2048();
      if (res?.success) {
        setHammers((h) => h + 1);
        setIsHammerMode(true);
        setShowBuyHammerModal(false);
        setNotice("Đã mua thành công 1 Búa! Chạm vào ô để đập vỡ.");
        playVaultUnlockSound();
        if (bio?.email) {
          useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
        }
      }
    } catch (err) {
      notify.error(err.message || "Không đủ 50 JOY hoặc lỗi kết nối");
    } finally {
      setIsPurchasingHammer(false);
    }
  };

  const handleCellClick = (r, c) => {
    if (!isHammerMode || smashTarget) return;
    const tile = grid[r][c];
    if (!tile) return;

    // Thoát chế độ chọn búa ngay khi người chơi đã chạm vào 1 bé hoặc tảng đá
    setIsHammerMode(false);
    const isIce = tile.type === "ice";
    setSmashTarget({ r, c, phase: "strike", level: tile.level || 1, isIce });

    // Giai đoạn 1: Búa vung xuống êm ái, tự nhiên theo quán tính (t = 300ms)
    setTimeout(() => {
      playCalmHammerSound();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(22); } catch { /* ignore */ }
      }
      setShake(1); // Rung nhẹ êm dịu, không giật màn hình
      setTimeout(() => setShake(0), 180);

      setSmashTarget((prev) => (prev ? { ...prev, phase: "squash" } : null));

      // Giai đoạn 2: Nhân vật dẹp lép mềm mại như thạch dẻo / đất sét (t = 620ms)
      setTimeout(() => {
        setSmashTarget((prev) => (prev ? { ...prev, phase: "fade" } : null));

        // Giai đoạn 3: Bé dẹp lép từ từ tan biến thành làn sương khói êm dịu (t = 1050ms)
        setTimeout(() => {
          setGrid((prevGrid) => {
            const next = cloneGrid(prevGrid);
            next[r][c] = null;
            return next;
          });
          setHammers((h) => Math.max(0, h - 1));
          setSmashTarget(null);
          setNotice(isIce ? "🔨 Búa đã đập tan khối đá hóa thạch!" : t("arcadeGame.g2048Smashed", "Đã đập dẹp lép và giải phóng 1 ô trống!"));
        }, 430);
      }, 320);
    }, 300);
  };

  // ── Chơi lại ─────────────────────────────────────────────────────────────
  const restartGame = () => {
    reportedRef.current = false;
    setGrid(createInitialGrid());
    setScore(0);
    setDisplayScore(0);
    setMaxLevel(2);
    setHammers(2); // Mỗi lượt chơi chỉ có 2 lượt miễn phí
    setIsHammerMode(false);
    setSmashTarget(null);
    setStatus(null);
    setNotice("");
    setNewCharacterReveal(null);
    setShowBuyHammerModal(false);
    setShowVaultModal(false);
    setParticles([]);
    setFloatingBadges([]);
    setScoreDelta(null);
    setComboMultiplier(1);
    setMovesCount(0);
    setLastIceSpawnMove(0);
    setLastMoveDir(null);
    setIsSliding(false);
    historyRef.current = [];
  };

  // ── Lắng nghe Bàn phím ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        handleMove("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        handleMove("down");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        handleMove("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        handleMove("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // ── Lắng nghe Vuốt Cảm Ứng ───────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (isHammerMode) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    if (isHammerMode || smashTarget || !touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 22) return;

    if (absX > absY) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };

  const highestBot = BOT_TIERS[maxLevel] || BOT_TIERS[1];
  const recordBot = BOT_TIERS[bestBotEver] || BOT_TIERS[1];

  return (
    <div className={`relative w-full h-full min-h-[560px] flex flex-col items-center justify-between p-3 select-none text-slate-100 overflow-hidden ${shake === 1 ? "animate-gentle-nudge" : ""}`}>
      {/* ── CSS KEYFRAMES CHO HIỆU ỨNG HỢP THỂ ────────────────────────────── */}
      <style>{`
        @keyframes fusionPop {
          0% { transform: scale(0.6) rotate(-6deg); filter: brightness(1.7); }
          40% { transform: scale(1.24) rotate(4deg); filter: brightness(1.35); }
          75% { transform: scale(0.94) rotate(-2deg); filter: brightness(1.1); }
          100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
        }
        @keyframes fusionHalo {
          0% { transform: scale(0.35); opacity: 0.95; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(0.7); opacity: 0; }
          25% { transform: translate(-50%, -8px) scale(1.1); opacity: 1; }
          75% { transform: translate(-50%, -20px) scale(1); opacity: 0.95; }
          100% { transform: translate(-50%, -32px) scale(0.9); opacity: 0; }
        }
        @keyframes particleBurst {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.25); opacity: 0; }
        }
        .animate-fusion-pop {
          animation: fusionPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-fusion-halo {
          animation: fusionHalo 0.48s ease-out forwards;
        }
        .animate-float-up {
          animation: floatUpFade 0.75s ease-out forwards;
        }
        .animate-particle-burst {
          animation: particleBurst 0.55s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* ── HIỆU ỨNG ĐẬP BÚA BÌNH TĨNH, NHẸ NHÀNG & CHÂN THẬT ──────────── */
        @keyframes calmHammerSwing {
          0% {
            transform: translate(22px, -44px) rotate(-45deg) scale(1.15);
            opacity: 0;
          }
          20% {
            transform: translate(16px, -34px) rotate(-35deg) scale(1.2);
            opacity: 1;
          }
          52% {
            /* Chạm đỉnh đầu nhân vật nhẹ nhàng, có độ đầm của gỗ */
            transform: translate(-2px, 8px) rotate(10deg) scale(1.06);
          }
          68% {
            /* Nảy nhẹ tự nhiên theo phản lực đàn hồi */
            transform: translate(0px, -2px) rotate(6deg) scale(1.03);
          }
          85% {
            transform: translate(-3px, -12px) rotate(2deg) scale(0.98);
            opacity: 0.85;
          }
          100% {
            transform: translate(-6px, -24px) rotate(-4deg) scale(0.9);
            opacity: 0;
          }
        }
        .animate-calm-hammer {
          animation: calmHammerSwing 0.72s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes calmSquash {
          0% {
            transform: scale(1, 1) translateY(0);
          }
          40% {
            /* Dẹp lép mềm mại như thạch dẻo / đất sét */
            transform: scale(1.36, 0.22) translateY(24px);
          }
          65% {
            /* Độ nảy đàn hồi nhẹ tạo cảm giác vật lý chân thật */
            transform: scale(1.30, 0.27) translateY(22px);
          }
          100% {
            transform: scale(1.35, 0.24) translateY(23px);
          }
        }
        .animate-calm-squash {
          animation: calmSquash 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
        }

        @keyframes calmDissolve {
          0% {
            transform: scale(1.35, 0.24) translateY(23px);
            opacity: 1;
            filter: blur(0px);
          }
          60% {
            transform: scale(1.25, 0.18) translateY(23px);
            opacity: 0.55;
            filter: blur(2px);
          }
          100% {
            transform: scale(1.12, 0.12) translateY(23px);
            opacity: 0;
            filter: blur(6px);
          }
        }
        .animate-calm-dissolve {
          animation: calmDissolve 0.44s ease-out forwards;
        }

        @keyframes gentleMist {
          0% {
            transform: translate(-50%, 6px) scale(0.6);
            opacity: 0.75;
          }
          100% {
            transform: translate(-50%, -14px) scale(1.35);
            opacity: 0;
          }
        }
        .animate-gentle-mist {
          animation: gentleMist 0.55s ease-out forwards;
        }

        @keyframes gentleHalo {
          0% {
            transform: scale(0.4);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
        .animate-gentle-halo {
          animation: gentleHalo 0.48s ease-out forwards;
        }

        @keyframes gentleSparkleDrift {
          0% {
            transform: translate(-50%, 0) scale(0.6);
            opacity: 0.85;
          }
          100% {
            transform: translate(-50%, -18px) scale(1);
            opacity: 0;
          }
        }
        .animate-sparkle-drift {
          animation: gentleSparkleDrift 0.52s ease-out forwards;
        }

        @keyframes boardGentleNudge {
          0% { transform: translateY(0); }
          30% { transform: translateY(2px); }
          70% { transform: translateY(-1px); }
          100% { transform: translateY(0); }
        }
        .animate-gentle-nudge {
          animation: boardGentleNudge 0.18s ease-in-out;
        }

        /* ── HIỆU ỨNG QUÁN TÍNH BÀN CỜ KHI VUỐT (BOARD MOMENTUM BUMP) ─────── */
        @keyframes boardBumpLeft {
          0% { transform: translateX(0); }
          40% { transform: translateX(-8px) scale(0.995); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes boardBumpRight {
          0% { transform: translateX(0); }
          40% { transform: translateX(8px) scale(0.995); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes boardBumpUp {
          0% { transform: translateY(0); }
          40% { transform: translateY(-8px) scale(0.995); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes boardBumpDown {
          0% { transform: translateY(0); }
          40% { transform: translateY(8px) scale(0.995); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-board-bump-left { animation: boardBumpLeft 0.22s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-right { animation: boardBumpRight 0.22s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-up { animation: boardBumpUp 0.22s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-down { animation: boardBumpDown 0.22s cubic-bezier(0.2, 0.9, 0.3, 1); }

        /* ── HIỆU ỨNG LƯỚT NHÂN VẬT THEO HƯỚNG TRƯỢT (TILE FLOW GLIDE) ─── */
        @keyframes tileFlowLeft {
          0% { transform: translateX(20px); opacity: 0.85; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes tileFlowRight {
          0% { transform: translateX(-20px); opacity: 0.85; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes tileFlowUp {
          0% { transform: translateY(20px); opacity: 0.85; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes tileFlowDown {
          0% { transform: translateY(-20px); opacity: 0.85; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-tile-flow-left { animation: tileFlowLeft 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-right { animation: tileFlowRight 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-up { animation: tileFlowUp 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-down { animation: tileFlowDown 0.2s cubic-bezier(0.22, 1, 0.36, 1); }

        /* ── HIỆU ỨNG BÉ MỚI XUẤT HIỆN ĐÀN HỒI (TILE SPRING POP) ───────── */
        @keyframes tileSpringPop {
          0% { transform: scale(0.25) rotate(-6deg); opacity: 0; filter: brightness(1.3); }
          60% { transform: scale(1.16) rotate(3deg); opacity: 1; filter: brightness(1.15); }
          85% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
        }
        .animate-tile-spring-pop {
          animation: tileSpringPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* ── HIỆU ỨNG NHẢY SỐ ĐIỂM VÀ THƯỞNG (SCORE PULSE & FLOAT) ──────── */
        @keyframes scorePulse {
          0% { transform: scale(1); }
          40% { transform: scale(1.16); text-shadow: 0 0 14px rgba(34, 211, 238, 0.9); }
          100% { transform: scale(1); }
        }
        .animate-score-pulse {
          animation: scorePulse 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
      `}</style>

      {/* ── BẢNG THÔNG TIN ĐẦU TRẬN (HUD) — CÔNG NHẬN ĐIỂM & THƯỞNG JOY TRỰC TIẾP ── */}
      <div className="w-full max-w-[430px] flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl rounded-2xl px-3.5 py-2 shadow-lg">
          {/* 1. Điểm số + Fever + Combo (Biểu tượng Ngôi sao & Lửa) */}
          <div className="relative flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              stars
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight transition-all duration-150 ${
                  scoreDelta
                    ? "text-cyan-200 scale-110 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                    : "text-cyan-300 drop-shadow"
                }`}
              >
                {displayScore.toLocaleString()}
              </span>
              {fever > 0 ? (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[13px] font-black animate-pulse">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  ×2
                </span>
              ) : comboMultiplier > 1 ? (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[13px] font-black animate-pulse">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  ×{comboMultiplier.toFixed(1)}
                </span>
              ) : null}
            </div>

            {/* Nhãn điểm cộng bay lên cạnh điểm số khi hợp thể */}
            {scoreDelta && (
              <span className="absolute -top-5 left-7 text-[13px] font-black text-cyan-100 bg-cyan-950/95 border border-cyan-300/80 px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.6)] animate-float-up pointer-events-none whitespace-nowrap z-30">
                +{scoreDelta.amount.toLocaleString()}
              </span>
            )}
          </div>


          {/* 3. Cặp linh thú: Cao nhất ván này & Kỷ lục mọi thời đại (Biểu tượng thay chữ) */}
          <div className="flex items-center gap-2">
            {/* Cao nhất ván này: Biểu tượng Huân chương danh giá */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-400 text-xl drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                workspace_premium
              </span>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/80 ring-2 ring-amber-400/60 flex items-center justify-center overflow-hidden shadow-[0_0_14px_rgba(251,191,36,0.3)]">
                <BotAvatar
                  type={highestBot.type}
                  color={highestBot.color}
                  face={highestBot.face}
                  state={highestBot.state}
                  shading={highestBot.shading}
                  hat={highestBot.hat}
                  glasses={highestBot.glasses}
                  headphones={highestBot.headphones}
                  bowTie={highestBot.bowTie}
                  size={42}
                  paused={paused}
                />
              </div>
            </div>

            {/* Vạch chia tối giản */}
            <div className="w-px h-5 bg-slate-800" />

            {/* Kỷ lục all-time: Biểu tượng Cúp vinh quang */}
            <div className="flex items-center gap-1.5 opacity-85">
              <span className="material-symbols-outlined text-purple-400 text-xl drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]">
                emoji_events
              </span>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/80 ring-1 ring-purple-400/50 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                <BotAvatar
                  type={recordBot.type}
                  color={recordBot.color}
                  face={recordBot.face}
                  state={recordBot.state}
                  shading={recordBot.shading}
                  hat={recordBot.hat}
                  glasses={recordBot.glasses}
                  headphones={recordBot.headphones}
                  bowTie={recordBot.bowTie}
                  size={40}
                  paused={paused}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Banner Chế độ Búa Phá Ô */}
        {isHammerMode && (
          <div className="flex items-center justify-between bg-amber-950/90 border border-amber-500/80 rounded-xl px-3.5 py-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
            <div className="flex items-center gap-2.5">
              <img src="/images/wooden_hammer.png" alt="Búa gỗ" className="w-6 h-6 object-contain" />
              <span className="text-[13px] font-bold text-amber-200">
                Chạm vào 1 ô để đập vỡ! (Còn ×{hammers})
              </span>
            </div>
            <button
              onClick={() => setIsHammerMode(false)}
              className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-[13px] font-bold rounded-lg border border-amber-400/50 min-h-[36px] flex items-center justify-center"
            >
              Huỷ
            </button>
          </div>
        )}

        {notice && !isHammerMode && (
          <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border border-amber-400/50 rounded-xl px-3 py-1.5 text-center shadow-lg">
            <span className="text-[13px] font-bold text-amber-300 tracking-wide">
              {notice}
            </span>
          </div>
        )}
      </div>

      {/* ── BÀN CỜ 4x4 BOT-AVATARS (THIẾT KẾ TINH GỌN, TẬP TRUNG 100% VÀO NHÂN VẬT) ─── */}
      <div
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`w-full max-w-[420px] aspect-square my-auto p-2 sm:p-2.5 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-[0_0_35px_rgba(15,23,42,0.8)] grid grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5 relative transition-transform duration-100 ${
          isSliding && lastMoveDir ? `animate-board-bump-${lastMoveDir}` : ""
        }`}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const tier = tile ? BOT_TIERS[tile.level] || BOT_TIERS[1] : null;
            const isSmashingThis = smashTarget && smashTarget.r === r && smashTarget.c === c;
            const smashPhase = isSmashingThis ? smashTarget.phase : null;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative aspect-square rounded-2xl flex items-center justify-center p-1 select-none transition-all duration-200 ${
                  isSmashingThis
                    ? "z-40 overflow-visible bg-slate-950/90 ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.8)]"
                    : isHammerMode && tile
                    ? "ring-2 ring-rose-400 border-2 border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.6)] cursor-crosshair hover:scale-105 active:scale-95 overflow-hidden"
                    : tile?.type === "ice"
                    ? "bg-gradient-to-br from-sky-200 via-cyan-400 to-blue-600 border-2 border-cyan-100 shadow-[0_4px_16px_rgba(6,182,212,0.4)] overflow-hidden"
                    : tile
                    ? `bg-gradient-to-br ${tier?.bgClass || ""} ${tier?.glowClass || ""} border ${
                        tile.isMerged
                          ? "animate-fusion-pop z-20"
                          : ""
                      } overflow-hidden`
                    : "bg-slate-900/60 border border-slate-800/60 shadow-inner overflow-hidden"
                }`}
              >
                {tile?.type === "ice" ? (
                  <>
                    <div
                      style={{ transformOrigin: "bottom center" }}
                      className={`w-full h-full rounded-xl select-none relative overflow-hidden flex items-center justify-center ${
                        smashPhase === "squash"
                          ? "animate-calm-squash"
                          : smashPhase === "fade"
                          ? "animate-calm-dissolve"
                          : isSliding && lastMoveDir
                          ? `animate-tile-flow-${lastMoveDir}`
                          : tile.isNew
                          ? "animate-tile-spring-pop"
                          : ""
                      }`}
                    >
                      {/* 2D Khối Băng: Viền nổi 2D Bevel Highlight */}
                      <div className="absolute inset-0 border-t-2 border-l-2 border-white/80 border-b-2 border-r-2 border-blue-800/60 rounded-xl pointer-events-none" />

                      {/* Vệt sáng chéo 2D bóng kính băng (Gloss highlight) */}
                      <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-white/70 via-white/20 to-transparent rotate-45 pointer-events-none" />
                      <div className="absolute top-1 left-1.5 w-6 h-1.5 bg-white/60 rounded-full rotate-[-25deg] pointer-events-none" />

                      {/* Các đường vân nứt tinh thể băng 2D (SVG) */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
                        viewBox="0 0 100 100"
                        fill="none"
                        stroke="white"
                        strokeWidth={tile.turnsLeft <= 1 ? "2.5" : "1.8"}
                        strokeLinecap="round"
                      >
                        <path d="M12 12 L35 38 L28 62 L48 88" />
                        <path d="M88 15 L62 42 L68 70 L52 90" />
                        {tile.turnsLeft <= 1 && (
                          <>
                            <path d="M35 38 L62 42" stroke="#bae6fd" strokeWidth="2" />
                            <path d="M28 62 L68 70" stroke="#bae6fd" strokeWidth="2" />
                            <path d="M10 50 L28 62" stroke="#e0f2fe" strokeWidth="1.5" />
                            <path d="M90 50 L68 70" stroke="#e0f2fe" strokeWidth="1.5" />
                          </>
                        )}
                      </svg>

                      {/* Số lượt còn lại trước khi băng tan - To, rõ nét 2D, không kèm hình hay chữ */}
                      <span className="relative z-10 text-[36px] sm:text-[40px] font-black text-white font-mono leading-none tracking-tight filter drop-shadow-[0_3px_6px_rgba(2,132,199,0.95)]">
                        {tile.turnsLeft}
                      </span>
                    </div>

                    {/* Chỉ báo ngắm đập khi bật búa */}
                    {isHammerMode && !smashTarget && (
                      <div className="absolute inset-0 bg-rose-500/20 rounded-2xl pointer-events-none flex items-center justify-center z-20">
                        <span className="material-symbols-outlined text-rose-300 text-3xl animate-ping pointer-events-none drop-shadow">
                          adjust
                        </span>
                      </div>
                    )}

                    {/* HIỆU ỨNG ĐẬP BÚA VÀO TẢNG BĂNG */}
                    {isSmashingThis && (
                      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="absolute -top-7 -right-7 w-20 h-20 animate-calm-hammer">
                          <img
                            src="/images/wooden_hammer.png"
                            alt="Búa đập"
                            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                          />
                        </div>
                        {(smashPhase === "squash" || smashPhase === "fade") && (
                          <div className="absolute inset-2 rounded-2xl border-2 border-cyan-200/80 animate-gentle-halo pointer-events-none" />
                        )}
                      </div>
                    )}
                  </>
                ) : tile && tier ? (
                  <>
                    {/* Sóng xung kích phát sáng khi hợp thể */}
                    {tile.isMerged && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none z-30 flex items-center justify-center overflow-hidden">
                        <span
                          className="w-full h-full rounded-2xl border-2 animate-fusion-halo pointer-events-none"
                          style={{ borderColor: tier.color }}
                        />
                      </div>
                    )}

                    {/* Thân nhân vật BotAvatar: Khi bị đập thì dẹp lép mềm mại (squash) rồi từ từ tan biến (dissolve), khi lướt thì trượt theo hướng (flow), khi mới xuất hiện thì bật nảy (spring pop) */}
                    <div
                      style={{ transformOrigin: "bottom center" }}
                      className={`w-full h-full flex items-center justify-center p-0.5 ${
                        smashPhase === "squash"
                          ? "animate-calm-squash"
                          : smashPhase === "fade"
                          ? "animate-calm-dissolve"
                          : isSliding && lastMoveDir
                          ? `animate-tile-flow-${lastMoveDir}`
                          : tile.isNew
                          ? "animate-tile-spring-pop"
                          : ""
                      }`}
                    >
                      <BotAvatar
                        type={tier.type}
                        color={tier.color}
                        face={tier.face}
                        state={tile.isMerged ? "working" : tier.state}
                        shading={tier.shading}
                        hat={tier.hat}
                        glasses={tier.glasses}
                        headphones={tier.headphones}
                        bowTie={tier.bowTie}
                        size={80}
                        paused={paused}
                      />
                    </div>

                    {/* Chỉ báo ngắm đập khi đang bật chế độ Búa (nhìn rõ nhân vật) */}
                    {isHammerMode && tile && !smashTarget && (
                      <div className="absolute inset-0 bg-rose-500/15 rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="material-symbols-outlined text-rose-300 text-2xl animate-ping pointer-events-none drop-shadow">
                          adjust
                        </span>
                      </div>
                    )}

                    {/* HIỆU ỨNG ĐẬP BÚA: Búa vung êm ái -> Sóng dịu nhẹ -> Sương khói tan biến chân thật */}
                    {isSmashingThis && (
                      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                        {/* Cây búa gỗ 2D bay tới và đập nện xuống */}
                        <div className="absolute -top-7 -right-7 w-20 h-20 animate-calm-hammer">
                          <img
                            src="/images/wooden_hammer.png"
                            alt="Búa đập"
                            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                          />
                        </div>

                        {/* Hiệu ứng sóng lan tỏa dịu nhẹ & sương khói mềm mại */}
                        {(smashPhase === "squash" || smashPhase === "fade") && (
                          <>
                            {/* Sóng tròn lan tỏa êm dịu */}
                            <div className="absolute inset-2 rounded-full border border-amber-400/60 animate-gentle-halo pointer-events-none" />

                            {/* Làn sương khói mờ ảo bốc lên nhẹ nhàng quanh thân hình dẹp lép */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none animate-gentle-mist">
                              <span className="w-10 h-3 rounded-full bg-slate-300/30 blur-[3px] inline-block" />
                              <span className="w-12 h-2 rounded-full bg-amber-200/40 blur-[2px] inline-block -ml-5" />
                            </div>

                            {/* Đốm sáng vàng lấp lánh bay nhẹ nhàng */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-amber-300/90 animate-sparkle-drift pointer-events-none">
                              <span className="material-symbols-outlined text-sm">sparkles</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <span className="material-symbols-outlined text-slate-400 text-xl">
                      add
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* ── LỚP HIỆU ỨNG HẠT TIM SÀO & ĐIỂM SỐ BAY LÊN KHI HỢP THỂ ───────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute text-base font-bold select-none animate-particle-burst"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                color: p.color,
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                textShadow: `0 0 10px ${p.color}`,
              }}
            >
              {p.symbol}
            </span>
          ))}

          {floatingBadges.map((b) => (
            <div
              key={b.id}
              className="absolute pointer-events-none select-none z-50 animate-float-up"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              <span
                className={`px-2 py-0.5 rounded-full text-[13px] font-black tracking-wide shadow-lg border backdrop-blur-sm ${
                  b.isTriple
                    ? "bg-amber-400/90 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                    : "bg-slate-900/90 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                }`}
              >
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── THANH CÔNG CỤ DƯỚI: BÚA PHÁ Ô & KHO SƯU TẦM NHÂN VẬT ───────── */}
      <div className="w-full max-w-[420px] grid grid-cols-2 gap-2.5 py-2 z-10 px-1">
        {/* Nút 1: Búa Phá Ô (2 lượt miễn phí mỗi ván, hết lượt mua 50 JOY) */}
        <button
          onClick={handleHammerButtonClick}
          disabled={!!status || !!smashTarget}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-bold transition-all min-h-[50px] shadow-lg select-none ${
            isHammerMode
              ? "bg-amber-600/95 text-white ring-4 ring-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse"
              : hammers > 0
              ? "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] active:scale-95"
              : "bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
          }`}
          aria-label="Búa Phá Ô"
        >
          <img
            src="/images/wooden_hammer.png"
            alt="Búa"
            className={`w-7 h-7 object-contain drop-shadow transition-transform duration-200 ${
              isHammerMode ? "rotate-[-20deg] scale-110" : ""
            }`}
          />
          {hammers > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-[13px] text-slate-300 font-bold">Búa:</span>
              <span className="text-lg font-black font-mono text-amber-300 drop-shadow">
                ×{hammers}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-amber-300 font-bold">Mua Búa</span>
              <span className="text-[13px] font-black font-mono px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
                50 JOY
              </span>
            </div>
          )}
        </button>

        {/* Nút 2: Kho Nhân Vật Sưu Tầm & Đua Top */}
        <button
          onClick={() => setShowVaultModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl font-bold transition-all min-h-[50px] shadow-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] active:scale-95 select-none"
          aria-label="Kho Sưu Tầm"
        >
          <span className="material-symbols-outlined text-cyan-400 text-2xl">
            inventory_2
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-slate-300 font-bold">Kho:</span>
            <span className="text-base font-black font-mono text-cyan-300 drop-shadow">
              {unlockedVault.length}/20
            </span>
          </div>
        </button>
      </div>

      {/* ── MODAL 1: MUA THÊM BÚA PHÁ Ô (50 JOY) ─────────────────────────── */}
      {showBuyHammerModal && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-[340px] w-full bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 flex flex-col items-center text-center shadow-[0_0_35px_rgba(245,158,11,0.35)]">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center mb-3">
              <img
                src="/images/wooden_hammer.png"
                alt="Búa gỗ"
                className="w-12 h-12 object-contain drop-shadow"
              />
            </div>
            <h3 className="text-lg font-black text-amber-300 mb-1">
              Mua Thêm Búa Phá Ô
            </h3>
            <p className="text-[13px] text-slate-300 mb-4 leading-relaxed">
              Mỗi ván chơi được tặng 2 lượt miễn phí. Bạn có muốn dùng 50 JOY để mua thêm 1 lượt búa giải cứu bàn cờ?
            </p>

            <div className="w-full bg-slate-950 rounded-xl p-3 mb-4 flex items-center justify-between border border-slate-800 text-[13px]">
              <span className="text-slate-400">Số dư ví của bạn:</span>
              <span className="font-bold text-amber-400 font-mono">
                {Number(walletBalance || 0).toLocaleString()} JOY
              </span>
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                onClick={() => setShowBuyHammerModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[13px] min-h-[44px]"
              >
                Để sau
              </button>
              <button
                onClick={handleBuyHammerConfirm}
                disabled={isPurchasingHammer || (walletBalance !== null && walletBalance < 50)}
                className={`flex-1 py-2.5 font-black rounded-xl text-[13px] min-h-[44px] flex items-center justify-center gap-1 shadow-lg ${
                  walletBalance !== null && walletBalance < 50
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95"
                }`}
              >
                {isPurchasingHammer ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Mua (-50 JOY)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MỞ KHÓA NHÂN VẬT MỚI & THƯỞNG SƯU TẦM (CHỈ 1 LẦN DUY NHẤT) ─ */}
      {newCharacterReveal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-[340px] w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-5 flex flex-col items-center text-center shadow-[0_0_50px_rgba(251,191,36,0.6)]">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[13px] font-black uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-amber-400">auto_awesome</span>
              Nhân Vật Mới Đã Mở Khóa!
            </span>

            <div className="w-32 h-32 my-3 rounded-2xl bg-slate-950 border-2 border-amber-400/60 flex items-center justify-center shadow-[inset_0_0_20px_rgba(251,191,36,0.25)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent animate-pulse" />
              <BotAvatar
                type={newCharacterReveal.tier?.type || "drop"}
                color={newCharacterReveal.tier?.color || "#00e5ff"}
                face={newCharacterReveal.tier?.face || "mouth"}
                state="working"
                shading={newCharacterReveal.tier?.shading || "fabric"}
                hat={newCharacterReveal.tier?.hat}
                glasses={newCharacterReveal.tier?.glasses}
                headphones={newCharacterReveal.tier?.headphones}
                bowTie={newCharacterReveal.tier?.bowTie}
                size={100}
              />
            </div>

            <h3 className="text-xl font-black text-white mb-0.5">
              {newCharacterReveal.name}
            </h3>
            <span className="text-[13px] font-bold text-slate-400 mb-3">
              Cấp {newCharacterReveal.level} • {newCharacterReveal.tier?.value?.toLocaleString() || 0} điểm
            </span>

            <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/60 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between text-[13px]">
              <span className="text-amber-200 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-400 text-base">military_tech</span>
                Thưởng Sưu Tầm Lần Đầu
              </span>
              <span className="font-black text-amber-300 font-mono text-base">
                +{newCharacterReveal.bonusJoy} JOY
              </span>
            </div>

            <button
              onClick={() => setNewCharacterReveal(null)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl border border-amber-200 shadow-[0_4px_16px_rgba(251,191,36,0.4)] min-h-[44px] flex items-center justify-center text-[13px] active:scale-95 transition-all"
            >
              Thu nhận vào Kho!
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 3: KHO SƯU TẦM & ĐUA TOP THI ĐẤU ────────────────────────── */}
      {showVaultModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 z-50 animate-fadeIn">
          <div className="max-w-[400px] w-full max-h-[92vh] bg-slate-900 border-2 border-cyan-400/60 rounded-3xl p-4 flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-cyan-400 text-lg">inventory_2</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Kho Nhân Vật Sưu Tầm</h3>
                  <span className="text-[13px] text-cyan-300 font-bold">
                    Đã mở: {unlockedVault.length}/20 nhân vật
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowVaultModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[13px]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Chuyển Tab */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <button
                onClick={() => setVaultTab("vault")}
                className={`py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  vaultTab === "vault"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                Bộ Sưu Tập ({unlockedVault.length}/20)
              </button>
              <button
                onClick={() => setVaultTab("leaderboard")}
                className={`py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  vaultTab === "leaderboard"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-base">leaderboard</span>
                Đua Top Sưu Tầm
              </button>
            </div>

            {/* Nội dung Tab */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
              {vaultTab === "vault" ? (
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(BOT_TIERS).map((tItem) => {
                    const isUnlocked = unlockedVault.includes(tItem.level);
                    return (
                      <div
                        key={tItem.level}
                        className={`relative rounded-xl p-1.5 flex flex-col items-center justify-between text-center transition-all ${
                          isUnlocked
                            ? "bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                            : "bg-slate-950/40 border border-slate-800/50 opacity-40 grayscale"
                        }`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {isUnlocked ? (
                            <BotAvatar
                              type={tItem.type}
                              color={tItem.color}
                              face={tItem.face}
                              state="working"
                              shading={tItem.shading}
                              hat={tItem.hat}
                              glasses={tItem.glasses}
                              headphones={tItem.headphones}
                              bowTie={tItem.bowTie}
                              size={44}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-600 text-2xl">
                              lock
                            </span>
                          )}
                        </div>
                        <div className="w-full mt-1">
                          <div className="text-[13px] font-bold text-slate-200 truncate">
                            {isUnlocked ? tItem.name : `Cấp ${tItem.level}`}
                          </div>
                          <div className="text-[13px] text-cyan-400 font-mono font-bold">
                            {isUnlocked ? tItem.value.toLocaleString() : "???"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {loadingLeaderboard ? (
                    <div className="py-8 text-center text-slate-400 text-[13px] flex flex-col items-center gap-2">
                      <span className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải bảng xếp hạng sưu tầm...</span>
                    </div>
                  ) : vaultLeaderboard.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-[13px]">
                      Chưa có dữ liệu thi đấu sưu tầm
                    </div>
                  ) : (
                    vaultLeaderboard.map((item, idx) => (
                      <div
                        key={item.userId || idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-[13px] ${
                          idx === 0
                            ? "bg-amber-500/10 border-amber-400/60"
                            : idx === 1
                            ? "bg-slate-300/10 border-slate-400/40"
                            : idx === 2
                            ? "bg-amber-700/10 border-amber-600/40"
                            : "bg-slate-950/60 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black font-mono text-[13px] ${
                              idx === 0
                                ? "bg-amber-400 text-slate-950"
                                : idx === 1
                                ? "bg-slate-300 text-slate-950"
                                : idx === 2
                                ? "bg-amber-600 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white truncate max-w-[130px]">
                            {item.displayName || "Thành viên"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                            {item.collectionCount || 0}/20
                          </span>
                          <span className="font-mono text-slate-400">
                            {(item.bestScore || 0).toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HẾT NƯỚC ĐI (GAME OVER) ─────────────────────────────────── */}
      {status === "gameover" && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="max-w-[340px] w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl">
            <span className="material-symbols-outlined text-rose-500 text-5xl mb-2">
              sentiment_very_dissatisfied
            </span>
            <h3 className="text-xl font-black text-white mb-2">
              Hết nước đi!
            </h3>

            <div className="w-24 h-24 my-2 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center">
              <BotAvatar
                type={highestBot.type}
                color={highestBot.color}
                face={highestBot.face}
                state={highestBot.state}
                shading={highestBot.shading}
                hat={highestBot.hat}
                glasses={highestBot.glasses}
                headphones={highestBot.headphones}
                bowTie={highestBot.bowTie}
                size={80}
              />
            </div>

            <p className="text-[13px] text-slate-400 mb-3">
              Nhân vật đỉnh nhất đạt được trong ván
            </p>

            <div className="w-full bg-slate-950 rounded-xl p-3 mb-4 flex items-center justify-around border border-slate-800 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[13px] text-slate-400">Tổng điểm</span>
                <span className="text-lg font-bold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[13px] text-slate-400">Phần thưởng</span>
                <span className="text-[13px] font-bold text-purple-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-purple-400">redeem</span>
                  Quà bí mật
                </span>
              </div>
            </div>

            <button
              onClick={restartGame}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg min-h-[44px] flex items-center justify-center text-[13px]"
            >
              Chơi Lại Ván Mới
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL CHIẾN THẮNG TỐI THƯỢNG (LEVEL 20) ───────────────────────── */}
      {status === "win" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="max-w-[340px] w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 flex flex-col items-center text-center shadow-[0_0_50px_rgba(251,191,36,0.6)]">
            <span className="material-symbols-outlined text-amber-400 text-5xl mb-2 animate-bounce">
              emoji_events
            </span>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 mb-1">
              CHIẾN THẮNG TỐI THƯỢNG!
            </h3>
            <p className="text-[13px] text-slate-300 mb-3">
              Bạn đã tạo ra nhân vật tối thượng cấp 20!
            </p>

            <div className="w-full bg-slate-950 rounded-xl p-3 mb-4 flex items-center justify-around border border-amber-500/40 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[13px] text-slate-400">Tổng điểm</span>
                <span className="text-lg font-bold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[13px] text-slate-400">Phần thưởng</span>
                <span className="text-[13px] font-bold text-amber-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-amber-400">emoji_events</span>
                  Quà bí mật tối thượng
                </span>
              </div>
            </div>

            <button
              onClick={restartGame}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black rounded-xl shadow-lg min-h-[44px] flex items-center justify-center text-[13px]"
            >
              Chơi Ván Mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
