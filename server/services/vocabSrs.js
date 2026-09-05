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
