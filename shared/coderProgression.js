import { STAGES } from "../src/components/member/hugoCoder/lessons/stages.js";

// Ranh giới chặng (đánh số step từ 1) suy từ đề cương khoá Coding.
export const CODER_STAGE_SEQUENCE = Object.freeze(
  STAGES.map(({ id, from, to }) => Object.freeze({ id, from: from + 1, to })),
);

const lessonIdFor = (number) => `step${number}`;

// ── HugoTeam dùng CHÍNH chương trình Coding ──────────────────────────────────
// Trước đây HugoTeam tự đếm "16 step" riêng (cắt ngang chặng CODE 202) và lưu
// tiến độ ở chỗ riêng, nên hai bên lệch số, lệch kết quả. Giờ cả hai đọc cùng
// `bio.completedLessons`; HugoTeam chỉ cần biết tổng số step và thời hạn.
export const CODER_TOTAL_STEPS = CODER_STAGE_SEQUENCE.at(-1)?.to || 0;
/** Thời hạn hoàn tất phần Coding của HugoTeam (ngày). */
export const HUGOTEAM_CODING_DAYS = 30;

/** Các step Coding đã hoàn tất (step1…stepN), không trùng, theo thứ tự. */
export function completedCoderSteps(completedLessons) {
  const done = new Set(Array.isArray(completedLessons) ? completedLessons : []);
  return Array.from({ length: CODER_TOTAL_STEPS }, (_, index) => lessonIdFor(index + 1)).filter((id) => done.has(id));
}

function getCoderStage(stageId) {
  return CODER_STAGE_SEQUENCE.find((stage) => stage.id === stageId) || null;
}

function getCoderStageForLesson(lessonId) {
  const match = /^step(\d{1,3})$/.exec(String(lessonId || ""));
  if (!match) return null;
  const lessonNumber = Number(match[1]);
  return CODER_STAGE_SEQUENCE.find(
    (stage) => lessonNumber >= stage.from && lessonNumber <= stage.to,
  ) || null;
}

export function getCoderStageCompletion(completedLessons, stageId) {
  const stage = getCoderStage(stageId);
  if (!stage) return { stage: null, completed: 0, total: 0, missingLessons: [] };

  const completed = new Set(Array.isArray(completedLessons) ? completedLessons : []);
  const requiredLessons = Array.from(
    { length: stage.to - stage.from + 1 },
    (_, index) => lessonIdFor(stage.from + index),
  );
  const missingLessons = requiredLessons.filter((lessonId) => !completed.has(lessonId));

  return {
    stage,
    completed: requiredLessons.length - missingLessons.length,
    total: requiredLessons.length,
    missingLessons,
  };
}

export function getCoderStageGate(completedLessons, targetStageId) {
  const targetIndex = CODER_STAGE_SEQUENCE.findIndex((stage) => stage.id === targetStageId);
  if (targetIndex < 0) {
    return { unlocked: false, code: "INVALID_STAGE", missingLessons: [] };
  }

  const prerequisiteStages = CODER_STAGE_SEQUENCE.slice(0, targetIndex);
  const progress = prerequisiteStages.map((stage) => (
    getCoderStageCompletion(completedLessons, stage.id)
  ));
  const missingLessons = progress.flatMap((item) => item.missingLessons);

  return {
    unlocked: missingLessons.length === 0,
    code: missingLessons.length ? "PREVIOUS_STAGE_INCOMPLETE" : null,
    previousStage: prerequisiteStages.at(-1) || null,
    missingLessons,
    progress,
  };
}

export function getCoderLessonGate(completedLessons, lessonId) {
  const stage = getCoderStageForLesson(lessonId);
  if (!stage) return { unlocked: false, code: "INVALID_LESSON", missingLessons: [] };

  const lessonNumber = Number(String(lessonId).replace("step", ""));
  const completed = new Set(Array.isArray(completedLessons) ? completedLessons : []);
  const missingLessons = Array.from(
    { length: Math.max(0, lessonNumber - 1) },
    (_, index) => lessonIdFor(index + 1),
  ).filter((requiredLessonId) => !completed.has(requiredLessonId));

  return {
    unlocked: missingLessons.length === 0,
    code: missingLessons.length ? "PREVIOUS_LESSONS_INCOMPLETE" : null,
    stage,
    missingLessons,
  };
}

export function isCoderLessonId(lessonId) {
  return Boolean(getCoderStageForLesson(lessonId));
}
