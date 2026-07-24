import React, { useState, useEffect, useRef, useCallback } from "react";
import { playGameSelect, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";
import { useJoyStore } from "../../../stores/joyStore";
import { notify } from "../../../lib/notify";

// Categorized banks of strictly meaningful Vietnamese words (No random names or gibberish)
const WORD_BANKS = {
  easy: [
    { word: "SACH", hint: "Vật dụng chứa kiến thức, bài học học đường." },
    { word: "KINH", hint: "Đồ vật đeo mắt giúp nhìn rõ hoặc chống nắng." },
    { word: "QUAT", hint: "Đồ vật tạo ra gió mát trong mùa hè." },
    { word: "DONG", hint: "Vật dụng đo thời gian giờ phút." },
    { word: "CHAO", hint: "Dụng cụ làm bếp dùng để chiên xào." },
    { word: "KEOO", hint: "Dụng cụ dùng để cắt giấy, vải." },
    { word: "CHIA", hint: "Vật nhỏ bằng kim loại mở ổ khóa." },
    { word: "GHEE", hint: "Đồ vật nội thất dùng để ngồi làm việc." },
  ],
  medium: [
    { word: "KHIEM", hint: "Đức tính nhún nhường, không tự cao tự đại." },
    { word: "TRITU", hint: "Khả năng suy luận, hiểu biết thông minh." },
    { word: "THANG", hint: "Đạt vị trí dẫn đầu trong một cuộc thi." },
    { word: "COKHI", hint: "Ngành kỹ thuật máy móc cơ khí." },
    { word: "QUANG", hint: "Ánh sáng phát ra rực rỡ." },
    { word: "TRANG", hint: "Vẻ đẹp thanh cao, trong sạch." },
    { word: "TUONG", hint: "Vị tướng chỉ huy quân đội." },
    { word: "PHUONG", hint: "Chiếc hướng chỉ về tương lai." },
  ],
  hard: [
    { word: "BAOHOE", hint: "Trang phục bảo vệ an toàn cho người lao động." },
    { word: "THUONG", hint: "Hoạt động trao đổi hàng hóa thị trường." },
    { word: "NANGLU", hint: "Khả năng sinh công hoặc năng lượng mặt trời." },
    { word: "TRITHU", hint: "Kho tàng hiểu biết của con người." },
    { word: "VANHOA", hint: "Bản sắc đời sống tinh thần lâu đời." },
    { word: "DAODUC", hint: "Phẩm chất ứng xử chuẩn mực con người." },
  ],
  expert: [
    { word: "TRIETHOC", hint: "Học thuyết nghiên cứu bản chất vũ trụ tư duy." },
    { word: "CONGNGHE", hint: "Ứng dụng khoa học kỹ thuật hiện đại." },
    { word: "VANHOC", hint: "Nghệ thuật ngôn từ thơ văn." },
  ],
};

const MAX_GUESSES = { easy: 7, medium: 6, hard: 5, expert: 5 };

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

function pickRandomWord(level) {
  const bank = WORD_BANKS[level] || WORD_BANKS.medium;
  return bank[Math.floor(Math.random() * bank.length)];
}

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function GameWordGuess({ difficulty = "medium", onGameOver }) {
  const level = WORD_BANKS[difficulty] ? difficulty : "medium";
  const [wordData, setWordData] = useState(() => pickRandomWord(level));
  const target = wordData.word;
  const wordLen = target.length;
  const maxGuesses = MAX_GUESSES[level] || 6;

  const [guesses, setGuesses] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("playing");
  const [revealedHint, setRevealedHint] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const reportedRef = useRef(false);

  const joyBalance = useJoyStore((s) => s.balance);

  const reportGameOver = useCallback(
    (finalStatus, guessCount) => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      const basePoints = { easy: 20, medium: 50, hard: 100, expert: 200 }[level] || 50;
      const score = finalStatus === "won" ? Math.max(10, basePoints - guessCount * 5) : 0;
      onGameOver?.(score, finalStatus === "won" ? "win" : "lose");
    },
    [level, onGameOver]
  );

  const handleUseHint = () => {
    if (revealedHint) {
      notify.info(`Gợi ý: ${wordData.hint} (Bắt đầu bằng chữ '${target[0]}')`);
      return;
    }
    if (joyBalance < 5) {
      notify.error("Bạn cần ít nhất 5 JOY để dùng gợi ý!");
      return;
    }
    useJoyStore.getState().setBalance(joyBalance - 5);
    setRevealedHint(true);
    notify.success(`💡 Gợi ý (-5 JOY): ${wordData.hint} | Chữ cái đầu: "${target[0]}"`);
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
      setStatus("won");
      playGameWin();
      hapticWin();
      reportGameOver("won", newGuesses.length);
    } else if (newGuesses.length >= maxGuesses) {
      setStatus("lost");
      playGameLose();
      hapticLose();
      reportGameOver("lost", newGuesses.length);
    } else {
      playGameSelect();
      hapticSelect();
    }
  };

  const handleKeyPress = (char) => {
    if (status !== "playing") return;
    if (char === "BACKSPACE" || char === "DELETE") {
      setInput((s) => s.slice(0, -1));
    } else if (char === "ENTER") {
      submitGuess();
    } else if (input.length < wordLen && /^[A-Z]$/i.test(char)) {
      setInput((s) => (s + char.toUpperCase()).slice(0, wordLen));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleKeyPress("ENTER");
      else if (e.key === "Backspace") handleKeyPress("BACKSPACE");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [input, status, wordLen]);

  // Key states for visual keyboard coloring
  const letterStates = {};
  guesses.forEach(({ word, statuses }) => {
    word.split("").forEach((ch, idx) => {
      const st = statuses[idx];
      if (st === "correct") letterStates[ch] = "correct";
      else if (st === "present" && letterStates[ch] !== "correct") letterStates[ch] = "present";
      else if (st === "absent" && !letterStates[ch]) letterStates[ch] = "absent";
    });
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#080d1a] text-white rounded-[32px] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.12)] max-w-md mx-auto">
      {/* Level Header & Hint Button */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <h2 className="text-sm font-black tracking-wider text-cyan-300 uppercase">
            Mật Mã Từ 3D ({wordLen} Ký Tự)
          </h2>
        </div>
        <button
          onClick={handleUseHint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 active:scale-95 transition-all"
        >
          <span>💡 Gợi Ý (5 JOY)</span>
        </button>
      </div>

      {revealedHint && (
        <div className="w-full bg-amber-500/10 border border-amber-400/30 rounded-2xl p-2.5 mb-3 text-xs text-amber-200 text-center animate-fade-in">
          <strong>Gợi ý:</strong> {wordData.hint} (Bắt đầu bằng chữ <strong>'{target[0]}'</strong>)
        </div>
      )}

      {/* 3D Glass Flip Tiles Grid */}
      <div className="flex flex-col gap-2 mb-4">
        {Array.from({ length: maxGuesses }).map((_, rIdx) => {
          const guess = guesses[rIdx];
          const isCurrent = rIdx === guesses.length;
          const currentText = isCurrent ? input.padEnd(wordLen, " ") : "";

          return (
            <div
              key={rIdx}
              className={`flex gap-1.5 ${isCurrent && shakeRow ? "animate-bounce" : ""}`}
            >
              {Array.from({ length: wordLen }).map((_, cIdx) => {
                let char = "";
                let bgClass = "bg-zinc-900/80 border-zinc-700/50 text-white";

                if (guess) {
                  char = guess.word[cIdx];
                  const st = guess.statuses[cIdx];
                  if (st === "correct") bgClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_#059669]";
                  else if (st === "present") bgClass = "bg-amber-600 border-amber-400 text-white shadow-[0_0_12px_#d97706]";
                  else bgClass = "bg-zinc-800/90 border-zinc-700 text-zinc-500";
                } else if (isCurrent) {
                  char = currentText[cIdx]?.trim() || "";
                  if (char) bgClass = "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_10px_#06b6d4]";
                }

                return (
                  <div
                    key={cIdx}
                    className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xl tracking-wider transition-all duration-300 transform style-3d ${bgClass}`}
                    style={{
                      perspective: "1000px",
                      boxShadow: "0 6px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)",
                    }}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Onscreen Keyboard */}
      <div className="flex flex-col gap-1.5 w-full">
        {KEY_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {rIdx === 2 && (
              <button
                onClick={() => handleKeyPress("ENTER")}
                className="px-2.5 py-3 rounded-lg bg-emerald-600 text-white font-bold text-xs active:scale-95 shadow"
              >
                GỬI
              </button>
            )}
            {row.split("").map((k) => {
              const st = letterStates[k];
              let kStyle = "bg-zinc-800 border-zinc-700 text-white";
              if (st === "correct") kStyle = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_#059669]";
              else if (st === "present") kStyle = "bg-amber-600 border-amber-400 text-white shadow-[0_0_8px_#d97706]";
              else if (st === "absent") kStyle = "bg-zinc-900 border-zinc-800 text-zinc-600 opacity-60";

              return (
                <button
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className={`w-8 h-10 rounded-lg border font-black text-sm active:scale-95 transition-all flex items-center justify-center ${kStyle}`}
                >
                  {k}
                </button>
              );
            })}
            {rIdx === 2 && (
              <button
                onClick={() => handleKeyPress("BACKSPACE")}
                className="px-2.5 py-3 rounded-lg bg-rose-600 text-white font-bold text-xs active:scale-95 shadow"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Game Over Result Banner */}
      {status !== "playing" && (
        <div className="mt-4 p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 text-center w-full animate-fade-in">
          <h3 className={`text-xl font-black mb-1 ${status === "won" ? "text-emerald-400" : "text-rose-500"}`}>
            {status === "won" ? "🎉 BẠN ĐÃ GIẢI ĐƯỢC MẬT MÃ!" : "❌ THUA CUỘC!"}
          </h3>
          <p className="text-xs text-zinc-300 mb-3">Đáp án đúng là: <strong className="text-cyan-300 font-mono">{target}</strong> ({wordData.hint})</p>
          <button
            onClick={() => {
              const nextWord = pickRandomWord(level);
              setWordData(nextWord);
              setGuesses([]);
              setInput("");
              setStatus("playing");
              setRevealedHint(false);
              reportedRef.current = false;
            }}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Chơi Từ Mới
          </button>
        </div>
      )}
    </div>
  );
}
