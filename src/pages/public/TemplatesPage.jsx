import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import PhotographyDemo from "../../components/demos/PhotographyDemo";
import CoffeeDemo from "../../components/demos/CoffeeDemo";
import JewelryDemo from "../../components/demos/JewelryDemo";
import PortfolioDemo from "../../components/demos/PortfolioDemo";
import ECommerceDemo from "../../components/demos/ECommerceDemo";
import DashboardDemo from "../../components/demos/DashboardDemo";
import HugoLogo from "../../components/HugoLogo";

const coreValues = [
  { id: 1, title: "Tận Tâm", desc: "Tỉ mỉ từng tinh vân mã nguồn", img: "/image/avt5.png", color: "from-blue-500/30 to-cyan-500/30", neon: "shadow-[0_0_30px_rgba(6,182,212,0.5)]" },
  { id: 2, title: "Thấu Hiểu", desc: "Lắng nghe tầng sâu của vũ trụ", img: "/image/avt6.png", color: "from-purple-500/30 to-pink-500/30", neon: "shadow-[0_0_30px_rgba(168,85,247,0.5)]" },
  { id: 3, title: "Sáng Tạo", desc: "Sáng rực như siêu tân tinh", img: "/image/avt1.png", color: "from-emerald-500/30 to-teal-500/30", neon: "shadow-[0_0_30px_rgba(16,185,129,0.5)]" },
  { id: 4, title: "Kết Nối", desc: "Mạng lưới ngân hà bền chặt", img: "/image/avt2.png", color: "from-amber-500/30 to-orange-500/30", neon: "shadow-[0_0_30px_rgba(245,158,11,0.5)]" },
  { id: 5, title: "Tốc Độ", desc: "Nhanh như tốc độ ánh sáng", img: "/image/avt3.png", color: "from-red-500/30 to-rose-500/30", neon: "shadow-[0_0_30px_rgba(239,68,68,0.5)]" },
  { id: 6, title: "Bảo Vệ", desc: "Lá chắn an toàn tuyệt đối", img: "/image/avt4.png", color: "from-indigo-500/30 to-blue-500/30", neon: "shadow-[0_0_30px_rgba(99,102,241,0.5)]" }
];

const templates = [
  { id: "photography", title: "Studio Chụp Ảnh", short: "Chụp Ảnh", subtitle: "Nhiếp ảnh gia", url: "hugo.dev/photography", icon: "photo_camera" },
  { id: "cafe", title: "Quán Cafe & Bistro", short: "Cafe", subtitle: "Nhà hàng", url: "hugo.dev/cafe", icon: "local_cafe" },
  { id: "jewelry", title: "Web Bán Vàng", short: "Bán Vàng", subtitle: "Tiệm vàng", url: "hugo.dev/jewelry", icon: "diamond" },
  { id: "portfolio", title: "Giới Thiệu Cá Nhân", short: "Portfolio", subtitle: "Hồ sơ năng lực", url: "hugo.dev/portfolio", icon: "person" },
  { id: "ecommerce", title: "Trang Bán Hàng", short: "E-Commerce", subtitle: "Đa ngành", url: "hugo.dev/store", icon: "shopping_bag" },
  { id: "dashboard", title: "Trang Quản Lý", short: "Dashboard", subtitle: "Dashboard", url: "hugo.dev/admin", icon: "dashboard" }
];

const TOTAL_SLIDES = 6;

// --- Background Stars ---
const Starfield = ({ normalizedX, normalizedY }) => {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2.5 + 0.5, delay: Math.random() * 5, duration: Math.random() * 3 + 2,
    })));
  }, []);

  const parallaxX = useTransform(normalizedX, [-1, 1], [-20, 20]);
  const parallaxY = useTransform(normalizedY, [-1, 1], [-20, 20]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#020108]">
      <motion.div style={{ x: parallaxX, y: parallaxY }} className="w-full h-full absolute inset-0">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/10 blur-[150px] mix-blend-screen" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 200, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-900/10 blur-[150px] mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-purple-900/10 blur-[120px] mix-blend-screen" />
        
        {stars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.1, 1, 0.1], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </div>
  );
};



