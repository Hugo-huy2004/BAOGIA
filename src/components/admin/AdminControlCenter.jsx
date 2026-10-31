import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useVisiblePoll from "../../hooks/useVisiblePoll";
import { api } from "../../services/api/core/baseApi";
import { notify } from "../../lib/notify";

/**
 * Trung Tâm Điều Khiển — gộp An ninh, Hệ thống, Nhật ký, Cấu hình cũ vào một
 * màn: khách thật trên bản đồ, việc cần để ý, an ninh, công tắc thật, sức khoẻ.
 * Mọi thứ nối nhau: khách → chặn IP / mở hồ sơ thành viên; lỗi, sự kiện, thao
 * tác → mở đúng bảng trong Dữ liệu. Server: GET /api/admin/control.
 */
const SWITCHES = [
  { key: "maintenanceMode", label: "Bảo trì", desc: "Đóng app với mọi thành viên, hiện trang bảo trì.", danger: true },
  { key: "vacationMode", label: "Nghỉ phép", desc: "Báo khách rằng xưởng đang nghỉ, phản hồi chậm hơn." },
  { key: "allowRegistration", label: "Nhận thành viên mới", desc: "Tắt thì đăng nhập Google lần đầu bị từ chối." },
  { key: "allowBooking", label: "Nhận lịch tư vấn", desc: "Tắt thì form đặt lịch ở /services trả lỗi." },
];
const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "online", label: "Đang online" },
  { id: "members", label: "Thành viên" },
  { id: "risky", label: "Đáng ngờ" },
  { id: "bots", label: "Bot / máy chủ" },
];
const LEVEL_DOT = { high: "bg-rose-500", medium: "bg-amber-500", low: "bg-muted-foreground" };

