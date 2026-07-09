export const OPTIMIZE_LESSONS = [
  {
    id: "lesson63",
    title: "63. Tối ưu code & Nguyên tắc DRY",
    lang: "html",
    file: "src/lesson63.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**DRY (Don't Repeat Yourself)** là nguyên tắc thiết kế phần mềm cốt lõi nhằm giảm sự trùng lặp mã nguồn. Thay vì sao chép một đoạn mã xử lý ở nhiều nơi, hãy viết một hàm dùng chung (helper/utility) và tái sử dụng nó.
Lợi ích:
- Code ngắn hơn, sạch sẽ hơn.
- Khi cần sửa logic hoặc sửa bug, chỉ cần chỉnh sửa ở một nơi duy nhất.

### ÁP DỤNG HỆ THỐNG
Trong dự án thực tế, nếu bạn thấy mình viết đi viết lại khối lệnh tính thuế JOY hoặc định dạng ngày tháng, đó chính là dấu hiệu rõ ràng nhất để refactor code thành một helper function.

### THỰC HÀNH NHỎ
Tạo trang web giải thích nguyên tắc DRY và sự tai hại của việc nhân bản code (Copy-Paste programming).

### KIỂM TRA HOÀN TẤT
Mã nguồn phải chứa các từ khóa: "DRY", "refactor", "tái sử dụng", "hàm".`,
    tasks: ["Viết định nghĩa và ví dụ áp dụng nguyên tắc DRY để tối ưu hóa code."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nguyên tắc DRY</title>
</head>
<body>
    <!-- Giải thích nguyên tắc DRY tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("dry") && c.includes("refactor") && c.includes("tái sử dụng") && c.includes("hàm");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Nguyên tắc 'DRY' trong lập trình là viết tắt của cụm từ nào?", o: ["Do Repeat Yourself", "Don't Repeat Yourself", "Double Real Yard", "Data Register Yield"], a: 1 }
    ]
  },
  {
    id: "lesson64",
    title: "64. Cú pháp viết nhanh (Destructuring & Nullish Coalescing)",
    lang: "html",
    file: "src/lesson64.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
JavaScript hiện đại (ES6+) cung cấp các toán tử và cú pháp viết nhanh giúp giảm đáng kể số lượng dòng code:
- **Destructuring**: Trích xuất dữ liệu từ Object hoặc Array cực nhanh.
  \`const { name, age } = user;\` thay vì \`const name = user.name; const age = user.age;\`
- **Nullish Coalescing (??)**: Trả về vế phải khi vế trái có giá trị là \`null\` hoặc \`undefined\`.
  \`const displayName = user.nickName ?? user.fullName;\`
- **Optional Chaining (?.)**: Truy cập thuộc tính lồng nhau một cách an toàn mà không lo crash ứng dụng.
  \`const city = user?.address?.city;\`

### ÁP DỤNG HỆ THỐNG
Việc áp dụng các cú pháp này giúp code JavaScript của bạn ngắn gọn hơn, sang trọng và giảm thiểu lỗi crash do tham chiếu thuộc tính không tồn tại (\`Cannot read properties of undefined\`).

### THỰC HÀNH NHỎ
Liệt kê và viết ví dụ mô tả 3 cú pháp viết nhanh: Destructuring, Nullish Coalescing (??), và Optional Chaining (?.).

### KIỂM TRA HOÀN TẤT
File cần chứa các từ khóa: "Destructuring", "Nullish Coalescing", "Optional Chaining".`,
    tasks: ["Xây dựng tài liệu giải thích các cú pháp viết nhanh trong ES6+."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cú pháp viết nhanh ES6+</title>
</head>
<body>
    <!-- Giải thích Destructuring, Nullish Coalescing (??), Optional Chaining tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("destructuring") && c.includes("nullish coalescing") && c.includes("optional chaining");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Toán tử Nullish Coalescing (??) sẽ lấy vế phải khi vế trái nhận giá trị nào?", o: ["0 hoặc false", "null hoặc undefined", "chuỗi rỗng ''", "Tất cả các giá trị falsy"], a: 1 }
    ]
  },
  {
    id: "lesson65",
    title: "65. Kiểm thử đơn vị (Unit Testing) cơ bản",
    lang: "html",
    file: "src/lesson65.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**Kiểm thử đơn vị (Unit Testing)** là việc kiểm tra hoạt động độc lập của từng khối mã nhỏ nhất (thường là một hàm cụ thể) xem có trả về kết quả đúng như kỳ vọng với các đầu vào khác nhau hay không.
Các thư viện kiểm thử phổ biến: **Jest**, **Vitest**, **Mocha**.
Cú pháp cơ bản thường dùng cấu trúc:
\`describe()\` để gom nhóm các bài kiểm thử, \`test()\` hoặc \`it()\` để viết một ca kiểm thử cụ thể, và \`expect().toBe()\` để khẳng định kết quả.

### ÁP DỤNG HỆ THỐNG
Unit Test đóng vai trò lá chắn bảo vệ code. Khi bạn tối ưu hóa hoặc refactor code, chạy lại bộ test sẽ giúp phát hiện ngay lập tức nếu logic mới vô tình làm hỏng các tính năng cũ.

### THỰC HÀNH NHỎ
Viết mô phỏng một đoạn mã kiểm thử Jest cho hàm \`add(a, b)\`.

### KIỂM TRA HOÀN TẤT
Yêu cầu mã nguồn mô tả chứa các từ khóa cú pháp Jest: "describe", "test", "expect", "toBe".`,
    tasks: ["Xây dựng tài liệu mô phỏng cấu trúc của một file Unit Test bằng Jest."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tìm hiểu Unit Test</title>
</head>
<body>
    <!-- Viết ví dụ code test mock-up ở đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("describe") && c.includes("test") && c.includes("expect") && c.includes("tobe");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Mục đích cốt lõi của việc viết Unit Test là gì?", o: ["Làm code chạy nhanh hơn", "Kiểm thử tự động từng hàm logic nhỏ để phát hiện lỗi sớm và tự tin khi refactor", "Thay thế hoàn toàn Tester thủ công", "Viết báo cáo cho quản lý"], a: 1 }
    ]
  },
  {
    id: "lesson66",
    title: "66. Đo lường hiệu năng & Web Vitals",
    lang: "html",
    file: "src/lesson66.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Hiệu năng trang web ảnh hưởng trực tiếp đến trải nghiệm người dùng và SEO. Google sử dụng bộ chỉ số **Core Web Vitals** để đánh giá hiệu năng:
1. **LCP (Largest Contentful Paint)**: Đo lường tốc độ tải trang (Thời gian hiển thị phần tử lớn nhất). Tốt nhất là dưới 2.5 giây.
2. **INP (Interaction to Next Paint)**: Chỉ số mới đo lường khả năng phản hồi tương tác của giao diện (thay thế FID). Tốt nhất dưới 200 miligiây.
3. **CLS (Cumulative Layout Shift)**: Đo lường mức độ ổn định thị giác (tránh các phần tử tự động dịch chuyển gây bấm nhầm). Tốt nhất là dưới 0.1.

### ÁP DỤNG HỆ THỐNG
Sử dụng công cụ Chrome DevTools và Lighthouse để thường xuyên audit trang web, tối ưu ảnh, lazy loading các tài nguyên nặng để cải thiện LCP và CLS.

### THỰC HÀNH NHỎ
Tạo trang web liệt kê và định nghĩa 3 chỉ số Core Web Vitals cốt lõi của Google.

### KIỂM TRA HOÀN TẤT
Yêu cầu file chứa các từ khóa: "LCP", "INP", "CLS", "hiệu năng".`,
    tasks: ["Liệt kê và định nghĩa các chỉ số Core Web Vitals đo lường hiệu năng."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Core Web Vitals</title>
</head>
<body>
    <!-- Liệt kê LCP, INP, CLS tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toUpperCase();
      return c.includes("LCP") && c.includes("INP") && c.includes("CLS") && c.includes("HIỆU NĂNG");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Chỉ số nào đo lường mức độ dịch chuyển layout không mong muốn gây khó chịu khi cuộn trang?", o: ["LCP", "INP", "CLS", "FCP"], a: 2 }
    ]
  },
  {
    id: "lesson67",
    title: "67. Tổng quan về LLM & Trí Tuệ Nhân Tạo",
    lang: "html",
    file: "src/lesson67.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
**LLM (Large Language Model - Mô hình ngôn ngữ lớn)** như GPT-4 hay Gemini là các mô hình AI được huấn luyện trên lượng văn bản khổng lồ để hiểu và tạo ngôn ngữ tự nhiên, sinh mã nguồn lập trình.
Các khái niệm chính cần nắm:
- **Prompt (Câu lệnh)**: Yêu cầu đầu vào gửi cho AI. Prompt rõ ràng, có ngữ cảnh sẽ giúp AI trả về kết quả chất lượng hơn (kỹ thuật Prompt Engineering).
- **Token**: Đơn vị tính toán từ ngữ của AI.
- **Context Window (Cửa sổ ngữ cảnh)**: Lượng thông tin tối đa AI có thể ghi nhớ trong một lượt hội thoại.

### ÁP DỤNG HỆ THỐNG
Tích hợp LLM giúp trang web của bạn tự động hóa việc chăm sóc khách hàng (AI Chatbot), tóm tắt tài liệu, dịch thuật tự động hay gợi ý thông minh dựa trên hành vi người dùng.

### THỰC HÀNH NHỎ
Tạo trang giới thiệu các ứng dụng của AI và LLM vào sản phẩm web.

### KIỂM TRA HOÀN TẤT
Mã nguồn phải chứa các từ khóa: "LLM", "prompt", "context window", "chatbot".`,
    tasks: ["Xây dựng trang web tổng quan về mô hình ngôn ngữ lớn LLM và ứng dụng."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tìm hiểu về LLM</title>
</head>
<body>
    <!-- Giải thích về LLM, prompt, context window tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("llm") && c.includes("prompt") && c.includes("context window") && c.includes("chatbot");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Khái niệm 'Context Window' của một mô hình AI/LLM ám chỉ điều gì?", o: ["Tốc độ trả lời của AI", "Lượng thông tin (tokens) tối đa AI có thể nhận và xử lý trong một phiên hội thoại", "Giao diện chat của AI", "Giá tiền của API"], a: 1 }
    ]
  },
  {
    id: "lesson68",
    title: "68. Kết nối API Trí Tuệ Nhân Tạo (Gemini API)",
    lang: "html",
    file: "src/lesson68.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Kết nối API với các dịch vụ AI cho phép ứng dụng của bạn tương tác với trí tuệ nhân tạo theo thời gian thực.
Quy trình cơ bản của việc gọi API (Ví dụ với Gemini API bằng JavaScript):
1. Cài đặt SDK hoặc sử dụng endpoint \`fetch()\` trực tiếp gửi POST request.
2. Gửi API Key trong header bảo mật.
3. Gửi body chứa cấu trúc câu hỏi gửi đến model (ví dụ model \`gemini-1.5-flash\`).
4. Nhận về JSON kết quả và bóc tách dữ liệu hiển thị lên giao diện.

### ÁP DỤNG HỆ THỐNG
Luôn nhớ lưu trữ API Key ở file môi trường bảo mật \`.env\` ở phía Backend. Tuyệt đối không bao giờ phơi bày API Key trực tiếp ở mã nguồn Frontend Client-side vì sẽ dễ dàng bị đánh cắp.

### THỰC HÀNH NHỎ
Mô phỏng một đoạn mã \`fetch()\` JavaScript gửi yêu cầu POST đến endpoint của Gemini API.

### KIỂM TRA HOÀN TẤT
Yêu cầu mã nguồn chứa các từ khóa giả lập gọi API: "fetch", "api_key", "gemini", "json".`,
    tasks: ["Viết mã JS giả lập kết nối và gửi câu hỏi lên API của Gemini."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kết nối Gemini API</title>
</head>
<body>
    <!-- Viết code JS mô phỏng gọi API tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("fetch") && c.includes("api_key") && c.includes("gemini") && c.includes("json");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Tại sao tuyệt đối không được đưa trực tiếp API Key của Gemini/OpenAI vào mã nguồn Frontend chạy trên trình duyệt người dùng?", o: ["Làm chậm tốc độ chạy ứng dụng", "Người dùng có thể inspect code lấy trộm API Key và sử dụng trái phép làm bạn mất phí", "AI không chạy được ở Client", "Lỗi cú pháp JS"], a: 1 }
    ]
  },
  {
    id: "lesson69",
    title: "69. Lập trình AI đa phương thức & Kết quả cấu trúc",
    lang: "html",
    file: "src/lesson69.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Các mô hình AI hiện đại hỗ trợ **Đa phương thức (Multimodal)**, tức là có thể nhận đầu vào không chỉ là văn bản mà còn là hình ảnh, video, âm thanh hoặc file PDF.
Bên cạnh đó, tính năng **Structured Outputs** (Kết quả đầu ra có cấu trúc) ép buộc AI phải trả về dữ liệu đúng định dạng JSON Schema mà lập trình viên quy định trước, thay vì trả về văn bản tự do. Điều này giúp hệ thống backend phân tách (parse) dữ liệu một cách chính xác tuyệt đối mà không sợ lỗi định dạng.

### ÁP DỤNG HỆ THỐNG
Áp dụng Structured Outputs để yêu cầu AI trả về danh sách phân tích sản phẩm dạng mảng đối tượng JSON, hoặc phân loại cảm xúc người dùng thành các enum cụ thể.

### THỰC HÀNH NHỎ
Tạo trang web giải thích về lập trình AI đa phương thức và lợi ích của kết quả cấu trúc JSON.

### KIỂM TRA HOÀN TẤT
Yêu cầu mã nguồn chứa các từ khóa: "multimodal", "structured outputs", "json schema".`,
    tasks: ["Giải thích lợi ích của Structured Outputs và lập trình AI đa phương thức."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lập trình AI Đa Phương Thức</title>
</head>
<body>
    <!-- Giải thích chi tiết tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("multimodal") && c.includes("structured outputs") && c.includes("json schema");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Tính năng 'Structured Outputs' của các API AI thế hệ mới giúp giải quyết vấn đề gì?", o: ["AI trả lời nhanh hơn", "Ép buộc AI trả về đúng định dạng dữ liệu (ví dụ JSON) theo cấu trúc lập trình viên quy định", "Cho phép AI nhận dạng ảnh", "Dịch tự động ra nhiều ngôn ngữ"], a: 1 }
    ]
  },
  {
    id: "lesson70",
    title: "70. Tổng kết tối ưu hóa mã & Tích hợp trí tuệ AI",
    lang: "html",
    file: "src/lesson70.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chúc mừng bạn đã chinh phục thành công Chặng 6! Bạn đã nắm được tư duy tối ưu hóa DRY, viết code nhanh, thiết kế bộ kiểm thử đơn vị bảo vệ code và kết nối các API mô hình AI để biến trang web của mình thành một ứng dụng thông minh vượt trội.

### ÁP DỤNG HỆ THỐNG
Hãy bắt tay ngay vào việc chuẩn bị cho thử thách lớn nhất ở phía trước - Chặng 7: Lập trình sản phẩm web hoàn chỉnh từ con số 0, deploy lên máy chủ thực tế và nộp bài kiểm duyệt tốt nghiệp!

### THỰC HÀNH NHỎ
Tạo trang web ghi nhớ và tóm tắt những kỹ năng tối ưu & AI then chốt.

### KIỂM TRA HOÀN TẤT
Yêu cầu file chứa các từ khóa: "DRY", "testing", "AI API", "tối ưu".`,
    tasks: ["Tạo file HTML tổng hợp các kiến thức tối ưu code và tích hợp AI."],
    starterCode: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tổng kết Chặng 6</title>
</head>
<body>
    <!-- Viết nội dung tổng hợp tại đây -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("dry") && c.includes("testing") && c.includes("ai api") && c.includes("tối ưu");
    },
    practiceType: "interactive",
    miniQuiz: [
      { q: "Để bảo vệ mã nguồn khi refactor tối ưu code, kỹ thuật nào đóng vai trò cốt lõi?", o: ["Viết comments", "Viết Unit Test (Testing)", "Đặt tên class theo BEM", "Băm mật khẩu"], a: 1 }
    ]
  }
];
