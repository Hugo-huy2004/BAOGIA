import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { chooseBotMove, squareName } from "../GameChess3D";
import { checkWin, pickAiMoveHard } from "../GameCaro";
import { moveTileGrid } from "../Game2048";

describe("HugoChess Table offline", () => {
  it("đổi đúng tọa độ bàn cờ hiển thị", () => {
    expect(squareName(0, 0)).toBe("a8");
    expect(squareName(7, 7)).toBe("h1");
  });

  it("BOT luôn chọn một nước hợp lệ mà không cần kết nối mạng", () => {
    const chess = new Chess();
    const legal = chess.moves({ verbose: true }).map(move => `${move.from}${move.to}`);
    const picked = chooseBotMove(chess, 3);
    expect(legal).toContain(`${picked.from}${picked.to}`);
  });
});

describe("Caro 3 × 3", () => {
  it("thắng khi có đúng ba ô liên tiếp", () => {
    const board = [
      [1, 1, 1],
      [0, 2, 0],
      [2, 0, 0],
    ];
    expect(checkWin(board, 0, 2, 1)).toBe(true);
  });

  it("AI cấp cao lấy nước thắng ngay", () => {
    const board = [
      [2, 2, 0],
      [1, 1, 0],
      [0, 0, 0],
    ];
    expect(pickAiMoveHard(board)).toEqual([0, 2]);
  });
});

describe("2048 Fusion", () => {
  it("gộp hai cặp trong cùng lượt và trả đúng tổng điểm", () => {
    const tile = value => ({ id: `${value}-${Math.random()}`, value });
    const grid = [
      [tile(2), tile(2), tile(4), tile(4)],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = moveTileGrid(grid, "left");
    expect(result.merges).toBe(2);
    expect(result.gained).toBe(12);
    expect(result.grid[0].filter(Boolean).map(item => item.value)).toEqual([4, 8]);
  });
});
