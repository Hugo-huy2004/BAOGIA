import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import otaRoutes from '../routes/otaRoutes.js';

// Bản OTA đẩy nhầm là brick máy người dùng — nên các nhánh quyết định
// "có gửi bundle này xuống máy không" phải được canh bằng test.
let server;
let base;

const listen = async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ota', otaRoutes);
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api/ota/check`;
};

const check = async (body) => {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

beforeEach(async () => {
  process.env.OTA_VERSION = '2.0.1';
  process.env.OTA_URL = 'https://cdn.example/hugo-2.0.1.zip';
  process.env.OTA_CHECKSUM = 'abc123';
  process.env.OTA_MIN_NATIVE = '2.0.0';
  await listen();
});

afterEach(() => {
  server?.close();
  for (const k of ['OTA_VERSION', 'OTA_URL', 'OTA_CHECKSUM', 'OTA_MIN_NATIVE']) delete process.env[k];
});

describe('điều phối bản cập nhật OTA', () => {
  it('gửi bundle cho máy vừa cài từ store (bundle "builtin")', async () => {
    const r = await check({ version_name: 'builtin', version_build: '2.0.0' });
    expect(r.version).toBe('2.0.1');
    expect(r.url).toBe('https://cdn.example/hugo-2.0.1.zip');
    expect(r.checksum).toBe('abc123');
  });

  it('gửi bundle cho máy đang ở bản web cũ hơn', async () => {
    const r = await check({ version_name: '2.0.0', version_build: '2.0.0' });
    expect(r.version).toBe('2.0.1');
  });

  it('không gửi lại khi máy đã ở đúng bản đó', async () => {
    const r = await check({ version_name: '2.0.1', version_build: '2.0.0' });
    expect(r.version).toBeUndefined();
    expect(r.message).toBe('No new version available');
  });

  it('không hạ cấp máy đang ở bản mới hơn', async () => {
    const r = await check({ version_name: '2.1.0', version_build: '2.0.0' });
    expect(r.version).toBeUndefined();
  });

  it('chặn máy có binary cũ hơn OTA_MIN_NATIVE', async () => {
    // Bundle mới có thể gọi plugin mà binary cũ chưa có → gửi xuống là crash.
    const r = await check({ version_name: 'builtin', version_build: '1.9.0' });
    expect(r.version).toBeUndefined();
    expect(r.message).toBe('No new version available');
  });

  it('so sánh phiên bản theo số, không theo chuỗi', async () => {
    // "2.0.10" < "2.0.9" nếu so chuỗi — đây là lỗi kinh điển.
    process.env.OTA_VERSION = '2.0.10';
    const r = await check({ version_name: '2.0.9', version_build: '2.0.0' });
    expect(r.version).toBe('2.0.10');
  });

  it('im lặng khi chưa publish (OTA_VERSION rỗng)', async () => {
    process.env.OTA_VERSION = '';
    const r = await check({ version_name: 'builtin', version_build: '2.0.0' });
    expect(r.message).toBe('No new version available');
  });

  it('im lặng khi publish thiếu URL, không gửi nửa bản', async () => {
    process.env.OTA_URL = '';
    const r = await check({ version_name: 'builtin', version_build: '2.0.0' });
    expect(r.version).toBeUndefined();
  });
});
