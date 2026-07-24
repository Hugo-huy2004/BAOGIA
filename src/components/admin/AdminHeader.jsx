import React from "react";

export default function AdminHeader({ onOpenPalette, usersCount = 0, systemStatus = "Online" }) {
  return (
    <header className="px-4 sm:px-6 py-3 border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0 z-10">
      
      {/* System Status Pills */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span>{systemStatus} • 99.9% UPTIME</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
          <span className="material-symbols-outlined text-xs">group</span>
          <span>{usersCount} THÀNH VIÊN</span>
        </div>
      </div>

      {/* Global ⌘K Command Input Button Trigger */}
      <button
        onClick={onOpenPalette}
        className="flex items-center justify-between gap-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-xs font-semibold w-64 sm:w-80 shadow-inner group"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary group-hover:scale-110 transition-transform">search</span>
          <span className="truncate">Tìm kiếm lệnh hoặc user...</span>
        </div>
        <kbd className="px-2 py-0.5 text-[9px] font-mono font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Quick Action Icon Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenPalette}
          title="Chạy lệnh AI Lượng Tử"
          className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
        </button>
      </div>
    </header>
  );
}
