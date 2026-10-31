export default {
  id: "step12",
  lang: "php",
  file: "nhip/includes/auth.php",
  duration: "180 phút",
  summary: "Tài khoản cho Nhịp: đăng ký có kiểm tra, băm mật khẩu bằng password_hash, đăng nhập bằng password_verify, session và cookie an toàn, đổi mã phiên, đăng xuất bằng POST và lời nhắn flash.",
  slides: [
    {
      section: "intro",
      title: "Ai đang dùng Nhịp?",
      body: `Tới step 11, mọi bài đều do "người dùng số 1" đăng — mã gán cứng \`CURRENT_USER_ID = 1\`. Một mạng xã hội phải biết **ai** đang gửi yêu cầu, vì mọi quyền về sau (sửa bài của mình, theo dõi, thả tim) đều dựa trên câu trả lời đó.

Nhưng HTTP không nhớ gì giữa hai yêu cầu (step 8). Step này giải bài toán: làm sao để máy chủ **nhận ra cùng một người** qua hàng trăm yêu cầu, mà không bao giờ lưu mật khẩu của họ.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu khác biệt giữa **xác thực** (bạn là ai) và **phân quyền** (bạn được làm gì).
2. Băm mật khẩu bằng \`password_hash\`, kiểm bằng \`password_verify\` — và biết vì sao **không** dùng \`md5\`/\`sha1\`.
3. Dùng **session**: cookie mang mã phiên, máy chủ giữ dữ liệu phiên.
4. Đặt cờ cookie \`HttpOnly\`, \`SameSite\`; đổi mã phiên khi đăng nhập.
5. Viết trang đăng ký có kiểm tra từng trường và bắt lỗi trùng từ cơ sở dữ liệu.
6. Đăng nhập bằng tên người dùng **hoặc** email, báo lỗi không tiết lộ thông tin.
7. Đăng xuất bằng **POST**; hiện lời nhắn một lần (flash).`,
    },
    {
      section: "visual",
      title: "Session: cookie chỉ mang một mã số",
      visual: "session-flow",
      body: `1. Đăng nhập đúng → PHP tạo phiên, ghi \`$_SESSION['user_id'] = 1\` vào **tệp trên máy chủ**.
2. Phản hồi kèm \`Set-Cookie: nhip_session=k3f9…\` — chỉ là một mã ngẫu nhiên dài.
3. Mọi yêu cầu sau, trình duyệt tự gửi lại cookie đó.
4. \`session_start()\` dùng mã để mở đúng tệp phiên → PHP biết đây là người dùng 1.

Người dùng **không** sửa được \`user_id\`, vì nó không nằm ở trình duyệt. Thứ duy nhất phải bảo vệ là mã phiên — ai cầm được mã là "trở thành" bạn.`,
    },
    {
      section: "visual",
      title: "Băm một chiều, có muối",
      visual: "hash-verify",
      body: `\`password_hash('nhip-demo-2026', PASSWORD_DEFAULT)\` cho ra chuỗi dạng:

~~~text
$2y$10$h0dW2ml77LkJMSpa1YcEbu…
 │   │  └─ muối (22 ký tự) + kết quả băm
 │   └──── chi phí: 2^10 vòng lặp
 └──────── thuật toán: bcrypt
~~~

- **Một chiều**: không có hàm nào "giải băm" ra mật khẩu.
- **Muối ngẫu nhiên**: hai người cùng mật khẩu vẫn có hai chuỗi băm khác nhau.
- **Chậm có chủ đích**: mỗi lần thử tốn vài chục mili-giây — không đáng gì với người đăng nhập, nhưng biến việc dò hàng tỷ mật khẩu thành hàng chục năm.`,
    },
    {
      section: "research",
      title: "Khuyến nghị của NIST và OWASP",
      body: `Hướng dẫn định danh số của NIST (SP 800-63B) yêu cầu mật khẩu được lưu bằng hàm băm **có muối và tốn chi phí**, cho phép mật khẩu dài ít nhất 64 ký tự, và **không** ép quy tắc kiểu "phải có ký tự đặc biệt" hay đổi mật khẩu định kỳ. Độ dài quan trọng hơn độ phức tạp.

OWASP xếp bcrypt vào nhóm thuật toán chấp nhận được (cùng Argon2id, scrypt) và lưu ý bcrypt chỉ dùng **72 byte đầu** của mật khẩu — vì vậy Nhịp giới hạn 72.

> National Institute of Standards and Technology (2024) *SP 800-63B-4: Digital Identity Guidelines — Authentication and Authenticator Management*. Gaithersburg: NIST. doi:10.6028/NIST.SP.800-63b-4
>
> OWASP Foundation (2025) *Password Storage Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html`,
    },
    {
      section: "research",
      title: "Cookie và phiên theo chuẩn",
      body: `Cookie được định nghĩa trong RFC 6265 của IETF. Thuộc tính \`HttpOnly\` cấm JavaScript đọc cookie (giảm thiệt hại khi bị XSS); \`SameSite\` quyết định cookie có đi kèm yêu cầu khởi phát từ trang khác hay không — nền tảng chống CSRF ở step 18.

OWASP khuyến nghị **đổi mã phiên ngay sau khi đăng nhập** để chặn tấn công *cố định phiên* (session fixation): kẻ xấu gài trước một mã phiên vào trình duyệt nạn nhân, chờ nạn nhân đăng nhập rồi dùng lại mã đó.

> Barth, A. (2011) *RFC 6265: HTTP State Management Mechanism*. IETF. Available at: https://www.rfc-editor.org/rfc/rfc6265
>
> OWASP Foundation (2025) *Session Management Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`,
    },
    {
      section: "ideate",
      title: "Thiết kế luồng tài khoản",
      body: `| Trang | GET | POST |
|---|---|---|
| \`register.php\` | Biểu mẫu trống | Kiểm tra → tạo tài khoản → đăng nhập luôn → bảng tin |
| \`login.php\` | Biểu mẫu | Kiểm mật khẩu → đổi mã phiên → bảng tin |
| \`logout.php\` | **405** | Xoá phiên + cookie → bảng tin |
| \`index.php\` | Ai cũng xem được | Phải đăng nhập mới đăng bài |

Bốn hàm trong \`includes/auth.php\` gói mọi chi tiết về phiên: \`start_session()\`, \`current_user()\`, \`require_login()\`, \`login_user()\`/\`logout_user()\`. Trang chỉ gọi hàm — không trang nào tự đụng \`$_SESSION['user_id']\`.`,
    },
    {
      section: "ideate",
      title: "Những gì KHÔNG làm",
      body: `- **Không** lưu mật khẩu gốc, kể cả "tạm thời", kể cả trong tệp nhật ký.
- **Không** tự viết thuật toán băm, **không** dùng \`md5()\`/\`sha1()\`/\`hash('sha256', …)\` cho mật khẩu: chúng được thiết kế để **nhanh**, card đồ hoạ thử được hàng tỷ chuỗi mỗi giây.
- **Không** báo "email không tồn tại" hay "sai mật khẩu" riêng — chỉ một câu chung, để kẻ xấu không dò được ai có tài khoản.
- **Không** lưu \`user_id\` trong cookie thường: người dùng đổi \`1\` thành \`2\` là thành người khác.
- **Không** đăng xuất bằng đường link GET.`,
    },
    {
      section: "core",
      title: "password_hash và password_verify",
      body: `~~~php
// Đăng ký
$hash = password_hash($password, PASSWORD_DEFAULT);
// lưu $hash vào users.password_hash

// Đăng nhập
if (password_verify($password, $hashTừCơSởDữLiệu)) {
    // đúng mật khẩu
}

// Thuật toán/chi phí mặc định thay đổi theo phiên bản PHP?
if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
    // băm lại bằng cấu hình mới, lưu đè
}
~~~

\`PASSWORD_DEFAULT\` hiện là bcrypt. PHP 8.4 tăng chi phí mặc định từ 10 lên **12** — đó là lý do chuỗi băm trong \`seed.sql\` (tạo bằng PHP 8.4) bắt đầu bằng \`$2y$12$\`, còn tài khoản đăng ký trên XAMPP 8.2 là \`$2y$10$\`. \`password_needs_rehash\` tự đồng bộ chúng mỗi khi người dùng đăng nhập.`,
    },
    {
      section: "core",
      title: "session_start và cờ cookie",
      body: `~~~php
session_set_cookie_params([
    'lifetime' => 0,         // cookie phiên: mất khi đóng trình duyệt
    'path'     => '/',
    'httponly' => true,      // document.cookie không thấy nó
    'samesite' => 'Lax',     // không đi kèm POST khởi phát từ trang khác
    // 'secure' => true,     // chỉ gửi qua HTTPS — bật khi lên hosting (step 24)
]);
session_name('nhip_session');
session_start();
~~~

- \`session_start()\` phải chạy **trước** khi in bất kỳ ký tự nào ra trang (kể cả dấu cách trước \`<?php\`) vì nó gửi tiêu đề \`Set-Cookie\`. Lỗi kinh điển: *"headers already sent"*.
- Đặt tên phiên riêng (\`nhip_session\`) thay vì \`PHPSESSID\` mặc định để không đụng các dự án khác trên cùng \`localhost\`.`,
    },
    {
      section: "core",
      title: "Đổi mã phiên khi đăng nhập",
      body: `~~~php
function login_user(int $userId): void
{
    session_regenerate_id(true);    // cấp mã mới, xoá tệp phiên cũ
    $_SESSION['user_id'] = $userId;
}
~~~

Kịch bản tấn công nếu thiếu dòng đầu: kẻ xấu mở Nhịp, nhận mã \`abc\`, tìm cách gài \`abc\` vào trình duyệt nạn nhân. Nạn nhân đăng nhập → phiên \`abc\` giờ thuộc tài khoản nạn nhân → kẻ xấu đang cầm \`abc\`.

Với \`session_regenerate_id(true)\`, ngay lúc đăng nhập mã \`abc\` bị huỷ, nạn nhân nhận mã mới mà kẻ xấu không biết.`,
    },
    {
      section: "core",
      title: "current_user và require_login",
      body: `~~~php
$me = current_user();          // mảng người dùng hoặc null — trang công khai
$me = require_login();         // chưa đăng nhập → chuyển login.php — trang riêng tư
~~~

\`current_user()\` không tin dữ liệu cũ trong phiên: nó **đọc lại từ cơ sở dữ liệu** theo \`user_id\`. Tài khoản bị xoá thì lần tải sau tự thành khách. Biến \`static\` giữ kết quả để cả trang chỉ truy vấn một lần.

Đặt \`require_login()\` **trong nhánh POST** của \`index.php\`: khách vẫn đọc được bảng tin, nhưng gửi bài thì máy chủ chặn — kể cả khi ai đó tự dựng biểu mẫu gửi thẳng tới.`,
    },
    {
      section: "core",
      title: "Kiểm tra đăng ký",
      body: `| Trường | Luật | Công cụ |
|---|---|---|
| \`username\` | 3–30 ký tự \`a-z 0-9 . _\` | \`preg_match('/^[a-z0-9._]{3,30}$/', …)\` |
| \`display_name\` | 1–60 ký tự, được có dấu | \`mb_strlen\` |
| \`email\` | Đúng định dạng | \`filter_var(…, FILTER_VALIDATE_EMAIL)\` |
| \`password\` | 8–72 byte | \`strlen\` (bcrypt đếm byte) |
| \`password_confirm\` | Trùng \`password\` | \`!==\` |

Tên người dùng được \`strtolower\` trước khi kiểm: \`Lan.Code\` và \`lan.code\` là một.

**Trùng** tên/email không kiểm bằng \`SELECT\` trước rồi mới \`INSERT\` — hai người đăng ký cùng lúc sẽ lọt. Cứ \`INSERT\`, để ràng buộc \`UNIQUE\` (step 9) từ chối, rồi bắt \`PDOException\` có mã **23000**.`,
    },
    {
      section: "core",
      title: "Báo lỗi đúng chỗ, dễ tiếp cận",
      image: {
        src: "/image/coding/steps/s12-register-errors.webp",
        alt: "Trang Tạo tài khoản Nhịp với ba ô viền đỏ: tên người dùng 'hoa test' báo chỉ được chữ thường không dấu, số, dấu chấm, gạch dưới; email 'hoa@' báo không hợp lệ; mật khẩu báo phải 8–72 ký tự",
        caption: "Gửi biểu mẫu sai: mỗi lỗi nằm ngay dưới ô của nó, giá trị đã gõ được giữ lại (trừ mật khẩu).",
      },
      body: `Ba chi tiết làm biểu mẫu dễ dùng với cả trình đọc màn hình:

- Ô lỗi có \`aria-invalid="true"\` (CSS tô viền đỏ theo đúng thuộc tính này).
- \`aria-describedby\` nối ô với dòng lỗi → trình đọc màn hình đọc lỗi khi người dùng vào ô.
- \`autocomplete="new-password"\` / \`"current-password"\` để trình quản lý mật khẩu của trình duyệt gợi ý mật khẩu mạnh và tự điền đúng chỗ.

Biểu mẫu đặt \`novalidate\` để thấy kiểm tra **của máy chủ**; bản thật có thể bỏ thuộc tính này.`,
    },
    {
      section: "core",
      title: "Đăng nhập không tiết lộ gì",
      image: {
        src: "/image/coding/steps/s12-login-error.webp",
        alt: "Trang Đăng nhập với ô tên người dùng lan.code và dòng lỗi đỏ Tên đăng nhập hoặc mật khẩu không đúng.",
        caption: "Sai mật khẩu và sai tên đều nhận đúng một câu.",
      },
      body: `Ngoài nội dung câu báo lỗi, **thời gian** trả lời cũng có thể lộ thông tin: nếu tên không tồn tại mà trả lời ngay, còn tên có thật thì mất 60 ms để \`password_verify\`, kẻ xấu đo thời gian là biết ai có tài khoản.

Vì vậy \`verify_login\` vẫn băm một lần khi không tìm thấy người dùng. Step 19 bổ sung **giới hạn số lần thử** để chặn dò mật khẩu.`,
    },
    {
      section: "core",
      title: "Băm thật trong cơ sở dữ liệu",
      image: {
        src: "/image/coding/steps/s12-hashes.webp",
        alt: "Kết quả SELECT id, username, password_hash FROM users: lan.code và hoa.test có chuỗi $2y$10$ khác nhau, minh.dev, an.ui, khoa.data, mai.sec có cùng chuỗi $2y$12$N5Wu3hqguk6TTH…",
        caption: "Bốn tài khoản mẫu cùng một chuỗi vì seed.sql chép sẵn MỘT bản băm. lan.code đã được băm lại khi đăng nhập trên PHP 8.2.",
      },
      body: `Quan sát:

- Mọi chuỗi bắt đầu bằng \`$2y$\` — bcrypt. Không có mật khẩu nào đọc được.
- \`lan.code\` lúc nạp là \`$2y$12$…\`, sau một lần đăng nhập thành \`$2y$10$…\` với **muối mới**: đó là \`password_needs_rehash\` làm việc.
- \`hoa.test\` (đăng ký qua trang) có muối riêng. Nếu bạn đăng ký thêm một tài khoản cùng mật khẩu, chuỗi băm vẫn khác hoàn toàn.`,
    },
    {
      section: "apply",
      title: "includes/auth.php",
      body: "Tệp mới. Thêm `require __DIR__ . '/auth.php';` và `start_session();` vào cuối `bootstrap.php` — phiên phải mở trước khi `header.php` in ra bất cứ gì.",
      code: { file: "nhip/includes/auth.php", lang: "php", content: `<?php
declare(strict_types=1);

/** Mở phiên với cookie an toàn. Gọi một lần ở bootstrap, trước khi in bất cứ gì. */
function start_session(): void
{
    session_set_cookie_params([
        'lifetime' => 0,          // cookie mất khi đóng trình duyệt
        'path'     => '/',
        'httponly' => true,       // JavaScript không đọc được cookie phiên
        'samesite' => 'Lax',      // không gửi kèm yêu cầu POST từ trang khác
    ]);
    session_name('nhip_session');
    session_start();
}

/** Người đang đăng nhập (đọc lại từ cơ sở dữ liệu), hoặc null. */
function current_user(): ?array
{
    static $user = false;
    if ($user === false) {
        $id = $_SESSION['user_id'] ?? null;
        $user = is_int($id) ? find_user_by_id($id) : null;
    }
    return $user;
}

/** Trang chỉ dành cho người đã đăng nhập: chưa đăng nhập thì chuyển tới login.php. */
function require_login(): array
{
    $user = current_user();
    if ($user === null) {
        flash('Hãy đăng nhập để tiếp tục.');
        redirect('login.php');
    }
    return $user;
}

function login_user(int $userId): void
{
    session_regenerate_id(true);   // đổi mã phiên: chặn tấn công cố định phiên
    $_SESSION['user_id'] = $userId;
}

function logout_user(): void
{
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    session_destroy();
}` },
    },
    {
      section: "apply",
      title: "users.php: đăng nhập và đăng ký",
      body: "Thêm ba hàm vào `includes/users.php`. `find_user_by_id` dùng cho `current_user()`; `validate_registration` trả lỗi theo tên trường để trang in đúng dưới từng ô.",
      code: { file: "nhip/includes/users.php", lang: "php", content: `/** Kiểm tra tên đăng nhập (tên người dùng HOẶC email) + mật khẩu. Trả id hoặc null. */
function verify_login(string $login, string $password): ?int
{
    $stmt = db()->prepare('SELECT id, password_hash FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$login, $login]);
    $row = $stmt->fetch();

    // Không có người dùng vẫn băm một lần: thời gian trả lời như nhau nên kẻ
    // tấn công không đo được tên nào có thật.
    $hash = $row['password_hash'] ?? password_hash('nhip', PASSWORD_DEFAULT);
    $ok = password_verify($password, $hash);
    if (!$row || !$ok) {
        return null;
    }
    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    }
    return (int) $row['id'];
}

/** Kiểm tra dữ liệu đăng ký. Trả mảng lỗi theo tên trường (rỗng = hợp lệ). */
function validate_registration(array $input): array
{
    $errors = [];
    if (!preg_match('/^[a-z0-9._]{3,30}$/', $input['username'])) {
        $errors['username'] = 'Tên người dùng 3–30 ký tự: chữ thường không dấu, số, dấu chấm, gạch dưới.';
    }
    if (mb_strlen($input['display_name']) < 1 || mb_strlen($input['display_name']) > 60) {
        $errors['display_name'] = 'Tên hiển thị 1–60 ký tự.';
    }
    if (filter_var($input['email'], FILTER_VALIDATE_EMAIL) === false) {
        $errors['email'] = 'Email không hợp lệ.';
    }
    if (strlen($input['password']) < 8 || strlen($input['password']) > 72) {
        $errors['password'] = 'Mật khẩu 8–72 ký tự.';
    } elseif ($input['password'] !== $input['password_confirm']) {
        $errors['password_confirm'] = 'Hai lần nhập mật khẩu không khớp.';
    }
    return $errors;
}

/** Tạo tài khoản. Ném PDOException mã 23000 nếu trùng tên người dùng hoặc email. */
function create_user(array $input): int
{
    $stmt = db()->prepare('
        INSERT INTO users (username, display_name, email, password_hash)
        VALUES (:username, :display_name, :email, :password_hash)');
    $stmt->execute([
        'username'      => $input['username'],
        'display_name'  => $input['display_name'],
        'email'         => $input['email'],
        'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
    ]);
    return (int) db()->lastInsertId();
}` },
    },
    {
      section: "apply",
      title: "register.php",
      body: "Hàm `field()` in một ô nhập kèm lỗi — năm ô, một mẫu. Lỗi trùng từ cơ sở dữ liệu được bắt bằng mã 23000; mọi lỗi khác ném tiếp để không bị giấu.",
      code: { file: "nhip/register.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

if (current_user()) {
    redirect('index.php');
}

$input = ['username' => '', 'display_name' => '', 'email' => '', 'password' => '', 'password_confirm' => ''];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($input as $key => $_) {
        $input[$key] = trim((string) ($_POST[$key] ?? ''));
    }
    $input['username'] = strtolower($input['username']);
    $errors = validate_registration($input);

    if (!$errors) {
        try {
            $id = create_user($input);
            login_user($id);
            flash('Chào mừng bạn đến với Nhịp!');
            redirect('index.php');
        } catch (PDOException $e) {
            if ($e->getCode() !== '23000') {
                throw $e;                    // lỗi khác: không nuốt
            }
            $errors['username'] = 'Tên người dùng hoặc email đã được dùng.';
        }
    }
}

$title = 'Đăng ký';
$active = 'register';` },
    },
    {
      section: "apply",
      title: "login.php, logout.php và flash",
      body: "Thêm hàm `flash()` vào cuối `helpers.php`: ghi một lời nhắn vào phiên, trang kế tiếp đọc và xoá nó. `header.php` hiện lời nhắn và đổi menu theo trạng thái đăng nhập; nút Đăng xuất là một biểu mẫu POST nhỏ.",
      code: { file: "nhip/login.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

if (current_user()) {
    redirect('index.php');
}

$login = '';
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = trim((string) ($_POST['login'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $userId = verify_login($login, $password);
    if ($userId === null) {
        // Không nói rõ sai tên hay sai mật khẩu.
        $error = 'Tên đăng nhập hoặc mật khẩu không đúng.';
    } else {
        login_user($userId);
        redirect('index.php');
    }
}

$title = 'Đăng nhập';
$active = 'login';

// logout.php
<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

// Chỉ nhận POST: một thẻ <img src="logout.php"> trên trang lạ không đăng xuất được bạn.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Phương thức không được phép.');
}
logout_user();
redirect('index.php');` },
    },
    {
      section: "apply",
      title: "Kết quả và tự kiểm",
      image: {
        src: "/image/coding/steps/s12-logged-in.webp",
        alt: "Bảng tin Nhịp khi đã đăng nhập: thanh trên có Bảng tin, Trang cá nhân, Đăng xuất; ô soạn bài Có gì mới? hiện ra",
        caption: "Đăng nhập lan.code / nhip-demo-2026: menu đổi, ô soạn bài hiện ra.",
      },
      body: `Kiểm bằng DevTools:

1. *Console* gõ \`document.cookie\` → chuỗi rỗng. Cookie phiên có nhưng JavaScript không đọc được: \`HttpOnly\` đang làm việc.
2. *Application → Cookies*: \`nhip_session\` có cột **HttpOnly ✓** và **SameSite Lax**.
3. Ghi lại giá trị cookie, đăng xuất, đăng nhập lại: giá trị **khác** — mã phiên đã được đổi.
4. Khi đã đăng xuất, gửi \`curl -d "body=x" http://localhost/nhip/index.php\` → nhận **303** về \`login.php\`, không có bài nào được tạo.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 12",
      body: `- [ ] Đăng ký được tài khoản mới; tên/email trùng báo lỗi đúng ô.
- [ ] Bảng \`users\` chỉ có \`password_hash\` dạng \`$2y$…\`.
- [ ] Đăng nhập bằng tên **hoặc** email; sai thì một câu báo lỗi chung.
- [ ] Khách đọc được bảng tin nhưng không đăng được bài (cả qua biểu mẫu tự dựng).
- [ ] Bài mới mang đúng người đang đăng nhập.
- [ ] \`GET logout.php\` trả 405; nút Đăng xuất (POST) hoạt động.
- [ ] Cookie phiên có HttpOnly + SameSite=Lax và đổi giá trị sau khi đăng nhập.`,
    },
  ],
  quiz: [
    { q: "Hàm nào dùng để lưu mật khẩu người dùng?", o: ["md5($password)", "hash('sha256', $password)", "password_hash($password, PASSWORD_DEFAULT)", "base64_encode($password)"], a: 2, why: "md5/sha256 quá nhanh, base64 chỉ là mã hoá ngược được; password_hash có muối và chi phí." },
    { kind: "truefalse", q: "Hai người dùng cùng mật khẩu sẽ có cùng chuỗi password_hash.", a: false, why: "Mỗi lần băm sinh muối ngẫu nhiên mới." },
    { q: "Cookie phiên chứa gì?", o: ["user_id", "Mật khẩu đã băm", "Một mã phiên ngẫu nhiên; dữ liệu phiên nằm ở máy chủ", "Toàn bộ $_SESSION"], a: 2, why: "Người dùng không sửa được dữ liệu phiên vì nó không ở trình duyệt." },
    { q: "session_regenerate_id(true) khi đăng nhập chặn kiểu tấn công nào?", o: ["SQL Injection", "Cố định phiên (session fixation)", "XSS", "Dò mật khẩu"], a: 1, why: "Mã phiên gài sẵn trước khi đăng nhập trở nên vô dụng." },
    { kind: "multi", q: "Cờ cookie nào Nhịp đặt cho phiên ở step này?", o: ["HttpOnly", "SameSite=Lax", "Secure (chỉ HTTPS)", "Domain=.google.com"], a: [0, 1], why: "Secure bật khi có HTTPS ở step 24; Domain lạ là sai." },
    { kind: "bug", q: "Dòng nào khiến kẻ xấu biết email nào có tài khoản?", lines: ["$row = find_by_email($email);", "if (!$row) { $error = 'Email chưa đăng ký.'; }", "elseif (!password_verify($pw, $row['password_hash'])) { $error = 'Sai mật khẩu.'; }", "else { login_user($row['id']); }"], a: 1, why: "Thông báo phải chung: 'Tên đăng nhập hoặc mật khẩu không đúng.'" },
    { kind: "output", q: "Trình duyệt đang có cookie phiên HttpOnly. Console in gì?", code: "console.log(document.cookie);", o: ["nhip_session=k3f9…", "\"\" (chuỗi rỗng)", "undefined", "Lỗi bảo mật"], a: 1, why: "HttpOnly giấu cookie khỏi JavaScript." },
    { q: "Vì sao bắt PDOException mã 23000 thay vì SELECT kiểm trùng trước?", o: ["Nhanh hơn", "Hai yêu cầu đồng thời có thể cùng lọt qua SELECT; ràng buộc UNIQUE thì không", "PDO bắt buộc", "SELECT không chạy được trên users"], a: 1, why: "Chỉ cơ sở dữ liệu bảo đảm được tính duy nhất dưới truy cập đồng thời." },
    { kind: "blank", q: "Điền hàm kiểm mật khẩu khi đăng nhập.", code: "if (password_______($password, $row['password_hash'])) {", a: "verify", why: "password_verify so mật khẩu với chuỗi băm (đã chứa muối và chi phí)." },
    { q: "Vì sao đăng xuất phải là POST?", o: ["GET bị cấm trong PHP", "Một thẻ <img src=\"logout.php\"> trên trang lạ có thể đăng xuất người dùng ngoài ý muốn", "POST nhanh hơn", "Để xoá cookie"], a: 1, why: "Thao tác thay đổi trạng thái không được kích hoạt bằng GET." },
  ],
};
