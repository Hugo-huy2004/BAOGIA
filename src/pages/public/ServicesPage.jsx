import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { withUsdPrices } from "../../utils/priceFormatter";
import StudioPageNav from "../../components/public/StudioPageNav";
import { StudioSpaceScene } from "../../components/public/IntroScenes";
import WebMagnet from "../../components/ui/WebMagnet";
import {
  ACCENT,
  AboutCard,
  CINE_CSS,
  CineSectionHeading,
  EASE,
  INK,
  INK_DIM,
  ScrollProgressBar,
  WordsPullUp,
} from "../../components/public/cineKit";

const PhotographyDemo = lazy(() => import("../../components/demos/PhotographyDemo"));
const CoffeeDemo = lazy(() => import("../../components/demos/CoffeeDemo"));
const JewelryDemo = lazy(() => import("../../components/demos/JewelryDemo"));
const PortfolioDemo = lazy(() => import("../../components/demos/PortfolioDemo"));
const ECommerceDemo = lazy(() => import("../../components/demos/ECommerceDemo"));
const DashboardDemo = lazy(() => import("../../components/demos/DashboardDemo"));

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const reveal = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-72px" },
};

/* Nhãn nhỏ đầu mục — cùng một kiểu với Introduction: viền mảnh, chữ accent,
   không phải viên thuốc gradient. */
const BADGE =
  "cine-border-c inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] backdrop-blur";

/* ---------------------------------------------------------------------------
 * Toàn bộ nội dung chữ nằm trong i18n (servicesPage.* — vi/en đồng bộ).
 * File này chỉ giữ cấu trúc: icon, anchor, thứ tự marketing.
 * Nhìn & nhịp trang dùng chung cineKit với Introduction (hero toàn khung có
 * scene chạy bằng CSS, chữ khổng lồ pull-up, thẻ nổi không viền, thanh tiến độ
 * cuộn) để hai trang public không còn là hai thế giới khác nhau.
 * Phễu: hiểu trước, giá sau — demo thật → dự án đã bàn giao → triết lý giá →
 * bảng gói. Tab "Quán & Shop" chỉ hiện 3 gói xây mới; sửa/tối ưu web cũ đẩy
 * hẳn sang tab "Chỉnh sửa nhanh" thay vì lặp lại thành 2 thẻ nữa.
 * ponytail: `fix` và `seo` vẫn nằm trong PLAN_META vì schema.org lấy priceRange
 * từ đây; chỉ không render thẻ riêng.
 * ------------------------------------------------------------------------- */

const PLAN_META = [
  { id: "fix", icon: "handyman", href: "#fix" },
  { id: "seo", icon: "speed", href: "#fix" },
  { id: "landing", icon: "rocket_launch", href: "#build" },
  { id: "website", icon: "layers", href: "#build", featured: true },
  { id: "system", icon: "dashboard", href: "#app" },
];

const TRUST_ICONS = ["verified", "devices", "support_agent", "school"];
const STEP_ICONS = ["chat", "request_quote", "timeline", "handshake"];
const STUDENT_ICONS = ["verified", "school", "smart_toy", "forum"];

const DEMO_META = [
  { id: "photography", url: "hugo.dev/photography", icon: "photo_camera", Demo: PhotographyDemo },
  { id: "cafe", url: "hugo.dev/cafe", icon: "local_cafe", Demo: CoffeeDemo },
  { id: "jewelry", url: "hugo.dev/jewelry", icon: "diamond", Demo: JewelryDemo },
  { id: "portfolio", url: "hugo.dev/portfolio", icon: "person", Demo: PortfolioDemo },
  { id: "ecommerce", url: "hugo.dev/store", icon: "shopping_bag", Demo: ECommerceDemo },
  { id: "dashboard", url: "hugo.dev/admin", icon: "dashboard", Demo: DashboardDemo },
];

// Chữ + giá lấy từ i18n (servicesPage.microJobs.*) — ở đây chỉ giữ cấu trúc
const MICRO_JOBS = [
  { id: "bug-ui", icon: "bug_report" },
  { id: "style-content", icon: "palette" },
  { id: "mobile-beauty", icon: "smartphone" },
  { id: "web-widget", icon: "widgets" },
  { id: "deploy-domain", icon: "cloud_upload" },
  { id: "seo-quick", icon: "search" },
  { id: "speed-optimize", icon: "bolt" },
  { id: "monthly-maintenance", icon: "shield" },
];

function usePlans() {
  const { t, i18n } = useTranslation();
  return useMemo(
    () =>
      PLAN_META.map((meta) => ({
        ...meta,
        ...withUsdPrices(i18n, `servicesPage.plans.${meta.id}`, t(`servicesPage.plans.${meta.id}`, { returnObjects: true })),
      })),
    [t, i18n]
  );
}

function MonoIcon({ name, className = "" }) {
  return (
    <span
      className={`cine-card2-bg inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${className}`}
      style={{ color: INK }}
    >
      <span className="material-symbols-outlined text-[20px]">{name}</span>
    </span>
  );
}

/* wrapClassName đi ra ngoài WebMagnet (vị trí, chiều rộng), className ở lại
   trên nút — cùng hình dáng pill + vòng tròn icon như PillButton của cineKit,
   nhưng giữ hiệu ứng tơ nhện của WebMagnet. */
