import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, loginMember } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";

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
  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [customerCode, setCustomerCode] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [gisReady, setGisReady] = useState(false);
  const googleButtonRef = useRef(null);
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState("");
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
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

    const payloadBase64 = response.credential.split(".")[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const profile = JSON.parse(payloadJson);

    const email = profile.email || "";
    const isEdu = await isEduEmail(email);
    if (!isEdu) {
      showToast(
        t("loginPage.toast.eduRedirect"),
        "warning"
      );
    }

    loginMember({
      email: profile.email,
      displayName: profile.name,
      provider: "google",
      avatarUrl: profile.picture
    });
    localStorage.setItem(LAST_EMAIL_KEY, profile.email);

    navigate("/member");
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
      if (err?.code === 'NO_CREDENTIALS') {
        showToast("Thiết bị này chưa bật đăng nhập vân tay cho email này.", "warning");
      } else if (err?.name !== 'NotAllowedError') {
        showToast("Không thể đăng nhập bằng vân tay/Face ID. Hãy dùng Google.", "error");
      }
    } finally {
      setBiometricBusy(false);
    }
  };

  useEffect(() => {
    if (activeMode !== "member") return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    let cancelled = false;
    let timer = null;

    const tryInitGoogle = () => {
      if (cancelled) return;

      const googleId = window.google?.accounts?.id;
      if (!googleId) return;

      setGisReady(true);
      if (!window.__googleInitialized) {
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleCredential
        });
        window.__googleInitialized = true;
      }

      googleButtonRef.current.innerHTML = "";
      googleId.renderButton(googleButtonRef.current, {
        theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
        size: "large",
        width: 320,
        text: "continue_with"
      });

      if (timer) {
        window.clearInterval(timer);
      }
    };

    timer = window.setInterval(tryInitGoogle, 250);
    tryInitGoogle();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeMode]);

  const handleMemberLogin = (e) => {
    e.preventDefault();
    showToast(t("loginPage.toast.useGoogleBtn"), "warning");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });

    const session = await loginAdmin(adminForm);
    if (!session) {
      showToast(t("loginPage.toast.adminError"), "error");
      return;
    }

    navigate("/admin");
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
      showToast("Hệ thống phát hiện thiết bị đăng nhập từ vị trí cách xa thường lệ trên 50km, cậu vui lòng đăng nhập lại để xác thực an toàn nhé.", "warning");
    }
  }, []);

  const autoLoginCustomer = async (code) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 text-foreground">
      <style>{`
        @keyframes slideInDown {
          0% { transform: translate(-50%, -120%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-toast-in {
          animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast.message && (
        <div className={`fixed top-6 left-1/2 z-50 animate-toast-in flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-background shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] md:max-w-md w-[calc(100vw-32px)] border-2 transition-all ${
          toast.type === "success"
            ? "border-success"
            : toast.type === "warning"
            ? "border-warning"
            : "border-destructive"
        }`}>
          <span className={`material-symbols-outlined shrink-0 text-xl ${
            toast.type === "success"
              ? "text-success"
              : toast.type === "warning"
              ? "text-warning"
              : "text-destructive"
          }`}>
            {toast.type === "success" ? "check_circle" : toast.type === "warning" ? "warning" : "error"}
          </span>
          <div className="flex-1 text-xs sm:text-sm font-semibold text-foreground leading-snug">
            {toast.message}
          </div>
          <button 
            type="button"
            onClick={() => setToast({ message: "", type: "" })}
            className="text-muted-foreground hover:text-foreground dark:hover:text-white shrink-0 ml-1 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <section className="w-full max-w-md space-y-6 relative">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        <div className="text-center relative z-10 space-y-2">
          {/* Multi-colored logo */}
          <div className="flex justify-center items-center gap-0.5 font-display text-[10px] sm:text-xs font-black tracking-[0.24em] uppercase mb-3 select-none">
            <span style={{ color: "#EF4444" }}>H</span>
            <span style={{ color: "#F97316" }}>u</span>
            <span style={{ color: "#EAB308" }}>g</span>
            <span style={{ color: "#22C55E" }}>o</span>
            <span className="text-muted-foreground mx-1.5 font-light"></span>
            <span style={{ color: "#3B82F6" }}>S</span>
            <span style={{ color: "#6366F1" }}>t</span>
            <span style={{ color: "#A855F7" }}>u</span>
            <span style={{ color: "#EC4899" }}>d</span>
            <span style={{ color: "#06B6D4" }}>i</span>
            <span style={{ color: "#0EA5E9" }}>o</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground transition-all">
            {activeMode === "customer" ? t("loginPage.header.titleCustomer") : activeMode === "member" ? t("loginPage.header.titleMember") : t("loginPage.header.titleAdmin")}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
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
                        ? "text-foreground"
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
        <div className="relative z-10 bg-white/70 dark:bg-background/80 backdrop-blur-2xl border border-border/50 p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
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
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm flex justify-center items-center gap-2"
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
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">fingerprint</span>
                    {biometricBusy ? "Đang xác thực..." : `Đăng nhập bằng vân tay/Face ID (${biometricEmail})`}
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex-1 h-px bg-border/60" /> hoặc <div className="flex-1 h-px bg-border/60" />
                  </div>
                </div>
              )}

              <div className="py-2 flex justify-center">
                <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-300" />
              </div>

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="text-[10px] text-center text-destructive font-medium">{t("loginPage.memberForm.missingClientId")}</p>
              )}

              <p className="text-[10px] text-center text-muted-foreground font-medium">
                {gisReady ? t("loginPage.memberForm.gisReady") : t("loginPage.memberForm.gisLoading")}
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

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{t("loginPage.adminForm.userLabel")}</label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder={t("loginPage.adminForm.userPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">{t("loginPage.adminForm.passLabel")}</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={t("loginPage.adminForm.passPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/50 text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-foreground hover:bg-foreground/90 dark:bg-white dark:hover:bg-white/90 text-background dark:text-background font-bold py-3.5 rounded-xl hover:scale-[1.01] active:scale-99 transition-all text-xs shadow-md mt-2"
              >
                {t("loginPage.adminForm.btn")}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">{t("loginPage.adminForm.https")}</p>
            </form>
          )}
        </div>
      </section>


    </div>
  );
}