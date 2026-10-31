import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DocBlock from "../../docs/DocBlock";
import { MEMBER_DOCS } from "./memberDocs";
import { MEMBER_DOCS_EN } from "./memberDocs.en";
import { languageCode } from "../../../i18n/languages";

/**
 * Trình đọc văn bản pháp lý quy chuẩn tài khoản thành viên.
 * Tích hợp chuẩn Apple: Bố cục trực quan, font sắc nét, typography chuẩn mực.
 * Hỗ trợ fetch API backend Node.js (với HTTP caching & ETag), tự động fallback sang offline cache.
 */
export default function MemberDocReader({ docId }) {
  const { i18n } = useTranslation();
  const activeLanguage = languageCode(i18n.resolvedLanguage || i18n.language);
  const [remoteDoc, setRemoteDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fallback cục bộ tức thì
  const localDoc = useMemo(() => {
    const fallbackSource = activeLanguage === "en" ? MEMBER_DOCS_EN : MEMBER_DOCS;
    return fallbackSource[docId] || MEMBER_DOCS[docId] || null;
  }, [activeLanguage, docId]);

  // Tải động từ Node.js Express backend qua REST API
  useEffect(() => {
    let isMounted = true;
    if (!docId) return;

    const fetchLegalDoc = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/legal-docs/${docId}?lang=${activeLanguage}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data) {
            setRemoteDoc(json.data);
          }
        }
      } catch (err) {
        // Silent catch: sử dụng fallback cục bộ không gián đoạn
        console.warn("[MemberDocReader] Sử dụng bản lưu cục bộ:", err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLegalDoc();

    return () => {
      isMounted = false;
    };
  }, [docId, activeLanguage]);

  const doc = remoteDoc || localDoc;

  if (!doc && isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
        <div className="size-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-medium">Đang tải văn bản quy chuẩn...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Văn bản không tồn tại hoặc đã được cập nhật sang bản mới.
      </div>
    );
  }

  const sections = typeof doc.sections === "function" ? doc.sections() : (doc.sections || []);

  return (
    <article className="space-y-8 animate-in fade-in duration-200">
      {/* Header tài liệu chuẩn Apple */}
      <header className="pb-5 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {doc.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary tracking-wide">
              {doc.badge}
            </span>
          )}
          {doc.version && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
              Phiên bản {doc.version}
            </span>
          )}
          {doc.lastUpdated && (
            <span className="text-[11px] text-muted-foreground/80">
              Cập nhật: {doc.lastUpdated}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {doc.title}
        </h1>
        {doc.subtitle && (
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {doc.subtitle}
          </p>
        )}
      </header>

      {/* Nội dung từng phần được dàn trang gọn gàng */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <section key={section.id || index} id={section.id} className="scroll-mt-4">
            <h2 className="flex items-baseline gap-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
              <span className="text-xs font-bold tabular-nums text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            <div className="mt-3.5 space-y-4">
              {section.blocks?.map((block, i) => (
                <DocBlock key={i} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer thông cáo bảo mật & bản quyền hệ thống */}
      <footer className="pt-6 border-t border-border/40 text-center text-[11px] text-muted-foreground/70">
        <p>Hugo Studio • Kiến trúc Zero-Trust & Tuyên ngôn quyền thành viên</p>
        <p className="mt-0.5">Văn bản này được bảo vệ bởi chứng chỉ mã hóa và sổ cái bất biến.</p>
      </footer>
    </article>
  );
}
