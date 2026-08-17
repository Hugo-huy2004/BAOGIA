import { ageFromBirth, bioAge, MEMBER_MIN_AGE, GUARDIAN_CONSENT_AGE } from './memberAge.js';
import { JOY_DENOMS, DENOM_OPTIONS } from '../../shared/joyCurrency.js';

// Ngôn ngữ hợp lệ = ngôn ngữ có đơn vị JOY. Mỗi ngôn ngữ giao diện buộc phải có
// một đơn vị (shared/joyCurrency.test.js canh đúng điều đó), nên danh sách này
// không thể lệch với SUPPORTED_LANGUAGES mà không làm test đỏ. Server không giữ
// nhãn hiển thị — client tự dịch từ mã.
const LANGUAGE_CODES = Object.keys(JOY_DENOMS);
const languageCode = (value) => {
  const code = String(value || '').toLowerCase().replace('_', '-').split('-')[0];
  return LANGUAGE_CODES.includes(code) ? code : null;
};

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
    // Hỏi TRƯỚC mọi mục khác: người dùng chọn xong là cả form đổi sang tiếng đó.
    key: 'language',
    type: 'choice',
    label: 'Ngôn ngữ chính',
    hint: 'Giao diện sẽ tự chuyển sang ngôn ngữ này.',
    options: LANGUAGE_CODES.map((value) => ({ value })),
    required: true,
    isMissing: (bio) => !languageCode(bio.language),
    apply(bio, value) {
      const code = languageCode(value);
      if (!code) throw new Error('Ngôn ngữ không hợp lệ.');
      bio.language = code;
    },
  },
  {
    // Hỏi NGAY sau ngôn ngữ và chỉ hỏi một lần trong đời tài khoản. Xem chú thích
    // ở `Bio.joyDenom`: đơn vị đổi được tuỳ ý là né được phí đổi đơn vị.
    key: 'joyDenom',
    type: 'choice',
    label: 'Đơn vị JOY',
    hint: 'Chọn một lần rồi cố định. Đổi ngôn ngữ giao diện sau này KHÔNG đổi đơn vị này.',
    options: DENOM_OPTIONS.map(({ key }) => ({ value: key })),
    required: true,
    isMissing: (bio) => !JOY_DENOMS[bio.joyDenom],
    apply(bio, value) {
      if (!JOY_DENOMS[value]) throw new Error('Đơn vị JOY không hợp lệ.');
      bio.joyDenom = value;
    },
  },
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
    // Chỉ hỏi khi đã biết tuổi và tuổi nằm trong khoảng 14–15. Vì `isMissing`
    // đọc ngày sinh vừa ghi ở mục trên, lượt onboarding đầu tiên chưa hỏi mục
    // này; server tính lại `missing` sau khi lưu nên modal sẽ hỏi ngay ở bước
    // kế tiếp thay vì đóng lại.
    key: 'guardianConsent',
    type: 'checkbox',
    label: 'Xác nhận của cha mẹ / người giám hộ',
    hint: `Bạn chưa đủ ${GUARDIAN_CONSENT_AGE} tuổi. Theo tiêu chuẩn bảo vệ người chưa thành niên của Hugo Studio, cha mẹ hoặc người giám hộ cần đọc Chính sách bảo mật và đồng ý trước khi tài khoản tiếp tục xử lý dữ liệu.`,
    checkboxLabel: 'Cha mẹ hoặc người giám hộ của tôi đã đọc Chính sách bảo mật và đồng ý cho tôi dùng Hugo Studio.',
    required: true,
    isMissing: (bio) => {
      const age = bioAge(bio);
      return age !== null && age < GUARDIAN_CONSENT_AGE && !bio.guardianConsentAt;
    },
    apply(bio, value) {
      if (value !== true && value !== 'true') {
        throw new Error('Cần xác nhận của cha mẹ hoặc người giám hộ để tiếp tục.');
      }
      bio.guardianConsentAt = new Date();
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
export const describeField = ({ key, type, label, hint, checkboxLabel, options }) => (
  {
    key, type, label, hint,
    ...(checkboxLabel ? { checkboxLabel } : {}),
    ...(options ? { options } : {}),
  }
);

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
