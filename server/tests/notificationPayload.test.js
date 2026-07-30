import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import InAppNotification from '../models/InAppNotification.js';
import JoyLedger from '../models/JoyLedger.js';
import { JOY_TITLES, joyTitleFor } from '../utils/joyService.js';

/**
 * ponytail: source grep, không có HTTP harness trong repo này.
 *
 * Hai lỗi thật đã lọt qua review và test này chặn chúng tái diễn:
 *
 *  1. `type: 'inbox'` — không có trong enum của schema, nên Mongoose từ chối và
 *     thông báo KHÔNG BAO GIỜ được lưu. Vì mọi chỗ gọi đều bọc try/catch chỉ
 *     console.warn, không ai biết. (bioRoutes + smartNotificationService)
 *
 *  2. `actionUrl: '/member/portal?tab=...'` — `/member/portal` không khớp
 *     branch nào trong MemberPortalPage, bấm vào thông báo ra trang trắng.
 *     Route thật là `/member/:tab[/:subTab]`.
 */

const ROOTS = ['routes', 'utils', 'services'];
const SERVER_DIR = new URL('..', import.meta.url).pathname;

const TYPES = InAppNotification.schema.path('type').enumValues;
const CATEGORIES = InAppNotification.schema.path('category').enumValues;
const LEDGER_SOURCES = JoyLedger.schema.path('source').enumValues;

function sourceFiles() {
  const out = [];
  for (const root of ROOTS) {
    const dir = join(SERVER_DIR, root);
    let names = [];
    try { names = readdirSync(dir); } catch { continue; }
    for (const name of names) {
      const path = join(dir, name);
      if (name.endsWith('.js') && statSync(path).isFile()) {
        out.push({ path: `${root}/${name}`, src: readFileSync(path, 'utf8') });
      }
    }
  }
  return out;
}

/** Bỏ comment trước khi quét, nếu không chính comment giải thích bug lại bị
 *  tính là bug. */
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const FILES = sourceFiles().map(f => ({ ...f, src: stripComments(f.src) }));

/**
 * Chỉ lấy object truyền vào `InAppNotification.create({...})`.
 * Quét cả file là sai: `type: 'profile_updated'` trong bioRoutes là mốc
 * Bio.history, chẳng liên quan gì tới enum của thông báo.
 */
function payloads(src) {
  return [...src.matchAll(/InAppNotification\.(?:create|insertMany)\(\s*\{([\s\S]*?)\n\s*\}\s*\)/g)]
    .map(m => m[1]);
}

const literals = (block, field) =>
  [...block.matchAll(new RegExp(`\\b${field}:\\s*'([^']+)'`, 'g'))].map(m => m[1]);

describe('payload thông báo', () => {
  it('tìm thấy source và ít nhất một chỗ tạo thông báo', () => {
    expect(FILES.length).toBeGreaterThan(10);
    expect(FILES.flatMap(f => payloads(f.src)).length).toBeGreaterThan(5);
  });

  it('không có `type` nào ngoài enum của schema', () => {
    for (const { path, src } of FILES) {
      for (const block of payloads(src)) {
        for (const value of literals(block, 'type')) {
          expect(TYPES, `${path}: type: '${value}'`).toContain(value);
        }
      }
    }
  });

  it('không có `category` nào ngoài enum của schema', () => {
    for (const { path, src } of FILES) {
      for (const block of payloads(src)) {
        for (const value of literals(block, 'category')) {
          expect(CATEGORIES, `${path}: category: '${value}'`).toContain(value);
        }
      }
    }
  });

  it('không còn đường dẫn /member/portal — route đó không tồn tại', () => {
    for (const { path, src } of FILES) {
      const hits = [...src.matchAll(/(?:actionUrl|url):\s*[^,\n]*'(\/member\/portal[^']*)'/g)].map(m => m[1]);
      expect(hits, `${path} còn trỏ tới route không tồn tại`).toEqual([]);
    }
  });

  it('mọi actionUrl đều là đường dẫn tuyệt đối trong app', () => {
    for (const { path, src } of FILES) {
      const urls = [...src.matchAll(/actionUrl:\s*'([^']*)'/g)].map(m => m[1]);
      for (const url of urls) {
        expect(url.startsWith('/'), `${path}: actionUrl '${url}' phải bắt đầu bằng /`).toBe(true);
      }
    }
  });
});

describe('schema thông báo', () => {
  it('có field số liệu để client khỏi phải regex bóc từ câu', () => {
    for (const field of ['amount', 'balanceAfter', 'refCode', 'counterparty']) {
      expect(InAppNotification.schema.path(field), `thiếu field ${field}`).toBeTruthy();
    }
  });

  it('amount nhận số âm — dấu chính là hướng dòng tiền', () => {
    const doc = new InAppNotification({ email: 'a@b.c', title: 'x', amount: -165 });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.amount).toBe(-165);
  });

  it('type ngoài enum bị từ chối (đây là lỗi đã từng lọt)', () => {
    const doc = new InAppNotification({ email: 'a@b.c', title: 'x', type: 'inbox' });
    expect(doc.validateSync()?.errors?.type).toBeTruthy();
  });
});

describe('tiêu đề thông báo JOY', () => {
  it('mọi source dùng trong code đều có tiêu đề riêng', () => {
    // Quét source literal nằm ở đối số thứ 3 của awardJoy(email, amount, source, …).
    const used = new Set();
    for (const { src } of FILES) {
      for (const m of src.matchAll(/awardJoy\(\s*[^,]+,\s*[^,]+,\s*'([a-z_]+)'/g)) {
        used.add(m[1]);
      }
    }
    expect(used.size).toBeGreaterThan(5);
    for (const source of used) {
      expect(JOY_TITLES, `source '${source}' chưa có tiêu đề riêng`).toHaveProperty(source);
      expect(
        LEDGER_SOURCES,
        `source '${source}' chưa có trong enum JoyLedger`,
      ).toContain(source);
    }
  });

  it('source lạ vẫn nói được tiền vào hay tiền ra, không rơi về một chữ chung', () => {
    expect(joyTitleFor('khong_ton_tai', 100)).toBe('Nhận JOY');
    expect(joyTitleFor('khong_ton_tai', -100)).toBe('Dùng JOY');
    expect(joyTitleFor('khong_ton_tai', 100)).not.toBe(joyTitleFor('khong_ton_tai', -100));
  });

  it('source đã biết thì dùng đúng tiêu đề của nó', () => {
    expect(joyTitleFor('checkin', 5)).toBe(JOY_TITLES.checkin);
    expect(joyTitleFor('app_plan', -1386)).toBe(JOY_TITLES.app_plan);
  });
});
