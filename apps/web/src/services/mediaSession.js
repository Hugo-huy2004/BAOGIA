// Đưa đài đang phát ra màn hình khoá / thanh thông báo / tai nghe.
//
// Không có thứ này thì người dùng phải mở lại app mới dừng được radio, và màn
// hình khoá chỉ hiện tên miền của luồng phát. Media Session là API sẵn có của
// trình duyệt — không thêm thư viện nào.
//
// Trình duyệt chỉ hiện nút cho những hành động ĐÃ đăng ký, nên `nexttrack` chỉ
// xuất hiện khi người gọi thật sự truyền `onNext` vào.

const supported = () => typeof navigator !== "undefined" && "mediaSession" in navigator;

/**
 * @param {object} station  { name, source? } — đài đang phát, null nghĩa là dọn sạch.
 * @param {object} handlers { onPlay, onPause, onNext, onPrevious, onStop }
 */
export function setMediaSession(station, handlers = {}) {
  if (!supported()) return;

  if (!station) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }

  navigator.mediaSession.metadata = new window.MediaMetadata({
    title: station.name,
    artist: station.source || "HugoRadio",
    album: "Hugo Studio",
  });

  const actions = {
    play: handlers.onPlay,
    pause: handlers.onPause,
    stop: handlers.onStop || handlers.onPause,
    nexttrack: handlers.onNext,
    previoustrack: handlers.onPrevious,
  };

  for (const [action, handler] of Object.entries(actions)) {
    try {
      navigator.mediaSession.setActionHandler(action, handler || null);
    } catch {
      // Trình duyệt cũ không biết hành động này — bỏ qua, các nút khác vẫn chạy.
    }
  }
}

/** "playing" | "paused" | "none" — quyết định biểu tượng trên màn hình khoá. */
export function setMediaPlaybackState(state) {
  if (!supported()) return;
  navigator.mediaSession.playbackState = state;
}
