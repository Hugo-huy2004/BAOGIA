import { useCallback, useEffect, useState } from "react";
import { notify } from "../../../lib/notify";
import { CAPSTONE_TRACKS, getCapstoneSpec } from "../../../../shared/capstoneTracks";

/**
 * Chọn đề tài tốt nghiệp và xem đặc tả nghiệm thu.
 *
 * Chặng đồ án trước đây dạy đúng một sản phẩm cho tất cả mọi người, nên học
 * xong ai cũng nộp một thứ giống nhau và không ai phải tự quyết định gì. Ở đây
 * bộ khung kỹ thuật vẫn chung, còn đề tài do học viên chọn — và chọn xong thì
 * thấy ngay mình phải làm ra cái gì mới được nghiệm thu.
 *
 * ponytail: không có bước xác nhận đổi đề tài. Đổi đề tài giữa chừng là việc
 * của học viên, không phải thứ hệ thống cần bảo vệ họ khỏi.
 */
const API = import.meta.env.VITE_API_URL || "/api";

export default function CapstoneTrackPicker({ compact = false }) {
  const [trackId, setTrackId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/member/progress/capstone`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { trackId: "" }))
      .then((data) => {
        if (cancelled) return;
        setTrackId(data.trackId || "");
        setExpanded(data.trackId || null);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const choose = useCallback(async (id) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/member/progress/capstone`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: id }),
      });
      if (!res.ok) throw new Error();
      setTrackId(id);
      setExpanded(id);
      notify.success("Đã chọn đề tài tốt nghiệp.");
    } catch {
      notify.error("Chưa lưu được đề tài. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }, [saving]);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />;
  }

  const spec = getCapstoneSpec(trackId);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Đề tài tốt nghiệp</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bài 71–90 dạy chung một bộ khung kỹ thuật. Đề tài là phần bạn tự chọn — nó quyết định
          bạn mô hình hoá dữ liệu gì và phải nộp ra sản phẩm nào.
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {CAPSTONE_TRACKS.map((item) => {
          const active = trackId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (active ? setExpanded(expanded === item.id ? null : item.id) : choose(item.id))}
              disabled={saving}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-60 ${
                active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-bold text-foreground">{item.title}</h4>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {item.difficulty}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{item.tagline}</p>
                </div>
                {active && (
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden="true">
                    check_circle
                  </span>
                )}
              </div>

              {expanded === item.id && (
                <p className="mt-3 border-t border-border/60 pt-3 text-[13px] leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {spec && !compact && <CapstoneSpec spec={spec} />}
    </section>
  );
}

function Block({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-[15px] font-bold text-foreground">{title}</h4>
      {hint && <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-foreground">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Đặc tả nghiệm thu: chung cho mọi đề tài, riêng cho đề tài đã chọn. */
export function CapstoneSpec({ spec }) {
  const { track, aiFeature, research, core, shared, minResearchItems } = spec;

  return (
    <div className="space-y-3">
      <Block
        title={`Dữ liệu phải mô hình hoá — ${track.title}`}
        hint="Thay cho bảng users mẫu trong bài giảng."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[13px]">
            <tbody className="divide-y divide-border/60">
              {track.entities.map((entity) => (
                <tr key={entity.name}>
                  <td className="py-1.5 pr-4 font-mono font-semibold text-foreground">{entity.name}</td>
                  <td className="py-1.5 font-mono text-muted-foreground">{entity.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <Block title="Chức năng bắt buộc" hint="Toàn bộ đã được dạy trong 100 bài. Làm đủ là nghiệm thu được.">
        <List items={core} />
      </Block>

      <Block
        title={`Phần phải tự tìm hiểu — chọn ít nhất ${minResearchItems}`}
        hint="Không bài nào dạy thẳng những thứ này, nhưng 100 bài đã cho đủ nền để tự đọc mà làm."
      >
        <div className="space-y-3">
          {research.map((item) => (
            <div key={item.topic} className="rounded-xl bg-muted/50 p-3">
              <p className="text-[13px] font-bold text-foreground">{item.topic}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.problem}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/80">Gợi ý: {item.hint}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block title={`Tính năng AI bắt buộc — ${aiFeature.title}`}>
        <p className="text-[13px] leading-relaxed text-foreground">{aiFeature.spec}</p>
      </Block>

      {track.extraLessons.length > 0 && (
        <Block title="Bài hướng dẫn riêng của đề tài" hint="Chỉ đề tài này có, dạy đúng phần khó riêng của nó.">
          <div className="space-y-2.5">
            {track.extraLessons.map((lesson) => (
              <div key={lesson.id}>
                <p className="text-[13px] font-bold text-foreground">{lesson.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{lesson.why}</p>
              </div>
            ))}
          </div>
        </Block>
      )}

      <Block title="Yêu cầu chung cho mọi đề tài">
        <List items={shared} />
      </Block>
    </div>
  );
}
