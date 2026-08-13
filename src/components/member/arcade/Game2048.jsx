import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { playGameMove, playGameMerge, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { levelFor, ramp, createCombo } from "./arcadeProgression";

// ── Luật chơi ─────────────────────────────────────────────────────
// · Gộp 2 ô giống nhau → ×2, gộp 3 ô giống nhau trong hàng → ×3.
// · Ô ĐÁ: chướng ngại tạm thời, tự vỡ sau vài lượt.
// · Ô TNT: ô đặc biệt, khi 2 TNT chạm nhau sẽ nổ tung toàn bộ ô xung quanh.
// · FEVER: gộp 5+ cặp liên tiếp → ×2 điểm trong 3 lượt.
const SIZE = 4;
const GAME_ID = "2048";
const STONE_FROM_LEVEL = 3;
const TNT_SPAWN_CHANCE = 0.06;
const FEVER_THRESHOLD = 5;
const FEVER_DURATION = 3;
const MILESTONES = [128, 256, 512, 1024, 2048, 4096, 8192];

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
  if (empty.length <= 2) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  next[r][c] = createTile(0, { isNew: true, stone: true, life });
  return next;
}

function addTNTTile(grid) {
  const next = cloneGrid(grid);
  const empty = emptyCells(next);
  if (!empty.length) return next;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  next[r][c] = createTile(0, { isNew: true, tnt: true });
  return next;
}

function createTileGrid() {
  return addRandomObjectTile(addRandomObjectTile(emptyGrid()));
}

/** Hết nước đi: không còn ô trống và không cặp nào gộp được (đá/tnt không tính). */
export function isGameOver(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = grid[r][c];
      if (!t) return false;
      if (t.stone || t.tnt) continue;
      const right = c < SIZE - 1 ? grid[r][c + 1] : null;
      const down = r < SIZE - 1 ? grid[r + 1][c] : null;
      if (right && !right.stone && !right.tnt && right.value === t.value) return false;
      if (down && !down.stone && !down.tnt && down.value === t.value) return false;
    }
  }
  return true;
}

/**
 * Trượt + gộp theo hướng. Ô đá/tnt trượt như ô thường nhưng không bao giờ gộp.
 * Ô TNT: khi 2 TNT chạm nhau, nổ tung 3×3 ô xung quanh.
 * Luật mới: 3 ô giống nhau trong hàng → gộp thành ×2 như thường nhưng
 * kích hoạt ×3 điểm thưởng trong 10 giây.
 * Trả thêm `merges` = số lần gộp, `tripleBonus` = có ô 3-gộp không,
 * `tntExplosion` = vị trí TNT nổ (nếu có).
 */
export function moveTileGrid(grid, direction) {
  const result = emptyGrid();
  let gained = 0;
  let moved = false;
  let merges = 0;
  let tripleBonus = false;
  let tntExplosion = null;

  for (let line = 0; line < SIZE; line++) {
    const coords = Array.from({ length: SIZE }, (_, index) => {
      if (direction === "left") return [line, index];
      if (direction === "right") return [line, SIZE - 1 - index];
      if (direction === "up") return [index, line];
      return [SIZE - 1 - index, line];
    });
    const tiles = coords.map(([r, c]) => ({ tile: grid[r][c], r, c })).filter(({ tile }) => tile);
    let output = 0;
    let index = 0;
    while (index < tiles.length) {
      const current = tiles[index];
      const next1 = tiles[index + 1];
      const next2 = tiles[index + 2];

      // Check for TNT explosion: 2 TNTs adjacent
      if (next1 && current.tile.tnt && next1.tile.tnt) {
        tntExplosion = { r: current.r, c: current.c, r2: next1.r, c2: next1.c };
        index += 2;
        continue;
      }

      const canMerge3 = next1 && next2
        && !current.tile.stone && !current.tile.tnt
        && !next1.tile.stone && !next1.tile.tnt
        && !next2.tile.stone && !next2.tile.tnt
        && current.tile.value === next1.tile.value
        && current.tile.value === next2.tile.value
        && current.tile.value > 0;
      const [targetR, targetC] = coords[output++];
      if (canMerge3) {
        const value = current.tile.value * 2;
        result[targetR][targetC] = createTile(value, { merged: true });
        gained += value;
        merges++;
        tripleBonus = true;
        moved = true;
        index += 3;
      } else {
        const next = next1;
        const canMerge2 = next
          && !current.tile.stone && !current.tile.tnt
          && !next.tile.stone && !next.tile.tnt
          && current.tile.value === next.tile.value
          && current.tile.value > 0;
        if (canMerge2) {
          const value = current.tile.value * 2;
          result[targetR][targetC] = createTile(value, { merged: true });
          gained += value;
          merges++;
          moved = true;
          index += 2;
        } else {
          result[targetR][targetC] = { ...current.tile, isNew: false, merged: false };
          if (current.r !== targetR || current.c !== targetC) moved = true;
          index++;
        }
      }
    }
  }
  return { grid: result, gained, moved, merges, tripleBonus, tntExplosion };
}

