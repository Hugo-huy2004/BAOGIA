import React, { useState, useEffect, useRef } from "react";
import { getCachedGeolocation } from "../../utils/geoCache.js";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer.js";
import { MapPin, Navigation, Compass, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function DiscoveryMap() {
  const [loading, setLoading] = useState(true);
  const [mapErr, setMapErr] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const mapInstanceRef = useRef(null);
  const mapContainerId = "discovery-leaflet-map";

  // Haversine formula to compute distance in meters between two coordinates
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const loadLeafletResources = () => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve(window.L);
        return;
      }

      // 1. Inject Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha255-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);

      // 2. Inject Leaflet JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha255-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Không thể tải thư viện Leaflet.js"));
      document.body.appendChild(script);
    });
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${apiBase}/bios/me/local-recommendations`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        return data.recommendations || [];
      }
    } catch (err) {
      console.error("Lỗi khi tải gợi ý địa điểm:", err);
    }
    return [];
  };

  const initMap = async () => {
    try {
      setLoading(true);
      setMapErr("");

      // 1. Get Live Geolocation
      const pos = await getCachedGeolocation();
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserPos({ lat, lng });

      // 2. Load Leaflet library dynamically
      const L = await loadLeafletResources();

      // 3. Clean existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // 4. Initialize Map
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 15);
      mapInstanceRef.current = map;

      // 5. Add CartoDB Dark Matter tile layer (Premium Dark Mode style)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      // 6. Draw User Pulsating Marker
      const userIcon = L.divIcon({
        className: "custom-user-marker-icon",
        html: `<div class="pulse-marker"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([lat, lng], { icon: userIcon }).addTo(map);

      // 7. Load & Draw AI Recommendations Pins
      const spots = await fetchRecommendations();
      spots.forEach((spot) => {
        // Detect appropriate emoji based on content
        let emoji = "📍";
        const text = (spot.body || "").toLowerCase() + (spot.title || "").toLowerCase();
        if (text.includes("cafe") || text.includes("cà phê") || text.includes("trà")) emoji = "☕";
        else if (text.includes("phở") || text.includes("bún") || text.includes("ăn") || text.includes("bánh")) emoji = "🍕";
        else if (text.includes("sách") || text.includes("thư viện")) emoji = "📚";
        else if (text.includes("công viên") || text.includes("dạo")) emoji = "🌳";

        const recIcon = L.divIcon({
          className: "custom-rec-marker-icon",
          html: `<div class="rec-pin-outer"><span class="rec-pin-emoji">${emoji}</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: recIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedSpot(spot);
          map.setView([spot.lat, spot.lng], 16);
        });
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setMapErr(err.message || "Đã xảy ra lỗi định vị hoặc vẽ bản đồ.");
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Request force coordinate update from Location Check to fetch new recommendations
    try {
      const pos = await getCachedGeolocation();
      const { latitude: lat, longitude: lng } = pos.coords;
      await fetch(`${apiBase}/bios/me/check-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lat, lng })
      });
      await initMap();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-2xl">
      {/* Dynamic Map Area */}
      <div id={mapContainerId} className="w-full flex-grow relative z-10" style={{ minHeight: "380px" }}>
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-sm font-medium tracking-wide">Đang đồng bộ tọa độ GPS & tải bản đồ...</p>
          </div>
        )}

        {mapErr && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400 p-6 text-center gap-4">
            <MapPin className="w-12 h-12 text-red-500/80 animate-bounce" />
            <h3 className="font-semibold text-lg text-white">Lỗi Định Vị Địa Lý</h3>
            <p className="text-xs text-zinc-500 max-w-xs">{mapErr}</p>
            <button
              onClick={initMap}
              className="px-4 py-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold rounded-xl transition duration-200"
            >
              Thử lại ngay
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-zinc-900/90 border border-white/10 hover:border-indigo-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-indigo-400 rounded-2xl shadow-lg transition duration-200"
          title="Cập nhật vị trí và tìm kiếm gợi ý mới"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
        </button>
        {userPos && (
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([userPos.lat, userPos.lng], 15);
              }
            }}
            className="p-3 bg-zinc-900/90 border border-white/10 hover:border-indigo-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-indigo-400 rounded-2xl shadow-lg transition duration-200"
            title="Quay lại vị trí hiện tại"
          >
            <Compass className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Slide-Up Detail Card for AI Spot Recommendations */}
      <AnimatePresence>
        {selectedSpot && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-4 left-4 right-4 z-20 bg-zinc-900/95 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-2xl flex flex-col gap-3"
          >
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Đề xuất AI
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  {selectedSpot.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedSpot(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10"
              >
                Đóng
              </button>
            </div>

            {/* Description / Speciality and Warm Nudge from Gemini */}
            <p className="text-xs text-zinc-400 leading-relaxed font-normal bg-zinc-950/40 p-3 rounded-xl border border-white/5">
              {selectedSpot.body}
            </p>

            {/* Bottom details */}
            <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-white/5 mt-1">
              <div>
                <span className="block text-zinc-400 font-medium">Khoảng cách</span>
                <span>
                  Cách bạn khoảng{" "}
                  {userPos
                    ? `${getDistance(userPos.lat, userPos.lng, selectedSpot.lat, selectedSpot.lng)}m`
                    : "---"}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg transition duration-200"
              >
                <Navigation className="w-3.5 h-3.5" />
                Chỉ đường
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS Styling for Custom Map Markers */}
      <style>{`
        .custom-user-marker-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-marker {
          width: 14px;
          height: 14px;
          background: #4f46e5;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px #4f46e5, 0 0 0 8px rgba(79, 70, 229, 0.3);
          animation: userPulseAnim 1.6s infinite ease-in-out;
        }
        @keyframes userPulseAnim {
          0% { box-shadow: 0 0 12px #4f46e5, 0 0 0 0px rgba(79, 70, 229, 0.4); }
          70% { box-shadow: 0 0 12px #4f46e5, 0 0 0 10px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 12px #4f46e5, 0 0 0 0px rgba(79, 70, 229, 0); }
        }

        .custom-rec-marker-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rec-pin-outer {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(24, 24, 27, 0.85);
          border: 1.5px solid #818cf8;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 6px rgba(129, 140, 248, 0.2);
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .rec-pin-outer:hover {
          transform: scale(1.18);
          border-color: #a5b4fc;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(129, 140, 248, 0.5);
        }
        .rec-pin-emoji {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
