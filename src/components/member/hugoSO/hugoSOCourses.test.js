import { describe, expect, it } from "vitest";
import {
  HUGOSO_ALL_STEPS,
  HUGOSO_CONTENT_AUDIT,
  HUGOSO_COURSES,
  HUGOSO_COURSE_ORDER,
} from "./hugoSOCourses";

describe("HugoSO curriculum alignment", () => {
  it("keeps every lesson aligned across video, guide, practice and quiz", () => {
    expect(HUGOSO_CONTENT_AUDIT.percent).toBe(100);
    expect(HUGOSO_CONTENT_AUDIT.passed).toBe(HUGOSO_CONTENT_AUDIT.total);

    HUGOSO_ALL_STEPS.forEach((lesson) => {
      expect(lesson.video.scenes).toHaveLength(lesson.guide.length);
      expect(lesson.practice.checklist).toHaveLength(lesson.guide.length);
      expect(lesson.quiz.guideHeading).toBe(lesson.guide[lesson.quiz.guideIndex].heading);
      expect(lesson.deliverable).toBe(lesson.practice.prompt);
    });
  });

  it("uses unique lesson IDs and official HTTPS learning sources", () => {
    const ids = HUGOSO_ALL_STEPS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    HUGOSO_ALL_STEPS.forEach((lesson) => {
      expect(lesson.sourceUrl).toMatch(/^https:\/\/support\.google\.com\//);
    });
  });

  it("keeps all four office courses in the published order", () => {
    expect(HUGOSO_COURSE_ORDER).toEqual(["calendar", "docs", "sheets", "gemini"]);
    HUGOSO_COURSE_ORDER.forEach((courseId) => {
      expect(HUGOSO_COURSES[courseId].steps.length).toBeGreaterThanOrEqual(8);
    });
  });
});
