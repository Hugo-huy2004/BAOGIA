// Bot cờ vua: negamax + cắt tỉa alpha-beta + bảng điểm theo ô.
//
// BẢN CŨ chỉ chấm điểm MỘT nước: ăn quân + chiếu + tiến về giữa bàn, trừ đi
// "nước ăn to nhất mà đối thủ đáp lại được". Nó không thấy quá một nước, nên:
//   · thả quân vào ô bị ăn lại (chỉ tính nước ăn ĐẦU, không tính ăn lại),
//   · không thấy chiếu hết trong 2 nước,
//   · không hiểu vị trí (tốt ở hàng 7 với tốt ở hàng 2 là như nhau).
// Cấp 3 vì thế vẫn thua người mới chơi biết đếm quân.
//
// GIỜ: tìm kiếm thật theo chiều sâu, có sắp xếp nước đi để cắt tỉa hiệu quả và
// có "tìm kiếm yên tĩnh" (quiescence) — phần khiến bot không còn treo quân.

import { Chess } from "chess.js";

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Bảng điểm theo ô, viết theo góc nhìn TRẮNG, ô a8 ở đầu (khớp thứ tự
// `chess.board()`). Đây là toàn bộ "hiểu biết vị trí" của bot: tốt nên tiến,
// mã nên vào giữa, vua nên núp sau hàng tốt ở giai đoạn đầu.
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

const MATE = 900_000;

/**
 * Điểm thế cục theo góc nhìn của BÊN ĐANG ĐI (âm = đang thua thế).
 * Negamax cần điểm tương đối theo lượt, không phải "luôn theo trắng".
 */
export function evaluate(chess) {
  let score = 0;
  const rows = chess.board();
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (!piece) continue;
      const index = r * 8 + c;
      // Bảng viết cho trắng; quân đen đọc bảng lật theo hàng.
      const pstIndex = piece.color === "w" ? index : (7 - r) * 8 + c;
      const worth = VALUE[piece.type] + PST[piece.type][pstIndex];
      score += piece.color === "w" ? worth : -worth;
    }
  }
  return chess.turn() === "w" ? score : -score;
}

// Ăn quân to bằng quân nhỏ được xét trước — thứ tự này là thứ quyết định
// alpha-beta cắt được nhiều hay ít.
const moveOrder = (move) => (
  (move.captured ? 10_000 + VALUE[move.captured] - VALUE[move.piece] / 10 : 0)
  + (move.promotion ? VALUE[move.promotion] : 0)
  + (move.san.includes("+") ? 50 : 0)
);

const sorted = (moves) => [...moves].sort((a, b) => moveOrder(b) - moveOrder(a));

/**
 * Tìm kiếm yên tĩnh: ở đáy cây chỉ xét tiếp các nước ĂN QUÂN. Không có bước
 * này thì bot "nhìn" hết độ sâu ngay giữa một pha đổi quân và tưởng mình đang
 * ăn không — đó chính là lỗi treo quân của bản cũ.
 */
function quiescence(chess, alpha, beta, budget) {
  const standPat = evaluate(chess);
  if (standPat >= beta || budget.nodes <= 0) return standPat;

  // Phải là "fail-soft": giá trị trả về luôn là điểm THẬT của thế cục, không
  // bao giờ là `alpha`. Trả về alpha (fail-hard) làm mọi nước tệ được nâng lên
  // bằng nước tốt nhất đã tìm được — bot ăn hậu miễn phí và đẩy tốt vô nghĩa
  // sẽ cùng điểm, rồi nhiễu ngẫu nhiên quyết định. Đúng là lỗi đã bị test bắt.
  let best = standPat;
  if (best > alpha) alpha = best;

  for (const move of sorted(chess.moves({ verbose: true }).filter((m) => m.captured))) {
    budget.nodes -= 1;
    if (budget.nodes <= 0) break;
    chess.move(move);
    const score = -quiescence(chess, -beta, -alpha, budget);
    chess.undo();
    if (score > best) best = score;
    if (best >= beta) return best;
    if (best > alpha) alpha = best;
  }
  return best;
}

function negamax(chess, depth, alpha, beta, budget) {
  if (chess.isCheckmate()) return -MATE - depth;   // bị hết càng sớm càng tệ
  if (chess.isDraw() || chess.isStalemate()) return 0;
  if (depth === 0 || budget.nodes <= 0) return quiescence(chess, alpha, beta, budget);

  let best = -Infinity;
  for (const move of sorted(chess.moves({ verbose: true }))) {
    budget.nodes -= 1;
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -alpha, budget);
    chess.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;          // cắt tỉa
    if (budget.nodes <= 0) break;
  }
  return best === -Infinity ? evaluate(chess) : best;
}

// Cấp độ = chiều sâu + độ nhiễu. Cấp 1 phải THẮNG ĐƯỢC cho người mới, nên chỉ
// nhìn 1 nước và chọn khá ngẫu nhiên trong các nước tử tế; cấp 3 nhìn 3 nước và
// gần như không nhiễu.
const LEVELS = {
  1: { depth: 1, noise: 120, nodes: 6_000 },
  2: { depth: 2, noise: 35,  nodes: 30_000 },
  3: { depth: 3, noise: 0,   nodes: 120_000 },
};

/**
 * Nước đi tốt nhất cho bên đang đi. Không sửa `chess` truyền vào.
 * @param {import("chess.js").Chess} chess
 * @param {1|2|3} level
 */
export function chooseBotMove(chess, level = 2) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  const { depth, noise, nodes } = LEVELS[level] || LEVELS[2];
  // Bản sao riêng để tìm kiếm: hàm này không được để lại dấu vết trên ván thật.
  const work = new Chess(chess.fen());
  const budget = { nodes };

  let bestMove = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;

  for (const move of sorted(moves)) {
    work.move(move);
    // Chiếu hết là hết, không cần tính gì thêm.
    const mate = work.isCheckmate();
    const score = mate ? MATE : -negamax(work, depth - 1, -Infinity, -alpha, budget);
    work.undo();
    if (mate) return move;

    const jittered = score + (noise ? Math.random() * noise : 0);
    if (jittered > bestScore) {
      bestScore = jittered;
      bestMove = move;
      if (score > alpha) alpha = score;
    }
  }
  return bestMove || moves[0];
}
