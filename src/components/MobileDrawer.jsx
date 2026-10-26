import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { getMemberSession } from "../services/api/core/authSession";
import { useTranslation } from "react-i18next";
import { AccountOrb, LanguageSwitch, SupportHeart } from "./NavDock";

export default function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const drawerRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const location = useLocation();

  const { t } = useTranslation();

  const session = getMemberSession();

  const mainMenuItems = [
    { label: t("navbar.services", "Dịch Vụ"), path: "/" },
    { label: "Hugo Edu+", path: "/student-pricing" },
    { label: t("navbar.faq", "Hỏi Đáp"), path: "/faq" },
  ];

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusRef.current = document.activeElement;
    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusFirstControl = window.requestAnimationFrame(() => {
      drawerRef.current?.querySelector(focusableSelector)?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const controls = [...drawerRef.current.querySelectorAll(focusableSelector)]
        .filter((element) => !element.hasAttribute("disabled"));
      if (controls.length === 0) {
        event.preventDefault();
        return;
      }

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirstControl);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const focusTarget = restoreFocusRef.current;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus();
      } else {
        triggerElement?.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60 text-foreground transition-transform active:scale-95 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t("navbar.closeMenu") : t("navbar.openMenu")}
        aria-expanded={isOpen}
        aria-controls="mobile-main-menu"
      >
        <span className="material-symbols-outlined text-[19px] leading-none">{isOpen ? "close" : "menu"}</span>
      </button>

      {createPortal(
        <>
          {isOpen && (
            <div
              aria-hidden="true"
              className="fixed inset-0 z-[200] bg-black/25 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}

          <aside
            ref={drawerRef}
            id="mobile-main-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("navbar.mainMenu", "Menu chính")}
            aria-hidden={!isOpen}
            inert={isOpen ? undefined : ""}
            className={`fixed inset-x-2 bottom-2 z-[210] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-[2rem] border border-white/50 bg-background/90 px-3 pb-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-3xl backdrop-saturate-150 transition-all duration-300 dark:border-white/10 lg:hidden ${
              isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[110%] opacity-0"
            }`}
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="flex justify-center py-2" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Đầu: vòng tài khoản + lời chào; bấm vòng là vào tài khoản / đăng nhập. */}
            <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
              <div className="flex min-w-0 items-center gap-3">
                <AccountOrb size="h-11 w-11" onClick={() => setIsOpen(false)} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("navbar.hello", "Xin chào")}</p>
                  {session ? (
                    <p className="truncate text-[15px] font-bold text-foreground">{session.displayName}</p>
                  ) : (
                    <Link to="/login" viewTransition onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-[15px] font-bold text-primary">
                      {t("navbar.login", "Đăng nhập")}
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
                aria-label={t("navbar.closeMenu")}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Danh mục kiểu biên tập: số thứ tự đánh máy, chữ lớn, mục đang mở tô màu. */}
            <nav className="px-2">
              {mainMenuItems.map((item, idx) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    viewTransition
                    onClick={() => setIsOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="group flex min-h-14 items-baseline gap-4 border-b border-border/60 py-3 last:border-b-0"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                    <span className={`flex-1 text-[1.65rem] font-extrabold leading-tight tracking-[-0.03em] transition-transform group-active:translate-x-1 ${
                      active ? "bg-[linear-gradient(90deg,#0ea5e9,#6366f1,#ec4899)] bg-clip-text text-transparent" : "text-foreground"
                    }`}>
                      {item.label}
                    </span>
                    <span className="material-symbols-outlined self-center text-[20px] text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true">arrow_forward</span>
                  </Link>
                );
              })}
            </nav>

            {/* Chân: công tắc ngôn ngữ một chạm + nút tim ủng hộ trong cùng một viên. */}
            <div className="mt-3 flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 p-1">
              <LanguageSwitch className="h-11 flex-1" />
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
              <SupportHeart className="h-11 w-11" onDone={() => setIsOpen(false)} />
            </div>
          </aside>
        </>,
        document.body,
      )}
    </>
  );
}
