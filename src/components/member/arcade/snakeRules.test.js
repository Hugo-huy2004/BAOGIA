import { describe, expect, it } from "vitest";
import { queueTurn, nextTurn } from "./snakeRules";

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
