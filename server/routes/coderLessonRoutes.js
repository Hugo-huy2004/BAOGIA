import express from "express";
import rateLimit from "express-rate-limit";
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

const SUMMARY_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "lang",
  "file",
  "practiceType",
  "reward",
  "duration",
  "level",
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

export default router;
