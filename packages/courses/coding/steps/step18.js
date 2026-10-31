export default {
  id: "step18",
  lang: "php",
  file: "nhip/includes/csrf.php",
  duration: "150 phút",
  summary: "Vá ba lỗ hổng còn lại của chặng 4: CSRF bằng token đồng bộ cho mọi biểu mẫu POST, củng cố cookie phiên, và vẽ lại ảnh tải lên bằng GD để loại mã giấu trong tệp.",
  slides: [
    {
      section: "intro",
      title: "Lỗ hổng không cần gõ gì cũng dính",
      body: `SQL Injection và XSS cần kẻ tấn công **nhập** gì đó vào Nhịp. CSRF (Cross-Site Request Forgery) khác hẳn: nạn nhân chỉ cần **đang đăng nhập Nhịp** và vô tình mở một trang khác của kẻ xấu — trang đó âm thầm gửi yêu cầu tới Nhịp **bằng danh tính của nạn nhân**.

Ở step 13 ta đã thấy mối đe doạ này: một trang lạ dựng biểu mẫu trỏ tới \`delete.php\`. Cookie \`SameSite=Lax\` (step 12) chặn phần lớn trường hợp, nhưng "phần lớn" không đủ. Step này thêm lớp phòng thủ chính thức, rồi dọn nốt hai rủi ro: cookie phiên và ảnh tải lên.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu CSRF hoạt động thế nào và vì sao cookie tự động là gốc rễ.
2. Cài **token đồng bộ** (synchronizer token): mỗi phiên một token bí mật, mọi POST phải mang đúng.
3. So token an toàn bằng \`hash_equals\`; trả mã **419** khi sai.
4. Củng cố cookie phiên: \`HttpOnly\`, \`SameSite\`, \`Secure\` (cho HTTPS).
5. Vẽ lại ảnh tải lên bằng **GD** để loại dữ liệu thừa — chặn ảnh "đa hợp" ảnh + mã.
6. Đánh dấu A01 (CSRF) và A08 trong \`SECURITY.md\`.`,
    },
    {
      section: "visual",
      title: "CSRF: mượn tay trình duyệt",
      visual: "csrf-flow",
      body: `1. Lan đăng nhập Nhịp — trình duyệt lưu cookie phiên của Nhịp.
2. Lan mở một trang khác (\`trang-xau.com\`) chứa biểu mẫu ẩn trỏ tới \`nhip/delete.php\`, tự gửi bằng JavaScript.
3. Trình duyệt, theo lệnh, gửi yêu cầu POST tới Nhịp — và **tự kèm cookie của Nhịp** (cookie luôn đi theo đích, bất kể ai khởi phát).
4. Nếu Nhịp chỉ kiểm cookie, nó tưởng đây là Lan → xoá bài.

Mấu chốt: kẻ tấn công **không** đọc được gì của Nhịp (chính sách cùng nguồn chặn), nhưng vẫn **kích hoạt** được hành động. Cần một bằng chứng mà chỉ trang Nhịp thật mới có.`,
    },
    {
      section: "visual",
      title: "Token đồng bộ",
      visual: "csrf-token",
      body: `Bằng chứng đó là **token CSRF**: một chuỗi ngẫu nhiên lưu trong phiên của Lan.

- Mọi biểu mẫu POST của Nhịp nhúng token này trong ô ẩn \`_token\`.
- Máy chủ so token gửi lên với token trong phiên: khớp mới xử lý.
- \`trang-xau.com\` **không đọc được** token (nó nằm trong HTML của Nhịp, khác nguồn) → không điền đúng được → yêu cầu giả bị từ chối.

Token khác cookie ở chỗ: cookie trình duyệt **tự gửi**, còn token phải được **chủ động nhúng** vào biểu mẫu — mà chỉ trang Nhịp thật làm được.`,
    },
    {
      section: "research",
      title: "CSRF theo OWASP",
      body: `CSRF nằm trong nhóm **A01 Broken Access Control** của OWASP Top 10:2025 (CWE-352). Hướng dẫn phòng chống của OWASP xếp hạng biện pháp:

1. Dùng khung có sẵn cơ chế chống CSRF, hoặc **token đồng bộ** như Nhịp làm.
2. Lớp bổ sung: cookie thuộc tính **\`SameSite\`** (Lax hoặc Strict).
3. Với yêu cầu nhạy cảm: xác minh lại (nhập mật khẩu, OTP).

OWASP nhấn mạnh token phải **ngẫu nhiên mạnh, gắn với phiên, so sánh thời gian cố định** — đúng ba điều \`bin2hex(random_bytes(32))\`, lưu trong \`$_SESSION\`, và \`hash_equals\` làm.

> OWASP Foundation (2025) *Cross-Site Request Forgery Prevention Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
>
> MITRE (2025) *CWE-352: Cross-Site Request Forgery (CSRF)*. Available at: https://cwe.mitre.org/data/definitions/352.html`,
    },
    {
      section: "research",
      title: "SameSite và tải tệp an toàn",
      body: `Thuộc tính cookie \`SameSite\` (RFC 6265bis) quyết định cookie có được gửi kèm yêu cầu khởi phát từ trang khác không. \`Lax\` — mặc định của trình duyệt hiện đại — chặn cookie trong POST khác nguồn, đã đỡ phần lớn CSRF; nhưng token vẫn cần vì không phải trình duyệt nào cũng vậy, và không nên dồn toàn bộ an toàn vào một lớp.

Về ảnh tải lên, OWASP khuyến nghị **vẽ lại (re-encode)** ảnh thay vì chỉ kiểm: đọc pixel rồi ghi ra tệp mới sẽ loại mọi khối dữ liệu lạ (nơi giấu mã trong tệp "đa hợp" polyglot).

> Barth, A. and West, M. (2025) *Cookies: HTTP State Management Mechanism (draft-ietf-httpbis-rfc6265bis)*. IETF. Available at: https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/
>
> OWASP Foundation (2025) *File Upload Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html`,
    },
    {
      section: "ideate",
      title: "Một chốt chặn cho mọi biểu mẫu",
      body: `Thay vì kiểm token ở từng trang (dễ quên), Nhịp đặt **một** chốt chặn trong \`bootstrap.php\`: hàm \`csrf_check()\` chạy với **mọi** yêu cầu POST, trước khi bất kỳ trang nào xử lý.

- \`csrf_token()\` — tạo (lần đầu) hoặc trả token của phiên.
- \`csrf_field()\` — in ô ẩn, nhúng vào mọi \`<form method="post">\`.
- \`csrf_check()\` — chặn POST thiếu/sai token bằng \`abort(419, …)\`.

Mã **419** không thuộc chuẩn HTTP gốc nhưng được nhiều khung (Laravel…) dùng cho "token hết hạn", phân biệt rõ với 400/403. Fail-safe defaults (step 16): không có token hợp lệ thì **từ chối**, không cần liệt kê trang nào cần bảo vệ.`,
    },
    {
      section: "core",
      title: "Sinh và nhúng token",
      body: `~~~php
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));   // 64 ký tự hex, không đoán được
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_token" value="' . e(csrf_token()) . '">';
}
~~~

Token sinh **một lần** mỗi phiên và dùng lại cho mọi biểu mẫu — đủ an toàn cho đa số ứng dụng. (Mức cao hơn: token mỗi biểu mẫu, nhưng phức tạp hơn và dễ vỡ khi mở nhiều tab.)

Mỗi \`<form method="post">\` thêm một dòng ngay sau thẻ mở:

~~~php
<form method="post" action="delete.php">
  <?= csrf_field() ?>
  ...
~~~`,
    },
    {
      section: "core",
      title: "Kiểm token an toàn",
      body: `~~~php
function csrf_check(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;                                   // GET không đổi dữ liệu, không cần
    }
    $sent = (string) ($_POST['_token'] ?? '');
    if ($sent === '' || !hash_equals(csrf_token(), $sent)) {
        abort(419, 'Phiên làm việc đã hết hạn hoặc yêu cầu không hợp lệ. Hãy tải lại trang.');
    }
}
~~~

**Vì sao \`hash_equals\` chứ không \`===\`?** So sánh chuỗi thường dừng ngay ở ký tự khác đầu tiên — thời gian so lâu hay nhanh để lộ bao nhiêu ký tự đầu đã đúng, về lý thuyết giúp dò dần token. \`hash_equals\` luôn so hết, thời gian cố định.

Chỉ **POST** mới kiểm: GET phải luôn an toàn (step 13) nên không mang token, và tìm kiếm GET vẫn chia sẻ link được.`,
    },
    {
      section: "core",
      title: "Fetch cũng tự mang token",
      body: `Nút tim gửi bằng \`fetch\` (step 15). Có cần làm gì thêm không? **Không** — vì nút nằm trong một \`<form class="like-form">\` đã có \`csrf_field()\`:

~~~js
body: new FormData(form),   // FormData gói MỌI input của form, gồm _token
~~~

\`FormData\` tự thu cả ô ẩn \`_token\`, nên yêu cầu fetch mang token y như biểu mẫu thường. Đây là lợi ích của việc bọc nút trong biểu mẫu thay vì gắn dữ liệu rời rạc trong JavaScript.

Một điểm cuối trả JSON như \`like.php\` khi gặp token sai sẽ nhận trang 419 HTML; với Nhịp điều đó hiếm xảy ra vì token luôn có sẵn. Ứng dụng lớn thường trả lỗi 419 dạng JSON cho các lời gọi API.`,
    },
    {
      section: "core",
      title: "Củng cố cookie phiên",
      body: `Xem lại cờ cookie đặt ở step 12, giờ hiểu đủ ý nghĩa bảo mật:

~~~php
session_set_cookie_params([
    'httponly' => true,    // JS không đọc được → XSS khó trộm phiên (step 17)
    'samesite' => 'Lax',   // lớp 2 chống CSRF, bổ sung cho token
    'secure'   => false,   // ĐỔI THÀNH true khi có HTTPS (step 24)
]);
~~~

- \`Secure\` bật thì cookie **chỉ** gửi qua HTTPS — kẻ nghe lén mạng Wi-Fi công cộng không bắt được. Trên localhost (HTTP) phải để \`false\`, nếu không trình duyệt bỏ cookie và bạn không đăng nhập được. Bật ở hosting.
- Mã phiên vẫn được đổi khi đăng nhập (\`session_regenerate_id\`, step 12) — chống cố định phiên.

Ba cờ này + token CSRF phủ cả bốn góc của việc bảo vệ phiên.`,
    },
    {
      section: "core",
      title: "Vẽ lại ảnh bằng GD",
      body: `Step 14 đã kiểm ảnh bằng \`finfo\`. Nhưng kẻ tấn công có thể tạo tệp **vừa là ảnh hợp lệ vừa chứa mã PHP** ở khối metadata (ảnh "đa hợp"). \`finfo\` thấy ảnh thật nên cho qua.

Lớp cuối: **vẽ lại** ảnh bằng thư viện GD của PHP:

~~~php
$image = imagecreatefromjpeg($file['tmp_name']);   // đọc PIXEL vào bộ nhớ
imagejpeg($image, $path, 85);                       // ghi ra tệp MỚI từ pixel
imagedestroy($image);
~~~

Tệp mới chỉ chứa pixel của ảnh — mọi khối dữ liệu lạ (gồm mã giấu) **không được chép sang**. Kiểm chứng: thêm \`<?php … ?>\` vào đuôi một tệp \`.jpg\`, tải lên, rồi \`grep\` tệp đã lưu — chuỗi mã đã biến mất.`,
    },
    {
      section: "core",
      title: "Vì sao không chỉ dựa vào SameSite",
      body: `Có \`SameSite=Lax\` rồi sao còn cần token? Vì **phòng thủ nhiều lớp** (step 16):

- Trình duyệt rất cũ không hiểu \`SameSite\` → chỉ token cứu.
- \`Lax\` vẫn gửi cookie với **điều hướng GET cấp cao nhất** — nếu lỡ có thao tác đổi dữ liệu qua GET (Nhịp không có, nhưng để phòng), token là chốt chặn.
- Cấu hình cookie có thể bị đổi nhầm sau này; token là lớp độc lập, không phụ thuộc cờ cookie.

Hai lớp độc lập cho cùng một mối đe doạ: kẻ tấn công phải phá **cả hai**. Đây cũng là lý do giữ cả \`finfo\` lẫn GD cho ảnh, cả \`e()\` lẫn CSP cho XSS.`,
    },
    {
      section: "apply",
      title: "includes/csrf.php",
      body: "Tạo tệp mới. `abort()` được dùng ở đây nên `csrf.php` phải được nạp sau `helpers.php` (nơi định nghĩa `abort`).",
      code: { file: "nhip/includes/csrf.php", lang: "php", content: `<?php
declare(strict_types=1);

/**
 * Chống CSRF theo mẫu "đồng bộ token": mỗi phiên có một token bí mật. Mọi
 * biểu mẫu POST nhúng token đó; máy chủ chỉ chấp nhận yêu cầu mang đúng token.
 * Trang lạ không đọc được token (khác nguồn) nên không giả mạo được yêu cầu.
 */
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/** Ô ẩn nhúng vào mỗi biểu mẫu POST. */
function csrf_field(): string
{
    return '<input type="hidden" name="_token" value="' . e(csrf_token()) . '">';
}

/**
 * Chặn mọi POST không mang đúng token. Gọi ngay đầu bootstrap, sau khi mở phiên.
 * hash_equals so sánh thời gian cố định để không lộ token qua đo thời gian.
 */
function csrf_check(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }
    $sent = (string) ($_POST['_token'] ?? '');
    if ($sent === '' || !hash_equals(csrf_token(), $sent)) {
        abort(419, 'Phiên làm việc đã hết hạn hoặc yêu cầu không hợp lệ. Hãy tải lại trang và thử lại.');
    }
}` },
    },
    {
      section: "apply",
      title: "Nối vào bootstrap.php",
      body: "`csrf_check()` chạy ngay sau `start_session()`: phiên phải mở để đọc token, và phải chặn trước khi mọi trang xử lý POST.",
      code: { file: "nhip/includes/bootstrap.php", lang: "php", content: `<?php
declare(strict_types=1);

// Mọi trang chỉ cần require tệp này một lần.
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/posts.php';
require __DIR__ . '/users.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/follows.php';
require __DIR__ . '/uploads.php';
require __DIR__ . '/likes.php';
require __DIR__ . '/security.php';
require __DIR__ . '/csrf.php';

$config = require __DIR__ . '/config.php';
ini_set('display_errors', $config['debug'] ? '1' : '0');
error_reporting(E_ALL);

send_security_headers();
start_session();
csrf_check();` },
    },
    {
      section: "apply",
      title: "Nhúng token vào mọi biểu mẫu",
      body: "Thêm `<?= csrf_field() ?>` ngay sau mỗi thẻ `<form method=\"post\">` trong: `login.php`, `register.php`, `settings.php`, `index.php`, `post.php`, `edit.php`, `includes/post.php` (hai form: tim và xoá), `includes/header.php` (form đăng xuất). Biểu mẫu tìm kiếm dùng GET nên **không** thêm.",
      code: { file: "nhip/includes/header.php", lang: "php", content: `        <form method="post" action="logout.php" class="inline">
        <?= csrf_field() ?>
          <button type="submit" class="link">Đăng xuất</button>
        </form>` },
    },
    {
      section: "apply",
      title: "Vẽ lại ảnh trong uploads.php",
      body: "Thay bước `move_uploaded_file` bằng đọc–ghi qua GD. `match` chọn hàm đọc/ghi theo kiểu ảnh đã xác định từ `finfo`.",
      code: { file: "nhip/includes/uploads.php", lang: "php", content: `    // Vẽ lại ảnh bằng GD: đọc pixel rồi ghi ra tệp mới, bỏ mọi dữ liệu thừa
    // (mã giấu trong khối metadata) — ảnh "đa hợp" ảnh+PHP không sống sót bước này.
    $image = match ($mime) {
        'image/jpeg' => imagecreatefromjpeg($file['tmp_name']),
        'image/png'  => imagecreatefrompng($file['tmp_name']),
        'image/webp' => imagecreatefromwebp($file['tmp_name']),
    };
    if ($image === false) {
        throw new RuntimeException('Không đọc được ảnh.');
    }
    // Tên mới hoàn toàn ngẫu nhiên: không đoán được, không đè tệp khác, không mang đuôi lạ.
    $name = bin2hex(random_bytes(16)) . '.' . AVATAR_TYPES[$mime];
    $path = AVATAR_DIR . $name;
    $saved = match ($mime) {
        'image/jpeg' => imagejpeg($image, $path, 85),
        'image/png'  => imagepng($image, $path),
        'image/webp' => imagewebp($image, $path, 85),
    };
    imagedestroy($image);
    if (!$saved) {
        throw new RuntimeException('Không lưu được ảnh.');
    }
    return 'uploads/avatars/' . $name;` },
    },
    {
      section: "apply",
      title: "Kết quả: yêu cầu giả bị chặn",
      image: {
        src: "/image/coding/steps/s18-419.webp",
        alt: "Trang Nhịp hiện thông báo Phiên làm việc đã hết hạn hoặc yêu cầu không hợp lệ. Hãy tải lại trang và thử lại.",
        caption: "Gửi biểu mẫu POST với token sai (hoặc từ trang khác) → 419, không thao tác nào được thực hiện.",
      },
      body: `Tự kiểm bằng DevTools:

1. Mở Network, bấm Đăng — thấy \`_token\` trong payload.
2. Sửa giá trị \`_token\` của một biểu mẫu thành chuỗi bậy (DevTools → Elements) rồi gửi → trang **419**.
3. \`curl -d "id=3" http://localhost/nhip/delete.php\` (không token, giả lập trang lạ) → **419**, bài 3 còn nguyên.
4. Nhịp thật vẫn chạy đủ: đăng, sửa, xoá, tim, theo dõi — vì mọi biểu mẫu đã mang token.`,
    },
    {
      section: "apply",
      title: "Kết quả: ảnh đa hợp bị vô hiệu",
      body: `Tạo tệp thử:

~~~bash
cp anh.jpg poly.jpg
echo '<?php echo "PWNED"; ?>' >> poly.jpg
~~~

Tải \`poly.jpg\` làm ảnh đại diện. Sau đó mở tệp đã lưu trong \`uploads/avatars/\`:

~~~bash
grep -a PWNED uploads/avatars/<tên-tệp>.jpg   # không còn kết quả
~~~

GD đã vẽ lại ảnh từ pixel, đoạn \`<?php … ?>\` ở đuôi không được chép sang. Kết hợp với \`.htaccess\` cấm chạy \`.php\` (step 14), đường tấn công qua ảnh tải lên đã đóng hai lớp.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 18",
      body: `- [ ] Mọi biểu mẫu POST có \`_token\`; POST thiếu/sai token → 419.
- [ ] \`csrf_check()\` chạy một lần trong \`bootstrap.php\`, không trang nào tự kiểm.
- [ ] Token so bằng \`hash_equals\`; sinh bằng \`random_bytes\`.
- [ ] Thả tim qua fetch vẫn chạy (FormData mang token).
- [ ] Ảnh tải lên được GD vẽ lại; tệp đa hợp mất phần mã.
- [ ] Cookie phiên có HttpOnly + SameSite; ghi chú bật Secure ở hosting.
- [ ] \`SECURITY.md\` đánh dấu CSRF (A01) và tải tệp (A08) hoàn thành.`,
    },
  ],
  quiz: [
    { q: "CSRF khai thác điều gì của trình duyệt?", o: ["JavaScript chạy chậm", "Cookie tự động được gửi kèm mọi yêu cầu tới đích, bất kể ai khởi phát", "Bộ nhớ đệm", "HTML5"], a: 1, why: "Trang lạ không đọc được gì nhưng kích hoạt được hành động nhờ cookie tự đi theo." },
    { q: "Token CSRF chống được CSRF vì sao?", o: ["Nó mã hoá dữ liệu", "Trang khác nguồn không đọc được token nên không điền đúng vào biểu mẫu giả", "Nó chặn cookie", "Nó nhanh hơn"], a: 1, why: "Chỉ trang Nhịp thật nhúng được token đúng." },
    { kind: "truefalse", q: "Có SameSite=Lax rồi thì không cần token CSRF nữa.", a: false, why: "Phòng thủ nhiều lớp: trình duyệt cũ, cấu hình đổi nhầm… token là lớp độc lập." },
    { q: "Vì sao dùng hash_equals thay cho === khi so token?", o: ["Nhanh hơn", "So thời gian cố định, không lộ số ký tự đầu đã đúng qua đo thời gian", "Bắt buộc của PHP", "Hỗ trợ tiếng Việt"], a: 1, why: "=== dừng ở ký tự khác đầu tiên, rò rỉ thông tin thời gian." },
    { kind: "multi", q: "Biểu mẫu nào của Nhịp cần nhúng csrf_field()?", o: ["Đăng bài (POST)", "Đăng xuất (POST)", "Tìm kiếm (GET)", "Thả tim (POST qua fetch)"], a: [0, 1, 3], why: "GET không đổi dữ liệu nên không cần; mọi POST đều cần." },
    { kind: "bug", q: "Dòng nào khiến chốt chặn CSRF bỏ sót?", lines: ["function csrf_check(): void {", "  if ($_SERVER['REQUEST_METHOD'] === 'GET') return;", "  $sent = (string)($_POST['_token'] ?? '');", "  if (!hash_equals(csrf_token(), $sent)) abort(419, '...');", "}"], a: 1, why: "Chỉ bỏ qua GET là chưa đủ — PUT/DELETE/HEAD… cũng lọt; nên kiểm 'khác POST thì bỏ qua' hoặc chỉ chạy khi là POST." },
    { q: "Vẽ lại ảnh bằng GD chặn được gì mà finfo không chặn?", o: ["Ảnh quá lớn", "Tệp vừa là ảnh hợp lệ vừa chứa mã giấu ở metadata", "Ảnh sai định dạng", "Ảnh trùng tên"], a: 1, why: "GD chỉ chép pixel sang tệp mới, bỏ mọi khối dữ liệu lạ." },
    { kind: "blank", q: "Điền hàm sinh token ngẫu nhiên an toàn mật mã.", code: "$_SESSION['csrf'] = bin2hex(___________(32));", a: "random_bytes", why: "random_bytes là nguồn ngẫu nhiên an toàn mật mã của PHP." },
    { q: "Cờ cookie Secure nên đặt thế nào trên localhost (HTTP)?", o: ["true", "false — vì localhost chưa có HTTPS, bật sẽ mất cookie", "Không đặt", "Chỉ cho admin"], a: 1, why: "Secure khiến cookie chỉ gửi qua HTTPS; bật ở hosting (step 24)." },
    { q: "Nút tim gửi bằng fetch vẫn mang token nhờ đâu?", o: ["app.js tự thêm", "FormData gói cả ô ẩn _token trong form bọc nút", "Cookie mang token", "URL chứa token"], a: 1, why: "Nút nằm trong <form> có csrf_field(); FormData thu mọi input." },
  ],
};
