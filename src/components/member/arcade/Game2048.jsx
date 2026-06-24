import React, { useState, useEffect, useCallback, useRef } from "react";
import { playGameMove, playGameMerge, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";

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

// Solid glowing neon blocks — each tile is filled with its own vivid color
// (not a dark face with a thin outline), with a bright outer halo so the
// whole board reads as lit-up colored glass instead of black squares.
const TILE_COLORS = {
  0:    { bg: "rgba(255,255,255,.045)", color: "transparent", border: "rgba(255,255,255,.035)", glow: "inset 0 1px rgba(255,255,255,.02)" },
  2:    { bg: "#22d3ee", color: "#04222b", border: "#a5f3fc", glow: "0 0 14px #22d3ee,0 0 30px rgba(34,211,238,.65),inset 0 -4px 10px rgba(0,0,0,.18),inset 0 3px 6px rgba(255,255,255,.5)" },
  4:    { bg: "#e879f9", color: "#2b0a2b", border: "#f5d0fe", glow: "0 0 14px #e879f9,0 0 30px rgba(232,121,249,.65),inset 0 -4px 10px rgba(0,0,0,.18),inset 0 3px 6px rgba(255,255,255,.5)" },
  8:    { bg: "#39ff88", color: "#04220f", border: "#bbf7d0", glow: "0 0 14px #39ff88,0 0 30px rgba(57,255,136,.65),inset 0 -4px 10px rgba(0,0,0,.18),inset 0 3px 6px rgba(255,255,255,.5)" },
  16:   { bg: "#faff00", color: "#2b2900", border: "#fef9c3", glow: "0 0 14px #faff00,0 0 30px rgba(250,255,0,.65),inset 0 -4px 10px rgba(0,0,0,.18),inset 0 3px 6px rgba(255,255,255,.5)" },
  32:   { bg: "#ff8a00", color: "#2b1700", border: "#fed7aa", glow: "0 0 14px #ff8a00,0 0 30px rgba(255,138,0,.65),inset 0 -4px 10px rgba(0,0,0,.2),inset 0 3px 6px rgba(255,255,255,.45)" },
  64:   { bg: "#ff2e63", color: "#2b0410", border: "#fecdd3", glow: "0 0 16px #ff2e63,0 0 32px rgba(255,46,99,.7),inset 0 -4px 10px rgba(0,0,0,.2),inset 0 3px 6px rgba(255,255,255,.45)" },
  128:  { bg: "#b026ff", color: "#1f0429", border: "#e9d5ff", glow: "0 0 16px #b026ff,0 0 32px rgba(176,38,255,.7),inset 0 -4px 10px rgba(0,0,0,.2),inset 0 3px 6px rgba(255,255,255,.45)" },
  256:  { bg: "#ff10f0", color: "#2b0429", border: "#fbcfe8", glow: "0 0 16px #ff10f0,0 0 32px rgba(255,16,240,.7),inset 0 -4px 10px rgba(0,0,0,.2),inset 0 3px 6px rgba(255,255,255,.45)" },
  512:  { bg: "#00ffd5", color: "#00261f", border: "#ccfbf1", glow: "0 0 18px #00ffd5,0 0 36px rgba(0,255,213,.75),inset 0 -4px 10px rgba(0,0,0,.2),inset 0 3px 6px rgba(255,255,255,.5)" },
  1024: { bg: "#4d6bff", color: "#070b29", border: "#dbeafe", glow: "0 0 18px #4d6bff,0 0 36px rgba(77,107,255,.75),inset 0 -4px 10px rgba(0,0,0,.22),inset 0 3px 6px rgba(255,255,255,.45)" },
  2048: { bg: "#ffe600", color: "#2b2400", border: "#fef9c3", glow: "0 0 20px #ffe600,0 0 42px rgba(255,230,0,.85),inset 0 -4px 10px rgba(0,0,0,.22),inset 0 3px 6px rgba(255,255,255,.55)" }
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
    if (gained) { setScore((s) => s + gained); playGameMerge(); hapticMerge(); } else { playGameMove(); hapticMove(); }
    const values = tileValues(withTile);
    if (hasReachedTarget(values, targetTile)) {
      setCelebrating(true);
      setStatus("win");
      playGameWin();
      hapticWin();
    } else if (isGameOver(values)) { setStatus("lose"); playGameLose(); hapticLose(); }
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
