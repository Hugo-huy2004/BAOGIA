import express from 'express';
import rateLimit from 'express-rate-limit';
import { studentNewsService } from '../services/studentNewsService.js';

const router = express.Router();
const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feed requests. Please try again shortly.' },
});

const detectCountry = (req) => {
  const candidates = [
    req.headers['cf-ipcountry'],
    req.headers['x-vercel-ip-country'],
    req.headers['x-country-code'],
    req.query.country,
    req.query.lang === 'vi' ? 'VN' : 'US',
  ];
  return candidates
    .map((value) => String(value || '').trim().toUpperCase())
    .find((value) => /^[A-Z]{2}$/.test(value)) || 'VN';
};

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
    const browserTtl = Math.min(300, feed.meta.secondsUntilReset);
    res.set('Cache-Control', `public, max-age=${browserTtl}, stale-while-revalidate=600`);
    return res.json(feed);
  } catch (error) {
    console.error('[Today Feed]', error);
    return res.status(502).json({ error: 'The student news feed is temporarily unavailable.' });
  }
});

export default router;
