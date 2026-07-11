import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { playPopSound } from "../utils/audio";
import logos from "./logos";
import TrustpilotReviewWidget from "./TrustpilotReviewWidget";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { data } = useData();
  const { t } = useTranslation();

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
    <footer className="relative mt-16 border-t border-border/50 bg-background/60 py-8 text-muted-foreground backdrop-blur-xl md:mt-20 md:py-16">
      {/* Background soft glow accents */}
      <div className="absolute top-0 left-1/4 h-72 w-72 -translate-y-1/2 rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 h-72 w-72 -translate-y-1/2 rounded-full bg-[#06b6d4]/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Section: Main Footer Grid */}
        <div className="grid grid-cols-2 gap-6 border-b border-border/50 pb-8 md:grid-cols-2 md:gap-10 md:pb-12 lg:grid-cols-4">
          
          {/* Column 1: Brand & Bio — full width on mobile */}
          <div className="col-span-2 lg:col-span-1 space-y-3 text-left">
            <Link
              to="/introduction"
              onClick={playPopSound}
              className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-85"
            >
              <span className="font-display text-[18px] md:text-[20px] font-black tracking-tight">
                {brandLetters.map(({ char, color }) => (
                  <span key={`${char}-${color}`} style={{ color }}>
                    {char}
                  </span>
                ))}
              </span>
            </Link>
            {/* Tagline — hidden on small mobile to save space */}
            <p className="hidden sm:block text-xs leading-relaxed text-muted-foreground max-w-xs">
              {t("footer.tagline", "Kiến tạo trải nghiệm số kẹo ngọt và chuyên nghiệp. Chuyên cung cấp Bio Link và giải pháp thiết kế website tối ưu hiệu năng.")}
            </p>
            {/* Contact row — compact on mobile */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <a 
                href={`mailto:${data.profile.emailAddress || "hugowishpax@gmail.com"}`}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[13px]">mail</span>
                <span className="hidden sm:inline">{data.profile.emailAddress || "hugowishpax@gmail.com"}</span>
                <span className="sm:hidden">Email</span>
              </a>
              <a 
                href={`https://zalo.me/${data.profile.zaloNumber || "0839909399"}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[13px]">chat</span>
                <span>Zalo</span>
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="text-left">
            <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.services", "Dịch vụ")}
            </div>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/services" className="inline-block transition-all hover:translate-x-1 hover:text-foreground">
                  {t("footer.landingPage", "Landing Page")}
                </Link>
              </li>
              <li>
                <Link to="/services" className="inline-block transition-all hover:translate-x-1 hover:text-foreground">
                  {t("footer.portfolio", "Portfolio Cá Nhân")}
                </Link>
              </li>
              <li>
                <Link to="/introduction" className="inline-block transition-all hover:translate-x-1 hover:text-foreground">
                  {t("footer.bioLink", "Bio Link (edu)")}
                </Link>
              </li>
              <li>
                <Link to="/booking" className="inline-block transition-all hover:translate-x-1 hover:text-foreground">
                  {t("footer.customUIUX", "UI/UX Theo Yêu Cầu")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div className="text-left">
            <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.links", "Đường dẫn")}
            </div>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/" onClick={playPopSound} className="inline-block transition-all hover:translate-x-1 hover:text-foreground">{t("footer.home", "Trang Chủ")}</Link>
              </li>
              <li>
                <Link to="/introduction" onClick={playPopSound} className="inline-block transition-all hover:translate-x-1 hover:text-foreground">{t("footer.introduction", "Giới Thiệu")}</Link>
              </li>
              <li>
                <Link to="/services" onClick={playPopSound} className="inline-block transition-all hover:translate-x-1 hover:text-foreground">{t("footer.pricing", "Bảng Giá")}</Link>
              </li>
              <li>
                <Link to="/booking" onClick={playPopSound} className="inline-block transition-all hover:translate-x-1 hover:text-foreground">{t("footer.booking", "Đặt Lịch")}</Link>
              </li>
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-donation'))} 
                  className="hover:text-primary dark:hover:text-primary hover:translate-x-1 inline-block transition-all flex items-center gap-1.5 font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">local_cafe</span> 
                  <span>{t("footer.supportServer", "Ủng Hộ Server")}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Socials — hidden on small mobile, shown md+ OR as last item */}
          <div className="col-span-2 lg:col-span-1 text-left space-y-3">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.connect", "Kết nối")}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* GitHub */}
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/80 transition-all hover:scale-105 hover:bg-muted/80"
                title="GitHub"
              >
                <svg className="h-4 w-4 fill-current text-foreground" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Zalo */}
              <a 
                href={`https://zalo.me/${data.profile.zaloNumber || "0839909399"}`}
                target="_blank" 
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/80 transition-all hover:scale-105 hover:bg-muted/80"
                title="Zalo Chat"
              >
                <span className="material-symbols-outlined text-[18px] text-foreground">chat_bubble</span>
              </a>
              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/80 transition-all hover:scale-105 hover:bg-muted/80"
                title="Facebook"
              >
                <svg className="h-4 w-4 fill-current text-foreground" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            {/* Partner Logo */}
            <div>
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{t("footer.partner", "Đối tác")}</div>
              <a
                href="https://hwagfu.dev"
                target="_blank"
                rel="noopener noreferrer"
                title="hwagfu.dev"
                className="inline-block"
              >
                <img
                  src="https://res.cloudinary.com/dyehwoscu/image/upload/v1779514310/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-23_lu%CC%81c_12.31.33-removebg-preview_ww2qxy.png"
                  alt="Partner Logo"
                  className="h-7 md:h-10 w-auto object-contain transition-transform hover:scale-110 active:scale-95 duration-300 cursor-pointer"
                />
              </a>
            </div>
          </div>
        </div>
        
        {/* Trustpilot Stars Widget */}
        <div className="border-t border-border/50 pt-8 pb-2">
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
        <div className="flex flex-col items-center justify-between gap-3 pt-4 text-xs text-muted-foreground sm:flex-row">
          <p className="font-medium text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-foreground">{data.profile.fullName || "Peter Hugo Wishpax Le"}</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link 
              to="/privacy-policy" 
              className="font-medium transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("footer.privacyPolicy", "Chính sách bảo mật")}
            </Link>
            <span className="select-none text-[10px] text-border">•</span>
            <Link 
              to="/user-guide" 
              className="font-medium transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("footer.userGuide", "Hướng dẫn sử dụng")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
