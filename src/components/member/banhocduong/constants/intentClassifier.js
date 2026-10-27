/**
 * Local Intent Classifier for "HugoPSY"
 * – Regex fast-path for common patterns (O(n) rules, ~1ms)
 * – Fuse.js fuzzy match as primary similarity engine (handles typos, missing diacritics)
 * – Sørensen-Dice coefficient as final fallback
 * Threshold lowered to 0.72 (from 0.80) for better recall with short/noisy input.
 */
import Fuse from "fuse.js";
// Mẫu câu dùng CHUNG với máy chủ (định tuyến intent bằng embedding trước khi
// gọi LLM — server/services/intentRouter.js). Sửa mẫu câu thì sửa file JSON này.
import INTENT_PATTERNS from "../../../../../shared/companionIntentPatterns.json";
import { matchTherapyMethod } from "./therapyMethods";
import { DEFAULT_HOTLINES } from "./hotlines";
import { loadSecureMemory, saveSecureMemory, updateMemoryFromText } from "../utils/secureMemory";

function getFriendlyName(bio) {
  if (!bio?.displayName) return "cậu";
  const parts = bio.displayName.trim().split(" ");
  return parts[parts.length - 1];
}

function getPhq9SeverityVi(score) {
  if (score <= 4) return "tối thiểu (bình thường)";
  if (score <= 9) return "nhẹ";
  if (score <= 14) return "trung bình";
  if (score <= 19) return "trung bình nặng";
  return "nghiêm trọng";
}

function getGad7SeverityVi(score) {
  if (score <= 4) return "tối thiểu (bình thường)";
  if (score <= 9) return "nhẹ";
  if (score <= 14) return "trung bình";
  return "nghiêm trọng";
}

export function removeVietnameseTones(str) {
  if (!str) return "";
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return result;
}

// Single source of truth for crisis detection — used by regex fast-path AND
// the safety-net check in findMatchingIntent. Biased toward over-triggering
// (false positive = a caring message + hotline) over under-triggering.
// Negative lookahead on "chet" excludes Vietnamese hyperbole idioms.
export function isCrisisText(cleanText) {
  if (!cleanText) return false;
  const explicit = /(tu tu|tu sat|ket lieu|lam hai ban than|tu lam dau|tu tu o dau|khong muon song|khong con muon song|chang con muon song|muon ket thuc tat ca|ket thuc cuoc doi|bien mat vinh vien|khong thiet song|song khong co y nghia|cuoc song (nay )?khong con y nghia|the gioi se tot hon khi khong co|khong ai can (toi|minh|to)( nua)?)/;
  if (explicit.test(cleanText)) return true;
  const firstPersonDeath = /\b(toi|to|minh|tao)\b[^.!?]{0,18}\b(muon|can|se|sap)?\s*chet\b(?!\s*(mat|doi|met|khat|cuoi|ngat|sieng|thui|di))/;
  const conditionalDeath = /\bneu\b[^.!?]{0,15}\b(toi|to|minh)\b[^.!?]{0,12}\bchet\b/;
  if (firstPersonDeath.test(cleanText) || conditionalDeath.test(cleanText)) return true;
  return crisisParaphrase.test(cleanText);
}

// Extra explicit paraphrasings the pattern above doesn't literally contain —
// same deterministic substring/word-order matching as `explicit`, just anchored
// on the distinctive content words of each phrasing (not whole-sentence
// comparison). A PRIOR version of this used whole-sentence Dice-bigram fuzzy
// matching, which false-triggered on ordinary messages that happened to share
// common Vietnamese particles ("khong", "toi", "duoc", "nay"/"day") with a
// corpus phrase — e.g. "khong dau, hom nay toi chuan bi duoc di choi day" (a
// cheerful "no, I'm heading out today") scored 0.625 similarity against "to
// khong xung dang duoc song tren doi nay" purely from filler-word overlap.
// Regex avoids that failure mode entirely: it can only match if the actual
// signal phrase is present, in order, so an unrelated sentence never trips it
// no matter how many stray words it shares with a danger phrase.
const crisisParaphrase = /(khong con ly do.{0,10}song|chan song (lam roi|qua|that su)|uoc gi.{0,15}bien mat khoi|moi thu (that su |)vo nghia|giai thoat khoi (tat ca|moi thu)|khong (con |)ai (se |)can (toi|to|minh)( nua| dau)?|khong ai (se |)nho (toi|to|minh)( nua| dau)|(la |)ganh nang cho (moi nguoi|gia dinh)|khong xung dang.{0,10}song|gia nhu (minh |to |)chua tung (duoc sinh ra|ton tai|xuat hien)|khong con suc.{0,10}chiu dung|nghi den (chuyen |viec |)ket thuc (moi thu|tat ca|cuoc doi))/;

const SEVERITY_LABELS = { normal: "Ổn định", mild: "Nhẹ", moderate: "Trung bình", severe: "Cao", extremely_severe: "Rất cao" };
function phq9Severity(score) { if (score == null) return null; if (score <= 4) return "normal"; if (score <= 9) return "mild"; if (score <= 14) return "moderate"; if (score <= 19) return "severe"; return "extremely_severe"; }
function gad7Severity(score) { if (score == null) return null; if (score <= 4) return "normal"; if (score <= 9) return "mild"; if (score <= 14) return "moderate"; return "severe"; }
function who5Severity(score) { if (score == null) return null; return score >= 13 ? "normal" : score >= 9 ? "mild" : score >= 5 ? "moderate" : "severe"; }
function formatVnDate(d) { try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return ""; } }

// Latest completed Big Five test traits (each 1.0–5.0, see clinicalTests.js bigfive
// getInterpretation) — the only real per-user personality signal already computed
// in this app, so we reuse it instead of building a new MBTI/personality system.
function getLatestBigFive(historyLogs) {
  const logs = (historyLogs || []).filter(l => l.test === "bigfive" && l.traits);
  return logs.length > 0 ? logs[logs.length - 1].traits : null;
}

function buildMetricsSummary(historyLogs = []) {
  const phq9Logs = historyLogs.filter(l => l.test === "phq9");
  const gad7Logs = historyLogs.filter(l => l.test === "gad7");
  const who5Logs = historyLogs.filter(l => l.test === "who5");
  const latestPhq9 = phq9Logs[phq9Logs.length - 1];
  const latestGad7 = gad7Logs[gad7Logs.length - 1];
  const latestWho5 = who5Logs[who5Logs.length - 1];

  if (!latestPhq9 && !latestGad7 && !latestWho5) {
    return ["Cậu chưa làm bài test nào để tớ có chỉ số báo cáo cả", "Muốn làm thử ngay không? Chỉ tốn 2 phút thôi!"];
  }

  const lines = ["Chỉ số gần nhất của cậu nè:"];
  if (latestPhq9) lines.push(`• PHQ-9 (trầm cảm): ${latestPhq9.score}/27 — mức ${SEVERITY_LABELS[phq9Severity(latestPhq9.score)]}, đo ngày ${formatVnDate(latestPhq9.date)}.`);
  if (latestGad7) lines.push(`• GAD-7 (lo âu): ${latestGad7.score}/21 — mức ${SEVERITY_LABELS[gad7Severity(latestGad7.score)]}, đo ngày ${formatVnDate(latestGad7.date)}.`);
  if (latestWho5) lines.push(`• WHO-5 (sức khoẻ tinh thần): ${latestWho5.score}/25 — mức ${SEVERITY_LABELS[who5Severity(latestWho5.score)]}, đo ngày ${formatVnDate(latestWho5.date)}.`);

  const anySevere = [latestPhq9 && phq9Severity(latestPhq9.score), latestGad7 && gad7Severity(latestGad7.score), latestWho5 && who5Severity(latestWho5.score)]
    .some(s => s === "severe" || s === "extremely_severe");
  return [lines.join("\n"), anySevere ? "Mấy chỉ số này đang ở mức cao — cậu muốn tớ mở luôn liệu pháp phù hợp không?" : "Nhìn chung là ổn đó, cứ duy trì nhịp chăm sóc bản thân như vậy nha!"];
}

function getDiceSimilarity(str1, str2) {
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) bigrams.add(str.substring(i, i + 2));
    return bigrams;
  };
  const clean = (s) => (s || "").toLowerCase().replace(/[.,/#!$%^&*;:{}=_`~()?-]/g, "").replace(/\s+/g, " ").trim();
  const s1 = clean(str1);
  const s2 = clean(str2);
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const bigram of b1) { if (b2.has(bigram)) intersection++; }
  return (2.0 * intersection) / (b1.size + b2.size);
}

