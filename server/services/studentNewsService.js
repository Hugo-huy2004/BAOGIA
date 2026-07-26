import crypto from 'crypto';

const REQUEST_TIMEOUT_MS = 5500;
const MAX_ARTICLES = 30;

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
      publishedAt: article.publishedAt,
    }, { provider: this.name })).filter(Boolean);
  }
}

export class GoogleNewsRssProvider extends NewsProvider {
  constructor() {
    super('google-news-rss');
  }

  async fetchArticles({ language, category, country, limit }) {
    const normalizedCountry = /^[A-Z]{2}$/.test(country || '') ? country : (language === 'vi' ? 'VN' : 'US');
    const normalizedLanguage = language === 'vi' ? 'vi' : 'en';
    const query = CATEGORY_QUERIES[category]?.[language] || CATEGORY_QUERIES.all[language];
    const params = new URLSearchParams({
      q: query,
      hl: normalizedLanguage === 'vi' ? 'vi' : `en-${normalizedCountry}`,
      gl: normalizedCountry,
      ceid: `${normalizedCountry}:${normalizedLanguage}`,
    });
    const response = await fetch(`https://news.google.com/rss/search?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': 'HugoWishpaxStudentPortal/1.0 (student news edition)' },
    });
    if (!response.ok) throw new Error(`Google News RSS returned ${response.status}`);
    const xml = await response.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, limit)
      .map((itemMatch) => {
        const item = itemMatch[1];
        const read = (tag) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || '';
        const source = cleanText(read('source')) || 'Google News';
        const rawTitle = cleanText(read('title'));
        const sourceSuffix = ` - ${source}`;
        const title = rawTitle.endsWith(sourceSuffix)
          ? rawTitle.slice(0, -sourceSuffix.length)
          : rawTitle;
        return normalizeArticle({
          title,
          // RSS descriptions are publisher-link HTML rather than editorial
          // summaries. The reader supplies a localized no-summary message
          // instead of exposing raw markup.
          description: '',
          source,
          category,
          url: read('link'),
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

export class StudentNewsService {
  constructor(providers = [
    new GNewsProvider(),
    new NewsApiProvider(),
    new GoogleNewsRssProvider(),
    new ArxivProvider(),
  ]) {
    this.providers = providers;
    this.cache = new Map();
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
    const normalizedCountry = /^[A-Z]{2}$/.test(String(country).toUpperCase())
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
      const deduplicated = [...new Map(merged.map((article) => [article.url, article])).values()]
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
