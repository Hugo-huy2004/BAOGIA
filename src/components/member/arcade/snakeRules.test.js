import { describe, expect, it } from "vitest";
import { queueTurn, nextTurn, reachableCells, pickReachableCell } from "./snakeRules";

const R = { x: 1, y: 0 };
const L = { x: -1, y: 0 };
const U = { x: 0, y: -1 };
const D = { x: 0, y: 1 };

describe("queueTurn", () => {
  it("nhận hai cú rẽ nhanh trong cùng một nhịp", () => {
    const q = [];
    queueTurn(q, U, R);   // đang chạy phải → rẽ lên
    queueTurn(q, L, R);   // rồi rẽ trái: hợp lệ SO VỚI "lên", phải giữ lại
    expect(q).toEqual([U, L]);
  });

  it("bỏ cú quay đầu 180°", () => {
    expect(queueTurn([], L, R)).toEqual([]);
    const q = [U];
    queueTurn(q, D, R);   // ngược với "lên" vừa xếp
    expect(q).toEqual([U]);
  });

  it("bỏ cú trùng hướng, không làm đầy hàng chờ vô ích", () => {
    const q = [];
    queueTurn(q, R, R);
    queueTurn(q, U, R);
    queueTurn(q, U, R);
    expect(q).toEqual([U]);
  });

  it("không xếp quá 2 hướng", () => {
    const q = [];
    queueTurn(q, U, R);
    queueTurn(q, L, R);
    queueTurn(q, D, R);
    expect(q).toHaveLength(2);
  });
});

describe("nextTurn", () => {
  it("lấy từng hướng một, hết hàng thì đi thẳng", () => {
    const q = [U, L];
    expect(nextTurn(q, R)).toBe(U);
    expect(nextTurn(q, U)).toBe(L);
    expect(nextTurn(q, L)).toBe(L);   // hàng rỗng → giữ hướng đang đi
  });
});

describe("vùng rắn tới được", () => {
  // Bàn 5×5, thân rắn cắt ngang hàng giữa: nửa dưới bị chặn hoàn toàn.
  //   . . . . .
  //   . . . . .
  //   x x x x x   ← thân rắn (hàng y=2)
  //   . . . . .
  //   . . . . .
  const wall = [0, 1, 2, 3, 4].map((x) => ({ x, y: 2 }));
  const head = { x: 0, y: 1 };

  it("không tính vùng bị thân rắn quây kín", () => {
    const reach = reachableCells({ grid: 5, head, blocked: wall });
    expect(reach.has("0,0")).toBe(true);    // nửa trên: tới được
    expect(reach.has("4,1")).toBe(true);
    expect(reach.has("0,3")).toBe(false);   // nửa dưới: bị chặn
    expect(reach.has("2,4")).toBe(false);
    expect(reach.has("2,2")).toBe(false);   // chính ô thân rắn
  });

  it("cổng dịch chuyển nối lại vùng bên kia", () => {
    // Đặt một cổng ở nửa trên, cổng kia ở nửa dưới.
    const reach = reachableCells({
      grid: 5, head, blocked: wall,
      portals: [{ x: 4, y: 1 }, { x: 4, y: 3 }],
    });
    expect(reach.has("4,3")).toBe(true);    // ra ở cổng dưới
    expect(reach.has("0,3")).toBe(true);    // rồi đi khắp nửa dưới
  });

  it("mồi luôn rơi vào vùng tới được, không rơi vào ô đã có gì", () => {
    const food = { x: 1, y: 0 };
    for (let i = 0; i < 30; i++) {
      const cell = pickReachableCell({ grid: 5, head, blocked: wall, avoid: [food] });
      expect(cell.y).toBeLessThan(2);                      // luôn ở nửa trên
      expect(`${cell.x},${cell.y}`).not.toBe("1,0");       // không trùng mồi cũ
    }
  });

  it("kín hết đường thì trả null để người gọi tự xử", () => {
    // Đầu rắn bị vây bốn phía.
    const boxed = pickReachableCell({
      grid: 5, head: { x: 0, y: 0 },
      blocked: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    });
    expect(boxed).toBeNull();
  });
});
