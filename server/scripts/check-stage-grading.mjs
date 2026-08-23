/**
 * Kiểm xếp loại chặng — chạy trong `npm run check:all`.
 *
 * Chứng chỉ nói ra năng lực nên công thức phải đúng ở những chỗ dễ sai lặng lẽ:
 * thi lại nhiều lần không được leo lên hạng cao, chưa học hết không được coi là
 * đạt, và chặng không có bài thi vẫn phải chấm được.
 */
import { gradeStage, gradeOf, STAGE_PASS_SCORE } from '../../shared/stageGrading.js';

const problems = [];
const check = (ok, message) => { if (!ok) problems.push(message); };

const tenLessons = Array.from({ length: 10 }, (_, i) => `lesson${i + 1}`);

// 1. Đỗ cao ngay lần đầu, học hết bài → phải là hạng cao nhất.
const gioi = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons,
  examScores: { lesson6: { best: 95, firstTry: 95, attempts: 1 } },
});
check(gioi.score >= 90, `Đỗ 95% ngay lần đầu, học hết bài mà chỉ được ${gioi.score} điểm.`);
check(gioi.grade === 'excellent', `Điểm ${gioi.score} phải xếp Xuất sắc, đang là ${gioi.gradeLabel}.`);
check(gioi.passed, 'Học hết bài + đỗ cao mà không tính là đạt.');

// 2. Cùng điểm cuối nhưng thi tới lần thứ tư → phải thấp hơn rõ rệt.
const thiNhieu = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons,
  examScores: { lesson6: { best: 95, firstTry: 40, attempts: 4 } },
});
check(
  thiNhieu.score < gioi.score - 15,
  `Thi 4 lần mới đạt 95% mà điểm (${thiNhieu.score}) gần bằng người đỗ ngay lần đầu (${gioi.score}).`,
);

// 3. Không được "mua" hạng cao bằng cách thi mãi.
const thiMai = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons,
  examScores: { lesson6: { best: 100, firstTry: 35, attempts: 8 } },
});
check(
  thiMai.grade !== 'excellent',
  `Thi 8 lần để đạt 100% vẫn được xếp Xuất sắc (${thiMai.score} điểm) — công thức đang thưởng cho việc thi lại.`,
);
// Nhưng họ ĐÃ vượt mọi điều kiện, nên tờ giấy không được ghi "Chưa đạt".
check(thiMai.passed, 'Học hết bài và mọi bài thi đều trên sàn mà vẫn không tính là đạt.');
check(
  thiMai.grade !== 'none',
  `Đủ điều kiện nhận chứng chỉ mà bị xếp "Chưa đạt" (${thiMai.score} điểm) — mâu thuẫn với việc vẫn cấp giấy.`,
);

// 4. Chưa học hết bài thì không đạt, dù thi điểm cao.
const conNoBai = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons.slice(0, 6),
  examScores: { lesson6: { best: 100, firstTry: 100, attempts: 1 } },
});
check(!conNoBai.passed, 'Còn nợ 4 bài mà vẫn tính là đạt chặng.');
check(
  conNoBai.breakdown.completion === 60,
  `Hoàn tất 6/10 bài phải ra 60%, đang ra ${conNoBai.breakdown.completion}%.`,
);

// 5. Chặng không có bài thi (đồ án) vẫn chấm được, không cho 0 điểm oan.
const khongCoThi = gradeStage({
  lessonIds: tenLessons,
  examIds: [],
  completedLessons: tenLessons,
  examScores: {},
});
check(khongCoThi.score >= 90, `Chặng không có bài thi, học hết bài mà chỉ ${khongCoThi.score} điểm.`);
check(khongCoThi.breakdown.exam === null, 'Chặng không có bài thi phải để trống phần điểm thi.');

// 6. Có bài thi nhưng chưa thi lần nào: không được tính 0 điểm thi rồi kéo tụt.
const chuaThi = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons.slice(0, 5),
  examScores: {},
});
check(
  chuaThi.breakdown.exam === null,
  'Chưa thi lần nào mà đã chấm điểm thi — sẽ ra điểm khống.',
);

// 7. Chưa học gì thì điểm phải bằng 0 phần hoàn tất, và không đạt.
const chuaHoc = gradeStage({
  lessonIds: tenLessons, examIds: ['lesson6'], completedLessons: [], examScores: {},
});
check(!chuaHoc.passed, 'Chưa học bài nào mà vẫn tính là đạt.');
check(chuaHoc.breakdown.completion === 0, 'Chưa học bài nào mà phần hoàn tất khác 0.');

// 7b. Bài thi chưa vượt sàn thì dù học hết bài cũng không đạt.
const thiRot = gradeStage({
  lessonIds: tenLessons,
  examIds: ['lesson6'],
  completedLessons: tenLessons,
  examScores: { lesson6: { best: 45, firstTry: 45, attempts: 2 } },
});
check(!thiRot.passed, 'Bài thi mới 45% mà đã tính là đạt chặng.');

// 8. Ranh giới xếp loại phải liền mạch, không có khoảng trống.
for (const [score, expected] of [[100, 'excellent'], [90, 'excellent'], [89, 'great'], [80, 'great'], [79, 'good'], [70, 'good'], [69, 'pass'], [60, 'pass'], [59, 'none'], [0, 'none']]) {
  const band = gradeOf(score);
  check(band.id === expected, `Điểm ${score} phải xếp "${expected}", đang xếp "${band.id}".`);
}
check(gradeOf(STAGE_PASS_SCORE).id === 'pass', `Điểm sàn ${STAGE_PASS_SCORE} phải là hạng Đạt.`);

if (problems.length) {
  console.error(`Xếp loại chặng có ${problems.length} vấn đề:`);
  problems.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(
  'Xếp loại chặng: thưởng đỗ ngay lần đầu, không mua được hạng bằng thi lại, '
  + 'chưa học hết thì không đạt, chặng không có bài thi vẫn chấm đúng.',
);
