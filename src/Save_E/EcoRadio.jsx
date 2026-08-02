import { useEffect, useRef, useState } from "react";
import { useRadioHeartbeat } from "../components/member/RadioTokenStatus";
import { getMemberSession } from "../services/authSession";

// Danh sách đài CỐ ĐỊNH nằm sẵn trong mã nguồn: mở lên là phát thẳng luồng của
// đài, không tải danh mục, không ảnh bìa, không tìm kiếm. Máy chủ Hugo chỉ được
// gọi trong lúc đang phát để trừ giờ nghe (giữ nguyên luật token của bản thường).
const STATIONS = [
  { id: "vov1", name: "VOV1 · Thời sự", url: "https://str.vov.gov.vn/vovlive/vov1vov5Vietnamese.sdp_aac/playlist.m3u8", fallback: "https://stream-155.zeno.fm/4q7y9hvkp2zuv" },
  { id: "vov3", name: "VOV3 · Âm nhạc", url: "https://str.vov.gov.vn/vovlive/vov3.sdp_aac/playlist.m3u8" },
  { id: "rfi", name: "RFI Tiếng Việt", url: "https://rfienvietnamien64k.ice.infomaniak.ch/rfienvietnamien-64.mp3" },
  { id: "npr", name: "NPR (tiếng Anh)", url: "https://npr-ice.streamguys1.com/live.mp3" },
];

// Một thẻ <audio> duy nhất ở module scope: đổi tab vẫn nghe tiếp.
let audio = null;
const getAudio = () => {
  if (!audio) {
    audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.8;
  }
  return audio;
};

export default function EcoRadio() {
  const [playingId, setPlayingId] = useState(null);
  const [error, setError] = useState("");
  const triedFallback = useRef(false);
  // Radio ở chế độ thường tính giờ nghe bằng token. Chế độ tiết kiệm KHÔNG được
  // phép lách luật đó — dùng lại đúng hook nhịp tim của bản thường, nó chỉ gọi
  // máy chủ trong lúc đang phát.
  const session = getMemberSession();
  const { tokenStatus } = useRadioHeartbeat(session, Boolean(playingId));
  const blocked = Boolean(tokenStatus && !tokenStatus.canListen);

  // Nút phải bám trạng thái THẬT của thẻ audio: luồng có thể tự dừng khi mất
  // sóng, hoặc người dùng bấm dừng từ màn hình khoá.
  useEffect(() => {
    const element = getAudio();
    const sync = () => setPlayingId(element.paused ? null : element.dataset.station || null);
    sync();
    element.addEventListener("play", sync);
    element.addEventListener("pause", sync);
    return () => {
      element.removeEventListener("play", sync);
      element.removeEventListener("pause", sync);
    };
  }, []);

  useEffect(() => {
    if (blocked && playingId) getAudio().pause();
  }, [blocked, playingId]);

  const play = (station, useFallback = false) => {
    const element = getAudio();
    const url = useFallback ? station.fallback : station.url;
    if (!url) {
      setError("Đài này hiện không phát được.");
      return;
    }
    triedFallback.current = useFallback;
    setError("");
    element.onerror = () => {
      // Chrome/Android không phát được HLS — đổi sang luồng MP3 dự phòng.
      if (!useFallback && station.fallback) play(station, true);
      else {
        element.onerror = null;
        setError("Không kết nối được đài.");
        setPlayingId(null);
      }
    };
    element.src = url;
    element.dataset.station = station.id;
    element.play().catch(() => element.onerror());
  };

  const toggle = (station) => {
    const element = getAudio();
    if (!element.paused && element.dataset.station === station.id) {
      element.pause();
      return;
    }
    if (blocked) {
      setError("Đã hết giờ nghe radio. Nạp thêm ở mục Ví JOY của chế độ thường.");
      return;
    }
    play(station);
  };

  return (
    <section className="save-e-section" aria-labelledby="eco-radio">
      <h2 id="eco-radio">Hugo Radio</h2>
      <div className="save-e-card">
        {STATIONS.map((station) => (
          <div className="save-e-row" key={station.id}>
            <div>
              <strong>{station.name}</strong>
              <small>{playingId === station.id ? "Đang phát" : "Phát trực tiếp"}</small>
            </div>
            <button
              type="button"
              className="save-e-btn"
              aria-pressed={playingId === station.id}
              disabled={blocked && playingId !== station.id}
              onClick={() => toggle(station)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {playingId === station.id ? "stop" : "play_arrow"}
              </span>
              {playingId === station.id ? "Dừng" : "Nghe"}
            </button>
          </div>
        ))}
        {error ? <p className="save-e-note">{error}</p> : null}
        {tokenStatus?.remainingMinutes != null ? (
          <p className="save-e-note">
            Còn <span className="save-e-strong-green">{tokenStatus.remainingMinutes} phút</span> nghe radio.
          </p>
        ) : null}
        <p className="save-e-note">
          Các luồng trên chạy ở 64–128 kbps, tức khoảng 30–60 MB mỗi giờ nghe —
          thấp hơn video hàng chục lần. Đó là lý do chế độ này giữ radio và bỏ
          mọi thứ có hình động.
        </p>
      </div>
    </section>
  );
}
