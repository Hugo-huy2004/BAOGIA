import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { loginMemberWithGoogle } from "../../services/authSession";
import { isEduEmail } from "../../utils/eduEmail";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";

export default function StudentBenefitsPage() {
  const { t } = useTranslation();

  useHeadMeta({
    title: t("studentBenefitsPage.metaTitle"),
    description: t("studentBenefitsPage.metaDesc"),
    keywords: "Student Bio, Bio Link miễn phí, email edu, trang cá nhân, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/student-benefits",
  });

  const navigate = useNavigate();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [gisReady, setGisReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const googleButtonRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleGoogleCredential = async (response) => {
    setToast({ message: "", type: "" });

    if (!response?.credential) {
      showToast(t("studentBenefitsPage.toastFail"), "error");
      return;
    }

    const { session, error } = await loginMemberWithGoogle(response.credential);
    if (!session) {
      showToast(error === "network" ? t("studentBenefitsPage.toastNetwork") : t("studentBenefitsPage.toastFail"), "error");
      return;
    }

    const isEdu = await isEduEmail(session.email);
    if (!isEdu) {
      showToast(
        t("studentBenefitsPage.toastPending"),
        "warning",
      );
    }

    navigate("/member");
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setGisReady(false);
    setGoogleConfigError("");
    if (!clientId || !googleButtonRef.current) return;

    let cancelled = false;
    let timer = null;
    let timeout = null;

    const tryInitGoogle = () => {
      if (cancelled) return;

      const googleId = window.google?.accounts?.id;
      if (!googleId) return;

      setGisReady(true);
      if (!window.__googleInitializedForStudent) {
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          // One Tap: tự động gợi ý tài khoản đang đăng nhập trên trình duyệt
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        window.__googleInitializedForStudent = true;
        // Kích hoạt One Tap popup tự động
        googleId.prompt((notification) => {
          // One Tap bị tắt hoặc không có tài khoản phù hợp -> dùng nút thường
        });
      }

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
        try {
          googleId.renderButton(googleButtonRef.current, {
            theme: document.documentElement.classList.contains("dark")
              ? "filled_black"
              : "outline",
            size: "large",
            width: 280,
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left",
          });
        } catch (error) {
          setGoogleConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
          if (timer) window.clearInterval(timer);
          return;
        }
      }

      if (timer) window.clearInterval(timer);
      if (timeout) window.clearTimeout(timeout);
    };

    timer = window.setInterval(tryInitGoogle, 250);
    timeout = window.setTimeout(() => {
      if (!cancelled) {
        setGoogleConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}. Hãy thêm origin này vào Google Cloud Console.`);
        window.clearInterval(timer);
      }
    }, 4000);
    tryInitGoogle();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
      // Reset flag khi unmount
      window.__googleInitializedForStudent = false;
    };
  }, []);

  const benefits = [
    {
      icon: "favorite",
      title: t("studentBenefitsPage.benefits.free.title"),
      desc: t("studentBenefitsPage.benefits.free.desc"),
      color: "text-primary",
    },
    {
      icon: "palette",
      title: t("studentBenefitsPage.benefits.creative.title"),
      desc: t("studentBenefitsPage.benefits.creative.desc"),
      color: "text-secondary",
    },
    {
      icon: "flash_on",
      title: t("studentBenefitsPage.benefits.fast.title"),
      desc: t("studentBenefitsPage.benefits.fast.desc"),
      color: "text-accent",
    },
    {
      icon: "fingerprint",
      title: t("studentBenefitsPage.benefits.yours.title"),
      desc: t("studentBenefitsPage.benefits.yours.desc"),
      color: "text-success",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center py-8 px-4 text-foreground relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 dark:bg-accent/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-success/5 dark:bg-success/10 rounded-full blur-[100px] pointer-events-none" />

      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <div className="max-w-6xl w-full grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 items-center relative z-10">
        {/* Left Column: Hero & Benefits */}
        <div className="space-y-6">
          <div className="space-y-4 text-center lg:text-left">
            <Link
              to="/services"
              className="brand-chip w-max mx-auto lg:mx-0 hover:border-primary/25 hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              {t("studentBenefitsPage.backToServices")}
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                {t("studentBenefitsPage.giftSpark")}
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                {t("studentBenefitsPage.title")}
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground lg:mx-0">
                {t("studentBenefitsPage.desc")}
              </p>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="flex flex-col items-center justify-center gap-4 border-y border-border/60 py-4 sm:flex-row sm:gap-6 lg:justify-start">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                {t("studentBenefitsPage.marketValue")}
              </p>
              <p className="text-lg font-bold text-muted-foreground/70 line-through decoration-muted-foreground/40">
                {t("studentBenefitsPage.marketPrice")}<span className="text-xs font-normal">{t("studentBenefitsPage.perYear")}</span>
              </p>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block"></div>
            <div className="text-center sm:text-left">
              <p className="mb-0.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary sm:justify-start">
                <span className="material-symbols-outlined text-[14px]">
                  favorite
                </span>{" "}
                {t("studentBenefitsPage.giftToYou")}
              </p>
              <p className="text-2xl font-black text-foreground">
                {t("studentBenefitsPage.giftPrice")}<span className="text-sm font-medium">{t("studentBenefitsPage.priceless")}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="group relative border-b border-border/50 pb-4 transition-all duration-300 last:border-b-0 sm:pb-5"
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted/50 text-foreground transition-transform group-hover:scale-105"
                >
                  <span className="material-symbols-outlined text-xl">
                    {benefit.icon}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  {benefit.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="relative mt-4 flex justify-center lg:justify-end lg:mt-0">
          <div className="relative w-full max-w-[380px] border-t border-border/60 pt-6 sm:pt-8">
            <div className="text-center space-y-3 mb-8">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-md bg-muted/50">
                <span className="material-symbols-outlined text-3xl text-primary">
                  school
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("studentBenefitsPage.verificationTitle")}
                </h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
                  {t("studentBenefitsPage.verificationDesc")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-5">
              <div className="w-full flex flex-col items-center gap-4">
                {/* Google Sign-In Button */}
                <div
                  ref={googleButtonRef}
                  className="flex justify-center min-h-[44px]"
                />

                <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border"></div>
                  <span>{t("studentBenefitsPage.orManual")}</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>

                <button
                  onClick={() => {
                    const googleId = window.google?.accounts?.id;
                    if (googleId) {
                      // Hủy prompt cũ (nếu có bị treo) trước khi gọi prompt mới để tránh lỗi FedCM outstanding request
                      googleId.cancel(); 
                      setTimeout(() => googleId.prompt(), 100);
                    }
                  }}
                  className="w-full border-b border-primary/30 px-1 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/5"
                >
                  {t("studentBenefitsPage.clickSelect")}
                </button>
              </div>

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="text-[10px] text-center text-red-500 font-medium">
                  {t("studentBenefitsPage.warningClientId")}
                </p>
              )}

              {googleConfigError && (
                <div className="w-full border-l-2 border-warning/40 bg-warning/8 px-4 py-3 text-left text-[10px] text-warning dark:text-amber-300">
                  <p className="font-semibold">{googleConfigError}</p>
                  <p className="mt-1 text-muted-foreground">{t("studentBenefitsPage.originError")}</p>
                </div>
              )}

              <p className="text-[10px] text-center text-muted-foreground font-medium">
                {googleConfigError 
                  ? t("studentBenefitsPage.blockedByOauth") 
                  : gisReady 
                    ? t("studentBenefitsPage.ready") 
                    : t("studentBenefitsPage.loading")}
              </p>

              <div className="flex w-full gap-2.5 border-t border-border/50 pt-3.5 text-left text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-primary">
                  shield_person
                </span>
                <p>
                  {t("studentBenefitsPage.securityDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
