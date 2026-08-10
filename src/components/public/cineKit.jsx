import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ============================================================================
   CINE KIT — ngôn ngữ thị giác chung của các trang public "điện ảnh"
   (Introduction, Services). Trước đây bộ này nằm kẹt trong IntroductionPage
   nên trang Services phải tự dựng lại một vibe khác → hai trang lệch nhau.
   Màu lấy thẳng từ design tokens của app nên vẫn tự đổi theo light/dark.
   ========================================================================== */

export const EASE = [0.16, 1, 0.3, 1];

export const INK = "var(--cine-ink)";
export const INK_DIM = "var(--cine-dim)";
export const ACCENT = "var(--cine-accent)";

export const CINE_CSS = `
  .cine-root {
    --studio-cover-offset: calc(4rem + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px));
    --cine-bg: hsl(var(--background));
    --cine-card: color-mix(in srgb, hsl(var(--card)) 92%, transparent);
    --cine-card2: color-mix(in srgb, hsl(var(--muted)) 76%, transparent);
    --cine-ink: hsl(var(--foreground));
    --cine-dim: hsl(var(--foreground) / 0.74);
    --cine-muted: hsl(var(--muted-foreground));
    --cine-faint: hsl(var(--muted-foreground) / 0.82);
    --cine-border: color-mix(in srgb, hsl(var(--border)) 78%, transparent);
    --cine-accent: hsl(var(--primary));
    --cine-btn: hsl(var(--primary));
    --cine-btn-ink: #ffffff;
    background: var(--cine-bg);
    color: var(--cine-ink);
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-image:
      radial-gradient(circle at 12% 0%, hsl(var(--primary) / 0.07), transparent 30rem),
      radial-gradient(circle at 88% 18%, rgba(175, 82, 222, 0.055), transparent 28rem);
  }
  .cine-serif { font-family: 'Plus Jakarta Sans', sans-serif; font-style: normal; font-weight: 800; }
  .cine-grad {
    background-image: linear-gradient(100deg, #007aff 0%, #32ade6 46%, #af52de 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .cine-grad-bg {
    background-image: linear-gradient(100deg, #007aff 0%, #32ade6 46%, #af52de 100%);
  }
  .ios-hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    width: 100%;
    min-height: calc(100svh - var(--studio-cover-offset));
    min-height: calc(100dvh - var(--studio-cover-offset));
    border: 0;
    border-radius: 0;
    background:
      linear-gradient(145deg, color-mix(in srgb, hsl(var(--card)) 94%, transparent), color-mix(in srgb, hsl(var(--card)) 72%, transparent));
    box-shadow: none;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
  .dark .ios-hero {
    box-shadow: none;
  }
  .studio-cover-film-shell {
    position: absolute;
    inset: -2%;
    z-index: 0;
    transform-origin: center;
    will-change: transform;
  }
  .studio-cover-color-shift {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    mix-blend-mode: soft-light;
  }
  .studio-cover-color-shift--intro {
    background: linear-gradient(135deg, rgba(10,132,255,0.08), rgba(100,210,255,0.42) 46%, rgba(191,90,242,0.72));
  }
  .studio-cover-color-shift--service {
    background: linear-gradient(135deg, rgba(191,90,242,0.12), rgba(100,210,255,0.38) 52%, rgba(10,132,255,0.7));
  }
  .studio-cover-grid {
    width: 100%;
    max-width: 90rem;
    min-height: calc(100svh - var(--studio-cover-offset));
    min-height: calc(100dvh - var(--studio-cover-offset));
    margin-inline: auto;
    padding: clamp(2rem, 5vh, 4.5rem) clamp(1.5rem, 5vw, 5rem) max(5.75rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem));
  }
  .studio-cover-copy {
    position: relative;
    z-index: 4;
    will-change: transform, opacity;
  }
  .studio-swipe-cue {
    position: absolute;
    left: 50%;
    bottom: max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem));
    z-index: 6;
    display: inline-flex;
    min-width: 9rem;
    min-height: 3.25rem;
    transform: translateX(-50%);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    color: var(--cine-ink);
    font-size: 0.625rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 1px 14px hsl(var(--card));
    touch-action: manipulation;
  }
  .studio-swipe-cue__rail {
    position: relative;
    width: 1px;
    height: 1.15rem;
    overflow: hidden;
    background: hsl(var(--foreground) / 0.18);
  }
  .studio-swipe-cue__dot {
    position: absolute;
    top: -40%;
    left: 50%;
    width: 3px;
    height: 0.55rem;
    border-radius: 999px;
    background: hsl(var(--primary));
    transform: translateX(-50%);
    animation: studio-swipe-down 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  .studio-content-slide {
    position: relative;
    isolation: isolate;
    scroll-margin-top: 0;
    scroll-snap-align: start;
  }
  .studio-content-slide::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    z-index: -1;
    height: min(34rem, 62svh);
    pointer-events: none;
  }
  .studio-content-slide--intro::before {
    background: linear-gradient(180deg, hsl(var(--primary) / 0.13), rgba(100,210,255,0.065) 42%, transparent 100%);
  }
  .studio-content-slide--service::before {
    background: linear-gradient(180deg, rgba(175,82,222,0.14), hsl(var(--primary) / 0.06) 48%, transparent 100%);
  }
  @keyframes studio-swipe-down {
    0% { opacity: 0; transform: translate(-50%, -35%); }
    25% { opacity: 1; }
    72% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, 180%); }
  }
  html.standalone-pwa .cine-root,
  html.native-ios .cine-root {
    --studio-cover-offset: 0px;
  }
  html.standalone-pwa .studio-cover-grid,
  html.native-ios .studio-cover-grid {
    padding-top: max(2rem, calc(env(safe-area-inset-top, 0px) + 1.25rem));
    padding-right: max(1.5rem, calc(env(safe-area-inset-right, 0px) + 1rem));
    padding-left: max(1.5rem, calc(env(safe-area-inset-left, 0px) + 1rem));
  }
  #root.cine-snap-root {
    position: relative;
    scroll-snap-type: y proximity;
    scroll-padding-top: 4rem;
  }
  html.standalone-pwa #root.cine-snap-root,
  html.native-ios #root.cine-snap-root {
    scroll-padding-top: 0;
  }
  .ios-aurora {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(circle at 76% 24%, rgba(90, 200, 250, 0.3), transparent 24rem),
      radial-gradient(circle at 88% 78%, rgba(175, 82, 222, 0.2), transparent 25rem),
      radial-gradient(circle at 48% 112%, rgba(0, 122, 255, 0.14), transparent 30rem);
    filter: saturate(1.05);
  }
  .ios-glass {
    border: 1px solid rgba(255,255,255,0.5);
    background: color-mix(in srgb, hsl(var(--card)) 62%, transparent);
    box-shadow: 0 18px 50px hsl(var(--shadow) / 0.12), inset 0 1px 0 rgba(255,255,255,0.72);
    -webkit-backdrop-filter: blur(28px) saturate(170%);
    backdrop-filter: blur(28px) saturate(170%);
  }
  .dark .ios-glass {
    border-color: rgba(255,255,255,0.1);
    background: color-mix(in srgb, hsl(var(--card)) 70%, transparent);
    box-shadow: 0 22px 60px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .ios-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--cine-accent);
    font-size: 0.6875rem;
    font-weight: 750;
    letter-spacing: 0.08em;
  }
  .ios-primary-button,
  .ios-secondary-button {
    min-height: 2.875rem;
    border-radius: 9999px;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 700;
    transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
  }
  .ios-primary-button {
    color: #fff;
    background: hsl(var(--primary));
    box-shadow: 0 10px 26px hsl(var(--primary) / 0.22);
  }
  .ios-secondary-button {
    color: var(--cine-ink);
    border: 1px solid var(--cine-border);
    background: color-mix(in srgb, hsl(var(--card)) 72%, transparent);
    -webkit-backdrop-filter: blur(18px);
    backdrop-filter: blur(18px);
  }
  .ios-primary-button:hover,
  .ios-secondary-button:hover { transform: translateY(-1px); }
  .ios-primary-button:active,
  .ios-secondary-button:active { transform: scale(0.98); }
  .ios-icon-surface {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.9rem;
    color: var(--cine-accent);
    background: hsl(var(--primary) / 0.1);
  }
  .cine-card-bg {
    background: var(--cine-card);
    border-color: var(--cine-border);
    box-shadow: 0 12px 36px hsl(var(--shadow) / 0.065), inset 0 1px 0 rgba(255,255,255,0.55);
  }
  .dark .cine-card-bg { box-shadow: 0 18px 44px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.045); }
  .cine-card2-bg { background: var(--cine-card2); }
  .cine-muted { color: var(--cine-muted); }
  .cine-faint { color: var(--cine-faint); }
  .cine-accent-t { color: var(--cine-accent); }
  .cine-border-c { border-color: var(--cine-border); }
  .cine-hover-border:hover { border-color: color-mix(in srgb, var(--cine-accent) 28%, var(--cine-border)); }
  .cine-contact-ic { color: var(--cine-muted); transition: color 0.3s; }
  .group:hover .cine-contact-ic { color: var(--cine-accent); }
  .cine-noise-overlay, .cine-bg-noise { background: none; }
  @keyframes cine-marquee { to { transform: translateX(-50%); } }
  .cine-marquee { animation: cine-marquee 32s linear infinite; }
  .cine-marquee:hover, .cine-marquee:active { animation-play-state: paused; }
  @media (max-width: 767px), (max-width: 1023px) and (pointer: coarse) {
    .services-mobile-layout .studio-cover--service {
      scroll-snap-stop: normal;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-film-shell {
      inset: 0;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-grid {
      align-content: center;
      grid-template-rows: auto clamp(11.5rem, 27svh, 13.5rem);
      gap: 0.5rem;
      padding-top: max(1.25rem, calc(env(safe-area-inset-top, 0px) + 0.75rem));
      padding-right: max(1.125rem, env(safe-area-inset-right, 0px));
      padding-bottom: max(4rem, calc(env(safe-area-inset-bottom, 0px) + 3.5rem));
      padding-left: max(1.125rem, env(safe-area-inset-left, 0px));
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy {
      max-width: 21rem;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy .ios-kicker {
      display: none;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy h1 {
      font-size: clamp(1.95rem, 8.6vw, 2.2rem) !important;
      line-height: 1.01 !important;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy .mt-7 {
      margin-top: 1rem;
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy .ios-primary-button {
      min-height: 2.625rem;
      padding: 0.65rem 1rem;
      font-size: 0.78rem;
    }
    .services-mobile-layout .studio-cover--service .code-film-stage-space {
      min-height: clamp(11.5rem, 27svh, 13.5rem);
    }
    .services-mobile-switch {
      top: calc(4rem + env(safe-area-inset-top, 0px));
    }
    .services-mobile-layout #service-fit {
      scroll-margin-top: 4rem;
    }
    .services-mobile-layout #template-preview-panel .overscroll-contain {
      overscroll-behavior: auto;
      touch-action: pan-y;
    }
    html.standalone-pwa .services-mobile-switch,
    html.native-ios .services-mobile-switch {
      top: env(safe-area-inset-top, 0px);
    }
    html.standalone-pwa .services-mobile-layout #service-fit,
    html.native-ios .services-mobile-layout #service-fit {
      scroll-margin-top: 0;
    }
  }
  @media (max-height: 500px) and (pointer: coarse) {
    .services-mobile-layout .studio-cover--service .studio-cover-grid {
      grid-template-columns: minmax(0, 1.04fr) minmax(11rem, 0.96fr);
      grid-template-rows: 1fr;
      gap: 0.75rem;
      padding-top: max(0.75rem, env(safe-area-inset-top, 0px));
      padding-bottom: max(2.75rem, calc(env(safe-area-inset-bottom, 0px) + 2.25rem));
    }
    .services-mobile-layout .studio-cover--service .studio-cover-copy h1 {
      font-size: clamp(1.65rem, 7.8vh, 2rem) !important;
    }
    .services-mobile-layout .studio-cover--service .code-film-stage-space {
      min-height: 0;
      height: 100%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cine-root *, .cine-root *::before, .cine-root *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    .studio-swipe-cue__dot { animation: none; top: 35%; }
  }
  @media (max-width: 639px) and (max-height: 740px) {
    .studio-cover-grid {
      padding-top: 1.5rem;
      padding-bottom: max(4.75rem, calc(env(safe-area-inset-bottom, 0px) + 4rem));
    }
  }
  @media (max-height: 500px) and (pointer: coarse) {
    .studio-cover-grid {
      grid-template-columns: minmax(0, 1.06fr) minmax(13rem, 0.94fr);
      gap: 1rem;
      padding-top: 0.85rem;
      padding-bottom: max(3.5rem, calc(env(safe-area-inset-bottom, 0px) + 3rem));
    }
    .studio-cover-copy h1 {
      font-size: clamp(2rem, 9.5vh, 2.45rem) !important;
      line-height: 1.01 !important;
    }
    .studio-cover-copy .ios-kicker { margin-bottom: 0.65rem; }
    .studio-cover-copy .mt-7 { margin-top: 0.85rem; }
    .studio-cover-copy .ios-primary-button {
      min-height: 2.5rem;
      padding: 0.58rem 1rem;
      font-size: 0.75rem;
    }
    .studio-swipe-cue {
      bottom: max(0.25rem, env(safe-area-inset-bottom, 0px));
      min-height: 2.75rem;
    }
  }
`;