function getSimilarityScore(s1, s2) {
  return Math.max(getDiceSimilarity(s1, s2), getDiceSimilarity(removeVietnameseTones(s1), removeVietnameseTones(s2)));
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE ROTATION — prevents same reply repeating for frequently matched intents.
// Module-level Map persists across all calls within the session (reset on page reload).
// ─────────────────────────────────────────────────────────────────────────────
const _counters = new Map();
function _rotate(id, variants) {
  const idx = (_counters.get(id) || 0) % variants.length;
  _counters.set(id, idx + 1);
  return variants[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITIONAL REPLY ENGINE
// Instead of picking a whole pre-written sentence from a small fixed pool,
// this reads lightweight signals out of the user's raw message (who's
// involved, how intense the wording is) plus the rolling sentimentTrend
// already tracked in secureMemory, then independently rotates an opener +
// a validation + a follow-up question and stitches them together — so the
// combinatorial space (opener × validation × question) is far larger than
// any single fixed triplet, and replies can reference what the user actually
// said instead of being context-blind templates.
// ─────────────────────────────────────────────────────────────────────────────
const WHO_PATTERNS = [
  { who: "bố mẹ", regex: /\b(bo me|ba me|gia dinh)\b/ },
  { who: "bạn bè", regex: /\b(ban than|ban be|dam ban)\b/ },
  { who: "người yêu", regex: /\b(nguoi yeu|ny|ban trai|ban gai)\b/ },
  { who: "thầy cô", regex: /\b(thay co|giao vien|giao su)\b/ },
];

function extractSignals(rawText, traits) {
  const clean = removeVietnameseTones(rawText || "");
  const who = (WHO_PATTERNS.find((p) => p.regex.test(clean)) || {}).who || null;
  const highIntensity = /\b(qua|rat|cuc ky|vo cung|kinh khung|khung khiep|khong chiu noi)\b/.test(clean);
  // Big Five scale is 1.0–5.0 (see clinicalTests.js) — 3.5/2.5 split around the midpoint.
  const neuroticHigh = traits ? traits.neuroticism >= 3.5 : false;
  const introvert = traits ? traits.extraversion <= 2.5 : false;
  return { who, highIntensity, neuroticHigh, introvert };
}

// slots: { openers, validations, questions } — each a short array of fragments.
// Fragments may use {name} and {who} tokens; {who} resolves to "" when nothing
// was detected in the raw message, so write openers where that still reads fine.
// traits: latest Big Five result (getLatestBigFive), or null if user hasn't taken it.
// extra: optional {token: value} map for intent-specific tokens beyond {name}/{who}
// (e.g. an exam-date reminder pulled from secureMemory).
function composeIntentReply({ id, name, rawText, memory, slots, traits, extra }) {
  const { who, highIntensity, neuroticHigh, introvert } = extractSignals(rawText, traits);
  const fill = (s) => {
    let out = s.replace(/\{name\}/g, name).replace(/\{who\}/g, who ? ` với ${who}` : "");
    if (extra) {
      for (const [key, value] of Object.entries(extra)) out = out.split(`{${key}}`).join(value ?? "");
    }
    return out;
  };

  const bubbles = [
    fill(_rotate(`${id}_opener`, slots.openers)),
    fill(_rotate(`${id}_validation`, slots.validations)),
  ];

  // sentimentTrend is an array of the last few interactions' scores (-1/0/1),
  // not a precomputed average — average it here. If the user's mood has been
  // trending down across several recent turns (not just this one message)
  // and this message itself reads intense, acknowledge the streak instead of
  // treating every message as an isolated blip.
  const trend = memory?.sentimentTrend;
  const trendAvg = Array.isArray(trend) && trend.length > 0
    ? trend.reduce((a, b) => a + b, 0) / trend.length
    : null;
  // At most ONE of these fires per reply (mutually exclusive), so the message
  // stays opener + validation + [one context note] + question — never a stack
  // of near-identical "I hear you" bubbles that reads as repetitive/robotic.
  if (trendAvg != null && trendAvg <= -0.6 && highIntensity) {
    bubbles.push(`Tớ để ý mấy bữa nay tâm trạng ${name} nhìn chung cũng không dễ dàng gì — không phải chỉ mỗi chuyện này thôi đúng không?`);
  } else if (neuroticHigh && highIntensity) {
    // Neuroticism from Big Five, not from this one message — normalize the intensity
    // as "cậu cảm nhận sâu" instead of implicitly agreeing the situation itself is extreme.
    bubbles.push(`${name} vốn là kiểu người cảm nhận mọi thứ sâu và rõ hơn người khác — không phải cậu "quá nhạy cảm" đâu, chỉ là cậu thật với cảm xúc của mình thôi.`);
  } else if (introvert) {
    // Rotated so it doesn't repeat every single turn for the same user (two of three slots empty).
    const note = _rotate(`${id}_introvert`, [
      `Tớ biết cậu không phải kiểu thích ồn ào kể chuyện cho nhiều người nghe — gõ hết ra với tớ như vầy đã là một bước không dễ rồi đó ${name}.`,
      "",
      "",
    ]);
    if (note) bubbles.push(note);
  }

  bubbles.push(fill(_rotate(`${id}_question`, slots.questions)));
  return bubbles;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT DATABASE
// ─────────────────────────────────────────────────────────────────────────────
export const INTENT_DATABASE = [
  {
    id: "greeting",
    tier: "free",
    patterns: INTENT_PATTERNS.greeting,
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const checkins = (historyLogs || []).filter(l => l.type === "checkin" && l.mood);
      let streak = 0;
      const days = new Set(checkins.map(c => new Date(c.date).toDateString()));
      let dateCursor = new Date();
      if (!days.has(dateCursor.toDateString())) dateCursor.setDate(dateCursor.getDate() - 1);
      while (days.has(dateCursor.toDateString())) { streak++; dateCursor.setDate(dateCursor.getDate() - 1); }
      if (streak > 1) {
        return [`Eyy ${name}!`, `${streak} ngày liên tục rồi nha — quá xịn luôn đó.`, `Hôm nay sao rồi, kể tớ nghe coi?`];
      }
      if (checkins.length > 0) {
        const latest = checkins[checkins.length - 1];
        if (latest.mood <= 2) {
          return [`Chào ${name}`, `Hôm trước thấy cậu hơi xìu xìu á — giờ đỡ hơn chút chưa?`, `Tớ ở đây nghe cậu kể nha.`];
        }
      }
      return [`Chàoo ${name}!`, `Tớ đây rồi nè — hôm nay cậu vibe sao?`];
    }
  },
  {
    id: "goodbye",
    tier: "free",
    patterns: INTENT_PATTERNS.goodbye,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Bye ${name}!`, `Nhớ sạc pin cho bản thân nha, đừng gồng quá`, `Cần gì tớ luôn ở đây!`];
    }
  },
  {
    id: "identity",
    tier: "paid",
    patterns: INTENT_PATTERNS.identity,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ là HugoPSY nè`, `Bạn đồng hành tâm lý AI — ở đây để nghe ${name} xả hết mọi chuyện.`, `Học hành, cảm xúc, drama, lo lắng gì cũng kể tớ nghe nha!`];
    }
  },
  {
    id: "features",
    tier: "paid",
    patterns: INTENT_PATTERNS.features,
    generateResponse: () => {
      return [`Tớ có cả combo xịn luôn nè:`, `Thở 4-7-8 hết stress tức thì, thư giãn cơ, âm thanh thiên nhiên dễ ngủ, bài test tâm lý chuẩn lâm sàng`, `Vào tab 'Trị Liệu' hay 'Đánh Giá' là thấy ngay á!`];
    }
  },
  {
    // Nhờ giải hộ bài: bạn đồng hành KHÔNG đưa đáp án — hỏi kẹt ở bước nào và
    // khích lệ tự làm. Trả lời tại chỗ để loại câu hỏi này không bao giờ lên LLM.
    id: "homework_help",
    tier: "free",
    patterns: INTENT_PATTERNS.homework_help,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return _rotate("homework_help", [
        [
          `Tớ không giải hộ đâu ${name} ơi, vì giải hộ thì mai đi thi cậu vẫn kẹt y chỗ đó.`,
          "Nhưng tớ ngồi cùng cậu nè: cậu chép đề ra, rồi chỉ tớ cậu làm tới bước nào thì đứng hình?",
        ],
        [
          `Bài này ${name} làm được, chỉ là đang kẹt một chỗ thôi.`,
          "Đề cho mình những gì, và đề muốn tìm cái gì? Cậu viết hai dòng đó ra trước xem.",
        ],
        [
          "Tớ mà đưa đáp án thì cậu chép xong vẫn chưa hiểu, phí công cậu lắm.",
          `Mình chia nhỏ nha ${name}: bước đầu tiên cậu định làm là gì? Sai cũng không sao, cứ thử.`,
        ],
      ]);
    }
  },
  {
    id: "study_planning",
    tier: "free",
    patterns: INTENT_PATTERNS.study_planning,
    generateResponse: () => [
      "Mình bắt đầu bằng cách ghi tất cả môn và deadline ra một chỗ, rồi chọn đúng một việc quan trọng nhất cho hôm nay.",
      "Chia việc đó thành phiên 25 phút: 20 phút học chủ động, 5 phút tự kiểm tra không nhìn tài liệu. Sau mỗi hai phiên, nghỉ 10 phút.",
      "Cuối buổi, ghi lại phần chưa nhớ và xếp nó vào phiên đầu tiên ngày mai. Nếu cậu gửi môn học, deadline và số giờ rảnh, tớ sẽ giúp chia nhỏ cụ thể hơn."
    ]
  },
  {
    id: "academic_stress",
    tier: "paid",
    patterns: INTENT_PATTERNS.academic_stress,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "academic_stress",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      extra: { exam: memory?.examDate ? ` (nhất là hạn chót ${memory.examDate} sắp tới)` : "" },
      slots: {
        openers: [
          `Tớ hiểu mà, áp lực học hành và thi cử dạo này{exam} đang khiến đầu óc {name} muốn nổ tung đúng không?`,
          `{name} ơi, deadline với bài vở dồn cùng lúc kiểu này thì căng thẳng là chuyện quá dễ hiểu.`,
          `Nghe {name} kể mà thấy áp lực học hành{exam} đang đè nặng lắm đó.`,
        ],
        validations: [
          `Đừng quên là điểm số hay kỳ thi chỉ là một phần rất nhỏ, nó không định nghĩa giá trị con người cậu đâu nha — thiệt đó.`,
          `Cố hết sức là đủ rồi — không cần phải hoàn hảo mới xứng đáng được nghỉ ngơi một chút.`,
          `Một buổi tối chưa ôn hết bài không có nghĩa là cậu sẽ trượt — đừng để nỗi sợ phóng đại mọi thứ lên quá mức.`,
        ],
        questions: [
          `Hãy dừng lại uống một ngụm nước ấm, hít thở một hơi thật sâu. Hôm nay phần bài vở hay áp lực nào đang làm cậu thấy bế tắc nhất vậy?`,
          `Cậu đang ôn hay làm phần nào mà thấy ngộp nhất?`,
          `Deadline gần nhất của cậu là khi nào vậy?`,
        ],
      },
    }),
  },
  {
    id: "sleep",
    tier: "paid",
    patterns: INTENT_PATTERNS.sleep,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "sleep",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Mất ngủ thường là tín hiệu cho thấy tâm trí {name} đang phải "chạy ngầm" rất nhiều lo âu chưa được giải tỏa đó.`,
          `{name} ơi, nằm cả tiếng mà đầu óc không chịu tắt máy đúng là mệt mỏi thật sự.`,
          `Ngủ không sâu, cứ tỉnh giấc giữa đêm — cơ thể {name} đang phát tín hiệu là chưa thực sự được nghỉ ngơi đâu.`,
        ],
        validations: [
          `Tối nay cậu thử tắt điện thoại trước khi ngủ 30 phút, giữ phòng tối mát và bật âm thanh "Mưa rơi" ở mục Trị Liệu xem sao nha.`,
          `Không cần ép mình ngủ ngay — càng cố ép càng tỉnh táo hơn đó, cứ để cơ thể tự chìm dần thôi.`,
          `Cafein hay lướt điện thoại sát giờ ngủ hay là thủ phạm giấu mặt lắm — thử để ý xem có phải trường hợp của cậu không.`,
        ],
        questions: [
          `Đừng bắt bản thân phải ngủ ngay lập tức kẻo lại áp lực thêm. Gần đây {name} ngủ được trung bình mấy tiếng mỗi đêm thế?`,
          `Lúc nằm xuống, đầu óc {name} thường nghĩ về chuyện gì nhiều nhất vậy?`,
          `Tình trạng này kéo dài được bao lâu rồi — mới vài hôm hay đã lâu rồi vậy?`,
        ],
      },
    }),
  },
  {
    id: "anxiety",
    tier: "paid",
    patterns: INTENT_PATTERNS.anxiety,
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const gad7Logs = (historyLogs || []).filter(l => l.test === "gad7");
      if (gad7Logs.length > 0) {
        const latest = gad7Logs[gad7Logs.length - 1];
        const dateStr = formatVnDate(latest.date);
        const severity = getGad7SeverityVi(latest.score);
        return [
          `Tớ nghe đây, cảm giác lồng ngực thắt lại và bồn chồn lo âu này thật sự mệt mỏi lắm đúng không ${name}?`,
          `Chỉ số GAD-7 hôm ${dateStr} của cậu là ${latest.score}/21 (${severity}). Điều đó phản ánh cơ thể cậu đang bật chế độ cảnh báo căng thẳng ở mức cao.`,
          `Lo âu chỉ là phản ứng bảo vệ quá đà của não bộ thôi, không có nghĩa cậu yếu đuối đâu. Bây giờ, đặt tay lên ngực và thử thở sâu 4-7-8 cùng tớ vài nhịp để làm dịu lại nha?`
        ];
      }
      return _rotate("anxiety", [
        [`Tớ nghe cậu đây, cảm giác lo âu bồn chồn này chắc hẳn đang khiến đầu óc ${name} căng như dây đàn đúng không?`, `Cố gắng hít vào sâu bằng mũi 4 giây, nín thở 4 giây và thở ra chậm bằng miệng 6 giây nha.`, `Hôm nay điều gì đang làm cậu cảm thấy bất an và lo nghĩ nhiều nhất vậy?`],
        [`Lo lắng kiểu đó làm lồng ngực cậu nghẹn lại, tim đập nhanh hay bồn chồn tay chân phải không ${name}?`, `Tâm trí cậu đang ở trạng thái phòng thủ thôi — cậu đang an toàn ở đây rồi. Hãy thả lỏng vai ra chút xíu.`, `Điều cụ thể nào đang làm cậu bất an nhất lúc này, kể tớ nghe nha?`],
        [`${name} ơi, khi lo âu ập đến, cậu thấy khó chịu nhất ở đâu trong cơ thể (như nghẹn ngực, cồn cào ruột gan hay căng cứng vai gáy)?`, `Hãy cùng tớ gọi tên và chấp nhận cảm giác đó trước nha — nó sẽ dịu đi từ từ thui à.`, `Cậu đang trải qua chuyện gì thế, tớ lắng nghe nè.`],
      ]);
    }
  },
  {
    id: "sadness",
    tier: "paid",
    patterns: INTENT_PATTERNS.sadness,
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const phq9Logs = (historyLogs || []).filter(l => l.test === "phq9");
      if (phq9Logs.length > 0) {
        const latest = phq9Logs[phq9Logs.length - 1];
        const dateStr = formatVnDate(latest.date);
        const severity = getPhq9SeverityVi(latest.score);
        return [
          `Tớ nghe đây ${name}. Cảm giác buồn bã, chán nản này thật sự rất nặng nề và làm cậu thấy kiệt quệ đúng không?`,
          `Chỉ số trầm cảm PHQ-9 hôm ${dateStr} của cậu là ${latest.score}/27, đang ở mức ${severity}. Nó phản ánh tâm hồn cậu đang mỏi mệt và rất cần được yêu thương, vỗ về.`,
          `Buồn không có nghĩa là cậu yếu đuối đâu — chỉ là cậu đã gồng gánh quá nhiều rồi. Hôm nay có chuyện gì đang đè nặng trong lòng cậu nhất, cứ từ từ chia sẻ với tớ nha.`
        ];
      }
      return _rotate("sadness", [
        [`${name} ơi, tớ nghe cậu đây. Tớ biết cảm giác trống rỗng và buồn bã này làm cậu thấy cô độc lắm...`, `Cho phép bản thân mình được buồn một chút đi — không cần lúc nào cũng phải cố gồng lên tỏ ra ổn đâu nha.`, `Muốn kể cho tớ nghe bất kỳ chuyện gì không, tớ luôn ở đây mà.`],
        [`Buồn thì cứ buồn thôi ${name} ơi, không cần phải cảm thấy có lỗi vì tâm trạng đi xuống đâu nè.`, `Tớ ngồi đây cùng cậu, không phán xét, chỉ lặng lẽ lắng nghe cậu thôi.`, `Điều gì đang làm lòng cậu thấy trĩu nặng nhất lúc này vậy?`],
        [`Có những ngày nỗi buồn ập đến không vì lý do gì cả — và điều đó hoàn toàn bình thường ${name} ạ.`, `Nếu thấy khó mở lời, cậu có muốn thử viết mọi suy nghĩ ra ở mục "Viết Tự Do" cho nhẹ lòng không?`, `Hoặc nếu sẵn sàng, cứ nhắn cho tớ nha.`],
      ]);
    }
  },
  {
    id: "crisis",
    tier: "free",
    patterns: INTENT_PATTERNS.crisis,
    // Kept as a single atomic message — urgent safety info (hotline, emergency number)
    // must never be split/delayed. Two-beat: (1) emotional validation first, (2) actionable
    // safety info with tappable quickActions rendered as tel: buttons by ChatTab.
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `${name} ơi, tớ đang nghe thấy một nỗi đau rất lớn trong những gì cậu vừa nói, và tớ không xem nhẹ nó một chút nào. Cậu không hề yếu đuối hay sai trái khi cảm thấy như vậy — chỉ là cậu đang phải mang một gánh nặng quá sức một mình ngay lúc này. Tớ thật lòng mong cậu được an toàn, và tớ sẽ ở đây cùng cậu qua khoảnh khắc này. Ngay bây giờ, xin cậu hãy chạm vào một trong các nút gọi khẩn cấp dưới đây hoặc tìm một người cậu tin tưởng để họ ở bên cậu lúc này — cậu xứng đáng được giúp đỡ và không phải một mình chịu đựng điều này.`;
    },
    quickActions: DEFAULT_HOTLINES.map((hotline) => ({
      label: `${hotline.label}${hotline.note ? ` · ${hotline.note}` : ""}`,
      tel: hotline.number
    }))
  },
  {
    id: "clinical_tests",
    tier: "paid",
    patterns: INTENT_PATTERNS.clinical_tests,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Được chứ, ${name}. HugoPSY có PHQ-9, GAD-7 và WHO-5 để sàng lọc hoặc tự theo dõi, cùng Big Five để tham khảo về tính cách. Đây không phải công cụ chẩn đoán và cậu không cần làm tất cả cùng lúc.`, `Cậu có thể chọn một bài phù hợp bên dưới; HugoPSY sẽ lưu kết quả để cậu tự xem xu hướng theo thời gian.`];
    },
    suggestPhq9: true,
    suggestGad7: true,
    suggestWho5: true,
    suggestBigFive: true
  },
  {
    id: "gratitude",
    tier: "free",
    patterns: INTENT_PATTERNS.gratitude,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Có gì đâu ${name} ơi`, `Được cậu tin tưởng chia sẻ là tớ vui muốn xỉu rồi á.`, `Chúc cậu một ngày nhẹ nhàng nha`];
    }
  },
  {
    id: "positive",
    tier: "free",
    patterns: INTENT_PATTERNS.positive,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return _rotate("positive", [
        [`Yasss ${name}!`, `Giữ cái vibe này lại nha — vui là quý lắm đó.`, `Điều gì làm cậu vui vậy, kể tớ nghe đi?`],
        [`Ooh nghe vui quá! Tớ cũng lây năng lượng đó rồi ${name}.`, `Hôm nay có chuyện gì đặc biệt không?`],
        [`Tuyệt vời ghê! ${name} đang chill thế.`, `Cậu đang làm gì mà vibe tốt vậy — kể tớ học hỏi với?`],
      ]);
    }
  },
  {
    id: "test_inventory",
    tier: "paid",
    patterns: INTENT_PATTERNS.test_inventory,
    generateResponse: () => {
      return [`HugoPSY hiện mở 4 công cụ: PHQ-9 và GAD-7 để sàng lọc triệu chứng, WHO-5 để tự theo dõi trạng thái tinh thần, và Big Five để tham khảo về tính cách.`, `Kết quả không phải chẩn đoán. Cậu có thể kể tình trạng hiện tại để tớ gợi ý một bài phù hợp, hoặc vào tab “Đánh giá” để tự chọn.`];
    }
  },
  {
    id: "therapy_catalog",
    tier: "paid",
    patterns: INTENT_PATTERNS.therapy_catalog,
    generateResponse: () => {
      return [`Có 4 hoạt động chính nè: Thở 4-7-8 (lo âu/mất ngủ), Ngồi Tĩnh Tâm (căng thẳng), Đọc sách (chiêm nghiệm) và Viết Tự Do (xả áp lực).`, `Còn vài món AI cao cấp mở bằng JOY nữa. Ghé tab 'Thư Giãn' khám phá nha!`];
    }
  },
  {
    id: "pricing_package",
    tier: "paid",
    patterns: INTENT_PATTERNS.pricing_package,
    generateResponse: () => {
      return [`Giá và các gói đồng hành xem ở tab 'Quản lý' trong Cổng thành viên nha — đủ info luôn.`, `Kể tớ nghe nhu cầu của cậu, tớ gợi ý gói hợp nhất cho!`];
    }
  },
  {
    id: "joy_currency",
    tier: "paid",
    patterns: INTENT_PATTERNS.joy_currency,
    generateResponse: () => {
      return [`JOY là tiền nội bộ hệ thống — kiếm bằng cách giới thiệu bạn bè hoặc đổi quà tặng`, `Dùng JOY mở liệu pháp AI cao cấp hoặc mua đồ ở Cửa hàng. Xem số dư ở tab 'JOY' nha!`];
    }
  },
  {
    id: "token_limit",
    tier: "paid",
    patterns: INTENT_PATTERNS.token_limit,
    generateResponse: () => {
      return [`Mỗi ngày cậu có 10 token chat. Chào hỏi, cảm ơn, tâm sự thường thì miễn phí hết.`, `Câu hỏi tớ trả lời ngay = 1 token, cần suy nghĩ sâu = 3 token.`, `Reset mỗi ngày mới — hoặc mua thêm bằng JOY nếu cần gấp!`];
    }
  },
  {
    id: "about_creator",
    tier: "paid",
    patterns: INTENT_PATTERNS.about_creator,
    generateResponse: () => {
      return [`Tớ được Hugo Studio xây và huấn luyện nè.`, `Mục tiêu là làm bạn đồng hành tâm lý học đường cho học sinh sinh viên Việt Nam — cải tiến liên tục để nghe cậu tốt hơn mỗi ngày!`];
    }
  },
  {
    id: "data_privacy",
    tier: "paid",
    patterns: INTENT_PATTERNS.data_privacy,
    generateResponse: () => {
      return [`Mọi tâm sự + dữ liệu hồ sơ của cậu được bảo mật hoàn toàn, chỉ dùng để tớ cá nhân hoá hỗ trợ thôi.`, `Không chia cho bên thứ ba đâu — cứ yên tâm tâm sự thật lòng nha!`];
    }
  },
  {
    id: "support_contact",
    tier: "paid",
    patterns: INTENT_PATTERNS.support_contact,
    generateResponse: () => {
      return [`Lỗi kỹ thuật hay cần người thật hỗ trợ thì bấm vào khung chat hỗ trợ ở trang chủ nha, team Hugo Studio phản hồi sớm lắm.`, `Còn chuyện tâm lý thì cứ kể tớ trước đã!`];
    }
  },
  {
    id: "loneliness",
    tier: "paid",
    patterns: INTENT_PATTERNS.loneliness,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return _rotate("loneliness", [
        [`Cô đơn dù xung quanh đầy người — cảm giác đó rất thật, không phải cậu "vô lý" đâu ${name} ơi.`, `Thường không phải thiếu người, mà thiếu một kết nối đủ sâu để được thật sự hiểu thôi.`, `Cậu bắt đầu thấy lạc lõng từ lúc nào vậy?`],
        [`Lạc lõng giữa đám đông đôi khi còn cô đơn hơn một mình ${name} ơi.`, `Không phải cậu "không bình thường" — rất nhiều bạn cùng tuổi cảm giác y chang.`, `Cậu có người nào thật sự lắng nghe cậu chưa?`],
        [`Tớ đang ở đây ${name}, và tớ muốn nghe cậu kể 💙`, `Đôi khi chỉ cần ai đó thật sự hiểu — không cần fix gì hết, chỉ cần nghe.`, `Cậu đang cảm thấy lạc lõng vì điều gì nhất?`],
      ]);
    }
  },
  {
    id: "family_conflict",
    tier: "paid",
    patterns: INTENT_PATTERNS.family_conflict,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "family_conflict",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Mâu thuẫn{who} nhiều khi chỉ là hai bên "nói chuyện khác kênh" thôi — không hẳn là không thương nhau.`,
          `Nhà mà cũng cãi nhau chan chát được thì đúng là một gia đình thật rồi đó {name} 😅, chỉ là lần này chắc đau hơn thường lệ.`,
          `{name} ơi, bị áp đặt hoài đúng là ngộp thở thật đó — không phải cậu "khó chiều" đâu.`,
        ],
        validations: [
          `Cảm giác bị áp đặt của {name} hoàn toàn hợp lý mà.`,
          `Bố mẹ thương theo kiểu của họ, còn cậu cần được hiểu theo kiểu của cậu — hai điều đó nhiều khi không khớp nhịp với nhau.`,
          `Có những nhà thương nhau bằng cách kỳ vọng, chứ không phải bằng cách hỏi han — dễ hiểu lầm lắm.`,
        ],
        questions: [
          `Kể tớ nghe chuyện vừa xảy ra đi, gỡ rối cùng nhau nha.`,
          `Trận này là về chuyện gì vậy, có phải kiểu chuyện muôn thuở không nè?`,
          `Cậu đang cần bố mẹ hiểu điều gì nhất lúc này?`,
        ],
      },
    }),
  },
  {
    id: "friendship_conflict",
    tier: "paid",
    patterns: INTENT_PATTERNS.friendship_conflict,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "friendship_conflict",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Bị tẩy chay hay bully đau thiệt đó {name} ơi 💙`,
          `Bạn bè kiểu đó thì "mất" cũng chẳng tiếc gì đâu {name} — nhưng tớ biết lúc đang ở trong đó thì đau thật, không đùa được.`,
          `{name} ơi, drama kiểu này mệt hơn cả deadline nữa — tớ hiểu.`,
        ],
        validations: [
          `Đây không phải lỗi của cậu — nhớ vậy nha.`,
          `Bị cô lập làm mình hay tự hỏi "có phải do mình" — không, phần lớn là do động lực nhóm, không phải vì cậu tệ.`,
          `Cậu không cần "thắng" cuộc chiến này, chỉ cần được an toàn và có người đứng về phía cậu thôi.`,
        ],
        questions: [
          `Cậu đang an toàn không? Có nói với thầy cô hoặc người lớn tin tưởng chưa?`,
          `Chuyện đang diễn ra ở mức nào rồi, kể tớ nghe chi tiết hơn đi.`,
          `Ai đang ở cạnh cậu lúc này vậy — bạn khác, thầy cô, hay gia đình?`,
        ],
      },
    }),
  },
  {
    id: "breakup",
    tier: "paid",
    patterns: INTENT_PATTERNS.breakup,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "breakup",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Chia tay giống như mất một phần kỳ vọng đã xây cùng nhau — buồn là chuyện đương nhiên {name} ơi 🫂`,
          `{name} ơi, tim vỡ không có phần mềm sửa lỗi nào chữa nhanh được đâu — cần thời gian thật sự.`,
          `Nghe muốn ôm cậu một cái ghê {name} — chia tay dù ai chủ động cũng đau như nhau hết.`,
        ],
        validations: [
          `Đừng ép bản thân "ổn ngay" đâu nha.`,
          `Cứ khóc, cứ nghe nhạc buồn vài hôm cũng được, không ai bắt cậu phải "moved on" đúng deadline cả.`,
          `Não cậu giờ chắc đang phát lại kỷ niệm liên tục đúng không — đó là bình thường, không phải cậu "làm quá" đâu.`,
        ],
        questions: [
          `Điều gì đang làm cậu day dứt nhất về chuyện này?`,
          `Cậu với người đó chia tay kiểu êm hay ồn ào vậy?`,
          `Cậu đang nhớ nhất điều gì về người đó?`,
        ],
      },
    }),
  },
  {
    id: "low_self_esteem",
    tier: "paid",
    patterns: INTENT_PATTERNS.low_self_esteem,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "low_self_esteem",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Lúc buồn, não hay "thổi phồng" lỗi sai và hạ giá trị bản thân — đó không phải sự thật về {name} đâu.`,
          `{name} ơi, cái giọng nói trong đầu đang chê bai cậu suốt ngày ấy — nó không phải là sự thật, nó chỉ là mệt mỏi đang lên tiếng thôi.`,
          `Ai rồi cũng có lúc soi mình qua cái kính lúp lỗi lầm cả {name} à, kể cả những người cậu ngưỡng mộ nhất.`,
        ],
        validations: [
          `Giá trị một người không nằm ở vài lần vấp ngã hay so sánh với ai.`,
          `Cậu đang đánh giá cả con người mình chỉ bằng vài khoảnh khắc tệ nhất — không công bằng với chính cậu chút nào.`,
          `Tự ti không có nghĩa là cậu thật sự kém — nó chỉ là cách bộ não đang cố "bảo vệ" cậu khỏi bị thất vọng thêm thôi.`,
        ],
        questions: [
          `Kể tớ nghe 1 điều — dù nhỏ xíu — cậu đã làm tốt gần đây đi?`,
          `Cái giọng chê bai đó đang nói gì với cậu vậy, thử kể tớ nghe nguyên văn xem?`,
          `Từng có ai nói gì với cậu mà làm cậu tin vào chính mình hơn — thử kể tớ nghe xem?`,
        ],
      },
    }),
  },
  {
    id: "procrastination",
    tier: "paid",
    patterns: INTENT_PATTERNS.procrastination,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "procrastination",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Trì hoãn thường không phải lười — mà là não đang "trốn" cảm giác sợ thất bại hoặc việc quá to đó {name}.`,
          `{name} với cái deadline đang nhìn nhau chằm chằm mà chưa ai chịu nhúc nhích trước hả 😅`,
          `Não người trì hoãn giỏi nhất khoản "để mai tính" — không phải vì lười, mà vì việc đang cảm giác quá tải.`,
        ],
        validations: [
          `Mẹo: chia ra bước đầu tiên cực ngắn (2 phút thôi) để lừa cảm giác quá tải.`,
          `Không cần làm xong cả núi việc ngay — chỉ cần mở file ra thôi cũng đã là thắng rồi.`,
          `Cậu không "vô kỷ luật" đâu — chỉ là bộ não đang chọn cảm giác dễ chịu ngắn hạn thay vì việc khó lâu dài, ai cũng vậy hết.`,
        ],
        questions: [
          `Việc gì cậu đang ôm mà chưa chịu bắt đầu?`,
          `Deadline gần nhất của cậu là bao giờ vậy?`,
          `Phần nào của việc đó đang làm cậu ngán nhất — độ khó hay độ dài?`,
        ],
      },
    }),
  },
  {
    id: "anger",
    tier: "paid",
    patterns: INTENT_PATTERNS.anger,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "anger",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Giận thường là lớp vỏ ngoài che một cảm giác sâu hơn — bị tổn thương hay bất công — hoàn toàn bình thường {name} ơi.`,
          `Nghe {name} đang "sôi" thật sự đó — cứ để tớ hứng cơn giận này thay vì nuốt nó vô bụng nha.`,
          `Tức đến mức muốn đập phá thì chắc chắn có chuyện gì đó rất không công bằng vừa xảy ra với {name} rồi.`,
        ],
        validations: [
          `Trước khi phản ứng, hít sâu vài nhịp cho hệ thần kinh dịu lại đã nha.`,
          `Giận không xấu — chỉ là năng lượng cần chỗ thoát an toàn, đừng để nó quay ngược vào chính cậu.`,
          `Cậu có quyền giận, chỉ cần đừng để nó biến thành điều khiến cậu hối hận sau này thôi.`,
        ],
        questions: [
          `Chuyện gì vừa xảy ra vậy?`,
          `Ai hoặc điều gì đang làm cậu tức đến vậy?`,
          `Cậu cần xả hết ra hay cần tớ giúp tìm cách xử lý chuyện đó?`,
        ],
      },
    }),
  },
  {
    id: "panic_attack",
    tier: "free",
    patterns: INTENT_PATTERNS.panic_attack,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`${name} ơi, nghe giống panic attack — đáng sợ thật nhưng KHÔNG nguy hiểm tính mạng, sẽ qua đi 💙`, `Làm cùng tớ ngay: nhìn quanh gọi tên 5 vật thấy, 3 âm thanh nghe được.`, `Rồi hít mũi 4s — nín 4s — thở miệng 6s, lặp vài lần. Cậu đang ở chỗ an toàn không?`];
    }
  },
  {
    id: "grief",
    tier: "paid",
    patterns: INTENT_PATTERNS.grief,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "grief",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tớ rất tiếc vì mất mát lớn này {name} 🫂`,
          `{name} ơi, tớ không biết nói gì cho đủ lúc này — chỉ muốn cậu biết là tớ đang ở đây.`,
          `Mất một người quan trọng để lại một khoảng trống mà không lời nào lấp đầy được ngay {name} à.`,
        ],
        validations: [
          `Đau buồn không có "đúng tiến độ" — cậu được phép buồn bao lâu cậu cần.`,
          `Không có cách "đúng" để đau buồn cả — khóc, im lặng, hay thậm chí thấy tê liệt đều bình thường hết.`,
          `Cậu không cần phải mạnh mẽ ngay lúc này đâu.`,
        ],
        questions: [
          `Tớ ở đây nếu cậu muốn kể về người đó, hay chỉ cần ai ngồi cạnh im lặng cũng được.`,
          `Nếu cậu sẵn sàng, kể tớ nghe một kỷ niệm đẹp với người đó xem.`,
          `Ngay lúc này cậu cần điều gì nhất — được lắng nghe, hay chỉ cần yên tĩnh một chút?`,
        ],
      },
    }),
  },
  {
    id: "future_anxiety",
    tier: "paid",
    patterns: INTENT_PATTERNS.future_anxiety,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "future_anxiety",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Hoang mang về tương lai ở tuổi cậu là cực kỳ bình thường — không ai bắt buộc phải biết hết ngay đâu {name}.`,
          `{name} ơi, ngay cả người 30 tuổi vẫn còn đang "định hướng lại" ấy — cậu không hề chậm chân đâu.`,
          `Tương lai mờ mịt nghe đáng sợ, nhưng thật ra phần lớn tụi mình đều đang dò đường trong bóng tối cả thôi.`,
        ],
        validations: [
          `Thay vì tìm câu trả lời "đúng tuyệt đối", cứ khám phá dần thôi.`,
          `Không có "một con đường đúng duy nhất" — chỉ có những bước tiếp theo hợp lý mà thôi.`,
          `Cảm giác áp lực phải "biết hết" ngay bây giờ là do xung quanh hối thúc, chứ không phải vì cậu có gì sai.`,
        ],
        questions: [
          `Gần đây điều gì làm cậu thấy hứng thú hoặc tò mò nhất?`,
          `Cậu đang lo nhất về chuyện chọn ngành, hay về việc chưa biết mình muốn gì?`,
          `Nếu không sợ chọn sai, cậu sẽ thử điều gì trước?`,
        ],
      },
    }),
  },
  {
    id: "checkin_feature",
    tier: "paid",
    patterns: INTENT_PATTERNS.checkin_feature,
    generateResponse: () => {
      return [`Check-in là ghi nhận tâm trạng mỗi ngày — chỉ vài giây thôi!`, `Giúp tớ thấy xu hướng cảm xúc của cậu theo thời gian (chuỗi ngày liên tục = "streak"), từ đó gợi ý đúng cái cậu cần. Check-in ngay đầu khung chat nha!`];
    }
  },
  {
    id: "venting_space",
    tier: "paid",
    patterns: INTENT_PATTERNS.venting_space,
    generateResponse: () => {
      return [`"Trút Bầu Tâm Sự An Toàn" là chế độ tin nhắn tự xoá sau thời gian cậu chọn — KHÔNG lưu lại đâu hết 🔒`, `Trút sạch những điều khó nói mà không lo bị đọc lại. Bật ngay trong khung chat nha!`];
    }
  },
  {
    id: "room_organization",
    tier: "paid",
    patterns: INTENT_PATTERNS.room_organization,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Phòng bừa thường làm đầu óc rối theo đó, ${name}!`, `Mẹo: tách 3 khu riêng — học/ngủ/thư giãn — và dọn sạch mặt bàn học trước.`, `Ánh sáng tự nhiên + 1 góc cây xanh nhỏ cũng giúp tinh thần nhẹ hẳn. Cậu đang khó ở khu nào nhất?`];
    }
  },
  {
    id: "mindful_spending",
    tier: "paid",
    patterns: INTENT_PATTERNS.mindful_spending,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tự thưởng bản thân — mua cây, món đồ nhỏ — là cách chăm sóc tinh thần hoàn toàn lành mạnh đó ${name}!`, `Chỉ cần để ý: nếu mua sắm là cách DUY NHẤT để né cảm xúc khó, hoặc làm cậu lo về tài chính sau đó, thì chững lại xíu.`, `Món cậu đang muốn mua là gì, kể tớ nghe thử?`];
    }
  },

  // ─── NEW INTENTS ────────────────────────────────────────────────────────────

  {
    id: "burnout",
    tier: "paid",
    patterns: INTENT_PATTERNS.burnout,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return _rotate("burnout", [
        [`Burnout khác với mệt thường — đây là cơ thể và tâm trí đang đình công luôn đó ${name} 😮‍💨`, `Không phải cậu yếu hay lười — cậu đã gồng quá lâu mà không được nạp lại.`, `Gần đây cậu có khoảng thời gian nào hoàn toàn cho bản thân chưa?`],
        [`Cơ thể cậu đang gửi tín hiệu "dừng lại" đấy ${name} ơi — không phải yêu cầu, là lệnh.`, `Hỏi thật: gần đây cậu đang chạy bao nhiêu thứ một lúc?`, `Kể tớ nghe cậu đang gồng những gì nha.`],
        [`Kiệt sức kiểu này khó giải thích với người ngoài lắm ${name} — tớ hiểu.`, `Recovery từ burnout cần thời gian và sự tử tế với bản thân — không phải ý chí mạnh hơn.`, `Cậu nghĩ điều gì đang "hút năng lượng" của cậu nhiều nhất?`],
      ]);
    }
  },
  {
    id: "social_comparison",
    tier: "paid",
    patterns: INTENT_PATTERNS.social_comparison,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "social_comparison",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Mạng xã hội chỉ "chiếu" highlight của người khác — mình lại so với cả cuộc đời họ, game đó không công bằng chút nào 😅`,
          `{name} ơi, so cuộc đời thật của mình với cái "trailer" đã edit của người khác thì thua là cái chắc rồi 😩`,
          `FOMO là cảm giác rất người — không phải vì {name} thiếu bản lĩnh đâu.`,
        ],
        validations: [
          `Hành trình của {name} có nhịp riêng của nó, không cần sync với ai.`,
          `Người ta cũng đang so sánh với ai đó khác thôi — vòng lặp này không ai thắng cả.`,
          `Cái mình thấy trên mạng chỉ là 1% khoảnh khắc đẹp nhất họ chọn đăng — không phải cả bức tranh.`,
        ],
        questions: [
          `Gần đây cậu so sánh mình với ai — bạn học hay idol trên mạng?`,
          `Nếu tắt hết mạng xã hội một tuần, cậu nghĩ mình sẽ thấy thế nào?`,
          `Điều gì ở người đó đang làm cậu chạnh lòng nhất vậy?`,
        ],
      },
    }),
  },
  {
    id: "perfectionism",
    tier: "paid",
    patterns: INTENT_PATTERNS.perfectionism,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "perfectionism",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Cầu toàn thực ra là "trì hoãn được nguỵ trang" khéo lắm {name} ơi!`,
          `{name} đang đặt cho mình một tiêu chuẩn mà chính cậu cũng khó lòng đạt tới trong một lần thử đầu tiên đó.`,
          `Sợ làm sai đến mức không dám bắt đầu — nghe quen lắm, gần như ai cầu toàn cũng vậy cả {name} à.`,
        ],
        validations: [
          `"Đủ tốt và hoàn thành" thường có giá trị hơn "hoàn hảo nhưng chưa bắt đầu" đó nha.`,
          `Không ai làm đúng ngay từ lần đầu cả — bản nháp xấu xí vẫn tốt hơn một trang giấy trắng.`,
          `Áp lực hoàn hảo thường xuất phát từ nỗi sợ bị đánh giá, chứ không phải vì cậu thật sự cần hoàn hảo.`,
        ],
        questions: [
          `Điều gì đang khiến cậu chưa dám bắt tay vô?`,
          `Nếu cho phép mình làm "tạm ổn" thay vì "hoàn hảo", cậu nghĩ mình đã xong chưa?`,
          `Cậu đang cầu toàn ở việc gì cụ thể vậy?`,
        ],
      },
    }),
  },
  {
    id: "body_image",
    tier: "paid",
    patterns: INTENT_PATTERNS.body_image,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "body_image",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tự ti ngoại hình rất phổ biến ở tuổi {name} — áp lực hình thể từ mạng xã hội và bạn bè nhiều lắm.`,
          `{name} ơi, bộ lọc và góc chụp trên mạng đang âm thầm đặt ra một chuẩn mực chẳng ai đạt nổi ngoài đời thật đâu.`,
          `Cảm giác không hài lòng với ngoại hình dễ trở thành cái loa to nhất trong đầu — nhưng nó không phải sự thật duy nhất về {name}.`,
        ],
        validations: [
          `Cơ thể cậu đang làm rất nhiều thứ cho {name} mỗi ngày, kể cả ngày cậu không thích nó.`,
          `Ngoại hình chỉ là một phần rất nhỏ trong những gì làm nên giá trị của cậu.`,
          `Cậu không cần phải yêu cơ thể mình 100% mỗi ngày — chỉ cần đừng để nó trở thành lý do cậu ghét chính mình.`,
        ],
        questions: [
          `Cảm giác này xuất phát từ đâu — có ai nói gì, hay tự so sánh với ai đó?`,
          `Trước đây có phần nào trên cơ thể mà cậu từng thấy ổn với nó, kể tớ nghe xem?`,
          `Điều này bắt đầu làm cậu khó chịu từ khi nào vậy?`,
        ],
      },
    }),
  },
  {
    id: "phone_addiction",
    tier: "paid",
    patterns: INTENT_PATTERNS.phone_addiction,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "phone_addiction",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `{name} tự nhận ra điều này là bước đầu rất tỉnh táo rồi đó!`,
          `Cầm điện thoại lên "1 phút" rồi ngẩng đầu thấy đã trôi qua cả tiếng — chuyện này quen thuộc phết {name} nhỉ 😅`,
          `Điện thoại được thiết kế để gây nghiện — dopamine mỗi lần scroll là real khoa học luôn, không phải do {name} yếu ý chí đâu.`,
        ],
        validations: [
          `Mấy app đó thuê hẳn đội ngũ chuyên nghiên cứu cách giữ chân người dùng lâu nhất có thể — cậu đang đấu với cả một hệ thống, không phải chỉ mỗi bản thân.`,
          `Nhận ra vấn đề đã là hơn một nửa chặng đường rồi đó {name}.`,
          `Không cần cai tuyệt đối ngay — giảm dần vẫn tính là tiến bộ.`,
        ],
        questions: [
          `Thử "digital detox" nhỏ: đặt điện thoại sang phòng khác 30 phút. Cậu nghĩ mình sẽ chịu được đến đâu?`,
          `App nào đang "ngốn" thời gian của cậu nhiều nhất vậy?`,
          `Cậu dùng điện thoại nhiều nhất vào lúc nào — học bài xong hay lúc buồn chán?`,
        ],
      },
    }),
  },
  {
    id: "social_anxiety",
    tier: "paid",
    patterns: INTENT_PATTERNS.social_anxiety,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "social_anxiety",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Social anxiety là một trong những vấn đề phổ biến nhất ở giới trẻ — {name} không một mình đâu nha.`,
          `{name} ơi, cảm giác như cả căn phòng đang soi mình — tớ hiểu áp lực đó nặng cỡ nào.`,
          `Sợ bị phán xét đến mức ngại mở lời là chuyện rất nhiều người giấu kín, không phải chỉ riêng cậu đâu.`,
        ],
        validations: [
          `Não đang "thổi phồng" mức độ người khác chú ý đến cậu — thực tế họ bận với chính họ hơn cậu nghĩ rất nhiều.`,
          `Sự thật là gần như ai cũng đang quá bận lo về bản thân họ để soi cậu kỹ như cậu tưởng.`,
          `Không cần phải "sửa" hết lo âu mới được phép sống bình thường — cứ đi từng bước nhỏ thôi.`,
        ],
        questions: [
          `Tình huống nào đang làm cậu anxious nhất gần đây?`,
          `Có phải trước đám đông, hay chỉ với người lạ thôi vậy?`,
          `Lần gần nhất cậu vượt qua được một tình huống ngại như vậy là khi nào?`,
        ],
      },
    }),
  },
  {
    id: "homesickness",
    tier: "paid",
    patterns: INTENT_PATTERNS.homesickness,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "homesickness",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Nhớ nhà là cảm giác nặng và thật lắm — không phải cậu yếu đâu {name} ơi.`,
          `{name} ơi, mùi cơm mẹ nấu với cái giường quen thuộc ở nhà đúng là thứ không gì thay thế được thật.`,
          `Xa nhà đợt đầu ai cũng tưởng mình mạnh mẽ, đến lúc nhớ nhà mới biết nó thấm cỡ nào {name} nhỉ.`,
        ],
        validations: [
          `Xa nhà cũng đồng nghĩa với đang lớn và mở rộng thế giới — nhưng điều đó không làm nỗi nhớ bớt thật chút nào.`,
          `Nhớ nhà không phải là dấu hiệu cậu chưa trưởng thành — ngược lại là khác, nó cho thấy cậu có một nơi để thương.`,
          `Cảm giác này rồi sẽ dịu bớt theo thời gian, nhưng ngay lúc này cứ để mình được nhớ, không cần vội "quen".`,
        ],
        questions: [
          `Lần gần nhất cậu gọi video về nhà là khi nào vậy?`,
          `Điều gì ở nhà làm cậu nhớ nhất — người, món ăn, hay chỉ là cảm giác quen thuộc?`,
          `Góc nào ở đây khiến cậu thấy hơi giống nhà nhất vậy?`,
        ],
      },
    }),
  },
  {
    id: "first_love",
    tier: "paid",
    patterns: INTENT_PATTERNS.first_love,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Ôi, tình đầu nè ${name} 🥹 Cảm giác nhột nhột háo hức kiểu đó không có gì thay thế được!`, `Kể tớ nghe về người đó đi.`, `Hay đang phân vân chưa biết phải làm gì với tình cảm này?`];
    }
  },
  {
    id: "jealousy",
    tier: "paid",
    patterns: INTENT_PATTERNS.jealousy,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "jealousy",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Ghen tị là cảm giác cực bình thường — não tự so sánh là bản năng sinh tồn đó {name} ơi.`,
          `{name} ơi, thấy ghen tị không có nghĩa cậu là người xấu đâu — nó chỉ là một cảm xúc thôi, đừng tự trách quá.`,
          `Cảm giác khó chịu khi thấy người khác có thứ mình muốn — ai cũng từng trải qua, kể cả những người trông "chill" nhất.`,
        ],
        validations: [
          `Cái quan trọng là cảm giác đó đang chỉ cho cậu thấy điều cậu thực sự muốn có là gì.`,
          `Ghen tị nếu nhìn đúng cách lại là một tấm bản đồ chỉ ra ước muốn thật sự của cậu.`,
          `Không cần phải xấu hổ vì có cảm giác này — chỉ cần đừng để nó biến thành ghét bỏ người kia.`,
        ],
        questions: [
          `Cậu đang ghen vì điều gì — tình cảm, thành tích, hay ngoại hình?`,
          `Nếu có điều đó, cậu nghĩ cuộc sống mình sẽ khác thế nào?`,
          `Người đó có làm gì trực tiếp với cậu không, hay chỉ là cảm giác so sánh thôi?`,
        ],
      },
    }),
  },
  {
    id: "concentration",
    tier: "paid",
    patterns: INTENT_PATTERNS.concentration,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "concentration",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Khó tập trung không nhất thiết là ADHD — stress, thiếu ngủ và điện thoại cũng "phá focus" dữ dội lắm {name}.`,
          `{name} ơi, đọc một trang mà đầu óc trôi đi đâu mất — cảm giác quen thuộc ghê, không phải mình cậu đâu.`,
          `Não khó tập trung khi đang quá tải thông tin hoặc thiếu ngủ — không phải vì cậu "kém cỏi" gì cả.`,
        ],
        validations: [
          `Thử Pomodoro: học 25 phút, nghỉ 5 phút, lặp lại. Dời điện thoại ra khỏi tầm nhìn trước.`,
          `Một môi trường ít xao nhãng quan trọng hơn ý chí rất nhiều — đừng tự trách nếu chưa quen được.`,
          `Chỉ cần tập trung tốt hơn một chút mỗi ngày là đã đủ tiến bộ rồi, không cần hoàn hảo ngay.`,
        ],
        questions: [
          `Cậu đang học môn gì mà bị phân tâm nhiều nhất?`,
          `Gần đây cậu ngủ đủ giấc không, đó thường là thủ phạm giấu mặt đó?`,
          `Cậu thường bị phân tâm bởi điện thoại, hay chỉ là đầu óc tự trôi đi?`,
        ],
      },
    }),
  },
  {
    id: "university_exam",
    tier: "paid",
    patterns: INTENT_PATTERNS.university_exam,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "university_exam",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Kỳ thi THPT là thử thách lớn thật — nhưng đây không phải "chung kết cuộc đời" như nhiều người hay nói đâu nha {name}.`,
          `{name} ơi, cả nhà trường lẫn xã hội hay biến kỳ thi này thành "một phát ăn cả" — áp lực đó không hề nhỏ.`,
          `Ôn thi đại học đúng là một chặng dài hơi — mệt là chuyện dễ hiểu {name} à.`,
        ],
        validations: [
          `Dù kết quả thế nào cũng có nhiều con đường dẫn đến ước mơ của cậu — ngách khác thôi, không phải ngõ cụt.`,
          `Rất nhiều người thành công không đi đúng con đường họ vạch ra ở tuổi 18 — điểm số một kỳ thi không định đoạt cả đời cậu.`,
          `Cố gắng hết sức là đủ rồi — không cần phải hoàn hảo mới xứng đáng.`,
        ],
        questions: [
          `Cậu đang ôn môn gì và phần nào làm cậu lo nhất?`,
          `Lịch ôn của cậu dạo này đang sắp xếp ra sao vậy?`,
          `Nếu kết quả không như mong đợi, cậu nghĩ mình vẫn còn lựa chọn nào khác?`,
        ],
      },
    }),
  },
  {
    id: "emptiness",
    tier: "paid",
    patterns: INTENT_PATTERNS.emptiness,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "emptiness",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Trống rỗng, không cảm gì — nghe có vẻ "ổn" nhưng thực ra là dạng mệt mỏi cảm xúc rất thật đó {name}.`,
          `{name} ơi, "không buồn không vui, chỉ trống không" đôi khi mệt hơn cả buồn thật sự — vì chẳng biết gọi tên nó là gì.`,
          `Cảm giác tê liệt cảm xúc này nghe rất lạ, nhưng nó không hề hiếm gặp đâu {name} à.`,
        ],
        validations: [
          `Đôi khi não "tắt cảm xúc" như một cơ chế tự bảo vệ khi đã quá tải rồi.`,
          `Không cảm thấy gì không có nghĩa là cậu "vô cảm" — nó thường là dấu hiệu cậu đã gồng quá lâu.`,
          `Cậu không cần phải ép mình "cảm thấy gì đó" ngay bây giờ — cứ để nó tự đến khi sẵn sàng.`,
        ],
        questions: [
          `Cảm giác này bắt đầu từ khoảng bao lâu nay vậy?`,
          `Điều gì gần đây khiến cậu bắt đầu thấy trống rỗng như vậy?`,
          `Trước đây có điều gì làm cậu thấy hứng thú mà giờ không còn nữa, kể tớ nghe xem?`,
        ],
      },
    }),
  },
  {
    id: "overthinking",
    tier: "paid",
    patterns: INTENT_PATTERNS.overthinking,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "overthinking",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Overthink là não đang cố "kiểm soát" tương lai bằng cách dự đoán hết mọi kịch bản tệ — kiệt sức lắm đó {name}.`,
          `{name} ơi, cái vòng lặp suy nghĩ 100 lần cho cùng một chuyện chắc đang làm đầu cậu quay cuồng ghê lắm.`,
          `Não overthink giống như mở 30 cái tab cùng lúc mà tab nào cũng đang load — mệt là phải {name} à.`,
        ],
        validations: [
          `Khi nhận ra mình đang vòng vòng, thử hỏi: "Điều tớ lo có xảy ra ngay lúc này không?" — nếu không, kéo về hiện tại nha.`,
          `Nghĩ nhiều không có nghĩa là nghĩ đúng — não đang lặp lại, không phải đang giải quyết vấn đề.`,
          `Cậu không cần tìm ra câu trả lời hoàn hảo ngay bây giờ — cho phép mình tạm gác lại cũng được.`,
        ],
        questions: [
          `Cậu hay overthink về chủ đề gì nhất — học hành, tình cảm, hay tương lai?`,
          `Suy nghĩ nào đang lặp đi lặp lại nhiều nhất trong đầu cậu lúc này?`,
          `Nếu viết hết những suy nghĩ đó ra giấy, cậu nghĩ đầu óc mình sẽ nhẹ hơn được bao nhiêu?`,
        ],
      },
    }),
  },
  {
    id: "exercise_request",
    tier: "paid",
    patterns: INTENT_PATTERNS.exercise_request,
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ mở ngay bài tập thở cho ${name} nha!`, `Vào tab 'Trị Liệu' → 'Thở 4-7-8' để tớ hướng dẫn cậu từng bước — hoặc thử ngay: hít mũi 4 giây, nín 4 giây, thở miệng 6 giây, lặp 4 lần.`];
    }
  },
  {
    id: "guide_bio_link",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_bio_link,
    generateResponse: () => {
      return [
        "Để làm một trang Bio Link siêu chất, cậu hãy vào mục Bio Editor trong Member Portal nha.",
        "Ở đó cậu tha hồ chỉnh sửa thông tin cá nhân (hoặc thông số chiều cao, cân nặng, ba vòng) và chỉnh giao diện trong tab Theme theo style của riêng cậu.",
        "Cậu có thể chọn các mẫu theme cực xịn gồm Flat, Brutalism, Neo-brutalism, Glassmorphism, thay đổi màu nền, bo góc nút từ 0px đến 24px, viền nút và bóng đổ nữa đó nha."
      ];
    }
  },
  {
    id: "guide_booking",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_booking,
    generateResponse: () => {
      return [
        "Khách hàng khi ghé thăm Bio Link của cậu chỉ cần bấm vào nút Đăng ký lịch chụp/hẹn là điền được thông tin đặt lịch.",
        "Lịch đặt của khách sẽ tự động đồng bộ ngay lập tức về tab Quản lý lịch hẹn trong Member Portal của cậu luôn đó.",
        "Ở đó hiển thị sẵn số Zalo và Email của khách để cậu liên hệ hẹn lịch chụp nhanh chóng."
      ];
    }
  },
  {
    id: "guide_qr",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_qr,
    generateResponse: () => {
      return [
        "Trình tạo QR (trong HugoKit ở thẻ Tiện ích) cho phép cậu tạo mã QR cho Wi-Fi, URL, Văn bản, hoặc cả Danh bạ (vCard).",
        "Chỉ cần quét là điện thoại tự động bật popup lưu danh bạ mà không cần Internet!",
        "Cậu có thể tải về file ảnh siêu nét (PNG) hoặc in ra quét offline mượt mà."
      ];
    }
  },
  {
    id: "guide_signature",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_signature,
    generateResponse: () => {
      return [
        "Tab HugoSMail giúp cậu tạo chữ ký email thương hiệu.",
        "Cậu có thể chọn Font, màu sắc, tích hợp icon mạng xã hội tự động, rồi tải file HTML về hoặc Copy chèn thẳng vào Gmail/Outlook nha."
      ];
    }
  },
  {
    id: "guide_ide",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_ide,
    generateResponse: () => {
      return [
        "IDE trong Study with Hugo là trình soạn thảo lập trình trực quan (C, C++, C#, Python, Web, PHP) chạy ngay trên trình duyệt.",
        "Trình IDE đi kèm các bài học lập trình cơ bản và hỗ trợ tải code về máy."
      ];
    }
  },
  {
    id: "guide_chess",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_chess,
    generateResponse: () => {
      return [
        "HugoChess (ở Tab Utilities) là không gian sảnh cờ vua mini giúp cậu thi đấu với Stockfish AI, ghép đôi ngẫu nhiên hoặc tạo phòng đấu giao hữu cùng bạn bè để tích điểm xếp hạng JOY."
      ];
    }
  },
  {
    id: "guide_partners",
    tier: "free",
    patterns: INTENT_PATTERNS.guide_partners,
    generateResponse: () => {
      return [
        "Các đối tác liên kết muốn nhúng trình chỉnh sửa Bio Link của Hugo Studio lên trang web riêng của họ thì có thể sử dụng Iframe URL cùng khóa bảo mật do Admin cấp riêng trong Admin Panel nha."
      ];
    }
  },
  {
    id: "existential_crisis",
    tier: "paid",
    patterns: INTENT_PATTERNS.existential_crisis,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "existential_crisis",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tớ nghe đây {name}. Cảm giác chông chênh, tự hỏi "mình sống để làm gì" hay thấy mọi thứ vô nghĩa thực sự rất mệt mỏi và cô đơn.`,
          `{name} ơi, những câu hỏi kiểu "mình tồn tại để làm gì" nghe to tát nhưng thật ra gần như ai cũng từng tự hỏi mình như vậy.`,
          `Mất phương hướng không có nghĩa là cậu đang đi sai — đôi khi nó chỉ là dấu hiệu cậu đang lớn lên và cần định nghĩa lại mọi thứ thôi.`,
        ],
        validations: [
          `Thực ra, không có một "đáp án mẫu" nào cho ý nghĩa cuộc sống cả. Ý nghĩa không phải thứ có sẵn để đi tìm, mà là thứ mình tự định nghĩa qua những trải nghiệm nhỏ nhất mỗi ngày.`,
          `Không cần phải tìm ra "mục đích lớn" ngay bây giờ — những điều nhỏ khiến cậu thấy dễ chịu mỗi ngày cũng đáng giá.`,
          `Cảm giác vô nghĩa này thường đến khi mình quá mệt để cảm nhận ý nghĩa, chứ không phải vì cuộc sống thật sự vô nghĩa.`,
        ],
        questions: [
          `Cậu đang cảm thấy chông chênh và mất phương hướng nhất ở điểm nào? Học tập, gia đình, hay định vị bản thân thế?`,
          `Điều gì — dù nhỏ — từng làm cậu thấy cuộc sống đáng sống, kể tớ nghe xem?`,
          `Cảm giác này đến gần đây thôi hay đã kéo dài một thời gian rồi?`,
        ],
      },
    }),
  },
  {
    id: "trauma",
    tier: "paid",
    patterns: INTENT_PATTERNS.trauma,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "trauma",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tớ ôm cậu một cái thật chặt nha {name} 🫂 Những tổn thương hay ký ức đau lòng trong quá khứ không phải là thứ dễ dàng trôi qua.`,
          `{name} ơi, quá khứ đôi khi vẫn còn nguyên vẹn cảm giác đau như mới hôm qua — điều đó không có nghĩa là cậu chưa đủ mạnh mẽ.`,
          `Nhắc lại chuyện cũ mà vẫn nhói — đó là dấu hiệu vết thương thật, không phải cậu đang "làm quá" đâu {name}.`,
        ],
        validations: [
          `Việc đột nhiên nhớ lại (flashback) hay thấy đau nhói là phản ứng tự nhiên khi vết thương lòng chưa được chữa lành hoàn toàn. Cậu không có lỗi gì cả.`,
          `Không có mốc thời gian bắt buộc nào để "vượt qua" một tổn thương cả — cậu được phép đi chậm theo nhịp của mình.`,
          `Cậu không cần phải kể hết mọi chi tiết nếu chưa sẵn sàng — chỉ cần biết là tớ vẫn ở đây.`,
        ],
        questions: [
          `Tớ luôn ở đây để lắng nghe. Nếu cậu sẵn sàng, cậu có muốn chia sẻ một chút về ký ức đang làm cậu thấy nhói lòng nhất không?`,
          `Điều gì vừa gợi lại ký ức đó cho cậu vậy?`,
          `Ngay lúc này cậu cần được lắng nghe, hay cần một cách nào đó để thấy an toàn hơn?`,
        ],
      },
    }),
  },
  {
    id: "money_stress",
    tier: "paid",
    patterns: INTENT_PATTERNS.money_stress,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "money_stress",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tiền bạc thực sự là một áp lực cực kỳ thực tế và đè nặng lên vai {name} đúng không?`,
          `{name} ơi, lo tiền là kiểu stress "âm ỉ" nhất — nó len vào mọi quyết định nhỏ trong ngày, mệt lắm.`,
          `Vừa lo học vừa lo tiền cùng lúc đúng là quá sức chịu đựng bình thường của một người rồi {name} à.`,
        ],
        validations: [
          `Vừa lo học hành vừa lo tài chính, hoặc thấy gia đình chật vật vì học phí chắc chắn khiến cậu thấy bất an và mệt mỏi.`,
          `Áp lực tài chính không phải điều cậu "nên tự lo được hết" ở tuổi này — đây là gánh nặng thật sự, không phải cậu yếu kém.`,
          `Cảm giác bất an vì tiền là hoàn toàn hợp lý, không có gì phải xấu hổ khi nói ra điều này cả.`,
        ],
        questions: [
          `Gần đây cậu đang phải đối mặt với khoản chi tiêu hay khó khăn tài chính cụ thể nào thế? Kể tớ nghe xem có hướng gỡ rối nào không nha.`,
          `Áp lực này đến từ học phí, chi tiêu hàng ngày, hay lo cho cả gia đình vậy?`,
          `Cậu đã thử tâm sự chuyện này với ai trong nhà chưa?`,
        ],
      },
    }),
  },
  {
    id: "imposter_syndrome",
    tier: "paid",
    patterns: INTENT_PATTERNS.imposter_syndrome,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "imposter_syndrome",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Cảm giác lo sợ mọi người sẽ "phát hiện ra" mình không thực sự giỏi, hay nghĩ thành công chỉ là do ăn may... đó chính là Hội chứng kẻ giả mạo (Imposter Syndrome) đó {name}.`,
          `{name} ơi, càng giỏi mà càng thấy mình "chưa đủ giỏi" thì nghe nghịch lý, nhưng lại cực kỳ phổ biến đó.`,
          `Cái cảm giác "sợ bị phát hiện là mình không xứng đáng" nghe quen không {name}? Rất nhiều người tài giỏi cũng mang nó theo mỗi ngày.`,
        ],
        validations: [
          `Thực tế, những người giỏi và cầu toàn lại là những người dễ bị cảm giác này nhất. Sự nỗ lực của cậu là có thật, kết quả cậu đạt được là xứng đáng!`,
          `May mắn có thể góp một phần, nhưng công sức và năng lực cậu bỏ ra để tận dụng cơ hội đó mới là thứ thật sự quan trọng.`,
          `Nghi ngờ bản thân không có nghĩa là cậu thật sự kém — nó chỉ là một cảm giác, không phải bằng chứng.`,
        ],
        questions: [
          `Điều gì gần đây đang làm cậu thấy nghi ngờ năng lực của bản thân mình nhất vậy?`,
          `Thành tích gần đây nào cậu đạt được mà lại tự nhủ "chắc do may mắn thôi", kể tớ nghe xem?`,
          `Nếu một người bạn thân đạt được điều cậu vừa làm, cậu sẽ nói gì với họ?`,
        ],
      },
    }),
  },
  {
    id: "pet_grief",
    tier: "paid",
    patterns: INTENT_PATTERNS.pet_grief,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "pet_grief",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Tớ xin chia buồn với cậu nha {name} 🫂 Sự ra đi của một bạn thú cưng thực sự giống như việc mất đi một thành viên gia đình vậy.`,
          `{name} ơi, tớ biết em ấy không chỉ là một con vật với cậu — mất đi một người bạn thân thiết như vậy đau thật sự.`,
          `Nỗi đau khi mất thú cưng nhiều khi bị người khác xem nhẹ, nhưng với {name} thì nó hoàn toàn có thật và rất lớn.`,
        ],
        validations: [
          `Nỗi đau này là hoàn toàn có thật và rất lớn, cậu có quyền được khóc, được nhớ thương em ấy mà không cần gượng ép bản thân phải quên đi ngay.`,
          `Không ai có quyền nói "chỉ là một con vật thôi" — với cậu, em ấy là gia đình.`,
          `Cậu được phép buồn bao lâu cậu cần, không có thời hạn nào cho việc này cả.`,
        ],
        questions: [
          `Em ấy đã có một khoảng thời gian thật hạnh phúc khi được cậu yêu thương. Nếu cậu sẵn sàng, kể tớ nghe kỷ niệm đáng yêu nhất của hai đứa xem.`,
          `Cậu và em ấy đã ở bên nhau bao lâu rồi?`,
          `Ngay lúc này cậu cần điều gì nhất — được kể về em ấy, hay chỉ cần yên tĩnh một chút?`,
        ],
      },
    }),
  },
  {
    id: "lgbtq_confusion",
    tier: "paid",
    patterns: INTENT_PATTERNS.lgbtq_confusion,
    generateResponse: (bio, historyLogs, memory, rawText) => composeIntentReply({
      id: "lgbtq_confusion",
      name: getFriendlyName(bio),
      rawText,
      memory,
      traits: getLatestBigFive(historyLogs),
      slots: {
        openers: [
          `Hành trình tìm hiểu và định vị bản thân (bao gồm cả xu hướng tính dục) cần thời gian và sự dịu dàng với chính mình {name} ạ.`,
          `{name} ơi, băn khoăn về giới tính hay xu hướng tính dục của mình là một phần rất con người của việc tự khám phá bản thân.`,
          `Cảm giác hoang mang này không có gì "sai" cả {name} — nó chỉ là một chặng trong hành trình hiểu chính mình thôi.`,
        ],
        validations: [
          `Cậu không cần phải lập tức dán nhãn cho mình là ai. Việc băn khoăn, hoang mang hay sợ bị phán xét hoàn toàn là cảm xúc bình thường trên con đường tự khám phá.`,
          `Cậu có toàn quyền đi theo tốc độ của riêng mình, không ai được ép cậu phải "biết chắc" ngay.`,
          `Dù cậu là ai, điều đó không làm cậu bớt xứng đáng được yêu thương và tôn trọng.`,
        ],
        questions: [
          `Cậu đang cảm thấy bối rối hay gặp áp lực từ đâu nhất? Bạn bè, gia đình hay chỉ là những mâu thuẫn bên trong cậu?`,
          `Ai là người — bạn bè hay người lớn nào — mà cậu cảm thấy an toàn để tâm sự chuyện này nhất?`,
          `Điều gì đang làm cậu lo lắng nhất về việc này vậy?`,
        ],
      },
    }),
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// QUICK-REPLY CHIPS — shown below bot messages to short-circuit follow-up typing.
// Each string is the exact message text sent when user taps the chip.
// Keeps common follow-ups local (no AI call consumed).
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_QUICK_REPLIES = {
  greeting:          ["Tớ đang ổn", "Tớ có chuyện muốn kể", "Tớ đang lo lắng", "Làm test tâm lý thôi"],
  sadness:           ["Kể thêm cho tớ nghe", "Cho tớ bài tập thở", "Xem chỉ số tâm lý của tớ"],
  anxiety:           ["Dạy tớ thở sâu nha", "Tớ muốn tâm sự thêm", "Làm test lo âu đi"],
  burnout:           ["Kể thêm cho tớ", "Cho tớ bài thư giãn", "Tớ cần nghỉ ngơi"],
  academic_stress:   ["Cho tớ mẹo học nha", "Tớ đang rất căng thẳng", "Làm test tâm lý đi"],
  procrastination:   ["Cho tớ mẹo bắt đầu", "Kể thêm nha", "Tớ cần được động viên"],
  loneliness:        ["Kể thêm cho tớ nghe", "Cho tớ bài tập thư giãn", "Tớ muốn kết nối hơn"],
  low_self_esteem:   ["Kể thêm cho tớ", "Tớ cần được động viên", "Nhắc tớ điều tớ làm tốt nha"],
  social_comparison: ["Kể thêm nha", "Tớ muốn thoát FOMO", "Nhắc tớ về giá trị bản thân"],
  overthinking:      ["Dạy tớ thoát overthink", "Cho tớ bài tập thở", "Kể tớ nghe cậu đang lo gì"],
  future_anxiety:    ["Kể thêm cho tớ nghe", "Tớ cần lời khuyên", "Làm test tâm lý thôi"],
  sleep:             ["Cho tớ mẹo ngủ ngon", "Bật nhạc thiên nhiên đi", "Tớ hay thức đến mấy giờ"],
  anger:             ["Kể thêm cho tớ nghe", "Dạy tớ bình tĩnh lại", "Tớ cần xả hết ra"],
  breakup:           ["Kể thêm cho tớ nghe", "Tớ đang rất đau", "Cho tớ lời khuyên nha"],
  family_conflict:   ["Kể thêm nha", "Tớ muốn hòa giải", "Tớ cần không gian"],
  emptiness:         ["Kể thêm cho tớ", "Tớ muốn cảm giác trở lại", "Làm test tâm lý đi"],
  positive:          ["Kể thêm đi", "Tớ muốn check-in", "Chia sẻ thêm cho tớ nghe"],
  perfectionism:     ["Kể thêm cho tớ", "Tớ đang sợ làm sai", "Cho tớ tư duy tích cực hơn"],
  social_anxiety:    ["Kể thêm nha", "Dạy tớ tự tin hơn", "Tớ cần bài tập nha"],
  homesickness:      ["Kể thêm cho tớ nghe", "Tớ nhớ nhà lắm", "Tớ sẽ gọi về nhà"],
  first_love:        ["Kể thêm về người đó", "Tớ đang phân vân", "Tớ muốn tỏ tình"],
  university_exam:   ["Cho tớ mẹo ôn thi", "Tớ đang rất căng thẳng", "Làm test stress đi"],
  concentration:     ["Cho tớ mẹo focus", "Kể thêm nha", "Tớ thử Pomodoro thôi"],
  clinical_tests:    ["Làm PHQ-9 ngay", "Làm GAD-7 ngay", "Cậu gợi ý bài test nào?"],
  therapy_catalog:   ["Mở bài thở 4-7-8", "Tớ muốn thiền", "Tớ muốn nghe nhạc thư giãn"],
  exercise_request:  ["Thở 4-7-8 ngay nha", "Tớ muốn thiền", "Bài tập khác nha"],
  body_image:        ["Kể thêm cho tớ", "Tớ muốn yêu cơ thể hơn", "Cảm giác này từ đâu?"],
  phone_addiction:   ["Kể thêm nha", "Tớ thử digital detox", "Cho tớ mẹo cai điện thoại"],
  jealousy:          ["Kể thêm cho tớ", "Tớ đang ghen về điều gì?", "Cho tớ góc nhìn khác nha"],
  grief:             ["Kể thêm cho tớ", "Tớ chỉ cần ai nghe", "Kể về người đó cho tớ nghe"],
  panic_attack:      ["Tớ thở sâu nha", "Cậu ở bên tớ nha", "Bài tập 5-4-3-2-1"],
  guide_bio_link:    ["Chỉnh theme thế nào", "Hướng dẫn đặt lịch", "Vào Bio Editor"],
  guide_booking:     ["Xem lịch ở đâu", "Chỉnh theme thế nào", "Vào Quản lý lịch"],
  guide_qr:          ["Tạo QR danh bạ", "Tạo QR Wi-Fi", "Vào thẻ Tiện ích"],
  guide_signature:   ["Tạo chữ ký thế nào", "Vào HugoSMail"],
  guide_ide:         ["Học lập trình", "Vào Study with Hugo"],
  guide_chess:       ["Đấu với AI", "Vào HugoChess"],
  guide_partners:    ["Nhúng Iframe thế nào", "Khóa bảo mật ở đâu"],
  existential_crisis: ["Kể thêm nha", "Tớ thấy vô định", "Làm sao tìm mục tiêu?"],
  trauma:             ["Kể thêm cho tớ", "Tớ muốn chữa lành", "Hỗ trợ tớ nha"],
  money_stress:       ["Cho tớ lời khuyên", "Kể thêm nha", "Làm test stress đi"],
  imposter_syndrome:  ["Kể thêm nha", "Làm sao tự tin hơn?", "Nhắc tớ thế mạnh nha"],
  pet_grief:          ["Kể kỷ niệm về pet", "Tớ buồn lắm", "Nhớ em ấy quá"],
  lgbtq_confusion:    ["Kể thêm nha", "Cách come out an toàn", "Tớ cần người lắng nghe"],
};

// ─────────────────────────────────────────────────────────────────────────────
// FUSE.JS FUZZY MATCHER (lazy-init after INTENT_DATABASE is defined)
// Handles: typos, missing diacritics, partial word order.
// Score: 0 = perfect, 1 = no match — lower is better.
// ─────────────────────────────────────────────────────────────────────────────
let _fuseInstance = null;
function getFuseInstance() {
  if (_fuseInstance) return _fuseInstance;
  const items = [];
  for (const intent of INTENT_DATABASE) {
    if (intent.id === "crisis") continue;
    for (const pattern of intent.patterns) {
      items.push({ p: removeVietnameseTones(pattern), id: intent.id });
    }
  }
  _fuseInstance = new Fuse(items, {
    keys: ["p"],
    threshold: 0.42,
    includeScore: true,
    ignoreLocation: true,
    distance: 200,
    minMatchCharLength: 3,
  });
  return _fuseInstance;
}

// Matches "khong"/"chua"/"het"/"khoi" up to 2 words before a matched keyword —
// used to skip a false-positive fast-path match on a negated sentence.
const NEGATION_BEFORE = /\b(khong|chua|het|khoi)(\s+\w+){0,2}\s*$/;

// Pre-compiled regex rules for instant fast-path matching (compiled once at startup)
const STATIC_RULES = [
  { id: "existential_crisis",  regex: /(song de lam gi|tai sao to ton tai|cuoc song vo nghia|y nghia cuoc song|ton tai vo nghia|chong chenh|vo huong|mat phuong huong|khong co muc dich song)/ },
  { id: "trauma",              regex: /(am anh qua khu|ki uc dau buon|truoc day tung bi|sang chan tam ly|trauma|nhung chuyen cu|flashback|noi dau cu|chuyen qua khu)/ },
  { id: "money_stress",        regex: /(khong co tien|lo tien hoc phi|stress vi tien|ap luc tai chinh|kiem tien vat va|het tien|tien nong|ap luc tien bac)/ },
  { id: "imposter_syndrome",   regex: /(hoi chung ke gia mao|to an may|do may man thoi|to lam gia|khong xung dang|imposter|khong gioi nhu ho nghi)/ },
  { id: "pet_grief",           regex: /(cho chet|meo chet|thu cung qua doi|mat pet|mat cho meo|thu cung mat|nho thu cung|mat em cun|mat em meo)/ },
  { id: "lgbtq_confusion",     regex: /(thich con trai|thich con gai|co phai lgbt|hoang mang gioi tinh|come out|so bi ky thi tinh duc|\blgbt\b|\bgay\b|\bles\b|\blesbian\b|comeout)/ },
  { id: "guide_bio_link",      regex: /(tao bio|chinh bio|sua bio|trang ca nhan|thong tin lien he|link bio|bio link|chinh theme|theme editor|giao dien bio|brutalism|glassmorphism|bo goc|do bong|vien nut|mau nen|background bio|chieu cao|can nang|so do|ba vong|vong nguc|vong eo|vong mong|thong so co ban|ky nang|portfolio)/ },
  { id: "guide_booking",       regex: /(dat lich|hen lich|lich hen|hen chup|book|booking|khach dat|khach hen|khach book|quan ly lich|xem lich|zalo khach|email khach)/ },
  { id: "guide_qr",            regex: /(ma qr|tao qr|qr wifi|wifi qr|qr vcard|vcard|qr danh ba|danh ba qr|quet wifi|quet qr|quet offline|in qr|tai qr|download qr|helpdesk|hugokit|nfc)/ },
  { id: "guide_signature",     regex: /(chu ky|signature|hugosmail|font chu ky|mau chu ky|tao chu ky|outlook|gmail)/ },
  { id: "guide_ide",           regex: /(code|lap trinh|viet code|ide|hugocoder|hoc lap trinh|compiler|chay code|download code|tai code|python|cpp)/ },
  { id: "guide_chess",         regex: /(co vua|chess|hugochess|dau co|choi co|phong co|giao huu|stockfish|dau co vua|choi co vua)/ },
  { id: "guide_partners",      regex: /(iframe|nhung iframe|nhung link|nhung bio|doi tac|partner|security key|khoa bao mat|ma bao mat)/ },
  { id: "panic_attack",        regex: /(kho tho|ngop tho|tim dap nhanh|hoang loan|run ray|sap ngat|panic)/ },
  { id: "crisis",              regex: /(tu tu|tu sat|ket lieu|khong muon song|muon chet|tu lam dau|muon ket thuc)/ },
  { id: "homework_help",       regex: /(giai (giup|gium|ho|dum|di)|lam (giup|gium|ho|dum) (to|minh|em)|cho (to|minh|em) dap an|xin dap an|loi giai|giai phuong trinh|giai bai (toan|tap|nay))/ },
  { id: "university_exam",     regex: /(thi dai hoc|thi thpt|thptqg|thi quoc gia|diem chuan dai hoc|on thi dai hoc)/ },
  { id: "burnout",             regex: /(kiet suc|burn.?out|het suc roi|can kiet nang luong|gong qua lau|xiu roi)/ },
  { id: "social_comparison",   regex: /(so sanh voi nguoi|nguoi ta gioi hon|thua kem moi nguoi|fomo|instagram lam|khong bang ai)/ },
  { id: "perfectionism",       regex: /(cau toan|muon hoan hao|so lam sai|khong dam bat dau|tu chinh minh qua|phai lam cho hoan hao)/ },
  { id: "body_image",          regex: /(tu ti ngoai hinh|beo qua|xau qua|ghet co the|khong hai long voi ngoai hinh|tu ti can nang)/ },
  { id: "phone_addiction",     regex: /(nghien dien thoai|nghien tiktok|nghien mxh|luot mang xa hoi nhieu|nghien game|screen time)/ },
  { id: "study_planning",      regex: /(lap ke hoach hoc|len ke hoach hoc|sap xep lich hoc|cach hoc hieu qua|hoc the nao hieu qua|chia thoi gian hoc|on bai nhu the nao|thoi khoa bieu hoc)/ },
  { id: "social_anxiety",      regex: /(so noi truoc dam dong|so bi phan xet|ngai tiep xuc nguoi la|social anxiety|so ra ngoai|khong dam phat bieu)/ },
  { id: "homesickness",        regex: /(nho nha|xa nha|nho bo me|di hoc xa|nho que huong|xa gia dinh)/ },
  { id: "first_love",          regex: /(thich ai do|co crush|dang yeu ai|tinh cam dau tien|thich ban trong lop|to tinh)/ },
  { id: "jealousy",            regex: /(ghen voi ban|ghen tuong|ghen ti|ganh ti voi|ghet nguoi thanh cong hon)/ },
  { id: "concentration",       regex: /(khong tap trung duoc|mat focus|lo dang|adhd|kho tap trung|doc sach khong vao|tap trung (hoc|lam bai|duoc)|de tap trung)/ },
  { id: "emptiness",           regex: /(trong rong|khong cam thay gi|vo cam|khong buon khong vui|trong khong|te liet cam xuc)/ },
  { id: "overthinking",        regex: /(nghi nhieu qua|overthink|dau oc khong tat|lo van vo|suy nghi lap lai|khong ngung lo nghi)/ },
  { id: "exercise_request",    regex: /(bai tap tho|huong dan tho|day toi thien|bai thien|bai tap thu gian|muon tho sau|tap tho cung toi)/ },
  { id: "checkin_feature",     regex: /(check.?in la gi|diem danh cam xuc|streak la gi|tai sao phai check)/ },
  { id: "venting_space",       regex: /(khong gian trut gian|trut bau tam su|tin nhan tu huy|che do trut gian)/ },
  { id: "loneliness",          regex: /(co don|lac long|khong ai hieu|khong ai ben canh|bi bo roi|khong co ban)/ },
  { id: "family_conflict",     regex: /(cai nhau voi bo me|gia dinh khong hieu|bo me ap dat|mau thuan voi gia dinh|bo me la mang|ky vong qua nhieu|(bo|me|ba|bo me|ba me) (la|mang|danh|chui) (to|minh|em|con))/ },
  { id: "friendship_conflict", regex: /(ban be xa lanh|bi bat nat|bi co lap|noi xau to|tay chay|bi bully|drama ban be|co lap)/ },
  { id: "breakup",             regex: /(chia tay|that tinh|nguoi yeu bo|tinh cam tan vo|chia tay dau)/ },
  { id: "low_self_esteem",     regex: /(vo dung|tu ti|kem coi|khong tin vao ban than|ghet ban than|cam thay that bai|khong du gioi)/ },
  { id: "procrastination",     regex: /(tri hoan|luoi hoc|mat dong luc|khong co dong luc|chan deadline|om viec khong lam)/ },
  { id: "anger",               regex: /(tuc gian|buc boi|nong gian|am uc|kho chiu trong nguoi|gian dien len|muon dap pha)/ },
  { id: "grief",               regex: /(mat nguoi than|qua doi|de tang|dau buon vi mat mat|nguoi than qua doi)/ },
  { id: "future_anxiety",      regex: /(hoang mang ve tuong lai|chon nganh|dinh huong nghe nghiep|khong biet minh muon gi|so chon sai nganh|tuong lai mo mit)/ },
  { id: "room_organization",   regex: /(bo tri phong|sap xep phong|trang tri goc hoc tap|phong bua|don phong|sap xep phong ngu)/ },
  { id: "mindful_spending",    regex: /(mua do toi thich|nen mua cay|tu thuong cho minh|mua sam de giai toa|mua sam linh tinh|tieu xai qua da)/ },
  { id: "test_inventory",      regex: /(bao nhieu bai test|nhung bai test|danh sach bai test|may bai trac nghiem|cac bai kiem tra tam ly|test tam ly gom|co test gi)/ },
  { id: "clinical_tests",      regex: /(lam bai test|lam trac nghiem|phq9|gad7|who5|bigfive|mmpi|kiem tra tram cam|kiem tra lo au)/ },
  { id: "therapy_catalog",     regex: /(co lieu phap gi|tri lieu gom|cac lieu phap tu chua lanh|nen dung lieu phap nao|phuong phap tri lieu)/ },
  { id: "pricing_package",     regex: /(gia bao nhieu|goi cuoc|mua goi|nap tien|ton phi|mat phi|goi premium|phi dich vu)/ },
  { id: "joy_currency",        regex: /(joy la gi|kiem joy|dong joy|tien joy|xu joy|joy coin|dung joy)/ },
  { id: "token_limit",         regex: /(gioi han token|het token|may token|reset token|luot chat|token la gi)/ },
  { id: "about_creator",       regex: /(ai tao ra|hugo studio|ai phat trien|ai lam ra app|creator)/ },
  { id: "data_privacy",        regex: /(du lieu cua toi|bao mat|lo tin nhan|an toan du lieu|co ai doc duoc|rieng tu)/ },
  { id: "support_contact",     regex: /(bao loi|lien he ho tro|loi ky thuat|gap loi|nhan vien ho tro|support)/ },
  { id: "identity",            regex: /(cau la ai|ban la ai|ten cau|la bot|gioi thieu ban than)/ },
  { id: "features",            regex: /(lam duoc gi|tinh nang|chuc nang|giup gi|huong dan|features)/ },
  { id: "sleep",               regex: /(mat ngu|kho ngu|ngu ngon|thuc khuya|thieu ngu|tinh giac giua dem)/ },
  { id: "academic_stress",     regex: /(ap luc hoc|thi cu|diem so|thi rot|stress hoc|bai tap qua tai|deadline chong chat|deadline|mai thi|sap thi|chua hoc gi|muon bo hoc)/ },
  { id: "anxiety",             regex: /(lo au|lo lang|bon chon|so hai|hoang so|lo so|tim dap hoi hop)/ },
  { id: "sadness",             regex: /(buon|chan nan|tuyet vong|met moi|khoc|cam thay te|khong vui)/ },
  { id: "gratitude",           regex: /(cam on|thank|de thuong|huu ich|tot qua|cau tot)/ },
  { id: "positive",            regex: /(duoc \d+([.,]\d+)? diem|diem cao|dat giai|qua mon|do (dai hoc|nguyen vong)|vui|khoe|hanh phuc|tuyet voi|rat tot|on lam|dang ok)/ },
];

// O(1) direct lookup map for intents compiled once at startup
const INTENT_MAP = {};

// Pre-computed, flattened, and untoned patterns to speed up Sørensen-Dice loop operations
const PRECOMPUTED_UNTONED_PATTERNS = [];

// Initialize lookup Map and pre-computed patterns array
for (const intent of INTENT_DATABASE) {
  INTENT_MAP[intent.id] = intent;
  if (intent.id === "crisis") continue;
  for (const pattern of intent.patterns) {
    PRECOMPUTED_UNTONED_PATTERNS.push({
      original: pattern,
      untoned: removeVietnameseTones(pattern).toLowerCase(),
      intent: intent
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLASSIFIER
// Order: crisis → therapy navigation → metrics → regex fast-path → Fuse fuzzy → Dice fallback
// ─────────────────────────────────────────────────────────────────────────────
export function findMatchingIntent(userText, bio, historyLogs = []) {
  if (!userText) return null;
  const text = userText.trim();
  if (text.length === 0) return null;

  const cleanText = removeVietnameseTones(text).toLowerCase();
  
  // Load and update secure local memory (with ZK-obfuscation)
  const memory = loadSecureMemory(bio);
  const updatedMemory = updateMemoryFromText(text, memory);
  saveSecureMemory(bio, updatedMemory);

  // 1. Crisis — must run first, before any similarity check.
  if (isCrisisText(cleanText)) {
    const crisisIntent = INTENT_MAP["crisis"];
    if (crisisIntent) {
      return {
        reply: crisisIntent.generateResponse(bio, historyLogs),
        id: "crisis",
        tier: "free",
        quickActions: crisisIntent.quickActions || null,
        companionUpdate: {
          newLog: { date: new Date().toISOString(), type: "checkin", mood: 1, note: "Crisis matched locally" }
        }
      };
    }
  }

  // 2. Therapy navigation — opens method directly or offers JOY unlock button.
  const therapyMethod = matchTherapyMethod(cleanText);
  if (therapyMethod) {
    const unlocked = !therapyMethod.joyLockable || (bio?.unlockedCompanionFeatures || []).includes(therapyMethod.lockKey);
    if (unlocked) {
      return {
        reply: [`Mở ngay "${therapyMethod.name}" cho cậu nè.`],
        id: "therapy_open",
        tier: "free",
        quickActions: null,
        action: { type: "open_therapy", methodId: therapyMethod.id }
      };
    }
    return {
      reply: [
        `"${therapyMethod.name}" đang cần mở khoá bằng JOY (${therapyMethod.cost} JOY) cậu ơi.`,
        "Cậu muốn mở khoá luôn không? Tớ có nút mua nhanh ngay dưới nha."
      ],
      id: "therapy_locked",
      tier: "free",
      quickActions: [{ type: "unlock", methodId: therapyMethod.id, lockKey: therapyMethod.lockKey, cost: therapyMethod.cost, label: `Mở khoá (${therapyMethod.cost} JOY)` }]
    };
  }

  // 3. Metrics report — answered straight from historyLogs, no LLM needed.
  if (/(danh gia hien tai|chi so hien tai|chi so tam ly|ket qua test gan nhat|tinh trang hien tai cua toi|tinh trang tam ly cua toi)/.test(cleanText)) {
    return { reply: buildMetricsSummary(historyLogs), id: "metrics_report", tier: "free", quickActions: null };
  }

  // 4. Fast-path Regex Matching (with negation filter)
  for (const rule of STATIC_RULES) {
    if (rule.regex.test(cleanText)) {
      const m = cleanText.match(rule.regex);
      if (m) {
        const prefix = cleanText.substring(0, m.index);
        if (NEGATION_BEFORE.test(prefix)) {
          continue; // Negated match, skip this fast-path rule
        }
      }
      const intent = INTENT_MAP[rule.id];
      if (intent) return toResult(intent, bio, historyLogs, memory, text);
    }
  }

  // 5. Similarity score search fallback across pattern database
  let bestIntent = null;
  let maxScore = 0;
  for (const item of PRECOMPUTED_UNTONED_PATTERNS) {
    const score = getSimilarityScore(cleanText, item.untoned);
    if (score > maxScore) {
      maxScore = score;
      bestIntent = item.intent;
    }
  }

  if (maxScore >= 0.72 && bestIntent) return toResult(bestIntent, bio, historyLogs, memory, text);

  return null;
}

function toResult(intent, bio, historyLogs, memory, text) {
  return {
    reply: intent.generateResponse(bio, historyLogs, memory, text),
    id: intent.id,
    tier: intent.tier || "free",
    suggestPhq9: intent.suggestPhq9 || false,
    suggestGad7: intent.suggestGad7 || false,
    suggestWho5: intent.suggestWho5 || false,
    suggestBigFive: intent.suggestBigFive || false,
    suggestDass42: intent.suggestDass42 || false,
    suggestMmpi30: intent.suggestMmpi30 || false,
    showInlineBreathing: intent.showInlineBreathing || false,
    showInlineCbt: intent.showInlineCbt || false,
    quickActions: intent.quickActions || null,
  };
}

/**
 * Câu soạn sẵn cho một intent do MÁY CHỦ chọn (định tuyến bằng embedding, xem
 * server/services/intentRouter.js). Tên lạ hoặc "crisis" → null: khủng hoảng chỉ
 * được bắt bằng luật cục bộ ở trên, không để máy chủ quyết thay.
 */
export function intentReplyById(id, userText, bio, historyLogs = []) {
  const intent = id !== "crisis" && Object.hasOwn(INTENT_MAP, id) ? INTENT_MAP[id] : null;
  if (!intent) return null;
  return toResult(intent, bio, historyLogs, loadSecureMemory(bio), String(userText || "").trim());
}
