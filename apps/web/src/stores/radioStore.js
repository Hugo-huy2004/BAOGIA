import { create } from "zustand";

/**
 * Phát radio sống ngoài cây component.
 *
 * Trước đây thẻ `Audio` được tạo trong `MemberRadioTab` và bị huỷ ở hàm dọn dẹp
 * của effect. Tab radio là một app lazy-mount trong `MemberUtilitiesTab`, nên
 * bấm sang tab khác là component unmount và nhạc tắt giữa chừng — không app
 * nghe nào hành xử như vậy. Thẻ audio giờ nằm ở module scope: nó được tạo một
 * lần cho cả phiên và không ai unmount được nó.
 *
 * Store CHỈ giữ những gì thanh now-playing cần biết (đài nào, đang phát hay
 * không, đang đệm hay không, âm lượng). Logic dò đài — thử nhiều địa chỉ, hỏi
 * lại máy chủ, tự nhảy đài hỏng — vẫn ở trong component vì nó cần danh sách đài
 * theo danh mục đang mở, thứ không thuộc về trạng thái phát.
 */

let audioEl = null;
let hls = null;

/** Thẻ audio dùng chung. Tạo lúc cần đầu tiên, không bao giờ huỷ. */
export function getRadioAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "none";
    audioEl.volume = useRadioStore.getState().volume / 100;
  }
  return audioEl;
}

/**
 * Instance hls.js của lượt phát hiện tại (chỉ đài .m3u8 mới có).
 *
 * Bày ra dưới dạng `.current` để dùng y như một ref của React — component vốn
 * viết `hlsRef.current?.destroy()`, giữ nguyên hình dạng đó thì phần tách này
 * không phải sửa vào logic dò đài.
 */
export const hlsHandle = {
  get current() { return hls; },
  set current(next) { hls = next; },
  destroy() { hls?.destroy(); hls = null; },
};

export const useRadioStore = create((set, get) => ({
  station: null,
  isPlaying: false,
  isBuffering: false,
  volume: 70,

  setStation: (station) => set({ station }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setBuffering: (isBuffering) => set({ isBuffering }),

  setVolume: (volume) => {
    set({ volume });
    if (audioEl) audioEl.volume = volume / 100;
  },

  /** Tạm dừng, giữ nguyên đài để bấm phát lại là chạy tiếp. */
  pause: () => {
    audioEl?.pause();
    set({ isPlaying: false, isBuffering: false });
  },

  /** Tắt hẳn: nhả luồng và xoá đài, thanh now-playing biến mất. */
  stop: () => {
    hlsHandle.destroy();
    if (audioEl) {
      audioEl.pause();
      audioEl.src = "";
    }
    set({ station: null, isPlaying: false, isBuffering: false });
  },

  /** Bấm nút play/pause trên thanh now-playing. */
  toggle: () => {
    const { isPlaying, station } = get();
    if (!station) return;
    if (isPlaying) {
      get().pause();
      return;
    }
    set({ isBuffering: true });
    audioEl?.play().catch(() => set({ isBuffering: false }));
  },
}));
