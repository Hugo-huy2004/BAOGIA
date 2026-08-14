import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { withUsdPrices } from "../../utils/priceFormatter";
import WebMagnet from "../../components/ui/WebMagnet";
import RegionNote from "../../components/public/RegionNote";
import CodeHeroFilm from "../../components/public/CodeHeroFilm";
import {
  ACCENT,
  AboutCard,
  CINE_CSS,
  CineSectionHeading,
  CoverColorShift,
  EASE,
  INK,
  INK_DIM,
  ScrollProgressBar,
  SwipeDownCue,
  WordsPullUp,
  useCineScrollSnap,
} from "../../components/public/cineKit";

const PhotographyDemo = lazy(() => import("../../components/demos/PhotographyDemo"));
const CoffeeDemo = lazy(() => import("../../components/demos/CoffeeDemo"));
const PortfolioDemo = lazy(() => import("../../components/demos/PortfolioDemo"));
const ECommerceDemo = lazy(() => import("../../components/demos/ECommerceDemo"));
const JewelryDemo = lazy(() => import("../../components/demos/JewelryDemo"));
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
  "ios-kicker";

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
  { id: "portfolio", icon: "person", Demo: PortfolioDemo },
  { id: "cafe", icon: "local_cafe", Demo: CoffeeDemo },
  { id: "photography", icon: "photo_camera", Demo: PhotographyDemo },
  { id: "ecommerce", icon: "storefront", Demo: ECommerceDemo },
  { id: "jewelry", icon: "diamond", Demo: JewelryDemo },
  { id: "dashboard", icon: "space_dashboard", Demo: DashboardDemo },
];

