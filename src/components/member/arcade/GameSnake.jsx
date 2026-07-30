import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import { playGameMerge, playGameLose, playGameSelect } from "../../../utils/audio";
import { hapticMerge, hapticLose, hapticMove } from "../../../utils/haptics";
import { readGamePalette, withAlpha, shade } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// Snake 3D Pro is a chapter-based endless run. Every six pickups the arena
// changes its visual world and introduces a new rule (mines, portals, golden
// hunts or hyper speed), while the shared arcade level curve keeps increasing
// the base difficulty.
const GRID = 18;
const GAME_ID = "snake";
const STAGE_GOAL = 6;

const DIR = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y:  1 },
  left:  { x: -1, y:  0 },
  right: { x: 1,  y:  0 },
};

const FOOD_CORE = "#ff6b75";
const FOOD_EDGE = "#d94461";
const GOLD = "#ffc73a";
const GOLD_EDGE = "#e08c00";
const MINE = "#ff3b30";

const GOLDEN_EVERY = 5;      // cứ 5 mồi thường thì tới lượt mồi vàng
const GOLDEN_TICKS = 380;    // ~6.3s ở 60fps trước khi mồi vàng biến mất

const STAGES = [
  {
    name: "Vườn Neon",
    kicker: "CHẶNG KHỞI ĐỘNG",
    mission: "Thu thập 6 lõi năng lượng",
    hint: "Giữ nhịp ăn để kích hoạt combo.",
    accent: "#a78bfa",
    accent2: "#22d3ee",
    bg: "#090619",
    mines: 0,
    speed: 1,
  },
  {
    name: "Bãi Mìn Đỏ",
    kicker: "THỬ THÁCH SINH TỒN",
    mission: "Lách qua mìn và ăn đủ 6 mồi",
    hint: "Mìn đỏ phát sáng nhưng không thể phá.",
    accent: "#fb7185",
    accent2: "#f97316",
    bg: "#18070d",
    mines: 2,
    speed: 0.96,
  },
  {
    name: "Cổng Lượng Tử",
    kicker: "THỬ THÁCH DỊCH CHUYỂN",
    mission: "Làm chủ cặp cổng không gian",
    hint: "Đi vào một cổng để xuất hiện ở cổng còn lại.",
    accent: "#22d3ee",
    accent2: "#818cf8",
    bg: "#04141c",
    mines: 1,
    portals: true,
    speed: 0.92,
  },
  {
    name: "Săn Vàng",
    kicker: "THỬ THÁCH TỐC ĐỘ",
    mission: "Săn lõi vàng trước khi biến mất",
    hint: "Lõi vàng cho 10 điểm và duy trì combo lớn.",
    accent: "#fbbf24",
    accent2: "#fb7185",
    bg: "#181006",
    mines: 2,
    goldenEvery: 3,
    speed: 0.88,
  },
  {
    name: "Hyper Grid",
    kicker: "CHẶNG TỐI THƯỢNG",
    mission: "Sống sót trong lưới siêu tốc",
    hint: "Tốc độ cao, nhiều mìn và cổng dịch chuyển.",
    accent: "#34d399",
    accent2: "#a3e635",
    bg: "#04150f",
    mines: 3,
    portals: true,
    goldenEvery: 3,
    speed: 0.8,
  },
];

const stageNumberFor = (eaten) => Math.floor(eaten / STAGE_GOAL) + 1;
const stageThemeFor = (stageNumber) => STAGES[(stageNumber - 1) % STAGES.length];
const stageProgressFor = (eaten) => eaten % STAGE_GOAL;

const sameCell = (a, b) => a.x === b.x && a.y === b.y;

function randomCell(occupied) {
  let cell;
  let guard = 0;
  do {
    cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    guard++;
  } while (occupied.some((c) => sameCell(c, cell)) && guard < 500);
  return cell;
}

