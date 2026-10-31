export default {
  id: "step8",
  lang: "php",
  file: "nhip/index.php",
  duration: "150 phút",
  summary: "PHP nền tảng qua chính Nhịp: biến, chuỗi, mảng, hàm có kiểu, include phần dùng chung, đọc biểu mẫu bằng $_POST, kiểm tra ở máy chủ, htmlspecialchars và mẫu Post/Redirect/Get.",
  slides: [
    {
      section: "intro",
      title: "Để PHP vẽ bảng tin",
      body: `Ở chặng 1, JavaScript vẽ bảng tin **trong trình duyệt**. Từ step này, **PHP vẽ bảng tin trên máy chủ** rồi gửi về HTML hoàn chỉnh. Người dùng tắt JavaScript vẫn đọc được; công cụ tìm kiếm đọc được; và quan trọng nhất: bài đăng được gửi **lên máy chủ**, không còn kẹt trong một trình duyệt.

Bạn đã biết lập trình (step 1, 5) — PHP chỉ là cú pháp mới cho các ý cũ: biến, điều kiện, vòng lặp, hàm, mảng.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Đọc/viết cú pháp PHP: biến, kiểu, chuỗi, mảng chỉ số và mảng kết hợp.
2. Viết hàm **có khai báo kiểu** với \`declare(strict_types=1)\`.
3. Tách phần đầu/chân trang dùng chung bằng \`require\`.
4. Nhận dữ liệu biểu mẫu qua \`$_POST\`, tham số địa chỉ qua \`$_GET\`.
5. **Kiểm tra lại ở máy chủ** và in chữ người dùng an toàn bằng \`htmlspecialchars\`.
6. Áp dụng mẫu **Post/Redirect/Get** để tải lại trang không đăng trùng.
7. Lưu tạm bài vào tệp JSON — và hiểu vì sao cách này không đủ cho mạng xã hội.`,
    },
    {
      section: "visual",
      title: "Một yêu cầu, một lần chạy",
      visual: "php-request",
      body: `Mỗi lần trình duyệt gọi \`index.php\`, PHP **chạy tệp từ dòng đầu tới dòng cuối**, in ra HTML rồi **quên sạch**: biến không sống sang lần tải sau. Thứ gì cần nhớ lâu hơn một yêu cầu phải nằm ở chỗ khác — tệp, cơ sở dữ liệu (step 11) hoặc phiên đăng nhập (step 12).

Đây là mô hình "không trạng thái" (stateless) của HTTP mà bạn học ở step 2, giờ nhìn từ phía máy chủ.`,
    },
    {
      section: "visual",
      title: "Post/Redirect/Get",
      visual: "prg-flow",
      body: `Gửi biểu mẫu bằng POST rồi trả HTML ngay thì khi người dùng bấm F5, trình duyệt hỏi *"Gửi lại biểu mẫu?"* và bài bị đăng **hai lần**.

Cách chuẩn: xử lý POST xong thì trả **303 See Other** kèm \`Location: index.php\`; trình duyệt tự gọi GET trang đó. Tải lại lúc này chỉ lặp lại GET — vô hại.`,
    },
    {
      section: "research",
      title: "Nguồn chuẩn của PHP",
      body: `Tài liệu chính thức của PHP là **PHP Manual** do The PHP Group duy trì; mỗi hàm có trang riêng ghi rõ kiểu tham số, giá trị trả về và từ phiên bản nào. Thói quen của lập trình viên chuyên nghiệp: gặp hàm lạ thì mở \`php.net/tên_hàm\` (ví dụ \`php.net/htmlspecialchars\`).

Về phong cách viết mã, cộng đồng PHP thống nhất theo **PSR-12** của PHP-FIG: thụt lề 4 dấu cách, ngoặc nhọn của hàm xuống dòng, khai báo \`strict_types\` ngay sau \`<?php\`. Mã trong khoá này theo PSR-12.

> The PHP Group (2025) *PHP Manual*. Available at: https://www.php.net/manual/en/
>
> PHP Framework Interop Group (2019) *PSR-12: Extended Coding Style*. Available at: https://www.php-fig.org/psr/psr-12/`,
    },
    {
      section: "research",
      title: "Không tin dữ liệu từ máy khách",
      body: `Thuộc tính \`required\`, \`maxlength\` trong HTML và mọi kiểm tra bằng JavaScript **chỉ giúp người dùng** — kẻ xấu gửi thẳng yêu cầu HTTP (bằng \`curl\`, Postman, DevTools) là vượt qua hết. OWASP xếp việc kiểm tra đầu vào **ở phía máy chủ** vào danh sách kiểm soát chủ động hàng đầu.

Mẫu Post/Redirect/Get được mô tả lần đầu như một mẫu thiết kế web năm 2003 và nay là cách làm mặc định của mọi framework.

> OWASP Foundation (2024) *OWASP Top 10 Proactive Controls: C3 Validate all Input & Handle Exceptions*. Available at: https://top10proactive.owasp.org/
>
> Fielding, R., Nottingham, M. and Reschke, J. (2022) *RFC 9110: HTTP Semantics*, §15.4.4 303 See Other. IETF. Available at: https://www.rfc-editor.org/rfc/rfc9110`,
    },
    {
      section: "ideate",
      title: "Từ một tệp HTML thành nhiều mảnh",
      body: `\`index.html\` và \`profile.html\` của chặng 1 lặp lại y hệt phần \`<head>\` và thanh điều hướng. Sửa menu là phải sửa hai nơi. Kế hoạch:

| Tệp | Vai trò |
|---|---|
| \`includes/helpers.php\` | Hàm dùng chung: \`e()\`, \`time_ago()\`, \`check_post()\`, \`redirect()\` |
| \`includes/header.php\` / \`footer.php\` | Đầu và chân trang |
| \`includes/post.php\` | Mẫu **một** thẻ bài đăng |
| \`includes/storage.php\` | Đọc/ghi bài (tạm bằng JSON) |
| \`index.php\`, \`profile.php\` | Mỗi trang chỉ còn phần riêng của nó |

Thư mục \`includes/\` chứa mã **không** mở trực tiếp bằng trình duyệt; chặng 5 sẽ đưa nó hẳn ra ngoài vùng công khai.`,
    },
    {
      section: "core",
      title: "Biến và kiểu",
      body: `~~~php
<?php
$name   = 'lan.code';     // string
$likes  = 3;              // int
$ratio  = 0.75;           // float
$liked  = true;           // bool
$avatar = null;           // null: "chưa có giá trị"

var_dump($likes);         // int(3) — xem kiểu và giá trị khi gỡ lỗi
echo gettype($ratio);     // double
~~~

- Biến bắt đầu bằng \`$\`, phân biệt hoa thường (\`$Name\` ≠ \`$name\`).
- PHP tự đổi kiểu khi so sánh lỏng \`==\`: \`"1" == 1\` là \`true\`, \`"abc" == 0\` là \`false\` (từ PHP 8). Luôn dùng **\`===\`** như ở JavaScript.`,
    },
    {
      section: "core",
      title: "Chuỗi",
      body: `~~~php
$user = 'lan.code';
echo 'Xin chào $user';         // Xin chào $user   — nháy đơn: không thay biến
echo "Xin chào $user";         // Xin chào lan.code — nháy kép: thay biến
echo 'Xin chào ' . $user;      // nối chuỗi bằng dấu chấm, không phải dấu +
echo "Bài số {$post['id']}";   // phần tử mảng trong nháy kép: bọc {}

strlen('Nhịp');      // 6  — đếm BYTE, chữ "ị" chiếm 3 byte
mb_strlen('Nhịp');   // 4  — đếm KÝ TỰ, luôn dùng cho tiếng Việt
trim("  hi  ");      // "hi"
~~~

Giới hạn 500 ký tự của bài đăng phải đo bằng \`mb_strlen\`, nếu không bài tiếng Việt bị chặn sớm hơn bài tiếng Anh.`,
    },
    {
      section: "core",
      title: "Mảng: danh sách và từ điển",
      body: `~~~php
$tags = ['php', 'sql', 'css'];          // mảng chỉ số: 0, 1, 2
$tags[] = 'js';                          // thêm vào cuối
echo count($tags);                       // 4

$post = [                                // mảng kết hợp: khoá => giá trị
    'id' => 1,
    'author' => 'lan.code',
    'likes' => 3,
];
echo $post['author'];                    // lan.code
$post['likes']++;                        // 4

foreach ($tags as $i => $tag) { echo "$i: $tag\\n"; }
foreach ($post as $key => $value) { /* ... */ }
~~~

Một bài đăng là **mảng kết hợp**, bảng tin là **mảng các mảng kết hợp** — giống mảng các đối tượng ở step 5, và cũng là dạng mà PDO trả về ở step 11.`,
    },
    {
      section: "core",
      title: "Hàm có kiểu và strict_types",
      body: `~~~php
<?php
declare(strict_types=1);          // dòng đầu tiên sau <?php

function check_post(string $body): ?string
{
    $body = trim($body);
    if ($body === '') {
        return 'Hãy viết gì đó.';
    }
    return null;                  // ?string: trả chuỗi HOẶC null
}

check_post(123);  // TypeError: phải truyền string
~~~

- Kiểu tham số và kiểu trả về giúp PHP **báo lỗi sớm** thay vì âm thầm ép kiểu.
- \`strict_types\` có hiệu lực **trong tệp khai báo nó** — vì vậy mọi tệp \`.php\` của Nhịp đều mở đầu bằng dòng này.
- Hàm mũi tên: \`fn (array $p): bool => $p['author'] === $username\` — giống \`(p) => ...\` của JavaScript.`,
    },
    {
      section: "core",
      title: "include, require và __DIR__",
      body: `~~~php
require __DIR__ . '/includes/helpers.php';
~~~

| Lệnh | Không thấy tệp |
|---|---|
| \`include\` | Cảnh báo, chạy tiếp |
| \`require\` | Lỗi nghiêm trọng, dừng hẳn |

Tệp hàm, tệp cấu hình thiếu thì trang không thể đúng → luôn dùng **\`require\`**. \`require_once\` chỉ nạp một lần dù gọi nhiều lần — cần khi nhiều tệp cùng nạp một thư viện.

\`__DIR__\` là thư mục chứa tệp **đang chạy dòng đó**. Viết \`__DIR__ . '/includes/...'\` thì đường dẫn đúng bất kể trang được gọi từ đâu; viết \`'includes/...'\` trơn sẽ hỏng khi cấu trúc thư mục đổi ở chặng 5.`,
    },
    {
      section: "core",
      title: "Cú pháp xen kẽ cho giao diện",
      body: `Trong tệp chứa nhiều HTML, viết vòng lặp và điều kiện kiểu **xen kẽ** để không lạc giữa các dấu \`{ }\`:

~~~php
<?php foreach ($posts as $post): ?>
  <?php require __DIR__ . '/includes/post.php'; ?>
<?php endforeach; ?>

<?php if ($error !== null): ?>
  <p class="form-error" role="alert"><?= e($error) ?></p>
<?php endif; ?>
~~~

Quy tắc giữ cho mã gọn: **xử lý ở đầu tệp, in ở cuối tệp**. Phần trên tính toán biến (\`$posts\`, \`$error\`), phần dưới chỉ có HTML, \`<?= ?>\`, \`foreach\` và \`if\`. Đây là mầm của kiến trúc MVC ở step 20.`,
    },
    {
      section: "core",
      title: "$_GET, $_POST và $_SERVER",
      body: `PHP đưa dữ liệu của yêu cầu vào các mảng **siêu toàn cục**:

| Biến | Chứa | Ví dụ trong Nhịp |
|---|---|---|
| \`$_GET\` | Tham số trên địa chỉ \`?u=lan.code\` | \`profile.php?u=lan.code\` |
| \`$_POST\` | Trường của biểu mẫu \`method="post"\` | nội dung bài \`$_POST['body']\` |
| \`$_SERVER\` | Thông tin yêu cầu | \`$_SERVER['REQUEST_METHOD']\` là \`GET\` hay \`POST\` |

Khoá có thể **không tồn tại** (ai đó gửi biểu mẫu thiếu trường). Luôn đọc kiểu an toàn:

~~~php
$body = (string) ($_POST['body'] ?? '');
~~~

\`??\` trả vế phải khi vế trái không có hoặc là null; \`(string)\` ép về chuỗi kể cả khi kẻ xấu gửi mảng \`body[]=...\`.`,
    },
    {
      section: "core",
      title: "htmlspecialchars: e() của Nhịp",
      body: `In chữ người dùng gõ thẳng ra HTML là lỗ hổng XSS — giống \`innerHTML\` ở step 6, chỉ là lần này ở máy chủ. Hàm chuẩn của PHP:

~~~php
htmlspecialchars('<b>hi</b>', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
// &lt;b&gt;hi&lt;/b&gt;
~~~

- \`ENT_QUOTES\`: đổi cả \`'\` và \`"\` — bắt buộc khi in vào thuộc tính \`value="..."\`.
- \`ENT_SUBSTITUTE\`: chuỗi UTF-8 hỏng không làm hàm trả rỗng.

Gõ cả dòng này mỗi lần thì sẽ có lúc quên, nên Nhịp bọc nó thành hàm ngắn **\`e()\`**. Quy tắc từ đây tới hết khoá: **mọi giá trị in ra HTML đều đi qua \`e()\`**, trừ số đã ép \`(int)\`.`,
    },
    {
      section: "core",
      title: "Lưu tạm bằng tệp JSON",
      body: `Chưa có cơ sở dữ liệu, ta lưu bài vào \`data/posts.json\`:

~~~php
$posts = json_decode(file_get_contents($file), true);  // true: ra mảng kết hợp
file_put_contents($file, json_encode($posts, JSON_UNESCAPED_UNICODE), LOCK_EX);
~~~

- \`JSON_UNESCAPED_UNICODE\` giữ chữ "Nhịp" thay vì \`"Nh\\u1ecbp"\`.
- \`LOCK_EX\` khoá tệp trong lúc ghi để hai người đăng cùng lúc không ghi chồng nửa chừng.

Đây chỉ là bước đệm: cách này **không tìm kiếm được, không phân trang được, đọc cả tệp mỗi lần** và không có quan hệ giữa người dùng với bài. Step 9–11 thay bằng MySQL.`,
    },
    {
      section: "apply",
      title: "helpers.php",
      body: "Tạo `nhip/includes/helpers.php`. Kiểu trả về `never` của `redirect()` (PHP 8.1+) nói rõ hàm này không bao giờ quay lại — `exit` chặn mọi dòng phía sau.",
      code: { file: "nhip/includes/helpers.php", lang: "php", content: `<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Ho_Chi_Minh');

const MAX_LENGTH = 500;

/** In chữ ra HTML an toàn: < > & " ' thành thực thể, không bao giờ chạy như mã. */
function e(?string $text): string
{
    return htmlspecialchars($text ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** "3 phút trước", "2 giờ trước" — cùng ý với timeAgo() ở chặng 1. */
function time_ago(string $datetime): string
{
    $seconds = time() - strtotime($datetime);
    if ($seconds < 60) {
        return 'vừa xong';
    }
    if ($seconds < 3600) {
        return intdiv($seconds, 60) . ' phút trước';
    }
    if ($seconds < 86400) {
        return intdiv($seconds, 3600) . ' giờ trước';
    }
    return date('d/m/Y', strtotime($datetime));
}

/** Kiểm tra nội dung bài: trả chuỗi lỗi, hoặc null nếu hợp lệ. */
function check_post(string $body): ?string
{
    $body = trim($body);
    if ($body === '') {
        return 'Hãy viết gì đó.';
    }
    if (mb_strlen($body) > MAX_LENGTH) {
        return 'Tối đa ' . MAX_LENGTH . ' ký tự.';
    }
    return null;
}

/** Chuyển hướng rồi dừng hẳn — không để mã phía dưới chạy tiếp. */
function redirect(string $url): never
{
    header('Location: ' . $url, true, 303);
    exit;
}` },
    },
    {
      section: "apply",
      title: "Đầu trang, chân trang, thẻ bài",
      body: "`header.php` dùng hai biến `$title` và `$active` do trang gọi nó gán trước. `post.php` in một bài từ biến `$post`. Tên người dùng trên địa chỉ đi qua `urlencode`, trong HTML đi qua `e()`.",
      code: { file: "nhip/includes/header.php + post.php", lang: "php", content: `<?php
/** @var string $title  tiêu đề trang
 *  @var string $active trang đang mở: 'feed' | 'profile' */
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($title) ?> · Nhịp</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="topbar">
    <a href="index.php" class="logo">Nhịp</a>
    <nav aria-label="Điều hướng chính">
      <a href="index.php" <?= $active === 'feed' ? 'aria-current="page"' : '' ?>>Bảng tin</a>
      <a href="profile.php?u=lan.code" <?= $active === 'profile' ? 'aria-current="page"' : '' ?>>Trang cá nhân</a>
    </nav>
  </header>

<!-- includes/post.php -->
<?php /** @var array $post một bài đăng */ ?>
<article class="post">
  <img class="avatar" src="img/avatar.svg" alt="" width="40" height="40">
  <div class="post-body">
    <header class="post-head">
      <a class="author" href="profile.php?u=<?= urlencode($post['author']) ?>"><?= e($post['author']) ?></a>
      <time datetime="<?= e($post['created_at']) ?>"><?= time_ago($post['created_at']) ?></time>
    </header>
    <p class="post-text"><?= e($post['body']) ?></p>
    <footer class="post-actions">
      <span class="like-count">♥ <?= (int) $post['likes'] ?></span>
    </footer>
  </div>
</article>` },
    },
    {
      section: "apply",
      title: "storage.php",
      body: "Ba hàm đọc, ghi, thêm bài, và `newest_first` thay cho `newestFirst()` của chặng 1. `usort` sắp xếp tại chỗ; `strcmp` so được ngày vì định dạng `Y-m-d H:i:s` xếp theo chữ cũng là xếp theo thời gian.",
      code: { file: "nhip/includes/storage.php", lang: "php", content: `<?php
declare(strict_types=1);

// Lưu tạm bài đăng vào một tệp JSON — chỉ dùng ở step 8, step 11 thay bằng MySQL.
const POSTS_FILE = __DIR__ . '/../data/posts.json';

function load_posts(): array
{
    if (!is_file(POSTS_FILE)) {
        return [];
    }
    $posts = json_decode(file_get_contents(POSTS_FILE), true);
    return is_array($posts) ? $posts : [];
}

function save_posts(array $posts): void
{
    $json = json_encode($posts, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    file_put_contents(POSTS_FILE, $json, LOCK_EX);
}

function add_post(string $author, string $body): void
{
    $posts = load_posts();
    $ids = array_column($posts, 'id');
    $posts[] = [
        'id' => ($ids ? max($ids) : 0) + 1,
        'author' => $author,
        'body' => trim($body),
        'created_at' => date('Y-m-d H:i:s'),
        'likes' => 0,
    ];
    save_posts($posts);
}

/** Mới nhất trước — giống newestFirst() ở chặng 1. */
function newest_first(array $posts): array
{
    usort($posts, fn (array $a, array $b): int => strcmp($b['created_at'], $a['created_at']));
    return $posts;
}` },
    },
    {
      section: "apply",
      title: "index.php: bảng tin + đăng bài",
      body: "Xoá `index.html`, tạo `index.php`. Đầu tệp xử lý POST, cuối tệp in giao diện. Khi có lỗi, ô soạn bài giữ lại chữ người dùng đã gõ (qua `e($body)`) để họ không phải gõ lại.",
      code: { file: "nhip/index.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/helpers.php';
require __DIR__ . '/includes/storage.php';

const ME = 'lan.code';   // chưa có đăng nhập: step 12 thay bằng người dùng thật

$error = null;
$body = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = (string) ($_POST['body'] ?? '');
    $error = check_post($body);
    if ($error === null) {
        add_post(ME, $body);
        redirect('index.php');      // Post/Redirect/Get: tải lại trang không đăng trùng
    }
}

$posts = newest_first(load_posts());
$title = 'Bảng tin';
$active = 'feed';
require __DIR__ . '/includes/header.php';
?>
  <main class="feed">
    <h1 class="visually-hidden">Bảng tin</h1>

    <form class="composer" method="post" action="index.php">
      <label for="body">Có gì mới?</label>
      <textarea id="body" name="body" rows="3" maxlength="<?= MAX_LENGTH ?>" required
                placeholder="Bạn đang nghĩ gì?"><?= e($body) ?></textarea>
      <?php if ($error !== null): ?>
        <p class="form-error" role="alert"><?= e($error) ?></p>
      <?php endif; ?>
      <div class="composer-foot">
        <span><?= MAX_LENGTH ?> ký tự</span>
        <button type="submit">Đăng</button>
      </div>
    </form>

    <section aria-label="Bài mới nhất" id="posts">
      <?php foreach ($posts as $post): ?>
        <?php require __DIR__ . '/includes/post.php'; ?>
      <?php endforeach; ?>
      <?php if (!$posts): ?>
        <p class="empty">Chưa có bài nào. Hãy là người đầu tiên!</p>
      <?php endif; ?>
    </section>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>` },
    },
    {
      section: "apply",
      title: "profile.php đọc ?u=",
      body: "Trang cá nhân lọc bài theo tên người dùng trên địa chỉ. Thử `profile.php?u=minh.dev`, rồi `profile.php?u=<b>x</b>` — nhờ `e()` thẻ `<b>` hiện ra như chữ.",
      code: { file: "nhip/profile.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/helpers.php';
require __DIR__ . '/includes/storage.php';

$username = (string) ($_GET['u'] ?? '');
$posts = array_filter(load_posts(), fn (array $p): bool => $p['author'] === $username);
$posts = newest_first($posts);

$title = '@' . $username;
$active = 'profile';
require __DIR__ . '/includes/header.php';
?>
  <main class="profile">
    <header class="profile-head">
      <div>
        <h1>@<?= e($username) ?></h1>
        <p class="stats"><strong><?= count($posts) ?></strong> bài viết</p>
      </div>
      <img class="avatar-lg" src="img/avatar.svg" alt="" width="72" height="72">
    </header>

    <section aria-labelledby="posts-title">
      <h2 id="posts-title">Bài viết</h2>
      <?php foreach ($posts as $post): ?>
        <?php require __DIR__ . '/includes/post.php'; ?>
      <?php endforeach; ?>
    </section>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>` },
    },
    {
      section: "apply",
      title: "Kết quả: bảng tin do PHP vẽ",
      image: {
        src: "/image/coding/steps/s08-feed.webp",
        alt: "Bảng tin Nhịp với ô soạn bài Có gì mới? và ba bài: Bài đầu tiên gửi lên máy chủ PHP! vừa xong, Box model 11 giờ trước, CSS flexbox 17 giờ trước",
        caption: "http://localhost/nhip/ sau khi đăng một bài. Tải lại trang: bài vẫn còn, không bị đăng trùng.",
      },
      body: "Đăng một bài rồi mở `data/posts.json` bằng VS Code: bài mới nằm cuối tệp. Mở trang trên điện thoại cùng mạng Wi-Fi (bằng IP của máy) cũng thấy bài đó — lần đầu tiên dữ liệu Nhịp được chia sẻ.",
    },
    {
      section: "apply",
      title: "Máy chủ chặn bài trống",
      image: {
        src: "/image/coding/steps/s08-error.webp",
        alt: "Ô soạn bài trống với dòng chữ đỏ Hãy viết gì đó. phía trên nút Đăng",
        caption: "Gõ toàn dấu cách rồi bấm Đăng: required của HTML cho qua, check_post() ở máy chủ chặn lại.",
      },
      body: `Thử vượt kiểm tra phía trình duyệt: trong DevTools → Elements, xoá thuộc tính \`maxlength\` của textarea, dán 600 ký tự rồi Đăng. Máy chủ vẫn trả *"Tối đa 500 ký tự."* — đó là lý do kiểm tra **phải** nằm ở PHP.`,
    },
    {
      section: "apply",
      title: "Lỗ hổng bạn vừa tạo",
      image: {
        src: "/image/coding/steps/s08-json.webp",
        alt: "Trình duyệt mở http://localhost/nhip/data/posts.json và hiện toàn bộ nội dung tệp JSON gồm các bài đăng",
        caption: "Ai biết địa chỉ cũng tải được toàn bộ dữ liệu — vì data/ nằm trong htdocs.",
      },
      body: `Mở \`http://localhost/nhip/data/posts.json\`: cả cơ sở dữ liệu tạm hiện ra. Mọi thứ trong htdocs đều **công khai**. Tạm chặn bằng tệp \`data/.htaccess\` một dòng:

~~~apache
Require all denied
~~~

Tải lại: Apache trả **403 Forbidden**. Bài học này quay lại ở step 20 (chỉ để thư mục \`public/\` trong vùng công khai) và step 24 (tệp cấu hình trên hosting).`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 8",
      body: `- [ ] \`index.html\`, \`profile.html\` đã thay bằng \`index.php\`, \`profile.php\`; menu chỉ còn ở \`header.php\`.
- [ ] Đăng bài được; F5 sau khi đăng **không** tạo bài trùng (mở DevTools → Network thấy 303 rồi 200).
- [ ] Bài trống / quá 500 ký tự bị **máy chủ** chặn, chữ đã gõ được giữ lại.
- [ ] Đăng bài \`<script>alert(1)</script>\`: hiện nguyên văn, không có hộp thoại.
- [ ] \`data/posts.json\` trả 403 khi mở bằng trình duyệt.
- [ ] Mọi tệp PHP mở đầu bằng \`declare(strict_types=1);\` (trừ tệp giao diện thuần).`,
    },
  ],
  quiz: [
    { kind: "output", q: "Chuỗi nháy đơn này in ra gì?", code: "$user = 'lan';\necho 'Chào $user';", o: ["Chào lan", "Chào $user", "Chào", "Lỗi"], a: 1, why: "Chuỗi nháy đơn không thay biến; dùng nháy kép hoặc nối bằng dấu chấm." },
    { q: "Toán tử nối chuỗi trong PHP là gì?", o: ["+", ".", "&", "concat"], a: 1, why: "'a' . 'b' cho 'ab'; dấu + là phép cộng số." },
    { kind: "output", q: "Kết quả là gì?", code: "echo mb_strlen('Nhịp');", o: ["4", "6", "5", "3"], a: 0, why: "mb_strlen đếm ký tự; strlen mới đếm byte (6)." },
    { q: "Vì sao luôn đọc biểu mẫu bằng (string) ($_POST['body'] ?? '')?", o: ["Cho nhanh hơn", "Trường có thể thiếu hoặc bị gửi dạng mảng; ?? và (string) giữ kiểu an toàn", "Bắt buộc theo HTML", "Để mã hoá dữ liệu"], a: 1, why: "Không bao giờ giả định máy khách gửi đúng dạng." },
    { kind: "truefalse", q: "Có maxlength=\"500\" trên textarea thì máy chủ không cần kiểm tra độ dài nữa.", a: false, why: "Gửi thẳng yêu cầu HTTP là vượt qua mọi kiểm tra phía trình duyệt." },
    { kind: "order", q: "Sắp xếp luồng Post/Redirect/Get khi đăng bài.", items: ["Trình duyệt gửi POST index.php", "PHP kiểm tra và lưu bài", "Máy chủ trả 303 kèm Location: index.php", "Trình duyệt tự gửi GET index.php"], a: [0, 1, 2, 3], why: "Sau 303, tải lại trang chỉ lặp lại GET nên không đăng trùng." },
    { kind: "bug", q: "Trong mẫu PHP này, dòng nào tạo lỗ hổng XSS?", lines: ["<?php foreach ($posts as $post): ?>", "<p><?= $post['body'] ?></p>", "<span><?= (int) $post['likes'] ?></span>", "<?php endforeach; ?>"], a: 1, why: "Chữ người dùng phải qua e() (htmlspecialchars) trước khi in." },
    { q: "Khác nhau giữa include và require khi không tìm thấy tệp?", o: ["Không khác", "include cảnh báo và chạy tiếp; require dừng hẳn", "require cảnh báo; include dừng", "include chỉ nạp một lần"], a: 1, why: "Tệp hàm/cấu hình là bắt buộc nên dùng require." },
    { kind: "multi", q: "Hạn chế nào khiến tệp JSON không đủ cho mạng xã hội?", o: ["Phải đọc cả tệp mỗi lần", "Khó tìm kiếm, phân trang", "Không thể hiện quan hệ người dùng – bài – lượt thích", "Không lưu được tiếng Việt"], a: [0, 1, 2], why: "JSON lưu được tiếng Việt (JSON_UNESCAPED_UNICODE), nhưng không phải một hệ quản trị dữ liệu." },
    { kind: "blank", q: "Điền hằng số magic chỉ thư mục chứa tệp đang chạy.", code: "require ___ . '/includes/helpers.php';", a: "__DIR__", why: "__DIR__ giữ đường dẫn đúng bất kể trang được gọi từ đâu." },
  ],
};
