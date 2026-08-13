import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { chooseBotMove, evaluate } from "./chessAi";

const at = (fen) => new Chess(fen);

describe("evaluate", () => {
  it("thế cục đầu ván là cân bằng", () => {
    expect(evaluate(new Chess())).toBe(0);
  });

  it("điểm tính theo góc nhìn bên đang đi", () => {
    // Trắng hơn hẳn một hậu. Cùng một thế, trắng đi thì dương, đen đi thì âm.
    const whiteToMove = at("4k3/8/8/8/8/8/8/3QK3 w - - 0 1");
    const blackToMove = at("4k3/8/8/8/8/8/8/3QK3 b - - 0 1");
    expect(evaluate(whiteToMove)).toBeGreaterThan(500);
    expect(evaluate(blackToMove)).toBeLessThan(-500);
  });
});

describe("chooseBotMove", () => {
  it("tìm ra chiếu hết trong một nước", () => {
    // Chiếu hết hàng cuối: Ra8#. Vua đen g8 bị chính ba quân tốt của mình bịt
    // đường lên, hai ô f8/h8 đều nằm trên hàng 8 mà xe vừa chiếm.
    const chess = at("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1");
    const move = chooseBotMove(chess, 3);
    chess.move(move);
    expect(chess.isCheckmate()).toBe(true);
  });

  it("ăn quân miễn phí", () => {
    // Hậu đen ở d5 không ai bảo vệ, hậu trắng ở d1 ăn được.
    const chess = at("4k3/8/8/3q4/8/8/8/3QK3 w - - 0 1");
    const move = chooseBotMove(chess, 2);
    expect(move.to).toBe("d5");
    expect(move.captured).toBe("q");
  });

  it("KHÔNG treo hậu để ăn tốt (lỗi của bot cũ)", () => {
    // Tốt b7 đang được vua c8... không: tốt b7 do vua c8 bảo vệ. Hậu trắng ăn
    // b7 thì bị vua ăn lại — bot cũ vẫn ăn vì nó chỉ đếm nước ăn đầu tiên.
    const chess = at("2k5/1p6/8/8/8/8/8/3QK3 w - - 0 1");
    const move = chooseBotMove(chess, 2);
    expect(move.to).not.toBe("b7");
  });

  it("phong cấp thành hậu khi có cơ hội", () => {
    const chess = at("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
    const move = chooseBotMove(chess, 2);
    expect(move.promotion).toBe("q");
  });

  it("thoát khỏi nước chiếu bằng nước hợp lệ", () => {
    const chess = at("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");
    const move = chooseBotMove(chess, 2);
    expect(move).toBeTruthy();
    expect(() => chess.move(move)).not.toThrow();
    expect(chess.inCheck()).toBe(false);
  });

  it("không làm thay đổi ván truyền vào", () => {
    const chess = new Chess();
    const before = chess.fen();
    chooseBotMove(chess, 3);
    expect(chess.fen()).toBe(before);
  });

  it("mọi cấp đều trả nước hợp lệ ở thế cục thật", () => {
    // Dựng thế bằng cách đi từ đầu ván — chắc chắn là thế cục hợp lệ.
    const opening = new Chess();
    ["e4", "e5", "Nf3", "Nc6", "Bb5"].forEach((san) => opening.move(san));
    const fen = opening.fen();
    for (const level of [1, 2, 3]) {
      const chess = at(fen);
      const legal = chess.moves({ verbose: true }).map((m) => m.lan);
      expect(legal, `cấp ${level}`).toContain(chooseBotMove(chess, level).lan);
    }
  });

  it("cấp 3 phải đủ nhanh cho một nước trên điện thoại", () => {
    const started = Date.now();
    chooseBotMove(new Chess(), 3);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});
