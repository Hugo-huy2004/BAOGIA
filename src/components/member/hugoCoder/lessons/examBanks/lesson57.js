/**
 * Ngân hàng đề — Bài 57: Kiểm tra Tổng hợp số 1 (chặng 1–4).
 *
 * Nghiêng về BẢO MẬT ỨNG DỤNG: HTTPS/hạ tầng · XSS · CSRF · JWT · OAuth2 ·
 * bộ quy tắc an toàn, có nhắc lại nền tảng của ba chặng đầu.
 * Bài 58 phủ nửa còn lại (dữ liệu, kiến trúc, chất lượng mã) — hai ngân hàng
 * cố ý KHÔNG trùng câu nào.
 *
 * Cơ cấu và quy ước đáp án: xem `lesson6.js`.
 */
export default [
  // ── Suy luận · nhẹ ────────────────────────────────────────────────────────
  {
    group: "logic", level: "easy",
    q: "Một ô bình luận in thẳng nội dung người dùng bằng innerHTML. Ai đó gõ vào `<img src=x onerror=alert(1)>`. Chuyện gì xảy ra?",
    o: [
      "Mã trong onerror chạy trên trình duyệt của mọi người xem — đó là XSS",
      "Trình duyệt hiện đúng dòng chữ đó, không có gì xảy ra",
      "Máy chủ báo lỗi 500",
      "Ảnh được tải về từ tên miền x",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Cookie phiên đăng nhập KHÔNG đặt HttpOnly. Rủi ro trực tiếp là gì?",
    o: [
      "Mã JavaScript lạ (qua XSS) đọc được cookie và cướp phiên",
      "Cookie hết hạn sớm hơn",
      "Trình duyệt không gửi cookie qua HTTPS",
      "Cookie bị giới hạn còn 4KB",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Trang đăng nhập chạy trên HTTP thường. Vì sao đây là lỗi nặng?",
    o: [
      "Mật khẩu đi qua mạng ở dạng đọc được, ai đứng giữa cũng lấy được",
      "HTTP không hỗ trợ form",
      "Trình duyệt sẽ không gửi được POST",
      "HTTP chậm hơn nên người dùng bỏ đi",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Một API xoá tài khoản dùng phương thức GET: /api/users/12/delete. Vấn đề đầu tiên là gì?",
    o: [
      "GET phải là thao tác chỉ đọc; chỉ cần nạp URL là tài khoản biến mất, kể cả do trình duyệt tự tải trước",
      "URL quá dài",
      "GET không gửi được tham số",
      "Không có vấn đề gì nếu có đăng nhập",
    ],
    a: 0,
  },
  // ── Suy luận · trung bình ────────────────────────────────────────────────
  {
    group: "logic", level: "medium",
    q: "Người dùng đang đăng nhập ngân hàng, rồi mở một trang lạ có form tự gửi POST tới ngân hàng đó. Trình duyệt đính kèm cookie phiên. Đây là tấn công gì và chặn bằng gì?",
    o: [
      "CSRF — chặn bằng token CSRF và cookie SameSite",
      "XSS — chặn bằng cách lọc đầu vào",
      "SQL injection — chặn bằng prepared statement",
      "Man-in-the-middle — chặn bằng HTTPS",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "JWT được lưu trong localStorage. Vì sao nhiều tài liệu khuyên dùng cookie HttpOnly hơn?",
    o: [
      "localStorage đọc được bằng JavaScript, nên một lỗ hổng XSS là mất luôn token",
      "localStorage không lưu được chuỗi dài",
      "Cookie nhanh hơn localStorage",
      "localStorage bị xoá mỗi khi đóng tab",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Máy chủ chỉ giải mã JWT rồi tin luôn trường `role: \"admin\"` bên trong mà không kiểm chữ ký. Hậu quả?",
    o: [
      "Ai cũng tự tạo token ghi mình là admin, vì phần thân JWT chỉ là Base64 chứ không mã hoá",
      "Không sao, vì phần thân JWT đã được mã hoá",
      "Token sẽ hết hạn ngay lập tức",
      "Trình duyệt sẽ từ chối gửi token",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Một biểu mẫu lọc từ khoá `<script>` ở phía trình duyệt trước khi gửi. Vì sao vẫn không an toàn?",
    o: [
      "Kẻ tấn công gọi thẳng API, bỏ qua giao diện — mọi kiểm tra phải lặp lại ở máy chủ",
      "Vì `<script>` viết hoa sẽ lọt lưới",
      "Vì JavaScript không so sánh chuỗi chính xác",
      "Vì phải lọc bằng biểu thức chính quy mới đúng",
    ],
    a: 0,
  },
  // ── Suy luận · nâng cao ──────────────────────────────────────────────────
  {
    group: "logic", level: "hard",
    q: "Hệ thống chấp nhận JWT với header `alg: \"none\"` khi thư viện được cấu hình lỏng. Vì sao đây là lỗ hổng nghiêm trọng?",
    o: [
      "Kẻ tấn công gửi token không chữ ký và máy chủ vẫn chấp nhận — phải cố định thuật toán ở phía máy chủ",
      "Vì \"none\" làm token dài hơn giới hạn",
      "Vì trình duyệt không gửi được token thiếu chữ ký",
      "Vì token sẽ không giải mã được",
    ],
    a: 0,
  },
  {
    group: "logic", level: "hard",
    q: "Trong OAuth2, vì sao luồng Authorization Code kèm PKCE được khuyến nghị cho ứng dụng chạy trên trình duyệt thay vì Implicit?",
    o: [
      "Token không xuất hiện trên URL, và code chỉ đổi được bởi bên giữ code_verifier nên bị chặn giữa đường cũng vô dụng",
      "Vì PKCE nhanh hơn một vòng gọi",
      "Vì Implicit không hỗ trợ refresh token",
      "Vì PKCE không cần HTTPS",
    ],
    a: 0,
  },

  // ── Lý thuyết ────────────────────────────────────────────────────────────
  {
    group: "theory",
    q: "Tam giác bảo mật CIA gồm ba trụ cột nào?",
    o: [
      "Confidentiality, Integrity, Availability",
      "Control, Identity, Access",
      "Cipher, Integrity, Authentication",
      "Confidentiality, Identity, Authorization",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "HTTPS bảo vệ dữ liệu trên đường truyền nhờ giao thức nào?",
    o: ["TLS", "SSH", "FTP", "SMTP"],
    a: 0,
  },
  {
    group: "theory",
    q: "Thuộc tính cookie nào đảm bảo cookie chỉ được gửi qua kết nối HTTPS?",
    o: ["Secure", "HttpOnly", "SameSite", "Path"],
    a: 0,
  },
  {
    group: "theory",
    q: "`SameSite=Strict` trên cookie có tác dụng gì?",
    o: [
      "Trình duyệt không gửi cookie kèm request xuất phát từ trang khác",
      "Cookie chỉ đọc được bởi máy chủ",
      "Cookie được mã hoá trước khi lưu",
      "Cookie hết hạn khi đóng trình duyệt",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Một JWT gồm ba phần được ngăn bởi dấu chấm, đó là những phần nào?",
    o: ["Header, Payload, Signature", "Key, Value, Hash", "User, Role, Expiry", "Issuer, Subject, Audience"],
    a: 0,
  },
  {
    group: "theory",
    q: "Phần payload của JWT được bảo vệ thế nào?",
    o: [
      "Không được giấu — chỉ mã Base64URL; chữ ký chỉ chứng minh nó chưa bị sửa",
      "Được mã hoá AES nên không đọc được",
      "Được băm SHA-256 nên không đọc được",
      "Chỉ máy chủ phát hành mới giải được",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong OAuth2, refresh token dùng để làm gì?",
    o: [
      "Xin access token mới khi token cũ hết hạn mà không bắt người dùng đăng nhập lại",
      "Xác thực thay cho mật khẩu ở mọi request",
      "Mã hoá access token",
      "Ghi nhớ thiết bị đã tin cậy",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Nguyên tắc đặc quyền tối thiểu (least privilege) nghĩa là gì?",
    o: [
      "Mỗi tài khoản và tiến trình chỉ được cấp đúng quyền tối thiểu để làm việc của mình",
      "Chỉ quản trị viên mới được đăng nhập",
      "Giới hạn số người dùng đồng thời",
      "Chỉ cấp quyền đọc, không bao giờ cấp quyền ghi",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Header `Strict-Transport-Security` (HSTS) bắt trình duyệt làm gì?",
    o: [
      "Luôn dùng HTTPS cho tên miền đó trong khoảng thời gian khai báo",
      "Từ chối mọi cookie không có Secure",
      "Chặn tải script từ tên miền khác",
      "Xoá bộ nhớ đệm sau mỗi phiên",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Rate limiting (giới hạn tần suất) chống được kiểu tấn công nào rõ rệt nhất?",
    o: [
      "Dò mật khẩu bằng cách thử liên tục",
      "SQL injection",
      "XSS lưu trữ",
      "Nghe lén đường truyền",
    ],
    a: 0,
  },

  // ── Đọc & điền code ──────────────────────────────────────────────────────
  {
    group: "code",
    q: "Điền vào chỗ trống để chèn chữ người dùng nhập mà KHÔNG bị XSS:",
    code: "const comment = layBinhLuan();\nbox.____ = comment;",
    o: ["textContent", "innerHTML", "outerHTML", "insertAdjacentHTML"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để cookie phiên không đọc được bằng JavaScript:",
    code: "res.cookie(\"member_jwt\", token, {\n  ____: true,\n  secure: true,\n  sameSite: \"lax\",\n});",
    o: ["httpOnly", "signed", "encrypted", "private"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để xác minh chữ ký của JWT:",
    code: "const payload = jwt.____(token, process.env.JWT_SECRET);\nreq.memberEmail = payload.email;",
    o: ["verify", "decode", "parse", "read"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để cố định thuật toán, chặn tấn công `alg: none`:",
    code: "jwt.verify(token, secret, {\n  ____: [\"HS256\"],\n});",
    o: ["algorithms", "alg", "methods", "ciphers"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy danh tính từ token đã xác thực, không tin dữ liệu máy khách gửi:",
    code: "router.get(\"/me/orders\", requireMember, (req, res) => {\n  const email = ____;\n  res.json(layDonHang(email));\n});",
    o: ["req.memberEmail", "req.query.email", "req.body.email", "req.params.email"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để chặn Flash, Java applet và các plugin cũ mà trang không dùng:",
    code: "helmet.contentSecurityPolicy({\n  directives: { \"object-src\": [____] },\n});",
    o: ["\"'none'\"", "\"*\"", "\"'unsafe-inline'\"", "\"data:\""],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để buộc trình duyệt luôn dùng HTTPS trong một năm:",
    code: "res.setHeader(\n  \"Strict-Transport-Security\",\n  \"____=31536000; includeSubDomains\"\n);",
    o: ["max-age", "expires", "duration", "ttl"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để so khớp mật khẩu người dùng nhập với chuỗi băm đã lưu:",
    code: "const ok = await bcrypt.____(matKhauNhap, user.passwordHash);\nif (!ok) return res.status(401).json({ error: \"Sai mật khẩu\" });",
    o: ["compare", "hash", "verify", "match"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để giới hạn 5 lần đăng nhập trong 15 phút:",
    code: "const limiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  ____: 5,\n});",
    o: ["max", "limit", "count", "tries"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để sinh chuỗi ngẫu nhiên đủ mạnh làm token CSRF:",
    code: "const csrfToken = crypto.____(32).toString(\"hex\");",
    o: ["randomBytes", "createHash", "randomInt", "pseudoRandomBytes"],
    a: 0,
  },

  // ── Nâng cao ─────────────────────────────────────────────────────────────
  {
    group: "advanced",
    q: "XSS lưu trữ (stored) nguy hiểm hơn XSS phản chiếu (reflected) ở điểm nào?",
    o: [
      "Mã độc nằm sẵn trong dữ liệu và chạy với mọi người xem trang, không cần dụ ai bấm link",
      "Nó chạy nhanh hơn",
      "Nó bỏ qua được HTTPS",
      "Nó không bị CSP chặn",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao token CSRF phải gắn với phiên và không được đặt trong cookie đọc được bằng JavaScript?",
    o: [
      "Nếu trang khác đọc hoặc đoán được token thì nó gửi kèm và cơ chế mất tác dụng",
      "Vì cookie có giới hạn 4KB",
      "Vì token phải mã hoá mới hợp lệ",
      "Vì cookie không gửi kèm POST",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Access token nên đặt hạn ngắn, refresh token hạn dài. Lý do của cách chia này là gì?",
    o: [
      "Token bị lộ chỉ dùng được trong thời gian ngắn, còn refresh token thu hồi được ở máy chủ",
      "Vì access token chiếm nhiều băng thông hơn",
      "Vì refresh token không thể bị đánh cắp",
      "Vì trình duyệt xoá token dài hạn trước",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Phòng thủ nhiều lớp (defense in depth) nghĩa là gì trong thực tế?",
    o: [
      "Giả định mỗi lớp đều có thể thủng, nên đặt nhiều lớp độc lập: validate, phân quyền, CSP, ghi nhật ký",
      "Dùng thuật toán mã hoá mạnh nhất có thể",
      "Chỉ cho phép truy cập từ mạng nội bộ",
      "Sao lưu dữ liệu nhiều nơi",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao thông báo đăng nhập nên là \"email hoặc mật khẩu không đúng\" thay vì \"email không tồn tại\"?",
    o: [
      "Để không tiết lộ email nào có trong hệ thống, tránh bị dò danh sách tài khoản",
      "Để câu thông báo ngắn hơn",
      "Vì tiêu chuẩn HTTP yêu cầu vậy",
      "Để giảm số lần gọi cơ sở dữ liệu",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Chứng chỉ TLS chứng minh điều gì cho người dùng?",
    o: [
      "Rằng tên miền đang truy cập đúng là bên sở hữu khoá, được một tổ chức phát hành xác nhận",
      "Rằng máy chủ không có lỗ hổng bảo mật",
      "Rằng dữ liệu trên máy chủ đã được mã hoá",
      "Rằng trang không chứa mã độc",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao không nên ghi nhật ký (log) nguyên văn mật khẩu, token hay số thẻ?",
    o: [
      "Nhật ký thường được lưu lâu, sao chép nhiều nơi và nhiều người đọc được — biến thành kho bí mật rò rỉ",
      "Vì nhật ký có giới hạn dung lượng",
      "Vì ghi nhật ký làm chậm máy chủ",
      "Vì trình đọc nhật ký không hiển thị được ký tự đặc biệt",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Một endpoint cho phép đổi mật khẩu chỉ cần biết `userId` trong body. Lỗ hổng thuộc loại nào?",
    o: [
      "IDOR — tham chiếu đối tượng trực tiếp không kiểm quyền, phải lấy danh tính từ phiên đã xác thực",
      "XSS phản chiếu",
      "CSRF",
      "SQL injection",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao nên khoá phiên bản phụ thuộc (lockfile) và rà soát chúng định kỳ?",
    o: [
      "Một thư viện bị chiếm quyền phát hành có thể đưa mã độc vào bản dựng của bạn",
      "Để giảm dung lượng thư mục node_modules",
      "Để build nhanh hơn",
      "Vì npm bắt buộc phải có lockfile",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Đưa khoá bí mật vào biến `VITE_*` của frontend có an toàn không, vì sao?",
    o: [
      "Không — mọi biến VITE_ đều được nhúng vào gói tải về trình duyệt, ai cũng đọc được",
      "Có, vì Vite mã hoá biến môi trường khi build",
      "Có, nếu bật chế độ production",
      "Không, vì Vite chỉ hỗ trợ chuỗi ngắn",
    ],
    a: 0,
  },
];
