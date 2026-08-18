import express from 'express';
import mongoose from 'mongoose';
import CinemaMovie from '../models/CinemaMovie.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import { syncCinemaLibrary } from '../services/cinemaLibrary.js';
import { CINEMA_CATEGORY_IDS } from '../../shared/cinemaCategories.js';

const router = express.Router();

/**
 * Hugo Cinema — kệ phim công cộng.
 *
 * Bản trước có `GET /stream-proxy?url=…` kéo hộ mọi URL người gọi truyền vào.
 * Hai vấn đề, nên nó đã bị xoá thay vì vá:
 *   • đó là SSRF mở — bất kỳ ai cũng bảo server tự gọi vào địa chỉ nội bộ được;
 *   • mỗi lượt xem phim chạy trọn băng thông ra của Render (xem
 *     docs/tach-tai-render.md), trong khi Internet Archive đã trả file kèm
 *     `accept-ranges` và thẻ <video> không cần CORS để phát nguồn khác origin.
 * Client phát thẳng từ archive.org.
 */

/**
 * Kệ phim đổi đúng một lúc: khi admin bấm đồng bộ. Nên giữ nguyên câu trả lời
 * trong bộ nhớ tiến trình và để trình duyệt tự dùng lại bản của nó 5 phút —
 * mọi thành viên mở app đều hỏi cùng một câu, không có lý do gì để mỗi lượt mở
 * là một lượt truy vấn MongoDB trên Render.
 *
 * `private` chứ không `public`: route nằm sau requireMember, đừng để Cloudflare
 * giữ hộ một câu trả lời của phiên đăng nhập nào đó (xem
 * server/scripts/check-cache-headers.mjs).
 *
 * ponytail: Map trong tiến trình, xoá cả cụm khi có thay đổi. Nhiều instance
 * thì mỗi cái tự giữ một bản — vẫn đúng, chỉ là lỡ vài phút sau khi đồng bộ.
 */
const CATALOG_TTL_MS = 5 * 60 * 1000;
const catalogCache = new Map();

function cachedCatalog(key) {
  const hit = catalogCache.get(key);
  if (!hit || Date.now() - hit.at > CATALOG_TTL_MS) return null;
  return hit.payload;
}

function rememberCatalog(key, payload) {
  if (catalogCache.size > 50) catalogCache.clear();
  catalogCache.set(key, { at: Date.now(), payload });
}

// GET /api/cinema/movies — kệ phim, lọc theo thể loại và từ khoá
router.get('/movies', requireMember, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 60 } = req.query;
    const query = { active: true };

    if (category && category !== 'all' && CINEMA_CATEGORY_IDS.includes(category)) {
      query.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      // escape để người dùng gõ "(" hay "*" không làm regex nổ ở tầng Mongo
      const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { creator: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 60));

    res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=3600');
    const cacheKey = `${query.category || 'all'}|${search || ''}|${p}|${l}`;
    const cached = cachedCatalog(cacheKey);
    if (cached) return res.json(cached);

    const [total, movies] = await Promise.all([
      CinemaMovie.countDocuments(query),
      CinemaMovie.find(query)
        .sort({ height: -1, views: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
    ]);

    const payload = {
      success: true,
      total,
      page: p,
      limit: l,
      movies: movies.map((m) => ({ ...m, id: m.movieId })),
    };
    rememberCatalog(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, total: 0, movies: [] });
  }
});

