import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();

  const navigationGroups = [
    {
      title: "Quản trị hệ thống",
      items: [
        { id: "dashboard", label: "Tổng quan", icon: "dashboard", accent: "from-blue-500 to-indigo-600" },
        { id: "users", label: "Thành viên & Hỗ trợ", icon: "group", count: counts.users, accent: "from-emerald-500 to-teal-600" },
        { id: "ecosystem", label: "Hệ sinh thái & Cửa hàng", icon: "storefront", count: counts.utilityStore, accent: "from-purple-500 to-pink-600" },
        { id: "coder", label: "Study · Web Dev", icon: "school", accent: "from-amber-500 to-orange-600" },
        { id: "system", label: "Giám sát & Cài đặt", icon: "tune", count: counts.openTickets, alert: counts.openTickets > 0, accent: "from-rose-500 to-red-600" },
      ]
    }
  ];

  const renderNavItems = () => {
    return navigationGroups.map((group, gIdx) => (
      <div key={gIdx} className="mb-6 last:mb-0">
        <h4 className="text-[11px] font-medium text-muted-foreground/70 px-3 mb-2">
          {group.title}
        </h4>
        <div className="space-y-0.5">
          {group.items.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium transition-colors select-none ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tab.accent} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {tab.icon}
                    </span>
                  </div>
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                    tab.alert ? "bg-destructive text-white" : isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
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
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/60 bg-card h-full z-20 select-none">
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="h-14 flex items-center px-5 shrink-0">
            <HugoLogo />
          </div>

          {/* Nav Items Scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
            {renderNavItems()}
          </div>

          {/* Footer Logout */}
          <div className="p-3 border-t border-border/60 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>{t("adminPanel.sidebar.logout", "Đăng xuất")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/60 px-3 py-2 flex items-center justify-around">
        {navigationGroups[0].items.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              <span className="text-[10px] font-medium mt-0.5 max-w-[65px] truncate">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
