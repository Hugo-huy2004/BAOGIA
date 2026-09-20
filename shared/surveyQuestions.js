/**
 * Khảo sát định kỳ — bộ câu hỏi và luật chọn câu.
 * ============================================================================
 *
 * Mỗi tháng một lần, hệ thống hỏi vài câu ba lựa chọn: CÓ / KHÔNG / KHÔNG CHẮC.
 * Ba lựa chọn (thay vì thang 1–5) là có chủ ý: thang điểm buộc người trả lời
 * quy đổi cảm nhận thành con số, còn ba nút thì trả lời được trong một giây và
 * cộng lại vẫn ra tỷ lệ đọc được.
 *
 * ── HAI LUẬT BẤT BIẾN ───────────────────────────────────────────────────────
 *
 *   1. KHÔNG LẶP TRONG MỘT NĂM. Một `questionId` đã hỏi thì 365 ngày sau mới
 *      được hỏi lại. Hết câu thì HỎI ÍT ĐI, không bao giờ lặp — lặp lại là cách
 *      nhanh nhất để người dùng thôi đọc và bấm bừa.
 *   2. KHÔNG HỎI THỨ CHƯA TỪNG DÙNG. Câu hỏi về một ứng dụng chỉ xuất hiện khi
 *      người đó đã mở ứng dụng ấy ít nhất `MIN_OPENS` lần và còn dùng gần đây.
 *      Hỏi "app X có đáp ứng nhu cầu không" với người chưa từng mở X thì câu
 *      trả lời vô nghĩa, và còn làm hỏng luôn số liệu của X.
 *
 * ── VÌ SAO TÁCH TEMPLATE × APP ──────────────────────────────────────────────
 * Bộ câu hỏi viết tay đủ dùng cho một năm sẽ rất dài và chết cứng. Ở đây mỗi
 * câu là một TEMPLATE ghép với một APP, nên `questionId = "<template>:<app>"`.
 * Người dùng 5 ứng dụng có 9×5 + 12 = 57 câu khác nhau — thừa cho 12 tháng.
 *
 * ── CHIỀU CỦA CÂU HỎI ───────────────────────────────────────────────────────
 * Vài câu hỏi theo chiều ÂM ("có thông báo quá nhiều không?"), ở đó "Có" là tin
 * xấu. `negative: true` đánh dấu chúng. Quên cờ này thì bảng báo cáo sẽ cộng
 * ngược và một ứng dụng bị chê sẽ hiện thành ứng dụng được khen.
 *
 * Chữ nghĩa để ở đây (không nằm trong bộ i18n của frontend) vì cả máy chủ lẫn
 * trình duyệt đều đọc: máy chủ chọn câu, trình duyệt vẽ câu.
 */

import { APP_REGISTRY, RETIRED_APP_IDS } from "./appRegistry.js";

/** Ba lựa chọn, đúng thứ tự hiển thị. */
export const SURVEY_ANSWERS = Object.freeze(["yes", "no", "unsure"]);

/** Số lần mở tối thiểu để coi là "đã trải nghiệm" một ứng dụng.
 *  Một lần mở rồi thoát ngay là tò mò, không phải trải nghiệm. */
export const MIN_OPENS = 3;

/** Bỏ qua ứng dụng đã lâu không đụng tới: hỏi về thứ dùng 8 tháng trước thì
 *  người ta trả lời theo trí nhớ mờ, và bản thân app có thể đã khác hẳn. */
export const RECENT_DAYS = 90;

/** Một `questionId` đã hỏi thì khoá lại bấy nhiêu ngày. */
export const NO_REPEAT_DAYS = 365;

/** Số câu mỗi đợt. Ít câu thì người ta trả lời thật; dài quá thì bấm cho xong. */
export const QUESTIONS_PER_ROUND = 3;

const answers = (yes, no, unsure) => ({ yes, no, unsure });

