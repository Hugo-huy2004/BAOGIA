import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { motion } from "framer-motion";
import { useTranslation, Trans } from "react-i18next";
export default function IntroductionPage() {
  const { data } = useData();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  useHeadMeta({
    title: "Về Tôi | Peter Hugo Wishpax Lê",
    description: "Khám phá thế giới sáng tạo, hành trình sự nghiệp và các dự án thiết kế Claymorphism tinh tế của Hugo Lê.",
    keywords: "Peter Hugo Wishpax Lê, Hugo Lê, Greenwich VN, thiết kế Claymorphism, web developer, portfolio",
    canonicalUrl: "https://www.hugowishpax.studio/introduction"
  });

  const [activeIndex, setActiveIndex] = useState(0);

  // Avatar rotation list
  const avatarImages = [
    "/image/avt1.png",
    "/image/avt2.png",
    "/image/avt3.png",
    "/image/avt4.png"
  ];
  const [currentAvtIndex, setCurrentAvtIndex] = useState(0);
  const [avtFade, setAvtFade] = useState(true);

  // Rotate avatar every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setAvtFade(false);
      setTimeout(() => {
        setCurrentAvtIndex((prevIndex) => (prevIndex + 1) % avatarImages.length);
        setAvtFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle scroll snap index detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    if (clientHeight <= 0) return;
    const index = Math.round(scrollTop / clientHeight);
    setActiveIndex(index);
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
    } catch (e) {
      // Ignore audio context errors if user hasn't interacted
    }
  };

  const scrollToSlide = (idx) => {
    playTick();
    if (!containerRef.current) return;
    const clientHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: idx * clientHeight,
      behavior: "smooth"
    });
    setActiveIndex(idx);
  };

  if (!data) return null;

  const realPhoto = optimizeCloudinaryUrl(data.gallery?.[0]?.url || "/image/avt1.png", 800);

  // Dynamic colors for transition bg glows
  const bgGlows = [
    "from-indigo-500/10 to-purple-500/10",  // 0 Welcome
    "from-cyan-500/10 to-indigo-500/10",    // 1 Web Dev
    "from-amber-500/10 to-orange-500/10",   // 2 Personal Info
    "from-fuchsia-500/10 to-pink-500/10",    // 3 Teammate Info
    "from-emerald-500/10 to-teal-500/10",    // 4 Bio Edu
    "from-blue-500/10 to-indigo-500/10",     // 5 Web Service
    "from-green-500/10 to-emerald-500/10",   // 6 Ferns (new)
    "from-violet-500/10 to-pink-500/10",    // 7 Philosophy
    "from-rose-500/10 to-orange-500/10",    // 8 Contacts
    "from-indigo-500/10 to-emerald-500/10"  // 9 CTA Start
  ];

  return (
    <div className="relative w-full h-[calc(100vh-56px)] overflow-hidden">
      
      {/* Hide default browser scrollbar CSS injection */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Slide Indicators - Fixed on Right */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => (
          <button
            key={idx}
            onClick={() => scrollToSlide(idx)}
            className="group flex items-center justify-end gap-3 text-right focus:outline-none"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold tracking-widest text-[#6366f1] dark:text-[#a5b4fc] uppercase">
              {idx === 0 && t("intro.nav.welcome")}
              {idx === 1 && t("intro.nav.webDev")}
              {idx === 2 && t("intro.nav.personalInfo")}
              {idx === 3 && t("intro.nav.teammateInfo")}
              {idx === 4 && t("intro.nav.bioEdu")}
              {idx === 5 && t("intro.nav.webService")}
              {idx === 6 && t("intro.nav.hobbies")}
              {idx === 7 && t("intro.nav.philosophy")}
              {idx === 8 && t("intro.nav.contacts")}
              {idx === 9 && t("intro.nav.start")}
            </span>
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                activeIndex === idx
                  ? "bg-[#6366f1] border-[#6366f1] scale-125 shadow-lg shadow-[#6366f1]/30"
                  : "border-slate-400/50 bg-transparent hover:border-[#6366f1]"
              }`}
            />
          </button>
        ))}
      </div>

      {/* --- DYNAMIC TRANSITION BACKGROUND GLOWS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr ${bgGlows[activeIndex]} blur-[150px] transition-all duration-1000 ease-in-out`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr ${bgGlows[(activeIndex + 1) % 10]} blur-[170px] transition-all duration-1000 ease-in-out`} />
      </div>

      {/* --- SCROLL SNAP CONTAINER --- */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar text-slate-800 dark:text-slate-100 relative z-10"
      >
        
        {/* SLIDE 1: Welcome Section */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24 pt-6 pb-20 md:py-0">
          {/* Background Watermark */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute left-[-10%] top-[10%] md:left-[5%] md:bottom-[10%] md:top-auto text-[8rem] md:text-[12rem] xl:text-[15rem] font-black text-slate-900/[0.03] dark:text-white/[0.02] pointer-events-none select-none tracking-tighter leading-none transform -rotate-12 md:rotate-0"
          >
            CREATIVE
          </motion.div>

          {/* Floating animated orbs for premium aesthetic */}
          <motion.div 
            animate={{ 
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] md:top-[20%] right-[5%] md:right-[15%] w-24 h-24 md:w-32 md:h-32 bg-[#fbbf24]/30 rounded-full blur-[40px] md:blur-[60px] pointer-events-none"
          />
          <motion.div 
            animate={{ 
              y: [0, 40, 0],
              x: [0, -30, 0],
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[15%] md:bottom-[25%] left-[5%] md:left-[25%] w-32 h-32 md:w-48 md:h-48 bg-[#6366f1]/30 rounded-full blur-[50px] md:blur-[80px] pointer-events-none"
          />

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 w-full max-w-7xl mx-auto items-center relative z-10 h-full justify-center">
            
            {/* TEXT CONTENT - Centered on Mobile, Left on Desktop */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-5 md:space-y-6 text-center lg:text-left mt-8 md:mt-0 order-1 lg:order-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex justify-center lg:justify-start"
              >
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#6366f1]/20 to-[#0ea5e9]/20 text-[#6366f1] dark:text-[#a5b4fc] border border-[#6366f1]/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  {t("intro.slide1.badge")}
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white"
              >
                {t("intro.slide1.title1")} <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#6366f1] via-[#0ea5e9] to-[#fbbf24] bg-clip-text text-transparent animate-gradientShift">
                  {t("intro.slide1.title2")}
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="text-[13px] sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed mx-auto lg:mx-0 px-2 sm:px-0"
              >
                <Trans i18nKey="intro.slide1.desc" values={{ name: data.profile.fullName }}>
                  Chào mừng bạn đến với không gian sáng tạo của <strong className="text-[#6366f1] dark:text-[#a5b4fc] font-bold">{{name: data.profile.fullName}}</strong>. Nơi tôi kết hợp tính nghệ thuật tinh tế và sức mạnh kỹ thuật để tạo ra những sản phẩm số đẳng cấp.
                </Trans>
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 md:pt-4 justify-center lg:justify-start px-4 sm:px-0"
              >
                <button 
                  onClick={() => scrollToSlide(1)}
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 text-xs sm:text-sm"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#6366f1] to-[#0ea5e9] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    {t("intro.slide1.explore")}
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </span>
                </button>
                <Link to="/booking" className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold hover:border-[#6366f1] hover:text-[#6366f1] dark:hover:border-white/30 transition-all duration-300 bg-white/50 dark:bg-transparent backdrop-blur-sm text-xs sm:text-sm">
                  {t("intro.slide1.book")}
                </Link>
              </motion.div>
            </div>
            
            {/* AVATAR SECTION - More prominent on mobile */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="w-full lg:col-span-5 flex justify-center relative mt-6 mb-4 md:mt-0 order-2 lg:order-none scale-[1.05] md:scale-100"
            >
              <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#0ea5e9]/30 blur-[50px] lg:blur-[100px] animate-pulse-soft" />
              
              {/* Spinning geometric rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -top-3 -left-3 sm:-top-6 sm:-left-6 w-[250px] h-[250px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] lg:w-[520px] lg:h-[520px] rounded-full border border-dashed border-slate-300 dark:border-white/10 pointer-events-none" 
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute top-2 left-2 sm:top-4 sm:left-4 w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px] lg:w-[420px] lg:h-[420px] rounded-full border border-slate-200 dark:border-[#6366f1]/20 pointer-events-none" 
              />

              {/* Floating Tech Badges - Specifically added for mobile pop */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-2 top-8 md:-left-8 md:top-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 md:p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-30"
              >
                <div className="text-[#0ea5e9] font-bold text-[8px] md:text-[10px] tracking-widest flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-lg md:text-xl">code</span>
                  <span>REACT</span>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-2 top-10 md:-right-4 md:top-24 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 md:p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-30"
              >
                <div className="text-[#ec4899] font-bold text-[8px] md:text-[10px] tracking-widest flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-lg md:text-xl">draw</span>
                  <span>DESIGN</span>
                </div>
              </motion.div>
              
              {/* Main Avatar Container - Squircle on mobile, Circle on desktop */}
              <div className="relative w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[340px] md:h-[340px] lg:w-[480px] lg:h-[480px] rounded-[3rem] sm:rounded-[4rem] md:rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-3xl border border-white/60 dark:border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden group z-20">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/20 via-transparent to-[#fbbf24]/20" />
                
                {/* Floating animation for avatar */}
                <motion.img
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  src={avatarImages[currentAvtIndex]}
                  alt={data.profile.fullName}
                  className={`relative z-10 w-[90%] h-[90%] md:w-[85%] md:h-[85%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)] md:hover:scale-110 transition-all duration-500 ${
                    avtFade ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                />
              </div>

              {/* Enhanced floating badge */}
              <motion.div 
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-[-10px] sm:bottom-0 right-4 lg:bottom-8 lg:right-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 backdrop-blur-xl px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-2xl z-30 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 transform rotate-[-2deg]"
              >
                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
                </span>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{t("intro.slide1.available")}</span>
              </motion.div>
            </motion.div>
            
          </div>
          
          {/* Scroll Down Indicator - Mobile Only */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:hidden"
          >
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("intro.slide1.scrollDown")}</span>
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="material-symbols-outlined text-slate-400 text-lg">keyboard_arrow_down</span>
            </motion.div>
          </motion.div>
        </section>

        {/* SLIDE 2: Introduction to Web Development (Giới thiệu ngành lập trình Web) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          {/* Background Watermark */}
          <div className="absolute right-[5%] top-[10%] text-[12rem] xl:text-[15rem] font-black text-slate-900/[0.02] dark:text-white/[0.01] pointer-events-none select-none tracking-tighter leading-none">
            DEV
          </div>

          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 md:space-y-6 text-left relative z-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/25">
                  {t("intro.slide2.badge")}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {t("intro.slide2.title1")} <br />
                  <span className="bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] bg-clip-text text-transparent">
                    {t("intro.slide2.title2")}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {t("intro.slide2.desc")}
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => scrollToSlide(2)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0ea5e9] text-white font-bold text-xs shadow-lg shadow-[#0ea5e9]/20 hover:scale-[1.03] transition-transform"
                  >
                    {t("intro.slide2.viewProfile")} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Overlapping Coding Window and Accent Card - visible on all sizes */}
              <div className="w-full flex lg:col-span-5 justify-center relative mt-2 sm:mt-4 md:mt-6 lg:mt-0">
                {/* Back Underlapping Card */}
                <div className="absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 w-32 h-32 sm:w-48 sm:h-48 rounded-[2rem] bg-gradient-to-tr from-[#6366f1]/20 to-transparent border border-slate-200/20 dark:border-white/5 pointer-events-none transform -rotate-6" />

                {/* VS Code Mockup */}
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-[420px] rounded-xl sm:rounded-[2rem] bg-slate-950 dark:bg-black/80 border border-slate-800 dark:border-white/10 p-3 sm:p-6 sm:p-8 shadow-2xl space-y-3 sm:space-y-4 font-mono text-[9px] sm:text-[11px] md:text-xs leading-relaxed text-slate-300 relative z-10">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500/80" />
                      <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                      <span className="w-2 h-2 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-500">App.jsx</span>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-emerald-400">"react"</span>;</p>
                    <p><span className="text-purple-400">import</span> &#123; <span className="text-blue-400">CreativePortal</span> &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">"./hugo"</span>;</p>
                    <br />
                    <p><span className="text-blue-400">export default function</span> <span className="text-yellow-400">Portfolio</span>() &#123;</p>
                    <p className="pl-4"><span className="text-purple-400">return</span> (</p>
                    <p className="pl-8 text-slate-500">&lt;<span className="text-blue-400">CreativePortal</span></p>
                    <p className="pl-12"><span className="text-purple-400">aesthetics</span>=<span className="text-emerald-450">"Glassmorphism"</span></p>
                    <p className="pl-12"><span className="text-purple-400">speed</span>=<span className="text-emerald-450">"100ms"</span></p>
                    <p className="pl-12"><span className="text-purple-400">heart</span>=&#123;<span className="text-blue-400">true</span>&#125;</p>
                    <p className="pl-8 text-slate-500">/&gt;</p>
                    <p className="pl-4">);</p>
                    <p>&#125;</p>
                  </div>
                </div>

                {/* Front Overlapping floating pill */}
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-[#6366f1] text-white text-[8px] sm:text-[9px] font-black tracking-widest uppercase px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg z-20 transform rotate-6">
                  React + Vite
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 3: Personal Information (Overlapping asymmetric stacks) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          {/* Background Watermark */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute left-[5%] top-[10%] text-[7rem] sm:text-[10rem] xl:text-[12rem] font-black text-slate-900/[0.03] dark:text-white/[0.015] pointer-events-none select-none tracking-tighter leading-none transform -rotate-6 md:rotate-0"
          >
            EST. 2004
          </motion.div>

          {/* Floating animated orbs for premium aesthetic */}
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[10%] w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-[40px] pointer-events-none"
          />

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 w-full max-w-7xl mx-auto items-center">
            {/* Mobile Portrait - visible on small/medium screens */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6 }}
              className="w-full flex lg:hidden justify-center relative z-10"
            >
              <div className="w-[70%] max-w-[240px] relative group mt-6 mb-2">
                {/* Back shadow for depth */}
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 rounded-sm blur-xl transform translate-y-3"></div>
                
                {/* Polaroid Frame */}
                <motion.div 
                  whileTap={{ scale: 0.98, rotate: 0 }}
                  className="relative bg-white dark:bg-[#f8f9fa] p-2.5 sm:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transform rotate-[-3deg] hover:rotate-[1deg] transition-all duration-500 origin-bottom flex flex-col"
                >
                  {/* Tape on top */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/40 dark:bg-white/20 backdrop-blur-sm border border-white/50 shadow-sm transform -rotate-2 z-20" />
                  
                  {/* Photo Area */}
                  <div className="aspect-[4/5] w-full bg-slate-200 overflow-hidden relative shadow-inner shrink-0">
                    <img loading="lazy" 
                      src={realPhoto} 
                      alt="Hugo Portrait" 
                      className="absolute inset-0 w-full h-full object-cover filter contrast-110 saturate-[0.9]" 
                    />
                    {/* Vintage photo overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#facc15]/10 via-transparent to-[#6366f1]/10 mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none" />
                  </div>
                  
                  {/* Handwritten Text Area */}
                  <div className="w-full h-14 sm:h-16 flex flex-col items-center justify-center shrink-0">
                    <span className="font-display text-lg sm:text-xl font-bold text-slate-800 transform -rotate-2 opacity-90 drop-shadow-sm">
                      Peter Hugo W. Lê
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5 transform rotate-1">
                      Est. 2004
                    </span>
                  </div>
                </motion.div>
                
                {/* Secondary polaroid stacked behind */}
                <div className="absolute inset-0 bg-slate-100 dark:bg-[#e2e8f0] p-2.5 shadow-lg transform rotate-[4deg] translate-x-2 translate-y-2 -z-10 flex items-center justify-center">
                   <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-400 opacity-50"></div>
                </div>
              </div>
            </motion.div>

            {/* Left: Asymmetric Stacked Portrait - hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:col-span-5 justify-center relative">
              {/* Stacked background frame */}
              <motion.div 
                initial={{ opacity: 0, rotate: 0 }}
                whileInView={{ opacity: 1, rotate: 2 }}
                transition={{ duration: 0.8 }}
                className="absolute w-[420px] h-[280px] rounded-[2.5rem] bg-[#6366f1]/10 dark:bg-[#1f1b2e]/80 border border-slate-200/50 dark:border-white/10 transform translate-x-4 translate-y-4 shadow-xl" 
              />

              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-[420px] rounded-[2.5rem] bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/80 dark:border-white/20 p-5 shadow-2xl hover:shadow-[0_25px_50px_rgba(99,102,241,0.3)] transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 relative z-10 group overflow-hidden"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-inner">
                  <img loading="lazy" 
                    src={realPhoto} 
                    alt="Hugo Portrait" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </div>
                </div>
                <div className="pt-5 text-center space-y-2 relative z-10">
                  <span className="font-display text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">Peter Hugo Wishpax Lê</span>
                  <p className="text-xs text-[#6366f1] font-bold uppercase tracking-[0.2em] bg-[#6366f1]/10 inline-block px-3 py-1 rounded-lg">Software Engineering Student</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Personal Credentials Info overlapping background */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4 md:space-y-6 relative z-10 w-full text-center lg:text-left mt-2 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center lg:justify-start"
              >
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 text-[#d97706] dark:text-[#fbbf24] border border-[#fbbf24]/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                  {t("intro.slide3.badge")}
                </span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight hidden lg:block"
              >
                {t("intro.slide3.title1")} <br className="hidden sm:inline lg:hidden"/> {t("intro.slide3.title2")}
              </motion.h2>
              
              <div className="space-y-4 sm:space-y-5 lg:space-y-6 mt-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 lg:border-b lg:border-[#6366f1]/10 lg:pb-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="material-symbols-outlined text-[#0ea5e9] text-xl sm:text-2xl">school</span>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 w-full">
                    <div className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-widest text-center sm:text-left pt-1">{t("intro.slide3.eduTitle")}</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 w-full px-2 sm:px-0">
                      {/* High school card */}
                      <motion.a 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href="https://ndc.edu.vn" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 sm:p-4 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/80 dark:border-white/10 hover:border-[#6366f1] transition-all group space-y-1 block text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] sm:text-xs font-black text-[#6366f1] uppercase tracking-wider leading-tight">{t("intro.slide3.highSchool")}</span>
                          <span className="material-symbols-outlined text-sm sm:text-base text-slate-400 group-hover:text-[#6366f1] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 bg-slate-100 dark:bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center">open_in_new</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t("intro.slide3.highSchoolDesc")}</p>
                      </motion.a>

                      {/* University card */}
                      <motion.a 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href="https://greenwich.edu.vn" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 sm:p-4 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/80 dark:border-white/10 hover:border-[#0ea5e9] transition-all group space-y-1 block text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] sm:text-xs font-black text-[#0ea5e9] uppercase tracking-wider leading-tight">{t("intro.slide3.uni")}</span>
                          <span className="material-symbols-outlined text-sm sm:text-base text-slate-400 group-hover:text-[#0ea5e9] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 bg-slate-100 dark:bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center">open_in_new</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t("intro.slide3.uniDesc")}</p>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 4: Teammate Information (Modern ID Badge & Floating Cards Layout) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 py-8 md:py-0 md:px-16 lg:px-24">
          {/* Background Watermark */}
          <div className="absolute right-[5%] bottom-[5%] text-[6rem] sm:text-[10rem] xl:text-[14rem] font-black text-slate-900/[0.015] dark:text-white/[0.007] pointer-events-none select-none tracking-tighter leading-none">
            JASON
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-8 w-full max-w-7xl mx-auto items-center relative z-10">
            
            {/* Left side: Premium Digital Badge Card */}
            <div className="w-full lg:col-span-5 flex justify-center relative">
              {/* Pulsing neon back glow */}
              <div className="absolute inset-0 w-full max-w-[280px] sm:max-w-[320px] h-full mx-auto rounded-2xl bg-gradient-to-tr from-[#ec4899]/15 to-[#d946ef]/15 blur-xl lg:blur-2xl animate-pulse" />
              
              {/* Single Unified Digital ID Card Container (Reduced rounded corners) */}
              <div className="w-full max-w-[280px] sm:max-w-[320px] rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 p-3.5 sm:p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 z-10">
                {/* ID Header Decoration */}
                <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-slate-200 dark:border-white/10 mb-3 sm:mb-4">
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-[#ec4899] uppercase">{t("intro.slide4.idTitle")}</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#ec4899]" />
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#d946ef]" />
                  </div>
                </div>

                {/* Portrait Container - aspect-[4/3] on mobile (to keep height low but image wide), aspect-[4/5] on desktop (Reduced rounded corners) */}
                <div className="aspect-[4/3] lg:aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative border border-slate-200/50 dark:border-white/5">
                  <img loading="lazy" 
                    src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779259064/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-20_lu%CC%81c_13.37.35_kfmbw3.png", 600)} 
                    alt="Jason Portrait" 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" 
                  />
                  {/* Digital Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Status indicator on photo */}
                  <div className="absolute bottom-2.5 left-2.5 bg-[#ec4899] text-white text-[7px] sm:text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md">
                    EST. 2005
                  </div>
                </div>

                {/* ID Info Section */}
                <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3 text-center">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">Jason Phan</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5 sm:mt-1">Software Engineering Student</p>
                  </div>
                  
                  {/* Decorative Scan/Chip/Details */}
                  <div className="pt-2.5 sm:pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[7px] sm:text-[8px] font-mono text-slate-400 text-left">
                    <div>
                      <div>CLASS: SE-GP</div>
                      <div>ALLIANCE: TEAMMATE</div>
                    </div>
                    {/* Simulated barcode */}
                    <div className="h-5 sm:h-6 flex items-center gap-0.5 opacity-60">
                      <div className="w-[1px] h-full bg-slate-400" />
                      <div className="w-[2px] h-full bg-slate-400" />
                      <div className="w-[1px] h-full bg-slate-400" />
                      <div className="w-[3px] h-full bg-slate-400" />
                      <div className="w-[1px] h-full bg-slate-400" />
                      <div className="w-[2px] h-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Modern Cards & Strengths */}
            <div className="w-full lg:col-span-7 space-y-4 lg:space-y-6 text-left">
              <div className="space-y-2 lg:space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.25em] bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20">
                  {t("intro.slide4.badge")}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {t("intro.slide4.title1")} <br />
                  <span className="bg-gradient-to-r from-[#ec4899] via-[#d946ef] to-[#818cf8] bg-clip-text text-transparent">
                    {t("intro.slide4.title2")}
                  </span>
                </h2>
                <p className="hidden sm:block text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {t("intro.slide4.desc")}
                </p>
              </div>

              {/* Education Floating Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 pt-1 lg:pt-2">
                
                {/* High School Card (Reduced rounded corners) */}
                <a 
                  href="https://thptcayduong.edu.vn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group p-3.5 lg:p-5 rounded-lg lg:rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 hover:border-[#ec4899] dark:hover:border-[#ec4899]/50 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg flex flex-col justify-between h-full"
                >
                  <div className="space-y-2 lg:space-y-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-md lg:rounded-lg bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">school</span>
                    </div>
                    <div>
                      <h4 className="font-display text-xs lg:text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#ec4899] transition-colors">{t("intro.slide4.highSchool")}</h4>
                      <p className="text-[10px] lg:text-[11px] text-slate-400 mt-0.5 lg:mt-1 leading-relaxed">{t("intro.slide4.highSchoolDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 lg:pt-4 mt-2.5 lg:mt-4 border-t border-slate-200/50 dark:border-white/5 text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{t("intro.slide4.highSchoolProvince")}</span>
                    <span className="material-symbols-outlined text-[10px] group-hover:translate-x-1 transition-transform">open_in_new</span>
                  </div>
                </a>

                {/* University Card (Reduced rounded corners) */}
                <a 
                  href="https://greenwich.edu.vn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group p-3.5 lg:p-5 rounded-lg lg:rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 hover:border-[#d946ef] dark:hover:border-[#d946ef]/50 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg flex flex-col justify-between h-full"
                >
                  <div className="space-y-2 lg:space-y-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-md lg:rounded-lg bg-[#d946ef]/10 text-[#d946ef] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-lg">local_library</span>
                    </div>
                    <div>
                      <h4 className="font-display text-xs lg:text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#d946ef] transition-colors">{t("intro.slide4.uniTitle")}</h4>
                      <p className="text-[10px] lg:text-[11px] text-slate-400 mt-0.5 lg:mt-1 leading-relaxed">{t("intro.slide4.uniDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 lg:pt-4 mt-2.5 lg:mt-4 border-t border-slate-200/50 dark:border-white/5 text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>{t("intro.slide4.uniTag")}</span>
                    <span className="material-symbols-outlined text-[10px] group-hover:translate-x-1 transition-transform">open_in_new</span>
                  </div>
                </a>

              </div>
            </div>

          </div>
        </section>

        {/* SLIDE 5: Free Bio with Edu Mail (Overlapping Student Cards) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center">
            <div className="md:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
                {t("intro.slide5.badge")}
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t("intro.slide5.title1")} <br />
                {t("intro.slide5.title2")}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                <Trans i18nKey="intro.slide5.desc">
                  Tôi mong muốn hỗ trợ tối đa cho học sinh, sinh viên trong việc xây dựng thương hiệu cá nhân số. Mỗi tài khoản đăng ký sử dụng email giáo dục có chứa hậu tố <strong className="text-[#6366f1] dark:text-[#a5b4fc]">.edu</strong> sẽ được tự động kích hoạt tạo 1 trang Bio tùy chỉnh hoàn toàn miễn phí.
                </Trans>
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>{t("intro.slide5.check1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>{t("intro.slide5.check2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>{t("intro.slide5.check3")}</span>
                </div>
              </div>
              <div className="pt-2">
                <Link to="/login" className="px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold text-xs shadow-lg shadow-[#6366f1]/20 hover:scale-[1.03] transition-transform inline-block">
                  {t("intro.slide5.createBtn")}
                </Link>
              </div>
            </div>
            
            {/* Overlapping Stacks of Student Cards - hidden on mobile, visible md+ */}
            <div className="hidden md:flex md:col-span-5 justify-end relative">
              {/* Back Card */}
              <div className="absolute top-4 left-4 w-full max-w-[360px] h-[240px] rounded-[2.5rem] bg-gradient-to-tr from-[#6366f1]/20 to-transparent border border-[#6366f1]/20 p-8 shadow-lg transform rotate-[-4deg] pointer-events-none" />

              {/* Front ID Card */}
              <div className="w-full max-w-[360px] rounded-[2.5rem] bg-gradient-to-b from-white/95 to-white/40 dark:from-slate-900/95 dark:to-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-white/10 p-6 lg:p-8 shadow-2xl relative z-10 transform rotate-[2deg] hover:rotate-0 transition-transform duration-500 group overflow-hidden">
                {/* Holographic light reflect pattern */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-white/5 pb-4">
                  <div>
                    <span className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest block">{t("intro.slide5.idTitle")}</span>
                    <span className="font-display text-sm font-black text-slate-800 dark:text-white">{t("intro.slide5.idName")}</span>
                  </div>
                  {/* Metallic smart card chip */}
                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 shadow border border-yellow-600/30 flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-3 gap-0.5 w-[80%] h-[80%] opacity-40">
                      {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="border border-yellow-800/40" />)}
                    </div>
                  </div>
                </div>

                <div className="py-6 space-y-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("intro.slide5.idEmailTitle")}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">name@school.edu.vn</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("intro.slide5.idBenefitTitle")}</span>
                    <span className="font-bold text-[#10b981]">{t("intro.slide5.idBenefitDesc")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("intro.slide5.idValidityTitle")}</span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{t("intro.slide5.idValidityDesc")}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400">{t("intro.slide5.idAuth")}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">ID: 2004-EDU-VALID</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 5: Web Development Services (Giới thiệu dịch vụ làm web của tôi, visual browser) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center">

            {/* Left: Interactive Browser Mockup of Service Prices - hidden on mobile, visible md+ */}
            <div className="hidden md:flex md:col-span-5 justify-center relative">
              {/* Backglow sphere */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#0ea5e9]/10 blur-3xl" />

              {/* Visual mockup of the pricing sheet in a beautiful browser shell */}
              <div className="w-full max-w-[420px] rounded-[2rem] bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative z-10 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Browser Header Bar */}
                <div className="bg-slate-100 dark:bg-slate-900 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="text-[10px] bg-slate-200 dark:bg-white/5 text-slate-500 px-4 py-0.5 rounded-md font-mono select-none">
                    hugo.dev/services
                  </div>
                  <span className="material-symbols-outlined text-xs text-slate-400">refresh</span>
                </div>

                {/* Browser Content */}
                <div className="p-6 space-y-4">
                  <span className="text-[9px] font-extrabold text-[#0ea5e9] uppercase tracking-wider block">{t("intro.slide6.serviceOption")}</span>
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">{t("intro.slide6.item1Title")}</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t("intro.slide6.item1Desc")}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2.5 py-1 rounded-full shrink-0">Pro</span>
                    </div>
                    {/* Item 2 */}
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">{t("intro.slide6.item2Title")}</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t("intro.slide6.item2Desc")}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 px-2.5 py-1 rounded-full shrink-0">Apex</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column details */}
            <div className="md:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/25">
                {t("intro.slide6.badge")}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t("intro.slide6.title1")} <br />
                {t("intro.slide6.title2")}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("intro.slide6.desc")}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    playTick();
                    navigate("/services");
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold text-xs shadow-lg shadow-[#6366f1]/20 hover:scale-[1.03] transition-transform"
                >
                  {t("intro.slide6.pricingBtn")}
                </button>
                <Link to="/booking" className="inline-flex items-center justify-center px-6 py-4 rounded-full border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {t("intro.slide6.bookBtn")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 6: Personal Hobby (Sở thích cá nhân - Dương xỉ) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          {/* RAIN EFFECT BACKGROUND */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-50">
            {[...Array(30)].map((_, i) => (
              <div 
                key={`rain-${i}`}
                className="absolute w-[1px] h-[80px] bg-gradient-to-b from-transparent via-emerald-200 to-transparent animate-rain-drop"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20 + 10}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 0.5 + 0.5}s`
                }}
              />
            ))}
          </div>

          {/* Background Watermark */}
          <div className="absolute right-[5%] top-[10%] text-[8rem] xl:text-[12rem] font-black text-slate-900/[0.02] dark:text-white/[0.01] pointer-events-none select-none tracking-tighter leading-none">
            FERNS
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center relative z-10">
            {/* Left side text */}
            <div className="lg:col-span-5 space-y-4 lg:space-y-6 text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                {t("intro.slide7.badge")}
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t("intro.slide7.title1")} <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  {t("intro.slide7.title2")}
                </span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t("intro.slide7.desc")}
              </p>
            </div>
            
            {/* Right side Images with floating animation */}
            <div className="lg:col-span-7 flex justify-center relative h-[320px] sm:h-[400px] lg:h-[500px] w-full mt-4 lg:mt-0">
              {/* Backglow sphere */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/20 blur-[80px]" />
              
              {/* Main Large Image (Water Drop Shape) */}
              <div 
                className="absolute top-1/2 left-1/2 z-10 hover:scale-105 transition-transform duration-700"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <div 
                  className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[340px] lg:h-[340px] bg-slate-200 dark:bg-slate-800/50 overflow-hidden shadow-2xl relative"
                  style={{ 
                    borderRadius: '50% 0 50% 50%', 
                    transform: 'rotate(-45deg)',
                    border: '4px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <img loading="lazy" 
                    src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443455/IMG_6573_rrrbpn.heic", 800)} 
                    alt="Main Fern" 
                    className="w-[145%] h-[145%] max-w-none object-cover absolute top-1/2 left-1/2" 
                    style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}
                  />
                  <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />
                </div>
              </div>
              
              {/* Ripple Effect Under Main Drop */}
              <div className="absolute top-[85%] sm:top-[85%] lg:top-[90%] left-1/2 -translate-x-1/2 z-0 pointer-events-none">
                <div className="absolute w-[80px] sm:w-[120px] lg:w-[160px] h-[20px] sm:h-[30px] lg:h-[40px] border border-emerald-400 rounded-full animate-ripple-splash" style={{ animationDelay: '0s' }} />
                <div className="absolute w-[80px] sm:w-[120px] lg:w-[160px] h-[20px] sm:h-[30px] lg:h-[40px] border border-emerald-300 rounded-full animate-ripple-splash" style={{ animationDelay: '0.8s' }} />
                <div className="absolute w-[80px] sm:w-[120px] lg:w-[160px] h-[20px] sm:h-[30px] lg:h-[40px] border border-emerald-200 rounded-full animate-ripple-splash" style={{ animationDelay: '1.6s' }} />
              </div>

              {/* Small Image 1 (Floating top left, overlapping) */}
              <div className="absolute top-[10%] sm:top-[12%] lg:top-[15%] left-[10%] sm:left-[20%] lg:left-[22%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-slate-200 dark:bg-slate-800/50 border-[3px] border-white/80 dark:border-white/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden z-20 animate-float" style={{ animationDelay: '0.5s' }}>
                <img loading="lazy" src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443454/IMG_6575_ko0sly.heic", 400)} alt="Fern Details" className="w-full h-full object-cover mix-blend-normal" />
                <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
              </div>
              
              {/* Small Image 2 (Floating bottom right, overlapping) */}
              <div className="absolute bottom-[10%] sm:bottom-[15%] lg:bottom-[20%] right-[10%] sm:right-[20%] lg:right-[22%] w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] rounded-full bg-slate-200 dark:bg-slate-800/50 border-[3px] border-white/80 dark:border-white/20 shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <img loading="lazy" src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443454/IMG_6574_rwhajd.heic", 400)} alt="Fern Decor" className="w-full h-full object-cover mix-blend-normal" />
                <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 7: Philosophy & Experience (Overlapping Typography quotes) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center relative z-10">
            {/* Left: philosophy quotes overlapping watermarks */}
            <div className="md:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6 relative">
              
              {/* Massive overlapping quote watermarks */}
              <span className="absolute -top-12 -left-10 text-[8rem] sm:text-[10rem] font-serif text-[#6366f1]/10 pointer-events-none select-none">“</span>
              
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25 relative z-10">
                {t("intro.slide8.badge")}
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white relative z-10">
                {t("intro.slide8.title1")} <br />
                {t("intro.slide8.title2")}
              </h2>
              
              <blockquote className="text-lg sm:text-2xl lg:text-4xl italic font-semibold text-[#6366f1] dark:text-[#a5b4fc] border-l-4 border-[#6366f1] pl-4 sm:pl-6 py-1 relative z-10 leading-snug">
                {t("intro.slide8.quote")}
              </blockquote>

              <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-1 sm:pt-2 text-xs sm:text-sm relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-sm text-[#6366f1]">magic_button</span>
                    <span>{t("intro.slide8.wowTitle")}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("intro.slide8.wowDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-sm text-[#0ea5e9]">fit_screen</span>
                    <span>{t("intro.slide8.sweetTitle")}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("intro.slide8.sweetDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Asymmetric Principle Card - hidden on mobile, visible md+ */}
            <div className="hidden md:flex md:col-span-5 justify-end relative">
              {/* Background accent ring */}
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full border border-slate-200/50 dark:border-white/5 pointer-events-none" />

              <div className="w-full max-w-[420px] rounded-[2.5rem] bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 p-6 lg:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden transform rotate-[1.5deg]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-xl" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t("intro.slide8.principles")}</span>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#6366f1] font-mono">01</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{t("intro.slide8.p1")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#0ea5e9] font-mono">02</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{t("intro.slide8.p2")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#fbbf24] font-mono">03</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{t("intro.slide8.p3")}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-[#fbbf24]">volunteer_activism</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 8: Social Links (Liên kết của tôi, overlapping icons) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-10 lg:space-y-12 relative z-10">
            {/* Profile Header with Avatar */}
            <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 max-w-2xl mx-auto">
              <div className="flex justify-center mb-2 md:mb-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#6366f1]/30 shadow-lg">
                  <img loading="lazy" 
                    src={optimizeCloudinaryUrl(data.profile.avatarUrl, 300)} 
                    alt={data.profile.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  {data.profile.fullName}
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {data.profile.education}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
                {t("intro.slide9.badge")}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
                {t("intro.slide9.title")}
              </h2>
              <p className="text-[11px] sm:text-xs lg:text-base text-slate-500 dark:text-slate-400 hidden sm:block">
                {t("intro.slide9.desc")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto pt-4 relative">
              {/* Asymmetric offset overlapping decorative panel */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/5 to-transparent rounded-[3rem] -rotate-1 pointer-events-none hidden md:block" />

              {/* Zalo */}
              <a 
                href={`https://zalo.me/${data.profile.zaloNumber}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="clay-card rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-1.5 md:gap-3 text-center hover:scale-[1.05] hover:rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-10 md:w-14 h-10 md:h-14 rounded-xl md:rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-[#6366f1] dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">sms</span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-slate-800 dark:text-white">{t("intro.slide9.zalo")}</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${data.profile.emailAddress}`}
                className="clay-card rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-1.5 md:gap-3 text-center hover:scale-[1.05] hover:-rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-10 md:w-14 h-10 md:h-14 rounded-xl md:rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl md:text-3xl">mail</span>
                </div>
                <span className="font-display text-xs md:text-base font-bold text-slate-800 dark:text-white">{t("intro.slide9.email")}</span>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/hugowishpax.le"
                target="_blank"
                rel="noopener noreferrer"
                className="clay-card rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-1.5 md:gap-3 text-center hover:scale-[1.05] hover:rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-10 md:w-14 h-10 md:h-14 rounded-xl md:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl md:text-3xl">group</span>
                </div>
                <span className="font-display text-xs md:text-base font-bold text-slate-800 dark:text-white">{t("intro.slide9.fb")}</span>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@pethugowishpaxle?_r=1&_t=ZS-96UW9Neg8UW"
                target="_blank"
                rel="noopener noreferrer"
                className="clay-card rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-1.5 md:gap-3 text-center hover:scale-[1.05] hover:-rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-10 md:w-14 h-10 md:h-14 rounded-xl md:rounded-2xl bg-black/10 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl md:text-3xl">play_circle</span>
                </div>
                <span className="font-display text-xs md:text-base font-bold text-slate-800 dark:text-white">{t("intro.slide9.tiktok")}</span>
              </a>
            </div>
          </div>
        </section>

        {/* SLIDE 9: Register & Start Journey (đăng ký và bắt đầu hành trình) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 md:px-16 lg:px-24">
          <div className="w-full max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
              {t("intro.slide10.badge")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {t("intro.slide10.title1")} <br />
              <span className="bg-gradient-to-r from-[#6366f1] via-[#0ea5e9] to-[#fbbf24] bg-clip-text text-transparent">
                {t("intro.slide10.title2")}
              </span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t("intro.slide10.desc")}
            </p>
            
            {/* Overlapping buttons and accent shadow */}
            <div className="flex justify-center gap-4 pt-4 relative">
              <Link to="/login" className="px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold hover:scale-[1.03] transition-transform shadow-xl shadow-[#6366f1]/25 text-xs sm:text-sm z-10">
                {t("intro.slide10.registerBtn")}
              </Link>
              <Link to="/booking" className="px-8 py-4 rounded-full border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm z-10">
                {t("intro.slide10.bookBtn")}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
