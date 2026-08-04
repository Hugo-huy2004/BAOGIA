import { useState, useEffect, useRef, useCallback } from "react";
import { playGameSelect, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";
import { levelFor, ramp, createCombo } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · Mỗi từ có ĐỒNG HỒ; cấp càng cao thời gian càng ngắn. Hết giờ = thua.
// · Kho từ đổi theo cấp: dễ → trung bình → khó → chuyên gia (từ dài dần).
// · Điểm mỗi từ = điểm nền (còn nhiều lượt đoán thì cao) + thưởng tốc độ,
//   rồi nhân chuỗi giải liên tiếp (tối đa x2).
// · Gợi ý trả bằng ĐIỂM trong ván (−25), không còn trừ JOY ở phía client —
//   trước đây nó trừ số dư ngay trên máy mà không gọi API nên ví bị lệch.
const GAME_ID = "wordguess";
const HINT_COST = 25;

const WORD_BANKS = {
  easy: [
    { word: "SACH", hint: "Vật chứa kiến thức, thường có nhiều trang giấy." },
    { word: "KINH", hint: "Vật đeo trước mắt để nhìn rõ hoặc chống nắng." },
    { word: "QUAT", hint: "Thiết bị tạo gió mát." },
    { word: "DONGHO", hint: "Vật dùng để xem giờ." },
    { word: "CHAO", hint: "Dụng cụ nhà bếp dùng để chiên, xào." },
    { word: "KEO", hint: "Dụng cụ có hai lưỡi dùng để cắt." },
    { word: "CHIAKHOA", hint: "Vật nhỏ dùng để mở ổ khóa." },
    { word: "GHE", hint: "Đồ nội thất dùng để ngồi." },
    { word: "BAN", hint: "Mặt phẳng có chân, dùng để học hoặc làm việc." },
    { word: "DEN", hint: "Thiết bị phát ra ánh sáng." },
  ],
  medium: [
    { word: "KHIEMTON", hint: "Đức tính nhún nhường, không tự cao." },
    { word: "TRITUE", hint: "Khả năng suy luận và hiểu biết." },
    { word: "CHIENTHANG", hint: "Kết quả đạt được khi vượt qua đối thủ." },
    { word: "COKHI", hint: "Ngành kỹ thuật liên quan đến máy móc." },
    { word: "ANHSANG", hint: "Thứ giúp mắt người nhìn thấy vật." },
    { word: "TRONGSANG", hint: "Phẩm chất ngay thẳng, không vụ lợi." },
    { word: "CHIHUY", hint: "Điều khiển và dẫn dắt một tập thể hành động." },
    { word: "DINHHUONG", hint: "Xác định con đường hoặc mục tiêu cần đi." },
    { word: "SANGTAO", hint: "Tạo ra ý tưởng hoặc cách làm mới." },
    { word: "KIENTAO", hint: "Xây dựng nên một giá trị hoặc hệ thống mới." },
  ],
  hard: [
    { word: "BAOHO", hint: "Trang bị giúp người lao động tránh nguy hiểm." },
    { word: "THUONGMAI", hint: "Hoạt động mua bán hàng hóa và dịch vụ." },
    { word: "NANGLUONG", hint: "Đại lượng thể hiện khả năng sinh công." },
    { word: "TRITHU", hint: "Kho tàng hiểu biết của con người." },
    { word: "VANHOA", hint: "Bản sắc đời sống tinh thần lâu đời." },
    { word: "DAODUC", hint: "Phẩm chất ứng xử chuẩn mực con người." },
    { word: "BEN VUNG".replace(" ", ""), hint: "Khả năng duy trì lâu dài mà không làm cạn kiệt nguồn lực." },
    { word: "TRACHNHIEM", hint: "Ý thức hoàn thành và chịu kết quả về việc mình làm." },
  ],
  expert: [
    { word: "TRIETHOC", hint: "Lĩnh vực nghiên cứu những vấn đề nền tảng của tồn tại và tư duy." },
    { word: "CONGNGHE", hint: "Ứng dụng khoa học kỹ thuật hiện đại." },
    { word: "VANHOC", hint: "Nghệ thuật ngôn từ thơ văn." },
    { word: "TRITUENHANTAO", hint: "Công nghệ mô phỏng khả năng học và suy luận của con người." },
    { word: "ANTOANTHONGTIN", hint: "Lĩnh vực bảo vệ dữ liệu và hệ thống khỏi truy cập trái phép." },
    { word: "KINHTETUANHOAN", hint: "Mô hình giảm chất thải bằng tái sử dụng và tái chế." },
  ],
};

// Độ khó tự động: cấp quyết định kho từ, số lượt đoán và thời gian.
function tierFor(level) {
  if (level <= 2) return { bank: "easy", guesses: 6 };
  if (level <= 4) return { bank: "medium", guesses: 6 };
  if (level <= 6) return { bank: "hard", guesses: 5 };
  return { bank: "expert", guesses: 5 };
}

export function evaluateGuess(guess, target) {
  const len = target.length;
  const result = Array(len).fill("absent");
  const targetLetters = target.split("");

  for (let i = 0; i < len; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetLetters[i] = null;
    }
  }
  for (let i = 0; i < len; i++) {
    if (result[i] === "correct") continue;
    const idx = targetLetters.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      targetLetters[idx] = null;
    }
  }
  return result;
}

