// Dữ liệu cho HugoCoder - Hệ thống Học Lập trình Web

export const TEMPLATES = {
  html: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Trang Web Của Tôi</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Xin chào thế giới!</h1>
    <p>Bắt đầu viết code HTML tại đây.</p>
    <script src="script.js"></script>
</body>
</html>`,
  css: `/* File CSS mặc định */
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    color: #333;
    padding: 20px;
}
h1 {
    color: #0056b3;
}`,
  javascript: `// File Javascript mặc định
console.log("Javascript đã được tải thành công!");
`,
  php: `<?php
// File PHP mặc định
$title = "Học lập trình Backend với PHP";
echo "<h1>" . $title . "</h1>";
echo "<p>PHP đang chạy tốt!</p>";
?>`,
  json: `{
  "name": "my-web-project",
  "version": "1.0.0",
  "description": "Dự án web cơ bản"
}`,
  sql: `-- File SQL mặc định
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email) VALUES ('admin', 'admin@example.com');
`
};

export const INITIAL_WORKSPACE = [
  {
    path: "README.md",
    name: "README.md",
    language: "markdown",
    content: `#  HUGO CODER - HỌC LẬP TRÌNH WEB THỰC CHIẾN
Chào mừng bạn đến với Môi trường lập trình Web của Hugo!

Tại đây, bạn sẽ được học qua các lộ trình từ Cơ bản đến Trung cấp:
1. **HTML & CSS**: Xây dựng bộ khung và làm đẹp giao diện web.
2. **JavaScript**: Thêm các tương tác động, logic nghiệp vụ và gọi API.
3. **PHP & SQL**: Kết nối cơ sở dữ liệu và xử lý logic backend.

Bạn có thể chỉnh sửa trực tiếp, chuyển sang tab "Khóa học" (biểu tượng cuốn sách) để bắt đầu lộ trình từng bước!`
  },
  {
    path: "src/index.html",
    name: "index.html",
    language: "html",
    content: TEMPLATES.html
  },
  {
    path: "src/style.css",
    name: "style.css",
    language: "css",
    content: TEMPLATES.css
  },
  {
    path: "src/script.js",
    name: "script.js",
    language: "javascript",
    content: TEMPLATES.javascript
  }
];

export const TUTORIALS = [
  {
    lang: "HTML / CSS",
    icon: "html",
    intro: "HTML xây dựng cấu trúc của trang, CSS chịu trách nhiệm làm đẹp và bố cục.",
    sections: [
      {
        title: "Cấu trúc cơ bản của HTML",
        content: `- Thẻ <!DOCTYPE html> khai báo chuẩn HTML5.\n- <html> là thẻ gốc, chứa <head> (thông tin ẩn) và <body> (nội dung hiển thị).\n- Các thẻ phổ biến: <h1> tới <h6> (tiêu đề), <p> (đoạn văn), <a> (liên kết), <img> (hình ảnh).`
      },
      {
        title: "Làm đẹp bằng CSS",
        content: `- Selector (Bộ chọn): Dùng để nhắm mục tiêu phần tử (ví dụ: h1, .class, #id).\n- Thuộc tính màu sắc: color (màu chữ), background-color (màu nền).\n- Box Model: margin (lề ngoài), padding (lề trong), border (viền).`
      }
    ]
  },
  {
    lang: "JavaScript",
    icon: "javascript",
    intro: "Ngôn ngữ kịch bản giúp trang web trở nên sống động, tương tác và xử lý logic phía client.",
    sections: [
      {
        title: "Biến và Kiểu dữ liệu",
        content: `- Sử dụng let và const để khai báo biến thay vì var.\n- Các kiểu dữ liệu cơ bản: String (chuỗi), Number (số), Boolean (đúng/sai), Array (mảng), Object (đối tượng).`
      },
      {
        title: "DOM Manipulation",
        content: `- document.getElementById('id') để tìm phần tử.\n- element.innerHTML để thay đổi nội dung.\n- element.addEventListener('click', function) để lắng nghe sự kiện nhấn chuột.`
      }
    ]
  },
  {
    lang: "PHP & SQL",
    icon: "php",
    intro: "PHP là ngôn ngữ lập trình chạy trên Server, thường kết hợp với CSDL SQL để tạo ứng dụng web động.",
    sections: [
      {
        title: "Cơ bản về PHP",
        content: `- Biến trong PHP luôn bắt đầu bằng dấu $. Ví dụ: $name = "Hugo";\n- Kết thúc lệnh phải có dấu chấm phẩy (;).\n- Dùng echo để in dữ liệu ra HTML.`
      },
      {
        title: "SQL Cơ bản",
        content: `- Lấy dữ liệu: SELECT * FROM table_name;\n- Thêm dữ liệu: INSERT INTO table (col) VALUES (val);\n- Cập nhật: UPDATE table SET col = val WHERE condition;`
      }
    ]
  }
];

