import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/api/core/authSession";
import { useData } from "../context/DataContext";
import MobileDrawer from "./MobileDrawer";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import HugoLogo from "./HugoLogo";
import LiquidGlassCard from "./ui/LiquidGlassCard";

export default function Navbar() {
  const location = useLocation();
  const { data } = useData();
  const { t } = useTranslation();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const isAt = (path) => location.pathname === path;

  const navItems = [
    { to: "/introduction", label: t("navbar.home", "Giới thiệu") },
    { to: "/services", label: t("navbar.services", "Dịch vụ") },
    { to: "/faq", label: t("navbar.faq", "Hỏi đáp") },
    ...(allowBooking ? [{ to: "/booking", label: t("navbar.booking", "Đặt lịch") }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-3 sm:px-6 pointer-events-none transition-all">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        <LiquidGlassCard
          containerClassName="w-full"
          config={{
            cornerRadius: 36,
            zRadius: 28,
            refraction: 0.72,
            blurAmount: 0.22,
            edgeHighlight: 0.2,
            specular: 0.3,
            shadowOpacity: 0.25,
            shadowSpread: 14,
          }}
          className="w-full rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 border border-white/60 dark:border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
        >
          <div className="w-full flex items-center justify-between gap-3">
            {/* Brand */}
            <Link
              to="/introduction"
              viewTransition
              className="flex h-10 flex-shrink-0 items-center gap-2.5 text-sm font-extrabold tracking-[-0.02em] text-foreground transition-transform hover:scale-[1.03] active:scale-95 px-1"
              aria-label="Hugo Studio Home"
            >
              <HugoLogo className="h-7 w-7" />
            </Link>

            {/* Desktop Nav - Sliding Glass Indicator (Cảm hứng từ demo của thư viện @ybouane/liquidglass) */}
            <nav className="hidden lg:flex items-center justify-center p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08] relative">
              {navItems.map((item) => {
                const active = isAt(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    viewTransition
                    className={`relative z-10 inline-flex h-9 items-center px-4 rounded-full text-[13px] font-semibold transition-colors duration-200 select-none outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="navbar-tab-indicator"
                        className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/20 border border-white/80 dark:border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.08)] -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex h-10 flex-shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}
                className="hidden h-9 items-center gap-1.5 rounded-full border border-border/70 bg-white/40 dark:bg-white/5 px-3 text-[11px] font-bold text-foreground transition-all hover:bg-white/70 dark:hover:bg-white/10 active:scale-95 lg:inline-flex"
                aria-label={t("footer.supportServer", "Ủng hộ Hugo Studio")}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">volunteer_activism</span>
                {t("footer.supportServer", "Ủng hộ")}
              </button>

              <LanguageSelect compact className="hidden sm:inline-flex" />

              <Link
                to={accountPath}
                viewTransition
                className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground active:scale-95 sm:flex"
                aria-label={t("navbar.account", "Tài khoản")}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
              </Link>

              <Link
                to="/booking"
                viewTransition
                className="hidden h-9 items-center justify-center rounded-full bg-primary px-4 text-[11.5px] font-bold text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.3)] transition-all hover:opacity-95 hover:shadow-[0_6px_20px_hsl(var(--primary)/0.4)] active:scale-95 sm:inline-flex"
              >
                {t("navbar.booking", "Trao đổi")}
              </Link>

              <MobileDrawer />
            </div>
          </div>
        </LiquidGlassCard>
      </div>
    </header>
  );
}
