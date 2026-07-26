import React from "react";

export default function AdminHeader({ onOpenPalette, usersCount = 0, systemStatus = "Online" }) {
  return (
    <header className="h-14 px-4 sm:px-6 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0 z-10 select-none">

      {/* System Health & Members */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{systemStatus}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <span className="material-symbols-outlined text-sm">group</span>
          <span>{usersCount.toLocaleString()} thành viên</span>
        </div>
      </div>

      {/* ⌘K Command Search */}
      <button
        onClick={onOpenPalette}
        className="flex items-center justify-between gap-4 h-9 px-3.5 rounded-full bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-sm w-60 sm:w-80"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-lg">search</span>
          <span className="truncate">Tìm lệnh hoặc thành viên</span>
        </div>
        <kbd className="text-[11px] font-mono text-muted-foreground/70">⌘K</kbd>
      </button>

      {/* Quick Action */}
      <button
        onClick={onOpenPalette}
        title="Chạy lệnh nhanh"
        className="w-9 h-9 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center active:scale-95 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">bolt</span>
      </button>
    </header>
  );
}
