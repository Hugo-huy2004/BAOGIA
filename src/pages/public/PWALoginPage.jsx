import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMember, isMemberAuthenticated } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";

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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_20px_50px_-12px_rgba(139,92,246,0.6)]"
          style={{ animation: "pwaFloat 5s ease-in-out infinite" }}
        >
          <span className="font-display text-4xl font-black text-white">H</span>
        </div>

        <div className="mb-2 flex select-none items-center justify-center gap-[1px] font-display text-sm font-black uppercase tracking-[0.22em]">
          {[["H", "#EF4444"], ["u", "#F97316"], ["g", "#EAB308"], ["o", "#22C55E"]].map(([c, col], i) => (
            <span key={i} style={{ color: col }}>{c}</span>
          ))}
          <span className="mx-1" />
          {[["S", "#3B82F6"], ["t", "#6366F1"], ["u", "#A855F7"], ["d", "#EC4899"], ["i", "#06B6D4"], ["o", "#0EA5E9"]].map(([c, col], i) => (
            <span key={i} style={{ color: col }}>{c}</span>
          ))}
        </div>
        <p className="max-w-xs text-[13px] font-medium leading-relaxed text-muted-foreground">
          Đăng nhập để vào không gian thành viên, JOY và các tiện ích của bạn.
        </p>
      </div>

      {/* Actions */}
      <div className="relative z-10 w-full px-6 pb-8">
        <div className="mx-auto w-full max-w-sm space-y-4">
          {/* Biometric quick login */}
          {biometricEmail && (
            <>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricBusy}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-foreground py-4 text-sm font-bold text-background shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-xl">fingerprint</span>
                {biometricBusy ? "Đang xác thực..." : "Đăng nhập nhanh bằng Face ID / vân tay"}
              </button>
              <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                <div className="h-px flex-1 bg-border/70" /> hoặc <div className="h-px flex-1 bg-border/70" />
              </div>
            </>
          )}

          {/* Google sign-in */}
          <div className="flex min-h-[48px] justify-center">
            <div ref={googleButtonRef} className="flex justify-center" />
          </div>

          {!gisReady && !configError && (
            <p className="text-center text-[11px] font-medium text-muted-foreground">Đang tải Google Sign-In...</p>
          )}
          {configError && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-center text-[11px] font-medium text-warning dark:text-amber-300">
              {configError}
            </div>
          )}

          <p className="px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            Ưu tiên email <span className="font-semibold text-foreground">.edu</span> để mở khóa đầy đủ quyền lợi sinh viên.
          </p>
        </div>
      </div>
    </div>
  );
}
