import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronDown, Check, Lock, Star, Trophy } from "lucide-react";
import { gradeStage } from "../../../../shared/stageGrading";

/**
 * Bản đồ khoá học — các bài là những bước nhảy trên một con đường.
 *
 * Thay cho danh sách xếp gấp sáu chặng: người học không nhìn một mục lục nữa mà
 * nhìn con đường mình đang đi, thấy bước hiện tại nằm ở đâu và còn bao xa tới
 * rương kế tiếp.
 *
 * ponytail: chiều sâu dựng bằng CSS (mặt vát `box-shadow: 0 Npx 0`, nghiêng
 * `perspective`, lún khi bấm) và hình khối bằng SVG nội tuyến — KHÔNG dùng
 * WebGL. Ngân sách gói bài học chỉ còn 23 kB, mà three.js nặng khoảng 600 kB;
 * ảnh tham chiếu cũng là 2D có chiều sâu chứ không phải cảnh 3D thật. Muốn
 * WebGL thật thì phải tách chunk riêng, nạp lười, và nới ngân sách có chủ đích.
 */

/** Rương kho báu vẽ đẳng cự. Mở nắp khi cả chặng đã xong. */
function Chest({ opened }) {
  return (
    <svg viewBox="0 0 64 56" className="course-chest" aria-hidden="true">
      <g className="course-chest-lid" style={{ transformOrigin: "32px 26px" }}>
        <path d="M8 26 L32 12 L56 26 L56 30 L8 30 Z" fill="currentColor" opacity=".92" />
        <rect x="29" y="24" width="6" height="8" rx="1.5" fill="#fff" opacity=".85" />
      </g>
      <path d="M8 30 L56 30 L56 46 A4 4 0 0 1 52 50 L12 50 A4 4 0 0 1 8 46 Z" fill="currentColor" />
      <rect x="28" y="32" width="8" height="12" rx="2" fill="#fff" opacity={opened ? ".9" : ".55"} />
    </svg>
  );
}

const NODE_KIND = {
  done: { Icon: Check, label: "Đã xong" },
  current: { Icon: Star, label: "Đang học" },
  locked: { Icon: Lock, label: "Chưa mở" },
};

/**
 * Một chặng = một đơn vị trên bản đồ: biển tên, phần "chặng này học gì", con
 * đường các bài, rương ở cuối.
 */
