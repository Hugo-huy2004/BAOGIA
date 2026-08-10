import express from 'express';
import Booking from '../models/Booking.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const PROJECT_TYPES = new Set(['newWebsite', 'portfolio', 'improve', 'student', 'unsure']);
const BUDGETS = new Set(['unsure', 'underOne', 'oneToThree', 'threeToEight', 'overEight']);
const TIMELINES = new Set(['flexible', 'twoWeeks', 'oneMonth', 'twoMonths']);

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

    const booking = await Booking.create({
      fullName,
      email,
      phone,
      message,
      projectType: projectType || undefined,
      budget,
      timeline,
      notes,
    });

    res.status(201).json({ success: true, id: booking.id });
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
