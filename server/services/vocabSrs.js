// Lặp lại ngắt quãng (SM-2 rút gọn) — trái tim "ôn tập khoa học" của app từ vựng.
//
// Ý tưởng: từ nào bạn nhớ tốt thì giãn dần khoảng ôn (1 ngày → 3 → tuần →
// tháng), từ nào quên thì kéo về ôn lại ngay. Nhờ vậy mỗi ngày chỉ ôn đúng
// những từ SẮP quên — đủ để 1-2 tháng phủ hết HSK3 mà không phải cày lại từ đã
// thuộc. Đây là hàm THUẦN (không I/O) để test được và chạy giống hệt ở mọi nơi.
//
// grade: 0=quên (again) · 1=khó (hard) · 2=được (good) · 3=dễ (easy)
const MIN_EASE = 1.3;
const AGAIN_MIN = 10 / (60 * 24); // 10 phút, tính theo ngày

const clampEase = (e) => Math.max(MIN_EASE, Math.round(e * 100) / 100);

export function schedule(state = {}, grade, now = Date.now()) {
  let { reps = 0, intervalDays = 0, ease = 2.5, lapses = 0 } = state;
  ease = clampEase(ease);
  let interval;

  if (grade <= 0) {
    // Quên: đưa về ôn lại sau ~10 phút, hạ độ dễ, đếm một lần "trượt".
    reps = 0; lapses += 1; ease = clampEase(ease - 0.2); interval = AGAIN_MIN;
  } else if (grade === 1) {
    // Khó: nhớ nhưng chật vật — giãn nhẹ, hạ độ dễ một chút.
    ease = clampEase(ease - 0.15);
    interval = reps === 0 ? 1 : Math.max(1, intervalDays * 1.2);
    reps += 1;
  } else {
    // Được / Dễ: giãn theo cấp số nhân của độ dễ.
    // "Dễ" ngay lần đầu = đã biết sẵn → cho thuộc luôn (60 ngày), không bắt
    // học lại; nó vào lịch sử "đã thuộc". Người học nhanh không phí thời gian.
    if (reps === 0) interval = grade === 3 ? 60 : 1;
    else if (reps === 1) interval = grade === 3 ? 5 : 3;
    else interval = intervalDays * ease * (grade === 3 ? 1.3 : 1);
    if (grade === 3) ease = clampEase(ease + 0.15);
    reps += 1;
  }

  interval = grade <= 0 ? interval : Math.min(Math.round(interval), 365);
  const status = grade <= 0 ? 'learning' : interval >= 21 ? 'mastered' : 'review';
  return {
    reps,
    lapses,
    ease,
    intervalDays: interval,
    status,
    dueAt: new Date(now + interval * 24 * 60 * 60 * 1000),
    lastReviewedAt: new Date(now),
  };
}

// Một từ coi là "đã thuộc" khi khoảng ôn vượt 21 ngày — mốc trí nhớ dài hạn
// tiêu chuẩn, dùng để đo tiến độ tới HSK3.
export const MASTERED_INTERVAL_DAYS = 21;


// Chuỗi ngày học liên tục — động lực giữ thói quen mỗi ngày, thứ thật sự quyết
// định có tiến bộ trong nhiều tháng hay không. Hàm thuần: nhận mốc ngày cũ +
// hôm nay (chuỗi 'YYYY-MM-DD'), trả chuỗi mới.
//   • học tiếp hôm nay đã tính → giữ nguyên, chỉ +1 lượt
//   • học nối ngày liền trước → +1 chuỗi
//   • bỏ cách ngày → chuỗi reset về 1
export function nextStreak({ streak = 0, lastStudyDay = '', reviewsToday = 0 } = {}, today, yesterday) {
  if (lastStudyDay === today) return { streak: Math.max(1, streak), lastStudyDay: today, reviewsToday: reviewsToday + 1 };
  if (lastStudyDay === yesterday) return { streak: streak + 1, lastStudyDay: today, reviewsToday: 1 };
  return { streak: 1, lastStudyDay: today, reviewsToday: 1 };
}

// Mốc ngày UTC (đủ dùng; nếu cần theo múi giờ người dùng thì truyền offset vào).
export function dayKey(ts = Date.now()) {
  return new Date(ts).toISOString().slice(0, 10);
}

// ── BỘ THEO DÕI THÍCH ỨNG + CỐ VẤN (hàm thuần) ──────────────────────────────

// Trung bình động hàm mũ: mượt, nhớ gần đây hơn, không cần lưu cả chuỗi.
export function ewma(prev, x, alpha = 0.25) {
  if (!Number.isFinite(x)) return prev || 0;
  return prev ? Math.round(((1 - alpha) * prev + alpha * x) * 1000) / 1000 : x;
}

// Cộng dồn vào nhật ký ngày (tối đa `cap` mục). Bất biến — trả mảng mới.
export function bumpHistory(history = [], today, { r = 0, c = 0, n = 0 } = {}, cap = 60) {
  const out = Array.isArray(history) ? history.slice(-cap) : [];
  const last = out[out.length - 1];
  if (last && last.d === today) {
    out[out.length - 1] = { d: today, r: (last.r || 0) + r, c: (last.c || 0) + c, n: (last.n || 0) + n };
  } else {
    out.push({ d: today, r, c, n });
  }
  return out.slice(-cap);
}

// Số ngày dự kiến để thuộc hết phần còn lại, theo nhịp thuộc/ngày gần đây.
export function projectDaysToGoal(remaining, masteredPerDay) {
  if (remaining <= 0) return 0;
  if (!masteredPerDay || masteredPerDay <= 0) return Infinity;
  return Math.ceil(remaining / masteredPerDay);
}

// Cố vấn: chọn LỜI KHUYÊN khoa học theo trạng thái người học. Thứ tự ưu tiên =
// việc quan trọng nhất lúc này. Thuần → dễ test, chạy giống nhau mọi nơi.
// state: { streakAlive, studiedToday, dueNow, overdue, weakCount, accuracy,
//          onTrack, remaining, newRec, reviewRec }
export function coachTip(s = {}) {
  if (!s.studiedToday && s.streakAlive) return { tone: 'warn', key: 'keepStreak' };   // giữ chuỗi kẻo mất
  if (s.overdue >= 20) return { tone: 'warn', key: 'clearBacklog' };                   // ôn tồn trước khi học mới
  if (s.weakCount >= 5) return { tone: 'warn', key: 'drillWeak' };                     // luyện từ hay quên
  if (s.accuracy && s.accuracy < 0.6) return { tone: 'info', key: 'slowDown' };        // chậm lại, chắc từng từ
  if (s.dueNow > 0) return { tone: 'info', key: 'reviewFirst' };                       // ôn đến hạn đã
  if (s.remaining <= 0) return { tone: 'good', key: 'levelDone' };                     // xong bậc → thi/vượt
  if (s.accuracy && s.accuracy >= 0.9) return { tone: 'good', key: 'learnMore' };      // đang tốt, thêm từ mới
  return { tone: 'info', key: 'steady' };                                              // đều đặn mỗi ngày
}
