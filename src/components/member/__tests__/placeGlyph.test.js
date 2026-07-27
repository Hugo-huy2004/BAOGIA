import { describe, it, expect } from "vitest";
import { placeGlyph } from "../DiscoveryMap";

// Bảng regex đoán món từ tên quán là chỗ dễ vỡ nhất của pin bản đồ: thêm một
// dòng sai thứ tự là "Trà sữa Phở Cồ" ra tô phở. Test khoá đúng các ca đó.
describe("placeGlyph", () => {
  it("đoán món từ tên quán tiếng Việt (có và không dấu)", () => {
    expect(placeGlyph("Phở Thìn Bờ Hồ", "food")).toBe("🍜");
    expect(placeGlyph("Pho Le", "food")).toBe("🍜");
    expect(placeGlyph("Bún Bò Huế O Xuân", "food")).toBe("🍜");
    expect(placeGlyph("Cơm Tấm Sài Gòn", "food")).toBe("🍚");
    expect(placeGlyph("Bánh Mì Huỳnh Hoa", "food")).toBe("🥖");
    expect(placeGlyph("Lẩu Dê 404", "food")).toBe("🍲");
    expect(placeGlyph("Ốc Đào", "food")).toBe("🦐");
    expect(placeGlyph("Gà Rán KFC", "food")).toBe("🍗");
  });

  it("trà sữa thắng các luật món ăn khác", () => {
    // "Trà sữa" đứng trước trong bảng — tên có cả hai vẫn phải ra ly trà sữa.
    expect(placeGlyph("Trà Sữa Phở Cồ", "food")).toBe("🧋");
    expect(placeGlyph("Gong Cha", "cafe")).toBe("🧋");
  });

  it("về mặc định theo nhóm khi tên không gợi món", () => {
    expect(placeGlyph("Quán Số 7", "food")).toBe("🍽️");
    expect(placeGlyph("The Coffee House", "cafe")).toBe("☕");
    expect(placeGlyph("Sân bóng Chảo Lửa", "play")).toBe("🎮");
    expect(placeGlyph("", undefined)).toBe("📍");
  });

  it("không đoán món cho nhóm không phải ăn uống", () => {
    // "play" có chữ "bia" trong tên vẫn là chỗ chơi, không phải quán nhậu.
    expect(placeGlyph("Bia Club Bowling", "play")).toBe("🎮");
  });
});
