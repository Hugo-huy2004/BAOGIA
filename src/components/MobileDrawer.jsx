import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";
import { useData } from "../context/DataContext";
import { useTranslation } from "react-i18next";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const isLoggedIn = isMemberAuthenticated() || isAdminAuthenticated();
  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const accountLabel = isLoggedIn ? t("navbar.account", "Tài Khoản") : t("navbar.login", "Đăng Nhập");
  const accountIcon = isLoggedIn ? "account_circle" : "login";

  const { data } = useData();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const mainMenuItems = [
    { label: t("navbar.home", "Giới Thiệu"), path: "/introduction" },
    { label: t("navbar.services", "Dịch Vụ"), path: "/services" },
    { label: t("navbar.templates", "Tác Phẩm"), path: "/templates" },
    { label: t("navbar.faq", "Hỏi Đáp"), path: "/faq" },
    ...(allowBooking ? [{ label: t("navbar.booking", "Đặt Lịch & Liên Hệ"), path: "/booking" }] : [])
  ];

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:scale-105 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">menu</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[200] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Menu */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white/85 dark:bg-[#12111a]/90 backdrop-blur-2xl backdrop-saturate-200 border-r border-white/25 dark:border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-[210] transform transition-transform duration-300 md:hidden overflow-y-auto flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-surface-container dark:hover:bg-slate-800 rounded-lg"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <div className="p-6 pt-12 border-b border-outline-variant/30 dark:border-slate-700">
          <h2 className="font-display text-lg font-bold leading-none tracking-wider flex flex-wrap gap-0.5">
            <span className="text-[#ef4444] dark:text-[#f87171]">H</span>
            <span className="text-[#f97316] dark:text-[#fb923c]">u</span>
            <span className="text-[#f59e0b] dark:text-[#fbbf24]">g</span>
            <span className="text-[#10b981] dark:text-[#34d399]">o</span>
            <span className="w-1"></span>
            <span className="text-[#3b82f6] dark:text-[#60a5fa]">S</span>
            <span className="text-[#6366f1] dark:text-[#818cf8]">t</span>
            <span className="text-[#a855f7] dark:text-[#c084fc]">u</span>
            <span className="text-[#ec4899] dark:text-[#f472b6]">d</span>
            <span className="text-[#f43f5e] dark:text-[#fb7185]">i</span>
            <span className="text-[#06b6d4] dark:text-[#22d3ee]">o</span>
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Xin Chào
          </p>
        </div>

        {/* Main Menu */}
        <div className="p-4 space-y-1">
          <p className="px-4 py-2 text-xs font-bold text-on-surface-variant dark:text-slate-500 uppercase">
            {t("navbar.mainMenu", "Menu Chính")}
          </p>
          {mainMenuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-container/30 dark:bg-slate-700/40 text-primary dark:text-[#a5b4fc]"
                  : "text-on-surface dark:text-slate-200 hover:bg-primary-container/20 dark:hover:bg-slate-700/30"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth Link & Lang Switcher */}
        <div className="mt-auto px-4 py-4 border-t border-outline-variant/30 dark:border-slate-700 flex flex-col gap-1" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-700 font-medium text-sm transition-colors text-left w-full"
          >
            <span className="material-symbols-outlined text-base">language</span>
            {i18n.language.startsWith('en') ? 'Tiếng Việt (VI)' : 'English (EN)'}
          </button>

          <Link
            to={accountPath}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-slate-700 font-medium text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">{accountIcon}</span>
            {accountLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
