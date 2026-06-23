import React, { useState, useEffect, useCallback, useRef } from "react";

const SIZE = 4;
const TARGET_TILE = { easy: 256, medium: 512, hard: 2048 };
let tileSequence = 0;
const createTile = (value, extra = {}) => ({ id: `tile-${++tileSequence}`, value, ...extra });

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

function createTileGrid() {
  return addRandomObjectTile(addRandomObjectTile(emptyGrid()));
}

function addRandomObjectTile(grid) {
  const next = cloneGrid(grid);
  const empty = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!next[r][c]) empty.push([r, c]);
  if (!empty.length) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  next[r][c] = createTile(Math.random() < .9 ? 2 : 4, { isNew: true });
  return next;
}

function tileValues(grid) {
  return grid.map((row) => row.map((tile) => tile?.value || 0));
}

function moveTileGrid(grid, direction) {
  const result = emptyGrid();
  let gained = 0;
  let moved = false;

  for (let line = 0; line < SIZE; line++) {
    const coords = Array.from({ length: SIZE }, (_, index) => {
      if (direction === "left") return [line, index];
      if (direction === "right") return [line, SIZE - 1 - index];
      if (direction === "up") return [index, line];
      return [SIZE - 1 - index, line];
    });
    const tiles = coords.map(([r, c]) => ({ tile: grid[r][c], r, c })).filter(({ tile }) => tile);
    let output = 0;
    for (let index = 0; index < tiles.length; index++) {
      const current = tiles[index];
      const next = tiles[index + 1];
      const [targetR, targetC] = coords[output++];
      if (next && current.tile.value === next.tile.value) {
        const value = current.tile.value * 2;
        result[targetR][targetC] = createTile(value, { merged: true });
        gained += value;
        moved = true;
        index++;
      } else {
        result[targetR][targetC] = { ...current.tile, isNew: false, merged: false };
        if (current.r !== targetR || current.c !== targetC) moved = true;
      }
    }
  }
  return { grid: result, gained, moved };
}

const TILE_COLORS = {
  0:    { bg: "rgba(255,255,255,.045)", color: "transparent", border: "rgba(255,255,255,.035)", glow: "inset 0 1px rgba(255,255,255,.02)" },
  2:    { bg: "#475569", color: "#f8fafc", border: "#64748b", glow: "0 5px 14px rgba(51,65,85,.24)" },
  4:    { bg: "#0891b2", color: "#ecfeff", border: "#22d3ee", glow: "0 5px 14px rgba(6,182,212,.22)" },
  8:    { bg: "#059669", color: "#ecfdf5", border: "#34d399", glow: "0 5px 14px rgba(16,185,129,.22)" },
  16:   { bg: "#65a30d", color: "#f7fee7", border: "#a3e635", glow: "0 5px 14px rgba(132,204,22,.22)" },
  32:   { bg: "#ca8a04", color: "#fffbeb", border: "#facc15", glow: "0 5px 14px rgba(234,179,8,.22)" },
  64:   { bg: "#ea580c", color: "#fff7ed", border: "#fb923c", glow: "0 5px 14px rgba(249,115,22,.24)" },
  128:  { bg: "#dc2626", color: "#fef2f2", border: "#f87171", glow: "0 5px 14px rgba(239,68,68,.24)" },
  256:  { bg: "#db2777", color: "#fdf2f8", border: "#f472b6", glow: "0 5px 14px rgba(236,72,153,.24)" },
  512:  { bg: "#9333ea", color: "#faf5ff", border: "#c084fc", glow: "0 5px 14px rgba(168,85,247,.26)" },
  1024: { bg: "#4f46e5", color: "#eef2ff", border: "#818cf8", glow: "0 5px 14px rgba(99,102,241,.28)" },
  2048: { bg: "#f59e0b", color: "#451a03", border: "#fef08a", glow: "0 7px 18px rgba(245,158,11,.34)" }
};

