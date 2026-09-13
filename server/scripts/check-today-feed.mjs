/**
 * Kiểm tra chống "giẫm đạp" (stampede) của feed TODAY.
 *
 * Lúc cache một ấn bản hết hạn, N request đến cùng lúc TỪNG dựng lại N lần —
 * mỗi lần là một lượt fan-out ra toàn bộ provider (~5 giây trên Render free),
 * nên event loop nghẽn và mọi API khác xếp hàng chờ theo. Bài kiểm tra này
 * fail nếu khoá in-flight bị gỡ.
 *
 * Chạy: node server/scripts/check-today-feed.mjs
 */
import assert from 'node:assert/strict';
import { studentNewsService as svc } from '../services/studentNewsService.js';

let builds = 0;
// URL phải thuộc một toà soạn của ấn bản VN, nếu không articleBelongsToEdition loại hết.
svc.providers = [{
  name: 'fake',
  isAvailable: () => true,
  fetchArticles: async () => {
    builds += 1;
    await new Promise((r) => setTimeout(r, 300));
    return Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`,
      title: `Tin số ${i}`,
      description: 'mô tả',
      url: `https://vnexpress.net/bai-${i}`,
      source: 'VnExpress',
      publishedAt: new Date(Date.now() - i * 1000).toISOString(),
    }));
  },
}];

const opts = { language: 'vi', category: 'all', page: 1, limit: 10 };
const results = await Promise.all(Array.from({ length: 8 }, () => svc.getFeed(opts)));

assert.equal(builds, 1, `8 lượt song song phải chỉ fan-out 1 lần, thực tế ${builds}`);
assert.ok(results[0].items.length > 0, 'feed rỗng — bộ lọc ấn bản đã loại hết bài');
assert.ok(results.every((r) => r.items.length === results[0].items.length), 'các lượt gọi trả số bài khác nhau');
assert.equal(results[0].meta.language, 'vi');
assert.equal(results[0].meta.country, 'VN');

await svc.getFeed(opts);
assert.equal(builds, 1, 'lượt gọi sau phải trúng cache, không dựng lại');

console.log(`✅ TODAY feed: 8 lượt song song = ${builds} lần fan-out, ${results[0].items.length} bài/lượt.`);
