export const BASIC_LESSONS = [
  {
    id: "lesson1",
    title: "1. Giới thiệu HTML & Code cơ bản",
    lang: "html",
    file: "src/lesson1.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
HTML (HyperText Markup Language) là ngôn ngữ đánh dấu siêu văn bản, tạo cấu trúc khung xương cho trang web. Nó hoạt động bằng các thẻ (tags) đi theo cặp để định nghĩa các khối vùng dữ liệu khác nhau.

### ÁP DỤNG HỆ THỐNG
Trong hệ thống thực tế, một cấu trúc HTML sạch sẽ, đúng ngữ nghĩa (semantic HTML) giúp các công cụ tìm kiếm (SEO) và thiết bị hỗ trợ đọc màn hình (Accessibility) hoạt động tốt nhất.

### THỰC HÀNH NHỎ
Bạn hãy sắp xếp các thẻ HTML theo đúng thứ tự phân cấp tiêu chuẩn từ ngoài vào trong: \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ kiểm tra xem file code của bạn đã có đủ cấu trúc chuẩn \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<title>\`, \`<body>\`, \`<h1>\`, \`<p>\` chưa.`,
    tasks: [
      "Kéo thả các thẻ HTML theo thứ tự từ trên xuống: <!DOCTYPE html> -> <html> -> <head> -> <body>."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <title>Bài 1: HTML Cơ Bản</title>
</head>
<body>
    <h1>Chào mừng bạn đến với HTML!</h1>
    <p>Học để hiểu, thực hành thực tế.</p>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("<!doctypehtml>") && c.includes("<html") && c.includes("<head>") && c.includes("<title>") && c.includes("<body>") && c.includes("<h1>") && c.includes("<p>");
    },
    practiceType: "drag_drop_html",
    dragBlocks: [
      { id: "b1", text: "<!DOCTYPE html>" },
      { id: "b2", text: "<html>" },
      { id: "b3", text: "<head>" },
      { id: "b4", text: "<body>" }
    ],
    correctOrder: ["b1", "b2", "b3", "b4"],
    miniQuiz: [
      { q: "Thẻ <html> có vai trò gì?", o: ["Bao bọc toàn bộ trang web", "Tạo tiêu đề", "Tạo ảnh", "Chứa metadata"], a: 0 },
      { q: "Thẻ <head> thường chứa phần tử nào sau đây?", o: ["<p>", "<h1>", "<title>", "<img>"], a: 2 },
      { q: "HTML được viết tắt từ chữ gì?", o: ["HyperText Markup Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language", "Hyper Tool Markup Language"], a: 0 }
    ]
  },
  {
    id: "lesson2",
    title: "2. Giới thiệu CSS & Định dạng",
    lang: "html",
    file: "src/lesson2.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
CSS (Cascading Style Sheets) giúp định dạng màu sắc, bố cục, khoảng cách và hiệu ứng cho tài liệu HTML. Cấu trúc Box Model là nền tảng gồm: content, padding, border, và margin.

### ÁP DỤNG HỆ THỐNG
Trong hệ thống thực tế, CSS được gom nhóm thành các CSS variables để quản trị chủ đề màu sắc (Dark Mode / Light Mode) một cách tập trung, giúp đổi giao diện hệ thống trong 1 dòng code.

### THỰC HÀNH NHỎ
Đổi màu nền giao diện demo thành màu Xanh Dương và màu chữ thành màu Trắng theo yêu cầu của hệ thống để trực quan hóa giao diện Card.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn định nghĩa bộ chọn \`.card\` có nền xanh dương \`background-color: #0056b3\` và chữ trắng \`color: #ffffff\`.`,
    tasks: [
      "Thực hành: Đổi màu nền giao diện thành màu Xanh Dương và màu chữ thành màu Trắng theo yêu cầu của hệ thống."
    ],
    starterCode: `<style>
.card {
    background-color: #0056b3;
    color: #ffffff;
    padding: 20px;
    border-radius: 10px;
}
</style>
<div class="card">
    <h2>Giao diện đổi màu</h2>
    <p>Hãy chọn đúng màu nền và màu chữ để kiểm tra.</p>
</div>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes(".card") && c.includes("background-color:#0056b3") && c.includes("color:#ffffff");
    },
    practiceType: "theme_match",
    themePrompt: "Hãy chọn Nền màu Xanh Dương và Chữ màu Trắng",
    requiredBg: "#0056b3",
    requiredText: "#ffffff",
    miniQuiz: [
      { q: "Thuộc tính 'background-color' dùng để làm gì?", o: ["Đổi màu chữ", "Đổi màu nền", "Tạo viền", "Chỉnh phông chữ"], a: 1 },
      { q: "Thuộc tính 'padding' tạo khoảng trống ở đâu?", o: ["Bên ngoài viền", "Giữa các phần tử", "Bên trong viền", "Không tạo khoảng trống"], a: 2 },
      { q: "CSS được viết tắt từ chữ gì?", o: ["Computer Style Sheets", "Creative Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"], a: 2 }
    ]
  },
  {
    id: "lesson3",
    title: "3. JavaScript & Tương tác động",
    lang: "html",
    file: "src/lesson3.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
JavaScript (JS) là ngôn ngữ lập trình kịch bản chạy ở phía Client, cho phép tương tác trực tiếp với cây DOM (Document Object Model), bắt sự kiện và thay đổi trạng thái UI thời gian thực.

### ÁP DỤNG HỆ THỐNG
Trong các dự án thực tế, các nút bấm thanh toán hoặc đăng ký đều sử dụng JS để kích hoạt loading, ngăn chặn bấm đúp (double-click submission) và gửi dữ liệu đi bất đồng bộ.

### THỰC HÀNH NHỎ
Thao tác nhấp chuột vào nút bấm demo đủ 3 lần liên tiếp để tăng bộ đếm lên đúng số 3.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn có sử dụng \`document.getElementById('btn')\` để bắt sự kiện click thông qua \`addEventListener('click', ...)\`.`,
    tasks: [
      "Thực hành: Nhấp chuột vào nút bấm 3 lần liên tiếp để tăng bộ đếm lên đúng số 3."
    ],
    starterCode: `<button id="btn">Click me</button>
<script>
const button = document.getElementById("btn");
button.addEventListener("click", () => {
    console.log("Clicked!");
});
</script>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("getelementbyid") && c.includes("click") && c.includes("addeventlistener");
    },
    practiceType: "js_button",
    miniQuiz: [
      { q: "Hàm nào dùng để lấy phần tử theo ID trong Javascript?", o: ["document.getElementById", "document.querySelector", "document.getClass", "document.find"], a: 0 },
      { q: "Từ khoá nào dùng để khai báo biến có thể thay đổi giá trị?", o: ["const", "let", "static", "def"], a: 1 },
      { q: "Sự kiện nào xảy ra khi người dùng nhấp chuột vào một phần tử?", o: ["onmouseover", "onkeydown", "onclick", "onchange"], a: 2 }
    ]
  },
  {
    id: "lesson4",
    title: "4. Kiểm tra Website Programming 1",
    lang: "html",
    file: "src/lesson4.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Bài kiểm tra tổng hợp kiến thức cơ bản về HTML, CSS và JavaScript. Ôn lại Box Model, cấu trúc trang web semantic và cách xử lý sự kiện DOM tương tác.

### ÁP DỤNG HỆ THỐNG
Việc đánh giá giúp hệ thống hiểu mức độ tiếp thu của học viên trước khi cấp quyền tiếp cận cơ sở dữ liệu và máy chủ phía sau.

### THỰC HÀNH NHỎ
Hoàn thành bộ câu hỏi thi trắc nghiệm ngẫu nhiên gồm 5 câu.

### KIỂM TRA HOÀN TẤT
Đạt tối thiểu 3 trên 5 câu đúng (>= 60%) để vượt qua bài kiểm tra.`,
    tasks: [
      "Hoàn thành bài kiểm tra 5 câu trắc nghiệm ngẫu nhiên đạt tối thiểu 60%."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 5
  },
  {
    id: "lesson5",
    title: "5. Giới thiệu MySQL & CSDL",
    lang: "sql",
    file: "src/lesson5.sql",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
SQL (Structured Query Language) là ngôn ngữ truy vấn cơ sở dữ liệu quan hệ. MySQL dùng để lưu trữ dữ liệu dạng bảng có cấu trúc cột/dòng và các khóa liên kết.

### ÁP DỤNG HỆ THỐNG
Các hệ thống lớn cần lọc dữ liệu ở tầng cơ sở dữ liệu trước khi chuyển lên backend để tránh nghẽn băng thông và giảm thiểu bộ nhớ RAM máy chủ.

### THỰC HÀNH NHỎ
Sắp xếp các mệnh đề SQL để tạo câu lệnh SELECT hoàn chỉnh lấy dữ liệu người dùng hoạt động.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã lệnh SQL viết đúng cú pháp: \`SELECT * FROM users WHERE status = 'active' LIMIT 5;\`.`,
    tasks: [
      "Kéo thả các mệnh đề SQL để ghép thành câu lệnh hoàn chỉnh: Lấy tất cả từ bảng users, lọc status là 'active' và giới hạn 5 dòng."
    ],
    starterCode: `-- Viết câu lệnh SELECT lấy danh sách người dùng active giới hạn 5 dòng
SELECT * FROM users WHERE status = 'active' LIMIT 5;`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("SELECT *") && c.includes("FROM USERS") && c.includes("WHERE STATUS = 'ACTIVE'") && c.includes("LIMIT 5");
    },
    practiceType: "drag_drop_sql",
    dragBlocks: [
      { id: "s1", text: "SELECT *" },
      { id: "s2", text: "FROM users" },
      { id: "s3", text: "WHERE status = 'active'" },
      { id: "s4", text: "LIMIT 5" }
    ],
    correctOrder: ["s1", "s2", "s3", "s4"],
    miniQuiz: [
      { q: "Mệnh đề 'WHERE' trong SQL dùng để làm gì?", o: ["Sắp xếp dữ liệu", "Lọc dữ liệu", "Xoá dữ liệu", "Giới hạn số dòng"], a: 1 },
      { q: "Lệnh 'SELECT *' có nghĩa là gì?", o: ["Chọn tất cả các bảng", "Chọn tất cả các dòng", "Chọn tất cả các cột", "Đếm tất cả dữ liệu"], a: 2 },
      { q: "MySQL là hệ quản trị cơ sở dữ liệu thuộc loại nào?", o: ["NoSQL", "Graph Database", "Relational Database (Quan hệ)", "Document Database"], a: 2 }
    ]
  },
  {
    id: "lesson6",
    title: "6. Giới thiệu PHP & MySQL Backend",
    lang: "php",
    file: "src/lesson6.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
PHP là ngôn ngữ lập trình phía máy chủ (Server-side). Nó nhận request từ trình duyệt, kết nối cơ sở dữ liệu qua PDO, xử lý logic, biên dịch mã nguồn thành mã HTML thô rồi gửi trả lại cho người dùng.

### ÁP DỤNG HỆ THỐNG
Mọi thông tin như tiền, mật khẩu, và quyền truy cập của thành viên đều bắt buộc phải xử lý và kiểm soát ở Backend (PHP) để đảm bảo không bị chỉnh sửa ác ý từ phía client.

### THỰC HÀNH NHỎ
Nối các cặp khái niệm biến \`$\`, từ khóa \`echo\`, đối tượng kết nối cơ sở dữ liệu \`PDO\`, và toán tử nối chuỗi \`.\` của PHP.

### KIỂM TRA HOÀN TẤT
Đảm bảo file PHP có thẻ mở \`<?php\`, có chứa ký tự biến \`$\` và lệnh \`echo\`, và thẻ đóng \`?>\`.`,
    tasks: [
      "Thực hành ghép nối các cặp từ khóa PHP với định nghĩa chính xác để vượt qua bài học."
    ],
    starterCode: `<?php
$title = "Học lập trình Backend PHP";
echo "Chào mừng bạn: " . $title;
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("<?php") && c.includes("$") && c.includes("echo") && c.includes("?>");
    },
    practiceType: "php_match",
    matchPairs: [
      { key: "$ (Đô-la)", val: "Khai báo biến" },
      { key: "echo", val: "In dữ liệu ra HTML" },
      { key: "PDO", val: "Kết nối Cơ sở dữ liệu" },
      { key: ". (Dấu chấm)", val: "Ghép hai chuỗi ký tự" }
    ],
    miniQuiz: [
      { q: "Biến trong PHP luôn bắt đầu bằng ký tự nào?", o: ["#", "@", "$", "&"], a: 2 },
      { q: "Ngôn ngữ PHP chạy ở đâu?", o: ["Trình duyệt (Client)", "Máy chủ (Server)", "Database", "Hệ điều hành"], a: 1 },
      { q: "Lệnh nào dùng để in dữ liệu ra trình duyệt bằng PHP?", o: ["print_out", "console.log", "echo", "write"], a: 2 }
    ]
  },
  {
    id: "lesson7",
    title: "7. Thử thách tìm & vá lỗi (Debugging)",
    lang: "php",
    file: "src/lesson7.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Lỗi trong lập trình chia làm hai loại chính: Lỗi cú pháp (Syntax Error - làm dừng chương trình ngay lập tức) và Lỗi logic (Logical Bug - chương trình vẫn chạy nhưng trả về kết quả sai hoặc gây rò rỉ dữ liệu).

### ÁP DỤNG HỆ THỐNG
Kiểm soát lỗi biên mảng (off-by-one), type coercion (tự ép kiểu lỏng lẻo trong PHP), lỗi biến không xác định (null check), và chuẩn bị lệnh truy vấn SQL (Prepared Statement) để tránh lỗ hổng bảo mật.

### THỰC HÀNH NHỎ
Vá 4 lỗi logic trong tệp PHP khởi tạo: sửa vòng lặp vượt biên, ép kiểu giá trị số, thêm null-coalescing, và dùng prepared statements.

### KIỂM TRA HOÀN TẤT
Code PHP sau khi sửa phải đảm bảo: điều kiện vòng lặp dùng \`<\` thay vì \`<=\`, ép kiểu số \`(int)$price\`, null-check \`??\`, và dùng hàm \`prepare()\` cùng \`execute()\` của PDO.`,
    tasks: [
      "**Bug #1**: Mảng có 5 phần tử (index 0-4), code access index 5 → sửa điều kiện lặp thành < count",
      "**Bug #2**: Ép kiểu số cho biến $price để phép cộng chuỗi không lỗi.",
      "**Bug #3**: Thêm toán tử null coalescing ?? để gán biến action an toàn.",
      "**Bug #4**: Thay thế SQL Injection bằng Prepared Statement."
    ],
    starterCode: `<?php
// BUG #1: Loop vượt quá array bounds
$products = ['A', 'B', 'C', 'D', 'E'];
for ($i = 0; $i < count($products); $i++) {
  echo $products[$i];
}

// BUG #2: Type coercion issue
$price = "99";
$newPrice = (int)$price + 10;
echo $newPrice;

// BUG #3: No null check
$action = $_GET['action'] ?? null;
if ($action) { /* ... */ }

// BUG #4: SQL Injection
$id = $_GET['id'] ?? 0;
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
?>`,
    hints: [
      "Bug #1: Dùng < thay vì <= trong loop condition",
      "Bug #2: Explicit cast: (int)$price + 10",
      "Bug #3: Dùng null coalescing: $_GET['action'] ?? null",
      "Bug #4: LUÔN dùng prepared statements: pdo->prepare()"
    ],
    resources: [
      { title: "PHP Variable Debugging", url: "https://www.php.net/manual/en/function.var-dump.php" },
      { title: "SQL Injection Prevention", url: "https://owasp.org/www-community/attacks/SQL_Injection" }
    ],
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const bug1 = c.includes("<count($products)");
      const bug2 = c.includes("(int)$price") || c.includes("intval($price)");
      const bug3 = c.includes("isset($_get['action'])") || c.includes("$_get['action']??");
      const bug4 = c.includes("prepare(") && c.includes("execute(");
      return bug1 && bug2 && bug3 && bug4;
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Khi gặp lỗi E_WARNING 'Undefined offset: 5', bạn cần làm gì đầu tiên?", o: ["Xóa code", "Check array bounds & loop condition", "Tăng memory_limit", "Restart PHP"], a: 1 },
      { q: "Type coercion '99' + 10 trong PHP trả kết quả gì?", o: ["'9910' (string concatenation)", "109 (type cast to int)", "Error", "null"], a: 1 },
      { q: "SQL Injection 'OR 1=1' nguy hiểm vì sao?", o: ["Làm chậm query", "Trả về tất cả records thay vì 1", "Xóa database", "Không nguy hiểm"], a: 1 }
    ]
  },
  {
    id: "lesson8",
    title: "8. CSS Flexbox & Giao diện Responsive",
    lang: "html",
    file: "src/lesson8.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Responsive Web Design giúp trang web hiển thị tối ưu trên mọi màn hình. Sử dụng \`@media\` query để thay đổi CSS và áp dụng CSS Flexbox (\`display: flex\`) để xếp sắp luồng giao diện tự động.

### ÁP DỤNG HỆ THỐNG
Tỷ lệ người dùng lướt web bằng thiết bị di động chiếm hơn 60%. Xây dựng responsive chuẩn đảm bảo trải nghiệm khách hàng đồng đều và gia tăng tỷ lệ chuyển đổi.

### THỰC HÀNH NHỎ
Viết các thuộc tính CSS Flexbox định nghĩa trục chính dọc (column) cho mobile và ngang (row) cho màn hình lớn.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn CSS có sử dụng quy tắc truyền thông \`@media\` và thuộc tính bố cục \`display: flex\`.`,
    tasks: [
      "Xây dựng trang Portfolio responsive với: header, navigation menu (flex), và media queries thích ứng màn hình."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio - Responsive</title>
  <style>
    nav {
      display: flex;
    }
    @media (max-width: 768px) {
      nav {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="#">Trang chủ</a>
      <a href="#">Dự án</a>
      <a href="#">Liên hệ</a>
    </nav>
  </header>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("@media") && c.includes("display:flex");
    },
    practiceType: "code_challenge",
    hints: [
      "Bắt đầu từ mobile CSS, sau đó thêm @media (min-width: 768px) cho màn hình lớn hơn.",
      "Sử dụng display: flex để kích hoạt hộp căn chỉnh linh hoạt."
    ],
    miniQuiz: [
      { q: "Một trang web có @media (min-width: 768px) { width: 50% }. Trên màn hình 800px, chiều rộng là bao nhiêu?", o: ["Phụ thuộc vào CSS cha", "50% (vì 800px >= 768px)", "Lỗi", "Không thể xác định"], a: 1 },
      { q: "Viewport meta tag có tác dụng gì?", o: ["Ẩn thanh địa chỉ", "Cho phép zoom", "Cấu hình tỉ lệ co giãn trang chuẩn theo màn hình", "Không quan trọng"], a: 2 }
    ]
  },
  {
    id: "lesson9",
    title: "9. Capstone: Trang chi tiết sản phẩm",
    lang: "php",
    file: "src/lesson9.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Một ứng dụng Full-stack hoàn chỉnh bao gồm Frontend (giao diện, fetch gọi dữ liệu) và Backend (API, kết nối và truy vấn CSDL, kiểm soát an toàn, trả về JSON).

### ÁP DỤNG HỆ THỐNG
Khi người dùng truy cập trang sản phẩm, frontend thực hiện yêu cầu AJAX/fetch gửi lên API, backend nhận diện ID sản phẩm, truy vấn trong MySQL rồi trả về dạng JSON để frontend vẽ ra UI.

### THỰC HÀNH NHỎ
Hoàn thiện API PHP kết nối PDO, chuẩn bị truy vấn SQL với tham số an toàn và trả về tiêu đề JSON Content-Type.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ chạy thử file PHP của bạn để xác minh có sử dụng truy vấn an sau \`prepare()\`, thực thi \`execute()\` và trả định dạng dữ liệu \`json_encode()\` kèm header \`application/json\`.`,
    tasks: [
      "Viết API endpoint chi tiết sản phẩm bằng PHP, validate tham số đầu vào và trả về JSON an toàn."
    ],
    starterCode: `<?php
header("Content-Type: application/json");
$pdo = new PDO("mysql:host=localhost;dbname=ecommerce", "root", "");

$productId = $_GET['id'] ?? null;
if (!$productId || !is_numeric($productId)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid product ID"]);
  exit;
}

$stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
$stmt->execute([$productId]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode($product);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const pdo = c.includes("prepare(") && c.includes("execute(");
      const json = c.includes("json_encode(") && c.includes("application/json");
      return pdo && json;
    },
    practiceType: "capstone",
    hints: [
      "Tham số lấy từ client thông qua $_GET['id'] bắt buộc phải validate bằng is_numeric()",
      "LUÔN dùng Prepared Statements để ngăn chặn triệt để SQL Injection."
    ],
    miniQuiz: [
      { q: "Tại sao cần gửi tiêu đề Content-Type: application/json?", o: ["Để hiển thị dạng chữ", "Báo trình duyệt biết đây là dữ liệu JSON để parse tự động", "Bảo mật", "Tăng tốc độ mạng"], a: 1 },
      { q: "Hàm is_numeric() dùng để làm gì trong API?", o: ["Băm mật khẩu", "Kiểm tra xem tham số nhận được có phải là số hợp lệ không", "Tìm kiếm chữ", "Tải trang"], a: 1 }
    ]
  },
  {
    id: "lesson10",
    title: "10. Bảo mật nâng cao & Tối ưu hóa",
    lang: "php",
    file: "src/lesson10.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Hai lỗ hổng bảo mật nguy hiểm hàng đầu trên web là: XSS (Cross-Site Scripting - tiêm nhiễm mã độc JavaScript vào trình duyệt) và SQL Injection (chèn câu truy vấn SQL trái phép để lấy hoặc phá hủy dữ liệu).

### ÁP DỤNG HỆ THỐNG
Học cách sử dụng \`htmlspecialchars()\` để làm sạch dữ liệu hiển thị (chống XSS), sử dụng Prepared Statements (chống SQL Injection), và băm mật khẩu bằng thuật toán mạnh \`password_hash()\` kèm muối bảo mật (salt).

### THỰC HÀNH NHỎ
Vá các lỗ hổng bảo mật cơ bản bằng cách áp dụng các hàm băm và escape của PHP.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn áp dụng đồng thời cả 3 quy tắc: \`htmlspecialchars()\`, \`prepare()\` kết hợp \`execute()\`, và \`password_hash()\` với thuật toán \`PASSWORD_BCRYPT\`.`,
    tasks: [
      "Viết tệp PHP xử lý đăng ký tài khoản an toàn: chống XSS đầu ra, chống SQL Injection truy vấn và băm mật khẩu."
    ],
    starterCode: `<?php
// XSS Prevention
echo htmlspecialchars($_GET['name'] ?? '', ENT_QUOTES, 'UTF-8');

// SQL Injection Prevention
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$_POST['email'] ?? '']);

// Secure Password Hashing
$hashed = password_hash($_POST['password'] ?? '', PASSWORD_BCRYPT);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const xss = c.includes("htmlspecialchars(");
      const sql = c.includes("prepare(") && c.includes("execute(");
      const bcrypt = c.includes("password_hash(") && c.includes("password_bcrypt");
      return xss && sql && bcrypt;
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thuật toán nào sau đây được khuyến nghị cho băm mật khẩu trong PHP?", o: ["md5", "sha1", "PASSWORD_BCRYPT", "base64_encode"], a: 2 },
      { q: "Mục đích chính của hàm htmlspecialchars() là gì?", o: ["Bảo mật chống SQL Injection", "Bảo mật chống XSS (Cross-site scripting) bằng cách vô hiệu hóa thẻ HTML", "Tối ưu hóa tốc độ trang", "Nén file"], a: 1 }
    ]
  }
];
