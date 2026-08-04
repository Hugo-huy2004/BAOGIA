import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoutePrefetcher } from "../../../utils/routePrefetcher";
import { triggerPWAInstallDirectly } from "../../../utils/pwaInstallTrigger";
import { appInstallationPolicy } from "../../../../shared/appInstallationPolicy";
import { ArrowLeft, Search, X } from "lucide-react";
import UtilityAppIcon from "./UtilityAppIcon";
import JoyCoinBadge from "../../shared/JoyCoinBadge";

// Kept in sync with the same map in MemberUtilitiesDashboard.jsx
const APP_STORAGE_MB = {
  hugoskin: 2.8,
  ide: 4.5,
  psychology: 3.2,
  arcade: 5.1,
  radio: 1.9,
  helpdesk: 1.4,
  handle: 1.2,
  aura: 1.8,
  deco: 3.8,
  team: 1.6,
  bio: 1.5,
  info: 0.8,
  joy_wallet: 1.1,
  map: 2.4,
  hugoso: 3.6
};

const APP_VERSIONS = {
  bio: "3.2.0",
  ide: "2.8.1",
  team: "1.4.0",
  psychology: "4.1.0",
  hugoskin: "2.0.3",
  radio: "1.6.0",
  helpdesk: "2.3.0",
  handle: "1.9.0",
  arcade: "3.5.0",
  aura: "2.1.0",
  deco: "1.7.0",
  info: "2.0.0",
  joy_wallet: "2.4.0",
  map: "1.0.0",
  hugoso: "1.0.0"
};

