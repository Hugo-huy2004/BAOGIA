export default {
  id: "step11",
  lang: "php",
  file: "nhip/includes/db.php",
  duration: "150 phút",
  summary: "Nối PHP với MySQL bằng PDO: chuỗi DSN, ba tuỳ chọn bắt buộc, prepared statement với tham số đặt tên, fetch, lastInsertId, giao dịch và xử lý lỗi — bảng tin Nhịp đọc/ghi cơ sở dữ liệu thật.",
  slides: [
    {
      section: "intro",
      title: "Nối hai nửa của chặng 2",
      body: `Step 8 có PHP vẽ trang nhưng lưu bằng tệp JSON. Step 9–10 có cơ sở dữ liệu và truy vấn nhưng chỉ chạy trong phpMyAdmin. Step này **nối hai nửa**: PHP gửi đúng các câu SQL bạn đã viết tới MySQL và nhận kết quả về thành mảng.

Công cụ là **PDO** (PHP Data Objects) — lớp truy cập cơ sở dữ liệu có sẵn trong PHP, dùng chung một cách viết cho MySQL, PostgreSQL, SQLite… Kết thúc step này, tệp \`posts.json\` và thư mục \`data/\` được **xoá hẳn**.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Mở kết nối PDO với DSN và **ba tuỳ chọn** mà mọi dự án nghiêm túc đều đặt.
2. Đặt thông tin kết nối trong **một tệp cấu hình** riêng, có bản mẫu.
3. Chạy truy vấn bằng **prepared statement** với tham số \`?\` và \`:ten\`.
4. Lấy dữ liệu bằng \`fetch\`, \`fetchAll\`, \`fetchColumn\`; lấy id mới bằng \`lastInsertId\`.
5. Gói nhiều lệnh vào **giao dịch** từ PHP.
6. Đọc được thông báo lỗi PDO và biết vì sao không được để nó lộ ra ngoài.
7. Tách mọi câu SQL vào \`includes/posts.php\`, \`includes/users.php\`.`,
    },
    {
      section: "visual",
      title: "Prepared statement: khuôn và dữ liệu đi riêng",
      visual: "pdo-prepare",
      body: `Với prepared statement, câu SQL được gửi tới MySQL **trước**, có chỗ trống \`?\` hoặc \`:body\`. MySQL phân tích và "đóng khuôn" câu lệnh. Dữ liệu người dùng gửi **sau**, chỉ được điền vào chỗ trống như **giá trị**.

Dù người dùng gõ \`'); DROP TABLE posts; --\`, chuỗi đó chỉ là nội dung một bài đăng — nó không thể trở thành lệnh SQL, vì khuôn lệnh đã cố định từ trước. Đây là cách chặn **SQL Injection** tận gốc (step 17 sẽ tấn công thử).`,
    },
    {
      section: "visual",
      title: "Từ yêu cầu tới dòng dữ liệu",
      visual: "lamp-flow-db",
      body: `Một lần tải \`index.php\` giờ đi qua đủ bốn tầng:

1. Apache nhận \`GET /nhip/index.php\`.
2. PHP chạy \`bootstrap.php\` → \`db()\` mở **một** kết nối TCP tới MySQL cổng 3306.
3. \`feed_posts()\` gửi truy vấn bảng tin, nhận về mảng các mảng kết hợp.
4. Vòng \`foreach\` in mỗi bài qua \`includes/post.php\`.
5. PHP kết thúc → kết nối tự đóng.

Mỗi yêu cầu một kết nối; đừng mở kết nối mới trong vòng lặp.`,
    },
    {
      section: "research",
      title: "PDO trong tài liệu PHP",
      body: `PDO có mặt từ PHP 5.1 (2005) và là cách truy cập cơ sở dữ liệu được PHP Manual khuyên dùng cho mã mới, cùng với \`mysqli\`. Hàm \`mysql_*\` cũ đã bị **xoá hẳn** khỏi PHP 7 — gặp hướng dẫn nào còn dùng \`mysql_query\` thì đó là tài liệu quá hạn.

Từ PHP 8.0, chế độ lỗi mặc định của PDO là \`ERRMODE_EXCEPTION\`; ta vẫn ghi rõ để mã chạy đúng cả trên máy chủ cũ.

> The PHP Group (2025) *PHP Data Objects*, PHP Manual. Available at: https://www.php.net/manual/en/book.pdo.php
>
> The PHP Group (2025) *Prepared statements and stored procedures*, PHP Manual. Available at: https://www.php.net/manual/en/pdo.prepared-statements.php`,
    },
    {
      section: "research",
      title: "OWASP: tham số hoá là phòng tuyến đầu",
      body: `Bảng hướng dẫn phòng chống SQL Injection của OWASP xếp **truy vấn tham số hoá (prepared statement)** là biện pháp phòng vệ số 1, trước cả thủ tục lưu sẵn và kiểm tra đầu vào theo danh sách cho phép. "Thoát ký tự" bằng tay được ghi rõ là **không khuyến nghị**.

OWASP cũng nêu một ngoại lệ: tham số chỉ thay được **giá trị**, không thay được **tên bảng, tên cột hay hướng sắp xếp**. Những chỗ đó phải chọn từ danh sách cho phép viết sẵn trong mã.

> OWASP Foundation (2025) *SQL Injection Prevention Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
>
> OWASP Foundation (2025) *Query Parameterization Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html`,
    },
    {
      section: "ideate",
      title: "Mỗi lớp một việc",
      body: `Thiết kế cho mã PHP của Nhịp từ bây giờ:

| Tệp | Biết gì | Không biết gì |
|---|---|---|
| \`config.php\` | Mật khẩu, tên cơ sở dữ liệu | Mọi thứ còn lại |
| \`db.php\` | Cách mở kết nối | Bảng nào, câu SQL nào |
| \`posts.php\`, \`users.php\` | Câu SQL | HTML, \`$_POST\` |
| \`index.php\`, \`profile.php\` | \`$_GET\`/\`$_POST\`, gọi hàm nào | SQL |
| \`header.php\`, \`post.php\` | HTML | SQL, \`$_POST\` |

Quy tắc dễ nhớ: **trang không viết SQL, hàm SQL không in HTML.** Muốn đổi cách đếm tim chỉ sửa một chỗ; muốn đổi giao diện thẻ bài cũng chỉ một chỗ. Step 20 gọi tên chính thức cho cách chia này: Model – View – Controller.`,
    },
    {
      section: "core",
      title: "DSN và ba tuỳ chọn",
      body: `~~~php
$dsn = 'mysql:host=127.0.0.1;dbname=nhip;charset=utf8mb4';
$pdo = new PDO($dsn, 'root', '', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
]);
~~~

- **DSN** (Data Source Name): loại cơ sở dữ liệu, máy chủ, tên cơ sở dữ liệu và — rất quan trọng — \`charset=utf8mb4\`. Thiếu charset là chữ tiếng Việt thành \`Nh?p\`.
- \`ERRMODE_EXCEPTION\`: SQL sai thì **ném ngoại lệ** thay vì âm thầm trả \`false\`.
- \`FETCH_ASSOC\`: mỗi dòng là \`['id' => 1, 'body' => '…']\`, không lặp thêm khoá số.
- \`EMULATE_PREPARES => false\`: dùng prepared statement **thật** của MySQL, và số trả về đúng kiểu \`int\`.

\`127.0.0.1\` thay vì \`localhost\`: trên macOS/Linux, \`localhost\` khiến PDO thử nối qua socket tệp; dùng IP buộc đi qua TCP cổng 3306 như phpMyAdmin.`,
    },
    {
      section: "core",
      title: "Tệp cấu hình và bản mẫu",
      body: `\`config.php\` **trả về** một mảng (\`return [...]\`), nên đọc nó bằng:

~~~php
$config = require __DIR__ . '/config.php';
echo $config['db_name'];   // nhip
~~~

Hai tệp đi cặp:

- \`config.sample.php\` — giá trị mẫu, **có** trong mã nguồn chung, để người khác biết cần điền gì.
- \`config.php\` — giá trị thật của máy bạn, **không bao giờ** đưa lên Git hay gửi cho ai (step 20 thêm vào \`.gitignore\`).

Lên hosting ở step 24, bạn chỉ sửa \`config.php\` trên máy chủ: tên máy chủ cơ sở dữ liệu, tài khoản, mật khẩu, và \`debug => false\`.`,
    },
    {
      section: "core",
      title: "prepare, execute và hai kiểu chỗ trống",
      body: `~~~php
// Chỗ trống vị trí: ?  — truyền mảng theo thứ tự
$stmt = db()->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]);

// Chỗ trống đặt tên: :ten — truyền mảng kết hợp, dễ đọc khi nhiều tham số
$stmt = db()->prepare('INSERT INTO posts (user_id, body) VALUES (:user_id, :body)');
$stmt->execute(['user_id' => 1, 'body' => $body]);
~~~

- Không đặt dấu nháy quanh chỗ trống: viết \`= ?\`, **không** viết \`= '?'\`.
- Không trộn \`?\` và \`:ten\` trong cùng một câu.
- Mỗi chỗ trống thay **một giá trị**. \`WHERE id IN (?)\` với mảng 3 phần tử phải sinh đủ \`IN (?, ?, ?)\`.

\`LIMIT\` cần số nguyên: dùng \`bindValue(':limit', $n, PDO::PARAM_INT)\` trước \`execute()\` — đúng như \`feed_posts()\`.`,
    },
    {
      section: "core",
      title: "Lấy kết quả",
      body: `| Phương thức | Trả về | Dùng khi |
|---|---|---|
| \`fetchAll()\` | Mảng mọi dòng (rỗng nếu không có) | Danh sách bài |
| \`fetch()\` | Một dòng, hoặc \`false\` | Tìm một người dùng |
| \`fetchColumn()\` | Giá trị cột đầu của dòng đầu | \`SELECT COUNT(*)\` |
| \`rowCount()\` | Số dòng bị \`UPDATE\`/\`DELETE\` | Kiểm sửa/xoá có tác dụng không |
| \`db()->lastInsertId()\` | id \`AUTO_INCREMENT\` vừa cấp | Sau \`INSERT\` |

\`fetch()\` trả \`false\` khi không có dòng — hàm \`find_user_by_username\` đổi nó thành \`null\` để kiểu trả về \`?array\` rõ nghĩa và trang gọi chỉ cần kiểm \`=== null\`.`,
    },
    {
      section: "core",
      title: "Giao dịch trong PHP",
      body: `~~~php
$pdo = db();
$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM likes WHERE post_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM posts WHERE id = ? AND user_id = ?')->execute([$id, $me]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();   // một lệnh lỗi → huỷ tất cả
    throw $e;           // ném tiếp để không nuốt lỗi
}
~~~

Nhờ \`ERRMODE_EXCEPTION\`, mọi lỗi SQL nhảy vào \`catch\`. Ở Nhịp, khoá ngoại \`ON DELETE CASCADE\` đã lo việc xoá tim theo bài, nên giao dịch sẽ thực sự cần ở step 22 (tạo bài + thẻ hashtag + thông báo cùng lúc).`,
    },
    {
      section: "core",
      title: "Đọc lỗi PDO",
      image: {
        src: "/image/coding/steps/s11-error.webp",
        alt: "Trang trắng với dòng Fatal error: Uncaught PDOException: SQLSTATE[HY000] [1049] Unknown database 'nhipp' in .../includes/db.php:14, kèm Stack trace qua PDO->__construct, db(), feed_posts()",
        caption: "Gõ nhầm db_name thành nhipp. Đọc từ trái sang: loại ngoại lệ → mã lỗi MySQL → nội dung → tệp:dòng → đường đi của lời gọi.",
      },
      body: `Cách đọc:

- \`[1049] Unknown database\` — tên cơ sở dữ liệu sai. Hay gặp nữa: \`[1045] Access denied\` (sai tài khoản/mật khẩu), \`[2002] Connection refused\` (MySQL chưa bật trong XAMPP), \`[1146] Table doesn't exist\`, \`[1064] syntax error\`.
- *Stack trace* đọc từ dưới lên: \`index.php\` dòng 20 gọi \`feed_posts()\`, hàm này gọi \`db()\`, \`db()\` hỏng ở dòng 14.
- PHP 8.2 tự che mật khẩu thành \`SensitiveParameterValue\` — nhưng đường dẫn máy chủ, tên tài khoản vẫn lộ. Vì vậy \`debug\` phải là \`false\` trên hosting (step 19 làm trang lỗi thân thiện).`,
    },
    {
      section: "core",
      title: "Đọc số từ cơ sở dữ liệu",
      body: `Kết quả từ PDO luôn cần ép kiểu khi đưa vào hàm có khai báo kiểu:

~~~php
$user = find_user_by_username('lan.code');
posts_by_user((int) $user['id']);       // strict_types: phải là int
echo (int) $post['likes'];              // số in thẳng, không cần e()
~~~

Với \`EMULATE_PREPARES => false\`, MySQL trả cột \`INT\` thành \`int\` của PHP; nhưng \`COUNT()\` trong truy vấn con hay giá trị trên hosting cấu hình khác có thể thành chuỗi \`"4"\`. Ép \`(int)\` tại chỗ dùng là thói quen rẻ mà chắc.`,
    },
    {
      section: "apply",
      title: "config.sample.php và db.php",
      body: "Tạo `includes/config.sample.php`, chép thành `config.php`. Với XAMPP mặc định, giá trị mẫu chạy được luôn. `db.php` giữ kết nối trong biến `static`: lần gọi `db()` thứ hai trở đi trả lại đúng kết nối cũ.",
      code: { file: "nhip/includes/db.php", lang: "php", content: `// includes/config.sample.php
<?php
// Chép tệp này thành config.php rồi điền thông tin thật.
// config.php KHÔNG được đưa lên Git (step 20) — nó chứa mật khẩu.
return [
    'db_host' => '127.0.0.1',
    'db_name' => 'nhip',
    'db_user' => 'root',
    'db_pass' => '',
    'debug'   => true,     // true: hiện lỗi chi tiết. Trên hosting: false.
];

// includes/db.php
<?php
declare(strict_types=1);

/**
 * Kết nối PDO dùng chung cho cả yêu cầu. Gọi db() bao nhiêu lần cũng chỉ mở
 * MỘT kết nối (biến static giữ lại giữa các lần gọi).
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $config = require __DIR__ . '/config.php';
        $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // lỗi SQL thành ngoại lệ
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // mỗi dòng là mảng kết hợp
            PDO::ATTR_EMULATE_PREPARES   => false,                   // prepared statement thật
        ]);
    }
    return $pdo;
}` },
    },
    {
      section: "apply",
      title: "posts.php: câu SQL của bài đăng",
      body: "Ba hàm dùng chung phần đầu truy vấn bảng tin (`FEED_SQL`) và chỉ khác `WHERE`. MySQL nhận ra `u.username` phụ thuộc vào `p.id` qua khoá chính nên chỉ cần `GROUP BY p.id`; nếu hosting của bạn báo lỗi `ONLY_FULL_GROUP_BY`, liệt kê đủ các cột như ở step 10.",
      code: { file: "nhip/includes/posts.php", lang: "php", content: `<?php
declare(strict_types=1);

// Mọi câu SQL về bài đăng nằm ở đây. Trang PHP chỉ gọi hàm, không viết SQL.

const FEED_SQL = '
    SELECT p.id, p.user_id, p.body, p.created_at, u.username, u.display_name, u.avatar,
           COUNT(l.user_id) AS likes
    FROM posts AS p
    JOIN users AS u ON u.id = p.user_id
    LEFT JOIN likes AS l ON l.post_id = p.id';

/** 20 bài gốc mới nhất cho bảng tin. */
function feed_posts(int $limit = 20): array
{
    $stmt = db()->prepare(FEED_SQL . '
        WHERE p.parent_id IS NULL
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/** Bài gốc của một người dùng, cho trang cá nhân. */
function posts_by_user(int $userId): array
{
    $stmt = db()->prepare(FEED_SQL . '
        WHERE p.parent_id IS NULL AND p.user_id = :user_id
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC');
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetchAll();
}

/** Thêm bài, trả id của bài mới. */
function create_post(int $userId, string $body): int
{
    $stmt = db()->prepare('INSERT INTO posts (user_id, body) VALUES (:user_id, :body)');
    $stmt->execute(['user_id' => $userId, 'body' => trim($body)]);
    return (int) db()->lastInsertId();
}` },
    },
    {
      section: "apply",
      title: "users.php và bootstrap.php",
      body: "`bootstrap.php` là cửa vào chung: mọi trang chỉ cần một dòng `require`. Nó cũng bật/tắt hiển thị lỗi theo `debug` trong cấu hình.",
      code: { file: "nhip/includes/users.php", lang: "php", content: `<?php
declare(strict_types=1);

/** Một người dùng theo tên, kèm số người theo dõi / đang theo dõi. null nếu không có. */
function find_user_by_username(string $username): ?array
{
    $stmt = db()->prepare('
        SELECT u.id, u.username, u.display_name, u.bio, u.avatar, u.created_at,
               (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers,
               (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
        FROM users AS u
        WHERE u.username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    return $user === false ? null : $user;
}

// includes/bootstrap.php
<?php
declare(strict_types=1);

// Mọi trang chỉ cần require tệp này một lần.
require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/posts.php';
require __DIR__ . '/users.php';

$config = require __DIR__ . '/config.php';
ini_set('display_errors', $config['debug'] ? '1' : '0');
error_reporting(E_ALL);` },
    },
    {
      section: "apply",
      title: "index.php đọc và ghi MySQL",
      body: "So với step 8, chỉ đổi ba chỗ: `require` bootstrap, `create_post()` thay `add_post()`, `feed_posts()` thay `load_posts()`. Phần HTML giữ nguyên — đó là lợi ích của việc tách lớp. Xoá `includes/storage.php` và thư mục `data/`.",
      code: { file: "nhip/index.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

const CURRENT_USER_ID = 1;   // tạm là lan.code — step 12 thay bằng người đang đăng nhập

$error = null;
$body = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = (string) ($_POST['body'] ?? '');
    $error = check_post($body);
    if ($error === null) {
        create_post(CURRENT_USER_ID, $body);
        redirect('index.php');
    }
}

$posts = feed_posts();
$title = 'Bảng tin';
$active = 'feed';` },
    },
    {
      section: "apply",
      title: "profile.php với 404 thật",
      body: "Người dùng không tồn tại → mã trạng thái **404**, không phải trang trắng hay lỗi PHP. Thẻ bài `includes/post.php` cũng đổi sang các cột mới: `display_name`, `username`, `avatar`.",
      code: { file: "nhip/profile.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$user = find_user_by_username((string) ($_GET['u'] ?? ''));
if ($user === null) {
    http_response_code(404);
    $title = 'Không tìm thấy';
    $active = 'profile';
// ... phần HTML: xem tệp đầy đủ` },
    },
    {
      section: "apply",
      title: "Kết quả: bảng tin từ MySQL",
      image: {
        src: "/image/coding/steps/s11-feed.webp",
        alt: "Bảng tin Nhịp đọc từ MySQL: bài mới nhất của Lan Nguyễn @lan.code Bài này đi qua PDO vào thẳng MySQL. vừa xong, các bài khác kèm tên hiển thị, tên người dùng và số tim",
        caption: "Đăng một bài: nó đi qua PDO vào bảng posts, rồi được đọc lại ngay trong lần GET sau 303.",
      },
      body: "Tên hiển thị và @tên người dùng giờ đến từ bảng `users` qua `JOIN`; số tim đến từ `COUNT` trên bảng `likes`. Bài trả lời (id 6, 8, 9) không hiện ở bảng tin vì điều kiện `parent_id IS NULL`.",
    },
    {
      section: "apply",
      title: "Kiểm chứng trong phpMyAdmin",
      image: {
        src: "/image/coding/steps/s11-new-row.webp",
        alt: "Tab Duyệt bảng posts có 12 hàng; hàng cuối id 12 user_id 1 parent_id NULL body Bài này đi qua PDO vào thẳng MySQL. created_at 2026-10-27 09:09:41 updated_at NULL",
        caption: "nhip → posts → Duyệt: dòng 12 là bài vừa đăng từ trang Nhịp.",
      },
      body: `Tự kiểm ba điều:

1. \`created_at\` do MySQL điền (\`DEFAULT CURRENT_TIMESTAMP\`), PHP không gửi.
2. Đăng bài \`Nh'ịp "test"\` — dấu nháy lưu nguyên vẹn, không lỗi SQL: prepared statement đang làm việc.
3. Mở \`profile.php?u=lan.code\`: bài mới hiện đầu danh sách; \`profile.php?u=khong.co\` trả 404.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu chặng 2",
      body: `**Mã nguồn chặng 2 (PHP + MySQL):** [tải nhip-chang2-php-mysql.zip](/downloads/coding/nhip-chang2-php-mysql.zip) — giải nén để đối chiếu với bài của bạn (code và giáo trình đồng bộ).\n\nChặng 2 đạt khi:

- [ ] \`includes/config.php\` + \`config.sample.php\`; ngoài \`db.php\` không tệp nào gọi \`new PDO\`.
- [ ] Không còn \`posts.json\`, \`storage.php\`, \`data/\`.
- [ ] Mọi câu SQL nằm trong \`posts.php\`/\`users.php\` và **đều** dùng \`prepare\` + tham số; không có biến PHP nào nối thẳng vào chuỗi SQL.
- [ ] Bài có dấu nháy, emoji, tiếng Việt lưu và hiện đúng.
- [ ] Sai tên cơ sở dữ liệu → bạn đọc ra mã lỗi và sửa được trong một phút.
- [ ] Trang cá nhân hiện số người theo dõi / đang theo dõi thật.

Đạt đủ thì làm trắc nghiệm để mở chặng 3: tài khoản, CRUD và tương tác.`,
    },
  ],
  quiz: [
    { q: "Tuỳ chọn nào khiến lỗi SQL ném ngoại lệ thay vì âm thầm trả false?", o: ["ATTR_DEFAULT_FETCH_MODE", "ATTR_ERRMODE => ERRMODE_EXCEPTION", "ATTR_EMULATE_PREPARES", "ATTR_PERSISTENT"], a: 1, why: "Ngoại lệ không thể bị bỏ qua vô tình như giá trị false." },
    { kind: "bug", q: "Dòng nào mở đường cho SQL Injection?", lines: ["$username = (string) ($_GET['u'] ?? '');", "$sql = \"SELECT * FROM users WHERE username = '$username'\";", "$stmt = db()->query($sql);", "$user = $stmt->fetch();"], a: 1, why: "Nối biến vào chuỗi SQL; phải dùng prepare với chỗ trống ?." },
    { kind: "truefalse", q: "Viết WHERE username = '?' (có dấu nháy) là đúng cách dùng chỗ trống.", a: false, why: "Dấu nháy biến ? thành chuỗi ký tự thường; viết = ? không nháy." },
    { q: "fetch() trả về gì khi không có dòng nào khớp?", o: ["null", "false", "Mảng rỗng", "Ném ngoại lệ"], a: 1, why: "Hàm find_user_by_username đổi false thành null cho rõ nghĩa." },
    { kind: "blank", q: "Điền phần còn thiếu của DSN để lưu đúng tiếng Việt và emoji.", code: "mysql:host=127.0.0.1;dbname=nhip;charset=_______", a: "utf8mb4", why: "Thiếu charset là chữ có dấu có thể bị lưu/đọc sai." },
    { kind: "output", q: "Sau INSERT thành công vào posts (đang có id lớn nhất 12), dòng sau in gì?", code: "echo db()->lastInsertId();", o: ["12", "13", "1", "true"], a: 1, why: "lastInsertId trả id AUTO_INCREMENT vừa cấp (dạng chuỗi)." },
    { q: "Vì sao tách config.php và config.sample.php?", o: ["Cho PHP chạy nhanh hơn", "Bản mẫu chia sẻ được, bản thật chứa mật khẩu không bao giờ được chia sẻ", "Apache yêu cầu", "Để có hai cơ sở dữ liệu"], a: 1, why: "Bí mật không được nằm trong mã nguồn chung." },
    { kind: "multi", q: "Mã lỗi nào nghĩa là gì?", o: ["1045: sai tài khoản/mật khẩu", "1049: không có cơ sở dữ liệu tên đó", "2002: MySQL chưa chạy/không kết nối được", "1064: thiếu dấu chấm phẩy trong PHP"], a: [0, 1, 2], why: "1064 là lỗi cú pháp SQL, không phải lỗi PHP." },
    { kind: "order", q: "Sắp xếp các bước chạy một truy vấn có tham số.", items: ["db() trả kết nối", "prepare() gửi khuôn câu lệnh", "execute() gửi giá trị", "fetchAll() lấy kết quả"], a: [0, 1, 2, 3], why: "Khuôn đi trước, dữ liệu đi sau — cốt lõi của prepared statement." },
    { q: "Trong giao dịch, một lệnh DELETE ném ngoại lệ. Phải làm gì trong catch?", o: ["commit()", "rollBack() rồi ném tiếp lỗi", "Bỏ qua", "Mở kết nối mới"], a: 1, why: "rollBack huỷ mọi thay đổi; ném tiếp để lỗi không bị nuốt." },
  ],
};
