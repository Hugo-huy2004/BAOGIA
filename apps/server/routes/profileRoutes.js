import express from 'express';
import Bio from '../models/Bio.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

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
    referrals: bio.referralCount || 0,
    starVip: Boolean(bio.starVip),
    generatedAt: new Date(),
  };
}

/** Hồ sơ của chính mình (tab "Hồ sơ năng lực" trong app Danh Thiếp). */
router.get('/me', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    res.json({
      profile: await buildProfile(bio),
      // Công bố miễn phí từ 25/10/2026 (trước phải thuê gói Hugo Profile).
      publishing: { enabled: Boolean(bio.profilePublic) },
    });
  } catch (error) {
    console.error('GET /profile/me error:', error);
    res.status(500).json({ error: 'Failed to build profile' });
  }
});

/** Minh chứng riêng tư của chính thành viên; không có route public tương ứng. */
router.patch('/me/publish', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    bio.profilePublic = Boolean(req.body?.enabled);
    await bio.save();
    res.json({ enabled: bio.profilePublic });
  } catch (error) {
    console.error('PATCH /profile/me/publish error:', error);
    res.status(500).json({ error: 'Failed to update publishing' });
  }
});

/** Bản công khai gắn vào trang Bio — chỉ khi thành viên tự bật công bố. */
router.get('/public/:slug', async (req, res) => {
  try {
    const bio = await Bio.findOne({ slug: req.params.slug });
    if (!bio || !bio.profilePublic) {
      return res.json({ profile: null });
    }
    res.json({ profile: await buildProfile(bio) });
  } catch (error) {
    console.error('GET /profile/public error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
