import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge, StatusDot } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import { Spinner } from "../ui/Spinner";

const VITE_API = import.meta.env.VITE_API_URL;

// In dev: VITE_AI_URL is empty → relative path goes through Vite proxy to Python server
// In prod: VITE_AI_URL is set → direct call to AI server
const AI_BASE = import.meta.env.VITE_AI_URL ?? "";

async function apiFetch(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

async function aiPost(path, body) {
  const r = await fetch(`${AI_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(import.meta.env.VITE_INTERNAL_API_KEY
        ? { "X-Internal-Key": import.meta.env.VITE_INTERNAL_API_KEY }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
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

function SystemHealthBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span className={value > 80 ? "text-destructive" : value > 60 ? "text-warning" : "text-success"}>
          {value}%
        </span>
      </div>
      <Progress value={value} color={value > 80 ? "destructive" : value > 60 ? "warning" : "success"} />
    </div>
  );
}

export default function AdminDashboard({ stats, bookings, partners, packageTemplates, tickets, loading }) {
  const { t } = useTranslation();
  const [recentUsers, setRecentUsers] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({ dbSize: 42, apiLoad: 28, cacheHit: 91, uptime: 99.9 });

  const pendingBookings = bookings.filter(b => !b.contacted).length;
  const pendingTickets  = tickets;
  const totalUsers      = stats.total || 0;

  useEffect(() => {
    apiFetch(`${VITE_API}/bios?limit=5&sortBy=createdAt&sortOrder=desc`)
      .then(res => setRecentUsers(Array.isArray(res) ? res : (res.bios || [])))
      .catch(() => {});
  }, []);

  const autoTriggeredRef = useRef(false);

  const fetchInsight = useCallback(async () => {
    setInsightLoading(true);
    try {
      const data = await aiPost("/api/ai/proactive-push", {
        logs: [
          {
            type: "admin_dashboard_analysis",
            context: "Đây là báo cáo tổng quan hệ thống cho Admin. Hãy đưa ra nhận xét và gợi ý hành động ưu tiên dựa trên các số liệu chi tiết về người dùng, lịch hẹn, đối tác và gói dịch vụ.",
            totalUsers,
            activeUsers: stats.active || 0,
            pendingUsers: stats.pending || 0,
            lockedUsers: stats.locked || 0,
            pendingBookings,
            pendingTickets,
            dashboardMetadata: {
              totalBookingsCount: bookings.length,
              pendingBookingsCount: pendingBookings,
              recentBookingsList: bookings.slice(0, 5).map(b => ({
                fullName: b.fullName,
                email: b.email,
                message: b.message ? b.message.slice(0, 50) : "",
                contacted: b.contacted,
                createdAt: b.createdAt
              })),
              partnersCount: partners.length,
              partnersList: partners.slice(0, 10).map(p => p.name),
              packageTemplatesCount: packageTemplates.length,
              packageTemplatesList: packageTemplates.map(pkg => pkg.name),
              pendingTicketsCount: pendingTickets
            },
            timestamp: new Date().toISOString(),
          }
        ]
      });
      // Response format: { should_send, title, body, reason }
      const insight = [data?.title, data?.body].filter(Boolean).join(" — ")
        || data?.reason
        || t("adminDashboard.aiInsight.defaultMessage");
      setAiInsight(insight);
    } catch (e) {
      setAiInsight(`${t("adminDashboard.aiInsight.connectionError")} ${e.message}`);
    } finally {
      setInsightLoading(false);
    }
  }, [totalUsers, pendingBookings, pendingTickets, stats, bookings, partners, packageTemplates]);

  useEffect(() => {
    if (totalUsers > 0 && Array.isArray(bookings) && Array.isArray(partners) && Array.isArray(packageTemplates)) {
      if (!autoTriggeredRef.current) {
        autoTriggeredRef.current = true;
        fetchInsight();
      }
    }
  }, [totalUsers, bookings, partners, packageTemplates, fetchInsight]);

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

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="group" label={t("adminDashboard.kpi.totalUsers")} value={totalUsers} color="primary" />
        <StatCard icon="check_circle" label={t("adminDashboard.kpi.active")} value={stats.active || 0} color="success" />
        <StatCard icon="pending" label={t("adminDashboard.kpi.pending")} value={stats.pending || 0} color="warning" />
        <StatCard icon="lock" label={t("adminDashboard.kpi.locked")} value={stats.locked || 0} color="destructive" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="calendar_month" label={t("adminDashboard.kpi.newBookings")} value={pendingBookings} color="info" />
        <StatCard icon="handshake"      label={t("adminDashboard.kpi.partners")}    value={partners.length} color="accent" />
        <StatCard icon="featured_play_list" label={t("adminDashboard.kpi.packages")} value={packageTemplates.length} color="secondary" />
        <StatCard icon="support_agent"  label={t("adminDashboard.kpi.openTickets")} value={pendingTickets} color="warning" />
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

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success text-base">monitor_heart</span>
                {t("adminDashboard.health.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <SystemHealthBar label="DB Usage" value={systemStats.dbSize} />
              <SystemHealthBar label="API Load" value={systemStats.apiLoad} />
              <SystemHealthBar label="Cache Hit Rate" value={100 - systemStats.cacheHit} />
              <div className="pt-1 flex items-center gap-2">
                <StatusDot status="online" />
                <span className="text-[11px] font-bold text-success">Uptime {systemStats.uptime}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── AI Insight Banner ── */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-primary mb-1">{t("adminDashboard.aiInsight.title")}</p>
              {insightLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner size="sm" />
                  <span>{t("adminDashboard.aiInsight.analyzing")}</span>
                </div>
              ) : aiInsight ? (
                <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("adminDashboard.aiInsight.placeholder")}
                </p>
              )}
            </div>
            <button
              onClick={fetchInsight}
              disabled={insightLoading}
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{insightLoading ? "hourglass_empty" : "psychology"}</span>
              {t("adminDashboard.aiInsight.analyzeBtn")}
            </button>
          </div>
        </CardContent>
      </Card>

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
