export const ULTIMATE_LESSONS = [
  {
    id: "lesson71",
    title: "71. Lập kế hoạch dự án & Phân tích yêu cầu",
    lang: "html",
    file: "src/lesson71.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Chào mừng đến với Chặng 7: Lập trình web nâng cao hướng dẫn 1-1 làm dự án thực chiến tốt nghiệp!
Bài đầu tiên hướng dẫn bạn phân tích yêu cầu đề án tốt nghiệp. Đề án của bạn bắt buộc phải có:
1. Giao diện (Frontend) và logic máy chủ (Backend) đầy đủ.
2. Thiết kế theo lập trình hướng đối tượng (OOP) và giao tiếp qua API.
3. Có tích hợp AI (ví dụ: Chatbot tư vấn, bộ phân loại nội dung).
4. Có phương thức giao tiếp giữa các thành viên (nhắn tin, diễn đàn).
5. Có song ngữ (Việt - Anh hoặc ngôn ngữ khác).
6. Tối thiểu 10 người dùng hoạt động khi nộp dự án.

### BƯỚC THỰC HIỆN
Hãy bắt đầu bằng việc phác thảo sơ đồ tính năng dự án của bạn ra giấy hoặc file tài liệu.

### KIỂM TRA
Đây là chặng tự học hướng dẫn từng bước, hệ thống sẽ tự động xác minh hoàn thành khi bạn xem qua tài liệu hướng dẫn và lưu lại tiến trình.`,
    tasks: ["Xem kỹ tài liệu hướng dẫn lập kế hoạch dự án."],
    starterCode: `<!-- Đã đọc và hiểu tài liệu thiết kế hệ thống -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson72",
    title: "72. Lựa chọn Tech Stack & Thiết kế Kiến trúc",
    lang: "html",
    file: "src/lesson72.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để làm một ứng dụng fullstack, bạn có thể chọn các bộ công nghệ phổ biến:
- MERN Stack: MongoDB (Database) + Express.js (OOP Backend) + React (Frontend) + Node.js.
- LAMP/LNMP Stack: Linux + Nginx + MySQL + PHP (OOP với Class/PDO) + HTML/CSS/JS.
Bạn cần chuẩn bị sẵn môi trường cài đặt Node.js hoặc PHP trên máy của mình.

### BƯỚC THỰC HIỆN
Lựa chọn stack phù hợp và tải các công cụ liên quan (Node.js, XAMPP, hoặc Docker).

### KIỂM TRA
Xem qua hướng dẫn thiết lập stack và tiến hành bước tiếp theo.`,
    tasks: ["Xác định stack và chuẩn bị sẵn môi trường phát triển."],
    starterCode: `<!-- Tech Stack: Node.js + Express + React + MongoDB -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson73",
    title: "73. Khởi tạo Git & Tạo kho lưu trữ trên GitHub",
    lang: "html",
    file: "src/lesson73.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Quản lý phiên bản là bắt buộc cho dự án chuyên nghiệp.
Cách tạo repository:
1. Đăng ký tài khoản trên GitHub.
2. Cài đặt Git trên máy tính cá nhân.
3. Tạo thư mục dự án và chạy các lệnh:
   \`git init\`
   \`git add .\`
   \`git commit -m "initial commit"\`
4. Kết nối local git với GitHub bằng lệnh:
   \`git remote add origin <link_github_cua_ban>\`
   \`git push -u origin main\`

### BƯỚC THỰC HIỆN
Tạo repository trống trên GitHub và liên kết với thư mục dự án cục bộ.

### KIỂM TRA
Đọc kỹ hướng dẫn và tiếp tục.`,
    tasks: ["Khởi tạo git và tạo repo dự án trên GitHub."],
    starterCode: `<!-- Git repository đã được tạo -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson74",
    title: "74. Thiết kế cơ sở dữ liệu quan hệ (Schema Design)",
    lang: "html",
    file: "src/lesson74.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Dự án của bạn cần tối thiểu các bảng (hoặc collection) cơ bản sau:
1. **Users**: Lưu thông tin tài khoản (id, email, password_hash, displayName, language).
2. **Messages / Posts**: Lưu nội dung giao tiếp giữa người dùng (id, sender_id, content, createdAt).
3. **AI_Interactions**: Lưu lịch sử chat hoặc phân tích của AI.

### BƯỚC THỰC HIỆN
Vẽ lược đồ DB hoặc chuẩn bị sẵn các câu lệnh SQL \`CREATE TABLE\` tương ứng.

### KIỂM TRA
Xem lược đồ mẫu DB và chuyển qua bài tiếp theo.`,
    tasks: ["Thiết kế lược đồ cơ sở dữ liệu cho dự án."],
    starterCode: `<!-- Lược đồ DB gồm bảng Users, Messages, AI_Interactions -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson75",
    title: "75. Cấu trúc OOP Backend API",
    lang: "html",
    file: "src/lesson75.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Lập trình hướng đối tượng (OOP) giúp tổ chức code backend sạch sẽ, dễ mở rộng.
Cấu trúc các lớp chính:
- **DatabaseConnection**: Class singleton kết nối DB.
- **UserRepository**: Class xử lý truy vấn dữ liệu người dùng từ database.
- **UserController**: Class điều phối nhận request từ client, gọi Repository và trả về JSON API.

### BƯỚC THỰC HIỆN
Tạo cấu trúc thư mục backend \`controllers/\`, \`models/\`, \`routes/\` và viết các Class tương ứng.

### KIỂM TRA
Đọc hiểu cấu trúc Class OOP và tiến hành bài tiếp theo.`,
    tasks: ["Khởi tạo cấu trúc dự án OOP phía Backend."],
    starterCode: `<!-- Cấu trúc OOP Controller & Model đã sẵn sàng -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson76",
    title: "76. Triển khai API CRUD Cơ bản",
    lang: "html",
    file: "src/lesson76.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
API CRUD (Create, Read, Update, Delete) đóng vai trò xương sống cho việc truyền dữ liệu.
Cách viết các route:
- \`POST /api/users\`: Tạo tài khoản mới.
- \`GET /api/users/:id\`: Lấy chi tiết thông tin người dùng.
- \`PUT /api/users/:id\`: Cập nhật thông tin profile.

### BƯỚC THỰC HIỆN
Sử dụng Express.js hoặc PHP Router để định tuyến các API này, kết nối gọi vào controller OOP đã viết.

### KIỂM TRA
Đọc tài liệu định nghĩa CRUD API và chuyển tiếp.`,
    tasks: ["Hoàn thành các API endpoints CRUD cơ bản cho User."],
    starterCode: `<!-- Triển khai thành công các route CRUD users -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson77",
    title: "77. Triển khai cơ chế xác thực JWT bảo mật",
    lang: "html",
    file: "src/lesson77.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để xác thực danh tính người dùng khi gọi API, chúng ta dùng **JSON Web Token (JWT)**:
1. Khi người dùng gửi đúng email/mật khẩu lên \`POST /api/auth/login\`, backend sinh ra 1 token JWT đã ký bằng khóa bí mật.
2. Backend trả token này về cho client.
3. Client lưu token vào LocalStorage.
4. Mỗi lần gọi API ghi dữ liệu, Client gửi kèm token này ở header: \`Authorization: Bearer <token>\`.
5. Backend có middleware giải mã token để biết người dùng là ai.

### BƯỚC THỰC HIỆN
Cài đặt thư viện JWT (ví dụ \`jsonwebtoken\` trong Node.js) và viết middleware xác thực.

### KIỂM TRA
Tìm hiểu luồng xác thực JWT và chuyển sang bài tiếp theo.`,
    tasks: ["Tích hợp cơ chế bảo mật xác thực JWT ở Backend."],
    starterCode: `<!-- Đã thêm middleware auth JWT -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson78",
    title: "78. Khởi tạo cấu trúc Frontend Client",
    lang: "html",
    file: "src/lesson78.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Chuyển sang phần Frontend. Khởi tạo một dự án sạch sẽ bằng công cụ như Vite:
\`npx create-vite@latest frontend --template react\`
Cấu trúc dự án Frontend nên chia rõ ràng:
- \`src/components\`: Chứa nút bấm, form nhập liệu dùng chung.
- \`src/pages\`: Chứa các trang Login, Register, Chat, Dashboard.
- \`src/hooks\`: Chứa logic gọi API tùy chỉnh.

### BƯỚC THỰC HIỆN
Khởi chạy dự án frontend ở cổng mặc định và kiểm tra trang hiển thị trên trình duyệt.

### KIỂM TRA
Đọc tài liệu cấu trúc thư mục Frontend và tiếp tục.`,
    tasks: ["Tạo dự án React/Vite Frontend mới."],
    starterCode: `<!-- Khởi tạo thành công React frontend qua Vite -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson79",
    title: "79. Xây dựng giao diện Đăng Nhập & Đăng Ký",
    lang: "html",
    file: "src/lesson79.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Giao diện Đăng Nhập / Đăng Ký cần trực quan, dễ dùng.
Các lưu ý thiết kế:
- Kiểm tra tính hợp lệ dữ liệu (Validation) ở client trước khi gửi lên API (email đúng định dạng, mật khẩu tối thiểu 6 ký tự).
- Hiển thị thông báo lỗi rõ ràng nếu API trả về lỗi 400.
- Vô hiệu hóa nút Đăng nhập khi đang gửi request để tránh click trùng lặp.

### BƯỚC THỰC HIỆN
Code form đăng nhập sử dụng thẻ HTML \`<form>\`, xử lý sự kiện \`onSubmit\` ngăn chặn load lại trang mặc định.

### KIỂM TRA
Hoàn thành xem thiết kế form đăng nhập và chuyển tiếp.`,
    tasks: ["Thiết kế và lập trình giao diện Form Login/Register."],
    starterCode: `<!-- Form Đăng nhập & Đăng ký hoạt động ổn định -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson80",
    title: "80. Định tuyến Client-Side & Protected Routes",
    lang: "html",
    file: "src/lesson80.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để chuyển đổi qua lại giữa các trang mà không phải tải lại toàn bộ tài liệu HTML, ta sử dụng định tuyến phía Client (ví dụ: \`react-router-dom\`).
Quan trọng nhất là **Protected Routes (Định tuyến bảo vệ)**:
- Nếu người dùng chưa đăng nhập (không có JWT token lưu ở client), tự động điều hướng họ về trang đăng nhập \`/login\`.
- Ngăn chặn người dùng lạ truy cập trực tiếp trang Chat hay trang nộp bài án tốt nghiệp.

### BƯỚC THỰC HIỆN
Cài đặt thư viện router và bọc các trang bảo mật bằng component check Auth.

### KIỂM TRA
Tìm hiểu cơ chế hoạt động của Protected Routes và chuyển bài.`,
    tasks: ["Cấu hình router chuyển trang và Protected Routes bảo mật."],
    starterCode: `<!-- Protected Routes bảo vệ trang cá nhân thành công -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson81",
    title: "81. Giao thức Fetch API & Xử lý lỗi",
    lang: "html",
    file: "src/lesson81.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Gửi và nhận dữ liệu từ client lên máy chủ thông qua giao thức HTTP bất đồng bộ:
\`\`\`javascript
const response = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify(payload)
});
\`\`\`
Luôn kiểm tra \`response.ok\` và bắt lỗi trong khối \`try...catch\` để tránh việc ứng dụng bị đứng hình nếu server gặp sự cố mất kết nối mạng.

### BƯỚC THỰC HIỆN
Viết một hàm helper tiện ích \`apiCall(url, options)\` tự động đính kèm JWT token từ LocalStorage vào header.

### KIỂM TRA
Xem qua cú pháp gọi API an toàn và chuyển tiếp.`,
    tasks: ["Viết các hàm gọi API tích hợp xử lý ngoại lệ."],
    starterCode: `<!-- Helper apiCall tự động đính kèm token JWT -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson82",
    title: "82. Quản lý trạng thái ứng dụng (State Management)",
    lang: "html",
    file: "src/lesson82.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Khi ứng dụng phình to, việc truyền dữ liệu qua lại giữa các Component bằng prop (prop drilling) trở nên cực kỳ phức tạp.
Giải pháp quản lý trạng thái tập trung:
- Dùng React Context API (Thích hợp cho dự án vừa và nhỏ).
- Dùng các thư viện quản lý state gọn nhẹ như Zustand, hoặc Redux Toolkit cho dự án lớn.
Trạng thái cần quản lý chung bao gồm: Thông tin phiên đăng nhập của User, số dư JOY, cấu hình đa ngôn ngữ hiện tại.

### BƯỚC THỰC HIỆN
Tạo một AuthContext hoặc Zustand store quản lý trạng thái đăng nhập của người dùng toàn cục.

### KIỂM TRA
Tìm hiểu luồng quản lý trạng thái tập trung và tiếp tục.`,
    tasks: ["Triển khai kho lưu trữ thông tin đăng nhập toàn cục."],
    starterCode: `<!-- Zustand Auth Store hoạt động hoàn hảo -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson83",
    title: "83. Thiết lập hệ thống đa ngôn ngữ (i18n)",
    lang: "html",
    file: "src/lesson83.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Đề án tốt nghiệp của bạn bắt buộc phải có chức năng song ngữ (Việt - Anh hoặc một ngôn ngữ tự chọn).
Thư viện khuyên dùng: **react-i18next** (cho React) hoặc tự phát triển bộ từ điển dịch đơn giản dạng key-value.
Cách thức hoạt động:
- Tạo các file tài liệu JSON chứa bản dịch: \`vi.json\`, \`en.json\`.
- Sử dụng hàm \`t('translation_key')\` để hiển thị văn bản theo ngôn ngữ hiện tại.
- Thêm một nút bấm chuyển đổi nhanh ngôn ngữ trên thanh header.

### BƯỚC THỰC HIỆN
Tạo cấu trúc dịch đa ngôn ngữ cho trang chủ của dự án.

### KIỂM TRA
Đọc tài liệu cấu hình i18n và chuyển tiếp bài.`,
    tasks: ["Tích hợp chức năng chuyển đổi song ngữ Việt - Anh."],
    starterCode: `<!-- Đã thêm bộ từ điển song ngữ vi.json và en.json -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson84",
    title: "84. Tối ưu giao diện Responsive đa thiết bị",
    lang: "html",
    file: "src/lesson84.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Ứng dụng của bạn phải hiển thị đẹp mắt trên cả Máy tính để bàn (Desktop) và Điện thoại di động (Mobile).
Quy tắc responsive:
- Sử dụng thẻ meta viewport chuẩn di động.
- Viết CSS Media Queries: \`@media (max-width: 768px) { ... }\`.
- Ưu tiên thiết kế trên di động trước (Mobile-First Design).
- Tránh dùng các kích thước cứng cố định dạng px cho container rộng lớn, hãy dùng %, vw, hoặc auto kết hợp max-width.

### BƯỚC THỰC HIỆN
Kiểm thử giao diện của bạn trên công cụ Responsive Mode của Chrome DevTools để căn chỉnh các cột hiển thị hợp lý.

### KIỂM TRA
Tìm hiểu quy chuẩn Responsive thiết kế giao diện và tiếp tục.`,
    tasks: ["Tối ưu Responsive toàn bộ giao diện dự án tốt nghiệp."],
    starterCode: `<!-- Giao diện hiển thị tốt trên các thiết bị di động -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson85",
    title: "85. Chức năng trò chuyện & Giao tiếp thời gian thực",
    lang: "html",
    file: "src/lesson85.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Yêu cầu bắt buộc: Có phương thức giao tiếp giữa các người dùng với nhau.
Bạn có thể triển khai bằng hai cách:
1. **Real-time Polling**: Client liên tục gọi API lấy tin nhắn mới sau mỗi 3-5 giây. Phù hợp cho giải pháp đơn giản không cần cài đặt hạ tầng phức tạp.
2. **WebSockets (Socket.io)**: Kết nối thời gian thực hai chiều liên tục giữa client và server. Tin nhắn truyền tức thời không có độ trễ.

### BƯỚC THỰC HIỆN
Viết API gửi tin nhắn \`POST /api/messages\` và API lấy tin nhắn \`GET /api/messages?room=default\` để người dùng nhắn tin chung.

### KIỂM TRA
Đọc giải pháp xây dựng tính năng nhắn tin thời gian thực và chuyển tiếp.`,
    tasks: ["Triển khai API và giao diện hộp thoại trò chuyện trực tuyến."],
    starterCode: `<!-- Tính năng chat thời gian thực đã hoàn thành -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson86",
    title: "86. Upload và Hiển thị hình ảnh đa phương thức",
    lang: "html",
    file: "src/lesson86.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để làm cho trang web sống động, ứng dụng cần hỗ trợ đăng ảnh/avatar hoặc tải tệp tin đa phương thức.
Quy trình:
1. Client chọn file qua thẻ \`<input type="file">\`.
2. Frontend đóng gói file vào đối tượng \`FormData\` và gửi request POST lên server.
3. Server nhận file, lưu vào thư mục tĩnh của máy chủ hoặc đẩy lên Cloud (ví dụ: Cloudinary).
4. Lưu đường dẫn link ảnh vào database và trả về URL hiển thị cho Client.

### BƯỚC THỰC HIỆN
Xây dựng chức năng thay đổi ảnh đại diện (avatar) của thành viên.

### KIỂM TRA
Tìm hiểu luồng xử lý upload hình ảnh đa phương thức và tiếp tục.`,
    tasks: ["Tích hợp chức năng upload hình ảnh lên máy chủ."],
    starterCode: `<!-- Hỗ trợ tải ảnh đại diện qua FormData -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson87",
    title: "87. Tích hợp API AI vào logic Hệ thống",
    lang: "html",
    file: "src/lesson87.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Đề án tốt nghiệp bắt buộc phải có tính năng AI.
Ví dụ ứng dụng:
- AI tự động kiểm duyệt bình luận thô tục của người dùng trước khi lưu vào DB.
- AI gắn tag chủ đề (thể thao, công nghệ, âm nhạc) tự động cho bài viết mới.
Backend sẽ đứng vai trò trung gian gọi đến API của Gemini/OpenAI để xử lý và trả kết quả bảo mật về cho Frontend.

### BƯỚC THỰC HIỆN
Cài đặt thư viện AI hoặc viết route kết nối gọi Gemini API để xử lý kiểm duyệt nội dung.

### KIỂM TRA
Đọc hiểu cơ chế tích hợp AI vào quy trình xử lý dữ liệu và tiếp tục.`,
    tasks: ["Kết nối Backend với dịch vụ trí tuệ nhân tạo Gemini API."],
    starterCode: `<!-- Backend đã kết nối thành công với mô hình AI -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson88",
    title: "88. Thiết kế AI Chatbot thông minh hỗ trợ người dùng",
    lang: "html",
    file: "src/lesson88.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Xây dựng một chatbot nhỏ trợ giúp người dùng đặt câu hỏi và nhận câu trả lời tư vấn từ AI ngay trên giao diện web:
- Frontend hiển thị khung chat tương tự như Messenger.
- Người dùng nhập tin nhắn, gửi request POST lên Backend.
- Backend chuyển câu hỏi này cho AI, kèm theo System Instruction định nghĩa vai trò của AI (ví dụ: "Bạn là trợ lý giải đáp về khóa học HugoCoder...").
- Trả về câu trả lời của AI và cập nhật lên màn hình chat.

### BƯỚC THỰC HIỆN
Lập trình giao diện chatbot và tích hợp gọi API trợ lý AI.

### KIỂM TRA
Xem thiết kế chatbot thông minh và chuyển qua bài tiếp theo.`,
    tasks: ["Xây dựng giao diện và kết nối AI Chatbot trên trang web."],
    starterCode: `<!-- Khung Chatbot AI hoạt động hoàn chỉnh -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson89",
    title: "89. Sử dụng AI Structured Outputs tạo dữ liệu chuẩn",
    lang: "html",
    file: "src/lesson89.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để AI trả về dữ liệu định dạng JSON ổn định, ta sử dụng tính năng **Structured Outputs** (ví dụ với thư viện của Google Gen AI hoặc OpenAI):
\`\`\`javascript
const response = await ai.generateContent({
  prompt: 'Hãy phân tích 3 điểm mạnh của thành viên...',
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      strengths: { type: 'array', items: { type: 'string' } }
    }
  }
});
\`\`\`
Mã JSON trả về sẽ khớp chính xác cấu trúc khai báo trên, giúp máy chủ lưu trực tiếp vào cơ sở dữ liệu mà không sợ bị dính lỗi cú pháp văn bản dư thừa.

### BƯỚC THỰC HIỆN
Cấu hình API AI trả về dữ liệu định dạng JSON cấu trúc theo schema quy định.

### KIỂM TRA
Đọc hiểu Structured Outputs và chuyển sang bước tiếp theo.`,
    tasks: ["Thiết lập AI trả kết quả định dạng JSON Schema cấu trúc."],
    starterCode: `<!-- AI trả về JSON chuẩn xác, dễ phân tích -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson90",
    title: "90. Tối ưu tương tác vi mô (Micro-animations)",
    lang: "html",
    file: "src/lesson90.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Các hiệu ứng chuyển động nhỏ (Micro-animations) giúp trang web trông vô cùng cao cấp và mượt mà:
- Hiệu ứng hover phóng to nhẹ hoặc đổi màu nút bấm có chuyển cảnh \`transition-all duration-300\`.
- Trạng thái loading quay tròn khi chờ gửi dữ liệu.
- Hiệu ứng toast trượt vào góc màn hình khi thao tác thành công.
- Cảnh báo lỗi rung lắc nhẹ để thu hút sự chú ý của người dùng.

### BƯỚC THỰC HIỆN
Thêm hiệu ứng chuyển cảnh mượt mà cho toàn bộ các nút bấm và trạng thái hover trên ứng dụng của bạn.

### KIỂM TRA
Xem qua các mẹo thiết kế tương tác mượt mà và tiếp tục.`,
    tasks: ["Bổ sung các hiệu ứng chuyển động vi mô trên giao diện."],
    starterCode: `<!-- CSS transitions đã được áp dụng mượt mà -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson91",
    title: "91. Tối ưu hóa hiệu năng Frontend (Lazy Loading)",
    lang: "html",
    file: "src/lesson91.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Tối ưu hóa tốc độ tải trang phía client:
- **Lazy Loading**: Chỉ tải các ảnh hoặc component nặng khi người dùng cuộn đến chúng. Trong React, dùng \`React.lazy()\` kết hợp \`<Suspense>\` để chia nhỏ bundle code.
- **Nén tài nguyên**: Nén và tối ưu hóa dung lượng hình ảnh (chuyển sang định dạng WebP).
- **Caching**: Lưu trữ các dữ liệu tĩnh ít thay đổi vào LocalStorage để tránh gọi API nhiều lần.

### BƯỚC THỰC HIỆN
Cài đặt lazy load cho các hình ảnh kích thước lớn trong trang tin tức hoặc kho ảnh của dự án.

### KIỂM TRA
Tìm hiểu giải pháp cải thiện LCP/CLS và chuyển bài tiếp theo.`,
    tasks: ["Tối ưu hiệu năng tải trang phía Client-side."],
    starterCode: `<!-- Đã tối ưu hóa dung lượng ảnh và bật lazy load -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson92",
    title: "92. Tối ưu hóa bảo mật API phía Backend",
    lang: "html",
    file: "src/lesson92.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Rà soát và vá mọi lỗ hổng bảo mật trước khi deploy ứng dụng:
- **SQL Injection**: Tuyệt đối không cộng chuỗi SQL thô, sử dụng tham số hóa (Prepared Statements) trong PDO hoặc Mongoose ODM.
- **XSS**: Chạy các hàm làm sạch chuỗi văn bản (sanitize) khi hiển thị nội dung HTML do người dùng tự soạn thảo.
- **Rate Limiting**: Giới hạn số lượng request từ một địa chỉ IP gửi lên API trong 1 phút để chống brute-force và spam.

### BƯỚC THỰC HIỆN
Kiểm thử dữ liệu nhập đầu vào của các form bằng cách thử nhập các ký tự đặc biệt như \`'\` hoặc \`<script>\` để xem ứng dụng có xử lý an toàn hay không.

### KIỂM TRA
Đọc checklist bảo mật API và tiếp tục.`,
    tasks: ["Thực hiện kiểm tra và vá lỗi bảo mật cho máy chủ Backend."],
    starterCode: `<!-- API đã được trang bị chống tấn công SQL injection và XSS -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson93",
    title: "93. Viết Unit Test & Kiểm thử thủ công dự án",
    lang: "html",
    file: "src/lesson93.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Đảm bảo các logic cốt lõi hoạt động hoàn toàn chính xác trước khi chuyển giao sản phẩm:
- Viết 3-5 ca kiểm thử đơn vị (Unit Tests) cho hàm tạo token JWT, hàm băm mật khẩu hoặc hàm tính toán số dư.
- Kiểm thử thủ công: Đóng vai người dùng mới, đăng ký tài khoản, thử gửi tin nhắn chat xem thông tin có bị hiển thị sai lệch hay lỗi hiển thị không.

### BƯỚC THỰC HIỆN
Chạy kiểm thử cục bộ bằng lệnh \`npm run test\` hoặc tự kiểm tra lỗi logic trên giao diện.

### KIỂM TRA
Đọc quy trình kiểm thử toàn diện và chuyển tiếp bài học.`,
    tasks: ["Thực hiện chạy kiểm thử tự động và thủ công toàn dự án."],
    starterCode: `<!-- Toàn bộ test case cốt lõi đã chạy thành công -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson94",
    title: "94. Tạo bộ dữ liệu kiểm thử (Mock Users)",
    lang: "html",
    file: "src/lesson94.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Yêu cầu đề án tốt nghiệp: Có tối thiểu 10 người dùng hoạt động khi nộp dự án.
Để đáp ứng điều này, bạn hãy:
- Viết một script nhỏ seeding dữ liệu tạo sẵn 10 tài khoản người dùng mẫu với các thông tin profile và avatar sống động trong database.
- Gửi link dự án thử nghiệm cho bạn bè đăng ký trải nghiệm thử để ghi nhận tối thiểu 10 người dùng thực tế.

### BƯỚC THỰC HIỆN
Thêm tối thiểu 10 dòng dữ liệu người dùng mẫu sinh động vào bảng Users trong database của bạn.

### KIỂM TRA
Hoàn thành xem hướng dẫn và chuyển bài tiếp theo.`,
    tasks: ["Tạo sẵn cơ sở dữ liệu mẫu chứa tối thiểu 10 người dùng hoạt động."],
    starterCode: `<!-- Cơ sở dữ liệu đã có đủ 10 người dùng mẫu sinh động -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson95",
    title: "95. Đẩy toàn bộ mã nguồn lên GitHub",
    lang: "html",
    file: "src/lesson95.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Cập nhật toàn bộ mã nguồn sạch sẽ lên GitHub repository công khai:
- Tạo tệp \`.gitignore\` để bỏ qua các thư mục nặng như \`node_modules/\` hay các file chứa khóa bí mật bảo mật hệ thống như \`.env\`.
- Viết file \`README.md\` chi tiết hướng dẫn cài đặt chạy thử dự án ở local.
- Commit và đẩy toàn bộ lên nhánh \`main\`.

### BƯỚC THỰC HIỆN
Chạy các lệnh:
\`git status\` (kiểm tra file rác)
\`git add .\`
\`git commit -m "feat: complete web project core"\`
\`git push origin main\`

### KIỂM TRA
Đọc kỹ lưu ý bảo mật tệp .gitignore và tiếp tục.`,
    tasks: ["Hoàn tất đẩy toàn bộ mã nguồn sạch lên GitHub."],
    starterCode: `<!-- Repository GitHub đã cập nhật bản code mới nhất -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson96",
    title: "96. Thuê và Thiết lập Máy chủ ảo VPS",
    lang: "html",
    file: "src/lesson96.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Để trang web của bạn chạy online vĩnh viễn cho tất cả mọi người truy cập, bạn cần đưa ứng dụng lên máy chủ VPS (Virtual Private Server).
Các dịch vụ cung cấp VPS tốt nhất:
- DigitalOcean, Linode, AWS, Google Cloud, hoặc các nhà cung cấp trong nước.
- Chọn hệ điều hành Linux (khuyên dùng **Ubuntu Server LTS**).
Cách kết nối vào máy chủ qua cổng terminal SSH:
\`ssh root@<địa_chỉ_ip_vps_của_bạn>\`

### BƯỚC THỰC HIỆN
Sở hữu một VPS trống và kết nối SSH thành công vào giao diện dòng lệnh Linux của máy chủ.

### KIỂM TRA
Tìm hiểu cách kết nối máy chủ Linux qua SSH và chuyển bài.`,
    tasks: ["Thuê VPS chạy hệ điều hành Ubuntu Server và kết nối qua SSH."],
    starterCode: `<!-- Kết nối SSH vào VPS Linux thành công -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson97",
    title: "97. Cài đặt Node.js / PHP và Database trên VPS",
    lang: "html",
    file: "src/lesson97.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Sau khi kết nối vào VPS, bạn cần cài đặt môi trường chạy tương thích:
1. Cập nhật hệ thống: \`sudo apt update && sudo apt upgrade\`
2. Cài đặt Node.js (nếu dùng backend Node):
   \`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\`
   \`sudo apt-get install -y nodejs\`
3. Cài đặt và cấu hình hệ quản trị CSDL (ví dụ MySQL Server hoặc MongoDB):
   \`sudo apt install mysql-server\`
   \`sudo mysql_secure_installation\`

### BƯỚC THỰC HIỆN
Cài đặt thành công môi trường Node.js và hệ quản trị DB tương ứng trên VPS Linux.

### KIỂM TRA
Xem hướng dẫn setup môi trường máy chủ và tiếp tục.`,
    tasks: ["Cài đặt môi trường runtime và cơ sở dữ liệu trên máy chủ Linux."],
    starterCode: `<!-- Môi trường Node.js và MySQL đã được cài đặt thành công -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson98",
    title: "98. Cấu hình Web Server Nginx & SSL HTTPS",
    lang: "html",
    file: "src/lesson98.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Đưa ứng dụng ra môi trường mạng an toàn:
1. Cài đặt **Nginx** làm Reverse Proxy để chuyển hướng request từ cổng 80/443 vào cổng chạy của backend Node (ví dụ cổng 3000):
   \`sudo apt install nginx\`
2. Trỏ tên miền (Domain) của bạn về địa chỉ IP của VPS.
3. Cấu hình file block server Nginx chuyển tiếp request.
4. Cài đặt chứng chỉ bảo mật HTTPS SSL miễn phí qua công cụ **Certbot (Let's Encrypt)**:
   \`sudo apt install certbot python3-certbot-nginx\`
   \`sudo certbot --nginx -d tenmien.com\`

### BƯỚC THỰC HIỆN
Cấu hình xong Nginx và kích hoạt HTTPS bảo mật SSL cho tên miền dự án.

### KIỂM TRA
Xem hướng dẫn cài đặt SSL HTTPS trên máy chủ và tiếp tục.`,
    tasks: ["Thiết lập Nginx làm Reverse Proxy và cài đặt SSL Let's Encrypt."],
    starterCode: `<!-- Trang web đã kích hoạt ổ khóa xanh HTTPS bảo mật -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson99",
    title: "99. Kiểm thử Production & Rà soát checklist cuối",
    lang: "html",
    file: "src/lesson99.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Trước khi chính thức nộp link dự án để Hugo Studio phê duyệt cấp chứng nhận, hãy rà soát kỹ lưỡng danh mục kiểm tra:
1. Trang web chạy online qua giao thức HTTPS ổn định không bị lỗi broken?
2. Có đủ chức năng chat/giao tiếp giữa các thành viên?
3. Tính năng AI hoạt động mượt mà không crash?
4. Đã có đủ ít nhất 10 người dùng mẫu hoạt động?
5. Chức năng dịch song ngữ hoạt động trơn tru?
6. Cơ sở dữ liệu và mật khẩu có bị phơi bày thô?

### BƯỚC THỰC HIỆN
Mở trình duyệt điện thoại và máy tính, truy cập trực tiếp tên miền chạy online thực tế của dự án để thử nghiệm mọi tính năng như một người dùng cuối thực sự.

### KIỂM TRA
Rà soát thành công toàn bộ checklist và chuyển sang trang nộp dự án tốt nghiệp!`,
    tasks: ["Rà soát toàn bộ checklist kỹ thuật môi trường chạy thực tế."],
    starterCode: `<!-- Checklist kiểm tra cuối cùng đã hoàn tất an toàn -->`,
    verify: (code) => true,
    practiceType: "document"
  },
  {
    id: "lesson100",
    title: "100. Nộp Đề Án Tốt Nghiệp HugoCoder",
    lang: "html",
    file: "src/lesson100.html",
    theory: `### LÝ THUYẾT & HƯỚNG DẪN CHI TIẾT
Chúc mừng bạn đã xuất sắc đi đến bài học cuối cùng trong lộ trình lập trình viên cao cấp!
Đây là nơi để bạn nộp link sản phẩm hoàn thiện nhất của mình để Hugo Studio kiểm duyệt và trao chứng nhận kết thúc chặng.

### YÊU CẦU DỰ ÁN KHI NỘP:
1. **Mã nguồn**: Lập trình hướng đối tượng (OOP), có API kết nối.
2. **AI**: Tích hợp trí tuệ nhân tạo (Chatbot hoặc tác vụ xử lý thông minh).
3. **Fullstack**: Có đầy đủ cả giao diện frontend và cơ sở dữ liệu backend.
4. **Cộng đồng**: Tối thiểu 10 người dùng hoạt động khi nộp dự án và có tính năng chat tương tác giữa các thành viên.
5. **Đa ngôn ngữ**: Song ngữ (Tiếng Việt và một ngôn ngữ tự chọn).

### CÁCH THỨC ĐÁNH GIÁ:
- Sau khi bạn gửi link dự án bên dưới, trạng thái sẽ chuyển thành **Đang chờ duyệt (Pending)**.
- Quản trị viên Hugo Studio sẽ truy cập thử nghiệm dự án của bạn để đánh giá.
- Nếu đạt yêu cầu, Admin sẽ phê duyệt xác nhận hoàn thành khóa học, bạn sẽ nhận được **4000 JOY** thưởng cùng đường link tải **Giấy xác nhận tốt nghiệp** chính thức của Hugo Studio kèm theo một phần quà VVIP bí mật!
- Nếu chưa đạt yêu cầu, Admin sẽ đính kèm lời khuyên sửa đổi, bạn có thể chỉnh sửa mã nguồn và gửi lại bất kỳ lúc nào.`,
    tasks: ["Nộp link dự án online và chờ quản trị viên Hugo Studio kiểm duyệt."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "graduation_submission"
  }
];
