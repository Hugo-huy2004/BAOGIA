import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Input, Field } from "../ui/Input";
import { Switch } from "../ui/Switch";

// In dev: VITE_AI_URL is not set → relative path → Vite proxy → Python server (no CORS)
// In prod: VITE_AI_URL is set → direct call to AI server
const AI_BASE = import.meta.env.VITE_AI_URL ?? "";
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
  const colors = { primary: "text-primary bg-primary/10", success: "text-success bg-success/10", warning: "text-warning bg-warning/10", destructive: "text-destructive bg-destructive/10" };
  return (
    <Card className={`border-${color}/20`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
          </div>
          <h4 className="text-xs font-bold text-foreground">{title}</h4>
          {badge && <Badge variant={color === "warning" ? "warning" : color === "destructive" ? "destructive" : "default"} size="xs">{badge}</Badge>}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Spinner size="sm" /> <span>Đang phân tích...</span>
          </div>
        ) : content ? (
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Chưa có dữ liệu. Nhấn phân tích để bắt đầu.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAICenter({ stats, users, showNotification, systemSettings, updateSystemSettings }) {
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
        showNotification(`Lỗi cập nhật cài đặt: ${err.message}`, "error");
      }
    }
  };

  const ANALYSIS_PROMPTS = {
    user_health: "Phân tích sức khỏe tổng thể của cộng đồng người dùng. Chú ý tỉ lệ locked/pending so với active. Đưa ra nhận xét về tình trạng người dùng và gợi ý cải thiện.",
    risk:        "Phát hiện rủi ro bảo mật và vận hành hệ thống. Đặc biệt chú ý số tài khoản bị khóa, pending lâu. Đề xuất hành động ưu tiên.",
    growth:      "Phân tích xu hướng tăng trưởng dựa trên số liệu hiện tại. Đưa ra dự báo và gợi ý chiến lược phát triển nền tảng.",
    recommendations: "Là Admin, bạn nên làm gì ngay bây giờ? Liệt kê 3-5 hành động ưu tiên theo thứ tự quan trọng dựa trên số liệu hệ thống.",
  };

  async function analyzeSystem(type) {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const data = await callAI("/api/ai/proactive-push", {
        logs: [{
          type: "admin_system_analysis",
          analysisType: type,
          context: ANALYSIS_PROMPTS[type] || "Phân tích hệ thống.",
          totalUsers: stats.total,
          activeUsers: stats.active,
          pendingUsers: stats.pending,
          lockedUsers: stats.locked,
          timestamp: new Date().toISOString(),
        }]
      });
      // Response: { should_send, title, body, reason }
      const result = [data?.title, data?.body].filter(Boolean).join("\n\n")
        || data?.reason
        || "Không có dữ liệu đủ để phân tích.";
      setAnalyses(p => ({ ...p, [type]: result }));
    } catch (e) {
      setAnalyses(p => ({ ...p, [type]: `Lỗi kết nối: ${e.message}` }));
    }
    setLoading(p => ({ ...p, [type]: false }));
  }

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
        || "Không có thông tin phân tích.";
      setUserAnalysis(result);
    } catch (e) {
      setUserAnalysis(`Lỗi phân tích: ${e.message}`);
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
      showNotification("Đã gửi thông báo hàng loạt thành công!", "success");
      setBroadcastMsg("");
      setActionLog(p => [{ text: `Broadcast gửi tới "${broadcastTarget}": ${broadcastMsg.slice(0, 50)}...`, time: new Date().toLocaleTimeString("vi-VN"), icon: "campaign" }, ...p.slice(0, 9)]);
    } catch (e) {
      showNotification(`Lỗi gửi thông báo: ${e.message}`, "error");
    }
    setBroadcastLoading(false);
  }

  async function runAutoAction(actionType) {
    try {
      let result = "";
      if (actionType === "approve_pending") {
        const res = await apiFetch("/bios/bulk-approve-pending", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
        result = `Đã duyệt ${res?.count || 0} tài khoản pending`;
      } else if (actionType === "send_wellness_nudge") {
        const res = await apiFetch("/notifications/trigger-smart-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contextHint: "wellness_nudge" })
        });
        result = res?.message || "Đã gửi nudge sức khỏe tâm lý cho tất cả thành viên active";
      } else if (actionType === "generate_system_report") {
        const data = await callAI("/api/ai/proactive-push", {
          logs: [{ type: "system_report", stats, timestamp: new Date().toISOString() }]
        });
        result = data?.body || data?.message || "Báo cáo đã tạo";
      }
      showNotification(result || "Hoàn thành!", "success");
      setActionLog(p => [{ text: result, time: new Date().toLocaleTimeString("vi-VN"), icon: "auto_fix_high" }, ...p.slice(0, 9)]);
    } catch (e) {
      showNotification(`Lỗi: ${e.message}`, "error");
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
          <h2 className="font-black text-lg text-foreground">AI Admin Center</h2>
          <p className="text-xs text-muted-foreground">Trung tâm trí tuệ nhân tạo — phân tích, tự động hóa, quản lý thông minh</p>
        </div>
      </div>

      {/* ── Quick AI Analyses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* User Health Analysis */}
        <InsightCard
          title="Phân tích Sức khỏe Người dùng"
          icon="psychology"
          color="primary"
          content={analyses.user_health}
          loading={loading.user_health}
        />

        {/* Risk Detection */}
        <InsightCard
          title="Phát hiện Rủi ro Hệ thống"
          icon="security"
          color="warning"
          badge={stats.locked > 0 ? `${stats.locked} bị khóa` : null}
          content={analyses.risk}
          loading={loading.risk}
        />

        {/* Growth Insight */}
        <InsightCard
          title="Xu hướng Tăng trưởng"
          icon="trending_up"
          color="success"
          content={analyses.growth}
          loading={loading.growth}
        />

        {/* Recommendation */}
        <InsightCard
          title="Gợi ý Hành động Ưu tiên"
          icon="tips_and_updates"
          color="primary"
          content={analyses.recommendations}
          loading={loading.recommendations}
        />
      </div>

      {/* Analysis buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { type: "user_health",      label: "Sức khỏe Users",    icon: "group" },
          { type: "risk",             label: "Phát hiện Rủi ro",   icon: "shield" },
          { type: "growth",           label: "Phân tích Tăng trưởng", icon: "bar_chart" },
          { type: "recommendations",  label: "Gợi ý Admin",        icon: "lightbulb" },
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
            Phân tích Hồ sơ Người dùng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              icon="search"
              placeholder="Nhập email người dùng..."
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyzeUserByEmail()}
              className="flex-1"
            />
            <Button onClick={analyzeUserByEmail} disabled={userAnalysisLoading} size="md">
              {userAnalysisLoading ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-sm">psychology</span>}
              AI Phân tích
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
            Gửi Thông báo Hàng loạt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {["all", "active", "pending"].map(t => (
              <button
                key={t}
                onClick={() => setBroadcastTarget(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  broadcastTarget === t
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {t === "all" ? "Tất cả" : t === "active" ? "Đang hoạt động" : "Chờ duyệt"}
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/60 transition-all resize-none"
            rows={3}
            placeholder="Nội dung thông báo... (hỗ trợ Markdown)"
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
          />
          <Button onClick={sendBroadcast} disabled={broadcastLoading || !broadcastMsg.trim()} size="md">
            {broadcastLoading ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-sm">send</span>}
            Gửi Ngay
          </Button>
        </CardContent>
      </Card>

      {/* ── Automation Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
              Hành động Tự động hoá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { type: "approve_pending", label: "Duyệt tất cả tài khoản Pending", icon: "verified_user", color: "success" },
              { type: "send_wellness_nudge", label: "Gửi nudge sức khỏe tâm lý", icon: "favorite", color: "accent" },
              { type: "generate_system_report", label: "Tạo báo cáo hệ thống AI", icon: "summarize", color: "primary" },
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
              Cài đặt Tự động hóa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              checked={autoActions.alertCrisis}
              onCheckedChange={v => handleToggle("alertCrisis", v)}
              label="Cảnh báo khủng hoảng tâm lý"
              description="Tự động nhận alert khi AI phát hiện nguy cơ cao"
            />
            <Switch
              checked={autoActions.autoApproveNew}
              onCheckedChange={v => handleToggle("autoApproveNew", v)}
              label="Tự động duyệt tài khoản edu mới"
              description="AI xác minh email edu và tự duyệt"
            />
            <Switch
              checked={autoActions.autoLockInactive}
              onCheckedChange={v => handleToggle("autoLockInactive", v)}
              label="Khóa tài khoản không hoạt động 90 ngày"
              description="Tự động sau 90 ngày không đăng nhập"
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
              Nhật ký Hành động AI
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
