import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { playGameMove, playGameSelect, playGameWin, playGameLose, playChessCaptureSound, playChessCheckSound } from "../../../utils/audio";
import { hapticMove, hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";

// ─── Standard International Staunton Chess Piece Vector Set (Lichess/FIDE Standard) ───
const STAUNTON_PIECES = {
  w: {
    k: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
          <path d="M22.5 25c4.97 0 9-1.66 9-3.71 0-.62-.37-1.2-1.02-1.7-.84.97-2.1 1.54-3.48 1.54-1.3 0-2.5-.5-3.32-1.36a5.53 5.53 0 0 1-2.36.52c-.88 0-1.7-.2-2.36-.52-.82.86-2.02 1.36-3.32 1.36-1.38 0-2.64-.57-3.48-1.54C8.37 20.1 8 20.67 8 21.29c0 2.05 4.03 3.71 9 3.71z" fill="#ffffff" />
          <path d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-17 4-3.5-7.5-13-10.5-17-4-3 6 6 10.5 6 10.5v7z" fill="#ffffff" />
          <path d="M11.5 30c5.5-3 16.5-3 22 0M11.5 33.5c5.5-3 16.5-3 22 0M11.5 37c5.5-3 16.5-3 22 0" />
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="#ffffff" />
          <path d="M9 26c8.5-1.5 21.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z" fill="#ffffff" />
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#ffffff" />
          <path d="M11 40c6 2 17 2 23 0M11 36.5c6 1.5 17 1.5 23 0" />
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14h23l1.5 18h-26L11 14zM9 14h27v-5h-3v2h-4V9h-5v2h-4V9h-5v2h-4V9H9v5z" fill="#ffffff" />
          <path d="M12 25h21M11 19h23M12 31h21" />
        </g>
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <g fill="#ffffff" strokeLinejoin="miter">
            <path d="M9 36c1.2-2.5 7-4 13.5-4 6.5 0 12.3 1.5 13.5 4H9z" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-7.5-4-5 0-7.5 1.5-7.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
            <path d="M17.5 26c0-2.5 1.5-8 5-13 3.5 5 5 10.5 5 13 0 4.5-2.5 5-5 5-2.5 0-5-.5-5-5z" />
          </g>
          <path d="M17.5 26h10M15 30h15M22.5 10v4M20.5 12h4" strokeLinejoin="miter" />
          <circle cx="22.5" cy="8" r="1.5" fill="#0f172a" />
        </g>
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-2.5-7-7-6-10.5-14 2.5 0 5 1 5 1s-2.5-2-3-3c-1-2 2.5-3.5 4.5-4 3 2 4 4 3 5.5z" fill="#ffffff" />
          <path d="M24 18c.33 1.33-1 2.67-2 2s-.67-2 0-3 2-1 2 1z" fill="#0f172a" />
          <path d="M9.5 25.5A.5.5 0 1 1 9 25a.5.5 0 0 1 .5.5z" fill="#0f172a" stroke="#0f172a" />
          <path d="M15 39c0-3.5 2.5-6 10-6s10 2.5 10 6" fill="#ffffff" />
        </g>
      </svg>
    ),
    p: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM22.5 21c-4 0-7 4-7 8 0 3.5 2.5 6 7 6s7-2.5 7-6c0-4-3-8-7-8zM12 36h21v3H12v-3z" fill="#ffffff" />
        </g>
      </svg>
    )
  },
  b: {
    k: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" stroke="#ffffff" />
          <path d="M22.5 25c4.97 0 9-1.66 9-3.71 0-.62-.37-1.2-1.02-1.7-.84.97-2.1 1.54-3.48 1.54-1.3 0-2.5-.5-3.32-1.36a5.53 5.53 0 0 1-2.36.52c-.88 0-1.7-.2-2.36-.52-.82.86-2.02 1.36-3.32 1.36-1.38 0-2.64-.57-3.48-1.54C8.37 20.1 8 20.67 8 21.29c0 2.05 4.03 3.71 9 3.71z" fill="#1b1b1b" stroke="#ffffff" />
          <path d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-17 4-3.5-7.5-13-10.5-17-4-3 6 6 10.5 6 10.5v7z" fill="#1b1b1b" stroke="#ffffff" />
          <path d="M11.5 30c5.5-3 16.5-3 22 0M11.5 33.5c5.5-3 16.5-3 22 0M11.5 37c5.5-3 16.5-3 22 0" stroke="#ffffff" />
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="#1b1b1b" />
          <path d="M9 26c8.5-1.5 21.5-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25L7 14l2 12z" fill="#1b1b1b" />
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#1b1b1b" />
          <path d="M11 40c6 2 17 2 23 0M11 36.5c6 1.5 17 1.5 23 0" stroke="#ffffff" />
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14h23l1.5 18h-26L11 14zM9 14h27v-5h-3v2h-4V9h-5v2h-4V9h-5v2h-4V9H9v5z" fill="#1b1b1b" />
          <path d="M12 25h21M11 19h23M12 31h21" stroke="#ffffff" />
        </g>
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <g fill="#1b1b1b" strokeLinejoin="miter">
            <path d="M9 36c1.2-2.5 7-4 13.5-4 6.5 0 12.3 1.5 13.5 4H9z" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-7.5-4-5 0-7.5 1.5-7.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
            <path d="M17.5 26c0-2.5 1.5-8 5-13 3.5 5 5 10.5 5 13 0 4.5-2.5 5-5 5-2.5 0-5-.5-5-5z" />
          </g>
          <path d="M17.5 26h10M15 30h15M22.5 10v4M20.5 12h4" strokeLinejoin="miter" stroke="#ffffff" />
          <circle cx="22.5" cy="8" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-2.5-7-7-6-10.5-14 2.5 0 5 1 5 1s-2.5-2-3-3c-1-2 2.5-3.5 4.5-4 3 2 4 4 3 5.5z" fill="#1b1b1b" />
          <path d="M24 18c.33 1.33-1 2.67-2 2s-.67-2 0-3 2-1 2 1z" fill="#ffffff" />
          <path d="M9.5 25.5A.5.5 0 1 1 9 25a.5.5 0 0 1 .5.5z" fill="#ffffff" stroke="#ffffff" />
          <path d="M15 39c0-3.5 2.5-6 10-6s10 2.5 10 6" fill="#1b1b1b" stroke="#ffffff" />
        </g>
      </svg>
    ),
    p: (
      <svg viewBox="0 0 45 45" className="chess-3d-svg">
        <g fill="none" fillRule="evenodd" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM22.5 21c-4 0-7 4-7 8 0 3.5 2.5 6 7 6s7-2.5 7-6c0-4-3-8-7-8zM12 36h21v3H12v-3z" fill="#1b1b1b" />
        </g>
      </svg>
    )
  }
};