const fmt = (n) => (n ?? 0).toLocaleString("vi-VN");
const ago = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ`;
  return new Date(d).toLocaleDateString("vi-VN");
};
const place = (g) => (g ? [g.city, g.country].filter(Boolean).join(", ") : "Đang tra vị trí…");
const risky = (v) => v.flagged || v.blocked || v.geo?.proxy;
const isBot = (v) => v.device === "bot" || v.geo?.hosting;

function Card({ id, title, icon, action, children }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-3xl border border-border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-muted-foreground" aria-hidden>{icon}</span>
        <h2 className="mr-auto text-[15px] font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function LinkButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}<span className="material-symbols-outlined text-[16px]" aria-hidden>arrow_forward</span>
    </button>
  );
}

function Stat({ label, value, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-muted/50">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

function Toggle({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-foreground" : "bg-muted"}`}>
      <span className={`absolute top-0.5 size-6 rounded-full bg-background shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

/** Bản đồ Leaflet + ô OpenStreetMap. Nạp lười: chỉ màn này cần. */
function VisitorMap({ visitors, focus, onPick }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const Lref = useRef(null);
  const drawRef = useRef(() => {});

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([mod]) => {
      if (cancelled || !box.current || map.current) return;
      const L = mod.default || mod;
      Lref.current = L;
      map.current = L.map(box.current, { worldCopyJump: true, zoomControl: true, attributionControl: true }).setView([16, 106], 3);
      // Ô OSM: free, không key, chỉ màn admin dùng. Vài mạng chặn/không phân giải
      // tile.openstreetmap.org → lỗi ô đầu tiên thì đổi sang máy chủ OSM France.
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      tiles.once("tileerror", () => tiles.setUrl("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"));
      layer.current = L.layerGroup().addTo(map.current);
      drawRef.current();
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);

  // Gộp khách cùng toạ độ (cùng thành phố) thành một chấm, to theo số người.
  const draw = useCallback(() => {
    const L = Lref.current;
    if (!L || !layer.current) return;
    layer.current.clearLayers();
    const groups = new Map();
    for (const v of visitors) {
      if (v.geo?.lat == null) continue;
      const key = `${v.geo.lat.toFixed(2)},${v.geo.lon.toFixed(2)}`;
      groups.set(key, [...(groups.get(key) || []), v]);
    }
    for (const list of groups.values()) {
      const { lat, lon } = list[0].geo;
      const online = list.some((v) => v.online);
      const color = list.some(risky) ? "#e11d48" : online ? "#16a34a" : "#64748b";
      const marker = L.circleMarker([lat, lon], {
        radius: Math.min(6 + Math.sqrt(list.length) * 3, 22), color, weight: 2, fillColor: color, fillOpacity: online ? 0.55 : 0.25,
      });
      marker.bindTooltip(`${place(list[0].geo)} · ${list.length} khách${online ? " · có người online" : ""}`);
      marker.on("click", () => onPick(list[0].ip));
      marker.addTo(layer.current);
    }
  }, [visitors, onPick]);

  useEffect(() => {
    drawRef.current = draw;
    draw();
  }, [draw]);

  useEffect(() => {
    if (focus?.geo?.lat != null) map.current?.flyTo([focus.geo.lat, focus.geo.lon], 9, { duration: 0.8 });
  }, [focus]);

  return <div ref={box} className="isolate h-[340px] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:h-[420px]" role="region" aria-label="Bản đồ khách truy cập" />;
}

export default function AdminControlCenter({ data, updateAdvertisement, uploadingAd, handleAdImageUpload, handleAdDelete, onOpenMember }) {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [focusIp, setFocusIp] = useState(null);
  const [tg, setTg] = useState(null);

  const load = useCallback(async () => {
    try { setState(await api.get("/admin/control")); setError(""); }
    catch (err) { setError(err.message || "Không tải được Trung Tâm Điều Khiển."); }
  }, []);
  // Admin hay để màn này mở qua đêm: chỉ hỏi khi tab đang hiện.
  useVisiblePoll(load, 20000);
  useEffect(() => {
    api.get("/telegram/status").then(setTg).catch(() => setTg({ configured: false }));
  }, []);

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const res = await fn(); notify.success(res?.message || ok); await load(); }
    catch (err) { notify.error(err.message || "Không thực hiện được."); }
    finally { setBusy(""); }
  };

  const openData = (resource) => navigate(`/admin/data/${resource}`);
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const visitors = useMemo(() => state?.visitors?.visitors || [], [state]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visitors.filter((v) => {
      if (filter === "online" && !v.online) return false;
      if (filter === "members" && !v.email) return false;
      if (filter === "risky" && !risky(v)) return false;
      if (filter === "bots" && !isBot(v)) return false;
      if (!q) return true;
      return [v.ip, v.email, v.page, v.geo?.city, v.geo?.country, v.geo?.isp].some((x) => String(x || "").toLowerCase().includes(q));
    });
  }, [visitors, filter, query]);
  const focus = visitors.find((v) => v.ip === focusIp) || null;
  const pickVisitor = useCallback((ip) => {
    setFocusIp(ip);
    setFilter("all");
    setQuery(ip);
  }, []);

  const blockIp = async (v) => {
    const ok = await notify.confirm({
      title: `Chặn ${v.ip}?`,
      message: `${place(v.geo)} · ${v.geo?.isp || "nhà mạng chưa rõ"}. Chặn 7 ngày ở máy chủ, và ở tường lửa Cloudflare nếu đã cấu hình.${v.email ? ` IP này đang gắn với thành viên ${v.email}.` : ""}`,
      confirmText: "Chặn 7 ngày",
      danger: true,
    });
    if (ok) run(`block:${v.ip}`, () => api.post("/admin/security/block-ip", { ip: v.ip, days: 7 }), "Đã chặn.");
  };

  const setSwitch = (key, value) => {
    const go = () => run(`sw:${key}`, () => api.post("/admin/control/switches", { [key]: value }), "Đã lưu.");
    if (key === "maintenanceMode" && value) {
      notify.confirm({ title: "Bật bảo trì?", message: "Mọi thành viên sẽ bị đưa ra trang bảo trì ngay.", confirmText: "Bật", danger: true }).then((ok) => ok && go());
    } else go();
  };

  if (error && !state) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center">
        <p role="alert" className="text-[15px] text-foreground">{error}</p>
        <button type="button" onClick={load} className="mt-4 min-h-11 rounded-xl bg-foreground px-5 text-[15px] font-semibold text-background">Thử lại</button>
      </div>
    );
  }
  if (!state) return <p className="p-10 text-center text-sm text-muted-foreground">Đang tải Trung Tâm Điều Khiển…</p>;

  const { attention, visitors: vs, health, security, errors, audit, switches } = state;
  const quotaPct = Math.min(100, Math.round((health.quota?.level || 0) * 100));
  const ad = data?.advertisement || {};

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* Cần để ý — suy ra từ chính số liệu bên dưới, bấm là tới chỗ xử lý */}
      <Card id="attention" title="Cần để ý" icon="notifications_active">
        {attention.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Mọi thứ đang ổn. Không có việc gì cần anh/chị ra tay.</p>
        ) : (
          <ul className="space-y-1">
            {attention.map((a, i) => (
              <li key={i}>
                <button type="button" onClick={() => jump(a.target)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] text-foreground hover:bg-muted">
                  <span className={`size-2 shrink-0 rounded-full ${LEVEL_DOT[a.level]}`} aria-hidden />
                  <span className="flex-1">{a.text}</span>
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground" aria-hidden>chevron_right</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Đang online" value={fmt(vs.online)} sub={`${fmt(vs.members)} thành viên trong 24 giờ`} onClick={() => { setFilter("online"); jump("visitors"); }} />
        <Stat label="Khách 24 giờ" value={fmt(vs.total)} sub={`${fmt(vs.bots)} bot / máy chủ`} onClick={() => jump("visitors")} />
        <Stat label="Thành viên" value={fmt(health.users)} sub={`+${fmt(health.newUsers24h)} hôm nay`} onClick={() => openData("bios")} />
        <Stat label="Lỗi 24 giờ" value={fmt(health.errors24h)} sub={`${fmt(security.events24h)} sự kiện an ninh`} onClick={() => jump("errors")} />
      </div>

      {/* Khách truy cập thật */}
      <Card id="visitors" title="Khách truy cập" icon="public"
        action={<span className="text-xs text-muted-foreground">24 giờ qua · cập nhật 20 giây</span>}>
        <VisitorMap visitors={visitors} focus={focus} onPick={pickVisitor} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-600" />Đang online</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-500" />Đã rời</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-600" />Đáng ngờ / bị chặn / VPN</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Theo quốc gia</h3>
            <ul className="space-y-1 text-sm">
              {vs.countries.map((c) => (
                <li key={c.name} className="flex justify-between gap-2"><span className="truncate text-foreground">{c.name}</span><span className="tabular-nums text-muted-foreground">{c.count}</span></li>
              ))}
              {!vs.countries.length && <li className="text-muted-foreground">Chưa có lượt nào.</li>}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Trang được xem nhiều</h3>
            <ul className="space-y-1 text-sm">
              {vs.pages.map((p) => (
                <li key={p.name} className="flex justify-between gap-2"><span className="truncate font-mono text-[13px] text-foreground">{p.name}</span><span className="tabular-nums text-muted-foreground">{p.count}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc khách">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                className={`min-h-9 rounded-full border px-3 text-sm ${filter === f.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm IP, email, thành phố, trang…" aria-label="Tìm khách"
            className="min-h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm sm:max-w-xs sm:flex-none" />
        </div>

        <ul className="mt-3 max-h-[520px] divide-y divide-border overflow-y-auto rounded-2xl border border-border">
          {shown.slice(0, 200).map((v) => (
            <li key={v.ip} className={`flex flex-wrap items-center gap-x-3 gap-y-2 p-3 ${focusIp === v.ip ? "bg-muted/60" : ""}`}>
              <button type="button" onClick={() => setFocusIp(v.ip)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${v.online ? "bg-green-600" : "bg-muted-foreground/40"}`} aria-label={v.online ? "Đang online" : "Đã rời"} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-foreground">
                    {place(v.geo)}{v.geo?.region && v.geo.region !== v.geo.city ? ` · ${v.geo.region}` : ""}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono">{v.ip}</span> · {v.geo?.isp || "—"} · {v.device === "bot" ? "Bot" : `${v.browser} ${v.device === "mobile" ? "di động" : v.device === "tablet" ? "máy tính bảng" : "máy tính"}`}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono">{v.page}</span> · {v.views} lượt · {ago(v.lastSeen)}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {v.blocked && <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">Đang bị chặn</span>}
                    {v.flagged && <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">Có sự kiện an ninh</span>}
                    {v.geo?.proxy && <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">VPN / proxy</span>}
                    {v.geo?.hosting && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Máy chủ thuê</span>}
                  </span>
                </span>
              </button>
              {v.email && (
                <button type="button" onClick={() => onOpenMember(v.email)} className="min-h-9 max-w-full truncate rounded-full border border-border px-3 text-sm text-foreground hover:bg-muted">
                  {v.email}
                </button>
              )}
              {!v.blocked && (
                <button type="button" disabled={busy === `block:${v.ip}`} onClick={() => blockIp(v)}
                  className="min-h-9 rounded-full px-3 text-sm font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400">
                  Chặn
                </button>
              )}
            </li>
          ))}
          {!shown.length && <li className="p-6 text-center text-sm text-muted-foreground">Không có khách khớp bộ lọc.</li>}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Vị trí theo IP (ip-api.com), chính xác tới thành phố, không phải địa chỉ nhà. Lịch sử giữ trong RAM máy chủ, khởi động lại là xoá.</p>
      </Card>

      {/* An ninh */}
      <Card id="security" title="An ninh" icon="shield" action={<LinkButton onClick={() => openData("security-events")}>Mọi sự kiện</LinkButton>}>
        <h3 className="mb-2 text-sm font-medium text-foreground">Chờ duyệt ({security.pending.length})</h3>
        {security.pending.length === 0 ? <p className="mb-5 text-sm text-muted-foreground">Không có ca nào chờ.</p> : (
          <ul className="mb-5 space-y-2">
            {security.pending.map((m) => (
              <li key={m.caseId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-foreground">{m.subjectValue}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.category} · {m.severity} · {m.path || "—"} · {ago(m.createdAt)}</p>
                </div>
                <button type="button" disabled={busy === m.caseId} onClick={() => run(m.caseId, () => api.post("/admin/security/resolve-moderation", { caseId: m.caseId, action: "dismiss" }))}
                  className="min-h-9 rounded-full border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50">Bỏ qua</button>
                <button type="button" disabled={busy === m.caseId} onClick={() => run(m.caseId, () => api.post("/admin/security/resolve-moderation", { caseId: m.caseId, action: "approve" }))}
                  className="min-h-9 rounded-full bg-rose-600 px-3 text-sm font-medium text-white disabled:opacity-50">Chặn</button>
              </li>
            ))}
          </ul>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Đang chặn ({security.blocks.length})</h3>
          <LinkButton onClick={() => openData("security-blocks")}>Bảng lệnh chặn</LinkButton>
        </div>
        {security.blocks.length === 0 ? <p className="mb-5 text-sm text-muted-foreground">Không chặn ai.</p> : (
          <ul className="mb-5 divide-y divide-border rounded-2xl border border-border">
            {security.blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {b.subjectType === "ip" ? "IP" : b.subjectType === "email" ? "Tài khoản" : "Số điện thoại"}
                    {b.edgeIp ? <span className="font-mono"> {b.edgeIp}</span> : null} · {b.reasonCode}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.permanent ? "Vĩnh viễn" : `Tới ${new Date(b.expiresAt).toLocaleString("vi-VN")}`}{b.edgeIp ? " · Cloudflare" : ""}{b.caseId ? ` · ${b.caseId}` : ""}
                  </p>
                </div>
                <button type="button" disabled={busy === `un:${b.id}`} onClick={() => run(`un:${b.id}`, () => api.post("/admin/security/unblock-actor", { blockId: b.id }))}
                  className="min-h-9 rounded-full border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50">Gỡ chặn</button>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 text-sm font-medium text-foreground">Sự kiện gần đây</h3>
        <ul className="space-y-1 text-sm">
          {security.recentEvents.map((e) => (
            <li key={e.caseId} className="flex gap-3">
              <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{ago(e.createdAt)}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{e.category} · {e.action}{e.network ? ` · ${e.network}` : ""}</span>
              <span className="hidden max-w-[40%] truncate font-mono text-xs text-muted-foreground sm:block">{e.path}</span>
            </li>
          ))}
          {!security.recentEvents.length && <li className="text-muted-foreground">Chưa có sự kiện.</li>}
        </ul>
      </Card>

      {/* Công tắc — chỉ những cái server thật sự thi hành */}
      <Card id="switches" title="Công tắc hệ thống" icon="toggle_on">
        <ul className="divide-y divide-border">
          {SWITCHES.map((s) => (
            <li key={s.key} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-foreground">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <Toggle label={s.label} on={Boolean(switches[s.key])} disabled={busy === `sw:${s.key}`} onChange={(v) => setSwitch(s.key, v)} />
            </li>
          ))}
          <li className="flex flex-wrap items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-foreground">Thử thách Cloudflare khẩn cấp</p>
              <p className="text-sm text-muted-foreground">Bắt mọi người lạ mở trang qua bước kiểm tra của Cloudflare. Dùng khi bị dội truy cập; khiên tự động cũng gạt được.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy === "em"} onClick={() => run("em", () => api.post("/admin/control/emergency", { on: true }), "Đã bật thử thách.")}
                className="min-h-9 rounded-full bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50">Bật</button>
              <button type="button" disabled={busy === "em"} onClick={() => run("em", () => api.post("/admin/control/emergency", { on: false }), "Đã tắt thử thách.")}
                className="min-h-9 rounded-full border border-border px-3 text-sm text-foreground disabled:opacity-50">Tắt</button>
            </div>
          </li>
        </ul>
      </Card>

      {/* Sức khoẻ */}
      <Card id="health" title="Sức khoẻ máy chủ" icon="monitor_heart">
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div><dt className="text-muted-foreground">Cơ sở dữ liệu</dt><dd className="text-[15px] font-medium text-foreground">{health.db}</dd></div>
          <div><dt className="text-muted-foreground">RAM</dt><dd className="text-[15px] font-medium text-foreground">{health.rssMb} / 512 MB</dd></div>
          <div><dt className="text-muted-foreground">Chạy liên tục</dt><dd className="text-[15px] font-medium text-foreground">{Math.floor(health.uptimeSec / 3600)} giờ {Math.floor((health.uptimeSec % 3600) / 60)} phút</dd></div>
          <div>
            <dt className="text-muted-foreground">Bot Telegram</dt>
            <dd className="text-[15px] font-medium text-foreground">{!tg ? "Đang kiểm tra…" : tg.configured && tg.botOk ? `@${tg.botUsername || "bot"} ổn` : "Mất kết nối"}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hạn mức AI hôm nay</span><span className="tabular-nums text-foreground">{quotaPct}%</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full ${quotaPct >= 85 ? "bg-rose-500" : quotaPct >= 60 ? "bg-amber-500" : "bg-foreground"}`} style={{ width: `${quotaPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{fmt(health.quota?.rpd)}/{fmt(health.quota?.rpdLimit)} lượt · {fmt(health.quota?.tokensToday)} token · chạm trần là tự dừng, không tính tiền.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy === "tg"} onClick={() => run("tg", () => api.post("/telegram/test", {}), "Đã gửi tin thử — xem Telegram.")}
            className="min-h-9 rounded-full border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50">Gửi tin thử Telegram</button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card id="errors" title="Lỗi gần đây" icon="bug_report" action={<LinkButton onClick={() => openData("error-logs")}>Tất cả</LinkButton>}>
          <ul className="space-y-3">
            {errors.map((e) => (
              <li key={e._id} className="text-sm">
                <p className="break-words text-foreground">{e.message}</p>
                <p className="truncate text-xs text-muted-foreground">{e.source} · {e.path || "—"} · {ago(e.createdAt)}</p>
              </li>
            ))}
            {!errors.length && <li className="text-sm text-muted-foreground">Không có lỗi. Hệ thống chạy sạch.</li>}
          </ul>
        </Card>
        <Card id="audit" title="Thao tác quản trị" icon="history" action={<LinkButton onClick={() => openData("audit-logs")}>Tất cả</LinkButton>}>
          <ul className="space-y-3">
            {audit.map((a) => (
              <li key={a._id} className="text-sm">
                <p className="text-foreground">{a.action}{a.targetEmail ? ` · ${a.targetEmail}` : ""}</p>
                <p className="truncate text-xs text-muted-foreground">{a.adminUsername} · {typeof a.details?.note === "string" ? a.details.note : ""} · {ago(a.createdAt)}</p>
              </li>
            ))}
            {!audit.length && <li className="text-sm text-muted-foreground">Chưa có thao tác nào.</li>}
          </ul>
        </Card>
      </div>

      {/* Banner quảng cáo toàn trang (GlobalAdBanner) */}
      <Card id="ad" title="Banner quảng cáo" icon="campaign">
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <div className="relative aspect-[3/1] overflow-hidden rounded-2xl border border-dashed border-border bg-muted">
            {ad.imageUrl ? <img src={ad.imageUrl} alt="Banner hiện tại" className="size-full object-cover" /> : (
              <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{uploadingAd ? "Đang tải…" : "Chưa có ảnh"}</span>
            )}
          </div>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">Liên kết khi bấm</span>
              <input type="url" defaultValue={ad.linkUrl || ""} onBlur={(e) => e.target.value !== (ad.linkUrl || "") && updateAdvertisement({ linkUrl: e.target.value.trim() })}
                placeholder="https://…" className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[15px]" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-border px-3 text-sm text-foreground hover:bg-muted">
                {ad.imageUrl ? "Đổi ảnh" : "Tải ảnh lên"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleAdImageUpload} disabled={uploadingAd} />
              </label>
              {ad.imageUrl && <button type="button" onClick={handleAdDelete} className="min-h-9 rounded-full px-3 text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">Xoá ảnh</button>}
              <span className="ml-auto flex items-center gap-3 text-sm text-foreground">
                Hiển thị
                <Toggle label="Hiển thị banner" on={Boolean(ad.isActive)} disabled={!ad.imageUrl} onChange={(v) => updateAdvertisement({ isActive: v })} />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
