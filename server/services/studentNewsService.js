import crypto from 'crypto';
import { decodeHTML } from 'entities';

const REQUEST_TIMEOUT_MS = 5500;
// Khai đúng danh tính và để lại địa chỉ liên hệ. Trước đây chỗ này giả UA của
// Chrome để lách 403 — nghĩa là cố tình vượt qua rào chặn bot của toà soạn.
// Nếu một nguồn chặn UA này thì đó là câu trả lời "không", không phải lỗi kỹ
// thuật cần né: bỏ nguồn đó ra khỏi danh sách.
// HTTP header chỉ nhận ByteString; giữ User-Agent ASCII để Node không ném
// TypeError trước cả khi request được gửi đi.
const BROWSER_UA = 'HugoWishpaxStudentPortal/1.0 (+https://www.hugowishpax.studio; public-feed-reader)';
// Kho bài đủ sâu để cuộn vô hạn: client tải một lần rồi tự hé dần theo cuộn,
// rẻ hơn nhiều so với phân trang (mỗi trang là một lượt request).
const MAX_ARTICLES = 180;
// Ấn bản vẫn tính theo ngày (để đặt tên bản tin), nhưng nội dung làm mới mỗi
// 10 phút để tin nóng chảy vào. Không có key GNews/NewsAPI nên chỉ đọc RSS —
// làm mới dày cỡ này không đụng hạn mức nào.
const FEED_REFRESH_MS = 10 * 60 * 1000;
const SUPPORTED_LANGUAGES = new Set(['vi', 'en', 'zh', 'th', 'ja', 'ko', 'id', 'es', 'fr']);
// TODAY có đúng một ấn bản cho mỗi ngôn ngữ của ứng dụng. Đổi ngôn ngữ đồng
// nghĩa đổi thị trường tin; IP không được phép tạo ra một cặp lệch như vi-US.
// `domains` là hàng rào cuối cho cả RSS lẫn API bên thứ ba.
export const NEWS_EDITIONS = Object.freeze({
  vi: Object.freeze({ country: 'VN', locale: 'vi-VN', timeZone: 'Asia/Ho_Chi_Minh', domains: ['vnexpress.net', 'tuoitre.vn', 'thanhnien.vn', 'dantri.com.vn', 'vietnamnet.vn', 'dcctvn.org', 'gpcantho.com', 'tonggiaophanhanoi.org', 'tntt.vn', 'tgpsaigon.net', 'hdgmvietnam.com'] }),
  en: Object.freeze({ country: 'US', locale: 'en-US', timeZone: 'America/New_York', domains: ['npr.org', 'nytimes.com', 'catholicnewsagency.com'] }),
  zh: Object.freeze({ country: 'CN', locale: 'zh-CN', timeZone: 'Asia/Shanghai', domains: ['people.com.cn', 'news.cn', 'xinhuanet.com'] }),
  th: Object.freeze({ country: 'TH', locale: 'th-TH', timeZone: 'Asia/Bangkok', domains: ['thailand.go.th', 'tmd.go.th', 'thaipbs.or.th', 'mdes.go.th'] }),
  ja: Object.freeze({ country: 'JP', locale: 'ja-JP', timeZone: 'Asia/Tokyo', domains: ['nhk.or.jp'] }),
  ko: Object.freeze({ country: 'KR', locale: 'ko-KR', timeZone: 'Asia/Seoul', domains: ['korea.kr', 'yonhapnewstv.co.kr', 'yna.co.kr'] }),
  id: Object.freeze({ country: 'ID', locale: 'id-ID', timeZone: 'Asia/Jakarta', domains: ['antaranews.com'] }),
  es: Object.freeze({ country: 'ES', locale: 'es-ES', timeZone: 'Europe/Madrid', domains: ['rtve.es', 'elpais.com'] }),
  fr: Object.freeze({ country: 'FR', locale: 'fr-FR', timeZone: 'Europe/Paris', domains: ['france24.com', 'lemonde.fr', 'radiofrance.fr'] }),
});

export function resolveNewsEdition(language = 'en') {
  const code = String(language || '').toLowerCase().split('-')[0];
  const normalized = NEWS_EDITIONS[code] ? code : 'en';
  return { language: normalized, ...NEWS_EDITIONS[normalized] };
}

function domainBelongsToEdition(value, edition) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    return edition.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function articleBelongsToEdition(article, language) {
  return domainBelongsToEdition(article?.url, resolveNewsEdition(language));
}

