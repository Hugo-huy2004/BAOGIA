import express from 'express';

const router = express.Router();
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json';

// Server-side proxy for the public Radio Browser API. CORS only restricts
// browser-side fetches, not server-to-server calls, so this sidesteps the
// inconsistent/missing CORS headers some Radio Browser mirror nodes return
// (and any browser extension/firewall blocking a third-party API domain).
async function checkUrl(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!res.ok) {
      clearTimeout(id);
      return false;
    }
    
    // Deep check for HLS manifests to catch chunk-level 404s
    const contentType = res.headers.get('content-type') || '';
    if (url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegurl')) {
      const text = await res.text();
      clearTimeout(id);
      
      const lines = text.split('\n');
      for (const line of lines) {
        const l = line.trim();
        if (l && !l.startsWith('#')) {
          const chunkUrl = new URL(l, url).href;
          const chunkController = new AbortController();
          const chunkId = setTimeout(() => chunkController.abort(), 2000);
          try {
            const chunkRes = await fetch(chunkUrl, { method: 'GET', signal: chunkController.signal });
            clearTimeout(chunkId);
            chunkController.abort();
            return chunkRes.ok;
          } catch {
            clearTimeout(chunkId);
            return false;
          }
        }
      }
      return true;
    }
    
    clearTimeout(id);
    controller.abort();
    return true;
  } catch (e) {
    clearTimeout(id);
    return false;
  }
}

async function getWorkingStation(stations, excludeUrl) {
  try {
    return await Promise.any(
      stations.map(async (station) => {
        const url = station.url_resolved || station.url;
        if (!url || url === excludeUrl) throw new Error('excluded or no url');
        const isOk = await checkUrl(url);
        if (isOk) return station;
        throw new Error('dead');
      })
    );
  } catch (e) {
    // If all fail, return the first one that wasn't excluded (or just the first)
    return stations.find(s => (s.url_resolved || s.url) !== excludeUrl) || stations[0];
  }
}

async function resolveStationByName(name, excludeUrl) {
  try {
    const url = `${RADIO_API_BASE}/stations/search?name=${encodeURIComponent(name)}&limit=10`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HugoStudio-Radio/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    
    // Sort by lastcheckok (1 = good, 0 = bad)
    const candidates = [...data].sort((a, b) => b.lastcheckok - a.lastcheckok);
    return await getWorkingStation(candidates, excludeUrl);
  } catch {
    return null;
  }
}

// POST /api/radio/stations { names: string[] }
router.post('/stations', async (req, res) => {
  const names = Array.isArray(req.body?.names) ? req.body.names : [];
  const results = await Promise.all(names.map(name => resolveStationByName(name)));
  res.json(results.filter(Boolean));
});

// GET /api/radio/station?name=X&exclude=Y
router.get('/station', async (req, res) => {
  const name = req.query.name;
  const excludeUrl = req.query.exclude;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const station = await resolveStationByName(name, excludeUrl);
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
