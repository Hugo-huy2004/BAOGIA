import express from 'express';
import Bio from '../models/Bio.js';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  WEEKLY_FREE_MINUTES, MINUTES_PER_TOKEN, toTokens,
  applyListening, ensureWeeklyReset, nextResetAt, isPeakHour, PEAK_MULTIPLIER,
} from '../utils/radioTokens.js';

const router = express.Router();
// `all.` là bản ghi round-robin chính chủ của Radio Browser. Điều khoản dùng của
// họ yêu cầu KHÔNG ghim cứng một máy chủ đơn lẻ (bản cũ ghim `de1.`) và phải gửi
// User-Agent nhận dạng được — cả hai đều là điều kiện để được phép dùng API.
const RADIO_API_BASE = 'https://all.api.radio-browser.info/json';
const RADIO_UA = 'HugoStudio-Radio/2.0 (+https://hugowishpax.studio)';

// Ceiling for a single heartbeat. The client reports elapsed wall-clock time, so
// a tab the OS suspended for hours would otherwise report the whole gap at once.
const MAX_HEARTBEAT_MINUTES = 30;

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

// ── HugoRadio Token System ──────────────────────────────────────────────────

// Danh tính LUÔN đến từ token đăng nhập. Trước đây heartbeat đọc email từ thân
// request, nên bất kỳ thành viên nào cũng gọi được để đốt token của người khác.
async function findMemberBio(email, projection) {
  const query = projection ? (q) => Bio.findOne(q).select(projection) : (q) => Bio.findOne(q);
  return (await query({ email })) || (await query({ contactEmail: email }));
}

function blankTokens() {
  return {
    weeklyFreeMinutes: WEEKLY_FREE_MINUTES,
    weeklyUsedMinutes: 0,
    weeklyResetAt: new Date(),
    purchasedMinutes: 0,
  };
}

/** Một hình dạng trả về duy nhất cho cả /token-status lẫn /heartbeat. */
function tokenPayload(radioTokens) {
  const freeRemaining = Math.max(0, radioTokens.weeklyFreeMinutes - radioTokens.weeklyUsedMinutes);
  const purchasedRemaining = Math.max(0, radioTokens.purchasedMinutes);
  const totalRemaining = freeRemaining + purchasedRemaining;
  const peak = isPeakHour();

  return {
    // Đơn vị hiển thị: token.
    minutesPerToken: MINUTES_PER_TOKEN,
    freeTokens: toTokens(radioTokens.weeklyFreeMinutes),
    freeTokensLeft: toTokens(freeRemaining),
    purchasedTokens: toTokens(purchasedRemaining),
    tokensLeft: toTokens(totalRemaining),
    // Số phút lẻ của token đang dùng dở (0–9) — giao diện vẽ thành vạch tiến trình.
    partialMinutes: Math.round((totalRemaining % MINUTES_PER_TOKEN) * 100) / 100,

    // Đơn vị lưu trữ: phút. Giữ lại để không phá vỡ nơi nào còn đọc.
    freeMinutes: radioTokens.weeklyFreeMinutes,
    freeUsed: radioTokens.weeklyUsedMinutes,
    freeRemaining,
    purchasedMinutes: purchasedRemaining,
    totalRemaining,

    canListen: totalRemaining > 0,
    peak,
    multiplier: peak ? PEAK_MULTIPLIER : 1,
    weekResetAt: radioTokens.weeklyResetAt,
    nextResetAt: nextResetAt(radioTokens),
  };
}

// GET /api/radio/token-status — số token còn lại của chính người đang đăng nhập.
router.get('/token-status', requireMember, async (req, res) => {
  try {
    const bio = await findMemberBio(req.memberEmail, 'radioTokens');
    if (!bio) return res.status(404).json({ error: 'User not found' });

    let dirty = false;
    if (!bio.radioTokens) {
      bio.radioTokens = blankTokens();
      dirty = true;
    }
    // Chỉ ghi khi tuần thật sự lật sang mốc mới: endpoint này bị hỏi mỗi lần mở
    // app, save() vô điều kiện là một lượt ghi database cho mỗi lượt xem.
    if (ensureWeeklyReset(bio.radioTokens)) dirty = true;
    if (dirty) await bio.save();

    res.json(tokenPayload(bio.radioTokens));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/radio/heartbeat { listeningMinutes }
// Called periodically by the client while radio is playing. Deducts from the
// free pool first, then the purchased pool.
router.post('/heartbeat', requireMember, async (req, res) => {
  try {
    // Con số duy nhất client được phép gửi, và nó vẫn bị kẹp hai đầu: một tab bị
    // hệ điều hành treo có thể tỉnh dậy sau nhiều giờ rồi báo cả khoảng trống đó.
    // Giá trị rác trước đây rơi về 5 phút — tính tiền cho một thứ không đo được.
    const asked = Number(req.body?.listeningMinutes);
    const minutes = Number.isFinite(asked) ? Math.min(Math.max(asked, 0), MAX_HEARTBEAT_MINUTES) : 0;

    const bio = await findMemberBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'User not found' });

    if (!bio.radioTokens) bio.radioTokens = blankTokens();
    ensureWeeklyReset(bio.radioTokens);
    applyListening(bio.radioTokens, minutes, isPeakHour() ? PEAK_MULTIPLIER : 1);
    await bio.save();

    res.json(tokenPayload(bio.radioTokens));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
