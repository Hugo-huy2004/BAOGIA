import { useCallback, useEffect, useState } from "react";
import { notify } from "../../lib/notify";
import { API_BASE } from "../../config/apiBase";
import { FEEDBACK_QUESTIONS } from "../../../../../packages/shared/eduFeedback";

const LABEL = { content: "Nội dung bài học", ease: "Dễ dùng", design: "Giao diện & nhân vật", motivation: "Động lực (lửa, JOY, bảng tuần)", recommend: "Sẵn sàng giới thiệu" };

/** Tab "Đánh giá": bài đánh giá Education Hugo (lưu vĩnh viễn) + gửi thử / gửi đợt thư xin tài trợ. */
export default function AdminEduFeedbackTab() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`${API_BASE}/admin/edu-feedback?page=${page}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => notify.error("Không tải được đánh giá."));
  }, [page]);
  useEffect(load, [load]);

  const sponsor = async (test) => {
    if (!test && !(await notify.confirm({ title: "Gửi đợt thư xin tài trợ?", message: "Gửi tối đa 30 người học chưa nhận trong tháng này. Thư tự động vẫn chạy ngày 01–07 hằng tháng." }))) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/admin/edu-sponsor-mail`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test, limit: 30 }) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      notify.success(test ? (body.sent ? "Đã gửi thư thử tới email admin." : "Chưa gửi được (email admin chưa là người học Edu, hoặc đã nhận tháng này).") : `Đã gửi ${body.sent}/${body.candidates} thư${body.stopped ? " — hết suất thư hôm nay" : ""}.`);
    } catch (error) {
      notify.error(error.message || "Không gửi được thư.");
    } finally {
      setBusy(false);
    }
  };

  const avg = (r) => (Object.values(r || {}).reduce((a, b) => a + b, 0) / 5).toFixed(1);
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Đánh giá Education Hugo</h2>
            <p className="text-sm text-muted-foreground">{data ? `${data.total} bài · lưu vĩnh viễn` : "Đang tải…"}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => sponsor(true)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">Gửi thử thư tài trợ</button>
            <button type="button" disabled={busy} onClick={() => sponsor(false)} className="rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background">Gửi đợt thư tài trợ</button>
          </div>
        </div>
        {data?.averages && (
          <div className="mt-4 grid gap-2">
            {FEEDBACK_QUESTIONS.map((q) => (
              <div key={q} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <div className="text-sm text-foreground">{LABEL[q]}</div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-foreground" style={{ width: `${(data.averages[q] / 5) * 100}%` }} /></div>
                </div>
                <b className="text-sm tabular-nums text-foreground">{data.averages[q].toFixed(2)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        {data?.items.map((x) => (
          <article key={x._id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <b className="text-foreground">{x.email}</b>
              <span className="text-muted-foreground">{new Date(x.createdAt).toLocaleString("vi-VN")} · {x.source === "mail" ? "từ thư" : "trong app"} · {x.lang}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-lg bg-muted px-2 py-1 font-bold text-foreground">TB {avg(x.ratings)}/5</span>
              {FEEDBACK_QUESTIONS.map((q) => <span key={q} className="rounded-lg bg-muted px-2 py-1">{LABEL[q]}: {x.ratings?.[q]}</span>)}
            </div>
            {x.comment && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{x.comment}</p>}
          </article>
        ))}
        {data && data.total > page * 30 && <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">Trang sau</button>}
        {page > 1 && <button type="button" onClick={() => setPage(page - 1)} className="ml-2 rounded-xl border border-border px-4 py-2 text-xs font-bold">Trang trước</button>}
      </section>
    </div>
  );
}
