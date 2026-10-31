import cron from 'node-cron';
import CompanionHistory from '../models/CompanionHistory.js';
import { generateWeeklyReportForUser } from './companionReportService.js';

// Weekly wellness reports were previously generated only when a user
// manually opened the report screen — meaning CompanionHistory.longTermMemories
// (the semantic recall feed for early chat turns, see aiProxyRoutes.js's
// enrichWithLongTermMemory) stayed empty for anyone who never clicked that
// button. This cron makes memory accumulation automatic for active users.
const SCHEDULE = '0 22 * * 0'; // Sunday 22:00 (server local time), off-peak

// Only users active in the last 7 days — skips accounts with nothing new to
// summarize, so we don't burn AI quota (or write noise into longTermMemories)
// for dormant accounts. `updatedAt` bumps on every /api/companion/history save.
const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Small delay between users so a burst of reports doesn't hammer the Python
// AI server's Gemini quota all at once — mirrors the sequential (not
// Promise.all) processing style already used by runScheduledCompanionPushes
// in smartNotificationService.js.
const DELAY_BETWEEN_USERS_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runWeeklyMemoryDigestJob() {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
  // Skip anyone whose last report is still fresh (e.g. they triggered it
  // manually mid-week) — avoids double-generating the same week's digest.
  const candidates = await CompanionHistory.find(
    {
      updatedAt: { $gte: cutoff },
      $or: [
        { 'lastWeeklyReport.generatedAt': { $lt: cutoff } },
        { 'lastWeeklyReport.generatedAt': { $exists: false } }
      ]
    },
    { email: 1 }
  ).lean();

  if (!candidates.length) return;
  console.log(`[CompanionMemoryCron] Generating weekly reports for ${candidates.length} active user(s)...`);

  let ok = 0, failed = 0;
  for (const { email } of candidates) {
    try {
      await generateWeeklyReportForUser(email);
      ok++;
    } catch (err) {
      failed++;
      console.error(`[CompanionMemoryCron] Failed for ${email}:`, err.message);
    }
    await sleep(DELAY_BETWEEN_USERS_MS);
  }
  console.log(`[CompanionMemoryCron] Done — ${ok} succeeded, ${failed} failed.`);
}

export function initCompanionMemoryCron() {
  cron.schedule(SCHEDULE, () => {
    runWeeklyMemoryDigestJob().catch((err) => {
      console.error('[CompanionMemoryCron] Job crashed:', err.message);
    });
  });
}

// Exported for manual/admin-triggered runs and tests.
export { runWeeklyMemoryDigestJob };
