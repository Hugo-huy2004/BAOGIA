import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import { playGameMove, playGameMerge, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";

// ── Board constants ─────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const CELL = 28; // logical px; canvas scales to container

// ── SRS Tetrominoes ──────────────────────────────────────────────────────────
const PIECES = {
  I: { color: "#00f5ff", cells: [[0,1],[1,1],[2,1],[3,1]], rotations: [[[0,1],[1,1],[2,1],[3,1]],[[2,0],[2,1],[2,2],[2,3]],[[0,2],[1,2],[2,2],[3,2]],[[1,0],[1,1],[1,2],[1,3]]] },
  O: { color: "#ffe600", cells: [[1,0],[2,0],[1,1],[2,1]], rotations: [[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]]] },
  T: { color: "#b026ff", cells: [[1,0],[0,1],[1,1],[2,1]], rotations: [[[1,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2]]] },
  S: { color: "#39ff88", cells: [[1,0],[2,0],[0,1],[1,1]], rotations: [[[1,0],[2,0],[0,1],[1,1]],[[1,0],[1,1],[2,1],[2,2]],[[1,1],[2,1],[0,2],[1,2]],[[0,0],[0,1],[1,1],[1,2]]] },
  Z: { color: "#ff2e63", cells: [[0,0],[1,0],[1,1],[2,1]], rotations: [[[0,0],[1,0],[1,1],[2,1]],[[2,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[0,2]]] },
  J: { color: "#4d6bff", cells: [[0,0],[0,1],[1,1],[2,1]], rotations: [[[0,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]],[[1,0],[1,1],[0,2],[1,2]]] },
  L: { color: "#ff8a00", cells: [[2,0],[0,1],[1,1],[2,1]], rotations: [[[2,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,1],[0,2]],[[0,0],[1,0],[1,1],[1,2]]] },
};
const PIECE_KEYS = Object.keys(PIECES);

// Drop intervals (ms per row) per difficulty
const DROP_MS = { easy: 700, medium: 350, hard: 150 };
// Lines needed to win per difficulty
const LINE_GOALS = { easy: 5, medium: 10, hard: 20 };

// ── Pure game helpers ────────────────────────────────────────────────────────
function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const p = PIECES[key];
  return { key, color: p.color, rot: 0, cells: p.rotations[0], ox: 3, oy: 0 };
}

function absoluteCells(piece) {
  return piece.cells.map(([x, y]) => [x + piece.ox, y + piece.oy]);
}

function isValid(board, piece) {
  return absoluteCells(piece).every(([x, y]) =>
    x >= 0 && x < COLS && y >= 0 && y < ROWS && !board[y]?.[x]
  );
}

function rotatePiece(piece) {
  const def = PIECES[piece.key];
  const nextRot = (piece.rot + 1) % 4;
  return { ...piece, rot: nextRot, cells: def.rotations[nextRot] };
}

function lockPiece(board, piece) {
  const next = board.map(r => [...r]);
  absoluteCells(piece).forEach(([x, y]) => { if (y >= 0 && y < ROWS) next[y][x] = piece.color; });
  return next;
}

function clearLines(board) {
  const kept = board.filter(row => row.some(c => !c));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...empty, ...kept], cleared };
}

const LINE_SCORE = [0, 100, 300, 500, 800];

// ── Canvas renderer ──────────────────────────────────────────────────────────
function renderFrame(ctx, W, H, board, piece, ghost, score, linesCleared, lineGoal) {
  // Background
  ctx.fillStyle = "#080a12";
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
  for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }

  // Locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = board[r][c];
      if (!color) continue;
      drawCell(ctx, c, r, color, 1.0);
    }
  }

  // Ghost piece
  if (ghost) {
    absoluteCells(ghost).forEach(([x, y]) => {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3);
    });
  }

  // Active piece
  if (piece) {
    absoluteCells(piece).forEach(([x, y]) => { if (y >= 0) drawCell(ctx, x, y, piece.color, 1.0); });
  }
}

function drawCell(ctx, col, row, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(col * CELL + 1.5, row * CELL + 1.5, CELL - 3, CELL - 3, 3);
  ctx.fill();

  // Highlight top edge
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(col * CELL + 3, row * CELL + 3, CELL - 6, 3);
  ctx.restore();
}

