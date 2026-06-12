import React from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";
import { Badge } from "../ui/Badge";

const TABS = (t, counts) => [
  { id: "dashboard", label: "Dashboard",               icon: "dashboard",          color: "text-primary" },
  { id: "ai",        label: "AI Center",               icon: "auto_awesome",       color: "text-accent", badge: "NEW" },
  { id: "users",     label: t("adminPanel.sidebar.users"),    icon: "group",         count: counts.users },
  { id: "bookings",  label: t("adminPanel.sidebar.bookings"), icon: "calendar_month",count: counts.bookings, urgent: true },
  { id: "partners",  label: t("adminPanel.sidebar.partners"), icon: "handshake",     count: counts.partners },
  { id: "packages",  label: t("adminPanel.sidebar.packages"), icon: "featured_play_list", count: counts.packages },
  { id: "payments",  label: "Chuyển Khoản",             icon: "payments" },
  { id: "support",   label: t("adminPanel.sidebar.support"),  icon: "support_agent", count: counts.support, urgent: true },
  { id: "settings",  label: t("adminPanel.sidebar.settings"), icon: "settings" },
];

const MOBILE_TABS = (t, counts) => [
  { id: "dashboard", label: "Home",   icon: "dashboard" },
  { id: "users",     label: "Users",  icon: "group",           count: counts.users },
  { id: "bookings",  label: "Lịch",   icon: "calendar_month",  count: counts.bookings, urgent: true },
  { id: "ai",        label: "AI",     icon: "auto_awesome" },
  { id: "support",   label: "Ticket", icon: "support_agent",   count: counts.support, urgent: true },
  { id: "settings",  label: "Cài đặt", icon: "settings" },
];

export default function AdminSidebar({ activeTab, setActiveTab, counts, handleLogout }) {
  const { t } = useTranslation();
  const tabs       = TABS(t, counts);
  const mobileTabs = MOBILE_TABS(t, counts);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card sticky top-14 h-[calc(100vh-56px)] z-20 justify-between overflow-hidden">

        {/* Top glow accent */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-4">
          {/* Brand header */}
          <div className="px-2 pt-2 pb-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-primary/20 mb-2">
              <span className="material-symbols-outlined text-[10px]">admin_panel_settings</span>
              Admin Workspace
            </span>
            <h1 className="font-display text-lg font-black text-foreground">
              <HugoLogo className="text-xl font-black tracking-tight" />
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
              {t("adminPanel.sidebar.dashboard", "Bảng điều khiển")}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => {
                    if (tab.id === "projects") { window.location.href = "/admin/projects"; return; }
                    setActiveTab(tab.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                    isActive
                      ? "bg-primary/10 text-primary font-black border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[18px] transition-transform group-hover:scale-110 ${isActive ? "text-primary" : (tab.color || "")}`}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                      tab.urgent ? "bg-destructive text-white animate-pulse" : "bg-muted text-muted-foreground"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Projects external link */}
            <button
              onClick={() => { window.location.href = "/admin/projects"; }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">assignment</span>
                <span>Dự án</span>
              </div>
              {counts.projects > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-muted text-muted-foreground">
                  {counts.projects}
                </span>
              )}
            </button>
          </nav>

          {/* Bottom: admin info + logout */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-white">A</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-foreground truncate">Hugo Admin</p>
                <p className="text-[9px] text-muted-foreground truncate">Toàn quyền hệ thống</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>{t("admin.texts.txt_122", "Đăng xuất")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 nav-bottom-safe bg-card/95 backdrop-blur-xl border-t border-border z-40 flex items-center justify-around px-1 shadow-[0_-8px_32px_hsl(var(--shadow)/0.08)]">
        {mobileTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-[22px] transition-all ${isActive ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[7px] font-black leading-none flex items-center justify-center ${
                    tab.urgent ? "bg-destructive text-white animate-pulse" : "bg-muted-foreground text-background"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold mt-0.5 transition-all ${isActive ? "font-black" : ""}`}>
                {tab.label}
              </span>
              {isActive && <span className="absolute bottom-1.5 w-4 h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>
    </>
  );
}
