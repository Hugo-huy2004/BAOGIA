import express from 'express';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import {
  dueSurvey, saveAnswers, trackOpen, report, monthKey,
} from '../services/surveyService.js';

const router = express.Router();

/**
 * Khảo sát định kỳ — hỏi người dùng mỗi tháng một lần, ba lựa chọn.
 *
 * Mọi route ở đây lấy danh tính từ `req.memberEmail`. Không route nào nhận
 * email từ máy khách: khảo sát vừa đọc được nhật ký dùng app của một người, vừa
 * ghi được đánh giá đứng tên họ.
 */

/** Đợt của tháng này, hoặc `{ survey: null }` khi không có gì để hỏi. */
router.get('/due', requireMember, async (req, res) => {
  try {
    res.json({ survey: await dueSurvey(req.memberEmail) });
  } catch (err) {
    console.error('[survey] due:', err.message);
    // Khảo sát hỏng KHÔNG được làm hỏng portal — trả "không có đợt nào" và im.
    res.json({ survey: null });
  }
});

router.post('/answer', requireMember, async (req, res) => {
  const { month, answers } = req.body || {};
  try {
    const saved = await saveAnswers(req.memberEmail, String(month || ''), Array.isArray(answers) ? answers : []);
    res.json({ ok: true, saved });
  } catch (err) {
    const known = {
      MONTH_MISMATCH: [409, 'Đợt khảo sát đã sang tháng khác. Vui lòng tải lại.'],
      NO_SURVEY_DUE: [409, 'Đợt khảo sát này đã hoàn tất.'],
      NO_VALID_ANSWERS: [400, 'Không có câu trả lời hợp lệ.'],
    }[err.message];
    if (known) return res.status(known[0]).json({ error: known[1] });
    console.error('[survey] answer:', err.message);
    res.status(500).json({ error: 'Không ghi được câu trả lời.' });
  }
});

/**
 * Ghi nhận một lượt mở ứng dụng.
 *
 * Cố ý trả 204 trong MỌI trường hợp, kể cả khi appId lạ hay ghi hỏng: đây là
 * tín hiệu nền, không đáng để một lỗi mạng hiện thành thông báo đỏ trước mặt
 * người đang mở app.
 */
router.post('/track', requireMember, async (req, res) => {
  try {
    await trackOpen(req.memberEmail, String(req.body?.appId || ''));
  } catch (err) {
    console.error('[survey] track:', err.message);
  }
  res.status(204).end();
});

/** Bảng điểm theo ứng dụng — chỉ admin. */
router.get('/report', requireAdmin, async (req, res) => {
  try {
    res.json(await report({
      months: Math.min(Number(req.query.months) || 12, 36),
      minSample: Math.max(Number(req.query.minSample) || 3, 1),
    }));
  } catch (err) {
    console.error('[survey] report:', err.message);
    res.status(500).json({ error: 'Không dựng được báo cáo.' });
  }
});

/** Tháng hiện tại theo máy chủ — để máy khách gửi `month` đúng múi giờ server. */
router.get('/month', requireMember, (_req, res) => res.json({ month: monthKey() }));

export default router;
