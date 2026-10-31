/**
 * lessonController.js
 * Controller tập trung toàn bộ logic nghiệp vụ bài giảng, chấm bài tập và ghi nhận phản hồi bài học HugoCoder.
 */
import { signedSessionRole } from '../../auth/betterAuth.js';
import LessonFeedback from '../../models/LessonFeedback.js';
import HugoTeamDev from '../../models/HugoTeamDev.js';
import { CODER_PREVIEW_STEPS, HUGOTEAM_CODING_DAYS } from '../../../../packages/shared/coderProgression.js';
import { requireMemberSession } from '../../middleware/authMiddleware.js';
import { gradeStepQuiz, PASS_PERCENT } from '../../utils/coderExamService.js';
import { sendTelegramAlert } from '../../services/telegramService.js';
import {
  STAGES,
  WEB_COURSES,
  getStageBenefits,
} from '../../../web/src/components/member/hugoCoder/lessons/index.js';
import { publicQuiz } from '../../../../packages/shared/stepQuiz.js';

export const SUMMARY_FIELDS = [
  'id',
  'title',
  'lang',
  'file',
  'practiceType',
  'duration',
  'stage',
  'draft',
];

function lessonSummary(course) {
  return Object.fromEntries(
    SUMMARY_FIELDS.filter((key) => course[key] !== undefined).map((key) => [key, course[key]])
  );
}

// Trắc nghiệm gửi xuống đã xáo và KHÔNG mang đáp án — máy chủ chấm ở award-learning.
function publicCourse(course) {
  if (!course) return null;
  return { ...course, quiz: publicQuiz(course.quiz) };
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

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
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
  const index = WEB_COURSES.findIndex((item) => item.id === req.params.lessonId);
  if (index < 0) return res.status(404).json({ error: 'Lesson not found' });
  const course = WEB_COURSES[index];
  // Chặng 1 học thử không cần tài khoản, cache ở CDN được.
  if (index < CODER_PREVIEW_STEPS) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return res.json({ lesson: publicCourse(course) });
  }

  // Khoá học MIỄN PHÍ (31/10/2026, Education Hugo): phần còn lại chỉ cần đăng
  // nhập — để lưu tiến độ và để không ai cào cả khoá bằng script ẩn danh.
  // requireMemberSession chứ không requireMember: người chỉ đến để học không
  // phải điền hồ sơ đầy đủ hay còn hạn dùng thử của Hugo Studio.
  res.setHeader('Cache-Control', 'private, no-store');
  if (!req.headers.authorization && !signedSessionRole(req)) {
    return res.status(401).json({ code: 'LOGIN_REQUIRED', error: 'Đăng nhập để học bài này.' });
  }
  return requireMemberSession(req, res, async () => {
    if (req.query.program !== 'hugoteam') return res.json({ lesson: publicCourse(course) });
    try {
      // Mở từ Hugo Team thì phải đang ở giai đoạn Coding còn hạn.
      const teamDev = await HugoTeamDev.findOne({ email: req.memberEmail, assessmentStage: 'coding' }).select('codingStartedAt').lean();
      const teamActive = Boolean(teamDev) && !(teamDev.codingStartedAt
        && Date.now() - new Date(teamDev.codingStartedAt).getTime() > HUGOTEAM_CODING_DAYS * 24 * 60 * 60 * 1000);
      if (!teamActive) {
        return res.status(403).json({ code: 'HUGOTEAM_CODING_REQUIRED', error: 'Bạn không ở giai đoạn Coding của HugoTeam (hoặc đã quá hạn).' });
      }
      return res.json({ lesson: publicCourse(course) });
    } catch (error) {
      console.error('[coder lesson access]', error.message);
      return res.status(503).json({ code: 'SERVICE_DEGRADED', error: 'Chưa kiểm được quyền truy cập. Vui lòng thử lại.' });
    }
  });
}

/**
 * Chấm trắc nghiệm cho khách học thử: chỉ step thuộc phần học thử, không ghi
 * tiến độ. Step sau chặng 1 không chấm ẩn danh ở đây: lời giải trả về sau khi
 * chấm chính là đáp án — người học đăng nhập nộp qua /api/joy/award-learning.
 */
export async function gradePreviewQuiz(req, res) {
  const index = WEB_COURSES.findIndex((item) => item.id === req.params.lessonId);
  if (index < 0) return res.status(404).json({ error: 'Lesson not found' });
  if (index >= CODER_PREVIEW_STEPS) {
    return res.status(403).json({ code: 'COURSE_ACCESS_REQUIRED', error: 'Step này cần đăng nhập.' });
  }
  const graded = gradeStepQuiz(WEB_COURSES[index].id, req.body?.answers);
  if (!graded) return res.status(409).json({ code: 'STEP_NOT_READY', error: 'Step này đang được soạn.' });
  return res.json({ ...graded, passPercent: PASS_PERCENT });
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
