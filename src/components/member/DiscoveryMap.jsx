import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCachedGeolocation } from "../../utils/geoCache.js";
import { Navigation, Compass, Star, Search,
  Clock, LocateFixed,
  UtensilsCrossed, Coffee, Gamepad2, X, Sparkles
} from "lucide-react";
import BackButton from "./shared/BackButton";
import { hapticSelect } from "../../utils/haptics";
import { notify } from "../../lib/notify";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const CATEGORIES = [
  { id: "", labelKey: "all" },
  { id: "food", labelKey: "food" },
  { id: "cafe", labelKey: "cafe" },
  { id: "play", labelKey: "play" }
];

const MAP_STYLES = {
  // Voyager có màu (công viên xanh, nước xanh dương, đường vàng) — Positron
  // gần như xám trắng nên không ra được chất Zenly.
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
};

// Zenly gợi món ăn bằng hình vẽ vui, không phải icon line đơn sắc. Tên quán ở
// VN mô tả món rất rõ ("Phở", "Bún bò", "Trà sữa"…) nên đoán từ tên là đủ —
// không cần thêm trường mới từ API.
const FOOD_GLYPHS = [
  [/tr[àa]\s*s[ữu]a|milk\s?tea|bubble\s?tea|gong\s?cha|koi(?![\p{L}])|toco/iu, "🧋"],
  [/ph[ởo](?![\p{L}])/iu, "🍜"],
  [/b[áa]nh m[ìi]|sandwich|baguette/iu, "🥖"],
  [/b[úu]n|m[ìi](?![\p{L}])|noodle|ramen|udon|h[ủu] ti[ếe]u/iu, "🍜"],
  [/l[ẩa]u|hot\s?pot/iu, "🍲"],
  [/pizza/iu, "🍕"],
  [/burger|hamburger|mcdonald/iu, "🍔"],
  [/sushi|sashimi|nh[ậa]t b[ảa]n|japanese/iu, "🍣"],
  [/g[àa] r[áa]n|chicken|kfc|lotteria|jollibee|popeyes/iu, "🍗"],
  [/n[ưu][ớo]ng|bbq|grill|nh[ậa]u|bia(?![\p{L}])|beer/iu, "🍢"],
  [/h[ảa]i s[ảa]n|seafood|[ốo]c(?![\p{L}])|cua(?![\p{L}])|t[ôo]m(?![\p{L}])/iu, "🦐"],
  [/ch[àa]y|vegan|vegetarian/iu, "🥗"],
  [/kem(?![\p{L}])|ice\s?cream|ch[èe](?![\p{L}])/iu, "🍦"],
  [/b[áa]nh ng[ọo]t|bakery|cake|ti[ệe]m b[áa]nh/iu, "🍰"],
  [/b[òo](?![\p{L}])|steak|beef/iu, "🥩"],
  [/c[ơo]m(?![\p{L}])|rice|ni[êe]u/iu, "🍚"],
  [/sinh t[ốo]|n[ưu][ớo]c [ée]p|juice|smoothie/iu, "🥤"],
];

const CATEGORY_FALLBACK_GLYPH = { food: "🍽️", cafe: "☕", play: "🎮" };

// `\b` của JS là ranh giới ASCII: sau "ở" hay "è" nó KHÔNG khớp, nên các luật
// tiếng Việt phải dùng lookahead Unicode `(?![\p{L}])` thay cho `\b`.
export const placeGlyph = (name, category) => {
  const label = String(name || "");
  if (category === "food" || category === "cafe") {
    for (const [re, glyph] of FOOD_GLYPHS) if (re.test(label)) return glyph;
  }
  return CATEGORY_FALLBACK_GLYPH[category] || "📍";
};

const CATEGORY_ICONS = {
  "": Compass,
  food: UtensilsCrossed,
  cafe: Coffee,
  play: Gamepad2
};

const fmtDist = (m) =>
  m == null ? "" : m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;

