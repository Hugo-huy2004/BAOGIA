import express from 'express';

const router = express.Router();
// `all.` là bản ghi round-robin chính chủ của Radio Browser. Điều khoản dùng của
// họ yêu cầu KHÔNG ghim cứng một máy chủ đơn lẻ (bản cũ ghim `de1.`) và phải gửi
// User-Agent nhận dạng được — cả hai đều là điều kiện để được phép dùng API.
const RADIO_API_BASE = 'https://all.api.radio-browser.info/json';
const RADIO_UA = 'HugoStudio-Radio/2.0 (+https://hugowishpax.studio)';

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
  } catch {
    clearTimeout(id);
    return false;
  }
}

// `strict`: caller is healing a stream that just died, so a station we could not
// verify is worse than nothing — it makes the client attach another dead URL and
// wait for a timeout. Returning null lets it skip straight to another station.
// The category listing is not strict: an unverified station still belongs in the
// grid, the user may well be able to play it.
async function getWorkingStation(stations, excludeUrl, strict = false) {
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
  } catch {
    if (strict) return null;
    return stations.find(s => (s.url_resolved || s.url) !== excludeUrl) || stations[0];
  }
}

// ─── Cache kết quả dò đài ────────────────────────────────────────────────────
// Mỗi lượt dò là một request tìm kiếm + vài request kiểm tra luồng đi RA từ
// Render — và mọi người dùng đều dò đúng những cái tên như nhau ("VOV1", "BBC").
// Giữ lại kết quả trong bộ nhớ tiến trình là đủ để một người trả giá cho cả
// nhóm. Không dùng database: mất cache khi restart chỉ tốn đúng một lượt dò.
//
// ponytail: Map trong tiến trình. Render chạy một instance Node; nhiều instance
// thì mỗi cái tự có cache riêng — vẫn đúng, chỉ kém hiệu quả hơn.
const RESOLVE_CACHE_MAX = 200;
const RESOLVE_TTL_HIT = 2 * 60 * 60 * 1000;   // đài dò được: 2 tiếng
const RESOLVE_TTL_MISS = 10 * 60 * 1000;      // không tìm thấy: 10 phút
const resolveCache = new Map();

function cacheGet(key) {
  const hit = resolveCache.get(key);
  if (!hit) return undefined;
  const ttl = hit.station ? RESOLVE_TTL_HIT : RESOLVE_TTL_MISS;
  if (Date.now() - hit.at > ttl) {
    resolveCache.delete(key);
    return undefined;
  }
  return hit.station;
}

function cacheSet(key, station) {
  // Map giữ thứ tự chèn: đầy thì bỏ mục cũ nhất.
  if (resolveCache.size >= RESOLVE_CACHE_MAX) {
    resolveCache.delete(resolveCache.keys().next().value);
  }
  resolveCache.set(key, { at: Date.now(), station });
}

async function resolveStationCached(name, excludeUrl, strict) {
  const key = `${name}|${excludeUrl || ''}|${strict ? 1 : 0}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const station = await resolveStationByName(name, excludeUrl, strict);
  cacheSet(key, station || null);
  return station;
}

async function resolveStationByName(name, excludeUrl, strict = false) {
  try {
    // ponytail: limit 5 (was 10). Each candidate gets a stream health-check
    // (manifest fetch) — halving candidates halves that outbound; sorted by
    // lastcheckok below so we still test the healthiest first.
    const url = `${RADIO_API_BASE}/stations/search?name=${encodeURIComponent(name)}&limit=5`;
    const res = await fetch(url, { headers: { 'User-Agent': RADIO_UA } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    
    // Sort by lastcheckok (1 = good, 0 = bad)
    const candidates = [...data].sort((a, b) => b.lastcheckok - a.lastcheckok);
    return await getWorkingStation(candidates, excludeUrl, strict);
  } catch {
    return null;
  }
}

// POST /api/radio/stations { names: string[] }
router.post('/stations', async (req, res) => {
  try {
    const names = Array.isArray(req.body?.names) ? req.body.names : [];
    const results = await Promise.all(names.map(name => resolveStationCached(name, undefined, false)));
    res.json(results.filter(Boolean));
  } catch {
    res.json([]);
  }
});

// GET /api/radio/station?name=X&exclude=Y
router.get('/station', async (req, res) => {
  try {
    const name = req.query.name;
    const excludeUrl = req.query.exclude;
    if (!name) return res.json(null);
    const station = await resolveStationCached(name, excludeUrl, req.query.strict === '1');
    res.json(station || null);
  } catch {
    res.json(null);
  }
});

// POST /api/radio/click { stationuuid } — fire-and-forget click registration,
// per Radio Browser's API etiquette (feeds their clickcount ranking).
router.post('/click', async (req, res) => {
  const uuid = req.body?.stationuuid;
  if (uuid) {
    fetch(`${RADIO_API_BASE}/url/${uuid}`, { headers: { 'User-Agent': RADIO_UA } }).catch(() => {});
  }
  res.json({ ok: true });
});

// Hệ token nghe radio (/token-status, /heartbeat) đã gỡ 25/10/2026: nghe đài
// miễn phí, token đã mua được hoàn JOY bằng apps/server/scripts/refund-radio-tokens.mjs.

export default router;
