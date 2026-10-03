/**
 * Bảng so sánh bốn gói — PHẦN KHÔNG DỊCH.
 *
 * Nguyên tắc: MỖI HÀNG LÀ MỘT CÂU HỎI KHÁCH THẬT SỰ HỎI, mỗi ô là câu trả lời
 * bằng thứ khách cầm về được. Không liệt kê tính năng kỹ thuật ("tích hợp
 * API", "responsive", "đa ngôn ngữ") — người sắp trả tiền không chọn gói bằng
 * những chữ đó, và một hàng mà bốn cột giống hệt nhau thì không giúp ai quyết
 * định cả, chỉ làm bảng dài ra. Vì vậy hầu hết ô là CHỮ chứ không phải dấu
 * tick: dấu tick nói "có", câu chữ nói "có cái gì".
 *
 * Icon và các ô "có / không" là SỰ THẬT VỀ SẢN PHẨM, không phải câu chữ, nên
 * chúng nằm ở đây chứ không nằm trong translation.json. Lý do rất cụ thể: bản
 * chữ Nôm được sinh tự động từ tiếng Việt (`npm run build:nom`), và nó đã từng
 * dịch luôn từ khoá "yes" thành 𩛂 rồi đánh rơi khoá `icon` — bảng mất sạch
 * icon và dấu tick ở ngôn ngữ đó.
 *
 * Mỗi ô có hai phần: một KÝ HIỆU trạng thái (`marks[gói]`) và một câu chữ
 * (`servicePkg.compare.cells.<id>.<gói>`). Ký hiệu có ba trạng thái, để khách
 * lướt mắt một lượt là thấy hình dạng của gói trước khi đọc chữ:
 *
 *     true      → dấu tick   · đã có trong giá
 *     "extra"   → dấu cộng   · có, nhưng tính thêm tiền
 *     false     → dấu gạch   · không có
 *
 * Hàng nào là một con số thuần (giá, thời gian, số trang) thì bỏ `marks` —
 * dán tick lên một con số không nói thêm được gì. Riêng hàng `price` đọc thẳng
 * số từ `servicePkg.items.<gói>.price`, không chép số tiền sang chỗ thứ hai.
 *
 * Mọi câu trả lời phải truy ra được từ `includes` / `warranty` / `policy` /
 * `addons` của gói. Bảng so sánh không phải chỗ hứa thêm.
 */

export const COMPARE_ROWS = [
  { id: "price", icon: "payments", price: true },
  // Hai chỗ các gói khác nhau rõ nhất (2026-09-28): cọc và cách web lên tên miền.
  { id: "deposit", icon: "account_balance_wallet" },
  { id: "time", icon: "schedule" },
  // Phí thêm trang và vòng chỉnh ba gói trả phí như nhau, nên chúng nằm ở bảng
  // phí trong trang chứ không chiếm hàng ở đây (2026-09-28).
  { id: "pages", icon: "description" },
  { id: "live", icon: "public", marks: { "hugo-one": "extra", "hugo-story": true, "hugo-flow-plus": true, "hugo-edu-plus": true } },
  { id: "found", icon: "search", marks: { "hugo-one": true, "hugo-story": true, "hugo-flow-plus": true, "hugo-edu-plus": false } },
  { id: "contact", icon: "mail", marks: { "hugo-one": true, "hugo-story": true, "hugo-flow-plus": true, "hugo-edu-plus": true } },
  { id: "selling", icon: "shopping_cart", marks: { "hugo-one": false, "hugo-story": false, "hugo-flow-plus": true, "hugo-edu-plus": false } },
  { id: "selfEdit", icon: "edit_note", marks: { "hugo-one": true, "hugo-story": true, "hugo-flow-plus": true, "hugo-edu-plus": true } },
  { id: "monthly", icon: "event_repeat" },
  { id: "warranty", icon: "build", marks: { "hugo-one": true, "hugo-story": true, "hugo-flow-plus": true, "hugo-edu-plus": true } },
];