const PIECE_TEXT = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20_000 };
const MATERIAL_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const FILES = "abcdefgh";
const GAME_SECONDS = 15 * 60;

const formatClock = seconds => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export function squareName(row, col) {
  return `${FILES[col]}${8 - row}`;
}

export function chooseBotMove(chess, level = 2) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  const ranked = moves.map(move => {
    const trial = new Chess(chess.fen());
    trial.move(move);
    if (trial.isCheckmate()) return { move, score: 1_000_000 };

    let score = (move.captured ? VALUE[move.captured] : 0)
      + (move.promotion ? VALUE[move.promotion] : 0)
      + (trial.inCheck() ? 65 : 0);

    const file = move.to.charCodeAt(0) - 97;
    const rank = Number(move.to[1]) - 1;
    score += 16 - (Math.abs(file - 3.5) + Math.abs(rank - 3.5)) * 3;

    if (level >= 2) {
      const replies = trial.moves({ verbose: true });
      const worstReply = replies.reduce((max, reply) => (
        Math.max(max, reply.captured ? VALUE[reply.captured] : 0)
      ), 0);
      score -= worstReply * (level >= 3 ? 0.95 : 0.5);
    }
    return { move, score: score + Math.random() * (level === 1 ? 280 : level === 2 ? 75 : 8) };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0].move;
}

// Fire Harry Potter Stone Debris Confetti Explosion
function fireSmashExplosion(color = "w") {
  const colors = color === "w" ? ["#fef08a", "#eab308", "#cbd5e1", "#ffffff"] : ["#ef4444", "#dc2626", "#1e293b", "#020617"];
  confetti({
    particleCount: 50,
    spread: 80,
    startVelocity: 30,
    origin: { y: 0.55 },
    colors,
    ticks: 100,
    gravity: 1.2,
    scalar: 1.1,
  });
}

