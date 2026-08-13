import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { playGameSelect, playGameWin, playGameLose, playGameMove } from "../../../utils/audio";
import { hapticSelect, hapticWin, hapticLose, hapticMove } from "../../../utils/haptics";
import { SIZE, WIN_LEN, EMPTY, PLAYER, AI, checkWin, winningLine, emptyBoard, pickMove } from "./caroAi";

// Luật chơi và AI nằm trong caroAi.js (có test). File này chỉ là bàn cờ + trạng
// thái ván. Bàn 10×10, thắng 5 quân liền — bản 3×3 cũ là tic-tac-toe, một game
// đã giải nên mức Khó chỉ có thể hoà.

function ThinkingDots() {
  return (
    <span className="caro-dots" aria-hidden="true">
      <i /><i /><i />
    </span>
  );
}

export default function GameCaro({ difficulty = "medium", onGameOver }) {
  const { t } = useTranslation();
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState(PLAYER);
  const [status, setStatus] = useState("playing"); // playing | win | lose | draw
  const [moveCount, setMoveCount] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const reportedRef = useRef(false);

  const reportGameOver = useCallback((finalStatus, totalMoves) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    // Thắng nhanh được nhiều điểm hơn; bàn 10×10 nên một ván tử tế dài ~10–20
    // nước mỗi bên, khác hẳn 3×3 trước đây.
    const score = finalStatus === "win" ? Math.max(30, 220 - totalMoves * 3) : 0;
    onGameOver?.(score, finalStatus);
  }, [onGameOver]);

  const finish = useCallback((finalStatus, moves, line = []) => {
    setStatus(finalStatus);
    setWinLine(line);
    if (finalStatus === "win") { playGameWin(); hapticWin(); }
    if (finalStatus === "lose") { playGameLose(); hapticLose(); }
    reportGameOver(finalStatus, moves);
  }, [reportGameOver]);

  const handleCellClick = (r, c) => {
    if (status !== "playing" || turn !== PLAYER || board[r][c] !== EMPTY || thinking) return;

    const next = board.map((row) => [...row]);
    next[r][c] = PLAYER;
    const playerMoves = moveCount + 1;
    setBoard(next);
    setMoveCount(playerMoves);
    setLastMove({ r, c });
    playGameSelect();
    hapticSelect();

    if (checkWin(next, r, c, PLAYER)) return finish("win", playerMoves, winningLine(next, r, c, PLAYER));
    if (playerMoves >= SIZE * SIZE) return finish("draw", playerMoves);

    setTurn(AI);
    setThinking(true);
    // Trả khung hình lại cho trình duyệt trước khi tính: mức Khó xét ~10 nước ×
    // ~60 nước đáp, đủ để chặn luồng chính vài chục ms.
    setTimeout(() => {
      const aiMove = pickMove(next, difficulty);
      setThinking(false);
      if (!aiMove) return finish("draw", playerMoves);

      const [ar, ac] = aiMove;
      const afterAi = next.map((row) => [...row]);
      afterAi[ar][ac] = AI;
      const aiMoves = playerMoves + 1;
      setBoard(afterAi);
      setMoveCount(aiMoves);
      setLastMove({ r: ar, c: ac });
      playGameMove();
      hapticMove();

      if (checkWin(afterAi, ar, ac, AI)) return finish("lose", aiMoves, winningLine(afterAi, ar, ac, AI));
      if (aiMoves >= SIZE * SIZE) return finish("draw", aiMoves);
      setTurn(PLAYER);
    }, 240);
  };

  const statusText = status === "playing"
    ? (thinking ? t("arcadeGame.caroThinking") : t("arcadeGame.caroYourTurn"))
    : { win: t("arcadeGame.caroWin"), lose: t("arcadeGame.caroLose"), draw: t("arcadeGame.caroDraw") }[status];

  const isWinCell = (r, c) => winLine.some(([wr, wc]) => wr === r && wc === c);

  return (
    <div className="caro-shell">
      <div className="caro-status">
        <span className={`caro-turn-dot ${turn === PLAYER && status === "playing" ? "active" : ""}`} />
        <div>
          <small>{thinking ? "HUGO AI" : t("arcadeGame.caroBoardLabel", { size: SIZE, win: WIN_LEN })}</small>
          <strong>{statusText}</strong>
        </div>
        {thinking && <ThinkingDots />}
      </div>

      <div className="caro-board-wrap">
        <div
          className="caro-board"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
          role="grid"
          aria-label={t("arcadeGame.caroBoardLabel", { size: SIZE, win: WIN_LEN })}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove && lastMove.r === r && lastMove.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  disabled={status !== "playing" || cell !== EMPTY || turn !== PLAYER}
                  className={`caro-cell${isLast ? " last-move" : ""}${isWinCell(r, c) ? " win-cell" : ""}`}
                  aria-label={`${r + 1}·${c + 1}`}
                >
                  {cell === PLAYER && <span className="caro-x">X</span>}
                  {cell === AI && <span className="caro-o">O</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="caro-legend">
        <span><i className="x">X</i> {t("arcadeGame.caroYou")}</span>
        <span><i className="o">O</i> Hugo AI</span>
        <span>{t("arcadeGame.caroRule", { win: WIN_LEN })}</span>
      </div>
    </div>
  );
}
