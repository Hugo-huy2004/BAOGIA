import express from 'express';
import rateLimit from 'express-rate-limit';
import { resolveNewsEdition, studentNewsService } from '../services/studentNewsService.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();
const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feed requests. Please try again shortly.' },
});

// Đọc bài tốn hơn nhiều so với đọc feed: mỗi miss là một lượt fetch ra ngoài +
// một lượt gọi Gemini. Siết chặt hơn và chỉ mở cho thành viên đã đăng nhập.
const readerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many article requests. Please try again shortly.' },
});

const normalizeLanguage = (value) => {
  const language = String(value || '').toLowerCase().split('-')[0];
  return ['vi', 'en', 'zh', 'th', 'ja', 'ko', 'id', 'es', 'fr'].includes(language)
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
      page: req.query.page,
      limit: req.query.limit,
    });
    if (feed.meta.language !== expectedEdition.language || feed.meta.country !== expectedEdition.country) {
      throw new Error(`Edition mismatch: expected ${expectedEdition.language}-${expectedEdition.country}`);
    }
    // Cache nội bộ của service đã tránh fan-out nguồn tin. Tắt cache HTTP để
    // CDN/service worker không giữ nhầm ấn bản khi người dùng đổi ngôn ngữ.
    res.set('Cache-Control', 'private, no-store');
    res.set('Content-Language', expectedEdition.locale);
    res.set('X-Today-Edition', expectedEdition.country);
    return res.json(feed);
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

    const content = await studentNewsService.readArticle(article);
    const summary = await studentNewsService.summarizeArticle(article, content, language);
    res.set('Cache-Control', 'private, max-age=900');
    res.set('Content-Language', resolveNewsEdition(language).locale);
    return res.json({ article, summary, content });
  } catch (error) {
    console.error('[Today Article]', error);
    return res.status(502).json({ error: 'Could not open this article right now.' });
  }
});

export default router;
