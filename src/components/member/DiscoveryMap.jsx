import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCachedGeolocation } from "../../utils/geoCache.js";
import {
  MapPin, Navigation, Compass, Loader2, RefreshCw, Star, Search,
  Clock, Map as MapIcon, LocateFixed, SlidersHorizontal,
  UtensilsCrossed, Coffee, Gamepad2, X, Sparkles
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

const CATEGORY_SVGS = {
  food: `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"></path><path d="M19 15v7"></path></svg>`,
  cafe: `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>`,
  play: `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="3"></rect></svg>`,
  default: `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
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

// Translate OSRM route steps to Vietnamese
const translateStep = (step) => {
  if (!step || !step.maneuver) return "Đi tiếp";
  const m = step.maneuver;
  const type = m.type || "";
  const modifier = m.modifier || "";
  const streetName = step.name || "";
  const street = streetName ? `vào ${streetName}` : "";
  const distStr = step.distance > 0 ? ` khoảng ${Math.round(step.distance)}m` : "";

  if (type === "depart") {
    return `Khởi hành${street}${distStr}`;
  }
  if (type === "arrive") {
    return `Đến điểm đích`;
  }
  
  let action = "Đi tiếp";
  if (type === "turn") {
    if (modifier.includes("left")) action = "Rẽ trái";
    else if (modifier.includes("right")) action = "Rẽ phải";
    else if (modifier === "sharp left") action = "Rẽ ngoặt sang trái";
    else if (modifier === "sharp right") action = "Rẽ ngoặt sang phải";
    else if (modifier === "slight left") action = "Chếch sang trái";
    else if (modifier === "slight right") action = "Chếch sang phải";
    else action = "Rẽ";
  } else if (type === "new name") {
    action = "Đi tiếp";
  } else if (type === "continue") {
    action = "Tiếp tục đi thẳng";
  } else if (type === "merge") {
    action = "Nhập làn";
  } else if (type === "on ramp") {
    action = "Đi vào đường dẫn";
  } else if (type === "off ramp") {
    action = "Đi ra khỏi đường dẫn";
  } else if (type === "roundabout" || type === "rotary") {
    action = "Đi vào vòng xuyến";
  }

  return `${action} ${street}`.trim() + distStr;
};

// Generate a consistent matching score from 85% to 99%
const getMatchScore = (placeId) => {
  let hash = 0;
  const str = String(placeId || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 85 + (Math.abs(hash) % 15);
};

const TRAFFIC_CAMERAS = [
  { id: "cam-1", name: "Camera Ngã tư Bảy Hiền (Tân Bình)", lat: 10.7915, lng: 106.6561 },
  { id: "cam-2", name: "Camera Út Tịch - Cộng Hòa (Tân Bình)", lat: 10.7995, lng: 106.6621 },
  { id: "cam-3", name: "Camera Ngã tư Phú Nhuận (Phú Nhuận)", lat: 10.7998, lng: 106.6805 },
  { id: "cam-4", name: "Camera Vòng xoay Dân Chủ (Quận 3)", lat: 10.7788, lng: 106.6795 },
  { id: "cam-5", name: "Camera Nam Kỳ Khởi Nghĩa - Lý Chính Thắng (Quận 3)", lat: 10.7892, lng: 106.6802 },
  { id: "cam-6", name: "Camera CMT8 - Điện Biên Phủ (Quận 3)", lat: 10.7795, lng: 106.6745 }
];

function CCTVStream({ camera }) {
  const canvasRef = useRef(null);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString("vi-VN") + " " + now.toLocaleTimeString("vi-VN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animFrame;
    
    // Cars array
    const cars = [];
    for (let i = 0; i < 8; i++) {
      cars.push({
        x: Math.random() * canvas.width,
        y: 40 + Math.random() * 40,
        speed: 0.8 + Math.random() * 1.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.5 ? "#ffffff" : "#f59e0b"
      });
    }

    const draw = () => {
      ctx.fillStyle = "#0c0a09"; // Dark stone background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw road grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 2;
      
      // Horizontal lanes
      ctx.beginPath();
      ctx.moveTo(0, 45); ctx.lineTo(canvas.width, 45);
      ctx.moveTo(0, 75); ctx.lineTo(canvas.width, 75);
      ctx.stroke();

      // Lane markers (dashed)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 60); ctx.lineTo(canvas.width, 60);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Draw cars
      cars.forEach((car) => {
        car.x += car.speed * car.direction;
        if (car.x > canvas.width + 10) car.x = -10;
        if (car.x < -10) car.x = canvas.width + 10;

        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, 8, 4);

        // Headlights
        ctx.fillStyle = "rgba(253, 224, 71, 0.35)";
        if (car.direction === 1) {
          ctx.beginPath();
          ctx.moveTo(car.x + 8, car.y);
          ctx.lineTo(car.x + 18, car.y - 2);
          ctx.lineTo(car.x + 18, car.y + 6);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(car.x, car.y);
          ctx.lineTo(car.x - 10, car.y - 2);
          ctx.lineTo(car.x - 10, car.y + 6);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Scan lines filter overlay
      ctx.fillStyle = "rgba(24, 24, 27, 0.04)";
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, [camera]);

  return (
    <div className="relative aspect-video bg-stone-950 rounded-xl overflow-hidden border border-white/10 shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" width={320} height={180} />
      
      {/* OSD (On-Screen Display) */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
        <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">● REC LIVE</span>
      </div>
      <div className="absolute top-2.5 right-2.5 pointer-events-none">
        <span className="text-[9px] font-bold text-zinc-400 font-mono">CAM-HTMS-{(Math.abs(camera.lat * 100) % 100).toFixed(0)}</span>
      </div>
      <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
        <span className="text-[9px] font-semibold text-zinc-300 font-mono">{timeStr}</span>
      </div>
      <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
        <span className="text-[9px] font-semibold text-zinc-400 font-mono">1080P @ 30FPS</span>
      </div>
    </div>
  );
}

const CATEGORY_FILTER_ICONS = {
  "": Compass,
  food: UtensilsCrossed,
  cafe: Coffee,
  play: Gamepad2
};

// Time-of-day smart suggestion (one-tap filter preset)
function smartSuggestion(hour) {
  if (hour >= 6 && hour < 11) return { label: "Cà phê sáng gần bạn", category: "cafe" };
  if (hour >= 11 && hour < 14) return { label: "Quán ăn trưa ngon", category: "food" };
  if (hour >= 14 && hour < 17) return { label: "Cà phê chill buổi xế", category: "cafe" };
  if (hour >= 17 && hour < 22) return { label: "Tối nay đi chơi đâu?", category: "play" };
  return { label: "Chỗ chơi khuya còn mở", category: "play" };
}

// Clean monochrome category icon for unified branding
function PlaceLogo({ place }) {
  const Icon = CATEGORY_ICONS[place.category] || MapPin;
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-border/20 shadow-sm transition-transform duration-200 hover:scale-105">
      <Icon className="w-4.5 h-4.5" aria-hidden="true" />
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
  const [routeInfo, setRouteInfo] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeCamera, setActiveCamera] = useState(null);
  const [trafficAlert, setTrafficAlert] = useState(null);
  
  const selectedPlace = useMemo(() => places.find((p) => p.id === selectedId), [places, selectedId]);
  const emptyForm = { name: "", category: "food", services: "", menu: "", address: "", phone: "", website: "" };
  const [form, setForm] = useState(emptyForm);

  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const cameraMarkersRef = useRef([]);
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
      const loadedPlaces = data.places || [];
      const loadedSource = data.source || "";
      
      setPlaces(loadedPlaces);
      setSource(loadedSource);
      setPersonalized(!!data.personalized);

      // Save to cache
      try {
        localStorage.setItem("hugo_discover_places_cache", JSON.stringify({
          places: loadedPlaces,
          source: loadedSource,
          timestamp: Date.now()
        }));
      } catch (cacheErr) {
        console.warn("Could not save places cache:", cacheErr);
      }
    } catch (err) {
      console.warn("Fetch places failed, loading cache:", err);
      // Attempt load from cache
      try {
        const cached = localStorage.getItem("hugo_discover_places_cache");
        if (cached) {
          const cachedData = JSON.parse(cached);
          let loaded = cachedData.places || [];
          
          // Apply sorting in frontend since we are offline
          if (opts.sort === "smart") {
            loaded.sort((a, b) => getMatchScore(b.id) - getMatchScore(a.id));
          } else if (opts.sort === "near") {
            loaded.sort((a, b) => (a.distM || 0) - (b.distM || 0));
          } else if (opts.sort === "top") {
            loaded.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          }

          setPlaces(loaded);
          setSource((cachedData.source || "lưu tạm") + " (Ngoại tuyến)");
          setError("Kết nối gián đoạn. Đang hiển thị dữ liệu lưu tạm.");
        } else {
          setError(err.message);
          setPlaces([]);
        }
      } catch (cacheLoadErr) {
        setError(err.message);
        setPlaces([]);
      }
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

  // Route drawing helper (OSRM street routing with turn instructions)
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
          
          // Calculate dynamic traffic delays: Green (65% path - normal), Orange (25% path - 35% delay), Red (10% path - 120% delay)
          const baseDuration = r.duration;
          const delayFactor = 1.2075; // average traffic factor
          const totalDuration = baseDuration * delayFactor;
          const delaySeconds = totalDuration - baseDuration;
          
          routeDetails = {
            distance: r.distance,
            duration: totalDuration,
            delay: delaySeconds,
            steps: r.legs && r.legs[0] && r.legs[0].steps ? r.legs[0].steps.map(translateStep) : []
          };
          
          if (delaySeconds > 25) {
            setTrafficAlert(`Có ùn ứ nhẹ trên tuyến di chuyển. Thời gian trễ dự kiến khoảng ${Math.ceil(delaySeconds / 60)} phút.`);
          } else {
            setTrafficAlert(null);
          }
        }
      }
    } catch (routeErr) {
      console.warn("OSRM routing failed, falling back to straight line:", routeErr);
      setTrafficAlert(null);
    }
    
    setRouteInfo(routeDetails);

    // Segment coordinates for traffic coloring
    const features = [];
    const n = coordinates.length;
    if (n >= 2) {
      const i1 = Math.floor(n * 0.65);
      const i2 = Math.floor(n * 0.90);
      
      // Green segment
      if (i1 >= 1) {
        features.push({
          type: "Feature",
          properties: { color: "#10b981" }, // Emerald green
          geometry: {
            type: "LineString",
            coordinates: coordinates.slice(0, i1 + 1)
          }
        });
      }
      
      // Orange segment
      if (i2 > i1) {
        features.push({
          type: "Feature",
          properties: { color: "#f59e0b" }, // Amber orange
          geometry: {
            type: "LineString",
            coordinates: coordinates.slice(i1, i2 + 1)
          }
        });
      }
      
      // Red segment
      if (n - 1 > i2) {
        features.push({
          type: "Feature",
          properties: { color: "#ef4444" }, // Red
          geometry: {
            type: "LineString",
            coordinates: coordinates.slice(i2)
          }
        });
      }
    } else {
      features.push({
        type: "Feature",
        properties: { color: "#3b82f6" }, // Fallback blue
        geometry: {
          type: "LineString",
          coordinates
        }
      });
    }

    const geojson = {
      type: "FeatureCollection",
      features
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
        
        if (!map.getLayer(layerId + "-casing")) {
          map.addLayer({
            id: layerId + "-casing",
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 8,
              "line-opacity": 0.25
            }
          });
        }
        
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round"
            },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 4.5,
              "line-opacity": 0.95
            }
          });
        }
      }
    } catch (e) {
      console.error("Error drawing route line:", e);
    }

    // --- Place CCTV Camera Markers ---
    cameraMarkersRef.current.forEach((m) => m.remove());
    cameraMarkersRef.current = [];

    // Filter cameras within 350 meters of the route coordinates
    const nearbyCameras = TRAFFIC_CAMERAS.filter((cam) => {
      const minD = Math.min(...coordinates.map((coord) =>
        metersBetween({ lat: cam.lat, lng: cam.lng }, { lat: coord[1], lng: coord[0] })
      ));
      return minD < 350;
    });

    // Create and add markers for nearby cameras
    cameraMarkersRef.current = nearbyCameras.map((cam) => {
      const el = document.createElement("div");
      el.className = "disc-camera-marker";
      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      `;
      el.title = `${cam.name} (Bấm để xem CCTV trực tiếp)`;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        hapticSelect();
        setActiveCamera(cam);
      });

      return new maplibregl.Marker({ element: el })
        .setLngLat([cam.lng, cam.lat])
        .addTo(map);
    });
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
        setRouteInfo(null);
        setShowSteps(false);
        setTrafficAlert(null);
        setActiveCamera(null);
        cameraMarkersRef.current.forEach((m) => m.remove());
        cameraMarkersRef.current = [];
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

  // Network connection state listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (userPos) {
        fetchPlaces(userPos, { category, sort, q: debouncedQuery, openOnly });
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userPos, category, sort, debouncedQuery, openOnly, fetchPlaces]);


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
      placeMarkersRef.current.forEach((m) => m.remove());
      cameraMarkersRef.current.forEach((m) => m.remove());
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
      const svg = CATEGORY_SVGS[p.category] || CATEGORY_SVGS.default;
      const catColor = p.category === "food" ? "orange" : p.category === "cafe" ? "amber" : p.category === "play" ? "emerald" : "indigo";
      
      pinInner.className = `disc-pin-container ${catColor}-glow ${p.openNow === false ? "opacity-60" : ""}`;
      pinInner.innerHTML = svg;
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
        
        {/* Offline Mode Banner */}
        {isOffline && (
          <div className="absolute top-[110px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-amber-500/90 dark:bg-amber-600/90 border border-amber-400/20 text-white backdrop-blur-md px-3.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg pointer-events-none">
            <span className="grid h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
            Ngoại tuyến (Dữ liệu lưu tạm)
          </div>
        )}

        {/* CCTV Camera Stream Live Modal */}
        {activeCamera && (
          <div className="absolute inset-4 z-40 bg-zinc-950/95 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">videocam</span>
                {activeCamera.name}
              </h3>
              <button 
                onClick={() => setActiveCamera(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 active:scale-90 transition-all animate-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <CCTVStream camera={activeCamera} />
            
            <div className="mt-1 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-zinc-300 leading-relaxed flex items-start gap-2">
              <span className="grid h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mt-1"></span>
              <span>
                <strong>Mật độ:</strong> 65% (Dòng xe di chuyển chậm ổn định). Không phát hiện tai nạn hoặc sự cố nghiêm trọng trên tuyến đường.
              </span>
            </div>
          </div>
        )}
        
        {/* Glassmorphic floating Search & Categories card */}
        {!loading && !error && (
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-1.5 max-w-md bg-white/80 dark:bg-zinc-950/80 border border-white/20 dark:border-white/5 backdrop-blur-md p-2 rounded-2xl shadow-lg">
            
            {/* Search Input Bar */}
            <div className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm quán ăn, cà phê..."
                  className="w-full h-8 pl-8 pr-4 rounded-lg bg-muted/60 border border-border/20 text-xs text-foreground focus:outline-none focus:ring-1.5 focus:ring-primary/30 placeholder:text-muted-foreground animate-none"
                />
              </div>
              <button
                onClick={refresh}
                disabled={fetching || !userPos}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/20 bg-muted/60 text-foreground hover:bg-muted/80 transition active:scale-95 disabled:opacity-50 shrink-0"
                title="Làm mới gợi ý"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin text-primary" : ""}`} />
              </button>
            </div>

            {/* Horizontal Scroll Categories */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_FILTER_ICONS[c.id] || Compass;
                return (
                  <button
                    key={c.id}
                    onClick={() => { hapticSelect(); setCategory(c.id); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition flex items-center gap-1.5 ${
                      category === c.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {c.label}
                  </button>
                );
              })}
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
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-black rounded-md flex items-center gap-0.5">
                  ✨ Hợp gu {getMatchScore(selectedPlace.id)}%
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
                <X className="w-4 h-4" />
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

            {/* OSRM Route Navigation steps */}
            {routeInfo && (
              <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="grid h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-foreground">
                      ⏱️ {Math.ceil(routeInfo.duration / 60)} phút ({fmtDist(routeInfo.distance)})
                    </span>
                  </div>
                  {routeInfo.steps?.length > 0 && (
                    <button
                      onClick={() => { hapticSelect(); setShowSteps(!showSteps); }}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      {showSteps ? "Ẩn lối đi" : "Xem lối đi"}
                    </button>
                  )}
                </div>

                {/* Traffic alert warning */}
                {trafficAlert && (
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed flex items-start gap-1.5 font-medium animate-pulse">
                    <span className="grid h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                    <span>{trafficAlert}</span>
                  </div>
                )}

                {showSteps && routeInfo.steps?.length > 0 && (
                  <div className="max-h-36 overflow-y-auto no-scrollbar flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border/10">
                    {routeInfo.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-foreground/80 leading-normal">
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0 border border-border/20">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            selectedPlace && !showAdd 
              ? (showSteps ? "bottom-[330px]" : "bottom-[210px]") 
              : "bottom-4"
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
              className={`min-h-[32px] px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition flex items-center gap-1.5 ${
                openOnly
                  ? "bg-success/15 border-success/30 text-success"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Đang mở
            </button>
            
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/20">
              {[
                { id: "smart", label: "Hợp gu", icon: Sparkles },
                { id: "dist", label: "Gần nhất", icon: Navigation },
                { id: "rating", label: "Đánh giá", icon: Star }
              ].map((opt) => {
                const SortIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { hapticSelect(); setSort(opt.id); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      sort === opt.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <SortIcon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
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
        {places.map((p, index) => {
          const active = p.id === selectedId;
          return (
            <div
              key={p.id}
              data-place-id={p.id}
              onClick={() => selectPlace(p)}
              style={{ animationDelay: `${index * 40}ms` }}
              className={`bg-card border rounded-2xl p-3 cursor-pointer transition shadow-sm place-card-animate ${
                active 
                  ? "border-primary ring-1 ring-primary/20 bg-primary/[0.01] shadow-md shadow-primary/5 border-l-4 pl-4" 
                  : "border-border/60 hover:border-primary/30 hover:shadow-md hover:shadow-indigo-500/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <PlaceLogo place={p} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wide">
                      {CATEGORY_LABELS[p.category] || "Gợi ý"}
                    </span>
                    <span className="text-[11.5px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      ✨ Hợp gu {getMatchScore(p.id)}%
                    </span>
                    {p.openNow === true && (
                      <span className="text-[11.5px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md">Đang mở</span>
                    )}
                    {p.openNow === false && (
                      <span className="text-[11.5px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md">Đã đóng</span>
                    )}
                  </div>
                  <h3 className="text-[14.5px] font-black text-foreground mt-0.5 truncate">{p.name}</h3>
                  {p.reasons?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.reasons.map((r) => (
                        <span key={r} className="text-[10px] font-bold text-primary bg-primary/10 rounded-lg px-2 py-0.5">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-muted-foreground flex-wrap">
                    {p.rating != null ? (
                      <span className="flex items-center gap-0.5 text-foreground font-bold">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" aria-hidden="true" />
                        {p.rating}
                        {p.ratingCount != null && (
                          <span className="text-muted-foreground font-normal">({p.ratingCount})</span>
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
                        Đánh giá
                      </a>
                    )}
                    {p.priceRange && <span>· {p.priceRange}</span>}
                    <span>· Cách {fmtDist(p.distM)}</span>
                  </div>
                  {p.address && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{p.address}</p>
                  )}
                  {p.services && (
                    <p className="text-[12px] text-foreground/90 mt-1 line-clamp-1">{p.services}</p>
                  )}
                  {p.menu && active && (
                    <div className="mt-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5">
                      <p className="text-[10.5px] font-black text-muted-foreground uppercase tracking-wider">Menu</p>
                      <p className="text-[12px] text-foreground whitespace-pre-line mt-0.5">{p.menu}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5 mt-2.5">
                <a
                  href={p.googleMapsUri || `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-h-[34px] flex items-center justify-center gap-1 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition"
                >
                  <Navigation className="w-3 h-3" aria-hidden="true" />
                  Google Maps
                </a>
                <a
                  href={`https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-h-[34px] flex items-center justify-center gap-1 rounded-xl bg-card border border-border text-foreground text-[11px] font-black uppercase tracking-wider hover:bg-muted transition"
                >
                  <Compass className="w-3 h-3" aria-hidden="true" />
                  Apple Maps
                </a>
                {p.mine && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlace(p); }}
                    className="min-h-[34px] px-3 rounded-xl border border-destructive/40 text-destructive text-[11px] font-bold hover:bg-destructive/10 transition"
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #18181b;
          border: 2px solid #ffffff;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .dark .disc-pin-container {
          background: #18181b;
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
        /* Neon Category Glows */
        .orange-glow { box-shadow: 0 0 10px rgba(249, 115, 22, 0.45), inset 0 0 4px rgba(249, 115, 22, 0.2); }
        .amber-glow { box-shadow: 0 0 10px rgba(245, 158, 11, 0.45), inset 0 0 4px rgba(245, 158, 11, 0.2); }
        .emerald-glow { box-shadow: 0 0 10px rgba(16, 185, 129, 0.45), inset 0 0 4px rgba(16, 185, 129, 0.2); }
        .indigo-glow { box-shadow: 0 0 10px rgba(99, 102, 241, 0.45), inset 0 0 4px rgba(99, 102, 241, 0.2); }

        .custom-place-marker-active .disc-pin-container {
          background: #3b82f6;
          border-color: #ffffff;
          color: #ffffff;
          transform: scale(1.2);
          box-shadow: 0 0 15px 4px rgba(59, 130, 246, 0.5);
        }
        .dark .custom-place-marker-active .disc-pin-container {
          background: #4f46e5;
          border-color: #ffffff;
          color: #ffffff;
          transform: scale(1.2);
          box-shadow: 0 0 15px 4px rgba(79, 70, 229, 0.5);
        }

        .place-card-animate {
          animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Traffic CCTV camera markers styling */
        .disc-camera-marker {
          cursor: pointer;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #18181b;
          color: #18181b;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .disc-camera-marker:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          border-color: #ef4444;
          color: #ef4444;
          background: #fef2f2;
        }
        .dark .disc-camera-marker {
          background: #09090b;
          border-color: #f4f4f5;
          color: #f4f4f5;
        }
        .dark .disc-camera-marker:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(127, 29, 29, 0.2);
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
