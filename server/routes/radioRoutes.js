import express from 'express';

const router = express.Router();
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json';

// Server-side proxy for the public Radio Browser API. CORS only restricts
// browser-side fetches, not server-to-server calls, so this sidesteps the
// inconsistent/missing CORS headers some Radio Browser mirror nodes return
// (and any browser extension/firewall blocking a third-party API domain).
async function resolveStationByName(name) {
  try {
    const url = `${RADIO_API_BASE}/stations/search?name=${encodeURIComponent(name)}&limit=5`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HugoStudio-Radio/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return data.find((s) => s.lastcheckok === 1) || data[0];
  } catch {
    return null;
  }
}

// POST /api/radio/stations { names: string[] }
router.post('/stations', async (req, res) => {
  const names = Array.isArray(req.body?.names) ? req.body.names : [];
  const results = await Promise.all(names.map(resolveStationByName));
  res.json(results.filter(Boolean));
});

// GET /api/radio/station?name=X — single fresh lookup, used right before playback
// and for the one-shot retry-on-failure path.
router.get('/station', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const station = await resolveStationByName(name);
  res.json(station || null);
});

// POST /api/radio/click { stationuuid } — fire-and-forget click registration,
// per Radio Browser's API etiquette (feeds their clickcount ranking).
router.post('/click', async (req, res) => {
  const uuid = req.body?.stationuuid;
  if (uuid) {
    fetch(`${RADIO_API_BASE}/url/${uuid}`, { headers: { 'User-Agent': 'HugoStudio-Radio/1.0' } }).catch(() => {});
  }
  res.json({ ok: true });
});

export default router;
