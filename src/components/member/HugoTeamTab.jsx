import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";
import { API_BASE } from "../../config/apiBase";
import { localeForLanguage } from "../../i18n/languages";

// Sáu lợi ích của thành viên HugoTeam. Chỉ giữ icon + khoá dịch: chữ nằm ở
// memberPortal.team.benefit* nên đổi ngôn ngữ là đổi theo, không phải sửa code.
const BENEFITS = [
  { icon: "school", key: "benefit1" },
  { icon: "co_present", key: "benefit2" },
  { icon: "work_history", key: "benefit3" },
  { icon: "workspace_premium", key: "benefit4" },
  { icon: "schedule", key: "benefit5" },
  { icon: "diversity_3", key: "benefit6" },
];

export default function HugoTeamTab({ onBack }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [developers, setDevelopers] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [me, setMe] = useState(null); // GET /me payload — status + dashboard data
  const userStatus = me?.status ?? null;

  useEffect(() => {
    loadDevelopers();
    loadMe();
  }, []);

  const loadDevelopers = async () => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/developers`);
      if (res.ok) {
        const data = await res.json();
        setDevelopers(data.developers || []);
      }
    } catch (error) {
      console.error("Failed to load developers:", error);
    }
  };

  const loadMe = async () => {
    try {
      const session = await getMemberSession();
      if (!session?.email) return;
      const res = await fetch(`${API_BASE}/hugoteam/me`);
      if (res.ok) setMe(await res.json());
    } catch (error) {
      console.error("Failed to load hugoteam profile:", error);
    }
  };

  const handleCvUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify.error(t("memberPortal.team.toastCvTooLarge"));
        return;
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        notify.error(t("memberPortal.team.toastPdfOnly"));
        return;
      }
      setCvFile(file);
      notify.success(t("memberPortal.team.toastCvSelected", { name: file.name }));
    }
  };

  const handleSubmitCV = async () => {
    try {
      if (!cvFile) {
        notify.error(t("memberPortal.team.toastPickCv"));
        return;
      }

      const session = await getMemberSession();
      if (!session?.email) {
        notify.error(t("memberPortal.team.toastNeedLogin"));
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("cv", cvFile);
      formData.append("email", session.email);
      // Use displayName from Google auth, fallback to name if WebAuthn
      formData.append("name", session.displayName || session.name || "");

      const res = await fetch(`${API_BASE}/hugoteam/apply`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        notify.success(t("memberPortal.team.toastApplied"));
        setCvFile(null);
        setMe((m) => ({ ...(m || {}), status: "pending" }));
      } else {
        notify.error(data.error || t("memberPortal.team.toastApplyError"));
      }
    } catch (error) {
      console.error("Submit error:", error);
      notify.error(t("memberPortal.team.toastApplyRetry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dev đã được duyệt → HugoTeam trở thành workspace: task, giờ đồng hành, trao đổi.
  if (userStatus === "approved") {
    const membershipEnd = me?.membershipEnd ? new Date(me.membershipEnd) : null;
    const daysRemaining = membershipEnd ? Math.ceil((membershipEnd - new Date()) / (24 * 60 * 60 * 1000)) : null;
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto bg-card rounded-3xl border border-border/60 shadow-sm p-6 lg:p-8 space-y-6">
        <SubUtilityHeader title="Hugo Team" icon="groups" colorClass="text-primary" onBack={onBack} />
        {/* Dev Badge */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-amber-500">verified_user</span>
            <div>
              <p className="font-semibold text-foreground">{t("memberPortal.team.devMember")}</p>
              <p className="text-xs text-muted-foreground">
                {t("memberPortal.team.membershipEnds", { date: membershipEnd?.toLocaleDateString(locale), days: daysRemaining })}
              </p>
            </div>
          </div>
          <span className="text-2xl font-semibold text-amber-500">VVIP</span>
        </div>
        <DevWorkspace me={me} reload={loadMe} membershipEnd={membershipEnd} locale={locale} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto bg-card rounded-3xl border border-border/60 shadow-sm p-6 lg:p-8 space-y-8">
      <SubUtilityHeader title="Hugo Team" icon="groups" colorClass="text-primary" onBack={onBack} />

      {/* Desktop: 2-column (content + sticky CV rail). Mobile: stacked. */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-10 lg:items-start">
      <div className="lg:col-span-2 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          {t("memberPortal.team.badge")}
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{t("memberPortal.team.heroTitle")}</h1>
        <div className="space-y-3 max-w-3xl">
          <p className="text-base text-muted-foreground">{t("memberPortal.team.heroP1")}</p>
          <p className="text-base text-muted-foreground">
            {t("memberPortal.team.heroP2a")} <span className="font-semibold text-foreground">{t("memberPortal.team.nonProfit")}</span>{t("memberPortal.team.heroP2b")}{" "}
            <span className="font-semibold text-foreground">{t("memberPortal.team.hoursPerWeek")}</span> {t("memberPortal.team.heroP2c")}
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="border-t border-border pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">{t("memberPortal.team.benefitsTitle")}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">{t("memberPortal.team.benefitsDesc")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.key} className="p-5 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors space-y-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[22px]">{b.icon}</span>
              </span>
              <p className="font-semibold text-foreground text-[15px] leading-snug">{t(`memberPortal.team.${b.key}Title`)}</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{t(`memberPortal.team.${b.key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How Hugo Studio takes care of members */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("memberPortal.team.careTitle")}</h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground max-w-2xl">
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careWeek1Label")}</span> {t("memberPortal.team.careWeek1")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careWeeklyLabel")}</span> {t("memberPortal.team.careWeekly")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careStuckLabel")}</span> {t("memberPortal.team.careStuck")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careHoursLabel")}</span> {t("memberPortal.team.careHours")}
          </p>
        </div>
      </div>

      {/* Membership & 500-hour milestone */}
      <div className="border-t border-border pt-8">
        <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[24px]">military_tech</span>
            </span>
            <h2 className="text-lg font-semibold text-foreground">{t("memberPortal.team.loyaltyTitle")}</h2>
          </div>

          {/* Membership info */}
          <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base text-primary">verified</span>
              <span className="font-semibold text-foreground">{t("memberPortal.team.membershipLine")}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("memberPortal.team.membershipDesc")}</p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{t("memberPortal.team.loyaltyText")}</p>
          <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("memberPortal.team.milestone500Title")}</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• {t("memberPortal.team.milestone500a")}</li>
              <li>• {t("memberPortal.team.milestone500b")}</li>
              <li>• {t("memberPortal.team.milestone500c")}</li>
              <li>• {t("memberPortal.team.milestone500d")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("memberPortal.team.reqTitle")}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqAudienceLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqAudience")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqWorkLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqWork")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqTimeLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqTime")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqNatureLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqNature")}</span>
          </div>
        </div>
      </div>

      {/* Info about process */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("memberPortal.team.processTitle")}</h2>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">1.</span>
            <span className="text-muted-foreground">{t("memberPortal.team.process1")}</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">2.</span>
            <span className="text-muted-foreground">{t("memberPortal.team.process2")}</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">3.</span>
            <span className="text-muted-foreground">{t("memberPortal.team.process3")}</span>
          </li>
          <li className="flex gap-4">
            <span className="font-bold text-foreground flex-shrink-0">4.</span>
            <span className="text-muted-foreground">{t("memberPortal.team.process4")}</span>
          </li>
        </ol>
      </div>

      </div>{/* end left column */}

      {/* RIGHT RAIL: Application — sticky on desktop, stacks under content on mobile */}
      <aside className="lg:col-span-1 mt-10 lg:mt-0">
        <div className="lg:sticky lg:top-4 rounded-2xl border border-border/60 bg-muted/30 p-6 space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">{t("memberPortal.team.applyTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("memberPortal.team.applyDescA")} <span className="font-semibold text-foreground">{t("memberPortal.team.applySerious")}</span> {t("memberPortal.team.applyDescB")}{" "}
              <span className="font-semibold text-foreground">{t("memberPortal.team.applyEager")}</span>{t("memberPortal.team.applyDescC")}
            </p>
          </div>

          {userStatus === "pending" && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">hourglass_top</span>
                <p className="font-semibold text-foreground">{t("memberPortal.team.pendingTitle")}</p>
              </div>
              <p className="text-sm text-muted-foreground">{t("memberPortal.team.pendingDesc")}</p>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-foreground mb-2 block">{t("memberPortal.team.uploadLabel")}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleCvUpload}
                disabled={isSubmitting || userStatus === "pending"}
                className="block w-full px-4 py-3 border border-border bg-background rounded-2xl text-sm file:mr-4 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                {cvFile ? (
                  <>
                    <span className="material-symbols-outlined text-sm text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {cvFile.name}
                  </>
                ) : t("memberPortal.team.uploadHint")}
              </p>
            </label>

            <button
              onClick={handleSubmitCV}
              disabled={!cvFile || isSubmitting || userStatus === "pending"}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold rounded-2xl transition-all disabled:cursor-not-allowed text-sm active:scale-[0.98]"
            >
              {isSubmitting ? t("memberPortal.team.submitting") : userStatus === "pending" ? t("memberPortal.team.submitted") : t("memberPortal.team.submit")}
            </button>
          </div>
        </div>
      </aside>
      </div>{/* end 2-column grid */}

      {/* Full-width below the grid */}
      <div className="space-y-10">
      {/* Developers List — nâng cấp */}
      <div className="border-t border-border pt-8">
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground">{t("memberPortal.team.devsTitle", { count: developers.length })}</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">{t("memberPortal.team.devsDesc")}</p>
        </div>
        {developers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center">
            <span className="material-symbols-outlined text-3xl text-muted-foreground block mb-2">groups</span>
            <p className="text-sm text-muted-foreground">{t("memberPortal.team.devsEmpty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev) => (
              <div
                key={dev.id}
                className="relative p-5 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors space-y-3"
              >
                {/* Developer Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                  {t("memberPortal.team.devBadge")}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {dev.name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <p className="font-semibold text-foreground text-sm leading-tight break-words">{dev.name}</p>
                    {dev.school && <p className="text-xs text-muted-foreground mt-0.5 break-words">{dev.school}</p>}
                  </div>
                </div>

                {/* Membership Status */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>{t("memberPortal.team.membership3y")}</span>
                </div>

                {/* Verified Check */}
                <div className="flex items-center pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    {t("memberPortal.team.approved")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="border-t border-border pt-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">{t("memberPortal.team.contactTitle")}</p>
        <a href="mailto:contact@hugowishpax.studio" className="text-primary font-semibold hover:underline">
          contact@hugowishpax.studio
        </a>
      </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Dev Workspace (đã được duyệt) ───────────────────────── */

// Nhãn trạng thái đi bằng khoá, màu đi bằng class: bảng này nằm ngoài
// component nên không gọi được hook dịch, còn StatusChip thì gọi được.
const TASK_STATUS_META = {
  assigned:  { key: "statusAssigned",  cls: "bg-info/10 text-info" },
  doing:     { key: "statusDoing",     cls: "bg-warning/10 text-warning" },
  submitted: { key: "statusSubmitted", cls: "bg-primary/10 text-primary" },
  done:      { key: "statusDone",      cls: "bg-success/10 text-success" },
  cancelled: { key: "statusCancelled", cls: "bg-muted text-muted-foreground" },
};

const LOG_STATUS_META = {
  pending:  { key: "logPending",  cls: "bg-warning/10 text-warning" },
  approved: { key: "logApproved", cls: "bg-success/10 text-success" },
  rejected: { key: "logRejected", cls: "bg-destructive/10 text-destructive" },
};

// Ngày tháng cũng là ngôn ngữ: "vi-VN" cứng trong hàm này khiến người đọc
// tiếng Nhật thấy 13/08/2026 thay vì 2026/08/13.
const fmtDate = (d, locale) => (d ? new Date(d).toLocaleDateString(locale) : "—");

function StatusChip({ meta }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.cls}`}>
      {t(`memberPortal.team.${meta.key}`)}
    </span>
  );
}

function DevWorkspace({ me, reload, membershipEnd, locale }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("tasks");
  const stats = me?.stats || {};
  const goal = 500;
  const progress = Math.min(100, ((stats.approvedHours || 0) / goal) * 100);
  const isMilestone = (stats.approvedHours || 0) >= goal;

  const SECTIONS = [
    { id: "tasks", label: t("memberPortal.team.sectionTasks"), icon: "checklist", badge: stats.openTasks },
    { id: "hours", label: t("memberPortal.team.sectionHours"), icon: "schedule", badge: 0 },
    { id: "chat", label: t("memberPortal.team.sectionChat"), icon: "forum", badge: stats.unreadMessages },
  ];

  return (
    <div className="space-y-6">
      {/* Chào + membership info + tiến độ 500h */}
      <div className="space-y-6">
        {/* Hero Greeting */}
        <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-8 lg:p-10">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t("memberPortal.team.welcomeBack")}</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">{t("memberPortal.team.greeting", { name: me.name })}</h1>
          <p className="text-muted-foreground max-w-2xl">{t("memberPortal.team.welcomeDesc")}</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Membership Status */}
          {membershipEnd && (
            <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t("memberPortal.team.membership")}</p>
              <p className="text-sm font-semibold text-foreground">{t("memberPortal.team.yearsPlus", { years: membershipEnd.getFullYear() - new Date().getFullYear() })}</p>
              <p className="text-xs text-muted-foreground">{t("memberPortal.team.endsOn", { date: membershipEnd.toLocaleDateString(locale) })}</p>
            </div>
          )}

          {/* Hours Progress */}
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {isMilestone ? t("memberPortal.team.milestoneReached") : t("memberPortal.team.journey")}
            </p>
            <p className={`text-lg font-semibold ${isMilestone ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
              {stats.approvedHours || 0}h
            </p>
            <p className="text-xs text-muted-foreground">/ {goal}h</p>
          </div>

          {/* Open Tasks */}
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("memberPortal.team.openTasksShort")}</p>
            <p className="text-lg font-semibold text-foreground">{stats.openTasks || 0}</p>
            <p className="text-xs text-muted-foreground">{t("memberPortal.team.inProgress")}</p>
          </div>
        </div>

        {/* Hours Milestone Progress Bar */}
        {!isMilestone && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                <span className="font-semibold text-foreground text-sm">{t("memberPortal.team.journeyHours", { goal })}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t("memberPortal.team.hoursLeft", { hours: goal - (stats.approvedHours || 0) })}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            {stats.pendingHours > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="text-amber-500 font-medium">{stats.pendingHours}h</span> {t("memberPortal.team.pendingApproval")}
              </p>
            )}
          </div>
        )}

        {isMilestone && (
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-6 space-y-3 text-center">
            <span className="material-symbols-outlined text-5xl text-emerald-500 block">military_tech</span>
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg mb-1">{t("memberPortal.team.milestoneTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("memberPortal.team.milestoneDesc")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats nhanh */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "pending_actions", value: stats.openTasks || 0, label: t("memberPortal.team.statOpenTasks"), color: "text-blue-600 dark:text-blue-400" },
          { icon: "task_alt", value: stats.doneTasks || 0, label: t("memberPortal.team.statDoneTasks"), color: "text-emerald-600 dark:text-emerald-400" },
          { icon: "verified", value: `${stats.approvedHours || 0}h`, label: t("memberPortal.team.statApprovedHours"), color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border/60 text-center space-y-2">
            <span className={`material-symbols-outlined text-[22px] block ${s.color}`}>{s.icon}</span>
            <p className="text-xl font-semibold text-foreground leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Workspace: desktop = sidebar rail + content panel; mobile = segmented tabs + content */}
      <div className="lg:grid lg:grid-cols-[212px_1fr] lg:gap-6 lg:items-start">
        {/* Nav rail */}
        <nav className="flex lg:flex-col gap-1 bg-muted/60 lg:bg-transparent p-1 lg:p-0 rounded-2xl lg:sticky lg:top-4">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`relative flex-1 lg:flex-none w-full flex items-center justify-center lg:justify-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                section === s.id
                  ? "bg-card text-foreground shadow-sm lg:border lg:border-border/60"
                  : "bg-transparent text-muted-foreground hover:text-foreground lg:hover:bg-muted/60"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              {s.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 lg:static lg:ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-semibold flex items-center justify-center">
                  {s.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="mt-4 lg:mt-0 min-w-0">
          {section === "tasks" && <DevTasks tasks={me.tasks || []} reload={reload} locale={locale} />}
          {section === "hours" && <DevHours hourLogs={me.hourLogs || []} tasks={me.tasks || []} reload={reload} locale={locale} />}
          {section === "chat" && <DevChat messages={me.messages || []} reload={reload} />}
        </div>
      </div>
    </div>
  );
}

function DevTasks({ tasks, reload, locale }) {
  // `t` ở đây từng là BIẾN TASK trong `tasks.map((t) => …)`, trong khi thân map
  // lại gọi `t("memberPortal.team.…")` — tức là gọi một object như hàm. Mọi dev
  // có task đều làm nổ trang này. Biến đổi tên thành `task`, `t` trả về đúng
  // vai trò hàm dịch.
  const { t } = useTranslation();
  const [noteFor, setNoteFor] = useState(null); // taskId đang nộp
  const [note, setNote] = useState("");

  const updateTask = async (taskId, body) => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastTaskUpdateError"));
      notify.success(body.status === "submitted" ? t("memberPortal.team.toastTaskSubmitted") : t("memberPortal.team.toastTaskUpdated"));
      setNoteFor(null);
      setNote("");
      reload();
    } catch (e) {
      notify.error(e.message);
    }
  };

  if (!tasks.length) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-border bg-muted/30 text-center space-y-3">
        <span className="material-symbols-outlined text-[36px] text-muted-foreground block">inbox</span>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{t("memberPortal.team.tasksEmptyTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("memberPortal.team.tasksEmptyDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task._id} className="p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm">{task.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("memberPortal.team.assignedOn", { date: fmtDate(task.assignedAt, locale) })}
                {task.deadline && <> {t("memberPortal.team.han")} <span className="font-semibold text-foreground">{fmtDate(task.deadline, locale)}</span></>}
              </p>
            </div>
            <StatusChip meta={TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned} />
          </div>

          {task.guide && (
            <div className="p-3 rounded-xl bg-muted/60 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              <p className="font-bold text-foreground mb-1">{t("memberPortal.team.huongDanTuAdmin")}</p>
              {task.guide}
            </div>
          )}
          {task.adminNote && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              <p className="font-bold text-foreground mb-1">{t("memberPortal.team.nhanXetNghiemThu")}</p>
              {task.adminNote}
            </div>
          )}
          {task.devNote && task.status !== "doing" && (
            <p className="text-xs text-muted-foreground italic">{t("memberPortal.team.ghiChuCuaBan")} {task.devNote}</p>
          )}

          {task.status === "assigned" && (
            <button
              onClick={() => updateTask(task._id, { status: "doing" })}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform"
            >
              {t("memberPortal.team.batDauThucHien")}
            </button>
          )}
          {task.status === "doing" && (
            noteFor === task._id ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("memberPortal.team.moTaNganNhung")}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTask(task._id, { status: "submitted", devNote: note })}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform"
                  >
                    {t("memberPortal.team.xacNhanNop")}
                  </button>
                  <button
                    onClick={() => { setNoteFor(null); setNote(""); }}
                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold"
                  >
                    {t("memberPortal.team.huy")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setNoteFor(task._id); setNote(task.devNote || ""); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition-transform"
              >
                {t("memberPortal.team.nopTask")}
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function DevHours({ hourLogs, tasks, reload, locale }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, hours: "", note: "", taskId: "" });
  const [saving, setSaving] = useState(false);
  const openTasks = tasks.filter((t) => ["doing", "submitted", "done"].includes(t.status));

  const submit = async () => {
    const h = Number(form.hours);
    if (!form.date || !Number.isFinite(h) || h <= 0) {
      notify.error(t("memberPortal.team.toastInvalidHours"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours: h, taskId: form.taskId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastLogError"));
      notify.success(t("memberPortal.team.toastLogged"));
      setForm({ date: today, hours: "", note: "", taskId: "" });
      reload();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (logId) => {
    const ok = await notify.confirm({ title: t("memberPortal.team.confirmWithdrawTitle"), message: t("memberPortal.team.confirmWithdrawDesc"), danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastError"));
      notify.success(t("memberPortal.team.toastWithdrawn"));
      reload();
    } catch (e) {
      notify.error(e.message);
    }
  };

  const taskTitle = (id) => tasks.find((t) => t._id === id)?.title;

  return (
    <div className="space-y-4">
      {/* Form ghi giờ */}
      <div className="p-5 rounded-2xl border border-border/60 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">schedule</span>
          <p className="font-bold text-foreground text-sm">{t("memberPortal.team.logHoursTitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs space-y-1">
            <span className="font-semibold text-muted-foreground">{t("memberPortal.team.fieldDate")}</span>
            <input type="date" max={today} value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
          </label>
          <label className="text-xs space-y-1">
            <span className="font-semibold text-muted-foreground">{t("memberPortal.team.fieldHours")}</span>
            <input type="number" min="0.25" max="24" step="0.25" value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder={t("memberPortal.team.hoursPlaceholder")}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
          </label>
        </div>
        {openTasks.length > 0 && (
          <label className="text-xs space-y-1 block">
            <span className="font-semibold text-muted-foreground">{t("memberPortal.team.fieldTask")}</span>
            <select value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background">
              <option value="">{t("memberPortal.team.noTask")}</option>
              {openTasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs space-y-1 block">
          <span className="font-semibold text-muted-foreground">{t("memberPortal.team.fieldWhat")}</span>
          <input value={form.note} maxLength={500}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder={t("memberPortal.team.whatPlaceholder")}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
        </label>
        <button onClick={submit} disabled={saving}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? t("memberPortal.team.saving") : t("memberPortal.team.logHours")}
        </button>
      </div>

      {/* Lịch sử */}
      {hourLogs.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-border/50 text-center">
          <p className="text-sm text-muted-foreground">{t("memberPortal.team.hoursEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">{t("memberPortal.team.hoursHistory")}</p>
          {hourLogs.map((l) => (
            <div key={l._id} className="p-3.5 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {l.hours}h · {fmtDate(l.date, locale)}
                </p>
                {(l.note || l.taskId) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {taskTitle(l.taskId) ? `[${taskTitle(l.taskId)}] ` : ""}{l.note}
                  </p>
                )}
              </div>
              <StatusChip meta={LOG_STATUS_META[l.status] || LOG_STATUS_META.pending} />
              {l.status === "pending" && (
                <button onClick={() => withdraw(l._id)} aria-label={t("memberPortal.team.withdraw")}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevChat({ messages, reload }) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Mở tab Trao đổi = đã đọc tin admin
  useEffect(() => {
    if (messages.some((m) => m.from === "admin" && !m.readByDev)) {
      fetch(`${API_BASE}/hugoteam/me/messages/read`, { method: "POST" }).then(reload).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastSendError"));
      setText("");
      reload();
    } catch (e) {
      notify.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3 flex flex-col h-[500px]">
      <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-2 p-2 border border-border/50 rounded-xl bg-muted/30">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-muted-foreground block">mail</span>
              <p className="text-sm text-muted-foreground">{t("memberPortal.team.chatEmpty")}</p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.from === "dev" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
              m.from === "dev" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.text}
              <p className={`mt-1 text-[9px] ${m.from === "dev" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(m.at).toLocaleString(localeForLanguage(i18n.resolvedLanguage || i18n.language))}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <input value={text} maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={t("memberPortal.team.chatPlaceholder")}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-xs focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
        <button onClick={send} disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground active:scale-95 transition-all">
          {sending ? "..." : t("memberPortal.team.send")}
        </button>
      </div>
    </div>
  );
}
