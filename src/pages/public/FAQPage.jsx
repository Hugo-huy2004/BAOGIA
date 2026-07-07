import { useState } from "react";
import { Link } from "react-router-dom";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Thứ tự icon khớp với faqPage.faqs.* trong translation.json
const FAQS = [
  { icon: "schedule" },
  { icon: "group" },
  { icon: "featured_seasonal_and_gifts", hasAction: true, actionLink: "/student-benefits" },
  { icon: "payments" },
  { icon: "flight_takeoff" },
];

export default function FAQPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "FAQ | Hugo Studio",
    description: "Giải đáp các thắc mắc thường gặp về dịch vụ thiết kế Bio Link cá nhân, chi phí thiết kế và cách thức hoạt động tại Hugo Studio.",
    keywords: "câu hỏi thường gặp, FAQ Hugo Studio, liên hệ thiết kế, Bio Link giá rẻ, thiết kế portfolio",
    canonicalUrl: "https://www.hugowishpax.studio/faq"
  });

  const [expandedIdx, setExpandedIdx] = useState(0); // Mở sẵn câu đầu tiên

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-20 text-foreground transition-colors duration-300">

      {/* Background glows — đồng bộ Hugo Studio */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-info/10 to-primary/10 blur-[130px] pointer-events-none" />

      {/* Ambient orbs */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[12%] right-[12%] w-28 h-28 md:w-40 md:h-40 bg-warning/20 rounded-full blur-[60px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[14%] left-[6%] w-36 h-36 md:w-52 md:h-52 bg-primary/20 rounded-full blur-[80px] pointer-events-none"
      />

      {/* Watermark */}
      <div className="absolute right-[-2%] top-[4%] text-[8rem] md:text-[13rem] font-black text-foreground/[0.03] dark:text-foreground/[0.02] pointer-events-none select-none tracking-tighter leading-none">
        FAQ
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-primary/10 text-primary border border-primary/25">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("faqPage.header.badge")}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]"
          >
            {t("faqPage.header.title1")} <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent animate-gradientShift">
              {t("faqPage.header.title2")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-sm md:text-base leading-relaxed"
          >
            {t("faqPage.header.desc")}
          </motion.p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Accordion */}
          <div className="lg:col-span-8 space-y-4">
            {FAQS.map((faq, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className={`group cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden border backdrop-blur-xl ${
                    isExpanded
                      ? "bg-white/70 dark:bg-slate-900/70 border-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                      : "bg-white/40 dark:bg-white/[0.02] border-border/50 hover:border-border hover:bg-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="p-5 md:p-6 flex items-start gap-4 md:gap-5">
                    {/* Icon đơn sắc */}
                    <div className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isExpanded
                        ? "bg-foreground text-background shadow-lg scale-110"
                        : "bg-muted text-foreground group-hover:scale-105"
                    }`}>
                      <span className="material-symbols-outlined text-lg md:text-xl">{faq.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-baseline gap-2.5 min-w-0">
                          <span className={`shrink-0 text-[10px] font-bold font-mono transition-colors ${isExpanded ? "text-primary" : "text-muted-foreground/60"}`}>
                            0{idx + 1}
                          </span>
                          <h3 className={`text-base md:text-lg font-bold leading-tight transition-colors duration-300 ${
                            isExpanded ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                          }`}>
                            {t(`faqPage.faqs.${idx}.question`)}
                          </h3>
                        </div>
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted transition-transform duration-500 ${
                          isExpanded ? "rotate-180 text-primary" : "text-muted-foreground"
                        }`}>
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                        </div>
                      </div>

                      {/* Answer (CSS grid trick giữ transition mượt) */}
                      <div className={`grid transition-all duration-500 ease-in-out ${
                        isExpanded ? "grid-rows-[1fr] opacity-100 mt-3 md:mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}>
                        <div className="overflow-hidden">
                          <p className="text-muted-foreground leading-relaxed text-sm md:text-[15px]">
                            {t(`faqPage.faqs.${idx}.answer`)}
                          </p>
                          {faq.hasAction && (
                            <div className="mt-4 md:mt-5">
                              <Link
                                to={faq.actionLink || "/login"}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
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
                </motion.div>
              );
            })}
          </div>

          {/* Contact sticky card */}
          <div className="lg:col-span-4 relative mt-4 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-28 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden group"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 dark:bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10 text-center">
                <div className="relative w-28 h-28 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <img
                    src="/image/avt5.png"
                    alt="Hugo Support"
                    className="relative z-10 w-full h-full object-contain drop-shadow-xl"
                  />
                  <div className="absolute bottom-2 right-4 z-20 w-4 h-4 bg-success border-2 border-white dark:border-background rounded-full shadow-sm" title="Online" />
                </div>

                <h3 className="font-display text-xl font-extrabold text-foreground mb-2">{t("faqPage.contact.title")}</h3>
                <p className="text-[13px] text-muted-foreground mb-8 px-2">{t("faqPage.contact.desc")}</p>

                <div className="space-y-3">
                  <a
                    href="https://zalo.me/0839909399"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>{t("faqPage.contact.chatBtn")}
                  </a>
                  <a
                    href="mailto:hugowishpax@gmail.com"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-muted hover:bg-muted/70 text-foreground/80 font-bold text-xs sm:text-sm transition-all border border-border/50"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span>{t("faqPage.contact.emailBtn")}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
