import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CourseMap from "./CourseMap";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";

function readLocalValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readLocalList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function CoderLearningJourney({
  bio,
  courses,
  stages,
  loading,
  onOpenLesson,
  includeLocalProgress = true,
}) {
  const { t } = useTranslation();
  // Bản trong máy để vẽ ngay; gộp với bản máy chủ để đổi máy vẫn đúng.
  const completedSet = useMemo(
    () => new Set([...(includeLocalProgress ? readLocalList(CODER_STORAGE_KEYS.progress) : []), ...(bio?.completedLessons || [])]),
    [bio?.completedLessons, includeLocalProgress],
  );
  const firstIncompleteIndex = courses.findIndex(
    (course) => !completedSet.has(course.id),
  );
  const currentIndex = firstIncompleteIndex === -1
    ? Math.max(0, courses.length - 1)
    : firstIncompleteIndex;

  // Con trỏ "đang học" là BÀI MỞ GẦN NHẤT, không phải bài chưa xong đầu tiên:
  // học lại một bài cũ thì quay về bản đồ phải thấy đúng bài đó. Bài đã lưu có
  // thể không còn trong giáo trình (đổi chương trình) nên phải đối chiếu lại.
  const lastLessonId = readLocalValue(CODER_STORAGE_KEYS.lastLesson);
  const focusId = courses.some((course) => course.id === lastLessonId)
    ? lastLessonId
    : courses[currentIndex]?.id;

  if (loading && courses.length === 0) {
    return (
      <div className="coder-journey-loading" aria-live="polite">
        <span />
        <p>{t("hugoCoderLearning.loading")}</p>
      </div>
    );
  }

  // Tải xong mà không có step nào (mất mạng, máy chủ lỗi): nói rõ, đừng để màn trống.
  if (!loading && courses.length === 0) {
    return (
      <div className="coder-journey-loading" role="status">
        <p>Chưa tải được lộ trình. Kiểm tra kết nối rồi mở lại Coding.</p>
      </div>
    );
  }

  return (
    <main className="coder-journey">
      {/* Trang này CHỈ còn bản đồ. Dải chỉ số và thẻ kho báu đã dời ra trang
          chủ Study — vào đây là để đi đường, không phải để đọc bảng số. */}
      <CourseMap
        courses={courses}
        stages={stages}
        completedSet={completedSet}
        currentIndex={currentIndex}
        focusId={focusId}
        examScores={bio?.hugoCoderExamScores || {}}
        serverCompleted={bio?.completedLessons || []}
        onOpenLesson={onOpenLesson}
      />
    </main>
  );
}
