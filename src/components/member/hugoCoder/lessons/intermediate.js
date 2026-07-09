export const INTERMEDIATE_LESSONS = [
  {
    id: "lesson11",
    title: "11. Kiến trúc RESTful API & HTTP Method",
    lang: "javascript",
    file: "src/lesson11.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
RESTful API (Representational State Transfer) là kiến trúc truyền tải dữ liệu phổ biến trên Web qua giao thức HTTP. Sử dụng các phương thức (HTTP Methods) có ý nghĩa nghiệp vụ rõ ràng: GET (Lấy), POST (Tạo mới), PUT (Cập nhật toàn bộ), DELETE (Xóa).

### ÁP DỤNG HỆ THỐNG
Trong hệ thống, các luồng giao dịch được định nghĩa nhất quán: \`POST /api/orders\` tạo đơn hàng mới, trong khi \`GET /api/orders/123\` truy vấn chi tiết đơn hàng đó.

### THỰC HÀNH NHỎ
Viết hàm \`fetch()\` để gửi yêu cầu POST lên endpoint API kèm body được định dạng JSON để tạo bản ghi học tập.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã JS gọi hàm \`fetch()\` với tham số cấu hình có phương thức \`POST\` và thiết lập \`body: JSON.stringify(...)\`.`,
    tasks: [
      "Thực hành viết lệnh fetch gửi dữ liệu POST dạng JSON lên API."
    ],
    starterCode: `// Viết lệnh fetch gửi dữ liệu POST lên /api/learn-progress
fetch("/api/learn-progress", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ lessonId: "lesson11", status: "completed" })
});`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("fetch(") && c.includes("method:\"post\"") && c.includes("body:");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Phương thức HTTP nào dùng để lấy dữ liệu?", o: ["POST", "GET", "PUT", "DELETE"], a: 1 },
      { q: "Mã trạng thái HTTP nào biểu thị thành công?", o: ["200 OK", "404 Not Found", "500 Internal Error", "400 Bad Request"], a: 0 }
    ]
  },
  {
    id: "lesson12",
    title: "12. Định dạng trao đổi dữ liệu JSON",
    lang: "php",
    file: "src/lesson12.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
JSON (JavaScript Object Notation) là định dạng trao đổi dữ liệu dạng văn bản nhẹ, dễ đọc với con người và dễ phân tích với máy tính. Nó gồm các cặp key-value và mảng dữ liệu.

### ÁP DỤNG HỆ THỐNG
Hầu hết các kết nối Frontend - Backend hiện đại đều dùng JSON để truyền tải thông tin. PHP sử dụng \`json_encode()\` và \`json_decode()\` để chuyển đổi qua lại giữa kiểu dữ liệu mảng/đối tượng và chuỗi JSON.

### THỰC HÀNH NHỎ
Đọc một chuỗi JSON nhận được, giải mã thành mảng trong PHP và xuất ngược lại dữ liệu sau khi sửa đổi.

### KIỂM TRA HOÀN TẤT
Đảm bảo file PHP gọi hàm giải mã \`json_decode()\` và hàm mã hóa \`json_encode()\`.`,
    tasks: [
      "Giải mã chuỗi JSON và chuyển đổi kiểu dữ liệu trong PHP."
    ],
    starterCode: `<?php
$rawJson = '{"name": "Hugo", "role": "developer"}';
$data = json_decode($rawJson, true);
$data['status'] = 'active';
echo json_encode($data);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("json_decode(") && c.includes("json_encode(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Dữ liệu JSON bắt đầu và kết thúc bằng cặp dấu nào?", o: ["[]", "{}", "<>", "()"], a: 1 },
      { q: "Toán tử giải mã chuỗi JSON thành mảng PHP?", o: ["json_encode", "json_decode", "parse_json", "stringify"], a: 1 }
    ]
  },
  {
    id: "lesson13",
    title: "13. Kiến trúc file lập trình & Mô hình MVC",
    lang: "php",
    file: "src/lesson13.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Mô hình MVC (Model - View - Controller) chia ứng dụng thành 3 thành phần chính: Model quản trị dữ liệu & database, View đảm trách hiển thị giao diện, Controller điều hướng request và xử lý logic nghiệp vụ.

### ÁP DỤNG HỆ THỐNG
Tách biệt MVC giúp dự án không bị phình to trong 1 file đơn lẻ. Nhờ đó, việc bảo trì, viết Unit Test trở nên dễ dàng và nhiều lập trình viên có thể code song song mà không bị xung đột mã nguồn.

### THỰC HÀNH NHỎ
Định nghĩa một cấu trúc class Controller cơ bản gọi đến phương thức của Model và xuất kết quả ra View.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn định nghĩa các lớp đại diện cho Model, View và Controller tương ứng.`,
    tasks: [
      "Xây dựng khung cấu trúc Model-View-Controller bằng Class PHP."
    ],
    starterCode: `<?php
class UserModel {
  public function getData() { return ["name" => "Hugo"]; }
}
class UserView {
  public function render($data) { echo "User: " . $data['name']; }
}
class UserController {
  public function handle() {
    $model = new UserModel();
    $view = new UserView();
    $view->render($model->getData());
  }
}
?>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("class usermodel") && c.includes("class userview") && c.includes("class usercontroller");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thành phần nào trong MVC chịu trách nhiệm giao tiếp trực tiếp với database?", o: ["View", "Controller", "Model", "Router"], a: 2 },
      { q: "MVC viết tắt từ gì?", o: ["Model View Controller", "Modern Variable Class", "Memory Virtual Cache", "Manage Version Control"], a: 0 }
    ]
  },
  {
    id: "lesson14",
    title: "14. Cơ sở dữ liệu nâng cao & Table Join",
    lang: "sql",
    file: "src/lesson14.sql",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Trong cơ sở dữ liệu quan hệ, dữ liệu được chuẩn hóa và chia nhỏ ra nhiều bảng. Sử dụng phép nối bảng \`JOIN\` (\`INNER JOIN\`, \`LEFT JOIN\`) để gộp các hàng dữ liệu từ các bảng dựa trên mối quan hệ khóa ngoại (Foreign Key).

### ÁP DỤNG HỆ THỐNG
Khi hiển thị danh sách đơn hàng, ta cần nối bảng \`orders\` với bảng \`users\` để lấy thông tin tên khách hàng, tránh việc lưu lặp thông tin khách hàng ở mỗi đơn hàng.

### THỰC HÀNH NHỎ
Viết câu lệnh SQL sử dụng phép nối bảng \`INNER JOIN\` để lấy thông tin đơn hàng và tên người đặt tương ứng.

### KIỂM TRA HOÀN TẤT
Kiểm tra câu lệnh SQL phải có mệnh đề \`INNER JOIN\` hoặc \`LEFT JOIN\` nối bảng \`orders\` với bảng \`users\` qua khoá ngoại \`user_id\`.`,
    tasks: [
      "Viết truy vấn gộp thông tin bảng orders và users sử dụng phép JOIN."
    ],
    starterCode: `-- Viết câu lệnh JOIN bảng orders và bảng users qua khóa user_id
SELECT orders.id, users.displayName 
FROM orders 
INNER JOIN users ON orders.user_id = users.id;`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("JOIN") && c.includes("ON") && c.includes("USER_ID");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Phép nối bảng nào chỉ trả về các dòng có giá trị khớp ở cả hai bảng?", o: ["LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "OUTER JOIN"], a: 1 },
      { q: "Khóa dùng để liên kết giữa hai bảng dữ liệu được gọi là gì?", o: ["Primary Key", "Foreign Key (Khóa ngoại)", "Unique Key", "Index Key"], a: 1 }
    ]
  },
  {
    id: "lesson15",
    title: "15. Giao dịch dữ liệu (Database Transactions) & ACID",
    lang: "sql",
    file: "src/lesson15.sql",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Giao dịch cơ sở dữ liệu (Database Transaction) là một chuỗi các thao tác được thực thi như một đơn vị công việc duy nhất, tuân thủ nguyên tắc ACID: Atomicity (Tính nguyên tử), Consistency (Tính nhất quán), Isolation (Tính cô lập), Durability (Tính bền vững).

### ÁP DỤNG HỆ THỐNG
Khi người dùng chuyển khoản ngân hàng: Tài khoản A trừ tiền, tài khoản B cộng tiền. Cả hai thao tác phải thành công đồng thời. Nếu một trong hai lỗi, toàn bộ giao dịch phải được khôi phục trạng thái cũ (\`ROLLBACK\`).

### THỰC HÀNH NHỎ
Viết chuỗi lệnh transaction giả định: bắt đầu transaction, thực hiện các lệnh cập nhật, và xác nhận transaction.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã lệnh SQL có đủ cấu trúc điều hướng transaction: \`START TRANSACTION\`, \`COMMIT\` và \`ROLLBACK\`.`,
    tasks: [
      "Thực hiện viết luồng giao dịch cơ sở dữ liệu an toàn đảm bảo nguyên tắc ACID."
    ],
    starterCode: `-- Viết luồng transaction chuyển quỹ
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("START TRANSACTION") && c.includes("COMMIT");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Chữ 'A' trong ACID viết tắt từ chữ gì?", o: ["Atomicity (Tính nguyên tử)", "Access", "Authority", "API"], a: 0 },
      { q: "Lệnh nào dùng để hủy bỏ tất cả thay đổi trong transaction khi gặp lỗi?", o: ["COMMIT", "ROLLBACK", "RESET", "CANCEL"], a: 1 }
    ]
  },
  {
    id: "lesson16",
    title: "16. Quy tắc UI/UX: Độ tương phản & Typography",
    lang: "css",
    file: "src/lesson16.css",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Quy tắc UI/UX nhấn mạnh độ tương phản màu sắc (Color Contrast Ratio - tối thiểu 4.5:1 cho văn bản thường theo WCAG) và hệ thống phân cấp chữ (Typography Hierarchy - kích thước, font-weight, khoảng cách dòng) giúp người dùng đọc tốt nhất.

### ÁP DỤNG HỆ THỐNG
Giao diện portal được thiết kế màu chữ đậm tương phản cao trên nền sáng/tối rõ ràng, kích cỡ chữ chính xác giúp giảm mỏi mắt cho học viên học tập lâu dài.

### THỰC HÀNH NHỎ
Định nghĩa CSS cho văn bản đạt độ tương phản cao và thiết lập chiều cao dòng thích hợp.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã CSS định nghĩa màu chữ có độ tương phản cao trên màu nền và thiết lập thuộc tính \`line-height\` rõ ràng.`,
    tasks: [
      "Cấu hình các thuộc tính CSS Typography đảm bảo chuẩn độ tương phản và khoảng cách dễ đọc."
    ],
    starterCode: `/* CSS tương phản cao */
.text-body {
  color: #1f2937;
  background-color: #ffffff;
  font-size: 16px;
  line-height: 1.6;
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("color:") && c.includes("line-height:");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Tỉ lệ tương phản tối thiểu cho văn bản bình thường theo chuẩn WCAG AA?", o: ["2:1", "3:1", "4.5:1", "7:1"], a: 2 },
      { q: "Thuộc tính CSS nào điều chỉnh khoảng cách giữa các dòng văn bản?", o: ["letter-spacing", "line-height", "font-weight", "word-spacing"], a: 1 }
    ]
  },
  {
    id: "lesson17",
    title: "17. Quy tắc UI/UX: Trạng thái & Phản hồi UI",
    lang: "html",
    file: "src/lesson17.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Một giao diện chất lượng phải phản hồi ngay lập tức mọi hành vi của người dùng qua các trạng thái: Hover (Rê chuột), Active (Nhấp chuột), Focus (Nhắm chọn), Loading (Đang tải), Empty (Trống), Error (Lỗi).

### ÁP DỤNG HỆ THỐNG
Khi học viên bấm nút "Kiểm tra bài học", nút bấm lập tức chuyển sang trạng thái \`disabled\` kèm spinner xoay tròn để học viên biết hệ thống đang xử lý, tránh bấm nhiều lần.

### THỰC HÀNH NHỎ
Viết các bộ chọn CSS giả lập trạng thái tương tác \`:hover\` và \`:focus\` cho nút bấm.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn định nghĩa hai trạng thái giả định \`:hover\` và \`:focus\` trong phần CSS.`,
    tasks: [
      "Định nghĩa CSS cho nút bấm hỗ trợ phản hồi hover và focus rõ ràng."
    ],
    starterCode: `<style>
button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.2s;
}
button:hover {
  background: #2563eb;
}
button:focus {
  outline: 2px solid #93c5fd;
}
</style>
<button>Nút tương tác</button>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes(":hover") && c.includes(":focus");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Pseudo-class CSS nào áp dụng khi phần tử được focus bằng phím Tab?", o: [":hover", ":active", ":focus", ":visited"], a: 2 },
      { q: "Trạng thái nào hiển thị khi danh sách không có dữ liệu?", o: ["Loading State", "Error State", "Empty State", "Success State"], a: 2 }
    ]
  },
  {
    id: "lesson18",
    title: "18. Toán học ứng dụng: Hệ tọa độ & Vector 2D",
    lang: "javascript",
    file: "src/lesson18.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Trong lập trình đồ họa và UI, màn hình hoạt động như một hệ tọa độ Cartesian 2D với gốc tọa độ (0,0) nằm ở góc trên cùng bên trái. Trục X tăng dần về bên phải, trục Y tăng dần đi xuống dưới.

### ÁP DỤNG HỆ THỐNG
Các chuyển động của nhân vật game, hiệu ứng kéo thả (drag & drop) hay vẽ biểu đồ đều áp dụng các phép tính vector cơ bản: khoảng cách Euclidean, cộng trừ vector vị trí.

### THỰC HÀNH NHỎ
Viết hàm tính toán khoảng cách giữa hai tọa độ điểm trong mặt phẳng 2D sử dụng định lý Pythagoras: \`d = sqrt((x2 - x1)² + (y2 - y1)²)\`.

### KIỂM TRA HOÀN TẤT
Đảm bảo hàm JS sử dụng hàm \`Math.sqrt\` và \`Math.pow\` (hoặc toán tử \`**\`) để tính khoảng cách vector chuẩn xác.`,
    tasks: [
      "Viết hàm JavaScript tính toán khoảng cách Euclidean giữa hai điểm (x1, y1) và (x2, y2)."
    ],
    starterCode: `function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("math.sqrt") && (c.includes("math.pow") || c.includes("**"));
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Gốc tọa độ (0,0) của màn hình nằm ở vị trí nào?", o: ["Góc dưới bên trái", "Góc trên bên trái", "Trung tâm màn hình", "Góc trên bên phải"], a: 1 },
      { q: "Để tính khoảng cách Euclidean trong 2D, ta dựa trên định lý toán học nào?", o: ["Thales", "Euclid", "Pythagoras", "Newton"], a: 2 }
    ]
  },
  {
    id: "lesson19",
    title: "19. Toán học ứng dụng: Phép biến đổi ma trận",
    lang: "css",
    file: "src/lesson19.css",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Các phép biến đổi đồ họa (translation, rotation, scaling) được thực thi thông qua việc nhân ma trận tọa độ. Trong CSS, chúng được đóng gói qua thuộc tính \`transform\` giúp di chuyển, xoay và phóng to thu nhỏ phần tử cực nhanh nhờ phần cứng GPU.

### ÁP DỤNG HỆ THỐNG
Các hiệu ứng thẻ bài đa chiều (3D hover cards), menu trượt và popover xuất hiện mượt mà đều sử dụng thuộc tính biến đổi ma trận 2D/3D CSS để tăng hiệu năng xử lý của trình duyệt.

### THỰC HÀNH NHỎ
Viết thuộc tính CSS xoay phần tử 45 độ và dịch chuyển vị trí theo trục X thêm 20px.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã CSS định nghĩa thuộc tính \`transform\` chứa cả hai hàm biến đổi \`rotate()\` và \`translate()\` (hoặc \`translateX()\`).`,
    tasks: [
      "Cấu hình các hiệu ứng biến đổi hình học trong CSS sử dụng transform."
    ],
    starterCode: `.card-3d {
  transform: translate(20px, 0) rotate(45deg);
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("transform:") && c.includes("rotate(") && c.includes("translate");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thuộc tính CSS nào kích hoạt phép dịch chuyển vị trí và xoay hình học?", o: ["transition", "transform", "position", "margin"], a: 1 },
      { q: "Hàm transform nào dùng để thu nhỏ/phóng to một phần tử?", o: ["skew()", "scale()", "rotate()", "translate()"], a: 1 }
    ]
  },
  {
    id: "lesson20",
    title: "20. Toán logic: Bảng chân trị & Đại số Boolean",
    lang: "javascript",
    file: "src/lesson20.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Toán logic (Đại số Boolean) xử lý các giá trị chân lý: \`true\` và \`false\`. Ba toán tử logic cơ bản: AND (\`&&\`), OR (\`||\`), NOT (\`!\`). Quy tắc De Morgan giúp rút gọn các biểu thức điều kiện phức tạp.

### ÁP DỤNG HỆ THỐNG
Trong phân quyền hệ thống: Một người dùng được xem tài liệu nếu là ADMIN hoặc (MEMBER và đã TRẢ PHÍ). Logic: \`isAdmin || (isMember && hasPaid)\`.

### THỰC HÀNH NHỎ
Rút gọn điều kiện kiểm tra người dùng hợp lệ thỏa mãn: có email, không bị khóa, và hoặc là admin hoặc là tác giả của bài viết.

### KIỂM TRA HOÀN TẤT
Đảm bảo biểu thức logic trong JS sử dụng đúng các toán tử điều kiện \`&&\`, \`||\`, \`!\`.`,
    tasks: [
      "Viết hàm JavaScript kiểm tra quyền người dùng sử dụng logic Boolean."
    ],
    starterCode: `function checkPermission(user, post) {
  const hasAccount = !!user && !user.isBlocked;
  const isAuthorized = user.role === 'admin' || post.authorId === user.id;
  return hasAccount && isAuthorized;
}`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("&&") && c.includes("||");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Biểu thức (!true || false) trả về giá trị gì?", o: ["true", "false", "undefined", "null"], a: 1 },
      { q: "Toán tử logic đại diện cho phép toán giao (AND) trong JS là gì?", o: ["||", "&&", "!", "=="], a: 1 }
    ]
  },
  {
    id: "lesson21",
    title: "21. Quy tắc bảo mật: Kiểm tra & Làm sạch dữ liệu đầu vào",
    lang: "php",
    file: "src/lesson21.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Nguyên tắc bảo mật cơ bản: Không bao giờ tin tưởng dữ liệu từ client gửi lên (Never trust user input). Mọi dữ liệu bắt buộc phải được kiểm tra định dạng (Validation) và loại bỏ các ký tự độc hại (Sanitization).

### ÁP DỤNG HỆ THỐNG
Trước khi lưu email của khách hàng vào CSDL, backend sử dụng hàm lọc của PHP \`filter_var()\` để xác minh cấu trúc email chuẩn, tránh ghi nhận rác hoặc code phá hoại.

### THỰC HÀNH NHỎ
Viết mã nguồn PHP để kiểm tra email hợp lệ và làm sạch chuỗi tiêu đề bài viết.

### KIỂM TRA HOÀN TẤT
Đảm bảo file PHP sử dụng hàm lọc \`filter_var()\` với hằng số kiểm tra email \`FILTER_VALIDATE_EMAIL\`.`,
    tasks: [
      "Lập trình bộ lọc kiểm tra email an toàn phía máy chủ PHP."
    ],
    starterCode: `<?php
$email = $_POST['email'] ?? '';
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
  echo "Email hợp lệ";
} else {
  echo "Email không hợp lệ";
}
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("filter_var(") && c.includes("FILTER_VALIDATE_EMAIL");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Tại sao cần validate dữ liệu ở cả Frontend lẫn Backend?", o: ["Frontend để trải nghiệm nhanh, Backend để bảo mật bắt buộc", "Chỉ cần Frontend", "Chỉ cần Backend", "Không cần thiết"], a: 0 },
      { q: "Hàm PHP nào dùng để kiểm tra tính hợp lệ của email?", o: ["preg_match", "filter_var", "strip_tags", "htmlspecialchars"], a: 1 }
    ]
  },
  {
    id: "lesson22",
    title: "22. Quy tắc bảo mật: CORS & Content Security Policy",
    lang: "php",
    file: "src/lesson22.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
CORS (Cross-Origin Resource Sharing) là cơ chế trình duyệt bảo vệ người dùng, chỉ cho phép frontend truy cập API ở domain khác nếu backend cho phép rõ ràng. CSP (Content Security Policy) là một header HTTP giúp ngăn chặn các cuộc tấn công XSS bằng cách khai báo rõ các nguồn script được phép tải.

### ÁP DỤNG HỆ THỐNG
Hệ thống API Portal định cấu hình chỉ cho phép domain của portal gửi request truy cập dữ liệu thông qua header \`Access-Control-Allow-Origin\`.

### THỰC HÀNH NHỎ
Khai báo cấu hình header CORS trong file API PHP để cho phép chia sẻ tài nguyên an toàn.

### KIỂM TRA HOÀN TẤT
Đảm bảo file PHP gửi header \`Access-Control-Allow-Origin\` thông qua hàm \`header()\` của PHP.`,
    tasks: [
      "Cấu hình header cho phép chia sẻ tài nguyên chéo nguồn (CORS) trong PHP."
    ],
    starterCode: `<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
echo json_encode(["status" => "cors_configured"]);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("access-control-allow-origin");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "CORS viết tắt từ cụm từ nào?", o: ["Cross-Origin Resource Sharing", "Computer Object Resource System", "Client Origin Redirect Service", "Common Object Routing Suite"], a: 0 },
      { q: "Lỗi CORS xảy ra ở đâu đầu tiên?", o: ["Database", "Web Server", "Trình duyệt (Browser)", "Router mạng"], a: 2 }
    ]
  },
  {
    id: "lesson23",
    title: "23. Quy tắc nội dung: SEO ngữ nghĩa & Thẻ Meta",
    lang: "html",
    file: "src/lesson23.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
SEO (Search Engine Optimization) ngữ nghĩa tập trung cấu trúc HTML sạch và cung cấp các thẻ Meta ẩn để các robot thu thập thông tin của Google hiểu được nội dung chính của trang web. Thẻ Open Graph (\`og:...\`) giúp hiển thị ảnh preview đẹp khi chia sẻ link qua Facebook/Zalo.

### ÁP DỤNG HỆ THỐNG
Mỗi trang dịch vụ hoặc bài học của portal đều được cấu hình các thẻ \`meta\` động để tự động tối ưu hóa hiển thị khi học viên chia sẻ lên mạng xã hội.

### THỰC HÀNH NHỎ
Bổ sung thẻ meta mô tả trang web và thẻ meta Open Graph cho tiêu đề bài học.

### KIỂM TRA HOÀN TẤT
Kiểm tra tệp HTML có chứa các thẻ \`<meta name=\"description\"\` và \`<meta property=\"og:title\"\`.`,
    tasks: [
      "Viết các thẻ meta SEO tiêu chuẩn và cấu hình hiển thị liên kết mạng xã hội."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="description" content="Khóa học lập trình web thông minh HugoCoder">
  <meta property="og:title" content="Bài 23: Tối ưu SEO cho Website">
  <title>SEO & Meta Tags</title>
</head>
<body>
  <h1>Tối ưu hóa SEO ngữ nghĩa</h1>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('name="description"') && c.includes('property="og:title"');
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thẻ meta nào giúp định nghĩa ảnh thu nhỏ khi chia sẻ liên kết?", o: ["og:image", "og:title", "description", "keywords"], a: 0 },
      { q: "Ký tự robot thu thập dữ liệu tìm kiếm đọc thông tin cấu hình thu thập từ tệp tin nào?", o: ["robots.txt", "sitemap.xml", "index.html", "manifest.json"], a: 0 }
    ]
  },
  {
    id: "lesson24",
    title: "24. Quy tắc nội dung: Đa ngôn ngữ (Localization)",
    lang: "javascript",
    file: "src/lesson24.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Đa ngôn ngữ (Internationalization - i18n & Localization - l10n) giúp hệ thống dịch thuật và định dạng nội dung (ngày tháng, đơn vị tiền tệ) tương thích với người dùng ở các quốc gia khác nhau.

### ÁP DỤNG HỆ THỐNG
Portal hỗ trợ dịch nhanh toàn bộ nhãn giao diện tiếng Anh và tiếng Việt dựa trên ngôn ngữ hệ thống lưu trong tài khoản cá nhân.

### THỰC HÀNH NHỎ
Định nghĩa một cấu trúc từ điển dịch thuật đơn giản và viết hàm chuyển đổi văn bản theo mã ngôn ngữ.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã JS định nghĩa đối tượng cấu trúc dữ liệu đa ngôn ngữ và hàm lấy bản dịch theo key.`,
    tasks: [
      "Lập trình module dịch thuật i18n cơ bản bằng JavaScript."
    ],
    starterCode: `const translations = {
  vi: { welcome: "Chào mừng" },
  en: { welcome: "Welcome" }
};
function translate(key, lang) {
  return translations[lang]?.[key] || key;
}
console.log(translate("welcome", "vi"));`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("translations") && c.includes("vi:") && c.includes("en:");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Ngữ cảnh i18n viết tắt từ chữ gì?", o: ["Internationalization", "Integration", "Identity", "Information"], a: 0 },
      { q: "Thẻ HTML nào khai báo ngôn ngữ chính của trang web?", o: ["<html lang='vi'>", "<meta language>", "<charset>", "<title>"], a: 0 }
    ]
  },
  {
    id: "lesson25",
    title: "25. Kiểm tra Website Programming 2",
    lang: "html",
    file: "src/lesson25.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Bài kiểm tra tổng hợp kiến thức nâng cao thuộc Phase 2 (Bài 11-24): API RESTful, Cơ sở dữ liệu quan hệ, UI/UX thực tế, Toán học đồ họa và các quy tắc bảo mật an toàn thông tin.

### ÁP DỤNG HỆ THỐNG
Sau khi vượt qua bài học này, bạn sẽ kết thúc học kỳ Trung cấp. Quyền sở hữu trọn đời học liệu sẽ mở ra thông qua gói mua vĩnh viễn 50 JOY.

### THỰC HÀNH NHỎ
Hoàn thành bộ câu hỏi thi trắc nghiệm ngẫu nhiên gồm 5 câu.

### KIỂM TRA HOÀN TẤT
Đạt điểm số tối thiểu 3 trên 5 câu đúng (>= 60%) để vượt qua bài kiểm tra và nhận bằng chứng nhận Trung cấp.`,
    tasks: [
      "Hoàn thành bài kiểm tra 5 câu trắc nghiệm tổng hợp đạt tối thiểu 60%."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 5
  }
];
