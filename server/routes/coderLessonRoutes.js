import express from "express";
import rateLimit from "express-rate-limit";
import LessonFeedback from "../models/LessonFeedback.js";
import { requireMember } from "../middleware/authMiddleware.js";
import { sendTelegramAlert } from "../services/telegramService.js";
import {
  MOBILE_GUIDE_EXTRAS,
  STAGES,
  WEB_COURSES,
  getStageBenefits,
} from "../../src/components/member/hugoCoder/lessons/index.js";

const router = express.Router();
const verifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

// Góp ý siết chặt hơn nhiều so với chấm bài: nó bắn thẳng sang Telegram của
// người vận hành, nên đây vừa là chống spam vừa là chống quấy rối.
const feedbackLimiter = rateLimit({
  windowMs: 10 * 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Phải khớp với trường CÓ THẬT trên bài học (xem lessons/*.js và bài test
// server/tests/coderLessons.test.js). Danh sách cũ khai `subtitle`,
// `description`, `reward`, `level` — không bài nào có, nên endpoint danh sách
// lặng lẽ trả về ít hơn 4 trường so với hợp đồng nó tự công bố.
const SUMMARY_FIELDS = [
  "id",
  "title",
  "lang",
  "file",
  "practiceType",
  "duration",
];

function lessonSummary(course) {
  return Object.fromEntries(
    SUMMARY_FIELDS
      .filter((key) => course[key] !== undefined)
      .map((key) => [key, course[key]]),
  );
}

function publicCourse(course) {
  if (!course) return null;
  // JSON serialization intentionally drops executable `verify` functions.
  // Verification remains server-side through POST /:lessonId/verify.
  return {
    ...course,
    mobileExtra: MOBILE_GUIDE_EXTRAS[course.id] || {},
  };
}

router.get("/", (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(5, Number.parseInt(req.query.limit, 10) || 25));
  const stageId = String(req.query.stage || "").trim();
  const stage = STAGES.find((item) => item.id === stageId);
  const source = stage ? WEB_COURSES.slice(stage.from, stage.to) : WEB_COURSES;
  const start = (page - 1) * limit;
  const items = source.slice(start, start + limit).map(lessonSummary);

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.json({
    items,
    stages: page === 1
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
});

router.get("/:lessonId", (req, res) => {
  const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
  if (!course) return res.status(404).json({ error: "Lesson not found" });
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return res.json({ lesson: publicCourse(course) });
});

router.post("/:lessonId/verify", verifyLimiter, (req, res) => {
  const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
  if (!course) return res.status(404).json({ error: "Lesson not found" });
  const code = typeof req.body?.code === "string" ? req.body.code.slice(0, 200_000) : "";
  try {
    const passed = typeof course.verify === "function" ? Boolean(course.verify(code)) : true;
    return res.json({ passed });
  } catch {
    return res.json({ passed: false });
  }
});

/**
 * POST /api/coder-lessons/:lessonId/feedback  { stepIndex, stepKind, message }
 *
 * Góp ý của học viên về đúng bước họ đang vấp. Lưu vào kho rồi bắn sang Telegram
 * — tin nhắn để biết ngay, bản ghi để về sau còn đếm được bước nào bị góp ý
 * nhiều nhất.
 *
 * Danh tính lấy từ JWT, không nhận email trong body: góp ý mà mạo danh người
 * khác thì vừa vô nghĩa vừa là một đường quấy rối.
 */
router.post("/:lessonId/feedback", feedbackLimiter, requireMember, async (req, res) => {
  try {
    const course = WEB_COURSES.find((item) => item.id === req.params.lessonId);
    if (!course) return res.status(404).json({ error: "Không tìm thấy bài học." });

    const message = String(req.body?.message || "").trim();
    if (message.length < 5) {
      return res.status(400).json({ error: "Hãy mô tả rõ hơn một chút." });
    }

    const stepIndex = Number(req.body?.stepIndex);
    const record = await LessonFeedback.create({
      memberEmail: req.memberEmail,
      lessonId: course.id,
      stepIndex: Number.isInteger(stepIndex) && stepIndex >= 0 ? stepIndex : 0,
      stepKind: String(req.body?.stepKind || "").slice(0, 20),
      message: message.slice(0, 2000),
    });

    // Telegram hỏng thì góp ý vẫn phải được lưu — người học đã bấm gửi rồi.
    const escape = (value) => String(value).replace(/[<>&]/g, (ch) => (
      { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch]
    ));
    sendTelegramAlert(
      `<b>Góp ý bài học</b>\n`
      + `${escape(course.title)}\n`
      + `Bước ${record.stepIndex + 1}${record.stepKind ? ` · ${escape(record.stepKind)}` : ""}\n`
      + `Người học: ${escape(req.memberEmail)}\n\n`
      + escape(message),
    ).catch((error) => console.error("[lesson feedback telegram]", error.message));

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Lesson feedback error:", error);
    res.status(500).json({ error: "Chưa gửi được góp ý. Vui lòng thử lại." });
  }
});

// POST /api/coder-lessons/ai-mentor-debug  { code, question, lang }
// Trợ lý AI Coder Mentor hỗ trợ giải thích code, tìm lỗi nổ và tư vấn tối ưu 1:1.
router.post("/ai-mentor-debug", verifyLimiter, async (req, res) => {
  try {
    const { code, question, lang = "javascript" } = req.body || {};
    if (!code && !question) {
      return res.status(400).json({ error: "Vui lòng cung cấp mã nguồn hoặc câu hỏi để AI Mentor hỗ trợ." });
    }

    const { generateRaw } = await import("../services/aiGateway.js");
    const prompt = `
Bạn là AI Coder Mentor 1:1 của Hugo Studio (chuyên gia tư vấn Lập trình Web & Software Engineering).
Thành viên đang học bài học thuộc ngôn ngữ/công nghệ [${lang}].

Mã nguồn hiện tại:
\`\`\`${lang}
${(code || "").slice(0, 10000)}
\`\`\`

Câu hỏi / Vấn đề của thành viên:
"${question || "Hãy giải thích đoạn code này và chỉ ra các điểm có thể tối ưu hiệu năng hoặc sửa lỗi."}"

Hãy trả lời chuyên nghiệp, dễ hiểu, theo phong cách Socratic Mentor (gợi mở và giải thích rõ ràng từng dòng lệnh chính), chèn mã sửa (nếu có) và mẹo tối ưu bằng Tiếng Việt.
`;

    let advice = await generateRaw(prompt).catch(() => null);
    if (!advice) {
      advice = "AI Mentor gợi ý: Hãy kiểm tra kỹ cú pháp, kiểu dữ liệu trả về và đảm bảo không bỏ sót các trường bắt buộc theo yêu cầu bài học.";
    }

    res.json({ success: true, advice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
