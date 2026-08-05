import { useRadioStore } from "../../../stores/radioStore";

/**
 * Thanh "đang phát" nổi ngay trên tab bar, kiểu Apple Podcasts / Music.
 *
 * Nằm ngoài cây tab một cách có chủ đích: nó phải hiện ở MỌI tab, kể cả khi
 * app radio đã đóng. Điều đó chỉ đúng được vì thẻ audio sống trong
 * radioStore chứ không trong MemberRadioTab.
 *
 * Không render gì khi chưa chọn đài — thanh chỉ tồn tại khi thật sự có thứ
 * đang phát, đúng như iOS.
 */
export default function RadioMiniPlayer({ onOpen }) {
  const station = useRadioStore((s) => s.station);
  const isPlaying = useRadioStore((s) => s.isPlaying);
  const isBuffering = useRadioStore((s) => s.isBuffering);
  const toggle = useRadioStore((s) => s.toggle);
  const stop = useRadioStore((s) => s.stop);

  if (!station) return null;

  return (
    <div className="radio-mini">
      <button
        type="button"
        className="radio-mini__open"
        onClick={onOpen}
        aria-label={`Mở radio — đang phát ${station.name}`}
      >
        <span className="radio-mini__art" aria-hidden="true">
          <span className="material-symbols-outlined">radio</span>
        </span>
        <span className="radio-mini__text">
          <span className="radio-mini__title">{station.name}</span>
          <span className="radio-mini__sub">
            {isBuffering ? "Đang kết nối…" : isPlaying ? "Đang phát trực tiếp" : "Tạm dừng"}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="radio-mini__btn"
        onClick={toggle}
        aria-label={isPlaying ? "Tạm dừng" : "Phát"}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>

      <button type="button" className="radio-mini__btn" onClick={stop} aria-label="Dừng hẳn">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
