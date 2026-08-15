import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EditionMark from "./EditionMark";
import { EDITION_OUTLINES } from "./editionOutlines";
import { EDITION_FLAGS, EDITION_IDENTITY } from "./editionFlags";
import { ENGLISH_COUNTRIES, ENGLISH_WORLD } from "./englishCountries";
import { SUPPORTED_LANGUAGES } from "../../../i18n/languages";

const CODES = SUPPORTED_LANGUAGES.map(({ code }) => code);
// zh có component riêng (đường viền vẽ tay), en không có cờ và không có nước
// đại diện — cả hai không đi qua bảng dữ liệu chung.
const FLAG_EDITIONS = CODES.filter((code) => code !== "zh" && code !== "en");

describe("EditionMark", () => {
  it("mọi ngôn ngữ của app đều có dấu ấn bản riêng", () => {
    for (const code of CODES) {
      const svg = renderToStaticMarkup(<EditionMark language={code} />);
      expect(svg, `${code} không dựng được dấu ấn bản`).toContain("<svg");
      expect(svg, `${code} thiếu quốc hiệu`).toContain("figcaption");
    }
  });

  it("cờ luôn bị cắt theo hình đất nước, không tràn ra ngoài", () => {
    for (const code of FLAG_EDITIONS) {
      const svg = renderToStaticMarkup(<EditionMark language={code} />);
      expect(svg, `${code} thiếu clipPath`).toContain(`edition-clip-${code}`);
      expect(svg).toContain(`clip-path="url(#edition-clip-${code})"`);
    }
  });

  it("mỗi nước có đủ bản đồ, cờ và quốc hiệu bằng tiếng của họ", () => {
    for (const code of FLAG_EDITIONS) {
      expect(EDITION_OUTLINES[code]?.d, `${code} thiếu bản đồ`).toMatch(/^M/);
      expect(typeof EDITION_FLAGS[code], `${code} thiếu cờ`).toBe("function");
      expect(EDITION_IDENTITY[code]?.name?.length, `${code} thiếu quốc hiệu`).toBeGreaterThan(2);
      expect(EDITION_IDENTITY[code].accent).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("ấn bản tiếng Anh không treo cờ và không lấy nước nào ra đại diện", () => {
    const svg = renderToStaticMarkup(<EditionMark language="en" />);
    // Không có bảng cờ, không có bản đồ riêng cho en, không màu cờ Mỹ.
    expect(EDITION_FLAGS.en).toBeUndefined();
    expect(EDITION_OUTLINES.en).toBeUndefined();
    expect(EDITION_IDENTITY.en).toBeUndefined();
    for (const usFlagColor of ["#B22234", "#3C3B6E"]) {
      expect(svg, `còn màu cờ Mỹ ${usFlagColor}`).not.toContain(usFlagColor);
    }
    // Quốc hiệu ghi UK + số nước còn lại, số lấy từ danh sách nên không lệch.
    expect(svg).toContain("United Kingdom");
    expect(svg).toContain(`${ENGLISH_COUNTRIES.length - 1} countries sharing English`);
    // Bản đồ thế giới phải nằm ngang (rộng hơn cao) chứ không phải hình một nước.
    const [, , w, h] = ENGLISH_WORLD.viewBox.split(" ").map(Number);
    expect(w).toBeGreaterThan(h);
    expect(ENGLISH_WORLD.parts).toBeGreaterThan(20);
  });

  it("khung bản đồ đúng tỉ lệ nước đó, không bị bóp méo", () => {
    // Việt Nam cao gấp đôi bề ngang, Mỹ thì ngược lại. Nếu phép chiếu trong
    // scripts/generate-edition-outlines.mjs sai thì hai số này sẽ xấp xỉ nhau.
    const ratio = (code) => {
      const [, , w, h] = EDITION_OUTLINES[code].viewBox.split(" ").map(Number);
      return h / w;
    };
    expect(ratio("vi")).toBeGreaterThan(1.6);
    
    expect(ratio("id")).toBeLessThan(0.5);
  });

  it("biểu tượng nằm trong phần đất, không rơi ra biển", () => {
    // Sao vàng của Việt Nam phải ở đồng bằng Bắc Bộ (1/4 trên), không phải giữa
    // khung — giữa khung là khúc eo miền Trung, sao sẽ bị cắt gần hết.
    const svg = renderToStaticMarkup(<EditionMark language="vi" />);
    const [, , , height] = EDITION_OUTLINES.vi.viewBox.split(" ").map(Number);
    const starY = Number(svg.match(/<path d="M[\d.]+ ([\d.]+)L/)?.[1]);
    expect(starY).toBeLessThan(height * 0.25);
  });

  it("ấn bản tiếng Anh chạy danh sách mọi nước nói tiếng Anh", () => {
    const svg = renderToStaticMarkup(<EditionMark language="en" />);
    expect(ENGLISH_COUNTRIES.length).toBeGreaterThan(50);
    for (const country of ["Australia", "India", "Nigeria", "Ireland", "New Zealand"]) {
      expect(svg, `thiếu ${country}`).toContain(country);
    }
    // Nhân đôi để băng chạy không có mối nối, bản thứ hai ẩn với trình đọc.
    expect(svg.split("today-edition-ribbon__run").length - 1).toBe(2);
    expect(svg).toContain('aria-hidden="true"');
  });

  it("chỉ ấn bản tiếng Anh mới có băng chuyền", () => {
    for (const code of FLAG_EDITIONS) {
      expect(renderToStaticMarkup(<EditionMark language={code} />)).not.toContain("today-edition-ribbon");
    }
  });

  it("ngôn ngữ lạ thì không dựng gì, không nổ", () => {
    expect(renderToStaticMarkup(<EditionMark language="xx" />)).toBe("");
  });
});
