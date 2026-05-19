import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import IntroductionPage from "./pages/IntroductionPage";
import ServicesPage from "./pages/ServicesPage";
import BookingContactPage from "./pages/BookingContactPage";
import LoginPage from "./pages/LoginPage";
import MemberPortalPage from "./pages/MemberPortalPage";
import BioPublicPage from "./pages/BioPublicPage";
import AdminPanel from "./pages/AdminPanel";
import PartnerBioPage from "./pages/PartnerBioPage";
import { isAdminAuthenticated, isMemberAuthenticated } from "./services/authSession";

function AppContent() {
  const location = useLocation();
  const isBioRoute = location.pathname.startsWith('/bio/');
  const isPartnerBioRoute = location.pathname === "/partner/bio-editor";
  const showFooter = !isBioRoute && !isPartnerBioRoute && location.pathname !== "/introduction" && location.pathname !== "/";

  if (isBioRoute || isPartnerBioRoute) {
    return (
      <Routes>
        <Route path="/bio/:slug" element={<BioPublicPage />} />
        <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
      </Routes>
    );
  }

  const isEmbed = new URLSearchParams(location.search).get("embed") === "true" || window.self !== window.top;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0b0a0f] text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between">
      
      {/* Static Top-Navigation Header bar */}
      {!isEmbed && <Navbar />}
      {/* Dynamic Content Router */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/introduction" replace />} />
          <Route path="/introduction" element={<IntroductionPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/booking" element={<BookingContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/member" element={
            (isMemberAuthenticated() || new URLSearchParams(window.location.search).get("embed") === "true")
              ? <MemberPortalPage />
              : <Navigate to="/login" replace />
          } />
          <Route path="/bio/:slug" element={<BioPublicPage />} />
          <Route path="/partner/bio-editor" element={<PartnerBioPage />} />
          <Route path="/admin" element={isAdminAuthenticated() ? <AdminPanel /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/introduction" replace />} />
        </Routes>
      </div>

      {/* Global Brand footer bar */}
      {!isEmbed && showFooter && <Footer />}
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </DataProvider>
  );
}
