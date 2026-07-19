import React from "react";

export default function WidgetRenderer({
  myWidgets,
  utilitySizes,
  isEditMode,
  handleDragStart,
  handleDrop,
  handleAppTouchStart,
  handleAppTouchEnd,
  isAuraActive,
  handleToggleAura,
  rainVolume,
  handleRainVolumeChange,
  cafeVolume,
  handleCafeVolumeChange,
  isRadioPlaying,
  handleToggleRadio,
  joyBalance,
  gradients,
  cardThemes,
  glowShadows,
  onAppHover
}) {
  if (myWidgets.length === 0) return null;

  const [timeLeft, setTimeLeft] = React.useState(1500);

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
      <div className="flex items-center gap-2 px-1 text-muted-foreground/90 font-black text-xs uppercase tracking-widest">
        <span className="material-symbols-outlined text-base">dashboard</span>
        <span>Tiện ích Widget ({myWidgets.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {myWidgets.map((app, index) => {
          const size = utilitySizes[app.id] || "medium";
          const gradient = gradients[app.tint] || gradients.indigo;
          const glow = glowShadows[app.tint] || glowShadows.indigo;
          const cardTheme = cardThemes[app.tint] || "from-primary/5 to-transparent";

          const touchProps = {
            onMouseEnter: () => onAppHover?.(app.id),
            onMouseDown: () => handleAppTouchStart(app),
            onMouseUp: (e) => handleAppTouchEnd(app, e),
            onMouseLeave: () => clearTimeout(window.longPressTimer),
            onTouchStart: () => handleAppTouchStart(app),
            onTouchEnd: (e) => handleAppTouchEnd(app, e),
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
                className={`relative group flex flex-col justify-between p-5 bg-gradient-to-br ${cardTheme} bg-card/75 dark:bg-card/45 backdrop-blur-md border rounded-[30px] cursor-pointer shadow-md transition-all duration-300 hover:-translate-y-1.5 ${glow} overflow-hidden h-[136px] ${
                  isEditMode ? "border-dashed border-primary/50 animate-pulse" : "border-white/20 dark:border-white/5"
                }`}
              >
                {isEditMode && (
                  <div className="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-xs font-black">drag_indicator</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md relative overflow-hidden shrink-0`}>
                      <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                      <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="text-sm font-black text-foreground leading-snug truncate">
                        {app.title}
                      </h3>
                      <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider block mt-0.5">
                        {app.category === "edu" ? "Học tập" : app.category === "wellness" ? "Sức khỏe" : app.category === "tools" ? "Công cụ" : "Giải trí"}
                      </span>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="flex items-center gap-1.5 bg-muted/65 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-border/30 shrink-0">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-500">Mở</span>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 text-left text-xs">
                  {app.id === "psychology" && (
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/30 rounded-xl p-2">
                      <span className="material-symbols-outlined text-purple-500 text-[14px]">chat_bubble</span>
                      <span className="text-muted-foreground italic truncate">"Tôi luôn lắng nghe bạn..."</span>
                    </div>
                  )}
                  {app.id === "ide" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2 font-semibold">
                      <span className="text-muted-foreground">Compiler Online</span>
                      <span className="text-[9.5px] font-black text-primary uppercase">Chạy Code</span>
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
                        {isAuraActive ? "Tắt" : "Bật"}
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
                  {app.id === "joy_wallet" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-orange-500 text-sm">payments</span>
                        <span className="font-black text-foreground">{joyBalance.toLocaleString()} JOY</span>
                      </div>
                      <span className="text-[8.5px] font-black tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">VÀNG JOY</span>
                    </div>
                  )}
                  {app.id === "arcade" && (
                    <div className="flex items-center justify-between bg-muted/40 border border-border/30 rounded-xl p-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Highscore</span>
                      <span className="text-warning">1,540 JOY</span>
                    </div>
                  )}
                  {!["psychology", "ide", "aura", "radio", "joy_wallet", "arcade"].includes(app.id) && (
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
                className={`relative group flex flex-col justify-between p-5 bg-gradient-to-br ${cardTheme} bg-card/75 dark:bg-card/55 backdrop-blur-md border rounded-[32px] cursor-pointer shadow-md transition-all duration-300 hover:-translate-y-1.5 ${glow} overflow-hidden h-[260px] text-left ${
                  isEditMode ? "border-dashed border-primary/50 animate-pulse" : "border-white/20 dark:border-white/5"
                }`}
              >
                {isEditMode && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-sm font-black">drag_indicator</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[18px] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md relative overflow-hidden shrink-0`}>
                      <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                      <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                        {app.title}
                      </h3>
                      <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-0.5 block">
                        Màn hình chính
                      </span>
                    </div>
                  </div>
                  {!isEditMode && app.badge && (
                    <span className="px-2.5 py-0.5 text-[8.5px] font-black bg-muted border border-border/75 text-muted-foreground uppercase rounded-md leading-none shadow-sm">
                      {app.badge}
                    </span>
                  )}
                </div>

                <div className="flex-1 my-3 overflow-hidden flex flex-col justify-center">
                  {app.id === "psychology" && (
                    <div className="space-y-3">
                      <div className="bg-muted/40 border border-border/30 rounded-2xl p-3.5 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="font-bold text-[10.5px] text-foreground tracking-wide">Trực tuyến song hành</span>
                        </div>
                        <p className="text-muted-foreground/90 italic leading-relaxed">"Hãy trút bỏ căng thẳng, tôi sẽ thấu cảm và hướng dẫn bạn vượt qua."</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[9px] font-black uppercase text-center tracking-wider text-muted-foreground">
                        <div className="bg-card p-1.5 rounded-lg border border-border/20">🌧️ Căng thẳng</div>
                        <div className="bg-card p-1.5 rounded-lg border border-border/20">😴 Mất ngủ</div>
                        <div className="bg-card p-1.5 rounded-lg border border-border/20">📖 Học tập</div>
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
                            {isAuraActive ? "DỪNG" : "CHẠY"}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2.5 text-left text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px]"><span>🌧️ Mưa rừng</span><span>{rainVolume}%</span></div>
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
                          <div className="flex justify-between text-[9px]"><span>☕ Quán cafe</span><span>{cafeVolume}%</span></div>
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
                        <p className="text-[9.5px] text-muted-foreground truncate uppercase font-bold tracking-wider">Mùa hạ tĩnh lặng</p>
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

                  {app.id === "joy_wallet" && (
                    <div className="space-y-3">
                      <div className="bg-muted/40 border border-border/30 rounded-2xl p-3.5 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Số dư JOY khả dụng</span>
                          <span className="font-black text-lg text-foreground mt-0.5 block">{joyBalance.toLocaleString()} JOY</span>
                        </div>
                        <span className="material-symbols-outlined text-orange-500 text-3xl">account_balance_wallet</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-1">
                        <span className="text-[9px] text-muted-foreground font-semibold">Thu nhập 5 ngày</span>
                        <svg className="w-24 h-6 text-orange-500" viewBox="0 0 100 20">
                          <path 
                            d="M 0,20 Q 25,5 50,15 T 100,5" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            style={{
                              strokeDasharray: 120,
                              strokeDashoffset: 120,
                              animation: "drawChart 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards"
                            }}
                          />
                        </svg>
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
                          <span className="font-bold text-xs text-foreground truncate">Hồ sơ cá nhân</span>
                          <span className="material-symbols-outlined text-primary text-xs">verified</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/85 leading-normal">Biolink công khai, cổng kết nối công cụ và các tiện ích học tập của bạn.</p>
                      </div>
                    </div>
                  )}

                  {!["psychology", "ide", "aura", "radio", "joy_wallet", "bio"].includes(app.id) && (
                    <div className="bg-muted/40 border border-border/30 rounded-2xl p-3.5 text-xs text-muted-foreground space-y-1">
                      <p className="text-[10px] leading-relaxed italic">"{app.subLabel}"</p>
                      <div className="text-[10.5px] font-black text-warning pt-1">★ {app.rating} rating • {app.users} users</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] font-bold text-muted-foreground/80">
                  <span>Nhấn giữ để cài đặt</span>
                  <span className="material-symbols-outlined text-sm text-primary transform group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
