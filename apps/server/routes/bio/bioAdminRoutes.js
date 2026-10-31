// Quản trị Bio: danh sách, VIP, minh chứng, trạng thái — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { requireAdmin, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { broadcastToEmail } from '../../utils/realtime.js';
import VerificationEvidence from '../../models/VerificationEvidence.js';
import { deleteMemberAccountPermanently } from '../../services/memberAccountLifecycle.js';
import { fetchTelegramFile } from '../../services/telegramService.js';
import { clearPublicBioCache, TWELVE_MONTHS_MS, removeDuplicateIdentityAccounts } from './bioShared.js';

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

    if (status && ['active', 'locked', 'pending', 'rejected'].includes(status)) {
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

router.get('/:id/verification-evidence/:kind', requireAdmin, async (req, res) => {
  try {
    const evidenceIndex = /^\d+$/.test(req.params.kind) ? Number(req.params.kind) : -1;
    const fileField = req.params.kind === 'schedule'
      ? 'verificationRequest.scheduleFileId'
      : req.params.kind === 'selfie'
        ? 'verificationRequest.selfieFileId'
        : evidenceIndex >= 0 && evidenceIndex < 2
          ? `verificationRequest.evidenceFileIds.${evidenceIndex}`
        : null;
    if (!fileField) return res.status(404).json({ error: 'Không tìm thấy ảnh xác minh.' });

    const bio = await Bio.findById(req.params.id).select(fileField).lean();
    const fileId = fileField.split('.').reduce((value, key) => value?.[key], bio);
    if (!fileId) return res.status(404).json({ error: 'Yêu cầu này chưa có ảnh xác minh.' });

    const storedEvidence = /^[a-f\d]{24}$/i.test(String(fileId))
      ? await VerificationEvidence.findOne({ _id: fileId, memberId: bio._id }).lean()
      : null;
    if (storedEvidence) {
      res.set('Cache-Control', 'private, no-store');
      return res.type(storedEvidence.mime).send(storedEvidence.data);
    }

    const file = await fetchTelegramFile(fileId, 4 * 1024 * 1024);
    if (!file) return res.status(502).json({ error: 'Không thể tải ảnh xác minh từ Telegram.' });

    res.set('Cache-Control', 'private, no-store');
    res.type(file.mime).send(Buffer.from(file.base64, 'base64'));
  } catch (error) {
    console.error('GET verification evidence error:', error.message || error);
    res.status(500).json({ error: 'Không thể tải ảnh xác minh.' });
  }
});

// PATCH: Lock/Unlock/Approve/Reject bio
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'locked', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const bio = await Bio.findById(id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    const reviewedEvidenceIds = [...(bio.verificationRequest?.evidenceFileIds || [])];

    // Auto-fill profile fields + extend to a full year when approving a
    // submitted verification request — covers both the legacy pending→active
    // gate and the new flow where non-edu trial members are already 'active'
    // and just need their submitted request approved.
    const isApprovingVerification = status === 'active' && bio.verificationRequest?.submitted && !bio.isEduVerified;
    const isRejectingVerification = status === 'rejected' && bio.verificationRequest?.submitted;
    if (isApprovingVerification) {
      const hasEvidence = bio.verificationRequest.evidenceFileIds?.length
        || (bio.verificationRequest.scheduleFileId && bio.verificationRequest.selfieFileId);
      if (!hasEvidence) {
        return res.status(422).json({ error: 'Hồ sơ xác minh chưa có ảnh bằng chứng.' });
      }
      bio.verificationRequest.submitted = false;
      bio.displayName = bio.verificationRequest.fullName || bio.displayName;
      bio.birthday = bio.verificationRequest.birthday || bio.birthday;
      bio.phone = bio.verificationRequest.phoneZalo || bio.phone;
      if (bio.verificationRequest.schoolName) {
        bio.education = `${bio.verificationRequest.schoolLevel || ''} - ${bio.verificationRequest.schoolName}`.trim().replace(/^- /, '');
      }
      bio.verificationRequest.notifiedStatus = 'approved';
      bio.isEduVerified = true;
      // A manual review grants a full year from the approval date.
      bio.expiresAt = new Date(Date.now() + TWELVE_MONTHS_MS);
      bio.trialExpiresAt = null;
      bio.verificationRequest.evidenceFileIds = [];
      bio.verificationRequest.scheduleFileId = '';
      bio.verificationRequest.selfieFileId = '';
    } else if (status === 'rejected') {
      if (bio.verificationRequest) {
        bio.verificationRequest.notifiedStatus = 'rejected';
        bio.verificationRequest.submitted = false;
        bio.verificationRequest.evidenceFileIds = [];
        bio.verificationRequest.scheduleFileId = '';
        bio.verificationRequest.selfieFileId = '';
      }
    }

    // A verification rejection declines only the upgrade. The member keeps
    // normal access until the existing trial deadline and may submit once more.
    if (isRejectingVerification) {
      bio.status = 'active';
      if (!bio.isEduVerified && bio.trialExpiresAt) bio.expiresAt = bio.trialExpiresAt;
    } else {
      bio.status = status;
    }
    await bio.save();
    invalidateMemberGate(bio.email);
    if (reviewedEvidenceIds.length && (isApprovingVerification || isRejectingVerification)) {
      await VerificationEvidence.deleteMany({ memberId: bio._id, _id: { $in: reviewedEvidenceIds } });
    }
    if (isApprovingVerification) await removeDuplicateIdentityAccounts(bio);

    // Invalidate origin cache; CDN copies expire according to their HTTP TTL
    await clearPublicBioCache(bio);
    if (isApprovingVerification || status === 'rejected') {
      broadcastToEmail(bio.email, {
        type: 'bio_status_update',
        status: bio.status,
        isEduVerified: bio.isEduVerified,
        expiresAt: bio.expiresAt,
        trialExpiresAt: bio.trialExpiresAt,
        verificationStatus: bio.verificationRequest?.notifiedStatus,
        verificationSubmissionCount: bio.verificationRequest?.submissionCount || 0,
      });
    }

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
