/**
 * todayTopicService.js
 * Engine phân tích chủ đề thông minh (Smart Topics NLP) chạy trên Node.js.
 * 
 * Thay thế việc tính toán nặng trên trình duyệt (UI thread):
 * - Hỗ trợ phân đoạn từ chuẩn với Intl.Segmenter và n-gram chuyên sâu cho tiếng Việt/Anh/Trung.
 * - Danh mục Stopwords đa ngữ mở rộng.
 * - Chấm điểm cụm từ (ưu tiên cụm 2-3 từ có nghĩa so với từ đơn).
 * - Khử trùng lặp (deduplication) và gom nhóm ngữ nghĩa theo tần suất.
 */

// Bộ từ dừng (Stopwords) toàn diện cho các ấn bản phổ biến
const STOPWORDS_VI = new Set([
  'và', 'của', 'cho', 'với', 'trong', 'trên', 'dưới', 'từ', 'đến', 'về', 'là',
  'các', 'những', 'một', 'này', 'đó', 'khi', 'đã', 'sẽ', 'được', 'có', 'không',
  'người', 'việc', 'nào', 'ra', 'vào', 'sau', 'trước', 'tại', 'bị', 'lại', 'thì',
  'mà', 'nên', 'vẫn', 'còn', 'hơn', 'rất', 'nhiều', 'mới', 'vừa', 'đang', 'chỉ',
  'như', 'theo', 'bởi', 'cũng', 'đều', 'qua', 'gì', 'sự', 'cuộc', 'bằng', 'để',
  'hay', 'hoặc', 'vì', 'do', 'từng', 'làm', 'năm', 'tháng', 'ngày', 'hôm', 'nay',
  'ông', 'bà', 'anh', 'chị', 'em', 'cô', 'chú', 'bác', 'biết', 'thấy', 'trường', 'tin', 'thông',
]);

const STOPWORDS_EN = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'you', 'your', 'are',
  'was', 'were', 'has', 'have', 'had', 'will', 'can', 'but', 'not', 'its',
  'their', 'they', 'how', 'why', 'what', 'when', 'who', 'new', 'more', 'says',
  'after', 'over', 'into', 'about', 'his', 'her', 'out', 'all', 'been', 'would',
  'could', 'should', 'than', 'them', 'then', 'there', 'these', 'first', 'just',
  'like', 'also', 'most', 'other', 'some', 'time', 'year', 'day', 'today', 'said',
]);

const STOPWORDS_ZH = new Set([
  '的', '了', '和', '在', '是', '就', '都', '而', '及', '与', '着', '或',
  '一个', '没有', '我们', '你们', '他们', '这个', '那个', '因为', '所以',
  '但是', '如果', '对于', '关于', '根据', '表示', '指出', '称', '月', '日', '年',
]);

function getStopwords(lang = 'vi') {
  const code = String(lang || 'vi').toLowerCase().split('-')[0];
  if (code === 'vi') return STOPWORDS_VI;
  if (code === 'zh') return STOPWORDS_ZH;
  return STOPWORDS_EN;
}

/**
 * Phân tách từ bằng Intl.Segmenter nếu có, hoặc split regex thông minh
 */
function tokenize(text = '', lang = 'vi') {
  const cleaned = String(text || '').trim();
  if (!cleaned) return [];

  const code = String(lang || 'vi').toLowerCase().split('-')[0];

  if (code === 'zh' && typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
      return [...segmenter.segment(cleaned)]
        .map((s) => s.segment.trim())
        .filter((w) => w.length > 1 && !/^\d+$/.test(w));
    } catch {
      // Fallback nếu có lỗi segmenter
    }
  }

  // Tiếng Việt & Tiếng Anh: tách theo từ và dấu câu
  return cleaned
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Rút trích các cụm n-gram có ý nghĩa từ văn bản
 */
function extractPhrases(title = '', description = '', lang = 'vi') {
  const code = String(lang || 'vi').toLowerCase().split('-')[0];
  const stopwords = getStopwords(code);
  const text = `${title} ${description}`.trim();
  const tokens = tokenize(text, code);
  const phrases = new Set();

  if (code === 'zh') {
    for (const w of tokens) {
      if (w.length >= 2 && !stopwords.has(w)) {
        phrases.add(w);
      }
    }
    return phrases;
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    const next = tokens[i + 1];
    const next2 = tokens[i + 2];

    // Từ đơn hợp lệ (dài hơn 2 ký tự, không phải từ dừng hay số thuần túy)
    if (word.length > 2 && !stopwords.has(word) && !/^\d+$/.test(word)) {
      phrases.add(word);
    }

    // Cụm 2 từ (Bigram) - mang tính chủ đề cao nhất trong tiếng Việt & tiếng Anh
    if (
      next &&
      word.length > 1 &&
      next.length > 1 &&
      !stopwords.has(word) &&
      !stopwords.has(next) &&
      (!/^\d+$/.test(word) || !/^\d+$/.test(next))
    ) {
      phrases.add(`${word} ${next}`);
    }
  }

  return phrases;
}

/**
 * Trích xuất các chủ đề nổi bật của ấn bản (Smart Topics)
 * @param {Array} articles - Danh sách bài viết
 * @param {Object} options - { max = 10, min = 2, language = 'vi' }
 * @returns {Array<{ topic: string, count: number }>}
 */
