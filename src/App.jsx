import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import { isPublicToolPath } from "./config/publicTools";
import { isStandalone } from "./config/platform";
import { ensureTranslations } from "./i18n/config";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import VacationNotificationBanner from "./components/VacationNotificationBanner";
import MaintenancePage from "./components/MaintenancePage";
import GlobalAdBanner from "./components/GlobalAdBanner";
import OfflineBanner from "./components/ui/OfflineBanner";
import PWAInstallBanner from "./components/ui/PWAInstallBanner";
import PWAUpdatePrompt from "./components/ui/PWAUpdatePrompt";
import { isMemberAuthenticated } from "./services/authSession";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import { TooltipProvider } from "./components/ui/Tooltip";
import { Toaster } from "react-hot-toast";
import PWARealtimeBridge from "./components/PWARealtimeBridge";
import NativeShell from "./components/NativeShell";
import PWAQuickLogin from "./components/PWAQuickLogin";
import DonationModal from "./components/ui/DonationModal";
import { LazyMotion } from "framer-motion";
const loadMotionFeatures = () => import("./config/motionFeatures").then((mod) => mod.default);
import { initGlobalHaptics } from "./utils/haptics";
import { useInputFocusScroll } from "./hooks/useInputFocusScroll";
import { BackgroundSyncEngine } from "./utils/backgroundSyncEngine";
import { StorageSafeguard } from "./utils/storageSafeguard";
import { PWAKeepAlive } from "./utils/pwaKeepAlive";
import PWAUpdateBanner from "./components/ui/PWAUpdateBanner";
import PWAInstallModal from "./components/ui/PWAInstallModal";
import RouteSeoPolicy from "./components/RouteSeoPolicy";
import { SecurityBlockBoundary } from "./components/SecurityBlockScreen";

// Only navbar + footer ship with the entry chunk; the rest of the dictionary
// is fetched per language (see i18n/config.js). Every screen below lives
// behind a lazy route, so pairing the two loads puts the dictionary inside the
// Suspense boundary that already exists — no screen can render before its
// strings are there, and nothing flashes raw `a.b.c` keys.
const lazyRoute = (loader) =>
  lazy(() => Promise.all([loader(), ensureTranslations()]).then(([mod]) => mod));

const IntroductionPage = lazyRoute(() => import("./pages/public/IntroductionPage"));
const ServicesPage = lazyRoute(() => import("./pages/public/ServicesPage"));
const BookingContactPage = lazyRoute(() => import("./pages/public/BookingContactPage"));
const LoginPage = lazyRoute(() => import("./pages/public/LoginPage"));
const PWALoginPage = lazyRoute(() => import("./pages/public/PWALoginPage"));
const MemberPortalPage = lazyRoute(() => import("./pages/member/MemberPortalPage"));
const BioPublicPage = lazyRoute(() => import("./pages/public/BioPublicPage"));
const CoderCertificatePage = lazyRoute(() => import("./pages/public/CoderCertificatePage"));
const AdminPanel = lazyRoute(() => import("./pages/admin/AdminPanel"));
const PartnerBioPage = lazyRoute(() => import("./pages/member/PartnerBioPage"));
const FAQPage = lazyRoute(() => import("./pages/public/FAQPage"));
const StudentPricingPage = lazyRoute(() => import("./pages/public/StudentPricingPage"));
const PrivacyPolicyPage = lazyRoute(() => import("./pages/public/PrivacyPolicyPage"));
const UserGuidePage = lazyRoute(() => import("./pages/public/UserGuidePage"));
const LivePreviewPage = lazyRoute(() => import("./pages/member/LivePreviewPage"));
const SupportRequestPage = lazyRoute(() => import("./pages/public/SupportRequestPage"));
const CustomerPortalPage = lazyRoute(() => import("./pages/customer/CustomerPortalPage"));
const AdminProjectsPage = lazyRoute(() => import("./pages/admin/AdminProjectsPage"));
const AdminProjectDetailPage = lazyRoute(() => import("./pages/admin/AdminProjectDetailPage"));
const SecretLinkUnlock = lazyRoute(() => import("./pages/member/SecretLinkUnlock"));
const PaymentGatewayPage = lazyRoute(() => import("./pages/PaymentGatewayPage"));
const MemberIdeTab = lazyRoute(() => import("./components/member/MemberIdeTab"));
const ArcadePage = lazyRoute(() => import("./pages/member/ArcadePage"));
// Chế độ Bảo vệ môi trường sống tách hẳn trong src/Save_E/, không đụng portal thường.
const EcoPortal = lazyRoute(() => import("./Save_E/EcoPortal"));
const UtilityPublicPage = lazyRoute(() => import("./pages/public/UtilityPublicPage"));

