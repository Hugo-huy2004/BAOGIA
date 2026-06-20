import React from "react";
import { Link } from "react-router-dom";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";

export default function ServicesPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "Dịch Vụ | Hugo Studio",
    description: "Cung cấp các gói dịch vụ thiết kế Bio Link cá nhân, Signature Portfolio và ứng dụng Web App doanh nghiệp cao cấp.",
    keywords: "dịch vụ thiết kế web, Bio Link sinh viên, Signature Portfolio, Ultimate Web App, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/services"
  });

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio pop effect failed:", e);
    }
  };



  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 py-8 md:py-12 px-4 md:px-6 mb-16 text-slate-800 dark:text-slate-100">
      
      {/* Header section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">{t("servicesPage.header.badge")}</span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t("servicesPage.header.title")}</h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{t("servicesPage.header.desc")}</p>
      </section>

      {/* Services Grid */}
      <section className="flex lg:grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto lg:overflow-visible pt-6 lg:pt-0 pb-8 lg:pb-0 snap-x snap-mandatory scrollbar-hide items-stretch mt-4 md:mt-8 px-4 lg:px-0 -mx-4 lg:mx-0 animate-fadeIn">
          
          {/* Tier 1: {t("servicesPage.tier1.title")} (Free) */}
          <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border border-slate-200/50 dark:border-white/10 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-visible">
            
            {/* Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[10px]">school</span>{t("servicesPage.tier1.badge")}</span>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2 text-left">
                <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">{t("servicesPage.tier1.subtitle")}</span>
                <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {t("servicesPage.tier1.title")}
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl" title="Đã xác thực">verified</span>
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">{t("servicesPage.tier1.price")} <span className="text-xs font-normal text-slate-400">{t("servicesPage.tier1.priceUnit")}</span></p>
                  <p className="text-sm text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600 font-medium">{t("servicesPage.tier1.oldPrice")}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/5 pt-6 text-left">
                <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier1.f1_bold")}</strong> {t("servicesPage.tier1.f1_text")}<code>.edu</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier1.f2_bold")}</strong> {t("servicesPage.tier1.f2_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier1.f3_bold")}</strong> {t("servicesPage.tier1.f3_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier1.f4_bold")}</strong> {t("servicesPage.tier1.f4_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier1.f5_bold")}</strong> {t("servicesPage.tier1.f5_text")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 pt-8 relative z-10">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 text-left">{t("servicesPage.tier1.note")}</p>
              <Link 
                to="/student-benefits"
                onClick={playPopSound}
                className="w-full inline-flex justify-center items-center py-3.5 rounded-full border border-slate-300 dark:border-white/30 hover:border-slate-800 dark:hover:border-white text-slate-700 dark:text-slate-200 dark:hover:text-white font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center dark:bg-white/5 hover:dark:bg-white/10"
              >
                {t("servicesPage.tier1.btn")}
              </Link>
            </div>
          </div>

          {/* Tier 2: Signature Portfolio */}
          <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border-2 border-primary dark:border-[#a5b4fc]/50 p-6 sm:p-8 shadow-2xl hover:shadow-[0_25px_50px_rgba(99,102,241,0.15)] transition-all duration-300 relative group overflow-visible">
            
            {/* Top Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-primary text-white shadow-md flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[10px]">star</span>{t("servicesPage.tier2.badge")}</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary dark:text-[#a5b4fc] border border-primary/20">{t("servicesPage.tier2.subtitle")}</span>
                <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{t("servicesPage.tier2.title")}</h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-800 dark:text-white">{t("servicesPage.tier2.for")}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("servicesPage.tier2.desc")}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/5 pt-6 text-left">
                <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f1_bold")}</strong> {t("servicesPage.tier2.f1_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f2_bold")}</strong> {t("servicesPage.tier2.f2_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f3_bold")}</strong> {t("servicesPage.tier2.f3_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f4_bold")}</strong> {t("servicesPage.tier2.f4_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f5_bold")}</strong> {t("servicesPage.tier2.f5_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f6_bold")}</strong> {t("servicesPage.tier2.f6_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier2.f7_bold")}</strong> {t("servicesPage.tier2.f7_text")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 pt-8 text-left">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">{t("servicesPage.tier2.note")}</p>
              <Link 
                to="/booking"
                onClick={playPopSound}
                className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-primary text-white font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center shadow-lg shadow-primary/25"
              >{t("servicesPage.tier2.btn")}</Link>
            </div>
          </div>

          {/* Tier 3: Ultimate Web App */}
          <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border border-slate-200/50 dark:border-white/10 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-visible">
            
            {/* Top Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[10px]">business_center</span>{t("servicesPage.tier3.badge")}</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">{t("servicesPage.tier3.subtitle")}</span>
                <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">{t("servicesPage.tier3.title")}</h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-800 dark:text-white">{t("servicesPage.tier3.for")}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("servicesPage.tier3.desc")}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/5 pt-6 text-left">
                <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f1_bold")}</strong> {t("servicesPage.tier3.f1_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f2_bold")}</strong> {t("servicesPage.tier3.f2_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f3_bold")}</strong> {t("servicesPage.tier3.f3_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f4_bold")}</strong> {t("servicesPage.tier3.f4_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f5_bold")}</strong> {t("servicesPage.tier3.f5_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f6_bold")}</strong> {t("servicesPage.tier3.f6_text")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                    <span><strong>{t("servicesPage.tier3.f7_bold")}</strong> {t("servicesPage.tier3.f7_text")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 pt-8 text-left">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">{t("servicesPage.tier2.note")}</p>
              <Link 
                to="/booking"
                onClick={playPopSound}
                className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center shadow-md"
              >{t("servicesPage.tier2.btn")}</Link>
            </div>
          </div>

        </section>

      {/* Strategic Partner Section */}
      <section className="mt-16 md:mt-24 text-center space-y-8 max-w-3xl mx-auto px-4">
        <div className="space-y-3">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">{t("servicesPage.partner.badge")}</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{t("servicesPage.partner.title")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("servicesPage.partner.desc")}</p>
        </div>
        
        <div className="flex justify-center items-center py-2 gap-0 sm:gap-1 md:gap-2">
          <a href="https://hwagfu.dev" target="_blank" rel="noopener noreferrer" title="hwagfu.dev">
            <img
              src="https://res.cloudinary.com/dyehwoscu/image/upload/v1779514310/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-23_lu%CC%81c_12.31.33-removebg-preview_ww2qxy.png"
              alt="Jason Dev Partner Logo"
              className="w-40 sm:w-56 md:w-64 h-auto object-contain transition-all duration-500 opacity-40 filter grayscale hover:opacity-70 dark:opacity-100 dark:brightness-0 dark:invert dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] hover:dark:drop-shadow-[0_0_25px_rgba(255,255,255,1)] relative z-0 -ml-1 sm:-ml-2 cursor-pointer hover:scale-105"
            />
          </a>
        </div>
      </section>

    </div>
  );
}
