import express from 'express';
import { requireMember, requireAdultMember } from '../middleware/authMiddleware.js';
import {
  analyzeSleepProxy,
  getSleepLogs,
  saveSleepLog,
  patchPassiveSleep,
  deleteSleepLog,
  computeDuration,
  computeSleepScore,
  computeSleepDebt,
  computeRegularity,
} from '../modules/sleep/sleepController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/sleep
// Điều phối các API con của phân hệ Giấc Ngủ & Aura Tracker
// ==========================================

// --- 1. Phân tích giấc ngủ thông minh bằng AI (Yêu cầu thành viên người lớn) ---
router.post('/analyze', requireAdultMember, async (req, res) => {
  return analyzeSleepProxy(req, res);
});

// --- 2. Nhật ký & Phân tích chu kỳ giấc ngủ ---
router.get('/', requireMember, async (req, res) => {
  return getSleepLogs(req, res);
});

router.post('/', requireMember, async (req, res) => {
  return saveSleepLog(req, res);
});

// --- 3. Sự kiện tự động phát hiện giấc ngủ thụ động (Page Visibility / Background Hook) ---
router.patch('/passive', requireMember, async (req, res) => {
  return patchPassiveSleep(req, res);
});

// --- 4. Quản lý / Xóa bản ghi ---
router.delete('/:date', requireMember, async (req, res) => {
  return deleteSleepLog(req, res);
});

export { computeDuration, computeSleepScore, computeSleepDebt, computeRegularity };
export default router;
