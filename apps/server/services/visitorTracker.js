/**
 * Khách truy cập thật, theo IP — cho bản đồ ở Trung Tâm Điều Khiển.
 *
 * Trình duyệt báo mỗi lần đổi trang (POST /api/ops/visit); heartbeat của thành
 * viên gắn email vào IP đó. Vị trí tra một lần mỗi IP qua ip-api.com (free,
 * không key, 45 lượt/phút — giữ dưới 40) rồi nhớ trong RAM.
 * ponytail: RAM của một tiến trình (Render free); khởi động lại là mất lịch sử
 * 24h. Cần thống kê dài hạn thì ghi gộp theo ngày vào Mongo.
 */
const WINDOW_MS = 24 * 60 * 60 * 1000;
const ONLINE_MS = 2 * 60 * 1000;
const MAX_VISITORS = 3000;
const MAX_GEO = 5000;
const GEO_PER_MIN = 40;

const visitors = new Map(); // ip -> visitor
const geoCache = new Map(); // ip -> geo | null
let geoBudget = { minute: 0, used: 0 };

const cleanIp = (ip) => String(ip || '').replace(/^::ffff:/, '');
const isPrivate = (ip) => !ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/.test(ip);

function deviceOf(ua = '') {
  if (/bot|crawl|spider|slurp|headless|lighthouse/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function browserOf(ua = '') {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/crios|chrome\//i.test(ua)) return 'Chrome';
  if (/fxios|firefox\//i.test(ua)) return 'Firefox';
  if (/safari\//i.test(ua)) return 'Safari';
  return 'Khác';
}

async function lookupGeo(ip) {
  if (geoCache.has(ip) || isPrivate(ip)) return;
  const minute = Math.floor(Date.now() / 60000);
  if (geoBudget.minute !== minute) geoBudget = { minute, used: 0 };
  if (geoBudget.used >= GEO_PER_MIN) return; // lượt sau sẽ tra
  geoBudget.used += 1;
  geoCache.set(ip, null);
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,mobile,proxy,hosting`, { signal: AbortSignal.timeout(2000) });
    const d = await r.json();
    if (d.status === 'success') {
      geoCache.set(ip, {
        lat: d.lat, lon: d.lon, city: d.city, region: d.regionName, country: d.country, countryCode: d.countryCode,
        isp: d.org || d.isp, mobile: d.mobile, proxy: d.proxy, hosting: d.hosting,
      });
    }
  } catch {
    geoCache.delete(ip); // thử lại lần sau
  }
  if (geoCache.size > MAX_GEO) geoCache.delete(geoCache.keys().next().value);
}

function prune() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, v] of visitors) if (v.lastSeen < cutoff) visitors.delete(ip);
  while (visitors.size > MAX_VISITORS) visitors.delete(visitors.keys().next().value);
}
setInterval(prune, 10 * 60 * 1000).unref();

/** Một lượt xem trang. */
export function recordVisit(req, page = '') {
  const ip = cleanIp(req.ip);
  if (!ip) return;
  const ua = String(req.headers['user-agent'] || '').slice(0, 300);
  const now = Date.now();
  const v = visitors.get(ip) || { ip, firstSeen: now, views: 0, pages: [] };
  visitors.delete(ip); // đưa xuống cuối = mới nhất, để cắt từ đầu khi đầy
  v.lastSeen = now;
  v.views += 1;
  v.page = String(page).slice(0, 160);
  v.pages = [v.page, ...v.pages.filter((p) => p !== v.page)].slice(0, 8);
  v.ua = ua;
  v.device = deviceOf(ua);
  v.browser = browserOf(ua);
  v.referrer = String(req.headers.referer || '').slice(0, 160) || v.referrer;
  visitors.set(ip, v);
  lookupGeo(ip);
}

/** Gắn thành viên vào IP (từ heartbeat đã xác thực). */
export function tagMember(req, email) {
  const v = visitors.get(cleanIp(req.ip));
  if (v) { v.email = email; v.lastSeen = Date.now(); }
}

/** Ảnh chụp cho admin: danh sách + gộp theo nước + trang hay xem. */
export function visitorSnapshot() {
  prune();
  const now = Date.now();
  const list = [...visitors.values()].reverse().map((v) => ({
    ...v,
    geo: geoCache.get(v.ip) || null,
    online: now - v.lastSeen < ONLINE_MS,
  }));
  const countries = {};
  const pages = {};
  for (const v of list) {
    const key = v.geo?.country || 'Chưa rõ';
    countries[key] = (countries[key] || 0) + 1;
    for (const p of v.pages) pages[p] = (pages[p] || 0) + 1;
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
  return {
    online: list.filter((v) => v.online).length,
    total: list.length,
    members: list.filter((v) => v.email).length,
    bots: list.filter((v) => v.device === 'bot' || v.geo?.hosting).length,
    countries: top(countries, 12),
    pages: top(pages, 10),
    visitors: list.slice(0, 500),
  };
}
