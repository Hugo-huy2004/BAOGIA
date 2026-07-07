import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";

const PhotographyDemo = lazy(() => import("../../components/demos/PhotographyDemo"));
const CoffeeDemo = lazy(() => import("../../components/demos/CoffeeDemo"));
const JewelryDemo = lazy(() => import("../../components/demos/JewelryDemo"));
const PortfolioDemo = lazy(() => import("../../components/demos/PortfolioDemo"));
const ECommerceDemo = lazy(() => import("../../components/demos/ECommerceDemo"));
const DashboardDemo = lazy(() => import("../../components/demos/DashboardDemo"));

function useJsonLd(id, schema) {
  useEffect(() => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => document.getElementById(id)?.remove();
  }, [id, schema]);
}

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

const brandGradient = "bg-gradient-to-r from-primary via-accent to-warning";
const heroBadge =
  "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]";

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

const BUILD_PLAN_IDS = ["landing", "website", "system"];
const CARE_PLAN_IDS = ["fix", "seo"];

const MICRO_ICONS = ["code", "palette", "smartphone", "widgets", "cloud_upload", "search", "bolt", "shield"];
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

function usePlans() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      PLAN_META.map((meta) => ({
        ...meta,
        ...t(`servicesPage.plans.${meta.id}`, { returnObjects: true }),
      })),
    [t]
  );
}

