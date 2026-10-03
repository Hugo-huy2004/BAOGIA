// Which Bio fields HugoPSY may edit directly vs. which are LOCKED.
//
// Mirrors the server lock in bioRoutes.js PUT /:id: once an account is
// edu-verified, its identity fields (name/birthday/phone/education) are frozen
// and only the verification form can change them; contactEmail is always
// frozen. So when the AI proposes a [UPDATE_PROFILE:{...}], the client applies
// the unlocked fields and routes locked-field requests to the form instead of
// silently dropping them (which used to falsely say "đã lưu").

const VERIFIED_LOCKED = ["displayName", "birthday", "phone", "education"];
const ALWAYS_LOCKED = ["contactEmail", "email"];

export function getLockedFields(bio) {
  return new Set(bio?.isEduVerified ? [...VERIFIED_LOCKED, ...ALWAYS_LOCKED] : ALWAYS_LOCKED);
}

// Vietnamese labels for friendly chat messages.
export const BIO_FIELD_LABELS = {
  displayName: "họ và tên",
  birthday: "ngày sinh",
  phone: "số điện thoại",
  education: "học vấn",
  contactEmail: "email liên hệ",
  email: "email đăng nhập",
  headline: "biệt danh",
  bio: "mô tả bản thân",
  hobbies: "sở thích",
  height: "chiều cao",
  weight: "cân nặng",
  measurements: "số đo",
  address: "địa chỉ",
  skills: "kỹ năng",
  jobTitle: "nghề nghiệp",
};

export const fieldLabel = (k) => BIO_FIELD_LABELS[k] || k;

// Lệnh sửa hồ sơ bằng lời, đọc tất định trên máy: "đổi biệt danh thành Mèo",
// "đổi sở thích là đọc sách". Trước đây AI đám mây trả về [UPDATE_PROFILE:{...}];
// bộ não trên máy (model 1B) không đủ tin cậy để sinh dữ liệu có cấu trúc.
const LABEL_TO_FIELD = Object.fromEntries(Object.entries(BIO_FIELD_LABELS).map(([k, v]) => [v, k]));
const PROFILE_COMMAND = new RegExp(
  `(?:đổi|sửa|cập nhật|thay)\\s+(${Object.keys(LABEL_TO_FIELD).join("|")})\\s+(?:của\\s+(?:tớ|mình|tôi|em)\\s+)?(?:thành|là|sang)\\s+(.+)`,
  "i",
);

export function parseProfileCommand(text = "") {
  const m = String(text).trim().match(PROFILE_COMMAND);
  if (!m) return null;
  const value = m[2].trim().replace(/^["'“”]+|["'“”.!]+$/g, "");
  return value ? { [LABEL_TO_FIELD[m[1].toLowerCase()]]: value } : null;
}
