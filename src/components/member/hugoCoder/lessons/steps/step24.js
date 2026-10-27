export default {
  id: "step24",
  lang: "md",
  file: "nhip/DEPLOY.md",
  duration: "150 phút",
  summary: "Đưa Nhịp ra Internet miễn phí: chọn hosting PHP+MySQL, chuẩn hoá cấu hình production (debug off, cookie Secure, HTTPS), tạo cơ sở dữ liệu từ xa, tải mã qua FTP với web root là public/, và kiểm thử sau triển khai.",
  slides: [
    {
      section: "intro",
      title: "Từ localhost ra thế giới",
      body: `Nhịp đã hoàn chỉnh trên máy bạn. Nhưng "chạy trên localhost" nghĩa là **chỉ bạn** dùng được. Step này đưa Nhịp lên một máy chủ thật trên Internet để **bất kỳ ai** cũng mở được bằng một đường link.

Triển khai không chỉ là "chép tệp lên". Môi trường production khác localhost ở ba điểm sống còn: **cấu hình** (host cơ sở dữ liệu khác, mật khẩu thật), **bảo mật** (debug tắt, HTTPS, cookie Secure), và **giới hạn** (tài nguyên hosting có hạn). Làm sai một trong ba là lộ bí mật hoặc sập site.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu khác biệt **localhost vs production** và những gì phải đổi.
2. Chọn hosting **PHP + MySQL** miễn phí phù hợp học tập.
3. Chuẩn hoá cấu hình production: \`debug = false\`, cookie **Secure**, **HTTPS**.
4. Tạo cơ sở dữ liệu từ xa và nạp \`schema.sql\` qua phpMyAdmin của hosting.
5. Tải mã qua **FTP**, đặt web root là \`public/\`, giữ \`config.php\`/\`src\` ngoài vùng công khai.
6. **Kiểm thử sau triển khai** theo một danh sách cố định.`,
    },
    {
      section: "visual",
      title: "localhost khác production",
      visual: "deploy-diff",
      body: `| | localhost | production |
|---|---|---|
| Địa chỉ | \`localhost\` | tên miền thật, **HTTPS** |
| Host CSDL | \`127.0.0.1\` | máy chủ CSDL riêng của hosting |
| Mật khẩu CSDL | rỗng (root) | mật khẩu mạnh thật |
| \`debug\` | \`true\` (xem lỗi) | **\`false\`** (giấu lỗi) |
| Cookie \`Secure\` | \`false\` (HTTP) | **\`true\`** (chỉ HTTPS) |
| \`X-Powered-By\` | hiện | tắt (\`expose_php\`) |

Mọi khác biệt này nằm trong **một tệp cấu hình** (\`config.php\`) và vài tiêu đề — đó là lý do ngay từ step 11 Nhịp tách cấu hình ra riêng.`,
    },
    {
      section: "visual",
      title: "Web root chỉ là public/",
      visual: "deploy-layout",
      body: `Trên hosting chia sẻ, thư mục được phục vụ công khai thường tên **\`htdocs/\`** hoặc **\`public_html/\`**. Quy tắc (step 20):

- Nội dung **\`public/\`** của Nhịp → vào thư mục web root của hosting.
- **\`src/\`, \`config.php\`, \`database/\`** → vào thư mục **cha** (ngoài web root).

Nếu hosting không cho đặt tệp ngoài web root, đặt chúng trong một thư mục con và chặn bằng \`.htaccess\` (\`Require all denied\`). Mục tiêu bất biến: **trình duyệt không bao giờ tải được \`config.php\`.**`,
    },
    {
      section: "research",
      title: "Hosting miễn phí và HTTPS",
      body: `Có nhiều hosting PHP+MySQL miễn phí (InfinityFree, AwardSpace, 000webhost…). Chúng chạy trên **cPanel** hoặc bảng điều khiển tương tự, cung cấp FTP, phpMyAdmin và chứng chỉ **SSL miễn phí** từ **Let's Encrypt** — tổ chức phi lợi nhuận cấp chứng chỉ TLS tự động, miễn phí, đã phổ cập HTTPS cho hàng trăm triệu website.

HTTPS không còn là tuỳ chọn: nó mã hoá đường truyền (chống nghe lén mật khẩu, cookie phiên — Spoofing trong STRIDE, step 16), và là điều kiện để cờ cookie \`Secure\` hoạt động.

> Internet Security Research Group (2025) *Let's Encrypt — How It Works*. Available at: https://letsencrypt.org/how-it-works/
>
> Mozilla (2025) *Transport Layer Security (TLS)*, MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security`,
    },
    {
      section: "research",
      title: "Cấu hình production an toàn",
      body: `Tài liệu bảo mật của PHP khuyến nghị cho máy chủ công khai: **tắt \`display_errors\`** (lỗi vào log, không ra trình duyệt), tắt **\`expose_php\`** (ẩn phiên bản PHP khỏi tiêu đề), và dùng HTTPS cho mọi dữ liệu nhạy cảm. Để lộ lỗi chi tiết là một dạng **A02 Security Misconfiguration** và **A10 Mishandling of Exceptional Conditions** (OWASP Top 10:2025) — Nhịp đã xử lý bằng \`debug = false\` + trình xử lý lỗi (step 19).

> The PHP Group (2025) *PHP Manual: Error Handling and Security; php.ini directives (display_errors, expose_php)*. Available at: https://www.php.net/manual/en/security.errors.php
>
> OWASP Foundation (2025) *A02:2025 – Security Misconfiguration*. Available at: https://top10.owasp.org/2025/`,
    },
    {
      section: "ideate",
      title: "Danh sách trước khi lên",
      body: `Làm **trên máy** trước khi đụng tới hosting:

- [ ] Chạy lại \`database/schema.sql\` trên CSDL trống — chắc nó đủ và đúng.
- [ ] Xoá thư mục \`lab/\` (mã có lỗ hổng, step 17).
- [ ] \`config.php\`: \`'debug' => false\`.
- [ ] \`src/auth.php\`: cookie \`'secure' => true\`.
- [ ] Sao lưu CSDL localhost (phpMyAdmin → Export) để có bản gốc.

Mọi thứ vào \`DEPLOY.md\` — tài liệu triển khai của dự án, để lần sau (và người khác) làm lại không cần nhớ.`,
    },
    {
      section: "core",
      title: "Bước 1 · Tạo tài khoản và website",
      image: {
        src: "/image/coding/steps/s24-host-home.webp",
        alt: "Trang chủ InfinityFree: Free Website Hosting, Host your website with PHP, MySQL and free SSL certificates, nút Create Free Account, No credit card required Free forever not a trial",
        caption: "infinityfree.com — hosting PHP + MySQL + SSL miễn phí, chỉ cần email. Ảnh chụp 27/10/2026.",
      },
      body: `1. Đăng ký (chỉ email, không thẻ).
2. Tạo một website với **tên miền phụ miễn phí** (ví dụ \`nhip.infinityfreeapp.com\`), hoặc gắn tên miền riêng nếu có.
3. Bật **SSL miễn phí** cho tên miền — có thể mất vài phút tới vài giờ để cấp chứng chỉ.

Các hosting khác (AwardSpace, 000webhost…) quy trình tương tự: tạo tài khoản → tạo site → bật SSL.`,
    },
    {
      section: "core",
      title: "Bước 2 · Cơ sở dữ liệu từ xa",
      body: `Trong bảng điều khiển → **MySQL Databases** → tạo một CSDL. Ghi lại **bốn** thông tin:

- **Host** — ví dụ \`sql123.infinityfree.com\`. **Không** phải \`127.0.0.1\`! Đây là khác biệt khiến nhiều người mới kẹt.
- **Tên CSDL** — thường có tiền tố, ví dụ \`if0_12345_nhip\`.
- **User** và **Mật khẩu**.

Mở **phpMyAdmin của hosting** → chọn CSDL → tab **Import** → tải lên \`database/schema.sql\`. Dữ liệu mẫu (\`seed.sql\`) tuỳ chọn. Đây đúng là thao tác Import bạn đã làm ở localhost (step 10), chỉ khác máy chủ.`,
    },
    {
      section: "core",
      title: "Bước 3 · Tải mã qua FTP",
      body: `Lấy thông tin **FTP** trong bảng điều khiển (host, user, mật khẩu) và dùng một ứng dụng FTP (FileZilla) hoặc **File Manager** trên web.

1. Web root của hosting (\`htdocs/\` hoặc \`public_html/\`): tải **nội dung thư mục \`public/\`** vào đây — \`index.php\`, \`.htaccess\`, \`css/\`, \`js/\`, \`img/\`, \`uploads/\`.
2. Thư mục **cha** của web root: tải \`src/\`, \`config.php\`, \`database/\`.
3. Chắc thư mục \`uploads/avatars/\` tồn tại và **ghi được** (quyền 755).

Nếu hosting **không** cho ra ngoài web root: đặt \`src/\`, \`config.php\` vào một thư mục con trong web root và thêm \`.htaccess\` chứa \`Require all denied\` vào đó.`,
    },
    {
      section: "core",
      title: "Bước 4 · config.php production",
      body: `Sửa \`config.php\` **trên hosting** bằng thông tin CSDL vừa tạo:

~~~php
return [
    'db_host' => 'sql123.infinityfree.com',   // host CSDL hosting
    'db_name' => 'if0_12345_nhip',
    'db_user' => 'if0_12345',
    'db_pass' => '••••••••',
    'debug'   => false,                        // QUAN TRỌNG: tắt trên production
];
~~~

\`config.php\` không đi theo Git (\`.gitignore\`, step 20) nên bản production là riêng — bạn điền trực tiếp trên hosting. Lỗi \`[1045] Access denied\` hay \`[2002] Connection refused\` (step 11) thường do sai host/mật khẩu ở đây.`,
    },
    {
      section: "core",
      title: "Bước 5 · Bật cờ Secure và HTTPS",
      body: `Trong \`src/auth.php\`, cookie phiên bật \`Secure\` để **chỉ** gửi qua HTTPS:

~~~php
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => true,     // production có HTTPS → bật
]);
~~~

Lưu ý: nếu bật \`secure\` mà truy cập qua **HTTP** (chưa có SSL), trình duyệt bỏ cookie → **không đăng nhập được**. Vì vậy chỉ bật sau khi SSL đã hoạt động, và nên **ép chuyển HTTP → HTTPS** bằng \`.htaccess\`:

~~~apache
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
~~~`,
    },
    {
      section: "core",
      title: "Kiểm thử sau triển khai",
      body: `Chạy đúng danh sách này mỗi lần deploy:

- [ ] \`https://<tên-miền>/\` hiện bảng tin, có ổ khoá HTTPS.
- [ ] Đăng ký tài khoản mới, đăng bài, thả tim, theo dõi, nhắc tên — tất cả chạy.
- [ ] Mở \`https://<tên-miền>/config.php\` → **404/403** (ngoài web root).
- [ ] Gây lỗi (ví dụ URL sai) → trang **500 chung**, không lộ đường dẫn (debug=false).
- [ ] DevTools → Application → Cookies: \`nhip_session\` có **Secure** + **HttpOnly**.
- [ ] Tải ảnh đại diện → lưu được (thư mục \`uploads\` ghi được).

Sai bất kỳ dòng nào thì **sửa rồi kiểm lại từ đầu** — đừng để site "chạy một nửa".`,
    },
    {
      section: "core",
      title: "Giới hạn của hosting miễn phí",
      body: `Hiểu rõ để không ngạc nhiên:

- **Tài nguyên có hạn**: giới hạn CPU, RAM, số truy vấn/ngày. Đủ cho học và demo, không cho tải lớn.
- **Không chạy tiến trình nền**: cron dày, worker, gửi email hàng loạt thường bị cấm.
- **Có thể bị ngừng**: vi phạm điều khoản là site tắt. **Tự sao lưu** CSDL định kỳ (Export).
- **Hiệu năng thất thường**: chia sẻ máy với nhiều site khác.

Khi dự án lớn hơn: chuyển sang **VPS** (toàn quyền máy ảo) hoặc **PaaS** (Railway, Render…) — nhưng nguyên tắc cấu hình/bảo mật/web root ở step này không đổi.`,
    },
    {
      section: "apply",
      title: "DEPLOY.md",
      body: "Viết tài liệu triển khai của dự án. Có nó, lần deploy sau chỉ việc làm theo; người khác clone về cũng tự lên được.",
      code: { file: "nhip/DEPLOY.md", lang: "md", content: `# Triển khai Nhịp lên hosting miễn phí

Hướng dẫn đưa Nhịp lên một máy chủ chia sẻ (shared hosting) miễn phí có PHP + MySQL
(ví dụ InfinityFree). Nguyên tắc chung giống mọi hosting cPanel.

## 0. Trước khi lên

- [ ] Chạy lại \`database/schema.sql\` trên cơ sở dữ liệu trống để chắc nó đủ và đúng.
- [ ] Xoá thư mục \`lab/\` nếu còn (mã có lỗ hổng, step 17).
- [ ] Trong \`config.php\`: đặt \`'debug' => false\` (step 19).
- [ ] Trong \`src/auth.php\`: bật \`'secure' => true\` cho cookie phiên (chỉ gửi qua HTTPS).

## 1. Tạo tài khoản và website

1. Đăng ký tại hosting (chỉ cần email, không cần thẻ).
2. Tạo một website với **tên miền phụ miễn phí** (ví dụ \`nhip.infinityfreeapp.com\`).
3. Bật **SSL miễn phí** (Let's Encrypt) cho tên miền — để có HTTPS.

## 2. Tạo cơ sở dữ liệu MySQL

1. Trong bảng điều khiển → **MySQL Databases** → tạo một CSDL.
2. Ghi lại: **host** (không phải localhost!), **tên CSDL**, **user**, **mật khẩu**.
3. Mở **phpMyAdmin** của hosting → chọn CSDL → tab **Import** → tải lên \`database/schema.sql\`.
   (Có thể nạp thêm \`database/seed.sql\` nếu muốn dữ liệu mẫu.)

## 3. Tải mã lên

1. Lấy thông tin **FTP** trong bảng điều khiển (hoặc dùng File Manager).
2. Thư mục gốc web của hosting thường là \`htdocs/\` hoặc \`public_html/\`.
3. Tải **nội dung thư mục \`public/\`** vào thư mục gốc đó.
4. Tải \`src/\`, \`config.php\`, \`database/\` vào **thư mục CHA** của thư mục gốc
   (ngoài vùng web). Nếu hosting không cho ra ngoài web root, đặt chúng trong
   một thư mục và chặn truy cập bằng \`.htaccess\` (\`Require all denied\`).
5. Sửa \`public/index.php\` nếu cần để trỏ đúng đường dẫn tới \`src/bootstrap.php\`.

## 4. Cập nhật config.php trên hosting

\`\`\`php
return [
    'db_host' => 'sqlXXX.infinityfree.com',   // host CSDL của hosting, KHÔNG phải 127.0.0.1
    'db_name' => 'if0_xxxxx_nhip',
    'db_user' => 'if0_xxxxx',
    'db_pass' => '••••••••',
    'debug'   => false,
];
\`\`\`

## 5. Kiểm tra sau khi lên

- [ ] Mở \`https://<tên-miền>/\` — bảng tin hiện ra.
- [ ] Đăng ký một tài khoản, đăng bài, thả tim, theo dõi.
- [ ] Mở \`https://<tên-miền>/config.php\` → phải **404/403** (nằm ngoài web root).
- [ ] Tải lại bằng HTTPS, kiểm cookie có cờ **Secure**.
- [ ] Gây một lỗi → thấy trang 500 chung, KHÔNG lộ đường dẫn (debug=false).

## Giới hạn của hosting miễn phí
...` },
    },
    {
      section: "apply",
      title: "Chuẩn hoá production",
      body: "Hai thay đổi bắt buộc trước khi lên, và quy tắc ép HTTPS trong `.htaccess` của `public/`.",
      code: { file: "nhip/public/.htaccess", lang: "apache", content: `# public/.htaccess — thêm ép HTTPS (chỉ bật khi đã có SSL)
RewriteEngine On

RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [L]` },
    },
    {
      section: "apply",
      title: "Bài tập triển khai",
      body: `1. Tạo tài khoản một hosting miễn phí, đưa Nhịp lên, gửi link cho một người bạn mở thử.
2. Cố tình để \`debug = true\` rồi gây lỗi — xem nó lộ gì. Rồi tắt lại. (Hiểu vì sao phải tắt.)
3. Thử mở \`/config.php\` và \`/src/db.php\` qua trình duyệt — xác nhận không tải được.
4. Export CSDL từ hosting về máy (một lần sao lưu).
5. Đổi một dòng CSS trên máy, deploy lại chỉ tệp đó, xác nhận thay đổi lên site.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 24",
      body: `- [ ] Nhịp chạy trên một tên miền thật qua **HTTPS**.
- [ ] Người khác (không phải bạn) mở và dùng được.
- [ ] \`config.php\` dùng host CSDL của hosting, \`debug = false\`; mở trực tiếp → 404/403.
- [ ] Cookie phiên có cờ **Secure**; HTTP tự chuyển sang HTTPS.
- [ ] Lỗi hiện trang 500 chung, không lộ chi tiết.
- [ ] \`DEPLOY.md\` đủ để làm lại từ đầu; đã sao lưu CSDL.`,
    },
  ],
  quiz: [
    { q: "Trên hosting, 'db_host' của Nhịp nên là gì?", o: ["127.0.0.1", "localhost", "Host CSDL do hosting cấp (vd sql123.infinityfree.com)", "Tên miền của site"], a: 2, why: "CSDL thường nằm trên máy chủ riêng, không phải localhost như trên máy bạn." },
    { q: "Vì sao phải đặt debug = false trên production?", o: ["Cho nhanh", "Lỗi chi tiết lộ đường dẫn, phiên bản, câu SQL cho kẻ tấn công", "Bắt buộc của hosting", "Để tiết kiệm RAM"], a: 1, why: "Lộ lỗi là Security Misconfiguration (A02)." },
    { kind: "truefalse", q: "Nên bật cờ cookie Secure ngay cả khi site chỉ chạy HTTP (chưa có SSL).", a: false, why: "Secure khiến cookie chỉ gửi qua HTTPS; trên HTTP sẽ mất cookie, không đăng nhập được." },
    { q: "Thư mục nào của Nhịp được tải vào web root của hosting?", o: ["src/", "Nội dung public/", "config.php", "database/"], a: 1, why: "Chỉ public/ công khai; src, config, database nằm ngoài web root." },
    { q: "Chứng chỉ SSL miễn phí thường do ai cấp?", o: ["Google", "Let's Encrypt", "Hosting tự ký", "Người dùng"], a: 1, why: "Let's Encrypt cấp chứng chỉ TLS tự động, miễn phí." },
    { kind: "multi", q: "Những gì phải kiểm sau khi deploy?", o: ["Mở /config.php phải ra 404/403", "Cookie có cờ Secure", "Gây lỗi phải ra trang 500 chung", "Để debug = true cho dễ sửa"], a: [0, 1, 2], why: "debug phải = false trên production." },
    { q: "Nếu hosting không cho đặt tệp ngoài web root, làm sao bảo vệ config.php?", o: ["Đổi tên thành config.txt", "Đặt trong thư mục con có .htaccess Require all denied", "Mã hoá nội dung", "Không cần, nó an toàn"], a: 1, why: "Chặn truy cập HTTP tới thư mục chứa mã nguồn/bí mật." },
    { kind: "blank", q: "Điền chỉ thị ép chuyển HTTP sang HTTPS trong .htaccess.", code: "RewriteCond %{HTTPS} off\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=___]", a: "301", why: "301 là chuyển hướng vĩnh viễn — đúng cho ép HTTPS." },
    { kind: "multi", q: "Giới hạn điển hình của hosting miễn phí là gì?", o: ["Tài nguyên CPU/RAM/truy vấn có hạn", "Thường không chạy được cron/worker nền", "Có thể bị ngừng nếu vi phạm", "Không bao giờ sập"], a: [0, 1, 2], why: "Phải tự sao lưu và hiểu rõ giới hạn." },
    { q: "Lỗi [1045] Access denied khi deploy thường do đâu?", o: ["Thiếu HTTPS", "Sai user/mật khẩu CSDL trong config.php", "Web root sai", "Chưa bật SSL"], a: 1, why: "Thông tin kết nối CSDL production khác localhost; kiểm lại config.php." },
  ],
};
