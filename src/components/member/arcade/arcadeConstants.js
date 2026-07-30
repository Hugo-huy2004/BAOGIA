// Shared constants for HugoArcade games. All games are now endless mode —
// play until you lose, score as high as possible to earn more JOY.
//
// Độ khó KHÔNG còn chọn tay: mỗi game tự lên cấp theo điểm
// (xem `arcadeProgression.js`), và luật dưới đây nói rõ cấp cao đổi những gì.

// Legacy difficulty labels (kept for dead-code compatibility; no longer used in UI).
export const DIFFICULTIES = ["easy", "medium", "hard"];

// One-line rules for each game, shown in the intro screen.
export const HOW_TO_PLAY = {
  "2048": {
    rule: "Vuốt để gộp các ô cùng số. Gộp nhiều cặp một lượt được nhân điểm; cấp cao xuất hiện ô đá không gộp được.",
  },
  caro: {
    rule: "Đặt quân X, xếp đủ 5 quân liên tiếp (ngang/dọc/chéo) trước khi AI làm được điều đó.",
  },
  wordguess: {
    rule: "Đoán từ trước khi hết giờ. Giải nhanh và giải liên tiếp được nhân điểm; cấp cao từ dài hơn, ít thời gian hơn.",
  },
  survivor: {
    rule: "Né đạn, nhặt lõi vàng và bay sát để nạp Xung Phá. Cứ 3 đợt đối đầu một Boss ba pha với vũ khí và chiến thuật riêng.",
  },
  snake: {
    rule: "Vượt các chặng Vườn Neon, Bãi Mìn, Cổng Lượng Tử và Hyper Grid. Săn mồi vàng, giữ combo và thích nghi với thử thách mới sau mỗi 6 mồi.",
  },
  tetris: {
    rule: "Xoay và xếp khối cho kín hàng ngang. Có giữ khối và xem trước 3 khối; cấp cao sàn sẽ đẩy rác lên.",
  },
  flappy: {
    rule: "Chạm để bay qua các cột. Bay đúng giữa khe được PERFECT (gấp đôi điểm + chuỗi); cấp cao khe hẹp và cột trượt.",
  },
};
