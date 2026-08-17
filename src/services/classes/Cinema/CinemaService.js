import { MovieModel } from './MovieModel';

/**
 * Class CinemaService - Đóng gói dịch vụ gọi API MongoDB và quản lý dữ liệu phim theo hướng đối tượng (OOP).
 */
export class CinemaService {
  constructor() {
    this.cacheCategories = null;
    this.cacheFeatured = null;
    this.cacheMoviesMap = new Map();
    this.watchlistStorageKey = 'hugo_cinema_watchlist_v2';
    this.likedStorageKey = 'hugo_cinema_liked_v2';
  }

  /**
   * Gọi API lấy danh sách thể loại phim từ MongoDB server
   * @returns {Promise<Array<{id: string, labelVi: string, icon: string}>>}
   */
  async getCategories() {
    if (this.cacheCategories) return this.cacheCategories;

    try {
      const res = await fetch('/api/cinema/categories');
      const data = await res.json();
      if (data?.success && Array.isArray(data.categories)) {
        this.cacheCategories = data.categories;
        return this.cacheCategories;
      }
    } catch {
      // Bỏ qua lỗi mạng
    }

    return [
      { id: "all", labelVi: "Tất cả Phim", icon: "movie" },
      { id: "shorts", labelVi: "Phim Ngắn 3D", icon: "animation" },
      { id: "scifi", labelVi: "Khoa Học Viễn Tưởng", icon: "rocket_launch" },
      { id: "classic", labelVi: "Hài & Kinh Điển", icon: "theater_comedy" },
      { id: "horror", labelVi: "Kinh Dị Public Domain", icon: "skull" },
      { id: "doc", labelVi: "Tài Liệu Vũ Trụ", icon: "public" },
    ];
  }

  /**
   * Gọi API lấy phim nổi bật (Spotlight Hero) từ MongoDB
   * @returns {Promise<MovieModel|null>}
   */
  async getFeaturedMovie() {
    if (this.cacheFeatured) return this.cacheFeatured;

    try {
      const res = await fetch('/api/cinema/featured');
      const data = await res.json();
      if (data?.success && data.movie) {
        this.cacheFeatured = MovieModel.fromJSON(data.movie);
        return this.cacheFeatured;
      }
    } catch {
      // Bỏ qua lỗi mạng
    }

    const fallbackMovies = await this.getMovies();
    return fallbackMovies[0] || null;
  }

  /**
   * Gọi API lấy danh sách phim từ MongoDB với bộ lọc thể loại, tìm kiếm và phân trang
   * @param {Object} options - { category, search, page, limit }
   * @returns {Promise<Array<MovieModel>>}
   */
  async getMovies({ category = 'all', search = '', page = 1, limit = 20 } = {}) {
    const cacheKey = `${category}_${search}_${page}_${limit}`;

    try {
      const queryParams = new URLSearchParams();
      if (category && category !== 'all') queryParams.append('category', category);
      if (search && search.trim()) queryParams.append('search', search.trim());
      queryParams.append('page', String(page));
      queryParams.append('limit', String(limit));

      const res = await fetch(`/api/cinema/movies?${queryParams.toString()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.movies)) {
        const models = data.movies.map((m) => MovieModel.fromJSON(m));
        this.cacheMoviesMap.set(cacheKey, models);
        return models;
      }
    } catch {
      // Bỏ qua lỗi mạng
    }

    if (this.cacheMoviesMap.has(cacheKey)) {
      return this.cacheMoviesMap.get(cacheKey);
    }

    return [];
  }

  /**
   * Lấy chi tiết 1 phim theo ID từ API MongoDB
   * @param {string} id
   * @returns {Promise<{movie: MovieModel|null, related: Array<MovieModel>}>}
   */
  async getMovieById(id) {
    try {
      const res = await fetch(`/api/cinema/movies/${id}`);
      const data = await res.json();
      if (data?.success && data.movie) {
        return {
          movie: MovieModel.fromJSON(data.movie),
          related: Array.isArray(data.related) ? data.related.map((m) => MovieModel.fromJSON(m)) : [],
        };
      }
    } catch {
      // Bỏ qua lỗi mạng
    }

    const all = await this.getMovies();
    const found = all.find((m) => m.id === id) || null;
    return {
      movie: found,
      related: all.filter((m) => m.id !== id).slice(0, 4),
    };
  }

  /**
   * Lấy danh sách ID phim đã lưu (Watchlist) từ localStorage
   * @returns {Array<string>}
   */
  getWatchlistIds() {
    try {
      const saved = localStorage.getItem(this.watchlistStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu hoặc xóa phim khỏi danh sách xem sau (Watchlist)
   * @param {string} movieId
   * @returns {boolean} isWatchlisted
   */
  toggleWatchlist(movieId) {
    const list = this.getWatchlistIds();
    const index = list.indexOf(movieId);
    let nextList = [];
    let added = false;

    if (index >= 0) {
      nextList = list.filter((id) => id !== movieId);
    } else {
      nextList = [...list, movieId];
      added = true;
    }

    try {
      localStorage.setItem(this.watchlistStorageKey, JSON.stringify(nextList));
    } catch {}

    return added;
  }

  /**
   * Lấy danh sách ID phim đã thích (Liked) từ localStorage
   * @returns {Array<string>}
   */
  getLikedIds() {
    try {
      const saved = localStorage.getItem(this.likedStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Thích hoặc bỏ thích phim
   * @param {string} movieId
   * @returns {boolean} isLiked
   */
  toggleLike(movieId) {
    const list = this.getLikedIds();
    const index = list.indexOf(movieId);
    let nextList = [];
    let liked = false;

    if (index >= 0) {
      nextList = list.filter((id) => id !== movieId);
    } else {
      nextList = [...list, movieId];
      liked = true;
    }

    try {
      localStorage.setItem(this.likedStorageKey, JSON.stringify(nextList));
    } catch {}

    return liked;
  }
}

// Export singleton instance theo nguyên lý OOP Service Object
export const cinemaService = new CinemaService();
