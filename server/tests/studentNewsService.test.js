import { describe, expect, it, vi } from 'vitest';
import { getDailyEdition, NewsProvider, StudentNewsService } from '../services/studentNewsService.js';

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
      { id: 'a', title: 'A', url: 'https://example.com/a', publishedAt: '2026-01-02' },
      { id: 'b', title: 'B', url: 'https://example.com/b', publishedAt: '2026-01-01' },
    ]);
    const service = new StudentNewsService([provider]);

    const first = await service.getFeed({ language: 'en', limit: 1 });
    const second = await service.getFeed({ language: 'en', limit: 1 });

    expect(first.items).toHaveLength(1);
    expect(first.pagination).toMatchObject({ page: 1, total: 2, hasNextPage: true });
    expect(second.items[0].id).toBe(first.items[0].id);
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
