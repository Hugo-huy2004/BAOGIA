// Shared difficulty tiers across all 3 HugoArcade games. The win/lose JOY
// values here are for the UI preview only — the server (arcadeRoutes.js's
// REWARD_TABLE) is the source of truth and must be kept in sync if these change.
export const DIFFICULTIES = [
  { id: "easy", label: "Khởi động", kicker: "Làm quen", icon: "local_fire_department", win: 18, lose: -10, description: "Nhẹ nhàng, phù hợp để làm quen luật chơi và tích lũy chuỗi thắng." },
  { id: "medium", label: "Bứt phá", kicker: "Phổ biến", icon: "bolt", win: 38, lose: -10, description: "Nhịp độ cân bằng, cần tập trung và một chiến thuật rõ ràng." },
  { id: "hard", label: "Huyền thoại", kicker: "Thử thách lớn", icon: "workspace_premium", win: 75, lose: -10, description: "Mục tiêu khắc nghiệt dành cho người muốn chinh phục bảng xếp hạng." },
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
    objective: { easy: "Kiến tạo ô 256", medium: "Chinh phục ô 512", hard: "Đánh thức ô 2048" }
  },
  caro: {
    rule: "Đặt quân X, xếp đủ 5 quân liên tiếp (ngang/dọc/chéo) trước khi AI làm được điều đó.",
    objective: { easy: "Đấu AI tập sự", medium: "Đấu AI chiến thuật", hard: "Hạ AI nhìn trước nước đi" }
  },
  wordguess: {
    rule: "Đoán từ tiếng Việt 5 chữ (không dấu). Sau mỗi lượt, màu ô cho biết chữ đúng vị trí, đúng chữ sai vị trí, hoặc không có trong từ.",
    objective: { easy: "Giải mã trong 8 lượt", medium: "Giải mã trong 6 lượt", hard: "Giải mã chỉ với 4 lượt" }
  },
  survivor: {
    rule: "Di chuyển tự do 360 độ để né đạn. Càng sống sót lâu, màn hình càng hỗn loạn. Sóng âm sẽ phát ra khi bạn chuyển màn.",
    objective: { easy: "Sống sót 30 giây", medium: "Sống sót 60 giây", hard: "Sống sót 90 giây" }
  },
  slasher: {
    rule: "Vuốt chuột (kéo thả) để chém nát các khối mục tiêu bay lên. Chém trượt hoặc chém trúng bom sẽ trừ máu.",
    objective: { easy: "Ghi 50 điểm", medium: "Ghi 150 điểm", hard: "Ghi 300 điểm" }
  },
  geometry: {
    rule: "Nhân vật trượt tự động. Click hoặc bấm Phím Cách để nhảy lách qua chướng ngại vật Neon rực rỡ.",
    objective: { easy: "Hoàn thành 30%", medium: "Hoàn thành 60%", hard: "100% không mất mạng" }
  }
};
