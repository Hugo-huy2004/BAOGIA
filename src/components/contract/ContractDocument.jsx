import "./contractDocument.css";

/**
 * Hợp đồng dạng văn bản chính thức — dựng từ buildContract() (shared/projectContract.js).
 * Trình bày theo lối học thuật: điều khoản đánh số, phụ lục có bảng, danh mục
 * tài liệu tham chiếu kiểu Harvard ở cuối. Tải PDF = in từ trình duyệt; CSS in
 * chỉ giữ lại khối `.contract-print`.
 */

function Table({ columns, rows, totals }) {
  if (!rows?.length && !totals?.length) return <p className="contract-empty">—</p>;
  return (
    <div className="contract-table-wrap">
      <table className="contract-table">
        <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}
        </tbody>
        {totals?.length ? (
          <tfoot>
            {totals.map(([k, v]) => (
              <tr key={k}><td colSpan={columns.length - 1}>{k}</td><td>{v}</td></tr>
            ))}
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

const Facts = ({ rows }) => (
  <dl className="contract-facts">
    {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
  </dl>
);

export default function ContractDocument({ contract }) {
  if (!contract) return null;
  return (
    <article className="contract-print contract-doc" lang={contract.lang}>
      <header className="contract-head">
        <p className="contract-brand">Hugo Studio</p>
        <h1>{contract.title}</h1>
        <Facts rows={contract.meta} />
      </header>

      {contract.termination ? (
        <section className="contract-termination">
          <h2>{contract.termination.heading}</h2>
          <Facts rows={contract.termination.rows} />
        </section>
      ) : null}

      <section className="contract-parties">
        {contract.parties.map((p) => (
          <div key={p.heading}><h2>{p.heading}</h2><Facts rows={p.rows} /></div>
        ))}
      </section>

      <section>
        <h2>{contract.bases.heading}</h2>
        <ul className="contract-list">{contract.bases.items.map((b) => <li key={b}>{b}</li>)}</ul>
      </section>

      {contract.articles.map((a) => (
        <section key={a.no} className="contract-article">
          <h3>{contract.lang === "vi" ? `Điều ${a.no}.` : `Article ${a.no}.`} {a.title}</h3>
          <ol>{a.paras.map((p, i) => <li key={i}>{p}</li>)}</ol>
        </section>
      ))}

      {contract.schedules.map((s) => (
        <section key={s.id} className="contract-schedule">
          <h2>{s.title}</h2>
          {s.facts ? <Facts rows={s.facts} /> : null}
          <Table columns={s.columns} rows={s.rows} totals={s.totals} />
          {[s.sub, ...(s.subs || [])].filter(Boolean).map((x, i) => (
            <div key={i}>
              {x.caption ? <h4 className="contract-caption">{x.caption}</h4> : null}
              <Table columns={x.columns} rows={x.rows} />
            </div>
          ))}
        </section>
      ))}

      <section className="contract-references">
        <h2>{contract.references.heading}</h2>
        <ul>{contract.references.items.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
    </article>
  );
}
