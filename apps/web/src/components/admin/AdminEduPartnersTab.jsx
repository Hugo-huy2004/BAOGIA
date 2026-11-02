import { useCallback, useEffect, useState } from "react";
import { notify } from "../../lib/notify";
import { API_BASE } from "../../config/apiBase";

const call = (path, method = "GET", body) => fetch(`${API_BASE}/admin/edu-partners${path}`, {
  method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body && JSON.stringify(body),
}).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Lỗi"); return d; });

const fmt = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const statusOf = (k) => (k.revokedAt ? "Đã thu hồi" : new Date(k.expiresAt) < new Date() ? "Hết hạn" : "Đang hiệu lực");

/** Tab "Đối tác Edu": key 32 ký tự cho thư viện Education Hugo. Key gốc chỉ nằm trong thư gửi đối tác. */
export default function AdminEduPartnersTab() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState({ email: "", days: 30, origins: "", note: "" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => call("").then((d) => setItems(d.items)).catch(() => notify.error("Không tải được danh sách key.")), []);
  useEffect(() => { load(); }, [load]);

  const issue = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const d = await call("", "POST", draft);
      notify.success(`Đã gửi key …${d.last4} tới ${d.email}.`);
      setDraft({ email: "", days: 30, origins: "", note: "" });
      load();
    } catch (error) { notify.error(error.message); } finally { setBusy(false); }
  };
  const revoke = async (k) => {
    if (!(await notify.confirm(`Thu hồi key …${k.last4} của ${k.email}? Thư viện của đối tác sẽ ngừng tải bài ngay.`))) return;
    try { await call(`/${k._id}/revoke`, "POST"); notify.success("Đã thu hồi."); load(); } catch (error) { notify.error(error.message); }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={issue} className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-lg font-black">Cấp key đối tác</h2>
        <p className="text-sm text-muted-foreground">Hệ thống tạo key ngẫu nhiên 32 ký tự và gửi thẳng vào mail đối tác. Máy chủ chỉ lưu bản băm, admin cũng không xem lại được key gốc. Hết hạn hoặc thu hồi là thư viện ngừng tải bài.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required type="email" placeholder="Email đối tác" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">Hiệu lực
            <input type="number" min="1" max="365" value={draft.days} onChange={(e) => setDraft({ ...draft, days: e.target.value })} className="w-24 rounded-lg border border-border bg-background px-3 py-2" /> ngày
          </label>
          <input placeholder="Tên miền được phép, cách nhau dấu phẩy (vd. https://truong-abc.edu.vn)" value={draft.origins} onChange={(e) => setDraft({ ...draft, origins: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 sm:col-span-2" />
          <input placeholder="Ghi chú (tên đơn vị, hợp đồng…)" maxLength={200} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 sm:col-span-2" />
        </div>
        <p className="text-xs text-muted-foreground">Để trống tên miền thì key chạy ở mọi nơi. Chỉ nên làm vậy khi đối tác đang thử nghiệm, vì key nằm trong mã trang web của họ và ai cũng đọc được.</p>
        <button disabled={busy} className="rounded-xl bg-foreground px-4 py-2 font-bold text-background disabled:opacity-50">{busy ? "Đang gửi…" : "Tạo và gửi key"}</button>
      </form>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-black">Key đã cấp</h2>
        {!items ? <p className="mt-4 text-sm">Đang tải…</p> : !items.length ? <p className="mt-4 text-sm text-muted-foreground">Chưa cấp key nào.</p> : (
          <ul className="mt-4 divide-y divide-border">
            {items.map((k) => (
              <li key={k._id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[220px] flex-1">
                  <b>{k.email}</b> <code className="text-xs">…{k.last4}</code>
                  <p className="text-xs text-muted-foreground">{statusOf(k)} · hết hạn {fmt(k.expiresAt)} · {k.uses} lượt · dùng gần nhất {fmt(k.lastUsedAt)}</p>
                  <p className="text-xs text-muted-foreground">{k.origins?.length ? k.origins.join(", ") : "Mọi tên miền"}{k.note ? ` · ${k.note}` : ""}</p>
                </div>
                {statusOf(k) === "Đang hiệu lực" && (
                  <button type="button" onClick={() => revoke(k)} className="rounded-lg border border-border px-3 py-1 text-sm font-bold">Thu hồi</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
