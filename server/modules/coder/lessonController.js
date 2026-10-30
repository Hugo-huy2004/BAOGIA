/**
 * lessonController.js
 * Controller tập trung toàn bộ logic nghiệp vụ bài giảng, chấm bài tập và ghi nhận phản hồi bài học HugoCoder.
 */
import { signedSessionRole } from '../../auth/betterAuth.js';
import LessonFeedback from '../../models/LessonFeedback.js';
import Bio from '../../models/Bio.js';
import HugoTeamDev from '../../models/HugoTeamDev.js';
import { HUGOTEAM_CODING_DAYS } from '../../../shared/coderProgression.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { canReadCoderStage } from '../../utils/appPlanService.js';
import { gradeStepQuiz, PASS_PERCENT } from '../../utils/coderExamService.js';
import { PUBLIC_TOOLS } from '../../../src/config/publicTools.js';
import { sendTelegramAlert } from '../../services/telegramService.js';
import {
  STAGES,
  WEB_COURSES,
  getStageBenefits,
} from '../../../src/components/member/hugoCoder/lessons/index.js';
import { publicQuiz } from '../../../shared/stepQuiz.js';

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
  // Mười bài học thử (cùng con số trang /study dùng) công khai, cache ở CDN được.
  if (index < PUBLIC_TOOLS.study.previewLessons) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return res.json({ lesson: publicCourse(course) });
  }

  // Bài trả phí: không bao giờ vào cache dùng chung, kể cả phản hồi lỗi.
  res.setHeader('Cache-Control', 'private, no-store');
  if (!req.headers.authorization && !signedSessionRole(req)) {
    return res.status(401).json({ code: 'LOGIN_REQUIRED', error: 'Đăng nhập để học bài này.' });
  }
  return requireMember(req, res, async () => {
    try {
      // HugoTeam học CHÍNH chương trình Coding (đủ mọi step): thành viên đang ở
      // giai đoạn Coding còn hạn được đọc mọi bài, mở từ HugoTeam hay từ Coding.
      const teamDev = await HugoTeamDev.findOne({ email: req.memberEmail, assessmentStage: 'coding' }).select('codingStartedAt').lean();
      const teamActive = Boolean(teamDev) && !(teamDev.codingStartedAt
        && Date.now() - new Date(teamDev.codingStartedAt).getTime() > HUGOTEAM_CODING_DAYS * 24 * 60 * 60 * 1000);
      if (req.query.program === 'hugoteam') {
        if (!teamActive) {
          return res.status(403).json({ code: 'HUGOTEAM_CODING_REQUIRED', error: 'Bạn không ở giai đoạn Coding của HugoTeam (hoặc đã quá hạn).' });
        }
        return res.json({ lesson: publicCourse(course) });
      }
      if (teamActive) return res.json({ lesson: publicCourse(course) });
      if (!req.isAdminActor) {
        const fields = 'hugoCoderAll7Lifetime hugoCoderBasicLifetime hugoCoderIntermediateLifetime hugoCoderAdvancedLifetime '
          + 'hugoCoderSecurityLifetime hugoCoderExamLifetime hugoCoderOptimizeLifetime hugoCoderUltimateLifetime '
          + 'hugoCoderDevopsLifetime featureSubscriptions appPlans';
        const email = req.memberEmail;
        const bio = await Bio.findOne({ email }).select(fields).lean()
          || await Bio.findOne({ contactEmail: email }).select(fields).lean();
        const stage = STAGES.find((item) => index >= item.from && index < item.to);
        if (!canReadCoderStage(bio, stage?.id)) {
          return res.status(403).json({
            code: 'COURSE_ACCESS_REQUIRED',
            error: 'Bài này thuộc phần trả phí. Mở khóa bộ Phát triển Web hoặc chặng chứa bài để học tiếp.',
            lessonId: course.id,
            stageId: stage?.id || null,
          });
        }
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
 * tiến độ. Step trả phí không chấm ở đây — lời giải trả về sau khi chấm chính là
 * đáp án, phát cho người chưa mua là phát nội dung trả phí.
 */
export async function gradePreviewQuiz(req, res) {
  const index = WEB_COURSES.findIndex((item) => item.id === req.params.lessonId);
  if (index < 0) return res.status(404).json({ error: 'Lesson not found' });
  if (index >= PUBLIC_TOOLS.study.previewLessons) {
    return res.status(403).json({ code: 'COURSE_ACCESS_REQUIRED', error: 'Step này cần đăng nhập và mở khóa.' });
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
