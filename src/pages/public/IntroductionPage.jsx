import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import Lenis from "lenis";
import { useTranslation, Trans } from "react-i18next";

/* ============================================================================
   HUGO STUDIO — INTRODUCTION (Apple-style scroll-driven cinematic page, v2)
   Mỗi scene là một đoạn scroll dài (240–320vh) chứa một "sân khấu" sticky.
   Animation 3D (CSS perspective + framer-motion) scrub theo tiến độ cuộn,
   cộng thêm lớp tương tác con trỏ: parallax, tilt, magnetic, spotlight.
   Lenis lo phần inertia scroll để mọi thứ trôi như video.
   ========================================================================== */

// Chiều cao stage = viewport trừ header 56px (đồng bộ layout cũ)
const STAGE_H = "h-[calc(100vh-56px)]";

const DUST = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 53) % 100}%`,
  top: `${(i * 31) % 100}%`,
  size: 2 + (i % 3),
  duration: 6 + (i % 5) * 2,
  delay: (i % 7) * 0.8,
}));

// Film-grain texture (inline SVG turbulence — zero network cost)
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// Starry universe background component
function StarryUniverse({ activeIndex, reduced }) {
  const stars = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: `${(i * 17) % 100}%`,
      top: `${(i * 23) % 100}%`,
      size: 1 + (i % 2),
      duration: 3 + (i % 5) * 1.5,
      delay: (i % 7) * 0.7,
    }))
  ).current;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#04050f]">
      {/* Dynamic Nebulae */}
      <div className="absolute inset-0 transition-opacity duration-1000">
        <div
          className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full blur-[150px] opacity-[0.35] transition-all duration-1000 ease-in-out"
          style={{
            background: activeIndex === 0
              ? "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)"
              : activeIndex === 1
              ? "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)"
              : activeIndex === 2
              ? "radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)"
              : activeIndex === 3
              ? "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)"
              : activeIndex === 4
              ? "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)"
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-20%] w-[75vw] h-[75vw] rounded-full blur-[170px] opacity-[0.35] transition-all duration-1000 ease-in-out"
          style={{
            background: activeIndex === 0
              ? "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)"
              : activeIndex === 1
              ? "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)"
              : activeIndex === 2
              ? "radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)"
              : activeIndex === 3
              ? "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)"
              : activeIndex === 4
              ? "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)"
          }}
        />
      </div>

      {/* Stars Grid */}
      {!reduced && (
        <div className="absolute inset-0 opacity-70">
          {stars.map((s) => (
            <motion.span
              key={s.id}
              animate={{ opacity: [0.15, 0.85, 0.15] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
              style={{
                position: "absolute",
                left: s.left,
                top: s.top,
                width: `${s.size}px`,
                height: `${s.size}px`,
              }}
              className="rounded-full bg-white shadow-[0_0_4px_white]"
            />
          ))}
        </div>
      )}

      {/* Cosmic Shooting Stars */}
      {!reduced && (
        <div className="absolute inset-0">
          <div className="shooting-star" style={{ top: "15%", left: "45%", animationDelay: "1s" }} />
          <div className="shooting-star" style={{ top: "45%", left: "80%", animationDelay: "5.5s" }} />
          <div className="shooting-star" style={{ top: "30%", left: "15%", animationDelay: "11s" }} />
        </div>
      )}
    </div>
  );
}

const JASON_PHOTO =
  "https://res.cloudinary.com/dyehwoscu/image/upload/v1779259064/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-20_lu%CC%81c_13.37.35_kfmbw3.png";

// Bộ sticker chibi (public/image) — dàn nhân vật hoạt hình của trang
const STICKER_CODING = "/image/avt5.png"; // gõ laptop
const STICKER_HELLO = "/image/avt1.png"; // vẫy tay Hello!
const STICKER_WOW = "/image/avt3.png"; // ngạc nhiên Wow!
const STICKER_NICE = "/image/avt2.png"; // giơ ngón cái Nice!
const STICKER_SUPPORT = "/image/avt7.png"; // hỗ trợ tai nghe
const STICKER_GO = "/image/avt6.png"; // xe du lịch Let's go
const STICKER_YUMMY = "/image/avt4.png"; // ăn burger Yummy!

// Nhân vật chibi lơ lửng — dùng chung cho mọi scene
function Chibi({ src, className = "", delay = 0, drift = 8, tilt = 4 }) {
  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      animate={{ y: [-drift, drift, -drift], rotate: [-tilt, tilt, -tilt] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay }}
      whileHover={{ scale: 1.15, rotate: 0 }}
      className={`drop-shadow-xl pointer-events-auto select-none ${className}`}
    />
  );
}

/* ---------------------------------------------------------------------------
   Shared helpers
   ------------------------------------------------------------------------- */

// Scroll progress (0 → 1) của một scene bên trong scroll-container của trang
function useSceneScroll(container) {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    container,
    target: targetRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  });
  return { targetRef, p: scrollYProgress };
}

// Con trỏ toàn cục chuẩn hoá về [-1, 1] — cho parallax "camera" kiểu Apple
function useMouseParallax(enabled = true) {
  const x = useSpring(0, { stiffness: 50, damping: 16 });
  const y = useSpring(0, { stiffness: 50, damping: 16 });
  useEffect(() => {
    if (!enabled || !window.matchMedia("(pointer: fine)").matches) return;
    const fn = (e) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 2);
      y.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, [enabled, x, y]);
  return { x, y };
}

// Tilt 3D theo con trỏ trên chính phần tử (Apple-card hover)
function useTilt(max = 10) {
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  };
  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
  };
  return { rx, ry, handlers: { onPointerMove, onPointerLeave } };
}

// Nút "nam châm" — hút nhẹ về phía con trỏ rồi bật lại bằng spring
function Magnetic({ children, className = "", strength = 14 }) {
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
      whileTap={{ scale: 0.93 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Rung nhẹ (haptic) trên thiết bị hỗ trợ — phản hồi xúc giác.
// Chrome chặn vibrate trước cú chạm đầu tiên, nên chỉ rung sau khi đã có gesture.
let hasUserGesture = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => { hasUserGesture = true; }, { once: true, passive: true });
}
function buzz(ms = 6) {
  if (!hasUserGesture) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}

// Tiêu đề hiện từng chữ kiểu keynote: mờ + blur → sắc nét bay lên
function RevealWords({ text, className = "", delay = 0 }) {
  const words = String(text).split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: delay + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block will-change-transform"
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

// Vỏ scene: wrapper cao `height`, bên trong là sân khấu sticky full-viewport
function SceneShell({ bind, targetRef, height, children, className = "" }) {
  return (
    <div
      ref={(el) => {
        targetRef.current = el;
        bind?.(el);
      }}
      style={{ height }}
      className="relative"
    >
      <div
        className={`sticky top-0 ${STAGE_H} overflow-hidden flex items-center justify-center ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-primary/10 text-primary border border-primary/25 ${className}`}
    >
      {children}
    </span>
  );
}

// Icon đơn sắc theo chuẩn trang public (Material Symbols, bg-muted)
function MonoIcon({ name, size = "text-2xl", box = "w-12 h-12" }) {
  return (
    <div className={`${box} rounded-2xl bg-muted text-foreground flex items-center justify-center shrink-0`}>
      <span className={`material-symbols-outlined ${size}`}>{name}</span>
    </div>
  );
}

// Vệt sáng quét qua khi hover (dùng lại keyframe `shine` trong index.css)
function Shine() {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shine" />
  );
}

/* ---------------------------------------------------------------------------
   FLOATING HOLOGRAM SYSTEM (Single morphing container linked across scenes)
   ------------------------------------------------------------------------- */

// 4 góc khung hologram (corner brackets)
function HoloBrackets() {
  const b = "absolute w-4 h-4 border-cyan-500/50 pointer-events-none";
  return (
    <>
      <span className={`${b} top-2 left-2 border-t-2 border-l-2 rounded-tl-md`} />
      <span className={`${b} top-2 right-2 border-t-2 border-r-2 rounded-tr-md`} />
      <span className={`${b} bottom-2 left-2 border-b-2 border-l-2 rounded-bl-md`} />
      <span className={`${b} bottom-2 right-2 border-b-2 border-r-2 rounded-br-md`} />
    </>
  );
}

function AboutPortraitPhoto({ realPhoto, fullName, t }) {
  return (
    <div
      className="relative w-[210px] sm:w-[270px] lg:w-[320px] rounded-[2rem] bg-[#060713]/70 backdrop-blur-2xl border border-cyan-500/30 p-3 sm:p-4 shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden"
      style={{ transformStyle: "preserve-3d" }}
    >
      <HoloBrackets />
      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-muted relative shadow-inner" style={{ transform: "translateZ(30px)" }}>
        <img loading="lazy" src={realPhoto} alt={fullName} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-primary/15 to-transparent animate-scan pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-warning/10 via-transparent to-primary/10 mix-blend-overlay pointer-events-none" />
      </div>
      <div className="pt-3 pb-1 text-center space-y-1" style={{ transform: "translateZ(45px)" }}>
        <span className="font-display text-xs sm:text-sm font-black text-foreground">{fullName}</span>
        <p className="text-[8px] sm:text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em]">
          {t("intro.partners.finalYear")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 pt-1" style={{ transform: "translateZ(35px)" }}>
        {[
          { icon: "cake", text: "2004" },
          { icon: "school", text: "Greenwich VN" },
        ].map((r) => (
          <div key={r.icon} className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl bg-cyan-950/30 border border-cyan-500/10">
            <span className="material-symbols-outlined text-[10px] text-cyan-400">{r.icon}</span>
            <span className="text-[7px] sm:text-[8px] font-mono font-bold text-cyan-300">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BioStudentCard({ t, scrollProgress }) {
  const cardRotY = useTransform(scrollProgress, [0.44, 0.58], [0, 180]);
  const cardFace =
    "absolute inset-0 rounded-[1.75rem] bg-gradient-to-b from-[#0a0f2c]/95 to-[#050713]/85 backdrop-blur-2xl border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden [backface-visibility:hidden]";

  return (
    <motion.div
      style={{ rotateY: cardRotY, transformStyle: "preserve-3d" }}
      className="relative w-[280px] sm:w-[320px] h-[200px] sm:h-[230px] will-change-transform"
    >
      {/* FRONT — thẻ sinh viên */}
      <div className={cardFace}>
        <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent -skew-x-12 pointer-events-none" />
        <div className="flex justify-between items-start border-b border-cyan-500/10 pb-3">
          <div>
            <span className="text-[7px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
              {t("intro.slide5.idTitle")}
            </span>
            <span className="font-display text-xs sm:text-sm font-black text-foreground">{t("intro.slide5.idName")}</span>
          </div>
          <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 shadow border border-yellow-600/30 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-3 gap-0.5 w-[80%] h-[80%] opacity-40">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="border border-yellow-800/40" />
              ))}
            </div>
          </div>
        </div>
        <div className="py-3 space-y-2 text-[10px] sm:text-xs">
          <div className="flex justify-between">
            <span className="text-[8px] text-cyan-400/60 uppercase font-bold">{t("intro.slide5.idEmailTitle")}</span>
            <span className="font-mono font-bold text-cyan-300 text-[10px] sm:text-[11px]">name@school.edu.vn</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[8px] text-cyan-400/60 uppercase font-bold">{t("intro.slide5.idBenefitTitle")}</span>
            <span className="font-bold text-cyan-300 text-[10px] sm:text-[11px]">{t("intro.slide5.idBenefitDesc")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[8px] text-cyan-400/60 uppercase font-bold">{t("intro.slide5.idValidityTitle")}</span>
            <span className="font-bold text-cyan-400/80 text-[10px] sm:text-[11px]">{t("intro.slide5.idValidityDesc")}</span>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-cyan-500/10 pt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[7px] font-mono font-bold text-cyan-400/60">{t("intro.slide5.idAuth")}</span>
          </div>
          <span className="text-[7px] font-mono text-cyan-400/60">ID: 2004-EDU-VALID</span>
        </div>
      </div>

      {/* BACK — quyền lợi */}
      <div className={cardFace} style={{ transform: "rotateY(180deg)" }}>
        <span className="text-[7px] font-mono font-bold text-cyan-400 uppercase tracking-widest block pb-1.5 border-b border-cyan-500/10">
          {t("intro.slide5.idBenefitTitle")}
        </span>
        <div className="pt-3 space-y-2">
          {["check1", "check2", "check3"].map((k) => (
            <div key={k} className="flex items-start gap-2 text-left">
              <span className="material-symbols-outlined text-xs text-cyan-400 bg-cyan-950/40 rounded-full p-1 border border-cyan-500/10">
                verified_user
              </span>
              <span className="text-[9px] sm:text-[10px] text-cyan-300/80 leading-snug">
                {t(`intro.slide5.${k}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-5 right-5 flex justify-between items-center border-t border-cyan-500/10 pt-2">
          <span className="text-[7px] font-mono text-cyan-400/60">HUGO·STUDIO·EDU</span>
          <span className="material-symbols-outlined text-xs text-cyan-400">workspace_premium</span>
        </div>
      </div>
    </motion.div>
  );
}

