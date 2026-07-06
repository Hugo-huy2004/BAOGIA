// Lightweight alerting + persistent error logging. Always logs to stderr;
// persists to the ErrorLog collection (admin System dashboard); and optionally
// POSTs to ALERT_WEBHOOK_URL (Discord/Slack). Throttled per-title so a failing
// dependency can't spam the webhook. Never throws.
import ErrorLog from '../models/ErrorLog.js';

const lastSent = new Map();
const THROTTLE_MS = 5 * 60 * 1000;

// Persist an error/event to the DB for the admin dashboard. Best-effort.
export async function logError({ level = 'error', source = 'server', message, stack = '', meta = {}, path = '', email = '' } = {}) {
  try {
    if (!message) return;
    await ErrorLog.create({ level, source, message: String(message).slice(0, 1000), stack: String(stack).slice(0, 4000), meta, path, email });
  } catch (e) {
    console.error('[logError] failed to persist:', e.message);
  }
}

// High-level alert: log to stderr + persist + (throttled) webhook.
export async function sendAlert(title, detail = {}) {
  console.error(`[ALERT] ${title}`, JSON.stringify(detail));

  // Persist every alert as an error-level log (fire-and-forget).
  logError({ level: 'error', source: detail?.source || 'alert', message: title, meta: detail });

  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;

  const now = Date.now();
  if (lastSent.get(title) && now - lastSent.get(title) < THROTTLE_MS) return;
  lastSent.set(title, now);

  const body = `🚨 Hugo Studio: ${title}\n${'```'}${JSON.stringify(detail, null, 2).slice(0, 1500)}${'```'}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `content` for Discord, `text` for Slack — the other host ignores the extra key.
      body: JSON.stringify({ content: body, text: body }),
    });
  } catch (e) {
    console.error('[ALERT] webhook failed:', e.message);
  }
}
