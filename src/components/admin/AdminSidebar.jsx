import React from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts, handleLogout }) {
  const { t } = useTranslation();

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
        { id: "community", label: "Cộng đồng", icon: "forum" },
        { id: "contactSupport", label: "Liên Hệ & Hỗ Trợ", icon: "support_agent", count: counts.contactSupport, alert: true },
      ]
    },
    {
      title: "Tiện Ích",
      items: [
        { id: "services", label: "Dịch vụ & Thanh toán", icon: "storefront" },
        { id: "utilityStore", label: t("adminPanel.sidebar.utilityStore", "Cửa hàng"), icon: "shopping_cart", count: counts.utilityStore },
      ]
    },
    {
      title: "Phát Triển",
      items: [
        { id: "hugoteam", label: "Hugo Team", icon: "groups" },
        { id: "coderSubmissions", label: "Bài nộp HugoCoder", icon: "school" },
        { id: "coderResources", label: "Học liệu HugoCoder", icon: "smart_display" },
      ]
    },
    {
      title: "Hệ Thống",
      items: [
        { id: "system", label: "Giám sát hệ thống", icon: "monitoring" },
        { id: "projects", label: t("adminPanel.sidebar.projects", "Dự án"), icon: "assignment", count: counts.projects },
        { id: "settings", label: t("adminPanel.sidebar.settings", "Cài đặt"), icon: "settings" },
      ]
    }
  ];

  const flatItems = navigationGroups.flatMap(group => group.items);

  const renderNavItems = () => {
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
                onClick={() => setActiveTab(tab.id)}
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

      {/* ── MOBILE / TABLET HEADER + SWIPEABLE TAB BAR ── */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
          <div className="font-display text-lg font-black flex items-center gap-2">
            <HugoLogo />
            <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={t("admin.texts.txt_122", "Đăng xuất")}
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>

        {/* All tabs reachable in one swipe — no extra tap through a drawer */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-3 scrollbar-hide snap-x snap-mandatory">
          {flatItems.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 shrink-0 min-w-[68px] px-3 py-2 rounded-xl snap-start transition-colors ${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <span className="relative">
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? "text-slate-900 dark:text-white" : "text-muted-foreground"}`}>
                    {tab.icon}
                  </span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-black leading-[14px] text-center ${
                      tab.alert ? "bg-destructive text-white" : "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-100"
                    }`}>
                      {tab.count > 99 ? "99+" : tab.count}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-bold whitespace-nowrap leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
