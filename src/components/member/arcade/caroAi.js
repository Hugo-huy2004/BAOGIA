// Cờ caro 5 quân (gomoku) — luật thật, AI thật.
//
// TRƯỚC ĐÂY: bàn 3×3, thắng 3 quân, mức "Khó" chạy minimax đầy đủ. Tic-tac-toe
// 3×3 là game ĐÃ GIẢI: hai bên chơi đúng thì luôn hoà, nên mức Khó không thể
// thua mà cũng không thể thắng — ván nào cũng hoà sau 9 nước. Không có cách nào
// làm nó thú vị được; phải đổi luật về cờ caro thật.
//
// GIỜ: bàn 10×10, thắng 5 quân liền. Đủ lớn để có chiến thuật thật (chặn ba mở,
// tạo đòn đôi) mà mỗi ô vẫn ~36px trên điện thoại.

export const SIZE = 10;
export const WIN_LEN = 5;
export const EMPTY = 0;
export const PLAYER = 1;
export const AI = 2;

const DIRECTIONS = [
  [0, 1],   // ngang
  [1, 0],   // dọc
  [1, 1],   // chéo \
  [1, -1],  // chéo /
];

const inBounds = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

export const emptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
const cloneBoard = (board) => board.map((row) => [...row]);

/** Chuỗi quân của `player` xuyên qua (r,c) theo một hướng, kèm số đầu còn mở. */
function runThrough(board, r, c, player, dr, dc) {
  let count = 1;
  const cells = [[r, c]];

  let rr = r + dr, cc = c + dc;
  while (inBounds(rr, cc) && board[rr][cc] === player) { count++; cells.push([rr, cc]); rr += dr; cc += dc; }
  const openA = inBounds(rr, cc) && board[rr][cc] === EMPTY;

  rr = r - dr; cc = c - dc;
  while (inBounds(rr, cc) && board[rr][cc] === player) { count++; cells.push([rr, cc]); rr -= dr; cc -= dc; }
  const openB = inBounds(rr, cc) && board[rr][cc] === EMPTY;

  return { count, openEnds: (openA ? 1 : 0) + (openB ? 1 : 0), cells };
}

/** `player` có đủ WIN_LEN quân liền xuyên qua (r,c)? */
export function checkWin(board, r, c, player) {
  return DIRECTIONS.some(([dr, dc]) => runThrough(board, r, c, player, dr, dc).count >= WIN_LEN);
}

/** Các ô tạo nên đường thắng — để tô sáng khi kết thúc ván. */
export function winningLine(board, r, c, player) {
  for (const [dr, dc] of DIRECTIONS) {
    const run = runThrough(board, r, c, player, dr, dc);
    if (run.count >= WIN_LEN) return run.cells;
  }
  return [];
}

// Bảng giá trị đòn thế của gomoku. Khoảng cách giữa các mức phải LỚN: một "bốn
// mở" (chắc thắng) không được phép bị cộng dồn từ mấy cái "hai mở" mà vượt qua.
function threatScore(count, openEnds) {
  if (count >= WIN_LEN) return 10_000_000;
  if (openEnds === 0) return 0;                       // bị bít hai đầu = vô dụng
  if (count === 4) return openEnds === 2 ? 500_000 : 60_000;  // bốn mở / bốn bít một đầu
  if (count === 3) return openEnds === 2 ? 25_000 : 3_000;    // ba mở = đòn thật
  if (count === 2) return openEnds === 2 ? 700 : 120;
  return openEnds === 2 ? 40 : 10;
}

/** Giá trị của việc `player` đặt quân vào (r,c) — tổng đòn thế theo 4 hướng. */
export function cellScore(board, r, c, player) {
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = runThrough(board, r, c, player, dr, dc);
    total += threatScore(count, openEnds);
  }
  return total;
}

/** Ô trống nằm trong bán kính `radius` quanh một quân đã đặt. */
function candidates(board, radius = 2) {
  const out = [];
  let occupied = false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) { occupied = true; continue; }
      let near = false;
      for (let dr = -radius; dr <= radius && !near; dr++) {
        for (let dc = -radius; dc <= radius && !near; dc++) {
          if (inBounds(r + dr, c + dc) && board[r + dr][c + dc] !== EMPTY) near = true;
        }
      }
      if (near) out.push([r, c]);
    }
  }
  // Bàn trống: đi giữa bàn.
  if (!occupied) return [[Math.floor(SIZE / 2), Math.floor(SIZE / 2)]];
  return out;
}

