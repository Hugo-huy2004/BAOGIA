/**
 * Toạ độ → địa chỉ hành chính, để đối chiếu điểm ghim với địa chỉ thành viên khai.
 *
 * Dùng Nominatim của OpenStreetMap: miễn phí, không cần khoá, không thẻ — đúng
 * docs/chi-phi-0d.md. Chính sách sử dụng của họ: tối đa 1 request/giây, có
 * User-Agent nhận diện, có cache. Onboarding ít lượt nên dư sức; vẫn giữ:
 *   - hàng đợi 1,1 giây giữa hai lần gọi (cho cả tiến trình),
 *   - cache RAM theo toạ độ làm tròn ~1 m,
 *   - hết giờ / lỗi → trả null, nơi gọi coi là "chưa đối chiếu được" chứ không
 *     chặn người dùng (hết hạn mức thì rơi về phương án khác, không tính tiền).
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'HugoStudio/1.0 (+https://www.hugowishpax.studio; nonprofit member address check)';
const MIN_GAP_MS = 1100;
const TIMEOUT_MS = 5000;
const CACHE_MAX = 500;
const CACHE_MS = 24 * 60 * 60 * 1000;

const cache = new Map();
let queue = Promise.resolve();
let lastCallAt = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Bỏ dấu, bỏ tiền tố hành chính để so "TP. Hồ Chí Minh" với "Thành phố Hồ Chí Minh". */
export function normalizePlace(value) {
  return String(value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\b(thanh pho|tp\.?|tinh|province|city|quan|huyen|thi xa|thi tran|phuong|xa|district|ward|commune|state)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const samePlace = (a, b) => {
  const x = normalizePlace(a);
  const y = normalizePlace(b);
  return Boolean(x && y && (x === y || x.includes(y) || y.includes(x)));
};

async function callNominatim(lat, lon) {
  const gap = lastCallAt + MIN_GAP_MS - Date.now();
  if (gap > 0) await wait(gap);
  lastCallAt = Date.now();
  const url = `${ENDPOINT}?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'vi,en' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const a = data?.address || {};
    if (!a.country_code) return null;
    return {
      countryCode: String(a.country_code).toUpperCase(),
      // Tên đơn vị cấp tỉnh/bang và cấp xã/phường theo OSM — mỗi nước đặt ở khoá khác nhau.
      adminArea: a.state || a.province || a.city || a.region || '',
      locality: a.quarter || a.suburb || a.village || a.town || a.city_district || a.municipality || '',
      label: String(data.display_name || '').slice(0, 300),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Địa chỉ OSM của một toạ độ, hoặc null khi không tra được (mạng, quá hạn mức). */
export function reverseGeocode(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Promise.resolve(null);
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return Promise.resolve(hit.value);

  const job = queue.then(() => callNominatim(lat.toFixed(6), lon.toFixed(6)));
  queue = job.catch(() => null);
  return job.then((value) => {
    if (value) {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(key, { value, until: Date.now() + CACHE_MS });
    }
    return value;
  });
}

/**
 * So điểm ghim với địa chỉ đã khai.
 *   status 'match'      : cùng quốc gia và cùng tỉnh/thành
 *   status 'area'       : cùng quốc gia nhưng tên tỉnh khác (có thể do OSM còn
 *                         tên cũ sau sáp nhập tỉnh 2025) → cho qua, đánh dấu admin xem
 *   status 'country'    : khác quốc gia → chặn
 *   status 'unchecked'  : không tra được bản đồ → cho qua, đánh dấu
 */
export async function checkPinAgainstAddress({ latitude, longitude, countryCode, adminArea }) {
  const place = await reverseGeocode(latitude, longitude);
  if (!place) return { status: 'unchecked', place: null };
  if (countryCode && place.countryCode !== String(countryCode).toUpperCase()) return { status: 'country', place };
  if (adminArea && place.adminArea && !samePlace(adminArea, place.adminArea)) return { status: 'area', place };
  return { status: 'match', place };
}

/** Độ chính xác GPS tối đa (mét) chấp nhận cho điểm ghim xác minh. */
export const MAX_PIN_ACCURACY_M = 100;
