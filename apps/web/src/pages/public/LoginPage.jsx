import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginMember, loginMemberWithGoogle } from "../../services/api/core/authSession";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import { isStandalone } from "../../config/platform";
import { API_BASE } from "../../config/apiBase";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";
import { getSafeMemberRedirect } from "../../utils/safeRedirect";
import { useServicesFonts } from "../../hooks/useServicesFonts";
import "./sticker-pages.css";

const LAST_EMAIL_KEY = "hugo_last_member_email";

export default function LoginPage() {
  const { t } = useTranslation();
  const { data } = useData();
  const allowRegistration = data?.systemSettings?.allowRegistration !== false;
  useServicesFonts();
  useHeadMeta({
    title: "Đăng Nhập | Hugo Studio",
    description: "Đăng ký Bio Link sinh viên miễn phí với email .edu hoặc đăng nhập trang quản trị viên của Hugo Studio.",
    keywords: "đăng nhập Hugo Studio, tạo Bio sinh viên, đăng nhập quản trị, Bio Link edu",
    canonicalUrl: "https://www.hugowishpax.studio/login",
    robots: "noindex, nofollow, noarchive",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const memberRedirect = getSafeMemberRedirect(location.search);
  const memberRedirectRef = useRef(memberRedirect);
  memberRedirectRef.current = memberRedirect;
  const [activeMode, setActiveMode] = useState(allowRegistration ? "member" : "customer");
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
      setActiveMode("customer");
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
      showToast(error === "network" ? t("loginPage.toast.adminNetworkError") : error || t("loginPage.toast.noGoogle"), "error");
      return;
    }

    localStorage.setItem(LAST_EMAIL_KEY, session.email);
    navigate(memberRedirectRef.current, { replace: true });
  };
  const googleCredentialHandlerRef = useRef(handleGoogleCredential);
  googleCredentialHandlerRef.current = handleGoogleCredential;

  const handleBiometricLogin = async () => {
    if (!biometricEmail) return;
    setBiometricBusy(true);
    try {
      const member = await webauthnHelper.loginWithBiometric(biometricEmail);
      loginMember(member);
      localStorage.setItem(LAST_EMAIL_KEY, biometricEmail);
      navigate(memberRedirectRef.current, { replace: true });
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
    if (!clientId) {
      setGoogleConfigError("Đăng nhập Google chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
      return;
    }
    if (!googleButtonRef.current) return;

    let cancelled = false;
    let timer = null;
    let timeout = null;
    let initialized = false;
    let rendered = false;

    const tryInitGoogle = (loadedGoogleId) => {
      if (cancelled || rendered) return;

      const googleId = loadedGoogleId || window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return;

      if (!initialized) {
        googleId.initialize({
          client_id: clientId,
          callback: (response) => googleCredentialHandlerRef.current(response),
          use_fedcm_for_prompt: false
        });
        initialized = true;
      }

      googleButtonRef.current.innerHTML = "";
      try {
        googleId.renderButton(googleButtonRef.current, {
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "continue_with"
        });
      } catch {
        setGoogleConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
        if (timer) window.clearInterval(timer);
        return;
      }
      rendered = true;
      setGoogleConfigError("");
      setGisReady(true);

      if (timer) {
        window.clearInterval(timer);
      }
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };

    timer = window.setInterval(tryInitGoogle, 250);
    loadGoogleIdentity().then(tryInitGoogle).catch(() => {
      if (!cancelled) {
        setGoogleConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}.`);
      }
    });
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

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    if (!customerCode || customerCode.trim().length < 6) {
      showToast(t("loginPage.toast.codeLength"), "error");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/customer-projects/auth`, {
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
    // Link cũ dạng /login?portalCode=… vẫn mở được; link mới là /customer-portal/<mã>.
    const code = params.get("portalCode");
    if (code && code.length >= 6) {
      setActiveMode("customer");
      setCustomerCode(code);
      autoLoginCustomer(code);
    }
    if (params.get("reason") === "location_anomaly") {
      showToast(t("loginPage.toast.locationAnomaly"), "warning");
    }
    if (params.get("reason") === "support_login_required") {
      showToast("Vui lòng đăng nhập thành viên để tiếp tục yêu cầu hỗ trợ.", "warning");
    }
  // Chạy theo đúng các giá trị liệt kê; thêm hàm (tạo mới mỗi render) vào sẽ gọi lặp vô hạn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoLoginCustomer = async (code) => {
    try {
      const response = await fetch(`${API_BASE}/customer-projects/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loginCode: code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Lỗi đăng nhập portal');
      
      sessionStorage.setItem('customerProject', JSON.stringify(data.project));
      navigate("/customer-portal");
    } catch {
      showToast(t("loginPage.toast.invalidLink"), "error");
    }
  };

  const tabs = [
    { id: "customer", icon: "folder_managed", label: t("loginPage.tabs.customer") },
    ...(allowRegistration ? [{ id: "member", icon: "school", label: t("loginPage.tabs.member") }] : []),
  ];

  // 09/11/2026: cùng chất sticker neon với trang Dịch vụ. Một cột, một thẻ;
  // màu thẻ đổi theo chế độ (dự án: xanh ngọc · sinh viên: hồng).
  return (
    <div className={`sk-page sk-login sk-login--${activeMode}`}>
      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <section className="sk-login__col">
        <p className="sk-brand"><b>HUGO</b> Studio</p>
        <h1 className="sk-login__title">
          {activeMode === "customer" ? t("loginPage.header.titleCustomer") : t("loginPage.header.titleMember")}
        </h1>
        <p className="sk-login__lede">
          {activeMode === "customer" ? t("loginPage.header.descCustomer") : t("loginPage.header.descMember")}
        </p>

        {tabs.length > 1 ? (
          <div className="sk-seg" role="tablist">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" role="tab" aria-selected={activeMode === tab.id}
                onClick={() => setActiveMode(tab.id)} className={activeMode === tab.id ? "is-on" : ""}>
                <span aria-hidden className="material-symbols-outlined">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="sk-login__card">
          {activeMode === "customer" ? (
            <form key="form-customer" onSubmit={handleCustomerLogin}>
              <label className="sk-field">
                <span>{t("loginPage.customerForm.codeLabel")}</span>
                <input
                  type="text"
                  maxLength={12}
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                  placeholder={t("loginPage.customerForm.codePlaceholder")}
                  autoComplete="one-time-code"
                  spellCheck={false}
                />
              </label>
              <button type="submit" className="sk-btn sk-btn--block">
                {t("loginPage.customerForm.btn")} <span aria-hidden className="material-symbols-outlined">arrow_forward</span>
              </button>
              <p className="sk-hint">
                <span aria-hidden className="material-symbols-outlined">verified_user</span>
                <span><b>{t("loginPage.customerForm.securityTitle")}.</b> {t("loginPage.customerForm.securityDesc")}</span>
              </p>
            </form>
          ) : (
            <form key="form-member" onSubmit={handleMemberLogin}>
              {showBiometricOption && (
                <>
                  <button type="button" onClick={handleBiometricLogin} disabled={biometricBusy} className="sk-btn sk-btn--block">
                    <span aria-hidden className="material-symbols-outlined">fingerprint</span>
                    {biometricBusy ? t("loginPage.biometric.verifying") : t("loginPage.biometric.btn", { email: biometricEmail })}
                  </button>
                  <p className="sk-or"><span>{t("loginPage.biometric.or")}</span></p>
                </>
              )}

              <div ref={googleButtonRef} className="sk-google" />

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="sk-error">{t("loginPage.memberForm.missingClientId")}</p>
              )}

              {googleConfigError && (
                <div className="sk-warn">
                  <p><b>Google Client ID chưa được cấp quyền cho Domain/Port hiện tại ({window.location.origin})</b></p>
                  <p>Bạn cần thêm <code>{window.location.origin}</code> vào mục <strong>Authorized JavaScript origins</strong> trên Google Cloud Console.</p>
                </div>
              )}

              <p className="sk-status">
                {googleConfigError ? "Google Sign-In đang bị chặn bởi cấu hình OAuth." : gisReady ? t("loginPage.memberForm.gisReady") : t("loginPage.memberForm.gisLoading")}
              </p>

              <p className="sk-hint">
                <span aria-hidden className="material-symbols-outlined">school</span>
                <span><b>{t("loginPage.memberForm.reqTitle")}.</b> {t("loginPage.memberForm.reqDesc")}</span>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
