export default {
  id: "step10",
  lang: "sql",
  file: "nhip/database/queries.sql",
  duration: "150 phút",
  summary: "Đổ dữ liệu mẫu rồi viết mọi truy vấn Nhịp cần: SELECT, WHERE, ORDER BY, LIMIT, JOIN, LEFT JOIN, GROUP BY, HAVING, truy vấn con, phân trang, UPDATE/DELETE an toàn và giao dịch.",
  slides: [
    {
      section: "intro",
      title: "Hỏi dữ liệu bằng một câu",
      body: `Bảng tin của Nhịp phải trả lời câu hỏi: *"20 bài gốc mới nhất, mỗi bài kèm tên tác giả và số tim là gì?"*

Ở chặng 1, bạn trả lời bằng \`filter\`, \`map\`, \`sort\` trên một mảng. Với SQL, bạn **mô tả kết quả muốn có** và để cơ sở dữ liệu tự tìm cách lấy nhanh nhất — dù bảng có 10 dòng hay 10 triệu dòng. Đó là ngôn ngữ **khai báo** (declarative), khác với ngôn ngữ **mệnh lệnh** (imperative) bạn viết từ trước tới giờ.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Nạp dữ liệu mẫu bằng \`INSERT\` và tính năng **Nhập** của phpMyAdmin.
2. Viết \`SELECT … FROM … WHERE … ORDER BY … LIMIT\`.
3. Ghép bảng bằng \`JOIN\` và \`LEFT JOIN\`; biết khi nào cần LEFT.
4. Đếm và gom nhóm bằng \`COUNT\`, \`GROUP BY\`, \`HAVING\`.
5. Dùng truy vấn con cho bảng tin "Đang theo dõi".
6. Phân trang bằng \`LIMIT/OFFSET\` và hiểu giới hạn của nó.
7. Sửa/xoá an toàn: **không bao giờ** \`UPDATE\`/\`DELETE\` thiếu \`WHERE\`; gom nhiều lệnh vào một **giao dịch**.`,
    },
    {
      section: "visual",
      title: "JOIN ghép hai bảng",
      visual: "sql-join",
      body: `\`JOIN users AS u ON u.id = p.user_id\`: với mỗi dòng của \`posts\`, tìm dòng của \`users\` có \`id\` bằng \`user_id\` rồi **dán hai dòng làm một**.

- **INNER JOIN** (viết tắt \`JOIN\`): chỉ giữ dòng có cặp ở cả hai bên.
- **LEFT JOIN**: giữ **mọi** dòng bên trái; bên phải không có cặp thì điền \`NULL\`.

Bài chưa ai thả tim không có dòng nào trong \`likes\`. Dùng \`JOIN\` thì bài đó **biến mất** khỏi bảng tin; dùng \`LEFT JOIN\` thì bài còn, số tim bằng 0.`,
    },
    {
      section: "visual",
      title: "Thứ tự SQL thực sự chạy",
      visual: "sql-order",
      body: `Bạn viết \`SELECT\` đầu tiên, nhưng cơ sở dữ liệu xử lý theo thứ tự logic:

**FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**

Hệ quả thực tế:

- \`WHERE\` không dùng được bí danh đặt trong \`SELECT\` (lúc đó cột chưa tồn tại).
- Lọc **từng dòng** dùng \`WHERE\`; lọc **từng nhóm** sau khi đếm dùng \`HAVING\`.
- \`ORDER BY\` thì dùng được bí danh, vì nó chạy sau \`SELECT\`.`,
    },
    {
      section: "research",
      title: "SQL: từ SEQUEL tới chuẩn ISO",
      body: `Chamberlin và Boyce (IBM) thiết kế SEQUEL năm 1974 để người không phải lập trình viên cũng hỏi được dữ liệu bằng câu gần tiếng Anh; tên rút lại thành SQL. Từ 1987, SQL là chuẩn quốc tế ISO/IEC 9075 và vẫn được cập nhật (bản gần nhất SQL:2023).

Vì là chuẩn, các truy vấn trong khoá này chạy gần như nguyên vẹn trên MySQL, MariaDB, PostgreSQL hay SQLite; khác biệt nằm ở phần mở rộng riêng của từng hệ.

> Chamberlin, D.D. and Boyce, R.F. (1974) 'SEQUEL: A structured English query language', *Proceedings of the 1974 ACM SIGFIDET Workshop*, pp. 249–264. doi:10.1145/800296.811515
>
> ISO/IEC (2023) *ISO/IEC 9075-2:2023 Information technology — Database languages SQL — Part 2: Foundation (SQL/Foundation)*. Geneva: ISO.`,
    },
    {
      section: "research",
      title: "Truy vấn an toàn theo tài liệu MySQL",
      body: `Tài liệu MySQL khuyến nghị bật chế độ \`sql_safe_updates\` khi làm việc tay: chế độ này **từ chối** \`UPDATE\` và \`DELETE\` không có \`WHERE\` dùng khoá — đúng loại lệnh đã xoá sạch dữ liệu thật của rất nhiều công ty.

Về phân trang, tài liệu tối ưu hoá của MySQL lưu ý \`LIMIT n OFFSET m\` vẫn phải **đọc và bỏ qua** m dòng đầu; trang càng sâu càng chậm. Phân trang theo khoá (keyset) khắc phục điều này.

> Oracle (2025) *MySQL 8.4 Reference Manual: Using Safe-Updates Mode (--safe-updates)*. Available at: https://dev.mysql.com/doc/refman/8.4/en/mysql-tips.html
>
> Oracle (2025) *MySQL 8.4 Reference Manual: LIMIT Query Optimization*. Available at: https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html`,
    },
    {
      section: "ideate",
      title: "Mỗi màn hình là một truy vấn",
      body: `Trước khi viết SQL, liệt kê màn hình và **câu hỏi** của nó:

| Màn hình | Câu hỏi |
|---|---|
| Bảng tin | 20 bài gốc mới nhất + tác giả + số tim |
| Trang cá nhân | Thông tin người dùng + số người theo dõi / đang theo dõi |
| Chi tiết bài | Các câu trả lời của một bài, cũ trước |
| Tab Đang theo dõi | Bài của những người tôi theo dõi |
| Bảng xếp hạng | Ai đăng nhiều nhất |

Viết và **chạy thử từng câu trong phpMyAdmin** trước, đúng rồi mới đưa vào PHP ở step 11. Lỗi SQL dễ thấy hơn nhiều khi chưa bị PHP bọc ngoài.`,
    },
    {
      section: "core",
      title: "Nạp dữ liệu mẫu",
      image: {
        src: "/image/coding/steps/s10-import.webp",
        alt: "Tab Nhập của phpMyAdmin cho cơ sở dữ liệu nhip: nút Chọn tệp, bảng mã của tập tin utf-8, giới hạn 40MiB",
        caption: "nhip → Nhập → Chọn tệp seed.sql → kéo xuống bấm Nhập. Bảng mã của tập tin phải là utf-8.",
      },
      body: `Hai cách chạy \`seed.sql\`:

1. **Nhập**: chọn \`nhip\` → tab **Nhập** → *Chọn tệp* → \`database/seed.sql\` → **Nhập** ở cuối trang.
2. **SQL**: mở tệp bằng VS Code, chép hết, dán vào tab **SQL** → **Thực hiện**.

Cú pháp chèn nhiều dòng một lần:

~~~sql
INSERT INTO users (username, display_name, email, password_hash)
VALUES ('lan.code', 'Lan Nguyễn', 'lan@example.com', '$2y$10$…'),
       ('minh.dev', 'Minh Trần',  'minh@example.com', '$2y$10$…');
~~~

Không ghi \`id\` — \`AUTO_INCREMENT\` tự cấp. Muốn nạp lại từ đầu: chạy lại \`schema.sql\` (sau khi xoá cơ sở dữ liệu) rồi \`seed.sql\`.`,
    },
    {
      section: "core",
      title: "SELECT, WHERE, ORDER BY, LIMIT",
      body: `~~~sql
SELECT id, body, created_at          -- lấy cột nào (tránh SELECT * trong mã thật)
FROM posts                           -- từ bảng nào
WHERE user_id = 1                    -- lọc dòng
  AND parent_id IS NULL              -- NULL phải so bằng IS / IS NOT
ORDER BY created_at DESC             -- mới nhất trước
LIMIT 5;                             -- tối đa 5 dòng
~~~

Toán tử hay dùng trong \`WHERE\`: \`=\`, \`<>\`, \`<\`, \`>=\`, \`BETWEEN a AND b\`, \`IN (1, 2, 3)\`, \`LIKE '%php%'\` (\`%\` là chuỗi bất kỳ), \`AND\`, \`OR\`, \`NOT\`.

**Bẫy NULL**: \`parent_id = NULL\` **luôn** cho kết quả rỗng, vì NULL nghĩa là "không biết" và so sánh với "không biết" cũng ra "không biết". Luôn viết \`IS NULL\`.`,
    },
    {
      section: "core",
      title: "Bí danh và tên cột đầy đủ",
      body: `Khi nối nhiều bảng, nhiều bảng có cùng tên cột (\`id\`, \`created_at\`). Đặt **bí danh bảng** và luôn ghi \`bảng.cột\`:

~~~sql
SELECT p.id, u.username, p.created_at
FROM posts AS p
JOIN users AS u ON u.id = p.user_id;
~~~

Thiếu tiền tố, MySQL báo lỗi *Column 'id' in field list is ambiguous* (#1052).

Bí danh cột: \`COUNT(l.user_id) AS likes\` — tên \`likes\` chính là khoá mảng mà PHP nhận được ở step 11 (\`$post['likes']\`), nên đặt tên rõ nghĩa, chữ thường.`,
    },
    {
      section: "core",
      title: "Đếm tim: LEFT JOIN + GROUP BY",
      body: `~~~sql
SELECT p.id, p.body, COUNT(l.user_id) AS likes
FROM posts AS p
LEFT JOIN likes AS l ON l.post_id = p.id
GROUP BY p.id, p.body;
~~~

- \`LEFT JOIN\` nhân mỗi bài thành nhiều dòng — một dòng cho mỗi lượt tim (hoặc một dòng NULL nếu không có tim).
- \`GROUP BY p.id\` gộp các dòng cùng bài làm một.
- \`COUNT(l.user_id)\` đếm số giá trị **không NULL** → bài không có tim ra **0**. Nếu viết \`COUNT(*)\`, bài không có tim ra **1** (đếm cả dòng NULL) — lỗi kinh điển.

Mọi cột trong \`SELECT\` mà không nằm trong hàm gộp phải có trong \`GROUP BY\`; MySQL 8 bật \`ONLY_FULL_GROUP_BY\` sẽ báo lỗi nếu thiếu.`,
    },
    {
      section: "core",
      title: "Truy vấn bảng tin trong phpMyAdmin",
      image: {
        src: "/image/coding/steps/s10-sql-tab.webp",
        alt: "Tab SQL của nhip chứa truy vấn bảng tin 9 dòng: SELECT p.id, u.username, u.display_name, p.body, p.created_at, COUNT(l.user_id) AS likes FROM posts AS p JOIN users ... LIMIT 20",
        caption: "nhip → SQL. Nút Định dạng tự xuống dòng câu lệnh dài cho dễ đọc.",
      },
      body: `Gõ truy vấn rồi bấm **Thực hiện** (hoặc Ctrl/Cmd + Enter). Ba nút dưới khung soạn:

- **Xóa sạch**: làm trống khung.
- **Định dạng**: căn lề lại câu lệnh.
- **Lấy truy vấn tự-ghi**: khôi phục câu bạn gõ dở.

Ô *Bật kiểm tra khóa ngoại* để mặc định **bật** — tắt nó là cho phép chèn dữ liệu mồ côi.`,
    },
    {
      section: "core",
      title: "Đọc kết quả",
      image: {
        src: "/image/coding/steps/s10-feed-result.webp",
        alt: "Kết quả truy vấn bảng tin: 8 hàng gồm id 11 lan.code Nhịp đã đọc dữ liệu từ MySQL rồi! 2 tim, id 10 an.ui 0 tim, id 7 mai.sec 3 tim, id 5 khoa.data 4 tim, xuống tới id 1",
        caption: "8 bài gốc, mới nhất trước. Bài 4 và 10 không có tim nhưng vẫn hiện với 0 — nhờ LEFT JOIN.",
      },
      body: `Kiểm tra kết quả bằng mắt **trước** khi tin nó:

- 11 bài trong \`posts\` nhưng chỉ 8 dòng → 3 câu trả lời (\`parent_id\` khác NULL) đã bị loại. Đúng.
- Bài 10 có \`likes\` = 0, không bị mất. Đúng.
- Cột \`created_at\` giảm dần. Đúng.

Dòng cảnh báo vàng *"không chứa một cột duy nhất"* chỉ nói phpMyAdmin không cho sửa trực tiếp trên kết quả có \`GROUP BY\` — không phải lỗi.`,
    },
    {
      section: "core",
      title: "HAVING và truy vấn con",
      body: `**HAVING** lọc **sau** khi gom nhóm:

~~~sql
SELECT u.username, COUNT(*) AS post_count
FROM posts AS p JOIN users AS u ON u.id = p.user_id
GROUP BY u.username
HAVING COUNT(*) >= 2;      -- WHERE không làm được: lúc WHERE chạy chưa đếm
~~~

**Truy vấn con** là một \`SELECT\` nằm trong câu lệnh khác:

~~~sql
-- Bài của những người user 1 theo dõi
WHERE p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = 1)

-- Đếm ngay trong SELECT (truy vấn con tương quan)
(SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers
~~~

Truy vấn con tương quan chạy lại cho **mỗi** dòng ngoài — ổn với một trang cá nhân, nhưng đừng dùng cho danh sách hàng nghìn dòng.`,
    },
    {
      section: "core",
      title: "Phân trang",
      visual: "pagination",
      body: `**OFFSET** — dễ viết, hợp với "trang 1, 2, 3":

~~~sql
-- trang n (bắt đầu từ 1), mỗi trang 20 bài
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 20 * (n - 1);
~~~

**Keyset** (con trỏ) — hợp với cuộn vô hạn như mạng xã hội:

~~~sql
WHERE (created_at, id) < ('2026-10-27 04:05:59', 7)
ORDER BY created_at DESC, id DESC
LIMIT 20;
~~~

Luôn thêm \`id\` vào \`ORDER BY\` làm **khoá phụ**: hai bài cùng thời điểm thì thứ tự vẫn cố định, không bài nào bị lặp hay mất khi sang trang.`,
    },
    {
      section: "core",
      title: "INSERT, UPDATE, DELETE an toàn",
      body: `~~~sql
INSERT INTO likes (user_id, post_id) VALUES (2, 4);

UPDATE posts
SET body = 'Nội dung mới', updated_at = NOW()
WHERE id = 3 AND user_id = 1;          -- chỉ sửa khi ĐÚNG chủ bài

DELETE FROM likes WHERE user_id = 2 AND post_id = 4;
~~~

Ba thói quen của người làm thật:

1. Viết \`WHERE\` **trước**, rồi mới viết \`SET\`/\`DELETE\`.
2. Chạy \`SELECT\` với đúng \`WHERE\` đó trước để xem **những dòng nào** sẽ bị ảnh hưởng.
3. Đọc số "*N hàng bị ảnh hưởng*" sau khi chạy. Mong đợi 1 mà ra 0 → điều kiện sai (ví dụ không đúng chủ bài); ra 8 → dừng lại ngay.

\`WHERE id = 3 AND user_id = 1\` là **kiểm quyền sở hữu ngay trong SQL** — kỹ thuật chính của step 13.`,
    },
    {
      section: "core",
      title: "Giao dịch: tất cả hoặc không gì cả",
      body: `Xoá một tài khoản có thể cần nhiều lệnh. Nếu lệnh thứ hai lỗi, dữ liệu kẹt ở trạng thái nửa vời. **Giao dịch** gom chúng lại:

~~~sql
START TRANSACTION;
DELETE FROM likes   WHERE user_id = 5;
DELETE FROM follows WHERE follower_id = 5 OR followee_id = 5;
DELETE FROM users   WHERE id = 5;
COMMIT;        -- ghi tất cả; gặp lỗi thì ROLLBACK để huỷ tất cả
~~~

Bốn tính chất **ACID**: *Atomicity* (trọn vẹn), *Consistency* (nhất quán), *Isolation* (cô lập), *Durability* (bền vững). InnoDB bảo đảm cả bốn. Step 11 gọi giao dịch từ PHP bằng \`beginTransaction()\` / \`commit()\` / \`rollBack()\`.`,
    },
    {
      section: "core",
      title: "Duyệt bảng bằng giao diện",
      image: {
        src: "/image/coding/steps/s10-browse.webp",
        alt: "Tab Duyệt của bảng likes: SELECT * FROM likes, 17 hàng với user_id, post_id, created_at và các nút Sửa, Chép, Xóa bỏ ở mỗi dòng",
        caption: "nhip → likes → Duyệt. Mỗi nút Sửa/Xóa bỏ thật ra cũng sinh một câu UPDATE/DELETE có WHERE.",
      },
      body: `Tab **Duyệt** chạy \`SELECT * FROM bảng\` với phân trang sẵn. Bấm tên cột để sắp xếp, bấm **Sửa** để đổi một ô.

Sau mỗi thao tác bằng giao diện, phpMyAdmin hiện **câu SQL nó vừa chạy** ở khung xanh. Đọc câu đó là cách học SQL rất nhanh: bạn thấy giao diện được dịch thành lệnh như thế nào.`,
    },
    {
      section: "apply",
      title: "database/seed.sql",
      body: "Năm người dùng, mười một bài (có ba câu trả lời), mười bảy lượt tim, mười quan hệ theo dõi. Thời điểm tính lùi từ `NOW()` để lần nào nạp lại bảng tin cũng như vừa có người đăng. Chuỗi `$2y$10$…` là bản băm bcrypt của mật khẩu mẫu — step 12 giải thích.",
      code: { file: "nhip/database/seed.sql", lang: "sql", content: `-- Dữ liệu mẫu cho Nhịp (step 10). Chạy SAU schema.sql, trên cơ sở dữ liệu trống.
-- Mọi tài khoản mẫu có cùng mật khẩu: nhip-demo-2026 (chỉ dùng trên localhost).
USE nhip;

INSERT INTO users (username, display_name, email, password_hash, bio) VALUES
  ('lan.code',   'Lan Nguyễn',  'lan@example.com',  '$2y$12$N5Wu3hqguk6TTH.jPPJivOQRthZmktD.s3.9PaR7vPoAsVb1oWh4G', 'Học Coding để tự làm mạng xã hội của mình.'),
  ('minh.dev',   'Minh Trần',   'minh@example.com', '$2y$12$N5Wu3hqguk6TTH.jPPJivOQRthZmktD.s3.9PaR7vPoAsVb1oWh4G', 'Front-end, thích CSS hơn cà phê.'),
  ('an.ui',      'An Phạm',     'an@example.com',   '$2y$12$N5Wu3hqguk6TTH.jPPJivOQRthZmktD.s3.9PaR7vPoAsVb1oWh4G', 'Thiết kế giao diện, mê màu pastel.'),
  ('khoa.data',  'Khoa Lê',     'khoa@example.com', '$2y$12$N5Wu3hqguk6TTH.jPPJivOQRthZmktD.s3.9PaR7vPoAsVb1oWh4G', 'SQL mỗi ngày.'),
  ('mai.sec',    'Mai Đỗ',      'mai@example.com',  '$2y$12$N5Wu3hqguk6TTH.jPPJivOQRthZmktD.s3.9PaR7vPoAsVb1oWh4G', 'Tìm lỗ hổng trước khi kẻ xấu tìm ra.');

-- Thời điểm tính lùi từ NOW() để bảng tin lúc nào cũng "mới".
INSERT INTO posts (user_id, parent_id, body, created_at) VALUES
  (1, NULL, 'Hôm nay mình bắt đầu học Coding!',                         NOW() - INTERVAL 3 DAY),
  (2, NULL, 'CSS flexbox cứu cả buổi chiều.',                          NOW() - INTERVAL 2 DAY),
  (1, NULL, 'Box model: content, padding, border, margin.',             NOW() - INTERVAL 30 HOUR),
  (3, NULL, 'Màu nhấn chỉ nên có một. Nhiều màu quá là hết nhấn.',     NOW() - INTERVAL 20 HOUR),
  (4, NULL, 'JOIN không đáng sợ: chỉ là ghép hai bảng theo một cột.',   NOW() - INTERVAL 9 HOUR),
  (2, 5,    'Đồng ý! LEFT JOIN mới là thứ hay quên.',                   NOW() - INTERVAL 8 HOUR),
  (5, NULL, 'Nhắc nhẹ: đừng bao giờ nối chuỗi vào câu SQL.',            NOW() - INTERVAL 5 HOUR),
  (1, 7,    'Ghi nhớ! Step 11 sẽ học prepared statement.',              NOW() - INTERVAL 4 HOUR),
  (4, 5,    'Ví dụ: đếm số tim của mỗi bài cần LEFT JOIN + GROUP BY.',  NOW() - INTERVAL 3 HOUR),
  (3, NULL, 'Ai có mẹo chọn font tiếng Việt đẹp không?',                NOW() - INTERVAL 2 HOUR),
  (1, NULL, 'Nhịp đã đọc dữ liệu từ MySQL rồi!',                        NOW() - INTERVAL 25 MINUTE);
-- (likes và follows: xem tệp đầy đủ trong dự án)` },
    },
    {
      section: "apply",
      title: "database/queries.sql",
      body: "Lưu tất cả truy vấn vào một tệp và chạy từng khối. Truy vấn 1, 2, 3 sẽ được đưa nguyên văn vào PHP ở step 11, 14 và 15.",
      code: { file: "nhip/database/queries.sql", lang: "sql", content: `-- 1. Bảng tin: bài gốc mới nhất, kèm tác giả và số tim.
SELECT p.id, u.username, u.display_name, p.body, p.created_at,
       COUNT(l.user_id) AS likes
FROM posts AS p
JOIN users AS u ON u.id = p.user_id
LEFT JOIN likes AS l ON l.post_id = p.id
WHERE p.parent_id IS NULL
GROUP BY p.id, u.username, u.display_name, p.body, p.created_at
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Trang cá nhân: thông tin + số người theo dõi / đang theo dõi.
SELECT u.id, u.username, u.display_name, u.bio,
       (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) AS followers,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following
FROM users AS u
WHERE u.username = 'lan.code';

-- 3. Các câu trả lời của bài 5, cũ nhất trước.
SELECT p.id, u.username, p.body, p.created_at
FROM posts AS p
JOIN users AS u ON u.id = p.user_id
WHERE p.parent_id = 5
ORDER BY p.created_at ASC;

-- 4. Ai đăng nhiều bài gốc nhất (ít nhất 2 bài).
SELECT u.username, COUNT(*) AS post_count
FROM posts AS p
JOIN users AS u ON u.id = p.user_id
WHERE p.parent_id IS NULL
GROUP BY u.username
HAVING COUNT(*) >= 2
ORDER BY post_count DESC;

-- 5. Bảng tin "Đang theo dõi" của lan.code (user 1): bài của người Lan theo dõi.
SELECT p.id, u.username, p.body, p.created_at
FROM posts AS p
JOIN users AS u ON u.id = p.user_id
WHERE p.parent_id IS NULL
  AND p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = 1)
ORDER BY p.created_at DESC;

-- 6. Phân trang: trang 2, mỗi trang 3 bài.` },
    },
    {
      section: "apply",
      title: "Bài tập tự viết",
      body: `Viết thêm vào \`queries.sql\` và tự kiểm bằng dữ liệu mẫu (đáp án ở ngoặc):

1. Năm bài được thả tim nhiều nhất mọi thời đại. (bài 2 và 5 đứng đầu với 4 tim)
2. Những người **chưa** đăng bài gốc nào. Gợi ý: \`LEFT JOIN … WHERE p.id IS NULL\`. (khoa.data và mai.sec đều có bài → kết quả rỗng; thêm một user mới để thử)
3. Những người theo dõi lan.code nhưng lan.code **không** theo dõi lại. (an.ui)
4. Số câu trả lời của mỗi bài gốc, kể cả bài 0 câu trả lời.
5. Sửa bài 3 bằng \`user_id = 2\` (không phải chủ) và đọc số hàng bị ảnh hưởng. (0)`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 10",
      body: `- [ ] Cơ sở dữ liệu có 5 users, 11 posts, 17 likes, 10 follows.
- [ ] Truy vấn bảng tin trả 8 dòng, bài không có tim hiện 0.
- [ ] Bạn giải thích được vì sao \`COUNT(*)\` thay cho \`COUNT(l.user_id)\` cho kết quả sai.
- [ ] Bạn viết được truy vấn "Đang theo dõi" bằng truy vấn con.
- [ ] Mọi \`UPDATE\`/\`DELETE\` của bạn đều có \`WHERE\` theo khoá, và bạn đã đọc số hàng bị ảnh hưởng.
- [ ] Làm xong ít nhất 3/5 bài tập tự viết.`,
    },
  ],
  quiz: [
    { q: "Bài chưa có tim nào. Truy vấn nào vẫn giữ bài đó trong kết quả?", o: ["posts JOIN likes", "posts LEFT JOIN likes", "posts RIGHT JOIN users", "posts CROSS JOIN likes"], a: 1, why: "LEFT JOIN giữ mọi dòng bên trái, điền NULL bên phải." },
    { kind: "output", q: "Bài 4 không có lượt tim nào. Giá trị likes của bài 4 là gì?", code: "SELECT p.id, COUNT(*) AS likes\nFROM posts p LEFT JOIN likes l ON l.post_id = p.id\nGROUP BY p.id;", o: ["0", "1", "NULL", "Lỗi"], a: 1, why: "COUNT(*) đếm cả dòng NULL do LEFT JOIN tạo ra; dùng COUNT(l.user_id)." },
    { kind: "truefalse", q: "WHERE parent_id = NULL trả về các bài gốc.", a: false, why: "So sánh với NULL luôn là không xác định; phải viết IS NULL." },
    { kind: "order", q: "Sắp xếp theo thứ tự logic mà cơ sở dữ liệu xử lý.", items: ["FROM / JOIN", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"], a: [0, 1, 2, 3, 4, 5], why: "Vì vậy WHERE không dùng được bí danh của SELECT, còn ORDER BY thì được." },
    { q: "Muốn lọc \"người có ít nhất 2 bài\" sau khi đếm, dùng mệnh đề nào?", o: ["WHERE COUNT(*) >= 2", "HAVING COUNT(*) >= 2", "LIMIT 2", "ORDER BY 2"], a: 1, why: "WHERE chạy trước khi gom nhóm; HAVING lọc nhóm." },
    { kind: "multi", q: "Những lệnh nào nguy hiểm nếu chạy trên dữ liệu thật?", o: ["DELETE FROM likes;", "UPDATE posts SET body = '';", "SELECT * FROM posts;", "DELETE FROM likes WHERE user_id = 2 AND post_id = 4;"], a: [0, 1], why: "Thiếu WHERE là ảnh hưởng mọi dòng của bảng." },
    { kind: "blank", q: "Điền mệnh đề để lấy trang 3, mỗi trang 10 bài.", code: "ORDER BY created_at DESC, id DESC\nLIMIT 10 ______ 20;", a: "OFFSET", why: "Trang n bỏ qua 10 × (n − 1) dòng." },
    { q: "Vì sao luôn thêm id vào ORDER BY khi phân trang?", o: ["Cho đẹp", "Hai dòng cùng created_at thì thứ tự vẫn cố định, không lặp/mất dòng giữa các trang", "Bắt buộc theo SQL", "Để dùng chỉ mục chính"], a: 1, why: "Thứ tự không xác định giữa các dòng bằng nhau có thể đổi giữa hai lần truy vấn." },
    { kind: "bug", q: "Câu nào gây lỗi #1052 'Column id is ambiguous'?", lines: ["SELECT id, u.username", "FROM posts AS p", "JOIN users AS u ON u.id = p.user_id", "ORDER BY p.created_at DESC;"], a: 0, why: "Cả posts và users đều có cột id; phải ghi p.id." },
    { q: "UPDATE posts SET body = 'x' WHERE id = 3 AND user_id = 2 báo 0 hàng bị ảnh hưởng. Nghĩa là gì?", o: ["Lỗi cú pháp", "Bài 3 không thuộc user 2 nên không dòng nào khớp", "Cơ sở dữ liệu đầy", "Phải COMMIT"], a: 1, why: "Điều kiện sở hữu trong WHERE đã chặn việc sửa bài của người khác." },
  ],
};
