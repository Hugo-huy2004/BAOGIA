import EduLearner from '../models/EduLearner.js';
import Bio from '../models/Bio.js';
import { accessDeadline } from '../utils/accountAccess.js';
import { sendEduPush } from '../utils/pushNotifier.js';
import { cleanEduPrefs, vnClock } from '../../../packages/shared/eduPrefs.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const todayOf = (doc, day) => ({ done: doc?.day === day ? doc.dayDone : 0, goal: cleanEduPrefs(doc?.prefs).dailyGoal });

/** Mở app: ghi lần hoạt động, trả cài đặt + mục tiêu hôm nay. */
export async function eduSnapshot(email) {
  const doc = await EduLearner.findOneAndUpdate(
    { email },
    { $set: { lastActiveAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return { prefs: cleanEduPrefs(doc.prefs), today: todayOf(doc, vnClock().day) };
}

export async function saveEduPrefs(email, input) {
  const current = await EduLearner.findOne({ email }).select('prefs').lean();
  const prefs = cleanEduPrefs(input, cleanEduPrefs(current?.prefs));
  await EduLearner.updateOne({ email }, { $set: { prefs } }, { upsert: true });
  return prefs;
}

/** Qua một step lần đầu: cộng vào mục tiêu hôm nay. */
export async function noteEduStep(email) {
  const { day } = vnClock();
  // Hai bước nguyên tử: sang ngày mới thì đặt lại về 1, cùng ngày thì +1.
  const reset = await EduLearner.updateOne({ email, day: { $ne: day } }, { $set: { day, dayDone: 1, lastActiveAt: new Date() } }, { upsert: false });
  if (reset.matchedCount) return;
  await EduLearner.updateOne({ email }, { $inc: { dayDone: 1 }, $set: { day, lastActiveAt: new Date() } }, { upsert: true });
}

// Lời nhắc xoay vòng theo ngày để không lặp một câu mỗi tối.
const NUDGES = [
  ['Tới giờ học rồi', 'Một step ngắn thôi — Nhịp đang chờ dòng code tiếp theo.'],
  ['Giữ nhịp hôm nay', 'Mười lăm phút là đủ qua một step và nhận thêm JOY.'],
  ['Bạn đồng hành đang đợi', 'Mở Education Hugo và làm tiếp phần còn dang dở.'],
];
const AWAY_NUDGE = ['Lâu rồi chưa gặp', 'Bài học vẫn giữ nguyên chỗ cũ — quay lại học tiếp một step nhé.'];

/**
 * Chạy mỗi giờ: nhắc học đúng giờ người học chọn (chưa đạt mục tiêu ngày), và
 * lúc 9h báo hạn tài khoản còn 3 hoặc 1 ngày.
 *
 * ponytail: quét theo giờ với limit 500/lượt — đủ cho quy mô hiện tại; đông hơn
 * thì chia lô theo _id.
 */
export async function runEduReminders(now = new Date()) {
  const { day, hour } = vnClock(now);
  let reminded = 0;
  let warned = 0;

  // Thôi nhắc người bỏ học quá 30 ngày: nhắc mãi chỉ khiến họ tắt thông báo.
  const due = await EduLearner.find({
    'prefs.reminder': { $ne: false },
    'prefs.reminderHour': hour,
    remindedDay: { $ne: day },
    lastActiveAt: { $gte: new Date(now - 30 * DAY_MS) },
  }).limit(500).lean();
  for (const doc of due) {
    const { done, goal } = todayOf(doc, day);
    if (done >= goal) continue;
    const away = now - new Date(doc.lastActiveAt) > 2 * DAY_MS;
    const [title, body] = away ? AWAY_NUDGE : NUDGES[Number(day.slice(-2)) % NUDGES.length];
    const left = goal - done;
    await sendEduPush(doc.email, { title, body: !away && goal > 1 ? `${body} Còn ${left} step là đạt mục tiêu hôm nay.` : body, url: '/learn', tag: 'edu-reminder' });
    await EduLearner.updateOne({ _id: doc._id }, { $set: { remindedDay: day } });
    reminded += 1;
  }

  if (hour === 9) {
    const learners = await EduLearner.find({ 'prefs.notifyAccount': { $ne: false }, expiryWarnedDay: { $ne: day } })
      .select('email').limit(2000).lean();
    const bios = await Bio.find({ email: { $in: learners.map((l) => l.email) }, isEduVerified: { $ne: true } })
      .select('email expiresAt trialExpiresAt isEduVerified').lean();
    for (const bio of bios) {
      const deadline = accessDeadline(bio);
      if (!deadline) continue;
      const days = Math.ceil((new Date(deadline) - now) / DAY_MS);
      if (days !== 3 && days !== 1) continue;
      await sendEduPush(bio.email, {
        title: `Tài khoản còn ${days} ngày`,
        body: 'Gia hạn bằng JOY trong Cửa hàng (hoặc xác minh học sinh – sinh viên để được 1 năm) để giữ tiến độ học.',
        url: '/store',
        tag: 'edu-account',
      });
      await EduLearner.updateOne({ email: bio.email }, { $set: { expiryWarnedDay: day } });
      warned += 1;
    }
  }
  return { reminded, warned };
}

/** Đăng nhập từ máy mới — báo cả về các máy Edu (nếu người học không tắt). */
export async function eduSecurityPush(email, device) {
  const doc = await EduLearner.findOne({ email }).select('prefs').lean();
  if (!doc || !cleanEduPrefs(doc.prefs).notifySecurity) return;
  await sendEduPush(email, {
    title: 'Có đăng nhập mới',
    body: `Tài khoản vừa đăng nhập trên ${device}. Không phải mình? Mở Hồ sơ → Hugo Studio để đăng xuất máy lạ.`,
    url: '/profile',
    tag: 'edu-security',
  });
}
