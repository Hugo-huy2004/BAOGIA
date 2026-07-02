import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMember, isMemberAuthenticated } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
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

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-white dark:bg-[#0a0a12] text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <style>{`
        @keyframes pwaFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Ambient brand glows */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
        zIndex={260}
      />

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center space-y-8 mt-12">
        {/* Glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 bg-primary/20 blur-[60px] pointer-events-none" />

        {/* The core text logo, large and beautiful */}
        <div 
          className="relative group cursor-default"
          style={{ animation: "pwaFloat 6s ease-in-out infinite" }}
        >
          <HugoLogo className="text-5xl sm:text-6xl tracking-[0.2em] md:tracking-[0.25em]" />
          {/* Subtle reflection under the text */}
          <div className="absolute -bottom-6 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent opacity-80" />
        </div>

        <div className="space-y-4 max-w-[280px] mx-auto animate-fadeIn" style={{ animationDelay: "300ms" }}>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-border/60 to-transparent mx-auto" />
          <p className="text-[13px] font-medium leading-relaxed text-muted-foreground/90 tracking-wide">
            Không gian dành riêng cho thành viên, JOY và các tiện ích nội bộ của bạn.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 w-full px-6 pb-12">
        <div className="mx-auto w-full max-w-sm p-6 bg-card/40 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] space-y-6">
          {/* Biometric quick login */}
          {biometricEmail && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricBusy}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-foreground py-3.5 text-sm font-bold text-background shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-xl">fingerprint</span>
                {biometricBusy ? "Đang xác thực..." : "Face ID / Vân tay"}
              </button>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="h-px flex-1 bg-border/50" />
                HOẶC TIẾP TỤC BẰNG
                <div className="h-px flex-1 bg-border/50" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Google sign-in */}
            <div className="flex min-h-[48px] justify-center items-center">
              <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-500" />
              {!gisReady && !configError && (
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Đang tải Google...
                </div>
              )}
            </div>

            {configError && (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-center text-[10px] font-medium text-warning">
                {configError}
              </div>
            )}
            
            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              Vui lòng sử dụng tài khoản email <span className="font-bold text-foreground">.edu</span> để được ưu tiên truy cập đầy đủ tiện ích sinh viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