// Mìn phải ở xa đầu rắn, nếu không người chơi chết oan ngay khi vừa lên cấp.
function placeMines(count, snake, food, head, extraAvoid = []) {
  const mines = [];
  const taken = () => [...snake, ...mines, food, ...extraAvoid].filter(Boolean);
  for (let i = 0; i < count; i++) {
    let cell;
    let guard = 0;
    do {
      cell = randomCell(taken());
      guard++;
    } while (guard < 60 && Math.abs(cell.x - head.x) + Math.abs(cell.y - head.y) < 6);
    mines.push(cell);
  }
  return mines;
}

function placePortals(snake, food, mines, golden) {
  const occupied = [...snake, food, golden, ...mines].filter(Boolean);
  const first = randomCell(occupied);
  let second = randomCell([...occupied, first]);
  let guard = 0;
  while (guard < 80 && Math.abs(first.x - second.x) + Math.abs(first.y - second.y) < 10) {
    second = randomCell([...occupied, first]);
    guard += 1;
  }
  return [first, second];
}

// ── Particle helpers ──────────────────────────────────────────────
function spawnBurst(particles, x, y, color, count = 12, speed = 4) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const v = speed * (0.5 + Math.random() * 0.8);
    particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function spawnTrail(particles, x, y, color) {
  particles.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    life: 1,
    decay: 0.04 + Math.random() * 0.02,
    size: 1.5 + Math.random() * 2,
    color,
  });
}

