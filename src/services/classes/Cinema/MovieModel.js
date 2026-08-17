/**
 * Class MovieModel - Mô hình đối tượng Phim theo chuẩn OOP (Object-Oriented Programming).
 * Đóng gói toàn bộ dữ liệu, getter tính toán và phương thức xử lý của một bộ phim.
 */
export class MovieModel {
  /**
   * @param {Object} data - Dữ liệu thô của phim từ API hoặc storage
   */
  constructor(data = {}) {
    this.id = String(data.id || data.movieId || '');
    this.movieId = String(data.movieId || data.id || '');
    this.title = String(data.title || 'Chưa có tiêu đề');
    this.tagline = String(data.tagline || '');
    this.description = String(data.description || '');
    this.category = String(data.category || 'all');
    this.genres = Array.isArray(data.genres) ? data.genres : [data.category || 'Điện Ảnh'];
    this.year = Number(data.year) || new Date().getFullYear();
    this.director = String(data.director || 'Nhiều tác giả');
    this.duration = String(data.duration || '0 phút');
    this.durationSeconds = Number(data.durationSeconds) || 0;
    this.badge = String(data.badge || 'HD');
    this.mpaaRating = String(data.mpaaRating || 'PG-13');
    this.imdbRating = String(data.imdbRating || data.rating || '9.0');
    this.joyReward = Number(data.joyReward) || 100;
    this.videoUrl = String(data.videoUrl || '');
    this.videoFallbackUrl = String(data.videoFallbackUrl || '');
    this.poster = String(data.poster || '');
    this.backdrop = String(data.backdrop || data.poster || '');
    this.views = String(data.views || '0');
    this.rating = Number(data.rating) || 5.0;
    this.featured = Boolean(data.featured);
    this.cast = Array.isArray(data.cast) && data.cast.length > 0 ? data.cast : [
      { name: "Charlie Chaplin", role: "Sạc Lô", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
      { name: "Edna Purviance", role: "Nữ chính", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80" },
      { name: "Buster Keaton", role: "Diễn viên", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
      { name: "Jackie Coogan", role: "Cậu bé", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80" }
    ];
  }

  /** Lấy định dạng thời lượng đọc dễ (Ví dụ: "12m" hoặc "2h 15m") */
  get formattedDuration() {
    if (this.durationSeconds > 3600) {
      const hours = Math.floor(this.durationSeconds / 3600);
      const mins = Math.floor((this.durationSeconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    return this.duration;
  }

  /** Phim ngắn (dưới 30 phút) */
  get isShortFilm() {
    return this.durationSeconds > 0 && this.durationSeconds <= 1800;
  }

  /** Phim dài (trên 45 phút) */
  get isFeatureLength() {
    return this.durationSeconds >= 2700;
  }

  /** Lấy nhãn chất lượng chuẩn */
  get qualityLabel() {
    return this.badge.includes('4K') ? '4K Ultra HD' : 'Full HD 1080p';
  }

  /** Kiểm tra xem phim có đủ điều kiện thưởng JOY không */
  get hasJoyReward() {
    return this.joyReward > 0;
  }

  /** Chuyển đổi đối tượng về JSON để gửi API hoặc lưu trữ */
  toJSON() {
    return {
      id: this.id,
      movieId: this.movieId,
      title: this.title,
      tagline: this.tagline,
      description: this.description,
      category: this.category,
      genres: this.genres,
      year: this.year,
      director: this.director,
      duration: this.duration,
      durationSeconds: this.durationSeconds,
      badge: this.badge,
      mpaaRating: this.mpaaRating,
      imdbRating: this.imdbRating,
      joyReward: this.joyReward,
      videoUrl: this.videoUrl,
      videoFallbackUrl: this.videoFallbackUrl,
      poster: this.poster,
      backdrop: this.backdrop,
      views: this.views,
      rating: this.rating,
      featured: this.featured,
      cast: this.cast,
    };
  }

  /** Khởi tạo đối tượng MovieModel từ API JSON */
  static fromJSON(json) {
    return new MovieModel(json);
  }
}
