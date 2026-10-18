import React, { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n, { ensureTranslations } from "../i18n/config";
import { SERVICES_ORIGIN, cvPdf } from "../config/publicSites";
import "../index.css";

const Introduction = lazy(() => import("../pages/public/IntroductionPage"));
const Projects = lazy(() => import("../pages/public/ProjectsPage"));
const Project = lazy(() => import("../pages/public/ProjectDetailPage"));
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
  useEffect(() => {
    ensureTranslations().then(() => setReady(true));
  }, []);
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <nav aria-label="Portfolio" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <Link to="/" className="mr-auto font-bold">Hugo Wishpax</Link>
          <Link to="/#projects">{t("projectsPage.title", "Dự án")}</Link>
          <Link to="/#skills">{language.language.startsWith("vi") ? "Kỹ năng" : language.language.startsWith("zh") ? "技能" : "Skills"}</Link>
          <a href="/cv/index.html">CV</a>
          <a href={SERVICES_ORIGIN}>{t("navbar.services", "Dịch vụ")}</a>
          <div className="flex gap-3" aria-label="Language">
            {["vi", "en", "zh"].map((code) => (
              <a key={code} href={`${code === "vi" ? "" : `/${code}`}${pathname}`}
                aria-current={language.language.startsWith(code) ? "page" : undefined}>
                {code === "zh" ? "中文" : code.toUpperCase()}
              </a>
            ))}
          </div>
        </nav>
      </header>
      <main>
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
      <footer className="border-t border-border px-5 py-8 text-center text-sm">
        <a href={cvPdf(language.language)} download className="underline underline-offset-4">
          {language.language.startsWith("vi") ? "Tải CV (PDF)" : language.language.startsWith("zh") ? "下载简历 (PDF)" : "Download CV (PDF)"}
        </a>
        <span className="mx-4" aria-hidden="true">·</span>
        <a href="mailto:contact@hugowishpax.studio">contact@hugowishpax.studio</a>
      </footer>
    </>
  );
}

await i18n.changeLanguage(prefix.slice(1) || "vi");
createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter basename={prefix || undefined}><Portfolio /></BrowserRouter></React.StrictMode>,
);
