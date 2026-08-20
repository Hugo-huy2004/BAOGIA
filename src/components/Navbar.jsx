import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";
import { useData } from "../context/DataContext";
import MobileDrawer from "./MobileDrawer";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";

function NavLink({ to, active, children }) {
  const className = `inline-flex h-11 items-center rounded-full px-3.5 text-[12px] font-semibold leading-none transition-all duration-200 select-none ${
    active
      ? "bg-card text-foreground shadow-[0_1px_5px_hsl(var(--shadow)/0.09),inset_0_1px_0_rgba(255,255,255,0.7)]"
      : "text-muted-foreground hover:text-foreground"
  }`;
  return <Link to={to} className={className}>{children}</Link>;
}

export default function Navbar() {
  const location = useLocation();
  const { data } = useData();
  const { t } = useTranslation();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");

  const isAt = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center border-b border-border/50 bg-background/95 px-3 sm:px-4 md:px-6">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-3">

        {/* Brand */}
        <Link
          to="/introduction"
          className="flex h-11 flex-shrink-0 items-center gap-2 text-sm font-extrabold leading-none tracking-[-0.02em] text-foreground transition-opacity hover:opacity-75 sm:text-base"
          aria-label="Hugo Studio Home"
        >
          <span>Hugo Studio</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-center gap-0.5 rounded-full border border-border/45 bg-muted/55 p-1 lg:flex">
          <NavLink to="/introduction" active={isAt("/introduction")}>
            {t("navbar.home", "Giới thiệu")}
          </NavLink>
          <NavLink to="/services" active={isAt("/services")}>
            {t("navbar.services", "Dịch vụ")}
          </NavLink>
          <NavLink to="/faq" active={isAt("/faq")}>
            {t("navbar.faq", "Hỏi đáp")}
          </NavLink>
          {allowBooking && (
            <NavLink to="/booking" active={isAt("/booking")}>
              {t("navbar.booking", "Đặt lịch")}
            </NavLink>
          )}
        </nav>

        {/* Right controls */}
        <div className="ml-auto flex h-11 flex-shrink-0 items-center gap-1.5 sm:gap-2">

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}
            className="hidden h-11 items-center gap-1.5 rounded-full border border-border/70 px-3 text-[11px] font-bold text-foreground transition-colors hover:bg-muted lg:inline-flex"
            aria-label={t("footer.supportServer", "Ủng hộ Hugo Studio")}
          >
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">volunteer_activism</span>
            {t("footer.supportServer", "Ủng hộ")}
          </button>

          <LanguageSelect compact className="hidden sm:inline-flex" />


          <Link
            to={accountPath}
            className="hidden h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            aria-label={t("navbar.account", "Tài khoản")}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </Link>

          {/* Một CTA duy nhất, đi thẳng tới cuộc trao đổi. */}
          <Link
            to="/booking"
            className="hidden h-11 items-center justify-center rounded-full bg-primary px-4 text-[11px] font-bold text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/0.2)] transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98] sm:inline-flex"
          >
            {t("navbar.booking", "Trao đổi")}
          </Link>

          {/* Mobile menu */}
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
