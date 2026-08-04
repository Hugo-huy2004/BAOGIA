import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";
import {
  orderedUrls, recordOk, recordFail, stationStatus, pickRandom, learnedUrl,
  resolveByName, rememberFound, forgetFound, foundStations, lastStationId,
} from "../../services/radioBrain";
import { setMediaSession, setMediaPlaybackState } from "../../services/mediaSession";
import RadioTokenStatus, { useRadioHeartbeat } from "./RadioTokenStatus";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Đài hỏng thì tự nhảy sang đài khác, nhưng có trần: mỗi lần nhảy là một lượt
// dò trên máy chủ, mất sóng cả cụm thì đừng biến thành vòng lặp gọi mạng.
const MAX_AUTO_SKIP = 3;

const FOUND_CATEGORY = "found";
const STATUS_DOT = {
  good: "bg-emerald-500",
  shaky: "bg-amber-500",
  dead: "bg-zinc-400 dark:bg-zinc-600",
  unknown: "bg-transparent",
};
const STATUS_TITLE = {
  good: "Đài này phát tốt",
  shaky: "Đài này chập chờn",
  dead: "Đài này đang hỏng — sẽ thử lại sau một ngày",
  unknown: "Chưa thử đài này",
};

// Đài tự tìm được lưu dạng { id, name, url } — đổi sang đúng hình dạng mà phần
// còn lại của trang đang dùng.
const toStation = (found) => ({
  stationuuid: found.id,
  name: found.name,
  url_resolved: found.url,
  url: found.url,
  found: true,
});

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

  // HugoRadio token system
  const [showStore, setShowStore] = useState(false);
  const { tokenStatus, refetch: refetchTokens } = useRadioHeartbeat(bio, isPlaying);

  // Đài người dùng tự tìm, nhớ trong máy giữa các phiên.
  const [foundList, setFoundList] = useState(foundStations);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  // Đổi số này để bảng đài vẽ lại sau khi sổ theo dõi thay đổi.
  const [healthTick, setHealthTick] = useState(0);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const retriedRef = useRef(false);
  const handleFailureRef = useRef(() => {});
  // Lượt phát hiện tại: đài nào, còn những địa chỉ nào chưa thử.
  const attemptRef = useRef({ station: null, urls: [], index: 0 });
  // Nút "chuyển kênh" trên màn hình khoá cần hàm bốc ngẫu nhiên, mà hàm đó khai
  // báo bên dưới — giữ qua ref để effect ở trên gọi được bản mới nhất.
  const playRandomRef = useRef(() => {});
  const autoSkipRef = useRef({ count: 0, skipped: [] });

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
    audio.onplaying = () => {
      setIsPlaying(true); setIsBuffering(false); setIsStatic(false); stopStaticNoise();
      // Ghi vào sổ đúng địa chỉ vừa phát được — lần sau vào thẳng đường này.
      const { station, urls, index } = attemptRef.current;
      if (station) {
        recordOk(station.stationuuid, urls[index]);
        setHealthTick((tick) => tick + 1);
      }
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onwaiting = () => setIsBuffering(true);
    audio.onerror = () => handleFailureRef.current();
    audioRef.current = audio;
    return () => {
      playbackRequestRef.current += 1;
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

  // ponytail: resolve each category from the server ONCE per session. Was
  // refetching in a loop (loadCategory depended on stationsByCategory, so every
  // successful load recreated it and re-ran the effect) — that hammered
  // /api/radio (search + stream health-checks) = the bulk of Radio egress.
  const loadedCategoriesRef = useRef(new Set());

  const loadCategory = useCallback((categoryId) => {
    if (loadedCategoriesRef.current.has(categoryId)) return;
    const category = RADIO_CATEGORIES.find((c) => c.id === categoryId);
    // Danh mục "Đã tìm" nằm sẵn trong máy, không có gì để tải.
    if (!category) return;
    const fallbacks = FALLBACK_STATIONS[categoryId] || [];

    setStationsByCategory((prev) => (prev[categoryId] ? prev : { ...prev, [categoryId]: fallbacks }));

    try {
      fetchStationsByNames(category.names).then((stations) => {
        if (stations && stations.length > 0) {
          loadedCategoriesRef.current.add(categoryId);
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
  }, []);

  useEffect(() => {
    loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  const attachAndPlay = async (streamUrl) => {
    const audio = audioRef.current;
    const onPlayError = () => handlePlaybackFailure();
    const requestId = ++playbackRequestRef.current;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = streamUrl.includes(".m3u8");
    if (isHls && audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = streamUrl;
      audio.play().catch(onPlayError);
    } else if (isHls) {
      // hls.js is ~500 KB minified. Safari/iOS can play HLS natively, and
      // non-HLS stations never need it, so load the library only on demand.
      try {
        const { default: Hls } = await import("hls.js");
        if (requestId !== playbackRequestRef.current || !audioRef.current) return;
        if (!Hls.isSupported()) {
          onPlayError();
          return;
        }
        const hls = new Hls({ maxBufferLength: 4, enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (requestId === playbackRequestRef.current) audio.play().catch(onPlayError);
        });
        hls.on(Hls.Events.ERROR, (_evt, data) => { if (data.fatal) onPlayError(); });
        hlsRef.current = hls;
      } catch {
        onPlayError();
      }
    } else {
      audio.src = streamUrl;
      audio.play().catch(onPlayError);
    }
  };

  // Ba nấc khi một đài không phát được, đi từ rẻ tới đắt:
  //   1. Còn địa chỉ khác của chính đài đó (đường đã học được, url_resolved, url).
  //   2. Hỏi máy chủ một lượt xem đài này giờ phát ở đâu, rồi NHỚ đường mới.
  //   3. Ghi đài hỏng vào sổ và tự nhảy sang đài khoẻ khác trong danh mục.
  // Trước đây chỉ có nấc 2 và địa chỉ chữa được không hề được ghi nhớ — mỗi lần
  // mở lại trang là lặp lại y nguyên cú thử vào địa chỉ đã chết.
  const handlePlaybackFailure = async () => {
    const attempt = attemptRef.current;
    const station = attempt.station || nowPlaying;

    if (attempt.index + 1 < attempt.urls.length) {
      attempt.index += 1;
      setIsBuffering(true);
      attachAndPlay(attempt.urls[attempt.index]);
      return;
    }

    if (!retriedRef.current && station) {
      retriedRef.current = true;
      const failedUrl = attempt.urls[attempt.index] || station.url_resolved || station.url;
      // strict: đang chữa luồng chết, đài chưa xác minh được thì thà bỏ qua.
      const fresh = await fetchStationByName(station.name, failedUrl, true);
      const freshUrl = fresh?.url_resolved || fresh?.url;
      if (freshUrl && freshUrl !== failedUrl) {
        attempt.urls = [...attempt.urls, freshUrl];
        attempt.index = attempt.urls.length - 1;
        setIsBuffering(true);
        attachAndPlay(freshUrl);
        return;
      }
    }

    if (station) {
      recordFail(station.stationuuid);
      setHealthTick((tick) => tick + 1);
      autoSkipRef.current.skipped = [...autoSkipRef.current.skipped, station.stationuuid];
    }

    const pool = activeCategory === FOUND_CATEGORY
      ? foundList.map(toStation)
      : (stationsByCategory[activeCategory] || []);
    const next = autoSkipRef.current.count < MAX_AUTO_SKIP
      ? pickRandom(pool, { exclude: autoSkipRef.current.skipped, idOf: (item) => item.stationuuid })
      : null;

    if (next) {
      autoSkipRef.current.count += 1;
      showToast?.(`${station?.name || "Đài này"} không kết nối được — chuyển sang ${next.name}.`, "info");
      playStation(next, { chained: true });
      return;
    }

    setIsBuffering(false);
    setIsPlaying(false);
    showToast?.(t("utilities.radio.toastPlayError", "Đài này hiện không khả dụng."), "error");
  };

  handleFailureRef.current = handlePlaybackFailure;

  const playStation = (station, { chained = false } = {}) => {
    // Check token before playing
    if (tokenStatus && !tokenStatus.canListen) {
      showToast?.("Hết thời gian nghe radio. Vui lòng mua thêm gói thời gian.", "warning");
      return;
    }

    if (nowPlaying?.stationuuid === station.stationuuid && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopStaticNoise();
      return;
    }

    retriedRef.current = false;
    if (!chained) autoSkipRef.current = { count: 0, skipped: [] };
    stopStaticNoise();
    setNowPlaying(station);
    setIsBuffering(true);
    setIsStatic(false);
    setIsPlaying(false);

    const freq = STATION_FREQUENCIES[station.name];
    if (freq) setVisualFreq(freq);

    // Đường đã học được đứng trước — nó là đường lần trước phát thật sự chạy.
    const urls = orderedUrls(station.stationuuid, [station.url_resolved, station.url]);
    attemptRef.current = { station, urls, index: 0 };
    if (urls.length) {
      attachAndPlay(urls[0]);
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
    } else if (tokenStatus && !tokenStatus.canListen) {
      showToast?.("Hết thời gian nghe radio. Vui lòng mua thêm gói thời gian.", "warning");
      return;
    } else if (nowPlaying) {
      playStation(nowPlaying);
    } else {
      // Mở app rồi bấm phát: tiếp tục đúng đài lần trước, không phải đài đầu danh sách.
      const pool = stationsByCategory[activeCategory] || [];
      const last = pool.find((item) => item.stationuuid === lastStationId());
      const target = last || pool[0];
      if (target) playStation(target);
    }
  };

  // Màn hình khoá / thanh thông báo / nút trên tai nghe.
  useEffect(() => {
    if (!nowPlaying) return;
    setMediaSession(nowPlaying, {
      onPlay: () => playStation(nowPlaying),
      onPause: () => { audioRef.current?.pause(); setIsPlaying(false); },
      onStop: () => { audioRef.current?.pause(); setIsPlaying(false); },
      onNext: () => playRandomRef.current(),
    });
    setMediaPlaybackState(isPlaying ? "playing" : "paused");
    // playStation đọc state mới nhất qua closure của lần render này.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying, isPlaying]);

  // Auto-pause when tokens run out
  useEffect(() => {
    if (tokenStatus && !tokenStatus.canListen && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopStaticNoise();
      showToast?.("Hết thời gian nghe radio. Vui lòng mua thêm gói thời gian.", "warning");
    }
  }, [tokenStatus, isPlaying, stopStaticNoise, showToast]);

  const stations = activeCategory === FOUND_CATEGORY
    ? foundList.map(toStation)
    : (stationsByCategory[activeCategory] || []);
  const needleLeft = `calc(0.5rem + (100% - 1rem) * ${(visualFreq - 87.5) / (108.0 - 87.5)})`;

  // Bốc một đài khoẻ bất kỳ trong danh mục đang xem. Đài từng phát được có
  // trọng số gấp ba, đài đang hỏng bị loại — nên "ngẫu nhiên" gần như luôn ra
  // tiếng ngay lần đầu.
  const playRandom = () => {
    const next = pickRandom(stations, {
      exclude: nowPlaying ? [nowPlaying.stationuuid] : [],
      idOf: (item) => item.stationuuid,
    });
    if (next) playStation(next);
  };
  playRandomRef.current = playRandom;

  const submitSearch = async (event) => {
    event.preventDefault();
    const name = search.trim();
    if (!name || searching) return;
    setSearching(true);
    try {
      const found = await resolveByName(name);
      if (!found) {
        showToast?.(`Không tìm thấy đài nào tên “${name}”.`, "warning");
        return;
      }
      rememberFound(found);
      setFoundList(foundStations());
      setSearch("");
      setActiveCategory(FOUND_CATEGORY);
      playStation(toStation(found));
    } catch {
      showToast?.("Không hỏi được máy chủ tìm đài. Kiểm tra mạng rồi thử lại.", "error");
    } finally {
      setSearching(false);
    }
  };

  const dropFound = (id) => {
    forgetFound(id);
    const remaining = foundStations();
    setFoundList(remaining);
    if (!remaining.length) setActiveCategory(RADIO_CATEGORIES[0].id);
  };

  return (
    <div className="text-zinc-900 dark:text-white transition-colors duration-300">
      <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-info" onBack={onBack} />

      {/* Token Status Bar */}
      <div className="mb-4">
        <RadioTokenStatus bio={bio} onBuyMore={() => setShowStore(true)} />
      </div>

        {/* ─── Máy thu ─────────────────────────────────────────────────────────────
            Phẳng và tĩnh: nền đặc, viền mảnh, một màu nhấn duy nhất (info).
            Bỏ hẳn lớp mờ, quầng sáng, gradient và dải equalizer nhấp nháy — dải
            đó không nói lên điều gì về âm thanh thật mà vẫn bắt máy vẽ lại liên tục. */}
        <div className="mb-5 rounded-2xl bg-card border border-border p-4 md:p-5 flex flex-col gap-4">

            {/* Màn hình hiển thị */}
            <div className="bg-muted rounded-xl px-4 py-3.5 border border-border flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isPlaying && !isDragging ? "bg-info" : (isStatic || isDragging || isBuffering) ? "bg-muted-foreground" : "bg-transparent border border-muted-foreground/50"
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {isDragging ? "Đang dò" : isBuffering ? "Đang kết nối" : isStatic ? "Nhiễu sóng" : isPlaying ? "Đang phát" : nowPlaying ? "Tạm dừng" : "Chờ"}
                  </span>
                </div>
                <p className="text-[17px] font-bold leading-tight truncate text-foreground">
                  {nowPlaying && !isDragging && !isStatic ? nowPlaying.name : "HugoRadio"}
                </p>
                {nowPlaying && (
                  <p className="text-[13px] text-muted-foreground mt-1 truncate">
                    {STATUS_TITLE[stationStatus(nowPlaying.stationuuid)]}
                    {healthTick >= 0 && learnedUrl(nowPlaying.stationuuid) ? " · đã học địa chỉ mới" : ""}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <span className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                  {visualFreq.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-muted-foreground ml-1">MHz</span>
              </div>
            </div>

            {/* Thanh dò sóng */}
            <div className="flex flex-col gap-4">
              <div className="relative h-14 bg-muted rounded-xl border border-border px-2 overflow-hidden cursor-ew-resize">
                <div className="absolute inset-x-0 top-0 bottom-0 flex justify-between pointer-events-none px-4">
                  {Array.from({ length: 42 }).map((_, idx) => {
                    const f = 87.5 + idx * 0.5;
                    const isMajor = idx % 2 === 1 || idx === 0 || idx === 41;
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-start">
                        <div className={`w-px bg-border ${isMajor ? "h-4" : "h-2"}`} />
                        {(idx - 1) % 4 === 0 && (
                          <span className="text-[10px] tabular-nums text-muted-foreground font-bold mt-1.5">{Math.round(f)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute top-0 bottom-0 w-0.5 bg-info pointer-events-none z-10 rounded-full" style={{ left: needleLeft }} />

                <input type="range" min="87.5" max="108.0" step="0.1" value={visualFreq}
                       aria-label="Dò tần số" onChange={(e) => handleDialDrag(Number(e.target.value))}
                       onPointerDown={() => setIsDragging(true)} onPointerUp={() => { if (isDragging) handleDialRelease(visualFreq); }}
                       className="w-full h-full opacity-0 absolute inset-0 cursor-ew-resize z-20 touch-none" />
              </div>

              {/* Điều khiển chính — mọi nút tối thiểu 44px */}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => autoScan("down")} aria-label="Dò xuống"
                  className="w-12 h-12 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
                  <span className="material-symbols-outlined">skip_previous</span>
                </button>

                <button onClick={togglePlayPause} aria-label={isPlaying ? "Dừng" : "Phát"}
                  className="w-14 h-14 shrink-0 rounded-full bg-info text-info-foreground flex items-center justify-center active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-3xl">
                    {(isPlaying || isStatic || isBuffering) ? "stop" : "play_arrow"}
                  </span>
                </button>

                <button onClick={() => autoScan("up")} aria-label="Dò lên"
                  className="w-12 h-12 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
                  <span className="material-symbols-outlined">skip_next</span>
                </button>
              </div>

              {/* Hàng phụ: bốc ngẫu nhiên + hẹn giờ tắt */}
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <button onClick={playRandom}
                  className="flex items-center gap-2 h-11 px-4 rounded-full border border-border bg-card text-foreground text-sm font-bold active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-lg">shuffle</span>
                  <span>Ngẫu nhiên</span>
                </button>
                <button onClick={cycleSleepTimer}
                  className={`flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold active:scale-95 transition-transform ${
                    sleepTimer ? "border-info text-info bg-card" : "border-border bg-card text-foreground"
                  }`}>
                  <span className="material-symbols-outlined text-lg">bedtime</span>
                  <span>{sleepTimer ? `Tắt sau ${formatSleepTime(sleepTimeLeft)}` : "Hẹn giờ tắt"}</span>
                </button>
              </div>
            </div>
        </div>

        {/* ─── Tìm đài bất kỳ ──────────────────────────────────────────────────── */}
        <form onSubmit={submitSearch} className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 h-12 rounded-xl bg-card border border-border">
            <span className="material-symbols-outlined text-lg text-muted-foreground">search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm đài: VOV1, BBC, Jazz…"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-semibold text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button type="submit" disabled={searching || !search.trim()}
            className="h-12 px-5 rounded-xl bg-info text-info-foreground font-bold text-[15px] active:scale-95 transition-transform disabled:opacity-40">
            {searching ? "Đang dò…" : "Tìm"}
          </button>
        </form>

        {/* ─── Danh mục ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto mb-5 pb-1 no-scrollbar">
          {foundList.length > 0 && (
            <button onClick={() => setActiveCategory(FOUND_CATEGORY)}
              className={`shrink-0 flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === FOUND_CATEGORY ? "bg-info text-info-foreground border-info" : "bg-card text-foreground border-border"
              }`}>
              <span className="material-symbols-outlined text-lg">bookmark</span>
              <span>Đã tìm ({foundList.length})</span>
            </button>
          )}
          {RADIO_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold whitespace-nowrap transition-colors ${
                  active ? "bg-info text-info-foreground border-info" : "bg-card text-foreground border-border"
                }`}>
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
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
              // healthTick chỉ để buộc vẽ lại sau khi sổ theo dõi đổi.
              const status = healthTick >= 0 ? stationStatus(station.stationuuid) : "unknown";
              return (
                // Nút xoá phải là anh em của thẻ đài, không nằm trong nó: nút
                // lồng trong nút vừa sai HTML vừa kẹt bàn phím.
                <div key={station.stationuuid} className="relative">
                <button onClick={() => playStation(station)}
                  className={`w-full h-full text-left p-4 rounded-2xl border bg-card flex flex-col gap-3 transition-colors ${
                    active ? "border-info" : "border-border"
                  } ${status === "dead" ? "opacity-55" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                      active ? "bg-info text-info-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {active && (isBuffering || isDragging) ? "sync" : active && isPlaying ? "graphic_eq" : "radio"}
                      </span>
                    </div>
                    <span title={STATUS_TITLE[status]}
                      className={`w-2 h-2 mt-1 shrink-0 rounded-full ${STATUS_DOT[status]} ${status === "unknown" ? "border border-border" : ""}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold line-clamp-2 leading-snug text-foreground">{station.name}</span>
                    <span className="text-[13px] text-muted-foreground mt-1 tabular-nums">
                      {stationFreq ? `${stationFreq.toFixed(1)} MHz` : STATUS_TITLE[status]}
                    </span>
                  </div>
                </button>
                {station.found && (
                  <button type="button" aria-label={`Bỏ ${station.name} khỏi danh sách`}
                    onClick={() => dropFound(station.stationuuid)}
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
                </div>
              );
            })}
          </div>
        )}

      {/* Inline Store Modal */}
      {showStore && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowStore(false); refetchTokens(); }}>
          <div className="bg-white dark:bg-[#15141c] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-y-auto p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-foreground">Mua thêm thời gian nghe</h3>
              <button onClick={() => { setShowStore(false); refetchTokens(); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Thời gian mua được tích lũy và sử dụng sau khi hết 5 giờ miễn phí hàng tuần.</p>
            <RadioStoreInline bio={bio} showToast={showToast} onPurchased={refetchTokens} />
          </div>
        </div>
      )}
      </div>
  );
}

// Inline store component for radio time packages
function RadioStoreInline({ bio, showToast, onPurchased }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/utility-store/products`)
      .then(r => r.json())
      .then(data => {
        const radioProducts = (Array.isArray(data) ? data : []).filter(
          p => p.productType === "radio_time" || p.category === "radio"
        );
        setProducts(radioProducts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(product) {
    if (!bio?.email || buyingId) return;
    setBuyingId(product._id);
    try {
      const res = await fetch(`${API_BASE}/utility-store/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, productId: product._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi mua hàng.");
      const hours = Math.floor(product.radioMinutes / 60);
      showToast?.(`Mua thành công! +${hours}h thời lượng radio.`, "success");
      onPurchased?.();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">Đang tải...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        <span className="material-symbols-outlined text-2xl mb-2 opacity-40">storefront</span>
        <p>Chưa có gói thời gian nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {products.map(product => {
        const totalCost = product.priceJoy + Math.floor(product.priceJoy * 0.09);
        const hours = Math.floor(product.radioMinutes / 60);
        const days = Math.floor(hours / 24);
        const timeLabel = days > 0 ? `${days} ngày` : `${hours}h`;
        return (
          <div key={product._id} className="flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0e0f17]/90 p-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#06b6d4]">schedule</span>
              <span className="font-black text-sm text-foreground">+{timeLabel}</span>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-2">{product.description || product.name}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-black text-foreground">{totalCost} JOY</span>
              <button
                onClick={() => handleBuy(product)}
                disabled={buyingId === product._id}
                className="px-3 py-1.5 rounded-lg bg-[#06b6d4] text-white text-[10px] font-bold uppercase tracking-wider active:scale-95 disabled:opacity-50 transition-all"
              >
                {buyingId === product._id ? "..." : "Mua"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
