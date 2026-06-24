import React, { useState, useEffect, useRef, useCallback } from "react";
import { playGameSelect, playGameWin, playGameLose } from "../../../utils/audio";
import { hapticSelect, hapticWin, hapticLose } from "../../../utils/haptics";

const WORD_LENGTH = 5;
const MAX_GUESSES_BY_DIFFICULTY = { easy: 8, medium: 6, hard: 4 };

// Curated bank of common Vietnamese words, accents stripped to plain A-Z so
// guessing stays a simple Latin-letter mechanic (building a full Vietnamese
// dictionary with tone marks is out of scope for this game).
const WORD_BANK = [
  "NGUOI", "DUONG", "THIEN", "HOANG", "CHIEN", "TRUOC", "KHONG", "THANG", "QUANG", "TRANG",
  "THICH", "LUYEN", "TUONG", "HUONG", "VUONG", "MUONG", "LUONG", "SUONG", "XUONG", "NGUOC",
  "NGHIA", "HUYEN", "QUYEN", "TUYEN", "DUYEN", "KHOAN", "NGOAN", "KHUON", "RUONG", "NUONG",
  "TRUOT", "CUONG", "GUONG"
];

// Classic Wordle evaluation: exact-position matches first, then "present"
// (right letter, wrong spot) only up to how many of that letter remain
// unmatched in the target — this is the part naive implementations get wrong
// with duplicate letters (e.g. guessing "TUONG" against target "DUONG").
export function evaluateGuess(guess, target) {
  const result = Array(WORD_LENGTH).fill("absent");
  const targetLetters = target.split("");

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetLetters[i] = null;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const idx = targetLetters.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      targetLetters[idx] = null;
    }
  }
  return result;
}

function pickTarget() {
  return WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
}

const STATUS_CLASS = {
  correct: "word-correct", present: "word-present", absent: "word-absent",
  active: "word-active", empty: "word-empty"
};

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export default function GameWordGuess({ difficulty = "medium", onGameOver }) {
  const maxGuesses = MAX_GUESSES_BY_DIFFICULTY[difficulty] || 6;
  const [target, setTarget] = useState(pickTarget);
  const [guesses, setGuesses] = useState([]); // [{ word, statuses }]
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [shakeRow, setShakeRow] = useState(false);
  const reportedRef = useRef(false);

  const reportGameOver = useCallback((finalStatus, guessCount) => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    const score = finalStatus === "won" ? Math.max(0, 100 - guessCount * 15) : 0;
    onGameOver?.(score, finalStatus === "won" ? "win" : "lose");
  }, [onGameOver]);

  const submitGuess = () => {
    if (status !== "playing") return;
    const word = input.toUpperCase().trim();
    if (word.length !== WORD_LENGTH || !/^[A-Z]+$/.test(word)) {
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (status !== "playing") return;
      if (e.key === "Enter") submitGuess();
      else if (e.key === "Backspace") setInput((s) => s.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && input.length < WORD_LENGTH) setInput((s) => (s + e.key).toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, status, guesses, target]);

  // Cumulative per-letter knowledge for the on-screen keyboard hints.
  const letterStatus = {};
  for (const g of guesses) {
    g.word.split("").forEach((letter, i) => {
      const s = g.statuses[i];
      const rank = { correct: 3, present: 2, absent: 1 };
      if (!letterStatus[letter] || rank[s] > rank[letterStatus[letter]]) letterStatus[letter] = s;
    });
  }

  const rows = Array.from({ length: maxGuesses }, (_, i) => {
    if (i < guesses.length) return guesses[i];
    if (i === guesses.length && status === "playing") return { word: input.padEnd(WORD_LENGTH), statuses: null, active: true };
    return { word: "".padEnd(WORD_LENGTH), statuses: null };
  });

  return (
    <div className="wordgame-shell flex flex-col items-center gap-5 w-full max-w-[480px]">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="wordgame-kicker">
          Mật mã tiếng Việt · 5 chữ
        </p>
        <p className="wordgame-status">
          {status === "won" && "Chính xác! 🎉"}
          {status === "lost" && `Hết lượt! Đáp án: ${target}`}
          {status === "playing" && `Lượt ${guesses.length + 1} / ${maxGuesses}`}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className={`flex gap-1.5 ${row.active && shakeRow ? "animate-[shake_0.4s]" : ""}`}>
            {row.word.split("").map((letter, cIdx) => {
              const s = row.statuses ? row.statuses[cIdx] : (row.active && letter.trim() ? "active" : "empty");
              return (
                <div
                  key={cIdx}
                  className={`word-cell w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-black text-xl uppercase transition-colors ${STATUS_CLASS[s]}`}
                >
                  {letter.trim()}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="word-keyboard flex flex-col gap-1.5 w-full">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {i === 2 && (
              <button
                onClick={() => setInput((s) => s.slice(0, -1))}
                className="word-key special flex-[1.5] h-12 text-xs font-bold active:scale-95 transition-transform"
              >
                ⌫
              </button>
            )}
            {row.split("").map((letter) => (
              <button
                key={letter}
                onClick={() => status === "playing" && input.length < WORD_LENGTH && setInput((s) => s + letter)}
                className={`word-key flex-1 h-12 text-sm font-bold transition-colors ${
                  letterStatus[letter] === "correct" ? "correct" :
                  letterStatus[letter] === "present" ? "present" :
                  letterStatus[letter] === "absent" ? "absent" : ""
                }`}
              >
                {letter}
              </button>
            ))}
            {i === 2 && (
              <button
                onClick={submitGuess}
                className="word-key submit flex-[1.5] h-12 text-xs font-bold active:scale-95 transition-transform"
              >
                Gửi
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
