import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "../member/portal/NotificationBell";
import { useJoyStore } from "../../stores/joyStore";
import { prefetchChunk } from "../../utils/chunkPrefetcher";

// Sidebar navigation — grouped like Apple System Settings (colorful icon tile
// + label). Paths drive react-router; ids drive active-state highlighting.
const NAV_GROUPS = [
  {
    category: "Ứng dụng",
    items: [
      { id: "utilities", label: "Tiện ích", icon: "grid_view", path: "/member/utilities", bg: "from-blue-500 to-indigo-600" },
      { id: "bio", label: "Hồ sơ Bio", icon: "badge", path: "/member/account", bg: "from-purple-500 to-pink-500" },
      { id: "arcade", label: "HugoArcade", icon: "sports_esports", path: "/member/utilities/arcade", bg: "from-amber-500 to-orange-600" },
      { id: "psychology", label: "HugoPSY", icon: "psychology", path: "/member/utilities/psychology", bg: "from-teal-400 to-emerald-600" },
      { id: "ide", label: "HugoCoder", icon: "terminal", path: "/member/utilities/ide", bg: "from-blue-600 to-cyan-600" },
      { id: "radio", label: "HugoRadio", icon: "graphic_eq", path: "/member/utilities/radio", bg: "from-pink-500 to-purple-600" },
      { id: "map", label: "Khám phá", icon: "explore", path: "/member/map", bg: "from-sky-500 to-blue-600" },
    ],
  },
  {
    category: "Cá nhân",
    items: [
      { id: "joy_wallet", label: "Ví JOY", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet", bg: "from-amber-400 to-orange-600" },
      { id: "history", label: "Thông báo", icon: "notifications", path: "/member/history", bg: "from-indigo-500 to-purple-600" },
      { id: "settings", label: "Cài đặt", icon: "tune", path: "/member/settings", bg: "from-slate-500 to-slate-700" },
    ],
  },
];

const TAB_TITLES = {
  utilities: "Tiện ích",
  joy: "Ví JOY",
  map: "Khám phá",
  partner: "Đối tác",
  history: "Thông báo",
  settings: "Cài đặt",
  account: "Hồ sơ",
};

export default function DesktopAppleLayout({
  children,
  memberSession,
  bio,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onOpenSpotlight,
  activeTab,
  selectedUtility,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const joyBalance = useJoyStore((s) => s.balance);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Keyboard shortcuts: ⌘K spotlight, ⌘B toggle sidebar.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSpotlight?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSpotlight]);

  const currentPath = location.pathname;
  const isAppActive = useCallback(
    (appId) => {
      if (appId === "utilities" && currentPath === "/member/utilities" && !selectedUtility) return true;
      if (appId === "bio" && (currentPath === "/member/account" || selectedUtility === "bio")) return true;
      if (appId === "map" && currentPath === "/member/map") return true;
      if (appId === "arcade" && (currentPath.startsWith("/member/utilities/arcade") || selectedUtility === "arcade")) return true;
      if (appId === "psychology" && (currentPath.startsWith("/member/utilities/psychology") || selectedUtility === "psychology")) return true;
      if (appId === "ide" && (currentPath.startsWith("/member/utilities/ide") || selectedUtility === "ide")) return true;
      if (appId === "radio" && (currentPath.startsWith("/member/utilities/radio") || selectedUtility === "radio")) return true;
      if (appId === "joy_wallet" && (currentPath.startsWith("/member/utilities/joy_wallet") || selectedUtility === "joy_wallet")) return true;
      if (appId === "history" && currentPath === "/member/history") return true;
      if (appId === "settings" && currentPath === "/member/settings") return true;
      return false;
    },
    [currentPath, selectedUtility]
  );

  const pageTitle = TAB_TITLES[activeTab] || "Hugo Studio";
  const avatarUrl = memberSession?.avatarUrl || bio?.avatarUrl;
  const displayName = memberSession?.displayName || bio?.displayName || "Member";

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans flex">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 248 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className="shrink-0 h-screen sticky top-0 border-r border-border/60 bg-card flex flex-col overflow-hidden"
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>widgets</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-foreground tracking-tight truncate">Hugo Studio</span>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-5 scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.category} className="space-y-0.5">
              {!sidebarCollapsed && (
                <p className="px-3 pb-1 text-[11px] font-medium text-muted-foreground/70">
                  {group.category}
                </p>
              )}
              {group.items.map((item) => {
                const active = isAppActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => prefetchChunk(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                      </span>
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer user chip */}
        <button
          onClick={() => navigate("/member/account")}
          className={`shrink-0 m-2 flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}
          title="Hồ sơ cá nhân"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">Xem hồ sơ</p>
            </div>
          )}
        </button>
      </motion.aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        {/* Top bar */}
        <header className="h-14 shrink-0 sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center gap-2 px-4">
          <button
            onClick={() => setSidebarCollapsed((p) => !p)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            title="Thu gọn thanh bên (⌘B)"
          >
            <span className="material-symbols-outlined text-xl">dock_to_right</span>
          </button>

          <h1 className="text-base font-semibold text-foreground tracking-tight truncate">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Spotlight search */}
            <button
              onClick={onOpenSpotlight}
              className="flex items-center gap-2 h-9 px-3 rounded-full bg-muted/70 hover:bg-muted text-muted-foreground transition-colors active:scale-95"
              title="Tìm kiếm (⌘K)"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <kbd className="hidden lg:inline text-[11px] font-mono">⌘K</kbd>
            </button>

            {/* JOY balance */}
            <button
              onClick={() => navigate("/member/utilities/joy_wallet")}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-sm transition-colors hover:bg-amber-500/20 active:scale-95"
              title="Ví điểm JOY"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              <span>{(joyBalance || bio?.joyBalance || 0).toLocaleString("vi-VN")}</span>
            </button>

            {/* Notifications */}
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={onMarkRead}
              onMarkAllRead={onMarkAllRead}
              onDismiss={onDismiss}
            />

            {/* Avatar → account */}
            <button
              onClick={() => navigate("/member/account")}
              className="active:scale-95 transition-transform"
              title="Hồ sơ cá nhân"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
