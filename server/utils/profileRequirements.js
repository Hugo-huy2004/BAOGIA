import { ageFromBirth, MEMBER_MIN_AGE } from './memberAge.js';

/**
 * MỘT danh sách duy nhất về "hồ sơ còn thiếu gì".
 *
 * Trước đây client tự đoán còn thiếu gì, server lại kiểm theo luật của riêng
 * nó. Hai bên lệch nhau là hỏng: modal không hiện ô ngày sinh nhưng server vẫn
 * bắt buộc, POST trả 400, onboarding không bao giờ xong — kéo theo mã giới
 * thiệu nhập trong modal cũng không được áp dụng, và lần nào vào cũng bị hỏi
 * lại. Giờ server là nguồn sự thật: nó liệt kê thiếu gì, client chỉ hiển thị
 * đúng chừng ấy ô.
 *
 * Thêm một thông tin bắt buộc trong tương lai = thêm một mục ở đây. Không phải
 * sửa modal, không phải sửa route.
 */
export const PROFILE_FIELDS = [
  {
    key: 'birthDate',
    type: 'birthDate',
    label: 'Ngày sinh',
    hint: 'Chỉ khai một lần rồi khoá. Dùng để xác định tính năng phù hợp độ tuổi và mở quà tháng sinh nhật.',
    required: true,
    isMissing: (bio) => !bio.birthYear,
    apply(bio, value) {
      const day = Number(value?.birthDay);
      const month = Number(value?.birthMonth);
      const year = Number(value?.birthYear);
      const thisYear = new Date().getFullYear();
      const valid = Number.isInteger(day) && day >= 1 && day <= 31
        && Number.isInteger(month) && month >= 1 && month <= 12
        && Number.isInteger(year) && year >= 1900 && year <= thisYear
        && new Date(year, month - 1, day).getDate() === day;
      if (!valid) throw new Error('Ngày sinh không hợp lệ.');
      if (ageFromBirth(year, month, day) < MEMBER_MIN_AGE) {
        throw new Error(`Hugo Studio chỉ dành cho người từ đủ ${MEMBER_MIN_AGE} tuổi.`);
      }
      bio.birthDay = day;
      bio.birthMonth = month;
      bio.birthYear = year;
    },
  },
  {
    key: 'phone',
    type: 'tel',
    label: 'Số điện thoại / Zalo',
    hint: 'Dùng để liên hệ khi cần và để tạo mã giới thiệu của bạn.',
    required: true,
    isMissing: (bio) => !String(bio.phone || '').trim(),
    apply(bio, value) {
      const phone = String(value || '').trim();
      if (!/^[+()\d\s.-]{8,24}$/.test(phone)) throw new Error('Số điện thoại không hợp lệ.');
      bio.phone = phone;
    },
  },
];

/** Chỉ những mục BẮT BUỘC còn trống — đây là thứ chặn onboarding. */
export function missingProfileFields(bio) {
  if (!bio) return [];
  return PROFILE_FIELDS.filter((field) => field.required && field.isMissing(bio));
}

/** Bản rút gọn gửi xuống client để dựng form. */
export const describeField = ({ key, type, label, hint }) => ({ key, type, label, hint });

/**
 * Ghi những giá trị client gửi lên. Chỉ đụng tới mục CÓ trong payload — gửi
 * thiếu thì bỏ qua chứ không báo lỗi, nên client cũ hay form một nửa cũng
 * không làm hỏng cả request. Trả về danh sách mục đã ghi.
 */
export function applyProfileValues(bio, values = {}) {
  const applied = [];
  for (const field of PROFILE_FIELDS) {
    const value = field.type === 'birthDate' ? values : values[field.key];
    const provided = field.type === 'birthDate'
      ? [values?.birthDay, values?.birthMonth, values?.birthYear].every((part) => part !== undefined && part !== '')
      : value !== undefined && value !== '';
    if (!provided || !field.isMissing(bio)) continue;
    field.apply(bio, value);
    applied.push(field.key);
  }
  return applied;
}
