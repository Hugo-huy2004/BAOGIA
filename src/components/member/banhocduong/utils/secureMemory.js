/**
 * Secure Local Memory & Sentiment Engine for HugoPSY
 * Features:
 *  - XOR-based obfuscation to protect stored mental health topics/notes in localStorage.
 *  - Rule-based entity extraction (names, exam deadlines, stress triggers, relationships).
 *  - Dynamic sentiment vector tracking (Positive, Neutral, Negative moving average).
 */

const SALT = "HugoPSY_Secure_Salt_2026";

// Simple client-side obfuscation to prevent plain-text reading of sensitive data from localStorage
function obfuscate(text, key) {
  const encKey = key + SALT;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function deobfuscate(encoded, key) {
  try {
    const encKey = key + SALT;
    const text = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ encKey.charCodeAt(i % encKey.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return null;
  }
}

// Get a unique key based on display name or client properties
function getSecurityKey(bio) {
  const name = bio?.displayName || "anonymous_member";
  return name.split("").reverse().join("") + name.length;
}

export function loadSecureMemory(bio) {
  const key = getSecurityKey(bio);
  const raw = localStorage.getItem(`hugopsy_mem_${key}`);
  if (!raw) {
    return {
      name: bio?.displayName || null,
      examDate: null,
      stressTriggers: [],
      relationshipStatus: null,
      sentimentTrend: [0], // Moving average of sentiment scores (-1 to 1)
      lastUpdated: null,
    };
  }
  const decrypted = deobfuscate(raw, key);
  if (!decrypted) return null;
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

export function saveSecureMemory(bio, memory) {
  const key = getSecurityKey(bio);
  const jsonStr = JSON.stringify(memory);
  const encrypted = obfuscate(jsonStr, key);
  localStorage.setItem(`hugopsy_mem_${key}`, encrypted);
}

// Simple rule-based sentiment scoring: returns -1 (Negative), 0 (Neutral), or 1 (Positive)
export function analyzeSentiment(text) {
  const lowercase = text.toLowerCase();
  
  const negativeWords = [
    "buồn", "mệt", "chán", "áp lực", "stress", "tệ", "lo", "sợ", "khóc", "cô đơn",
    "bế tắc", "kiệt sức", "hết năng lượng", "tức giận", "giận", "bực", "chia tay", "cãi nhau"
  ];
  const positiveWords = [
    "vui", "ổn", "khoẻ", "hạnh phúc", "tuyệt", "ok", "tốt", "cảm ơn", "thank",
    "yêu", "crush", "thích", "động lực", "hào hứng", "chill"
  ];
  
  let score = 0;
  negativeWords.forEach(word => {
    if (lowercase.includes(word)) score -= 1.2;
  });
  positiveWords.forEach(word => {
    if (lowercase.includes(word)) score += 1.0;
  });
  
  return score > 0 ? 1 : score < 0 ? -1 : 0;
}

// Extracts dates, triggers and status updates from user's message
export function updateMemoryFromText(text, currentMemory) {
  const clean = text.toLowerCase();
  const memory = { ...currentMemory, lastUpdated: new Date().toISOString() };
  
  // 1. Update sentiment vector (keep last 5 interactions)
  const currentSentiment = analyzeSentiment(text);
  const nextTrend = [...(memory.sentimentTrend || [0]), currentSentiment].slice(-5);
  memory.sentimentTrend = nextTrend;
  
  // 2. Extract exam deadlines
  const examKeywords = ["thi tốt nghiệp", "thi đại học", "thpt", "thi kỳ 1", "thi học kỳ", "kiểm tra 1 tiết", "deadline"];
  if (examKeywords.some(kw => clean.includes(kw))) {
    // Look for numbers representing days/dates
    const dateMatch = clean.match(/(\d{1,2})[/-](\d{1,2})/);
    if (dateMatch) {
      memory.examDate = `${dateMatch[1]}/${dateMatch[2]}`;
    } else if (clean.includes("mai") || clean.includes("ngay mai")) {
      memory.examDate = "Ngày mai";
    } else if (clean.includes("tuần sau") || clean.includes("tuan sau")) {
      memory.examDate = "Tuần sau";
    }
  }
  
  // 3. Extract stress triggers
  const triggerMapping = [
    { key: "family", keywords: ["bố mẹ", "ba mẹ", "gia đình", "la mắng", "cãi nhau với bố mẹ", "cãi nhau với ba mẹ", "phụ huynh"] },
    { key: "studies", keywords: ["học hành", "điểm số", "thi rớt", "học không vào", "bài tập", "thi cử", "môn toán", "môn văn", "lớp học"] },
    { key: "peers", keywords: ["bạn bè", "tẩy chay", "bắt nạt", "bully", "đua đòi", "nói xấu", "cô lập", "social anxiety"] },
    { key: "love", keywords: ["người yêu", "chia tay", "thất tình", "crush", "tỏ tình", "giận người yêu"] },
    { key: "health", keywords: ["mất ngủ", "khó ngủ", "mệt mỏi", "kiệt sức", "sức khoẻ", "đau đầu", "hoảng loạn", "panic"] }
  ];
  
  const activeTriggers = new Set(memory.stressTriggers || []);
  triggerMapping.forEach(mapping => {
    if (mapping.keywords.some(kw => clean.includes(kw))) {
      activeTriggers.add(mapping.key);
    }
  });
  memory.stressTriggers = Array.from(activeTriggers);
  
  // 4. Extract relationship status
  if (clean.includes("người yêu cũ") || clean.includes("vừa chia tay") || clean.includes("bị bồ đá")) {
    memory.relationshipStatus = "single_recently_broken_up";
  } else if (clean.includes("người yêu") || clean.includes("có người yêu") || clean.includes("bạn gái") || clean.includes("bạn trai")) {
    memory.relationshipStatus = "in_relationship";
  } else if (clean.includes("crush") || clean.includes("thầm thích")) {
    memory.relationshipStatus = "has_crush";
  }
  
  return memory;
}
