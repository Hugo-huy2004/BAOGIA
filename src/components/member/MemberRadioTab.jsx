import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";
import { fetchStationsByNames, fetchStationByName, registerStationClick } from "../../services/radioBrowserApi";
import {
  orderedUrls, recordOk, recordFail, stationStatus, pickRandom, learnedUrl,
  resolveByName, rememberFound, forgetFound, foundStations, lastStationId,
} from "../../services/radioBrain";
import { setMediaSession, setMediaPlaybackState } from "../../services/mediaSession";
import RadioTokenStatus, { RadioStoreModal, useRadioHeartbeat } from "./RadioTokenStatus";
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

export default function MemberRadioTab({ onBack, showToast, bio, isGuestMode = false, requireAccount }) {
  const { t } = useTranslation();
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

  // Token nghe — MỘT nguồn duy nhất cho cả thanh trạng thái lẫn cổng chặn phát.
  const [showStore, setShowStore] = useState(false);
  const { tokenStatus, loading: tokenLoading, refetch: refetchTokens } = useRadioHeartbeat(bio, isPlaying);

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
  const autoSkipRef = useRef({ n: 0, skipped: [] });

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

  const outOfTokens = Boolean(tokenStatus && !tokenStatus.canListen);

  const playStation = (station, { chained = false } = {}) => {
    if (outOfTokens) {
      showToast?.(t("utilities.radio.toast.outOfTokens"), "warning");
      setShowStore(true);
      return;
    }

    if (nowPlaying?.stationuuid === station.stationuuid && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    retriedRef.current = false;
    if (!chained) autoSkipRef.current = { n: 0, skipped: [] };
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
    if (outOfTokens) {
      showToast?.(t("utilities.radio.toast.outOfTokens"), "warning");
      setShowStore(true);
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

  // Hết token giữa chừng thì dừng ngay, không đợi người dùng bấm.
  useEffect(() => {
    if (outOfTokens && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      showToast?.(t("utilities.radio.toast.outOfTokens"), "warning");
    }
  }, [outOfTokens, isPlaying, showToast, t, setIsPlaying]);

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
    <div className="text-foreground">
      <SubUtilityHeader title="HugoRadio" icon="radio" colorClass="text-info" onBack={onBack} />

      <div className="mb-4">
        <RadioTokenStatus status={tokenStatus} loading={tokenLoading} onBuyMore={() => setShowStore(true)} />
      </div>

      {/* ─── Đang phát ────────────────────────────────────────────────────────
          Phẳng và tĩnh: nền đặc, viền mảnh, một màu nhấn duy nhất (info). */}
      <div className="mb-5 rounded-2xl bg-card border border-border p-4 md:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${
            isPlaying ? "bg-info text-info-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isBuffering ? "sync" : isPlaying ? "graphic_eq" : "radio"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{stateLabel}</p>
            <p className="text-[17px] font-bold leading-tight truncate text-foreground mt-0.5">
              {nowPlaying ? nowPlaying.name : t("utilities.radio.state.pickStation")}
            </p>
            {nowPlaying && (
              <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                {healthLabel(nowPlaying.stationuuid)}
                {healthTick >= 0 && learnedUrl(nowPlaying.stationuuid) ? ` · ${t("utilities.radio.learnedUrl")}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Điều khiển chính — mọi nút tối thiểu 44px */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => step(-1)} aria-label={t("utilities.radio.control.prev")}
            className="w-12 h-12 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined">skip_previous</span>
          </button>

          <button onClick={togglePlayPause} aria-label={isPlaying ? t("utilities.radio.control.stop") : t("utilities.radio.control.play")}
            className="w-14 h-14 shrink-0 rounded-full bg-info text-info-foreground flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-3xl">{(isPlaying || isBuffering) ? "stop" : "play_arrow"}</span>
          </button>

          <button onClick={() => step(1)} aria-label={t("utilities.radio.control.next")}
            className="w-12 h-12 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-lg text-muted-foreground">
            {volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
          </span>
          <input
            type="range" min="0" max="100" step="1" value={volume}
            aria-label={t("utilities.radio.control.volume")}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-11 accent-info cursor-pointer"
          />
          <span className="w-10 text-right text-[13px] tabular-nums text-muted-foreground">{volume}%</span>
        </div>

        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <button onClick={playRandom}
            className="flex items-center gap-2 h-11 px-4 rounded-full border border-border bg-card text-foreground text-sm font-bold active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-lg">shuffle</span>
            <span>{t("utilities.radio.control.shuffle")}</span>
          </button>
          <button onClick={cycleSleepTimer}
            className={`flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold active:scale-95 transition-transform ${
              sleepTimer ? "border-info text-info bg-card" : "border-border bg-card text-foreground"
            }`}>
            <span className="material-symbols-outlined text-lg">bedtime</span>
            <span>
              {sleepTimer
                ? (sleepTimeLeft > 0
                    ? t("utilities.radio.control.sleepRunning", { time: formatSleepTime(sleepTimeLeft) })
                    : t("utilities.radio.control.sleepArmed", { minutes: sleepTimer }))
                : t("utilities.radio.control.sleep")}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Tìm đài bất kỳ ────────────────────────────────────────────────── */}
      <form onSubmit={submitSearch} className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 h-12 rounded-xl bg-card border border-border">
          <span className="material-symbols-outlined text-lg text-muted-foreground">search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("utilities.radio.searchPlaceholder")}
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-semibold text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button type="submit" disabled={searching || !search.trim()}
          className="h-12 px-5 rounded-xl bg-info text-info-foreground font-bold text-[15px] active:scale-95 transition-transform disabled:opacity-40">
          {searching ? t("utilities.radio.searching") : t("utilities.radio.searchAction")}
        </button>
      </form>

      {/* ─── Danh mục ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto mb-5 pb-1 no-scrollbar">
        {foundList.length > 0 && (
          <button onClick={() => setActiveCategory(FOUND_CATEGORY)}
            className={`shrink-0 flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold whitespace-nowrap transition-colors ${
              activeCategory === FOUND_CATEGORY ? "bg-info text-info-foreground border-info" : "bg-card text-foreground border-border"
            }`}>
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span>{t("utilities.radio.categories.found", { n: foundList.length })}</span>
          </button>
        )}
        {RADIO_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-bold whitespace-nowrap transition-colors ${
              activeCategory === cat.id ? "bg-info text-info-foreground border-info" : "bg-card text-foreground border-border"
            }`}>
            <span className="material-symbols-outlined text-lg">{cat.icon}</span>
            <span>{t(cat.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* ─── Bảng đài ──────────────────────────────────────────────────────── */}
      {loadingCategory === activeCategory ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-[15px]">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
          {t("utilities.radio.loading")}
        </div>
      ) : stations.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-[15px]">
          {t("utilities.radio.noStations")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {stations.map((station) => {
            const active = nowPlaying?.stationuuid === station.stationuuid;
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
                        {active && isBuffering ? "sync" : active && isPlaying ? "graphic_eq" : "radio"}
                      </span>
                    </div>
                    <span title={t(`utilities.radio.health.${status}`)}
                      className={`w-2 h-2 mt-1 shrink-0 rounded-full ${STATUS_DOT[status]} ${status === "unknown" ? "border border-border" : ""}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold line-clamp-2 leading-snug text-foreground">{station.name}</span>
                    <span className="text-[13px] text-muted-foreground mt-1">
                      {station.country || t(`utilities.radio.health.${status}`)}
                    </span>
                  </div>
                </button>
                {station.found && (
                  <button type="button" aria-label={t("utilities.radio.removeFound", { name: station.name })}
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

      {/* ─── Nguồn & bản quyền ─────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-border bg-muted p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-lg text-muted-foreground shrink-0">gavel</span>
        <div className="text-[13px] text-muted-foreground leading-relaxed">
          <p className="font-bold text-foreground">{t("utilities.radio.legal.title")}</p>
          <p className="mt-1">{t("utilities.radio.legal.body")}</p>
          <p className="mt-1">{t("utilities.radio.legal.source")}</p>
        </div>
      </div>

      {showStore && (
        <RadioStoreModal
          bio={bio}
          showToast={showToast}
          onClose={() => setShowStore(false)}
          onPurchased={refetchTokens}
        />
      )}
    </div>
  );
}