/** Nhãn ba nút — dùng chung cho mọi câu trừ khi template tự khai `labels`. */
export const DEFAULT_LABELS = Object.freeze({
  vi: answers("Có", "Không", "Không chắc"),
  en: answers("Yes", "No", "Not sure"),
  zh: answers("是", "否", "不确定"),
});

/**
 * Chữ của khung khảo sát. Để cạnh câu hỏi thay vì trong bộ i18n của frontend vì
 * chúng luôn đi cùng nhau: đổi giọng câu hỏi mà quên đổi nút bấm thì tấm khảo
 * sát nghe như hai người viết.
 */
export const SURVEY_UI = Object.freeze({
  vi: {
    title: "Đôi lời từ Quý thành viên",
    intro: "Ba câu hỏi ngắn, mỗi tháng một lần. Câu trả lời quyết định điều gì được cải thiện trước.",
    submit: "Gửi",
    skip: "Để sau",
    thanks: "Xin trân trọng cảm ơn Quý thành viên",
    thanksBody: "Ý kiến của Quý thành viên đã được ghi nhận.",
    progress: "Câu {{current}} trên {{total}}",
  },
  en: {
    title: "A word from you",
    intro: "Three short questions, once a month. Your answers decide what gets improved first.",
    submit: "Send",
    skip: "Later",
    thanks: "Thank you",
    thanksBody: "Your answers have been recorded.",
    progress: "Question {{current}} of {{total}}",
  },
  zh: {
    title: "恭听阁下高见",
    intro: "每月三道简短问题。阁下的回答将决定我们优先改进之处。",
    submit: "提交",
    skip: "稍后",
    thanks: "谨致谢忱",
    thanksBody: "阁下的意见已记录在案。",
    progress: "第 {{current}} 题，共 {{total}} 题",
  },
});

/** Chữ giao diện theo ngôn ngữ, rơi về tiếng Việt khi chưa có bản dịch. */
export const surveyUi = (language = "vi") => SURVEY_UI[language] || SURVEY_UI.vi;

/**
 * Câu hỏi về MỘT ứng dụng cụ thể. `{{app}}` được thay bằng tên ứng dụng theo
 * ngôn ngữ người đọc (trình duyệt tra `utilities.catalog.<id>.title`).
 */
export const APP_TEMPLATES = Object.freeze([
  {
    id: "fit.need", facet: "fit",
    vi: "{{app}} có làm được đúng việc Quý thành viên cần không?",
    en: "Does {{app}} do the thing you actually needed?",
    zh: "{{app}} 是否满足了阁下真正的需求？",
  },
  {
    id: "fit.again", facet: "fit",
    vi: "Quý thành viên có định dùng lại {{app}} trong tháng tới không?",
    en: "Will you use {{app}} again next month?",
    zh: "下个月阁下还会再用 {{app}} 吗？",
  },
  {
    id: "fit.recommend", facet: "fit",
    vi: "{{app}} có đáng để giới thiệu cho một người bạn không?",
    en: "Would you recommend {{app}} to a friend?",
    zh: "阁下会把 {{app}} 推荐给朋友吗？",
  },
  {
    id: "ui.clear", facet: "ui",
    vi: "Ngay lần đầu mở {{app}}, Quý thành viên có hiểu ngay phải làm gì không?",
    en: "The first time you opened {{app}}, did you know what to do?",
    zh: "初次打开 {{app}} 时，阁下清楚该做什么吗？",
  },
  {
    id: "ui.speed", facet: "ui",
    vi: "{{app}} có chạy đủ nhanh trên thiết bị Quý thành viên đang dùng không?",
    en: "Does {{app}} run fast enough on the device you use?",
    zh: "在阁下常用的设备上，{{app}} 运行是否足够流畅？",
  },
  {
    id: "ui.reach", facet: "ui",
    vi: "Chữ và nút trong {{app}} có đủ lớn để thao tác thoải mái không?",
    en: "Is the text and are the buttons in {{app}} comfortably large?",
    zh: "{{app}} 的文字和按钮是否够大、易于操作？",
  },
  {
    id: "feature.enough", facet: "feature",
    vi: "Những gì {{app}} đang có đã đủ cho nhu cầu của Quý thành viên chưa?",
    en: "Does {{app}} already have everything you need from it?",
    zh: "{{app}} 现有的功能是否已够阁下所需？",
  },
  {
    id: "feature.guess", facet: "feature", negative: true,
    vi: "Trong {{app}} có chỗ nào khiến Quý thành viên phải đoán cách dùng không?",
    en: "Is there anywhere in {{app}} where you had to guess how it works?",
    zh: "{{app}} 中是否有地方需要阁下猜测用法？",
  },
  {
    id: "feature.broken", facet: "feature", negative: true,
    vi: "Quý thành viên có gặp nút hay màn hình nào trong {{app}} không hoạt động không?",
    en: "Did you find any button or screen in {{app}} that did not work?",
    zh: "阁下在 {{app}} 中是否遇到过无法使用的按钮或页面？",
  },
]);

