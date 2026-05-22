import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { optimizeCloudinaryUrl } from "../utils/imageOptimizer";
import { useHeadMeta } from "../hooks/useHeadMeta";

export default function IntroductionPage() {
  const { data } = useData();
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
              {idx === 0 && "Welcome"}
              {idx === 1 && "Ngành Lập Trình"}
              {idx === 2 && "Hồ Sơ Cá Nhân"}
              {idx === 3 && "Thông Tin Đồng Đội"}
              {idx === 4 && "Dịch Vụ Bio Edu"}
              {idx === 5 && "Dịch Vụ Làm Web"}
              {idx === 6 && "Sở Thích Cá Nhân"}
              {idx === 7 && "Thông Điệp"}
              {idx === 8 && "Liên Kết"}
              {idx === 9 && "Bắt Đầu"}
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
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          {/* Background Watermark */}
          <div className="absolute left-[5%] bottom-[10%] text-[12rem] xl:text-[15rem] font-black text-slate-900/[0.02] dark:text-white/[0.01] pointer-events-none select-none tracking-tighter leading-none">
            CREATIVE
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 w-full max-w-7xl mx-auto items-center relative z-10">
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 md:space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
                ✦ Creative Developer Portal
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white">
                Kiến tạo vũ trụ số <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-[#6366f1] via-[#0ea5e9] to-[#fbbf24] bg-clip-text text-transparent">
                  bằng cả trái tim.
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Chào mừng bạn đến với ngôi nhà của <strong className="text-[#6366f1] dark:text-[#a5b4fc]">{data.profile.fullName}</strong>. Nơi định hình phong cách thiết kế sang trọng, tối ưu SEO và tương tác mượt mà.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <button 
                  onClick={() => scrollToSlide(1)}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-[#6366f1] text-white font-semibold shadow-lg shadow-[#6366f1]/20 hover:scale-[1.03] transition-transform duration-300 text-xs sm:text-sm"
                >
                  Khám Phá Portal
                </button>
                <Link to="/booking" className="inline-flex items-center justify-center px-6 py-3 sm:py-4 rounded-full border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm">
                  Đặt Lịch Hẹn
                </Link>
              </div>
            </div>
            
            {/* Enlarged Avatar with Overlapping Ring - visible on all sizes */}
            <div className="w-full sm:w-auto flex lg:col-span-5 justify-center relative mt-4 lg:mt-0">
              <div className="absolute w-[160px] h-[160px] sm:w-[260px] sm:h-[260px] md:w-[380px] md:h-[380px] lg:w-[480px] lg:h-[480px] rounded-full bg-[#6366f1]/15 blur-[40px] sm:blur-[60px] md:blur-[80px] lg:blur-[100px]" />
              
              {/* Overlapping offset back frame ring */}
              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] md:w-[420px] md:h-[420px] lg:w-[520px] lg:h-[520px] rounded-full border border-slate-200 dark:border-white/5 pointer-events-none" />
              
              <div className="relative w-[140px] h-[140px] sm:w-[220px] sm:h-[220px] md:w-[340px] md:h-[340px] lg:w-[480px] lg:h-[480px] rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/20 via-transparent to-[#0ea5e9]/20" />
                <img
                  src={avatarImages[currentAvtIndex]}
                  alt={data.profile.fullName}
                  className={`relative z-10 w-[85%] h-[85%] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300 ${
                    avtFade ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                />
              </div>

              {/* Overlapping glass status badge */}
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-4 md:right-4 lg:bottom-6 lg:right-6 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2.5 rounded-2xl shadow-lg z-20 text-[7px] sm:text-[8px] md:text-[10px] font-bold text-slate-800 dark:text-white flex items-center gap-1 transform rotate-3">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="hidden sm:inline">Available for Projects</span>
                <span className="sm:hidden">Available</span>
              </div>
            </div>
          </div>
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
                  ✦ Web Development
                </span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Lập Trình Web <br />
                  <span className="bg-gradient-to-r from-[#0ea5e9] to-[#6366f1] bg-clip-text text-transparent">
                    Nơi Ý Tưởng Trở Thành Không Gian Tương Tác
                  </span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Ngành lập trình Web là hành trình biến các ý tưởng sáng tạo thành các trang web sống động. Không chỉ là viết code thuần túy, lập trình web đòi hỏi tư duy thẩm mỹ cao kết hợp cùng giải pháp kỹ thuật tối ưu để mang lại trải nghiệm hoàn hảo cho người dùng.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => scrollToSlide(2)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0ea5e9] text-white font-bold text-xs shadow-lg shadow-[#0ea5e9]/20 hover:scale-[1.03] transition-transform"
                  >
                    Xem Hồ Sơ Cá Nhân <span className="material-symbols-outlined text-xs">arrow_forward</span>
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
          <div className="absolute left-[8%] top-[8%] text-[8rem] sm:text-[10rem] xl:text-[12rem] font-black text-slate-900/[0.015] dark:text-white/[0.007] pointer-events-none select-none tracking-tighter leading-none">
            EST. 2004
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center">
            {/* Mobile Portrait - visible on small/medium screens */}
            <div className="w-full flex lg:hidden justify-center">
              <div className="w-full max-w-xs rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 dark:from-[#12111a] dark:to-black border border-slate-700/50 dark:border-white/10 p-2.5 sm:p-3 shadow-xl hover:shadow-[0_20px_40px_rgba(99,102,241,0.2)] transition-all duration-300 group overflow-hidden relative">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img 
                    src={realPhoto} 
                    alt="Hugo Portrait" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="pt-2.5 sm:pt-3 text-center space-y-0.5 sm:space-y-1">
                  <span className="font-display text-sm sm:text-base font-bold bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-clip-text text-transparent dark:from-white dark:via-slate-50 dark:to-white">Peter Hugo Wishpax Lê</span>
                  <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">Software Engineering Student</p>
                </div>
              </div>
            </div>

            {/* Left: Asymmetric Stacked Portrait - hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:col-span-5 justify-center relative">
              {/* Stacked background frame */}
              <div className="absolute w-[420px] h-[280px] rounded-[2.5rem] bg-[#6366f1]/5 dark:bg-[#1f1b2e]/50 border border-slate-200/50 dark:border-white/5 transform rotate-[2deg] translate-x-4 translate-y-4" />

              <div className="w-[420px] rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border border-slate-200/50 dark:border-white/10 p-5 shadow-2xl hover:shadow-[0_25px_50px_rgba(99,102,241,0.2)] transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 relative z-10 group overflow-hidden">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6366f1]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img 
                    src={realPhoto} 
                    alt="Hugo Portrait" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="pt-5 text-center space-y-1.5">
                  <span className="font-display text-lg font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-50 dark:to-white bg-clip-text text-transparent">Peter Hugo Wishpax Lê</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Software Engineering Student</p>
                </div>
              </div>
            </div>

            {/* Right: Personal Credentials Info overlapping background */}
            <div className="lg:col-span-7 space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-6 relative z-10 w-full">
              <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25">
                ✦ Personal Information
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Lý lịch & Quá trình học tập
              </h2>
              
              <div className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-6">
                <div className="flex items-start gap-2.5 sm:gap-3 border-b border-[#6366f1]/10 pb-2.5 sm:pb-3 md:pb-4">
                  <span className="material-symbols-outlined text-[#0ea5e9] text-lg sm:text-xl md:text-2xl mt-0.5 flex-shrink-0">school</span>
                  <div className="space-y-2 sm:space-y-3 w-full">
                    <div className="text-[8px] sm:text-[10px] uppercase font-bold text-slate-400">Học vấn / Trường học liên kết</div>
                    
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full pt-0 sm:pt-1">
                      {/* High school card */}
                      <a 
                        href="https://ndc.edu.vn" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#6366f1] transition-colors group space-y-1 block text-left shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] sm:text-[10px] font-bold text-[#6366f1] uppercase tracking-wider leading-tight">THPT Nguyễn Đình Chiểu</span>
                          <span className="material-symbols-outlined text-xs text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0">open_in_new</span>
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400">Mỹ Tho (Collège de MyTho)</p>
                      </a>

                      {/* University card */}
                      <a 
                        href="https://greenwich.edu.vn" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-[#0ea5e9] transition-colors group space-y-1 block text-left shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] sm:text-[10px] font-bold text-[#0ea5e9] uppercase tracking-wider leading-tight">Greenwich Vietnam</span>
                          <span className="material-symbols-outlined text-xs text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0">open_in_new</span>
                        </div>
                        <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400">Greenwich University</p>
                      </a>
                    </div>
                  </div>
                </div>
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
                  <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-[#ec4899] uppercase">GREENWICH CO-DEVELOPER</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#ec4899]" />
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#d946ef]" />
                  </div>
                </div>

                {/* Portrait Container - aspect-[4/3] on mobile (to keep height low but image wide), aspect-[4/5] on desktop (Reduced rounded corners) */}
                <div className="aspect-[4/3] lg:aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative border border-slate-200/50 dark:border-white/5">
                  <img 
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
                  ✦ Co-Developer Partner
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Đồng hành cùng kiến tạo <br />
                  <span className="bg-gradient-to-r from-[#ec4899] via-[#d946ef] to-[#818cf8] bg-clip-text text-transparent">
                    những trải nghiệm số độc bản.
                  </span>
                </h2>
                <p className="hidden sm:block text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  Jason Phan là người bạn đồng hành cùng tôi trên con đường học tập và phát triển dự án. Chúng tôi kết hợp tư duy hệ thống và niềm đam mê công nghệ để biến những ý tưởng phức tạp thành những ứng dụng mượt mà, tối ưu.
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
                      <h4 className="font-display text-xs lg:text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#ec4899] transition-colors">THPT Cây Dương</h4>
                      <p className="text-[10px] lg:text-[11px] text-slate-450 mt-0.5 lg:mt-1 leading-relaxed">Trường trung học phổ thông năng động tại An Giang (Kiên Giang cũ).</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 lg:pt-4 mt-2.5 lg:mt-4 border-t border-slate-200/50 dark:border-white/5 text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>An Giang (Kiên Giang cũ)</span>
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
                      <h4 className="font-display text-xs lg:text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#d946ef] transition-colors">Greenwich Vietnam</h4>
                      <p className="text-[10px] lg:text-[11px] text-slate-450 mt-0.5 lg:mt-1 leading-relaxed">Môi trường đào tạo quốc tế liên kết cùng Greenwich Vương Quốc Anh.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 lg:pt-4 mt-2.5 lg:mt-4 border-t border-slate-200/50 dark:border-white/5 text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Đại học liên kết</span>
                    <span className="material-symbols-outlined text-[10px] group-hover:translate-x-1 transition-transform">open_in_new</span>
                  </div>
                </a>

              </div>
            </div>

          </div>
        </section>

        {/* SLIDE 5: Free Bio with Edu Mail (Overlapping Student Cards) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-7xl mx-auto items-center">
            <div className="lg:col-span-7 space-y-6 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
                ✦ Student Benefits
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Trang Bio Link Miễn Phí <br />
                Cho Sinh Viên Dùng Email .edu
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-350 leading-relaxed">
                Tôi mong muốn hỗ trợ tối đa cho học sinh, sinh viên trong việc xây dựng thương hiệu cá nhân số. Mỗi tài khoản đăng ký sử dụng email giáo dục có chứa hậu tố <strong className="text-[#6366f1] dark:text-[#a5b4fc]">.edu</strong> sẽ được tự động kích hoạt tạo 1 trang Bio tùy chỉnh hoàn toàn miễn phí.
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-650 dark:text-slate-350">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>Xác thực email giáo dục tự động trong 3 giây.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>Hỗ trợ tạo link đẹp theo tên riêng biệt (Ví dụ: bio/ten-cua-ban).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">verified_user</span>
                  <span>Thời hạn sử dụng Bio Link trong vòng 12 tháng.</span>
                </div>
              </div>
              <div className="pt-2">
                <Link to="/login" className="px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold text-xs shadow-lg shadow-[#6366f1]/20 hover:scale-[1.03] transition-transform inline-block">
                  Bắt Đầu Tạo Bio .edu
                </Link>
              </div>
            </div>
            
            {/* Overlapping Stacks of Student Cards - hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:col-span-5 justify-end relative">
              {/* Back Card */}
              <div className="absolute top-4 left-4 w-[360px] sm:w-[400px] h-[240px] sm:h-[260px] rounded-[2.5rem] bg-gradient-to-tr from-[#6366f1]/20 to-transparent border border-[#6366f1]/20 p-8 shadow-lg transform rotate-[-4deg] pointer-events-none" />

              {/* Front ID Card */}
              <div className="w-[360px] sm:w-[400px] rounded-[2.5rem] bg-gradient-to-b from-white/95 to-white/40 dark:from-slate-900/95 dark:to-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-white/10 p-8 shadow-2xl relative z-10 transform rotate-[2deg] hover:rotate-0 transition-transform duration-500 group overflow-hidden">
                {/* Holographic light reflect pattern */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-white/5 pb-4">
                  <div>
                    <span className="text-[8px] font-bold text-[#10b981] uppercase tracking-widest block">STUDENT IDENTIFICATION</span>
                    <span className="font-display text-sm font-black text-slate-800 dark:text-white">HUGO PORTAL SYSTEM</span>
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
                    <span className="text-[10px] text-slate-400 uppercase font-bold">REQUIRED EMAIL</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">name@school.edu.vn</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">BENEFIT</span>
                    <span className="font-bold text-[#10b981]">1x FREE Bio Page</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">VALIDITY</span>
                    <span className="font-bold text-slate-600 dark:text-slate-350">12 Months</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400">AUTHENTICATED</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">ID: 2004-EDU-VALID</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 5: Web Development Services (Giới thiệu dịch vụ làm web của tôi, visual browser) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-7xl mx-auto items-center">
            
            {/* Left: Interactive Browser Mockup of Service Prices - hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:col-span-5 justify-center relative">
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
                  <span className="material-symbols-outlined text-xs text-slate-455">refresh</span>
                </div>

                {/* Browser Content */}
                <div className="p-6 space-y-4">
                  <span className="text-[9px] font-extrabold text-[#0ea5e9] uppercase tracking-wider block">SERVICE OPTIONS</span>
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">Signature Portfolio</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Thiết kế độc bản, trang riêng lẻ</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2.5 py-1 rounded-full shrink-0">Pro</span>
                    </div>
                    {/* Item 2 */}
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">Ultimate Web App</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Admin Dashboard, Quản lý sản phẩm</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 px-2.5 py-1 rounded-full shrink-0">Apex</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column details */}
            <div className="lg:col-span-7 space-y-6 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/25">
                ✦ Professional Web Services
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Thiết Kế Web Chuyên Nghiệp <br />
                Tối Ưu Trải Nghiệm Số
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Tôi phát triển các ứng dụng web với triết lý mã nguồn tinh gọn, tải trang nhanh chóng, áp dụng tối ưu các hiệu ứng chuyển động mượt mà và chuẩn SEO để giúp thương hiệu của bạn tiếp cận người dùng tốt nhất.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    playTick();
                    navigate("/services");
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold text-xs shadow-lg shadow-[#6366f1]/20 hover:scale-[1.03] transition-transform"
                >
                  Xem Bảng Giá & Chi Tiết
                </button>
                <Link to="/booking" className="inline-flex items-center justify-center px-6 py-4 rounded-full border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  Đặt Lịch Thiết Kế
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 6: Personal Hobby (Sở thích cá nhân - Dương xỉ) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          {/* Background Watermark */}
          <div className="absolute right-[5%] top-[10%] text-[8rem] xl:text-[12rem] font-black text-slate-900/[0.02] dark:text-white/[0.01] pointer-events-none select-none tracking-tighter leading-none">
            FERNS
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center relative z-10">
            {/* Left side text */}
            <div className="lg:col-span-5 space-y-4 lg:space-y-6 text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                ✦ Personal Hobby
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Góc chữa lành: <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  Cây Dương Xỉ.
                </span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Sau những giờ phút gõ code căng thẳng, niềm đam mê lớn nhất của tôi là nhìn ngắm và chăm sóc những chậu cây dương xỉ. Sức sống mãnh liệt và vẻ đẹp nguyên thủy của chúng mang lại một sự bình yên vô tận.
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
                  <img 
                    src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443455/IMG_6573_rrrbpn.heic", 800)} 
                    alt="Main Fern" 
                    className="w-[145%] h-[145%] max-w-none object-cover absolute top-1/2 left-1/2" 
                    style={{ transform: 'translate(-50%, -50%) rotate(45deg)' }}
                  />
                  <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />
                </div>
              </div>
              
              {/* Small Image 1 (Floating top left) */}
              <div className="absolute top-[5%] sm:top-[10%] left-[5%] sm:left-[10%] lg:left-[8%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-[1.5rem] bg-slate-200 dark:bg-slate-800/50 border border-white/50 dark:border-white/10 shadow-xl overflow-hidden z-20 animate-float">
                <img src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443454/IMG_6575_ko0sly.heic", 400)} alt="Fern Details" className="w-full h-full object-cover" />
              </div>
              
              {/* Small Image 2 (Floating bottom right) */}
              <div className="absolute bottom-[5%] sm:bottom-[10%] right-[5%] sm:right-[10%] lg:right-[8%] w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] rounded-full bg-slate-200 dark:bg-slate-800/50 border border-white/50 dark:border-white/10 shadow-xl overflow-hidden z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <img src={optimizeCloudinaryUrl("https://res.cloudinary.com/dyehwoscu/image/upload/v1779443454/IMG_6574_rwhajd.heic", 400)} alt="Fern Decor" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 7: Philosophy & Experience (Overlapping Typography quotes) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-7xl mx-auto items-center relative z-10">
            {/* Left: philosophy quotes overlapping watermarks */}
            <div className="lg:col-span-7 space-y-6 relative">
              
              {/* Massive overlapping quote watermarks */}
              <span className="absolute -top-12 -left-10 text-[8rem] sm:text-[10rem] font-serif text-[#6366f1]/10 pointer-events-none select-none">“</span>
              
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/25 relative z-10">
                ✦ Design Philosophy
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white relative z-10">
                Cách tôi kiến tạo <br />
                Trải nghiệm người dùng
              </h2>
              
              <blockquote className="text-2xl sm:text-3xl lg:text-4xl italic font-semibold text-[#6366f1] dark:text-[#a5b4fc] border-l-4 border-[#6366f1] pl-6 py-1 relative z-10 leading-snug">
                "Kiến tạo trải nghiệm bằng cả trái tim. Mỗi dòng code đều phải có linh hồn, mang lại sự ngạc nhiên và ngọt ngào."
              </blockquote>

              <div className="grid grid-cols-2 gap-6 pt-2 text-xs sm:text-sm relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-sm text-[#6366f1]">magic_button</span>
                    <span>Sự Ngạc Nhiên (Wow Factor)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tôi tin rằng giao diện kỹ thuật số không được vô cảm. Mọi nút bấm, thẻ thông tin hay hiệu ứng cuộn trang đều phải được phủ lên một lớp chuyển động tinh tế để kích thích sự hào hứng.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-sm text-[#0ea5e9]">fit_screen</span>
                    <span>Sự Ngọt Ngào & Chỉn Chu</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Sự mượt mà và đồng bộ trong bảng màu, khoảng cách thiết kế và độ phản hồi tức thời của cơ sở dữ liệu tạo nên một tổng thể trọn vẹn và an tâm nhất cho người trải nghiệm.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Asymmetric Principle Card - hidden on mobile/tablet */}
            <div className="hidden lg:flex lg:col-span-5 justify-end relative">
              {/* Background accent ring */}
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full border border-slate-200/50 dark:border-white/5 pointer-events-none" />

              <div className="w-[420px] h-[360px] rounded-[2.5rem] bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden transform rotate-[1.5deg]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-xl" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CREATIVE PRINCIPLES</span>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#6366f1] font-mono">01</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Đặt trái tim làm trung tâm trải nghiệm.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#0ea5e9] font-mono">02</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tối giản thư viện ngoài để đạt hiệu năng 100%.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm sm:text-base font-bold text-[#fbbf24] font-mono">03</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Đồng bộ ngôn ngữ thiết kế từ đầu đến cuối.</span>
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
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-12 relative z-10">
            {/* Profile Header with Avatar */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#6366f1]/30 shadow-lg">
                  <img 
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
                ✦ Keep In Touch
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
                Liên Kết Kết Nối Với Hugo
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400">
                Nhấn vào các biểu tượng bên dưới để chuyển tiếp kết nối trực tiếp đến các trang mạng xã hội và kênh thông tin liên hệ chính thức của tôi.
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
                className="clay-card rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-2 md:gap-3 text-center hover:scale-[1.05] hover:rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-[#6366f1] dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">sms</span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-slate-800 dark:text-white">Zalo Chat</span>
              </a>

              {/* Email */}
              <a 
                href={`mailto:${data.profile.emailAddress}`}
                className="clay-card rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-2 md:gap-3 text-center hover:scale-[1.05] hover:-rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">mail</span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-slate-800 dark:text-white">Gửi Email</span>
              </a>

              {/* Facebook */}
              <a 
                href="https://facebook.com/hugowishpax.le" 
                target="_blank" 
                rel="noopener noreferrer"
                className="clay-card rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-2 md:gap-3 text-center hover:scale-[1.05] hover:rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">group</span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-slate-800 dark:text-white">Facebook</span>
              </a>

              {/* TikTok */}
              <a 
                href="https://www.tiktok.com/@pethugowishpaxle?_r=1&_t=ZS-96UW9Neg8UW"
                target="_blank" 
                rel="noopener noreferrer"
                className="clay-card rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-slate-200/50 dark:border-white/5 bg-white/75 dark:bg-[#12111a]/45 flex flex-col items-center justify-center gap-2 md:gap-3 text-center hover:scale-[1.05] hover:-rotate-1 transition-all duration-300 shadow-lg group relative z-10 cursor-pointer"
              >
                <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-black/10 dark:bg-white/10 text-slate-800 dark:text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl md:text-3xl">play_circle</span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-slate-800 dark:text-white">TikTok</span>
              </a>
            </div>
          </div>
        </section>

        {/* SLIDE 9: Register & Start Journey (đăng ký và bắt đầu hành trình) */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-6 md:px-16 lg:px-24">
          <div className="w-full max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/25">
              ✦ Start Now
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Đăng ký & Bắt đầu <br />
              <span className="bg-gradient-to-r from-[#6366f1] via-[#0ea5e9] to-[#fbbf24] bg-clip-text text-transparent">
                Hành trình số của bạn.
              </span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Tạo lập các trang liên kết sinh viên cực đẹp hoàn toàn miễn phí hoặc kết nối cùng tôi để thiết kế nên những trang web Bespoke chuyên nghiệp ngay hôm nay.
            </p>
            
            {/* Overlapping buttons and accent shadow */}
            <div className="flex justify-center gap-4 pt-4 relative">
              <Link to="/login" className="px-8 py-4 rounded-full bg-[#6366f1] text-white font-bold hover:scale-[1.03] transition-transform shadow-xl shadow-[#6366f1]/25 text-xs sm:text-sm z-10">
                Đăng Ký Tài Khoản
              </Link>
              <Link to="/booking" className="px-8 py-4 rounded-full border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm z-10">
                Đặt Lịch Tư Vấn
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
