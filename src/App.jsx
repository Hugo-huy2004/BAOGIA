import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import VacationNotificationBanner from "./components/VacationNotificationBanner";
import MaintenancePage from "./components/MaintenancePage";
import GlobalAdBanner from "./components/GlobalAdBanner";
import OfflineBanner from "./components/ui/OfflineBanner";
import PWAInstallBanner from "./components/ui/PWAInstallBanner";
import { isAdminAuthenticated, isMemberAuthenticated } from "./services/authSession";
import HBot from "./components/HBot";
import { CursorEffect as Cursor } from "@hwagfu/cursor";
import { useUIStore } from "./stores/uiStore";
import { TooltipProvider } from "./components/ui/Tooltip";
import { Toaster } from "react-hot-toast";
import PWARealtimeBridge from "./components/PWARealtimeBridge";
import DonationModal from "./components/ui/DonationModal";
import { getAppMode } from "./utils/domains";

const IntroductionPage = lazy(() => import("./pages/public/IntroductionPage"));
const ServicesPage = lazy(() => import("./pages/public/ServicesPage"));
const TemplatesPage = lazy(() => import("./pages/public/TemplatesPage"));
const BookingContactPage = lazy(() => import("./pages/public/BookingContactPage"));
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const MemberPortalPage = lazy(() => import("./pages/member/MemberPortalPage"));
const BioPublicPage = lazy(() => import("./pages/public/BioPublicPage"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const PartnerBioPage = lazy(() => import("./pages/member/PartnerBioPage"));
const FAQPage = lazy(() => import("./pages/public/FAQPage"));
const StudentBenefitsPage = lazy(() => import("./pages/public/StudentBenefitsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage"));
const UserGuidePage = lazy(() => import("./pages/public/UserGuidePage"));
const LivePreviewPage = lazy(() => import("./pages/member/LivePreviewPage"));
const SupportRequestPage = lazy(() => import("./pages/public/SupportRequestPage"));
const CustomerPortalPage = lazy(() => import("./pages/customer/CustomerPortalPage"));
const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage"));
const AdminProjectDetailPage = lazy(() => import("./pages/admin/AdminProjectDetailPage"));
const SecretLinkUnlock = lazy(() => import("./pages/member/SecretLinkUnlock"));
const PaymentGatewayPage = lazy(() => import("./pages/PaymentGatewayPage"));
const MemberIdeTab = lazy(() => import("./components/member/MemberIdeTab"));
const ChessPage = lazy(() => import("./pages/public/ChessPage"));
const ArcadePage = lazy(() => import("./pages/member/ArcadePage"));
const UtilityPublicPage = lazy(() => import("./pages/public/UtilityPublicPage"));

// Once DNS for edu./project./admin.hugowishpax.studio exists, each subdomain
// lands a visitor on a sensible default screen instead of the marketing
// homepage — landing mode (apex/www/localhost) is untouched, so this is a
// no-op until those DNS records are actually created.
const SUBDOMAIN_HOME = { edu: '/login', project: '/customer-portal', admin: '/admin' };

function AppContent() {
  const location = useLocation();
  const { data } = useData();
  const appMode = getAppMode();
  if (appMode !== 'landing' && (location.pathname === '/' || location.pathname === '/introduction')) {
    return <Navigate to={SUBDOMAIN_HOME[appMode]} replace />;
  }
  const isBioRoute = location.pathname.startsWith('/bio/');
  const isPartnerBioRoute = location.pathname === "/partner/bio-editor";
  const isPreviewRoute = location.pathname === "/preview";
  const showFooter = 
    !isBioRoute && 
    !isPartnerBioRoute && 
    !isPreviewRoute &&
    location.pathname !== "/introduction" && 
    location.pathname !== "/" &&
    !location.pathname.startsWith("/member") &&
    !location.pathname.startsWith("/admin");

  const isMaintenanceMode = data?.systemSettings?.maintenanceMode === true;
  const isVacationMode = data?.systemSettings?.vacationMode === true;
  const isAdminOrLoginRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  const isCustomerPortalRoute = location.pathname.startsWith("/customer-portal");
  const isSecretLinkRoute = location.pathname.startsWith("/s/");
  const isPayRoute = location.pathname.startsWith("/pay/");
  const isIdeRoute = location.pathname === "/member/ide";
  const isChessRoute = location.pathname.startsWith("/chess");
  const isArcadeRoute = location.pathname === "/arcade" || location.pathname.startsWith("/member/utilities/arcade");
  const isPublicUtilityRoute = location.pathname === "/banhocduong" || location.pathname === "/therapy" || location.pathname === "/radio" || location.pathname === "/aura";

  if (isMaintenanceMode && !isAdminOrLoginRoute && !isCustomerPortalRoute && !isSecretLinkRoute && !isPayRoute && !isIdeRoute && !isChessRoute && !isArcadeRoute) {
    return <MaintenancePage />;
  }

  if (isBioRoute || isPartnerBioRoute || isPreviewRoute || isCustomerPortalRoute || isSecretLinkRoute || isPayRoute || isIdeRoute || isChessRoute || isArcadeRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <Routes>
          <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/s/:slug/:linkId" element={<SecretLinkUnlock />} />
          <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
          <Route path="/preview" element={<LivePreviewPage />} />
          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/pay/:id" element={<PaymentGatewayPage />} />
          <Route path="/member/ide" element={<Navigate to="/member/utilities/ide" replace />} />
          {/* Chess now lives inside HugoArcade — old /chess links resolve into Arcade with the room preserved */}
          <Route path="/chess" element={<Navigate to="/arcade?game=chess" replace />} />
          <Route path="/chess/:roomId" element={<Navigate to={`/arcade?game=chess&room=${window.location.pathname.split("/").pop()}`} replace />} />
          <Route path="/arcade" element={isMemberAuthenticated() ? <ArcadePage /> : <Navigate to="/login" replace />} />
          <Route path="/member/utilities/arcade" element={<Navigate to="/arcade" replace />} />
        </Routes>
      </Suspense>
    );
  }

  const isEmbed = new URLSearchParams(location.search).get("embed") === "true" || window.self !== window.top;
  const isFullscreenUtility = location.pathname.startsWith("/member/utilities/ide") || location.pathname.startsWith("/member/utilities/arcade");
  const hideNavbar = isEmbed || isFullscreenUtility;
  const hideHBot = isEmbed || isFullscreenUtility || data?.systemSettings?.enableHBot === false;

  return (
    <div className="min-h-screen bg-surface dark:bg-background text-foreground transition-colors duration-300 flex flex-col justify-between">
      
      {/* Static Top-Navigation Header bar */}
      {!hideNavbar && <Navbar />}
      
      {/* Vacation Mode Notification Banner */}
      {!hideNavbar && <VacationNotificationBanner isVacationMode={isVacationMode} />}

      {/* Global Advertisement Banner */}
      {!hideNavbar && <GlobalAdBanner />}
      
      {/* Dynamic Content Router */}
      <main className="flex-grow">
        <Cursor 
          ringColor="#3b82f6"
          ringBackground="rgba(59, 130, 246, 0.2)"
          ringHoverBackground="rgba(59, 130, 246, 0.4)"
          dotColor="#3b82f6"
         />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/introduction" replace />} />
            <Route path="/introduction" element={<IntroductionPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/student-benefits" element={<StudentBenefitsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/booking" element={<BookingContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/member" element={<Navigate to="/member/account" replace />} />
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
            <Route path="/s/:slug/:linkId" element={<SecretLinkUnlock />} />
            <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/user-guide" element={<UserGuidePage />} />
            <Route path="/admin" element={isAdminAuthenticated() ? <AdminPanel /> : <Navigate to="/login" replace />} />
            <Route path="/admin/projects" element={isAdminAuthenticated() ? <AdminProjectsPage /> : <Navigate to="/login" replace />} />
            <Route path="/admin/projects/:id" element={isAdminAuthenticated() ? <AdminProjectDetailPage /> : <Navigate to="/login" replace />} />
            <Route path="/support-request" element={<SupportRequestPage />} />
            
            {/* Dynamic Public Utility Route */}
            <Route path="/:tool" element={isPublicUtilityRoute ? <UtilityPublicPage /> : <Navigate to="/introduction" replace />} />
            
            <Route path="*" element={<Navigate to="/introduction" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Brand footer bar */}
      {!isEmbed && showFooter && <Footer />}

      {/* Floating AI chatbot support assistant */}
      {!hideHBot && <HBot />}
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

  return (
    <ErrorBoundary>
      <DataProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <TooltipProvider>
            <PWARealtimeBridge />
            <OfflineBanner />
            <AppContent />
            <PWAInstallBanner />
            <DonationModal />
            <Toaster
              position="top-center"
              reverseOrder={false}
              containerStyle={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
            />
          </TooltipProvider>
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
}
