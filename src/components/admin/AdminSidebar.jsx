import React from "react";
import HugoLogo from "../HugoLogo";

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  counts, 
  handleLogout 
}) {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#12111a] sticky top-14 h-[calc(100vh-56px)] z-20 justify-between p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <span className="text-[9px] bg-primary/10 text-primary dark:bg-[#1a1727] dark:text-[#a5b4fc] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-primary/20 inline-block">
            Admin Workspace
          </span>
          <h1 className="font-display text-lg font-black text-slate-800 dark:text-white mt-2">
            <HugoLogo className="text-xl font-black tracking-tight" />
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Bảng điều khiển</p>
        </div>

        <nav className="space-y-1">
          {[
            { id: "users", label: "Quản Lý Thành Viên", icon: "group", count: counts.users },
            { id: "bookings", label: "Quản Lý Lịch Hẹn", icon: "calendar_month", count: counts.bookings },
            { id: "partners", label: "Đối Tác Liên Kết", icon: "handshake", count: counts.partners },
            { id: "packages", label: "Gói Dịch Vụ", icon: "featured_play_list", count: counts.packages },
            { id: "support", label: "Hỗ Trợ 1:1", icon: "support_agent", count: counts.support },
            { id: "settings", label: "Cài Đặt Hệ Thống", icon: "settings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary dark:bg-[#201830] dark:text-[#a5b4fc]"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  tab.id === "bookings" || tab.id === "support"
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl border border-slate-200 dark:border-slate-750 transition-colors mt-6"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        <span>Đăng Xuất</span>
      </button>
    </aside>
  );
}
