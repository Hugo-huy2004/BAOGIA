export const SECURITY_LESSONS = [
  {
    id: "lesson51",
    title: "51. Nguyên tắc bảo mật cơ bản (Tam giác CIA)",
    lang: "html",
    file: "src/lesson51.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Tam giác bảo mật **CIA** bao gồm ba trụ cột chính:
1. **Confidentiality (Tính bảo mật)**: Đảm bảo dữ liệu chỉ được truy cập bởi những người được cấp quyền.
2. **Integrity (Tính toàn vẹn)**: Đảm bảo dữ liệu không bị thay đổi trái phép hoặc mất mát trong quá trình lưu trữ/truyền tải.
3. **Availability (Tính khả dụng)**: Đảm bảo hệ thống và dữ liệu luôn sẵn sàng phục vụ khi người dùng hợp pháp yêu cầu.

### ÁP DỤNG HỆ THỐNG
Trong lập trình web, chúng ta áp dụng CIA bằng cách mã hóa dữ liệu nhạy cảm (Confidentiality), sử dụng mã checksum hoặc mã băm SHA-256 để kiểm tra tệp tin (Integrity), và triển khai tải cân bằng (Load Balancing) cùng chống DDOS (Availability).

### THỰC HÀNH NHỎ
Bạn hãy cấu trúc một tài liệu HTML mô tả 3 nguyên tắc này bằng các thẻ ngữ nghĩa \`<article>\` và \`<section>\`.

### KIỂM TRA HOÀN TẤT
Hệ thống sẽ kiểm tra xem file của bạn có chứa các từ khóa: "Confidentiality", "Integrity", "Availability" hay chưa.`,
    tasks: ["Xây dựng tài liệu HTML ghi nhớ tam giác CIA chứa đầy đủ 3 từ khóa nguyên tắc."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Tam giác bảo mật CIA</title>
</head>
<body>
    <main>
        <h1>Tam giác CIA trong bảo mật</h1>
        <!-- Viết nội dung học tập của bạn tại đây -->
    </main>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("confidentiality") && c.includes("integrity") && c.includes("availability");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Chữ 'I' trong tam giác bảo mật CIA là viết tắt của từ gì?", o: ["Identity", "Integrity", "Information", "Internet"], a: 1 }
    ]
  },
  {
    id: "lesson52",
    title: "52. Bảo mật mạng & Giao thức HTTPS",
    lang: "html",
    file: "src/lesson52.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**HTTPS (Hypertext Transfer Protocol Secure)** là phiên bản an toàn của HTTP. HTTPS mã hóa mọi luồng dữ liệu truyền tải giữa Trình duyệt (Client) và Máy chủ (Server) bằng cách sử dụng giao thức bảo mật **TLS/SSL**.
Mục đích:
- Ngăn chặn kẻ xấu nghe lén thông tin (Eavesdropping).
- Tránh bị thay đổi nội dung trên đường truyền (Man-in-the-Middle - MitM).

### ÁP DỤNG HỆ THỐNG
Tất cả các API giao dịch tài chính, thông tin đăng nhập đều bắt buộc phải chạy qua HTTPS. Nếu dùng HTTP thông thường, mật khẩu sẽ truyền dưới dạng clear-text (chữ rõ) và dễ dàng bị đánh cắp bởi các công cụ như Wireshark.

### THỰC HÀNH NHỎ
Tạo trang web giải thích sự khác biệt giữa HTTP và HTTPS.

### KIỂM TRA HOÀN TẤT
Mã nguồn phải bao gồm các từ khóa: "TLS", "SSL", "mã hóa", "HTTPS".`,
    tasks: ["Tạo file HTML định nghĩa cơ chế hoạt động mã hóa của HTTPS thông qua SSL/TLS."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tìm hiểu HTTPS</title>
</head>
<body>
    <!-- Giải thích cơ chế bảo mật HTTPS tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("tls") && c.includes("ssl") && c.includes("mã hóa") && c.includes("https");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "HTTPS sử dụng giao thức nào dưới nền để mã hóa dữ liệu truyền tải?", o: ["FTP", "TLS/SSL", "SMTP", "UDP"], a: 1 }
    ]
  },
  {
    id: "lesson53",
    title: "53. Quy tắc đặt tên file trong dự án",
    lang: "html",
    file: "src/lesson53.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Quy tắc đặt tên file (Naming Conventions) rất quan trọng để hệ thống chạy ổn định trên các hệ điều hành khác nhau (Windows không phân biệt chữ hoa chữ thường, nhưng Linux/Unix thì có).
Các quy tắc chuẩn quốc tế:
- **kebab-case** (Ví dụ: \`user-profile-card.jsx\`): Phổ biến nhất cho component React/HTML/CSS.
- **camelCase** (Ví dụ: \`userDataHelper.js\`): Dành cho các file tiện ích, helper.
- **PascalCase** (Ví dụ: \`UserProfileCard.jsx\`): Thường dùng cho Component Class hoặc các file khai báo Model.
- **Tránh khoảng trắng và ký tự đặc biệt**: Không bao giờ đặt tên file chứa dấu cách hoặc tiếng Việt có dấu.

### ÁP DỤNG HỆ THỐNG
Khi làm việc nhóm, việc thống nhất một quy tắc đặt tên giúp tránh xung đột git và lỗi không tìm thấy file (404 File Not Found) khi deploy lên VPS Linux.

### THỰC HÀNH NHỎ
Liệt kê và giải thích 3 kiểu đặt tên file phổ biến trong lập trình web.

### KIỂM TRA HOÀN TẤT
File cần chứa các từ khóa: "kebab-case", "camelCase", "PascalCase".`,
    tasks: ["Liệt kê các chuẩn đặt tên file phổ biến trong lập trình web."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quy tắc đặt tên file</title>
</head>
<body>
    <!-- Giải thích chi tiết các quy tắc tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("kebab-case") && c.includes("camelcase") && c.includes("pascalcase");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Tên file 'member-portal-page.jsx' đang tuân theo quy tắc đặt tên nào?", o: ["PascalCase", "snake_case", "kebab-case", "camelCase"], a: 2 }
    ]
  },
  {
    id: "lesson54",
    title: "54. Quy tắc tổ chức & sắp xếp thư mục",
    lang: "html",
    file: "src/lesson54.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Một cấu trúc thư mục sạch sẽ (Clean Directory Structure) giúp dự án dễ bảo trì khi mở rộng quy mô.
Cấu trúc tiêu chuẩn của một dự án Web Frontend:
- \`/src/components\`: Chứa các component giao diện dùng chung.
- \`/src/pages\`: Chứa các trang chính (định tuyến routing).
- \`/src/assets\`: Chứa hình ảnh, icon, font chữ tĩnh.
- \`/src/services\`: Chứa code gọi API hoặc giao tiếp database.
- \`/src/utils\`: Chứa các hàm logic xử lý chuỗi, ngày tháng dùng chung.

### ÁP DỤNG HỆ THỐNG
Không nên ném tất cả các tệp tin vào cùng một thư mục root. Việc phân tách thư mục theo chức năng giúp lập trình viên mới dễ dàng làm quen và tiếp cận mã nguồn.

### THỰC HÀNH NHỎ
Mô phỏng cấu trúc cây thư mục sạch sẽ bằng các thẻ HTML \`<ul>\` và \`<li>\`.

### KIỂM TRA HOÀN TẤT
Mã nguồn phải mô phỏng cấu trúc có các thư mục: "components", "pages", "assets", "services".`,
    tasks: ["Xây dựng danh sách cấu trúc thư mục tiêu chuẩn cho một dự án Web."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cấu trúc thư mục chuẩn</title>
</head>
<body>
    <h2>Cấu trúc thư mục dự án:</h2>
    <!-- Sử dụng ul/li mô tả cấu trúc -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("components") && c.includes("pages") && c.includes("assets") && c.includes("services");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Thư mục nào nên dùng để lưu trữ các hàm helper xử lý định dạng tiền tệ hay thời gian dùng chung?", o: ["/src/assets", "/src/utils", "/src/pages", "/src/components"], a: 1 }
    ]
  },
  {
    id: "lesson55",
    title: "55. Quy tắc viết ghi chú (Comments in Code)",
    lang: "html",
    file: "src/lesson55.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
"Code tốt là code tự giải thích được chính nó" - tuy nhiên ghi chú (Comments) vẫn rất cần thiết để giải thích *tại sao* chúng ta viết đoạn code này, thay vì giải thích *đoạn code này làm gì*.
Nguyên tắc viết comments:
- **Ghi chú JSDoc**: Dùng để mô tả tham số và giá trị trả về của hàm (\`/** ... */\`).
- **Tránh ghi chú thừa**: Đừng viết ghi chú cho những đoạn code quá hiển nhiên.
- **Cập nhật ghi chú**: Luôn sửa ghi chú nếu bạn thay đổi logic code tương ứng.
- **TODO comments**: Sử dụng để đánh dấu các chức năng cần hoàn thiện sau.

### ÁP DỤNG HỆ THỐNG
Sử dụng comments JSDoc giúp các trình soạn thảo code như VS Code tự động hiển thị gợi ý (IntelliSense) cực kỳ trực quan khi gọi hàm.

### THỰC HÀNH NHỎ
Viết một khối tài liệu JSDoc mẫu mô tả một hàm tính thuế giao dịch JOY.

### KIỂM TRA HOÀN TẤT
Nội dung file phải chứa đoạn comment JSDoc mẫu dạng \`/**\` cùng các từ khóa mô tả tham số như \`@param\` và \`@return\`.`,
    tasks: ["Viết khối ghi chú JSDoc chuẩn để giải thích tham số hàm tính toán giao dịch."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quy tắc viết ghi chú</title>
</head>
<body>
    <!-- Viết tài liệu ghi chú mẫu bên dưới -->
    <!-- Mẹo: Viết comments JSDoc chứa @param và @return -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("/**") && c.includes("@param") && c.includes("@return");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Ghi chú tốt trong lập trình nên tập trung giải thích điều gì?", o: ["Giải thích code chạy thế nào từng dòng một", "Giải thích TẠI SAO đoạn code được viết (ngữ cảnh logic)", "Không cần ghi chú gì cả", "Viết tên tác giả ở mọi dòng"], a: 1 }
    ]
  },
  {
    id: "lesson56",
    title: "56. Phòng chống tấn công XSS (Cross-Site Scripting)",
    lang: "html",
    file: "src/lesson56.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**XSS (Cross-Site Scripting)** xảy ra khi kẻ tấn công chèn mã JavaScript độc hại vào trang web, và mã này thực thi trên trình duyệt của người dùng khác.
Cách phòng chống:
- **Sanitization**: Làm sạch dữ liệu nhập vào bằng cách loại bỏ các thẻ \`<script>\`.
- **Escaping**: Chuyển đổi các ký tự đặc biệt sang mã thực thể HTML (Ví dụ: biến \`<\` thành \`&lt;\`, \`>\` thành \`&gt;\`).
- Sử dụng các thư viện bảo mật như \`DOMPurify\`.

### ÁP DỤNG HỆ THỐNG
Trong React, mặc định các chuỗi văn bản hiển thị trong thẻ JSX đều được Escaping tự động. Hãy cẩn thận tối đa khi dùng thuộc tính \`dangerouslySetInnerHTML\`.

### THỰC HÀNH NHỎ
Tạo tài liệu mô tả cơ chế phòng chống XSS bằng phương pháp Escaping ký tự.

### KIỂM TRA HOÀN TẤT
File cần chứa các từ khóa: "XSS", "escaping", "sanitize", "script".`,
    tasks: ["Xây dựng trang hướng dẫn bảo mật chống tấn công XSS."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Phòng chống XSS</title>
</head>
<body>
    <!-- Viết nội dung phòng chống XSS tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("xss") && c.includes("escaping") && c.includes("sanitize") && c.includes("script");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Làm thế nào để hiển thị an toàn nội dung do người dùng nhập mà không lo sợ tấn công XSS?", o: ["Cho chạy trực tiếp bằng innerHTML", "Mã hóa/Escaping các ký tự đặc biệt như <, > thành thực thể HTML", "Dùng hàm eval()", "Ẩn các thẻ script bằng CSS display: none"], a: 1 }
    ]
  },
  {
    id: "lesson57",
    title: "57. Phòng chống tấn công CSRF",
    lang: "html",
    file: "src/lesson57.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**CSRF (Cross-Site Request Forgery)** là kỹ thuật tấn công giả mạo yêu cầu từ chính người dùng đã đăng nhập để thực hiện các hành động phi pháp mà họ không hề hay biết (ví dụ chuyển tiền, đổi mật khẩu).
Cách phòng chống:
- **CSRF Token**: Máy chủ sinh ra một token ngẫu nhiên, duy nhất gắn vào form hoặc header. Mọi request POST/PUT lên đều phải gửi kèm token này để kiểm chứng.
- **SameSite Cookie**: Thiết lập cookie thành \`SameSite=Strict\` hoặc \`SameSite=Lax\` để ngăn chặn gửi cookie tự động từ các trang web thứ ba.

### ÁP DỤNG HỆ THỐNG
Hệ thống HugoCoder API sử dụng header Bearer JWT thay vì Cookie tự động gửi, giúp ngăn chặn triệt để nguy cơ tấn công CSRF.

### THỰC HÀNH NHỎ
Viết tài liệu mô tả vai trò của CSRF Token và SameSite Cookie.

### KIỂM TRA HOÀN TẤT
Yêu cầu mã nguồn chứa các cụm từ khóa: "CSRF token", "SameSite", "cookie".`,
    tasks: ["Viết định nghĩa và giải pháp chống giả mạo yêu cầu CSRF."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bảo mật CSRF</title>
</head>
<body>
    <!-- Giải thích giải pháp chống CSRF tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("csrf token") && c.includes("samesite") && c.includes("cookie");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Thuộc tính nào của Cookie giúp hạn chế gửi tự động từ trang web của bên thứ ba, chống CSRF hiệu quả?", o: ["Secure", "HttpOnly", "SameSite", "Domain"], a: 2 }
    ]
  },
  {
    id: "lesson58",
    title: "58. Quản lý mật khẩu & Cơ chế mã hóa băm (Hashing)",
    lang: "html",
    file: "src/lesson58.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Không bao giờ lưu mật khẩu của người dùng dưới dạng thô (plain-text) trong cơ sở dữ liệu. Nếu database bị rò rỉ, toàn bộ tài khoản sẽ bị lộ.
Giải pháp:
- **Hashing (Băm mật khẩu)**: Dùng các thuật toán băm một chiều như **bcrypt**, **Argon2** để mã hóa mật khẩu. Hàm băm một chiều không thể dịch ngược lại mật khẩu ban đầu.
- **Salting (Muối mật khẩu)**: Thêm một chuỗi ngẫu nhiên vào mật khẩu trước khi băm để tránh các cuộc tấn công tra cứu bảng cầu vồng (Rainbow Table).

### ÁP DỤNG HỆ THỐNG
Backend Hugo Studio mã hóa mật khẩu admin bằng bcrypt với salt rounds là 10, đảm bảo tính bảo mật tối đa trước các cuộc tấn công dò mật khẩu (brute-force).

### THỰC HÀNH NHỎ
Tạo trang giới thiệu sự khác nhau giữa Encrypt (Mã hóa hai chiều) và Hashing (Băm một chiều).

### KIỂM TRA HOÀN TẤT
Yêu cầu mã nguồn chứa các từ khóa: "bcrypt", "hashing", "salting", "mật khẩu".`,
    tasks: ["Viết giải thích về kỹ thuật băm mật khẩu một chiều cùng cơ chế Salting."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mã hóa mật khẩu</title>
</head>
<body>
    <!-- Giải thích Hashing và Salting tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("bcrypt") && c.includes("hashing") && c.includes("salting") && c.includes("mật khẩu");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Mục đích chính của kỹ thuật Salting (thêm muối) trong việc băm mật khẩu là gì?", o: ["Làm mật khẩu ngắn hơn", "Ngăn chặn tấn công tra cứu bảng băm có sẵn (Rainbow Table)", "Tăng tốc độ băm", "Cho phép giải mã ngược mật khẩu dễ dàng"], a: 1 }
    ]
  },
  {
    id: "lesson59",
    title: "59. Quy tắc viết code HTML/CSS chuẩn sạch",
    lang: "html",
    file: "src/lesson59.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Viết mã HTML/CSS sạch sẽ giúp đồng nghiệp dễ đọc, cải thiện tốc độ render của trình duyệt.
Các quy tắc cốt lõi:
- **Phương pháp BEM** (Block-Element-Modifier): Quy tắc đặt tên class CSS (Ví dụ: \`card\`, \`card__title\`, \`card__button--disabled\`).
- **Tránh inline styles**: Luôn viết CSS ra file riêng hoặc thẻ \`<style>\`, không lạm dụng thuộc tính \`style="..."\`.
- **Thụt lề đồng nhất**: Sử dụng thụt lề 2 hoặc 4 khoảng trắng cho mọi thẻ lồng nhau.

### ÁP DỤNG HỆ THỐNG
Sử dụng phương pháp BEM giúp CSS không bị chồng chéo (specificity conflict) và tái sử dụng component dễ dàng hơn trong các dự án lớn.

### THỰC HÀNH NHỎ
Thiết kế một cấu trúc HTML của component thẻ tin tức (News Card) áp dụng phương pháp BEM.

### KIỂM TRA HOÀN TẤT
Class CSS phải chứa dấu gạch dưới kép (\`__\`) biểu thị phần tử (Element) theo quy chuẩn đặt tên BEM.`,
    tasks: ["Xây dựng HTML News Card áp dụng đúng chuẩn đặt tên class BEM."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>HTML/CSS sạch chuẩn BEM</title>
</head>
<body>
    <!-- Xây dựng card tin tức với class CSS chuẩn BEM (ví dụ: news-card__title) -->
</body>
</html>`,
    verify: (code) => {
      return code.includes("__");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Theo phương pháp BEM, ký tự nào dùng để phân tách giữa Block và Element?", o: ["Hai dấu gạch ngang (--)", "Một dấu gạch ngang (-)", "Hai dấu gạch dưới (__)", "Dấu gạch chéo (/)"], a: 2 }
    ]
  },
  {
    id: "lesson60",
    title: "60. Tổng kết Bảo mật & Quy tắc Dự án",
    lang: "html",
    file: "src/lesson60.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chúc mừng bạn đã hoàn thành Chặng 4! Bạn đã trang bị các nền tảng vững chắc về bảo mật CIA, HTTPS, quy tắc tổ chức tệp tin sạch, cách bình luận JSDoc chuyên nghiệp và phòng chống các lỗi bảo mật hàng đầu OWASP như XSS, CSRF.

### ÁP DỤNG HỆ THỐNG
Hãy luôn áp dụng các nguyên tắc này từ những ngày đầu lập dự án, tránh việc viết code cẩu thả rồi sau đó mới đi sửa lỗi cấu trúc và bảo mật.

### THỰC HÀNH NHỎ
Hãy tạo một file tổng kết ghi nhớ tất cả 5 từ khóa cốt lõi đã học trong chặng này.

### KIỂM TRA HOÀN TẤT
Yêu cầu chứa các từ khóa: "CIA", "HTTPS", "BEM", "XSS", "CSRF".`,
    tasks: ["Tạo file HTML tổng hợp ghi nhớ các thuật ngữ bảo mật then chốt."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tổng kết Chặng 4</title>
</head>
<body>
    <!-- Viết 5 từ khóa bảo mật cốt lõi tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toUpperCase();
      return c.includes("CIA") && c.includes("HTTPS") && c.includes("BEM") && c.includes("XSS") && c.includes("CSRF");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Giao thức bảo mật nào đóng vai trò cốt lõi trong tam giác CIA về tính bảo mật đường truyền mạng?", o: ["HTTP", "HTTPS (TLS/SSL)", "FTP", "Telnet"], a: 1 }
    ]
  }
];
