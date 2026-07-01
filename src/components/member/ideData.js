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
    content: `# 🎓 HUGO CODER - HỌC LẬP TRÌNH WEB THỰC CHIẾN
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
  html_advanced: {
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
  css_advanced: {
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
  js_advanced: {
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
  js_api_fetch: {
    visualType: "apiFlow",
    mentalModel: "API là hợp đồng trao đổi dữ liệu giữa client và server. Frontend hỏi đúng endpoint, server trả dữ liệu, UI biến dữ liệu đó thành trải nghiệm.",
    keyIdeas: [
      "Request gồm URL, method, headers và đôi khi có body.",
      "Response cần được parse, thường là JSON.",
      "Luôn nghĩ tới loading, success và error."
    ],
    deepDive: [
      {
        title: "Bất đồng bộ",
        body: "Fetch không trả dữ liệu ngay. Nó trả Promise, nghĩa là một lời hứa sẽ hoàn tất sau. UI không nên đứng chờ cứng trong lúc request chạy."
      },
      {
        title: "Network không chắc chắn",
        body: "Mạng có thể chậm, server có thể lỗi, người dùng có thể offline. Code tốt luôn có đường lui."
      }
    ],
    commonMistakes: [
      "Quên response.json() nên chỉ nhận object Response.",
      "Không bắt lỗi nên màn hình im lặng khi request fail.",
      "Tin dữ liệu API 100% mà không kiểm tra thiếu field."
    ],
    quiz: [
      "Promise giúp UI không bị treo như thế nào?",
      "Ba trạng thái UI tối thiểu khi gọi API là gì?"
    ],
    demoCode: `<!DOCTYPE html>
<html lang="vi">
<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;background:#eff6ff">
  <section style="width:260px;background:white;border:1px solid #bfdbfe;border-radius:12px;padding:18px">
    <h2>API Demo</h2>
    <p id="result">Đang mô phỏng tải dữ liệu...</p>
  </section>
  <script>
    const result = document.getElementById("result");
    setTimeout(function() {
      const data = { name: "Leanne Graham", role: "Frontend learner" };
      result.textContent = "User: " + data.name + " - " + data.role;
    }, 900);
  </script>
</body>
</html>`
  },
  sql_advanced: {
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
    id: "html_advanced",
    title: "1. HTML Thực chiến - Card Sản Phẩm",
    lang: "html",
    file: "src/lesson1.html",
    theory: `### Tư duy xây dựng Layout HTML
