import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { API_BASE } from "../../config/apiBase";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Heart,
  Mail,
  MessageCircle,
  Users,
  Play,
  IdCard,
  Download,
  Gamepad2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ArcadeScene,
  JoyScene,
  StudentBioScene,
} from "../../components/public/IntroScenes";
import CodeHeroFilm from "../../components/public/CodeHeroFilm";
import CodeHorseFilm from "../../components/public/CodeHorseFilm";
import {
  ACCENT,
  AboutCard,
  AmbientAuraParticles,
  CINE_CSS,
  CoverColorShift,
  EASE,
  INK,
  INK_DIM,
  ScrollProgressBar,
  ScrollRevealParagraph,
  SwipeDownCue,
  useCineScrollSnap,
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

const EDUCATION_LOGOS = {
  highSchool: "https://eduoka.com/uploads/0000/1/2023/08/14/logo-cua-truong-thpt-nguyen-dinh-chieu-my-tho.png",
  university: "https://cdn.haitrieu.com/wp-content/uploads/2022/12/Icon-Truong-Dai-hoc-Greenwich-Viet-Nam.png",
};

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";
const LEARNED_TECH = [
  { name: "C#", icon: `${DEVICON}/csharp/csharp-original.svg` },
  { name: "Python", icon: `${DEVICON}/python/python-original.svg` },
  { name: "HTML", icon: `${DEVICON}/html5/html5-original.svg` },
  { name: "CSS", icon: `${DEVICON}/css3/css3-original.svg` },
  { name: "JavaScript", icon: `${DEVICON}/javascript/javascript-original.svg` },
  { name: "PHP", icon: `${DEVICON}/php/php-original.svg` },
  { name: "MySQL", icon: `${DEVICON}/mysql/mysql-original.svg` },
  { name: "React.js", icon: `${DEVICON}/react/react-original.svg` },
  { name: "Unity", icon: `${DEVICON}/unity/unity-original.svg` },
  { name: "Node.js", icon: `${DEVICON}/nodejs/nodejs-original.svg` },
  { name: "Tailwind", icon: `${DEVICON}/tailwindcss/tailwindcss-original.svg` },
  { name: "MongoDB", icon: `${DEVICON}/mongodb/mongodb-original.svg` },
];

/* ---------------------------------------------------------------------------
   SECTION 1 — HERO (mascot chuyển động dựng hoàn toàn bằng code)
   ------------------------------------------------------------------------- */

function HeroSection({ t }) {
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
    <section ref={sectionRef} className="ios-hero studio-cover studio-cover--intro">
      <motion.div className="studio-cover-film-shell" style={{ scale: reduceMotion ? 1 : filmScale }}>
        <CodeHeroFilm variant="code" />
      </motion.div>
      <CoverColorShift progress={scrollYProgress} variant="intro" />
      <div className="code-film-content studio-cover-grid grid items-center gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <motion.div
            className="studio-cover-copy max-w-3xl"
            style={{ opacity: reduceMotion ? 1 : copyOpacity, y: reduceMotion ? 0 : copyY }}
          >
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.65, ease: EASE }}
                className="mt-6 max-w-2xl"
              >
                <p className="text-sm leading-relaxed text-foreground/75 sm:text-base">
                  {t("intro.cine.heroDesc")}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a href="#cine-work" className="ios-primary-button inline-flex items-center gap-2">
                    {t("intro.cine.heroCta")}
                    <ArrowRight size={15} />
                  </a>
                  <a
                    href="/cv-le-gia-huy.pdf"
                    download
                    className="ios-secondary-button inline-flex items-center gap-2"
                  >
                    <Download size={15} />
                    {t("intro.cine.heroCvCta")}
                  </a>
                </div>
              </motion.div>
          </motion.div>
          <div className="code-film-stage-space" aria-hidden="true" />
      </div>
      <SwipeDownCue
        targetId="cine-work"
        touchLabel={t("intro.cine.heroSwipe")}
        desktopLabel={t("intro.cine.heroScroll")}
        style={{ opacity: reduceMotion ? 0.78 : undefined }}
      />
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
  ];
  return (
    <section className="px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-3">
      <div className="cine-card-bg mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-[1.75rem] border perspective-1000">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ 
              scale: 1.04, 
              y: -4, 
              rotate: i === 0 ? -1 : 1,
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
              zIndex: 10
            }}
            transition={{ 
              delay: i * 0.1, 
              duration: 0.6, 
              ease: EASE,
              hover: { type: "spring", stiffness: 300, damping: 15 }
            }}
            className={`relative space-y-1.5 px-5 py-6 sm:px-7 sm:py-8 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${i === 0 ? "border-r border-border/55" : ""}`}
          >
            <p className="text-2xl font-extrabold tracking-[-0.035em] text-foreground sm:text-3xl relative z-10">
              {s.v}
            </p>
            <p className="cine-faint text-[11px] sm:text-xs leading-snug relative z-10">{s.l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function WorkScenePreview({ Scene, Icon, badge, index }) {
  const ref = useRef(null);
  const isVisible = useInView(ref, { margin: "120px 0px", amount: 0.15 });

  return (
    <div
      ref={ref}
      className="relative mb-6 h-36 overflow-hidden rounded-[1.5rem] bg-muted/60"
      style={{ "--scene-play-state": isVisible ? "running" : "paused" }}
    >
      <Scene />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--card)/0.72),transparent_58%)]" />
      <span className="ios-glass absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-primary">
        <Icon size={17} />
      </span>
      <span className="ios-glass absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[9px] font-bold text-foreground">
        <span className="material-symbols-outlined text-[13px]">motion_photos_on</span>
        0{index + 1} · {badge}
      </span>
    </div>
  );
}

