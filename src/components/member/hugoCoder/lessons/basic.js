export const BASIC_LESSONS = [
  {
    id: "lesson1",
    title: "1. Giới thiệu HTML & Code cơ bản (Semantic HTML)",
    lang: "html",
    file: "src/lesson1.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo tiêu chuẩn **MDN Web Docs** và **freeCodeCamp Curriculum**, HTML (HyperText Markup Language) là ngôn ngữ đánh dấu siêu văn bản dùng để xây dựng cấu trúc nền tảng cho trang web. Một tài liệu chuẩn quốc tế luôn bắt đầu bằng \`<!DOCTYPE html>\` để khai báo chế độ chuẩn (standards mode) cho trình duyệt, sử dụng thẻ \`<html lang="vi">\` để tối ưu SEO, và sử dụng các thẻ có cấu trúc ngữ nghĩa (Semantic HTML) như \`<header>\`, \`<main>\`, \`<footer>\` thay vì dùng các thẻ \`<div>\` vô nghĩa.

### ÁP DỤNG HỆ THỐNG
Trong các dự án thực tế theo triết lý **The Odin Project**, cấu trúc HTML đúng ngữ nghĩa không chỉ giúp cải thiện thứ hạng SEO mà còn là bắt buộc đối với khả năng tiếp cận (Accessibility - A11y), giúp các công cụ đọc màn hình của người khiếm thị hiểu được nội dung trang web.

### THỰC HÀNH NHỎ
Bạn hãy sắp xếp các thẻ HTML theo thứ tự phân cấp tiêu chuẩn từ ngoài vào trong: \`<!DOCTYPE html>\`, \`<html lang="vi">\`, \`<head>\`, \`<body>\`.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ xác minh xem mã nguồn của bạn có chứa các phần tử chuẩn: \`<!DOCTYPE html>\`, \`<html\`, \`<head>\`, \`<title>\`, \`<body>\`, \`<h1>\`, và \`<p>\` hay chưa.`,
    tasks: [
      "Xây dựng khung HTML5 chuẩn ngữ nghĩa MDN: chứa DOCTYPE, html, head, title, body, h1 và thẻ p."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bài 1: HTML Chuẩn Quốc Tế</title>
</head>
<body>
    <header>
        <h1>Chào mừng bạn đến với HugoCoder!</h1>
    </header>
    <main>
        <p>Học để hiểu, thực hành thực chiến chuẩn MDN & freeCodeCamp.</p>
    </main>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("<!doctypehtml>") && c.includes("<html") && c.includes("<head>") && c.includes("<title>") && c.includes("<body>") && c.includes("<h1>") && c.includes("<p>");
    },
    practiceType: "drag_drop_html",
    dragBlocks: [
      { id: "b1", text: "<!DOCTYPE html>" },
      { id: "b2", text: "<html lang=\"vi\">" },
      { id: "b3", text: "<head>" },
      { id: "b4", text: "<body>" }
    ],
    correctOrder: ["b1", "b2", "b3", "b4"],
    miniQuiz: [
      { q: "Tại sao nên dùng các thẻ Semantic như <header>, <main> thay vì <div>?", o: ["Giúp trang chạy nhanh hơn", "Tối ưu hóa SEO và khả năng tiếp cận (Accessibility) theo MDN", "Làm đẹp giao diện", "Không có tác dụng gì"], a: 1 },
      { q: "Thẻ <head> thường dùng để chứa thông tin nào?", o: ["Văn bản hiển thị", "Hình ảnh lớn", "Siêu dữ liệu (Metadata) và tiêu đề trang", "Nút bấm"], a: 2 },
      { q: "Khai báo <!DOCTYPE html> ở đầu file có ý nghĩa gì?", o: ["Khai báo liên kết CSS", "Báo trình duyệt hiển thị trang theo chế độ chuẩn (Standards Mode)", "Đăng ký tên miền", "Viết script"], a: 1 }
    ]
  },
  {
    id: "lesson2",
    title: "2. CSS Fundamentals & Box Model",
    lang: "html",
    file: "src/lesson2.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo cẩm nang **MDN Web Docs** và khóa học **The Odin Project**, CSS Box Model là mô hình hộp nền tảng của mọi phần tử giao diện web. Mỗi phần tử là một chiếc hộp chữ nhật gồm 4 lớp từ trong ra ngoài:
1. **Content**: Nội dung hiển thị (chữ, ảnh).
2. **Padding**: Khoảng đệm giữa nội dung và viền.
3. **Border**: Đường viền bao quanh phần tử.
4. **Margin**: Khoảng cách từ viền đến các phần tử xung quanh.

### ÁP DỤNG HỆ THỐNG
Áp dụng thuộc tính \`box-sizing: border-box\` giúp kích thước hộp (\`width\`, \`height\`) đã bao gồm cả \`padding\` và \`border\`. Đây là quy chuẩn thực tế quốc tế giúp việc tính toán kích thước giao diện không bị sai lệch hoặc tràn vỡ khung layout.

### THỰC HÀNH NHỎ
Định dạng một lớp Card có nền xanh dương đậm (\`background-color: #0056b3\`) và chữ màu trắng (\`color: #ffffff\`) đạt độ tương phản chuẩn WCAG.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ quét mã CSS của bạn để tìm bộ chọn \`.card\` chứa \`background-color: #0056b3\` và \`color: #ffffff\`.`,
    tasks: [
      "Thực hành: Định dạng class .card đạt chuẩn Box Model với nền xanh dương #0056b3 và chữ trắng #ffffff."
    ],
    starterCode: `<style>
.card {
    background-color: #0056b3;
    color: #ffffff;
    padding: 20px;
    border-radius: 10px;
    box-sizing: border-box;
}
</style>
<div class="card">
    <h2>Giao diện Card chuẩn Box Model</h2>
    <p>Học để hiểu, thực hành đúng quy cách thiết kế giao diện.</p>
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
      { q: "Thuộc tính 'box-sizing: border-box' có tác dụng gì?", o: ["Ẩn phần thừa của hộp", "Gộp padding và border vào kích thước tổng của hộp", "Tạo viền tròn", "Làm nghiêng hộp"], a: 1 },
      { q: "Khoảng cách margin nằm ở vị trí nào của phần tử?", o: ["Bên trong viền border", "Giữa content và padding", "Bên ngoài viền border, tạo khoảng cách với các hộp khác", "Chính giữa viền"], a: 2 },
      { q: "Độ tương phản chữ tối thiểu cho văn bản thông thường theo chuẩn WCAG là bao nhiêu?", o: ["2:1", "3:1", "4.5:1", "10:1"], a: 2 }
    ]
  },
  {
    id: "lesson3",
    title: "3. JavaScript ES6+ & DOM Events",
    lang: "html",
    file: "src/lesson3.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo quy chuẩn **W3Schools Exercises** và **MDN Web Docs**, DOM (Document Object Model) là giao diện lập trình cho tài liệu web. Để bắt các hành vi tương tác từ người dùng, chúng ta sử dụng phương thức \`addEventListener()\` để đăng ký trình lắng nghe sự kiện trên các phần tử DOM, tách biệt hoàn toàn giữa cấu trúc (HTML) và hành vi (JavaScript).

### ÁP DỤNG HỆ THỐNG
Tránh sử dụng các thuộc tính inline kiểu cũ như \`onclick="..."\` trực tiếp trong HTML vì nó gây khó khăn cho việc gỡ lỗi, kiểm thử và vi phạm các quy tắc an toàn bảo mật nội dung trang web (Content Security Policy - CSP).

### THỰC HÀNH NHỎ
Nhấp chuột vào nút bấm có ID là \`btn\` để kiểm tra việc tăng bộ đếm sự kiện lên số 3.

### KIỂM TRA HOÀN TẤT
Hệ thống kiểm tra mã nguồn JS xem bạn đã gọi đúng hàm lấy phần tử \`document.getElementById('btn')\` và gán sự kiện click thông qua \`addEventListener('click', ...)\`.`,
    tasks: [
      "Đăng ký sự kiện click cho nút bấm chuẩn ES6+ và cập nhật tương tác DOM."
    ],
    starterCode: `<button id="btn">Click me</button>
<script>
const button = document.getElementById("btn");
button.addEventListener("click", () => {
    console.log("Button clicked!");
});
</script>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("getelementbyid") && c.includes("click") && c.includes("addeventlistener");
    },
    practiceType: "js_button",
    miniQuiz: [
      { q: "Tại sao addEventListener được khuyến nghị thay cho thuộc tính inline onclick?", o: ["Chạy nhanh hơn", "Cho phép gán nhiều listener và tuân thủ Content Security Policy (CSP)", "Tự động sửa lỗi code", "Dễ viết hơn"], a: 1 },
      { q: "Lệnh nào dùng để khai báo hằng số không thể gán lại giá trị trong ES6?", o: ["let", "var", "const", "define"], a: 2 },
      { q: "Sự kiện nào kích hoạt khi người dùng thay đổi giá trị trong ô nhập liệu?", o: ["click", "submit", "change", "mouseover"], a: 2 }
    ]
  },
  {
    id: "lesson4",
    title: "4. Kiểm tra Kiến thức Web 1 (Fully Automated Exam)",
    lang: "html",
    file: "src/lesson4.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Bài kiểm tra tự động hóa toàn bộ theo cấu trúc đánh giá năng lực của **W3Schools** và **freeCodeCamp**. Nội dung bao gồm kiến thức cơ bản về Semantic HTML5, CSS Box Model, CSS Selector và tương tác sự kiện DOM.

### ÁP DỤNG HỆ THỐNG
Đánh giá định kỳ giúp củng cố kiến thức nền tảng trước khi chuyển sang các chủ đề phức tạp hơn về cơ sở dữ liệu quan hệ và máy chủ Backend PHP.

### THỰC HÀNH NHỎ
Hoàn thành bộ câu hỏi thi trắc nghiệm gồm 5 câu hỏi ngẫu nhiên.

### KIỂM TRA HOÀN TẤT
Bạn cần đạt tối thiểu 3/5 câu đúng (>= 60%) để vượt qua bài kiểm tra này.`,
    tasks: [
      "Hoàn thành bài kiểm tra lý thuyết và thực hành Web cơ bản."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 5
  },
  {
    id: "lesson5",
    title: "5. Cơ sở dữ liệu SQL & MySQL Basics",
    lang: "sql",
    file: "src/lesson5.sql",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo quy chuẩn **W3Schools SQL Tutorial**, SQL (Structured Query Language) là ngôn ngữ chuẩn quốc tế để tương tác với các hệ quản trị cơ sở dữ liệu quan hệ (RDBMS). Một câu lệnh truy vấn dữ liệu chuẩn mực yêu cầu viết HOA các từ khóa chính (\`SELECT\`, \`FROM\`, \`WHERE\`, \`LIMIT\`) và kết thúc bằng dấu chấm phẩy \`;\`.

### ÁP DỤNG HỆ THỐNG
Trong hệ thống thực tế, việc lọc và giới hạn dữ liệu ở tầng CSDL bằng \`WHERE\` và \`LIMIT\` là cực kỳ quan trọng để bảo vệ hiệu năng máy chủ, tránh tải hàng triệu dòng dữ liệu không cần thiết lên bộ nhớ RAM.

### THỰC HÀNH NHỎ
Sắp xếp các mệnh đề SQL để truy vấn tất cả người dùng có trạng thái kích hoạt, giới hạn 5 bản ghi.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ chạy thử và kiểm tra câu lệnh SQL xem có đầy đủ: \`SELECT *\`, \`FROM users\`, \`WHERE status = 'active'\`, và \`LIMIT 5\` không.`,
    tasks: [
      "Viết truy vấn SQL chuẩn cú pháp quốc tế để lọc người dùng active kèm giới hạn 5 bản ghi."
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
      { q: "Tại sao nên viết hoa các từ khóa SQL chính?", o: ["Bắt buộc từ trình dịch", "Theo quy ước viết code sạch (clean code) để tăng tính dễ đọc", "Giúp query chạy nhanh hơn", "Chống hacker"], a: 1 },
      { q: "Mệnh đề LIMIT 5 có ý nghĩa gì?", o: ["Chỉ lấy 5 cột", "Giới hạn tối đa trả về 5 dòng dữ liệu", "Lọc dữ liệu lớn hơn 5", "Xóa 5 dòng"], a: 2 },
      { q: "Hệ cơ sở dữ liệu quan hệ RDBMS lưu trữ dữ liệu dưới dạng nào?", o: ["Dạng cây không cấu trúc", "Dạng bảng gồm các cột và các dòng", "Dạng file văn bản thô", "Dạng đồ thị"], a: 1 }
    ]
  },
  {
    id: "lesson6",
    title: "6. Backend Development: PHP & MySQL Connection",
    lang: "php",
    file: "src/lesson6.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo tài liệu kiến trúc backend của **The Odin Project**, máy chủ backend chịu trách nhiệm nhận request, xử lý logic an toàn và truy xuất cơ sở dữ liệu. PHP kết nối MySQL sử dụng lớp **PDO** (PHP Data Objects) - chuẩn mực kết nối hướng đối tượng an toàn, hỗ trợ chuẩn bị truy vấn (Prepared Statements) chống lỗi tiêm nhiễm mã độc.

### ÁP DỤNG HỆ THỐNG
Bảo mật backend là nguyên tắc tối thượng: Toàn bộ dữ liệu nhạy cảm như thông tin người dùng, số dư ví JOY bắt buộc phải xử lý dưới máy chủ PHP, tuyệt đối không tin tưởng bất cứ tính toán nào gửi lên từ trình duyệt Client.

### THỰC HÀNH NHỎ
Định nghĩa biến, thực hiện phép ghép chuỗi bằng toán tử dấu chấm \`.\` và in ra kết quả.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã PHP mở đầu bằng \`<?php\`, kết thúc bằng \`?>\`, khai báo biến với ký tự \`$\` và sử dụng lệnh xuất dữ liệu \`echo\`.`,
    tasks: [
      "Thực hành cú pháp PHP cơ bản: viết thẻ mở/đóng, khai báo biến và dùng lệnh echo."
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
      { q: "Tại sao nên dùng thư viện PDO thay cho mysql_connect kiểu cũ?", o: ["PDO chạy nhanh gấp 10 lần", "PDO cung cấp Prepared Statements giúp chống SQL Injection an toàn hơn", "PDO dễ gõ hơn", "PDO chỉ có trên Linux"], a: 1 },
      { q: "Toán tử ghép chuỗi trong PHP là gì?", o: ["Dấu cộng (+)", "Dấu chấm (.)", "Dấu và (&)", "Dấu gạch ngang (-)"], a: 1 },
      { q: "Mã nguồn PHP chạy ở môi trường nào?", o: ["Trình duyệt của khách hàng", "Phía máy chủ (Server-side)", "Tại card mạng", "Tại ổ đĩa cứng client"], a: 1 }
    ]
  },
  {
    id: "lesson7",
    title: "7. Bug Hunting & Debugging",
    lang: "php",
    file: "src/lesson7.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo quy trình gỡ lỗi chuẩn **The Odin Project** và **MDN Web Docs**, một nhà phát triển phải phân biệt rõ lỗi cú pháp (Syntax Errors - làm chương trình sập ngay lập tức) và lỗi logic (Logical Bugs - chương trình vẫn chạy nhưng cho kết quả sai hoặc gây rò rỉ dữ liệu).

### ÁP DỤNG HỆ THỐNG
Bài tập thực hành này mô phỏng 4 lỗi bảo mật và vận hành kinh điển:
1. **Lỗi vượt biên mảng (Off-by-one error)**: Gây treo/lỗi bộ nhớ.
2. **Lỗi kiểu dữ liệu (Type Coercion)**: Gây sai lệch tính toán số học.
3. **Lỗi biến chưa được khởi tạo (Null reference)**: Sập chương trình khi tham số rỗng.
4. **Lỗ hổng SQL Injection**: Hacker có thể chiếm quyền kiểm soát toàn bộ cơ sở dữ liệu.

### THỰC HÀNH NHỎ
Vá 4 lỗi logic trong file starter code: sửa vòng lặp vượt biên, ép kiểu giá trị số, thêm toán tử null-coalescing, và đổi sang dùng Prepared Statements.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn áp dụng: điều kiện lặp \`<\` thay vì \`<=\`, ép kiểu số \`(int)\`, null-coalescing \`??\`, và dùng các hàm \`prepare()\` kết hợp \`execute()\` của PDO.`,
    tasks: [
      "**Bug #1**: Sửa điều kiện lặp vượt biên mảng thành < count.",
      "**Bug #2**: Ép kiểu số (int) cho biến chuỗi price trước khi cộng.",
      "**Bug #3**: Dùng null coalescing ?? để bảo vệ biến $_GET['action'].",
      "**Bug #4**: Thay thế truy vấn nối chuỗi thô bằng PDO Prepared Statement."
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
      "Bug #1: Sử dụng dấu so sánh < thay vì <= đối với độ dài mảng.",
      "Bug #2: Ép kiểu tường minh bằng cách đặt (int) trước tên biến.",
      "Bug #3: Sử dụng toán tử ?? để thiết lập giá trị mặc định cho biến.",
      "Bug #4: Sử dụng pdo->prepare() và truyền tham số dạng mảng vào execute()."
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
      { q: "Lỗ hổng SQL Injection xảy ra do nguyên nhân chính nào?", o: ["Nối chuỗi dữ liệu đầu vào chưa được lọc trực tiếp vào câu lệnh SQL", "Cơ sở dữ liệu bị quá tải", "Không cài đặt mật khẩu cho root", "Kết nối SSL thất bại"], a: 0 },
      { q: "Toán tử ?? trong PHP dùng để làm gì?", o: ["Thực hiện phép chia", "Trả về toán tử bên trái nếu nó tồn tại và khác null; ngược lại trả về bên phải", "So sánh bằng", "Gán biến số"], a: 1 }
    ]
  },
  {
    id: "lesson8",
    title: "8. CSS Flexbox & Responsive Layouts",
    lang: "html",
    file: "src/lesson8.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo giáo trình **freeCodeCamp Responsive Web Design** và **MDN Web Docs**, Responsive là kỹ thuật thiết kế giúp giao diện trang web thích ứng hoàn hảo với mọi kích thước màn hình. CSS Flexbox là công cụ dàn trang 1 chiều cực mạnh thông qua thuộc tính \`display: flex\`, cho phép co giãn phần tử linh hoạt mà không cần tính toán tọa độ thủ công.

### ÁP DỤNG HỆ THỐNG
Sử dụng truy vấn truyền thông \`@media (max-width: 768px)\` để định nghĩa lại hướng hiển thị của Flexbox (ví dụ chuyển từ hàng ngang \`row\` trên desktop sang cột dọc \`column\` trên mobile).

### THỰC HÀNH NHỎ
Viết các thuộc tính CSS Flexbox định nghĩa trục chính dọc cho mobile và ngang cho màn hình lớn.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn CSS có chứa quy tắc \`@media\` thích ứng màn hình và thuộc tính layout \`display: flex\`.`,
    tasks: [
      "Xây dựng menu điều hướng responsive sử dụng display: flex và @media query theo chuẩn MDN."
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
      justify-content: space-around;
      background: #f4f4f9;
      padding: 10px;
    }
    @media (max-width: 768px) {
      nav {
        flex-direction: column;
        align-items: center;
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
      "Khai báo display: flex trên phần tử cha để kích hoạt chế độ hộp Flexbox.",
      "Đặt quy tắc @media với max-width thích hợp để thay đổi flex-direction trên màn hình nhỏ."
    ],
    miniQuiz: [
      { q: "Thuộc tính nào dùng để đổi hướng các phần tử trong hộp Flexbox?", o: ["justify-content", "align-items", "flex-direction", "flex-wrap"], a: 2 },
      { q: "Ý nghĩa của thẻ meta viewport trong trang responsive là gì?", o: ["Giúp trang load nhanh", "Thiết lập chiều rộng trang khớp với chiều rộng màn hình thiết bị và tỷ lệ co giãn ban đầu", "Liên kết CSS", "Không quan trọng"], a: 1 }
    ]
  },
  {
    id: "lesson9",
    title: "9. Capstone Project: RESTful Product Detail API",
    lang: "php",
    file: "src/lesson9.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Dự án Capstone theo phong cách **The Odin Project**. Một sản phẩm web hoàn chỉnh kết nối Frontend (giao diện, Fetch API gọi dữ liệu) và Backend (API PHP kết nối cơ sở dữ liệu MySQL thông qua PDO và trả dữ liệu chuẩn JSON).

### ÁP DỤNG HỆ THỐNG
Khi người dùng truy cập trang chi tiết sản phẩm, Frontend JavaScript gửi một HTTP GET Request lên API backend. Backend PHP nhận diện ID sản phẩm từ query string, thực thi Prepared Statement trong MySQL để lấy thông tin sản phẩm, và gửi trả dữ liệu dưới dạng JSON cùng HTTP status code tương ứng.

### THỰC HÀNH NHỎ
Hoàn thiện endpoint API bằng PHP kết nối PDO, chuẩn bị truy vấn SQL an toàn và trả thông tin với header định dạng JSON.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ chạy thử file PHP của bạn và kiểm tra có thiết lập tiêu đề header \`application/json\`, sử dụng \`prepare()\` kết hợp \`execute()\` và trả ra chuỗi bằng \`json_encode()\`.`,
    tasks: [
      "Xây dựng API endpoint chi tiết sản phẩm an toàn bằng PHP kết nối database MySQL thực tế."
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
      "Luôn kiểm tra dữ liệu đầu vào $_GET['id'] có phải là số hợp lệ không bằng hàm is_numeric().",
      "Trả về mã trạng thái HTTP 400 Bad Request nếu dữ liệu đầu vào không hợp lệ."
    ],
    miniQuiz: [
      { q: "Mã trạng thái HTTP nào biểu thị lỗi từ phía người dùng gửi dữ liệu sai cấu trúc?", o: ["200 OK", "404 Not Found", "400 Bad Request", "500 Server Error"], a: 2 },
      { q: "Tại sao cần dùng json_encode() trước khi in dữ liệu trả về?", o: ["Để nén file", "Để chuyển đổi mảng/đối tượng PHP thành định dạng chuỗi JSON chuẩn quốc tế mà JavaScript có thể đọc", "Để mã hóa mật khẩu", "Tăng tốc độ truyền mạng"], a: 1 }
    ]
  },
  {
    id: "lesson10",
    title: "10. Security & Web Optimization (OWASP Security Standards)",
    lang: "php",
    file: "src/lesson10.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Theo tiêu chuẩn bảo mật của **OWASP** (Open Web Application Security Project) được giảng dạy tại **freeCodeCamp** và **The Odin Project**, các mối đe dọa hàng đầu gồm XSS (tiêm nhiễm script phá hoại giao diện) và SQL Injection (chiếm quyền truy vấn dữ liệu). Học viên bắt buộc phải nắm rõ cách phòng chống:
1. **Chống XSS**: Sử dụng hàm \`htmlspecialchars()\` làm sạch mọi dữ liệu lấy từ người dùng trước khi in ra HTML.
2. **Chống SQL Injection**: Sử dụng các câu truy vấn có chuẩn bị (Prepared Statements).
3. **Bảo mật mật khẩu**: Tuyệt đối không lưu mật khẩu dạng thô. Bắt buộc sử dụng hàm \`password_hash()\` với thuật toán mạnh như \`PASSWORD_BCRYPT\`.

### ÁP DỤNG HỆ THỐNG
Mật khẩu của thành viên trên cổng HugoCoder đều được băm bằng thuật toán BCRYPT và muối bảo mật ngẫu nhiên, giúp chống lại các cuộc tấn công dò tìm bảng mã băm (Rainbow Table attacks) ngay cả khi database bị rò rỉ.

### THỰC HÀNH NHỎ
Vá các lỗ hổng bảo mật cơ bản bằng cách áp dụng hàm băm và làm sạch dữ liệu của PHP.

### KIỂM TRA HOÀN TẤT
Đảm bảo tệp PHP áp dụng đồng thời: \`htmlspecialchars()\`, \`prepare()\` cùng \`execute()\`, và \`password_hash()\` với \`PASSWORD_BCRYPT\`.`,
    tasks: [
      "Triển khai quy chuẩn bảo mật OWASP: chống XSS đầu ra, chống SQL Injection truy vấn và băm mật khẩu an toàn."
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
      { q: "Thuật toán băm nào sau đây KHÔNG an toàn để lưu mật khẩu?", o: ["PASSWORD_BCRYPT", "md5 (vì dễ bị giải mã ngược qua bảng cầu vồng)", "PASSWORD_ARGON2I", "Argon2id"], a: 1 },
      { q: "Tham số ENT_QUOTES trong htmlspecialchars() có tác dụng gì?", o: ["Mã hóa cả dấu nháy đơn và nháy kép để chống XSS trong thuộc tính HTML", "Làm chữ in hoa", "Nén dung lượng", "Tạo liên kết"], a: 0 }
    ]
  }
];
