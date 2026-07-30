import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { playGameMove, playGameSelect, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticMove, hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";

const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20_000 };
const FILES = "abcdefgh";
const GAME_SECONDS = 15 * 60;

const formatClock = seconds => {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
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
      + (trial.inCheck() ? 55 : 0);
    const file = move.to.charCodeAt(0) - 97;
    const rank = Number(move.to[1]) - 1;
    score += 16 - (Math.abs(file - 3.5) + Math.abs(rank - 3.5)) * 3;

    if (level >= 2) {
      const replies = trial.moves({ verbose: true });
      const worstReply = replies.reduce((max, reply) => (
        Math.max(max, reply.captured ? VALUE[reply.captured] : 0)
      ), 0);
      score -= worstReply * (level >= 3 ? 0.9 : 0.45);
    }
    return { move, score: score + Math.random() * (level === 1 ? 360 : level === 2 ? 90 : 14) };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0].move;
}

function PlayerEdge({ color, active, label, seconds, localTop = false }) {
  return (
    <div className={`chess3d-player ${active ? "is-active" : ""} ${localTop ? "is-local-top" : ""}`}>
      <span className="chess3d-player__king">{color === "w" ? "♔" : "♚"}</span>
      <span>
        <small>{active ? "ĐANG ĐẾN LƯỢT" : "ĐỐI THỦ"}</small>
        <strong>{label}</strong>
      </span>
      <time className={seconds <= 30 ? "is-danger" : ""}>{formatClock(seconds)}</time>
      {active && <i aria-hidden="true" />}
    </div>
  );
}

const ChessBoard = React.memo(function ChessBoard({
  board,
  selected,
  legalTargets,
  lastMove,
  onSquare,
}) {
  return (
    <div className="chess3d-board" role="grid" aria-label="Bàn cờ vua">
      {board.map((rank, row) => rank.map((piece, col) => {
        const square = squareName(row, col);
        const isSelected = selected === square;
        const isLegal = legalTargets.has(square);
        const wasMoved = lastMove?.from === square || lastMove?.to === square;
        return (
          <button
            type="button"
            role="gridcell"
            key={square}
            data-dark={(row + col) % 2 === 1}
            data-selected={isSelected}
            data-legal={isLegal}
            data-last={wasMoved}
            onClick={() => onSquare(row, col)}
            aria-label={`${square}${piece ? ` ${piece.color === "w" ? "Trắng" : "Đen"} ${piece.type}` : ""}`}
          >
            {piece && (
              <span className={`chess3d-piece is-${piece.color}`}>
                {PIECES[piece.color][piece.type]}
              </span>
            )}
          </button>
        );
      }))}
    </div>
  );
});