// GET /api/cinema/featured — phim nổi bật (Spotlight Hero)
router.get('/featured', requireMember, async (req, res) => {
  try {
    const movie = await CinemaMovie.findOne({ active: true }).sort({ height: -1, views: -1 }).lean();
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Không có phim nổi bật' });
    }
    res.json({
      success: true,
      movie: { ...movie, id: movie.movieId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cinema/movies/:id — chi tiết một phim + phim xem tiếp
router.get('/movies/:id', requireMember, async (req, res) => {
  try {
    const movie = await CinemaMovie.findOne({ movieId: req.params.id, active: true }).lean();
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phim' });
    }

    const related = await CinemaMovie.find({
      active: true,
      _id: { $ne: movie._id },
      category: movie.category,
    })
      .sort({ height: -1, views: -1 })
      .limit(8)
      .lean();

    res.json({
      success: true,
      movie: { ...movie, id: movie.movieId },
      related: related.map((m) => ({ ...m, id: m.movieId })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cửa trung chuyển phim ở biên Cloudflare (workers/media-proxy). Bỏ trống thì
// phát thẳng từ archive.org — chạy được, nhưng chậm tới mức không xem nổi ở VN.
const MEDIA_PROXY = (process.env.CINEMA_MEDIA_PROXY || '').replace(/\/+$/, '');
const ARCHIVE_URL = /^https:\/\/([a-z0-9-]+\.)*archive\.org\//i;

function edgeUrl(url) {
  if (!url || !MEDIA_PROXY || !ARCHIVE_URL.test(url)) return url;
  return `${MEDIA_PROXY}/?u=${encodeURIComponent(url)}`;
}

// POST /api/cinema/stream-token — Sinh token phát phim bảo mật 2h cho thành viên
router.post('/stream-token', requireMember, async (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ success: false, message: 'Thiếu movieId' });
    }
    const movie = await CinemaMovie.findOne({ movieId, active: true }).lean();
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
    }

    const { generateCinemaStreamToken } = await import('../utils/cinemaToken.js');
    const token = generateCinemaStreamToken(movieId, req.memberEmail);
    res.json({
      success: true,
      token,
      streamUrl: `/api/cinema/stream/${token}`,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cinema/stream/:token — Cổng phát phim mã hoá HMAC (Tự hủy sau 2 giờ, chống trộm link)
router.get('/stream/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { verifyCinemaStreamToken } = await import('../utils/cinemaToken.js');
    const verified = verifyCinemaStreamToken(token);
    if (!verified) {
      return res.status(403).json({ success: false, message: 'Token xem phim không hợp lệ hoặc đã hết hạn (2h)' });
    }

    const movie = await CinemaMovie.findOne({ movieId: verified.movieId, active: true }).lean();
    if (!movie || !movie.videoUrl) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nguồn phim' });
    }

    // Chuyển hướng qua cửa trung chuyển ở biên, KHÔNG thẳng ra archive.org.
    // Đo từ Việt Nam trên chính máy dev: đi thẳng mất 10,1s mới có byte đầu và
    // chạy 74 KB/s — trong khi phim 512kb cần ~64 KB/s, tức là vừa đủ để buffer
    // liên tục chứ không đủ để xem. Qua Worker đã cache: 0,33s và 2,1 MB/s.
    // Đây là nguồn phát SỐ MỘT của trình phát, nên nó quyết định trải nghiệm;
    // các nguồn dự phòng phía sau chỉ chạy sau hai lần chờ đứng hình 12 giây.
    res.redirect(302, edgeUrl(movie.videoUrl));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── ADMIN ──
// Trước đây cả nhóm này không có middleware nào: bất kỳ ai POST /admin/movies
// là thêm được phim vào portal, DELETE /admin/purge-all là xoá sạch thư viện.
router.use('/admin', requireAdmin);

// GET /api/cinema/admin/movies — toàn bộ phim, kể cả phim đang ẩn
router.get('/admin/movies', async (req, res) => {
  try {
    const movies = await CinemaMovie.find({}).sort({ views: -1, createdAt: -1 }).lean();
    res.json({ success: true, count: movies.length, movies: movies.map((m) => ({ ...m, id: m.movieId })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cinema/admin/sync — đồng bộ lại thư viện phim công cộng
router.post('/admin/sync', async (req, res) => {
  try {
    const result = await syncCinemaLibrary();
    catalogCache.clear();
    res.json({
      success: true,
      message: `Đã đồng bộ ${result.saved}/${result.total} phim công cộng từ Internet Archive`
        + (result.removed ? `, rút ${result.removed} phim khỏi kệ` : '')
        + (result.skipped.length ? `. Bỏ qua: ${result.skipped.join(', ')}` : ''),
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cinema/admin/movies — admin thêm/sửa một phim
router.post('/admin/movies', async (req, res) => {
  try {
    const {
      id,
      movieId,
      title,
      description,
      category,
      year,
      creator,
      duration,
      durationSeconds,
      license,
      sourceUrl,
      videoUrl,
      videoFallbackUrl,
      poster,
      active,
    } = req.body;

    if (!title || !videoUrl || !poster) {
      return res.status(400).json({
        success: false,
        message: 'Tên phim, đường dẫn video và ảnh thumbnail là bắt buộc',
      });
    }
    if (!CINEMA_CATEGORY_IDS.includes(category)) {
      return res.status(400).json({ success: false, message: 'Thể loại không hợp lệ' });
    }

    const targetId = id || movieId || `admin-${Date.now()}`;
    const seconds = parseInt(durationSeconds, 10) || 0;

    const movie = await CinemaMovie.findOneAndUpdate(
      { movieId: targetId },
      {
        movieId: targetId,
        source: 'admin',
        title: title.trim(),
        description: (description || '').trim(),
        category,
        year: parseInt(year, 10) || 0,
        creator: (creator || '').trim(),
        durationSeconds: seconds,
        duration: (duration || '').trim(),
        license: (license || '').trim(),
        sourceUrl: (sourceUrl || '').trim(),
        videoUrl: videoUrl.trim(),
        videoFallbackUrl: (videoFallbackUrl || '').trim(),
        poster: poster.trim(),
        active: active !== undefined ? Boolean(active) : true,
      },
      { new: true, upsert: true, runValidators: true }
    );
    catalogCache.clear();

    res.json({
      success: true,
      message: `Đã lưu phim "${movie.title}"`,
      movie: { ...movie.toObject(), id: movie.movieId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi lưu phim' });
  }
});

/**
 * DELETE /api/cinema/admin/legacy — xoá các bản ghi phim từ trước lần đổi
 * schema (không có trường `source`, còn mang điểm IMDb/nhãn PG-13/dàn diễn viên
 * mặc định do code cũ tự sinh). Để admin bấm chứ không xoá ngầm trong lúc sync:
 * trong đó có thể lẫn phim admin tự thêm thật.
 */
router.delete('/admin/legacy', async (req, res) => {
  try {
    const result = await CinemaMovie.deleteMany({ source: { $exists: false } });
    catalogCache.clear();
    res.json({ success: true, message: `Đã xoá ${result.deletedCount} bản ghi phim cũ`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cinema/admin/movies/:id
router.delete('/admin/movies/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const filter = mongoose.Types.ObjectId.isValid(targetId)
      ? { $or: [{ movieId: targetId }, { _id: targetId }] }
      : { movieId: targetId };

    const result = await CinemaMovie.deleteOne(filter);
    catalogCache.clear();
    res.json({ success: true, message: 'Đã xoá phim khỏi thư viện', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