export default function Game2048({ difficulty = "medium", onGameOver }) {
  const targetTile = TARGET_TILE[difficulty] || 512;
  const [grid, setGrid] = useState(createTileGrid);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(null); // null | 'win' | 'lose'
  const [motion, setMotion] = useState({ direction: "", merged: false });
  const [celebrating, setCelebrating] = useState(false);
  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);
  const boardRef = useRef(null);
  const gridRef = useRef(grid);

  const handleMove = useCallback((direction) => {
    if (status) return;
    const { grid: newGrid, gained, moved } = moveTileGrid(gridRef.current, direction);
    if (!moved) return;
    const withTile = addRandomObjectTile(newGrid);
    gridRef.current = withTile;
    setMotion({ direction, merged: gained > 0 });
    setGrid(withTile);
    if (gained) setScore((s) => s + gained);
    const values = tileValues(withTile);
    if (hasReachedTarget(values, targetTile)) {
      setCelebrating(true);
      setStatus("win");
      navigator.vibrate?.([40, 50, 90]);
    } else if (isGameOver(values)) setStatus("lose");
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
    if (!status || reportedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      reportedRef.current = true;
      onGameOver?.(score, status);
    }, status === "win" ? 1700 : 350);
    return () => window.clearTimeout(timer);
  }, [status, score, onGameOver]);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: performance.now() };
    boardRef.current?.classList.add("is-dragging");
  };
  const handleTouchMove = (e) => {
    if (!touchStartRef.current || !boardRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dominantX = Math.abs(dx) >= Math.abs(dy);
    const previewX = dominantX ? Math.max(-22, Math.min(22, dx * .18)) : 0;
    const previewY = dominantX ? 0 : Math.max(-22, Math.min(22, dy * .18));
    boardRef.current.style.setProperty("--swipe-x", `${previewX}px`);
    boardRef.current.style.setProperty("--swipe-y", `${previewY}px`);
  };
  const resetSwipePreview = () => {
    if (!boardRef.current) return;
    boardRef.current.classList.remove("is-dragging");
    boardRef.current.style.setProperty("--swipe-x", "0px");
    boardRef.current.style.setProperty("--swipe-y", "0px");
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const elapsed = performance.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    resetSwipePreview();
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (distance < (elapsed < 180 ? 18 : 26)) return;
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
        ref={boardRef}
        className={`game2048-board move-${motion.direction || "idle"} ${motion.merged ? "did-merge" : ""} w-full max-w-[520px] aspect-square touch-none`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStartRef.current = null; resetSwipePreview(); }}
      >
        <div className="game2048-cells" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <span key={index} />)}</div>
        <div className="game2048-tiles">
          {grid.flatMap((row, r) => row.map((tile, c) => tile ? (
            <div key={tile.id}
              className={`game2048-tile tile-row-${r} tile-col-${c} is-filled ${tile.isNew ? "is-new" : ""} ${tile.merged ? "is-merged" : ""}`}
              style={{ "--row": r, "--col": c, background: (TILE_COLORS[tile.value] || TILE_COLORS[2048]).bg, color: (TILE_COLORS[tile.value] || TILE_COLORS[2048]).color, borderColor: (TILE_COLORS[tile.value] || TILE_COLORS[2048]).border, boxShadow: (TILE_COLORS[tile.value] || TILE_COLORS[2048]).glow, fontSize: tile.value >= 1000 ? "clamp(16px,4vw,25px)" : "clamp(21px,5vw,34px)" }}
              aria-label={`Ô số ${tile.value}`}>{tile.value}</div>
          ) : null))}
        </div>
        {celebrating && (
          <div className="game2048-celebration" role="status" aria-live="polite">
            <span className="game2048-celebration-glyph">✓</span>
            <strong>Chúc mừng!</strong>
            <p>Bạn đã tạo được ô <b>{targetTile}</b></p>
          </div>
        )}
      </div>

      <p className="game-control-hint">Vuốt màn hình hoặc dùng phím mũi tên để di chuyển</p>
    </div>
  );
}
