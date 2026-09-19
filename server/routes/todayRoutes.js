import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { resolveNewsEdition, studentNewsService } from '../services/studentNewsService.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();
const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feed requests. Please try again shortly.' },
});

// Đọc bài tốn hơn nhiều so với đọc feed: mỗi miss là một lượt fetch ra ngoài +
// một lượt gọi Gemini. Siết chặt hơn và chỉ mở cho thành viên đã đăng nhập.
const readerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many article requests. Please try again shortly.' },
});

const normalizeLanguage = (value) => {
  const language = String(value || '').toLowerCase().split('-')[0];
  return ['vi', 'en', 'zh'].includes(language)
    ? language
    : 'en';
};

router.get('/feed', feedLimiter, async (req, res) => {
  try {
    const language = normalizeLanguage(req.query.lang);
    const expectedEdition = resolveNewsEdition(language);
    const feed = await studentNewsService.getFeed({
      language,
      category: req.query.category,
      topic: req.query.topic,
      query: req.query.q || req.query.query,
      page: req.query.page,
      limit: req.query.limit,
    });
    if (feed.meta.language !== expectedEdition.language || feed.meta.country !== expectedEdition.country) {
      throw new Error(`Edition mismatch: expected ${expectedEdition.language}-${expectedEdition.country}`);
    }

    const bodyString = JSON.stringify(feed);
    const etag = crypto.createHash('md5').update(bodyString).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    // `private, stale-while-revalidate` giúp trình duyệt hiển thị cache tức thì (< 5ms)
    // trong khi server revalidate ngầm. ETag chống tải lại dữ liệu trùng.
    res.set({
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      'Content-Language': expectedEdition.locale,
      'X-Today-Edition': expectedEdition.country,
      ETag: etag,
    });
    return res.type('application/json').send(bodyString);
  } catch (error) {
    console.error('[Today Feed]', error);
    return res.status(502).json({ error: 'The student news feed is temporarily unavailable.' });
  }
});

// Trang đọc: metadata + tóm tắt; toàn văn chỉ có khi nguồn cấp quyền rõ ràng.
router.get('/article/:id', readerLimiter, requireMember, async (req, res) => {
  try {
    const language = normalizeLanguage(req.query.lang);
    const article = await studentNewsService.findArticleById(req.params.id, {
      language,
      category: req.query.category,
    });
    if (!article) {
      return res.status(404).json({ error: 'Article is no longer in today\'s edition.' });
    }

    // readArticle() trả ngay với nguồn không có giấy phép mở (phần lớn bài),
    // còn summarizeArticle() tự fetch bài + gọi AI — hai thao tác độc lập nên
    // chạy song song để giảm thời gian chờ tổng.
    const [content, summary] = await Promise.all([
      studentNewsService.readArticle(article),
      studentNewsService.summarizeArticle(article, { available: false, blocks: [] }, language),
    ]);

    // Làm giàu trước từ vựng HSK/TOCFL trên Node nếu là bài tiếng Trung,
    // loại bỏ hoàn toàn request phụ POST /api/vocab/lookup từ phía trình duyệt.
    let vocabMap = null;
    if (language === 'zh') {
      const texts = [article.title, ...(summary?.points || [])];
      vocabMap = await studentNewsService.enrichZhVocab(texts);
    }

    const payload = { article, summary, content, vocabMap };
    const bodyString = JSON.stringify(payload);
    const etag = crypto.createHash('md5').update(bodyString).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.set({
      'Cache-Control': 'private, max-age=900, stale-while-revalidate=1800',
      'Content-Language': resolveNewsEdition(language).locale,
      ETag: etag,
    });
    return res.type('application/json').send(bodyString);
  } catch (error) {
    console.error('[Today Article]', error);
    return res.status(502).json({ error: 'Could not open this article right now.' });
  }
});

export default router;
