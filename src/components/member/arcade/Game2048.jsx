import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { playGameMove, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { createCombo } from "./arcadeProgression";
import { useJoyStore } from "../../../stores/joyStore";
import {
  buyHammer2048,
  unlockCharacter2048,
  fetchCollection2048,
} from "../../../services/api/modules/arcadeApi";
import { notify } from "../../../lib/notify";

import {
  GRID_SIZE,
  BOT_TIERS,
  JELLY_UNLOCK_BONUSES,
  createInitialGrid,
  addRandomBotTile,
  createIceTile,
  emptyCells,
  cloneGrid,
  moveGrid,
  checkHasValidMoves,
  getBotMergePoints,
  playBotFusionSound,
  playIceFreezeSound,
  playIceCrackSound,
  playIceMeltSound,
  playStoneShatterSound,
  playVaultUnlockSound,
  playCalmHammerSound,
} from "./game2048/game2048Logic";

import Game2048Header from "./game2048/Game2048Header";
import Game2048Cell from "./game2048/Game2048Cell";
import Game2048Controls from "./game2048/Game2048Controls";
import Game2048HammerModal from "./game2048/Game2048HammerModal";
import Game2048UnlockModal from "./game2048/Game2048UnlockModal";
import Game2048VaultModal from "./game2048/Game2048VaultModal";
import Game2048EndModal from "./game2048/Game2048EndModal";

const VAULT_STORAGE_KEY = "hugo_arcade_2048_unlocked_vault";
const BEST_BOT_STORAGE_KEY = "hugo_arcade_2048_best_bot";

export default function Game2048({ paused = false, onGameOver, bio }) {
  const { t } = useTranslation();
  const walletBalance = useJoyStore((s) => s.balance);

  // ── Trạng thái bàn cờ & Điểm số ───────────────────────────────────────────
  const [grid, setGrid] = useState(createInitialGrid);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(2);
  const [bestBotEver, setBestBotEver] = useState(() => {
    try {
      return parseInt(localStorage.getItem(BEST_BOT_STORAGE_KEY) || "2", 10);
    } catch {
      return 2;
    }
  });

  // ── Búa phá ô ─────────────────────────────────────────────────────────────
  const [hammers, setHammers] = useState(2);
  const [isHammerMode, setIsHammerMode] = useState(false);
  const [smashTarget, setSmashTarget] = useState(null);
  const [showBuyHammerModal, setShowBuyHammerModal] = useState(false);
  const [isPurchasingHammer, setIsPurchasingHammer] = useState(false);

  // ── Kho nhân vật & Modal ──────────────────────────────────────────────────
  const [unlockedVault, setUnlockedVault] = useState(() => {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(Number);
      }
    } catch { /* ignore */ }
    return [1, 2];
  });
  const [newCharacterReveal, setNewCharacterReveal] = useState(null);
  const [showVaultModal, setShowVaultModal] = useState(false);

  // ── Hiệu ứng trực quan & Combo ────────────────────────────────────────────
  const [particles, setParticles] = useState([]);
  const [floatingBadges, setFloatingBadges] = useState([]);
  const [status, setStatus] = useState(null); // null | "gameover" | "win"
  const [shake, setShake] = useState(0);
  const [fever, setFever] = useState(0);
  const [feverChain, setFeverChain] = useState(0);
  const [notice, setNotice] = useState("");
  const [scoreDelta, setScoreDelta] = useState(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // ── Di chuyển & Vuốt ──────────────────────────────────────────────────────
  const [lastMoveDir, setLastMoveDir] = useState(null);
  const [isSliding, setIsSliding] = useState(false);
  const [movesCount, setMovesCount] = useState(0);
  const [lastIceSpawnMove, setLastIceSpawnMove] = useState(0);

  const reportedRef = useRef(false);
  const touchStartRef = useRef(null);
  const gridRef = useRef(grid);
  const comboRef = useRef(createCombo({ windowMs: 2800, step: 0.25, max: 3 }));
  const historyRef = useRef([]);

  gridRef.current = grid;

  // ── Đồng bộ kho nhân vật từ API khi khởi động ────────────────────────────
  useEffect(() => {
    let active = true;
    fetchCollection2048()
      .then((data) => {
        if (active && data?.unlockedCharacters?.length) {
          setUnlockedVault((prev) => {
            const merged = Array.from(new Set([...prev, ...data.unlockedCharacters.map(Number)])).sort((a, b) => a - b);
            try { localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // ── Hẹn giờ hạ combo & fever ─────────────────────────────────────────────
  useEffect(() => {
    if (comboMultiplier <= 1) return undefined;
    const tTimer = setTimeout(() => setComboMultiplier(1), 2800);
    return () => clearTimeout(tTimer);
  }, [comboMultiplier]);

  useEffect(() => {
    if (fever <= 0) return undefined;
    const tTimer = setTimeout(() => {
      setFever((f) => {
        const next = f - 1;
        if (next <= 0) setFeverChain(0);
        return next;
      });
    }, 900);
    return () => clearTimeout(tTimer);
  }, [fever]);

  useEffect(() => {
    if (!notice) return undefined;
    const tTimer = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(tTimer);
  }, [notice]);

  // Pháo hoa khi mở khóa nhân vật mới
  useEffect(() => {
    if (!newCharacterReveal) return undefined;
    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 } });
    } catch { /* ignore */ }
    return undefined;
  }, [newCharacterReveal]);

  // ── Xử lý Di chuyển & Gộp Ô ──────────────────────────────────────────────
  const handleMove = useCallback((direction) => {
    if (status || paused || isHammerMode || smashTarget) return;

    const { nextGrid, moved, gained, merges, tripleBonus, mergedPositions } = moveGrid(gridRef.current, direction);
    if (!moved) return;

    setLastMoveDir(direction);
    setIsSliding(true);
    setTimeout(() => setIsSliding(false), 200);

    historyRef.current = [
      ...historyRef.current.slice(-3),
      { grid: gridRef.current, score, maxLevel },
    ];

    let newGrid = nextGrid;
    newGrid = addRandomBotTile(newGrid);

    const nextMoves = movesCount + 1;
    setMovesCount(nextMoves);

    let addedScore = 0;
    if (gained > 0) {
      const combo = comboRef.current;
      const mult = Math.min(1.5, combo.hit());
      setComboMultiplier(mult);
      const feverMult = fever > 0 ? 1.2 : 1;
      const chainMult = 1 + (merges - 1) * 0.1;
      addedScore = Math.round(gained * mult * feverMult * chainMult);

      setScore((s) => s + addedScore);
      setScoreDelta({ amount: addedScore, id: Date.now() });
      setTimeout(() => setScoreDelta(null), 700);

      const highestMergedLevel = Math.max(...mergedPositions.map((p) => p.level), 1);
      playBotFusionSound(highestMergedLevel, tripleBonus);
      hapticMerge();

      // Hiệu ứng hạt tim/sao bay nhẹ nhàng
      if (mergedPositions.length > 0) {
        const ICONS = ["✨", "⭐", "💫", "🌟"];
        const newParts = [];
        mergedPositions.forEach((pos, pIdx) => {
          [0, 60, 120, 180, 240, 300].forEach((angle, sIdx) => {
            const rad = (angle * Math.PI) / 180;
            const dist = 24 + (sIdx % 2) * 12;
            newParts.push({
              id: `part-${Date.now()}-${pIdx}-${sIdx}`,
              x: (pos.c * 25) + 12.5,
              y: (pos.r * 25) + 12.5,
              tx: Math.round(Math.cos(rad) * dist),
              ty: Math.round(Math.sin(rad) * dist),
              symbol: ICONS[sIdx % ICONS.length],
              color: BOT_TIERS[pos.level]?.color || "#facc15",
            });
          });
        });
        setParticles(newParts);
        setTimeout(() => setParticles([]), 550);

        const badges = mergedPositions.map((pos, bIdx) => {
          const pts = getBotMergePoints(pos.level, pos.isTriple);
          return {
            id: `badge-${Date.now()}-${bIdx}`,
            x: (pos.c * 25) + 12.5,
            y: (pos.r * 25) + 12.5,
            text: pos.isTriple ? `SIÊU GỘP ×1.5! +${pts}` : `+${pts}`,
            isTriple: pos.isTriple,
          };
        });
        setFloatingBadges(badges);
        setTimeout(() => setFloatingBadges([]), 700);

        setTimeout(() => {
          setGrid((prevGrid) =>
            prevGrid.map((row) =>
              row.map((cell) => (cell ? { ...cell, isMerged: false, isTriple: false } : null))
            )
          );
        }, 450);
      }

      if (tripleBonus) {
        setNotice(t("arcadeGame.g2048Triple", "SIÊU GỘP 3 CON!"));
        setShake(1);
        setTimeout(() => setShake(0), 200);
      } else if (gained >= 80) {
        setShake(1);
        setTimeout(() => setShake(0), 180);
      }

      const nextChain = feverChain + merges;
      setFeverChain(nextChain);
      if (nextChain >= 4 && fever <= 0) {
        setFever(4);
        setNotice(t("arcadeGame.g2048Fever", "FEVER MODE ×1.2 ĐIỂM!"));
      }
    } else {
      playGameMove();
      hapticMove();
    }

    // ── Xử lý ô đóng băng ──────────────────────────────────────────────────
    let icePos = null;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c]?.type === "ice") {
          icePos = { r, c, tile: newGrid[r][c] };
          break;
        }
      }
      if (icePos) break;
    }

    if (icePos) {
      let decrement = 1;
      if (merges > 0) decrement += 1;
      const adjacentMerge = mergedPositions.some(
        (p) => Math.abs(p.r - icePos.r) + Math.abs(p.c - icePos.c) === 1
      );
      if (adjacentMerge) decrement += 2;

      const remainingTurns = icePos.tile.turnsLeft - decrement;
      if (remainingTurns <= 0) {
        newGrid[icePos.r][icePos.c] = null;
        addedScore += 80;
        playIceMeltSound();
        playStoneShatterSound();
        hapticMerge();
        setShake(1);
        setTimeout(() => setShake(0), 180);
        setNotice("Khối băng đã tan hoàn toàn! Giải phóng 1 ô trống (+80 Điểm)");
        setFloatingBadges((prev) => [
          ...prev,
          {
            id: `melt-${Date.now()}`,
            x: (icePos.c * 25) + 12.5,
            y: (icePos.r * 25) + 12.5,
            text: "BĂNG TAN! +80",
            isTriple: true,
          },
        ]);
        setTimeout(() => setFloatingBadges([]), 750);
      } else {
        newGrid[icePos.r][icePos.c] = {
          ...icePos.tile,
          turnsLeft: remainingTurns,
          isNew: false,
        };
        playIceCrackSound();
        if (adjacentMerge) {
          setNotice(`🔥 Nhiệt lượng hợp thể làm nứt đá! Còn ${remainingTurns} lượt`);
        } else {
          setNotice(`🪨 Ô hóa đá: Còn ${remainingTurns} lượt`);
        }
      }
    } else {
      if (nextMoves >= 14 && (nextMoves - lastIceSpawnMove) >= 22) {
        const empties = emptyCells(newGrid);
        if (empties.length >= 3) {
          const [ir, ic] = empties[Math.floor(Math.random() * empties.length)];
          newGrid[ir][ic] = createIceTile(4, { isNew: true });
          setLastIceSpawnMove(nextMoves);
          playIceFreezeSound();
          setNotice("Một ô đã bị đóng băng! Còn 4 lượt nữa sẽ tan.");
        }
      }
    }

    // Cập nhật cấp cao nhất
    let highestOnBoard = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] && newGrid[r][c].type !== "ice" && newGrid[r][c].level > highestOnBoard) {
          highestOnBoard = newGrid[r][c].level;
        }
      }
    }

    if (highestOnBoard > maxLevel) {
      setMaxLevel(highestOnBoard);
      if (highestOnBoard > bestBotEver) {
        setBestBotEver(highestOnBoard);
        try {
          localStorage.setItem(BEST_BOT_STORAGE_KEY, String(highestOnBoard));
        } catch { /* ignore */ }
      }
    }

    // Kiểm tra nhân vật mới mở khóa kho
    const newlyDiscovered = [];
    for (let lvl = 1; lvl <= highestOnBoard; lvl++) {
      if (!unlockedVault.includes(lvl)) {
        newlyDiscovered.push(lvl);
      }
    }

    if (newlyDiscovered.length > 0) {
      const highestNew = Math.max(...newlyDiscovered);
      const tierInfo = BOT_TIERS[highestNew] || BOT_TIERS[1];
      const bonusJoy = JELLY_UNLOCK_BONUSES[highestNew] || 10;

      const nextVault = Array.from(new Set([...unlockedVault, ...newlyDiscovered])).sort((a, b) => a - b);
      setUnlockedVault(nextVault);
      try {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(nextVault));
      } catch { /* ignore */ }

      setNewCharacterReveal({
        level: highestNew,
        name: tierInfo.name,
        bonusJoy,
        tier: tierInfo,
      });

      playVaultUnlockSound();

      // 100% API Call để lưu và cộng JOY thưởng
      unlockCharacter2048(highestNew)
        .then(() => {
          if (bio?.email) {
            useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
          }
        })
        .catch(() => {});
    }

    setGrid(newGrid);

    // Kiểm tra thắng level 20
    if (highestOnBoard >= 20) {
      setStatus("win");
      playBotFusionSound(20, true);
      if (onGameOver && !reportedRef.current) {
        reportedRef.current = true;
        onGameOver(score + addedScore, "win");
      }
      return;
    }

    // Kiểm tra hết nước đi
    if (!checkHasValidMoves(newGrid)) {
      if (hammers > 0) {
        setNotice(t("arcadeGame.g2048StuckNotice", "Bàn cờ đang kẹt! Dùng Búa Phá Ô để giải cứu!"));
      } else {
        setStatus("gameover");
        playGameLose();
        hapticLose();
        if (onGameOver && !reportedRef.current) {
          reportedRef.current = true;
          onGameOver(score + addedScore, "lose");
        }
      }
    }
  }, [
    status,
    paused,
    isHammerMode,
    smashTarget,
    score,
    maxLevel,
    fever,
    feverChain,
    bestBotEver,
    hammers,
    movesCount,
    lastIceSpawnMove,
    t,
    onGameOver,
    bio?.email,
    unlockedVault,
  ]);

  // ── Xử lý Búa Phá Ô ──────────────────────────────────────────────────────
  const handleHammerButtonClick = () => {
    if (status || paused || smashTarget) return;
    if (hammers > 0) {
      setIsHammerMode((prev) => !prev);
    } else {
      setShowBuyHammerModal(true);
    }
  };

  const handleBuyHammerConfirm = async () => {
    if (isPurchasingHammer) return;
    setIsPurchasingHammer(true);
    try {
      const res = await buyHammer2048();
      if (res?.success) {
        setHammers((h) => h + 1);
        setIsHammerMode(true);
        setShowBuyHammerModal(false);
        setNotice("Đã mua thành công 1 Búa! Chạm vào ô để đập vỡ.");
        playVaultUnlockSound();
        if (bio?.email) {
          useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
        }
      }
    } catch (err) {
      notify.error(err.message || "Không đủ 50 JOY hoặc lỗi kết nối");
    } finally {
      setIsPurchasingHammer(false);
    }
  };

  const handleCellClick = (r, c) => {
    if (!isHammerMode || smashTarget) return;
    const tile = grid[r][c];
    if (!tile) return;

    setIsHammerMode(false);
    const isIce = tile.type === "ice";
    setSmashTarget({ r, c, phase: "strike", level: tile.level || 1, isIce });

    setTimeout(() => {
      playCalmHammerSound();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(22); } catch { /* ignore */ }
      }
      setShake(1);
      setTimeout(() => setShake(0), 180);
      setSmashTarget((prev) => (prev ? { ...prev, phase: "squash" } : null));

      setTimeout(() => {
        setSmashTarget((prev) => (prev ? { ...prev, phase: "fade" } : null));

        setTimeout(() => {
          setGrid((prevGrid) => {
            const next = cloneGrid(prevGrid);
            next[r][c] = null;
            return next;
          });
          setHammers((h) => Math.max(0, h - 1));
          setSmashTarget(null);
          setNotice(isIce ? "🔨 Búa đã đập tan khối đá hóa thạch!" : t("arcadeGame.g2048Smashed", "Đã đập dẹp lép và giải phóng 1 ô trống!"));
        }, 400);
      }, 300);
    }, 280);
  };

  // ── Chơi lại ─────────────────────────────────────────────────────────────
  const restartGame = () => {
    reportedRef.current = false;
    setGrid(createInitialGrid());
    setScore(0);
    setMaxLevel(2);
    setHammers(2);
    setIsHammerMode(false);
    setSmashTarget(null);
    setStatus(null);
    setNotice("");
    setNewCharacterReveal(null);
    setShowBuyHammerModal(false);
    setShowVaultModal(false);
    setParticles([]);
    setFloatingBadges([]);
    setScoreDelta(null);
    setComboMultiplier(1);
    setMovesCount(0);
    setLastIceSpawnMove(0);
    setLastMoveDir(null);
    setIsSliding(false);
    historyRef.current = [];
  };

  // ── Lắng nghe Bàn Phím ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        handleMove("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        handleMove("down");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        handleMove("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        handleMove("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // ── Lắng nghe Vuốt Cảm Ứng ───────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (isHammerMode) return;
    const tTouch = e.touches[0];
    touchStartRef.current = { x: tTouch.clientX, y: tTouch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (isHammerMode || smashTarget || !touchStartRef.current) return;
    const tTouch = e.changedTouches[0];
    const dx = tTouch.clientX - touchStartRef.current.x;
    const dy = tTouch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 22) return;

    if (absX > absY) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };

  const highestBot = BOT_TIERS[maxLevel] || BOT_TIERS[1];
  const recordBot = BOT_TIERS[bestBotEver] || BOT_TIERS[1];

  return (
    <div className={`relative w-full h-full min-h-[560px] flex flex-col items-center justify-between p-3 select-none text-slate-100 overflow-hidden ${shake === 1 ? "animate-gentle-nudge" : ""}`}>
      {/* ── CSS KEYFRAMES CHO HIỆU ỨNG HỢP THỂ VÀ BÚA ──────────────────────── */}
      <style>{`
        @keyframes fusionPop {
          0% { transform: scale(0.6) rotate(-6deg); filter: brightness(1.7); }
          40% { transform: scale(1.24) rotate(4deg); filter: brightness(1.35); }
          75% { transform: scale(0.94) rotate(-2deg); filter: brightness(1.1); }
          100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
        }
        @keyframes fusionHalo {
          0% { transform: scale(0.35); opacity: 0.95; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes floatUpFade {
          0% { transform: translate(-50%, 0) scale(0.7); opacity: 0; }
          25% { transform: translate(-50%, -8px) scale(1.1); opacity: 1; }
          75% { transform: translate(-50%, -20px) scale(1); opacity: 0.95; }
          100% { transform: translate(-50%, -32px) scale(0.9); opacity: 0; }
        }
        @keyframes particleBurst {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.25); opacity: 0; }
        }
        .animate-fusion-pop { animation: fusionPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-fusion-halo { animation: fusionHalo 0.48s ease-out forwards; }
        .animate-float-up { animation: floatUpFade 0.75s ease-out forwards; }
        .animate-particle-burst { animation: particleBurst 0.55s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

        @keyframes calmHammerSwing {
          0% { transform: translate(22px, -44px) rotate(-45deg) scale(1.15); opacity: 0; }
          20% { transform: translate(16px, -34px) rotate(-35deg) scale(1.2); opacity: 1; }
          52% { transform: translate(-2px, 8px) rotate(10deg) scale(1.06); }
          68% { transform: translate(0px, -2px) rotate(6deg) scale(1.03); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        .animate-calm-hammer { animation: calmHammerSwing 0.28s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

        @keyframes calmSquashEffect {
          0% { transform: scale(1, 1); }
          35% { transform: scale(1.3, 0.55) translateY(10px); }
          70% { transform: scale(1.18, 0.68) translateY(6px); }
          100% { transform: scale(1.1, 0.72) translateY(5px); }
        }
        .animate-calm-squash { animation: calmSquashEffect 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes calmDissolveEffect {
          0% { transform: scale(1.1, 0.72) translateY(5px); opacity: 1; filter: blur(0px); }
          50% { transform: scale(1.2, 0.4) translateY(2px); opacity: 0.6; filter: blur(2px); }
          100% { transform: scale(0.6, 0.2) translateY(-8px); opacity: 0; filter: blur(6px); }
        }
        .animate-calm-dissolve { animation: calmDissolveEffect 0.4s ease-out forwards; }

        @keyframes gentleHaloExpand {
          0% { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-gentle-halo { animation: gentleHaloExpand 0.4s ease-out forwards; }

        @keyframes boardGentleNudge {
          0% { transform: translateY(0); }
          30% { transform: translateY(2px); }
          70% { transform: translateY(-1px); }
          100% { transform: translateY(0); }
        }
        .animate-gentle-nudge { animation: boardGentleNudge 0.18s ease-in-out; }

        @keyframes boardBumpLeft { 0% { transform: translateX(0); } 40% { transform: translateX(-8px) scale(0.995); } 100% { transform: translateX(0) scale(1); } }
        @keyframes boardBumpRight { 0% { transform: translateX(0); } 40% { transform: translateX(8px) scale(0.995); } 100% { transform: translateX(0) scale(1); } }
        @keyframes boardBumpUp { 0% { transform: translateY(0); } 40% { transform: translateY(-8px) scale(0.995); } 100% { transform: translateY(0) scale(1); } }
        @keyframes boardBumpDown { 0% { transform: translateY(0); } 40% { transform: translateY(8px) scale(0.995); } 100% { transform: translateY(0) scale(1); } }
        .animate-board-bump-left { animation: boardBumpLeft 0.2s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-right { animation: boardBumpRight 0.2s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-up { animation: boardBumpUp 0.2s cubic-bezier(0.2, 0.9, 0.3, 1); }
        .animate-board-bump-down { animation: boardBumpDown 0.2s cubic-bezier(0.2, 0.9, 0.3, 1); }

        @keyframes tileFlowLeft { 0% { transform: translateX(18px); opacity: 0.85; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes tileFlowRight { 0% { transform: translateX(-18px); opacity: 0.85; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes tileFlowUp { 0% { transform: translateY(18px); opacity: 0.85; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes tileFlowDown { 0% { transform: translateY(-18px); opacity: 0.85; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-tile-flow-left { animation: tileFlowLeft 0.18s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-right { animation: tileFlowRight 0.18s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-up { animation: tileFlowUp 0.18s cubic-bezier(0.22, 1, 0.36, 1); }
        .animate-tile-flow-down { animation: tileFlowDown 0.18s cubic-bezier(0.22, 1, 0.36, 1); }

        @keyframes tileSpringPop {
          0% { transform: scale(0.25) rotate(-6deg); opacity: 0; filter: brightness(1.3); }
          60% { transform: scale(1.15) rotate(3deg); opacity: 1; filter: brightness(1.15); }
          85% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
        }
        .animate-tile-spring-pop { animation: tileSpringPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* ── BẢNG THÔNG TIN ĐẦU TRẬN (HUD) ─────────────────────────────────── */}
      <Game2048Header
        score={score}
        scoreDelta={scoreDelta}
        fever={fever}
        comboMultiplier={comboMultiplier}
        highestBot={highestBot}
        recordBot={recordBot}
        isHammerMode={isHammerMode}
        hammers={hammers}
        notice={notice}
        paused={paused}
        onCancelHammer={() => setIsHammerMode(false)}
      />

      {/* ── BÀN CỜ 4x4 BOT-AVATARS ────────────────────────────────────────── */}
      <div
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`w-full max-w-[420px] aspect-square my-auto p-2 sm:p-2.5 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-[0_0_35px_rgba(15,23,42,0.8)] grid grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5 relative transition-transform duration-100 ${
          isSliding && lastMoveDir ? `animate-board-bump-${lastMoveDir}` : ""
        }`}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isSmashingThis = smashTarget && smashTarget.r === r && smashTarget.c === c;
            const smashPhase = isSmashingThis ? smashTarget.phase : null;

            return (
              <Game2048Cell
                key={`${r}-${c}`}
                r={r}
                c={c}
                tile={tile}
                isSmashingThis={isSmashingThis}
                smashPhase={smashPhase}
                isHammerMode={isHammerMode}
                isSliding={isSliding}
                lastMoveDir={lastMoveDir}
                paused={paused}
                onCellClick={handleCellClick}
              />
            );
          })
        )}

        {/* Lớp phủ hạt Tim & Sao */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-40">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute text-sm select-none pointer-events-none animate-particle-burst"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                color: p.color,
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                textShadow: `0 0 8px ${p.color}`,
              }}
            >
              {p.symbol}
            </span>
          ))}

          {floatingBadges.map((b) => (
            <div
              key={b.id}
              className="absolute pointer-events-none select-none z-50 animate-float-up"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              <span
                className={`px-2 py-0.5 rounded-full text-[13px] font-black tracking-wide shadow-lg border backdrop-blur-sm ${
                  b.isTriple
                    ? "bg-amber-400/90 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                    : "bg-slate-900/90 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                }`}
              >
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── THANH CÔNG CỤ DƯỚI: BÚA PHÁ Ô & KHO SƯU TẦM ───────────────────── */}
      <Game2048Controls
        hammers={hammers}
        isHammerMode={isHammerMode}
        status={status}
        isSmashing={!!smashTarget}
        unlockedVaultCount={unlockedVault.length}
        onHammerClick={handleHammerButtonClick}
        onVaultClick={() => setShowVaultModal(true)}
      />

      {/* ── MODALS RIÊNG BIỆT ──────────────────────────────────────────────── */}
      <Game2048HammerModal
        isOpen={showBuyHammerModal}
        onClose={() => setShowBuyHammerModal(false)}
        walletBalance={walletBalance}
        isPurchasing={isPurchasingHammer}
        onConfirm={handleBuyHammerConfirm}
      />

      <Game2048UnlockModal
        character={newCharacterReveal}
        onClose={() => setNewCharacterReveal(null)}
      />

      <Game2048VaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        unlockedVault={unlockedVault}
      />

      <Game2048EndModal
        status={status}
        score={score}
        highestBot={highestBot}
        onRestart={restartGame}
      />
    </div>
  );
}
