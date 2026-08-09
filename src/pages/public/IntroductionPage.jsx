import { useRef } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Check,
  School,
  Sparkles,
  Heart,
  Mail,
  MessageCircle,
  Users,
  Play,
  IdCard,
  PenTool,
  Rocket,
  CalendarCheck,
  BriefcaseBusiness,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { StudioSpaceScene } from "../../components/public/IntroScenes";
import CodeHeroFilm from "../../components/public/CodeHeroFilm";
import {
  ACCENT,
  AboutCard,
  CINE_CSS,
  EASE,
  INK,
  INK_DIM,
  Magnetic,
  PillButton,
  ScrollProgressBar,
  ScrollRevealParagraph,
  WordsPullUp,
  WordsPullUpMultiStyle,
} from "../../components/public/cineKit";

/* ============================================================================
   HUGO STUDIO — INTRODUCTION (v4 "cinematic")
   Layout điện ảnh (hero dựng bằng CSS, chữ khổng lồ pull-up, reveal từng ký tự)
   nhưng màu & font đồng bộ 100% với design system của app. Bộ primitive
   (CINE_CSS, WordsPullUp, AboutCard, PillButton…) nằm ở components/public/
   cineKit.jsx để trang Services dùng chung đúng một ngôn ngữ thị giác.
   ========================================================================== */

const JASON_PHOTO =
  "https://res.cloudinary.com/dyehwoscu/image/upload/v1779259064/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-20_lu%CC%81c_13.37.35_kfmbw3.png";

/* ---------------------------------------------------------------------------
   SECTION 1 — HERO (mascot chuyển động dựng hoàn toàn bằng code)
   ------------------------------------------------------------------------- */

