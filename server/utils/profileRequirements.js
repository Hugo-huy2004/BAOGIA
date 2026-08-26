import { ageFromBirth, bioAge, MEMBER_MIN_AGE, GUARDIAN_CONSENT_AGE } from './memberAge.js';
import { JOY_DENOMS, DENOM_ACCOUNT_OPTIONS } from '../../shared/joyCurrency.js';

// Ngôn ngữ hợp lệ = ngôn ngữ có đơn vị JOY. Mỗi ngôn ngữ giao diện buộc phải có
// một đơn vị (shared/joyCurrency.test.js canh đúng điều đó), nên danh sách này
// không thể lệch với SUPPORTED_LANGUAGES mà không làm test đỏ. Server không giữ
// nhãn hiển thị — client tự dịch từ mã.
const LANGUAGE_CODES = Object.keys(JOY_DENOMS);
export const COUNTRY_CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const RELIGION_CODES = [
  'buddhism_theravada', 'buddhism_mahayana', 'buddhism_vajrayana', 'buddhism_pure_land', 'buddhism_zen',
  'christianity_roman_catholic', 'christianity_eastern_orthodox', 'christianity_oriental_orthodox',
  'christianity_anglican', 'christianity_lutheran', 'christianity_reformed_presbyterian',
  'christianity_baptist', 'christianity_methodist', 'christianity_pentecostal',
  'christianity_seventh_day_adventist', 'christianity_latter_day_saints', 'christianity_jehovahs_witnesses',
  'islam_sunni', 'islam_shia', 'islam_ibadi', 'islam_ahmadiyya',
  'hinduism_vaishnavism', 'hinduism_shaivism', 'hinduism_shaktism', 'hinduism_smartism',
  'judaism_orthodox', 'judaism_conservative_masorti', 'judaism_reform', 'judaism_reconstructionist',
  'sikhism', 'jainism', 'bahai_faith', 'zoroastrianism', 'shinto', 'taoism', 'confucianism',
  'caodaism', 'hoahao_buddhism', 'tenrikyo', 'cheondoism', 'rastafari',
  'self_describe', 'none', 'prefer_not_to_say',
];

const sensitiveAnswer = (value, maxLength = 120) => {
  const answer = String(value || '').trim();
  if (!answer || answer.length > maxLength) throw new Error('Thông tin cung cấp không hợp lệ.');
  return answer;
};
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
    options: DENOM_ACCOUNT_OPTIONS.map(({ key }) => ({ value: key })),
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
  {
    key: 'countryCode',
    type: 'country',
    label: 'Quốc gia / vùng lãnh thổ',
    hint: 'Chọn nơi bạn đang sinh sống để Hugo Studio chuẩn bị trải nghiệm phù hợp theo khu vực.',
    options: COUNTRY_CODES.map((value) => ({ value })),
    required: true,
    isMissing: (bio) => !COUNTRY_CODES.includes(String(bio.countryCode || '').toUpperCase()),
    apply(bio, value) {
      const code = String(value || '').toUpperCase();
      if (!COUNTRY_CODES.includes(code)) throw new Error('Quốc gia không hợp lệ.');
      bio.countryCode = code;
    },
  },
  {
    key: 'adminArea',
    type: 'addressPart',
    label: 'Tỉnh / Thành phố / Bang',
    hint: 'Nhập đơn vị hành chính cấp tỉnh, thành phố hoặc bang theo quốc gia đã chọn.',
    required: true,
    isMissing: (bio) => !String(bio.adminArea || '').trim(),
    apply(bio, value) {
      bio.adminArea = sensitiveAnswer(value, 120);
    },
  },
  {
    key: 'locality',
    type: 'addressPart',
    label: 'Phường / Xã / Khu vực',
    hint: 'Nhập đơn vị hành chính địa phương tương ứng nơi bạn đang ở.',
    required: true,
    isMissing: (bio) => !String(bio.locality || '').trim(),
    apply(bio, value) {
      bio.locality = sensitiveAnswer(value, 120);
    },
  },
  {
    key: 'exactAddress',
    type: 'addressDetail',
    label: 'Địa chỉ chi tiết',
    hint: 'Chỉ ghi phần còn lại như số nhà, tên đường, toà nhà. Quốc gia và đơn vị hành chính đã được lưu ở các bước trước.',
    required: true,
    isMissing: (bio) => !String(bio.exactAddress || '').trim(),
    apply(bio, value) {
      const address = sensitiveAnswer(value, 500);
      if (address.length < 8) throw new Error('Địa chỉ cần ghi đầy đủ hơn.');
      bio.exactAddress = address;
    },
  },
  {
    key: 'locationVerification',
    type: 'locationVerification',
    label: 'Xác minh vị trí trên bản đồ',
    hint: 'Cho phép định vị, kiểm tra điểm ghim rồi xác nhận đây là vị trí đúng. Toạ độ được mã hoá và không hiển thị công khai.',
    required: true,
    isMissing: (bio) => !bio.locationVerifiedAt || !bio.verifiedLatitude || !bio.verifiedLongitude,
    apply(bio, value) {
      const latitude = Number(value?.verifiedLatitude);
      const longitude = Number(value?.verifiedLongitude);
      if (value?.locationConfirmed !== true || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Vui lòng định vị và xác nhận đúng điểm trên bản đồ.');
      }
      bio.verifiedLatitude = latitude.toFixed(6);
      bio.verifiedLongitude = longitude.toFixed(6);
      bio.locationVerifiedAt = new Date();
    },
  },
  {
    key: 'ethnicity',
    type: 'ethnicity',
    label: 'Dân tộc / bản sắc sắc tộc',
    hint: 'Bạn có thể tự mô tả theo cách phù hợp với quốc gia của mình hoặc chọn “Không muốn tiết lộ”.',
    required: true,
    isMissing: (bio) => !String(bio.ethnicity || '').trim(),
    apply(bio, value) {
      bio.ethnicity = sensitiveAnswer(value, 120);
    },
  },
  {
    key: 'religion',
    type: 'religion',
    label: 'Tôn giáo / tín ngưỡng',
    hint: 'Chọn đúng truyền thống/hệ phái. Nếu chưa có trong danh sách, hãy tự ghi tên đầy đủ; bạn cũng có thể chọn “Không muốn tiết lộ”.',
    options: RELIGION_CODES.map((value) => ({ value })),
    required: true,
    isMissing: (bio) => !String(bio.religion || '').trim(),
    apply(bio, value) {
      const answer = sensitiveAnswer(value, 160);
      if (!RELIGION_CODES.includes(answer) && !answer.startsWith('self:')) throw new Error('Lựa chọn tôn giáo không hợp lệ.');
      if (answer.startsWith('self:') && answer.slice(5).trim().length < 2) throw new Error('Vui lòng ghi tên tôn giáo đầy đủ.');
      bio.religion = answer;
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
    const compound = field.type === 'birthDate' || field.type === 'locationVerification';
    const value = compound ? values : values[field.key];
    const provided = field.type === 'birthDate'
      ? [values?.birthDay, values?.birthMonth, values?.birthYear].every((part) => part !== undefined && part !== '')
      : field.type === 'locationVerification'
        ? values?.locationConfirmed === true && values?.verifiedLatitude !== undefined && values?.verifiedLongitude !== undefined
      : value !== undefined && value !== '';
    if (!provided || !field.isMissing(bio)) continue;
    field.apply(bio, value);
    applied.push(field.key);
  }
  return applied;
}
