import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();

  const navigationGroups = [
    {
      title: "QUẢN TRỊ TRUNG TÂM",
      items: [
        { id: "dashboard", label: "Tổng quan", icon: "dashboard", accent: "from-blue-500 to-indigo-600" },
        { id: "robot", label: "Điều khiển Robot & Cam", icon: "precision_manufacturing", accent: "from-emerald-500 to-cyan-600", glow: true },
        { id: "brain", label: "Bộ Não AI Admin", icon: "psychology", accent: "from-cyan-500 to-blue-600", glow: true },
        { id: "sentinel", label: "BOT Security Sentinel", icon: "shield_person", accent: "from-indigo-600 to-purple-600", glow: true },
        { id: "users", label: "Thành viên & Hỗ trợ", icon: "group", count: counts.users, accent: "from-emerald-500 to-teal-600" },
        { id: "ecosystem", label: "Cửa hàng & Dịch vụ", icon: "storefront", count: counts.utilityStore, accent: "from-purple-500 to-pink-600" },
        { id: "cinema", label: "Quản trị Phim Cinema", icon: "movie", accent: "from-rose-500 to-pink-600" },
        { id: "coder", label: "Study & Web Dev", icon: "school", accent: "from-amber-500 to-orange-600" },
        { id: "audit", label: "Nhật ký Kiểm toán", icon: "history_edu", accent: "from-blue-600 to-indigo-700" },
        { id: "system", label: "Giám sát & Cài đặt", icon: "tune", count: counts.openTickets, alert: counts.openTickets > 0, accent: "from-rose-500 to-red-600" },
      ]
    }
  ];

  const renderNavItems = () => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
          {group.title}
        </h4>
        <div className="space-y-1">
          {group.items.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${tab.accent} flex items-center justify-center shrink-0 shadow-sm ${tab.glow ? 'ring-2 ring-cyan-400/40' : ''}`}>
                    <span className="material-symbols-outlined text-white text-[16px]">
                      {tab.icon}
                    </span>
                  </div>
                  <span className="truncate tracking-wide">{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                    tab.alert ? "bg-rose-500 text-white animate-pulse" : isActive ? "bg-white/20 text-white" : "bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300"
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
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#10121e]/85 backdrop-blur-3xl h-full z-20 select-none shadow-xl">
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="h-16 flex items-center px-6 shrink-0 border-b border-white/5">
            <HugoLogo />
          </div>

          {/* Nav Items Scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
            {renderNavItems()}
          </div>

          {/* Footer Logout */}
          <div className="p-4 border-t border-white/10 shrink-0 bg-black/5 dark:bg-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>{t("adminPanel.sidebar.logout", "Đăng xuất Admin")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV (iOS 27 Liquid Glass Scrollable Dock) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-3xl border-t border-white/10 px-2 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-1 py-0.5">
          {navigationGroups[0].items.map(tab => {
            const isActive = activeTab === tab.id;
            const mobileShortLabels = {
              dashboard: "Tổng quan",
              robot: "Robot Cam",
              brain: "Bộ não AI",
              sentinel: "Sentinel",
              users: "Thành viên",
              ecosystem: "HugoStore",
              cinema: "Phim Phim",
              coder: "Study",
              audit: "Kiểm toán",
              system: "Cài đặt"
            };
            const mobileLabel = mobileShortLabels[tab.id] || tab.label;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)] font-black"
                    : "bg-white/[0.05] text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{mobileLabel}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
