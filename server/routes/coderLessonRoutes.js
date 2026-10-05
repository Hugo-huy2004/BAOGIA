import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  getLessonList,
  getLessonDetail,
  verifyLessonCode,
  submitLessonFeedback,
  SUMMARY_FIELDS,
} from '../modules/coder/lessonController.js';

const router = express.Router();

const verifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const feedbackLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// API CHA: /api/coder-lessons
// Điều phối các API con của phân hệ bài học HugoCoder
// ==========================================

// --- 1. Danh sách bài giảng & Chi tiết bài học (Công khai cho trang /study) ---
router.get('/', async (req, res) => {
  return getLessonList(req, res);
});

router.get('/:lessonId', async (req, res) => {
  return getLessonDetail(req, res);
});

// --- 2. Chấm điểm bài thực hành ---
router.post('/:lessonId/verify', verifyLimiter, async (req, res) => {
  return verifyLessonCode(req, res);
});

// --- 3. Gửi góp ý / phản hồi bài học ---
router.post('/:lessonId/feedback', feedbackLimiter, requireMember, async (req, res) => {
  return submitLessonFeedback(req, res);
});

export { SUMMARY_FIELDS };
export default router;
