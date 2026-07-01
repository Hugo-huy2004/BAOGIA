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
