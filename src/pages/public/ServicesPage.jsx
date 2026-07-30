import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { withUsdPrices } from "../../utils/priceFormatter";
import StudioPageNav from "../../components/public/StudioPageNav";

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

const brandGradient =
  "bg-[linear-gradient(90deg,#2678ff_0%,#0797ff_28%,#7359e8_55%,#d45aa3_78%,#f0445e_100%)]";
const heroBadge =
  "bg-[linear-gradient(90deg,rgba(38,120,255,.13),rgba(115,89,232,.13),rgba(240,68,94,.11))] text-[#3577ed] dark:text-[#8eb7ff] border border-[#7359e8]/25 shadow-[0_0_18px_rgba(115,89,232,.12)]";

/* ---------------------------------------------------------------------------
 * Toàn bộ nội dung chữ nằm trong i18n (servicesPage.* — vi/en đồng bộ).
 * File này chỉ giữ cấu trúc: icon, anchor, thứ tự marketing.
 * Thứ tự trình bày sắp theo phễu: xây mới (Good–Better–Best, gói giữa
 * featured, gói cao làm mỏ neo giá) → demo (proof) → đã có web → việc lẻ.
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

function MonoIcon({ name, className = "", bare = false }) {
  if (bare) {
    return <span className={`material-symbols-outlined text-4xl text-foreground ${className}`}>{name}</span>;
  }
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-foreground ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">{name}</span>
    </span>
  );
}

function SectionHeading({ eyebrow, title, highlight, desc }) {
  return (
    <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
      <span className={`inline-flex rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] sm:text-[10px] ${heroBadge}`}>
        {eyebrow}
      </span>
      <h2 className="font-display mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}{" "}
        {highlight && (
          <span className={`${brandGradient} bg-clip-text text-transparent`}>{highlight}</span>
        )}
      </h2>
      {desc && <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{desc}</p>}
    </motion.div>
  );
}

function CtaButton({ to = "/booking", children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-wide text-background shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)] active:scale-95 ${className}`}
    >
      <span className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${brandGradient}`} />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
      </span>
    </Link>
  );
}

/* A delivered client site, next to the tier it was built on. This is the only
   proof on the page, so it stays factual: name, field, scope, and a link the
   visitor can open. No testimonial quote unless the client gives us one. */
