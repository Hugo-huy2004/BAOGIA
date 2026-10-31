export default {
  id: "step17",
  lang: "php",
  file: "nhip/includes/security.php",
  duration: "180 phút",
  summary: "Hiểu và phòng chống hai lỗ hổng tiêm nhiễm phổ biến nhất: SQL Injection và XSS. Tấn công thử trên bản Nhịp cố ý có lỗi trong phòng thí nghiệm localhost, rồi xác nhận prepared statement, e() và Content-Security-Policy đã chặn chúng trong bản thật.",
  slides: [
    {
      section: "intro",
      title: "Vì sao phải tự tấn công mình",
      body: `Bạn đã viết Nhịp đúng cách từ đầu: prepared statement (step 11), \`e()\` (step 8). Nhưng "tin là an toàn" khác với "biết là an toàn". Cách duy nhất để chắc một bản vá hoạt động là **tái hiện đúng đòn tấn công mà nó phải chặn**.

Step này làm điều đó một cách có kiểm soát: trong thư mục \`lab/\` (chỉ mở từ localhost, step 16) có ba bản sao **cố ý viết sai** của tính năng Nhịp. Bạn tấn công chúng để thấy lỗ hổng là **thật**, rồi đối chiếu với bản thật để thấy nó an toàn, và cuối cùng thêm một lớp phòng thủ nữa.

Toàn bộ chỉ chạy trên máy bạn, với dữ liệu mẫu của bạn — đó là điều kiện đạo đức và pháp luật ở step 16.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Giải thích **tiêm nhiễm** (injection): dữ liệu bị diễn giải thành lệnh.
2. Tái hiện **SQL Injection**: lấy dữ liệu bằng \`UNION\`, vượt qua đăng nhập — trên bản lab.
3. Xác nhận **prepared statement** của Nhịp miễn nhiễm, và hiểu vì sao.
4. Tái hiện **XSS lưu trữ**: nội dung người dùng chạy như mã trong trình duyệt người khác.
5. Xác nhận \`e()\` (htmlspecialchars) chặn XSS, và thêm **Content-Security-Policy** làm lớp thứ hai.
6. Thêm \`X-Content-Type-Options\`, \`Referrer-Policy\`; đánh dấu A05 và một phần A01/A07 trong \`SECURITY.md\`.`,
    },
    {
      section: "visual",
      title: "Tiêm nhiễm: khi dữ liệu thành lệnh",
      visual: "injection-concept",
      body: `Mọi lỗ hổng tiêm nhiễm có chung một hình: dữ liệu người dùng được **ghép thẳng** vào một chuỗi mà sau đó được **một bộ diễn giải** đọc — cơ sở dữ liệu đọc SQL, trình duyệt đọc HTML/JavaScript.

Nếu ranh giới giữa "lệnh của lập trình viên" và "dữ liệu của người dùng" bị xoá, kẻ tấn công viết dữ liệu sao cho phần của họ **băng qua ranh giới** và trở thành lệnh.

Cách chữa gốc luôn giống nhau: **giữ dữ liệu và lệnh ở hai kênh tách biệt** — tham số hoá với SQL, mã hoá đầu ra với HTML. "Lọc ký tự xấu" chỉ là vá ngọn.`,
    },
    {
      section: "visual",
      title: "SQL Injection trông thế nào",
      visual: "sqli-anatomy",
      body: `Bản lab tìm kiếm ghép chuỗi:

~~~php
$sql = "SELECT id, body FROM posts WHERE body LIKE '%$q%'";
~~~

Người dùng gõ \`q\` bình thường thì không sao. Nhưng gõ một dấu nháy đơn, câu lệnh **gãy** đúng chỗ đó: phần sau dấu nháy không còn là nội dung tìm kiếm mà trở thành **SQL**. Thêm \`UNION SELECT\` là nối kết quả của một truy vấn khác vào; thêm \`-- \` (hai gạch và dấu cách) là **chú thích hoá** phần còn lại của câu gốc.`,
    },
    {
      section: "research",
      title: "Injection theo OWASP",
      body: `Trong OWASP Top 10:2025, **A05 Injection** là một trong những nhóm được kiểm nhiều nhất (100% ứng dụng) và có **nhiều CVE nhất** mọi nhóm — gồm XSS (tần suất cao, tác động thấp, hơn 30 nghìn CVE) và SQL Injection (tần suất thấp, tác động cao, hơn 14 nghìn CVE).

OWASP định nghĩa: ứng dụng dính lỗi khi *dữ liệu người dùng không được kiểm/lọc* và *truy vấn động không tham số hoá được đưa thẳng vào bộ diễn giải*. Biện pháp số một vẫn là **truy vấn tham số hoá**.

> OWASP Foundation (2025) *A05:2025 – Injection*, OWASP Top 10:2025. Available at: https://top10.owasp.org/2025/A05_2025-Injection/
>
> OWASP Foundation (2025) *SQL Injection Prevention Cheat Sheet*; *Cross Site Scripting Prevention Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/`,
    },
    {
      section: "research",
      title: "Nguồn gốc và chuẩn phòng thủ",
      body: `Thuật ngữ *SQL injection* được mô tả công khai lần đầu năm 1998 (Rain Forest Puppy, *Phrack* 54). *Cross-site scripting* được CERT cảnh báo năm 2000. Hơn hai thập kỷ sau chúng vẫn đứng đầu danh sách — không phải vì khó chữa, mà vì mỗi lập trình viên mới lại lặp lại cùng sai lầm ghép chuỗi.

Content-Security-Policy, lớp phòng thủ chiều sâu cho XSS, được W3C chuẩn hoá (CSP Level 3) và mọi trình duyệt hiện đại hỗ trợ.

> Howard, M. and LeBlanc, D. (2003) *Writing Secure Code*. 2nd edn. Redmond: Microsoft Press.
>
> West, M. (2024) *Content Security Policy Level 3*, W3C Working Draft. Available at: https://www.w3.org/TR/CSP3/`,
    },
    {
      section: "ideate",
      title: "Quy trình của phòng thí nghiệm",
      body: `Với mỗi lỗ hổng, đi đúng ba bước:

1. **Tấn công bản lab** (\`lab/*.php\`, cố ý sai) → thấy đòn tấn công thành công, hiểu nó hoạt động ra sao.
2. **Lặp đúng đòn đó trên bản thật** (\`search.php\`, \`login.php\`, \`index.php\`) → thấy nó thất bại.
3. **Giải thích vì sao** bản thật an toàn, rồi thêm một lớp phòng thủ nữa nếu có.

Thư mục \`lab/\` có \`.htaccess\` chứa \`Require local\`: chỉ máy bạn mở được, không ai từ mạng vào được. Xong step này, **xoá cả thư mục \`lab/\`** — mã có lỗ hổng không bao giờ sống chung với mã thật.`,
    },
    {
      section: "core",
      title: "Đòn 1 — UNION lấy dữ liệu ẩn",
      image: {
        src: "/image/coding/steps/s17-sqli-union.webp",
        alt: "Trang lab tìm kiếm: ô nhập chứa zzz' UNION SELECT username, password_hash FROM users --, khung tối hiện câu SQL ghép lại, bảng kết quả liệt kê username và chuỗi băm $2y$ của từng tài khoản",
        caption: "lab/search-unsafe.php — truy vấn tìm bài bị biến thành truy vấn lấy toàn bộ băm mật khẩu.",
      },
      body: `Trên **bản lab**, nhập vào ô tìm kiếm:

~~~text
zzz' UNION SELECT username, password_hash FROM users --
~~~

Câu SQL thực sự chạy trở thành: tìm bài có chữ \`zzz\` (không có) **UNION** danh sách tên người dùng và băm mật khẩu. \`UNION\` nối được vì truy vấn gốc trả đúng **hai** cột. Kết quả: toàn bộ bảng \`users\` hiện ra trên trang tìm kiếm.

Đây là lý do băm mật khẩu phải mạnh (step 12): kể cả khi bảng bị lấy trộm, bcrypt khiến việc dò ra mật khẩu gốc tốn hàng chục năm. Nhưng tốt nhất là **đừng để bị lấy**.`,
    },
    {
      section: "core",
      title: "Đòn 2 — bỏ qua đăng nhập",
      image: {
        src: "/image/coding/steps/s17-login-bypass.webp",
        alt: "Trang lab đăng nhập: ô tên người dùng chứa lan.code' --, mật khẩu là bất kỳ, câu SQL ghép lại bị chú thích hoá phần kiểm mật khẩu, băng đỏ ghi Đã vào tài khoản: lan.code",
        caption: "lab/login-unsafe.php — vào được tài khoản lan.code mà không cần biết mật khẩu.",
      },
      body: `Bản lab đăng nhập kiểm mật khẩu **ngay trong SQL** bằng ghép chuỗi. Nhập tên người dùng:

~~~text
lan.code' --
~~~

và mật khẩu bất kỳ. Phần \`-- \` biến đoạn \`AND password_hash = '…'\` thành chú thích, nên câu lệnh chỉ còn \`WHERE username = 'lan.code'\` — trả về Lan, "đăng nhập" thành công.

Đây là một dạng **A07 Authentication Failures** chồng lên **A05 Injection**. Nhịp thật không bao giờ so mật khẩu trong SQL: nó lấy băm ra rồi dùng \`password_verify\` trong PHP (step 12).`,
    },
    {
      section: "core",
      title: "Vì sao bản thật miễn nhiễm",
      image: {
        src: "/image/coding/steps/s17-sqli-safe.webp",
        alt: "Trang tìm kiếm thật của Nhịp với cùng chuỗi tấn công trong ô, kết quả: 0 kết quả cho zzz' UNION SELECT username, password_hash FROM users --",
        caption: "search.php (thật) với đúng chuỗi tấn công: nó được coi là văn bản cần tìm, ra 0 kết quả.",
      },
      body: `Dán **đúng chuỗi tấn công** vào \`search.php\` thật: không có băm nào lộ, chỉ "0 kết quả". Vì:

~~~php
$stmt = db()->prepare('… WHERE p.body LIKE :pattern');
$stmt->bindValue(':pattern', '%' . $query . '%');
~~~

Câu lệnh được gửi tới MySQL **trước**, có chỗ trống \`:pattern\`. Khi dữ liệu tới sau, MySQL coi **toàn bộ** chuỗi — kể cả \`' UNION SELECT …\` — là **một giá trị** để so trong \`LIKE\`, không phải SQL. Khuôn lệnh đã cố định, dữ liệu không thể băng qua ranh giới (step 11).

Đó là cách chữa gốc: không phải "chặn chữ UNION", mà **tách kênh lệnh khỏi kênh dữ liệu**.`,
    },
    {
      section: "core",
      title: "Đòn 3 — XSS lưu trữ",
      image: {
        src: "/image/coding/steps/s17-xss-unsafe.webp",
        alt: "Trang lab bảng tin nền hồng, tiêu đề đã bị đổi thành Nhịp đã bị chiếm quyền!, bài của hoa.test chỉ còn chữ Ảnh đẹp nè và một icon ảnh hỏng",
        caption: "lab/feed-unsafe.php in body không qua e(): đoạn mã trong bài đã chạy, đổi tiêu đề và nền trang.",
      },
      body: `Đăng một bài **bình thường** qua Nhịp thật với nội dung:

~~~text
Ảnh đẹp nè <img src=x onerror="…đổi tiêu đề, đổi nền…">
~~~

Bài này lưu nguyên văn vào cơ sở dữ liệu (đúng, đó là nội dung người dùng). Nhưng \`lab/feed-unsafe.php\` in \`body\` **không qua \`e()\`**. Trình duyệt thấy \`<img>\` hỏng, chạy \`onerror\` — mã của kẻ tấn công thực thi trong phiên của **mọi** người xem bảng tin.

Gọi là **lưu trữ** (stored/persistent) vì mã nằm sẵn trong cơ sở dữ liệu, tự chạy với từng người mở trang — nguy hiểm hơn hẳn loại chỉ ảnh hưởng một đường link.`,
    },
    {
      section: "core",
      title: "Lớp 1 — e() ở bản thật",
      image: {
        src: "/image/coding/steps/s17-xss-safe.webp",
        alt: "Bảng tin thật của Nhịp: bài của Hoa hiện nguyên văn chuỗi Ảnh đẹp nè <img src=x onerror=...> như chữ thường, không có gì chạy, nền trắng bình thường",
        caption: "index.php (thật) hiện đúng bài đó: toàn bộ thẻ hiện ra như văn bản, không chạy.",
      },
      body: `Mở cùng bài đó trên bảng tin **thật**: nó hiện **nguyên văn** chuỗi \`<img src=x onerror=…>\` như chữ bình thường, không có gì xảy ra. Vì \`includes/post.php\` in qua \`e()\`:

~~~php
<p class="post-text"><?= e($post['body']) ?></p>
~~~

\`htmlspecialchars\` đổi \`<\` thành \`&lt;\`, \`"\` thành \`&quot;\`… nên trình duyệt hiểu đây là **văn bản cần hiển thị**, không phải thẻ cần dựng. Đây là **mã hoá đầu ra** — tách kênh một lần nữa, lần này ở ranh giới PHP → HTML.`,
    },
    {
      section: "core",
      title: "Lớp 2 — Content-Security-Policy",
      image: {
        src: "/image/coding/steps/s17-xss-csp.webp",
        alt: "Trang lab bảng tin sau khi bật CSP: nền trắng lại, tiêu đề vẫn là Lab bảng tin quên e(), bài của hoa.test chỉ còn chữ và icon ảnh hỏng — mã onerror không chạy",
        caption: "Cùng trang lab sau khi thêm CSP: Console báo 'The action has been blocked', tiêu đề và nền không đổi nữa.",
      },
      body: `Con người quên. Một ngày nào đó ai đó thêm một chỗ in thiếu \`e()\`. Lớp phòng thủ chiều sâu: **Content-Security-Policy** — một tiêu đề HTTP bảo trình duyệt *"chỉ chạy script từ chính miền này, cấm mọi mã viết trong HTML"*.

~~~php
header("Content-Security-Policy: default-src 'self'; script-src 'self'; "
    . "img-src 'self' data:; object-src 'none'; frame-ancestors 'none'");
~~~

Giờ dù \`feed-unsafe.php\` vẫn in thiếu \`e()\`, \`onerror=\` **không chạy** — DevTools → Console ghi *"inline event handler violates… Content Security Policy"*. Để CSP chặt được như vậy, Nhịp **không** có \`<script>\` hay \`style=\` viết lẫn trong HTML — toàn bộ nằm trong \`js/app.js\` và \`css/style.css\` (lý do ở step 13).`,
    },
    {
      section: "core",
      title: "Thêm hai tiêu đề nữa",
      body: `~~~php
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
~~~

- \`nosniff\`: cấm trình duyệt **đoán** kiểu tệp. Nếu kẻ tấn công lừa được một tệp \`.txt\` chứa HTML, trình duyệt sẽ không "tốt bụng" hiển thị nó như HTML — chặn một đường XSS qua tệp tải lên.
- \`Referrer-Policy\`: không gửi địa chỉ đầy đủ (có thể chứa \`?id=\`, token) sang trang khác khi người dùng bấm link ra ngoài — giảm rò rỉ thông tin (A01).

Cả ba gom vào \`send_security_headers()\`, gọi một lần trong \`bootstrap.php\` **trước** \`session_start()\` (tiêu đề phải đi trước nội dung).`,
    },
    {
      section: "core",
      title: "Những \"bản vá\" KHÔNG dùng",
      body: `Các cách sai mà người mới hay thử:

- **Chặn từ khoá** (\`UNION\`, \`SELECT\`, \`<script>\`): kẻ tấn công lách bằng viết hoa xen kẽ, mã hoá, khoảng trắng lạ. Danh sách đen luôn thiếu.
- **\`addslashes\` thủ công**: bỏ sót nhiều trường hợp, còn hỏng với một số bảng mã. Prepared statement làm đúng và gọn hơn.
- **\`mysql_real_escape_string\`**: thuộc API \`mysql_*\` đã **bị xoá** khỏi PHP 7.
- **Chỉ kiểm ở JavaScript**: vượt qua trong một giây bằng \`curl\`.
- **\`htmlspecialchars\` lúc LƯU**: sai thời điểm. Mã hoá khi **in ra** (output), không phải khi nhận vào — cùng một dữ liệu có thể in ra HTML, JSON, hay email, mỗi nơi mã hoá kiểu khác.

Quy tắc: **tham số hoá khi nói với cơ sở dữ liệu, mã hoá khi in ra ngữ cảnh đích.**`,
    },
    {
      section: "apply",
      title: "includes/security.php",
      body: "Tạo tệp mới, thêm `require` vào `bootstrap.php` và gọi `send_security_headers()` ngay trước `start_session()`.",
      code: { file: "nhip/includes/security.php", lang: "php", content: `<?php
declare(strict_types=1);

/**
 * Tiêu đề bảo mật gửi kèm MỌI trang. Content-Security-Policy là lớp thứ hai
 * chống XSS: dù một chỗ nào đó quên e(), trình duyệt vẫn từ chối chạy mã
 * viết trong HTML (thẻ <script> nội tuyến, onerror=, onclick=…).
 */
function send_security_headers(): void
{
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; "
        . "img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    header('X-Content-Type-Options: nosniff');            // không đoán kiểu tệp
    header('Referrer-Policy: strict-origin-when-cross-origin');
}` },
    },
    {
      section: "apply",
      title: "Nối vào bootstrap.php",
      body: "Thứ tự quan trọng: tiêu đề HTTP phải gửi trước khi trang in ký tự đầu tiên, và trước `start_session()` (hàm này cũng gửi tiêu đề `Set-Cookie`).",
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

$config = require __DIR__ . '/config.php';
ini_set('display_errors', $config['debug'] ? '1' : '0');
error_reporting(E_ALL);

send_security_headers();
start_session();` },
    },
    {
      section: "apply",
      title: "Tự tấn công theo danh sách",
      body: `Làm lần lượt trên máy bạn (bản lab trước, bản thật sau):

1. \`lab/search-unsafe.php?q=\` + \`' UNION SELECT username, password_hash FROM users -- \` → lấy được băm. Rồi dán vào \`search.php\` thật → 0 kết quả.
2. \`lab/login-unsafe.php\` với tên \`lan.code' -- \` → vào được. Thử đúng kiểu đó ở \`login.php\` thật → "Tên đăng nhập hoặc mật khẩu không đúng".
3. Đăng một bài có \`<img src=x onerror=…>\` qua Nhịp thật. Xem ở \`index.php\` thật → hiện nguyên văn. Xem ở \`lab/feed-unsafe.php\` → mã chạy. Thêm CSP → mở lại lab → mã bị chặn (xem Console).`,
    },
    {
      section: "apply",
      title: "Dọn phòng thí nghiệm",
      body: `Xong rồi thì **xoá dấu vết**:

1. Xoá cả thư mục \`nhip/lab/\`.
2. Xoá các khối CSS \`.lab-*\` trong \`style.css\` (đánh dấu "chỉ dùng ở step 17").
3. Trong phpMyAdmin, xoá bài chứa \`<img src=x onerror…>\` bạn vừa đăng để thử.
4. Trong \`SECURITY.md\`, đánh dấu **A05 Injection** đã xử lý, và ghi rõ: SQL Injection chặn bằng prepared statement, XSS chặn bằng \`e()\` + CSP.

Mã có lỗ hổng không được còn sót lại, không được đưa lên Git (step 20) hay hosting (step 24).`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 17",
      body: `- [ ] Tái hiện được cả ba đòn trên bản lab và giải thích từng câu SQL/HTML bị biến đổi.
- [ ] Đúng các đòn đó thất bại trên bản thật; giải thích được vì sao (tách kênh lệnh/dữ liệu).
- [ ] Nhịp gửi \`Content-Security-Policy\`, \`X-Content-Type-Options\`, \`Referrer-Policy\` (kiểm bằng \`curl -I\` hoặc DevTools).
- [ ] Nhịp thật vẫn chạy đủ dưới CSP: thả tim, trả lời, đổi tab — Console không báo vi phạm CSP.
- [ ] Thư mục \`lab/\` và CSS \`.lab-*\` đã bị xoá; bài thử XSS đã xoá.
- [ ] \`SECURITY.md\` đánh dấu A05 hoàn thành.`,
    },
  ],
  quiz: [
    { q: "Nguyên nhân gốc của mọi lỗ hổng tiêm nhiễm là gì?", o: ["Người dùng gõ ký tự lạ", "Dữ liệu người dùng bị ghép vào chuỗi rồi được một bộ diễn giải đọc như lệnh", "Máy chủ chạy chậm", "Thiếu HTTPS"], a: 1, why: "Ranh giới giữa lệnh và dữ liệu bị xoá; cách chữa là tách lại hai kênh." },
    { kind: "output", q: "Câu gốc là SELECT id FROM posts WHERE body LIKE '%$q%'. Với $q = ' UNION SELECT password_hash FROM users -- thì chuyện gì xảy ra?", code: "SELECT id FROM posts\nWHERE body LIKE '%' UNION SELECT password_hash FROM users -- %'", o: ["Báo lỗi cú pháp", "Trả về cả băm mật khẩu của mọi người dùng", "Trả 0 dòng", "Xoá bảng posts"], a: 1, why: "UNION nối kết quả truy vấn thứ hai; -- chú thích hoá phần đuôi." },
    { q: "Vì sao prepared statement chặn được SQL Injection?", o: ["Nó lọc chữ UNION", "Khuôn lệnh gửi trước, dữ liệu tới sau chỉ là giá trị, không thể thành lệnh", "Nó mã hoá mật khẩu", "Nó chạy nhanh hơn"], a: 1, why: "Tách kênh lệnh khỏi kênh dữ liệu ngay từ gốc." },
    { kind: "truefalse", q: "Chặn các từ khoá như UNION, SELECT là cách phòng SQL Injection đáng tin.", a: false, why: "Danh sách đen luôn thiếu; kẻ tấn công lách bằng viết hoa xen kẽ, mã hoá… Dùng tham số hoá." },
    { q: "XSS lưu trữ khác XSS phản xạ ở chỗ nào?", o: ["Nhanh hơn", "Mã nằm sẵn trong cơ sở dữ liệu và tự chạy với mọi người xem", "Chỉ ảnh hưởng kẻ tấn công", "Không cần JavaScript"], a: 1, why: "Mã lưu lại nên tấn công mọi người mở trang, nguy hiểm hơn loại qua một link." },
    { q: "e() (htmlspecialchars) chống XSS bằng cách nào?", o: ["Xoá thẻ HTML", "Đổi < > \" thành thực thể để trình duyệt hiểu là văn bản, không phải thẻ", "Chặn JavaScript", "Mã hoá cơ sở dữ liệu"], a: 1, why: "Mã hoá đầu ra ở ranh giới PHP → HTML." },
    { kind: "multi", q: "Content-Security-Policy với script-src 'self' chặn được gì?", o: ["Thẻ <script> nội tuyến trong HTML", "Thuộc tính onerror=, onclick=", "Script tải từ miền lạ", "Prepared statement"], a: [0, 1, 2], why: "CSP chỉ cho chạy script từ chính miền, cấm mã viết lẫn trong HTML — không liên quan tới SQL." },
    { q: "Nên mã hoá dữ liệu bằng htmlspecialchars vào lúc nào?", o: ["Khi nhận vào, trước khi lưu", "Khi in ra HTML (output)", "Khi tạo cơ sở dữ liệu", "Không cần"], a: 1, why: "Cùng dữ liệu có thể in ra HTML, JSON, email — mỗi ngữ cảnh mã hoá khác; mã hoá đúng nơi in ra." },
    { kind: "bug", q: "Dòng nào mở đường cho XSS lưu trữ?", lines: ["<article class=\"post\">", "  <strong>@<?= e($post['username']) ?></strong>", "  <p><?= $post['body'] ?></p>", "</article>"], a: 2, why: "body in thẳng không qua e(); phải là <?= e($post['body']) ?>." },
    { kind: "blank", q: "Điền tiêu đề cấm trình duyệt đoán kiểu tệp.", code: "header('X-Content-Type-Options: ________');", a: "nosniff", why: "nosniff chặn một đường XSS qua tệp bị hiểu nhầm thành HTML." },
  ],
};
