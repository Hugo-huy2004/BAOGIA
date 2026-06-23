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

// Neon sign treatment — dark tile face + a saturated glowing border/text in
// each tile's own color, rather than a solid pastel fill, so every tile reads
// like it's lit up against the dark board instead of a flat colored square.
const TILE_COLORS = {
  0:    { bg: "rgba(255,255,255,.045)", color: "transparent", border: "rgba(255,255,255,.035)", glow: "inset 0 1px rgba(255,255,255,.02)" },
  2:    { bg: "#0a1620", color: "#22d3ee", border: "#22d3ee", glow: "0 0 10px #22d3ee,0 0 22px rgba(34,211,238,.5),inset 0 0 12px rgba(34,211,238,.18)" },
  4:    { bg: "#1a0a20", color: "#e879f9", border: "#e879f9", glow: "0 0 10px #e879f9,0 0 22px rgba(232,121,249,.5),inset 0 0 12px rgba(232,121,249,.18)" },
  8:    { bg: "#0a200f", color: "#39ff88", border: "#39ff88", glow: "0 0 10px #39ff88,0 0 22px rgba(57,255,136,.5),inset 0 0 12px rgba(57,255,136,.18)" },
  16:   { bg: "#201d0a", color: "#faff00", border: "#faff00", glow: "0 0 10px #faff00,0 0 22px rgba(250,255,0,.5),inset 0 0 12px rgba(250,255,0,.18)" },
  32:   { bg: "#201205", color: "#ff8a00", border: "#ff8a00", glow: "0 0 10px #ff8a00,0 0 22px rgba(255,138,0,.5),inset 0 0 12px rgba(255,138,0,.18)" },
  64:   { bg: "#20060a", color: "#ff2e63", border: "#ff2e63", glow: "0 0 11px #ff2e63,0 0 24px rgba(255,46,99,.55),inset 0 0 12px rgba(255,46,99,.2)" },
  128:  { bg: "#16051f", color: "#b026ff", border: "#b026ff", glow: "0 0 11px #b026ff,0 0 24px rgba(176,38,255,.55),inset 0 0 12px rgba(176,38,255,.2)" },
  256:  { bg: "#1f0316", color: "#ff10f0", border: "#ff10f0", glow: "0 0 11px #ff10f0,0 0 24px rgba(255,16,240,.55),inset 0 0 12px rgba(255,16,240,.2)" },
  512:  { bg: "#04151f", color: "#00ffd5", border: "#00ffd5", glow: "0 0 12px #00ffd5,0 0 26px rgba(0,255,213,.6),inset 0 0 14px rgba(0,255,213,.22)" },
  1024: { bg: "#0a0d20", color: "#4d6bff", border: "#4d6bff", glow: "0 0 12px #4d6bff,0 0 26px rgba(77,107,255,.6),inset 0 0 14px rgba(77,107,255,.22)" },
  2048: { bg: "#1a1500", color: "#ffe600", border: "#ffe600", glow: "0 0 16px #ffe600,0 0 34px rgba(255,230,0,.75),inset 0 0 16px rgba(255,230,0,.28)" }
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