function ClientProof() {
  const { t } = useTranslation();
  const facts = [
    { icon: "photo_camera", text: t("servicesPage.proof.clientField") },
    { icon: "web", text: t("servicesPage.proof.clientScope") },
    { icon: "brush", text: t("servicesPage.proof.clientBuild") },
    { icon: "layers", text: t("servicesPage.proof.clientPlan") },
  ];
  return (
    <motion.div {...reveal} className="mx-auto max-w-4xl">
      <div className="rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
        <span className={`inline-flex rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] sm:text-[10px] ${heroBadge}`}>
          {t("servicesPage.proof.eyebrow")}
        </span>
        <h3 className="font-display mt-4 text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
          {t("servicesPage.proof.title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("servicesPage.proof.desc")}
        </p>

        <div className="mt-6 flex flex-col gap-5 border-t border-border/40 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">
              {t("servicesPage.proof.clientName")}
            </p>
            <ul className="mt-3 grid gap-2">
              {facts.map((fact) => (
                <li key={fact.icon} className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-sm text-foreground">{fact.icon}</span>
                  <span>{fact.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <a
            href="https://minhoimedia.digital"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
          >
            {t("servicesPage.proof.cta")}
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">open_in_new</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function PlanCard({ plan, emphasized = false }) {
  const { t } = useTranslation();
  const [showExcludes, setShowExcludes] = useState(false);

  return (
    <motion.article
      {...reveal}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border bg-card p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
        emphasized
          ? "border-primary/40 shadow-2xl shadow-primary/15 ring-1 ring-primary/25 lg:scale-[1.04]"
          : "border-border shadow-xl shadow-primary/5 hover:shadow-2xl"
      }`}
    >
      {emphasized && <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />}
      {plan.tagline && (
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-[0.18em] ${
            emphasized ? heroBadge : "border border-border bg-muted text-muted-foreground"
          }`}
        >
          {plan.tagline}
        </span>
      )}
      <div className="relative flex flex-1 flex-col">
        {/* Header: Icon + Category */}
        <div className="flex items-start gap-3">
          <MonoIcon name={plan.icon} />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">{plan.label}</span>
        </div>

        {/* Title + Desc (compact) */}
        <h3 className="font-display mt-3 text-lg font-extrabold tracking-tight text-foreground">{plan.name}</h3>
        <p className="mt-2 text-xs leading-snug text-muted-foreground">{plan.desc}</p>

        {/* Price section (compact) */}
        <div className="mt-4 border-t border-border/40 pt-4">
          {plan.oldPrice && (
            <p className="text-xs font-semibold text-muted-foreground line-through">{plan.oldPrice}</p>
          )}
          <p className={`text-2xl font-extrabold tracking-tight ${emphasized ? `${brandGradient} bg-clip-text text-transparent` : "text-foreground"}`}>
            {plan.price}
          </p>
          {/* Delivery time and payment terms are the first two things a buyer
              asks about, so they get chips instead of being buried in `note`. */}
          {(plan.timeline || plan.payment) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {plan.timeline && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  {plan.timeline}
                </span>
              )}
              {plan.payment && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  <span className="material-symbols-outlined text-[13px]">payments</span>
                  {plan.payment}
                </span>
              )}
            </div>
          )}
          {plan.note && <p className="mt-2 text-[10px] leading-snug text-muted-foreground/80">{plan.note}</p>}
        </div>

        {/* Benefits (all visible for readability) */}
        <div className="mt-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("servicesPage.common.youGet")}</p>
          <ul className="mt-2.5 grid gap-1.5">
            {plan.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs font-medium leading-tight text-foreground/85">
                <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-sm text-foreground">check_circle</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Excludes (expandable, not essential) */}
        {plan.excludes && (
          <div className="mt-3">
            <button
              onClick={() => setShowExcludes(!showExcludes)}
              className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-xs">{showExcludes ? "expand_less" : "expand_more"}</span>
              {t("servicesPage.common.notIncluded")}
            </button>
            {showExcludes && (
              <ul className="mt-2 grid gap-1 border-l border-border/30 pl-3">
                {plan.excludes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[9px] leading-tight text-muted-foreground/70">
                    <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-xs">do_not_disturb_on</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          <CtaButton className="w-full text-xs">{t("servicesPage.common.discussPlan")}</CtaButton>
        </div>
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
    <section id="service-fit" className="relative z-10 mx-auto mt-10 max-w-6xl px-4 sm:mt-14 sm:px-8">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary">
            {t("servicesPage.outcomes.eyebrow")}
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("servicesPage.outcomes.title")}
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t("servicesPage.outcomes.desc")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {outcomes.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onChoose(modes[index])}
            className="group flex min-h-40 flex-col rounded-[1.5rem] border border-border bg-card/80 p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <span className="material-symbols-outlined text-2xl text-primary">{icons[index]}</span>
            <span className="mt-4 font-display text-base font-extrabold text-foreground sm:text-lg">{item.title}</span>
            <span className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-extrabold text-primary">
              {item.cta}
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </span>
          </button>
        ))}
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
    <section id="templates" className="relative mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
      <div className="pointer-events-none absolute right-[-4%] top-[-2%] select-none text-[6rem] font-black leading-none tracking-tighter text-foreground/[0.03] sm:text-[10rem]">
        DEMO
      </div>
      <SectionHeading
        eyebrow={t("servicesPage.demo.eyebrow")}
        title={t("servicesPage.demo.title")}
        highlight={t("servicesPage.demo.highlight")}
        desc={t("servicesPage.demo.desc")}
      />

      <div className="mt-12 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
        {/* Danh sách chọn demo */}
        <div className="w-full lg:w-1/4 shrink-0">
          <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-4 lg:flex-col lg:overflow-visible lg:pb-0">
            {DEMO_META.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setActiveId(tpl.id)}
                className={`flex w-[150px] flex-shrink-0 snap-center items-center gap-4 rounded-2xl border p-4 transition-all duration-300 lg:w-full ${
                  activeId === tpl.id
                    ? "border-foreground bg-foreground text-background shadow-lg"
                    : "border-border bg-card/50 text-foreground hover:bg-muted"
                }`}
              >
                <span className="material-symbols-outlined shrink-0 text-2xl">{tpl.icon}</span>
                <div className="hidden text-left lg:block">
                  <p className="font-display text-sm font-bold leading-tight">{t(`servicesPage.demo.templates.${tpl.id}.title`)}</p>
                  <p className={`mt-0.5 text-[10px] ${activeId === tpl.id ? "text-background/70" : "text-muted-foreground"}`}>
                    {t(`servicesPage.demo.templates.${tpl.id}.subtitle`)}
                  </p>
                </div>
                <p className="w-full text-center text-xs font-bold lg:hidden">{t(`servicesPage.demo.templates.${tpl.id}.short`)}</p>
              </button>
            ))}
          </div>
          <p className="mt-4 hidden text-xs leading-relaxed text-muted-foreground lg:block">{t("servicesPage.demo.hint")}</p>
          <CtaButton className="mt-4 hidden w-full lg:inline-flex">{t("servicesPage.demo.cta")}</CtaButton>
        </div>

        {/* Khung mockup trình duyệt & Device Switcher */}
        <div className="flex-grow w-full flex flex-col items-center gap-4 lg:items-end">
          {/* Device Selector toolbar - hidden on extra small mobile */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-muted/65 border border-border w-fit">
            {[
              { id: "desktop", label: t("servicesPage.devices.desktop"), icon: "laptop" },
              { id: "tablet", label: t("servicesPage.devices.tablet"), icon: "tablet_mac" },
              { id: "mobile", label: t("servicesPage.devices.mobile"), icon: "smartphone" }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  device === d.id
                    ? "bg-foreground text-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>

          <div className={`relative flex flex-col rounded-[2rem] border border-border bg-muted p-2 shadow-2xl md:rounded-[2.5rem] md:p-3 transition-all duration-300 ${mockupWidthClasses}`}>
            <div className="z-20 flex w-full shrink-0 items-center gap-2 rounded-t-[1.5rem] border-b border-border bg-card p-2 md:p-3">
              <div className="flex shrink-0 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-muted px-4 py-1.5 text-center font-mono text-[9px] text-muted-foreground md:text-[10px]">
                {active.url}
              </div>
            </div>
            <div className="relative isolate w-full flex-1 overflow-hidden rounded-b-[1.5rem] bg-card">
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
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("servicesPage.demo.loading")}</div>
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
      <div className="mt-8 text-center lg:hidden">
        <CtaButton>{t("servicesPage.demo.cta")}</CtaButton>
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = t("servicesPage.faq.items", { returnObjects: true });

  return (
    <section id="faq" className="mx-auto mt-20 max-w-4xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
      <SectionHeading
        eyebrow={t("servicesPage.faq.eyebrow")}
        title={t("servicesPage.faq.title")}
        highlight={t("servicesPage.faq.highlight")}
        desc={t("servicesPage.faq.desc")}
      />
      <motion.div {...reveal} className="mt-10 space-y-3">
        {faqs.map(({ q, a }, index) => (
          <div key={q} className="overflow-hidden rounded-3xl border border-border bg-card/80 backdrop-blur">
            <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center gap-4 p-5 text-left">
              <MonoIcon name="help" className="h-10 w-10" />
              <span className="flex-1 text-sm font-bold text-foreground sm:text-base">{q}</span>
              <span
                className={`material-symbols-outlined text-muted-foreground transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
              >
                keyboard_arrow_down
              </span>
            </button>
            <div className={`grid transition-all duration-300 ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:pl-[4.75rem]">{a}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
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

  const trustPoints = t("servicesPage.hero.trust", { returnObjects: true });
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
    <div className="relative w-full overflow-x-hidden pb-20 text-foreground">
      <div className="print:hidden">

      {/* Nền glow đồng bộ Landing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-6%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-tr from-[#2678ff]/10 to-[#7359e8]/10 blur-[150px]" />
        <div className="absolute right-[-10%] top-[30rem] h-[50vw] w-[50vw] rounded-full bg-gradient-to-tr from-[#f0445e]/10 to-[#0797ff]/10 blur-[170px]" />
      </div>

      {/* ============================ HERO ============================ */}
      <section className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-8 sm:pt-6">
        <StudioPageNav
          active="services"
          portfolioLabel={t("intro.cine.navPortfolio")}
          servicesLabel={t("intro.cine.navServices")}
          className="absolute inset-x-3 top-3"
        />
        {/* Watermark */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="pointer-events-none absolute left-[-6%] top-[8%] select-none text-[7rem] font-black leading-none tracking-tighter text-foreground/[0.03] dark:text-foreground/[0.02] sm:text-[11rem] lg:text-[14rem]"
        >
          PRICING
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-4xl pt-20 text-center md:pt-16">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] sm:text-[10px] ${heroBadge}`}>
            {t("servicesPage.hero.badge")}
          </span>
          <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t("servicesPage.hero.title1")}{" "}
            <span className={`${brandGradient} bg-clip-text text-transparent`}>{t("servicesPage.hero.title2")}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("servicesPage.hero.desc")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-7 py-3.5 text-xs font-bold uppercase tracking-wide text-background shadow-xl transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.35)]"
            >
              <span className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${brandGradient}`} />
              <span className="relative z-10 flex items-center gap-2">
                {t("servicesPage.hero.viewPricing")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-y-0.5">keyboard_arrow_down</span>
              </span>
            </a>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border/50 bg-card/70 px-7 py-3.5 text-xs font-bold uppercase tracking-wide text-foreground backdrop-blur transition-all duration-300 hover:border-primary hover:text-primary"
            >
              {t("servicesPage.hero.contact")}
            </Link>
          </div>

          {/* Trust strip — giảm rủi ro cảm nhận ngay dưới CTA */}
          <motion.ul {...reveal} className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {trustPoints.map((label, index) => (
              <li key={label} className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card/70 p-4 backdrop-blur">
                <span className="material-symbols-outlined text-xl text-foreground">{TRUST_ICONS[index]}</span>
                <span className="text-[11px] font-bold leading-snug text-muted-foreground">{label}</span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </section>

      <OutcomeChooser onChoose={choosePriceMode} />

      {/* ================= BỘ GẠT CHUYỂN ĐỔI BẢNG GIÁ ================= */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-8 text-center relative z-10 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="relative grid grid-cols-3 w-full max-w-[680px] mx-auto rounded-full bg-muted/65 p-1 border border-border">
            {/* Background sliding indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-foreground z-0"
              animate={{
                left: priceMode === "commercial" ? "4px" : priceMode === "student" ? "calc(33.33% + 2px)" : "calc(66.66% + 2px)",
              }}
              style={{
                width: "calc(33.33% - 6px)"
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            <button
              onClick={() => setPriceMode("commercial")}
              className={`relative rounded-full py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
                priceMode === "commercial" ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("servicesPage.tabs.commercial")}
            </button>
            <button
              onClick={() => setPriceMode("student")}
              className={`relative rounded-full py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
                priceMode === "student" ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("servicesPage.tabs.student")}
            </button>
            <button
              onClick={() => setPriceMode("micro")}
              className={`relative rounded-full py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${
                priceMode === "micro" ? "text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("servicesPage.tabs.micro")}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/75 italic">
          {t("servicesPage.disclaimer")}
        </p>
      </section>

      {priceMode === "commercial" && (
        <>
          {/* ================= WEBSITE & ỨNG DỤNG WEB ================= */}
          <section id="pricing" className="relative mx-auto mt-16 max-w-7xl scroll-mt-24 px-4 sm:mt-24 sm:px-8 space-y-16">
            <div id="build" className="absolute -top-24" />
            <SectionHeading
              eyebrow={t("servicesPage.pricing.eyebrow")}
              title={t("servicesPage.pricing.title")}
              highlight={t("servicesPage.pricing.highlight")}
              desc={t("servicesPage.pricing.desc")}
            />

            {/* 1. XÂY DỰNG MỚI (NEW DESIGN & BUILDS) */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-foreground inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                  <span className="material-symbols-outlined text-primary text-lg">rocket_launch</span>
                  {t("servicesPage.section.newBuildsTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                  {t("servicesPage.section.newBuildsDesc")}
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3 items-stretch">
                <PlanCard plan={plans.find(p => p.id === "landing")} />
                <PlanCard plan={plans.find(p => p.id === "website")} emphasized={true} />
                <PlanCard plan={plans.find(p => p.id === "system")} />
              </div>

              <p className="mx-auto max-w-xl text-center text-xs text-muted-foreground">
                <span className="material-symbols-outlined mr-1 align-[-3px] text-sm">shield</span>
                {t("servicesPage.section.upkeep")}
              </p>

              <ClientProof />
            </div>

            {/* 2. TỐI ƯU & SỬA LỖI (SEO, SPEED UP & SUPPORT) */}
            <div className="space-y-6 pt-4">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-foreground inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/5 border border-accent/10">
                  <span className="material-symbols-outlined text-accent text-lg">bolt</span>
                  {t("servicesPage.section.optimizeTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                  {t("servicesPage.section.optimizeDesc")}
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:w-2/3 mx-auto items-stretch">
                <PlanCard plan={plans.find(p => p.id === "seo")} />
                <PlanCard plan={plans.find(p => p.id === "fix")} />
              </div>
            </div>
          </section>
        </>
      )}

      {priceMode === "student" && (
        <>
          <section id="pricing" className="relative mx-auto mt-16 max-w-7xl scroll-mt-24 px-4 sm:px-8 animate-fadeIn">
          <div id="build" className="absolute -top-24" />
          <SectionHeading
            eyebrow={t("servicesPage.student.badge")}
            title={t("servicesPage.pricing.title")}
            highlight={t("servicesPage.pricing.highlight")}
            desc={t("servicesPage.pricing.desc")}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studentPlans.map((plan) => (
              <motion.article
                {...reveal}
                key={plan.id}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <MonoIcon name={plan.icon} />
                    {plan.discount && (
                      <span className="rounded-full bg-foreground/10 text-foreground px-3 py-0.5 text-[10px] font-extrabold border border-foreground/10">
                        {plan.discount}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display mt-5 text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">{plan.price}</span>
                    {plan.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through">{plan.oldPrice}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/80 leading-normal">{plan.note}</p>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{plan.desc}</p>
                  <div className="mt-6 border-t border-border/60 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("servicesPage.common.youGet")}</p>
                    <ul className="mt-3 space-y-2">
                      {plan.includes?.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                          <span className="material-symbols-outlined text-foreground text-sm mt-0.5">check_circle</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-8">
                  <Link
                    to={`/booking?type=student&plan=${plan.id}`}
                    className="block w-full text-center rounded-2xl bg-foreground py-3 text-xs font-bold text-background transition-all hover:bg-foreground/90 active:scale-98"
                  >
                    {t("servicesPage.studentPlans.orderCta")}
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/student-pricing"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-6 py-3 text-xs font-bold uppercase tracking-wide text-foreground transition-colors duration-300 hover:border-primary hover:text-primary"
            >
              {t("servicesPage.studentPlans.detailsCta")}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* ================= HSSV MIỄN PHÍ — KHÁC BIỆT THƯƠNG HIỆU ================= */}
          <motion.section {...reveal} id="student-free" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-0">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-2xl sm:p-8 lg:p-10">
              <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
              <div className="pointer-events-none absolute bottom-[5%] left-[-4%] select-none text-[6rem] font-black leading-none tracking-tighter text-foreground/[0.03] sm:text-[9rem]">
                FREE
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <span className={`inline-flex rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] sm:text-[10px] ${heroBadge}`}>
                    {t("servicesPage.student.badge")}
                  </span>
                  <h2 className="font-display mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    {t("servicesPage.student.title1")}{" "}
                    <span className={`${brandGradient} bg-clip-text text-transparent`}>{t("servicesPage.student.title2")}</span>
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{t("servicesPage.student.desc")}</p>
                  <Link
                    to="/student-benefits"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-border/50 bg-card/70 px-6 py-3 text-xs font-bold uppercase tracking-wide text-foreground backdrop-blur transition-all duration-300 hover:border-primary hover:text-primary"
                  >
                    {t("servicesPage.student.cta")}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {studentItems.map(({ title, desc }, index) => (
                    <div key={title} className="rounded-3xl border border-border bg-background/55 p-4 backdrop-blur">
                      <MonoIcon name={STUDENT_ICONS[index]} className="h-10 w-10" />
                      <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </section>
        </>
      )}

      {priceMode === "micro" && (
        <>
          {/* ================= MICRO SERVICES (VIỆC LẺ) ================= */}
          <section id="pricing" className="relative mx-auto mt-16 max-w-7xl scroll-mt-24 px-4 sm:px-8 animate-fadeIn">
            <SectionHeading
              eyebrow={t("servicesPage.micro.eyebrow")}
              title={t("servicesPage.micro.title")}
              highlight={t("servicesPage.micro.highlight")}
              desc={t("servicesPage.micro.desc")}
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {microJobsList.map((job) => (
                <motion.article
                  key={job.id}
                  {...reveal}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/30 sm:p-5"
                >
                  <div>
                    {/* Header: Icon + Time */}
                    <div className="flex items-start justify-between gap-2">
                      <MonoIcon name={job.icon} />
                      <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        {job.time}
                      </span>
                    </div>

                    {/* Title + Description */}
                    <h3 className="font-display mt-3 text-base font-extrabold text-foreground group-hover:text-primary transition-colors duration-200">
                      {job.name}
                    </h3>
                    <p className="mt-2 text-[11px] sm:text-xs leading-tight text-muted-foreground/85">
                      {job.desc}
                    </p>
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/30 pt-3">
                    <p className="text-sm font-black text-foreground">{job.price}</p>
                    <Link
                      to={`/booking?type=micro&plan=${job.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-primary group-hover:underline whitespace-nowrap"
                    >
                      {t("servicesPage.micro.cta")}
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-12 rounded-[2rem] border border-dashed border-border bg-muted/30 p-6 sm:p-8 text-center max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute -inset-10 bg-primary/5 blur-2xl rounded-full" />
              <div className="relative z-10 space-y-3">
                <span className="material-symbols-outlined text-4xl text-muted-foreground">support_agent</span>
                <h4 className="font-display text-lg font-bold text-foreground">{t("servicesPage.micro.customTitle")}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("servicesPage.micro.customDesc")}
                </p>
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-bold text-background shadow-lg transition-all hover:bg-foreground/90 active:scale-95"
                >
                  {t("servicesPage.micro.customCta")}
                  <span className="material-symbols-outlined text-sm">chat</span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Demo comes after scope and price so visitors can evaluate proof without
          having to pass a large interactive block before finding the offer. */}
      <DemoShowcaseSection />

      {/* ================= TÂM TÍCH GIÁ CẢ & PHƯƠNG CHÂM LÀM VIỆC ================= */}
      <motion.section {...reveal} className="mx-auto mt-20 max-w-4xl px-4 sm:mt-28 sm:px-8">
        <div className="rounded-3xl border border-border bg-card/70 p-8 backdrop-blur sm:p-10">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("servicesPage.pricingPhilosophy.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("servicesPage.pricingPhilosophy.desc")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/80 sm:text-base italic">
            "{t("servicesPage.pricingPhilosophy.philosophy")}"
          </p>
        </div>
      </motion.section>

      {/* ================= QUY TRÌNH — TĂNG NIỀM TIN ================= */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:mt-28 sm:px-8">
        <SectionHeading
          eyebrow={t("servicesPage.process.eyebrow")}
          title={t("servicesPage.process.title")}
          highlight={t("servicesPage.process.highlight")}
          desc={t("servicesPage.process.desc")}
        />
        <motion.ol {...reveal} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workSteps.map((step, index) => (
            <li key={step} className="relative overflow-hidden rounded-3xl border border-border bg-card p-5">
              <div className={`absolute inset-x-0 top-0 h-1 ${brandGradient}`} />
              <div className="flex items-center gap-3">
                <MonoIcon name={STEP_ICONS[index]} />
                <span className="text-2xl font-extrabold text-foreground/15">0{index + 1}</span>
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">{step}</p>
            </li>
          ))}
        </motion.ol>
      </section>

      <FaqSection />

      {/* ================= CTA CUỐI — TƯ VẤN MIỄN PHÍ, KHÔNG RÀO CẢN ================= */}
      <section className="mx-auto mt-20 max-w-4xl px-4 text-center sm:mt-28 sm:px-8 print:hidden">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-xl sm:p-12">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
          <MonoIcon name="forum" className="mx-auto" />
          <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
            {t("servicesPage.finalCta.title1")}{" "}
            <span className={`${brandGradient} bg-clip-text text-transparent`}>{t("servicesPage.finalCta.title2")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("servicesPage.finalCta.desc")}</p>
          <CtaButton className="mt-7 px-8">{t("servicesPage.finalCta.cta")}</CtaButton>
        </motion.div>
      </section>
      </div>
    </div>
  );
}
