import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "../member/portal/NotificationBell";
import { useJoyStore } from "../../stores/joyStore";

// ── macOS App Icons & Metadata for Floating Dock & Sidebar ─────────────────
const DESKTOP_NAV_ITEMS = [
  {
    category: "ỨNG DỤNG HỆ THỐNG",
    items: [
      { id: "utilities", label: "Launchpad & Tiện ích", icon: "grid_view", path: "/member/utilities", bg: "from-blue-500 via-indigo-500 to-purple-600" },
      { id: "bio", label: "Hồ sơ Bio Link", icon: "badge", path: "/member/account", bg: "from-purple-500 via-pink-500 to-rose-500" },
      { id: "arcade", label: "Đấu trường HugoArcade", icon: "sports_esports", path: "/member/utilities/arcade", bg: "from-amber-500 via-orange-500 to-red-600" },
      { id: "psychology", label: "HugoPSY Trợ Lý AI", icon: "psychology", path: "/member/utilities/psychology", bg: "from-teal-400 via-emerald-500 to-cyan-600" },
      { id: "ide", label: "HugoCoder Web IDE", icon: "terminal", path: "/member/utilities/ide", bg: "from-blue-600 via-cyan-600 to-indigo-700" },
      { id: "radio", label: "HugoRadio Lofi Chill", icon: "graphic_eq", path: "/member/utilities/radio", bg: "from-pink-500 via-rose-500 to-purple-600" },
    ]
  },
  {
    category: "CÁ NHÂN & TÀI KHOẢN",
    items: [
      { id: "joy_wallet", label: "Ví Điểm JOY", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet", bg: "from-amber-400 via-amber-500 to-orange-600" },
      { id: "history", label: "Trung Tâm Thông Báo", icon: "notifications", path: "/member/history", bg: "from-indigo-500 via-purple-500 to-pink-600" },
      { id: "settings", label: "Cài Đặt Hệ Thống", icon: "tune", path: "/member/settings", bg: "from-slate-600 via-zinc-600 to-neutral-700" },
    ]
  }
];

const DOCK_APPS = [
  { id: "utilities", name: "Launchpad", icon: "grid_view", path: "/member/utilities", bg: "from-blue-500 to-indigo-600" },
  { id: "bio", name: "Bio Profile", icon: "badge", path: "/member/account", bg: "from-purple-500 to-pink-500" },
  { id: "arcade", name: "HugoArcade", icon: "sports_esports", path: "/member/utilities/arcade", bg: "from-amber-500 to-orange-600" },
  { id: "psychology", name: "HugoPSY AI", icon: "psychology", path: "/member/utilities/psychology", bg: "from-emerald-400 to-teal-600" },
  { id: "ide", name: "HugoCoder", icon: "terminal", path: "/member/utilities/ide", bg: "from-blue-600 to-cyan-600" },
  { id: "joy_wallet", name: "Ví JOY", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet", bg: "from-amber-400 to-amber-600" },
  { id: "history", name: "Thông Báo", icon: "notifications", path: "/member/history", bg: "from-indigo-500 to-purple-600" },
  { id: "divider", isDivider: true },
  { id: "settings", name: "Cài Đặt", icon: "tune", path: "/member/settings", bg: "from-slate-600 to-neutral-700" },
];

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
  selectedUtility
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const joyBalance = useJoyStore((s) => s.balance);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);

  // ── macOS Authentic Date & Live Clock ─────────────────────────────────────
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options = { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
      setCurrentTimeStr(d.toLocaleDateString("vi-VN", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Network Monitor ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── macOS Keyboard Shortcuts (⌘K, ⌘B) ───────────────────────────────────
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
    (appId, path) => {
      if (appId === "utilities" && currentPath === "/member/utilities" && !selectedUtility) return true;
      if (appId === "bio" && (currentPath === "/member/account" || selectedUtility === "bio")) return true;
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

  return (
    <div className="min-h-screen w-full bg-[#0a0c14] dark:bg-[#07080c] text-foreground font-sans selection:bg-primary/30 flex flex-col overflow-hidden relative select-none">
      {/* ── Authentic macOS Sequoia Ambient Wallpaper Surface ───────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-purple-800/10 blur-[140px] opacity-70 animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-purple-700/25 via-pink-600/15 to-amber-500/10 blur-[150px] opacity-60 animate-pulse" style={{ animationDuration: "16s" }} />
        <div className="absolute top-[30%] left-[35%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/10 blur-[130px] opacity-40" />
      </div>

      {/* ── 1. AUTHENTIC macOS TOP MENU BAR ─────────────────────────────── */}
      <header className="h-7 px-3 bg-black/40 dark:bg-black/55 backdrop-blur-3xl border-b border-white/10 text-white flex items-center justify-between z-50 shrink-0 text-[12px] font-medium tracking-tight shadow-sm">
        {/* Left: Apple Icon & Active App Menus */}
        <div className="flex items-center gap-1.5">
          {/* Apple Logo Dropdown Trigger */}
          <button
            onClick={() => setActiveMenu(activeMenu === "apple" ? null : "apple")}
            className="px-2 py-0.5 rounded hover:bg-white/15 transition-colors flex items-center justify-center font-bold text-[14px]"
            title="Menu Hệ Thống Hugo macOS"
          >
            
          </button>

          {/* Active App Title */}
          <span className="font-extrabold px-1.5 text-white tracking-wide">
            Hugo Studio
          </span>

          {/* Top Bar Navigation Menus */}
          <div className="hidden lg:flex items-center gap-0.5 text-white/80">
            {["Tệp", "Xem", "Tiện ích", "Cửa sổ", "Trợ giúp"].map((m) => (
              <button
                key={m}
                onClick={() => navigate("/member/utilities")}
                className="px-2 py-0.5 rounded hover:bg-white/15 hover:text-white transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Right: macOS Status Icons & Widgets */}
        <div className="flex items-center gap-3 text-white/90">
          {/* Ví JOY Balance Pill */}
          <button
            onClick={() => navigate("/member/utilities/joy_wallet")}
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-full text-amber-300 font-mono font-bold text-[11px] transition-all active:scale-95 shadow-2xs"
            title="Ví điểm thưởng JOY"
          >
            <span className="material-symbols-outlined text-[13px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              toll
            </span>
            <span>{(joyBalance || bio?.joyBalance || 0).toLocaleString("vi-VN")} JOY</span>
          </button>

          {/* Spotlight Search Launcher (⌘K) */}
          <button
            onClick={onOpenSpotlight}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[11px] font-semibold text-white/90 transition-all active:scale-95 cursor-pointer"
            title="Tìm kiếm ứng dụng Spotlight (⌘K)"
          >
            <span className="material-symbols-outlined text-[13px]">search</span>
            <kbd className="px-1 bg-black/40 rounded text-[9px] font-mono border border-white/20 text-white/80 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Wi-Fi Status Icon */}
          <span className="material-symbols-outlined text-[15px] opacity-80" title={isOnline ? "Đã kết nối Wi-Fi" : "Không có kết nối mạng"}>
            {isOnline ? "wifi" : "wifi_off"}
          </span>

          {/* Notification Center Trigger */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
            onDismiss={onDismiss}
          />

          {/* User Quick Avatar */}
          <button
            onClick={() => navigate("/member/account")}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            title="Hồ sơ cá nhân"
          >
            {memberSession?.avatarUrl || bio?.avatarUrl ? (
              <img src={memberSession?.avatarUrl || bio?.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/30" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary text-white font-black text-[10px] flex items-center justify-center">
                {(memberSession?.displayName || bio?.displayName || "H")[0]?.toUpperCase()}
              </div>
            )}
          </button>

          {/* Authentic Date & Time */}
          <span className="font-semibold text-[11.5px] tracking-wide text-white/90 pl-1">
            {currentTimeStr}
          </span>
        </div>
      </header>

      {/* ── 2. MAIN DESKTOP WORKSPACE WINDOW CANVAS ─────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative z-10 p-3 sm:p-4 gap-3 pb-20">
        {/* ── macOS WINDOW SHELL ────────────────────────────────────────── */}
        <div className="flex-1 bg-white/75 dark:bg-[#141519]/80 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-[24px] shadow-[0_30px_90px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10">
          
          {/* macOS Integrated Window Header & Traffic Lights */}
          <div className="h-10 px-4 bg-white/40 dark:bg-white/5 border-b border-border/30 flex items-center justify-between shrink-0 select-none">
            {/* Window Traffic Light Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/")}
                  className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-80 transition-opacity flex items-center justify-center group"
                  title="Thoát ra trang chủ"
                >
                  <span className="material-symbols-outlined text-[8px] text-black/70 opacity-0 group-hover:opacity-100 font-bold">close</span>
                </button>
                <button
                  onClick={() => setSidebarCollapsed((p) => !p)}
                  className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-80 transition-opacity flex items-center justify-center group"
                  title="Thu gọn thanh điều hướng (⌘B)"
                >
                  <span className="material-symbols-outlined text-[8px] text-black/70 opacity-0 group-hover:opacity-100 font-bold">remove</span>
                </button>
                <button
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                    } else {
                      document.exitFullscreen?.().catch(() => {});
                    }
                  }}
                  className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-80 transition-opacity flex items-center justify-center group"
                  title="Mở toàn màn hình"
                >
                  <span className="material-symbols-outlined text-[8px] text-black/70 opacity-0 group-hover:opacity-100 font-bold">unfold_more</span>
                </button>
              </div>

              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed((p) => !p)}
                className="ml-3 p-1 rounded-lg text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-all active:scale-95"
                title={sidebarCollapsed ? "Mở Sidebar (⌘B)" : "Thu gọn Sidebar (⌘B)"}
              >
                <span className="material-symbols-outlined text-lg">
                  {sidebarCollapsed ? "dock_to_left" : "sidebar_main"}
                </span>
              </button>
            </div>

            {/* Window Title / Path Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/80">
              <span className="material-symbols-outlined text-sm text-primary">desktop_windows</span>
              <span className="text-foreground font-black">Hugo Workspace</span>
              <span>/</span>
              <span className="capitalize">{activeTab || "utilities"}</span>
            </div>

            {/* Right Window Search Trigger */}
            <button
              onClick={onOpenSpotlight}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 hover:bg-muted rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Spotlight</span>
            </button>
          </div>

          {/* Window Main Split View Body (Sidebar + Content) */}
          <div className="flex-1 flex overflow-hidden">
            {/* ── macOS SIDEBAR ── */}
            <motion.aside
              initial={false}
              animate={{ width: sidebarCollapsed ? 64 : 230 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="bg-white/40 dark:bg-black/20 border-r border-border/30 flex flex-col justify-between overflow-hidden shrink-0 select-none"
            >
              {/* Navigation Group Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-hide">
                {DESKTOP_NAV_ITEMS.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    {!sidebarCollapsed && (
                      <p className="px-3 text-[9.5px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        {group.category}
                      </p>
                    )}
                    {group.items.map((item) => {
                      const active = isAppActive(item.id, item.path);
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative group ${
                            active
                              ? "bg-primary text-white shadow-md shadow-primary/25 font-extrabold"
                              : "text-muted-foreground hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground"
                          } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          {/* Vibrant App Badge */}
                          <div
                            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110`}
                          >
                            <span className="material-symbols-outlined text-white text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {item.icon}
                            </span>
                          </div>

                          {!sidebarCollapsed && <span className="truncate leading-none">{item.label}</span>}

                          {/* Active Dot for Collapsed Sidebar */}
                          {sidebarCollapsed && active && (
                            <span className="absolute left-1 w-1 h-3 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer User Info */}
              {!sidebarCollapsed && (
                <div className="p-3 border-t border-border/30 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                    <span className="truncate font-semibold">{memberSession?.displayName || "Member"}</span>
                  </div>
                  <span className="font-mono text-primary font-bold">macOS</span>
                </div>
              )}
            </motion.aside>

            {/* ── WORKSPACE CONTENT CANVAS ── */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide bg-white/30 dark:bg-black/10">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* ── 3. AUTHENTIC macOS FLOATING DOCK ─────────────────────────────── */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="flex items-center gap-2 px-3 py-2 bg-white/40 dark:bg-[#1a1b20]/65 backdrop-blur-3xl border border-white/30 dark:border-white/15 rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {DOCK_APPS.map((app, index) => {
            if (app.isDivider) {
              return <div key={index} className="w-[1px] h-8 bg-white/20 dark:bg-white/10 mx-1" />;
            }

            const active = isAppActive(app.id, app.path);
            return (
              <button
                key={app.id}
                onClick={() => navigate(app.path)}
                className="relative group flex flex-col items-center transition-all duration-200 ease-out hover:-translate-y-3 active:scale-95"
              >
                {/* Squircle Metallic App Badge */}
                <div
                  className={`w-11 h-11 rounded-[15px] bg-gradient-to-br ${app.bg} flex items-center justify-center shadow-lg border border-white/20 transition-transform duration-200 group-hover:scale-125 group-hover:shadow-2xl`}
                >
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {app.icon}
                  </span>
                </div>

                {/* macOS Tooltip */}
                <span className="absolute -top-10 px-2.5 py-1 bg-black/85 dark:bg-card/90 backdrop-blur-md text-white text-[11px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/15">
                  {app.name}
                </span>

                {/* macOS Active App Indicator Dot */}
                {active && (
                  <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-white dark:bg-primary shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
