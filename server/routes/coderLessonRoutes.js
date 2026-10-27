import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  getLessonList,
  getLessonDetail,
  gradePreviewQuiz,
  submitLessonFeedback,
  SUMMARY_FIELDS,
} from '../modules/coder/lessonController.js';

const router = express.Router();

const gradeLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const feedbackLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Bảo vệ bản quyền giáo trình: nội dung bài chỉ phát qua API đã gate (xem
// lessonController) và thêm giới hạn tần suất đọc để không ai cào cả khoá bằng
// script. Giới hạn rộng rãi nên người học bình thường không bao giờ chạm tới.
const readLimiter = rateLimit({
  windowMs: 60_000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// API CHA: /api/coder-lessons
// Điều phối các API con của phân hệ bài học HugoCoder
// ==========================================

// --- 1. Danh sách bài giảng & Chi tiết bài học (Công khai cho trang /study) ---
router.get('/', readLimiter, async (req, res) => {
  return getLessonList(req, res);
});

router.get('/:lessonId', readLimiter, async (req, res) => {
  return getLessonDetail(req, res);
});

// Khách học thử chấm trắc nghiệm ở đây; thành viên nộp qua /api/joy/award-learning để lưu tiến độ.
router.post('/:lessonId/grade', gradeLimiter, async (req, res) => {
  return gradePreviewQuiz(req, res);
});

// --- 2. Gửi góp ý / phản hồi bài học ---
router.post('/:lessonId/feedback', feedbackLimiter, requireMember, async (req, res) => {
  return submitLessonFeedback(req, res);
});

export { SUMMARY_FIELDS };
export default router;