function CtaButton({ to = "/booking", children, className = "", wrapClassName = "" }) {
  return (
    <WebMagnet className={wrapClassName}>
      <Link
        to={to}
        className={`group inline-flex w-full items-center justify-between gap-2 rounded-full py-1.5 pl-6 pr-1.5 text-sm font-bold transition-all ${className}`}
        style={{ backgroundColor: "var(--cine-btn)", color: "var(--cine-btn-ink)" }}
      >
        <span>{children}</span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110"
          style={{ backgroundColor: "var(--cine-btn-ink)" }}
        >
          <ArrowRight size={16} style={{ color: "var(--cine-btn)" }} />
        </span>
      </Link>
    </WebMagnet>
  );
}

/* ---------------------------------------------------------------------------
   HERO — khung toàn màn có scene chạy bằng CSS, y hệt nhịp mở của Introduction
   ------------------------------------------------------------------------- */

function HeroSection({ t }) {
  const trustPoints = t("servicesPage.hero.trust", { returnObjects: true });

  return (
    <>
      <section className="min-h-[calc(100svh-56px)] p-3 sm:p-4 md:p-6">
        <div className="cine-card-bg relative min-h-[calc(100svh-80px)] w-full overflow-hidden rounded-[1.5rem] md:min-h-[calc(100svh-104px)] md:rounded-[2rem]">
          <div className="absolute inset-0" style={{ filter: "saturate(1.16) contrast(1.04)" }}>
            <StudioSpaceScene />
          </div>
          <div className="cine-noise-overlay pointer-events-none absolute inset-0 opacity-[0.05]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, color-mix(in srgb, var(--cine-bg) 76%, transparent) 0%, color-mix(in srgb, var(--cine-bg) 58%, transparent) 30%, color-mix(in srgb, var(--cine-bg) 24%, transparent) 52%, transparent 70%), linear-gradient(to top, color-mix(in srgb, var(--cine-bg) 38%, transparent), transparent 46%)",
            }}
          />

          <StudioPageNav
            active="services"
            portfolioLabel={t("intro.cine.navPortfolio")}
            servicesLabel={t("intro.cine.navServices")}
            className="absolute inset-x-3 top-3 sm:inset-x-5 sm:top-5"
          />

          <div className="relative z-10 flex min-h-[calc(100svh-80px)] items-end px-5 pb-7 pt-28 sm:px-8 sm:pb-10 md:min-h-[calc(100svh-104px)] md:px-12 md:pb-12 lg:px-16">
            <div className="w-full max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className={`${BADGE} mb-4`}
                style={{ color: ACCENT }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
                {t("servicesPage.hero.badge")}
              </motion.p>
              <h1
                className="font-display text-[clamp(2.6rem,7.4vw,6.8rem)] font-extrabold leading-[0.94] tracking-[-0.05em]"
                style={{ color: INK }}
              >
                <WordsPullUp text={t("servicesPage.hero.title1")} />
                <span className="block cine-grad">
                  <WordsPullUp text={t("servicesPage.hero.title2")} />
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                className="mt-5 max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg"
                style={{ color: INK_DIM }}
              >
                {t("servicesPage.hero.desc")}
              </motion.p>
              {/* Liên hệ đứng trước, bảng giá là lối phụ — khách nên nói chuyện
                  trước khi so số. */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <WebMagnet>
                  <Link
                    to="/booking"
                    className="group inline-flex items-center gap-2 rounded-full py-1.5 pl-5 pr-1.5 text-sm font-bold transition-all hover:gap-3 sm:text-base"
                    style={{ backgroundColor: "var(--cine-btn)", color: "var(--cine-btn-ink)" }}
                  >
                    {t("servicesPage.hero.contact")}
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-110 sm:h-10 sm:w-10"
                      style={{ backgroundColor: "var(--cine-btn-ink)" }}
                    >
                      <CalendarCheck size={16} style={{ color: "var(--cine-btn)" }} />
                    </span>
                  </Link>
                </WebMagnet>
                <a
                  href="#pricing"
                  className="cine-border-c inline-flex items-center gap-2 rounded-full border bg-background/65 px-5 py-3 text-sm font-bold backdrop-blur transition-colors hover:bg-background"
                  style={{ color: INK }}
                >
                  {t("servicesPage.hero.viewPricing")}
                  <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Dải cam kết — cùng nhịp với StatsStrip của Introduction */}
      <section className="px-4 pb-4 md:px-6 md:pb-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {trustPoints.map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: EASE }}
              whileHover={{ y: -4 }}
              className="cine-card-bg cine-hover-border space-y-2.5 rounded-2xl border border-transparent px-5 py-6 transition-colors sm:px-6 sm:py-7"
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: ACCENT }}>
                {TRUST_ICONS[index]}
              </span>
              <p className="cine-faint text-[11px] leading-snug sm:text-xs">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

/* A delivered client site, next to the tier it was built on. This is the only
   proof on the page, so it stays factual: name, field, scope, and a link the
   visitor can open. No testimonial quote unless the client gives us one. */
const PROOF_SITE = "https://minhoimedia.digital";

