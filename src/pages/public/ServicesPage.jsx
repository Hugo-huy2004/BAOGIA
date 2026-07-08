import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";

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

const STATIC_PLAN_IDS = ["landing", "website"];
const DYNAMIC_PLAN_IDS = ["system"];
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

function Whisper({ text, delay = 0 }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 0.6 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay }}
      className="mx-auto max-w-2xl text-center text-sm italic text-muted-foreground/70 py-6 px-4 border-l-2 border-accent/30"
    >
      "{text}"
    </motion.p>
  );
}

function JourneyChapter({ badge, desc, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="my-12 px-4 sm:px-8"
    >
      <div className="mx-auto max-w-3xl text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 backdrop-blur-sm">
          <span className="text-xs font-bold text-primary tracking-wider">{badge}</span>
        </div>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
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
        <MonoIcon name={plan.icon} bare />
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{plan.label}</p>
        <h3 className="font-display mt-2 text-xl font-extrabold tracking-tight text-foreground">{plan.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.desc}</p>
        <div className="mt-5">
          {plan.oldPrice && (
            <p className="text-sm font-semibold tracking-tight text-muted-foreground line-through">{plan.oldPrice}</p>
          )}
          <p className={`text-3xl font-extrabold tracking-tight ${emphasized ? `${brandGradient} bg-clip-text text-transparent` : "text-foreground"}`}>
            {plan.price}
          </p>
        </div>
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
              { id: "desktop", label: "Máy tính", icon: "laptop" },
              { id: "tablet", label: "Máy tính bảng", icon: "tablet_mac" },
              { id: "mobile", label: "Điện thoại", icon: "smartphone" }
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

export default function ServicesPage() {
  const { hash } = useLocation();
  const { t, i18n } = useTranslation();
  const plans = usePlans();

  const [priceMode, setPriceMode] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("type") === "student" ? "student" : "commercial";
  });

  const [courseworkStack, setCourseworkStack] = useState("react");

  const staticPlans = STATIC_PLAN_IDS.map((id) => plans.find((plan) => plan.id === id));
  const dynamicPlans = DYNAMIC_PLAN_IDS.map((id) => plans.find((plan) => plan.id === id));
  const carePlans = CARE_PLAN_IDS.map((id) => plans.find((plan) => plan.id === id));

  const studentPlans = useMemo(() => {
    const plansKeys = ["bug", "bento", "coursework"];
    const icons = ["handyman", "contact_page", "code"];
    return plansKeys.map((key, index) => {
      const planData = t(`servicesPage.studentPlans.${key}`, { returnObjects: true });
      return {
        id: key,
        icon: icons[index],
        ...planData,
      };
    });
  }, [t]);

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
      <div className="print:hidden">

      {/* ================= STUDENT BIO PROMO TAB ================= */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-14 z-40 mx-auto max-w-7xl px-4 sm:px-8 py-3 mb-4"
      >
        <div className="rounded-2xl border border-blue-300/30 dark:border-blue-600/30 bg-gradient-to-r from-blue-50/80 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/30 backdrop-blur-sm p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">school</span>
                <h3 className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200">
                  Bio Trang Cá Nhân Miễn Phí Cho Sinh Viên
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-800/80 dark:text-blue-300/80 ml-8">
                Email .edu = Trang bio đẹp, tùy chỉnh toàn bộ. Nhấn ngay để xác minh.
              </p>
            </div>
            <Link
              to="/student-benefits"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold text-xs sm:text-sm transition-all hover:shadow-lg active:scale-95"
            >
              <span>Xác Minh Ngay</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </motion.div>

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

      {/* ================= DEMO — BẰNG CHỨNG THỰC TẾ (VISUAL HOOK) ================= */}
      <DemoShowcaseSection />

      <Whisper text={t("servicesPage.whispers.between2")} delay={0.2} />

      {/* ================= BỘ GẠT CHUYỂN ĐỔI BẢNG GIÁ ================= */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-8 text-center relative z-10 print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="relative inline-flex rounded-full bg-muted/65 p-1 border border-border">
            {/* Background sliding indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-foreground"
              animate={{
                left: priceMode === "commercial" ? "4px" : "calc(50% + 2px)",
                width: "calc(50% - 6px)",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
            <button
              onClick={() => setPriceMode("commercial")}
              className={`relative rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                priceMode === "commercial" ? "text-background z-10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cá nhân / Doanh nghiệp
            </button>
            <button
              onClick={() => setPriceMode("student")}
              className={`relative rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                priceMode === "student" ? "text-background z-10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Học sinh & Sinh viên (-20%)
            </button>
          </div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl px-4 sm:px-8 mt-8"
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-4">
          <div className="flex gap-3 items-start">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">info</span>
            <div className="text-xs text-amber-900 dark:text-amber-100">
              <strong>Lưu ý:</strong> Các mức giá dưới đây là <strong>tham khảo</strong> dựa trên phạm vi công việc. Giá cuối cùng sẽ được thỏa thuận chi tiết qua tư vấn cá nhân. Liên hệ Hugo Studio để nhận báo giá cụ thể cho dự án của bạn.
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= JOURNEY INTRO ================= */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mx-auto max-w-5xl px-4 sm:px-8 mt-16 sm:mt-24"
      >
        <div className="text-center space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
            Một hành trình có tinh hồn
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Mỗi dịch vụ không phải một bảng giá. Đó là một bước trong hành trình khám phá. Từ những viên đá tâm hồn nhỏ bé — khi bạn lần đầu nhận ra cần thay đổi — đến những hòn ngọc giữa Đại Dương — khi website sống, thở, và làm việc cho bạn.
          </p>
          <p className="text-sm text-muted-foreground/60 italic">
            Chọn điểm bắt đầu của bạn. Tôi sẽ đồng hành từng bước.
          </p>
        </div>
      </motion.div>

      {priceMode === "commercial" ? (
        <>
          {/* ================= WEBSITE & ỨNG DỤNG WEB ================= */}
          <section id="pricing" className="relative mx-auto mt-16 max-w-7xl scroll-mt-24 px-4 sm:mt-24 sm:px-8">
            <div id="build" className="absolute -top-24" />
            <SectionHeading
              eyebrow={t("servicesPage.pricing.eyebrow")}
              title={t("servicesPage.pricing.title")}
              highlight={t("servicesPage.pricing.highlight")}
              desc={t("servicesPage.pricing.desc")}
            />
            <div className="mt-12 space-y-8">
              {/* Services as Chapters */}
              <JourneyChapter
                badge={t("servicesPage.journey.stone1.badge")}
                desc={t("servicesPage.journey.stone1.desc")}
                index={0}
              />
              <div className="grid gap-6 md:grid-cols-2 lg:w-2/3">
                <PlanCard plan={staticPlans[0]} />
                <PlanCard plan={carePlans[0]} />
              </div>

              <JourneyChapter
                badge={t("servicesPage.journey.stone2.badge")}
                desc={t("servicesPage.journey.stone2.desc")}
                index={1}
              />
              <div className="grid gap-6 md:grid-cols-2 lg:w-2/3">
                <PlanCard plan={carePlans[1]} />
                <PlanCard plan={staticPlans[0]} />
              </div>

              <JourneyChapter
                badge={t("servicesPage.journey.stone3.badge")}
                desc={t("servicesPage.journey.stone3.desc")}
                index={2}
              />
              <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
                <PlanCard plan={staticPlans[1]} emphasized={true} />
              </div>

              <JourneyChapter
                badge={t("servicesPage.journey.stone4.badge")}
                desc={t("servicesPage.journey.stone4.desc")}
                index={3}
              />
              <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
                <PlanCard plan={dynamicPlans[0]} />
              </div>

              <JourneyChapter
                badge={t("servicesPage.journey.stone5.badge")}
                desc={t("servicesPage.journey.stone5.desc")}
                index={4}
              />
            </div>
          </section>
        </>
      ) : (
        /* ================= BẢNG GIÁ DÀNH RIÊNG HSSV ================= */
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl px-4 sm:px-8 mt-8"
        >
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20 p-4">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">info</span>
              <div className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Lưu ý:</strong> Các mức giá dưới đây là <strong>tham khảo</strong> dành cho học sinh, sinh viên. Giá cuối cùng sẽ được thỏa thuận chi tiết qua tư vấn cá nhân. Liên hệ Hugo Studio để nhận báo giá cụ thể cho dự án của bạn.
              </div>
            </div>
          </div>
        </motion.div>
        <section id="pricing" className="relative mx-auto mt-16 max-w-7xl scroll-mt-24 px-4 sm:px-8 animate-fadeIn">
          <div id="build" className="absolute -top-24" />
          <SectionHeading
            eyebrow={t("servicesPage.student.badge")}
            title={t("servicesPage.pricing.title")}
            highlight={t("servicesPage.pricing.highlight")}
            desc={t("servicesPage.pricing.desc")}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {studentPlans.map((plan) => {
              const isCoursework = plan.id === "coursework";
              const currentStackData = isCoursework ? plan.stacks[courseworkStack] : null;
              const displayPrice = isCoursework ? currentStackData.price : plan.price;
              const displayOldPrice = isCoursework ? currentStackData.oldPrice : plan.oldPrice;
              const displayDiscount = isCoursework ? currentStackData.discount : plan.discount;
              const displayNote = isCoursework ? currentStackData.note : plan.note;
              const displayDesc = isCoursework ? currentStackData.desc : plan.desc;
              const displayIncludes = isCoursework ? currentStackData.includes : plan.includes;

              return (
                <motion.article
                  {...reveal}
                  key={plan.id}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <MonoIcon name={plan.icon} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
                      {displayDiscount && (
                        <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {displayDiscount}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display mt-5 text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                    {/* Tech Stack selector pills */}
                    {isCoursework && (
                      <div className="mt-4 flex flex-wrap gap-1 p-1 rounded-2xl bg-muted/80 border border-border relative z-10">
                        {[
                          { id: "html", label: "HTML/CSS/JS" },
                          { id: "php", label: "PHP/SQL" },
                          { id: "react", label: "React/Node" }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setCourseworkStack(s.id)}
                            className={`flex-1 rounded-xl px-2 py-1.5 text-[9px] font-bold uppercase transition-all duration-200 ${
                              courseworkStack === s.id
                                ? "bg-foreground text-background shadow"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-foreground">{displayPrice}</span>
                      {displayOldPrice && (
                        <span className="text-xs text-muted-foreground line-through">{displayOldPrice}</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground/80 leading-normal">{displayNote}</p>
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{displayDesc}</p>
                    <div className="mt-6 border-t border-border/60 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bạn nhận được:</p>
                      <ul className="mt-3 space-y-2">
                        {displayIncludes?.slice(0, 4).map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                            <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-8">
                    <Link
                      to={
                        isCoursework
                          ? `/booking?type=student&plan=coursework&stack=${courseworkStack}`
                          : `/booking?type=student&plan=${plan.id}`
                      }
                      className="block w-full text-center rounded-2xl bg-foreground py-3 text-xs font-bold text-background transition-all hover:bg-foreground/90 active:scale-98"
                    >
                      Đăng ký gói sinh viên
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/student-pricing"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border/50 bg-card/70 px-6 py-3 text-xs font-bold uppercase tracking-wide text-foreground backdrop-blur transition-all duration-300 hover:border-primary hover:text-primary animate-pulse-slow"
            >
              Xem điều kiện xác minh & Chi tiết gói HSSV
              <span className="material-symbols-outlined text-sm animate-bounceRight">arrow_forward</span>
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

      <Whisper text={t("servicesPage.whispers.intro")} delay={0.2} />

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

      <Whisper text={t("servicesPage.whispers.between1")} delay={0.2} />

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
    </div>
  );
}
