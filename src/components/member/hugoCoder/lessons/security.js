// ============================================================
// CHẶNG 4 — KỸ SƯ BẢO MẬT & TIỀN ĐỀ TRÍ TUỆ NHÂN TẠO (Bài 51-70)
// Trọng tâm: chống các cuộc tấn công mạng phổ biến và tích hợp
// mô hình ngôn ngữ lớn (LLM) vào hệ thống ứng dụng.
// ============================================================
export const SECURITY_LESSONS = [
  {
    id: "lesson51",
    title: "51. Bảo mật hạ tầng mạng & Triển khai HTTPS an toàn",
    lang: "html",
    file: "src/lesson51.html",
    duration: "45 phút",
    overview: {
      description: "Vì sao mật khẩu gửi qua HTTP là 'gửi bưu thiếp cho cả xóm đọc': cơ chế TLS/SSL của HTTPS và các header tăng cường HSTS, Secure Cookie.",
      outcomes: [
        "Mô tả HTTPS mã hóa đường truyền bằng TLS/SSL chống nghe lén và MitM",
        "Kể được vai trò chứng chỉ SSL và tổ chức cấp phát (CA, Let's Encrypt)",
        "Biết các lớp gia cố: HSTS, redirect 301 http→https, cookie Secure"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**HTTP** truyền chữ rõ (clear-text) — ai đứng giữa đường truyền (wifi quán cà phê, ISP) đều đọc được mật khẩu bằng công cụ như Wireshark.

**HTTPS = HTTP + TLS/SSL**:
> Mã hóa toàn bộ dữ liệu hai chiều — chống **nghe lén (eavesdropping)**.
> Xác thực server qua **chứng chỉ SSL** do CA (Certificate Authority) ký — chống **giả mạo/Man-in-the-Middle**.
> Đảm bảo dữ liệu không bị sửa giữa đường — toàn vẹn.

Lớp gia cố chuẩn production:
- Redirect 301 mọi request http → https.
- Header **HSTS** (Strict-Transport-Security): trình duyệt từ đó chỉ dùng https với domain.
- Cookie đặt cờ **Secure** (chỉ gửi qua https) + HttpOnly.
Let's Encrypt cấp chứng chỉ miễn phí — không còn lý do nào để chạy HTTP (chi tiết cài đặt học ở Chặng 6).`,
    labSteps: [
      "Mở src/lesson51.html — dựng trang 'hồ sơ HTTPS' của kỹ sư bảo mật.",
      "Bảng so sánh 2 cột HTTP vs HTTPS: dữ liệu trên đường truyền, cổng (80/443), nguy cơ.",
      "Mục 'Bắt tay TLS': mô tả 3 bước (chứng chỉ → trao khóa phiên → mã hóa AES) — nối kiến thức bài 31.",
      "Mục 'Gia cố': liệt kê HSTS, redirect 301, cookie Secure kèm 1 câu công dụng.",
      "Mở một website bất kỳ, bấm vào ổ khóa trên thanh địa chỉ: đọc tên CA cấp chứng chỉ và ghi vào trang."
    ],
    commonMistakes: [
      { symptom: "Trang có HTTPS nhưng form đăng nhập lại submit sang URL http://.", cause: "Mixed content — một mắt xích không mã hóa là lộ hết.", fix: "Mọi tài nguyên và endpoint đều phải https; bật HSTS chặn tụt xuống http." },
      { symptom: "Nghĩ có ổ khóa xanh nghĩa là website 'uy tín'.", cause: "Nhầm mã hóa đường truyền với uy tín nội dung.", fix: "HTTPS chỉ chứng minh kênh truyền an toàn — trang lừa đảo vẫn có thể có HTTPS." },
      { symptom: "Chứng chỉ hết hạn khiến toàn bộ người dùng bị chặn.", cause: "Quên gia hạn chứng chỉ thủ công.", fix: "Dùng Let's Encrypt + certbot tự động gia hạn (học ở Chặng 6)." }
    ],
    challenge: "Dùng DevTools tab Security trên 2 website khác nhau: ghi lại giao thức TLS, thuật toán mã hóa và CA của từng trang.",
    checklist: [
      "Kể được 3 thứ HTTPS bảo vệ: nghe lén, giả mạo, sửa đổi",
      "Thuộc cổng 80 (http) và 443 (https)",
      "Nêu được 3 lớp gia cố production"
    ],
    tasks: ["Dựng trang chứa đủ từ khóa TLS, SSL, HSTS, mã hóa và bảng so sánh HTTP/HTTPS."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 51: HTTPS & TLS</title>
</head>
<body>
    <h1>Hồ sơ bảo mật HTTPS</h1>
    <!-- TODO 1: bảng so sánh HTTP vs HTTPS (cổng, dữ liệu, nguy cơ) -->
    <!-- TODO 2: 3 bước bắt tay TLS; 3 lớp gia cố: HSTS, 301, cookie Secure -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("tls") && c.includes("ssl") && c.includes("hsts") && c.includes("mã hóa") && c.includes("<table");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "HTTPS dùng giao thức nào ở tầng dưới để mã hóa dữ liệu?",
      snippet: "https://hugo.vn — cổng 443",
      options: [
        { text: "FTP", correct: false },
        { text: "TLS/SSL", correct: true },
        { text: "SMTP", correct: false },
        { text: "UDP", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "HTTPS chống được kiểu tấn công nào trên đường truyền?", o: ["SQL Injection", "Nghe lén và Man-in-the-Middle", "Brute force mật khẩu", "DDoS"], a: 1 },
      { q: "Chứng chỉ SSL được ký bởi ai?", o: ["Chủ website tự ký là đủ", "Certificate Authority (CA) như Let's Encrypt", "Google", "Nhà mạng"], a: 1 },
      { q: "Header HSTS có tác dụng gì?", o: ["Nén dữ liệu", "Buộc trình duyệt chỉ dùng HTTPS với domain từ đó về sau", "Chặn quảng cáo", "Tăng tốc TLS"], a: 1 },
      { q: "Cờ Secure trên cookie nghĩa là gì?", o: ["Cookie được mã hóa AES", "Cookie chỉ được gửi qua kết nối HTTPS", "Cookie không hết hạn", "Cookie chống XSS"], a: 1 }
    ]
  },
  {
    id: "lesson52",
    title: "52. Phòng chống tấn công XSS (Cross-Site Scripting)",
    lang: "php",
    file: "src/lesson52.php",
    duration: "50 phút",
    overview: {
      description: "Kẻ tấn công biến chính trang web của bạn thành vũ khí: chèn script độc chạy trên trình duyệt nạn nhân — và bộ ba phòng thủ escape, sanitize, CSP.",
      outcomes: [
        "Mô tả 2 dạng XSS: Stored (lưu trong DB) và Reflected (dội qua URL)",
        "Escape đầu ra bằng htmlspecialchars với ENT_QUOTES",
        "Xếp lớp phòng thủ: escape đầu ra + CSP + cookie HttpOnly"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**XSS** (OWASP Top 10): kẻ tấn công chèn được JavaScript vào trang, script chạy dưới danh nghĩa người dùng khác — trộm cookie phiên, giả mạo thao tác, đọc dữ liệu.

> **Stored XSS** — mã độc nằm trong DB (bình luận chứa \`<script>\`), mọi người xem đều dính.
> **Reflected XSS** — mã độc nằm trong URL, dội ngược ra trang (link lừa bấm).

Phòng thủ nhiều lớp:
1. **Escape đầu ra** (chốt chặn chính): mọi dữ liệu người dùng khi in ra HTML phải qua
\`\`\`php
echo htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
// "<script>" trở thành "&lt;script&gt;" — hiển thị vô hại
\`\`\`
2. **CSP header** (bài 21) — script lạ không được chạy.
3. **Cookie HttpOnly** — JS không đọc được cookie phiên, trộm cũng khó dùng.
React/Vue escape mặc định trong template — nhưng \`dangerouslySetInnerHTML\`/\`v-html\` là cửa mở lại lỗ hổng.`,
    labSteps: [
      "Mở src/lesson52.php — trang bình luận đang dính XSS: echo thẳng $_GET['comment'].",
      "Chạy thử với ?comment=<script>alert(1)</script> (mô phỏng) — hiểu vì sao script chạy.",
      "Vá: bọc mọi echo dữ liệu người dùng bằng htmlspecialchars($x, ENT_QUOTES, 'UTF-8').",
      "Thêm header Content-Security-Policy: script-src 'self' — lớp thứ hai.",
      "Thêm setcookie với tham số httponly: true — lớp thứ ba.",
      "Chú thích phân biệt: escape đầu ra ≠ validate đầu vào (bài 15) — cần CẢ HAI."
    ],
    commonMistakes: [
      { symptom: "Chỉ chặn chữ '<script>' mà kẻ tấn công vẫn XSS được.", cause: "Blacklist từ khóa — có hàng trăm biến thể (<img onerror=...>, <svg onload=...>).", fix: "Không blacklist; escape TOÀN BỘ đầu ra bằng htmlspecialchars." },
      { symptom: "Đã htmlspecialchars nhưng thiếu ENT_QUOTES, vẫn dính XSS trong thuộc tính.", cause: "Mặc định không escape dấu nháy đơn.", fix: "Luôn truyền ENT_QUOTES để escape cả ' lẫn \"." },
      { symptom: "Dùng dangerouslySetInnerHTML render bình luận trong React.", cause: "Tự tắt lớp escape mặc định của framework.", fix: "Chỉ dùng cho HTML tin cậy đã sanitize bằng thư viện như DOMPurify." }
    ],
    challenge: "Viết hàm renderComment($text) kết hợp: strip_tags cho phép <b>, <i>, escape phần còn lại — bình luận có định dạng nhưng bất khả XSS.",
    checklist: [
      "Phân biệt Stored và Reflected XSS",
      "Thuộc khuôn htmlspecialchars + ENT_QUOTES + UTF-8",
      "Kể đủ 3 lớp phòng thủ xếp chồng"
    ],
    tasks: ["Vá lỗ hổng echo thẳng bằng htmlspecialchars ENT_QUOTES, thêm CSP header và cookie httponly."],
    starterCode: `<?php
// BÀI 52: Trang bình luận DÍNH XSS — hãy vá 3 lớp
// Lỗ hổng: echo thẳng dữ liệu người dùng
$comment = $_GET['comment'] ?? '';
echo "<div class='comment'>" . $comment . "</div>";

// TODO 1: bọc htmlspecialchars($comment, ENT_QUOTES, 'UTF-8')
// TODO 2: header Content-Security-Policy: script-src 'self'
// TODO 3: setcookie("session", $sid, ['httponly' => true, 'secure' => true]);
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("htmlspecialchars(") && c.includes("ENT_QUOTES") && c.includes("Content-Security-Policy") && c.toLowerCase().includes("httponly");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Cách hiển thị AN TOÀN nội dung do người dùng nhập để chống XSS?",
      snippet: "echo [ ... ]($_GET['comment'], ENT_QUOTES, 'UTF-8');",
      options: [
        { text: "strtolower", correct: false },
        { text: "htmlspecialchars", correct: true },
        { text: "trim", correct: false },
        { text: "eval", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "XSS cho phép kẻ tấn công làm gì?", o: ["Xoá database", "Chạy JavaScript độc trên trình duyệt nạn nhân", "Đánh sập server", "Đổi DNS"], a: 1 },
      { q: "Stored XSS khác Reflected XSS thế nào?", o: ["Không khác", "Stored nằm trong DB hại mọi người xem; Reflected dội qua URL từng nạn nhân", "Reflected nguy hiểm hơn mọi mặt", "Stored chỉ có trên PHP"], a: 1 },
      { q: "Tham số ENT_QUOTES trong htmlspecialchars để làm gì?", o: ["Escape cả nháy đơn và nháy kép", "In hoa", "Nén chuỗi", "Đổi UTF-8"], a: 0 },
      { q: "Cookie HttpOnly giúp gì khi trang dính XSS?", o: ["Chặn script chạy", "Script không đọc được cookie phiên để gửi về kẻ tấn công", "Tự vá lỗ hổng", "Mã hóa cookie"], a: 1 }
    ]
  },
  {
    id: "lesson53",
    title: "53. Phòng chống tấn công CSRF (Cross-Site Request Forgery)",
    lang: "php",
    file: "src/lesson53.php",
    duration: "50 phút",
    overview: {
      description: "Trang lạ 'mượn tay' trình duyệt của nạn nhân gửi request kèm cookie đăng nhập sẵn có: hiểu kịch bản tấn công và dựng 2 lá chắn CSRF Token + SameSite.",
      outcomes: [
        "Kể lại kịch bản CSRF hoàn chỉnh bằng lời của mình",
        "Sinh - nhúng - kiểm CSRF token cho form bằng PHP session",
        "Cấu hình cookie SameSite và nêu vì sao Bearer JWT miễn nhiễm CSRF"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Kịch bản CSRF**: nạn nhân đang đăng nhập ngân_hàng.vn (cookie phiên còn sống) → bị dụ mở trang-xấu.com → trang này ngầm submit form tới ngân_hàng.vn/chuyen-tien → trình duyệt TỰ ĐỘNG đính kèm cookie → server tưởng là nạn nhân tự thao tác.

Hai lá chắn chuẩn:
1. **CSRF Token** — server sinh token ngẫu nhiên theo phiên, nhúng vào form; request ghi dữ liệu phải nộp lại token khớp — trang lạ không thể biết token:
\`\`\`php
$_SESSION['csrf'] = bin2hex(random_bytes(32));
// trong form: <input type="hidden" name="csrf" value="...">
if (!hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) { http_response_code(403); exit; }
\`\`\`
2. **SameSite Cookie** — \`SameSite=Lax/Strict\`: trình duyệt không gửi cookie cho request xuất phát từ site khác.

Hệ thống dùng **Bearer JWT trong header Authorization** (không cookie tự động) thì miễn nhiễm CSRF bẩm sinh — trang lạ không thể đặt header của domain khác.`,
    labSteps: [
      "Mở src/lesson53.php — form đổi mật khẩu đang KHÔNG có token.",
      "Sinh token: session_start(); $_SESSION['csrf'] = bin2hex(random_bytes(32));",
      "Nhúng <input type=\"hidden\" name=\"csrf\"> vào form với giá trị token.",
      "Khối xử lý POST: so token bằng hash_equals (chống timing attack) — sai trả 403 và dừng.",
      "Thêm setcookie session với 'samesite' => 'Lax'.",
      "Chú thích: vẽ kịch bản tấn công 4 bước và đánh dấu bước nào bị 2 lá chắn cắt đứt."
    ],
    commonMistakes: [
      { symptom: "So token bằng == thay vì hash_equals.", cause: "So sánh chuỗi thường lộ thời gian xử lý (timing attack).", fix: "Luôn hash_equals cho mọi so sánh giá trị bí mật." },
      { symptom: "Đặt token cố định dùng chung cho mọi người dùng.", cause: "Token đoán được là vô dụng.", fix: "Token ngẫu nhiên per-session bằng random_bytes." },
      { symptom: "Cho GET /delete-account?id=1 xoá tài khoản.", cause: "Thao tác ghi nằm trên GET — CSRF chỉ cần 1 thẻ <img src=...> là kích hoạt.", fix: "Mọi thao tác ghi dùng POST/PUT/DELETE kèm token." }
    ],
    challenge: "Viết middleware csrfProtect() dùng chung: tự bỏ qua GET, kiểm token cho POST/PUT/DELETE, trả JSON 403 chuẩn khi sai.",
    checklist: [
      "Kể trọn kịch bản tấn công 4 bước",
      "Thuộc khuôn sinh + nhúng + kiểm token (hash_equals)",
      "Giải thích vì sao Bearer JWT không dính CSRF"
    ],
    tasks: ["Sinh CSRF token bằng random_bytes, nhúng input hidden, kiểm bằng hash_equals và đặt cookie SameSite."],
    starterCode: `<?php
session_start();
// BÀI 53: Form đổi mật khẩu đang trần trụi trước CSRF
// TODO 1: $_SESSION['csrf'] = bin2hex(random_bytes(32));
// TODO 2: nhúng <input type="hidden" name="csrf" value="...">
// TODO 3: if (!hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '')) { http_response_code(403); exit; }
// TODO 4: cookie 'samesite' => 'Lax'
?>
<form method="POST" action="/change-password">
  <input type="password" name="new_password">
  <button type="submit">Đổi mật khẩu</button>
</form>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("random_bytes(") && c.includes('type="hidden"') && c.includes("hash_equals(") && c.toLowerCase().includes("samesite");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Thuộc tính cookie nào chặn trình duyệt tự gửi cookie theo request từ site LẠ?",
      snippet: "Set-Cookie: session=abc; [ ... ]=Lax; Secure; HttpOnly",
      options: [
        { text: "Domain", correct: false },
        { text: "SameSite", correct: true },
        { text: "Path", correct: false },
        { text: "MaxAge", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "CSRF lợi dụng điều gì của trình duyệt?", o: ["Lỗi render", "Cookie được TỰ ĐỘNG đính kèm mọi request tới domain", "Cache DNS", "LocalStorage"], a: 1 },
      { q: "Vì sao trang lạ không thể vượt qua CSRF token?", o: ["Token quá dài", "Trang lạ không đọc được token nằm trong phiên/form của site thật", "Token được mã hóa AES", "Trình duyệt chặn form"], a: 1 },
      { q: "So sánh token phải dùng hàm nào?", o: ["==", "hash_equals — chống timing attack", "strcmp", "in_array"], a: 1 },
      { q: "Vì sao Bearer JWT trong header miễn nhiễm CSRF?", o: ["JWT được mã hóa", "Header Authorization không được trình duyệt tự đính kèm chéo site", "JWT ngắn hạn", "JWT nằm trong cookie"], a: 1 }
    ]
  },
  {
    id: "lesson54",
    title: "54. Thực hành cao cấp: Xác thực JWT & Kết hợp chống CSRF",
    lang: "php",
    file: "src/lesson54.php",
    duration: "55 phút",
    overview: {
      description: "Lắp ráp lá chắn hoàn chỉnh cho API: đọc JWT từ header Authorization, kiểm định dạng 3 phần, trả đúng mã 401/403 — kiến trúc xác thực của chính hệ thống HugoCoder.",
      outcomes: [
        "Bóc token từ header 'Authorization: Bearer <token>' bằng regex",
        "Kiểm cấu trúc JWT 3 phần và đọc payload (base64)",
        "Trả đúng ngữ nghĩa: 401 chưa xác thực, 403 không đủ quyền"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**JWT (JSON Web Token)** — thẻ thông hành tự chứa, 3 phần nối bằng dấu chấm:

> \`header.payload.signature\` — header (thuật toán) và payload (dữ liệu phiên: email, quyền, hạn) chỉ là **Base64** ai cũng đọc được; **signature** ký bằng khóa bí mật server mới là thứ chống giả mạo.

Luồng chuẩn: đăng nhập đúng → server ký JWT trả về → client gửi kèm mọi request:
\`\`\`php
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\\s(\\S+)/', $auth, $m)) {
  $jwt = $m[1];
  if (count(explode('.', $jwt)) !== 3) { http_response_code(401); exit; }
  $payload = json_decode(base64_decode(explode('.', $jwt)[1]), true);
} else { http_response_code(401); exit; }
\`\`\`

> **401 Unauthorized** — chưa/sai xác thực (thiếu token, token hỏng). **403 Forbidden** — danh tính rõ nhưng không đủ quyền. Vì token đi bằng header (không cookie), kiến trúc này đồng thời khóa chết CSRF — nối mạch bài 53.`,
    labSteps: [
      "Mở src/lesson54.php — dựng middleware xác thực API.",
      "Đọc $_SERVER['HTTP_AUTHORIZATION'], bóc token bằng preg_match('/Bearer\\s(\\S+)/').",
      "Không có header → http_response_code(401) + json lỗi + exit.",
      "explode('.') kiểm đủ 3 phần — sai cấu trúc trả 401.",
      "Giải mã payload: json_decode(base64_decode(phần_thứ_2)) — đọc trường role.",
      "role không phải 'admin' mà gọi endpoint quản trị → 403; hợp lệ → echo json thành công.",
      "Chú thích: vì sao KHÔNG BAO GIỜ để dữ liệu nhạy cảm (mật khẩu) trong payload."
    ],
    commonMistakes: [
      { symptom: "Cất mật khẩu/số dư trong payload JWT.", cause: "Tưởng payload được mã hóa.", fix: "Payload chỉ là Base64 — ai cũng decode được; chỉ chứa định danh + quyền + hạn." },
      { symptom: "Trả 403 khi thiếu token, 401 khi thiếu quyền — lẫn lộn.", cause: "Chưa phân biệt ngữ nghĩa 2 mã.", fix: "Chưa biết là ai → 401; biết là ai nhưng cấm → 403." },
      { symptom: "Chỉ kiểm 3 phần mà bỏ qua chữ ký, ai tự chế token cũng lọt.", cause: "Kiểm cấu trúc không thay được kiểm chữ ký.", fix: "Production phải verify signature bằng khóa bí mật (thư viện firebase/php-jwt); bài này mới dừng ở cấu trúc." }
    ],
    challenge: "Thêm kiểm hạn dùng: đọc trường exp trong payload, so với time() — hết hạn trả 401 kèm mã lỗi 'token_expired' để client biết đường refresh.",
    checklist: [
      "Thuộc cấu trúc 3 phần và phần nào chống giả mạo",
      "Phân biệt 401 và 403 không cần nghĩ",
      "Nói được vì sao payload không được chứa bí mật"
    ],
    tasks: ["Bóc Bearer token bằng preg_match, kiểm 3 phần bằng explode, giải payload base64 và trả 401/403 đúng ngữ nghĩa."],
    starterCode: `<?php
// BÀI 54: Middleware xác thực JWT cho API
header("Content-Type: application/json");
// TODO 1: đọc HTTP_AUTHORIZATION, preg_match Bearer
// TODO 2: thiếu/hỏng -> 401 + exit; explode('.') phải đủ 3 phần
// TODO 3: payload = json_decode(base64_decode(...), true); đọc role
// TODO 4: role khác admin -> 403; hợp lệ -> echo json ok
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("HTTP_AUTHORIZATION") && c.includes("Bearer") && c.includes("explode('.'") && c.includes("base64_decode(") && c.includes("403") && c.includes("401");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "JWT gồm mấy phần phân tách bởi dấu chấm?",
      snippet: "eyJhbGc...[.]eyJlbWFpb...[.]SflKxwRJ...",
      options: [
        { text: "2 phần", correct: false },
        { text: "3 phần: header.payload.signature", correct: true },
        { text: "4 phần", correct: false },
        { text: "Tuỳ độ dài", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Phần nào của JWT chống giả mạo?", o: ["Header", "Payload", "Signature — ký bằng khóa bí mật server", "Cả ba như nhau"], a: 2 },
      { q: "Payload JWT được bảo vệ thế nào?", o: ["Mã hóa AES", "Chỉ là Base64 — ai cũng đọc được, không để bí mật vào", "Băm một chiều", "Nén gzip"], a: 1 },
      { q: "Thiếu token hợp lệ thì API trả mã nào?", o: ["400", "401 Unauthorized", "403 Forbidden", "500"], a: 1 },
      { q: "Đã đăng nhập nhưng không đủ quyền admin thì trả mã nào?", o: ["401", "403 Forbidden", "404", "422"], a: 1 }
    ]
  },
  {
    id: "lesson55",
    title: "55. Xác thực nâng cao: Kết hợp JWT & OAuth2",
    lang: "javascript",
    file: "src/lesson55.js",
    duration: "50 phút",
    overview: {
      description: "'Đăng nhập bằng Google' hoạt động thế nào: giao thức ủy quyền OAuth2, vai trò 4 bên, và cách backend đổi danh tính Google lấy JWT nội bộ.",
      outcomes: [
        "Phân biệt Authentication (xác thực) và Authorization (ủy quyền)",
        "Vẽ luồng OAuth2 Authorization Code: 4 bên, 6 bước",
        "Hiểu khuôn: ID token của Google → verify tại backend → cấp JWT nội bộ"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **Authentication** — bạn là ai (đăng nhập). **Authorization** — bạn được làm gì (quyền).

**OAuth2** — chuẩn ủy quyền: cho phép app truy cập tài nguyên người dùng ở dịch vụ khác **mà không cầm mật khẩu của họ**. Bốn vai: Resource Owner (người dùng) — Client (app của bạn) — Authorization Server (Google) — Resource Server (API Google).

Luồng Authorization Code (rút gọn):
1. App đưa người dùng sang trang đăng nhập Google.
2. Người dùng đồng ý → Google trả **code** về redirect_uri.
3. Backend đổi code (kèm client_secret) lấy **token**.
4. Backend **verify** ID token với Google → biết chắc email thật.
5. Backend phát hành **JWT nội bộ** của hệ thống cho phiên làm việc.

> Nguyên tắc sống còn: bước verify và client_secret PHẢI ở backend — frontend gửi lên một ID token thì backend không được tin mù, phải kiểm với Google (đúng kiến trúc requireMember của hệ thống HugoCoder).`,
    labSteps: [
      "Mở src/lesson55.js — mô phỏng luồng phía client + backend.",
      "Viết hằng OAUTH_URL gồm client_id, redirect_uri, scope, response_type=code — chú thích từng tham số.",
      "Viết hàm loginWithGoogle() — window.location.href = OAUTH_URL (chú thích: bước 1).",
      "Viết giả lập backend exchangeCodeForToken(code): fetch POST kèm client_secret (chú thích: vì sao bước này KHÔNG được ở frontend).",
      "Viết verifyIdToken(idToken): giả lập gọi Google tokeninfo rồi trả về email đã xác minh.",
      "Cuối luồng: issueInternalJwt(email) — chú thích 'từ đây hệ thống dùng JWT nội bộ như bài 54'."
    ],
    commonMistakes: [
      { symptom: "Nhét client_secret vào code frontend.", cause: "Không phân biệt phần công khai/bí mật của luồng.", fix: "client_secret và bước đổi code chỉ tồn tại ở backend/.env." },
      { symptom: "Frontend gửi email 'tôi là admin@site.com' và backend tin luôn.", cause: "Bỏ bước verify ID token với Google.", fix: "Backend luôn verify token với Google trước khi phát JWT nội bộ — không tin bất kỳ claim nào client tự khai." },
      { symptom: "Dùng access token của Google làm phiên đăng nhập app mình.", cause: "Lẫn vai: token của Google là để gọi API Google.", fix: "Đổi sang JWT nội bộ do server mình ký — kiểm soát hạn, quyền, thu hồi." }
    ],
    challenge: "Vẽ sơ đồ tuần tự (chú thích ASCII) đủ 6 bước với 4 vai — đánh dấu bằng ký hiệu 🔒 những bước bắt buộc nằm ở backend.",
    checklist: [
      "Phân biệt Authentication vs Authorization trong một câu",
      "Kể đúng 4 vai và 6 bước của luồng",
      "Thuộc nguyên tắc: verify ở backend, secret không rời server"
    ],
    tasks: ["Viết luồng mô phỏng: OAUTH_URL (client_id, redirect_uri, scope), exchangeCodeForToken, verifyIdToken, issueInternalJwt."],
    starterCode: `// BÀI 55: OAuth2 "Đăng nhập bằng Google" — mô phỏng luồng
// TODO 1: OAUTH_URL với client_id, redirect_uri, scope, response_type=code
// TODO 2: loginWithGoogle() — chuyển hướng người dùng
// TODO 3: exchangeCodeForToken(code) — backend đổi code + client_secret lấy token
// TODO 4: verifyIdToken(idToken) — backend kiểm với Google
// TODO 5: issueInternalJwt(email) — phát JWT nội bộ
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("client_id") && c.includes("redirect_uri") && c.includes("exchangecodefortoken") && c.includes("verifyidtoken") && c.includes("issueinternaljwt");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Trong luồng OAuth2, client_secret và bước verify token phải nằm ở đâu?",
      snippet: "exchangeCodeForToken(code, client_secret) // đặt ở đâu?",
      options: [
        { text: "Frontend cho tiện", correct: false },
        { text: "Backend — secret không bao giờ rời server", correct: true },
        { text: "LocalStorage", correct: false },
        { text: "Trong URL", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "OAuth2 giải quyết bài toán gì?", o: ["Nén dữ liệu", "Ủy quyền truy cập không cần đưa mật khẩu cho app thứ ba", "Mã hóa email", "Tăng tốc đăng nhập"], a: 1 },
      { q: "Authentication khác Authorization thế nào?", o: ["Giống nhau", "Authentication: bạn là ai; Authorization: bạn được làm gì", "Authorization có trước", "Chỉ khác tên"], a: 1 },
      { q: "Vì sao backend phải verify ID token với Google?", o: ["Cho chậm chắc", "Client có thể gửi token giả — chỉ Google xác nhận được thật", "Để lấy avatar", "Quy định pháp luật"], a: 1 },
      { q: "Sau khi verify thành công, hệ thống nên dùng gì cho phiên?", o: ["Access token Google", "JWT nội bộ do server mình ký", "Cookie không mã hóa", "Email dạng thô"], a: 1 }
    ]
  },
  {
    id: "lesson56",
    title: "56. Tổng kết Bảo mật & Bộ quy tắc an toàn cho dự án lớn",
    lang: "html",
    file: "src/lesson56.html",
    duration: "45 phút",
    overview: {
      description: "Gom mọi lá chắn đã học thành một Security Checklist theo khung OWASP Top 10 — tài liệu bạn sẽ mang theo suốt sự nghiệp và dùng ngay cho đồ án Chặng 5.",
      outcomes: [
        "Tự dựng Security Checklist 10 mục theo OWASP",
        "Gắn từng lỗ hổng với bài học + lá chắn tương ứng",
        "Hình thành phản xạ review bảo mật trước mọi lần release"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**OWASP Top 10** — danh sách rủi ro bảo mật web phổ biến nhất do Open Worldwide Application Security Project công bố, là khung tham chiếu chuẩn của ngành.

Ánh xạ những gì bạn đã có trong tay:
> **Injection (SQLi)** → prepare/execute (bài 8, 9) • **XSS** → escape + CSP (bài 52, 21)
> **CSRF/thiết kế thiếu an toàn** → token + SameSite (bài 53) • **Xác thực hỏng** → bcrypt + JWT verify (bài 33, 54, 55)
> **Lộ dữ liệu nhạy cảm** → HTTPS/TLS (bài 51), không log bí mật • **Cấu hình sai** → tắt debug ở production, header bảo mật
> **Never trust user input** (bài 15) — nguyên tắc phủ lên tất cả.

Checklist trước mỗi release: input validate? — output escape? — truy vấn tham số hóa? — mật khẩu bcrypt? — HTTPS ép buộc? — quyền kiểm ở server? — secret trong .env? — dependency cập nhật?`,
    labSteps: [
      "Mở src/lesson56.html — dựng Security Checklist của riêng bạn.",
      "Tạo bảng 3 cột: Lỗ hổng — Lá chắn — Bài đã học, điền tối thiểu 8 hàng từ trí nhớ (XSS, CSRF, SQLi, mật khẩu, HTTPS, CORS/CSP, JWT, input).",
      "Viết mục 'Quy tắc vàng': 5 câu bạn tự đúc kết (vd: Never trust user input; secret không rời server...).",
      "Đánh dấu 3 mục bạn còn yếu nhất — đó là bài cần ôn trước kỳ thi 57-58.",
      "Lưu file này lại — Chặng 5 bạn sẽ dùng nó review đồ án thật."
    ],
    commonMistakes: [
      { symptom: "Chỉ vá lỗ hổng khi bị báo cáo.", cause: "Bảo mật kiểu chữa cháy.", fix: "Checklist chạy TRƯỚC mỗi release — phòng rẻ hơn chữa nghìn lần." },
      { symptom: "Tin rằng dự án nhỏ không ai thèm tấn công.", cause: "Ảo tưởng mục tiêu.", fix: "Bot quét lỗ hổng tự động 24/7 không phân biệt lớn nhỏ — mọi form công khai đều là mục tiêu." },
      { symptom: "Commit file .env chứa khóa bí mật lên GitHub.", cause: "Thiếu .gitignore ngay từ đầu.", fix: "Thêm .env vào .gitignore trước commit đầu tiên; lỡ lộ thì THAY khóa ngay, xoá commit không đủ." }
    ],
    challenge: "Lấy một dự án cũ bất kỳ của bạn, chạy checklist 8 mục — ghi lại mục nào FAIL và vá ít nhất một mục ngay hôm nay.",
    checklist: [
      "Bảng ánh xạ đủ 8 lỗ hổng — lá chắn — bài học",
      "Có 5 quy tắc vàng tự đúc kết",
      "Đã xác định 3 điểm yếu cần ôn trước kỳ thi"
    ],
    tasks: ["Dựng Security Checklist: bảng đủ các từ khóa XSS, CSRF, SQL Injection, bcrypt, HTTPS, OWASP."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 56: Security Checklist</title>
</head>
<body>
    <h1>Security Checklist — chuẩn OWASP</h1>
    <!-- TODO 1: bảng 3 cột Lỗ hổng / Lá chắn / Bài đã học (>= 8 hàng) -->
    <!-- TODO 2: 5 quy tắc vàng tự đúc kết -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toUpperCase();
      return c.includes("XSS") && c.includes("CSRF") && c.includes("SQL INJECTION") && c.includes("BCRYPT") && c.includes("HTTPS") && c.includes("OWASP") && c.includes("<TABLE");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Nguyên tắc bảo mật số 1 phủ lên mọi lỗ hổng là gì?",
      snippet: "validate? escape? tham số hóa? — tất cả bắt nguồn từ...",
      options: [
        { text: "Mua chứng chỉ đắt tiền", correct: false },
        { text: "Never trust user input — không tin bất kỳ dữ liệu nào từ client", correct: true },
        { text: "Giấu source code", correct: false },
        { text: "Đổi port server", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "OWASP Top 10 là gì?", o: ["10 framework tốt nhất", "Danh sách 10 rủi ro bảo mật web phổ biến nhất", "10 ngôn ngữ lập trình", "Bộ luật quốc tế"], a: 1 },
      { q: "Lá chắn chuẩn cho SQL Injection?", o: ["Đổi tên bảng", "Prepared Statements (tham số hóa truy vấn)", "Mã hóa database", "Chặn IP"], a: 1 },
      { q: "Lỡ commit .env chứa secret lên GitHub, việc ĐẦU TIÊN là?", o: ["Xoá repo", "Thay (rotate) toàn bộ khóa bị lộ ngay lập tức", "Đổi tên file", "Không sao nếu repo private"], a: 1 },
      { q: "Thời điểm đúng để chạy security checklist?", o: ["Khi bị hack", "Trước mỗi lần release", "Mỗi năm một lần", "Chỉ lúc khởi tạo dự án"], a: 1 }
    ]
  },
  {
    id: "lesson57",
    title: "57. Bài Kiểm Tra Tổng Hợp Số 1 (Chặng 1-4)",
    lang: "html",
    file: "src/lesson57.html",
    duration: "35 phút",
    overview: {
      description: "Kỳ thi lớn thứ nhất: 25 câu rà soát toàn bộ kiến thức từ Chặng 1 đến giữa Chặng 4 — nền tảng, kiến trúc, giải thuật, mật mã và bảo mật.",
      outcomes: ["Đạt tối thiểu 60% (15/25 câu) để tiếp tục lộ trình"]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Đề thi **25 câu** chọn ngẫu nhiên, bao quát:
- HTML semantic, Box Model, BEM, đặt tên file, JS DOM (Chặng 1).
- Schema & JOIN, transaction, MVC, REST, JSON, UI/UX, toán ứng dụng, CORS/CSP, DRY, ES6+, SEO (Chặng 2).
- CTDL, giải thuật, Big O, AES/RSA, hash & salt, encoding, CIA, async, WebSockets, hiệu năng, PWA, unit test (Chặng 3).
- HTTPS, XSS, CSRF, JWT, OAuth2, OWASP (Chặng 4).

### CÁCH THI
Mỗi câu 4 lựa chọn, 1 đáp án đúng. Đạt **15/25 (60%)** để vượt qua. Có thể đổi đề thi lại.`,
    labSteps: [
      "Ôn 3 điểm yếu đã tự đánh dấu ở bài 56.",
      "Làm 25 câu — phân bổ ~1 phút/câu, câu khó đánh dấu quay lại sau.",
      "Sau khi có kết quả: liệt kê chủ đề của từng câu sai để ôn trước bài 58."
    ],
    commonMistakes: [
      { symptom: "Sa lầy 5 phút ở một câu khó rồi vội ở 10 câu cuối.", cause: "Không quản trị thời gian thi.", fix: "Câu nào quá 90 giây — chọn tạm phương án tốt nhất, đánh dấu, quay lại cuối giờ." }
    ],
    challenge: "Đạt tối thiểu 20/25 — trên mức yêu cầu một bậc.",
    checklist: ["Đã ôn 3 điểm yếu trước khi thi", "Đạt ≥ 60% và ghi lại chủ đề các câu sai"],
    tasks: ["Hoàn thành bài kiểm tra tổng hợp số 1 đạt tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 25,
    quizPool: [
      { q: "Tam giác bảo mật CIA gồm những trụ cột nào?", o: ["Cryptography, Integrity, Accessibility", "Confidentiality, Integrity, Availability", "Confidentiality, Internet, Authentication", "Control, Identity, Authorization"], a: 1 },
      { q: "HTTPS bảo mật dữ liệu nhờ giao thức nào?", o: ["FTP", "SMTP", "TLS/SSL", "UDP"], a: 2 },
      { q: "Tên file 'user-profile.jsx' theo kiểu đặt tên nào?", o: ["camelCase", "PascalCase", "kebab-case", "snake_case"], a: 2 },
      { q: "Mục đích chính của thẻ Semantic HTML?", o: ["Trang tải nhanh hơn", "SEO và khả năng tiếp cận (Accessibility)", "Trình duyệt không lỗi", "CSS ngắn hơn"], a: 1 },
      { q: "Thuộc tính CSS nào tạo bố cục lưới hai chiều?", o: ["display: flex", "display: grid", "display: block", "display: inline"], a: 1 },
      { q: "Trong Box Model, lớp nào giữa Content và Border?", o: ["margin", "padding", "outline", "spacing"], a: 1 },
      { q: "Từ khóa khai báo biến block-scoped cho phép gán lại?", o: ["var", "let", "const", "static"], a: 1 },
      { q: "Hàm nào chuyển chuỗi JSON thành object JS?", o: ["JSON.stringify()", "JSON.parse()", "JSON.decode()", "JSON.toObject()"], a: 1 },
      { q: "Lệnh SQL thêm bản ghi mới?", o: ["ADD RECORD", "INSERT INTO", "CREATE ROW", "UPDATE"], a: 1 },
      { q: "Cách kết nối MySQL an toàn, hướng đối tượng trong PHP?", o: ["mysql_connect", "PDO", "SQLite", "ODBC thô"], a: 1 },
      { q: "Ký hiệu nối chuỗi trong PHP?", o: ["Dấu cộng (+)", "Dấu chấm (.)", "Dấu và (&)", "Dấu phẩy (,)"], a: 1 },
      { q: "XSS xảy ra do nguyên nhân nào?", o: ["Server quá tải", "Kẻ tấn công chèn JavaScript độc chạy trên trình duyệt nạn nhân", "Mật khẩu yếu", "Sai cấu hình cổng"], a: 1 },
      { q: "Cách chống CSRF phổ biến nhất?", o: ["Mã hóa database", "CSRF Token ngẫu nhiên cho mỗi request ghi dữ liệu", "Tường lửa chặn IP", "Đổi tên miền"], a: 1 },
      { q: "Vì sao băm mật khẩu cần Salting?", o: ["Tăng tốc độ băm", "Chống tra bảng cầu vồng Rainbow Table", "Mật khẩu ngắn hơn", "Dễ lưu trữ"], a: 1 },
      { q: "Class 'button--primary' theo chuẩn nào?", o: ["BEM (Block-Element-Modifier)", "kebab-case thuần", "snake_case", "camelCase"], a: 0 },
      { q: "Thẻ HTML5 nào chứa điều hướng chính?", o: ["<main>", "<nav>", "<section>", "<aside>"], a: 1 },
      { q: "So sánh '===' khác '==' thế nào?", o: ["Không khác", "So cả giá trị và kiểu (Strict Equality)", "Chỉ so kiểu", "Chậm hơn"], a: 1 },
      { q: "Bắt lỗi trong khối async/await dùng gì?", o: ["catch-error", "try...catch", "then...finally", "onError"], a: 1 },
      { q: "Request GET truyền tham số qua đâu?", o: ["Request Body", "Header Cookie", "Query parameters trên URL", "File đính kèm"], a: 2 },
      { q: "Lệnh SQL cập nhật bản ghi có sẵn?", o: ["CHANGE", "MODIFY", "UPDATE", "INSERT"], a: 2 },
      { q: "Thư mục nào thường chứa ảnh, logo tĩnh?", o: ["/src/components", "/src/assets", "/src/pages", "/src/utils"], a: 1 },
      { q: "Khối JSDoc bắt đầu bằng?", o: ["//", "/*", "/**", "#"], a: 2 },
      { q: "Thẻ meta viewport có vai trò gì?", o: ["Tối ưu từ khoá SEO", "Hiển thị đúng tỷ lệ trên di động (Responsive)", "Tải ảnh nhanh", "Chống tấn công"], a: 1 },
      { q: "Thuộc tính nào tạo khoảng cách giữa các phần tử flex/grid?", o: ["margin-inner", "padding", "gap", "space"], a: 2 },
      { q: "Khối PHP bắt đầu bằng?", o: ["<?", "<?php", "<script php>", "<php>"], a: 1 }
    ]
  },
  {
    id: "lesson58",
    title: "58. Bài Kiểm Tra Tổng Hợp Số 2 (Chặng 1-4)",
    lang: "html",
    file: "src/lesson58.html",
    duration: "35 phút",
    overview: {
      description: "Kỳ thi lớn thứ hai: 25 câu thiên về tình huống và phản xạ xử lý — bảo mật, cấu trúc dự án và thiết kế logic ứng dụng thực tế.",
      outcomes: ["Đạt tối thiểu 60% (15/25 câu) để bước vào phần Tiền đề AI"]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Đề **25 câu** dạng tình huống: cho một triệu chứng/quyết định — chọn phản xạ đúng. Trọng tâm: bảo mật (cookie, phiên, băm mật khẩu), tổ chức dự án, SQL, JS và giao thức mạng.

### CÁCH THI
Đạt **15/25 (60%)** để hoàn thành cụm kiểm tra giữa chặng và mở phần AI (bài 59-70).`,
    labSteps: [
      "Ôn lại danh sách chủ đề sai của bài 57 TRƯỚC khi vào thi.",
      "Làm 25 câu, để ý các từ khoá tình huống: 'nên làm gì đầu tiên', 'an toàn nhất'.",
      "Sau thi: cập nhật Security Checklist (bài 56) nếu phát hiện lỗ hổng kiến thức mới."
    ],
    commonMistakes: [
      { symptom: "Chọn phương án 'đúng một phần' thay vì 'đúng nhất'.", cause: "Đề tình huống thường có 2 phương án hợp lý, 1 tối ưu.", fix: "So sánh cặp phương án cuối cùng theo tiêu chí an toàn + đơn giản trước khi chốt." }
    ],
    challenge: "Đạt 20/25 và giải thích được vì sao từng phương án sai... sai.",
    checklist: ["Đã ôn chủ đề sai của bài 57", "Đạt ≥ 60%"],
    tasks: ["Hoàn thành bài kiểm tra tổng hợp số 2 đạt tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 25,
    quizPool: [
      { q: "Muốn cookie chỉ truyền qua HTTPS, bật thuộc tính nào?", o: ["HttpOnly", "Secure", "SameSite", "Expires"], a: 1 },
      { q: "Trong BEM, 'card__title--active' thì '--active' là gì?", o: ["Block", "Element", "Modifier", "Helper"], a: 2 },
      { q: "Thẻ JSDoc nào mô tả giá trị trả về của hàm?", o: ["@param", "@return", "@type", "@output"], a: 1 },
      { q: "$_POST khác $_GET thế nào?", o: ["$_POST truyền qua URL", "$_POST truyền ẩn trong Request Body", "$_POST kém bảo mật hơn", "$_POST chỉ nhận file"], a: 1 },
      { q: "Hash bcrypt có thể dịch ngược về mật khẩu gốc không?", o: ["Có, bằng khóa bí mật", "Không — hàm băm một chiều", "Có, bằng Rainbow Table", "Có nếu biết salt"], a: 1 },
      { q: "Xoá nhanh toàn bộ dữ liệu bảng nhưng giữ cấu trúc?", o: ["DELETE FROM t", "DROP TABLE t", "TRUNCATE TABLE t", "REMOVE t"], a: 2 },
      { q: "Từ khóa 'const' trong JS dùng để?", o: ["Biến thay đổi thoải mái", "Hằng số không gán lại được", "Biến toàn cục", "Khai báo class"], a: 1 },
      { q: "Chuyển chuỗi JSON về object JS dùng?", o: ["JSON.stringify()", "JSON.parse()", "JSON.objectify()", "eval()"], a: 1 },
      { q: "Khai báo nào giúp trang chạy chế độ chuẩn (standards mode)?", o: ["<html>", "<!DOCTYPE html>", "<meta charset>", "<head>"], a: 1 },
      { q: "Căn giữa phần tử con theo CẢ 2 trục trong Flexbox?", o: ["justify-content: center + align-items: center", "text-align + vertical-align", "margin: auto 0", "display: center"], a: 0 },
      { q: "Mô hình địa chỉ IP phổ biến hiện nay?", o: ["IPv4 và IPv6", "MAC address", "Subnet", "DNS"], a: 0 },
      { q: "Vì sao tránh tên file tiếng Việt có dấu?", o: ["Chạy chậm", "Lỗi đường dẫn khi deploy lên Linux/Unix", "Trình duyệt cấm", "File nặng hơn"], a: 1 },
      { q: "Chống trộm cookie phiên qua JavaScript bằng flag nào?", o: ["HttpOnly", "Secure", "Domain", "Path"], a: 0 },
      { q: "Ưu điểm chính của PDO so với mysql_* cũ?", o: ["Nhanh gấp 10", "Prepared Statements chống SQL Injection", "Không cần mật khẩu", "Tự tạo bảng"], a: 1 },
      { q: "Lấy độ dài mảng trong JS?", o: ["arr.size", "arr.count", "arr.length", "arr.total"], a: 2 },
      { q: "'SELECT * FROM users WHERE age > 18' làm gì?", o: ["Lấy mọi cột của người dùng trên 18 tuổi", "Xoá người dưới 18", "Cập nhật tuổi", "Đếm người trên 18"], a: 0 },
      { q: "Giao thức kết nối dòng lệnh an toàn tới VPS?", o: ["FTP", "SSH", "HTTP", "Telnet"], a: 1 },
      { q: "'await' chỉ dùng được ở đâu?", o: ["Mọi hàm", "Trong hàm async", "Ngoài cùng file HTML", "Trong CSS"], a: 1 },
      { q: "Thư mục /src/pages trong dự án React chứa gì?", o: ["Ảnh tĩnh", "Component trang chính theo định tuyến URL", "Cấu hình database", "Unit test"], a: 1 },
      { q: "CSRF xảy ra khi nào?", o: ["Server bị DDoS", "Nạn nhân bị dụ kích hoạt request trái phép tại trang đã đăng nhập", "Database bị xoá", "Mật khẩu bị lộ"], a: 1 },
      { q: "Thẻ HTML5 cho thanh bên/nội dung phụ?", o: ["<main>", "<section>", "<aside>", "<article>"], a: 2 },
      { q: "Thuộc tính CSS chỉnh độ dày viền?", o: ["border-style", "border-width", "border-color", "outline-offset"], a: 1 },
      { q: "Comment TODO dùng để làm gì?", o: ["Báo lỗi nghiêm trọng", "Đánh dấu việc cần làm/nâng cấp sau", "Giải thích hàm băm", "Khai báo tác giả"], a: 1 },
      { q: "Dữ liệu gửi qua POST có hiện trên thanh địa chỉ không?", o: ["Có", "Không", "Một nửa", "Tuỳ trình duyệt"], a: 1 },
      { q: "Kịch bản đúng khi lỡ lộ khóa bí mật lên GitHub?", o: ["Xoá commit là xong", "Thay (rotate) khóa ngay lập tức rồi mới dọn lịch sử", "Đổi tên repo", "Không sao nếu ít sao"], a: 1 }
    ]
  },
  {
    id: "lesson59",
    title: "59. Đo lường hiệu năng tổng thể & Web Vitals thực tế",
    lang: "javascript",
    file: "src/lesson59.js",
    duration: "50 phút",
    overview: {
      description: "Từ 'cảm giác nhanh' sang số liệu thật: đo hiệu năng bằng Performance API, tự dựng bộ đếm thời gian và đọc report Lighthouse như kỹ sư hiệu năng.",
      outcomes: [
        "Đo thời gian đoạn code bằng performance.now() và performance.mark/measure",
        "Quan sát chỉ số thật của trang bằng PerformanceObserver",
        "Lập quy trình đo — sửa — đo lại thay vì tối ưu mù"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Quy tắc vàng của tối ưu: **không đo thì đừng sửa**. Trình duyệt cung cấp bộ đo chuẩn W3C — **Performance API**:

\`\`\`javascript
const t0 = performance.now();
heavyTask();
console.log("Mất", (performance.now() - t0).toFixed(1), "ms");

performance.mark("start-render");
renderList();
performance.mark("end-render");
performance.measure("render", "start-render", "end-render");

new PerformanceObserver((list) => {
  list.getEntries().forEach((e) => console.log(e.name, e.startTime));
}).observe({ type: "largest-contentful-paint", buffered: true });
\`\`\`

> performance.now() chính xác đến phần nghìn ms (Date.now chỉ đến ms và bị chỉnh giờ hệ thống ảnh hưởng). Quy trình chuẩn: **đo baseline → sửa MỘT thứ → đo lại → so sánh** — sửa nhiều thứ cùng lúc là không biết công của ai.`,
    labSteps: [
      "Mở src/lesson59.js — dựng phòng đo hiệu năng mini.",
      "Viết heavyTask() giả lập việc nặng (vòng lặp 10 triệu phép cộng).",
      "Đo bằng cặp performance.now() trước/sau — in kết quả ms.",
      "Đo bằng mark/measure với 2 mốc tên rõ ràng — lấy kết quả từ performance.getEntriesByType('measure').",
      "Viết PerformanceObserver lắng nghe largest-contentful-paint (buffered: true).",
      "Chú thích quy trình 4 bước: baseline → sửa một thứ → đo lại → kết luận."
    ],
    commonMistakes: [
      { symptom: "Kết quả đo mỗi lần mỗi khác, kết luận loạn.", cause: "Đo 1 lần duy nhất — nhiễu do GC, tab khác, JIT.", fix: "Đo tối thiểu 5 lần lấy trung vị; đóng tab thừa khi đo." },
      { symptom: "Tối ưu xong khoe nhanh hơn nhưng không có số trước đó.", cause: "Không đo baseline.", fix: "LUÔN ghi số trước khi sửa — không có baseline là không có bằng chứng." },
      { symptom: "Đo bằng Date.now() thấy 0ms cho việc nhỏ.", cause: "Date.now độ phân giải thô (1ms).", fix: "Dùng performance.now() cho đo lường code." }
    ],
    challenge: "Đo và so sánh chính bài 38 của bạn: appendChild từng cái vs DocumentFragment — xuất bảng kết quả 5 lần đo mỗi phương án kèm trung vị.",
    checklist: [
      "Thuộc cặp mark/measure và getEntriesByType",
      "Đã đo một tác vụ tối thiểu 5 lần và lấy trung vị",
      "Thuộc quy trình 4 bước đo–sửa–đo lại"
    ],
    tasks: ["Đo heavyTask bằng performance.now, mark/measure và lắng nghe LCP bằng PerformanceObserver."],
    starterCode: `// BÀI 59: Phòng đo hiệu năng
// TODO 1: heavyTask() — vòng lặp lớn giả lập việc nặng
// TODO 2: đo bằng performance.now() trước/sau
// TODO 3: performance.mark/measure + getEntriesByType("measure")
// TODO 4: PerformanceObserver observe largest-contentful-paint
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("performance.now()") && c.includes("performance.mark(") && c.includes("performance.measure(") && c.includes("performanceobserver");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Quy tắc vàng trước khi tối ưu hiệu năng là gì?",
      snippet: "baseline → sửa → đo lại → so sánh",
      options: [
        { text: "Sửa càng nhiều càng tốt", correct: false },
        { text: "Đo baseline trước — không đo thì đừng sửa", correct: true },
        { text: "Mua server mạnh hơn", correct: false },
        { text: "Xoá bớt tính năng", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "performance.now() hơn Date.now() ở điểm nào?", o: ["Chạy nhanh hơn", "Độ phân giải cao (micro giây) và không bị chỉnh giờ hệ thống", "Trả về ngày tháng", "Không khác"], a: 1 },
      { q: "Vì sao đo nhiều lần lấy trung vị?", o: ["Cho vui", "Một lần đo nhiễu bởi GC/tab khác — trung vị ổn định hơn", "Máy yếu", "Chuẩn W3C bắt buộc"], a: 1 },
      { q: "Vì sao chỉ sửa MỘT thứ giữa hai lần đo?", o: ["Tiết kiệm thời gian", "Sửa nhiều thứ thì không biết cải thiện do đâu", "Git bắt buộc", "Tránh conflict"], a: 1 },
      { q: "PerformanceObserver dùng để làm gì?", o: ["Theo dõi người dùng", "Lắng nghe các chỉ số hiệu năng trình duyệt phát ra (LCP...)", "Chặn script chậm", "Đo RAM server"], a: 1 }
    ]
  },
  {
    id: "lesson60",
    title: "60. Tạo bộ dữ liệu kiểm thử quy mô lớn (Mock & Fake Data)",
    lang: "javascript",
    file: "src/lesson60.js",
    duration: "50 phút",
    overview: {
      description: "App đẹp với 3 bản ghi nhưng vỡ trận với 3000: tự viết generator sinh dữ liệu giả có quy luật để kiểm thử hiệu năng, phân trang và ca biên ngay từ khi chưa có người dùng thật.",
      outcomes: [
        "Viết hàm sinh n người dùng giả ngẫu nhiên có kiểm soát (seed họ tên, email hợp lệ)",
        "Sinh dữ liệu có phân phối thật: ngày tháng rải đều, trạng thái theo tỷ lệ",
        "Trộn ca biên vào dữ liệu giả: tên siêu dài, ký tự đặc biệt, giá trị 0"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Mock data** tốt phải GIỐNG THẬT về hình dạng và phân phối — không phải 1000 dòng "user1, user2":

\`\`\`javascript
const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"];
const TEN = ["An", "Bình", "Chi", "Dũng", "Hà", "Khang"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeUser(i) {
  const name = pick(HO) + " " + pick(TEN);
  return {
    id: i,
    name,
    email: "user" + i + "@test.hugo.vn",
    balance: Math.floor(Math.random() * 5000),
    status: Math.random() < 0.8 ? "active" : "banned",   // 80/20 như đời thật
    createdAt: Date.now() - Math.floor(Math.random() * 365) * 86400000
  };
}
const users = Array.from({ length: 1000 }, (_, i) => makeUser(i + 1));
\`\`\`

> Trộn **ca biên chủ đích** vào 1-2% dữ liệu: tên 100 ký tự, email có dấu +, balance 0 — những dòng này mới là thứ tìm ra bug. Dữ liệu giả cho vào DB gọi là **seeding** (Chặng 5 sẽ dùng script hóa việc này cho đồ án).`,
    labSteps: [
      "Mở src/lesson60.js — xây generator theo khuôn.",
      "Viết helper pick(arr) và mảng HO/TEN tiếng Việt.",
      "Viết makeUser(i) đủ 6 trường: id, name, email, balance, status (tỷ lệ 80/20), createdAt rải 1 năm.",
      "Sinh 1000 user bằng Array.from — console.log 3 dòng đầu kiểm tra hình dạng.",
      "Viết injectEdgeCases(users): ghi đè ~10 dòng bằng ca biên (tên dài 100 ký tự, balance 0, email 'a+b@test.vn').",
      "Thống kê nhanh: đếm active/banned xác nhận tỷ lệ ~80/20."
    ],
    commonMistakes: [
      { symptom: "Test phân trang với đúng 10 bản ghi — production 10.000 dòng sập.", cause: "Dữ liệu giả quá ít, không lộ vấn đề hiệu năng.", fix: "Luôn test với số lượng lớn hơn kỳ vọng thật 10 lần." },
      { symptom: "Mock toàn dữ liệu 'đẹp', bug tràn giao diện chỉ lộ khi có tên dài thật.", cause: "Thiếu ca biên trong dữ liệu giả.", fix: "Chủ đích trộn 1-2% ca biên: chuỗi dài, ký tự lạ, giá trị 0/null." },
      { symptom: "Dùng dữ liệu THẬT của người dùng để test.", cause: "Tiện tay copy từ production.", fix: "Cấm — vi phạm quyền riêng tư; dữ liệu test phải là dữ liệu giả." }
    ],
    challenge: "Viết makeOrder(users) sinh 5000 đơn hàng tham chiếu user_id có thật từ mảng users — dữ liệu quan hệ 2 bảng đúng chuẩn cho bài test JOIN.",
    checklist: [
      "Generator sinh 1000 dòng hình dạng giống thật",
      "Có ca biên chủ đích trong dữ liệu",
      "Thuộc nguyên tắc: không test bằng dữ liệu thật của người dùng"
    ],
    tasks: ["Viết pick + makeUser (đủ 6 trường, tỷ lệ 80/20) sinh 1000 user và injectEdgeCases."],
    starterCode: `// BÀI 60: Generator dữ liệu giả quy mô lớn
// TODO 1: pick(arr) + mảng HO, TEN
// TODO 2: makeUser(i) — id, name, email, balance, status 80/20, createdAt rải 1 năm
// TODO 3: Array.from({length: 1000}, ...) + injectEdgeCases (tên dài, balance 0)
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("math.random()") && c.includes("makeuser") && c.includes("array.from({length:1000}") && c.includes("injectedgecases");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao phải trộn CA BIÊN (tên siêu dài, giá trị 0) vào dữ liệu giả?",
      snippet: "users[3].name = 'Nguyễn'.repeat(20); users[7].balance = 0;",
      options: [
        { text: "Cho dữ liệu vui hơn", correct: false },
        { text: "Ca biên mới là thứ làm lộ bug tràn giao diện/chia cho 0", correct: true },
        { text: "Giảm dung lượng", correct: false },
        { text: "Tăng tốc test", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Seeding là gì?", o: ["Xoá database", "Nạp dữ liệu mẫu ban đầu vào database", "Nén dữ liệu", "Sao lưu"], a: 1 },
      { q: "Mock data tốt phải thế nào?", o: ["Càng đẹp càng tốt", "Giống thật về hình dạng, phân phối và có ca biên", "Toàn chữ a", "Ít nhất có thể"], a: 1 },
      { q: "Nên test hiệu năng với lượng dữ liệu bao nhiêu?", o: ["Đúng bằng hiện tại", "Gấp ~10 lần kỳ vọng production", "10 dòng đủ", "1 dòng"], a: 1 },
      { q: "Có được dùng dữ liệu thật của người dùng để test không?", o: ["Được nếu tiện", "Không — vi phạm quyền riêng tư, phải dùng dữ liệu giả", "Được nếu ẩn tên", "Tuỳ dự án"], a: 1 }
    ]
  },
  {
    id: "lesson61",
    title: "61. Tổng quan Mô hình ngôn ngữ lớn (LLM) & Trí tuệ nhân tạo",
    lang: "html",
    file: "src/lesson61.html",
    duration: "45 phút",
    overview: {
      description: "Nền tảng để tích hợp AI vào sản phẩm: LLM là gì, token và context window vận hành ra sao, và kỹ thuật viết prompt có cấu trúc.",
      outcomes: [
        "Giải thích LLM, token, context window bằng ngôn ngữ của mình",
        "Viết prompt 4 thành phần: vai trò — nhiệm vụ — ngữ cảnh — định dạng đầu ra",
        "Nhận diện hallucination và các giới hạn của LLM"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**LLM (Large Language Model)** — như GPT, Gemini, Claude — là mô hình được huấn luyện trên lượng văn bản khổng lồ, dự đoán token tiếp theo để sinh ngôn ngữ tự nhiên và mã nguồn.

> **Token** — đơn vị xử lý (mảnh từ, ~3/4 từ tiếng Anh); chi phí API tính theo token.
> **Context window** — lượng token tối đa mô hình 'nhớ' trong một phiên; tràn cửa sổ là quên đầu câu chuyện.
> **Hallucination** — mô hình bịa thông tin nghe rất thuyết phục: mọi dữ kiện quan trọng phải kiểm chứng.

**Prompt Engineering** — khuôn 4 phần cho kết quả ổn định:
1. **Vai trò**: "Bạn là trợ giảng lập trình web..."
2. **Nhiệm vụ**: "Giải thích Box Model cho học viên mới."
3. **Ngữ cảnh**: "Học viên đã biết HTML, chưa học CSS."
4. **Định dạng đầu ra**: "Trả lời 5 gạch đầu dòng tiếng Việt, kèm 1 ví dụ code."`,
    labSteps: [
      "Mở src/lesson61.html — dựng 'sổ tay AI' của lập trình viên.",
      "Mục 1: định nghĩa LLM, token, context window — mỗi khái niệm 2 câu của chính bạn.",
      "Mục 2: viết 2 prompt hoàn chỉnh theo khuôn 4 phần (một cho chatbot hỗ trợ, một cho phân loại nội dung).",
      "Mục 3: bảng 'giới hạn & đối sách': hallucination → kiểm chứng; dữ liệu cũ → cung cấp ngữ cảnh; token đắt → prompt gọn.",
      "Đọc lại 2 prompt: đủ 4 phần chưa, có mơ hồ chỗ nào máy hiểu sai được không?"
    ],
    commonMistakes: [
      { symptom: "Prompt 'viết cho tôi cái web' — kết quả lung tung.", cause: "Thiếu vai trò, ngữ cảnh, định dạng.", fix: "Áp khuôn 4 phần — càng cụ thể đầu ra càng ổn định." },
      { symptom: "Tin lời AI trích dẫn 'điều luật số 123/XYZ'.", cause: "Không đề phòng hallucination.", fix: "Mọi dữ kiện pháp lý/số liệu phải kiểm chứng nguồn độc lập." },
      { symptom: "Hội thoại dài, AI 'quên' yêu cầu ban đầu.", cause: "Tràn context window.", fix: "Tóm tắt lại yêu cầu cốt lõi định kỳ hoặc mở phiên mới kèm tóm tắt." }
    ],
    challenge: "Viết 1 prompt 4 phần cho tính năng thật của đồ án Chặng 5 (vd: AI kiểm duyệt bình luận) — chạy thử trên một chatbot bất kỳ và chấm điểm đầu ra theo định dạng bạn yêu cầu.",
    checklist: [
      "Giải thích được LLM/token/context window không nhìn tài liệu",
      "2 prompt viết đủ khuôn 4 phần",
      "Kể được 3 giới hạn của LLM và đối sách"
    ],
    tasks: ["Dựng trang đủ từ khóa LLM, token, context window, prompt, hallucination kèm 2 prompt mẫu 4 phần."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 61: Sổ tay LLM</title>
</head>
<body>
    <h1>Sổ tay AI của lập trình viên</h1>
    <!-- TODO 1: định nghĩa LLM / token / context window -->
    <!-- TODO 2: 2 prompt theo khuôn: vai trò - nhiệm vụ - ngữ cảnh - định dạng -->
    <!-- TODO 3: bảng giới hạn & đối sách (hallucination...) -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("llm") && c.includes("token") && c.includes("context window") && c.includes("prompt") && c.includes("hallucination");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "'Context window' của một LLM là gì?",
      snippet: "gemini-flash: 1M tokens context window",
      options: [
        { text: "Tốc độ trả lời", correct: false },
        { text: "Lượng token tối đa mô hình xử lý/ghi nhớ trong một phiên", correct: true },
        { text: "Giao diện chat", correct: false },
        { text: "Giá tiền API", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Token trong LLM là gì?", o: ["Mật khẩu API", "Đơn vị văn bản mô hình xử lý — chi phí tính theo nó", "Tên mô hình", "Chứng chỉ SSL"], a: 1 },
      { q: "Hallucination nghĩa là gì?", o: ["Mô hình chạy chậm", "Mô hình bịa thông tin nghe rất thuyết phục", "Lỗi mạng", "Trả lời trống"], a: 1 },
      { q: "Prompt tốt gồm 4 phần nào?", o: ["Chào - hỏi - cảm ơn - chốt", "Vai trò - nhiệm vụ - ngữ cảnh - định dạng đầu ra", "Tên - tuổi - nghề - nơi ở", "Mở - thân - kết - tái bút"], a: 1 },
      { q: "Cách xử lý khi hội thoại dài làm AI 'quên' yêu cầu đầu?", o: ["Quát to hơn", "Tóm tắt lại yêu cầu cốt lõi / mở phiên mới kèm tóm tắt", "Gửi lại 100 lần", "Không có cách"], a: 1 }
    ]
  },
  {
    id: "lesson62",
    title: "62. Kết nối API Trí tuệ nhân tạo: Làm chủ Gemini API",
    lang: "javascript",
    file: "src/lesson62.js",
    duration: "55 phút",
    overview: {
      description: "Gọi mô hình AI từ code của bạn: cấu trúc request Gemini API, bóc tách response — và kiến trúc bắt buộc: API key chỉ sống ở backend.",
      outcomes: [
        "Viết fetch POST đến endpoint Gemini với body contents/parts chuẩn",
        "Bóc text từ response: candidates[0].content.parts[0].text",
        "Thiết kế luồng an toàn: frontend → backend proxy → Gemini (key trong .env)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Gọi **Gemini API** bản chất là một REST call (kiến thức bài 14):

\`\`\`javascript
const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Giải thích Box Model trong 3 câu" }] }]
    })
  }
);
const data = await res.json();
const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
\`\`\`

> **Luật sắt**: API key đặt trong \`.env\` phía **backend**; frontend gọi endpoint proxy của chính bạn (/api/ai/ask), backend mới gọi Gemini. Key lộ ở frontend = ai inspect cũng lấy được và đốt tiền của bạn.
> Xử lý đủ 3 nhánh: thành công • lỗi HTTP (429 hết quota, 400 prompt sai) • lỗi mạng (try/catch).`,
    labSteps: [
      "Mở src/lesson62.js — viết hàm askGemini(question) mô phỏng đủ luồng.",
      "Dựng body chuẩn: { contents: [{ parts: [{ text: question }] }] }.",
      "fetch POST kèm header x-goog-api-key đọc từ process.env.GEMINI_KEY (chú thích: đây là code BACKEND).",
      "Bóc đáp án bằng optional chaining + ?? theo khuôn (nối kiến thức bài 23).",
      "try/catch + kiểm tra res.ok: 429 → thông báo hết quota, khác → lỗi chung.",
      "Viết khối chú thích vẽ luồng: Browser → POST /api/ai/ask (server mình) → Gemini → trả về."
    ],
    commonMistakes: [
      { symptom: "Key AIza... nằm ngay trong file JS của trang.", cause: "Gọi Gemini thẳng từ frontend.", fix: "Chỉ backend giữ key (.env); frontend gọi proxy /api/ai của chính mình." },
      { symptom: "Đọc data.text bị undefined.", cause: "Response Gemini lồng sâu: candidates → content → parts.", fix: "Bóc đúng đường dẫn với ?. và ?? giá trị mặc định." },
      { symptom: "App sập khi Gemini trả 429.", cause: "Không xử lý nhánh lỗi quota.", fix: "Kiểm tra res.ok, hiển thị thông báo thân thiện + retry có backoff." }
    ],
    challenge: "Viết askGeminiWithHistory(messages) gửi kèm lịch sử hội thoại (mảng contents nhiều lượt role user/model) — nền của chatbot có trí nhớ.",
    checklist: [
      "Thuộc cấu trúc body contents/parts và đường bóc response",
      "Thuộc luật sắt: key ở backend, frontend gọi proxy",
      "Xử lý đủ 3 nhánh: ok / lỗi HTTP / lỗi mạng"
    ],
    tasks: ["Viết askGemini: fetch POST body contents/parts, header x-goog-api-key từ env, bóc candidates[0]... bằng ?. và try/catch."],
    starterCode: `// BÀI 62: Gọi Gemini API (code phía BACKEND)
// TODO 1: askGemini(question) — body { contents: [{ parts: [{ text }] }] }
// TODO 2: header "x-goog-api-key": process.env.GEMINI_KEY
// TODO 3: bóc data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
// TODO 4: try/catch + if (!res.ok) — nhánh 429 hết quota
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("contents:") && c.includes("parts:") && c.includes("process.env") && c.includes("candidates?.[0]") && c.toLowerCase().includes("try{");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Vì sao TUYỆT ĐỐI không đặt API key của Gemini trong code frontend?",
      snippet: "const KEY = \"AIzaSyD...\"; // trong app.js của trang web",
      options: [
        { text: "Làm chậm trang", correct: false },
        { text: "Ai inspect cũng lấy được key và đốt tiền quota của bạn", correct: true },
        { text: "AI chạy sai", correct: false },
        { text: "Lỗi cú pháp", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "API key nên được lưu ở đâu?", o: ["Trong HTML", "File .env phía backend", "LocalStorage", "Trong URL"], a: 1 },
      { q: "Frontend muốn dùng AI thì gọi gì?", o: ["Gọi thẳng Gemini", "Gọi endpoint proxy của backend mình, backend mới gọi Gemini", "Gọi qua CDN", "Không thể dùng"], a: 1 },
      { q: "Mã 429 từ API AI nghĩa là gì?", o: ["Sai key", "Vượt hạn mức quota — cần chờ/giảm tần suất", "Prompt quá hay", "Server sập"], a: 1 },
      { q: "Đáp án văn bản nằm ở đâu trong response Gemini?", o: ["data.text", "data.candidates[0].content.parts[0].text", "data.answer", "data.result.message"], a: 1 }
    ]
  },
  {
    id: "lesson63",
    title: "63. Lập trình AI đa phương thức (Multimodal)",
    lang: "javascript",
    file: "src/lesson63.js",
    duration: "50 phút",
    overview: {
      description: "AI không chỉ đọc chữ: gửi kèm hình ảnh (inline Base64) cho Gemini để nhận diện, mô tả, trích xuất thông tin — nối thẳng kiến thức encoding bài 34.",
      outcomes: [
        "Dựng request multimodal: parts gồm text + inline_data (mime_type, data Base64)",
        "Chuyển file ảnh người dùng chọn thành Base64 bằng FileReader",
        "Nêu 3 ứng dụng multimodal thực tế cho sản phẩm web"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Multimodal** — mô hình nhận nhiều loại đầu vào: văn bản, hình ảnh, âm thanh, PDF. Với Gemini, ảnh đi kèm trong \`parts\` dạng Base64 (đúng kỹ thuật bài 34):

\`\`\`javascript
body: JSON.stringify({
  contents: [{
    parts: [
      { text: "Ảnh này chụp món ăn gì? Ước lượng calo." },
      { inline_data: { mime_type: "image/jpeg", data: base64String } }
    ]
  }]
})
\`\`\`

Chuyển file ảnh từ \`<input type="file">\` thành Base64:
\`\`\`javascript
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // bỏ tiền tố data:...
    reader.readAsDataURL(file);
  });
}
\`\`\`
Ứng dụng web thật: kiểm duyệt ảnh đại diện, đọc hóa đơn thành dữ liệu, mô tả ảnh cho người khiếm thị (alt tự động).`,
    labSteps: [
      "Mở src/lesson63.js — xây luồng 'hỏi AI về một bức ảnh'.",
      "Viết fileToBase64(file) bằng FileReader + Promise theo khuôn (để ý split bỏ tiền tố data URI).",
      "Viết askAboutImage(file, question): ghép parts [text, inline_data] đúng cấu trúc.",
      "Khai mime_type lấy từ file.type thay vì viết cứng.",
      "Nối vào input: document.getElementById('photo').addEventListener('change', ...) gọi luồng trên.",
      "Chú thích 3 ứng dụng multimodal bạn sẽ cân nhắc cho đồ án."
    ],
    commonMistakes: [
      { symptom: "Gemini báo lỗi Invalid base64 data.", cause: "Gửi nguyên chuỗi data:image/jpeg;base64,... còn tiền tố.", fix: "split(',')[1] chỉ lấy phần Base64 thuần sau dấu phẩy." },
      { symptom: "Khai image/jpeg nhưng người dùng chọn file PNG.", cause: "mime_type viết cứng.", fix: "Dùng file.type động và kiểm tra danh sách cho phép." },
      { symptom: "Gửi ảnh 15MB làm request chậm/lỗi.", cause: "Không giới hạn/nén trước khi gửi.", fix: "Kiểm tra file.size, resize bằng canvas trước khi encode." }
    ],
    challenge: "Làm 'máy đọc hóa đơn': gửi ảnh hóa đơn + prompt yêu cầu liệt kê món và tổng tiền — chuẩn bị cho Structured Outputs bài 64.",
    checklist: [
      "Thuộc cấu trúc parts hai phần tử text + inline_data",
      "Viết được fileToBase64 không nhìn mẫu",
      "Kể 3 ứng dụng multimodal cho web"
    ],
    tasks: ["Viết fileToBase64 (FileReader) và askAboutImage với parts chứa inline_data {mime_type, data}."],
    starterCode: `// BÀI 63: Multimodal — hỏi AI về ảnh
// TODO 1: fileToBase64(file) — FileReader + Promise, split(',')[1]
// TODO 2: askAboutImage(file, question) — parts: [{text}, {inline_data: {mime_type: file.type, data}}]
// TODO 3: gắn vào input type=file qua sự kiện change
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      const hasSplit = c.includes("split(',')[1]") || c.includes('split(",")[1]');
      return c.includes("FileReader") && c.includes("readAsDataURL") && c.includes("inline_data") && c.includes("mime_type") && hasSplit;
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Ảnh gửi kèm cho Gemini trong parts phải ở định dạng nào?",
      snippet: "{ inline_data: { mime_type: \"image/jpeg\", data: [ ... ] } }",
      options: [
        { text: "URL ảnh bất kỳ", correct: false },
        { text: "Chuỗi Base64 (bỏ tiền tố data:...)", correct: true },
        { text: "File nhị phân thô", correct: false },
        { text: "Đường dẫn ổ cứng", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Multimodal nghĩa là gì?", o: ["Nhiều mô hình cùng chạy", "Mô hình nhận nhiều loại đầu vào: chữ, ảnh, âm thanh...", "Chạy đa luồng", "Nhiều ngôn ngữ"], a: 1 },
      { q: "API nào của trình duyệt đọc file thành Data URL?", o: ["fetch", "FileReader", "FileSystem", "Blob.parse"], a: 1 },
      { q: "Vì sao phải split(',')[1] trước khi gửi?", o: ["Cho ngắn", "Bỏ tiền tố data:image/...;base64, — API chỉ nhận Base64 thuần", "Tách tên file", "Nén ảnh"], a: 1 },
      { q: "Ứng dụng multimodal nào tăng khả năng tiếp cận (a11y)?", o: ["Nén ảnh", "Sinh mô tả alt tự động cho ảnh giúp người khiếm thị", "Đổi màu ảnh", "Chống XSS"], a: 1 }
    ]
  },
  {
    id: "lesson64",
    title: "64. AI Structured Outputs: Ép dữ liệu đầu ra chuẩn JSON",
    lang: "javascript",
    file: "src/lesson64.js",
    duration: "50 phút",
    overview: {
      description: "Biến AI từ 'người kể chuyện' thành 'API đáng tin': ép mô hình trả về đúng JSON Schema đã khai — hệ thống parse thẳng, lưu DB, không cần đoán.",
      outcomes: [
        "Cấu hình responseMimeType application/json + responseSchema",
        "Viết JSON Schema với type, properties, enum, required",
        "Vẫn bọc JSON.parse trong try/catch — hàng rào cuối cùng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Văn bản tự do của AI rất khó cho máy xử lý ("Chắc là tích cực nhé!" — parse kiểu gì?). **Structured Outputs** ép đầu ra theo **JSON Schema**:

\`\`\`javascript
body: JSON.stringify({
  contents: [{ parts: [{ text: "Phân tích cảm xúc: 'Khóa học tuyệt vời!'" }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
        score: { type: "number" },
        keywords: { type: "array", items: { type: "string" } }
      },
      required: ["sentiment", "score"]
    }
  }
})
\`\`\`

> **enum** khóa cứng tập giá trị — hết cảnh AI trả "tích cực nha bạn". **required** buộc đủ trường. Kết quả \`JSON.parse\` xong dùng ngay như response của một REST API — nhưng vẫn bọc try/catch: AI là hệ thống xác suất, hàng rào cuối không bao giờ thừa.`,
    labSteps: [
      "Mở src/lesson64.js — xây bộ phân tích cảm xúc bình luận học viên.",
      "Viết SENTIMENT_SCHEMA: object có sentiment (enum 3 giá trị), score (number 0-1), keywords (array string), required đủ.",
      "Viết analyzeSentiment(comment): body có generationConfig với responseMimeType + responseSchema.",
      "Parse kết quả trong try/catch — lỗi parse trả về { sentiment: 'neutral', score: 0, keywords: [] } mặc định an toàn.",
      "Viết 3 test đầu vào: khen, chê, trung tính — chú thích kết quả kỳ vọng.",
      "Chú thích: 2 tính năng đồ án sẽ dùng khuôn này (gắn tag bài viết, kiểm duyệt nội dung)."
    ],
    commonMistakes: [
      { symptom: "AI trả JSON bọc trong ```json ... ``` làm parse lỗi.", cause: "Chỉ 'xin' JSON trong prompt mà không dùng responseMimeType.", fix: "Ép bằng generationConfig.responseMimeType — không dựa vào lời hứa trong prompt." },
      { symptom: "Trường sentiment lúc là 'tích cực' lúc 'positive'.", cause: "Không khóa enum.", fix: "enum liệt kê chính xác tập giá trị cho phép." },
      { symptom: "App sập vì JSON.parse thất bại 1/1000 lần.", cause: "Tin tưởng tuyệt đối đầu ra AI.", fix: "try/catch + giá trị mặc định — AI là xác suất, không phải hằng số." }
    ],
    challenge: "Viết schema cho 'máy đọc hóa đơn' bài 63: { items: [{name, price, quantity}], total } — ghép multimodal + structured output thành một luồng hoàn chỉnh.",
    checklist: [
      "Viết được schema có enum + required",
      "Thuộc vị trí generationConfig trong body",
      "JSON.parse luôn nằm trong try/catch kèm mặc định"
    ],
    tasks: ["Viết analyzeSentiment với responseMimeType application/json, responseSchema (enum, required) và try/catch khi parse."],
    starterCode: `// BÀI 64: Structured Outputs — phân tích cảm xúc
// TODO 1: SENTIMENT_SCHEMA — sentiment enum [positive|neutral|negative], score number, keywords array, required
// TODO 2: analyzeSentiment(comment) — generationConfig { responseMimeType, responseSchema }
// TODO 3: JSON.parse trong try/catch + giá trị mặc định an toàn
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("responseMimeType") && c.includes("responseSchema") && c.includes("enum") && c.includes("required") && c.includes("JSON.parse(") && c.toLowerCase().includes("try{");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Muốn AI CHỈ trả về một trong 3 giá trị cố định, dùng từ khóa schema nào?",
      snippet: "sentiment: { type: \"string\", [ ... ]: [\"positive\", \"neutral\", \"negative\"] }",
      options: [
        { text: "options", correct: false },
        { text: "enum", correct: true },
        { text: "values", correct: false },
        { text: "oneOf-any", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Structured Outputs giải quyết vấn đề gì?", o: ["AI trả lời nhanh hơn", "Ép AI trả đúng định dạng JSON theo schema — máy parse được ngay", "AI thông minh hơn", "Giảm giá API"], a: 1 },
      { q: "required trong schema có tác dụng gì?", o: ["Tăng độ ưu tiên", "Buộc đầu ra phải có đủ các trường liệt kê", "Mã hóa trường", "Sắp xếp trường"], a: 1 },
      { q: "Vì sao vẫn cần try/catch quanh JSON.parse?", o: ["Thói quen cũ", "AI là hệ thống xác suất — hàng rào cuối chống ca hỏng hiếm gặp", "JSON.parse luôn lỗi", "Không cần"], a: 1 },
      { q: "Khai schema ở đâu trong request Gemini?", o: ["Trong URL", "generationConfig.responseSchema", "Trong header", "Trong cookie"], a: 1 }
    ]
  },
  {
    id: "lesson65",
    title: "65. Lập kế hoạch dự án & Phân tích yêu cầu phần mềm (SRS)",
    lang: "html",
    file: "src/lesson65.html",
    duration: "55 phút",
    overview: {
      description: "Trước khi code đồ án lớn: viết bản SRS thu gọn — yêu cầu chức năng/phi chức năng, user story, phạm vi MVP và tiêu chí nghiệm thu đo được.",
      outcomes: [
        "Phân biệt yêu cầu chức năng và phi chức năng",
        "Viết user story chuẩn khuôn 'Là X, tôi muốn Y, để Z' kèm tiêu chí nghiệm thu",
        "Cắt phạm vi MVP: bảng phải-có / nên-có / để-sau"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**SRS** (Software Requirements Specification) thu gọn gồm:

> **Yêu cầu chức năng** — hệ thống LÀM GÌ: đăng ký, chat, tích hợp AI, song ngữ...
> **Yêu cầu phi chức năng** — LÀM TỐT ĐẾN ĐÂU: tải trang < 3s, hỗ trợ 100 người đồng thời, HTTPS bắt buộc, chuẩn WCAG.

**User story** — khuôn chuẩn Agile: *"Là [học viên], tôi muốn [nhắn tin cho bạn học], để [trao đổi bài]."* + **tiêu chí nghiệm thu** đo được: "tin nhắn đến trong < 2 giây; hiển thị trạng thái đã đọc".

**MVP** (Minimum Viable Product) — bản nhỏ nhất dùng được thật. Ma trận cắt phạm vi: **Phải có** (đăng nhập, chat, AI, song ngữ — theo yêu cầu đồ án) / **Nên có** (thông báo đẩy) / **Để sau** (gọi video). Tham vọng quá phạm vi là lý do số 1 khiến đồ án không bao giờ xong.`,
    labSteps: [
      "Mở src/lesson65.html — viết SRS thu gọn cho đồ án tốt nghiệp của CHÍNH BẠN.",
      "Mục 1 — Bài toán: 3 câu về sản phẩm bạn định làm và ai dùng nó.",
      "Mục 2 — bảng yêu cầu chức năng (≥ 6 dòng, nhớ các yêu cầu bắt buộc: OOP API, AI, chat, song ngữ, 10 người dùng).",
      "Mục 3 — bảng phi chức năng (≥ 4 dòng có SỐ đo được: giây, số người, %).",
      "Mục 4 — 3 user story đúng khuôn kèm tiêu chí nghiệm thu.",
      "Mục 5 — ma trận MVP 3 cột: phải có / nên có / để sau."
    ],
    commonMistakes: [
      { symptom: "Yêu cầu 'trang web phải nhanh' — không nghiệm thu được.", cause: "Phi chức năng không có số.", fix: "Đổi thành đo được: 'LCP < 2.5s trên 4G'." },
      { symptom: "MVP có 25 tính năng.", cause: "Không dám cắt phạm vi.", fix: "MVP chỉ giữ tính năng mà thiếu nó sản phẩm vô nghĩa — còn lại đẩy sang 'nên có/để sau'." },
      { symptom: "User story 'tôi muốn có nút màu xanh'.", cause: "Viết giải pháp thay vì nhu cầu.", fix: "Story nói NHU CẦU và GIÁ TRỊ (để làm gì); giải pháp để lúc thiết kế." }
    ],
    challenge: "Đưa SRS cho một người bạn đọc 5 phút rồi yêu cầu họ kể lại sản phẩm — chỗ nào họ kể sai chính là chỗ tài liệu chưa rõ, sửa lại.",
    checklist: [
      "Phi chức năng nào cũng có con số",
      "3 user story đủ khuôn + tiêu chí nghiệm thu",
      "MVP đã cắt: cột 'phải có' ≤ 7 mục"
    ],
    tasks: ["Viết SRS thu gọn đủ 5 mục: bài toán, chức năng, phi chức năng (có số), user story, ma trận MVP."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 65: SRS đồ án tốt nghiệp</title>
</head>
<body>
    <h1>SRS — Đồ án của tôi</h1>
    <!-- TODO: 5 mục — bài toán / bảng chức năng / bảng phi chức năng (số đo)
         / 3 user story "Là... tôi muốn... để..." / ma trận MVP -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("user story") && c.includes("mvp") && c.includes("<table") && (c.includes("phi chức năng") || c.includes("phi chuc nang")) && c.includes("tôi muốn");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "'Hệ thống chịu được 100 người dùng đồng thời' là loại yêu cầu nào?",
      snippet: "SRS > mục yêu cầu...",
      options: [
        { text: "Yêu cầu chức năng", correct: false },
        { text: "Yêu cầu phi chức năng (chất lượng, có số đo)", correct: true },
        { text: "User story", correct: false },
        { text: "Không phải yêu cầu", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "MVP là gì?", o: ["Bản đầy đủ nhất", "Bản nhỏ nhất vẫn dùng được thật để kiểm chứng giá trị", "Bản demo giả", "Bản chạy nội bộ"], a: 1 },
      { q: "Khuôn user story chuẩn?", o: ["Ai - ở đâu - khi nào", "Là [vai trò], tôi muốn [nhu cầu], để [giá trị]", "Nếu - thì - không thì", "Đầu vào - xử lý - đầu ra"], a: 1 },
      { q: "Tiêu chí nghiệm thu tốt phải thế nào?", o: ["Càng chung chung càng linh hoạt", "Đo được, kiểm được (thời gian, số lượng, trạng thái)", "Do dev tự cảm nhận", "Không cần viết ra"], a: 1 },
      { q: "Lý do số 1 khiến đồ án không hoàn thành?", o: ["Thiếu tiền", "Phạm vi tham vọng quá mức, không cắt MVP", "Máy yếu", "Thiếu thư viện"], a: 1 }
    ]
  },
  {
    id: "lesson66",
    title: "66. Lựa chọn Tech Stack & Thiết kế kiến trúc hệ thống",
    lang: "html",
    file: "src/lesson66.html",
    duration: "50 phút",
    overview: {
      description: "Chọn vũ khí cho đồ án bằng tiêu chí thay vì cảm tính: so sánh MERN và LAMP, vẽ sơ đồ kiến trúc 3 tầng và chốt stack kèm lý do bằng văn bản.",
      outcomes: [
        "So sánh 2 stack phổ biến MERN và LAMP/LNMP theo 4 tiêu chí",
        "Vẽ sơ đồ kiến trúc: Client → API → DB (+ AI service, WebSocket)",
        "Viết 'Architecture Decision Record' mini cho lựa chọn của mình"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **MERN**: MongoDB + Express + React + Node — một ngôn ngữ JS xuyên suốt, hệ sinh thái npm khổng lồ, hợp realtime (WebSocket tự nhiên trên Node).
> **LAMP/LNMP**: Linux + Apache/Nginx + MySQL + PHP — hosting rẻ phổ biến, mô hình đơn giản, PDO + MVC bạn đã học kỹ.

Tiêu chí chọn (theo thứ tự): **đội ngũ biết gì** > yêu cầu đặc thù (realtime? quan hệ dữ liệu phức tạp?) > chi phí vận hành > hệ sinh thái thư viện. "Framework mới nhất" KHÔNG nằm trong danh sách.

Kiến trúc 3 tầng chuẩn cho đồ án:
\`\`\`
[Browser SPA] ⇄ HTTPS/WSS ⇄ [API Server (Express/PHP)] ⇄ [MySQL/MongoDB]
                                    ⇅
                              [Gemini API]
\`\`\`
**ADR (Architecture Decision Record)** — văn bản 5 dòng: bối cảnh → các lựa chọn → quyết định → lý do → hệ quả chấp nhận. Sau này ai hỏi 'sao chọn X' là có câu trả lời.`,
    labSteps: [
      "Mở src/lesson66.html — hồ sơ kiến trúc cho đồ án của bạn.",
      "Bảng so sánh MERN vs LAMP: ngôn ngữ, database, realtime, chi phí hosting — điền từ hiểu biết đã học.",
      "Vẽ sơ đồ kiến trúc 3 tầng của đồ án bằng <pre> ASCII: đủ Client, API, DB, Gemini, WebSocket.",
      "Viết ADR 5 dòng: bối cảnh - lựa chọn - quyết định - lý do - hệ quả.",
      "Liệt kê 'việc cần cài đặt': Node/XAMPP, Git, editor — checklist môi trường trước Chặng 5."
    ],
    commonMistakes: [
      { symptom: "Chọn framework vì đang hot trên mạng.", cause: "Hype-driven development.", fix: "Chấm theo 4 tiêu chí — 'đội ngũ biết gì' luôn nặng ký nhất với đồ án có deadline." },
      { symptom: "Sơ đồ kiến trúc thiếu đường đi của AI và WebSocket.", cause: "Chỉ vẽ luồng CRUD cơ bản.", fix: "Đồ án yêu cầu AI + chat — hai luồng này phải xuất hiện trong sơ đồ từ ngày đầu." },
      { symptom: "Không ghi lại lý do chọn stack, 2 tháng sau tự hỏi 'sao hồi đó chọn cái này?'.", cause: "Quyết định miệng.", fix: "ADR 5 dòng mất 10 phút, tiết kiệm hàng giờ tranh cãi về sau." }
    ],
    challenge: "Viết thêm ADR thứ hai cho lựa chọn database (MySQL vs MongoDB) dựa trên mô hình dữ liệu đồ án của bạn.",
    checklist: [
      "Bảng so sánh đủ 4 tiêu chí",
      "Sơ đồ có đủ 5 khối: Client, API, DB, AI, WebSocket",
      "ADR đủ 5 dòng có lý do thật"
    ],
    tasks: ["Dựng bảng so sánh MERN/LAMP, sơ đồ kiến trúc ASCII đủ 5 khối và ADR 5 dòng."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 66: Kiến trúc & Tech Stack</title>
</head>
<body>
    <h1>Hồ sơ kiến trúc đồ án</h1>
    <!-- TODO 1: bảng so sánh MERN vs LAMP -->
    <!-- TODO 2: <pre> sơ đồ Client -> API -> DB (+ Gemini, WebSocket) -->
    <!-- TODO 3: ADR 5 dòng -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("mern") && (c.includes("lamp") || c.includes("lnmp")) && c.includes("<pre") && c.includes("websocket") && c.includes("adr");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Tiêu chí NẶNG KÝ nhất khi chọn tech stack cho dự án có deadline?",
      snippet: "MERN hay LAMP?",
      options: [
        { text: "Framework mới nhất", correct: false },
        { text: "Đội ngũ đã thành thạo công nghệ nào", correct: true },
        { text: "Logo đẹp", correct: false },
        { text: "Nhiều sao GitHub", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "MERN stack gồm gì?", o: ["MySQL, Express, React, Nginx", "MongoDB, Express, React, Node", "MongoDB, Ember, Ruby, Node", "MySQL, Electron, Redux, Node"], a: 1 },
      { q: "ADR là gì?", o: ["Công cụ đo hiệu năng", "Văn bản ghi lại quyết định kiến trúc kèm bối cảnh và lý do", "Sơ đồ database", "License phần mềm"], a: 1 },
      { q: "Đồ án cần realtime chat — điểm cộng cho stack nào?", o: ["LAMP thuần", "Node (MERN) — WebSocket tự nhiên trên event loop", "Không stack nào", "Chỉ cần HTML"], a: 1 },
      { q: "Kiến trúc 3 tầng gồm?", o: ["HTML, CSS, JS", "Client — API Server — Database", "Dev, Staging, Prod", "MVC"], a: 1 }
    ]
  },
  {
    id: "lesson67",
    title: "67. Git nâng cao & Quản lý kho GitHub chuyên nghiệp",
    lang: "html",
    file: "src/lesson67.html",
    duration: "55 phút",
    overview: {
      description: "Làm chủ dòng thời gian dự án: quy trình branch → commit chuẩn Conventional → merge, xử lý conflict và bộ ba sống còn .gitignore, README, pull request.",
      outcomes: [
        "Thuộc chu trình: init → add → commit → push và branch → merge",
        "Viết commit message chuẩn Conventional Commits (feat/fix/docs...)",
        "Cấu hình .gitignore chặn node_modules và .env trước commit đầu tiên"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Git** — máy thời gian của mã nguồn; **GitHub** — nơi lưu trữ và cộng tác. Chu trình lõi:

\`\`\`bash
git init                         # khởi tạo kho
git add .                        # đưa thay đổi vào vùng chờ
git commit -m "feat: thêm form đăng nhập"
git remote add origin <url>      # nối kho GitHub
git push -u origin main          # đẩy lên
git checkout -b feat/chat        # nhánh tính năng mới
git merge feat/chat              # gộp về main khi xong
\`\`\`

> **Conventional Commits**: \`feat:\` tính năng • \`fix:\` sửa bug • \`docs:\` tài liệu • \`refactor:\` • \`test:\` — lịch sử đọc được như nhật ký dự án.
> **.gitignore trước commit đầu tiên**: \`node_modules/\`, \`.env\`, \`dist/\` — lộ .env là lộ khóa bí mật (bài 56).
> Quy tắc nhịp: commit nhỏ, mỗi commit MỘT việc trọn vẹn; push tối thiểu mỗi cuối buổi làm.`,
    labSteps: [
      "Mở src/lesson67.html — dựng 'sổ tay Git' + thực hành lệnh thật trên máy nếu có Git.",
      "Viết khối <pre> chu trình 7 lệnh lõi kèm chú thích 1 dòng mỗi lệnh — tự gõ, không dán.",
      "Viết nội dung .gitignore chuẩn cho đồ án: node_modules, .env, dist, *.log.",
      "Viết 5 commit message mẫu chuẩn Conventional cho 5 việc khác nhau của đồ án.",
      "Mô tả quy trình xử lý conflict 4 bước: pull → mở file có <<<<<<< → chọn/gộp → add + commit.",
      "Thực chiến (nếu có Git): tạo repo, commit đầu tiên phải là .gitignore + README."
    ],
    commonMistakes: [
      { symptom: "Repo nặng 300MB, clone 10 phút.", cause: "Commit cả node_modules.", fix: ".gitignore trước commit đầu; lỡ rồi: git rm -r --cached node_modules." },
      { symptom: "Lịch sử toàn 'update', 'fix', 'aaa'.", cause: "Commit message vô nghĩa.", fix: "Chuẩn Conventional: feat/fix/docs + mô tả việc cụ thể." },
      { symptom: "Gặp conflict là xoá repo clone lại.", cause: "Sợ các dấu <<<<<<<.", fix: "Conflict chỉ là 2 phiên bản cùng dòng: đọc, chọn/gộp, xoá markers, add + commit." }
    ],
    challenge: "Trên repo thật: tạo nhánh feat/demo, sửa README ở cả main lẫn nhánh cùng một dòng, merge để TỰ TẠO conflict rồi giải quyết nó — một lần làm chủ, cả đời hết sợ.",
    checklist: [
      "Gõ thuộc chu trình 7 lệnh không nhìn tài liệu",
      "Commit đầu tiên của mọi repo là .gitignore + README",
      "Đã tự giải quyết một conflict"
    ],
    tasks: ["Dựng sổ tay: chu trình lệnh git (init/add/commit/push/branch/merge), .gitignore chuẩn và 5 commit message Conventional."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 67: Sổ tay Git</title>
</head>
<body>
    <h1>Git & GitHub chuyên nghiệp</h1>
    <!-- TODO 1: <pre> chu trình git init/add/commit/push + branch/merge -->
    <!-- TODO 2: .gitignore: node_modules, .env, dist -->
    <!-- TODO 3: 5 commit message chuẩn feat:/fix:/docs: -->
    <!-- TODO 4: 4 bước xử lý conflict -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("git init") && c.includes("git add") && c.includes("git commit") && c.includes("git push") && c.includes("node_modules") && c.includes(".env") && c.includes("feat:") && c.includes("conflict");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "File nào TUYỆT ĐỐI phải nằm trong .gitignore trước commit đầu tiên?",
      snippet: ".gitignore: node_modules/ + [ ??? ]",
      options: [
        { text: "README.md", correct: false },
        { text: ".env (chứa khóa bí mật)", correct: true },
        { text: "index.html", correct: false },
        { text: "package.json", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "git add . làm gì?", o: ["Đẩy code lên GitHub", "Đưa thay đổi vào vùng chờ (staging) để commit", "Tạo nhánh", "Xoá file"], a: 1 },
      { q: "Commit message 'feat: thêm chat realtime' theo chuẩn nào?", o: ["BEM", "Conventional Commits", "camelCase", "JSDoc"], a: 1 },
      { q: "Lệnh nào tạo và chuyển sang nhánh mới?", o: ["git branch -d", "git checkout -b feat/chat", "git merge", "git clone -b"], a: 1 },
      { q: "Gặp conflict thì làm gì?", o: ["Xoá repo clone lại", "Mở file, đọc 2 phiên bản giữa các marker, chọn/gộp rồi add + commit", "Đợi tự hết", "Đổi máy"], a: 1 }
    ]
  },
  {
    id: "lesson68",
    title: "68. Database Seeding: Bộ dữ liệu mẫu cho hệ thống lớn",
    lang: "javascript",
    file: "src/lesson68.js",
    duration: "50 phút",
    overview: {
      description: "Script hóa việc nạp dữ liệu: seed có thứ tự tôn trọng khóa ngoại, chạy lại được không nhân đôi (idempotent) — nối generator bài 60 vào database thật.",
      outcomes: [
        "Viết script seed theo thứ tự phụ thuộc: users → products → orders",
        "Làm seed idempotent: xoá-nạp lại hoặc upsert, chạy 10 lần kết quả như 1",
        "Tách cấu hình số lượng để seed nhẹ cho dev, nặng cho test hiệu năng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Seeding** — script tự động nạp dữ liệu mẫu vào DB, chạy được mọi lúc, trên máy mọi thành viên:

\`\`\`javascript
// seed.js — chạy bằng: node seed.js
const SEED_CONFIG = { users: 20, orders: 100 };   // dev nhẹ; test đổi 1000/50000

async function seed() {
  await db.query("DELETE FROM orders");   // xoá theo thứ tự NGƯỢC khóa ngoại
  await db.query("DELETE FROM users");
  const users = Array.from({ length: SEED_CONFIG.users }, (_, i) => makeUser(i + 1));
  await insertUsers(users);                // cha trước
  await insertOrders(makeOrders(users));   // con sau — user_id luôn có thật
  console.log("Seed xong:", SEED_CONFIG);
}
\`\`\`

> **Thứ tự là tất cả**: nạp bảng cha (users) trước bảng con (orders) — ngược lại khóa ngoại gãy. Xoá thì NGƯỢC thứ tự nạp.
> **Idempotent**: chạy lại không nhân đôi dữ liệu — xoá sạch rồi nạp, hoặc dùng UPSERT theo khóa tự nhiên.
> Đồ án yêu cầu 'tối thiểu 10 người dùng hoạt động' — seed chính là cách chuẩn để luôn sẵn dữ liệu demo sống động.`,
    labSteps: [
      "Mở src/lesson68.js — nâng generator bài 60 thành script seed hoàn chỉnh.",
      "Khai SEED_CONFIG { users: 20, orders: 100 } — chú thích cấu hình cho dev/test.",
      "Viết hàm seed(): bước 1 xoá orders rồi mới xoá users (ngược khóa ngoại) — giả lập db.query bằng console.log câu SQL.",
      "Bước 2: sinh users bằng makeUser (bài 60), 'nạp' cha trước.",
      "Bước 3: makeOrders(users) — mỗi order lấy user_id = pick(users).id, nạp con sau.",
      "Chạy seed() hai lần liên tiếp — xác nhận log cho thấy kết quả không nhân đôi."
    ],
    commonMistakes: [
      { symptom: "Lỗi foreign key constraint fails khi seed.", cause: "Nạp orders trước users hoặc xoá users trước orders.", fix: "Nạp: cha → con. Xoá: con → cha. Luôn." },
      { symptom: "Chạy seed 3 lần, dữ liệu gấp 3.", cause: "Script chỉ INSERT không dọn.", fix: "Mở đầu bằng DELETE đúng thứ tự (hoặc UPSERT) — idempotent là bắt buộc." },
      { symptom: "Lỡ chạy script seed lên database production.", cause: "Script không kiểm môi trường.", fix: "Đầu script: if (process.env.NODE_ENV === 'production') throw new Error('Cấm seed trên production!');" }
    ],
    challenge: "Thêm bảng messages (chat giữa 2 user có thật) vào chuỗi seed — đúng thứ tự, đúng tỷ lệ: 80% user có ít nhất 1 hội thoại.",
    checklist: [
      "Thuộc luật thứ tự: nạp cha→con, xoá con→cha",
      "Seed chạy 2 lần kết quả như 1 (idempotent)",
      "Có chốt chặn môi trường production"
    ],
    tasks: ["Viết seed(): SEED_CONFIG, xoá ngược thứ tự, nạp users trước orders (user_id tham chiếu thật), chốt chặn production."],
    starterCode: `// BÀI 68: Database Seeding
// (tái sử dụng makeUser/pick từ bài 60)
// TODO 1: SEED_CONFIG { users: 20, orders: 100 }
// TODO 2: seed() — DELETE orders trước users; nạp users trước orders
// TODO 3: makeOrders(users) — user_id lấy từ users có thật
// TODO 4: chốt chặn NODE_ENV === 'production'
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("seed_config") && c.includes("deletefromorders") && c.includes("deletefromusers") && c.includes("makeorders") && c.includes("production");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Seed 2 bảng users (cha) và orders (con) — thứ tự NẠP đúng là?",
      snippet: "orders.user_id → users.id (khóa ngoại)",
      options: [
        { text: "orders trước, users sau", correct: false },
        { text: "users trước, orders sau — con cần cha tồn tại", correct: true },
        { text: "Thứ tự nào cũng được", correct: false },
        { text: "Nạp song song", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Idempotent với script seed nghĩa là gì?", o: ["Chạy cực nhanh", "Chạy bao nhiêu lần kết quả cũng như chạy một lần", "Không cần database", "Tự xoá chính nó"], a: 1 },
      { q: "Xoá dữ liệu 2 bảng cha-con theo thứ tự nào?", o: ["Cha trước", "Con trước, cha sau — ngược thứ tự nạp", "Cùng lúc", "Tuỳ database"], a: 1 },
      { q: "Vì sao cần chốt chặn production trong seed?", o: ["Cho oai", "Tránh thảm họa xoá-nạp đè dữ liệu thật của người dùng", "Tăng tốc", "Git yêu cầu"], a: 1 },
      { q: "SEED_CONFIG tách riêng số lượng để làm gì?", o: ["Đẹp code", "Dev seed nhẹ chạy nhanh; test hiệu năng seed nặng — không sửa logic", "Bảo mật", "Không có tác dụng"], a: 1 }
    ]
  },
  {
    id: "lesson69",
    title: "69. Viết tài liệu kỹ thuật (Technical Docs / API Docs)",
    lang: "html",
    file: "src/lesson69.html",
    duration: "50 phút",
    overview: {
      description: "Code giỏi mà không ai chạy được là code chết: viết README chuẩn 7 mục và tài liệu API endpoint đủ 6 thành phần — kỹ năng ăn điểm nhất khi nộp đồ án.",
      outcomes: [
        "Viết README 7 mục: giới thiệu, tính năng, stack, cài đặt, env, chạy, screenshots",
        "Tài liệu hóa API endpoint đủ: method, path, auth, params, response mẫu, mã lỗi",
        "Viết hướng dẫn cài đặt mà người lạ làm theo được từng bước"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**README.md** — cửa ngõ dự án, khuôn 7 mục:
1. Tên + mô tả 2 câu. 2. Tính năng chính. 3. Tech stack. 4. **Cài đặt từng lệnh** (clone → install → env → run). 5. Bảng biến môi trường (.env.example). 6. Cách chạy test. 7. Screenshots/demo.

**API Docs** — mỗi endpoint đủ 6 thành phần:
\`\`\`
POST /api/messages          (Auth: Bearer JWT)
Body:    { "roomId": "abc", "body": "Xin chào" }
200:     { "id": 15, "sentAt": "2026-07-11T09:00:00Z" }
400:     { "error": "body_required" }   401: chưa xác thực   429: quá tần suất
\`\`\`

> Thước đo duy nhất của tài liệu: **người chưa từng thấy dự án làm theo có chạy được không**. Viết xong hãy tự làm theo trên thư mục trắng — vấp ở đâu, tài liệu thiếu ở đó. Ban giám khảo đồ án chính là 'người lạ' đầu tiên của bạn.`,
    labSteps: [
      "Mở src/lesson69.html — viết bộ tài liệu mẫu cho đồ án.",
      "Dựng README đủ 7 mục — phần Cài đặt viết TỪNG lệnh: git clone, npm install, cp .env.example .env, npm run dev.",
      "Dựng bảng biến môi trường: tên biến — ý nghĩa — ví dụ (che giá trị thật).",
      "Tài liệu hóa 3 endpoint của đồ án (auth, messages, ai) đủ 6 thành phần theo khuôn.",
      "Nghiệm thu: đưa mục Cài đặt cho một người khác đọc — họ kẹt ở bước nào thì bổ sung bước đó."
    ],
    commonMistakes: [
      { symptom: "README chỉ có đúng tên dự án.", cause: "Coi tài liệu là việc phụ làm sau (và không bao giờ làm).", fix: "Viết README ngay khi tạo repo, cập nhật theo tính năng — nó là một phần của sản phẩm." },
      { symptom: "Hướng dẫn thiếu bước tạo .env, người mới chạy là sập.", cause: "Người viết quen tay quên bước 'hiển nhiên'.", fix: "Tự làm theo tài liệu trên thư mục trắng trước khi nộp; kèm .env.example." },
      { symptom: "API docs không có ví dụ response lỗi.", cause: "Chỉ tài liệu hóa 'đường vui'.", fix: "Mỗi endpoint tối thiểu 1 response thành công + 2 mã lỗi thường gặp." }
    ],
    challenge: "Chấm điểm README của 2 repo nổi tiếng trên GitHub theo khuôn 7 mục — học 2 điều hay nhất, đưa vào tài liệu của bạn.",
    checklist: [
      "README đủ 7 mục, phần cài đặt là các lệnh copy-chạy được",
      "3 endpoint đủ 6 thành phần kể cả mã lỗi",
      "Đã có người khác làm theo thử tài liệu"
    ],
    tasks: ["Viết README 7 mục (có các lệnh cài đặt, bảng .env) và tài liệu 3 endpoint đủ method/path/auth/body/response/mã lỗi."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 69: Tài liệu kỹ thuật</title>
</head>
<body>
    <h1>README & API Docs mẫu</h1>
    <!-- TODO 1: README 7 mục — cài đặt từng lệnh: git clone, npm install, .env, npm run dev -->
    <!-- TODO 2: bảng biến môi trường -->
    <!-- TODO 3: 3 endpoint đủ method, path, auth, body, response 200, mã lỗi -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("readme") && c.includes("npm install") && c.includes(".env") && c.includes("post /api/") && c.includes("401") && c.includes("<table");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Thước đo DUY NHẤT của một tài liệu cài đặt tốt là gì?",
      snippet: "README.md > ## Cài đặt",
      options: [
        { text: "Viết dài và trang trọng", correct: false },
        { text: "Người lạ làm theo từng bước là chạy được", correct: true },
        { text: "Có nhiều emoji", correct: false },
        { text: "Dùng tiếng Anh", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "File .env.example dùng để làm gì?", o: ["Backup .env thật", "Liệt kê tên biến môi trường cần có mà không lộ giá trị thật", "Chạy test", "Cấu hình git"], a: 1 },
      { q: "Tài liệu một API endpoint tối thiểu cần gì?", o: ["Chỉ cần URL", "Method, path, auth, body, response mẫu, mã lỗi", "Tên người viết", "Ảnh chụp code"], a: 1 },
      { q: "Cách nghiệm thu tài liệu cài đặt?", o: ["Đọc lại 2 lần", "Tự (hoặc nhờ người khác) làm theo trên môi trường trắng", "Đếm số chữ", "Hỏi AI là đủ"], a: 1 },
      { q: "Khi nào nên viết README?", o: ["Sau khi nộp đồ án", "Ngay khi tạo repo, cập nhật dần theo tính năng", "Khi rảnh", "Không cần viết"], a: 1 }
    ]
  },
  {
    id: "lesson70",
    title: "70. Tổng kết Chặng 4: Sẵn sàng cho Siêu đồ án",
    lang: "html",
    file: "src/lesson70.html",
    duration: "40 phút",
    overview: {
      description: "Khép lại hành trình 70 bài lý thuyết + kỹ năng: tự kiểm kho vũ khí bảo mật-AI-quy trình, và ký 'bản cam kết đồ án' trước khi bước vào 30 bài thực chiến cuối.",
      outcomes: [
        "Tự đánh giá đủ-thiếu trên bản đồ kỹ năng 4 chặng",
        "Chốt hồ sơ đồ án: SRS + kiến trúc + repo + tài liệu khung",
        "Lên lịch thực hiện 30 bài Chặng 5-6 theo tuần"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Nhìn lại kho vũ khí sau 70 bài:
> **Chặng 1** — phản xạ cú pháp: HTML/CSS/JS/SQL/PHP thuộc tay.
> **Chặng 2** — tư duy hệ thống: schema, MVC, REST, chuẩn UI/UX, DRY.
> **Chặng 3** — phần lõi CS: cấu trúc dữ liệu, giải thuật, Big O, mật mã, hiệu năng, PWA, test.
> **Chặng 4** — thực chiến bảo mật (OWASP, JWT, OAuth2) + tiền đề AI (Gemini, multimodal, structured outputs) + quy trình (SRS, kiến trúc, Git, seeding, docs).

Chặng 5-6 (30 bài cuối) là MỘT dự án liền mạch: dựng backend OOP → frontend → chat realtime → AI → kiểm thử → GitHub → VPS → HTTPS → phát hành. Mỗi bài là một cột mốc của chính sản phẩm tốt nghiệp của bạn — từ đây không còn bài tập rời rạc nữa.`,
    labSteps: [
      "Mở src/lesson70.html — dựng 'bản cam kết đồ án'.",
      "Bảng tự kiểm 10 kỹ năng then chốt (tự chấm 1-5): HTML/CSS, JS, SQL, PHP/Node, bảo mật, AI API, Git, test, docs, hiệu năng.",
      "Kỹ năng nào ≤ 3 điểm: ghi rõ bài số mấy cần ôn lại trong tuần này.",
      "Chốt thông tin đồ án: tên sản phẩm, một câu giá trị, stack đã chọn (từ bài 66), link repo (từ bài 67).",
      "Lịch 4 tuần: tuần 1 backend (71-73), tuần 2 frontend (74-82), tuần 3 tính năng nâng cao + AI (83-88), tuần 4 kiểm thử + deploy (89-100)."
    ],
    commonMistakes: [
      { symptom: "Bỏ qua bài tổng kết, nhảy thẳng vào code đồ án.", cause: "Nôn nóng.", fix: "30 phút lập kế hoạch tiết kiệm 30 giờ code lạc hướng — bản cam kết là la bàn của 30 bài tới." },
      { symptom: "Tự chấm 5 điểm mọi kỹ năng.", cause: "Ảo tưởng năng lực (hiệu ứng Dunning-Kruger).", fix: "Mỗi kỹ năng tự hỏi: 'không nhìn tài liệu mình có làm lại được bài thực hành đó không?'" },
      { symptom: "Lịch 4 tuần nhưng tuần 1 để trống 'khởi động sau'.", cause: "Trì hoãn có tổ chức.", fix: "Bài 71 bắt đầu NGAY tuần này — ghi ngày cụ thể vào cam kết." }
    ],
    challenge: "Gửi bản cam kết đồ án cho một người bạn/mentor và hẹn ngày demo giữa kỳ (sau bài 82) — cam kết công khai tăng gấp đôi tỷ lệ hoàn thành.",
    checklist: [
      "Bảng tự kiểm 10 kỹ năng có điểm và kế hoạch ôn",
      "Đồ án chốt đủ: tên, giá trị, stack, repo",
      "Lịch 4 tuần có ngày bắt đầu cụ thể"
    ],
    tasks: ["Dựng bản cam kết: bảng tự kiểm 10 kỹ năng, thông tin đồ án (tên/stack/repo) và lịch 4 tuần."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 70: Bản cam kết đồ án</title>
</head>
<body>
    <h1>Bản cam kết Siêu đồ án tốt nghiệp</h1>
    <!-- TODO 1: bảng tự kiểm 10 kỹ năng (điểm 1-5 + bài cần ôn) -->
    <!-- TODO 2: tên đồ án, câu giá trị, stack, link repo -->
    <!-- TODO 3: lịch 4 tuần cho bài 71-100 -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("<table") && c.includes("stack") && c.includes("repo") && (c.includes("tuần 1") || c.includes("tuan 1")) && (c.includes("tuần 4") || c.includes("tuan 4"));
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chặng 5-6 (bài 71-100) khác gì các chặng trước?",
      snippet: "71 → 100: một sản phẩm duy nhất",
      options: [
        { text: "Toàn lý thuyết", correct: false },
        { text: "Là MỘT dự án liền mạch — mỗi bài một cột mốc của sản phẩm tốt nghiệp", correct: true },
        { text: "Chỉ thi trắc nghiệm", correct: false },
        { text: "Không bắt buộc", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Trước khi vào đồ án lớn, việc gì đáng làm nhất?", o: ["Code ngay cho nóng", "Tự kiểm kỹ năng + chốt kế hoạch 4 tuần", "Mua domain", "Thiết kế logo"], a: 1 },
      { q: "Kỹ năng tự chấm ≤ 3 điểm thì xử lý thế nào?", o: ["Bỏ qua", "Ghi rõ bài cần ôn và ôn trong tuần", "Chờ đến khi cần", "Nhờ AI làm hộ"], a: 1 },
      { q: "Vì sao nên cam kết công khai lịch đồ án?", o: ["Khoe cho vui", "Cam kết công khai tăng đáng kể tỷ lệ hoàn thành", "Bắt buộc của khóa", "Để xin điểm"], a: 1 },
      { q: "Bốn tuần của đồ án đi theo trình tự nào?", o: ["Deploy → code → test", "Backend → Frontend → Tính năng nâng cao + AI → Kiểm thử + Deploy", "Frontend trước tiên", "Tuỳ hứng"], a: 1 }
    ]
  }
];