export function diversifyArticles(articles = []) {
  const queues = new Map();
  for (const article of articles) {
    const source = article.source || 'News';
    if (!queues.has(source)) queues.set(source, []);
    queues.get(source).push(article);
  }
  const result = [];
  while (result.length < articles.length) {
    let added = false;
    for (const queue of queues.values()) {
      const article = queue.shift();
      if (!article) continue;
      result.push(article);
      added = true;
    }
    if (!added) break;
  }
  return result;
}

const CATEGORY_QUERIES = Object.freeze({
  all: {
    vi: 'giáo dục OR học sinh OR sinh viên OR khoa học OR công nghệ',
    en: 'education OR students OR science OR technology',
    zh: '教育 OR 学生 OR 科学 OR 技术',
    th: 'การศึกษา OR นักเรียน OR วิทยาศาสตร์ OR เทคโนโลยี',
    ja: '教育 OR 学生 OR 科学 OR テクノロジー',
    ko: '교육 OR 학생 OR 과학 OR 기술',
    id: 'pendidikan OR pelajar OR sains OR teknologi',
    es: 'educación OR estudiantes OR ciencia OR tecnología',
    fr: 'éducation OR étudiants OR science OR technologie',
  },
  academic: {
    vi: 'giáo dục OR nghiên cứu OR học bổng OR đại học',
    en: 'education OR research OR scholarship OR university',
    zh: '教育 OR 研究 OR 奖学金 OR 大学', th: 'การศึกษา OR วิจัย OR ทุนการศึกษา OR มหาวิทยาลัย',
    ja: '教育 OR 研究 OR 奨学金 OR 大学', ko: '교육 OR 연구 OR 장학금 OR 대학',
    id: 'pendidikan OR riset OR beasiswa OR universitas', es: 'educación OR investigación OR becas OR universidad',
    fr: 'éducation OR recherche OR bourse OR université',
  },
  technology: {
    vi: 'công nghệ OR trí tuệ nhân tạo OR lập trình',
    en: 'technology OR artificial intelligence OR programming',
    zh: '技术 OR 人工智能 OR 编程', th: 'เทคโนโลยี OR ปัญญาประดิษฐ์ OR การเขียนโปรแกรม',
    ja: 'テクノロジー OR 人工知能 OR プログラミング', ko: '기술 OR 인공지능 OR 프로그래밍',
    id: 'teknologi OR kecerdasan buatan OR pemrograman', es: 'tecnología OR inteligencia artificial OR programación',
    fr: 'technologie OR intelligence artificielle OR programmation',
  },
  community: {
    vi: 'học sinh OR sinh viên OR cộng đồng OR tình nguyện',
    en: 'students OR campus OR community OR volunteering',
    zh: '学生 OR 校园 OR 社区 OR 志愿服务', th: 'นักเรียน OR มหาวิทยาลัย OR ชุมชน OR อาสาสมัคร',
    ja: '学生 OR キャンパス OR 地域 OR ボランティア', ko: '학생 OR 캠퍼스 OR 지역사회 OR 자원봉사',
    id: 'pelajar OR kampus OR komunitas OR relawan', es: 'estudiantes OR campus OR comunidad OR voluntariado',
    fr: 'étudiants OR campus OR communauté OR bénévolat',
  },
  world: {
    vi: 'thời sự quốc tế OR khoa học thế giới',
    en: 'world news OR global science',
    zh: '国际新闻 OR 全球科学', th: 'ข่าวต่างประเทศ OR วิทยาศาสตร์โลก',
    ja: '国際ニュース OR 世界の科学', ko: '국제 뉴스 OR 세계 과학', id: 'berita dunia OR sains global',
    es: 'noticias internacionales OR ciencia mundial', fr: 'actualité internationale OR science mondiale',
  },
  catholic: {
    vi: 'Giáo hội Công giáo OR Vatican OR giáo phận',
    en: 'Catholic Church OR Vatican OR diocese',
    zh: '天主教会 OR 梵蒂冈 OR 教区', th: 'คริสตจักรคาทอลิก OR วาติกัน OR สังฆมณฑล',
    ja: 'カトリック教会 OR バチカン OR 教区', ko: '가톨릭 교회 OR 바티칸 OR 교구',
    id: 'Gereja Katolik OR Vatikan OR keuskupan', es: 'Iglesia católica OR Vaticano OR diócesis',
    fr: 'Église catholique OR Vatican OR diocèse',
  },
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

function truncateAtBoundary(value, max) {
  const clean = cleanText(value);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > max * 0.7 ? slice.slice(0, lastSpace) : slice).trim()}…`;
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
function stableId(article) {
  return crypto
    .createHash('sha256')
    .update(`${article.url}|${article.title}`)
    .digest('hex')
    .slice(0, 18);
}

const EU_PRESS_COUNTRIES = new Set(['FR', 'ES', 'BE']);

export function resolveNewsPolicy(country = 'US') {
  const code = String(country || 'US').toUpperCase();
  if (EU_PRESS_COUNTRIES.has(code)) {
    return {
      id: 'eu-press-publication',
      jurisdiction: code,
      fullTextRule: 'explicit-license-only',
      excerptRule: 'publisher-supplied-or-very-short',
      headlineMaxChars: 180,
      excerptMaxChars: 180,
      attributionRequired: true,
      publisherImagesInPortal: false,
      originalLinkRequired: true,
    };
  }
  if (code === 'US') {
    return {
      id: 'us-contextual-fair-use',
      jurisdiction: code,
      fullTextRule: 'explicit-license-only',
      excerptRule: 'publisher-supplied-or-contextual-fair-use',
      headlineMaxChars: 240,
      excerptMaxChars: 320,
      attributionRequired: true,
      publisherImagesInPortal: false,
      originalLinkRequired: true,
    };
  }
  return {
    id: 'berne-source-first',
    jurisdiction: code,
    fullTextRule: 'explicit-license-only',
    excerptRule: 'publisher-supplied-or-purpose-limited',
    headlineMaxChars: 220,
    excerptMaxChars: 260,
    attributionRequired: true,
    publisherImagesInPortal: false,
    originalLinkRequired: true,
  };
}

function contentAccessFor(provider) {
  if (provider === 'arxiv') {
    return {
      mode: 'open-summary',
      fullTextInPortal: true,
      rightsBasis: 'open-research-abstract',
    };
  }
  if (['publisher-rss', 'publisher-json'].includes(provider)) {
    return {
      mode: 'publisher-summary',
      fullTextInPortal: false,
      rightsBasis: 'publisher-supplied-feed',
    };
  }
  if (provider === 'catholic-html') {
    return {
      mode: 'headline-link',
      fullTextInPortal: false,
      rightsBasis: 'link-only',
    };
  }
  return {
    mode: 'licensed-excerpt',
    fullTextInPortal: false,
    rightsBasis: 'provider-api',
  };
}

function normalizeArticle(article, defaults = {}) {
  const url = safeUrl(article.url);
  const title = cleanText(article.title);
  if (!url || !title) return null;
  const provider = defaults.provider || article.provider || 'api';
  const access = contentAccessFor(provider);
  // RSS/API descriptions are publisher-supplied syndication fields. Preserve
  // them as completely as practical; the limit is a payload-safety ceiling,
  // not an invented copyright word count. Full article text remains gated by
  // an explicit source grant in readArticle().
  const descriptionLimit = access.mode === 'headline-link' ? 0 : 4_000;
  const normalized = {
    id: '',
    title: title.slice(0, 240),
    description: cleanText(article.description).slice(0, descriptionLimit),
    source: cleanText(article.source || defaults.source || 'News').slice(0, 80),
    author: cleanText(article.author).slice(0, 100),
    category: article.category || defaults.category || 'academic',
    url,
    // KHÔNG gửi ảnh của toà soạn xuống client. Ảnh trong RSS thường thuộc về
    // phóng viên hoặc hãng thông tấn (TTXVN, AFP, Reuters) chứ không phải toà
    // soạn, nên việc feed có ảnh không phải là giấy phép cho mình hiển thị nó ở
    // nơi khác — chưa kể mỗi lượt hiển thị là một lượt ăn băng thông của họ.
    // Thẻ bài dùng ô icon theo chuyên mục; xem MemberTodayTab.jsx.
    // null nghĩa là "không biết ngày" — thà bỏ trống còn hơn gán giờ hiện tại
    // rồi đẩy bài cũ lên đầu bản tin.
    publishedAt: article.publishedAt === null
      ? null
      : (article.publishedAt || new Date().toISOString()),
    provider,
    language: defaults.language || article.language || '',
    country: defaults.country || article.country || '',
    contentAccess: access,
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
    const gnewsLanguage = new Set(['ar', 'zh', 'nl', 'en', 'fr', 'de', 'el', 'he', 'hi', 'it', 'ja', 'ml', 'mr', 'no', 'pt', 'ro', 'ru', 'es', 'sv', 'ta', 'te', 'uk']);
    const params = new URLSearchParams({
      q: query,
      max: String(Math.min(limit, 10)),
      sortby: 'publishedAt',
      apikey: this.apiKey,
    });
    if (gnewsLanguage.has(language)) params.set('lang', language);
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
    }, { provider: this.name, language, country })).filter(Boolean);
  }
}

// RSS trực tiếp của toà soạn, không đi qua news.google.com: có ảnh thật, có
// tóm tắt thật và link gốc (feed tìm kiếm của Google News không có cả ba).
// Ảnh nằm ở <enclosure>/<media:*> hoặc thẻ <img> đầu trong description.
export const PUBLISHER_FEEDS = Object.freeze({
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
  // English trong bộ ngôn ngữ hiện tại là en-US, nên chỉ dùng toà soạn Mỹ.
  en: {
    academic: [
      ['NPR', 'https://feeds.npr.org/1013/rss.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/Education.xml'],
    ],
    technology: [
      ['NPR', 'https://feeds.npr.org/1019/rss.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml'],
    ],
    community: [
      ['NPR', 'https://feeds.npr.org/1003/rss.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml'],
    ],
    world: [
      ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
    ],
    catholic: [
      ['Catholic News Agency', 'https://www.catholicnewsagency.com/rss/news.xml'],
    ],
    all: [
      ['NPR', 'https://feeds.npr.org/1001/rss.xml'],
      ['NPR', 'https://feeds.npr.org/1013/rss.xml'],
      ['NPR', 'https://feeds.npr.org/1019/rss.xml'],
      ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml'],
      ['The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'],
    ],
  },
  zh: {
    academic: [
      ['人民网', 'http://www.people.com.cn/rss/edu.xml'],
      ['人民网', 'http://www.people.com.cn/rss/scitech.xml'],
    ],
    technology: [
      ['人民网', 'http://www.people.com.cn/rss/scitech.xml'],
      ['人民网', 'http://www.people.com.cn/rss/it.xml'],
    ],
    community: [
      ['人民网', 'http://www.people.com.cn/rss/society.xml'],
    ],
    world: [
      ['人民网', 'http://www.people.com.cn/rss/world.xml'],
    ],
    all: [
      ['人民网', 'http://www.people.com.cn/rss/ywkx.xml'],
      ['人民网', 'http://www.people.com.cn/rss/society.xml'],
      ['人民网', 'http://www.people.com.cn/rss/scitech.xml'],
      ['人民网', 'http://www.people.com.cn/rss/edu.xml'],
    ],
  },
  ja: {
    all: [
      ['NHK NEWS WEB', 'https://www3.nhk.or.jp/rss/news/cat0.xml'],
    ],
  },
  ko: {
    technology: [
      ['연합뉴스TV', 'https://www.yonhapnewstv.co.kr/category/news/economy/feed/'],
    ],
    community: [
      ['연합뉴스TV', 'https://www.yonhapnewstv.co.kr/category/news/society/feed/'],
      ['연합뉴스TV', 'https://www.yonhapnewstv.co.kr/category/news/local/feed/'],
    ],
    world: [
      ['연합뉴스TV', 'https://www.yonhapnewstv.co.kr/category/news/international/feed/'],
    ],
    all: [
      ['대한민국 정책브리핑', 'https://www.korea.kr/rss/policy.xml'],
      ['연합뉴스TV', 'https://www.yonhapnewstv.co.kr/browse/feed/'],
    ],
  },
  id: {
    academic: [['ANTARA', 'https://www.antaranews.com/rss/humaniora.xml']],
    technology: [['ANTARA', 'https://www.antaranews.com/rss/tekno.xml']],
    world: [['ANTARA', 'https://www.antaranews.com/rss/dunia.xml']],
    all: [
      ['ANTARA', 'https://www.antaranews.com/rss/terkini.xml'],
      ['ANTARA', 'https://www.antaranews.com/rss/top-news.xml'],
    ],
  },
  es: {
    technology: [
      ['RTVE', 'https://www.rtve.es/api/noticias/ciencia-tecnologia.xml'],
    ],
    community: [
      ['RTVE', 'https://www.rtve.es/api/noticias/espana.xml'],
    ],
    world: [
      ['RTVE', 'https://www.rtve.es/api/noticias/mundo.xml'],
    ],
    all: [
      ['RTVE', 'https://www.rtve.es/api/noticias.xml'],
      ['El País', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada'],
    ],
  },
  fr: {
    academic: [['Le Monde', 'https://www.lemonde.fr/education/rss_full.xml']],
    technology: [['Le Monde', 'https://www.lemonde.fr/pixels/rss_full.xml']],
    world: [['Le Monde', 'https://www.lemonde.fr/international/rss_full.xml']],
    all: [
      ['France 24', 'https://www.france24.com/fr/rss'],
      ['Le Monde', 'https://www.lemonde.fr/rss/une.xml'],
    ],
  },
});

export class PublisherRssProvider extends NewsProvider {
  constructor(feeds = PUBLISHER_FEEDS) {
    super('publisher-rss');
    this.feeds = feeds;
  }

  async fetchArticles({ language, category, limit }) {
    const languageFeeds = this.feeds[language] || {};
    // Không lấy feed tổng rồi gắn nhãn thành một chuyên mục khác: đó là sai
    // ngữ nghĩa và làm người đọc tưởng tin xã hội là công nghệ/Công giáo.
    const feeds = languageFeeds[category] || (category === 'all' ? languageFeeds.all : []) || [];
    if (!feeds.length) return [];
    const perFeed = Math.max(8, Math.ceil(limit / Math.max(1, feeds.length)));
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
          author: read('dc:creator') || read('author'),
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

export const PUBLISHER_JSON_FEEDS = Object.freeze({
  th: Object.freeze({
    source: 'Thai PBS',
    url: 'https://www.thaipbs.or.th/api/public/page/v1/pages/path:news/content',
  }),
});

function thaiPbsCategory(article = {}) {
  const category = `${article.category || ''} ${article.categoryUrl || ''}`.toLowerCase();
  if (/education|academic|การศึกษา|มหาวิทยาลัย|นักเรียน|วิจัย/.test(category)) return 'academic';
  if (/science|technology|tech|วิทยาศาสตร์|เทคโนโลยี|ดิจิทัล/.test(category)) return 'technology';
  if (/world|international|ต่างประเทศ/.test(category)) return 'world';
  return 'community';
}

// API trang tin chính thức của Thai PBS trả cùng một bài trong nhiều section.
// Gom và loại trùng theo URL trước khi đưa vào pipeline chung.
export function parseThaiPbsPayload(payload, category = 'all') {
  const found = new Map();
  for (const section of payload?.sections || []) {
    for (const item of section?.data || []) {
      const url = String(item?.url || '');
      if (!url.includes('/news/content/')) continue;
      const normalizedCategory = thaiPbsCategory(item);
      if (category !== 'all' && normalizedCategory !== category) continue;
      const absoluteUrl = url.startsWith('http') ? url : `https://www.thaipbs.or.th${url}`;
      if (!found.has(absoluteUrl)) {
        found.set(absoluteUrl, {
          title: item.title,
          description: item.description,
          source: 'Thai PBS',
          category: normalizedCategory,
          url: absoluteUrl,
          publishedAt: item.date || null,
        });
      }
    }
  }
  return [...found.values()];
}

