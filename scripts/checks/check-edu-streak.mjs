// Luật chuỗi lửa Education Hugo (packages/shared/eduStreak.js) — máy chủ là nơi DUY NHẤT tính.
// Kiểm: sang ngày đúng 00:00 giờ VN, mỗi ngày tính tối đa một lần, lỡ ngày thì đóng băng,
// quá MAX_FREEZES lần/tháng thì mất chuỗi, phá băng hợp lệ, thưởng mốc không trả đôi.
import assert from "node:assert/strict";
import { vnClock } from "../../packages/shared/eduPrefs.js";
import { checkNickname } from "../../packages/persona/nickname.js";
import { checkAvatar, randomAvatar } from "../../packages/persona/avatar.js";
import { WEB_COURSES } from "../../packages/courses/coding/index.js";
import { nextLesson, stepLessons } from "../../packages/courses/coding/lessons.js";
import { MAX_FREEZES, settleStreak, streakView, studyToday, thawDay } from "../../packages/shared/eduStreak.js";

// 1. Ranh giới ngày = 00:00 Asia/Ho_Chi_Minh (UTC+7) = 17:00 UTC hôm trước.
assert.equal(vnClock(new Date("2026-11-01T16:59:59Z")).day, "2026-11-01");
assert.equal(vnClock(new Date("2026-11-01T17:00:00Z")).day, "2026-11-02");

// 2. Học nhiều bài trong một ngày chỉ +1.
let s = studyToday({}, "2026-11-02").state;
s = studyToday(s, "2026-11-02").state;
assert.equal(s.count, 1);
assert.equal(streakView(s, "2026-11-02").studiedToday, true);

// 3. Sang ngày mới (00:00) mà chưa học: hôm nay chưa giữ lửa, chuỗi chưa mất.
let v = streakView(s, "2026-11-03");
assert.equal(v.studiedToday, false);
assert.equal(v.count, 1);
s = studyToday(s, "2026-11-03").state;
assert.equal(s.count, 2);

// 4. Lỡ một ngày → ngày đó đóng băng, chuỗi giữ nhưng không tăng.
v = streakView(s, "2026-11-05");
assert.deepEqual(v.frozen, ["2026-11-04"]);
assert.equal(v.count, 2);
assert.equal(v.frozenNow, true);

// 5. Phá băng: ngày đóng băng thành ngày giữ lửa (+1); phá ngày không đóng băng bị từ chối.
const thawed = thawDay(s, "2026-11-04", "2026-11-05").state;
assert.equal(thawed.count, 3);
assert.deepEqual(thawed.frozen, []);
assert.throws(() => thawDay(thawed, "2026-11-04", "2026-11-05"), { code: "NOT_FROZEN" });
assert.throws(() => thawDay(s, "2026-11-06", "2026-11-05"), { code: "NOT_FROZEN" }); // ngày tương lai

// 6. Quá MAX_FREEZES ngày đóng băng trong tháng → mất chuỗi, đếm lại.
const lost = settleStreak(s, `2026-11-${String(4 + MAX_FREEZES + 1).padStart(2, "0")}`);
assert.equal(lost.count, 0);
assert.throws(() => thawDay(s, "2026-11-04", "2026-11-09"), { code: "STREAK_LOST" });

// 7. Thưởng mốc 3 ngày đúng một lần, kể cả khi nộp lại cùng ngày.
let m = studyToday({}, "2026-12-01").state;
m = studyToday(m, "2026-12-02").state;
const hit = studyToday(m, "2026-12-03");
assert.deepEqual(hit.milestone, { day: 3, joy: 30 });
assert.equal(studyToday(hit.state, "2026-12-03").milestone, null);

// 8. Dữ liệu rác (client không ghi được chuỗi, nhưng DB cũ có thể bẩn) không làm sập.
assert.equal(streakView({ count: "x", studied: ["bad", 5] }, "2026-11-02").count, 0);

// 9. Biệt danh bảng thi đua: chỉ chữ (mọi ngôn ngữ) + emoji, 2–20 ký tự.
for (const ok of ["Huy", "Lê Gia Huy", "火苗", "Huy 🔥", "Thảo Vy 👩‍💻"]) assert.equal(checkNickname(ok).ok, true, ok);
for (const bad of ["H", "Huy123", "Huy!", "huy_le", "<b>x", "a".repeat(21), "Huy\u200b", "@huy", "Huy\u202eabc"]) assert.equal(checkNickname(bad).ok, false, bad);
assert.equal(checkNickname("  Lê   Huy ").value, "Lê Huy");

// 10. Nhân vật Persona: chỉ nhận mã trong danh sách, thiếu/thừa/lạ đều bị từ chối.
const av = randomAvatar();
assert.equal(checkAvatar(av).ok, true);
assert.deepEqual(Object.keys(checkAvatar({ ...av, evil: "<svg>" }).value), Object.keys(av));
for (const bad of [null, "x", { ...av, hair: "<script>" }, { ...av, skinColor: "#000000" }, { ...av, hat: undefined }]) assert.equal(checkAvatar(bad).ok, false);

// 11. Bài nhỏ: mỗi step 2–5 bài, bài cuối là trắc nghiệm, mọi slide thuộc đúng một bài.
for (const c of WEB_COURSES.filter((x) => !x.draft)) {
  const plan = stepLessons(c.slides);
  assert.ok(plan.length >= 2 && plan.length <= 5, c.id);
  assert.equal(plan.at(-1).quiz, true);
  assert.deepEqual(plan.slice(0, -1).flatMap((l) => l.slides).sort((a, b) => a - b), c.slides.map((_, i) => i), c.id);
}
assert.equal(nextLesson(5, [0, 1]), 2);
assert.equal(nextLesson(5, [0, 1, 2, 3]), 4);

console.log("Bài nhỏ: mỗi step 2–5 bài, đủ slide, trắc nghiệm cuối — đạt.");
console.log("Biệt danh: chỉ chữ + emoji · nhân vật: chỉ mã trong danh sách — đạt.");
console.log("Chuỗi lửa: ranh giới 00:00 giờ VN, 1 lần/ngày, đóng băng, mất chuỗi, phá băng, thưởng mốc — đạt.");
