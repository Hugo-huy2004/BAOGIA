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

/**
 * Chữ push Education Hugo kiểu Duolingo: Hugo tự xưng, ngắn, vui. KHÔNG emoji bàn phím (quy ước toàn hệ thống: chỉ đồ hoạ riêng). Mỗi khoá có
 * vài câu xoay vòng (`vars.v` = số thứ tự, máy chủ đặt theo ngày) để nhắc mỗi ngày không lặp.
 * Máy chủ chọn ngôn ngữ theo từng thiết bị; hộp thông báo dựng lại từ khoá + vars đã lưu.
 */
export const STREAK_PUSH = {
  vi: {
    remind: [
      ['Chào bạn! Hugo đây.', 'Tới giờ học rồi. Chỉ 5 phút cho một bài nhỏ là chuỗi {n} ngày cháy thêm một ngày.'],
      ['Nghỉ tay chút không?', 'Bài học không tự học được đâu nha. Chuỗi {n} ngày đang chờ bạn.'],
      ['Chào bạn! Hugo đây.', 'Cho thời gian dùng điện thoại đáng giá hơn nào — học một bài nhỏ ngay nhé!'],
      ['Lửa Nhỏ đang đợi bạn', 'Chuỗi {n} ngày — một bài nhỏ hôm nay là đủ giữ lửa.'],
    ],
    remindNew: [
      ['Chào bạn! Hugo đây.', 'Nhóm đốm lửa đầu tiên nhé — một bài nhỏ 5 phút là Lửa Nhỏ thức dậy.'],
      ['Bắt đầu nhỏ thôi', 'Một bài nhỏ hôm nay, một chuỗi dài ngày mai.'],
      ['Hugo nhớ bạn đó', 'Code không tự viết được đâu nha. Mở một bài nhỏ nhé!'],
    ],
    nearMilestone: [['Sắp tới mốc {m} ngày!', 'Học một bài nhỏ hôm nay để nhận {joy} JOY ở mốc {m} ngày.']],
    lastCall: [
      ['Còn vài giờ thôi!', 'Lửa Nhỏ sắp đóng băng — một bài ngắn là giữ được chuỗi {n} ngày.'],
      ['Hugo đang lo đó', 'Chuỗi {n} ngày sắp tắt. 5 phút thôi, cứu lửa nào!'],
    ],
    frozen: [['Lửa Nhỏ bị đóng băng rồi', 'Hôm qua bạn lỡ học. Học hôm nay để sưởi ấm, hoặc phá băng bằng 250 JOY. Đã đóng băng {f}/3 lần tháng này.']],
    milestone: [['Mốc {n} ngày!', 'Lửa Nhỏ lớn thêm rồi — bạn nhận {joy} JOY. Mở lịch lửa để xem chương mới.']],
    account: [['Tài khoản còn {d} ngày', 'Gia hạn bằng JOY trong Cửa hàng (hoặc xác minh học sinh – sinh viên để được 1 năm) để giữ tiến độ học.']],
    security: [['Có đăng nhập mới', 'Tài khoản vừa đăng nhập trên {device}. Không phải bạn? Mở Hồ sơ Hugo Studio để đăng xuất máy lạ.']],
    friendRequest: [['Lời mời kết bạn', '{name} muốn làm bạn học với bạn. Mở Bạn bè để đồng ý.']],
    friendAccepted: [['Đã thành bạn học', '{name} đã đồng ý kết bạn. Cùng thi đua tuần này nhé!']],
  },
  en: {
    remind: [
      ["Hi! It's Hugo.", "It's time for your daily lesson. Take 5 minutes now to keep your {n}-day streak burning."],
      ['Ready for a break?', "Your lessons won't take themselves. Your {n}-day streak is waiting."],
      ["Hi! It's Hugo.", 'Make your screen time count. Take a quick lesson now!'],
      ['Little Flame is waiting', '{n}-day streak — one short lesson today keeps it burning.'],
    ],
    remindNew: [
      ["Hi! It's Hugo.", 'Light your first spark — one 5-minute lesson wakes Little Flame up.'],
      ['Start small', 'One small lesson today, a long streak tomorrow.'],
      ['Hugo misses you', "Code won't write itself. Open a quick lesson!"],
    ],
    nearMilestone: [['Almost at {m} days!', 'Take one lesson today to earn {joy} JOY at {m} days.']],
    lastCall: [
      ['Only a few hours left!', 'Little Flame is about to freeze — one short lesson keeps your {n}-day streak.'],
      ["Hugo's getting worried", 'Your {n}-day streak is about to go out. 5 minutes to save it!'],
    ],
    frozen: [['Little Flame got frozen', 'You missed yesterday. Learn today to warm it up, or thaw it for 250 JOY. Frozen {f}/3 times this month.']],
    milestone: [['{n}-day milestone!', 'Little Flame grew — you earned {joy} JOY. Open the flame calendar for a new chapter.']],
    account: [['{d} days left on your account', 'Extend with JOY in the Shop (or verify as a student for a full year) to keep your progress.']],
    security: [['New sign-in', "Your account just signed in on {device}. Not you? Open Profile Hugo Studio to sign out unknown devices."]],
    friendRequest: [['Friend request', '{name} wants to be your study buddy. Open Friends to accept.']],
    friendAccepted: [['You are now friends', '{name} accepted your request. Race each other this week!']],
  },
  zh: {
    remind: [
      ['嗨！我是 Hugo。', '到学习时间啦。花 5 分钟学一节小课，让 {n} 天连续记录继续燃烧。'],
      ['想休息一下吗？', '课程可不会自己学完哦。你的 {n} 天连续记录在等你。'],
      ['嗨！我是 Hugo。', '让屏幕时间更有价值——现在就学一节小课吧！'],
      ['小火苗在等你', '已连续 {n} 天——今天一节小课就能守住火苗。'],
    ],
    remindNew: [
      ['嗨！我是 Hugo。', '点亮第一朵火花吧——5 分钟一节小课，小火苗就会醒来。'],
      ['从小处开始', '今天一节小课，明天一段长长的连续记录。'],
      ['Hugo 想你了', '代码可不会自己写出来。打开一节小课吧！'],
    ],
    nearMilestone: [['快到 {m} 天里程碑了！', '今天学一节小课，即可在第 {m} 天获得 {joy} JOY。']],
    lastCall: [
      ['只剩几个小时！', '小火苗快要结冰了——一节短课就能保住 {n} 天连续记录。'],
      ['Hugo 有点担心', '{n} 天连续记录快熄灭了。5 分钟救救火苗！'],
    ],
    frozen: [['小火苗被冻住了', '你昨天没学习。今天学习来温暖它，或花 250 JOY 破冰。本月已结冰 {f}/3 次。']],
    milestone: [['{n} 天里程碑！', '小火苗长大了——你获得 {joy} JOY。打开火焰日历看新的章节。']],
    account: [['账户还剩 {d} 天', '在商店用 JOY 续期（或验证学生身份获得 1 年），以保留学习进度。']],
    security: [['新的登录', '你的账户刚在 {device} 上登录。不是你？打开 个人资料 Hugo Studio 退出陌生设备。']],
    friendRequest: [['好友请求', '{name} 想和你成为学习伙伴。打开好友页面同意。']],
    friendAccepted: [['已成为好友', '{name} 同意了你的请求。本周一起比拼吧！']],
  },
};

/** `vars.v` chọn câu trong các biến thể (xoay vòng); thiếu thì câu đầu. */
export function streakPush(lang, key, vars = {}) {
  const variants = (STREAK_PUSH[lang] || STREAK_PUSH.vi)[key] || STREAK_PUSH.vi[key];
  if (!variants) return null;
  const [title, body] = variants[Math.abs(Number(vars.v) || 0) % variants.length];
  const fill = (text) => text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return { title: fill(title), body: fill(body) };
}
