import { useCallback, useEffect, useState } from "react";
import { notify } from "../../lib/notify";
import { API_BASE } from "../../config/apiBase";

const KINDS = { badge: "Huy hiệu (đeo trên thẻ, mua 1 lần)", collectible: "Huy hiệu (bản cũ)", xp_boost: "Nhân đôi XP (giá trị = số giờ)", streak_shield: "Khiên lửa (giá trị = số khiên)" };
const CASTS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/edu/cast-${n}.svg`);
const call = (path, method = "GET", body) => fetch(`${API_BASE}/admin/edu-products${path}`, {
  method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body && JSON.stringify(body),
}).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Lỗi"); return d; });

/** Tab "Cửa hàng Edu": sản phẩm bán bằng JOY trong Education Hugo — sửa giá, tồn kho, bật/tắt, thêm mới. */
export default function AdminEduStoreTab() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState({ slug: "", name: "", description: "", price: 200, image: CASTS[0], kind: "badge", value: 1 });
  const load = useCallback(() => call("").then((d) => setItems(d.items)).catch(() => notify.error("Không tải được sản phẩm.")), []);
  useEffect(() => { load(); }, [load]);

  const save = async (id, patch) => {
    try { await call(`/${id}`, "PATCH", patch); notify.success("Đã lưu."); load(); } catch (error) { notify.error(error.message); }
  };
  const create = async (event) => {
    event.preventDefault();
    try {
      await call("", "POST", { slug: draft.slug, name: { vi: draft.name }, description: { vi: draft.description }, priceJoy: Number(draft.price), image: draft.image, kind: draft.kind, value: Number(draft.value) });
      notify.success("Đã thêm sản phẩm.");
      setDraft({ slug: "", name: "", description: "", price: 200, image: CASTS[0], kind: "badge", value: 1 });
      load();
    } catch (error) { notify.error(error.message); }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-black">Sản phẩm đang có</h2>
        <p className="text-sm text-muted-foreground">Mua bằng JOY, áp dụng ngay: huy hiệu tự đeo lên thẻ; nhân đôi XP có hiệu lực tức thì; khiên lửa tự phá băng lúc 8h sáng. Tồn kho trống = không giới hạn.</p>
        {!items ? <p className="mt-4 text-sm">Đang tải…</p> : (
          <ul className="mt-4 divide-y divide-border">
            {items.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center gap-3 py-3">
                <img src={p.image} alt="" width="44" height="44" />
                <div className="min-w-[160px] flex-1">
                  <b>{p.name?.vi}</b>
                  <p className="text-xs text-muted-foreground">{p.slug} · {KINDS[p.kind] || p.kind}{p.kind === "xp_boost" || p.kind === "streak_shield" ? ` · ${p.value}` : ""} · đã bán {p.sold}</p>
                </div>
                <label className="text-sm">Giá <input type="number" min="1" defaultValue={p.priceJoy} className="w-24 rounded-lg border border-border bg-background px-2 py-1"
                  onBlur={(e) => Number(e.target.value) !== p.priceJoy && save(p._id, { priceJoy: e.target.value })} /> JOY</label>
                <label className="text-sm">Tồn <input type="number" min="0" defaultValue={p.stock ?? ""} placeholder="∞" className="w-20 rounded-lg border border-border bg-background px-2 py-1"
                  onBlur={(e) => String(e.target.value) !== String(p.stock ?? "") && save(p._id, { stock: e.target.value })} /></label>
                <button type="button" className="rounded-lg border border-border px-3 py-1 text-sm font-bold" onClick={() => save(p._id, { active: !p.active })}>
                  {p.active ? "Đang bán · Tắt" : "Đã tắt · Bật"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form onSubmit={create} className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-lg font-black">Thêm sản phẩm</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input required placeholder="slug (vd. sticker-lua)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
          <input required placeholder="Tên tiếng Việt" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
          <input required type="number" min="1" placeholder="Giá JOY" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2" />
        </div>
        <textarea placeholder="Mô tả cho người học (tiếng Việt)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2" rows={2} />
        <div className="flex flex-wrap items-center gap-3">
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2">
            {["badge", "xp_boost", "streak_shield"].map((k) => <option key={k} value={k}>{KINDS[k]}</option>)}
          </select>
          {draft.kind !== "badge" && <label className="text-sm">Giá trị <input type="number" min="1" max="720" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className="w-20 rounded-lg border border-border bg-background px-2 py-1" /></label>}
        </div>
        <div className="flex flex-wrap gap-2">
          {CASTS.map((src) => (
            <button key={src} type="button" onClick={() => setDraft({ ...draft, image: src })} aria-pressed={draft.image === src}
              className={`rounded-xl border-2 p-1 ${draft.image === src ? "border-primary" : "border-transparent"}`}><img src={src} alt="" width="40" height="40" /></button>
          ))}
        </div>
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">Thêm</button>
      </form>
    </div>
  );
}