function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.8;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export default function GameSnake({ paused = false, onGameOver }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [playing, setPlaying]     = useState(false);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [stageBanner, setStageBanner] = useState(null);
  const bannerTimerRef = useRef(null);
  const [hud, setHud] = useState({
    score: 0, eaten: 0, mines: 0, combo: 0, mult: 1, notice: "",
    stage: 1, stageProgress: 0,
  });
  const reportedRef = useRef(false);

  const state = useRef({
    snake:   [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
    dir:     DIR.right,
    nextDir: DIR.right,
    food:    { x: 12, y: 9 },
    golden:  null,          // { x, y, ttl }
    mines:   [],
    portals: [],
    score:   0,
    eaten:   0,
    level:   1,
    stage:   1,
    lastTick: 0,
    speed: 150,
    prevSnake: null,
    combo: createCombo({ windowMs: 2600, step: 0.25, max: 3 }),
    particles: [],
    popups: [],
    foodPulse: 0,
    shakeX: 0,
    shakeY: 0,
    shakeMag: 0,
    flash: 0,
    stagePauseUntil: 0,
    trailTimer: 0,
    dead: false,
  });

  const announceStage = useCallback((stageNumber) => {
    const theme = stageThemeFor(stageNumber);
    setStageBanner({ ...theme, number: stageNumber });
    window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setStageBanner(null), 2300);
  }, []);

  // Đẩy state ref ra HUD React — gom một chỗ để không rải setState khắp vòng lặp.
  const syncHud = useCallback((notice) => {
    const s = state.current;
    setHud((prev) => ({
      score: s.score,
      eaten: s.eaten,
      mines: s.mines.length,
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      stage: s.stage,
      stageProgress: stageProgressFor(s.eaten),
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, []);

  useEffect(() => () => window.clearTimeout(bannerTimerRef.current), []);

  useEffect(() => {
    let timer;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLayoutRevision((revision) => revision + 1), 160);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ── RAF game loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const s      = state.current;
    s.lastTick   = 0;

    const pal = readGamePalette(canvas);
    const glow = (color, blur) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    };

    const size = Math.max(280, Math.round(canvas.getBoundingClientRect().width));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const cell    = size / GRID;
    const px = (c) => (c.x + 0.5) * cell;
    const py = (c) => (c.y + 0.5) * cell;

    const drawOrb = (x, y, r, core, edge, ring) => {
      ctx.strokeStyle = withAlpha(ring, 0.15 + Math.sin(s.foodPulse * 2) * 0.1);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * (1.6 + Math.sin(s.foodPulse * 2) * 0.3), 0, Math.PI * 2);
      ctx.stroke();

      glow(core, 22);
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, core);
      grad.addColorStop(0.8, edge);
      grad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (pal.isLight) {
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const drawPortal = (portal, color, index) => {
      const x = px(portal);
      const y = py(portal);
      const spin = s.foodPulse * (index ? -1.2 : 1.2);
      const radius = cell * 0.42;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);
      glow(color, 24);
      for (let ring = 0; ring < 3; ring++) {
        ctx.strokeStyle = withAlpha(ring === 1 ? "#ffffff" : color, 0.9 - ring * 0.22);
        ctx.lineWidth = Math.max(1.5, cell * (0.12 - ring * 0.025));
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * (1 + ring * 0.28), radius * (0.48 + ring * 0.12), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = withAlpha(color, 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    };

    const draw = (now = performance.now()) => {
      const theme = stageThemeFor(s.stage);
      const headColor = theme.accent;
      const bodyDeep = shade(headColor, -0.28);
      s.foodPulse = (s.foodPulse + 0.04) % (Math.PI * 2);
      const pulseScale = 1 + Math.sin(s.foodPulse) * 0.12;
      s.combo.tick();

      if (s.shakeMag > 0.1) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag;
        s.shakeMag *= 0.88;
      } else {
        s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0;
      }

      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      const world = ctx.createLinearGradient(0, 0, size, size);
      world.addColorStop(0, theme.bg);
      world.addColorStop(0.54, shade(theme.bg, 0.12));
      world.addColorStop(1, shade(theme.bg, -0.18));
      ctx.fillStyle = world;
      ctx.fillRect(-10, -10, size + 20, size + 20);

      const atmosphere = ctx.createRadialGradient(size * 0.2, size * 0.12, 0, size * 0.2, size * 0.12, size * 0.72);
      atmosphere.addColorStop(0, withAlpha(theme.accent, 0.2));
      atmosphere.addColorStop(0.52, withAlpha(theme.accent2, 0.06));
      atmosphere.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, size, size);

      const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.7);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.48)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, size, size);

      // Layered grid and offset highlights give the flat collision board a
      // beveled, holographic-floor depth without requiring a WebGL bundle.
      ctx.strokeStyle = withAlpha(theme.accent2, 0.23);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
      }
      ctx.translate(0, 1.5);
      ctx.strokeStyle = "rgba(255,255,255,.045)";
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
      }
      ctx.translate(0, -1.5);
      ctx.globalAlpha = 1;

      if (s.portals.length === 2) {
        drawPortal(s.portals[0], theme.accent, 0);
        drawPortal(s.portals[1], theme.accent2, 1);
      }

      // ── Mìn: hình lục giác gai, nhấp nháy để không lẫn với mồi ──
      for (const m of s.mines) {
        const mx = px(m);
        const my = py(m);
        const r = cell * 0.34 * (1 + Math.sin(s.foodPulse * 3) * 0.06);
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(s.foodPulse * 0.7);
        glow(MINE, 18);
        const mineGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, 0, 0, r);
        mineGrad.addColorStop(0, "#ffffff");
        mineGrad.addColorStop(0.2, "#ff8a80");
        mineGrad.addColorStop(0.62, MINE);
        mineGrad.addColorStop(1, "#5c0610");
        ctx.fillStyle = mineGrad;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          const pxx = Math.cos(a) * r;
          const pyy = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(pxx, pyy); else ctx.lineTo(pxx, pyy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, 0); ctx.lineTo(r * 0.35, 0);
        ctx.moveTo(0, -r * 0.35); ctx.lineTo(0, r * 0.35);
        ctx.stroke();
        ctx.restore();
      }

      // ── Mồi thường ──
      drawOrb(px(s.food), py(s.food), cell * 0.42 * pulseScale, FOOD_CORE, FOOD_EDGE, FOOD_CORE);

      // ── Mồi vàng + vòng đếm ngược ──
      if (s.golden) {
        const gx = px(s.golden);
        const gy = py(s.golden);
        const gr = cell * 0.46 * pulseScale;
        drawOrb(gx, gy, gr, GOLD, GOLD_EDGE, GOLD);
        const left = s.golden.ttl / GOLDEN_TICKS;
        ctx.strokeStyle = left > 0.3 ? GOLD : MINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(gx, gy, gr * 1.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
        ctx.stroke();
      }

      s.trailTimer++;
      if (!s.dead && s.trailTimer % 3 === 0 && s.snake.length > 0) {
        spawnTrail(s.particles, px(s.snake[0]), py(s.snake[0]), withAlpha(theme.accent, 0.62));
      }

      updateParticles(s.particles);
      drawParticles(ctx, s.particles);

      // Render Snake
      const tween = s.dead ? 1 : Math.min(1, Math.max(0, (now - s.lastTick) / s.speed));
      const displaySnake = s.snake.map((seg, index) => {
        const previous = s.prevSnake?.[index] || s.prevSnake?.[s.prevSnake.length - 1] || seg;
        return {
          x: previous.x + (seg.x - previous.x) * tween,
          y: previous.y + (seg.y - previous.y) * tween,
        };
      });
      const totalSegs = displaySnake.length;
      for (let i = totalSegs - 1; i >= 0; i--) {
        const seg = displaySnake[i];
        const cx = px(seg);
        const cy = py(seg);
        const isHead = i === 0;
        const isTail = i === totalSegs - 1;

        ctx.save();

        if (isHead) {
          const angle = Math.atan2(s.dir.y, s.dir.x);
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          const r = cell * 0.48;

          glow(headColor, 24);
          ctx.strokeStyle = withAlpha(headColor, 0.2);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
          ctx.stroke();

          glow(headColor, 18);
          const headGrad = ctx.createLinearGradient(-r, 0, r, 0);
          headGrad.addColorStop(0, shade(headColor, -0.15));
          headGrad.addColorStop(0.5, headColor);
          headGrad.addColorStop(1, shade(headColor, 0.25));

          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
          ctx.lineTo(r * 0.6, -r * 0.7);
          ctx.quadraticCurveTo(r * 1.25, 0, r * 0.6, r * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          if (pal.isLight) {
            ctx.strokeStyle = bodyDeep;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(r * 0.3, -r * 0.38, r * 0.22, 0, Math.PI * 2);
          ctx.arc(r * 0.3, r * 0.38, r * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = "#0a0a0f";
          ctx.beginPath();
          ctx.arc(r * 0.38, -r * 0.38, r * 0.1, 0, Math.PI * 2);
          ctx.arc(r * 0.38, r * 0.38, r * 0.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = FOOD_CORE;
          ctx.shadowColor = FOOD_CORE;
          ctx.shadowBlur = 6;
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(r * 1.1, 0);
          ctx.lineTo(r * 1.5, 0);
          ctx.lineTo(r * 1.75, -r * 0.22);
          ctx.moveTo(r * 1.5, 0);
          ctx.lineTo(r * 1.75, r * 0.22);
          ctx.stroke();
          ctx.shadowBlur = 0;

        } else {
          const prevSeg = displaySnake[i - 1];
          const pxs = px(prevSeg);
          const pys = py(prevSeg);

          const progress = i / totalSegs;
          const r = cell * (isTail ? 0.28 : (0.44 - progress * 0.14));
          // Thân rắn "nóng" dần theo combo: chuỗi càng dài càng sáng.
          const heat = Math.min(1, s.combo.chain / 8);
          const color = shade(theme.accent, 0.22 + heat * 0.25 - progress * 0.5);

          glow(color, 10 + heat * 14);

          // Dark under-stroke + lit capsule + radial segment cap create a
          // continuous tube with visible depth even on small phones.
          ctx.strokeStyle = "rgba(0,0,0,.38)";
          ctx.lineWidth = r * 2.35;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx + r * 0.12, cy + r * 0.28);
          ctx.lineTo(pxs + r * 0.12, pys + r * 0.28);
          ctx.stroke();

          ctx.strokeStyle = color;
          ctx.lineWidth = r * 1.95;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(pxs, pys);
          ctx.stroke();

          const segmentGrad = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.42, r * 0.05, cx, cy, r);
          segmentGrad.addColorStop(0, "#ffffff");
          segmentGrad.addColorStop(0.2, shade(color, 0.34));
          segmentGrad.addColorStop(0.7, color);
          segmentGrad.addColorStop(1, bodyDeep);
          ctx.fillStyle = segmentGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      ctx.restore(); // end shake transform

      // Chớp sáng khi lên cấp — báo "độ khó vừa tăng" mà không cần chữ.
      if (s.flash > 0.01) {
        ctx.fillStyle = withAlpha(theme.accent, s.flash);
        ctx.fillRect(0, 0, size, size);
        s.flash *= 0.9;
      }
    };

    let stopped = false;

    const die = () => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      s.dead = true;
      const deathColor = stageThemeFor(s.stage).accent;
      spawnBurst(s.particles, px(s.snake[0]), py(s.snake[0]), deathColor, 24, 6);
      spawnBurst(s.particles, px(s.snake[0]), py(s.snake[0]), "#ffffff", 8, 3);
      s.shakeMag = 12;
      playGameLose(); hapticLose();
      setTimeout(() => onGameOver?.(s.score, "lose"), 800);
    };

    const step = (ts) => {
      if (stopped) return;
      if (s.lastTick === 0) s.lastTick = ts;

      if (s.stagePauseUntil > ts) {
        s.lastTick = ts;
        draw(ts);
        rafId = requestAnimationFrame(step);
        return;
      }

      if (s.golden) {
        s.golden.ttl -= 1;
        if (s.golden.ttl <= 0) s.golden = null;
      }

      if (ts - s.lastTick >= s.speed) {
        s.prevSnake = s.snake.map((segment) => ({ ...segment }));
        s.lastTick = ts;

        const d = s.nextDir;
        if (!(d.x === -s.dir.x && d.y === -s.dir.y)) s.dir = d;

        const head = s.snake[0];
        const rawNext = { x: head.x + s.dir.x, y: head.y + s.dir.y };
        let next = rawNext;

        const portalIndex = s.portals.findIndex((portal) => sameCell(portal, rawNext));
        if (portalIndex >= 0 && s.portals.length === 2) {
          const exit = s.portals[portalIndex === 0 ? 1 : 0];
          next = { x: exit.x + s.dir.x, y: exit.y + s.dir.y };
          if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
            next = { ...exit };
          }
          const portalTheme = stageThemeFor(s.stage);
          spawnBurst(s.particles, px(rawNext), py(rawNext), portalTheme.accent, 18, 4);
          spawnBurst(s.particles, px(exit), py(exit), portalTheme.accent2, 18, 4);
          s.flash = 0.16;
          s.shakeMag = 4;
          hapticMove?.();
        }

        const hitWall = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID;
        const hitSelf = s.snake.some((seg) => sameCell(seg, next));
        const hitMine = s.mines.some((m) => sameCell(m, next));

        if (hitWall || hitSelf || hitMine) {
          if (hitMine) s.flash = 0.5;
          die();
          draw();
          if (s.particles.length > 0) rafId = requestAnimationFrame(step);
          return;
        }

        s.snake.unshift(next);

        const ateGolden = s.golden && sameCell(s.golden, next);
        const ateFood = sameCell(s.food, next);

        if (ateGolden || ateFood) {
          const mult = s.combo.hit(ts);
          const base = ateGolden ? 10 : 2;
          const gained = Math.round(base * mult);
          s.score += gained;
          s.eaten += 1;

          const fx = px(next);
          const fy = py(next);
          spawnBurst(s.particles, fx, fy, ateGolden ? GOLD : FOOD_CORE, ateGolden ? 26 : 16, ateGolden ? 6 : 5);
          spawnBurst(s.particles, fx, fy, "#ffffff", 6, 3);
          pushPopup(s.popups, fx, fy - cell * 0.5, `+${gained}`, ateGolden ? GOLD : "#ffffff", ateGolden ? 19 : 15);
          if (s.combo.chain >= 1) {
            pushPopup(s.popups, fx, fy - cell * 1.4, `x${s.combo.mult.toFixed(2).replace(/\.?0+$/, "")}`, pal.accent, 13);
          }
          s.shakeMag = ateGolden ? 8 : 4;

          if (ateGolden) {
            s.golden = null;
            playGameSelect();
          } else {
            s.food = randomCell([...s.snake, ...s.mines, ...s.portals]);
            playGameMerge();
          }
          hapticMerge();

          const activeTheme = stageThemeFor(s.stage);
          const goldenEvery = activeTheme.goldenEvery || GOLDEN_EVERY;
          if (!s.golden && s.eaten % goldenEvery === 0) {
            s.golden = { ...randomCell([...s.snake, ...s.mines, ...s.portals, s.food]), ttl: GOLDEN_TICKS };
          }

          // ── Chapter + automatic difficulty ──
          const nextStage = stageNumberFor(s.eaten);
          const level = levelFor(GAME_ID, s.score);
          const stageChanged = nextStage !== s.stage;
          const levelChanged = level !== s.level;
          s.level = level;

          if (stageChanged) {
            s.stage = nextStage;
            const nextTheme = stageThemeFor(nextStage);
            const endlessBonus = Math.floor((nextStage - 1) / STAGES.length);
            const wanted = nextTheme.mines + endlessBonus;
            s.mines = placeMines(wanted, s.snake, s.food, next, [...s.portals, s.golden]);
            s.portals = nextTheme.portals ? placePortals(s.snake, s.food, s.mines, s.golden) : [];
            if (s.portals.length) {
              s.mines = placeMines(wanted, s.snake, s.food, next, [...s.portals, s.golden]);
            }
            if (nextTheme.goldenEvery && !s.golden) {
              s.golden = {
                ...randomCell([...s.snake, ...s.mines, ...s.portals, s.food]),
                ttl: GOLDEN_TICKS,
              };
            }
            s.flash = 0.32;
            s.shakeMag = 9;
            s.stagePauseUntil = ts + 1650;
            announceStage(nextStage);
            syncHud(`${nextTheme.name} · thử thách mới đã mở`);
            setTimeout(() => setHud((h) => ({ ...h, notice: "" })), 1800);
          }

          const currentTheme = stageThemeFor(s.stage);
          s.speed = ramp(GAME_ID, level, 150, 62) * currentTheme.speed;

          if (levelChanged && !stageChanged) {
            const endlessBonus = Math.floor((s.stage - 1) / STAGES.length);
            const wanted = currentTheme.mines + endlessBonus + Math.max(0, Math.floor((level - 1) / 4));
            if (wanted > s.mines.length) {
              s.mines = placeMines(wanted, s.snake, s.food, next, [...s.portals, s.golden]);
            }
            s.flash = 0.22;
            syncHud(`Cấp ${level} · tốc độ và thử thách tăng`);
            setTimeout(() => setHud((h) => ({ ...h, notice: "" })), 1800);
          } else if (!stageChanged) {
            syncHud();
          }
        } else {
          s.snake.pop();
        }
      }

      draw();
      rafId = requestAnimationFrame(step);
    };

    let rafId = requestAnimationFrame(step);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [playing, paused, onGameOver, syncHud, announceStage, layoutRevision]);

  // Combo rơi theo thời gian thực nên HUD phải nhịp riêng, không chờ lần ăn kế.
  useEffect(() => {
    if (!playing || paused) return undefined;
    const id = setInterval(() => syncHud(), 200);
    return () => clearInterval(id);
  }, [playing, paused, syncHud]);

  // ── Keyboard controls ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || paused) return;
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    const onKey = (e) => {
      const dir = map[e.key];
      if (dir) { e.preventDefault(); state.current.nextDir = DIR[dir]; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, paused]);

  // ── Touch gestures ────────────────────────────────────────────────────────
  const gestureState = useRef({ startX: 0, startY: 0, fired: false });
  const bind = useGesture({
    onDragStart: ({ xy: [x, y] }) => {
      gestureState.current = { startX: x, startY: y, fired: false };
    },
    onDrag: ({ xy: [x, y] }) => {
      const g = gestureState.current;
      if (g.fired) return;
      const dx = x - g.startX, dy = y - g.startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      g.fired = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        state.current.nextDir = DIR[dx > 0 ? "right" : "left"];
      } else {
        state.current.nextDir = DIR[dy > 0 ? "down" : "up"];
      }
      hapticMove?.();
    },
  }, { drag: { filterTaps: true } });

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setPlaying(true);
  }, [countdown]);

  const activeStage = stageThemeFor(hud.stage);
  const stagePercent = Math.round((hud.stageProgress / STAGE_GOAL) * 100);

  return (
    <div
      ref={containerRef}
      className="snake-game select-none"
      style={{ "--snake-stage": activeStage.accent, "--snake-stage-2": activeStage.accent2 }}
    >
      <div className="snake-ambient" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>

      <section className="snake-main">
        <ArcadeHud
          gameId={GAME_ID}
          score={hud.score}
          combo={hud.combo}
          multiplier={hud.mult}
          notice={hud.notice}
          stats={[{ label: "Mồi", value: hud.eaten }, { label: "Chặng", value: hud.stage }]}
        />

        <div
          className="gpanel snake-board-3d relative w-full aspect-square overflow-hidden touch-none"
          {...(playing ? bind() : {})}
        >
          <div className="snake-board-shine" aria-hidden="true" />
          {!playing && countdown > 0 && (
            <div className="snake-countdown absolute inset-0 flex items-center justify-center z-10">
              <div>
                <small>SẴN SÀNG</small>
                <span>{countdown}</span>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" />
          <div className="snake-scanline" aria-hidden="true" />
        </div>
      </section>

      <aside className="snake-mission" aria-label={`Chặng ${hud.stage}: ${activeStage.name}`}>
        <div className="snake-mission__top">
          <span className="snake-mission__number">{String(hud.stage).padStart(2, "0")}</span>
          <div>
            <small>{activeStage.kicker}</small>
            <h3>{activeStage.name}</h3>
          </div>
        </div>

        <div className="snake-mission__challenge">
          <span className="material-symbols-outlined">flag</span>
          <div>
            <small>NHIỆM VỤ HIỆN TẠI</small>
            <strong>{activeStage.mission}</strong>
          </div>
        </div>

        <div className="snake-mission__progress">
          <div>
            <span>TIẾN ĐỘ CHẶNG</span>
            <b>{hud.stageProgress}/{STAGE_GOAL}</b>
          </div>
          <div className="snake-mission__rail"><span style={{ width: `${stagePercent}%` }} /></div>
        </div>

        <p className="snake-mission__hint">
          <span className="material-symbols-outlined">tips_and_updates</span>
          {activeStage.hint}
        </p>

        <div className="snake-mission__legend">
          <span><i className="is-food" />+2 lõi thường</span>
          <span><i className="is-gold" />+10 lõi vàng</span>
          <span><i className="is-mine" />Mìn: kết thúc</span>
          {activeStage.portals && <span><i className="is-portal" />Cổng dịch chuyển</span>}
        </div>

        <p className="game-control-hint snake-controls">
          Vuốt hoặc dùng phím WASD / mũi tên
        </p>
      </aside>

      {stageBanner && (
        <div className="snake-stage-banner" role="status">
          <div className="snake-stage-banner__rings" aria-hidden="true" />
          <small>CHẶNG {String(stageBanner.number).padStart(2, "0")}</small>
          <h2>{stageBanner.name}</h2>
          <p>{stageBanner.mission}</p>
        </div>
      )}
    </div>
  );
}
