// Quản trị Bio: danh sách, VIP, minh chứng, trạng thái — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { requireAdmin, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { broadcastToEmail } from '../../utils/realtime.js';
import { deleteMemberAccountPermanently } from '../../services/memberAccountLifecycle.js';
import { fetchTelegramFile } from '../../services/telegramService.js';
import { clearPublicBioCache } from './bioShared.js';

const router = express.Router();

// GET: Fetch all bios (for Admin Panel) with search, filter, pagination, and stats
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      expiration = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { displayName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (status && ['active', 'locked'].includes(status)) {
      query.status = status;
    }

    if (expiration) {
      const now = new Date();
      if (expiration === 'active') {
        query.$or = [
          { expiresAt: { $gt: now } },
          { expiresAt: null }
        ];
      } else if (expiration === 'expired') {
        query.expiresAt = { $lte: now };
      } else if (expiration === 'lifetime') {
        query.expiresAt = null;
      }
    }

    const sortObj = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    sortObj[sortBy] = order;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Run parallel counts & query
    const [bios, totalMatched, totalCount, activeCount, lockedCount, pendingCount, rejectedCount, lifetimeCount, locationAnomalyCount] = await Promise.all([
      Bio.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Bio.countDocuments(query),
      Bio.countDocuments(),
      Bio.countDocuments({ status: 'active' }),
      Bio.countDocuments({ status: 'locked' }),
      Bio.countDocuments({ status: 'pending' }),
      Bio.countDocuments({ status: 'rejected' }),
      Bio.countDocuments({ expiresAt: null }),
      Bio.countDocuments({ locationAnomaly: true })
    ]);

    res.json({
      bios,
      pagination: {
        totalMatched,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalMatched / limitNum)
      },
      stats: {
        total: totalCount,
        active: activeCount,
        locked: lockedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        lifetime: lifetimeCount,
        locationAnomaly: locationAnomalyCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: gắn/gỡ hạng danh dự Star-VIP. Star-14 và Star-18 suy ra từ ngày sinh
// nên không có (và không cần) endpoint sửa tay — chỉ hạng danh dự là quyết định
// của con người.
router.patch('/:id/vip', requireAdmin, async (req, res) => {
  try {
    const starVip = Boolean(req.body?.starVip);
    const bio = await Bio.findByIdAndUpdate(req.params.id, { $set: { starVip } }, { new: true });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    await clearPublicBioCache(bio);
    res.json({ success: true, starVip: bio.starVip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    bio.status = status;
    await bio.save();
    invalidateMemberGate(bio.email);
    await clearPublicBioCache(bio);
    broadcastToEmail(bio.email, { type: 'bio_status_update', status: bio.status, expiresAt: bio.expiresAt });
    res.json({ bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /bios/:id (Admin only) - Vĩnh viễn xóa tài khoản người dùng và toàn bộ dữ liệu đi kèm (bao gồm ArcadeScore)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bio = await Bio.findById(id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    const deleted = await deleteMemberAccountPermanently(id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    invalidateMemberGate(bio.email);
    return res.json({ success: true, message: `Đã xóa vĩnh viễn tài khoản của ${bio.displayName || bio.email}` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
