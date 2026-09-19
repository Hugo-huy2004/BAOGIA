import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";
import {
  orderedUrls, recordOk, recordFail, stationStatus, pickRandom, learnedUrl,
  resolveByName, rememberFound, forgetFound, foundStations, lastStationId,
} from "../../services/radioBrain";
import { setMediaSession, setMediaPlaybackState } from "../../services/mediaSession";

import { useRadioStore, getRadioAudio, hlsHandle } from "../../stores/radioStore";

// Đài hỏng thì tự nhảy sang đài khác, nhưng có trần: mỗi lần nhảy là một lượt
// dò trên máy chủ, mất sóng cả cụm thì đừng biến thành vòng lặp gọi mạng.
const MAX_AUTO_SKIP = 3;
const GUEST_DEMO_LIMIT_SECONDS = 15 * 60;
const GUEST_DEMO_STORAGE_KEY = "hugo_radio_demo_seconds_v1";

const FOUND_CATEGORY = "found";
const STATUS_DOT = {
  good: "bg-success",
  shaky: "bg-warning",
  dead: "bg-muted-foreground",
  unknown: "bg-transparent",
};

/* ── Bản quyền & pháp lý ──────────────────────────────────────────────────────
   HugoRadio là TRÌNH PHÁT, không phải nhà phát sóng. Ba ranh giới không được
   bước qua, và cả ba đều thể hiện trong đoạn dữ liệu ngay dưới đây:

   1. Chỉ dẫn tới luồng phát trực tiếp mà chính đài công bố công khai. Không tải
      về, không lưu đệm, không ghi âm, không cắt ghép — người dùng nghe đúng thứ
      đang phát trên sóng, y như mở trang web của đài.
   2. Không bao giờ dán URL bóc từ CDN của dịch vụ nhạc có bản quyền (Zing MP3,
      Spotify, Apple Music, YouTube…). Đó là kho nhạc được cấp phép theo từng
      người nghe, không phải sóng phát thanh.
   3. Tên đài phải là tên THẬT của luồng đó. Gắn một thương hiệu đã đăng ký
      ("Lofi Girl", "Chillhop") lên một luồng zeno.fm do người khác dựng là mạo
      danh nhãn hiệu, kể cả khi luồng ấy phát nhạc tương tự — nên hai mục đó đã
      bị gỡ, thay bằng luồng chính chủ của đài công (FIP, France Musique).

   Danh mục đài lấy từ cơ sở dữ liệu mở Radio Browser (giấy phép nội dung dữ
   liệu là công cộng); điều khoản của họ yêu cầu ghi nguồn, gửi User-Agent nhận
   dạng được và không ghim cứng một máy chủ — cả ba nằm ở server/routes/radioRoutes.js. */

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
  { id: "vn_news", icon: "newspaper", labelKey: "utilities.radio.categories.vnNews", activeClass: "from-red-500 to-orange-500 shadow-red-500/20", panelClass: "from-red-500/14 via-orange-400/8 to-card", names: ["VOV1", "VOV2", "VOV3", "VOV Giao thông Hà Nội", "VOV5 WORLD RADIO", "RFI Tiếng Việt", "VOH FM 87.7"] },
  { id: "intl_news", icon: "public", labelKey: "utilities.radio.categories.intlNews", activeClass: "from-blue-500 to-cyan-500 shadow-blue-500/20", panelClass: "from-blue-500/14 via-cyan-400/8 to-card", names: ["NPR 24 Hour Program Stream", "RTE1", "CBC Radio One", "Radio France Internationale"] },
  { id: "music", icon: "music_note", labelKey: "utilities.radio.categories.music", activeClass: "from-fuchsia-500 to-violet-600 shadow-fuchsia-500/20", panelClass: "from-fuchsia-500/14 via-violet-400/8 to-card", names: ["M Radio Vietnam", "Cherry Radio Music 247", "SWR3"] },
  { id: "lofi_chill", icon: "headphones", labelKey: "utilities.radio.categories.chill", activeClass: "from-teal-500 to-emerald-500 shadow-teal-500/20", panelClass: "from-teal-500/14 via-emerald-400/8 to-card", names: ["FIP", "France Musique", "Smooth Jazz 247", "Chillout Lounge"] },
];

