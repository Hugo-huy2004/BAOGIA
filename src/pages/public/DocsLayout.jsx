import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DocBlock from "../../components/docs/DocBlock";

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
 *   { type: "security-flow" }          — minh hoạ chuyển động luồng bảo mật
 *   { type: "security-examples" }      — video minh hoạ các ví dụ kỹ thuật
 *   { type: "age-card" }               — điều kiện độ tuổi 14+
 *   { type: "external-links", items[] }— liên kết chính sách bên thứ ba
 *   { type: "code", title, code, text }— ví dụ kỹ thuật đã rút gọn
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
                    <DocBlock key={index} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {footerNote && (
            <p className="mt-10 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">{footerNote}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">Chính sách bảo mật</Link>
            <Link to="/terms" className="font-semibold text-primary hover:underline">Điều khoản sử dụng</Link>
            <Link to="/user-guide" className="font-semibold text-primary hover:underline">Hướng dẫn sử dụng</Link>
            <Link to="/faq" className="font-semibold text-primary hover:underline">Hỏi đáp</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
