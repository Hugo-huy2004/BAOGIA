import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isMemberAuthenticated, isAdminAuthenticated } from "../services/authSession";
import { useData } from "../context/DataContext";
import MobileDrawer from "./MobileDrawer";

export default function Navbar() {
  const location = useLocation();
  const { data } = useData();
  const allowBooking = data?.systemSettings?.allowBooking !== false;

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio pop effect failed:", e);
    }
  };

  const isLoggedIn = isMemberAuthenticated() || isAdminAuthenticated();
  const accountPath = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const accountLabel = isLoggedIn ? "Tài khoản" : "Đăng nhập";

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center border-b border-[#eaeaea] bg-[#f5f5f7]/80 px-3 backdrop-blur-md transition-colors duration-300 dark:border-[#2a2a2d] dark:bg-[#161617]/80 sm:px-4 md:px-6">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo - Hugo Studio (letter-by-letter colored) */}
        <Link 
          to="/introduction"
          onClick={playPopSound}
          className="font-display flex h-8 items-center text-xs font-black leading-none tracking-wider transition-opacity duration-200 hover:opacity-85 sm:text-sm md:text-base lg:text-lg flex-shrink-0"
        >
          <span className="text-[#ef4444] dark:text-[#f87171]">H</span>
          <span className="text-[#f97316] dark:text-[#fb923c]">u</span>
          <span className="text-[#f59e0b] dark:text-[#fbbf24]">g</span>
          <span className="text-[#10b981] dark:text-[#34d399]">o</span>
          <span className="w-1"></span>
          <span className="text-[#3b82f6] dark:text-[#60a5fa]">S</span>
          <span className="text-[#6366f1] dark:text-[#818cf8]">t</span>
          <span className="text-[#a855f7] dark:text-[#c084fc]">u</span>
          <span className="text-[#ec4899] dark:text-[#f472b6]">d</span>
          <span className="text-[#f43f5e] dark:text-[#fb7185]">i</span>
          <span className="text-[#06b6d4] dark:text-[#22d3ee]">o</span>
        </Link>
        
        {/* Apple Style Flat Typography Navigation Tabs */}
        <nav className="flex-1 hidden h-8 items-center justify-center gap-10 lg:flex xl:gap-12">
          <Link 
            to="/introduction" 
            onClick={playPopSound} 
            className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
              location.pathname === "/introduction"
                ? "text-slate-900 dark:text-white font-medium"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Giới thiệu
          </Link>

          <Link 
            to="/services" 
            onClick={playPopSound} 
            className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
              location.pathname === "/services"
                ? "text-slate-900 dark:text-white font-medium"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Dịch vụ
          </Link>

          <Link 
            to="/templates" 
            onClick={playPopSound} 
            className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
              location.pathname === "/templates"
                ? "text-slate-900 dark:text-white font-medium"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Mẫu website
          </Link>

          <Link 
            to="/faq" 
            onClick={playPopSound} 
            className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
              location.pathname === "/faq"
                ? "text-slate-900 dark:text-white font-medium"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Hỏi đáp
          </Link>

          {allowBooking && (
            <Link 
              to="/booking" 
              onClick={playPopSound} 
              className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
                location.pathname === "/booking"
                  ? "text-slate-900 dark:text-white font-medium"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Đặt lịch
            </Link>
          )}

          <Link 
            to={accountPath} 
            onClick={playPopSound} 
            className={`inline-flex h-8 items-center text-[12px] font-normal leading-none tracking-wide transition-colors duration-200 select-none ${
              location.pathname === "/login" || location.pathname === "/member" || location.pathname === "/admin"
                ? "text-slate-900 dark:text-white font-medium"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {accountLabel}
          </Link>
        </nav>

        {/* Right Side Controls */}
        <div className="flex h-8 items-center gap-1 sm:gap-2 md:gap-4 ml-auto flex-shrink-0">
          <Link 
            to="/services"
            onClick={playPopSound} 
            className="hidden sm:inline-flex h-8 min-w-[76px] items-center justify-center rounded-full bg-[#0071e3] hover:bg-[#0077ed] px-3 md:px-4 text-[11px] md:text-[12px] font-semibold leading-none text-white shadow-sm transition-all duration-200 active:scale-95"
          >
            Báo Giá
          </Link>

          {/* Mobile Menu Drawer */}
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
