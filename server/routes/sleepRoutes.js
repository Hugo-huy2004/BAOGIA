import express from 'express';
import SleepLog from '../models/SleepLog.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// The Python AI server has no public subdomain — same fix as
// server/routes/aiProxyRoutes.js. Forward the analyze call server-to-server.
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

// POST /api/sleep/analyze — proxy to the Python sleep analyzer
router.post('/analyze', async (req, res) => {
  try {
    const upstream = await fetch(`${AI_SERVER_URL}/api/sleep/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || ''
      },
      body: JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: 'AI server unreachable' });
  }
});

/** Compute duration from bedtime/wakeTime strings ("HH:MM") */
function computeDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return null;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60; // slept past midnight
  return Math.round((mins / 60) * 10) / 10; // round to 1 decimal
}

// GET /api/sleep?limit=30 — identity from the verified member token
router.get('/', requireMember, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email required' });

    const logs = await SleepLog.find({ email })
      .sort({ date: -1 })
      .limit(Math.min(Number(limit), 90))
      .lean();

    // Compute stats
    const valid = logs.filter(l => l.duration);
    const avgDuration = valid.length
      ? Math.round((valid.reduce((s, l) => s + l.duration, 0) / valid.length) * 10) / 10
      : null;
    const avgQuality = valid.length
      ? Math.round((valid.reduce((s, l) => s + (l.quality || 3), 0) / valid.length) * 10) / 10
      : null;

    res.json({ logs, stats: { avgDuration, avgQuality, total: logs.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/sleep — log tonight's sleep
router.post('/', requireMember, async (req, res) => {
  try {
    const { date, bedtime, wakeTime, quality, notes, mood, dreamNotes } = req.body;
    const email = req.memberEmail;
    if (!email || !date) return res.status(400).json({ error: 'email and date required' });

    const duration = computeDuration(bedtime, wakeTime);

    const log = await SleepLog.findOneAndUpdate(
      { email, date },
      { email, date, bedtime, wakeTime, duration, quality, notes, mood, dreamNotes },
      { upsert: true, new: true }
    );
    res.json(log);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PATCH /api/sleep/passive
 *
 * Handles automatic sleep/wake detection events from the browser hook.
 *
 * event types:
 *   sleep_onset  — hook detected sleep start, provides bedtime + date
 *   wake_onset   — hook detected wake, provides wakeTime + bedtime + date
 *   hidden       — legacy Page Visibility "tab hidden" fallback
 *   visible      — legacy Page Visibility "tab visible" fallback
 */
router.patch('/passive', requireMember, async (req, res) => {
  try {
    const { event, bedtime, wakeTime, date, confidence, signals } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email required' });

    const now   = new Date();
    const today = now.toISOString().slice(0, 10);

    // ── New auto-detection events ─────────────────────────────────────────

    if (event === 'sleep_onset') {
      const targetDate = date || today;
      await SleepLog.findOneAndUpdate(
        { email, date: targetDate },
        {
          $set: {
            bedtime,
            lastActiveAt:    now,
            passiveDetected: true,
            autoConfidence:  confidence ?? null,
            autoSignals:     signals    ?? [],
          },
        },
        { upsert: true }
      );
      return res.json({ ok: true, event: 'sleep_onset' });
    }

    if (event === 'wake_onset') {
      const targetDate = date || today;
      const duration   = computeDuration(bedtime, wakeTime);
      await SleepLog.findOneAndUpdate(
        { email, date: targetDate },
        {
          $set: {
            wakeTime,
            ...(bedtime   ? { bedtime }   : {}),
            ...(duration  ? { duration }  : {}),
            firstActiveAt:   now,
            passiveDetected: true,
            autoConfidence:  confidence ?? null,
            autoSignals:     signals    ?? [],
          },
        },
        { upsert: true }
      );
      return res.json({ ok: true, event: 'wake_onset' });
    }

    // ── Legacy fallback events (hidden / visible) ─────────────────────────

    if (event === 'hidden') {
      await SleepLog.findOneAndUpdate(
        { email, date: today },
        { $set: { lastActiveAt: now, passiveDetected: true } },
        { upsert: true }
      );
      return res.json({ ok: true });
    }

    if (event === 'visible') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().slice(0, 10);

      const prev = await SleepLog.findOne({ email, date: yDate });
      if (prev?.lastActiveAt && !prev.wakeTime) {
        const bedHr  = prev.lastActiveAt.getHours();
        const wakeHr = now.getHours();
        const bedOk  = bedHr >= 20 || bedHr <= 3;
        const wakeOk = wakeHr >= 4  && wakeHr <= 12;

        if (bedOk && wakeOk) {
          const pad      = n => String(n).padStart(2, '0');
          const btime    = `${pad(bedHr)}:${pad(prev.lastActiveAt.getMinutes())}`;
          const wtime    = `${pad(wakeHr)}:${pad(now.getMinutes())}`;
          const dur      = computeDuration(btime, wtime);
          await SleepLog.findOneAndUpdate(
            { email, date: yDate },
            { $set: { firstActiveAt: now, wakeTime: wtime, bedtime: btime, duration: dur, passiveDetected: true } },
            { new: true }
          );
        } else {
          await SleepLog.findOneAndUpdate({ email, date: yDate }, { $set: { firstActiveAt: now } });
        }
      }
      return res.json({ ok: true });
    }

    res.json({ ok: true, skipped: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/sleep/:date
router.delete('/:date', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email required' });
    await SleepLog.deleteOne({ email, date: req.params.date });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
