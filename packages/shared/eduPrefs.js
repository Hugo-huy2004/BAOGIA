// Cài đặt cá nhân của Education Hugo — lưu trên máy chủ (EduLearner) để mọi
// máy cùng tài khoản dùng chung; client và máy chủ cùng làm sạch bằng hàm này.

export const EDU_GOALS = [1, 2, 3, 5];
export const EDU_REMINDER_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h–22h
export const EDU_THEMES = ['system', 'light', 'dark'];
export const EDU_TEXT_SIZES = ['md', 'lg'];

export const EDU_DEFAULT_PREFS = Object.freeze({
  dailyGoal: 1,
  reminder: true,
  reminderHour: 20,
  notifyAccount: true,
  notifySecurity: true,
  theme: 'system',
  textSize: 'md',
  sound: true,
});

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

/** Ghép `input` lên `base`, bỏ mọi khoá lạ và giá trị ngoài danh sách cho phép. */
export function cleanEduPrefs(input = {}, base = EDU_DEFAULT_PREFS) {
  const src = input && typeof input === 'object' ? input : {};
  return {
    dailyGoal: pick(Number(src.dailyGoal), EDU_GOALS, base.dailyGoal),
    reminder: bool(src.reminder, base.reminder),
    reminderHour: pick(Number(src.reminderHour), EDU_REMINDER_HOURS, base.reminderHour),
    notifyAccount: bool(src.notifyAccount, base.notifyAccount),
    notifySecurity: bool(src.notifySecurity, base.notifySecurity),
    theme: pick(src.theme, EDU_THEMES, base.theme),
    textSize: pick(src.textSize, EDU_TEXT_SIZES, base.textSize),
    sound: bool(src.sound, base.sound),
  };
}

/** "YYYY-MM-DD" và giờ theo giờ Việt Nam — mục tiêu ngày và giờ nhắc tính theo đây. */
export function vnClock(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
