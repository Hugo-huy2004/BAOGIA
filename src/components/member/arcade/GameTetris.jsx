import React, { useEffect, useRef, useState, useCallback } from "react";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";
import confetti from "canvas-confetti";

const COLS = 10;
const ROWS = 20;

const SHAPES = {
  I: { matrix: [[1, 1, 1, 1]], color: "#06b6d4", glow: "rgba(6, 182, 212, 0.8)" },
  O: { matrix: [[1, 1], [1, 1]], color: "#eab308", glow: "rgba(234, 179, 8, 0.8)" },
  T: { matrix: [[0, 1, 0], [1, 1, 1]], color: "#a855f7", glow: "rgba(168, 85, 247, 0.8)" },
  S: { matrix: [[0, 1, 1], [1, 1, 0]], color: "#22c55e", glow: "rgba(34, 197, 94, 0.8)" },
  Z: { matrix: [[1, 1, 0], [0, 1, 1]], color: "#ef4444", glow: "rgba(239, 68, 68, 0.8)" },
  J: { matrix: [[1, 0, 0], [1, 1, 1]], color: "#3b82f6", glow: "rgba(59, 130, 246, 0.8)" },
  L: { matrix: [[0, 0, 1], [1, 1, 1]], color: "#f97316", glow: "rgba(249, 115, 22, 0.8)" },
};

const SHAPE_KEYS = Object.keys(SHAPES);

