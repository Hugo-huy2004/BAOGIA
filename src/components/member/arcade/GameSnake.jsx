import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import { playGameMerge, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMerge, hapticWin, hapticLose, hapticMove } from "../../../utils/haptics";

const GOALS = { easy: 8, medium: 14, hard: 20 };
const GRID = 18;
// Milliseconds per cell move — RAF advances only when this elapsed
const TICK_MS = { easy: 155, medium: 108, hard: 72 };

const DIR = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y:  1 },
  left:  { x: -1, y:  0 },
  right: { x: 1,  y:  0 },
};

function randomCell(occupied) {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (occupied.some(c => c.x === cell.x && c.y === cell.y));
  return cell;
}

// Neon palette cycling along the snake body
const HEAD_COLOR  = "#ffffff";
const FOOD_COLOR  = "#f43f5e";
const BODY_COLORS = ["#22d3ee","#a78bfa","#34d399","#f472b6","#60a5fa","#fb923c"];

export default function GameSnake({ difficulty, onGameOver }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [playing, setPlaying]     = useState(false);
  const tickMs = TICK_MS[difficulty] ?? TICK_MS.medium;
  const reportedRef = useRef(false);

  // All mutable game state lives here so the RAF closure always reads fresh values
  const state = useRef({
    snake:   [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
    dir:     DIR.right,
    nextDir: DIR.right,
    food:    { x: 12, y: 9 },
    score:   0,
    lastTick: 0, // timestamp of last grid step
  });

  // ── RAF game loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const s      = state.current;
    s.lastTick   = 0;

    // Fit canvas to container
    const size    = canvas.offsetWidth;
    canvas.width  = size;
    canvas.height = size;
    const cell    = size / GRID;

    const draw = () => {
      // 3D Background with Subtle Perspective Grid
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth   = 1;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
      }

      // 3D Spherical Food with Glow & Stem
      const fx = (s.food.x + 0.5) * cell;
      const fy = (s.food.y + 0.5) * cell;
      const fr = cell * 0.42;

      ctx.shadowColor = FOOD_COLOR;
      ctx.shadowBlur  = 18;
      const foodGrad = ctx.createRadialGradient(fx - fr * 0.3, fy - fr * 0.3, fr * 0.1, fx, fy, fr);
      foodGrad.addColorStop(0, "#ffffff");
      foodGrad.addColorStop(0.4, "#fb7185");
      foodGrad.addColorStop(1, "#e11d48");

      ctx.fillStyle = foodGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Real Snake Body & Head (Continuous snake with head, glowing eyes, tongue, scale joints, and tapered tail)
      const totalSegs = s.snake.length;
      for (let i = totalSegs - 1; i >= 0; i--) {
        const seg = s.snake[i];
        const cx = (seg.x + 0.5) * cell;
        const cy = (seg.y + 0.5) * cell;
        const isHead = i === 0;
        const isTail = i === totalSegs - 1;

        ctx.save();

        if (isHead) {
          // Draw Snake Head
          const angle = Math.atan2(s.dir.y, s.dir.x);
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          const r = cell * 0.48;

          // Head Glow
          ctx.shadowColor = "#FF2D55";
          ctx.shadowBlur = 18;

          // Snake Head Gradient
          const headGrad = ctx.createLinearGradient(-r, 0, r, 0);
          headGrad.addColorStop(0, "#FF2D55");
          headGrad.addColorStop(1, "#FF6B8B");

          ctx.fillStyle = headGrad;
          ctx.beginPath();
          // Bullet / Capsule Head Shape
          ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, false);
          ctx.lineTo(r * 0.6, -r * 0.7);
          ctx.quadraticCurveTo(r * 1.25, 0, r * 0.6, r * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          // Snake Eyes (White)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(r * 0.3, -r * 0.38, r * 0.22, 0, Math.PI * 2);
          ctx.arc(r * 0.3, r * 0.38, r * 0.22, 0, Math.PI * 2);
          ctx.fill();

          // Pupils (Dark & Sharp)
          ctx.fillStyle = "#0a0a0f";
          ctx.beginPath();
          ctx.arc(r * 0.38, -r * 0.38, r * 0.1, 0, Math.PI * 2);
          ctx.arc(r * 0.38, r * 0.38, r * 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Red Flicking Tongue
          ctx.strokeStyle = "#ff3b30";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(r * 1.1, 0);
          ctx.lineTo(r * 1.5, 0);
          ctx.lineTo(r * 1.75, -r * 0.22);
          ctx.moveTo(r * 1.5, 0);
          ctx.lineTo(r * 1.75, r * 0.22);
          ctx.stroke();

        } else {
          // Connected Body Segment to previous segment
          const prevSeg = s.snake[i - 1];
          const px = (prevSeg.x + 0.5) * cell;
          const py = (prevSeg.y + 0.5) * cell;

          const progress = i / totalSegs;
          const r = cell * (isTail ? 0.28 : (0.44 - progress * 0.14));
          const color = BODY_COLORS[i % BODY_COLORS.length];

          ctx.shadowColor = color;
          ctx.shadowBlur = 8;

          // Continuous Capsule Body Stroke
          ctx.strokeStyle = color;
          ctx.lineWidth = r * 1.95;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Scale Highlight Specular Drop
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.beginPath();
          ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    const step = (ts) => {
      // Initialise lastTick on first frame
      if (s.lastTick === 0) s.lastTick = ts;

      // Advance the snake only when enough time has elapsed
      if (ts - s.lastTick >= tickMs) {
        s.lastTick = ts;

        // Prevent 180° reversal
        const d = s.nextDir;
        if (!(d.x === -s.dir.x && d.y === -s.dir.y)) s.dir = d;

        const head = s.snake[0];
        const next = { x: head.x + s.dir.x, y: head.y + s.dir.y };

        // Collision checks
        if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID ||
            s.snake.some(seg => seg.x === next.x && seg.y === next.y)) {
          draw();
          const won = s.score >= GOALS[difficulty];
          if (!reportedRef.current) {
            reportedRef.current = true;
            if (won) { playGameWin(); hapticWin(); } else { playGameLose(); hapticLose(); }
            setTimeout(() => onGameOver(s.score, won ? "win" : "lose"), 600);
          }
          return; // stop requesting frames
        }

        s.snake.unshift(next);
        if (next.x === s.food.x && next.y === s.food.y) {
          s.score += 1;
          s.food  = randomCell(s.snake);
          playGameMerge();
          hapticMerge();
          // Win condition
          if (s.score >= GOALS[difficulty] && !reportedRef.current) {
            reportedRef.current = true;
            draw();
            playGameWin(); hapticWin();
            setTimeout(() => onGameOver(s.score, "win"), 600);
            return;
          }
        } else {
          s.snake.pop();
        }
      }

      draw();
      rafId = requestAnimationFrame(step);
    };

    let rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [playing, difficulty, tickMs, onGameOver]);

  // ── Keyboard controls ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    const onKey = (e) => {
      const dir = map[e.key];
      if (dir) { e.preventDefault(); state.current.nextDir = DIR[dir]; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  // ── Touch gestures via @use-gesture/react ────────────────────────────────
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

  // ── D-pad helper ──────────────────────────────────────────────────────────
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
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 select-none">
      {/* Score strip */}
      <div className="w-full flex justify-between items-center px-1">
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Mồi đã ăn</p>
          <p className="text-xl font-black text-white tabular-nums leading-tight">
            {playing ? state.current.score : 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Mục tiêu</p>
          <p className="text-xl font-black text-cyan-400 tabular-nums leading-tight">{GOALS[difficulty]}</p>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-[#080a12] rounded-2xl overflow-hidden shadow-2xl border border-white/10 touch-none"
        {...(playing ? bind() : {})}
      >
        {!playing && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <span
              className="text-white text-7xl font-black"
              style={{ textShadow: "0 0 40px #22d3ee, 0 0 80px #22d3ee" }}
            >
              {countdown}
            </span>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" />
      </div>

      {/* D-pad */}
      <div className="arcade-dpad">
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

      <p className="text-[10px] text-zinc-600 text-center">
        Vuốt trên màn hình · Phím mũi tên · Hoặc nhấn nút D-pad
      </p>
    </div>
  );
}
