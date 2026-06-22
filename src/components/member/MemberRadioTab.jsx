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

const STATION_FREQUENCIES = {
  // vn_news
  "VOV1": 91.0,
  "VOV2": 96.5,
  "VOV3": 102.7,
  "VOV Giao thông Hà Nội": 91.5,
  "VOV5 WORLD RADIO": 105.5,
  "RFI Tiếng Việt": 93.3,
  "VOH FM 87.7": 87.7,
  // intl_news
  "BBC World Service": 88.9,
  "NPR 24 Hour Program Stream": 90.1,
  "CNN": 92.5,
  "Fox News Radio": 94.7,
  "RTE1": 98.1,
  // music
  "ZING BOLERO": 95.0,
  "M Radio Vietnam": 98.9,
  "Cherry Radio Music 247": 101.5,
  "CHẠM RADIO": 104.0,
  "SWR3": 106.2,
  "Heart 80s": 107.5
};

const FALLBACK_STATIONS = {
  vn_news: [
    {
      stationuuid: "vov1",
      name: "VOV1",
      url_resolved: "https://vov-radio.akamaized.net/hls/live/2033621/VOV1/index.m3u8",
      url: "https://vov-radio.akamaized.net/hls/live/2033621/VOV1/index.m3u8",
    },
    {
      stationuuid: "vov2",
      name: "VOV2",
      url_resolved: "https://vov-radio.akamaized.net/hls/live/2033622/VOV2/index.m3u8",
      url: "https://vov-radio.akamaized.net/hls/live/2033622/VOV2/index.m3u8",
    },
    {
      stationuuid: "vov3",
      name: "VOV3",
      url_resolved: "https://vov-radio.akamaized.net/hls/live/2033623/VOV3/index.m3u8",
      url: "https://vov-radio.akamaized.net/hls/live/2033623/VOV3/index.m3u8",
    },
    {
      stationuuid: "vov_gt_hn",
      name: "VOV Giao thông Hà Nội",
      url_resolved: "https://vov-radio.akamaized.net/hls/live/2033625/VOVGT/index.m3u8",
      url: "https://vov-radio.akamaized.net/hls/live/2033625/VOVGT/index.m3u8",
    },
    {
      stationuuid: "vov5",
      name: "VOV5 WORLD RADIO",
      url_resolved: "https://vov-radio.akamaized.net/hls/live/2033624/VOV5/index.m3u8",
      url: "https://vov-radio.akamaized.net/hls/live/2033624/VOV5/index.m3u8",
    },
    {
      stationuuid: "rfi",
      name: "RFI Tiếng Việt",
      url_resolved: "http://live02.rfi.fr/rfivietnamien-96k.mp3",
      url: "http://live02.rfi.fr/rfivietnamien-96k.mp3",
    },
    {
      stationuuid: "voh_87.7",
      name: "VOH FM 87.7",
      url_resolved: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8",
      url: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8",
    }
  ],
  intl_news: [
    {
      stationuuid: "bbc",
      name: "BBC World Service",
      url_resolved: "https://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8",
      url: "https://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8",
    },
    {
      stationuuid: "npr",
      name: "NPR 24 Hour Program Stream",
      url_resolved: "https://npr-ice.streamguys1.com/live.mp3",
      url: "https://npr-ice.streamguys1.com/live.mp3",
    },
    {
      stationuuid: "cnn",
      name: "CNN",
      url_resolved: "https://cnn-cnngo.akamaized.net/hls/live/2026857/cnngo/cnn/index.m3u8",
      url: "https://cnn-cnngo.akamaized.net/hls/live/2026857/cnngo/cnn/index.m3u8",
    },
    {
      stationuuid: "fox",
      name: "Fox News Radio",
      url_resolved: "https://foxnews.ice.infomaniak.ch/foxnews.mp3",
      url: "https://foxnews.ice.infomaniak.ch/foxnews.mp3",
    },
    {
      stationuuid: "rte1",
      name: "RTE1",
      url_resolved: "https://rte.live.speedcdn.vn/rte1/index.m3u8",
      url: "https://rte.live.speedcdn.vn/rte1/index.m3u8",
    }
  ],
  music: [
    {
      stationuuid: "zing_bolero",
      name: "ZING BOLERO",
      url_resolved: "https://vnno-ne-3-tf-multi-playlist-zmp3.zmdcdn.me/BJ7DyJjfG_E/zhls/playback-realtime/audio/5bace800d4453d1b6454/audio.m3u8",
      url: "https://vnno-ne-3-tf-multi-playlist-zmp3.zmdcdn.me/BJ7DyJjfG_E/zhls/playback-realtime/audio/5bace800d4453d1b6454/audio.m3u8",
    },
    {
      stationuuid: "m_radio_vn",
      name: "M Radio Vietnam",
      url_resolved: "https://stream-155.zeno.fm/4q7y9hvkp2zuv",
      url: "https://stream-155.zeno.fm/4q7y9hvkp2zuv",
    },
    {
      stationuuid: "cherry_247",
      name: "Cherry Radio Music 247",
      url_resolved: "https://stream-176.zeno.fm/umt5gqmg3reuv",
      url: "https://stream-176.zeno.fm/umt5gqmg3reuv",
    },
    {
      stationuuid: "cham_radio",
      name: "CHẠM RADIO",
      url_resolved: "https://vnno-ne-2-tf-multi-playlist-zmp3.zmdcdn.me/j20SDlO5EQk/zhls/playback-realtime/audio/59a2ee0ed24b3b15625a/audio.m3u8",
      url: "https://vnno-ne-2-tf-multi-playlist-zmp3.zmdcdn.me/j20SDlO5EQk/zhls/playback-realtime/audio/59a2ee0ed24b3b15625a/audio.m3u8",
    },
    {
      stationuuid: "swr3",
      name: "SWR3",
      url_resolved: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
      url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
    },
    {
      stationuuid: "heart80s",
      name: "Heart 80s",
      url_resolved: "https://stream-mz.musicradio.com/Heart80sMP3",
      url: "https://stream-mz.musicradio.com/Heart80sMP3",
    }
  ]
};