const Cursor = lazy(() =>
  import("@hwagfu/cursor").then((module) => ({ default: module.CursorEffect })),
);

function AppContent() {
  const location = useLocation();
  const { data } = useData();

  useEffect(() => {
    const disposeBackgroundSync = BackgroundSyncEngine.initListener();
    const runMaintenance = () => {
      StorageSafeguard.checkAndOptimizeStorage().catch(() => {});
      if (isMemberAuthenticated()) {
        PWAKeepAlive.startKeepAlive();
        // Preserve skincare reminders for members who already opted in,
        // without loading the module or prompting for permission at startup.
        if ("Notification" in window && Notification.permission === "granted") {
          import("./utils/applePushNotificationManager")
            .then(({ ApplePushNotificationManager }) => {
              ApplePushNotificationManager.scheduleEveningSkincareRoutine();
            })
            .catch(() => {});
        }
      }
    };

    let idleId;
    let timerId;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(runMaintenance, { timeout: 3000 });
    } else {
      timerId = window.setTimeout(runMaintenance, 1200);
    }

    return () => {
      disposeBackgroundSync?.();
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);
  const isBioRoute = location.pathname.startsWith('/bio/');
  const isPartnerBioRoute = location.pathname === "/partner/bio-editor";
  const isPreviewRoute = location.pathname === "/preview";
  const showFooter =
    !isBioRoute &&
    !isPartnerBioRoute &&
    !isPreviewRoute &&
    !location.pathname.startsWith("/member") &&
    !location.pathname.startsWith("/admin") &&
    // Login is a focused, form-only screen (esp. as an installed PWA) — the full
    // marketing footer below it is noise, like every major sign-in page.
    !location.pathname.startsWith("/login");

  const isMaintenanceMode = data?.systemSettings?.maintenanceMode === true;
  const isVacationMode = data?.systemSettings?.vacationMode === true;
  const isAdminOrLoginRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  const isCustomerPortalRoute = location.pathname.startsWith("/customer-portal");
  const isSecretLinkRoute = location.pathname.startsWith("/s/");
  const isPayRoute = location.pathname.startsWith("/pay/");
  const isIdeRoute = location.pathname === "/member/ide";
  const isChessRoute = location.pathname.startsWith("/chess");
  // /arcade is now a standalone public page (see config/publicTools.js), so it
  // must not be captured here — that branch redirects guests to /login, which
  // is exactly what the "play first, sign in to unlock levels" rule forbids.
  const isArcadeRoute = location.pathname.startsWith("/member/utilities/arcade");
  // Allowed standalone-app paths come from the registry so this can no longer
  // drift out of sync with the tools UtilityPublicPage actually renders.
  const isPublicUtilityRoute = isPublicToolPath(location.pathname);

  if (isMaintenanceMode && !isAdminOrLoginRoute && !isCustomerPortalRoute && !isSecretLinkRoute && !isPayRoute && !isIdeRoute && !isChessRoute && !isArcadeRoute) {
    return <MaintenancePage />;
  }

  if (isBioRoute || isPartnerBioRoute || isPreviewRoute || isCustomerPortalRoute || isSecretLinkRoute || isPayRoute || isIdeRoute || isChessRoute || isArcadeRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>}>
        <Routes>
          <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/certificate/:slug/:phase" element={<CoderCertificatePage />} />
          <Route path="/s/:slug/:linkId" element={<SecretLinkUnlock />} />
          <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
          <Route path="/preview" element={<LivePreviewPage />} />
          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/pay/:id" element={<PaymentGatewayPage />} />
          <Route path="/member/ide" element={<Navigate to="/member/utilities/ide" replace />} />
          {/* Chess now lives inside HugoArcade — old /chess links resolve into Arcade with the room preserved */}
          <Route path="/chess" element={<Navigate to="/member/utilities/arcade?game=chess" replace />} />
          <Route path="/chess/:roomId" element={<Navigate to={`/member/utilities/arcade?game=chess&room=${window.location.pathname.split("/").pop()}`} replace />} />
          <Route path="/member/utilities/arcade" element={isMemberAuthenticated() ? <ArcadePage /> : <Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  const isEmbed = new URLSearchParams(location.search).get("embed") === "true" || window.self !== window.top;
  const isFullscreenUtility = location.pathname.startsWith("/member/utilities/ide") || location.pathname.startsWith("/member/utilities/arcade");
  // In standalone PWA mode without an active session, show only the login screen —
  // no marketing navbar, no HBot, no footer. The native build is always in this
  // mode: the store app is the member app, never the marketing site.
  const isPWA = isStandalone();
  const showCustomCursor =
    !isPWA &&
    !location.pathname.startsWith("/member") &&
    window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
  const isAuthenticated = isMemberAuthenticated();
  // In the installed PWA we want a focused, app-like dashboard: never show the
  // marketing top navbar / tab-bar — those are web-only. But keep HBot for support.
  const isMemberRoute = location.pathname.startsWith("/member");
  const hideNavbar = isEmbed || isFullscreenUtility || isPWA || isMemberRoute;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between">
      
      {/* Static Top-Navigation Header bar */}
      {!hideNavbar && <Navbar />}
      
      {/* Vacation Mode Notification Banner */}
      {!hideNavbar && <VacationNotificationBanner isVacationMode={isVacationMode} />}

      {/* Global Advertisement Banner */}
      {!hideNavbar && <GlobalAdBanner />}
      
      {/* Dynamic Content Router */}
      <main className="flex-grow">
        {showCustomCursor && (
          <Suspense fallback={null}>
            <Cursor
              ringColor="#007aff"
              ringBackground="rgba(0,122,255,0.16)"
              ringHoverBackground="rgba(0,122,255,0.28)"
              dotColor="#007aff"
            />
          </Suspense>
        )}
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div></div>}>
          <Routes>
            <Route path="/" element={
              isPWA
                ? (isAuthenticated ? <Navigate to="/member" replace /> : <Navigate to="/login" replace />)
                : <Navigate to="/introduction" replace />
            } />
            <Route path="/introduction" element={
              isPWA && !isAuthenticated
                ? <Navigate to="/login" replace />
                : <IntroductionPage />
            } />
            <Route path="/services" element={<ServicesPage />} />
            {/* Ví JOY chỉ còn một bản: tab /member/joy. Trang /joy cũ là bản
                thứ hai, trùng chức năng nhưng khác hẳn giao diện. */}
            <Route path="/joy" element={<Navigate to="/member/joy" replace />} />
            {/* Quyền lợi HSSV + bảng giá HSSV đã gộp thành một trang. */}
            <Route path="/student-benefits" element={<Navigate to="/student-pricing" replace />} />
            <Route path="/student-pricing" element={<StudentPricingPage />} />
            <Route path="/templates" element={<Navigate to="/services#templates" replace />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/booking" element={<BookingContactPage />} />
            {/* Installed PWA (standalone) gets the app-style, member-only Google
                login; the web keeps the full 3-tab LoginPage. */}
            <Route path="/login" element={isPWA ? <PWALoginPage /> : <LoginPage />} />
            <Route path="/member" element={<Navigate to="/member/today" replace />} />
            <Route path="/member/eco" element={
              isMemberAuthenticated() ? <EcoPortal /> : <Navigate to="/login" replace />
            } />
            <Route path="/member/:tab" element={
              (isMemberAuthenticated() || new URLSearchParams(window.location.search).get("embed") === "true")
                ? <MemberPortalPage />
                : <Navigate to="/login" replace />
            } />
            <Route path="/member/:tab/:subTab" element={
              (isMemberAuthenticated() || new URLSearchParams(window.location.search).get("embed") === "true")
                ? <MemberPortalPage />
                : <Navigate to="/login" replace />
            } />
            <Route path="/member/:tab/:subTab/:psychTab" element={
              (isMemberAuthenticated() || new URLSearchParams(window.location.search).get("embed") === "true")
                ? <MemberPortalPage />
                : <Navigate to="/login" replace />
            } />
            <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/certificate/:slug/:phase" element={<CoderCertificatePage />} />
            <Route path="/s/:slug/:linkId" element={<SecretLinkUnlock />} />
            <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/user-guide" element={<UserGuidePage />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminPanel />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <AdminProtectedRoute>
                <AdminProjectsPage />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/projects/:id" element={
              <AdminProtectedRoute>
                <AdminProjectDetailPage />
              </AdminProtectedRoute>
            } />
            <Route path="/support-request" element={<SupportRequestPage />} />
            
            {/* Dynamic Public Utility Route */}
            <Route path="/:tool" element={isPublicUtilityRoute ? <UtilityPublicPage /> : <Navigate to="/introduction" replace />} />
            
            <Route path="*" element={<Navigate to="/introduction" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Brand footer bar */}
      {!isEmbed && showFooter && <Footer />}

    </div>
  );
}

