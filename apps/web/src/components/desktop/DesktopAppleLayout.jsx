import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewTransitionNavigate } from "../../utils/viewTransitions";
import { motion, AnimatePresence } from "framer-motion";
import { useJoyStore } from "../../stores/joyStore";
import { useTranslation } from "react-i18next";
import { joyNumber } from "../../lib/joyDisplay";
import HugoLogo from "../HugoLogo";

/**
 * Khung desktop/iPad: thanh bên phẳng + thanh tiêu đề. Làm lại 26/10/2026 —
 * bỏ những nút không làm gì (tìm kiếm ⌘K chỉ chạy ở tab Ứng dụng, nút cài đặt
 * trùng Tài khoản, ví/chuông/avatar lặp lại trên thanh tiêu đề).
 * Tài khoản nằm ở chân thanh bên, như macOS.
 */
const NAV_ITEMS = [
  { id: "today", labelKey: "memberPortal.navigation.today", icon: "today", path: "/member/today" },
  { id: "apps", labelKey: "memberPortal.navigation.apps", icon: "grid_view", path: "/member/apps" },
  { id: "wallet", labelKey: "memberPortal.navigation.wallet", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet" },
  { id: "activity", labelKey: "memberPortal.navigation.activity", icon: "notifications", path: "/member/activity" },
];

const WIDE = 248;
const RAIL = 76;
const SPRING = { type: "spring", stiffness: 420, damping: 38 };
const COMPACT = "(max-width: 1180px)";
const fade = { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -6 }, transition: { duration: 0.15 } };

function Avatar({ src, name, size = 36 }) {
  return src ? (
    <img src={src} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-muted text-[15px] font-semibold text-foreground" style={{ width: size, height: size }}>
      {name[0]?.toUpperCase()}
    </span>
  );
}

export default function DesktopAppleLayout({
  children,
  memberSession,
  bio,
  unreadCount = 0,
  activeTab,
  isGuestMode = false,
}) {
  const { t } = useTranslation();
  const navigate = useViewTransitionNavigate(useNavigate());
  const location = useLocation();
  const joyBalance = useJoyStore((s) => s.balance);
  const [compact, setCompact] = useState(() => window.matchMedia(COMPACT).matches);
  const [open, setOpen] = useState(() => !window.matchMedia(COMPACT).matches);

  // Màn hẹp (iPad, chia đôi màn hình): mặc định thu thành thanh icon; mở ra thì
  // thanh bên nổi đè lên nội dung thay vì bóp nội dung còn một khe hẹp.
  useEffect(() => {
    const query = window.matchMedia(COMPACT);
    const onChange = (event) => { setCompact(event.matches); setOpen(!event.matches); };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const avatarUrl = memberSession?.avatarUrl || bio?.avatarUrl;
  const displayName = memberSession?.displayName || bio?.displayName || t("memberPortal.navigation.memberFallback");
  const joy = joyBalance || bio?.joyBalance || 0;
  const walletActive = activeTab === "wallet" || location.pathname.includes("/utilities/joy_wallet");
  const current = walletActive ? "wallet" : activeTab;
  const overlay = compact && open;
  const go = (path) => {
    navigate(path);
    if (compact) setOpen(false);
  };

  const navButton = (item) => {
    const active = current === item.id;
    const label = t(item.labelKey);
    const badge = item.id === "activity" && unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;
    return (
      <li key={item.id}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => go(item.path)}
          title={open ? undefined : label}
          aria-label={open ? undefined : label}
          aria-current={active ? "page" : undefined}
          className={`group relative flex h-11 w-full items-center gap-3 rounded-xl px-[14px] text-[15px] font-medium transition-colors ${
            active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {active && <motion.span layoutId="desk-nav-pill" className="absolute inset-0 rounded-xl bg-primary/10" transition={SPRING} />}
          <span className="relative grid w-6 shrink-0 place-items-center">
            <span
              className="material-symbols-outlined text-[24px] transition-transform duration-200 group-hover:-translate-y-px"
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            {badge && !open && <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}
          </span>
          <AnimatePresence initial={false}>
            {open && (
              <motion.span {...fade} className="relative flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{label}</span>
                {badge && <span className="min-w-[22px] rounded-full bg-primary px-1.5 text-center text-[12px] font-semibold leading-[22px] text-primary-foreground">{badge}</span>}
                {item.id === "wallet" && !isGuestMode && <span className="text-[13px] tabular-nums text-muted-foreground">{joyNumber(joy)}</span>}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </li>
    );
  };

  const accountActive = current === "account";

  return (
    <div className="desktop-apple-layout flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-background font-sans text-foreground" data-portal-area={activeTab}>
      {/* Chỗ giữ chỗ: ở màn hẹp luôn rộng bằng thanh icon, thanh bên mở thì nổi lên trên. */}
      <motion.div initial={false} animate={{ width: compact || !open ? RAIL : WIDE }} transition={SPRING} className="relative z-40 h-full shrink-0">
        <motion.aside
          initial={false}
          animate={{ width: open ? WIDE : RAIL }}
          transition={SPRING}
          className={`absolute inset-y-0 left-0 flex select-none flex-col overflow-hidden border-r border-border bg-card ${overlay ? "shadow-2xl" : ""}`}
        >
          <div className="flex h-14 shrink-0 items-center px-[22px]">
            <button type="button" onClick={() => go("/member/today")} aria-label={t("memberPortal.navigation.today")} className="rounded-full transition-transform active:scale-95">
              <HugoLogo className="h-8 w-8" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 scrollbar-hide" aria-label={t("memberPortal.navigation.primaryNavigation")}>
            <ul className="space-y-1">{NAV_ITEMS.map(navButton)}</ul>
          </nav>

          <div className="shrink-0 border-t border-border p-3">
            {isGuestMode ? (
              <button
                type="button"
                onClick={() => go("/login")}
                aria-label={open ? undefined : t("navbar.login", "Đăng nhập")}
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-primary px-[14px] text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">login</span>
                {open && <span className="truncate">{t("navbar.login", "Đăng nhập")}</span>}
              </button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => go("/member/account")}
                title={open ? undefined : displayName}
                aria-current={accountActive ? "page" : undefined}
                className={`relative flex h-14 w-full items-center gap-3 rounded-xl px-[6px] text-left transition-colors ${accountActive ? "" : "hover:bg-muted"}`}
              >
                {accountActive && <motion.span layoutId="desk-nav-pill" className="absolute inset-0 rounded-xl bg-primary/10" transition={SPRING} />}
                <span className="relative"><Avatar src={avatarUrl} name={displayName} size={40} /></span>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.span {...fade} className="relative min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-foreground">{displayName}</span>
                      <span className={`block truncate text-[13px] ${accountActive ? "text-primary" : "text-muted-foreground"}`}>{t("memberPortal.navigation.account")}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </motion.aside>
      </motion.div>

      <AnimatePresence>
        {overlay && (
          <motion.button
            type="button"
            aria-label={t("memberPortal.navigation.toggleSidebar")}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex h-full min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={t("memberPortal.navigation.toggleSidebar")}
            aria-label={t("memberPortal.navigation.toggleSidebar")}
            aria-expanded={open}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">dock_to_right</span>
          </button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={current}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="truncate text-[17px] font-semibold tracking-tight text-foreground"
            >
              {t(`memberPortal.navigation.${current}`, "Hugo Studio")}
            </motion.h1>
          </AnimatePresence>
        </header>

        <main className="desktop-apple-content min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 scrollbar-hide lg:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
