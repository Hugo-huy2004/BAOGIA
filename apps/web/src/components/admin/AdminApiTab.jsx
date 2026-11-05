import { useCallback, useEffect, useState } from "react";
import { SERVICES, UsageChart, useLive } from "../member/qrHugo/QrHugoApp";

/**
 * API-m (admin): mọi key Hugo Studio, lượt gọi theo dịch vụ (QR Hugo, Link Hugo),
 * biểu đồ 30 ngày, thứ người dùng đã tạo, app họ đang dùng. Realtime qua SSE /api/qr-key/admin/live.
 * Server: apps/server/routes/qrKeyRoutes.js (/api/qr-key/admin*).
 */
const API = import.meta.env.VITE_API_URL || "/api";
const card = "rounded-3xl border border-border bg-card p-5 shadow-sm";
const btn = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50";
const n = (v) => (v || 0).toLocaleString("vi-VN");
const ago = (d) => {
  if (!d) return "—";
  const s = (Date.now() - new Date(d)) / 1000;
  return s < 60 ? "vừa xong" : s < 3600 ? `${Math.floor(s / 60)} phút trước` : s < 86400 ? `${Math.floor(s / 3600)} giờ trước` : new Date(d).toLocaleDateString("vi-VN");
};

async function call(path = "", init) {
  const res = await fetch(`${API}/qr-key/admin${path}`, {
    credentials: "include", cache: "no-store", ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Đã có lỗi xảy ra.");
  return data;
}
const Icon = ({ name, className = "" }) => <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>;

function Status({ r }) {
  const [label, cls] = r.disabled ? ["Đã khoá", "bg-red-500/15 text-red-500"]
    : !r.connected ? ["Chưa kết nối", "bg-amber-500/15 text-amber-600"]
      : r.lastUsedAt && Date.now() - new Date(r.lastUsedAt) < 86_400_000 ? ["Đang dùng", "bg-emerald-500/15 text-emerald-600"]
        : ["Đã kết nối", "bg-sky-500/15 text-sky-600"];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>;
}

function Detail({ code, onClose, onChanged, tick }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(() => call(`/${code}`).then(setD, (e) => setErr(e.message)), [code]);
  useEffect(() => { load(); }, [load, tick]); // tick tăng khi SSE báo đúng key này đổi

  const act = async (label, path, body) => {
    setBusy(label); setErr("");
    try { await call(path, { method: "POST", body: JSON.stringify(body) }); await load(); onChanged(); } catch (e) { setErr(e.message); }
    setBusy("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-background p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label={`Key ${code}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">HS-{code}</h2>
          <button type="button" className={`${btn} bg-muted`} onClick={onClose} aria-label="Đóng" autoFocus><Icon name="close" /></button>
        </div>
        {err && <p role="alert" className="mt-3 text-sm font-semibold text-red-500">{err}</p>}
        {!d ? <div className="mt-4 h-60 animate-pulse rounded-3xl bg-muted" /> : (
          <div className="mt-4 space-y-4">
            <section className={card}>
              <div className="flex items-center gap-3">
                {d.member?.avatar ? <img src={d.member.avatar} alt="" className="size-12 rounded-full object-cover" /> : <span className="flex size-12 items-center justify-center rounded-full bg-muted"><Icon name="person" /></span>}
                <div className="min-w-0">
                  <p className="font-bold">{d.member?.name || "—"}</p>
                  <p className="truncate text-sm text-muted-foreground">{d.email}</p>
                </div>
                <span className="ml-auto"><Status r={d} /></span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[["Tạo key", new Date(d.createdAt).toLocaleDateString("vi-VN")], ["Kết nối", d.connectedAt ? new Date(d.connectedAt).toLocaleDateString("vi-VN") : "—"],
                  ["Chu kỳ", `${n(d.used)} / ${n(d.limits.perPeriod)}`], ["Reset", d.periodEnd ? new Date(d.periodEnd).toLocaleDateString("vi-VN") : "—"],
                  ["Tổng lượt", n(d.totalUsed)], ["Gọi gần nhất", ago(d.lastUsedAt)]].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-muted/60 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold tabular-nums">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={`${btn} ${d.disabled ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`} disabled={!!busy}
                  onClick={() => (d.disabled || window.confirm("Khoá key này? Mọi dịch vụ sẽ từ chối ngay.")) && act("lock", `/${code}`, { disabled: !d.disabled })}>
                  <Icon name={d.disabled ? "lock_open" : "block"} /> {d.disabled ? "Mở khoá key" : "Khoá key"}
                </button>
                <button type="button" className={`${btn} border border-border`} disabled={!!busy || !d.connected}
                  onClick={() => window.confirm("Reset lượt dùng về 0 và bắt đầu chu kỳ 30 ngày mới?") && act("reset", `/${code}`, { resetPeriod: true })}>
                  <Icon name="restart_alt" /> Reset chu kỳ
                </button>
              </div>
            </section>

            <section className={card}>
              <h3 className="font-extrabold">Lượt gọi theo dịch vụ</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SERVICES.map((v) => <div key={v.id} className="rounded-2xl bg-muted/60 p-3 text-sm"><span className="text-muted-foreground">{v.name}</span><b className="block text-lg tabular-nums">{n(d.usage[v.id])}</b></div>)}
              </div>
              <div className="mt-4"><UsageChart daily={d.daily} /></div>
            </section>

            {d.member && (
              <section className={card}>
                <h3 className="font-extrabold">App đang dùng trên Hugo Studio</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tài khoản {d.member.status || "active"} · hạn {d.member.expiresAt ? new Date(d.member.expiresAt).toLocaleDateString("vi-VN") : "—"} · tham gia {d.member.joinedAt ? new Date(d.member.joinedAt).toLocaleDateString("vi-VN") : "—"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.member.apps.length ? d.member.apps.map((a) => <span key={a} className={`rounded-full px-2.5 py-1 text-xs font-bold ${d.member.home.includes(a) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{a}</span>) : <span className="text-sm text-muted-foreground">Chưa cài app nào.</span>}
                </div>
              </section>
            )}

            <section className={card}>
              <h3 className="font-extrabold">Link ngắn đã tạo ({d.items.length})</h3>
              {d.items.length ? (
                <ol className="mt-2 divide-y divide-border">
                  {d.items.map((it) => (
                    <li key={it.ref + it.at} className="flex items-center gap-2 py-2 text-sm">
                      <a className="shrink-0 font-mono font-bold text-primary hover:underline" href={`https://link.hugowishpax.studio/${it.ref}+`} target="_blank" rel="noopener noreferrer">/{it.ref}</a>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground" title={it.target}>{it.target}</span>
                      <button type="button" className="shrink-0 rounded-full p-1.5 text-red-500 hover:bg-red-500/10" aria-label={`Xoá /${it.ref}`} disabled={!!busy}
                        onClick={() => window.confirm(`Xoá link /${it.ref}? Người mở link sẽ thấy trang không tồn tại.`) && act(it.ref, `/${code}/item-delete`, { ref: it.ref })}>
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-1 text-sm text-muted-foreground">Chưa có.</p>}
            </section>

            <section className={card}>
              <h3 className="font-extrabold">Nhật ký</h3>
              <ol className="mt-2 divide-y divide-border">
                {d.logs.map((l, i) => (
                  <li key={i} className="flex gap-2 py-2 text-sm">
                    <Icon name={l.level === "error" ? "error" : "check_circle"} className={l.level === "error" ? "text-red-500" : "text-emerald-500"} />
                    <span className="flex-1">{l.msg}</span>
                    <time className="shrink-0 text-muted-foreground" dateTime={l.at}>{ago(l.at)}</time>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function AdminApiTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState("");
  const load = useCallback(() => call().then((d) => { setData(d); setErr(""); }, (e) => setErr(e.message)), []);
  // Tín hiệu SSE mang mã key: làm sáng dòng đó, và nếu đang mở chi tiết đúng key đó thì tải lại chi tiết.
  const onSignal = useCallback((code) => { setFlash(code); setTimeout(() => setFlash(""), 1500); setOpen((o) => { if (o === code) setTick((t) => t + 1); return o; }); }, []);
  useEffect(() => { load(); }, [load]);
  useLive("admin/live", load, onSignal);

  if (!data) return <div className="p-6">{err ? <p role="alert" className="font-semibold text-red-500">{err}</p> : <div className="h-60 animate-pulse rounded-3xl bg-muted" />}</div>;
  const { stats, rows } = data;
  const term = q.trim().toLowerCase();
  const list = rows.filter((r) => (filter === "all" || (filter === "active" && r.connected && !r.disabled) || (filter === "idle" && !r.connected) || (filter === "locked" && r.disabled) || (filter === "error" && r.lastError))
    && (!term || r.code.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)));

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">API-m</h1>
          <p className="text-sm text-muted-foreground">Key và lượt gọi của QR Hugo, Link Hugo · cập nhật {new Date(data.updatedAt).toLocaleTimeString("vi-VN")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600"><i className="size-2.5 animate-pulse rounded-full bg-emerald-500" /> Trực tiếp</span>
      </header>
      {err && <p role="alert" className="text-sm font-semibold text-red-500">{err}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["key", "Key đã tạo", stats.keys], ["link", "Đã kết nối", stats.connected], ["bolt", "Hoạt động hôm nay", stats.activeToday],
          ["today", "Lượt gọi hôm nay", (stats.today?.qr || 0) + (stats.today?.link || 0)], ["block", "Đang khoá", stats.disabled]].map(([icon, k, v]) => (
          <div key={k} className={card}><Icon name={icon} className="text-primary" /><p className="mt-1 text-sm text-muted-foreground">{k}</p><p className="text-2xl font-extrabold tabular-nums">{n(v)}</p></div>
        ))}
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold">Lượt gọi 30 ngày</h2>
          <p className="text-sm text-muted-foreground">Tổng: QR Hugo {n(stats.usage.qr)} · Link Hugo {n(stats.usage.link)}</p>
        </div>
        <div className="mt-3"><UsageChart daily={data.daily} /></div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-10 flex-1 items-center gap-2 rounded-full bg-muted px-4">
            <Icon name="search" className="text-muted-foreground" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Tìm mã thành viên hoặc email" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Lọc">
            {[["all", "Tất cả"], ["active", "Đang kết nối"], ["idle", "Chưa kết nối"], ["error", "Có lỗi"], ["locked", "Đã khoá"]].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={filter === id} className={`${btn} min-h-9 px-3 ${filter === id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground"><tr>{["Thành viên", "Trạng thái", "Chu kỳ", "QR Hugo", "Link Hugo", "Link đã tạo", "Gọi gần nhất", "Lỗi gần nhất"].map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((r) => (
                <tr key={r.code} className={`cursor-pointer transition-colors duration-700 hover:bg-muted/50 ${flash === r.code ? "bg-emerald-500/15" : ""}`} onClick={() => setOpen(r.code)}>
                  <td className="py-2.5 pr-3"><button type="button" className="text-left"><b className="font-mono">{r.code}</b><span className="block max-w-[200px] truncate text-xs text-muted-foreground">{r.email}</span></button></td>
                  <td className="pr-3"><Status r={r} /></td>
                  <td className="pr-3 tabular-nums">{n(r.used)} / {n(data.limits.perPeriod)}</td>
                  <td className="pr-3 tabular-nums">{n(r.usage.qr)}</td>
                  <td className="pr-3 tabular-nums">{n(r.usage.link)}</td>
                  <td className="pr-3 tabular-nums">{n(r.items)}</td>
                  <td className="pr-3 text-muted-foreground">{ago(r.lastUsedAt)}</td>
                  <td className="max-w-[220px] truncate text-red-500" title={r.lastError?.msg}>{r.lastError ? r.lastError.msg : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p className="py-8 text-center text-sm text-muted-foreground">Không có key nào khớp.</p>}
        </div>
      </section>
      {open && <Detail code={open} tick={tick} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