function DiscoveriesCore() {
  return (
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary via-accent to-warning p-[2px] shadow-[0_0_35px_rgba(99,102,241,0.4)] flex items-center justify-center pointer-events-auto">
      <div className="w-full h-full rounded-full bg-[#050713] flex items-center justify-center">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="material-symbols-outlined text-xl sm:text-2xl text-cyan-400 font-black block"
        >
          token
        </motion.span>
      </div>
    </div>
  );
}

function HologramMaster({ activeIndex, realPhoto, fullName, t, scrollProgress, isMobile, reduced }) {
  const mouse = useMouseParallax(!reduced);
  
  // Parallax rotation values (spring dampened)
  const rx = useTransform(mouse.y, (v) => v * -7);
  const ry = useTransform(mouse.x, (v) => v * 9);

  // Layout positions
  const targetX = isMobile 
    ? "0vw" 
    : activeIndex === 0 ? "20vw" 
    : activeIndex === 1 ? "22vw" 
    : activeIndex === 2 ? "-20vw" 
    : activeIndex === 3 ? "22vw" 
    : activeIndex === 4 ? "20vw" : "0px";
    
  const targetY = isMobile
    ? (activeIndex === 0 ? "18vh" : activeIndex === 1 ? "20vh" : activeIndex === 2 ? "12vh" : activeIndex === 3 ? "20vh" : "12vh")
    : "0px";

  const targetScale = isMobile
    ? (activeIndex === 4 ? 0.75 : 0.65)
    : (activeIndex === 4 ? 0.75 : 0.95);

  // Set low opacity on mobile to avoid blocking layout texts
  const opacity = activeIndex <= 4 ? (isMobile ? 0.28 : 1) : 0;

  const renderCardContent = () => {
    switch (activeIndex) {
      case 0:
        return <StudioHologram />;
      case 1:
        return <FounderHologram t={t} />;
      case 2:
        return <AboutPortraitPhoto realPhoto={realPhoto} fullName={fullName} t={t} />;
      case 3:
        return <BioStudentCard t={t} scrollProgress={scrollProgress} />;
      case 4:
        return <DiscoveriesCore />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        perspective: 1200,
        y: "-50%",
      }}
      animate={{
        x: `calc(-50% + ${targetX})`,
        y: `calc(-50% + ${targetY})`,
        scale: targetScale,
        opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 85,
        damping: 18,
        mass: 1.05,
      }}
      className="z-30 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(5px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {renderCardContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 0 — HUGO STUDIO HERO (hologram website 3D đang được "xây" + spotlight)
   ------------------------------------------------------------------------- */

// Bỏ chip icon — không cần, làm chồng đè

// Skeleton lines — website tự "gõ" ra từng dòng rồi lặp lại
const HERO_LINES = [
  { w: "82%", delay: 0 },
  { w: "64%", delay: 0.35 },
  { w: "73%", delay: 0.7 },
];

// Hologram browser: cửa sổ web kính 3D, các lớp nổi bằng translateZ
// Hologram browser: cửa sổ web kính 3D, các lớp nổi bằng translateZ
function StudioHologram() {
  return (
    <div
      className="relative w-[270px] sm:w-[330px] lg:w-[390px] rounded-3xl border border-cyan-500/30 dark:border-cyan-500/20 bg-[#060713]/75 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.25),inset_0_0_20px_rgba(6,182,212,0.1)] overflow-visible"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Cyber Grid Pattern Backdrop */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }}
      />

      {/* Glow behind */}
      <div className="absolute inset-4 rounded-3xl bg-cyan-500/20 blur-3xl" style={{ transform: "translateZ(-55px)" }} />
      <div className="absolute inset-4 rounded-3xl bg-pink-500/10 blur-3xl" style={{ transform: "translateZ(-80px)" }} />

      {/* Glowing Edge Gradient Ring */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-tr from-cyan-500/40 via-transparent to-pink-500/40 pointer-events-none" />

      {/* Title bar */}
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-cyan-500/10 rounded-t-3xl overflow-hidden bg-cyan-950/20">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/60 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-pink-500/60 shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
        <div className="ml-2 flex-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 text-cyan-400/80 border border-cyan-500/10">
          <span className="material-symbols-outlined text-[11px] animate-pulse">lock</span>
          <span className="text-[9px] sm:text-[10px] font-mono truncate tracking-wider">hugowishpax.studio</span>
        </div>
        <span className="text-[8px] font-mono text-cyan-500/60 tracking-tighter">SYS_OK</span>
      </div>

      {/* Body — built-up layout */}
      <div className="relative p-4 sm:p-5 space-y-4 rounded-b-3xl overflow-hidden">
        {/* Holographic glowing scan line & gradient trail */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan-500/15 via-cyan-500/5 to-transparent animate-scan pointer-events-none flex flex-col justify-end">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee]" />
        </div>

        {/* Brand block */}
        <div className="flex items-center gap-3" style={{ transform: "translateZ(35px)" }}>
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="material-symbols-outlined text-xl text-cyan-400 animate-pulse">design_services</span>
          </div>
          <div>
            <p className="font-display text-sm sm:text-base font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent animate-gradientShift leading-tight tracking-wider">
              HUGO STUDIO
            </p>
            <p className="text-[7px] sm:text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-cyan-400/60 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
              DIGITAL CRAFT · PORTAL
            </p>
          </div>
        </div>

        {/* Typing lines */}
        <div className="space-y-2.5" style={{ transform: "translateZ(25px)" }}>
          {HERO_LINES.map((l, i) => (
            <div key={i} className="relative h-2 sm:h-2.5 rounded-full bg-cyan-950/40 border border-cyan-500/10 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 1, 0] }}
                transition={{
                  duration: 5,
                  times: [0, 0.18, 0.9, 1],
                  delay: l.delay,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeOut",
                }}
                style={{ width: l.w }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-pink-500 origin-left shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              />
            </div>
          ))}
        </div>

        {/* 3 mini cards */}
        <div className="grid grid-cols-3 gap-2.5" style={{ transform: "translateZ(45px)" }}>
          {[
            { icon: "language", label: "WEB" },
            { icon: "captive_portal", label: "PORTAL" },
            { icon: "school", label: "EDU" }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md p-2 flex flex-col items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
            >
              <span className="material-symbols-outlined text-sm text-cyan-400 animate-pulse">{item.icon}</span>
              <span className="text-[7px] font-mono font-bold text-cyan-300/80 tracking-widest">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA bar */}
        <div
          className="h-9 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center gap-1.5 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
          style={{ transform: "translateZ(30px)" }}
        >
          <motion.span
            animate={{ x: ["-120%", "260%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
          />
          <span className="text-[9px] font-mono font-bold text-slate-950 uppercase tracking-[0.2em]">INITIATE_PROJ</span>
          <span className="material-symbols-outlined text-xs text-slate-950 animate-bounce">arrow_forward</span>
        </div>
      </div>
    </div>
  );
}

function SceneStudio({ container, bind, t, onExplore, reduced }) {
  const { targetRef, p } = useSceneScroll(container);
  const mouse = useMouseParallax(!reduced);

  // Text bay lên & mờ dần, hologram nghiêng + phóng to xuyên qua "camera"
  const textY = useTransform(p, [0, 0.5], [0, -140]);
  const textOpacity = useTransform(p, [0, 0.42], [1, 0]);
  const holoScrollRotX = useTransform(p, [0, 1], [6, 32]);
  const holoRotateX = useTransform([holoScrollRotX, mouse.y], ([a, b]) => a + b * -6);
  const holoScrollRotY = useTransform(p, [0, 1], [-10, 14]);
  const holoRotateY = useTransform([holoScrollRotY, mouse.x], ([a, b]) => a + b * 9);
  const holoScale = useTransform(p, [0, 0.6, 1], [1, 1.4, 2]);
  const holoOpacity = useTransform(p, [0, 0.62, 0.95], [1, 1, 0]);
  const holoY = useTransform(p, [0, 1], [0, 90]);
  const hintOpacity = useTransform(p, [0, 0.15], [1, 0]);

  // Spotlight bám theo con trỏ (đèn sân khấu)
  const spotX = useTransform(mouse.x, (v) => 50 + v * 30);
  const spotY = useTransform(mouse.y, (v) => 40 + v * 25);
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${spotX}% ${spotY}%, hsl(var(--primary)/0.09), transparent 70%)`;

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="220vh">
      {/* Spotlight theo chuột */}
      <motion.div style={{ background: spotlight }} className="absolute inset-0 pointer-events-none" />

      {/* Watermark */}
      <div className="absolute left-[-4%] bottom-[6%] text-[7rem] sm:text-[11rem] xl:text-[15rem] font-black text-foreground/[0.03] dark:text-foreground/[0.02] pointer-events-none select-none tracking-tighter leading-none">
        STUDIO
      </div>

      {/* Dust particles trôi chậm — chiều sâu không gian */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none">
          {DUST.map((d, i) => (
            <motion.span
              key={`dust-${i}`}
              animate={{ y: [0, -40, 0], opacity: [0.1, 0.45, 0.1] }}
              transition={{ duration: d.duration, repeat: Infinity, ease: "easeInOut", delay: d.delay }}
              style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
              className="absolute rounded-full bg-primary/40"
            />
          ))}
        </div>
      )}

      {/* Ambient orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[14%] right-[10%] w-28 h-28 md:w-40 md:h-40 bg-warning/25 rounded-full blur-[60px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[16%] left-[8%] w-36 h-36 md:w-52 md:h-52 bg-primary/25 rounded-full blur-[80px] pointer-events-none"
      />

      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        {/* Left: studio identity — layout sạch, không chồng đè */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="space-y-5 sm:space-y-7 text-center lg:text-left order-2 lg:order-1 will-change-transform"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <Badge className="shadow-[0_0_15px_rgba(99,102,241,0.2)]">{t("intro.studio.badge")}</Badge>
          </motion.div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.02] text-foreground">
            <RevealWords text={t("intro.studio.title1")} delay={0.15} />
            <br />
            <motion.span
              initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent animate-gradientShift text-3xl sm:text-4xl lg:text-5xl xl:text-6xl will-change-transform"
            >
              {t("intro.studio.title2")}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mx-auto lg:mx-0"
          >
            {t("intro.studio.desc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 justify-center lg:justify-start"
          >
            <Magnetic>
              <button
                onClick={onExplore}
                className="group relative inline-flex w-full sm:w-auto items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-foreground text-background font-bold overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-shadow duration-300 text-xs sm:text-sm"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Shine />
                <span className="relative z-10 flex items-center gap-2">
                  {t("intro.studio.explore")}
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-y-1">
                    arrow_downward
                  </span>
                </span>
              </button>
            </Magnetic>
            <Magnetic>
              <Link
                to="/booking"
                className="inline-flex w-full sm:w-auto items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 rounded-full border-2 border-border/50 text-foreground font-bold hover:border-primary hover:text-primary transition-colors duration-300 bg-white/50 dark:bg-transparent backdrop-blur-sm text-xs sm:text-sm"
              >
                {t("intro.slide1.book")}
              </Link>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* Right: hologram browser spacer and emitter */}
        <div className="order-1 lg:order-2 flex items-center justify-center py-4 relative select-none pointer-events-none" style={{ perspective: 1400 }}>
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[270px] sm:w-[330px] lg:w-[390px] h-[340px] sm:h-[420px] flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Double Orbit Rings (Futuristic Projection) */}
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none opacity-60"
              style={{ transform: "translate(-50%,-50%) rotateX(75deg) rotateY(10deg)", transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border border-cyan-500/25 relative"
              >
                <span className="absolute -top-1 left-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
              </motion.div>
            </div>
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none opacity-50"
              style={{ transform: "translate(-50%,-50%) rotateX(70deg) rotateY(-15deg)", transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border border-dashed border-pink-500/20 relative"
              >
                <span className="absolute -bottom-1 left-1/3 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_10px_#ec4899]" />
              </motion.div>
            </div>

            {/* Hologram projection cone/emitter at the bottom */}
            <div 
              className="absolute left-1/2 -bottom-24 -translate-x-1/2 w-48 h-36 opacity-[0.12] pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(6, 182, 212, 0.4), transparent)",
                clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
              }}
            />
            <div className="absolute left-1/2 -bottom-24 -translate-x-1/2 w-16 h-1 bg-cyan-400 shadow-[0_0_12px_#06b6d4] rounded-full opacity-40 blur-[1px] pointer-events-none animate-pulse" />

            {/* Chibi Nice! ló đầu */}
            <Chibi
              src={STICKER_NICE}
              delay={0.4}
              drift={4}
              className="absolute -top-12 -right-6 sm:-right-8 w-14 sm:w-18 z-20"
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        style={{ opacity: hintOpacity }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          {t("intro.studio.scrollHint")}
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="material-symbols-outlined text-muted-foreground text-lg"
        >
          keyboard_arrow_down
        </motion.span>
      </motion.div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 1 — FOUNDER PORTFOLIO (hologram hồ sơ Hugo là trung tâm,
   Jason chỉ là thẻ mini phụ; tech-stack chip chứng minh năng lực code)
   ------------------------------------------------------------------------- */

const VALUE_KEYS = ["v1", "v2", "v3", "v4", "v5"];



function FounderHologram({ t }) {
  const { rx, ry, handlers } = useTilt(8);
  const rows = [
    { icon: "school", text: t("intro.partners.finalYear") },
    { icon: "favorite", text: t("intro.partners.motto") },
  ];
  return (
    <motion.div
      {...handlers}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className="group relative w-[80vw] max-w-[300px] sm:max-w-[340px] rounded-[2rem] bg-white/70 dark:bg-slate-900/70 border border-border/50 backdrop-blur-xl shadow-2xl p-4 sm:p-5 will-change-transform overflow-hidden"
    >
      <Shine />
      <HoloBrackets />

      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-border/50 mb-3">
        <span className="text-[8px] font-black tracking-widest text-primary uppercase">Founder · Portfolio</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
        </div>
      </div>

      {/* Sticker chibi + scan hologram */}
      <div
        className="aspect-[4/3] rounded-xl overflow-hidden relative border border-border/40 bg-gradient-to-br from-primary/10 via-accent/5 to-warning/10"
        style={{ transform: "translateZ(30px)" }}
      >
        <motion.img
          loading="lazy"
          src={STICKER_CODING}
          alt="Hugo chibi đang sáng tạo"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full object-contain p-2 drop-shadow-xl"
        />
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-primary/15 to-transparent animate-scan pointer-events-none" />
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md border border-border/50">
          EST. 2004
        </div>
      </div>

      {/* Identity */}
      <div className="pt-3 space-y-2" style={{ transform: "translateZ(20px)" }}>
        <div className="text-center space-y-0.5">
          <h3 className="font-display text-base sm:text-lg font-black text-foreground leading-tight">Peter Hugo Wishpax Lê</h3>
          <p className="text-[8px] sm:text-[9px] text-muted-foreground font-bold tracking-wider uppercase">
            {t("intro.partners.founderRole")}
          </p>
        </div>

        {/* Open to work */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {t("intro.partners.openToWork")}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 pt-1">
          {rows.map((r) => (
            <div key={r.icon} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-muted/50">
              <span className="material-symbols-outlined text-sm text-foreground">{r.icon}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/90">{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer barcode */}
      <div className="mt-3 pt-2 border-t border-border/50 flex justify-between items-center text-[7px] font-mono text-muted-foreground">
        <span>HUGO·STUDIO</span>
        <div className="h-4 flex items-center gap-0.5 opacity-60">
          {[1, 2, 1, 3, 1, 2].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-full bg-muted-foreground" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Jason — thẻ mini đơn giản, chỉ ghi nhận vai trò đối tác
function PartnerMini({ t }) {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      whileHover={{ scale: 1.05, rotate: -1.5 }}
      className="flex items-center gap-3 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-md px-4 py-2.5 shadow-lg"
    >
      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border border-border/50 shrink-0">
        <img loading="lazy" src={optimizeCloudinaryUrl(JASON_PHOTO, 200)} alt="Jason Phan" className="w-full h-full object-cover object-top" />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-black text-foreground font-display">Jason Phan</p>
        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{t("intro.partners.partnerRole")}</p>
      </div>
    </motion.div>
  );
}

function ScenePartners({ container, bind, t }) {
  const { targetRef, p } = useSceneScroll(container);

  const textX = useTransform(p, [0.02, 0.18], [-120, 0]);
  const textOpacity = useTransform(p, [0.02, 0.16], [0, 1]);
  const cardRotY = useTransform(p, [0.02, 0.26], [-70, 4]);
  const cardX = useTransform(p, [0.02, 0.26], [260, 0]);
  const cardOpacity = useTransform(p, [0.02, 0.18], [0, 1]);
  const miniOpacity = useTransform(p, [0.26, 0.38], [0, 1]);
  const miniY = useTransform(p, [0.26, 0.38], [40, 0]);
  const stackOpacity = useTransform(p, [0.32, 0.46], [0, 1]);
  const stackY = useTransform(p, [0.32, 0.46], [40, 0]);

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="200vh">
      <div className="absolute right-[2%] top-[8%] text-[6rem] sm:text-[10rem] xl:text-[13rem] font-black text-foreground/[0.025] dark:text-foreground/[0.015] pointer-events-none select-none tracking-tighter leading-none">
        HUGO
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center relative z-10">
        {/* Text + tech stack */}
        <motion.div style={{ x: textX, opacity: textOpacity }} className="space-y-3 sm:space-y-5 text-center lg:text-left will-change-transform order-2 lg:order-1">
          <div className="flex justify-center lg:justify-start">
            <Badge>{t("intro.partners.badge")}</Badge>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            {t("intro.partners.title1")}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("intro.partners.title2")}
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t("intro.partners.desc")}
          </p>

          <motion.div style={{ opacity: stackOpacity, y: stackY }} className="space-y-2 will-change-transform">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t("intro.partners.stackTitle")}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {VALUE_KEYS.map((k, i) => (
                <motion.span
                  key={k}
                  whileHover={{ scale: 1.1, rotate: i % 2 ? 3 : -3 }}
                  className="px-3.5 py-1.5 rounded-full bg-muted text-foreground text-[10px] sm:text-xs font-bold cursor-default select-none"
                >
                  {t(`intro.partners.${k}`)}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Founder hologram space + Jason mini */}
        <div className="flex flex-col items-center gap-3 order-1 lg:order-2" style={{ perspective: 1200 }}>
          <motion.div
            style={{ x: cardX, opacity: cardOpacity, transformStyle: "preserve-3d" }}
            className="relative w-[80vw] max-w-[300px] sm:max-w-[340px] h-[340px] sm:h-[400px] flex items-center justify-center pointer-events-none"
          >
            {/* Blob hoạt hình sau lưng */}
            <div className="absolute -inset-6 bg-primary/10 blur-2xl animate-blobMorph pointer-events-none" />
            {/* Nhân vật chibi vệ tinh quanh card */}
            <Chibi src={STICKER_HELLO} tilt={6} className="absolute -left-10 sm:-left-14 top-6 w-16 sm:w-20 z-10" />
            <Chibi src={STICKER_WOW} delay={0.6} tilt={5} className="absolute -right-10 sm:-right-14 bottom-16 w-16 sm:w-20 z-10" />
          </motion.div>
          <motion.div style={{ opacity: miniOpacity, y: miniY }} className="will-change-transform">
            <PartnerMini t={t} />
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 2 — VỀ TÔI (3 chương crossfade như video: danh tính → học vấn → triết lý)
   ------------------------------------------------------------------------- */

function Chapter({ p, range, hold = false, children }) {
  const [a, b, c, d] = range;
  const opacity = useTransform(p, hold ? [a, b, 1] : [a, b, c, d], hold ? [0, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, hold ? [a, b, 1] : [a, b, c, d], hold ? [50, 0, 0] : [50, 0, 0, -50]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center space-y-4 will-change-transform">
      {children}
    </motion.div>
  );
}

function SceneAbout({ container, bind, t, realPhoto, fullName, reduced }) {
  const { targetRef, p } = useSceneScroll(container);
  const mouse = useMouseParallax(!reduced);

  const scrollRotY = useTransform(p, [0, 1], [22, -22]);
  const portraitRotY = useTransform([scrollRotY, mouse.x], ([a, b]) => a + b * 6);
  const scrollRotX = useTransform(p, [0, 1], [6, -6]);
  const portraitRotX = useTransform([scrollRotX, mouse.y], ([a, b]) => a + b * -4);
  const portraitOpacity = useTransform(p, [0, 0.1], [0.3, 1]);
  const dot1 = useTransform(p, [0.02, 0.1, 0.3, 0.38], [0.25, 1, 1, 0.25]);
  const dot2 = useTransform(p, [0.34, 0.42, 0.62, 0.7], [0.25, 1, 1, 0.25]);
  const dot3 = useTransform(p, [0.66, 0.74, 1, 1], [0.25, 1, 1, 1]);

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="260vh">
      <div className="absolute left-[3%] top-[8%] text-[6rem] sm:text-[9rem] xl:text-[12rem] font-black text-foreground/[0.03] dark:text-foreground/[0.015] pointer-events-none select-none tracking-tighter leading-none -rotate-6 md:rotate-0">
        EST. 2004
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-center relative z-10">
        {/* Portrait space — 3D tilt theo scroll + con trỏ */}
        <div className="lg:col-span-5 flex justify-center relative pointer-events-none" style={{ perspective: 1200 }}>
          {/* Chibi Yummy! ghé chơi góc chân dung */}
          <Chibi src={STICKER_YUMMY} delay={0.7} drift={6} tilt={5} className="absolute -bottom-6 left-[6%] w-16 sm:w-24 z-20" />
          <motion.div
            style={{ opacity: portraitOpacity }}
            className="relative w-[210px] sm:w-[270px] lg:w-[320px] h-[300px] sm:h-[400px] flex items-center justify-center"
          >
            <div className="absolute -inset-4 bg-primary/15 blur-2xl animate-blobMorph" />
          </motion.div>
        </div>

        {/* Chapters */}
        <div className="lg:col-span-7 relative h-[300px] sm:h-[340px] lg:h-[420px]">
          {/* Chapter 1 — danh tính */}
          <Chapter p={p} range={[0.02, 0.1, 0.3, 0.38]}>
            <Badge className="self-start bg-warning/15 text-warning border-warning/30">{t("intro.slide3.badge")}</Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Xin chào, tôi là <br />
              <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent">
                Hugo.
              </span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
              {t("intro.about.desc")}
            </p>
          </Chapter>

          {/* Chapter 2 — học vấn */}
          <Chapter p={p} range={[0.34, 0.42, 0.62, 0.7]}>
            <Badge className="self-start">{t("intro.slide3.eduTitle")}</Badge>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold text-foreground leading-tight">
              {t("intro.slide3.title1")} {t("intro.slide3.title2")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <a
                href="https://ndc.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden p-4 rounded-2xl glass-sm border border-border/50 hover:border-primary hover:-translate-y-1 transition-all duration-300 block text-left space-y-1.5"
              >
                <Shine />
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-wider">
                    {t("intro.slide3.highSchool")}
                  </span>
                  <span className="material-symbols-outlined text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    open_in_new
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{t("intro.slide3.highSchoolDesc")}</p>
              </a>
              <a
                href="https://greenwich.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden p-4 rounded-2xl glass-sm border border-border/50 hover:border-accent hover:-translate-y-1 transition-all duration-300 block text-left space-y-1.5"
              >
                <Shine />
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-accent uppercase tracking-wider">
                    {t("intro.slide3.uni")}
                  </span>
                  <span className="material-symbols-outlined text-sm text-muted-foreground group-hover:text-accent transition-colors">
                    open_in_new
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{t("intro.slide3.uniDesc")}</p>
              </a>
            </div>
          </Chapter>

          {/* Chapter 3 — triết lý */}
          <Chapter p={p} range={[0.66, 0.74, 1, 1]} hold>
            <Badge className="self-start bg-warning/15 text-warning border-warning/30">{t("intro.slide8.badge")}</Badge>
            <blockquote className="text-base sm:text-xl lg:text-3xl italic font-semibold text-primary border-l-4 border-primary pl-4 sm:pl-6 py-1 leading-snug max-w-xl">
              {t("intro.slide8.quote")}
            </blockquote>
            <div className="space-y-2 text-xs sm:text-sm max-w-xl">
              {["p1", "p2", "p3"].map((k, i) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary font-mono">0{i + 1}</span>
                  <span className="font-semibold text-foreground/90">{t(`intro.slide8.${k}`)}</span>
                </div>
              ))}
            </div>
          </Chapter>
        </div>
      </div>

      {/* Chapter indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {[dot1, dot2, dot3].map((op, i) => (
          <motion.span key={i} style={{ opacity: op }} className="w-2 h-2 rounded-full bg-primary" />
        ))}
      </div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 4 — BIO EDU MIỄN PHÍ (thẻ sinh viên lật 3D 180° + glare quét theo scroll)
   ------------------------------------------------------------------------- */

const EDU_TOOLS = [
  { id: "banhocduong", name: "Bạn Học Đường", icon: "school" },
  { id: "therapy", name: "Hugo PSY", icon: "psychology" },
  { id: "ide", name: "Web IDE", icon: "terminal" },
  { id: "radio", name: "Hugo Radio", icon: "radio" },
  { id: "aura", name: "Aura AI", icon: "lens_blur" },
];

function SceneBio({ container, bind, t }) {
  const { targetRef, p } = useSceneScroll(container);

  const textOpacity = useTransform(p, [0.03, 0.18], [0, 1]);
  const textY = useTransform(p, [0.03, 0.18], [60, 0]);
  const cardRotY = useTransform(p, [0.28, 0.6], [0, 180]);
  const cardScale = useTransform(p, [0.05, 0.25], [0.8, 1]);
  const cardOpacity = useTransform(p, [0.05, 0.2], [0, 1]);
  const glareX = useTransform(p, [0.28, 0.6], ["-140%", "240%"]);
  const benefitsOpacity = useTransform(p, [0.42, 0.56], [0, 1]);
  const benefitsY = useTransform(p, [0.42, 0.56], [60, 0]);
  const toolsOpacity = useTransform(p, [0.6, 0.74], [0, 1]);
  const toolsY = useTransform(p, [0.6, 0.74], [50, 0]);

  const cardFace =
    "absolute inset-0 rounded-[1.75rem] bg-gradient-to-b from-white/95 to-white/50 dark:from-slate-900/95 dark:to-slate-900/50 backdrop-blur-2xl border border-white/40 dark:border-white/10 p-5 sm:p-6 shadow-2xl overflow-hidden [backface-visibility:hidden]";

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="240vh">
      <div className="absolute left-[4%] top-[8%] text-[5rem] sm:text-[8rem] xl:text-[11rem] font-black text-foreground/[0.03] dark:text-foreground/[0.015] pointer-events-none select-none tracking-tighter leading-none -rotate-12">
        FREE .EDU
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-16 flex flex-col gap-5 sm:gap-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-10 items-center">
          {/* Text */}
          <motion.div style={{ opacity: textOpacity, y: textY }} className="md:col-span-7 space-y-3 sm:space-y-4 will-change-transform">
            <Badge>{t("intro.slide5.badge")}</Badge>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              {t("intro.slide5.title1")} <br />
              {t("intro.slide5.title2")}
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-2xl">
              <Trans i18nKey="intro.slide5.desc">
                Tôi mong muốn hỗ trợ tối đa cho học sinh, sinh viên trong việc xây dựng thương hiệu cá nhân số. Mỗi
                tài khoản đăng ký sử dụng email giáo dục có chứa hậu tố{" "}
                <strong className="text-primary">.edu</strong> sẽ được tự động kích hoạt tạo 1 trang Bio tùy chỉnh
                hoàn toàn miễn phí.
              </Trans>
            </p>
            <div className="pt-1">
              <Magnetic className="inline-block">
                <a
                  href="/login"
                  className="group relative overflow-hidden px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 inline-block"
                >
                  <Shine />
                  <span className="relative z-10">{t("intro.slide5.createBtn")}</span>
                </a>
              </Magnetic>
            </div>
          </motion.div>

          {/* 3D flip student card (ẩn trên mobile — quyền lợi đã có lưới chi tiết) */}
          {/* 3D student card space (hidden on mobile) */}
          <div className="md:col-span-5 hidden md:flex justify-center relative pointer-events-none" style={{ perspective: 1300 }}>
            {/* Chibi hỗ trợ đứng cạnh thẻ */}
            <Chibi src={STICKER_SUPPORT} delay={0.5} drift={6} tilt={3} className="absolute -right-4 -bottom-14 w-24 lg:w-28 z-20" />
            <div className="relative w-full max-w-[300px] sm:max-w-[340px] h-[210px] sm:h-[240px]" />
          </div>
        </div>

        {/* Quyền lợi chi tiết sau khi xác minh */}
        <motion.div style={{ opacity: benefitsOpacity, y: benefitsY }} className="space-y-2.5 will-change-transform">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            {t("intro.slide5.benefitsTitle")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { k: "b1", icon: "id_card" },
              { k: "b2", icon: "link" },
              { k: "b3", icon: "bolt" },
              { k: "b4", icon: "widgets" },
            ].map((b, i) => (
              <motion.div
                key={b.k}
                whileHover={{ y: -5, rotate: i % 2 ? 1.5 : -1.5, scale: 1.03 }}
                className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-2.5 sm:p-4 space-y-1 sm:space-y-1.5 text-left"
              >
                <MonoIcon name={b.icon} size="text-base" box="w-8 h-8" />
                <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">{t(`intro.slide5.${b.k}t`)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{t(`intro.slide5.${b.k}d`)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tiện ích HSSV miễn phí */}
        <motion.div style={{ opacity: toolsOpacity, y: toolsY }} className="space-y-3 will-change-transform">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            Tiện ích HSSV miễn phí đi kèm
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {EDU_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                to={`/public-tools/${tool.id}`}
                className="group flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-card/70 border border-border/50 hover:border-primary transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <span className="w-7 h-7 rounded-full bg-muted text-foreground flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">{tool.icon}</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 4.5 — VŨ TRỤ TIỆN ÍCH (Orbiting utility planets + interactive cards)
   ------------------------------------------------------------------------- */

function SceneDiscoveries({ container, bind, t, reduced }) {
  const { targetRef, p } = useSceneScroll(container);
  const mouse = useMouseParallax(!reduced);

  // Smooth scroll animations
  const textOpacity = useTransform(p, [0.03, 0.22], [0, 1]);
  const textY = useTransform(p, [0.03, 0.22], [60, 0]);

  const orbitOpacity = useTransform(p, [0.12, 0.32], [0, 1]);
  const orbitScale = useTransform(p, [0.12, 0.42], [0.8, 1]);
  const orbitRotate = useTransform(p, [0.12, 1], [0, 60]);

  const mouseXParallax = useTransform(mouse.x, (v) => v * 12);
  const mouseYParallax = useTransform(mouse.y, (v) => v * 12);

  const discoveryItems = [
    { id: "aura", name: t("intro.discoveries.auraTitle"), icon: "lens_blur", path: "/aura", desc: t("intro.discoveries.auraDesc"), color: "rgba(168,85,247,0.3)" },
    { id: "therapy", name: t("intro.discoveries.psyTitle"), icon: "psychology", path: "/therapy", desc: t("intro.discoveries.psyDesc"), color: "rgba(236,72,153,0.3)" },
    { id: "banhocduong", name: t("intro.discoveries.hocduongTitle"), icon: "school", path: "/banhocduong", desc: t("intro.discoveries.hocduongDesc"), color: "rgba(59,130,246,0.3)" },
    { id: "radio", name: t("intro.discoveries.radioTitle"), icon: "radio", path: "/radio", desc: t("intro.discoveries.radioDesc"), color: "rgba(234,179,8,0.3)" },
    { id: "ide", name: t("intro.discoveries.ideTitle"), icon: "terminal", path: "/member/utilities/ide", desc: t("intro.discoveries.ideDesc"), color: "rgba(6,182,212,0.3)" },
    { id: "arcade", name: t("intro.discoveries.arcadeTitle"), icon: "sports_esports", path: "/arcade", desc: t("intro.discoveries.arcadeDesc"), color: "rgba(16,185,129,0.3)" },
    { id: "joy", name: t("intro.discoveries.joyTitle"), icon: "wallet", path: "/joy", desc: t("intro.discoveries.joyDesc"), color: "rgba(99,102,241,0.3)" },
    { id: "bio", name: t("intro.discoveries.bioTitle"), icon: "id_card", path: "/login", desc: t("intro.discoveries.bioDesc"), color: "rgba(239,68,68,0.3)" },
  ];

  const [activeItem, setActiveItem] = useState(null);

  // Prevent icons from rotating by counter-rotating them
  const counterRotate = useTransform(orbitRotate, (r) => -r);

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="220vh">
      <div className="absolute right-[4%] top-[8%] text-[5rem] sm:text-[8rem] xl:text-[11rem] font-black text-foreground/[0.02] dark:text-foreground/[0.01] pointer-events-none select-none tracking-tighter leading-none">
        DISCOVER
      </div>

      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left column: Text details */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="lg:col-span-5 space-y-4 sm:space-y-6 text-center lg:text-left order-2 lg:order-1"
        >
          <Badge>{t("intro.discoveries.badge")}</Badge>

          <div className="h-[280px] sm:h-[300px] flex flex-col justify-center lg:justify-start">
            {activeItem ? (
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: activeItem.color.replace("0.3", "0.85") }}
                  >
                    <span className="material-symbols-outlined text-2xl">{activeItem.icon}</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                    {activeItem.name}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {activeItem.desc}
                </p>
                <div className="pt-2">
                  <Magnetic className="inline-block">
                    <Link
                      to={activeItem.path}
                      className="group relative overflow-hidden px-6 py-2.5 rounded-full bg-foreground text-background font-bold text-xs shadow-md inline-flex items-center gap-2"
                    >
                      <Shine />
                      <span>{t("intro.studio.explore")}</span>
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </Link>
                  </Magnetic>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
                  {t("intro.discoveries.title1")}<br />
                  <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent">
                    {t("intro.discoveries.title2")}
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("intro.discoveries.desc")}
                </p>
                <p className="text-xs text-primary font-bold uppercase tracking-wider animate-pulse hidden lg:block">
                  ✦ Rê chuột qua các hạt hành tinh để khám phá vũ trụ số
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column: Orbiting planets */}
        <div className="lg:col-span-7 flex justify-center items-center h-[340px] sm:h-[440px] relative order-1 lg:order-2">
          <motion.div
            style={{
              opacity: orbitOpacity,
              scale: orbitScale,
              rotateZ: orbitRotate,
              x: mouseXParallax,
              y: mouseYParallax,
              transformStyle: "preserve-3d",
            }}
            className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full border border-dashed border-border/30 relative flex items-center justify-center"
          >
            {/* Core Logo Node placeholder (rendered by HologramMaster) */}
            <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full z-20 pointer-events-none" />

            {/* Orbit paths */}
            <div className="absolute w-[200px] h-[200px] rounded-full border border-dotted border-border/20 pointer-events-none" />

            {/* Orbiting items */}
            {discoveryItems.map((item, idx) => {
              const angle = (idx * 360) / discoveryItems.length;
              const angleRad = (angle * Math.PI) / 180;
              const radius = typeof window !== "undefined" && window.innerWidth >= 640 ? 170 : 125;
              const x = Math.cos(angleRad) * radius;
              const y = Math.sin(angleRad) * radius;

              const isCurrent = activeItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${x}px - 22px)`,
                    top: `calc(50% + ${y}px - 22px)`,
                    transformStyle: "preserve-3d",
                  }}
                  className="z-30 pointer-events-auto"
                >
                  <motion.button
                    onMouseEnter={() => {
                      buzz(4);
                      setActiveItem(item);
                    }}
                    onClick={() => {
                      buzz(8);
                      setActiveItem(item);
                    }}
                    whileHover={{ scale: 1.22 }}
                    style={{
                      rotate: counterRotate,
                      backgroundColor: isCurrent ? item.color.replace("0.3", "0.4") : "rgba(255,255,255,0.06)",
                      borderColor: isCurrent ? item.color.replace("0.3", "0.8") : "rgba(255,255,255,0.1)",
                      boxShadow: isCurrent ? `0 0 25px ${item.color.replace("0.3", "0.8")}` : "none",
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center text-foreground transition-all duration-300 backdrop-blur-md cursor-pointer focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">{item.icon}</span>
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   SCENE 5 — LIÊN LẠC NHANH + CTA (tiles bay vào từ chiều sâu 3D + magnetic)
   ------------------------------------------------------------------------- */

function ContactTile({ p, start, href, icon, label }) {
  const opacity = useTransform(p, [start, start + 0.14], [0, 1]);
  const y = useTransform(p, [start, start + 0.14], [90, 0]);
  const rotateX = useTransform(p, [start, start + 0.14], [45, 0]);
  return (
    <motion.div style={{ opacity, y, rotateX, transformStyle: "preserve-3d" }} className="will-change-transform">
      <Magnetic strength={10}>
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group relative overflow-hidden clay-card rounded-2xl md:rounded-[2rem] p-4 md:p-7 border border-border/50 bg-white/75 dark:bg-background/45 flex flex-col items-center justify-center gap-2 md:gap-3 text-center hover:scale-[1.05] hover:shadow-glow transition-all duration-300 shadow-lg"
        >
          <Shine />
          <MonoIcon name={icon} size="text-2xl md:text-3xl" box="w-11 h-11 md:w-14 md:h-14" />
          <span className="font-display text-xs md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {label}
          </span>
        </a>
      </Magnetic>
    </motion.div>
  );
}

function SceneTransition({ container, bind, setIsTransitioning }) {
  const { targetRef, p } = useSceneScroll(container);
  const navigate = useNavigate();

  // Listen to the scroll progress of this transition scene reactively
  useEffect(() => {
    let triggered = false;
    const unsubscribe = p.on("change", (value) => {
      if (value > 0.9 && !triggered) {
        triggered = true;
        setIsTransitioning(true);
        setTimeout(() => {
          navigate("/services");
        }, 550);
      }
    });
    return () => unsubscribe();
  }, [p, navigate, setIsTransitioning]);

  const opacity = useTransform(p, [0, 0.3, 0.7, 0.9], [0, 1, 1, 0]);
  const scale = useTransform(p, [0, 0.3, 0.7, 0.9], [0.95, 1, 1, 1.15]);
  const blurVal = useTransform(p, [0, 0.3, 0.7, 0.9], [20, 0, 0, 15]);
  const blurValue = useMotionTemplate`blur(${blurVal}px)`;

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="140vh">
      <motion.div
        style={{
          opacity,
          scale,
          filter: blurValue,
        }}
        className="w-full h-full flex flex-col items-center justify-center space-y-8 px-4"
      >
        <motion.div className="text-center space-y-4 max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground"
          >
            Từ lời nói sang hành động
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-muted-foreground italic"
          >
            "Hãy chọn một sắc thái, hay tôi sẽ vẽ cầu vồng cho bạn."
          </motion.p>
        </motion.div>

        {/* Animated arrow pointing down */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-3xl text-primary/60"
        >
          <span className="material-symbols-outlined">expand_more</span>
        </motion.div>
      </motion.div>
    </SceneShell>
  );
}

function SceneContact({ container, bind, t, profile }) {
  const { targetRef, p } = useSceneScroll(container);

  const headOpacity = useTransform(p, [0.02, 0.15], [0, 1]);
  const headY = useTransform(p, [0.02, 0.15], [50, 0]);
  const ctaOpacity = useTransform(p, [0.46, 0.6], [0, 1]);
  const ctaY = useTransform(p, [0.46, 0.6], [60, 0]);

  const contacts = [
    { href: `https://zalo.me/${profile.zaloNumber}`, icon: "sms", label: t("intro.slide9.zalo"), start: 0.08 },
    { href: `mailto:${profile.emailAddress}`, icon: "mail", label: t("intro.slide9.email"), start: 0.13 },
    { href: "https://facebook.com/hugowishpax.le", icon: "group", label: t("intro.slide9.fb"), start: 0.18 },
    {
      href: "https://www.tiktok.com/@pethugowishpaxle?_r=1&_t=ZS-96UW9Neg8UW",
      icon: "play_circle",
      label: t("intro.slide9.tiktok"),
      start: 0.23,
    },
  ];

  return (
    <SceneShell bind={bind} targetRef={targetRef} height="220vh">
      <div className="absolute right-[3%] bottom-[6%] text-[6rem] sm:text-[10rem] xl:text-[13rem] font-black text-foreground/[0.025] dark:text-foreground/[0.012] pointer-events-none select-none tracking-tighter leading-none">
        HELLO
      </div>

      <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-16 space-y-6 sm:space-y-10 relative z-10" style={{ perspective: 1200 }}>
        {/* Header */}
        <motion.div style={{ opacity: headOpacity, y: headY }} className="text-center space-y-3 will-change-transform">
          <div className="flex justify-center">
            <Chibi src={STICKER_HELLO} drift={6} tilt={3} className="w-20 sm:w-28" />
          </div>
          <Badge>{t("intro.slide9.badge")}</Badge>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
            {t("intro.slide9.title")}
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl mx-auto">
            {t("intro.slide9.desc")}
          </p>
        </motion.div>

        {/* Contact tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {contacts.map((c) => (
            <ContactTile key={c.icon} p={p} {...c} />
          ))}
        </div>

        {/* Final CTA */}
        <motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="relative text-center space-y-4 sm:space-y-5 pt-2 will-change-transform">
          {/* Chibi lái xe "Let's go" — sẵn sàng lên đường cùng bạn */}
          <Chibi src={STICKER_GO} delay={0.2} drift={5} tilt={2} className="absolute -top-16 sm:-top-20 right-[4%] w-24 sm:w-32 hidden sm:block" />
          <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
            {t("intro.slide10.title1")}{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent animate-gradientShift">
              {t("intro.slide10.title2")}
            </span>
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Magnetic>
              <a
                href="/login"
                className="group relative overflow-hidden px-8 py-4 rounded-full bg-primary text-white font-bold shadow-xl shadow-primary/25 text-xs sm:text-sm inline-flex w-full sm:w-auto items-center justify-center"
              >
                <Shine />
                <span className="relative z-10">{t("intro.slide10.registerBtn")}</span>
              </a>
            </Magnetic>
            <Magnetic>
              <Link
                to="/booking"
                className="px-8 py-4 rounded-full border border-border text-foreground font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm inline-flex w-full sm:w-auto items-center justify-center"
              >
                {t("intro.slide10.bookBtn")}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                to="/services"
                className="px-8 py-4 rounded-full border border-border text-muted-foreground font-bold hover:text-primary hover:border-primary transition-colors text-xs sm:text-sm inline-flex w-full sm:w-auto items-center justify-center gap-2"
              >
                {t("intro.slide6.pricingBtn")}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </SceneShell>
  );
}

/* ---------------------------------------------------------------------------
   PAGE
   ------------------------------------------------------------------------- */

const NAV_KEYS = [
  "intro.nav.studio",
  "intro.nav.partners",
  "intro.nav.about",
  "intro.nav.bioEdu",
  "intro.nav.discoveries",
  "intro.nav.contacts",
];

export default function IntroductionPage() {
  const { data } = useData();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const lenisRef = useRef(null);
  const sceneEls = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useHeadMeta({
    title: "Hugo Studio — Portfolio & Dịch Vụ Thiết Kế Web Sinh Viên",
    description:
      "Hugo Studio — Portfolio và dịch vụ làm web cá nhân của Hugo Lê: sửa web từ 150k, landing page từ 999k, website trọn gói từ 2.49tr. Tạo trang bio cá nhân miễn phí và tiện ích học tập cho học sinh, sinh viên.",
    keywords:
      "làm web sinh viên, thiết kế website giá rẻ, tạo bio miễn phí, bio miễn phí, link in bio, làm web giá rẻ, làm landing page, Hugo Studio, Hugo Lê, portfolio",
    canonicalUrl: "https://www.hugowishpax.studio/introduction",
  });

  // Lenis — inertia scroll mượt kiểu Apple (tôn trọng prefers-reduced-motion)
  useEffect(() => {
    if (reduced || !containerRef.current) return;
    const lenis = new Lenis({
      wrapper: containerRef.current,
      content: contentRef.current,
      lerp: 0.14,
    });
    lenisRef.current = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  // Thanh tiến độ tổng thể (Apple-style)
  const { scrollYProgress } = useScroll({ container: containerRef, layoutEffect: false });
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const mid = el.scrollTop + el.clientHeight / 2;
    let idx = 0;
    sceneEls.current.forEach((scene, i) => {
      if (scene && scene.offsetTop <= mid) idx = i;
    });
    // Cap activeIndex for visual nav-highlight to index 5
    const displayIdx = Math.min(idx, 5);
    setActiveIndex((prev) => {
      if (prev !== displayIdx) buzz(5);
      return displayIdx;
    });
  };

  const playTick = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignore audio context errors if user hasn't interacted
    }
  };

  const scrollToScene = (idx) => {
    playTick();
    buzz(8);
    const el = containerRef.current;
    const scene = sceneEls.current[idx];
    if (!el || !scene) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(scene.offsetTop, { duration: 1.4 });
    } else {
      el.scrollTo({ top: scene.offsetTop, behavior: "smooth" });
    }
  };

  if (!data) return null;

  const realPhoto = optimizeCloudinaryUrl(data.gallery?.[0]?.url || "/image/avt1.png", 800);
  const bindScene = (i) => (el) => {
    sceneEls.current[i] = el;
  };

  return (
    <div className="relative w-full h-[calc(100vh-56px)] overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradientShift { background-size: 200% 200%; animation: gradientShift 6s ease-in-out infinite; }
        @keyframes blobMorph {
          0%, 100% { border-radius: 58% 42% 55% 45% / 50% 55% 45% 50%; }
          33% { border-radius: 45% 55% 48% 52% / 58% 44% 56% 42%; }
          66% { border-radius: 52% 48% 42% 58% / 44% 56% 48% 52%; }
        }
        .animate-blobMorph { animation: blobMorph 9s ease-in-out infinite; }
        @keyframes shoot {
          0% { transform: translateX(0) translateY(0) rotate(-45deg) scale(0); opacity: 0; }
          1% { opacity: 1; scale: 1; }
          20% { transform: translateX(-300px) translateY(300px) rotate(-45deg) scale(1); opacity: 0; }
          100% { transform: translateX(-300px) translateY(300px) rotate(-45deg) scale(0); opacity: 0; }
        }
        .shooting-star {
          position: absolute;
          width: 120px;
          height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0));
          transform: rotate(-45deg);
          opacity: 0;
          animation: shoot 12s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Overall scroll progress bar */}
      <motion.div
        style={{ scaleX: progressScaleX }}
        className="absolute top-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-primary via-accent to-warning z-[60]"
      />

      {/* Scene indicators */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
        {NAV_KEYS.map((key, idx) => (
          <button
            key={key}
            onClick={() => scrollToScene(idx)}
            className="group flex items-center justify-end gap-3 text-right focus:outline-none"
          >
            <span
              className={`transition-opacity duration-300 text-[10px] font-bold tracking-widest text-primary uppercase ${
                activeIndex === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {t(key)}
            </span>
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                activeIndex === idx
                  ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/30"
                  : "border-muted-foreground/50 bg-transparent hover:border-primary"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Starry Universe & Dynamic Nebulae Background */}
      <StarryUniverse activeIndex={activeIndex} reduced={reduced} />

      {/* Floating Hologram Master (Linked thread across scenes) */}
      <HologramMaster
        activeIndex={activeIndex}
        realPhoto={realPhoto}
        fullName={data.profile.fullName}
        t={t}
        scrollProgress={scrollYProgress}
        isMobile={isMobile}
        reduced={reduced}
      />

      {/* Film-grain overlay */}
      <div
        aria-hidden
        style={{ backgroundImage: NOISE_BG }}
        className="absolute inset-0 pointer-events-none z-20 opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay"
      />

      {/* Cinematic scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto no-scrollbar text-foreground relative z-10"
      >
        <div ref={contentRef}>
          <SceneStudio container={containerRef} bind={bindScene(0)} t={t} onExplore={() => scrollToScene(1)} reduced={reduced} />
          <ScenePartners container={containerRef} bind={bindScene(1)} t={t} />
          <SceneAbout container={containerRef} bind={bindScene(2)} t={t} realPhoto={realPhoto} fullName={data.profile.fullName} reduced={reduced} />
          <SceneBio container={containerRef} bind={bindScene(3)} t={t} />
          <SceneDiscoveries container={containerRef} bind={bindScene(4)} t={t} reduced={reduced} />
          <SceneContact container={containerRef} bind={bindScene(5)} t={t} profile={data.profile} />
          <SceneTransition container={containerRef} bind={bindScene(6)} t={t} setIsTransitioning={setIsTransitioning} />
        </div>
      </div>

      {/* Cinematic Portal Transition Wormhole Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#04050f] z-[100] flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-pink-500 border-l-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