function DemoTeaserArt({ id }) {
  const reduceMotion = useReducedMotion();
  const floatTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 3.6, repeat: Infinity, ease: "easeInOut" };

  return (
    <div className="relative h-32 overflow-hidden rounded-[1.35rem] border border-white/40 bg-[linear-gradient(145deg,hsl(var(--background)/0.9),hsl(var(--primary)/0.1),rgba(175,82,222,0.1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:h-36">
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
      <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-foreground/5 blur-2xl" />
      {id === "portfolio" && (
        <motion.div
          whileInView={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [-1, 1, -1] }}
          viewport={{ amount: 0.25 }}
          transition={floatTransition}
          className="absolute inset-x-7 bottom-[-1rem] top-5 rounded-t-[1.35rem] border border-white/50 bg-card/90 p-3 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="h-1.5 w-14 rounded-full bg-foreground/15" />
            <span className="material-symbols-outlined text-base text-primary">menu</span>
          </div>
          <div className="mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl">person</span>
          </div>
          <div className="mx-auto mt-2 h-2 w-24 rounded-full bg-foreground/15" />
          <div className="mx-auto mt-1.5 h-1.5 w-16 rounded-full bg-foreground/10" />
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((item) => <span key={item} className="h-7 rounded-lg bg-primary/10" />)}
          </div>
        </motion.div>
      )}
      {id === "cafe" && (
        <>
          <motion.span
            whileInView={reduceMotion ? undefined : { y: [2, -5, 2], opacity: [0.35, 0.9, 0.35] }}
            viewport={{ amount: 0.25 }}
            transition={{ ...floatTransition, duration: 2.6 }}
            className="material-symbols-outlined absolute left-1/2 top-5 -translate-x-1/2 text-6xl text-primary"
          >
            local_cafe
          </motion.span>
          <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-2">
            {["bakery_dining", "lunch_dining", "icecream"].map((icon, index) => (
              <motion.span
                key={icon}
                whileInView={reduceMotion ? undefined : { y: [0, index % 2 ? 3 : -3, 0] }}
                viewport={{ amount: 0.25 }}
                transition={{ ...floatTransition, delay: index * 0.2 }}
                className="material-symbols-outlined flex h-10 items-center justify-center rounded-xl border border-white/40 bg-card/75 text-base text-foreground shadow-sm backdrop-blur-xl"
              >
                {icon}
              </motion.span>
            ))}
          </div>
        </>
      )}
      {id === "photography" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[-1, 0, 1].map((offset) => (
            <motion.div
              key={offset}
              whileInView={reduceMotion ? undefined : { y: [0, offset === 0 ? -6 : -3, 0], rotate: [offset * 8, offset * 5, offset * 8] }}
              viewport={{ amount: 0.25 }}
              transition={{ ...floatTransition, delay: (offset + 1) * 0.18 }}
              className={`absolute h-24 w-[4.5rem] rounded-xl border border-white/50 bg-card/90 p-1.5 shadow-xl backdrop-blur-xl ${offset === 0 ? "z-10" : ""}`}
              style={{ transform: `translateX(${offset * 48}px) rotate(${offset * 8}deg)` }}
            >
              <div className="flex h-full items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">{offset === 0 ? "photo_camera" : "image"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {id === "ecommerce" && (
        <div className="absolute inset-4 rounded-[1.25rem] border border-white/50 bg-card/80 p-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="h-2 w-16 rounded-full bg-foreground/15" />
            <span className="material-symbols-outlined text-lg text-primary">shopping_bag</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["checkroom", "styler", "watch"].map((icon, index) => (
              <motion.div
                key={icon}
                whileInView={reduceMotion ? undefined : { y: [0, index === 1 ? -4 : 2, 0] }}
                viewport={{ amount: 0.25 }}
                transition={{ ...floatTransition, delay: index * 0.16 }}
                className="rounded-xl bg-primary/[0.08] p-2 text-center"
              >
                <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
                <span className="mx-auto mt-2 block h-1.5 w-8 rounded-full bg-foreground/15" />
                <span className="mx-auto mt-1 block h-1 w-5 rounded-full bg-foreground/10" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {id === "jewelry" && (
        <div className="absolute inset-4 flex overflow-hidden rounded-[1.25rem] border border-white/50 bg-card/80 shadow-xl backdrop-blur-xl">
          <div className="flex w-2/5 flex-col justify-between p-3">
            <span className="h-1.5 w-10 rounded-full bg-foreground/15" />
            <div>
              <span className="block h-2 w-14 rounded-full bg-foreground/20" />
              <span className="mt-2 block h-1.5 w-10 rounded-full bg-foreground/10" />
            </div>
            <span className="flex h-6 w-14 items-center justify-center rounded-full bg-foreground text-background">
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>
          <motion.div
            whileInView={reduceMotion ? undefined : { scale: [0.96, 1.04, 0.96], rotate: [-3, 3, -3] }}
            viewport={{ amount: 0.25 }}
            transition={{ ...floatTransition, duration: 4.4 }}
            className="m-2 flex flex-1 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"
          >
            <span className="material-symbols-outlined text-6xl">diamond</span>
          </motion.div>
        </div>
      )}
      {id === "dashboard" && (
        <div className="absolute inset-4 flex overflow-hidden rounded-[1.25rem] border border-white/50 bg-card/85 p-2 shadow-xl backdrop-blur-xl">
          <div className="flex w-9 flex-col items-center gap-2 rounded-xl bg-foreground/[0.05] py-2">
            {["home", "receipt_long", "group", "settings"].map((icon) => (
              <span key={icon} className="material-symbols-outlined text-[13px] text-foreground/45">{icon}</span>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((item) => <span key={item} className="h-7 flex-1 rounded-lg bg-primary/[0.08]" />)}
            </div>
            <div className="mt-2 flex h-[4.6rem] items-end gap-1 rounded-xl bg-foreground/[0.04] px-3 pb-2 pt-3">
              {[34, 58, 44, 78, 62, 88].map((height, index) => (
                <motion.span
                  key={height}
                  initial={reduceMotion ? false : { height: "12%" }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.08, duration: 0.5, ease: EASE }}
                  className="flex-1 rounded-t bg-primary/45"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

const MOBILE_SERVICE_QUERY = "(max-width: 767px), (max-width: 1023px) and (pointer: coarse), (max-height: 500px) and (pointer: coarse)";

function useMobileServiceLayout() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== "undefined" && window.matchMedia(MOBILE_SERVICE_QUERY).matches
  ));

  useEffect(() => {
    const query = window.matchMedia(MOBILE_SERVICE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return isMobile;
}

function MonoIcon({ name, className = "" }) {
  return (
    <span
      className={`ios-icon-surface h-11 w-11 shrink-0 ${className}`}
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
        className={`ios-primary-button group inline-flex w-full items-center justify-center gap-2 ${className}`}
      >
        <span>{children}</span>
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </WebMagnet>
  );
}

/* ---------------------------------------------------------------------------
   HERO — khung lớn cùng mascot CSS chuyển động với Introduction
   ------------------------------------------------------------------------- */

function HeroSection({ t, mobileLayout = false }) {
  const sectionRef = useRef(null);
  const scrollRootRef = useRef(typeof document === "undefined" ? null : document.getElementById("root"));
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    container: scrollRootRef,
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.62, 0.94], [1, 0.94, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -44]);
  const filmScale = useTransform(scrollYProgress, [0, 1], [1, 1.035]);

  return (
      <section ref={sectionRef} className="ios-hero studio-cover studio-cover--service">
        <motion.div className="studio-cover-film-shell" style={{ scale: reduceMotion || mobileLayout ? 1 : filmScale }}>
          <CodeHeroFilm variant="chat" />
        </motion.div>
        <CoverColorShift progress={scrollYProgress} variant="service" />
          <div className="code-film-content studio-cover-grid grid items-center gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <motion.div
              className="studio-cover-copy max-w-3xl"
              style={{ opacity: reduceMotion ? 1 : copyOpacity, y: reduceMotion ? 0 : copyY }}
            >
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="ios-kicker mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("servicesPage.hero.badge")}
              </motion.p>
              <h1 className="text-[clamp(2.45rem,6vw,5.6rem)] font-extrabold leading-[1.04] tracking-[-0.04em]" style={{ color: INK, fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
                <WordsPullUp text={t("servicesPage.hero.title1")} />
                <span className="block cine-grad"><WordsPullUp text={t("servicesPage.hero.title2")} /></span>
              </h1>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48, duration: 0.6, ease: EASE }} className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/booking" className="ios-primary-button inline-flex items-center gap-2">
                  {t("servicesPage.hero.contact")}<CalendarCheck size={15} />
                </Link>
              </motion.div>
            </motion.div>
            <div className="code-film-stage-space" aria-hidden="true" />
          </div>
        <SwipeDownCue
          targetId="service-fit"
          touchLabel={t("servicesPage.hero.swipe")}
          desktopLabel={t("servicesPage.hero.scroll")}
          style={{ opacity: reduceMotion ? 0.78 : undefined }}
        />
      </section>
  );
}

// Bước phân nhóm, không chiếm trọn màn hình: khách phải thấy ngay nội dung kế
// tiếp thay vì phải cuộn hết một khung hình mới có gì để đọc.
function ServiceChoiceSlide({ t, activeMode, onChoose }) {
  const outcomes = t("servicesPage.outcomes.items", { returnObjects: true });
  const choices = [
    { mode: "commercial", icon: "language" },
    { mode: "micro", icon: "handyman" },
    { mode: "student", icon: "school" },
  ];

  return (
    <section id="service-fit" className="studio-content-slide studio-content-slide--service relative z-10 flex items-center px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <CineSectionHeading
          eyebrow={t("servicesPage.outcomes.eyebrow")}
          title={t("servicesPage.outcomes.title")}
          desc={t("servicesPage.outcomes.desc")}
        />
        <div className="mt-9 grid gap-4 lg:grid-cols-3" aria-label={t("servicesPage.outcomes.eyebrow")}>
          {choices.map((choice, index) => {
            const item = outcomes[index];
            const selected = activeMode === choice.mode;
            return (
              <motion.button
                key={choice.mode}
                type="button"
                aria-pressed={selected}
                onClick={() => onChoose(choice.mode)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: EASE }}
                whileTap={{ scale: 0.985 }}
                className={`group flex min-h-[12rem] flex-col rounded-[1.75rem] border p-5 text-left transition-colors sm:p-6 ${
                  selected
                    ? "border-primary/45 bg-primary/10 shadow-[0_18px_45px_hsl(var(--primary)/0.1)]"
                    : "cine-card-bg cine-border-c cine-hover-border"
                }`}
              >
                <span className="ios-icon-surface h-10 w-10">
                  <span className="material-symbols-outlined text-[19px]">{choice.icon}</span>
                </span>
                <span className="mt-5 text-base font-extrabold leading-snug sm:text-lg" style={{ color: INK }}>{item.title}</span>
                <span className="cine-muted mt-2 text-xs leading-relaxed sm:text-sm">{item.desc}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold" style={{ color: ACCENT }}>
                  {item.cta}
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="cine-faint mx-auto mt-5 max-w-2xl text-center text-xs italic">{t("servicesPage.disclaimer")}</p>
      </div>
    </section>
  );
}

function TrustStrip({ t }) {
  const trustPoints = t("servicesPage.hero.trust", { returnObjects: true });
  return (
    <section className="px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
      <div className="cine-card-bg mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-[1.75rem] border lg:grid-cols-4">
        {trustPoints.map((label, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06, duration: 0.45, ease: EASE }} className={`flex items-center gap-3 px-4 py-5 sm:px-6 ${index % 2 === 0 ? "border-r border-border/55" : ""} ${index < 2 ? "border-b border-border/55 lg:border-b-0" : ""} ${index > 0 ? "lg:border-l lg:border-border/55" : ""}`}>
            <span className="ios-icon-surface h-9 w-9 shrink-0"><span className="material-symbols-outlined text-[17px]">{TRUST_ICONS[index]}</span></span>
            <p className="cine-faint text-[11px] leading-snug sm:text-xs">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
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
      whileHover={{ y: -3 }}
      className={`cine-card-bg group relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-6 transition-colors sm:p-8 ${
        emphasized ? "border-primary/30" : "cine-hover-border"
      }`}
    >
      {emphasized && <div className="absolute inset-x-0 top-0 h-1 bg-primary" />}

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

      <div className="mt-auto pt-6">
        <CtaButton>{t("servicesPage.common.getQuote")}</CtaButton>
      </div>
    </motion.article>
  );
}

function StudentPrioritySection({ items }) {
  const { t } = useTranslation();

  return (
    <section id="student-first" className="px-4 py-10 md:px-6 md:py-14">
      <AboutCard className="relative mx-auto max-w-6xl overflow-hidden p-6 sm:p-10 md:p-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
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
            <div className="mt-7 flex flex-wrap gap-3">
              <CtaButton to="/student-pricing" wrapClassName="w-full sm:w-auto">
                {t("servicesPage.student.cta")}
              </CtaButton>
              <Link
                to="/login"
                className="ios-secondary-button inline-flex items-center gap-2"
              >
                {t("intro.slide10.registerBtn")}
                <ArrowRight size={14} className="-rotate-45" />
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(({ title, desc }, index) => (
              <div key={title} className="cine-card2-bg rounded-3xl p-5">
                <MonoIcon name={STUDENT_ICONS[index]} className="h-10 w-10" />
                <h3 className="mt-4 text-sm font-bold" style={{ color: INK }}>{title}</h3>
                <p className="cine-muted mt-2 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AboutCard>
    </section>
  );
}

function StudentCustomSupport() {
  const { t } = useTranslation();
  const items = t("servicesPage.student.customItems", { returnObjects: true });
  const icons = ["badge", "handyman", "code_blocks"];

  return (
    <section id="pricing" className="relative scroll-mt-24 px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl">
        <CineSectionHeading
          eyebrow={t("servicesPage.student.customEyebrow")}
          title={t("servicesPage.student.customTitle")}
          desc={t("servicesPage.student.customDesc")}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <AboutCard key={item.title} className="p-6 text-left">
              <MonoIcon name={icons[index]} />
              <h3 className="font-display mt-5 text-lg font-bold" style={{ color: INK }}>{item.title}</h3>
              <p className="cine-muted mt-3 text-sm leading-relaxed">{item.desc}</p>
            </AboutCard>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaButton to="/booking?type=student" wrapClassName="w-full max-w-sm">
            {t("servicesPage.student.customCta")}
          </CtaButton>
          <Link
            to="/student-pricing"
            className="ios-secondary-button inline-flex items-center gap-2"
          >
            {t("servicesPage.studentPlans.detailsCta")}
            <ArrowRight size={14} className="-rotate-45" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function DemoShowcaseSection({ compact = false }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const previewRef = useRef(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeId, setActiveId] = useState("portfolio");
  const [device, setDevice] = useState("mobile"); // "desktop" | "tablet" | "mobile"
  // Nhãn của phòng xem mẫu đi qua i18n như phần còn lại của trang, nên nó có
  // đủ chín ngôn ngữ thay vì chỉ vi/en như bản tạm trước đây.
  const copy = t("servicesPage.demoLibrary", { returnObjects: true });
  const active = DEMO_META.find((tpl) => tpl.id === activeId) || DEMO_META[0];
  const ActiveDemo = active.Demo;
  const activeDetail = copy.details[active.id];

  const selectTemplate = (id, moveToPreview = false) => {
    setActiveId(id);
    if (!moveToPreview) return;
    setIsPreviewOpen(true);
    window.setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, 60);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    window.setTimeout(() => {
      document.getElementById("templates")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 30);
  };

  // Mỗi chế độ chỉ thay kích thước khung; demo React vẫn chỉ mount đúng một mẫu.
  let mockupWidthClasses = compact
    ? "h-[min(60svh,32rem)] min-h-[20rem] w-full max-w-[23rem]"
    : "h-[540px] w-[300px] max-w-full sm:w-[340px] md:h-[590px]";
  if (!compact && device === "desktop") {
    mockupWidthClasses = "h-[460px] w-full max-w-[820px] md:h-[520px]";
  } else if (!compact && device === "tablet") {
    mockupWidthClasses = "h-[570px] w-[440px] max-w-full";
  }

  const devices = [
    { id: "desktop", label: t("servicesPage.devices.desktop"), icon: "laptop" },
    { id: "tablet", label: t("servicesPage.devices.tablet"), icon: "tablet_mac" },
    { id: "mobile", label: t("servicesPage.devices.mobile"), icon: "smartphone" },
  ];

  return (
    <section id="templates" className={`relative scroll-mt-24 overflow-hidden px-4 md:px-6 ${compact ? "py-8" : "py-10 md:py-12"}`}>
      <div className="cine-bg-noise pointer-events-none absolute inset-0 opacity-[0.12]" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-foreground/[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="w-full">
          <CineSectionHeading
            eyebrow={t("servicesPage.demo.eyebrow")}
            title={t("servicesPage.demo.title")}
            highlight={t("servicesPage.demo.highlight")}
            desc={compact ? undefined : copy.description}
          />
        </div>

        <motion.div {...reveal} className={`scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 ${compact ? "mt-5" : "mt-7"}`}>
          {DEMO_META.map((tpl) => {
            const selected = isPreviewOpen && activeId === tpl.id;
            return (
              <motion.button
                key={tpl.id}
                type="button"
                aria-pressed={selected}
                aria-expanded={selected}
                aria-controls="template-preview"
                aria-label={`${copy.open}: ${t(`servicesPage.demo.templates.${tpl.id}.title`)}`}
                onClick={() => selectTemplate(tpl.id, true)}
                whileTap={{ scale: 0.985 }}
                className={`group w-[72vw] max-w-[17rem] shrink-0 snap-center overflow-hidden rounded-[1.6rem] border p-1.5 text-left shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow,transform] duration-300 sm:w-[15rem] lg:w-auto lg:max-w-none ${
                  selected
                    ? "border-primary/45 bg-primary/[0.06] shadow-[0_20px_60px_hsl(var(--primary)/0.12)]"
                    : "cine-card-bg cine-border-c hover:border-primary/30"
                }`}
              >
                <span className="relative block">
                  <DemoTeaserArt id={tpl.id} />
                  <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-background/75 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur-xl">
                    {copy.live}
                  </span>
                </span>

                <span className="block px-2.5 pb-2.5 pt-3">
                  <span className="flex items-start gap-3">
                    <MonoIcon name={tpl.icon} className="h-8 w-8 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold leading-tight" style={{ color: INK }}>
                        {t(`servicesPage.demo.templates.${tpl.id}.title`)}
                      </span>
                      <span className="cine-faint mt-1 block truncate text-[9px]">{t(`servicesPage.demo.templates.${tpl.id}.subtitle`)}</span>
                    </span>
                  </span>
                  <span className="cine-border-c mt-3 flex items-center justify-between border-t pt-2.5 text-[9px] font-extrabold text-primary">
                    {selected ? copy.selected : copy.open}
                    <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                  </span>
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {isPreviewOpen && (
          <div
            ref={previewRef}
            id="template-preview"
            className={`${compact ? "mt-6" : "mt-8"} relative scroll-mt-24 rounded-[2.25rem] border border-white/40 bg-background/55 p-3 shadow-[0_32px_100px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-4 md:rounded-[2.5rem] md:p-5`}
          >
          {compact && (
            <button
              type="button"
              aria-label={copy.close}
              onClick={closePreview}
              className="absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-xl"
            >
              <span className="material-symbols-outlined text-[19px]">close</span>
            </button>
          )}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className={`max-w-2xl ${compact ? "pr-12" : ""}`}>
              <p className="ios-kicker">{copy.previewTitle}</p>
              <h3 className="font-display mt-3 text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: INK }}>
                {t(`servicesPage.demo.templates.${active.id}.title`)}
              </h3>
              <p className="cine-muted mt-2 text-xs leading-relaxed sm:text-sm">{compact ? activeDetail.fit : copy.previewHint}</p>
              {compact && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeDetail.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-foreground/[0.055] px-2.5 py-1 text-[9px] font-bold" style={{ color: INK }}>
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!compact && <div className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-border/50 bg-card/70 p-1 sm:w-fit" aria-label={copy.previewTitle}>
              {devices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={device === item.id}
                  aria-label={item.label}
                  onClick={() => setDevice(item.id)}
                  className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-bold transition-colors sm:px-4 ${
                    device === item.id ? "bg-foreground text-background shadow-sm" : "cine-muted hover:bg-foreground/[0.05]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>}
          </div>

          <div className="scrollbar-hide mt-6 flex snap-x gap-2 overflow-x-auto pb-2" role="tablist" aria-label={copy.previewTitle}>
            {DEMO_META.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                role="tab"
                aria-selected={activeId === tpl.id}
                aria-controls="template-preview-panel"
                onClick={() => selectTemplate(tpl.id)}
                className={`flex min-h-11 min-w-max snap-start items-center gap-2 rounded-2xl border px-3.5 text-[10px] font-extrabold transition-colors ${
                  activeId === tpl.id
                    ? "border-foreground bg-foreground text-background"
                    : "cine-card-bg cine-border-c hover:border-primary/35"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tpl.icon}</span>
                {t(`servicesPage.demo.templates.${tpl.id}.short`)}
              </button>
            ))}
          </div>

          <div className={`mt-4 grid items-start gap-5 ${compact ? "" : "xl:grid-cols-[15rem_minmax(0,1fr)]"}`}>
            {!compact && <aside className="cine-card-bg cine-border-c rounded-[1.75rem] border p-5">
              <span className="inline-flex rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em]" style={{ color: INK }}>
                {copy.live}
              </span>
              <p className="cine-faint mt-5 text-[9px] font-bold uppercase tracking-[0.14em]">{copy.fits}</p>
              <p className="mt-2 text-sm font-bold leading-relaxed" style={{ color: INK }}>{activeDetail.fit}</p>
              <p className="cine-faint mt-5 text-[9px] font-bold uppercase tracking-[0.14em]">{copy.included}</p>
              <ul className="mt-3 space-y-2.5">
                {activeDetail.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs font-semibold" style={{ color: INK }}>
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="cine-muted mt-5 border-t border-border/50 pt-4 text-[10px] leading-relaxed">
                {copy.liveNotice}
              </p>
              <CtaButton wrapClassName="mt-5 w-full">{t("servicesPage.demo.cta")}</CtaButton>
            </aside>}

            <div className="flex w-full justify-center">
              <div className={`cine-card2-bg cine-border-c relative flex flex-col rounded-[1.75rem] border p-2 shadow-2xl transition-[width,height] duration-300 md:rounded-[2.25rem] md:p-3 ${mockupWidthClasses}`}>
                <div
                  id="template-preview-panel"
                  role="tabpanel"
                  aria-live="polite"
                  className="cine-card-bg relative isolate w-full flex-1 overflow-hidden rounded-[1.25rem] md:rounded-[1.5rem]"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeId}-${device}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: reduceMotion ? 0 : 0.25 }}
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
          </div>
        )}

      </div>
    </section>
  );
}

function MobileCommercialOffers({ plans, t }) {
  const visiblePlans = ["landing", "website", "system"]
    .map((id) => plans.find((plan) => plan.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-2.5">
      {visiblePlans.map((plan) => (
        <details key={plan.id} className="group cine-card-bg cine-border-c overflow-hidden rounded-2xl border">
          <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <MonoIcon name={plan.icon} className="h-9 w-9 rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold" style={{ color: INK }}>{plan.name}</span>
              <span className="cine-faint mt-0.5 block truncate text-[10px]">{plan.desc}</span>
            </span>
            <span className="material-symbols-outlined cine-faint text-[19px] transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="cine-border-c border-t px-4 pb-4 pt-3">
            <ul className="space-y-2">
              {plan.includes.map((item) => (
                <li key={item} className="flex gap-2 text-[11px] leading-snug" style={{ color: INK_DIM }}>
                  <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to={`/booking?plan=${plan.id}`}
              className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-white"
            >
              {t("servicesPage.common.getQuote")}
              <ArrowRight size={13} />
            </Link>
          </div>
        </details>
      ))}
      <RegionNote scope="service" />
    </div>
  );
}

function MobileMicroOffers({ jobs, t }) {
  return (
    <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {jobs.map((job) => (
        <article key={job.id} className="cine-card-bg cine-border-c flex w-[74vw] max-w-[17rem] shrink-0 snap-center flex-col rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <MonoIcon name={job.icon} className="h-9 w-9 rounded-xl" />
            <span className="cine-faint text-[9px] font-bold">{job.time}</span>
          </div>
          <h3 className="mt-3 text-sm font-extrabold" style={{ color: INK }}>{job.name}</h3>
          <p className="cine-muted mt-1.5 line-clamp-2 text-[10px] leading-relaxed">{job.desc}</p>
          <Link
            to={`/booking?type=micro&plan=${job.id}`}
            className="cine-border-c mt-3 flex min-h-11 items-center justify-between border-t pt-2 text-[10px] font-bold text-primary"
          >
            {t("servicesPage.micro.cta")}
            <ArrowRight size={12} className="-rotate-45" />
          </Link>
        </article>
      ))}
    </div>
  );
}

function MobileStudentOffers({ t }) {
  const items = t("servicesPage.student.customItems", { returnObjects: true });
  const icons = ["badge", "handyman", "code_blocks"];

  return (
    <div>
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <details key={item.title} className="group cine-card-bg cine-border-c overflow-hidden rounded-2xl border">
            <summary className="flex min-h-[4.25rem] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <MonoIcon name={icons[index]} className="h-9 w-9 rounded-xl" />
              <span className="min-w-0 flex-1 text-sm font-extrabold" style={{ color: INK }}>{item.title}</span>
              <span className="material-symbols-outlined cine-faint text-[19px] transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <p className="cine-border-c cine-muted border-t px-4 py-3 text-[11px] leading-relaxed">{item.desc}</p>
          </details>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/student-pricing" className="ios-secondary-button flex min-h-11 items-center justify-center px-3 text-center text-[10px]">
          {t("servicesPage.student.cta")}
        </Link>
        <Link to="/booking?type=student" className="ios-primary-button flex min-h-11 items-center justify-center px-3 text-center text-[10px]">
          {t("servicesPage.student.customCta")}
        </Link>
      </div>
    </div>
  );
}

function MobileServicePicker({ t, activeMode, onChoose, plans, microJobsList }) {
  const outcomes = t("servicesPage.outcomes.items", { returnObjects: true });
  const choices = [
    { mode: "commercial", icon: "storefront", label: t("servicesPage.tabs.commercial") },
    { mode: "micro", icon: "handyman", label: t("servicesPage.tabs.micro") },
    { mode: "student", icon: "school", label: t("servicesPage.tabs.student") },
  ];
  const activeIndex = Math.max(0, choices.findIndex((choice) => choice.mode === activeMode));
  const activeChoice = choices[activeIndex];
  const activeOutcome = outcomes[activeIndex];

  return (
    <section id="service-fit" className="relative px-4 pb-9 pt-8">
      <div className="mx-auto max-w-md">
        <p className="ios-kicker">{t("servicesPage.outcomes.eyebrow")}</p>
        <h2 className="mt-3 text-[1.75rem] font-extrabold leading-[1.05] tracking-[-0.035em]" style={{ color: INK }}>
          {t("servicesPage.hero.viewPricing")}
        </h2>

        <div className="services-mobile-switch sticky z-20 -mx-1 mt-5 grid grid-cols-3 gap-1 rounded-[1.15rem] border border-white/55 bg-background/80 p-1 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          {choices.map((choice) => {
            const selected = choice.mode === activeMode;
            return (
              <button
                key={choice.mode}
                type="button"
                aria-pressed={selected}
                onClick={() => onChoose(choice.mode)}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[0.9rem] px-1 text-[8px] font-extrabold leading-tight transition-colors ${
                  selected ? "bg-foreground text-background shadow-sm" : "cine-muted"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{choice.icon}</span>
                <span>{choice.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-primary/[0.08] p-4">
          <MonoIcon name={activeChoice.icon} className="h-9 w-9 rounded-xl" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-snug" style={{ color: INK }}>{activeOutcome.title}</p>
            <p className="cine-muted mt-1 line-clamp-2 text-[10px] leading-relaxed">{activeOutcome.desc}</p>
          </div>
        </div>

        <div id="pricing" className="scroll-mt-28 pt-5">
          {activeMode === "commercial" && <MobileCommercialOffers plans={plans} t={t} />}
          {activeMode === "micro" && <MobileMicroOffers jobs={microJobsList} t={t} />}
          {activeMode === "student" && <MobileStudentOffers t={t} />}
        </div>
      </div>
    </section>
  );
}

function MobileConfidenceSection({ t, workSteps }) {
  const faqs = t("servicesPage.faq.items", { returnObjects: true });
  const disclosures = [
    { id: "proof", icon: "verified", label: t("servicesPage.proof.eyebrow") },
    { id: "process", icon: "timeline", label: `${t("servicesPage.process.title")} ${t("servicesPage.process.highlight")}` },
    { id: "faq", icon: "help", label: `${t("servicesPage.faq.title")} ${t("servicesPage.faq.highlight")}` },
  ];

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-md space-y-2.5">
        {disclosures.map((item) => (
          <details key={item.id} className="group cine-card-bg cine-border-c overflow-hidden rounded-2xl border">
            <summary className="flex min-h-[3.75rem] cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
              <span className="material-symbols-outlined text-[19px] text-primary">{item.icon}</span>
              <span className="flex-1 text-sm font-extrabold" style={{ color: INK }}>{item.label}</span>
              <span className="material-symbols-outlined cine-faint text-[19px] transition-transform group-open:rotate-180">expand_more</span>
            </summary>

            {item.id === "proof" && (
              <div className="cine-border-c border-t px-4 pb-4 pt-3">
                <p className="text-base font-extrabold" style={{ color: INK }}>{t("servicesPage.proof.clientName")}</p>
                <p className="cine-muted mt-1 text-[11px] leading-relaxed">{t("servicesPage.proof.clientScope")}</p>
                <a href={PROOF_SITE} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  {t("servicesPage.proof.cta")}<ArrowRight size={12} className="-rotate-45" />
                </a>
              </div>
            )}

            {item.id === "process" && (
              <ol className="cine-border-c space-y-3 border-t px-4 py-4">
                {workSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-[11px] leading-relaxed" style={{ color: INK_DIM }}>
                    <span className="font-mono font-extrabold text-primary">0{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {item.id === "faq" && (
              <div className="cine-border-c space-y-1.5 border-t p-2">
                {faqs.map(({ q, a }) => (
                  <details key={q} className="rounded-xl bg-foreground/[0.035] px-3">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[11px] font-bold [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1" style={{ color: INK }}>{q}</span>
                      <span className="material-symbols-outlined cine-faint text-[16px]">add</span>
                    </summary>
                    <p className="cine-muted pb-3 text-[10px] leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}

function MobileFinalCta({ t }) {
  return (
    <section className="px-4 pb-10 pt-4">
      <div className="mx-auto max-w-md rounded-[1.75rem] bg-foreground px-5 py-7 text-background shadow-[0_18px_55px_rgba(15,23,42,0.18)]">
        <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.03em]">
          {t("servicesPage.finalCta.title1")} {t("servicesPage.finalCta.title2")}
        </h2>
        <Link to="/booking" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-white">
          {t("servicesPage.finalCta.cta")}<ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

function MobileServicesExperience({ t, activeMode, onChoose, plans, microJobsList, workSteps }) {
  return (
    <div className="services-mobile-layout pb-[max(0px,env(safe-area-inset-bottom,0px))]">
      <HeroSection t={t} mobileLayout />
      <MobileServicePicker
        t={t}
        activeMode={activeMode}
        onChoose={onChoose}
        plans={plans}
        microJobsList={microJobsList}
      />
      <DemoShowcaseSection compact />
      <MobileConfidenceSection t={t} workSteps={workSteps} />
      <MobileFinalCta t={t} />
    </div>
  );
}

function FaqSection() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = t("servicesPage.faq.items", { returnObjects: true });

  return (
    <section id="faq" className="scroll-mt-24 px-4 py-10 md:px-6 md:py-14">
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
              <button
                type="button"
                aria-expanded={openFaq === index}
                aria-controls={`service-faq-${index}`}
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <MonoIcon name="help" className="h-10 w-10" />
                <span className="flex-1 text-sm font-bold sm:text-base" style={{ color: INK }}>{q}</span>
                <span
                  className={`material-symbols-outlined cine-faint transition-transform duration-300 ${openFaq === index ? "rotate-180" : ""}`}
                >
                  keyboard_arrow_down
                </span>
              </button>
              <div id={`service-faq-${index}`} className={`grid transition-all duration-300 ${openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
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
  const isMobileLayout = useMobileServiceLayout();
  useCineScrollSnap(!isMobileLayout);
  useExchangeRate(); // Fetch tỷ giá VCB khi page load

  const [priceMode, setPriceMode] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get("type");
    if (type === "student") return "student";
    if (type === "micro") return "micro";
    return "commercial";
  });

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
        {isMobileLayout ? (
          <MobileServicesExperience
            t={t}
            activeMode={priceMode}
            onChoose={choosePriceMode}
            plans={plans}
            microJobsList={microJobsList}
            workSteps={workSteps}
          />
        ) : (
          <>
        {/* Thứ tự trang bán hàng: lời hứa → tin cậy → khách tự phân nhóm →
            bằng chứng sản phẩm chạy được → khách thật → cách làm việc → bảng
            giá → gỡ phản đối → chốt. Giá nằm sau bằng chứng để con số được đọc
            trong bối cảnh, còn khách vội vẫn tới thẳng bằng ba thẻ phân nhóm
            (mỗi thẻ cuộn thẳng xuống #pricing). */}
        <HeroSection t={t} />
        <TrustStrip t={t} />
        <ServiceChoiceSlide t={t} activeMode={priceMode} onChoose={choosePriceMode} />

        <DemoShowcaseSection />

        <section className="px-4 py-10 md:px-6 md:py-14">
          <ClientProof />
        </section>

        {/* ================= QUY TRÌNH — TĂNG NIỀM TIN TRƯỚC KHI BÁO GIÁ ================= */}
        <section className="px-4 py-10 md:px-6 md:py-14">
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

        {priceMode === "commercial" && (
          <section id="pricing" className="relative scroll-mt-24 space-y-10 px-4 py-10 md:px-6 md:py-14">
            <div id="build" className="absolute -top-24" />
            <div className="mx-auto max-w-6xl space-y-10">
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

                <RegionNote scope="service" />

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
                  className="ios-secondary-button group mt-1 inline-flex items-center gap-2"
                >
                  {t("servicesPage.tabs.micro")}
                  <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                </button>
              </AboutCard>
            </div>
          </section>
        )}

        {priceMode === "student" && <StudentCustomSupport />}

        {priceMode === "micro" && (
          <section id="pricing" className="relative scroll-mt-24 px-4 py-10 md:px-6 md:py-14">
            <div className="mx-auto max-w-6xl">
              <CineSectionHeading
                eyebrow={t("servicesPage.micro.eyebrow")}
                title={t("servicesPage.micro.title")}
                highlight={t("servicesPage.micro.highlight")}
                desc={t("servicesPage.micro.desc")}
              />

              <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      <p className="cine-faint text-[10px] font-bold uppercase tracking-wide">
                        {t("servicesPage.common.quoteAfterChat")}
                      </p>
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

              <AboutCard className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
                <span className="material-symbols-outlined text-4xl" style={{ color: ACCENT }}>support_agent</span>
                <h4 className="font-display text-lg font-bold" style={{ color: INK }}>{t("servicesPage.micro.customTitle")}</h4>
                <p className="cine-muted text-xs leading-relaxed sm:text-sm">{t("servicesPage.micro.customDesc")}</p>
                <CtaButton wrapClassName="mt-1 w-full max-w-xs">{t("servicesPage.micro.customCta")}</CtaButton>
              </AboutCard>
            </div>
          </section>
        )}

        <StudentPrioritySection items={studentItems} />

        <FaqSection />

        {/* ================= CTA CUỐI — TƯ VẤN MIỄN PHÍ, KHÔNG RÀO CẢN ================= */}
        <section className="px-4 pb-10 md:px-6 md:pb-14">
          <AboutCard className="mx-auto max-w-6xl space-y-8 px-6 py-10 text-center sm:px-10 sm:py-14 md:px-16">
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
          </>
        )}
      </div>
    </div>
  );
}
