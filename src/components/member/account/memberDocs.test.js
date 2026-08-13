import { describe, it, expect } from "vitest";
import { privilegeSections, conditionSections, rightsAccessSections } from "./memberDocs";
import { privilegeSectionsEn, conditionSectionsEn, rightsAccessSectionsEn } from "./memberDocs.en";
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
