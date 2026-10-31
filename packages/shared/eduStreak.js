// Chuỗi lửa của Education Hugo — "điểm danh bằng việc học". Hàm thuần, máy chủ
// (EduLearner) và giao diện (lịch, câu chuyện) dùng chung một luật.
//
// Luật (yêu cầu của chủ dự án, 31/10/2026):
//  - Ngày tính chuỗi = ngày (giờ VN) có qua ít nhất một bài trắc nghiệm step.
//  - Lỡ một ngày: ngày đó ĐÓNG BĂNG, chuỗi chưa mất nhưng không tăng.
//  - "Lửa phá băng" THAW_PRICE JOY: phá băng một ngày đã đóng → ngày đó tính như đã học.
//  - Một tháng có quá MAX_FREEZES ngày đóng băng (chưa phá) → mất chuỗi, đếm lại từ 0.
//  - Thưởng JOY ở các mốc STREAK_MILESTONES; sau 150 cứ mỗi 25 ngày thêm một mốc.

export const THAW_PRICE = 250;
export const MAX_FREEZES = 3;
const KEEP_DAYS = 400; // lịch giữ ~13 tháng gần nhất

// Thưởng tăng dần nhưng mỗi ngày giữ lửa vẫn chỉ "đáng" 10–20 JOY, để chuỗi là
// niềm vui chứ không thành chỗ cày JOY: 1.000 JOY = 10 ngày duy trì tài khoản.
export const STREAK_MILESTONES = [
  [3, 30], [7, 70], [14, 150], [21, 220], [30, 350],
  [50, 600], [75, 900], [100, 1300], [125, 1600], [150, 2000],
];
const AFTER_150 = 2000;

export function milestoneJoy(count) {
  const hit = STREAK_MILESTONES.find(([day]) => day === count);
  if (hit) return hit[1];
  return count > 150 && (count - 150) % 25 === 0 ? AFTER_150 : 0;
}

export function nextMilestone(count) {
  const hit = STREAK_MILESTONES.find(([day]) => day > count);
  if (hit) return { day: hit[0], joy: hit[1] };
  const day = 150 + Math.ceil((count - 149) / 25) * 25;
  return { day, joy: AFTER_150 };
}

// ── Ngày dạng "YYYY-MM-DD" (lịch VN, không giờ) ─────────────────────────────
const DAY_MS = 86400000;
const toUTC = (day) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
export const addDays = (day, n) => new Date(toUTC(day) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (from, to) => Math.round((toUTC(to) - toUTC(from)) / DAY_MS);


export function cleanStreak(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const days = (list) => (Array.isArray(list) ? list.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) : []);
  return {
    count: Math.max(0, Number(s.count) || 0),
    best: Math.max(0, Number(s.best) || 0),
    start: s.start || '',
    last: s.last || '',
    studied: days(s.studied),
    frozen: days(s.frozen),
    thawed: days(s.thawed),
    paid: Array.isArray(s.paid) ? s.paid.map(Number).filter(Boolean) : [],
    lostOn: s.lostOn || '',
  };
}

const trim = (list, today) => list.filter((d) => daysBetween(d, today) <= KEEP_DAYS);

/** Số ngày đóng băng (chưa phá) trong tháng `month` ("YYYY-MM") của chuỗi đang chạy. */
export function freezesInMonth(state, month) {
  return state.frozen.filter((d) => d.startsWith(month) && state.start && d >= state.start).length;
}

/**
 * Đưa chuỗi tới hôm nay: những ngày lỡ giữa lần học cuối và hôm nay thành ngày
 * đóng băng; tháng nào quá MAX_FREEZES thì mất chuỗi. Không đổi gì nếu chưa có chuỗi.
 */
export function settleStreak(raw, today) {
  const s = cleanStreak(raw);
  if (!s.count || !s.last || s.last >= today) return s;
  const frozen = new Set(s.frozen);
  for (let d = addDays(s.last, 1); d < today; d = addDays(d, 1)) {
    if (!s.studied.includes(d) && !s.thawed.includes(d)) frozen.add(d);
  }
  s.frozen = trim([...frozen].sort(), today);
  const months = new Set(s.frozen.filter((d) => d >= s.start).map((d) => d.slice(0, 7)));
  const lost = [...months].some((month) => freezesInMonth(s, month) > MAX_FREEZES);
  if (lost) {
    // Ngày mất chuỗi = ngày đóng băng thứ (MAX_FREEZES + 1) của tháng đầu tiên vượt.
    const month = [...months].sort().find((m) => freezesInMonth(s, m) > MAX_FREEZES);
    s.lostOn = s.frozen.filter((d) => d.startsWith(month) && d >= s.start)[MAX_FREEZES];
    s.count = 0;
    s.start = '';
    s.paid = [];
  }
  return s;
}

function bump(s) {
  s.count += 1;
  s.best = Math.max(s.best, s.count);
  const joy = s.paid.includes(s.count) ? 0 : milestoneJoy(s.count);
  if (joy) s.paid = [...s.paid, s.count];
  return joy ? { day: s.count, joy } : null;
}

/** Qua một bài hôm nay. Trả { state, milestone } — milestone khi vừa chạm mốc thưởng. */
export function studyToday(raw, today) {
  const s = settleStreak(raw, today);
  if (s.studied.includes(today)) return { state: s, milestone: null };
  s.studied = trim([...s.studied, today], today);
  if (!s.count) { s.start = today; s.lostOn = ''; }
  s.last = today;
  const milestone = bump(s);
  return { state: s, milestone };
}

