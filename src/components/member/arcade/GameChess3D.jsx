import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import confetti from "canvas-confetti";
import { playGameMove, playGameSelect, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";

const PIECE_SYMBOLS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const PIECE_NAMES = {
  p: "Tốt", n: "Mã", b: "Tượng", r: "Xe", q: "Hậu", k: "Vua"
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
      + (trial.inCheck() ? 60 : 0);

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
    return { move, score: score + Math.random() * (level === 1 ? 300 : level === 2 ? 80 : 10) };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0].move;
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
              <span key={i} className="chess-card__cap-piece">{PIECE_SYMBOLS[p.color][p.type]}</span>
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

// Render Chess Board Grid
const ChessBoard = React.memo(function ChessBoard({
  board,
  selected,
  legalTargets,
  lastMove,
  checkedSquare,
  onSquare,
}) {
  return (
    <div className="chess-board-wrapper">
      <div className="chess-board-grid" role="grid" aria-label="Bàn cờ vua">
        {board.map((rank, row) => rank.map((piece, col) => {
          const square = squareName(row, col);
          const isDark = (row + col) % 2 === 1;
          const isSelected = selected === square;
          const isLegal = legalTargets.has(square);
          const wasMoved = lastMove?.from === square || lastMove?.to === square;
          const isChecked = checkedSquare === square;

          return (
            <button
              type="button"
              role="gridcell"
              key={square}
              className={`chess-sq ${isDark ? "sq-dark" : "sq-light"} ${isSelected ? "sq-selected" : ""} ${isLegal ? "sq-legal" : ""} ${wasMoved ? "sq-moved" : ""} ${isChecked ? "sq-checked" : ""}`}
              onClick={() => onSquare(row, col)}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "Trắng" : "Đen"} ${PIECE_NAMES[piece.type]}` : ""}`}
            >
              {/* File / Rank Labels */}
              {col === 0 && <span className="sq-coord coord-rank">{8 - row}</span>}
              {row === 7 && <span className="sq-coord coord-file">{FILES[col]}</span>}

              {/* Move Indicator Dots */}
              {isLegal && !piece && <span className="sq-dot" />}
              {isLegal && piece && <span className="sq-capture-ring" />}

              {/* Piece Visual */}
              {piece && (
                <span className={`chess-piece piece-${piece.color} piece-${piece.type}`}>
                  {PIECE_SYMBOLS[piece.color][piece.type]}
                </span>
              )}
            </button>
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
  const [selected, setSelected] = useState("");
  const [lastMove, setLastMove] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState(null);
  const [whiteSeconds, setWhiteSeconds] = useState(GAME_SECONDS);
  const [blackSeconds, setBlackSeconds] = useState(GAME_SECONDS);
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
    if (!selected) return new Set();
    return new Set(chess.moves({ square: selected, verbose: true }).map(m => m.to));
  }, [chess, selected]);

  // Calculate Captured Pieces & Material Value
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
      nextResult = { winner: movingColor, label: `Chiếu Hết! ${movingColor === "w" ? "Quân Trắng" : "Quân Đen"} chiến thắng!` };
    } else if (nextChess.isDraw()) {
      nextResult = { winner: null, label: "Trận đấu Hòa (Stalemate / Lặp nước)" };
    } else {
      nextResult = { winner: null, label: "Kết thúc trận đấu" };
    }
    setResult(nextResult);
    return true;
  }, []);

  const commitMove = useCallback((from, to, promotion = "q") => {
    const next = new Chess(chess.fen());
    let move;
    try {
      move = next.move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!move) return false;

    setChess(next);
    setLastMove({ from, to });
    setSelected("");
    setHistoryList(prev => [...prev, move.san]);
    playGameMove();
    hapticMove();

    if (next.isCheckmate()) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    finishIfNeeded(next, move.color);
    return true;
  }, [chess, finishIfNeeded]);

  const handleSquare = useCallback((row, col) => {
    if (!mode || paused || thinking || result) return;
    const square = squareName(row, col);
    const piece = chess.get(square);
    const canControlTurn = mode === "local" || turn === "w";

    if (selected && legalTargets.has(square)) {
      commitMove(selected, square);
      return;
    }

    if (piece?.color === turn && canControlTurn) {
      setSelected(square);
      playGameSelect();
      hapticSelect();
    } else {
      setSelected("");
    }
  }, [chess, commitMove, legalTargets, mode, paused, result, selected, thinking, turn]);

  // Undo Last Move
  const handleUndo = useCallback(() => {
    if (!mode || paused || thinking || result || historyList.length === 0) return;
    const next = new Chess(chess.fen());
    next.undo();
    if (mode === "bot" && next.turn() === "b") {
      next.undo(); // Undo bot move as well
    }
    setChess(next);
    setSelected("");
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
      commitMove(move.from, move.to, move.promotion || "q");
    }, 400 + botLevel * 120);
    return () => window.clearTimeout(timer);
  }, [botLevel, chess, commitMove, mode, paused, result, turn]);

  // Game Clocks
  useEffect(() => {
    if (!mode || paused || result) return undefined;
    const timer = window.setTimeout(() => {
      if (turn === "w") {
        if (whiteSeconds <= 1) {
          setWhiteSeconds(0);
          setResult({ winner: "b", label: "Hết Giờ! Quân Đen chiến thắng!" });
        } else {
          setWhiteSeconds(v => v - 1);
        }
      } else if (blackSeconds <= 1) {
        setBlackSeconds(0);
        setResult({ winner: "w", label: "Hết Giờ! Quân Trắng chiến thắng!" });
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
    setSelected("");
    setLastMove(null);
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
          <small className="chess-hero-tag">HUGO ARCADE CHESS</small>
          <h2 className="chess-hero-title">Bàn Cờ Vua Đỉnh Cao</h2>
          <p className="chess-hero-desc">
            Thi đấu trí tuệ với Bot AI thông minh hoặc chơi trực tiếp 2 người cùng máy mà không cần kết nối mạng.
          </p>
        </div>

        <div className="chess-hero-actions">
          <button type="button" className="chess-btn-mode mode-bot" onClick={() => resetGame("bot")}>
            <span className="material-symbols-outlined">smart_toy</span>
            <div className="chess-btn-text">
              <strong>Đấu với Hugo AI BOT</strong>
              <small>Cầm quân Trắng · Thử thách thuật toán trí tuệ</small>
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
          <span className="chess-selector-label">Cấp độ AI Bot:</span>
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
    || (thinking ? "Hugo BOT đang suy nghĩ..." : isCheck ? "⚠️ ĐANG CHIẾU VUA!" : `Lượt đi: ${turn === "w" ? "Quân Trắng" : "Quân Đen"}`);

  return (
    <div className={`chess-main-layout ${mode === "local" ? "is-local-pvp" : ""}`}>
      {/* Top Player Card (Black / Bot) */}
      <PlayerEdge
        color="b"
        active={turn === "b" && !result}
        label={mode === "bot" ? (thinking ? "Hugo BOT (Đang nghĩ...)" : `Hugo AI BOT · Cấp ${botLevel}`) : "Người Chơi Đen"}
        seconds={blackSeconds}
        captured={capturedWhite}
        advantage={blackAdvantage}
        isLocalTop={mode === "local"}
      />

      {/* Center Game Header Status */}
      <div className="chess-status-bar">
        <div className="chess-status-info">
          <span className="chess-status-badge">{mode === "local" ? "PASS & PLAY" : "VS HUGO BOT"}</span>
          <span className={`chess-status-msg ${isCheck ? "is-alert" : ""}`}>{statusText}</span>
        </div>
        <div className="chess-status-controls">
          <button
            type="button"
            className="chess-ctrl-btn"
            onClick={handleUndo}
            disabled={historyList.length === 0 || thinking || !!result}
            title="Hoàn nước đi"
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

      {/* Main Board Container */}
      <div className="chess-stage-box">
        <ChessBoard
          board={board}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkedSquare={checkedSquare}
          onSquare={handleSquare}
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

      {/* Result Overlay */}
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
