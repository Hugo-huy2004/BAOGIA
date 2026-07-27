import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import { playGameMerge, playGameLose, playGameSelect } from "../../../utils/audio";
import { hapticMerge, hapticLose, hapticMove } from "../../../utils/haptics";
import { readGamePalette, withAlpha, shade } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · Mồi thường 2 điểm, mồi VÀNG 10 điểm nhưng chỉ tồn tại ~6 giây.
// · Ăn liên tiếp trong 2.6s → chuỗi liên hoàn, hệ số nhân tối đa x3.
// · Từ cấp 3 sân xuất hiện MÌN tĩnh (mỗi cấp thêm 1), chạm là chết.
// · Tốc độ và số mìn do `levelFor(score)` quyết định — không còn công thức
//   tăng tốc riêng trong file này.
const GRID = 18;
const GAME_ID = "snake";

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
function placeMines(count, snake, food, head) {
  const mines = [];
  const taken = () => [...snake, ...mines, food].filter(Boolean);
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
  const [hud, setHud] = useState({ score: 0, eaten: 0, mines: 0, combo: 0, mult: 1, notice: "" });
  const reportedRef = useRef(false);

  const state = useRef({
    snake:   [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
    dir:     DIR.right,
    nextDir: DIR.right,
    food:    { x: 12, y: 9 },
    golden:  null,          // { x, y, ttl }
    mines:   [],
    score:   0,
    eaten:   0,
    level:   1,
    lastTick: 0,
    speed: 150,
    combo: createCombo({ windowMs: 2600, step: 0.25, max: 3 }),
    particles: [],
    popups: [],
    foodPulse: 0,
    shakeX: 0,
    shakeY: 0,
    shakeMag: 0,
    flash: 0,
    trailTimer: 0,
    dead: false,
  });

  // Đẩy state ref ra HUD React — gom một chỗ để không rải setState khắp vòng lặp.
  const syncHud = useCallback((notice) => {
    const s = state.current;
    setHud((prev) => ({
      score: s.score,
      eaten: s.eaten,
      mines: s.mines.length,
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      notice: notice !== undefined ? notice : prev.notice,
    }));
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
    const bodyDeep = shade(pal.accent, -0.28);
    const headColor = pal.accent;
    const glow = (color, blur) => {
      ctx.shadowColor = pal.isLight ? "transparent" : color;
      ctx.shadowBlur = pal.isLight ? 0 : blur;
    };

    const size    = canvas.offsetWidth;
    canvas.width  = size;
    canvas.height = size;
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

    const draw = () => {
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

      ctx.fillStyle = pal.bg;
      ctx.fillRect(-10, -10, size + 20, size + 20);

      const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.7);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = pal.grid;
      ctx.lineWidth   = 0.5;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── Mìn: hình lục giác gai, nhấp nháy để không lẫn với mồi ──
      for (const m of s.mines) {
        const mx = px(m);
        const my = py(m);
        const r = cell * 0.34 * (1 + Math.sin(s.foodPulse * 3) * 0.06);
        glow(MINE, 16);
        ctx.fillStyle = MINE;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          const pxx = mx + Math.cos(a) * r;
          const pyy = my + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(pxx, pyy); else ctx.lineTo(pxx, pyy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mx - r * 0.35, my); ctx.lineTo(mx + r * 0.35, my);
        ctx.moveTo(mx, my - r * 0.35); ctx.lineTo(mx, my + r * 0.35);
        ctx.stroke();
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
        spawnTrail(s.particles, px(s.snake[0]), py(s.snake[0]), withAlpha(headColor, 0.5));
      }

      updateParticles(s.particles);
      drawParticles(ctx, s.particles);

      // Render Snake
      const totalSegs = s.snake.length;
      for (let i = totalSegs - 1; i >= 0; i--) {
        const seg = s.snake[i];
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
          const prevSeg = s.snake[i - 1];
          const pxs = px(prevSeg);
          const pys = py(prevSeg);

          const progress = i / totalSegs;
          const r = cell * (isTail ? 0.28 : (0.44 - progress * 0.14));
          // Thân rắn "nóng" dần theo combo: chuỗi càng dài càng sáng.
          const heat = Math.min(1, s.combo.chain / 8);
          const color = shade(pal.accent, 0.22 + heat * 0.25 - progress * 0.5);

          glow(color, 10 + heat * 14);

          ctx.strokeStyle = color;
          ctx.lineWidth = r * 1.95;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(pxs, pys);
          ctx.stroke();

          ctx.fillStyle = pal.isLight ? withAlpha(bodyDeep, 0.5) : "rgba(255, 255, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      ctx.restore(); // end shake transform

      // Chớp sáng khi lên cấp — báo "độ khó vừa tăng" mà không cần chữ.
      if (s.flash > 0.01) {
        ctx.fillStyle = withAlpha(pal.accent, s.flash);
        ctx.fillRect(0, 0, size, size);
        s.flash *= 0.9;
      }
    };

    let stopped = false;

    const die = () => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      s.dead = true;
      spawnBurst(s.particles, px(s.snake[0]), py(s.snake[0]), headColor, 24, 6);
      spawnBurst(s.particles, px(s.snake[0]), py(s.snake[0]), "#ffffff", 8, 3);
      s.shakeMag = 12;
      playGameLose(); hapticLose();
      setTimeout(() => onGameOver?.(s.score, "lose"), 800);
    };

    const step = (ts) => {
      if (stopped) return;
      if (s.lastTick === 0) s.lastTick = ts;

      if (s.golden) {
        s.golden.ttl -= 1;
        if (s.golden.ttl <= 0) s.golden = null;
      }

      if (ts - s.lastTick >= s.speed) {
        s.lastTick = ts;

        const d = s.nextDir;
        if (!(d.x === -s.dir.x && d.y === -s.dir.y)) s.dir = d;

        const head = s.snake[0];
        const next = { x: head.x + s.dir.x, y: head.y + s.dir.y };

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

          if (ateGolden) { s.golden = null; playGameSelect(); } else { s.food = randomCell([...s.snake, ...s.mines]); playGameMerge(); }
          hapticMerge();

          // Cứ GOLDEN_EVERY mồi thường thì thả một mồi vàng có hạn.
          if (!s.golden && s.eaten % GOLDEN_EVERY === 0) {
            s.golden = { ...randomCell([...s.snake, ...s.mines, s.food]), ttl: GOLDEN_TICKS };
          }

          // ── Độ khó tự động ──
          const level = levelFor(GAME_ID, s.score);
          if (level !== s.level) {
            s.level = level;
            s.speed = ramp(GAME_ID, level, 150, 62);
            const wanted = Math.max(0, level - 2);
            if (wanted > s.mines.length) {
              s.mines = placeMines(wanted, s.snake, s.food, next);
            }
            s.flash = 0.32;
            s.shakeMag = 6;
            syncHud(`Cấp ${level} · nhanh hơn${wanted ? ` · ${wanted} mìn` : ""}`);
            setTimeout(() => setHud((h) => ({ ...h, notice: "" })), 1800);
          } else {
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
  }, [playing, paused, onGameOver, syncHud]);

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

  const setDir = useCallback((dir) => () => { state.current.nextDir = DIR[dir]; hapticMove?.(); }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setPlaying(true);
  }, [countdown]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none">
      <ArcadeHud
        gameId={GAME_ID}
        score={hud.score}
        combo={hud.combo}
        multiplier={hud.mult}
        notice={hud.notice}
        stats={[{ label: "Mồi", value: hud.eaten }, { label: "Mìn", value: hud.mines }]}
      />

      <div
        ref={containerRef}
        className="gpanel relative w-full aspect-square rounded-2xl overflow-hidden touch-none"
        {...(playing ? bind() : {})}
      >
        {!playing && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <span
              className="text-white text-7xl font-black"
              style={{ textShadow: "0 0 40px var(--intro-accent), 0 0 80px var(--intro-accent)" }}
            >
              {countdown}
            </span>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" />
      </div>

      <div className="arcade-dpad mt-4">
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("up")}>▲</button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("left")}>◀</button>
        <div className="arcade-dpad-center" />
        <button className="arcade-dpad-btn" onPointerDown={setDir("right")}>▶</button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("down")}>▼</button>
        <div />
      </div>

      <p className="game-control-hint mt-3 text-center text-[11px]">
        Mồi vàng 10 điểm nhưng có hạn giờ · Ăn dồn để giữ chuỗi liên hoàn · Tránh mìn đỏ
      </p>
    </div>
  );
}
