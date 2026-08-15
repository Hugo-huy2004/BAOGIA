import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IosApp, NavBar, Scroll, ProgressBar, Segmented, Button, Sheet } from "../demos/iosKit";
import BackButton from "./shared/BackButton";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/authSession";
import { API_BASE } from "../../config/apiBase";
import { localeForLanguage, languageCode } from "../../i18n/languages";
import { canTranslate, guessLanguage, translateText } from "../../lib/textTranslator";

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

/**
 * Quy chế làm việc của HugoTeam. Nội dung nằm trong i18n (memberPortal.team.rules)
 * nên nó theo ngôn ngữ đang chọn như mọi phần khác, và mỗi điều đều bám đúng cơ
 * chế hệ thống đang chạy — bốn trạng thái task, luật ghi giờ, mốc 500 giờ.
 */
function TeamRulesSheet({ open, onClose }) {
  const { t } = useTranslation();
  const sections = t("memberPortal.team.rules.sections", { returnObjects: true });

  return (
    <Sheet open={open} onClose={onClose} title={t("memberPortal.team.rules.title")}>
      <p className="pb-1 text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
        {t("memberPortal.team.rules.intro")}
      </p>
      <div className="space-y-5 pt-3">
        {(Array.isArray(sections) ? sections : []).map((section) => (
          <section key={section.title}>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{section.title}</h3>
            <ul className="mt-2 space-y-2">
              {section.items.map((item, index) => (
                <li key={index} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
                  <span className="mt-[0.55em] size-[3px] shrink-0 rounded-full" style={{ background: "var(--ios-label-2)" }} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

/** Vỏ app: NavBar cố định + vùng cuộn riêng. Lối ra duy nhất là nút back trên
 *  NavBar — tab-bar của portal đã ẩn khi Hugo Team mở (MemberUtilitiesTab). */
function TeamShell({ onBack, children }) {
  const { t } = useTranslation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [scrolled, setScrolled] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <IosApp scheme={dark ? "dark" : "light"} accent="hsl(var(--primary))">
      {/* Bộ iOS mang bảng màu riêng (--ios-*), còn trang tuyển dụng bên trong vẫn
          dùng token của app (bg-card, text-foreground). Hai hệ cạnh nhau lệch
          tông thấy rõ. Trỏ --ios-* về đúng token của app là cả hai cùng một màu,
          khỏi phải sửa từng chỗ. */}
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          "--ios-bg": "hsl(var(--background))",
          "--ios-surface": "hsl(var(--card))",
          "--ios-label": "hsl(var(--foreground))",
          "--ios-label-2": "hsl(var(--muted-foreground))",
          "--ios-sep": "hsl(var(--border))",
          "--ios-fill": "hsl(var(--muted))",
          "--ios-fill-2": "hsl(var(--muted))",
          "--ios-chrome": "hsl(var(--background) / .82)",
          background: "hsl(var(--background))",
        }}
      >
        <div style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }} className="shrink-0">
          <NavBar
            scrolled={scrolled}
            large
            title="Hugo Team"
            left={<BackButton onClick={onBack} />}
            right={(
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                aria-label={t("memberPortal.team.rules.title")}
                className="grid h-[30px] w-[30px] place-items-center rounded-full text-[17px] font-bold"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
              >
                !
              </button>
            )}
          />
        </div>
        <Scroll onScrolledChange={setScrolled} className="px-4 pb-16">
          {children}
        </Scroll>
        <TeamRulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </div>
    </IosApp>
  );
}

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
      <TeamShell onBack={onBack}>
        {/* Dải VVIP: một dòng chữ, không khung — khung chỉ để trang trí. */}
        <p className="flex items-baseline justify-between gap-3 pb-3 pt-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          <span>{t("memberPortal.team.membershipEnds", { date: membershipEnd?.toLocaleDateString(locale), days: daysRemaining })}</span>
          <span className="shrink-0 font-bold" style={{ color: "var(--ax)" }}>VVIP</span>
        </p>
        <DevWorkspace me={me} reload={loadMe} locale={locale} />
      </TeamShell>
    );
  }

  return (
    <TeamShell onBack={onBack}>
      <div className="space-y-8">

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
    </TeamShell>
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

/**
 * Bảng làm việc: hàng đợi việc ở trên, dòng thời gian ở dưới.
 *
 * Bản cũ chia ba tab rời (Việc / Giờ / Trao đổi) nên muốn biết "hôm nay có gì"
 * phải mở lần lượt cả ba, và số việc đang mở bị lặp ở hai khối thống kê khác
 * nhau. Ở đây mọi thứ nằm trên một màn: việc cần tay mình thì nổi lên trên,
 * còn lại chảy xuống một dòng sự kiện lọc được.
 */
function DevWorkspace({ me, reload, locale }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState(null); // null | "message" | "hours"
  const stats = me?.stats || {};
  const goal = 500;
  const approved = stats.approvedHours || 0;
  const progress = Math.min(100, (approved / goal) * 100);
  const isMilestone = approved >= goal;

  const tasks = me.tasks || [];
  const openTasks = tasks.filter((task) => ["assigned", "doing", "submitted"].includes(task.status));

  // Mở bảng = đã đọc tin của admin. Trước đây phải bấm sang tab Trao đổi mới
  // đánh dấu, nên huy hiệu đỏ bám dai dù người dùng đã thấy nội dung.
  useEffect(() => {
    if ((me.messages || []).some((m) => m.from === "admin" && !m.readByDev)) {
      fetch(`${API_BASE}/hugoteam/me/messages/read`, { method: "POST" }).then(reload).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feed = buildFeed(me, t);
  const shown = filter === "all" ? feed : feed.filter((item) => item.kind === filter);

  const FILTERS = [
    { id: "all", label: t("memberPortal.team.filterAll") },
    { id: "task", label: t("memberPortal.team.sectionTasks") },
    { id: "hours", label: t("memberPortal.team.sectionHours") },
    { id: "message", label: t("memberPortal.team.sectionChat") },
  ];

  return (
    <div className="space-y-5">
      {/* Dải trạng thái: lời chào, membership và tiến độ giờ gộp trong một thẻ */}
      <section className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">
          {t("memberPortal.team.greeting", { name: me.name })}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[34px] font-bold leading-none tracking-[-0.02em]" style={{ color: isMilestone ? "#30D158" : "var(--ax)" }}>
            {approved}h
          </span>
          <span className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>/ {goal}h</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t-[0.5px] pt-3.5" style={{ borderColor: "var(--ios-sep)" }}>
          {[
            { value: openTasks.length, label: t("memberPortal.team.statOpenTasks") },
            { value: stats.doneTasks || 0, label: t("memberPortal.team.statDoneTasks") },
            { value: `${stats.pendingHours || 0}h`, label: t("memberPortal.team.pendingApproval") },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="text-[20px] font-semibold leading-none">{stat.value}</dd>
              <dt className="mt-1.5 text-[13px] leading-tight" style={{ color: "var(--ios-label-2)" }}>{stat.label}</dt>
            </div>
          ))}
        </dl>

        {isMilestone && (
          <p className="mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-semibold" style={{ background: "rgba(48,209,88,.12)", color: "#30D158" }}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">military_tech</span>
            {t("memberPortal.team.milestoneTitle")}
          </p>
        )}
      </section>

      {/* Hàng đợi: chỉ việc còn cần tay mình, mỗi thẻ đúng một hành động chính */}
      <section aria-labelledby="team-todo">
        <h2 id="team-todo" className="px-4 pb-1.5 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>
          {t("memberPortal.team.boardTodo")} · {openTasks.length}
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.allClear")}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {openTasks.map((task, index) => (
              <li key={task._id}>
                <TaskCard task={task} reload={reload} locale={locale} last={index === openTasks.length - 1} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Soạn: nhắn tin hoặc ghi giờ, mở ngay tại chỗ thay vì đổi tab */}
      <section>
        {composer === null ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="gray" size="md" full onClick={() => setComposer("hours")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
              {t("memberPortal.team.composerHours")}
            </Button>
            <Button variant="gray" size="md" full onClick={() => setComposer("message")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>
              {t("memberPortal.team.composerMessage")}
            </Button>
          </div>
        ) : (
          <div className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
            {composer === "hours"
              ? <HourForm tasks={tasks} reload={reload} onClose={() => setComposer(null)} />
              : <MessageForm reload={reload} onClose={() => setComposer(null)} />}
          </div>
        )}
      </section>

      {/* Dòng thời gian: việc, giờ và tin nhắn trộn chung theo thời gian */}
      <section aria-labelledby="team-feed">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <h2 id="team-feed" className="w-full px-4 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.boardFeed")}</h2>
          <Segmented items={FILTERS} value={filter} onChange={setFilter} className="w-full" />
        </div>

        {shown.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.feedEmpty")}
          </p>
        ) : (
          <ol className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {shown.map((item, index) => (
              <FeedRow key={item.id} item={item} locale={locale} reload={reload} last={index === shown.length - 1} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/** Trộn ba nguồn thành một danh sách sự kiện, mới nhất lên đầu. */
function buildFeed(me, t) {
  const events = [];
  for (const task of me.tasks || []) {
    events.push({
      id: `task-${task._id}`,
      kind: "task",
      at: task.assignedAt,
      icon: task.status === "done" ? "task_alt" : "assignment",
      title: task.title,
      detail: t(`memberPortal.team.${(TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned).key}`),
    });
  }
  for (const log of me.hourLogs || []) {
    events.push({
      id: `hours-${log._id}`,
      kind: "hours",
      at: log.date,
      icon: "schedule",
      title: t("memberPortal.team.eventHours", { hours: log.hours }),
      detail: log.note || t(`memberPortal.team.${(LOG_STATUS_META[log.status] || LOG_STATUS_META.pending).key}`),
      log,
    });
  }
  for (const message of me.messages || []) {
    events.push({
      id: `msg-${message._id}`,
      kind: "message",
      translatable: message.from === "admin",
      at: message.at,
      icon: "forum",
      title: message.from === "admin" ? t("memberPortal.team.eventMessageAdmin") : t("memberPortal.team.eventMessageDev"),
      detail: message.text,
    });
  }
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function FeedRow({ item, locale, reload, last }) {
  const { t, i18n } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [busy, setBusy] = useState(false);

  // Admin soạn bằng tiếng Việt hoặc tiếng Anh. Chỉ mời dịch khi ngôn ngữ Dev
  // đang chọn khác ngôn ngữ của tin — cùng thứ tiếng thì nút chỉ tổ vướng.
  const uiLanguage = languageCode(i18n.resolvedLanguage || i18n.language);
  const sourceLanguage = item.translatable ? guessLanguage(item.detail) : null;
  const offerTranslation = Boolean(item.translatable && canTranslate() && sourceLanguage !== uiLanguage);

  const toggleTranslation = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    setBusy(true);
    try {
      setTranslated(await translateText(item.detail, { from: sourceLanguage, to: uiLanguage }));
    } catch (error) {
      notify.error(t(error.message === "unavailable"
        ? "memberPortal.team.translateUnavailable"
        : "memberPortal.team.translateError"));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const ok = await notify.confirm({
      title: t("memberPortal.team.confirmWithdrawTitle"),
      message: t("memberPortal.team.confirmWithdrawDesc"),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours/${item.log._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastError"));
      notify.success(t("memberPortal.team.toastWithdrawn"));
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <li className="flex items-start gap-3 px-4">
      <span className="material-symbols-outlined mt-3.5 text-[18px]" style={{ color: "var(--ios-label-2)" }} aria-hidden="true">{item.icon}</span>
      <div className={`min-w-0 flex-1 py-3 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
        <p className="text-[15px] font-semibold leading-snug">{item.title}</p>
        {item.detail && (
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
            {translated ?? item.detail}
          </p>
        )}
        {item.translatable && offerTranslation && (
          <button
            type="button"
            onClick={toggleTranslation}
            disabled={busy}
            className="mt-1.5 text-[13px] font-semibold disabled:opacity-60"
            style={{ color: "var(--ax)" }}
          >
            {busy
              ? t("memberPortal.team.translating")
              : translated
                ? t("memberPortal.team.showOriginal")
                : t("memberPortal.team.translate")}
          </button>
        )}
        <p className="mt-1 text-[11px]" style={{ color: "var(--ios-label-2)" }}>{fmtDate(item.at, locale)}</p>
      </div>
      {item.log?.status === "pending" && (
        <button
          type="button"
          onClick={withdraw}
          aria-label={t("memberPortal.team.withdraw")}
          className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--ios-label-2)" }}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
        </button>
      )}
    </li>
  );
}

function TaskCard({ task, reload, locale, last }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState(task.devNote || "");

  const updateTask = async (body) => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastTaskUpdateError"));
      notify.success(body.status === "submitted" ? t("memberPortal.team.toastTaskSubmitted") : t("memberPortal.team.toastTaskUpdated"));
      setSubmitting(false);
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <article className={`px-4 py-3.5 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{task.title}</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.assignedOn", { date: fmtDate(task.assignedAt, locale) })}
            {task.deadline && (
              <> {t("memberPortal.team.han")} <span className="font-semibold text-foreground">{fmtDate(task.deadline, locale)}</span></>
            )}
          </p>
        </div>
        <StatusChip meta={TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned} />
      </div>

      {task.guide && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">{t("memberPortal.team.huongDanTuAdmin")}</summary>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">{task.guide}</p>
        </details>
      )}
      {task.adminNote && (
        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">{t("memberPortal.team.nhanXetNghiemThu")} </span>
          {task.adminNote}
        </p>
      )}

      {task.status === "assigned" && (
        <Button variant="filled" size="sm" onClick={() => updateTask({ status: "doing" })} className="mt-3">
          {t("memberPortal.team.batDauThucHien")}
        </Button>
      )}

      {task.status === "doing" && (submitting ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("memberPortal.team.moTaNganNhung")}
            rows={3}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
          <div className="flex gap-2">
            <Button variant="filled" size="sm" onClick={() => updateTask({ status: "submitted", devNote: note })}>
              {t("memberPortal.team.xacNhanNop")}
            </Button>
            <Button variant="gray" size="sm" onClick={() => setSubmitting(false)}>
              {t("memberPortal.team.huy")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="filled" size="sm" onClick={() => setSubmitting(true)} className="mt-3">
          {t("memberPortal.team.nopTask")}
        </Button>
      ))}

      {task.status === "submitted" && task.devNote && (
        <p className="mt-3 text-xs italic text-muted-foreground">{t("memberPortal.team.ghiChuCuaBan")} {task.devNote}</p>
      )}
    </article>
  );
}

function HourForm({ tasks, reload, onClose }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, hours: "", note: "", taskId: "" });
  const [saving, setSaving] = useState(false);
  const linkable = tasks.filter((task) => ["doing", "submitted", "done"].includes(task.status));

  const submit = async () => {
    const hours = Number(form.hours);
    if (!form.date || !Number.isFinite(hours) || hours <= 0) {
      notify.error(t("memberPortal.team.toastInvalidHours"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours, taskId: form.taskId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastLogError"));
      notify.success(t("memberPortal.team.toastLogged"));
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.logHoursTitle")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldDate")}</span>
          <input
            type="date"
            max={today}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldHours")}</span>
          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={form.hours}
            onChange={(event) => setForm({ ...form, hours: event.target.value })}
            placeholder={t("memberPortal.team.hoursPlaceholder")}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
      </div>
      {linkable.length > 0 && (
        <label className="block space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldTask")}</span>
          <select
            value={form.taskId}
            onChange={(event) => setForm({ ...form, taskId: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          >
            <option value="">{t("memberPortal.team.noTask")}</option>
            {linkable.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
          </select>
        </label>
      )}
      <label className="block space-y-1.5 text-[13px]">
        <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldWhat")}</span>
        <input
          value={form.note}
          maxLength={500}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          placeholder={t("memberPortal.team.whatPlaceholder")}
          className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
        />
      </label>
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={submit} disabled={saving}>
          {saving ? t("memberPortal.team.saving") : t("memberPortal.team.logHours")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}

function MessageForm({ reload, onClose }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastSendError"));
      setText("");
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.composerMessage")}</p>
      <textarea
        value={text}
        maxLength={2000}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("memberPortal.team.chatPlaceholder")}
        className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
      />
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={send} disabled={sending || !text.trim()}>
          {sending ? t("memberPortal.team.saving") : t("memberPortal.team.send")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}
