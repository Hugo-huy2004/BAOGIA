// ============================================================
// CHẶNG 5 — SIÊU ĐỒ ÁN TỐT NGHIỆP: FULL-STACK & AI (Bài 71-90)
// Trọng tâm: tự tay code toàn bộ hệ thống lớn từ con số 0.
// Mỗi bài là một cột mốc của chính sản phẩm tốt nghiệp.
// ============================================================
export const PROJECT_LESSONS = [
  {
    id: "lesson71",
    title: "71. Cấu trúc OOP API Backend: Khung dự án chuẩn công nghiệp",
    lang: "javascript",
    file: "src/lesson71.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 1 của đồ án: dựng bộ xương backend hướng đối tượng — DatabaseConnection singleton, Repository truy dữ liệu, Controller điều phối — nền của mọi tính năng sau này.",
      outcomes: [
        "Dựng 3 lớp: DatabaseConnection (singleton), UserRepository, UserController",
        "Tổ chức thư mục backend: controllers/ models/ routes/ middlewares/",
        "Hiểu vì sao kết nối DB dùng mẫu singleton"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Kiến trúc backend OOP 3 lớp (phát triển từ MVC bài 13):

> **DatabaseConnection** — mẫu **singleton**: cả app dùng chung MỘT kết nối/pool, tránh mở trăm kết nối làm nghẽn DB.
> **Repository** — nơi DUY NHẤT chứa truy vấn của một bảng: \`UserRepository.findByEmail()\`, \`create()\`.
> **Controller** — nhận request, validate, gọi Repository, trả JSON + status code.

\`\`\`javascript
class DatabaseConnection {
  static #instance;
  static getInstance() {
    if (!this.#instance) this.#instance = new DatabaseConnection();
    return this.#instance;
  }
}
class UserRepository {
  findByEmail(email) { /* SELECT ... WHERE email = ? */ }
  create(user) { /* INSERT ... */ }
}
class UserController {
  register(req, res) { /* validate -> repository -> res.json */ }
}
\`\`\`
Cây thư mục chuẩn: \`src/controllers\`, \`src/models\` (repository), \`src/routes\`, \`src/middlewares\`, \`src/utils\`.`,
    labSteps: [
      "Tạo repo đồ án (đã có từ bài 67) — dựng cây thư mục backend chuẩn 5 nhánh.",
      "Trong editor: viết class DatabaseConnection theo mẫu singleton (static getInstance).",
      "Viết class UserRepository với 2 phương thức khung: findByEmail(email), create(user) — thân hàm chú thích câu SQL sẽ dùng.",
      "Viết class UserController với register(req, res): chuỗi chú thích 3 bước validate → repository → respond.",
      "Commit: 'feat: dựng khung OOP backend' — mỗi cột mốc một commit chuẩn Conventional."
    ],
    commonMistakes: [
      { symptom: "Mỗi request mở một kết nối DB mới, tải cao là DB từ chối kết nối.", cause: "Không dùng singleton/pool.", fix: "getInstance() dùng chung một kết nối/pool cho toàn app." },
      { symptom: "Câu SQL rải rác trong controller.", cause: "Bỏ tầng Repository.", fix: "SQL chỉ sống trong Repository — controller không biết SQL là gì." },
      { symptom: "Đặt tên file lộn xộn userctrl.js, User_repo.js.", cause: "Quên chuẩn bài 4.", fix: "Thống nhất: user-controller.js, user-repository.js (kebab-case)." }
    ],
    challenge: "Viết thêm MessageRepository (findByRoom, create) — bảng thứ hai của đồ án, chuẩn bị cho tính năng chat bài 84.",
    checklist: [
      "Cây thư mục 5 nhánh đã tồn tại trong repo",
      "3 class đúng vai trò, có singleton getInstance",
      "Đã commit cột mốc với message chuẩn"
    ],
    tasks: ["Viết 3 class: DatabaseConnection (static getInstance), UserRepository (findByEmail, create), UserController (register)."],
    starterCode: `// BÀI 71 — Cột mốc 1: Khung OOP Backend
// TODO 1: class DatabaseConnection — static getInstance() singleton
// TODO 2: class UserRepository — findByEmail(email), create(user)
// TODO 3: class UserController — register(req, res): validate -> repo -> respond
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("classdatabaseconnection") && c.includes("getinstance") && c.includes("classuserrepository") && c.includes("findbyemail") && c.includes("classusercontroller");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao kết nối database dùng mẫu Singleton?",
      snippet: "DatabaseConnection.getInstance() // luôn trả về cùng một kết nối",
      options: [
        { text: "Cho code dài hơn", correct: false },
        { text: "Cả app dùng chung một kết nối/pool — tránh mở trăm kết nối làm nghẽn DB", correct: true },
        { text: "Bắt buộc của JS", correct: false },
        { text: "Để mã hóa dữ liệu", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Tầng nào là nơi DUY NHẤT chứa câu SQL?", o: ["Controller", "Repository (Model)", "Route", "View"], a: 1 },
      { q: "Mẫu Singleton đảm bảo điều gì?", o: ["Chạy nhanh nhất", "Cả ứng dụng chỉ có một thể hiện của class", "Không cần class", "Tự backup"], a: 1 },
      { q: "Controller có nhiệm vụ gì?", o: ["Viết SQL", "Nhận request, validate, gọi repository, trả response", "Render HTML", "Quản lý git"], a: 1 },
      { q: "Thư mục middlewares dùng để chứa gì?", o: ["Ảnh tĩnh", "Các lớp xử lý xen giữa request (auth, rate limit...)", "File CSS", "Unit test"], a: 1 }
    ]
  },
  {
    id: "lesson72",
    title: "72. Triển khai hệ thống API CRUD & Tối ưu truy vấn",
    lang: "javascript",
    file: "src/lesson72.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 2: xương sống dữ liệu của đồ án — bộ route CRUD chuẩn REST cho tài nguyên users, truy vấn tham số hóa và phân trang ngay từ đầu.",
      outcomes: [
        "Dựng 4 route REST: POST/GET/PUT/DELETE cho /api/users",
        "Trả đúng status: 201 tạo, 200 đọc/sửa, 404 không thấy, 400 dữ liệu sai",
        "Phân trang bằng ?page & limit với LIMIT/OFFSET ngay từ đầu"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Bộ CRUD chuẩn REST (bài 14) lắp vào khung OOP (bài 71):

\`\`\`javascript
// routes/user-routes.js
router.post("/api/users", (req, res) => controller.create(req, res));      // 201
router.get("/api/users", (req, res) => controller.list(req, res));         // 200 + phân trang
router.get("/api/users/:id", (req, res) => controller.detail(req, res));   // 200 | 404
router.put("/api/users/:id", (req, res) => controller.update(req, res));   // 200 | 404
router.delete("/api/users/:id", (req, res) => controller.remove(req, res));// 204
\`\`\`

Phân trang từ ngày đầu — đừng đợi bảng phình mới thêm:
\`\`\`javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(50, parseInt(req.query.limit) || 10);
// SELECT ... LIMIT ? OFFSET ?  với offset = (page - 1) * limit
\`\`\`
Mọi truy vấn đều tham số hóa (?) — không nối chuỗi (bài 9, 56). Response list chuẩn: \`{ data, page, limit, total }\`.`,
    labSteps: [
      "Trong editor: dựng 5 route CRUD theo khuôn (giả lập router bằng object/hàm nếu chưa chạy Express thật).",
      "Viết controller.list: đọc page/limit từ query, kẹp limit tối đa 50, tính offset.",
      "Viết controller.detail: id không tồn tại → 404 { error: 'user_not_found' }.",
      "Viết controller.create: thiếu email → 400; thành công → 201 kèm bản ghi mới.",
      "Chú thích câu SQL tham số hóa cho từng phương thức trong Repository.",
      "Commit 'feat: users CRUD + pagination' và thử luồng bằng dữ liệu seed (bài 68)."
    ],
    commonMistakes: [
      { symptom: "GET /api/users trả 100.000 dòng làm treo cả server lẫn trình duyệt.", cause: "Không phân trang.", fix: "LIMIT/OFFSET + kẹp limit tối đa ngay từ route đầu tiên." },
      { symptom: "Xoá thành công nhưng trả 200 kèm body rỗng khó hiểu.", cause: "Không dùng 204 No Content.", fix: "DELETE thành công trả 204, không body." },
      { symptom: "limit=999999 từ client vẫn được chấp nhận.", cause: "Tin tham số query.", fix: "Math.min(50, ...) — Never trust user input áp cả cho phân trang." }
    ],
    challenge: "Thêm tìm kiếm ?q= lọc theo tên (LIKE tham số hóa) kết hợp được với phân trang — và chú thích index nào cần thêm (bài 42).",
    checklist: [
      "Đủ 5 route với status code đúng ngữ nghĩa",
      "list có phân trang + kẹp limit",
      "Mọi SQL trong chú thích đều dạng tham số hóa"
    ],
    tasks: ["Dựng 5 route CRUD /api/users với status 201/200/404/204 và phân trang page/limit (kẹp tối đa 50)."],
    starterCode: `// BÀI 72 — Cột mốc 2: CRUD /api/users
// TODO 1: 5 route POST/GET/GET:id/PUT/DELETE
// TODO 2: list — page, limit (Math.min 50), offset = (page-1)*limit
// TODO 3: detail — 404 khi không thấy; create — 400 thiếu email, 201 thành công
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("post") && c.includes("put") && c.includes("delete") && c.includes("limit") && c.includes("offset") && c.includes("404") && c.includes("201");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Tạo mới tài nguyên thành công, API nên trả status nào?",
      snippet: "POST /api/users → { id: 15, ... }",
      options: [
        { text: "200 OK", correct: false },
        { text: "201 Created", correct: true },
        { text: "204 No Content", correct: false },
        { text: "302 Found", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "GET /api/users/:id không tìm thấy thì trả gì?", o: ["200 + null", "404 + mã lỗi rõ ràng", "500", "301"], a: 1 },
      { q: "Vì sao phải kẹp limit tối đa phía server?", o: ["Đẹp URL", "Client có thể gửi limit khổng lồ đánh sập server", "SQL yêu cầu", "Cho nhanh"], a: 1 },
      { q: "OFFSET của trang 3, limit 10 là bao nhiêu?", o: ["3", "10", "20", "30"], a: 2 },
      { q: "DELETE thành công chuẩn REST trả gì?", o: ["200 + body 'đã xoá'", "204 No Content", "404", "201"], a: 1 }
    ]
  },
  {
    id: "lesson73",
    title: "73. Xác thực JWT cho luồng Đăng nhập / Đăng xuất",
    lang: "javascript",
    file: "src/lesson73.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 3: cửa an ninh của đồ án — đăng ký băm bcrypt, đăng nhập phát JWT, middleware chặn mọi route cần danh tính. Ghép bài 33 + 54 thành code chạy thật.",
      outcomes: [
        "Route /api/auth/register băm mật khẩu trước khi lưu",
        "Route /api/auth/login so bằng verify rồi ký JWT có hạn",
        "Middleware requireAuth đọc Bearer token gắn req.user"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Ba mảnh ghép xác thực (Node dùng thư viện \`bcrypt\` và \`jsonwebtoken\`):

\`\`\`javascript
// Đăng ký
const hash = await bcrypt.hash(password, 10);
await userRepo.create({ email, password: hash });

// Đăng nhập
const ok = user && await bcrypt.compare(password, user.password);
if (!ok) return res.status(401).json({ error: "invalid_credentials" });
const token = jwt.sign({ sub: user.id, email }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Middleware
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "unauthorized" }); }
}
\`\`\`

> Sai email hay sai mật khẩu đều trả CÙNG một thông báo — không cho kẻ dò biết email nào tồn tại. JWT_SECRET nằm trong .env (đã gitignore từ bài 67). Đăng xuất với JWT stateless = client xoá token.`,
    labSteps: [
      "Viết register(req, res): validate email (bài 15) → bcrypt.hash cost 10 → create → 201 (KHÔNG trả lại hash).",
      "Viết login(req, res): tìm user → bcrypt.compare → sai trả 401 chung chung → đúng ký jwt.sign hạn 7 ngày.",
      "Viết middleware requireAuth theo khuôn — gắn req.user rồi next().",
      "Bọc route bài 72: PUT/DELETE /api/users/:id phải qua requireAuth.",
      "Chú thích luồng đăng xuất phía client: xoá token khỏi bộ nhớ.",
      "Commit 'feat: auth JWT (register/login/middleware)'."
    ],
    commonMistakes: [
      { symptom: "Trả 'email không tồn tại' và 'sai mật khẩu' riêng biệt.", cause: "Rò rỉ thông tin cho kẻ dò tài khoản.", fix: "Một thông báo chung invalid_credentials cho cả hai." },
      { symptom: "Response đăng ký trả về cả trường password hash.", cause: "res.json nguyên bản ghi.", fix: "Loại bỏ trường nhạy cảm trước khi trả — chọn trường trắng danh sách." },
      { symptom: "JWT_SECRET = 'secret123' viết cứng trong code.", cause: "Chưa dùng biến môi trường.", fix: "Sinh chuỗi ngẫu nhiên dài (openssl rand -hex 32) đặt trong .env." }
    ],
    challenge: "Thêm rate limit thô cho /api/auth/login: quá 5 lần sai trong 15 phút theo IP thì trả 429 — chống brute-force (hoàn thiện ở bài 83).",
    checklist: [
      "register không bao giờ lưu/trả mật khẩu thô",
      "login sai kiểu gì cũng chỉ một thông báo 401",
      "Route ghi dữ liệu đã được bọc requireAuth"
    ],
    tasks: ["Viết register (bcrypt.hash), login (bcrypt.compare + jwt.sign expiresIn) và middleware requireAuth (jwt.verify, req.user)."],
    starterCode: `// BÀI 73 — Cột mốc 3: Auth JWT
// TODO 1: register — validate, bcrypt.hash(password, 10), 201
// TODO 2: login — bcrypt.compare, sai -> 401 invalid_credentials, đúng -> jwt.sign({sub, email}, JWT_SECRET, {expiresIn: "7d"})
// TODO 3: requireAuth — đọc Bearer, jwt.verify, req.user, next()
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("bcrypt.hash(") && c.includes("bcrypt.compare(") && c.includes("jwt.sign(") && c.includes("jwt.verify(") && c.includes("expiresIn") && c.includes("401");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao sai email và sai mật khẩu phải trả CÙNG một thông báo lỗi?",
      snippet: "401 { error: \"invalid_credentials\" } // cho cả hai trường hợp",
      options: [
        { text: "Viết code cho ngắn", correct: false },
        { text: "Không cho kẻ tấn công dò được email nào tồn tại trong hệ thống", correct: true },
        { text: "Chuẩn HTTP bắt buộc", correct: false },
        { text: "Tránh lỗi font", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Đăng xuất với JWT stateless thực hiện thế nào?", o: ["Server xoá session", "Client xoá token khỏi bộ nhớ", "Đổi JWT_SECRET", "Gọi API /logout là bắt buộc"], a: 1 },
      { q: "expiresIn trong jwt.sign để làm gì?", o: ["Nén token", "Token tự hết hạn sau thời gian định trước", "Mã hóa payload", "Đặt tên token"], a: 1 },
      { q: "Middleware requireAuth gắn gì vào request?", o: ["Cookie mới", "req.user từ payload đã verify", "Mật khẩu", "CSS"], a: 1 },
      { q: "JWT_SECRET nên được tạo và lưu thế nào?", o: ["'123456' cho dễ nhớ", "Chuỗi ngẫu nhiên dài, lưu trong .env", "Trong README", "Trong database"], a: 1 }
    ]
  },
  {
    id: "lesson74",
    title: "74. Khởi tạo cấu trúc Frontend Client hiện đại",
    lang: "javascript",
    file: "src/lesson74.js",
    duration: "50 phút",
    overview: {
      description: "Cột mốc 4: mở mặt trận giao diện — khởi tạo dự án Vite/React, cây thư mục components/pages/hooks/services và quy ước import gọn gàng ngay từ đầu.",
      outcomes: [
        "Khởi tạo dự án bằng npm create vite (template react)",
        "Dựng cây thư mục frontend 5 nhánh chuẩn",
        "Tách config: hằng số API_BASE đọc từ biến môi trường VITE_*"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Khởi tạo frontend chuẩn:
\`\`\`bash
npm create vite@latest frontend -- --template react
cd frontend && npm install && npm run dev   # cổng mặc định 5173
\`\`\`

Cây thư mục 5 nhánh:
> \`src/components\` — nút, form, card dùng chung • \`src/pages\` — Login, Register, Chat, Dashboard • \`src/hooks\` — logic tái sử dụng (useAuth, useFetch) • \`src/services\` — mọi lời gọi API (bài 77) • \`src/utils\` — hàm thuần.

Biến môi trường frontend (Vite): file \`.env\` với tiền tố **VITE_**, đọc bằng \`import.meta.env.VITE_API_URL\` — nhớ: biến này BUNDLE vào code client, không bao giờ đặt secret ở đây.

\`\`\`javascript
// src/config.js
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
\`\`\``,
    labSteps: [
      "Chạy npm create vite tạo dự án frontend trong repo đồ án (hoặc mô phỏng cấu trúc trong editor).",
      "Dựng 5 thư mục: components, pages, hooks, services, utils — mỗi thư mục 1 file index giữ chỗ.",
      "Viết src/config.js export API_BASE đọc từ import.meta.env.VITE_API_URL có fallback localhost.",
      "Tạo .env.example với VITE_API_URL — file .env thật đã nằm trong .gitignore.",
      "Viết khung App: route giữ chỗ cho 4 trang Login/Register/Chat/Dashboard (mảng ROUTES).",
      "Commit 'feat: khởi tạo frontend Vite + cấu trúc thư mục'."
    ],
    commonMistakes: [
      { symptom: "Đặt GEMINI_KEY vào .env frontend với tiền tố VITE_.", cause: "Không hiểu biến VITE_ bị nhúng vào bundle công khai.", fix: "Secret chỉ ở backend; frontend chỉ giữ URL và cấu hình công khai." },
      { symptom: "Gọi API viết thẳng http://localhost:8081 trong 20 component.", cause: "Không tách config.", fix: "Một hằng API_BASE duy nhất — đổi môi trường sửa một nơi." },
      { symptom: "Nhét cả trang Login vào components/.", cause: "Lẫn khái niệm: page là màn hình theo route, component là mảnh ghép.", fix: "Màn hình → pages/; mảnh tái sử dụng → components/." }
    ],
    challenge: "Viết hook useLocalStorage(key, initial) trong hooks/ — sẽ dùng cho token và cấu hình ngôn ngữ ở các bài sau.",
    checklist: [
      "Dự án chạy npm run dev hiện trang mặc định",
      "5 thư mục đúng vai trò + config.js tách riêng",
      ".env.example có VITE_API_URL, .env đã ignore"
    ],
    tasks: ["Dựng cấu trúc: 5 thư mục chuẩn, config.js đọc import.meta.env.VITE_API_URL, mảng ROUTES 4 trang."],
    starterCode: `// BÀI 74 — Cột mốc 4: Khung Frontend
// TODO 1: chú thích lệnh khởi tạo: npm create vite@latest frontend -- --template react
// TODO 2: config.js — export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api"
// TODO 3: ROUTES = [login, register, chat, dashboard]
// TODO 4: liệt kê 5 thư mục: components/pages/hooks/services/utils
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("import.meta.env.vite_") && c.includes("api_base") && c.includes("components") && c.includes("pages") && c.includes("hooks") && c.includes("services");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao KHÔNG đặt khóa bí mật vào biến VITE_ của frontend?",
      snippet: ".env: VITE_GEMINI_KEY=AIza... // nguy hiểm!",
      options: [
        { text: "Vite không đọc được", correct: false },
        { text: "Biến VITE_ được nhúng vào bundle công khai — ai cũng xem được", correct: true },
        { text: "Làm chậm build", correct: false },
        { text: "Sai cú pháp", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Hook tái sử dụng logic (useAuth...) đặt ở thư mục nào?", o: ["components", "hooks", "pages", "utils"], a: 1 },
      { q: "Biến môi trường Vite phải có tiền tố gì?", o: ["ENV_", "VITE_", "REACT_", "APP_"], a: 1 },
      { q: "Trang Login theo route đặt ở đâu?", o: ["components/", "pages/", "services/", "public/"], a: 1 },
      { q: "Vì sao tách API_BASE ra config?", o: ["Cho dài code", "Đổi môi trường dev/production chỉ sửa một nơi", "Vite bắt buộc", "Chạy nhanh hơn"], a: 1 }
    ]
  },
  {
    id: "lesson75",
    title: "75. Giao diện Đăng Nhập & Đăng Ký cao cấp",
    lang: "html",
    file: "src/lesson75.html",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 5: cánh cửa đầu tiên người dùng chạm vào — form đăng nhập/đăng ký đủ trạng thái UI, validate 2 tầng và chống bấm trùng, áp trọn chuẩn bài 6, 17, 22.",
      outcomes: [
        "Dựng form đăng nhập chuẩn: label gắn for, type đúng, required, autocomplete",
        "Xử lý onSubmit: preventDefault, khóa nút khi đang gửi, báo lỗi 400/401 rõ ràng",
        "Lưu token sau đăng nhập và điều hướng vào Dashboard"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Form xác thực chuẩn gồm 3 tầng hành vi:

1. **HTML đúng chuẩn** (bài 6): \`<label for>\`, \`type="email"/"password"\`, \`required\`, \`minlength="8"\`, \`autocomplete="email|current-password"\` — trình duyệt hỗ trợ tự điền an toàn.
2. **JS submit** (bài 5, 36):
\`\`\`javascript
form.addEventListener("submit", async (e) => {
  e.preventDefault();                       // chặn tải lại trang
  btn.disabled = true; btn.textContent = "Đang đăng nhập...";
  try {
    const res = await fetch(API_BASE + "/auth/login", { ...body... });
    if (!res.ok) throw new Error((await res.json()).error);
    const { token } = await res.json();
    localStorage.setItem("token", token);
    location.href = "/dashboard";
  } catch (err) { showError(err.message); }
  finally { btn.disabled = false; btn.textContent = "Đăng nhập"; }
});
\`\`\`
3. **Trạng thái UI** (bài 17): loading trên nút, khung lỗi màu đỏ có role="alert", focus vào ô sai.`,
    labSteps: [
      "Dựng HTML 2 form (đăng nhập / đăng ký) đủ chuẩn: label-for, type đúng, required, autocomplete.",
      "Viết CSS trạng thái: input:focus viền primary, nút :disabled mờ + not-allowed, .error-box đỏ đạt tương phản.",
      "Viết JS submit theo khuôn: preventDefault → khóa nút → fetch → phân nhánh ok/lỗi → finally mở nút.",
      "Đăng nhập thành công: localStorage.setItem('token') và điều hướng.",
      "Test 3 kịch bản: đúng, sai mật khẩu (thông báo hiện), mất mạng (catch hoạt động).",
      "Commit 'feat: trang đăng nhập/đăng ký'."
    ],
    commonMistakes: [
      { symptom: "Bấm Đăng nhập trang tải lại trắng.", cause: "Quên e.preventDefault().", fix: "Dòng đầu tiên của handler submit luôn là preventDefault." },
      { symptom: "Bấm nhanh 3 lần tạo 3 request.", cause: "Không khóa nút khi đang gửi.", fix: "disabled ngay khi vào handler, mở lại trong finally." },
      { symptom: "Thông báo lỗi 'Error: [object Object]'.", cause: "Ném nguyên object vào Error.", fix: "Đọc trường error từ JSON: throw new Error(data.error || 'Lỗi không xác định')." }
    ],
    challenge: "Thêm chỉ báo độ mạnh mật khẩu ở form đăng ký (yếu/khá/mạnh) cập nhật theo sự kiện input — thuần CSS class + JS.",
    checklist: [
      "Form đạt chuẩn label/type/required/autocomplete",
      "Nút có 3 trạng thái: thường / loading / disabled",
      "3 kịch bản test đều hành xử đúng"
    ],
    tasks: ["Dựng form chuẩn + JS submit: preventDefault, khóa nút, fetch login, lưu token, hiển thị lỗi, finally mở nút."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bài 75: Đăng nhập</title>
  <style>/* TODO: :focus, :disabled, .error-box */</style>
</head>
<body>
  <form id="login-form">
    <!-- TODO: label for + input type=email required autocomplete=email -->
    <!-- TODO: label for + input type=password required minlength=8 autocomplete=current-password -->
    <div class="error-box" role="alert" hidden></div>
    <button type="submit">Đăng nhập</button>
  </form>
  <script>
    // TODO: submit — preventDefault, disabled, fetch, localStorage.setItem("token"), finally
  </script>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("preventdefault()") && c.includes("disabled") && c.includes('type="password"') && c.includes("localstorage.setitem") && c.includes("finally");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Dòng ĐẦU TIÊN trong handler submit của form SPA phải là gì?",
      snippet: "form.addEventListener('submit', async (e) => { [ ... ]; ... })",
      options: [
        { text: "fetch(...)", correct: false },
        { text: "e.preventDefault() — chặn hành vi tải lại trang mặc định", correct: true },
        { text: "alert('OK')", correct: false },
        { text: "console.log(e)", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao khóa nút submit khi đang gửi?", o: ["Cho đẹp", "Tránh người dùng bấm trùng tạo nhiều request", "Tiết kiệm pin", "Chuẩn W3C"], a: 1 },
      { q: "autocomplete=\"current-password\" giúp gì?", o: ["Tự đoán mật khẩu", "Trình quản lý mật khẩu của trình duyệt điền đúng và an toàn", "Ẩn mật khẩu", "Mã hóa mật khẩu"], a: 1 },
      { q: "Khối finally trong luồng submit dùng để?", o: ["Bắt lỗi", "Luôn mở lại nút dù thành công hay thất bại", "Gửi lại request", "Xoá form"], a: 1 },
      { q: "role=\"alert\" trên khung lỗi có tác dụng gì?", o: ["Đổi màu đỏ", "Trình đọc màn hình đọc ngay thông báo cho người khiếm thị", "Chặn XSS", "Tự ẩn sau 3s"], a: 1 }
    ]
  },
  {
    id: "lesson76",
    title: "76. Định tuyến Client-Side & Protected Routes",
    lang: "javascript",
    file: "src/lesson76.js",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 6: bản đồ ứng dụng — điều hướng không tải lại trang và hàng rào Protected Route đá người chưa đăng nhập về /login.",
      outcomes: [
        "Giải thích client-side routing khác điều hướng truyền thống",
        "Viết ProtectedRoute: không có token → chuyển hướng /login",
        "Xử lý token hết hạn: 401 từ API → xoá token → về /login"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Client-side routing** (react-router-dom): đổi URL và render component tương ứng NGAY tại client, không request HTML mới — chuyển trang tức thời như app.

\`\`\`javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/dashboard" element={
    <ProtectedRoute><Dashboard /></ProtectedRoute>
  } />
</Routes>

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
\`\`\`

> Hàng rào client chỉ là TRẢI NGHIỆM — dữ liệu thật vẫn do backend requireAuth (bài 73) bảo vệ: kẻ xấu sửa được JS client nhưng không giả được chữ ký JWT. Token hết hạn giữa chừng: API trả 401 → interceptor xoá token, đưa về /login (làm ở bài 77).`,
    labSteps: [
      "Viết bảng ROUTES: path → tên component → cần đăng nhập? (login/register: không; chat/dashboard: có).",
      "Viết ProtectedRoute(children) theo khuôn: đọc token, thiếu thì Navigate về /login (mô phỏng bằng hàm redirect).",
      "Viết hàm navigate(path) mô phỏng: cập nhật history.pushState + render lại (hiểu bản chất router).",
      "Viết handleUnauthorized(): xoá token + navigate('/login') — sẽ được interceptor gọi khi 401.",
      "Chú thích: giải thích vì sao chặn ở client là chưa đủ, backend mới là hàng rào thật.",
      "Commit 'feat: router + protected routes'."
    ],
    commonMistakes: [
      { symptom: "Nghĩ ProtectedRoute là đủ bảo mật, API mở toang.", cause: "Nhầm hàng rào UX với hàng rào an ninh.", fix: "Mọi API nhạy cảm đều phải qua requireAuth server-side — client chỉ là lớp trải nghiệm." },
      { symptom: "F5 ở /dashboard ra 404 khi deploy.", cause: "Server tĩnh không biết route ảo của SPA.", fix: "Cấu hình fallback về index.html (nhớ điều này đến bài 94 Nginx)." },
      { symptom: "Đăng xuất rồi bấm Back vẫn thấy trang cũ.", cause: "Trang được cache/không kiểm tra lại token.", fix: "ProtectedRoute kiểm tra token mỗi lần render; dữ liệu nhạy cảm luôn fetch lại." }
    ],
    challenge: "Thêm phân quyền role: route /admin chỉ cho token có payload role==='admin' — decode payload (bài 54) ngay tại client để ẨN menu, còn kiểm thật ở server.",
    checklist: [
      "Bảng ROUTES phân loại công khai/bảo vệ rõ ràng",
      "ProtectedRoute chuyển hướng đúng khi thiếu token",
      "Thuộc câu: client chặn cho đẹp, server chặn cho thật"
    ],
    tasks: ["Viết ROUTES, ProtectedRoute (token → children, không → redirect /login) và handleUnauthorized xoá token."],
    starterCode: `// BÀI 76 — Cột mốc 6: Router & Protected Routes
// TODO 1: ROUTES = [{path, component, protected}]
// TODO 2: ProtectedRoute(children) — !token -> redirect("/login")
// TODO 3: handleUnauthorized() — localStorage.removeItem("token") + redirect
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const readsToken = c.includes('localstorage.getitem("token")') || c.includes("localstorage.getitem('token')");
      return c.includes("protectedroute") && readsToken && c.includes("/login") && c.includes("removeitem");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Protected Route ở client có thay được xác thực phía server không?",
      snippet: "if (!token) return <Navigate to=\"/login\" />;",
      options: [
        { text: "Có — chặn client là đủ", correct: false },
        { text: "Không — chỉ là lớp trải nghiệm; API vẫn phải kiểm JWT ở server", correct: true },
        { text: "Có nếu code obfuscate", correct: false },
        { text: "Tuỳ framework", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Client-side routing khác gì điều hướng truyền thống?", o: ["Không khác", "Đổi URL và render tại client, không tải lại HTML từ server", "Chậm hơn", "Chỉ chạy trên mobile"], a: 1 },
      { q: "Người dùng chưa đăng nhập vào /dashboard thì ProtectedRoute làm gì?", o: ["Hiện trang trắng", "Chuyển hướng về /login", "Báo 500", "Tự đăng nhập"], a: 1 },
      { q: "API trả 401 giữa phiên thì client nên?", o: ["Thử lại 100 lần", "Xoá token và đưa người dùng về /login", "Bỏ qua", "Đổi URL API"], a: 1 },
      { q: "F5 tại route SPA bị 404 trên production do đâu?", o: ["Bug React", "Server tĩnh chưa fallback về index.html", "Token hỏng", "DNS sai"], a: 1 }
    ]
  },
  {
    id: "lesson77",
    title: "77. Tầng Fetch API tập trung & Global Error Handling",
    lang: "javascript",
    file: "src/lesson77.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 7: một cửa ngõ duy nhất cho mọi lời gọi API — tự đính token, tự parse JSON, tự xử lý 401 — hết cảnh copy fetch 30 chỗ mỗi nơi một kiểu.",
      outcomes: [
        "Viết apiCall(path, options) dùng chung: base URL + headers + token tự động",
        "Chuẩn hóa lỗi: ném ApiError có status và message máy-đọc-được",
        "Móc handleUnauthorized vào nhánh 401 — một nơi, mọi request"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Khuôn service tầng API (nguyên tắc DRY bài 22 áp vào mạng):

\`\`\`javascript
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function apiCall(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { handleUnauthorized(); }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || "unknown_error");
  }
  return res.status === 204 ? null : res.json();
}
// Cách dùng: const users = await apiCall("/users?page=1");
//            await apiCall("/auth/login", { method: "POST", body: { email, password } });
\`\`\`
Mọi component từ nay chỉ gọi apiCall — đổi cách auth, thêm log, thêm retry: sửa MỘT file.`,
    labSteps: [
      "Viết class ApiError extends Error có thêm this.status.",
      "Viết apiCall theo khuôn: default GET, spread header Authorization chỉ khi có token.",
      "Nhánh 401: gọi handleUnauthorized() của bài 76 TRƯỚC khi ném lỗi.",
      "Nhánh !res.ok: đọc JSON an toàn bằng .catch(() => ({})) rồi ném ApiError.",
      "Nhánh 204 trả null (khớp DELETE bài 72).",
      "Viết 3 hàm service mỏng minh họa: authService.login, userService.list, userService.remove — tất cả qua apiCall.",
      "Commit 'feat: api layer tập trung'."
    ],
    commonMistakes: [
      { symptom: "30 component mỗi nơi một kiểu fetch, nơi nhớ token nơi quên.", cause: "Không có tầng API chung.", fix: "Cấm fetch trực tiếp trong component — mọi thứ qua apiCall." },
      { symptom: "res.json() nổ khi body lỗi không phải JSON.", cause: "Server lỗi 502 trả HTML.", fix: ".json().catch(() => ({})) — đọc an toàn rồi mới ném ApiError." },
      { symptom: "DELETE 204 mà cứ chờ res.json() rồi crash.", cause: "204 không có body.", fix: "Nhánh riêng: 204 trả null." }
    ],
    challenge: "Thêm retry tự động: lỗi mạng (fetch throw) hoặc 503 thì thử lại tối đa 2 lần với backoff 500ms/1000ms — chỉ cho method GET (an toàn lặp lại).",
    checklist: [
      "apiCall tự đính token và Content-Type",
      "401 đi qua đúng một cửa handleUnauthorized",
      "Component chỉ biết service, không biết fetch"
    ],
    tasks: ["Viết ApiError (status), apiCall (token tự động, nhánh 401/không-ok/204) và 3 service mỏng dùng nó."],
    starterCode: `// BÀI 77 — Cột mốc 7: Tầng API tập trung
// TODO 1: class ApiError extends Error { constructor(status, message) }
// TODO 2: apiCall(path, {method, body}) — Bearer tự động, 401 -> handleUnauthorized, !ok -> throw ApiError, 204 -> null
// TODO 3: authService.login / userService.list / userService.remove
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("classApiErrorextendsError") && c.includes("Authorization") && c.includes("401") && c.includes("204") && c.includes("thrownewApiError");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Lợi ích lớn nhất của tầng apiCall tập trung là gì?",
      snippet: "component -> service -> apiCall -> fetch",
      options: [
        { text: "Chạy nhanh hơn fetch", correct: false },
        { text: "Token, lỗi, retry xử lý MỘT nơi — sửa một file ăn mọi request", correct: true },
        { text: "Không cần backend", correct: false },
        { text: "Miễn nhiễm CORS", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Header Authorization chỉ nên đính khi nào?", o: ["Luôn luôn kể cả rỗng", "Khi có token — spread điều kiện", "Chỉ với GET", "Không bao giờ"], a: 1 },
      { q: "Vì sao ApiError cần trường status?", o: ["Cho đẹp", "Nơi bắt lỗi phân nhánh theo mã (401 khác 429 khác 500)", "Console yêu cầu", "Để retry vô hạn"], a: 1 },
      { q: "Retry tự động chỉ nên áp cho method nào?", o: ["POST", "GET — an toàn khi lặp lại (idempotent)", "DELETE", "Mọi method"], a: 1 },
      { q: "Response 204 xử lý thế nào?", o: ["res.json() bình thường", "Trả null — không có body để parse", "Ném lỗi", "Đợi body 5s"], a: 1 }
    ]
  },
  {
    id: "lesson78",
    title: "78. Quản lý trạng thái ứng dụng tập trung (Global State)",
    lang: "javascript",
    file: "src/lesson78.js",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 8: một nguồn sự thật duy nhất cho user, token, ngôn ngữ, số dư — tự cài store pattern subscribe/setState để hiểu bản chất trước khi dùng Zustand/Context.",
      outcomes: [
        "Nhận diện prop drilling và lý do cần store tập trung",
        "Tự cài store mini: getState, setState, subscribe (observer pattern)",
        "Quy hoạch state đồ án: gì vào store, gì ở local component"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Prop drilling** — chuyền dữ liệu qua 5 tầng component chỉ để tầng cuối dùng: mỗi lần đổi phải sửa cả chuỗi. Giải pháp: **store tập trung** — mọi component đọc/ghi một nguồn:

\`\`\`javascript
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn(state));   // báo mọi nơi đang lắng nghe
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
const authStore = createStore({ user: null, token: null, lang: "vi" });
\`\`\`

> Đây chính là lõi của Zustand/Redux — hiểu 15 dòng này là hiểu mọi thư viện state. Quy hoạch: vào store = dữ liệu NHIỀU nơi cần (user, token, lang, số dư); ở lại component = trạng thái cục bộ (ô input đang gõ, modal đang mở).
> subscribe trả về hàm hủy — nhớ gọi khi component rời trang (bài 40: tránh rò rỉ).`,
    labSteps: [
      "Viết createStore theo khuôn: getState, setState (merge patch + notify), subscribe (trả unsubscribe).",
      "Tạo authStore { user, token, lang } và cập nhật luồng login bài 75: setState sau khi đăng nhập.",
      "Viết ví dụ 2 'component' cùng subscribe: header hiện tên user, sidebar hiện ngôn ngữ — setState một lần cả hai log thay đổi.",
      "Gọi unsubscribe cho một component và setState lại — xác nhận nó không còn nhận tin.",
      "Viết bảng quy hoạch state: 4 thứ vào store, 3 thứ ở local — kèm lý do.",
      "Commit 'feat: store trạng thái tập trung'."
    ],
    commonMistakes: [
      { symptom: "Nhét cả giá trị ô input đang gõ vào store toàn cục.", cause: "Lạm dụng store.", fix: "Trạng thái cục bộ ở lại component — store chỉ giữ thứ nhiều nơi cần." },
      { symptom: "setState ghi đè mất các trường khác.", cause: "Gán state = patch thay vì merge.", fix: "{ ...state, ...patch } — luôn merge." },
      { symptom: "Component rời trang vẫn nhận notify gây lỗi.", cause: "Quên unsubscribe.", fix: "Lưu hàm hủy từ subscribe và gọi khi unmount (khuôn cleanup bài 40)." }
    ],
    challenge: "Thêm persist: state tự lưu localStorage mỗi lần setState và khôi phục khi tạo store — token sống sót qua F5.",
    checklist: [
      "createStore đủ 3 phương thức chạy đúng",
      "Hai subscriber cùng nhận một setState",
      "Bảng quy hoạch store/local có lý do rõ"
    ],
    tasks: ["Viết createStore (getState/setState merge/subscribe với Set), authStore và demo 2 subscriber + unsubscribe."],
    starterCode: `// BÀI 78 — Cột mốc 8: Store tập trung tự cài
// TODO 1: createStore(initialState) — getState, setState({...state,...patch}) + notify, subscribe -> unsubscribe
// TODO 2: authStore = createStore({user: null, token: null, lang: "vi"})
// TODO 3: 2 subscriber demo + unsubscribe một cái
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("createstore") && c.includes("getstate") && c.includes("setstate") && c.includes("subscribe") && c.includes("...state,...patch") && c.includes("newset()");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Dữ liệu nào XỨNG ĐÁNG nằm trong store toàn cục?",
      snippet: "store: { ??? } — component: { ??? }",
      options: [
        { text: "Giá trị ô input đang gõ", correct: false },
        { text: "User, token, ngôn ngữ — thứ nhiều component cùng cần", correct: true },
        { text: "Trạng thái mở/đóng của một modal", correct: false },
        { text: "Vị trí scroll tạm thời", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Prop drilling là gì?", o: ["Kỹ thuật tối ưu", "Chuyền props qua nhiều tầng trung gian không dùng đến nó", "Khoan dữ liệu", "Lỗi React"], a: 1 },
      { q: "setState chuẩn phải làm gì với state cũ?", o: ["Ghi đè toàn bộ", "Merge patch vào state cũ rồi thông báo listeners", "Xoá sạch", "Clone 2 lần"], a: 1 },
      { q: "subscribe trả về gì và để làm gì?", o: ["State mới", "Hàm unsubscribe — gọi khi rời trang để tránh rò rỉ", "Promise", "Token"], a: 1 },
      { q: "Mẫu thiết kế đứng sau store subscribe/notify là gì?", o: ["Singleton", "Observer (Pub/Sub)", "Factory", "Adapter"], a: 1 }
    ]
  },
  {
    id: "lesson79",
    title: "79. Hệ thống đa ngôn ngữ (i18n) động",
    lang: "javascript",
    file: "src/lesson79.js",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 9: yêu cầu bắt buộc của đồ án — song ngữ Việt-Anh chuyển đổi tức thời: từ điển key-value, hàm t(), nội suy biến và lưu lựa chọn người dùng.",
      outcomes: [
        "Dựng từ điển vi.json / en.json cùng bộ key thống nhất",
        "Viết t(key, params) có nội suy {name} và fallback khi thiếu key",
        "Chuyển ngôn ngữ runtime: cập nhật store + lưu localStorage + đổi <html lang>"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Kiến trúc i18n tối giản (đúng cách react-i18next vận hành bên dưới):

\`\`\`javascript
const dictionaries = {
  vi: { welcome: "Chào mừng {name}!", "nav.chat": "Trò chuyện", "btn.save": "Lưu" },
  en: { welcome: "Welcome {name}!", "nav.chat": "Chat", "btn.save": "Save" }
};

function t(key, params = {}) {
  const lang = authStore.getState().lang;
  let text = dictionaries[lang]?.[key] ?? dictionaries.vi[key] ?? key;  // fallback 2 tầng
  for (const [k, v] of Object.entries(params)) text = text.replaceAll("{" + k + "}", v);
  return text;
}

function setLanguage(lang) {
  authStore.setState({ lang });
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;   // SEO + trình đọc màn hình (bài 1)
}
\`\`\`

> Quy tắc vàng: **không một chuỗi hiển thị nào viết cứng trong component** — tất cả qua t(). Key đặt theo ngữ cảnh 'nav.chat', 'btn.save' — không đặt theo nội dung 'xin_chao_2'.`,
    labSteps: [
      "Dựng dictionaries vi/en tối thiểu 10 key phủ các màn hình đã làm (login, nav, nút, thông báo lỗi).",
      "Viết t(key, params) theo khuôn: fallback lang → vi → chính key; nội suy bằng replaceAll.",
      "Viết setLanguage: store + localStorage + document.documentElement.lang.",
      "Khởi động app: đọc lang từ localStorage ?? 'vi'.",
      "Demo: render câu chào t('welcome', {name: 'Hugo'}) rồi setLanguage('en') — subscriber (bài 78) render lại.",
      "Commit 'feat: i18n song ngữ Việt-Anh'."
    ],
    commonMistakes: [
      { symptom: "Đổi ngôn ngữ nhưng nửa giao diện vẫn tiếng Việt.", cause: "Chuỗi viết cứng rải rác trong component.", fix: "Quét toàn bộ: mọi chuỗi hiển thị phải qua t() ngay từ khi viết." },
      { symptom: "Thiếu key ở en.json là hiện undefined lên màn hình.", cause: "Không có fallback.", fix: "Fallback 2 tầng: ngôn ngữ hiện tại → vi → hiện chính key để dễ phát hiện." },
      { symptom: "Ghép chuỗi 'Xin chào ' + name + '!' rồi mới dịch.", cause: "Ngữ pháp các ngôn ngữ khác nhau, ghép cứng là vỡ.", fix: "Dùng nội suy trong bản dịch: 'Welcome {name}!' — vị trí biến do bản dịch quyết." }
    ],
    challenge: "Thêm ngôn ngữ thứ ba (en → thêm ja hoặc ko chỉ 5 key) để chứng minh kiến trúc mở rộng không sửa code — chỉ thêm từ điển.",
    checklist: [
      "10+ key phủ màn hình hiện có, không chuỗi cứng",
      "t() có fallback và nội suy chạy đúng",
      "Lựa chọn ngôn ngữ sống sót qua F5"
    ],
    tasks: ["Dựng dictionaries vi/en (10 key), t(key, params) fallback + nội suy, setLanguage đồng bộ store/localStorage/html lang."],
    starterCode: `// BÀI 79 — Cột mốc 9: i18n song ngữ
// TODO 1: dictionaries { vi: {...10 key}, en: {...} } — key kiểu "nav.chat"
// TODO 2: t(key, params) — ?? fallback, replaceAll("{k}", v)
// TODO 3: setLanguage(lang) — store + localStorage + document.documentElement.lang
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("vi:") && c.includes("en:") && c.includes("functiont(") && c.includes("replaceall(") && c.includes("documentelement.lang");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Cách đặt key i18n ĐÚNG chuẩn là gì?",
      snippet: "t(\"[ ... ]\") // nút lưu trong form",
      options: [
        { text: "\"luu_2\"", correct: false },
        { text: "\"btn.save\" — theo ngữ cảnh sử dụng", correct: true },
        { text: "\"Lưu\"", correct: false },
        { text: "\"text14\"", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao không ghép chuỗi cứng quanh biến khi dịch?", o: ["Tốn RAM", "Ngữ pháp mỗi ngôn ngữ khác nhau — vị trí biến phải do bản dịch quyết định", "Chậm hơn", "JSON cấm"], a: 1 },
      { q: "Thiếu key ở ngôn ngữ hiện tại thì t() nên trả gì?", o: ["undefined", "Fallback về ngôn ngữ mặc định, cuối cùng là chính key", "Chuỗi rỗng", "Ném lỗi sập app"], a: 1 },
      { q: "Đổi ngôn ngữ cần cập nhật thuộc tính nào của HTML?", o: ["title", "document.documentElement.lang", "charset", "dir bắt buộc"], a: 1 },
      { q: "i18n là viết tắt của gì?", o: ["Internet 18 nations", "Internationalization (i + 18 chữ + n)", "Integration", "Interface18"], a: 1 }
    ]
  },
  {
    id: "lesson80",
    title: "80. Responsive nâng cao đa thiết bị (Mobile → TV)",
    lang: "css",
    file: "src/lesson80.css",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 10: một giao diện chạy đẹp từ điện thoại đến TV — hệ breakpoint mobile-first, fluid layout bằng clamp/minmax và các bẫy px cố định.",
      outcomes: [
        "Dựng hệ 4 breakpoint mobile-first: base → 640 → 1024 → 1440",
        "Dùng đơn vị lỏng: %, clamp(), minmax() thay px cứng",
        "Xử lý khu vực chạm: nút tối thiểu 44px trên màn cảm ứng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Mobile-first** (chuẩn ngành): CSS gốc viết cho màn nhỏ nhất, mở rộng dần bằng \`min-width\`:

\`\`\`css
.layout { display: grid; grid-template-columns: 1fr; gap: 16px; }          /* base: mobile */
@media (min-width: 640px)  { .layout { grid-template-columns: 1fr 1fr; } } /* tablet */
@media (min-width: 1024px) { .layout { grid-template-columns: repeat(3, 1fr); } } /* desktop */
@media (min-width: 1440px) { .layout { max-width: 1320px; margin-inline: auto; } } /* TV/màn lớn */
\`\`\`

Đơn vị lỏng thay số cứng:
> \`clamp(1rem, 2.5vw, 1.5rem)\` — chữ tự co giãn có trần có sàn.
> \`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\` — lưới card TỰ tính số cột, nhiều khi khỏi cần media query.
> Vùng chạm: mọi nút/link trên mobile tối thiểu **44×44px** (chuẩn Apple HIG/WCAG 2.5.8).`,
    labSteps: [
      "Dựng .layout grid mobile-first theo khuôn 4 breakpoint cho trang Dashboard đồ án.",
      "Đổi lưới card sản phẩm sang repeat(auto-fit, minmax(280px, 1fr)) — thu phóng cửa sổ xem lưới tự tính cột.",
      "Áp clamp() cho h1 và .hero-text — hết cảnh chữ khổng lồ trên điện thoại.",
      "Rà mọi nút: min-height 44px, padding đủ vùng chạm.",
      "Kiểm tra bằng DevTools Responsive Mode ở 4 cỡ: 375 / 768 / 1280 / 1920.",
      "Commit 'feat: responsive đa thiết bị'."
    ],
    commonMistakes: [
      { symptom: "Viết desktop trước rồi vá dần xuống mobile bằng max-width chồng chéo.", cause: "Desktop-first khó bảo trì.", fix: "Base là mobile; mỗi breakpoint CHỈ thêm khác biệt bằng min-width." },
      { symptom: "Container width: 1200px gây thanh cuộn ngang trên điện thoại.", cause: "Px cố định cho khối lớn.", fix: "max-width: 1200px + width: 100% — trần chứ không phải kích thước cứng." },
      { symptom: "Link sát nhau trên mobile bấm trượt liên tục.", cause: "Vùng chạm < 44px.", fix: "Tăng padding/min-height cho mọi phần tử tương tác." }
    ],
    challenge: "Thêm dark mode bằng @media (prefers-color-scheme: dark) dùng biến CSS --bg/--text — một bộ biến, hai giao diện.",
    checklist: [
      "4 breakpoint min-width chạy đúng ở 4 cỡ máy",
      "Không còn width px cứng cho khối bố cục",
      "Mọi nút đạt vùng chạm 44px"
    ],
    tasks: ["Viết layout mobile-first 4 breakpoint, lưới auto-fit/minmax, chữ clamp() và nút min-height 44px."],
    starterCode: `/* BÀI 80 — Cột mốc 10: Responsive đa thiết bị
TODO 1: .layout grid 1 cột (base) -> 2 (640) -> 3 (1024) -> max-width 1320 (1440)
TODO 2: .cards { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
TODO 3: h1 { font-size: clamp(1.5rem, 4vw, 2.5rem); }
TODO 4: button { min-height: 44px; } */
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return (c.match(/@media\(min-width/g) || []).length >= 3 && c.includes("clamp(") && c.includes("auto-fit") && c.includes("minmax(") && c.includes("min-height:44px");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chiến lược responsive chuẩn ngành là gì?",
      snippet: "base CSS cho [ ??? ], mở rộng bằng min-width",
      options: [
        { text: "Desktop-first", correct: false },
        { text: "Mobile-first — gốc cho màn nhỏ, min-width mở rộng dần", correct: true },
        { text: "TV-first", correct: false },
        { text: "Print-first", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "clamp(1rem, 2.5vw, 1.5rem) nghĩa là gì?", o: ["Chọn ngẫu nhiên", "Co giãn theo 2.5vw nhưng không nhỏ hơn 1rem, không lớn hơn 1.5rem", "Luôn 2.5vw", "Lỗi cú pháp"], a: 1 },
      { q: "repeat(auto-fit, minmax(280px, 1fr)) có gì hay?", o: ["Đẹp code", "Lưới tự tính số cột theo bề rộng — thường khỏi cần media query", "Chạy nhanh", "Chỉ cho ảnh"], a: 1 },
      { q: "Vùng chạm tối thiểu trên màn cảm ứng?", o: ["24px", "44×44px", "100px", "8px"], a: 1 },
      { q: "Mobile-first dùng loại media query nào?", o: ["max-width", "min-width", "orientation", "aspect-ratio"], a: 1 }
    ]
  },
  {
    id: "lesson81",
    title: "81. Micro-animations nâng tầm trải nghiệm",
    lang: "css",
    file: "src/lesson81.css",
    duration: "50 phút",
    overview: {
      description: "Cột mốc 11: lớp 'hồn' của giao diện — bộ hiệu ứng vi mô có chủ đích: hover, loading spinner, toast trượt, rung cảnh báo — chỉ animate thuộc tính GPU và tôn trọng người dị ứng chuyển động.",
      outcomes: [
        "Dựng 4 hiệu ứng chuẩn: hover nâng, spinner xoay, toast trượt vào, lắc lỗi",
        "Chỉ animate transform/opacity (nối bài 20, 38)",
        "Tôn trọng prefers-reduced-motion — chuẩn tiếp cận WCAG"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Micro-animation có chủ đích: mỗi chuyển động TRẢ LỜI một câu hỏi của người dùng (đã bấm chưa? đang xử lý? thành công chưa? lỗi ở đâu?).

\`\`\`css
.btn { transition: transform 0.2s, box-shadow 0.2s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgb(0 0 0 / 0.15); }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 0.8s linear infinite; }

@keyframes slide-in { from { transform: translateX(120%); opacity: 0; } to { transform: none; opacity: 1; } }
.toast { animation: slide-in 0.3s ease-out; }

@keyframes shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.error-shake { animation: shake 0.25s 2; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
\`\`\`
Nhịp chuẩn: tương tác 150-250ms; vào/ra 200-400ms; > 500ms là 'chậm chạp'. Chỉ transform + opacity — GPU lo, layout yên (bài 38).`,
    labSteps: [
      "Viết .btn hover nâng nhẹ translateY(-2px) + đổ bóng, transition 0.2s.",
      "Viết @keyframes spin + .spinner (border tròn khuyết) 0.8s linear infinite.",
      "Viết @keyframes slide-in cho .toast từ phải vào, 0.3s ease-out.",
      "Viết @keyframes shake cho .error-shake chạy 2 lần khi form sai (gắn class bằng JS bài 75).",
      "Chốt file bằng khối prefers-reduced-motion tắt mọi chuyển động.",
      "Áp cả bộ vào các màn hình đã dựng và commit 'feat: micro-animations'."
    ],
    commonMistakes: [
      { symptom: "Animation margin-left chạy giật trên máy yếu.", cause: "Animate thuộc tính layout.", fix: "Chỉ transform/opacity — translateX thay margin (bài 38)." },
      { symptom: "Mọi thứ đều bay lượn 800ms — người dùng phát mệt.", cause: "Animation không chủ đích, quá dài.", fix: "150-400ms; mỗi hiệu ứng phải trả lời một câu hỏi cụ thể của người dùng." },
      { symptom: "Người dị ứng chuyển động chóng mặt khi dùng app.", cause: "Bỏ qua prefers-reduced-motion.", fix: "Khối media reduce là bắt buộc trong mọi file animation." }
    ],
    challenge: "Làm skeleton loading: khối xám gradient chạy shimmer (background-position + keyframes) cho danh sách chat khi đang tải.",
    checklist: [
      "Đủ 4 hiệu ứng, tất cả chỉ transform/opacity",
      "Không hiệu ứng nào vượt 500ms",
      "Có khối prefers-reduced-motion"
    ],
    tasks: ["Viết 4 hiệu ứng (hover nâng, spin, slide-in, shake) + khối prefers-reduced-motion."],
    starterCode: `/* BÀI 81 — Cột mốc 11: Micro-animations
TODO 1: .btn:hover — translateY(-2px) + shadow, transition 0.2s
TODO 2: @keyframes spin + .spinner 0.8s linear infinite
TODO 3: @keyframes slide-in + .toast 0.3s ease-out
TODO 4: @keyframes shake + .error-shake 0.25s x2
TODO 5: @media (prefers-reduced-motion: reduce) { ... } */
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("@keyframesspin") && c.includes("@keyframesslide-in") && c.includes("@keyframesshake") && c.includes("prefers-reduced-motion") && c.includes("transform");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Hai thuộc tính DUY NHẤT nên animate để mượt trên mọi máy?",
      snippet: "@keyframes ... { to { [ ??? ] } }",
      options: [
        { text: "width và height", correct: false },
        { text: "transform và opacity — GPU xử lý, không đụng layout", correct: true },
        { text: "margin và padding", correct: false },
        { text: "font-size và color", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Nhịp thời gian chuẩn cho hiệu ứng tương tác?", o: ["1-2 giây", "150-250ms", "5ms", "Càng dài càng sang"], a: 1 },
      { q: "prefers-reduced-motion dùng để làm gì?", o: ["Tiết kiệm pin", "Tôn trọng người dùng nhạy cảm với chuyển động — tắt/giảm animation", "Nén CSS", "Tăng FPS"], a: 1 },
      { q: "Toast thông báo nên xuất hiện bằng hiệu ứng nào?", o: ["Nhấp nháy 10 lần", "Trượt vào nhẹ 300ms rồi tự rời đi", "Phóng to toàn màn", "Xoay 360°"], a: 1 },
      { q: "Micro-animation 'có chủ đích' nghĩa là gì?", o: ["Càng nhiều càng tốt", "Mỗi chuyển động trả lời một câu hỏi của người dùng", "Chỉ dùng ở trang chủ", "Do designer thích"], a: 1 }
    ]
  },
  {
    id: "lesson82",
    title: "82. Tối ưu Frontend sâu: Component & Image Lazy Loading",
    lang: "javascript",
    file: "src/lesson82.js",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 12: đồ án bắt đầu nặng — áp code splitting cho trang hiếm dùng, lazy ảnh bằng thuộc tính loading và IntersectionObserver, đo trước-sau bằng Lighthouse.",
      outcomes: [
        "Lazy component trang nặng bằng dynamic import (nối bài 41)",
        "Lazy ảnh 2 kỹ thuật: loading=\"lazy\" và IntersectionObserver",
        "Đo bundle/LCP trước-sau để chứng minh hiệu quả (nối bài 59)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Ba đòn tối ưu tải trang cho đồ án:

1. **Route-level splitting**: trang nặng hiếm vào (Admin, Report) tách chunk — \`const Admin = () => import("./pages/admin.js")\` (React: React.lazy + Suspense).
2. **Ảnh lazy 2 cấp**:
> Cấp 1 — thuộc tính native: \`<img loading="lazy" width height>\` (trình duyệt tự lo).
> Cấp 2 — **IntersectionObserver** khi cần kiểm soát (ảnh nền, animation vào màn hình):
\`\`\`javascript
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.src = e.target.dataset.src;   // nạp thật khi vào khung nhìn
      io.unobserve(e.target);                 // xong thì thôi quan sát
    }
  });
}, { rootMargin: "200px" });                  // nạp sớm trước 200px
document.querySelectorAll("img[data-src]").forEach((img) => io.observe(img));
\`\`\`
3. **Định dạng ảnh**: WebP/AVIF nhẹ hơn JPEG 25-50% — xuất 2 cỡ cho mobile/desktop.
Nguyên tắc bất di bất dịch: đo Lighthouse TRƯỚC và SAU (bài 59) — con số là bằng chứng.`,
    labSteps: [
      "Chạy Lighthouse trên trang Dashboard hiện tại — ghi lại LCP và tổng KB làm baseline.",
      "Viết loadAdminPage() dùng await import() cho trang quản trị (khuôn bài 41).",
      "Thêm loading=\"lazy\" + width/height cho mọi ảnh dưới màn hình đầu (khuôn bài 39).",
      "Viết IntersectionObserver theo khuôn cho ảnh data-src với rootMargin 200px.",
      "Chạy lại Lighthouse — lập bảng trước/sau cho LCP, KB, điểm Performance.",
      "Commit 'perf: lazy loading component + image' kèm bảng số liệu trong message."
    ],
    commonMistakes: [
      { symptom: "Lazy cả ảnh hero — LCP tệ hơn trước khi tối ưu.", cause: "Lazy mù quáng (đã cảnh báo bài 39).", fix: "Above-the-fold tải ngay; chỉ lazy phần dưới." },
      { symptom: "IntersectionObserver nạp ảnh đúng lúc người dùng nhìn thấy — vẫn thấy trống.", cause: "Không có rootMargin nạp sớm.", fix: "rootMargin 200-400px để ảnh sẵn sàng trước khi cuộn tới." },
      { symptom: "Khoe 'nhanh hơn hẳn' nhưng không có số.", cause: "Bỏ bước đo baseline.", fix: "Không có trước-sau thì không có tối ưu — chỉ có cảm giác." }
    ],
    challenge: "Chuyển 3 ảnh nặng nhất của đồ án sang WebP bằng công cụ bất kỳ, dùng <picture> + srcset 2 cỡ — đo lại lần ba.",
    checklist: [
      "Trang nặng đã tách chunk bằng import()",
      "Ảnh dưới màn hình đầu đều lazy + đủ width/height",
      "Bảng số liệu trước/sau đã ghi vào commit/README"
    ],
    tasks: ["Viết dynamic import cho trang nặng và IntersectionObserver (data-src, rootMargin, unobserve) cho ảnh."],
    starterCode: `// BÀI 82 — Cột mốc 12: Lazy loading sâu
// TODO 1: loadAdminPage() — await import("./pages/admin.js")
// TODO 2: IntersectionObserver — isIntersecting -> src = dataset.src -> unobserve, rootMargin 200px
// TODO 3: chú thích bảng đo Lighthouse trước/sau (LCP, KB)
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("awaitimport(") && c.includes("intersectionobserver") && c.includes("isintersecting") && c.includes("dataset.src") && c.includes("unobserve") && c.includes("rootmargin");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "rootMargin: \"200px\" trong IntersectionObserver có tác dụng gì?",
      snippet: "new IntersectionObserver(cb, { rootMargin: \"200px\" })",
      options: [
        { text: "Thêm viền cho ảnh", correct: false },
        { text: "Nạp ảnh SỚM khi còn cách khung nhìn 200px — người dùng không thấy trống", correct: true },
        { text: "Giới hạn ảnh 200px", correct: false },
        { text: "Cache ảnh 200 giây", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Ảnh nào KHÔNG được lazy load?", o: ["Ảnh footer", "Ảnh hero trên màn hình đầu (ảnh LCP)", "Ảnh bình luận", "Ảnh trang 5"], a: 1 },
      { q: "loading=\"lazy\" là kỹ thuật cấp nào?", o: ["Thư viện ngoài", "Native của trình duyệt — một thuộc tính là xong", "Chỉ có ở React", "Cần Service Worker"], a: 1 },
      { q: "Sau khi ảnh đã nạp, observer nên làm gì?", o: ["Quan sát tiếp", "unobserve phần tử đó — xong việc thì buông (tránh lãng phí)", "Xoá ảnh", "Nạp lại"], a: 1 },
      { q: "WebP so với JPEG?", o: ["Nặng hơn", "Nhẹ hơn 25-50% cùng chất lượng hiển thị", "Chỉ chạy trên iOS", "Không hỗ trợ trong suốt"], a: 1 }
    ]
  },
  {
    id: "lesson83",
    title: "83. Bảo mật API Backend: Brute Force, Rate Limit & SQLi",
    lang: "javascript",
    file: "src/lesson83.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 13: gia cố pháo đài trước khi mở cửa — rate limiter tự cài theo IP, khóa đăng nhập sai nhiều lần, rà lại toàn bộ truy vấn tham số hóa và bộ header bảo mật.",
      outcomes: [
        "Tự cài rate limiter cửa sổ trượt theo IP (Map + timestamps)",
        "Khóa tạm tài khoản sau 5 lần đăng nhập sai (chống brute-force)",
        "Rà soát checklist: tham số hóa 100%, header bảo mật, không lộ stack trace"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Rate limiting** — chặn spam/brute-force bằng cửa sổ trượt:

\`\`\`javascript
const hits = new Map();   // ip -> mảng timestamp
function rateLimit(ip, max = 100, windowMs = 60000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= max;    // false -> trả 429 Too Many Requests
}
\`\`\`

**Chống brute-force đăng nhập**: đếm lần sai theo tài khoản+IP; ≥ 5 lần trong 15 phút → khóa tạm 15 phút (trả 429, KHÔNG tiết lộ 'khóa vì sai nhiều' chi tiết thời gian còn lại cho kẻ dò).

**Tổng rà soát trước phát hành** (nối bài 56):
> 100% truy vấn tham số hóa — grep toàn repo tìm nối chuỗi SQL.
> Header bảo mật: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, CSP.
> Lỗi 500 trả thông báo chung — stack trace chỉ ghi log server, không trả về client.`,
    labSteps: [
      "Viết rateLimit(ip, max, windowMs) theo khuôn cửa sổ trượt — test giả lập 105 request/phút thấy nhánh false.",
      "Viết loginGuard: Map đếm lần sai theo email+ip; quá 5 lần/15phút trả 429.",
      "Móc cả hai vào middleware chain: rateLimit toàn cục → loginGuard riêng /auth/login.",
      "Viết setSecurityHeaders(res): nosniff, X-Frame-Options DENY, CSP tối thiểu.",
      "Viết errorHandler cuối chuỗi: log chi tiết server-side, trả client { error: 'internal_error' } — không stack trace.",
      "Chạy checklist bài 56 trên toàn backend, commit 'security: rate limit + hardening'."
    ],
    commonMistakes: [
      { symptom: "Rate limit đếm cả đời không reset, người dùng bị chặn vĩnh viễn.", cause: "Không lọc timestamp ra khỏi cửa sổ.", fix: "filter(now - t < windowMs) mỗi lần kiểm — cửa sổ phải trượt." },
      { symptom: "Thông báo 'tài khoản bị khóa, thử lại sau 14 phút 32 giây'.", cause: "Cung cấp thông tin quý cho kẻ tấn công.", fix: "Thông báo chung chung; chi tiết chỉ ghi log." },
      { symptom: "Lỗi 500 trả nguyên stack trace lộ đường dẫn file, phiên bản thư viện.", cause: "Thiếu error handler tập trung.", fix: "Handler cuối: log đầy đủ ở server, trả client thông báo chung." }
    ],
    challenge: "Nâng rate limiter lên 2 tầng: 100 req/phút VÀ 2000 req/giờ cùng lúc — vượt tầng nào cũng 429 kèm header Retry-After.",
    checklist: [
      "Rate limiter cửa sổ trượt hoạt động đúng",
      "Đăng nhập sai 5 lần bị chặn tạm thời",
      "Grep toàn repo: không còn SQL nối chuỗi; 500 không lộ stack"
    ],
    tasks: ["Viết rateLimit cửa sổ trượt (Map + filter), loginGuard 5 lần/15 phút trả 429 và setSecurityHeaders + errorHandler."],
    starterCode: `// BÀI 83 — Cột mốc 13: Gia cố API
// TODO 1: rateLimit(ip, max, windowMs) — Map ip -> timestamps, filter cửa sổ, > max -> false (429)
// TODO 2: loginGuard — đếm sai theo email+ip, >= 5 lần/15 phút -> 429
// TODO 3: setSecurityHeaders — nosniff, X-Frame-Options DENY, CSP
// TODO 4: errorHandler — log server, client chỉ nhận { error: "internal_error" }
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("ratelimit") && c.includes("429") && c.includes("filter(") && c.includes("x-frame-options") && c.includes("nosniff") && c.includes("internal_error");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vượt quá giới hạn request, API trả mã trạng thái nào?",
      snippet: "101 requests / 60s (max 100) → HTTP [ ??? ]",
      options: [
        { text: "403", correct: false },
        { text: "429 Too Many Requests", correct: true },
        { text: "500", correct: false },
        { text: "302", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Brute-force đăng nhập là gì?", o: ["Tấn công DDoS", "Thử hàng loạt mật khẩu cho đến khi trúng", "Chèn SQL", "Giả cookie"], a: 1 },
      { q: "Vì sao không trả stack trace cho client khi lỗi 500?", o: ["Cho gọn JSON", "Lộ đường dẫn, thư viện, cấu trúc — quà cho kẻ tấn công", "Client không đọc được", "Tốn băng thông"], a: 1 },
      { q: "Header X-Frame-Options: DENY chống gì?", o: ["XSS", "Clickjacking — trang bị nhúng vào iframe lừa bấm", "SQLi", "Brute force"], a: 1 },
      { q: "Cửa sổ trượt trong rate limit nghĩa là?", o: ["Đếm từ 0h hằng ngày", "Chỉ đếm request trong N giây gần nhất tính từ hiện tại", "Đếm cả đời", "Đếm theo phiên"], a: 1 }
    ]
  },
  {
    id: "lesson84",
    title: "84. Chat & Giao tiếp thời gian thực qua WebSockets",
    lang: "javascript",
    file: "src/lesson84.js",
    duration: "65 phút",
    overview: {
      description: "Cột mốc 14: tính năng bắt buộc của đồ án — phòng chat realtime hoàn chỉnh: xác thực socket bằng JWT, giao thức tin nhắn type-based, lưu lịch sử và auto-reconnect.",
      outcomes: [
        "Thiết kế giao thức tin nhắn { type, payload } cho socket",
        "Xác thực kết nối socket bằng JWT ngay lúc bắt tay",
        "Ghép luồng: nhận tin → lưu DB (MessageRepository) → phát cho phòng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Nâng WebSocket bài 37 lên chuẩn sản phẩm:

**1. Giao thức type-based** — mọi gói tin một khuôn:
\`\`\`javascript
// client -> server: { type: "chat.send", payload: { roomId, body } }
// server -> client: { type: "chat.new", payload: { id, from, body, sentAt } }
//                   { type: "presence.join", payload: { user } }
socket.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  const handler = handlers[msg.type];        // bảng route theo type
  if (handler) handler(msg.payload);
};
\`\`\`

**2. Xác thực socket**: gửi JWT ngay sau onopen bằng gói \`{ type: "auth", payload: { token } }\` — server verify (bài 73) rồi mới cho vào phòng; sai thì đóng kết nối.

**3. Bền vững**: server nhận chat.send → validate → **lưu MessageRepository** → broadcast cho phòng. Người vào sau lấy lịch sử qua REST GET /api/messages?room=... (socket cho realtime, REST cho lịch sử). Auto-reconnect với backoff (thử thách bài 37) giờ là bắt buộc.`,
    labSteps: [
      "Viết bảng handlers = { 'chat.new': ..., 'presence.join': ... } và onmessage route theo type.",
      "Viết luồng auth: onopen gửi { type: 'auth', payload: { token } } — chú thích phía server verify rồi mới join phòng.",
      "Viết sendChat(roomId, body): đóng gói type 'chat.send' + send (khuôn stringify bài 37).",
      "Handler chat.new: vẽ bubble vào #chat-box + cuộn xuống cuối (scrollTop = scrollHeight).",
      "Viết loadHistory(roomId) qua apiCall (bài 77) đổ tin cũ trước khi vào realtime.",
      "Cài auto-reconnect backoff 1s→2s→4s (tối đa 30s) trong onclose; commit 'feat: chat realtime'."
    ],
    commonMistakes: [
      { symptom: "Ai biết URL socket đều vào phòng đọc tin.", cause: "Socket không xác thực.", fix: "Bắt buộc gói auth đầu tiên; server verify JWT trước khi cho join — sai thì close(4401)." },
      { symptom: "F5 là mất sạch tin nhắn.", cause: "Tin chỉ bay qua socket, không lưu DB.", fix: "Server lưu MessageRepository trước khi broadcast; client vào phòng gọi loadHistory." },
      { symptom: "Một 'if type ===' dài 80 dòng trong onmessage.", cause: "Không có bảng handler.", fix: "Object handlers theo type — thêm loại tin mới chỉ thêm một entry." }
    ],
    challenge: "Thêm typing indicator: gõ phím gửi { type: 'chat.typing' } (throttle 2s), người trong phòng thấy 'Hugo đang gõ...' tự ẩn sau 3s.",
    checklist: [
      "Mọi gói tin đúng khuôn { type, payload }",
      "Socket có bước auth trước khi vào phòng",
      "Tin nhắn sống sót qua F5 (lịch sử REST + lưu DB)"
    ],
    tasks: ["Viết bảng handlers route theo type, gói auth sau onopen, sendChat, render chat.new và auto-reconnect backoff."],
    starterCode: `// BÀI 84 — Cột mốc 14: Chat realtime hoàn chỉnh
// TODO 1: handlers = { "chat.new": fn, "presence.join": fn } + onmessage route theo msg.type
// TODO 2: onopen -> send { type: "auth", payload: { token } }
// TODO 3: sendChat(roomId, body) — { type: "chat.send", payload }
// TODO 4: loadHistory(roomId) qua apiCall; onclose -> reconnect backoff 1s/2s/4s
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("handlers") && c.includes('type:"auth"') && c.includes("chat.send") && c.includes("chat.new") && c.includes("loadhistory") && c.includes("onclose");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Gói tin ĐẦU TIÊN client gửi sau khi socket mở nên là gì?",
      snippet: "socket.onopen = () => socket.send(JSON.stringify([ ??? ]))",
      options: [
        { text: "Tin nhắn chào cả phòng", correct: false },
        { text: "{ type: \"auth\", payload: { token } } — xác thực trước khi làm gì khác", correct: true },
        { text: "Danh bạ điện thoại", correct: false },
        { text: "Không cần gửi gì", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao tin nhắn phải lưu DB dù đã broadcast qua socket?", o: ["Cho nặng server", "Socket là realtime tạm thời — lịch sử phải bền vững qua F5/thiết bị khác", "WebSocket yêu cầu", "Để đếm ký tự"], a: 1 },
      { q: "Khuôn { type, payload } giúp gì?", o: ["Nén tin", "Route mọi loại tin qua bảng handler — mở rộng không sửa lõi", "Mã hóa", "Bắt buộc của chuẩn WS"], a: 1 },
      { q: "Người vào phòng sau lấy tin cũ bằng đường nào?", o: ["Đợi người khác gửi lại", "REST API lịch sử; socket chỉ lo tin mới", "localStorage", "Socket tự phát lại"], a: 1 },
      { q: "Socket xác thực thất bại thì server nên?", o: ["Cho vào phòng chờ", "Đóng kết nối với mã lỗi riêng", "Bỏ qua", "Gửi cảnh cáo 3 lần"], a: 1 }
    ]
  },
  {
    id: "lesson85",
    title: "85. Upload, tối ưu dung lượng & hiển thị hình ảnh",
    lang: "javascript",
    file: "src/lesson85.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 15: cho người dùng gửi ảnh — validate 2 tầng (loại + dung lượng), nén phía client bằng canvas trước khi upload FormData, phòng thủ đổi tên file phía server.",
      outcomes: [
        "Upload chuẩn FormData qua fetch (không tự đặt Content-Type)",
        "Nén/resize ảnh phía client bằng canvas trước khi gửi",
        "Phòng thủ server: whitelist MIME, giới hạn dung lượng, đổi tên file ngẫu nhiên"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Luồng upload ảnh chuẩn:

\`\`\`javascript
// 1. Validate client (chặn sớm cho UX): loại + dung lượng
if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return err("Chỉ nhận ảnh");
if (file.size > 5 * 1024 * 1024) return err("Tối đa 5MB");

// 2. Nén bằng canvas (giảm 60-80% trước khi tốn băng thông)
async function compressImage(file, maxW = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = Object.assign(document.createElement("canvas"),
    { width: bitmap.width * scale, height: bitmap.height * scale });
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((r) => canvas.toBlob(r, "image/webp", quality));
}

// 3. Gửi FormData — KHÔNG tự đặt Content-Type (trình duyệt tự thêm boundary)
const fd = new FormData();
fd.append("avatar", blob, "avatar.webp");
await fetch(API_BASE + "/upload", { method: "POST", headers: { Authorization: "Bearer " + token }, body: fd });
\`\`\`

> **Server không tin client**: kiểm lại MIME thật (magic bytes), giới hạn dung lượng, và **đổi tên file ngẫu nhiên** (uuid.webp) — giữ tên gốc 'anh.php.jpg' là mời kẻ tấn công thực thi mã.`,
    labSteps: [
      "Viết validateImage(file): whitelist 3 MIME + trần 5MB — trả thông báo lỗi cụ thể.",
      "Viết compressImage theo khuôn canvas — log dung lượng trước/sau để thấy mức giảm.",
      "Viết uploadAvatar(file): validate → compress → FormData → fetch kèm Bearer (KHÔNG đặt Content-Type).",
      "Hiển thị preview ngay bằng URL.createObjectURL(blob) + progress giả định trạng thái nút (bài 17).",
      "Chú thích khối server: kiểm MIME thật, giới hạn, đổi tên uuid, lưu ngoài webroot hoặc bucket.",
      "Commit 'feat: upload avatar có nén client-side'."
    ],
    commonMistakes: [
      { symptom: "Tự đặt Content-Type: multipart/form-data mà server đọc không được file.", cause: "Thiếu boundary — thứ trình duyệt phải tự sinh.", fix: "Gửi FormData thì KHÔNG đặt Content-Type thủ công." },
      { symptom: "Server lưu file giữ nguyên tên 'shell.php.jpg'.", cause: "Tin tên file người dùng.", fix: "Đổi tên ngẫu nhiên + ép đuôi theo MIME đã kiểm; cấm thực thi trong thư mục upload." },
      { symptom: "Ảnh 12MB từ camera upload thẳng làm nghẽn mạng người dùng.", cause: "Bỏ qua nén client.", fix: "Canvas resize về 1280px + WebP 0.8 — chất lượng đủ, dung lượng giảm mạnh." }
    ],
    challenge: "Thêm crop vuông trước khi nén (drawImage 9 tham số cắt giữa ảnh) — avatar tròn hiển thị không méo.",
    checklist: [
      "Validate 2 tầng client + chú thích tầng server",
      "Ảnh sau nén nhỏ hơn rõ rệt (log chứng minh)",
      "FormData gửi đúng, không tự đặt Content-Type"
    ],
    tasks: ["Viết validateImage (whitelist + 5MB), compressImage (canvas → toBlob webp) và uploadAvatar (FormData + Bearer)."],
    starterCode: `// BÀI 85 — Cột mốc 15: Upload ảnh
// TODO 1: validateImage(file) — whitelist MIME + file.size <= 5MB
// TODO 2: compressImage(file, 1280, 0.8) — createImageBitmap -> canvas -> toBlob("image/webp")
// TODO 3: uploadAvatar — FormData.append + fetch POST (không đặt Content-Type)
// TODO 4: chú thích phòng thủ server: MIME thật, đổi tên uuid
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("formdata") && c.includes("createimagebitmap") && c.includes("toblob(") && c.includes("file.size") && c.includes("file.type") && c.includes("append(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Khi gửi FormData bằng fetch, header Content-Type xử lý thế nào?",
      snippet: "fetch(url, { method: 'POST', body: formData, headers: { [ ??? ] } })",
      options: [
        { text: "Tự đặt 'multipart/form-data'", correct: false },
        { text: "KHÔNG đặt — trình duyệt tự thêm kèm boundary", correct: true },
        { text: "Đặt 'application/json'", correct: false },
        { text: "Đặt 'image/webp'", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao nén ảnh phía client trước khi upload?", o: ["Server cấm ảnh to", "Tiết kiệm băng thông người dùng và dung lượng lưu trữ — giảm 60-80%", "Bắt buộc của fetch", "Ảnh đẹp hơn"], a: 1 },
      { q: "Vì sao server phải đổi tên file upload?", o: ["Cho gọn", "Tên gốc có thể chứa đuôi thực thi (shell.php.jpg) — hiểm họa RCE", "Dễ tìm kiếm", "Unicode lỗi"], a: 1 },
      { q: "API nào vẽ ảnh để resize trên client?", o: ["WebGL bắt buộc", "canvas.getContext('2d').drawImage", "CSS transform", "Service Worker"], a: 1 },
      { q: "Preview ảnh ngay không cần chờ upload bằng gì?", o: ["Base64 luôn luôn", "URL.createObjectURL(blob)", "Tải lại trang", "iframe"], a: 1 }
    ]
  },
  {
    id: "lesson86",
    title: "86. Tích hợp logic AI vào luồng Backend",
    lang: "javascript",
    file: "src/lesson86.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 16: AI vào việc thật — kiểm duyệt nội dung và tự gắn tag cho bài viết ngay trong luồng ghi dữ liệu, với đầy đủ khuôn chống chết: timeout, fallback, cache.",
      outcomes: [
        "Chèn bước AI vào pipeline: validate → AI moderate → lưu → phản hồi",
        "Dựng aiGateway: một cửa gọi AI có timeout + retry + fallback",
        "Thiết kế chế độ suy giảm: AI chết thì hệ thống vẫn sống"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
AI là dịch vụ NGOÀI — chậm và có thể chết bất cứ lúc nào. Khuôn tích hợp sống sót:

\`\`\`javascript
async function aiGateway(prompt, { timeoutMs = 5000, schema } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GEMINI_URL, { ...body(prompt, schema), signal: controller.signal });
    if (!res.ok) throw new ApiError(res.status, "ai_error");
    return parseAiJson(await res.json());        // structured output bài 64
  } finally { clearTimeout(timer); }
}

// Pipeline tạo bài viết:
// validate -> aiGateway(moderatePrompt) -> flagged ? 400 : lưu DB kèm tags -> 201
async function moderateContent(text) {
  try {
    return await aiGateway(buildModeratePrompt(text), { schema: MODERATE_SCHEMA });
  } catch {
    return { flagged: false, tags: [], pendingReview: true };   // FALLBACK: cho qua + đánh dấu duyệt tay
  }
}
\`\`\`

> **Nguyên tắc suy giảm êm (graceful degradation)**: AI lỗi thì tính năng lõi (đăng bài) vẫn chạy — gói kết quả kèm cờ pendingReview cho admin duyệt sau. Cache kết quả theo hash nội dung (bài 43): cùng văn bản không hỏi AI hai lần.`,
    labSteps: [
      "Viết aiGateway theo khuôn: AbortController + timeout 5s, ném ApiError chuẩn (bài 77).",
      "Viết MODERATE_SCHEMA (structured output bài 64): { flagged: boolean, reason: string, tags: string[] }.",
      "Viết moderateContent(text) có try/catch fallback pendingReview.",
      "Ghép pipeline createPost: validate → moderateContent → flagged ? 400 { reason } : lưu kèm tags → 201.",
      "Thêm cache Map theo hash nội dung trước cửa aiGateway.",
      "Commit 'feat: AI moderation + auto-tag trong pipeline'."
    ],
    commonMistakes: [
      { symptom: "Gemini chậm 30 giây, người dùng nhìn spinner vô vọng.", cause: "Không đặt timeout cho lời gọi AI.", fix: "AbortController + timeout 5s — quá hạn đi đường fallback." },
      { symptom: "AI hết quota, cả tính năng đăng bài tê liệt.", cause: "Thiếu chế độ suy giảm.", fix: "Fallback cho qua + pendingReview — AI là gia vị, không phải mạch máu." },
      { symptom: "Cùng một bình luận gọi AI 50 lần tốn quota.", cause: "Không cache.", fix: "Cache theo hash nội dung với TTL (khuôn bài 43)." }
    ],
    challenge: "Thêm chế độ nghiêm ngặt cấu hình được: STRICT_MODE=true thì AI lỗi sẽ CHẶN đăng (an toàn trước) thay vì cho qua — một biến env đổi chính sách.",
    checklist: [
      "aiGateway có timeout + ném lỗi chuẩn",
      "AI chết thì đăng bài vẫn chạy (pendingReview)",
      "Có cache tránh hỏi AI trùng lặp"
    ],
    tasks: ["Viết aiGateway (AbortController + timeout), moderateContent (schema + fallback pendingReview) và pipeline createPost."],
    starterCode: `// BÀI 86 — Cột mốc 16: AI vào pipeline backend
// TODO 1: aiGateway(prompt, {timeoutMs, schema}) — AbortController + setTimeout -> abort
// TODO 2: MODERATE_SCHEMA { flagged, reason, tags } + moderateContent với fallback { pendingReview: true }
// TODO 3: createPost — validate -> moderate -> flagged ? 400 : lưu kèm tags -> 201
// TODO 4: cache Map theo hash nội dung
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("abortcontroller") && c.includes("abort()") && c.includes("flagged") && c.includes("pendingreview") && c.includes("cache");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Dịch vụ AI sập, tính năng đăng bài của bạn nên thế nào?",
      snippet: "catch { return { flagged: false, pendingReview: true } }",
      options: [
        { text: "Sập theo cho đồng bộ", correct: false },
        { text: "Vẫn chạy — suy giảm êm, đánh dấu chờ duyệt tay", correct: true },
        { text: "Chặn toàn bộ người dùng", correct: false },
        { text: "Tự động thử lại vô hạn", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "AbortController trong lời gọi AI để làm gì?", o: ["Huỷ đẹp cú pháp", "Cắt request khi quá timeout — không treo người dùng", "Nén request", "Đổi model"], a: 1 },
      { q: "Graceful degradation nghĩa là gì?", o: ["Code xuống cấp dần", "Bộ phận phụ hỏng thì tính năng lõi vẫn sống", "Giảm giá dịch vụ", "Hạ phiên bản"], a: 1 },
      { q: "Cache kết quả AI theo khóa nào là hợp lý?", o: ["Theo IP", "Hash của nội dung đầu vào", "Theo giờ", "Ngẫu nhiên"], a: 1 },
      { q: "Vị trí đúng của bước AI moderation trong pipeline?", o: ["Sau khi đã lưu DB", "Sau validate, trước khi lưu", "Trước validate", "Chạy nền không liên quan"], a: 1 }
    ]
  },
  {
    id: "lesson87",
    title: "87. Giao diện AI Chatbot hỗ trợ thời gian thực",
    lang: "javascript",
    file: "src/lesson87.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 17: trợ lý AI của sản phẩm — khung chat với system instruction định vai, giữ lịch sử hội thoại nhiều lượt, hiệu ứng gõ chữ và các chốt an toàn nội dung.",
      outcomes: [
        "Định vai chatbot bằng system instruction có phạm vi và giới hạn",
        "Quản lý mảng messages nhiều lượt (user/model) trong giới hạn context",
        "Dựng UI chat: trạng thái đang nghĩ, hiệu ứng gõ chữ, nút dừng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**System instruction** — bản mô tả công việc của bot (khuôn prompt bài 61 áp vào sản phẩm):

\`\`\`javascript
const SYSTEM_INSTRUCTION = \`Bạn là trợ lý của [tên đồ án].
- Chỉ trả lời về: tính năng, cách dùng, khắc phục lỗi của ứng dụng.
- Ngoài phạm vi: từ chối lịch sự và gợi ý liên hệ hỗ trợ.
- Trả lời tiếng Việt, tối đa 150 từ, thân thiện.\`;

// Hội thoại nhiều lượt — Gemini nhận mảng contents role user/model:
const history = [];   // { role: "user"|"model", parts: [{ text }] }
async function chatWithBot(userText) {
  history.push({ role: "user", parts: [{ text: userText }] });
  const reply = await apiCall("/ai/chat", { method: "POST", body: { history: history.slice(-20) } });
  history.push({ role: "model", parts: [{ text: reply.text }] });
  return reply.text;
}
\`\`\`

> **slice(-20)** — cắt lịch sử giữ context không tràn (bài 61). Backend nhận history, tự ghép SYSTEM_INSTRUCTION rồi mới gọi Gemini (key ở server — bài 62). UI: bubble 'đang nghĩ' ba chấm, render từng từ (typing effect) tăng cảm giác sống.`,
    labSteps: [
      "Viết SYSTEM_INSTRUCTION cho đồ án của BẠN: vai, phạm vi, giới hạn, ngôn ngữ, độ dài.",
      "Viết mảng history + chatWithBot theo khuôn (đẩy user → gọi → đẩy model), cắt slice(-20).",
      "Dựng UI: renderBubble(role, text), bubble 'đang nghĩ' hiện ngay khi gửi, xoá khi có kết quả.",
      "Viết typeWriter(el, text): hiện từng từ mỗi 30ms — kèm nút Dừng (clearInterval).",
      "Chốt an toàn: câu hỏi ngoài phạm vi thử nghiệm 3 câu (thời tiết, chính trị, toán lớp 12) — bot phải từ chối đúng kịch bản.",
      "Commit 'feat: AI chatbot hỗ trợ'."
    ],
    commonMistakes: [
      { symptom: "Bot 'quên' câu hỏi ngay trước đó.", cause: "Mỗi lần gọi chỉ gửi câu mới nhất, không gửi history.", fix: "Gửi mảng history nhiều lượt — bot chỉ 'nhớ' những gì bạn gửi lại." },
      { symptom: "Bot chém gió cả chuyện ngoài ứng dụng, có khi nói sai sự thật.", cause: "System instruction không giới hạn phạm vi.", fix: "Khai phạm vi + kịch bản từ chối rõ ràng trong instruction; test biên." },
      { symptom: "Hội thoại 200 lượt gửi nguyên si — chậm và tốn token.", cause: "Không cắt lịch sử.", fix: "slice(-20) hoặc tóm tắt đoạn cũ thành một message hệ thống." }
    ],
    challenge: "Thêm 3 nút gợi ý câu hỏi nhanh (quick replies) do chính bot đề xuất sau mỗi câu trả lời — dùng structured output trả kèm mảng suggestions.",
    checklist: [
      "System instruction đủ: vai, phạm vi, từ chối, ngôn ngữ",
      "Bot nhớ ngữ cảnh nhiều lượt nhưng lịch sử có cắt",
      "3 câu ngoài phạm vi đều bị từ chối đúng kịch bản"
    ],
    tasks: ["Viết SYSTEM_INSTRUCTION, history + chatWithBot (slice(-20)), renderBubble + typeWriter và test từ chối ngoài phạm vi."],
    starterCode: `// BÀI 87 — Cột mốc 17: AI Chatbot
// TODO 1: SYSTEM_INSTRUCTION — vai, phạm vi, giới hạn, ngôn ngữ
// TODO 2: history[] + chatWithBot(userText) — push user -> apiCall -> push model, slice(-20)
// TODO 3: renderBubble(role, text) + bubble "đang nghĩ"
// TODO 4: typeWriter(el, text) hiện từng từ + nút dừng
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const hasUserRole = c.includes('role:"user"') || c.includes("role:'user'");
      return c.includes("system_instruction") && c.includes("history") && c.includes("slice(-20)") && hasUserRole && (c.includes("typewriter") || c.includes("renderbubble"));
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Muốn chatbot 'nhớ' các câu trước, mỗi request phải gửi gì?",
      snippet: "body: { history: [ ??? ] }",
      options: [
        { text: "Chỉ câu hỏi mới nhất", correct: false },
        { text: "Mảng lịch sử hội thoại nhiều lượt role user/model (có cắt giới hạn)", correct: true },
        { text: "Cookie của người dùng", correct: false },
        { text: "ID phiên là đủ, AI tự nhớ", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "System instruction dùng để làm gì?", o: ["Tăng tốc AI", "Định vai, phạm vi và giới hạn hành vi của bot", "Mã hóa hội thoại", "Chọn ngôn ngữ lập trình"], a: 1 },
      { q: "Vì sao phải cắt history slice(-20)?", o: ["Cho đẹp", "Giữ context không tràn + tiết kiệm token/chi phí", "Gemini cấm mảng dài", "Bảo mật"], a: 1 },
      { q: "Câu hỏi ngoài phạm vi, bot nên làm gì?", o: ["Trả lời đại", "Từ chối lịch sự theo kịch bản + gợi ý kênh hỗ trợ", "Im lặng", "Đăng xuất người dùng"], a: 1 },
      { q: "Ai là người ghép system instruction vào request Gemini?", o: ["Frontend", "Backend — nơi giữ key và kiểm soát prompt", "Người dùng", "CDN"], a: 1 }
    ]
  },
  {
    id: "lesson88",
    title: "88. AI Structured Outputs: Tự động phân tích hành vi",
    lang: "javascript",
    file: "src/lesson88.js",
    duration: "60 phút",
    overview: {
      description: "Cột mốc 18: AI làm việc ngầm cho sản phẩm — phân tích hoạt động người dùng thành insight JSON chuẩn schema, chạy định kỳ, đổ vào dashboard mà không cần người vận hành.",
      outcomes: [
        "Thiết kế INSIGHT_SCHEMA nhiều tầng: object lồng array lồng object",
        "Viết job phân tích định kỳ: gom dữ liệu → AI → lưu bảng insights",
        "Render insight lên dashboard kèm nhãn 'do AI tạo' minh bạch"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Khuôn 'AI làm nhân viên phân tích' (structured output bài 64 ở mức sản phẩm):

\`\`\`javascript
const INSIGHT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    engagementLevel: { type: "string", enum: ["low", "medium", "high"] },
    topInterests: { type: "array", items: { type: "string" } },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, reason: { type: "string" } },
        required: ["title", "reason"]
      }
    }
  },
  required: ["summary", "engagementLevel", "topInterests"]
};

// Job chạy định kỳ (cron):
// 1. Gom hoạt động 7 ngày: số tin nhắn, bài viết, giờ hoạt động
// 2. aiGateway(buildAnalysisPrompt(stats), { schema: INSIGHT_SCHEMA })
// 3. Lưu bảng insights (userId, data, createdAt) — dashboard chỉ ĐỌC bảng này
\`\`\`

> Tách rời: job phân tích chạy nền theo lịch, dashboard đọc kết quả đã lưu — người dùng không bao giờ chờ AI. Đạo đức dữ liệu: chỉ phân tích dữ liệu hành vi trong app, hiển thị nhãn "Phân tích bởi AI", cho phép người dùng tắt tính năng.`,
    labSteps: [
      "Viết INSIGHT_SCHEMA theo khuôn — đủ enum, array object lồng nhau, required.",
      "Viết collectStats(userId): gom số liệu 7 ngày từ các repository (mô phỏng bằng dữ liệu seed bài 68).",
      "Viết buildAnalysisPrompt(stats): khuôn 4 phần bài 61, nhấn 'chỉ dựa trên số liệu được cung cấp'.",
      "Viết analyzeUser(userId): collect → aiGateway (bài 86) → validate kết quả → lưu insights.",
      "Viết renderInsights(data): thẻ tóm tắt + chip topInterests + danh sách suggestions, góc thẻ nhãn 'AI'.",
      "Commit 'feat: AI insights định kỳ'."
    ],
    commonMistakes: [
      { symptom: "Dashboard chờ AI 8 giây mỗi lần mở.", cause: "Gọi AI đồng bộ lúc render.", fix: "Job nền tính sẵn theo lịch — dashboard chỉ đọc kết quả đã lưu." },
      { symptom: "AI 'suy diễn' người dùng dựa trên thứ không có trong số liệu.", cause: "Prompt không giới hạn nguồn dữ kiện.", fix: "Chỉ thị rõ: 'chỉ dựa trên số liệu được cung cấp, không suy đoán thêm'." },
      { symptom: "Người dùng khó chịu vì bị 'AI theo dõi' âm thầm.", cause: "Thiếu minh bạch.", fix: "Nhãn 'Phân tích bởi AI' + công tắc tắt trong cài đặt — minh bạch là tính năng." }
    ],
    challenge: "Thêm so sánh tuần: lưu insight mỗi tuần, prompt nhận cả số liệu tuần trước — schema thêm trường trend (up/down/stable) cho từng chỉ số.",
    checklist: [
      "Schema nhiều tầng có enum + required chạy được",
      "Luồng job nền tách khỏi luồng render",
      "Có nhãn minh bạch và đường tắt tính năng"
    ],
    tasks: ["Viết INSIGHT_SCHEMA (enum + array object), collectStats, analyzeUser (aiGateway + lưu) và renderInsights có nhãn AI."],
    starterCode: `// BÀI 88 — Cột mốc 18: AI Insights
// TODO 1: INSIGHT_SCHEMA — summary, engagementLevel enum, topInterests[], suggestions[{title, reason}]
// TODO 2: collectStats(userId) — gom số liệu 7 ngày (dữ liệu seed)
// TODO 3: analyzeUser — collect -> aiGateway(schema) -> lưu insights
// TODO 4: renderInsights — thẻ tóm tắt + nhãn "Phân tích bởi AI"
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("insight_schema") && c.includes("enum") && c.includes("required") && c.includes("collectstats") && c.includes("analyzeuser") && c.includes("renderinsights");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Dashboard hiển thị insight AI — kiến trúc đúng là gì?",
      snippet: "cron job → AI → bảng insights → dashboard [đọc]",
      options: [
        { text: "Dashboard gọi AI trực tiếp mỗi lần mở", correct: false },
        { text: "Job nền tính sẵn theo lịch, dashboard chỉ đọc kết quả đã lưu", correct: true },
        { text: "Người dùng tự bấm nút gọi AI", correct: false },
        { text: "AI ghi thẳng vào HTML", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao insight phải qua schema thay vì văn bản tự do?", o: ["Đẹp hơn", "Máy render/lưu/so sánh được — dữ liệu là dữ liệu", "AI thích JSON", "Tiết kiệm token"], a: 1 },
      { q: "Prompt phân tích cần chỉ thị gì để tránh suy diễn?", o: ["Viết dài hơn", "'Chỉ dựa trên số liệu được cung cấp'", "Dùng tiếng Anh", "Tăng temperature"], a: 1 },
      { q: "Minh bạch với người dùng về AI nghĩa là?", o: ["Giấu cho gọn", "Nhãn 'do AI tạo' + quyền tắt tính năng", "Chỉ ghi trong điều khoản", "Không cần"], a: 1 },
      { q: "Trường enum engagementLevel giúp gì cho dashboard?", o: ["Không gì", "Chỉ 3 giá trị chuẩn — map thẳng sang màu/badge không cần xử lý chuỗi", "Tăng độ chính xác AI", "Giảm chi phí"], a: 1 }
    ]
  },
  {
    id: "lesson89",
    title: "89. Unit Test & Kiểm thử End-to-End toàn sản phẩm",
    lang: "javascript",
    file: "src/lesson89.test.js",
    duration: "65 phút",
    overview: {
      description: "Cột mốc 19: lưới an toàn trước giờ phát hành — phủ unit test cho logic tiền/quyền, mock lời gọi AI, và kịch bản E2E cho 3 luồng vàng của đồ án.",
      outcomes: [
        "Phủ unit test các hàm rủi ro cao: phí, quyền, validate (khuôn bài 49)",
        "Mock dịch vụ ngoài (AI, DB) để test nhanh và ổn định",
        "Viết kịch bản E2E 3 luồng vàng: đăng ký→đăng nhập, chat, hỏi AI"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Kim tự tháp kiểm thử**: nhiều unit (nhanh, rẻ) → vừa integration → ít E2E (chậm, đắt nhưng giống người dùng nhất).

**Mock dịch vụ ngoài** — test không được phụ thuộc Gemini/DB thật:
\`\`\`javascript
import { vi, describe, test, expect } from "vitest";
vi.mock("./ai-gateway.js", () => ({
  aiGateway: vi.fn().mockResolvedValue({ flagged: false, tags: ["hoc-tap"] })
}));
test("createPost gắn tag từ AI", async () => {
  const post = await createPost({ body: "Mẹo học CSS" });
  expect(post.tags).toContain("hoc-tap");
});
test("AI chết vẫn đăng được bài (fallback)", async () => {
  aiGateway.mockRejectedValueOnce(new Error("timeout"));
  const post = await createPost({ body: "Bài test" });
  expect(post.pendingReview).toBe(true);      // đúng thiết kế bài 86
});
\`\`\`

**E2E 3 luồng vàng** (kịch bản bảng bước–kỳ vọng, chạy tay hoặc Playwright): (1) đăng ký → đăng nhập → vào dashboard; (2) gửi tin chat 2 tài khoản 2 tab; (3) hỏi chatbot trong phạm vi + ngoài phạm vi. Luồng vàng gãy = không phát hành.`,
    labSteps: [
      "Liệt kê 5 hàm rủi ro cao nhất của đồ án (tiền, quyền, validate, moderation) — đây là mục tiêu unit test.",
      "Viết describe cho calcTotal/validateEmail-của-đồ-án: đường vui + ca biên + ca lỗi (khuôn AAA bài 49).",
      "Viết vi.mock cho aiGateway: 1 test nhánh thành công gắn tag, 1 test mockRejectedValueOnce ra pendingReview.",
      "Viết kịch bản E2E 3 luồng vàng dạng bảng: bước — hành động — kỳ vọng (10-12 bước/luồng).",
      "Chạy toàn bộ: npm test xanh 100%; chạy tay 3 luồng vàng tick từng bước.",
      "Commit 'test: unit + mock AI + kịch bản E2E'."
    ],
    commonMistakes: [
      { symptom: "Test gọi thẳng Gemini — lúc đỏ lúc xanh theo mạng.", cause: "Không mock dịch vụ ngoài.", fix: "vi.mock module AI — test phải tất định (deterministic)." },
      { symptom: "100 test cho hàm format ngày, 0 test cho hàm tính phí.", cause: "Test chỗ dễ thay vì chỗ rủi ro.", fix: "Ưu tiên theo rủi ro: tiền, quyền, bảo mật trước." },
      { symptom: "E2E 'đăng nhập rồi bấm loanh quanh xem có lỗi không'.", cause: "Không có kịch bản kỳ vọng.", fix: "Bảng bước–kỳ vọng cụ thể — kiểm thử là so sánh với kỳ vọng, không phải đi dạo." }
    ],
    challenge: "Cài đặt husky pre-commit hook chạy npm test — commit nào làm đỏ test là bị chặn ngay tại cửa.",
    checklist: [
      "5 hàm rủi ro cao đều có test đủ 3 ca",
      "Test AI dùng mock cả nhánh sống lẫn nhánh chết",
      "3 luồng vàng có kịch bản và đã chạy tick đủ"
    ],
    tasks: ["Viết unit test khuôn AAA cho hàm rủi ro, vi.mock aiGateway (resolved + rejected) và bảng kịch bản E2E 3 luồng vàng."],
    starterCode: `// BÀI 89 — Cột mốc 19: Lưới an toàn kiểm thử
// TODO 1: describe hàm rủi ro — đường vui + ca biên + toThrow
// TODO 2: vi.mock("./ai-gateway.js") — mockResolvedValue tags, mockRejectedValueOnce -> pendingReview
// TODO 3: chú thích bảng E2E 3 luồng vàng: bước — hành động — kỳ vọng
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("vi.mock(") && c.includes("mockresolvedvalue") && c.includes("mockrejectedvalueonce") && c.includes("describe(") && c.includes(".tothrow(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao unit test phải MOCK lời gọi AI thay vì gọi thật?",
      snippet: "vi.mock('./ai-gateway.js', ...)",
      options: [
        { text: "Gọi thật tốn tiền thôi", correct: false },
        { text: "Test phải tất định và nhanh — không phụ thuộc mạng/quota/tính ngẫu nhiên của AI", correct: true },
        { text: "Vitest cấm gọi mạng", correct: false },
        { text: "AI từ chối test", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Kim tự tháp kiểm thử xếp thế nào?", o: ["Nhiều E2E, ít unit", "Nhiều unit → vừa integration → ít E2E", "Chỉ cần E2E", "Chỉ cần unit"], a: 1 },
      { q: "mockRejectedValueOnce dùng để test gì?", o: ["Hàm chạy nhanh", "Nhánh xử lý khi dịch vụ ngoài thất bại (fallback)", "Giao diện", "Tốc độ mạng"], a: 1 },
      { q: "'Luồng vàng' là gì?", o: ["Luồng có màu vàng", "Chuỗi thao tác cốt lõi mà gãy là sản phẩm vô dụng", "Luồng của admin", "Luồng thanh toán vàng"], a: 1 },
      { q: "Ưu tiên viết test cho hàm nào trước?", o: ["Hàm dễ test nhất", "Hàm rủi ro cao: tiền, quyền, bảo mật", "Hàm ngắn nhất", "Hàm mới nhất"], a: 1 }
    ]
  },
  {
    id: "lesson90",
    title: "90. Đóng gói thương mại & Quản lý Release trên GitHub",
    lang: "html",
    file: "src/lesson90.html",
    duration: "55 phút",
    overview: {
      description: "Cột mốc 20 — chốt Chặng 5: đưa repo lên chuẩn thương mại: semantic versioning, tag release v1.0.0, CHANGELOG, README hoàn chỉnh và rà soát an ninh lần cuối trước khi bước sang DevOps.",
      outcomes: [
        "Đánh version theo Semantic Versioning MAJOR.MINOR.PATCH",
        "Tạo git tag + GitHub Release kèm release notes",
        "Viết CHANGELOG.md theo khuôn Keep a Changelog"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Semantic Versioning (semver)** — ngôn ngữ version của cả ngành:
> **MAJOR** (2.0.0) — thay đổi phá vỡ tương thích • **MINOR** (1.3.0) — thêm tính năng, không phá • **PATCH** (1.2.4) — sửa bug.

\`\`\`bash
git tag -a v1.0.0 -m "Phát hành bản tốt nghiệp đầu tiên"
git push origin v1.0.0        # GitHub: Releases -> Draft new release từ tag
\`\`\`

**CHANGELOG.md** (chuẩn Keep a Changelog): mỗi phiên bản các mục Added / Changed / Fixed / Security — người dùng đọc CHANGELOG, máy đọc git log.

**Rà soát trước release** (tổng hợp toàn khóa): test xanh (89) • checklist bảo mật (56, 83) • .env không trong repo (67) • README người-lạ-chạy-được (69) • LICENSE + phiên bản trong package.json khớp tag.`,
    labSteps: [
      "Quyết định version đầu: v1.0.0 — chú thích vì sao không phải 0.x (sản phẩm nộp tốt nghiệp = cam kết dùng được).",
      "Viết CHANGELOG.md khuôn Keep a Changelog cho v1.0.0: Added liệt kê 8-10 tính năng đã xây từ bài 71.",
      "Viết release notes: 3 đoạn — sản phẩm là gì, điểm nổi bật, hướng dẫn nhanh + link demo.",
      "Chạy bảng rà soát 5 mục (test/bảo mật/.env/README/LICENSE) — tick từng dòng bằng chứng cứ.",
      "Thao tác thật trên repo: git tag v1.0.0, push tag, tạo GitHub Release.",
      "Commit 'chore: release v1.0.0' — khép Chặng 5."
    ],
    commonMistakes: [
      { symptom: "Version nhảy loạn 1.0 → 1.5 → 2.0 trong 3 ngày không lý do.", cause: "Đánh số theo cảm hứng.", fix: "Semver có luật: hỏi 'có phá tương thích không? có thêm tính năng không?' rồi mới tăng số." },
      { symptom: "CHANGELOG viết 'sửa nhiều thứ, cập nhật code'.", cause: "Viết cho có.", fix: "Mỗi dòng một thay đổi người dùng cảm nhận được — copy từ commit Conventional (bài 67) rồi biên tập." },
      { symptom: "Release xong phát hiện .env nằm trong source zip.", cause: "Bỏ bước rà soát cuối.", fix: "Bảng 5 mục là nghi thức bắt buộc TRƯỚC khi bấm publish — không ngoại lệ." }
    ],
    challenge: "Dựng GitHub Actions workflow đơn giản: push tag v* thì tự chạy test và tạo draft release — CI/CD đầu tiên của bạn, cầu nối sang Chặng 6.",
    checklist: [
      "Tag v1.0.0 + GitHub Release đã tồn tại",
      "CHANGELOG đúng khuôn, đọc hiểu được",
      "Bảng rà soát 5 mục tick đủ có bằng chứng"
    ],
    tasks: ["Viết trang tổng kết chứa CHANGELOG khuôn Keep a Changelog (Added/Fixed/Security), giải thích semver và bảng rà soát 5 mục."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 90: Release v1.0.0</title>
</head>
<body>
    <h1>Hồ sơ phát hành v1.0.0</h1>
    <!-- TODO 1: giải thích MAJOR.MINOR.PATCH kèm ví dụ -->
    <!-- TODO 2: CHANGELOG — Added / Changed / Fixed / Security cho v1.0.0 -->
    <!-- TODO 3: bảng rà soát 5 mục: test, bảo mật, .env, README, LICENSE -->
    <!-- TODO 4: <pre> lệnh git tag -a v1.0.0 + push -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("major") && c.includes("minor") && c.includes("patch") && c.includes("changelog") && c.includes("git tag") && c.includes("v1.0.0") && c.includes("<table");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Sửa một bug không đổi tính năng — version 1.2.3 tăng thành bao nhiêu?",
      snippet: "MAJOR.MINOR.PATCH — 1.2.3 → [ ??? ]",
      options: [
        { text: "2.0.0", correct: false },
        { text: "1.3.0", correct: false },
        { text: "1.2.4 — chỉ tăng PATCH", correct: true },
        { text: "1.2.3.1", correct: false }
      ],
      correctIdx: 2
    },
    miniQuiz: [
      { q: "Thêm tính năng mới không phá tương thích thì tăng số nào?", o: ["MAJOR", "MINOR", "PATCH", "Không tăng"], a: 1 },
      { q: "CHANGELOG viết cho ai đọc?", o: ["Chỉ máy", "Con người — mỗi dòng một thay đổi cảm nhận được", "Chỉ admin", "Google bot"], a: 1 },
      { q: "git tag khác commit thường thế nào?", o: ["Không khác", "Tag là nhãn bất động đánh dấu một mốc phát hành cụ thể", "Tag tự deploy", "Tag xoá lịch sử"], a: 1 },
      { q: "Việc cuối cùng TRƯỚC khi bấm publish release?", o: ["Đổi màu logo", "Chạy bảng rà soát: test, bảo mật, .env, README, LICENSE", "Tweet thông báo", "Tăng version thêm lần nữa"], a: 1 }
    ]
  }
];
