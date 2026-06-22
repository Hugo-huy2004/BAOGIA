import React, { useState, useCallback, useRef } from "react";

const SIZE = 13;
const WIN_LEN = 5;
const EMPTY = 0, PLAYER = 1, AI = 2;

const DIRECTIONS = [
  [0, 1],  // horizontal
  [1, 0],  // vertical
  [1, 1],  // diagonal \
  [1, -1], // diagonal /
];

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

// Checks whether `player` has WIN_LEN in a row through (r, c) in any direction.
export function checkWin(board, r, c, player) {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc) && board[rr][cc] === player) { count++; rr += dr; cc += dc; }
    rr = r - dr; cc = c - dc;
    while (inBounds(rr, cc) && board[rr][cc] === player) { count++; rr -= dr; cc -= dc; }
    if (count >= WIN_LEN) return true;
  }
  return false;
}

// Heuristic value of placing `player`'s stone at (r, c): for each direction,
// counts the consecutive run through that cell and how many ends are open
// (not blocked by an opponent stone or the board edge), then looks up a
// hand-tuned score table — open threats are worth far more than blocked ones.
const SCORE_TABLE = (count, openEnds) => {
  if (count >= 5) return 100000;
  if (count === 4) return openEnds >= 1 ? 10000 : 50;
  if (count === 3) return openEnds === 2 ? 1000 : openEnds === 1 ? 150 : 10;
  if (count === 2) return openEnds === 2 ? 100 : openEnds === 1 ? 20 : 5;
  return 1;
};

function lineScore(board, r, c, player) {
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc) && board[rr][cc] === player) { count++; rr += dr; cc += dc; }
    if (inBounds(rr, cc) && board[rr][cc] === EMPTY) openEnds++;

    rr = r - dr; cc = c - dc;
    while (inBounds(rr, cc) && board[rr][cc] === player) { count++; rr -= dr; cc -= dc; }
    if (inBounds(rr, cc) && board[rr][cc] === EMPTY) openEnds++;

    total += SCORE_TABLE(count, openEnds);
  }
  return total;
}

function hasNeighbor(board, r, c) {
  for (const [dr, dc] of DIRECTIONS) {
    if ((inBounds(r + dr, c + dc) && board[r + dr][c + dc] !== EMPTY) ||
        (inBounds(r - dr, c - dc) && board[r - dr][c - dc] !== EMPTY)) {
      return true;
    }
  }
  return false;
}

// Dễ: only blocks the opponent's IMMEDIATE winning cell, otherwise plays a
// lightly neighbor-biased near-random move — no offense/defense theory at all,
// so this tier is meaningfully beatable.
export function pickAiMoveEasy(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      const trial = board.map((row) => [...row]);
      trial[r][c] = PLAYER;
      if (checkWin(trial, r, c, PLAYER)) return [r, c];
    }
  }

  const candidates = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      candidates.push({ r, c, weight: hasNeighbor(board, r, c) ? 3 : 1 });
    }
  }
  if (!candidates.length) return null;
  const totalWeight = candidates.reduce((s, cand) => s + cand.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const cand of candidates) {
    roll -= cand.weight;
    if (roll <= 0) return [cand.r, cand.c];
  }
  const last = candidates[candidates.length - 1];
  return [last.r, last.c];
}

// Trung bình: scores every empty cell by (AI's own offense) + (threat denied
// to the opponent), favoring blocks slightly. No deep search.
export function pickAiMove(board) {
  let best = null;
  let bestScore = -Infinity;
  const center = (SIZE - 1) / 2;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      const aiScore = lineScore(board, r, c, AI);
      const oppScore = lineScore(board, r, c, PLAYER);
      const centerBonus = -(Math.abs(r - center) + Math.abs(c - center)) * 0.5;
      const total = aiScore + oppScore * 1.05 + centerBonus;
      if (total > bestScore) {
        bestScore = total;
        best = [r, c];
      }
    }
  }
  return best;
}

