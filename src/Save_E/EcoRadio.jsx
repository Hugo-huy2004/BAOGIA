import { useCallback, useEffect, useRef, useState } from "react";
import { useRadioHeartbeat, sendRadioHeartbeat } from "../components/member/RadioTokenStatus";
import { setMediaSession, setMediaPlaybackState } from "../services/mediaSession";
import { getMemberSession } from "../services/authSession";
import {
  pickRandom, orderedUrls, resolveByName, rememberFound, forgetFound, foundStations,
  recordOk, recordFail, readHealth, resetHealth, stationStatus, lastStationId,
} from "../services/radioBrain";

// `query` là tên để hỏi máy chủ khi cần địa chỉ mới. Đài nào có sẵn luồng MP3
// còn sống thì ghi thẳng vào đây để lần đầu phát không tốn lượt gọi nào; đài
// còn lại để trống, lần đầu phát sẽ tự dò rồi nhớ luôn.
const SEED_STATIONS = [
  { id: "rfi", name: "RFI Tiếng Việt", query: "RFI Vietnamese", mp3: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3" },
  { id: "npr", name: "NPR (tiếng Anh)", query: "NPR 24 Hour Program Stream", mp3: "https://npr-ice.streamguys1.com/live.mp3" },
  { id: "vov1", name: "VOV1 · Thời sự", query: "VOV1" },
  { id: "vov2", name: "VOV2 · Văn hoá", query: "VOV2" },
  { id: "vov3", name: "VOV3 · Âm nhạc", query: "VOV3" },
  { id: "vovgt", name: "VOV Giao thông", query: "VOV Giao thông Hà Nội" },
  { id: "voh", name: "VOH FM 87.7", query: "VOH FM 87.7" },
];

// Hạt giống trong mã nguồn + đài người dùng tự tìm thêm.
const allStations = () => [
  ...SEED_STATIONS,
  ...foundStations()
    .filter((found) => !SEED_STATIONS.some((seed) => seed.id === found.id))
    .map((found) => ({ id: found.id, name: found.name, query: found.name, mp3: found.url, found: true })),
];

const urlsFor = (station) => orderedUrls(station.id, [station.mp3, station.hls]);

// Radio ở chế độ Bảo vệ môi trường: KHÔNG bắt chọn đài.
//
// Mở tab là có tiếng — bốc ngẫu nhiên một đài, ưu tiên đài từng phát được.
// Không thích thì bấm "Chuyển kênh". Danh sách bên dưới chỉ là phần phụ cho
// ai muốn chọn tay, kèm luôn trạng thái theo dõi từng đài.
//
// Đài hỏng thì tự chữa: thử các địa chỉ đã biết, rồi hỏi máy chủ đúng MỘT lượt
// để lấy địa chỉ đang sống, rồi mới bỏ qua đài đó và chuyển sang đài khác.

// Một thẻ <audio> duy nhất ở module scope: đổi tab vẫn nghe tiếp.
let audio = null;
let hls = null;

/* ── Trừ giờ nghe ─────────────────────────────────────────────────────────
   Đồng hồ bám THẲNG thẻ audio chứ không bám vòng đời component. Trước đây nó
   nằm trong hook của EcoRadio: rời tab Ví là component tháo, đồng hồ chết,
   nhưng tiếng vẫn phát tiếp — nghe chùa không trừ vào hạn mức 5 giờ/tuần.
   Giờ chỉ cần thẻ audio còn phát là còn tính. */
const BILL_EVERY_MS = 5 * 60 * 1000;
let billTimer = null;
let billSince = 0;
let lastStatus = null;
const statusListeners = new Set();

export const subscribeRadioStatus = (listener) => {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
};

async function bill({ final = false } = {}) {
  if (!billSince) return;
  const minutes = (Date.now() - billSince) / 60000;
  billSince = final ? 0 : Date.now();
  const data = await sendRadioHeartbeat(minutes, { keepalive: final });
  if (!data) return;
  lastStatus = data;
  statusListeners.forEach((listener) => listener(data));
  // Hết giờ giữa chừng thì dừng ngay, không đợi người dùng bấm.
  if (!data.canListen && audio && !audio.paused) audio.pause();
}

const getAudio = () => {
  if (!audio) {
    audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.8;
    audio.addEventListener("play", () => {
      billSince = Date.now();
      clearInterval(billTimer);
      billTimer = setInterval(bill, BILL_EVERY_MS);
    });
    audio.addEventListener("pause", () => {
      clearInterval(billTimer);
      billTimer = null;
      bill({ final: true });
    });
    // Đóng app lúc đang nghe: gửi nốt quãng dở bằng keepalive.
    window.addEventListener("pagehide", () => { if (!audio.paused) bill({ final: true }); });
  }
  return audio;
};

const dropHls = () => { hls?.destroy(); hls = null; };

// Thành công là đang phát; hỏng thì ném lỗi để người gọi thử đường kế tiếp.
// MP3 phát được trên mọi trình duyệt; HLS thì Chrome/Android cần hls.js, nạp
// muộn và chỉ khi thật sự chạm vào một đài HLS.
async function attach(element, url) {
  dropHls();
  if (!url.includes(".m3u8") || element.canPlayType("application/vnd.apple.mpegurl")) {
    element.src = url;
    return element.play();
  }
  const { default: Hls } = await import("hls.js");
  if (!Hls.isSupported()) throw new Error("Trình duyệt này không phát được đài HLS.");
  return new Promise((resolve, reject) => {
    // Đệm ngắn: đủ mượt mà không tải trước hàng phút audio rồi bỏ khi đổi đài.
    hls = new Hls({ maxBufferLength: 8, enableWorker: true });
    hls.on(Hls.Events.MANIFEST_PARSED, () => element.play().then(resolve, reject));
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) { dropHls(); reject(new Error("Không kết nối được đài.")); }
    });
    hls.loadSource(url);
    hls.attachMedia(element);
  });
}

