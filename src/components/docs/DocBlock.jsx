import SecurityFlowVideo from "../privacy/SecurityFlowVideo";
import SecurityExamplesVideo from "../privacy/SecurityExamplesVideo";
import AgeProtectionCard from "../privacy/AgeProtectionCard";
import GuideArt from "../../pages/public/guideArt";

/**
 * Một khối nội dung tài liệu. Tách khỏi `DocsLayout` để trang chính sách công
 * khai và tài liệu trong tài khoản thành viên dùng CHUNG một bộ kiểu chữ —
 * "viết như policy" nghĩa là đúng cái renderer đó, không phải bản sao trông
 * hao hao rồi trôi mỗi nơi một kiểu.
 *
 * Các loại block: p | list | steps | table | note | figure | faq | code |
 * external-links | security-flow | security-examples | age-card.
 */
export default function DocBlock({ block }) {
  if (block.type === "security-flow") {
    return <SecurityFlowVideo />;
  }

  if (block.type === "security-examples") {
    return <SecurityExamplesVideo />;
  }

  if (block.type === "age-card") {
    return <AgeProtectionCard />;
  }

  if (block.type === "external-links") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {block.items.map((item) => (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            <span>{item.label}</span>
            <span className="material-symbols-outlined text-lg text-muted-foreground" aria-hidden="true">open_in_new</span>
          </a>
        ))}
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-[#111218] text-white">
        {block.title && (
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-bold text-white/80">
            <span className="material-symbols-outlined text-base" aria-hidden="true">code</span>
            {block.title}
          </div>
        )}
        <pre className="overflow-x-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[11px] leading-6 text-white/85 sm:text-xs"><code>{block.code}</code></pre>
        {block.text && <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-white/60">{block.text}</p>}
      </div>
    );
  }

  if (block.type === "p") {
    return <p className="text-base leading-relaxed text-muted-foreground">{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-base leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "steps") {
    return (
      <ol className="space-y-2">
        {block.items.map((item, index) => (
          <li key={item} className="flex gap-2.5 text-base leading-relaxed text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "table") {
    // Bảng ba cột trở lên cần chiều rộng tối thiểu, không thì chữ dồn thành cột
    // một ký tự. Bảng hai cột thì KHÔNG — ép 34rem là bắt người đọc trên điện
    // thoại kéo ngang một bảng vốn vừa màn.
    const wide = (block.head?.length || 0) > 2;
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className={`w-full border-collapse text-left text-sm ${wide ? "min-w-[34rem]" : ""}`}>
          <thead>
            <tr className="bg-muted/60">
              {block.head.map((cell) => (
                <th key={cell} scope="col" className="px-3 py-2.5 font-semibold text-foreground">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row[0]} className="border-t border-border align-top">
                {row.map((cell, index) => (
                  <td key={index} className="px-3 py-2.5 leading-relaxed text-muted-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "figure") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-3 pt-3 sm:px-5 sm:pt-5">
          <GuideArt kind={block.art} />
        </div>
        {block.caption && (
          <figcaption className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "faq") {
    return (
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {block.items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
              {item.q}
              <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">
                expand_more
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    );
  }

  if (block.type === "note") {
    const warn = ["warn", "warning"].includes(block.tone);
    const danger = block.tone === "danger";
    return (
      <div className={`rounded-xl border p-4 ${
        danger
          ? "border-destructive/40 bg-destructive/[0.07]"
          : warn
            ? "border-amber-500/40 bg-amber-500/[0.07]"
            : "border-border bg-card"
      }`}>
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{danger ? "gavel" : warn ? "warning" : "info"}</span>
          {block.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{block.text}</p>
      </div>
    );
  }

  return null;
}
