import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveUpdate, compareVersions } from '../utils/otaRelease.js';

// Import logic thuần, KHÔNG import route: CI chỉ chạy `npm ci` ở gốc nên
// `server/node_modules` không tồn tại, và bất kỳ test nào chạm express đều
// gãy trên CI dù chạy ngon dưới máy dev.
//
// Đẩy nhầm một bản OTA là brick máy người dùng, nên mọi nhánh quyết định
// "có gửi bundle này xuống không" đều phải có test.

const env = {};

beforeEach(() => {
  Object.assign(env, {
    OTA_VERSION: '2.0.1',
    OTA_URL: 'https://cdn.example/hugo-2.0.1.zip',
    OTA_CHECKSUM: 'abc123',
    OTA_MIN_NATIVE: '2.0.0',
  });
});

afterEach(() => {
  for (const k of Object.keys(env)) delete env[k];
});

const check = (device) => resolveUpdate(device, env);

describe('điều phối bản cập nhật OTA', () => {
  it('gửi bundle cho máy vừa cài từ store (bundle "builtin")', () => {
    const r = check({ versionName: 'builtin', versionBuild: '2.0.0' });
    expect(r.version).toBe('2.0.1');
    expect(r.url).toBe('https://cdn.example/hugo-2.0.1.zip');
    expect(r.checksum).toBe('abc123');
  });

  it('gửi bundle cho máy đang ở bản web cũ hơn', () => {
    expect(check({ versionName: '2.0.0', versionBuild: '2.0.0' }).version).toBe('2.0.1');
  });

  it('không gửi lại khi máy đã ở đúng bản đó', () => {
    const r = check({ versionName: '2.0.1', versionBuild: '2.0.0' });
    expect(r.version).toBeUndefined();
    expect(r.message).toBe('No new version available');
  });

  it('không hạ cấp máy đang ở bản mới hơn', () => {
    expect(check({ versionName: '2.1.0', versionBuild: '2.0.0' }).version).toBeUndefined();
  });

  it('chặn máy có binary cũ hơn OTA_MIN_NATIVE', () => {
    // Bundle mới có thể gọi plugin mà binary cũ chưa có → gửi xuống là crash.
    const r = check({ versionName: 'builtin', versionBuild: '1.9.0' });
    expect(r.version).toBeUndefined();
    expect(r.message).toBe('No new version available');
  });

  it('im lặng khi chưa publish (OTA_VERSION rỗng)', () => {
    env.OTA_VERSION = '';
    expect(check({ versionName: 'builtin', versionBuild: '2.0.0' }).message)
      .toBe('No new version available');
  });

  it('im lặng khi publish thiếu URL, không gửi nửa bản', () => {
    env.OTA_URL = '';
    expect(check({ versionName: 'builtin', versionBuild: '2.0.0' }).version).toBeUndefined();
  });

  it('bỏ checksum khỏi phản hồi khi không cấu hình', () => {
    env.OTA_CHECKSUM = '';
    const r = check({ versionName: 'builtin', versionBuild: '2.0.0' });
    expect(r.version).toBe('2.0.1');
    expect('checksum' in r).toBe(false);
  });
});

describe('so sánh phiên bản', () => {
  it('so theo số chứ không theo chuỗi', () => {
    // "2.0.10" < "2.0.9" nếu so chuỗi — đây là lỗi kinh điển.
    expect(compareVersions('2.0.10', '2.0.9')).toBeGreaterThan(0);
    expect(compareVersions('2.0.9', '2.0.10')).toBeLessThan(0);
    expect(compareVersions('2.0.1', '2.0.1')).toBe(0);
  });

  it('chịu được phiên bản thiếu thành phần', () => {
    expect(compareVersions('2.1', '2.0.9')).toBeGreaterThan(0);
    expect(compareVersions('2', '2.0.0')).toBe(0);
  });
});
