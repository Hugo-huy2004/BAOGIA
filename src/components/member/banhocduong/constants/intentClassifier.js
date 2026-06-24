/**
 * Local Intent Classifier for "HugoPSY"
 * Computes client-side string similarity using the Sørensen-Dice coefficient (character bigrams)
 * normalized for accented and de-accented Vietnamese text.
 * Integrates user profile (`bio`) and historical test scores (`historyLogs`) to construct dynamic responses.
 */
import { matchTherapyMethod } from "./therapyMethods";

// Helper to isolate user's friendly name (first name)
function getFriendlyName(bio) {
  if (!bio?.displayName) return "cậu";
  const parts = bio.displayName.trim().split(" ");
  return parts[parts.length - 1]; // get first name
}

// Convert scores to Vietnamese clinical severity text
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

// Helper to remove accents/diacritics from Vietnamese strings for robust matching
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
  
  // Normalize character composition NFD and strip combining diacritic marks
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result;
}

// Single source of truth for self-harm/suicide-risk detection, used by both the
// regex `rules` fast-path and the redundant safety-net check in findMatchingIntent.
// Broader than a plain keyword list on purpose: real messages are rarely the
// textbook phrase "tôi muốn tự tử" — they show up as "tôi sẽ chết", "nếu tôi
// chết rồi thì sao", etc. We deliberately bias toward over-triggering (a caring
// message + hotline buttons shown when not strictly needed costs little) over
// under-triggering (missing a real crisis costs everything). The negative
// lookahead on "chet" excludes common Vietnamese hyperbole idioms ("chết mất",
// "đói chết", "chết cười"...) that aren't expressions of suicidal ideation.
export function isCrisisText(cleanText) {
  if (!cleanText) return false;
  const explicit = /(tu tu|tu sat|ket lieu|lam hai ban than|tu lam dau|tu tu o dau|khong muon song|khong con muon song|muon ket thuc tat ca|ket thuc cuoc doi|bien mat vinh vien|khong thiet song|song khong co y nghia|the gioi se tot hon khi khong co|khong ai can (toi|minh|to)( nua)?)/;
  if (explicit.test(cleanText)) return true;

  // "tôi/tớ/mình [sẽ/sắp/có lẽ sẽ] chết" or "nếu tôi/tớ/mình chết..." —
  // a first-person death statement, excluding common hyperbole suffixes.
  const firstPersonDeath = /\b(toi|to|minh)\b[^.!?]{0,12}\bchet\b(?!\s*(mat|doi|met|khat|cuoi|ngat|sieng|thui|qua|di))/;
  const conditionalDeath = /\bneu\b[^.!?]{0,15}\b(toi|to|minh)\b[^.!?]{0,12}\bchet\b/;
  return firstPersonDeath.test(cleanText) || conditionalDeath.test(cleanText);
}

// ── Dynamic "current metrics" report ────────────────────────────────────────
// Mirrors EvaluationTab.jsx's own severity thresholds (kept duplicated on
// purpose — that file is a heavy UI component this lightweight module has no
// business importing). Used both by the "+" quick action and by free-text
// requests like "đánh giá hiện tại của tớ thế nào".
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
    return ["Cậu chưa làm bài test nào để tớ có chỉ số báo cáo cả.", "Cậu muốn làm một bài test ngắn ngay bây giờ không?"];
  }

  const lines = ["📊 Đây là chỉ số gần nhất của cậu:"];
  if (latestPhq9) lines.push(`• PHQ-9 (trầm cảm): ${latestPhq9.score}/27 — mức ${SEVERITY_LABELS[phq9Severity(latestPhq9.score)]}, đo ngày ${formatVnDate(latestPhq9.date)}.`);
  if (latestGad7) lines.push(`• GAD-7 (lo âu): ${latestGad7.score}/21 — mức ${SEVERITY_LABELS[gad7Severity(latestGad7.score)]}, đo ngày ${formatVnDate(latestGad7.date)}.`);
  if (latestWho5) lines.push(`• WHO-5 (sức khoẻ tinh thần): ${latestWho5.score}/25 — mức ${SEVERITY_LABELS[who5Severity(latestWho5.score)]}, đo ngày ${formatVnDate(latestWho5.date)}.`);

  const anySevere = [latestPhq9 && phq9Severity(latestPhq9.score), latestGad7 && gad7Severity(latestGad7.score), latestWho5 && who5Severity(latestWho5.score)]
    .some(s => s === "severe" || s === "extremely_severe");
  return [lines.join("\n"), anySevere ? "Mấy chỉ số này đang ở mức cao — cậu có muốn tớ mở luôn một liệu pháp phù hợp không?" : "Nhìn chung là ổn, cứ duy trì nhịp chăm sóc bản thân như vậy nhé! 💙"];
}

