import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";
import { useData } from "../context/DataContext";
import MobileDrawer from "./MobileDrawer";
import { useTranslation } from "react-i18next";
import { useUIStore } from "../stores/uiStore";

function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) { /* silent */ }
}

function NavLink({ to, active, onClick, children }) {
  const className = `relative inline-flex h-8 items-center text-[12px] font-medium leading-none tracking-wide transition-colors duration-200 select-none ${
    active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
  }`;
  const content = (
    <>
      {children}
      {active && <span className="absolute -bottom-[14px] left-0 right-0 h-0.5 rounded-full bg-primary" />}
    </>
  );
  return <Link to={to} onClick={onClick} className={className}>{content}</Link>;
}

export default function Navbar() {
  const location = useLocation();
  const { data } = useData();
  const { t, i18n } = useTranslation();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const isLoggedIn = isMemberAuthenticated() || isAdminAuthenticated();
  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("vi") ? "en" : "vi";
    i18n.changeLanguage(newLang);
    playPop();
  };

  const isAt = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center border-b border-white/10 dark:border-white/5 bg-background/50 px-3 backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 sm:px-4 md:px-6 shadow-[0_1px_0_rgba(255,255,255,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-2 sm:gap-4">

        {/* Brand */}
        <Link
          to="/introduction"
          onClick={playPop}
          className="font-display flex h-8 items-center text-xs font-black leading-none tracking-wider transition-opacity hover:opacity-80 sm:text-sm md:text-base lg:text-lg flex-shrink-0 select-none"
          aria-label="Hugo Studio Home"
        >
          <span className="text-destructive">H</span>
          <span className="text-warning">u</span>
          <span className="text-warning">g</span>
          <span className="text-success">o</span>
          <span className="w-1" />
          <span className="text-info">S</span>
          <span className="text-primary">t</span>
          <span className="text-accent">u</span>
          <span className="text-accent">d</span>
          <span className="text-destructive">i</span>
          <span className="text-info">o</span>
        </Link>

        {/* Desktop nav */}
        <nav className="flex-1 hidden h-8 items-center justify-center gap-8 lg:flex xl:gap-10 border-b border-transparent">
          <NavLink to="/introduction" active={isAt("/introduction")} onClick={playPop}>
            {t("navbar.home", "Giới thiệu")}
          </NavLink>
          <NavLink to="/services" active={isAt("/services")} onClick={playPop}>
            {t("navbar.services", "Dịch vụ")}
          </NavLink>
          <NavLink to="/templates" active={isAt("/templates")} onClick={playPop}>
            {t("navbar.templates", "Tác Phẩm")}
          </NavLink>
          <NavLink to="/faq" active={isAt("/faq")} onClick={playPop}>
            {t("navbar.faq", "Hỏi đáp")}
          </NavLink>
          {allowBooking && (
            <NavLink to="/booking" active={isAt("/booking")} onClick={playPop}>
              {t("navbar.booking", "Đặt lịch")}
            </NavLink>
          )}
          <NavLink to={accountPath} active={isAt(accountPath)} onClick={playPop}>
            <span className="material-symbols-outlined text-[15px] mr-1">account_circle</span>
            {t("navbar.account", "Tài khoản")}
          </NavLink>
        </nav>

        {/* Right controls */}
        <div className="flex h-8 items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="hidden sm:flex h-7 w-10 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-bold text-muted-foreground transition-colors"
            aria-label="Toggle language"
          >
            {i18n.language.startsWith("en") ? "EN" : "VI"}
          </button>


          {/* CTA */}
          <Link
            to="/services"
            onClick={playPop}
            className="hidden sm:inline-flex h-8 items-center justify-center rounded-full bg-primary px-4 text-[11px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95 clay-btn-primary"
          >
            {t("navbar.pricing", "Báo Giá")}
          </Link>

          {/* Mobile menu */}
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