/** Câu hỏi về CẢ HỆ THỐNG — không thuộc ứng dụng nào, ai cũng trả lời được. */
export const SYSTEM_TEMPLATES = Object.freeze([
  {
    id: "joy.clear", facet: "joy",
    vi: "Khi JOY trong ví thay đổi, Quý thành viên có hiểu rõ vì sao không?",
    en: "When your JOY balance changes, do you understand why?",
    zh: "当阁下的 JOY 余额变动时，是否清楚原因？",
  },
  {
    id: "joy.fair", facet: "joy",
    vi: "Cách hệ thống cộng và trừ JOY có công bằng không?",
    en: "Is the way the system adds and deducts JOY fair?",
    zh: "系统增减 JOY 的方式是否公允？",
  },
  {
    id: "joy.enough", facet: "joy",
    vi: "Lượng JOY nhận được hằng tuần có đủ cho nhu cầu sử dụng không?",
    en: "Is the JOY you earn each week enough for how you use the system?",
    zh: "阁下每周获得的 JOY 是否够用？",
  },
  {
    id: "joy.price", facet: "joy",
    vi: "Giá các tính năng tính bằng JOY có hợp lý không?",
    en: "Are the JOY prices of features reasonable?",
    zh: "各项功能的 JOY 定价是否合理？",
  },
  {
    id: "joy.limit", facet: "joy", negative: true,
    vi: "Hạn mức chuyển JOY hiện nay có gây trở ngại cho Quý thành viên không?",
    en: "Do the current JOY transfer limits get in your way?",
    zh: "当前的 JOY 转赠上限是否给阁下造成不便？",
  },
  {
    id: "notify.useful", facet: "notify",
    vi: "Thông báo hệ thống gửi đến có hữu ích không?",
    en: "Are the notifications the system sends useful?",
    zh: "系统发送的通知是否有用？",
  },
  {
    id: "notify.many", facet: "notify", negative: true,
    vi: "Quý thành viên có thấy thông báo gửi đến quá nhiều không?",
    en: "Do you get more notifications than you want?",
    zh: "阁下是否觉得通知过多？",
  },
  {
    id: "notify.source", facet: "notify",
    vi: "Đọc một thông báo, Quý thành viên có biết ngay nó đến từ ứng dụng nào không?",
    en: "When you read a notification, is it clear which app it came from?",
    zh: "阅读通知时，阁下能否立即看出它来自哪个应用？",
  },
  {
    id: "os.find", facet: "os",
    vi: "Quý thành viên có dễ tìm thấy ứng dụng mình cần không?",
    en: "Is it easy to find the app you are looking for?",
    zh: "阁下是否容易找到所需的应用？",
  },
  {
    id: "os.consistent", facet: "os",
    vi: "Các ứng dụng có cảm giác thuộc về cùng một hệ thống không?",
    en: "Do the apps feel like parts of one system?",
    zh: "各应用之间是否给阁下同属一个系统的感觉？",
  },
  {
    id: "os.device", facet: "os",
    vi: "Hugo Studio có hiển thị tốt trên thiết bị Quý thành viên thường dùng không?",
    en: "Does Hugo Studio display well on the device you use most?",
    zh: "在阁下最常用的设备上，Hugo Studio 显示是否良好？",
  },
  {
    id: "support.reply", facet: "support",
    vi: "Khi cần hỗ trợ, Quý thành viên có nhận được phản hồi kịp thời không?",
    en: "When you needed support, did you get a timely reply?",
    zh: "阁下需要协助时，是否及时得到了回复？",
  },
]);

