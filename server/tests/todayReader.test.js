import { describe, it, expect } from 'vitest';
import { extractParagraphs } from '../services/studentNewsService.js';

const p = (text) => `<p>${text}</p>`;
const long = (seed) => `${seed} `.repeat(12).trim(); // > 40 ký tự

describe('extractParagraphs', () => {
  it('lấy đoạn văn và bỏ script/style/caption ngắn', () => {
    const html = `
      <html><body>
        <script>var junk = ${p(long('script'))};</script>
        <style>.p { content: "x"; }</style>
        <p>Ảnh: Reuters</p>
        ${p(long('Nội dung thật của bài báo'))}
        ${p(long('Đoạn thứ hai của bài báo'))}
      </body></html>`;
    const paragraphs = extractParagraphs(html);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toContain('Nội dung thật');
    expect(paragraphs.join(' ')).not.toContain('script');
    expect(paragraphs.join(' ')).not.toContain('Ảnh: Reuters');
  });

  it('ưu tiên vùng <article> và bỏ đoạn trùng', () => {
    const body = p(long('Đoạn trong bài viết chính'));
    const html = `
      <body>
        ${p(long('Quảng cáo ngoài bài viết'))}
        <article>${body}${body}</article>
      </body>`;
    const paragraphs = extractParagraphs(html);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toContain('Đoạn trong bài');
  });

  it('giải mã entity và trả rỗng khi trang không có <p>', () => {
    expect(extractParagraphs(p(`${long('Giá vàng')} &amp; &quot;USD&quot; &#273;&#7891;ng`))[0])
      .toMatch(/& "USD" đồng$/);
    expect(extractParagraphs('<div>Trang render bằng JS</div>')).toEqual([]);
  });
});
