import { useRef, useState } from "react";
import { LINES, winnerOf, pickMove } from "./ticTacToe";
import { apiFetch } from "../services/api";

// Chỉ một trò: cờ ca-rô. Nước đi tính hoàn toàn trong máy; máy chủ chỉ được gọi
// ĐÚNG MỘT LẦN khi ván kết thúc để cộng/trừ JOY. Cố ý không dùng lại game trong
// Arcade vì chúng kéo theo cả khung game (ảnh, âm thanh, vòng lặp vẽ 60 hình/giây)
// — thứ ngốn pin nhất.

const winningLine = (cells) => LINES.find(([a, b, c]) => cells[a] && cells[a] === cells[b] && cells[a] === cells[c]);

export default function EcoGames({ onJoyChange }) {
  const [cells, setCells] = useState(Array(9).fill(""));
  const [lastMove, setLastMove] = useState(null);
  const [joyNote, setJoyNote] = useState("");
  const settled = useRef(false);

  // Ván xong mới gọi máy chủ, mỗi ván đúng một lượt. Kết quả do máy tự báo nên
  // phía máy chủ chặn bằng hạn mức 5 ván có thưởng mỗi ngày.
  const settle = async (result) => {
    if (settled.current) return;
    settled.current = true;
    try {
      const data = await apiFetch("/arcade/eco-caro", {
        method: "POST",
        body: JSON.stringify({ result }),
      });
      if (data.joyDelta) {
        setJoyNote(`${data.joyDelta > 0 ? "+" : ""}${data.joyDelta} JOY · còn ${data.remainingGames} ván tính điểm hôm nay`);
        onJoyChange?.(data.joyDelta);
      } else if (data.reason === "daily_cap") {
        setJoyNote("Hết 5 ván tính JOY của hôm nay — chơi tiếp vẫn được, chỉ không cộng trừ.");
      } else if (data.reason === "insufficient") {
        setJoyNote("Số dư JOY không đủ để trừ, ván này bỏ qua.");
      }
    } catch {
      setJoyNote("Chưa ghi được kết quả lên máy chủ.");
    }
  };
  const winner = winnerOf(cells);
  const line = winningLine(cells);
  const full = cells.every(Boolean);

  const play = (index) => {
    if (cells[index] || winner) return;
    const next = [...cells];
    next[index] = "X";
    if (winnerOf(next) || next.every(Boolean)) {
      setCells(next);
      setLastMove(index);
      if (winnerOf(next) === "X") settle("win");
      return;
    }
    const move = pickMove(next);
    if (move !== undefined) next[move] = "O";
    setCells(next);
    setLastMove(move ?? index);
    if (winnerOf(next) === "O") settle("lose");
  };

  const reset = () => {
    setCells(Array(9).fill(""));
    setLastMove(null);
    setJoyNote("");
    settled.current = false;
  };

  return (
    <section className="save-e-section" aria-labelledby="eco-games">
      <h2 id="eco-games">Trò chơi ngoại tuyến</h2>
      <div className="save-e-card">
        <div className="save-e-row">
          <div>
            <strong>Cờ ca-rô 3×3</strong>
            <small>Thắng +10 JOY · thua −10 JOY · tối đa 5 ván/ngày</small>
          </div>
          <button type="button" className="save-e-btn save-e-btn--plain" onClick={reset}>Ván mới</button>
        </div>

        <div className="save-e-board" role="group" aria-label="Bàn cờ ca-rô">
          {cells.map((cell, index) => (
            <button
              key={index}
              type="button"
              onClick={() => play(index)}
              disabled={Boolean(cell) || Boolean(winner)}
              data-mark={cell || undefined}
              className={[
                line?.includes(index) ? "is-win" : "",
                index === lastMove ? "is-new" : "",
              ].filter(Boolean).join(" ")}
              aria-label={`Ô ${index + 1}${cell ? `, ${cell}` : ", trống"}`}
            >
              {cell}
            </button>
          ))}
        </div>

        <p className="save-e-note" aria-live="polite">
          {winner === "X" ? <span className="save-e-strong-green">Bạn thắng ván này.</span>
            : winner === "O" ? <span className="save-e-strong-blue">Máy thắng ván này.</span>
              : full ? "Hoà — không cộng trừ JOY." : "Đến lượt bạn."}
        </p>
        {joyNote ? <p className="save-e-note">{joyNote}</p> : null}
      </div>
    </section>
  );
}