export default function LibraryCatalog({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  libraryAppsList,
  downloadingAppId,
  downloadProgress = {},
  installedApps,
  handleInstallApp,
  setSelectedUtility,
  gradients,
  onBack
}) {
  const { t } = useTranslation();
  const [selectedApp, setSelectedApp] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [pendingInstallApp, setPendingInstallApp] = useState(null);
  const [activeTab, setActiveTab] = useState("apps"); // "apps" | "installed"


  // Hide mobile bottom tab bar whenever a modal sheet (product detail or install choice) is open
  useEffect(() => {
    const isOpen = Boolean(selectedApp || pendingInstallApp);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
    };
  }, [selectedApp, pendingInstallApp]);

  const categoryLabel = (category) =>
    t(`utilities.categories.${category === "edu" ? "education" : category === "arcade" ? "entertainment" : category}`);

  const confirmInstall = (addToHome) => {
    if (!pendingInstallApp) return;
    handleInstallApp(pendingInstallApp.id, addToHome);
    setPendingInstallApp(null);
  };

  const handleOpenApp = (appId) => {
    if (appId === "store") {
      setSelectedUtility("store");
      return;
    }
    setSelectedUtility(appId);
  };

  const filteredApps = libraryAppsList.filter((app) => {
    if (activeTab === "installed") return installedApps.includes(app.id);
    return true;
  });

  return (
    <div className="space-y-4 animate-fadeIn text-left relative pb-20 select-none">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/30 bg-background/92 px-1 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                if (setSelectedUtility) setSelectedUtility(null);
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
              title={t("utilities.library.back")}
              aria-label={t("utilities.library.back")}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">arrow_back</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <UtilityAppIcon app={{ id: "library" }} gradient="from-blue-500 to-indigo-600" size="small" />
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              Hugo Library
            </span>
          </div>
        </div>

        <span className="rounded-full bg-muted px-3 py-1.5">
          <JoyCoinBadge size="sm" />
        </span>
      </div>

      <div className="apps-library-search relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted-foreground/70" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("utilities.library.searchPlaceholder")}
          className="h-11 w-full bg-transparent pl-10 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground/55"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="apps-search-clear"
            aria-label={t("utilities.library.clearSearch")}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide" aria-label={t("utilities.library.filters")}>
        {categories.map((cat) => {
          const active = activeTab === "apps" && activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTab("apps");
                setActiveCategory(cat.id);
              }}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95 ${
                active
                  ? "bg-primary text-white"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-selected={activeTab === "installed"}
          onClick={() => setActiveTab("installed")}
          className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95 ${
            activeTab === "installed"
              ? "bg-primary text-white"
              : "bg-muted/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("utilities.library.installedCount", { count: installedApps.length })}
        </button>
      </div>

      <div className="flex items-end justify-between px-1 pt-1">
        <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
          {activeTab === "installed" ? t("utilities.library.yourApps") : t("utilities.library.featuredApps")}
        </h2>
        <span className="pb-0.5 text-[13px] text-muted-foreground">
          {t("utilities.library.appCount", { count: filteredApps.length })}
        </span>
      </div>

      {/* ── 6. CATALOG APP CARDS GRID (HUGO ARCADE GAMECARD STYLE) ────────────────── */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 bg-card border border-border/60 rounded-3xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <span className="material-symbols-outlined text-2xl">search_off</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("utilities.library.noResults")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("utilities.library.noResultsHint")}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm divide-y divide-border/50 overflow-hidden">
          {filteredApps.map((app) => {
            const gradient = gradients[app.tint] || gradients.indigo;
            const isInstalled = installedApps.includes(app.id);
            const isDownloading = downloadingAppId === app.id;
            const progress = downloadProgress[app.id] || 0;
            const appSize = (APP_STORAGE_MB[app.id] || 2.0).toFixed(1);
            const isRequired = appInstallationPolicy.isRequired(app.id);

            return (
              <div
                key={app.id}
                onMouseEnter={() => RoutePrefetcher.prefetchApp(app.id)}
                onTouchStart={() => RoutePrefetcher.prefetchApp(app.id)}
                onClick={() => { setSelectedApp(app); setDescExpanded(false); }}
                className="cursor-pointer flex items-center gap-3.5 p-3 sm:px-4 hover:bg-muted/40 active:bg-muted/60 transition-colors"
              >
                {/* App Store squircle icon */}
                <UtilityAppIcon app={app} gradient={gradient} size="medium" />

                {/* Name + subtitle + meta */}
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-[15px] font-semibold text-foreground leading-tight truncate">
                    {app.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground truncate leading-tight mt-0.5">
                    {app.subLabel}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 mt-1 truncate">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {app.rating}
                    </span>
                    <span>·</span>
                    <span>{categoryLabel(app.category)}</span>
                    <span>·</span>
                    <span>{appSize} MB</span>
                  </div>
                </div>

                {/* GET / OPEN pill (App Store style) */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  {isDownloading ? (
                    <div
                      className="w-[76px] h-8 relative overflow-hidden bg-muted rounded-full flex items-center justify-center select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-primary/25 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="text-xs font-bold text-primary relative z-10">{progress}%</span>
                    </div>
                  ) : isInstalled ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenApp(app.id); }}
                      className="w-[76px] h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 text-primary font-bold text-sm uppercase tracking-wide active:scale-95 transition-all"
                    >
                      {t("utilities.library.open")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPendingInstallApp(app); }}
                      className="w-[76px] h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 text-primary font-bold text-sm uppercase tracking-wide active:scale-95 transition-all"
                    >
                      {t("utilities.library.get")}
                    </button>
                  )}
                  {(app.badge || isRequired) && (
                    <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                      {isRequired ? t("utilities.library.included") : app.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 8. MODAL SHEET: INSTALL LOCATION CHOICE ────────────────────────────── */}
      {pendingInstallApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[600] p-4 text-center animate-fadeIn">
          <div className="bg-card border border-border/60 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <UtilityAppIcon app={pendingInstallApp} gradient={gradients[pendingInstallApp.tint] || gradients.indigo} size="medium" className="mx-auto" />

            <div className="text-center space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {t("utilities.library.installWhere", { app: pendingInstallApp.title })}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("utilities.library.installWhereDescription")}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => confirmInstall(true)}
                className="w-full py-3.5 px-4 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add_to_home_screen</span>
                <span>{t("utilities.library.homeAndLibrary")}</span>
              </button>

              <button
                onClick={() => confirmInstall(false)}
                className="w-full py-3.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">inventory_2</span>
                <span>{t("utilities.library.libraryOnly")}</span>
              </button>

              <button
                onClick={() => setPendingInstallApp(null)}
                className="w-full py-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                {t("utilities.library.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. PRODUCT DETAIL SHEET (APPLE APP STORE 2.0 STYLE) ──────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 transition-opacity">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />

          <div className="pwa-safe-sheet relative w-full sm:max-w-lg bg-card border-t sm:border border-border/60 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-[510] max-h-[90dvh] overflow-y-auto animate-slideUp text-left space-y-6">
            <div className="w-9 h-1 bg-muted rounded-full mx-auto sm:hidden" />

            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[selectedApp.tint] || gradients.indigo} flex items-center justify-center text-white shadow-sm shrink-0`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{selectedApp.icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground truncate">{selectedApp.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{selectedApp.subLabel}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {categoryLabel(selectedApp.category)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">v{APP_VERSIONS[selectedApp.id] || "1.0.0"}</span>
                  {appInstallationPolicy.isRequired(selectedApp.id) ? (
                    <span className="text-xs font-medium text-success">
                      {t("utilities.library.included")}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{t("utilities.library.appDescription")}</h4>
              <p className={`text-sm text-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                {t(`utilities.catalog.${selectedApp.id}.fullDescription`, { defaultValue: selectedApp.subLabel })}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-sm font-medium text-primary hover:underline focus:outline-none"
              >
                {descExpanded ? t("utilities.library.collapse") : t("utilities.library.expand")}
              </button>
            </div>

            {/* Technical Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground block">{t("utilities.library.storage")}</span>
                <span className="text-sm font-semibold text-foreground font-mono">{APP_STORAGE_MB[selectedApp.id] || 2.0} MB</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground block">{t("utilities.library.age")}</span>
                <span className="text-sm font-semibold text-foreground">4+</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground block">{t("utilities.library.availability")}</span>
                <span className="text-sm font-semibold text-foreground">PWA &amp; Web</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {installedApps.includes(selectedApp.id) ? (
                <button
                  onClick={() => { setSelectedApp(null); handleOpenApp(selectedApp.id); }}
                  className="w-full py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  <span>{t("utilities.library.openApp")}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setSelectedApp(null); setPendingInstallApp(selectedApp); }}
                  className="w-full py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>{t("utilities.library.installApp")}</span>
                </button>
              )}

              <button
                onClick={() => triggerPWAInstallDirectly(selectedApp.title)}
                className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-primary">shortcut</span>
                <span>{t("utilities.library.createShortcut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
