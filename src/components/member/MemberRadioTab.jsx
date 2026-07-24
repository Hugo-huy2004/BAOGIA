import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, useAnimation, animate } from "framer-motion";
import Hls from "hls.js";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";
import FeatureGate from "./shared/FeatureGate";

const RADIO_CATEGORIES = [
  { id: "vn_news", icon: "newspaper", label: "Đài Việt Nam", labelKey: "utilities.radio.categories.vnNews", names: ["VOV1", "VOV2", "VOV3", "VOV Giao thông Hà Nội", "VOV5 WORLD RADIO", "RFI Tiếng Việt", "VOH FM 87.7"] },
  { id: "intl_news", icon: "public", label: "Tin Tức Quốc Tế", labelKey: "utilities.radio.categories.intlNews", names: ["BBC World Service", "NPR 24 Hour Program Stream", "CNN", "Fox News Radio", "RTE1"] },
  { id: "music", icon: "music_note", label: "Âm Nhạc", labelKey: "utilities.radio.categories.music", names: ["ZING BOLERO", "M Radio Vietnam", "Cherry Radio Music 247", "CHẠM RADIO", "SWR3", "Heart 80s"] },
  { id: "lofi_chill", icon: "headphones", label: "Lofi & Tập Trung", labelKey: "utilities.radio.categories.lofiChill", names: ["Lofi Girl Radio", "Chillhop Radio", "Smooth Jazz 247", "Classical FM", "Chillout Lounge"] },
  { id: "sports_talk", icon: "podcasts", label: "Thể Thao & Talk", labelKey: "utilities.radio.categories.sportsTalk", names: ["ESPN Radio", "TalkSPORT", "CBC Radio One", "Radio France Internationale"] }
];