const FALLBACK_STATIONS = {
  vn_news: [
    { stationuuid: "374f3747-fa95-46ee-bc90-953e5e492cda", name: "VOV1", url_resolved: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8" },
    { stationuuid: "0e2d2aa5-e68d-4c74-8b1e-d7ce32d87922", name: "VOV2", url_resolved: "https://str.vov.gov.vn/vovlive/vov2.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov2.sdp_aac/playlist.m3u8" },
    { stationuuid: "888cd26e-dbfa-4be5-a4ee-5dcab947d1a2", name: "VOV3", url_resolved: "https://str.vov.gov.vn/vovlive/vov3.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov3.sdp_aac/playlist.m3u8" },
    { stationuuid: "5e4835a6-ff25-4c6e-8260-eb0df6275815", name: "VOV Giao thông Hà Nội", url_resolved: "https://play.vovgiaothong.vn/live/gthn/playlist.m3u8", url: "https://play.vovgiaothong.vn/live/gthn/playlist.m3u8" },
    { stationuuid: "be42337a-4299-4c28-bb8d-8a4bf5792d47", name: "VOV5 WORLD RADIO", url_resolved: "https://str.vov.gov.vn/vovlive/vov5.sdp_aac/playlist.m3u8", url: "https://str.vov.gov.vn/vovlive/vov5.sdp_aac/playlist.m3u8" },
    { stationuuid: "525f2bfa-bc39-44de-9e23-728b783516bd", name: "RFI Tiếng Việt", url_resolved: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3", url: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3" },
    { stationuuid: "voh_87.7", name: "VOH FM 87.7", url_resolved: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8", url: "https://live.voh.com.vn/voh/fm87.7.stream/playlist.m3u8" },
  ],
  intl_news: [
    { stationuuid: "7ba4c184-fc2b-11e9-bbf2-52543be04c81", name: "NPR 24 Hour Program Stream", url_resolved: "https://npr-ice.streamguys1.com/live.mp3", url: "https://npr-ice.streamguys1.com/live.mp3" },
    { stationuuid: "8643cfcb-a7bb-4c46-8391-fffe266bce16", name: "RTE1", url_resolved: "https://icecast.rte.ie/radio1", url: "https://icecast.rte.ie/radio1" },
    { stationuuid: "cbc_03", name: "CBC Radio One", url_resolved: "https://cbclive.akamaized.net/hls/live/2041060/cbc_r1_tor/master.m3u8", url: "https://cbclive.akamaized.net/hls/live/2041060/cbc_r1_tor/master.m3u8" },
    { stationuuid: "rfi_04", name: "Radio France Internationale", url_resolved: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3", url: "https://rfimonde64k.ice.infomaniak.ch/rfimonde-64.mp3" },
  ],
  music: [
    { stationuuid: "204b63f8-6629-4984-bbe0-0773c8220a91", name: "M Radio Vietnam", url_resolved: "https://stream-155.zeno.fm/4q7y9hvkp2zuv", url: "https://stream-155.zeno.fm/4q7y9hvkp2zuv" },
    { stationuuid: "3d35f6b4-0ade-42ca-a378-e8f3dfd66426", name: "Cherry Radio Music 247", url_resolved: "https://stream-176.zeno.fm/umt5gqmg3reuv", url: "https://stream-176.zeno.fm/umt5gqmg3reuv" },
    { stationuuid: "6c0ac59d-c625-458c-9a50-5fac90a73df9", name: "SWR3", url_resolved: "https://liveradio.swr.de/sw331ch/swr3/play.aac", url: "https://liveradio.swr.de/sw331ch/swr3/play.aac" },
  ],
  lofi_chill: [
    // Radio France công bố công khai các địa chỉ icecast này cho FIP và France
    // Musique — đài công, luồng chính chủ, thay cho hai mục mượn thương hiệu cũ.
    { stationuuid: "fip_official", name: "FIP", url_resolved: "https://icecast.radiofrance.fr/fip-midfi.mp3", url: "https://icecast.radiofrance.fr/fip-midfi.mp3" },
    { stationuuid: "francemusique_official", name: "France Musique", url_resolved: "https://icecast.radiofrance.fr/francemusique-midfi.mp3", url: "https://icecast.radiofrance.fr/francemusique-midfi.mp3" },
    { stationuuid: "smooth_jazz_03", name: "Smooth Jazz 247", url_resolved: "https://stream.zeno.fm/n2p984hkp2zuv", url: "https://stream.zeno.fm/n2p984hkp2zuv" },
    { stationuuid: "chillout_05", name: "Chillout Lounge", url_resolved: "https://stream.zeno.fm/80y7y0wkp2zuv", url: "https://stream.zeno.fm/80y7y0wkp2zuv" },
  ],
};

const SLEEP_STEPS = [15, 30, 60];
const RADIO_APP_PAGES = [
  { id: "home", icon: "home", label: "Trang chủ" },
  { id: "stations", icon: "radio", label: "Đài phát" },
  { id: "discover", icon: "travel_explore", label: "Khám phá" },
  { id: "sleep", icon: "bedtime", label: "Hẹn giờ" },
  { id: "about", icon: "info", label: "Thông tin" },
];

const readGuestDemoSeconds = () => {
  try {
    const value = Number(localStorage.getItem(GUEST_DEMO_STORAGE_KEY) || 0);
    return Number.isFinite(value) ? Math.min(GUEST_DEMO_LIMIT_SECONDS, Math.max(0, value)) : 0;
  } catch {
    return 0;
  }
};

const writeGuestDemoSeconds = (seconds) => {
  try {
    localStorage.setItem(GUEST_DEMO_STORAGE_KEY, String(Math.round(seconds)));
  } catch { /* Storage can be unavailable in private browsing. */ }
};

const formatDemoTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function MemberRadioTab({
  onBack,
  showToast,
  bio,
  isGuestMode = false,
  requireAccount,
  activePage = "stations",
  onPageChange,
}) {
  const { t } = useTranslation();
  const isPWA = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  const hasNavigation = typeof onPageChange === "function";
  const standaloneApp = hasNavigation && isPWA;
  const page = RADIO_APP_PAGES.some((item) => item.id === activePage) ? activePage : "home";
  const [activeCategory, setActiveCategory] = useState(RADIO_CATEGORIES[0].id);
  const [stationsByCategory, setStationsByCategory] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);

  // Trạng thái phát nằm ở store để nhạc sống qua việc rời tab, và để thanh
  // now-playing ngoài cây tab đọc được — xem src/stores/radioStore.js.
  const nowPlaying = useRadioStore((s) => s.station);
  const isPlaying = useRadioStore((s) => s.isPlaying);
  const isBuffering = useRadioStore((s) => s.isBuffering);
  const volume = useRadioStore((s) => s.volume);
  const setNowPlaying = useRadioStore((s) => s.setStation);
  const setIsPlaying = useRadioStore((s) => s.setPlaying);
  const setIsBuffering = useRadioStore((s) => s.setBuffering);
  const setVolume = useRadioStore((s) => s.setVolume);
  const guestMode = Boolean(isGuestMode || !bio?.email);
  const [guestDemoSeconds, setGuestDemoSeconds] = useState(readGuestDemoSeconds);
  const guestDemoRemaining = Math.max(0, GUEST_DEMO_LIMIT_SECONDS - guestDemoSeconds);
  const guestDemoExpired = guestMode && guestDemoRemaining <= 0;

  const [sleepTimer, setSleepTimer] = useState(null);
  const [sleepTimeLeft, setSleepTimeLeft] = useState(0);

  // Đài người dùng tự tìm, nhớ trong máy giữa các phiên.
  const [foundList, setFoundList] = useState(foundStations);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  // Đổi số này để bảng đài vẽ lại sau khi sổ theo dõi thay đổi.
  const [healthTick, setHealthTick] = useState(0);

  // Trỏ vào thẻ audio dùng chung của store, không tự tạo nữa.
  const audioRef = useRef(null);
  audioRef.current = getRadioAudio();
  const hlsRef = hlsHandle;
  const playbackRequestRef = useRef(0);
  const retriedRef = useRef(false);
  const handleFailureRef = useRef(() => {});
  // Lượt phát hiện tại: đài nào, còn những địa chỉ nào chưa thử.
  const attemptRef = useRef({ station: null, urls: [], index: 0 });
  // Nút "chuyển kênh" trên màn hình khoá cần hàm bốc ngẫu nhiên, mà hàm đó khai
  // báo bên dưới — giữ qua ref để effect ở trên gọi được bản mới nhất.
  const playRandomRef = useRef(() => {});
  const autoSkipRef = useRef                                      ({ count: 0, skipped: [] });

  const healthLabel = useCallback((id) => t(`utilities.radio.health.${stationStatus(id)}`), [t]);

  // ── Hẹn giờ tắt ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sleepTimer || !isPlaying) {
      setSleepTimeLeft(0);
      return undefined;
    }
    setSleepTimeLeft(sleepTimer * 60);

    const interval = setInterval(() => {
      setSleepTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimer(null);
          showToast?.(t("utilities.radio.toast.sleepDone"), "info");
          return 0;
        }
        // Mười lăm giây cuối hạ dần âm lượng thay vì cắt phụt.
        if (prev <= 15 && audioRef.current) {
          audioRef.current.volume = Math.max(0, (prev / 15) * (volume / 100));
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying, volume, showToast, t, setIsPlaying]);

  const cycleSleepTimer = () => {
    setSleepTimer((current) => {
      const next = SLEEP_STEPS[SLEEP_STEPS.indexOf(current) + 1];
      return current ? (next ?? null) : SLEEP_STEPS[0];
    });
  };

  const formatSleepTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  // Chỉ GẮN listener lên thẻ audio dùng chung; không tạo và không huỷ nó.
  // Rời tab radio chỉ gỡ listener: luồng vẫn chạy, thanh now-playing vẫn điều
  // khiển được. Muốn dừng hẳn thì bấm nút dừng, không phải do component biến mất.
  useEffect(() => {
    const audio = getRadioAudio();
    audio.volume = volume / 100;
    audio.onplaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
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
    return () => {
      // Logic chữa luồng cần danh sách đài của component; component đi rồi thì
      // nó không chạy được nữa. Gỡ hẳn để một lỗi luồng muộn không gọi vào
      // closure đã chết — luồng lỗi lúc đó chỉ đơn giản là dừng.
      audio.onplaying = null;
      audio.onpause = null;
      audio.onwaiting = null;
      audio.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
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
    // Chỉ hiện khung chờ khi CHƯA có gì để bày ra, tránh chớp khung chờ đè lên
    // danh sách dự phòng.
    if (!fallbacks.length) setLoadingCategory(categoryId);

    fetchStationsByNames(category.names)
      .finally(() => setLoadingCategory((current) => (current === categoryId ? null : current)))
      .then((stations) => {
        if (!stations?.length) return;
        loadedCategoriesRef.current.add(categoryId);
        const loadedNames = new Set(stations.map((s) => s.name.toUpperCase()));
        const loadedUuids = new Set(stations.map((s) => s.stationuuid));
        const missing = fallbacks.filter((f) => !loadedNames.has(f.name.toUpperCase()) && !loadedUuids.has(f.stationuuid));

        const seen = new Set();
        const combined = [...stations, ...missing]
          .filter((s) => (seen.has(s.stationuuid) ? false : seen.add(s.stationuuid)))
          .sort((a, b) => {
            const idxA = category.names.findIndex((n) => n.toUpperCase() === a.name.toUpperCase());
            const idxB = category.names.findIndex((n) => n.toUpperCase() === b.name.toUpperCase());
            return idxA - idxB;
          });
        setStationsByCategory((prev) => ({ ...prev, [categoryId]: combined }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadCategory(activeCategory); }, [activeCategory, loadCategory]);

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
      showToast?.(t("utilities.radio.toast.autoSkip", { from: station?.name || "", to: next.name }), "info");
      playStation(next, { chained: true });
      return;
    }

    setIsBuffering(false);
    setIsPlaying(false);
    showToast?.(t("utilities.radio.toast.playError"), "error");
  };

  handleFailureRef.current = handlePlaybackFailure;

  const playStation = (station, { chained = false } = {}) => {
    if (nowPlaying?.stationuuid === station.stationuuid && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    retriedRef.current = false;
    if (!chained) autoSkipRef.current = { count: 0, skipped: [] };
    setNowPlaying(station);
    setIsBuffering(true);
    setIsPlaying(false);

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

  const stations = activeCategory === FOUND_CATEGORY
    ? foundList.map(toStation)
    : (stationsByCategory[activeCategory] || []);

  /** Đài liền trước / liền sau trong đúng danh sách đang xem — không còn "dò tần số"
      giả lập trên một dải FM mà mấy đài internet này chưa từng có mặt. */
  const step = (delta) => {
    if (!stations.length) return;
    const current = stations.findIndex((s) => s.stationuuid === nowPlaying?.stationuuid);
    const next = stations[((current < 0 ? 0 : current + delta) + stations.length) % stations.length];
    if (next) playStation(next);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    if (nowPlaying) {
      playStation(nowPlaying);
      return;
    }
    // Mở app rồi bấm phát: tiếp tục đúng đài lần trước, không phải đài đầu danh sách.
    const target = stations.find((item) => item.stationuuid === lastStationId()) || stations[0];
    if (target) playStation(target);
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
      const found = await resolveByName(name, undefined);
      if (!found) {
        showToast?.(t("utilities.radio.toast.notFound", { name }), "warning");
        return;
      }
      rememberFound(found);
      setFoundList(foundStations());
      setSearch("");
      setActiveCategory(FOUND_CATEGORY);
      playStation(toStation(found));
    } catch {
      showToast?.(t("utilities.radio.toast.searchError"), "error");
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

  const stateLabel = isBuffering
    ? t("utilities.radio.state.connecting")
    : isPlaying
      ? t("utilities.radio.state.playing")
      : nowPlaying
        ? t("utilities.radio.state.paused")
        : t("utilities.radio.state.idle");

  return (
    <div className={standaloneApp
      ? "h-full min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.14),transparent_34rem),radial-gradient(circle_at_90%_70%,rgba(59,130,246,0.1),transparent_30rem)] text-foreground flex flex-col"
      : "w-full selection:bg-teal-500/20 pb-24 md:pb-6 text-foreground flex flex-col"}
    >
      {/* ── 1. HEADER & QUAY LẠI ── */}
      {standaloneApp ? (
        <header
          className="sticky top-0 z-30 shrink-0 border-b border-white/50 bg-background/72 px-3 pb-3 shadow-[0_12px_38px_rgba(15,23,42,0.08)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#06090d]/72"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg shadow-teal-500/20">
                <span className="material-symbols-outlined">radio</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-black tracking-tight">HugoRadio</span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Đài phát thanh trực tuyến</span>
              </span>
            </div>
          </div>
        </header>
      ) : (
        <div className="hidden md:flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground tracking-tight m-0">HugoRadio</h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10.5px] font-bold">RADIO TRỰC TUYẾN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header cho mobile trình duyệt thường (nếu có) */}
      {!standaloneApp && (
        <div className="md:hidden w-full mb-4">
          <header className="px-4 py-3 rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h3 className="font-bold text-sm tracking-tight text-foreground m-0">HugoRadio</h3>
            </div>
            <div className="flex flex-col items-end mr-10">
              <p className="text-[10px] uppercase font-bold text-teal-500/80 m-0">Đang trực tuyến</p>
            </div>
          </header>
        </div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-10">
        
        {/* ── 2. TRÌNH PHÁT (NOW PLAYING) ── */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-card/80 to-muted/30 p-6 sm:p-8 shadow-[0_22px_65px_rgba(15,23,42,0.1)] backdrop-blur-3xl dark:border-white/10 dark:from-card/60 dark:to-background/40 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-teal-600 dark:text-teal-300">
                <span className={`h-2 w-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : isBuffering ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"}`} /> 
                {stateLabel}
              </span>
              <h1 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.03em] sm:text-4xl truncate">
                {nowPlaying ? nowPlaying.name : t("utilities.radio.state.pickStation")}
              </h1>
              {nowPlaying && (
                <p className="mt-2 text-[14px] font-semibold text-muted-foreground truncate flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[healthTick >= 0 ? stationStatus(nowPlaying.stationuuid) : "unknown"]}`} />
                  {healthLabel(nowPlaying.stationuuid)}
                  {healthTick >= 0 && learnedUrl(nowPlaying.stationuuid) ? ` · ${t("utilities.radio.learnedUrl")}` : ""}
                </p>
              )}
            </div>

            {/* Icon Trực quan */}
            <div className={`hidden sm:flex w-24 h-24 shrink-0 rounded-2xl flex-col items-center justify-center border-2 shadow-inner transition-colors duration-500 ${isPlaying ? "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-400" : "bg-muted border-border text-muted-foreground"}`}>
               <span className="material-symbols-outlined text-[48px]">
                 {isBuffering ? "sync" : isPlaying ? "graphic_eq" : "radio"}
               </span>
            </div>
          </div>

          {/* Điều khiển Play/Pause/Skip */}
          <div className="flex items-center gap-4 pt-2">
            <button onClick={() => step(-1)} aria-label={t("utilities.radio.control.prev")}
              className="w-14 h-14 shrink-0 rounded-full border-2 border-border/60 bg-background/50 hover:bg-muted text-foreground flex items-center justify-center active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl">skip_previous</span>
            </button>

            <button onClick={togglePlayPause} aria-label={isPlaying ? t("utilities.radio.control.stop") : t("utilities.radio.control.play")}
              className="w-16 h-16 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-transform shadow-xl shadow-foreground/20 hover:scale-105">
              <span className="material-symbols-outlined text-[34px]">{(isPlaying || isBuffering) ? "pause" : "play_arrow"}</span>
            </button>

            <button onClick={() => step(1)} aria-label={t("utilities.radio.control.next")}
              className="w-14 h-14 shrink-0 rounded-full border-2 border-border/60 bg-background/50 hover:bg-muted text-foreground flex items-center justify-center active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl">skip_next</span>
            </button>
            
            <div className="w-px h-10 bg-border/60 mx-2 hidden sm:block"></div>

            <button onClick={playRandom}
              className="hidden sm:flex items-center gap-2 h-14 px-5 rounded-full border-2 border-border/60 bg-background/50 hover:bg-muted text-foreground font-bold active:scale-95 transition-all">
              <span className="material-symbols-outlined">shuffle</span> Phát ngẫu nhiên
            </button>
          </div>

          {/* Âm lượng & Hẹn giờ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 rounded-2xl bg-background/40 border border-border/40">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-muted-foreground w-6 text-center">
                {volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
              </span>
              <input
                type="range" min="0" max="100" step="1" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-2 bg-border/50 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <span className="w-10 text-right text-[13px] tabular-nums font-bold text-muted-foreground">{volume}%</span>
            </div>
            <div className="flex items-center md:justify-end gap-3">
              <button onClick={cycleSleepTimer}
                className={`flex flex-1 md:flex-none items-center justify-center gap-2 h-10 px-4 rounded-xl border text-[13px] font-bold active:scale-95 transition-all ${
                  sleepTimer ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "border-border/50 bg-muted/50 text-foreground"
                }`}>
                <span className="material-symbols-outlined text-[18px]">bedtime</span>
                <span>
                  {sleepTimer
                    ? (sleepTimeLeft > 0 ? t("utilities.radio.control.sleepRunning", { time: formatSleepTime(sleepTimeLeft) }) : t("utilities.radio.control.sleepArmed", { minutes: sleepTimer }))
                    : t("utilities.radio.control.sleep")}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 3. KHÁM PHÁ / TÌM KIẾM ── */}
        <section>
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 h-14 rounded-2xl bg-card border border-border/60 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              <span className="material-symbols-outlined text-[22px] text-muted-foreground">search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("utilities.radio.searchPlaceholder")}
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px] font-semibold text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
            <button type="submit" disabled={searching || !search.trim()}
              className="h-14 px-6 rounded-2xl bg-teal-500 text-white font-bold text-[15px] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-teal-500/20">
              {searching ? t("utilities.radio.searching") : t("utilities.radio.searchAction")}
            </button>
          </form>
        </section>

        {/* ── 4. DANH MỤC & LƯỚI ĐÀI (STATIONS) ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {foundList.length > 0 && (
              <button onClick={() => setActiveCategory(FOUND_CATEGORY)}
                className={`shrink-0 flex items-center gap-2 h-11 px-5 rounded-full border-2 text-[14px] font-bold whitespace-nowrap transition-all ${
                  activeCategory === FOUND_CATEGORY ? "bg-teal-50 text-teal-700 border-teal-500 dark:bg-teal-950 dark:text-teal-300" : "bg-card text-foreground border-border/50 hover:border-border"
                }`}>
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
                <span>{t("utilities.radio.categories.found", { n: foundList.length })}</span>
              </button>
            )}
            {RADIO_CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 h-11 px-5 rounded-full border-2 text-[14px] font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id ? "bg-teal-50 text-teal-700 border-teal-500 dark:bg-teal-950 dark:text-teal-300" : "bg-card text-foreground border-border/50 hover:border-border"
                }`}>
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                <span>{t(cat.labelKey)}</span>
              </button>
            ))}
          </div>

          {loadingCategory === activeCategory ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <span className="material-symbols-outlined animate-spin text-[32px] text-teal-500">refresh</span>
              <span className="text-[15px] font-bold">{t("utilities.radio.loading")}</span>
            </div>
          ) : stations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <span className="material-symbols-outlined text-[48px] opacity-20">radio_button_unchecked</span>
              <span className="text-[15px] font-bold">{t("utilities.radio.noStations")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stations.map((station) => {
                const active = nowPlaying?.stationuuid === station.stationuuid;
                const status = healthTick >= 0 ? stationStatus(station.stationuuid) : "unknown";
                // Lấy style riêng cho danh mục này, nếu không có thì fallback
                const catObj = RADIO_CATEGORIES.find(c => c.id === activeCategory) || RADIO_CATEGORIES[0];
                
                return (
                  <div key={station.stationuuid} className="group relative">
                    <button onClick={() => playStation(station)}
                      className={`w-full text-left rounded-3xl border-2 flex flex-col transition-all overflow-hidden ${
                        active ? "border-teal-500 ring-4 ring-teal-500/20" : "border-border/60 bg-card hover:border-border hover:shadow-lg"
                      } ${status === "dead" ? "opacity-50 grayscale" : ""}`}>
                      
                      {/* Ảnh bìa / Gradient Banner của đài */}
                      <div className={`w-full aspect-square relative flex items-center justify-center bg-gradient-to-br ${catObj.activeClass} p-4`}>
                        <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                        <h3 className="relative z-10 text-white font-black text-2xl text-center leading-tight drop-shadow-md line-clamp-3">
                          {station.name}
                        </h3>
                        {/* Status Dot */}
                        <div className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/30 backdrop-blur-md">
                           <span title={t(`utilities.radio.health.${status}`)} className={`w-3 h-3 rounded-full ${STATUS_DOT[status]} ${status === "unknown" ? "border-2 border-white/40" : ""}`} />
                        </div>
                        {/* Play/Pause Overlay khi hover hoặc active */}
                        <div className={`absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                           <span className="material-symbols-outlined text-white text-[48px] drop-shadow-lg">
                             {active && isBuffering ? "sync" : active && isPlaying ? "graphic_eq" : "play_circle"}
                           </span>
                        </div>
                      </div>

                      {/* Tên và Location */}
                      <div className="p-4 bg-card flex flex-col">
                        <span className="text-[14px] font-bold line-clamp-1 text-foreground">{station.name}</span>
                        <span className="text-[12px] font-semibold text-muted-foreground mt-0.5 line-clamp-1">
                          {station.country || t(`utilities.radio.health.${status}`)}
                        </span>
                      </div>
                    </button>
                    {station.found && (
                      <button type="button" aria-label={t("utilities.radio.removeFound", { name: station.name })}
                        onClick={() => dropFound(station.stationuuid)}
                        className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg hover:bg-red-600">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 5. THÔNG TIN & BẢN QUYỀN ── */}
        <section className="mt-8 pt-8 border-t border-border/60">
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="material-symbols-outlined text-[32px] text-muted-foreground shrink-0">info</span>
            <div className="text-[13px] text-muted-foreground leading-relaxed flex-1">
              <p className="font-bold text-foreground mb-1">Về HugoRadio</p>
              <p>Trình phát radio trực tuyến. Audio tiếp tục phát khi cậu chuyển app, hỗ trợ Media Session và tự phục hồi khi mất tín hiệu. {t("utilities.radio.legal.body")}</p>
              <p className="mt-1 font-semibold">{t("utilities.radio.legal.source")}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
