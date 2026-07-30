import { describe, expect, it } from "vitest";
import { givenName } from "./memberName";

describe("givenName", () => {
  it("giữ đúng tên gọi của người Việt khi chuyển giao diện sang tiếng Anh", () => {
    expect(givenName("Lê Quốc Huy", "en")).toBe("Huy");
    expect(givenName("Nguyen Van An", "en")).toBe("An");
  });

  it("dùng tên đầu tiên cho tên phương Tây ở giao diện tiếng Anh", () => {
    expect(givenName("John Smith", "en")).toBe("John");
  });

  it("dùng từ cuối cho giao diện tiếng Việt", () => {
    expect(givenName("John Smith", "vi")).toBe("Smith");
  });
});
