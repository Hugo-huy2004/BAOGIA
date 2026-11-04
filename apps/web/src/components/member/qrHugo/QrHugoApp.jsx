import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";

/**
 * QR Hugo — cổng nối tài khoản Hugo Studio với qr.hugowishpax.studio.
 * Tab "Kết nối": key (mã thành viên + phần bí mật), trạng thái, lượt dùng, log.
 * Tab "Hướng dẫn": cách kết nối, lợi ích, API, thư viện, hỏi đáp.
 * Server: apps/server/routes/qrKeyRoutes.js.
 */
const API = import.meta.env.VITE_API_URL || "/api";
const QR_SITE = "https://qr.hugowishpax.studio";
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
            <h2 id="qh-status" className={h2}>{s.connected ? "Đã kết nối với QR Hugo" : s.hasKey ? "Chưa kết nối" : "Chưa có key"}</h2>
            <p className={muted}>{s.connected ? `Kết nối từ ${fmt(s.connectedAt)} · mã thành viên ${s.code}` : s.hasKey ? "Dán key vào mục API trên qr.hugowishpax.studio để kết nối." : "Tạo key để dùng API và thư viện QR Hugo."}</p>
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
              <a className={`${btn} border border-border text-foreground`} href={`${QR_SITE}/#api`} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" /> Dán vào QR Hugo</a>
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

      {/* Log */}
      <section className={card} aria-labelledby="qh-log">
        <div className="flex items-center justify-between">
          <h2 id="qh-log" className={h2}>Nhật ký</h2>
          <button type="button" className={`${btn} px-3 text-muted-foreground`} onClick={reload} aria-label="Tải lại"><Icon name="refresh" /></button>
        </div>
        {s.logs.length ? (
          <ol className="mt-2 divide-y divide-border">
            {s.logs.map((l, i) => (
              <li key={i} className="flex gap-3 py-2.5 text-sm">
                <Icon name={l.level === "error" ? "error" : "check_circle"} className={l.level === "error" ? "text-red-500" : "text-emerald-500"} />
                <span className="flex-1 text-foreground">{l.msg}</span>
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
  ["link", "Kết nối", "Mở qr.hugowishpax.studio, kéo tới mục API, dán key và bấm Mở khóa. QR Hugo báo ngay về Hugo Studio: trạng thái chuyển sang Đã kết nối, chu kỳ 30 ngày bắt đầu."],
  ["code", "Gọi API", "Gửi key trong header Authorization: Bearer <key> mỗi lần gọi GET /api/qr. Mỗi lượt gọi thành công trừ một lượt của chu kỳ."],
  ["monitoring", "Theo dõi", "Quay lại app này để xem lượt còn lại, ngày reset và nhật ký lỗi (key sai, vượt giới hạn, hết lượt)."],
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
        <h2 id="g-what" className={h2}>QR Hugo là gì?</h2>
        <p className={`${muted} mt-1`}>QR Hugo (qr.hugowishpax.studio) là studio tạo mã QR của Hugo Studio: link, Wi-Fi, danh thiếp vCard, email, SMS, vị trí — với màu sắc, hình dạng, logo và khung riêng. Trên web dùng trực tiếp; cho lập trình viên có API và thư viện qr-hugo.</p>
        <a className={`${btn} mt-3 bg-primary text-primary-foreground`} href={QR_SITE} target="_blank" rel="noopener noreferrer"><Icon name="open_in_new" /> Mở QR Hugo</a>
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

  return (
    <AppFrame
      appId="qrhugo"
      title={t("memberApps.qrhugo.title", "QR Hugo")}
      subtitle="qr.hugowishpax.studio"
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
