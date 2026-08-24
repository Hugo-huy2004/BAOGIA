/**
 * Kiểm danh mục khoá học và giấy chứng nhận — chạy trong `npm run check:all`.
 *
 * Lỗi từng gặp: `getStageCertificate` tra chặng theo `phaseNumber`, nên mọi học
 * phần Năng suất (`office-calendar`) đều ra NaN và không bao giờ cấp được chứng
 * nhận. Bấm nút "Nhận chứng nhận" không hiện gì, mà cũng chẳng có lỗi nào để
 * lần ra.
 *
 * Yêu cầu quan trọng nhất script này giữ: THÊM KHOÁ MỚI THÌ MỌI THỨ TỰ TÍNH.
 * Danh mục dựng từ giáo trình, nên khoá mới phải tự có mặt, tự cấp chứng nhận,
 * tự vào các bảng — không phải nhớ sửa thêm nơi nào.
 */
import { COURSE_CATALOG, getCourse, courseOfLesson, resolveStageKey } from '../../shared/courseCatalog.js';
import { getStageCertificate } from '../utils/coderExamService.js';

const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };

check(COURSE_CATALOG.length >= 2, 'Danh mục phải có ít nhất khoá Web và một học phần Năng suất.');

const ids = new Set();
for (const course of COURSE_CATALOG) {
  const name = course.code || course.id;

  check(!ids.has(course.id), `${name}: id "${course.id}" bị trùng với khoá khác.`);
  ids.add(course.id);

  check(Boolean(course.title), `${name}: thiếu tên khoá.`);
  check(course.stages.length > 0, `${name}: không có chặng nào.`);
  check(course.lessonIds.length > 0, `${name}: không có bài học nào.`);

  // Bài của chặng cộng lại phải đúng bằng bài của khoá — lệch là có bài rơi
  // ngoài mọi chặng, và chặng nào cũng không cấp chứng nhận cho nó.
  const fromStages = course.stages.flatMap((stage) => stage.lessonIds);
  check(
    fromStages.length === course.lessonIds.length,
    `${name}: ${course.lessonIds.length} bài nhưng các chặng chỉ phủ ${fromStages.length}.`,
  );
  check(
    new Set(fromStages).size === fromStages.length,
    `${name}: một bài nằm trong nhiều chặng.`,
  );

  // Mỗi bài phải tra ngược được về đúng khoá của nó.
  for (const lessonId of course.lessonIds) {
    if (courseOfLesson(lessonId)?.id !== course.id) {
      problems.push(`${name}: bài "${lessonId}" tra ngược ra khoá khác.`);
      break;
    }
  }

  // Mỗi chặng phải cấp được chứng nhận khi học hết — bằng CẢ hai dạng khoá tra.
  for (const stage of course.stages) {
    const keys = course.kind === 'office'
      ? [course.id, `office-${course.id}`]
      : [String(stage.phaseNumber), stage.id];

    for (const key of keys) {
      const found = resolveStageKey(key);
      if (found?.stage.id !== stage.id) {
        problems.push(`${name}/${stage.id}: khoá tra "${key}" không ra đúng chặng.`);
        continue;
      }

      const bio = {
        displayName: 'Kiểm thử', slug: 'kiem-thu',
        completedLessons: [...course.lessonIds],
        hugoCoderProjectStatus: 'approved',
        hugoCoderExamScores: Object.fromEntries(
          stage.examIds.map((id) => [id, { best: 90, firstTry: 90, attempts: 1 }]),
        ),
      };

      const cert = getStageCertificate(bio, key);
      if (!cert) {
        problems.push(`${name}/${stage.id}: học hết bài mà khoá tra "${key}" vẫn không cấp chứng nhận.`);
        continue;
      }
      if (typeof cert.score !== 'number') {
        problems.push(`${name}/${stage.id}: chứng nhận thiếu điểm số.`);
      }
      if (cert.lessonsInStage !== stage.lessonIds.length) {
        problems.push(`${name}/${stage.id}: chứng nhận ghi ${cert.lessonsInStage} bài, thực tế ${stage.lessonIds.length}.`);
      }
    }

    // Chưa học hết thì KHÔNG được cấp — nếu không thì tờ giấy vô nghĩa.
    const key = course.kind === 'office' ? course.id : String(stage.phaseNumber);
    const thieu = getStageCertificate(
      { displayName: 'x', slug: 'x', completedLessons: stage.lessonIds.slice(0, -1) },
      key,
    );
    if (thieu) problems.push(`${name}/${stage.id}: còn nợ bài mà vẫn cấp chứng nhận.`);
  }
}

// Khoá tra sai phải trả null, không được ném lỗi hay rơi về khoá đầu tiên.
for (const bad of ['', null, undefined, 'không-có', '999', 'office-không-có']) {
  if (resolveStageKey(bad) !== null) {
    problems.push(`Khoá tra không hợp lệ "${bad}" lại ra một chặng.`);
  }
}
check(getCourse('không-có') === null, 'getCourse với id lạ phải trả null.');

// Slug tab của Hugo Learning là từ dành riêng trong địa chỉ: một khoá trùng slug
// thì /study/<slug> luôn ra tab, và khoá đó vĩnh viễn không mở được.
const RESERVED = ['khoa-hoc', 'tien-do', 'tai-khoan', 'login'];
for (const course of COURSE_CATALOG) {
  if (RESERVED.includes(course.id)) {
    problems.push(`${course.code}: id "${course.id}" trùng slug tab — khoá này sẽ không bao giờ mở được.`);
  }
}

if (problems.length) {
  console.error(`Danh mục khoá học có ${problems.length} vấn đề:`);
  problems.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}

const tong = COURSE_CATALOG.reduce((sum, course) => sum + course.lessonIds.length, 0);
console.log(
  `Danh mục khoá học: ${COURSE_CATALOG.length} khoá · ${tong} bài · `
  + `${COURSE_CATALOG.reduce((n, c) => n + c.stages.length, 0)} chặng — chứng nhận cấp được cho mọi chặng.`,
);
