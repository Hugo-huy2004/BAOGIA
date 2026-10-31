export default {
  id: "step14",
  lang: "php",
  file: "nhip/settings.php",
  duration: "180 phút",
  summary: "Trang cá nhân đầy đủ: sửa hồ sơ, tải ảnh đại diện an toàn (kiểm nội dung, đổi tên ngẫu nhiên, chặn chạy mã), theo dõi / bỏ theo dõi và bảng tin \"Đang theo dõi\".",
  slides: [
    {
      section: "intro",
      title: "Mỗi người một góc riêng",
      body: `Mạng xã hội khác diễn đàn ở chỗ: bạn **chọn nghe ai**. Step này cho Nhịp ba thứ làm nên điều đó:

1. **Hồ sơ** của mỗi người: tên hiển thị, lời giới thiệu, ảnh đại diện.
2. **Theo dõi**: một nút bấm tạo quan hệ trong bảng \`follows\` (đã thiết kế ở step 9).
3. **Bảng tin Đang theo dõi**: chỉ bài của những người bạn chọn.

Kèm theo là chức năng nguy hiểm nhất từ đầu khoá tới giờ: **nhận tệp từ người lạ** và lưu lên máy chủ.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Viết trang \`settings.php\` sửa hồ sơ, kiểm từng trường như step 12.
2. Gửi tệp bằng \`enctype="multipart/form-data"\` và đọc \`$_FILES\`.
3. Kiểm tệp tải lên **theo nội dung** (finfo, getimagesize), giới hạn dung lượng, đổi tên ngẫu nhiên.
4. Cấm thư mục tải lên chạy mã bằng \`.htaccess\`.
5. Theo dõi / bỏ theo dõi bằng POST, dùng \`INSERT IGNORE\` cho thao tác lặp lại vô hại.
6. Truy vấn bảng tin "Đang theo dõi" bằng truy vấn con \`IN\`.
7. Biểu diễn trạng thái nút bằng \`aria-pressed\`.`,
    },
    {
      section: "visual",
      title: "Đồ thị theo dõi",
      visual: "follow-graph",
      body: `Bảng \`follows\` là một **đồ thị có hướng**: mỗi dòng là một mũi tên từ người theo dõi tới người được theo dõi.

- Số **người theo dõi** của Lan = số mũi tên **đi vào** Lan: \`COUNT(*) WHERE followee_id = 1\`.
- Số **đang theo dõi** = số mũi tên **đi ra**: \`COUNT(*) WHERE follower_id = 1\`.
- Hai mũi tên ngược chiều giữa hai người = **theo dõi lẫn nhau** (bạn bè).

Các mạng xã hội lớn gợi ý "người bạn có thể biết" chính bằng cách đi theo các mũi tên này hai bước.`,
    },
    {
      section: "visual",
      title: "Đường đi của một tệp tải lên",
      visual: "upload-pipeline",
      body: `1. Trình duyệt gửi tệp trong thân yêu cầu \`multipart/form-data\`.
2. PHP lưu tạm vào thư mục tạm của hệ thống với tên ngẫu nhiên, ghi thông tin vào \`$_FILES['avatar']\`.
3. Nhịp kiểm: có lỗi tải không, quá 2 MB không, **nội dung** có phải ảnh không.
4. \`move_uploaded_file\` chuyển tệp vào \`uploads/avatars/\` với **tên mới do máy chủ đặt**.
5. Đường dẫn tương đối được lưu vào \`users.avatar\`.

Không qua bước 3 thì tệp tạm tự bị xoá khi PHP chạy xong.`,
    },
    {
      section: "research",
      title: "OWASP về tải tệp lên",
      body: `Bảng hướng dẫn *File Upload* của OWASP liệt kê các biện pháp bắt buộc:

- Chỉ cho phép **danh sách đuôi/kiểu được duyệt**, không chặn theo danh sách đen.
- **Không tin** \`Content-Type\` do máy khách gửi; kiểm **chữ ký tệp** (magic bytes).
- **Đổi tên** tệp bằng giá trị do ứng dụng sinh ra.
- **Giới hạn dung lượng**.
- Lưu ngoài vùng web nếu có thể; nếu không, **cấm thực thi** trong thư mục lưu.

Lỗ hổng tải tệp thuộc nhóm *Injection* và *Security Misconfiguration*: một tệp \`.php\` lọt vào thư mục web là kẻ tấn công chạy được lệnh trên máy chủ của bạn.

> OWASP Foundation (2025) *File Upload Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html`,
    },
    {
      section: "research",
      title: "Mạng xã hội là một đồ thị",
      body: `Nghiên cứu về mạng xã hội trực tuyến mô hình hoá quan hệ "theo dõi" như đồ thị có hướng và chỉ ra đặc điểm lặp lại ở mọi nền tảng: phân bố số người theo dõi **lệch rất mạnh** (vài tài khoản có cực nhiều, đa số có ít), và tỉ lệ theo dõi qua lại thấp hơn nhiều so với mạng bạn bè hai chiều.

Hệ quả kỹ thuật cho Nhịp: đừng bao giờ tải **toàn bộ** danh sách người theo dõi lên trang — một tài khoản nổi tiếng có thể có hàng triệu dòng. Luôn \`COUNT\`, và phân trang khi cần liệt kê.

> Kwak, H., Lee, C., Park, H. and Moon, S. (2010) 'What is Twitter, a social network or a news media?', *Proceedings of the 19th International Conference on World Wide Web*, pp. 591–600. doi:10.1145/1772690.1772751`,
    },
    {
      section: "ideate",
      title: "Thiết kế các phần mới",
      body: `| Tệp | Việc |
|---|---|
| \`settings.php\` | Sửa tên hiển thị, giới thiệu, ảnh đại diện |
| \`follow.php\` | POST \`user_id\` + \`action=follow/unfollow\` → về trang cá nhân |
| \`includes/follows.php\` | \`is_following\`, \`follow\`, \`unfollow\`, \`following_feed\` |
| \`includes/uploads.php\` | \`save_avatar\`, \`delete_avatar\` |
| \`uploads/avatars/\` + \`uploads/.htaccess\` | Nơi lưu ảnh, cấm chạy mã |
| \`profile.php\` | Nút "Sửa hồ sơ" (của mình) hoặc "Theo dõi"/"Đang theo dõi" |
| \`index.php?tab=following\` | Bảng tin Đang theo dõi |

Nút theo dõi là **một biểu mẫu POST** chứ không phải liên kết: theo dõi là thao tác ghi.`,
    },
    {
      section: "core",
      title: "multipart/form-data và $_FILES",
      body: `~~~html
<form method="post" action="settings.php" enctype="multipart/form-data">
  <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp">
~~~

Thiếu \`enctype\` thì trình duyệt chỉ gửi **tên** tệp, không gửi nội dung. \`accept\` lọc tệp trong hộp chọn — tiện cho người dùng, **không** phải kiểm tra bảo mật.

PHP điền \`$_FILES['avatar']\`:

| Khoá | Ví dụ | Tin được? |
|---|---|---|
| \`name\` | \`anh-cua-toi.jpg\` | Không — người dùng đặt |
| \`type\` | \`image/jpeg\` | Không — trình duyệt đoán, sửa được |
| \`tmp_name\` | \`/tmp/phpA1b2C3\` | Có — PHP đặt |
| \`error\` | \`UPLOAD_ERR_OK\` (0) | Có |
| \`size\` | \`2688\` | Có |`,
    },
    {
      section: "core",
      title: "Kiểm tệp theo nội dung",
      body: `~~~php
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
// đọc vài byte đầu: FF D8 FF → image/jpeg, 89 50 4E 47 → image/png

if (!isset(AVATAR_TYPES[$mime]) || getimagesize($file['tmp_name']) === false) {
    throw new RuntimeException('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
}
~~~

- \`finfo\` nhận diện kiểu từ **chữ ký tệp**, không từ đuôi.
- \`getimagesize\` cố đọc kích thước ảnh — tệp không phải ảnh thật thì thất bại.
- \`AVATAR_TYPES\` là **danh sách cho phép** ánh xạ kiểu → đuôi. Đuôi của tệp lưu lấy từ danh sách này, không bao giờ từ tên người dùng gửi.

Giới hạn dung lượng có hai tầng: \`upload_max_filesize\` trong \`php.ini\` (XAMPP mặc định 40 MB) và \`AVATAR_MAX_BYTES\` của Nhịp (2 MB).`,
    },
    {
      section: "core",
      title: "Tên ngẫu nhiên và cấm chạy mã",
      body: `~~~php
$name = bin2hex(random_bytes(16)) . '.' . AVATAR_TYPES[$mime];
// 55c8bcc37640e1719e9b88c0b31d6ee1.jpg
move_uploaded_file($file['tmp_name'], AVATAR_DIR . $name);
~~~

Tên do máy chủ sinh bằng \`random_bytes\` (nguồn ngẫu nhiên an toàn mật mã): không đè tệp người khác, không đoán được, không mang ký tự lạ như \`../\` hay \`shell.php.jpg\`.

Lớp phòng thủ cuối cùng — \`uploads/.htaccess\`:

~~~apache
<FilesMatch "\\.(php|phtml|phar|php[0-9])$">
  Require all denied
</FilesMatch>
Options -Indexes
~~~

Dù bằng cách nào đó một tệp \`.php\` lọt vào, Apache cũng từ chối phục vụ nó. \`-Indexes\` cấm liệt kê danh sách tệp trong thư mục.`,
    },
    {
      section: "core",
      title: "Theo dõi: INSERT IGNORE",
      body: `~~~php
db()->prepare('INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)')
    ->execute([$me, $target]);
~~~

Người dùng bấm "Theo dõi" hai lần (mạng chậm, bấm đúp) thì lần thứ hai vi phạm khoá chính kép. \`INSERT IGNORE\` biến lỗi trùng đó thành cảnh báo im lặng — kết quả cuối cùng vẫn đúng: **một** dòng. Thao tác cho kết quả như nhau dù làm một hay nhiều lần gọi là **idempotent**.

\`DELETE\` để bỏ theo dõi vốn đã idempotent: xoá dòng không tồn tại thì không có gì xảy ra.

Tự theo dõi chính mình bị chặn ba lần: nút không hiện, \`follow()\` trả về sớm, và ràng buộc \`CHECK\` của bảng (step 9).`,
    },
    {
      section: "core",
      title: "Bảng tin Đang theo dõi",
      body: `~~~sql
WHERE p.parent_id IS NULL
  AND (p.user_id = :me
       OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = :me2))
~~~

- Gộp cả bài **của chính mình** để vừa đăng xong vẫn thấy bài trong tab này.
- \`:me\` và \`:me2\` mang cùng giá trị nhưng phải là hai tên: với prepared statement thật (\`EMULATE_PREPARES => false\`), mỗi chỗ trống đặt tên chỉ dùng **một lần**.
- \`bindValue(..., PDO::PARAM_INT)\` cho mọi tham số vì \`LIMIT\` cần số nguyên.

Tab được chọn qua \`?tab=following\`. Khách (chưa đăng nhập) luôn thấy tab Mới nhất — biến \`$tab\` chỉ nhận đúng hai giá trị hợp lệ, mọi thứ khác về mặc định.`,
    },
    {
      section: "core",
      title: "Trạng thái nút cho mọi người",
      body: `~~~html
<button type="submit" class="follow is-following" aria-pressed="true">Đang theo dõi</button>
~~~

- \`aria-pressed\` cho trình đọc màn hình biết đây là nút **bật/tắt** và đang bật — giống nút tim ở step 6.
- Chữ trên nút đổi theo trạng thái ("Theo dõi" ↔ "Đang theo dõi"), không chỉ đổi màu: người mù màu vẫn phân biệt được.
- Hai lớp CSS: nút đặc màu cho hành động chính (Theo dõi), nút viền cho trạng thái đã bật.

Mọi \`<input type="hidden">\` đều là **dữ liệu từ máy khách**: \`follow.php\` vẫn kiểm \`user_id\` bằng \`id_param\` và \`find_user_by_id\`, và chỉ chấp nhận \`action\` là \`unfollow\` — mọi giá trị khác coi là \`follow\`.`,
    },
    {
      section: "apply",
      title: "uploads.php",
      body: "Tạo thư mục `uploads/avatars/` và tệp `uploads/.htaccess` như slide trước. `delete_avatar` chỉ xoá tệp có tên đúng mẫu do Nhịp sinh — không bao giờ `unlink` một đường dẫn tuỳ ý lấy từ cơ sở dữ liệu.",
      code: { file: "nhip/includes/uploads.php", lang: "php", content: `<?php
declare(strict_types=1);

const AVATAR_DIR = __DIR__ . '/../uploads/avatars/';
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;              // 2 MB
const AVATAR_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

/**
 * Lưu ảnh đại diện tải lên. Trả đường dẫn tương đối để lưu vào users.avatar.
 * Ném RuntimeException với câu báo lỗi cho người dùng nếu tệp không hợp lệ.
 */
function save_avatar(array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Tải ảnh lên không thành công.');
    }
    if ($file['size'] > AVATAR_MAX_BYTES) {
        throw new RuntimeException('Ảnh tối đa 2 MB.');
    }
    // Đọc kiểu tệp từ NỘI DUNG, không tin tên tệp hay kiểu trình duyệt gửi.
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset(AVATAR_TYPES[$mime]) || getimagesize($file['tmp_name']) === false) {
        throw new RuntimeException('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
    }
    // Tên mới hoàn toàn ngẫu nhiên: không đoán được, không đè tệp khác, không mang đuôi lạ.
    $name = bin2hex(random_bytes(16)) . '.' . AVATAR_TYPES[$mime];
    if (!move_uploaded_file($file['tmp_name'], AVATAR_DIR . $name)) {
        throw new RuntimeException('Không lưu được ảnh.');
    }
    return 'uploads/avatars/' . $name;
}

/** Xoá ảnh cũ khi người dùng đổi ảnh — chỉ xoá tệp nằm đúng trong thư mục ảnh đại diện. */
function delete_avatar(?string $path): void
{
    if ($path !== null && preg_match('#^uploads/avatars/[a-f0-9]{32}\\.(jpg|png|webp)$#', $path)) {
        @unlink(__DIR__ . '/../' . $path);
    }
}` },
    },
    {
      section: "apply",
      title: "settings.php",
      body: "Ảnh chỉ được lưu khi các trường chữ đã hợp lệ; ảnh cũ chỉ bị xoá **sau** khi cơ sở dữ liệu đã cập nhật xong. Thứ tự này tránh cảnh ảnh mới đã lưu mà hồ sơ không đổi, hoặc ảnh cũ đã mất mà hồ sơ vẫn trỏ tới nó.",
      code: { file: "nhip/settings.php", lang: "php", content: `<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

$me = require_login();
$displayName = $me['display_name'];
$bio = $me['bio'];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $displayName = trim((string) ($_POST['display_name'] ?? ''));
    $bio = trim((string) ($_POST['bio'] ?? ''));

    if (mb_strlen($displayName) < 1 || mb_strlen($displayName) > 60) {
        $errors['display_name'] = 'Tên hiển thị 1–60 ký tự.';
    }
    if (mb_strlen($bio) > 160) {
        $errors['bio'] = 'Giới thiệu tối đa 160 ký tự.';
    }

    $avatar = $me['avatar'];
    $upload = $_FILES['avatar'] ?? null;
    if (!$errors && $upload && $upload['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $avatar = save_avatar($upload);
        } catch (RuntimeException $e) {
            $errors['avatar'] = $e->getMessage();
        }
    }

    if (!$errors) {
        update_profile((int) $me['id'], $displayName, $bio, $avatar);
        if ($avatar !== $me['avatar']) {
            delete_avatar($me['avatar']);
        }
        flash('Đã cập nhật hồ sơ.');
        redirect('profile.php?u=' . urlencode($me['username']));
    }
}

$title = 'Sửa hồ sơ';
$active = 'profile';` },
    },
    {
      section: "apply",
      title: "follows.php và follow.php",
      body: "Thêm `require` cho `follows.php` và `uploads.php` vào `bootstrap.php`, và hàm `update_profile` vào `users.php`.",
      code: { file: "nhip/includes/follows.php", lang: "php", content: `<?php
declare(strict_types=1);

function is_following(int $followerId, int $followeeId): bool
{
    $stmt = db()->prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?');
    $stmt->execute([$followerId, $followeeId]);
    return $stmt->fetchColumn() !== false;
}

/** Theo dõi. INSERT IGNORE: bấm hai lần không lỗi, khoá chính kép chặn trùng. */
function follow(int $followerId, int $followeeId): void
{
    if ($followerId === $followeeId) {
        return;                                  // CHECK trong bảng cũng chặn, nhưng đừng để lỗi tới đó
    }
    db()->prepare('INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)')
        ->execute([$followerId, $followeeId]);
}

function unfollow(int $followerId, int $followeeId): void
{
    db()->prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?')
        ->execute([$followerId, $followeeId]);
}

/** Bảng tin "Đang theo dõi": bài gốc của những người $userId theo dõi, cùng bài của chính mình. */
function following_feed(int $userId, int $limit = 20): array
{
    $stmt = db()->prepare(FEED_SQL . '
        WHERE p.parent_id IS NULL
          AND (p.user_id = :me OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = :me2))
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit');
    $stmt->bindValue(':me', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':me2', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

// follow.php
<?php
declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    abort(405, 'Phương thức không được phép.');
}
$me = require_login();
$target = find_user_by_id(id_param($_POST, 'user_id'));
if ($target === null) {
    abort(404, 'Không có người dùng này.');
}

if (($_POST['action'] ?? '') === 'unfollow') {
    unfollow((int) $me['id'], (int) $target['id']);
} else {
    follow((int) $me['id'], (int) $target['id']);
}
redirect('profile.php?u=' . urlencode($target['username']));` },
    },
    {
      section: "apply",
      title: "profile.php và index.php",
      body: "Trang cá nhân tính `$isMe` và `$following` một lần ở đầu tệp; phần HTML chỉ đọc hai biến đó. Bảng tin thêm thanh tab cho người đã đăng nhập.",
      code: { file: "nhip/profile.php", lang: "php", content: `$posts = posts_by_user((int) $user['id']);
$me = current_user();
$isMe = $me !== null && (int) $me['id'] === (int) $user['id'];
$following = $me !== null && !$isMe && is_following((int) $me['id'], (int) $user['id']);
// ...
      <?php if ($isMe): ?>
        <a class="follow" href="settings.php">Sửa hồ sơ</a>
      <?php elseif ($me): ?>
        <form method="post" action="follow.php" class="follow-form">
          <input type="hidden" name="user_id" value="<?= (int) $user['id'] ?>">
          <input type="hidden" name="action" value="<?= $following ? 'unfollow' : 'follow' ?>">
          <button type="submit" class="follow <?= $following ? 'is-following' : '' ?>" aria-pressed="<?= $following ? 'true' : 'false' ?>">
            <?= $following ? 'Đang theo dõi' : 'Theo dõi' ?>
          </button>
        </form>
      <?php endif; ?>

// index.php
$me = current_user();
$tab = ($me && ($_GET['tab'] ?? '') === 'following') ? 'following' : 'latest';
$posts = $tab === 'following' ? following_feed((int) $me['id']) : feed_posts();` },
    },
    {
      section: "apply",
      title: "Thử tải mã độc lên",
      image: {
        src: "/image/coding/steps/s14-upload-reject.webp",
        alt: "Trang Sửa hồ sơ với dòng lỗi đỏ Chỉ nhận ảnh JPG, PNG hoặc WebP. dưới ô chọn ảnh đại diện",
        caption: "Tải lên tệp shell.php.jpg chứa mã PHP: tên có đuôi .jpg nhưng finfo đọc ra text/x-php → bị từ chối.",
      },
      body: `Tạo tệp \`shell.php.jpg\` với một dòng PHP bất kỳ rồi tải lên làm ảnh đại diện. Nhịp từ chối vì **nội dung** không phải ảnh, mặc kệ tên tệp.

Kiểm thêm:
- Ảnh 3 MB → "Ảnh tối đa 2 MB."
- Ảnh hợp lệ → \`uploads/avatars/\` có một tệp tên 32 ký tự hex; phpMyAdmin cho thấy \`users.avatar\` trỏ đúng tệp đó.
- Đổi ảnh lần hai → tệp cũ biến mất khỏi thư mục.`,
    },
    {
      section: "apply",
      title: "Trang cá nhân của mình",
      image: {
        src: "/image/coding/steps/s14-own-profile.webp",
        alt: "Trang cá nhân Lan Nguyễn với ảnh đại diện mới màu cam, nút Sửa hồ sơ rộng, 4 người theo dõi, 3 đang theo dõi",
        caption: "profile.php?u=lan.code khi Lan đăng nhập: nút Sửa hồ sơ thay cho nút Theo dõi.",
      },
      body: "Ảnh đại diện mới hiện ở cả đầu trang lẫn trên từng bài, vì `FEED_SQL` đã lấy cột `u.avatar` từ step 11 — chỉ cần dữ liệu đổi, giao diện tự theo.",
    },
    {
      section: "apply",
      title: "Theo dõi người khác",
      image: {
        src: "/image/coding/steps/s14-profile-follow.webp",
        alt: "Trang cá nhân An Phạm với nút Theo dõi màu đen đặc",
        caption: "Lan xem trang của an.ui (chưa theo dõi): nút đặc \"Theo dõi\".",
      },
      body: "Bấm **Theo dõi** → trang tải lại, nút thành dạng viền \"Đang theo dõi\", số người theo dõi của An tăng 1. Bấm lần nữa để bỏ theo dõi. Mở phpMyAdmin → `follows` để thấy dòng `(1, 3)` xuất hiện rồi biến mất.",
    },
    {
      section: "apply",
      title: "Tab Đang theo dõi",
      image: {
        src: "/image/coding/steps/s14-following-tab.webp",
        alt: "Bảng tin của Lan với hai tab Mới nhất và Đang theo dõi, tab Đang theo dõi được gạch chân xanh, bên dưới là bài của Lan có ảnh đại diện cam",
        caption: "index.php?tab=following — chỉ bài của Lan và những người Lan theo dõi.",
      },
      body: `Lan theo dõi minh.dev, khoa.data, mai.sec nên tab này **không** có bài của an.ui. Theo dõi An rồi tải lại: hai bài của An xuất hiện.

Nghiệm thu step 14:
- [ ] Sửa tên, giới thiệu, ảnh; lỗi hiện đúng ô; tệp không phải ảnh bị chặn.
- [ ] \`uploads/\` có \`.htaccess\` cấm \`.php\`; tên tệp là 32 ký tự hex.
- [ ] Theo dõi/bỏ theo dõi bằng POST; bấm đúp không tạo lỗi.
- [ ] Không tự theo dõi được mình; tab Đang theo dõi đúng danh sách.`,
    },
  ],
  quiz: [
    { q: "Thiếu thuộc tính nào trên <form> thì tệp không được gửi lên?", o: ["method=\"get\"", "enctype=\"multipart/form-data\"", "accept=\"image/*\"", "novalidate"], a: 1, why: "Không có enctype multipart, trình duyệt chỉ gửi tên tệp." },
    { kind: "multi", q: "Thông tin nào trong $_FILES KHÔNG được tin?", o: ["name", "type", "tmp_name", "size"], a: [0, 1], why: "name và type do máy khách gửi; tmp_name, size do PHP xác định." },
    { kind: "truefalse", q: "Kiểm đuôi tệp là .jpg là đủ để chắc đó là ảnh.", a: false, why: "Đuôi do người dùng đặt; phải đọc nội dung bằng finfo/getimagesize." },
    { q: "Vì sao đổi tên tệp tải lên bằng random_bytes?", o: ["Cho ngắn hơn", "Không đè tệp khác, không đoán được, không mang đuôi/ký tự nguy hiểm", "Bắt buộc của Apache", "Để nén ảnh"], a: 1, why: "Tên do máy chủ sinh loại bỏ mọi rủi ro từ tên người dùng gửi." },
    { q: "uploads/.htaccess với FilesMatch \\.php$ → Require all denied chặn điều gì?", o: ["Tải ảnh lên", "Apache phục vụ/chạy tệp .php trong thư mục tải lên", "Xem ảnh đại diện", "Xoá ảnh cũ"], a: 1, why: "Lớp phòng thủ cuối nếu tệp mã độc lọt qua kiểm tra." },
    { kind: "output", q: "Lan đã theo dõi Minh. Bấm Theo dõi thêm lần nữa. Bảng follows có mấy dòng (1, 2)?", code: "INSERT IGNORE INTO follows (follower_id, followee_id)\nVALUES (1, 2);", o: ["0", "1", "2", "Lỗi 1062"], a: 1, why: "IGNORE bỏ qua lỗi trùng khoá chính; vẫn chỉ một dòng." },
    { kind: "blank", q: "Điền số người theo dõi Lan (id 1).", code: "SELECT COUNT(*) FROM follows WHERE ________ = 1;", a: "followee_id", why: "Người theo dõi Lan là các dòng có Lan ở phía được theo dõi." },
    { kind: "bug", q: "Dòng nào có thể xoá tệp bất kỳ trên máy chủ?", lines: ["$old = $me['avatar'];", "update_profile($id, $name, $bio, $new);", "unlink(__DIR__ . '/' . $_POST['old_avatar']);", "flash('Đã cập nhật hồ sơ.');"], a: 2, why: "Đường dẫn từ máy khách có thể là ../includes/config.php; chỉ xoá tệp đúng mẫu do Nhịp sinh." },
    { q: "Vì sao truy vấn following_feed dùng hai tên :me và :me2 cho cùng một giá trị?", o: ["Cho dễ đọc", "Prepared statement thật không cho dùng lại một chỗ trống đặt tên hai lần", "MySQL yêu cầu", "Để chống SQL Injection"], a: 1, why: "Với EMULATE_PREPARES = false, mỗi tham số đặt tên chỉ xuất hiện một lần." },
    { q: "Thuộc tính nào cho trình đọc màn hình biết nút Theo dõi đang bật?", o: ["aria-hidden=\"true\"", "aria-pressed=\"true\"", "data-on=\"1\"", "class=\"is-following\""], a: 1, why: "Lớp CSS chỉ đổi màu; aria-pressed mang ngữ nghĩa bật/tắt." },
  ],
};
