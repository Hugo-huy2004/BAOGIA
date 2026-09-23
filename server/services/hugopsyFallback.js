import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Bộ đồng hành HugoPsy chạy trên Node — dùng khi KHÔNG gọi được máy chủ Python.
 *
 * dự phòng thì trả về đúng MỘT câu chào cố định cho mọi tin nhắn. Người dùng
 * trả lời "Không" cũng nhận lại y nguyên câu chào đó. Tệ hơn: nhánh này KHÔNG
 * hề kiểm tra khủng hoảng, nên ai gõ "tôi muốn chết" lúc máy chủ Python đang
 * nghỉ sẽ nhận một lời chào ấm áp và KHÔNG một số hotline nào.
 *
 * Lời lẽ và từ khoá lấy từ `shared/hugopsyKnowledge.json` — CÙNG tệp mà engine
 * Python đọc. Đừng chép chuỗi vào đây: hai bộ não viết riêng thì sớm muộn cũng
 * lệch nhau, và chỗ lệch nguy hiểm nhất là danh sách từ khoá khủng hoảng.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE = JSON.parse(
  fs.readFileSync(path.join(HERE, '..', '..', 'shared', 'hugopsyKnowledge.json'), 'utf8'),
);

const ACCENTS = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
const PLAIN = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';

/** Bỏ dấu + chữ thường + bỏ dấu câu. Phải khớp `_norm()` bên Python, nếu không
 *  hai bên nhận diện khủng hoảng khác nhau. */
export function normalize(text) {
  const lowered = String(text || '').trim().toLowerCase();
  let out = '';
  for (const ch of lowered) {
    const at = ACCENTS.indexOf(ch);
    out += at === -1 ? ch : PLAIN[at];
  }
  return out.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Đệm dấu cách hai đầu rồi mới tìm ' khoá ' — khớp chuỗi con làm "me" (mẹ)
 *  trúng trong "met" (mệt), đọc "tớ mệt lắm" thành chuyện gia đình. */
const padded = (text) => ` ${normalize(text)} `;
const hasKey = (paddedText, key) => paddedText.includes(` ${key} `);

export function isCrisis(message) {
  const text = padded(message);
  return KNOWLEDGE.crisisTerms.some((term) => hasKey(text, term));
}

const ADDRESS = KNOWLEDGE.address;
const PHRASES = KNOWLEDGE.phrases;

/** Gọi người ta theo cách họ tự xưng. Phải khớp `detect_address()` bên Python. */
export function detectAddress(message, history) {
  const texts = [message, ...(history || []).filter((t) => t?.role === 'user').map((t) => t.content || '')];
  const counts = new Map();
  for (const text of texts) {
    const tokens = new Set(normalize(text).split(' '));
    ADDRESS.detect.forEach((rule, index) => {
      const hits = rule.cues.filter((cue) => tokens.has(cue)).length;
      if (hits) counts.set(index, (counts.get(index) || 0) + hits);
    });
  }
  if (!counts.size) return ADDRESS.default;
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return ADDRESS.detect[best];
}

/** Đổ đại từ vào chỗ trống. Kho tri thức không chứa đại từ cứng. */
export function render(text, address) {
  return ['User', 'user', 'Self', 'self'].reduce(
    (out, key) => out.split(`{${key}}`).join(address[key] ?? ''), text);
}

const lowerFirst = (text) => {
  for (const [upper, lower] of [['{User}', '{user}'], ['{Self}', '{self}']]) {
    if (text.startsWith(upper)) return lower + text.slice(upper.length);
  }
  return text.charAt(0).toLowerCase() + text.slice(1);
};

export const CRISIS_RESPONSE = KNOWLEDGE.crisisResponse;

const COMMON_REPLIES = new Map(
  Object.entries(KNOWLEDGE.commonReplies).map(([key, value]) => [normalize(key), value]),
);

function detectTopics(message, limit = 2) {
  const text = padded(message);
  const scored = KNOWLEDGE.topics
    .map((topic) => {
      const hits = topic.keys.filter((key) => hasKey(text, key));
      return hits.length
        ? { topic, longest: Math.max(...hits.map((h) => h.length)), count: hits.length }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.longest - a.longest || b.count - a.count)
    .slice(0, limit);
  // Chủ đề PHỤ phải khớp chắc tay: một chữ ngắn trúng tình cờ kéo theo cả một
  // câu lạc đề, nghe như bot đoán mò.
  if (scored.length > 1 && scored[1].longest < 5 && scored[1].count < 2) scored.length = 1;
  return scored.map((entry) => entry.topic);
}

const userTurns = (history) =>
  (history || []).filter((turn) => turn?.role === 'user').length;

/** Câu bot đã nói trong phiên thì không nói lại — lặp nguyên văn là thứ lộ máy móc nhất. */
function saidBefore(history, text) {
  if (!history?.length || !text) return false;
  const needle = normalize(text).slice(0, 60);
  return needle
    ? history.some((t) => t?.role === 'model' && normalize(t.content || '').includes(needle))
    : false;
}

function pick(options, seed, history) {
  if (!options?.length) return '';
  for (let i = 0; i < options.length; i += 1) {
    const candidate = options[(seed + i) % options.length];
    if (!saidBefore(history, candidate)) return candidate;
  }
  return options[seed % options.length];
}

/**
 * Soạn một lượt đáp. Cùng khung với bên Python: phản chiếu → (chủ đề thứ hai)
 * → MỘT cánh cửa mở ra. Không bao giờ dồn nhiều câu hỏi một lúc.
 */
export function composeReply(message, { bio, history } = {}) {
  const name = bio?.displayName || bio?.name || '';
  const turn = userTurns(history);
  const parts = [];

  const address = detectAddress(message, history);
  const cached = COMMON_REPLIES.get(normalize(message));
  if (cached) return render(cached, address);

  if (turn === 0 && name) parts.push(`Chào ${name}.`);

  const topics = detectTopics(message);
  if (!topics.length) {
    parts.push(pick(PHRASES.genericReflect, turn, history));
    parts.push(pick(PHRASES.genericAsk, turn, history));
    return render(parts.filter(Boolean).join(' '), address);
  }

  const primary = topics[0];
  parts.push(pick(primary.reflect, turn, history));

  if (topics[1]) {
    parts.push(PHRASES.secondTopic + lowerFirst(pick(topics[1].reflect, turn + 1, history)));
  }

  const intense = KNOWLEDGE.intensifiers.some((word) => hasKey(padded(message), word));
  if (intense) {
    parts.push(pick(PHRASES.intense, turn, history));
    parts.push(pick(primary.ask, turn, history));
  } else if (primary.offer && turn > 0 && turn % 2 === 0) {
    parts.push(primary.offer);
  } else {
    parts.push(pick(primary.ask, turn, history));
  }

  return render(parts.filter(Boolean).join(' '), address);
}