export default function TemplatesPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "Galaxy of Art | Hugo Studio",
    description: "Khám phá vũ trụ nghệ thuật số của Hugo Studio.",
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const isAnimating = useRef(false);

  // Mouse Tracking for Parallax
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const normalizedX = useMotionValue(0); // -1 to 1
  const normalizedY = useMotionValue(0); // -1 to 1

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      normalizedX.set((e.clientX / window.innerWidth) * 2 - 1);
      normalizedY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [mouseX, mouseY, normalizedX, normalizedY]);

  // 3D Tilt based on mouse
  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const smoothX = useSpring(normalizedX, springConfig);
  const smoothY = useSpring(normalizedY, springConfig);
  const rotateX = useTransform(smoothY, [-1, 1], [5, -5]);
  const rotateY = useTransform(smoothX, [-1, 1], [-5, 5]);

  const nextSlide = useCallback(() => {
    if (isAnimating.current || currentSlide >= TOTAL_SLIDES - 1) return;
    isAnimating.current = true;
    setDirection(1);
    setCurrentSlide((prev) => prev + 1);
    setTimeout(() => { isAnimating.current = false; }, 1000);
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (isAnimating.current || currentSlide <= 0) return;
    isAnimating.current = true;
    setDirection(-1);
    setCurrentSlide((prev) => prev - 1);
    setTimeout(() => { isAnimating.current = false; }, 1000);
  }, [currentSlide]);

  // Wheel handling
  const handleWheel = useCallback((e) => {
    // Do not hijack wheel if inside a no-swipe area (like a scrollable preview or iframe container)
    if (e.target.closest('[data-no-swipe]')) return;
    
    e.preventDefault();
    if (isAnimating.current) return;
    const scrollThreshold = 40;
    if (e.deltaY > scrollThreshold && currentSlide < TOTAL_SLIDES - 1) {
      isAnimating.current = true;
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
      setTimeout(() => { isAnimating.current = false; }, 1000);
    } else if (e.deltaY < -scrollThreshold && currentSlide > 0) {
      isAnimating.current = true;
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
      setTimeout(() => { isAnimating.current = false; }, 1000);
    }
  }, [currentSlide]);

  const sliderRef = useRef(null);
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const handleWheelEvent = (e) => handleWheel(e);
    el.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelEvent);
  }, [handleWheel]);

  // Touch handling
  const touchStartY = useRef(null);
  useEffect(() => {
    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (!touchStartY.current || isAnimating.current) return;
      const touchEndY = e.touches[0].clientY;
      const diff = touchStartY.current - touchEndY;
      if (diff > 50 && currentSlide < TOTAL_SLIDES - 1) {
        isAnimating.current = true;
        setDirection(1);
        setCurrentSlide((prev) => prev + 1);
        setTimeout(() => { isAnimating.current = false; }, 1000);
        touchStartY.current = null;
      } else if (diff < -50 && currentSlide > 0) {
        isAnimating.current = true;
        setDirection(-1);
        setCurrentSlide((prev) => prev - 1);
        setTimeout(() => { isAnimating.current = false; }, 1000);
        touchStartY.current = null;
      }
    };
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [currentSlide]);

  const slideVariants = {
    enter: (dir) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 0.8, rotateX: dir > 0 ? 10 : -10, filter: "blur(20px)" }),
    center: { zIndex: 1, y: 0, opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)", transition: { y: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.6 }, scale: { duration: 0.7, ease: "easeOut" }, filter: { duration: 0.5 } } },
    exit: (dir) => ({ zIndex: 0, y: dir < 0 ? "100%" : "-100%", opacity: 0, scale: 0.8, rotateX: dir < 0 ? 10 : -10, filter: "blur(20px)", transition: { y: { type: "spring", stiffness: 200, damping: 25 }, opacity: { duration: 0.6 }, scale: { duration: 0.7, ease: "easeIn" }, filter: { duration: 0.5 } } })
  };

  // ----------------------------------------------------
  // SUB-COMPONENTS FOR SLIDES
  // ----------------------------------------------------
  const Slide0_Hero = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute w-[40vw] h-[40vw] rounded-full border border-white/5 border-dashed pointer-events-none" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute w-[60vw] h-[60vw] rounded-full border border-white/5 border-dotted pointer-events-none" />
      
      <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="inline-flex px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 mb-6 md:mb-8">{t("templatesPage.hero.badge")}</motion.span>
      <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, duration: 1 }} className="font-display text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-tight">
        {t("templatesPage.hero.title1")} <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_50px_rgba(129,140,248,0.5)]">{t("templatesPage.hero.title2")}</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl font-light tracking-wide">{t("templatesPage.hero.desc")}</motion.p>
    </div>
  );

  const Slide1_Logo = () => (
    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center px-4 md:px-20 max-w-7xl mx-auto gap-4 md:gap-8 lg:gap-16 relative">
      <div className="flex-1 space-y-4 md:space-y-6 z-10 text-center lg:text-left mt-8 md:mt-0">
        <div>
          <span className="text-pink-400 font-bold tracking-[0.3em] uppercase text-xs">{t("templatesPage.core.badge")}</span>
          <h2 className="font-display text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{t("templatesPage.core.title1")} <br className="hidden lg:block"/>{t("templatesPage.core.title2")}</h2>
        </div>
        <div className="text-slate-300 text-sm md:text-base font-light leading-relaxed max-w-2xl mx-auto lg:mx-0 space-y-3 md:space-y-4">
          <p>{t("templatesPage.core.desc")}</p>
          <ul className="text-left space-y-2 pl-2 md:pl-4 border-l-2 border-white/10 text-xs md:text-sm">
            <li><b className="text-red-400 font-bold">{t("templatesPage.core.redBold")}</b> {t("templatesPage.core.redText")}</li>
            <li><b className="text-orange-400 font-bold">{t("templatesPage.core.orangeBold")}</b> {t("templatesPage.core.orangeText")}</li>
            <li><b className="text-yellow-400 font-bold">{t("templatesPage.core.yellowBold")}</b> {t("templatesPage.core.yellowText")}</li>
            <li><b className="text-green-400 font-bold">{t("templatesPage.core.greenBold")}</b> {t("templatesPage.core.greenText")}</li>
            <li><b className="text-blue-400 font-bold">{t("templatesPage.core.blueBold")}</b> {t("templatesPage.core.blueText")}</li>
            <li><b className="text-purple-400 font-bold">{t("templatesPage.core.purpleBold")}</b> {t("templatesPage.core.purpleText")}</li>
          </ul>
        </div>
      </div>
      <div className="flex-1 flex justify-center z-10 mt-8 lg:mt-0">
        <motion.div animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-yellow-500 to-blue-500 rounded-full blur-[60px] md:blur-[100px] opacity-20 mix-blend-screen scale-150" />
          <HugoLogo stacked={true} className="text-6xl sm:text-7xl md:text-[6rem] lg:text-[7rem] font-black drop-shadow-[0_0_35px_rgba(255,255,255,0.5)] relative z-10" />
        </motion.div>
      </div>
    </div>
  );

  const Slide2_Typography = () => (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 max-w-6xl mx-auto space-y-4 md:space-y-16">
      <div className="text-center space-y-1 md:space-y-4">
        <span className="text-purple-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">{t("templatesPage.typography.badge")}</span>
        <h2 className="font-display text-2xl md:text-6xl font-black text-white">{t("templatesPage.typography.title")}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-h-[65vh] overflow-y-auto md:overflow-visible custom-scrollbar pb-8 md:pb-0">
        <motion.div whileHover={{ scale: 1.05, rotateY: 5 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-3xl p-4 sm:p-10 space-y-2 sm:space-y-6 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs tracking-widest text-emerald-400 uppercase">Display Font</span>
            <span className="text-2xl sm:text-4xl text-white/20 font-display">Aa</span>
          </div>
          <h3 className="font-display text-3xl sm:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Outfit</h3>
          <p className="font-display text-lg sm:text-2xl text-slate-300">A B C D E F G</p>
          <p className="text-slate-400 font-light text-xs sm:text-base">{t("templatesPage.typography.displayDesc")}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05, rotateY: -5 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-3xl p-4 sm:p-10 space-y-2 sm:space-y-6 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs tracking-widest text-indigo-400 uppercase">Body Font</span>
            <span className="text-2xl sm:text-4xl text-white/20 font-sans">Aa</span>
          </div>
          <h3 className="font-sans text-3xl sm:text-5xl font-normal text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Inter</h3>
          <p className="font-sans text-lg sm:text-2xl text-slate-300 font-light">A B C D E F G</p>
          <p className="text-slate-400 font-light text-xs sm:text-base">{t("templatesPage.typography.bodyDesc")}</p>
        </motion.div>
      </div>
    </div>
  );

  const Slide3_Chibi = () => (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 max-w-7xl mx-auto space-y-4 md:space-y-16 mt-4 md:mt-0">
      <div className="text-center space-y-1 md:space-y-4">
        <span className="text-teal-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">{t("templatesPage.souls.badge")}</span>
        <h2 className="font-display text-2xl md:text-6xl font-black text-white">{t("templatesPage.souls.title")}</h2>
        <p className="text-slate-400 text-xs md:text-base max-w-xl mx-auto hidden sm:block">{t("templatesPage.souls.desc")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-6 w-full px-2 sm:px-0">
        {coreValues.map((val, idx) => (
          <motion.div key={val.id} animate={{ y: [0, -10, 0] }} transition={{ duration: 4, delay: idx * 0.5, repeat: Infinity, ease: "easeInOut" }} className={`relative p-3 sm:p-8 rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl text-center flex flex-col items-center gap-2 sm:gap-6 overflow-hidden group ${val.neon}`}>
            <div className="absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 w-12 h-12 sm:w-28 sm:h-28 bg-white/10 rounded-full p-1.5 sm:p-2 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <img src={val.img} alt={val.title} className="w-full h-full object-contain" />
            </div>
            <div className="relative z-10 space-y-1 sm:space-y-2">
              <h3 className="font-display text-sm sm:text-2xl font-bold text-white drop-shadow-md">{t(`templatesPage.souls.values.${idx}.title`)}</h3>
              <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed hidden sm:block">{t(`templatesPage.souls.values.${idx}.desc`)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const [activeTemplateId, setActiveTemplateId] = useState("photography");
  const renderActivePreview = () => {
    switch (activeTemplateId) {
      case "photography": return <PhotographyDemo isMobile={true} />;
      case "cafe": return <CoffeeDemo isMobile={true} />;
      case "jewelry": return <JewelryDemo isMobile={true} />;
      case "portfolio": return <PortfolioDemo isMobile={true} />;
      case "ecommerce": return <ECommerceDemo isMobile={true} />;
      case "dashboard": return <DashboardDemo isMobile={true} />;
      default: return null;
    }
  };

  const Slide4_Demos = () => (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <style>{`
        .demo-zoom { zoom: 0.6; }
        @media (min-width: 768px) { .demo-zoom { zoom: 0.85; } }
      `}</style>
      <div className="flex flex-col md:flex-row items-center justify-center px-4 max-w-7xl mx-auto gap-3 md:gap-12 relative z-10 min-h-full py-2 md:py-0 mt-2 md:mt-0">
        <div className="w-full md:flex-1 space-y-2 md:space-y-8 md:w-auto">
          <div>
            <span className="text-blue-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">{t("templatesPage.demos.badge")}</span>
            <h2 className="font-display text-2xl md:text-5xl font-black text-white mt-0.5 md:mt-2">{t("templatesPage.demos.title1")}<br className="hidden md:block"/> {t("templatesPage.demos.title2")}</h2>
            <p className="text-slate-400 mt-0.5 md:mt-4 text-[11px] sm:text-xs md:text-base font-light">{t("templatesPage.demos.desc")}</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-2 scrollbar-hide w-full md:flex-col md:overflow-visible">
            {templates.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => setActiveTemplateId(tpl.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-4 p-2 md:p-4 rounded-[0.8rem] md:rounded-2xl border backdrop-blur-md transition-all ${
                  activeTemplateId === tpl.id ? "bg-indigo-500/30 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] md:text-lg">{tpl.icon}</span>
                <div className="text-left hidden md:block">
                  <p className="font-bold text-sm font-display">{t(`templatesPage.demos.templates.${idx}.title`)}</p>
                  <p className="text-[10px]">{t(`templatesPage.demos.templates.${idx}.subtitle`)}</p>
                </div>
                <p className="md:hidden text-[10px] font-bold">{t(`templatesPage.demos.templates.${idx}.short`)}</p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full md:flex-1 flex justify-center items-center relative py-2 md:py-0">
          <motion.div
            className="relative w-[240px] sm:w-[260px] md:w-[350px] h-[480px] sm:h-[520px] md:h-[720px] rounded-[2rem] md:rounded-[3rem] border border-white/20 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden shrink-0"
          >
            {/* Mask Reveal Animation */}
            <motion.div 
              key={activeTemplateId}
              initial={{ clipPath: "circle(0% at 50% 50%)" }}
              animate={{ clipPath: "circle(150% at 50% 50%)" }}
              transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
              className="absolute inset-[6px] md:inset-[10px] rounded-[1.8rem] md:rounded-[2.5rem] bg-zinc-950 overflow-hidden flex flex-col isolation-isolate border border-white/5"
              data-no-swipe="true"
            >
              <div className="w-full bg-zinc-900/80 backdrop-blur-md p-1 md:p-2 flex items-center justify-center gap-1 border-b border-white/10 text-white z-50">
                <span className="material-symbols-outlined text-[8px] md:text-[10px] text-green-400">lock</span>
                <span className="text-[8px] md:text-[10px] font-mono opacity-60">hugo.dev/{activeTemplateId}</span>
              </div>
              <div className="flex-grow overflow-x-hidden overflow-y-auto relative custom-scrollbar origin-top w-full h-full demo-zoom">
                {renderActivePreview()}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );

  const Slide5_Archive = () => (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center px-4 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full py-8 md:py-0">
        <div className="text-center space-y-2 md:space-y-3">
          <span className="text-emerald-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs">{t("templatesPage.archive.badge")}</span>
          <h2 className="font-display text-3xl md:text-5xl font-black text-white">{t("templatesPage.archive.title")}</h2>
          <p className="text-slate-400 font-light text-xs sm:text-sm md:text-base max-w-xl mx-auto">{t("templatesPage.archive.desc")}</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 100, rotateX: 15 }} 
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="w-full max-w-5xl h-[360px] sm:h-[420px] md:h-[65vh] bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col shadow-[0_30px_100px_rgba(16,185,129,0.15)] relative shrink-0"
          data-no-swipe="true"
          style={{ perspective: "1200px" }}
        >
          {/* Glow effect behind the window */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/20 blur-[100px] pointer-events-none" />

          {/* Mac OS Style Header */}
          <div className="px-4 md:px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between z-10 backdrop-blur-md">
            <div className="flex items-center gap-2 w-20">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_10px_rgba(255,95,86,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_10px_rgba(255,189,46,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.5)]" />
            </div>
            <div className="flex-grow flex justify-center">
              <div className="px-4 md:px-8 py-1.5 bg-black/60 border border-white/10 rounded-full text-[10px] md:text-xs font-mono text-emerald-400/90 flex items-center gap-2 shadow-inner">
                <span className="material-symbols-outlined text-[12px] md:text-[14px]">lock</span>
                <span className="truncate max-w-[120px] sm:max-w-none">https://minhoimedia.digital</span>
              </div>
            </div>
            <div className="w-20 flex justify-end">
              <span className="material-symbols-outlined text-white/30 text-lg cursor-pointer hover:text-white/80 transition-colors">more_horiz</span>
            </div>
          </div>


        {/* Iframe container */}
        <div className="flex-grow bg-[#0f172a] relative z-10">
          <iframe src="https://minhoimedia.digital" className="w-full h-full border-none" title="Archive" />
        </div>
      </motion.div>
      </div>
    </div>
  );

  const slides = [Slide0_Hero, Slide1_Logo, Slide2_Typography, Slide3_Chibi, Slide4_Demos, Slide5_Archive];
  const CurrentSlideComponent = slides[currentSlide];

  return (
    <div ref={sliderRef} className="relative w-full h-[90vh] min-h-[600px] bg-[#020108] text-white overflow-hidden font-sans select-none rounded-b-[2rem]" style={{ touchAction: "none", perspective: "1000px" }}>
      <Starfield normalizedX={normalizedX} normalizedY={normalizedY} />

      {/* Galaxy Navigation Indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        {slides.map((_, idx) => (
          <button key={idx} onClick={() => { setDirection(idx > currentSlide ? 1 : -1); setCurrentSlide(idx); }} className="group relative flex items-center justify-center cursor-none">
            <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${idx === currentSlide ? "bg-white border-white scale-150 shadow-[0_0_15px_rgba(255,255,255,0.8)]" : "bg-transparent border-white/30 hover:border-white/80"}`} />
          </button>
        ))}
      </div>

      {/* Main Slider Area with Parallax 3D */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center transform-gpu"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full pt-16 md:pt-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            <CurrentSlideComponent />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
