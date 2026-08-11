import { describe, expect, it } from 'vitest';
import { extractTopics, matchesQuery, matchesTopic } from './todayTopics.js';

const feed = [
  { title: 'Tuyển sinh đại học 2026 có gì mới', description: '' },
  { title: 'Đại học Bách khoa công bố đề án tuyển sinh', description: '' },
  { title: 'Tuyển sinh lớp 10 tại TP.HCM', description: '' },
  { title: 'Giá vàng hôm nay tăng mạnh', description: '', source: 'VnExpress' },
];

describe('extractTopics', () => {
  it('gom cụm hai âm tiết chứ không phải từ đơn', () => {
    const topics = extractTopics(feed).map((item) => item.topic);
    expect(topics[0]).toBe('tuyển sinh');
    // "sinh" đứng một mình đã nằm trong cụm nên không được lặp lại thành chip.
    expect(topics).not.toContain('sinh');
  });

  it('bỏ chủ đề chỉ xuất hiện một lần', () => {
    expect(extractTopics(feed).map((item) => item.topic)).not.toContain('giá vàng');
  });
});

describe('matchesTopic / matchesQuery', () => {
  it('lọc đúng số bài của một chủ đề', () => {
    expect(feed.filter((article) => matchesTopic(article, 'tuyển sinh'))).toHaveLength(3);
  });

  it('không lọc gì khi chưa chọn chủ đề hoặc chưa gõ gì', () => {
    expect(feed.filter((article) => matchesTopic(article, ''))).toHaveLength(4);
    expect(feed.filter((article) => matchesQuery(article, '  '))).toHaveLength(4);
  });

  it('tìm được cả theo tên nguồn', () => {
    expect(feed.filter((article) => matchesQuery(article, 'vnexpress'))).toHaveLength(1);
  });
});
