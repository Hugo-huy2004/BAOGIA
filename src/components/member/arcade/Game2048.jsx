import React, { useState, useEffect, useCallback, useRef } from "react";

const SIZE = 4;
const TARGET_TILE = { easy: 256, medium: 512, hard: 2048 };

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return grid;
}

// Slides + merges a single row to the left, returns { row, gained, moved }.
function slideRowLeft(row) {
  const filtered = row.filter((v) => v !== 0);
  const merged = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      merged.push(mergedVal);
      gained += mergedVal;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  const moved = merged.some((v, idx) => v !== row[idx]);
  return { row: merged, gained, moved };
}

function rotateGrid(grid) {
  // 90deg clockwise
  const result = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      result[c][SIZE - 1 - r] = grid[r][c];
    }
  }
  return result;
}

// direction: 'left' | 'right' | 'up' | 'down'
export function move(grid, direction) {
  let g = cloneGrid(grid);
  let rotations = 0;
  if (direction === "up") rotations = 3;
  else if (direction === "right") rotations = 2;
  else if (direction === "down") rotations = 1;

  for (let i = 0; i < rotations; i++) g = rotateGrid(g);

  let totalGained = 0;
  let moved = false;
  const newGrid = g.map((row) => {
    const { row: newRow, gained, moved: rowMoved } = slideRowLeft(row);
    totalGained += gained;
    if (rowMoved) moved = true;
    return newRow;
  });

  let finalGrid = newGrid;
  const backRotations = (4 - rotations) % 4;
  for (let i = 0; i < backRotations; i++) finalGrid = rotateGrid(finalGrid);

  return { grid: finalGrid, gained: totalGained, moved };
}

export function isGameOver(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

export function hasReachedTarget(grid, target) {
  return grid.some((row) => row.some((v) => v >= target));
}

const TILE_COLORS = {
  0:    { bg: "rgba(255,255,255,.045)", color: "transparent", border: "rgba(255,255,255,.035)", glow: "inset 0 1px rgba(255,255,255,.02)" },
  2:    { bg: "linear-gradient(145deg,#475569,#334155)", color: "#f8fafc", border: "#64748b", glow: "0 7px 18px rgba(51,65,85,.38)" },
  4:    { bg: "linear-gradient(145deg,#0891b2,#0e7490)", color: "#ecfeff", border: "#22d3ee", glow: "0 8px 20px rgba(6,182,212,.30)" },
  8:    { bg: "linear-gradient(145deg,#10b981,#047857)", color: "#ecfdf5", border: "#34d399", glow: "0 8px 21px rgba(16,185,129,.32)" },
  16:   { bg: "linear-gradient(145deg,#84cc16,#4d7c0f)", color: "#f7fee7", border: "#a3e635", glow: "0 9px 22px rgba(132,204,22,.34)" },
  32:   { bg: "linear-gradient(145deg,#eab308,#a16207)", color: "#fffbeb", border: "#facc15", glow: "0 9px 24px rgba(234,179,8,.36)" },
  64:   { bg: "linear-gradient(145deg,#f97316,#c2410c)", color: "#fff7ed", border: "#fb923c", glow: "0 10px 26px rgba(249,115,22,.40)" },
  128:  { bg: "linear-gradient(145deg,#ef4444,#b91c1c)", color: "#fef2f2", border: "#f87171", glow: "0 11px 28px rgba(239,68,68,.43)" },
  256:  { bg: "linear-gradient(145deg,#ec4899,#be185d)", color: "#fdf2f8", border: "#f472b6", glow: "0 11px 30px rgba(236,72,153,.46)" },
  512:  { bg: "linear-gradient(145deg,#a855f7,#7e22ce)", color: "#faf5ff", border: "#c084fc", glow: "0 12px 32px rgba(168,85,247,.50)" },
  1024: { bg: "linear-gradient(145deg,#6366f1,#3730a3)", color: "#eef2ff", border: "#818cf8", glow: "0 13px 34px rgba(99,102,241,.54)" },
  2048: { bg: "linear-gradient(135deg,#fde047 0%,#f59e0b 48%,#ea580c 100%)", color: "#451a03", border: "#fef08a", glow: "0 0 38px rgba(250,204,21,.68), inset 0 1px rgba(255,255,255,.65)" }
};

export default function Game2048({ difficulty = "medium", onGameOver }) {
  const targetTile = TARGET_TILE[difficulty] || 512;
  const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(emptyGrid())));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(null); // null | 'win' | 'lose'
  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);

  const handleMove = useCallback((direction) => {
    if (status) return;
    setGrid((prevGrid) => {
      const { grid: newGrid, gained, moved } = move(prevGrid, direction);
      if (!moved) return prevGrid;
      const withTile = addRandomTile(cloneGrid(newGrid));
      if (gained) setScore((s) => s + gained);
      if (hasReachedTarget(withTile, targetTile)) setStatus("win");
      else if (isGameOver(withTile)) setStatus("lose");
      return withTile;
    });
  }, [status, targetTile]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(map[e.key]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMove]);

  useEffect(() => {
    if (status && !reportedRef.current) {
      reportedRef.current = true;
      onGameOver?.(score, status);
    }
  }, [status, score, onGameOver]);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
    else handleMove(dy > 0 ? "down" : "up");
  };

  return (
    <div className="game2048-shell flex flex-col items-center gap-4 w-full">
      <div className="game2048-hud w-full max-w-[520px]">
        <div><small>ĐIỂM HIỆN TẠI</small><strong>{score.toLocaleString("vi-VN")}</strong></div>
        <div className="target"><small>MỤC TIÊU</small><strong>{targetTile}</strong></div>
      </div>

      <div
        className="game2048-board grid grid-cols-4 grid-rows-4 w-full max-w-[520px] aspect-square touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {grid.flat().map((value, idx) => (
          <div
            key={`${idx}-${value}`}
            className={`game2048-tile aspect-square flex items-center justify-center font-black ${value !== 0 ? "animate-scale-in" : ""}`}
            style={{ background: (TILE_COLORS[value] || TILE_COLORS[2048]).bg, color: (TILE_COLORS[value] || TILE_COLORS[2048]).color, borderColor: (TILE_COLORS[value] || TILE_COLORS[2048]).border, boxShadow: (TILE_COLORS[value] || TILE_COLORS[2048]).glow, fontSize: value >= 1000 ? "clamp(16px,4vw,25px)" : "clamp(21px,5vw,34px)" }}
            aria-label={value ? `Ô số ${value}` : "Ô trống"}
          >
            {value !== 0 && value}
          </div>
        ))}
      </div>

      <p className="game-control-hint"><span className="material-symbols-outlined">swipe</span> Vuốt màn hình hoặc dùng phím mũi tên để di chuyển</p>
    </div>
  );
}
