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
export default function DocsLayout({
  eyebrow,
  version,
  title,
  intro,
  updatedAt,
  pillars,
  defaultPillar = "all",
  sections,
  footerNote,
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [selectedPillar, setSelectedPillar] = useState(defaultPillar);

  // Mục lục tự sáng theo phần đang đọc
  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);
    if (!headings.length || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) {
          const currentId = visible[0].target.id;
          setActiveId(currentId);
          const currentSection = sections.find((s) => s.id === currentId);
          if (currentSection?.pillar) {
            setSelectedPillar(currentSection.pillar);
          }
        }
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

  const handlePillarClick = (pillarId) => {
    setSelectedPillar(pillarId);
    if (pillarId === "all") {
      scrollTo(sections[0]?.id);
      return;
    }
    const target = sections.find((s) => s.pillar === pillarId);
    if (target) {
      scrollTo(target.id);
    }
  };

  const numbered = useMemo(
    () => sections.map((section, index) => ({ ...section, index: index + 1 })),
    [sections],
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <aside className="hidden h-fit w-72 shrink-0 lg:sticky lg:top-6 lg:block">
          <nav className="max-h-[85vh] overflow-y-auto rounded-3xl border border-black/[0.08] dark:border-white/10 bg-card/80 p-3.5 backdrop-blur-md shadow-xs" aria-label="Mục lục">
            <div className="flex items-center justify-between px-2 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Mục lục tài liệu
              </span>
              {version && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                  {version}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {numbered.map((section, idx) => {
                const isActive = activeId === section.id;
                const prevSection = numbered[idx - 1];
                const isNewPillar = section.pillarTitle && section.pillarTitle !== prevSection?.pillarTitle;
                return (
                  <div key={section.id}>
                    {isNewPillar && (
                      <div className="mt-3.5 mb-1.5 flex items-center gap-1.5 px-3 pt-2 text-[10.5px] font-black uppercase tracking-wider text-muted-foreground/80 border-t border-border/40 first:mt-0 first:border-0 first:pt-1">
                        {section.pillarIcon && (
                          <span className="material-symbols-outlined text-[13px] text-primary">{section.pillarIcon}</span>
                        )}
                        <span className="truncate">{section.pillarTitle}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => scrollTo(section.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`group flex w-full items-start gap-2.5 rounded-2xl px-3 py-2 text-left text-[13px] transition-all ${
                        isActive
                          ? "bg-primary/10 font-bold text-primary shadow-xs"
                          : "text-muted-foreground hover:bg-black/[0.035] dark:hover:bg-white/[0.05] hover:text-foreground"
                      }`}
                    >
                      <span className={`w-5 shrink-0 pt-0.5 text-[11px] font-mono tabular-nums ${isActive ? "text-primary font-bold" : "text-muted-foreground/70"}`}>
                        {section.index}
                      </span>
                      <span className="min-w-0 leading-snug">{section.title}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-border/80 pb-6">
            {eyebrow && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-primary">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>{eyebrow}</span>
              </div>
            )}
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl text-foreground">{title}</h1>
            {intro && <p className="mt-3.5 max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">{intro}</p>}
            {updatedAt && (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                Cập nhật lần cuối: {updatedAt}
              </p>
            )}

            {/* Thanh chọn phân vùng Apple Style */}
            {pillars && pillars.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5 rounded-2xl border border-black/[0.07] dark:border-white/10 bg-black/[0.025] dark:bg-white/[0.035] p-1.5 backdrop-blur-md">
                {pillars.map((p) => {
                  const isSelected = selectedPillar === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePillarClick(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                          : "text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground"
                      }`}
                    >
                      {p.icon && <span className="material-symbols-outlined text-[15px]">{p.icon}</span>}
                      <span>{p.label}</span>
                      {p.count && (
                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {p.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </header>

          {/* Mục lục cho màn hình nhỏ */}
          <details className="mt-6 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-card/90 p-4 backdrop-blur-md lg:hidden shadow-xs">
            <summary className="cursor-pointer text-sm font-bold flex items-center justify-between">
              <span>Xem nhanh mục lục ({sections.length} phần)</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </summary>
            <ul className="mt-3.5 space-y-1.5 divide-y divide-border/50 pt-2">
              {numbered.map((section) => (
                <li key={section.id} className="pt-1.5">
                  <button type="button" onClick={() => scrollTo(section.id)} className="w-full text-left text-[13.5px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <span className="font-mono text-xs text-primary font-bold">{section.index}.</span>
                    <span className="truncate">{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <div className="mt-10 space-y-14">
            {numbered.map((section, idx) => {
              const prevSection = numbered[idx - 1];
              const isNewPillar = section.pillarTitle && section.pillarTitle !== prevSection?.pillarTitle;
              return (
                <div key={section.id} className="space-y-4">
                  {isNewPillar && (
                    <div className="pt-8 pb-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-black tracking-wide text-primary shadow-xs">
                        {section.pillarIcon && <span className="material-symbols-outlined text-sm">{section.pillarIcon}</span>}
                        <span>{section.pillarTitle.toUpperCase()}</span>
                      </div>
                      {section.pillarDesc && (
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{section.pillarDesc}</p>
                      )}
                    </div>
                  )}

                  <section id={section.id} className="scroll-mt-24 space-y-4">
                    <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary ring-1 ring-primary/20">
                        {section.index}
                      </span>
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-4 pt-1">
                      {section.blocks.map((block, index) => (
                        <DocBlock key={index} block={block} />
                      ))}
                    </div>
                  </section>
                </div>
              );
            })}
          </div>

          {footerNote && (
            <div className="mt-12 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-xs text-sm leading-relaxed text-muted-foreground">
              {footerNote}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2.5 pt-4 text-xs font-semibold">
            <Link to="/terms-and-guide" className="rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-primary">Điều khoản & Hướng dẫn sử dụng</Link>
            <Link to="/faq" className="rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">Hỏi đáp thường gặp</Link>
            <Link to="/student-pricing" className="rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">Đặc quyền HSSV</Link>
            <Link to="/booking" className="rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">Đặt lịch trao đổi</Link>
            <Link to="/" className="rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">Trang chủ</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
