/**
 * Local Intent Classifier for "HugoPSY"
 * – Regex fast-path for common patterns (O(n) rules, ~1ms)
 * – Fuse.js fuzzy match as primary similarity engine (handles typos, missing diacritics)
 * – Sørensen-Dice coefficient as final fallback
 * Threshold lowered to 0.72 (from 0.80) for better recall with short/noisy input.
 */
import Fuse from "fuse.js";
import { matchTherapyMethod } from "./therapyMethods";
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
  return firstPersonDeath.test(cleanText) || conditionalDeath.test(cleanText);
}

const SEVERITY_LABELS = { normal: "Ổn định", mild: "Nhẹ", moderate: "Trung bình", severe: "Cao", extremely_severe: "Rất cao" };
function phq9Severity(score) { if (score == null) return null; if (score <= 4) return "normal"; if (score <= 9) return "mild"; if (score <= 14) return "moderate"; if (score <= 19) return "severe"; return "extremely_severe"; }
function gad7Severity(score) { if (score == null) return null; if (score <= 4) return "normal"; if (score <= 9) return "mild"; if (score <= 14) return "moderate"; return "severe"; }
function who5Severity(score) { if (score == null) return null; return score >= 13 ? "normal" : score >= 9 ? "mild" : score >= 5 ? "moderate" : "severe"; }
function formatVnDate(d) { try { return new Date(d).toLocaleDateString("vi-VN"); } catch (_) { return ""; } }

