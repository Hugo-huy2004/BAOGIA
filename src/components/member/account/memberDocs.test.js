import { describe, it, expect } from "vitest";
import { privilegeSections, conditionSections, rightsAccessSections, joyRulesSections } from "./memberDocs";
import { privilegeSectionsEn, conditionSectionsEn, rightsAccessSectionsEn, joyRulesSectionsEn } from "./memberDocs.en";
import { JOY_INCOME_SOURCES, STUDY_STAGES, EXCHANGE_TAX_RATE } from "../../../../shared/joyPrices.js";
import zh from "../../../i18n/locales/zh/translation.json";
import th from "../../../i18n/locales/th/translation.json";
import ja from "../../../i18n/locales/ja/translation.json";
import ko from "../../../i18n/locales/ko/translation.json";
import id from "../../../i18n/locales/id/translation.json";
import es from "../../../i18n/locales/es/translation.json";
import fr from "../../../i18n/locales/fr/translation.json";

const localizedDocuments = (locale) => locale.memberPortal?.accountHub?.documents?.content;

function documentShape(documents) {
  return Object.fromEntries(Object.entries(documents).map(([docId, document]) => [
    docId,
    document.sections.map((section) => section.blocks.map((block) => ({
      type: block.type,
      rows: block.rows?.map((row) => row.length),
      items: block.items?.length,
    }))),
  ]));
}

// Hai tài liệu dựng từ MembershipFactory: đổi model là văn bản đổi theo. Kiểm
// tra để lỡ ai thêm hạng mà quên là bảng vẫn khớp, và không có block hỏng.
describe("tài liệu thành viên", () => {
  const all = [...privilegeSections(), ...conditionSections(), ...rightsAccessSections()];

  it("mỗi phần có id riêng", () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mọi block đều có type hợp lệ", () => {
    expect(all.flatMap((s) => s.blocks).every((b) => typeof b.type === "string")).toBe(true);
  });

  it("bảng hạng thẻ liệt kê đủ mọi hạng trong model", () => {
    const table = privilegeSections()[0].blocks.find((b) => b.type === "table");
    expect(table.rows).toHaveLength(5);
    expect(table.rows.map((r) => r[0])).toEqual(["MemberShip", "Silver", "Gold", "Diamond", "Premium"]);
  });

  it("tài liệu quyền và truy cập nêu rõ trách nhiệm của cả hai bên", () => {
    const ids = rightsAccessSections().map((section) => section.id);
    expect(ids).toContain("quyen-hugo-studio");
    expect(ids).toContain("nghia-vu-hugo-studio");
    expect(ids).toContain("ranh-gioi-trach-nhiem");
  });

  it("bản tiếng Anh có cùng cấu trúc tài liệu với bản tiếng Việt", () => {
    const vi = [privilegeSections(), conditionSections(), rightsAccessSections()];
    const en = [privilegeSectionsEn(), conditionSectionsEn(), rightsAccessSectionsEn()];

    expect(en.map((group) => group.length)).toEqual(vi.map((group) => group.length));
    en.flat().forEach((section) => {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.blocks.length).toBeGreaterThan(0);
    });
  });

  it("mọi ngôn ngữ được công bố đều có đủ ba tài liệu đã dịch", () => {
    const source = Object.fromEntries(Object.entries({
      privileges: { sections: privilegeSectionsEn() },
      conditions: { sections: conditionSectionsEn() },
      "rights-access": { sections: rightsAccessSectionsEn() },
    }));
    const expectedShape = documentShape(source);

    for (const [code, locale] of Object.entries({ zh, th, ja, ko, id, es, fr })) {
      const documents = localizedDocuments(locale);
      expect(documents, code).toBeTruthy();
      expect(Object.keys(documents).sort(), code).toEqual([
        "conditions", "privileges", "rights-access",
      ]);
      expect(documentShape(documents), code).toEqual(expectedShape);
    }
  });
});

// ── Bảng biểu JOY ──────────────────────────────────────────────────
// Tài liệu này dựng từ `shared/joyPrices.js`. Test canh để giá trong bảng luôn
// là giá THẬT đang thu, và hai bản ngôn ngữ không lệch cấu trúc.
describe("bảng biểu JOY và quy chế", () => {
  const vi = joyRulesSections();
  const en = joyRulesSectionsEn();

  it("có đủ 5 bảng — đây là tài liệu để TRA, không phải bài đọc", () => {
    const tables = vi.flatMap((s) => s.blocks).filter((b) => b.type === "table");
    expect(tables.length).toBeGreaterThanOrEqual(5);
    for (const table of tables) {
      expect(table.head.length, JSON.stringify(table.head)).toBeGreaterThanOrEqual(2);
      expect(table.rows.length).toBeGreaterThan(0);
      // Mọi hàng phải đủ số ô bằng số cột, không thì bảng lệch.
      for (const row of table.rows) expect(row).toHaveLength(table.head.length);
      // DocBlock key hàng theo ô đầu → ô đầu phải khác nhau.
      expect(new Set(table.rows.map((r) => r[0])).size).toBe(table.rows.length);
    }
  });

  it("bản tiếng Anh khớp từng mục, từng hàng với bản tiếng Việt", () => {
    expect(en.map((s) => s.id)).toEqual(vi.map((s) => s.id));
    expect(en.map((s) => s.blocks.map((b) => b.type))).toEqual(vi.map((s) => s.blocks.map((b) => b.type)));
    const rowCounts = (doc) => doc.flatMap((s) => s.blocks.filter((b) => b.type === "table").map((b) => b.rows.length));
    expect(rowCounts(en)).toEqual(rowCounts(vi));
  });

  it("liệt kê đủ mọi nguồn thu và mọi chặng học có trong bảng giá", () => {
    const text = JSON.stringify(vi);
    for (const source of JOY_INCOME_SOURCES) {
      expect(text, source.id).toContain(source.max.toLocaleString("vi-VN"));
    }
    for (const stage of STUDY_STAGES) {
      expect(text, stage.tier).toContain(stage.lifetime.toLocaleString("vi-VN"));
    }
  });

  it("nói rõ JOY không phải tiền và không quy đổi ra tiền mặt", () => {
    expect(JSON.stringify(vi)).toContain("không quy đổi");
    expect(JSON.stringify(en).toLowerCase()).toContain("not a currency");
  });

  it("ghi đúng phí giao dịch đang thu, không phải con số cũ", () => {
    expect(JSON.stringify(vi)).toContain(`${Math.round(EXCHANGE_TAX_RATE * 100)}%`);
  });
});
