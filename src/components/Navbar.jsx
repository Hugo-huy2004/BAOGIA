import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/api/core/authSession";
import MobileDrawer from "./MobileDrawer";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import HugoLogo from "./HugoLogo";

// Thanh kiểu Apple Store (25/10/2026): một dải phẳng trải hết bề ngang, không
// thẻ nổi, không viên thuốc trượt — chữ nhỏ chia đều, mục đang mở chỉ đậm màu hơn.
const itemClass = "relative inline-flex h-11 items-center px-1 text-[12.5px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md";

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const isAt = (path) => location.pathname === path;

  const navItems = [
    { to: "/", label: t("navbar.services", "Dịch vụ") },
    { to: "/faq", label: t("navbar.faq", "Hỏi đáp") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          viewTransition
          className="inline-flex h-11 flex-shrink-0 items-center text-foreground transition-opacity hover:opacity-70"
          aria-label="Hugo Studio Home"
        >
          <HugoLogo className="h-5 w-5" />
        </Link>

        <nav className="hidden flex-1 items-center justify-evenly lg:flex" aria-label={t("navbar.main", "Điều hướng chính")}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              viewTransition
              aria-current={isAt(item.to) ? "page" : undefined}
              className={`${itemClass} ${isAt(item.to) ? "text-foreground" : "text-foreground/65 hover:text-foreground"}`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}
            className={`${itemClass} text-foreground/65 hover:text-foreground`}
          >
            {t("footer.supportServer", "Ủng hộ")}
          </button>
        </nav>

        <div className="flex flex-shrink-0 items-center gap-1">
          <LanguageSelect compact className="hidden sm:inline-flex" />
          <Link
            to={accountPath}
            viewTransition
            className="hidden h-11 w-11 items-center justify-center text-foreground/65 transition-colors hover:text-foreground sm:flex"
            aria-label={t("navbar.account", "Tài khoản")}
          >
            <span className="material-symbols-outlined text-[19px]" aria-hidden="true">person</span>
          </Link>
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
