import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";

/**
 * API-m — quản lý một key Hugo Studio dùng cho mọi dịch vụ API của Hugo
 * (QR Hugo qr.hugowishpax.studio, Link Hugo link.hugowishpax.studio).
 * Tab "Kết nối": key, trạng thái, lượt dùng theo dịch vụ, biểu đồ 30 ngày, link đã tạo, log.
 * Tab "Hướng dẫn": cách kết nối, lợi ích, API, thư viện, hỏi đáp.
 * Server: apps/server/routes/qrKeyRoutes.js.
 */
const API = import.meta.env.VITE_API_URL || "/api";
const QR_SITE = "https://qr.hugowishpax.studio";
const LINK_SITE = "https://link.hugowishpax.studio";
export const SERVICES = [
  { id: "qr", name: "QR Hugo", icon: "qr_code_2", site: QR_SITE, text: "Tạo ảnh mã QR qua GET /api/qr", color: "bg-sky-500" },
  { id: "link", name: "Link Hugo", icon: "link", site: LINK_SITE, text: "Rút gọn link qua POST /api/shorten", color: "bg-violet-500" },
];
const card = "rounded-3xl border border-border bg-card/70 p-5 shadow-sm";
const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45";
const h2 = "text-lg font-extrabold text-foreground";
const muted = "text-sm leading-relaxed text-muted-foreground";
const fmt = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

