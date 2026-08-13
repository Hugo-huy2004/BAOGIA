import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../../src/i18n/languages.js';
import { generateRaw } from '../services/aiGateway.js';
import {
  articleBelongsToEdition, diversifyArticles, extractBlocks, parseHtmlListing,
  parseThaiPbsPayload, PUBLISHER_FEEDS, PUBLISHER_JSON_FEEDS, PublisherJsonProvider,
  PublisherRssProvider, OPEN_LICENSE_SOURCES,
  resolveNewsEdition, resolveNewsPolicy, StudentNewsService,
} from '../services/studentNewsService.js';

const p = (text) => `<p>${text}</p>`;
const long = (seed) => `${seed} `.repeat(12).trim(); // > 20 ký tự
const texts = (html, base) => extractBlocks(html, base).filter((b) => b.type === 'text').map((b) => b.text);

describe('extractBlocks', () => {
  it('lấy đoạn văn và bỏ script/style/caption ngắn', () => {
    const html = `
      <html><body>
        <script>var junk = ${p(long('script'))};</script>
        <style>.p { content: "x"; }</style>
        <p>Ảnh</p>
        ${p(long('Nội dung thật của bài báo'))}
        ${p(long('Đoạn thứ hai của bài báo'))}
      </body></html>`;
    const paragraphs = texts(html);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toContain('Nội dung thật');
    expect(paragraphs.join(' ')).not.toContain('script');
    expect(paragraphs.join(' ')).not.toContain('Ảnh');
  });

  it('ưu tiên vùng <article> và bỏ đoạn trùng', () => {
    const body = p(long('Đoạn trong bài viết chính'));
    const html = `
      <body>
        ${p(long('Quảng cáo ngoài bài viết'))}
        <article>${body}${body}${p(long('Đoạn hai của bài'))}${p(long('Đoạn ba của bài'))}</article>
      </body>`;
    const paragraphs = texts(html);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('Đoạn trong bài');
    expect(paragraphs.join(' ')).not.toContain('Quảng cáo');
  });

  it('lấy <article> lớn nhất, không dính thẻ tin liên quan đứng trước', () => {
    // Tuổi Trẻ xếp cả chục thẻ <article> nhỏ trước phần thân bài.
    const teaser = `<article>${p(long('Tin liên quan'))}</article>`;
    const real = `<article>${[1, 2, 3, 4].map((i) => p(long(`Thân bài đoạn ${i}`))).join('')}</article>`;
    const paragraphs = texts(teaser.repeat(11) + real);
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs.join(' ')).not.toContain('Tin liên quan');
  });

  it('giải mã entity hex (Tuổi Trẻ mã hoá dấu tiếng Việt kiểu &#x1ECD;)', () => {
    const hex = 'Ngu&#x1ED3;n tin cho bi&#x1EBF;t k&#x1EBF;t qu&#x1EA3; thi &#x111;&#xE3; &#x111;&#x1B0;&#x1EE3;c c&#xF4;ng b&#x1ED1; r&#x1ED9;ng r&#xE3;i';
    expect(texts(p(hex))[0])
      .toBe('Nguồn tin cho biết kết quả thi đã được công bố rộng rãi');
  });

  it('giải mã entity mã hoá hai lần (VietnamNet, The Guardian)', () => {
    expect(texts(p(`${long('Hiệu trưởng cam kết')} &amp;apos;bảo hành&amp;apos;`))[0])
      .toMatch(/'bảo hành'$/);
    // Không đụng vào "&" thường: lượt đầu đã hết entity thì dừng.
    expect(texts(p(`${long('Bản tin')} Tom &amp; Jerry &amp; Co`))[0]).toMatch(/Tom & Jerry & Co$/);
  });

  it('giải mã entity và trả rỗng khi trang không có <p>', () => {
    expect(texts(p(`${long('Giá vàng')} &amp; &quot;USD&quot; &#273;&#7891;ng`))[0])
      .toMatch(/& "USD" đồng$/);
    expect(extractBlocks('<div>Trang render bằng JS</div>')).toEqual([]);
  });

  it('giữ ảnh minh hoạ xen giữa các đoạn, đúng thứ tự bản gốc', () => {
    const html = `<article>
      ${p(long('Đoạn mở đầu của bài'))}
      <figure>
        <img data-src="/images/le-1.jpg" src="/placeholder.gif" width="800"/>
        <figcaption>&#7842;nh: Vatican News</figcaption>
      </figure>
      ${p(long('Đoạn sau ảnh'))}
      <img src="https://cdn.bao.vn/anh-2.jpg" alt="Nh&agrave; th&#7901;"/>
      <img src="/tracker.gif" width="1" height="1"/>
      <img src="data:image/gif;base64,R0lGOD"/>
      ${p(long('Đoạn cuối bài'))}
    </article>`;
    const blocks = extractBlocks(html, 'https://tgpsaigon.net/bai-viet/abc');
    expect(blocks.map((b) => b.type)).toEqual(['text', 'image', 'text', 'image', 'text']);
    expect(blocks[1]).toEqual({
      type: 'image',
      src: 'https://tgpsaigon.net/images/le-1.jpg', // data-src thắng src placeholder
      caption: 'Ảnh: Vatican News',
    });
    expect(blocks[3]).toEqual({
      type: 'image',
      src: 'https://cdn.bao.vn/anh-2.jpg',
      caption: 'Nhà thờ',
    });
  });

  it('bỏ ảnh trùng và không đếm <p> trong <figure> thành đoạn văn', () => {
    const figure = '<figure><img src="https://cdn.bao.vn/x.jpg" width="600"/>'
      + `${p(long('Chú thích ảnh dài nằm trong thẻ p'))}</figure>`;
    const html = `<article>${figure}${figure}${[1, 2, 3].map((i) => p(long(`Thân bài ${i}`))).join('')}</article>`;
    const blocks = extractBlocks(html, 'https://cdn.bao.vn/');
    expect(blocks.filter((b) => b.type === 'image')).toHaveLength(1);
    expect(blocks.map((b) => b.text).join(' ')).not.toContain('Chú thích ảnh');
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

describe('parseThaiPbsPayload', () => {
  const payload = {
    sections: [
      {
        data: [
          {
            id: 509386,
            title: 'ข่าวสิ่งแวดล้อมฉบับทดสอบ',
            description: 'รายละเอียดข่าวภาษาไทย',
            date: '2026-08-13T13:01:29+07:00',
            url: '/news/content/509386',
            category: 'สิ่งแวดล้อม',
            categoryUrl: '/news/categories/environment',
          },
          {
            id: 509381,
            title: 'ข่าววิทยาศาสตร์ฉบับทดสอบ',
            description: 'ข่าวเทคโนโลยีภาษาไทย',
            date: '2026-08-13T11:30:00+07:00',
            url: 'https://www.thaipbs.or.th/news/content/509381',
            category: 'วิทยาศาสตร์เทคโนโลยี',
            categoryUrl: '/news/categories/science-technology',
          },
        ],
      },
      { data: [{ id: 509386, title: 'ข่าวซ้ำ', url: '/news/content/509386' }] },
    ],
  };

  it('normalizes official Thai PBS stories and removes duplicates', () => {
    const articles = parseThaiPbsPayload(payload);
    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({
      source: 'Thai PBS',
      category: 'community',
      url: 'https://www.thaipbs.or.th/news/content/509386',
    });
    expect(articles[1].category).toBe('technology');
  });

  it('does not relabel unrelated stories as a requested category', () => {
    expect(parseThaiPbsPayload(payload, 'technology')).toHaveLength(1);
    expect(parseThaiPbsPayload(payload, 'academic')).toEqual([]);
  });

  it('fetches the configured Thai edition and stamps every article th-TH', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      expect(url).toBe(PUBLISHER_JSON_FEEDS.th.url);
      expect(options.headers['User-Agent']).toMatch(/^[\x20-\x7E]+$/);
      return { ok: true, json: async () => payload };
    };
    try {
      const articles = await new PublisherJsonProvider().fetchArticles({
        language: 'th', category: 'all', country: 'TH', limit: 10,
      });
      expect(articles).toHaveLength(2);
      expect(articles.every((article) => article.language === 'th' && article.country === 'TH')).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });
});

// Toàn văn chỉ được dựng lại cho nguồn truy cập mở. Nếu ai đó lỡ tay mở lại cho
// báo chí, bài test này gãy trước khi lên production.
describe('readArticle — hàng rào bản quyền', () => {
  const service = new StudentNewsService([]);
  const noFetch = () => { throw new Error('readArticle KHÔNG được gọi mạng cho nguồn có bản quyền'); };

  it('không tải trang với nguồn báo chí, chỉ trả cờ policy', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = noFetch;
    try {
      const content = await service.readArticle({ id: 'x1', source: 'VnExpress', url: 'https://vnexpress.net/a' });
      expect(content).toMatchObject({
        blocks: [],
        readMinutes: 0,
        available: false,
        policy: { fullTextInPortal: false },
      });
    } finally {
      globalThis.fetch = original;
    }
  });

  it('vẫn cho phép nguồn truy cập mở (arXiv) đi tiếp tới bước tải', async () => {
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = async () => { called = true; return { ok: false }; };
    try {
      const content = await service.readArticle({ id: 'x2', source: 'arXiv', url: 'https://arxiv.org/abs/1' });
      expect(called).toBe(true);
      expect(content.policy).toBeUndefined();
    } finally {
      globalThis.fetch = original;
    }
  });

  it('mọi nguồn mở phải khai giấy phép — không có dòng "vì tải được nên đăng"', () => {
    for (const [name, open] of Object.entries(OPEN_LICENSE_SOURCES)) {
      expect(open.license, `${name} thiếu tên giấy phép`).toBeTruthy();
      expect(open.licenseUrl, `${name} thiếu link giấy phép`).toMatch(/^https:\/\//);
    }
  });
});

describe('readArticle — nguồn giấy phép mở', () => {
  // Ba đoạn phải KHÁC nhau: bộ bóc nội dung loại đoạn trùng.
  const para = (n) => `<p>Đoạn thứ ${n} đủ dài để vượt ngưỡng hai mươi ký tự của bộ bóc nội dung.</p>`;
  const html = `<article>${para(1)}`
    + '<figure><img src="https://images.theconversation.com/a.jpg" width="800"/></figure>'
    + `${para(2)}${para(3)}</article>`;
  let service;
  let originalFetch;

  beforeEach(() => {
    service = new StudentNewsService([]);
    originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, url: 'https://theconversation.com/a-123', text: async () => html });
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('dựng toàn văn kèm giấy phép cho The Conversation (CC BY-ND)', async () => {
    const content = await service.readArticle({
      id: 'o1', source: 'The Conversation', url: 'https://theconversation.com/a-123',
    });
    expect(content).toMatchObject({ available: true, license: 'CC BY-ND 4.0' });
    expect(content.blocks.filter((block) => block.type === 'text')).toHaveLength(3);
    expect(content.readMinutes).toBeGreaterThan(0);
  });

  it('bỏ ảnh của nguồn không cấp phép ảnh, giữ ảnh của nguồn phạm vi công cộng', async () => {
    const openImages = await service.readArticle({ id: 'o2', source: 'NASA', url: 'https://www.nasa.gov/a' });
    expect(openImages.blocks.some((block) => block.type === 'image')).toBe(true);
    const textOnly = await service.readArticle({
      id: 'o3', source: 'The Conversation', url: 'https://theconversation.com/b-456',
    });
    expect(textOnly.blocks.every((block) => block.type === 'text')).toBe(true);
  });

  it('cờ contentAccess của bài quyết định sau cùng, kể cả khi tên nguồn nằm trong danh sách', async () => {
    const content = await service.readArticle({
      id: 'o4', source: 'The Conversation', url: 'https://theconversation.com/c-789',
      contentAccess: { fullTextInPortal: false },
    });
    expect(content.available).toBe(false);
    expect(content.blocks).toEqual([]);
  });
});

vi.mock('../services/aiGateway.js', () => ({ generateRaw: vi.fn() }));

// The Conversation phát Atom (<entry>, link ở href) chứ không phải RSS.
describe('PublisherRssProvider — feed Atom', () => {
  const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
    <entry>
      <title>Les pesticides et le risque de SLA</title>
      <link rel="edit" href="https://theconversation.com/edit/1"/>
      <link rel="alternate" type="text/html" href="https://theconversation.com/sla-pesticides-289730"/>
      <summary>Une nouvelle étude suggère un lien.</summary>
      <published>2026-08-13T06:00:00Z</published>
      <author><name>Marie Dupont</name></author>
    </entry>
  </feed>`;

  it('đọc tiêu đề, link alternate, sapo và ngày đăng của một entry', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, text: async () => atom });
    try {
      const [article] = await new PublisherRssProvider({
        fr: { all: [['The Conversation', 'https://theconversation.com/fr/articles.atom']] },
      }).fetchArticles({ language: 'fr', category: 'all', limit: 5 });
      expect(article).toMatchObject({
        title: 'Les pesticides et le risque de SLA',
        url: 'https://theconversation.com/sla-pesticides-289730', // không lấy nhầm rel="edit"
        description: 'Une nouvelle étude suggère un lien.',
        author: 'Marie Dupont',
      });
      expect(article.publishedAt).toBe('2026-08-13T06:00:00.000Z');
      expect(article.contentAccess).toMatchObject({ fullTextInPortal: true, license: 'CC BY-ND 4.0' });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('summarizeArticle — tóm tắt dài', () => {
  const article = {
    id: 's1', source: 'VnExpress', title: 'Kỳ thi tốt nghiệp', language: 'vi',
    description: 'Sapo do toà soạn viết.', url: 'https://vnexpress.net/a',
  };
  // Câu văn của toà soạn: được đọc để tóm tắt, nhưng KHÔNG được trả về client.
  const sentence = 'Nguyên văn của bài báo thuộc bản quyền toà soạn và không được đăng lại. ';
  const html = `<article><p>${sentence.repeat(12)}</p></article>`;
  const locked = { blocks: [], readMinutes: 0, available: false, policy: { fullTextInPortal: false } };
  let service;
  let originalFetch;

  beforeEach(() => {
    service = new StudentNewsService([]);
    originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, url: article.url, text: async () => html });
    generateRaw.mockReset();
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('trả các ý do AI viết lại, không kèm nguyên văn bài gốc', async () => {
    generateRaw.mockResolvedValue([
      '- Bộ vừa công bố phương án thi, áp dụng cho học sinh lớp 12 từ năm học tới.',
      '- Số môn thi giảm còn bốn, trong đó hai môn bắt buộc và hai môn tự chọn.',
      'Tóm tắt:',
    ].join('\n'));
    const summary = await service.summarizeArticle(article, locked, 'vi');
    expect(summary.by).toBe('ai');
    expect(summary.points).toHaveLength(2);          // dòng rác "Tóm tắt:" bị loại
    expect(summary.points[0]).toMatch(/^Bộ vừa công bố/); // gạch đầu dòng đã bóc
    expect(summary.points.join(' ')).not.toContain(sentence.trim());
    // Bài gốc được gửi cho model nhưng không rời khỏi server.
    expect(generateRaw.mock.calls[0][0].contents[0].parts[0].text).toContain(sentence.trim());
  });

  it('rơi về sapo của toà soạn khi không có AI', async () => {
    generateRaw.mockResolvedValue(null);
    expect(await service.summarizeArticle(article, locked, 'vi'))
      .toEqual({ points: [article.description], by: 'source' });
  });

  it('không gọi lại AI cho bài đã tóm tắt', async () => {
    generateRaw.mockResolvedValue('- Một ý tóm tắt đủ dài để vượt ngưỡng lọc dòng rác của bộ phân tích.');
    await service.summarizeArticle(article, locked, 'vi');
    await service.summarizeArticle(article, locked, 'vi');
    expect(generateRaw).toHaveBeenCalledTimes(1);
  });
});

describe('country-aware news policy', () => {
  it('uses the EU press-publication profile for France and Spain', () => {
    expect(resolveNewsPolicy('FR').id).toBe('eu-press-publication');
    expect(resolveNewsPolicy('ES').fullTextRule).toBe('explicit-license-only');
  });

  it('never treats an unknown jurisdiction as permission for full text', () => {
    expect(resolveNewsPolicy('TH')).toMatchObject({
      id: 'berne-source-first',
      fullTextRule: 'explicit-license-only',
    });
  });

  it('locks every supported language to its own country and market timezone', () => {
    expect(SUPPORTED_LANGUAGES.map(({ code }) => code).sort())
      .toEqual(['vi', 'en', 'zh', 'th', 'ja', 'ko', 'id', 'es', 'fr'].sort());
    for (const { code } of SUPPORTED_LANGUAGES) {
      const hasLocalSource = Boolean(PUBLISHER_FEEDS[code]?.all?.length || PUBLISHER_JSON_FEEDS[code]);
      expect(hasLocalSource, `${code} must have local news sources`).toBe(true);
    }
    expect(Object.fromEntries(
      ['vi', 'en', 'zh', 'th', 'ja', 'ko', 'id', 'es', 'fr']
        .map((language) => [language, resolveNewsEdition(language).country]),
    )).toEqual({
      vi: 'VN', en: 'US', zh: 'CN', th: 'TH', ja: 'JP', ko: 'KR', id: 'ID', es: 'ES', fr: 'FR',
    });
    expect(resolveNewsEdition('ja').timeZone).toBe('Asia/Tokyo');
  });

  it('rejects publisher domains from another language edition', () => {
    expect(articleBelongsToEdition({ url: 'https://vnexpress.net/tin-moi' }, 'vi')).toBe(true);
    expect(articleBelongsToEdition({ url: 'https://vnexpress.net/tin-moi' }, 'en')).toBe(false);
    expect(articleBelongsToEdition({ url: 'https://www.npr.org/story' }, 'en')).toBe(true);
  });

  it('ignores a conflicting network country and uses the selected language edition', async () => {
    const provider = {
      name: 'fixture',
      isAvailable: () => true,
      fetchArticles: async ({ language, country }) => [{
        id: 'fixture', title: `${language}-${country}`, description: '', source: 'Fixture',
        category: 'all', url: 'https://thailand.go.th/story', publishedAt: null,
      }],
    };
    const service = new StudentNewsService([provider]);
    const feed = await service.getFeed({ language: 'th', country: 'JP', timeZone: 'Asia/Tokyo' });
    expect(feed.meta).toMatchObject({ language: 'th', country: 'TH', timeZone: 'Asia/Bangkok' });
    expect(feed.items[0].title).toBe('th-TH');
  });

  it('uses the strict EU excerpt ceiling and never exposes full publisher text', async () => {
    const provider = {
      name: 'fixture',
      isAvailable: () => true,
      fetchArticles: async () => [{
        title: 'Una noticia española de prueba', description: 'x'.repeat(800), source: 'RTVE',
        category: 'all', url: 'https://www.rtve.es/noticias/prueba', publishedAt: null,
      }],
    };
    const feed = await new StudentNewsService([provider]).getFeed({ language: 'es' });
    expect(feed.items[0].description.length).toBeLessThanOrEqual(180);
    expect(feed.items[0].contentAccess?.fullTextInPortal).not.toBe(true);
  });

  it('rotates publishers without dropping any stories', () => {
    const input = [
      { id: 'a1', source: 'A' }, { id: 'a2', source: 'A' }, { id: 'a3', source: 'A' },
      { id: 'b1', source: 'B' }, { id: 'c1', source: 'C' },
    ];
    expect(diversifyArticles(input).map(({ id }) => id)).toEqual(['a1', 'b1', 'c1', 'a2', 'a3']);
  });
});
