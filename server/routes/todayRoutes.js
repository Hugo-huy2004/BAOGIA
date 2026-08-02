import express from 'express';
import rateLimit from 'express-rate-limit';
import { studentNewsService } from '../services/studentNewsService.js';
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

// Chỉ đọc header CDN; studentNewsService mới là nơi quy về ấn bản hợp lệ, vì
// đó là nơi country trở thành cache key.
const detectCountry = (req) => req.headers['cf-ipcountry']
  || req.headers['x-vercel-ip-country']
  || req.headers['x-country-code']
  || '';

router.get('/feed', feedLimiter, async (req, res) => {
  try {
    const feed = await studentNewsService.getFeed({
      language: req.query.lang,
      category: req.query.category,
      country: detectCountry(req),
      timeZone: req.query.timezone,
      page: req.query.page,
      limit: req.query.limit,
    });
    // Trình duyệt chỉ được giữ 2 phút: quá lâu thì tin mới bị kẹt ở cache máy
    // người dùng dù server đã làm mới.
    const browserTtl = Math.min(120, feed.meta.secondsUntilReset);
    res.set('Cache-Control', `public, max-age=${browserTtl}, stale-while-revalidate=600`);
    return res.json(feed);
  } catch (error) {
    console.error('[Today Feed]', error);
    return res.status(502).json({ error: 'The student news feed is temporarily unavailable.' });
  }
});

// Trang đọc: tóm tắt ngắn + toàn văn, đọc thẳng trong portal.
router.get('/article/:id', readerLimiter, requireMember, async (req, res) => {
  try {
    const language = req.query.lang === 'en' ? 'en' : 'vi';
    const article = await studentNewsService.findArticleById(req.params.id, {
      language,
      category: req.query.category,
      country: detectCountry(req),
      timeZone: req.query.timezone,
    });
    if (!article) {
      return res.status(404).json({ error: 'Article is no longer in today\'s edition.' });
    }

    const content = await studentNewsService.readArticle(article);
    const summary = studentNewsService.summarizeArticle(article, content);
    res.set('Cache-Control', 'private, max-age=900');
    return res.json({ article, summary, content });
  } catch (error) {
    console.error('[Today Article]', error);
    return res.status(502).json({ error: 'Could not open this article right now.' });
  }
});

export default router;
