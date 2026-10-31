import { useState } from "react";
import HugoLogo from "../HugoLogo";
import { ADMIN_GROUPS, destinationsForPermissions } from "./adminDestinations";

const MOBILE_IDS = ["dashboard", "queue", "users", "hugoteam"];

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout, session }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const destinations = destinationsForPermissions(session?.permissions);
  const groups = ADMIN_GROUPS
    .map((group) => ({ ...group, items: destinations.filter((item) => item.group === group.id) }))
    .filter((group) => group.items.length);

  const open = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const item = (destination, compact = false) => {
    const active = destination.id === activeTab;
    const count = destination.countKey ? counts[destination.countKey] : 0;
    return (
      <button
        key={destination.id}
        type="button"
        onClick={() => open(destination.id)}
        aria-current={active ? "page" : undefined}
        className={`group relative flex w-full items-center gap-3 rounded-xl text-left transition-colors ${compact ? "px-3 py-3" : "px-3 py-2.5"} ${
          active ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${active ? "text-slate-950" : "text-slate-500 group-hover:text-white"}`}>
          {destination.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold">{destination.label}</span>
          {!compact && <span className={`block truncate text-[10px] ${active ? "text-slate-500" : "text-slate-600"}`}>{destination.sub}</span>}
        </span>
        {count > 0 && <span className={`min-w-5 rounded-full px-1.5 text-center text-[10px] font-black ${active ? "bg-slate-950 text-white" : "bg-amber-400 text-slate-950"}`}>{count}</span>}
      </button>
    );
  };

  return (
    <>
      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-white/8 bg-[#0b0d12] text-white md:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/8 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white"><HugoLogo className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight">Hugo Control</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{session?.displayName || "Quản trị"}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng quản trị">
          {groups.map((group) => (
            <section key={group.id} className="mb-5">
              <h2 className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">{group.title}</h2>
              <div className="space-y-1">{group.items.map((destination) => item(destination))}</div>
            </section>
          ))}
        </nav>

        <div className="border-t border-white/8 p-3">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400">
            <span className="material-symbols-outlined text-[19px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[78dvh] overflow-y-auto rounded-t-[28px] bg-[#0b0d12] p-4 pb-8 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <div><p className="font-black">Khu vực quản trị</p><p className="text-xs text-slate-500">{session?.displayName || "Quản trị viên"}</p></div>
              <button type="button" aria-label="Đóng" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8"><span className="material-symbols-outlined">close</span></button>
            </div>
            {groups.map((group) => <section key={group.id} className="mb-5"><h2 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{group.title}</h2><div className="space-y-1">{group.items.map((destination) => item(destination, true))}</div></section>)}
            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 py-3 text-sm font-bold text-rose-400"><span className="material-symbols-outlined">logout</span>Đăng xuất</button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0d12]/96 px-2 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Điều hướng nhanh">
        <div className="grid grid-cols-5 gap-1">
          {MOBILE_IDS.map((id) => destinations.find((destination) => destination.id === id)).filter(Boolean).map((destination) => (
            <button key={destination.id} type="button" onClick={() => open(destination.id)} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-bold ${activeTab === destination.id ? "bg-white text-slate-950" : "text-slate-500"}`}>
              <span className="material-symbols-outlined text-[19px]">{destination.icon}</span>{destination.label}
            </button>
          ))}
          <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[9px] font-bold text-slate-500"><span className="material-symbols-outlined text-[19px]">menu</span>Tất cả</button>
        </div>
      </nav>
    </>
  );
}
