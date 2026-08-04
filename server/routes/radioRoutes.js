import express from 'express';
import Bio from '../models/Bio.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json';

// Weekly free allowance in minutes (5 hours)
const WEEKLY_FREE_MINUTES = 300;
// Ceiling for a single heartbeat. The client reports elapsed wall-clock time, so
// a tab the OS suspended for hours would otherwise report the whole gap at once.
const MAX_HEARTBEAT_MINUTES = 30;
// Milliseconds in one week
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  } catch (e) {
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
    const res = await fetch(url, { headers: { 'User-Agent': 'HugoStudio-Radio/1.0' } });
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
    fetch(`${RADIO_API_BASE}/url/${uuid}`, { headers: { 'User-Agent': 'HugoStudio-Radio/1.0' } }).catch(() => {});
  }
  res.json({ ok: true });
});

// ── HugoRadio Token System ──────────────────────────────────────────────────

// Helper: reset weekly free pool if a new week has started since last reset.
function ensureWeeklyReset(radioTokens) {
  const now = Date.now();
  const lastReset = radioTokens.weeklyResetAt ? new Date(radioTokens.weeklyResetAt).getTime() : 0;
  if (!lastReset || (now - lastReset) >= WEEK_MS) {
    radioTokens.weeklyUsedMinutes = 0;
    radioTokens.weeklyFreeMinutes = WEEKLY_FREE_MINUTES;
    radioTokens.weeklyResetAt = new Date(now);
  }
  return radioTokens;
}

// Cộng dồn số thập phân qua hàng trăm nhịp sẽ trôi (0.1 + 0.2…) — chốt hai chữ số.
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Trừ số phút vừa nghe: hết hạn mức miễn phí 5 giờ/tuần rồi mới đụng tới phần
 * đã mua. Hàm thuần, không chạm database — để kiểm chứng được bằng test.
 */
export function applyListening(tokens, minutes) {
  let remaining = Math.max(0, minutes);

  const freeAvailable = Math.max(0, tokens.weeklyFreeMinutes - tokens.weeklyUsedMinutes);
  const fromFree = Math.min(freeAvailable, remaining);
  tokens.weeklyUsedMinutes = round2(tokens.weeklyUsedMinutes + fromFree);
  remaining -= fromFree;

  const fromPurchased = Math.min(Math.max(0, tokens.purchasedMinutes), remaining);
  tokens.purchasedMinutes = round2(Math.max(0, tokens.purchasedMinutes) - fromPurchased);
  remaining -= fromPurchased;

  const freeLeft = round2(Math.max(0, tokens.weeklyFreeMinutes - tokens.weeklyUsedMinutes));
  const purchasedLeft = round2(Math.max(0, tokens.purchasedMinutes));

  return {
    freeRemaining: freeLeft,
    purchasedRemaining: purchasedLeft,
    totalRemaining: round2(freeLeft + purchasedLeft),
    canListen: freeLeft + purchasedLeft > 0,
    deducted: round2(fromFree + fromPurchased),
  };
}

// GET /api/radio/token-status?email=...
// Returns the user's current radio token status (free + purchased pools).
router.get('/token-status', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail || req.query.email;
    if (!email) return res.status(400).json({ error: 'email is required' });

    let bio = await Bio.findOne({ email }).select('radioTokens');
    if (!bio) bio = await Bio.findOne({ contactEmail: email }).select('radioTokens');
    if (!bio) return res.status(404).json({ error: 'User not found' });

    if (!bio.radioTokens) {
      bio.radioTokens = {
        weeklyFreeMinutes: WEEKLY_FREE_MINUTES,
        weeklyUsedMinutes: 0,
        weeklyResetAt: new Date(),
        purchasedMinutes: 0
      };
      await bio.save();
    }

    ensureWeeklyReset(bio.radioTokens);
    await bio.save();

    const freeRemaining = Math.max(0, bio.radioTokens.weeklyFreeMinutes - bio.radioTokens.weeklyUsedMinutes);
    const purchasedRemaining = Math.max(0, bio.radioTokens.purchasedMinutes);
    const totalRemaining = freeRemaining + purchasedRemaining;

    res.json({
      freeMinutes: bio.radioTokens.weeklyFreeMinutes,
      freeUsed: bio.radioTokens.weeklyUsedMinutes,
      freeRemaining,
      purchasedMinutes: purchasedRemaining,
      totalRemaining,
      canListen: totalRemaining > 0,
      weekResetAt: bio.radioTokens.weeklyResetAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/radio/heartbeat { email, listeningMinutes }
// Called periodically (every 5 min) by the client while radio is playing.
// Deducts time from free pool first, then purchased pool.
// Returns remaining time and whether the user can continue listening.
router.post('/heartbeat', requireMember, async (req, res) => {
  try {
    const { email, listeningMinutes } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    // The client now reports actual elapsed minutes (fractional), so `|| 5` was
    // wrong twice over: it turned a legitimate 0 into a 5-minute charge, and it
    // trusted whatever number arrived. Cap it — a throttled/suspended tab can
    // wake up hours later and report the whole gap.
    const asked = Number(listeningMinutes);
    const minutes = Number.isFinite(asked) ? Math.min(Math.max(asked, 0), MAX_HEARTBEAT_MINUTES) : 5;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'User not found' });

    if (!bio.radioTokens) {
      bio.radioTokens = {
        weeklyFreeMinutes: WEEKLY_FREE_MINUTES,
        weeklyUsedMinutes: 0,
        weeklyResetAt: new Date(),
        purchasedMinutes: 0
      };
    }

    ensureWeeklyReset(bio.radioTokens);
    const result = applyListening(bio.radioTokens, minutes);
    await bio.save();

    res.json({ ...result, weekResetAt: bio.radioTokens.weeklyResetAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
