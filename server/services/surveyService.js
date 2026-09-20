import UserProfile from '../models/UserProfile.js';
import SurveyResponse from '../models/SurveyResponse.js';
import {
  buildSurvey, eligibleApps, isLiveApp, scoreOf,
  NO_REPEAT_DAYS, QUESTIONS_PER_ROUND,
} from '../../shared/surveyQuestions.js';

/**
 * Khảo sát định kỳ — mỗi tháng một đợt, ba lựa chọn Có / Không / Không chắc.
 *
 * Câu hỏi CHỌN Ở MÁY CHỦ chứ không ở trình duyệt, vì hai luật quan trọng nhất
 * chỉ máy chủ kiểm được: "đã hỏi câu này chưa" cần lịch sử của cả năm, và "đã
 * dùng ứng dụng này chưa" cần nhật ký dùng không sửa được từ máy khách. Để
 * trình duyệt tự chọn thì ai cũng bỏ qua được cả hai.
 *
 * Máy chủ chỉ trả về KHOÁ câu hỏi; chữ nghĩa do trình duyệt dựng theo ngôn ngữ
 * người đọc (shared/surveyQuestions.js). Cách này giống hệt thông báo: dữ liệu
 * lưu khoá, ngôn ngữ quyết định lúc hiển thị.
 */

/** Khoá tháng "2026-09". Một người một đợt một tháng. */
export const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

const mapToObject = (value) => {
  if (!value) return {};
  return value instanceof Map ? Object.fromEntries(value) : { ...value };
};

/** Ghi nhận một lượt mở ứng dụng. Gọi nhiều lần trong ngày cũng chỉ đếm một. */
export async function trackOpen(email, appId, now = new Date()) {
  if (!email || !isLiveApp(appId)) return false;

  const profile = await UserProfile.findOne({ email }, 'appUseAt').lean();
  const last = profile?.appUseAt ? mapToObject(profile.appUseAt)[appId] : null;
  // Đếm theo NGÀY, không theo lượt mở: người mở đi mở lại một app trong một
  // buổi không "trải nghiệm" nhiều hơn người dùng nó ba ngày liền.
  if (last && new Date(last).toISOString().slice(0, 10) === now.toISOString().slice(0, 10)) {
    return false;
  }

  await UserProfile.updateOne(
    { email },
    { $inc: { [`appUse.${appId}`]: 1 }, $set: { [`appUseAt.${appId}`]: now, lastSignalAt: now } },
    { upsert: true },
  );
  return true;
}

/**
 * Đợt khảo sát tháng này, hoặc `null` khi không có gì để hỏi.
 *
 * Trả `null` là trạng thái BÌNH THƯỜNG, không phải lỗi: đã trả lời tháng này
 * rồi, hoặc đã hỏi hết bộ câu. Thà im lặng còn hơn hỏi lại câu cũ.
 */
export async function dueSurvey(email, now = new Date()) {
  const month = monthKey(now);

  const answeredThisMonth = await SurveyResponse.countDocuments({ email, month });
  if (answeredThisMonth > 0) return null;

  const since = new Date(now.getTime() - NO_REPEAT_DAYS * 86400000);
  const [profile, history] = await Promise.all([
    UserProfile.findOne({ email }, 'appUse appUseAt').lean(),
    SurveyResponse.find({ email, askedAt: { $gte: since } }, 'questionId').lean(),
  ]);

  const questions = buildSurvey({
    usedApps: eligibleApps(mapToObject(profile?.appUse), mapToObject(profile?.appUseAt), now),
    askedIds: history.map((r) => r.questionId),
    limit: QUESTIONS_PER_ROUND,
    seed: `${email}${month}`,
  });

  return questions.length ? { month, questions } : null;
}

/**
 * Ghi câu trả lời. Chỉ nhận câu thuộc đúng đợt của tháng này — nếu không, một
 * máy khách có thể tự gửi lên câu nó thích và làm lệch số liệu của cả app.
 */
export async function saveAnswers(email, month, answers = [], now = new Date()) {
  if (month !== monthKey(now)) throw new Error('MONTH_MISMATCH');

  const due = await dueSurvey(email, now);
  if (!due) throw new Error('NO_SURVEY_DUE');
  const allowed = new Map(due.questions.map((q) => [q.id, q]));

  const rows = [];
  for (const item of answers) {
    const question = allowed.get(item?.questionId);
    if (!question) continue;                                   // không phải đề của người này
    if (!['yes', 'no', 'unsure'].includes(item?.answer)) continue;
    rows.push({
      email, month,
      questionId: question.id,
      templateId: question.templateId,
      appId: question.appId || '',
      facet: question.facet,
      negative: question.negative,
      answer: item.answer,
      askedAt: now,
    });
  }
  if (!rows.length) throw new Error('NO_VALID_ANSWERS');

  // `ordered: false` để một dòng trùng không chặn những dòng còn lại — người
  // bấm gửi hai lần vẫn ghi được phần chưa có.
  await SurveyResponse.insertMany(rows, { ordered: false }).catch((err) => {
    if (err?.code !== 11000) throw err;
  });
  return rows.length;
}

/**
 * Bảng điểm theo ứng dụng và theo khía cạnh — để biết app nào đáp ứng nhu cầu,
 * app nào UI/UX có vấn đề.
 *
 * Điểm `null` nghĩa là CHƯA ĐỦ DỮ LIỆU, không phải điểm 0. Phân biệt hai thứ
 * này quan trọng: một app mới chưa ai đánh giá không được hiện như app bị chê.
 */
export async function report({ months = 12, minSample = 3 } = {}) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const rows = await SurveyResponse.find({ askedAt: { $gte: since } },
    'appId facet answer negative').lean();

  const group = (keyOf) => {
    const buckets = new Map();
    for (const row of rows) {
      const key = keyOf(row);
      if (key === null) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(row);
    }
    return [...buckets.entries()]
      .map(([key, list]) => ({ key, ...scoreOf(list), enough: list.length >= minSample }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  };

  return {
    months, minSample,
    responses: rows.length,
    byApp: group((r) => r.appId || null),
    byFacet: group((r) => r.facet),
    // Câu hỏi âm bị trả lời "Có" nhiều nhất = chỗ đau nhất, xếp lên đầu.
    pain: group((r) => (r.negative ? `${r.facet}${r.appId ? `:${r.appId}` : ''}` : null))
      .filter((x) => x.enough).sort((a, b) => (a.score ?? 101) - (b.score ?? 101)).slice(0, 5),
  };
}

export default { dueSurvey, saveAnswers, trackOpen, report, monthKey };
