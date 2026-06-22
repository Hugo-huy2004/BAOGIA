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
  0: "bg-zinc-100 dark:bg-zinc-800/60",
  2: "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200",
  4: "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100",
  8: "bg-amber-200 text-amber-900",
  16: "bg-amber-300 text-amber-900",
  32: "bg-orange-300 text-white",
  64: "bg-orange-400 text-white",
  128: "bg-yellow-400 text-white",
  256: "bg-yellow-500 text-white",
  512: "bg-rose-400 text-white",
  1024: "bg-rose-500 text-white",
  2048: "bg-rose-600 text-white"
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
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-between w-full max-w-[400px]">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Mục tiêu <span className="text-zinc-900 dark:text-white">{targetTile}</span>
        </p>
        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Điểm: <span className="text-zinc-900 dark:text-white font-black">{score}</span>
        </p>
      </div>

      <div
        className="grid grid-cols-4 grid-rows-4 gap-3 p-3.5 bg-zinc-200 dark:bg-zinc-900 rounded-3xl w-full max-w-[400px] aspect-square touch-none shadow-inner"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {grid.flat().map((value, idx) => (
          <div
            key={`${idx}-${value}`}
            className={`aspect-square flex items-center justify-center rounded-2xl font-black ${value >= 1000 ? "text-lg" : "text-2xl"} shadow-sm ${value !== 0 ? "animate-scale-in" : ""} ${TILE_COLORS[value] || "bg-rose-700 text-white"}`}
          >
            {value !== 0 && value}
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 text-center">Dùng phím mũi tên hoặc vuốt màn hình để di chuyển</p>
    </div>
  );
}