const STATION_FREQUENCIES = {
  "VOV1": 91.0, "VOV2": 96.5, "VOV3": 102.7, "VOV Giao thông Hà Nội": 91.5, "VOV5 WORLD RADIO": 105.5, "RFI Tiếng Việt": 93.3, "VOH FM 87.7": 87.7,
  "BBC World Service": 88.9, "NPR 24 Hour Program Stream": 90.1, "CNN": 92.5, "Fox News Radio": 94.7, "RTE1": 98.1,
  "ZING BOLERO": 95.0, "M Radio Vietnam": 98.9, "Cherry Radio Music 247": 101.5, "CHẠM RADIO": 104.0, "SWR3": 106.2, "Heart 80s": 107.5,
  "Lofi Girl Radio": 88.5, "Chillhop Radio": 92.1, "Smooth Jazz 247": 97.3, "Classical FM": 100.1, "Chillout Lounge": 103.5,
  "ESPN Radio": 89.5, "TalkSPORT": 94.1, "CBC Radio One": 99.5, "Radio France Internationale": 106.8
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
  ],
  lofi_chill: [
    { stationuuid: "lofi_girl_01", name: "Lofi Girl Radio", url_resolved: "https://stream.zeno.fm/f3wvbbqmdg8uv", url: "https://stream.zeno.fm/f3wvbbqmdg8uv" },
    { stationuuid: "chillhop_02", name: "Chillhop Radio", url_resolved: "https://stream.zeno.fm/0r0xa792kwzuv", url: "https://stream.zeno.fm/0r0xa792kwzuv" },
    { stationuuid: "smooth_jazz_03", name: "Smooth Jazz 247", url_resolved: "https://stream.zeno.fm/n2p984hkp2zuv", url: "https://stream.zeno.fm/n2p984hkp2zuv" },
    { stationuuid: "classical_04", name: "Classical FM", url_resolved: "https://media-ice.musicradio.com/ClassicFMMP3", url: "https://media-ice.musicradio.com/ClassicFMMP3" },
    { stationuuid: "chillout_05", name: "Chillout Lounge", url_resolved: "https://stream.zeno.fm/80y7y0wkp2zuv", url: "https://stream.zeno.fm/80y7y0wkp2zuv" }
  ],
  sports_talk: [
    { stationuuid: "espn_01", name: "ESPN Radio", url_resolved: "https://live.amperwave.net/direct/espn-espnradioaac-imc", url: "https://live.amperwave.net/direct/espn-espnradioaac-imc" },
    { stationuuid: "talksport_02", name: "TalkSPORT", url_resolved: "https://talksport-radio.streamguys1.com/talksport-live.mp3", url: "https://talksport-radio.streamguys1.com/talksport-live.mp3" },
    { stationuuid: "cbc_03", name: "CBC Radio One", url_resolved: "https://cbclive.akamaized.net/hls/live/2041060/cbc_r1_tor/master.m3u8", url: "https://cbclive.akamaized.net/hls/live/2041060/cbc_r1_tor/master.m3u8" },
    { stationuuid: "rfi_04", name: "Radio France Internationale", url_resolved: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3", url: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3" }
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

  // Apple Sleep Timer State (null | 15 | 30 | 60)
  const [sleepTimer, setSleepTimer] = useState(null);
  const [sleepTimeLeft, setSleepTimeLeft] = useState(0);

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
      if (ctx.state === "suspended") ctx.resume();

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
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
      } catch {}
      noiseSourceRef.current = null;
    }
    noiseGainRef.current = null;
  }, []);

  // Sleep Timer Countdown & Fade Out
  useEffect(() => {
    if (!sleepTimer || !isPlaying) {
      setSleepTimeLeft(0);
      return;
    }
    setSleepTimeLeft(sleepTimer * 60);

    const interval = setInterval(() => {
      setSleepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          stopStaticNoise();
          setSleepTimer(null);
          showToast?.("🌙 Hẹn giờ tắt: Đã tự động dừng phát HugoRadio. Chúc bạn ngủ ngon!", "info");
          return 0;
        }
        if (prev <= 15 && audioRef.current) {
          audioRef.current.volume = Math.max(0, (prev / 15) * (volume / 100));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying, volume, stopStaticNoise, showToast]);

  const cycleSleepTimer = () => {
    if (!sleepTimer) setSleepTimer(15);
    else if (sleepTimer === 15) setSleepTimer(30);
    else if (sleepTimer === 30) setSleepTimer(60);
    else setSleepTimer(null);
  };

  const formatSleepTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const findClosestStation = useCallback((freq) => {
    let closest = null;
    let minDiff = 0.25;
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
    } catch {}
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

  handleFailureRef.current = handlePlaybackFailure;

  const playStation = (station) => {
    if (nowPlaying?.stationuuid === station.stationuuid && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopStaticNoise();
      return;
    }

    retriedRef.current = false;
    stopStaticNoise();
    setNowPlaying(station);
    setIsBuffering(true);
    setIsStatic(false);
    setIsPlaying(false);

    const freq = STATION_FREQUENCIES[station.name];
    if (freq) setVisualFreq(freq);

    const streamUrl = station.url_resolved || station.url;
    if (streamUrl) {
      attachAndPlay(streamUrl);
      registerStationClick(station.stationuuid);
    } else {
      handlePlaybackFailure();
    }
  };

  const handleDialDrag = (freq) => {
    setVisualFreq(freq);
    setIsDragging(true);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    startStaticNoise();
    setIsStatic(true);
  };

  const handleDialRelease = (freq) => {
    setIsDragging(false);
    const closest = findClosestStation(freq);

    if (tuningTimeoutRef.current) clearTimeout(tuningTimeoutRef.current);

    if (closest) {
      setVisualFreq(closest.frequency);
      if (activeCategory !== closest.categoryId) {
        setActiveCategory(closest.categoryId);
      }
      tuningTimeoutRef.current = setTimeout(() => {
        playStation(closest.station);
      }, 150);
    } else {
      tuningTimeoutRef.current = setTimeout(() => {
        stopStaticNoise();
        setIsStatic(false);
      }, 1200);
    }
  };

  const autoScan = (direction) => {
    const step = direction === "up" ? 0.5 : -0.5;
    let nextFreq = visualFreq + step;
    if (nextFreq > 108.0) nextFreq = 87.5;
    if (nextFreq < 87.5) nextFreq = 108.0;

    let target = null;
    let curr = nextFreq;

    for (let i = 0; i < 40; i++) {
      const match = findClosestStation(curr);
      if (match) {
        target = match;
        break;
      }
      curr += step;
      if (curr > 108.0) curr = 87.5;
      if (curr < 87.5) curr = 108.0;
    }

    if (target) {
      handleDialDrag(target.frequency);
      setTimeout(() => {
        handleDialRelease(target.frequency);
      }, 300);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopStaticNoise();
    } else if (nowPlaying) {
      playStation(nowPlaying);
    } else {
      const firstCat = stationsByCategory[activeCategory];
      if (firstCat && firstCat.length > 0) {
        playStation(firstCat[0]);
      }
    }
  };

  const stations = stationsByCategory[activeCategory] || [];
  const needleLeft = `calc(0.5rem + (100% - 1rem) * ${(visualFreq - 87.5) / (108.0 - 87.5)})`;

  return (
    <FeatureGate bio={bio} featureKey="hugoRadio" priceJoy={150} icon="radio" title="Trao đổi JOY để mở khóa HugoRadio" description="Nghe radio kỹ thuật số với hàng chục kênh chất lượng cao." onBioUpdate={onBioUpdate} onBack={onBack} className="max-w-lg mx-auto mt-10">
      <div className="text-zinc-900 dark:text-white transition-colors duration-300">
        <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-info" onBack={onBack} />

        {/* ─── Apple Music Style Receiver Player ──────────────────────────────────── */}
        <div className="relative mb-6 rounded-[36px] bg-white/80 dark:bg-[#0e0f17]/90 p-5 md:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden transition-all duration-300">
          {/* Glass/Glow Ambient Highlights */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/15 dark:bg-cyan-500/20 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/15 dark:bg-purple-500/20 rounded-full blur-[70px] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">

            {/* Top Apple Display Screen */}
            <div className="bg-zinc-100/90 dark:bg-[#05060b]/90 rounded-2xl px-5 py-4 border border-zinc-200/90 dark:border-white/10 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${(isPlaying && !isDragging) ? "bg-[#06b6d4] text-[#06b6d4] animate-pulse" : (isStatic || isDragging) ? "bg-[#06b6d4]/40 text-[#06b6d4]" : "bg-zinc-400 dark:bg-zinc-700 text-transparent"}`} />
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#06b6d4] dark:text-[#06b6d4]">
                    {isDragging ? "TUNING..." : isBuffering ? "CONNECTING..." : isStatic ? "STATIC NOISE" : isPlaying ? "FM STEREO" : nowPlaying ? "PAUSED" : "STANDBY"}
                  </span>
                </div>
                <p className="font-sans text-base font-extrabold tracking-tight truncate text-zinc-900 dark:text-white transition-all">
                  {nowPlaying && !isDragging && !isStatic ? nowPlaying.name : "HUGO DIGITAL RADIO"}
                </p>

                {/* Apple Live Equalizer Bars */}
                <div className="flex items-end gap-[3.5px] h-3.5 mt-3 opacity-90">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span key={i} className="w-[3px] rounded-full origin-bottom" style={{
                      backgroundColor: i > 10 ? "#ef4444" : i > 6 ? "#f59e0b" : "#06b6d4",
                      animationName: (isPlaying && !isDragging) ? "eq-bar" : (isStatic || isDragging) ? "eq-bar" : "none",
                      animationDuration: (isStatic || isDragging) ? `${0.1 + Math.random()*0.2}s` : `${0.35 + (i%3)*0.12}s`,
                      animationIterationCount: "infinite",
                      transform: (isPlaying || isStatic || isDragging) ? "scaleY(1)" : "scaleY(0.2)",
                      height: "100%",
                      transition: "transform 0.2s"
                    }} />
                  ))}
                </div>
              </div>

              {/* Digital Frequency Badge & Sleep Timer Pill */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 font-mono select-none">
                <div className="flex items-baseline gap-1 bg-cyan-500/10 dark:bg-cyan-500/20 px-3.5 py-1.5 rounded-2xl border border-cyan-500/30">
                  <span className="text-[#06b6d4] text-3xl font-black tracking-tighter">
                    {visualFreq.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-[#06b6d4]">MHz</span>
                </div>

                {/* Apple Sleep Timer Button */}
                <button
                  onClick={cycleSleepTimer}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
                    sleepTimer
                      ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse"
                      : "bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">bedtime</span>
                  <span>{sleepTimer ? `TẮT ${formatSleepTime(sleepTimeLeft)}` : "HẸN GIỜ TẮT"}</span>
                </button>
              </div>
            </div>

            {/* Tuning Dial Track & Needle */}
            <div className="flex flex-col gap-4">
              <div className="relative h-14 bg-zinc-200/80 dark:bg-zinc-900/90 rounded-2xl border border-zinc-300 dark:border-white/10 px-2 overflow-hidden shadow-inner cursor-ew-resize transition-colors">
                <div className="absolute inset-x-0 top-0 bottom-0 flex justify-between pointer-events-none px-4">
                  {Array.from({ length: 42 }).map((_, idx) => {
                    const f = 87.5 + idx * 0.5;
                    const isMajor = idx % 2 === 1 || idx === 0 || idx === 41;
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-start">
                        <div className={`w-[2px] ${isMajor ? 'h-4 bg-zinc-500 dark:bg-zinc-500' : 'h-2 bg-zinc-300 dark:bg-zinc-700'}`} />
                        {(idx - 1) % 4 === 0 && (
                          <span className="text-[8px] font-mono text-zinc-600 dark:text-zinc-400 font-bold mt-1.5">{Math.round(f)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Glowing Apple Needle */}
                <div className="absolute top-0 bottom-0 w-1 bg-[#06b6d4] pointer-events-none z-10 rounded-full" style={{ left: needleLeft, boxShadow: "0 0 12px 2px rgba(6,182,212,0.9)" }} />

                <input type="range" min="87.5" max="108.0" step="0.1" value={visualFreq} onChange={(e) => handleDialDrag(Number(e.target.value))}
                       onPointerDown={() => setIsDragging(true)} onPointerUp={() => { if (isDragging) handleDialRelease(visualFreq); }}
                       className="w-full h-full opacity-0 absolute inset-0 cursor-ew-resize z-20 touch-none" />
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between px-1">
                <button onClick={() => autoScan("down")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white active:scale-95 transition-all font-black text-xs tracking-wider uppercase border border-zinc-200 dark:border-white/10 shadow-sm">
                  <span className="material-symbols-outlined text-base">skip_previous</span>
                  <span>Scan</span>
                </button>

                {/* Apple Play / Power Button */}
                <button onClick={togglePlayPause} className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-tr from-[#06b6d4] to-indigo-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_10px_30px_rgba(6,182,212,0.4)] border border-white/30">
                  <span className="material-symbols-outlined text-3xl">{(isPlaying || isStatic || isBuffering) ? "power_settings_new" : "play_arrow"}</span>
                </button>

                <button onClick={() => autoScan("up")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white active:scale-95 transition-all font-black text-xs tracking-wider uppercase border border-zinc-200 dark:border-white/10 shadow-sm">
                  <span>Scan</span>
                  <span className="material-symbols-outlined text-base">skip_next</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Apple Category Selector Pills ───────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto mb-6 p-1.5 rounded-full bg-zinc-100 dark:bg-[#141522]/90 border border-zinc-200/80 dark:border-white/10 transition-colors no-scrollbar">
          {RADIO_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                  active ? "bg-[#06b6d4] text-white shadow-[0_4px_14px_rgba(6,182,212,0.4)]" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}>
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                <span>{cat.label || t(cat.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Station Grid Cards ────────────────────────────────────────────────── */}
        {loadingCategory === activeCategory ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> {t("companion.tab.loading", "Đang tải...")}
          </div>
        ) : stations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
            {t("utilities.radio.noStations", "Không tìm thấy đài nào.")}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {stations.map((station) => {
              const active = nowPlaying?.stationuuid === station.stationuuid;
              const stationFreq = STATION_FREQUENCIES[station.name];
              return (
                <button key={station.stationuuid} onClick={() => playStation(station)}
                  className={`group text-left p-4 rounded-2xl border transition-all flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl ${
                    active
                      ? "border-[#06b6d4] bg-cyan-500/10 dark:bg-cyan-500/20 text-zinc-900 dark:text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#141522]/90 hover:border-[#06b6d4]/50 dark:hover:border-[#06b6d4]/50 text-zinc-900 dark:text-white shadow-sm"
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${
                      active ? "bg-gradient-to-br from-[#06b6d4] to-indigo-600 text-white shadow-md" : "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 group-hover:text-[#06b6d4]"
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${active && isPlaying && !isDragging ? "animate-pulse" : ""}`}>
                        {active && (isBuffering || isDragging) ? "sync" : active && isPlaying ? "graphic_eq" : "radio"}
                      </span>
                    </div>
                    {active && (
                      <span className="flex h-2.5 w-2.5 relative mt-1 mr-1">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying && !isDragging ? "bg-[#06b6d4] opacity-75" : "bg-zinc-400 opacity-0"}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying && !isDragging ? "bg-[#06b6d4]" : "bg-zinc-400"}`}></span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black line-clamp-1 leading-tight">{station.name}</span>
                    {stationFreq && (
                      <span className="text-[10px] font-mono font-bold mt-1 text-[#06b6d4]">
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
