import express from 'express';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import {
  getResourceList,
  getArticleBySlug,
  startReadingSession,
  finishReadingSession,
  createResourceAdmin,
  updateResourceAdmin,
  deleteResourceAdmin,
} from '../modules/coder/resourceController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/coder-resources
// Điều phối các API con của phân hệ học liệu & bài đọc HugoCoder
// ==========================================

// --- 1. Học viên: Danh sách & Toàn văn bài đọc ---
router.get('/', requireMember, async (req, res) => {
  return getResourceList(req, res);
});

router.get('/article/:slug', requireMember, async (req, res) => {
  return getArticleBySlug(req, res);
});

// --- 2. Học viên: Bấm giờ đọc & Chốt hoàn thành ---
router.post('/:id/read/start', requireMember, async (req, res) => {
  return startReadingSession(req, res);
});

router.post('/:id/read/finish', requireMember, async (req, res) => {
  return finishReadingSession(req, res);
});

// --- 3. Quản trị viên: Quản lý học liệu ---
router.post('/', requireAdmin, async (req, res) => {
  return createResourceAdmin(req, res);
});

router.put('/:id', requireAdmin, async (req, res) => {
  return updateResourceAdmin(req, res);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  return deleteResourceAdmin(req, res);
});

export default router;
