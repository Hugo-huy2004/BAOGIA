import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";

// Curated via the Radio Browser API (https://www.radio-browser.info) — exact station
// names confirmed live against the API, resolved to fresh stream URLs at runtime
// (so the list survives upstream URL changes without needing a code update).
const RADIO_CATEGORIES = [
  {
    id: "vn_news",
    icon: "newspaper",
    labelKey: "utilities.radio.categories.vnNews",
    names: ["VOV1", "VOV2", "VOV3", "VOV Giao thông Hà Nội", "VOV5 WORLD RADIO", "RFI Tiếng Việt", "VOH FM 87.7"]
  },
  {
    id: "intl_news",
    icon: "public",
    labelKey: "utilities.radio.categories.intlNews",
    names: ["BBC World Service", "NPR 24 Hour Program Stream", "CNN", "Fox News Radio", "RTE1"]
  },
  {
    id: "music",
    icon: "music_note",
    labelKey: "utilities.radio.categories.music",
    names: ["ZING BOLERO", "M Radio Vietnam", "Cherry Radio Music 247", "CHẠM RADIO", "SWR3", "Heart 80s"]
  }
];

export default function MemberRadioTab({ onBack, showToast }) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(RADIO_CATEGORIES[0].id);
  const [stationsByCategory, setStationsByCategory] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const retriedRef = useRef(false);
  // Always points at the latest handlePlaybackFailure so the audio element's
  // event handlers (attached once on mount) never close over a stale `nowPlaying`.
  const handleFailureRef = useRef(() => {});

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume / 100;
    audio.onplaying = () => { setIsPlaying(true); setIsBuffering(false); };
    audio.onpause = () => setIsPlaying(false);
    audio.onwaiting = () => setIsBuffering(true);
    audio.onerror = () => handleFailureRef.current();
    audioRef.current = audio;
    return () => {
      hlsRef.current?.destroy();
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const loadCategory = useCallback(async (categoryId) => {
    if (stationsByCategory[categoryId]) return;
    const category = RADIO_CATEGORIES.find((c) => c.id === categoryId);
    setLoadingCategory(categoryId);
    const stations = await fetchStationsByNames(category.names);
    setStationsByCategory((prev) => ({ ...prev, [categoryId]: stations }));
    setLoadingCategory(null);
  }, [stationsByCategory]);

  useEffect(() => {
    loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  const attachAndPlay = (streamUrl) => {
    const audio = audioRef.current;
    const onPlayError = () => handlePlaybackFailure();

    hlsRef.current?.destroy();
    hlsRef.current = null;

    // Many state-broadcaster stations (VOV, VOH, BBC...) only stream as HLS, which
    // Chrome/Firefox don't decode natively in <audio> — hls.js bridges that gap.
    // Safari/iOS support HLS natively and skip hls.js entirely.
    const isHls = streamUrl.includes(".m3u8");
    if (isHls && audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = streamUrl;
      audio.play().catch(onPlayError);
    } else if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play().catch(onPlayError));
      hls.on(Hls.Events.ERROR, (_evt, data) => { if (data.fatal) onPlayError(); });
      hlsRef.current = hls;
    } else {
      audio.src = streamUrl;
      audio.play().catch(onPlayError);
    }
  };

  const handlePlaybackFailure = async () => {
    // One automatic retry with a freshly re-resolved URL — some streams use
    // short-lived tokens (e.g. zeno.fm) that can go stale between page load and click.
    if (!retriedRef.current && nowPlaying) {
      retriedRef.current = true;
      const fresh = await fetchStationByName(nowPlaying.name);
      const freshUrl = fresh?.url_resolved || fresh?.url;
      if (freshUrl) {
        setIsBuffering(true);
        attachAndPlay(freshUrl);
        return;
      }
    }
    setIsBuffering(false);
    setIsPlaying(false);
    showToast?.(t("utilities.radio.toastPlayError", "Đài này hiện không phát được, vui lòng thử đài khác."), "error");
  };

  useEffect(() => {
    handleFailureRef.current = handlePlaybackFailure;
  });

  const playStation = async (station) => {
    if (!audioRef.current) return;
    retriedRef.current = false;
    setNowPlaying(station);
    setIsBuffering(true);

    // Re-resolve right before playing instead of trusting the cached list entry —
    // guards against expired tokens/redirects on long-lived sessions.
    const fresh = await fetchStationByName(station.name);
    const streamUrl = fresh?.url_resolved || fresh?.url || station.url_resolved || station.url;
    if (!streamUrl) {
      setIsBuffering(false);
      showToast?.(t("utilities.radio.toastPlayError", "Đài này hiện không phát được, vui lòng thử đài khác."), "error");
      return;
    }

    attachAndPlay(streamUrl);
    registerStationClick((fresh || station).stationuuid);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const stations = stationsByCategory[activeCategory] || [];
  const knobAngle = (volume / 100) * 270 - 135;

  return (
    <div>
      <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-amber-500" onBack={onBack} />

      {/* Retro radio face */}
      <div className="relative mb-5 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-850 to-black p-4 md:p-5 shadow-xl border border-amber-900/30 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1.4px)", backgroundSize: "10px 10px" }}
        />
        <div className="relative z-10 flex items-center gap-3 md:gap-4">
          {/* Digital display */}
          <div className="flex-1 min-w-0 bg-black/70 rounded-xl px-4 py-3 border border-amber-500/20 shadow-inner">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isPlaying ? "bg-red-500 animate-pulse-glow" : "bg-zinc-600"}`} />
              <span className="text-[9px] font-black tracking-widest uppercase text-amber-500/80">
                {isBuffering ? t("utilities.radio.buffering", "Đang kết nối...") : isPlaying ? t("utilities.radio.nowPlaying", "Đang phát") : nowPlaying ? t("utilities.radio.paused", "Đã tạm dừng") : t("utilities.radio.standby", "Chọn một đài để nghe")}
              </span>
            </div>
            <p className="font-mono text-amber-400 text-sm md:text-base font-bold tracking-wide truncate drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">
              {nowPlaying?.name || "HUGO • RADIO"}
            </p>
            {/* VU meter */}
            <div className="flex items-end gap-1 h-4 mt-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1 h-full rounded-full bg-amber-500 origin-bottom"
                  style={{
                    animation: isPlaying ? `eq-bar ${0.7 + i * 0.12}s ease-in-out infinite` : "none",
                    animationDelay: `${i * 0.08}s`,
                    transform: isPlaying ? undefined : "scaleY(0.15)",
                    opacity: isPlaying ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Play / pause button */}
          <button
            onClick={togglePlayPause}
            disabled={!nowPlaying}
            className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-black flex items-center justify-center active:scale-95 transition-transform shadow-lg disabled:opacity-30 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined text-2xl">{isPlaying ? "pause" : "play_arrow"}</span>
          </button>

          {/* Retro volume knob */}
          <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-400 dark:to-zinc-600 border-2 border-zinc-600/40 shadow-md">
              <span
                className="absolute top-1.5 left-1/2 w-1 h-2.5 -translate-x-1/2 bg-amber-600 rounded-full origin-bottom"
                style={{ transform: `rotate(${knobAngle}deg)`, transformOrigin: "50% 18px" }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={t("utilities.radio.volume", "Âm lượng")}
            />
          </div>
        </div>
      </div>

      {/* Band selector */}
      <div className="flex mb-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        {RADIO_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10.5px] font-bold transition-all ${idx > 0 ? "border-l border-zinc-200/60 dark:border-zinc-800/60" : ""} ${
              activeCategory === cat.id
                ? "bg-amber-500 text-black"
                : "bg-white dark:bg-[#12111a] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            <span className="hidden sm:inline">{t(cat.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Station presets */}
      {loadingCategory === activeCategory ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
          {t("companion.tab.loading", "Đang tải...")}
        </div>
      ) : stations.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
          {t("utilities.radio.noStations", "Không tìm thấy đài nào trong danh mục này.")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stations.map((station) => {
            const active = nowPlaying?.stationuuid === station.stationuuid;
            return (
              <button
                key={station.stationuuid}
                onClick={() => playStation(station)}
                className={`relative text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                  active
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                    : "border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#12111a] hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <span className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${active && isPlaying ? "bg-red-500 animate-pulse-glow" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${active ? "bg-amber-500 text-black" : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300"}`}>
                  <span className="material-symbols-outlined text-base">
                    {active && isBuffering ? "sync" : "radio"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2">{station.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
