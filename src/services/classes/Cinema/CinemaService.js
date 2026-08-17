const API_BASE = import.meta.env.VITE_API_URL || "/api";

const MEDIA_PROXY = (import.meta.env.VITE_CINEMA_MEDIA_PROXY || "").replace(/\/+$/, "");
const ARCHIVE_URL = /^https:\/\/([a-z0-9-]+\.)*archive\.org\//i;

/**
 * Đưa một URL của Internet Archive qua cửa trung chuyển ở biên Cloudflare khi
 * `VITE_CINEMA_MEDIA_PROXY` được đặt (xem workers/media-proxy). Không đặt thì
 * trả nguyên URL — app vẫn chạy, chỉ là đi thẳng ra máy dữ liệu ở Mỹ.
 */
export function mediaUrl(url) {
  if (!url) return "";
  let targetUrl = url;
  if (targetUrl.includes("/services/img/")) {
    const id = targetUrl.split("/services/img/")[1]?.replace(/\/$/, "");
    if (id) {
      targetUrl = `https://archive.org/download/${id}/__ia_thumb.jpg`;
    }
  }
  if (!MEDIA_PROXY || !ARCHIVE_URL.test(targetUrl)) return targetUrl;
  return `${MEDIA_PROXY}/?u=${encodeURIComponent(targetUrl)}`;
}

export function videoSources(movie) {
  const secureUrl = movie?.secureStreamUrl || movie?.streamUrl;
  const direct = [secureUrl, movie?.videoUrl, movie?.videoFallbackUrl].filter(Boolean);
  const viaEdge = direct.map(mediaUrl).filter((url) => !direct.includes(url));
  // Direct CDN links first for 0ms latency, edge fallback if direct is blocked
  return [...new Set([...direct, ...viaEdge])];
}

/**
 * Dịch vụ Hugo Cinema: gọi API kệ phim và giữ những gì chỉ máy này cần biết
 * (đã lưu, đã thích, xem tới đâu).
 *
 * Bản trước còn một lớp `MovieModel` bọc mọi phim lại, và chính lớp đó là nơi
 * dữ liệu giả được sinh ra: thiếu điểm thì gán '9.0', thiếu nhãn thì gán
 * 'PG-13', thiếu diễn viên thì gán sẵn bốn người kèm ảnh Unsplash. Máy chủ giờ
 * trả về đúng những trường có thật, nên lớp bọc đó đã bỏ — component đọc thẳng
 * dữ liệu JSON.
 */
class CinemaService {
  constructor() {
    this.savedKey = "hugo_cinema_saved_v3";
    this.likedKey = "hugo_cinema_liked_v3";
    this.progressKey = "hugo_cinema_progress_v1";
    this.moviesCache = new Map();
  }

  async #get(path) {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /** Kệ phim theo thể loại/từ khoá. Có bộ nhớ đệm RAM 5 phút cho siêu tốc độ. */
  async getMovies({ category = "all", search = "", limit = 60 } = {}) {
    const cacheKey = `${category}_${search.trim()}_${limit}`;
    const cached = this.moviesCache.get(cacheKey);
    if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
      return cached.data;
    }

    const params = new URLSearchParams({ limit: String(limit) });
    if (category && category !== "all") params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    try {
      const data = await this.#get(`/cinema/movies?${params}`);
      const list = Array.isArray(data.movies) ? data.movies : [];
      this.moviesCache.set(cacheKey, { time: Date.now(), data: list });
      return list;
    } catch {
      return [];
    }
  }

  /** Chi tiết một phim + danh sách xem tiếp cùng thể loại. */
  async getMovie(id) {
    try {
      const data = await this.#get(`/cinema/movies/${encodeURIComponent(id)}`);
      return { movie: data.movie || null, related: data.related || [] };
    } catch {
      return { movie: null, related: [] };
    }
  }

  /** Xin token luồng phát có chữ ký HMAC 2 giờ từ server. */
  async getStreamToken(movieId) {
    if (!movieId) return null;
    try {
      const res = await fetch(`${API_BASE}/cinema/stream-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ movieId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success && data.streamUrl ? data.streamUrl : null;
    } catch {
      return null;
    }
  }

  // ── Trạng thái lưu trên máy ────────────────────────────────────────────────

  #read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  #write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Chế độ riêng tư của Safari chặn ghi: mất danh sách lưu, không mất phim.
    }
  }

  getSavedIds() {
    return this.#read(this.savedKey, []);
  }

  getLikedIds() {
    return this.#read(this.likedKey, []);
  }

  /** Bật/tắt một id trong danh sách; trả về `true` nếu vừa được thêm vào. */
  #toggle(key, id) {
    const list = this.#read(key, []);
    const added = !list.includes(id);
    this.#write(key, added ? [...list, id] : list.filter((item) => item !== id));
    return added;
  }

  toggleSaved(id) {
    return this.#toggle(this.savedKey, id);
  }

  toggleLiked(id) {
    return this.#toggle(this.likedKey, id);
  }

  /** { [movieId]: { seconds, duration, at } } — để dựng hàng "Xem tiếp". */
  getProgress() {
    return this.#read(this.progressKey, {});
  }

  /**
   * Ghi lại chỗ đang xem. Phim xem gần xong (>95%) thì xoá khỏi danh sách xem
   * tiếp, còn dưới 30 giây thì chưa tính là đã bắt đầu.
   */
  saveProgress(id, seconds, duration) {
    if (!id || !(seconds > 30) || !(duration > 0)) return;
    const all = this.getProgress();
    if (seconds / duration > 0.95) delete all[id];
    else all[id] = { seconds: Math.round(seconds), duration: Math.round(duration), at: Date.now() };
    this.#write(this.progressKey, all);
  }

  clearProgress(id) {
    const all = this.getProgress();
    delete all[id];
    this.#write(this.progressKey, all);
  }
}

export const cinemaService = new CinemaService();
