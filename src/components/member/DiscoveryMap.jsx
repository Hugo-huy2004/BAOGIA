import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCachedGeolocation } from "../../utils/geoCache.js";
import {
  MapPin, Navigation, Compass, Loader2, RefreshCw, Star, Search,
  Clock, Map as MapIcon, LocateFixed, SlidersHorizontal,
  UtensilsCrossed, Coffee, Gamepad2
} from "lucide-react";
import { hapticSelect } from "../../utils/haptics";
import { notify } from "../../lib/notify";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const CATEGORIES = [
  { id: "", label: "Tất cả" },
  { id: "food", label: "Ăn uống" },
  { id: "cafe", label: "Cà phê" },
  { id: "play", label: "Vui chơi" }
];

const SORTS = [
  { id: "smart", label: "Hợp gu" },
  { id: "near", label: "Gần nhất" },
  { id: "top", label: "Đánh giá cao" }
];

const CATEGORY_LABELS = { food: "Ăn uống", cafe: "Cà phê", play: "Vui chơi" };

// OpenFreeMap vector styles (free, unlimited, no key) — theme-matched
const MAP_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
};

const fmtDist = (m) =>
  m == null ? "" : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;

const metersBetween = (a, b) => {
  const R = 6371e3;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const CATEGORY_ICONS = { food: UtensilsCrossed, cafe: Coffee, play: Gamepad2 };

// Time-of-day smart suggestion (one-tap filter preset)
function smartSuggestion(hour) {
  if (hour >= 6 && hour < 11) return { label: "Cà phê sáng gần bạn", category: "cafe" };
  if (hour >= 11 && hour < 14) return { label: "Quán ăn trưa ngon", category: "food" };
  if (hour >= 14 && hour < 17) return { label: "Cà phê chill buổi xế", category: "cafe" };
  if (hour >= 17 && hour < 22) return { label: "Tối nay đi chơi đâu?", category: "play" };
  return { label: "Chỗ chơi khuya còn mở", category: "play" };
}

// Brand logo via server favicon proxy (returns 204 when the site has no
// favicon → onError → monochrome category icon; no 404 console noise).
function PlaceLogo({ place }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICONS[place.category] || MapPin;
  let domain = "";
  try {
    if (place.website) domain = new URL(place.website).hostname;
  } catch { /* invalid URL → icon fallback */ }

  if (!domain || failed) {
    return (
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted border border-border overflow-hidden">
      <img
        src={`${apiBase}/bios/discover/logo?domain=${encodeURIComponent(domain)}`}
        alt={`Logo ${place.name}`}
        width={28}
        height={28}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-7 h-7 object-contain"
      />
    </div>
  );
}

export default function DiscoveryMap() {
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [places, setPlaces] = useState([]);
  const [source, setSource] = useState("");
  const [personalized, setPersonalized] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("smart");
  const [openOnly, setOpenOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  
  const selectedPlace = useMemo(() => places.find((p) => p.id === selectedId), [places, selectedId]);
  const emptyForm = { name: "", category: "food", services: "", menu: "", address: "", phone: "", website: "" };
  const [form, setForm] = useState(emptyForm);

  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPlaces = useCallback(async (pos, opts) => {
    if (!pos) return;
    setFetching(true);
    setError("");
    try {
      const params = new URLSearchParams({
        lat: pos.lat,
        lng: pos.lng,
        category: opts.category,
        sort: opts.sort,
        q: opts.q,
        hour: new Date().getHours()
      });
      if (opts.openOnly) params.set("open", "1");
      const res = await fetch(`${apiBase}/bios/me/discover?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Không tải được địa điểm");
      const data = await res.json();
      setPlaces(data.places || []);
      setSource(data.source || "");
      setPersonalized(!!data.personalized);
    } catch (err) {
      setError(err.message);
      setPlaces([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const toggle3DMode = () => {
    const new3D = !is3DMode;
    setIs3DMode(new3D);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: new3D ? 60 : 0,
        bearing: new3D ? -20 : 0,
        duration: 800
      });
    }
  };

  // Route drawing helper
  const drawRoute = useCallback((map, user, target) => {
    if (!map || !user || !target) return;
    const sourceId = "route-line-source";
    const layerId = "route-line-layer";
    
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [user.lng, user.lat],
          [target.lng, target.lat]
        ]
      }
    };
    
    try {
      const existingSource = map.getSource(sourceId);
      if (existingSource) {
        existingSource.setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson
        });
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#6366f1",
            "line-width": 4,
            "line-dasharray": [2, 1.5]
          }
        });
      }
    } catch (e) {
      console.error("Error drawing route line:", e);
    }
  }, []);

  // Update route when selected place changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    const handleStyleLoad = () => {
      if (selectedPlace && userPos) {
        drawRoute(mapRef.current, userPos, selectedPlace);
      }
    };

    if (mapRef.current.isStyleLoaded()) {
      if (selectedPlace && userPos) {
        drawRoute(mapRef.current, userPos, selectedPlace);
      } else {
        const source = mapRef.current.getSource("route-line-source");
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: []
          });
        }
      }
    } else {
      mapRef.current.once("idle", handleStyleLoad);
    }
  }, [selectedPlace, userPos, drawRoute]);

  // Init: locate user + build map once (Non-blocking, load instantly)
  useEffect(() => {
    let cancelled = false;
    
    // 1. Set fallback/initial coordinates instantly to load the map without delay
    const initialPos = { lat: 10.7865, lng: 106.6661 };
    setUserPos(initialPos);

    if (!containerRef.current) {
      setError("Không tìm thấy phần tử hiển thị bản đồ.");
      setLoading(false);
      return;
    }

    // 2. Initialize the map instantly with default HCMC position, wrapped in try-catch to detect WebGL support issues
    const isDark = document.documentElement.classList.contains("dark");
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLES[isDark ? "dark" : "light"],
        center: [initialPos.lng, initialPos.lat],
        zoom: 15,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        locale: {
          "CooperativeGesturesHandler.MobileHelpText": "Dùng 2 ngón tay để di chuyển bản đồ",
          "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và cuộn để thu phóng bản đồ",
          "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và cuộn để thu phóng bản đồ"
        }
      });
      mapRef.current = map;
    } catch (mapInitErr) {
      console.error("MapLibre GL Map initialization failed (likely WebGL unsupported):", mapInitErr);
      setError("Thiết bị hoặc trình duyệt của bạn không hỗ trợ WebGL để hiển thị bản đồ.");
      setLoading(false);
      return;
    }

    // Force a resize shortly after initialization
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 200);

    // Feed blank pixel for missing images to avoid console noise
    map.on("styleimagemissing", (e) => {
      if (!map.hasImage(e.id)) {
        map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    // Prefer Vietnamese labels
    map.on("load", () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type !== "symbol") continue;
        const tf = map.getLayoutProperty(layer.id, "text-field");
        if (tf && JSON.stringify(tf).includes("name")) {
          map.setLayoutProperty(layer.id, "text-field", [
            "coalesce", ["get", "name:vi"], ["get", "name"]
          ]);
        }
      }
    });

    // Add user marker instantly
    const userDot = document.createElement("div");
    userDot.className = "disc-user-dot";
    userMarkerRef.current = new maplibregl.Marker({ element: userDot })
      .setLngLat([initialPos.lng, initialPos.lat])
      .addTo(map);

    setLoading(false);

    // 3. Request geolocation in background (non-blocking)
    (async () => {
      try {
        const pos = await getCachedGeolocation();
        if (cancelled) return;
        if (pos && pos.coords) {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(p);
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([p.lng, p.lat]);
          }
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [p.lng, p.lat], zoom: 15 });
          }
        }
      } catch (geoErr) {
        console.warn("Could not get user geolocation on load:", geoErr);
      }

      // Silent high-accuracy background update
      try {
        const fp = await getCachedGeolocation({ fresh: true });
        if (cancelled) return;
        if (fp && fp.coords) {
          const np = { lat: fp.coords.latitude, lng: fp.coords.longitude };
          if (metersBetween(initialPos, np) > 75) {
            setUserPos(np);
            if (userMarkerRef.current) {
              userMarkerRef.current.setLngLat([np.lng, np.lat]);
            }
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [np.lng, np.lat], zoom: 15 });
            }
          }
        }
      } catch (e) {}
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchPlaces(userPos, { category, sort, openOnly, q: debouncedQuery });
  }, [userPos, category, sort, openOnly, debouncedQuery, fetchPlaces]);

  // Sync markers with places (DOM markers; selection toggles a class only)
  useEffect(() => {
    if (!mapRef.current) return;
    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = places.map((p) => {
      const el = document.createElement("div");
      el.className = "custom-place-marker";
      el.dataset.pinId = p.id;
      if (p.id === selectedId) {
        el.className += " custom-place-marker-active";
      }

      const pinInner = document.createElement("div");
      const emoji = p.category === "food" ? "🍔" : p.category === "cafe" ? "☕️" : p.category === "play" ? "🎮" : "📍";
      const catColor = p.category === "food" ? "orange" : p.category === "cafe" ? "amber" : p.category === "play" ? "emerald" : "indigo";
      
      pinInner.className = `disc-pin-container ${catColor}-glow ${p.openNow === false ? "opacity-60" : ""}`;
      pinInner.innerHTML = `<span class="disc-pin-emoji">${emoji}</span>`;
      el.appendChild(pinInner);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        selectPlace(p, { scrollList: true });
      });
      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(mapRef.current);
    });

    // Google-Maps behaviour: zoom the map to fit you + the top results
    if (places.length && userPos) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPos.lng, userPos.lat]);
      places.slice(0, 10).forEach((p) => bounds.extend([p.lng, p.lat]));
      mapRef.current.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, userPos]);

  useEffect(() => {
    placeMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      if (el) {
        el.classList.toggle("custom-place-marker-active", el.dataset.pinId === String(selectedId));
      }
    });
  }, [selectedId, places]);

  const selectPlace = (p, { scrollList = false } = {}) => {
    hapticSelect();
    setSelectedId(p.id);
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 16 });
    if (scrollList) {
      const el = listRef.current?.querySelector(`[data-place-id="${CSS.escape(p.id)}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    // Learning signal — "Hợp gu" gets smarter with every tap (fire & forget)
    fetch(`${apiBase}/bios/me/discover/tap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: p.name, category: p.category })
    }).catch(() => {});
  };

  const recenter = () => {
    hapticSelect();
    if (mapRef.current && userPos) mapRef.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 15 });
  };

  const refetch = () => fetchPlaces(userPos, { category, sort, openOnly, q: debouncedQuery });

  const submitPlace = async () => {
    if (!form.name.trim()) return notify.error("Nhập tên quán trước nhé");
    if (!userPos) return notify.error("Chưa xác định được vị trí của bạn");
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/bios/me/discover/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, lat: userPos.lat, lng: userPos.lng })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Không đăng được địa điểm");
      notify.success("Đã đăng quán của bạn lên bản đồ Khám phá");
      setForm(emptyForm);
      setShowAdd(false);
      refetch();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePlace = async (p) => {
    const ok = await notify.confirm({
      title: "Xóa địa điểm?",
      message: `"${p.name}" sẽ biến mất khỏi bản đồ Khám phá.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      danger: true
    });
    if (!ok) return;
    try {
      const res = await fetch(`${apiBase}/bios/me/discover/places/${p.id.replace(/^cp-/, "")}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Không xóa được địa điểm");
      notify.success("Đã xóa địa điểm");
      refetch();
    } catch (err) {
      notify.error(err.message);
    }
  };

  // Refresh = fresh high-accuracy GPS fix + reload places from the new spot
  const refresh = async () => {
    hapticSelect();
    try {
      const pos = await getCachedGeolocation({ fresh: true });
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      userMarkerRef.current?.setLngLat([p.lng, p.lat]);
      mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 15 });
      setUserPos(p); // effect refetches places for the updated position
    } catch {
      fetchPlaces(userPos, { category, sort, openOnly, q: debouncedQuery });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* 🗺️ Main Map Hero Widget */}
      <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-md">
        
        {/* Map Canvas */}
        <div ref={containerRef} className="w-full h-[420px] sm:h-[480px] z-0" />
        
        {/* Glassmorphic floating Search & Categories card */}
        {!loading && !error && (
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 max-w-md bg-white/80 dark:bg-zinc-950/80 border border-white/20 dark:border-white/5 backdrop-blur-md p-2.5 rounded-2xl shadow-lg">
            
            {/* Search Input Bar */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm quán ăn, cà phê..."
                  className="w-full min-h-[38px] pl-9 pr-4 rounded-xl bg-muted/60 border border-border/20 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={refresh}
                disabled={fetching || !userPos}
                className="w-[38px] h-[38px] flex items-center justify-center rounded-xl border border-border/20 bg-muted/60 text-foreground hover:bg-muted/80 transition active:scale-95 disabled:opacity-50 shrink-0"
                title="Làm mới gợi ý"
              >
                <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin text-primary" : ""}`} />
              </button>
            </div>

            {/* Horizontal Scroll Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { hapticSelect(); setCategory(c.id); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition ${
                    category === c.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-foreground hover:bg-muted/80"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[15px] text-muted-foreground">Đang xác định vị trí của bạn…</p>
          </div>
        )}

        {/* Error Screen */}
        {!loading && error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card p-6 text-center gap-3">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-[15px] text-foreground font-medium">Không thể tải bản đồ khám phá</p>
            <p className="text-[14px] text-muted-foreground max-w-xs">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-[15px] font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ➕ Add Spot Overlay Form */}
        {showAdd && (
          <div className="absolute inset-4 z-30 bg-white/95 dark:bg-zinc-950/95 border border-white/20 dark:border-white/5 backdrop-blur-xl p-4 rounded-2xl shadow-2xl overflow-y-auto flex flex-col gap-3 text-left animate-slideUp">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_location_alt</span>
                Đăng quán lên bản đồ
              </h3>
              <button 
                onClick={() => setShowAdd(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={80}
                placeholder="Tên quán *"
                className="w-full min-h-[42px] px-3.5 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
              
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                {CATEGORIES.filter(c => c.id).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      form.category === c.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border hover:bg-muted/85"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <input
                value={form.services}
                onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                maxLength={300}
                placeholder="Dịch vụ cung cấp (vd: máy lạnh, học nhóm...)"
                className="w-full min-h-[42px] px-3.5 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
              
              <textarea
                value={form.menu}
                onChange={(e) => setForm((f) => ({ ...f, menu: e.target.value }))}
                maxLength={1200}
                rows={2}
                placeholder={"Menu (mỗi dòng một món, kèm giá nếu có)..."}
                className="w-full px-3.5 py-2 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground"
              />

              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                maxLength={160}
                placeholder="Địa chỉ quán *"
                className="w-full min-h-[42px] px-3.5 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />

              <div className="flex gap-2">
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  maxLength={20}
                  placeholder="SĐT (tùy chọn)"
                  className="flex-1 min-w-0 min-h-[42px] px-3.5 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
                <input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  maxLength={200}
                  placeholder="Website (tùy chọn)"
                  className="flex-1 min-w-0 min-h-[42px] px-3.5 rounded-xl bg-muted border border-border text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Vị trí được xác định theo tọa độ hiện tại của bạn. Bạn nên đứng tại quán khi đăng để ghim chính xác nhất.
            </p>

            <button
              onClick={submitPlace}
              disabled={submitting}
              className="w-full min-h-[42px] rounded-xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
              {submitting ? "Đang đăng..." : "Đăng lên bản đồ"}
            </button>
          </div>
        )}

        {/* 📱 iOS/Apple Maps style Slide-Up Detail Card */}
        {selectedPlace && !showAdd && (
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/90 dark:bg-zinc-950/90 border border-white/20 dark:border-white/5 backdrop-blur-xl p-4 rounded-2xl shadow-xl animate-slideUp text-left flex flex-col gap-2.5 max-h-[85%] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md uppercase tracking-wider">
                  {CATEGORY_LABELS[selectedPlace.category] || "Gợi ý"}
                </span>
                {selectedPlace.openNow === true && (
                  <span className="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md">Đang mở</span>
                )}
                {selectedPlace.openNow === false && (
                  <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">Đã đóng</span>
                )}
              </div>
              <button 
                onClick={() => setSelectedId(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-black text-foreground truncate">{selectedPlace.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                {selectedPlace.rating != null && (
                  <span className="flex items-center gap-0.5 text-foreground font-bold">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    {selectedPlace.rating}
                  </span>
                )}
                {selectedPlace.priceRange && <span>· {selectedPlace.priceRange}</span>}
                <span>· Cách bạn {fmtDist(selectedPlace.distM)}</span>
              </div>
            </div>

            {selectedPlace.services && (
              <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/20">
                {selectedPlace.services}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <a
                href={selectedPlace.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                Google Maps
              </a>
              <a
                href={`https://maps.apple.com/?daddr=${selectedPlace.lat},${selectedPlace.lng}&q=${encodeURIComponent(selectedPlace.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border text-foreground text-xs font-black uppercase tracking-wider hover:bg-muted active:scale-95 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                Apple Maps
              </a>
            </div>
          </div>
        )}

        {/* Floating Action Controls */}
        {!loading && userPos && (
          <div className={`absolute right-4 z-10 flex flex-col gap-2 transition-all duration-300 ${
            selectedPlace && !showAdd ? "bottom-[195px]" : "bottom-4"
          }`}>
            {/* Add Spot Button */}
            <button
              onClick={() => { hapticSelect(); setShowAdd(true); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-card border border-border shadow-md text-foreground hover:bg-muted transition active:scale-95"
              title="Đăng quán lên bản đồ"
              aria-label="Đăng quán lên bản đồ"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">add_location_alt</span>
            </button>

            {/* 3D/2D Mode Toggle Button */}
            <button
              onClick={toggle3DMode}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border shadow-md transition active:scale-95 font-black text-xs tracking-wider ${
                is3DMode
                  ? "bg-primary border-primary text-white"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
              title={is3DMode ? "Chuyển sang 2D" : "Chuyển sang 3D"}
              aria-label={is3DMode ? "Chuyển sang 2D" : "Chuyển sang 3D"}
            >
              {is3DMode ? "2D" : "3D"}
            </button>

            {/* Recenter Button */}
            <button
              onClick={recenter}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-card border border-border shadow-md text-foreground hover:bg-muted transition active:scale-95"
              title="Về vị trí của tôi"
              aria-label="Về vị trí của tôi"
            >
              <LocateFixed className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* 📋 Results and Filter Header */}
      <div className="flex flex-col gap-3.5 mt-2 pb-1 text-left">
        {/* Smart time-of-day suggestion banner */}
        {(() => {
          const s = smartSuggestion(new Date().getHours());
          const active = category === s.category && !query;
          return (
            <button
              onClick={() => { hapticSelect(); setQuery(""); setCategory(active ? "" : s.category); }}
              className={`w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold flex-1">{s.label}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{active ? "Đang xem" : "Xem ngay"}</span>
            </button>
          );
        })()}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
              <span className="grid h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Địa điểm quanh bạn
              <span className="text-xs text-muted-foreground font-normal">
                ({places.length} kết quả {source ? `· từ ${source.toUpperCase()}` : ""})
              </span>
            </h3>
          </div>
          
          {/* Sort & Status controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { hapticSelect(); setOpenOnly(!openOnly); }}
              className={`min-h-[32px] px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                openOnly
                  ? "bg-success/15 border-success/30 text-success"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Đang mở
            </button>
            
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/20">
              {[
                { id: "smart", label: "Hợp gu" },
                { id: "dist", label: "Gần nhất" },
                { id: "rating", label: "Đánh giá" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { hapticSelect(); setSort(opt.id); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    sort === opt.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results list */}
      <div ref={listRef} className="flex flex-col gap-3">
        {fetching && !places.length && (
          <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[15px]">Đang tìm địa điểm thật gần bạn…</span>
          </div>
        )}
        {!fetching && !places.length && !loading && !error && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-[15px] text-foreground font-medium">Chưa tìm thấy địa điểm phù hợp</p>
            <p className="text-[14px] text-muted-foreground mt-1">Thử đổi bộ lọc hoặc từ khóa khác nhé.</p>
          </div>
        )}
        {places.map((p) => {
          const active = p.id === selectedId;
          return (
            <div
              key={p.id}
              data-place-id={p.id}
              onClick={() => selectPlace(p)}
              className={`bg-card border rounded-2xl p-4 cursor-pointer transition shadow-sm ${
                active ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <PlaceLogo place={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                      {CATEGORY_LABELS[p.category] || "Gợi ý"}
                    </span>
                    {p.openNow === true && (
                      <span className="text-[13px] font-semibold text-success">Đang mở cửa</span>
                    )}
                    {p.openNow === false && (
                      <span className="text-[13px] font-semibold text-destructive">Đã đóng cửa</span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mt-0.5 truncate">{p.name}</h3>
                  {p.reasons?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {p.reasons.map((r) => (
                        <span key={r} className="text-[12px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[14px] text-muted-foreground flex-wrap">
                    {p.rating != null ? (
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Star className="w-4 h-4 text-primary" aria-hidden="true" />
                        {p.rating}
                        {p.ratingCount != null && (
                          <span className="text-muted-foreground font-normal">({p.ratingCount.toLocaleString("vi-VN")})</span>
                        )}
                      </span>
                    ) : (
                      <a
                        href={p.googleMapsUri}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary underline underline-offset-2"
                      >
                        Xem đánh giá trên Google
                      </a>
                    )}
                    {p.priceRange && <span>· {p.priceRange}</span>}
                    <span>· {fmtDist(p.distM)}</span>
                  </div>
                  {p.address && (
                    <p className="text-[14px] text-muted-foreground mt-1 truncate">{p.address}</p>
                  )}
                  {p.services && (
                    <p className="text-[14px] text-foreground mt-1.5">{p.services}</p>
                  )}
                  {p.menu && active && (
                    <div className="mt-2 bg-muted rounded-xl px-3 py-2">
                      <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Menu</p>
                      <p className="text-[14px] text-foreground whitespace-pre-line mt-1">{p.menu}</p>
                    </div>
                  )}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block text-[14px] text-primary underline underline-offset-2 mt-1"
                    >
                      {p.phone}
                    </a>
                  )}
                  {p.review && (
                    <p className="text-[14px] text-muted-foreground mt-2 line-clamp-2 bg-muted rounded-xl px-3 py-2">
                      “{p.review}”
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href={p.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-[15px] font-medium hover:opacity-90 transition"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" />
                  Google Maps
                </a>
                <a
                  href={`https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border text-foreground text-[15px] font-medium hover:bg-muted transition"
                >
                  <Compass className="w-4 h-4" aria-hidden="true" />
                  Apple Maps
                </a>
                {p.mine && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlace(p); }}
                    className="min-h-[44px] px-4 rounded-xl border border-destructive/40 text-destructive text-[15px] font-medium hover:bg-destructive/10 transition"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .disc-user-dot {
          width: 16px; height: 16px; border-radius: 50%;
          background: #3b82f6;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.5);
          animation: userPulse 2s infinite ease-in-out;
        }
        @keyframes userPulse {
          0% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.4), 0 0 15px rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), 0 0 15px rgba(59, 130, 246, 0.2); }
          100% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0), 0 0 15px rgba(59, 130, 246, 0); }
        }
        .custom-place-marker {
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          will-change: transform;
        }
        .custom-place-marker:hover {
          transform: scale(1.25) translateY(-2px);
          z-index: 100;
        }
        .disc-pin-container {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transition: all 0.25s ease;
        }
        .dark .disc-pin-container {
          background: rgba(39, 39, 42, 0.9);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .disc-pin-emoji {
          font-size: 18px;
          z-index: 2;
          transform: translateY(-0.5px);
        }
        /* Neon Category Glows */
        .orange-glow { box-shadow: 0 0 10px rgba(249, 115, 22, 0.45), inset 0 0 4px rgba(249, 115, 22, 0.2); }
        .amber-glow { box-shadow: 0 0 10px rgba(245, 158, 11, 0.45), inset 0 0 4px rgba(245, 158, 11, 0.2); }
        .emerald-glow { box-shadow: 0 0 10px rgba(16, 185, 129, 0.45), inset 0 0 4px rgba(16, 185, 129, 0.2); }
        .indigo-glow { box-shadow: 0 0 10px rgba(99, 102, 241, 0.45), inset 0 0 4px rgba(99, 102, 241, 0.2); }

        .custom-place-marker-active .disc-pin-container {
          background: #ffffff;
          transform: scale(1.15);
          border-color: #6366f1;
          box-shadow: 0 0 15px 4px rgba(99, 102, 241, 0.6);
        }
        .dark .custom-place-marker-active .disc-pin-container {
          background: #18181b;
          border-color: #818cf8;
          box-shadow: 0 0 20px 5px rgba(129, 140, 248, 0.6);
        }

        .maplibregl-map { font: inherit; background: hsl(var(--muted)); }
        .maplibregl-ctrl-attrib {
          background: hsl(var(--card) / 0.85) !important;
          color: hsl(var(--muted-foreground)) !important;
          font-size: 10px !important;
        }
        .maplibregl-ctrl-attrib a { color: hsl(var(--muted-foreground)) !important; }
      `}</style>
    </div>
  );
}
