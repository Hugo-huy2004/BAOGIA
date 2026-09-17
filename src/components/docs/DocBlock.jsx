import { Link } from "react-router-dom";
import SecurityFlowVideo from "../privacy/SecurityFlowVideo";
import SecurityExamplesVideo from "../privacy/SecurityExamplesVideo";
import AgeProtectionCard from "../privacy/AgeProtectionCard";
import GuideArt from "../../pages/public/guideArt";
import CommunicationDiagram from "./CommunicationDiagram";

/**
 * Một khối nội dung tài liệu. Tách khỏi `DocsLayout` để trang chính sách công
 * khai và tài liệu trong tài khoản thành viên dùng CHUNG một bộ kiểu chữ —
 * "viết như policy" nghĩa là đúng cái renderer đó, không phải bản sao trông
 * hao hao rồi trôi mỗi nơi một kiểu.
 *
 * Các loại block: p | list | steps | table | note | figure | faq | code |
 * external-links | cards | diagram | security-flow | security-examples | age-card.
 */
export default function DocBlock({ block }) {
  if (block.type === "diagram") {
    return <CommunicationDiagram flow={block.flow} />;
  }

  if (block.type === "cards") {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {block.items.map((item) => {
          const hasLink = Boolean(item.href);
          const isInternalLink = hasLink && !item.href.startsWith("http") && !item.href.startsWith("#");
          const Tag = isInternalLink ? Link : hasLink ? "a" : "div";
          const props = isInternalLink
            ? { to: item.href }
            : hasLink
              ? {
                  href: item.href,
                  ...(item.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                }
              : {};
          return (
            <Tag
              key={item.title}
              {...props}
              className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card p-4.5 transition-all duration-200 ${
                hasLink
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                  : "hover:border-border"
              }`}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">{item.icon || "arrow_forward"}</span>
                </div>
                <h3 className="mt-3 text-[14.5px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
              {item.badge && (
                <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-2.5 text-[11.5px] font-semibold text-primary">
                  <span>{item.badge}</span>
                  {hasLink && (
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                  )}
                </div>
              )}
            </Tag>
          );
        })}
      </div>
    );
  }

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
      <div className="overflow-hidden rounded-2xl border border-border bg-[#111218] text-white shadow-sm">
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
    return <p className="text-[15px] leading-relaxed text-muted-foreground">{block.text}</p>;
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-2.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "steps") {
    return (
      <ol className="space-y-3">
        {block.items.map((item, index) => (
          <li key={item} className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/25 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <span className="min-w-0 pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "table") {
    const wide = (block.head?.length || 0) > 2;
    return (
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card/50 shadow-xs">
        <table className={`w-full border-collapse text-left text-[13.5px] ${wide ? "min-w-[34rem]" : ""}`}>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {block.head.map((cell) => (
                <th key={cell} scope="col" className="px-3.5 py-3 font-bold tracking-tight text-foreground">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {block.rows.map((row) => (
              <tr key={row[0]} className="transition-colors hover:bg-muted/30 align-top">
                {row.map((cell, index) => (
                  <td key={index} className="px-3.5 py-3 leading-relaxed text-muted-foreground">{cell}</td>
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
      <figure className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="px-3 pt-3 sm:px-5 sm:pt-5">
          <GuideArt kind={block.art} />
        </div>
        {block.caption && (
          <figcaption className="border-t border-border/80 bg-muted/20 px-4 py-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "faq") {
    return (
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/60 shadow-xs">
        {block.items.map((item) => (
          <details key={item.q} className="group transition-colors hover:bg-muted/20">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4.5 py-3.5 text-[14.5px] font-semibold text-foreground">
              {item.q}
              <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">
                expand_more
              </span>
            </summary>
            <p className="px-4.5 pb-4 pt-1 text-[13.5px] leading-relaxed text-muted-foreground border-t border-border/40 bg-muted/10">{item.a}</p>
          </details>
        ))}
      </div>
    );
  }

  if (block.type === "note") {
    const isWarn = ["warn", "warning"].includes(block.tone);
    const isDanger = block.tone === "danger";
    const isSuccess = ["success", "tip", "verified"].includes(block.tone);

    const styleClass = isDanger
      ? "border-rose-500/30 bg-rose-500/[0.08] text-rose-950 dark:text-rose-200"
      : isWarn
        ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-950 dark:text-amber-200"
        : isSuccess
          ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-950 dark:text-emerald-200"
          : "border-blue-500/30 bg-blue-500/[0.08] text-blue-950 dark:text-blue-200";

    const iconName = isDanger ? "gavel" : isWarn ? "warning" : isSuccess ? "check_circle" : "info";

    return (
      <div className={`rounded-2xl border p-4.5 backdrop-blur-xs shadow-xs ${styleClass}`}>
        <p className="flex items-center gap-2 text-[14.5px] font-bold text-foreground">
          <span className="material-symbols-outlined text-[19px] shrink-0" aria-hidden="true">{iconName}</span>
          {block.title}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{block.text}</p>
      </div>
    );
  }

  return null;
}
