import express from 'express';
import CoderResource from '../models/CoderResource.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/coder-resources?type=video|document&stage=basic — thành viên xem học liệu
router.get('/', requireMember, async (req, res) => {
  try {
    const { type, stage } = req.query;
    const filter = {};
    if (type === 'video' || type === 'document') filter.type = type;
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