// Khó: shortlists the top candidates by the same heuristic as Trung bình, then
// adds one bounded lookahead ply — for each shortlisted AI move, evaluates the
// opponent's best heuristic response and subtracts it, so the AI avoids moves
// that look good now but hand the opponent a strong follow-up. Still no
// minimax/recursion (one ply, bounded shortlist), so cost stays small.
export function pickAiMoveHard(board) {
  const center = (SIZE - 1) / 2;
  const candidates = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      const aiScore = lineScore(board, r, c, AI);
      const oppScore = lineScore(board, r, c, PLAYER);
      const centerBonus = -(Math.abs(r - center) + Math.abs(c - center)) * 0.5;
      candidates.push({ r, c, total: aiScore + oppScore * 1.05 + centerBonus });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.total - a.total);
  const shortlist = candidates.slice(0, 10);

  let best = null;
  let bestAdjusted = -Infinity;

  for (const cand of shortlist) {
    const trial = board.map((row) => [...row]);
    trial[cand.r][cand.c] = AI;
    if (checkWin(trial, cand.r, cand.c, AI)) return [cand.r, cand.c];

    let oppBestResponse = -Infinity;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (trial[r][c] !== EMPTY) continue;
        const responseScore = lineScore(trial, r, c, PLAYER) + lineScore(trial, r, c, AI) * 1.05;
        if (responseScore > oppBestResponse) oppBestResponse = responseScore;
      }
    }

    const adjusted = cand.total - oppBestResponse * 0.9;
    if (adjusted > bestAdjusted) {
      bestAdjusted = adjusted;
      best = [cand.r, cand.c];
    }
  }
  return best;
}

const AI_PICKERS = { easy: pickAiMoveEasy, medium: pickAiMove, hard: pickAiMoveHard };

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce-soft" style={{ animationDelay: "0ms" }} />
      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce-soft" style={{ animationDelay: "150ms" }} />
      <span className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce-soft" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export default function GameCaro({ difficulty = "medium", onGameOver }) {
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState(PLAYER); // whose turn
  const [status, setStatus] = useState("playing"); // playing | win | lose | draw
  const [moveCount, setMoveCount] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const reportedRef = useRef(false);
  const pickMove = AI_PICKERS[difficulty] || pickAiMove;

  const reportGameOver = useCallback((finalStatus, totalMoves) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    const score = finalStatus === "win" ? Math.max(20, 200 - totalMoves) : 0;
    onGameOver?.(score, finalStatus);
  }, [onGameOver]);

  const handleCellClick = (r, c) => {
    if (status !== "playing" || turn !== PLAYER || board[r][c] !== EMPTY || thinking) return;

    const next = board.map((row) => [...row]);
    next[r][c] = PLAYER;
    const newMoveCount = moveCount + 1;
    setBoard(next);
    setMoveCount(newMoveCount);
    setLastMove({ r, c });

    if (checkWin(next, r, c, PLAYER)) {
      setStatus("win");
      reportGameOver("win", newMoveCount);
      return;
    }
    if (newMoveCount >= SIZE * SIZE) {
      setStatus("draw");
      reportGameOver("draw", newMoveCount);
      return;
    }

    setTurn(AI);
    setThinking(true);
    setTimeout(() => {
      const aiMove = pickMove(next);
      if (!aiMove) {
        setStatus("draw");
        reportGameOver("draw", newMoveCount);
        setThinking(false);
        return;
      }
      const [ar, ac] = aiMove;
      const afterAi = next.map((row) => [...row]);
      afterAi[ar][ac] = AI;
      const aiMoveCount = newMoveCount + 1;
      setBoard(afterAi);
      setMoveCount(aiMoveCount);
      setThinking(false);
      setLastMove({ r: ar, c: ac });

      if (checkWin(afterAi, ar, ac, AI)) {
        setStatus("lose");
        reportGameOver("lose", aiMoveCount);
        return;
      }
      if (aiMoveCount >= SIZE * SIZE) {
        setStatus("draw");
        reportGameOver("draw", aiMoveCount);
        return;
      }
      setTurn(PLAYER);
    }, 350);
  };

  const statusText = status === "playing"
    ? (thinking ? "AI đang suy nghĩ" : "Lượt của cậu (X)")
    : { win: "Cậu thắng! 🎉", lose: "AI thắng rồi, thử lại nhé!", draw: "Hòa! Bàn cờ đã đầy." }[status];

  return (
    <div className="caro-shell flex flex-col items-center gap-4 w-full">
      <div className="caro-status"><span className={`caro-turn-dot ${turn === PLAYER && status === "playing" ? "active" : ""}`} /><div><small>{thinking ? "ĐỐI THỦ" : "TRẠNG THÁI"}</small><strong>{statusText}</strong></div>{thinking && <ThinkingDots />}</div>

      <div className="caro-board-wrap">
        <div className="caro-board" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove && lastMove.r === r && lastMove.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={status !== "playing" || cell !== EMPTY || turn !== PLAYER}
                  className={`caro-cell flex items-center justify-center font-black transition-colors disabled:cursor-default ${
                    isLast
                      ? "last-move"
                      : ""
                  }`}
                >
                  {cell === PLAYER && <span className="caro-x animate-scale-in">X</span>}
                  {cell === AI && <span className="caro-o animate-scale-in">O</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="caro-legend"><span><i className="x">X</i> Bạn</span><span><i className="o">O</i> Hugo AI</span><span><span className="material-symbols-outlined">target</span> Xếp 5 liên tiếp</span></div>
    </div>
  );
}
