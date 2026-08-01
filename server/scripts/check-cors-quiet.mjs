// Origin lạ phải bị từ chối LẶNG LẼ: không ném Error, không ghi ErrorLog, không
// trả 500. Trước đây mỗi lượt bot quét đẻ ra một bản ghi trong MongoDB — 23/23
// dòng error log đầu tiên đều là "Blocked by CORS", nhấn chìm lỗi thật.
// Chạy: node server/scripts/check-cors-quiet.mjs
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';

const allowed = ['https://www.hugowishpax.studio'];
const app = express();
let loggedErrors = 0;

const corsRejected = new Set();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowed.includes(origin)) return callback(null, true);
    if (!corsRejected.has(origin)) corsRejected.add(origin);
    return callback(null, false);
  },
  credentials: true,
}));

app.get('/ping', (_req, res) => res.json({ ok: true }));
// Đứng thay cho logError() trong server.js — đếm xem có gì rơi vào đây không.
app.use((_err, _req, res, _next) => { loggedErrors += 1; res.status(500).json({ error: 'x' }); });

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/ping`;
const get = (origin) => fetch(base, origin ? { headers: { Origin: origin } } : undefined);

const ok = await get('https://www.hugowishpax.studio');
assert.equal(ok.status, 200);
assert.equal(ok.headers.get('access-control-allow-origin'), 'https://www.hugowishpax.studio',
  'origin hợp lệ phải được cấp header CORS');

const bad = await get('https://ke-la-mat.example');
assert.equal(bad.status, 200, 'origin lạ KHÔNG được trả 500 — trình duyệt tự chặn phía client');
assert.equal(bad.headers.get('access-control-allow-origin'), null,
  'origin lạ không được cấp header CORS');

// Cùng một origin lạ gọi nhiều lần vẫn chỉ ghi nhớ một lần → log không phình.
await get('https://ke-la-mat.example');
await get('https://ke-la-mat.example');
assert.equal(corsRejected.size, 1, 'mỗi origin lạ chỉ log một lần');

assert.equal(loggedErrors, 0, 'không có gì được rơi vào error handler → không ghi ErrorLog');

server.close();
console.log('OK — origin lạ bị từ chối lặng lẽ, không sinh ErrorLog.');
