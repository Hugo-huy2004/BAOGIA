import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import SecurityBlock from '../models/SecurityBlock.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { revokeSecurityBlock } from '../services/securityEnforcement.js';

const router = express.Router();

// Admin-only audit feed. It exposes rule ids and keyed hashes, never raw IP,
// email, phone, request body or internal stack details.
router.get('/incidents', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const incidents = await SecurityEvent.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ incidents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/blocks', requireAdmin, async (_req, res) => {
  try {
    const now = new Date();
    const blocks = await SecurityBlock.find({
      $or: [{ permanent: true }, { expiresAt: { $gt: now } }],
    }).sort({ permanent: -1, lastLockedAt: -1 }).limit(500).lean();
    res.json({ blocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Human review remains the recovery path for a false positive. Revocation does
// not delete the audit event; it only ends enforcement and records admin state.
router.post('/blocks/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const block = await revokeSecurityBlock(req.params.id);
    if (!block) return res.status(404).json({ error: 'Không tìm thấy lệnh chặn.' });
    return res.json({ success: true, block });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
