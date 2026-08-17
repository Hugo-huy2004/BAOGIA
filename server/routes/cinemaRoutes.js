import express from 'express';
import mongoose from 'mongoose';
import CinemaMovie from '../models/CinemaMovie.js';

const router = express.Router();

// Danh mục thể loại phim
const CINEMA_CATEGORIES = [
  { id: "all", labelVi: "Tất cả Phim", icon: "movie" },
  { id: "classic", labelVi: "Hài Sạc Lô & Kinh Điển", icon: "theater_comedy" },
  { id: "shorts", labelVi: "Phim Ngắn 3D", icon: "animation" },
  { id: "scifi", labelVi: "Khoa Học Viễn Tưởng", icon: "rocket_launch" },
  { id: "horror", labelVi: "Kinh Dị Public Domain", icon: "skull" },
  { id: "doc", labelVi: "Tài Liệu Vũ Trụ", icon: "public" },
  { id: "action", labelVi: "Võ Thuật & Hành Động", icon: "sports_martial_arts" },
];

// API PROXY STREAMING VIDEO (Giải quyết dứt điểm 100% lỗi CORS & 302 Redirect từ Archive.org & CDN bên thứ ba)
router.get('/stream-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Thiếu tham số url query');
  }

  try {
    const range = req.headers.range;
    const headers = {};
    if (range) {
      headers['Range'] = range;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Lỗi stream từ nguồn gốc: ${upstreamRes.statusText}`);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'video/mp4');

    if (upstreamRes.headers.get('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length'));
    }
    if (upstreamRes.headers.get('content-range')) {
      res.setHeader('Content-Range', upstreamRes.headers.get('content-range'));
      res.status(206);
    } else {
      res.status(200);
    }

    // Node 18+ web readable stream conversion for Express response
    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).send(`Stream proxy error: ${error.message}`);
    }
  }
});

// API GET /api/cinema/categories — Lấy danh mục thể loại
router.get('/categories', async (req, res) => {
  res.json({ success: true, categories: CINEMA_CATEGORIES });
});

// API GET /api/cinema/featured — Lấy phim nổi bật từ MongoDB
router.get('/featured', async (req, res) => {
  try {
    let movie = await CinemaMovie.findOne({ featured: true, active: true }).lean();
    if (!movie) {
      movie = await CinemaMovie.findOne({ active: true }).lean();
    }
    if (movie) {
      movie.id = movie.movieId || movie._id;
      return res.json({ success: true, movie });
    }
    return res.json({ success: true, movie: null });
  } catch {
    res.json({ success: true, movie: null });
  }
});

// API GET /api/cinema/movies — Lấy danh sách phim do Admin quản lý từ MongoDB
router.get('/movies', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 100 } = req.query;
    const query = { active: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { tagline: { $regex: q, $options: 'i' } },
        { director: { $regex: q, $options: 'i' } },
      ];
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 100);

    const [total, rawMovies] = await Promise.all([
      CinemaMovie.countDocuments(query),
      CinemaMovie.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
    ]);

    const movies = rawMovies.map((m) => ({
      ...m,
      id: m.movieId || m._id,
    }));

    res.json({
      success: true,
      total,
      page: p,
      limit: l,
      movies,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message || "Lỗi lấy danh sách phim",
      total: 0,
      movies: [],
    });
  }
});

// API GET /api/cinema/movies/:id — Lấy chi tiết phim từ MongoDB
router.get('/movies/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    let movie = await CinemaMovie.findOne({ movieId: targetId, active: true }).lean();
    if (!movie && mongoose.Types.ObjectId.isValid(targetId)) {
      movie = await CinemaMovie.findById(targetId).lean();
    }

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phim' });
    }

    movie.id = movie.movieId || movie._id;

    const rawRelated = await CinemaMovie.find({
      active: true,
      _id: { $ne: movie._id },
    })
      .limit(6)
      .lean();

    const related = rawRelated.map((m) => ({ ...m, id: m.movieId || m._id }));

    res.json({ success: true, movie, related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN ENDPOINTS (QUẢN TRỊ PHIM HỆ THỐNG) ──

// GET /api/cinema/admin/movies — Admin lấy toàn bộ phim (cả ẩn và hiện)
router.get('/admin/movies', async (req, res) => {
  try {
    const rawMovies = await CinemaMovie.find({}).sort({ createdAt: -1 }).lean();
    const movies = rawMovies.map((m) => ({
      ...m,
      id: m.movieId || m._id,
    }));
    res.json({ success: true, count: movies.length, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cinema/admin/movies — Admin thêm mới hoặc cập nhật bộ phim vào MongoDB
router.post('/admin/movies', async (req, res) => {
  try {
    const {
      id,
      movieId,
      title,
      tagline,
      description,
      category,
      genres,
      year,
      director,
      duration,
      durationSeconds,
      badge,
      mpaaRating,
      imdbRating,
      joyReward,
      videoUrl,
      videoFallbackUrl,
      poster,
      backdrop,
      cast,
      featured,
      active,
    } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Tiêu đề phim và Đường dẫn Video là bắt buộc' });
    }

    const targetId = id || movieId || `movie-${Date.now()}`;

    const updateData = {
      movieId: targetId,
      title: title.trim(),
      tagline: tagline ? tagline.trim() : '',
      description: description ? description.trim() : 'Bộ phim điện ảnh chất lượng cao',
      category: category || 'classic',
      genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(s => s.trim()) : ['Điện Ảnh']),
      year: parseInt(year, 10) || new Date().getFullYear(),
      director: director || 'Admin',
      duration: duration || '120 phút',
      durationSeconds: parseInt(durationSeconds, 10) || 7200,
      badge: badge || 'HD High Quality',
      mpaaRating: mpaaRating || 'PG-13',
      imdbRating: imdbRating || '9.0',
      joyReward: parseInt(joyReward, 10) || 100,
      videoUrl: videoUrl.trim(),
      videoFallbackUrl: videoFallbackUrl ? videoFallbackUrl.trim() : videoUrl.trim(),
      poster: poster || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
      backdrop: backdrop || poster || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&auto=format&fit=crop&q=80',
      cast: Array.isArray(cast) ? cast : [],
      featured: Boolean(featured),
      active: active !== undefined ? Boolean(active) : true,
    };

    const movie = await CinemaMovie.findOneAndUpdate(
      { movieId: targetId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Đã lưu bộ phim "${movie.title}" vào MongoDB thành công!`,
      movie: { ...movie.toObject(), id: movie.movieId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi lưu phim' });
  }
});

// DELETE /api/cinema/admin/movies/:id — Admin xóa một bộ phim khỏi MongoDB
router.delete('/admin/movies/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isObjId = mongoose.Types.ObjectId.isValid(targetId);
    const filter = isObjId
      ? { $or: [{ movieId: targetId }, { _id: targetId }] }
      : { movieId: targetId };

    const result = await CinemaMovie.deleteOne(filter);
    res.json({
      success: true,
      message: `Đã xóa bộ phim khỏi MongoDB thành công!`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cinema/admin/purge-all — Admin xóa sạch TOÀN BỘ dữ liệu phim trong MongoDB
router.delete('/admin/purge-all', async (req, res) => {
  try {
    const result = await CinemaMovie.deleteMany({});
    res.json({ success: true, message: `Đã xóa sạch ${result.deletedCount} bộ phim trong cơ sở dữ liệu MongoDB!`, count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
