const VIETNAMESE_FAMILY_NAMES = new Set([
  "bui", "dang", "do", "duong", "ho", "hoang", "huynh", "le", "ly",
  "ngo", "nguyen", "pham", "phan", "tran", "vo", "vu",
]);

const plainNamePart = (value) => String(value || "")
  .toLocaleLowerCase("vi-VN")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d");

// Đổi ngôn ngữ giao diện không được đổi họ thành tên. Với tên theo thứ tự Việt
// (họ đứng đầu), cả giao diện vi/en đều chào bằng từ cuối; tên kiểu phương Tây
// ở giao diện en vẫn dùng từ đầu.
export function givenName(displayName, language) {
  const parts = String(displayName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const isVietnameseOrder = VIETNAMESE_FAMILY_NAMES.has(plainNamePart(parts[0]));
  return language === "vi" || isVietnameseOrder
    ? parts[parts.length - 1]
    : parts[0];
}
