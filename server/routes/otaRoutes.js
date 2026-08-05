import express from 'express';

const router = express.Router();

/**
 * Over-the-air update manifest for the store builds.
 *
 * @capgo/capacitor-updater POSTs here on launch with the bundle it is running
 * and the native binary it is running inside; we answer with the newest web
 * bundle that binary is allowed to load, or nothing.
 *
 * A release is four environment variables, not a deploy and not a database
 * table: flipping OTA_VERSION on Render publishes, clearing it un-publishes,
 * and setting it back to the previous value is the rollback. Nothing here
 * needs to remember history, so nothing here does.
 *
 * The bundle zip itself must NOT be served from this process — Render bills
 * outbound bandwidth by the byte and a web bundle is megabytes per device.
 * OTA_URL points at static hosting (Vercel/R2); only this few-hundred-byte
 * JSON comes from Node.
 *
 * What OTA can and cannot replace is a hard native boundary, not a policy
 * choice: the zip is web assets only. New Capacitor plugins, permissions,
 * icons, or app name still require a store release, and shipping a bundle
 * that calls a plugin the installed binary lacks will throw on the device.
 * That is what OTA_MIN_NATIVE guards.
 */

const release = () => ({
  version: (process.env.OTA_VERSION || '').trim(),
  url: (process.env.OTA_URL || '').trim(),
  checksum: (process.env.OTA_CHECKSUM || '').trim(),
  minNative: (process.env.OTA_MIN_NATIVE || '').trim(),
});

/** Numeric semver compare; returns >0 when a is newer than b. */
function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function handleCheck(req, res) {
  const { version, url, checksum, minNative } = release();

  // Nothing published, or published incompletely — say so rather than handing
  // the device half a release it would fail to download.
  if (!version || !url) {
    return res.json({ message: 'No new version available' });
  }

  // `version_name` is the web bundle currently running; `version_build` is the
  // native binary from the store. The plugin sends "builtin" for a device
  // still on the bundle that shipped inside the app.
  const current = String(req.body?.version_name || '').trim();
  const nativeBuild = String(req.body?.version_build || '').trim();

  // Never hand a bundle to a binary too old to run it.
  if (minNative && nativeBuild && compareVersions(nativeBuild, minNative) < 0) {
    return res.json({ message: 'No new version available' });
  }

  // "builtin" is not a version number — treat it as "older than anything".
  const isBuiltin = !current || current === 'builtin';
  if (!isBuiltin && compareVersions(version, current) <= 0) {
    return res.json({ message: 'No new version available' });
  }

  return res.json({ version, url, ...(checksum ? { checksum } : {}) });
}

// The plugin POSTs; GET is here so a release can be eyeballed from a browser.
router.post('/check', handleCheck);
router.get('/check', handleCheck);

export default router;