function Unit({
  unit, lessons, currentIndex, completedSet, onOpenLesson, defaultOpen, focusId, focusRef,
  examScores, serverCompleted,
}) {
  const [guideOpen, setGuideOpen] = useState(defaultOpen);
  const doneCount = lessons.filter((lesson) => completedSet.has(lesson.course.id)).length;
  const unitDone = doneCount === lessons.length && lessons.length > 0;

  // Xếp loại chặng tính ngay tại đây bằng cùng công thức máy chủ dùng để cấp
  // chứng chỉ — người học thấy trước mình đang ở hạng nào, không phải đợi tới
  // lúc nhận giấy mới biết.
  const assessment = useMemo(() => gradeStage({
    lessonIds: lessons.map((lesson) => lesson.course.id),
    examIds: lessons.filter((lesson) => lesson.course.practiceType === "quiz").map((lesson) => lesson.course.id),
    completedLessons: serverCompleted,
    examScores,
  }), [lessons, serverCompleted, examScores]);

  return (
    <section className={`course-unit course-tone-${unit.tone}`}>
      <header className="course-unit-banner">
        <div className="course-unit-heading">
          <small>
            Khoá học · Chặng {unit.phaseNumber}
            {" · "}
            {doneCount}/{lessons.length} bài
          </small>
          <strong>{unit.title.replace(/^Chặng \d+:\s*/, "")}</strong>
          {assessment.breakdown.attempts > 0 && (
            <span className={`course-unit-grade is-${assessment.grade}`}>
              {assessment.score}/100 · {assessment.gradeLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          className="course-unit-guide"
          onClick={() => setGuideOpen((open) => !open)}
          aria-expanded={guideOpen}
        >
          <ChevronDown aria-hidden="true" style={{ transform: guideOpen ? "rotate(180deg)" : "none" }} />
          <span>Học gì</span>
        </button>
      </header>

      {guideOpen && unit.intro && (
        <div className="course-unit-guidebook">
          <p className="course-unit-tagline">{unit.intro.tagline}</p>
          <ul>
            {(unit.intro.learn || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {unit.intro.promise && <p className="course-unit-promise">{unit.intro.promise}</p>}
        </div>
      )}

      <div className="course-path">
        {lessons.map(({ course, globalIndex }, index) => {
          const done = completedSet.has(course.id);
          const current = globalIndex === currentIndex;
          const locked = globalIndex > currentIndex;
          const state = done ? "done" : current ? "current" : "locked";
          const { Icon, label } = NODE_KIND[state];

          // Đường đi lượn trái–giữa–phải để mắt bám được thứ tự, thay vì một
          // cột thẳng khiến trăm bài trông như một danh sách.
          const offset = [0, 1, 0, -1][index % 4];

          return (
            <div
              key={course.id}
              ref={course.id === focusId ? focusRef : undefined}
              className={`course-step is-${state}`}
              style={{ "--offset": offset }}
            >
              {current && <span className="course-step-bubble">Bắt đầu</span>}
              <button
                type="button"
                onClick={() => !locked && onOpenLesson(course.id)}
                disabled={locked}
                aria-label={`${label}: ${course.title}`}
                title={course.title}
              >
                <Icon aria-hidden="true" />
              </button>
              <span className="course-step-name">{course.title.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        })}

        <div className={`course-step course-step-chest ${unitDone ? "is-opened" : "is-locked"}`}>
          <Chest opened={unitDone} />
          <span className="course-step-name">
            {unitDone ? "Đã mở rương chặng" : `Mở rương sau ${lessons.length - doneCount} bài nữa`}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function CourseMap({
  courses, stages, completedSet, currentIndex, focusId, onOpenLesson, onBack,
  examScores = {}, serverCompleted = [], isOffice,
}) {
  const focusRef = useRef(null);
  const units = useMemo(
    () => stages.map((stage) => ({
      stage,
      lessons: courses
        .slice(stage.from, stage.to)
        .map((course, index) => ({ course, globalIndex: stage.from + index })),
    })),
    [courses, stages],
  );

  const currentStageId = stages.find(
    (stage) => currentIndex >= stage.from && currentIndex < stage.to,
  )?.id;

  const allDone = courses.length > 0 && courses.every((course) => completedSet.has(course.id));

  // Kéo bản đồ tới bài đang theo dõi. Với 100 bài, mở ra mà nằm ở bài 1 thì
  // người học phải cuộn cả màn hình mới thấy mình đang ở đâu — mỗi lần vào,
  // mỗi lần reload, mỗi lần thoát bài về đây.
  useEffect(() => {
    const node = focusRef.current;
    if (!node) return undefined;
    // Đợi một khung hình: phần "chặng này học gì" của chặng hiện tại mở sẵn,
    // đo trước khi nó chiếm chỗ thì cuộn hụt.
    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center", behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId]);

  return (
    <div className="course-map">
      {onBack && (
        <button type="button" className="course-map-back" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
          <span>Khoá học của bạn</span>
        </button>
      )}

      {units.map(({ stage, lessons }) => (
        <Unit
          key={stage.id}
          unit={stage}
          lessons={lessons}
          currentIndex={currentIndex}
          completedSet={completedSet}
          onOpenLesson={onOpenLesson}
          defaultOpen={stage.id === currentStageId}
          focusId={focusId}
          focusRef={focusRef}
          examScores={examScores}
          serverCompleted={serverCompleted}
        />
      ))}

      <div className={`course-step course-step-trophy ${allDone ? "is-opened" : "is-locked"}`}>
        <span><Trophy aria-hidden="true" /></span>
        <span className="course-step-name">
          {allDone
            ? (isOffice ? "Nhận chứng nhận Hugo Studio" : "Tốt nghiệp Phát triển Web")
            : (isOffice ? "Đích: nhận chứng nhận Hugo Studio" : "Đích: tốt nghiệp Phát triển Web")}
        </span>
      </div>
    </div>
  );
}