/** TNT explosion: phá hủy ô trong bán kính 1×2 quanh TNT */
function applyTNTExplosion(grid, explosion) {
  const next = cloneGrid(grid);
  const { r, c, r2, c2 } = explosion;
  // Destroy 3×3 area around each TNT
  for (const [cr, cc] of [[r, c], [r2, c2]]) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
          if (next[nr][nc] && !next[nr][nc].tnt) {
            next[nr][nc] = 0;
          }
        }
      }
    }
  }
  // Remove both TNTs
  next[r][c] = 0;
  next[r2][c2] = 0;
  return next;
}

/** Đá sống thêm một lượt; hết hạn thì vỡ. */
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
const TNT_STYLE = { bg: "#7f1d1d", color: "#fca5a5", border: "#ef4444", glow: "0 0 14px #ef4444,0 0 28px rgba(239,68,68,.6),inset 0 -4px 10px rgba(0,0,0,.3),inset 0 3px 6px rgba(255,255,255,.2)" };

// ── Particles ──────────────────────────────────────────────────────

export default function Game2048({ paused = false, onGameOver }) {
  const { t } = useTranslation();
  const [grid, setGrid] = useState(createTileGrid);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [status, setStatus] = useState(null);
  const [motion, setMotion] = useState({ direction: "", merged: false });
  const [maxTile, setMaxTile] = useState(2);
  const [moveCount, setMoveCount] = useState(0);
  const [undoLeft, setUndoLeft] = useState(3);
  const [hudExtra, setHudExtra] = useState({ combo: 0, mult: 1, notice: "" });
  // Rung màn là MỘT lớp CSS, không phải con số giảm dần qua state: bản cũ hạ
  // `shakeMag` bằng chuỗi setTimeout 30ms nên mỗi cú gộp kéo theo ~10 lần
  // re-render cả bàn, đúng lúc 16 ô đang trượt. 0 = không rung, 1 = gộp lớn,
  // 2 = TNT nổ.
  const [shake, setShake] = useState(0);
  const [fever, setFever] = useState(0);
  const [feverChain, setFeverChain] = useState(0);
  const [milestone, setMilestone] = useState(null);
  const [bestTileEver, setBestTileEver] = useState(2);
  const [tripleScore, setTripleScore] = useState(0);

  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);
  const boardRef = useRef(null);
  const gridRef = useRef(grid);
  const comboRef = useRef(createCombo({ windowMs: 9000, step: 0.25, max: 3 }));
  const levelRef = useRef(1);
  const historyRef = useRef([]);
  const feverRef = useRef(0);

  // Animated score counter
  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.max(1, Math.ceil(diff / 12));
    const t = setTimeout(() => setDisplayScore((s) => Math.min(score, s + step)), 16);
    return () => clearTimeout(t);
  }, [score, displayScore]);

  // Hết animation thì bỏ lớp rung — một lần re-render, không phải mười.
  useEffect(() => {
    if (!shake) return undefined;
    const t = setTimeout(() => setShake(0), 280);
    return () => clearTimeout(t);
  }, [shake]);

  // Fever countdown
  useEffect(() => {
    if (fever <= 0) return;
    const t = setTimeout(() => {
      setFever((f) => {
        const next = f - 1;
        feverRef.current = next;
        if (next <= 0) setFeverChain(0);
        return next;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [fever]);

  // Triple score countdown (10 giây = 100 ticks × 100ms)
  useEffect(() => {
    if (tripleScore <= 0) return;
    const t = setTimeout(() => setTripleScore((s) => s - 1), 100);
    return () => clearTimeout(t);
  }, [tripleScore]);


  // Milestone celebration auto-dismiss
  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(() => setMilestone(null), 2200);
    return () => clearTimeout(t);
  }, [milestone]);

  const handleMove = useCallback((direction) => {
    if (status || paused) return;
    const { grid: movedGrid, gained, moved, merges, tripleBonus, tntExplosion } = moveTileGrid(gridRef.current, direction);
    if (!moved) return;

    historyRef.current = [
      ...historyRef.current.slice(-2),
      { grid: gridRef.current, score, maxTile, moveCount },
    ];
    const combo = comboRef.current;
    let next = ageStones(movedGrid);
    let addedScore = 0;

    // TNT explosion: nổ 3×3 quanh 2 TNT, +500 điểm
    if (tntExplosion) {
      next = applyTNTExplosion(next, tntExplosion);
      addedScore += 500;
      setScore((s) => s + 500);
      setShake(2);
      playGameMerge();
      hapticMerge();
    }

    if (gained > 0) {
      const chainMult = 1 + (merges - 1) * 0.5;
      const mult = combo.hit();
      const feverMult = feverRef.current > 0 ? 2 : 1;
      const tripleMult = tripleScore > 0 ? 3 : 1;
      addedScore = Math.round(gained * chainMult * mult * feverMult * tripleMult);
      setScore((s) => s + addedScore);
      playGameMerge();
      hapticMerge();

      // 3-gộp → kích hoạt ×3 điểm trong 10 giây
      if (tripleBonus) {
        setTripleScore(100);
        setHudExtra((h) => ({ ...h, notice: t("arcadeGame.g2048Triple") }));
        setShake(1);
      }

      if (gained >= 128) setShake(1);

      // Fever chain tracking
      const newChain = feverChain + merges;
      setFeverChain(newChain);
      if (newChain >= FEVER_THRESHOLD && feverRef.current <= 0) {
        setFever(FEVER_DURATION);
        feverRef.current = FEVER_DURATION;
        setHudExtra((h) => ({ ...h, notice: t("arcadeGame.g2048Fever") }));
      }

      // Milestone check
      const newMax = Math.max(maxTile, gained);
      if (MILESTONES.includes(newMax) && newMax > bestTileEver) {
        setMilestone(newMax);
        setBestTileEver(newMax);
        setShake(2);
      }
    } else {
      combo.reset();
      setFeverChain(0);
      playGameMove();
      hapticMove();
    }

    const level = levelFor(GAME_ID, score + addedScore);
    next = addRandomObjectTile(next, ramp(GAME_ID, level, 0.1, 0.38));
    if (level >= STONE_FROM_LEVEL && Math.random() < ramp(GAME_ID, level, 0.05, 0.16)) {
      next = addStoneTile(next, Math.max(4, Math.round(ramp(GAME_ID, level, 10, 5))));
    }
    // TNT tile spawn: từ cấp 3, cơ hội 6%
    if (level >= 3 && Math.random() < TNT_SPAWN_CHANCE) {
      next = addTNTTile(next);
    }

    gridRef.current = next;
    setMotion({ direction, merged: gained > 0 });
    setGrid(next);
    setMoveCount(count => count + 1);
    setMaxTile(Math.max(...next.flat().map((t) => t?.value || 0)));
    setHudExtra({
      combo: combo.chain + (combo.chain > 0 ? 1 : 0),
      mult: combo.mult * (feverRef.current > 0 ? 2 : 1),
      notice: level !== levelRef.current
        ? t(level >= STONE_FROM_LEVEL ? "arcadeGame.g2048LevelStone" : "arcadeGame.g2048Level", { level })
        : "",
    });
    levelRef.current = level;

    if (isGameOver(next)) {
      setStatus("lose");
      playGameLose();
      hapticLose();
    }
  }, [status, paused, score, maxTile, moveCount, feverChain, bestTileEver, tripleScore]);

  const handleUndo = () => {
    if (paused || status || undoLeft <= 0 || historyRef.current.length === 0) return;
    const previous = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    gridRef.current = previous.grid;
    setGrid(previous.grid);
    setScore(previous.score);
    setMaxTile(previous.maxTile);
    setMoveCount(previous.moveCount);
    setUndoLeft(value => value - 1);
    comboRef.current.reset();
    setFeverChain(0);
    setTripleScore(0);
    setHudExtra({ combo: 0, mult: 1, notice: t("arcadeGame.g2048Undone") });
    playGameMove();
    hapticMove();
  };

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

  const nextTarget = Math.min(2048, 2 ** (Math.floor(Math.log2(Math.max(2, maxTile))) + 1));
  const progressToNext = maxTile >= 2048 ? 100 : Math.min(100, (Math.log2(maxTile) / Math.log2(nextTarget)) * 100);

  return (
    <div className="game2048-fullscreen">
      {/* Ambient glow background */}
      <div className={`game2048-bg ${fever > 0 ? "is-fever" : ""}`} />

      {/* HUD overlay */}
      <div className="game2048-hud-overlay">
        <div className="game2048-score-display">
          <div className="game2048-score-main">
            <small>{t("arcadeGame.g2048Score")}</small>
            <strong>{displayScore.toLocaleString()}</strong>
          </div>
          <div className="game2048-score-secondary">
            <div>
              <small>{t("arcadeGame.g2048Moves")}</small>
              <b>{moveCount}</b>
            </div>
            <div>
              <small>MỐC</small>
              <b>{maxTile}</b>
            </div>
            <div>
              <small>CHAIN</small>
              <b>{hudExtra.combo}×{hudExtra.mult}</b>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="game2048-progress">
          <div className="game2048-progress-bar" style={{ width: `${progressToNext}%` }} />
          <span>{maxTile} → {nextTarget}</span>
        </div>

        {fever > 0 && (
          <div className="game2048-fever-badge">
            🔥 FEVER ×2 · {fever} lượt
          </div>
        )}
        {tripleScore > 0 && (
          <div className="game2048-triple-badge">
            ⚡ ×3 ĐIỂM · {(tripleScore / 10).toFixed(1)}s
          </div>
        )}
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className={`game2048-board-fullscreen move-${motion.direction || "idle"} ${motion.merged ? "did-merge" : ""} ${fever > 0 ? "is-fever" : ""}${shake ? ` is-shake-${shake}` : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStartRef.current = null; resetSwipePreview(); }}
      >
        <div className="game2048-cells" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <span key={index} />)}</div>
        <div className="game2048-tiles">
          {grid.flatMap((row, r) => row.map((tile, c) => {
            if (!tile) return null;
            const style = tile.tnt ? TNT_STYLE : tile.stone ? STONE_STYLE : (TILE_COLORS[tile.value] || TILE_COLORS[2048]);
            return (
              <div key={tile.id}
                className={`game2048-tile tile-row-${r} tile-col-${c} is-filled ${tile.isNew ? "is-new" : ""} ${tile.merged ? "is-merged" : ""} ${tile.stone ? "is-stone" : ""} ${tile.tnt ? "is-tnt" : ""}`}
                style={{
                  "--row": r, "--col": c,
                  background: style.bg, color: style.color, borderColor: style.border, boxShadow: style.glow,
                  fontSize: tile.stone || tile.tnt ? "clamp(14px,3.4vw,20px)" : tile.value >= 1000 ? "clamp(16px,4vw,25px)" : "clamp(21px,5vw,34px)",
                }}
                aria-label={tile.tnt ? t("arcadeGame.g2048Tnt") : tile.stone ? t("arcadeGame.g2048Stone", { turns: tile.life }) : t("arcadeGame.g2048Tile", { value: tile.value })}>
                {tile.tnt ? (
                  <span className="tile-tnt">
                    <span className="material-symbols-outlined">local_fire_department</span>
                  </span>
                ) : tile.stone ? (
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

      {/* Milestone celebration */}
      {milestone && (
        <div className="game2048-milestone">
          <div className="game2048-milestone-glyph" style={{ background: TILE_COLORS[milestone]?.bg || "#ffe600", color: TILE_COLORS[milestone]?.color || "#000" }}>
            {milestone}
          </div>
          <strong>MILESTONE!</strong>
          <p>+{milestone} điểm bonus!</p>
        </div>
      )}

      {/* Bottom controls */}
      <div className="game2048-controls-bottom">
        <button type="button" onClick={handleUndo} disabled={undoLeft <= 0 || historyRef.current.length === 0 || Boolean(status)} className="game2048-btn">
          <span className="material-symbols-outlined">undo</span>
          <b>{undoLeft}</b>
        </button>
      </div>

      {/* Hint */}
      <p className="game2048-hint-fullscreen">
        Vuốt để hợp nhất · Gộp 3 ô giống → ×3 điểm 10s · FEVER ×2 · 2 TNT chạm → nổ 3×3
      </p>
    </div>
  );
}
