import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Input, Field } from "../ui/Input";
import { Switch } from "../ui/Switch";
import { getAiUrl } from "../../services/api";

// Resolved the same way aiFetch() resolves it: explicit VITE_AI_URL, else
// derived from VITE_API_URL (api. → ai.), else from the current hostname.
// Falling back to a bare relative path here used to 405 in production
// whenever VITE_AI_URL wasn't set — Vercel's SPA rewrite serves index.html
// for any unmatched path, and a POST against that static resource is 405.
const AI_BASE = getAiUrl();
const API_URL = import.meta.env.VITE_API_URL;

async function callAI(path, body) {
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

async function apiFetch(path, opts = {}) {
  const r = await fetch(`${API_URL}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

function InsightCard({ title, icon, content, color = "primary", loading, badge }) {
  const { t } = useTranslation();
  const isObject = typeof content === "object" && content !== null;
  const resolvedColor = (isObject && content.status && ["primary", "success", "warning", "destructive", "info"].includes(content.status)) 
    ? content.status 
    : color;
    
  const colorStyles = {
    primary:     { text: "text-primary animate-pulse-soft", bg: "bg-primary/10",     border: "border-primary/25",     bar: "bg-primary" },
    success:     { text: "text-success",                    bg: "bg-success/10",     border: "border-success/25",     bar: "bg-success" },
    warning:     { text: "text-warning",                    bg: "bg-warning/10",     border: "border-warning/25",     bar: "bg-warning" },
    destructive: { text: "text-destructive animate-pulse", bg: "bg-destructive/10", border: "border-destructive/25", bar: "bg-destructive" },
    info:        { text: "text-info",                       bg: "bg-info/10",        border: "border-info/25",        bar: "bg-info" }
  };
  
  const styles = colorStyles[resolvedColor] || colorStyles.primary;

  return (
    <Card className={`border ${styles.border} transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-card`}>
      <CardContent className="p-5 flex flex-col h-full justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.bg} ${styles.text}`}>
              <span className="material-symbols-outlined text-sm">{icon}</span>
            </div>
            <h4 className="text-xs font-black tracking-tight text-foreground uppercase">{isObject ? (content.title || title) : title}</h4>
            {badge && <Badge variant={resolvedColor === "warning" ? "warning" : resolvedColor === "destructive" ? "destructive" : "default"} size="xs">{badge}</Badge>}
          </div>

          {loading ? (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-6 justify-center">
              <Spinner size="sm" />
              <span className="font-bold tracking-wide uppercase text-[10px] animate-pulse">{t("adminAICenter.insightCard.loading")}</span>
            </div>
          ) : isObject ? (
            <div className="space-y-4">
              {content.error ? (
                <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive text-xs rounded-xl text-center font-bold">
                  {content.error}
                </div>
              ) : (
                <>
                  {/* Summary */}
                  {content.summary && (
                    <p className="text-[11.5px] text-muted-foreground font-semibold italic leading-relaxed">
                      "{content.summary}"
                    </p>
                  )}

                  {/* Progress gauge */}
                  {content.score !== undefined && (
                    <div className="space-y-1 bg-muted/20 dark:bg-muted/5 p-2.5 rounded-xl border border-border/25">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                        <span className="text-muted-foreground">{content.scoreLabel || t("adminAICenter.insightCard.scoreLabel")}</span>
                        <span className={`${styles.text} font-mono font-black`}>{content.score}%</span>
                      </div>
                      <div className="w-full bg-muted dark:bg-muted/30 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${styles.bar} rounded-full transition-all duration-700`} 
                          style={{ width: `${content.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metrics grid */}
                  {Array.isArray(content.metrics) && content.metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {content.metrics.map((m, idx) => {
                        const metricColorClass = 
                          m.status === "urgent" ? "text-destructive bg-destructive/5 border-destructive/10" : 
                          m.status === "warning" ? "text-warning bg-warning/5 border-warning/10" : 
                          "text-foreground bg-muted/40 dark:bg-muted/10 border-border/30";
                        return (
                          <div key={idx} className={`p-2.5 rounded-xl border flex flex-col justify-center ${metricColorClass}`}>
                            <span className="text-[9px] text-muted-foreground font-bold truncate uppercase tracking-tight">{m.label}</span>
                            <span className="text-xs font-black tracking-tight mt-0.5 truncate">{m.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bullets core findings */}
                  {Array.isArray(content.bullets) && content.bullets.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("adminAICenter.insightCard.coreFindings")}</h5>
                      <ul className="space-y-1.5 pl-0.5">
                        {content.bullets.map((b, idx) => (
                          <li key={idx} className="text-[10.5px] leading-relaxed text-foreground flex items-start gap-2 font-medium">
                            <span className="material-symbols-outlined text-[13px] text-emerald-555 mt-0.5 shrink-0">check_circle</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations list */}
                  {Array.isArray(content.recommendations) && content.recommendations.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border/40">
                      <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("adminAICenter.insightCard.suggestedActions")}</h5>
                      <div className="space-y-1.5">
                        {content.recommendations.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
                            <span className="material-symbols-outlined text-[13px] text-primary shrink-0 font-bold">bolt</span>
                            <span className="text-[10px] font-extrabold text-foreground leading-snug">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : content ? (
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic py-4 text-center">{t("adminAICenter.insightCard.empty")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAICenter({ stats, users, showNotification, systemSettings, updateSystemSettings }) {
  const { t } = useTranslation();
  const [analyses, setAnalyses] = useState({});
  const [loading,  setLoading]  = useState({});
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [autoActions, setAutoActions] = useState({
    autoApproveNew: systemSettings?.autoApproveNew ?? false,
    autoLockInactive: systemSettings?.autoLockInactive ?? false,
    alertCrisis: systemSettings?.alertCrisis ?? true
  });
  const [actionLog, setActionLog] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [userAnalysis, setUserAnalysis] = useState("");
  const [userAnalysisLoading, setUserAnalysisLoading] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      setAutoActions({
        autoApproveNew: systemSettings.autoApproveNew ?? false,
        autoLockInactive: systemSettings.autoLockInactive ?? false,
        alertCrisis: systemSettings.alertCrisis ?? true
      });
    }
  }, [systemSettings]);

  const handleToggle = async (key, val) => {
    setAutoActions(p => ({ ...p, [key]: val }));
    if (updateSystemSettings) {
      try {
        await updateSystemSettings({ [key]: val });
      } catch (err) {
        showNotification(`${t("adminAICenter.automation.settingsError")} ${err.message}`, "error");
      }
    }
  };

  const autoTriggeredRef = useRef(false);

  const getSystemMetadata = () => {
    if (!Array.isArray(users)) return {};
    
    // Recent registrations (limit to 10)
    const recentUsersList = users.slice(0, 10).map(u => ({
      email: u.email,
      displayName: u.displayName || "Chưa đặt tên",
      status: u.status,
      createdAt: u.createdAt,
      schoolName: u.verificationRequest?.schoolName || "N/A",
      schoolLevel: u.verificationRequest?.schoolLevel || "N/A"
    }));

    // Student stats
    const studentCount = users.filter(u => u.email?.endsWith(".edu") || u.email?.endsWith(".edu.vn") || u.verificationRequest?.schoolName).length;
    const nonStudentCount = users.length - studentCount;

    // School frequencies
    const schoolCounts = {};
    users.forEach(u => {
      const school = u.verificationRequest?.schoolName;
      if (school) {
        schoolCounts[school] = (schoolCounts[school] || 0) + 1;
      }
    });
    const topSchools = Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    // Verification details
    const pendingVerificationCount = users.filter(u => u.verificationRequest?.submitted && u.status === "pending").length;

    // Expiring accounts within 30 days
    const expiringSoonCount = users.filter(u => {
      if (!u.expiresAt) return false;
      const diff = new Date(u.expiresAt) - new Date();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;

    return {
      recentUsersList,
      studentCount,
      nonStudentCount,
      topSchools,
      pendingVerificationCount,
      expiringSoonCount,
      activeAutomations: autoActions,
    };
  };

  const ANALYSIS_PROMPTS = {
    user_health: "Phân tích sức khỏe tổng thể của cộng đồng người dùng. Chú ý tỉ lệ email edu/student, tỉ lệ pending/locked so với active. Đưa ra nhận xét về tình trạng người dùng, danh sách các trường học tiêu biểu và gợi ý cải thiện.",
    risk:        "Phát hiện rủi ro bảo mật và vận hành hệ thống. Đặc biệt chú ý số tài khoản bị khóa, số yêu cầu xác minh email học sinh pending lâu, và số tài khoản sắp hết hạn sử dụng. Đề xuất hành động ưu tiên bảo mật.",
    growth:      "Phân tích xu hướng tăng trưởng dựa trên số liệu hiện tại và cơ cấu tài khoản sinh viên (.edu). Đưa ra dự báo và gợi ý chiến lược phát triển nền tảng, thu hút học sinh/sinh viên các trường học.",
    recommendations: "Là Admin, bạn nên làm gì ngay bây giờ? Liệt kê 3-5 hành động ưu tiên theo thứ tự quan trọng dựa trên số liệu chi tiết hệ thống và các yêu cầu xác minh chưa duyệt.",
  };

  async function analyzeSystem(type) {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const metadata = getSystemMetadata();
      const data = await callAI("/api/ai/proactive-push", {
        logs: [{
          type: "admin_system_analysis",
          analysisType: type,
          context: ANALYSIS_PROMPTS[type] || "Phân tích hệ thống.",
          totalUsers: stats.total,
          activeUsers: stats.active,
          pendingUsers: stats.pending,
          lockedUsers: stats.locked,
          systemMetadata: metadata,
          timestamp: new Date().toISOString(),
        }]
      });
      setAnalyses(p => ({ ...p, [type]: data }));
    } catch (e) {
      setAnalyses(p => ({ ...p, [type]: { error: `Lỗi kết nối: ${e.message}` } }));
    }
    setLoading(p => ({ ...p, [type]: false }));
  }

  // Auto-run evaluation once stats and users lists are available on mount
  useEffect(() => {
    if (stats && stats.total > 0 && Array.isArray(users) && users.length > 0) {
      if (!autoTriggeredRef.current) {
        autoTriggeredRef.current = true;
        const types = ["user_health", "risk", "growth", "recommendations"];
        types.forEach(type => {
          analyzeSystem(type);
        });
      }
    }
  }, [stats, users]);

  async function analyzeUserByEmail() {
    if (!userQuery.trim()) return;
    setUserAnalysisLoading(true);
    try {
      const res = await apiFetch(`/bios/me?email=${encodeURIComponent(userQuery.trim())}`);
      const profile = res?.bio || res;
      const data = await callAI("/api/ai/proactive-push", {
        logs: [{
          type: "admin_user_profile_analysis",
          context: "Admin yêu cầu phân tích hồ sơ người dùng này. Đánh giá tình trạng tài khoản, thời gian sử dụng, và đưa ra gợi ý cho admin.",
          userProfile: {
            email: profile?.email,
            displayName: profile?.displayName,
            status: profile?.status,
            createdAt: profile?.createdAt,
            expiresAt: profile?.expiresAt,
            packages: profile?.packages?.length || 0,
          },
        }]
      });
      const result = [data?.title, data?.body].filter(Boolean).join("\n\n")
        || data?.reason
        || t("adminAICenter.userDeepDive.noInfo");
      setUserAnalysis(result);
    } catch (e) {
      setUserAnalysis(`${t("adminAICenter.userDeepDive.error")} ${e.message}`);
    }
    setUserAnalysisLoading(false);
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    setBroadcastLoading(true);
    try {
      const target = broadcastTarget === "all" ? { all: true } : { status: broadcastTarget };
      await apiFetch("/data/broadcast-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: broadcastMsg, ...target })
      });
      showNotification(t("adminAICenter.broadcast.success"), "success");
      setBroadcastMsg("");
      setActionLog(p => [{ text: `Broadcast gửi tới "${broadcastTarget}": ${broadcastMsg.slice(0, 50)}...`, time: new Date().toLocaleTimeString("vi-VN"), icon: "campaign" }, ...p.slice(0, 9)]);
    } catch (e) {
      showNotification(`${t("adminAICenter.broadcast.error")} ${e.message}`, "error");
    }
    setBroadcastLoading(false);
  }

  async function runAutoAction(actionType) {
    try {
      let result = "";
      if (actionType === "approve_pending") {
        const res = await apiFetch("/bios/bulk-approve-pending", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
        result = t("adminAICenter.actionLog.approvedCount", { count: res?.count || 0 });
      } else if (actionType === "send_wellness_nudge") {
        const res = await apiFetch("/notifications/trigger-smart-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contextHint: "wellness_nudge" })
        });
        result = res?.message || t("adminAICenter.actionLog.wellnessNudgeSent");
      } else if (actionType === "generate_system_report") {
        const data = await callAI("/api/ai/proactive-push", {
          logs: [{ type: "system_report", stats, timestamp: new Date().toISOString() }]
        });
        result = data?.body || data?.message || t("adminAICenter.actionLog.reportGenerated");
      }
      showNotification(result || t("adminAICenter.actionLog.done"), "success");
      setActionLog(p => [{ text: result, time: new Date().toLocaleTimeString("vi-VN"), icon: "auto_fix_high" }, ...p.slice(0, 9)]);
    } catch (e) {
      showNotification(`${t("adminAICenter.actionLog.error")} ${e.message}`, "error");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="material-symbols-outlined text-white">auto_awesome</span>
        </div>
        <div>
          <h2 className="font-black text-lg text-foreground">{t("adminAICenter.header.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("adminAICenter.header.subtitle")}</p>
        </div>
      </div>

      {/* ── Quick AI Analyses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* User Health Analysis */}
        <InsightCard
          title={t("adminAICenter.cards.userHealth")}
          icon="psychology"
          color="primary"
          content={analyses.user_health}
          loading={loading.user_health}
        />

        {/* Risk Detection */}
        <InsightCard
          title={t("adminAICenter.cards.riskDetection")}
          icon="security"
          color="warning"
          badge={stats.locked > 0 ? t("adminAICenter.cards.lockedBadge", { count: stats.locked }) : null}
          content={analyses.risk}
          loading={loading.risk}
        />

        {/* Growth Insight */}
        <InsightCard
          title={t("adminAICenter.cards.growthTrend")}
          icon="trending_up"
          color="success"
          content={analyses.growth}
          loading={loading.growth}
        />

        {/* Recommendation */}
        <InsightCard
          title={t("adminAICenter.cards.recommendation")}
          icon="tips_and_updates"
          color="primary"
          content={analyses.recommendations}
          loading={loading.recommendations}
        />
      </div>

      {/* Analysis buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { type: "user_health",      label: t("adminAICenter.buttons.userHealth"),    icon: "group" },
          { type: "risk",             label: t("adminAICenter.buttons.risk"),          icon: "shield" },
          { type: "growth",           label: t("adminAICenter.buttons.growth"),        icon: "bar_chart" },
          { type: "recommendations",  label: t("adminAICenter.buttons.recommendations"), icon: "lightbulb" },
        ].map(a => (
          <Button
            key={a.type}
            variant="outline"
            size="sm"
            onClick={() => analyzeSystem(a.type)}
            disabled={loading[a.type]}
          >
            {loading[a.type] ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-sm">{a.icon}</span>}
            {a.label}
          </Button>
        ))}
      </div>

      {/* ── User Deep Dive ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">manage_search</span>
            {t("adminAICenter.userDeepDive.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              icon="search"
              placeholder={t("adminAICenter.userDeepDive.placeholder")}
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyzeUserByEmail()}
              className="flex-1"
            />
            <Button onClick={analyzeUserByEmail} disabled={userAnalysisLoading} size="md">
              {userAnalysisLoading ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-sm">psychology</span>}
              {t("adminAICenter.userDeepDive.analyzeBtn")}
            </Button>
          </div>
          {userAnalysis && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{userAnalysis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Broadcast Notifications ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">campaign</span>
            {t("adminAICenter.broadcast.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {["all", "active", "pending"].map(target => (
              <button
                key={target}
                onClick={() => setBroadcastTarget(target)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  broadcastTarget === target
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {target === "all" ? t("adminAICenter.broadcast.targetAll") : target === "active" ? t("adminAICenter.broadcast.targetActive") : t("adminAICenter.broadcast.targetPending")}
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/60 transition-all resize-none"
            rows={3}
            placeholder={t("adminAICenter.broadcast.placeholder")}
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
          />
          <Button onClick={sendBroadcast} disabled={broadcastLoading || !broadcastMsg.trim()} size="md">
            {broadcastLoading ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-sm">send</span>}
            {t("adminAICenter.broadcast.sendBtn")}
          </Button>
        </CardContent>
      </Card>

      {/* ── Automation Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
              {t("adminAICenter.automation.actionsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { type: "approve_pending", label: t("adminAICenter.automation.approvePending"), icon: "verified_user", color: "success" },
              { type: "send_wellness_nudge", label: t("adminAICenter.automation.sendWellnessNudge"), icon: "favorite", color: "accent" },
              { type: "generate_system_report", label: t("adminAICenter.automation.generateReport"), icon: "summarize", color: "primary" },
            ].map(a => (
              <button
                key={a.type}
                onClick={() => runAutoAction(a.type)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-all text-left group`}
              >
                <div className={`w-8 h-8 rounded-lg bg-${a.color}/10 text-${a.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-sm">{a.icon}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{a.label}</span>
                <span className="material-symbols-outlined text-muted-foreground text-sm ml-auto">arrow_forward</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Auto-settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">settings_suggest</span>
              {t("adminAICenter.automation.settingsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              checked={autoActions.alertCrisis}
              onCheckedChange={v => handleToggle("alertCrisis", v)}
              label={t("adminAICenter.automation.alertCrisisLabel")}
              description={t("adminAICenter.automation.alertCrisisDesc")}
            />
            <Switch
              checked={autoActions.autoApproveNew}
              onCheckedChange={v => handleToggle("autoApproveNew", v)}
              label={t("adminAICenter.automation.autoApproveLabel")}
              description={t("adminAICenter.automation.autoApproveDesc")}
            />
            <Switch
              checked={autoActions.autoLockInactive}
              onCheckedChange={v => handleToggle("autoLockInactive", v)}
              label={t("adminAICenter.automation.autoLockLabel")}
              description={t("adminAICenter.automation.autoLockDesc")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Log */}
      {actionLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">history</span>
              {t("adminAICenter.actionLog.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {actionLog.map((log, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0">
                <span className="material-symbols-outlined text-primary text-sm">{log.icon}</span>
                <p className="text-xs text-foreground flex-1">{log.text}</p>
                <span className="text-[9px] text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
