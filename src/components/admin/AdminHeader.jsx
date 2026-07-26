import React from "react";

export default function AdminHeader({ onOpenPalette, usersCount = 0, systemStatus = "Online" }) {
  return (
    <header className="px-4 sm:px-6 py-3 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-2xl flex items-center justify-between gap-4 shrink-0 z-10 select-none">
      
      {/* Apple System Health & Online Badges */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span>{systemStatus} • 99.9% UPTIME</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider shadow-sm">
          <span className="material-symbols-outlined text-xs">group</span>
          <span>{usersCount.toLocaleString()} THÀNH VIÊN</span>
        </div>
      </div>

      {/* macOS ⌘K Spotlight Trigger Button */}
      <button
        onClick={onOpenPalette}
        className="flex items-center justify-between gap-4 px-4 py-2 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-foreground hover:border-blue-500/50 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all text-xs font-semibold w-60 sm:w-80 shadow-sm group"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-blue-500 group-hover:scale-110 transition-transform">search</span>
          <span className="truncate">Tìm kiếm lệnh hoặc user...</span>
        </div>
        <kbd className="px-2 py-0.5 text-[10px] font-mono font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          title="Chạy lệnh AI Lượng Tử"
          className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
        </button>
      </div>
    </header>
  );
}
