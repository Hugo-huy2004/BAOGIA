import { ADMIN_ROLES } from "../../../../../packages/shared/adminAccess";
import { ADMIN_GROUPS } from "./adminDestinations";

export default function AdminHeader({ onOpenPalette, destination, session }) {
  const role = ADMIN_ROLES[session?.adminRole] || ADMIN_ROLES.owner;
  const group = ADMIN_GROUPS.find((item) => item.id === destination?.group)?.title || "Admin";
  return (
    <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-7">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          <span>Hugo Control</span><span>/</span><span>{group}</span>
        </div>
        <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{destination?.label || "Quản trị"}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenPalette} className="hidden h-10 min-w-52 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:bg-white sm:flex">
          <span className="material-symbols-outlined text-[18px]">search</span><span className="flex-1">Tìm trang hoặc thành viên</span><kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px]">⌘K</kbd>
        </button>
        <button type="button" onClick={onOpenPalette} aria-label="Mở tìm kiếm" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 sm:hidden"><span className="material-symbols-outlined text-[20px]">search</span></button>
        <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{(session?.displayName || "A").slice(0, 1).toUpperCase()}</div>
          <div className="max-w-40"><p className="truncate text-xs font-black text-slate-900">{session?.displayName || "Quản trị viên"}</p><p className="truncate text-[10px] text-slate-500">{role.label}</p></div>
        </div>
      </div>
    </header>
  );
}
