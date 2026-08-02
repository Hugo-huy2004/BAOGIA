import crypto from 'crypto';

const REQUEST_TIMEOUT_MS = 5500;
const MAX_ARTICLES = 30;
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

function cleanText(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, ' ')
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
    publishedAt: article.publishedAt || new Date().toISOString(),
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
    ],
    technology: [
      ['VnExpress', 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss'],
    ],
    community: [
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/nhip-song-tre.rss'],
      ['VnExpress', 'https://vnexpress.net/rss/giao-duc.rss'],
    ],
    world: [
      ['VnExpress', 'https://vnexpress.net/rss/the-gioi.rss'],
    ],
    all: [
      ['VnExpress', 'https://vnexpress.net/rss/giao-duc.rss'],
      ['VnExpress', 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss'],
      ['Tuổi Trẻ', 'https://tuoitre.vn/rss/giao-duc.rss'],
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
    all: [
      ['BBC News', 'https://feeds.bbci.co.uk/news/education/rss.xml'],
      ['BBC News', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'],
      ['The Guardian', 'https://www.theguardian.com/science/rss'],
      ['Ars Technica', 'https://feeds.arstechnica.com/arstechnica/technology-lab'],
      ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
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
      headers: { 'User-Agent': 'HugoWishpaxStudentPortal/1.0 (student news edition)' },
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
    if (category === 'community' || category === 'world') return [];
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
const READER_MAX_HTML = 600_000;            // chặn trang khổng lồ ăn băng thông Render
const READER_MAX_CHARS = 24_000;

// Bóc chữ khỏi HTML. Thứ tự ngược với cleanText(): xoá thẻ TRƯỚC rồi mới giải
// mã entity, nếu không `&lt;b&gt;` sẽ biến thành thẻ rồi bị nuốt mất.
function htmlToText(fragment = '') {
  return String(fragment)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&hellip;/gi, '…')
    .replace(/&[mn]dash;/gi, '–')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

// ponytail: bóc bài bằng regex trên <p>, không kéo về jsdom/readability (≈10MB
// dependency cho một tính năng đọc). Trang render bằng JS sẽ trả rỗng — lúc đó
// client hiện tóm tắt + nút đọc bài gốc, không bịa nội dung.
export function extractParagraphs(html = '') {
  const cleaned = String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|form|iframe|figcaption|aside)\b[\s\S]*?<\/\1>/gi, ' ');
  const scope = cleaned.match(/<article\b[\s\S]*?<\/article>/i)?.[0] || cleaned;
  const seen = new Set();
  const paragraphs = [];
  let total = 0;
  for (const match of scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = htmlToText(match[1]);
    // Dưới 40 ký tự gần như luôn là caption ảnh, breadcrumb hoặc dòng quảng cáo.
    if (text.length < 40 || seen.has(text)) continue;
    seen.add(text);
    paragraphs.push(text);
    total += text.length;
    if (total >= READER_MAX_CHARS) break;
  }
  return paragraphs;
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

    let paragraphs = [];
    try {
      const response = await fetch(article.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(READER_TIMEOUT_MS),
        headers: { 'User-Agent': 'HugoWishpaxStudentPortal/1.0 (reader)', Accept: 'text/html' },
      });
      if (response.ok) {
        paragraphs = extractParagraphs((await response.text()).slice(0, READER_MAX_HTML));
      }
    } catch {
      // Nguồn chặn bot / quá chậm: vẫn trả tóm tắt, người đọc bấm sang bài gốc.
    }

    const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    const value = {
      paragraphs,
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
      : splitSentences(content.paragraphs.join(' '), 2);
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
      const deduplicated = [...byTitle.values()]
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      articles = deduplicated.length
        ? deduplicated
        : FALLBACK_ARTICLES[normalizedLanguage].map((article) => normalizeArticle(article, { provider: 'fallback' }));
      this.cache.set(cacheKey, {
        articles,
        providerStatus,
        expiresAt: new Date(edition.nextResetAt).getTime() + 60 * 1000,
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