// Mỗi lần hỏng là một lượt hỏi máy chủ; dừng sau 3 đài để không thành vòng lặp
// gọi mạng khi máy đang mất sóng.
const MAX_CHAIN = 3;

const STATUS_LABEL = { good: "Phát tốt", shaky: "Chập chờn", dead: "Đang hỏng", unknown: "Chưa thử" };

export default function EcoRadio() {
  const [station, setStation] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [error, setError] = useState("");
  const [healed, setHealed] = useState("");
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState(readHealth);
  const [stations, setStations] = useState(allStations);
  const requestRef = useRef(0);
  const triedRef = useRef([]);

  // Giờ nghe vẫn trừ vào đúng hạn mức 5 giờ/tuần như chế độ thường. Việc trừ do
  // đồng hồ ở module lo (nó bám thẻ audio), nên hook ở đây truyền `false` —
  // chỉ dùng để lấy trạng thái lúc mở, không trừ chồng thêm một lần nữa.
  const session = getMemberSession();
  const { tokenStatus: fetched } = useRadioHeartbeat(session, false);
  const [billed, setBilled] = useState(lastStatus);
  useEffect(() => subscribeRadioStatus(setBilled), []);
  const tokenStatus = billed || fetched;
  const blocked = Boolean(tokenStatus && !tokenStatus.canListen);

  const syncHealth = () => { setHealth(readHealth()); setStations(allStations()); };

  const play = useCallback(async (target, chain = 0) => {
    if (!target) return;
    const element = getAudio();
    const request = ++requestRef.current;
    const stale = () => request !== requestRef.current;

    setError("");
    setHealed("");
    setStation(target);
    setBusy(true);
    element.dataset.station = target.id;

    const done = (url) => {
      recordOk(target.id, url);
      setBusy(false);
      syncHealth();
    };

    for (const url of urlsFor(target)) {
      try {
        await attach(element, url);
        if (stale()) return;
        done(url);
        return;
      } catch (err) {
        if (stale()) return;
        // Trình duyệt chặn tự phát: KHÔNG phải lỗi của đài, đừng ghi sổ hỏng.
        if (err?.name === "NotAllowedError") {
          setNeedsTap(true);
          setBusy(false);
          return;
        }
      }
    }

    // Địa chỉ đang có đã chết → hỏi máy chủ một lượt xem đài này giờ phát ở đâu.
    if (target.query) {
      try {
        const fresh = await resolveByName(target.query, urlsFor(target)[0]);
        if (stale()) return;
        if (fresh?.url) {
          await attach(element, fresh.url);
          if (stale()) return;
          done(fresh.url);
          setHealed(`Địa chỉ cũ của ${target.name} đã chết — đã tìm được đường mới và nhớ lại.`);
          return;
        }
      } catch (err) {
        if (stale()) return;
        if (err?.name === "NotAllowedError") { setNeedsTap(true); setBusy(false); return; }
      }
    }

    recordFail(target.id);
    syncHealth();
    triedRef.current = [...triedRef.current, target.id];
    const next = chain < MAX_CHAIN ? pickRandom(allStations(), { exclude: triedRef.current }) : null;
    if (next) { play(next, chain + 1); return; }

    setBusy(false);
    setError("Thử vài đài đều không kết nối được. Kiểm tra mạng rồi bấm Chuyển kênh.");
  }, []);

  // Nút và trạng thái phải bám thẻ audio thật: luồng có thể tự dừng khi mất
  // sóng, hoặc người dùng bấm dừng từ màn hình khoá.
  useEffect(() => {
    const element = getAudio();
    const sync = () => setPlaying(!element.paused);
    sync();
    element.addEventListener("play", sync);
    element.addEventListener("pause", sync);
    return () => {
      element.removeEventListener("play", sync);
      element.removeEventListener("pause", sync);
    };
  }, []);

  // Mở tab là có tiếng luôn. Trình duyệt có quyền chặn tự phát khi chưa có cú
  // chạm nào — lúc đó hiện nút để chạm, không coi là đài hỏng.
  useEffect(() => {
    const element = getAudio();
    if (!element.paused) {
      // Đang nghe dở từ tab khác: bám lấy đài đó thay vì bốc đài mới.
      const current = allStations().find((item) => item.id === element.dataset.station);
      if (current) setStation(current);
      return;
    }
    if (blocked) return;
    // Tiếp tục đúng đài lần trước nếu nó chưa hỏng; chưa nghe bao giờ thì bốc ngẫu nhiên.
    const last = allStations().find((item) => item.id === lastStationId());
    play(last && stationStatus(last.id) !== "dead" ? last : pickRandom(allStations()));
    // Chỉ chạy một lần lúc mở tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (blocked && playing) { getAudio().pause(); dropHls(); }
  }, [blocked, playing]);

  const stop = () => { getAudio().pause(); dropHls(); };

  // Hẹn giờ tắt: 15 → 30 → 60 phút → thôi. Đặt bằng mốc thời gian tuyệt đối chứ
  // không đếm ngược mỗi giây — một cái setInterval chạy suốt buổi nghe chỉ để
  // nhích con số là đúng thứ chế độ này sinh ra để tránh.
  const [sleep, setSleep] = useState(null); // { minutes, at }
  useEffect(() => {
    if (!sleep) return undefined;
    const timer = setTimeout(() => { stop(); setSleep(null); }, Math.max(0, sleep.at - Date.now()));
    return () => clearTimeout(timer);
  }, [sleep]);

  const cycleSleep = () => {
    const next = { 0: 15, 15: 30, 30: 60, 60: 0 }[sleep?.minutes || 0];
    setSleep(next ? { minutes: next, at: Date.now() + next * 60000 } : null);
  };

  const skip = () => {
    if (blocked) { setError("Đã hết giờ nghe radio. Nạp thêm ở mục Ví JOY của chế độ thường."); return; }
    triedRef.current = [];
    setNeedsTap(false);
    play(pickRandom(allStations(), { exclude: station ? [station.id] : [] }));
  };

  // Màn hình khoá / thanh thông báo / nút trên tai nghe: hiện tên đài và cho
  // dừng, chuyển kênh mà không phải mở lại app.
  useEffect(() => {
    if (!station) return;
    setMediaSession(station, {
      onPlay: () => play(station),
      onPause: stop,
      onStop: stop,
      onNext: skip,
    });
    setMediaPlaybackState(playing ? "playing" : "paused");
    // `play`/`skip`/`stop` đọc state mới nhất qua closure của lần render này.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station, playing]);

  const search = async (event) => {
    event.preventDefault();
    const name = query.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      const found = await resolveByName(name);
      if (!found) { setError(`Không tìm thấy đài nào tên “${name}”.`); setBusy(false); return; }
      rememberFound(found);
      setStations(allStations());
      setQuery("");
      setNeedsTap(false);
      await play({ ...found, query: found.name, mp3: found.url });
    } catch {
      setBusy(false);
      setError("Không hỏi được máy chủ tìm đài. Kiểm tra mạng rồi thử lại.");
    }
  };

  return (
    <section className="save-e-section" aria-labelledby="eco-radio">
      <h2 id="eco-radio">Hugo Radio</h2>

      {/* ── Đang phát ── */}
      <div className="save-e-card save-e-nowplaying">
        <div>
          <p className="save-e-note">
            {busy ? "Đang dò sóng…" : playing ? "Đang phát ngẫu nhiên" : needsTap ? "Chạm để bật tiếng" : "Đã dừng"}
          </p>
          <strong>{station?.name || "Chưa chọn đài"}</strong>
        </div>
        <div className="save-e-controls">
          <button
            type="button"
            className="save-e-btn"
            disabled={busy || (blocked && !playing)}
            onClick={() => {
              if (playing) { stop(); return; }
              setNeedsTap(false);
              play(station || pickRandom(allStations()));
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{playing ? "stop" : "play_arrow"}</span>
            {playing ? "Dừng" : "Bật"}
          </button>
          <button type="button" className="save-e-btn save-e-btn--plain" disabled={busy} onClick={skip}>
            <span className="material-symbols-outlined" aria-hidden="true">skip_next</span>
            Chuyển kênh
          </button>
        </div>
      </div>

      <button type="button" className="save-e-chip" aria-pressed={Boolean(sleep)} onClick={cycleSleep}>
        <span className="material-symbols-outlined" aria-hidden="true">bedtime</span>
        {sleep ? `Tự tắt sau ${sleep.minutes} phút` : "Hẹn giờ tắt"}
      </button>

      {healed ? <p className="save-e-note save-e-strong-green">{healed}</p> : null}
      {error ? <p className="save-e-note">{error}</p> : null}
      {/* Cùng đơn vị với tab HugoRadio: token, 1 token = 10 phút. */}
      {tokenStatus?.tokensLeft != null ? (
        <p className="save-e-note">
          Còn <span className="save-e-strong-green">{tokenStatus.tokensLeft} token</span> nghe radio
          {` (1 token = ${tokenStatus.minutesPerToken} phút) — hạn mức miễn phí tuần này còn ${tokenStatus.freeTokensLeft}/${tokenStatus.freeTokens} token.`}
        </p>
      ) : null}

      {/* ── Tìm đài ── */}
      <form className="save-e-card" onSubmit={search}>
        <label className="save-e-field">
          <span>Tìm đài theo tên</span>
          <input
            type="search"
            value={query}
            placeholder="VOV1, BBC, Jazz…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit" className="save-e-btn save-e-btn--wide" disabled={busy || !query.trim()}>
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          Tìm và phát
        </button>
        <p className="save-e-note">
          Máy chủ dò giúp trong danh bạ Radio Browser và chỉ trả về đài đang phát được. Đài tìm thấy
          được nhớ lại, lần sau nằm luôn trong vòng bốc ngẫu nhiên.
        </p>
      </form>

      {/* ── Danh sách phụ + theo dõi ── */}
      <div className="save-e-card">
        <p className="save-e-note">Chọn tay và theo dõi sức khoẻ từng đài</p>
        {stations.map((item) => {
          const status = stationStatus(item.id);
          const entry = health[item.id];
          return (
            <div className="save-e-row" key={item.id}>
              <button
                type="button"
                className="save-e-rowmain"
                disabled={busy || blocked}
                onClick={() => { triedRef.current = []; setNeedsTap(false); play(item); }}
              >
                <strong>
                  <span className={`save-e-status save-e-status--${status}`} aria-hidden="true" />
                  {item.name}
                </strong>
                <small>
                  {STATUS_LABEL[status]}
                  {entry?.ok ? ` · ${entry.ok} lần phát được` : ""}
                  {entry?.fail ? ` · ${entry.fail} lần lỗi` : ""}
                  {entry?.url ? " · đã học địa chỉ mới" : ""}
                </small>
              </button>
              {entry?.found ? (
                <button
                  type="button"
                  className="save-e-btn save-e-btn--plain"
                  aria-label={`Bỏ đài ${item.name}`}
                  onClick={() => { forgetFound(item.id); syncHealth(); }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          className="save-e-link"
          onClick={() => { resetHealth(); syncHealth(); }}
        >
          Xoá sổ theo dõi
        </button>
      </div>

      <p className="save-e-note">
        Luồng radio chạy ở 64–128 kbps, khoảng 30–60 MB mỗi giờ nghe — thấp hơn video hàng chục lần.
        Đài MP3 rẻ nhất: một kết nối chảy liên tục. Đài HLS cần thêm bộ giải mã (~0,5 MB, tải một
        lần rồi máy nhớ) và hỏi máy chủ vài giây một lần, nên chỉ dùng khi đài không có đường MP3.
      </p>
    </section>
  );
}
