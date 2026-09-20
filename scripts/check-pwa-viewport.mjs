// npm run build && node scripts/check-pwa-viewport.mjs
// Check the production bundle and service worker, without backend access.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
    return;
  }
  const file = resolve(dist, '.' + (extname(path) ? path : '/index.html'));
  if (!file.startsWith(dist + '/')) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (url.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 59, bottom: 34, left: 0, right: 0 } });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['today', 'apps', 'utilities/handle']) {
    await page.goto(`${base}/member/${path}?embed=true`);
    const selector = path.startsWith('utilities') ? '.portal-fullscreen-shell' : '.portal-mobile-layout';
    await page.locator(selector).waitFor();
    const box = await page.locator(selector).boundingBox();
    assert.equal(box.y, 0, `${path}: shell starts at top`);
    assert.equal(box.height, 852, `${path}: shell reaches bottom`);
    assert.equal(await page.locator('#root').evaluate(el => getComputedStyle(el).overflow), 'clip');
    if (path === 'today') {
      const nav = await page.locator('.mobile-portal-nav').boundingBox();
      assert.equal(nav.y + nav.height, 852, 'nav reaches screen bottom');
      const padding = await page.locator('.mobile-portal-content').evaluate(el => ({ top: parseFloat(getComputedStyle(el).paddingTop), bottom: parseFloat(getComputedStyle(el).paddingBottom) }));
      assert.equal(padding.top, 71, 'top safe area counted once');
      assert.ok(padding.bottom >= nav.height, 'last content clears floating navigation');
    }
  }
  await page.goto(`${base}/member/today?embed=true`);
  await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready.then(() => true),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Worker did not activate')), 15000)),
  ]));
  await page.reload();
  await page.locator('.portal-mobile-layout').waitFor();
  assert.ok(await page.evaluate(() => navigator.serviceWorker.controller), 'worker controls production reload');
  await page.setViewportSize({ width: 852, height: 393 });
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, bottom: 21, left: 59, right: 59 } });
  await page.waitForFunction(() => document.querySelector('.portal-mobile-layout')?.getBoundingClientRect().height === 393);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForFunction(() => document.querySelector('.portal-mobile-layout')?.getBoundingClientRect().height === 852);
  console.log('OK — production PWA: safe areas, shell/nav geometry, worker reload and rotation.');
  console.log('Chrome checks layout contracts; installed iOS still needs device verification.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
