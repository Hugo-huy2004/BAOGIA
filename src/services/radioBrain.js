// Trí nhớ dùng chung của radio (HugoRadio thường và radio trong chế độ Bảo vệ
// môi trường đều gọi vào đây).
//
// Vấn đề nó giải: địa chỉ luồng phát chết liên tục — str.vov.gov.vn hiện không
// còn phân giải được nữa. Trước đây mỗi phiên đều thử lại đúng địa chỉ chết đó,
// hỏi máy chủ một lượt để dò đường mới, rồi quên sạch khi tải lại trang.
//
// Ở đây mọi thứ được NHỚ trong localStorage: đài nào phát được, đài nào hỏng,
// và địa chỉ mới học được. Lần sau đi thẳng vào đường đang sống, không tốn lượt
// dò. Không có gì gửi lên máy chủ; việc dò đài vẫn đi qua proxy sẵn có
// (`radioBrowserApi.js` → server/routes/radioRoutes.js).

import { fetchStationByName } from "./radioBrowserApi";

const KEY = "hugo.radio.health";
const DAY = 24 * 60 * 60 * 1000;
const DEAD_AFTER_FAILS = 3;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

const write = (value) => {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* đầy quota / duyệt riêng tư */ }
};

/** Sổ theo dõi: { [id]: { ok, fail, lastOkAt, lastFailAt, url, name, found } } */
export const readHealth = () => read();
export const resetHealth = () => write({});

function patch(id, changes) {
  if (!id) return null;
  const all = read();
  all[id] = { ok: 0, fail: 0, ...all[id], ...changes };
  write(all);
  return all[id];
}

/** Đài nghe gần nhất, để lần mở app sau tiếp tục đúng chỗ đó. */
const LAST_KEY = "hugo.radio.last";
export const lastStationId = () => {
  try { return localStorage.getItem(LAST_KEY); } catch { return null; }
};

/** Phát được: nhớ luôn địa chỉ vừa dùng, xoá tiền sử lỗi, và nhớ đây là đài cuối. */
export function recordOk(id, url) {
  const entry = read()[id];
  try { localStorage.setItem(LAST_KEY, id); } catch { /* duyệt riêng tư */ }
  return patch(id, { ok: (entry?.ok || 0) + 1, fail: 0, lastOkAt: Date.now(), ...(url ? { url } : {}) });
}

export function recordFail(id) {
  const entry = read()[id];
  return patch(id, { fail: (entry?.fail || 0) + 1, lastFailAt: Date.now() });
}

/**
 * Coi như hỏng — nhưng chỉ trong một ngày. Đài chết hôm nay có thể sống lại
 * mai, nên không bao giờ gạch tên vĩnh viễn.
 */
export function isDead(id) {
  const entry = read()[id];
  if (!entry) return false;
  return entry.fail >= DEAD_AFTER_FAILS && Date.now() - (entry.lastFailAt || 0) < DAY;
}

export function stationStatus(id) {
  const entry = read()[id];
  if (!entry || (!entry.ok && !entry.fail)) return "unknown";
  if (isDead(id)) return "dead";
  if (entry.ok > 0 && entry.fail === 0) return "good";
  return "shaky";
}

export const learnedUrl = (id) => read()[id]?.url || null;

/** Địa chỉ để thử, theo thứ tự: đã học được → các đường trong mã nguồn. */
export function orderedUrls(id, candidates = []) {
  return [learnedUrl(id), ...candidates]
    .filter(Boolean)
    .filter((url, index, list) => list.indexOf(url) === index);
}

const scoreOf = (id) => {
  const entry = read()[id];
  if (!entry) return 1; // chưa thử bao giờ
  if (isDead(id)) return 0;
  return entry.ok > 0 ? 3 : 1;
};

/**
 * Bốc ngẫu nhiên một đài; đài từng phát được có trọng số gấp ba. `exclude` là
 * những đài vừa thử hỏng trong lượt này.
 */
export function pickRandom(stations, { exclude = [], idOf = (station) => station.id } = {}) {
  const pool = stations.filter((station) => !exclude.includes(idOf(station)));
  if (!pool.length) return null;
  const alive = pool.filter((station) => scoreOf(idOf(station)) > 0);
  // Hỏng hết thì vẫn thử lại từ đầu, còn hơn đứng im.
  const candidates = alive.length ? alive : pool;
  const weights = candidates.map((station) => scoreOf(idOf(station)) || 1);
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < candidates.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return candidates[index];
  }
  return candidates[candidates.length - 1];
}

/* ── Đài người dùng tự tìm ───────────────────────────────────────────────── */

export function rememberFound({ id, name, url }) {
  patch(id, { name, url, found: true });
}

export function forgetFound(id) {
  const all = read();
  delete all[id];
  write(all);
}

export function foundStations() {
  return Object.entries(read())
    .filter(([, entry]) => entry.found)
    .map(([id, entry]) => ({ id, name: entry.name || id, url: entry.url }));
}

/**
 * Hỏi máy chủ địa chỉ đang sống của một đài. Server dò trong danh bạ Radio
 * Browser VÀ kiểm tra luồng trước khi trả về, nên kết quả đã lọc đài chết.
 */
export async function resolveByName(name, excludeUrl, strict = true) {
  const data = await fetchStationByName(name, excludeUrl, strict);
  const url = data?.url_resolved || data?.url;
  if (!url) return null;
  return {
    id: data.stationuuid || `found-${name.trim().toLowerCase().replace(/\s+/g, "-")}`,
    name: data.name?.trim() || name,
    url,
  };
}
