import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();

  const navigationGroups = [
    {
      title: "TRUNG TÂM ĐIỀU HÀNH THÔNG MINH",
      items: [
        {
          id: "dashboard",
          label: "1. Command & Analytics",
          subLabel: "Tổng quan & Nhật ký kiểm toán",
          icon: "dashboard",
          accent: "from-blue-500 to-indigo-600",
        },
        {
          id: "ai_sentinel",
          label: "2. AI & Security Sentinel",
          subLabel: "Bộ não AI, Robot & Sentinel Armor",
          icon: "psychology",
          accent: "from-cyan-500 via-blue-600 to-indigo-600",
          glow: true,
        },
        {
          id: "users",
          label: "3. Thành Viên & Hỗ Trợ",
          subLabel: "Quản lý user, Edu KYC & Ticket",
          icon: "group",
          count: counts.users,
          accent: "from-emerald-500 to-teal-600",
        },
        {
          id: "ecosystem",
          label: "4. Hệ Sinh Thái & Media",
          subLabel: "HugoStore, Cinema & Coder",
          icon: "storefront",
          count: counts.utilityStore,
          accent: "from-purple-500 to-pink-600",
        },
        {
          id: "system",
          label: "5. An Ninh & Cài Đặt",
          subLabel: "Cấu hình 8099, OAuth & Passkey",
          icon: "shield_lock",
          count: counts.openTickets,
          alert: counts.openTickets > 0,
          accent: "from-rose-500 to-red-600",
        },
      ],
    },
  ];

  const renderNavItems = () => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
          {group.title}
        </h4>
        <div className="space-y-2">
          {group.items.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/50 dark:hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tab.accent} flex items-center justify-center shrink-0 shadow-sm ${
                      tab.glow ? "ring-2 ring-cyan-400/50 shadow-cyan-500/30" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">
                      {tab.icon}
                    </span>
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate font-extrabold tracking-tight text-[12.5px] leading-tight">
                      {tab.label}
                    </span>
                    <span className={`block truncate text-[10px] font-medium ${isActive ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>
                      {tab.subLabel}
                    </span>
                  </div>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                      tab.alert
                        ? "bg-rose-500 text-white animate-pulse"
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                    }`}
                  >
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
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#10121e]/90 backdrop-blur-3xl h-full z-20 select-none shadow-xl">
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-slate-200/60 dark:border-white/10">
            <HugoLogo />
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold border border-blue-500/20">
              v2.5 Armor
            </span>
          </div>

          {/* Nav Items Scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
            {renderNavItems()}
          </div>

          {/* Footer Logout */}
          <div className="p-4 border-t border-slate-200/60 dark:border-white/10 shrink-0 bg-black/5 dark:bg-white/5">
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

      {/* ── MOBILE BOTTOM DOCK (5 Hubs) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-3xl border-t border-white/10 px-2 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around gap-1 px-1 py-0.5 overflow-x-auto scrollbar-none">
          {navigationGroups[0].items.map((tab) => {
            const isActive = activeTab === tab.id;
            const mobileLabels = {
              dashboard: "Tổng quan",
              ai_sentinel: "AI & Sentinel",
              users: "Thành viên",
              ecosystem: "Hệ sinh thái",
              system: "An ninh",
            };
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10.5px] font-extrabold shrink-0 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{mobileLabels[tab.id] || tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
