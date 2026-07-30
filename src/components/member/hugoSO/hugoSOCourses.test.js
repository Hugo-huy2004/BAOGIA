import { describe, expect, it } from "vitest";
import {
  HUGOSO_BUNDLE,
  HUGOSO_COURSE_ORDER,
  HUGOSO_COURSES,
  HUGOSO_ALL_STEPS,
  getCourseProgress,
} from "./hugoSOCourses";

describe("HugoSO curriculum", () => {
  it("ships four courses with a 35-lesson basic-to-advanced path", () => {
    expect(HUGOSO_COURSE_ORDER).toEqual(["calendar", "docs", "sheets", "gemini"]);
    expect(HUGOSO_ALL_STEPS).toHaveLength(35);
    expect(
      HUGOSO_COURSE_ORDER.map((courseId) => HUGOSO_COURSES[courseId].steps.length),
    ).toEqual([9, 9, 8, 9]);

    for (const courseId of HUGOSO_COURSE_ORDER) {
      const course = HUGOSO_COURSES[courseId];
      expect(course.steps[0].free).toBe(true);
      expect(course.steps.slice(1).every((step) => !step.free)).toBe(true);
      expect(course.sourceUrl).toMatch(/^https:\/\/support\.google\.com\//);
      expect(new Set(course.steps.map((step) => step.stage))).toEqual(
        new Set(["Cơ bản", "Thực hành", "Nâng cao"]),
      );

      for (const step of course.steps) {
        expect(step.guide.length).toBeGreaterThanOrEqual(4);
        expect(step.learn.length).toBeGreaterThanOrEqual(3);
        expect(step.video.scenes.length).toBeGreaterThanOrEqual(3);
        expect(step.sourceUrl).toMatch(/^https:\/\/support\.google\.com\//);
        expect(step.availability.length).toBeGreaterThan(20);
        expect(step.quiz.options).toHaveLength(3);
        expect(step.quiz.correct).toBeGreaterThanOrEqual(0);
        expect(step.quiz.correct).toBeLessThan(step.quiz.options.length);
        expect(step.quiz.explanation.length).toBeGreaterThan(10);
        expect(step.practice.minimumKeywords).toBeGreaterThan(0);
        expect(step.practice.minimumKeywords).toBeLessThanOrEqual(
          step.practice.keywords.length,
        );
        expect(step.practice.checklist).toHaveLength(3);
      }
    }
  });

  it("uses unique course-scoped lesson ids", () => {
    const ids = HUGOSO_ALL_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^(calendar|docs|sheets|gemini)-/.test(id))).toBe(true);
  });

  it("keeps the bundle meaningfully cheaper than individual courses", () => {
    const individualTotal = HUGOSO_COURSE_ORDER.reduce(
      (sum, courseId) => sum + HUGOSO_COURSES[courseId].priceJoy,
      0,
    );
    expect(individualTotal).toBe(HUGOSO_BUNDLE.regularJoy);
    expect(HUGOSO_BUNDLE.priceJoy).toBeLessThan(individualTotal);
    expect(individualTotal - HUGOSO_BUNDLE.priceJoy).toBe(HUGOSO_BUNDLE.saving);
  });

  it("calculates course progress from namespaced lesson ids", () => {
    const completed = new Set(["hugoso-calendar-01", "hugoso-calendar-02", "lesson1"]);
    expect(getCourseProgress(HUGOSO_COURSES.calendar, completed)).toEqual({
      completed: 2,
      total: 9,
      percent: 22,
    });
  });
});
