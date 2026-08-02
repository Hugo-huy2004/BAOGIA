// Luật cờ ca-rô 3x3 — tách khỏi component để kiểm thử được bằng logic thuần.

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function winnerOf(cells) {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a];
  }
  return null;
}

/**
 * Nước đi của máy. KHÔNG phải AI: chỉ là ba luật cố định chạy trong máy người
 * dùng — thắng được thì thắng, chặn được thì chặn, còn lại ưu tiên ô giữa rồi
 * tới bốn góc. Không gọi mạng, không mô hình, đúng tinh thần chế độ tiết kiệm.
 */
export function pickMove(cells) {
  const empty = cells.map((cell, index) => (cell ? null : index)).filter((index) => index !== null);
  for (const mark of ["O", "X"]) {
    for (const index of empty) {
      const next = [...cells];
      next[index] = mark;
      if (winnerOf(next) === mark) return index;
    }
  }
  return [4, 0, 2, 6, 8, 1, 3, 5, 7].find((index) => empty.includes(index));
}
