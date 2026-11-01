import { Link } from "react-router-dom";
import { UPDATED, UPDATED_LABEL, legalFor } from "./legalText";
import { useEduText } from "./eduText";

/**
 * Điều khoản · Quyền riêng tư · Quy tắc cộng đồng của Education Hugo (/terms, /privacy, /guidelines).
 * Ba bản vi/en/zh — giao diện ngôn ngữ nào hiện bản đó (lang đúng để trình đọc màn hình đọc đúng giọng).
 */
const LEGAL_LANGS = ["vi", "en", "zh"];
const DOCS = [["terms", "/terms"], ["privacy", "/privacy"], ["guidelines", "/guidelines"]];

export default function EduLegal({ doc }) {
  const { t, lang } = useEduText();
  const LEGAL = legalFor(lang);
  const page = LEGAL[doc];
  const code = LEGAL_LANGS.includes(lang) ? lang : "en";
  return (
    <article className="edu-page legal" lang={code === "zh" ? "zh-Hans" : code}>
      <nav className="legal-tabs" aria-label={t("common.terms")}>
        {DOCS.map(([key, to]) => <Link key={key} to={to} className={key === doc ? "is-on" : ""} aria-current={key === doc ? "page" : undefined}>{LEGAL[key].title}</Link>)}
      </nav>
      <header>
        <h1 className="edu-page-title">{page.title}</h1>
        <small>{UPDATED_LABEL[code]} {UPDATED[code]}</small>
        <p className="legal-lead">{page.lead}</p>
      </header>
      <ol className="legal-toc">
        {page.sections.map((section, i) => <li key={section.h}><a href={`#s${i}`}>{section.h}</a></li>)}
      </ol>
      {page.sections.map((section, i) => (
        <section key={section.h} id={`s${i}`}>
          <h2>{section.h}</h2>
          {section.p?.slice(0, section.list ? 1 : undefined).map((text) => <p key={text.slice(0, 40)}>{text}</p>)}
          {section.list && <ul>{section.list.map((item) => <li key={item.slice(0, 40)}>{item}</li>)}</ul>}
          {section.list && section.p?.slice(1).map((text) => <p key={text.slice(0, 40)}>{text}</p>)}
        </section>
      ))}
    </article>
  );
}
