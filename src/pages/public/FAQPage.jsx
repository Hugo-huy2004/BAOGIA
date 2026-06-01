import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";

export default function FAQPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "FAQ | Hugo Studio",
    description: "Giải đáp các thắc mắc thường gặp về dịch vụ thiết kế Bio Link cá nhân, chi phí thiết kế và cách thức hoạt động tại Hugo Studio.",
    keywords: "câu hỏi thường gặp, FAQ Hugo Studio, liên hệ thiết kế, Bio Link giá rẻ, thiết kế portfolio",
    canonicalUrl: "https://www.hugowishpax.studio/faq"
  });

  const [expandedIdx, setExpandedIdx] = useState(0); // Mở sẵn câu đầu tiên
  const [floatingDots, setFloatingDots] = useState([]);

  useEffect(() => {
    // Generate subtle floating dots for background
    setFloatingDots(Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 10 + 10
    })));
  }, []);

  const faqs = [
    { icon: "schedule", color: "from-amber-400 to-orange-500" },
    { icon: "group", color: "from-emerald-400 to-teal-500" },
    { icon: "featured_seasonal_and_gifts", color: "from-pink-400 to-rose-500", hasAction: true, actionLink: "/student-benefits" },
    { icon: "payments", color: "from-cyan-400 to-blue-500" },
    { icon: "flight_takeoff", color: "from-violet-400 to-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] relative overflow-hidden pt-24 pb-20 transition-colors duration-300">
      
      {/* Background Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 dark:bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 blur-[120px] pointer-events-none" />
      
      {/* Floating ambient dots */}
      {floatingDots.map((dot) => (
        <div 
          key={dot.id}
          className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 blur-[1px] pointer-events-none"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            animation: `float-y ${dot.duration}s ease-in-out infinite`,
            animationDelay: `${dot.delay}s`
          }}
        />
      ))}

      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-40px); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>{t("faqPage.header.badge")}</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.1]">{t("faqPage.header.title1")} <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{t("faqPage.header.title2")}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">{t("faqPage.header.desc")}</p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* FAQ Accordion List (Left/Main Column) */}
          <div className="lg:col-span-8 space-y-4">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className={`group cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden border ${
                    isExpanded 
                      ? "bg-white dark:bg-white/5 border-indigo-200 dark:border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.05)]" 
                      : "bg-white/60 dark:bg-transparent border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/5"
                  }`}
                >
                  <div className="p-5 md:p-6 flex items-start gap-4 md:gap-5">
                    {/* Icon Bubble */}
                    <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isExpanded 
                        ? `bg-gradient-to-br ${faq.color} shadow-lg text-white scale-110 rotate-3` 
                        : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 group-hover:scale-105"
                    }`}>
                      <span className="material-symbols-outlined text-lg md:text-xl">{faq.icon}</span>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className={`text-base md:text-lg font-bold leading-tight transition-colors duration-300 ${
                          isExpanded ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}>
                          {t(`faqPage.faqs.${idx}.question`)}
                        </h3>
                        {/* Expand Caret */}
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 transition-transform duration-500 ${
                          isExpanded ? "rotate-180 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                        }`}>
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                        </div>
                      </div>

                      {/* Expandable Answer Body (Using CSS Grid Trick for smooth height transition) */}
                      <div className={`grid transition-all duration-500 ease-in-out ${
                        isExpanded ? "grid-rows-[1fr] opacity-100 mt-3 md:mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}>
                        <div className="overflow-hidden">
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-[15px]">
                            {t(`faqPage.faqs.${idx}.answer`)}
                          </p>
                          {faq.hasAction && (
                            <div className="mt-4 md:mt-5">
                              <Link 
                                to={faq.actionLink || "/login"}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                <span>{t(`faqPage.faqs.${idx}.actionText`)}</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Sticky Card (Right Column) */}
          <div className="lg:col-span-4 relative mt-4 lg:mt-0">
            <div className="sticky top-28 bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl overflow-hidden group">
              {/* Card Decorative Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative z-10 text-center">
                {/* Avatar */}
                <div className="relative w-28 h-28 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                  <img 
                    src="/image/avt5.png" 
                    alt="Hugo Support" 
                    className="relative z-10 w-full h-full object-contain drop-shadow-xl"
                  />
                  {/* Status Indicator */}
                  <div className="absolute bottom-2 right-4 z-20 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#12111a] rounded-full shadow-sm" title="Online" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t("faqPage.contact.title")}</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 px-2">{t("faqPage.contact.desc")}</p>

                <div className="space-y-3">
                  <a 
                    href="https://zalo.me/0839909399" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0068ff] hover:bg-[#0054cc] text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>{t("faqPage.contact.chatBtn")}</a>
                  <a 
                    href="mailto:hugowishpax@gmail.com" 
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold transition-all border border-slate-200 dark:border-white/5"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span>{t("faqPage.contact.emailBtn")}</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
