import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  GraduationCap,
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
  Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SkyCodeScene,
  StudioSpaceScene,
  StudentBioScene,
  JoyScene,
  ArcadeScene,
} from "../../components/public/IntroScenes";
import StudioPageNav from "../../components/public/StudioPageNav";

/* ============================================================================
   HUGO STUDIO — INTRODUCTION (v4 "cinematic")
   Layout điện ảnh (hero dựng bằng CSS, chữ khổng lồ pull-up, reveal từng ký tự)
   nhưng màu & font đồng bộ 100% với design system của app:
   - Màu: hsl tokens (background/card/foreground/primary/accent/warning)
     → light/dark tự động theo theme chung.
   - Font: Plus Jakarta Sans (body) + Quicksand (display) + gradient text
     primary→accent→warning như các trang khác.
   Trang cuộn theo #root của app — hiệu ứng scroll đo bằng
   getBoundingClientRect/scroll capture nên không phụ thuộc container.
   ========================================================================== */

const EASE = [0.16, 1, 0.3, 1];

// Màu qua CSS variables (map từ tokens của app) — xem PAGE_CSS
const INK = "var(--cine-ink)";
const INK_DIM = "var(--cine-dim)";
const ACCENT = "var(--cine-accent)";

const JASON_PHOTO =
  "https://res.cloudinary.com/dyehwoscu/image/upload/v1779259064/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-20_lu%CC%81c_13.37.35_kfmbw3.png";

// Logo trường thật (favicon chính chủ, fallback qua Google s2)
const NDC_LOGO = "https://ndc.edu.vn/wp-content/themes/thptndc/assets/img/common/favicon.ico";
const NDC_LOGO_FALLBACK = "https://www.google.com/s2/favicons?domain=ndc.edu.vn&sz=64";
const GW_LOGO = "https://greenwich.edu.vn/wp-content/uploads/2022/10/Favicon-Greenwich-1.png";
const GW_LOGO_FALLBACK = "https://www.google.com/s2/favicons?domain=greenwich.edu.vn&sz=64";

