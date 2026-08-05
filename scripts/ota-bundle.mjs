/**
 * Package the native web build as an over-the-air bundle.
 *
 *   npm run ota:bundle
 *
 * Produces `ota/hugo-<version>.zip` (gitignored — a multi-MB zip per release
 * is exactly how this repo got bloated before) and prints the four env vars
 * that publish it.
 *
 * The zip is web assets only. Adding a Capacitor plugin, a permission, an
 * icon, or changing the app name still needs a store release — OTA replaces
 * what the WebView loads, not the binary around it.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = process.argv[2] || pkg.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`✖ Version must be x.y.z (got "${version}").`);
  console.error('  Bump package.json or pass one: npm run ota:bundle -- 2.0.1');
  process.exit(1);
}

const apiUrl = process.env.VITE_API_URL || 'https://api.hugowishpax.studio/api';
if (!/^https?:\/\//i.test(apiUrl)) {
  console.error('✖ VITE_API_URL must be absolute for a native bundle.');
  process.exit(1);
}

console.log(`▸ Building native web assets (VITE_API_URL=${apiUrl}) …`);
execFileSync('npm', ['run', 'build:native'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: apiUrl },
});

const dist = path.join(root, 'dist-native');
if (!statSync(dist).isDirectory()) {
  console.error('✖ dist-native/ missing after build.');
  process.exit(1);
}

// A service worker inside the WebView pins the app to a cached shell, so a
// later OTA never reaches it. build:native already omits the PWA plugin;
// this is the tripwire in case that ever regresses.
try {
  statSync(path.join(dist, 'sw.js'));
  console.error('✖ dist-native/sw.js exists — a service worker in the WebView');
  console.error('  would cache the shell and block every future OTA. Aborting.');
  process.exit(1);
} catch { /* absent, which is correct */ }

mkdirSync(path.join(root, 'ota'), { recursive: true });
const zipPath = path.join(root, 'ota', `hugo-${version}.zip`);

// The plugin unpacks the zip and expects index.html at its root, so zip the
// *contents* of dist-native, not the folder itself.
console.log('▸ Zipping …');
execFileSync('zip', ['-qr', zipPath, '.', '-x', '.DS_Store'], { cwd: dist });

const bytes = readFileSync(zipPath);
const checksum = createHash('sha256').update(bytes).digest('hex');
const mb = (bytes.length / 1024 / 1024).toFixed(2);

console.log(`\n✓ ${path.relative(root, zipPath)}  (${mb} MB)\n`);
console.log('Upload that zip to static hosting (Vercel / Cloudflare R2 — NOT');
console.log('Render, which bills outbound bandwidth per byte), then set these');
console.log('on the Node service and restart it:\n');
console.log(`  OTA_VERSION=${version}`);
console.log(`  OTA_URL=<public URL of hugo-${version}.zip>`);
console.log(`  OTA_CHECKSUM=${checksum}`);
console.log(`  OTA_MIN_NATIVE=${pkg.version}   # oldest store build allowed to load this\n`);
console.log('Verify:  curl -s https://api.hugowishpax.studio/api/ota/check | jq');
console.log('Roll back: set OTA_VERSION to the previous release (or clear it).');
