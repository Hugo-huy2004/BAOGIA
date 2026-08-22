import express from 'express';
import Bio from '../models/Bio.js';
import HugoTeamDev from '../models/HugoTeamDev.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { isFeatureActive } from '../utils/featureSubscriptionService.js';
import { isLearningEvidenceEnabledFor } from '../utils/hugoV1Features.js';
import {
  deletePrivateEvidence,
  listPrivateEvidence,
} from '../services/learningEvidenceService.js';

const router = express.Router();

// Tổng số bài của bộ Phát triển Web — dùng để ra tỉ lệ "x/100", không phải để
// khoe con số tròn.
const CODER_TOTAL_LESSONS = 100;

const findMemberBio = (email) => Bio.findOne({
  $or: [{ email }, { contactEmail: email }],
});

/**
 * Hồ sơ năng lực: chỉ ĐỌC LẠI những gì hệ thống đã ghi nhận.
 *
 * Đây là điểm khác biệt duy nhất đáng kể so với một CV tự khai — mọi con số ở
 * đây đều do hệ thống sinh ra và có người/máy duyệt: email trường đã xác minh,
 * bài học đã chấm, giờ đồng hành do admin duyệt, task đã nghiệm thu. Vì vậy
 * KHÔNG có trường nào ở đây nhận dữ liệu do người dùng tự nhập.
 */
async function buildProfile(bio) {
  const dev = await HugoTeamDev.findOne({ email: bio.email, status: 'approved' });

  const lessonsDone = (bio.completedLessons || []).length;
  const tasksDone = (dev?.tasks || []).filter((task) => task.status === 'done').length;

  return {
    displayName: bio.displayName,
    slug: bio.slug,
    headline: bio.headline || '',
    avatarUrl: bio.avatarUrl || '',
    // Xác minh HSSV: chỉ báo ĐÃ xác minh hay chưa và cấp trường, không lộ mã số
    // học sinh hay tên trường nếu thành viên chưa tự công khai trong Bio.
    student: {
      verified: bio.status === 'approved' && Boolean(bio.verificationRequest?.schoolName),
      level: bio.verificationRequest?.schoolLevel || '',
      school: bio.verificationRequest?.schoolName || '',
    },
    learning: {
      lessonsDone,
      lessonsTotal: CODER_TOTAL_LESSONS,
      certificate: Boolean(bio.hugoCoderAll7Lifetime) && lessonsDone >= CODER_TOTAL_LESSONS,
      studyCourses: (bio.hugoSOCourses || []).length,
    },
    // Chỉ đếm giờ ĐÃ DUYỆT. Giờ đang chờ duyệt không được lên hồ sơ, nếu không
    // thì bất kỳ ai cũng tự nâng số của mình bằng cách khai thêm.
    team: dev
      ? { member: true, approvedHours: dev.approvedHours(), tasksDone, since: dev.approvedAt }
      : { member: false, approvedHours: 0, tasksDone: 0, since: null },
    referrals: bio.referralCount || 0,
    starVip: Boolean(bio.starVip),
    generatedAt: new Date(),
  };
}

/** Hồ sơ của chính mình — luôn xem được, kể cả khi chưa thuê ứng dụng. */
router.get('/me', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    res.json({
      profile: await buildProfile(bio),
      // Quyền công bố mới là thứ phải trả JOY; xem hồ sơ của chính mình thì không.
      publishing: {
        entitled: isFeatureActive(bio, 'hugoProfile'),
        enabled: Boolean(bio.profilePublic),
      },
      capabilities: {
        learningEvidence: isLearningEvidenceEnabledFor(bio),
      },
    });
  } catch (error) {
    console.error('GET /profile/me error:', error);
    res.status(500).json({ error: 'Failed to build profile' });
  }
});

/** Minh chứng riêng tư của chính thành viên; không có route public tương ứng. */
router.get('/me/evidence', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    if (!isLearningEvidenceEnabledFor(bio)) {
      return res.status(404).json({ error: 'FEATURE_NOT_AVAILABLE' });
    }

    return res.json(await listPrivateEvidence({
      ownerMemberId: bio._id,
      cursor: req.query.cursor,
      limit: req.query.limit,
    }));
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('GET /profile/me/evidence error:', error);
    return res.status(500).json({ error: 'Failed to load learning evidence' });
  }
});

/** Xoá mềm và scrub nội dung; tombstone còn lại để dữ liệu cũ không dựng lại. */
router.delete('/me/evidence/:id', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    if (!isLearningEvidenceEnabledFor(bio)) {
      return res.status(404).json({ error: 'FEATURE_NOT_AVAILABLE' });
    }

    const deleted = await deletePrivateEvidence({
      ownerMemberId: bio._id,
      evidenceId: req.params.id,
    });
    if (!deleted) return res.status(404).json({ error: 'EVIDENCE_NOT_FOUND' });
    return res.status(204).end();
  } catch (error) {
    console.error('DELETE /profile/me/evidence error:', error);
    return res.status(500).json({ error: 'Failed to delete learning evidence' });
  }
});

/** Bật/tắt hiển thị hồ sơ trên trang Bio công khai. */
router.patch('/me/publish', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    if (!isFeatureActive(bio, 'hugoProfile')) {
      return res.status(402).json({ error: 'Hugo Profile subscription required' });
    }
    bio.profilePublic = Boolean(req.body?.enabled);
    await bio.save();
    res.json({ enabled: bio.profilePublic });
  } catch (error) {
    console.error('PATCH /profile/me/publish error:', error);
    res.status(500).json({ error: 'Failed to update publishing' });
  }
});

/**
 * Bản công khai gắn vào trang Bio. Hai cửa phải cùng mở: thành viên còn hạn
 * dùng Hugo Profile VÀ đã tự bật công bố. Hết hạn thuê thì panel tự biến mất
 * khỏi trang Bio, không cần ai đi dọn.
 */
router.get('/public/:slug', async (req, res) => {
  try {
    const bio = await Bio.findOne({ slug: req.params.slug });
    if (!bio || !bio.profilePublic || !isFeatureActive(bio, 'hugoProfile')) {
      return res.json({ profile: null });
    }
    res.json({ profile: await buildProfile(bio) });
  } catch (error) {
    console.error('GET /profile/public error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
