import React, { useState, useEffect, useCallback, useRef } from "react";
import { playGameMove, playGameMerge, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { levelFor, ramp, createCombo } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · Gộp NHIỀU cặp trong một lượt được nhân điểm (chain): 2 cặp x1.5, 3 cặp x2…
// · Lượt nào cũng có gộp thì nối chuỗi liên hoàn (tối đa x2).
// · Ô ĐÁ: từ cấp 3 thỉnh thoảng rơi xuống một ô không gộp được, trượt như ô
//   thường và tự vỡ sau vài lượt — chướng ngại tạm thời, không phải án tử.
// · Cấp càng cao càng dễ ra ô 4 thay vì ô 2 (bàn đầy nhanh hơn).
const SIZE = 4;
const GAME_ID = "2048";
const STONE_FROM_LEVEL = 3;

let tileSequence = 0;
const createTile = (value, extra = {}) => ({ id: `tile-${++tileSequence}`, value, ...extra });

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function emptyCells(grid) {
  const cells = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) cells.push([r, c]);
  return cells;
}

function addRandomObjectTile(grid, fourChance = 0.1) {
  const next = cloneGrid(grid);
  const empty = emptyCells(next);
  if (!empty.length) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  next[r][c] = createTile(Math.random() < fourChance ? 4 : 2, { isNew: true });
  return next;
}

function addStoneTile(grid, life) {
  const next = cloneGrid(grid);
  const empty = emptyCells(next);
  if (empty.length <= 2) return next; // đừng bịt nốt ô trống cuối
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  next[r][c] = createTile(0, { isNew: true, stone: true, life });
  return next;
}

function createTileGrid() {
  return addRandomObjectTile(addRandomObjectTile(emptyGrid()));
}

/** Hết nước đi: không còn ô trống và không cặp nào gộp được (đá không tính). */
export function isGameOver(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = grid[r][c];
      if (!t) return false;
      if (t.stone) continue;
      const right = c < SIZE - 1 ? grid[r][c + 1] : null;
      const down = r < SIZE - 1 ? grid[r + 1][c] : null;
      if (right && !right.stone && right.value === t.value) return false;
      if (down && !down.stone && down.value === t.value) return false;
    }
  }
  return true;
}

/**
 * Trượt + gộp theo hướng. Ô đá trượt như ô thường nhưng không bao giờ gộp,
 * nên chỉ cần một điều kiện `!stone` ở chỗ so sánh — không phải viết luật riêng.
 * Trả thêm `merges` = số cặp đã gộp trong lượt, dùng cho hệ số chain.
 */
export function moveTileGrid(grid, direction) {
  const result = emptyGrid();
  let gained = 0;
  let moved = false;
  let merges = 0;

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
      const canMerge = next && !current.tile.stone && !next.tile.stone && current.tile.value === next.tile.value;
      if (canMerge) {
        const value = current.tile.value * 2;
        result[targetR][targetC] = createTile(value, { merged: true });
        gained += value;
        merges++;
        moved = true;
        index++;
      } else {
        result[targetR][targetC] = { ...current.tile, isNew: false, merged: false };
        if (current.r !== targetR || current.c !== targetC) moved = true;
      }
    }
  }
  return { grid: result, gained, moved, merges };
}

/** Đá sống thêm một lượt; hết hạn thì vỡ (biến mất). */
function ageStones(grid) {
  return grid.map((row) => row.map((tile) => {
    if (!tile?.stone) return tile;
    const life = tile.life - 1;
    return life > 0 ? { ...tile, life } : 0;
  }));
}

// Khối neon đặc, mỗi giá trị một màu — bàn cờ đọc như kính màu phát sáng.
const TILE_COLORS = {
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
  2048: { bg: "#ffe600", color: "#2b2400", border: "#fef9c3", glow: "0 0 20px #ffe600,0 0 42px rgba(255,230,0,.85),inset 0 -4px 10px rgba(0,0,0,.22),inset 0 3px 6px rgba(255,255,255,.55)" },
};

const STONE_STYLE = { bg: "#3f4657", color: "#c2c9da", border: "#5b647a", glow: "inset 0 -4px 10px rgba(0,0,0,.35),inset 0 3px 6px rgba(255,255,255,.12)" };

