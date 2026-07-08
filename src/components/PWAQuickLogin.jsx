import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isMemberAuthenticated, loginMember } from "../services/authSession";
import { webauthnHelper } from "../utils/webauthnHelper";
import { autoBluePrintPWAPermissions } from "../utils/pwaPermissions";

const LAST_EMAIL_KEY = "hugo_last_member_email";

function isStandalonePWA() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

// Opening the installed PWA when logged out lands on the marketing
// /introduction page (the manifest start_url), not on /login — so the
// biometric quick-login button that already lives on LoginPage was
// effectively invisible until someone manually navigated there. This floats
// the same one-tap Face ID/fingerprint login on top of whatever page the PWA
// opened to, but only when it's actually usable (installed, logged out,
// WebAuthn supported, a credential already saved for this device).
export default function PWAQuickLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isMemberAuthenticated() || !isStandalonePWA()) return;
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail && webauthnHelper.isSupported() && webauthnHelper.hasSavedDeviceFlag(lastEmail)) {
      setEmail(lastEmail);
    }
  }, []);

  // The PWA login page already offers a full-size biometric button, so don't
  // float this one on top of it.
  if (!email || dismissed || location.pathname === "/login") return null;

  const handleLogin = async () => {
    setBusy(true);
    try {
      const member = await webauthnHelper.loginWithBiometric(email);
      loginMember(member);
      localStorage.setItem(LAST_EMAIL_KEY, email);
      autoBluePrintPWAPermissions().catch(() => {});
      navigate("/member");
    } catch (err) {
      if (err?.name !== "NotAllowedError") setDismissed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-[150] flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <div className="flex items-center gap-3 bg-foreground text-background rounded-full pl-2 pr-2 py-2 shadow-2xl max-w-sm w-full">
        <button
          onClick={handleLogin}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-primary text-primary-foreground font-bold text-xs active:scale-95 transition-all disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">fingerprint</span>
          {busy ? "Đang xác thực..." : `Đăng nhập nhanh (${email})`}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Đóng"
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}