export function CoverColorShift({ progress, variant = "intro" }) {
  const layerRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return undefined;

    if (reduceMotion || !progress) {
      layer.style.opacity = "0.16";
      return undefined;
    }

    const updateOpacity = (value) => {
      const stop = 0.58;
      const middle = variant === "service" ? 0.18 : 0.16;
      const end = variant === "service" ? 0.46 : 0.42;
      const next = value <= stop
        ? (value / stop) * middle
        : middle + ((value - stop) / (1 - stop)) * (end - middle);
      layer.style.opacity = String(Math.max(0, Math.min(end, next)));
    };

    updateOpacity(progress.get());
    return progress.on("change", updateOpacity);
  }, [progress, reduceMotion, variant]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={`studio-cover-color-shift studio-cover-color-shift--${variant}`}
    />
  );
}

export function SwipeDownCue({ targetId, touchLabel, desktopLabel, style }) {
  const reduceMotion = useReducedMotion();
  const scrollToContent = () => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <motion.button
      type="button"
      aria-controls={targetId}
      onClick={scrollToContent}
      initial={{ opacity: 0, x: "-50%", y: -5 }}
      animate={{ opacity: 0.78, x: "-50%", y: 0 }}
      transition={{ delay: 1, duration: 0.55, ease: EASE }}
      className="studio-swipe-cue"
      style={style}
    >
      <span className="sm:hidden">{touchLabel}</span>
      <span className="hidden sm:inline">{desktopLabel}</span>
      <span className="studio-swipe-cue__rail" aria-hidden="true">
        <span className="studio-swipe-cue__dot" />
      </span>
    </motion.button>
  );
}

