import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMember, loginMemberWithGoogle, isMemberAuthenticated } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import { IS_NATIVE } from "../../config/platform";

const LAST_EMAIL_KEY = "hugo_last_member_email";

// Brand wordmark. Colour is the identity and costs nothing to paint; the glow
// that used to sit behind each letter (`text-shadow: 0 0 50px`) did not — a
// blurred shadow per glyph is a separate raster pass on every repaint.
const WORDMARK = [
  [["H", "#EF4444"], ["u", "#F97316"], ["g", "#EAB308"], ["o", "#22C55E"]],
  [["S", "#3B82F6"], ["t", "#6366F1"], ["u", "#A855F7"], ["d", "#EC4899"], ["i", "#06B6D4"], ["o", "#0EA5E9"]],
];

// Full-screen, native-app-style login shown ONLY inside the installed PWA
// (standalone display mode) and the store builds. Members only: Google
// sign-in, plus one-tap Face ID / fingerprint when a credential is already
// saved on this device. The customer/project and admin flows live on the web
// LoginPage — the PWA is the phone app for members, so it stays deliberately
// single-purpose.
//
// Deliberately flat and static. The previous version painted four 60–80vw
// blobs at blur(80–120px) inside a `mix-blend-screen` group, each on an
// infinite transform animation: 3.99 device megapixels of blur — 1.35 whole
// screenfuls at 390x844@3x — recomposited every frame for as long as the
// screen was open. The blend mode was the worst part: it defeats GPU layer
// caching, so the group could not be cached and re-blended against the
// backdrop each frame. Measured on the real page, not guessed.
export default function PWALoginPage() {
  useHeadMeta({
    title: "Đăng nhập | Hugo Studio",
    description: "Đăng nhập ứng dụng Hugo Studio bằng Google.",
    canonicalUrl: "https://www.hugowishpax.studio/login",
    robots: "noindex, nofollow, noarchive",
  });

  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const initedRef = useRef(false);
  const [gisReady, setGisReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [configError, setConfigError] = useState(() =>
    import.meta.env.VITE_GOOGLE_CLIENT_ID ? "" : "Thiếu VITE_GOOGLE_CLIENT_ID."
  );
  const [nativeBusy, setNativeBusy] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  // One-tap biometric is offered only if this device already saved a credential.
  const [biometricEmail] = useState(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    return lastEmail && webauthnHelper.isSupported() && webauthnHelper.hasSavedDeviceFlag(lastEmail)
      ? lastEmail
      : "";
  });
  const [biometricBusy, setBiometricBusy] = useState(false);

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

  // Gates the Google one-tap prompt so it doesn't fire before the screen has
  // settled. Kept short — it is a scheduling delay, not an animation.
  useEffect(() => {
    const timer = setTimeout(() => setIntroFinished(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      showToast("Không nhận được thông tin từ Google. Thử lại nhé.", "error");
      return;
    }
    try {
      // `error` carries the server's reason ("credential không thuộc ứng dụng
      // này", "network", …). Swallowing it made every backend rejection look
      // like the same generic failure, which is useless when the store build
      // and the web build authenticate against different OAuth clients.
      const { session, error } = await loginMemberWithGoogle(response.credential);
      if (!session) {
        showToast(error === "network"
          ? "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."
          : error || "Đăng nhập Google thất bại. Thử lại nhé.", "error");
        return;
      }
      if (!(await isEduEmail(session.email))) {
        showToast("Tài khoản nên dùng email .edu để mở khóa đầy đủ quyền lợi sinh viên.", "warning");
      }
      localStorage.setItem(LAST_EMAIL_KEY, session.email);
      navigate("/member");
    } catch {
      showToast("Đăng nhập Google thất bại. Thử lại nhé.", "error");
    }
  };

  // Google Identity Services is a browser library: it validates the page origin
  // against the Console, and the WebView's origin is `capacitor://localhost`,
  // which Google will not accept as a JavaScript origin. The store builds go
  // through the OS account picker instead and hand back the same kind of ID
  // token, so everything downstream — including the server — is unchanged.
  const handleNativeGoogle = async () => {
    setNativeBusy(true);
    try {
      const { SocialLogin } = await import("@capgo/capacitor-social-login");
      await SocialLogin.initialize({
        google: {
          iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID,
          // Android's Credential Manager wants the *web* client id, and it is
          // what makes the returned token's `aud` match the web one there.
          webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        },
      });
      const { result } = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["email", "profile"] },
      });
      // Same shape the GSI callback produces, so one handler serves both.
      await handleGoogleCredential({ credential: result?.idToken });
    } catch (err) {
      // Closing the account sheet is a normal outcome, not an error worth a toast.
      if (!/cancel/i.test(err?.message || "")) {
        showToast("Không mở được đăng nhập Google. Thử lại nhé.", "error");
      }
    } finally {
      setNativeBusy(false);
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
    if (IS_NATIVE) return; // the store builds use handleNativeGoogle instead
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
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          use_fedcm_for_prompt: false,
        });
        initedRef.current = true;
      }
      googleButtonRef.current.innerHTML = "";
      // Measure the slot, don't guess from the viewport: the button sits inside
      // a max-w-sm card with its own padding, so `innerWidth - 72` overshot the
      // real width and Google clipped its own label.
      const slot = googleButtonRef.current.getBoundingClientRect().width;
      const width = Math.round(Math.min(400, Math.max(240, slot || window.innerWidth - 88)));
      try {
        googleId.renderButton(googleButtonRef.current, {
          theme: "filled_black",
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

      if (introFinished) googleId.prompt();

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

  return (
    <div
      className="pwa-login fixed inset-0 z-[200] flex flex-col overflow-y-auto bg-background text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
        zIndex={260}
      />

      {/* Hero */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="pwa-login-rise flex w-full max-w-sm flex-col items-center">
          <div className="mb-8 flex flex-col items-center font-display font-black uppercase tracking-[0.18em]">
            {WORDMARK.map((row, ri) => (
              <div key={ri} className="flex gap-1 text-5xl sm:text-6xl">
                {row.map(([char, color], i) => (
                  <span key={i} style={{ color }}>{char}</span>
                ))}
              </div>
            ))}
          </div>

          <div className="h-px w-10 bg-border" />
          <p className="mt-4 max-w-[280px] text-[13px] font-medium leading-relaxed text-muted-foreground">
            Không gian dành riêng cho thành viên, JOY và các tiện ích nội bộ của bạn.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="pwa-login-rise w-full px-5 pb-10" style={{ animationDelay: "60ms" }}>
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card p-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Chào mừng tới Hugo</h2>
            <p className="text-[13px] text-muted-foreground">Đăng nhập để vào hệ sinh thái của bạn</p>
          </div>

          <div className="w-full space-y-3">
            {/* Native has no GSI button to render — the OS draws the account
                picker — so it gets our own. */}
            {IS_NATIVE ? (
              <button
                onClick={handleNativeGoogle}
                disabled={nativeBusy}
                className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 font-semibold text-background transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {nativeBusy ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                ) : (
                  // Inline, not an asset: Google's brand guidelines require the
                  // G mark on a "Sign in with Google" button, and one <svg> is
                  // cheaper than a file the service worker has to cache.
                  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.9c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.3-10.2 7.3-17.5z" />
                    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.3 0 20 0 24s.9 7.7 2.6 10.8l7.8-6.1z" />
                    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
                  </svg>
                )}
                Tiếp tục với Google
              </button>
            ) : (
              // min-h reserves the slot: Google injects its button a beat after
              // paint, and without a reserved box everything under it jumped
              // (measured CLS 0.06).
              <div className="relative flex min-h-[44px] w-full items-center justify-center">
                <div
                  ref={googleButtonRef}
                  className="flex w-full justify-center overflow-hidden rounded-full [&>div]:w-full"
                />
                {!gisReady && !configError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
                    Đang thiết lập…
                  </div>
                )}
              </div>
            )}

            {!!biometricEmail && (
              <button
                onClick={handleBiometricLogin}
                disabled={biometricBusy}
                className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-full border border-border bg-muted px-6 font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-xl">
                  {biometricBusy ? "hourglass_top" : "fingerprint"}
                </span>
                Vân tay / Face ID
              </button>
            )}
          </div>

          {configError && (
            <p className="w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
              {configError}
            </p>
          )}

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <a href="/privacy-policy" className="underline underline-offset-2">Chính sách bảo mật</a>{" "}
            của Hugo Studio
          </p>
        </div>
      </div>
    </div>
  );
}
