// Shared difficulty tiers across all 3 HugoArcade games. The win/lose JOY
// values here are for the UI preview only — the server (arcadeRoutes.js's
// REWARD_TABLE) is the source of truth and must be kept in sync if these change.
export const DIFFICULTIES = [
  { id: "easy", label: "Khởi động", kicker: "Làm quen", win: 18, lose: -10, description: "Nhẹ nhàng, phù hợp để làm quen luật chơi và tích lũy chuỗi thắng." },
  { id: "medium", label: "Bứt phá", kicker: "Phổ biến", win: 38, lose: -10, description: "Nhịp độ cân bằng, cần tập trung và một chiến thuật rõ ràng." },
  { id: "hard", label: "Huyền thoại", kicker: "Thử thách lớn", win: 75, lose: -10, description: "Mục tiêu khắc nghiệt dành cho người muốn chinh phục bảng xếp hạng." },
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
    rule: "Doán từ Hán-Việt & Tri thức có nghĩa. Dùng nút 💡 Gợi ý (5 JOY) để tiết lộ chữ đầu tiên và ý nghĩa từ.",
    objective: { easy: "Từ 4 chữ (Đồ vật)", medium: "Từ 5 chữ (Hán-Việt)", hard: "Từ 6 chữ (Tri thức)" }
  },
  survivor: {
    rule: "Di chuyển tự do 360 độ để né đạn. Càng sống sót lâu, màn hình càng hỗn loạn. Sóng âm sẽ phát ra khi bạn chuyển màn.",
    objective: { easy: "Sống sót 30 giây", medium: "Sống sót 60 giây", hard: "Sống sót 90 giây" }
  },
  snake: {
    rule: "Điều khiển con Rắn Neon 3D ăn các quả cầu ma thuật để dài ra. Tuyệt đối không chạm vào thân mình hoặc tường.",
    objective: { easy: "Thu thập 8 quả cầu", medium: "Thu thập 14 quả cầu", hard: "Thu thập 20 quả cầu" }
  },
  tetris: {
    rule: "Xoay và xếp các khối Neon 3D vừa khít các hàng ngang để ghi điểm và giải phóng bàn cờ.",
    objective: { easy: "Xóa 5 hàng Neon", medium: "Xóa 12 hàng bứt phá", hard: "Chinh phục 25 hàng Neon" }
  },
  flappy: {
    rule: "Chạm màn hình hoặc ấn phím Space để điều khiển chú chim Cyber Neon chao lượn qua các cột điện từ trường. Ăn ngọc Chrono để kích hoạt Slow-Motion.",
    objective: { easy: "Vượt 5 cột điện", medium: "Vượt 15 cột điện", hard: "Vượt 30 cột điện" }
  }
};
