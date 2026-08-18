/**
 * Kiểm tra thông tin cá nhân định kỳ (chống khai man).
 *
 * Ý tưởng: người khai thật nhớ được thông tin của mình mãi mãi; người khai bừa
 * thì vài tuần sau đã quên mình từng bịa số nào. Nên thay vì kiểm lúc đăng ký
 * (ai cũng qua được), hệ thống hỏi lại vào những mốc ngày càng thưa dần.
 *
 * Mỗi đợt chỉ hỏi MỘT món, xoay vòng: điện thoại → ngày sinh → OTP email.
 * Không đoán được lần tới hỏi gì nên vẫn phải nhớ đủ cả bộ, mà người dùng thật
 * thì mỗi lần chỉ tốn mươi giây.
 */
import { revokeMemberSession } from './memberSession.js';

// Đúng một lần thì lần sau hỏi thưa hơn: người đã chứng minh nhiều lần không
// đáng bị làm phiền như người vừa vào. Chạm mốc cuối thì giữ nguyên ~6 tháng.
export const SCHEDULE_DAYS = [7, 14, 30, 90, 180];

// Xoay vòng câu hỏi. 'email' là bước nặng nhất (phải mở hòm thư) nên xếp cuối.
export const FIELD_ROTATION = ['phone', 'birthday', 'email'];

// Sai lần đầu coi như gõ nhầm — số điện thoại và ngày sinh gõ sai rất dễ. Sai
// lần thứ hai trong CÙNG một đợt mới là khai man.
export const MAX_ATTEMPTS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Chỉ giữ chữ số: "0912 345 678", "+84 912-345-678" phải được coi là một. */
export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  // 0912… và +84912… là cùng một số: bỏ mã quốc gia VN rồi so phần đuôi.
  const local = digits.replace(/^84/, '').replace(/^0/, '');
  return local;
}

/** Chấp nhận mọi kiểu gõ ngày: 20/09/2008, 20-9-2008, 2008/09/20. */
export function parseBirthInput(value) {
  const nums = String(value || '').match(/\d+/g);
  if (!nums || nums.length < 3) return null;
  const parts = nums.map(Number);
  // Năm là số 4 chữ số ở đầu hoặc cuối; còn lại theo thứ tự ngày, tháng.
  const yearIdx = parts.findIndex((n) => n > 1900);
  if (yearIdx === -1) return null;
  const year = parts[yearIdx];
  const rest = parts.filter((_, i) => i !== yearIdx);
  const [a, b] = rest;
  // Số > 12 chắc chắn là ngày; còn lại giữ quy ước ngày/tháng của người Việt.
  const day = a > 12 ? a : (b > 12 ? b : a);
  const month = a > 12 ? b : (b > 12 ? a : b);
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return null;
  return { year, month, day };
}

/** Món nào hỏi được với hồ sơ này (chưa khai thì không có gì để đối chiếu). */
export function availableFields(bio) {
  const fields = [];
  if (normalizePhone(bio.phone)) fields.push('phone');
  if (bio.birthYear && bio.birthMonth && bio.birthDay) fields.push('birthday');
  if (bio.email) fields.push('email');
  return fields;
}

/** Món tiếp theo trong vòng xoay, bỏ qua những món hồ sơ chưa có dữ liệu. */
export function nextField(bio) {
  const available = availableFields(bio);
  if (!available.length) return null;
  const last = bio.identityCheck?.lastField || '';
  const start = FIELD_ROTATION.indexOf(last) + 1;
  for (let i = 0; i < FIELD_ROTATION.length; i++) {
    const candidate = FIELD_ROTATION[(start + i) % FIELD_ROTATION.length];
    if (available.includes(candidate)) return candidate;
  }
  return null;
}

/** Đợt kiểm tra đã tới hạn chưa. Hồ sơ chưa có lịch thì hẹn mốc đầu tiên. */
export function isDue(bio, now = Date.now()) {
  const due = bio.identityCheck?.nextDueAt;
  if (!due) return false;
  return new Date(due).getTime() <= now;
}

/** Hẹn mốc kế tiếp. `advance` = vừa trả lời đúng nên được giãn ra xa hơn. */
export function scheduleNext(bio, { advance = true, now = Date.now() } = {}) {
  const current = bio.identityCheck?.tier ?? 0;
  const tier = advance ? Math.min(current + 1, SCHEDULE_DAYS.length - 1) : current;
  bio.identityCheck = {
    ...(bio.identityCheck?.toObject?.() || bio.identityCheck || {}),
    tier,
    nextDueAt: new Date(now + SCHEDULE_DAYS[tier] * DAY_MS),
    attempts: 0,
    pendingField: '',
  };
  return bio.identityCheck;
}

/**
 * So câu trả lời với hồ sơ. KHÔNG dùng cho 'email' — món đó xác thực bằng OTP
 * gửi tới chính hòm thư, không phải bằng gõ lại địa chỉ.
 */
export function matchesProfile(bio, field, answer) {
  if (field === 'phone') {
    const stored = normalizePhone(bio.phone);
    return Boolean(stored) && stored === normalizePhone(answer);
  }
  if (field === 'birthday') {
    const input = parseBirthInput(answer);
    if (!input) return false;
    return input.year === Number(bio.birthYear)
      && input.month === Number(bio.birthMonth)
      && input.day === Number(bio.birthDay);
  }
  return false;
}

/** Người dùng vừa trả lời đúng: ghi nhận và giãn lịch. */
export async function recordPass(bio, field, now = Date.now()) {
  const prev = bio.identityCheck?.toObject?.() || bio.identityCheck || {};
  bio.identityCheck = {
    ...prev,
    lastField: field,
    lastVerifiedAt: new Date(now),
    failStreak: 0,
  };
  scheduleNext(bio, { advance: true, now });
  await bio.save();
  return bio.identityCheck;
}

/**
 * Trả lời sai. Chưa hết lượt thì chỉ đếm thêm; hết lượt thì thu hồi phiên đăng
 * nhập và báo cho nơi gọi biết để khoá tài khoản.
 */
export async function recordFail(bio, field, now = Date.now()) {
  const prev = bio.identityCheck?.toObject?.() || bio.identityCheck || {};
  const attempts = (prev.attempts || 0) + 1;
  const exhausted = attempts >= MAX_ATTEMPTS;

  bio.identityCheck = {
    ...prev,
    pendingField: field,
    attempts,
    lastFailedAt: new Date(now),
    failStreak: exhausted ? (prev.failStreak || 0) + 1 : (prev.failStreak || 0),
  };
  await bio.save();

  if (exhausted) {
    // Đăng xuất mọi thiết bị: tài khoản sắp bị khoá thì phiên đang mở cũng
    // không được sống tiếp.
    await revokeMemberSession(bio, 'Hệ thống kiểm tra thông tin định kỳ');
  }

  return { attempts, attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts), exhausted };
}

export default {
  SCHEDULE_DAYS, FIELD_ROTATION, MAX_ATTEMPTS,
  normalizePhone, parseBirthInput, availableFields, nextField,
  isDue, scheduleNext, matchesProfile, recordPass, recordFail,
};