// Player Edge Glass Card UI
function PlayerEdge({ color, active, label, seconds, captured = [], advantage = 0, isLocalTop = false }) {
  return (
    <div className={`chess-card ${active ? "is-active" : ""} ${isLocalTop ? "is-top-flipped" : ""}`}>
      <div className="chess-card__info">
        <div className={`chess-card__avatar ${color === "w" ? "is-white" : "is-black"}`}>
          <span>{color === "w" ? "♔" : "♚"}</span>
          {active && <span className="chess-card__pulse" />}
        </div>
        <div className="chess-card__meta">
          <div className="chess-card__header">
            <span className="chess-card__name">{label}</span>
            {advantage > 0 && <span className="chess-card__adv">+{advantage}</span>}
          </div>
          <div className="chess-card__captured">
            {captured.map((p, i) => (
              <span key={i} className="chess-card__cap-piece">{PIECE_TEXT[p.color][p.type]}</span>
            ))}
          </div>
        </div>
      </div>
      <div className={`chess-card__timer ${seconds <= 30 ? "is-urgent" : ""}`}>
        <span className="material-symbols-outlined">timer</span>
        <time>{formatClock(seconds)}</time>
      </div>
    </div>
  );
}

// 3D Animated Interactive Grid
const ChessBoardGrid3D = React.memo(function ChessBoardGrid3D({
  board,
  selectedSquare,
  legalTargets,
  lastMove,
  checkedSquare,
  smashTargetSquare,
  onSquareClick,
  onDropMove
}) {
  return (
    <div className="chess-board-wrapper">
      <div className="chess-board-grid" role="grid" aria-label="Bàn cờ vua 3D">
        {board.map((rank, row) => rank.map((piece, col) => {
          const square = squareName(row, col);
          const isDark = (row + col) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isLegal = legalTargets.has(square);
          const wasMoved = lastMove?.from === square || lastMove?.to === square;
          const isChecked = checkedSquare === square;
          const isSmashing = smashTargetSquare === square;

          return (
            <div
              key={square}
              className={`chess-sq ${isDark ? "sq-dark" : "sq-light"} ${isSelected ? "sq-selected" : ""} ${isLegal ? "sq-legal" : ""} ${wasMoved ? "sq-moved" : ""} ${isChecked ? "sq-checked" : ""} ${isSmashing ? "is-smash-impact" : ""}`}
              onClick={() => onSquareClick(row, col)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = e.dataTransfer.getData("text/plain");
                if (from && from !== square) onDropMove(from, square);
              }}
            >
              {/* File / Rank Coordinates */}
              {col === 0 && <span className="sq-coord coord-rank">{8 - row}</span>}
              {row === 7 && <span className="sq-coord coord-file">{FILES[col]}</span>}

              {/* Move Indicator Dots */}
              {isLegal && !piece && <span className="sq-dot" />}
              {isLegal && piece && <span className="sq-capture-ring" />}

              {/* Staunton Vector Piece */}
              {piece && (
                <motion.div
                  className={`chess-piece-wrapper piece-${piece.color} ${isSmashing ? "is-being-smashed" : ""}`}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", square);
                    onSquareClick(row, col);
                  }}
                  initial={{ scale: 0.95, opacity: 1 }}
                  animate={
                    wasMoved
                      ? { scale: [1.25, 1], y: [-12, 0] }
                      : isSmashing
                      ? { scale: [1, 1.3, 0], rotate: [0, 20, 90], opacity: [1, 1, 0] }
                      : { scale: 1, y: 0, opacity: 1 }
                  }
                  transition={{ duration: isSmashing ? 0.42 : 0.2, cubicBezier: [0.16, 1, 0.3, 1] }}
                >
                  {STAUNTON_PIECES[piece.color][piece.type]}
                </motion.div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
});

export default function GameChess3D({ paused = false, onGameOver }) {
  const [mode, setMode] = useState(null);
  const [botLevel, setBotLevel] = useState(2);
  const [chess, setChess] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState("");
  const [lastMove, setLastMove] = useState(null);
  const [smashTargetSquare, setSmashTargetSquare] = useState(null);
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState(null);
  const [whiteSeconds, setWhiteSeconds] = useState(GAME_SECONDS);
  const [blackSeconds, setBlackSeconds] = useState(GAME_SECONDS);
  const [is3DView, setIs3DView] = useState(true);

  const reportedRef = useRef(false);

  const turn = chess.turn();
  const board = useMemo(() => chess.board(), [chess]);
  const isCheck = chess.inCheck();

  // Find Checked King Square
  const checkedSquare = useMemo(() => {
    if (!isCheck) return null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === "k" && sq.color === turn) {
          return squareName(r, c);
        }
      }
    }
    return null;
  }, [board, isCheck, turn]);

  // Compute Legal Move Destinations
  const legalTargets = useMemo(() => {
    if (!selectedSquare) return new Set();
    return new Set(chess.moves({ square: selectedSquare, verbose: true }).map(m => m.to));
  }, [chess, selectedSquare]);

  // Calculate Captured Pieces & Material Advantage
  const { capturedWhite, capturedBlack, whiteAdvantage, blackAdvantage } = useMemo(() => {
    const currentPieces = { w: [], b: [] };
    board.forEach(rank => rank.forEach(piece => {
      if (piece) currentPieces[piece.color].push(piece.type);
    }));

    const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
    const capturedW = [];
    const capturedB = [];

    let whiteValue = 0;
    let blackValue = 0;

    Object.keys(initialCounts).forEach(type => {
      const wCount = currentPieces.w.filter(t => t === type).length;
      const bCount = currentPieces.b.filter(t => t === type).length;

      for (let i = 0; i < initialCounts[type] - wCount; i++) capturedW.push({ color: "w", type });
      for (let i = 0; i < initialCounts[type] - bCount; i++) capturedB.push({ color: "b", type });

      whiteValue += wCount * MATERIAL_VAL[type];
      blackValue += bCount * MATERIAL_VAL[type];
    });

    return {
      capturedWhite: capturedW,
      capturedBlack: capturedB,
      whiteAdvantage: Math.max(0, whiteValue - blackValue),
      blackAdvantage: Math.max(0, blackValue - whiteValue)
    };
  }, [board]);

  const finishIfNeeded = useCallback((nextChess, movingColor) => {
    if (!nextChess.isGameOver()) return false;
    let nextResult;
    if (nextChess.isCheckmate()) {
      nextResult = { winner: movingColor, label: `Chiếu Hết! ${movingColor === "w" ? "Quân Trắng" : "Quân Đen"} đại thắng!` };
    } else if (nextChess.isDraw()) {
      nextResult = { winner: null, label: "Trận đấu Hòa (Stalemate)" };
    } else {
      nextResult = { winner: null, label: "Ván đấu kết thúc" };
    }
    setResult(nextResult);
    return true;
  }, []);

  // Smash & Striding Attack Execution
  const makeMove = useCallback((from, to, promotion = "q") => {
    const isCapture = Boolean(chess.get(to));
    const next = new Chess(chess.fen());
    let resultMove;
    try {
      resultMove = next.move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!resultMove) return false;

    // Harry Potter Capture Smash FX
    if (isCapture) {
      setSmashTargetSquare(to);
      setIsBoardShaking(true);
      fireSmashExplosion(resultMove.color);
      playChessCaptureSound();
      hapticLose();
      window.setTimeout(() => {
        setSmashTargetSquare(null);
        setIsBoardShaking(false);
      }, 400);
    } else {
      playGameMove();
      hapticMove();
    }

    if (next.inCheck()) {
      playChessCheckSound();
    }

    setChess(next);
    setLastMove({ from: resultMove.from, to: resultMove.to });
    setSelectedSquare("");
    setHistoryList(prev => [...prev, resultMove.san]);

    if (next.isCheckmate()) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }

    finishIfNeeded(next, resultMove.color);
    return true;
  }, [chess, finishIfNeeded]);

  const handleSquareClick = useCallback((row, col) => {
    if (!mode || paused || thinking || result) return;
    const square = squareName(row, col);
    const piece = chess.get(square);
    const canControlTurn = mode === "local" || turn === "w";

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare("");
        return;
      }
      if (legalTargets.has(square)) {
        makeMove(selectedSquare, square);
        return;
      }
    }

    if (piece?.color === turn && canControlTurn) {
      setSelectedSquare(square);
      playGameSelect();
      hapticSelect();
    } else {
      setSelectedSquare("");
    }
  }, [chess, legalTargets, makeMove, mode, paused, result, selectedSquare, thinking, turn]);

  // Handle Undo Move
  const handleUndo = useCallback(() => {
    if (!mode || paused || thinking || result || historyList.length === 0) return;
    const next = new Chess(chess.fen());
    next.undo();
    if (mode === "bot" && next.turn() === "b") {
      next.undo();
    }
    setChess(next);
    setSelectedSquare("");
    setLastMove(null);
    setHistoryList(prev => prev.slice(0, mode === "bot" ? -2 : -1));
  }, [chess, historyList.length, mode, paused, result, thinking]);

  // Bot Turn Logic
  useEffect(() => {
    if (mode !== "bot" || turn !== "b" || paused || result) return undefined;
    setThinking(true);
    const timer = window.setTimeout(() => {
      const move = chooseBotMove(chess, botLevel);
      setThinking(false);
      if (!move) return;
      makeMove(move.from, move.to, move.promotion || "q");
    }, 450 + botLevel * 130);
    return () => window.clearTimeout(timer);
  }, [botLevel, chess, makeMove, mode, paused, result, turn]);

  // Game Clocks
  useEffect(() => {
    if (!mode || paused || result) return undefined;
    const timer = window.setTimeout(() => {
      if (turn === "w") {
        if (whiteSeconds <= 1) {
          setWhiteSeconds(0);
          setResult({ winner: "b", label: "Hết Giờ! Quân Đen thắng!" });
        } else {
          setWhiteSeconds(v => v - 1);
        }
      } else if (blackSeconds <= 1) {
        setBlackSeconds(0);
        setResult({ winner: "w", label: "Hết Giờ! Quân Trắng thắng!" });
      } else {
        setBlackSeconds(v => v - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [blackSeconds, mode, paused, result, turn, whiteSeconds]);

  // Game Over Reporting
  useEffect(() => {
    if (!result || reportedRef.current) return undefined;
    if (!result.winner) {
      hapticMove();
    } else if (mode === "bot" && result.winner === "b") {
      playGameLose();
      hapticLose();
    } else {
      playGameWin();
      hapticWin();
    }
    const timer = window.setTimeout(() => {
      reportedRef.current = true;
      const wonAgainstBot = mode === "bot" && result.winner === "w";
      onGameOver?.(
        result.winner ? (mode === "bot" ? (wonAgainstBot ? 300 + botLevel * 120 : 0) : 200) : 80,
        result.winner ? (mode === "bot" && !wonAgainstBot ? "lose" : "win") : "draw"
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [botLevel, mode, onGameOver, result]);

  // Restart / Reset Game
  const resetGame = (newMode = mode) => {
    setMode(newMode);
    setChess(new Chess());
    setSelectedSquare("");
    setLastMove(null);
    setSmashTargetSquare(null);
    setHistoryList([]);
    setResult(null);
    setWhiteSeconds(GAME_SECONDS);
    setBlackSeconds(GAME_SECONDS);
    reportedRef.current = false;
  };

  // Mode Selection Screen
  if (!mode) {
    return (
      <div className="chess-hero-container">
        <div className="chess-hero-header">
          <div className="chess-hero-badge">
            <span>♞</span>
          </div>
          <small className="chess-hero-tag">HUGO CHESS TABLE 3D</small>
          <h2 className="chess-hero-title">Đấu Trường Cờ Vua 3D</h2>
          <p className="chess-hero-desc">
            Bàn cờ gỗ hoàng gia · Đồ họa 3D sống động · Hiệu ứng đạp phá ăn quân kịch tính.
          </p>
        </div>

        <div className="chess-hero-actions">
          <button type="button" className="chess-btn-mode mode-bot" onClick={() => resetGame("bot")}>
            <span className="material-symbols-outlined">smart_toy</span>
            <div className="chess-btn-text">
              <strong>Đấu với Hugo AI BOT</strong>
              <small>Cầm quân Trắng · Thử thách trí tuệ thuật toán</small>
            </div>
            <span className="material-symbols-outlined arrow">arrow_forward</span>
          </button>

          <button type="button" className="chess-btn-mode mode-pvp" onClick={() => resetGame("local")}>
            <span className="material-symbols-outlined">groups</span>
            <div className="chess-btn-text">
              <strong>Hai Người Cùng Máy (Pass & Play)</strong>
              <small>Đặt thiết bị ở giữa hai người như bàn cờ thật</small>
            </div>
            <span className="material-symbols-outlined arrow">arrow_forward</span>
          </button>
        </div>

        <div className="chess-bot-selector">
          <span className="chess-selector-label">Cấp độ BOT AI:</span>
          <div className="chess-selector-pills">
            {[
              { lvl: 1, label: "Tập Sự", desc: "Dễ" },
              { lvl: 2, label: "Chiến Thuật", desc: "Vừa" },
              { lvl: 3, label: "Cao Thủ", desc: "Khó" }
            ].map(item => (
              <button
                type="button"
                key={item.lvl}
                className={`chess-pill ${botLevel === item.lvl ? "is-selected" : ""}`}
                onClick={() => setBotLevel(item.lvl)}
              >
                <span>{item.label}</span>
                <small>{item.desc}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusText = result?.label
    || (thinking ? "Hugo BOT đang tính nước đi..." : isCheck ? "⚠️ ĐANG CHIẾU VUA!" : `Lượt đi: ${turn === "w" ? "Quân Trắng" : "Quân Đen"}`);

  return (
    <div className={`chess-main-layout ${mode === "local" ? "is-local-pvp" : ""}`}>
      {/* Top Player Card (Black / Bot) */}
      <PlayerEdge
        color="b"
        active={turn === "b" && !result}
        label={mode === "bot" ? (thinking ? "Hugo BOT (Đang tính...)" : `Hugo AI BOT · Cấp ${botLevel}`) : "Người Chơi Đen"}
        seconds={blackSeconds}
        captured={capturedWhite}
        advantage={blackAdvantage}
        isLocalTop={mode === "local"}
      />

      {/* Center Game Header Status */}
      <div className="chess-status-bar">
        <div className="chess-status-info">
          <button
            type="button"
            className={`chess-ctrl-btn btn-toggle-3d ${is3DView ? "is-on" : ""}`}
            onClick={() => setIs3DView(v => !v)}
            title="Góc nhìn 3D"
          >
            <span className="material-symbols-outlined">view_in_ar</span>
            <span>{is3DView ? "3D Tilt" : "2D Flat"}</span>
          </button>
          <span className={`chess-status-msg ${isCheck ? "is-alert" : ""}`}>{statusText}</span>
        </div>

        <div className="chess-status-controls">
          <button
            type="button"
            className="chess-ctrl-btn"
            onClick={handleUndo}
            disabled={historyList.length === 0 || thinking || !!result}
            title="Hoàn nước"
          >
            <span className="material-symbols-outlined">undo</span>
            <span>Hoàn nước</span>
          </button>
          <button
            type="button"
            className="chess-ctrl-btn"
            onClick={() => resetGame()}
            title="Ván mới"
          >
            <span className="material-symbols-outlined">refresh</span>
            <span>Ván mới</span>
          </button>
        </div>
      </div>

      {/* Main 3D Chessboard Stage Box */}
      <div className={`chess-stage-box ${is3DView ? "is-3d-tilt" : ""} ${isBoardShaking ? "is-smash-shaking" : ""}`}>
        <ChessBoardGrid3D
          board={board}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkedSquare={checkedSquare}
          smashTargetSquare={smashTargetSquare}
          onSquareClick={handleSquareClick}
          onDropMove={(from, to) => makeMove(from, to)}
        />
      </div>

      {/* Bottom Player Card (White / You) */}
      <PlayerEdge
        color="w"
        active={turn === "w" && !result}
        label={mode === "bot" ? "Bạn (Quân Trắng)" : "Người Chơi Trắng"}
        seconds={whiteSeconds}
        captured={capturedBlack}
        advantage={whiteAdvantage}
      />

      {/* Recent Moves Log Ribbon */}
      {historyList.length > 0 && (
        <div className="chess-history-ribbon">
          <span className="chess-history-label">Lịch sử:</span>
          <div className="chess-history-moves">
            {historyList.slice(-6).map((moveSan, idx) => (
              <span key={idx} className="chess-move-tag">{moveSan}</span>
            ))}
          </div>
        </div>
      )}

      {/* Result Overlay Modal */}
      {result && (
        <div className="chess-result-modal">
          <div className="chess-result-card">
            <div className="chess-result-icon">
              <span className="material-symbols-outlined">
                {result.winner === "w" || (mode === "bot" && result.winner === "w") ? "trophy" : result.winner ? "mood_bad" : "handshake"}
              </span>
            </div>
            <h3>{result.label}</h3>
            <p>Ván đấu kết thúc sau {historyList.length} nước đi.</p>
            <div className="chess-result-btns">
              <button type="button" className="chess-result-btn primary" onClick={() => resetGame()}>
                Chơi Ván Mới
              </button>
              <button type="button" className="chess-result-btn secondary" onClick={() => setMode(null)}>
                Đổi Chế Độ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
