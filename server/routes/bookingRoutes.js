import express from 'express';
import Booking from '../models/Booking.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

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
    const { fullName, email, phone, message } = req.body;
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields: fullName, email, phone' });
    }

    const booking = await Booking.create({
      fullName,
      email,
      phone,
      message: message || ''
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
