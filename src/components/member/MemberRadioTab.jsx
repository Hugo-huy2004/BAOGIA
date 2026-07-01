import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, useAnimation, animate } from "framer-motion";
import Hls from "hls.js";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";
import FeatureGate from "./shared/FeatureGate";

const RADIO_CATEGORIES = [
  { id: "vn_news", icon: "newspaper", labelKey: "utilities.radio.categories.vnNews", names: ["VOV1", "VOV2", "VOV3", "VOV Giao thông Hà Nội", "VOV5 WORLD RADIO", "RFI Tiếng Việt", "VOH FM 87.7"] },
  { id: "intl_news", icon: "public", labelKey: "utilities.radio.categories.intlNews", names: ["BBC World Service", "NPR 24 Hour Program Stream", "CNN", "Fox News Radio", "RTE1"] },
  { id: "music", icon: "music_note", labelKey: "utilities.radio.categories.music", names: ["ZING BOLERO", "M Radio Vietnam", "Cherry Radio Music 247", "CHẠM RADIO", "SWR3", "Heart 80s"] }
];

const STATION_FREQUENCIES = {
  "VOV1": 91.0, "VOV2": 96.5, "VOV3": 102.7, "VOV Giao thông Hà Nội": 91.5, "VOV5 WORLD RADIO": 105.5, "RFI Tiếng Việt": 93.3, "VOH FM 87.7": 87.7,
  "BBC World Service": 88.9, "NPR 24 Hour Program Stream": 90.1, "CNN": 92.5, "Fox News Radio": 94.7, "RTE1": 98.1,
  "ZING BOLERO": 95.0, "M Radio Vietnam": 98.9, "Cherry Radio Music 247": 101.5, "CHẠM RADIO": 104.0, "SWR3": 106.2, "Heart 80s": 107.5
};

const ALL_FREQS = Object.entries(STATION_FREQUENCIES).map(([name, freq]) => ({ name, freq })).sort((a, b) => a.freq - b.freq);