export class PublisherJsonProvider extends NewsProvider {
  constructor() {
    super('publisher-json');
  }

  async fetchArticles({ language, category, country, limit }) {
    const config = PUBLISHER_JSON_FEEDS[language];
    if (!config || category === 'catholic') return [];
    const payload = await fetchJson(config.url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
    });
    return parseThaiPbsPayload(payload, category)
      .slice(0, limit)
      .map((article) => normalizeArticle(article, {
        provider: this.name,
        language,
        country,
      }))
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

  async fetchArticles({ language, category, country, limit }) {
    if (!this.isAvailable()) return [];
    const query = CATEGORY_QUERIES[category]?.[language] || CATEGORY_QUERIES.all[language];
    const params = new URLSearchParams({
      q: query,
      sortBy: 'publishedAt',
      pageSize: String(Math.min(limit, 100)),
      page: '1',
    });
    const newsApiLanguages = new Set(['ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'sv', 'ud', 'zh']);
    if (newsApiLanguages.has(language)) params.set('language', language);
    params.set('domains', resolveNewsEdition(language).domains.join(','));
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
    }, { provider: this.name, language, country })).filter(Boolean);
  }
}

export class ArxivProvider extends NewsProvider {
  constructor() {
    super('arxiv');
  }

  async fetchArticles({ language, category, limit }) {
    if (language !== 'en') return [];
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
// Nguồn được phép dựng nội dung trong portal. CHỈ có arXiv, và chỉ vì `url` của
// arXiv là trang /abs — thứ bóc được ở đó là phần tóm tắt (abstract) mà arXiv
// phát công khai, không phải toàn văn bài báo. ĐỪNG trỏ sang link PDF: giấy
// phép mặc định của arXiv chỉ cho phép arXiv phân phối bài, không cấp quyền
// đăng lại cho bên thứ ba. Mọi toà soạn khác: sapo + link bài gốc — xem
// readArticle().
const FULL_TEXT_SOURCES = new Set(['arXiv']);

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
    new PublisherJsonProvider(),
    new PublisherRssProvider(),
    new CatholicHtmlProvider(),
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
    const edition = resolveNewsEdition(options.language);
    const editionPrefix = `${edition.country}:${edition.language}:`;
    const scan = () => {
      for (const [cacheKey, entry] of this.cache) {
        if (!cacheKey.startsWith(editionPrefix)) continue;
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
    // Chỉ dựng lại toàn văn với nguồn TRUY CẬP MỞ. RSS của toà soạn chỉ cấp
    // tiêu đề + sapo + link; dựng lại cả bài trong portal là sao chép và truyền
    // đạt tác phẩm (Điều 20 Luật SHTT), đồng thời cắt mất quảng cáo của họ.
    // Muốn thêm nguồn vào danh sách này thì phải có giấy phép của toà soạn —
    // đọc được không có nghĩa là được phép đăng lại.
    if (!FULL_TEXT_SOURCES.has(article.source) || article.contentAccess?.fullTextInPortal === false) {
      return {
        blocks: [],
        readMinutes: 0,
        available: false,
        policy: article.contentAccess || contentAccessFor(article.provider),
      };
    }

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
    page = 1,
    limit = 12,
  } = {}) {
    const languageCandidate = String(language || '').toLowerCase().split('-')[0];
    const editionProfile = resolveNewsEdition(
      SUPPORTED_LANGUAGES.has(languageCandidate) ? languageCandidate : 'en',
    );
    const normalizedLanguage = editionProfile.language;
    const normalizedCategory = CATEGORY_QUERIES[category] ? category : 'all';
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(MAX_ARTICLES, Math.max(1, Number(limit) || 12));
    const normalizedCountry = editionProfile.country;
    const edition = getDailyEdition(new Date(), editionProfile.timeZone);
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
      const policy = resolveNewsPolicy(normalizedCountry);
      const merged = settled
        .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        .filter((article) => articleBelongsToEdition(article, normalizedLanguage))
        .map((article) => ({
          ...article,
          language: normalizedLanguage,
          country: normalizedCountry,
          title: truncateAtBoundary(article.title, policy.headlineMaxChars),
          description: truncateAtBoundary(article.description, policy.excerptMaxChars),
        }));
      // Dedupe theo tiêu đề, không theo URL: cùng một tin qua hai nguồn có URL
      // khác nhau. Giữ bản gặp trước — thứ tự provider đã là thứ tự ưu tiên.
      // (Trước đây ưu tiên bản CÓ ẢNH; bỏ ảnh của toà soạn rồi thì tiêu chí đó
      // luôn sai vì không bản nào còn ảnh.)
      const byTitle = new Map();
      for (const article of merged) {
        const key = article.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
        if (!byTitle.has(key)) byTitle.set(key, article);
      }
      const at = (article) => {
        const time = article.publishedAt ? new Date(article.publishedAt).getTime() : NaN;
        return Number.isNaN(time) ? -Infinity : time; // không rõ ngày thì xếp cuối
      };
      const deduplicated = [...byTitle.values()].sort((a, b) => at(b) - at(a));
      // Luân phiên nguồn sau khi xếp mới-cũ: không giảm số bài, nhưng tránh một
      // toà soạn chiếm trọn màn hình đầu khi feed của họ cập nhật dồn dập.
      articles = diversifyArticles(deduplicated);
      this.cache.set(cacheKey, {
        articles,
        providerStatus,
        expiresAt: Date.now() + FEED_REFRESH_MS,
      });
      if (this.cache.size > 240) {
        for (const [key, value] of this.cache) {
          if (value.expiresAt <= Date.now()) this.cache.delete(key);
        }
        while (this.cache.size > 240) this.cache.delete(this.cache.keys().next().value);
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
        sourceCount: new Set(articles.map((article) => article.source)).size,
        articleCount: articles.length,
        contentPolicy: resolveNewsPolicy(normalizedCountry),
      },
    };
  }
}

export const studentNewsService = new StudentNewsService();
