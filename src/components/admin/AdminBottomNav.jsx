import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminBottomNav({ 
  activeTab, 
  setActiveTab, 
  counts 
}) {
  const { t } = useTranslation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 nav-bottom-safe bg-white/95 dark:bg-background/95 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {[
        { id: "users", label: t("adminPanel.bottomNav.users"), icon: "group", count: counts.users },
        { id: "bookings", label: t("adminPanel.bottomNav.bookings"), icon: "calendar_month", count: counts.bookings },
        { id: "payments", label: t("admin.payments.tab_title", "Thanh toán"), icon: "payments" },
        { id: "partners", label: t("adminPanel.bottomNav.partners"), icon: "handshake" },
        { id: "packages", label: t("adminPanel.bottomNav.packages"), icon: "featured_play_list" },
        { id: "support", label: t("adminPanel.bottomNav.support"), icon: "support_agent", count: counts.support },
        { id: "settings", label: t("adminPanel.bottomNav.settings"), icon: "settings" }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all ${
            activeTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative py-2 mt-1">
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`absolute -top-0 -right-2 px-1 rounded-full text-[7.5px] font-black leading-none ${
                tab.id === "bookings" || tab.id === "support"
                  ? "bg-destructive text-white animate-pulse"
                  : "bg-muted-foreground text-white"
              }`}>
                {tab.count}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold pb-2 tracking-wide">{tab.label}</span>
          {activeTab === tab.id && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </nav>
  );
}
