import React from "react";

export default function LibraryCatalog({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  libraryAppsList,
  downloadingAppId,
  installedApps,
  handleInstallApp,
  setSelectedUtility,
  gradients,
  onBack
}) {
  return (
    <div className="space-y-6">
      {/* Library Header */}
      <div className="flex items-center justify-between text-left border-b border-border/20 pb-3 gap-3">
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-foreground">Hugo Library</h2>
          <p className="text-[11px] text-muted-foreground/80 font-bold mt-0.5">Kho ứng dụng & tiện ích học tập</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-black uppercase border border-border/25 bg-card/75 text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại</span>
          </button>
        )}
      </div>
      {/* FEATURED BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-violet-500/10 to-transparent border border-border/40 rounded-[32px] p-6 md:p-8 text-left shadow-sm">
        <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
        
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest bg-primary/20 text-primary uppercase">
            <span className="material-symbols-outlined text-[12px] font-black">star</span>
            Ứng dụng nổi bật
          </span>
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              HugoPSY AI Trợ Lý Tâm Lý
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lắng nghe bạn 24/7. Trò chuyện, giải tỏa áp lực thi cử và phân tích cải thiện giấc ngủ hoàn toàn bảo mật bằng AI thông minh.
            </p>
          </div>
          <button
            onClick={() => setSelectedUtility("psychology")}
            className="px-5 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all"
          >
            Mở ứng dụng ngay
          </button>
        </div>

        <span className="material-symbols-outlined absolute right-6 bottom-[-20px] text-[160px] text-primary/10 select-none pointer-events-none transform rotate-12">
          psychology
        </span>
      </div>

      {/* Search Bar - High-End App Store Search design */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-4 text-muted-foreground/60 text-[20px] pointer-events-none">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tiện ích, ứng dụng học tập..."
          className="w-full h-12 pl-11 pr-10 rounded-2xl border border-border/40 bg-muted/30 focus:bg-background/90 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* Categories scroller - Apple Store style pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wide whitespace-nowrap transition-all active:scale-95 ${
                active
                  ? "bg-primary text-white shadow-md shadow-primary/15 border-transparent"
                  : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/20"
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog grid */}
      {libraryAppsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-card border border-border/40 rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/75">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div>
            <p className="text-sm font-black text-foreground uppercase tracking-wider">Không tìm thấy ứng dụng</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Vui lòng nhập từ khóa khác hoặc chọn mục khác.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {libraryAppsList.map((app) => {
            const gradient = gradients[app.tint] || gradients.indigo;
            const isInstalled = installedApps.includes(app.id);
            const isDownloading = downloadingAppId === app.id;

            return (
              <div
                key={app.id}
                className="flex items-center justify-between p-5 bg-card/45 backdrop-blur-md border border-border/30 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-16 h-16 rounded-[16px] shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md relative overflow-hidden`}>
                    <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                    <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1 text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-black text-foreground leading-snug truncate">
                        {app.title}
                      </h3>
                      {app.badge && (
                        <span className="px-2 py-0.5 text-[8px] font-black tracking-widest bg-muted border border-border/50 text-muted-foreground uppercase rounded-md leading-none select-none">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate leading-normal">
                      {app.subLabel}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground/80">
                      <span className="text-warning flex items-center font-black">★ {app.rating}</span>
                      <span>•</span>
                      <span>{app.users} active</span>
                    </div>
                  </div>
                </div>

                {/* Apple App Store premium solid buttons */}
                <div className="ml-3 shrink-0">
                  {isDownloading ? (
                    <div className="w-[72px] h-[32px] flex items-center justify-center bg-muted/60 rounded-full border border-border/10">
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : isInstalled ? (
                    <button
                      type="button"
                      onClick={() => setSelectedUtility(app.id)}
                      className="w-[72px] h-[32px] flex items-center justify-center rounded-full bg-primary text-white font-extrabold text-[11.5px] uppercase tracking-widest shadow-sm shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200"
                    >
                      Mở
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInstallApp(app.id)}
                      className="w-[72px] h-[32px] flex items-center justify-center rounded-full bg-muted hover:bg-primary text-primary hover:text-white font-extrabold text-[11.5px] uppercase tracking-widest active:scale-95 transition-all duration-200 shadow-sm"
                    >
                      Tải
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
