import crypto from 'crypto';
import { decodeHTML } from 'entities';

const REQUEST_TIMEOUT_MS = 5500;
// Vài toà soạn (TGP Hà Nội…) trả 403 cho User-Agent lạ. Dùng UA trình duyệt
// thật để đọc đúng những feed công khai đó.
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/126 Safari/537.36';
// Kho bài đủ sâu để cuộn vô hạn: client tải một lần rồi tự hé dần theo cuộn,
// rẻ hơn nhiều so với phân trang (mỗi trang là một lượt request).
const MAX_ARTICLES = 120;
// Ấn bản vẫn tính theo ngày (để đặt tên bản tin), nhưng nội dung làm mới mỗi
// 10 phút để tin nóng chảy vào. Không có key GNews/NewsAPI nên chỉ đọc RSS —
// làm mới dày cỡ này không đụng hạn mức nào.
const FEED_REFRESH_MS = 10 * 60 * 1000;
const EDITION_COUNTRIES = new Set(['VN', 'US']);

const CATEGORY_QUERIES = Object.freeze({
  all: {
    vi: 'giáo dục OR học sinh OR sinh viên OR khoa học OR công nghệ',
    en: 'education OR students OR science OR technology',
  },
  academic: {
    vi: 'giáo dục OR nghiên cứu OR học bổng OR đại học',
    en: 'education OR research OR scholarship OR university',
  },
  technology: {
    vi: 'công nghệ OR trí tuệ nhân tạo OR lập trình',
    en: 'technology OR artificial intelligence OR programming',
  },
  community: {
    vi: 'học sinh OR sinh viên OR cộng đồng OR tình nguyện',
    en: 'students OR campus OR community OR volunteering',
  },
  world: {
    vi: 'thời sự quốc tế OR khoa học thế giới',
    en: 'world news OR global science',
  },
  catholic: {
    vi: 'Giáo hội Công giáo OR Vatican OR giáo phận',
    en: 'Catholic Church OR Vatican OR diocese',
  },
});

const FALLBACK_ARTICLES = Object.freeze({
  vi: [
    {
      title: 'Không gian học thuật đang được cập nhật',
      description: 'Feed sẽ tự động tổng hợp nghiên cứu, giáo dục và tin tức phù hợp ngay khi nhà cung cấp API khả dụng.',
      source: 'Hugo Learning',
      category: 'academic',
      url: 'https://arxiv.org/',
    },
    {
      title: 'Khám phá nghiên cứu mở cho học sinh, sinh viên',
      description: 'Tìm các công trình khoa học mới và luyện kỹ năng đọc tóm tắt nghiên cứu bằng nguồn mở.',
      source: 'arXiv',
      category: 'technology',
      url: 'https://arxiv.org/search/',
    },
  ],
  en: [
    {
      title: 'The academic feed is being refreshed',
      description: 'Research, education, and relevant current-affairs stories will appear automatically when an API provider is available.',
      source: 'Hugo Learning',
      category: 'academic',
      url: 'https://arxiv.org/',
    },
    {
      title: 'Explore open research for students',
      description: 'Discover recent science and practice reading research abstracts through an open source.',
      source: 'arXiv',
      category: 'technology',
      url: 'https://arxiv.org/search/',
    },
  ],
});

// Vài nguồn (VietnamNet, The Guardian) mã hoá hai lần trong RSS: `&amp;apos;`
// giải một lượt mới ra `&apos;`. Chỉ giải lượt hai khi lượt đầu còn sót entity,
// nên "Tom &amp; Jerry" không bị đụng tới.
// ponytail: bài hướng dẫn code viết `&amp;lt;div&amp;gt;` sẽ hiện thành `<div>`
// thay vì `&lt;div&gt;` — chấp nhận, vì thẻ đã bị xoá TRƯỚC khi giải mã nên đây
// chỉ là chữ, React tự escape khi render. Đổi nếu portal có mục dạy HTML.
function decodeEntities(value) {
  const once = decodeHTML(value);
  return /&[a-z]+;|&#\d+;/i.test(once) ? decodeHTML(once) : once;
}

