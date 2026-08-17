import express from 'express';
import Booking from '../models/Booking.js';
import Bio from '../models/Bio.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const PROJECT_TYPES = new Set(['newWebsite', 'portfolio', 'improve', 'student', 'unsure']);
const BUDGETS = new Set(['unsure', 'underOne', 'oneToThree', 'threeToEight', 'overEight']);
const TIMELINES = new Set(['flexible', 'twoWeeks', 'oneMonth', 'twoMonths']);

/**
 * Tiêu một voucher dịch vụ ngay khi nhận đơn đặt lịch: một lệnh ghi có điều
 * kiện (chỉ khớp khi mã còn hạn và chưa dùng), nên hai đơn gửi cùng lúc không
 * thể xài chung một mã. Trả về % giảm, hoặc null nếu mã không dùng được.
 *
 * Mã BDAY-xx đời cũ không đi đường này — nó cộng ngày hạn dùng, đổi ở trang Gói
 * dịch vụ, không phải giảm giá dự án.
 */
async function claimServiceVoucher(code, email) {
  const now = new Date();
  const before = await Bio.findOneAndUpdate(
    {
      $or: [{ email }, { contactEmail: email }],
      serviceVouchers: {
        $elemMatch: { code, usedAt: null, expiresAt: { $gt: now } },
      },
    },
    { $set: { 'serviceVouchers.$.usedAt': now } },
    { projection: 'serviceVouchers' },
  );
  const voucher = before?.serviceVouchers?.find((v) => v.code === code);
  return voucher ? Number(voucher.percent) || 0 : null;
}

// GET: Fetch all bookings (ordered by newest)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Submit a new booking
router.post('/', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const message = String(req.body.message || '').trim();
    const projectType = String(req.body.projectType || '').trim();
    const budget = String(req.body.budget || 'unsure').trim();
    const timeline = String(req.body.timeline || 'flexible').trim();
    const notes = String(req.body.notes || '').trim();
    const voucherCode = String(req.body.voucherCode || '').trim().toUpperCase();
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields: fullName, email, phone' });
    }

    if (fullName.length > 100 || email.length > 254 || phone.length > 24 || message.length > 2000 || notes.length > 1600) {
      return res.status(400).json({ error: 'One or more fields exceed the allowed length' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!/^[+()\d\s.-]{8,24}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (projectType && !PROJECT_TYPES.has(projectType)) {
      return res.status(400).json({ error: 'Invalid project type' });
    }
    if (!BUDGETS.has(budget) || !TIMELINES.has(timeline)) {
      return res.status(400).json({ error: 'Invalid budget or timeline' });
    }
    if (voucherCode.length > 32) {
      return res.status(400).json({ error: 'voucher_invalid' });
    }

    // Báo mã hỏng ngay để khách sửa, đừng nuốt đơn rồi im lặng bỏ ưu đãi.
    const voucherPercent = voucherCode ? await claimServiceVoucher(voucherCode, email) : 0;
    if (voucherPercent === null) {
      return res.status(400).json({ error: 'voucher_invalid' });
    }

    const booking = await Booking.create({
      fullName,
      email,
      phone,
      message,
      projectType: projectType || undefined,
      budget,
      timeline,
      notes,
      voucherCode,
      voucherPercent,
    });

    res.status(201).json({ success: true, id: booking.id, voucherPercent });
  } catch (error) {
    console.error('[booking submission]', error.message);
    res.status(500).json({ error: 'Unable to submit the booking request' });
  }
});

// PATCH: Toggle contacted status
router.patch('/:id/contact', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { contacted } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.contacted = contacted;
    if (contacted) {
      booking.contactedAt = new Date();
      // Auto-expire in 60 days (60 * 24 * 60 * 60 * 1000 milliseconds)
      booking.expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    } else {
      booking.contactedAt = undefined;
      booking.expiresAt = undefined;
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete booking
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