export function buildMetricsSummary(historyLogs = []) {
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

export function getDiceSimilarity(str1, str2) {
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

export function getSimilarityScore(s1, s2) {
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
// INTENT DATABASE
// ─────────────────────────────────────────────────────────────────────────────
export const INTENT_DATABASE = [
  {
    id: "greeting",
    tier: "free",
    patterns: [
      "chào cậu", "chào bạn", "hello", "hi", "xin chào", "chào bot",
      "chào bạn học đường", "chào hugopsy", "chào chuyên viên", "chào nha",
      "helo cậu", "helo", "lo cau", "hey", "ơi", "hay day"
    ],
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
    patterns: [
      "tạm biệt", "bye", "bye bye", "hẹn gặp lại", "tớ đi ngủ đây",
      "tớ đi học đây", "tạm biệt cậu nhé", "tớ offline đây", "tạm biệt nha", "chào nhé"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Bye ${name}!`, `Nhớ sạc pin cho bản thân nha, đừng gồng quá`, `Cần gì tớ luôn ở đây!`];
    }
  },
  {
    id: "identity",
    tier: "paid",
    patterns: [
      "cậu là ai", "bạn là ai", "tên cậu là gì", "bạn học đường là ai",
      "hugopsy là ai", "đây là bot gì", "giới thiệu bản thân", "cậu tên gì",
      "bạn tên gì", "cậu là bot hay người"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ là HugoPSY nè`, `Bạn đồng hành tâm lý AI — ở đây để nghe ${name} xả hết mọi chuyện.`, `Học hành, cảm xúc, drama, lo lắng gì cũng kể tớ nghe nha!`];
    }
  },
  {
    id: "features",
    tier: "paid",
    patterns: [
      "cậu có thể làm gì", "tính năng của ứng dụng", "hướng dẫn sử dụng",
      "giúp tớ thế nào", "tính năng trị liệu là gì", "ứng dụng này giúp gì cho tớ",
      "bot này làm được gì", "chức năng của cậu là gì", "tính năng của app"
    ],
    generateResponse: () => {
      return [`Tớ có cả combo xịn luôn nè:`, `Thở 4-7-8 hết stress tức thì, thư giãn cơ, âm thanh thiên nhiên dễ ngủ, bài test tâm lý chuẩn lâm sàng`, `Vào tab 'Trị Liệu' hay 'Đánh Giá' là thấy ngay á!`];
    }
  },
  {
    id: "academic_stress",
    tier: "paid",
    patterns: [
      "áp lực học tập", "học hành mệt mỏi", "sợ thi rớt", "học không vào",
      "áp lực điểm số", "căng thẳng vì học hành", "áp lực thi cử",
      "stress học tập", "mệt mỏi vì thi cử", "bài tập quá nhiều", "deadline chồng chất"
    ],
    generateResponse: (bio, historyLogs, memory) => {
      const name = getFriendlyName(bio);
      const suffix = memory?.examDate ? ` (nhất là hạn chót ${memory.examDate} sắp tới)` : "";
      return [
        `Tớ hiểu mà, áp lực học hành và thi cử dạo này${suffix} đang khiến đầu óc của ${name} muốn nổ tung đúng không?`,
        `Đừng quên là điểm số hay kỳ thi chỉ là một phần rất nhỏ, nó không định nghĩa giá trị con người cậu đâu nha — thiệt đó.`,
        `Hãy dừng lại uống một ngụm nước ấm, hít thở một hơi thật sâu. Hôm nay phần bài vở hay áp lực nào đang làm cậu thấy bế tắc nhất vậy?`
      ];
    }
  },
  {
    id: "sleep",
    tier: "paid",
    patterns: [
      "tớ bị mất ngủ", "khó ngủ quá", "làm sao để ngủ ngon", "không ngủ được",
      "thức khuya quá", "mẹo ngủ ngon", "làm sao ngủ ngon", "mất ngủ kéo dài",
      "cứ tỉnh giấc giữa đêm", "ngủ không sâu"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Mất ngủ thường là tín hiệu cho thấy tâm trí của ${name} đang phải "chạy ngầm" rất nhiều lo âu chưa được giải tỏa đó.`,
        `Tối nay cậu thử tắt điện thoại trước khi ngủ 30 phút, giữ phòng tối mát và bật âm thanh "Mưa rơi" ở mục Trị Liệu xem sao nha.`,
        `Đừng bắt bản thân phải ngủ ngay lập tức kẻo lại áp lực thêm. Gần đây cậu ngủ được trung bình mấy tiếng mỗi đêm thế?`
      ];
    }
  },
  {
    id: "anxiety",
    tier: "paid",
    patterns: [
      "tớ thấy lo lắng", "bị lo âu quá", "hoảng sợ", "lo sợ mọi thứ",
      "cảm thấy bồn chồn", "lo âu nặng", "làm sao hết lo âu", "tớ lo sợ quá",
      "tớ cứ lo vô lý", "tim đập hồi hộp"
    ],
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
    patterns: [
      "tớ buồn quá", "chán nản mọi thứ", "thấy mệt mỏi buồn bã", "muốn khóc",
      "tâm trạng tồi tệ", "tâm trạng đi xuống", "tớ thấy buồn", "buồn chán quá",
      "tớ cảm thấy tệ", "tớ không vui chút nào"
    ],
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
    patterns: [
      "tớ muốn tự tử", "muốn chết", "không muốn sống nữa", "tự tử ở đâu",
      "làm hại bản thân", "muốn kết liễu đời mình", "muốn tự sát",
      "nếu tôi chết rồi thì sao", "tôi sẽ chết", "không ai cần tôi nữa",
      "biến mất khỏi thế giới này", "sống không có ý nghĩa", "muốn kết thúc tất cả"
    ],
    // Kept as a single atomic message — urgent safety info (hotline, emergency number)
    // must never be split/delayed. Two-beat: (1) emotional validation first, (2) actionable
    // safety info with tappable quickActions rendered as tel: buttons by ChatTab.
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `${name} ơi, tớ đang nghe thấy một nỗi đau rất lớn trong những gì cậu vừa nói, và tớ không xem nhẹ nó một chút nào. Cậu không hề yếu đuối hay sai trái khi cảm thấy như vậy — chỉ là cậu đang phải mang một gánh nặng quá sức một mình ngay lúc này. Tớ thật lòng mong cậu được an toàn, và tớ sẽ ở đây cùng cậu qua khoảnh khắc này. Ngay bây giờ, xin cậu hãy chạm vào một trong các nút gọi khẩn cấp dưới đây hoặc tìm một người cậu tin tưởng để họ ở bên cậu lúc này — cậu xứng đáng được giúp đỡ và không phải một mình chịu đựng điều này.`;
    },
    quickActions: [
      { label: "Gọi Cấp Cứu 115", tel: "115" },
      { label: "Đường Dây Nóng Tâm Lý 1800 599 920", tel: "1800599920" }
    ]
  },
  {
    id: "clinical_tests",
    tier: "paid",
    patterns: [
      "test trầm cảm", "test lo âu", "kiểm tra sức khỏe tinh thần",
      "bài test phq9", "bài test gad7", "trắc nghiệm tâm lý",
      "kiểm tra trầm cảm", "làm bài test", "bài trắc nghiệm tâm lý"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Test chuẩn lâm sàng (PHQ-9, GAD-7) giúp ${name} biết rõ tình trạng thật, không cần lo mơ hồ nữa`, `Qua tab 'Đánh Giá' làm nha — tớ lưu kết quả và theo dõi tiến triển cho cậu luôn.`];
    },
    suggestPhq9: true,
    suggestGad7: true
  },
  {
    id: "gratitude",
    tier: "free",
    patterns: [
      "cảm ơn cậu", "thank you", "cảm ơn bạn học đường", "bot dễ thương quá",
      "cảm ơn chuyên viên", "cậu tốt quá", "bot hữu ích quá", "cảm ơn bot",
      "thanks", "cảm ơn nha"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Có gì đâu ${name} ơi`, `Được cậu tin tưởng chia sẻ là tớ vui muốn xỉu rồi á.`, `Chúc cậu một ngày nhẹ nhàng nha`];
    }
  },
  {
    id: "positive",
    tier: "free",
    patterns: [
      "tớ thấy vui", "hôm nay rất vui", "mọi thứ tốt", "tớ thấy ổn",
      "tớ rất khỏe", "tâm trạng tốt", "ngày hôm nay tuyệt vời",
      "tớ thấy hạnh phúc", "moi thu on", "tớ đang ok lắm"
    ],
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
    patterns: [
      "bạn có bao nhiêu bài test", "có những bài test gì", "danh sách bài test",
      "ứng dụng có mấy bài trắc nghiệm", "các bài kiểm tra tâm lý",
      "test tâm lý gồm những gì", "có bao nhiêu bài trắc nghiệm", "có test gì"
    ],
    generateResponse: () => {
      return [`Hệ thống có 4 bài chuẩn lâm sàng: PHQ-9 (trầm cảm), GAD-7 (lo âu), WHO-5 (hạnh phúc), Big Five (nhân cách).`, `Kể tớ tình trạng hiện tại, tớ gợi ý bài hợp nhất — hoặc vào tab 'Đánh Giá' chọn luôn cũng được!`];
    }
  },
  {
    id: "therapy_catalog",
    tier: "paid",
    patterns: [
      "có liệu pháp gì", "trị liệu gồm những gì", "các liệu pháp tự chữa lành",
      "hướng dẫn dùng liệu pháp", "tớ nên dùng liệu pháp nào",
      "bài tập tự chữa lành", "phương pháp trị liệu", "các bài trị liệu"
    ],
    generateResponse: () => {
      return [`Có 4 liệu pháp chính nè: Thở 4-7-8 (lo âu/mất ngủ), Ngồi Tĩnh Tâm (căng thẳng), Đọc sách Trị liệu (chiêm nghiệm) và Viết Tự Do (xả áp lực).`, `Còn vài món AI cao cấp mở bằng JOY nữa. Ghé tab 'Trị Liệu' khám phá nha!`];
    }
  },
  {
    id: "pricing_package",
    tier: "paid",
    patterns: [
      "gói cước giá bao nhiêu", "làm sao mua gói", "cách hủy gói",
      "cách đổi gói", "gói nào phù hợp với tớ", "phí dịch vụ là bao nhiêu",
      "có mất phí không", "gói premium", "đăng ký gói"
    ],
    generateResponse: () => {
      return [`Giá và các gói đồng hành xem ở tab 'Quản lý' trong Cổng thành viên nha — đủ info luôn.`, `Kể tớ nghe nhu cầu của cậu, tớ gợi ý gói hợp nhất cho!`];
    }
  },
  {
    id: "joy_currency",
    tier: "paid",
    patterns: [
      "joy là gì", "làm sao có joy", "joy dùng để làm gì",
      "kiếm joy thế nào", "joy là tiền gì", "đồng joy", "xu joy", "joy coin"
    ],
    generateResponse: () => {
      return [`JOY là tiền nội bộ hệ thống — kiếm bằng cách giới thiệu bạn bè hoặc đổi quà tặng`, `Dùng JOY mở liệu pháp AI cao cấp hoặc mua đồ ở Cửa hàng. Xem số dư ở tab 'JOY' nha!`];
    }
  },
  {
    id: "token_limit",
    tier: "paid",
    patterns: [
      "mỗi ngày chat được mấy lần", "hết token thì sao", "token chat là gì",
      "tại sao bị trừ token", "khi nào token được làm mới", "giới hạn token", "lượt chat"
    ],
    generateResponse: () => {
      return [`Mỗi ngày cậu có 10 token chat. Chào hỏi, cảm ơn, tâm sự thường thì miễn phí hết.`, `Câu hỏi tớ trả lời ngay = 1 token, cần suy nghĩ sâu = 3 token.`, `Reset mỗi ngày mới — hoặc mua thêm bằng JOY nếu cần gấp!`];
    }
  },
  {
    id: "about_creator",
    tier: "paid",
    patterns: [
      "ai tạo ra app này", "hugo studio là gì", "đội ngũ phát triển là ai",
      "app này của ai", "ai làm ra hugopsy", "tác giả", "creator"
    ],
    generateResponse: () => {
      return [`Tớ được Hugo Studio xây và huấn luyện nè.`, `Mục tiêu là làm bạn đồng hành tâm lý học đường cho học sinh sinh viên Việt Nam — cải tiến liên tục để nghe cậu tốt hơn mỗi ngày!`];
    }
  },
  {
    id: "data_privacy",
    tier: "paid",
    patterns: [
      "dữ liệu của tớ có an toàn không", "ai xem được tin nhắn của tớ",
      "thông tin có bị lộ không", "có ai đọc được tâm sự của tớ không",
      "bảo mật", "riêng tư", "dữ liệu cá nhân"
    ],
    generateResponse: () => {
      return [`Mọi tâm sự + dữ liệu hồ sơ của cậu được bảo mật hoàn toàn, chỉ dùng để tớ cá nhân hoá hỗ trợ thôi.`, `Không chia cho bên thứ ba đâu — cứ yên tâm tâm sự thật lòng nha!`];
    }
  },
  {
    id: "support_contact",
    tier: "paid",
    patterns: [
      "liên hệ hỗ trợ thế nào", "báo lỗi ở đâu", "gặp vấn đề kỹ thuật thì sao",
      "tớ muốn gặp nhân viên hỗ trợ", "lỗi kỹ thuật", "hỗ trợ", "support"
    ],
    generateResponse: () => {
      return [`Lỗi kỹ thuật hay cần người thật hỗ trợ thì bấm vào khung chat hỗ trợ ở trang chủ nha, team Hugo Studio phản hồi sớm lắm.`, `Còn chuyện tâm lý thì cứ kể tớ trước đã!`];
    }
  },
  {
    id: "loneliness",
    tier: "paid",
    patterns: [
      "tớ thấy cô đơn", "không ai hiểu tớ", "tớ cảm thấy lạc lõng",
      "tớ chẳng có ai để nói chuyện", "tớ cô đơn quá", "không ai bên cạnh tớ",
      "tớ thấy mình bị bỏ rơi", "không có bạn", "mình đơn độc lắm"
    ],
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
    patterns: [
      "cãi nhau với bố mẹ", "gia đình không hiểu tớ", "bố mẹ áp đặt tớ quá",
      "mâu thuẫn với gia đình", "bố mẹ la mắng tớ", "tớ với gia đình không hợp",
      "gia đình tớ căng thẳng", "bố mẹ kỳ vọng quá nhiều"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Mâu thuẫn gia đình nhiều khi chỉ là 2 bên "nói chuyện khác kênh" — không hẳn không thương nhau.`, `Cảm giác bị áp đặt của ${name} hoàn toàn hợp lý mà.`, `Kể tớ nghe chuyện vừa xảy ra đi, gỡ rối cùng nhau nha.`];
    }
  },
  {
    id: "friendship_conflict",
    tier: "paid",
    patterns: [
      "bạn bè xa lánh tớ", "tớ bị bắt nạt", "mâu thuẫn với bạn bè",
      "tớ bị cô lập trong lớp", "bạn thân nói xấu tớ", "tớ bị bạn bè tẩy chay",
      "tớ bị bully", "bạn bè xấu với tớ", "drama bạn bè"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Bị tẩy chay hay bully đau thiệt đó ${name} ơi 💙`, `Đây không phải lỗi của cậu — nhớ vậy nha.`, `Cậu đang an toàn không? Có nói với thầy cô hoặc người lớn tin tưởng chưa?`];
    }
  },
  {
    id: "breakup",
    tier: "paid",
    patterns: [
      "tớ vừa chia tay", "thất tình", "người yêu chia tay tớ",
      "tớ buồn vì chia tay", "tình cảm tan vỡ", "tớ bị người yêu bỏ",
      "chia tay đau lắm", "hết yêu rồi"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Chia tay giống như mất một phần kỳ vọng đã xây cùng nhau — buồn là chuyện đương nhiên ${name} ơi 🫂`, `Đừng ép bản thân "ổn ngay" đâu nha.`, `Điều gì đang làm cậu day dứt nhất về chuyện này?`];
    }
  },
  {
    id: "low_self_esteem",
    tier: "paid",
    patterns: [
      "tớ thấy mình vô dụng", "tớ tự ti quá", "tớ thấy mình kém cỏi",
      "tớ không tin vào bản thân", "tớ ghét bản thân mình", "tớ cảm thấy mình thất bại",
      "tớ không đủ giỏi", "tớ không làm được gì"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Lúc buồn não hay "thổi phồng" lỗi sai và hạ giá trị bản thân — đó không phải sự thật về ${name} đâu.`, `Giá trị một người không nằm ở vài lần vấp ngã hay so sánh với ai.`, `Kể tớ nghe 1 điều — dù nhỏ xíu — cậu đã làm tốt gần đây đi?`];
    }
  },
  {
    id: "procrastination",
    tier: "paid",
    patterns: [
      "tớ hay trì hoãn", "tớ lười học quá", "tớ không có động lực làm bài",
      "tớ cứ trì hoãn deadline", "tớ không muốn làm gì cả",
      "tớ mất động lực học tập", "chán làm bài quá", "cứ ôm việc không làm"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Trì hoãn thường không phải lười — mà là não đang "trốn" cảm giác sợ thất bại hoặc việc quá to đó ${name}.`, `Mẹo: chia ra bước đầu tiên cực ngắn (2 phút thôi) để lừa cảm giác quá tải.`, `Việc gì cậu đang ôm mà chưa chịu bắt đầu?`];
    }
  },
  {
    id: "anger",
    tier: "paid",
    patterns: [
      "tớ tức giận quá", "tớ đang rất bực bội", "tớ nóng giận",
      "tớ giận điên lên được", "tớ thấy ấm ức", "tớ khó chịu trong người",
      "tớ muốn đập phá", "tớ bức xúc lắm"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Giận thường là lớp vỏ ngoài che một cảm giác sâu hơn — bị tổn thương hay bất công — hoàn toàn bình thường ${name} ơi.`, `Trước khi phản ứng, hít sâu vài nhịp cho hệ thần kinh dịu lại đã nha.`, `Chuyện gì vừa xảy ra vậy?`];
    }
  },
  {
    id: "panic_attack",
    tier: "free",
    patterns: [
      "tớ bị khó thở", "tim tớ đập nhanh quá", "tớ đang hoảng loạn",
      "tớ thấy ngộp thở", "tớ run rẩy không kiểm soát được", "tớ sắp ngất rồi",
      "tớ bị panic attack", "tớ đang lên cơn"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`${name} ơi, nghe giống panic attack — đáng sợ thật nhưng KHÔNG nguy hiểm tính mạng, sẽ qua đi 💙`, `Làm cùng tớ ngay: nhìn quanh gọi tên 5 vật thấy, 3 âm thanh nghe được.`, `Rồi hít mũi 4s — nín 4s — thở miệng 6s, lặp vài lần. Cậu đang ở chỗ an toàn không?`];
    }
  },
  {
    id: "grief",
    tier: "paid",
    patterns: [
      "tớ vừa mất người thân", "tớ đau buồn vì mất mát", "người tớ yêu thương đã qua đời",
      "tớ không vượt qua được nỗi đau mất người thân", "tớ đang để tang",
      "mất đi người quan trọng", "người thân qua đời"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ rất tiếc vì mất mát lớn này ${name} 🫂`, `Đau buồn không có "đúng tiến độ" — cậu được phép buồn bao lâu cậu cần.`, `Tớ ở đây nếu cậu muốn kể về người đó, hay chỉ cần ai ngồi cạnh im lặng cũng được.`];
    }
  },
  {
    id: "future_anxiety",
    tier: "paid",
    patterns: [
      "tớ hoang mang về tương lai", "tớ không biết chọn ngành gì",
      "tớ lo lắng về định hướng nghề nghiệp", "tớ không biết mình muốn gì",
      "tớ sợ chọn sai ngành", "tương lai mờ mịt quá", "không biết làm gì sau này"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Hoang mang về tương lai ở tuổi cậu là cực kỳ bình thường — không ai bắt buộc phải biết hết ngay đâu ${name}.`, `Thay vì tìm câu trả lời "đúng tuyệt đối", cứ khám phá dần thôi.`, `Gần đây điều gì làm cậu thấy hứng thú hoặc tò mò nhất?`];
    }
  },
  {
    id: "checkin_feature",
    tier: "paid",
    patterns: [
      "check-in là gì", "điểm danh cảm xúc là gì", "streak là gì",
      "tại sao phải check-in", "check in cảm xúc để làm gì"
    ],
    generateResponse: () => {
      return [`Check-in là ghi nhận tâm trạng mỗi ngày — chỉ vài giây thôi!`, `Giúp tớ thấy xu hướng cảm xúc của cậu theo thời gian (chuỗi ngày liên tục = "streak"), từ đó gợi ý đúng cái cậu cần. Check-in ngay đầu khung chat nha!`];
    }
  },
  {
    id: "venting_space",
    tier: "paid",
    patterns: [
      "không gian trút giận là gì", "trút bầu tâm sự là gì",
      "chế độ trút giận hoạt động sao", "tin nhắn tự hủy là gì"
    ],
    generateResponse: () => {
      return [`"Trút Bầu Tâm Sự An Toàn" là chế độ tin nhắn tự xoá sau thời gian cậu chọn — KHÔNG lưu lại đâu hết 🔒`, `Trút sạch những điều khó nói mà không lo bị đọc lại. Bật ngay trong khung chat nha!`];
    }
  },
  {
    id: "room_organization",
    tier: "paid",
    patterns: [
      "làm sao bố trí phòng", "sắp xếp phòng cho gọn", "trang trí góc học tập",
      "phòng tớ bừa quá", "dọn phòng thế nào", "sắp xếp lại phòng ngủ"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Phòng bừa thường làm đầu óc rối theo đó, ${name}!`, `Mẹo: tách 3 khu riêng — học/ngủ/thư giãn — và dọn sạch mặt bàn học trước.`, `Ánh sáng tự nhiên + 1 góc cây xanh nhỏ cũng giúp tinh thần nhẹ hẳn. Cậu đang khó ở khu nào nhất?`];
    }
  },
  {
    id: "mindful_spending",
    tier: "paid",
    patterns: [
      "tớ muốn mua đồ tớ thích", "có nên mua cây không", "tớ muốn tự thưởng cho mình",
      "mua sắm để giải tỏa", "tớ hay mua sắm linh tinh", "tớ tiêu xài quá đà"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tự thưởng bản thân — mua cây, món đồ nhỏ — là cách chăm sóc tinh thần hoàn toàn lành mạnh đó ${name}!`, `Chỉ cần để ý: nếu mua sắm là cách DUY NHẤT để né cảm xúc khó, hoặc làm cậu lo về tài chính sau đó, thì chững lại xíu.`, `Món cậu đang muốn mua là gì, kể tớ nghe thử?`];
    }
  },

  // ─── NEW INTENTS ────────────────────────────────────────────────────────────

  {
    id: "burnout",
    tier: "paid",
    patterns: [
      "tớ kiệt sức rồi", "tớ không còn sức để làm gì", "mệt mỏi kiệt lực",
      "burn out rồi", "kiệt sức hoàn toàn", "không còn động lực gì nữa",
      "hết sức rồi", "tớ gồng quá lâu", "cạn kiệt năng lượng", "xỉu rồi"
    ],
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
    patterns: [
      "tớ hay so sánh với người khác", "tại sao người ta giỏi thế",
      "tớ thua kém mọi người", "nhìn người khác thành công mà tủi",
      "fomo quá", "tớ thấy mình không bằng ai", "người khác hơn tớ",
      "instagram làm tớ tủi thân"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Mạng xã hội chỉ "chiếu" highlight của người khác — mình lại so với cả cuộc đời họ, game đó không công bằng chút nào 😅`, `Hành trình của ${name} có nhịp riêng của nó, không cần sync với ai.`, `Gần đây cậu so sánh mình với ai — bạn học hay idol trên mạng?`];
    }
  },
  {
    id: "perfectionism",
    tier: "paid",
    patterns: [
      "tớ cầu toàn quá", "sợ làm sai", "tớ cứ muốn hoàn hảo",
      "không dám bắt đầu vì sợ làm không tốt", "tớ hay chỉ trích bản thân",
      "tớ sợ thất bại nên không dám thử", "phải làm cho hoàn hảo",
      "không chịu được làm sai"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Cầu toàn thực ra là "trì hoãn được nguỵ trang" khéo lắm ${name}!`, `"Đủ tốt và hoàn thành" thường có giá trị hơn "hoàn hảo nhưng chưa bắt đầu" đó nha.`, `Điều gì đang khiến cậu chưa dám bắt tay vô?`];
    }
  },
  {
    id: "body_image",
    tier: "paid",
    patterns: [
      "tớ tự ti về ngoại hình", "tớ béo quá", "tớ xấu quá",
      "tớ ghét cơ thể mình", "tớ không hài lòng với ngoại hình",
      "người ta xinh hơn tớ nhiều", "tớ tự ti về cân nặng",
      "tớ muốn giảm cân", "tớ thấy mình không xinh"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tự ti ngoại hình rất phổ biến ở tuổi cậu — áp lực hình thể từ mạng xã hội và bạn bè nhiều lắm.`, `Nhưng cơ thể cậu đang làm rất nhiều thứ cho ${name} mỗi ngày, kể cả ngày cậu không thích nó.`, `Cảm giác này xuất phát từ đâu — có ai nói gì, hay tự so sánh với ai đó?`];
    }
  },
  {
    id: "phone_addiction",
    tier: "paid",
    patterns: [
      "tớ nghiện điện thoại", "tớ không thể không dùng tiktok",
      "tớ lướt mạng xã hội quá nhiều", "nghiện game", "không thể bỏ điện thoại xuống",
      "tớ dùng điện thoại nhiều quá", "nghiện mạng xã hội", "screen time nhiều quá"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`${name} tự nhận ra điều này là bước đầu rất tỉnh táo rồi đó!`, `Điện thoại được thiết kế để gây nghiện — dopamine mỗi lần scroll là real khoa học luôn.`, `Thử "digital detox" nhỏ: đặt điện thoại sang phòng khác 30 phút. Cậu nghĩ mình chịu được không?`];
    }
  },
  {
    id: "social_anxiety",
    tier: "paid",
    patterns: [
      "tớ sợ nói trước đám đông", "tớ sợ bị phán xét", "tớ ngại tiếp xúc người lạ",
      "tớ bị social anxiety", "tớ sợ ra ngoài", "tớ không dám phát biểu",
      "tớ sợ gặp người", "tớ ngại nói chuyện", "sợ bị mọi người nhìn"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Social anxiety là 1 trong những vấn đề phổ biến nhất ở giới trẻ — ${name} không một mình đâu nha.`, `Não đang "thổi phồng" mức độ người khác chú ý đến cậu — thực tế họ bận với chính họ hơn cậu nghĩ rất nhiều.`, `Tình huống nào đang làm cậu anxious nhất gần đây?`];
    }
  },
  {
    id: "homesickness",
    tier: "paid",
    patterns: [
      "tớ nhớ nhà quá", "xa nhà cô đơn lắm", "tớ nhớ bố mẹ",
      "đi học xa nhà", "nhớ quê hương", "xa gia đình buồn lắm",
      "tớ nhớ nhà ghê lắm", "đi xa nhớ nhà"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Nhớ nhà là cảm giác nặng và thật lắm — không phải cậu yếu đâu ${name} ơi.`, `Xa nhà cũng đồng nghĩa với đang lớn và mở rộng thế giới — nhưng điều đó không làm nỗi nhớ bớt thật chút nào.`, `Gần đây cậu có gọi video về nhà chưa?`];
    }
  },
  {
    id: "first_love",
    tier: "paid",
    patterns: [
      "tớ thích ai đó", "tớ có crush", "tớ đang yêu", "tình cảm đầu tiên",
      "tớ thích bạn trong lớp", "làm sao tỏ tình", "tớ thích một người",
      "tớ đang có tình cảm với ai", "tớ bị crush"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Ôi, tình đầu nè ${name} 🥹 Cảm giác nhột nhột háo hức kiểu đó không có gì thay thế được!`, `Cậu muốn kể tớ nghe về người đó không?`, `Hay đang phân vân chưa biết phải làm gì với tình cảm này?`];
    }
  },
  {
    id: "jealousy",
    tier: "paid",
    patterns: [
      "tớ ghen với bạn", "tớ hay ghen tuông", "tớ cảm thấy ghen tị",
      "tớ ganh tị với người khác", "tớ ghét người thành công hơn tớ",
      "tớ ghen với người yêu cũ", "ghen tị là tốt hay xấu"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Ghen tị là cảm giác cực bình thường — não tự so sánh là bản năng sinh tồn đó ${name} ơi.`, `Cái quan trọng là cảm giác đó đang chỉ cho cậu thấy điều cậu thực sự muốn có là gì.`, `Cậu đang ghen vì điều gì — tình cảm, thành tích, hay ngoại hình?`];
    }
  },
  {
    id: "concentration",
    tier: "paid",
    patterns: [
      "tớ không tập trung được", "tớ mất focus", "đầu óc cứ lơ đãng",
      "tớ adhd", "tớ khó tập trung học", "đọc sách không vào đầu",
      "tớ cứ bị phân tâm", "không giữ được sự tập trung"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Khó tập trung không nhất thiết là ADHD — stress, thiếu ngủ và điện thoại cũng "phá focus" dữ dội lắm ${name}.`, `Thử Pomodoro: học 25 phút, nghỉ 5 phút, lặp lại. Dời điện thoại ra khỏi tầm nhìn trước.`, `Cậu đang học môn gì mà bị phân tâm nhiều nhất?`];
    }
  },
  {
    id: "university_exam",
    tier: "paid",
    patterns: [
      "thi đại học", "thi thpt quốc gia", "thi thptqg", "đại học rớt thì sao",
      "lo lắng thi tốt nghiệp", "áp lực thi đại học", "chọn trường đại học",
      "thi thpt", "điểm chuẩn đại học", "ôn thi đại học", "thi quốc gia"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Kỳ thi THPT là thử thách lớn thật — nhưng đây không phải "chung kết cuộc đời" như nhiều người nói đâu nha ${name}.`, `Dù kết quả thế nào cũng có nhiều con đường dẫn đến ước mơ của cậu — ngách khác thôi, không phải ngõ cụt.`, `Cậu đang ôn môn gì và phần nào làm cậu lo nhất?`];
    }
  },
  {
    id: "emptiness",
    tier: "paid",
    patterns: [
      "tớ cảm thấy trống rỗng", "tớ không cảm thấy gì cả", "tớ vô cảm",
      "tớ không biết mình đang cảm gì", "không buồn không vui chỉ trống không",
      "empty quá", "tớ thấy mọi thứ vô nghĩa", "tớ thấy tê liệt cảm xúc"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Trống rỗng, không cảm gì — nghe có vẻ "ổn" nhưng thực ra là dạng mệt mỏi cảm xúc rất thật đó ${name}.`, `Đôi khi não "tắt cảm xúc" như một cơ chế tự bảo vệ khi đã quá tải rồi.`, `Cảm giác này bắt đầu từ khoảng bao lâu nay vậy?`];
    }
  },
  {
    id: "overthinking",
    tier: "paid",
    patterns: [
      "tớ nghĩ nhiều quá", "tớ hay overthink", "đầu óc tớ không tắt được",
      "tớ cứ lo vẩn vơ", "suy nghĩ lặp lại mãi", "không ngừng lo nghĩ",
      "tớ suy nghĩ lung tung", "não tớ cứ chạy mãi"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Overthink là não đang cố "kiểm soát" tương lai bằng cách dự đoán hết mọi kịch bản tệ — kiệt sức lắm đó ${name}.`, `Khi nhận ra mình đang vòng vòng, thử hỏi: "Điều tớ lo có xảy ra ngay lúc này không?" — nếu không, kéo về hiện tại nha.`, `Cậu hay overthink về chủ đề gì nhất — học hành, tình cảm, hay tương lai?`];
    }
  },
  {
    id: "exercise_request",
    tier: "paid",
    patterns: [
      "cho tớ bài tập thở", "hướng dẫn tớ thở sâu", "dạy tớ thiền",
      "cho tớ bài thiền", "bài tập thư giãn", "tớ muốn thở sâu",
      "cho tớ thư giãn", "bài tập giảm stress", "tập thở cùng tớ"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ mở ngay bài tập thở cho ${name} nha!`, `Vào tab 'Trị Liệu' → 'Thở 4-7-8' để tớ hướng dẫn cậu từng bước — hoặc thử ngay: hít mũi 4 giây, nín 4 giây, thở miệng 6 giây, lặp 4 lần.`];
    }
  },
  {
    id: "guide_bio_link",
    tier: "free",
    patterns: [
      "huong dan tao bio link", "thiet ke trang bio link", "chinh sua bio", "them lien ket",
      "theme bio", "theme editor", "cach chinh bio", "chinh theme", "chinh nut", "chinh bo goc",
      "chieu cao", "can nang", "so do", "nguc eo", "mong"
    ],
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
    patterns: [
      "huong dan dat lich", "quan ly lich hen", "booking", "lich chup",
      "lam sao de khach dat lich", "xem lich khach dat", "lich dat hen"
    ],
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
    patterns: [
      "ma qr", "wifi qr", "qr wifi", "tao ma qr", "danh ba qr", "vcard qr", "vcard", "wifi"
    ],
    generateResponse: () => {
      return [
        "Trình tạo QR (trong HugoHelpdesk ở thẻ Tiện ích) cho phép cậu tạo mã QR cho Wi-Fi, URL, Văn bản, hoặc cả Danh bạ (vCard).",
        "Chỉ cần quét là điện thoại tự động bật popup lưu danh bạ mà không cần Internet!",
        "Cậu có thể tải về file ảnh siêu nét (PNG) hoặc in ra quét offline mượt mà."
      ];
    }
  },
  {
    id: "guide_signature",
    tier: "free",
    patterns: [
      "chu ky email", "signature", "hugosmail", "tao chu ky"
    ],
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
    patterns: [
      "code", "lap trinh", "viet code", "ide", "hugocoder", "hoc lap trinh", "hoc code"
    ],
    generateResponse: () => {
      return [
        "Trình Web-based IDE (HugoCoder ở Tab Utilities) là trình soạn thảo lập trình trực quan (C, C++, C#, Python, Web, PHP) chạy ngay trên trình duyệt.",
        "Trình IDE đi kèm các bài học lập trình cơ bản và hỗ trợ tải code về máy."
      ];
    }
  },
  {
    id: "guide_chess",
    tier: "free",
    patterns: [
      "co vua", "chess", "hugochess", "dau co", "game co"
    ],
    generateResponse: () => {
      return [
        "HugoChess (ở Tab Utilities) là không gian sảnh cờ vua mini giúp cậu thi đấu với Stockfish AI, ghép đôi ngẫu nhiên hoặc tạo phòng đấu giao hữu cùng bạn bè để tích điểm xếp hạng JOY."
      ];
    }
  },
  {
    id: "guide_partners",
    tier: "free",
    patterns: [
      "iframe", "nhung iframe", "doi tac", "nhung bio link", "partner", "khoa bao mat"
    ],
    generateResponse: () => {
      return [
        "Các đối tác liên kết muốn nhúng trình chỉnh sửa Bio Link của Hugo Studio lên trang web riêng của họ thì có thể sử dụng Iframe URL cùng khóa bảo mật do Admin cấp riêng trong Admin Panel nha."
      ];
    }
  },
  {
    id: "existential_crisis",
    tier: "paid",
    patterns: [
      "song de lam gi", "tai sao to ton tai", "cuoc song vo nghia", "y nghia cuoc song",
      "loay hoay", "khong biet minh muon gi", "ton tai vo nghia", "nhan sinh", "song de lam j",
      "chong chenh", "vo huong", "mat phuong huong", "khong co muc dich song"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Tớ nghe đây ${name}. Cảm giác chông chênh, tự hỏi "mình sống để làm gì" hay thấy mọi thứ vô nghĩa thực sự rất mệt mỏi và cô đơn.`,
        `Thực ra, không có một "đáp án mẫu" nào cho ý nghĩa cuộc sống cả. Ý nghĩa không phải thứ có sẵn để đi tìm, mà là thứ mình tự định nghĩa qua những trải nghiệm nhỏ nhất mỗi ngày.`,
        `Cậu đang cảm thấy chông chênh và mất phương hướng nhất ở điểm nào? Học tập, gia đình, hay định vị bản thân thế?`
      ];
    }
  },
  {
    id: "trauma",
    tier: "paid",
    patterns: [
      "am anh qua khu", "ki uc dau buon", "truoc day tung bi", "sang chan tam ly", "trauma",
      "nhung chuyen cu", "flashback", "noi dau cu", "am anh", "chuyen qua khu", "chuyen ngay xua"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Tớ ôm cậu một cái thật chặt nha ${name} 🫂 Những tổn thương hay ký ức đau lòng trong quá khứ không phải là thứ dễ dàng trôi qua.`,
        `Việc đột nhiên nhớ lại (flashback) hay thấy đau nhói là phản ứng tự nhiên khi vết thương lòng chưa được chữa lành hoàn toàn. Cậu không có lỗi gì cả.`,
        `Tớ luôn ở đây để lắng nghe. Nếu cậu sẵn sàng, cậu có muốn chia sẻ một chút về ký ức đang làm cậu thấy nhói lòng nhất không?`
      ];
    }
  },
  {
    id: "money_stress",
    tier: "paid",
    patterns: [
      "khong co tien", "lo tien hoc phi", "stress vi tien", "ap luc tai chinh",
      "kiem tien vat va", "het tien roi", "het tien tieu", "tu tuc tai chinh",
      "tien nong", "ap luc tien bac"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Tiền bạc thực sự là một áp lực cực kỳ thực tế và đè nặng lên vai ${name} đúng không?`,
        `Vừa lo học hành vừa lo tài chính, hoặc thấy gia đình chật vật vì học phí chắc chắn khiến cậu thấy bất an và mệt mỏi.`,
        `Gần đây cậu đang phải đối mặt với khoản chi tiêu hay khó khăn tài chính cụ thể nào thế? Kể tớ nghe xem có hướng gỡ rối nào không nha.`
      ];
    }
  },
  {
    id: "imposter_syndrome",
    tier: "paid",
    patterns: [
      "hoi chung ke gia mao", "to an may", "do may man thoi", "to lam gia",
      "khong xung dang", "imposter", "to an may thoi", "khong gioi nhu ho nghi",
      "so bi phat hien kem coi"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Cảm giác lo sợ mọi người sẽ "phát hiện ra" mình không thực sự giỏi, hay nghĩ thành công chỉ là do ăn may... đó chính là Hội chứng kẻ giả mạo (Imposter Syndrome) đó ${name}.`,
        `Thực tế, những người giỏi và cầu toàn lại là những người dễ bị cảm giác này nhất. Sự nỗ lực của cậu là có thật, kết quả cậu đạt được là xứng đáng!`,
        `Điều gì gần đây đang làm cậu thấy nghi ngờ năng lực của bản thân mình nhất vậy?`
      ];
    }
  },
  {
    id: "pet_grief",
    tier: "paid",
    patterns: [
      "cho chet", "meo chet", "thu cung qua doi", "mat pet", "mat cho meo",
      "thu cung mat", "nho thu cung", "mat em cun", "mat em meo"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Tớ xin chia buồn với cậu nha ${name} 🫂 Sự ra đi của một bạn thú cưng (pet) thực sự giống như việc mất đi một thành viên gia đình vậy.`,
        `Nỗi đau này là hoàn toàn có thật và rất lớn, cậu có quyền được khóc, được nhớ thương em ấy mà không cần gượng ép bản thân phải quên đi ngay.`,
        `Em ấy đã có một khoảng thời gian thật hạnh phúc khi được cậu yêu thương. Cậu có muốn kể cho tớ nghe kỷ niệm đáng yêu nhất của hai đứa không?`
      ];
    }
  },
  {
    id: "lgbtq_confusion",
    tier: "paid",
    patterns: [
      "to thich con trai", "to thich con gai", "co phai lgbt", "hoang mang gioi tinh",
      "come out", "so bi ky thi tinh duc", "lgbt", "gay", "les", "lesbian",
      "comeout", "ban khoan gioi tinh", "tinh duc", "xu huong tinh duc"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [
        `Hành trình tìm hiểu và định vị bản thân (bao gồm cả xu hướng tính dục) cần thời gian và sự dịu dàng với chính mình ${name} ạ.`,
        `Cậu không cần phải lập tức dán nhãn cho mình là ai. Việc băn khoăn, hoang mang hay sợ bị phán xét hoàn toàn là cảm xúc bình thường trên con đường tự khám phá.`,
        `Cậu đang cảm thấy bối rối hay gặp áp lực từ đâu nhất? Bạn bè, gia đình hay chỉ là những mâu thuẫn bên trong cậu?`
      ];
    }
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
  guide_ide:         ["Học lập trình", "Vào HugoCoder"],
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
  { id: "guide_qr",            regex: /(ma qr|tao qr|qr wifi|wifi qr|qr vcard|vcard|qr danh ba|danh ba qr|quet wifi|quet qr|quet offline|in qr|tai qr|download qr|helpdesk|nfc)/ },
  { id: "guide_signature",     regex: /(chu ky|signature|hugosmail|font chu ky|mau chu ky|tao chu ky|outlook|gmail)/ },
  { id: "guide_ide",           regex: /(code|lap trinh|viet code|ide|hugocoder|hoc lap trinh|compiler|chay code|download code|tai code|python|cpp)/ },
  { id: "guide_chess",         regex: /(co vua|chess|hugochess|dau co|choi co|phong co|giao huu|stockfish|dau co vua|choi co vua)/ },
  { id: "guide_partners",      regex: /(iframe|nhung iframe|nhung link|nhung bio|doi tac|partner|security key|khoa bao mat|ma bao mat)/ },
  { id: "panic_attack",        regex: /(kho tho|ngop tho|tim dap nhanh|hoang loan|run ray|sap ngat|panic)/ },
  { id: "crisis",              regex: /(tu tu|tu sat|ket lieu|khong muon song|muon chet|tu lam dau|muon ket thuc)/ },
  { id: "university_exam",     regex: /(thi dai hoc|thi thpt|thptqg|thi quoc gia|diem chuan dai hoc|on thi dai hoc)/ },
  { id: "burnout",             regex: /(kiet suc|burn.?out|het suc roi|can kiet nang luong|gong qua lau|xiu roi)/ },
  { id: "social_comparison",   regex: /(so sanh voi nguoi|nguoi ta gioi hon|thua kem moi nguoi|fomo|instagram lam|khong bang ai)/ },
  { id: "perfectionism",       regex: /(cau toan|muon hoan hao|so lam sai|khong dam bat dau|tu chinh minh qua|phai lam cho hoan hao)/ },
  { id: "body_image",          regex: /(tu ti ngoai hinh|beo qua|xau qua|ghet co the|khong hai long voi ngoai hinh|tu ti can nang)/ },
  { id: "phone_addiction",     regex: /(nghien dien thoai|nghien tiktok|nghien mxh|luot mang xa hoi nhieu|nghien game|screen time)/ },
  { id: "social_anxiety",      regex: /(so noi truoc dam dong|so bi phan xet|ngai tiep xuc nguoi la|social anxiety|so ra ngoai|khong dam phat bieu)/ },
  { id: "homesickness",        regex: /(nho nha|xa nha|nho bo me|di hoc xa|nho que huong|xa gia dinh)/ },
  { id: "first_love",          regex: /(thich ai do|co crush|dang yeu ai|tinh cam dau tien|thich ban trong lop|to tinh)/ },
  { id: "jealousy",            regex: /(ghen voi ban|ghen tuong|ghen ti|ganh ti voi|ghet nguoi thanh cong hon)/ },
  { id: "concentration",       regex: /(khong tap trung duoc|mat focus|lo dang|adhd|kho tap trung|doc sach khong vao)/ },
  { id: "emptiness",           regex: /(trong rong|khong cam thay gi|vo cam|khong buon khong vui|trong khong|te liet cam xuc)/ },
  { id: "overthinking",        regex: /(nghi nhieu qua|overthink|dau oc khong tat|lo van vo|suy nghi lap lai|khong ngung lo nghi)/ },
  { id: "exercise_request",    regex: /(bai tap tho|huong dan tho|day toi thien|bai thien|bai tap thu gian|muon tho sau|tap tho cung toi)/ },
  { id: "checkin_feature",     regex: /(check.?in la gi|diem danh cam xuc|streak la gi|tai sao phai check)/ },
  { id: "venting_space",       regex: /(khong gian trut gian|trut bau tam su|tin nhan tu huy|che do trut gian)/ },
  { id: "loneliness",          regex: /(co don|lac long|khong ai hieu|khong ai ben canh|bi bo roi|khong co ban)/ },
  { id: "family_conflict",     regex: /(cai nhau voi bo me|gia dinh khong hieu|bo me ap dat|mau thuan voi gia dinh|bo me la mang|ky vong qua nhieu)/ },
  { id: "friendship_conflict", regex: /(ban be xa lanh|bi bat nat|bi co lap|noi xau to|tay chay|bi bully|drama ban be)/ },
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
  { id: "academic_stress",     regex: /(ap luc hoc|thi cu|diem so|thi rot|stress hoc|bai tap qua tai|deadline chong chat)/ },
  { id: "anxiety",             regex: /(lo au|lo lang|bon chon|so hai|hoang so|lo so|tim dap hoi hop)/ },
  { id: "sadness",             regex: /(buon|chan nan|tuyet vong|met moi|khoc|cam thay te|khong vui)/ },
  { id: "gratitude",           regex: /(cam on|thank|de thuong|huu ich|tot qua|cau tot)/ },
  { id: "positive",            regex: /(vui|khoe|hanh phuc|tuyet voi|rat tot|on lam|dang ok)/ },
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

  let bestMatch = null;
  let highestScore = 0;

  // 4. Regex fast-path — O(n) rules, ~1ms, highest priority for pre-compiled static patterns.
  for (const rule of STATIC_RULES) {
    if (rule.regex.test(cleanText)) {
      const intentObj = INTENT_MAP[rule.id];
      if (intentObj) {
        bestMatch = intentObj;
        highestScore = 0.95;
        break;
      }
    }
  }

  // 5. Fuse.js fuzzy match — primary similarity engine (handles typos, missing diacritics).
  if (!bestMatch) {
    const fuse = getFuseInstance();
    const results = fuse.search(cleanText);
    if (results.length > 0 && results[0].score < 0.22) {
      // Guard: if input is a single word or very short, require a much stricter match score (< 0.08)
      const isShort = cleanText.length <= 6 || !cleanText.includes(" ");
      const maxAllowedScore = isShort ? 0.08 : 0.22;
      if (results[0].score < maxAllowedScore) {
        const intentObj = INTENT_MAP[results[0].item.id];
        if (intentObj) {
          bestMatch = intentObj;
          highestScore = 1 - results[0].score;
        }
      }
    }
  }

  // 6. Sørensen-Dice fallback — catches cases Fuse misses, optimized using pre-computed untoned lookups
  if (!bestMatch) {
    for (const item of PRECOMPUTED_UNTONED_PATTERNS) {
      const score = Math.max(
        getDiceSimilarity(text, item.original),
        getDiceSimilarity(cleanText, item.untoned)
      );
      if (score > highestScore) {
        // Guard: if input is a single word or very short, require a much higher dice similarity (>= 0.88)
        const isShort = cleanText.length <= 6 || !cleanText.includes(" ");
        const minAllowedScore = isShort ? 0.88 : 0.78;
        if (score >= minAllowedScore) {
          highestScore = score;
          bestMatch = item.intent;
        }
      }
    }
  }

  // Nâng ngưỡng từ 0.60 lên 0.78 để tránh bắt sai các câu hội thoại tự nhiên, nhường chỗ cho LLM thấu cảm
  if (highestScore >= 0.78 && bestMatch) {
    const replyText = bestMatch.generateResponse(bio, historyLogs, updatedMemory);

    let companionUpdate = null;
    const NEGATIVE_IDS = new Set([
      "sadness", "grief", "emptiness", "breakup", "anxiety", "academic_stress", "panic_attack", 
      "burnout", "social_anxiety", "overthinking", "loneliness", "low_self_esteem", "perfectionism", 
      "body_image", "family_conflict", "friendship_conflict", "existential_crisis", "trauma", 
      "money_stress", "imposter_syndrome", "pet_grief", "lgbtq_confusion"
    ]);
    const POSITIVE_IDS = new Set(["positive", "gratitude", "first_love"]);
    if (NEGATIVE_IDS.has(bestMatch.id)) {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: `Local intent: ${bestMatch.id}` } };
    } else if (POSITIVE_IDS.has(bestMatch.id)) {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 4, note: `Local intent: ${bestMatch.id}` } };
    }

    // 3. COMBO ESCALATION — if user has 3+ recent negative moods, gently suggest
    // a clinical test so they don't spiral without any structured support.
    // Runs only on high-distress intents to avoid false positives.
    const HIGH_DISTRESS = new Set([
      "sadness", "anxiety", "burnout", "emptiness", "loneliness", "grief", 
      "low_self_esteem", "overthinking", "existential_crisis", "trauma"
    ]);
    let suggestPhq9 = bestMatch.suggestPhq9 || false;
    let suggestGad7 = bestMatch.suggestGad7 || false;
    if (HIGH_DISTRESS.has(bestMatch.id)) {
      const recentNeg = (historyLogs || []).slice(-8).filter(l => l.type === "checkin" && l.mood <= 2).length;
      if (recentNeg >= 3) {
        suggestPhq9 = true;
      }
    }

    const showInlineBreathing = new Set(["panic_attack", "anxiety", "future_anxiety", "burnout", "anger", "academic_stress"]).has(bestMatch.id);
    const showInlineCbt = new Set(["low_self_esteem", "overthinking", "perfectionism", "social_comparison", "body_image", "imposter_syndrome"]).has(bestMatch.id);

    return {
      reply: replyText,
      id: bestMatch.id,
      tier: bestMatch.tier || "paid",
      suggestPhq9,
      suggestGad7,
      showInlineBreathing,
      showInlineCbt,
      quickActions: bestMatch.quickActions || null,
      quickReplies: INTENT_QUICK_REPLIES[bestMatch.id] || [],
      companionUpdate
    };
  }

  return null;
}
