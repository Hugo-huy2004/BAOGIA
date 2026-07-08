import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const reveal = {
  variants: fadeUp,
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-72px" },
};

function MonoIcon({ name, className = "" }) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-foreground ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">{name}</span>
    </span>
  );
}

export default function StudentPricingPage() {
  const { t, i18n } = useTranslation();

  const [courseworkStack, setCourseworkStack] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("stack") || "react";
  });

  useHeadMeta({
    title: "Bảng Giá Đặc Quyền HSSV | Hugo Studio",
    description: "Bảng giá và các gói lập trình web thiết kế riêng cho Học sinh Sinh viên. Hỗ trợ coursework bài tập lớn, bento portfolio giá rẻ, cam kết liêm chính học thuật.",
    keywords: "bảng giá sinh viên, coursework, bài tập lớn, bento portfolio, thiết kế web sinh viên, ưu đãi học sinh",
    canonicalUrl: "https://www.hugowishpax.studio/student-pricing",
  });

  const studentPlans = useMemo(() => {
    const plansKeys = ["bug", "bento", "coursework"];
    const icons = ["handyman", "contact_page", "code"];
    return plansKeys.map((key, index) => {
      const planData = t(`servicesPage.studentPlans.${key}`, { returnObjects: true });
      return {
        id: key,
        icon: icons[index],
        ...planData,
      };
    });
  }, [t]);

  const verificationSteps = useMemo(() => {
    return [
      {
        icon: "alternate_email",
        title: i18n.language.startsWith("vi") ? "Xác minh Email Trường" : "School Email verification",
        desc: i18n.language.startsWith("vi")
          ? "Sử dụng hòm thư sinh viên đuôi .edu hoặc .edu.vn để đăng ký và gửi liên hệ."
          : "Use your student email address ending with .edu or .edu.vn for queries.",
      },
      {
        icon: "badge",
        title: i18n.language.startsWith("vi") ? "Thẻ Sinh Viên Chính Chủ" : "Valid Student Card",
        desc: i18n.language.startsWith("vi")
          ? "Cung cấp hình ảnh thẻ học sinh/sinh viên còn hiệu lực trùng tên với người liên hệ."
          : "Provide a photo of your current student ID card matching your contact details.",
      },
      {
        icon: "history_edu",
        title: i18n.language.startsWith("vi") ? "Cam Kết Liêm Chính Học Thuật" : "Academic Integrity Pledge",
        desc: i18n.language.startsWith("vi")
          ? "Bạn phải tự nghiên cứu code và tự viết báo cáo (Report). Mình chỉ code và hướng dẫn luồng chạy."
          : "You must study the code and draft your own reports. I only write code and explain architecture.",
      },
    ];
  }, [i18n.language]);

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-20 text-foreground transition-colors duration-300">
      {/* Background glow filters */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-primary/15 to-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-info/10 to-primary/15 blur-[130px] pointer-events-none" />

      {/* Watermark background text */}
      <div className="absolute right-[-2%] top-[4%] text-[8rem] md:text-[13rem] font-black text-foreground/[0.03] dark:text-foreground/[0.02] pointer-events-none select-none tracking-tighter leading-none uppercase">
        STUDENT
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Back Link */}
        <div className="mb-6 flex justify-start">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {i18n.language.startsWith("vi") ? "Quay lại Dịch vụ" : "Back to Services"}
          </Link>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="material-symbols-outlined text-[13px]">school</span>
            {i18n.language.startsWith("vi") ? "Đặc Quyền Người Học" : "Academic Specials"}
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
            {i18n.language.startsWith("vi") ? "Bảng Giá Dịch Vụ" : "Services & Pricing"}{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-primary to-accent bg-clip-text text-transparent">
              Dành Riêng HSSV
            </span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {i18n.language.startsWith("vi")
              ? "Hỗ trợ xây dựng giao diện, viết logic code bài tập cuối kỳ (Coursework). Không làm luận văn tốt nghiệp, không làm báo cáo hộ để đảm bảo quy chế học tập."
              : "Technical implementation for end-of-term coursework assignments. Absolutely no report writing or graduation thesis projects to preserve academic integrity."}
          </p>
        </div>

        {/* 3 Student Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {studentPlans.map((plan) => {
            const isCoursework = plan.id === "coursework";
            const currentStackData = isCoursework ? plan.stacks[courseworkStack] : null;
            const displayPrice = isCoursework ? currentStackData.price : plan.price;
            const displayOldPrice = isCoursework ? currentStackData.oldPrice : plan.oldPrice;
            const displayDiscount = isCoursework ? currentStackData.discount : plan.discount;
            const displayNote = isCoursework ? currentStackData.note : plan.note;
            const displayDesc = isCoursework ? currentStackData.desc : plan.desc;
            const displayIncludes = isCoursework ? currentStackData.includes : plan.includes;

            return (
              <motion.div
                {...reveal}
                key={plan.id}
                className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <MonoIcon name={plan.icon} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
                    {displayDiscount && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {displayDiscount}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display mt-5 text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                  {/* Tech Stack selector pills */}
                  {isCoursework && (
                    <div className="mt-4 flex flex-wrap gap-1 p-1 rounded-2xl bg-muted/80 border border-border relative z-10">
                      {[
                        { id: "html", label: "HTML/CSS/JS" },
                        { id: "php", label: "PHP/SQL" },
                        { id: "react", label: "React/Node" }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setCourseworkStack(s.id)}
                          className={`flex-1 rounded-xl px-2 py-1.5 text-[9px] font-bold uppercase transition-all duration-200 ${
                            courseworkStack === s.id
                              ? "bg-foreground text-background shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">{displayPrice}</span>
                    {displayOldPrice && (
                      <span className="text-xs text-muted-foreground line-through">{displayOldPrice}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/80 leading-normal">{displayNote}</p>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{displayDesc}</p>
                  <div className="mt-6 border-t border-border/60 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {i18n.language.startsWith("vi") ? "Hạng mục bao gồm:" : "What's included:"}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {displayIncludes?.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                          <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 border-t border-border/60 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      {i18n.language.startsWith("vi") ? "Không bao gồm:" : "Not included:"}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {plan.excludes?.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground/80">
                          <span className="material-symbols-outlined text-rose-500 text-sm mt-0.5">cancel</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-8">
                  <Link
                    to={
                      isCoursework
                        ? `/booking?type=student&plan=coursework&stack=${courseworkStack}`
                        : `/booking?type=student&plan=${plan.id}`
                    }
                    className="block w-full text-center rounded-2xl bg-foreground py-3 text-xs font-bold text-background transition-all hover:bg-foreground/90 active:scale-98"
                  >
                    {i18n.language.startsWith("vi") ? "Đăng ký gói sinh viên" : "Order Student Plan"}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Verification Requirements Section */}
        <motion.div
          {...reveal}
          className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl md:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-accent" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center">
            {i18n.language.startsWith("vi") ? "Điều Kiện Xác Minh Để Nhận Ưu Đãi" : "Verification & Order Guidelines"}
          </h2>
          <p className="mt-3 text-xs text-muted-foreground text-center max-w-xl mx-auto">
            {i18n.language.startsWith("vi")
              ? "Để bảo đảm quyền lợi được đưa tới đúng đối tượng học sinh, sinh viên học tập thực tế và chống lạm dụng thương mại."
              : "To ensure these educational discounts are delivered purely to active students and prevent commercial proxying."}
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {verificationSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-border/80 bg-background/50 p-5 relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
