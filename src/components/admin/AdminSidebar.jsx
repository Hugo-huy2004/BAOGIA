import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSidebar({ activeTab, setActiveTab, counts, handleLogout }) {
  const { t } = useTranslation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigationGroups = [
    {
      title: "Tổng Quan",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "dashboard" },
        { id: "automation", label: "Tự Động Hóa", icon: "rocket_launch" },
      ]
    },
    {
      title: "Khách Hàng & Liên Hệ",
      items: [
        { id: "users", label: t("adminPanel.sidebar.users", "Thành viên"), icon: "group", count: counts.users },
        { id: "contactSupport", label: "Liên Hệ & Hỗ Trợ", icon: "support_agent", count: counts.contactSupport, alert: true },
      ]
    },
    {
      title: "Tiện Ích & Đối Tác",
      items: [
        { id: "partners", label: t("adminPanel.sidebar.partners", "Đối tác"), icon: "handshake", count: counts.partners },
        { id: "services", label: "Dịch vụ & Thanh toán", icon: "storefront" },
        { id: "utilityStore", label: t("adminPanel.sidebar.utilityStore", "Cửa hàng"), icon: "shopping_cart", count: counts.utilityStore },
      ]
    },
    {
      title: "Hệ Thống",
      items: [
        { id: "projects", label: t("adminPanel.sidebar.projects", "Dự án"), icon: "assignment", count: counts.projects, external: true },
        { id: "settings", label: t("adminPanel.sidebar.settings", "Cài đặt"), icon: "settings" },
      ]
    }
  ];

  const renderNavItems = (isMobile = false) => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 opacity-70">
          {group.title}
        </h4>
        <div className="space-y-0.5">
          {group.items.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.external) {
                    window.location.href = `/admin/${tab.id}`;
                    return;
                  }
                  setActiveTab(tab.id);
                  if (isMobile) setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${
                  isActive 
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" 
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-slate-900 dark:text-white" : "text-muted-foreground"}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    tab.alert ? "bg-destructive text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-white dark:bg-card h-full z-20">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 shrink-0">
            <h1 className="font-display text-xl font-black text-foreground mb-1">
              <HugoLogo />
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Admin Workspace
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
            {renderNavItems()}
          </nav>

          {/* Bottom Logout */}
          <div className="p-4 border-t border-border shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>{t("admin.texts.txt_122", "Đăng xuất")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER + HAMBURGER MENU ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-background border-b border-border sticky top-14 z-30">
        <div className="font-display text-lg font-black flex items-center gap-2">
          <HugoLogo />
          <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>
        </div>
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-4/5 max-w-xs bg-white dark:bg-background z-[9999] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-3 py-6">
                {renderNavItems(true)}
              </div>

              <div className="p-4 border-t border-border bg-slate-50 dark:bg-card/50 shrink-0">
                <button
                  onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-destructive text-white font-bold text-sm shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  {t("admin.texts.txt_122", "Đăng xuất")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
