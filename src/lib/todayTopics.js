// Gom bài theo chủ đề bằng script chạy trên máy người đọc — không thêm một
// lượt gọi máy chủ nào. Ấn bản đã nằm sẵn trong bộ nhớ (tới 120 bài), nên chọn
// chủ đề là lọc tức thì, không quay vòng chờ tải.
//
// ponytail: đếm tần suất cụm từ, không phải embedding/AI. Chuỗi 120 tiêu đề
// thì cách này đủ chính xác và chạy trong một nhịp khung hình. Muốn gom theo
// ngữ nghĩa thật (đồng nghĩa, viết tắt) thì mới cần đổi sang embedding.

// Từ chức năng: xuất hiện trong mọi tiêu đề nên không phân biệt được chủ đề.
const STOPWORDS = new Set([
  // vi
  'và', 'của', 'cho', 'với', 'trong', 'trên', 'dưới', 'từ', 'đến', 'về', 'là',
  'các', 'những', 'một', 'này', 'đó', 'khi', 'đã', 'sẽ', 'được', 'có', 'không',
  'người', 'việc', 'nào', 'ra', 'vào', 'sau', 'trước', 'tại', 'bị', 'lại', 'thì',
  'mà', 'nên', 'vẫn', 'còn', 'hơn', 'rất', 'nhiều', 'mới', 'vừa', 'đang', 'chỉ',
  // en
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'you', 'your', 'are',
  'was', 'were', 'has', 'have', 'had', 'will', 'can', 'but', 'not', 'its',
  'their', 'they', 'how', 'why', 'what', 'when', 'who', 'new', 'more', 'says',
  'after', 'over', 'into', 'about', 'his', 'her', 'out',
]);

const words = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
  .split(/\s+/)
  .filter(Boolean);

// Tiếng Việt viết rời từng âm tiết: "học" hay "sinh" đứng một mình chẳng là chủ
// đề gì, "học sinh" mới là. Nên đếm cả cụm hai âm tiết, và cụm được ưu tiên hơn
// từ đơn khi xếp hạng.
function phrasesOf(text) {
  const tokens = words(text);
  const found = new Set();
  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    const next = tokens[i + 1];
    if (word.length > 2 && !STOPWORDS.has(word)) found.add(word);
    if (next && !STOPWORDS.has(word) && !STOPWORDS.has(next) && word.length > 1 && next.length > 1) {
      found.add(`${word} ${next}`);
    }
  }
  return found;
}

/**
 * Chủ đề nổi bật của ấn bản: cụm từ xuất hiện ở nhiều bài nhất.
 * Trả về [{ topic, count }] đã bỏ những từ đơn đã nằm trong một cụm được chọn.
 */
export function extractTopics(articles = [], { max = 10, min = 2 } = {}) {
  const frequency = new Map();
  for (const article of articles) {
    for (const phrase of phrasesOf(`${article?.title || ''} ${article?.description || ''}`)) {
      frequency.set(phrase, (frequency.get(phrase) || 0) + 1);
    }
  }

  const ranked = [...frequency.entries()]
    .filter(([, count]) => count >= min)
    // Cụm hai từ nhân đôi điểm: "tuyển sinh" nói lên chủ đề, "sinh" thì không.
    .sort((a, b) => (b[1] * (b[0].includes(' ') ? 2 : 1)) - (a[1] * (a[0].includes(' ') ? 2 : 1)));

  const picked = [];
  for (const [topic, count] of ranked) {
    if (picked.length >= max) break;
    // Bỏ thứ trùng lặp: đã có "tuyển sinh" thì "tuyển" là một chip thừa.
    if (picked.some(({ topic: kept }) => kept.includes(topic) || topic.includes(kept))) continue;
    picked.push({ topic, count });
  }
  return picked;
}

/** Bài có thuộc chủ đề đang lọc không (khớp cả cụm lẫn từ đơn). */
export function matchesTopic(article, topic) {
  if (!topic) return true;
  return `${article?.title || ''} ${article?.description || ''}`
    .toLowerCase()
    .includes(topic.toLowerCase());
}

/** Tìm kiếm trong tiêu đề, sapo và tên nguồn. */
export function matchesQuery(article, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${article?.title || ''} ${article?.description || ''} ${article?.source || ''}`
    .toLowerCase()
    .includes(needle);
}
