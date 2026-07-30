import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { readGamePalette, withAlpha } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";
import { LINES_PER_STAGE, tetrisLineScore, tetrisStageForLines } from "./tetrisRules";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · Túi 7 khối (7-bag): mỗi 7 lượt đủ cả 7 hình — hết cảnh "chờ mãi không ra I".
// · GIỮ KHỐI (hold) + xem trước 3 khối kế tiếp.
// · Xoay có "wall kick": xoay sát tường không còn bị chặn.
// · Điểm = điểm hàng × hệ số cấp × chuỗi liên hoàn; xoá 4 hàng (Tetris) liên
//   tiếp được thưởng back-to-back.
// · Từ cấp 6 sàn ĐẨY RÁC lên: cứ vài khối lại mọc một hàng rác có một lỗ.
const COLS = 10;
const ROWS = 20;
const GAME_ID = "tetris";
const GARBAGE_FROM_LEVEL = 6;
const LOCK_DELAY_MS = 420;
const MAX_PARTICLES = 140;

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
const GARBAGE = "#5b6478";
const LINE_LABEL = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];

function makePiece(key) {
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

// Túi 7 khối: xáo trộn cả bộ rồi rút dần, thay cho random thuần.
function refillBag(bag) {
  const next = [...SHAPE_KEYS];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  bag.push(...next);
}

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// ── Particle helpers ──────────────────────────────────────────────
function spawnParticles(particles, x, y, color, count = 8) {
  if (particles.length >= MAX_PARTICLES) return;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      decay: 0.025 + Math.random() * 0.015,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function spawnLineClearParticles(particles, row, cellW, cellH, color) {
  if (particles.length >= MAX_PARTICLES) return;
  for (let c = 0; c < COLS; c++) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: (c + 0.5) * cellW,
        y: (row + 0.5) * cellH,
        vx: (Math.random() - 0.5) * 6,
        vy: -1 - Math.random() * 4,
        life: 1,
        decay: 0.02 + Math.random() * 0.01,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }
}

function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.97;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.9;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

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

const getGhostY = (piece, board) => {
  let ghostY = piece.y;
  while (!checkCollision(piece, board, 0, ghostY - piece.y + 1)) ghostY++;
  return ghostY;
};

export default function GameTetris({ paused = false, onGameOver }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const nextCanvasRef = useRef(null);
  const holdCanvasRef = useRef(null);
  const pointerRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const [hud, setHud] = useState({ score: 0, lines: 0, stage: 1, combo: 0, mult: 1, notice: "" });

  const { playBeep, playMove, playLose } = useArcadeSound();

  const gameState = useRef(null);
  if (gameState.current === null) {
    const bag = [];
    refillBag(bag);
    gameState.current = {
      board: createEmptyBoard(),
      bag,
      currentPiece: makePiece(bag.pop()),
      queue: [],
      hold: null,
      holdUsed: false,
      score: 0,
      lines: 0,
      level: 1,
      piecesSinceGarbage: 0,
      backToBack: false,
      combo: createCombo({ windowMs: 6000, step: 0.2, max: 2.4 }),
      gravity: 620,
      lastTick: 0,
      isGameOver: false,
      particles: [],
      popups: [],
      lineFlash: [],
      lineFlashTimer: 0,
      shakeX: 0, shakeY: 0, shakeMag: 0,
      groundedAt: 0,
    };
    while (gameState.current.queue.length < 3) {
      if (!bag.length) refillBag(bag);
      gameState.current.queue.push(bag.pop());
    }
  }

  const pullPiece = useCallback(() => {
    const s = gameState.current;
    if (!s.bag.length) refillBag(s.bag);
    s.queue.push(s.bag.pop());
    return makePiece(s.queue.shift());
  }, []);

  const syncHud = useCallback((notice) => {
    const s = gameState.current;
    setHud((prev) => ({
      score: s.score,
      lines: s.lines,
      stage: tetrisStageForLines(s.lines),
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, []);

  const notify = useCallback((text) => {
    syncHud(text);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(
      () => setHud((h) => (h.notice === text ? { ...h, notice: "" } : h)),
      1600,
    );
  }, [syncHud]);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  const drawBlock = useCallback((ctx, x, y, size, color, isGhost = false, pal = null) => {
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
      // Mặt khối 3D dùng các mảng màu phẳng thay cho gradient + shadow mới ở
      // từng frame. Hình vẫn có chiều sâu nhưng nhẹ hơn rõ rệt trên iPhone.
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px + pad, py + pad, size - pad * 2, size - pad * 2, 4);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,.32)";
      ctx.beginPath();
      ctx.moveTo(px + pad + 3, py + pad + 2);
      ctx.lineTo(px + size - pad - 3, py + pad + 2);
      ctx.lineTo(px + size - pad - 6, py + pad + 5);
      ctx.lineTo(px + pad + 6, py + pad + 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pal?.isLight ? "rgba(0,0,0,.24)" : "rgba(0,0,0,.34)";
      ctx.beginPath();
      ctx.moveTo(px + size - pad - 5, py + pad + 5);
      ctx.lineTo(px + size - pad - 2, py + pad + 2);
      ctx.lineTo(px + size - pad - 2, py + size - pad - 2);
      ctx.lineTo(px + size - pad - 5, py + size - pad - 5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + pad + 1, py + pad + 1, size - pad * 2 - 2, size - pad * 2 - 2);
    }
    ctx.restore();
  }, []);

  // Vẽ hàng chờ (3 khối) và ô giữ khối.
  const drawPreviews = useCallback(() => {
    const s = gameState.current;

    const paint = (canvas, keys) => {
      if (!canvas) return;
      const cssWidth = canvas.clientWidth || 58;
      const cssHeight = canvas.clientHeight || 58;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(cssWidth * dpr);
      const pixelHeight = Math.round(cssHeight * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const slotHeight = cssHeight / Math.max(1, keys.length);
      const cellSize = Math.min(13.5, cssWidth / 4.35, slotHeight / 2.6);
      keys.forEach((key, i) => {
        if (!key) return;
        const m = SHAPES[key].matrix;
        const ox = (cssWidth - m[0].length * cellSize) / 2 / cellSize;
        const oy = ((i * slotHeight) + (slotHeight - m.length * cellSize) / 2) / cellSize;
        m.forEach((row, r) => row.forEach((v, c) => {
          if (v) drawBlock(ctx, ox + c, oy + r, cellSize, SHAPES[key].color);
        }));
      });
    };

    paint(nextCanvasRef.current, s.queue);
    paint(holdCanvasRef.current, [s.hold]);
  }, [drawBlock]);

  // Một hàng rác đầy trừ đúng một lỗ — buộc người chơi dọn từ dưới lên.
  const pushGarbage = useCallback(() => {
    const s = gameState.current;
    const hole = Math.floor(Math.random() * COLS);
    const row = Array.from({ length: COLS }, (_, c) => (c === hole ? 0 : GARBAGE));
    if (s.board[0].some((c) => c)) return true; // đẩy nữa là tràn
    s.board.shift();
    s.board.push(row);
    if (s.currentPiece) s.currentPiece.y = Math.max(0, s.currentPiece.y - 1);
    s.shakeMag = 6;
    return false;
  }, []);

  const lockPiece = useCallback(() => {
    const s = gameState.current;
    const piece = s.currentPiece;
    const canvas = canvasRef.current;
    const cell = canvas ? canvas.offsetWidth / COLS : 13;

    piece.matrix.forEach((row, r) => row.forEach((val, c) => {
      if (!val) return;
      const bY = piece.y + r;
      const bX = piece.x + c;
      if (bY >= 0 && bY < ROWS && bX >= 0 && bX < COLS) {
        s.board[bY][bX] = piece.color;
        spawnParticles(s.particles, (bX + 0.5) * cell, (bY + 0.5) * cell, piece.color, 3);
      }
    }));

    const clearedRows = [];
    const filtered = s.board.filter((row, idx) => {
      const full = row.every((c) => c !== 0);
      if (full) clearedRows.push(idx);
      return !full;
    });
    while (filtered.length < ROWS) filtered.unshift(Array(COLS).fill(0));
    s.board = filtered;
    const cleared = clearedRows.length;

    if (cleared > 0) {
      hapticMerge();
      const previousStage = tetrisStageForLines(s.lines);
      const mult = s.combo.hit();
      const wasBackToBack = cleared === 4 && s.backToBack;
      const perfectClear = filtered.every((row) => row.every((cellValue) => !cellValue));
      const gained = tetrisLineScore({
        cleared,
        level: s.level,
        multiplier: mult,
        backToBack: s.backToBack,
        perfectClear,
      });
      s.score += gained;
      s.lines += cleared;
      s.backToBack = cleared === 4;
      s.shakeMag = cleared * 3 + s.combo.chain * 1.5;
      s.lineFlash = clearedRows;
      s.lineFlashTimer = 8;

      if (canvas) {
        const cellW = canvas.offsetWidth / COLS;
        const cellH = canvas.offsetHeight / ROWS;
        clearedRows.forEach((row) => spawnLineClearParticles(s.particles, row, cellW, cellH, piece.color));
        const midY = (clearedRows[0] + 0.5) * cellH;
        pushPopup(s.popups, canvas.offsetWidth / 2, midY, `+${gained.toLocaleString("vi-VN")}`, "#ffffff", 20);
        pushPopup(s.popups, canvas.offsetWidth / 2, midY - 22,
          `${LINE_LABEL[cleared] || "MEGA"}${wasBackToBack ? " B2B" : ""}`, piece.color, 13);
      }

      const nextStage = tetrisStageForLines(s.lines);
      if (perfectClear) {
        notify(t("arcadeGame.tetris.perfectClear"));
      } else if (nextStage > previousStage) {
        s.score += nextStage * 250;
        notify(t("arcadeGame.tetris.stageUnlocked", { stage: nextStage }));
      }

      if (cleared >= 4 && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({ particleCount: 54, spread: 72, origin: { y: 0.5 }, disableForReducedMotion: true });
        });
      }
    } else {
      s.combo.reset();
      s.backToBack = false;
      playMove();
      hapticMove();
    }

    // ── Độ khó tự động ──
    const level = levelFor(GAME_ID, s.score);
    if (level !== s.level) {
      s.level = level;
      s.gravity = ramp(GAME_ID, level, 620, 95);
      notify(t(
        level >= GARBAGE_FROM_LEVEL ? "arcadeGame.tetris.levelGarbage" : "arcadeGame.tetris.levelFaster",
        { level },
      ));
    }

    s.piecesSinceGarbage++;
    let toppedOut = false;
    if (s.level >= GARBAGE_FROM_LEVEL && s.piecesSinceGarbage >= Math.round(ramp(GAME_ID, s.level, 26, 11))) {
      s.piecesSinceGarbage = 0;
      toppedOut = pushGarbage();
    }

    s.holdUsed = false;
    s.groundedAt = 0;
    const spawn = pullPiece();
    drawPreviews();

    if (toppedOut || checkCollision(spawn, s.board)) {
      s.isGameOver = true;
      s.shakeMag = 15;
      playLose();
      hapticLose();
      setTimeout(() => onGameOver?.(s.score, "lose"), 500);
    } else {
      s.currentPiece = spawn;
    }
    syncHud();
  }, [pullPiece, drawPreviews, pushGarbage, playMove, playLose, onGameOver, syncHud, notify, t]);

  const tick = useCallback((now = performance.now()) => {
    const s = gameState.current;
    if (s.isGameOver) return;
    if (!checkCollision(s.currentPiece, s.board, 0, 1)) {
      s.currentPiece.y += 1;
      s.groundedAt = 0;
    } else if (!s.groundedAt) {
      s.groundedAt = now;
    }
  }, []);

  // ── Main Render Canvas Loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let cell = 0;
    let dpr = 1;

    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = width * 2;
      cell = width / COLS;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
    };
    resizeCanvas();
    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(resizeCanvas)
      : null;
    resizeObserver?.observe(canvas);

    gameState.current.lastTick = 0;
    const pal = readGamePalette(canvas);

    drawPreviews();

    let stopped = false;
    let rafId;
    const renderFrame = (ts) => {
      if (stopped) return;
      const s = gameState.current;

      if (s.lastTick === 0) s.lastTick = ts;
      if (ts - s.lastTick >= s.gravity) {
        s.lastTick = ts;
        tick(ts);
      }

      if (s.groundedAt && ts - s.groundedAt >= LOCK_DELAY_MS) {
        lockPiece();
      }

      if (s.isGameOver) { stopped = true; return; }

      if (s.shakeMag > 0.2) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag;
        s.shakeMag *= 0.85;
      } else { s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0; }

      if (s.lineFlashTimer > 0) s.lineFlashTimer--;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      ctx.fillStyle = pal.bg;
      ctx.fillRect(-5, -5, width + 10, height + 10);

      const centerGlow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
      centerGlow.addColorStop(0, withAlpha(pal.accent, 0.03));
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(width, r * cell); ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, height); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (s.lineFlashTimer > 0 && s.lineFlash.length > 0) {
        ctx.fillStyle = withAlpha("#ffffff", (s.lineFlashTimer / 8) * 0.5);
        s.lineFlash.forEach((row) => ctx.fillRect(0, row * cell, canvas.width, cell));
      }

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = s.board[r][c];
          if (color) drawBlock(ctx, c, r, cell, color, false, pal);
        }
      }

      if (!s.isGameOver && s.currentPiece) {
        const ghostY = getGhostY(s.currentPiece, s.board);
        s.currentPiece.matrix.forEach((row, r) => row.forEach((val, c) => {
          if (!val) return;
          const gx = s.currentPiece.x + c;
          const gy = ghostY + r;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            drawBlock(ctx, gx, gy, cell, s.currentPiece.color, true, pal);
          }
        }));

        s.currentPiece.matrix.forEach((row, r) => row.forEach((val, c) => {
          if (!val) return;
          const px = s.currentPiece.x + c;
          const py = s.currentPiece.y + r;
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            drawBlock(ctx, px, py, cell, s.currentPiece.color, false, pal);
          }
        }));
      }

      updateParticles(s.particles);
      drawParticles(ctx, s.particles);
      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      ctx.restore();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      stopped = true;
      resizeObserver?.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [tick, lockPiece, drawPreviews, drawBlock, paused]);

  // ── Input Controls ───────────────────────────────────────────────────────
  const shift = useCallback((dx) => {
    const s = gameState.current;
    if (s.isGameOver) return;
    const direction = Math.sign(dx);
    let moved = false;
    for (let step = 0; step < Math.abs(dx); step++) {
      if (checkCollision(s.currentPiece, s.board, direction, 0)) break;
      s.currentPiece.x += direction;
      moved = true;
    }
    if (moved) {
      s.groundedAt = checkCollision(s.currentPiece, s.board, 0, 1) ? performance.now() : 0;
      playBeep();
      hapticMove();
    }
  }, [playBeep]);

  // Xoay kèm wall kick: thử đẩy ngang vài ô trước khi bỏ cuộc.
  const rotate = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    const m = s.currentPiece.matrix;
    const rotated = m[0].map((_, i) => m.map((row) => row[i]).reverse());
    for (const kick of [0, -1, 1, -2, 2]) {
      const test = { ...s.currentPiece, matrix: rotated, x: s.currentPiece.x + kick };
      if (!checkCollision(test, s.board)) {
        s.currentPiece.matrix = rotated;
        s.currentPiece.x += kick;
        s.groundedAt = checkCollision(s.currentPiece, s.board, 0, 1) ? performance.now() : 0;
        playBeep();
        hapticMove();
        return;
      }
    }
  }, [playBeep]);

  // Thả mềm: mỗi ô rơi thêm 1 điểm, thưởng người chơi chủ động.
  const softDrop = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    if (!checkCollision(s.currentPiece, s.board, 0, 1)) {
      s.currentPiece.y += 1;
      s.score += 1;
      s.groundedAt = 0;
      s.lastTick = performance.now();
      syncHud();
    } else if (!s.groundedAt) {
      s.groundedAt = performance.now();
    }
  }, [syncHud]);

  const hardDrop = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver) return;
    const ghostY = getGhostY(s.currentPiece, s.board);
    s.score += (ghostY - s.currentPiece.y) * 2;
    s.currentPiece.y = ghostY;
    s.shakeMag = 4;
    s.groundedAt = 0;
    lockPiece();
  }, [lockPiece]);

  // Giữ khối: đổi khối đang rơi với khối trong kho, mỗi lượt rơi chỉ một lần.
  const holdPiece = useCallback(() => {
    const s = gameState.current;
    if (s.isGameOver || s.holdUsed) return;
    const stored = s.hold;
    s.hold = s.currentPiece.key;
    s.currentPiece = stored ? makePiece(stored) : pullPiece();
    s.holdUsed = true;
    s.groundedAt = 0;
    playBeep();
    hapticMove();
    drawPreviews();
  }, [pullPiece, drawPreviews, playBeep]);

  useEffect(() => {
    if (paused) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); shift(-1); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); shift(1); }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); softDrop(); }
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); rotate(); }
      if (e.key === " ") { e.preventDefault(); hardDrop(); }
      if (e.key === "c" || e.key === "Shift") { e.preventDefault(); holdPiece(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shift, softDrop, rotate, hardDrop, holdPiece, paused]);

  const handlePointerDown = useCallback((event) => {
    if (paused) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current = { x: event.clientX, y: event.clientY, at: performance.now() };
  }, [paused]);

  const handlePointerUp = useCallback((event) => {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || paused) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 14) {
      rotate();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      const steps = Math.min(4, Math.max(1, Math.round(Math.abs(dx) / 28)));
      shift(Math.sign(dx) * steps);
      return;
    }
    if (dy > 28) hardDrop();
  }, [hardDrop, paused, rotate, shift]);

  const stageLineProgress = hud.lines % LINES_PER_STAGE;
  const rowsUntilNextStage = LINES_PER_STAGE - stageLineProgress;

  return (
    <div className="ttr-game">
      <ArcadeHud
        gameId={GAME_ID}
        score={hud.score}
        combo={hud.combo}
        multiplier={hud.mult}
        notice={hud.notice}
        stats={[{ label: t("arcadeGame.tetris.linesCleared"), value: hud.lines }]}
      />

      <div className="ttr-layout">
        <div className="ttr-board-frame">
          <div className="ttr-board-topline" aria-hidden="true">
            <span>{t("arcadeGame.tetris.stage", { stage: hud.stage })}</span>
            <b>{t("arcadeGame.tetris.speed", { level: levelFor(GAME_ID, hud.score) })}</b>
          </div>
          <canvas
            ref={canvasRef}
            className="ttr-board"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { pointerRef.current = null; }}
            aria-label={t("arcadeGame.tetris.boardLabel")}
          />
        </div>

        <aside className="ttr-side" aria-label={t("arcadeGame.tetris.piecePanel")}>
          <button type="button" onClick={holdPiece} className="ttr-slot ttr-slot--hold">
            <small>{t("arcadeGame.tetris.hold")}</small>
            <canvas ref={holdCanvasRef} className="ttr-preview ttr-preview--hold" />
            <span className="material-symbols-outlined">swap_horiz</span>
          </button>

          <div className="ttr-slot ttr-slot--next">
            <small>{t("arcadeGame.tetris.next")}</small>
            <canvas ref={nextCanvasRef} className="ttr-preview ttr-preview--next" />
          </div>

          <div className="ttr-goal">
            <small>{t("arcadeGame.tetris.mission")}</small>
            <strong>{rowsUntilNextStage}</strong>
            <span>{t("arcadeGame.tetris.rowsLeft")}</span>
            <div aria-hidden="true"><i style={{ height: `${stageLineProgress * 10}%` }} /></div>
          </div>
        </aside>
      </div>

      <div className="ttr-controls" aria-label={t("arcadeGame.tetris.controls")}>
        <button type="button" onClick={() => shift(-1)} className="ttr-btn" aria-label={t("arcadeGame.tetris.left")}>
          <span className="material-symbols-outlined">arrow_back</span><small>{t("arcadeGame.tetris.left")}</small>
        </button>
        <button type="button" onClick={rotate} className="ttr-btn" aria-label={t("arcadeGame.tetris.rotate")}>
          <span className="material-symbols-outlined">rotate_right</span><small>{t("arcadeGame.tetris.rotate")}</small>
        </button>
        <button type="button" onClick={softDrop} className="ttr-btn" aria-label={t("arcadeGame.tetris.down")}>
          <span className="material-symbols-outlined">arrow_downward</span><small>{t("arcadeGame.tetris.down")}</small>
        </button>
        <button type="button" onClick={() => shift(1)} className="ttr-btn" aria-label={t("arcadeGame.tetris.right")}>
          <span className="material-symbols-outlined">arrow_forward</span><small>{t("arcadeGame.tetris.right")}</small>
        </button>
        <button type="button" onClick={hardDrop} className="ttr-btn ttr-btn--primary" aria-label={t("arcadeGame.tetris.drop")}>
          <span className="material-symbols-outlined">vertical_align_bottom</span><small>{t("arcadeGame.tetris.drop")}</small>
        </button>
      </div>

      <p className="ttr-hint">
        {t("arcadeGame.tetris.touchHint")}
      </p>
    </div>
  );
}
