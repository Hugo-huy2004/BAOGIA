import express from 'express';
import SleepLog from '../models/SleepLog.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// The Python AI server has no public subdomain — same fix as
// server/routes/aiProxyRoutes.js. Forward the analyze call server-to-server.
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

// POST /api/sleep/analyze — proxy to the Python sleep analyzer (auth: member token)
router.post('/analyze', requireMember, async (req, res) => {
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

/**
 * Compute sleep score components based on NSF/AASM standards.
 * Returns { duration, quality, consistency, timing, efficiency, total }
 */
function computeSleepScore(logs, ageGroupHours = 8) {
  if (!logs.length) return null;

  const recent = logs.slice(0, 7); // last 7 days
  const valid = recent.filter(l => l.duration);

  if (!valid.length) return null;

  // 1. Duration score (0-100): based on how close to target
  const avgDur = valid.reduce((s, l) => s + l.duration, 0) / valid.length;
  const durDiff = Math.abs(avgDur - ageGroupHours);
  const duration = Math.max(0, Math.round(100 - durDiff * 15));

  // 2. Quality score (0-100): average of self-reported quality * 20
  const qualityLogs = recent.filter(l => l.quality);
  const avgQuality = qualityLogs.length
    ? qualityLogs.reduce((s, l) => s + l.quality, 0) / qualityLogs.length
    : 3;
  const quality = Math.round(avgQuality * 20);

  // 3. Consistency score (0-100): based on bedtime/wakeTime variance
  const bedTimes = valid.map(l => {
    if (!l.bedtime) return null;
    const [h, m] = l.bedtime.split(':').map(Number);
    let mins = h * 60 + m;
    if (mins < 300) mins += 24 * 60; // after midnight → treat as late night
    return mins;
  }).filter(Boolean);

  const wakeTimes = valid.map(l => {
    if (!l.wakeTime) return null;
    const [h, m] = l.wakeTime.split(':').map(Number);
    return h * 60 + m;
  }).filter(Boolean);

  let consistency = 70; // default
  if (bedTimes.length >= 3) {
    const bedMean = bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length;
    const bedStddev = Math.sqrt(bedTimes.reduce((s, v) => s + (v - bedMean) ** 2, 0) / bedTimes.length);
    consistency = Math.max(0, Math.min(100, Math.round(100 - bedStddev * 0.7)));
  }

  // 4. Timing score (0-100): ideal bedtime 22:00-23:00, wake 6:00-7:00
  let timing = 70;
  if (bedTimes.length && wakeTimes.length) {
    const avgBed = bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length;
    const avgWake = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length;
    const bedPenalty = avgBed < 1320 || avgBed > 1440 ? Math.abs(avgBed - 1380) * 0.3 : 0; // 22:00=1320, 23:00=1440
    const wakePenalty = avgWake < 330 || avgWake > 450 ? Math.abs(avgWake - 390) * 0.3 : 0; // 6:30=390
    timing = Math.max(0, Math.round(100 - bedPenalty - wakePenalty));
  }

  // 5. Efficiency score (0-100): sleepEfficiency if available
  const effLogs = valid.filter(l => l.sleepEfficiency);
  const efficiency = effLogs.length
    ? Math.round(effLogs.reduce((s, l) => s + l.sleepEfficiency, 0) / effLogs.length)
    : 75;

  // Total weighted score
  const total = Math.round(
    duration * 0.25 +
    quality * 0.20 +
    consistency * 0.20 +
    timing * 0.15 +
    efficiency * 0.20
  );

  return {
    duration,
    quality,
    consistency,
    timing,
    efficiency,
    total,
    avgDuration: Math.round(avgDur * 10) / 10,
    avgQuality: Math.round(avgQuality * 10) / 10,
  };
}

/**
 * Compute sleep debt: difference between recommended and actual sleep over N days.
 * @param {Array} logs - sorted by date desc
 * @param {number} recommendedHours - target hours per night
 * @param {number} days - lookback window
 */
function computeSleepDebt(logs, recommendedHours = 8, days = 14) {
  const window = logs.slice(0, days);
  if (!window.length) return { debt: 0, days: 0, avgDeficit: 0 };

  const totalActual = window.reduce((s, l) => s + (l.duration || 0), 0);
  const totalRecommended = recommendedHours * window.length;
  const debt = Math.round((totalRecommended - totalActual) * 10) / 10;

  return {
    debt: Math.max(0, debt), // only track deficit, not surplus
    days: window.length,
    avgDeficit: Math.round((debt / window.length) * 10) / 10,
    recoveryDays: Math.ceil(Math.max(0, debt) / 1), // ~1h extra per recovery night
  };
}

/**
 * Compute sleep regularity index (SRI): -100 to 100.
 * Measures how consistent the sleep pattern is across days.
 */
function computeRegularity(logs) {
  const recent = logs.slice(0, 14);
  if (recent.length < 3) return null;

  const bedMinutes = recent.map(l => {
    if (!l.bedtime) return null;
    const [h, m] = l.bedtime.split(':').map(Number);
    let mins = h * 60 + m;
    if (mins < 300) mins += 24 * 60;
    return mins;
  }).filter(Boolean);

  const wakeMinutes = recent.map(l => {
    if (!l.wakeTime) return null;
    const [h, m] = l.wakeTime.split(':').map(Number);
    return h * 60 + m;
  }).filter(Boolean);

  if (bedMinutes.length < 3 || wakeMinutes.length < 3) return null;

  // Standard deviation as regularity measure
  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stddev = arr => {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  };

  const bedStd = stddev(bedMinutes);
  const wakeStd = stddev(wakeMinutes);
  const avgStd = (bedStd + wakeStd) / 2;

  // Convert to 0-100 scale: 0 std = 100, 60+ std = 0
  const sri = Math.max(0, Math.min(100, Math.round(100 - avgStd * 1.67)));
  return sri;
}

// GET /api/sleep?limit=30 — identity from the verified member token
router.get('/', requireMember, async (req, res) => {
  try {
    const { limit = 30, age } = req.query;
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

    // Age-based target
    const ageNum = age ? parseInt(age, 10) : null;
    let targetHours = 8;
    if (ageNum && ageNum <= 12) targetHours = 10;
    else if (ageNum && ageNum <= 17) targetHours = 9;

    // Enhanced analytics
    const sleepScore = computeSleepScore(logs, targetHours);
    const sleepDebt = computeSleepDebt(logs, targetHours);
    const regularity = computeRegularity(logs);

    res.json({
      logs,
      stats: {
        avgDuration,
        avgQuality,
        total: logs.length,
        targetHours,
      },
      analytics: {
        sleepScore,
        sleepDebt,
        regularity,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/sleep — log tonight's sleep
router.post('/', requireMember, async (req, res) => {
  try {
    const {
      date, bedtime, wakeTime, quality, notes, mood, dreamNotes,
      sleepLatency, awakenings, wakeAfterSleepOnset,
      screenTime, caffeine, exercise, alcohol, sleepEnvironment, stressLevel,
      sleepStages, sleepEfficiency,
    } = req.body;
    const email = req.memberEmail;
    if (!email || !date) return res.status(400).json({ error: 'email and date required' });

    const duration = computeDuration(bedtime, wakeTime);

    // Auto-compute sleep efficiency if we have duration and a bedtime/wakeTime
    let computedEfficiency = sleepEfficiency;
    if (!computedEfficiency && duration && bedtime && wakeTime) {
      // Estimate time in bed
      const [bh, bm] = bedtime.split(':').map(Number);
      const [wh, wm] = wakeTime.split(':').map(Number);
      let bedMins = bh * 60 + bm;
      let wakeMins = wh * 60 + wm;
      if (wakeMins < bedMins) wakeMins += 24 * 60;
      const timeInBed = (wakeMins - bedMins) / 60;
      if (timeInBed > 0) {
        // Subtract sleep latency and WASO from time in bed for actual sleep time
        const latency = sleepLatency || 0;
        const waso = wakeAfterSleepOnset || 0;
        const actualSleep = duration - (latency / 60) - (waso / 60);
        computedEfficiency = Math.round(Math.min(100, Math.max(0, (actualSleep / timeInBed) * 100)));
      }
    }

    const update = {
      email, date, bedtime, wakeTime, duration, quality, notes, mood, dreamNotes,
      sleepLatency, awakenings, wakeAfterSleepOnset,
      screenTime, caffeine, exercise, alcohol, sleepEnvironment, stressLevel,
      sleepEfficiency: computedEfficiency,
    };
    if (sleepStages) update.sleepStages = sleepStages;

    const log = await SleepLog.findOneAndUpdate(
      { email, date },
      update,
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
