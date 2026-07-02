import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMember, isMemberAuthenticated } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { m, LazyMotion, domAnimation } from "framer-motion";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import HugoLogo from "../../components/HugoLogo";

const LAST_EMAIL_KEY = "hugo_last_member_email";

// Full-screen, native-app-style login shown ONLY inside the installed PWA
// (standalone display mode). Members only: Google sign-in, plus one-tap
// Face ID / fingerprint when a credential is already saved on this device.
// The customer/project and admin flows live on the web LoginPage — the PWA is
// the phone app for members, so it stays deliberately single-purpose.
export default function PWALoginPage() {
  useHeadMeta({
    title: "Đăng nhập | Hugo Studio",
    description: "Đăng nhập ứng dụng Hugo Studio bằng Google.",
  });

  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const initedRef = useRef(false);
  const [gisReady, setGisReady] = useState(false);
  const [configError, setConfigError] = useState(() =>
    import.meta.env.VITE_GOOGLE_CLIENT_ID ? "" : "Thiếu VITE_GOOGLE_CLIENT_ID."
  );
  const [toast, setToast] = useState({ message: "", type: "" });
  // One-tap biometric is offered only if this device already saved a credential.
  const [biometricEmail] = useState(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    return lastEmail && webauthnHelper.isSupported() && webauthnHelper.hasSavedDeviceFlag(lastEmail)
      ? lastEmail
      : "";
  });
  const [biometricBusy, setBiometricBusy] = useState(false);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  // Already signed in? Skip the login screen entirely.
  useEffect(() => {
    if (isMemberAuthenticated()) navigate("/member", { replace: true });
  }, [navigate]);

  const showToast = (message, type = "error") => setToast({ message, type });

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => setToast({ message: "", type: "" }), 4500);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      showToast("Không nhận được thông tin từ Google. Thử lại nhé.", "error");
      return;
    }
    try {
      const payloadJson = atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"));
      const profile = JSON.parse(payloadJson);
      const email = profile.email || "";
      if (!(await isEduEmail(email))) {
        showToast("Tài khoản nên dùng email .edu để mở khóa đầy đủ quyền lợi sinh viên.", "warning");
      }
      loginMember({
        email: profile.email,
        displayName: profile.name,
        provider: "google",
        avatarUrl: profile.picture,
      });
      localStorage.setItem(LAST_EMAIL_KEY, profile.email);
      navigate("/member");
    } catch {
      showToast("Đăng nhập Google thất bại. Thử lại nhé.", "error");
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricEmail) return;
    setBiometricBusy(true);
    try {
      const member = await webauthnHelper.loginWithBiometric(biometricEmail);
      loginMember(member);
      localStorage.setItem(LAST_EMAIL_KEY, biometricEmail);
      navigate("/member");
    } catch (err) {
      if (err?.code === "NO_CREDENTIALS") {
        showToast("Thiết bị này chưa bật đăng nhập vân tay cho email đó.", "warning");
      } else if (err?.name !== "NotAllowedError") {
        showToast("Không dùng được vân tay/Face ID. Hãy đăng nhập bằng Google.", "error");
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  // Render the Google Identity Services button once the script is ready.
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // configError already set from the lazy initializer
    let cancelled = false;
    let timer = null;
    let timeout = null;
    let kick = null;

    const tryInit = () => {
      if (cancelled) return;
      const googleId = window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return;

      if (!initedRef.current) {
        googleId.initialize({ client_id: clientId, callback: handleGoogleCredential });
        initedRef.current = true;
      }
      googleButtonRef.current.innerHTML = "";
      const width = Math.min(360, Math.max(240, window.innerWidth - 72));
      try {
        googleId.renderButton(googleButtonRef.current, {
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width,
        });
      } catch {
        setConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
        if (timer) window.clearInterval(timer);
        return;
      }
      setGisReady(true);
      if (timer) window.clearInterval(timer);
      if (timeout) window.clearTimeout(timeout);
    };

    // Kick asynchronously (not synchronously in the effect body) so state
    // updates never trigger a cascading render.
    kick = window.setTimeout(tryInit, 0);
    timer = window.setInterval(tryInit, 250);
    timeout = window.setTimeout(() => {
      if (!cancelled && !initedRef.current) {
        setConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}.`);
        window.clearInterval(timer);
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(kick);
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-black text-white"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <style>{`
          @keyframes aurora {
            0% { background-position: 50% 50%, 50% 50%; }
            50% { background-position: 100% 50%, 0% 50%; }
            100% { background-position: 50% 50%, 50% 50%; }
          }
          .aurora-bg {
            background-image: 
              radial-gradient(circle at top left, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
            background-size: 200% 200%;
            animation: aurora 15s ease infinite;
          }
        `}</style>

        {/* Ambient brand glows */}
        <div className="absolute inset-0 aurora-bg pointer-events-none" />
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-pink-600/10 blur-[100px]" />

        <HugoNoticeToast
          open={Boolean(toast.message)}
          type={toast.type || "info"}
          message={toast.message}
          onClose={() => setToast({ message: "", type: "" })}
          zIndex={260}
        />

        {/* Hero - Cinematic Typography */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <m.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-center w-full max-w-sm mx-auto"
          >
            {/* Split "HUGO STUDIO" into animated characters */}
            <div className="mb-8 flex flex-col items-center justify-center font-display font-black uppercase tracking-[0.25em] sm:tracking-[0.3em]">
              <div className="flex gap-1 mb-2 text-5xl sm:text-6xl md:text-7xl">
                {[["H", "#EF4444"], ["u", "#F97316"], ["g", "#EAB308"], ["o", "#22C55E"]].map(([c, col], i) => (
                  <m.span 
                    key={i} 
                    variants={itemVariants}
                    style={{ 
                      color: `${col}EE`,
                      textShadow: `0 0 40px ${col}80, 0 4px 12px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {c}
                  </m.span>
                ))}
              </div>
              <div className="flex gap-0.5 text-3xl sm:text-4xl md:text-5xl mt-2 opacity-90">
                {[["S", "#3B82F6"], ["t", "#6366F1"], ["u", "#A855F7"], ["d", "#EC4899"], ["i", "#06B6D4"], ["o", "#0EA5E9"]].map(([c, col], i) => (
                  <m.span 
                    key={i} 
                    variants={itemVariants}
                    style={{ 
                      color: `${col}DD`,
                      textShadow: `0 0 30px ${col}60`,
                    }}
                  >
                    {c}
                  </m.span>
                ))}
              </div>
            </div>

            <m.div variants={itemVariants} className="space-y-4 max-w-[280px]">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
              <p className="text-[12px] sm:text-[13px] font-medium leading-relaxed text-white/60 tracking-wider">
                Không gian dành riêng cho thành viên, JOY và các tiện ích nội bộ của bạn.
              </p>
            </m.div>
          </m.div>
        </div>

        {/* Actions - Bottom Sheet */}
        <m.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full px-6 pb-12 pt-8"
        >
          <div className="mx-auto w-full max-w-sm p-6 bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.05] rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6">
            {/* Biometric quick login */}
            {biometricEmail && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricBusy}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 border border-white/5"
                >
                  <span className="material-symbols-outlined text-xl">fingerprint</span>
                  {biometricBusy ? "Đang xác thực..." : "Face ID / Vân tay"}
                </button>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <div className="h-px flex-1 bg-white/10" />
                  HOẶC
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Google sign-in */}
              <div className="flex min-h-[48px] justify-center items-center">
                <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-500 w-full [&>div]:w-full" />
                {!gisReady && !configError && (
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50 animate-pulse">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Đang kết nối...
                  </div>
                )}
              </div>

              {configError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-[10px] font-medium text-red-400">
                  {configError}
                </div>
              )}
              
              <p className="text-center text-[10px] leading-relaxed text-white/40">
                Ưu tiên sử dụng email <span className="font-bold text-white/80">.edu</span> để truy cập quyền lợi đặc quyền sinh viên.
              </p>
            </div>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  );
}
