import { describe, expect, it } from "vitest";
import { psychologyGate, isMinorMember } from "./memberAge";

const born = (year) => ({ birthYear: year, birthMonth: 1 });
const adult = born(new Date().getFullYear() - 30);
const minor = born(new Date().getFullYear() - 15);

describe("psychologyGate", () => {
  it("mở cho người dùng tiếng Việt đã trưởng thành", () => {
    expect(psychologyGate("vi", adult)).toBe("open");
    expect(psychologyGate("vi-VN", adult)).toBe("open");
    expect(psychologyGate(undefined, adult)).toBe("open");   // chưa đặt = tiếng Việt
  });

  it("chặn theo ngôn ngữ ở mọi thứ tiếng khác", () => {
    for (const lang of ["en", "es", "fr", "id", "ja", "ko", "th", "zh", "en-US"]) {
      expect(psychologyGate(lang, adult), lang).toBe("language");
    }
  });

  it("ngôn ngữ chặn TRƯỚC tuổi — màn báo tuổi viết bằng tiếng Việt, người nước ngoài đọc không hiểu", () => {
    expect(psychologyGate("ja", minor)).toBe("language");
    expect(psychologyGate("vi", minor)).toBe("minor");
  });

  it("thiếu ngày sinh thì không bị coi là trẻ vị thành niên", () => {
    expect(isMinorMember({})).toBe(false);
    expect(psychologyGate("vi", {})).toBe("open");
  });
});