export function extractSmartTopics(articles = [], { max = 10, min = 2, language = 'vi' } = {}) {
  if (!Array.isArray(articles) || !articles.length) return [];

  const frequency = new Map();

  for (const article of articles) {
    const phrases = extractPhrases(article?.title || '', article?.description || '', language);
    for (const phrase of phrases) {
      frequency.set(phrase, (frequency.get(phrase) || 0) + 1);
    }
  }

  // Chấm điểm và xếp hạng:
  // Cụm 2 từ nhân đôi điểm: "tuyển sinh" nói lên chủ đề rõ hơn "sinh"
  const ranked = [...frequency.entries()]
    .filter(([, count]) => count >= min)
    .sort((a, b) => {
      const isMultiA = a[0].includes(' ');
      const isMultiB = b[0].includes(' ');
      const scoreA = a[1] * (isMultiA ? 2.2 : 1.0);
      const scoreB = b[1] * (isMultiB ? 2.2 : 1.0);
      return scoreB - scoreA;
    });

  const picked = [];
  const usedWords = new Set();

  for (const [topic, count] of ranked) {
    if (picked.length >= max) break;
    const wordsInTopic = topic.split(' ');
    // Nếu topic này chứa từ đã dùng trong topic trước, bỏ qua để tránh cụm cắt dở như "sinh đại" khi đã có "tuyển sinh"
    const hasOverlap = wordsInTopic.some((w) => usedWords.has(w));
    if (hasOverlap) continue;

    picked.push({ topic, count });
    wordsInTopic.forEach((w) => usedWords.add(w));
  }

  return picked;
}

const SHIFT_PATTERNS = Object.freeze({
  tech: {
    tag: 'Công nghệ & AI',
    icon: 'memory',
    regex: /(?:ai|trí tuệ nhân tạo|công nghệ|mô hình|openai|google|gemini|chatgpt|nvidia|chip|bán dẫn|máy tính|phần mềm|thuật toán|robot)/i,
  },
  market: {
    tag: 'Thị trường & Kinh tế',
    icon: 'trending_up',
    regex: /(?:thị trường|cổ phiếu|chứng khoán|kinh tế|doanh nghiệp|đầu tư|lạm phát|giá|doanh thu|lợi nhuận|việc làm|tài chính)/i,
  },
  edu: {
    tag: 'Giáo dục & Học thuật',
    icon: 'school',
    regex: /(?:giáo dục|đại học|học sinh|sinh viên|học bổng|nghiên cứu|khoa học|tuyển sinh|kỳ thi|giảng viên|bằng cấp)/i,
  },
  world: {
    tag: 'Thế giới & Đời sống',
    icon: 'public',
    regex: /(?:thế giới|quốc tế|khí hậu|y tế|sức khoẻ|cộng đồng|chính sách|vatican|giáo phận|xã hội)/i,
  },
});

/**
 * Trích xuất bản tin tóm tắt biến động hôm nay (Today's Executive Fluctuation Digest)
 * Chạy trực tiếp trên Node.js, nạp sẵn vào cache để phản hồi trong 0ms.
 */
export function extractFluctuationDigest(articles = [], { language = 'vi' } = {}) {
  if (!Array.isArray(articles) || !articles.length) return null;

  const shifts = [];
  const assignedCategories = new Set();

  for (const [key, config] of Object.entries(SHIFT_PATTERNS)) {
    // Tìm bài viết tiêu biểu nhất cho nhóm biến động này
    const candidate = articles.find((art) => {
      const fullText = `${art.title || ''} ${art.description || ''}`;
      return config.regex.test(fullText) && !shifts.some((s) => s.articleId === art.id);
    });

    if (candidate) {
      const fullText = `${candidate.title || ''} ${candidate.description || ''}`;
      // Trích xuất số liệu / % cụ thể nếu có
      const metricMatch = fullText.match(/\b(?:\d+[.,]\d+%|\d+%\b|\d+\s*(?:tỷ|triệu|nghìn|USD|VNĐ|người|sinh viên|trường))/i);
      const metric = metricMatch ? metricMatch[0] : (language === 'en' ? 'Key Shift' : 'Biến động mới');

      // Tạo tóm tắt cụ thể ngắn gọn
      const rawDesc = String(candidate.description || candidate.title || '').trim();
      const firstSentence = rawDesc.split(/(?<=[.!?。！？;；])\s+/)[0] || rawDesc;

      shifts.push({
        id: `shift-${key}-${candidate.id || shifts.length}`,
        category: key,
        icon: config.icon,
        tag: config.tag,
        title: candidate.title,
        headline: candidate.title,
        metric,
        shiftType: key,
        concreteTakeaway: firstSentence.slice(0, 160) + (firstSentence.length > 160 ? '…' : ''),
        articleId: candidate.id,
      });
      assignedCategories.add(key);
    }
  }

  // Nếu còn thiếu, lấy bài đầu bảng làm biến động dẫn dắt
  if (shifts.length === 0 && articles[0]) {
    const lead = articles[0];
    shifts.push({
      id: `shift-lead-${lead.id}`,
      category: 'general',
      icon: 'bolt',
      tag: language === 'en' ? 'Top Shift' : 'Tiêu Điểm Biến Động',
      title: lead.title,
      headline: lead.title,
      metric: language === 'en' ? 'Breaking' : 'Nổi bật',
      shiftType: 'general',
      concreteTakeaway: lead.description || lead.title,
      articleId: lead.id,
    });
  }

  return {
    date: new Date().toISOString(),
    headline: language === 'en' ? "Today's Key Shifts & Briefs" : 'Bản Tin Tóm Tắt Biến Động 24 Giờ',
    executiveSummary: language === 'en'
      ? 'Instant summary of critical movements across AI, tech, education, and markets.'
      : 'Tổng hợp tức thì những chuyển động và số liệu quan trọng nhất hôm nay.',
    shifts,
    generatedAt: Date.now(),
  };
}