function MonoIcon({ name, className = "" }) {
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

function PlanCard({ plan, emphasized = false }) {
  const { t } = useTranslation();
  return (
    <motion.article
      {...reveal}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border bg-card p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
        emphasized
          ? "border-primary/40 shadow-2xl shadow-primary/15 ring-1 ring-primary/25 lg:scale-[1.04]"
          : "border-border shadow-xl shadow-primary/5 hover:shadow-2xl"
      }`}
    >
      {emphasized && <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />}
      {plan.tagline && (
        <span
          className={`absolute right-5 top-5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
            emphasized ? heroBadge : "border border-border bg-muted text-muted-foreground"
          }`}
        >
          {plan.tagline}
        </span>
      )}
      <div className="relative flex flex-1 flex-col">
        <MonoIcon name={plan.icon} />
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{plan.label}</p>
        <h3 className="font-display mt-2 text-xl font-extrabold tracking-tight text-foreground">{plan.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.desc}</p>
        <p className={`mt-5 text-3xl font-extrabold tracking-tight ${emphasized ? `${brandGradient} bg-clip-text text-transparent` : "text-foreground"}`}>
          {plan.price}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.note}</p>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("servicesPage.common.youGet")}</p>
        <ul className="mt-3 grid gap-2.5">
          {plan.includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm font-medium leading-relaxed text-foreground/80">
              <span className="material-symbols-outlined mt-0.5 text-base text-foreground">check_circle</span>
              {item}
            </li>
          ))}
        </ul>
        {plan.excludes && (
          <>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("servicesPage.common.notIncluded")}</p>
            <ul className="mt-3 grid gap-2">
              {plan.excludes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="material-symbols-outlined mt-0.5 text-sm">do_not_disturb_on</span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-auto pt-7">
          <CtaButton className="w-full">{t("servicesPage.common.discussPlan")}</CtaButton>
        </div>
      </div>
    </motion.article>
  );
}

function DemoShowcaseSection() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState("photography");
  const active = DEMO_META.find((tpl) => tpl.id === activeId);
  const ActiveDemo = active.Demo;

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
        <div className="w-full lg:w-1/3">
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

        {/* Khung mockup trình duyệt */}
        <div className="flex w-full justify-center lg:w-2/3 lg:justify-end">
          <div className="relative flex h-[55vh] w-full max-w-[300px] flex-col rounded-[2rem] border border-border bg-muted p-2 shadow-2xl sm:max-w-[340px] md:h-[640px] md:max-w-[420px] md:rounded-[2.5rem] md:p-4 lg:max-w-[460px]">
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
                  key={activeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="scrollbar-hide h-full w-full overflow-y-auto"
                  style={{ zoom: "0.8" }}
                >
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("servicesPage.demo.loading")}</div>
                    }
                  >
                    <ActiveDemo isMobile={true} />
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

export default function ServicesPage() {
  const { hash } = useLocation();
  const { t, i18n } = useTranslation();
  const plans = usePlans();

  const buildPlans = BUILD_PLAN_IDS.map((id) => plans.find((plan) => plan.id === id));
  const carePlans = CARE_PLAN_IDS.map((id) => plans.find((plan) => plan.id === id));
  const systemPlan = plans.find((plan) => plan.id === "system");

  const trustPoints = t("servicesPage.hero.trust", { returnObjects: true });
  const microItems = t("servicesPage.micro.items", { returnObjects: true });
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
        "@type": "Person",
        name: "Peter Hugo Wishpax Lê",
        alternateName: "Hugo Studio",
      },
      areaServed: "VN",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Bảng giá dịch vụ website",
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          description: plan.desc,
          url: `https://www.hugowishpax.studio/services${plan.href}`,
          priceCurrency: "VND",
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

  useJsonLd("services-schema", offerSchema);
  useJsonLd("services-faq-schema", faqSchema);

  return (
    <div className="relative w-full overflow-x-hidden pb-20 text-foreground">
      {/* Nền glow đồng bộ Landing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-6%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-[150px]" />
        <div className="absolute right-[-10%] top-[30rem] h-[50vw] w-[50vw] rounded-full bg-gradient-to-tr from-warning/10 to-primary/10 blur-[170px]" />
      </div>

      {/* ============================ HERO ============================ */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-20">
        {/* Watermark */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="pointer-events-none absolute left-[-6%] top-[8%] select-none text-[7rem] font-black leading-none tracking-tighter text-foreground/[0.03] dark:text-foreground/[0.02] sm:text-[11rem] lg:text-[14rem]"
        >
          PRICING
        </motion.div>

        {/* Orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute right-[8%] top-[12%] h-24 w-24 rounded-full bg-warning/30 blur-[50px] md:h-32 md:w-32"
        />
        <motion.div
          animate={{ y: [0, 30, 0], x: [0, -25, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="pointer-events-none absolute bottom-[5%] left-[10%] h-32 w-32 rounded-full bg-primary/30 blur-[60px] md:h-44 md:w-44"
        />

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-4xl text-center">
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

      {/* ================= BẢNG GIÁ CHÍNH: XÂY MỚI (Good–Better–Best) ================= */}
      <section id="pricing" className="relative mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <div id="build" className="absolute -top-24" />
        <SectionHeading
          eyebrow={t("servicesPage.pricing.eyebrow")}
          title={t("servicesPage.pricing.title")}
          highlight={t("servicesPage.pricing.highlight")}
          desc={t("servicesPage.pricing.desc")}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3 lg:gap-6">
          {buildPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} emphasized={plan.featured} />
          ))}
        </div>
      </section>

      {/* ================= DEMO — BẰNG CHỨNG NGAY SAU BẢNG GIÁ ================= */}
      <DemoShowcaseSection />

      {/* ================= ĐÃ CÓ WEB: SỬA + TỐI ƯU ================= */}
      <section id="fix" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <SectionHeading
          eyebrow={t("servicesPage.care.eyebrow")}
          title={t("servicesPage.care.title")}
          highlight={t("servicesPage.care.highlight")}
          desc={t("servicesPage.care.desc")}
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {carePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      {/* ================= VIỆC LẺ — BẬC THANG CAM KẾT THẤP ================= */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:mt-28 sm:px-8">
        <SectionHeading
          eyebrow={t("servicesPage.micro.eyebrow")}
          title={t("servicesPage.micro.title")}
          highlight={t("servicesPage.micro.highlight")}
          desc={t("servicesPage.micro.desc")}
        />
        <motion.div {...reveal} className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {microItems.map(({ title, price, desc }, index) => (
            <div
              key={title}
              className="group rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <MonoIcon name={MICRO_ICONS[index]} className="h-10 w-10" />
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-bold text-foreground">{price}</span>
              </div>
              <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ================= WEB ĐỘNG (#app) — GỌN, MỘT PANEL ================= */}
      <section id="app" className="mx-auto mt-20 max-w-5xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
          <div className="grid lg:grid-cols-[1fr_1.05fr]">
            {/* Trái: thông điệp + giá + CTA */}
            <div className="p-6 sm:p-10">
              <span className={`inline-flex rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] sm:text-[10px] ${heroBadge}`}>
                {t("servicesPage.app.badge")}
              </span>
              <h2 className="font-display mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {t("servicesPage.app.title1")}{" "}
                <span className={`${brandGradient} bg-clip-text text-transparent`}>{t("servicesPage.app.title2")}</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("servicesPage.app.desc")}</p>
              <p className={`mt-6 text-4xl font-extrabold ${brandGradient} bg-clip-text text-transparent`}>{systemPlan.price}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{systemPlan.note}</p>
              <CtaButton className="mt-7">{t("servicesPage.common.discussProject")}</CtaButton>
            </div>

            {/* Phải: phạm vi gói — một danh sách duy nhất */}
            <div className="border-t border-border bg-muted/40 p-6 sm:p-10 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("servicesPage.common.youGet")}</p>
              <ul className="mt-4 space-y-3">
                {systemPlan.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-medium leading-relaxed text-foreground/80">
                    <span className="material-symbols-outlined mt-0.5 text-base text-foreground">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("servicesPage.app.extendTitle")}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("servicesPage.app.extendDesc")}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================= HSSV MIỄN PHÍ — KHÁC BIỆT THƯƠNG HIỆU ================= */}
      <motion.section {...reveal} id="student-free" className="mx-auto mt-20 max-w-7xl scroll-mt-24 px-4 sm:mt-28 sm:px-8">
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
      <section className="mx-auto mt-20 max-w-4xl px-4 text-center sm:mt-28 sm:px-8">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-xl sm:p-12">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${brandGradient}`} />
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute right-[10%] top-[15%] h-20 w-20 rounded-full bg-accent/30 blur-[40px]"
          />
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
  );
}
