import React, { useEffect, useRef, useState } from "react";
import { playGameMerge, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";

const GOALS = { easy: 8, medium: 14, hard: 20 };
const GRID = 18;
const TICK_MS = { easy: 160, medium: 115, hard: 80 };

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomCell(occupied) {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (occupied.some(c => c.x === cell.x && c.y === cell.y));
  return cell;
}

export default function GameSnake({ difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const [playing, setPlaying] = useState(false);
  const tickMs = TICK_MS[difficulty] || TICK_MS.medium;

  const state = useRef({
    snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
    dir: DIRS.right,
    nextDir: DIRS.right,
    food: { x: 12, y: 9 },
    score: 0,
  });

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    setPlaying(true);
  }, [timeLeft]);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.offsetWidth;
    canvas.width = size;
    canvas.height = size;
    const cell = size / GRID;
    const s = state.current;

    const draw = () => {
      ctx.fillStyle = "#080a12";
      ctx.fillRect(0, 0, size, size);

      // Food
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc((s.food.x + 0.5) * cell, (s.food.y + 0.5) * cell, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      s.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? "#fff" : `rgba(34, 211, 238, ${Math.max(0.45, 1 - i * 0.04)})`;
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 1.5, seg.y * cell + 1.5, cell - 3, cell - 3, 5);
        ctx.fill();
      });
    };

    const step = () => {
      // Prevent reversing directly into the body in the same tick
      if (!(s.nextDir.x === -s.dir.x && s.nextDir.y === -s.dir.y)) {
        s.dir = s.nextDir;
      }
      const head = s.snake[0];
      const next = { x: head.x + s.dir.x, y: head.y + s.dir.y };

      const hitWall = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID;
      const hitSelf = s.snake.some(seg => seg.x === next.x && seg.y === next.y);
      if (hitWall || hitSelf) {
        setPlaying(false);
        const score = s.score;
        const won = score >= GOALS[difficulty];
        if (won) { playGameWin(); hapticWin(); } else { playGameLose(); hapticLose(); }
        setTimeout(() => onGameOver(score, won ? "win" : "lose"), 600);
        return false;
      }

      s.snake.unshift(next);
      if (next.x === s.food.x && next.y === s.food.y) {
        s.score += 1;
        s.food = randomCell(s.snake);
        playGameMerge();
        hapticMerge();
      } else {
        s.snake.pop();
      }
      return true;
    };

    draw();
    const interval = setInterval(() => {
      if (step()) draw();
      else clearInterval(interval);
    }, tickMs);

    return () => clearInterval(interval);
  }, [playing, difficulty, tickMs, onGameOver]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); state.current.nextDir = DIRS[dir]; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Swipe-to-turn on the canvas itself, as an alternative to the D-pad
  const swipeStart = useRef(null);
  const handlePointerDown = (e) => { swipeStart.current = { x: e.clientX, y: e.clientY }; };
  const handlePointerUp = (e) => {
    if (!swipeStart.current) return;
    const dx = e.clientX - swipeStart.current.x;
    const dy = e.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.hypot(dx, dy) < 18) return;
    state.current.nextDir = Math.abs(dx) > Math.abs(dy) ? DIRS[dx > 0 ? "right" : "left"] : DIRS[dy > 0 ? "down" : "up"];
  };

  const setDir = (dir) => () => { state.current.nextDir = DIRS[dir]; };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="arcade-game-container relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-white/10 touch-none">
        {!playing && timeLeft > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-white text-6xl font-bold animate-ping">{timeLeft}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
      </div>

      {/* Virtual D-pad — tap to turn (grid movement, not a hold-to-move control) */}
      <div className="arcade-dpad">
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("up")}>
          ▲
        </button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("left")}>
          ◀
        </button>
        <div className="arcade-dpad-center" />
        <button className="arcade-dpad-btn" onPointerDown={setDir("right")}>
          ▶
        </button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={setDir("down")}>
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}