const FALLBACK_STATIONS = {
  vn_news: [
    { stationuuid: "374f3747-fa95-46ee-bc90-953e5e492cda", name: "VOV1", url_resolved: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8" },
    { stationuuid: "0e2d2aa5-e68d-4c74-8b1e-d7ce32d87922", name: "VOV2", url_resolved: "https://str.vov.gov.vn/vovlive/vov2.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov2.sdp_aac/playlist.m3u8" },
    { stationuuid: "888cd26e-dbfa-4be5-a4ee-5dcab947d1a2", name: "VOV3", url_resolved: "https://str.vov.gov.vn/vovlive/vov3.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov3.sdp_aac/playlist.m3u8" },
    { stationuuid: "5e4835a6-ff25-4c6e-8260-eb0df6275815", name: "VOV Giao thông Hà Nội", url_resolved: "https://play.vovgiaothong.vn/live/gthn/playlist.m3u8", url: "https://play.vovgiaothong.vn/live/gthn/playlist.m3u8" },
    { stationuuid: "be42337a-4299-4c28-bb8d-8a4bf5792d47", name: "VOV5 WORLD RADIO", url_resolved: "https://str.vov.gov.vn/vovlive/vov5.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov5.sdp_aac/playlist.m3u8" },
    { stationuuid: "525f2bfa-bc39-44de-9e23-728b783516bd", name: "RFI Tiếng Việt", url_resolved: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3", url: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3" },
    { stationuuid: "voh_87.7", name: "VOH FM 87.7", url_resolved: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8", url: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8" }
  ],
  intl_news: [
    { stationuuid: "a347209e-6ce6-4c94-81ed-003c1275188f", name: "BBC World Service", url_resolved: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service_east_asia", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service_east_asia" },
    { stationuuid: "7ba4c184-fc2b-11e9-bbf2-52543be04c81", name: "NPR 24 Hour Program Stream", url_resolved: "https://npr-ice.streamguys1.com/live.mp3", url: "https://npr-ice.streamguys1.com/live.mp3" },
    { stationuuid: "33178054-56cd-449c-8cf7-412cc7be936a", name: "CNN", url_resolved: "https://tunein.cdnstream1.com/2868_96.mp3", url: "https://tunein.cdnstream1.com/2868_96.mp3" },
    { stationuuid: "510aeeac-e7a0-41c2-aea2-e572e811ffe7", name: "Fox News Radio", url_resolved: "https://live.amperwave.net/direct/foxnewsradio-foxnewsradioaac-imc?source=fnr.web", url: "https://live.amperwave.net/direct/foxnewsradio-foxnewsradioaac-imc?source=fnr.web" },
    { stationuuid: "8643cfcb-a7bb-4c46-8391-fffe266bce16", name: "RTE1", url_resolved: "http://icecast.rte.ie/radio1", url: "http://icecast.rte.ie/radio1" }
  ],
  music: [
    { stationuuid: "afff5851-a5d8-45ed-afe9-bc95915cd3c3", name: "ZING BOLERO", url_resolved: "https://vnno-ne-3-tf-multi-playlist-zmp3.zmdcdn.me/BJ7DyJjfG_E/zhls/playback-realtime/audio/5bace800d4453d1b6454/audio.m3u8", url: "https://vnno-ne-3-tf-multi-playlist-zmp3.zmdcdn.me/BJ7DyJjfG_E/zhls/playback-realtime/audio/5bace800d4453d1b6454/audio.m3u8" },
    { stationuuid: "204b63f8-6629-4984-bbe0-0773c8220a91", name: "M Radio Vietnam", url_resolved: "https://stream-155.zeno.fm/4q7y9hvkp2zuv", url: "https://stream-155.zeno.fm/4q7y9hvkp2zuv" },
    { stationuuid: "3d35f6b4-0ade-42ca-a378-e8f3dfd66426", name: "Cherry Radio Music 247", url_resolved: "https://stream-176.zeno.fm/umt5gqmg3reuv", url: "https://stream-176.zeno.fm/umt5gqmg3reuv" },
    { stationuuid: "fa114bd0-1fef-45ba-b7ac-ebe4d3f22464", name: "CHẠM RADIO", url_resolved: "https://vnno-ne-2-tf-multi-playlist-zmp3.zmdcdn.me/j20SDlO5EQk/zhls/playback-realtime/audio/59a2ee0ed24b3b15625a/audio.m3u8", url: "https://vnno-ne-2-tf-multi-playlist-zmp3.zmdcdn.me/j20SDlO5EQk/zhls/playback-realtime/audio/59a2ee0ed24b3b15625a/audio.m3u8" },
    { stationuuid: "6c0ac59d-c625-458c-9a50-5fac90a73df9", name: "SWR3", url_resolved: "https://liveradio.swr.de/sw331ch/swr3/play.aac", url: "https://liveradio.swr.de/sw331ch/swr3/play.aac" },
    { stationuuid: "962e9a46-0601-11e8-ae97-52543be04c81", name: "Heart 80s", url_resolved: "https://media-ice.musicradio.com/Heart80sMP3", url: "https://media-ice.musicradio.com/Heart80sMP3" }
  ]
};

export default function MemberRadioTab({ onBack, showToast, bio, onBioUpdate }) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(RADIO_CATEGORIES[0].id);
  const [stationsByCategory, setStationsByCategory] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  
  // Robust state management for tuning
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isStatic, setIsStatic] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [volume, setVolume] = useState(70);
  const [visualFreq, setVisualFreq] = useState(91.0); // Displayed frequency
  
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const retriedRef = useRef(false);
  const handleFailureRef = useRef(() => {});

  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const noiseGainRef = useRef(null);
  const tuningTimeoutRef = useRef(null);

  // Modern UI Colors
  const LED_COLOR = "#06b6d4"; // Cyan-500
  const GLOW = "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]";

  const startStaticNoise = useCallback(() => {
    if (noiseSourceRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      // Better brown noise generation for premium feel
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02; // Brownish
        lastOut = data[i];
        data[i] *= 3.5; 
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime((volume / 100) * 0.1, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      noiseSourceRef.current = source;
      noiseGainRef.current = gainNode;
    } catch (err) {}
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
    let minDiff = 0.25; // snap range
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
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (tuningTimeoutRef.current) clearTimeout(tuningTimeoutRef.current);
    };
  }, [stopStaticNoise]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (noiseGainRef.current && audioCtxRef.current) {
      noiseGainRef.current.gain.setValueAtTime((volume / 100) * 0.1, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  const loadCategory = useCallback((categoryId) => {
    const category = RADIO_CATEGORIES.find((c) => c.id === categoryId);
    const fallbacks = FALLBACK_STATIONS[categoryId] || [];

    if (!stationsByCategory[categoryId]) {
      setStationsByCategory((prev) => ({ ...prev, [categoryId]: fallbacks }));
    }

    try {
      fetchStationsByNames(category.names).then((stations) => {
        if (stations && stations.length > 0) {
          const loadedNames = new Set(stations.map(s => s.name.toUpperCase()));
          const loadedUuids = new Set(stations.map(s => s.stationuuid));
          const missing = fallbacks.filter(f => !loadedNames.has(f.name.toUpperCase()) && !loadedUuids.has(f.stationuuid));
          let combined = [...stations, ...missing];
          
          // Final deduplication just in case
          const seen = new Set();
          combined = combined.filter(s => {
            if (seen.has(s.stationuuid)) return false;
            seen.add(s.stationuuid);
            return true;
          });
          
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
      const hls = new Hls({ maxBufferLength: 4, enableWorker: true, lowLatencyMode: true });
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
      const failedUrl = nowPlaying.url_resolved || nowPlaying.url;
      const fresh = await fetchStationByName(nowPlaying.name, failedUrl);
      const freshUrl = fresh?.url_resolved || fresh?.url;
      if (freshUrl && freshUrl !== failedUrl) {
        setIsBuffering(true);
        attachAndPlay(freshUrl);
        return;
      }
    }
    setIsBuffering(false);
    setIsPlaying(false);
    showToast?.(t("utilities.radio.toastPlayError", "Đài này hiện không khả dụng."), "error");
  };

  useEffect(() => { handleFailureRef.current = handlePlaybackFailure; });

  const playStation = async (station) => {
    if (!audioRef.current) return;
    
    stopStaticNoise();
    setIsStatic(false);
    retriedRef.current = false;
    setNowPlaying(station);
    setIsBuffering(true);
    setIsDragging(false);

    const stationFreq = STATION_FREQUENCIES[station.name];
    if (stationFreq !== undefined) setVisualFreq(stationFreq);

    const streamUrl = station.url_resolved || station.url;
    if (streamUrl) {
      attachAndPlay(streamUrl);
      registerStationClick(station.stationuuid);
    }

    try {
      fetchStationByName(station.name).then((fresh) => {
        if (fresh) {
          const freshUrl = fresh.url_resolved || fresh.url;
          if (freshUrl && freshUrl !== streamUrl) {
            setStationsByCategory((prev) => {
              const list = prev[activeCategory] || [];
              return { ...prev, [activeCategory]: list.map(s => s.name === station.name ? { ...s, url_resolved: freshUrl, url: freshUrl } : s) };
            });
          }
        }
      }).catch(() => {});
    } catch (e) {}
  };

  // Called RAPIDLY when user drags the slider
  const handleDialDrag = (val) => {
    setVisualFreq(val);
    if (!isDragging) setIsDragging(true);
    
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setIsBuffering(false);
    startStaticNoise();
    setIsStatic(true);
    setNowPlaying(null);

    if (tuningTimeoutRef.current) clearTimeout(tuningTimeoutRef.current);
    tuningTimeoutRef.current = setTimeout(() => handleDialRelease(val), 500);
  };

  // Called ONCE when the user STOPS dragging (debounced)
  const handleDialRelease = (finalFreq) => {
    setIsDragging(false);
    const match = findClosestStation(finalFreq);
    if (match) {
      // Snapped!
      setVisualFreq(match.frequency);
      if (activeCategory !== match.categoryId) setActiveCategory(match.categoryId);
      playStation(match.station);
    }
    // If no match, it stays on static noise
  };

  const autoScan = (dir) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false); setIsBuffering(false); startStaticNoise(); setIsStatic(true); setNowPlaying(null);
    setIsDragging(true); // Treat scan as drag for UI

    let targetFreq = visualFreq;
    if (dir === "up") {
      const next = ALL_FREQS.find(f => f.freq > visualFreq);
      targetFreq = next ? next.freq : ALL_FREQS[0].freq;
    } else {
      const prev = [...ALL_FREQS].reverse().find(f => f.freq < visualFreq);
      targetFreq = prev ? prev.freq : ALL_FREQS[ALL_FREQS.length - 1].freq;
    }

    // Animate the frequency numbers
    animate(visualFreq, targetFreq, {
      duration: 0.6,
      ease: "easeInOut",
      onUpdate: latest => setVisualFreq(latest),
      onComplete: () => {
        setIsDragging(false);
        const match = findClosestStation(targetFreq);
        if (match) {
          if (activeCategory !== match.categoryId) setActiveCategory(match.categoryId);
          playStation(match.station);
        }
      }
    });
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying || isStatic || isBuffering) {
      audioRef.current.pause();
      setIsPlaying(false); setIsBuffering(false); stopStaticNoise(); setIsStatic(false);
    } else {
      const match = findClosestStation(visualFreq);
      if (match) playStation(match.station);
      else { startStaticNoise(); setIsStatic(true); }
    }
  };

  const stations = stationsByCategory[activeCategory] || [];
  const knobAngle = (volume / 100) * 270 - 135;
  const needleLeft = `calc(0.5rem + (100% - 1rem) * ${(visualFreq - 87.5) / (108.0 - 87.5)})`;

  return (
    <FeatureGate bio={bio} featureKey="hugoRadio" priceJoy={150} icon="radio" title="Trao đổi JOY để mở khóa HugoRadio" description="Nghe radio kỹ thuật số với hàng chục kênh chất lượng cao." onBioUpdate={onBioUpdate} onBack={onBack} className="max-w-lg mx-auto mt-10">
      <div>
        <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-cyan-500" onBack={onBack} />

        {/* ─── Premium Receiver UI ──────────────────────────────────────────────── */}
        <div className="relative mb-6 rounded-3xl bg-zinc-950 p-5 md:p-6 shadow-2xl overflow-hidden border border-zinc-800">
          {/* Glass/Glow Effects */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            
            {/* Top Display Panel */}
            <div className="bg-[#050508] rounded-2xl px-5 py-4 border border-zinc-800 shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${(isPlaying && !isDragging) ? "bg-cyan-400 text-cyan-400 animate-pulse" : (isStatic || isDragging) ? "bg-cyan-900 text-cyan-900" : "bg-zinc-800 text-transparent"}`} />
                  <span className="text-[10px] font-black tracking-widest uppercase text-cyan-500/70">
                    {isDragging ? "TUNING..." : isBuffering ? "CONNECTING..." : isStatic ? "STATIC NOISE" : isPlaying ? "FM STEREO" : nowPlaying ? "PAUSED" : "STANDBY"}
                  </span>
                </div>
                <p className={`font-mono text-[14px] font-bold tracking-wide truncate ${isDragging ? "text-cyan-700 blur-[0.5px]" : "text-cyan-400"} transition-all duration-300`} style={{ textShadow: isDragging ? "none" : "0 0 10px rgba(6,182,212,0.6)" }}>
                  {nowPlaying && !isDragging && !isStatic ? nowPlaying.name : "HUGO DIGITAL RECEIVER"}
                </p>
                
                {/* Visualizer bars */}
                <div className="flex items-end gap-[3px] h-3 mt-3 opacity-80">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="w-[3px] rounded-full origin-bottom" style={{
                      backgroundColor: i > 8 ? "#ef4444" : i > 5 ? "#f59e0b" : "#06b6d4",
                      animationName: (isPlaying && !isDragging) ? "eq-bar" : (isStatic || isDragging) ? "eq-bar" : "none",
                      animationDuration: (isStatic || isDragging) ? `${0.1 + Math.random()*0.2}s` : `${0.4 + (i%3)*0.15}s`,
                      animationIterationCount: "infinite",
                      transform: (isPlaying || isStatic || isDragging) ? "scaleY(1)" : "scaleY(0.2)",
                      boxShadow: (isPlaying && !isDragging) ? `0 0 6px ${i > 8 ? '#ef4444' : i > 5 ? '#f59e0b' : '#06b6d4'}` : "none",
                      height: "100%",
                      transition: "transform 0.2s"
                    }} />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between font-mono select-none">
                <div className="flex items-baseline gap-1">
                  <span className="text-cyan-400 text-4xl font-black tracking-tighter" style={{ textShadow: "0 0 16px rgba(6,182,212,0.7)" }}>
                    {visualFreq.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-600">MHz</span>
                </div>
              </div>
            </div>

            {/* Dial and Controls */}
            <div className="flex flex-col gap-4">
              {/* Dial Track */}
              <div className="relative h-14 bg-zinc-900 rounded-xl border-y border-zinc-700/50 px-2 overflow-hidden shadow-inner cursor-ew-resize">
                {/* Ticks */}
                <div className="absolute inset-x-0 top-0 bottom-0 flex justify-between pointer-events-none px-4">
                  {Array.from({ length: 42 }).map((_, idx) => {
                    const f = 87.5 + idx * 0.5;
                    const isMajor = idx % 2 === 1 || idx === 0 || idx === 41;
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-start">
                        <div className={`w-[2px] ${isMajor ? 'h-4 bg-zinc-600' : 'h-2 bg-zinc-700'}`} />
                        {(idx - 1) % 4 === 0 && (
                          <span className="text-[8px] font-mono text-zinc-500 font-bold mt-1.5">{Math.round(f)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Glowing Needle */}
                <div className="absolute top-0 bottom-0 w-1 bg-cyan-400 pointer-events-none z-10 rounded-full" style={{ left: needleLeft, boxShadow: "0 0 12px 2px rgba(6,182,212,0.9)" }} />

                <input type="range" min="87.5" max="108.0" step="0.1" value={visualFreq} onChange={(e) => handleDialDrag(Number(e.target.value))}
                       onPointerDown={() => setIsDragging(true)} onPointerUp={() => { if (isDragging) handleDialRelease(visualFreq); }}
                       className="w-full h-full opacity-0 absolute inset-0 cursor-ew-resize z-20 touch-none" />
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between px-2">
                <button onClick={() => autoScan("down")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-cyan-500 active:scale-95 transition-all font-bold text-[10px] tracking-wider uppercase border border-zinc-700">
                  <span className="material-symbols-outlined text-[14px]">skip_previous</span>
                  <span>Scan</span>
                </button>
                
                {/* Big Play Button */}
                <button onClick={togglePlayPause} className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 text-black flex items-center justify-center active:scale-95 transition-transform shadow-[0_8px_30px_rgba(6,182,212,0.5)] border border-cyan-300/50">
                  <span className="material-symbols-outlined text-3xl">{(isPlaying || isStatic || isBuffering) ? "power_settings_new" : "play_arrow"}</span>
                </button>
                
                <button onClick={() => autoScan("up")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-cyan-500 active:scale-95 transition-all font-bold text-[10px] tracking-wider uppercase border border-zinc-700">
                  <span>Scan</span>
                  <span className="material-symbols-outlined text-[14px]">skip_next</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>

        {/* ─── Band Navigation ──────────────────────────────────────────────── */}
        <div className="flex mb-5 p-1 rounded-2xl bg-zinc-200/50 dark:bg-zinc-900">
          {RADIO_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold transition-all ${
                  active ? "bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}>
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span className="hidden sm:inline">{t(cat.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Station Grid ──────────────────────────────────────────────── */}
        {loadingCategory === activeCategory ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> {t("companion.tab.loading", "Đang tải...")}
          </div>
        ) : stations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
            {t("utilities.radio.noStations", "Không tìm thấy đài nào.")}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stations.map((station) => {
              const active = nowPlaying?.stationuuid === station.stationuuid;
              const stationFreq = STATION_FREQUENCIES[station.name];
              return (
                <button key={station.stationuuid} onClick={() => playStation(station)}
                  className={`group text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-3 relative overflow-hidden ${
                    active ? "border-cyan-500/50 bg-cyan-50 dark:bg-cyan-950/30" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-cyan-300 dark:hover:border-cyan-700"
                  }`}>
                  {/* Subtle active glow */}
                  {active && <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/20 blur-2xl rounded-full" />}
                  
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                      active ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-500"
                    }`}>
                      <span className={`material-symbols-outlined text-[20px] ${active && isPlaying && !isDragging ? "animate-pulse" : ""}`}>
                        {active && (isBuffering || isDragging) ? "sync" : active && isPlaying ? "graphic_eq" : "radio"}
                      </span>
                    </div>
                    {active && <span className="flex h-2 w-2 relative mt-1 mr-1">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying && !isDragging ? "bg-cyan-400 opacity-75" : "bg-zinc-400 opacity-0"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying && !isDragging ? "bg-cyan-500" : "bg-zinc-400"}`}></span>
                    </span>}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[12px] font-bold line-clamp-1 leading-tight ${active ? "text-cyan-700 dark:text-cyan-400" : "text-zinc-800 dark:text-zinc-200"}`}>{station.name}</span>
                    {stationFreq && (
                      <span className={`text-[9px] font-mono font-bold mt-1 ${active ? "text-cyan-600/80 dark:text-cyan-400/80" : "text-zinc-400 dark:text-zinc-500"}`}>
                        {stationFreq.toFixed(1)} MHz
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