export default function MemberRadioTab({ onBack, showToast }) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(RADIO_CATEGORIES[0].id);
  const [stationsByCategory, setStationsByCategory] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(80);
  const [frequency, setFrequency] = useState(91.0); // start at 91.0 MHz (VOV1)
  const [isStatic, setIsStatic] = useState(false);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const retriedRef = useRef(false);
  const handleFailureRef = useRef(() => {});

  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const noiseGainRef = useRef(null);
  const tuningTimeoutRef = useRef(null);

  const startStaticNoise = useCallback(() => {
    if (noiseSourceRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      const targetVol = (volume / 100) * 0.08;
      gainNode.gain.setValueAtTime(targetVol, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      noiseSourceRef.current = source;
      noiseGainRef.current = gainNode;
    } catch (err) {
      console.warn("Failed to generate static noise:", err);
    }
  }, [volume]);

  const stopStaticNoise = useCallback(() => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
    noiseGainRef.current = null;
  }, []);

  const findClosestStation = useCallback((freq) => {
    let closest = null;
    let minDiff = 0.25; // snapping range 0.2 MHz

    for (const cat of RADIO_CATEGORIES) {
      const catStations = stationsByCategory[cat.id] || [];
      for (const station of catStations) {
        const stationFreq = STATION_FREQUENCIES[station.name];
        if (stationFreq !== undefined) {
          const diff = Math.abs(freq - stationFreq);
          if (diff < minDiff) {
            minDiff = diff;
            closest = { station, frequency: stationFreq, categoryId: cat.id };
          }
        }
      }
    }
    return closest;
  }, [stationsByCategory]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume / 100;
    audio.onplaying = () => { setIsPlaying(true); setIsBuffering(false); setIsStatic(false); stopStaticNoise(); };
    audio.onpause = () => setIsPlaying(false);
    audio.onwaiting = () => setIsBuffering(true);
    audio.onerror = () => handleFailureRef.current();
    audioRef.current = audio;
    return () => {
      hlsRef.current?.destroy();
      audio.pause();
      audio.src = "";
      stopStaticNoise();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (tuningTimeoutRef.current) {
        clearTimeout(tuningTimeoutRef.current);
      }
    };
  }, [stopStaticNoise]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (noiseGainRef.current && audioCtxRef.current) {
      const targetVol = (volume / 100) * 0.08;
      noiseGainRef.current.gain.setValueAtTime(targetVol, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  const loadCategory = useCallback((categoryId) => {
    const category = RADIO_CATEGORIES.find((c) => c.id === categoryId);
    const fallbacks = FALLBACK_STATIONS[categoryId] || [];

    // 1. Populates cache immediately with fallback data so presets display instantly in 0ms
    if (!stationsByCategory[categoryId]) {
      setStationsByCategory((prev) => ({ ...prev, [categoryId]: fallbacks }));
    }

    // 2. Fetch fresh stations asynchronously in the background (does not block UI)
    try {
      fetchStationsByNames(category.names).then((stations) => {
        if (stations && stations.length > 0) {
          const loadedNames = new Set(stations.map(s => s.name.toUpperCase()));
          const missing = fallbacks.filter(f => !loadedNames.has(f.name.toUpperCase()));
          let combined = [...stations, ...missing];

          combined.sort((a, b) => {
            const idxA = category.names.findIndex(n => n.toUpperCase() === a.name.toUpperCase());
            const idxB = category.names.findIndex(n => n.toUpperCase() === b.name.toUpperCase());
            return idxA - idxB;
          });

          setStationsByCategory((prev) => ({ ...prev, [categoryId]: combined }));
        }
      }).catch(() => {});
    } catch (e) {}
  }, [stationsByCategory]);

  useEffect(() => {
    loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  const attachAndPlay = (streamUrl) => {
    const audio = audioRef.current;
    const onPlayError = () => handlePlaybackFailure();

    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = streamUrl.includes(".m3u8");
    if (isHls && audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = streamUrl;
      audio.play().catch(onPlayError);
    } else if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 4,      // short buffer size for ultra-fast startup
        maxMaxBufferLength: 8,
        enableWorker: true,
        lowLatencyMode: true
      });
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
    
    stopStaticNoise();
    setIsStatic(false);
    retriedRef.current = false;
    setNowPlaying(station);
    setIsBuffering(true);

    const stationFreq = STATION_FREQUENCIES[station.name];
    if (stationFreq !== undefined) {
      setFrequency(stationFreq);
    }

    // Play IMMEDIATELY from fallback / cached URL (loads in 0ms)
    const streamUrl = station.url_resolved || station.url;
    if (streamUrl) {
      attachAndPlay(streamUrl);
      registerStationClick(station.stationuuid);
    }

    // Silently refresh URL in the background
    try {
      fetchStationByName(station.name).then((fresh) => {
        if (fresh) {
          const freshUrl = fresh.url_resolved || fresh.url;
          if (freshUrl && freshUrl !== streamUrl) {
            setStationsByCategory((prev) => {
              const list = prev[activeCategory] || [];
              const updated = list.map(s => s.name === station.name ? { ...s, url_resolved: freshUrl, url: freshUrl } : s);
              return { ...prev, [activeCategory]: updated };
            });
          }
        }
      }).catch(() => {});
    } catch (e) {}
  };

  const handleFrequencyTuning = (newFreq) => {
    const clamped = Math.max(87.5, Math.min(108.0, Math.round(newFreq * 10) / 10));
    setFrequency(clamped);

    if (tuningTimeoutRef.current) {
      clearTimeout(tuningTimeoutRef.current);
    }

    if (isPlaying || isBuffering || isStatic) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setIsBuffering(false);
      startStaticNoise();
      setIsStatic(true);
    }

    tuningTimeoutRef.current = setTimeout(async () => {
      const match = findClosestStation(clamped);
      if (match) {
        stopStaticNoise();
        setIsStatic(false);
        setFrequency(match.frequency);
        if (activeCategory !== match.categoryId) {
          setActiveCategory(match.categoryId);
        }
        playStation(match.station);
      } else {
        setNowPlaying(null);
        if (isPlaying || isBuffering || isStatic) {
          startStaticNoise();
          setIsStatic(true);
        }
      }
    }, 450);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const hasNoise = !!noiseSourceRef.current;

    if (isPlaying || hasNoise) {
      audio.pause();
      setIsPlaying(false);
      setIsBuffering(false);
      stopStaticNoise();
      setIsStatic(false);
    } else {
      const match = findClosestStation(frequency);
      if (match) {
        setFrequency(match.frequency);
        playStation(match.station);
      } else {
        startStaticNoise();
        setIsStatic(true);
      }
    }
  };

  const stations = stationsByCategory[activeCategory] || [];
  const knobAngle = (volume / 100) * 270 - 135;
  const needleLeft = `calc(1rem + (100% - 2rem) * ${(frequency - 87.5) / (108.0 - 87.5)})`;

  return (
    <div>
      <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-amber-500" onBack={onBack} />

      {/* Retro radio face */}
      <div className="relative mb-5 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-850 to-black p-4 md:p-5 shadow-xl border border-amber-900/30 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1.4px)", backgroundSize: "10px 10px" }}
        />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Digital display */}
            <div className="flex-1 min-w-0 bg-black/85 rounded-xl px-4 py-3 border border-amber-500/25 shadow-inner flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isPlaying ? "bg-emerald-500 animate-pulse-glow" : isStatic ? "bg-red-500 animate-pulse" : "bg-zinc-600"}`} />
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-500/80">
                    {isBuffering 
                      ? t("utilities.radio.buffering", "Đang kết nối...") 
                      : isStatic 
                        ? t("utilities.radio.tuning", "Đang dò sóng...")
                        : isPlaying 
                          ? t("utilities.radio.nowPlaying", "Đang phát") 
                          : nowPlaying 
                            ? t("utilities.radio.paused", "Đã tạm dừng") 
                            : t("utilities.radio.standby", "Chọn một đài để nghe")}
                  </span>
                </div>
                <p className="font-mono text-amber-400 text-[12px] md:text-sm font-bold tracking-wide truncate drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                  {isStatic 
                    ? "SÓNG TẠP • STATIC NOISE" 
                    : nowPlaying?.name || "HUGO • RECEIVER"}
                </p>
                {/* VU meter */}
                <div className="flex items-end gap-1 h-3 mt-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-full rounded-full bg-amber-500 origin-bottom"
                      style={{
                        animationName: (isPlaying || isStatic) ? "eq-bar" : "none",
                        animationDuration: isStatic ? `${0.2 + Math.random() * 0.3}s` : `${0.7 + i * 0.12}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        animationDelay: `${i * 0.08}s`,
                        transform: (isPlaying || isStatic) ? undefined : "scaleY(0.15)",
                        opacity: (isPlaying || isStatic) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* LED Frequency indicator */}
              <div className="shrink-0 flex flex-col items-end justify-center font-mono select-none">
                <span className="text-amber-500 text-lg md:text-2xl font-black tracking-tighter drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]">
                  {frequency.toFixed(1)}
                </span>
                <span className="text-[8px] font-bold text-amber-500/60 leading-none mt-0.5">MHz</span>
              </div>
            </div>

            {/* Play / pause button */}
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-black flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <span className="material-symbols-outlined text-2xl">{(isPlaying || isStatic) ? "pause" : "play_arrow"}</span>
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

          {/* Horizontal Tuning Slider Dial */}
          <div className="mt-1 px-1">
            <div className="relative h-12 bg-zinc-950/85 rounded-xl border border-amber-500/20 px-4 flex flex-col justify-end overflow-hidden select-none shadow-inner">
              {/* Ticks scale */}
              <div className="absolute inset-x-0 top-1 bottom-4 flex justify-between pointer-events-none px-4">
                {Array.from({ length: 42 }).map((_, idx) => {
                  const freq = 87.5 + idx * 0.5;
                  const isMajor = idx % 2 === 1 || idx === 0 || idx === 41;
                  const showLabel = (idx - 1) % 4 === 0; // 88.0, 92.0, 96.0, 100.0, 104.0, 108.0
                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-between">
                      <div className={`w-[1px] ${isMajor ? 'h-3.5 bg-amber-500/70' : 'h-1.5 bg-amber-500/30'}`} />
                      {showLabel && (
                        <span className="text-[7.5px] font-mono text-amber-500/60 font-semibold leading-none mt-1">
                          {Math.round(freq)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Draggable needle overlay */}
              <div 
                className="absolute top-0 bottom-4 w-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] pointer-events-none z-10 transition-all duration-75"
                style={{ left: needleLeft }}
              />

              {/* Slider input */}
              <input
                type="range"
                min="87.5"
                max="108.0"
                step="0.1"
                value={frequency}
                onChange={(e) => handleFrequencyTuning(Number(e.target.value))}
                className="w-full h-full opacity-0 absolute inset-0 cursor-ew-resize z-20"
              />
            </div>
            
            {/* Tuning feedback toolbar */}
            <div className="flex justify-between items-center mt-2 px-1">
              <button
                onClick={() => handleFrequencyTuning(frequency - 0.1)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-500/80 active:scale-95 transition-all font-mono text-[9px] font-bold border border-zinc-700/50"
              >
                ◀ -0.1 MHz
              </button>
              
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isStatic ? "bg-red-500 animate-pulse-glow" : isPlaying ? "bg-emerald-500 animate-pulse-glow" : "bg-zinc-700"}`} />
                <span className="font-mono text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                  {isStatic ? "STATIC SOUND" : isPlaying ? "STEREO SIGNAL" : "NO SIGNAL"}
                </span>
              </div>
              
              <button
                onClick={() => handleFrequencyTuning(frequency + 0.1)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-500/80 active:scale-95 transition-all font-mono text-[9px] font-bold border border-zinc-700/50"
              >
                +0.1 MHz ▶
              </button>
            </div>
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
                : "bg-white dark:bg-background text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
            const stationFreq = STATION_FREQUENCIES[station.name];
            return (
              <button
                key={station.stationuuid}
                onClick={() => playStation(station)}
                className={`relative text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                  active
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                    : "border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-background hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <span className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${active && isPlaying ? "bg-red-500 animate-pulse-glow" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${active ? "bg-amber-500 text-black" : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300"}`}>
                  <span className="material-symbols-outlined text-base">
                    {active && isBuffering ? "sync" : "radio"}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1 leading-tight">{station.name}</span>
                  {stationFreq && (
                    <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">{stationFreq.toFixed(1)} MHz</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
