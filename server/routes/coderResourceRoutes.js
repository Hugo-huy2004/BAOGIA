import express from 'express';
import CoderResource from '../models/CoderResource.js';
import ReadingSession from '../models/ReadingSession.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/coder-resources?type=video|document|article&stage=basic
router.get('/', requireMember, async (req, res) => {
  try {
    const { type, stage } = req.query;
    const filter = {};
    if (['video', 'document', 'article'].includes(type)) filter.type = type;
    if (stage && stage !== 'all') filter.stageId = { $in: [stage, 'all'] };

    const items = await CoderResource.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/coder-resources/article/:slug — toàn văn một bài biên soạn, kèm tiến
// độ đọc của chính người đang đăng nhập.
router.get('/article/:slug', requireMember, async (req, res) => {
  try {
    const article = await CoderResource.findOne({
      type: 'article',
      title: decodeURIComponent(req.params.slug),
    }).lean();
    if (!article) return res.status(404).json({ error: 'Không tìm thấy bài đọc.' });

    const session = await ReadingSession.findOne({
      memberEmail: req.memberEmail,
      resourceId: article._id,
    }).lean();

    res.json({
      article,
      reading: session
        ? {
          startedAt: session.startedAt,
          requiredMinutes: session.requiredMinutes,
          completedAt: session.completedAt,
        }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/coder-resources/:id/read/start — mở đồng hồ đọc.
// Mốc bắt đầu do máy chủ đặt; body của client không được chạm vào nó.
router.post('/:id/read/start', requireMember, async (req, res) => {
  try {
    const article = await CoderResource.findById(req.params.id).lean();
    if (!article || article.type !== 'article') {
      return res.status(404).json({ error: 'Không tìm thấy bài đọc.' });
    }

    // Đã đọc xong rồi thì đừng đặt lại đồng hồ — mở lại bài để xem lại là
    // chuyện bình thường, không phải lý do bắt đọc lại từ đầu.
    const existing = await ReadingSession.findOne({
      memberEmail: req.memberEmail,
      resourceId: article._id,
    });
    if (existing) {
      return res.json({
        startedAt: existing.startedAt,
        requiredMinutes: existing.requiredMinutes,
        completedAt: existing.completedAt,
      });
    }

    const session = await ReadingSession.create({
      memberEmail: req.memberEmail,
      resourceId: article._id,
      requiredMinutes: article.readingMinutes || 5,
      startedAt: new Date(),
    });
    res.status(201).json({
      startedAt: session.startedAt,
      requiredMinutes: session.requiredMinutes,
      completedAt: null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/coder-resources/:id/read/finish — chốt bài đọc nếu đã đủ thời gian.
router.post('/:id/read/finish', requireMember, async (req, res) => {
  try {
    const session = await ReadingSession.findOne({
      memberEmail: req.memberEmail,
      resourceId: req.params.id,
    });
    if (!session) return res.status(400).json({ error: 'Chưa mở bài đọc này.' });
    if (session.completedAt) return res.json({ completedAt: session.completedAt });

    const elapsedMs = Date.now() - session.startedAt.getTime();
    const requiredMs = session.requiredMinutes * 60_000;
    if (elapsedMs < requiredMs) {
      return res.status(425).json({
        code: 'READING_TOO_SHORT',
        error: 'Chưa đủ thời gian đọc tối thiểu.',
        remainingSeconds: Math.ceil((requiredMs - elapsedMs) / 1000),
      });
    }

    session.completedAt = new Date();
    await session.save();
    res.json({ completedAt: session.completedAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/coder-resources — admin đăng học liệu mới
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { type, title, description = '', url, stageId = 'all', source = '', pinned = false } = req.body;
    if (!type || !title || !url) {
      return res.status(400).json({ error: 'type, title và url là bắt buộc.' });
    }
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL phải bắt đầu bằng http(s)://' });
    }
    // Học liệu là nội dung của người khác. Bắt buộc khai nguồn để trang hiển
    // thị được "Nguồn: ..." — không có dòng đó thì tài liệu trông như của Hugo
    // Studio, và đó chính là ranh giới giữa dẫn nguồn và chiếm dụng.
    if (!String(source || '').trim()) {
      return res.status(400).json({ error: 'Phải khai nguồn (tác giả/đơn vị phát hành) của học liệu.' });
    }
    const item = await CoderResource.create({ type, title, description, url, stageId, source, pinned });
    res.status(201).json({ item });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/coder-resources/:id — admin sửa
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, url, stageId, source, pinned, type } = req.body;
    const item = await CoderResource.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, url, stageId, source, pinned, type } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Không tìm thấy học liệu.' });
    res.json({ item });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/coder-resources/:id — admin gỡ
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await CoderResource.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy học liệu.' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
