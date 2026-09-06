// Soát engine lặp lại ngắt quãng — thuần, không DB. Sai lịch ôn là hỏng đúng
// thứ cốt lõi của app (nhớ được hay không), nên phải có test chạy đứng một mình.
import { schedule, MASTERED_INTERVAL_DAYS, nextStreak, ewma, bumpHistory, projectDaysToGoal, coachTip } from '../services/vocabSrs.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };
const days = (s) => s.intervalDays;

// Học đúng liên tiếp → khoảng ôn phải GIÃN DẦN.
let s = schedule({}, 2);              // lần đầu "được"
check(days(s) === 1, `lần 1 được → ôn lại sau 1 ngày (${days(s)})`);
s = schedule(s, 2);
check(days(s) === 3, `lần 2 được → 3 ngày (${days(s)})`);
const s3 = schedule(s, 2);
check(days(s3) > days(s), `lần 3 được → giãn tiếp (${days(s3)} > ${days(s)})`);

// Quên → kéo về ôn lại NGAY (dưới 1 ngày), tăng "lapses", hạ ease.
const f = schedule(s3, 0);
check(f.intervalDays < 1, `quên → ôn lại ngay trong ngày (${f.intervalDays.toFixed(3)} ngày)`);
check(f.lapses === 1, `quên → đếm 1 lần trượt (${f.lapses})`);
check(f.ease < s3.ease, `quên → hạ độ dễ (${f.ease} < ${s3.ease})`);
check(f.status === 'learning', `quên → về trạng thái đang học`);

// "Dễ" giãn nhanh hơn "được".
check(days(schedule({}, 3)) >= days(schedule({}, 2)), 'dễ giãn ≥ được ngay từ lần đầu');

// Độ dễ không bao giờ tụt dưới sàn 1.3 dù quên liên tục.
let g = {};
for (let i = 0; i < 20; i++) g = schedule(g, 0);
check(g.ease >= 1.3, `ease có sàn 1.3 dù quên 20 lần (${g.ease})`);

// Thuộc dài hạn: ôn đúng nhiều lần → vượt mốc mastered 21 ngày.
let m = {};
for (let i = 0; i < 6; i++) m = schedule(m, 2);
check(m.intervalDays >= MASTERED_INTERVAL_DAYS && m.status === 'mastered',
  `ôn đúng 6 lần → đã thuộc (${m.intervalDays} ngày ≥ ${MASTERED_INTERVAL_DAYS})`);

// dueAt luôn ở tương lai.
check(new Date(schedule({}, 2).dueAt).getTime() > Date.now(), 'dueAt luôn ở tương lai');

// ─── Chuỗi ngày ─────────────────────────────────────────────────────────────
check(nextStreak({ streak: 0 }, '2026-09-04', '2026-09-03').streak === 1, 'chuỗi: học lần đầu → 1');
check(nextStreak({ streak: 3, lastStudyDay: '2026-09-03' }, '2026-09-04', '2026-09-03').streak === 4, 'chuỗi: học nối ngày → +1');
check(nextStreak({ streak: 5, lastStudyDay: '2026-09-04', reviewsToday: 2 }, '2026-09-04', '2026-09-03').streak === 5, 'chuỗi: học tiếp trong ngày → giữ nguyên');
check(nextStreak({ streak: 5, lastStudyDay: '2026-09-04', reviewsToday: 2 }, '2026-09-04', '2026-09-03').reviewsToday === 3, 'chuỗi: học tiếp trong ngày → +1 lượt');
check(nextStreak({ streak: 9, lastStudyDay: '2026-09-01' }, '2026-09-04', '2026-09-03').streak === 1, 'chuỗi: bỏ cách ngày → reset về 1');

// ─── Cố vấn thích ứng (hàm thuần) ───────────────────────────────────────────
check(ewma(0, 1) === 1, 'ewma: giá trị đầu = chính nó');
check(Math.abs(ewma(1, 0, 0.25) - 0.75) < 1e-9, 'ewma: trộn theo alpha (0.75)');

let h = bumpHistory([], '2026-09-06', { r: 1, c: 1, n: 1 });
check(h.length === 1 && h[0].r === 1, 'history: thêm mục ngày mới');
h = bumpHistory(h, '2026-09-06', { r: 1, c: 0, n: 0 });
check(h.length === 1 && h[0].r === 2 && h[0].c === 1, 'history: cùng ngày → cộng dồn');
h = bumpHistory(h, '2026-09-07', { r: 1, c: 1, n: 1 });
check(h.length === 2, 'history: ngày khác → mục mới');
check(bumpHistory(Array.from({ length: 80 }, (_, i) => ({ d: `d${i}`, r: 1, c: 1, n: 0 })), 'x', { r: 1 }, 60).length === 60, 'history: cắt còn tối đa cap');

check(projectDaysToGoal(0, 5) === 0, 'dự phóng: hết phần còn lại = 0 ngày');
check(projectDaysToGoal(100, 0) === Infinity, 'dự phóng: chưa có nhịp = vô hạn');
check(projectDaysToGoal(100, 10) === 10, 'dự phóng: 100 từ / 10 mỗi ngày = 10 ngày');

check(coachTip({ streakAlive: true, studiedToday: false }).key === 'keepStreak', 'cố vấn: có chuỗi mà chưa học → giữ chuỗi');
check(coachTip({ studiedToday: true, overdue: 30 }).key === 'clearBacklog', 'cố vấn: tồn nhiều → ôn tồn trước');
check(coachTip({ studiedToday: true, overdue: 0, weakCount: 6 }).key === 'drillWeak', 'cố vấn: nhiều từ yếu → luyện từ yếu');
check(coachTip({ studiedToday: true, overdue: 0, weakCount: 0, accuracy: 0.5 }).key === 'slowDown', 'cố vấn: chính xác thấp → chậm lại');
check(coachTip({ studiedToday: true, overdue: 0, weakCount: 0, accuracy: 0.95, remaining: 0 }).key === 'levelDone', 'cố vấn: xong bậc → thi/vượt');

console.log(failed ? `\n❌ ${failed} mục KHÔNG đạt` : '\n✅ Engine ôn tập chạy đúng');
process.exit(failed ? 1 : 0);
