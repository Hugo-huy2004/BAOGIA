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
  },
  lesson6: {
    visualType: "phpFlow",
    mentalModel: "PHP chạy trên server, biên dịch mã nguồn thành HTML tĩnh rồi gửi trả về trình duyệt. Khác với JS chạy ở client, PHP không lưu trạng thái sau khi đã gửi HTML đi.",
    keyIdeas: [
      "PHP bắt đầu bằng <?php và kết thúc bằng ?> (nếu có xen lẫn HTML).",
      "Mọi biến số bắt đầu bằng ký tự $.",
      "Lệnh echo xuất dữ liệu trực tiếp vào luồng HTML trả về."
    ],
    deepDive: [
      {
        title: "Vòng đời Request",
        body: "Client gửi yêu cầu -> Web Server (Apache/Nginx) chuyển tiếp cho PHP interpreter -> PHP thực thi mã nguồn -> Trả về HTML -> Kết thúc phiên làm việc."
      }
    ],
    commonMistakes: [
      "Quên dấu chấm phẩy (;) ở cuối câu lệnh gây Syntax Error.",
      "Nối chuỗi bằng dấu cộng (+) thay vì dấu chấm (.) của PHP."
    ]
  },
  lesson7: {
    visualType: "debugTree",
    mentalModel: "Lập trình là giải quyết lỗi. Thay vì đoán mò, hãy học cách cô lập vùng lỗi: xem console log, kiểm tra kiểu dữ liệu, và viết các trường hợp kiểm thử nhỏ.",
    keyIdeas: [
      "Cú pháp sai gây lỗi crash lập tức; logic sai gây ra lỗi âm thầm.",
      "Luôn dùng var_dump() hoặc console.log() để biết chính xác giá trị thực.",
      "Sửa từng lỗi một, không sửa nhiều chỗ cùng lúc."
    ],
    deepDive: [
      {
        title: "Rubber Ducking",
        body: "Giải thích chi tiết từng dòng code của mình cho một chú vịt cao su hoặc một người không biết lập trình sẽ giúp bạn tự nhận ra lỗi logic của mình."
      }
    ]
  },
  lesson8: {
    visualType: "flexboxPreview",
    mentalModel: "CSS Flexbox giúp xếp các phần tử linh hoạt theo trục ngang (row) hoặc trục dọc (column). Nó tự co giãn và căn chỉnh khoảng cách hoàn hảo trên mọi kích thước màn hình.",
    keyIdeas: [
      "Flex-direction định dạng trục chính: hàng ngang hoặc cột dọc.",
      "Justify-content căn chỉnh dọc theo trục chính.",
      "Align-items căn chỉnh vuông góc với trục chính."
    ]
  },
  lesson9: {
    visualType: "fullstackArchitecture",
    mentalModel: "Ứng dụng Full-stack là sự kết hợp nhịp nhàng: Cơ sở dữ liệu lưu dữ liệu -> Backend PHP truy vấn và trả API -> Frontend JS nhận JSON và hiển thị đẹp mắt cho người dùng.",
    keyIdeas: [
      "Frontend gửi yêu cầu API bất đồng bộ bằng fetch().",
      "Backend bảo vệ Database bằng Prepared Statements.",
      "Dữ liệu trao đổi là định dạng JSON tiêu chuẩn."
    ]
  },
  lesson10: {
    visualType: "securityVault",
    mentalModel: "Bảo mật không phải là tính năng phụ, nó là nền móng. Ba nguyên tắc sống còn: Escape dữ liệu hiển thị (chống XSS), Prepared statements (chống SQL Injection), và Hash mật khẩu (chống rò rỉ dữ liệu).",
    keyIdeas: [
      "Không bao giờ tin tưởng dữ liệu từ người dùng gửi lên.",
      "Mật khẩu phải lưu dưới dạng hash bcrypt, không bao giờ lưu plaintext.",
      "Escape HTML khi hiển thị chuỗi nhập từ bên ngoài."
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
    theory: `### JavaScript cơ bản
JavaScript giúp trang web có logic xử lý và khả năng phản hồi tương tác từ người dùng.

### DOM & Sự kiện:
- \`document.getElementById('id')\`: Tìm phần tử.
- \`addEventListener('click', ...)\`: Lắng nghe sự kiện click.`,
    tasks: [
      "Thực hành: Nhấp chuột vào nút bấm 3 lần liên tiếp để tăng bộ đếm lên đúng số 3."
    ],
    starterCode: `<button id="btn">Click me</button>`,
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
    title: "7. Debugging Challenge: Find & Fix the Bugs",
    lang: "php",
    file: "src/lesson7.php",
    theory: `### Real-World Debugging Skills
Các bugs không bao giờ nói cho bạn biết nó ở đâu. Bạn phải học cách tìm.

### Debugging Techniques:
1. **Console/Error logs**: \`error_log()\`, \`var_dump()\`, \`print_r()\`
2. **Browser DevTools**: Network tab, Console, Debugger
3. **Version control**: \`git diff\` để xem thay đổi gần đây
4. **Test cases**: Unit test, manual testing edge cases
5. **Rubber duck debugging**: Giải thích code với ai đó (hoặc vịt rubber!)

### Bugs cần tìm trong bài này:
- Off-by-one error (array indexing)
- Type coercion bugs (loose vs strict comparison)
- Missing null check (undefined variable)
- Logic error (sai điều kiện if/while)
- SQL syntax error (missing quotes, comma)`,
    tasks: [
      "**Bug #1**: Mảng có 5 phần tử (index 0-4), code access index 5 → fix loop condition",
      "**Bug #2**: Lấy giá từ database nhưng quên type-cast → price + 10 = '99910' chứ không phải 109",
      "**Bug #3**: Kiểm tra if ($_GET['action']) nhưng quên null check → E_NOTICE error",
      "**Bug #4**: SQL query SELECT * FROM users WHERE id = 123 OR 1=1 → data leak từ SQL injection"
    ],
    starterCode: `<?php
// BUG #1: Loop vượt quá array bounds
$products = ['A', 'B', 'C', 'D', 'E'];
for ($i = 0; $i <= count($products); $i++) {
  echo $products[$i];  // E_WARNING: Undefined offset: 5
}

// BUG #2: Type coercion issue
$price = "99";
$newPrice = $price + 10;  // '99' + 10 = 109? or '9910'?
echo $newPrice;

// BUG #3: No null check
$action = $_GET['action'];  // E_NOTICE if 'action' key missing
if ($action) { /* ... */ }

// BUG #4: SQL Injection
$id = $_GET['id'];  // "123 OR 1=1"
$query = "SELECT * FROM users WHERE id = " . $id;
?>`,
    hints: [
      "Bug #1: Dùng < thay vì <= trong loop condition",
      "Bug #2: Explicit cast: (int)$price + 10",
      "Bug #3: Dùng null coalescing: $_GET['action'] ?? null",
      "Bug #4: LUÔN dùng prepared statements: pdo->prepare()"
    ],
    resources: [
      { title: "PHP Variable Debugging", url: "https://www.php.net/manual/en/function.var-dump.php" },
      { title: "PHP Error Types", url: "https://www.php.net/manual/en/errorfunc.constants.php" },
      { title: "SQL Injection Prevention", url: "https://owasp.org/www-community/attacks/SQL_Injection" },
      { title: "Type Juggling in PHP", url: "https://www.php.net/manual/en/language.types.juggling.php" }
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
      { q: "SQL Injection 'OR 1=1' nguy hiểm vì sao?", o: ["Làm chậu query", "Trả về tất cả records thay vì 1", "Xóa database", "Không nguy hiểm"], a: 1 }
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
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("@media") && c.includes("display:flex");
    },
    practiceType: "code_challenge",
    hints: [
      "Bắt đầu từ mobile CSS (no @media), sau đó thêm @media (min-width: 768px) cho tablet, @media (min-width: 1024px) cho desktop",
      "Flexbox tips: flex-direction: row (desktop), column (mobile); justify-content cho căn chỉnh",
      "Test responsive: DevTools → Toggle device toolbar (Ctrl+Shift+M) → test từ 375px → 1920px"
    ],
    resources: [
      { title: "CSS Flexbox Guide", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout" },
      { title: "Responsive Design MDN", url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design" },
      { title: "Chrome DevTools Responsive", url: "https://developer.chrome.com/docs/devtools/device-mode/" },
      { title: "Common Breakpoints", url: "https://stackoverflow.com/questions/19961987/media-queries-for-retina-displays" }
    ],
    miniQuiz: [
      { q: "Một trang web có @media (min-width: 768px) { width: 50% }. Trên màn hình 800px, chiều rộng là bao nhiêu?", o: ["Phụ thuộc vào CSS cha", "50% (vì 800px >= 768px)", "Lỗi", "Không thể xác định"], a: 1 },
      { q: "Viewport meta tag: <meta name='viewport' content='width=device-width, initial-scale=1'> có tác dụng gì?", o: ["Ẩn thanh địa chỉ", "Cho phép zoom", "Thiết lập viewport = device width, không zoom mặc định", "Không cần thiết"], a: 2 },
      { q: "Nested media queries CSS (@media (@media ...)) có được phép không?", o: ["Được trong SCSS, không trong CSS thuần", "Không bao giờ được phép", "Được phép, nhưng hiếm", "Được phép ở mọi nơi"], a: 0 }
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
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const pdo = c.includes("prepare(") && c.includes("execute(");
      const json = c.includes("json_encode(") && c.includes("application/json");
      return pdo && json;
    },
    practiceType: "capstone",
    hints: [
      "Database design: Dùng foreign keys (users.id → orders.user_id, products.id → orders.product_id)",
      "API validation: Check is_numeric($_GET['id']), return 400 if invalid, 404 if not found",
      "Frontend fetch: fetch('/api/products/{id}').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })",
      "Image gallery: Dùng event delegation để handle click events, update src khi user click thumbnail"
    ],
    resources: [
      { title: "SQL Foreign Keys", url: "https://en.wikipedia.org/wiki/Foreign_key" },
      { title: "PDO Error Handling", url: "https://www.php.net/manual/en/pdo.error-info.php" },
      { title: "Fetch Error Handling", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#handling_failed_http_responses" },
      { title: "REST API Best Practices", url: "https://restfulapi.net/http-status-codes/" },
      { title: "Event Delegation", url: "https://javascript.info/event-delegation" }
    ],
    miniQuiz: [
      { q: "Nếu user gửi GET /api/products/123' OR '1'='1, prepared statement sẽ làm gì?", o: ["Return lỗi SQL", "Treat toàn bộ string '123\\' OR \\'1\\'=\\'1' như value, không execute SQL code", "Return tất cả products", "Crash server"], a: 1 },
      { q: "API endpoint nên return 400 hay 404 khi product ID không tồn tại?", o: ["400 Bad Request (lỗi request)", "404 Not Found (resource không tồn tại)", "Giống nhau", "201 Created"], a: 1 },
      { q: "Trong JS, fetch() từ origin khác có bị CORS block không?", o: ["Không, tự do", "Có, trừ khi server gửi Allow-Origin header", "Tùy browser", "Không liên quan fetch"], a: 1 },
      { q: "N+1 query problem: Lấy 1 product (1 query) rồi loop 50 reviews (50 queries). Cách fix tốt nhất?", o: ["Thêm index", "JOIN products với reviews trong 1 query", "Xóa reviews", "Thêm cache"], a: 1 }
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
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const xss = c.includes("htmlspecialchars(");
      const sql = c.includes("prepare(") && c.includes("execute(");
      const bcrypt = c.includes("password_hash(") && c.includes("password_bcrypt");
      return xss && sql && bcrypt;
    },
    practiceType: "code_challenge",
    hints: [
      "XSS fix: LUÔN dùng htmlspecialchars() khi echo user input, parameter ENT_QUOTES cho quote escaping",
      "CSRF token: Tạo token unique mỗi session, include trong form hidden field, verify trước xử lý POST",
      "Password hashing: password_hash($password, PASSWORD_BCRYPT) lưu hash, dùng password_verify() để kiểm tra",
      "Database indexing: CREATE INDEX idx_email ON users(email) để tăng tốc độ WHERE email = ?, EXPLAIN SELECT để analyze"
    ],
    resources: [
      { title: "OWASP Top 10", url: "https://owasp.org/Top10/" },
      { title: "htmlspecialchars PHP", url: "https://www.php.net/manual/en/function.htmlspecialchars.php" },
      { title: "bcrypt Hashing", url: "https://www.php.net/manual/en/function.password-hash.php" },
      { title: "SQL Query Optimization", url: "https://dev.mysql.com/doc/refman/8.0/en/optimization.html" },
      { title: "CSRF Attack Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html" }
    ],
    miniQuiz: [
      { q: "XSS attack: Attacker gửi name=<script>alert('XSS')</script>. Nếu không escape, gì sẽ xảy ra?", o: ["Không gì", "Script execute trên browser user khác đọc", "Server crash", "Database lỗi"], a: 1 },
      { q: "CSRF attack: Attacker tạo form POST giả từ website khác. Cách phòng chống?", o: ["Không cần", "Kiểm tra Referer header (yếu)", "Dùng CSRF token unique mỗi session", "Chỉ cho phép HTTPS"], a: 2 },
      { q: "MD5(password) có an toàn không?", o: ["Có, nó hash", "Không, MD5 collision attacks + rainbow table exist, dùng bcrypt", "Tùy độ dài password", "MD5 nhanh nên an toàn"], a: 1 },
      { q: "Nếu query SELECT * FROM users WHERE created_at > ? chạy chậm, nên thêm gì?", o: ["Thêm WHERE", "CREATE INDEX idx_created_at ON users(created_at)", "Xóa dữ liệu", "Tăng RAM server"], a: 1 }
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
    hints: [
      "ER Diagram: Vẽ box cho mỗi entity (shops, products, orders, users, reviews), nối với foreign key lines, annotation 1:N hay M:N",
      "API spec: Ghi endpoint, HTTP method, request params/body, response format, error codes, authentication required",
      "Security risks: Identify 5 specific: SQL Injection, XSS, CSRF, Weak Auth, Insecure Direct Object Reference (IDOR)",
      "Scaling: Database replication (read replicas), caching layer (Redis), load balancer, microservices vs monolith trade-off"
    ],
    resources: [
      { title: "CAP Theorem", url: "https://en.wikipedia.org/wiki/CAP_theorem" },
      { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
      { title: "Microservices vs Monolith", url: "https://martinfowler.com/articles/microservices.html" },
      { title: "Database Scaling", url: "https://en.wikipedia.org/wiki/Sharding" },
      { title: "OWASP API Security", url: "https://owasp.org/www-project-api-security/" }
    ],
    miniQuiz: [
      { q: "Hệ thống e-commerce có 1M concurrent users. Nên dùng 1 server MySQL hay sharding?", o: ["1 server (đơn giản)", "Sharding: chia user theo region/ID range, mỗi shard 100k users (scalable)", "Tăng RAM", "NoSQL fix được"], a: 1 },
      { q: "CAP Theorem: Trong network partition, nên chọn Consistency hay Availability?", o: ["Luôn Consistency", "Luôn Availability", "Tùy use-case: bank → Consistency, social media → Availability", "CAP không liên quan partition"], a: 2 },
      { q: "Redis cache giúp gì khi store database được 100 query/s?", o: ["Không giúp gì", "Cache hot data (products, user profiles) → 10000 query/s từ cache", "Xóa database", "Chỉ hỗ trợ string data"], a: 1 },
      { q: "IDOR (Insecure Direct Object Reference): User A GET /api/orders/123, ta nên?", o: ["Trả dữ liệu order 123 của bất kỳ ai", "Verify user A owns order 123, mới trả dữ liệu", "Dùng UUID thay số", "Không cần validate"], a: 1 },
      { q: "Microservices vs Monolith: Khi nào nên dùng Microservices?", o: ["Luôn microservices", "Start monolith, migrate to microservices khi có team >10, độc lập deployment", "Microservices là future, dùng ngay", "Monolith deprecated"], a: 1 }
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
