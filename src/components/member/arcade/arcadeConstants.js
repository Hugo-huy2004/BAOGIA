// Shared difficulty tiers across all 3 HugoArcade games. The win/lose JOY
// values here are for the UI preview only — the server (arcadeRoutes.js's
// REWARD_TABLE) is the source of truth and must be kept in sync if these change.
export const DIFFICULTIES = [
  { id: "easy", label: "Dễ", win: 5, lose: -2 },
  { id: "medium", label: "Trung Bình", win: 10, lose: -3 },
  { id: "hard", label: "Khó", win: 20, lose: -5 },
];

// Explicit (not template-literal) Tailwind class strings per tier — needed so
// the JIT scanner can find them; dynamic `bg-${color}-500` would not be detected.
export const DIFFICULTY_STYLES = {
  easy: {
    pillActive: "bg-emerald-500 text-white border-emerald-500",
    pillIdle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500"
  },
  medium: {
    pillActive: "bg-amber-500 text-white border-amber-500",
    pillIdle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500"
  },
  hard: {
    pillActive: "bg-rose-500 text-white border-rose-500",
    pillIdle: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500"
  }
};

// One-line rules + per-difficulty objective, shown in the always-visible
// instructions card and under each DifficultySelector pill — keeps "what am I
// trying to do" answered before the player commits to a match.
export const HOW_TO_PLAY = {
  "2048": {
    rule: "Vuốt hoặc dùng phím mũi tên để trượt và gộp các ô cùng số. Gộp đủ để đạt ô mục tiêu trước khi bàn cờ đầy.",
    objective: { easy: "Đạt ô 256", medium: "Đạt ô 512", hard: "Đạt ô 2048" }
  },
  caro: {
    rule: "Đặt quân X, xếp đủ 5 quân liên tiếp (ngang/dọc/chéo) trước khi AI làm được điều đó.",
    objective: { easy: "AI mới học, gần như không phòng thủ", medium: "AI chặn và xây thế chủ động", hard: "AI tính trước 1 bước, rất khó qua mặt" }
  },
  wordguess: {
    rule: "Đoán từ tiếng Việt 5 chữ (không dấu). Sau mỗi lượt, màu ô cho biết chữ đúng vị trí, đúng chữ sai vị trí, hoặc không có trong từ.",
    objective: { easy: "8 lượt đoán", medium: "6 lượt đoán", hard: "4 lượt đoán" }
  }
};
