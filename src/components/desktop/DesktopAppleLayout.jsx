import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "../member/portal/NotificationBell";
import { useJoyStore } from "../../stores/joyStore";
import { useTranslation } from "react-i18next";

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
        animate={{ width: sidebarCollapsed ? 72 : 248 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className="desktop-apple-sidebar shrink-0 h-full flex flex-col overflow-hidden"
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>widgets</span>
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-foreground tracking-tight truncate">Hugo Studio</span>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-hide" aria-label={t("memberPortal.navigation.primaryNavigation")}>
          {navigationItems.map((item) => {
                const active = activeTab === item.id;
                const label = t(item.labelKey);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    title={sidebarCollapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    data-section={item.id}
                    className={`desktop-apple-nav-item w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium ${
                      active ? "is-active" : ""
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <span className="desktop-apple-nav-icon w-7 h-7 flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-[17px] ${active ? "text-primary" : "text-muted-foreground"}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                        {item.icon}
                      </span>
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  </button>
                );
          })}
        </nav>

        {/* Footer user chip */}
        <button
          onClick={() => navigate(isGuestMode ? "/login" : "/member/account")}
          className={`shrink-0 m-2 flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}
          title={t("memberPortal.navigation.account")}
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
              <p className="text-xs text-muted-foreground truncate">
                {isGuestMode
                  ? t("memberPortal.navigation.signInToSync")
                  : t("memberPortal.navigation.viewProfile")}
              </p>
            </div>
          )}
        </button>
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
                  onClick={() => navigate("/member/utilities/joy_wallet")}
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
