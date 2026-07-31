// Kiểm tra chốt chặn Cache-Control trong server.js: Cloudflare có Cache Rule cho
// /api/*, nên một route trả dữ liệu member mà quên đặt header là lỗi rò rỉ dữ
// liệu giữa các user. Chạy: node server/scripts/check-cache-headers.mjs
import assert from 'node:assert/strict';
import express from 'express';

const app = express();

// Cùng middleware với server/server.js — sửa một bên thì sửa cả hai.
app.use((req, res, next) => {
  const writeHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'private, no-store');
    return writeHead.apply(this, args);
  };
  next();
});

app.get('/private', (_req, res) => res.json({ email: 'ai-do@example.com' }));
app.get('/public', (_req, res) => {
  res.set('Cache-Control', 'public, s-maxage=60').json({ ok: true });
});
app.get('/boom', () => { throw new Error('lỗi route'); });
// Giống global error handler trong server.js
app.use((_err, _req, res, _next) => res.status(500).json({ error: 'lỗi máy chủ' }));

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const get = async (p) => (await fetch(`${base}${p}`)).headers.get('cache-control');

assert.equal(await get('/private'), 'private, no-store', 'route quên đặt header phải bị chặn cache');
assert.equal(await get('/public'), 'public, s-maxage=60', 'route cố ý cho cache phải giữ nguyên');
assert.equal(await get('/boom'), 'private, no-store', 'response lỗi cũng không được cache');

server.close();
console.log('OK — chốt chặn Cache-Control hoạt động đúng.');
