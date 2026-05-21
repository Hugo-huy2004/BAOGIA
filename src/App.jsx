import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./context/DataContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import VacationNotificationBanner from "./components/VacationNotificationBanner";
import MaintenancePage from "./components/MaintenancePage";
import GlobalAdBanner from "./components/GlobalAdBanner";
import { isAdminAuthenticated, isMemberAuthenticated } from "./services/authSession";
import HBot from "./components/HBot";

const IntroductionPage = lazy(() => import("./pages/IntroductionPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const BookingContactPage = lazy(() => import("./pages/BookingContactPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MemberPortalPage = lazy(() => import("./pages/MemberPortalPage"));
const BioPublicPage = lazy(() => import("./pages/BioPublicPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PartnerBioPage = lazy(() => import("./pages/PartnerBioPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const LivePreviewPage = lazy(() => import("./pages/LivePreviewPage"));
const SupportRequestPage = lazy(() => import("./pages/SupportRequestPage"));

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

  if (isMaintenanceMode && !isAdminOrLoginRoute) {
    return <MaintenancePage />;
  }

  if (isBioRoute || isPartnerBioRoute || isPreviewRoute) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
        <Routes>
          <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
          <Route path="/preview" element={<LivePreviewPage />} />
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
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/introduction" replace />} />
            <Route path="/introduction" element={<IntroductionPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/booking" element={<BookingContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/member" element={
              (isMemberAuthenticated() || new URLSearchParams(window.location.search).get("embed") === "true")
                ? <MemberPortalPage />
                : <Navigate to="/login" replace />
            } />
            <Route path="/bio/:slug" element={<BioPublicPage />} />
            <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/admin" element={isAdminAuthenticated() ? <AdminPanel /> : <Navigate to="/login" replace />} />
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
    <DataProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </DataProvider>
  );
}