// Calculate Sørensen-Dice coefficient similarity between two strings
export function getDiceSimilarity(str1, str2) {
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const clean = (s) => (s || "").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
  const s1 = clean(str1);
  const s2 = clean(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  
  let intersection = 0;
  for (const bigram of b1) {
    if (b2.has(bigram)) intersection++;
  }
  
  return (2.0 * intersection) / (b1.size + b2.size);
}

// Get the maximum similarity score considering both accented and unaccented variations
export function getSimilarityScore(s1, s2) {
  const scoreAccented = getDiceSimilarity(s1, s2);
  const scoreUnaccented = getDiceSimilarity(removeVietnameseTones(s1), removeVietnameseTones(s2));
  return Math.max(scoreAccented, scoreUnaccented);
}

// Database of local intents, patterns, and dynamic response generators
export const INTENT_DATABASE = [
  {
    id: "greeting",
    tier: "free",
    patterns: [
      "chào cậu",
      "chào bạn",
      "hello",
      "hi",
      "xin chào",
      "chào bot",
      "chào bạn học đường",
      "chào hugopsy",
      "chào chuyên viên",
      "chào nha",
      "helo cậu",
      "helo",
      "lo cau"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const checkins = (historyLogs || []).filter(l => l.type === "checkin" && l.mood);

      // Calculate active checkin streak (today or yesterday)
      let streak = 0;
      const days = new Set(checkins.map(c => new Date(c.date).toDateString()));
      let dateCursor = new Date();
      if (!days.has(dateCursor.toDateString())) {
        dateCursor.setDate(dateCursor.getDate() - 1);
      }
      while (days.has(dateCursor.toDateString())) {
        streak++;
        dateCursor.setDate(dateCursor.getDate() - 1);
      }

      if (streak > 1) {
        return [`Eyy ${name}! 🔥`, `Bền vững ${streak} ngày liền rồi nha, quá nể luôn đó.`, `Hôm nay sao rồi, kể tớ nghe coi?`];
      }
      if (checkins.length > 0) {
        const latest = checkins[checkins.length - 1];
        if (latest.mood <= 2) {
          return [`Chào ${name} 👋`, `Lần check-in trước thấy cậu hơi xìu xìu á.`, `Giờ đỡ hơn chút nào chưa?`];
        }
      }
      return [`Chàoo ${name}! 😊`, `Tớ ở đây nghe cậu kể nè.`, `Hôm nay của cậu vibe sao rồi?`];
    }
  },
  {
    id: "goodbye",
    tier: "free",
    patterns: [
      "tạm biệt",
      "bye",
      "bye bye",
      "hẹn gặp lại",
      "tớ đi ngủ đây",
      "tớ đi học đây",
      "tạm biệt cậu nhé",
      "tớ offline đây"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Bye ${name} ơi 👋`, `Nghỉ ngơi sạc lại pin nha, đừng gồng quá.`, `Cần gì tớ luôn ở đây hết!`];
    }
  },
  {
    id: "identity",
    tier: "paid",
    patterns: [
      "cậu là ai",
      "bạn là ai",
      "tên cậu là gì",
      "bạn học đường là ai",
      "hugopsy là ai",
      "đây là bot gì",
      "giới thiệu bản thân",
      "cậu tên gì",
      "bạn tên gì",
      "cậu là bot hay người"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ là HugoPSY nè 🌸`, `Chuyên gia tâm lý AI nhỏ, ở đây để nghe ${name} xả hết mọi chuyện.`, `Học hành, cảm xúc, drama gì cũng quăng cho tớ luôn nha!`];
    }
  },
  {
    id: "features",
    tier: "paid",
    patterns: [
      "cậu có thể làm gì",
      "tính năng của ứng dụng",
      "hướng dẫn sử dụng",
      "giúp tớ thế nào",
      "tính năng trị liệu là gì",
      "ứng dụng này giúp gì cho tớ",
      "bot này làm được gì",
      "chức năng của cậu là gì",
      "tính năng của app"
    ],
    generateResponse: () => {
      return [`Tớ có cả combo xịn nè:`, `Thở 4-7-8 hết stress liền, thư giãn cơ, âm thanh thiên nhiên dễ ngủ, mấy bài test tâm lý chuẩn xò luôn.`, `Vào tab 'Trị Liệu' hay 'Đánh Giá' là quẹt liền á!`];
    }
  },
  {
    id: "academic_stress",
    tier: "paid",
    patterns: [
      "áp lực học tập",
      "học hành mệt mỏi",
      "sợ thi rớt",
      "học không vào",
      "áp lực điểm số",
      "căng thẳng vì học hành",
      "áp lực thi cử",
      "stress học tập",
      "mệt mỏi vì thi cử"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Áp lực thi cử dễ làm não ${name} quá tải lắm á, hiểu mà.`, `Nhưng điểm số không nói lên cậu là ai đâu nha, thiệt đó.`, `Thử chia nhỏ bài ra + thở sâu xíu. Suy nghĩ nào đang dằn vặt cậu nhất giờ?`];
    }
  },
  {
    id: "sleep",
    tier: "paid",
    patterns: [
      "tớ bị mất ngủ",
      "khó ngủ quá",
      "làm sao để ngủ ngon",
      "không ngủ được",
      "thức khuya quá",
      "mẹo ngủ ngon",
      "làm sao ngủ ngon",
      "mất ngủ kéo dài"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Mất ngủ là dấu hiệu não ${name} vẫn còn "chạy ngầm" lo âu đó.`, `Thử tắt điện thoại trước ngủ 30p, phòng tối mát, nghe mưa rơi ở tab Trị Liệu nha.`, `Tối nay ngủ được mấy tiếng rồi?`];
    }
  },
  {
    id: "anxiety",
    tier: "paid",
    patterns: [
      "tớ thấy lo lắng",
      "bị lo âu quá",
      "hoảng sợ",
      "lo sợ mọi thứ",
      "cảm thấy bồn chồn",
      "lo âu nặng",
      "làm sao hết lo âu",
      "tớ lo sợ quá"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const gad7Logs = (historyLogs || []).filter(l => l.test === "gad7");
      if (gad7Logs.length > 0) {
        const latest = gad7Logs[gad7Logs.length - 1];
        const dateStr = new Date(latest.date).toLocaleDateString("vi-VN");
        const severity = getGad7SeverityVi(latest.score);
        return [`Test GAD-7 hôm ${dateStr} của cậu là ${latest.score}/21, mức ${severity} đó.`, `Lo âu là cơ chế tự bảo vệ thôi, không phải cậu yếu đuối gì hết.`, `Thở sâu 4-7-8 cùng tớ xíu nha?`];
      }
      return [`Lo âu giống một cơn bão lướt qua người ${name} vậy, tim đập nhanh suy nghĩ rối tung.`, `Bình tĩnh lại bằng hơi thở sâu cùng tớ nha.`, `Cơ thể đang gồng/bồn chồn ở đâu nhất vậy?`];
    }
  },
  {
    id: "sadness",
    tier: "paid",
    patterns: [
      "tớ buồn quá",
      "chán nản mọi thứ",
      "thấy mệt mỏi buồn bã",
      "muốn khóc",
      "tâm trạng tồi tệ",
      "tâm trạng đi xuống",
      "tớ thấy buồn",
      "buồn chán quá"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const phq9Logs = (historyLogs || []).filter(l => l.test === "phq9");
      if (phq9Logs.length > 0) {
        const latest = phq9Logs[phq9Logs.length - 1];
        const dateStr = new Date(latest.date).toLocaleDateString("vi-VN");
        const severity = getPhq9SeverityVi(latest.score);
        return [`Test PHQ-9 ngày ${dateStr} của cậu ${latest.score}/27, mức ${severity}.`, `Buồn không có nghĩa cậu yếu đuối, chỉ là tâm hồn cần được nghỉ thôi.`, `Điều gì đang làm cậu thấy bí nhất hôm nay?`];
      }
      return [`Nỗi buồn không định nghĩa con người cậu đâu, ${name} ơi.`, `Cứ cho phép bản thân buồn một chút, không cần gồng.`, `Cậu muốn viết hết ra ở 'Viết Tự Do' (tab Trị liệu) không?`];
    }
  },
  {
    id: "crisis",
    tier: "free",
    patterns: [
      "tớ muốn tự tử",
      "muốn chết",
      "không muốn sống nữa",
      "tự tử ở đâu",
      "làm hại bản thân",
      "muốn kết liễu đời mình",
      "muốn tự sát",
      "nếu tôi chết rồi thì sao",
      "tôi sẽ chết",
      "không ai cần tôi nữa",
      "biến mất khỏi thế giới này",
      "sống không có ý nghĩa",
      "muốn kết thúc tất cả"
    ],
    // Kept as a single atomic message on purpose — urgent safety info (hotline,
    // emergency number) must never be split/delayed across multiple bubbles.
    // Two-beat structure per product requirement: (1) deep emotional validation
    // first, so it never reads like a canned/robotic safety notice, THEN (2) the
    // actionable safety info + tappable quickActions (rendered as tel: buttons
    // by ChatTab, not just plain text) so the user can reach help in one tap.
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `${name} ơi, tớ đang nghe thấy một nỗi đau rất lớn trong những gì cậu vừa nói, và tớ không xem nhẹ nó một chút nào. Cậu không hề yếu đuối hay sai trái khi cảm thấy như vậy — chỉ là cậu đang phải mang một gánh nặng quá sức một mình ngay lúc này. Tớ thật lòng mong cậu được an toàn, và tớ sẽ ở đây cùng cậu qua khoảnh khắc này. Ngay bây giờ, xin cậu hãy chạm vào một trong các nút gọi khẩn cấp dưới đây hoặc tìm một người cậu tin tưởng để họ ở bên cậu lúc này — cậu xứng đáng được giúp đỡ và không phải một mình chịu đựng điều này.`;
    },
    // Rendered by ChatTab as one-tap tel: call buttons directly under the message —
    // not just numbers buried in text — so reaching real help takes a single tap.
    quickActions: [
      { label: "📞 Gọi Cấp Cứu 115", tel: "115" },
      { label: "📞 Đường Dây Nóng Tâm Lý 1800 599 920", tel: "1800599920" }
    ]
  },
  {
    id: "clinical_tests",
    tier: "paid",
    patterns: [
      "test trầm cảm",
      "test lo âu",
      "kiểm tra sức khỏe tinh thần",
      "bài test phq9",
      "bài test gad7",
      "trắc nghiệm tâm lý",
      "kiểm tra trầm cảm",
      "làm bài test",
      "bài trắc nghiệm tâm lý"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Làm test chuẩn lâm sàng (PHQ-9, GAD-7) giúp ${name} biết rõ tình trạng thật, đỡ phải lo mơ hồ.`, `Qua tab 'Đánh Giá' làm nha, tớ lưu kết quả theo dõi tiến triển cho cậu luôn.`];
    },
    suggestPhq9: true,
    suggestGad7: true
  },
  {
    id: "gratitude",
    tier: "free",
    patterns: [
      "cảm ơn cậu",
      "thank you",
      "cảm ơn bạn học đường",
      "bot dễ thương quá",
      "cảm ơn chuyên viên",
      "cậu tốt quá",
      "bot hữu ích quá",
      "cảm ơn bot"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Có gì đâu ${name} ơi 🥹`, `Được cậu tin tưởng chia sẻ là tớ vui muốn xỉu rồi á.`, `Chúc cậu một ngày nhẹ nhàng nha!`];
    }
  },
  {
    id: "positive",
    tier: "free",
    patterns: [
      "tớ thấy vui",
      "hôm nay rất vui",
      "mọi thứ tốt",
      "tớ thấy ổn",
      "tớ rất khỏe",
      "tâm trạng tốt",
      "ngày hôm nay tuyệt vời",
      "tớ thấy hạnh phúc",
      "moi thu on"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Yass ${name}! Vui dữ vậy nè 🎉`, `Giữ cái vibe này lại nha.`, `Điều gì làm cậu vui dữ vậy, kể tớ nghe đi?`];
    }
  },
  {
    id: "test_inventory",
    tier: "paid",
    patterns: [
      "bạn có bao nhiêu bài test",
      "có những bài test gì",
      "danh sách bài test",
      "ứng dụng có mấy bài trắc nghiệm",
      "các bài kiểm tra tâm lý",
      "test tâm lý gồm những gì",
      "có bao nhiêu bài trắc nghiệm"
    ],
    generateResponse: () => {
      return [`Hệ thống có 4 bài chuẩn lâm sàng: DASS-21/42, MMPI, PHQ-9 (trầm cảm), GAD-7 (lo âu).`, `Kể tớ nghe tình trạng hiện tại, tớ gợi ý bài hợp nhất, hoặc vào tab 'Đánh Giá' chọn luôn cũng được!`];
    }
  },
  {
    id: "therapy_catalog",
    tier: "paid",
    patterns: [
      "có liệu pháp gì",
      "trị liệu gồm những gì",
      "các liệu pháp tự chữa lành",
      "hướng dẫn dùng liệu pháp",
      "tớ nên dùng liệu pháp nào"
    ],
    generateResponse: () => {
      return [`Có 4 liệu pháp chính nè: Thở 4-7-8 (lo âu/mất ngủ), Ngồi Tĩnh Tâm (căng thẳng), CBT (suy nghĩ tiêu cực), Đọc sách Trị liệu (chiêm nghiệm).`, `Còn vài món AI cao cấp mở bằng JOY nữa. Ghé tab 'Trị Liệu' khám phá nha!`];
    }
  },
  {
    id: "pricing_package",
    tier: "paid",
    patterns: [
      "gói cước giá bao nhiêu",
      "làm sao mua gói",
      "cách hủy gói",
      "cách đổi gói",
      "gói nào phù hợp với tớ",
      "phí dịch vụ là bao nhiêu",
      "có mất phí không"
    ],
    generateResponse: () => {
      return [`Giá và các gói đồng hành xem ở tab 'Quản lý' trong Cổng thành viên nha, đủ info luôn.`, `Kể tớ tình trạng của cậu, tớ gợi ý gói hợp nhất cho!`];
    }
  },
  {
    id: "joy_currency",
    tier: "paid",
    patterns: [
      "joy là gì",
      "làm sao có joy",
      "joy dùng để làm gì",
      "kiếm joy thế nào",
      "joy là tiền gì"
    ],
    generateResponse: () => {
      return [`JOY là tiền nội bộ hệ thống, kiếm bằng cách giới thiệu bạn bè hoặc đổi quà tặng.`, `Dùng JOY mở liệu pháp AI cao cấp hoặc mua đồ ở Cửa hàng tiện ích. Xem số dư ở tab 'JOY' nha!`];
    }
  },
  {
    id: "token_limit",
    tier: "paid",
    patterns: [
      "mỗi ngày chat được mấy lần",
      "hết token thì sao",
      "token chat là gì",
      "tại sao bị trừ token",
      "khi nào token được làm mới"
    ],
    generateResponse: () => {
      return [`Mỗi ngày cậu có 10 token chat. Chào hỏi/cảm ơn/tâm sự thường thì free hết.`, `Câu hỏi tớ trả lời ngay tốn 1 token, cần suy nghĩ sâu thì 3 token.`, `Reset mỗi ngày mới, hoặc mua thêm bằng JOY nếu cần gấp!`];
    }
  },
  {
    id: "about_creator",
    tier: "paid",
    patterns: [
      "ai tạo ra app này",
      "hugo studio là gì",
      "đội ngũ phát triển là ai",
      "app này của ai"
    ],
    generateResponse: () => {
      return [`Tớ được Hugo Studio xây và huấn luyện nè.`, `Mục tiêu là làm bạn đồng hành tâm lý học đường cho học sinh, sinh viên Việt Nam — cải tiến liên tục để nghe cậu tốt hơn mỗi ngày!`];
    }
  },
  {
    id: "data_privacy",
    tier: "paid",
    patterns: [
      "dữ liệu của tớ có an toàn không",
      "ai xem được tin nhắn của tớ",
      "thông tin có bị lộ không",
      "có ai đọc được tâm sự của tớ không"
    ],
    generateResponse: () => {
      return [`Mọi tâm sự + dữ liệu hồ sơ của cậu được bảo mật, chỉ dùng để tớ cá nhân hoá hỗ trợ thôi.`, `Không chia cho bên thứ ba đâu, cứ yên tâm tâm sự thật lòng nha!`];
    }
  },
  {
    id: "support_contact",
    tier: "paid",
    patterns: [
      "liên hệ hỗ trợ thế nào",
      "báo lỗi ở đâu",
      "gặp vấn đề kỹ thuật thì sao",
      "tớ muốn gặp nhân viên hỗ trợ"
    ],
    generateResponse: () => {
      return [`Lỗi kỹ thuật/cần người thật hỗ trợ thì bấm khung chat hỗ trợ ở trang chủ nha, team Hugo Studio sẽ phản hồi sớm.`, `Còn chuyện tâm lý thì cứ kể tớ trước đã!`];
    }
  },
  {
    id: "loneliness",
    tier: "paid",
    patterns: [
      "tớ thấy cô đơn",
      "không ai hiểu tớ",
      "tớ cảm thấy lạc lõng",
      "tớ chẳng có ai để nói chuyện",
      "tớ cô đơn quá",
      "không ai bên cạnh tớ",
      "tớ thấy mình bị bỏ rơi"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Cô đơn dù xung quanh đầy người là cảm giác rất thật, nhiều bạn cùng tuổi ${name} cũng vậy đó.`, `Thường không phải thiếu người, mà thiếu một kết nối đủ sâu để được hiểu thôi.`, `Cậu bắt đầu thấy lạc lõng từ lúc nào vậy?`];
    }
  },
  {
    id: "family_conflict",
    tier: "paid",
    patterns: [
      "cãi nhau với bố mẹ",
      "gia đình không hiểu tớ",
      "bố mẹ áp đặt tớ quá",
      "mâu thuẫn với gia đình",
      "bố mẹ la mắng tớ",
      "tớ với gia đình không hợp",
      "gia đình tớ căng thẳng"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Mâu thuẫn gia đình nhiều khi chỉ là 2 bên "nói chuyện khác kênh" thôi, không hẳn vì không thương nhau.`, `Cảm giác bị áp đặt của ${name} hoàn toàn hợp lý mà.`, `Kể tớ nghe chuyện vừa xảy ra đi, để tớ gỡ rối cùng cậu.`];
    }
  },
  {
    id: "friendship_conflict",
    tier: "paid",
    patterns: [
      "bạn bè xa lánh tớ",
      "tớ bị bắt nạt",
      "mâu thuẫn với bạn bè",
      "tớ bị cô lập trong lớp",
      "bạn thân nói xấu tớ",
      "tớ bị bạn bè tẩy chay",
      "tớ bị bully"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Bị tẩy chay/bully đau thiệt đó, tuổi này được công nhận quan trọng lắm.`, `Đây không phải lỗi của ${name} đâu, nhớ vậy nha.`, `Cậu đang an toàn không? Có nói với thầy cô/người lớn tin tưởng nào chưa?`];
    }
  },
  {
    id: "breakup",
    tier: "paid",
    patterns: [
      "tớ vừa chia tay",
      "thất tình",
      "người yêu chia tay tớ",
      "tớ buồn vì chia tay",
      "tình cảm tan vỡ",
      "tớ bị người yêu bỏ"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Chia tay giống như mất một phần kỳ vọng đã xây cùng nhau, buồn là chuyện đương nhiên ${name} ơi.`, `Đừng ép bản thân "ổn" liền đâu nha.`, `Điều gì làm cậu day dứt nhất về chuyện này?`];
    }
  },
  {
    id: "low_self_esteem",
    tier: "paid",
    patterns: [
      "tớ thấy mình vô dụng",
      "tớ tự ti quá",
      "tớ thấy mình kém cỏi",
      "tớ không tin vào bản thân",
      "tớ ghét bản thân mình",
      "tớ cảm thấy mình thất bại"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Lúc buồn, não hay "thổi phồng" lỗi sai và hạ giá trị bản thân xuống — không phải sự thật về ${name} đâu.`, `Giá trị một người không nằm ở vài lần vấp ngã hay so sánh với ai khác.`, `Kể tớ nghe 1 điều — dù nhỏ xíu — cậu đã làm tốt gần đây xem?`];
    }
  },
  {
    id: "procrastination",
    tier: "paid",
    patterns: [
      "tớ hay trì hoãn",
      "tớ lười học quá",
      "tớ không có động lực làm bài",
      "tớ cứ trì hoãn deadline",
      "tớ không muốn làm gì cả",
      "tớ mất động lực học tập"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Trì hoãn thường không phải lười, mà là não đang "trốn" cảm giác sợ thất bại hoặc việc quá to đó ${name}.`, `Mẹo: chia ra bước đầu cực ngắn (2 phút thôi) để lừa cảm giác quá tải.`, `Việc gì đang khiến cậu chần chừ nhất giờ?`];
    }
  },
  {
    id: "anger",
    tier: "paid",
    patterns: [
      "tớ tức giận quá",
      "tớ đang rất bực bội",
      "tớ nóng giận",
      "tớ giận điên lên được",
      "tớ thấy ấm ức",
      "tớ khó chịu trong người"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Giận thường là lớp vỏ ngoài che một cảm giác sâu hơn như bị tổn thương hay bất công, hoàn toàn bình thường ${name} ơi.`, `Trước khi phản ứng, hít sâu vài nhịp cho hệ thần kinh dịu lại đã.`, `Chuyện gì vừa xảy ra vậy?`];
    }
  },
  {
    id: "panic_attack",
    tier: "free",
    patterns: [
      "tớ bị khó thở",
      "tim tớ đập nhanh quá",
      "tớ đang hoảng loạn",
      "tớ thấy ngộp thở",
      "tớ run rẩy không kiểm soát được",
      "tớ sắp ngất rồi"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`${name} ơi, nghe giống cơn hoảng loạn (panic attack) — đáng sợ thật nhưng KHÔNG nguy hiểm tính mạng, sẽ qua đi.`, `Làm cùng tớ ngay: nhìn quanh gọi tên 5 vật thấy, 3 âm thanh nghe.`, `Rồi hít mũi 4 giây - giữ 4 giây - thở miệng 6 giây, lặp lại vài lần. Cậu đang ở chỗ an toàn không?`];
    }
  },
  {
    id: "grief",
    tier: "paid",
    patterns: [
      "tớ vừa mất người thân",
      "tớ đau buồn vì mất mát",
      "người tớ yêu thương đã qua đời",
      "tớ không vượt qua được nỗi đau mất người thân",
      "tớ đang để tang"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tớ rất tiếc vì mất mát lớn này, ${name}.`, `Đau buồn không có "đúng tiến độ" — cậu được phép buồn bao lâu cậu cần.`, `Tớ ở đây nếu cậu muốn kể về người đó, hay chỉ cần ai ngồi cạnh im lặng cũng được.`];
    }
  },
  {
    id: "future_anxiety",
    tier: "paid",
    patterns: [
      "tớ hoang mang về tương lai",
      "tớ không biết chọn ngành gì",
      "tớ lo lắng về định hướng nghề nghiệp",
      "tớ không biết mình muốn gì",
      "tớ sợ chọn sai ngành"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Hoang mang về tương lai ở tuổi ${name} là cực kỳ bình thường, không ai bắt buộc biết hết ngay từ giờ đâu.`, `Thay vì tìm câu trả lời "đúng tuyệt đối", cứ khám phá dần thôi.`, `Gần đây điều gì làm cậu thấy hứng/tò mò nhất?`];
    }
  },
  {
    id: "checkin_feature",
    tier: "paid",
    patterns: [
      "check-in là gì",
      "điểm danh cảm xúc là gì",
      "streak là gì",
      "tại sao phải check-in",
      "check in cảm xúc để làm gì"
    ],
    generateResponse: () => {
      return [`Check-in là ghi nhận tâm trạng mỗi ngày, chỉ vài giây thôi.`, `Giúp tớ thấy xu hướng cảm xúc cậu (chuỗi ngày liên tục = "streak"), từ đó gợi ý đúng cái cậu cần. Check-in ngay đầu khung chat nha!`];
    }
  },
  {
    id: "venting_space",
    tier: "paid",
    patterns: [
      "không gian trút giận là gì",
      "trút bầu tâm sự là gì",
      "chế độ trút giận hoạt động sao",
      "tin nhắn tự hủy là gì"
    ],
    generateResponse: () => {
      return [`"Trút Bầu Tâm Sự An Toàn" là chế độ tin nhắn tự xoá sau thời gian cậu chọn — KHÔNG lưu lại đâu hết.`, `Trút sạch những điều khó nói mà không lo bị đọc lại. Bật ngay trong khung chat nha!`];
    }
  },
  {
    id: "room_organization",
    tier: "paid",
    patterns: [
      "làm sao bố trí phòng",
      "sắp xếp phòng cho gọn",
      "trang trí góc học tập",
      "phòng tớ bừa quá",
      "dọn phòng thế nào",
      "sắp xếp lại phòng ngủ"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Phòng bừa thường làm đầu óc cũng rối theo đó, ${name}!`, `Mẹo nhỏ: tách 3 khu riêng — học/ngủ/thư giãn — và bỏ hết đồ không dùng tới khỏi mặt bàn học.`, `Ánh sáng tự nhiên + 1 góc cây xanh nhỏ cũng giúp tinh thần nhẹ hẳn. Cậu đang gặp khó ở khu nào nhất?`];
    }
  },
  {
    id: "mindful_spending",
    tier: "paid",
    patterns: [
      "tớ muốn mua đồ tớ thích",
      "có nên mua cây không",
      "tớ muốn tự thưởng cho mình",
      "mua sắm để giải tỏa",
      "tớ hay mua sắm linh tinh",
      "tớ tiêu xài quá đà"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return [`Tự thưởng cho bản thân — mua cây, món đồ nhỏ mình thích — là cách chăm sóc tinh thần hoàn toàn lành mạnh đó ${name}!`, `Chỉ cần để ý: nếu mua sắm đang là cách DUY NHẤT để né cảm xúc khó chịu, hoặc làm cậu lo về tài chính sau đó, thì nên chững lại xíu.`, `Món cậu đang muốn mua là gì, kể tớ nghe thử?`];
    }
  }
];

// Main function to check input against database. Returns matched object with reply if similarity >= 0.8
export function findMatchingIntent(userText, bio, historyLogs = []) {
  if (!userText) return null;
  const text = userText.trim();
  if (text.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  const cleanText = removeVietnameseTones(text).toLowerCase();

  // Crisis detection runs before anything else, via isCrisisText() (shared
  // detector, see definition above) rather than a regex entry in `rules` —
  // it needs broader logic (negative lookahead, conditional phrasing) than a
  // single inline pattern can express clearly.
  if (isCrisisText(cleanText)) {
    const crisisIntent = INTENT_DATABASE.find(i => i.id === "crisis");
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

  // Therapy-navigation: "tớ muốn tập thiền" / "cho tớ đọc truyện trị liệu"
  // etc. opens the method directly in chat (no tab switch) — or, if it's a
  // JOY-locked method the user hasn't bought, offers a buy-now button right
  // here instead of just describing it (see `therapy_catalog` above for the
  // purely informational "what therapies exist" variant).
  const therapyMethod = matchTherapyMethod(cleanText);
  if (therapyMethod) {
    const unlocked = !therapyMethod.joyLockable || (bio?.unlockedCompanionFeatures || []).includes(therapyMethod.lockKey);
    if (unlocked) {
      return {
        reply: [`Mở ngay "${therapyMethod.name}" cho cậu nè 💙`],
        id: "therapy_open",
        tier: "free",
        quickActions: null,
        action: { type: "open_therapy", methodId: therapyMethod.id }
      };
    }
    return {
      reply: [
        `"${therapyMethod.name}" đang là tính năng cần mở khoá bằng JOY (${therapyMethod.cost} JOY) cậu ơi.`,
        "Cậu có muốn mở khoá luôn không? Tớ có nút mua nhanh ngay dưới đây."
      ],
      id: "therapy_locked",
      tier: "free",
      quickActions: [{ type: "unlock", methodId: therapyMethod.id, lockKey: therapyMethod.lockKey, cost: therapyMethod.cost, label: `Mở khoá (${therapyMethod.cost} JOY)` }]
    };
  }

  // "đánh giá hiện tại của tớ thế nào", "chỉ số tâm lý của tớ" — answered as
  // a chat message straight from historyLogs (numeric, no LLM call needed),
  // same data source as the "+" quick action and the (desktop-only) Evaluation tab.
  if (/(danh gia hien tai|chi so hien tai|chi so tam ly|ket qua test gan nhat|tinh trang hien tai cua toi|tinh trang tam ly cua toi)/.test(cleanText)) {
    return { reply: buildMetricsSummary(historyLogs), id: "metrics_report", tier: "free", quickActions: null };
  }

  const rules = [
    { id: "panic_attack", regex: /(kho tho|ngop tho|tim dap nhanh|hoang loan|run ray|sap ngat|panic)/ },
    { id: "checkin_feature", regex: /(check.?in la gi|diem danh cam xuc|streak la gi|tai sao phai check)/ },
    { id: "venting_space", regex: /(khong gian trut gian|trut bau tam su|tin nhan tu huy|che do trut gian)/ },
    { id: "loneliness", regex: /(co don|lac long|khong ai hieu|khong ai ben canh|bi bo roi)/ },
    { id: "family_conflict", regex: /(cai nhau voi bo me|gia dinh khong hieu|bo me ap dat|mau thuan voi gia dinh|bo me la mang)/ },
    { id: "friendship_conflict", regex: /(ban be xa lanh|bi bat nat|bi co lap|noi xau to|tay chay|bi bully)/ },
    { id: "breakup", regex: /(chia tay|that tinh|nguoi yeu bo|tinh cam tan vo)/ },
    { id: "low_self_esteem", regex: /(vo dung|tu ti|kem coi|khong tin vao ban than|ghet ban than|cam thay that bai)/ },
    { id: "procrastination", regex: /(tri hoan|luoi hoc|mat dong luc|khong co dong luc|chan deadline)/ },
    { id: "anger", regex: /(tuc gian|buc boi|nong gian|am uc|kho chiu trong nguoi|gian dien len)/ },
    { id: "grief", regex: /(mat nguoi than|qua doi|de tang|dau buon vi mat mat)/ },
    { id: "future_anxiety", regex: /(hoang mang ve tuong lai|chon nganh|dinh huong nghe nghiep|khong biet minh muon gi|so chon sai nganh)/ },
    { id: "room_organization", regex: /(bo tri phong|sap xep phong|trang tri goc hoc tap|phong bua|don phong|sap xep phong ngu)/ },
    { id: "mindful_spending", regex: /(mua do toi thich|nen mua cay|tu thuong cho minh|mua sam de giai toa|mua sam linh tinh|tieu xai qua da)/ },
    { id: "test_inventory", regex: /(bao nhieu bai test|nhung bai test|danh sach bai test|may bai trac nghiem|cac bai kiem tra tam ly|test tam ly gom|bao nhieu bai trac nghiem|test gi|cac bai test|co test gi)/ },
    { id: "clinical_tests", regex: /(lam bai test|lam trac nghiem|lam trac nghiem tam ly|lam test tram cam|lam test lo au|phq9|gad7|who5|bigfive|mmpi|kiem tra tram cam|kiem tra lo au|kiem tra suc khoe tinh thuan)/ },
    { id: "therapy_catalog", regex: /(co lieu phap gi|tri lieu gom|cac lieu phap tu chua lanh|huong dan dung lieu phap|nen dung lieu phap nao|bai tap tu chua lanh|phuong phap tri lieu|cac bai tri lieu)/ },
    { id: "pricing_package", regex: /(gia bao nhieu|goi cuoc|mua goi|nap tien|ton phi|mat phi|goi premium|dang ky goi|phi dich vu)/ },
    { id: "joy_currency", regex: /(joy la gi|kiem joy|dong joy|tien joy|xu joy|doi qua joy|dung joy|joy coin)/ },
    { id: "token_limit", regex: /(gioi han token|het token|may token|reset token|luot chat|token la gi|token chat)/ },
    { id: "about_creator", regex: /(ai tao ra|hugo studio|ai phat trien|ai lam ra app|tac gia|creator)/ },
    { id: "data_privacy", regex: /(dự liệu của tớ có an toàn không|dữ liệu|bao mat|lo tin nhan|an toan du lieu|co ai doc duoc|co bi lo khong|rieng tu)/ },
    { id: "support_contact", regex: /(bao loi|lien he ho tro|loi ky thuat|gap loi|tro giup|support|nhan vien ho tro)/ },
    { id: "identity", regex: /(cau la ai|ban la ai|ten cau|chuyen vien ai|ten gi|la bot|la ai)/ },
    { id: "features", regex: /(lam duoc gi|tinh nang|chuc nang|giup gi|huong dan|dung app|features|co the giup)/ },
    { id: "sleep", regex: /(mat ngu|kho ngu|ngu ngon|thuc khuya|thieu ngu)/ },
    { id: "academic_stress", regex: /(ap luc hoc|thi cu|diem so|thi rot|stress hoc|stress thi|bai tap qua tai)/ },
    { id: "anxiety", regex: /(lo au|lo lang|bon chon|so hai|hoang so|anxiety|lo so)/ },
    { id: "sadness", regex: /(buon|chan nan|tuyet vong|met moi|khoc|sad)/ },
    { id: "gratitude", regex: /(cam on|thank|cute|de thuong|huu ich|tot qua)/ },
    { id: "positive", regex: /(vui|khoe|hanh phuc|tuyet voi|rat tot|on|happy)/ }
  ];

  for (const rule of rules) {
    if (rule.regex.test(cleanText)) {
      const intentObj = INTENT_DATABASE.find(i => i.id === rule.id);
      if (intentObj) {
        bestMatch = intentObj;
        highestScore = 0.95;
        break;
      }
    }
  }

  if (!bestMatch) {
    for (const intent of INTENT_DATABASE) {
      for (const pattern of intent.patterns) {
        const score = getSimilarityScore(text, pattern);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = intent;
        }
      }
    }
  }

  // If match similarity is >= 80% (0.8)
  if (highestScore >= 0.8 && bestMatch) {
    const replyText = bestMatch.generateResponse(bio, historyLogs);
    
    // Automatically harvest and log user emotional status based on the matched intent
    let companionUpdate = null;
    if (bestMatch.id === "sadness") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Sadness" } };
    } else if (bestMatch.id === "anxiety") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Anxiety" } };
    } else if (bestMatch.id === "academic_stress") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Academic Stress" } };
    } else if (bestMatch.id === "positive") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 4, note: "Local intent: Positive" } };
    }

    return {
      reply: replyText,
      id: bestMatch.id,
      tier: bestMatch.tier || "paid",
      suggestPhq9: bestMatch.suggestPhq9 || false,
      suggestGad7: bestMatch.suggestGad7 || false,
      quickActions: bestMatch.quickActions || null,
      companionUpdate
    };
  }

  return null;
}
