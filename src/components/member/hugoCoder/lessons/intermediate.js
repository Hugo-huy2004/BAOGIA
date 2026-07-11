// ============================================================
// CHẶNG 2 — TƯ DUY KIẾN TRÚC & TIÊU CHUẨN PHÁN ĐOÁN (Bài 11-25)
// Trọng tâm: thoát ly code thô, chuyển sang tư duy hệ thống và
// tổ chức mã nguồn theo mô hình chuẩn nghề nghiệp.
// ============================================================
export const INTERMEDIATE_LESSONS = [
  {
    id: "lesson11",
    title: "11. Thiết kế CSDL quan hệ (Schema Design) & Table Join",
    lang: "sql",
    file: "src/lesson11.sql",
    duration: "50 phút",
    overview: {
      description: "Từ gõ lệnh đơn lẻ sang tư duy thiết kế: chia dữ liệu thành nhiều bảng liên kết bằng khóa ngoại và gộp lại bằng JOIN — nền móng của mọi hệ thống có dữ liệu thật.",
      outcomes: [
        "Thiết kế 2 bảng quan hệ users – orders với khóa chính/khóa ngoại",
        "Viết INNER JOIN gộp dữ liệu 2 bảng qua khóa liên kết",
        "Phân biệt INNER JOIN và LEFT JOIN qua kết quả trả về"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo nguyên tắc **chuẩn hóa dữ liệu (Normalization)**: không lặp thông tin — tách thành nhiều bảng liên kết:

> **Primary Key (khóa chính)** — định danh duy nhất mỗi dòng (id).
> **Foreign Key (khóa ngoại)** — cột trỏ sang khóa chính bảng khác (orders.user_id → users.id).

Gộp dữ liệu bằng phép nối:

\`\`\`sql
SELECT orders.id, users.name
FROM orders
INNER JOIN users ON orders.user_id = users.id;
\`\`\`

> **INNER JOIN** — chỉ trả các dòng khớp ở CẢ HAI bảng.
> **LEFT JOIN** — trả đủ mọi dòng bảng trái, bảng phải không khớp thì NULL.`,
    labSteps: [
      "Mở src/lesson11.sql — bạn thiết kế từ đầu bằng CREATE TABLE.",
      "Tạo bảng users (id INT PRIMARY KEY, name VARCHAR(100)).",
      "Tạo bảng orders (id, user_id INT, total INT) — user_id chính là khóa ngoại trỏ về users.id.",
      "Viết INNER JOIN lấy mã đơn kèm tên người đặt: FROM orders INNER JOIN users ON orders.user_id = users.id.",
      "Đổi INNER thành LEFT JOIN, hình dung khác biệt: đơn 'mồ côi' (user đã xoá) vẫn hiện với tên NULL."
    ],
    commonMistakes: [
      { symptom: "Lưu thẳng tên + sđt khách vào từng đơn hàng, sửa tên phải sửa 50 chỗ.", cause: "Chưa chuẩn hóa — dữ liệu lặp.", fix: "Tách bảng users riêng, orders chỉ giữ user_id trỏ sang." },
      { symptom: "JOIN trả về số dòng nhân bản khổng lồ.", cause: "Thiếu điều kiện ON hoặc ON sai cột (tích Descartes).", fix: "Luôn có ON bảng_A.khóa_ngoại = bảng_B.khóa_chính." },
      { symptom: "Đơn hàng của user đã xoá biến mất khỏi báo cáo.", cause: "Dùng INNER JOIN nên dòng không khớp bị loại.", fix: "Báo cáo cần đủ dòng bảng trái → dùng LEFT JOIN." }
    ],
    challenge: "Thêm bảng products và bảng order_items (order_id, product_id, quantity) rồi viết câu JOIN 3 bảng lấy: mã đơn, tên khách, tên sản phẩm.",
    checklist: [
      "Giải thích được khóa chính vs khóa ngoại bằng ví dụ của mình",
      "Viết JOIN 2 bảng không nhìn mẫu",
      "Nêu được tình huống phải dùng LEFT JOIN thay INNER JOIN"
    ],
    tasks: [
      "CREATE TABLE users và orders với khóa ngoại user_id.",
      "Viết truy vấn INNER JOIN gộp orders với users qua user_id."
    ],
    starterCode: `-- BÀI 11: Thiết kế schema & JOIN
-- TODO 1: CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
-- TODO 2: CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, total INT);
-- TODO 3: INNER JOIN lấy orders.id kèm users.name
`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("CREATE TABLE") && c.includes("PRIMARY KEY") && c.includes("JOIN") && c.includes(" ON ") && c.includes("USER_ID");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Điền từ khóa gộp hai bảng CHỈ lấy các dòng khớp ở cả hai bên:",
      snippet: "SELECT * FROM orders [ ... ] users ON orders.user_id = users.id;",
      options: [
        { text: "INNER JOIN", correct: true },
        { text: "UNION", correct: false },
        { text: "MERGE", correct: false },
        { text: "LEFT WHERE", correct: false }
      ],
      correctIdx: 0
    },
    miniQuiz: [
      { q: "Khóa liên kết hai bảng dữ liệu gọi là gì?", o: ["Primary Key", "Foreign Key (khóa ngoại)", "Unique Key", "Index"], a: 1 },
      { q: "INNER JOIN trả về những dòng nào?", o: ["Mọi dòng cả 2 bảng", "Chỉ dòng có giá trị khớp ở cả hai bảng", "Chỉ bảng trái", "Dòng NULL"], a: 1 },
      { q: "Vì sao phải tách bảng users riêng khỏi orders?", o: ["Cho đẹp", "Tránh lặp dữ liệu — sửa một nơi, đúng mọi nơi (chuẩn hóa)", "SQL bắt buộc", "Tiết kiệm RAM"], a: 1 },
      { q: "LEFT JOIN khác INNER JOIN thế nào?", o: ["Không khác", "Giữ đủ mọi dòng bảng trái, phải không khớp thì NULL", "Chạy nhanh hơn", "Chỉ dùng cho 3 bảng"], a: 1 }
    ]
  },
  {
    id: "lesson12",
    title: "12. Giao dịch dữ liệu (Transactions) & Quy tắc ACID",
    lang: "sql",
    file: "src/lesson12.sql",
    duration: "40 phút",
    overview: {
      description: "Tư duy 'tất cả hoặc không gì cả': gói nhiều lệnh thành một giao dịch nguyên tử — thứ giúp tiền không bao giờ 'bốc hơi' giữa chừng khi chuyển khoản.",
      outcomes: [
        "Viết luồng START TRANSACTION → UPDATE → COMMIT/ROLLBACK",
        "Thuộc 4 chữ ACID và ý nghĩa từng tính chất",
        "Nhận diện nghiệp vụ nào bắt buộc dùng transaction"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Transaction** là chuỗi thao tác được thực thi như MỘT đơn vị duy nhất, tuân thủ **ACID**:

> **A**tomicity — nguyên tử: hoặc tất cả thành công, hoặc hoàn tác toàn bộ.
> **C**onsistency — nhất quán: dữ liệu luôn hợp lệ trước và sau giao dịch.
> **I**solation — cô lập: các giao dịch song song không giẫm chân nhau.
> **D**urability — bền vững: đã COMMIT là không mất kể cả sập điện.

\`\`\`sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- hoặc ROLLBACK; nếu có lỗi giữa chừng
\`\`\``,
    labSteps: [
      "Mở src/lesson12.sql — mô phỏng chuyển 100 JOY từ tài khoản 1 sang tài khoản 2.",
      "Gõ START TRANSACTION; mở đầu.",
      "Gõ 2 lệnh UPDATE: trừ bên gửi, cộng bên nhận — cả hai đều phải có WHERE.",
      "Kết thúc bằng COMMIT; và viết thêm dòng chú thích khi nào dùng ROLLBACK.",
      "Tự hỏi: nếu lệnh trừ chạy xong mà server sập trước lệnh cộng — không có transaction thì chuyện gì xảy ra?"
    ],
    commonMistakes: [
      { symptom: "Tiền bị trừ bên A nhưng không cộng bên B khi có lỗi giữa chừng.", cause: "Hai lệnh UPDATE chạy rời rạc, không nằm trong transaction.", fix: "Bọc cả hai trong START TRANSACTION ... COMMIT, lỗi thì ROLLBACK." },
      { symptom: "Chạy xong quên COMMIT, kết nối khác không thấy dữ liệu mới.", cause: "Transaction chưa được xác nhận nên thay đổi chỉ tồn tại trong phiên hiện tại.", fix: "Luôn kết thúc rõ ràng bằng COMMIT hoặc ROLLBACK." }
    ],
    challenge: "Viết transaction 'đặt hàng': trừ tồn kho products, thêm dòng orders, cộng điểm thưởng users — 3 lệnh trong 1 giao dịch.",
    checklist: [
      "Đọc thuộc 4 chữ ACID kèm ý nghĩa",
      "Viết được khối transaction chuyển quỹ không nhìn mẫu",
      "Nêu 2 nghiệp vụ thực tế bắt buộc dùng transaction"
    ],
    tasks: ["Viết luồng transaction chuyển quỹ đủ START TRANSACTION, 2 UPDATE có WHERE, COMMIT và chú thích ROLLBACK."],
    starterCode: `-- BÀI 12: Transaction chuyển 100 JOY từ tài khoản 1 sang 2
-- TODO: START TRANSACTION; -> UPDATE trừ -> UPDATE cộng -> COMMIT;
-- Ghi chú thêm: khi nào dùng ROLLBACK?
`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("START TRANSACTION") && (c.match(/UPDATE/g) || []).length >= 2 && c.includes("WHERE") && c.includes("COMMIT") && c.includes("ROLLBACK");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Điền lệnh HOÀN TÁC toàn bộ thay đổi khi giao dịch gặp lỗi giữa chừng:",
      snippet: "START TRANSACTION; UPDATE ...; -- lỗi! => [ ... ];",
      options: [
        { text: "COMMIT", correct: false },
        { text: "ROLLBACK", correct: true },
        { text: "RESET", correct: false },
        { text: "UNDO", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Chữ 'A' trong ACID nghĩa là gì?", o: ["Atomicity — tất cả hoặc không gì cả", "Access", "Authority", "Array"], a: 0 },
      { q: "Lệnh nào hủy mọi thay đổi trong transaction?", o: ["COMMIT", "ROLLBACK", "DELETE", "CANCEL"], a: 1 },
      { q: "Tính Durability đảm bảo điều gì?", o: ["Chạy nhanh", "Dữ liệu đã COMMIT không mất kể cả sập điện", "Không cần backup", "Tự sửa lỗi"], a: 1 },
      { q: "Nghiệp vụ nào BẮT BUỘC dùng transaction?", o: ["Đọc danh sách sản phẩm", "Chuyển tiền giữa hai tài khoản", "Xem trang chủ", "Đổi màu giao diện"], a: 1 }
    ]
  },
  {
    id: "lesson13",
    title: "13. Kiến trúc file lập trình & Mô hình MVC",
    lang: "php",
    file: "src/lesson13.php",
    duration: "45 phút",
    overview: {
      description: "Thoát khỏi 'một file ngàn dòng': chia ứng dụng thành Model – View – Controller, mô hình tổ chức mã nguồn phổ biến nhất của các framework chuyên nghiệp.",
      outcomes: [
        "Nêu đúng vai trò từng lớp Model / View / Controller",
        "Tự dựng khung 3 class MVC bằng PHP thuần",
        "Chỉ ra luồng chạy: Request → Controller → Model → View"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**MVC** chia ứng dụng thành 3 tầng trách nhiệm rõ ràng:

> **Model** — quản trị dữ liệu, nói chuyện với database.
> **View** — hiển thị giao diện, không chứa logic nghiệp vụ.
> **Controller** — nhận request, điều phối Model lấy dữ liệu rồi đưa cho View vẽ.

Luồng chạy chuẩn: Người dùng gửi request → **Controller** tiếp nhận → gọi **Model** truy dữ liệu → trả về **View** kết xuất HTML.

Lợi ích: file không phình ngàn dòng, viết unit test được từng tầng, nhiều người code song song không giẫm nhau — lý do Laravel, Rails, Spring đều xây trên tư duy này.`,
    labSteps: [
      "Mở src/lesson13.php — dựng 3 class từ đầu.",
      "class UserModel: phương thức getData() trả mảng ['name' => 'Hugo'] — giả lập tầng dữ liệu.",
      "class UserView: phương thức render($data) echo ra 'User: ' . $data['name'] — chỉ hiển thị, không truy dữ liệu.",
      "class UserController: phương thức handle() new Model + new View, nối hai tầng: $view->render($model->getData()).",
      "Cuối file: (new UserController())->handle(); chạy thử — đọc lại và chỉ tay theo luồng Controller → Model → View."
    ],
    commonMistakes: [
      { symptom: "Viết câu SQL ngay trong file giao diện HTML.", cause: "Trộn tầng View với tầng Model — sửa giao diện dễ làm hỏng truy vấn.", fix: "SQL chỉ nằm trong Model; View chỉ nhận dữ liệu đã sẵn để hiển thị." },
      { symptom: "Controller phình to chứa cả nghìn dòng logic.", cause: "Nhét mọi xử lý vào Controller (fat controller).", fix: "Controller chỉ điều phối; logic dữ liệu đẩy về Model, hiển thị đẩy về View." },
      { symptom: "Lỗi Class not found khi chạy.", cause: "Gọi class trước khi khai báo hoặc sai tên hoa/thường.", fix: "PHP đọc từ trên xuống: khai báo đủ 3 class rồi mới khởi tạo; tên class phải khớp chính xác." }
    ],
    challenge: "Thêm ProductModel + ProductView hiển thị danh sách 3 sản phẩm dạng <ul> — Controller gọi cả hai cặp Model/View trong cùng handle().",
    checklist: [
      "Vẽ/nói được luồng Request → Controller → Model → View",
      "3 class đúng vai trò, không lấn tầng của nhau",
      "Giải thích được vì sao MVC dễ test và dễ làm việc nhóm"
    ],
    tasks: ["Dựng đủ 3 class UserModel, UserView, UserController nối đúng luồng MVC."],
    starterCode: `<?php
// BÀI 13: Dựng khung MVC bằng PHP thuần
// TODO 1: class UserModel { getData() trả ["name" => "Hugo"] }
// TODO 2: class UserView { render($data) echo "User: " . $data['name'] }
// TODO 3: class UserController { handle() nối Model -> View }
// TODO 4: (new UserController())->handle();
?>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("class usermodel") && c.includes("class userview") && c.includes("class usercontroller") && c.includes("render(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Trong MVC, tầng nào là NƠI DUY NHẤT được nói chuyện trực tiếp với database?",
      snippet: "Request → Controller → [ ... ] → View",
      options: [
        { text: "View", correct: false },
        { text: "Model", correct: true },
        { text: "Router", correct: false },
        { text: "Template", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "MVC viết tắt của gì?", o: ["Model View Controller", "Modern Variable Class", "Main View Code", "Manage Version Control"], a: 0 },
      { q: "Tầng nào giao tiếp trực tiếp với database?", o: ["View", "Controller", "Model", "Cả ba"], a: 2 },
      { q: "Controller có nhiệm vụ gì?", o: ["Vẽ HTML", "Nhận request, điều phối Model và View", "Lưu dữ liệu", "Viết CSS"], a: 1 },
      { q: "Lợi ích lớn nhất của việc tách tầng MVC?", o: ["Chạy nhanh hơn", "Dễ bảo trì, dễ test, nhiều người code song song", "Ít file hơn", "Không cần database"], a: 1 }
    ]
  },
  {
    id: "lesson14",
    title: "14. Kiến trúc RESTful API & HTTP Methods tiêu chuẩn",
    lang: "javascript",
    file: "src/lesson14.js",
    duration: "45 phút",
    overview: {
      description: "Chuẩn giao tiếp giữa mọi frontend và backend hiện đại: thiết kế endpoint theo tài nguyên và dùng đúng động từ HTTP — GET, POST, PUT, DELETE.",
      outcomes: [
        "Ánh xạ đúng 4 phương thức HTTP với 4 thao tác CRUD",
        "Đọc hiểu mã trạng thái 200/201/400/404/500",
        "Viết fetch() gửi POST kèm body JSON chuẩn"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**REST** (Representational State Transfer) thiết kế API quanh **tài nguyên** (danh từ) + **động từ HTTP**:

> GET \`/api/orders\` — lấy danh sách • GET \`/api/orders/12\` — lấy chi tiết
> POST \`/api/orders\` — tạo mới • PUT \`/api/orders/12\` — cập nhật • DELETE \`/api/orders/12\` — xoá

Mã trạng thái chuẩn: **200** OK • **201** Created • **400** dữ liệu gửi sai • **401** chưa xác thực • **404** không tồn tại • **500** lỗi server.

Gửi dữ liệu từ frontend bằng \`fetch()\`:
\`\`\`javascript
fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId: 5, quantity: 2 })
});
\`\`\``,
    labSteps: [
      "Mở src/lesson14.js — viết lời gọi API tạo bản ghi tiến trình học.",
      "Gõ fetch(\"/api/learn-progress\", { ... }) với method: \"POST\".",
      "Thêm headers: { \"Content-Type\": \"application/json\" } — báo server body là JSON.",
      "Body: JSON.stringify({ lessonId: \"lesson14\", status: \"completed\" }) — object phải qua stringify.",
      "Viết chú thích ánh xạ: GET đọc / POST tạo / PUT sửa / DELETE xoá — gõ lại bảng này 2 lần cho thuộc."
    ],
    commonMistakes: [
      { symptom: "Server nhận body rỗng dù đã gửi object.", cause: "Truyền object thẳng vào body mà không JSON.stringify, hoặc thiếu header Content-Type.", fix: "body: JSON.stringify(obj) và headers Content-Type: application/json luôn đi cùng nhau." },
      { symptom: "Dùng GET để xoá dữ liệu (/api/delete-user?id=3).", cause: "Chưa tư duy REST — GET chỉ để đọc, không được gây thay đổi.", fix: "Xoá dùng DELETE /api/users/3; mọi thao tác ghi dùng POST/PUT/DELETE." },
      { symptom: "API trả 200 kèm { error: '...' } khi lỗi.", cause: "Không dùng mã trạng thái chuẩn khiến client khó bắt lỗi.", fix: "Lỗi dữ liệu trả 400, không tìm thấy trả 404 — mã đúng với bản chất." }
    ],
    challenge: "Viết đủ 4 lời gọi fetch cho tài nguyên /api/products: GET danh sách, POST tạo mới, PUT sửa id=1, DELETE id=1.",
    checklist: [
      "Đọc endpoint bất kỳ nói ngay được nó làm gì",
      "Thuộc bảng ánh xạ HTTP method ↔ CRUD",
      "Nhớ cặp bất ly thân: Content-Type + JSON.stringify"
    ],
    tasks: ["Viết fetch POST lên /api/learn-progress với headers JSON và body JSON.stringify."],
    starterCode: `// BÀI 14: Gọi RESTful API chuẩn
// TODO: fetch("/api/learn-progress", { method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ lessonId: "lesson14", status: "completed" }) })
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("fetch(") && (c.includes('method:"post"') || c.includes("method:'post'")) && c.includes("json.stringify(") && c.includes("content-type");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn phương thức HTTP đúng để TẠO MỚI một tài nguyên trên server:",
      snippet: "fetch('/api/orders', { method: '[ ... ]', body: JSON.stringify(...) })",
      options: [
        { text: "GET", correct: false },
        { text: "POST", correct: true },
        { text: "PUT", correct: false },
        { text: "DELETE", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Phương thức nào chỉ dùng để ĐỌC dữ liệu?", o: ["POST", "GET", "PUT", "DELETE"], a: 1 },
      { q: "Mã trạng thái 400 nghĩa là gì?", o: ["Thành công", "Dữ liệu client gửi lên sai/thiếu", "Server sập", "Chuyển hướng"], a: 1 },
      { q: "Vì sao body phải qua JSON.stringify?", o: ["Cho ngắn", "fetch chỉ gửi được chuỗi/bytes, phải chuyển object thành chuỗi JSON", "Để mã hóa bảo mật", "Không cần thiết"], a: 1 },
      { q: "Endpoint REST chuẩn để xoá đơn hàng 12?", o: ["GET /api/delete?id=12", "DELETE /api/orders/12", "POST /api/orders/remove/12", "PUT /api/orders?del=12"], a: 1 }
    ]
  },
  {
    id: "lesson15",
    title: "15. JSON & Quy tắc làm sạch dữ liệu đầu vào",
    lang: "php",
    file: "src/lesson15.php",
    duration: "45 phút",
    overview: {
      description: "JSON là ngôn ngữ chung của frontend–backend, và mọi dữ liệu từ ngoài vào đều phải qua cửa kiểm soát: Never trust user input.",
      outcomes: [
        "Chuyển đổi hai chiều JSON ↔ mảng PHP bằng json_decode/json_encode",
        "Kiểm tra email hợp lệ bằng filter_var + FILTER_VALIDATE_EMAIL",
        "Nắm nguyên tắc: validate ở backend là bắt buộc, frontend chỉ để trải nghiệm"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**JSON** (JavaScript Object Notation) — định dạng trao đổi dữ liệu dạng key-value:

\`\`\`php
$data = json_decode($rawJson, true);  // chuỗi JSON -> mảng PHP
echo json_encode($data);              // mảng PHP -> chuỗi JSON
\`\`\`

**Never trust user input** — nguyên tắc bảo mật số 1: mọi dữ liệu client gửi lên đều có thể bị giả mạo, backend bắt buộc:
> **Validation** — kiểm tra định dạng: \`filter_var($email, FILTER_VALIDATE_EMAIL)\`.
> **Sanitization** — làm sạch ký tự nguy hiểm trước khi lưu/hiển thị.

Validate ở frontend chỉ giúp trải nghiệm nhanh; kẻ xấu gọi thẳng API bỏ qua giao diện — nên tầng backend mới là chốt chặn thật.`,
    labSteps: [
      "Mở src/lesson15.php — mô phỏng API nhận JSON đăng ký.",
      "Cho chuỗi $rawJson = '{\"name\": \"Hugo\", \"email\": \"hugo@studio.vn\"}' — json_decode(..., true) thành mảng.",
      "Lấy $email từ mảng, kiểm tra bằng filter_var($email, FILTER_VALIDATE_EMAIL).",
      "Hợp lệ: echo json_encode(['status' => 'ok']); sai: echo json_encode(['error' => 'Email không hợp lệ']).",
      "Thử đổi email thành 'abc@@xyz' chạy lại — cửa kiểm soát phải chặn được."
    ],
    commonMistakes: [
      { symptom: "json_decode xong truy cập $data->name báo lỗi trên mảng.", cause: "Thiếu tham số true nên kết quả là object, hoặc ngược lại.", fix: "json_decode($json, true) trả mảng — truy cập $data['name']." },
      { symptom: "Nghĩ rằng form đã có required nên backend khỏi kiểm tra.", cause: "Nhầm vai trò 2 tầng validate.", fix: "Kẻ xấu gọi API trực tiếp không qua form — backend luôn phải validate lại." },
      { symptom: "Tự viết regex kiểm tra email dài dòng mà vẫn sót case.", cause: "Phát minh lại bánh xe.", fix: "PHP có sẵn filter_var + FILTER_VALIDATE_EMAIL — chuẩn và đã được kiểm chứng." }
    ],
    challenge: "Mở rộng cửa kiểm soát: kiểm tra thêm name (không rỗng, tối đa 50 ký tự) và age (là số, 13–120) — sai trường nào báo đúng trường đó.",
    checklist: [
      "Chuyển đổi hai chiều JSON ↔ mảng PHP không nhìn mẫu",
      "Thuộc câu thần chú: Never trust user input",
      "Giải thích được vì sao validate frontend là chưa đủ"
    ],
    tasks: [
      "Giải mã JSON bằng json_decode và mã hóa lại bằng json_encode.",
      "Kiểm tra email bằng filter_var với FILTER_VALIDATE_EMAIL."
    ],
    starterCode: `<?php
// BÀI 15: JSON + cửa kiểm soát dữ liệu đầu vào
$rawJson = '{"name": "Hugo", "email": "hugo@studio.vn"}';
// TODO 1: json_decode thành mảng
// TODO 2: filter_var kiểm tra FILTER_VALIDATE_EMAIL
// TODO 3: echo json_encode kết quả ok / error
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("json_decode(") && c.includes("json_encode(") && c.includes("filter_var(") && c.includes("FILTER_VALIDATE_EMAIL");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn hàm PHP chuẩn để kiểm tra email hợp lệ:",
      snippet: "if ([ ... ]($email, FILTER_VALIDATE_EMAIL)) { ... }",
      options: [
        { text: "preg_match", correct: false },
        { text: "filter_var", correct: true },
        { text: "check_email", correct: false },
        { text: "htmlspecialchars", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "json_decode($json, true) trả về gì?", o: ["Object", "Mảng PHP", "Chuỗi", "Số"], a: 1 },
      { q: "Vì sao phải validate ở cả backend dù frontend đã có?", o: ["Cho chắc gấp đôi", "Kẻ xấu có thể gọi API trực tiếp bỏ qua giao diện", "Backend nhanh hơn", "Không cần thiết"], a: 1 },
      { q: "Dữ liệu JSON của một object bọc bằng cặp dấu nào?", o: ["[ ]", "{ }", "( )", "< >"], a: 1 },
      { q: "Validation khác Sanitization thế nào?", o: ["Giống nhau", "Validation kiểm tra hợp lệ; Sanitization loại bỏ/làm sạch ký tự nguy hiểm", "Sanitization chỉ ở frontend", "Validation chỉ cho số"], a: 1 }
    ]
  },
  {
    id: "lesson16",
    title: "16. Quy tắc UI/UX: Độ tương phản & Typography hệ thống",
    lang: "css",
    file: "src/lesson16.css",
    duration: "40 phút",
    overview: {
      description: "Phán đoán giao diện bằng tiêu chuẩn thay vì cảm tính: hệ phân cấp chữ và độ tương phản WCAG — thứ tách biệt giao diện chuyên nghiệp với giao diện 'tự chế'.",
      outcomes: [
        "Dựng thang typography: kích thước, độ đậm, line-height có hệ thống",
        "Áp chuẩn tương phản WCAG AA 4.5:1 cho văn bản",
        "Dùng đơn vị rem thay px cho chữ để tôn trọng cài đặt người dùng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Typography hệ thống** — chữ có thang bậc, không tuỳ hứng:

> Thang kích thước mẫu: body 1rem (16px) • h3 1.25rem • h2 1.5rem • h1 2rem.
> \`line-height: 1.5–1.7\` cho đoạn văn dài (chuẩn khuyến nghị WCAG).
> \`font-weight\`: 400 thường, 600-700 nhấn mạnh — không lạm dụng đậm toàn trang.

**Tương phản WCAG AA**: văn bản thường tối thiểu **4.5:1**, chữ lớn (≥24px) tối thiểu **3:1**. Chữ xám nhạt #999 trên nền trắng chỉ đạt ~2.8:1 — RỚT chuẩn dù "nhìn cũng được".

Dùng \`rem\` cho font-size: khi người dùng chỉnh cỡ chữ trình duyệt, giao diện phóng theo — px thì trơ ra, vi phạm tiếp cận.`,
    labSteps: [
      "Mở src/lesson16.css — dựng thang chữ cho một trang blog.",
      "Gõ body { font-size: 1rem; line-height: 1.6; color: #1f2937; background-color: #ffffff; }.",
      "Dựng thang tiêu đề: h1 { font-size: 2rem; font-weight: 700; } h2 { font-size: 1.5rem; font-weight: 600; }.",
      "Thêm .text-muted { color: #4b5563; } — xám đậm vừa đủ VẪN đạt 4.5:1 trên nền trắng.",
      "Kiểm chứng cặp màu bằng công cụ WebAIM Contrast Checker (nêu trong resources)."
    ],
    commonMistakes: [
      { symptom: "Chữ phụ đề màu #aaa nhìn 'sang' nhưng người lớn tuổi không đọc nổi.", cause: "Chọn màu theo cảm tính, không đo tương phản.", fix: "Đo bằng contrast checker; văn bản thường phải ≥ 4.5:1 — dùng #4b5563 thay #aaa." },
      { symptom: "Trang có 7 cỡ chữ khác nhau lộn xộn.", cause: "Mỗi chỗ gõ một font-size tuỳ hứng.", fix: "Chốt thang 4-5 cỡ ngay từ đầu và chỉ dùng các bậc trong thang." },
      { symptom: "Người dùng phóng to chữ trình duyệt mà trang không đổi.", cause: "font-size khai báo bằng px cố định.", fix: "Dùng rem — 1rem tự ăn theo cài đặt cỡ chữ gốc của người dùng." }
    ],
    challenge: "Dựng thêm chế độ nền tối: nền #111827, chữ #f9fafb, chữ phụ #9ca3af — tự kiểm mọi cặp vẫn đạt AA.",
    checklist: [
      "Thuộc 2 con số: 4.5:1 (văn bản thường) và 1.5-1.7 (line-height)",
      "Trang chỉ dùng đúng thang cỡ chữ đã chốt",
      "Giải thích được vì sao dùng rem thay px cho chữ"
    ],
    tasks: ["Dựng thang typography: body dùng rem + line-height, h1/h2 có font-size và font-weight, màu chữ đạt tương phản trên nền."],
    starterCode: `/* BÀI 16: Thang typography chuẩn WCAG
TODO: body { font-size 1rem, line-height 1.6, color #1f2937, background #ffffff }
TODO: h1 2rem/700, h2 1.5rem/600
TODO: .text-muted màu xám đậm vẫn đạt 4.5:1 */
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("rem") && c.includes("line-height:") && c.includes("font-weight:") && c.includes("color:");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn line-height chuẩn dễ đọc cho đoạn văn dài theo khuyến nghị WCAG:",
      snippet: "body { font-size: 1rem; line-height: [ ... ]; }",
      options: [
        { text: "1.0", correct: false },
        { text: "1.6", correct: true },
        { text: "3.5", correct: false },
        { text: "0.8", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Tỉ lệ tương phản tối thiểu văn bản thường theo WCAG AA?", o: ["2:1", "3:1", "4.5:1", "7:1"], a: 2 },
      { q: "Thuộc tính nào chỉnh khoảng cách giữa các dòng?", o: ["letter-spacing", "line-height", "word-spacing", "text-indent"], a: 1 },
      { q: "Vì sao dùng rem thay px cho font-size?", o: ["Ngắn hơn", "Tôn trọng cài đặt cỡ chữ của người dùng (tiếp cận)", "Chạy nhanh hơn", "px bị cấm"], a: 1 },
      { q: "Typography 'có hệ thống' nghĩa là gì?", o: ["Dùng nhiều font đẹp", "Cỡ chữ/độ đậm theo thang bậc thống nhất toàn trang", "Chữ càng to càng tốt", "Mỗi trang một kiểu"], a: 1 }
    ]
  },
  {
    id: "lesson17",
    title: "17. Quy tắc UI/UX: Trạng thái & Phản hồi trực quan của UI",
    lang: "html",
    file: "src/lesson17.html",
    duration: "40 phút",
    overview: {
      description: "Giao diện tốt luôn 'trả lời' người dùng: hover, focus, disabled, loading, empty, error — thiếu một trạng thái là người dùng lạc lối một lần.",
      outcomes: [
        "Viết pseudo-class :hover, :focus, :disabled cho nút bấm",
        "Kể đủ 6 trạng thái UI: hover, focus, loading, disabled, empty, error",
        "Hiểu vì sao không được xoá outline khi focus (tiếp cận bàn phím)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Mọi thao tác của người dùng cần phản hồi trong **dưới 100ms** (nghiên cứu Nielsen Norman Group). Bộ trạng thái bắt buộc của một component:

> **:hover** — rê chuột • **:focus** — chọn bằng phím Tab • **:active** — đang nhấn
> **disabled** — không khả dụng • **loading** — đang xử lý • **empty/error** — trống/lỗi

CSS pseudo-class:
\`\`\`css
button:hover { background: #2563eb; }
button:focus-visible { outline: 2px solid #93c5fd; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
\`\`\`

> Quy tắc vàng tiếp cận: **không bao giờ** \`outline: none\` mà không thay bằng chỉ báo focus khác — người dùng bàn phím sẽ mất dấu vị trí đang chọn (vi phạm WCAG 2.4.7).`,
    labSteps: [
      "Mở src/lesson17.html — có một nút 'Gửi bài' chưa có trạng thái nào.",
      "Viết base: button { background:#3b82f6; color:white; padding:10px 20px; border-radius:8px; transition: all 0.2s; }.",
      "Thêm :hover đổi nền đậm hơn #2563eb — rê chuột thấy nút 'phản ứng'.",
      "Thêm :focus (hoặc :focus-visible) với outline 2px màu sáng — bấm Tab kiểm tra vòng focus hiện rõ.",
      "Thêm :disabled với opacity 0.5 + cursor: not-allowed và đặt thuộc tính disabled vào nút thứ hai để so sánh."
    ],
    commonMistakes: [
      { symptom: "Bấm Tab không thấy đang đứng ở nút nào.", cause: "Đã outline: none cho 'đẹp' mà không thay chỉ báo khác.", fix: "Giữ outline hoặc thay bằng :focus-visible với viền/bóng rõ ràng." },
      { symptom: "Người dùng bấm nút Gửi 5 lần tạo 5 đơn hàng trùng.", cause: "Nút không chuyển disabled/loading khi đang xử lý.", fix: "Ngay khi bấm: set disabled + đổi chữ 'Đang gửi...' đến khi có phản hồi." },
      { symptom: "Hover đổi màu giật cục.", cause: "Thiếu transition ở trạng thái gốc.", fix: "Đặt transition: all 0.2s ở base selector (không đặt trong :hover)." }
    ],
    challenge: "Làm khối 'danh sách đơn hàng' có đủ 3 khung: Loading (spinner chữ Đang tải...), Empty (Chưa có đơn nào + nút hành động), Error (chữ đỏ + nút Thử lại).",
    checklist: [
      "Nút có đủ hover / focus / disabled nhìn thấy được",
      "Kể đủ 6 trạng thái UI không nhìn tài liệu",
      "Nói được vì sao cấm outline: none trần"
    ],
    tasks: ["Viết CSS nút có đủ :hover, :focus và :disabled kèm transition."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bài 17: Trạng thái UI</title>
  <style>
    button {
      background: #3b82f6; color: white; border: none;
      padding: 10px 20px; border-radius: 8px;
      /* TODO: transition 0.2s */
    }
    /* TODO: button:hover đổi nền #2563eb */
    /* TODO: button:focus outline 2px solid #93c5fd */
    /* TODO: button:disabled opacity 0.5 + cursor not-allowed */
  </style>
</head>
<body>
  <button>Gửi bài</button>
  <button disabled>Đang xử lý...</button>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes(":hover") && c.includes(":focus") && c.includes(":disabled") && c.includes("transition");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn pseudo-class áp dụng khi người dùng chọn phần tử bằng phím Tab:",
      snippet: "button[ ... ] { outline: 2px solid #93c5fd; }",
      options: [
        { text: ":hover", correct: false },
        { text: ":focus", correct: true },
        { text: ":visited", correct: false },
        { text: ":checked", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Trạng thái nào hiển thị khi danh sách không có dữ liệu?", o: ["Loading", "Error", "Empty", "Success"], a: 2 },
      { q: "Vì sao không được outline: none trần trụi?", o: ["Xấu code", "Người dùng bàn phím mất dấu focus — vi phạm WCAG", "Chạy chậm", "Trình duyệt cấm"], a: 1 },
      { q: "Khi bấm nút gửi form, nút nên làm gì?", o: ["Giữ nguyên", "Chuyển disabled + báo đang xử lý để tránh bấm trùng", "Ẩn đi", "Đổi thành link"], a: 1 },
      { q: "transition nên khai báo ở đâu?", o: ["Trong :hover", "Ở selector gốc để mượt cả lúc vào lẫn lúc ra", "Trong @media", "Trong HTML"], a: 1 }
    ]
  },
  {
    id: "lesson18",
    title: "18. Toán logic: Bảng chân trị & Đại số Boolean",
    lang: "javascript",
    file: "src/lesson18.js",
    duration: "40 phút",
    overview: {
      description: "Mọi câu if trong đời lập trình viên là một biểu thức Boolean: luyện AND – OR – NOT và luật De Morgan để viết điều kiện gọn, đúng và đọc được.",
      outcomes: [
        "Thuộc bảng chân trị của && , || , !",
        "Rút gọn điều kiện phức tạp bằng luật De Morgan",
        "Viết hàm phân quyền thực tế bằng tổ hợp logic"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Đại số Boolean xử lý 2 giá trị chân lý \`true/false\` với 3 toán tử:

> **AND (&&)** — đúng khi CẢ HAI đúng • **OR (||)** — đúng khi ÍT NHẤT MỘT đúng • **NOT (!)** — đảo ngược.

**Luật De Morgan** — công cụ rút gọn điều kiện:
> \`!(A && B)\` ⟺ \`!A || !B\`
> \`!(A || B)\` ⟺ \`!A && !B\`

Ứng dụng phân quyền kinh điển: được xem tài liệu nếu là admin **hoặc** (là member **và** đã trả phí):
\`\`\`javascript
const canView = isAdmin || (isMember && hasPaid);
\`\`\`
Ngoặc tròn làm rõ thứ tự — && ưu tiên hơn || nhưng đừng bắt người đọc phải nhớ điều đó.`,
    labSteps: [
      "Mở src/lesson18.js — viết hàm checkPermission(user, post).",
      "Điều kiện 1: có tài khoản hợp lệ — const hasAccount = !!user && !user.isBlocked;",
      "Điều kiện 2: có quyền — const isAuthorized = user.role === 'admin' || post.authorId === user.id;",
      "return hasAccount && isAuthorized; — đặt tên biến trung gian thay vì nhét 1 dòng dài.",
      "Viết bảng chân trị 4 dòng cho && và || dạng chú thích cuối file — gõ tay, không copy.",
      "Áp De Morgan: viết lại !(user.isBlocked || user.isGuest) thành dạng && tương đương."
    ],
    commonMistakes: [
      { symptom: "Điều kiện a || b && c chạy khác ý muốn.", cause: "&& ưu tiên hơn || — b && c được tính trước.", fix: "Luôn đóng ngoặc rõ ràng: (a || b) && c hoặc a || (b && c) theo đúng ý." },
      { symptom: "if (x = 5) luôn đúng.", cause: "Gõ nhầm = (gán) thay vì === (so sánh).", fix: "So sánh luôn dùng === (so cả kiểu); bật ESLint sẽ bắt lỗi này." },
      { symptom: "Điều kiện 1 dòng dài 120 ký tự không ai hiểu.", cause: "Nhồi mọi logic vào một biểu thức.", fix: "Tách thành các biến tên có nghĩa: hasAccount, isAuthorized rồi kết hợp." }
    ],
    challenge: "Viết hàm canCheckout(cart, user): giỏ không rỗng VÀ (user đã đăng nhập HOẶC cho phép khách vãng lai) VÀ KHÔNG bị khóa — kèm bảng chân trị bạn tự kiểm 3 case.",
    checklist: [
      "Đọc thuộc bảng chân trị && và || không nhìn tài liệu",
      "Biến đổi được 1 biểu thức theo De Morgan",
      "Điều kiện dài luôn tách thành biến có tên"
    ],
    tasks: ["Viết hàm checkPermission dùng đủ &&, || và ! với biến trung gian có tên."],
    starterCode: `// BÀI 18: Đại số Boolean & phân quyền
function checkPermission(user, post) {
  // TODO 1: hasAccount = có user và không bị khóa (dùng ! và &&)
  // TODO 2: isAuthorized = là admin HOẶC là tác giả bài viết (dùng ||)
  // TODO 3: return kết hợp cả hai
}
// TODO 4: chú thích bảng chân trị 4 dòng của && và ||
`,
    verify: (code) => {
      const c = code;
      return c.includes("&&") && c.includes("||") && c.includes("!") && c.toLowerCase().includes("return");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Theo luật De Morgan, !(A && B) tương đương với biểu thức nào?",
      snippet: "!(A && B)  ⟺  [ ... ]",
      options: [
        { text: "!A && !B", correct: false },
        { text: "!A || !B", correct: true },
        { text: "A || B", correct: false },
        { text: "!(A || B)", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Biểu thức (!true || false) trả về gì?", o: ["true", "false", "undefined", "null"], a: 1 },
      { q: "Toán tử && trả true khi nào?", o: ["Một vế đúng", "Cả hai vế cùng đúng", "Cả hai vế sai", "Luôn true"], a: 1 },
      { q: "!(A || B) tương đương gì theo De Morgan?", o: ["!A || !B", "!A && !B", "A && B", "!A"], a: 1 },
      { q: "Vì sao dùng === thay vì ==?", o: ["Ngắn hơn", "So sánh cả giá trị lẫn kiểu, tránh ép kiểu ngầm gây bug", "Chạy nhanh gấp đôi", "== bị xoá khỏi JS"], a: 1 }
    ]
  },
  {
    id: "lesson19",
    title: "19. Toán hình học: Hệ tọa độ & Xử lý Vector 2D",
    lang: "javascript",
    file: "src/lesson19.js",
    duration: "45 phút",
    overview: {
      description: "Màn hình là một mặt phẳng tọa độ: nắm hệ trục của web và phép tính vector cơ bản để làm chủ kéo-thả, va chạm game và mọi hiệu ứng chuyển động.",
      outcomes: [
        "Nắm hệ tọa độ web: gốc (0,0) góc trên trái, trục Y hướng XUỐNG",
        "Viết hàm khoảng cách Euclid bằng định lý Pythagoras",
        "Cộng/trừ vector vị trí để dịch chuyển phần tử"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Hệ tọa độ màn hình web KHÁC toán phổ thông:

> Gốc **(0,0)** nằm ở **góc trên bên trái** • trục X tăng sang phải • trục **Y tăng đi XUỐNG dưới**.

Một điểm/vị trí là vector 2 thành phần \`{x, y}\`:
> Dịch chuyển = cộng vector: \`pos' = {x: pos.x + dx, y: pos.y + dy}\`
> Khoảng cách 2 điểm (Pythagoras): \`d = √((x2-x1)² + (y2-y1)²)\`

\`\`\`javascript
function getDistance(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx ** 2 + dy ** 2);
}
\`\`\`
Đây là công thức đứng sau kiểm tra va chạm (2 vật chạm khi khoảng cách < tổng bán kính), snap kéo-thả, và tính gần/xa mọi thứ trên màn hình.`,
    labSteps: [
      "Mở src/lesson19.js — viết bộ hàm vector nhỏ.",
      "Hàm getDistance(x1, y1, x2, y2) dùng Math.sqrt và bình phương (** 2 hoặc Math.pow).",
      "Hàm addVector(a, b) trả { x: a.x + b.x, y: a.y + b.y } — phép dịch chuyển.",
      "Hàm isColliding(c1, c2) trả true khi getDistance(...) < c1.r + c2.r — va chạm 2 hình tròn.",
      "console.log kiểm chứng: khoảng cách (0,0)→(3,4) phải bằng đúng 5."
    ],
    commonMistakes: [
      { symptom: "Tăng y mà phần tử chạy XUỐNG, tưởng code sai.", cause: "Quen trục Y toán học hướng lên — web thì ngược lại.", fix: "Ghi nhớ: trên web, y càng lớn càng xuống thấp. Gốc ở góc trên trái." },
      { symptom: "Khoảng cách trả về NaN.", cause: "Truyền object {x, y} vào hàm nhận 4 số rời, hoặc quên bình phương.", fix: "Thống nhất chữ ký hàm; kiểm tra dx, dy bằng console.log trước khi sqrt." },
      { symptom: "So khoảng cách bằng == 5 không bao giờ đúng.", cause: "Số thực có sai số dấu phẩy động.", fix: "So sánh khoảng: Math.abs(d - 5) < 0.001 hoặc dùng bất đẳng thức < , >." }
    ],
    challenge: "Viết hàm moveToward(pos, target, step) trả vị trí mới tiến về target đúng step đơn vị mỗi lần gọi — nền tảng cho NPC đuổi theo người chơi.",
    checklist: [
      "Vẽ được hệ trục web đúng chiều trên giấy",
      "Kiểm chứng (0,0)→(3,4) = 5 chạy đúng",
      "Giải thích va chạm hình tròn bằng khoảng cách"
    ],
    tasks: ["Viết getDistance dùng Math.sqrt + bình phương và hàm cộng vector addVector."],
    starterCode: `// BÀI 19: Vector 2D & khoảng cách
// TODO 1: getDistance(x1, y1, x2, y2) — Pythagoras: Math.sqrt(dx**2 + dy**2)
// TODO 2: addVector(a, b) — trả {x, y} tổng hai vector
// TODO 3: console.log(getDistance(0, 0, 3, 4)) phải ra 5
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("math.sqrt") && (c.includes("math.pow") || c.includes("**2")) && c.includes("getdistance") && c.includes("addvector");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Trên màn hình web, gốc tọa độ (0,0) nằm ở đâu?",
      snippet: "element.style.left = x + 'px'; element.style.top = y + 'px';",
      options: [
        { text: "Chính giữa màn hình", correct: false },
        { text: "Góc trên bên trái", correct: true },
        { text: "Góc dưới bên trái", correct: false },
        { text: "Góc dưới bên phải", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Trục Y trên màn hình web tăng theo hướng nào?", o: ["Lên trên", "Xuống dưới", "Sang phải", "Tuỳ trình duyệt"], a: 1 },
      { q: "Khoảng cách Euclid dựa trên định lý nào?", o: ["Thales", "Pythagoras", "Newton", "Euler"], a: 1 },
      { q: "Hai hình tròn va chạm khi nào?", o: ["Cùng màu", "Khoảng cách tâm < tổng hai bán kính", "Cùng tọa độ x", "Bán kính bằng nhau"], a: 1 },
      { q: "Dịch chuyển vị trí bằng phép toán vector nào?", o: ["Nhân", "Cộng vector độ dời", "Chia", "Nghịch đảo"], a: 1 }
    ]
  },
  {
    id: "lesson20",
    title: "20. Toán ma trận: Phép biến đổi trong lập trình giao diện",
    lang: "css",
    file: "src/lesson20.css",
    duration: "40 phút",
    overview: {
      description: "Mọi hiệu ứng xoay – trượt – phóng to trên web đều là phép nhân ma trận được GPU tăng tốc, đóng gói trong một thuộc tính: transform.",
      outcomes: [
        "Dùng transform với translate, rotate, scale (và hiểu chúng là ma trận)",
        "Biết vì sao transform mượt hơn đổi left/top (GPU vs Reflow)",
        "Nắm quy tắc: thứ tự các hàm transform làm thay đổi kết quả"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Các phép biến đổi hình học 2D được biểu diễn bằng **ma trận biến đổi**; trình duyệt nhân ma trận với tọa độ từng điểm — việc này chạy trên **GPU** nên cực mượt:

> \`translate(20px, 0)\` — tịnh tiến • \`rotate(45deg)\` — xoay quanh tâm • \`scale(1.2)\` — phóng to 120% • \`matrix(...)\` — dạng gốc của tất cả.

\`\`\`css
.card-3d { transform: translate(20px, 0) rotate(45deg) scale(1.1); }
.card-3d:hover { transform: scale(1.05); transition: transform 0.3s; }
\`\`\`

**Vì sao dùng transform thay left/top?** Đổi left/top ép trình duyệt tính lại layout (Reflow — đắt); transform chỉ là bước composite trên GPU — đây là chuẩn tối ưu animation của Google Web Fundamentals.

> Thứ tự có ý nghĩa: \`rotate(45deg) translate(100px, 0)\` cho kết quả KHÁC \`translate(100px, 0) rotate(45deg)\` — vì nhân ma trận không giao hoán.`,
    labSteps: [
      "Mở src/lesson20.css — tạo hiệu ứng thẻ bài.",
      "Gõ .card-3d { transform: translate(20px, 0) rotate(45deg); } — đủ 2 phép biến đổi.",
      "Thêm transition: transform 0.3s; và :hover { transform: scale(1.1); } — hover phóng to mượt.",
      "Thí nghiệm thứ tự: đổi chỗ rotate và translate, quan sát vị trí kết quả khác nhau và ghi chú lại.",
      "Ghi chú cuối file: vì sao không animate bằng left/top."
    ],
    commonMistakes: [
      { symptom: "Viết 2 dòng transform, dòng sau đè mất dòng trước.", cause: "transform là MỘT thuộc tính — khai báo sau ghi đè toàn bộ.", fix: "Gộp mọi phép vào một dòng: transform: translate(...) rotate(...) scale(...)." },
      { symptom: "Animation bằng left chạy giật trên máy yếu.", cause: "Đổi left/top gây Reflow từng frame.", fix: "Chuyển sang transform: translateX() — GPU xử lý, không đụng layout." },
      { symptom: "rotate xong phần tử 'bay' đi chỗ khác không như hình dung.", cause: "Xoay trước rồi tịnh tiến — trục đã bị xoay theo.", fix: "Nắm quy tắc thứ tự; thường translate trước rotate sau, hoặc chỉnh transform-origin." }
    ],
    challenge: "Làm thẻ bài lật: :hover xoay rotateY(180deg) với transition 0.6s và transform-style: preserve-3d cho mặt sau.",
    checklist: [
      "Dùng đủ 3 phép translate / rotate / scale trong một dòng transform",
      "Giải thích được vì sao transform mượt hơn left/top",
      "Chứng minh bằng thí nghiệm: đổi thứ tự phép biến đổi cho kết quả khác"
    ],
    tasks: ["Viết .card-3d có transform chứa translate + rotate, kèm transition và :hover scale."],
    starterCode: `/* BÀI 20: Ma trận biến đổi qua transform
TODO 1: .card-3d { transform: translate(20px, 0) rotate(45deg); transition: transform 0.3s; }
TODO 2: .card-3d:hover { transform: scale(1.1); }
TODO 3: chú thích — vì sao không animate bằng left/top? */
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("transform:") && c.includes("rotate(") && c.includes("translate") && c.includes("scale(") && c.includes("transition");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn hàm transform dùng để PHÓNG TO một phần tử lên 120%:",
      snippet: ".card:hover { transform: [ ... ](1.2); }",
      options: [
        { text: "rotate", correct: false },
        { text: "scale", correct: true },
        { text: "translate", correct: false },
        { text: "skew", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Thuộc tính nào thực hiện dịch chuyển/xoay/phóng to bằng ma trận?", o: ["transition", "transform", "position", "animation-name"], a: 1 },
      { q: "Vì sao transform mượt hơn animate left/top?", o: ["Cú pháp ngắn", "Chạy trên GPU, không gây Reflow layout", "Trình duyệt ưu tiên", "Không khác gì"], a: 1 },
      { q: "Hai dòng transform trong cùng selector thì sao?", o: ["Cộng dồn", "Dòng sau ghi đè toàn bộ dòng trước", "Lỗi cú pháp", "Chạy lần lượt"], a: 1 },
      { q: "Đổi thứ tự rotate và translate có ảnh hưởng không?", o: ["Không", "Có — nhân ma trận không giao hoán, kết quả khác nhau", "Chỉ ảnh hưởng 3D", "Chỉ ảnh hưởng scale"], a: 1 }
    ]
  },
  {
    id: "lesson21",
    title: "21. Quy tắc bảo mật: CORS & Content Security Policy",
    lang: "php",
    file: "src/lesson21.php",
    duration: "45 phút",
    overview: {
      description: "Hai hàng rào của trình duyệt: CORS quyết định ai được gọi API của bạn, CSP quyết định script nào được chạy trên trang của bạn.",
      outcomes: [
        "Giải thích Same-Origin Policy và lỗi CORS xảy ra ở đâu",
        "Cấu hình header Access-Control-Allow-Origin đúng cách (không lạm dụng *)",
        "Viết header Content-Security-Policy chặn script lạ"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Same-Origin Policy**: trình duyệt mặc định chặn JS của trang A đọc dữ liệu từ domain B.

**CORS** (Cross-Origin Resource Sharing) — backend chủ động cho phép origin cụ thể:
\`\`\`php
header("Access-Control-Allow-Origin: https://app.hugo.vn");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
\`\`\`
> Lỗi CORS xảy ra **ở trình duyệt** (không phải server) — server vẫn nhận request, trình duyệt chặn JS đọc phản hồi. \`*\` (mọi nơi) chỉ dùng cho API công khai; API có đăng nhập phải chỉ định origin cụ thể.

**CSP** (Content Security Policy) — khai báo nguồn tài nguyên hợp lệ, vũ khí chặn XSS:
\`\`\`php
header("Content-Security-Policy: default-src 'self'; script-src 'self'");
\`\`\`
Script chèn lậu từ domain lạ sẽ bị trình duyệt từ chối chạy.`,
    labSteps: [
      "Mở src/lesson21.php — dựng file API có 2 hàng rào.",
      "Gõ header Access-Control-Allow-Origin trỏ về origin cụ thể (https://app.hugo.vn) — kèm chú thích khi nào mới dùng *.",
      "Thêm Access-Control-Allow-Headers cho Content-Type, Authorization.",
      "Gõ header Content-Security-Policy: default-src 'self'; script-src 'self'.",
      "echo json_encode xác nhận — và trả lời trong chú thích: lỗi CORS hiện ở console của AI hay trình duyệt người dùng?"
    ],
    commonMistakes: [
      { symptom: "Gặp lỗi CORS liền sửa Access-Control-Allow-Origin: * cho xong.", cause: "Mở toang API cho mọi website — trang lạ có thể gọi API kèm phiên người dùng.", fix: "Chỉ định chính xác origin của frontend; * chỉ cho API công khai không cần đăng nhập." },
      { symptom: "Đặt header sau khi đã echo nội dung — báo headers already sent.", cause: "PHP đã gửi output trước khi set header.", fix: "Mọi lệnh header() phải nằm TRƯỚC bất kỳ echo/HTML nào." },
      { symptom: "Bật CSP xong chính script nội tuyến của trang chết.", cause: "CSP mặc định chặn inline script.", fix: "Chuyển JS vào file .js riêng (script-src 'self') — đúng chuẩn code sạch luôn." }
    ],
    challenge: "Viết khối xử lý preflight: nếu $_SERVER['REQUEST_METHOD'] === 'OPTIONS' thì trả 204 kèm các header CORS rồi exit — đúng nghi thức trình duyệt hỏi trước khi gửi request thật.",
    checklist: [
      "Nói đúng: lỗi CORS xảy ra ở trình duyệt, do server chưa cho phép",
      "Biết khi nào được dùng * và khi nào cấm",
      "Viết được CSP tối thiểu default-src 'self'"
    ],
    tasks: ["Cấu hình header Access-Control-Allow-Origin (origin cụ thể) và Content-Security-Policy trong PHP."],
    starterCode: `<?php
// BÀI 21: Hai hàng rào CORS + CSP
// TODO 1: header Access-Control-Allow-Origin về https://app.hugo.vn
// TODO 2: header Access-Control-Allow-Headers: Content-Type, Authorization
// TODO 3: header Content-Security-Policy: default-src 'self'; script-src 'self'
echo json_encode(["status" => "secured"]);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("access-control-allow-origin") && c.includes("content-security-policy") && c.includes("header(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Lỗi CORS thực chất bị chặn ở đâu?",
      snippet: "Access to fetch at 'api.b.com' from origin 'a.com' has been blocked...",
      options: [
        { text: "Tại database", correct: false },
        { text: "Tại trình duyệt (browser)", correct: true },
        { text: "Tại router wifi", correct: false },
        { text: "Tại file CSS", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "CORS viết tắt của gì?", o: ["Cross-Origin Resource Sharing", "Common Object Routing Suite", "Client Origin Redirect Service", "Cross Origin Request Security"], a: 0 },
      { q: "Vì sao không nên dùng Allow-Origin: * cho API có đăng nhập?", o: ["Chạy chậm", "Mọi website lạ đều gọi được API của bạn", "Sai cú pháp", "Tốn băng thông"], a: 1 },
      { q: "CSP giúp chặn kiểu tấn công nào là chính?", o: ["DDoS", "XSS — script lạ không được phép chạy", "SQL Injection", "Brute force"], a: 1 },
      { q: "Lệnh header() trong PHP phải đặt ở đâu?", o: ["Cuối file", "Trước mọi output (echo/HTML)", "Trong thẻ script", "Sau json_encode"], a: 1 }
    ]
  },
  {
    id: "lesson22",
    title: "22. Ghi chú hiệu quả (Comments) & Tối ưu code theo DRY",
    lang: "javascript",
    file: "src/lesson22.js",
    duration: "40 phút",
    overview: {
      description: "Hai tiêu chuẩn phán đoán code trưởng thành: ghi chú giải thích TẠI SAO (không phải cái gì), và không bao giờ copy-paste logic — Don't Repeat Yourself.",
      outcomes: [
        "Viết JSDoc chuẩn với @param và @return cho hàm",
        "Phân biệt ghi chú đáng viết và ghi chú rác",
        "Phát hiện code lặp và refactor thành hàm dùng chung"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Ghi chú tốt giải thích TẠI SAO, không tường thuật cái gì** — code đã tự nói nó làm gì:

\`\`\`javascript
/**
 * Tính phí giao dịch JOY kèm 10% phí sáng tạo.
 * @param {number} amount - Số JOY gốc
 * @return {number} Tổng JOY phải trừ
 */
function calcTotal(amount) { return Math.ceil(amount * 1.1); }
\`\`\`
JSDoc (\`/** ... */\` + \`@param\`, \`@return\`) giúp VS Code hiện gợi ý khi gọi hàm. Đánh dấu việc dang dở bằng \`// TODO:\`.

**DRY (Don't Repeat Yourself)**: một logic chỉ tồn tại ở MỘT nơi. Copy-paste một đoạn 3 lần = khi sửa bug phải nhớ sửa 3 chỗ — quên 1 chỗ là có bug ẩn. Thấy mình đang copy đoạn code lần thứ hai → dừng lại, tách thành hàm.`,
    labSteps: [
      "Mở src/lesson22.js — có 3 khối tính phí bị copy-paste, mỗi khối lệch nhau một chút (mầm bug).",
      "Đọc và khoanh phần logic trùng: nhân 1.1 và làm tròn lên.",
      "Tách thành hàm calcTotal(amount) duy nhất — xoá 3 khối lặp, thay bằng 3 lời gọi hàm.",
      "Viết khối JSDoc /** */ đủ mô tả + @param + @return ngay trên hàm.",
      "Thêm một // TODO: hỗ trợ mức phí tuỳ chỉnh — đánh dấu việc tương lai đúng chuẩn."
    ],
    commonMistakes: [
      { symptom: "// tăng i lên 1 ngay trên dòng i++.", cause: "Ghi chú tường thuật điều code đã nói.", fix: "Xoá — chỉ ghi chú khi có ngữ cảnh code không thể tự nói (lý do nghiệp vụ, workaround)." },
      { symptom: "Sửa công thức phí ở 2 nơi, nơi thứ 3 quên — người dùng bị trừ sai tiền.", cause: "Logic bị copy-paste nhiều chỗ.", fix: "DRY: gom về một hàm; sửa một nơi đúng mọi nơi." },
      { symptom: "Ghi chú nói một đằng, code chạy một nẻo.", cause: "Sửa code nhưng không cập nhật ghi chú.", fix: "Ghi chú là một phần của code — sửa logic thì sửa luôn ghi chú, hoặc xoá nếu hết đúng." }
    ],
    challenge: "Tìm trong code cũ của bạn (bài 13-15) một đoạn lặp bất kỳ và refactor theo DRY + viết JSDoc cho hàm mới tách ra.",
    checklist: [
      "Hàm chính có JSDoc đủ @param/@return",
      "File không còn logic trùng lặp",
      "Nói được quy tắc: ghi chú giải thích tại sao, không phải cái gì"
    ],
    tasks: [
      "Refactor 3 khối tính phí lặp thành 1 hàm calcTotal duy nhất.",
      "Viết JSDoc /** */ có @param và @return, kèm một // TODO:."
    ],
    starterCode: `// BÀI 22: Diệt code lặp + ghi chú chuẩn
// Ba khối dưới đây bị copy-paste — hãy DRY chúng!

const phiNapThe = Math.ceil(500 * 1.1);
console.log("Phí nạp thẻ:", phiNapThe);

const phiRutJoy = Math.ceil(1200 * 1.1);
console.log("Phí rút JOY:", phiRutJoy);

const phiChuyenKhoan = Math.ceil(800 * 1.1);
console.log("Phí chuyển khoản:", phiChuyenKhoan);

// TODO: tách hàm calcTotal(amount) + JSDoc @param/@return, thay 3 khối trên bằng lời gọi hàm
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const hasJsDoc = code.includes("/**") && code.includes("@param") && (code.includes("@return") || code.includes("@returns"));
      const hasFn = c.includes("functioncalctotal") || c.includes("calctotal=(");
      const callCount = (c.match(/calctotal\(/g) || []).length;
      return hasJsDoc && hasFn && callCount >= 3;
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Ghi chú JSDoc mô tả THAM SỐ của hàm dùng thẻ nào?",
      snippet: "/**\\n * Tính phí giao dịch.\\n * [ ... ] {number} amount - Số JOY gốc\\n */",
      options: [
        { text: "@return", correct: false },
        { text: "@param", correct: true },
        { text: "@var", correct: false },
        { text: "@input", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "DRY viết tắt của gì?", o: ["Do Repeat Yourself", "Don't Repeat Yourself", "Data Ready Yield", "Direct Render YAML"], a: 1 },
      { q: "Ghi chú tốt nên giải thích điều gì?", o: ["Từng dòng code làm gì", "TẠI SAO code được viết như vậy (ngữ cảnh, lý do)", "Tên tác giả mỗi dòng", "Không cần ghi chú"], a: 1 },
      { q: "Khối JSDoc bắt đầu bằng ký tự nào?", o: ["//", "/*", "/**", "#"], a: 2 },
      { q: "Tác hại lớn nhất của copy-paste logic?", o: ["File nặng", "Sửa bug phải sửa nhiều nơi, sót một nơi là bug ẩn", "Chạy chậm", "Khó đọc màu"], a: 1 }
    ]
  },
  {
    id: "lesson23",
    title: "23. Cú pháp viết nhanh (Destructuring, ??, ?.)",
    lang: "javascript",
    file: "src/lesson23.js",
    duration: "40 phút",
    overview: {
      description: "Bộ ba cú pháp ES6+ giúp code ngắn một nửa và hết sợ 'Cannot read properties of undefined': destructuring, nullish coalescing và optional chaining.",
      outcomes: [
        "Trích xuất dữ liệu object/array bằng destructuring",
        "Đặt giá trị mặc định đúng bằng ?? (phân biệt với ||)",
        "Truy cập thuộc tính lồng nhau an toàn bằng ?."
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Ba cú pháp hiện đại theo chuẩn **ECMAScript** (MDN):

> **Destructuring**: \`const { name, age } = user;\` thay cho 2 dòng gán lẻ. Với mảng: \`const [first, second] = list;\`

> **Nullish Coalescing \`??\`**: lấy vế phải CHỈ khi vế trái là \`null/undefined\`.
> Khác \`||\`: \`0 || 10\` ra 10 (sai ý nếu 0 hợp lệ!) còn \`0 ?? 10\` ra 0.

> **Optional Chaining \`?.\`**: \`user?.address?.city\` — gặp null/undefined ở bất kỳ mắt xích nào thì trả undefined thay vì crash.

Kết hợp thần thánh: \`const city = user?.address?.city ?? "Chưa cập nhật";\``,
    labSteps: [
      "Mở src/lesson23.js — có object user lồng 3 cấp và đoạn code kiểu cũ dài dòng.",
      "Thay 3 dòng gán lẻ bằng 1 dòng destructuring: const { name, role } = user;",
      "Viết const city = user?.address?.city ?? \"Chưa cập nhật\"; — thử xoá address chạy lại, không crash.",
      "Thí nghiệm ?? vs ||: cho balance = 0, in ra balance ?? 100 và balance || 100 — thấy khác biệt.",
      "Destructuring mảng: const [top1, top2] = ranking; in hai hạng đầu."
    ],
    commonMistakes: [
      { symptom: "Số dư 0 JOY hiển thị thành 100 JOY.", cause: "Dùng || làm mặc định — 0 là falsy nên bị thay.", fix: "Dùng ?? khi 0 / chuỗi rỗng / false là giá trị hợp lệ." },
      { symptom: "Crash: Cannot read properties of undefined (reading 'city').", cause: "Truy cập chuỗi thuộc tính lồng nhau khi mắt xích giữa không tồn tại.", fix: "Dùng ?. tại mọi mắt xích không chắc chắn: user?.address?.city." },
      { symptom: "Destructuring ra undefined dù object có dữ liệu.", cause: "Sai tên key — destructuring khớp theo TÊN, không theo vị trí.", fix: "Tên biến phải trùng key; muốn đổi tên: const { name: hoTen } = user;" }
    ],
    challenge: "Viết hàm formatUser(user) trả chuỗi 'Tên — Thành phố — Cấp độ' dùng đủ 3 cú pháp: destructuring có đổi tên, ?. và ?? — hàm không được crash với formatUser({}) hoặc formatUser(null).",
    checklist: [
      "Giải thích khác biệt ?? và || bằng ví dụ số 0",
      "Viết chuỗi truy cập an toàn 3 cấp không crash",
      "Destructuring cả object lẫn mảng thành thạo"
    ],
    tasks: ["Dùng đủ 3 cú pháp: destructuring, ?? và ?. trong file."],
    starterCode: `// BÀI 23: Cú pháp viết nhanh ES6+
const user = {
  name: "Hugo",
  role: "student",
  balance: 0
  // chú ý: không có address!
};
const ranking = ["An", "Bình", "Chi"];

// TODO 1: destructuring lấy name, role từ user
// TODO 2: const city = user?.address?.city ?? "Chưa cập nhật";
// TODO 3: so sánh console.log(user.balance ?? 100) và (user.balance || 100)
// TODO 4: destructuring mảng lấy [top1, top2] từ ranking
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("const{") && c.includes("?.") && c.includes("??") && c.includes("const[");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Toán tử ?? lấy giá trị vế phải khi vế trái là gì?",
      snippet: "const displayName = user.nickName [ ?? ] user.fullName;",
      options: [
        { text: "0 hoặc false", correct: false },
        { text: "null hoặc undefined", correct: true },
        { text: "Chuỗi rỗng", correct: false },
        { text: "Mọi giá trị falsy", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "0 ?? 100 trả về bao nhiêu?", o: ["100", "0", "undefined", "NaN"], a: 1 },
      { q: "0 || 100 trả về bao nhiêu?", o: ["0", "100", "null", "lỗi"], a: 1 },
      { q: "user?.address?.city khi user không có address trả về gì?", o: ["Crash", "undefined", "null", "chuỗi rỗng"], a: 1 },
      { q: "const { name } = user tương đương với?", o: ["const name = user", "const name = user.name", "const name = 'user'", "user.name = name"], a: 1 }
    ]
  },
  {
    id: "lesson24",
    title: "24. Quy tắc nội dung: SEO ngữ nghĩa & Tối ưu thẻ Meta",
    lang: "html",
    file: "src/lesson24.html",
    duration: "45 phút",
    overview: {
      description: "Cho Google và mạng xã hội 'đọc hiểu' trang của bạn: meta description, Open Graph và cấu trúc heading chuẩn — nền tảng của mọi chiến lược SEO kỹ thuật.",
      outcomes: [
        "Viết bộ meta chuẩn: title, description, viewport",
        "Cấu hình Open Graph (og:title, og:description, og:image) cho chia sẻ mạng xã hội",
        "Kiểm tra cấu trúc heading một-h1 phục vụ SEO ngữ nghĩa"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**SEO ngữ nghĩa** bắt đầu từ HTML sạch + siêu dữ liệu đúng chuẩn:

> \`<title>\` — 50-60 ký tự, chứa từ khóa chính, hiện trên tab và kết quả Google.
> \`<meta name="description">\` — 150-160 ký tự, đoạn mô tả dưới tiêu đề trên Google.
> Mỗi trang đúng MỘT \`<h1>\`, heading tuần tự không nhảy cấp (đã học Bài 1).

**Open Graph** (chuẩn do Facebook khởi xướng, Zalo/LinkedIn/Discord đều dùng) quyết định khung xem trước khi chia sẻ link:
\`\`\`html
<meta property="og:title" content="Khóa học HugoCoder">
<meta property="og:description" content="Lộ trình 100 bài từ cơ bản đến DevOps.">
<meta property="og:image" content="https://hugo.vn/cover.png">
\`\`\`
Thiếu og:image = chia sẻ link chỉ ra chữ trơ trọi — mất 80% lượt bấm.`,
    labSteps: [
      "Mở src/lesson24.html — trang bán khóa học chỉ có title trống trơn.",
      "Viết <title> ~55 ký tự có từ khóa: 'Khóa học lập trình web HugoCoder — Từ cơ bản đến DevOps'.",
      "Thêm meta name=\"description\" ~155 ký tự mô tả giá trị khóa học.",
      "Thêm bộ Open Graph: og:title, og:description, og:image (URL ảnh 1200x630).",
      "Rà lại body: đúng 1 thẻ h1, các mục con là h2 — sửa nếu sai."
    ],
    commonMistakes: [
      { symptom: "Chia sẻ link lên Zalo/Facebook chỉ hiện URL trơ trọi.", cause: "Thiếu bộ thẻ og:, đặc biệt og:image.", fix: "Thêm đủ og:title/description/image — ảnh chuẩn 1200x630px." },
      { symptom: "Google hiển thị đoạn mô tả lạ tự cắt từ giữa trang.", cause: "Không có meta description nên Google tự chọn.", fix: "Viết description 150-160 ký tự tóm đúng giá trị trang." },
      { symptom: "Trang có 4 thẻ h1 vì 'chữ to đẹp'.", cause: "Dùng heading để trang trí cỡ chữ.", fix: "Cỡ chữ chỉnh bằng CSS; heading là CẤU TRÚC — mỗi trang một h1." }
    ],
    challenge: "Thêm thẻ <link rel=\"canonical\"> và meta robots, rồi dán URL trang vào một trình xem trước OG (như opengraph.xyz) kiểm tra khung chia sẻ.",
    checklist: [
      "Title 50-60 ký tự có từ khóa, description 150-160 ký tự",
      "Đủ og:title / og:description / og:image",
      "Trang chỉ có một h1, heading không nhảy cấp"
    ],
    tasks: ["Viết meta description và bộ Open Graph og:title + og:image cho trang."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web</title>
  <!-- TODO 1: sửa title chuẩn 50-60 ký tự có từ khóa -->
  <!-- TODO 2: meta name="description" 150-160 ký tự -->
  <!-- TODO 3: og:title, og:description, og:image -->
</head>
<body>
  <h1>Khóa học lập trình web HugoCoder</h1>
  <h2>Lộ trình 100 bài học</h2>
  <p>Từ HTML cơ bản đến triển khai DevOps thực chiến.</p>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('name="description"') && c.includes('property="og:title"') && c.includes('property="og:image"');
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Thẻ meta nào quyết định ẢNH xem trước khi chia sẻ link lên mạng xã hội?",
      snippet: "<meta property=\"[ ... ]\" content=\"https://hugo.vn/cover.png\">",
      options: [
        { text: "og:image", correct: true },
        { text: "og:title", correct: false },
        { text: "description", correct: false },
        { text: "thumbnail", correct: false }
      ],
      correctIdx: 0
    },
    miniQuiz: [
      { q: "Meta description nên dài bao nhiêu?", o: ["30-50 ký tự", "150-160 ký tự", "500 ký tự", "Không giới hạn"], a: 1 },
      { q: "Thẻ og:image có vai trò gì?", o: ["Ảnh nền trang", "Ảnh xem trước khi chia sẻ link lên mạng xã hội", "Favicon", "Ảnh SEO ẩn"], a: 1 },
      { q: "Mỗi trang nên có bao nhiêu thẻ h1?", o: ["Càng nhiều càng tốt", "Đúng một", "Tối thiểu ba", "Không cần h1"], a: 1 },
      { q: "Robot Google đọc file nào để biết được phép thu thập trang nào?", o: ["sitemap.html", "robots.txt", "index.php", "manifest.json"], a: 1 }
    ]
  },
  {
    id: "lesson25",
    title: "25. Bài Kiểm Tra Website Programming 2",
    lang: "html",
    file: "src/lesson25.html",
    duration: "25 phút",
    overview: {
      description: "Tổng kết tư duy Chặng 2: schema & JOIN, transaction, MVC, REST, JSON & validation, UI/UX, toán ứng dụng, CORS/CSP, DRY và SEO — đạt 60% để bước vào Chặng 3.",
      outcomes: [
        "Tự đánh giá tư duy kiến trúc trước khi vào phần lõi khoa học máy tính",
        "Đạt tối thiểu 60% (5/8 câu) để mở khóa Chặng 3"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Đề thi 8 câu chọn ngẫu nhiên từ ngân hàng đề, phạm vi **chỉ gồm Bài 11-24**:
- Thiết kế CSDL, JOIN, Transaction & ACID.
- MVC, RESTful API, JSON & làm sạch dữ liệu.
- UI/UX: typography, tương phản, trạng thái UI.
- Toán ứng dụng: Boolean, vector, ma trận transform.
- CORS & CSP, ghi chú + DRY, cú pháp ES6+, SEO meta.

### CÁCH THI
Sai được đổi đề thi lại — nhưng hãy quay về đúng bài bị hổng trước khi thi tiếp.`,
    labSteps: [
      "Ôn nhanh checklist của 14 bài trong chặng.",
      "Làm 8 câu, đọc kỹ từng phương án.",
      "Đạt ≥ 60%: mở khóa Chặng 3. Chưa đạt: ôn lại đúng chủ đề sai rồi đổi đề thi lại."
    ],
    commonMistakes: [
      { symptom: "Nhớ máy móc đáp án cũ, đổi đề là sai.", cause: "Học vẹt không hiểu bản chất.", fix: "Với mỗi câu sai, mở lại bài gốc và tự làm lại phần thực hành." }
    ],
    challenge: "Đạt 8/8 trong một lần thi.",
    checklist: [
      "Đã ôn lại toàn bộ checklist Chặng 2 trước khi thi",
      "Đạt tối thiểu 60% và hiểu lý do từng câu sai"
    ],
    tasks: ["Hoàn thành bài thi 8 câu trắc nghiệm, đạt tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 8,
    quizPool: [
      { q: "Khóa ngoại (Foreign Key) dùng để làm gì?", o: ["Mã hóa bảng", "Liên kết dòng của bảng này với khóa chính bảng khác", "Tăng tốc SELECT", "Đặt tên bảng"], a: 1 },
      { q: "INNER JOIN trả về những dòng nào?", o: ["Mọi dòng 2 bảng", "Chỉ các dòng khớp ở cả hai bảng", "Chỉ bảng trái", "Dòng NULL"], a: 1 },
      { q: "Lệnh nào hoàn tác transaction khi có lỗi?", o: ["COMMIT", "ROLLBACK", "RESET", "ABORT ALL"], a: 1 },
      { q: "Chữ I trong ACID là gì?", o: ["Integrity", "Isolation — các giao dịch song song không giẫm nhau", "Index", "Identity"], a: 1 },
      { q: "Trong MVC, tầng nào nói chuyện với database?", o: ["View", "Controller", "Model", "Router"], a: 2 },
      { q: "Phương thức HTTP nào để cập nhật toàn bộ tài nguyên?", o: ["GET", "POST", "PUT", "OPTIONS"], a: 2 },
      { q: "Hàm PHP kiểm tra email hợp lệ?", o: ["preg_match", "filter_var + FILTER_VALIDATE_EMAIL", "strip_tags", "is_email"], a: 1 },
      { q: "Tương phản tối thiểu văn bản thường theo WCAG AA?", o: ["3:1", "4.5:1", "7:1", "2:1"], a: 1 },
      { q: "Pseudo-class nào ứng với chọn phần tử bằng phím Tab?", o: [":hover", ":focus", ":active", ":target"], a: 1 },
      { q: "!(A || B) tương đương biểu thức nào?", o: ["!A || !B", "!A && !B", "A && B", "!A"], a: 1 },
      { q: "Trên web, trục Y tăng theo hướng nào?", o: ["Lên trên", "Xuống dưới", "Sang trái", "Tuỳ màn hình"], a: 1 },
      { q: "Vì sao animate bằng transform thay vì left/top?", o: ["Ngắn hơn", "Chạy trên GPU, không gây Reflow", "left/top bị cấm", "Không khác gì"], a: 1 },
      { q: "Lỗi CORS bị chặn ở đâu?", o: ["Server", "Trình duyệt", "Database", "DNS"], a: 1 },
      { q: "0 ?? 100 trả về?", o: ["100", "0", "undefined", "lỗi"], a: 1 },
      { q: "DRY nghĩa là gì?", o: ["Viết code khô khan", "Một logic chỉ tồn tại ở một nơi, không copy-paste", "Xoá hết ghi chú", "Dùng ít biến"], a: 1 },
      { q: "Thẻ og:image dùng để làm gì?", o: ["Ảnh nền", "Ảnh xem trước khi chia sẻ link mạng xã hội", "Logo trang", "Ảnh favicon"], a: 1 }
    ]
  }
];
