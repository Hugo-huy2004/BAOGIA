import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import DocBlock from "../../docs/DocBlock";
import { MEMBER_DOCS } from "./memberDocs";
import { MEMBER_DOCS_EN } from "./memberDocs.en";
import { languageCode } from "../../../i18n/languages";
import { LEGAL_FULL_TEXT, LEGAL_LANGUAGES } from "./legalFullText";

const PEACE_NOTICE = {
  zh: "若发现任何破坏和平、挑起西沙群岛与南沙群岛争端的迹象，我们有权全面收回该账户。",
  en: "We reserve the right to revoke an account in full if we identify signs of undermining peace or of stirring disputes over the Paracel and Spratly Islands.",
};

/**
 * Đọc một tài liệu thành viên trong sheet Tài khoản. Dùng đúng `DocBlock` của
 * trang chính sách công khai nên chữ nghĩa, bảng biểu và hộp lưu ý y hệt.
 */
/**
 * Bản hợp nhất: chín ngôn ngữ nối tiếp nhau trong cùng một tài liệu, không phụ
 * thuộc ngôn ngữ đang chọn. Người đọc cuộn thẳng tới khối tiếng của mình, và
 * bản dịch nào cũng nằm cạnh bản gốc để đối chiếu.
 */
function FullTextDocument() {
  return (
    <article className="space-y-12">
      {LEGAL_LANGUAGES.map(({ code, name, htmlLang }) => {
        const doc = LEGAL_FULL_TEXT[code];
        if (!doc) return null;
        return (
          <section key={code} id={`legal-${code}`} lang={htmlLang} className="scroll-mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{name}</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-foreground">{doc.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{doc.intro}</p>
            <div className="mt-6 space-y-7">
              {doc.sections.map((section) => (
                <section key={section.id} id={`legal-${code}-${section.id}`}>
                  <h3 className="text-[15px] font-bold tracking-[-0.01em] text-foreground">{section.title}</h3>
                  <ul className="mt-2.5 space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                        <span className="mt-[0.45em] size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}

export default function MemberDocReader({ docId }) {
  const { i18n } = useTranslation();
  const activeLanguage = languageCode(i18n.resolvedLanguage || i18n.language);
  const doc = useMemo(() => {
    if (docId === "full-text") return null;
    if (activeLanguage === "vi") return MEMBER_DOCS[docId];
    if (activeLanguage === "en") return MEMBER_DOCS_EN[docId];

    // The full locale bundle is loaded before Member Portal renders. Legal
    // documents live in that same bundle so changing the account language
    // updates headings, tables, notices and body copy as one atomic unit.
    const localizedDocuments = i18n
      .getResourceBundle(activeLanguage, "translation")
      ?.memberPortal?.accountHub?.documents?.content;
    return localizedDocuments?.[docId] || MEMBER_DOCS_EN[docId];
  }, [activeLanguage, docId, i18n]);
  const sections = useMemo(() => {
    if (!doc) return [];
    return typeof doc.sections === "function" ? doc.sections() : (doc.sections || []);
  }, [doc]);
  if (docId === "full-text") return <FullTextDocument />;
  if (!doc) return null;

  return (
    <article className="space-y-8">
      {sections.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-4">
          <h2 className="flex items-baseline gap-2.5 text-lg font-bold tracking-[-0.02em] text-foreground">
            <span className="text-sm tabular-nums text-muted-foreground">{index + 1}</span>
            {section.title}
          </h2>
          <div className="mt-3 space-y-4">
            {section.blocks.map((block, i) => (
              <DocBlock key={i} block={block} />
            ))}
          </div>
        </section>
      ))}

      {/* Chinese edition only. The notice is fixed bilingual copy, not a
          translated string: both halves must read identically for every
          reader, so it never goes through the locale bundle. */}
      {activeLanguage === "zh" && (
        <aside className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground">
          <p lang="zh-CN">{PEACE_NOTICE.zh}</p>
          <p lang="en" className="mt-2">{PEACE_NOTICE.en}</p>
        </aside>
      )}
    </article>
  );
}