function SelectedWorkSection({ t }) {
  const work = t("intro.cine.work.items", { returnObjects: true });
  const icons = [IdCard, Sparkles, Gamepad2];
  const scenes = [StudentBioScene, JoyScene, ArcadeScene];
  const routes = ["/student-pricing", "/member/account", "/member/utilities/arcade"];

  return (
    <section id="cine-work" className="studio-content-slide studio-content-slide--intro px-4 py-16 md:px-6 md:py-24">
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
            const Scene = scenes[index];
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.6, 
                  ease: [0.22, 1, 0.36, 1], // easeOutQuint
                  hover: { type: "spring", stiffness: 400, damping: 17 }
                }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.03, 
                  rotate: index % 2 === 0 ? 1 : -1,
                  boxShadow: "0 20px 40px -15px rgba(0,122,255,0.15)",
                  zIndex: 10
                }}
                className="cine-card-bg cine-border-c cine-hover-border relative group flex min-h-[330px] flex-col overflow-hidden rounded-[2rem] border p-5 transition-colors sm:p-6"
              >
                <WorkScenePreview Scene={Scene} Icon={Icon} badge={item.badge} index={index} />
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

        {/* Học vấn — hai mốc ngắn gọn, không hiển thị niên khoá hay địa chỉ. */}
        <div className="mx-auto grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
          {["highSchool", "university"].map((item) => (
            <div key={item} className="cine-border-c flex min-h-28 items-center gap-4 rounded-xl border px-4 py-3.5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
                <img
                  src={EDUCATION_LOGOS[item]}
                  alt={t(`intro.cine.education.${item}.logoAlt`)}
                  width="64"
                  height="64"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={`education-logo h-full w-full object-contain ${item === "university" ? "animate-[spin_8s_linear_infinite]" : ""}`}
                />
              </span>
              <div className="min-w-0">
                <p className="cine-faint text-[9px] font-bold uppercase tracking-[0.18em]">
                  {t(`intro.cine.education.${item}.label`)}
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: INK }}>
                  {t(`intro.cine.education.${item}.name`)}
                </p>
                <p className="cine-muted mt-0.5 text-[11px]">
                  {t(`intro.cine.education.${item}.detail`)}
                </p>
                <p className="mt-1.5 text-[10px] font-semibold italic" style={{ color: ACCENT }}>
                  “{t(`intro.cine.education.${item}.slogan`)}”
                </p>
              </div>
            </div>
          ))}
        </div>

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

/* Dải công nghệ từng có trên Introduction: hai bản sao giống hệt nhau tạo
   vòng lặp liền mạch; bản thứ hai ẩn khỏi accessibility tree để không đọc lặp. */
