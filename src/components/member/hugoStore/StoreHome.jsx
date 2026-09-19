import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import { PRODUCT_GROUPS, perkLabel, moneyUnit, formatDate, tileAction, GRADIENTS } from "./storeData";
import UtilityAppIcon from "../utilities/UtilityAppIcon";

const norm = (value        ) => String(value || "").toLowerCase();

export default function StoreHome({
  entries = [], packs = [], orders = [], balance, title, search = "", onSearch,
  onOpenApp, onBuyPack, onInstall, onOpen
}     ) {
  const { t } = useTranslation();
  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const shownApps = useMemo(
    () => (searching
      ? entries.filter((e     ) => norm(e.app.label).includes(query) || norm(e.app.tagline).includes(query))
      : entries),
    [entries, query, searching]
  );

  const shownPacks = useMemo(
    () => (searching
      ? packs.filter((p     ) => [p.name, p.description, perkLabel(p)].some(f => norm(f).includes(query)))
      : packs),
    [packs, query, searching]
  );

  const apps = shownApps.filter((e     ) => !e.app.game);
  const games = shownApps.filter((e     ) => e.app.game);

  const heroes = useMemo(() => {
    const missing = entries.filter((e     ) => (e.ladder && !e.state?.unlocked) || (e.installable && !e.installed));
    return (missing.length ? missing : entries).slice(0, 5);
  }, [entries]);

  const nothing = searching && apps.length === 0 && games.length === 0 && shownPacks.length === 0;

  const renderActionButton = (entry     ) => {
    const action = tileAction(entry);
    const config      = {
      installing: { label: t("utilities.store.app.installing", { percent: entry.progress }), run: null },
      locked: { label: t("utilities.store.app.locked"), run: null },
      install: { label: t("utilities.store.app.install"), run: () => onInstall?.(entry) },
      open: { label: t("utilities.store.app.open"), run: () => onOpen?.(entry) },
    }[action];

    return (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (config.run) config.run();
          else onOpenApp(entry.app.id);
        }}
        disabled={!config.run && action === 'installing'}
        className="bg-primary/10 text-primary font-bold text-[13px] px-4 py-1.5 rounded-full hover:bg-primary/20 transition-colors inline-block w-auto shrink-0 z-10"
      >
        {config.label}
      </button>
    );
  };

  return (
    <div className="pb-10 bg-background/50">
      {/* HEADER */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        
        {/* SEARCH BAR */}
        <div className="relative mt-4 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px] transition-colors group-focus-within:text-primary">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("utilities.store.search.placeholder")}
            className="w-full h-10 pl-10 pr-10 rounded-[10px] bg-muted/60 border border-transparent focus:border-border focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20 text-[16px] text-foreground transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted-foreground/10 hover:bg-muted-foreground/20 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {nothing ? (
        <div className="px-5 py-12 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[48px] text-muted-foreground/50 mb-4">search_off</span>
          <h3 className="text-lg font-semibold text-foreground">{t("utilities.store.search.empty")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("utilities.store.search.emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* HERO FEATURED CARDS */}
          {!searching && heroes.length > 0 && (
            <section className="px-5">
              <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 -mx-5 px-5">
                {heroes.map((entry     , i        ) => (
                  <div key={entry.app.id} onClick={() => onOpenApp(entry.app.id)} className="snap-start shrink-0 w-[85vw] max-w-[320px] cursor-pointer group rounded-[24px] overflow-hidden shadow-lg border border-white/20 relative">
                    {/* Liquid Glass Effect Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[entry.app.color]} opacity-80 group-hover:scale-105 transition-transform duration-500`} />
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] mix-blend-overlay" />
                    
                    <div className="relative aspect-[16/9] flex flex-col justify-between p-5">
                      <div>
                        <h3 className="text-[13px] font-bold text-white/90 uppercase tracking-widest mb-1 shadow-sm drop-shadow-md">Nổi Bật</h3>
                        <h2 className="text-[26px] font-extrabold text-white leading-tight drop-shadow-lg">{entry.app.label}</h2>
                        <p className="text-[14px] text-white/95 font-medium line-clamp-1 mt-1 drop-shadow-md">{entry.app.tagline}</p>
                      </div>
                      <div className="mt-4 self-start">
                        <button className="bg-white/20 hover:bg-white/30 text-white font-bold text-[14px] px-5 py-2 rounded-full backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/30 transition-colors">
                          Khám Phá Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HORIZONTAL GAMES LIST */}
          {games.length > 0 && (
            <section className="px-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{t("utilities.store.home.games")}</h2>
                {!searching && <span className="text-[13px] text-muted-foreground font-medium">{t("utilities.store.home.gamesHint")}</span>}
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-2 -mx-5 px-5">
                {games.map((entry     ) => (
                  <div key={entry.app.id} onClick={() => onOpenApp(entry.app.id)} className="snap-start shrink-0 w-[140px] cursor-pointer group flex flex-col items-center text-center">
                    {/* Liquid Glass Icon Wrapper */}
                    <div className="relative mb-3 group-hover:-translate-y-1 transition-transform">
                      <div className={`absolute inset-1 bg-gradient-to-br ${GRADIENTS[entry.app.color]} opacity-20 blur-md rounded-[24px] translate-y-2`} />
                      <UtilityAppIcon 
                        app={entry.app} 
                        gradient={GRADIENTS[entry.app.color]} 
                        size="large" 
                        className="!w-[100px] !h-[100px] !rounded-[24px] shadow-[0_8px_16px_rgba(0,0,0,0.08)] border border-white/20 relative z-10" 
                      />
                      {/* Glass Specular Highlight */}
                      <div className="absolute inset-0 z-20 rounded-[24px] pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
                    </div>
                    <h3 className="text-[15px] font-bold text-foreground line-clamp-1">{entry.app.label}</h3>
                    <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{entry.app.tagline}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* APPS GRID */}
          {apps.length > 0 && (
            <section className="px-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{t("utilities.store.home.apps")}</h2>
                {!searching && <span className="text-[13px] text-muted-foreground font-medium">{t("utilities.store.home.appsHint")}</span>}
              </div>
              <div className="flex flex-col gap-4">
                {apps.map((entry     ) => (
                  <div key={entry.app.id} onClick={() => onOpenApp(entry.app.id)} className="flex items-center gap-4 p-4 rounded-[20px] bg-card/60 backdrop-blur-md border border-border/40 shadow-sm cursor-pointer hover:bg-card hover:shadow-md hover:border-primary/20 transition-all group">
                    <div className="relative shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[entry.app.color]} opacity-15 blur-sm rounded-[16px] translate-y-1`} />
                      <UtilityAppIcon 
                        app={entry.app} 
                        gradient={GRADIENTS[entry.app.color]}
                        size="medium" 
                        className="!w-[64px] !h-[64px] !rounded-[16px] shadow-sm relative z-10" 
                      />
                      <div className="absolute inset-0 z-20 rounded-[16px] pointer-events-none bg-gradient-to-br from-white/20 to-transparent mix-blend-overlay" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-bold text-foreground line-clamp-1">{entry.app.label}</h3>
                      <p className="text-[13px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{entry.app.tagline}</p>
                    </div>
                    
                    {renderActionButton(entry)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ITEM PACKS */}
          {PRODUCT_GROUPS.map((group     ) => {
            const list = shownPacks.filter((p     ) => (p.productType || "general") === group.type);
            if (list.length === 0) return null;
            return (
              <section key={group.type} className="px-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">{group.title}</h2>
                  {!searching && <span className="text-[13px] text-muted-foreground font-medium">{group.subtitle}</span>}
                </div>
                <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                  {list.map((pack     , i        ) => (
                    <div key={pack._id} className={`flex items-center gap-4 p-4 ${i !== list.length - 1 ? 'border-b border-border/40' : ''}`}>
                      <div className="w-[50px] h-[50px] shrink-0 rounded-[14px] bg-muted flex items-center justify-center text-2xl relative shadow-sm border border-border/20" style={{ backgroundColor: `${group.color}15`, color: group.color }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay rounded-[14px]" />
                        <span className="drop-shadow-sm">💎</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground text-[16px]">{pack.name}</h3>
                        <p className="text-[13px] text-muted-foreground line-clamp-1">{pack.description}</p>
                      </div>
                      <button 
                        onClick={() => onBuyPack(pack)}
                        className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-full font-bold text-[14px] transition-colors"
                      >
                        {moneyUnit(pack.priceJoy)}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* RECENT ORDERS */}
          {!searching && orders.length > 0 && (
            <section className="px-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{t("utilities.store.home.orders")}</h2>
                <span className="text-[13px] text-muted-foreground font-medium">{t("utilities.store.home.ordersHint")}</span>
              </div>
              <div className="bg-card border border-border/40 rounded-[20px] overflow-hidden shadow-sm">
                {orders.slice(0, 5).map((order     , i        ) => (
                  <div key={order._id} className={`flex items-center gap-4 p-4 ${i !== orders.slice(0, 5).length - 1 ? 'border-b border-border/40' : ''}`}>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-[15px] line-clamp-1">{order.productName}</p>
                      <p className="text-[12px] text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground text-[15px] tabular-nums">{moneyUnit(order.priceJoy)}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{order.purchaseCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BALANCE FOOTER */}
          {!searching && (
            <section className="px-5 pb-6">
              <div className="relative rounded-[20px] p-5 text-white flex items-center justify-between shadow-lg overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                <div className="relative z-10">
                  <p className="text-[13px] text-white/90 font-medium mb-1 drop-shadow-sm">{t("utilities.store.home.balance")}</p>
                  <div className="drop-shadow-md">
                    <JoyCoinBadge amount={balance} size="md" />
                  </div>
                </div>
                <p className="relative z-10 max-w-[140px] text-right text-[12px] text-white/90 leading-snug drop-shadow-sm font-medium">
                  {t("utilities.store.home.balanceHint")}
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