const TEMPLATE_BY_ID = new Map(
  [...APP_TEMPLATES, ...SYSTEM_TEMPLATES].map((tpl) => [tpl.id, tpl]),
);

/** `"fit.need:vocab"` → `{ template, appId }`. Khoá lạ trả về `null`. */
export function parseQuestionId(questionId) {
  if (!questionId) return null;
  const [templateId, appId = ""] = String(questionId).split(":");
  const template = TEMPLATE_BY_ID.get(templateId);
  return template ? { template, appId } : null;
}

export const questionId = (templateId, appId = "") =>
  (appId ? `${templateId}:${appId}` : templateId);

/**
 * Dựng câu hỏi thành chữ. `appName` do bên gọi tra (trình duyệt biết tên ứng
 * dụng theo ngôn ngữ đang dùng, máy chủ thì không cần biết).
 */
export function renderQuestion(questionIdOrParsed, language = "vi", appName = "") {
  const parsed = typeof questionIdOrParsed === "string"
    ? parseQuestionId(questionIdOrParsed)
    : questionIdOrParsed;
  if (!parsed) return null;
  const lang = DEFAULT_LABELS[language] ? language : "vi";
  const text = (parsed.template[lang] || parsed.template.vi).replace(/\{\{app\}\}/g, appName);
  return {
    id: questionId(parsed.template.id, parsed.appId),
    text,
    facet: parsed.template.facet,
    appId: parsed.appId,
    negative: Boolean(parsed.template.negative),
    labels: parsed.template.labels?.[lang] || DEFAULT_LABELS[lang],
  };
}


const LIVE_APP_IDS = new Set(
  APP_REGISTRY.map((a) => a.id).filter((id) => !RETIRED_APP_IDS.includes(id)),
);

/** Ứng dụng còn sống trong danh mục (chưa nghỉ hưu). */
export const isLiveApp = (appId) => LIVE_APP_IDS.has(appId);

/**
 * Lọc ra những ứng dụng một người THẬT SỰ đã trải nghiệm — hàm thuần, không
 * chạm database, nên bộ kiểm chạy được một mình.
 *
 * Ba tầng lọc, mỗi tầng chặn một kiểu câu hỏi vô lý:
 *   · đủ `MIN_OPENS` ngày dùng   → không hỏi người mới liếc qua một cái
 *   · còn dùng trong `RECENT_DAYS` → không hỏi về thứ họ đã quên từ lâu
 *   · còn sống trong danh mục     → không hỏi về ứng dụng đã bị gỡ
 *
 * @param {Record<string, number>} opens        appId → số ngày đã dùng
 * @param {Record<string, Date|string>} lastAt  appId → lần dùng gần nhất
 */
export function eligibleApps(opens = {}, lastAt = {}, now = new Date()) {
  const cutoff = now.getTime() - RECENT_DAYS * 86400000;
  return Object.keys(opens || {})
    .filter((appId) => LIVE_APP_IDS.has(appId))
    .filter((appId) => Number(opens[appId] || 0) >= MIN_OPENS)
    .filter((appId) => {
      const at = lastAt?.[appId];
      if (!at) return false;            // không biết dùng khi nào → không hỏi
      const time = at instanceof Date ? at.getTime() : new Date(at).getTime();
      return Number.isFinite(time) && time >= cutoff;
    })
    .sort();                            // ổn định, để hạt giống cho ra cùng kết quả
}

