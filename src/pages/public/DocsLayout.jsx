import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GuideArt from "./guideArt";

/**
 * Khung chung cho trang Chính sách và Hướng dẫn: mục lục dính bên trái, nội
 * dung bên phải. Hai trang chỉ khai báo dữ liệu, không tự dựng layout nữa.
 *
 * Mỗi mục có dạng { id, title, icon, blocks[] }, block là một trong:
 *   { type: "p", text }                — đoạn văn
 *   { type: "list", items[] }          — gạch đầu dòng
 *   { type: "steps", items[] }         — các bước đánh số
 *   { type: "table", head[], rows[][] }— bảng
 *   { type: "note", tone, title, text }— hộp lưu ý (tone: info | warn | danger)
 *   { type: "figure", art, caption }   — hình minh hoạ SVG (xem guideArt.jsx)
 *   { type: "faq", items[{q,a}] }      — hỏi nhanh đáp nhanh
 */
export default function DocsLayout({ eyebrow, version, title, intro, updatedAt, sections, footerNote }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  // Mục lục tự sáng theo phần đang đọc — đỡ phải bấm mới biết mình ở đâu.
  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (!headings.length || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const numbered = useMemo(
    () => sections.map((section, index) => ({ ...section, index: index + 1 })),
    [sections],
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <aside className="hidden h-fit w-72 shrink-0 lg:sticky lg:top-6 lg:block">
          <nav className="max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-3" aria-label="Mục lục">
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Mục lục{version ? ` · ${version}` : ""}
            </p>
            {numbered.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                aria-current={activeId === section.id ? "true" : undefined}
                className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  activeId === section.id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <span className="w-5 shrink-0 pt-px text-xs tabular-nums text-muted-foreground">{section.index}</span>
                <span className="min-w-0 leading-snug">{section.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-border pb-6">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{title}</h1>
            {intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>}
            {updatedAt && <p className="mt-3 text-sm text-muted-foreground">Cập nhật lần cuối: {updatedAt}</p>}
          </header>

          {/* Mục lục cho màn hình nhỏ */}
          <details className="mt-6 rounded-2xl border border-border bg-card p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">Xem mục lục ({sections.length} phần)</summary>
            <ul className="mt-3 space-y-1">
              {numbered.map((section) => (
                <li key={section.id}>
                  <button type="button" onClick={() => scrollTo(section.id)} className="min-h-9 text-left text-sm text-muted-foreground">
                    {section.index}. {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <div className="mt-8 space-y-10">
            {numbered.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="flex items-baseline gap-2.5 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
                  <span className="text-sm tabular-nums text-muted-foreground">{section.index}</span>
                  {section.title}
                </h2>
                <div className="mt-3 space-y-4">
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {footerNote && (
            <p className="mt-10 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">{footerNote}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">Chính sách &amp; điều khoản</Link>
            <Link to="/user-guide" className="font-semibold text-primary hover:underline">Hướng dẫn sử dụng</Link>
            <Link to="/faq" className="font-semibold text-primary hover:underline">Hỏi đáp</Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function Block({ block }) {
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
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
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
