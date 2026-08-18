import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { requestAdminOtp, verifyAdminOtp, loginMember, loginMemberWithGoogle } from "../../services/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { isEduEmail } from "../../utils/eduEmail";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import { isStandalone } from "../../config/platform";

const LAST_EMAIL_KEY = "hugo_last_member_email";

export default function LoginPage() {
  const { t } = useTranslation();
  const { data } = useData();
  const allowRegistration = data?.systemSettings?.allowRegistration !== false;
  useHeadMeta({
    title: "Đăng Nhập | Hugo Studio",
    description: "Đăng ký Bio Link sinh viên miễn phí với email .edu hoặc đăng nhập trang quản trị viên của Hugo Studio.",
    keywords: "đăng nhập Hugo Studio, tạo Bio sinh viên, đăng nhập quản trị, Bio Link edu",
    canonicalUrl: "https://www.hugowishpax.studio/login",
    robots: "noindex, nofollow, noarchive",
  });

  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState(allowRegistration ? "member" : "customer");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [rememberAdmin, setRememberAdmin] = useState(true);
  // 2FA OTP gửi qua Telegram (POST /api/admin/login -> requireOtp)
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
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
    const inPWA = isStandalone();
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

  // Đăng nhập quản trị KHÔNG còn mật khẩu: bấm nút → máy chủ gửi mã 6 số qua
  // Telegram của Boss → nhập mã là vào. Mật khẩu cũ chỉ còn là lối dự phòng ở
  // phía máy chủ (POST /api/admin/login) cho lúc Telegram hỏng.
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    setAdminSubmitting(true);
    try {
      const res = await requestAdminOtp();
      if (!res.tempToken) {
        showToast(
          res.error === "network" ? t("loginPage.toast.adminNetworkError") : res.error || t("loginPage.toast.adminServerError"),
          "error"
        );
        return;
      }
      setTempToken(res.tempToken);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpSecondsLeft(res.expiresIn || 30);
      setOtpModalOpen(true);
      showToast(res.message || t("loginPage.adminForm.otpSent"), res.telegramDelivered ? "info" : "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Mã OTP chỉ sống 30 giây. Không đếm ngược thì người dùng gõ xong mới biết
  // mã đã chết, và lỗi trông y hệt "nhập sai mã".
  useEffect(() => {
    if (!otpModalOpen || otpSecondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setOtpSecondsLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [otpModalOpen, otpSecondsLeft]);

  const handleVerifyAdminOtp = async (e) => {
    e?.preventDefault();
    setOtpError("");
    const fullOtp = otpDigits.join("").trim();
    if (fullOtp.length !== 6) {
      setOtpError("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }
    if (otpSecondsLeft <= 0) {
      setOtpError("Mã đã hết hạn (30 giây). Đóng cửa sổ này và bấm gửi lại mã.");
      return;
    }
    setOtpSubmitting(true);
    try {
      const { session, error } = await verifyAdminOtp(tempToken, fullOtp, { remember: rememberAdmin });
      if (!session) {
        setOtpError(error || "Mã OTP không chính xác.");
        return;
      }
      showToast("Xác thực 2FA Telegram thành công! 🔐", "success");
      navigate("/admin");
    } finally {
      setOtpSubmitting(false);
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

              <div className="py-2 flex flex-col items-center gap-3">
                <div ref={googleButtonRef} className="flex justify-center transition-opacity duration-300 min-h-[44px]" />
              </div>

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="text-[10px] text-center text-destructive font-medium">{t("loginPage.memberForm.missingClientId")}</p>
              )}

              {googleConfigError && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-[11px] text-amber-600 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">info</span>
                    Google Client ID chưa được cấp quyền cho Domain/Port hiện tại ({window.location.origin})
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Bạn cần thêm <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono">{window.location.origin}</code> vào mục <strong>Authorized JavaScript origins</strong> trên Google Cloud Console.
                  </p>
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

              {/* Đăng nhập bằng OTP Telegram — không còn ô mật khẩu. Yếu tố xác
                  thực là quyền đọc tin nhắn của đúng một chat Telegram: người lạ
                  bấm nút này chỉ làm máy Boss kêu một tiếng. */}
              <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/40 p-3">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground">send</span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t("loginPage.adminForm.otpDesc")}
                </p>
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
                {adminSubmitting ? t("loginPage.adminForm.otpSending") : t("loginPage.adminForm.otpBtn")}
              </button>

              <p className="text-[10px] text-center text-muted-foreground">{t("loginPage.adminForm.https")}</p>
            </form>
          )}
        </div>
      </section>

      {/* ── 2FA TELEGRAM OTP MODAL ── */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm sm:max-w-md bg-zinc-950/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden text-white font-sans"
          >
            {/* Ambient Frosted Glow */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Lock Icon */}
            <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 shadow-xl flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-2xl">shield_lock</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                XÁC THỰC BẢO MẬT 2FA
              </h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Mã OTP <strong className="text-emerald-400 font-bold">6 chữ số</strong> đã được gửi tới Telegram của Boss.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-bold font-sans border border-white/10 text-zinc-300">
              <span className="material-symbols-outlined text-xs text-emerald-400">timer</span>
              <span>{otpSecondsLeft > 0 ? `Mã hết hạn sau ${otpSecondsLeft}s` : "Mã hết hạn — Hãy gửi lại mã"}</span>
            </div>

            <form onSubmit={handleVerifyAdminOtp} className="space-y-5">
              {/* 6 OTP Input Boxes - Perfectly Aligned Square-ish Rounded Rectangles */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpDigits[idx]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const next = [...otpDigits];
                      next[idx] = val;
                      setOtpDigits(next);
                      if (val && idx < 5) {
                        const nextEl = document.getElementById(`otp-input-${idx + 1}`);
                        if (nextEl) nextEl.focus();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (!pasted) return;
                      e.preventDefault();
                      const next = ["", "", "", "", "", ""];
                      pasted.split("").forEach((digit, i) => { next[i] = digit; });
                      setOtpDigits(next);
                      document.getElementById(`otp-input-${Math.min(5, pasted.length - 1)}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                        const prevEl = document.getElementById(`otp-input-${idx - 1}`);
                        if (prevEl) prevEl.focus();
                      }
                    }}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black tabular-nums bg-zinc-900/90 border border-white/15 rounded-xl text-white outline-none focus:border-emerald-500 focus:bg-zinc-900 transition-all duration-200 shadow-sm"
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs text-rose-400 font-semibold animate-pulse">{otpError}</p>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  disabled={otpSubmitting}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {otpSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">verified_user</span>
                      <span>XÁC THỰC 2FA & VÀO ADMIN</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white font-bold transition-colors block mx-auto py-1"
                >
                  Hủy bỏ & Nhập lại mật khẩu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
