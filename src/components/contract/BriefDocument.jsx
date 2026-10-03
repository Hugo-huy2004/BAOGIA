import "./contractDocument.css";

/**
 * Bảng yêu cầu dự án dạng trang A4 — dựng từ buildBrief() (shared/projectBrief.js).
 * Dùng chung kiểu chữ và CSS in của hợp đồng: bấm In là ra đúng khổ A4.
 */
export default function BriefDocument({ brief, printLabel = "In / lưu PDF" }) {
  if (!brief) return null;
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={() => window.print()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold">
          <span aria-hidden className="material-symbols-outlined text-[18px]">print</span>{printLabel}
        </button>
      </div>
      <article className="contract-print contract-doc contract-a4" lang="vi">
        <header className="contract-head">
          <p className="contract-brand">Hugo Studio</p>
          <h1>{brief.title}</h1>
          <dl className="contract-facts">
            {brief.meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </header>
        {brief.sections.map((s, i) => (
          <section key={s.id} className="contract-article">
            <h2>{i + 1}. {s.title}</h2>
            <div className="contract-table-wrap">
              <table className="contract-table contract-qa">
                <tbody>{s.rows.map(([q, a]) => <tr key={q}><th scope="row">{q}</th><td>{a}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        ))}
        {!brief.sections.length ? <p className="contract-empty">—</p> : null}
      </article>
    </div>
  );
}
