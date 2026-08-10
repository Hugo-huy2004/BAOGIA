export const MEMBER_MIN_AGE = 14;
export const ADULT_AGE = 18;

/**
 * Tuổi tính theo đúng ngày sinh nhật: sinh 20/09/2008 thì đủ 18 vào 20/09/2026.
 *
 * Thiếu ngày thì coi như ngày 31, thiếu tháng thì coi như tháng 12 (fail-closed:
 * sinh nhật muộn nhất có thể). Thiếu năm thì trả null — "không biết tuổi",
 * KHÔNG phải "đủ tuổi".
 */
export function ageFromBirth(birthYear, birthMonth, birthDay) {
  const year = Number(birthYear);
  const now = new Date();
  if (!Number.isInteger(year) || year < 1900 || year > now.getFullYear()) return null;

  const monthRaw = Number(birthMonth);
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : 12;
  const dayRaw = Number(birthDay);
  const day = Number.isInteger(dayRaw) && dayRaw >= 1 && dayRaw <= 31 ? dayRaw : 31;

  const age = now.getFullYear() - year;
  const nowMonth = now.getMonth() + 1;
  if (nowMonth > month) return age;
  if (nowMonth < month) return age - 1;
  return now.getDate() >= day ? age : age - 1;
}

export const isAdultAge = (age) => age !== null && age >= ADULT_AGE;
export const isMinorAge = (age) => age !== null && age < ADULT_AGE;

/** Tuổi của một Bio đã nạp sẵn — dùng khi route đã có document trong tay. */
export const bioAge = (bio) => ageFromBirth(bio?.birthYear, bio?.birthMonth, bio?.birthDay);

/** null = chưa khai sinh nhật (chưa xác định), khác null = tuổi thật. */
export async function getMemberAge(email) {
  if (!email) return null;
  // Nạp model động: file này phải import được từ test ở gốc repo, nơi
  // server/node_modules (mongoose) không tồn tại trên CI.
  const Bio = (await import('../models/Bio.js')).default;
  const bio = await Bio.findOne({ email: String(email).toLowerCase() }, 'birthYear birthMonth birthDay').lean();
  return bioAge(bio);
}

/** Email của những tài khoản vị thành niên trong một danh sách — dùng để che
 *  tên trên bảng xếp hạng và loại khỏi kết quả tìm kiếm. */
export async function minorEmailSet(emails) {
  const list = [...new Set(emails.map((e) => String(e || '').toLowerCase().trim()).filter(Boolean))];
  if (!list.length) return new Set();
  const Bio = (await import('../models/Bio.js')).default;
  const bios = await Bio.find({ email: { $in: list } }, 'email birthYear birthMonth birthDay').lean();
  return new Set(bios.filter((b) => isMinorAge(bioAge(b))).map((b) => b.email.toLowerCase()));
}