/** Nước thắng ngay của `player`, nếu có. */
function immediateWin(board, player, cells) {
  for (const [r, c] of cells) {
    board[r][c] = player;
    const won = checkWin(board, r, c, player);
    board[r][c] = EMPTY;
    if (won) return [r, c];
  }
  return null;
}

// ── Ba mức độ ─────────────────────────────────────────────────────
// Chỉ khác nhau ở CHIỀU SÂU nhìn trước, không phải ở chỗ cố tình đi sai:
//   easy   — thắng nếu được, chặn nếu bị, còn lại đi gần như ngẫu nhiên
//   medium — chấm điểm tĩnh: đòn của mình + đòn chặn được của đối thủ
//   hard   — thêm một tầng: trừ đi đòn mạnh nhất mà đối thủ đáp lại được, nên
//            không bao giờ tự chìa ra "bốn mở" hay bỏ qua "ba mở" của đối thủ

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

export function pickMoveEasy(board) {
  const cells = candidates(board, 1);
  if (!cells.length) return null;
  return immediateWin(board, AI, cells)
    || immediateWin(board, PLAYER, cells)   // chặn nước thắng lộ liễu
    || pickRandom(cells);
}

export function pickMoveMedium(board) {
  const cells = candidates(board);
  if (!cells.length) return null;
  const win = immediateWin(board, AI, cells);
  if (win) return win;
  const block = immediateWin(board, PLAYER, cells);
  if (block) return block;

  let best = null, bestScore = -Infinity;
  for (const [r, c] of cells) {
    // Điểm tấn công + điểm phòng ngự (đúng ô đó cũng là ô đối thủ muốn chiếm).
    const score = cellScore(board, r, c, AI) + cellScore(board, r, c, PLAYER) * 0.9;
    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

const HARD_SHORTLIST = 10;

export function pickMoveHard(board) {
  const cells = candidates(board);
  if (!cells.length) return null;
  const win = immediateWin(board, AI, cells);
  if (win) return win;
  const block = immediateWin(board, PLAYER, cells);
  if (block) return block;

  // Rút gọn danh sách bằng điểm tĩnh trước khi nhìn sâu — 10 nước đáng xem là
  // đủ, xét cả ~60 ô trống thì chậm mà không mạnh hơn.
  const shortlist = cells
    .map(([r, c]) => ({
      r, c,
      score: cellScore(board, r, c, AI) + cellScore(board, r, c, PLAYER) * 0.9,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, HARD_SHORTLIST);

  let best = null, bestValue = -Infinity;
  const work = cloneBoard(board);

  for (const { r, c, score } of shortlist) {
    work[r][c] = AI;

    // Sau nước này đối thủ mạnh nhất làm được gì? Nếu họ thắng luôn thì nước
    // này thua trắng, bất kể điểm tấn công đẹp cỡ nào.
    const replies = candidates(work);
    let worstReply = 0;
    for (const [rr, cc] of replies) {
      work[rr][cc] = PLAYER;
      const wins = checkWin(work, rr, cc, PLAYER);
      work[rr][cc] = EMPTY;
      if (wins) { worstReply = Infinity; break; }
      const replyScore = cellScore(work, rr, cc, PLAYER) + cellScore(work, rr, cc, AI) * 0.9;
      if (replyScore > worstReply) worstReply = replyScore;
    }

    work[r][c] = EMPTY;

    const value = worstReply === Infinity ? -Infinity : score - worstReply * 0.95;
    if (value > bestValue) { bestValue = value; best = [r, c]; }
  }

  // Mọi nước đều dẫn tới thua ép: cứ chọn nước có điểm tĩnh cao nhất.
  return best || [shortlist[0].r, shortlist[0].c];
}

const PICKERS = { easy: pickMoveEasy, medium: pickMoveMedium, hard: pickMoveHard };

export function pickMove(board, level = "medium") {
  return (PICKERS[level] || pickMoveMedium)(board);
}
