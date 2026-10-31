export default {
  id: "step20",
  lang: "php",
  file: "nhip/src/router.php",
  duration: "180 phút",
  summary: "Tổ chức lại Nhịp theo MVC gọn: tách public/ làm web root, src/ chứa logic và view, config ra ngoài vùng công khai; front controller + router cho URL sạch; và đưa dự án vào Git với .gitignore.",
  slides: [
    {
      section: "intro",
      title: "Từ \"chạy được\" sang \"bảo trì được\"",
      body: `Nhịp đã an toàn và đủ tính năng. Nhưng mã đang nằm phẳng: 12 tệp \`.php\` ở gốc, ai gõ \`/config.php\` là tải được tệp cấu hình, và mỗi liên kết viết cứng \`post.php?id=5\`.

Chặng 5 đưa Nhịp từ "chạy được" sang "bảo trì được và đáng dùng". Step đầu tiên là **cấu trúc**: nơi nào để tệp gì, ai được truy cập nơi nào, và mọi yêu cầu đi vào bằng **một cửa**. Đây là bước refactor lớn nhất khoá học — chức năng không đổi, nhưng mã sạch hẳn.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu mẫu **MVC** và ánh xạ nó vào Nhịp (Model = \`src/*.php\`, View = \`src/views/\`, Controller = \`src/pages/\`).
2. Tách **web root** chỉ còn \`public/\`; đưa \`config.php\`, \`src/\` **ra ngoài** vùng công khai.
3. Viết **front controller** (\`public/index.php\`) + **router**: URL sạch như \`/post/5\`, \`/u/lan.code\`.
4. Dùng \`.htaccess\` chuyển mọi yêu cầu (trừ tệp tĩnh) về front controller.
5. Dựng URL bằng hàm \`url('post', ['id' => 5])\` thay vì viết cứng.
6. Đưa dự án vào **Git** với \`.gitignore\` loại bí mật và tệp người dùng.`,
    },
    {
      section: "visual",
      title: "MVC trong Nhịp",
      visual: "mvc-layers",
      body: `**MVC** chia mã theo **trách nhiệm**:

- **Model** — dữ liệu và quy tắc nghiệp vụ: \`src/posts.php\`, \`users.php\`, \`likes.php\`… (câu SQL, kiểm tra). Không biết gì về HTML.
- **View** — hiển thị: \`src/views/header.php\`, \`post.php\`, \`footer.php\`. Chỉ in HTML từ dữ liệu được đưa vào.
- **Controller** — điều phối: \`src/pages/feed.php\`, \`login.php\`… Đọc yêu cầu, gọi Model, chọn View.

Thực ra Nhịp đã theo tinh thần này từ step 11 ("trang không viết SQL, hàm SQL không in HTML"). Step này chỉ **đặt tên và sắp chỗ** cho đúng, thêm router làm người gác cửa.`,
    },
    {
      section: "visual",
      title: "Một cửa vào duy nhất",
      visual: "front-controller",
      body: `Trước: mỗi trang là một tệp \`.php\` truy cập trực tiếp — \`login.php\`, \`post.php\`… Mỗi tệp phải tự \`require bootstrap\`, và tệp nào quên là một lỗ hổng.

Sau: **mọi** yêu cầu vào \`public/index.php\` (front controller). Nó nạp \`bootstrap\` **một lần**, rồi **router** khớp đường dẫn với bảng tuyến và gọi đúng controller trong \`src/pages/\`.

Lợi ích: một chỗ áp dụng bảo mật (CSRF, phiên, tiêu đề) cho tất cả; controller không nằm trong web root nên không gọi trực tiếp được; URL tách khỏi tên tệp.`,
    },
    {
      section: "research",
      title: "MVC và Front Controller",
      body: `MVC ra đời từ Smalltalk-80 (Reenskaug & Trygve, 1979) để tách giao diện khỏi dữ liệu. **Front Controller** là một mẫu của Fowler (2002): dồn mọi yêu cầu qua một điểm xử lý chung để tập trung điều phối và các mối quan tâm xuyên suốt (bảo mật, log).

Mọi khung PHP hiện đại (Laravel, Symfony) đều dựng trên đúng hai mẫu này: một \`public/index.php\` + một bảng tuyến. Hiểu Nhịp làm thủ công giúp bạn hiểu khung làm gì bên trong.

> Fowler, M. (2002) *Patterns of Enterprise Application Architecture*. Boston: Addison-Wesley. (Front Controller, pp. 344–351)
>
> Reenskaug, T. (1979) *Models–Views–Controllers*. Technical note, Xerox PARC.`,
    },
    {
      section: "research",
      title: "Web root tối thiểu và PSR",
      body: `OWASP (A01/A05 Misconfiguration) khuyến nghị **chỉ** đặt tệp cần phục vụ công khai trong web root; mã nguồn, cấu hình, thư viện phải nằm **ngoài**. Cấu trúc \`public/\` + \`src/\` là cách chuẩn đạt điều đó — nếu PHP "sập" (hiện mã nguồn thay vì chạy), kẻ tấn công cũng không thấy \`config.php\`.

Cộng đồng PHP (PHP-FIG) chuẩn hoá cách tổ chức và tự động nạp mã qua các khuyến nghị **PSR** — PSR-4 cho autoload, PSR-12 cho phong cách. Nhịp theo PSR-12; autoload để lại cho khi dùng Composer.

> OWASP Foundation (2025) *A02:2025 – Security Misconfiguration*. Available at: https://top10.owasp.org/2025/
>
> PHP Framework Interop Group (2013) *PSR-4: Autoloader*. Available at: https://www.php-fig.org/psr/psr-4/`,
    },
    {
      section: "ideate",
      title: "Cấu trúc thư mục mới",
      body: `~~~text
nhip/
├── public/              ← WEB ROOT (chỉ đây công khai)
│   ├── index.php        ← front controller
│   ├── .htaccess        ← chuyển mọi yêu cầu về index.php
│   ├── css/  js/  img/  uploads/
├── src/                 ← mã nguồn (NGOÀI web root)
│   ├── bootstrap.php  router.php
│   ├── db.php  posts.php  users.php … (Model + hạ tầng)
│   ├── pages/           ← Controller: feed, login, post…
│   └── views/           ← View: header, footer, post
├── config.php           ← bí mật, NGOÀI web root, .gitignore
├── config.sample.php
├── database/  SECURITY.md
├── .gitignore
~~~

Trên hosting (step 24), bạn trỏ "document root" của tên miền vào \`public/\` — phần còn lại tự động nằm ngoài tầm với của trình duyệt.`,
    },
    {
      section: "core",
      title: "Bảng tuyến",
      body: `~~~php
const ROUTES = [
    ['GET',  '/',             'feed',    'feed'],
    ['POST', '/posts',        'feed',    'posts.create'],
    ['GET',  '/post/{id}',    'post',    'post'],
    ['POST', '/post/{id}',    'post',    'post.reply'],
    ['GET',  '/u/{username}',  'profile', 'profile'],
    // …
];
~~~

Mỗi tuyến: **[phương thức, mẫu đường dẫn, tên tệp controller, tên tuyến]**.

- Cùng một đường dẫn, khác phương thức → controller khác việc: \`GET /post/5\` xem bài, \`POST /post/5\` thêm trả lời.
- \`{id}\`, \`{username}\` là **tham số** — controller đọc bằng \`route_param('id')\`.
- **Tên tuyến** (\`post.reply\`) để dựng URL mà không phụ thuộc đường dẫn cụ thể: đổi \`/post/{id}\` thành \`/bai/{id}\` chỉ sửa một dòng, mọi liên kết tự đúng.`,
    },
    {
      section: "core",
      title: "Khớp yêu cầu với tuyến",
      body: `~~~php
function dispatch(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = '/' . ltrim(substr($path, strlen(base_path())), '/');  // bỏ phần /nhip/public

    foreach (ROUTES as [$m, $pattern, $page, $name]) {
        $regex = '#^' . preg_replace('/\\{(\\w+)\\}/', '(?<$1>[^/]+)', $pattern) . '$#';
        if ($m === $method && preg_match($regex, $path, $params)) {
            $GLOBALS['route_params'] = $params;
            require __DIR__ . '/pages/' . $page . '.php';
            return;
        }
    }
    abort(404, 'Trang không tồn tại.');
}
~~~

\`{id}\` được đổi thành nhóm bắt \`(?<id>[^/]+)\` — \`preg_match\` điền \`$params['id']\`. Không khớp tuyến nào → **404** (fail-safe: mặc định từ chối).`,
    },
    {
      section: "core",
      title: "Dựng URL bằng tên tuyến",
      body: `~~~php
url('feed')                        // /nhip/public/
url('post', ['id' => 5])           // /nhip/public/post/5
url('profile', ['username' => 'lan.code'])   // /nhip/public/u/lan.code
url('feed', ['tab' => 'following']) // /nhip/public/?tab=following
~~~

\`url()\` tìm tuyến theo tên, thay \`{id}\` bằng giá trị (đã \`rawurlencode\`), tham số thừa thành chuỗi truy vấn \`?...\`.

\`base_path()\` tự suy từ \`dirname($_SERVER['SCRIPT_NAME'])\` nên **không viết cứng** \`/nhip/public\`: chạy được ở bất kỳ thư mục con nào, và ở gốc tên miền khi lên hosting. Mọi \`href\`, \`action\`, \`redirect\` giờ gọi \`url()\`; tài nguyên tĩnh gọi \`asset('css/style.css')\`.`,
    },
    {
      section: "core",
      title: "Front controller và .htaccess",
      body: `~~~php
// public/index.php — cả ứng dụng vào đây
require __DIR__ . '/../src/bootstrap.php';
dispatch();
~~~

~~~apache
# public/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f      # không phải tệp thật…
RewriteCond %{REQUEST_FILENAME} !-d      # …cũng không phải thư mục thật
RewriteRule ^ index.php [L]              # → đưa về front controller
~~~

Hai \`RewriteCond\` cho \`css/style.css\`, ảnh, \`uploads/\` được phục vụ **trực tiếp** (nhanh, không qua PHP); mọi đường dẫn còn lại (\`/post/5\`, \`/login\`) đi vào \`index.php\`.

Trên máy chủ PHP built-in (\`php -S\`) không đọc \`.htaccess\` — khi phát triển dùng \`php -S localhost:8000 -t public\` kèm một router script nhỏ làm việc tương đương (xem README).`,
    },
    {
      section: "core",
      title: "Controller gọn hơn hẳn",
      body: `Mỗi controller trong \`src/pages/\` giờ **không** còn \`require bootstrap\` (front controller lo), đọc tham số từ router, gọi Model, rồi nạp View:

~~~php
// src/pages/post.php (rút gọn)
$id = id_param(['id' => route_param('id')]);
$post = find_post($id);
if ($post === null) abort(404, 'Bài này không còn tồn tại.');
// … xử lý POST (trả lời) …
$title = 'Bài của @' . $post['username'];
require view('header');
// … HTML …
require view('footer');
~~~

\`view('header')\` trả đường dẫn \`src/views/header.php\`. Controller và View ở hai thư mục, nhưng cùng phạm vi biến khi \`require\` — nên View thấy \`$title\`, \`$post\` mà không cần truyền tay.`,
    },
    {
      section: "core",
      title: "Git: lịch sử và an toàn bí mật",
      body: `**Git** ghi lại lịch sử mã: mỗi \`commit\` là một mốc quay lại được; \`git diff\` cho thấy đã đổi gì; làm việc nhóm không ghi đè nhau.

~~~bash
git init
git add -A
git commit -m "Nhịp: cấu trúc MVC, front controller và router"
~~~

Nhưng **không phải thứ gì cũng vào Git**. Tệp \`.gitignore\`:

~~~gitignore
/config.php                       # mật khẩu cơ sở dữ liệu
/public/uploads/avatars/*         # ảnh người dùng tải lên
!/public/uploads/avatars/.gitkeep # giữ thư mục rỗng
/vendor/                          # phụ thuộc Composer (nếu có)
.DS_Store
~~~

\`config.php\` lộ lên GitHub công khai là **sự cố rò rỉ** điển hình (A04 Cryptographic Failures). \`config.sample.php\` vẫn được theo dõi để người khác biết cần điền gì.`,
    },
    {
      section: "core",
      title: "Nhịp có cần Composer?",
      body: `**Composer** là trình quản lý thư viện của PHP: khai báo phụ thuộc trong \`composer.json\`, chạy \`composer install\`, và dùng **autoload** để khỏi \`require\` từng tệp.

Nhịp **cố ý không dùng thư viện ngoài** — phù hợp mục tiêu học và giảm **A03 Software Supply Chain Failures** (mỗi phụ thuộc là một rủi ro bạn kế thừa). Khi dự án lớn hơn và cần, ví dụ, thư viện gửi email hay xử lý ảnh mạnh hơn GD, lúc đó mới thêm Composer.

Nếu thêm: \`vendor/\` vào \`.gitignore\`, và dùng autoload PSR-4 thay cho danh sách \`require\` trong \`bootstrap.php\`. Nguyên tắc: **thêm phụ thuộc khi lợi ích rõ ràng hơn rủi ro**, không thêm cho vui.`,
    },
    {
      section: "apply",
      title: "router.php",
      body: "Tạo `src/router.php` với bảng tuyến, `base_path`, `url`, `asset`, `route_param`, `dispatch`. Nạp nó trong `bootstrap.php`.",
      code: { file: "nhip/src/router.php", lang: "php", content: `<?php
declare(strict_types=1);

/**
 * Bảng tuyến: [phương thức, mẫu đường dẫn] => [tên handler trong src/pages, tên tuyến].
 * {id}, {username} là tham số; handler đọc qua route_param().
 */
const ROUTES = [
    // … các tuyến còn lại: xem tệp đầy đủ
];` },
    },
    {
      section: "apply",
      title: "url, asset, dispatch",
      body: "Phần hàm của router: dựng URL theo tên tuyến, và vòng khớp yêu cầu.",
      code: { file: "nhip/src/router.php", lang: "php", content: `/** Thư mục gốc công khai, suy từ script đang chạy: ví dụ "/nhip/public". */
function base_path(): string
{
    return rtrim(str_replace('\\\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
}

/** Dựng URL cho một tuyến đã đặt tên: url('post', ['id' => 5]) => /nhip/public/post/5 */
function url(string $name, array $params = []): string
{
    foreach (ROUTES as [$method, $pattern, $page, $routeName]) {
        if ($routeName !== $name) {
            continue;
        }
        $path = preg_replace_callback('/\\{(\\w+)\\}/', function ($m) use (&$params) {
            $key = $m[1];
            $value = rawurlencode((string) ($params[$key] ?? ''));
            unset($params[$key]);
            return $value;
        }, $pattern);
        $query = $params ? '?' . http_build_query($params) : '';
        return base_path() . $path . $query;
    }
    return base_path() . '/';
}

/** Đường dẫn tới tài nguyên tĩnh trong public/. */
function asset(string $path): string
{
    return base_path() . '/' . ltrim($path, '/');
}

function route_param(string $key, $default = null)
{
    return $GLOBALS['route_params'][$key] ?? $default;
}

/** Khớp yêu cầu với bảng tuyến rồi chạy handler. */
function dispatch(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
    $path = '/' . ltrim(substr($path, strlen(base_path())), '/');
    $path = rtrim($path, '/') ?: '/';

    foreach (ROUTES as [$routeMethod, $pattern, $page, $name]) {
        $regex = '#^' . preg_replace('/\\{(\\w+)\\}/', '(?<$1>[^/]+)', $pattern) . '$#';
        if ($routeMethod === $method && preg_match($regex, $path, $m)) {
            $GLOBALS['route_params'] = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
            require __DIR__ . '/pages/' . $page . '.php';
        }
    }
    abort(404, 'Trang không tồn tại.');
}` },
    },
    {
      section: "apply",
      title: "Front controller và .htaccess",
      body: "`public/index.php` chỉ hai dòng. `.htaccess` chuyển hướng. Nhớ di chuyển `css/`, `js/`, `img/`, `uploads/` vào `public/`, và `config.php` ra gốc `nhip/`.",
      code: { file: "nhip/public/index.php", lang: "php", content: `<?php
// Front controller: MỌI yêu cầu (trừ tệp tĩnh) đi qua đây nhờ .htaccess.
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';
dispatch();

<!-- public/.htaccess -->
# Có tệp/thư mục thật (css, ảnh, uploads) thì phục vụ trực tiếp;
# còn lại chuyển hết về front controller public/index.php.
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [L]` },
    },
    {
      section: "apply",
      title: ".gitignore và view()",
      body: "Thêm `.gitignore` ở gốc, `view()` và `avatar_url()` vào `helpers.php`. Đổi mọi `require header/footer/post` trong controller thành `require view(...)`.",
      code: { file: "nhip/.gitignore", lang: "bash", content: `# Bí mật và dữ liệu — KHÔNG đưa lên Git
/config.php
/public/uploads/avatars/*
!/public/uploads/avatars/.gitkeep

# Phụ thuộc (nếu dùng Composer sau này)
/vendor/

# Rác hệ điều hành và trình soạn
.DS_Store
Thumbs.db
*.log` },
    },
    {
      section: "apply",
      title: "Cập nhật liên kết",
      body: "Đổi mọi `href`, `action`, `redirect` sang `url()`; tài nguyên tĩnh sang `asset()`; ảnh đại diện sang `avatar_url()`. Ví dụ thẻ bài dùng chung:",
      code: { file: "nhip/src/views/post.php", lang: "php", content: `    <header class="post-head">
      <a class="author" href="<?= url('profile', ['username' => $post['username']]) ?>">
        <?= e($post['display_name']) ?> <span class="handle">@<?= e($post['username']) ?></span>
      </a>
      <a class="when" href="<?= url('post', ['id' => (int) $post['id']]) ?>">
        <time datetime="<?= e($post['created_at']) ?>"><?= time_ago($post['created_at']) ?></time>
        <?= $post['updated_at'] ? '· đã sửa' : '' ?>
      </a>
    </header>
    <p class="post-text"><?= e($post['body']) ?></p>
    <footer class="post-actions">
      <form method="post" action="<?= url('like') ?>" class="inline like-form">
        <?= csrf_field() ?>
        <input type="hidden" name="post_id" value="<?= (int) $post['id'] ?>">
        <button type="submit" class="like" aria-pressed="<?= $liked ? 'true' : 'false' ?>"
                aria-label="<?= $liked ? 'Bỏ thích' : 'Thích' ?>">♥ <span><?= (int) $post['likes'] ?></span></button>
      </form>
      <a class="action" href="<?= url('post', ['id' => (int) $post['id']]) ?>">Trả lời <?= (int) $post['replies'] ?: '' ?></a>
      <?php if ($isOwner): ?>
        <a class="action" href="<?= url('edit', ['id' => (int) $post['id']]) ?>">Sửa</a>
        <form method="post" action="<?= url('delete') ?>" class="inline" data-confirm="Xoá bài này? Không hoàn tác được.">
        <?= csrf_field() ?>
          <input type="hidden" name="id" value="<?= (int) $post['id'] ?>">
          <button type="submit" class="action danger">Xoá</button>
        </form>
      <?php endif; ?>
    </footer>` },
    },
    {
      section: "apply",
      title: "Kết quả: URL sạch",
      image: {
        src: "/image/coding/steps/s20-clean-url.webp",
        alt: "Trang cá nhân Lan Nguyễn tại địa chỉ sạch, bài mới nhất ghi Nhịp giờ chạy trên front controller + router sạch.",
        caption: "/u/lan.code — không còn profile.php?u=; mọi trang đi qua một front controller.",
      },
      body: `Tự kiểm:

1. Mở \`/u/lan.code\`, \`/post/5\` — URL sạch, không đuôi \`.php\`.
2. Mở thẳng \`/config.php\` qua trình duyệt → **404** (nằm ngoài web root).
3. Đăng bài, sửa, xoá, tim, theo dõi — tất cả vẫn chạy, nay qua tuyến có tên.
4. \`git status\` sau \`git add -A\` — \`config.php\` và ảnh \`.jpg\` trong \`uploads\` **không** xuất hiện.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 20",
      body: `- [ ] Chỉ \`public/\` là web root; \`config.php\`, \`src/\` nằm ngoài, mở trực tiếp ra 404.
- [ ] Mọi yêu cầu qua \`public/index.php\`; \`.htaccess\` chuyển hướng đúng, tệp tĩnh vẫn phục vụ trực tiếp.
- [ ] URL sạch: \`/\`, \`/login\`, \`/post/5\`, \`/u/lan.code\`; không khớp → 404.
- [ ] Không còn \`href\`/\`action\` viết cứng tên tệp; tất cả qua \`url()\`/\`asset()\`.
- [ ] \`git init\` + \`.gitignore\` loại \`config.php\` và ảnh tải lên.
- [ ] Toàn bộ chức năng chặng 1–4 vẫn chạy nguyên vẹn.`,
    },
  ],
  quiz: [
    { q: "Trong MVC, câu SQL lấy bài đăng thuộc phần nào?", o: ["Model", "View", "Controller", "Router"], a: 0, why: "Model lo dữ liệu và nghiệp vụ; View hiển thị; Controller điều phối." },
    { q: "Vì sao chỉ để public/ làm web root?", o: ["Cho nhanh", "Mã nguồn và config nằm ngoài tầm trình duyệt — PHP sập cũng không lộ bí mật", "Bắt buộc của PHP", "Để dùng Git"], a: 1, why: "Giảm Security Misconfiguration: web root chỉ chứa thứ cần phục vụ." },
    { kind: "truefalse", q: "Front controller giúp áp dụng bảo mật (CSRF, phiên) một chỗ cho mọi yêu cầu.", a: true, why: "Mọi yêu cầu qua một cửa nên bootstrap chạy một lần, không trang nào quên." },
    { q: "url('post', ['id' => 5]) sinh ra gì (khi app ở /nhip/public)?", o: ["/post.php?id=5", "/nhip/public/post/5", "post/5", "/nhip/post/5"], a: 1, why: "url() thay {id} và thêm base_path tự suy ra." },
    { kind: "multi", q: "Những gì KHÔNG nên đưa vào Git?", o: ["config.php (mật khẩu)", "Ảnh người dùng tải lên", "config.sample.php", "vendor/"], a: [0, 1, 3], why: "config.sample.php được theo dõi để người khác biết cần điền gì." },
    { kind: "bug", q: ".htaccess sau khiến tệp tĩnh cũng bị đẩy qua PHP. Thiếu dòng nào?", lines: ["RewriteEngine On", "RewriteCond %{REQUEST_FILENAME} -f", "RewriteRule ^ index.php [L]"], a: 1, why: "Điều kiện phải là !-f (và !-d): chỉ đẩy qua PHP khi KHÔNG phải tệp/thư mục thật." },
    { q: "route_param('id') lấy giá trị từ đâu?", o: ["$_GET['id']", "$_POST['id']", "Phần {id} trong đường dẫn khớp bởi router", "Cookie"], a: 2, why: "Router bắt {id} thành nhóm (?<id>...) rồi lưu vào route_params." },
    { q: "Vì sao Nhịp cố ý không dùng thư viện Composer?", o: ["Composer tốn tiền", "Giảm rủi ro chuỗi cung ứng (A03) và phù hợp mục tiêu học; thêm khi lợi ích rõ", "PHP không hỗ trợ", "Để chạy nhanh hơn"], a: 1, why: "Mỗi phụ thuộc là rủi ro kế thừa; chỉ thêm khi cần thật." },
    { kind: "blank", q: "Điền hàm dựng đường dẫn tới tài nguyên tĩnh trong public/.", code: '<link rel="stylesheet" href="<?= ______(\'css/style.css\') ?>">', a: "asset", why: "asset() thêm base_path cho tệp tĩnh; url() cho các tuyến." },
    { q: "Cùng đường dẫn /post/5, GET và POST khác nhau thế nào trong Nhịp?", o: ["Không khác", "GET xem bài, POST thêm câu trả lời", "GET nhanh hơn", "POST xoá bài"], a: 1, why: "Bảng tuyến phân biệt theo phương thức: hai tuyến cùng mẫu, khác việc." },
  ],
};
