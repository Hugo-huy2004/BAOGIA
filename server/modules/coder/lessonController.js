/**
 * lessonController.js
 * Controller tập trung toàn bộ logic nghiệp vụ bài giảng, chấm bài tập và ghi nhận phản hồi bài học HugoCoder.
 */
import LessonFeedback from '../../models/LessonFeedback.js';
import { sendTelegramAlert } from '../../services/telegramService.js';
import {
  MOBILE_GUIDE_EXTRAS,
  STAGES,
  WEB_COURSES,
  getStageBenefits,
} from '../../../src/components/member/hugoCoder/lessons/index.js';

export const SUMMARY_FIELDS = [
  'id',
  'title',
  'lang',
  'file',
  'practiceType',
  'duration',
];

export function lessonSummary(course) {
  return Object.fromEntries(
    SUMMARY_FIELDS.filter((key) => course[key] !== undefined).map((key) => [key, course[key]])
  );
}

export function publicCourse(course) {
  if (!course) return null;
  return {
    ...course,
    mobileExtra: MOBILE_GUIDE_EXTRAS[course.id] || {},
  };
}

/**
 * Lấy danh sách các bài học (phân trang + lọc theo chặng stage)
 */
export async function getLessonList(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 25));
  const stageId = String(req.query.stage || '').trim();
  const stage = STAGES.find((item) => item.id === stageId);
  const source = stage ? WEB_COURSES.slice(stage.from, stage.to) : WEB_COURSES;
  const start = (page - 1) * limit;
  const items = source.slice(start, start + limit).map(lessonSummary);

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return res.json({
    items,
    stages:
      page === 1
        ? STAGES.map((item) => ({
            ...item,
            benefits: getStageBenefits(item.id),
          }))
        : undefined,
    pagination: {
      page,
      limit,
      total: source.length,
      pages: Math.ceil(source.length / limit),
      hasNextPage: start + items.length < source.length,
    },
  });
}

/**
 * Lấy chi tiết bài học
 */
export async function getLessonDetail(req, res) {
  const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
  if (!course) return res.status(404).json({ error: 'Lesson not found' });
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return res.json({ lesson: publicCourse(course) });
}

/**
 * Chấm mã thực hành của học viên (Server-side verify)
 */
export async function verifyLessonCode(req, res) {
  const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
  if (!course) return res.status(404).json({ error: 'Lesson not found' });
  const code = typeof req.body?.code === 'string' ? req.body.code.slice(0, 200_000) : '';
  try {
    const passed = typeof course.verify === 'function' ? Boolean(course.verify(code)) : true;
    return res.json({ passed });
  } catch {
    return res.json({ passed: false });
  }
}

/**
 * Gửi phản hồi / góp ý của bài học (Lưu DB + bắn Telegram alert)
 */
export async function submitLessonFeedback(req, res) {
  try {
    const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
    if (!course) return res.status(404).json({ error: 'Không tìm thấy bài học.' });

    const message = String(req.body?.message || '').trim();
    if (message.length < 5) {
      return res.status(400).json({ error: 'Hãy mô tả rõ hơn một chút.' });
    }

    const stepIndex = Number(req.body?.stepIndex);
    const record = await LessonFeedback.create({
      memberEmail: req.memberEmail,
      lessonId: course.id,
      stepIndex: Number.isInteger(stepIndex) && stepIndex >= 0 ? stepIndex : 0,
      stepKind: String(req.body?.stepKind || '').slice(0, 20),
      message: message.slice(0, 2000),
    });

    const escape = (value) =>
      String(value).replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch]));
    sendTelegramAlert(
      `<b>Góp ý bài học</b>\n` +
        `${escape(course.title)}\n` +
        `Bước ${record.stepIndex + 1}${record.stepKind ? ` · ${escape(record.stepKind)}` : ''}\n` +
        `Người học: ${escape(req.memberEmail)}\n\n` +
        escape(message)
    ).catch((error) => console.error('[lesson feedback telegram]', error.message));

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Lesson feedback error:', error);
    return res.status(500).json({ error: 'Chưa gửi được góp ý. Vui lòng thử lại.' });
  }
}
