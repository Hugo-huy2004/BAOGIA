export default function AdminHeader({ onOpenPalette, usersCount = 0, systemStatus = "Online" }) {
  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#10121e]/85 backdrop-blur-3xl flex items-center justify-between gap-4 shrink-0 z-20 select-none shadow-sm">
      
      {/* Status Capsules */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{systemStatus}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold">
          <span className="material-symbols-outlined text-sm text-blue-500">group</span>
          <span>{usersCount.toLocaleString()} thành viên</span>
        </div>
      </div>

      {/* ⌘K Command Search Bar Capsule */}
      <button
        onClick={onOpenPalette}
        className="flex items-center justify-between gap-4 h-10 px-4 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold w-56 sm:w-80 shadow-inner group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-base text-blue-500 group-hover:scale-110 transition-transform">search</span>
          <span className="truncate">Tìm lệnh hoặc soi thành viên...</span>
        </div>
        <kbd className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono font-extrabold text-slate-500 dark:text-slate-400 border border-black/10 dark:border-white/10">⌘K</kbd>
      </button>

      {/* Quick Action Button */}
      <button
        onClick={onOpenPalette}
        title="Chạy lệnh điều hành nhanh"
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center active:scale-95 hover:shadow-lg hover:shadow-blue-600/30 transition-all shrink-0"
      >
        <span className="material-symbols-outlined text-lg">bolt</span>
      </button>
    </header>
  );
}