export function useCineScrollSnap(enabled = true) {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!enabled) {
      root?.classList.remove("cine-snap-root");
      return undefined;
    }
    root?.classList.add("cine-snap-root");
    return () => root?.classList.remove("cine-snap-root");
  }, [enabled]);
}

// Chữ trồi lên từng từ (pull-up), kích hoạt khi vào viewport.
export function WordsPullUp({ text, className = "", style, showAsterisk = false, center = false, wordClassName = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const words = String(text).split(" ");
  return (
    <span ref={ref} className={`inline-flex flex-wrap ${center ? "justify-center" : ""} ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.045, duration: 0.5, ease: EASE }}
          className={`relative inline-block will-change-transform ${wordClassName}`}
        >
          {w}
          {showAsterisk && i === words.length - 1 && (
            <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
          )}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

// Như WordsPullUp nhưng trộn nhiều đoạn {text, className} — 2 giọng chữ
export function WordsPullUpMultiStyle({ segments, className = "" }) {
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
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.045, duration: 0.5, ease: EASE }}
          className={`inline-block will-change-transform ${item.cls}`}
        >
          {item.w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

// Một lần fade nhẹ cho cả đoạn; đọc yên hơn hiệu ứng chạy từng ký tự.
export function ScrollRevealParagraph({ text, className = "", style }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE }}
      className={className}
      style={style}
    >
      {text}
    </motion.p>
  );
}

// Nút "nam châm" — hút nhẹ về phía con trỏ rồi bật lại bằng spring
export function Magnetic({ children, className = "", strength = 12 }) {
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
export function ScrollProgressBar() {
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
export function PillButton({ to, href, children, Icon = ArrowRight, className = "" }) {
  const cls = `ios-primary-button group inline-flex items-center justify-center gap-2 ${className}`;
  const style = undefined;
  const inner = (
    <>
      {children}
      <Icon size={15} className="transition-transform group-hover:translate-x-0.5" />
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
export function AboutCard({ children, className = "", id }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`cine-card-bg rounded-[1.75rem] border md:rounded-[2.25rem] ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* Tiêu đề mục kiểu Introduction: tiêu đề trái, mô tả dạt phải. Bố cục lệch này
   là thứ phá được nhịp "eyebrow + tiêu đề + mô tả, canh giữa" lặp lại. */
export function CineSectionHeading({ eyebrow, title, highlight, desc, align = "split" }) {
  if (align === "center") {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="ios-kicker">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl md:text-[2.75rem]" style={{ color: INK }}>
          <WordsPullUpMultiStyle
            segments={[{ text: title }, ...(highlight ? [{ text: highlight, className: "cine-serif cine-grad" }] : [])]}
          />
        </h2>
        {desc && <p className="cine-muted mx-auto mt-5 max-w-2xl text-sm leading-relaxed md:text-base">{desc}</p>}
      </div>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
      <div>
        <p className="ios-kicker">{eyebrow}</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-4xl md:text-[2.75rem]" style={{ color: INK }}>
          <WordsPullUp text={title} />
          {highlight && (
            <span className="block cine-serif cine-grad">
              <WordsPullUp text={highlight} />
            </span>
          )}
        </h2>
      </div>
      {desc && (
        <p className="cine-muted max-w-2xl text-sm leading-relaxed md:justify-self-end md:text-base">{desc}</p>
      )}
    </div>
  );
}
