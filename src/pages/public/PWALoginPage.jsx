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
  const [introFinished, setIntroFinished] = useState(false);
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

  // Cinematic Intro Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroFinished(true);
    }, 2800); // 2.8s intro sequence
    return () => clearTimeout(timer);
  }, []);

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
          theme: "outline", // Outline works best on pure black
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
      
      // SMART ONE-TAP: Automatically prompt after intro if not on mobile standalone, or always prompt
      if (introFinished) {
        googleId.prompt();
      }

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
  }, [introFinished]); // Re-run when intro finishes to trigger prompt

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(20px)", scale: 0.8 },
    show: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
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
          @keyframes float1 {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30%, 20%) scale(1.2); }
            66% { transform: translate(-20%, 40%) scale(0.9); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float2 {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-30%, -20%) scale(1.1); }
            66% { transform: translate(20%, -40%) scale(1.3); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float3 {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(40%, -30%) scale(0.8); }
            66% { transform: translate(-40%, 20%) scale(1.2); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Ambient Plasma Background - Fades in dynamically */}
        <div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 3, delay: 0.5 }}
          className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen"
        >
          <div 
            className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/30 blur-[80px]"
            style={{ animation: 'float1 12s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/30 blur-[100px]"
            style={{ animation: 'float2 15s ease-in-out infinite' }}
          />
          <div 
            className="absolute -bottom-[10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-pink-600/30 blur-[120px]"
            style={{ animation: 'float3 18s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-[40%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/20 blur-[90px]"
            style={{ animation: 'float1 20s ease-in-out infinite reverse' }}
          />
        </div>

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
            <div className="mb-10 flex flex-col items-center justify-center font-display font-black uppercase tracking-[0.2em] sm:tracking-[0.25em]">
              <div className="flex gap-1.5 mb-1 text-6xl sm:text-7xl md:text-8xl">
                {[["H", "#EF4444"], ["u", "#F97316"], ["g", "#EAB308"], ["o", "#22C55E"]].map(([c, col], i) => (
                  <m.span 
                    key={i} 
                    variants={itemVariants}
                    style={{ 
                      color: `${col}EE`,
                      textShadow: `0 0 50px ${col}80, 0 8px 16px rgba(0,0,0,0.6)`,
                    }}
                  >
                    {c}
                  </m.span>
                ))}
              </div>
              <div className="flex gap-1 text-6xl sm:text-7xl md:text-8xl mt-1">
                {[["S", "#3B82F6"], ["t", "#6366F1"], ["u", "#A855F7"], ["d", "#EC4899"], ["i", "#06B6D4"], ["o", "#0EA5E9"]].map(([c, col], i) => (
                  <m.span 
                    key={i} 
                    variants={itemVariants}
                    style={{ 
                      color: `${col}DD`,
                      textShadow: `0 0 50px ${col}70, 0 8px 16px rgba(0,0,0,0.6)`,
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
          initial={{ opacity: 0, y: 100, filter: "blur(20px)" }}
          animate={introFinished ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1, type: "spring", bounce: 0.3 }}
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
              {/* Premium Google sign-in wrapper */}
              <div className="relative group flex justify-center items-center">
                {/* Animated glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-30 group-hover:opacity-70 blur-md transition-opacity duration-500" style={{ animation: "spin-slow 4s linear infinite" }} />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20" />
                
                <div className="relative bg-black rounded-full flex justify-center p-[1px] w-full max-w-[360px]">
                  <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-500 w-full rounded-full overflow-hidden" />
                </div>
                
                {!gisReady && !configError && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50 animate-pulse pointer-events-none">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Đang thiết lập...
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
