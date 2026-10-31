import EduLearner from '../models/EduLearner.js';
import Bio from '../models/Bio.js';
import { accessDeadline } from '../utils/accountAccess.js';
import { sendEduPush } from '../utils/pushNotifier.js';
import { cleanEduPrefs, vnClock } from '../../../packages/shared/eduPrefs.js';
import { THAW_PRICE, addDays, nextMilestone, streakPush, streakView, studyToday, thawDay } from '../../../packages/shared/eduStreak.js';
import { awardJoy } from '../utils/joyService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const todayOf = (doc, day) => ({ done: doc?.day === day ? doc.dayDone : 0, goal: cleanEduPrefs(doc?.prefs).dailyGoal });

/** Mở app: ghi lần hoạt động, trả cài đặt + mục tiêu hôm nay. */
export async function eduSnapshot(email) {
  const doc = await EduLearner.findOneAndUpdate(
    { email },
    { $set: { lastActiveAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  const { day } = vnClock();
  return { prefs: cleanEduPrefs(doc.prefs), today: todayOf(doc, day), streak: streakView(doc.streak, day) };
}

/**
 * Ghi chuỗi có điều kiện theo `streakRev`: hai máy nộp bài cùng lúc thì một máy
 * thắng, máy kia đọc lại và tính lại — không cộng đôi ngày, không thưởng đôi mốc.
 */
async function writeStreak(email, change) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const doc = await EduLearner.findOne({ email }).select('streak streakRev').lean()
      || (await EduLearner.create({ email })).toObject();
    const result = change(doc.streak);
    const rev = doc.streakRev || 0;
    const saved = await EduLearner.updateOne(
      { email, $or: [{ streakRev: rev }, ...(rev ? [] : [{ streakRev: { $exists: false } }])] },
      { $set: { streak: result.state, streakRev: rev + 1, lastActiveAt: new Date() } },
    );
    if (saved.modifiedCount === 1) return result;
  }
  throw new Error('STREAK_BUSY');
}

/** Thưởng mốc chuỗi: JOY (nguồn checkin — chuỗi lửa là điểm danh bằng việc học) + push. */
async function payMilestone(email, milestone) {
  if (!milestone) return null;
  const { balance } = await awardJoy(email, milestone.joy, 'checkin', `Chuỗi lửa Education Hugo: mốc ${milestone.day} ngày`, { refId: `edu-streak-${milestone.day}`, notify: false });
  sendEduPush(email, { text: (lang) => streakPush(lang, 'milestone', { n: milestone.day, joy: milestone.joy }), url: '/learn?streak=1', tag: 'edu-streak' })
    .catch(() => {});
  return { ...milestone, balance };
}

/** Qua một bài trắc nghiệm (kể cả học lại): giữ lửa hôm nay. Trả chuỗi mới + mốc vừa đạt. */
export async function noteEduStudy(email) {
  const { day } = vnClock();
  const { state, milestone } = await writeStreak(email, (raw) => studyToday(raw, day));
  const paid = await payMilestone(email, milestone).catch((error) => {
    console.error('[edu streak milestone]', error.message);
    return null;
  });
  return { streak: streakView(state, day), milestone: paid };
}

/**
 * Phá băng một ngày: trừ THAW_PRICE JOY trước (awardJoy chặn số dư âm), rồi mới
 * ghi chuỗi; ghi hỏng (ngày đã được phá ở máy khác…) thì hoàn lại đúng số đó.
 */
export async function thawEduStreak(email, frozenDay) {
  const { day } = vnClock();
  const doc = await EduLearner.findOne({ email }).select('streak').lean();
  thawDay(doc?.streak, frozenDay, day); // kiểm hợp lệ trước khi trừ tiền (ném lỗi có code)
  const { balance } = await awardJoy(email, -THAW_PRICE, 'store_purchase', `Lửa phá băng chuỗi học ngày ${frozenDay}`, { notify: false });
  let result;
  try {
    result = await writeStreak(email, (raw) => thawDay(raw, frozenDay, day));
  } catch (error) {
    await awardJoy(email, THAW_PRICE, 'admin_adjustment', `Hoàn JOY: chưa phá băng được ngày ${frozenDay}`, { rawAmount: true, notify: false });
    throw error;
  }
  const paid = await payMilestone(email, result.milestone).catch(() => null);
  return { streak: streakView(result.state, day), milestone: paid, balance: paid?.balance ?? balance };
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

/**
 * Chạy mỗi giờ: nhắc theo CHUỖI LỬA — đúng giờ người học chọn nếu hôm nay chưa
 * giữ lửa (sắp tới mốc thì nói mốc), 21h gọi lần cuối trước khi đóng băng, 8h báo
 * lửa vừa đóng băng; lúc 9h báo hạn tài khoản còn 3 hoặc 1 ngày.
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
    const streak = streakView(doc.streak, day);
    if (streak.studiedToday) continue; // đã giữ lửa hôm nay thì thôi nhắc
    const next = nextMilestone(streak.count);
    const key = !streak.count ? 'remindNew' : next.day === streak.count + 1 ? 'nearMilestone' : 'remind';
    await sendEduPush(doc.email, {
      text: (lang) => streakPush(lang, key, { n: streak.count, m: next.day, joy: next.joy }),
      url: '/learn',
      tag: 'edu-reminder',
    });
    await EduLearner.updateOne({ _id: doc._id }, { $set: { remindedDay: day } });
    reminded += 1;
  }

  // 21h: lời gọi cuối cho chuỗi từ 3 ngày chưa học hôm nay — trước khi lửa đóng băng.
  // 8h: báo lửa vừa đóng băng hôm qua (học hôm nay hoặc phá băng 250 JOY).
  if (hour === 21 || hour === 8) {
    const field = hour === 21 ? 'lastCallDay' : 'frozenNoticeDay';
    const learners = await EduLearner.find({
      'prefs.reminder': { $ne: false },
      [field]: { $ne: day },
      'streak.count': { $gte: hour === 21 ? 3 : 1 },
      lastActiveAt: { $gte: new Date(now - 30 * DAY_MS) },
    }).select('email streak').limit(1000).lean();
    for (const doc of learners) {
      const streak = streakView(doc.streak, day);
      const send = hour === 21
        ? !streak.studiedToday && streak.count >= 3
        : streak.count > 0 && streak.frozen.includes(addDays(day, -1));
      if (!send) continue;
      await sendEduPush(doc.email, {
        text: (lang) => streakPush(lang, hour === 21 ? 'lastCall' : 'frozen', { n: streak.count, f: streak.freezesThisMonth }),
        url: '/learn?streak=1',
        tag: 'edu-streak',
      });
      await EduLearner.updateOne({ _id: doc._id }, { $set: { [field]: day } });
      reminded += 1;
    }
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