Thay vì chỉ viết vài thẻ rời rạc, các trang web thực tế luôn gom nhóm các phần tử vào một "hộp" chung gọi là \`<div>\` (viết tắt của Division). Thẻ \`<div>\` giống như một chiếc thùng carton dùng để đóng gói mã nguồn của bạn sao cho gọn gàng và dễ dàng di chuyển.

### Cấu trúc Product Card:
Một thẻ hiển thị sản phẩm trên sàn thương mại điện tử (Shopee, Tiki) thường sẽ có cấu trúc như sau:
1. Một \`<div>\` bao bọc bên ngoài.
2. Một hình ảnh sản phẩm (\`<img>\`).
3. Một tiêu đề tên sản phẩm (\`<h2>\`).
4. Đoạn mô tả (\`<p>\`).
5. Một nút bấm đặt hàng (\`<button>\`).

### Thuộc tính \`class\`
Để có thể "nhắm mục tiêu" làm đẹp ở bài CSS sau, chúng ta cần gắn tên cho thẻ div bằng thuộc tính \`class\`.
*Ví dụ:* \`<div class="product-card">\``,
    tasks: [
      "Tạo một thẻ <div> có thuộc tính class='product-card'. Tất cả các thẻ bên dưới phải nằm BÊN TRONG thẻ div này.",
      "Tạo một thẻ <img> có thuộc tính src='https://via.placeholder.com/150' và alt='Sản phẩm 1'.",
      "Tạo một thẻ <h2> với nội dung là 'Giày Thể Thao Cao Cấp'.",
      "Tạo một thẻ <button> với nội dung là 'Mua Ngay'."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <title>Bài 1: Xây dựng Card Sản Phẩm</title>
</head>
<body>
    <!-- TODO: Xây dựng khối HTML của bạn ở dưới dòng này -->
    
    
</body>
</html>`,
    verify: (code) => {
      const divRegex = /<div\s+class=["']product-card["'][^>]*>.*<\/div>/is;
      const imgRegex = /<img\s+[^>]*src=["']https:\/\/via\.placeholder\.com\/150["'][^>]*>/i;
      const h2Regex = /<h2[^>]*>.*Giày Thể Thao Cao Cấp.*<\/h2>/is;
      const btnRegex = /<button[^>]*>.*Mua Ngay.*<\/button>/is;
      return divRegex.test(code) && imgRegex.test(code) && h2Regex.test(code) && btnRegex.test(code);
    }
  },
  {
    id: "css_advanced",
    title: "2. CSS Thực chiến - Làm đẹp Card Sản Phẩm",
    lang: "html",
    file: "src/lesson2.html",
    theory: `### Biến bộ khung HTML thành sản phẩm đẹp mắt
Ở bài trước, bạn đã tạo ra một Card sản phẩm bằng HTML nhưng nó còn rất thô. Trong bài này, chúng ta sẽ áp dụng CSS (Box Model) để đóng khung và trang trí nó!

### Kiến thức cốt lõi: Box Model
Mọi phần tử HTML đều được trình duyệt coi là một hình chữ nhật (Box). Nó bao gồm:
- \`margin\`: Khoảng trống **BÊN NGOÀI** đường viền (tạo khoảng cách với phần tử khác).
- \`border\`: Đường viền bao quanh phần tử.
- \`padding\`: Khoảng trống **BÊN TRONG** đường viền (tạo không gian giữa đường viền và nội dung chữ).

### Ví dụ về trang trí Box:
\`\`\`css
.my-box {
  border: 2px solid #ccc; /* Viền nét đứt màu xám */
  padding: 15px; /* Đẩy chữ cách viền 15px */
  border-radius: 8px; /* Bo cong các góc 8px */
  text-align: center; /* Căn giữa toàn bộ chữ */
}
\`\`\``,
    tasks: [
      "Target (nhắm mục tiêu) class .product-card trong CSS.",
      "Thêm đường viền cho card (border: 1px solid black;).",
      "Thêm khoảng trống bên trong card (padding: 20px;).",
      "Căn giữa tất cả các phần tử bên trong card (text-align: center;)."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <style>
        /* TODO: Viết CSS cho .product-card ở dưới */
        
        
    </style>
</head>
<body>
    <div class="product-card">
        <img src="https://via.placeholder.com/150" alt="Sản phẩm 1">
        <h2>Giày Thể Thao Cao Cấp</h2>
        <p>Thoáng khí, êm ái, phong cách.</p>
        <button>Mua Ngay</button>
    </div>
</body>
</html>`,
    verify: (code) => {
      const borderCss = /\.product-card\s*{[^}]*border\s*:\s*1px\s+solid\s+black\s*;/i;
      const paddingCss = /\.product-card\s*{[^}]*padding\s*:\s*20px\s*;/i;
      const textCss = /\.product-card\s*{[^}]*text-align\s*:\s*center\s*;/i;
      return borderCss.test(code) && paddingCss.test(code) && textCss.test(code);
    }
  },
  {
    id: "js_advanced",
    title: "3. Javascript - Tương tác Logic",
    lang: "html",
    file: "src/lesson3.html",
    theory: `### Gắn sự kiện (Events) bằng Javascript
Chúng ta đã có một Card sản phẩm đẹp. Nhưng nút "Mua Ngay" nhấn vào chưa xảy ra chuyện gì cả! Bạn cần dùng Javascript để "lắng nghe" khi người dùng nhấn vào nút này và thực hiện một hành động (ví dụ: Báo lỗi, báo thành công, trừ tiền).

### Các bước để tạo sự kiện click:
1. **Tìm phần tử cần gắn sự kiện:**
   Dùng \`document.getElementById("btn-mua")\`.
   
2. **Gắn hàm lắng nghe (EventListener):**
   Sử dụng hàm \`addEventListener\`. Nó nhận vào 2 tham số:
   - Tên sự kiện: \`"click"\`, \`"mouseover"\`...
   - Hàm sẽ chạy: \`function() { ... }\`

### Ví dụ:
\`\`\`javascript
const nutBam = document.getElementById("my-button");
nutBam.addEventListener("click", function() {
    alert("Bạn vừa nhấn vào nút!");
});
\`\`\`
*(Lưu ý: \`alert()\` là lệnh hiển thị một thông báo popup trên trình duyệt)*`,
    tasks: [
      "Trong thẻ <script>, tìm nút bấm có id là 'btn-mua' và lưu vào một biến.",
      "Gắn sự kiện 'click' (addEventListener) vào biến vừa tìm được.",
      "Bên trong hàm xử lý click, sử dụng lệnh alert() để hiện thông báo chính xác là: 'Thêm vào giỏ hàng thành công!'."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<body>
    <div class="product-card">
        <h2>Giày Thể Thao</h2>
        <!-- Chú ý: Nút bấm đã được cấp id='btn-mua' -->
        <button id="btn-mua">Mua Ngay</button>
    </div>
    
    <script>
        // TODO: Viết mã Javascript ở đây
        
        
    </script>
</body>
</html>`,
    verify: (code) => {
      const getElement = /document\.getElementById\s*\(\s*["']btn-mua["']\s*\)/i;
      const addEvent = /\.addEventListener\s*\(\s*["']click["']\s*,\s*function/i;
      const alertCode = /alert\s*\(\s*["']Thêm vào giỏ hàng thành công!["']\s*\)/i;
      return getElement.test(code) && addEvent.test(code) && alertCode.test(code);
    }
  },
  {
    id: "js_api_fetch",
    title: "4. Javascript API - Lấy dữ liệu Server",
    lang: "html",
    file: "src/lesson4.html",
    theory: `### API (Application Programming Interface) là gì?
Thực tế, dữ liệu sản phẩm không được ghi "chết" trong HTML như chúng ta làm từ đầu bài. Nó được lưu ở cơ sở dữ liệu trên Máy chủ (Server). 
Để trình duyệt lấy được dữ liệu này, Javascript sẽ thực hiện một "cuộc gọi" (HTTP Request) đến Máy chủ thông qua **API**.

### Lệnh Fetch
Javascript cung cấp hàm \`fetch()\` để tải dữ liệu từ internet. Quá trình này diễn ra **bất đồng bộ** (asynchronous), nghĩa là trình duyệt vừa tải dữ liệu vừa làm việc khác (không bị treo). 
Vì vậy, chúng ta phải dùng thêm từ khóa \`.then()\` để báo cho Javascript biết: "Khi nào tải xong, thì làm việc này...".

### Cú pháp cơ bản của Fetch:
\`\`\`javascript
fetch('https://api.example.com/data') // 1. Gọi API
  .then(response => response.json())  // 2. Chuyển kết quả sang định dạng JSON
  .then(data => {                     // 3. Xử lý dữ liệu
      console.log(data);
  });
\`\`\``,
    tasks: [
      "Sử dụng lệnh fetch() để gọi đến đường dẫn: 'https://jsonplaceholder.typicode.com/users/1'.",
      "Tiếp nối chuỗi bằng .then(response => response.json()) để chuyển kết quả sang JSON.",
      "Tiếp nối chuỗi bằng .then(data => console.log(data.name)) để in tên của user ra màn hình Console."
    ],
    starterCode: `<!DOCTYPE html>
<html>
<body>
    <h2>Đang tải dữ liệu từ Server...</h2>
    
    <script>
        // TODO: Viết lệnh fetch() ở dưới dòng này
        
        
    </script>
</body>
</html>`,
    verify: (code) => {
      const fetchRegex = /fetch\s*\(\s*["']https:\/\/jsonplaceholder\.typicode\.com\/users\/1["']\s*\)/i;
      const jsonRegex = /\.then\s*\(\s*[\w]+\s*=>\s*[\w]+\.json\s*\(\s*\)\s*\)/i;
      const logRegex = /\.then\s*\(\s*[\w]+\s*=>\s*console\.log\s*\(\s*[\w]+\.name\s*\)\s*\)/i;
      return fetchRegex.test(code) && jsonRegex.test(code) && logRegex.test(code);
    }
  },
  {
    id: "sql_advanced",
    title: "5. SQL Thực chiến - Điều kiện & Sắp xếp",
    lang: "sql",
    file: "src/lesson5.sql",
    theory: `### Kỹ thuật truy xuất dữ liệu nâng cao
Khi bạn có hàng triệu sản phẩm trong cơ sở dữ liệu, bạn không thể tải tất cả lên web. Bạn cần dùng SQL để **Lọc**, **Sắp xếp** và **Giới hạn** số lượng trả về.

### 1. Sắp xếp (ORDER BY)
Bạn có thể sắp xếp kết quả tăng dần (\`ASC\`) hoặc giảm dần (\`DESC\`).
- *Ví dụ:* \`SELECT * FROM products ORDER BY price DESC;\` (Lấy sản phẩm sắp xếp giá từ cao xuống thấp).

### 2. Giới hạn số lượng (LIMIT)
Rất hữu ích khi làm chức năng phân trang (Chỉ hiển thị 10 sản phẩm mỗi trang).
- *Ví dụ:* \`SELECT * FROM products LIMIT 5;\` (Chỉ lấy đúng 5 sản phẩm đầu tiên).

### 3. Kết hợp nhiều điều kiện (AND / OR)
- *Ví dụ:* \`SELECT * FROM products WHERE price > 500 AND status = 'active';\``,
    tasks: [
      "Viết câu lệnh SELECT lấy tất cả các cột từ bảng 'products'.",
      "Thêm điều kiện lọc (WHERE) chỉ lấy các sản phẩm có 'price' lớn hơn 1000.",
      "Sắp xếp kết quả (ORDER BY) theo cột 'price' với thứ tự GIẢM DẦN (DESC).",
      "Giới hạn (LIMIT) kết quả chỉ trả về 3 dòng đầu tiên."
    ],
    starterCode: `-- Bài 5: Truy vấn sản phẩm bằng SQL
-- Bảng chúng ta cần thao tác: products
-- Cấu trúc bảng: id, name, price, status

-- TODO: Viết câu lệnh SELECT của bạn ở dưới dòng này (Cần sử dụng WHERE, ORDER BY và LIMIT)
`,
    verify: (code) => {
      const selectRegex = /SELECT\s+\*\s+FROM\s+products/i;
      const whereRegex = /WHERE\s+price\s*>\s*1000/i;
      const orderRegex = /ORDER\s+BY\s+price\s+DESC/i;
      const limitRegex = /LIMIT\s+3/i;
      return selectRegex.test(code) && whereRegex.test(code) && orderRegex.test(code) && limitRegex.test(code);
    }
  }
];
