import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "../member/portal/NotificationBell";
import { useJoyStore } from "../../stores/joyStore";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

const NAV_ITEMS = [
  { id: "today", labelKey: "memberPortal.navigation.today", icon: "today", path: "/member/today" },
  { id: "apps", labelKey: "memberPortal.navigation.apps", icon: "apps", path: "/member/apps" },
  { id: "activity", labelKey: "memberPortal.navigation.activity", icon: "notifications", path: "/member/activity" },
  { id: "account", labelKey: "memberPortal.navigation.account", icon: "person", path: "/member/account" },
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
  const joyBalance = useJoyStore((s) => s.balance);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1180px)").matches,
  );

  // iPad and desktop split-view need the compact rail automatically. The
  // component is not remounted when a device rotates, so keep this in sync
  // with the live viewport instead of reading width only once.
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

  const pageTitle = t(`memberPortal.navigation.${activeTab}`, "Hugo Studio");
  const avatarUrl = memberSession?.avatarUrl || bio?.avatarUrl;
  const displayName = memberSession?.displayName || bio?.displayName || "Member";
  const navigationItems = NAV_ITEMS.map((item) => (
    item.id === "account" && isGuestMode
      ? { ...item, labelKey: "navbar.login", icon: "login", path: "/login" }
      : item
  ));

  return (
    <div
      className="desktop-apple-layout h-[100dvh] min-h-[100dvh] w-full bg-background text-foreground font-sans flex overflow-hidden"
      data-portal-area={activeTab}
    >
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className="desktop-apple-sidebar shrink-0 h-full flex flex-col overflow-hidden"
      >
        {/* Thanh tiêu đề sidebar — cao đúng bằng thanh công cụ bên phải để
            hai đường kẻ ngang gặp nhau, đúng kiểu cửa sổ macOS. */}
        <div className="h-14 shrink-0 flex items-center px-3.5">
          <HugoLogo className="h-7 w-7 shrink-0" />
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide"
          aria-label={t("memberPortal.navigation.primaryNavigation")}
        >
          {navigationItems.map((item) => {
            const active = activeTab === item.id;
            const label = t(item.labelKey);
            return (
              <div key={item.id}>
                {/* Tài khoản là "bạn", không phải một mục của app: macOS tách
                    nhóm bằng một đường kẻ mảnh chứ không bằng tiêu đề nhóm. */}
                {item.id === "account" && <hr className="desktop-apple-nav-sep" />}
                <button
                  onClick={() => navigate(item.path)}
                  title={sidebarCollapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`desktop-apple-nav-item ${active ? "is-active" : ""} ${
                    sidebarCollapsed ? "is-rail" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined desktop-apple-nav-icon"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </button>
              </div>
            );
          })}
        </nav>
      </motion.aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Top bar */}
        <header className="portal-liquid-toolbar h-14 shrink-0 sticky top-0 z-30 flex items-center gap-2 px-4">
          <button
            onClick={() => setSidebarCollapsed((p) => !p)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            title={t("memberPortal.navigation.toggleSidebar")}
          >
            <span className="material-symbols-outlined text-xl">dock_to_right</span>
          </button>

          <h1 className="text-base font-semibold text-foreground tracking-tight truncate">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Spotlight search */}
            <button
              onClick={onOpenSpotlight}
              className="portal-liquid-control flex items-center gap-2 h-9 px-3 text-muted-foreground transition-colors active:scale-95"
              title={t("memberPortal.navigation.search")}
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <kbd className="hidden lg:inline text-[11px] font-mono">⌘K</kbd>
            </button>

            {isGuestMode ? (
              <button
                onClick={() => navigate("/login")}
                className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
              >
                {t("navbar.login")}
              </button>
            ) : (
              <>
                {/* JOY balance */}
                <button
                  onClick={() => navigate("/member/account")}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-sm transition-colors hover:bg-amber-500/20 active:scale-95"
                  title={t("memberPortal.navigation.joyBalance")}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                  <span>{(joyBalance || bio?.joyBalance || 0).toLocaleString(i18n.resolvedLanguage)}</span>
                </button>

                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={onMarkRead}
                  onMarkAllRead={onMarkAllRead}
                  onDismiss={onDismiss}
                />

                <button
                  onClick={() => navigate("/member/account")}
                  className="active:scale-95 transition-transform"
                  title={t("memberPortal.navigation.account")}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="desktop-apple-content flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 lg:p-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
