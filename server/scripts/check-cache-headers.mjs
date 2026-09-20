// Run: node server/scripts/check-cache-headers.mjs
import assert from 'node:assert/strict';
import express from 'express';
import { cachePolicy } from '../middleware/cachePolicy.js';

const app = express();
app.use(cachePolicy);
app.get('/private', (_req, res) => res.json({ email: 'member@example.com' }));
app.get('/api/private.js', (_req, res) => res.json({ email: 'member@example.com' }));
app.all('/public', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60').json({ ok: true });
});
app.get('/cookie', (_req, res) => {
  res.cookie('member_jwt', 'example');
  res.set('Cache-Control', 'public, s-maxage=60').json({ ok: true });
});
app.get('/direct', (_req, res) => {
  res.writeHead(503, 'Unavailable', { 'Cache-Control': 'public, s-maxage=60' });
  res.end('unavailable');
});
app.get('/boom', (_req, res) => {
  res.set('Cache-Control', 'public, s-maxage=60');
  throw new Error('route failure');
});
app.use((_err, _req, res, _next) => res.status(500).json({ error: 'server error' }));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [path, options] of [
    ['/private'], ['/api/private.js'], ['/missing.png'], ['/cookie'], ['/boom'], ['/direct'],
    ['/public', { method: 'POST' }],
    ['/public', { headers: { Authorization: 'Bearer example' } }],
    ['/public', { headers: { Cookie: 'member_jwt=example' } }],
  ]) {
    const res = await fetch(base + path, options);
    assert.equal(res.headers.get('cache-control'), 'private, no-store', path);
    for (const header of ['CDN-Cache-Control', 'Vercel-CDN-Cache-Control', 'Cloudflare-CDN-Cache-Control']) {
      assert.equal(res.headers.get(header), 'no-store', `${path}: ${header}`);
    }
  }
  for (const method of ['GET', 'HEAD']) {
    const res = await fetch(base + '/public', { method });
    assert.equal(res.headers.get('cache-control'), 'public, max-age=0, s-maxage=60');
  }
  console.log('OK — public CDN cache; private, cookies, writes, errors and suffixes stay no-store.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