function ClientProof() {
  const { t } = useTranslation();
  /* Label + value beats an icon bullet list here: the eye scans one column of
     labels instead of four ragged lines of mixed length. */
  const facts = [
    { label: t("servicesPage.proof.fieldLabel"), text: t("servicesPage.proof.clientField") },
    { label: t("servicesPage.proof.scopeLabel"), text: t("servicesPage.proof.clientScope") },
    { label: t("servicesPage.proof.buildLabel"), text: t("servicesPage.proof.clientBuild") },
    { label: t("servicesPage.proof.planLabel"), text: t("servicesPage.proof.clientPlan") },
  ];
  return (
    <AboutCard className="mx-auto max-w-6xl p-6 sm:p-10 md:p-12">
      {/* Claim first, evidence second — and the intro stays inside a readable
          line length instead of stretching the full card width. */}
      <div className="max-w-2xl">
        <p className={BADGE} style={{ color: ACCENT }}>
          {t("servicesPage.proof.eyebrow")}
        </p>
        <h3 className="font-display mt-5 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl" style={{ color: INK }}>
          <WordsPullUp text={t("servicesPage.proof.title")} />
        </h3>
        <p className="cine-muted mt-4 text-sm leading-relaxed">{t("servicesPage.proof.desc")}</p>
      </div>

      <div className="cine-border-c mt-8 grid gap-6 border-t pt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
        {/* Who + the one action, kept together so the CTA never floats. */}
        <div className="cine-card2-bg rounded-2xl p-5 sm:p-6">
          <p className="cine-faint text-[10px] font-bold uppercase tracking-[0.2em]">
            {t("servicesPage.proof.clientLabel")}
          </p>
          <p className="font-display mt-1.5 text-xl font-extrabold leading-tight" style={{ color: INK }}>
            {t("servicesPage.proof.clientName")}
          </p>
          <p className="cine-faint mt-1 font-mono text-xs">{PROOF_SITE.replace("https://", "")}</p>
          <WebMagnet className="mt-5 w-full">
            <a
              href={PROOF_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="cine-border-c cine-hover-border group flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
              style={{ color: INK }}
            >
              {t("servicesPage.proof.cta")}
              <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
            </a>
          </WebMagnet>
        </div>

        <dl className="grid content-start gap-3">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="cine-border-c grid gap-0.5 border-b pb-3 last:border-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4"
            >
              <dt className="cine-faint text-[10px] font-bold uppercase tracking-[0.18em]">{fact.label}</dt>
              <dd className="text-sm leading-snug" style={{ color: INK_DIM }}>{fact.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </AboutCard>
  );
}

/* Thẻ gói bán bằng kết quả, không bán bằng con số: phạm vi và thứ khách nhận
   được đọc trước, con số nằm trong một <details> khách tự mở. Vẫn là bảng giá
   minh bạch — chỉ là giá không còn là thứ đập vào mắt đầu tiên. */
function PlanCard({ plan, emphasized = false }) {
  const { t } = useTranslation();

  return (
    <motion.article
      {...reveal}
      whileHover={{ y: -6 }}
      className={`cine-card-bg group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 transition-colors sm:p-8 ${
        emphasized ? "cine-border-c shadow-2xl lg:scale-[1.03]" : "cine-hover-border border-transparent"
      }`}
    >
      {emphasized && <div className="cine-grad-bg absolute inset-x-0 top-0 h-1" />}

      <div className="flex items-start justify-between gap-3">
        <MonoIcon name={plan.icon} className="h-14 w-14 rounded-3xl" />
        {plan.tagline && (
          <span
            className="cine-border-c rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: emphasized ? ACCENT : "var(--cine-faint)" }}
          >
            {plan.tagline}
          </span>
        )}
      </div>

      <p className="cine-accent-t mt-7 text-[10px] font-bold uppercase tracking-[0.22em]">{plan.label}</p>
      <h3 className="font-display mt-2 text-2xl font-extrabold leading-tight tracking-tight" style={{ color: INK }}>
        {plan.name}
      </h3>
      <p className="cine-muted mt-3 text-sm leading-relaxed">{plan.desc}</p>

      {/* Thời gian giao và cách thanh toán là hai câu hỏi đầu tiên của khách,
          nên đứng ngay dưới mô tả thay vì nằm lẫn trong `note`. */}
      {(plan.timeline || plan.payment) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {plan.timeline && (
            <span className="cine-border-c inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ color: INK_DIM }}>
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              {plan.timeline}
            </span>
          )}
          {plan.payment && (
            <span className="cine-border-c inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ color: INK_DIM }}>
              <span className="material-symbols-outlined text-[15px]">payments</span>
              {plan.payment}
            </span>
          )}
        </div>
      )}

      <div className="cine-border-c mt-7 border-t pt-6">
        <p className="cine-faint text-[10px] font-bold uppercase tracking-[0.22em]">{t("servicesPage.common.youGet")}</p>
        <ul className="mt-4 grid gap-3">
          {plan.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: INK_DIM }}>
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-base" style={{ color: ACCENT }}>check_circle</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* <details> native: không cần state, mở/đóng có sẵn phím Enter + a11y. */}
      <details className="group/price cine-card2-bg mt-7 rounded-2xl p-4">
        <summary className="cine-faint flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
          {t("servicesPage.common.revealPrice")}
          <span className="material-symbols-outlined text-base transition-transform group-open/price:rotate-180">expand_more</span>
        </summary>
        <div className="mt-4">
          {plan.oldPrice && <p className="cine-faint text-xs font-semibold line-through">{plan.oldPrice}</p>}
          <p className={`font-display text-3xl font-extrabold tracking-tight ${emphasized ? "cine-grad" : ""}`} style={emphasized ? undefined : { color: INK }}>
            {plan.price}
          </p>
          <p className="cine-faint mt-1.5 text-[11px] leading-snug">{t("servicesPage.common.priceHint")}</p>
          {plan.note && <p className="cine-muted mt-3 text-xs leading-snug">{plan.note}</p>}
          {plan.excludes && (
            <>
              <p className="cine-faint mt-5 text-[10px] font-bold uppercase tracking-[0.18em]">{t("servicesPage.common.notIncluded")}</p>
              <ul className="cine-border-c mt-2 grid gap-1.5 border-l pl-3">
                {plan.excludes.map((item) => (
                  <li key={item} className="cine-faint flex items-start gap-2 text-[11px] leading-snug">
                    <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-xs">do_not_disturb_on</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </details>

      <div className="mt-auto pt-6">
        <CtaButton>{t("servicesPage.common.getQuote")}</CtaButton>
      </div>
    </motion.article>
  );
}

function OutcomeChooser({ onChoose }) {
  const { t } = useTranslation();
  const outcomes = t("servicesPage.outcomes.items", { returnObjects: true });
  const icons = ["rocket_launch", "auto_fix_high", "school"];
  const modes = ["commercial", "micro", "student"];

  return (
    <section id="service-fit" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <CineSectionHeading
          eyebrow={t("servicesPage.outcomes.eyebrow")}
          title={t("servicesPage.outcomes.title")}
          desc={t("servicesPage.outcomes.desc")}
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {outcomes.map((item, index) => (
            <motion.button
              key={item.title}
              type="button"
              onClick={() => onChoose(modes[index])}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.1, duration: 0.55, ease: EASE }}
              whileHover={{ y: -6 }}
              className="cine-card-bg cine-border-c cine-hover-border group flex min-h-48 flex-col rounded-[1.75rem] border p-6 text-left transition-colors sm:p-7"
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: ACCENT }}>{icons[index]}</span>
              <span className="font-display mt-6 text-lg font-extrabold sm:text-xl" style={{ color: INK }}>{item.title}</span>
              <span className="cine-muted mt-3 text-xs leading-relaxed sm:text-sm">{item.desc}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold" style={{ color: ACCENT }}>
                {item.cta}
                <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoShowcaseSection() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState("photography");
  const [device, setDevice] = useState("mobile"); // "desktop" | "tablet" | "mobile"
  const active = DEMO_META.find((tpl) => tpl.id === activeId);
  const ActiveDemo = active.Demo;

  // Responsive device container sizes
  let mockupWidthClasses = "w-[300px] sm:w-[340px] h-[550px] md:h-[600px]";
  if (device === "desktop") {
    mockupWidthClasses = "w-full max-w-[820px] aspect-[16/10] h-[480px] md:h-[520px]";
  } else if (device === "tablet") {
    mockupWidthClasses = "w-[440px] max-w-full aspect-[3/4] h-[580px]";
  }

  return (
    <section id="templates" className="relative scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="cine-bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />
      <div className="relative mx-auto max-w-6xl">
        <CineSectionHeading
          eyebrow={t("servicesPage.demo.eyebrow")}
          title={t("servicesPage.demo.title")}
          highlight={t("servicesPage.demo.highlight")}
          desc={t("servicesPage.demo.desc")}
        />

        <div className="mt-12 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
          {/* Danh sách chọn demo */}
          <div className="w-full shrink-0 lg:w-1/4">
            <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-4 lg:flex-col lg:overflow-visible lg:pb-0">
              {DEMO_META.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setActiveId(tpl.id)}
                  className={`flex w-[150px] flex-shrink-0 snap-center items-center gap-4 rounded-2xl border p-4 transition-all duration-300 lg:w-full ${
                    activeId === tpl.id
                      ? "border-transparent bg-primary text-white shadow-lg shadow-primary/25"
                      : "cine-card-bg cine-border-c cine-hover-border"
                  }`}
                  style={activeId === tpl.id ? undefined : { color: INK }}
                >
                  <span className="material-symbols-outlined shrink-0 text-2xl">{tpl.icon}</span>
                  <div className="hidden text-left lg:block">
                    <p className="font-display text-sm font-bold leading-tight">{t(`servicesPage.demo.templates.${tpl.id}.title`)}</p>
                    <p className={`mt-0.5 text-[10px] ${activeId === tpl.id ? "text-white/70" : "cine-faint"}`}>
                      {t(`servicesPage.demo.templates.${tpl.id}.subtitle`)}
                    </p>
                  </div>
                  <p className="w-full text-center text-xs font-bold lg:hidden">{t(`servicesPage.demo.templates.${tpl.id}.short`)}</p>
                </button>
              ))}
            </div>
            <p className="cine-muted mt-5 hidden text-xs leading-relaxed lg:block">{t("servicesPage.demo.hint")}</p>
            <CtaButton wrapClassName="mt-5 hidden w-full lg:block">{t("servicesPage.demo.cta")}</CtaButton>
          </div>

          {/* Khung mockup trình duyệt & Device Switcher */}
          <div className="flex w-full flex-grow flex-col items-center gap-4 lg:items-end">
            {/* Device Selector toolbar - hidden on extra small mobile */}
            <div className="cine-card2-bg cine-border-c hidden w-fit items-center gap-1.5 rounded-2xl border p-1 sm:flex">
              {[
                { id: "desktop", label: t("servicesPage.devices.desktop"), icon: "laptop" },
                { id: "tablet", label: t("servicesPage.devices.tablet"), icon: "tablet_mac" },
                { id: "mobile", label: t("servicesPage.devices.mobile"), icon: "smartphone" }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDevice(d.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    device === d.id ? "bg-primary text-white shadow" : "cine-muted hover:opacity-70"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{d.icon}</span>
                  {d.label}
                </button>
              ))}
            </div>

            <div className={`cine-card2-bg cine-border-c relative flex flex-col rounded-[2rem] border p-2 shadow-2xl transition-all duration-300 md:rounded-[2.5rem] md:p-3 ${mockupWidthClasses}`}>
              <div className="cine-card-bg cine-border-c z-20 flex w-full shrink-0 items-center gap-2 rounded-t-[1.5rem] border-b p-2 md:p-3">
                <div className="flex shrink-0 gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="cine-card2-bg cine-faint flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-4 py-1.5 text-center font-mono text-[9px] md:text-[10px]">
                  {active.url}
                </div>
              </div>
              <div className="cine-card-bg relative isolate w-full flex-1 overflow-hidden rounded-b-[1.5rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeId}-${device}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="scrollbar-hide h-full w-full overflow-y-auto"
                    style={{ zoom: device === "desktop" ? "0.75" : "0.85" }}
                  >
                    <Suspense
                      fallback={
                        <div className="cine-muted flex h-full items-center justify-center text-sm">{t("servicesPage.demo.loading")}</div>
                      }
                    >
                      <ActiveDemo isMobile={device !== "desktop"} />
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* CTA mobile (bản desktop nằm dưới danh sách) */}
        <div className="mt-8 flex justify-center lg:hidden">
          <CtaButton wrapClassName="w-full max-w-xs">{t("servicesPage.demo.cta")}</CtaButton>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = t("servicesPage.faq.items", { returnObjects: true });

  return (
    <section id="faq" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <CineSectionHeading
          eyebrow={t("servicesPage.faq.eyebrow")}
          title={t("servicesPage.faq.title")}
          highlight={t("servicesPage.faq.highlight")}
          desc={t("servicesPage.faq.desc")}
          align="center"
        />
        <motion.div {...reveal} className="mt-10 space-y-3">
          {faqs.map(({ q, a }, index) => (
            <div key={q} className="cine-card-bg overflow-hidden rounded-2xl">
              <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center gap-4 p-5 text-left">
                <MonoIcon name="help" className="h-10 w-10" />
                <span className="flex-1 text-sm font-bold sm:text-base" style={{ color: INK }}>{q}</span>
                <span
                  className={`material-symbols-outlined cine-faint transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
                >
                  keyboard_arrow_down
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="cine-muted px-5 pb-5 text-sm leading-relaxed sm:pl-[4.75rem]">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** "Từ 1.490.000đ" → 1490000. Schema.org needs a number, not the display string. */
function vndAmount(display) {
  const digits = String(display || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}

export default function ServicesPage() {
  const { hash } = useLocation();
  const { t, i18n } = useTranslation();
  const plans = usePlans();
  useExchangeRate(); // Fetch tỷ giá VCB khi page load

  const [priceMode, setPriceMode] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get("type");
    if (type === "student") return "student";
    if (type === "micro") return "micro";
    return "commercial";
  });

  const studentPlans = useMemo(() => {
    const plansKeys = ["exclusiveBio", "bug", "bento", "html", "php", "react"];
    const icons = ["badge", "handyman", "contact_page", "code", "code_blocks", "terminal"];
    return plansKeys.map((key, index) => {
      const planData = t(`servicesPage.studentPlans.${key}`, { returnObjects: true });
      return {
        id: key,
        icon: icons[index],
        ...withUsdPrices(i18n, `servicesPage.studentPlans.${key}`, planData),
      };
    });
  }, [t, i18n]);

  const microJobsList = useMemo(() => {
    return MICRO_JOBS.map((job) => ({
      ...job,
      ...withUsdPrices(i18n, `servicesPage.microJobs.${job.id}`, {
        name: t(`servicesPage.microJobs.${job.id}.name`),
        desc: t(`servicesPage.microJobs.${job.id}.desc`),
        price: t(`servicesPage.microJobs.${job.id}.price`),
        time: t(`servicesPage.microJobs.${job.id}.time`),
      }),
    }));
  }, [t, i18n]);

  const studentItems = t("servicesPage.student.items", { returnObjects: true });
  const workSteps = t("servicesPage.process.steps", { returnObjects: true });

  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [hash]);

  useHeadMeta({
    title: t("servicesPage.meta.title"),
    description: t("servicesPage.meta.description"),
    keywords: t("servicesPage.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/services",
  });

  const offerSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Dịch vụ thiết kế website Hugo Studio",
      provider: {
        "@type": "Organization",
        "@id": "https://www.hugowishpax.studio/#organization",
        name: "Hugo Studio",
        url: "https://www.hugowishpax.studio",
      },
      areaServed: { "@type": "Country", name: "Vietnam" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Bảng giá dịch vụ website",
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          description: plan.desc,
          url: `https://www.hugowishpax.studio/services${plan.href}`,
          priceCurrency: "VND",
          // Without a numeric price Google cannot read the amount at all, so the
          // catalogue never qualifies for a price rich result. "Từ 1.490.000đ"
          // becomes 1490000 as the lower bound of the range.
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "VND",
            price: vndAmount(plan.price),
            valueAddedTaxIncluded: true,
          },
        })),
      },
    }),
    [plans]
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t("servicesPage.faq.items", { returnObjects: true }).map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language]
  );

  // A Service catalogue alone gives Google nothing to place geographically, so
  // local intent ("làm web giá rẻ" + a city) never matches. ProfessionalService
  // supplies the service area and the real price band; the breadcrumb lets the
  // SERP show a path instead of a bare URL.
  const businessSchema = useMemo(() => {
    const amounts = plans.map((plan) => vndAmount(plan.price)).filter(Boolean);
    return {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": "https://www.hugowishpax.studio/#studio",
      name: "Hugo Studio",
      url: "https://www.hugowishpax.studio/services",
      image: "https://www.hugowishpax.studio/og-image.png",
      description: t("servicesPage.meta.description"),
      areaServed: { "@type": "Country", name: "Việt Nam" },
      availableLanguage: ["vi", "en"],
      priceRange: amounts.length
        ? `${Math.min(...amounts).toLocaleString("vi-VN")}₫ – ${Math.max(...amounts).toLocaleString("vi-VN")}₫`
        : undefined,
      // The one portfolio item we can point at. No aggregateRating/Review here:
      // there is no rating data, and inventing one is what gets a site
      // penalised for fake structured data.
      subjectOf: {
        "@type": "WebSite",
        name: "Mình Ơi Media",
        url: "https://minhoimedia.digital",
        about: t("servicesPage.proof.clientField"),
        creator: { "@id": "https://www.hugowishpax.studio/#studio" },
      },
      knowsAbout: [
        "Thiết kế website",
        "Landing page",
        "Progressive Web App",
        "Tối ưu SEO",
        "Tối ưu tốc độ website",
      ],
    };
  }, [plans, t]);

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hugo Studio", item: "https://www.hugowishpax.studio/introduction" },
        { "@type": "ListItem", position: 2, name: "Dịch vụ & báo giá", item: "https://www.hugowishpax.studio/services" },
      ],
    }),
    []
  );

  useJsonLd("services-schema", offerSchema);
  useJsonLd("services-faq-schema", faqSchema);
  useJsonLd("services-business-schema", businessSchema);
  useJsonLd("services-breadcrumb-schema", breadcrumbSchema);

  const choosePriceMode = (mode) => {
    setPriceMode(mode);
    window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <div className="cine-root relative min-h-screen overflow-x-hidden">
      <style>{CINE_CSS}</style>
      <ScrollProgressBar />

      <div className="print:hidden">
        <HeroSection t={t} />

        <OutcomeChooser onChoose={choosePriceMode} />

        {/* Hiểu trước, giá sau: demo chạy thật → dự án đã bàn giao → cách mình
            định giá. Khách đọc hết ba khối này rồi mới tới bảng gói. */}
        <DemoShowcaseSection />

        <section className="px-4 pb-16 md:px-6 md:pb-24">
          <ClientProof />
        </section>

        {/* ================= TRIẾT LÝ GIÁ ================= */}
        <section className="px-4 pb-16 md:px-6 md:pb-24">
          <AboutCard className="mx-auto max-w-6xl space-y-8 px-6 py-14 text-center sm:px-10 sm:py-16 md:px-16 md:py-20">
            <p className={BADGE} style={{ color: ACCENT }}>{t("servicesPage.pricing.eyebrow")}</p>
            <h2 className="font-display mx-auto max-w-3xl text-2xl font-extrabold leading-snug sm:text-3xl md:text-4xl" style={{ color: INK }}>
              <WordsPullUp text={t("servicesPage.pricingPhilosophy.title")} center />
            </h2>
            <p className="cine-muted mx-auto max-w-2xl text-sm leading-relaxed sm:text-base">
              {t("servicesPage.pricingPhilosophy.desc")}
            </p>
            <blockquote className="mx-auto max-w-3xl text-lg font-semibold italic leading-snug sm:text-xl md:text-2xl">
              <WordsPullUp text={t("servicesPage.pricingPhilosophy.philosophy")} center wordClassName="cine-grad" />
            </blockquote>
          </AboutCard>
        </section>

        {/* ================= BỘ GẠT CHUYỂN ĐỔI BẢNG GIÁ ================= */}
        <section className="relative z-10 px-4 text-center md:px-6">
          <div className="cine-card2-bg cine-border-c relative mx-auto grid w-full max-w-[680px] grid-cols-3 rounded-full border p-1">
            {/* Background sliding indicator */}
            <motion.div
              className="cine-grad-bg absolute bottom-1 top-1 z-0 rounded-full"
              animate={{
                left: priceMode === "commercial" ? "4px" : priceMode === "student" ? "calc(33.33% + 2px)" : "calc(66.66% + 2px)",
              }}
              style={{ width: "calc(33.33% - 6px)" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            {[
              { id: "commercial", label: t("servicesPage.tabs.commercial") },
              { id: "student", label: t("servicesPage.tabs.student") },
              { id: "micro", label: t("servicesPage.tabs.micro") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPriceMode(tab.id)}
                className={`relative z-10 rounded-full py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 sm:text-xs ${
                  priceMode === tab.id ? "text-white" : "cine-muted hover:opacity-70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="cine-faint mx-auto mt-4 max-w-2xl text-xs italic">{t("servicesPage.disclaimer")}</p>
        </section>

        {priceMode === "commercial" && (
          <section id="pricing" className="relative scroll-mt-24 space-y-16 px-4 py-14 md:px-6 md:py-20">
            <div id="build" className="absolute -top-24" />
            <div className="mx-auto max-w-6xl space-y-16">
              {/* Ba gói xây mới — hết. Sửa/tối ưu web cũ nằm ở tab "Chỉnh sửa
                  nhanh" bên dưới, không dựng thêm thẻ giá ở đây. */}
              <div className="space-y-10">
                <CineSectionHeading
                  eyebrow={t("servicesPage.section.newBuildsTitle")}
                  title={t("servicesPage.pricing.title")}
                  highlight={t("servicesPage.pricing.highlight")}
                  desc={t("servicesPage.pricing.desc")}
                />

                <div className="grid items-stretch gap-6 md:grid-cols-3">
                  <PlanCard plan={plans.find((p) => p.id === "landing")} />
                  <PlanCard plan={plans.find((p) => p.id === "website")} emphasized />
                  <PlanCard plan={plans.find((p) => p.id === "system")} />
                </div>

                <p className="cine-faint mx-auto max-w-xl text-center text-xs">
                  <span className="material-symbols-outlined mr-1 align-[-3px] text-sm">shield</span>
                  {t("servicesPage.section.upkeep")}
                </p>
              </div>

              {/* Lối rẽ cho khách đã có web: một dải dẫn sang tab việc lẻ. */}
              <AboutCard className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-10 text-center sm:px-10 sm:py-12">
                <span className="material-symbols-outlined text-3xl" style={{ color: ACCENT }}>handyman</span>
                <h3 className="font-display text-xl font-extrabold leading-tight sm:text-2xl" style={{ color: INK }}>
                  {t("servicesPage.care.title")}{" "}
                  <span className="cine-serif cine-grad">{t("servicesPage.care.highlight")}</span>
                </h3>
                <p className="cine-muted max-w-lg text-sm leading-relaxed">{t("servicesPage.care.desc")}</p>
                <button
                  type="button"
                  onClick={() => choosePriceMode("micro")}
                  className="cine-border-c cine-hover-border group mt-1 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
                  style={{ color: INK }}
                >
                  {t("servicesPage.tabs.micro")}
                  <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                </button>
              </AboutCard>
            </div>
          </section>
        )}

        {priceMode === "student" && (
          <section id="pricing" className="relative scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
            <div id="build" className="absolute -top-24" />
            <div className="mx-auto max-w-6xl">
              <CineSectionHeading
                eyebrow={t("servicesPage.student.badge")}
                title={t("servicesPage.pricing.title")}
                highlight={t("servicesPage.pricing.highlight")}
                desc={t("servicesPage.pricing.desc")}
              />
              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {studentPlans.map((plan, index) => (
                  <motion.article
                    key={plan.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: (index % 3) * 0.08, duration: 0.55, ease: EASE }}
                    whileHover={{ y: -6 }}
                    className="cine-card-bg cine-hover-border group flex h-full flex-col justify-between rounded-[1.75rem] border border-transparent p-6 transition-colors sm:p-7"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <MonoIcon name={plan.icon} />
                        {plan.discount && (
                          <span className="cine-border-c rounded-full border px-3 py-0.5 text-[10px] font-extrabold" style={{ color: ACCENT }}>
                            {plan.discount}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display mt-5 text-xl font-bold" style={{ color: INK }}>{plan.name}</h3>
                      <p className="cine-faint mt-1 text-xs">{plan.tagline}</p>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-2xl font-black" style={{ color: INK }}>{plan.price}</span>
                        {plan.oldPrice && <span className="cine-faint text-xs line-through">{plan.oldPrice}</span>}
                      </div>
                      <p className="cine-faint mt-1 text-[11px] leading-normal">{plan.note}</p>
                      <p className="cine-muted mt-4 text-xs leading-relaxed">{plan.desc}</p>
                      <div className="cine-border-c mt-6 border-t pt-4">
                        <p className="cine-faint text-[10px] font-bold uppercase tracking-wider">{t("servicesPage.common.youGet")}</p>
                        <ul className="mt-3 space-y-2">
                          {plan.includes?.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: INK_DIM }}>
                              <span className="material-symbols-outlined mt-0.5 text-sm" style={{ color: ACCENT }}>check_circle</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-8">
                      <CtaButton to={`/booking?type=student&plan=${plan.id}`} className="text-xs">
                        {t("servicesPage.studentPlans.orderCta")}
                      </CtaButton>
                    </div>
                  </motion.article>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link
                  to="/student-pricing"
                  className="cine-border-c cine-hover-border group inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
                  style={{ color: INK }}
                >
                  {t("servicesPage.studentPlans.detailsCta")}
                  <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                </Link>
              </div>

              {/* ================= HSSV MIỄN PHÍ — KHÁC BIỆT THƯƠNG HIỆU ================= */}
              <AboutCard className="relative mt-20 scroll-mt-24 overflow-hidden p-6 sm:p-10 md:p-12" id="student-free">
                <div className="cine-grad-bg absolute inset-x-0 top-0 h-1" />
                <div className="pointer-events-none absolute bottom-[5%] left-[-4%] select-none text-[6rem] font-black leading-none tracking-tighter opacity-[0.03] sm:text-[9rem]" style={{ color: INK }}>
                  FREE
                </div>
                <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <div>
                    <p className={BADGE} style={{ color: ACCENT }}>{t("servicesPage.student.badge")}</p>
                    <h2 className="font-display mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl" style={{ color: INK }}>
                      <WordsPullUp text={t("servicesPage.student.title1")} />
                      <span className="block cine-serif cine-grad">
                        <WordsPullUp text={t("servicesPage.student.title2")} />
                      </span>
                    </h2>
                    <p className="cine-muted mt-5 text-sm leading-relaxed sm:text-base">{t("servicesPage.student.desc")}</p>
                    <Link
                      to="/student-benefits"
                      className="cine-border-c cine-hover-border group mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
                      style={{ color: INK }}
                    >
                      {t("servicesPage.student.cta")}
                      <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {studentItems.map(({ title, desc }, index) => (
                      <div key={title} className="cine-card2-bg rounded-3xl p-5">
                        <MonoIcon name={STUDENT_ICONS[index]} className="h-10 w-10" />
                        <h3 className="mt-4 text-sm font-bold" style={{ color: INK }}>{title}</h3>
                        <p className="cine-muted mt-2 text-xs leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AboutCard>
            </div>
          </section>
        )}

        {priceMode === "micro" && (
          <section id="pricing" className="relative scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
            <div className="mx-auto max-w-6xl">
              <CineSectionHeading
                eyebrow={t("servicesPage.micro.eyebrow")}
                title={t("servicesPage.micro.title")}
                highlight={t("servicesPage.micro.highlight")}
                desc={t("servicesPage.micro.desc")}
              />

              <div className="mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {microJobsList.map((job, index) => (
                  <motion.article
                    key={job.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: (index % 4) * 0.07, duration: 0.5, ease: EASE }}
                    whileHover={{ y: -6 }}
                    className="cine-card-bg cine-hover-border group flex flex-col justify-between rounded-[1.75rem] border border-transparent p-5 transition-colors sm:p-6"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <MonoIcon name={job.icon} />
                        <span className="cine-border-c cine-faint rounded-full border px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                          {job.time}
                        </span>
                      </div>

                      <h3 className="font-display mt-4 text-base font-extrabold" style={{ color: INK }}>{job.name}</h3>
                      <p className="cine-muted mt-2 text-[11px] leading-relaxed sm:text-xs">{job.desc}</p>
                    </div>

                    <div className="cine-border-c mt-5 flex items-end justify-between gap-3 border-t pt-3">
                      <p className="font-display text-sm font-black" style={{ color: INK }}>{job.price}</p>
                      <Link
                        to={`/booking?type=micro&plan=${job.id}`}
                        className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-bold"
                        style={{ color: ACCENT }}
                      >
                        {t("servicesPage.micro.cta")}
                        <ArrowRight size={12} className="-rotate-45 transition-transform group-hover:rotate-0" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>

              <AboutCard className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
                <span className="material-symbols-outlined text-4xl" style={{ color: ACCENT }}>support_agent</span>
                <h4 className="font-display text-lg font-bold" style={{ color: INK }}>{t("servicesPage.micro.customTitle")}</h4>
                <p className="cine-muted text-xs leading-relaxed sm:text-sm">{t("servicesPage.micro.customDesc")}</p>
                <CtaButton wrapClassName="mt-1 w-full max-w-xs">{t("servicesPage.micro.customCta")}</CtaButton>
              </AboutCard>
            </div>
          </section>
        )}

        {/* ================= QUY TRÌNH — TĂNG NIỀM TIN ================= */}
        <section className="px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <CineSectionHeading
              eyebrow={t("servicesPage.process.eyebrow")}
              title={t("servicesPage.process.title")}
              highlight={t("servicesPage.process.highlight")}
              desc={t("servicesPage.process.desc")}
            />
            <motion.ol {...reveal} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workSteps.map((step, index) => (
                <li key={step} className="cine-card-bg cine-hover-border relative overflow-hidden rounded-2xl border border-transparent p-6 transition-colors">
                  <div className="flex items-center gap-3">
                    <MonoIcon name={STEP_ICONS[index]} />
                    <span className="font-mono text-2xl font-extrabold opacity-20" style={{ color: INK }}>0{index + 1}</span>
                  </div>
                  <p className="cine-muted mt-5 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </motion.ol>
          </div>
        </section>

        <FaqSection />

        {/* ================= CTA CUỐI — TƯ VẤN MIỄN PHÍ, KHÔNG RÀO CẢN ================= */}
        <section className="px-4 pb-16 md:px-6 md:pb-24">
          <AboutCard className="mx-auto max-w-6xl space-y-8 px-6 py-16 text-center sm:px-10 sm:py-20 md:px-16">
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              <WordsPullUp text={t("servicesPage.finalCta.title1")} center style={{ color: INK }} />
              <WordsPullUp text={t("servicesPage.finalCta.title2")} center wordClassName="cine-grad" />
            </h2>
            <p className="cine-muted mx-auto max-w-2xl text-sm leading-relaxed">{t("servicesPage.finalCta.desc")}</p>
            <div className="flex justify-center">
              <CtaButton wrapClassName="w-full max-w-sm">{t("servicesPage.finalCta.cta")}</CtaButton>
            </div>
          </AboutCard>
        </section>
      </div>
    </div>
  );
}
