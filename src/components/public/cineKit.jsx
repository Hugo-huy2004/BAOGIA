import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  .cine-grad-bg {
    background-image: linear-gradient(90deg, #2678ff 0%, #0797ff 28%, #7359e8 55%, #d45aa3 78%, #f0445e 100%);
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
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
          className={`inline-block will-change-transform ${item.cls}`}
        >
          {item.w}
          {i < words.length - 1 ? " " : ""}
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
export function ScrollRevealParagraph({ text, className = "", style }) {
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
  const cls = `group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-5 pr-1.5 py-1.5 font-medium text-sm sm:text-base transition-all ${className}`;
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
export function AboutCard({ children, className = "", id }) {
  return (
    <motion.div
      id={id}
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

/* Tiêu đề mục kiểu Introduction: tiêu đề trái, mô tả dạt phải. Bố cục lệch này
   là thứ phá được nhịp "eyebrow + tiêu đề + mô tả, canh giữa" lặp lại. */
export function CineSectionHeading({ eyebrow, title, highlight, desc, align = "split" }) {
  if (align === "center") {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="cine-accent-t text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">{eyebrow}</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl" style={{ color: INK }}>
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
        <p className="cine-accent-t text-[10px] font-bold uppercase tracking-[0.25em] sm:text-xs">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl md:text-5xl" style={{ color: INK }}>
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
