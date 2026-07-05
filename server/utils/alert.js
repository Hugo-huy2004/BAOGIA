// Lightweight, dependency-free alerting. Always logs to stderr; additionally
// POSTs to ALERT_WEBHOOK_URL (Discord/Slack incoming webhook) when configured.
// Throttled per-title so a failing dependency can't spam the channel.
const lastSent = new Map();
const THROTTLE_MS = 5 * 60 * 1000;

export async function sendAlert(title, detail = {}) {
  console.error(`[ALERT] ${title}`, JSON.stringify(detail));

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
