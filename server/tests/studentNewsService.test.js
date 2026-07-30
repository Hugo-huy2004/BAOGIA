import { describe, expect, it, vi } from 'vitest';
import {
  getDailyEdition,
  NewsProvider,
  PublisherRssProvider,
  StudentNewsService,
} from '../services/studentNewsService.js';

const rssDocument = `<rss><channel>
  <item>
    <title>Ảnh nằm ở enclosure</title>
    <description><![CDATA[Tóm tắt thật của toà soạn.]]></description>
    <link>https://baomau.vn/a.html</link>
    <pubDate>Thu, 30 Jul 2026 10:19:26 +0700</pubDate>
    <enclosure type="image/jpeg" url="https://cdn2.baomau.vn/thumb_w/1200/a.jpg" />
  </item>
  <item>
    <title>Ảnh chỉ nằm trong description</title>
    <description><![CDATA[<a href="x"><img src="https://cdn2.baomau.vn/b.jpg"></a></br>Tóm tắt hai.]]></description>
    <link>https://baomau.vn/b.html</link>
    <pubDate>Thu, 30 Jul 2026 09:00:00 +0700</pubDate>
  </item>
</channel></rss>`;

class FakeProvider extends NewsProvider {
  constructor(items) {
    super('fake');
    this.items = items;
    this.fetchArticles = vi.fn(async () => items);
  }
}

describe('StudentNewsService', () => {
  it('paginates and caches normalized provider results', async () => {
    const provider = new FakeProvider([
      {
        id: 'a',
        title: 'A',
        url: 'https://example.com/a',
        imageUrl: 'https://images.example.com/a.jpg',
        publishedAt: '2026-01-02',
      },
      { id: 'b', title: 'B', url: 'https://example.com/b', publishedAt: '2026-01-01' },
    ]);
    const service = new StudentNewsService([provider]);

    const first = await service.getFeed({ language: 'en', limit: 1 });
    const second = await service.getFeed({ language: 'en', limit: 1 });

    expect(first.items).toHaveLength(1);
    expect(first.pagination).toMatchObject({ page: 1, total: 2, hasNextPage: true });
    expect(second.items[0].id).toBe(first.items[0].id);
    expect(first.items[0].imageUrl).toBe('https://images.example.com/a.jpg');
    expect(provider.fetchArticles).toHaveBeenCalledTimes(1);
  });

  it('falls back to safe localized items when providers fail', async () => {
    class BrokenProvider extends NewsProvider {
      constructor() { super('broken'); }
      async fetchArticles() { throw new Error('offline'); }
    }
    const service = new StudentNewsService([new BrokenProvider()]);
    const feed = await service.getFeed({ language: 'vi' });

    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items[0].url).toMatch(/^https:\/\//);
    expect(feed.meta.providers[0].status).toBe('unavailable');
  });

  it('collapses unknown countries onto the language edition so the cache cannot be flooded', async () => {
    const provider = new FakeProvider([
      { title: 'A', url: 'https://example.com/a', publishedAt: '2026-01-02' },
    ]);
    const service = new StudentNewsService([provider]);

    const first = await service.getFeed({ language: 'vi', country: 'JP' });
    const second = await service.getFeed({ language: 'vi', country: 'ZZ' });
    const english = await service.getFeed({ language: 'en', country: 'JP' });

    expect(first.meta.country).toBe('VN');
    expect(second.meta.country).toBe('VN');
    expect(english.meta.country).toBe('US');
    // Hai mã lạ dùng chung một cache key -> chỉ một lượt fan-out cho ấn bản VN.
    expect(provider.fetchArticles).toHaveBeenCalledTimes(2);
  });

  it('reads image and summary out of publisher RSS, from enclosure or from the description', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(rssDocument, { status: 200 })));
    const provider = new PublisherRssProvider({
      vi: { all: [['Báo Mẫu', 'https://baomau.vn/rss/all.rss']] },
    });

    const [first, second] = await provider.fetchArticles({
      language: 'vi',
      category: 'all',
      limit: 10,
    });

    // Bản 1200px được hạ xuống 800px ngay ở CDN.
    expect(first.imageUrl).toBe('https://cdn2.baomau.vn/thumb_w/800/a.jpg');
    expect(first.description).toBe('Tóm tắt thật của toà soạn.');
    expect(second.imageUrl).toBe('https://cdn2.baomau.vn/b.jpg');
    expect(second.description).toContain('Tóm tắt hai.');
    // Thẻ HTML trong description không được lọt ra client.
    expect(second.description).not.toContain('<');
    vi.unstubAllGlobals();
  });

  it('keeps the copy that has an image when two sources carry the same story', async () => {
    const withoutImage = new FakeProvider([
      { title: 'Cùng một tin!', url: 'https://a.vn/1', publishedAt: '2026-01-02' },
    ]);
    const withImage = new FakeProvider([
      {
        title: 'Cùng  một   tin',
        url: 'https://b.vn/2',
        imageUrl: 'https://cdn.b.vn/x.jpg',
        publishedAt: '2026-01-02',
      },
    ]);
    const service = new StudentNewsService([withoutImage, withImage]);

    const feed = await service.getFeed({ language: 'vi' });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].imageUrl).toBe('https://cdn.b.vn/x.jpg');
  });

  it('changes the daily edition exactly at 09:00 in the user time zone', () => {
    const before = getDailyEdition(
      new Date('2026-07-26T01:59:59.000Z'),
      'Asia/Ho_Chi_Minh',
    );
    const after = getDailyEdition(
      new Date('2026-07-26T02:00:00.000Z'),
      'Asia/Ho_Chi_Minh',
    );

    expect(before.edition).toBe('2026-07-25');
    expect(after.edition).toBe('2026-07-26');
    expect(after.resetHour).toBe(9);
  });
});
