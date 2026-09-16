/**
 * Danh mục gói dùng khi admin mở một dự án khách hàng.
 *
 * Đây là nguồn DUY NHẤT cho cả hai phía: ô chọn trong trang quản trị và phần
 * kiểm tra ở `server/routes/customerRoutes.js`. Trước đây danh sách nằm cứng
 * trong JSX và vẫn còn tên của bảng giá cũ ("Signature Portfolio", "Premium
 * Web"…) — những gói không còn tồn tại, tạo ra dự án mang tên sai ngay từ lúc
 * khởi tạo.
 *
 * `id` là thứ lưu xuống cơ sở dữ liệu, nên ĐỪNG đổi id của gói đã dùng; muốn
 * đổi cách gọi thì sửa `label`. Bỏ một gói khỏi danh sách chỉ ngăn việc tạo
 * MỚI, các dự án cũ vẫn hiển thị đúng tên đã lưu.
 *
 * Mỗi gói mang theo vài con số suy ra được: thời gian thực hiện, số ngày bảo
 * hành và các đợt thanh toán. Chúng khớp với chính sách đang in trên trang
 * /services — sửa chính sách thì sửa luôn ở đây, đừng để hai nơi nói khác nhau.
 *
 * Nhờ vậy admin không phải gõ tay ngày bàn giao hay hạn bảo hành, và cổng
 * khách tự tính được "còn bao nhiêu ngày" mà không cần thêm trường nào trong
 * cơ sở dữ liệu.
 *
 * Ba nhóm:
 *   main    — ba gói làm website trả phí.
 *   edu     — Hugo Edu+ và những phần bổ sung chỉ người học mới mua thêm.
 *   support — việc làm riêng, không nằm trong gói nào.
 */

export const PROJECT_PACKAGE_GROUPS = [
  {
    id: "main",
    label: "Gói dịch vụ",
    options: [
      { id: "Hugo One", label: "Hugo One", hint: "Một trang tĩnh, landing page", durationDays: [5, 10], warrantyDays: 30, payments: [50, 50] },
      { id: "Hugo Story", label: "Hugo Story", hint: "Website giới thiệu nhiều trang", durationDays: [14, 28], warrantyDays: 45, payments: [50, 50] },
      { id: "Hugo Flow+", label: "Hugo Flow+", hint: "Website bán hàng, hệ thống động", durationDays: [28, 56], warrantyDays: 60, payments: [50, 30, 20] },
    ],
  },
  {
    id: "edu",
    label: "Hugo Edu+ và phần bổ sung",
    options: [
      { id: "Hugo Edu+", label: "Hugo Edu+", hint: "Trang Bio miễn phí 365 ngày", durationDays: [1, 3], warrantyDays: 365, payments: null, free: true },
      { id: "Hugo Edu+ · Thiết kế riêng", label: "Hugo Edu+ · Thiết kế riêng", hint: "Giao diện Bio đặt riêng, ngoài mẫu", durationDays: [5, 10], warrantyDays: 30, payments: [50, 50] },
      { id: "Hugo Edu+ · Tên miền riêng", label: "Hugo Edu+ · Tên miền riêng", hint: "Nối tên miền khách tự mua vào trang Bio", durationDays: [1, 3], warrantyDays: 30, payments: null },
      { id: "Hugo Edu+ · Gia hạn", label: "Hugo Edu+ · Gia hạn", hint: "Tiếp tục sau 365 ngày đầu", durationDays: [1, 2], warrantyDays: 365, payments: null },
    ],
  },
  {
    id: "support",
    label: "Hỗ trợ riêng",
    options: [
      { id: "Hỗ trợ riêng", label: "Hỗ trợ riêng", hint: "Việc lẻ theo yêu cầu, chốt phạm vi trước", durationDays: null, warrantyDays: 14, payments: null },
      { id: "Gói kết nối", label: "Gói kết nối", hint: "Trỏ tên miền, cài chứng chỉ, đưa web lên hosting", durationDays: [1, 3], warrantyDays: 14, payments: null },
      { id: "Bảo trì hàng tháng", label: "Bảo trì hàng tháng", hint: "Kiểm tra định kỳ và cập nhật nhỏ", durationDays: null, warrantyDays: 0, payments: null, recurring: true },
      { id: "Nâng cấp website có sẵn", label: "Nâng cấp website có sẵn", hint: "Sửa hoặc mở rộng trang đã chạy", durationDays: [3, 14], warrantyDays: 30, payments: [50, 50] },
    ],
  },
];

/** Danh sách phẳng để kiểm tra nhanh ở máy chủ. */
export const PROJECT_PACKAGE_IDS = PROJECT_PACKAGE_GROUPS.flatMap((group) =>
  group.options.map((option) => option.id),
);

export function isValidProjectPackage(value) {
  return PROJECT_PACKAGE_IDS.includes(value);
}

/** Thông tin suy ra của một gói; gói lạ (dự án cũ) trả về null để nơi gọi tự ẩn. */
export function getPackageFacts(id) {
  for (const group of PROJECT_PACKAGE_GROUPS) {
    const found = group.options.find((option) => option.id === id);
    if (found) return { ...found, group: group.id };
  }
  return null;
}

/**
 * Cửa sổ bàn giao dự kiến, tính từ ngày mở dự án.
 *
 * Cố ý trả về MỘT KHOẢNG chứ không phải một ngày: chính sách trên trang dịch
 * vụ cũng ghi khoảng, và một ngày duy nhất là lời hứa mà không ai giữ nổi khi
 * còn chờ nội dung từ khách.
 */
export function estimateDelivery(packageId, startedAt) {
  const facts = getPackageFacts(packageId);
  if (!facts?.durationDays || !startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const [min, max] = facts.durationDays;
  const from = new Date(start);
  from.setDate(from.getDate() + min);
  const to = new Date(start);
  to.setDate(to.getDate() + max);
  return { from, to };
}

/** Hạn bảo hành, tính từ ngày dự án đạt trạng thái hoàn tất. */
export function warrantyUntil(packageId, completedAt) {
  const facts = getPackageFacts(packageId);
  if (!facts?.warrantyDays || !completedAt) return null;
  const end = new Date(completedAt);
  if (Number.isNaN(end.getTime())) return null;
  end.setDate(end.getDate() + facts.warrantyDays);
  return end;
}