export default function GameChess3D({ paused = false, onGameOver }) {
  const [mode, setMode] = useState(null);
  const [botLevel, setBotLevel] = useState(2);
  const [chess, setChess] = useState(() => new Chess());
  const [selected, setSelected] = useState("");
  const [lastMove, setLastMove] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState(null);
  const [whiteSeconds, setWhiteSeconds] = useState(GAME_SECONDS);
  const [blackSeconds, setBlackSeconds] = useState(GAME_SECONDS);
  const reportedRef = useRef(false);

  const turn = chess.turn();
  const board = useMemo(() => chess.board(), [chess]);
  const legalTargets = useMemo(() => {
    if (!selected) return new Set();
    return new Set(chess.moves({ square: selected, verbose: true }).map(move => move.to));
  }, [chess, selected]);

  const finishIfNeeded = useCallback((nextChess, movingColor) => {
    if (!nextChess.isGameOver()) return false;
    let nextResult;
    if (nextChess.isCheckmate()) {
      nextResult = { winner: movingColor, label: `${movingColor === "w" ? "Trắng" : "Đen"} chiếu hết` };
    } else {
      nextResult = { winner: null, label: "Ván đấu hòa" };
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
    playGameMove();
    hapticMove();
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

  useEffect(() => {
    if (mode !== "bot" || turn !== "b" || paused || result) return undefined;
    setThinking(true);
    const timer = window.setTimeout(() => {
      const move = chooseBotMove(chess, botLevel);
      setThinking(false);
      if (!move) return;
      commitMove(move.from, move.to, move.promotion || "q");
    }, 420 + botLevel * 120);
    return () => window.clearTimeout(timer);
  }, [botLevel, chess, commitMove, mode, paused, result, turn]);

  useEffect(() => {
    if (!mode || paused || result) return undefined;
    const timer = window.setTimeout(() => {
      if (turn === "w") {
        if (whiteSeconds <= 1) {
          setWhiteSeconds(0);
          setResult({ winner: "b", label: "Trắng hết giờ · Đen thắng" });
        } else {
          setWhiteSeconds(value => value - 1);
        }
      } else if (blackSeconds <= 1) {
        setBlackSeconds(0);
        setResult({ winner: "w", label: "Đen hết giờ · Trắng thắng" });
      } else {
        setBlackSeconds(value => value - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [blackSeconds, mode, paused, result, turn, whiteSeconds]);

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
        result.winner ? (mode === "bot" ? (wonAgainstBot ? 250 + botLevel * 100 : 0) : 180) : 60,
        result.winner ? (mode === "bot" && !wonAgainstBot ? "lose" : "win") : "draw",
      );
    }, 900);
    return () => window.clearTimeout(timer);
  }, [botLevel, mode, onGameOver, result]);

  if (!mode) {
    return (
      <div className="chess3d-mode">
        <div className="chess3d-mode__hero">
          <span className="chess3d-mode__piece" aria-hidden="true">♞</span>
          <small>HUGO CHESS TABLE</small>
          <h2>Chọn bàn đấu</h2>
          <p>Không phòng chờ, không kết nối mạng. Vào bàn ngay trên thiết bị này.</p>
        </div>

        <div className="chess3d-mode__grid">
          <button type="button" onClick={() => setMode("bot")}>
            <span className="material-symbols-outlined">smart_toy</span>
            <strong>Đấu Hugo BOT</strong>
            <small>Chơi quân Trắng · AI phản hồi tức thì</small>
          </button>
          <button type="button" onClick={() => setMode("local")}>
            <span className="material-symbols-outlined">table_restaurant</span>
            <strong>Hai người cùng máy</strong>
            <small>Đặt điện thoại giữa hai người như bàn cờ thật</small>
          </button>
        </div>

        <div className="chess3d-level" aria-label="Độ khó BOT">
          {[1, 2, 3].map(level => (
            <button
              type="button"
              key={level}
              aria-pressed={botLevel === level}
              onClick={() => setBotLevel(level)}
            >
              {["Tập sự", "Chiến thuật", "Cao thủ"][level - 1]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const statusText = result?.label
    || (thinking ? "Hugo BOT đang tính nước đi…" : `Lượt ${turn === "w" ? "Trắng" : "Đen"}`);

  return (
    <div className={`chess3d-shell ${mode === "local" ? "is-local" : ""}`}>
      <PlayerEdge
        color="b"
        active={turn === "b" && !result}
        label={mode === "bot" ? (thinking ? "Hugo BOT đang nghĩ" : `Hugo BOT · Cấp ${botLevel}`) : "Người chơi Đen"}
        seconds={blackSeconds}
        localTop={mode === "local"}
      />

      <div className="chess3d-status">
        <span>{mode === "local" ? "CÙNG MỘT THIẾT BỊ" : "ĐẤU BOT NGOẠI TUYẾN"}</span>
        <strong>{statusText}</strong>
        <b>{chess.history().length} nước</b>
      </div>

      <div className="chess3d-stage">
        <ChessBoard
          board={board}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          onSquare={handleSquare}
        />
      </div>

      <PlayerEdge
        color="w"
        active={turn === "w" && !result}
        label={mode === "bot" ? "Bạn · quân Trắng" : "Người chơi Trắng"}
        seconds={whiteSeconds}
      />

      <p className="chess3d-note">
        {mode === "local"
          ? "Người chơi Đen ngồi ở đầu trên điện thoại · bàn cờ không tự xoay giữa lượt"
          : "Chạm quân rồi chạm ô sáng để di chuyển · BOT chạy hoàn toàn trên máy"}
      </p>
    </div>
  );
}
