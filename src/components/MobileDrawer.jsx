import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";
import { useData } from "../context/DataContext";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const { t } = useTranslation();

  const isLoggedIn = isMemberAuthenticated() || isAdminAuthenticated();
  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const accountLabel = isLoggedIn ? t("navbar.account", "Tài Khoản") : t("navbar.login", "Đăng Nhập");
  const accountIcon = isLoggedIn ? "account_circle" : "login";

  const { data } = useData();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const mainMenuItems = [
    { label: t("navbar.home", "Giới Thiệu"), path: "/introduction" },
    { label: t("navbar.services", "Dịch Vụ"), path: "/services" },
    { label: t("navbar.faq", "Hỏi Đáp"), path: "/faq" },
    ...(allowBooking ? [{ label: t("navbar.booking", "Đặt Lịch & Liên Hệ"), path: "/booking" }] : [])
  ];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-foreground transition-transform active:scale-95 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t("navbar.closeMenu") : t("navbar.openMenu")}
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-[19px] leading-none">{isOpen ? "close" : "menu"}</span>
      </button>

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[200] bg-black/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("navbar.mainMenu", "Menu chính")}
        aria-hidden={!isOpen}
        className={`fixed inset-x-2 bottom-2 z-[210] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-[2rem] border border-white/50 bg-background/90 px-3 pb-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-3xl backdrop-saturate-150 transition-all duration-300 dark:border-white/10 lg:hidden ${
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[110%] opacity-0"
        }`}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center py-2" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div>
            <h2 className="text-base font-extrabold tracking-[-0.02em] text-foreground">Hugo Studio</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t("navbar.hello", "Xin chào")}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground"
            aria-label={t("navbar.closeMenu")}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <nav className="space-y-1 rounded-[1.4rem] bg-muted/55 p-1.5">
          {mainMenuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex min-h-11 items-center justify-between rounded-[1rem] px-4 py-3 text-sm font-semibold transition-colors ${
                location.pathname === item.path
                  ? "bg-card text-primary shadow-sm"
                  : "text-foreground hover:bg-card/70"
              }`}
            >
              <span>{item.label}</span>
              <span className="material-symbols-outlined text-[17px] text-muted-foreground">chevron_right</span>
            </Link>
          ))}
        </nav>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <LanguageSelect className="w-full" />

          <Link
            to={accountPath}
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-[1rem] bg-primary px-3 text-xs font-semibold text-white shadow-[0_8px_20px_hsl(var(--primary)/0.2)]"
          >
            <span className="material-symbols-outlined text-base">{accountIcon}</span>
            {accountLabel}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent("open-donation"));
          }}
          className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-[1rem] border border-primary/25 bg-primary/10 px-4 text-xs font-bold text-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">volunteer_activism</span>
          {t("footer.supportServer", "Ủng hộ Hugo Studio")}
        </button>
      </aside>
    </>
  );
}
