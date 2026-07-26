import React from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();

  const navigationGroups = [
    {
      title: "QUẢN TRỊ HỆ THỐNG",
      items: [
        { id: "dashboard", label: "Control Hub & Terminal", icon: "dashboard", accent: "from-blue-500 to-indigo-600" },
        { id: "users", label: "Thành Viên & Support", icon: "group", count: counts.users, accent: "from-emerald-500 to-teal-600" },
        { id: "ecosystem", label: "Hệ Sinh Thái & Cửa Hàng", icon: "storefront", count: counts.utilityStore, accent: "from-purple-500 to-pink-600" },
        { id: "coder", label: "HugoCoder Portal", icon: "school", accent: "from-amber-500 to-orange-600" },
        { id: "system", label: "Giám Sát & Cài Đặt", icon: "tune", count: counts.openTickets, alert: counts.openTickets > 0, accent: "from-rose-500 to-red-600" },
      ]
    }
  ];

  const renderNavItems = () => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
          {group.title}
        </h4>
        <div className="space-y-1.5">
          {group.items.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? `bg-gradient-to-r ${tab.accent} text-white shadow-lg shadow-blue-500/20 scale-[1.02]`
                    : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/5 active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${isActive ? "bg-white/20 text-white" : "bg-slate-200/60 dark:bg-white/5 text-slate-500 dark:text-slate-400"}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {tab.icon}
                    </span>
                  </div>
                  <span className="tracking-tight">{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    tab.alert ? "bg-rose-500 text-white animate-pulse" : isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
      {/* ── DESKTOP APPLE SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/60 dark:border-white/10 bg-slate-100/70 dark:bg-[#1c1c1e]/70 backdrop-blur-2xl h-full z-20 select-none">
        <div className="flex flex-col h-full">
          {/* macOS Traffic Lights Header */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" title="Close" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" title="Minimize" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" title="Expand" />
          </div>

          {/* Brand Title */}
          <div className="px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <HugoLogo />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                macOS Admin Studio
              </span>
            </div>
          </div>

          {/* Nav Items Scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
            {renderNavItems()}
          </div>

          {/* Footer User Profile & Logout */}
          <div className="p-3 border-t border-slate-200/60 dark:border-white/10 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base">logout</span>
                <span>{t("adminPanel.sidebar.logout", "Đăng xuất")}</span>
              </div>
              <span className="text-[10px] font-mono font-bold opacity-60 bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded">Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM APPLE NAV BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl border-t border-slate-200/60 dark:border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl">
        {navigationGroups[0].items.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                isActive ? "text-blue-500 font-black scale-110" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              <span className="text-[9px] font-extrabold mt-0.5 max-w-[65px] truncate">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