export default function Game2048({ paused = false, onGameOver }) {
  const [grid, setGrid] = useState(createTileGrid);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(null);
  const [motion, setMotion] = useState({ direction: "", merged: false });
  const [maxTile, setMaxTile] = useState(2);
  const [hudExtra, setHudExtra] = useState({ combo: 0, mult: 1, notice: "" });

  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);
  const boardRef = useRef(null);
  const gridRef = useRef(grid);
  const comboRef = useRef(createCombo({ windowMs: 9000, step: 0.25, max: 2 }));
  const levelRef = useRef(1);

  const handleMove = useCallback((direction) => {
    if (status || paused) return;
    const { grid: movedGrid, gained, moved, merges } = moveTileGrid(gridRef.current, direction);
    if (!moved) return;

    const combo = comboRef.current;
    let next = ageStones(movedGrid);
    let addedScore = 0;

    if (gained > 0) {
      // Gộp nhiều cặp cùng lượt là kỹ năng sắp bàn — thưởng theo số cặp.
      const chainMult = 1 + (merges - 1) * 0.5;
      const mult = combo.hit();
      addedScore = Math.round(gained * chainMult * mult);
      setScore((s) => s + addedScore);
      playGameMerge();
      hapticMerge();
    } else {
      combo.reset();
      playGameMove();
      hapticMove();
    }

    const level = levelFor(GAME_ID, score + addedScore);
    // Cấp cao ra ô 4 nhiều hơn → bàn chật nhanh hơn, đây là "độ khó" của 2048.
    next = addRandomObjectTile(next, ramp(GAME_ID, level, 0.1, 0.38));
    if (level >= STONE_FROM_LEVEL && Math.random() < ramp(GAME_ID, level, 0.05, 0.16)) {
      next = addStoneTile(next, Math.max(4, Math.round(ramp(GAME_ID, level, 10, 5))));
    }

    gridRef.current = next;
    setMotion({ direction, merged: gained > 0 });
    setGrid(next);
    setMaxTile(Math.max(...next.flat().map((t) => t?.value || 0)));
    setHudExtra({
      combo: combo.chain + (combo.chain > 0 ? 1 : 0),
      mult: combo.mult,
      notice: level !== levelRef.current ? `Cấp ${level}${level >= STONE_FROM_LEVEL ? " · có ô đá" : ""}` : "",
    });
    levelRef.current = level;

    if (isGameOver(next)) {
      setStatus("lose");
      playGameLose();
      hapticLose();
    }
  }, [status, paused, score]);

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
    if (!hudExtra.notice) return undefined;
    const t = setTimeout(() => setHudExtra((h) => ({ ...h, notice: "" })), 1600);
    return () => clearTimeout(t);
  }, [hudExtra.notice]);

  useEffect(() => {
    if (!status || reportedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      reportedRef.current = true;
      onGameOver?.(score, "lose");
    }, 350);
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
    <div className="game2048-shell flex flex-col items-center w-full">
      <ArcadeHud
        gameId={GAME_ID}
        score={score}
        combo={hudExtra.combo}
        multiplier={hudExtra.mult}
        notice={hudExtra.notice}
        stats={[{ label: "Ô lớn nhất", value: maxTile }]}
      />

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
          {grid.flatMap((row, r) => row.map((tile, c) => {
            if (!tile) return null;
            const style = tile.stone ? STONE_STYLE : (TILE_COLORS[tile.value] || TILE_COLORS[2048]);
            return (
              <div key={tile.id}
                className={`game2048-tile tile-row-${r} tile-col-${c} is-filled ${tile.isNew ? "is-new" : ""} ${tile.merged ? "is-merged" : ""} ${tile.stone ? "is-stone" : ""}`}
                style={{
                  "--row": r, "--col": c,
                  background: style.bg, color: style.color, borderColor: style.border, boxShadow: style.glow,
                  fontSize: tile.stone ? "clamp(14px,3.4vw,20px)" : tile.value >= 1000 ? "clamp(16px,4vw,25px)" : "clamp(21px,5vw,34px)",
                }}
                aria-label={tile.stone ? `Ô đá còn ${tile.life} lượt` : `Ô số ${tile.value}`}>
                {tile.stone ? (
                  <span className="tile-stone">
                    <span className="material-symbols-outlined">lock</span>
                    <b>{tile.life}</b>
                  </span>
                ) : tile.value}
              </div>
            );
          }))}
        </div>
      </div>

      <p className="game-control-hint mt-3 text-center text-[11px]">
        Gộp nhiều cặp trong một lượt để nhân điểm · Ô đá không gộp được nhưng tự vỡ sau vài lượt
      </p>
    </div>
  );
}
