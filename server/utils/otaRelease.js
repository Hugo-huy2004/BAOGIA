/**
 * Quyết định "máy này có được nhận bundle OTA không" — logic thuần, không
 * express, không mạng.
 *
 * Tách khỏi routes/otaRoutes.js vì CI (.github/workflows/ci.yml) chỉ chạy
 * `npm ci` ở gốc, không cài `server/node_modules`. Test nào import express là
 * gãy ngay trên CI dù chạy ngon dưới máy — Node tìm thấy express nhờ đi ngược
 * lên `server/node_modules` mà chỉ máy dev mới có.
 *
 * Đẩy nhầm một bản là brick máy người dùng, nên phần này phải test được.
 */

/** Bản phát hành hiện tại, đọc từ env — xem otaRoutes.js để biết vì sao. */
export function currentRelease(env = process.env) {
  return {
    version: (env.OTA_VERSION || '').trim(),
    url: (env.OTA_URL || '').trim(),
    checksum: (env.OTA_CHECKSUM || '').trim(),
    minNative: (env.OTA_MIN_NATIVE || '').trim(),
  };
}

/** So sánh semver theo SỐ. So chuỗi thì "2.0.10" < "2.0.9" — lỗi kinh điển. */
export function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

const NOTHING = { message: 'No new version available' };

/**
 * @param {{versionName?: string, versionBuild?: string}} device
 *   `versionName` là bundle web đang chạy ('builtin' nếu vẫn là bản kèm trong
 *   app), `versionBuild` là binary tải từ store.
 * @param {object} [env]
 * @returns {{message: string} | {version: string, url: string, checksum?: string}}
 */
export function resolveUpdate(device = {}, env = process.env) {
  const { version, url, checksum, minNative } = currentRelease(env);

  // Chưa publish, hoặc publish thiếu — thà im lặng còn hơn đưa nửa bản.
  if (!version || !url) return NOTHING;

  const current = String(device.versionName || '').trim();
  const nativeBuild = String(device.versionBuild || '').trim();

  // Không đưa bundle mới cho binary quá cũ: bundle có thể gọi plugin mà binary
  // đó chưa có, và máy sẽ crash ngay khi mở.
  if (minNative && nativeBuild && compareVersions(nativeBuild, minNative) < 0) return NOTHING;

  // 'builtin' không phải số phiên bản — coi như cũ hơn mọi thứ.
  const isBuiltin = !current || current === 'builtin';
  if (!isBuiltin && compareVersions(version, current) <= 0) return NOTHING;

  return { version, url, ...(checksum ? { checksum } : {}) };
}
