/**
 * Tên hiển thị của thành viên — MỘT nguồn cho mọi màn (lời chào Trang chủ, thẻ
 * Tài khoản…). Trước đây mỗi màn tự đọc một trường khác nhau (`displayName`,
 * `fullName`, `name`), nên cùng một người mà Trang chủ chào một tên, Tài khoản
 * hiện tên khác. Trường thật trong model Bio là `displayName`.
 */
export function memberDisplayName({ formData, bio, session } = {}) {
  return String(
    formData?.displayName
    || bio?.displayName
    || session?.displayName
    || "",
  ).trim();
}