function TechMarquee({ t }) {
  const track = (duplicate = false) => (
    <div
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14"
    >
      {LEARNED_TECH.map((technology) => (
        <span
          key={`${duplicate ? "copy" : "source"}-${technology.name}`}
          className="cine-muted inline-flex shrink-0 items-center gap-2.5 opacity-80 transition-opacity hover:opacity-100"
        >
          <img
            src={technology.icon}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
          />
          <span className="text-xs font-semibold sm:text-sm">{technology.name}</span>
        </span>
      ))}
    </div>
  );

  return (
    <section className="overflow-hidden py-10 md:py-14" aria-labelledby="intro-tech-marquee-title">
      <p id="intro-tech-marquee-title" className="cine-faint text-center text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
        {t("intro.cine.marqueeTitle")}
      </p>
      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-[linear-gradient(to_right,var(--cine-bg),transparent)] sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(to_left,var(--cine-bg),transparent)] sm:w-32" />
        <div className="cine-marquee flex w-max items-center">
          {track()}
          {track(true)}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 3 — CONTACT
   ------------------------------------------------------------------------- */

// Mở Gmail web soạn thư sẵn địa chỉ; nếu Gmail không mở được (popup chặn,
// máy không đăng nhập Gmail) thì fallback mailto → ứng dụng Mail mặc định.
const CONTACT_EMAIL = "contact@hugowishpax.studio";
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`;

function ContactSection({ t }) {
  const contacts = [
    { href: `${API_BASE}/contact/zalo`, Icon: MessageCircle, label: t("intro.slide9.zalo") },
    { href: GMAIL_COMPOSE, fallback: `mailto:${CONTACT_EMAIL}`, Icon: Mail, label: t("intro.slide9.email") },
    { href: "https://facebook.com/hugowishpax.le", Icon: Users, label: t("intro.slide9.fb") },
    { href: "https://www.tiktok.com/@pethugowishpaxle?_r=1&_t=ZS-96UW9Neg8UW", Icon: Play, label: t("intro.slide9.tiktok") },
  ];

  return (
    <section className="px-4 pb-14 md:px-6 md:pb-20">
      
      {/* SINGLE UNIFIED FINAL SLIDE */}
      <div className="mx-auto max-w-5xl space-y-10 pt-10 pb-8 relative z-10">
        
        {/* 1. HORSE */}
        <CodeHorseFilm />
        
        {/* 2. DONATE PROMPT */}
        <div className="mx-auto max-w-2xl text-center space-y-5">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-base font-medium sm:text-lg text-foreground/80 tracking-tight"
          >
            "{t("intro.cine.horsePrompt")}"
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
            className="flex justify-center"
          >
            <motion.button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,122,255,0.35)" }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 10px 25px rgba(0,122,255,0.2)",
                  "0 18px 35px rgba(175,82,222,0.35)",
                  "0 10px 25px rgba(0,122,255,0.2)",
                ],
              }}
              transition={{
                boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-white/90 animate-bounce" aria-hidden="true">
                volunteer_activism
              </span>
              <span>{t("intro.cine.donateBtn")}</span>
              <Heart className="w-4 h-4 text-white/90 fill-transparent transition-transform group-hover:scale-125 group-hover:fill-white/40" />
            </motion.button>
          </motion.div>
        </div>

        {/* 3. CONTACT SECTION (KẾT NỐI VỚI MÌNH) */}
        <div className="mx-auto max-w-4xl space-y-6 pt-10 text-center border-t border-black/5 dark:border-white/5">
          <div className="space-y-2.5 pt-4">
            <p className="ios-kicker">
              {t("intro.slide9.badge")}
            </p>
            <h2 className="text-2xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-3xl">
              <WordsPullUp text={t("intro.cine.contactTitle")} center wordClassName="cine-grad" />
            </h2>
            <p className="cine-muted mx-auto max-w-lg text-xs leading-relaxed">
              {t("intro.slide9.desc")}
            </p>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
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
                transition={{ 
                  delay: i * 0.08, 
                  duration: 0.5, 
                  ease: EASE,
                  hover: { type: "spring", stiffness: 400, damping: 10 }
                }}
                whileHover={{ y: -6, scale: 1.05, boxShadow: "0 10px 20px -10px rgba(0,0,0,0.15)" }}
                className="group cine-card2-bg cine-border-c cine-hover-border flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 transition-colors relative z-10"
              >
                <c.Icon size={17} className="cine-contact-ic" />
                <span className="text-xs font-medium" style={{ color: INK }}>{c.label}</span>
              </motion.a>
              );
            })}
          </div>
        </div>

      </div>

      <SupporterMarquee t={t} />
    </section>
  );
}

function SupporterMarquee({ t }) {
  const [supporters, setSupporters] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const loadSupporters = () => {
      fetch(`${API_BASE}/payos/supporters?limit=30`, { signal: controller.signal, cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("supporters_unavailable")))
        .then((payload) => setSupporters(Array.isArray(payload.data) ? payload.data : []))
        .catch((error) => {
          if (error.name !== "AbortError") setSupporters([]);
        });
    };
    loadSupporters();
    const refreshTimer = window.setInterval(loadSupporters, 30000);
    return () => {
      window.clearInterval(refreshTimer);
      controller.abort();
    };
  }, []);

  const minimumNames = 12;
  const loopNames = supporters.length
    ? Array.from(
        { length: Math.max(1, Math.ceil(minimumNames / supporters.length)) },
        () => supporters,
      ).flat()
    : [];

  return (
    <div className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-white/45 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="px-4 text-center text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{t("intro.slide9.supporters")}</p>
      {supporters.length ? (
        <div className="mt-2 overflow-hidden" aria-label={t("intro.slide9.supporters")}>
          <div className="animate-logo-marquee flex w-max items-center">
            {[...loopNames, ...loopNames].map((supporter, index) => (
              <span key={`${supporter.name}-${index}`} className="flex items-center gap-3 px-4 text-xs font-bold text-foreground">
                <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">favorite</span>
                {t("intro.slide9.supporterItem", { name: supporter.name })}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1 px-4 text-center text-xs text-muted-foreground">{t("intro.slide9.supportersEmpty")}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PAGE
   ------------------------------------------------------------------------- */

export default function IntroductionPage() {
  const { t } = useTranslation();
  useCineScrollSnap();

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
      <AmbientAuraParticles />
      <ScrollProgressBar />
      <HeroSection t={t} />
      <StatsStrip t={t} />
      <AboutSection t={t} jasonPhoto={jasonPhoto} />
      <TechMarquee t={t} />
      <SelectedWorkSection t={t} />
      <ContactSection t={t} />
    </div>
  );
}

