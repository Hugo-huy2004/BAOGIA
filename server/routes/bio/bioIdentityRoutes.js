// Xác nhận chủ tài khoản định kỳ — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { requireAdmin, requireMember, requireRecentAuth } from '../../middleware/authMiddleware.js';
import { checkDue, recordPass } from '../../utils/identityCheck.js';

const router = express.Router();

// Mỗi mốc (30/90/180/365 ngày) đòi mở khoá một lần bằng Face ID / vân tay hoặc
// Google. Xem server/utils/identityCheck.js.

// GET /api/bios/me/identity-check — tới hạn chưa.
router.get('/me/identity-check', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail }).select('identityCheck');
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    const due = await checkDue(bio, req.memberVerifiedAt);
    res.json({ success: true, due, nextDueAt: bio.identityCheck?.nextDueAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bios/me/identity-check/confirm — gọi ngay sau khi client vừa mở khoá
// bằng Face ID/Google (phiên mới mang dấu verifiedAt).
router.post('/me/identity-check/confirm', requireMember, requireRecentAuth(), async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail }).select('identityCheck');
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ' });
    await recordPass(bio);
    res.json({ success: true, nextDueAt: bio.identityCheck.nextDueAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /bios/:id — Admin xóa tài khoản người dùng
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng' });
    }
    await Bio.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Đã xóa tài khoản ${bio.email}` });
  } catch (err) {
    console.error('Error deleting bio user:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
