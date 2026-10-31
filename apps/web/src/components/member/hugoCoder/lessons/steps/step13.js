export default {
  id: "step13",
  lang: "php",
  file: "nhip/edit.php",
  duration: "150 phút",
  summary: "Hoàn thiện CRUD bài đăng: trang chi tiết, sửa, xoá; kiểm quyền sở hữu ngay trong câu SQL; phân biệt 403, 404, 405; đọc id an toàn và hỏi lại trước khi xoá.",
  slides: [
    {
      section: "intro",
      title: "Từ \"đăng được\" tới \"quản lý được\"",
      body: `Nhịp đã có **C** (Create — đăng bài) và **R** (Read — bảng tin). Một sản phẩm thật còn cần **U** (Update — sửa lỗi chính tả) và **D** (Delete — gỡ bài lỡ đăng).

Hai thao tác này nguy hiểm hơn hẳn: chúng **thay đổi dữ liệu đã có**. Nếu kiểm tra sai, bất kỳ ai cũng sửa/xoá được bài của người khác — lỗi phân quyền đứng **số 1** trong OWASP Top 10. Step này dạy cách viết U và D sao cho lỗi đó không thể xảy ra.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Ánh xạ CRUD ↔ phương thức HTTP ↔ câu SQL.
2. Viết trang chi tiết \`post.php?id=\` và trang sửa \`edit.php?id=\`.
3. Xoá bằng **POST** tới \`delete.php\`, có hỏi lại.
4. Kiểm quyền sở hữu **trong câu SQL** (\`WHERE id = ? AND user_id = ?\`) và đọc \`rowCount()\`.
5. Đọc id từ địa chỉ bằng \`filter_var\` và trả đúng mã **403 / 404 / 405**.
6. Hiện dấu "đã sửa" bằng cột \`updated_at\`.`,
    },
    {
      section: "visual",
      title: "CRUD, HTTP và SQL",
      visual: "crud-map",
      body: `| Thao tác | Trang Nhịp | HTTP | SQL |
|---|---|---|---|
| Create | \`index.php\` | POST | \`INSERT\` |
| Read | \`index.php\`, \`post.php?id=3\` | GET | \`SELECT\` |
| Update | \`edit.php?id=3\` | GET (biểu mẫu) → POST | \`UPDATE … WHERE id AND user_id\` |
| Delete | \`delete.php\` | POST | \`DELETE … WHERE id AND user_id\` |

Luật chung: **GET chỉ đọc**. Mọi thao tác ghi đi bằng POST — trình duyệt, máy tìm kiếm và bộ nhớ đệm được phép gọi lại GET bất cứ lúc nào.`,
    },
    {
      section: "visual",
      title: "Kiểm quyền ở hai lớp",
      visual: "ownership-check",
      body: `**Lớp giao diện**: chỉ chủ bài mới thấy nút Sửa/Xoá. Đây là để **dễ dùng**, không phải để bảo mật — ai cũng tự gõ được \`edit.php?id=2\`.

**Lớp máy chủ**: \`edit.php\` so \`user_id\` của bài với người đang đăng nhập; \`UPDATE\`/\`DELETE\` mang thêm điều kiện \`user_id = ?\`. Không phải chủ bài thì **không dòng nào khớp** — kể cả khi mã PHP phía trên có sơ suất.

Hai lớp, nhưng chỉ lớp thứ hai mới là bảo mật.`,
    },
    {
      section: "research",
      title: "Broken Access Control — OWASP A01",
      body: `Trong OWASP Top 10 bản **2025**, *Broken Access Control* giữ vị trí **số 1** (như bản 2021): **100%** ứng dụng được kiểm tra có ít nhất một dạng lỗi này, và đây là nhóm xuất hiện nhiều nhất trong toàn bộ dữ liệu. Dạng phổ biến nhất chính là **IDOR** (Insecure Direct Object Reference) — đổi id trên địa chỉ để xem/sửa đối tượng của người khác.

OWASP khuyến nghị: **từ chối theo mặc định**, kiểm quyền trong mã máy chủ đáng tin cho **từng** yêu cầu, viết cơ chế kiểm quyền **một lần** rồi dùng lại khắp ứng dụng, và ràng buộc thao tác vào chủ sở hữu bản ghi.

> OWASP Foundation (2025) *A01:2025 – Broken Access Control*, OWASP Top 10:2025. Available at: https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
>
> OWASP Foundation (2025) *Authorization Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html`,
    },
    {
      section: "research",
      title: "Ngữ nghĩa phương thức và mã trạng thái",
      body: `RFC 9110 định nghĩa GET là phương thức **an toàn** (không thay đổi trạng thái máy chủ) và quy định ý nghĩa các mã lỗi:

- **403 Forbidden** — máy chủ hiểu yêu cầu nhưng **từ chối** thực hiện.
- **404 Not Found** — không tìm thấy tài nguyên, *hoặc* máy chủ **không muốn tiết lộ** nó có tồn tại.
- **405 Method Not Allowed** — tài nguyên có, nhưng không nhận phương thức này.

Chú ý vế thứ hai của 404: chuẩn HTTP cho phép trả 404 thay cho 403 để không lộ thông tin — Nhịp dùng đúng điều này ở \`delete.php\`.

> Fielding, R., Nottingham, M. and Reschke, J. (2022) *RFC 9110: HTTP Semantics*, §9.2.1, §15.5.4–15.5.6. IETF. Available at: https://www.rfc-editor.org/rfc/rfc9110`,
    },
    {
      section: "ideate",
      title: "Ba trang, ba hàm",
      body: `| Tệp | Việc |
|---|---|
| \`post.php?id=\` | Một bài + (step 15) các câu trả lời. Liên kết từ thời gian của mỗi bài. |
| \`edit.php?id=\` | GET: biểu mẫu điền sẵn. POST: kiểm tra → \`update_post\` → về \`post.php\`. |
| \`delete.php\` | Chỉ POST: \`delete_post\` → về bảng tin. |

Ba hàm mới trong \`posts.php\`: \`find_post\`, \`update_post\`, \`delete_post\`. Hai hàm tiện ích trong \`helpers.php\`: \`abort()\` in trang lỗi có mã trạng thái, \`id_param()\` đọc id an toàn.

Thẻ bài \`includes/post.php\` tự quyết có hiện nút Sửa/Xoá hay không dựa vào \`current_user()\`.`,
    },
    {
      section: "core",
      title: "Đọc id an toàn",
      body: `~~~php
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);
// "3" → 3 · "3abc" → false · "-1" → false · "" → false · mảng → false
~~~

So với \`(int) $_GET['id']\`: ép kiểu biến \`"3abc"\` thành 3 và \`"abc"\` thành 0 — lặng lẽ "sửa" dữ liệu sai thành dữ liệu đúng. \`FILTER_VALIDATE_INT\` từ chối thẳng, và \`id_param()\` biến từ chối đó thành trang **404**.

Nguyên tắc: **kiểm tra rồi từ chối**, đừng **đoán ý rồi sửa** dữ liệu đầu vào.`,
    },
    {
      section: "core",
      title: "UPDATE có điều kiện chủ sở hữu",
      body: `~~~php
$stmt = db()->prepare('
    UPDATE posts SET body = :body, updated_at = NOW()
    WHERE id = :id AND user_id = :user_id');
$stmt->execute(['body' => $body, 'id' => $id, 'user_id' => $me['id']]);
return $stmt->rowCount() === 1;
~~~

- \`user_id\` lấy từ **phiên** (\`require_login()\`), không bao giờ từ biểu mẫu.
- \`rowCount()\` cho biết bao nhiêu dòng bị đổi: 1 là thành công, 0 là "không có bài nào của bạn mang id này".
- \`updated_at = NOW()\` ghi lại thời điểm sửa; thẻ bài hiện "· đã sửa" khi cột này khác NULL.

Lưu ý nhỏ của MySQL: nếu nội dung mới **giống hệt** nội dung cũ thì \`body\` không đổi nhưng \`updated_at\` vẫn đổi → \`rowCount()\` vẫn là 1.`,
    },
    {
      section: "core",
      title: "DELETE và CASCADE",
      body: `~~~php
$stmt = db()->prepare('DELETE FROM posts WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $me['id']]);
~~~

Khoá ngoại ở step 9 có \`ON DELETE CASCADE\`, nên xoá một bài sẽ **tự xoá** mọi lượt tim của nó và mọi câu trả lời (cùng tim và trả lời của chúng, lan xuống hết cây). Không cần viết thêm lệnh nào.

**Xoá mềm** — một lựa chọn khác: thêm cột \`deleted_at\` và chỉ ẩn bài. Ưu điểm: khôi phục được, giữ chứng cứ khi có khiếu nại. Nhược điểm: mọi truy vấn phải nhớ thêm \`WHERE deleted_at IS NULL\`. Nhịp chọn xoá cứng cho đơn giản; dự án hoàn tất ở step 26 có thể làm xoá mềm như một tính năng mới.`,
    },
    {
      section: "core",
      title: "403, 404 hay 405?",
      body: `| Tình huống | Nhịp trả | Lý do |
|---|---|---|
| \`edit.php?id=abc\` | 404 | id sai dạng = không có tài nguyên |
| \`edit.php?id=999\` (không có) | 404 | |
| \`edit.php?id=2\` (bài người khác) | **403** | Bài công khai, ai cũng biết nó tồn tại → nói thật: không có quyền |
| \`POST delete.php\` id bài người khác | **404** | Không phân biệt "không có" và "không phải của bạn" — một câu, một mã |
| \`GET delete.php\` | 405 | Xoá chỉ nhận POST |
| Chưa đăng nhập | 303 → \`login.php\` | \`require_login()\` |

Hàm \`abort()\` gom việc này: đặt mã trạng thái, in trang lỗi trong khung chung của Nhịp, rồi \`exit\`.`,
    },
    {
      section: "core",
      title: "Hỏi lại trước khi xoá",
      body: `Biểu mẫu xoá mang thuộc tính dữ liệu:

~~~html
<form method="post" action="delete.php" data-confirm="Xoá bài này? Không hoàn tác được.">
~~~

\`js/app.js\` có **một** bộ nghe \`submit\` cho cả trang (uỷ quyền sự kiện — step 6): biểu mẫu nào có \`data-confirm\` thì hỏi \`confirm()\` trước khi gửi.

Vì sao không viết \`onsubmit="return confirm(...)"\` ngay trong HTML? Step 18 bật **Content Security Policy** cấm mọi mã JavaScript viết trong thuộc tính HTML — cách viết hôm nay đã sẵn sàng cho điều đó.

JavaScript tắt thì biểu mẫu vẫn gửi được (không hỏi lại) — chức năng không phụ thuộc JavaScript, JavaScript chỉ làm trải nghiệm tốt hơn.`,
    },
    {
      section: "core",
      title: "Lỗ hổng còn chờ ở step 18",
      body: `Thử dựng một trang HTML ở thư mục khác, chứa:

~~~html
<form method="post" action="http://localhost/nhip/delete.php">
  <input type="hidden" name="id" value="3">
</form>
<script>document.forms[0].submit()</script>
~~~

Nếu Lan đang đăng nhập Nhịp và mở trang đó, liệu bài 3 có bị xoá? Đây gọi là **CSRF** (Cross-Site Request Forgery). Cookie \`SameSite=Lax\` ở step 12 đã chặn trường hợp này trên trình duyệt hiện đại — nhưng không nên chỉ dựa vào một lớp. Step 18 thêm **mã chống CSRF** cho mọi biểu mẫu POST.`,
    },
    {
      section: "apply",
      title: "posts.php: tìm, sửa, xoá",
      body: "Thêm `p.parent_id, p.updated_at` vào `FEED_SQL`, rồi thêm ba hàm cuối tệp.",
      code: { file: "nhip/includes/posts.php", lang: "php", content: `/** Một bài theo id (kể cả câu trả lời), hoặc null. */
function find_post(int $id): ?array
{
    $stmt = db()->prepare(FEED_SQL . ' WHERE p.id = ? GROUP BY p.id');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    return $post === false ? null : $post;
}

/**
 * Sửa bài. Điều kiện user_id nằm NGAY TRONG câu UPDATE: không phải chủ bài thì
 * không dòng nào khớp. Trả true nếu đã sửa.
 */
function update_post(int $id, int $userId, string $body): bool
{
    $stmt = db()->prepare('
        UPDATE posts SET body = :body, updated_at = NOW()
        WHERE id = :id AND user_id = :user_id');
    $stmt->execute(['body' => trim($body), 'id' => $id, 'user_id' => $userId]);
    return $stmt->rowCount() === 1;
}

/** Xoá bài của chính mình. Câu trả lời và lượt tim tự xoá theo (ON DELETE CASCADE). */
function delete_post(int $id, int $userId): bool
{
    $stmt = db()->prepare('DELETE FROM posts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    return $stmt->rowCount() === 1;
}` },
    },
    {
      section: "apply",
      title: "helpers.php: abort và id_param",
      body: "`abort()` chạy `header.php`/`footer.php` bên trong hàm — các biến `$title`, `$active` là biến cục bộ của hàm nên vẫn dùng được trong hai tệp đó.",
      code: { file: "nhip/includes/helpers.php", lang: "php", content: `/** Dừng với một trang lỗi gọn: 403 không có quyền, 404 không tìm thấy… */
function abort(int $status, string $message): never
{
    http_response_code($status);
    $title = (string) $status;
    $active = '';
    require __DIR__ . '/header.php';
    echo '<main class="feed"><p class="empty">' . e($message) . '</p></main>';
    require __DIR__ . '/footer.php';
    exit;
}

/** Đọc id dạng số nguyên dương từ $_GET hoặc $_POST; sai dạng thì 404. */
function id_param(array $source, string $key = 'id'): int
{
    $id = filter_var($source[$key] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        abort(404, 'Không tìm thấy.');
    }
    return $id;
}` },
    },
    {
      section: "apply",
      title: "edit.php",
      body: "Kiểm tra theo thứ tự: đã đăng nhập → id hợp lệ → bài tồn tại → đúng chủ. Mỗi bước sai dừng ngay với mã riêng.",
      code: { file: "nhip/edit.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$me = require_login();
$id = id_param($_GET);
$post = find_post($id);

if ($post === null) {
    abort(404, 'Bài này không còn tồn tại.');
}
if ((int) $post['user_id'] !== (int) $me['id']) {
    abort(403, 'Bạn chỉ sửa được bài của mình.');
}

$body = $post['body'];
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = (string) ($_POST['body'] ?? '');
    $error = check_post($body);
    if ($error === null) {
        update_post($id, (int) $me['id'], $body);
        flash('Đã lưu thay đổi.');
        redirect('post.php?id=' . $id);
    }
}

$title = 'Sửa bài';
$active = '';
require __DIR__ . '/includes/header.php';
?>
  <main class="feed">
    <h1>Sửa bài</h1>
    <form class="composer" method="post" action="edit.php?id=<?= $id ?>">
      <label for="body">Nội dung</label>
      <textarea id="body" name="body" rows="5" maxlength="<?= MAX_LENGTH ?>" required><?= e($body) ?></textarea>
      <?php if ($error !== null): ?>
        <p class="form-error" role="alert"><?= e($error) ?></p>
      <?php endif; ?>
      <div class="composer-foot">
        <a href="post.php?id=<?= $id ?>">Huỷ</a>
        <button type="submit">Lưu</button>
      </div>
    </form>
  </main>
<?php require __DIR__ . '/includes/footer.php'; ?>` },
    },
    {
      section: "apply",
      title: "delete.php và post.php",
      body: "`delete.php` không có giao diện: chỉ xử lý rồi chuyển hướng. `post.php` là trang chi tiết đơn giản, step 15 sẽ thêm các câu trả lời bên dưới.",
      code: { file: "nhip/delete.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    abort(405, 'Phương thức không được phép.');
}
$me = require_login();
$id = id_param($_POST);

if (!delete_post($id, (int) $me['id'])) {
    // Không nói rõ "không tồn tại" hay "không phải của bạn".
    abort(404, 'Không tìm thấy bài để xoá.');
}
flash('Đã xoá bài.');
redirect('index.php');

// post.php
<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$post = find_post(id_param($_GET));
if ($post === null) {
    abort(404, 'Bài này không còn tồn tại.');
}

$title = 'Bài của @' . $post['username'];
$active = '';
require __DIR__ . '/includes/header.php';` },
    },
    {
      section: "apply",
      title: "Thẻ bài biết ai đang xem",
      body: "So `user_id` của bài với người đang đăng nhập để quyết định hiện nút. Thời gian của bài thành liên kết tới `post.php`. Thêm `<script src=\"js/app.js\" defer></script>` vào `footer.php`.",
      code: { file: "nhip/includes/post.php", lang: "php", content: `<?php
/** @var array $post một dòng từ FEED_SQL */
$viewer = current_user();
$isOwner = $viewer !== null && (int) $viewer['id'] === (int) $post['user_id'];
?>
<article class="post">
  <img class="avatar" src="<?= e($post['avatar'] ?? 'img/avatar.svg') ?>" alt="" width="40" height="40">
  <div class="post-body">
    <header class="post-head">
      <a class="author" href="profile.php?u=<?= urlencode($post['username']) ?>">
        <?= e($post['display_name']) ?> <span class="handle">@<?= e($post['username']) ?></span>
      </a>
      <a class="when" href="post.php?id=<?= (int) $post['id'] ?>">
        <time datetime="<?= e($post['created_at']) ?>"><?= time_ago($post['created_at']) ?></time>
        <?= $post['updated_at'] ? '· đã sửa' : '' ?>
      </a>
    </header>
    <p class="post-text"><?= e($post['body']) ?></p>
    <footer class="post-actions">
      <span class="like-count">♥ <?= (int) $post['likes'] ?></span>
      <?php if ($isOwner): ?>
        <a class="action" href="edit.php?id=<?= (int) $post['id'] ?>">Sửa</a>
        <form method="post" action="delete.php" class="inline" data-confirm="Xoá bài này? Không hoàn tác được.">
          <input type="hidden" name="id" value="<?= (int) $post['id'] ?>">
          <button type="submit" class="action danger">Xoá</button>
        </form>
      <?php endif; ?>
    </footer>
  </div>
</article>

// js/app.js
// Hỏi lại trước khi gửi những biểu mẫu nguy hiểm (xoá bài…).
// Gắn một lần cho cả trang nhờ sự kiện submit nổi bọt — giống step 6.
document.addEventListener("submit", (event) => {
  const message = event.target.dataset.confirm;
  if (message && !window.confirm(message)) {
    event.preventDefault();
  }
});` },
    },
    {
      section: "apply",
      title: "Kết quả: chủ bài thấy Sửa và Xoá",
      image: {
        src: "/image/coding/steps/s13-owner-actions.webp",
        alt: "Trang cá nhân của Lan Nguyễn khi Lan đăng nhập: mỗi bài có số tim, nút Sửa màu xám và nút Xoá màu đỏ; bài Box model ghi 26/10/2026 · đã sửa",
        caption: "Đăng nhập lan.code rồi mở trang cá nhân. Đăng nhập minh.dev mở cùng trang: không có nút nào.",
      },
      body: "Bài đã sửa hiện \"· đã sửa\" cạnh thời gian. Mọi nút đều cao ≥ 44px để bấm dễ trên điện thoại — tiêu chí WCAG mà Nhịp giữ từ chặng 1.",
    },
    {
      section: "apply",
      title: "Sửa bài",
      image: {
        src: "/image/coding/steps/s13-edit.webp",
        alt: "Trang Sửa bài với ô Nội dung điền sẵn Box model: content → padding → border → margin., liên kết Huỷ và nút Lưu",
        caption: "edit.php?id=3 — biểu mẫu điền sẵn nội dung cũ.",
      },
      body: "Bấm **Lưu** → 303 về `post.php?id=3` với lời nhắn \"Đã lưu thay đổi.\" (flash từ step 12). Xoá hết chữ rồi Lưu → lỗi \"Hãy viết gì đó.\" — `check_post()` của step 8 dùng lại nguyên vẹn.",
    },
    {
      section: "apply",
      title: "Thử làm kẻ xấu",
      image: {
        src: "/image/coding/steps/s13-403.webp",
        alt: "Trang lỗi 403 của Nhịp với dòng Bạn chỉ sửa được bài của mình.",
        caption: "Đang đăng nhập lan.code, gõ thẳng edit.php?id=2 (bài của minh.dev).",
      },
      body: `Tự kiểm từng đường tấn công:

1. \`edit.php?id=2\` → **403**.
2. DevTools → sửa \`<input name="id" value="…">\` của nút Xoá thành \`2\` → bấm Xoá → **404**, bài 2 còn nguyên.
3. \`delete.php?id=3\` (GET) → **405**.
4. Đăng xuất rồi mở \`edit.php?id=3\` → về trang đăng nhập.
5. Mở phpMyAdmin xác nhận bài 2 không đổi \`updated_at\`.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 13",
      body: `- [ ] Chủ bài sửa và xoá được; người khác không thấy nút và không làm được dù gõ tay.
- [ ] Mọi \`UPDATE\`/\`DELETE\` trên \`posts\` đều có \`AND user_id = ?\` lấy từ phiên.
- [ ] id sai dạng → 404; bài người khác → 403 (sửa) hoặc 404 (xoá); GET \`delete.php\` → 405.
- [ ] Xoá bài có câu trả lời và tim: phpMyAdmin cho thấy chúng biến mất theo.
- [ ] Hỏi lại trước khi xoá, không dùng \`onsubmit\` viết trong HTML.
- [ ] Bài đã sửa hiện "đã sửa".`,
    },
  ],
  quiz: [
    { q: "Lớp nào thực sự ngăn người khác sửa bài của bạn?", o: ["Ẩn nút Sửa", "Điều kiện AND user_id = ? trong câu UPDATE", "Đặt id bài khó đoán", "JavaScript confirm()"], a: 1, why: "Ẩn nút chỉ là giao diện; ai cũng gõ tay được địa chỉ." },
    { kind: "output", q: "Lan (id 1) gửi lệnh sau với bài 2 của Minh. rowCount() trả gì?", code: "UPDATE posts SET body = 'x'\nWHERE id = 2 AND user_id = 1;", o: ["1", "0", "2", "Lỗi SQL"], a: 1, why: "Không dòng nào thoả cả hai điều kiện." },
    { kind: "truefalse", q: "(int) $_GET['id'] là cách đủ an toàn để đọc id vì nó luôn ra số.", a: false, why: "Nó biến 'abc' thành 0 và '3abc' thành 3 — lặng lẽ chấp nhận dữ liệu sai. Dùng FILTER_VALIDATE_INT." },
    { q: "Mã trạng thái nào cho GET delete.php?", o: ["200", "403", "404", "405"], a: 3, why: "405 Method Not Allowed: tài nguyên chỉ nhận POST." },
    { kind: "multi", q: "Thao tác nào phải dùng POST?", o: ["Xoá bài", "Sửa bài (lưu)", "Xem bài post.php?id=3", "Đăng xuất"], a: [0, 1, 3], why: "GET chỉ dùng để đọc." },
    { kind: "bug", q: "Dòng nào cho phép người khác xoá bài bất kỳ?", lines: ["$me = require_login();", "$id = id_param($_POST);", "$stmt = db()->prepare('DELETE FROM posts WHERE id = ?');", "$stmt->execute([$id]);"], a: 2, why: "Thiếu AND user_id = ? — chỉ cần biết id là xoá được." },
    { q: "Xoá một bài có 3 câu trả lời và 5 lượt tim. Điều gì xảy ra với chúng?", o: ["Còn nguyên, thành mồ côi", "Lỗi khoá ngoại, không xoá được", "Tự xoá theo nhờ ON DELETE CASCADE", "Chuyển sang bài khác"], a: 2, why: "Khoá ngoại fk_posts_parent và fk_likes_post có CASCADE." },
    { kind: "order", q: "Sắp xếp các bước kiểm tra trong edit.php.", items: ["require_login()", "id_param($_GET)", "find_post() — không có thì 404", "So user_id — khác thì 403"], a: [0, 1, 2, 3], why: "Mỗi bước sai dừng ngay với mã riêng." },
    { kind: "blank", q: "Điền phương thức PDO cho biết số dòng bị UPDATE/DELETE.", code: "return $stmt->________() === 1;", a: "rowCount", why: "rowCount() trả số dòng bị ảnh hưởng." },
    { q: "Vì sao không viết onsubmit=\"return confirm(...)\" trong HTML?", o: ["confirm() đã lỗi thời", "Content Security Policy ở step 18 sẽ chặn mã JavaScript trong thuộc tính HTML", "Không chạy trên điện thoại", "PHP không in được dấu nháy"], a: 1, why: "Để hành vi trong js/app.js giúp áp CSP chặt mà không vỡ chức năng." },
  ],
};
