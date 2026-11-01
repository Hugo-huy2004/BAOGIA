// Một step chia thành các BÀI NHỎ (kiểu Duolingo) theo đúng ranh giới phần có sẵn của slide —
// không phải soạn lại nội dung, bản dịch en/zh dùng nguyên. Bài cuối luôn là trắc nghiệm.
// Client (trình phát, bản đồ) và máy chủ (/api/joy/edu-lesson) cùng gọi hàm này.
const GROUPS = [["intro", "visual"], ["research", "ideate"], ["core"], ["apply"]];
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((sections, g) => sections.map((s) => [s, g])));

/** [{ slides: [chỉ số slide] }, …, { quiz: true }]; phần trống bị bỏ, phần lạ vào "core". */
export function stepLessons(slides = []) {
  const groups = GROUPS.map(() => []);
  slides.forEach((slide, i) => groups[GROUP_OF[slide.section] ?? GROUP_OF.core].push(i));
  return [...groups.filter((g) => g.length).map((g) => ({ slides: g })), { quiz: true }];
}

/** Bài đầu tiên chưa học (bài trắc nghiệm nếu đã học hết phần slide). */
export function nextLesson(total, done = []) {
  for (let i = 0; i < total - 1; i += 1) if (!done.includes(i)) return i;
  return total - 1;
}
