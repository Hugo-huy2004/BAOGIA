import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginAdmin, loginMember, loginMemberWithGoogle } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { autoBluePrintPWAPermissions } from "../../utils/pwaPermissions";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";

const LAST_EMAIL_KEY = "hugo_last_member_email";

export default function LoginPage() {
  const { t } = useTranslation();
  const { data } = useData();
  const allowRegistration = data?.systemSettings?.allowRegistration !== false;
  useHeadMeta({
    title: "Đăng Nhập | Hugo Studio",
    description: "Đăng ký Bio Link sinh viên miễn phí với email .edu hoặc đăng nhập trang quản trị viên của Hugo Studio.",
    keywords: "đăng nhập Hugo Studio, tạo Bio sinh viên, đăng nhập quản trị, Bio Link edu",
    canonicalUrl: "https://www.hugowishpax.studio/login"
  });

  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState(allowRegistration ? "member" : "customer");
  const [adminForm, setAdminForm] = useState({ username: "admin", password: "" });
  const [adminFieldErrors, setAdminFieldErrors] = useState({ username: "", password: "" });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [rememberAdmin, setRememberAdmin] = useState(true);
  const [customerCode, setCustomerCode] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [gisReady, setGisReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const googleButtonRef = useRef(null);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState("");
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
    // PWAQuickLogin already shows a floating biometric button in standalone mode —
    // skip here to avoid showing two identical fingerprint/Face ID options.
    const inPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (inPWA) return;
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail && webauthnHelper.isSupported() && webauthnHelper.hasSavedDeviceFlag(lastEmail)) {
      setBiometricEmail(lastEmail);
      setShowBiometricOption(true);
    }
  }, []);

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

  useEffect(() => {
    if (!allowRegistration && activeMode === "member") {
      setActiveMode("admin");
    }
  }, [allowRegistration, activeMode]);

  const handleGoogleCredential = async (response) => {
    setToast({ message: "", type: "" });

    if (!response?.credential) {
      showToast(t("loginPage.toast.noGoogle"), "error");
      return;
    }

    // Server verifies the Google ID token and issues our session token —
    // the client never decides identity from a decoded payload.
    const { session, error } = await loginMemberWithGoogle(response.credential);
    if (!session) {
      showToast(error === "network" ? t("loginPage.toast.adminNetworkError") : t("loginPage.toast.noGoogle"), "error");
      return;
    }

    const isEdu = await isEduEmail(session.email);
    if (!isEdu) {
      showToast(
        t("loginPage.toast.eduRedirect"),
        "warning"
      );
    }

    localStorage.setItem(LAST_EMAIL_KEY, session.email);
    autoBluePrintPWAPermissions().catch(() => {});

    navigate("/member");
  };

  const handleBiometricLogin = async () => {
    if (!biometricEmail) return;
    setBiometricBusy(true);
    try {
      const member = await webauthnHelper.loginWithBiometric(biometricEmail);
      loginMember(member);
      localStorage.setItem(LAST_EMAIL_KEY, biometricEmail);
      autoBluePrintPWAPermissions().catch(() => {});
      navigate("/member");
    } catch (err) {
      if (err?.code === 'NO_CREDENTIALS') {
        showToast(t("loginPage.biometric.notEnabled"), "warning");
      } else if (err?.name !== 'NotAllowedError') {
        showToast(t("loginPage.biometric.failed"), "error");
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  useEffect(() => {
    if (activeMode !== "member") return;

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
      if (!window.__googleInitialized) {
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          use_fedcm_for_prompt: false
        });
        window.__googleInitialized = true;
      }

      googleButtonRef.current.innerHTML = "";
      try {
        googleId.renderButton(googleButtonRef.current, {
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "continue_with"
        });
      } catch (error) {
        setGoogleConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
        if (timer) window.clearInterval(timer);
        return;
      }

      if (timer) {
        window.clearInterval(timer);
      }
      if (timeout) {
        window.clearTimeout(timeout);
      }
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
    };
  }, [activeMode]);

  const handleMemberLogin = (e) => {
    e.preventDefault();
    showToast(t("loginPage.toast.useGoogleBtn"), "warning");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });

    const fieldErrors = {
      password: adminForm.password ? "" : t("loginPage.adminForm.passRequired")
    };
    setAdminFieldErrors(fieldErrors);
    if (fieldErrors.password) return;

    setAdminSubmitting(true);
    try {
      const { session, error } = await loginAdmin({ username: "admin", password: adminForm.password }, { remember: rememberAdmin });
      if (!session) {
        if (error === "network") {
          showToast(t("loginPage.toast.adminNetworkError"), "error");
        } else if (error === "server_error") {
          showToast(t("loginPage.toast.adminServerError"), "error");
        } else {
          setAdminFieldErrors({ username: "", password: " " });
          showToast(t("loginPage.toast.adminError"), "error");
        }
        return;
      }
      navigate("/admin");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    if (!customerCode || customerCode.trim().length !== 6) {
      showToast(t("loginPage.toast.codeLength"), "error");
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loginCode: customerCode })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi đăng nhập');
      
      // Save project data to session storage for the Quản trị dự án to use
      sessionStorage.setItem('customerProject', JSON.stringify(data.project));
      navigate("/customer-portal");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("portalCode");
    if (code && code.length === 6) {
      setActiveMode("customer");
      setCustomerCode(code);
      autoLoginCustomer(code);
    }
    if (params.get("reason") === "location_anomaly") {
      showToast(t("loginPage.toast.locationAnomaly"), "warning");
    }
  }, []);

  const autoLoginCustomer = async (code) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loginCode: code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi đăng nhập portal');
      
      sessionStorage.setItem('customerProject', JSON.stringify(data.project));
      navigate("/customer-portal");
    } catch (error) {
      showToast(t("loginPage.toast.invalidLink"), "error");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 text-foreground transition-colors duration-300">

      {/* Background glows — đồng bộ Hugo Studio */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-info/10 to-primary/10 blur-[130px] pointer-events-none" />

      {/* Ambient orbs — đồng bộ FAQ/Introduction */}
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
        LOGIN
      </div>

      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <section className="w-full max-w-md space-y-6 relative">
        <div className="text-center relative z-10 space-y-3">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] bg-primary/10 text-primary border border-primary/25 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Hugo Studio
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] transition-all">
            <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent animate-gradientShift">
              {activeMode === "customer" ? t("loginPage.header.titleCustomer") : activeMode === "member" ? t("loginPage.header.titleMember") : t("loginPage.header.titleAdmin")}
            </span>
          </h1>
          <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
            {activeMode === "customer" ? t("loginPage.header.descCustomer") : activeMode === "member" ? t("loginPage.header.descMember") : t("loginPage.header.descAdmin")}
          </p>
        </div>

        {/* Unified iOS-style Segmented Control */}
        <div className="relative z-10 bg-muted dark:bg-white/5 p-1 rounded-2xl flex w-full max-w-[340px] mx-auto border border-border/50 dark:border-white/5 overflow-hidden">
          {(() => {
            const tabs = [
              { id: 'customer', label: t("loginPage.tabs.customer") },
              ...(allowRegistration ? [{ id: 'member', label: t("loginPage.tabs.member") }] : []),
              { id: 'admin', label: t("loginPage.tabs.admin") }
            ];
            const activeIndex = tabs.findIndex(t => t.id === activeMode);
            const tabWidth = 100 / tabs.length;

            return (
              <>
                <div 
                  className="absolute top-1 bottom-1 bg-white dark:bg-card rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: `calc(${activeIndex * tabWidth}% + 4px)`,
                    width: `calc(${tabWidth}% - 8px)`
                  }}
                />
                
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMode(tab.id)}
                    className={`flex-1 py-2 text-[10px] sm:text-[11px] font-bold rounded-xl relative z-10 transition-colors duration-250 ${
                      activeMode === tab.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </>
            );
          })()}
        </div>

        {/* Minimalist Apple Glass Card */}
        <div className="relative z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-border/50 p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
          {activeMode === "customer" ? (
            <form key="form-customer" onSubmit={handleCustomerLogin} className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">{t("loginPage.customerForm.title")}</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t("loginPage.customerForm.desc")}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 text-center">{t("loginPage.customerForm.codeLabel")}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    placeholder={t("loginPage.customerForm.codePlaceholder")}
                    className="w-full px-4 py-4 rounded-xl border border-border/50 bg-muted/50 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg uppercase font-mono tracking-[0.5em] font-bold text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span> {t("loginPage.customerForm.btn")}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-primary/10 dark:bg-primary/15 border border-primary/20 text-[11px] text-primary flex gap-3 text-left leading-relaxed mt-4">
                <span className="material-symbols-outlined text-primary shrink-0 text-lg mt-0.5 select-none">verified_user</span>
                <div>
                  <span className="font-bold text-primary block mb-0.5">{t("loginPage.customerForm.securityTitle")}</span>
                  {t("loginPage.customerForm.securityDesc")}
                </div>
              </div>
            </form>
          ) : activeMode === "member" ? (
            <form key="form-member" onSubmit={handleMemberLogin} className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">{t("loginPage.memberForm.title")}</h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t("loginPage.memberForm.desc")}</p>
              </div>

              {showBiometricOption && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={biometricBusy}
                    className="w-full py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">fingerprint</span>
                    {biometricBusy ? t("loginPage.biometric.verifying") : t("loginPage.biometric.btn", { email: biometricEmail })}
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex-1 h-px bg-border/60" /> {t("loginPage.biometric.or")} <div className="flex-1 h-px bg-border/60" />
                  </div>
                </div>
              )}

              <div className="py-2 flex justify-center">
                <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-300" />
              </div>

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="text-[10px] text-center text-destructive font-medium">{t("loginPage.memberForm.missingClientId")}</p>
              )}

              {googleConfigError && (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-left text-[10px] text-warning dark:text-amber-300">
                  <p className="font-semibold">{googleConfigError}</p>
                  <p className="mt-1 text-muted-foreground">Authorized JavaScript origins cần chứa origin hiện tại và domain production.</p>
                </div>
              )}

              <p className="text-[10px] text-center text-muted-foreground font-medium">
                {googleConfigError ? "Google Sign-In đang bị chặn bởi cấu hình OAuth." : gisReady ? t("loginPage.memberForm.gisReady") : t("loginPage.memberForm.gisLoading")}
              </p>

              {/* Apple-style Educational Disclaimer Card */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-[11px] text-muted-foreground flex gap-3 text-left leading-relaxed mt-2">
                <span className="material-symbols-outlined text-primary shrink-0 text-lg mt-0.5 select-none">school</span>
                <div>
                  <span className="font-bold text-foreground block mb-0.5">{t("loginPage.memberForm.reqTitle")}</span>
                  {t("loginPage.memberForm.reqDesc")}
                </div>
              </div>
            </form>
          ) : (
            <form key="form-admin" onSubmit={handleAdminLogin} className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">{t("loginPage.adminForm.title")}</h2>
                <p className="text-[11px] text-muted-foreground">{t("loginPage.adminForm.desc")}</p>
              </div>

              {/* Password Only Admin Login Form */}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{t("loginPage.adminForm.passLabel")}</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={adminForm.password}
                    onChange={(e) => {
                      setAdminForm((prev) => ({ ...prev, password: e.target.value }));
                      setAdminFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder={t("loginPage.adminForm.passPlaceholder")}
                    aria-invalid={Boolean(adminFieldErrors.password)}
                    className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-muted/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 transition-all text-xs ${
                      adminFieldErrors.password ? "border-destructive focus:ring-destructive" : "border-border/50 focus:ring-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    aria-label={showAdminPassword ? t("loginPage.adminForm.hidePassword") : t("loginPage.adminForm.showPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showAdminPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {adminFieldErrors.password.trim() && (
                  <p className="text-[10px] text-destructive pl-1">{adminFieldErrors.password}</p>
                )}
              </div>

              <label className="flex items-center gap-2 pl-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberAdmin}
                  onChange={(e) => setRememberAdmin(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-primary"
                />
                <span className="text-[11px] text-muted-foreground font-medium">{t("loginPage.adminForm.remember")}</span>
              </label>

              <button
                type="submit"
                disabled={adminSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm shadow-lg shadow-primary/25 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {adminSubmitting && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                )}
                {adminSubmitting ? t("loginPage.adminForm.submitting") : t("loginPage.adminForm.btn")}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">{t("loginPage.adminForm.https")}</p>
            </form>
          )}
        </div>
      </section>


    </div>
  );
}
