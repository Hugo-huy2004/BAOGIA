import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenCheck, Check, Clock } from "lucide-react";
import { notify } from "../../../lib/notify";

/**
 * Trình đọc học liệu Hugo Studio biên soạn.
 *
 * Bài qua bằng ĐỌC chứ không bằng trắc nghiệm (xem shared/readingLessons.js).
 * Đồng hồ ở đây chỉ để người đọc thấy còn bao lâu — điều kiện thật do máy chủ
 * giữ: nó ghi mốc bắt đầu và tự trừ thời gian khi nhận yêu cầu chốt bài.
 *
 * ponytail: không theo dõi vị trí cuộn, không bắt đọc từng đoạn. Đo cuộn chỉ
 * chặn được người lười, không chặn được người muốn gian, mà lại phạt oan người
 * đọc trên màn hình lớn — cả bài hiện ra không cần cuộn.
 */
const API = import.meta.env.VITE_API_URL || "/api";

const mmss = (seconds) => {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

export default function ArticleReader({ title, onCompleted }) {
  const [article, setArticle] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const deadlineRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/coder-resources/article/${encodeURIComponent(title)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not-found");
        const data = await res.json();
        if (cancelled) return;
        setArticle(data.article);

        if (data.reading?.completedAt) {
          setDone(true);
          return;
        }

        const start = await fetch(`${API}/coder-resources/${data.article._id}/read/start`, {
          method: "POST",
          credentials: "include",
        });
        const session = await start.json();
        if (cancelled) return;
        if (session.completedAt) {
          setDone(true);
          return;
        }
        // Hạn chót tính từ mốc bắt đầu của MÁY CHỦ, nên tải lại trang không
        // làm đồng hồ chạy lại từ đầu.
        deadlineRef.current = new Date(session.startedAt).getTime()
          + (session.requiredMinutes || 5) * 60_000;
      } catch {
        if (!cancelled) setError("Chưa tải được bài đọc. Hãy thử lại.");
      }
    })();

    return () => { cancelled = true; };
  }, [title]);

  useEffect(() => {
    if (done || !deadlineRef.current) return undefined;
    const tick = () => setRemaining(Math.ceil((deadlineRef.current - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [done, article]);

  const finish = useCallback(async () => {
    if (!article || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/coder-resources/${article._id}/read/finish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        notify.warning(
          data.remainingSeconds
            ? `Còn ${mmss(data.remainingSeconds)} nữa mới đủ thời gian đọc.`
            : data.error || "Chưa chốt được bài đọc.",
        );
        return;
      }
      setDone(true);
      notify.success("Đã hoàn thành bài đọc.");
      onCompleted?.();
    } catch {
      notify.error("Chưa chốt được bài đọc. Hãy thử lại.");
    } finally {
      setSaving(false);
    }
  }, [article, saving, onCompleted]);

  if (error) return <p className="text-xs font-bold text-destructive">{error}</p>;
  if (!article) return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden="true" />;

  const ready = done || (remaining !== null && remaining <= 0);

  return (
    <article className="space-y-4">
      <header className="space-y-1.5 border-b border-border pb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
          <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Bài đọc bắt buộc
        </span>
        <h3 className="text-base font-black leading-snug text-foreground">{article.title}</h3>
        <p className="text-[11px] text-muted-foreground">
          {article.author} · {article.readingMinutes} phút đọc
        </p>
      </header>

      <div className="coder-article-body text-[13px] leading-relaxed text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </div>

      {article.references?.length > 0 && (
        <section className="rounded-xl bg-muted/50 p-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Tài liệu tham khảo
          </h4>
          <ol className="mt-2 space-y-2">
            {article.references.map((reference) => (
              <li key={reference} className="text-[11px] leading-relaxed text-muted-foreground">
                {reference}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="sticky bottom-0 -mx-1 bg-background/95 px-1 pb-1 pt-3 backdrop-blur">
        {done ? (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-xs font-black text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            Đã hoàn thành bài đọc
          </p>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!ready || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {ready ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Tôi đã đọc xong
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" aria-hidden="true" />
                Còn {mmss(remaining ?? 0)}
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
