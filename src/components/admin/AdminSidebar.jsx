import React from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();

  const navigationGroups = [
    {
      title: "TRUNG TÂM ĐIỀU HÀNH",
      items: [
        { id: "dashboard", label: "Control Hub & AI Terminal", icon: "dashboard" },
        { id: "users", label: "Thành Viên & Hỗ Trợ", icon: "group", count: counts.users },
        { id: "ecosystem", label: "Hệ Sinh Thái & Cửa Hàng", icon: "storefront", count: counts.utilityStore },
        { id: "coder", label: "HugoCoder Portal", icon: "school" },
        { id: "system", label: "Giám Sát & Cài Đặt", icon: "tune", count: counts.contactSupport, alert: counts.contactSupport > 0 },
      ]
    }
  ];

  const renderNavItems = () => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-3 opacity-70">
          {group.title}
        </h4>
        <div className="space-y-1">
          {group.items.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13px] font-bold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-white" : "text-muted-foreground"}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    tab.alert ? "bg-destructive text-white animate-pulse" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Apple Studio Control Center v3.0
            </p>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
            {renderNavItems()}
          </div>

          {/* User Profile / Logout */}
          <div className="p-3 border-t border-border shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">logout</span>
                <span>{t("adminPanel.sidebar.logout", "Đăng xuất")}</span>
              </div>
              <span className="text-[10px] opacity-60">Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-card/90 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navigationGroups[0].items.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                isActive ? "text-primary font-black scale-105" : "text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              <span className="text-[9px] font-bold mt-0.5 max-w-[60px] truncate">{tab.label.split(" ")[1] || tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
