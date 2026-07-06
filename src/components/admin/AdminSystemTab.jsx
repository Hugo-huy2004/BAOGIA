import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api/BaseApi";

// Admin "Giám sát hệ thống" — the supreme control panel: live vitals, AI quota,
// the community-bot kill-switch, and the persistent error log viewer.
const LEVEL_META = {
  error: { label: "Lỗi", cls: "bg-rose-500/12 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  warn: { label: "Cảnh báo", cls: "bg-amber-500/12 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  info: { label: "Thông tin", cls: "bg-sky-500/12 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
};

const fmt = (n) => (n ?? 0).toLocaleString("vi-VN");
const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(d).toLocaleString("vi-VN");
};

function Stat({ icon, label, value, accent = "text-foreground", sub }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={`material-symbols-outlined text-[18px] ${accent}`}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AdminSystemTab({ showNotification }) {
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [last24h, setLast24h] = useState({ error: 0, warn: 0, info: 0 });
  const [levelFilter, setLevelFilter] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    try { const d = await api.get("/admin/system-overview"); if (d.success) setOverview(d); } catch { /* ignore */ }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const d = await api.get(`/admin/error-logs?limit=100${levelFilter ? `&level=${levelFilter}` : ""}`);
      if (d.success) { setLogs(d.logs || []); setLast24h(d.last24h || { error: 0, warn: 0, info: 0 }); }
    } catch { /* ignore */ }
  }, [levelFilter]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadLogs(); }, [loadLogs]);
  // Auto-refresh vitals + logs every 15s.
  useEffect(() => {
    const t = setInterval(() => { loadOverview(); loadLogs(); }, 15000);
    return () => clearInterval(t);
  }, [loadOverview, loadLogs]);

  const toggleBot = async () => {
    if (!overview) return;
    setBusy(true);
    try {
      const d = await api.post("/admin/community-bot", { enabled: !overview.botEnabled });
      if (d.success) { setOverview((o) => ({ ...o, botEnabled: d.botEnabled })); showNotification?.(d.botEnabled ? "Đã bật bot cộng đồng" : "Đã tắt bot cộng đồng", "success"); }
    } catch { showNotification?.("Không đổi được trạng thái bot", "error"); }
    finally { setBusy(false); }
  };

  const clearLogs = async () => {
    if (!window.confirm(levelFilter ? `Xóa toàn bộ log mức "${levelFilter}"?` : "Xóa TẤT CẢ log lỗi?")) return;
    try {
      const d = await api.delete(`/admin/error-logs${levelFilter ? `?level=${levelFilter}` : ""}`);
      if (d.success) { showNotification?.(`Đã xóa ${d.deleted} log`, "success"); loadLogs(); }
    } catch { showNotification?.("Không xóa được log", "error"); }
  };

  const q = overview?.quota;
  const quotaPct = Math.min(100, Math.round((q?.level || 0) * 100));
  const quotaColor = quotaPct >= 85 ? "bg-rose-500" : quotaPct >= 60 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Vitals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat icon="group" label="Thành viên" value={fmt(overview?.users)} sub={`+${fmt(overview?.newUsers24h)} trong 24h`} accent="text-indigo-500" />
        <Stat icon="forum" label="Bài công khai" value={fmt(overview?.posts)} sub={`${fmt(overview?.pendingPosts)} chờ duyệt`} accent="text-sky-500" />
        <Stat icon="bolt" label="JOY lưu hành" value={fmt(overview?.joyCirculating)} accent="text-amber-500" />
        <Stat icon="error" label="Lỗi 24h" value={fmt(overview?.errors24h)} accent={overview?.errors24h ? "text-rose-500" : "text-emerald-500"} sub={overview ? `uptime ${Math.floor((overview.uptimeSec || 0) / 60)} phút` : ""} />
      </div>

      {/* AI health + bot control */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-black text-foreground"><span className="material-symbols-outlined text-[18px] text-indigo-500">smart_toy</span>Sức khỏe AI (Gemini)</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${q?.healthy ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/12 text-rose-600 dark:text-rose-400"}`}>{q?.healthy ? "Khỏe" : "Đang tải nặng"}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className={`h-full ${quotaColor} transition-all`} style={{ width: `${quotaPct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Dùng {quotaPct}% hạn mức · RPM {q?.rpm ?? "—"}/{q?.rpmLimit ?? "—"} · Ngày {q?.rpd ?? "—"}/{q?.rpdLimit ?? "—"} · {fmt(q?.tokensToday)} token
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-black text-foreground"><span className="material-symbols-outlined text-[18px] text-violet-500">robot_2</span>Bot đăng bài cộng đồng</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{overview?.botEnabled ? "Đang chạy — tự đăng & nhường quota khi tải cao" : "Đang tắt"}</p>
          </div>
          <button
            type="button"
            onClick={toggleBot}
            disabled={busy || !overview}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${overview?.botEnabled ? "bg-emerald-500" : "bg-foreground/25"}`}
            aria-label="Bật/tắt bot"
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${overview?.botEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Error log viewer */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <p className="mr-auto flex items-center gap-1.5 text-sm font-black text-foreground"><span className="material-symbols-outlined text-[18px] text-rose-500">bug_report</span>Nhật ký lỗi</p>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-foreground/[0.03] p-0.5">
            {[{ k: "", label: "Tất cả" }, { k: "error", label: `Lỗi ${last24h.error || ""}` }, { k: "warn", label: "Cảnh báo" }, { k: "info", label: "Info" }].map((f) => (
              <button key={f.k} onClick={() => setLevelFilter(f.k)} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${levelFilter === f.k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
            ))}
          </div>
          <button onClick={clearLogs} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 px-2.5 py-1 text-[11px] font-bold text-rose-500 transition hover:bg-rose-500/10">
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>Xóa
          </button>
        </div>

        <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center text-muted-foreground">
              <span className="material-symbols-outlined text-4xl text-emerald-500/60">verified</span>
              <p className="mt-2 text-sm font-bold text-foreground">Không có lỗi nào</p>
              <p className="text-[11px]">Hệ thống đang chạy sạch.</p>
            </div>
          ) : (
            logs.map((log) => {
              const meta = LEVEL_META[log.level] || LEVEL_META.error;
              const open = expanded === log._id;
              return (
                <div key={log._id} className="p-3">
                  <button onClick={() => setExpanded(open ? null : log._id)} className="flex w-full items-start gap-2 text-left">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${meta.cls}`}>{meta.label}</span>
                        <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">{log.source}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(log.createdAt)}</span>
                        {log.path && <span className="truncate text-[10px] font-mono text-muted-foreground">{log.path}</span>}
                      </div>
                      <p className="mt-1 break-words text-[13px] font-semibold text-foreground">{log.message}</p>
                      {open && (log.stack || Object.keys(log.meta || {}).length > 0) && (
                        <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-foreground/[0.05] p-2 text-[10.5px] leading-relaxed text-muted-foreground">
                          {log.stack || ""}
                          {log.meta && Object.keys(log.meta).length > 0 ? `\n\nmeta: ${JSON.stringify(log.meta, null, 2)}` : ""}
                        </pre>
                      )}
                    </div>
                    <span className={`material-symbols-outlined text-[18px] text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