function pickRandomWord(bank) {
  const list = WORD_BANKS[bank] || WORD_BANKS.medium;
  return list[Math.floor(Math.random() * list.length)];
}

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function GameWordGuess({ paused = false, onGameOver }) {
  const [level, setLevel] = useState(1);
  const [wordData, setWordData] = useState(() => pickRandomWord("easy"));
  const target = wordData.word;
  const wordLen = target.length;
  const tier = tierFor(level);
  const maxGuesses = tier.guesses;
  const wordTime = Math.round(ramp(GAME_ID, level, 95, 38));

  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("playing");
  const [revealedHint, setRevealedHint] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(wordTime);
  const [notice, setNotice] = useState("");

  const reportedRef = useRef(false);
  const streakRef = useRef(createCombo({ windowMs: Infinity, step: 0.2, max: 2 }));
  const scoreRef = useRef(0);
  scoreRef.current = totalScore;

  const finish = useCallback(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    onGameOver?.(scoreRef.current, "lose");
  }, [onGameOver]);

  const endGame = useCallback((reason) => {
    setStatus("lost");
    setNotice(reason);
    playGameLose();
    hapticLose();
  }, []);

  // Kết thúc thì tự nộp điểm sau vài giây — đóng game giữa chừng trước đây
  // bị tính 0 điểm dù người chơi đã giải được cả chục từ.
  useEffect(() => {
    if (status === "playing") return undefined;
    const t = setTimeout(finish, 2600);
    return () => clearTimeout(t);
  }, [status, finish]);

  // Đồng hồ đếm ngược từng từ — hết giờ là kết thúc ván.
  useEffect(() => {
    if (status !== "playing" || paused) return undefined;
    if (timeLeft <= 0) { endGame("Hết giờ!"); return undefined; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, status, paused, endGame]);

  const nextWord = useCallback((nextLevel) => {
    const t = tierFor(nextLevel);
    setWordData(pickRandomWord(t.bank));
    setGuesses([]);
    setInput("");
    setRevealedHint(false);
    setTimeLeft(Math.round(ramp(GAME_ID, nextLevel, 95, 38)));
  }, []);

  const handleUseHint = () => {
    if (status !== "playing") return;
    if (revealedHint) return;
    if (totalScore < HINT_COST) {
      setNotice(`Cần ít nhất ${HINT_COST} điểm để mở gợi ý`);
      setTimeout(() => setNotice(""), 1800);
      return;
    }
    setTotalScore((s) => s - HINT_COST);
    setRevealedHint(true);
    playGameSelect();
  };

  const submitGuess = () => {
    if (status !== "playing") return;
    const word = input.toUpperCase().trim();
    if (word.length !== wordLen || !/^[A-Z]+$/.test(word)) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 400);
      return;
    }

    const statuses = evaluateGuess(word, target);
    const newGuesses = [...guesses, { word, statuses }];
    setGuesses(newGuesses);
    setInput("");

    if (word === target) {
      // Điểm = nền theo số lượt còn dư + thưởng tốc độ, rồi nhân chuỗi.
      const base = Math.max(15, 55 - (newGuesses.length - 1) * 8);
      const speedBonus = Math.round((timeLeft / wordTime) * 35);
      const mult = streakRef.current.hit();
      const gained = Math.round((base + speedBonus) * mult);
      const newTotal = totalScore + gained;

      setTotalScore(newTotal);
      setWordsSolved((n) => n + 1);
      playGameWin();
      hapticWin();

      const nextLevel = levelFor(GAME_ID, newTotal);
      setLevel(nextLevel);
      setNotice(
        `+${gained} điểm${mult > 1 ? ` (chuỗi x${mult.toFixed(2).replace(/\.?0+$/, "")})` : ""}`
      );
      setTimeout(() => setNotice(""), 1800);
      setTimeout(() => nextWord(nextLevel), 900);
    } else if (newGuesses.length >= maxGuesses) {
      streakRef.current.reset();
      endGame(`Hết lượt đoán! Đáp án: ${target}`);
    } else {
      playGameSelect();
      hapticSelect();
    }
  };

  const handleKeyPress = useCallback((char) => {
    if (status !== "playing") return;
    if (char === "BACKSPACE" || char === "DELETE") setInput((s) => s.slice(0, -1));
    else if (char === "ENTER") submitGuess();
    else if (/^[A-Z]$/i.test(char)) setInput((s) => (s + char.toUpperCase()).slice(0, wordLen));
    // submitGuess đọc toàn bộ state dưới đây; liệt kê đủ để handler không bị cũ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, wordLen, input, guesses, timeLeft, totalScore, level, target, wordTime, maxGuesses]);

  useEffect(() => {
    if (paused) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleKeyPress("ENTER");
      else if (e.key === "Backspace") handleKeyPress("BACKSPACE");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, paused]);

  const letterStates = {};
  guesses.forEach(({ word, statuses }) => {
    word.split("").forEach((ch, idx) => {
      const st = statuses[idx];
      if (st === "correct") letterStates[ch] = "correct";
      else if (st === "present" && letterStates[ch] !== "correct") letterStates[ch] = "present";
      else if (st === "absent" && !letterStates[ch]) letterStates[ch] = "absent";
    });
  });

  const urgent = timeLeft <= 10;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <ArcadeHud
        gameId={GAME_ID}
        score={totalScore}
        combo={streakRef.current.chain + (streakRef.current.chain > 0 ? 1 : 0)}
        multiplier={streakRef.current.mult}
        notice={notice}
        stats={[
          { label: "Từ đã giải", value: wordsSolved },
          { label: "Còn lại", value: `${timeLeft}s` },
        ]}
      />

      <div className={`wg-timer${urgent ? " is-urgent" : ""}`} aria-hidden="true">
        <span style={{ width: `${Math.max(0, (timeLeft / wordTime) * 100)}%` }} />
      </div>

      <div className="gpanel w-full flex flex-col items-center p-4 rounded-[28px] mt-3">
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <span className="gaccent-dot w-2.5 h-2.5 rounded-full" />
            <h2 className="gaccent text-sm font-black tracking-wider uppercase">{wordLen} ký tự</h2>
          </div>
          <button
            type="button"
            onClick={handleUseHint}
            disabled={revealedHint || status !== "playing"}
            className="ttr-btn px-3.5 disabled:opacity-45"
            style={{ flex: "0 0 auto", minWidth: 128 }}
          >
            <span className="material-symbols-outlined">lightbulb</span>
            {revealedHint ? "Đã mở" : `Gợi ý −${HINT_COST}`}
          </button>
        </div>

        <div className="wg-clue">
          <span className="material-symbols-outlined">travel_explore</span>
          <p><small>GỢI Ý CHỦ ĐỀ</small>{wordData.hint}</p>
        </div>

        {revealedHint && (
          <div className="wg-hint">
            Mẫu chữ: <b>{target.split("").map((char, index) => (
              index === 0 || index === target.length - 1 ? char : "＿"
            )).join(" ")}</b>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-4">
          {Array.from({ length: maxGuesses }).map((_, rIdx) => {
            const guess = guesses[rIdx];
            const isCurrent = rIdx === guesses.length;
            const currentText = isCurrent ? input.padEnd(wordLen, " ") : "";

            return (
              <div
                key={rIdx}
                className={`wg-row ${isCurrent && shakeRow ? "wg-shake" : ""}`}
                style={{
                  "--word-length": wordLen,
                  gridTemplateColumns: `repeat(${wordLen}, minmax(0, 44px))`,
                }}
              >
                {Array.from({ length: wordLen }).map((_, cIdx) => {
                  let char = "";
                  let cls = "";
                  if (guess) {
                    char = guess.word[cIdx];
                    cls = `is-${guess.statuses[cIdx]}`;
                  } else if (isCurrent) {
                    char = currentText[cIdx]?.trim() || "";
                    if (char) cls = "is-typing";
                  }
                  return <div key={cIdx} className={`wg-cell ${cls}`}>{char}</div>;
                })}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          {KEY_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {rIdx === 2 && (
                <button onClick={() => handleKeyPress("ENTER")} className="wg-key wg-key--wide">GỬI</button>
              )}
              {row.split("").map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className={`wg-key ${letterStates[k] ? `is-${letterStates[k]}` : ""}`}
                >
                  {k}
                </button>
              ))}
              {rIdx === 2 && (
                <button onClick={() => handleKeyPress("BACKSPACE")} className="wg-key wg-key--wide">⌫</button>
              )}
            </div>
          ))}
        </div>

        {status !== "playing" && (
          <div className="wg-result">
            <p className="wg-result__title">Kết thúc</p>
            <p className="wg-result__sub">
              Đáp án: <b>{target}</b> — {wordData.hint}
            </p>
            <p className="wg-result__sub">
              {totalScore.toLocaleString("vi-VN")} điểm · {wordsSolved} từ đã giải
            </p>
            <button onClick={finish} className="ttr-btn ttr-btn--primary w-full mt-2">
              Nhận điểm & quay lại
            </button>
          </div>
        )}
      </div>

      <p className="game-control-hint mt-3 text-center text-[11px]">
        Nhập tiếng Việt không dấu · Giải nhanh được thưởng tốc độ · Chuỗi đúng liên tiếp sẽ nhân điểm
      </p>
    </div>
  );
}
