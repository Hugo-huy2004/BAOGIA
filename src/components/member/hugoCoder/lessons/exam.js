export const EXAM_LESSONS = [
  {
    id: "lesson61",
    title: "61. Bài Kiểm Tra Tổng Hợp Số 1 (Chặng 1-4)",
    lang: "html",
    file: "src/lesson61.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chào mừng đến với **Bài Kiểm Tra Tổng Hợp Số 1 (Chặng 5)**!
Đề thi gồm **25 câu hỏi trắc nghiệm** lựa chọn ngẫu nhiên, bao quát toàn bộ nội dung từ Chặng 1 đến Chặng 4:
- Thẻ HTML5 ngữ nghĩa và chuẩn Accessibility.
- Mô hình hộp CSS Box Model, Grid, Flexbox và Responsive.
- JavaScript cơ bản, DOM Manipulation, lập trình bất đồng bộ.
- SQL cơ bản, kết nối MySQL và PHP lập trình máy chủ.
- Nguyên lý bảo mật CIA, mã hóa HTTPS, phòng chống lỗi OWASP Top 10 (XSS, CSRF, băm mật khẩu).

### ÁP DỤNG HỆ THỐNG
Bạn cần bình tĩnh đọc kỹ từng câu hỏi. Mỗi câu có 4 lựa chọn và chỉ có 1 câu trả lời đúng duy nhất.

### THỰC HÀNH NHỎ
Lựa chọn đáp án chính xác cho 25 câu hỏi trắc nghiệm bên dưới.

### KIỂM TRA HOÀN TẤT
Đạt tối thiểu **15 trên 25 câu đúng (> 60%)** để chính thức vượt qua Bài kiểm tra Số 1.`,
    tasks: ["Hoàn thành Bài kiểm tra Tổng hợp số 1 đạt kết quả tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 25,
    quizPool: [
      { q: "Tam giác bảo mật CIA gồm những trụ cột nào?", o: ["Cryptography, Integrity, Accessibility", "Confidentiality, Integrity, Availability", "Confidentiality, Internet, Authentication", "Control, Identity, Authorization"], a: 1 },
      { q: "HTTPS bảo mật dữ liệu nhờ sử dụng giao thức nào?", o: ["FTP", "SMTP", "TLS/SSL", "UDP"], a: 2 },
      { q: "Quy tắc đặt tên file 'user-profile.jsx' là kiểu nào?", o: ["camelCase", "PascalCase", "kebab-case", "snake_case"], a: 2 },
      { q: "Mục đích chính của thẻ Semantic HTML là gì?", o: ["Làm trang tải nhanh hơn", "Giúp SEO và khả năng tiếp cận (Accessibility)", "Để trình duyệt không bị lỗi hiển thị", "Làm code CSS ngắn hơn"], a: 1 },
      { q: "Thuộc tính CSS nào dùng để thiết lập mô hình hiển thị dạng lưới hai chiều?", o: ["display: flex", "display: grid", "display: block", "display: inline-block"], a: 1 },
      { q: "Trong CSS Box Model, thuộc tính nào tạo khoảng cách giữa Content và Border?", o: ["margin", "padding", "outline", "spacing"], a: 1 },
      { q: "Từ khóa khai báo biến nào trong JS có phạm vi block-scoped và cho phép gán lại giá trị?", o: ["var", "let", "const", "global"], a: 1 },
      { q: "Hàm nào dùng để chuyển chuỗi JSON thành JavaScript Object?", o: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.stringifyObject()"], a: 1 },
      { q: "Lệnh SQL nào dùng để thêm bản ghi mới vào bảng?", o: ["ADD RECORD", "INSERT INTO", "CREATE LINE", "UPDATE"], a: 1 },
      { q: "Đâu là phương thức kết nối cơ sở dữ liệu MySQL bảo mật và hướng đối tượng trong PHP?", o: ["mysql_connect", "PDO", "SQLite", "Postgres Connect"], a: 1 },
      { q: "Ký hiệu nào dùng để nối chuỗi trong PHP?", o: ["Dấu cộng (+)", "Dấu chấm (.)", "Dấu và (&)", "Dấu phẩy (,)"], a: 1 },
      { q: "Lỗi bảo mật XSS xảy ra do nguyên nhân nào?", o: ["Kẻ tấn công gửi quá nhiều request làm sập server", "Kẻ tấn công chèn mã JavaScript độc hại chạy trên trình duyệt người dùng", "Mật khẩu của người dùng quá yếu", "Server bị lỗi cấu hình cổng HTTP"], a: 1 },
      { q: "Cách bảo mật chống CSRF phổ biến nhất là gì?", o: ["Mã hóa database", "Sử dụng CSRF Token ngẫu nhiên cho mỗi request ghi dữ liệu", "Thiết lập tường lửa chặn IP lạ", "Dùng HTTPS"], a: 1 },
      { q: "Khi băm mật khẩu bằng bcrypt, tại sao cần kỹ thuật Salting?", o: ["Để tăng tốc độ băm mật khẩu", "Để tránh bị giải mã bằng bảng cầu vồng (Rainbow Table)", "Để mật khẩu ngắn hơn", "Để lưu trữ dễ dàng hơn"], a: 1 },
      { q: "Phương pháp đặt tên class CSS 'button--primary' tuân theo quy chuẩn nào?", o: ["BEM (Block-Element-Modifier)", "kebab-case", "snake_case", "camelCase"], a: 0 },
      { q: "Thẻ HTML5 nào dùng để chứa nội dung điều hướng chính của trang?", o: ["<main>", "<nav>", "<section>", "<aside>"], a: 1 },
      { q: "Trong JS, phép so sánh '===' khác gì so với '=='?", o: ["Không có sự khác biệt nào", "So sánh cả giá trị và kiểu dữ liệu (Strict Equality)", "Chỉ so sánh kiểu dữ liệu", "So sánh chậm hơn"], a: 1 },
      { q: "Từ khóa nào dùng để bắt lỗi trong khối bất đồng bộ async/await?", o: ["catch-error", "try...catch", "then...catch", "handleException"], a: 1 },
      { q: "Yêu cầu GET truyền tham số lên máy chủ qua đâu?", o: ["Qua Request Body", "Qua Header Cookie", "Qua Query parameters trên URL", "Qua File đính kèm"], a: 2 },
      { q: "Lệnh SQL nào dùng để cập nhật dữ liệu của một bản ghi có sẵn?", o: ["CHANGE", "MODIFY", "UPDATE", "INSERT"], a: 2 },
      { q: "Thư mục nào trong dự án Web thường dùng để chứa các file ảnh tĩnh, logo?", o: ["/src/components", "/src/assets", "/src/pages", "/src/utils"], a: 1 },
      { q: "Comments dạng JSDoc trong JS bắt đầu bằng ký tự nào?", o: ["//", "/*", "/**", "#"], a: 2 },
      { q: "Thẻ <meta name='viewport'> có vai trò gì?", o: ["Tối ưu hóa SEO từ khóa", "Hỗ trợ Responsive hiển thị tốt trên thiết bị di động", "Tải ảnh nhanh hơn", "Chống tấn công bảo mật"], a: 1 },
      { q: "Thuộc tính CSS nào thiết lập khoảng cách giữa các phần tử flex hoặc grid?", o: ["margin", "padding", "gap", "grid-gap"], a: 2 },
      { q: "Khối mã PHP bắt đầu bằng cú pháp nào?", o: ["<?", "<?php", "<script php>", "<php>"], a: 1 }
    ]
  },
  {
    id: "lesson62",
    title: "62. Bài Kiểm Tra Tổng Hợp Số 2 (Chặng 1-4)",
    lang: "html",
    file: "src/lesson62.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chào mừng đến với **Bài Kiểm Tra Tổng Hợp Số 2 (Chặng 5)**!
Đề thi gồm **25 câu hỏi trắc nghiệm** tiếp theo, giúp rà soát toàn bộ kỹ năng lập trình fullstack của bạn.
Mục tiêu là đánh giá khả năng phản xạ với các tình huống bảo mật, cấu trúc tệp tin và thiết kế logic ứng dụng thực tế.

### ÁP DỤNG HỆ THỐNG
Đọc kỹ đề bài, chọn đáp án đúng nhất cho từng câu hỏi. Hệ thống sẽ tự động chấm điểm ngay sau khi bạn hoàn thành câu 25.

### THỰC HÀNH NHỎ
Hoàn thành 25 câu hỏi trắc nghiệm trọn vẹn.

### KIỂM TRA HOÀN TẤT
Đạt tối thiểu **15 trên 25 câu đúng (> 60%)** để chính thức vượt qua Bài kiểm tra Số 2 và tốt nghiệp Chặng 5 để bước vào Chặng 6!`,
    tasks: ["Hoàn thành Bài kiểm tra Tổng hợp số 2 đạt kết quả tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 25,
    quizPool: [
      { q: "Để thiết lập Cookie chỉ truyền qua kênh mã hóa HTTPS, thuộc tính nào cần bật?", o: ["HttpOnly", "Secure", "SameSite", "Expires"], a: 1 },
      { q: "Khi đặt tên class CSS theo BEM, 'card__title--active' thì '--active' là thành phần nào?", o: ["Block", "Element", "Modifier", "Helper"], a: 2 },
      { q: "Kiểu ghi chú JSDoc nào mô tả kiểu dữ liệu trả về của một hàm?", o: ["@param", "@return", "@type", "@method"], a: 1 },
      { q: "Sự khác biệt của biến $_POST so với $_GET là gì?", o: ["$_POST truyền tham số qua URL", "$_POST truyền tham số ẩn trong Request Body", "$_POST không bảo mật bằng $_GET", "$_POST chỉ nhận file"], a: 1 },
      { q: "Hàm băm mật khẩu bcrypt có thể dịch ngược về mật khẩu ban đầu không?", o: ["Có, dùng khóa bí mật", "Không, đây là hàm băm một chiều", "Có, dùng bảng Rainbow Table", "Có, nếu có salt"], a: 1 },
      { q: "Trong SQL, câu lệnh nào dùng để xóa toàn bộ dữ liệu trong bảng nhanh nhất mà giữ nguyên cấu trúc bảng?", o: ["DELETE FROM table", "DROP TABLE table", "TRUNCATE TABLE table", "REMOVE table"], a: 2 },
      { q: "Trong JavaScript, từ khóa 'const' dùng để làm gì?", o: ["Khai báo biến có thể thay đổi giá trị thoải mái", "Khai báo hằng số không thể gán lại giá trị", "Khai báo biến toàn cục", "Khai báo class con"], a: 1 },
      { q: "Hàm nào dùng để đưa dữ liệu JSON dạng chuỗi về lại JavaScript Object?", o: ["JSON.stringify()", "JSON.parse()", "JSON.objectify()", "JSON.toJS()"], a: 1 },
      { q: "Khai báo nào giúp trình duyệt chạy trang web ở chế độ tiêu chuẩn (standards mode)?", o: ["<html>", "<!DOCTYPE html>", "<meta charset='UTF-8'>", "<head>"], a: 1 },
      { q: "Để căn giữa một phần tử con bên trong một container Flexbox theo cả 2 trục dọc và ngang, ta kết hợp thuộc tính nào?", o: ["justify-content: center & align-items: center", "text-align: center & vertical-align: middle", "margin: 0 auto", "display: grid-center"], a: 0 },
      { q: "Mạng máy tính hoạt động dựa trên mô hình địa chỉ IP nào phổ biến nhất hiện nay?", o: ["IPv4 và IPv6", "MAC address", "Subnet mask", "DNS"], a: 0 },
      { q: "Tại sao không nên đặt tên file chứa ký tự tiếng Việt có dấu trong lập trình?", o: ["Làm code chạy chậm hơn", "Gây lỗi đường dẫn (404/broken link) khi deploy lên hệ điều hành Linux/Unix", "Trình duyệt không hỗ trợ hiển thị", "Làm file nặng hơn"], a: 1 },
      { q: "Phương pháp bảo mật nào ngăn ngừa kẻ xấu tấn công đánh cắp phiên đăng nhập qua Session Hijacking?", o: ["Bật flag HttpOnly trên Cookie", "Dùng thẻ meta tag", "Nén file css", "Đặt tên class theo BEM"], a: 0 },
      { q: "Trong PHP, kết nối CSDL PDO có ưu điểm gì so với mysql_* cũ?", o: ["Chạy nhanh gấp 10 lần", "Hỗ trợ Prepared Statements ngăn chặn tấn công SQL Injection", "Không cần mật khẩu", "Tự động tạo bảng"], a: 1 },
      { q: "Để lấy chiều dài của một mảng trong JavaScript, ta dùng thuộc tính nào?", o: ["array.size", "array.count", "array.length", "array.index"], a: 2 },
      { q: "Câu lệnh SQL 'SELECT * FROM users WHERE age > 18' làm nhiệm vụ gì?", o: ["Lấy tất cả các cột từ bảng users với điều kiện tuổi lớn hơn 18", "Xóa người dùng dưới 18 tuổi", "Cập nhật tuổi cho người dùng", "Đếm số lượng người dùng trên 18 tuổi"], a: 0 },
      { q: "Giao thức truyền file bảo mật phổ biến nhất kết nối với VPS là gì?", o: ["FTP", "SFTP/SSH", "HTTP", "Telnet"], a: 1 },
      { q: "Từ khóa 'await' trong JavaScript chỉ được phép sử dụng ở đâu?", o: ["Trong mọi hàm thông thường", "Bên trong hàm có đánh dấu từ khóa 'async'", "Ở ngoài cùng của file HTML", "Trong khối script CSS"], a: 1 },
      { q: "Cấu trúc thư mục '/src/pages' trong dự án React dùng để làm gì?", o: ["Lưu trữ các hình ảnh tĩnh", "Chứa các component trang chính tương ứng với định tuyến URL", "Chứa các file cấu hình database", "Chứa các unit test"], a: 1 },
      { q: "Lỗi bảo mật CSRF xảy ra khi nào?", o: ["Khi server bị quá tải do DDOS", "Khi người dùng bị dụ dỗ nhấp vào link giả mạo kích hoạt hành động trái phép tại trang web họ đã đăng nhập", "Khi cơ sở dữ liệu bị xóa sạch", "Khi mật khẩu bị giải mã"], a: 1 },
      { q: "Thẻ HTML5 nào được khuyến nghị sử dụng cho thanh bên (sidebar) hoặc nội dung phụ?", o: ["<main>", "<section>", "<aside>", "<article>"], a: 2 },
      { q: "Thuộc tính CSS nào xác định độ dày của viền phần tử?", o: ["border-style", "border-width", "border-color", "border-radius"], a: 1 },
      { q: "Khi viết ghi chú code, thẻ TODO nhằm mục đích gì?", o: ["Báo hiệu lỗi nghiêm trọng cần dừng chương trình", "Đánh dấu công việc cần làm/nâng cấp trong tương lai", "Giải thích hoạt động của hàm băm", "Khai báo tên lập trình viên"], a: 1 },
      { q: "Dữ liệu được gửi qua phương thức POST của HTTP có hiển thị trực tiếp trên thanh địa chỉ URL của trình duyệt không?", o: ["Có", "Không", "Chỉ hiển thị một nửa", "Chỉ hiển thị trên trình duyệt Safari"], a: 1 },
      { q: "Chuỗi 'hugo-studio' viết theo quy tắc đặt tên nào?", o: ["kebab-case", "camelCase", "snake_case", "PascalCase"], a: 0 }
    ]
  }
];