export default function App() {
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e) => {
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    // Initial sync on mount
    handleChange(mediaQuery);

    // Listen to changes dynamically
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // index.css has carried a `html.standalone-pwa` block for a while — no
  // tap highlight, no overscroll bounce, no scrollbars, and now the flat
  // app-shell rules — but nothing ever added the class, so none of it applied.
  // display-mode flips when the user installs the PWA mid-session, hence the
  // listener rather than a one-shot check.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => root.classList.toggle("standalone-pwa", isStandalone());
    sync();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => initGlobalHaptics(), []);
  // Fix: on mobile, after keyboard opens (≈380ms), scroll the focused input
  // back into view in case a React re-render reset the scroll container.
  useInputFocusScroll();

  return (
    <ErrorBoundary>
      <SecurityBlockBoundary>
        <LazyMotion features={loadMotionFeatures}>
        <DataProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <TooltipProvider>
              <RouteSeoPolicy />
              <NativeShell />
              <PWARealtimeBridge />
              <PWAQuickLogin />
              <OfflineBanner />
              <AppContent />
              <PWAInstallBanner />
              <PWAUpdatePrompt />
              <PWAUpdateBanner />
              <PWAInstallModal />
              <DonationModal />
              <Toaster
                position="top-center"
                reverseOrder={false}
                containerStyle={{ top: "calc(env(safe-area-inset-top, 24px) + 24px)" }}
                toastOptions={{
                  duration: 4000,
                  className: "hugo-hot-toast",
                  style: {
                    maxWidth: "min(420px, calc(100vw - 24px))",
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,.62)",
                    background: "rgba(255,255,255,.94)",
                    color: "#0f172a",
                    boxShadow: "0 22px 58px rgba(15,23,42,.20)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    padding: "13px 16px",
                    fontSize: "13px",
                    fontWeight: 850,
                  },
                  success: {
                    iconTheme: { primary: "#10b981", secondary: "#ffffff" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
                  },
                  loading: {
                    iconTheme: { primary: "#6366f1", secondary: "#ffffff" },
                  },
                }}
              />
            </TooltipProvider>
          </BrowserRouter>
        </DataProvider>
        </LazyMotion>
      </SecurityBlockBoundary>
    </ErrorBoundary>
  );
}
