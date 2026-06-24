import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge, StatusDot } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import { Spinner } from "../ui/Spinner";
import { getAiUrl } from "../../services/api";

const VITE_API = import.meta.env.VITE_API_URL;

// Resolved the same way aiFetch() resolves it: explicit VITE_AI_URL, else
// derived from VITE_API_URL (api. → ai.), else from the current hostname.
// Falling back to a bare relative path here used to 405 in production
// whenever VITE_AI_URL wasn't set — Vercel's SPA rewrite serves index.html
// for any unmatched path, and a POST against that static resource is 405.
const AI_BASE = getAiUrl();

async function apiFetch(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

// Rendered both as the dashboard card AND (via SosOverlay below) as a
// full-screen takeover the instant a high-severity flag lands, so Admin
// notices it within one polling cycle, not just when they happen to scroll
// to the dashboard's crisis card.
function CrisisAlertsCard({ alerts, onResolve }) {
  const { t } = useTranslation();
  if (!alerts.length) return null;
  return (
    <div className="rounded-2xl border-2 border-destructive bg-destructive/5 p-5 space-y-3 animate-pulse-slow">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-destructive text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
        <h3 className="text-sm font-extrabold text-destructive">{t("adminDashboard.crisisAlerts.title", "Cảnh báo khủng hoảng tâm lý")} ({alerts.length})</h3>
      </div>
      <div className="space-y-2">
        {alerts.map(a => (
          <div key={a.flagId} className="p-3 rounded-xl bg-card border border-destructive/20 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{a.displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{a.trigger || "—"} · {new Date(a.detectedAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {a.phone && (
                  <a href={`tel:${a.phone}`} className="px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">call</span> {a.phone}
                  </a>
                )}
                <a href={`mailto:${a.email}`} className="text-[10px] font-bold text-primary hover:underline whitespace-nowrap">
                  {a.email}
                </a>
              </div>
            </div>
            {a.conversationSummary && (
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-2 max-h-32 overflow-y-auto font-sans">{a.conversationSummary}</pre>
            )}
            <button
              onClick={() => onResolve?.(a)}
              className="text-[10px] font-bold text-emerald-600 hover:underline"
            >
              Đánh dấu đã xử lý
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full-viewport flashing red takeover — shown above everything else in
// AdminPanel the moment any unresolved high-severity flag exists, so it's
// impossible to miss even if Admin isn't currently looking at the dashboard.
export function SosOverlay({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  const latest = alerts[0];
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="animate-sos-flash bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-extrabold pointer-events-auto shadow-lg">
        <span className="material-symbols-outlined animate-pulse">emergency</span>
        SOS — {latest.displayName} vừa gửi tín hiệu cần giúp đỡ khẩn cấp ({alerts.length} cảnh báo chưa xử lý)
        {latest.phone && (
          <a href={`tel:${latest.phone}`} className="underline font-black">Gọi ngay {latest.phone}</a>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, text, sub, time }) {
  const colors = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info:    "bg-info/10 text-info",
    accent:  "bg-accent/10 text-accent",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${colors[color] || colors.info}`}>
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground truncate">{text}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub}</p>}
      </div>
      {time && <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-1">{time}</span>}
    </div>
  );
}

function StorageBar({ label, sizeInBytes, maxInBytes = 2 * 1024 * 1024 * 1024 }) {
  const percent = Math.min((sizeInBytes / maxInBytes) * 100, 100);
  const sizeMb = (sizeInBytes / (1024 * 1024)).toFixed(2);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span className={percent > 80 ? "text-destructive" : percent > 60 ? "text-warning" : "text-primary"}>
          {sizeMb} MB
        </span>
      </div>
      <Progress value={percent} color={percent > 80 ? "destructive" : percent > 60 ? "warning" : "primary"} />
    </div>
  );
}

export default function AdminDashboard({ stats, bookings, totalProjects, totalPackages, openTickets, loading, crisisAlerts = [], onResolveCrisisAlert }) {
  const { t } = useTranslation();
  const [recentUsers, setRecentUsers] = useState([]);
  const [storageStats, setStorageStats] = useState({ publicFiles: 0, database: 0, total: 0 });

  useEffect(() => {
    apiFetch(`${VITE_API}/admin/system-storage`)
      .then(res => setStorageStats(res.data || { publicFiles: 0, database: 0, total: 0 }))
      .catch(() => {});
  }, []);

  const pendingBookings = bookings.filter(b => !b.contacted).length;
  const totalUsers = stats.total || 0;

  useEffect(() => {
    apiFetch(`${VITE_API}/bios?limit=5&sortBy=createdAt&sortOrder=desc`)
      .then(res => setRecentUsers(Array.isArray(res) ? res : (res.bios || [])))
      .catch(() => {});
  }, []);

  function fmtTime(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return t("adminDashboard.time.just_now");
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t("adminDashboard.time.minutes_ago")}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t("adminDashboard.time.hours_ago")}`;
    return `${Math.floor(diff / 86400000)} ${t("adminDashboard.time.days_ago")}`;
  }

  const statusInfo = {
    active:   { label: t("adminDashboard.statusInfo.active"),   color: "success" },
    pending:  { label: t("adminDashboard.statusInfo.pending"),  color: "warning" },
    locked:   { label: t("adminDashboard.statusInfo.locked"),   color: "destructive" },
    rejected: { label: t("adminDashboard.statusInfo.rejected"), color: "muted" },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-xl" />
            <div className="h-7 w-16 bg-muted rounded-lg" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <CrisisAlertsCard alerts={crisisAlerts} onResolve={onResolveCrisisAlert} />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="group" label={t("adminDashboard.kpi.totalUsers")} value={totalUsers} color="primary" />
        <StatCard icon="check_circle" label={t("adminDashboard.kpi.active")} value={stats.active || 0} color="success" />
        <StatCard icon="pending" label={t("adminDashboard.kpi.pending")} value={stats.pending || 0} color="warning" />
        <StatCard icon="lock" label={t("adminDashboard.kpi.locked")} value={stats.locked || 0} color="destructive" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="calendar_month" label={t("adminDashboard.kpi.newBookings")} value={pendingBookings} color="info" />
        <StatCard icon="assignment"     label={t("adminPanel.sidebar.projects", "Dự án")} value={totalProjects || 0} color="accent" />
        <StatCard icon="featured_play_list" label={t("adminDashboard.kpi.packages")} value={totalPackages || 0} color="secondary" />
        <StatCard icon="support_agent"  label={t("adminDashboard.kpi.openTickets")} value={openTickets || 0} color="warning" />
      </div>

      {/* ── Main 3-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Users */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">person_add</span>
              {t("adminDashboard.recentUsers.title")}
            </CardTitle>
            <a href="#" onClick={e => { e.preventDefault(); document.querySelector('[data-tab="users"]')?.click(); }}
              className="text-[10px] font-bold text-primary hover:underline">
              {t("adminDashboard.recentUsers.viewAll")}
            </a>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">{t("adminDashboard.recentUsers.empty")}</div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentUsers.slice(0, 6).map(u => (
                  <div key={u._id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                        : <span className="text-xs font-black text-primary">{(u.displayName || u.email || "?").slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{u.displayName || u.email}</p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusDot status={u.status} />
                      <Badge variant={statusInfo[u.status]?.color === "success" ? "success" : statusInfo[u.status]?.color === "warning" ? "warning" : "muted"} size="xs">
                        {statusInfo[u.status]?.label || u.status}
                      </Badge>
                    </div>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap hidden sm:block">{fmtTime(u.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">

          {/* User distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">donut_large</span>
                {t("adminDashboard.distribution.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {totalUsers > 0 ? [
                { label: t("adminDashboard.distribution.activeLabel"),   value: stats.active || 0, color: "success" },
                { label: t("adminDashboard.distribution.pendingLabel"),  value: stats.pending || 0, color: "warning" },
                { label: t("adminDashboard.distribution.lockedLabel"),   value: stats.locked || 0, color: "destructive" },
                { label: t("adminDashboard.distribution.rejectedLabel"), value: stats.rejected || 0, color: "info" },
              ].map(item => (
                <Progress
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={totalUsers}
                  color={item.color}
                  showValue
                />
              )) : <p className="text-xs text-muted-foreground text-center py-4">{t("adminDashboard.distribution.empty")}</p>}
            </CardContent>
          </Card>

          {/* Data Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">cloud</span>
                DUNG LƯỢNG DỮ LIỆU
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <StorageBar label="Tài nguyên tĩnh (Uploads/Assets)" sizeInBytes={storageStats.publicFiles} maxInBytes={5 * 1024 * 1024 * 1024} />
              <StorageBar label="Cơ sở dữ liệu (MongoDB)" sizeInBytes={storageStats.database} maxInBytes={2 * 1024 * 1024 * 1024} />
              
              <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Tổng dung lượng</span>
                <span className="text-[11px] font-black text-foreground">{(storageStats.total / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Recent Bookings Activity ── */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              {t("adminDashboard.activity.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {bookings.slice(0, 5).map(b => (
              <ActivityItem
                key={b._id}
                icon={b.contacted ? "check_circle" : "calendar_month"}
                color={b.contacted ? "success" : "warning"}
                text={`${b.fullName} — ${b.email}`}
                sub={b.message?.slice(0, 60) + (b.message?.length > 60 ? "..." : "")}
                time={fmtTime(b.createdAt)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
