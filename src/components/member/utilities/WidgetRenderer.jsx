import React from "react";
import { useTranslation } from "react-i18next";
import UtilityAppIcon from "./UtilityAppIcon";

export default function WidgetRenderer({
  myWidgets,
  utilitySizes,
  isEditMode,
  handleDragStart,
  handleDrop,
  handleAppTouchStart,
  handleAppTouchMove,
  handleAppTouchCancel,
  handleAppTouchEnd,
  isAuraActive,
  handleToggleAura,
  rainVolume,
  handleRainVolumeChange,
  cafeVolume,
  handleCafeVolumeChange,
  isRadioPlaying,
  handleToggleRadio,
  gradients,
  onAppHover
}) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = React.useState(1500);
  const categoryLabel = (category) =>
    t(`utilities.categories.${category === "edu" ? "education" : category === "arcade" ? "entertainment" : category}`);

  React.useEffect(() => {
    let timer = null;
    if (isAuraActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 1500));
      }, 1000);
    } else {
      setTimeLeft(1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAuraActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const strokeDashoffset = 213.6 - (213.6 * (1500 - timeLeft)) / 1500;

  return (
    <div className="space-y-4 text-left">
      {myWidgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {myWidgets.map((app, index) => {
          const size = utilitySizes[app.id] || "small";
          const gradient = gradients[app.tint] || gradients.indigo;

          const touchProps = {
            onMouseEnter: () => onAppHover?.(app.id),
            onPointerDown: (event) => handleAppTouchStart(app, event),
            onPointerMove: handleAppTouchMove,
            onPointerUp: (event) => handleAppTouchEnd(app, event),
            onPointerCancel: handleAppTouchCancel,
            onPointerLeave: (event) => {
              if (event.pointerType === "mouse") handleAppTouchCancel();
            },
            style: { touchAction: "pan-y" },
            draggable: isEditMode,
            onDragStart: (e) => handleDragStart(e, index, "widget"),
            onDragOver: (e) => e.preventDefault(),
            onDrop: (e) => handleDrop(e, index, "widget"),
          };

          // 📐 CASE 1: MEDIUM WIDGET (2x1 Glass Card)
          if (size === "medium") {
            return (
              <div
                key={app.id}
                {...touchProps}
                className={`relative group flex flex-col justify-between p-5 bg-card border rounded-3xl cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 overflow-hidden h-[136px] ${
                  isEditMode ? "border-dashed border-primary/50 animate-pulse" : "border-border/60"
                }`}
              >
                {isEditMode && (
                  <div className="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-xs font-black">drag_indicator</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UtilityAppIcon app={app} gradient={gradient} size="medium" className="!h-12 !w-12 !rounded-[14px]" />
                    <div className="text-left min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                        {app.title}
                      </h3>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {categoryLabel(app.category)}
                      </span>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t("utilities.library.open")}</span>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 text-left text-xs">
                  {app.id === "psychology" && (
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/30 rounded-xl p-2">
                      <span className="material-symbols-outlined text-purple-500 text-[14px]">chat_bubble</span>
                      <span className="text-muted-foreground italic truncate">“{t("utilities.library.widget.listening")}”</span>
                    </div>
                  )}
                  {app.id === "ide" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2 font-semibold">
                      <span className="text-muted-foreground">{t("utilities.library.widget.onlineCompiler")}</span>
                      <span className="text-[9.5px] font-black text-primary uppercase">{t("utilities.library.widget.runCode")}</span>
                    </div>
                  )}
                  {app.id === "aura" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-500 text-[16px] animate-spin" style={{ animationDuration: "12s" }}>schedule</span>
                        <span className="font-mono text-foreground font-black">{formatTime(timeLeft)}</span>
                      </div>
                      <button
                        onClick={handleToggleAura}
                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          isAuraActive ? "bg-destructive text-white" : "bg-primary text-white"
                        }`}
                      >
                        {isAuraActive ? t("utilities.library.widget.stop") : t("utilities.library.widget.start")}
                      </button>
                    </div>
                  )}
                  {app.id === "radio" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`material-symbols-outlined text-teal-500 text-sm ${isRadioPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>music_note</span>
                        <span className="text-muted-foreground truncate italic">Lofi Code Radio 24/7</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isRadioPlaying && (
                          <div className="flex items-end gap-0.5 h-3 px-1">
                            <span className="w-0.5 bg-teal-500 rounded-full" style={{ height: "4px", animation: "eqBar 0.8s ease-in-out infinite alternate" }} />
                            <span className="w-0.5 bg-teal-500 rounded-full" style={{ height: "4px", animation: "eqBar 0.5s ease-in-out infinite alternate-reverse" }} />
                            <span className="w-0.5 bg-teal-500 rounded-full" style={{ height: "4px", animation: "eqBar 0.7s ease-in-out infinite alternate" }} />
                          </div>
                        )}
                        <button
                          onClick={handleToggleRadio}
                          className="p-1 w-6.5 h-6.5 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[14px] font-bold">{isRadioPlaying ? "pause" : "play_arrow"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {app.id === "arcade" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>{t("utilities.library.widget.highScore")}</span>
                      <span className="text-warning">1,540 JOY</span>
                    </div>
                  )}
                  {!["psychology", "ide", "aura", "radio", "arcade"].includes(app.id) && (
                    <p className="text-[11px] text-muted-foreground italic truncate leading-snug">
                      {app.subLabel}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // 📊 CASE 2: LARGE WIDGET (2x2 Dashboard Card)
          if (size === "large") {
            return (
              <div
                key={app.id}
                {...touchProps}
                className={`relative group flex flex-col justify-between p-5 bg-card border rounded-3xl cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 overflow-hidden h-[260px] text-left ${
                  isEditMode ? "border-dashed border-primary/50 animate-pulse" : "border-border/60"
                }`}
              >
                {isEditMode && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-sm font-black">drag_indicator</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <UtilityAppIcon app={app} gradient={gradient} size="medium" className="!rounded-[18px]" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground leading-snug">
                        {app.title}
                      </h3>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {t("utilities.library.widget.homeScreen")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 my-3 overflow-hidden flex flex-col justify-center">
                  {app.id === "psychology" && (
                    <div className="space-y-3">
                      <div className="bg-muted/40 border border-border/30 rounded-2xl p-3.5 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="font-bold text-[10.5px] text-foreground tracking-wide">{t("utilities.library.widget.companionOnline")}</span>
                        </div>
                        <p className="text-muted-foreground/90 italic leading-relaxed">“{t("utilities.library.widget.companionMessage")}”</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium text-center text-muted-foreground">
                        <div className="bg-muted/50 p-1.5 rounded-lg">{t("utilities.library.widget.stress")}</div>
                        <div className="bg-muted/50 p-1.5 rounded-lg">{t("utilities.library.widget.sleep")}</div>
                        <div className="bg-muted/50 p-1.5 rounded-lg">{t("utilities.library.widget.study")}</div>
                      </div>
                    </div>
                  )}

                  {app.id === "ide" && (
                    <div className="bg-[#090d16] border border-white/5 rounded-2xl p-4 font-mono text-[9.5px] text-zinc-400 space-y-1.5 shadow-inner">
                      <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        </div>
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest">Main.js</span>
                      </div>
                      <div><span className="text-pink-500">const</span> status = <span className="text-yellow-300">"Active"</span>;</div>
                      <div><span className="text-cyan-400">console</span>.<span className="text-emerald-400">log</span>(status);</div>
                      <div className="text-[8.5px] text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                        <span>Compile: SUCCESS (0.2s)</span>
                      </div>
                    </div>
                  )}

                  {app.id === "aura" && (
                    <div className="flex items-center justify-between gap-4 p-1">
                      <div className="relative shrink-0 flex items-center justify-center">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="34" className="stroke-muted-foreground/10 fill-none" strokeWidth="3" />
                          <circle cx="40" cy="40" r="34" className="stroke-primary fill-none" strokeWidth="3" strokeDasharray="213.6" strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                        </svg>
                        <div className="absolute font-mono font-black text-xs text-foreground flex flex-col items-center">
                          <span>{formatTime(timeLeft)}</span>
                          <button
                            onClick={handleToggleAura}
                            className="text-[8px] font-black text-primary uppercase mt-0.5"
                          >
                            {isAuraActive ? t("utilities.library.widget.stop") : t("utilities.library.widget.start")}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2.5 text-left text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px]"><span>🌧️ {t("utilities.library.widget.forestRain")}</span><span>{rainVolume}%</span></div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={rainVolume}
                            onChange={handleRainVolumeChange}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full accent-primary h-1 bg-muted rounded-full cursor-pointer outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px]"><span>☕ {t("utilities.library.widget.cafe")}</span><span>{cafeVolume}%</span></div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={cafeVolume}
                            onChange={handleCafeVolumeChange}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full accent-primary h-1 bg-muted rounded-full cursor-pointer outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {app.id === "radio" && (
                    <div className="flex items-center gap-5 p-1 text-left">
                      <div
                        onClick={handleToggleRadio}
                        className={`relative w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center shadow-lg border-4 border-zinc-900/60 shrink-0 cursor-pointer will-change-transform transform ${
                          isRadioPlaying ? "animate-spin-slow" : "translate-z-0"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
                        </div>
                        <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none scale-[0.8]" />
                        <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none scale-[0.6]" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11.5px] font-black text-foreground truncate">Lofi Chill Session</p>
                          {isRadioPlaying && (
                            <div className="flex items-end gap-0.5 h-3 px-1.5 shrink-0">
                              <span className="w-0.5 bg-teal-500 rounded-full animate-eqBar1" style={{ height: "4px", animation: "eqBar 0.8s ease-in-out infinite alternate" }} />
                              <span className="w-0.5 bg-teal-500 rounded-full animate-eqBar2" style={{ height: "4px", animation: "eqBar 0.5s ease-in-out infinite alternate-reverse" }} />
                              <span className="w-0.5 bg-teal-500 rounded-full animate-eqBar3" style={{ height: "4px", animation: "eqBar 0.7s ease-in-out infinite alternate" }} />
                              <span className="w-0.5 bg-teal-500 rounded-full animate-eqBar4" style={{ height: "4px", animation: "eqBar 0.6s ease-in-out infinite alternate-reverse" }} />
                              <span className="w-0.5 bg-teal-500 rounded-full animate-eqBar5" style={{ height: "4px", animation: "eqBar 0.9s ease-in-out infinite alternate" }} />
                            </div>
                          )}
                        </div>
                        <p className="text-[9.5px] text-muted-foreground truncate uppercase font-bold tracking-wider">{t("utilities.library.widget.summerTrack")}</p>
                        <div className="h-1 bg-muted rounded-full w-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-[2000ms]" 
                            style={{ 
                              width: isRadioPlaying ? "55%" : "0%",
                              animation: isRadioPlaying ? "progressWave 15s linear infinite" : "none"
                            }} 
                          />
                        </div>
                        <div className="flex justify-between text-[9.5px] text-zinc-500 font-mono">
                          <span>01:24</span>
                          <span>03:45</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {app.id === "bio" && (
                    <div className="flex items-center gap-4 bg-muted/40 border border-border/30 rounded-2xl p-3.5">
                      <div className="w-12 h-12 rounded-full bg-muted border-2 border-primary/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-muted-foreground text-2xl">account_circle</span>
                      </div>
                      <div className="text-left min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-foreground truncate">{t("utilities.library.widget.profile")}</span>
                          <span className="material-symbols-outlined text-primary text-xs">verified</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/85 leading-normal">{t("utilities.library.widget.profileDescription")}</p>
                      </div>
                    </div>
                  )}

                  {!["psychology", "ide", "aura", "radio", "bio"].includes(app.id) && (
                    <div className="bg-muted/40 border border-border/30 rounded-2xl p-3.5 text-xs text-muted-foreground space-y-1">
                      <p className="text-[10px] leading-relaxed italic">"{app.subLabel}"</p>
                      <div className="text-[10.5px] font-black text-warning pt-1">★ {t("utilities.library.widget.ratingUsers", { rating: app.rating, users: app.users })}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>{t("utilities.library.widget.holdToCustomize")}</span>
                  <span className="material-symbols-outlined text-sm text-muted-foreground/70 transform group-hover:translate-x-0.5 transition-transform">arrow_forward_ios</span>
                </div>
              </div>
            );
          }

        })}
      </div>
      )}
    </div>
  );
}
