export default {
  id: "step19",
  lang: "php",
  file: "nhip/includes/ratelimit.php",
  duration: "150 phút",
  summary: "Hoàn tất chặng 4: giới hạn tần suất đăng nhập để chặn dò mật khẩu, nhật ký thao tác để truy vết, trang lỗi an toàn khi tắt debug, và rà soát toàn bộ SECURITY.md lần cuối.",
  slides: [
    {
      section: "intro",
      title: "Ba lớp phòng thủ cuối",
      body: `Đã chặn Injection, XSS, CSRF, tải tệp độc hại. Còn ba mối đe doạ trong \`SECURITY.md\` chưa xử lý:

- **Dò mật khẩu** (brute force) — thử hàng nghìn mật khẩu cho một tài khoản. \`password_verify\` chậm giúp ít; cần **giới hạn tần suất**.
- **Chối bỏ** (repudiation) — "tôi không xoá bài đó". Cần **nhật ký** ai làm gì, khi nào.
- **Lộ thông tin qua lỗi** — trang lỗi PHP in đường dẫn, câu SQL. Cần **trang lỗi an toàn** khi lên hosting.

Ba lớp này ít "hào nhoáng" hơn nhưng là chuẩn của mọi ứng dụng thật, và lấp đúng ba mục còn lại trong OWASP Top 10:2025 (A06, A09, A10).`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Giới hạn số lần đăng nhập sai theo IP trong một cửa sổ thời gian.
2. Lưu IP gọn bằng \`VARBINARY\` và \`inet_pton\`.
3. Ghi **nhật ký thao tác** nhạy cảm (đăng nhập, đăng ký, xoá bài) — không bao giờ ghi mật khẩu/token.
4. Cài **trình xử lý lỗi toàn cục**: debug tắt thì hiện trang 500 chung, lỗi thật vào log máy chủ.
5. Phân biệt dữ liệu cần ẩn khỏi người dùng nhưng cần ghi lại cho quản trị.
6. Rà soát \`SECURITY.md\`: mọi mục đã có biện pháp, tấn công thử lần cuối.`,
    },
    {
      section: "visual",
      title: "Giới hạn tần suất",
      visual: "rate-limit",
      body: `Mỗi lần đăng nhập **sai**, Nhịp ghi một dòng vào \`login_attempts\` (IP + thời gian). Trước khi kiểm mật khẩu, nó đếm số lần sai của IP đó trong **15 phút gần nhất**:

- Dưới 5 → cho thử.
- Từ 5 trở lên → từ chối ngay, không kiểm mật khẩu, báo "đợi 15 phút".

Đăng nhập **đúng** thì xoá sạch lịch sử thử của IP. Cửa sổ trượt (sliding window) này biến việc dò hàng nghìn mật khẩu thành bất khả thi về thời gian, mà vẫn không làm phiền người gõ nhầm một hai lần.`,
    },
    {
      section: "visual",
      title: "Nhật ký: ai, làm gì, khi nào",
      visual: "audit-log",
      body: `Bảng \`activity_log\` ghi lại mỗi thao tác nhạy cảm: \`action\` (loại), \`user_id\` (ai, NULL nếu chưa đăng nhập), \`detail\`, \`ip\`, \`created_at\`.

Nhật ký trả lời ba câu khi có sự cố:

- **Ai** đã xoá bài 42? → tra \`action = 'post_delete'\`, \`detail = 'post #42'\`.
- Tài khoản này **bị dò** không? → đếm \`login_failed\` theo IP.
- Chuyện xảy ra **lúc nào** → \`created_at\`.

Nguyên tắc vàng: nhật ký **không bao giờ** chứa mật khẩu, token, hay số thẻ. Ghi "đã đăng nhập", không ghi "đăng nhập bằng mật khẩu abc123".`,
    },
    {
      section: "research",
      title: "A06, A09, A10 của OWASP",
      body: `Ba lớp step này lấp ba mục OWASP Top 10:2025:

- **A06 Insecure Design** — thiếu giới hạn tần suất là một lỗi *thiết kế*, không phải lỗi mã lẻ; OWASP khuyến nghị đưa giới hạn tần suất vào từ khâu thiết kế.
- **A09 Security Logging and Alerting Failures** — không ghi, hoặc ghi mà không ai xem, khiến tấn công kéo dài không bị phát hiện.
- **A10 Mishandling of Exceptional Conditions** — mục **mới** của bản 2025: xử lý lỗi sai (lộ chi tiết, hoặc "mở cửa" khi gặp lỗi) là rủi ro riêng.

> OWASP Foundation (2025) *A09:2025 – Security Logging and Alerting Failures*; *A10:2025 – Mishandling of Exceptional Conditions*, OWASP Top 10:2025. Available at: https://top10.owasp.org/2025/
>
> OWASP Foundation (2025) *Logging Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html`,
    },
    {
      section: "research",
      title: "Chống dò mật khẩu đúng cách",
      body: `Hướng dẫn NIST SP 800-63B yêu cầu hệ thống **giới hạn số lần thử không thành công** cho mỗi tài khoản để chống dò trực tuyến, kết hợp với cơ chế làm chậm (throttling). Giới hạn theo **IP** chặn kẻ dò một tài khoản; giới hạn theo **tài khoản** chặn kẻ dò từ nhiều IP (làm thêm ở dự án hoàn tất).

NIST cũng lưu ý **không** nên khoá tài khoản vĩnh viễn chỉ vì nhập sai — vì kẻ xấu có thể cố tình nhập sai để khoá tài khoản người khác (một dạng tấn công từ chối dịch vụ). Cửa sổ thời gian tự mở lại như Nhịp làm là cân bằng hợp lý.

> National Institute of Standards and Technology (2024) *SP 800-63B-4: Digital Identity Guidelines*, §5.2.2 Rate Limiting (Throttling). Gaithersburg: NIST. doi:10.6028/NIST.SP.800-63b-4`,
    },
    {
      section: "ideate",
      title: "Thiết kế ba phần",
      body: `| Phần | Tệp | Bảng |
|---|---|---|
| Giới hạn tần suất | \`includes/ratelimit.php\` | \`login_attempts\` |
| Nhật ký | \`includes/log.php\` | \`activity_log\` |
| Trang lỗi | \`includes/errors.php\` | — |

Hai bảng mới thêm vào \`database/schema.sql\`. Cả ba tệp nạp trong \`bootstrap.php\`. \`login.php\` gọi giới hạn + nhật ký; \`delete.php\`, \`register.php\` gọi nhật ký.

IP lưu bằng **\`VARBINARY(16)\`** (16 byte đủ cho IPv6) qua \`inet_pton\` — gọn và so sánh nhanh hơn chuỗi; phpMyAdmin/MySQL đọc lại bằng \`INET6_NTOA\`.`,
    },
    {
      section: "core",
      title: "Lấy và lưu IP",
      body: `~~~php
function client_ip(): ?string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $packed = @inet_pton($ip);          // "127.0.0.1" → 4 byte; IPv6 → 16 byte
    return $packed === false ? null : $packed;
}
~~~

\`$_SERVER['REMOTE_ADDR']\` là IP mà máy chủ **thực sự** thấy. **Không** tin \`X-Forwarded-For\` hay \`X-Real-IP\` từ tiêu đề — kẻ tấn công tự đặt được, sẽ giả IP để né giới hạn. Chỉ tin tiêu đề đó khi có một proxy tin cậy (CDN) đặt nó, và phải cấu hình riêng (ngoài phạm vi khoá).

Lưu dạng nhị phân: \`INSERT … (ip) VALUES (?)\` với giá trị \`inet_pton\`. Đọc lại trong SQL: \`INET6_NTOA(ip)\`.`,
    },
    {
      section: "core",
      title: "Đếm theo cửa sổ trượt",
      body: `~~~php
function login_attempt_count(): int
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM login_attempts
        WHERE ip = ? AND created_at > (NOW() - INTERVAL ? MINUTE)');
    $stmt->execute([client_ip(), LOGIN_WINDOW_MIN]);
    return (int) $stmt->fetchColumn();
}
~~~

\`NOW() - INTERVAL 15 MINUTE\` là mốc 15 phút trước; chỉ đếm lần thử sau mốc đó. Cửa sổ **trượt** theo thời gian thực, không phải "reset lúc đầu giờ".

Trong \`login.php\`, kiểm **trước** khi gọi \`verify_login\` (đỡ tốn một lần băm):

~~~php
if (login_attempt_count() >= LOGIN_MAX_ATTEMPTS) {
    $error = 'Bạn đã thử sai quá nhiều lần. Hãy đợi 15 phút rồi thử lại.';
} else {
    // verify_login, ghi nhận nếu sai, xoá nếu đúng
}
~~~`,
    },
    {
      section: "core",
      title: "Ghi nhật ký",
      body: `~~~php
function log_action(string $action, ?int $userId = null, string $detail = ''): void
{
    db()->prepare('INSERT INTO activity_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')
        ->execute([$userId, $action, mb_substr($detail, 0, 255), client_ip()]);
}
~~~

Gọi ở các điểm nhạy cảm:

~~~php
log_action('login', $userId);                      // đăng nhập thành công
log_action('login_failed', null, $login);          // thất bại (ghi tên đã thử, KHÔNG ghi mật khẩu)
log_action('register', $id, $input['username']);   // tạo tài khoản
log_action('post_delete', $me['id'], 'post #' . $id);
~~~

\`detail\` cắt 255 ký tự để vừa cột và tránh ai đó nhồi dữ liệu khổng lồ vào nhật ký (một dạng tấn công *log flooding*).`,
    },
    {
      section: "core",
      title: "Khoá ngoại SET NULL",
      body: `Bảng \`activity_log\` nối tới \`users\` bằng:

~~~sql
CONSTRAINT fk_log_user FOREIGN KEY (user_id)
  REFERENCES users (id) ON DELETE SET NULL
~~~

Khác với \`posts\` dùng \`ON DELETE CASCADE\` (xoá người thì xoá bài). Nhật ký dùng **\`SET NULL\`**: xoá một tài khoản thì các dòng nhật ký của họ **vẫn còn**, chỉ mất liên kết \`user_id\`. Vì nhật ký là **bằng chứng** — không được biến mất khi người liên quan bị xoá.

Chọn hành vi khoá ngoại theo ý nghĩa dữ liệu: nội dung thuộc về người (CASCADE), bằng chứng độc lập với người (SET NULL hoặc RESTRICT).`,
    },
    {
      section: "core",
      title: "Trang lỗi an toàn",
      body: `~~~php
function install_error_handler(bool $debug): void
{
    if ($debug) return;                 // dev: giữ lỗi chi tiết để sửa
    set_exception_handler(function (Throwable $e): void {
        error_log('[nhip] ' . $e);      // chi tiết vào LOG máy chủ
        http_response_code(500);
        echo '<!DOCTYPE html>…Có lỗi xảy ra. Hãy thử lại sau.…';  // ra trình duyệt: chung chung
        exit;
    });
}
~~~

Hai đích khác nhau cho cùng một lỗi: **người dùng** thấy câu an toàn, **quản trị** đọc chi tiết trong log. Đây chính là cách xử lý **A10 Mishandling of Exceptional Conditions**: lỗi không được làm lộ thông tin, cũng không được để hệ thống rơi vào trạng thái bất định.

\`debug\` trong \`config.php\`: \`true\` ở máy bạn, \`false\` trên hosting (step 24).`,
    },
    {
      section: "core",
      title: "Lỗi lường trước vs lỗi bất ngờ",
      body: `Hai loại lỗi, hai cách xử lý:

- **Lường trước** (người dùng gõ sai, không có quyền, không tìm thấy): xử lý **tại chỗ** bằng \`$error\`, \`abort(404/403)\`, flash — có thông báo thân thiện, cụ thể.
- **Bất ngờ** (mất kết nối cơ sở dữ liệu, lỗi lập trình): để **ngoại lệ** nổi lên trình xử lý toàn cục → trang 500 chung.

Đừng \`try/catch\` nuốt mọi thứ rồi hiện "có lỗi" — sẽ giấu cả lỗi lập trình của chính bạn. Chỉ bắt ngoại lệ bạn **biết cách xử lý** (như trùng tên khi đăng ký, step 12), còn lại để nổi lên.

Nguyên tắc **fail-safe**: khi gặp lỗi không rõ, hệ thống phải **đóng** (từ chối), không "cứ cho qua".`,
    },
    {
      section: "apply",
      title: "Hai bảng mới",
      body: "Thêm vào cuối `database/schema.sql`. `BIGINT` cho id nhật ký vì nó tăng rất nhanh. Chạy lại phần này trong tab SQL của phpMyAdmin (chỉ phần hai bảng mới, không chạy lại cả tệp để khỏi mất dữ liệu).",
      code: { file: "nhip/database/schema.sql", lang: "sql", content: `-- Nhật ký thao tác nhạy cảm (step 19).
CREATE TABLE activity_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(40)  NOT NULL,
  detail     VARCHAR(255) NOT NULL DEFAULT '',
  ip         VARBINARY(16) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_log_user (user_id, created_at),
  KEY idx_log_action (action, created_at),
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Lần thử đăng nhập, để giới hạn tần suất (step 19).
CREATE TABLE login_attempts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip         VARBINARY(16) NOT NULL,
  login      VARCHAR(255) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attempt_ip (ip, created_at)
) ENGINE=InnoDB;` },
    },
    {
      section: "apply",
      title: "log.php và ratelimit.php",
      body: "Hai tệp nhỏ, nạp trong `bootstrap.php`. Hằng số `LOGIN_MAX_ATTEMPTS` và `LOGIN_WINDOW_MIN` đặt một chỗ để dễ chỉnh.",
      code: { file: "nhip/includes/ratelimit.php", lang: "php", content: `// includes/log.php
<?php
declare(strict_types=1);

/** Địa chỉ IP người gọi, dạng nhị phân gọn (hỗ trợ cả IPv4 lẫn IPv6). */
function client_ip(): ?string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $packed = @inet_pton($ip);
    return $packed === false ? null : $packed;
}

/** Ghi một thao tác nhạy cảm vào nhật ký. Không bao giờ ghi mật khẩu hay token. */
function log_action(string $action, ?int $userId = null, string $detail = ''): void
{
    db()->prepare('INSERT INTO activity_log (user_id, action, detail, ip) VALUES (?, ?, ?, ?)')
        ->execute([$userId, $action, mb_substr($detail, 0, 255), client_ip()]);
}

// includes/ratelimit.php
<?php
declare(strict_types=1);

const LOGIN_MAX_ATTEMPTS = 5;        // tối đa 5 lần sai
const LOGIN_WINDOW_MIN = 15;         // trong 15 phút, tính theo IP

/** Số lần thử đăng nhập của IP này trong cửa sổ thời gian. */
function login_attempt_count(): int
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM login_attempts
        WHERE ip = ? AND created_at > (NOW() - INTERVAL ? MINUTE)');
    $stmt->execute([client_ip(), LOGIN_WINDOW_MIN]);
    return (int) $stmt->fetchColumn();
}

function record_login_attempt(string $login): void
{
    db()->prepare('INSERT INTO login_attempts (ip, login) VALUES (?, ?)')
        ->execute([client_ip(), mb_substr($login, 0, 255)]);
}

/** Đăng nhập đúng rồi thì xoá lịch sử thử của IP này. */
function clear_login_attempts(): void
{
    db()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([client_ip()]);
}` },
    },
    {
      section: "apply",
      title: "errors.php và login.php",
      body: "Trình xử lý lỗi cài trong `bootstrap.php` ngay sau khi đọc `$config`. `login.php` bọc toàn bộ logic trong kiểm tra giới hạn tần suất.",
      code: { file: "nhip/includes/errors.php", lang: "php", content: `<?php
declare(strict_types=1);

/**
 * Khi debug tắt (hosting): mọi lỗi/ngoại lệ không bắt được → trang 500 gọn,
 * không lộ đường dẫn, phiên bản, câu SQL. Lỗi thật được ghi vào nhật ký PHP.
 */
function install_error_handler(bool $debug): void
{
    if ($debug) {
        return;                          // dev: để PHP hiện lỗi chi tiết như cũ
    }
    set_exception_handler(function (Throwable $e): void {
        error_log('[nhip] ' . $e);        // vào log của máy chủ, không ra trình duyệt
        http_response_code(500);
        if (!headers_sent()) {
            header('Content-Type: text/html; charset=UTF-8');
        }
        echo '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
            . '<title>Lỗi · Nhịp</title><link rel="stylesheet" href="/nhip/css/style.css"></head>'
            . '<body><main class="feed"><h1>Có lỗi xảy ra</h1>'
            . '<p class="empty">Nhịp gặp sự cố khi xử lý yêu cầu. Hãy thử lại sau.</p>'
            . '<p><a href="/nhip/index.php">← Về bảng tin</a></p></main></body></html>';
        exit;
    });
}` },
    },
    {
      section: "apply",
      title: "Kết quả: chặn dò mật khẩu",
      image: {
        src: "/image/coding/steps/s19-ratelimit.webp",
        alt: "Trang đăng nhập Nhịp với dòng lỗi đỏ Bạn đã thử sai quá nhiều lần. Hãy đợi 15 phút rồi thử lại.",
        caption: "Sau 5 lần sai từ cùng một IP: lần thứ 6 bị từ chối ngay, không kiểm mật khẩu.",
      },
      body: `Tự kiểm: nhập sai mật khẩu 5 lần rồi lần 6 — bị chặn. Đăng nhập **đúng** một lần sẽ xoá bộ đếm (dòng \`clear_login_attempts\`), nên người gõ nhầm rồi nhập đúng không bị phạt oan.

Trong phpMyAdmin, bảng \`login_attempts\` có các dòng với \`INET6_NTOA(ip)\` = \`127.0.0.1\` (hoặc \`::1\`).`,
    },
    {
      section: "apply",
      title: "Kết quả: nhật ký thao tác",
      image: {
        src: "/image/coding/steps/s19-log.webp",
        alt: "Bảng activity_log trong phpMyAdmin với các dòng action login_failed, user_id NULL, detail lan.code, ip 0x7f000001, created_at",
        caption: "activity_log ghi lại năm lần đăng nhập sai với tên đã thử và IP — không có mật khẩu.",
      },
      body: `Mỗi \`login_failed\` ghi tên người dùng đã thử (\`lan.code\`) và IP (\`0x7f000001\` = \`127.0.0.1\`), nhưng **không** có mật khẩu. Đăng nhập đúng, xoá bài sẽ thêm các dòng \`login\`, \`post_delete\` tương ứng.

Đây là nguyên liệu cho **phân tích an ninh** (step 23): đếm đăng nhập sai theo IP để phát hiện tấn công, đếm bài mới theo ngày để thấy tăng trưởng.`,
    },
    {
      section: "apply",
      title: "Rà soát SECURITY.md lần cuối",
      body: `Mở lại \`SECURITY.md\`, bảng "Rủi ro còn mở" của step 16 giờ phải **trống**:

- [x] CSRF — token (step 18)
- [x] Tiêu đề bảo mật — CSP + nosniff (step 17)
- [x] Giới hạn tần suất đăng nhập (step 19)
- [x] Nhật ký thao tác (step 19)
- [x] Trang lỗi an toàn khi \`debug = false\` (step 19)

Đi lại bảng STRIDE: mỗi dòng đã có cột "biện pháp" và "đã làm ở step". Tấn công thử lần cuối tất cả các đòn của step 17–18 — tất cả phải thất bại.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu chặng 4",
      body: `Nhịp qua được bảng rà soát bảo mật khi:

- [ ] SQL Injection, XSS, CSRF: tấn công thử đều thất bại.
- [ ] Tải tệp chỉ nhận ảnh thật, đã vẽ lại; thư mục cấm chạy \`.php\`.
- [ ] 5 lần đăng nhập sai → bị chặn 15 phút.
- [ ] Thao tác nhạy cảm được ghi nhật ký, không lộ mật khẩu.
- [ ] \`debug = false\` → lỗi hiện trang 500 chung, chi tiết vào log máy chủ.
- [ ] \`SECURITY.md\` không còn rủi ro mở; mọi mục OWASP Top 10 có biện pháp.
- [ ] Thư mục \`lab/\` đã xoá.

Đạt đủ + thưởng **800 JOY**. Chặng 5 đưa Nhịp từ "an toàn" tới "gọn gàng, nhanh, nhiều tính năng".`,
    },
  ],
  quiz: [
    { q: "Giới hạn tần suất đăng nhập theo IP chống kiểu tấn công nào?", o: ["SQL Injection", "Dò mật khẩu (brute force)", "XSS", "CSRF"], a: 1, why: "Giới hạn số lần thử khiến việc thử hàng nghìn mật khẩu bất khả thi về thời gian." },
    { kind: "truefalse", q: "Nên khoá vĩnh viễn tài khoản sau 5 lần nhập sai.", a: false, why: "Kẻ xấu có thể cố nhập sai để khoá tài khoản người khác; dùng cửa sổ thời gian tự mở lại." },
    { q: "Thông tin nào KHÔNG bao giờ được ghi vào nhật ký?", o: ["Tên hành động", "Mật khẩu người dùng", "Thời điểm", "IP"], a: 1, why: "Nhật ký không chứa mật khẩu, token, số thẻ." },
    { q: "Vì sao activity_log dùng ON DELETE SET NULL thay vì CASCADE?", o: ["Cho nhanh", "Nhật ký là bằng chứng, phải còn lại kể cả khi tài khoản bị xoá", "MySQL bắt buộc", "Để tiết kiệm chỗ"], a: 1, why: "Bằng chứng độc lập với người; chỉ mất liên kết, không mất dòng." },
    { q: "Khi debug = false và xảy ra lỗi PDO, người dùng thấy gì?", o: ["Câu SQL lỗi", "Đường dẫn tệp", "Trang 'Có lỗi xảy ra' chung, chi tiết vào log máy chủ", "Trang trắng"], a: 2, why: "Tách đích: người dùng thấy câu an toàn, quản trị đọc log." },
    { kind: "multi", q: "Vì sao không tin X-Forwarded-For để lấy IP?", o: ["Kẻ tấn công tự đặt được tiêu đề này", "Có thể dùng để né giới hạn tần suất", "REMOTE_ADDR mới là IP máy chủ thực sự thấy", "Nó luôn rỗng"], a: [0, 1, 2], why: "Chỉ tin X-Forwarded-For khi có proxy tin cậy đặt nó và được cấu hình riêng." },
    { kind: "blank", q: "Điền hàm chuyển IP dạng chuỗi sang nhị phân để lưu VARBINARY.", code: "$packed = ________($_SERVER['REMOTE_ADDR']);", a: "inet_pton", why: "inet_pton hỗ trợ cả IPv4 (4 byte) lẫn IPv6 (16 byte)." },
    { kind: "output", q: "Câu này đếm gì?", code: "SELECT COUNT(*) FROM login_attempts\nWHERE ip = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)", o: ["Tổng lần thử mọi lúc", "Số lần thử của IP đó trong 15 phút gần nhất", "Số người dùng", "Số IP khác nhau"], a: 1, why: "Cửa sổ trượt theo thời gian thực." },
    { q: "Lỗi 'lường trước' (người dùng không có quyền) nên xử lý thế nào?", o: ["Để ngoại lệ nổi lên trang 500", "Xử lý tại chỗ bằng abort(403) với thông báo rõ", "Bỏ qua", "Ghi log rồi tiếp tục"], a: 1, why: "Lỗi lường trước có thông báo thân thiện cụ thể; chỉ lỗi bất ngờ mới ra trang 500 chung." },
    { q: "Ba mục OWASP nào chặng này lấp?", o: ["A01, A02, A03", "A06 Insecure Design, A09 Logging Failures, A10 Exceptional Conditions", "A04, A05, A07", "Tất cả"], a: 1, why: "Giới hạn tần suất (A06), nhật ký (A09), trang lỗi (A10)." },
  ],
};
