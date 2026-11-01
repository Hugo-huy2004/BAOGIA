export const CODER_STORAGE_KEYS = {
  workspace: "student_ide_workspace",
  folders: "student_ide_folders",
  progress: "student_ide_progress",
  analytics: "student_ide_lesson_events",
  // Bài đang đọc dở — để mở app lần sau vào thẳng chỗ cũ. Khác `progress`:
  // đây là vị trí con trỏ, không phải bài đã được máy chủ chấm là hoàn thành.
  lastLesson: "student_ide_last_lesson"
};


// Bài nhỏ khách (chưa đăng nhập) đã học — chỉ trong máy, như tiến độ step của khách.
export const GUEST_LESSONS = "coding.lessons";
export function readGuestLessons() {
  try {
    const value = JSON.parse(localStorage.getItem(GUEST_LESSONS) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
