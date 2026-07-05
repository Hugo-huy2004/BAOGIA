import cron from 'node-cron';

// Keep the free-tier instance warm: Render puts the service to sleep after ~15
// minutes with no inbound HTTP, causing a 10–50s cold start on the next request.
// Pinging our own public /api/health every 10 minutes counts as inbound traffic
// and keeps it awake. No-ops locally (no RENDER_EXTERNAL_URL).
export function initKeepAlive() {
  const base = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
  if (!base) {
    console.log('[KeepAlive] disabled (no RENDER_EXTERNAL_URL / SELF_URL).');
    return;
  }
  const target = `${base.replace(/\/$/, '')}/api/health`;
  cron.schedule('*/10 * * * *', async () => {
    try {
      await fetch(target, { method: 'GET' });
    } catch (e) {
      console.warn('[KeepAlive] ping failed:', e.message);
    }
  });
  console.log(`[KeepAlive] pinging ${target} every 10 min.`);
}
