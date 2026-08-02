import { describe, it, expect } from 'vitest';
import { extractParagraphs, parseHtmlListing } from '../services/studentNewsService.js';

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
        <article>${body}${body}${p(long('Đoạn hai của bài'))}${p(long('Đoạn ba của bài'))}</article>
      </body>`;
    const paragraphs = extractParagraphs(html);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('Đoạn trong bài');
    expect(paragraphs.join(' ')).not.toContain('Quảng cáo');
  });

  it('lấy <article> lớn nhất, không dính thẻ tin liên quan đứng trước', () => {
    // Tuổi Trẻ xếp cả chục thẻ <article> nhỏ trước phần thân bài.
    const teaser = `<article>${p(long('Tin liên quan'))}</article>`;
    const real = `<article>${[1, 2, 3, 4].map((i) => p(long(`Thân bài đoạn ${i}`))).join('')}</article>`;
    const paragraphs = extractParagraphs(teaser.repeat(11) + real);
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs.join(' ')).not.toContain('Tin liên quan');
  });

  it('giải mã entity hex (Tuổi Trẻ mã hoá dấu tiếng Việt kiểu &#x1ECD;)', () => {
    const hex = 'Ngu&#x1ED3;n tin cho bi&#x1EBF;t k&#x1EBF;t qu&#x1EA3; thi &#x111;&#xE3; &#x111;&#x1B0;&#x1EE3;c c&#xF4;ng b&#x1ED1; r&#x1ED9;ng r&#xE3;i';
    expect(extractParagraphs(p(hex))[0])
      .toBe('Nguồn tin cho biết kết quả thi đã được công bố rộng rãi');
  });

  it('giải mã entity và trả rỗng khi trang không có <p>', () => {
    expect(extractParagraphs(p(`${long('Giá vàng')} &amp; &quot;USD&quot; &#273;&#7891;ng`))[0])
      .toMatch(/& "USD" đồng$/);
    expect(extractParagraphs('<div>Trang render bằng JS</div>')).toEqual([]);
  });
});

describe('parseHtmlListing', () => {
  const config = {
    source: 'TGP Sài Gòn',
    origin: 'https://tgpsaigon.net',
    linkPattern: /^\/bai-viet\/[^"']{8,}/,
    datePattern: /MainImages\/(\d{2})(\d{2})(\d{4})_/,
  };

  it('gộp thẻ <a> ảnh và thẻ <a> tiêu đề của cùng một bài', () => {
    const html = `
      <a href="/bai-viet/y-cau-nguyen-thang-8-90743"><img src="/Images/Articles/MainImages/01082026_213338.jpg"/></a>
      <a href="/bai-viet/y-cau-nguyen-thang-8-90743">Ý cầu nguyện của Đức Thánh Cha tháng 8</a>
      <a href="/lien-he">Liên hệ với chúng tôi ngay hôm nay</a>`;
    const [article, ...rest] = parseHtmlListing(html, config);
    expect(rest).toHaveLength(0); // link ngoài vùng bài viết bị loại
    expect(article.title).toBe('Ý cầu nguyện của Đức Thánh Cha tháng 8');
    expect(article.url).toBe('https://tgpsaigon.net/bai-viet/y-cau-nguyen-thang-8-90743');
    expect(article.imageUrl).toBe('https://tgpsaigon.net/Images/Articles/MainImages/01082026_213338.jpg');
    expect(article.publishedAt.slice(0, 10)).toBe('2026-08-01');
  });

  it('để trống ngày khi trang không lộ ngày, không bịa giờ hiện tại', () => {
    const html = '<a href="/bai-viet/tuyen-ngon-dominus-jesus">Tuyên Ngôn Dominus Jesus</a>';
    expect(parseHtmlListing(html, { ...config, datePattern: undefined })[0].publishedAt).toBeNull();
  });

  it('bỏ tiêu đề quá ngắn (nút điều hướng)', () => {
    const html = '<a href="/bai-viet/abc-12345678">Xem thêm</a>';
    expect(parseHtmlListing(html, config)).toEqual([]);
  });
});
