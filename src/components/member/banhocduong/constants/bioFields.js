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