export const MOBILE_GUIDE_EXTRAS = {
  lesson1: {
    visualType: "htmlTree",
    mentalModel: "HTML giống bản đồ phân cấp của một màn hình: phần tử lớn ôm phần tử nhỏ, nội dung quan trọng được đặt trong đúng ngữ nghĩa để trình duyệt, công cụ tìm kiếm và trình đọc màn hình đều hiểu.",
    keyIdeas: [
      "Một màn hình tốt bắt đầu bằng cấu trúc rõ, chưa cần đẹp ngay.",
      "Thẻ bao ngoài tạo vùng trách nhiệm: card, header, list, form.",
      "Tên class nên mô tả vai trò giao diện, không mô tả màu sắc nhất thời."
    ],
    deepDive: [
      {
        title: "DOM tree",
        body: "Khi trình duyệt đọc HTML, nó biến các thẻ thành cây DOM. Javascript và CSS đều làm việc với cây này, nên HTML lộn xộn sẽ làm mọi phần sau khó hơn."
      },
      {
        title: "Semantic trước div",
        body: "Dùng section, article, nav, button, img có alt khi phù hợp. Div vẫn hữu ích, nhưng không nên là câu trả lời duy nhất."
      }
    ],
    commonMistakes: [
      "Đóng thẻ sai thứ tự khiến layout vỡ khó đoán.",
      "Dùng quá nhiều div nhưng không có heading, alt hoặc button thật.",
      "Đặt class như red-box rồi sau này đổi màu xanh sẽ mất nghĩa."
    ],
    quiz: [
      "Vì sao thẻ button tốt hơn div onClick cho hành động bấm?",
      "Nếu card có ảnh, tên, mô tả, nút, phần tử nào nên là heading?"
    ],
    demoCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; font-family: system-ui; }
    article { width: 240px; padding: 18px; border: 1px solid #dbeafe; border-radius: 12px; background: white; box-shadow: 0 18px 45px rgba(15,23,42,.12); }
    img { width: 100%; height: 130px; object-fit: cover; border-radius: 8px; background: linear-gradient(135deg,#93c5fd,#34d399); }
    button { width: 100%; border: 0; border-radius: 8px; padding: 11px; background: #4f46e5; color: white; font-weight: 800; }
  </style>
</head>
<body>
  <article class="product-card">
    <img alt="Giày thể thao cao cấp">
    <h2>Giày Thể Thao Cao Cấp</h2>
    <p>Thoáng khí, êm ái, phong cách.</p>
    <button>Mua Ngay</button>
  </article>
</body>
</html>`
  },
  lesson2: {
    visualType: "boxModel",
    mentalModel: "CSS là hệ thống luật thị giác. Bạn không tô điểm từng chỗ rời rạc, bạn tạo quy tắc để khoảng cách, căn chỉnh và trạng thái lặp lại nhất quán.",
    keyIdeas: [
      "Box Model quyết định kích thước thật: content + padding + border + margin.",
      "Flex/Grid giải quyết bố cục; position chỉ nên dùng khi thật cần lớp nổi.",
      "Responsive tốt là đổi cấu trúc theo không gian, không chỉ thu nhỏ chữ."
    ],
    deepDive: [
      {
        title: "Cascade",
        body: "CSS chọn luật thắng theo độ ưu tiên, vị trí khai báo và trạng thái. Khi style không ăn, hãy kiểm tra selector và rule nào đang ghi đè."
      },
      {
        title: "Spacing system",
        body: "Dùng một thang khoảng cách cố định giúp giao diện yên mắt hơn: 4, 8, 12, 16, 24, 32px thay vì mỗi chỗ một số ngẫu nhiên."
      }
    ],
    commonMistakes: [
      "Dùng margin để sửa mọi vấn đề thay vì xem lại bố cục cha.",
      "Set width cố định làm vỡ màn hình nhỏ.",
      "Quên trạng thái hover, focus, disabled."
    ],
    quiz: [
      "Padding khác margin ở điểm nào?",
      "Khi nào nên dùng grid thay vì flex?"
    ],
    demoCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef2ff; font-family: system-ui; }
    .product-card { width: 230px; border: 1px solid #111827; padding: 20px; text-align: center; border-radius: 12px; background: white; animation: lift 1.8s ease-in-out infinite alternate; }
    .product-card img { width: 120px; height: 90px; border-radius: 10px; background: linear-gradient(135deg,#facc15,#fb7185); }
    button { border: 0; border-radius: 8px; padding: 10px 16px; background: #111827; color: white; }
    @keyframes lift { from { transform: translateY(0); box-shadow: 0 8px 22px rgba(0,0,0,.08); } to { transform: translateY(-8px); box-shadow: 0 18px 36px rgba(0,0,0,.16); } }
  </style>
</head>
<body>
  <div class="product-card">
    <img alt="Sản phẩm">
    <h2>Giày Thể Thao Cao Cấp</h2>
    <p>Padding tạo hơi thở, border tạo khung.</p>
    <button>Mua Ngay</button>
  </div>
</body>
</html>`
  },
  lesson3: {
    visualType: "eventFlow",
    mentalModel: "Javascript biến trang tĩnh thành hệ thống phản hồi. Người dùng tạo event, code xử lý event, giao diện đổi trạng thái.",
    keyIdeas: [
      "Event listener là cầu nối giữa hành động người dùng và logic.",
      "DOM query nên rõ ràng, tránh tìm nhầm phần tử.",
      "State là dữ liệu hiện tại của màn hình; UI nên phản ánh state."
    ],
    deepDive: [
      {
        title: "Event bubbling",
        body: "Một click có thể đi từ phần tử con lên phần tử cha. Hiểu bubbling giúp bạn xử lý menu, modal, list item mà không viết quá nhiều listener."
      },
      {
        title: "Tách tìm phần tử và xử lý",
        body: "Đầu tiên lấy element, sau đó gắn sự kiện, cuối cùng viết hàm xử lý. Ba bước rõ ràng giúp debug nhanh."
      }
    ],
    commonMistakes: [
      "Chạy script trước khi HTML tồn tại.",
      "Nhầm id hoặc class nên query trả về null.",
      "Viết quá nhiều logic trực tiếp trong listener."
    ],
    quiz: [
      "Điều gì xảy ra nếu getElementById trả về null?",
      "Vì sao nên đặt script cuối body hoặc dùng defer?"
    ],
    demoCode: `<!DOCTYPE html>
<html lang="vi">
<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;background:#f0fdf4">
  <section style="background:white;border:1px solid #bbf7d0;border-radius:12px;padding:18px;width:250px;text-align:center">
    <h2>Giỏ hàng</h2>
    <p id="status">Chưa có sản phẩm.</p>
    <button id="btn-mua" style="border:0;border-radius:8px;padding:11px 16px;background:#16a34a;color:white;font-weight:800">Mua Ngay</button>
  </section>
  <script>
    const nutBam = document.getElementById("btn-mua");
    const status = document.getElementById("status");
    nutBam.addEventListener("click", function() {
      status.textContent = "Thêm vào giỏ hàng thành công!";
    });
  </script>
</body>
</html>`
  },
  lesson5: {
    visualType: "sqlPipeline",
    mentalModel: "SQL là cách đặt câu hỏi chính xác với dữ liệu. Câu query tốt lọc trước, sắp xếp sau, giới hạn cuối cùng để trả đúng thứ cần dùng.",
    keyIdeas: [
      "WHERE giảm số dòng trước khi kết quả được dùng.",
      "ORDER BY tạo thứ tự có ý nghĩa.",
      "LIMIT bảo vệ giao diện khỏi tải quá nhiều dữ liệu."
    ],
    deepDive: [
      {
        title: "Tư duy pipeline",
        body: "Hãy đọc query như một đường ống: lấy bảng, lọc điều kiện, sắp xếp, giới hạn. Khi sai kết quả, kiểm tra từng đoạn."
      },
      {
        title: "Index",
        body: "Ở dự án thật, cột hay lọc như price, status, email thường cần index để truy vấn nhanh hơn."
      }
    ],
    commonMistakes: [
      "Quên WHERE khi update hoặc delete.",
      "Sắp xếp theo text số tiền thay vì kiểu number.",
      "Dùng SELECT * cho màn hình chỉ cần vài cột."
    ],
    quiz: [
      "Vì sao LIMIT quan trọng với danh sách sản phẩm?",
      "WHERE và HAVING khác nhau ở mức tư duy nào?"
    ]
  }
};

export const THEORY_LIBRARY = [
  {
    title: "Tư duy Client - Server",
    level: "Nền tảng",
    summary: "Trình duyệt chịu trách nhiệm hiển thị và tương tác; server chịu trách nhiệm dữ liệu, xác thực và nghiệp vụ quan trọng.",
    bullets: ["Client gửi request", "Server xử lý và trả response", "Frontend cập nhật UI từ dữ liệu nhận được"]
  },
  {
    title: "Responsive Design",
    level: "Giao diện",
    summary: "Một giao diện tốt không chỉ co lại, mà biết ưu tiên nội dung khác nhau theo màn hình.",
    bullets: ["Mobile đọc và thao tác nhanh", "Tablet cần bố cục thoáng", "Desktop tối ưu năng suất"]
  },
  {
    title: "Accessibility",
    level: "Chất lượng",
    summary: "Code dễ tiếp cận giúp nhiều người dùng hơn và thường làm cấu trúc HTML sạch hơn.",
    bullets: ["Button thật cho hành động", "Alt text cho ảnh có ý nghĩa", "Focus rõ khi dùng bàn phím"]
  },
  {
    title: "State Management",
    level: "Javascript",
    summary: "State là sự thật hiện tại của giao diện. Khi state đổi, UI cần đổi theo một cách dự đoán được.",
    bullets: ["Loading", "Empty", "Error", "Success"]
  },
  {
    title: "Security Cơ Bản",
    level: "Web",
    summary: "Frontend không nên giữ bí mật quan trọng. Server phải kiểm tra quyền, dữ liệu đầu vào và phiên đăng nhập.",
    bullets: ["Không tin input người dùng", "Không lộ secret key", "Kiểm tra quyền ở backend"]
  },
  {
    title: "Performance",
    level: "Trải nghiệm",
    summary: "Nhanh không chỉ là tải nhanh, mà còn phản hồi nhanh sau mỗi thao tác.",
    bullets: ["Giảm bundle lớn", "Lazy load phần nặng", "Tối ưu ảnh và cache"]
  }
];

export const WEB_COURSES = [
  {
    id: "lesson1",
    title: "1. Giới thiệu HTML & Code cơ bản",
    lang: "html",
    file: "src/lesson1.html",
    theory: `### Khái quát về HTML
HTML (HyperText Markup Language) là ngôn ngữ đánh dấu siêu văn bản, tạo cấu trúc khung xương cho trang web.

### Thẻ HTML cơ bản:
HTML hoạt động bằng các thẻ (tags) đi theo cặp:
- \`<html>\`: Bao bọc toàn bộ trang.
- \`<head>\`: Chứa metadata ẩn và tiêu đề trang.
- \`<body>\`: Chứa nội dung hiển thị.
- \`<h1>\`: Tiêu đề lớn nhất.
- \`<p>\`: Đoạn văn bản.
- \`<a href="...">\`: Liên kết chuyển hướng.`,
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
</body>
</html>`,
    verify: (code) => code.includes("<html>") && code.includes("<body>"),
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
    theory: `### CSS là gì?
CSS (Cascading Style Sheets) giúp định dạng màu sắc, bố cục, khoảng cách cho HTML.

### Quy tắc cơ bản:
- \`color\`: Đổi màu chữ.
- \`background-color\`: Đổi màu nền.
- \`padding\`: Khoảng cách bên trong.
- \`margin\`: Khoảng cách bên ngoài.`,
    tasks: [
      "Thực hành: Đổi màu nền giao diện thành màu Xanh Dương và màu chữ thành màu Trắng theo yêu cầu của hệ thống."
    ],
    starterCode: `<div class="card" style="padding:20px; border-radius:10px;">
    <h2>Giao diện đổi màu</h2>
    <p>Hãy chọn đúng màu nền và màu chữ.</p>
</div>`,
    verify: (code) => code.includes("color"),
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
    theory: `### JavaScript cơ bản
JavaScript giúp trang web có logic xử lý và khả năng phản hồi tương tác từ người dùng.

### DOM & Sự kiện:
- \`document.getElementById('id')\`: Tìm phần tử.
- \`addEventListener('click', ...)\`: Lắng nghe sự kiện click.`,
    tasks: [
      "Thực hành: Nhấp chuột vào nút bấm 3 lần liên tiếp để tăng bộ đếm lên đúng số 3."
    ],
    starterCode: `<button id="btn">Click me</button>`,
    verify: (code) => true,
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
    theory: `### Ôn tập và Đánh giá 1
Bài kiểm tra này tổng hợp toàn bộ kiến thức của 3 bài học trước (HTML, CSS, JS).
Bạn cần trả lời đúng tối thiểu **3/5 câu** (60%) để vượt qua. Đề thi sẽ tự động đổi câu hỏi khác mỗi khi bạn làm lại!`,
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
    theory: `### MySQL & SQL
MySQL là hệ quản trị cơ sở dữ liệu. SQL là ngôn ngữ truy vấn dùng để giao tiếp với CSDL.

### Lệnh cơ bản:
- \`SELECT * FROM users\`: Lấy dữ liệu.
- \`WHERE status = 'active'\`: Lọc dữ liệu.
- \`LIMIT 5\`: Giới hạn số dòng kết quả.`,
    tasks: [
      "Kéo thả các mệnh đề SQL để ghép thành câu lệnh hoàn chỉnh: Lấy tất cả từ bảng users, lọc status là 'active' và giới hạn 5 dòng."
    ],
    starterCode: `-- SQL Practice`,
    verify: (code) => code.toUpperCase().includes("SELECT"),
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
    theory: `### PHP Backend
PHP là ngôn ngữ kịch bản chạy trên máy chủ (Server-side) dùng để xây dựng logic backend.

### Cú pháp PHP:
- Biến bắt đầu bằng dấu \`$\`. Ví dụ: \`$name = "Hugo";\`
- Xuất dữ liệu: \`echo $name;\`
- Kết nối CSDL: Thường dùng \`new PDO(...)\`.`,
    tasks: [
      "Nối các cặp khái niệm PHP với chức năng tương ứng của nó."
    ],
    starterCode: `<?php echo "Hello PHP"; ?>`,
    verify: (code) => code.includes("<?php"),
    practiceType: "php_match",
    matchPairs: [
      { key: "$ (Đô-la)", val: "Khai báo biến" },
      { key: "echo", val: "Xuất dữ liệu ra HTML" },
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
    title: "7. Tích hợp PHP và HTML",
    lang: "php",
    file: "src/lesson7.php",
    theory: `### Kết hợp PHP và HTML
PHP có thể viết đan xen trực tiếp trong các thẻ HTML để hiển thị dữ liệu động từ server.

### Ví dụ:
\`\`\`php
<h1><?php echo "Chào " . $username; ?></h1>
\`\`\``,
    tasks: [
      "Điền đoạn code PHP còn thiếu vào chỗ trống để in ra lời chào: 'Xin chào [biến name]'."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "fill_blank",
    blankText: `<h1><?php [blank1] "Xin chào " [blank2] $name; ?></h1>`,
    correctBlanks: {
      blank1: "echo",
      blank2: "."
    },
    miniQuiz: [
      { q: "Làm thế nào để nhúng mã PHP vào file HTML?", o: ["<php> ... </php>", "<?php ... ?>", "<script type='php'> ... </script>", "<% ... %>"], a: 1 },
      { q: "Ký tự nào dùng để nối chuỗi trong PHP?", o: ["+", "&", ".", ","], a: 2 },
      { q: "Kết thúc mỗi câu lệnh PHP phải có ký tự gì?", o: ["Dấu phẩy", "Dấu chấm", "Dấu hai chấm", "Dấu chấm phẩy"], a: 3 }
    ]
  },
  {
    id: "lesson8",
    title: "8. Advanced: Responsive Layout & Flexbox Challenge",
    lang: "html",
    file: "src/lesson8.html",
    theory: `### Responsive Web Design & Flexbox
Xây dựng trang web thích ứng với mọi kích thước màn hình (mobile, tablet, desktop).

### Yêu cầu nâng cao:
1. **Flexbox Layout**: Sử dụng flexbox để tạo nav, hero, section layout
2. **Media Queries**: CSS @media cho mobile (<768px), tablet, desktop
3. **Semantic HTML5**: Dùng <header>, <nav>, <section>, <article>, <footer>
4. **Accessibility**: Contrast ratio 4.5:1, ARIA labels, semantic headings
5. **Performance**: Optimize images, minimize CSS/JS

### Công cụ kiểm tra:
- Inspect Element để kiểm tra responsive
- Chrome DevTools Lighthouse score tối thiểu 80`,
    tasks: [
      "Xây dựng trang Portfolio responsive với: header, navigation menu (flex), hero section (image + text), 3-column project grid, responsive footer",
      "Đảm bảo layout tự động stack trên mobile, 2 column trên tablet, 3 column trên desktop",
      "Kiểm tra Lighthouse score tối thiểu 80, không có console error"
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio - Responsive</title>
</head>
<body>
  <header>
    <nav></nav>
  </header>
  <main>
    <section id="projects"></section>
  </main>
  <footer></footer>
</body>
</html>`,
    verify: (code) => code.includes("@media") || code.includes("flex"),
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Mobile-first design có nghĩa là gì?", o: ["Thiết kế mobile trước, sau đó mở rộng lên desktop", "Chỉ thiết kế cho mobile", "Tối ưu cho tốc độ mobile", "Dùng Mobile Safari"], a: 0 },
      { q: "Viewport meta tag có tác dụng gì?", o: ["Tăng tốc độ load", "Giúp trình duyệt render responsive", "Tùy chỉnh màu nền", "Gắn favicon"], a: 1 },
      { q: "Breakpoint 768px thường dùng để làm gì?", o: ["Desktop breakpoint", "Mobile-to-tablet transition", "Print breakpoint", "Không có cố định"], a: 1 }
    ]
  },
  {
    id: "lesson9",
    title: "9. Capstone: Full-Stack E-Commerce Product Page",
    lang: "php",
    file: "src/lesson9.php",
    theory: `### Full-Stack Development Challenge
Xây dựng trang chi tiết sản phẩm hoàn chỉnh với PHP backend + MySQL + responsive frontend.

### Yêu cầu Full-Stack:
**Backend (PHP/MySQL):**
1. API endpoint GET /api/products/{id} trả về JSON product details
2. Validate ID, SQL injection protection (prepared statements)
3. Caching (Redis hoặc file-based) nếu product không thay đổi
4. Error handling: 404 nếu product không tồn tại

**Frontend (HTML/CSS/JS):**
1. Fetch dữ liệu từ API, render product details
2. Image gallery (thumbnail → click để xem lớn)
3. Quantity selector, "Add to Cart" button
4. Related products carousel (minimum 3 sản phẩm liên quan)
5. Review/rating section (read-only hoặc write if logged in)

**Database:**
- users table (id, email, password hash, created_at)
- products table (id, name, price, description, category, image, stock)
- reviews table (id, product_id, user_id, rating, comment, created_at)
- orders table (id, user_id, product_id, quantity, total_price, status)`,
    tasks: [
      "Thiết kế database schema với 4 bảng: users, products, reviews, orders",
      "Viết API endpoint GET /api/products/{id} with validation & error handling",
      "Frontend: Fetch API, render product page, image gallery, quantity selector, reviews",
      "Responsive design: Mobile stack layout, Desktop 2-column (image + details)"
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

// TODO: Fetch from DB with validation
?>`,
    verify: (code) => code.includes("PDO") || code.includes("json_encode"),
    practiceType: "capstone",
    miniQuiz: [
      { q: "SQL Injection là gì?", o: ["Database performance issue", "Tấn công nhúng code SQL vào input", "Cải thiện query performance", "Không liên quan database"], a: 1 },
      { q: "Prepared Statement giúp gì?", o: ["Tăng tốc độ", "Ngăn SQL Injection", "Giảm dung lượng", "Không có tác dụng"], a: 1 },
      { q: "HTTP status code 404 có nghĩa?", o: ["Server error", "Not Found", "Success", "Redirect"], a: 1 }
    ]
  },
  {
    id: "lesson10",
    title: "10. Advanced Security & Optimization Challenge",
    lang: "php",
    file: "src/lesson10.php",
    theory: `### Web Security & Performance Optimization
Hành trình của một Web Developer không hoàn chỉnh nếu không hiểu về bảo mật và tối ưu hóa.

### Security Threats (OWASP Top 10):
1. **SQL Injection**: Nhúng SQL code qua input → Dùng prepared statements
2. **XSS (Cross-Site Scripting)**: Nhúng JS code qua input → Sanitize output
3. **CSRF (Cross-Site Request Forgery)**: Tấn công từ trang khác → Dùng CSRF tokens
4. **Authentication**: Mật khẩu yếu, lưu plaintext → Hash (bcrypt/password_hash)
5. **Authorization**: Không kiểm tra quyền hạn → Validate permission trên mỗi request

### Optimization:
1. Database: Index, query optimization, connection pooling
2. Frontend: Lazy loading images, minify CSS/JS, gzip compression
3. Caching: Page cache, query cache, browser cache
4. CDN: Phân phối nội dung toàn cầu`,
    tasks: [
      "Viết 3 hàm PHP để demo lỗi bảo mật + cách fix: XSS, SQL Injection, CSRF token validation",
      "Implement bcrypt password hashing cho user registration",
      "Tối ưu database query: thêm INDEX, sử dụng EXPLAIN, validate performance"
    ],
    starterCode: `<?php
// Lỗi XSS - Không escape output
// echo $_GET['name'];  // ❌ DANGER
// Cách fix:
// echo htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');  // ✓ SAFE

// Lỗi SQL Injection - Nối string trực tiếp
// $query = "SELECT * FROM users WHERE id = " . $_GET['id'];  // ❌ DANGER
// Cách fix:
// $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
// $stmt->execute([$_GET['id']]);  // ✓ SAFE
?>`,
    verify: (code) => code.includes("htmlspecialchars") || code.includes("prepare"),
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Hàm nào bảo vệ trước XSS attack trong PHP?", o: ["mysql_escape_string", "htmlspecialchars", "md5", "base64_encode"], a: 1 },
      { q: "Cách nào lưu mật khẩu an toàn nhất?", o: ["Plaintext", "MD5 hash", "SHA256 hash", "bcrypt/password_hash"], a: 3 },
      { q: "Index database giúp gì?", o: ["Tiết kiệm dung lượng", "Tăng tốc độ query", "Bảo vệ dữ liệu", "Giảm số connection"], a: 1 }
    ]
  },
  {
    id: "lesson11",
    title: "11. Final Exam: Architecture & System Design",
    lang: "html",
    file: "src/lesson11.html",
    theory: `### Bài kiểm tra Cuối cùng - Khó & Sâu (Advanced)
**ATTENTION**: Đây không phải bài kiểm tra ghi chọp. Đây là bài thi **kiến trúc hệ thống** yêu cầu bạn thiết kế một ứng dụng web hoàn chỉnh.

### Scenario thực tế:
Công ty "ShopHub" muốn xây dựng nền tảng e-commerce cho các cửa hàng nhỏ. Bạn là Lead Architect.

### Yêu cầu (phải trả lời đủ 4/5):
1. **Database Design**: Thiết kế schema cho multi-vendor, products, orders, payments. Vẽ ER diagram.
2. **API Architecture**: RESTful hay GraphQL? Tại sao? Chia sẻ 5 endpoints chính.
3. **Security Plan**: Xác định 5 security risks + mitigation strategy cho từng cái.
4. **Scaling Strategy**: Giải pháp khi có 1 triệu users? Load balancing, caching, database sharding?
5. **Monitoring & Logging**: Kiến trúc observability: logs, metrics, traces → để theo dõi performance.

### Delivery:
- Viết tài liệu thiết kế (markdown hoặc PDF)
- Bao gồm: Problem statement, Solution architecture, Technology stack rationale
- Thảo luận trade-offs (CAP theorem, eventual consistency, etc.)

### Tiêu chí chấm:
- ✅ Hiểu vấn đề thực tế (problem-solving mindset)
- ✅ Giải pháp khả thi & scalable
- ✅ Biết trade-offs & có logic reasoning
- ✅ Security-first thinking
- ✅ Ghi chép rõ ràng, chuyên nghiệp`,
    tasks: [
      "Design database schema cho multi-vendor e-commerce platform",
      "Viết API specification (5 core endpoints)",
      "List 5 security risks + mitigation steps",
      "Propose scaling strategy cho 1M+ concurrent users"
    ],
    starterCode: `# ShopHub System Architecture Design

## 1. Database Schema
\`\`\`sql
-- TO BE DESIGNED BY YOU
\`\`\`

## 2. API Endpoints
\`\`\`
GET /api/v1/shops/:shopId/products
POST /api/v1/orders
...
\`\`\`

## 3. Security Risks & Mitigations
- Risk 1: ...
  - Mitigation: ...
...

## 4. Scaling Architecture
...`,
    verify: (code) => true,
    practiceType: "capstone",
    miniQuiz: [
      { q: "CAP Theorem nói gì?", o: ["Consistency, Availability, Partition tolerance - chỉ 2/3 có thể đạt", "Cost, Automation, Performance", "Client, API, Provider", "Không liên quan database"], a: 0 },
      { q: "Eventual Consistency có nghĩa?", o: ["Dữ liệu luôn đồng bộ tức thời", "Dữ liệu sẽ đồng bộ sau một lúc", "Consistency không thể đạt", "Database không có consistency"], a: 1 },
      { q: "Khi có 1M+ users, nên dùng gì?", o: ["Một server duy nhất", "Load balancer + multiple servers + caching", "Xóa bớt users", "Nâng cấp hosting"], a: 1 }
    ]
  }
];

export const QUIZ_POOL_1 = [
  {
    q: "Thẻ nào dùng để tạo tiêu đề có kích thước chữ lớn nhất trong HTML?",
    o: ["<h2>", "<h1>", "<h6>", "<title>"],
    a: 1
  },
  {
    q: "Thuộc tính nào của CSS dùng để thay đổi màu chữ?",
    o: ["font-color", "text-color", "color", "background-color"],
    a: 2
  },
  {
    q: "Để khai báo một HẰNG SỐ trong JavaScript, ta dùng từ khóa nào?",
    o: ["let", "const", "var", "def"],
    a: 1
  },
  {
    q: "Thẻ <a href='url'> dùng để làm gì trong HTML?",
    o: ["Tạo hình ảnh", "Tạo liên kết", "Tạo bảng dữ liệu", "Tạo danh sách"],
    a: 1
  },
  {
    q: "Thuộc tính CSS nào dùng để tạo khoảng trống BÊN TRONG viền của phần tử?",
    o: ["margin", "border", "padding", "spacing"],
    a: 2
  },
  {
    q: "Thẻ nào dùng để chèn hình ảnh trong HTML?",
    o: ["<image>", "<img>", "<picture>", "<src>"],
    a: 1
  },
  {
    q: "Làm sao để gọi file JavaScript bên ngoài vào trang HTML?",
    o: ["<script src='file.js'>", "<link js='file.js'>", "<javascript href='file.js'>", "<script href='file.js'>"],
    a: 0
  },
  {
    q: "Trong JavaScript, document.getElementById('demo') trả về kết quả gì?",
    o: ["Mảng chứa các class 'demo'", "Phần tử đầu tiên có id là 'demo'", "Danh sách các phần tử", "Giá trị text"],
    a: 1
  },
  {
    q: "Kiểu dữ liệu nào đại diện cho giá trị Đúng (True) hoặc Sai (False) trong JS?",
    o: ["String", "Number", "Boolean", "Object"],
    a: 2
  },
  {
    q: "Thẻ nào chứa tiêu đề tab và các thẻ cấu hình meta ẩn trong HTML?",
    o: ["<body>", "<meta>", "<title>", "<head>"],
    a: 3
  }
];

export const QUIZ_POOL_2 = [
  {
    q: "Hệ quản trị cơ sở dữ liệu quan hệ phổ biến nhất đi kèm với PHP là gì?",
    o: ["MongoDB", "MySQL", "Redis", "Firebase"],
    a: 1
  },
  {
    q: "Từ khóa SQL nào dùng để truy vấn dữ liệu từ bảng?",
    o: ["GET", "SELECT", "RETRIEVE", "QUERY"],
    a: 1
  },
  {
    q: "Trong SQL, mệnh đề nào dùng để giới hạn số lượng kết quả trả về?",
    o: ["LIMIT", "WHERE", "ORDER BY", "COUNT"],
    a: 0
  },
  {
    q: "Biến trong PHP luôn bắt đầu bằng ký tự nào?",
    o: ["@", "$", "#", "&"],
    a: 1
  },
  {
    q: "Lệnh nào trong PHP dùng để xuất dữ liệu ra màn hình HTML?",
    o: ["print_out", "echo", "console.log", "document.write"],
    a: 1
  },
  {
    q: "Thư viện kết nối CSDL MySQL hướng đối tượng bảo mật và phổ biến hiện nay trong PHP là gì?",
    o: ["mysql_connect", "PDO", "SQLite", "MongoDB Driver"],
    a: 1
  },
  {
    q: "Trong SQL, câu lệnh nào dùng để cập nhật dữ liệu hiện có?",
    o: ["INSERT", "UPDATE", "CHANGE", "MODIFY"],
    a: 1
  },
  {
    q: "Ngôn ngữ PHP chạy ở phía nào?",
    o: ["Client-side (Trình duyệt)", "Server-side (Máy chủ)", "Cả hai", "Database-side"],
    a: 1
  },
  {
    q: "Kết thúc mỗi câu lệnh trong PHP phải có ký tự gì?",
    o: ["Dấu chấm câu (.)", "Dấu hai chấm (:)", "Dấu chấm phẩy (;)", "Dấu phẩy (,)"],
    a: 2
  },
  {
    q: "Thẻ nào dùng để tạo biểu mẫu nhập liệu trong HTML?",
    o: ["<input>", "<form>", "<select>", "<label>"],
    a: 1
  },
  {
    q: "Selector '.main-btn' trong CSS nhắm đến phần tử nào?",
    o: ["Phần tử có id='main-btn'", "Phần tử có class='main-btn'", "Thẻ <main-btn>", "Tất cả các thẻ button"],
    a: 1
  },
  {
    q: "Công nghệ/Thuộc tính CSS nào hỗ trợ căn chỉnh layout một chiều rất tốt?",
    o: ["Flexbox", "Grid", "Float", "Position"],
    a: 0
  },
  {
    q: "Hàm nào trong JavaScript dùng để gọi API bất đồng bộ?",
    o: ["ajax()", "fetch()", "get()", "request()"],
    a: 1
  },
  {
    q: "Kết quả của phép cộng string 1 + '1' trong JavaScript là gì?",
    o: ["2", "11", "NaN", "TypeError"],
    a: 1
  },
  {
    q: "SQL là viết tắt của từ gì?",
    o: ["Simple Query Language", "Structured Query Language", "Server Queue Language", "System Query List"],
    a: 1
  },
  {
    q: "Thẻ <meta charset='UTF-8'> có tác dụng gì?",
    o: ["Hiển thị ảnh đẹp", "Định dạng Tiếng Việt có dấu không bị lỗi", "Tăng tốc độ load trang", "Tạo responsive"],
    a: 1
  },
  {
    q: "Thuộc tính CSS 'margin' tạo khoảng cách ở vị trí nào?",
    o: ["Bên trong phần tử", "Bên ngoài viền phần tử", "Giữa chữ và viền", "Không có tác dụng"],
    a: 1
  },
  {
    q: "Thẻ <ul> trong HTML dùng để làm gì?",
    o: ["Tạo danh sách có thứ tự (1, 2, 3)", "Tạo danh sách không có thứ tự (dấu chấm)", "Tạo bảng biểu", "Tạo menu ngang"],
    a: 1
  },
  {
    q: "Lệnh SQL nào dùng để sắp xếp kết quả?",
    o: ["SORT BY", "ORDER BY", "GROUP BY", "ARRANGE"],
    a: 1
  },
  {
    q: "Cú pháp mở và đóng của một khối mã PHP là gì?",
    o: ["<? ... ?>", "<?php ... ?>", "<php ... />", "<script php> ... </script>"],
    a: 1
  },
  {
    q: "Hàm JSON.stringify() trong JS có vai trò gì?",
    o: ["Chuyển chuỗi JSON thành Object", "Chuyển Object thành chuỗi JSON", "Kiểm tra chuỗi JSON hợp lệ", "Gửi dữ liệu qua API"],
    a: 1
  },
  {
    q: "Trong PHP, ta dùng ký tự nào để ghép (nối) hai chuỗi ký tự?",
    o: ["Dấu cộng (+)", "Dấu chấm (.)", "Dấu và (&)", "Dấu phẩy (,)"],
    a: 1
  },
  {
    q: "Biến siêu toàn cục nào của PHP nhận dữ liệu gửi lên từ phương thức POST?",
    o: ["$_GET", "$_POST", "$_REQUEST", "$_SERVER"],
    a: 1
  },
  {
    q: "Cách chuẩn để nhúng file CSS ngoài vào HTML là gì?",
    o: ["<script src='style.css'>", "<link rel='stylesheet' href='style.css'>", "<style src='style.css'>", "<css href='style.css'>"],
    a: 1
  },
  {
    q: "JavaScript có mối quan hệ gì với ngôn ngữ Java?",
    o: ["JavaScript là phiên bản chạy trên web của Java", "Java và JavaScript là hai ngôn ngữ hoàn toàn độc lập, khác nhau", "JavaScript kế thừa từ Java", "Cùng một công ty phát triển"],
    a: 1
  },
  {
    q: "Câu lệnh SQL nào xóa dữ liệu của bảng nhưng vẫn giữ lại cấu trúc bảng?",
    o: ["DELETE TABLE", "DROP TABLE", "TRUNCATE TABLE", "CLEAR TABLE"],
    a: 2
  },
  {
    q: "PHP viết tắt của từ gì?",
    o: ["Personal Home Page", "Hypertext Preprocessor", "Private Handler Program", "Programming Hypertext Processor"],
    a: 1
  },
  {
    q: "Cột khoá chính (Primary Key) trong MySQL tự động tăng giá trị khi chèn dòng mới bằng thuộc tính nào?",
    o: ["AUTO_INCREMENT", "SELF_INCREASE", "AUTO_ADD", "SEQUENCE"],
    a: 0
  },
  {
    q: "Biến $_GET trong PHP lấy dữ liệu từ đâu?",
    o: ["Từ Cookies", "Từ Session", "Từ các tham số truy vấn trên URL", "Từ nội dung ẩn của Form"],
    a: 2
  },
  {
    q: "Để lọc các dòng trùng lặp trong kết quả truy vấn SQL, ta dùng từ khóa nào?",
    o: ["UNIQUE", "DISTINCT", "DIFFERENT", "GROUP BY"],
    a: 1
  }
];