// Logo ngôn ngữ/công nghệ chuẩn (devicon CDN)
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";
const CORE_TECH_STACK = [
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
const GREENWICH_STACK = CORE_TECH_STACK;

const PAGE_CSS = `
  /* Màu lấy thẳng từ design tokens của app (index.css) — tự đổi theo light/dark,
     đồng bộ tuyệt đối với các trang khác. */
  .cine-root {
    --cine-bg: hsl(var(--background));
    --cine-card: hsl(var(--card));
    --cine-card2: hsl(var(--muted) / 0.55);
    --cine-ink: hsl(var(--foreground));
    --cine-dim: hsl(var(--foreground) / 0.78);
    --cine-muted: hsl(var(--muted-foreground));
    --cine-faint: hsl(var(--muted-foreground) / 0.75);
    --cine-border: hsl(var(--border));
    --cine-accent: hsl(var(--primary));
    --cine-btn: hsl(var(--primary));
    --cine-btn-ink: #ffffff;
    background: var(--cine-bg);
    color: var(--cine-ink);
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .cine-serif { font-family: 'Quicksand', sans-serif; font-style: italic; font-weight: 700; }
  .cine-grad {
    background-image: linear-gradient(90deg, #2678ff 0%, #0797ff 28%, #7359e8 55%, #d45aa3 78%, #f0445e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .cine-card-bg { background: var(--cine-card); }
  .cine-card2-bg { background: var(--cine-card2); }
  .cine-muted { color: var(--cine-muted); }
  .cine-faint { color: var(--cine-faint); }
  .cine-accent-t { color: var(--cine-accent); }
  .cine-border-c { border-color: var(--cine-border); }
  .cine-hover-border:hover { border-color: color-mix(in srgb, var(--cine-accent) 45%, transparent); }
  .cine-contact-ic { color: var(--cine-muted); transition: color 0.3s; }
  .group:hover .cine-contact-ic { color: var(--cine-accent); }
  .cine-noise-overlay {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .cine-bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  @keyframes cine-marquee { to { transform: translateX(-50%); } }
  .cine-marquee { animation: cine-marquee 32s linear infinite; }
  .cine-marquee:hover { animation-play-state: paused; }

`;

/* ---------------------------------------------------------------------------
   Animation helpers
   ------------------------------------------------------------------------- */

// Chữ trồi lên từng từ (pull-up), kích hoạt khi vào viewport.
function WordsPullUp({ text, className = "", style, showAsterisk = false, center = false, wordClassName = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const words = String(text).split(" ");
  return (
    <span ref={ref} className={`inline-flex flex-wrap ${center ? "justify-center" : ""} ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
          className={`relative inline-block will-change-transform ${wordClassName}`}
        >
          {w}
          {showAsterisk && i === words.length - 1 && (
            <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
          )}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

// Như WordsPullUp nhưng trộn nhiều đoạn {text, className} — 2 giọng chữ
function WordsPullUpMultiStyle({ segments, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const words = segments.flatMap((seg) =>
    String(seg.text)
      .split(" ")
      .map((w) => ({ w, cls: seg.className || "" }))
  );
  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {words.map((item, i) => (
        <motion.span
          key={`${item.w}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
          className={`inline-block will-change-transform ${item.cls}`}
        >
          {item.w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

// Tiến độ 0→1 khi phần tử đi qua dải viewport [80% → 20%].
// Đo bằng getBoundingClientRect nên chạy đúng dù app cuộn bằng #root
// (html/body của app này overflow:hidden — useScroll theo window sẽ đứng im).
function useElementProgress(ref) {
  const progress = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.8;
      const end = vh * 0.2 - r.height;
      const p = (r.top - start) / (end - start);
      progress.set(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, progress]);
  return progress;
}

function AnimatedLetter({ ch, progress, range }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }}>{ch}</motion.span>;
}

// Đoạn văn hiện dần từng ký tự khi cuộn qua (progressive reveal)
function ScrollRevealParagraph({ text, className = "", style }) {
  const ref = useRef(null);
  const progress = useElementProgress(ref);
  const chars = [...String(text)];
  return (
    <p ref={ref} className={className} style={style}>
      {chars.map((ch, i) => {
        const p = i / chars.length;
        return <AnimatedLetter key={i} ch={ch} progress={progress} range={[p - 0.1, p + 0.05]} />;
      })}
    </p>
  );
}

// Nút "nam châm" — hút nhẹ về phía con trỏ rồi bật lại bằng spring
function Magnetic({ children, className = "", strength = 12 }) {
  const x = useSpring(0, { stiffness: 220, damping: 14 });
  const y = useSpring(0, { stiffness: 220, damping: 14 });
  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength);
  };
  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div
      style={{ x, y }}
      whileTap={{ scale: 0.95 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Thanh tiến độ cuộn trên đỉnh trang (app cuộn bằng #root)
function ScrollProgressBar() {
  const progress = useMotionValue(0);
  const scaleX = useSpring(progress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      progress.set(max > 0 ? root.scrollTop / max : 0);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [progress]);
  return (
    <motion.div
      style={{ scaleX, backgroundColor: ACCENT }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
    />
  );
}

// Nút pill chính: nền đảo theo theme, vòng tròn icon bên phải
function PillButton({ to, href, children, Icon = ArrowRight }) {
  const cls =
    "group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-5 pr-1.5 py-1.5 font-medium text-sm sm:text-base transition-all";
  const style = { backgroundColor: "var(--cine-btn)", color: "var(--cine-btn-ink)" };
  const inner = (
    <>
      {children}
      <span
        className="rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: "var(--cine-btn-ink)" }}
      >
        <Icon size={16} style={{ color: "var(--cine-btn)" }} />
      </span>
    </>
  );
  return href ? (
    <a href={href} className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <Link to={to} className={cls} style={style}>
      {inner}
    </Link>
  );
}

// Khối thẻ, entrance fade nhẹ — dùng xuyên suốt
function AboutCard({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`cine-card-bg rounded-2xl md:rounded-[2rem] ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 1 — HERO (luôn tối: nội dung nằm trên video)
   ------------------------------------------------------------------------- */

function HeroSection({ t }) {
  return (
    <section className="min-h-[calc(100svh-56px)] p-3 sm:p-4 md:p-6">
      <div className="relative min-h-[calc(100svh-80px)] w-full overflow-hidden rounded-[1.5rem] cine-card-bg md:min-h-[calc(100svh-104px)] md:rounded-[2rem]">
        <div
          className="absolute inset-0"
          style={{ filter: "saturate(1.16) contrast(1.04)" }}
        >
          <SkyCodeScene />
        </div>
        <div className="absolute inset-0 cine-noise-overlay opacity-[0.05] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(90deg, color-mix(in srgb, var(--cine-bg) 76%, transparent) 0%, color-mix(in srgb, var(--cine-bg) 58%, transparent) 30%, color-mix(in srgb, var(--cine-bg) 24%, transparent) 52%, transparent 70%), linear-gradient(to top, color-mix(in srgb, var(--cine-bg) 38%, transparent), transparent 46%)",
          }}
        />

        <StudioPageNav
          active="portfolio"
          portfolioLabel={t("intro.cine.navPortfolio")}
          servicesLabel={t("intro.cine.navServices")}
          className="absolute inset-x-3 top-3 sm:inset-x-5 sm:top-5"
        />

        <div className="relative z-10 flex min-h-[calc(100svh-80px)] items-end px-5 pb-7 pt-28 sm:px-8 sm:pb-10 md:min-h-[calc(100svh-104px)] md:px-12 md:pb-12 lg:px-16">
          <div className="w-full max-w-6xl">
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="cine-border-c mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] backdrop-blur"
                style={{ color: ACCENT }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
                {t("intro.cine.heroEyebrow")}
              </motion.p>
              <h1
                className="font-display text-[clamp(2.8rem,8vw,7.6rem)] font-extrabold leading-[0.92] tracking-[-0.055em]"
                style={{ color: INK }}
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
                className="mt-5 max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg"
                style={{ color: INK_DIM }}
              >
                {t("intro.cine.heroDesc")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Magnetic className="inline-block">
                  <a
                    href="#cine-about"
                    className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-5 pr-1.5 py-1.5 font-bold text-sm sm:text-base text-white bg-primary shadow-lg shadow-primary/25 transition-all"
                  >
                    {t("intro.cine.heroCta")}
                    <span className="bg-white rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <ArrowRight size={16} className="text-primary" />
                    </span>
                  </a>
                </Magnetic>
                <Link
                  to="/services"
                  className="cine-border-c inline-flex items-center gap-2 rounded-full border bg-background/65 px-5 py-3 text-sm font-bold backdrop-blur transition-colors hover:bg-background"
                  style={{ color: INK }}
                >
                  <BriefcaseBusiness size={16} />
                  {t("intro.cine.heroSecondaryCta")}
                </Link>
                {/* Nhà tuyển dụng đọc xong phần giới thiệu là cần ngay 2 thứ này.
                    Trước đây GitHub chỉ nằm ở footer nên gần như không ai thấy. */}
                <a
                  href="/cv-le-gia-huy.pdf"
                  download
                  className="cine-border-c inline-flex items-center gap-2 rounded-full border bg-background/65 px-5 py-3 text-sm font-bold backdrop-blur transition-colors hover:bg-background"
                  style={{ color: INK }}
                >
                  <Download size={16} />
                  {t("intro.cine.heroCvCta")}
                </a>
                <a
                  href="https://github.com/Hugo-huy2004"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="cine-border-c inline-flex items-center gap-2 rounded-full border bg-background/65 px-5 py-3 text-sm font-bold backdrop-blur transition-colors hover:bg-background"
                  style={{ color: INK }}
                >
                  {/* lucide v1 đã bỏ icon thương hiệu — dùng SVG inline, đơn sắc
                      theo currentColor, không phải thêm thư viện icon nào. */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
                  GitHub
                </a>
              </motion.div>
            </div>
          </div>
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
    <section className="px-4 md:px-6 pb-4 md:pb-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }}
            whileHover={{ y: -4 }}
            className="cine-card-bg cine-hover-border rounded-2xl px-5 py-6 sm:px-6 sm:py-7 space-y-1.5 border border-transparent transition-colors"
          >
            <p className="font-display font-extrabold cine-grad text-2xl sm:text-3xl md:text-4xl">
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
  const scenes = [StudentBioScene, JoyScene, ArcadeScene];

  return (
    <section id="cine-work" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <p className="cine-accent-t text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">
              {t("intro.cine.work.eyebrow")}
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl" style={{ color: INK }}>
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
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.1, duration: 0.55, ease: EASE }}
                className="cine-card-bg cine-border-c cine-hover-border group flex min-h-[350px] flex-col overflow-hidden rounded-[1.75rem] border p-5 transition-colors sm:p-6"
              >
                <div className="relative mb-6 h-40 overflow-hidden rounded-2xl">
                  <Scene />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-lg">
                      <Icon size={22} style={{ color: ACCENT }} />
                    </span>
                    <span className="rounded-full border border-white/30 bg-background/70 px-3 py-1.5 font-mono text-[10px] font-extrabold text-foreground backdrop-blur">
                      0{index + 1} · {item.badge}
                    </span>
                  </div>
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
   SECTION — MEET HUGO (mascot personality strip: the studio's charm, built
   from the founder's own chibi sticker set in /image/avt*.png)
   ------------------------------------------------------------------------- */

function MascotSection({ t }) {
  const mascots = [
    { img: "/image/avt1.png", w: t("intro.mascots.m1w"), d: t("intro.mascots.m1d") },
    { img: "/image/avt5.png", w: t("intro.mascots.m2w"), d: t("intro.mascots.m2d") },
    { img: "/image/avt7.png", w: t("intro.mascots.m3w"), d: t("intro.mascots.m3d") },
    { img: "/image/avt2.png", w: t("intro.mascots.m4w"), d: t("intro.mascots.m4d") },
    { img: "/image/avt3.png", w: t("intro.mascots.m5w"), d: t("intro.mascots.m5d") },
    { img: "/image/avt6.png", w: t("intro.mascots.m6w"), d: t("intro.mascots.m6d") },
    { img: "/image/avt4.png", w: t("intro.mascots.m7w"), d: t("intro.mascots.m7d") },
  ];
  return (
    <section className="relative px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10 md:mb-14">
          <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">{t("intro.mascots.eyebrow")}</p>
          <h2 className="font-display font-bold text-xl sm:text-2xl md:text-4xl leading-snug" style={{ color: INK }}>
            {t("intro.mascots.title1")}<span className="cine-faint">{t("intro.mascots.title2")}</span>
          </h2>
          <p className="cine-muted text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">{t("intro.mascots.desc")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {mascots.map((m, i) => (
            <motion.div
              key={m.img}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 4) * 0.08, duration: 0.55, ease: EASE }}
              whileHover={{ y: -6, rotate: i % 2 ? 2.5 : -2.5 }}
              className={`cine-card-bg cine-border-c cine-hover-border rounded-3xl border p-4 sm:p-5 flex flex-col items-center text-center gap-2 transition-colors ${i === 6 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <img src={m.img} alt={m.w} loading="lazy" draggable="false" className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md select-none" />
              <p className="font-display font-extrabold text-sm sm:text-base" style={{ color: INK }}>{m.w}</p>
              <p className="cine-faint text-[11px] sm:text-xs leading-snug">{m.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   SECTION 2 — ABOUT (danh tính, học vấn, ưu nhược, đối tác, triết lý)
   ------------------------------------------------------------------------- */

function EduRow({ href, logo, logoFallback, name, sub, desc }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group cine-border-c cine-hover-border flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-colors text-left"
    >
      <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm">
        <img
          src={logo}
          alt={`${name} logo`}
          loading="lazy"
          className="w-full h-full object-contain"
          onError={(e) => {
            if (logoFallback && e.target.src !== logoFallback) e.target.src = logoFallback;
          }}
        />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-sm sm:text-base font-bold" style={{ color: INK }}>
          {name}
        </span>
        {sub ? <span className="cine-faint block text-[11px] sm:text-xs">{sub}</span> : null}
        <span className="cine-muted block text-xs sm:text-sm leading-relaxed">{desc}</span>
      </span>
      <ArrowRight size={14} className="cine-contact-ic mt-1 shrink-0 -rotate-45 transition-transform group-hover:rotate-0" />
    </a>
  );
}

function AboutSection({ t, jasonPhoto }) {
  return (
    <section id="cine-about" className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
      {/* Danh tính — heading 2 giọng chữ + đoạn văn hiện dần theo scroll */}
      <AboutCard className="max-w-6xl mx-auto text-center px-6 sm:px-10 md:px-16 py-16 sm:py-20 md:py-24 space-y-8 sm:space-y-10">
        <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">
          {t("intro.cine.aboutLabel")}
        </p>

        <h2
          className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-3xl mx-auto leading-[1.05]"
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

      {/* Học vấn + stack | Ưu & nhược điểm */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <AboutCard className="p-6 sm:p-8 md:p-10 space-y-5">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={16} style={{ color: ACCENT }} />
            <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">
              {t("intro.slide3.eduTitle")}
            </p>
          </div>
          <div className="space-y-3">
            <EduRow
              href="https://ndc.edu.vn"
              logo={NDC_LOGO}
              logoFallback={NDC_LOGO_FALLBACK}
              name={t("intro.slide3.hsFull")}
              sub={t("intro.slide3.hsAddress")}
              desc={t("intro.slide3.hsSub")}
            />
            <EduRow
              href="https://greenwich.edu.vn"
              logo={GW_LOGO}
              logoFallback={GW_LOGO_FALLBACK}
              name={t("intro.slide3.uniTitle")}
              sub={t("intro.partners.finalYear")}
              desc={t("intro.slide3.uniSub")}
            />
          </div>
          <div className="space-y-2.5 pt-1">
            <p className="cine-faint text-[10px] sm:text-xs uppercase tracking-[0.25em]">
              {t("intro.cine.stackTitle")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CORE_TECH_STACK.map((s) => (
                <motion.span
                  key={s.name}
                  whileHover={{ y: -3 }}
                  className="cine-border-c cine-hover-border cine-muted inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] sm:text-xs transition-colors select-none"
                >
                  <img src={s.icon} alt={s.name} loading="lazy" className="w-3.5 h-3.5 object-contain" />
                  {s.name}
                </motion.span>
              ))}
            </div>
          </div>
        </AboutCard>

        <AboutCard className="p-6 sm:p-8 md:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} style={{ color: ACCENT }} />
              <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">
                {t("intro.cine.strengthTitle")}
              </p>
            </div>
            <ul className="space-y-2.5">
              {["v1", "v2", "v3"].map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <Check size={14} className="mt-1 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-xs sm:text-sm leading-relaxed">
                    <strong className="font-bold" style={{ color: INK }}>{t(`intro.slide3.${k}t`)}</strong>
                    <span className="cine-muted"> — {t(`intro.slide3.${k}d`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="cine-border-c space-y-3 pt-1 border-t">
            <p className="cine-faint text-[10px] sm:text-xs uppercase tracking-[0.25em] pt-4">
              {t("intro.cine.weakTitle")}
            </p>
            <ul className="space-y-2.5">
              {["weak1", "weak2", "weak3"].map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <ArrowRight size={13} className="cine-faint mt-1 shrink-0" />
                  <span className="cine-muted text-xs sm:text-sm leading-relaxed">{t(`intro.cine.${k}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </AboutCard>
      </div>

      {/* Cách tôi tạo trải nghiệm cho người dùng */}
      <AboutCard className="max-w-6xl mx-auto px-6 sm:px-10 md:px-16 py-12 sm:py-16 md:py-20 text-center space-y-8">
        <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">
          {t("intro.cine.howTitle")}
        </p>
        <blockquote
          className="italic font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl max-w-3xl mx-auto leading-snug"
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
   MARQUEE — dải logo công nghệ chạy ngang vô tận (hover để dừng)
   ------------------------------------------------------------------------- */

function TechMarquee({ t }) {
  const row = [...GREENWICH_STACK, ...GREENWICH_STACK];
  const fade = (dir) => ({
    background: `linear-gradient(to ${dir}, var(--cine-bg), transparent)`,
  });
  return (
    <section className="py-10 md:py-14 space-y-5 overflow-hidden">
      <p className="cine-faint text-center text-[10px] sm:text-xs uppercase tracking-[0.25em]">
        {t("intro.cine.marqueeTitle")}
      </p>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-16 sm:w-32 z-10 pointer-events-none" style={fade("right")} />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-32 z-10 pointer-events-none" style={fade("left")} />
        <div className="cine-marquee flex w-max items-center gap-10 sm:gap-14 px-5">
          {row.map((s, i) => (
            <span
              key={`${s.name}-${i}`}
              className="cine-muted inline-flex items-center gap-2.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity"
            >
              <img src={s.icon} alt={s.name} loading="lazy" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
              <span className="text-xs sm:text-sm">{s.name}</span>
            </span>
          ))}
        </div>
      </div>
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
      whileHover={{ y: -6 }}
      className={`rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ChecklistCard({ i, num, Icon, title, checks, to, t }) {
  return (
    <FeatureCard
      i={i}
      className="cine-card2-bg cine-hover-border p-5 sm:p-6 flex flex-col border border-transparent transition-colors"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--cine-bg)" }}>
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
        <h2 className="font-display font-bold text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl max-w-3xl mx-auto leading-snug" style={{ color: INK }}>
          <WordsPullUpMultiStyle
            segments={[
              { text: t("intro.cine.featT1"), className: "" },
              { text: t("intro.cine.featT2"), className: "cine-faint" },
            ]}
          />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 lg:h-[480px]">
          {/* Card 1 — scene dựng bằng code, theo light/dark */}
          <FeatureCard i={0} className="relative min-h-[280px] lg:min-h-0 cine-card-bg">
            <StudioSpaceScene />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to top, color-mix(in srgb, var(--cine-bg) 90%, transparent), transparent 55%)",
              }}
            />
            <p className="absolute bottom-5 left-5 right-5 text-base sm:text-lg font-medium" style={{ color: INK }}>
              {t("intro.cine.cardVideo")}
            </p>
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
          <p className="cine-accent-t text-[10px] sm:text-xs uppercase tracking-[0.25em]">
            {t("intro.slide9.badge")}
          </p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
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
              whileHover={{ y: -5 }}
              className="group cine-border-c cine-hover-border flex flex-col items-center gap-2.5 p-5 sm:p-6 rounded-xl border transition-colors"
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
            <PillButton href="/login" Icon={Rocket}>
              {t("intro.slide10.registerBtn")}
            </PillButton>
          </Magnetic>
          <Magnetic>
            <Link
              to="/booking"
              className="cine-border-c cine-hover-border inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-sm border transition-colors"
              style={{ color: INK }}
            >
              <CalendarCheck size={15} />
              {t("intro.slide10.bookBtn")}
            </Link>
          </Magnetic>
          <Magnetic>
            <Link
              to="/services"
              className="cine-muted group inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {t("intro.slide6.pricingBtn")}
              <ArrowRight size={14} className="-rotate-45 transition-transform group-hover:rotate-0" />
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
      <style>{PAGE_CSS}</style>
      <ScrollProgressBar />
      <HeroSection t={t} />
      <StatsStrip t={t} />
      <AboutSection t={t} jasonPhoto={jasonPhoto} />
      <MascotSection t={t} />
      <TechMarquee t={t} />
      <SelectedWorkSection t={t} />
      <FeaturesSection t={t} />
      <ContactSection t={t} profile={data?.profile} />
    </div>
  );
}
