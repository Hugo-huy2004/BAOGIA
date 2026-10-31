import express from 'express';
import { resolveUpdate } from '../utils/otaRelease.js';

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
 *
 * The decision itself lives in utils/otaRelease.js so it can be tested without
 * express — CI installs root deps only.
 */
function handleCheck(req, res) {
  res.json(resolveUpdate({
    versionName: req.body?.version_name,
    versionBuild: req.body?.version_build,
  }));
}

// The plugin POSTs; GET is here so a release can be eyeballed from a browser.
router.post('/check', handleCheck);
router.get('/check', handleCheck);

export default router;