/** Sinh số giả ngẫu nhiên CÓ HẠT GIỐNG: cùng người + cùng tháng thì cùng bộ câu,
 *  nên tải lại trang không đổi đề. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hạt giống ổn định từ một chuỗi bất kỳ (email + khoá tháng). */
export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text).length; i += 1) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const shuffled = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Chọn câu cho một đợt khảo sát.
 *
 * @param {string[]} usedApps  Id ứng dụng người này THẬT SỰ đã dùng (bên gọi đã
 *                             lọc theo MIN_OPENS và RECENT_DAYS).
 * @param {string[]} askedIds  `questionId` đã hỏi trong 365 ngày qua.
 * @param {number}   limit     Số câu tối đa.
 * @param {string}   seed      Chuỗi hạt giống, thường là `email + khoá tháng`.
 * @returns {Array<{id,templateId,appId,facet,negative}>} — CÓ THỂ ÍT HƠN `limit`,
 *          và có thể rỗng khi đã hỏi hết. Rỗng nghĩa là "tháng này không hỏi gì",
 *          không phải lỗi.
 */
export function buildSurvey({ usedApps = [], askedIds = [], limit = QUESTIONS_PER_ROUND, seed = "" } = {}) {
  const asked = new Set(askedIds);
  const rand = mulberry32(seedFrom(seed));

  const pool = (templates, appId) => templates
    .map((tpl) => ({
      id: questionId(tpl.id, appId),
      templateId: tpl.id,
      appId,
      facet: tpl.facet,
      negative: Boolean(tpl.negative),
    }))
    .filter((q) => !asked.has(q.id));

  const systemPool = shuffled(pool(SYSTEM_TEMPLATES, ""), rand);
  const appPool = shuffled(
    shuffled([...usedApps], rand).flatMap((appId) => pool(APP_TEMPLATES, appId)),
    rand,
  );

  // Mỗi đợt cố gắng có đúng MỘT câu về cả hệ thống: hỏi toàn câu về app thì
  // không bao giờ biết người ta nghĩ gì về nền tảng, mà hỏi toàn câu hệ thống
  // thì không app nào có đủ số liệu.
  const picked = [];
  const take = (list) => { const q = list.shift(); if (q) picked.push(q); };

  take(systemPool);
  while (picked.length < limit && (appPool.length || systemPool.length)) {
    take(appPool.length ? appPool : systemPool);
  }

  // Không hai câu cùng một khía cạnh trong một đợt — ba câu đều về tốc độ thì
  // đợt đó chỉ đo được một thứ.
  const seenFacet = new Set();
  const varied = picked.filter((q) => {
    const key = `${q.facet}:${q.appId}`;
    if (seenFacet.has(key)) return false;
    seenFacet.add(key);
    return true;
  });

  return varied.slice(0, limit);
}

/**
 * Một câu trả lời có phải tín hiệu TỐT không, đã tính chiều của câu hỏi.
 * Trả `null` cho "không chắc" — đó là dữ liệu thật, không phải nửa điểm.
 */
export function isPositive(answer, negative = false) {
  if (answer !== "yes" && answer !== "no") return null;
  return negative ? answer === "no" : answer === "yes";
}

/** Tổng hợp một mớ câu trả lời thành điểm 0–100 (bỏ qua "không chắc"). */
export function scoreOf(rows = []) {
  let good = 0;
  let counted = 0;
  for (const row of rows) {
    const verdict = isPositive(row.answer, row.negative);
    if (verdict === null) continue;
    counted += 1;
    if (verdict) good += 1;
  }
  return {
    counted,
    unsure: rows.length - counted,
    score: counted ? Math.round((good / counted) * 100) : null,
  };
}

export default { buildSurvey, eligibleApps, renderQuestion, parseQuestionId, scoreOf, isPositive };
