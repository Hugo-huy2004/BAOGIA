import { describe, expect, it } from "vitest";
import {
  SIZE, WIN_LEN, EMPTY, PLAYER, AI,
  checkWin, winningLine, cellScore, emptyBoard,
  pickMoveEasy, pickMoveMedium, pickMoveHard,
} from "./caroAi";

// Bàn viết bằng chữ cho dễ đọc: '.' trống, 'x' người, 'o' máy.
// Thiếu ký tự thì tự bù ô trống, nên chỉ cần viết phần có quân.
const board = (...rows) => {
  const b = emptyBoard();
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (r < SIZE && c < SIZE) b[r][c] = ch === "x" ? PLAYER : ch === "o" ? AI : EMPTY;
    });
  });
  return b;
};

describe("luật 5 quân", () => {
  it("bốn quân chưa thắng, năm quân mới thắng", () => {
    const four = board("", "..xxxx");
    expect(checkWin(four, 1, 2, PLAYER)).toBe(false);
    four[1][6] = PLAYER;
    expect(checkWin(four, 1, 6, PLAYER)).toBe(true);
    expect(WIN_LEN).toBe(5);
  });

  it("thắng theo đường chéo", () => {
    const b = emptyBoard();
    for (let i = 0; i < 5; i++) b[i][i] = AI;
    expect(checkWin(b, 4, 4, AI)).toBe(true);
    expect(winningLine(b, 4, 4, AI)).toHaveLength(5);
  });

  it("chuỗi bị đối thủ chặn giữa thì không tính là liền", () => {
    const b = board("", "..xx.xx");
    expect(checkWin(b, 1, 2, PLAYER)).toBe(false);
  });
});

describe("bảng đòn thế", () => {
  it("ba mở đáng giá hơn nhiều so với ba bị bít một đầu", () => {
    const open = board("", ".oo");            // hai đầu trống
    const blocked = board("", "xoo");          // bị bít bên trái
    expect(cellScore(open, 1, 3, AI)).toBeGreaterThan(cellScore(blocked, 1, 3, AI) * 5);
  });

  it("chuỗi bít cả hai đầu không được cộng điểm nào", () => {
    // Cả hai bàn chỉ khác nhau ở chuỗi 'oo' bị 'x' kẹp hai bên; ba hướng còn
    // lại y hệt nhau. Nối dài chuỗi chết KHÔNG được thưởng điểm — nếu có thì AI
    // sẽ đi bồi vào chuỗi không bao giờ thành 5 được.
    const dead = board("", "xoo.x");
    const bare = board("", "x...x");
    expect(cellScore(dead, 1, 3, AI)).toBeLessThanOrEqual(cellScore(bare, 1, 3, AI));
  });
});

describe("AI mức Khó", () => {
  it("thắng ngay khi có bốn quân và một đầu trống", () => {
    const b = board("", "..oooo");
    expect(pickMoveHard(b)).toEqual(expect.arrayContaining([1]));
    const [r, c] = pickMoveHard(b);
    b[r][c] = AI;
    expect(checkWin(b, r, c, AI)).toBe(true);
  });

  it("chặn khi người chơi sắp đủ năm quân", () => {
    // x có 4 quân, hai đầu (1,1) và (1,6) đều trống → phải bít một đầu.
    const b = board("", ".xxxx");
    const [r, c] = pickMoveHard(b);
    expect([[1, 0], [1, 5]]).toContainEqual([r, c]);
  });

  it("ưu tiên thắng của mình hơn là chặn đối thủ", () => {
    // Cả hai bên đều đang có bốn quân: đi trước thì thắng luôn.
    const b = board("", ".oooo", "", ".xxxx");
    const [r, c] = pickMoveHard(b);
    b[r][c] = AI;
    expect(checkWin(b, r, c, AI)).toBe(true);
  });

  it("chặn ba mở thay vì đi lung tung", () => {
    // x có ba quân hai đầu trống — bỏ qua là ván sau thành bốn mở, không cứu được.
    const b = board("", "..xxx");
    const [r, c] = pickMoveHard(b);
    expect(r).toBe(1);
    expect([1, 5]).toContain(c);   // một trong hai đầu của chuỗi
  });

  it("không bao giờ đi vào ô đã có quân", () => {
    const b = board("", "..oox", "...x");
    for (let i = 0; i < 20; i++) {
      const [r, c] = pickMoveHard(b);
      expect(b[r][c]).toBe(EMPTY);
    }
  });
});

describe("ba mức độ", () => {
  it("bàn trống thì đi giữa bàn", () => {
    const mid = Math.floor(SIZE / 2);
    expect(pickMoveMedium(emptyBoard())).toEqual([mid, mid]);
  });

  it("mức Dễ vẫn chặn nước thắng lộ liễu (không phải bù nhìn)", () => {
    const b = board("", ".xxxx");
    const [r, c] = pickMoveEasy(b);
    expect([[1, 0], [1, 5]]).toContainEqual([r, c]);
  });

  it("mọi mức đều trả về ô hợp lệ khi bàn gần đầy", () => {
    const b = emptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) b[r][c] = (r + c) % 2 ? PLAYER : AI;
    }
    b[9][9] = EMPTY;
    for (const pick of [pickMoveEasy, pickMoveMedium, pickMoveHard]) {
      expect(pick(b)).toEqual([9, 9]);
    }
  });
});
