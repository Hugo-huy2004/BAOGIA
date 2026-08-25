import { useState } from "react";

export default function AddressMapPreview({ lat, lon, address, isVerified, onLocate, locating, isVietnamese }) {
  const [zoom, setZoom] = useState(15);
  const [mapTheme, setMapTheme] = useState("pink"); // pink | mint | lavender

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0);
  const defaultLat = hasCoords ? lat : 21.0285;
  const defaultLon = hasCoords ? lon : 105.8542;

  // Compute CartoDB tile coordinates
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((defaultLon + 180) / 360) * n);
  const latRad = (defaultLat * Math.PI) / 180;
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );

  const tiles = [
    { key: "tl", x: xtile - 1, y: ytile - 1 },
    { key: "tc", x: xtile, y: ytile - 1 },
    { key: "tr", x: xtile + 1, y: ytile - 1 },
    { key: "ml", x: xtile - 1, y: ytile },
    { key: "mc", x: xtile, y: ytile },
    { key: "mr", x: xtile + 1, y: ytile },
    { key: "bl", x: xtile - 1, y: ytile + 1 },
    { key: "bc", x: xtile, y: ytile + 1 },
    { key: "br", x: xtile + 1, y: ytile + 1 },
  ];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${defaultLat},${defaultLon}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${defaultLat}&mlon=${defaultLon}#map=${zoom}/${defaultLat}/${defaultLon}`;

  const themeFilters = {
    pink: "hue-rotate-[335deg] saturate-[1.4] brightness-[1.04] contrast-[0.92] sepia-[0.12]",
    mint: "hue-rotate-[110deg] saturate-[1.3] brightness-[1.02] contrast-[0.95]",
    lavender: "hue-rotate-[250deg] saturate-[1.35] brightness-[1.03] contrast-[0.93]",
  };

  const themePills = {
    pink: "bg-pink-100/90 text-pink-600 dark:bg-pink-950/80 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60",
    mint: "bg-emerald-100/90 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
    lavender: "bg-purple-100/90 text-purple-600 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
  };

  return (
    <div className="my-3 overflow-hidden rounded-[28px] p-[1.5px] bg-gradient-to-r from-pink-300 via-purple-300 to-rose-300 dark:from-pink-900/60 dark:via-purple-900/60 dark:to-rose-900/60 shadow-lg shadow-pink-500/10 select-none transition-all">
      <div className="rounded-[26.5px] bg-card/95 backdrop-blur-xl overflow-hidden">
        {/* Cute Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-pink-50/80 via-rose-50/50 to-purple-50/80 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-purple-950/40 border-b border-pink-100/60 dark:border-pink-900/30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-400/30 text-xs">
              🌸
            </div>
            <span className="text-[13px] font-black text-foreground tracking-tight truncate">
              {isVietnamese ? "Bản đồ cư trú pastel" : "Cute Pastel Map"}
            </span>

            {isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-300 text-[10.5px] font-extrabold border border-pink-200/60 dark:border-pink-800/40">
                <span>💖</span>
                {isVietnamese ? "Đã ghim GPS" : "GPS Verified"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10.5px] font-extrabold border border-amber-200/60 dark:border-amber-800/40">
                <span>✨</span>
                {isVietnamese ? "Chờ ghim" : "Unverified"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Cute theme selector */}
            <div className="flex items-center gap-1 p-0.5 rounded-2xl bg-background/80 border border-pink-200/60 dark:border-pink-900/40 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMapTheme("pink")}
                className={`px-2 py-0.5 rounded-xl transition-all ${mapTheme === "pink" ? "bg-pink-400 text-white shadow-xs font-black" : "text-muted-foreground hover:text-foreground"}`}
              >
                🌸 Đào
              </button>
              <button
                type="button"
                onClick={() => setMapTheme("mint")}
                className={`px-2 py-0.5 rounded-xl transition-all ${mapTheme === "mint" ? "bg-emerald-400 text-white shadow-xs font-black" : "text-muted-foreground hover:text-foreground"}`}
              >
                🍃 Bạc hà
              </button>
              <button
                type="button"
                onClick={() => setMapTheme("lavender")}
                className={`px-2 py-0.5 rounded-xl transition-all ${mapTheme === "lavender" ? "bg-purple-400 text-white shadow-xs font-black" : "text-muted-foreground hover:text-foreground"}`}
              >
                🔮 Oải hương
              </button>
            </div>

            {onLocate && (
              <button
                type="button"
                onClick={onLocate}
                disabled={locating}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-[11px] shadow-sm shadow-pink-500/25 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[13px] ${locating ? "animate-spin" : ""}`}>
                  {locating ? "sync" : "my_location"}
                </span>
                <span>{locating ? (isVietnamese ? "Đang định vị..." : "Locating...") : (isVietnamese ? "Định vị" : "GPS")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tile Map Container */}
        <div className="relative w-full h-[210px] bg-pink-50/50 dark:bg-slate-900 overflow-hidden">
          {/* 3x3 Tile Grid with Pastel Filter */}
          <div className={`absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none scale-125 transform origin-center transition-all duration-500 ${themeFilters[mapTheme]}`}>
            {tiles.map((t) => (
              <img
                key={`${t.x}-${t.y}`}
                src={`https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${t.x}/${t.y}.png`}
                alt="Cute Map Tile"
                className="w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
                onError={(e) => {
                  e.target.src = `https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`;
                }}
              />
            ))}
          </div>

          {/* Soft Pastel Mesh Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 via-transparent to-purple-500/10 pointer-events-none" />

          {/* Cute 3D Heart Pinpoint with Bounce Animation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative flex flex-col items-center animate-bounce">
              <span className="absolute -inset-4 rounded-full bg-pink-400/35 blur-md animate-ping" />
              <div className="w-10 h-10 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 text-white flex items-center justify-center shadow-xl shadow-pink-500/40 border-2 border-white dark:border-slate-900 z-10 transform rotate-45">
                <span className="transform -rotate-45 text-lg filter drop-shadow-xs">💖</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md mt-1 border border-white dark:border-slate-800" />
            </div>
          </div>

          {/* Cute Zoom & Reset Controls */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 1, 18))}
              className="w-8 h-8 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-pink-200/80 dark:border-pink-800/60 text-pink-600 dark:text-pink-300 flex items-center justify-center font-black text-[15px] shadow-sm hover:bg-pink-50 active:scale-95 transition-all"
              title="Phóng to"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 1, 10))}
              className="w-8 h-8 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-pink-200/80 dark:border-pink-800/60 text-pink-600 dark:text-pink-300 flex items-center justify-center font-black text-[15px] shadow-sm hover:bg-pink-50 active:scale-95 transition-all"
              title="Thu nhỏ"
            >
              -
            </button>
          </div>

          {/* Cute Coordinates & Links Pill */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-pink-200/80 dark:border-pink-800/60 shadow-md text-[11px] font-semibold text-foreground z-20">
            <span className="truncate flex items-center gap-1.5 min-w-0">
              <span className="text-sm">📍</span>
              <strong className={`truncate font-extrabold ${themePills[mapTheme]} px-2 py-0.5 rounded-xl border`}>
                {hasCoords ? `${defaultLat.toFixed(5)}, ${defaultLon.toFixed(5)}` : (address || "Việt Nam")}
              </strong>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 font-black hover:bg-pink-200 transition-colors text-[10.5px]"
              >
                Google Maps ↗
              </a>
              <a
                href={osmUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-black hover:bg-purple-200 transition-colors text-[10.5px]"
              >
                OSM ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
