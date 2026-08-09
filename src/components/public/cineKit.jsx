import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
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
    border: 1px solid color-mix(in srgb, hsl(var(--border)) 72%, transparent);
    border-radius: clamp(1.75rem, 4vw, 3rem);
    background:
      linear-gradient(145deg, color-mix(in srgb, hsl(var(--card)) 94%, transparent), color-mix(in srgb, hsl(var(--card)) 72%, transparent));
    box-shadow: 0 24px 80px hsl(var(--shadow) / 0.1), inset 0 1px 0 rgba(255,255,255,0.72);
  }
  .dark .ios-hero {
    box-shadow: 0 30px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08);
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
  .cine-marquee:hover { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) {
    .cine-root *, .cine-root *::before, .cine-root *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

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
