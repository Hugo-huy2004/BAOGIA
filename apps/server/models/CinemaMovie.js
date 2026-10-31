import mongoose from 'mongoose';

/**
 * Một bộ phim trong thư viện Hugo Cinema.
 *
 * Schema cũ có `imdbRating` mặc định '9.0', `mpaaRating` mặc định 'PG-13',
 * `badge` mặc định '4K Ultra HD' và một mảng `cast` mặc định là bốn diễn viên
 * Chaplin kèm ảnh Unsplash — nghĩa là mọi phim mới đều tự nhận điểm IMDb, nhãn
 * kiểm duyệt và dàn diễn viên mà không ai kiểm chứng. Những trường đó đã bỏ:
 * chỉ giữ dữ liệu lấy được từ nguồn thật (Internet Archive) hoặc do admin nhập.
 */
const CinemaMovieSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, unique: true, index: true },
    // 'archive' = đồng bộ từ Internet Archive; 'admin' = admin tự thêm.
    source: { type: String, enum: ['archive', 'admin'], default: 'admin', index: true },
    archiveId: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    subjects: { type: [String], default: [] },
    year: { type: Number, default: 0 },
    creator: { type: String, default: '' },
    duration: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    license: { type: String, default: '' },
    // Độ phân giải thật của bản phát chính — giao diện gắn nhãn HD/1080p/4K từ
    // đây chứ không tự phong như trường `badge` đã bị bỏ.
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    videoUrl: { type: String, required: true },
    videoFallbackUrl: { type: String, default: '' },
    poster: { type: String, required: true },
    // Ảnh động/ảnh lớn cắt từ chính bộ phim — dùng cho màn hero, xem pickPreview().
    preview: { type: String, default: '' },
    // Lượt xem và điểm đánh giá tại nguồn (Internet Archive), không phải của portal.
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CinemaMovieSchema.index({ views: -1 });

export default mongoose.models.CinemaMovie || mongoose.model('CinemaMovie', CinemaMovieSchema);
