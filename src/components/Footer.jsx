import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { playPopSound } from "../utils/audio";
import logos from "./logos";
import TrustpilotReviewWidget from "./TrustpilotReviewWidget";

export default function Footer() {
  const { data } = useData();

  const brandLetters = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0EA5E9" }
  ];

  return (
    <footer className="relative mt-20 border-t border-slate-200/60 bg-white/40 dark:border-slate-800/50 dark:bg-slate-950/40 backdrop-blur-xl py-12 md:py-16 text-slate-650 dark:text-slate-400">
      {/* Background soft glow accents */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Section: Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-200/50 dark:border-slate-800/40">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4 text-left">
            <Link
              to="/introduction"
              onClick={playPopSound}
              className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-85"
            >
              <span className="font-display text-[20px] font-black tracking-tight sm:text-[22px]">
                {brandLetters.map(({ char, color }) => (
                  <span key={`${char}-${color}`} style={{ color }}>
                    {char}
                  </span>
                ))}
              </span>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-xs">
              Kiến tạo trải nghiệm số kẹo ngọt và chuyên nghiệp Chuyên cung cấp Bio Link và giải pháp thiết kế website tối ưu hiệu năng
            </p>
            {/* Quick Contact Info */}
            <div className="space-y-2 pt-2 text-xs">
              <a 
                href={`mailto:${data.profile.emailAddress || "hugowishpax@gmail.com"}`}
                className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">mail</span>
                <span>{data.profile.emailAddress || "hugowishpax@gmail.com"}</span>
              </a>
              <a 
                href={`https://zalo.me/${data.profile.zaloNumber || "0839909399"}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Liên hệ Zalo</span>
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="text-left">
            <div className="mb-4 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-550">
              Dịch vụ nổi bật
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/services" className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">
                  Thiết kế Landing Page
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">
                  Website Portfolio Cá Nhân
                </Link>
              </li>
              <li>
                <Link to="/introduction" className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">
                  Bio Link Sinh Viên (edu)
                </Link>
              </li>
              <li>
                <Link to="/booking" className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">
                  Thiết kế UI/UX theo yêu cầu
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div className="text-left">
            <div className="mb-4 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-550">
              Đường dẫn tắt
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/" onClick={playPopSound} className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">Trang Chủ</Link>
              </li>
              <li>
                <Link to="/introduction" onClick={playPopSound} className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">Giới Thiệu</Link>
              </li>
              <li>
                <Link to="/services" onClick={playPopSound} className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">Bảng Giá Dịch Vụ</Link>
              </li>
              <li>
                <Link to="/booking" onClick={playPopSound} className="hover:text-slate-900 dark:hover:text-white hover:translate-x-1 inline-block transition-all">Đăng Ký Đặt Lịch</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Socials & Connect */}
          <div className="text-left space-y-4">
            <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-550">
              Kết nối với chúng tôi
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theo dõi và cập nhật các dự án thiết kế mới nhất của Hugo Studio.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {/* GitHub SVG */}
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5 flex items-center justify-center transition-all hover:scale-105"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Zalo Chat Icon */}
              <a 
                href={`https://zalo.me/${data.profile.zaloNumber || "0839909399"}`}
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5 flex items-center justify-center transition-all hover:scale-105"
                title="Zalo Chat"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-700 dark:text-slate-300">chat_bubble</span>
              </a>
              {/* Facebook SVG */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5 flex items-center justify-center transition-all hover:scale-105"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Trustpilot Stars Widget */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-8 pb-2">
          <TrustpilotReviewWidget />
        </div>

        {/* Certifications Section: render all logo components from src/components/logos */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 pb-6 px-1 sm:px-4">
          {logos.map((Logo, idx) => (
            <React.Fragment key={idx}>
              {Logo ? <Logo /> : null}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom Section: Copyright & System Status */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="text-center md:text-left space-y-1">
            <p className="font-medium text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} <span className="font-semibold text-slate-700 dark:text-slate-300">{data.profile.fullName || "Peter Hugo Wishpax Le"}</span>. Tất cả các quyền được bảo lưu.
            </p>
            <p className="text-[10px] text-slate-400/60 dark:text-slate-500/60">
              Designed with by <span className="font-semibold">Hugo Studio</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-5 sm:gap-6">
            <Link 
              to="/privacy-policy" 
              className="hover:text-slate-700 dark:hover:text-slate-350 hover:underline underline-offset-4 transition-colors font-medium"
            >
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
