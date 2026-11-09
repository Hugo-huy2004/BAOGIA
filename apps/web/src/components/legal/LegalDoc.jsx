import { useTranslation } from "react-i18next";
import { legalDoc, LEGAL_UPDATED } from "../../content/legal";

const UPDATED_LABEL = { vi: "Cập nhật", en: "Updated", zh: "更新" };

/** Một văn bản pháp lý — dùng chung cho trang công khai và Cài đặt thành viên. */
export default function LegalDoc({ kind, headingLevel = 1 }) {
  const { i18n } = useTranslation();
  const lang = String(i18n.resolvedLanguage || i18n.language || "vi").slice(0, 2);
  const doc = legalDoc(kind, lang);
  const Title = `h${headingLevel}`;
  const Section = `h${headingLevel + 1}`;

  return (
    <article className="text-foreground">
      <Title className="text-3xl font-semibold tracking-tight sm:text-4xl">{doc.title}</Title>
      <p className="mt-2 text-sm text-muted-foreground">
        {UPDATED_LABEL[lang] || UPDATED_LABEL.vi}: <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED.split("-").reverse().join("/")}</time>
      </p>
      <p className="mt-6 text-base leading-7">{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.h} className="mt-8">
          <Section className="text-lg font-semibold">{s.h}</Section>
          {s.p?.map((text) => <p key={text} className="mt-3 text-base leading-7 text-muted-foreground">{text}</p>)}
          {s.li && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground">
              {s.li.map((text) => <li key={text}>{text}</li>)}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