function HeroSection({ t }) {
  return (
    <section className="px-3 pb-4 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-6">
      <div className="ios-hero mx-auto max-w-7xl">
        <CodeHeroFilm variant="code" />
        <div className="code-film-content grid min-h-[min(760px,calc(100svh-88px))] items-center gap-6 px-6 py-14 sm:px-10 sm:py-16 md:px-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="ios-kicker mb-5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("intro.cine.heroEyebrow")}
              </motion.p>
              <h1
                className="text-[clamp(2.45rem,6vw,5.6rem)] font-extrabold leading-[1.04] tracking-[-0.04em]"
                style={{ color: INK, fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}
              >
                <WordsPullUp text={t("intro.cine.heroTitle1")} />
                <span className="block cine-grad">
                  <WordsPullUp text={t("intro.cine.heroTitle2")} />
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                className="mt-6 max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg"
                style={{ color: INK_DIM }}
              >
                {t("intro.cine.heroDesc")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link to="/student-benefits" className="ios-primary-button inline-flex items-center gap-2">
                  {t("intro.cine.heroCta")}
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/booking"
                  className="ios-secondary-button inline-flex items-center gap-2"
                >
                  <BriefcaseBusiness size={16} />
                  {t("intro.cine.heroSecondaryCta")}
                </Link>
              </motion.div>
          </div>
          <div className="code-film-stage-space" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   STATS STRIP — vài con số thật, điểm nhấn nhanh
   ------------------------------------------------------------------------- */

function StatsStrip({ t }) {
  const stats = [
    { v: t("intro.cine.stat1v"), l: t("intro.cine.stat1l") },
    { v: t("intro.cine.stat2v"), l: t("intro.cine.stat2l") },
    { v: t("intro.cine.stat3v"), l: t("intro.cine.stat3l") },
    { v: t("intro.cine.stat4v"), l: t("intro.cine.stat4l") },
  ];
  return (
    <section className="px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
      <div className="cine-card-bg mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-[1.75rem] border lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }}
            className={`space-y-1.5 px-5 py-6 sm:px-7 sm:py-8 ${i % 2 === 0 ? "border-r border-border/55" : ""} ${i < 2 ? "border-b border-border/55 lg:border-b-0" : ""} ${i > 0 ? "lg:border-l lg:border-border/55" : ""}`}
          >
            <p className="text-2xl font-extrabold tracking-[-0.035em] text-foreground sm:text-3xl">
              {s.v}
            </p>
            <p className="cine-faint text-[11px] sm:text-xs leading-snug">{s.l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SelectedWorkSection({ t }) {
  const work = t("intro.cine.work.items", { returnObjects: true });
  const icons = [IdCard, Sparkles, Rocket];
  const routes = ["/student-benefits", "/member/joy", "/member/utilities/arcade"];

  return (
    <section id="cine-work" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <p className="ios-kicker">
              {t("intro.cine.work.eyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl md:text-[2.75rem]" style={{ color: INK }}>
              {t("intro.cine.work.title")}
            </h2>
          </div>
          <p className="cine-muted max-w-2xl text-sm leading-relaxed md:justify-self-end md:text-base">
            {t("intro.cine.work.desc")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {work.map((item, index) => {
            const Icon = icons[index];
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.1, duration: 0.55, ease: EASE }}
                whileHover={{ y: -3 }}
                className="cine-card-bg cine-border-c cine-hover-border group flex min-h-[330px] flex-col overflow-hidden rounded-[2rem] border p-5 transition-colors sm:p-6"
              >
                <div className="relative mb-6 flex h-36 items-center justify-center overflow-hidden rounded-[1.5rem] bg-muted/60">
                  <div className="absolute h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
                  <span className="ios-icon-surface relative h-16 w-16 rounded-[1.35rem] shadow-[0_14px_36px_hsl(var(--primary)/0.16)]">
                    <Icon size={27} />
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-card/80 px-3 py-1.5 font-mono text-[9px] font-bold text-muted-foreground backdrop-blur">
                    0{index + 1} · {item.badge}
                  </span>
                </div>
                <p className="cine-accent-t text-[9px] font-bold uppercase tracking-[0.2em]">{item.kind}</p>
                <h3 className="mt-2 font-display text-xl font-extrabold" style={{ color: INK }}>{item.title}</h3>
                <p className="cine-muted mt-3 text-xs leading-relaxed sm:text-sm">{item.desc}</p>
                <p className="cine-border-c cine-faint mt-5 border-t pt-4 text-[11px] leading-relaxed">{item.outcome}</p>
                <Link
                  to={routes[index]}
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold"
                  style={{ color: ACCENT }}
                >
                  {item.cta}
                  <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 2 — ABOUT (danh tính, đối tác, triết lý)
   ------------------------------------------------------------------------- */

function AboutSection({ t, jasonPhoto }) {
  return (
    <section id="cine-about" className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      {/* Danh tính — heading 2 giọng chữ + đoạn văn hiện dần theo scroll */}
      <AboutCard className="max-w-6xl mx-auto text-center px-6 sm:px-10 md:px-16 py-16 sm:py-20 md:py-24 space-y-8 sm:space-y-10">
        <p className="ios-kicker">
          {t("intro.cine.aboutLabel")}
        </p>

        <h2
          className="mx-auto max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl md:text-5xl"
          style={{ color: INK }}
        >
          <WordsPullUpMultiStyle
            segments={[
              { text: t("intro.cine.aboutH1"), className: "font-normal" },
              { text: t("intro.cine.aboutH2"), className: "cine-serif cine-grad" },
              { text: t("intro.cine.aboutH3"), className: "font-normal" },
            ]}
          />
        </h2>

        <ScrollRevealParagraph
          text={t("intro.partners.desc")}
          className="text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          style={{ color: INK }}
        />

        {/* Đối tác đồng hành */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <span className="cine-faint text-[10px] sm:text-xs uppercase tracking-[0.2em]">
            {t("intro.cine.partnerLabel")}
          </span>
          <span className="cine-border-c inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border">
            <img
              src={jasonPhoto}
              alt="Jason Phan"
              loading="lazy"
              className="w-7 h-7 rounded-full object-cover object-top"
            />
            <span className="text-left leading-tight">
              <span className="block text-xs font-bold" style={{ color: INK }}>Jason Phan</span>
              <span className="cine-faint block text-[9px] uppercase tracking-wider">
                {t("intro.partners.partnerRole")}
              </span>
            </span>
          </span>
        </motion.div>
      </AboutCard>

      {/* Cách tôi tạo trải nghiệm cho người dùng */}
      <AboutCard className="max-w-6xl mx-auto px-6 sm:px-10 md:px-16 py-12 sm:py-16 md:py-20 text-center space-y-8">
        <p className="ios-kicker">
          {t("intro.cine.howTitle")}
        </p>
        <blockquote
          className="mx-auto max-w-3xl text-xl font-extrabold leading-snug tracking-[-0.025em] sm:text-2xl md:text-3xl lg:text-4xl"
        >
          <WordsPullUp text={t("intro.slide8.quote")} center wordClassName="cine-grad" />
        </blockquote>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto text-left">
          {[
            { title: t("intro.slide8.wowTitle"), desc: t("intro.slide8.wowDesc"), Icon: Sparkles },
            { title: t("intro.slide8.sweetTitle"), desc: t("intro.slide8.sweetDesc"), Icon: Heart },
          ].map((b) => (
            <motion.div
              key={b.title}
              whileHover={{ y: -4 }}
              className="cine-border-c cine-hover-border p-5 sm:p-6 rounded-xl border transition-colors space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <b.Icon size={16} style={{ color: ACCENT }} />
                <span className="text-sm sm:text-base font-bold" style={{ color: INK }}>{b.title}</span>
              </div>
              <p className="cine-muted text-xs sm:text-sm leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8 text-left">
          {["p1", "p2", "p3"].map((k, i) => (
            <div key={k} className="flex items-center gap-2.5">
              <span className="font-mono cine-faint text-sm font-bold">0{i + 1}</span>
              <span className="text-xs sm:text-sm" style={{ color: INK_DIM }}>{t(`intro.slide8.${k}`)}</span>
            </div>
          ))}
        </div>
      </AboutCard>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 3 — FEATURES
   ------------------------------------------------------------------------- */

function FeatureCard({ i, className = "", children }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`overflow-hidden rounded-[1.75rem] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ChecklistCard({ i, num, Icon, title, checks, to, t }) {
  return (
    <FeatureCard
      i={i}
      className="cine-card-bg cine-hover-border flex flex-col border p-5 transition-colors sm:p-6"
    >
      <div className="ios-icon-surface h-10 w-10 sm:h-12 sm:w-12">
        <Icon size={20} style={{ color: ACCENT }} />
      </div>
      <h3 className="font-display pt-4 sm:pt-5 text-base sm:text-lg font-bold" style={{ color: INK }}>
        {title} <span className="cine-faint font-normal text-sm">({num})</span>
      </h3>
      <ul className="pt-4 space-y-2.5 flex-1">
        {checks.map((c) => (
          <li key={c} className="flex items-start gap-2 text-left">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <span className="cine-muted text-xs sm:text-sm leading-snug">{c}</span>
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className="group inline-flex items-center gap-1.5 pt-5 text-xs sm:text-sm font-medium"
        style={{ color: INK }}
      >
        {t("intro.cine.learnMore")}
        <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
      </Link>
    </FeatureCard>
  );
}

function FeaturesSection({ t }) {
  return (
    <section id="cine-features" className="relative px-4 md:px-6 py-16 md:py-24">
      <div className="absolute inset-0 cine-bg-noise opacity-[0.15] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto space-y-12 md:space-y-16">
        <h2 className="mx-auto max-w-3xl text-center text-2xl font-extrabold leading-snug tracking-[-0.025em] sm:text-3xl md:text-4xl" style={{ color: INK }}>
          <WordsPullUpMultiStyle
            segments={[
              { text: t("intro.cine.featT1"), className: "" },
              { text: t("intro.cine.featT2"), className: "cine-faint" },
            ]}
          />
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard i={0} className="cine-card-bg relative min-h-[320px] border">
            <StudioSpaceScene />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--card))_3%,hsl(var(--card)/0.84)_26%,transparent_64%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <span className="ios-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                CODE MOTION
              </span>
              <p className="mt-3 text-lg font-extrabold leading-snug tracking-[-0.025em]" style={{ color: INK }}>
                {t("intro.cine.cardVideo")}
              </p>
            </div>
          </FeatureCard>

          <ChecklistCard
            i={1}
            num="01"
            Icon={IdCard}
            title={t("intro.cine.card2Title")}
            checks={[
              t("intro.cine.card2c1"),
              t("intro.cine.card2c2"),
              t("intro.cine.card2c3"),
              t("intro.cine.card2c4"),
            ]}
            to="/login"
            t={t}
          />

          <ChecklistCard
            i={2}
            num="02"
            Icon={PenTool}
            title={t("intro.cine.card3Title")}
            checks={[t("intro.cine.card3c1"), t("intro.cine.card3c2"), t("intro.cine.card3c3")]}
            to="/services"
            t={t}
          />

          <ChecklistCard
            i={3}
            num="03"
            Icon={School}
            title={t("intro.cine.card4Title")}
            checks={[t("intro.cine.card4c1"), t("intro.cine.card4c2"), t("intro.cine.card4c3")]}
            to="/public-tools/banhocduong"
            t={t}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 4 — CONTACT + CTA cuối trang
   ------------------------------------------------------------------------- */

// Mở Gmail web soạn thư sẵn địa chỉ; nếu Gmail không mở được (popup chặn,
// máy không đăng nhập Gmail) thì fallback mailto → ứng dụng Mail mặc định.
const CONTACT_EMAIL = "contact@hugowishpax.studio";
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`;

function ContactSection({ t, profile }) {
  const contacts = [
    { href: `https://zalo.me/${profile?.zaloNumber || ""}`, Icon: MessageCircle, label: t("intro.slide9.zalo") },
    { href: GMAIL_COMPOSE, fallback: `mailto:${CONTACT_EMAIL}`, Icon: Mail, label: t("intro.slide9.email") },
    { href: "https://facebook.com/hugowishpax.le", Icon: Users, label: t("intro.slide9.fb") },
    { href: "https://www.tiktok.com/@pethugowishpaxle?_r=1&_t=ZS-96UW9Neg8UW", Icon: Play, label: t("intro.slide9.tiktok") },
  ];

  return (
    <section className="px-4 md:px-6 pb-16 md:pb-24">
      <AboutCard className="max-w-6xl mx-auto px-6 sm:px-10 md:px-16 py-16 sm:py-20 text-center space-y-10">
        <div className="space-y-4">
          <p className="ios-kicker">
            {t("intro.slide9.badge")}
          </p>
          <h2 className="text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl md:text-5xl">
            <WordsPullUp text={t("intro.cine.contactTitle")} center wordClassName="cine-grad" />
          </h2>
          <p className="cine-muted text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {t("intro.slide9.desc")}
          </p>
        </div>

        {/* Contact tiles — trên thiết bị cảm ứng, email dùng mailto để mở app Mail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
          {contacts.map((c, i) => {
            const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
            const href = c.fallback && isTouch ? c.fallback : c.href;
            return (
            <motion.a
              key={c.label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
              whileHover={{ y: -2 }}
              className="group cine-card2-bg cine-border-c cine-hover-border flex flex-col items-center gap-2.5 rounded-[1.25rem] border p-5 transition-colors sm:p-6"
            >
              <c.Icon size={20} className="cine-contact-ic" />
              <span className="text-xs sm:text-sm font-medium" style={{ color: INK }}>{c.label}</span>
            </motion.a>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-2">
          <Magnetic>
            <PillButton to="/login" Icon={Rocket}>
              {t("intro.slide10.registerBtn")}
            </PillButton>
          </Magnetic>
          <Magnetic>
            <Link
              to="/booking"
              className="ios-secondary-button inline-flex items-center gap-2"
            >
              <CalendarCheck size={15} />
              {t("intro.slide10.bookBtn")}
            </Link>
          </Magnetic>
        </div>
      </AboutCard>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   PAGE
   ------------------------------------------------------------------------- */

export default function IntroductionPage() {
  const { data } = useData();
  const { t } = useTranslation();

  useHeadMeta({
    title: t("intro.cine.meta.title"),
    description: t("intro.cine.meta.description"),
    keywords: t("intro.cine.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/introduction",
  });

  const jasonPhoto = optimizeCloudinaryUrl(JASON_PHOTO, 200);

  return (
    <div className="cine-root relative min-h-screen">
      <style>{CINE_CSS}</style>
      <ScrollProgressBar />
      <HeroSection t={t} />
      <StatsStrip t={t} />
      <SelectedWorkSection t={t} />
      <FeaturesSection t={t} />
      <AboutSection t={t} jasonPhoto={jasonPhoto} />
      <ContactSection t={t} profile={data?.profile} />
    </div>
  );
}
