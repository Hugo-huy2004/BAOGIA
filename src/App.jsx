import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import VacationNotificationBanner from "./components/VacationNotificationBanner";
import MaintenancePage from "./components/MaintenancePage";
import GlobalAdBanner from "./components/GlobalAdBanner";
import { isAdminAuthenticated, isMemberAuthenticated } from "./services/authSession";
import HBot from "./components/HBot";
import { CursorEffect as Cursor } from "hwagfu-cursor";

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

function AppContent() {
  const location = useLocation();
  const { data } = useData();
  const isBioRoute = location.pathname.startsWith('/bio/');
  const isPartnerBioRoute = location.pathname === "/partner/bio-editor";
  const isPreviewRoute = location.pathname === "/preview";
  const showFooter = 
    !isBioRoute && 
    !isPartnerBioRoute && 
    !isPreviewRoute &&
    location.pathname !== "/introduction" && 
    location.pathname !== "/" &&
    location.pathname !== "/member" &&
    location.pathname !== "/admin";

  const isMaintenanceMode = data?.systemSettings?.maintenanceMode === true;
  const isVacationMode = data?.systemSettings?.vacationMode === true;
  const isAdminOrLoginRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  const isCustomerPortalRoute = location.pathname.startsWith("/customer-portal");
  const isSecretLinkRoute = location.pathname.startsWith("/s/");
  const isPayRoute = location.pathname.startsWith("/pay/");

  if (isMaintenanceMode && !isAdminOrLoginRoute && !isCustomerPortalRoute && !isSecretLinkRoute && !isPayRoute) {
    return <MaintenancePage />;
  }

  if (isBioRoute || isPartnerBioRoute || isPreviewRoute || isCustomerPortalRoute || isSecretLinkRoute || isPayRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <Routes>
          <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/s/:slug/:linkId" element={<SecretLinkUnlock />} />
          <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
          <Route path="/preview" element={<LivePreviewPage />} />
          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/pay/:id" element={<PaymentGatewayPage />} />
        </Routes>
      </Suspense>
    );
  }

  const isEmbed = new URLSearchParams(location.search).get("embed") === "true" || window.self !== window.top;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0b0a0f] text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between">
      
      {/* Static Top-Navigation Header bar */}
      {!isEmbed && <Navbar />}
      
      {/* Vacation Mode Notification Banner */}
      {!isEmbed && <VacationNotificationBanner isVacationMode={isVacationMode} />}

      {/* Global Advertisement Banner */}
      {!isEmbed && <GlobalAdBanner />}
      
      {/* Dynamic Content Router */}
      <main className="flex-grow">
        <Cursor />
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
            <Route path="/member" element={
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
            <Route path="*" element={<Navigate to="/introduction" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Brand footer bar */}
      {!isEmbed && showFooter && <Footer />}

      {/* Floating AI chatbot support assistant */}
      {!isEmbed && data?.systemSettings?.enableHBot !== false && <HBot />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Auto-detect system theme preference on app load
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <ErrorBoundary>
      <DataProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
}