function getRandomPiece() {
  const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
  const item = SHAPES[key];
  return {
    key,
    matrix: item.matrix.map((row) => [...row]),
    color: item.color,
    glow: item.glow,
    x: Math.floor((COLS - item.matrix[0].length) / 2),
    y: 0,
  };
}

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export default function GameTetris({ difficulty = "medium", onGameOver }) {
  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const { playBeep, playMove, playWin, playLose } = useArcadeSound();

  // Mutable Game State for 60fps Canvas Loop
  const gameState = useRef({
    board: createEmptyBoard(),
    currentPiece: getRandomPiece(),
    nextPiece: getRandomPiece(),
    score: 0,
    lines: 0,
    lastTick: 0,
    isGameOver: false,
  });

  const speedMs = Math.max(100, 500 - Math.floor(score / 400) * 35);

  // ── Helper: Collision Check ──────────────────────────────────────────────
  const checkCollision = (piece, board, offsetX = 0, offsetY = 0) => {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c]) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  // ── Helper: Calculate Ghost Piece Position ──────────────────────────────
  const getGhostY = (piece, board) => {
    let ghostY = piece.y;
    while (!checkCollision(piece, board, 0, ghostY - piece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  };

  // ── Draw 3D Bevelled Neon Block ─────────────────────────────────────────
  const drawBlock = (ctx, x, y, size, color, glow, isGhost = false) => {
    const px = x * size;
    const py = y * size;
    const pad = 1.5;

    ctx.save();
    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(px + pad, py + pad, size - pad * 2, size - pad * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(px + pad, py + pad, size - pad * 2, size - pad * 2);
    } else {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;

      // Base Block Gradient
      const grad = ctx.createLinearGradient(px, py, px + size, py + size);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, "rgba(5, 8, 20, 0.95)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px + pad, py + pad, size - pad * 2, size - pad * 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Specular Reflection Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + pad + 1, py + pad + 1, size - pad * 2 - 2, size - pad * 2 - 2);
    }
    ctx.restore();
  };

  // ── Draw Next Piece Preview Canvas ──────────────────────────────────────
  const drawNextPiece = useCallback(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const piece = gameState.current.nextPiece;
    const cellSize = 22;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const m = piece.matrix;
    const startX = (canvas.width - m[0].length * cellSize) / 2 / cellSize;
    const startY = (canvas.height - m.length * cellSize) / 2 / cellSize;

    m.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          drawBlock(ctx, startX + c, startY + r, cellSize, piece.color, piece.glow);
        }
      });
    });
  }, []);

  // ── Game Tick Logic ──────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;

    if (!checkCollision(s.currentPiece, s.board, 0, 1)) {
      s.currentPiece.y += 1;
    } else {
      // Lock Piece into Board
      const newBoard = s.board.map((row) => [...row]);
      s.currentPiece.matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) {
            const bY = s.currentPiece.y + r;
            const bX = s.currentPiece.x + c;
            if (bY >= 0 && bY < ROWS && bX >= 0 && bX < COLS) {
              newBoard[bY][bX] = s.currentPiece.color;
            }
          }
        });
      });

      // Clear Completed Lines
      let cleared = 0;
      const filtered = newBoard.filter((row) => {
        const full = row.every((c) => c !== 0);
        if (full) cleared++;
        return !full;
      });

      while (filtered.length < ROWS) {
        filtered.unshift(Array(COLS).fill(0));
      }

      s.board = filtered;

      if (cleared > 0) {
        playWin();
        hapticMerge();
        const pts = [0, 100, 300, 500, 800][cleared] || 1000;
        s.score += pts;
        s.lines += cleared;
        setScore(s.score);
        setLines(s.lines);

        if (cleared >= 4) {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        playMove();
        hapticMove();
      }

      // Spawn Next Piece
      const spawn = s.nextPiece;
      s.nextPiece = getRandomPiece();
      drawNextPiece();

      if (checkCollision(spawn, s.board)) {
        s.isGameOver = true;
        setIsGameOver(true);
        playLose();
        hapticLose();
        const earnedJoy = Math.floor((s.score + s.lines * 100) / 25);
        if (earnedJoy > 0) {
          useJoyStore.getState().setBalance(useJoyStore.getState().balance + earnedJoy);
        }
        onGameOver?.(s.score, s.score >= 500 ? "win" : "lose");
      } else {
        s.currentPiece = spawn;
      }
    }
  }, [drawNextPiece, playWin, playMove, playLose, onGameOver]);

  // ── Main Render Canvas Loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const size = canvas.offsetWidth;
    canvas.width = size;
    canvas.height = size * 2;
    const cell = size / COLS;

    drawNextPiece();

    let rafId;
    const renderFrame = (ts) => {
      const s = gameState.current;

      if (s.lastTick === 0) s.lastTick = ts;
      if (ts - s.lastTick >= speedMs) {
        s.lastTick = ts;
        tick();
      }

      // Clear Canvas
      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Lines
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(canvas.width, r * cell); ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, canvas.height); ctx.stroke();
      }

      // Draw Locked Board Blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = s.board[r][c];
          if (color) {
            drawBlock(ctx, c, r, cell, color, color);
          }
        }
      }

      if (!s.isGameOver && s.currentPiece) {
        // Draw Ghost Piece
        const ghostY = getGhostY(s.currentPiece, s.board);
        s.currentPiece.matrix.forEach((row, r) => {
          row.forEach((val, c) => {
            if (val) {
              const gx = s.currentPiece.x + c;
              const gy = ghostY + r;
              if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
                drawBlock(ctx, gx, gy, cell, s.currentPiece.color, s.currentPiece.glow, true);
              }
            }
          });
        });

        // Draw Active Piece
        s.currentPiece.matrix.forEach((row, r) => {
          row.forEach((val, c) => {
            if (val) {
              const px = s.currentPiece.x + c;
              const py = s.currentPiece.y + r;
              if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                drawBlock(ctx, px, py, cell, s.currentPiece.color, s.currentPiece.glow, false);
              }
            }
          });
        });
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [speedMs, tick, drawNextPiece]);

  // ── Input Controls ───────────────────────────────────────────────────────
  const moveLeft = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    if (!checkCollision(s.currentPiece, s.board, -1, 0)) {
      s.currentPiece.x -= 1;
      playBeep();
      hapticMove();
    }
  }, [playBeep]);

  const moveRight = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    if (!checkCollision(s.currentPiece, s.board, 1, 0)) {
      s.currentPiece.x += 1;
      playBeep();
      hapticMove();
    }
  }, [playBeep]);

  const rotate = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    const m = s.currentPiece.matrix;
    const rotated = m[0].map((_, i) => m.map((row) => row[i]).reverse());
    const testPiece = { ...s.currentPiece, matrix: rotated };
    if (!checkCollision(testPiece, s.board)) {
      s.currentPiece.matrix = rotated;
      playBeep();
      hapticMove();
    }
  }, [playBeep]);

  const dropStep = useCallback(() => {
    tick();
  }, [tick]);

  const hardDrop = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    const ghostY = getGhostY(s.currentPiece, s.board);
    s.currentPiece.y = ghostY;
    tick();
  }, [tick]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); moveLeft(); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); moveRight(); }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); dropStep(); }
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); rotate(); }
      if (e.key === " ") { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, dropStep, rotate, hardDrop]);

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-[#090d16] text-white rounded-[32px] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-sm mx-auto backdrop-blur-2xl">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#06b6d4]" />
          <div>
            <h2 className="text-base font-black tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent uppercase font-sans">
              Hugo Tetris Neon
            </h2>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">60 FPS 3D Canvas</span>
          </div>
        </div>

        {/* Next Piece Preview Widget */}
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="text-right">
            <span className="text-[8px] font-bold text-zinc-400 block uppercase tracking-wider">Tiếp Theo</span>
          </div>
          <canvas ref={nextCanvasRef} width={50} height={50} className="w-10 h-10" />
        </div>
      </div>

      {/* Score HUD Strip */}
      <div className="grid grid-cols-2 gap-3 w-full mb-3">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-2.5 text-center">
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">Điểm Số</span>
          <span className="text-xl font-black text-white font-mono">{score.toLocaleString("vi-VN")}</span>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-2.5 text-center">
          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Hàng Xóa</span>
          <span className="text-xl font-black text-white font-mono">{lines}</span>
        </div>
      </div>

      {/* Main Canvas Grid */}
      <div className="relative border-2 border-cyan-500/40 rounded-2xl overflow-hidden bg-[#050811] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <canvas ref={canvasRef} className="w-[260px] h-[520px] block rounded-xl" />
      </div>

      {/* Touch D-Pad Controls for PWA */}
      <div className="grid grid-cols-3 gap-2.5 w-full mt-4 max-w-[280px]">
        <button onClick={rotate} className="col-span-3 py-2.5 bg-purple-500/20 border border-purple-400/30 rounded-2xl font-black text-xs hover:bg-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-purple-200 uppercase tracking-wider backdrop-blur-md">
          <span className="material-symbols-outlined text-base">rotate_right</span> XOAY KHỐI
        </button>
        <button onClick={moveLeft} className="py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center backdrop-blur-md shadow-sm">
          <span className="material-symbols-outlined text-xl text-white">arrow_back</span>
        </button>
        <button onClick={dropStep} className="py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center backdrop-blur-md shadow-sm">
          <span className="material-symbols-outlined text-xl text-white">arrow_downward</span>
        </button>
        <button onClick={moveRight} className="py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center backdrop-blur-md shadow-sm">
          <span className="material-symbols-outlined text-xl text-white">arrow_forward</span>
        </button>
        <button onClick={hardDrop} className="col-span-3 py-3 bg-cyan-500/20 border border-cyan-400/30 rounded-2xl font-black text-xs text-cyan-200 hover:bg-cyan-500/30 active:scale-95 transition-all uppercase tracking-wider backdrop-blur-md flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-base">bolt</span> THẢ SẮC NÉT (HARD DROP)
        </button>
      </div>
    </div>
  );
}
