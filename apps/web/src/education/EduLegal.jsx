import { Link } from "react-router-dom";
import { LEGAL, UPDATED } from "./legalText";
import { useEduText } from "./eduText";

/**
 * Điều khoản · Quyền riêng tư · Quy tắc cộng đồng của Education Hugo (/terms, /privacy, /guidelines).
 * Một bản tiếng Anh cho mọi ngôn ngữ giao diện (lang="en" để trình đọc màn hình đọc đúng giọng).
 */
const DOCS = [["terms", "/terms"], ["privacy", "/privacy"], ["guidelines", "/guidelines"]];

export default function EduLegal({ doc }) {
  const { t } = useEduText();
  const page = LEGAL[doc];
  return (
    <article className="edu-page legal" lang="en">
      <nav className="legal-tabs" aria-label={t("common.terms")}>
        {DOCS.map(([key, to]) => <Link key={key} to={to} className={key === doc ? "is-on" : ""} aria-current={key === doc ? "page" : undefined}>{LEGAL[key].title}</Link>)}
      </nav>
      <header>
        <h1 className="edu-page-title">{page.title}</h1>
        <small>Last updated {UPDATED}</small>
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