const translateStep = (step, t) => {
  if (!step || !step.maneuver) return t("memberPortal.discovery.directions.continue");
  const m = step.maneuver;
  const type = m.type || "";
  const modifier = m.modifier || "";
  const streetName = step.name || "";
  const street = streetName ? t("memberPortal.discovery.directions.onto", { street: streetName }) : "";
  const distStr = step.distance > 0 ? t("memberPortal.discovery.directions.distance", { distance: Math.round(step.distance) }) : "";

  if (type === "depart") return t("memberPortal.discovery.directions.depart", { street, distance: distStr });
  if (type === "arrive") return t("memberPortal.discovery.directions.arrive");

  let action = t("memberPortal.discovery.directions.continue");
  if (type === "turn") {
    if (modifier.includes("left")) action = t("memberPortal.discovery.directions.turnLeft");
    else if (modifier.includes("right")) action = t("memberPortal.discovery.directions.turnRight");
    else action = t("memberPortal.discovery.directions.turn");
  } else if (type === "continue") {
    action = t("memberPortal.discovery.directions.straight");
  }

  return `${action} ${street}`.trim() + distStr;
};

const getMatchScore = (placeId) => {
  let hash = 0;
  const str = String(placeId || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 85 + (Math.abs(hash) % 15);
};

export default function DiscoveryMap({ userAvatarUrl, userName, onExit }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [places, setPlaces] = useState([]);
  const [mapFeatures, setMapFeatures] = useState([]);
  const [viewportRevision, setViewportRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showSteps, setShowSteps] = useState(false);

  const selectedPlace = useMemo(() => places.find((p) => p.id === selectedId), [places, selectedId]);
  const emptyForm = { name: "", category: "food", services: "", menu: "", address: "", phone: "", website: "" };
  const [form, setForm] = useState(emptyForm);

  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placeMarkersRef = useRef([]);
  // Canh khung tự động chỉ một lần: sau đó người dùng tự làm chủ camera.
  const didAutoFitRef = useRef(false);
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
        sort: "smart",
        q: opts.q,
        hour: new Date().getHours()
      });
      const map = mapRef.current;
      if (map) {
        const bounds = map.getBounds();
        params.set("bbox", [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ].join(","));
        params.set("zoom", String(Math.round(map.getZoom())));
      }
      if (opts.openOnly) params.set("open", "1");
      const res = await fetch(`${apiBase}/bios/me/discover?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || t("memberPortal.discovery.loadError"));
      const data = await res.json();
      setPlaces(data.places || []);
      setMapFeatures(data.mapFeatures || data.places || []);
      localStorage.setItem("hugo_discover_places_cache", JSON.stringify({
        places: data.places || [],
        mapFeatures: data.mapFeatures || data.places || [],
        cachedAt: Date.now(),
      }));
    } catch (err) {
      console.warn("Fetch places failed, loading cache:", err);
      try {
        const cached = localStorage.getItem("hugo_discover_places_cache");
        if (cached) {
          const cachedData = JSON.parse(cached);
          setPlaces(cachedData.places || []);
          setMapFeatures(cachedData.mapFeatures || cachedData.places || []);
        } else {
          setError(err.message);
          setPlaces([]);
        }
      } catch (_) {
        setPlaces([]);
      }
    } finally {
      setFetching(false);
    }
  }, [t]);

  const toggle3DMode = () => {
    hapticSelect();
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

  const drawRoute = useCallback(async (map, user, target) => {
    if (!map || !user || !target) return;
    const sourceId = "route-line-source";
    const layerId = "route-line-layer";

    let coordinates = [
      [user.lng, user.lat],
      [target.lng, target.lat]
    ];
    let routeDetails = null;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${user.lng},${user.lat};${target.lng},${target.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.routes && data.routes[0]) {
          coordinates = data.routes[0].geometry.coordinates;
          const r = data.routes[0];
          routeDetails = {
            distance: r.distance,
            duration: r.duration * 1.15,
            steps: r.legs && r.legs[0] && r.legs[0].steps
              ? r.legs[0].steps.map((step) => translateStep(step, t))
              : []
          };
        }
      }
    } catch (_) {}

    setRouteInfo(routeDetails);

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { color: "#007aff" },
          geometry: { type: "LineString", coordinates }
        }
      ]
    };

    try {
      const existingSource = map.getSource(sourceId);
      if (existingSource) {
        existingSource.setData(geojson);
      } else {
        map.addSource(sourceId, { type: "geojson", data: geojson });
        map.addLayer({
          id: layerId + "-casing",
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#a855f7", "line-width": 8, "line-opacity": 0.3 }
        });
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#c084fc", "line-width": 4.5, "line-opacity": 0.95 }
        });
      }
    } catch (_) {}
  }, [t]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedPlace && userPos) {
      drawRoute(mapRef.current, userPos, selectedPlace);
    } else {
      setRouteInfo(null);
      setShowSteps(false);
      const source = mapRef.current.getSource("route-line-source");
      if (source) {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }, [selectedPlace, userPos, drawRoute]);

  // Init map with pastel mesh style
  useEffect(() => {
    let cancelled = false;
    const initialPos = { lat: 10.7865, lng: 106.6661 };
    setUserPos(initialPos);

    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    let map;
    let viewportTimer;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLES[isDark ? "dark" : "light"],
        center: [initialPos.lng, initialPos.lat],
        zoom: 15.2,
        attributionControl: false,
        cooperativeGestures: true
      });
      mapRef.current = map;
      map.on("moveend", () => {
        window.clearTimeout(viewportTimer);
        viewportTimer = window.setTimeout(
          () => setViewportRevision((value) => value + 1),
          180,
        );
      });
    } catch (_) {
      setError(t("memberPortal.discovery.webglError"));
      setLoading(false);
      return;
    }

    setTimeout(() => mapRef.current?.resize(), 200);

    // Zenly User Avatar Pin Marker
    const initials = (userName || "Ban").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ME";
    const userDot = document.createElement("div");
    userDot.className = "zenly-user-avatar-marker";
    userDot.innerHTML = `
      <div class="zenly-user-avatar-pin">
        <div class="zenly-avatar-glow-ring"></div>
        <div class="zenly-avatar-bubble">
          ${userAvatarUrl ? `<img src="${userAvatarUrl}" class="zenly-avatar-img" alt="User Avatar" />` : `<span class="zenly-avatar-initials">${initials}</span>`}
          <span class="zenly-live-dot"></span>
        </div>
        <div class="zenly-avatar-pointer"></div>
      </div>
    `;
    userMarkerRef.current = new maplibregl.Marker({ element: userDot })
      .setLngLat([initialPos.lng, initialPos.lat])
      .addTo(map);

    setLoading(false);

    (async () => {
      try {
        const pos = await getCachedGeolocation();
        if (cancelled) return;
        if (pos && pos.coords) {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(p);
          userMarkerRef.current?.setLngLat([p.lng, p.lat]);
          mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 15.5 });
        }
      } catch (_) {}
    })();

    return () => {
      cancelled = true;
      placeMarkersRef.current.forEach((m) => m.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      window.clearTimeout(viewportTimer);
    };
  }, [t]);

  useEffect(() => {
    fetchPlaces(userPos, { category, sort: "smart", openOnly, q: debouncedQuery });
  }, [userPos, category, openOnly, debouncedQuery, viewportRevision, fetchPlaces]);

  // Render Zenly Markers on Map (Clicking marker opens bottom sheet)
  useEffect(() => {
    if (!mapRef.current) return;
    placeMarkersRef.current.forEach((m) => m.remove());

    const visibleFeatures = mapFeatures.length ? mapFeatures : places;
    placeMarkersRef.current = visibleFeatures.map((p) => {
      const el = document.createElement("div");
      el.className = `zenly-place-pin ${p.id === selectedId ? "zenly-pin-active" : ""} ${p.cluster ? "zenly-cluster-pin" : ""}`;
      el.dataset.pinId = p.id;

      const svg = p.cluster
        ? `<span class="zenly-cluster-count">${p.pointCount}</span>`
        : `<span class="zenly-pin-glyph">${placeGlyph(p.name, p.category)}</span>`;
      const catBg = p.cluster
        ? "zenly-pin-cluster"
        : p.category === "food"
          ? "zenly-pin-food"
          : p.category === "cafe"
            ? "zenly-pin-cafe"
            : "zenly-pin-play";

      el.innerHTML = `
        <div class="zenly-pin-bubble ${catBg}">
          ${svg}
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hapticSelect();
        if (p.cluster) {
          if (Array.isArray(p.bounds) && p.bounds.length === 4) {
            mapRef.current?.fitBounds(
              [[p.bounds[0], p.bounds[1]], [p.bounds[2], p.bounds[3]]],
              { padding: 72, maxZoom: 17, duration: 420 },
            );
          } else {
            mapRef.current?.flyTo({
              center: [p.lng, p.lat],
              zoom: Math.min((mapRef.current?.getZoom() || 13) + 2, 17),
            });
          }
          return;
        }
        setSelectedId(p.id);
        mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 16.5 });
      });

      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(mapRef.current);
    });

    if (!didAutoFitRef.current && places.length && userPos && !selectedId) {
      didAutoFitRef.current = true;
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userPos.lng, userPos.lat]);
      places.slice(0, 8).forEach((p) => bounds.extend([p.lng, p.lat]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 600 });
    }
  }, [places, mapFeatures, userPos, selectedId]);

  const recenter = () => {
    hapticSelect();
    if (mapRef.current && userPos) mapRef.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 15.5 });
  };

  const submitPlace = async () => {
    if (!form.name.trim()) return notify.error(t("memberPortal.discovery.nameRequired"));
    if (!userPos) return notify.error(t("memberPortal.discovery.locationRequired"));
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/bios/me/discover/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, lat: userPos.lat, lng: userPos.lng })
      });
      if (!res.ok) throw new Error(t("memberPortal.discovery.submitError"));
      notify.success(t("memberPortal.discovery.submitSuccess"));
      setForm(emptyForm);
      setShowAdd(false);
      fetchPlaces(userPos, { category, openOnly, q: debouncedQuery });
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicLocationTitle = useMemo(() => {
    if (places.length > 0) {
      for (const p of places) {
        if (p.address) {
          const parts = p.address.split(",");
          if (parts.length >= 2) {
            const locName = parts[parts.length - 2].trim().toLowerCase();
            if (locName && locName.length < 22 && !locName.includes("phường") && !locName.includes("đường")) {
              return locName;
            }
          }
        }
      }
    }
    return t("memberPortal.discovery.discover");
  }, [places, t]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden font-sans select-none text-left">
      {/* ── 1. MAP CANVAS ─────────────────────────────────────────────────── */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* ── 2. APPLE FLOATING GLASS OVERLAY (TOP) ─────────────────────────── */}
      {/* Bản đồ chạy toàn màn hình nên thanh nổi này phải tự tránh tai thỏ /
          Dynamic Island — max() để không cộng dồn khi máy không có khuyết. */}
      <div
        className="absolute left-3 right-3 z-20 flex flex-col gap-2.5 pointer-events-none"
        style={{ top: "calc(max(env(safe-area-inset-top, 0px), 12px))" }}
      >

        {/* Row 1: Header Title & Action Capsule Buttons */}
        <div className="flex items-center justify-between gap-2">
          {/* Lối thoát duy nhất về trang Ứng dụng */}
          {onExit && (
            <div className="pointer-events-auto rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm">
              <BackButton onClick={onExit} label={t("memberPortal.discovery.exit", "Thoát")} iconOnly />
            </div>
          )}

          {/* Title Glass Capsule */}
          <div className="pointer-events-auto min-w-0 flex-1 px-3.5 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight capitalize truncate">
              {dynamicLocationTitle}
            </h1>
            <span className="h-3 w-px bg-border/60"></span>

          </div>

          {/* Action Buttons Capsule */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-full shadow-sm">
            <button
              onClick={toggle3DMode}
              className="px-2.5 h-8 rounded-full bg-muted/70 text-foreground font-semibold text-xs active:scale-95 transition-all"
              title={t("memberPortal.discovery.toggle3d")}
            >
              {is3DMode ? "2D" : "3D"}
            </button>

            <button
              onClick={recenter}
              className="w-8 h-8 rounded-full bg-muted/70 text-foreground flex items-center justify-center active:scale-95 transition-all"
              title={t("memberPortal.discovery.recenter")}
            >
              <LocateFixed className="w-4 h-4 text-foreground" />
            </button>

            <button
              onClick={() => setShowAdd(true)}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-all"
              title={t("memberPortal.discovery.addPlace")}
            >
              <span className="material-symbols-outlined text-lg">add_location_alt</span>
            </button>
          </div>
        </div>

        {/* Row 2: Liquid Glass Search Bar Capsule */}
        <div className="pointer-events-auto relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("memberPortal.discovery.searchPlaceholder")}
            className="w-full h-11 pl-10 pr-9 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none focus:border-primary/40 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Row 3: Floating Category Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id] || Compass;
            return (
              <button
                key={c.id}
                onClick={() => { hapticSelect(); setCategory(c.id); }}
                className={`h-9 px-4 rounded-full text-[13px] font-medium transition-all shrink-0 flex items-center gap-1.5 border shadow-sm backdrop-blur-xl ${
                  category === c.id
                    ? "bg-primary border-primary text-white"
                    : "bg-card/80 border-border/50 text-foreground hover:bg-card"
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t(`memberPortal.discovery.categories.${c.labelKey}`)}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ── 3. APPLE ZENLY SLIDE-UP DETAIL SHEET (ON MARKER TAP ONLY) ───────── */}
      {selectedPlace && (
        <div className="absolute bottom-4 left-3 right-3 z-30 bg-card/95 backdrop-blur-2xl border border-border/60 p-4 rounded-3xl shadow-2xl text-foreground animate-slideUp space-y-3 max-h-[60%] overflow-y-auto">
          {/* Grabber */}
          <div className="w-9 h-1 bg-muted rounded-full mx-auto" />

          {/* Top Bar: Category + Match % + Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                {t(`memberPortal.discovery.categories.${selectedPlace.category}`, t("memberPortal.discovery.destination"))}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t("memberPortal.discovery.match", { score: getMatchScore(selectedPlace.id) })}
              </span>
            </div>

            <button
              onClick={() => setSelectedId(null)}
              className="w-7 h-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Place Name & Subtitle */}
          <div>
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {selectedPlace.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {selectedPlace.rating != null && (
                <span className="flex items-center gap-1 font-medium text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {selectedPlace.rating}
                </span>
              )}
              <span>· {t("memberPortal.discovery.away", { distance: fmtDist(selectedPlace.distM) })}</span>
              {selectedPlace.openNow === true && <span className="text-emerald-600 dark:text-emerald-400 font-medium">· {t("memberPortal.discovery.openNow")}</span>}
            </div>
          </div>

          {selectedPlace.services && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-xl leading-relaxed">
              {selectedPlace.services}
            </p>
          )}

          {/* Route info */}
          {routeInfo && (
            <div className="p-3 bg-primary/8 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-sm font-medium text-primary">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {t("memberPortal.discovery.routeSummary", { minutes: Math.ceil(routeInfo.duration / 60), distance: fmtDist(routeInfo.distance) })}
                </span>
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="text-[13px] font-medium hover:underline"
                >
                  {showSteps ? t("memberPortal.discovery.hideDirections") : t("memberPortal.discovery.showDirections")}
                </button>
              </div>

              {showSteps && routeInfo.steps?.length > 0 && (
                <div className="space-y-1 pt-1 text-[13px] text-muted-foreground max-h-24 overflow-y-auto scrollbar-hide">
                  {routeInfo.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-0.5">
            <a
              href={selectedPlace.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold text-sm text-center hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>{t("memberPortal.discovery.navigate")}</span>
            </a>

            <a
              href={`https://maps.apple.com/?daddr=${selectedPlace.lat},${selectedPlace.lng}&q=${encodeURIComponent(selectedPlace.name)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 rounded-2xl bg-muted hover:bg-muted/70 text-foreground font-semibold text-sm text-center active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Apple Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* ── 4. ADD SPOT MODAL SHEET ────────────────────────────────────────── */}
      {showAdd && (
        <div className="absolute inset-4 z-40 bg-card/95 backdrop-blur-2xl border border-border/60 p-5 rounded-3xl shadow-2xl text-foreground animate-slideUp space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-lg font-semibold text-foreground">{t("memberPortal.discovery.addPlace")}</h3>
            <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground active:scale-95 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("memberPortal.discovery.form.name")}
              className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:bg-background transition-all"
            />
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder={t("memberPortal.discovery.form.address")}
              className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:bg-background transition-all"
            />
            <input
              value={form.services}
              onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
              placeholder={t("memberPortal.discovery.form.services")}
              className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 focus:bg-background transition-all"
            />
          </div>

          <button
            onClick={submitPlace}
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? t("memberPortal.discovery.form.submitting") : t("memberPortal.discovery.form.submit")}
          </button>
        </div>
      )}

      {/* ── 5. ZENLY & LIQUID GLASS MAP STYLES ─────────────────────────────── */}
      <style>{`
        .zenly-user-avatar-marker {
          cursor: pointer;
          position: relative;
        }
        .zenly-user-avatar-pin {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .zenly-avatar-glow-ring {
          position: absolute;
          top: -4px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(244, 63, 94, 0.25) 60%, rgba(0, 0, 0, 0) 100%);
          animation: zenlyGlowPulse 2.5s infinite ease-in-out;
        }
        @keyframes zenlyGlowPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.95; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .zenly-avatar-bubble {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          border: 3px solid #ffffff;
          box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 2;
        }
        .zenly-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .zenly-avatar-initials {
          color: #ffffff;
          font-weight: 900;
          font-size: 15px;
        }
        .zenly-live-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #ffffff;
          box-shadow: 0 0 6px #10b981;
        }
        .zenly-avatar-pointer {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #ffffff;
          margin-top: -2px;
          z-index: 2;
        }
        .zenly-place-pin {
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .zenly-place-pin:hover {
          transform: scale(1.25) translateY(-4px);
          z-index: 100;
        }
        .zenly-pin-bubble {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
        }
        /* Đuôi nhọn kiểu bong bóng Zenly */
        .zenly-pin-bubble::after {
          content: "";
          position: absolute;
          bottom: -7px;
          left: 50%;
          width: 12px;
          height: 12px;
          background: inherit;
          border-right: 3px solid #ffffff;
          border-bottom: 3px solid #ffffff;
          border-radius: 0 0 4px 0;
          transform: translateX(-50%) rotate(45deg);
          z-index: -1;
        }
        .zenly-pin-glyph {
          font-size: 20px;
          line-height: 1;
          /* emoji tự có màu — bỏ mọi filter kế thừa để giữ đúng sắc */
          filter: none;
        }
        .zenly-pin-food { background: #ff5a5f; }
        .zenly-pin-cafe { background: #ffb020; }
        .zenly-pin-play { background: #7b61ff; }
        .zenly-pin-cluster {
          background: hsl(var(--primary));
          border-radius: 999px;
        }
        .zenly-cluster-count {
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
        }
        .zenly-pin-active .zenly-pin-bubble {
          transform: scale(1.28);
          box-shadow: 0 0 0 5px rgba(255, 255, 255, .55), 0 10px 24px rgba(0, 0, 0, .3);
        }
        /* Nền bản đồ rực lên cho hợp chất Zenly — chỉ tác động lớp canvas,
           marker là DOM riêng nên emoji không bị đổi màu. */
        .maplibregl-canvas { filter: saturate(1.35) contrast(1.03); }
        :root.dark .maplibregl-canvas { filter: saturate(1.2) brightness(1.06); }
      `}</style>
    </div>
  );
}
