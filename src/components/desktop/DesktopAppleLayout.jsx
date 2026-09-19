import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "../member/portal/NotificationBell";
import { useJoyStore } from "../../stores/joyStore";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

const NAV_ITEMS = [
  { id: "today", labelKey: "memberPortal.navigation.today", labelFallback: "Hôm nay", icon: "today", path: "/member/today" },
  { id: "apps", labelKey: "memberPortal.navigation.apps", labelFallback: "Ứng dụng", icon: "grid_view", path: "/member/apps" },
  { id: "wallet", labelKey: "memberPortal.navigation.wallet", labelFallback: "Ví JOY", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet" },
  { id: "activity", labelKey: "memberPortal.navigation.activity", labelFallback: "Hoạt động", icon: "notifications", path: "/member/activity" },
  { id: "account", labelKey: "memberPortal.navigation.account", labelFallback: "Tài khoản", icon: "person", path: "/member/account" },
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
  isGuestMode = false,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const joyBalance = useJoyStore((s) => s.balance);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1180px)").matches,
  );

  // iPad and desktop split-view need the compact rail automatically.
  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 1180px)");
    const handleCompactChange = (event) => setSidebarCollapsed(event.matches);
    compactQuery.addEventListener("change", handleCompactChange);
    return () => compactQuery.removeEventListener("change", handleCompactChange);
  }, []);

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

  const avatarUrl = memberSession?.avatarUrl || bio?.avatarUrl;
  const displayName = memberSession?.displayName || bio?.displayName || "Member";
  const effectiveJoy = joyBalance || bio?.joyBalance || 0;

  // Xác định mục active thông minh (hỗ trợ cả tab wallet trực tiếp)
  const isWalletActive = activeTab === "wallet" || location.pathname.includes("/utilities/joy_wallet");

  const navigationItems = NAV_ITEMS.map((item) => {
    if (item.id === "account" && isGuestMode) {
      return { ...item, labelKey: "navbar.login", labelFallback: "Đăng nhập", icon: "login", path: "/login" };
    }
    return item;
  });

  const pageTitle = isWalletActive
    ? "Ví JOY"
    : t(`memberPortal.navigation.${activeTab}`, "Hugo Studio");

  return (
    <div
      className="desktop-apple-layout h-[100dvh] min-h-[100dvh] w-full bg-background text-foreground font-sans flex overflow-hidden selection:bg-sky-500/20"
      data-portal-area={activeTab}
    >
      {/* ── SIDEBAR MACOS SEQUOIA / IPADOS ─────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 256 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="desktop-apple-sidebar shrink-0 h-full flex flex-col justify-between overflow-hidden border-r border-border/40 bg-card/60 backdrop-blur-3xl z-20 select-none"
      >
        {/* Header Thương hiệu Apple */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/20">
          <div
            onClick={() => navigate("/member/today")}
            className="flex items-center gap-2.5 cursor-pointer group py-1"
          >
            <div className="relative flex items-center justify-center">
              <HugoLogo className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-105" />
              <div className="absolute inset-0 rounded-full bg-sky-500/10 blur-sm -z-10 group-hover:bg-sky-500/25 transition-colors" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-1.5"
              >
                <span className="font-semibold text-xs tracking-wider uppercase text-foreground/90 font-mono">
                  MEMBERSHIP STUDIO
                </span>
              </motion.div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
              title="Thu gọn sidebar (⌘B)"
              aria-label="Thu gọn sidebar"
            >
              <span className="material-symbols-outlined text-[17px]">dock_to_left</span>
            </button>
          )}
        </div>

        {/* Nội dung danh mục và Widgets */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-hide space-y-4 flex flex-col">
          {/* Menu Điều Hướng Chính */}
          <nav
            className="space-y-1"
            aria-label={t("memberPortal.navigation.primaryNavigation", "Điều hướng chính")}
          >
            {navigationItems.map((item) => {
              const active = item.id === "wallet"
                ? isWalletActive
                : (activeTab === item.id && !isWalletActive);
              const label = t(item.labelKey, item.labelFallback);

              return (
                <div key={item.id}>
                  {item.id === "account" && <hr className="desktop-apple-nav-sep" />}
                  <button
                    onClick={() => navigate(item.path)}
                    title={sidebarCollapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`desktop-apple-nav-item ${active ? "is-active" : ""} ${
                      sidebarCollapsed ? "is-rail" : ""
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 rounded-[10px] bg-primary/15 dark:bg-sky-500/20 border border-primary/25 dark:border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.15)] -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}

                    <span
                      className="material-symbols-outlined desktop-apple-nav-icon"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>

                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{label}</span>
                    )}

                    {/* Biểu tượng phụ / Badge */}
                    {!sidebarCollapsed && (
                      <>
                        {item.id === "today" && (
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                        {item.id === "activity" && unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                        {item.id === "wallet" && (
                          <span className="text-[11px] font-mono font-bold text-amber-500/90 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            {effectiveJoy.toLocaleString()}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>


        </div>

        {/* Footer Hồ Sơ Người Dùng Chuẩn Apple */}
        <div className="p-2 border-t border-border/30 shrink-0 bg-background/30 backdrop-blur-md">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/member/account")}
                className="relative group p-0.5 rounded-full focus:outline-none"
                title={displayName}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-primary/30">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </button>

              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Mở rộng sidebar (⌘B)"
              >
                <span className="material-symbols-outlined text-[17px]">dock_to_right</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-muted/40 transition-colors">
              <div
                onClick={() => navigate("/member/account")}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-primary/30">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {isGuestMode ? "Khách vãng lai" : "Thành viên PAX"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={onOpenSpotlight}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors active:scale-95"
                  title="Tìm kiếm nhanh (⌘K)"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/member/account")}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors active:scale-95"
                  title="Cài đặt tài khoản"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT CONTAINER ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-background relative">
        {/* Top bar Apple Liquid Toolbar */}
        <header className="portal-liquid-toolbar h-14 shrink-0 sticky top-0 z-30 flex items-center gap-2 px-4 bg-background/70 backdrop-blur-2xl border-b border-border/30">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((p) => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors active:scale-95"
            title={t("memberPortal.navigation.toggleSidebar", "Ẩn/hiện Sidebar (⌘B)")}
          >
            <span className="material-symbols-outlined text-[19px]">
              {sidebarCollapsed ? "dock_to_right" : "dock_to_left"}
            </span>
          </button>

          <h1 className="text-sm font-semibold text-foreground tracking-tight truncate ml-1">
            {pageTitle}
          </h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Spotlight search button */}
            <button
              type="button"
              onClick={onOpenSpotlight}
              className="portal-liquid-control flex items-center gap-2 h-8 px-3 text-muted-foreground hover:text-foreground transition-colors active:scale-95 text-xs rounded-full border border-border/40 bg-muted/30"
              title={t("memberPortal.navigation.search", "Tìm kiếm (⌘K)")}
            >
              <span className="material-symbols-outlined text-base">search</span>
              <kbd className="hidden lg:inline text-[10px] font-mono opacity-60">⌘K</kbd>
            </button>

            {isGuestMode ? (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="h-8 rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 shadow-sm shadow-primary/30"
              >
                {t("navbar.login", "Đăng nhập")}
              </button>
            ) : (
              <>
                {/* JOY balance pill */}
                <button
                  type="button"
                  onClick={() => navigate("/member/utilities/joy_wallet")}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs border border-amber-500/20 transition-all hover:bg-amber-500/15 active:scale-95"
                  title="Ví JOY"
                >
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                  <span className="font-mono">{effectiveJoy.toLocaleString(i18n.resolvedLanguage)}</span>
                </button>

                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={onMarkRead}
                  onMarkAllRead={onMarkAllRead}
                  onDismiss={onDismiss}
                />

                <button
                  type="button"
                  onClick={() => navigate("/member/account")}
                  className="active:scale-95 transition-transform"
                  title={displayName}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-primary/30">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="desktop-apple-content flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 lg:p-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