function cleanText(value = '') {
  return decodeEntities(
    String(value)
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value) {
  try {
    const url = new URL(cleanText(value));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

// Ảnh RSS mặc định là bản 1200px cho một thumbnail 86px. Chỉ hạ được ở CDN nào
// không ký tham số trong URL — VnExpress ký (`s=`) nên đổi `w=` là 401, đành
// nhận bản gốc; phần còn lại đã có loading="lazy" gánh.
// ponytail: rewrite theo từng CDN, thêm nguồn mới thì thêm một dòng ở đây.
function shrinkImage(url) {
  return url.replace(/\/thumb_w\/\d+\//, '/thumb_w/800/');
}

function stableId(article) {
  return crypto
    .createHash('sha256')
    .update(`${article.url}|${article.title}`)
    .digest('hex')
    .slice(0, 18);
}

function normalizeArticle(article, defaults = {}) {
  const url = safeUrl(article.url);
  const title = cleanText(article.title);
  if (!url || !title) return null;
  const normalized = {
    id: '',
    title: title.slice(0, 240),
    description: cleanText(article.description).slice(0, 520),
    source: cleanText(article.source || defaults.source || 'News').slice(0, 80),
    author: cleanText(article.author).slice(0, 100),
    category: article.category || defaults.category || 'academic',
    url,
    imageUrl: shrinkImage(safeUrl(article.imageUrl)),
    // null nghĩa là "không biết ngày" — thà bỏ trống còn hơn gán giờ hiện tại
    // rồi đẩy bài cũ lên đầu bản tin.
    publishedAt: article.publishedAt === null
      ? null
      : (article.publishedAt || new Date().toISOString()),
    provider: defaults.provider || article.provider || 'api',
  };
  normalized.id = stableId(normalized);
  return normalized;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Upstream news API returned ${response.status}`);
  return response.json();
}

function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

function addUtcDays({ year, month, day }, amount) {
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function zonedLocalTimeToUtc(parts, timeZone) {
  const desired = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour || 0);
  let estimate = desired;
  // Two passes account for time-zone offsets and DST boundaries without an
  // additional date library.
  for (let index = 0; index < 2; index += 1) {
    const actual = getZonedParts(new Date(estimate), timeZone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour);
    estimate += desired - actualAsUtc;
  }
  return estimate;
}

export function getDailyEdition(now = new Date(), requestedTimeZone = 'UTC') {
  let timeZone = requestedTimeZone;
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(now);
  } catch {
    timeZone = 'UTC';
  }
  const local = getZonedParts(now, timeZone);
  const editionDate = local.hour < 9 ? addUtcDays(local, -1) : local;
  const nextDate = local.hour < 9 ? local : addUtcDays(local, 1);
  const nextResetAt = zonedLocalTimeToUtc({ ...nextDate, hour: 9 }, timeZone);
  const edition = [
    editionDate.year,
    String(editionDate.month).padStart(2, '0'),
    String(editionDate.day).padStart(2, '0'),
  ].join('-');
  return {
    edition,
    timeZone,
    resetHour: 9,
    nextResetAt: new Date(nextResetAt).toISOString(),
    secondsUntilReset: Math.max(1, Math.ceil((nextResetAt - now.getTime()) / 1000)),
  };
}

export class NewsProvider {
  constructor(name) {
    this.name = name;
  }

  isAvailable() {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  async fetchArticles(options) {
    throw new Error('NewsProvider.fetchArticles must be implemented');
  }
}

export class GNewsProvider extends NewsProvider {
  constructor(apiKey = process.env.GNEWS_API_KEY) {
    super('gnews');
    this.apiKey = apiKey;
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async fetchArticles({ language, category, country, limit }) {
    if (!this.isAvailable()) return [];
    const query = CATEGORY_QUERIES[category]?.[language] || CATEGORY_QUERIES.all[language];
    const params = new URLSearchParams({
      q: query,
      lang: language,
      max: String(Math.min(limit, 10)),
      sortby: 'publishedAt',
      apikey: this.apiKey,
    });
    if (country) params.set('country', country.toLowerCase());
    const payload = await fetchJson(`https://gnews.io/api/v4/search?${params}`);
    return (payload.articles || []).map((article) => normalizeArticle({
      title: article.title,
      description: article.description,
      source: article.source?.name,
      author: '',
      category,
      url: article.url,
      imageUrl: article.image,
      publishedAt: article.publishedAt,
    }, { provider: this.name })).filter(Boolean);
  }
}

// RSS trực tiếp của toà soạn, không đi qua news.google.com: có ảnh thật, có
// tóm tắt thật và link gốc (feed tìm kiếm của Google News không có cả ba).
// Ảnh nằm ở <enclosure>/<media:*> hoặc thẻ <img> đầu trong description.
const PUBLISHER_FEEDS = Object.freeze({
  vi: {
    academic: [
      ['VnExpress', 'https://vnexpress.net/rss/giao-duc.rss'],
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/giao-duc.rss'],
      ['Thanh Niên', 'https://thanhnien.vn/rss/giao-duc.rss'],
      ['Dân Trí', 'https://dantri.com.vn/rss/giao-duc.rss'],
      ['VietnamNet', 'https://vietnamnet.vn/rss/giao-duc.rss'],
    ],
    technology: [
      ['VnExpress', 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss'],
      ['VnExpress', 'https://vnexpress.net/rss/so-hoa.rss'],
      ['Thanh Niên', 'https://thanhnien.vn/rss/cong-nghe.rss'],
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/khoa-hoc.rss'],
    ],
    community: [
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/nhip-song-tre.rss'],
      ['VnExpress', 'https://vnexpress.net/rss/giao-duc.rss'],
      ['Dân Trí', 'https://dantri.com.vn/rss/giao-duc.rss'],
    ],
    world: [
      ['VnExpress', 'https://vnexpress.net/rss/the-gioi.rss'],
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/the-gioi.rss'],
      ['Thanh Niên', 'https://thanhnien.vn/rss/the-gioi.rss'],
    ],
    // Giáo hội Công giáo: hoàn vũ (Vatican News tiếng Việt) + Việt Nam + TNTT.
    // hdgmvietnam.com, tgpsaigon.net, vietcatholic.net KHÔNG có RSS (đã dò);
    // tntt.vn chạy Joomla nên feed nằm ở đường dẫn ?format=feed&type=rss.
    catholic: [
      ['Vatican News', 'https://www.vaticannews.va/vi.rss.xml'],
      ['DCCT Việt Nam', 'https://dcctvn.org/feed'],
      ['Giáo phận Cần Thơ', 'https://gpcantho.com/feed/'],
      ['TGP Hà Nội', 'https://www.tonggiaophanhanoi.org/feed/'],
      ['TNTT Việt Nam', 'https://tntt.vn/index.php/thong-tin/tin-noi-bat?format=feed&type=rss'],
      ['TNTT Việt Nam', 'https://tntt.vn/index.php/thong-tin/tong-lien-doan?format=feed&type=rss'],
    ],
    all: [
      ['VnExpress', 'https://vnexpress.net/rss/giao-duc.rss'],
      ['VnExpress', 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss'],
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/giao-duc.rss'],
      ['Dân Trí', 'https://dantri.com.vn/rss/giao-duc.rss'],
      ['VietnamNet', 'https://vietnamnet.vn/rss/giao-duc.rss'],
      ['Thanh Niên', 'https://thanhnien.vn/rss/the-gioi.rss'],
      ['Vatican News', 'https://www.vaticannews.va/vi.rss.xml'],
    ],
  },
  // Ấn bản EN = báo nước ngoài. Một mình BBC thì mỗi chuyên mục chỉ được vài
  // bài và trùng ảnh; thêm Guardian/Ars/NPR cho đủ dày. Chỉ dùng RSS 2.0
  // (<item>) vì readFeed không đọc Atom (<entry>).
  en: {
    academic: [
      ['BBC News', 'https://feeds.bbci.co.uk/news/education/rss.xml'],
      ['The Guardian', 'https://www.theguardian.com/education/rss'],
    ],
    technology: [
      ['BBC News', 'https://feeds.bbci.co.uk/news/technology/rss.xml'],
      ['Ars Technica', 'https://feeds.arstechnica.com/arstechnica/technology-lab'],
      ['The Guardian', 'https://www.theguardian.com/technology/rss'],
    ],
    community: [
      ['The Guardian', 'https://www.theguardian.com/education/students/rss'],
      ['BBC News', 'https://feeds.bbci.co.uk/news/education/rss.xml'],
    ],
    world: [
      ['BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml'],
      ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
    ],
    catholic: [
      ['Vatican News', 'https://www.vaticannews.va/en.rss.xml'],
      ['Catholic News Agency', 'https://www.catholicnewsagency.com/rss/news.xml'],
      ['Aleteia', 'https://aleteia.org/feed/'],
    ],
    all: [
      ['BBC News', 'https://feeds.bbci.co.uk/news/education/rss.xml'],
      ['BBC News', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'],
      ['The Guardian', 'https://www.theguardian.com/science/rss'],
      ['Ars Technica', 'https://feeds.arstechnica.com/arstechnica/technology-lab'],
      ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
      ['Vatican News', 'https://www.vaticannews.va/en.rss.xml'],
    ],
  },
});

export class PublisherRssProvider extends NewsProvider {
  constructor(feeds = PUBLISHER_FEEDS) {
    super('publisher-rss');
    this.feeds = feeds;
  }

  async fetchArticles({ language, category, limit }) {
    const feeds = this.feeds[language]?.[category] || this.feeds[language]?.all || [];
    const perFeed = Math.max(4, Math.ceil(limit / Math.max(1, feeds.length)));
    const settled = await Promise.allSettled(
      feeds.map(([source, url]) => this.readFeed(source, url, category, perFeed)),
    );
    // Một toà soạn đổi/tắt feed không được làm sập cả ấn bản.
    if (settled.every((result) => result.status === 'rejected')) {
      throw new Error('Every publisher feed failed');
    }
    return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  }

  async readFeed(source, url, category, limit) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!response.ok) throw new Error(`${source} RSS returned ${response.status}`);
    const xml = await response.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, limit)
      .map((itemMatch) => {
        const item = itemMatch[1];
        const read = (tag) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || '';
        const rawDescription = read('description');
        return normalizeArticle({
          title: read('title'),
          description: rawDescription,
          source,
          category,
          url: read('link'),
          imageUrl: item.match(/<(?:enclosure|media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1]
            || rawDescription.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
            || '',
          publishedAt: read('pubDate'),
        }, { provider: this.name });
      })
      .filter(Boolean);
  }
}

// Trang Công giáo Việt Nam lớn nhưng KHÔNG phát RSS (đã dò /feed, /rss, /rss.xml,
// wp-json đều không có). Đọc thẳng trang danh sách: lấy link bài + tiêu đề trong
// thẻ <a>. Ngày đăng chỉ lấy được ở nơi nào lộ ra (TGP Sài Gòn nhét ddmmyyyy vào
// tên file ảnh); nơi không có thì để trống chứ không bịa.
const HTML_LISTINGS = Object.freeze([
  {
    source: 'TGP Sài Gòn',
    url: 'https://tgpsaigon.net/',
    origin: 'https://tgpsaigon.net',
    linkPattern: /^\/bai-viet\/[^"']{8,}/,
    datePattern: /MainImages\/(\d{2})(\d{2})(\d{4})_/,
  },
  {
    source: 'HĐGM Việt Nam',
    url: 'https://hdgmvietnam.com/',
    origin: 'https://hdgmvietnam.com',
    linkPattern: /^\/chi-tiet\/[^"']{8,}/,
  },
]);

export function parseHtmlListing(html, config) {
  const found = new Map();
  for (const match of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,600}?)<\/a>/gi)) {
    const [, href, inner] = match;
    if (!config.linkPattern.test(href)) continue;
    const entry = found.get(href) || { href, title: '', publishedAt: null, imageUrl: '' };
    const title = htmlToText(inner);
    // Cùng một bài thường có 2 thẻ <a>: một bọc ảnh (không chữ), một mang tiêu đề.
    if (title.length > entry.title.length) entry.title = title;
    const image = inner.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (image && !entry.imageUrl) entry.imageUrl = image;
    const date = config.datePattern && inner.match(config.datePattern);
    if (date && !entry.publishedAt) {
      const [, day, month, year] = date;
      entry.publishedAt = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
    }
    found.set(href, entry);
  }
  const absolute = (url) => (url.startsWith('http') ? url : `${config.origin}${url}`);
  return [...found.values()]
    .filter((entry) => entry.title.length >= 15)
    .map((entry) => ({
      title: entry.title,
      description: '',
      source: config.source,
      url: absolute(entry.href),
      imageUrl: entry.imageUrl ? absolute(entry.imageUrl) : '',
      publishedAt: entry.publishedAt,
    }));
}

export class CatholicHtmlProvider extends NewsProvider {
  constructor(listings = HTML_LISTINGS) {
    super('catholic-html');
    this.listings = listings;
  }

  async fetchArticles({ language, category, limit }) {
    if (language !== 'vi' || !['catholic', 'all'].includes(category)) return [];
    const settled = await Promise.allSettled(this.listings.map(async (config) => {
      const response = await fetch(config.url, {
        // Trang chủ HTML nặng hơn RSS nhiều — 5.5s là hụt với hdgmvietnam.com.
        signal: AbortSignal.timeout(9000),
        headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' },
      });
      if (!response.ok) throw new Error(`${config.source} trả ${response.status}`);
      const html = (await response.text()).slice(0, 600_000);
      return parseHtmlListing(html, config)
        .slice(0, Math.max(6, Math.ceil(limit / this.listings.length)))
        .map((article) => normalizeArticle({ ...article, category: 'catholic' }, { provider: this.name }))
        .filter(Boolean);
    }));
    return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }
}

export class NewsApiProvider extends NewsProvider {
  constructor(apiKey = process.env.NEWS_API_KEY) {
    super('newsapi');
    this.apiKey = apiKey;
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async fetchArticles({ language, category, limit }) {
    if (!this.isAvailable()) return [];
    const query = CATEGORY_QUERIES[category]?.[language] || CATEGORY_QUERIES.all[language];
    const params = new URLSearchParams({
      q: query,
      sortBy: 'publishedAt',
      pageSize: String(Math.min(limit, 20)),
      page: '1',
    });
    // NewsAPI does not expose a Vietnamese language filter. Keep the
    // Vietnamese query but omit `language` so relevant local sources can
    // still match; use the explicit filter for English.
    if (language === 'en') params.set('language', 'en');
    const payload = await fetchJson(`https://newsapi.org/v2/everything?${params}`, {
      headers: { 'X-Api-Key': this.apiKey },
    });
    return (payload.articles || []).map((article) => normalizeArticle({
      title: article.title,
      description: article.description,
      source: article.source?.name,
      author: article.author,
      category,
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
    }, { provider: this.name })).filter(Boolean);
  }
}

export class ArxivProvider extends NewsProvider {
  constructor() {
    super('arxiv');
  }

  async fetchArticles({ category, limit }) {
    // Chuyên mục Công giáo là tin Giáo hội — nhét paper arXiv vào đó là lạc đề.
    if (['community', 'world', 'catholic'].includes(category)) return [];
    const search = category === 'technology'
      ? 'cat:cs.AI OR cat:cs.HC OR cat:cs.CY'
      : 'all:education OR all:student OR all:learning';
    const params = new URLSearchParams({
      search_query: search,
      start: '0',
      max_results: String(Math.min(limit, 8)),
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });
    const response = await fetch(`https://export.arxiv.org/api/query?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': 'HugoWishpaxStudentPortal/1.0 (student news feed)' },
    });
    if (!response.ok) throw new Error(`arXiv API returned ${response.status}`);
    const xml = await response.text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((entryMatch) => {
      const entry = entryMatch[1];
      const read = (tag) => entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || '';
      const link = entry.match(/<link[^>]+href="([^"]+)"[^>]*rel="alternate"/)?.[1] || read('id');
      return normalizeArticle({
        title: read('title'),
        description: read('summary'),
        source: 'arXiv',
        author: read('name'),
        category: category === 'all' ? 'academic' : category,
        url: link,
        publishedAt: read('published'),
      }, { provider: this.name });
    }).filter(Boolean);
  }
}

// ── Trình đọc: lấy toàn văn + tóm tắt để đọc ngay trong portal ─────────────
const READER_TTL_MS = 6 * 60 * 60 * 1000;   // bài báo không đổi trong ngày
const READER_TIMEOUT_MS = 7000;
const READER_MAX_HTML = 900_000;            // chặn trang khổng lồ ăn băng thông Render
const READER_MAX_CHARS = 80_000;            // đủ cho cả phóng sự dài, vẫn có trần
const READER_MAX_IMAGES = 30;

// Bóc chữ khỏi HTML. Thứ tự ngược với cleanText(): xoá thẻ TRƯỚC rồi mới giải
// mã entity, nếu không `&lt;b&gt;` sẽ biến thành thẻ rồi bị nuốt mất.
function htmlToText(fragment = '') {
  return decodeEntities(String(fragment).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];

// Ảnh giao diện lẫn trong thân bài: avatar tác giả, logo, icon, ảnh mặc định.
const JUNK_IMAGE = /avatar|ava_|author|logo|icon|sprite|placeholder|userdef|blank\.|1x1/i;
// Nút chia sẻ và icon giao diện là .png/.gif tên ngắn (x-x2.png, mail-x2.png).
// Ảnh báo thật luôn là .jpg/.webp, hoặc .png tên băm dài.
const UI_ASSET = /\/[\w-]{1,14}\.(png|gif)(\?|$)/i;
// Ảnh minh hoạ thật luôn rộng vài trăm px; nhỏ hơn là thumbnail tin liên quan.
const MIN_IMAGE_WIDTH = 200;

// Ảnh trong bài hay nằm ở data-src (lazy-load) chứ không phải src — src lúc đó
// chỉ là ảnh placeholder 1×1. Trả URL tuyệt đối để client tải thẳng từ CDN báo.
function imageFrom(tag, baseUrl) {
  const raw = attr(tag, 'data-src') || attr(tag, 'data-original') || attr(tag, 'data-lazy-src')
    || attr(tag, 'src') || attr(tag, 'srcset')?.split(',')[0]?.trim().split(/\s+/)[0];
  // .svg trên trang báo luôn là logo/icon giao diện, không phải ảnh minh hoạ.
  if (!raw || raw.startsWith('data:') || /\.svg(\?|$)/i.test(raw)) return null;
  if (JUNK_IMAGE.test(raw) || UI_ASSET.test(raw)) return null;
  try {
    const url = new URL(decodeHTML(raw), baseUrl || undefined);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    // Bề rộng lộ ra ở thuộc tính, ở query CDN (?w=80) hoặc ở đường dẫn (/zoom/80_80/).
    const width = Number(attr(tag, 'width'))
      || Number(url.searchParams.get('w') || url.searchParams.get('width'))
      || Number(url.pathname.match(/\/(\d{2,4})[x_](\d{2,4})\//)?.[1]);
    if (width && width < MIN_IMAGE_WIDTH) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// ponytail: bóc bài bằng regex trên <p>/<figure>/<img>, không kéo về
// jsdom/readability (≈10MB dependency cho một tính năng đọc). Trang render bằng
// JS sẽ trả rỗng — lúc đó client hiện tóm tắt + nút đọc bài gốc, không bịa nội dung.
// Một lượt matchAll giữ ĐÚNG THỨ TỰ chữ/ảnh như bản gốc, và vì regex nuốt trọn
// <figure> nên <p> chú thích bên trong không bị đếm hai lần.
const BLOCK_RE = /<figure\b[^>]*>([\s\S]*?)<\/figure>|<img\b[^>]*>|<p\b[^>]*>([\s\S]*?)<\/p>/gi;

function blocksIn(scope, baseUrl) {
  const seen = new Set();
  const blocks = [];
  let chars = 0;
  let images = 0;
  for (const [tag, figureInner, paragraphInner] of scope.matchAll(BLOCK_RE)) {
    if (figureInner !== undefined || tag.startsWith('<img') || tag.startsWith('<IMG')) {
      const imgTag = figureInner === undefined ? tag : figureInner.match(/<img\b[^>]*>/i)?.[0];
      const src = imgTag ? imageFrom(imgTag, baseUrl) : null;
      if (!src || seen.has(src) || images >= READER_MAX_IMAGES) continue;
      seen.add(src);
      images += 1;
      const caption = figureInner
        ? htmlToText(figureInner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || '')
        : htmlToText(attr(tag, 'alt') || '');
      blocks.push({ type: 'image', src, caption });
      continue;
    }
    const text = htmlToText(paragraphInner);
    // Dưới 20 ký tự gần như luôn là breadcrumb, nhãn hoặc dòng quảng cáo. Chú
    // thích ảnh đã đi theo <figure> nên không cần ngưỡng cao như trước.
    if (text.length < 20 || seen.has(text)) continue;
    seen.add(text);
    blocks.push({ type: 'text', text });
    chars += text.length;
    if (chars >= READER_MAX_CHARS) break;
  }
  return blocks;
}

const textCount = (blocks) => blocks.filter((block) => block.type === 'text').length;

// Ảnh đứng sau đoạn văn CUỐI CÙNG luôn là chùm thumbnail "tin liên quan" ở chân
// trang, không phải minh hoạ của bài. Ảnh mở đầu (trước đoạn đầu) thì giữ.
function trimTrailingImages(blocks) {
  let end = blocks.length;
  while (end > 0 && blocks[end - 1].type === 'image') end -= 1;
  return blocks.slice(0, end);
}

export function extractBlocks(html = '', baseUrl = '') {
  const cleaned = String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|form|iframe|aside)\b[\s\S]*?<\/\1>/gi, ' ');

  // Phải lấy <article> LỚN NHẤT: lấy cái đầu tiên là dính thẻ tin liên quan —
  // Tuổi Trẻ xếp 11 thẻ <article> nhỏ (~2.6KB) trước phần thân bài, nên bản cũ
  // trả về 0 đoạn cho mọi bài của họ.
  const articles = [...cleaned.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => m[0]);
  const biggest = articles.sort((a, b) => b.length - a.length)[0];

  const scoped = biggest ? blocksIn(biggest, baseUrl) : [];
  if (textCount(scoped) >= 3) return trimTrailingImages(scoped);
  // Dưới 3 đoạn nghĩa là khung <article> không phải thân bài — bóc lại cả trang.
  const whole = blocksIn(cleaned, baseUrl);
  return trimTrailingImages(textCount(whole) > textCount(scoped) ? whole : scoped);
}

function splitSentences(text = '', max = 3) {
  return String(text)
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)
    .slice(0, max);
}

export class StudentNewsService {
  constructor(providers = [
    new GNewsProvider(),
    new NewsApiProvider(),
    new PublisherRssProvider(),
    new CatholicHtmlProvider(),
    new ArxivProvider(),
  ]) {
    this.providers = providers;
    this.cache = new Map();
    this.readerCache = new Map();
  }

  // Client chỉ gửi id — server tự tra ra URL. Nhờ vậy endpoint đọc bài KHÔNG
  // bao giờ fetch một URL do người dùng đưa vào (không có cửa cho SSRF).
  async findArticleById(id, options = {}) {
    const wanted = String(id || '').trim();
    if (!wanted) return null;
    const scan = () => {
      for (const entry of this.cache.values()) {
        const hit = entry.articles.find((article) => article.id === wanted);
        if (hit) return hit;
      }
      return null;
    };
    const hit = scan();
    if (hit) return hit;
    // Cache trống sau khi service khởi động lại: nạp đúng chuyên mục người dùng
    // đang xem, rồi mới thử "all".
    await this.getFeed({ ...options, limit: MAX_ARTICLES });
    if (options.category && options.category !== 'all') {
      const found = scan();
      if (found) return found;
      await this.getFeed({ ...options, category: 'all', limit: MAX_ARTICLES });
    }
    return scan();
  }

  async readArticle(article) {
    const cached = this.readerCache.get(article.id);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    let blocks = [];
    try {
      const response = await fetch(article.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(READER_TIMEOUT_MS),
        headers: { 'User-Agent': 'HugoWishpaxStudentPortal/1.0 (reader)', Accept: 'text/html' },
      });
      if (response.ok) {
        // response.url = URL sau redirect: ảnh tương đối phải nối vào đó mới đúng.
        blocks = extractBlocks((await response.text()).slice(0, READER_MAX_HTML), response.url);
      }
    } catch {
      // Nguồn chặn bot / quá chậm: vẫn trả tóm tắt, người đọc bấm sang bài gốc.
    }

    const paragraphs = blocks.filter((block) => block.type === 'text').map((block) => block.text);
    const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    const value = {
      blocks,
      readMinutes: words ? Math.max(1, Math.round(words / 200)) : 0,
      available: paragraphs.length > 0,
    };
    this.readerCache.set(article.id, { value, expiresAt: Date.now() + READER_TTL_MS });
    if (this.readerCache.size > 120) {
      for (const [key, entry] of this.readerCache) {
        if (entry.expiresAt <= Date.now()) this.readerCache.delete(key);
      }
    }
    return value;
  }

  // ponytail: KHÔNG gọi AI ở đây. Mọi nguồn RSS đều đã kèm sapo do chính toà
  // soạn viết — dùng lại `article.description` là đủ tóm tắt và tốn 0 token.
  // Chỉ khi nào sapo rỗng mới lấy tạm 2 câu đầu của bài.
  summarizeArticle(article, content) {
    const points = article.description
      ? [article.description]
      : splitSentences(
        content.blocks.filter((block) => block.type === 'text').map((block) => block.text).join(' '),
        2,
      );
    return { points, by: 'source' };
  }

  async getFeed({
    language = 'vi',
    category = 'all',
    country = 'VN',
    timeZone = 'Asia/Ho_Chi_Minh',
    page = 1,
    limit = 12,
  } = {}) {
    const normalizedLanguage = language === 'en' ? 'en' : 'vi';
    const normalizedCategory = CATEGORY_QUERIES[category] ? category : 'all';
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(MAX_ARTICLES, Math.max(1, Number(limit) || 12));
    // Chỉ có hai ấn bản (vi/en) nên chỉ nhận hai mã quốc gia. Nếu để mã tuỳ ý
    // vào cache key thì 676 mã × 5 category × 2 ngôn ngữ vượt xa giới hạn cache
    // 80 phần tử → miss liên tục, mỗi miss là một lượt fan-out 4 provider và
    // đốt quota GNews (100 req/ngày).
    const normalizedCountry = EDITION_COUNTRIES.has(String(country).toUpperCase())
      ? String(country).toUpperCase()
      : (normalizedLanguage === 'vi' ? 'VN' : 'US');
    const edition = getDailyEdition(new Date(), timeZone);
    const cacheKey = `${normalizedCountry}:${normalizedLanguage}:${normalizedCategory}:${edition.edition}`;
    const cached = this.cache.get(cacheKey);

    let articles;
    let providerStatus;
    if (cached && cached.expiresAt > Date.now()) {
      ({ articles, providerStatus } = cached);
    } else {
      const available = this.providers.filter((provider) => provider.isAvailable());
      const settled = await Promise.allSettled(
        available.map((provider) => provider.fetchArticles({
          language: normalizedLanguage,
          category: normalizedCategory,
          country: normalizedCountry,
          limit: MAX_ARTICLES,
        })),
      );
      providerStatus = settled.map((result, index) => ({
        name: available[index].name,
        status: result.status === 'fulfilled' ? 'available' : 'unavailable',
      }));
      const merged = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
      // Dedupe theo tiêu đề, không theo URL: cùng một tin qua hai nguồn có URL
      // khác nhau. Bản có ảnh được ưu tiên giữ lại.
      const byTitle = new Map();
      for (const article of merged) {
        const key = article.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
        const kept = byTitle.get(key);
        if (!kept || (!kept.imageUrl && article.imageUrl)) byTitle.set(key, article);
      }
      const at = (article) => {
        const time = article.publishedAt ? new Date(article.publishedAt).getTime() : NaN;
        return Number.isNaN(time) ? -Infinity : time; // không rõ ngày thì xếp cuối
      };
      const deduplicated = [...byTitle.values()].sort((a, b) => at(b) - at(a));
      articles = deduplicated.length
        ? deduplicated
        : FALLBACK_ARTICLES[normalizedLanguage].map((article) => normalizeArticle(article, { provider: 'fallback' }));
      this.cache.set(cacheKey, {
        articles,
        providerStatus,
        expiresAt: Date.now() + FEED_REFRESH_MS,
      });
      if (this.cache.size > 80) {
        for (const [key, value] of this.cache) {
          if (value.expiresAt <= Date.now()) this.cache.delete(key);
        }
      }
    }

    const start = (normalizedPage - 1) * normalizedLimit;
    return {
      items: articles.slice(start, start + normalizedLimit),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total: articles.length,
        hasNextPage: start + normalizedLimit < articles.length,
      },
      meta: {
        category: normalizedCategory,
        language: normalizedLanguage,
        country: normalizedCountry,
        edition: edition.edition,
        resetHour: edition.resetHour,
        timeZone: edition.timeZone,
        nextResetAt: edition.nextResetAt,
        secondsUntilReset: edition.secondsUntilReset,
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds: edition.secondsUntilReset,
        providers: providerStatus,
      },
    };
  }
}

export const studentNewsService = new StudentNewsService();