async function call(path, init) {
  const res = await fetch(`${API}/qr-key/${path}`, { credentials: "include", cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Đã có lỗi xảy ra.");
  return data;
}

/**
 * Realtime: nghe SSE `${API}/qr-key/<path>`; mỗi tín hiệu thay đổi → gọi lại `reload` (gộp các tín hiệu dồn dập trong 400ms).
 * EventSource tự nối lại khi mất mạng; quay lại tab cũng tải lại một lần cho chắc.
 */
export function useLive(path, reload, onSignal) {
  useEffect(() => {
    let timer = 0;
    const kick = (e) => { if (e?.data) onSignal?.(e.data); clearTimeout(timer); timer = setTimeout(reload, 400); };
    const es = new EventSource(`${API}/qr-key/${path}`, { withCredentials: true });
    es.onmessage = kick;
    const onVisible = () => { if (!document.hidden) kick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(timer); es.close(); document.removeEventListener("visibilitychange", onVisible); };
  }, [path, reload, onSignal]);
}

function Icon({ name, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>;
}

function Code({ children }) {
  return <pre className="overflow-x-auto rounded-2xl bg-muted p-4 font-mono text-[13px] leading-relaxed text-foreground"><code>{children}</code></pre>;
}

function Meter({ label, value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm"><span className="font-semibold text-foreground">{label}</span><span className="tabular-nums text-muted-foreground">{value.toLocaleString("vi-VN")} / {max.toLocaleString("vi-VN")}</span></div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Cột chồng 30 ngày, không cần thư viện biểu đồ. */
export function UsageChart({ daily = [] }) {
  const max = Math.max(1, ...daily.map((d) => d.qr + d.link));
  const total = daily.reduce((n, d) => n + d.qr + d.link, 0);
  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]" role="img" aria-label={`${total.toLocaleString("vi-VN")} lượt trong 30 ngày`}>
        {daily.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day.split("-").reverse().join("/")}: QR ${d.qr} · Link ${d.link}`}>
            <div className="w-full rounded-t-sm bg-violet-500" style={{ height: `${(d.link / max) * 100}%` }} />
            <div className={`w-full bg-sky-500 ${d.link ? "" : "rounded-t-sm"}`} style={{ height: `${(d.qr / max) * 100}%`, minHeight: d.qr + d.link ? 0 : 2, opacity: d.qr + d.link ? 1 : 0.15 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {SERVICES.map((s) => <span key={s.id} className="inline-flex items-center gap-1.5"><i className={`size-2.5 rounded-full ${s.color}`} />{s.name}</span>)}
        <span className="ml-auto tabular-nums">{total.toLocaleString("vi-VN")} lượt / 30 ngày</span>
      </div>
    </div>
  );
}

function Overview({ state, reload, showToast }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = state.data;

  const makeKey = async () => {
    if (s?.hasKey && !window.confirm("Tạo lại key? Key cũ sẽ ngừng hoạt động ngay, các ứng dụng đang dùng key cũ phải đổi sang key mới.")) return;
    setBusy(true); setError("");
    try { const r = await call("me/key", { method: "POST" }); setKey(r.key); reload(); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(key); showToast?.("Đã sao chép key"); } catch { /* clipboard bị chặn */ } };

  if (state.loading) return <div className="space-y-4" aria-busy="true"><div className="h-40 animate-pulse rounded-3xl bg-muted" /><div className="h-28 animate-pulse rounded-3xl bg-muted" /></div>;
  if (state.error) return <div className={card}><p role="alert" className="font-semibold text-red-500">{state.error}</p><button type="button" className={`${btn} mt-3 bg-muted text-foreground`} onClick={reload}>Thử lại</button></div>;

  const expired = s.periodEnd && new Date(s.periodEnd) < new Date();
  const out = s.used >= s.limits.perPeriod;

  return (
    <div className="space-y-4 pb-10">
      {/* Trạng thái kết nối */}
      <section className={card} aria-labelledby="qh-status">
        <div className="flex items-center gap-3">
          <span className={`flex size-12 items-center justify-center rounded-2xl ${s.connected ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}><Icon name={s.connected ? "link" : "link_off"} className="text-[26px]" /></span>
          <div>
            <h2 id="qh-status" className={h2}>{s.disabled ? "Key đang bị tạm khoá" : s.connected ? "Key đang hoạt động" : s.hasKey ? "Chưa kết nối" : "Chưa có key"}</h2>
            <p className={muted}>{s.disabled ? "Quản trị viên đã tạm khoá key — mọi dịch vụ đang từ chối. Liên hệ contact@hugowishpax.studio." : s.connected ? `Kết nối từ ${fmt(s.connectedAt)} · mã thành viên ${s.code} · một key dùng cho mọi dịch vụ` : s.hasKey ? "Dán key vào mục API trên QR Hugo hoặc Link Hugo để kết nối." : "Tạo một key để dùng API của QR Hugo và Link Hugo."}</p>
          </div>
        </div>
        {s.connected && (out || expired) && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-red-500/10 p-3 text-sm font-semibold text-red-500">
            <Icon name="error" /> {out ? `Đã hết ${s.limits.perPeriod.toLocaleString("vi-VN")} lượt của chu kỳ — QR Hugo đang từ chối tạo QR. Lượt dùng tự reset vào ${fmt(s.periodEnd)}.` : "Chu kỳ 30 ngày đã kết thúc — sẽ tự reset ở lần gọi API kế tiếp."}
          </p>
        )}
      </section>

      {/* Key */}
      <section className={card} aria-labelledby="qh-key">
        <h2 id="qh-key" className={h2}>API key</h2>
        <p className={`${muted} mt-1`}>Key gồm mã thành viên của bạn và một phần bí mật. Mỗi tài khoản chỉ có một key; key chỉ hiện đầy đủ một lần ngay khi tạo.</p>
        {key ? (
          <div className="mt-3 space-y-2">
            <code className="block break-all rounded-2xl bg-muted p-4 font-mono text-sm text-foreground">{key}</code>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Lưu key này lại ngay — đóng app là không xem lại được.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`${btn} bg-foreground text-background`} onClick={copy}><Icon name="content_copy" /> Sao chép key</button>
              {SERVICES.map((v) => <a key={v.id} className={`${btn} border border-border text-foreground`} href={`${v.site}/#api`} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" /> Dán vào {v.name}</a>)}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {s.hasKey && <code className="rounded-xl bg-muted px-3 py-2 font-mono text-sm text-foreground">HS-{s.code}-••••••••</code>}
            <button type="button" className={`${btn} ${s.hasKey ? "border border-border text-foreground" : "bg-primary text-primary-foreground"}`} onClick={makeKey} disabled={busy}>
              <Icon name={s.hasKey ? "autorenew" : "key"} /> {busy ? "Đang tạo…" : s.hasKey ? "Tạo lại key" : "Tạo key"}
            </button>
          </div>
        )}
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
      </section>

      {/* Lượt dùng */}
      <section className={card} aria-labelledby="qh-usage">
        <h2 id="qh-usage" className={h2}>Lượt dùng</h2>
        {s.connected ? (
          <div className="mt-3 space-y-4">
            <Meter label={`Chu kỳ ${fmt(s.periodStart)} – ${fmt(s.periodEnd)}`} value={s.used} max={s.limits.perPeriod} />
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[["Mỗi phút", s.limits.perMinute], ["Mỗi ngày", s.limits.perDay], ["Mỗi chu kỳ", s.limits.perPeriod], ["Tổng đã dùng", s.totalUsed]].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-muted/60 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 text-lg font-extrabold tabular-nums text-foreground">{v.toLocaleString("vi-VN")}</dd></div>
              ))}
            </dl>
            <p className={muted}>Chu kỳ dài 30 ngày tính từ lúc kết nối, hết chu kỳ tự reset một lần. Lần gọi gần nhất: {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString("vi-VN") : "chưa có"}.</p>
          </div>
        ) : <p className={`${muted} mt-2`}>Chưa có dữ liệu — lượt dùng và thời hạn bắt đầu tính khi QR Hugo xác nhận kết nối.</p>}
      </section>

      {/* Dịch vụ */}
      <section className={card} aria-labelledby="qh-services">
        <h2 id="qh-services" className={h2}>Dịch vụ dùng key này</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {SERVICES.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white ${v.color}`}><Icon name={v.icon} /></span>
              <div className="min-w-0 flex-1">
                <a className="font-bold text-foreground hover:underline" href={v.site} target="_blank" rel="noopener noreferrer">{v.name}</a>
                <p className="truncate text-xs text-muted-foreground">{v.text}</p>
              </div>
              <span className="text-right"><b className="block text-lg font-extrabold tabular-nums text-foreground">{(s.usage?.[v.id] || 0).toLocaleString("vi-VN")}</b><small className="text-muted-foreground">lượt</small></span>
            </li>
          ))}
        </ul>
        {s.connected && <div className="mt-5"><UsageChart daily={s.daily} /></div>}
      </section>

      {/* Link đã tạo */}
      {s.items?.length > 0 && (
        <section className={card} aria-labelledby="qh-items">
          <h2 id="qh-items" className={h2}>Link ngắn đã tạo qua API</h2>
          <ol className="mt-2 divide-y divide-border">
            {s.items.slice(0, 30).map((it) => (
              <li key={it.ref + it.at} className="flex items-center gap-3 py-2.5 text-sm">
                <a className="shrink-0 font-mono font-bold text-primary hover:underline" href={`${LINK_SITE}/${it.ref}+`} target="_blank" rel="noopener noreferrer">/{it.ref}</a>
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={it.target}>{it.target}</span>
                <time className="shrink-0 tabular-nums text-muted-foreground" dateTime={it.at}>{new Date(it.at).toLocaleDateString("vi-VN")}</time>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Log */}
      <section className={card} aria-labelledby="qh-log">
        <div className="flex items-center justify-between">
          <h2 id="qh-log" className={h2}>Nhật ký</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"><i className="size-2 animate-pulse rounded-full bg-emerald-500" /> Trực tiếp</span>
        </div>
        {s.logs.length ? (
          <ol className="mt-2 divide-y divide-border">
            {s.logs.map((l, i) => (
              <li key={i} className="flex gap-3 py-2.5 text-sm">
                <Icon name={l.level === "error" ? "error" : "check_circle"} className={l.level === "error" ? "text-red-500" : "text-emerald-500"} />
                <span className="flex-1 text-foreground">{l.msg}</span>
                {l.service && <span className="shrink-0 rounded-full bg-muted px-2 text-xs font-bold text-muted-foreground">{l.service === "link" ? "Link" : "QR"}</span>}
                <time className="shrink-0 tabular-nums text-muted-foreground" dateTime={l.at}>{new Date(l.at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time>
              </li>
            ))}
          </ol>
        ) : <p className={`${muted} mt-2`}>Chưa có sự kiện nào.</p>}
      </section>
    </div>
  );
}

const STEPS = [
  ["key", "Tạo key", "Ở tab Kết nối, bấm Tạo key. Key có dạng HS-<mã thành viên>-<phần bí mật>. Sao chép và cất ở nơi an toàn."],
  ["link", "Kết nối", "Mở QR Hugo hoặc Link Hugo, kéo tới mục API, dán key và bấm Mở khóa. Trạng thái chuyển sang Đã kết nối, chu kỳ 30 ngày bắt đầu. Một key dùng cho cả hai."],
  ["code", "Gọi API", "Gửi key trong header Authorization: Bearer <key>: GET /api/qr để tạo QR, POST /api/shorten để rút gọn link. Mỗi lượt gọi thành công trừ một lượt của chu kỳ (hai dịch vụ dùng chung)."],
  ["monitoring", "Theo dõi", "Quay lại app này để xem lượt theo từng dịch vụ, biểu đồ 30 ngày, link đã tạo và nhật ký lỗi."],
];
const BENEFITS = [
  ["palette", "Tùy biến sâu", "12 kiểu chấm, 7 kiểu viền mắt, 13 kiểu nhân mắt, gradient, màu riêng cho mắt, 7 kiểu khung có chữ."],
  ["bolt", "Nhanh, nhẹ", "Ảnh SVG sắc nét ở mọi kích thước, không phụ thuộc thư viện phía bạn."],
  ["shield", "Riêng tư", "Nội dung mã QR không được lưu. Key chỉ lưu dạng băm, tạo lại là key cũ hết hiệu lực ngay."],
  ["devices", "Mọi nền tảng", "Gọi từ máy chủ Node, Python, PHP, ứng dụng di động — hoặc dùng thư viện qr-hugo để vẽ ngay trong app."],
];
const FAQ = [
  ["Mỗi tài khoản được mấy key?", "Một. Tạo lại key không tạo tài khoản mới — lượt dùng và chu kỳ giữ nguyên, chỉ key cũ hết hiệu lực."],
  ["Hết lượt thì sao?", "QR Hugo trả lỗi 429 và không tạo QR; nhật ký ở đây ghi lại lỗi. Lượt dùng tự reset khi hết chu kỳ 30 ngày."],
  ["Lỡ để lộ key?", "Bấm Tạo lại key. Key cũ ngừng hoạt động ngay lập tức."],
  ["Có nên đặt key trong code trình duyệt?", "Không. Ai mở DevTools cũng đọc được. Hãy gọi API từ máy chủ của bạn, hoặc dùng thư viện qr-hugo (không cần key) nếu chỉ cần vẽ QR trong app."],
  ["Thư viện qr-hugo có cần key không?", "Không — thư viện chạy offline trong ứng dụng của bạn, không gọi tới máy chủ. Key chỉ dùng cho API."],
];

function Guide() {
  return (
    <div className="space-y-4 pb-10">
      <section className={card} aria-labelledby="g-what">
        <h2 id="g-what" className={h2}>API-m là gì?</h2>
        <p className={`${muted} mt-1`}>API-m là nơi quản lý mọi API của Hugo Studio bằng một key duy nhất: <b>QR Hugo</b> (qr.hugowishpax.studio) tạo mã QR có màu, logo, khung; <b>Link Hugo</b> (link.hugowishpax.studio) rút gọn link kèm QR, hẹn giờ tự huỷ, mật khẩu. Trên web dùng trực tiếp miễn phí; key chỉ cần khi gọi API từ ứng dụng của bạn.</p>
        <div className="mt-3 flex flex-wrap gap-2">{SERVICES.map((v) => <a key={v.id} className={`${btn} bg-primary text-primary-foreground`} href={v.site} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" /> Mở {v.name}</a>)}</div>
      </section>

      <section className={card} aria-labelledby="g-steps">
        <h2 id="g-steps" className={h2}>Kết nối trong 4 bước</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-2">
          {STEPS.map(([icon, title, text], i) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-muted/50 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-extrabold text-primary">{i + 1}</span>
              <div><h3 className="flex items-center gap-1.5 font-bold text-foreground"><Icon name={icon} className="text-[20px] text-primary" /> {title}</h3><p className={muted}>{text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={card} aria-labelledby="g-benefits">
        <h2 id="g-benefits" className={h2}>Lợi ích</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {BENEFITS.map(([icon, title, text]) => (
            <li key={title} className="rounded-2xl bg-muted/50 p-4"><h3 className="flex items-center gap-1.5 font-bold text-foreground"><Icon name={icon} className="text-primary" /> {title}</h3><p className={muted}>{text}</p></li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="g-api">
        <h2 id="g-api" className={h2}>Dùng API</h2>
        <p className={`${muted} mt-1`}>Một request GET, trả về ảnh SVG. Giới hạn: 30 lượt/phút, 500 lượt/ngày, 3.000 lượt/chu kỳ 30 ngày.</p>
        <div className="mt-3 space-y-3">
          <Code>{`curl -G "${QR_SITE}/api/qr" \\
  -H "Authorization: Bearer $QR_HUGO_KEY" \\
  --data-urlencode "data=https://example.com" \\
  --data-urlencode "fg=#0a84ff" \\
  -d dots=rounded -d eyeOuter=leaf -d eyeInner=heart \\
  -d frame=bubble -d caption="SCAN ME" \\
  -o qr.svg`}</Code>
          <Code>{`// Node.js (chạy ở máy chủ)
const params = new URLSearchParams({ data: 'https://example.com', dots: 'fluid', fg: '#0a84ff' });
const res = await fetch(\`${QR_SITE}/api/qr?\${params}\`, {
  headers: { Authorization: \`Bearer \${process.env.QR_HUGO_KEY}\` },
});
if (!res.ok) throw new Error((await res.json()).error);
const svg = await res.text();`}</Code>
        </div>
        <h3 className="mt-4 font-bold text-foreground">Tham số chính</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-muted-foreground"><tr><th className="py-2 pr-3">Tham số</th><th className="py-2">Giá trị</th></tr></thead>
            <tbody className="divide-y divide-border text-foreground">
              {[
                ["data / url", "Nội dung (1–2048 ký tự) hoặc link http/https"],
                ["size, margin, level", "128–2048 px · 0–10 ô · L | M | Q | H"],
                ["fg, fg2, gradient, bg", "Màu chính, màu gradient (linear | radial), nền"],
                ["dots", "square, rounded, fluid, dots, tiny, classy, diamond, star, heart, plus, bars, hbars"],
                ["eyeOuter", "square, rounded, circle, leaf, leaf2, cut, dotted"],
                ["eyeInner", "square, rounded, circle, leaf, leaf2, cut, diamond, plus, star, heart, dots9, hbars, vbars"],
                ["eye, eye2", "Màu viền mắt, màu nhân mắt"],
                ["frame, caption, frameColor", "none, card, band, pill, top, bubble, corners · chữ ≤ 40 ký tự · màu khung"],
              ].map(([k, v]) => <tr key={k}><td className="py-2 pr-3 font-mono">{k}</td><td className="py-2">{v}</td></tr>)}
            </tbody>
          </table>
        </div>
        <h3 className="mt-4 font-bold text-foreground">Mã phản hồi</h3>
        <ul className={`${muted} mt-1 space-y-1`}>
          <li><b className="text-foreground">200</b> — ảnh SVG.</li>
          <li><b className="text-foreground">400</b> — tham số sai hoặc nội dung quá dài.</li>
          <li><b className="text-foreground">401</b> — thiếu key, key sai hoặc đã được tạo lại.</li>
          <li><b className="text-foreground">403</b> — key chưa kết nối.</li>
          <li><b className="text-foreground">429</b> — vượt giới hạn phút/ngày hoặc hết lượt của chu kỳ (xem header Retry-After).</li>
        </ul>
      </section>

      <section className={card} aria-labelledby="g-link">
        <h2 id="g-link" className={h2}>API rút gọn link (Link Hugo)</h2>
        <p className={`${muted} mt-1`}>Một request POST, trả về JSON có link ngắn và link xem trước an toàn (thêm dấu + ở cuối). Link bị Google Safe Browsing đánh dấu nguy hiểm sẽ bị từ chối.</p>
        <div className="mt-3 space-y-3">
          <Code>{`curl -X POST "${LINK_SITE}/api/shorten" \
  -H "Authorization: Bearer $HUGO_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/bai-viet-rat-dai","alias":"tailieu-2026","ttl":"7d"}'
# → {"short":"${LINK_SITE}/tailieu-2026","preview":"${LINK_SITE}/tailieu-2026+",...}`}</Code>
        </div>
        <ul className={`${muted} mt-3 space-y-1`}>
          <li><b className="font-mono text-foreground">url</b> — link gốc http/https (bắt buộc).</li>
          <li><b className="font-mono text-foreground">alias</b> — đuôi tuỳ chọn, 3–40 ký tự a-z, 0-9, - hoặc _.</li>
          <li><b className="font-mono text-foreground">ttl</b> — 1h | 24h | 7d | 30d | forever (mặc định forever).</li>
          <li><b className="font-mono text-foreground">password</b> — mã PIN/mật khẩu 4–64 ký tự, người mở link phải nhập đúng.</li>
        </ul>
      </section>

      <section className={card} aria-labelledby="g-lib">
        <h2 id="g-lib" className={h2}>Thư viện qr-hugo</h2>
        <p className={`${muted} mt-1`}>Vẽ đúng các mã QR như API ngay trong ứng dụng, chạy offline, không cần key. Có Web Component cho Vue, Angular, Svelte, HTML thuần và component riêng cho React.</p>
        <div className="mt-3 space-y-3">
          <Code>{`npm i qr-hugo`}</Code>
          <Code>{`// JS / Node
import { renderSvg, DEFAULTS } from 'qr-hugo';
const svg = renderSvg({ ...DEFAULTS, data: 'https://example.com', dots: 'heart', eyeOuter: 'circle', eyeInner: 'star' });`}</Code>
          <Code>{`// React
import { QrHugo } from 'qr-hugo/react';
<QrHugo data="https://example.com" dots="fluid" eyeOuter="leaf" fg="#30d158" style={{ width: 240 }} />`}</Code>
          <Code>{`<!-- Vue / Svelte / Angular / HTML -->
<script type="module">import 'qr-hugo/element';</script>
<qr-hugo data="https://example.com" dots="dots" eye-outer="rounded" eye-inner="dots9" frame="card"></qr-hugo>`}</Code>
        </div>
      </section>

      <section className={card} aria-labelledby="g-faq">
        <h2 id="g-faq" className={h2}>Hỏi đáp</h2>
        <div className="mt-2 divide-y divide-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-1">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">{q}<Icon name="expand_more" className="transition-transform group-open:rotate-180" /></summary>
              <p className={`${muted} pb-3`}>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function QrHugoApp({ onBack, showToast, route, onRouteChange }) {
  const { t } = useTranslation();
  const tab = route === "guide" ? "guide" : "overview";
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const reload = useCallback(async () => {
    try { setState({ loading: false, error: "", data: await call("me") }); } catch (e) { setState({ loading: false, error: e.message, data: null }); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  useLive("me/live", reload);

  return (
    <AppFrame
      appId="qrhugo"
      title={t("memberApps.qrhugo.title", "API-m")}
      subtitle="QR Hugo · Link Hugo"
      largeTitle
      onBack={onBack}
      tabs={[{ id: "overview", icon: "link", label: "Kết nối" }, { id: "guide", icon: "menu_book", label: "Hướng dẫn" }]}
      tab={tab}
      onTabChange={(next) => onRouteChange?.(next === "overview" ? null : next)}
      wideNav="segmented"
      scrollKey={tab}
    >
      {tab === "overview" ? <Overview state={state} reload={reload} showToast={showToast} /> : <Guide />}
    </AppFrame>
  );
}
