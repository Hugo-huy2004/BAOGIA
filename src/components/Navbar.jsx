import { Link, useLocation } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";
import { useTranslation } from "react-i18next";
import HugoLogo from "./HugoLogo";
import NavDock from "./NavDock";

// Thanh kiểu Apple Store (25/10/2026): một dải phẳng trải hết bề ngang, không
// thẻ nổi, không viên thuốc trượt — chữ nhỏ chia đều, mục đang mở chỉ đậm màu hơn.
const itemClass = "relative inline-flex h-11 items-center px-1 text-[12.5px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md";

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  const isAt = (path) => location.pathname === path;

  const navItems = [
    { to: "/", label: t("navbar.services", "Dịch vụ") },
    { to: "/student-pricing", label: "Hugo Edu+" },
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
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2">
          <NavDock className="hidden sm:flex" />
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