function calcGhost(board, piece) {
  let g = { ...piece };
  while (true) {
    const next = { ...g, oy: g.oy + 1 };
    if (!isValid(board, next)) break;
    g = next;
  }
  return g;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GameTetris({ difficulty = "medium", onGameOver }) {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    board: emptyBoard(),
    piece: null,
    next: randomPiece(),
    score: 0,
    linesCleared: 0,
    dead: false,
    lastDrop: 0,
    rafId: null,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLines, setDisplayLines] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [playing, setPlaying] = useState(false);
  const dropMs = DROP_MS[difficulty] ?? 350;
  const lineGoal = LINE_GOALS[difficulty] ?? 10;
  const reportedRef = useRef(false);

  // ── Spawn a new piece ──
  const spawnNext = useCallback(() => {
    const g = gameRef.current;
    const p = g.next;
    g.next = randomPiece();
    g.piece = p;
    if (!isValid(g.board, p)) {
      g.dead = true;
    }
  }, []);

  // ── Move helpers ──
  const tryMove = useCallback((dx, dy) => {
    const g = gameRef.current;
    if (!g.piece || g.dead) return false;
    const moved = { ...g.piece, ox: g.piece.ox + dx, oy: g.piece.oy + dy };
    if (isValid(g.board, moved)) { g.piece = moved; return true; }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const g = gameRef.current;
    if (!g.piece || g.dead) return;
    const rotated = rotatePiece(g.piece);
    // Wall kicks: try center, then ±1, ±2
    for (const kick of [0, -1, 1, -2, 2]) {
      const kicked = { ...rotated, ox: rotated.ox + kick };
      if (isValid(g.board, kicked)) { g.piece = kicked; playGameMove(); return; }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const g = gameRef.current;
    if (!g.piece || g.dead) return;
    while (tryMove(0, 1)) {}
    lock();
  }, [tryMove]); // eslint-disable-line react-hooks/exhaustive-deps

  const lock = useCallback(() => {
    const g = gameRef.current;
    if (!g.piece) return;
    const newBoard = lockPiece(g.board, g.piece);
    const { board: cleared, cleared: count } = clearLines(newBoard);
    g.board = cleared;
    g.piece = null;
    if (count > 0) {
      g.score += LINE_SCORE[count] ?? 800;
      g.linesCleared += count;
      playGameMerge();
      hapticMerge();
      setDisplayScore(g.score);
      setDisplayLines(g.linesCleared);
      if (g.linesCleared >= lineGoal && !reportedRef.current) {
        reportedRef.current = true;
        g.dead = true;
        playGameWin();
        hapticWin();
        setTimeout(() => onGameOver(g.score, "win"), 600);
        return;
      }
    } else {
      playGameMove();
      hapticMove();
    }
    spawnNext();
    if (g.dead && !reportedRef.current) {
      reportedRef.current = true;
      playGameLose();
      hapticLose();
      setTimeout(() => onGameOver(g.score, "lose"), 600);
    }
  }, [lineGoal, onGameOver, spawnNext]);

  // ── RAF game loop ──
  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = gameRef.current;
    g.board = emptyBoard();
    g.score = 0;
    g.linesCleared = 0;
    g.dead = false;
    g.lastDrop = 0;
    spawnNext();

    const W = COLS * CELL;
    const H = ROWS * CELL;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const loop = (ts) => {
      if (g.dead) return;
      // Auto-drop
      if (g.lastDrop === 0) g.lastDrop = ts;
      if (ts - g.lastDrop >= dropMs) {
        g.lastDrop = ts;
        if (!tryMove(0, 1)) lock();
      }
      // Render
      const ghost = g.piece ? calcGhost(g.board, g.piece) : null;
      renderFrame(ctx, W, H, g.board, g.piece, ghost, g.score, g.linesCleared, lineGoal);
      g.rafId = requestAnimationFrame(loop);
    };
    g.rafId = requestAnimationFrame(loop);
    return () => { if (g.rafId) cancelAnimationFrame(g.rafId); };
  }, [playing, dropMs, lineGoal, spawnNext, tryMove, lock]);

  // ── Keyboard controls ──
  useEffect(() => {
    if (!playing) return;
    let softDropInterval = null;
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  { tryMove(-1, 0); hapticMove(); }
      if (e.key === "ArrowRight") { tryMove(1, 0);  hapticMove(); }
      if (e.key === "ArrowDown")  { tryMove(0, 1);  hapticMove(); }
      if (e.key === "ArrowUp" || e.key === "z" || e.key === "Z") tryRotate();
      if (e.key === " ") { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (softDropInterval) clearInterval(softDropInterval); };
  }, [playing, tryMove, tryRotate, hardDrop]);

  // ── Touch gestures via @use-gesture/react ──
  const swipeThreshold = 30;
  const gestureRef = useRef({ startX: 0, startY: 0, fired: false });

  const bind = useGesture({
    onDragStart: ({ xy: [x, y] }) => {
      gestureRef.current = { startX: x, startY: y, fired: false };
    },
    onDrag: ({ xy: [x, y], last }) => {
      const g = gestureRef.current;
      if (g.fired) return;
      const dx = x - g.startX;
      const dy = y - g.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < swipeThreshold) return;
      g.fired = true;
      if (absDy > absDx && dy > 0) {
        // Swipe down → hard drop
        hardDrop();
      } else if (absDx > absDy) {
        // Swipe horizontal → move
        tryMove(dx > 0 ? 1 : -1, 0);
        hapticMove();
      }
    },
    onTap: () => { tryRotate(); hapticMove(); },
  }, { drag: { filterTaps: true, threshold: 8 } });

  // ── Countdown before play ──
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setPlaying(true);
  }, [countdown]);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-3 select-none">
      {/* HUD */}
      <div className="w-full flex justify-between items-center px-1">
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Điểm</p>
          <p className="text-lg font-black text-white tabular-nums leading-tight">{displayScore.toLocaleString("vi-VN")}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Hàng đã xóa</p>
          <div className="flex items-baseline gap-1 justify-center">
            <p className="text-lg font-black text-white tabular-nums leading-tight">{displayLines}</p>
            <p className="text-[10px] text-zinc-500 font-bold">/ {lineGoal}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tiến độ</p>
          <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (displayLines / lineGoal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Canvas board */}
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl touch-none"
        style={{ width: COLS * CELL, height: ROWS * CELL }}
        {...(playing ? bind() : {})}
      >
        {!playing && countdown > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <span className="text-white text-7xl font-black" style={{ textShadow: "0 0 40px #b026ff" }}>{countdown}</span>
          </div>
        )}
        <canvas ref={canvasRef} className="block" style={{ width: COLS * CELL, height: ROWS * CELL }} />
      </div>

      {/* Mobile action buttons */}
      <div className="flex items-center gap-3 w-full justify-center">
        <button
          onPointerDown={() => { tryMove(-1, 0); hapticMove(); }}
          className="w-11 h-11 rounded-2xl bg-white/[0.07] border border-white/10 text-white font-bold text-lg active:bg-white/15 active:scale-95 transition-all flex items-center justify-center"
        >◀</button>
        <button
          onPointerDown={() => { tryRotate(); hapticMove(); }}
          className="w-14 h-11 rounded-2xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-black text-[11px] active:bg-violet-500/50 active:scale-95 transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
        >↻ Xoay</button>
        <button
          onPointerDown={() => { tryMove(1, 0); hapticMove(); }}
          className="w-11 h-11 rounded-2xl bg-white/[0.07] border border-white/10 text-white font-bold text-lg active:bg-white/15 active:scale-95 transition-all flex items-center justify-center"
        >▶</button>
      </div>
      <div className="flex gap-3">
        <button
          onPointerDown={() => { tryMove(0, 1); hapticMove(); }}
          className="w-11 h-11 rounded-2xl bg-white/[0.07] border border-white/10 text-white font-bold text-lg active:bg-white/15 active:scale-95 transition-all flex items-center justify-center"
        >▼</button>
        <button
          onPointerDown={hardDrop}
          className="w-24 h-11 rounded-2xl bg-fuchsia-600/30 border border-fuchsia-500/40 text-fuchsia-300 font-black text-[11px] active:bg-fuchsia-500/50 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
        >⬇ Thả nhanh</button>
      </div>

      <p className="text-[10px] text-zinc-600 text-center">
        Vuốt trái/phải = di chuyển · Vuốt xuống = thả nhanh · Chạm = xoay
      </p>
    </div>
  );
}