/** Phá băng ngày `day`. Ném lỗi có `code` nếu không hợp lệ. */
export function thawDay(raw, day, today) {
  const s = settleStreak(raw, today);
  if (!s.count) throw Object.assign(new Error('Chuỗi đã tắt, không còn ngày nào để phá băng.'), { code: 'STREAK_LOST' });
  if (!s.frozen.includes(day) || day < s.start) throw Object.assign(new Error('Ngày này không bị đóng băng.'), { code: 'NOT_FROZEN' });
  s.frozen = s.frozen.filter((d) => d !== day);
  s.thawed = trim([...s.thawed, day].sort(), today);
  const milestone = bump(s);
  return { state: s, milestone };
}

/** Bản gửi xuống client: trạng thái đã tính tới hôm nay + vài con số tiện vẽ. */
export function streakView(raw, today) {
  const s = settleStreak(raw, today);
  const month = today.slice(0, 7);
  return {
    ...s,
    today,
    studiedToday: s.studied.includes(today),
    // Hôm qua bị đóng băng = lửa đang nằm trong băng, chờ học hoặc phá băng.
    frozenNow: s.count > 0 && s.frozen.includes(addDays(today, -1)),
    freezesThisMonth: s.count ? freezesInMonth(s, month) : 0,
    next: nextMilestone(s.count),
    stage: stageOf(s.count),
  };
}

// ── Câu chuyện "Lửa Nhỏ" ────────────────────────────────────────────────────
// Mỗi chặng của ngọn lửa là một chương; ngọn lửa lớn dần khi chuỗi dài ra.
export const FLAME_STAGES = [
  { from: 0, id: 'ember' }, { from: 1, id: 'spark' }, { from: 3, id: 'candle' }, { from: 7, id: 'campfire' },
  { from: 14, id: 'torch' }, { from: 21, id: 'lantern' }, { from: 30, id: 'bonfire' }, { from: 50, id: 'lighthouse' },
  { from: 75, id: 'phoenix' }, { from: 100, id: 'sun' }, { from: 150, id: 'star' },
];
export function stageOf(count) {
  return [...FLAME_STAGES].reverse().find((stage) => count >= stage.from).id;
}

/** Chữ push theo chuỗi (máy chủ chọn ngôn ngữ theo từng thiết bị). `{n}` = số ngày. */
export const STREAK_PUSH = {
  vi: {
    remind: ['Lửa Nhỏ đang đợi bạn', 'Chuỗi {n} ngày — qua một bài hôm nay để lửa cháy thêm một ngày.'],
    remindNew: ['Nhóm một đốm lửa nhé', 'Qua một bài hôm nay là Lửa Nhỏ thức dậy. Chuỗi đầu tiên bắt đầu từ đây.'],
    nearMilestone: ['Còn 1 ngày là tới mốc {m}', 'Học hôm nay để nhận {joy} JOY ở mốc {m} ngày.'],
    lastCall: ['Còn vài giờ để giữ lửa', 'Lửa Nhỏ sắp đóng băng — một bài ngắn thôi là giữ được chuỗi {n} ngày.'],
    frozen: ['Lửa Nhỏ bị đóng băng rồi', 'Hôm qua bạn lỡ học. Học hôm nay để sưởi ấm, hoặc phá băng bằng 250 JOY. Đã đóng băng {f}/3 lần tháng này.'],
    milestone: ['Mốc {n} ngày!', 'Lửa Nhỏ lớn thêm rồi — bạn nhận {joy} JOY. Mở lịch lửa để xem chương mới.'],
  },
  en: {
    remind: ['Little Flame is waiting', '{n}-day streak — pass one lesson today to keep it burning.'],
    remindNew: ['Light a little spark', 'Pass one lesson today and Little Flame wakes up. Your first streak starts here.'],
    nearMilestone: ['1 day to your {m}-day milestone', 'Learn today to earn {joy} JOY at {m} days.'],
    lastCall: ['A few hours left to keep the flame', 'Little Flame is about to freeze — one short lesson keeps your {n}-day streak.'],
    frozen: ['Little Flame got frozen', 'You missed yesterday. Learn today to warm it up, or thaw it for 250 JOY. Frozen {f}/3 times this month.'],
    milestone: ['{n}-day milestone!', 'Little Flame grew — you earned {joy} JOY. Open the flame calendar for a new chapter.'],
  },
  zh: {
    remind: ['小火苗在等你', '已连续 {n} 天——今天通过一课，让火继续燃烧。'],
    remindNew: ['点亮一点小火花', '今天通过一课，小火苗就会醒来。你的第一段连续记录从这里开始。'],
    nearMilestone: ['离 {m} 天里程碑还差 1 天', '今天学习，即可在第 {m} 天获得 {joy} JOY。'],
    lastCall: ['只剩几个小时守住火苗', '小火苗快要结冰了——一节短课就能保住 {n} 天连续记录。'],
    frozen: ['小火苗被冻住了', '你昨天没学习。今天学习来温暖它，或花 250 JOY 破冰。本月已结冰 {f}/3 次。'],
    milestone: ['{n} 天里程碑！', '小火苗长大了——你获得 {joy} JOY。打开火焰日历看新的章节。'],
  },
};

export function streakPush(lang, key, vars = {}) {
  const [title, body] = (STREAK_PUSH[lang] || STREAK_PUSH.vi)[key];
  const fill = (text) => text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return { title: fill(title), body: fill(body) };
}
