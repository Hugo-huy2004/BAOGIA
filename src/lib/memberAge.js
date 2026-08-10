// Bản sao quy tắc tuổi phía client, dùng để ẩn bớt lối vào cho gọn mắt.
// Chốt chặn thật nằm ở server (server/utils/memberAge.js + requireAdultMember):
// ẩn nút không phải là cấm, người dùng gọi thẳng API vẫn được.
export const ADULT_AGE = 18;

/** null = chưa khai tháng/năm sinh. Đủ 18 kể từ tháng sinh nhật, không phải 01/01. */
export function memberAge(bio) {
  const year = Number(bio?.birthYear);
  const now = new Date();
  if (!Number.isInteger(year) || year < 1900 || year > now.getFullYear()) return null;
  const monthRaw = Number(bio?.birthMonth);
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : 12;
  const age = now.getFullYear() - year;
  return now.getMonth() + 1 >= month ? age : age - 1;
}

export const isMinorMember = (bio) => {
  const age = memberAge(bio);
  return age !== null && age < ADULT_AGE;
};

/** Ứng dụng chỉ dành cho thành viên từ 18 tuổi. */
export const ADULT_ONLY_APPS = new Set(["psychology"]);
