import React, { useState, useEffect } from "react";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import HugoLogo from "../../components/HugoLogo";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";

// Hugo Studio Brand Logo component to match styling exactly

export default function BookingContactPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "Đặt Lịch & Liên Hệ | Hugo Studio",
    description: "Đặt lịch hẹn thiết kế website hoặc gửi tin nhắn trực tiếp cho Hugo Studio để nhận báo giá chi tiết trong vòng 24 giờ.",
    keywords: "đặt lịch thiết kế, liên hệ Hugo Studio, thiết kế web portfolio, thiết kế web cá nhân",
    canonicalUrl: "https://www.hugowishpax.studio/booking"
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: ""
  });
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(t("bookingPage.toast.success"), "success");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          message: ""
        });
      } else {
        showToast(t("bookingPage.toast.error"), "error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showToast(t("bookingPage.toast.networkError"), "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex flex-col justify-start lg:justify-center items-center px-4 py-8 md:py-16 text-foreground relative overflow-hidden">
      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {/* Two-column layout in desktop */}
      <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start relative">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        {/* Left Column: Branding / Process */}
        <div className="lg:col-span-5 space-y-6 relative z-10 text-center lg:text-left">
          {/* Brand Logo Header */}
          <div className="flex justify-center lg:justify-start items-center select-none">
            <HugoLogo className="text-xs font-black tracking-tight" />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">{t("bookingPage.header.title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">{t("bookingPage.header.desc")}</p>
          </div>

          {/* Feature List/Workflow */}
          <div className="hidden lg:block space-y-5 pt-4">
            {[
              { icon: "palette", color: "text-primary" },
              { icon: "bolt", color: "text-accent" },
              { icon: "chat_bubble", color: "text-emerald-500" }
            ].map((f, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <span className={`material-symbols-outlined ${f.color} text-lg mt-0.5`}>{f.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{t(`bookingPage.features.${idx}.title`)}</h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t(`bookingPage.features.${idx}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Form (Apple style segmented cards) */}
        <div className="lg:col-span-7 relative z-10 w-full">
          <div className="p-2 sm:p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Unified iOS List Panel */}
              <div className="divide-y divide-border/50 border-y border-border/60">
                
                {/* Full Name */}
                <div className="flex min-h-[56px] flex-col gap-1.5 px-0 py-3.5 md:flex-row md:items-center md:gap-4">
                  <label className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:w-44">{t("bookingPage.form.nameLabel")}</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder={t("bookingPage.form.namePlaceholder")}
                    className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Email */}
                <div className="flex min-h-[56px] flex-col gap-1.5 px-0 py-3.5 md:flex-row md:items-center md:gap-4">
                  <label className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:w-44">{t("bookingPage.form.emailLabel")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t("bookingPage.form.emailPlaceholder")}
                    className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="flex min-h-[56px] flex-col gap-1.5 px-0 py-3.5 md:flex-row md:items-center md:gap-4">
                  <label className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:w-44">{t("bookingPage.form.phoneLabel")}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder={t("bookingPage.form.phonePlaceholder")}
                    className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2 px-0 py-4">
                  <label className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t("bookingPage.form.messageLabel")}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t("bookingPage.form.messagePlaceholder")}
                    rows="4"
                    className="w-full resize-none bg-transparent text-xs font-semibold leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:text-sm"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary py-4 text-xs font-bold text-white transition-all hover:bg-primary/92 active:scale-99 sm:text-sm"
              >{t("bookingPage.form.submitBtn")}</button>

              {/* Apple-style Educational Disclaimer Card */}
              <div className="flex gap-2.5 border-t border-border/50 pt-4 text-left text-[10px] leading-relaxed text-muted-foreground">
                <span className="material-symbols-outlined text-accent shrink-0 text-base mt-0.5">info</span>
                <span>{t("bookingPage.form.disclaimer")}</span>
              </div>

            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
