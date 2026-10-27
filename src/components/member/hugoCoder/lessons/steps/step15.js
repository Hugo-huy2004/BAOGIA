export default {
  id: "step15",
  lang: "php",
  file: "nhip/like.php",
  duration: "180 phút",
  summary: "Ba tương tác cuối của chặng 3: thả tim không tải lại trang bằng Fetch API và JSON, chuỗi trả lời lồng nhiều tầng bằng WITH RECURSIVE và đệ quy, tìm kiếm bằng LIKE có thoát ký tự đại diện.",
  slides: [
    {
      section: "intro",
      title: "Nhịp sống động hơn",
      body: `Tới step 14, mỗi thao tác đều tải lại cả trang. Với "Theo dõi" điều đó chấp nhận được, nhưng thả tim thì không: người dùng bấm tim hàng chục lần khi lướt bảng tin, mỗi lần nhảy về đầu trang là trải nghiệm hỏng.

Step này nối lại vòng **sự kiện → dữ liệu → vẽ lại** của step 6, nhưng dữ liệu giờ nằm ở máy chủ: JavaScript gửi yêu cầu nền bằng **Fetch**, PHP trả về **JSON**, JavaScript chỉ vẽ lại đúng nút vừa bấm.

Kèm theo hai tính năng làm nên một mạng xã hội: **trò chuyện** (trả lời lồng nhau) và **tìm kiếm**.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Gửi yêu cầu POST nền bằng \`fetch\` + \`FormData\`, đọc JSON và mã trạng thái.
2. Viết một tệp PHP phục vụ **cả** JSON lẫn HTML tuỳ tiêu đề \`Accept\` — chức năng vẫn chạy khi tắt JavaScript.
3. Bật/tắt tim bằng \`INSERT IGNORE\` + \`rowCount()\`.
4. Đánh dấu "đã thả tim" cho cả danh sách bằng **một** truy vấn \`IN (?, ?, …)\`.
5. Lấy cả chuỗi trả lời nhiều tầng bằng \`WITH RECURSIVE\`, dựng cây trong PHP và in bằng **hàm đệ quy**.
6. Tìm kiếm bằng \`LIKE\`, thoát \`%\` và \`_\` của người dùng.`,
    },
    {
      section: "visual",
      title: "Fetch: trang không tải lại",
      visual: "fetch-flow",
      body: `1. Người dùng bấm ♥ → sự kiện \`submit\` của biểu mẫu nhỏ quanh nút.
2. \`app.js\` gọi \`event.preventDefault()\` rồi \`fetch('like.php', { method: 'POST', body: FormData, headers: { Accept: 'application/json' } })\`.
3. \`like.php\` thấy \`Accept: application/json\` → trả \`{"liked": true, "likes": 5}\`.
4. \`app.js\` cập nhật \`aria-pressed\` và con số.

Không có JavaScript: bước 2 không xảy ra, biểu mẫu gửi bình thường, \`like.php\` không thấy \`Accept\` JSON nên chuyển hướng về trang bài. Cùng một tệp, hai cách dùng — gọi là **nâng cấp dần** (progressive enhancement).`,
    },
    {
      section: "visual",
      title: "Từ danh sách phẳng tới cây",
      visual: "reply-tree",
      body: `Cơ sở dữ liệu chỉ lưu mỗi bài **một** con trỏ \`parent_id\`. Để vẽ cuộc trò chuyện, Nhịp:

1. Dùng \`WITH RECURSIVE\` lấy **mọi** con cháu của bài gốc trong một truy vấn.
2. Gom theo \`parent_id\`: \`$byParent[5] = [bài 6, bài 9]\`, \`$byParent[6] = [bài 14]\`…
3. Hàm \`$build(5)\` lấy con của 5, rồi tự gọi \`$build(6)\`, \`$build(14)\`… cho tới khi hết con.
4. \`render_replies()\` in mỗi tầng thành một \`<ol>\` lồng trong tầng trên.

Cấu trúc dữ liệu (cây) quyết định cấu trúc mã (đệ quy) và cấu trúc HTML (danh sách lồng).`,
    },
    {
      section: "research",
      title: "Fetch và nâng cấp dần",
      body: `Fetch API được WHATWG chuẩn hoá thành *Fetch Living Standard*, thay cho \`XMLHttpRequest\` cũ; mọi trình duyệt hiện đại đều hỗ trợ. \`fetch\` trả về một **Promise**: \`await\` đợi phản hồi mà không chặn giao diện.

Khái niệm *progressive enhancement* (Champeon, 2003) đề xuất xây chức năng cốt lõi bằng HTML chạy ở mọi nơi trước, rồi mới thêm JavaScript làm trải nghiệm tốt hơn. Nhóm GOV.UK áp dụng nguyên tắc này cho mọi dịch vụ công vì một phần đáng kể người dùng **không chạy được** JavaScript (mạng chập chờn, tệp tải lỗi, trình duyệt cũ) — dù họ không hề tắt nó.

> WHATWG (2025) *Fetch Living Standard*. Available at: https://fetch.spec.whatwg.org/
>
> Government Digital Service (2024) *Building a resilient frontend using progressive enhancement*, GOV.UK Service Manual. Available at: https://www.gov.uk/service-manual/technology/using-progressive-enhancement`,
    },
    {
      section: "research",
      title: "Truy vấn đệ quy trong SQL",
      body: `Biểu thức bảng chung đệ quy (*recursive common table expression*) được đưa vào chuẩn SQL:1999. MySQL hỗ trợ từ 8.0, MariaDB từ 10.2 — XAMPP 8.2 (MariaDB 10.4) và hầu hết hosting hiện nay đều chạy được.

Một CTE đệ quy gồm hai phần nối bằng \`UNION ALL\`: **phần neo** (tầng đầu) và **phần đệ quy** (nối bảng gốc với chính kết quả của CTE). Cơ sở dữ liệu lặp phần đệ quy cho tới khi nó không trả thêm dòng nào.

> Oracle (2025) *MySQL 8.4 Reference Manual: WITH (Common Table Expressions) — Recursive Common Table Expressions*. Available at: https://dev.mysql.com/doc/refman/8.4/en/with.html
>
> MariaDB Foundation (2025) *Recursive Common Table Expressions Overview*. Available at: https://mariadb.com/kb/en/recursive-common-table-expressions-overview/`,
    },
    {
      section: "ideate",
      title: "Các phần mới",
      body: `| Tệp | Việc |
|---|---|
| \`like.php\` | POST \`post_id\` → bật/tắt tim; trả JSON **hoặc** chuyển hướng |
| \`includes/likes.php\` | \`toggle_like\`, \`mark_liked\` |
| \`post.php\` | Bài gốc + ô trả lời + cây trả lời |
| \`includes/posts.php\` | Thêm cột \`replies\`; \`create_reply\`, \`reply_tree\`, \`search_posts\` |
| \`search.php\` | Ô tìm kiếm (GET) + kết quả |
| \`js/app.js\` | Bộ nghe \`submit\` cho \`.like-form\` |

Trả lời một câu trả lời: bấm "Trả lời" dưới câu đó → mở \`post.php?id=<nó>\` → ô soạn ở đó tạo con của nó. Không cần giao diện phức tạp mà vẫn lồng được bao nhiêu tầng cũng được.`,
    },
    {
      section: "core",
      title: "fetch, FormData, async/await",
      body: `~~~js
const response = await fetch(form.action, {
  method: "POST",
  body: new FormData(form),                     // gói mọi <input> của biểu mẫu
  headers: { Accept: "application/json" },      // "tôi muốn JSON"
});
const data = await response.json();             // chuỗi JSON → đối tượng
if (!response.ok) { /* 4xx, 5xx */ }
~~~

- \`fetch\` **chỉ ném lỗi khi mất mạng**. Máy chủ trả 401 hay 500 vẫn là "thành công" về mặt mạng — phải tự kiểm \`response.ok\` (đúng khi mã 200–299).
- \`FormData\` gửi kèm cookie phiên tự động (cùng nguồn), nên PHP vẫn biết ai đang bấm.
- \`button.disabled = true\` trong lúc chờ: chặn bấm đúp gửi hai yêu cầu.
- Khối \`catch\` gọi \`form.submit()\` — mạng lỗi thì lùi về cách không JavaScript.`,
    },
    {
      section: "core",
      title: "Một tệp PHP, hai kiểu phản hồi",
      body: `~~~php
$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

$result = toggle_like($me['id'], $post['id']);

if ($wantsJson) {
    header('Content-Type: application/json');
    echo json_encode($result);              // {"liked":true,"likes":5}
    exit;
}
redirect('post.php?id=' . $post['id']);     // trình duyệt thường
~~~

Lỗi cũng theo hai đường: chưa đăng nhập → JSON \`401\` (JavaScript tự chuyển tới \`login.php\`) hoặc chuyển hướng như mọi trang. Đặt \`Content-Type: application/json\` để trình duyệt và \`response.json()\` hiểu đúng; \`json_encode\` mặc định thoát chữ có dấu thành \`\\u00e3\` — hợp lệ, JavaScript đọc ra đúng chữ.`,
    },
    {
      section: "core",
      title: "Bật/tắt tim trong hai câu SQL",
      body: `~~~php
$insert = db()->prepare('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)');
$insert->execute([$userId, $postId]);
$liked = $insert->rowCount() === 1;        // thêm được → vừa thả tim
if (!$liked) {                              // đã có sẵn → lần bấm này là bỏ tim
    db()->prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?')
        ->execute([$userId, $postId]);
}
~~~

Không \`SELECT\` trước để hỏi "đã thả chưa": hai yêu cầu song song có thể cùng đọc "chưa" rồi cùng chèn. \`INSERT IGNORE\` + khoá chính kép để **cơ sở dữ liệu** quyết định nguyên tử.

Số tim trả về được **đếm lại** từ bảng, không cộng/trừ 1 ở máy khách: người khác có thể vừa thả tim cùng lúc.`,
    },
    {
      section: "core",
      title: "IN với số chỗ trống động",
      body: `Bảng tin có 20 bài; cần biết bài nào người xem đã thả tim. Cách **sai**: gọi một truy vấn cho mỗi bài — 20 truy vấn (lỗi N+1, step 21).

Cách đúng — một truy vấn:

~~~php
$ids = [11, 10, 7, 5];
$marks = implode(',', array_fill(0, count($ids), '?'));     // "?,?,?,?"
$stmt = db()->prepare("SELECT post_id FROM likes WHERE user_id = ? AND post_id IN ($marks)");
$stmt->execute([$viewerId, ...$ids]);
~~~

Chuỗi \`$marks\` nối vào SQL chỉ chứa \`?\` và dấu phẩy **do mã tự sinh** — không có dữ liệu người dùng nào trong đó, nên vẫn an toàn. Toán tử \`...\` trải mảng id thành các tham số. \`array_flip\` biến danh sách id đã thích thành bảng tra \`isset()\` tức thời.`,
    },
    {
      section: "core",
      title: "WITH RECURSIVE",
      body: `~~~sql
WITH RECURSIVE thread AS (
    SELECT id, 1 AS depth FROM posts WHERE parent_id = 5      -- neo: con trực tiếp
    UNION ALL
    SELECT c.id, t.depth + 1
    FROM posts AS c JOIN thread AS t ON c.parent_id = t.id    -- đệ quy: con của con
)
SELECT … FROM posts AS p … JOIN thread AS t ON t.id = p.id
~~~

Vòng 1: \`{6, 9}\`. Vòng 2: con của 6 và 9 → \`{14}\`. Vòng 3: con của 14 → \`{15}\`. Vòng 4: rỗng → dừng.

Nhờ khoá ngoại, một bài không thể là cha của chính nó qua vòng lặp (nó phải tồn tại trước con), nên đệ quy luôn dừng. Với dữ liệu có thể vòng lặp, MySQL chặn ở \`cte_max_recursion_depth\` (mặc định 1000).`,
    },
    {
      section: "core",
      title: "Đệ quy trong PHP",
      body: `~~~php
$build = function (int $parentId) use (&$build, $byParent): array {
    $nodes = $byParent[$parentId] ?? [];
    foreach ($nodes as &$node) {
        $node['children'] = $build((int) $node['id']);    // gọi lại chính nó
    }
    return $nodes;
};
~~~

Mọi hàm đệ quy cần hai thứ: **trường hợp dừng** (không có con → trả mảng rỗng) và **bước tiến gần tới dừng** (mỗi lần gọi đi xuống một tầng).

- \`use (&$build)\`: hàm vô danh muốn tự gọi mình phải nhận chính biến chứa nó **theo tham chiếu**.
- \`foreach ($nodes as &$node)\`: sửa trực tiếp phần tử trong mảng.

\`render_replies()\` cũng đệ quy y hệt: in một \`<li>\`, rồi gọi lại chính nó cho \`children\` của bài đó.`,
    },
    {
      section: "core",
      title: "Tìm kiếm bằng LIKE",
      body: `~~~php
$pattern = '%' . addcslashes($query, '%_\\\\') . '%';
$stmt = db()->prepare(FEED_SQL . ' WHERE p.body LIKE :pattern …');
~~~

Trong \`LIKE\`, \`%\` là "chuỗi bất kỳ" và \`_\` là "một ký tự bất kỳ". Người dùng tìm \`50%\` mà không thoát thì \`%\` của họ khớp mọi thứ. \`addcslashes\` thêm dấu \`\\\` trước \`%\`, \`_\` và chính \`\\\` để chúng thành chữ thường.

Prepared statement vẫn **bắt buộc**: thoát ký tự đại diện chỉ đổi nghĩa trong \`LIKE\`, không chống SQL Injection.

- Bảng mã \`utf8mb4_unicode_ci\` làm \`LIKE\` **không phân biệt hoa thường** và coi \`a\` ≈ \`á\`: tìm "join" ra "JOIN".
- \`LIKE '%…%'\` không dùng được chỉ mục — ổn với vài nghìn bài. Dữ liệu lớn dùng chỉ mục \`FULLTEXT\` và \`MATCH … AGAINST\`.`,
    },
    {
      section: "core",
      title: "Biểu mẫu tìm kiếm dùng GET",
      body: `~~~html
<form method="get" action="search.php" role="search">
  <input id="q" name="q" type="search" minlength="2" required>
~~~

Tìm kiếm **không thay đổi dữ liệu** → dùng **GET**: kết quả có địa chỉ riêng (\`search.php?q=JOIN\`), gửi cho bạn bè được, đánh dấu được, nút Quay lại hoạt động đúng.

- \`type="search"\`: bàn phím điện thoại hiện nút "Tìm", có nút xoá nhanh.
- \`role="search"\`: trình đọc màn hình nhảy thẳng tới vùng tìm kiếm.
- Câu "4 kết quả cho “JOIN”" mang \`role="status"\` để được đọc to sau khi tìm.
- Tối thiểu 2 ký tự ở **cả** HTML lẫn PHP: tìm một ký tự quét cả bảng mà kết quả vô nghĩa.`,
    },
    {
      section: "apply",
      title: "likes.php",
      body: "Tạo `includes/likes.php` và thêm `require` vào `bootstrap.php`. Gọi `mark_liked($posts, $me)` ngay sau khi lấy danh sách bài ở `index.php` và `profile.php`.",
      code: { file: "nhip/includes/likes.php", lang: "php", content: `<?php
declare(strict_types=1);

/**
 * Bật/tắt tim của $userId cho bài $postId. Trả trạng thái mới và tổng số tim.
 * Thử INSERT trước; nếu đã có (0 dòng được thêm) thì đó là lần bấm để bỏ tim.
 */
function toggle_like(int $userId, int $postId): array
{
    $insert = db()->prepare('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)');
    $insert->execute([$userId, $postId]);
    $liked = $insert->rowCount() === 1;
    if (!$liked) {
        db()->prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?')->execute([$userId, $postId]);
    }
    $count = db()->prepare('SELECT COUNT(*) FROM likes WHERE post_id = ?');
    $count->execute([$postId]);
    return ['liked' => $liked, 'likes' => (int) $count->fetchColumn()];
}

/**
 * Đánh dấu bài nào người xem đã thả tim — MỘT truy vấn cho cả danh sách,
 * không phải một truy vấn mỗi bài.
 */
function mark_liked(array $posts, ?array $viewer): array
{
    if ($viewer === null || !$posts) {
        return $posts;
    }
    $ids = array_map(fn (array $p): int => (int) $p['id'], $posts);
    $marks = implode(',', array_fill(0, count($ids), '?'));            // ?,?,?
    $stmt = db()->prepare("SELECT post_id FROM likes WHERE user_id = ? AND post_id IN ($marks)");
    $stmt->execute([(int) $viewer['id'], ...$ids]);
    $liked = array_flip($stmt->fetchAll(PDO::FETCH_COLUMN));
    foreach ($posts as &$post) {
        $post['liked'] = isset($liked[$post['id']]);
    }
    return $posts;
}` },
    },
    {
      section: "apply",
      title: "like.php",
      body: "Một điểm cuối phục vụ cả `fetch` lẫn biểu mẫu thường. Thứ tự kiểm vẫn như mọi trang ghi: phương thức → người dùng → đối tượng.",
      code: { file: "nhip/like.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    abort(405, 'Phương thức không được phép.');
}
$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$me = current_user();
$post = find_post(id_param($_POST, 'post_id'));

if ($me === null || $post === null) {
    if ($wantsJson) {
        http_response_code($me === null ? 401 : 404);
        header('Content-Type: application/json');
        echo json_encode(['error' => $me === null ? 'Hãy đăng nhập để thả tim.' : 'Không tìm thấy bài.']);
        exit;
    }
    $me === null ? require_login() : abort(404, 'Không tìm thấy bài.');
}

$result = toggle_like((int) $me['id'], (int) $post['id']);

if ($wantsJson) {
    // fetch() trong js/app.js: trả JSON, trang không tải lại.
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}
// Không có JavaScript: biểu mẫu thường, quay về trang của bài.
redirect('post.php?id=' . (int) $post['id']);` },
    },
    {
      section: "apply",
      title: "posts.php: trả lời và tìm kiếm",
      body: "Thêm cột đếm `replies` vào `FEED_SQL`, rồi ba hàm mới. `reply_tree` dùng lại `FEED_SQL` nên mỗi câu trả lời có đủ tác giả, ảnh, số tim, số trả lời như một bài thường.",
      code: { file: "nhip/includes/posts.php", lang: "php", content: `/** Thêm câu trả lời cho bài $parentId. */
function create_reply(int $userId, int $parentId, string $body): int
{
    $stmt = db()->prepare('INSERT INTO posts (user_id, parent_id, body) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $parentId, trim($body)]);
    return (int) db()->lastInsertId();
}

/**
 * Mọi câu trả lời nằm dưới bài $rootId, ở mọi tầng, dựng thành cây.
 * WITH RECURSIVE đi xuống từng tầng cho tới khi hết con.
 */
function reply_tree(int $rootId): array
{
    $stmt = db()->prepare('
        WITH RECURSIVE thread AS (
            SELECT id, 1 AS depth FROM posts WHERE parent_id = :root
            UNION ALL
            SELECT c.id, t.depth + 1 FROM posts AS c JOIN thread AS t ON c.parent_id = t.id
        )
        ' . FEED_SQL . '
        JOIN thread AS t ON t.id = p.id
        GROUP BY p.id
        ORDER BY p.created_at ASC, p.id ASC');
    $stmt->execute(['root' => $rootId]);

    // Gom danh sách phẳng thành cây: mỗi bài nhận mảng children.
    $byParent = [];
    foreach ($stmt->fetchAll() as $row) {
        $byParent[(int) $row['parent_id']][] = $row;
    }
    $build = function (int $parentId) use (&$build, $byParent): array {
        $nodes = $byParent[$parentId] ?? [];
        foreach ($nodes as &$node) {
            $node['children'] = $build((int) $node['id']);
        }
        return $nodes;
    };
    return $build($rootId);
}

/** Tìm bài theo nội dung. % và _ của người dùng được thoát để LIKE hiểu là chữ thường. */
function search_posts(string $query, int $limit = 20): array
{
    $pattern = '%' . addcslashes($query, '%_\\\\') . '%';
    // … prepare(FEED_SQL . ' WHERE p.body LIKE :pattern …')` },
    },
    {
      section: "apply",
      title: "post.php: cuộc trò chuyện",
      body: "Phần đầu xử lý gửi câu trả lời (cần đăng nhập, cùng `check_post` như bài thường) rồi chuyển hướng tới đúng câu vừa trả lời qua neo `#p14`. Hàm `render_replies` in cây.",
      code: { file: "nhip/post.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$id = id_param($_GET);
$post = find_post($id);
if ($post === null) {
    abort(404, 'Bài này không còn tồn tại.');
}

$error = null;
$body = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $me = require_login();
    $body = (string) ($_POST['body'] ?? '');
    $error = check_post($body);
    if ($error === null) {
        $newId = create_reply((int) $me['id'], $id, $body);
        redirect('post.php?id=' . $id . '#p' . $newId);
    }
}

$viewer = current_user();
[$post] = mark_liked([$post], $viewer);
$replies = reply_tree($id);

/** In cây trả lời: mỗi tầng một <ol> lồng trong tầng trên. */
function render_replies(array $nodes, ?array $viewer, int $depth = 1): void
{
    if (!$nodes) {
        return;
    }
    echo '<ol class="replies depth-' . min($depth, 3) . '">';
    foreach (mark_liked($nodes, $viewer) as $post) {
        echo '<li id="p' . (int) $post['id'] . '">';
        require __DIR__ . '/includes/post.php';
        render_replies($post['children'], $viewer, $depth + 1);
        echo '</li>';
    }
    echo '</ol>';
}

$title = 'Bài của @' . $post['username'];` },
    },
    {
      section: "apply",
      title: "app.js và thẻ bài",
      body: "Nút tim trong `includes/post.php` giờ nằm trong `<form class=\"like-form\" action=\"like.php\">`, thêm liên kết \"Trả lời N\". Thêm vào cuối `js/app.js`:",
      code: { file: "nhip/js/app.js", lang: "js", content: `// Thả tim không tải lại trang: chặn biểu mẫu, gửi bằng fetch, vẽ lại từ JSON.
// Không có JavaScript thì biểu mẫu vẫn gửi bình thường (like.php chuyển hướng).
document.addEventListener("submit", async (event) => {
  const form = event.target.closest(".like-form");
  if (!form) return;
  event.preventDefault();

  const button = form.querySelector(".like");
  button.disabled = true;                       // chặn bấm đúp khi đang chờ
  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) window.location.href = "login.php";
      return;
    }
    button.setAttribute("aria-pressed", String(data.liked));
    button.setAttribute("aria-label", data.liked ? "Bỏ thích" : "Thích");
    button.querySelector("span").textContent = data.likes;
  } catch {
    form.submit();                              // mạng lỗi: thử cách không JavaScript
  } finally {
    button.disabled = false;
  }
});` },
    },
    {
      section: "apply",
      title: "Kết quả: trò chuyện nhiều tầng",
      image: {
        src: "/image/coding/steps/s15-thread.webp",
        alt: "Trang bài của Khoa Lê về JOIN có 4 tim màu hồng, ô Trả lời @khoa.data, bên dưới là câu trả lời của Minh Trần, lồng trong đó câu của An Phạm, lồng tiếp câu của Lan Nguyễn có nút Sửa Xoá, cuối cùng là câu của Khoa Lê",
        caption: "post.php?id=5 — ba tầng trả lời, mỗi tầng thụt vào và có vạch dọc.",
      },
      body: `Tim của bài gốc màu hồng vì Lan (đang đăng nhập) đã thả tim — \`mark_liked\` đánh dấu đúng. Bấm tim một câu trả lời: số đổi ngay, trang không cuộn.

Mở DevTools → *Network* → bấm tim: thấy một yêu cầu \`like.php\` kiểu **fetch**, phản hồi \`{"liked":true,"likes":1}\`. Tắt JavaScript (DevTools → ⋮ → *Run command* → "Disable JavaScript") và bấm lại: trang tải lại về \`post.php\` — vẫn hoạt động.`,
    },
    {
      section: "apply",
      title: "Kết quả: tìm kiếm",
      image: {
        src: "/image/coding/steps/s15-search.webp",
        alt: "Trang Tìm với ô tìm kiếm chứa JOIN, dòng 4 kết quả cho JOIN, và các bài của An Phạm, Khoa Lê có tim hồng, Minh Trần",
        caption: "search.php?q=JOIN — tìm cả bài gốc lẫn câu trả lời, không phân biệt hoa thường.",
      },
      body: `Nghiệm thu chặng 3:

- [ ] Đăng ký, đăng nhập, đăng xuất; mật khẩu băm.
- [ ] Đăng, sửa, xoá bài; người khác không sửa/xoá được.
- [ ] Hồ sơ, ảnh đại diện an toàn, theo dõi và tab Đang theo dõi.
- [ ] Thả tim không tải lại trang **và** vẫn chạy khi tắt JavaScript.
- [ ] Trả lời lồng ít nhất 3 tầng; xoá bài gốc là cả chuỗi biến mất.
- [ ] Tìm \`%\` ra 0 kết quả; tìm "join" ra bài có "JOIN".

Đạt đủ là Nhịp đã là một mạng xã hội dùng được trên localhost. Chặng 4 sẽ **tấn công** chính nó.`,
    },
  ],
  quiz: [
    { q: "fetch() ném lỗi (vào catch) trong trường hợp nào?", o: ["Máy chủ trả 401", "Máy chủ trả 500", "Mất kết nối mạng", "JSON có tiếng Việt"], a: 2, why: "Mã lỗi HTTP vẫn là phản hồi hợp lệ; phải tự kiểm response.ok." },
    { kind: "truefalse", q: "Với nâng cấp dần, nút tim phải vẫn hoạt động khi JavaScript không chạy.", a: true, why: "Biểu mẫu thường gửi tới like.php, máy chủ chuyển hướng về trang bài." },
    { q: "like.php quyết định trả JSON hay chuyển hướng dựa vào đâu?", o: ["Phương thức POST", "Tiêu đề Accept chứa application/json", "Tham số ?json=1", "Cookie phiên"], a: 1, why: "fetch gửi Accept: application/json; biểu mẫu thường thì không." },
    { kind: "output", q: "Lan đã thả tim bài 5 trước đó. Gọi toggle_like(1, 5). $liked là gì?", code: "$insert = db()->prepare('INSERT IGNORE INTO likes ...');\n$insert->execute([1, 5]);\n$liked = $insert->rowCount() === 1;", o: ["true", "false", "null", "Lỗi 1062"], a: 1, why: "Dòng (1, 5) đã có nên không chèn thêm (0 dòng) → đây là lần bỏ tim." },
    { kind: "multi", q: "Một CTE đệ quy gồm những phần nào?", o: ["Phần neo (tầng đầu)", "UNION ALL", "Phần đệ quy nối với chính CTE", "Một vòng while trong PHP"], a: [0, 1, 2], why: "Cơ sở dữ liệu tự lặp phần đệ quy tới khi không còn dòng mới." },
    { q: "Vì sao mark_liked dùng một truy vấn IN thay vì một truy vấn cho mỗi bài?", o: ["IN an toàn hơn", "Tránh lỗi N+1: 20 bài thì 1 truy vấn thay vì 20", "MySQL cấm nhiều truy vấn", "Để sắp xếp bài"], a: 1, why: "Số truy vấn không tăng theo số bài." },
    { kind: "blank", q: "Điền hàm PHP thoát % và _ trước khi đưa vào LIKE.", code: "$pattern = '%' . __________($query, '%_\\\\') . '%';", a: "addcslashes", why: "addcslashes thêm \\ trước các ký tự trong danh sách." },
    { kind: "bug", q: "Hàm đệ quy nào sẽ chạy mãi không dừng?", lines: ["function depth(array $node): int {", "  $max = 0;", "  foreach ($node['children'] as $c) { $max = max($max, depth($node)); }", "  return $max + 1;", "}"], a: 2, why: "Gọi lại với chính $node thay vì $c — không bao giờ tiến gần tới trường hợp dừng." },
    { q: "Biểu mẫu tìm kiếm nên dùng phương thức nào?", o: ["POST, vì có dữ liệu người dùng", "GET, vì không đổi dữ liệu và kết quả cần có địa chỉ riêng", "PUT", "Không cần biểu mẫu"], a: 1, why: "GET cho phép chia sẻ, đánh dấu và dùng nút Quay lại." },
    { q: "Tìm \"join\" ra bài có chữ \"JOIN\" là nhờ đâu?", o: ["LOWER() trong PHP", "Bảng mã utf8mb4_unicode_ci không phân biệt hoa thường", "addcslashes", "FULLTEXT"], a: 1, why: "Hậu tố _ci = case-insensitive." },
  ],
};
