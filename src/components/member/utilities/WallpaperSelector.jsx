import React from "react";

export default function WallpaperSelector({
  showWallpaperSelector,
  activeWallpaper,
  handleSetWallpaper,
  themes
}) {
  if (!showWallpaperSelector) return null;

  return (
    <div className="p-4 bg-card/65 backdrop-blur-md border border-border/60 rounded-[24px] space-y-3 text-left animate-slideUp">
      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Chọn hình nền cá nhân hóa:</span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleSetWallpaper(theme.id)}
            className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl border text-xs font-black transition-all ${
              activeWallpaper === theme.id
                ? "bg-primary/10 border-primary text-primary"
                : "bg-background/85 border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
}
