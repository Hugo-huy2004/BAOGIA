import express from 'express';
import crypto from 'crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { resolveNewsEdition, studentNewsService } from '../services/studentNewsService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
import TodayPost from '../models/TodayPost.js';
import Bio from '../models/Bio.js';
import { screenOnPost } from '../services/todayModerator.js';

const router = express.Router();
// Đếm theo THÀNH VIÊN khi đã đăng nhập: sau Vercel/Cloudflare nhiều người dùng
// chung một IP proxy, đếm theo IP là phạt lây cả người vô can.
const byMember = (req) => req.memberEmail || ipKeyGenerator(req.ip);

const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  keyGenerator: byMember,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feed requests. Please try again shortly.' },
});

// Đọc bài tốn hơn nhiều so với đọc feed: mỗi miss là một lượt fetch ra ngoài +
// một lượt gọi Gemini. Siết chặt hơn và chỉ mở cho thành viên đã đăng nhập.
const readerLimiter = rateLimit({
  windowMs: 60 * 1000,
  keyGenerator: byMember,
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

    // Feed giống nhau cho mọi người cùng ngôn ngữ → CDN giữ 5 phút, Node chỉ
    // bị hỏi vài lần mỗi PoP dù có bao nhiêu thành viên. ETag chống tải lại trùng.
    res.set({
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
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
router.get('/article/:id', requireMember, readerLimiter, async (req, res) => {
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


    const payload = { article, summary, content };
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

// ── Bảng tin kiểu Threads: bài của thành viên + tim/bình luận cho cả bài báo ──

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  keyGenerator: byMember,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many posts. Please slow down.' },
});

// Chống spam đăng bài: 5 bài/hồi đáp mỗi phút, 60 mỗi giờ cho một thành viên.
const postLimiter = [
  rateLimit({ windowMs: 60 * 1000, max: 5, keyGenerator: byMember, standardHeaders: true, legacyHeaders: false, message: { error: 'Posting too fast. Please wait a minute.' } }),
  rateLimit({ windowMs: 60 * 60 * 1000, max: 60, keyGenerator: byMember, standardHeaders: true, legacyHeaders: false, message: { error: 'Hourly posting limit reached.' } }),
];

// ponytail: "dài tuỳ thích" vẫn cần một trần ở cửa vào — 20.000 ký tự ≈ 8 trang A4.
const MAX_TEXT = 20000;
const POLL_HOURS = [1, 6, 24, 72, 168];
const PAGE = 20;

const isPostId = (key) => mongoose.isValidObjectId(key) && String(key).length === 24;
const isArticleKey = (key) => /^a:[^\s/]{1,200}$/.test(String(key || ''));

function cleanText(value) {
  return String(value || '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
}

function cleanPoll(poll) {
  if (!poll) return undefined;
  const options = (Array.isArray(poll.options) ? poll.options : [])
    .map((o) => String(o || '').trim().slice(0, 80))
    .filter(Boolean);
  if (options.length < 2 || options.length > 4) return null;
  const hours = POLL_HOURS.includes(Number(poll.hours)) ? Number(poll.hours) : 24;
  return { options: options.map((text) => ({ text, votes: [] })), endsAt: new Date(Date.now() + hours * 3600000) };
}

// Mọi thứ trả về client: không lộ email của ai, kể cả người bỏ phiếu.
async function present(posts, me) {
  const emails = [...new Set(posts.map((p) => p.authorEmail).filter(Boolean))];
  const bios = await Bio.find({ email: { $in: emails } }, { email: 1, displayName: 1, avatarUrl: 1, slug: 1 }).lean();
  const byEmail = new Map(bios.map((b) => [b.email, b]));
  return posts.map((p) => {
    const bio = byEmail.get(p.authorEmail);
    const poll = p.poll && {
      options: p.poll.options.map((o) => ({ text: o.text, count: o.votes.length })),
      total: p.poll.options.reduce((sum, o) => sum + o.votes.length, 0),
      myVote: p.poll.options.findIndex((o) => o.votes.includes(me)),
      endsAt: p.poll.endsAt,
      closed: new Date(p.poll.endsAt) < new Date(),
    };
    return {
      key: p.articleKey || String(p._id),
      author: p.authorEmail ? { name: bio?.displayName || 'Hugo member', avatar: bio?.avatarUrl || '', slug: bio?.slug || '' } : null,
      text: p.text,
      poll,
      parentKey: p.parentKey,
      likeCount: p.likeCount,
      liked: (p.likes || []).includes(me),
      replyCount: p.replyCount,
      createdAt: p.createdAt,
      editedAt: p.editedAt,
      private: p.audience === 'private' || undefined,
      // Chỉ tác giả thấy bài đã gỡ, nên nhãn cũng chỉ trả cho tác giả.
      removed: (p.removed && p.authorEmail === me && p.removed.category) || undefined,
      mine: Boolean(me) && p.authorEmail === me,
    };
  });
}

// Đọc bài không kéo cả mảng tim về: chỉ lấy đúng phần tử là mình (nếu có),
// nên bài nghìn tim vẫn nhẹ như bài không tim.
// ($elemMatch biến phép chiếu thành dạng "chọn trường", nên phải kê đủ trường present() dùng.)
const view = (me) => ({
  authorEmail: 1, articleKey: 1, audience: 1, text: 1, poll: 1, parentKey: 1, ancestors: 1,
  likeCount: 1, replyCount: 1, editedAt: 1, createdAt: 1, removed: 1,
  likes: { $elemMatch: { $eq: me } },
});

// Bài "Chỉ mình tôi", bài bị gỡ, và cả nhánh hồi đáp bên dưới chúng: người khác
// coi như không tồn tại; tác giả của chính bài đó vẫn thấy.
async function canSee(node, me) {
  if (!node) return false;
  const ids = (node.ancestors || []).filter(isPostId);
  const chain = ids.length ? [node, ...await TodayPost.find({ _id: { $in: ids } }, { audience: 1, authorEmail: 1, removed: 1 }).lean()] : [node];
  return chain.every((p) => p.authorEmail === me || (!p.removed && p.audience !== 'private'));
}

const visibleTo = (me) => ({ $or: [{ removed: null }, { authorEmail: me }] });

const cleanAudience = (value) => (value === 'private' ? 'private' : undefined);

// Bóng hết tim và hết bình luận thì xoá — DB chỉ giữ bóng còn có nội dung.
const dropEmptyShadow = (key) => (isArticleKey(key)
  ? TodayPost.deleteOne({ articleKey: key, likeCount: { $lte: 0 }, replyCount: { $lte: 0 } })
  : null);

// Bóng của bài báo: tạo khi cần, để tim và bình luận có chỗ bám.
const articleShadow = (key) => TodayPost.findOneAndUpdate(
  { articleKey: key },
  { $setOnInsert: { articleKey: key } },
  { upsert: true, new: true },
);

const findNode = (key, projection) => (isArticleKey(key)
  ? TodayPost.findOne({ articleKey: key }, projection)
  : isPostId(key) ? TodayPost.findById(key, projection) : null);

router.get('/posts', requireMember, feedLimiter, async (req, res) => {
  try {
    const filter = { parentKey: null, authorEmail: { $ne: null }, $or: [{ audience: { $ne: 'private' }, removed: null }, { authorEmail: req.memberEmail }] };
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
    const posts = await TodayPost.find(filter, view(req.memberEmail)).sort({ createdAt: -1 }).limit(PAGE).lean();
    return res.json({ posts: await present(posts, req.memberEmail), more: posts.length === PAGE });
  } catch (error) {
    console.error('[Today posts]', error);
    return res.status(500).json({ error: 'Could not load posts.' });
  }
});

// Số tim/bình luận cho một loạt bài báo trong feed — một lượt gọi cho cả trang.
router.get('/posts/stats', requireMember, feedLimiter, async (req, res) => {
  const keys = String(req.query.keys || '').split(',').filter(isArticleKey).slice(0, 100);
  const rows = await TodayPost.find({ articleKey: { $in: keys } }, view(req.memberEmail)).lean();
  const stats = {};
  for (const row of await present(rows, req.memberEmail)) {
    stats[row.key] = { likeCount: row.likeCount, liked: row.liked, replyCount: row.replyCount };
  }
  return res.json({ stats });
});

router.get('/posts/:key', requireMember, feedLimiter, async (req, res) => {
  try {
    const { key } = req.params;
    if (!isArticleKey(key) && !isPostId(key)) return res.status(404).json({ error: 'Not found.' });
    const node = await findNode(key, view(req.memberEmail))?.lean();
    if (!isArticleKey(key) && !(await canSee(node, req.memberEmail))) return res.status(404).json({ error: 'This post was deleted.' });

    const [replies, parent] = await Promise.all([
      TodayPost.find({ parentKey: key, ...visibleTo(req.memberEmail) }, view(req.memberEmail)).sort({ createdAt: 1 }).limit(200).lean(),
      node?.parentKey && isPostId(node.parentKey) ? TodayPost.findById(node.parentKey, view(req.memberEmail)).lean() : null,
    ]);
    const [post] = node ? await present([node], req.memberEmail) : [null];
    const [parentView] = parent ? await present([parent], req.memberEmail) : [null];
    const article = isArticleKey(key) || isArticleKey(node?.parentKey)
      ? await studentNewsService.findArticleById(String(isArticleKey(key) ? key : node.parentKey).slice(2), { language: normalizeLanguage(req.query.lang) })
      : null;
    return res.json({ post, parent: parentView, article, replies: await present(replies, req.memberEmail) });
  } catch (error) {
    console.error('[Today post]', error);
    return res.status(500).json({ error: 'Could not open this post.' });
  }
});

router.post('/posts', requireMember, postLimiter, async (req, res) => {
  try {
    const text = cleanText(req.body?.text);
    const poll = cleanPoll(req.body?.poll);
    const parentKey = req.body?.parentKey ? String(req.body.parentKey) : null;
    if (poll === null) return res.status(400).json({ error: 'A poll needs 2 to 4 options.' });
    if (!text && !poll) return res.status(400).json({ error: 'Write something first.' });
    if (text.length > MAX_TEXT) return res.status(400).json({ error: `Posts are limited to ${MAX_TEXT} characters.` });

    let ancestors = [];
    if (parentKey) {
      if (isArticleKey(parentKey)) {
        await articleShadow(parentKey);
      } else {
        const parent = isPostId(parentKey) ? await TodayPost.findById(parentKey, { ancestors: 1, audience: 1, authorEmail: 1, removed: 1 }).lean() : null;
        if (!(await canSee(parent, req.memberEmail))) return res.status(404).json({ error: 'The post you replied to is gone.' });
        ancestors = parent.ancestors || [];
      }
      ancestors = [...ancestors, parentKey];
    }

    // Lưới thứ hai sau nút khoá ở client: cùng người, cùng nội dung, cùng chỗ trong
    // 30 giây thì trả lại bài vừa đăng thay vì tạo bài trùng (mạng chập chờn gửi lại).
    const twin = text && await TodayPost.findOne({
      authorEmail: req.memberEmail, parentKey, text, createdAt: { $gt: new Date(Date.now() - 30_000) },
    }).lean();
    if (twin) {
      const [view] = await present([twin], req.memberEmail);
      return res.status(200).json({ post: view });
    }

    const audience = parentKey ? undefined : cleanAudience(req.body?.audience);
    const post = await TodayPost.create({ authorEmail: req.memberEmail, text, poll, audience, parentKey, ancestors: ancestors.length ? ancestors : undefined });
    if (parentKey) await TodayPost.updateOne(isArticleKey(parentKey) ? { articleKey: parentKey } : { _id: parentKey }, { $inc: { replyCount: 1 } });
    const removed = await screenOnPost(post, req);
    const [view] = await present([{ ...post.toObject(), removed }], req.memberEmail);
    return res.status(201).json({ post: view });
  } catch (error) {
    console.error('[Today post create]', error);
    return res.status(500).json({ error: 'Could not publish this post.' });
  }
});

router.patch('/posts/:id', requireMember, writeLimiter, async (req, res) => {
  const text = cleanText(req.body?.text);
  if (!isPostId(req.params.id)) return res.status(404).json({ error: 'Not found.' });
  if (text.length > MAX_TEXT) return res.status(400).json({ error: `Posts are limited to ${MAX_TEXT} characters.` });
  const post = await TodayPost.findOne({ _id: req.params.id, authorEmail: req.memberEmail });
  if (!post) return res.status(404).json({ error: 'Not found.' });
  if (!text && !post.poll) return res.status(400).json({ error: 'Write something first.' });
  post.text = text;
  if (!post.parentKey && 'audience' in (req.body || {})) post.audience = cleanAudience(req.body.audience);
  post.editedAt = new Date();
  post.reviewedAt = undefined; // bản sửa phải được duyệt lại
  await post.save();
  const removed = post.removed ? null : await screenOnPost(post, req);
  const [view] = await present([{ ...post.toObject(), ...(removed && { removed }) }], req.memberEmail);
  return res.json({ post: view });
});

router.delete('/posts/:id', requireMember, writeLimiter, async (req, res) => {
  if (!isPostId(req.params.id)) return res.status(404).json({ error: 'Not found.' });
  const post = await TodayPost.findOneAndDelete({ _id: req.params.id, authorEmail: req.memberEmail });
  if (!post) return res.status(404).json({ error: 'Not found.' });
  await TodayPost.deleteMany({ ancestors: String(post._id) });
  if (post.parentKey) {
    await TodayPost.updateOne(isArticleKey(post.parentKey) ? { articleKey: post.parentKey } : { _id: post.parentKey }, { $inc: { replyCount: -1 } });
    await dropEmptyShadow(post.parentKey);
  }
  return res.json({ ok: true });
});

// Thả/bỏ tim — hai lệnh có điều kiện để bấm liên tục cũng không đếm lệch.
router.post('/posts/:key/like', requireMember, writeLimiter, async (req, res) => {
  const { key } = req.params;
  const me = req.memberEmail;
  if (!isArticleKey(key) && !isPostId(key)) return res.status(404).json({ error: 'Not found.' });
  if (isArticleKey(key)) await articleShadow(key);
  else if (!(await canSee(await TodayPost.findById(key, { ancestors: 1, audience: 1, authorEmail: 1 }).lean(), me))) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const where = isArticleKey(key) ? { articleKey: key } : { _id: key };
  const opts = { new: true, projection: { likeCount: 1 } };
  const added = await TodayPost.findOneAndUpdate({ ...where, likes: { $ne: me } }, { $push: { likes: me }, $inc: { likeCount: 1 } }, opts).lean();
  const result = added || await TodayPost.findOneAndUpdate({ ...where, likes: me }, { $pull: { likes: me }, $inc: { likeCount: -1 } }, opts).lean();
  if (!result) return res.status(404).json({ error: 'Not found.' });
  if (!added) await dropEmptyShadow(key);
  return res.json({ liked: Boolean(added), likeCount: result.likeCount });
});

// Một phiếu một người, không đổi được — như Threads.
router.post('/posts/:id/vote', requireMember, writeLimiter, async (req, res) => {
  const me = req.memberEmail;
  const option = Number(req.body?.option);
  if (!isPostId(req.params.id) || !Number.isInteger(option) || option < 0 || option > 3) {
    return res.status(400).json({ error: 'Invalid vote.' });
  }
  if (!(await canSee(await TodayPost.findById(req.params.id, { audience: 1, authorEmail: 1 }).lean(), me))) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const post = await TodayPost.findOneAndUpdate(
    {
      _id: req.params.id,
      [`poll.options.${option}`]: { $exists: true },
      'poll.endsAt': { $gt: new Date() },
      'poll.options.votes': { $ne: me },
    },
    { $push: { [`poll.options.${option}.votes`]: me } },
    { new: true },
  ).lean();
  const current = post || await TodayPost.findById(req.params.id).lean();
  if (!current?.poll) return res.status(404).json({ error: 'Not found.' });
  const [view] = await present([current], me);
  return res.json({ poll: view.poll });
});

export default router;
