import { Link } from "react-router-dom";
import SecurityFlowVideo from "../privacy/SecurityFlowVideo";
import SecurityExamplesVideo from "../privacy/SecurityExamplesVideo";
import AgeProtectionCard from "../privacy/AgeProtectionCard";
import GuideArt from "../../pages/public/guideArt";
import CommunicationDiagram from "./CommunicationDiagram";

/**
 * Cấu hình màu sắc, icon và đường viền chuẩn Apple Support Callout.
 * Thiết kế phân cấp rõ ràng: dải nhấn trái (accent pill) + squircle icon badge +
 * tiêu đề nổi bật + nội dung có độ tương phản cao, không bị phai mờ.
 */
const TONE_CONFIG = {
  info: {
    border: "border-sky-500/20 dark:border-sky-400/25",
    bg: "bg-sky-500/[0.04] dark:bg-sky-500/[0.08]",
    accent: "bg-sky-500 dark:bg-sky-400",
    iconBg: "bg-sky-500/10 dark:bg-sky-400/15 border-sky-500/25 text-sky-600 dark:text-sky-400",
    titleColor: "text-sky-950 dark:text-sky-100",
    textColor: "text-slate-700 dark:text-slate-300",
    icon: "info",
  },
  tip: {
    border: "border-emerald-500/20 dark:border-emerald-400/25",
    bg: "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]",
    accent: "bg-emerald-500 dark:bg-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-400/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-950 dark:text-emerald-100",
    textColor: "text-slate-700 dark:text-slate-300",
    icon: "check_circle",
  },
  warn: {
    border: "border-amber-500/25 dark:border-amber-400/25",
    bg: "bg-amber-500/[0.04] dark:bg-amber-500/[0.08]",
    accent: "bg-amber-500 dark:bg-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-400/15 border-amber-500/25 text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-950 dark:text-amber-100",
    textColor: "text-slate-700 dark:text-slate-300",
    icon: "warning",
  },
  danger: {
    border: "border-rose-500/20 dark:border-rose-400/25",
    bg: "bg-rose-500/[0.04] dark:bg-rose-500/[0.08]",
    accent: "bg-rose-500 dark:bg-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-400/15 border-rose-500/25 text-rose-600 dark:text-rose-400",
    titleColor: "text-rose-950 dark:text-rose-100",
    textColor: "text-slate-700 dark:text-slate-300",
    icon: "gavel",
  },
};

function getToneConfig(tone) {
  if (tone === "danger") return TONE_CONFIG.danger;
  if (["warn", "warning"].includes(tone)) return TONE_CONFIG.warn;
  if (["success", "tip", "verified"].includes(tone)) return TONE_CONFIG.tip;
  return TONE_CONFIG.info;
}

/**
 * Một khối nội dung tài liệu chuẩn Apple Design:
 * - note: Apple Support Callout Card với icon squircle và dải nhấn bên lề
 * - cards: Lưới 2 cột cân bằng (5x2), layout ngang với icon squircle phóng to nhẹ khi hover
 * - diagram: Sơ đồ tương tác chuỗi giao tiếp kiến trúc
 * - table, figure, faq, code, steps, list, external-links
 */
export default function DocBlock({ block }) {
  if (block.type === "diagram") {
    return <CommunicationDiagram flow={block.flow} />;
  }

  if (block.type === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
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
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/80 p-4.5 sm:p-5 backdrop-blur-xs shadow-xs transition-all duration-200 ${
                hasLink
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md hover:shadow-primary/5"
                  : "hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                  <span className="material-symbols-outlined text-[22px]">{item.icon || "arrow_forward"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14.5px] sm:text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
              {item.badge && (
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs font-semibold text-primary min-w-0">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/15">
                    {item.badge}
                  </span>
                  {hasLink && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary transition-transform group-hover:translate-x-1">
                      <span>Truy cập</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </span>
                  )}
                </div>
              )}
            </Tag>
          );
        })}
      </div>
    );
  }

  if (block.type === "note") {
    const cfg = getToneConfig(block.tone);

    return (
      <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${cfg.border} ${cfg.bg}`}>
        {/* Apple-style left accent pill bar */}
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${cfg.accent}`} aria-hidden="true" />

        <div className="flex items-start gap-3.5 pl-1 sm:gap-4 sm:pl-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-xs ${cfg.iconBg}`}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{cfg.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`text-[14.5px] sm:text-[15px] font-bold tracking-tight ${cfg.titleColor}`}>
              {block.title}
            </h4>
            <p className={`mt-1.5 text-[13.5px] sm:text-sm leading-relaxed ${cfg.textColor}`}>
              {block.text}
            </p>
          </div>
        </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-13 items-center justify-between gap-3 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/80 px-4.5 py-3 text-sm font-semibold text-foreground shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
          >
            <span className="transition-colors group-hover:text-primary">{item.label}</span>
            <span className="material-symbols-outlined text-lg text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true">
              open_in_new
            </span>
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
      <div className="overflow-x-auto rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/60 backdrop-blur-xs shadow-xs">
        <table className={`w-full border-collapse text-left text-[13.5px] ${wide ? "min-w-[34rem]" : ""}`}>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {block.head.map((cell) => (
                <th key={cell} scope="col" className="px-4 py-3.5 font-bold tracking-tight text-foreground">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {block.rows.map((row) => (
              <tr key={row[0]} className="transition-colors hover:bg-muted/30 align-top">
                {row.map((cell, index) => (
                  <td key={index} className="px-4 py-3.5 leading-relaxed text-muted-foreground">{cell}</td>
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
      <figure className="overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/80 shadow-xs">
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
      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/70 shadow-xs">
        {block.items.map((item) => (
          <details key={item.q} className="group transition-colors hover:bg-muted/20">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[14.5px] font-bold text-foreground">
              <span>{item.q}</span>
              <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">
                expand_more
              </span>
            </summary>
            <div className="border-t border-border/40 bg-muted/10 px-5 pb-4.5 pt-3 text-[13.5px] sm:text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return null;
}
