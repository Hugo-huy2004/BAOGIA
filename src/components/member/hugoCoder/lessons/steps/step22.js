export default {
  id: "step22",
  lang: "php",
  file: "nhip/src/notifications.php",
  duration: "180 phút",
  summary: "Ba tính năng kết nối người dùng: hashtag gom bài theo chủ đề, nhắc tên @ nối người với người, và thông báo cho mọi tương tác — tạo bài kèm thẻ và thông báo trong một giao dịch, và biến văn bản thành liên kết an toàn.",
  slides: [
    {
      section: "intro",
      title: "Giữ người dùng quay lại",
      body: `Nhịp đã nhanh và gọn. Nhưng một mạng xã hội sống nhờ **tương tác được phản hồi**: bạn thả tim, người kia biết; bạn nhắc tên ai, họ nhận được; bạn gắn một chủ đề, người cùng quan tâm tìm thấy.

Ba tính năng cuối của chặng 5:

- **Hashtag** (\`#php\`) — gom bài theo chủ đề.
- **Nhắc tên** (\`@lan.code\`) — nối trực tiếp tới một người.
- **Thông báo** — báo cho người dùng khi có người trả lời, thích, theo dõi, hoặc nhắc tới họ.

Đây cũng là nơi dùng thật sự **giao dịch** (đã học ở step 10–11) và kỹ thuật **biến văn bản thành liên kết an toàn**.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Trích \`#hashtag\` và \`@mention\` từ nội dung bằng biểu thức chính quy (Unicode).
2. Lưu hashtag bằng quan hệ **nhiều–nhiều** (\`tags\` + \`post_tags\`); trang \`/tag/{tag}\`.
3. Gửi **thông báo** cho bốn loại sự kiện; huy hiệu đếm chưa đọc.
4. Tạo bài **kèm thẻ và thông báo trong một giao dịch** — tất cả hoặc không gì cả.
5. Biến \`#tag\`, \`@user\` thành liên kết **sau khi đã thoát HTML** — không mở lại lỗ hổng XSS.
6. Đánh dấu "đã đọc" khi mở trang thông báo.`,
    },
    {
      section: "visual",
      title: "Hashtag là nhiều–nhiều",
      visual: "hashtag-model",
      body: `Một bài có nhiều thẻ; một thẻ thuộc nhiều bài → quan hệ **nhiều–nhiều**, cần **bảng nối** (như \`likes\` ở step 9):

- \`tags(id, name)\` — mỗi thẻ một dòng, \`name\` **UNIQUE**.
- \`post_tags(post_id, tag_id)\` — khoá chính kép, mỗi cặp một lần.

Khi đăng bài có \`#php\`: tạo thẻ \`php\` nếu chưa có (\`INSERT IGNORE\`), rồi nối bài với thẻ. Trang \`/tag/php\` \`JOIN\` ngược lại để lấy mọi bài mang thẻ đó. Đây đúng là mẫu bạn đã dựng cho "thả tim" — tái dùng kiến thức, chỉ đổi tên.`,
    },
    {
      section: "visual",
      title: "Thông báo: người nhận và người gây",
      visual: "notif-model",
      body: `Mỗi thông báo trả lời: *ai nhận, ai gây ra, chuyện gì, về bài nào*.

- \`user_id\` — người **nhận** (chủ bài được thích, người được nhắc…).
- \`actor_id\` — người **gây ra** hành động.
- \`type\` — \`reply\` / \`like\` / \`follow\` / \`mention\`.
- \`post_id\` — bài liên quan (có thể NULL với "theo dõi").
- \`is_read\` — đã xem chưa, cho huy hiệu.

Quy tắc: **không tự thông báo cho chính mình** (thích bài mình, trả lời bài mình) — kiểm \`user_id === actor_id\` thì bỏ qua.`,
    },
    {
      section: "research",
      title: "Biểu thức chính quy Unicode",
      body: `Tên thẻ và tên người Việt có dấu, nên regex phải theo **Unicode**: cờ \`u\` và lớp \`\\p{L}\` (mọi chữ cái), \`\\p{N}\` (mọi chữ số). PCRE — thư viện regex của PHP — hỗ trợ đầy đủ các lớp thuộc tính Unicode này.

Hashtag dùng \`#([\\p{L}\\p{N}_]{1,50})\` để bắt được \`#bảomật\`; tên người dùng hẹp hơn (\`[a-z0-9._]\`) vì chính Nhịp quy định tên người dùng không dấu (step 12).

> The PHP Group (2025) *PCRE — Regular Expressions (Perl-Compatible); Unicode character properties*. PHP Manual. Available at: https://www.php.net/manual/en/regexp.reference.unicode.php
>
> Unicode Consortium (2024) *Unicode Technical Standard #18: Unicode Regular Expressions*. Available at: https://www.unicode.org/reports/tr18/`,
    },
    {
      section: "research",
      title: "Thoát trước, nối liên kết sau",
      body: `Biến \`@lan.code\` thành liên kết nghĩa là **chèn HTML** (\`<a>\`) vào nội dung người dùng — đúng thứ mà XSS khai thác (step 17). An toàn chỉ khi làm đúng thứ tự:

1. **Thoát toàn bộ** nội dung bằng \`htmlspecialchars\` trước (mọi \`<\`, \`>\`, \`&\` thành thực thể).
2. **Rồi** mới tìm \`#tag\`/\`@user\` trên chuỗi **đã thoát** và bọc \`<a>\` quanh chúng.

Vì sau bước 1 không còn ký tự HTML "sống" nào, bước 2 chỉ thêm đúng các thẻ \`<a>\` ta kiểm soát. OWASP gọi đây là nguyên tắc **mã hoá theo ngữ cảnh, đúng thời điểm**.

> OWASP Foundation (2025) *Cross Site Scripting Prevention Cheat Sheet — Output Encoding*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html`,
    },
    {
      section: "ideate",
      title: "Các phần mới",
      body: `| Tệp | Việc |
|---|---|
| \`src/tags.php\` | \`extract_tags\`, \`extract_mentions\`, \`attach_tags\`, \`posts_by_tag\` |
| \`src/notifications.php\` | \`notify\`, \`unread_count\`, \`notifications_for\`, \`mark_notifications_read\`, \`notify_mentions\` |
| \`src/posts.php\` | \`publish_post\` (giao dịch), \`render_body\` (liên kết) |
| \`src/pages/notifications.php\` | Trang thông báo, đánh dấu đã đọc |
| \`src/pages/tag.php\` | Bài theo một hashtag |
| 3 bảng | \`tags\`, \`post_tags\`, \`notifications\` |

Hai tuyến mới: \`GET /notifications\`, \`GET /tag/{tag}\`. Huy hiệu chưa đọc hiện trên thanh điều hướng.`,
    },
    {
      section: "core",
      title: "Trích thẻ và tên",
      body: `~~~php
function extract_tags(string $body): array
{
    preg_match_all('/#([\\p{L}\\p{N}_]{1,50})/u', $body, $m);
    return array_values(array_unique(array_map('mb_strtolower', $m[1])));
}

function extract_mentions(string $body): array
{
    preg_match_all('/@([a-z0-9._]{3,30})/', $body, $m);
    return array_values(array_unique($m[1]));
}
~~~

- \`preg_match_all\` lấy **mọi** lần khớp; \`$m[1]\` là mảng phần trong ngoặc bắt (không gồm \`#\`/\`@\`).
- \`array_unique\` bỏ trùng (gõ \`#php #php\` chỉ tính một).
- Thẻ hạ về chữ thường để \`#PHP\` và \`#php\` là một.`,
    },
    {
      section: "core",
      title: "Lưu hashtag nhiều–nhiều",
      body: `~~~php
function attach_tags(int $postId, array $tags): void
{
    foreach ($tags as $name) {
        db()->prepare('INSERT IGNORE INTO tags (name) VALUES (?)')->execute([$name]);
        $id = db()->prepare('SELECT id FROM tags WHERE name = ?');
        $id->execute([$name]);
        db()->prepare('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)')
            ->execute([$postId, (int) $id->fetchColumn()]);
    }
}
~~~

\`INSERT IGNORE\` cho \`tags\`: thẻ đã có thì bỏ qua, không lỗi trùng \`UNIQUE\`. \`INSERT IGNORE\` cho \`post_tags\`: cặp đã có thì bỏ qua (khoá chính kép). Cùng kỹ thuật idempotent của "theo dõi" (step 14).

Trang \`/tag/php\`: \`FEED_SQL\` + \`JOIN post_tags JOIN tags WHERE t.name = 'php'\`.`,
    },
    {
      section: "core",
      title: "Tạo bài trong một giao dịch",
      body: `Đăng một bài giờ gồm nhiều bước ghi: tạo bài, gắn thẻ, gửi thông báo nhắc tên, báo cho chủ bài gốc. Nếu bước ba lỗi, ta **không** muốn còn lại một bài không thẻ. Gói tất cả trong **một giao dịch** (step 11):

~~~php
function publish_post(int $userId, string $body, ?int $parentId = null): int
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $postId = $parentId === null
            ? create_post($userId, $body)
            : create_reply($userId, $parentId, $body);
        attach_tags($postId, extract_tags($body));
        notify_mentions($body, $userId, $postId);
        if ($parentId !== null) {
            $parent = find_post($parentId);
            if ($parent) notify((int) $parent['user_id'], $userId, 'reply', $parentId);
        }
        $pdo->commit();
        return $postId;
    } catch (Throwable $e) {
        $pdo->rollBack();   // một bước hỏng → huỷ tất cả
        throw $e;
    }
}
~~~

\`feed.php\` và \`post.php\` giờ gọi \`publish_post\` thay cho \`create_post\`/\`create_reply\` trần.`,
    },
    {
      section: "core",
      title: "Gửi thông báo",
      body: `~~~php
function notify(int $userId, int $actorId, string $type, ?int $postId = null): void
{
    if ($userId === $actorId) return;        // không tự thông báo cho mình
    db()->prepare('INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?)')
        ->execute([$userId, $actorId, $type, $postId]);
}
~~~

Gọi ở đúng chỗ sự kiện xảy ra:

- \`like.php\`: sau khi thả tim → \`notify(chủ bài, người thích, 'like', bài)\`.
- \`follow.php\`: sau khi theo dõi → \`notify(người được theo dõi, người theo dõi, 'follow')\`.
- \`publish_post\`: trả lời → báo chủ bài gốc; \`notify_mentions\` → báo mọi \`@user\` có thật.

Thông báo chỉ gửi khi \`liked === true\` (thả, không phải bỏ tim) — nếu không mỗi lần bấm sẽ spam.`,
    },
    {
      section: "core",
      title: "Huy hiệu và đánh dấu đã đọc",
      body: `~~~php
function unread_count(int $userId): int { /* COUNT WHERE is_read = 0 */ }
function mark_notifications_read(int $userId): void { /* UPDATE SET is_read = 1 */ }
~~~

Thanh điều hướng (\`header.php\`) hiện số chưa đọc:

~~~php
<?php $u = unread_count((int) $me['id']); if ($u): ?>
  <span class="badge"><?= $u ?></span>
<?php endif; ?>
~~~

Mở trang \`/notifications\` thì **đọc danh sách trước, rồi đánh dấu đã đọc** — để lần hiển thị này vẫn tô đậm cái chưa xem, nhưng huy hiệu về 0 ở lần tải sau. Chỉ mục \`idx_notif_user (user_id, is_read, created_at)\` giúp cả đếm lẫn liệt kê đều nhanh.`,
    },
    {
      section: "core",
      title: "Biến văn bản thành liên kết an toàn",
      body: `~~~php
function render_body(string $body): string
{
    $safe = e($body);                                   // 1. THOÁT trước
    $safe = preg_replace_callback('/#([\\p{L}\\p{N}_]{1,50})/u', function ($m) {
        return '<a class="tag" href="' . e(url('tag', ['tag' => mb_strtolower($m[1])]))
             . '">#' . $m[1] . '</a>';                   // 2. nối link SAU
    }, $safe);
    $safe = preg_replace_callback('/@([a-z0-9._]{3,30})/', function ($m) {
        return '<a class="mention" href="' . e(url('profile', ['username' => $m[1]])) . '">@' . $m[1] . '</a>';
    }, $safe);
    return nl2br($safe, false);
}
~~~

Thứ tự là tất cả: thoát HTML **trước** nên \`<script>\` trong bài thành \`&lt;script&gt;\` vô hại; chỉ sau đó mới thêm các \`<a>\` do ta tạo. Thẻ bài gọi \`render_body($post['body'])\` thay cho \`e($post['body'])\`. \`nl2br\` giữ xuống dòng.`,
    },
    {
      section: "apply",
      title: "Ba bảng và tags.php",
      body: "Thêm `tags`, `post_tags`, `notifications` vào `database/schema.sql` rồi chạy. Tạo `src/tags.php`, nạp trong `bootstrap.php`.",
      code: { file: "nhip/src/tags.php", lang: "php", content: `<?php
declare(strict_types=1);

/** Trích hashtag từ nội dung: "#php, #CSS." → ['php', 'css'] (chữ thường, không trùng). */
function extract_tags(string $body): array
{
    preg_match_all('/#([\\p{L}\\p{N}_]{1,50})/u', $body, $m);
    return array_values(array_unique(array_map('mb_strtolower', $m[1])));
}

/** Trích tên người được nhắc: "@lan.code" → ['lan.code']. */
function extract_mentions(string $body): array
{
    preg_match_all('/@([a-z0-9._]{3,30})/', $body, $m);
    return array_values(array_unique($m[1]));
}

/** Gắn các hashtag cho một bài (tạo tag nếu chưa có). */
function attach_tags(int $postId, array $tags): void
{
    foreach ($tags as $name) {
        db()->prepare('INSERT IGNORE INTO tags (name) VALUES (?)')->execute([$name]);
        $id = db()->prepare('SELECT id FROM tags WHERE name = ?');
        $id->execute([$name]);
        db()->prepare('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)')
            ->execute([$postId, (int) $id->fetchColumn()]);
    }
}

/** Bài gốc mang một hashtag, mới nhất trước. */
function posts_by_tag(string $tag, int $limit = 20): array
{
    $stmt = db()->prepare(FEED_SQL . '
        JOIN post_tags AS pt ON pt.post_id = p.id
        JOIN tags AS t ON t.id = pt.tag_id
        WHERE t.name = :tag
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit');
    $stmt->bindValue(':tag', mb_strtolower($tag));
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}` },
    },
    {
      section: "apply",
      title: "notifications.php",
      body: "Năm hàm: gửi, đếm chưa đọc, liệt kê, đánh dấu đã đọc, và gửi thông báo nhắc tên.",
      code: { file: "nhip/src/notifications.php", lang: "php", content: `<?php
declare(strict_types=1);

/** Tạo một thông báo. Bỏ qua nếu tự gây cho chính mình (tự thích bài mình…). */
function notify(int $userId, int $actorId, string $type, ?int $postId = null): void
{
    if ($userId === $actorId) {
        return;
    }
    db()->prepare('INSERT INTO notifications (user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?)')
        ->execute([$userId, $actorId, $type, $postId]);
}

/** Số thông báo chưa đọc — cho huy hiệu trên thanh điều hướng. */
function unread_count(int $userId): int
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    return (int) $stmt->fetchColumn();
}

/** Danh sách thông báo kèm tên người gây ra. */
function notifications_for(int $userId, int $limit = 30): array
{
    $stmt = db()->prepare('
        SELECT n.id, n.type, n.post_id, n.is_read, n.created_at,
               u.username AS actor_name, u.display_name AS actor_display, u.avatar AS actor_avatar
        FROM notifications AS n
        JOIN users AS u ON u.id = n.actor_id
        WHERE n.user_id = :uid
        ORDER BY n.created_at DESC
        LIMIT :limit');
    $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function mark_notifications_read(int $userId): void
{
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')->execute([$userId]);
}

/** Gửi thông báo "nhắc tên" cho các @username có thật (trừ chính tác giả). */
function notify_mentions(string $body, int $authorId, ?int $postId): void
{
    foreach (extract_mentions($body) as $username) {
        $user = find_user_by_username($username);
        if ($user !== null) {
            notify((int) $user['id'], $authorId, 'mention', $postId);
        }
    }
}` },
    },
    {
      section: "apply",
      title: "publish_post và render_body",
      body: "Thêm vào cuối `src/posts.php`. Sửa `feed.php`, `post.php` gọi `publish_post`; `like.php`, `follow.php` gọi `notify`; thẻ bài dùng `render_body`.",
      code: { file: "nhip/src/posts.php", lang: "php", content: `function publish_post(int $userId, string $body, ?int $parentId = null): int
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $postId = $parentId === null
            ? create_post($userId, $body)
            : create_reply($userId, $parentId, $body);

        attach_tags($postId, extract_tags($body));
        notify_mentions($body, $userId, $postId);

        if ($parentId !== null) {
            $parent = find_post($parentId);
            if ($parent !== null) {
                notify((int) $parent['user_id'], $userId, 'reply', $parentId);
            }
        }
        $pdo->commit();
        return $postId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * In nội dung bài an toàn, biến #hashtag và @tên thành liên kết.
 * Thoát HTML TRƯỚC (chống XSS), rồi mới thêm liên kết trên chuỗi đã thoát.
 */
function render_body(string $body): string
{
    $safe = e($body);
    $safe = preg_replace_callback('/#([\\p{L}\\p{N}_]{1,50})/u', function ($m) {
        return '<a class="tag" href="' . e(url('tag', ['tag' => mb_strtolower($m[1])])) . '">#' . $m[1] . '</a>';
    }, $safe);
    $safe = preg_replace_callback('/@([a-z0-9._]{3,30})/', function ($m) {
        return '<a class="mention" href="' . e(url('profile', ['username' => $m[1]])) . '">@' . $m[1] . '</a>';
    }, $safe);
    return nl2br($safe, false);
}` },
    },
    {
      section: "apply",
      title: "Trang thông báo và huy hiệu",
      body: "Controller `notifications.php` liệt kê rồi đánh dấu đã đọc. Thêm link + huy hiệu vào `header.php`, và tuyến `/notifications`, `/tag/{tag}`.",
      code: { file: "nhip/src/pages/notifications.php", lang: "php", content: `$me = require_login();
$items = notifications_for((int) $me['id']);
mark_notifications_read((int) $me['id']);        // mở trang = đã xem

$verb = [
    'reply'   => 'đã trả lời bài của bạn',
    'like'    => 'đã thích bài của bạn',
    'follow'  => 'đã theo dõi bạn',
    'mention' => 'đã nhắc tới bạn',
];

$title = 'Thông báo';
$active = 'notifications';
require view('header');
// … HTML danh sách: xem tệp đầy đủ` },
    },
    {
      section: "apply",
      title: "Kết quả: huy hiệu chưa đọc",
      image: {
        src: "/image/coding/steps/s22-feed-badge.webp",
        alt: "Thanh điều hướng Nhịp có mục Thông báo kèm huy hiệu tròn màu hồng số 2",
        caption: "Minh nhắc tên và theo dõi Lan → Lan thấy huy hiệu \"2\" trên mục Thông báo.",
      },
      body: "Huy hiệu chỉ hiện khi có thông báo chưa đọc. Nó đọc `unread_count` mỗi lần dựng trang — với chỉ mục trên `(user_id, is_read)` nên rất nhẹ.",
    },
    {
      section: "apply",
      title: "Kết quả: trang thông báo và hashtag",
      image: {
        src: "/image/coding/steps/s22-notifications.webp",
        alt: "Trang Thông báo của Lan: Minh Trần đã nhắc tới bạn · xem bài · vừa xong; Minh Trần đã theo dõi bạn · vừa xong; hai dòng nền xanh nhạt (chưa đọc)",
        caption: "/notifications — dòng chưa đọc tô nền nhạt; mở trang xong huy hiệu về 0.",
      },
      body: `Và bài có hashtag + nhắc tên hiện thành **liên kết xanh**:`,
    },
    {
      section: "apply",
      title: "Hashtag và nhắc tên thành liên kết",
      image: {
        src: "/image/coding/steps/s22-hashtag.webp",
        alt: "Bài của Minh Trần: Thử #PHP và #bảomật nhé @lan.code cùng xem! với #PHP, #bảomật, @lan.code là liên kết màu xanh",
        caption: "#PHP, #bảomật dẫn tới /tag/…; @lan.code dẫn tới trang cá nhân. Chữ có dấu trong thẻ vẫn chạy nhờ regex Unicode.",
      },
      body: `Tự kiểm:

1. Đăng \`Thử <b>đậm</b> #an-toàn @lan.code\` → thẻ \`<b>\` hiện **nguyên văn** (đã thoát), còn \`#\`/\`@\` thành link. XSS không lọt.
2. Bấm \`#PHP\` → trang \`/tag/php\` liệt kê mọi bài mang thẻ.
3. Nhắc một tên **không có thật** → không tạo thông báo (chỉ \`@\` có người thật mới báo).
4. Đăng một bài mà cố gây lỗi ở bước thông báo → bài **không** được tạo (giao dịch rollback).`,
    },
    {
      section: "apply",
      title: "Nghiệm thu chặng 5",
      body: `Nhịp đạt chuẩn "đáng dùng" khi:

- [ ] Hashtag lưu nhiều–nhiều; \`/tag/{tag}\` đúng; thẻ có dấu chạy được.
- [ ] Nhắc tên \`@user\` tạo thông báo cho người có thật.
- [ ] Thông báo cho reply / like / follow / mention; không tự báo cho mình.
- [ ] Huy hiệu chưa đọc đúng; mở trang là đánh dấu đã đọc.
- [ ] Bài tạo cùng thẻ và thông báo trong **một giao dịch**.
- [ ] \`#\`/\`@\` thành liên kết mà **không** mở lại XSS (thoát trước, nối link sau).

Đạt đủ + thưởng **800 JOY**. Chặng 6 đưa Nhịp lên Internet, đo người dùng, viết tài liệu và bảo vệ dự án hoàn tất.`,
    },
  ],
  quiz: [
    { q: "Hashtag (một bài nhiều thẻ, một thẻ nhiều bài) được lưu thế nào?", o: ["Một cột tags kiểu chuỗi", "Hai bảng tags + post_tags (nhiều–nhiều)", "Một tệp JSON", "Trong cột body"], a: 1, why: "Nhiều–nhiều cần bảng nối, như likes ở step 9." },
    { q: "Thứ tự đúng để biến @user thành liên kết mà không mở lỗ hổng XSS?", o: ["Nối link trước, thoát sau", "Thoát HTML trước, rồi nối link trên chuỗi đã thoát", "Không cần thoát", "Chỉ nối link"], a: 1, why: "Sau khi thoát không còn HTML sống; chỉ thêm đúng các <a> ta kiểm soát." },
    { kind: "truefalse", q: "Nên gửi thông báo khi người dùng tự thích bài của chính mình.", a: false, why: "Kiểm user_id === actor_id thì bỏ qua." },
    { kind: "output", q: "Body là 'học #PHP và #php nhé'. extract_tags trả về gì?", code: "extract_tags('học #PHP và #php nhé')", o: ["Giữ cả hai: PHP và php", "Chỉ một thẻ: php", "Giữ nguyên chữ hoa: PHP", "Không thẻ nào"], a: 1, why: "Hạ chữ thường rồi array_unique → chỉ còn 'php'." },
    { q: "Vì sao dùng cờ u và \\p{L} trong regex hashtag?", o: ["Cho nhanh", "Để bắt được chữ có dấu như #bảomật (Unicode)", "Bắt buộc của PHP", "Để chống XSS"], a: 1, why: "\\p{L} khớp mọi chữ cái Unicode; cờ u bật chế độ UTF-8." },
    { kind: "multi", q: "Sự kiện nào tạo thông báo trong Nhịp?", o: ["Có người trả lời bài của bạn", "Có người thích bài của bạn", "Có người theo dõi bạn", "Bạn tự xem bài mình"], a: [0, 1, 2], why: "Nhắc tên cũng tạo; tự xem thì không." },
    { q: "Vì sao tạo bài + gắn thẻ + gửi thông báo nên nằm trong một giao dịch?", o: ["Cho nhanh", "Một bước lỗi thì huỷ tất cả, không để lại bài thiếu thẻ/thông báo dở", "MySQL bắt buộc", "Để dùng chỉ mục"], a: 1, why: "Giao dịch bảo đảm trọn vẹn (Atomicity)." },
    { kind: "blank", q: "Điền lệnh để thêm thẻ không lỗi khi thẻ đã tồn tại.", code: "db()->prepare('INSERT ______ INTO tags (name) VALUES (?)')->execute([$name]);", a: "IGNORE", why: "INSERT IGNORE bỏ qua lỗi trùng UNIQUE." },
    { q: "Mở trang /notifications làm gì với trạng thái đọc?", o: ["Xoá hết thông báo", "Liệt kê rồi đánh dấu đã đọc để huy hiệu về 0 lần sau", "Đánh dấu chưa đọc", "Không đổi gì"], a: 1, why: "Hiển thị cái chưa xem lần này, nhưng hạ huy hiệu cho lần tải sau." },
    { kind: "bug", q: "render_body dòng nào làm sai, mở lại XSS?", lines: ["$safe = $body;", "$safe = preg_replace_callback('/#(...)/u', fn($m)=>link($m), $safe);", "$safe = e($safe);", "return $safe;"], a: 0, why: "Phải e($body) TRƯỚC khi nối link; thoát sau cùng sẽ thoát cả thẻ <a> ta vừa thêm và vẫn để lọt HTML gốc giữa chừng." },
  ],
};
