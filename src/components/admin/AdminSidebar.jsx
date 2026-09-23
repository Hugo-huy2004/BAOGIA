import { useState } from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";
import { ADMIN_DESTINATIONS, ADMIN_GROUPS, ADMIN_REALMS, DAILY_DESTINATION_IDS } from "./adminDestinations";

/** Năm điểm đến hay dùng nhất trên điện thoại. */
const MOBILE_DOCK_IDS = ["queue", "dashboard", "users", "support", "monitor"];

export default function AdminSidebar({ activeTab, setActiveTab, counts = {}, handleLogout }) {
  const { t } = useTranslation();
  // Mặc định gập phần ít dùng. Mở ra là nhớ, vì người đang tìm một mục hiếm
  // thường tìm vài lần liên tiếp.
  const [showAll, setShowAll] = useState(
    () => DAILY_DESTINATION_IDS.every((id) => id !== activeTab),
  );

  // Danh sách điểm đến nằm ở `adminDestinations.js`. Trước đây nó được viết
  // thẳng trong tệp này, nên thêm một màn hình phải sửa ba nơi và rất dễ quên
  // một nơi — đó là lý do có mục hiện ở thanh bên mà bấm vào không ra gì.
  // Ba tầng: vận hành · mặt tiền · hậu trường. Tầng là một ĐƯỜNG KẺ để nhìn,
  // không phải một tầng phải bấm qua — mọi mục vẫn chỉ cách một cú bấm.
  const realms = ADMIN_REALMS.map((realm) => ({
    ...realm,
    groups: ADMIN_GROUPS
      .filter((group) => group.realm === realm.id)
      .map((group) => ({ ...group, items: ADMIN_DESTINATIONS.filter((d) => d.group === group.id) }))
      .filter((group) => group.items.length),
  })).filter((realm) => realm.groups.length);

  const renderItem = (tab) => {
    const isActive = activeTab === tab.id;
    const count = tab.countKey ? counts[tab.countKey] : undefined;
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tab.accent} flex items-center justify-center shrink-0 shadow-sm ${
              tab.glow ? "ring-2 ring-amber-400/50 shadow-amber-500/30" : ""
            }`}
          >
            <span className="material-symbols-outlined text-white text-[18px]">{tab.icon}</span>
          </div>
          <div className="min-w-0 text-left">
            <span className="block truncate font-extrabold tracking-tight text-[12.5px] leading-tight">{tab.label}</span>
            <span className={`block truncate text-[10px] font-medium ${isActive ? "text-blue-100" : "text-slate-400 dark:text-slate-500"}`}>
              {tab.sub}
            </span>
          </div>
        </div>
        {count > 0 && (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
              tab.id === "queue"
                ? "bg-rose-500 text-white animate-pulse"
                : isActive
                ? "bg-white/20 text-white"
                : "bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300"
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  const daily = DAILY_DESTINATION_IDS
    .map((id) => ADMIN_DESTINATIONS.find((d) => d.id === id))
    .filter(Boolean);

  const renderNavItems = () => (
    <>
      <div className="mb-5">
        <p className="px-3 mb-2 text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          HẰNG NGÀY
        </p>
        <div className="space-y-1.5">{daily.map(renderItem)}</div>
      </div>

      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span>{showAll ? "Thu gọn" : `Xem tất cả (${ADMIN_DESTINATIONS.length - daily.length})`}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform ${showAll ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {showAll
        ? realms.map((realm) => {
            const groups = realm.groups
              .map((g) => ({ ...g, items: g.items.filter((i) => !DAILY_DESTINATION_IDS.includes(i.id)) }))
              .filter((g) => g.items.length);
            if (!groups.length) return null;
            return (
              <div key={realm.id} className="mt-5">
                <div className="mb-3 flex items-baseline gap-2 border-t border-slate-200/70 dark:border-white/10 pt-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
                    {realm.title}
                  </span>
                  <span className="truncate text-[9.5px] font-medium text-slate-400 dark:text-slate-500">{realm.note}</span>
                </div>
                {groups.map((group) => (
                  <div key={group.id} className="mb-4 last:mb-0">
                    <p className="px-3 mb-2 text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      {group.title}
                    </p>
                    <div className="space-y-1.5">{group.items.map(renderItem)}</div>
                  </div>
                ))}
              </div>
            );
          })
        : null}
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#10121e]/90 backdrop-blur-3xl h-full z-20 select-none shadow-xl">
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-slate-200/60 dark:border-white/10">
            <HugoLogo className="h-7 w-7" />
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

      {/* ── DOCK ĐIỆN THOẠI ──
          Năm điểm đến hay dùng nhất. Trước đây tệp này giữ một bảng `mobileLabels`
          chép tay song song với nhãn thật, nên đổi tên ở trên mà quên ở dưới là
          hai nơi hiện hai tên khác nhau. Nay lấy thẳng từ registry. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-3xl border-t border-white/10 px-2 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around gap-1 px-1 py-0.5 overflow-x-auto scrollbar-none">
          {MOBILE_DOCK_IDS.map((id) => ADMIN_DESTINATIONS.find((d) => d.id === id))
            .filter(Boolean)
            .map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.countKey ? counts[tab.countKey] : undefined;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10.5px] font-extrabold shrink-0 transition-all duration-200 active:scale-95 ${
                    isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/40" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === "queue" && count > 0 ? (
                    <span className="absolute right-1 top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-[9px] leading-4 text-white">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
        </div>
      </nav>
    </>
  );
}
