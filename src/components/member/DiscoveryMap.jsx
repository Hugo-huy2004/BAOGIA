import React, { useState, useEffect, useRef, useCallback } from "react";
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
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark"
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

  // Init: locate user + build map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pos = await getCachedGeolocation();
        if (cancelled) return;
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);

        // check-location is NOT called here — useLocationGuard already posts
        // it on mount + every 15 min, and extra calls reset the server's
        // "stayed in place" timer that powers geofence notifications.
        const isDark = document.documentElement.classList.contains("dark");
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: MAP_STYLES[isDark ? "dark" : "light"],
          center: [p.lng, p.lat],
          zoom: 15,
          attributionControl: { compact: true },
          // One finger scrolls the page, two fingers pan the map — stops the
          // map from fighting page scroll (and Chrome's touchmove warnings).
          cooperativeGestures: true,
          locale: {
            "CooperativeGesturesHandler.MobileHelpText": "Dùng 2 ngón tay để di chuyển bản đồ",
            "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và cuộn để thu phóng bản đồ",
            "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và cuộn để thu phóng bản đồ"
          }
        });
        mapRef.current = map;

        // Some OpenFreeMap styles reference sprite images that don't exist
        // (e.g. "wood-pattern") — feed a blank pixel to keep the console clean.
        map.on("styleimagemissing", (e) => {
          if (!map.hasImage(e.id)) {
            map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
          }
        });

        // Prefer Vietnamese labels (style defaults pick name:latin → English).
        // Only touch layers that already render a *name* — shield/ref layers
        // expect numbers and break if blanket-overridden.
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

        const userDot = document.createElement("div");
        userDot.className = "disc-user-dot";
        userMarkerRef.current = new maplibregl.Marker({ element: userDot })
          .setLngLat([p.lng, p.lat])
          .addTo(map);

        setLoading(false);

        // Progressive locate (Google-Maps style): show the fast cached fix
        // first, then silently upgrade to a high-accuracy GPS fix and shift
        // the map + reload places if it landed meaningfully elsewhere.
        getCachedGeolocation({ fresh: true })
          .then((fp) => {
            if (cancelled) return;
            const np = { lat: fp.coords.latitude, lng: fp.coords.longitude };
            if (metersBetween(p, np) > 75) {
              userMarkerRef.current?.setLngLat([np.lng, np.lat]);
              mapRef.current?.flyTo({ center: [np.lng, np.lat], zoom: 15 });
              setUserPos(np);
            }
          })
          .catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể xác định vị trí của bạn.");
          setLoading(false);
        }
      }
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
      // MapLibre positions the marker element via inline transform — the
      // scale effects live on an inner div so they never fight it.
      const el = document.createElement("div");
      const dot = document.createElement("div");
      dot.className = `disc-pin${p.openNow === false ? " disc-pin-closed" : ""}`;
      dot.dataset.pinId = p.id;
      el.appendChild(dot);
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
      const dot = m.getElement().firstChild;
      if (dot) dot.classList.toggle("disc-pin-active", dot.dataset.pinId === String(selectedId));
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
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapIcon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">Khám phá quanh bạn</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                {personalized
                  ? "Địa điểm thật, xếp theo gu của bạn"
                  : "Địa điểm thật theo thời gian thực"}
                {source === "google" ? " · dữ liệu Google" : source === "foursquare" ? " · dữ liệu Foursquare" : source === "osm" ? " · dữ liệu OpenStreetMap" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={fetching || !userPos}
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl border border-border bg-card hover:bg-foreground/[0.03] text-foreground transition-colors disabled:opacity-50"
            title="Làm mới gợi ý"
            aria-label="Làm mới gợi ý"
          >
            <RefreshCw className={`w-5 h-5 ${fetching ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>

        {/* Smart time-of-day suggestion */}
        {(() => {
          const s = smartSuggestion(new Date().getHours());
          const active = category === s.category && !query;
          return (
            <button
              onClick={() => { hapticSelect(); setQuery(""); setCategory(active ? "" : s.category); }}
              className={`mt-3 w-full flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-foreground/[0.02] hover:bg-foreground/[0.05]"
              }`}
            >
              <Clock className="w-[18px] h-[18px] text-primary shrink-0" aria-hidden="true" />
              <span className="text-[15px] font-medium text-foreground flex-1">{s.label}</span>
              <span className="text-[13px] font-semibold text-primary">{active ? "Đang xem" : "Xem ngay"}</span>
            </button>
          );
        })()}

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm quán ăn, cà phê, chỗ chơi…"
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-muted border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { hapticSelect(); setCategory(c.id); }}
              className={`min-h-[44px] px-4 rounded-xl text-[15px] font-medium border transition ${
                category === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
          <button
            onClick={() => { hapticSelect(); setOpenOnly((v) => !v); }}
            className={`min-h-[44px] px-4 rounded-xl text-[15px] font-medium border transition flex items-center gap-1.5 ${
              openOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            Đang mở
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mt-3">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => { hapticSelect(); setSort(s.id); }}
                className={`min-h-[36px] px-3.5 rounded-lg text-[14px] font-medium transition ${
                  sort === s.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Register your own venue */}
        <button
          onClick={() => { hapticSelect(); setShowAdd((v) => !v); }}
          className="mt-3 w-full min-h-[44px] rounded-2xl border border-dashed border-border text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] transition-colors"
        >
          {showAdd ? "Đóng biểu mẫu" : "Bạn có quán? Đăng lên bản đồ"}
        </button>

        {showAdd && (
          <div className="mt-3 rounded-2xl border border-border bg-foreground/[0.02] p-3.5 flex flex-col gap-2.5">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
              placeholder="Tên quán / dịch vụ *"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              {CATEGORIES.filter((c) => c.id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                  className={`flex-1 min-h-[40px] rounded-xl text-[14px] font-medium border transition ${
                    form.category === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border"
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
              placeholder="Dịch vụ cung cấp (vd: cà phê máy lạnh, học nhóm, in ấn…)"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              value={form.menu}
              onChange={(e) => setForm((f) => ({ ...f, menu: e.target.value }))}
              maxLength={1200}
              rows={3}
              placeholder={"Menu — mỗi dòng một món, vd:\nCà phê sữa - 25k\nTrà đào - 30k"}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              maxLength={160}
              placeholder="Địa chỉ"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                maxLength={20}
                placeholder="SĐT (tùy chọn)"
                className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                maxLength={200}
                placeholder="Website (tùy chọn)"
                className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl bg-card border border-border text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Vị trí quán được ghi theo GPS hiện tại của bạn — hãy đứng tại quán khi đăng để pin chính xác nhất.
            </p>
            <button
              onClick={submitPlace}
              disabled={submitting}
              className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground text-[15px] font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Đang đăng…" : "Đăng lên bản đồ"}
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div ref={containerRef} className="w-full h-[340px] sm:h-[400px] z-0" />
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[15px] text-muted-foreground">Đang xác định vị trí của bạn…</p>
          </div>
        )}
        {!loading && error && !places.length && (
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
        {!loading && userPos && (
          <button
            onClick={recenter}
            className="absolute bottom-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-card border border-border shadow-sm text-foreground hover:bg-muted transition"
            title="Về vị trí của tôi"
            aria-label="Về vị trí của tôi"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        )}
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
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--card));
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.25);
        }
        .disc-pin {
          width: 18px; height: 18px; border-radius: 50%;
          background: hsl(var(--foreground));
          border: 3px solid hsl(var(--card));
          box-shadow: 0 1px 4px hsl(var(--shadow) / 0.35);
          transition: transform 0.15s ease;
          cursor: pointer;
        }
        .disc-pin:hover { transform: scale(1.2); }
        .disc-pin-closed { opacity: 0.45; }
        .disc-pin-active {
          background: hsl(var(--primary));
          transform: scale(1.35);
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
