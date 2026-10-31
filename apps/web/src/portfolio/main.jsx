import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import i18n, { ensureTranslations } from "../i18n/config";
import { SERVICES_ORIGIN, cvPdf } from "../config/publicSites";
import HugoLogo from "../components/HugoLogo";
import "../index.css";
import "./portfolio.css";

const Introduction = lazy(() => import("../pages/public/IntroductionPage"));
const Projects = lazy(() => import("../pages/public/ProjectsPage"));
const Project = lazy(() => import("../pages/public/ProjectDetailPage"));
const LANGS = [
  { code: "vi", short: "VI", name: "Tiếng Việt" },
  { code: "en", short: "EN", name: "English" },
  { code: "zh", short: "中", name: "中文" },
];
const prefix = window.location.pathname.match(/^\/(en|zh)(?=\/|$)/)?.[0] || "";

function ScrollPosition() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else document.getElementById("root")?.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Portfolio() {
  const { t, i18n: language } = useTranslation();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const scrollRootRef = useRef(document.getElementById("root"));
  const { scrollYProgress } = useScroll({ container: scrollRootRef });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 28, mass: 0.25 });
  useEffect(() => {
    ensureTranslations().then(() => setReady(true));
  }, []);
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 28 }}>
      <motion.div className="portfolio-progress" style={{ scaleX: progress }} />
      <header className="portfolio-nav-wrap">
        <nav aria-label="Portfolio" className="portfolio-nav">
          <Link to="/" className="portfolio-wordmark" aria-label="Hugo Wishpax — Portfolio">
            <HugoLogo className="h-7 w-7" aria-hidden="true" /> Hugo Wishpax
          </Link>
          <div className="portfolio-nav-links">
            <Link to="/#projects">{t("projectsPage.navLabel", "Dự Án")}</Link>
            <Link to="/#about">{t("intro.story.profile.kicker", "Hồ sơ")}</Link>
            <Link to="/#skills">{language.language.startsWith("vi") ? "Kỹ năng" : language.language.startsWith("zh") ? "技能" : "Skills"}</Link>
            <a href="/cv/index.html">CV</a>
          </div>
          {/* Một nút gọn thay ba nút: trên điện thoại ba ô ngôn ngữ chiếm gần nửa
              thanh và đẩy Hồ sơ/Kỹ năng ra ngoài. <details> là menu bản địa, không cần JS. */}
          <details className="portfolio-languages">
            <summary aria-label="Language">
              <span className="material-symbols-outlined" aria-hidden="true">language</span>
              {LANGS.find((l) => language.language.startsWith(l.code))?.short || "VI"}
            </summary>
            <div role="menu">
              {LANGS.map(({ code, name }) => (
                <a key={code} role="menuitem" href={`${code === "vi" ? "" : `/${code}`}${pathname}`}
                  aria-current={language.language.startsWith(code) ? "page" : undefined}>
                  {name}
                </a>
              ))}
            </div>
          </details>
        </nav>
      </header>
      <main id="top">
        {ready && <Suspense fallback={<p className="p-8" role="status">…</p>}>
          <ScrollPosition />
          <Routes>
            <Route path="/" element={<Introduction />} />
            <Route path="/introduction" element={<Navigate to="/" replace />} />
            <Route path="/project" element={<Projects />} />
            <Route path="/project/:slug" element={<Project />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>}
      </main>
      <footer className="portfolio-footer">
        <p>Hugo Wishpax <span>·</span> Ho Chi Minh City</p>
        <div>
          <a href={cvPdf(language.language)} download>
            {language.language.startsWith("vi") ? "Tải CV PDF" : language.language.startsWith("zh") ? "下载简历 PDF" : "Download CV PDF"}
          </a>
          <a href="https://github.com/Hugo-huy2004" target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:contact@hugowishpax.studio">Email</a>
          <a href={SERVICES_ORIGIN}>{t("navbar.services", "Dịch vụ")}</a>
        </div>
      </footer>
    </MotionConfig>
  );
}

// Báo cho "gác khởi động" trong index.html biết bundle đã chạy (đặt TRƯỚC
// await: sự kiện `load` không chờ top-level await, chờ render là báo nhầm).
window.__hugoBooted = true;
await i18n.changeLanguage(prefix.slice(1) || "vi");
createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter basename={prefix || undefined}><Portfolio /></BrowserRouter></React.StrictMode>,
);
