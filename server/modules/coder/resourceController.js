/**
 * resourceController.js
 * Controller tập trung toàn bộ logic nghiệp vụ tài nguyên học liệu, bài đọc và ghi nhận phiên đọc.
 */
import CoderResource from '../../models/CoderResource.js';
import ReadingSession from '../../models/ReadingSession.js';

/**
 * Lấy danh sách tài nguyên học tập theo thể loại và chặng học
 */
export async function getResourceList(req, res) {
  try {
    const { type, stage } = req.query;
    const filter = {};
    if (['video', 'document', 'article'].includes(type)) filter.type = type;
    if (stage && stage !== 'all') filter.stageId = { $in: [stage, 'all'] };

    const items = await CoderResource.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(200)
      .lean();
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Lấy toàn văn một bài viết và tiến độ đọc của người dùng
 */
export async function getArticleBySlug(req, res) {
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

    return res.json({
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
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Bắt đầu tính giờ đọc bài viết
 */
export async function startReadingSession(req, res) {
  try {
    const article = await CoderResource.findById(req.params.id).lean();
    if (!article || article.type !== 'article') {
      return res.status(404).json({ error: 'Không tìm thấy bài đọc.' });
    }

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
    return res.status(201).json({
      startedAt: session.startedAt,
      requiredMinutes: session.requiredMinutes,
      completedAt: null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Kết thúc và chốt hoàn thành bài đọc nếu đủ thời gian tối thiểu
 */
export async function finishReadingSession(req, res) {
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
    return res.json({ completedAt: session.completedAt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * [Admin] Tạo mới học liệu
 */
export async function createResourceAdmin(req, res) {
  try {
    const { type, title, description = '', url, stageId = 'all', source = '', pinned = false } = req.body;
    if (!type || !title || !url) {
      return res.status(400).json({ error: 'type, title và url là bắt buộc.' });
    }
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: 'URL phải bắt đầu bằng http(s)://' });
    }
    if (!String(source || '').trim()) {
      return res.status(400).json({ error: 'Phải khai nguồn (tác giả/đơn vị phát hành) của học liệu.' });
    }
    const item = await CoderResource.create({ type, title, description, url, stageId, source, pinned });
    return res.status(201).json({ item });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * [Admin] Sửa học liệu
 */
export async function updateResourceAdmin(req, res) {
  try {
    const { title, description, url, stageId, source, pinned, type } = req.body;
    const item = await CoderResource.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, url, stageId, source, pinned, type } },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Không tìm thấy học liệu.' });
    return res.json({ item });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * [Admin] Gỡ học liệu
 */
export async function deleteResourceAdmin(req, res) {
  try {
    const item = await CoderResource.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy học liệu.' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
