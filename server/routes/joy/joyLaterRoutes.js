// JOYlater: mở trước trả sau — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import { requireAdmin, requireMember } from '../../middleware/authMiddleware.js';
import { joyLaterStatus, quoteLoan, openJoyLaterLoan, payOffJoyLater, payInstallment, joyLaterHistory } from '../../utils/joyLaterService.js';

const router = express.Router();

// POST /api/joy/transfer  { fromEmail, toReferralCode|toEmail|toPhone, amount, message, pin, idempotencyKey }
// ─── JOYlater: mở khoá trước, trả bằng thu nhập ngày ───────────────
// Toàn bộ phép tính ở shared/joyLater.js (có test); route chỉ vào/ra dữ liệu.

// GET /api/joy/joylater — trạng thái: đủ điều kiện chưa, hạn mức, nợ hiện tại
router.get('/joylater', requireMember, async (req, res) => {
  try {
    res.json(await joyLaterStatus(req.memberEmail));
  } catch (error) {
    res.status(error.message === 'BIO_NOT_FOUND' ? 404 : 500).json({ error: error.message });
  }
});

// POST /api/joy/joylater/apply — ngừng nhận hồ sơ từ 25/10/2026 (xem lendingOpen
// trong joyCreditService). Khoản đang vay vẫn trả qua các route bên dưới.
router.post('/joylater/apply', requireMember, (_req, res) => {
  res.status(410).json({ error: 'JOYlater đã ngừng nhận hồ sơ mới.' });
});

/**
 * POST /api/joy/joylater/review — ADMIN ép xét lại hạn mức ngay.
 *
 * Không có `email` thì xét lại TOÀN BỘ hồ sơ; có thì chỉ một người.
 *
 * Đây là quyền CHỌN THỜI ĐIỂM, không phải quyền chọn kết quả: phép chấm vẫn
 * chạy y hệt kỳ thứ Bảy, nên hạn mức có thể lên, xuống hoặc giữ nguyên.
 */
router.post('/joylater/review', requireAdmin, async (req, res) => {
  try {
    const { forceReview } = await import('../services/joyCreditService.js');
    const email = String(req.body?.email || '').trim().toLowerCase() || null;
    // `requireAdmin` đặt `req.admin` (payload { id, role, uaHash }); `req.adminEmail`
    // chưa bao giờ tồn tại nên trước đây `by` luôn là chuỗi 'admin'.
    const result = await forceReview({ email, by: req.admin?.id || 'admin' });
    console.log(`[joylater] admin ép xét lại: ${result.scanned} hồ sơ, ${result.changed.length} đổi hạn mức`);
    res.json(result);
  } catch (error) {
    console.error('[joylater/review]', error);
    res.status(500).json({ error: 'Không xét lại được. Vui lòng thử lại.' });
  }
});

// GET /api/joy/joylater/history — mọi lượt đã mở, kèm từng dòng đã hoàn
router.get('/joylater/history', requireMember, async (req, res) => {
  try {
    res.json(await joyLaterHistory(req.memberEmail));
  } catch (error) {
    res.status(error.message === 'BIO_NOT_FOUND' ? 404 : 500).json({ error: error.message });
  }
});

// GET /api/joy/joylater/quote?amount=&cycles= — báo giá TRƯỚC khi đồng ý
router.get('/joylater/quote', requireMember, async (req, res) => {
  try {
    const amount = Number(req.query.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Số JOY muốn mở trước không hợp lệ.' });
    }
    res.json(await quoteLoan(req.memberEmail, amount, req.query.cycles ?? req.query.installments));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/joylater/open — mở khoản ứng
router.post('/joylater/open', requireMember, async (req, res) => {
  try {
    const { amount, itemLabel, itemKey, cycles, installments } = req.body;
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Số JOY muốn mở trước không hợp lệ.' });
    }
    // `cycles` không cần kiểm ở đây: `clampCycles` ở shared/joyLaterRates
    // ép mọi giá trị về 1..4, và phí thì tính từ con số ĐÃ ép đó.
    res.json(await openJoyLaterLoan(req.memberEmail, Math.round(numAmount), {
      itemLabel: String(itemLabel || '').slice(0, 120),
      itemKey: String(itemKey || '').slice(0, 60),
      cycles: cycles ?? installments,
    }));
  } catch (error) {
    const map = {
      JOYLATER_NOT_ELIGIBLE: [403, 'JOYlater đã ngừng mở khoản mới.'],
      JOYLATER_OVER_LIMIT: [400, 'Số JOY muốn mở trước vượt mức tối đa của bạn.'],
      JOYLATER_ALREADY_OPEN: [409, 'Bạn đang có một lượt JOYlater chưa hoàn xong.'],
      BIO_NOT_FOUND: [404, 'Không tìm thấy hồ sơ.'],
    };
    const [status, message] = map[error.message] || [500, error.message];
    res.status(status).json({ error: message, code: error.message, reasons: error.reasons });
  }
});

// POST /api/joy/joylater/pay-installment — trả đúng một đợt
// Không nhận số tiền từ client: server tự tính đợt kế tiếp từ số còn nợ.
router.post('/joylater/pay-installment', requireMember, async (req, res) => {
  try {
    res.json(await payInstallment(req.memberEmail));
  } catch (error) {
    const map = {
      JOYLATER_NO_LOAN: [400, 'Bạn không có lượt JOYlater nào.'],
      INSUFFICIENT_JOY: [400, 'Số dư JOY không đủ để hoàn đợt này.'],
      JOYLATER_NOT_DUE: [409, 'Đợt này chưa tới ngày hoàn.'],
      JOYLATER_RACE: [409, 'Số cần hoàn vừa thay đổi, thử lại giúp mình.'],
      BIO_NOT_FOUND: [404, 'Không tìm thấy hồ sơ.'],
    };
    const [status, message] = map[error.message] || [500, error.message];
    // Kèm ngày tới hạn để giao diện nói được "mở lúc nào", không chỉ "chưa được".
    res.status(status).json({ error: message, code: error.message, dueAt: error.dueAt });
  }
});

// POST /api/joy/joylater/payoff — trả hết ngay, không phí thêm
router.post('/joylater/payoff', requireMember, async (req, res) => {
  try {
    res.json(await payOffJoyLater(req.memberEmail));
  } catch (error) {
    const map = {
      JOYLATER_NO_LOAN: [400, 'Bạn không có lượt JOYlater nào.'],
      INSUFFICIENT_JOY: [400, 'Số dư JOY không đủ để hoàn hết.'],
      JOYLATER_NOT_DUE: [409, 'Chia đợt thì phải tới ngày mới hoàn được.'],
      JOYLATER_RACE: [409, 'Số cần hoàn vừa thay đổi, thử lại giúp mình.'],
      BIO_NOT_FOUND: [404, 'Không tìm thấy hồ sơ.'],
    };
    const [status, message] = map[error.message] || [500, error.message];
    res.status(status).json({ error: message, code: error.message, dueAt: error.dueAt });
  }
});

export default router;
