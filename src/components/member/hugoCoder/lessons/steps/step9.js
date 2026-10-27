export default {
  id: "step9",
  lang: "sql",
  file: "nhip/database/schema.sql",
  duration: "150 phút",
  summary: "Mô hình quan hệ, khoá chính, khoá ngoại, quan hệ 1–nhiều và nhiều–nhiều, chuẩn hoá 1NF–3NF, kiểu dữ liệu và utf8mb4 — rồi tạo cơ sở dữ liệu nhip bằng phpMyAdmin.",
  slides: [
    {
      section: "intro",
      title: "Dữ liệu cần một hình dạng",
      body: `Tệp JSON ở step 8 giữ mỗi bài như một khối rời: tên tác giả lặp lại ở mọi bài, số tim chỉ là một con số (không biết **ai** đã thả), không có chỗ nào cho "ai theo dõi ai".

Một mạng xã hội thực chất là **các thực thể và quan hệ giữa chúng**: người dùng viết bài, người dùng thả tim bài, người dùng theo dõi người dùng. Cơ sở dữ liệu quan hệ được sinh ra đúng cho việc mô tả và truy vấn những quan hệ như vậy.

Step này **chưa viết dòng PHP nào**. Thiết kế đúng lược đồ là quyết định khó sửa nhất của cả dự án — nên làm kỹ trước.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Đọc và vẽ được sơ đồ thực thể–quan hệ (ER) cho Nhịp.
2. Phân biệt **khoá chính, khoá duy nhất, khoá ngoại** và biết mỗi loại chặn được lỗi gì.
3. Biểu diễn quan hệ **1–nhiều**, **nhiều–nhiều** và **tự tham chiếu**.
4. Áp dụng ba dạng chuẩn **1NF, 2NF, 3NF** để loại dữ liệu lặp.
5. Chọn kiểu dữ liệu đúng và hiểu vì sao phải là **utf8mb4**.
6. Tạo cơ sở dữ liệu và bảng trong phpMyAdmin bằng cả giao diện lẫn tệp \`schema.sql\`.`,
    },
    {
      section: "visual",
      title: "Sơ đồ quan hệ của Nhịp",
      visual: "erd-nhip",
      body: `Bốn bảng đủ cho cả chặng 3:

- **users** — mỗi người một dòng.
- **posts** — mỗi bài một dòng, trỏ về tác giả qua \`user_id\`. Bài trả lời cũng là một bài, trỏ về bài gốc qua \`parent_id\`.
- **likes** — mỗi lượt thả tim một dòng: *ai* thả tim *bài nào*.
- **follows** — mỗi quan hệ theo dõi một dòng: *ai* theo dõi *ai*.

Ký hiệu chân chim (crow's foot): một đầu gạch là "một", đầu chạc ba là "nhiều".`,
    },
    {
      section: "visual",
      title: "Bảng, dòng, cột",
      visual: "table-anatomy",
      body: `Một **bảng** (quan hệ) là tập các **dòng** (bộ, bản ghi) có cùng các **cột** (thuộc tính). Mỗi cột có một **kiểu** và các **ràng buộc**.

Hai quy tắc nền tảng của mô hình quan hệ:

1. Mỗi ô chỉ chứa **một giá trị** (không nhét danh sách vào một ô).
2. Mỗi dòng phải **phân biệt được** với mọi dòng khác — nhờ khoá chính.`,
    },
    {
      section: "research",
      title: "Mô hình quan hệ của Codd",
      body: `Năm 1970, Edgar F. Codd (IBM) đề xuất lưu dữ liệu thành các **quan hệ** — bảng toán học — và truy vấn bằng đại số quan hệ, thay vì để chương trình tự lần theo con trỏ trong tệp. Ý tưởng đó trở thành SQL và mọi hệ quản trị quan hệ ngày nay: MySQL, MariaDB, PostgreSQL, SQL Server, Oracle.

Chen (1976) bổ sung **mô hình thực thể–quan hệ** để thiết kế trên giấy trước khi tạo bảng — chính là sơ đồ bạn vừa xem.

> Codd, E.F. (1970) 'A relational model of data for large shared data banks', *Communications of the ACM*, 13(6), pp. 377–387. doi:10.1145/362384.362685
>
> Chen, P.P. (1976) 'The entity-relationship model — toward a unified view of data', *ACM Transactions on Database Systems*, 1(1), pp. 9–36. doi:10.1145/320434.320440`,
    },
    {
      section: "research",
      title: "Chuẩn hoá và tài liệu MySQL",
      body: `Codd (1971) định nghĩa các **dạng chuẩn** để tránh *dị thường cập nhật*: sửa một sự thật ở chỗ này nhưng quên chỗ khác, khiến dữ liệu tự mâu thuẫn. Giáo trình cơ sở dữ liệu kinh điển của Silberschatz và cộng sự vẫn dạy đúng trình tự 1NF → 2NF → 3NF.

Chi tiết về kiểu dữ liệu, bộ ký tự và khoá ngoại tra ở tài liệu chính thức của MySQL; MariaDB tương thích ở mọi phần dùng trong khoá này.

> Silberschatz, A., Korth, H.F. and Sudarshan, S. (2019) *Database System Concepts*. 7th edn. New York: McGraw-Hill.
>
> Oracle (2025) *MySQL 8.4 Reference Manual: Data Types; Character Sets; FOREIGN KEY Constraints*. Available at: https://dev.mysql.com/doc/refman/8.4/en/`,
    },
    {
      section: "ideate",
      title: "Tìm thực thể từ câu chuyện người dùng",
      body: `Viết ra những gì người dùng làm được, gạch chân **danh từ** (thực thể) và **động từ** (quan hệ):

- Một **người dùng** *đăng ký* bằng email và tên người dùng.
- Người dùng *viết* nhiều **bài đăng**, mỗi bài tối đa 500 ký tự.
- Người dùng *trả lời* một bài bằng một bài khác.
- Người dùng *thả tim* bài của bất kỳ ai, mỗi bài tối đa một lần.
- Người dùng *theo dõi* người dùng khác, nhưng không tự theo dõi mình.

Mỗi câu kéo theo một ràng buộc: "mỗi bài tối đa một lần" → khoá chính kép của \`likes\`; "không tự theo dõi" → ràng buộc \`CHECK\`. Ràng buộc nằm **trong cơ sở dữ liệu** thì không đoạn mã nào lách được.`,
    },
    {
      section: "ideate",
      title: "Một bản thiết kế sai để tránh",
      body: `Cách "nhanh" mà người mới hay làm:

| id | author | author_email | body | liked_by |
|---|---|---|---|---|
| 1 | lan.code | lan@vd.vn | Chào Nhịp | minh.dev,an.ui |
| 2 | lan.code | lan@vd.vn | Học SQL | minh.dev |

Ba vấn đề:

1. \`liked_by\` chứa **danh sách** trong một ô → vi phạm 1NF, không đếm/tìm được bằng SQL.
2. Email của Lan lặp ở mọi bài → đổi email phải sửa hàng trăm dòng, sót một dòng là dữ liệu mâu thuẫn.
3. Người dùng chưa đăng bài nào thì **không có chỗ nào** để lưu.

Chuẩn hoá chính là cách sửa có hệ thống ba lỗi này.`,
    },
    {
      section: "core",
      title: "Khoá chính và AUTO_INCREMENT",
      body: `**Khoá chính** (PRIMARY KEY) xác định duy nhất một dòng: không trùng, không NULL, mỗi bảng đúng một khoá chính.

~~~sql
id INT UNSIGNED NOT NULL AUTO_INCREMENT,
PRIMARY KEY (id)
~~~

- \`AUTO_INCREMENT\`: cơ sở dữ liệu tự cấp số 1, 2, 3… — không bao giờ tự tính \`max(id) + 1\` trong PHP như step 8 (hai người đăng cùng lúc sẽ ra cùng một số).
- \`UNSIGNED\`: không âm, dải 0 → 4.294.967.295.
- Khoá chính nên là **khoá thay thế** (số vô nghĩa), không dùng email hay tên người dùng: những thứ đó người dùng có thể đổi.`,
    },
    {
      section: "core",
      title: "Khoá duy nhất và khoá ngoại",
      body: `~~~sql
UNIQUE KEY uq_users_username (username),
CONSTRAINT fk_posts_user FOREIGN KEY (user_id)
  REFERENCES users (id) ON DELETE CASCADE
~~~

- **UNIQUE**: không hai người dùng nào trùng \`username\` hay \`email\`. Kiểm tra trong PHP thôi là chưa đủ — hai yêu cầu đăng ký cùng lúc vẫn lọt; ràng buộc trong cơ sở dữ liệu thì không.
- **FOREIGN KEY**: \`posts.user_id\` chỉ được chứa id **đang có** trong \`users\`. Chèn bài cho người dùng 999 không tồn tại → lỗi 1452.
- \`ON DELETE CASCADE\`: xoá người dùng thì bài, tim, quan hệ theo dõi của họ tự xoá theo. Lựa chọn khác: \`RESTRICT\` (cấm xoá khi còn bài) hoặc \`SET NULL\`.

Khoá ngoại chỉ hoạt động với bộ máy lưu trữ **InnoDB** — mặc định từ MySQL 5.5, và là lý do mọi bảng ghi rõ \`ENGINE=InnoDB\`.`,
    },
    {
      section: "core",
      title: "1–nhiều, nhiều–nhiều, tự tham chiếu",
      body: `| Quan hệ | Ví dụ | Cách lưu |
|---|---|---|
| 1–nhiều | Một người viết nhiều bài | Cột khoá ngoại ở phía **nhiều**: \`posts.user_id\` |
| Nhiều–nhiều | Nhiều người thả tim nhiều bài | **Bảng nối** \`likes(user_id, post_id)\` |
| Tự tham chiếu 1–nhiều | Bài trả lời bài | \`posts.parent_id → posts.id\` |
| Tự tham chiếu nhiều–nhiều | Người theo dõi người | Bảng nối \`follows(follower_id, followee_id)\` |

Bảng nối dùng **khoá chính kép** \`PRIMARY KEY (user_id, post_id)\`: cặp (người, bài) không thể xuất hiện hai lần → mỗi người thả tim một bài tối đa một lần, do chính cơ sở dữ liệu bảo đảm.`,
    },
    {
      section: "core",
      title: "Ba dạng chuẩn",
      body: `- **1NF** — mỗi ô một giá trị nguyên tử, không nhóm lặp. Sửa \`liked_by\` bằng bảng \`likes\`.
- **2NF** — đạt 1NF và mọi cột không khoá phụ thuộc vào **toàn bộ** khoá chính. Nếu \`likes\` có thêm \`post_body\`, cột này chỉ phụ thuộc \`post_id\` (một nửa khoá) → sai, phải nằm ở \`posts\`.
- **3NF** — đạt 2NF và không cột không khoá nào phụ thuộc vào một cột không khoá khác. \`posts.author_email\` phụ thuộc \`user_id\` chứ không phụ thuộc bài → chuyển về \`users\`.

Câu ghi nhớ kinh điển: mỗi cột phải phụ thuộc vào *"the key, the whole key, and nothing but the key"*.

Khi nào **cố ý** phá chuẩn? Khi đo thấy chậm thật — ví dụ lưu sẵn số tim trong \`posts\` để khỏi đếm. Step 21 bàn đến; bây giờ giữ chuẩn.`,
    },
    {
      section: "core",
      title: "Chọn kiểu dữ liệu",
      body: `| Dữ liệu | Kiểu | Lý do |
|---|---|---|
| id | \`INT UNSIGNED\` | Đủ 4 tỷ dòng, 4 byte |
| Tên người dùng | \`VARCHAR(30)\` | Ngắn, có giới hạn rõ |
| Nội dung bài | \`VARCHAR(500)\` | Giới hạn 500 **ký tự** trùng luật của Nhịp |
| Email | \`VARCHAR(255)\` | Đủ cho mọi email hợp lệ thực tế |
| Băm mật khẩu | \`VARCHAR(255)\` | PHP khuyên chừa 255 cho các thuật toán băm sau này |
| Thời điểm | \`DATETIME\` | Không bị giới hạn năm 2038 như \`TIMESTAMP\` |
| Không bắt buộc | \`NULL\` | \`avatar\`, \`parent_id\`, \`updated_at\` |

\`VARCHAR(n)\` trong MySQL đếm **ký tự**, không đếm byte — khớp với \`mb_strlen\` ở step 8. Văn bản dài không giới hạn (bài báo) mới cần \`TEXT\`.`,
    },
    {
      section: "core",
      title: "utf8mb4 và bảng mã đối chiếu",
      body: `Trong MySQL, \`utf8\` cũ (\`utf8mb3\`) chỉ lưu ký tự tối đa **3 byte** → emoji 4 byte bị cắt hoặc báo lỗi. Luôn dùng **\`utf8mb4\`** — UTF-8 đầy đủ.

**Bảng mã đối chiếu** (collation) quyết định so sánh và sắp xếp chữ:

- \`utf8mb4_unicode_ci\`: theo chuẩn Unicode; \`ci\` = *case-insensitive*, nên \`Lan\` và \`lan\` bị coi là **trùng** khi kiểm UNIQUE — đúng điều ta muốn với tên người dùng.
- MySQL 8 còn có \`utf8mb4_0900_ai_ci\` (chuẩn Unicode 9.0); MariaDB 10.4 của XAMPP chưa có, nên khoá này dùng \`utf8mb4_unicode_ci\` để chạy được ở cả hai.

Đặt bộ ký tự ngay ở **cơ sở dữ liệu**, mọi bảng sẽ kế thừa.`,
    },
    {
      section: "core",
      title: "Quy ước đặt tên",
      body: `- Tên bảng **số nhiều, chữ thường, gạch dưới**: \`users\`, \`posts\`, \`likes\`.
- Khoá ngoại: \`<bảng số ít>_id\` → \`user_id\`, \`post_id\`.
- Thời điểm: hậu tố \`_at\` → \`created_at\`, \`updated_at\`.
- Tên ràng buộc có tiền tố: \`uq_\` (unique), \`idx_\` (chỉ mục), \`fk_\` (khoá ngoại), \`chk_\` (check). Khi lỗi xảy ra, thông báo chứa đúng tên này — bạn biết ngay ràng buộc nào bị vi phạm.
- **Không** dùng từ khoá SQL làm tên cột (\`order\`, \`group\`, \`user\`).

Mật khẩu **không bao giờ** có cột \`password\`: chỉ có \`password_hash\` (step 12).`,
    },
    {
      section: "core",
      title: "Thao tác 1 · Tạo cơ sở dữ liệu",
      image: {
        src: "/image/coding/steps/s09-create-db.webp",
        alt: "phpMyAdmin tab Cơ sở dữ liệu, ô Tạo cơ sở dữ liệu điền nhip, bảng mã chọn utf8mb4_unicode_ci, nút Tạo",
        caption: "phpMyAdmin → tab Cơ sở dữ liệu. Nhớ đổi bảng mã trước khi bấm Tạo.",
      },
      body: `1. Mở \`http://localhost/phpmyadmin\` → tab **Cơ sở dữ liệu**.
2. Ô tên: \`nhip\` (chữ thường, không dấu).
3. Hộp bảng mã: chọn **utf8mb4_unicode_ci**.
4. Bấm **Tạo**. Cột trái hiện \`nhip\` với dòng *Mới* bên dưới.

Lỡ tạo sai bảng mã: chọn \`nhip\` → tab **Thao tác** → mục *Bảng mã đối chiếu* → đổi và tick *Thay đổi tất cả bảng*.`,
    },
    {
      section: "core",
      title: "Thao tác 2 · Tạo bảng bằng giao diện",
      image: {
        src: "/image/coding/steps/s09-create-table.webp",
        alt: "Form tạo bảng users trong phpMyAdmin với 8 cột: id INT UNSIGNED chỉ mục PRIMARY tick A_I, username VARCHAR 30, display_name VARCHAR 60, email, password_hash VARCHAR 255, bio VARCHAR 160, avatar VARCHAR 255 tick Null, created_at DATETIME mặc định CURRENT_TIMESTAMP",
        caption: "Chọn nhip → Tên bảng: users, Số cột: 8 → Thực hiện. Mỗi dòng của form là một cột của bảng.",
      },
      body: `Điền từng dòng: **Tên**, **Kiểu**, **Dài/Giá trị** (30, 60, 255…), **Mặc định**, **Thuộc tính** (UNSIGNED cho id), ô **Null** (chỉ tick ở \`avatar\`), **Chỉ mục**, ô **A_I** (AUTO_INCREMENT, chỉ ở id).

Chọn *PRIMARY* ở cột Chỉ mục của \`id\` sẽ bật hộp thoại *Thêm chỉ mục* — bấm **Thực hiện** để xác nhận. Kéo xuống cuối, kiểm *Bộ máy lưu trữ* là **InnoDB** rồi bấm **Lưu**.

Giao diện tiện để học, nhưng không ghi lại được. Bạn sẽ dùng cách thứ hai: tệp SQL.`,
    },
    {
      section: "core",
      title: "Thao tác 3 · Chạy schema.sql",
      image: {
        src: "/image/coding/steps/s09-sql-ok.webp",
        alt: "phpMyAdmin sau khi chạy lệnh: các khung xanh MySQL trả về kết quả là trống rỗng cho từng lệnh CREATE TABLE users, posts, likes; cột trái hiện nhip với follows, likes, posts, users",
        caption: "Mỗi lệnh CREATE TABLE thành công là một khung xanh. Cột trái hiện đủ bốn bảng.",
      },
      body: `1. Chọn \`nhip\` ở cột trái → tab **SQL**.
2. Dán phần \`CREATE TABLE\` của \`schema.sql\` (slide áp dụng bên dưới) → **Thực hiện**.
3. Khung **đỏ** nghĩa là lỗi: đọc mã lỗi (\`#1005\` thường do khoá ngoại sai kiểu — \`user_id\` phải **cùng** \`INT UNSIGNED\` với \`users.id\`).

"Trả về kết quả là trống rỗng" là bình thường: lệnh tạo bảng không trả dòng dữ liệu nào.

Muốn làm lại từ đầu: tab **Thao tác** của \`nhip\` → *Xóa cơ sở dữ liệu (DROP)*, rồi chạy lại cả tệp.`,
    },
    {
      section: "core",
      title: "Thao tác 4 · Kiểm tra cấu trúc",
      image: {
        src: "/image/coding/steps/s09-structure.webp",
        alt: "Tab Cấu trúc của bảng posts: 6 cột id, user_id, parent_id, body varchar(500), created_at, updated_at và bảng Chỉ mục gồm PRIMARY, idx_posts_user, idx_posts_parent",
        caption: "nhip → posts → Cấu trúc. Nửa dưới là các chỉ mục; Hiển thị quan hệ cho xem khoá ngoại.",
      },
      body: `Đối chiếu với thiết kế:

- \`parent_id\`, \`updated_at\`: Null = **Có**; mọi cột còn lại: **Không**.
- \`body\` mang bảng mã \`utf8mb4_unicode_ci\` kế thừa từ cơ sở dữ liệu.
- Mục **Chỉ mục** có \`PRIMARY\` và hai \`idx_\`. MySQL bắt buộc mỗi khoá ngoại có chỉ mục; ta đặt tên rõ ràng thay vì để nó tự sinh.
- Nút **Hiển thị quan hệ** liệt kê \`fk_posts_user\`, \`fk_posts_parent\` với \`ON DELETE CASCADE\`.`,
    },
    {
      section: "core",
      title: "Thao tác 5 · Bộ thiết kế",
      image: {
        src: "/image/coding/steps/s09-designer.webp",
        alt: "Bộ thiết kế của phpMyAdmin vẽ bốn bảng users, posts, follows, likes với các đường nối khoá ngoại từ users.id tới posts.user_id, likes.user_id, follows.follower_id và follows.followee_id, và từ posts.id tới likes.post_id, posts.parent_id",
        caption: "nhip → Thêm → Bộ thiết kế. Đây là sơ đồ ER do phpMyAdmin tự vẽ từ khoá ngoại thật.",
      },
      body: `Kéo các bảng cho gọn rồi so với sơ đồ bạn vẽ trên giấy. Mỗi đường nối là **một khoá ngoại**: thiếu đường nào là thiếu ràng buộc đó.

Hai đường từ \`users.id\` cùng tới \`follows\` cho thấy quan hệ tự tham chiếu nhiều–nhiều; đường từ \`posts.id\` vòng về chính \`posts.parent_id\` là quan hệ trả lời.`,
    },
    {
      section: "apply",
      title: "database/schema.sql",
      body: "Lưu toàn bộ lược đồ thành tệp trong dự án. Tệp này là **nguồn sự thật** của cấu trúc dữ liệu: ai clone dự án chỉ cần chạy nó là có cơ sở dữ liệu giống hệt bạn (step 25 sẽ ghi vào README).",
      code: { file: "nhip/database/schema.sql", lang: "sql", content: `-- Lược đồ cơ sở dữ liệu Nhịp (step 9).
-- Chạy trong phpMyAdmin → tab SQL, hoặc: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS nhip
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nhip;

-- Người dùng: mỗi người một dòng.
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(30)  NOT NULL,
  display_name  VARCHAR(60)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio           VARCHAR(160) NOT NULL DEFAULT '',
  avatar        VARCHAR(255) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Bài đăng. parent_id khác NULL nghĩa là bài này là một câu trả lời.
CREATE TABLE posts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  parent_id  INT UNSIGNED NULL,
  body       VARCHAR(500) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_posts_user (user_id),
  KEY idx_posts_parent (parent_id),
  CONSTRAINT fk_posts_user   FOREIGN KEY (user_id)   REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_parent FOREIGN KEY (parent_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Thả tim: quan hệ nhiều–nhiều giữa users và posts.
CREATE TABLE likes (
  user_id    INT UNSIGNED NOT NULL,
  post_id    INT UNSIGNED NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  KEY idx_likes_post (post_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Theo dõi: users tự nối với chính nó (người theo dõi → người được theo dõi).
CREATE TABLE follows (
  follower_id INT UNSIGNED NOT NULL,
  followee_id INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id),
  KEY idx_follows_followee (followee_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followee FOREIGN KEY (followee_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_follows_self CHECK (follower_id <> followee_id)
) ENGINE=InnoDB;` },
    },
    {
      section: "apply",
      title: "Thử phá ràng buộc",
      body: `Chạy từng lệnh trong tab SQL của \`nhip\` và đọc thông báo lỗi — mỗi lỗi chứng minh một ràng buộc đang làm việc:

~~~sql
-- 1. Khoá ngoại: không có user 999
INSERT INTO posts (user_id, body) VALUES (999, 'Ma');
-- #1452 Cannot add or update a child row: ... fk_posts_user

-- 2. Thiếu cột NOT NULL
INSERT INTO users (username) VALUES ('lan.code');
-- #1364 Field 'display_name' doesn't have a default value

-- 3. CHECK: tự theo dõi mình (cần có user id 1 — làm sau step 10)
INSERT INTO follows VALUES (1, 1, NOW());
-- #4025 CONSTRAINT chk_follows_self failed (MySQL 8 báo mã 3819)
~~~`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 9",
      body: `- [ ] Cơ sở dữ liệu \`nhip\` dùng \`utf8mb4_unicode_ci\`.
- [ ] Có đủ 4 bảng, đều InnoDB; Bộ thiết kế vẽ đủ 6 đường khoá ngoại.
- [ ] \`database/schema.sql\` nằm trong dự án và chạy lại được từ đầu trên cơ sở dữ liệu trống.
- [ ] Bạn đã gây được lỗi 1452 và giải thích được vì sao.
- [ ] Bạn giải thích được vì sao \`likes\` không có cột \`id\` riêng.

Step 10: đổ dữ liệu mẫu và viết các truy vấn SQL cho bảng tin.`,
    },
  ],
  quiz: [
    { q: "Quan hệ \"nhiều người thả tim nhiều bài\" được lưu bằng cách nào?", o: ["Cột liked_by trong posts", "Bảng nối likes(user_id, post_id)", "Cột post_id trong users", "Một tệp JSON"], a: 1, why: "Nhiều–nhiều luôn cần bảng nối chứa hai khoá ngoại." },
    { q: "Khoá chính PRIMARY KEY (user_id, post_id) của likes bảo đảm điều gì?", o: ["Thả tim nhanh hơn", "Mỗi người thả tim một bài tối đa một lần", "Xoá bài thì xoá tim", "Tim luôn có thời điểm"], a: 1, why: "Cặp giá trị của khoá chính không được trùng." },
    { kind: "truefalse", q: "Cột utf8 (utf8mb3) của MySQL lưu được mọi emoji.", a: false, why: "utf8mb3 chỉ tới 3 byte/ký tự; emoji cần 4 byte → dùng utf8mb4." },
    { q: "Lưu author_email trong bảng posts vi phạm dạng chuẩn nào?", o: ["1NF", "3NF — email phụ thuộc vào user_id chứ không vào bài", "Không vi phạm gì", "BCNF chỉ khi có trigger"], a: 1, why: "Phụ thuộc bắc cầu qua cột không khoá vi phạm 3NF." },
    { kind: "multi", q: "Những cột nào nên cho phép NULL?", o: ["posts.parent_id", "users.avatar", "posts.body", "posts.updated_at"], a: [0, 1, 3], why: "Bài không phải trả lời, chưa có ảnh, chưa sửa lần nào; nội dung bài thì bắt buộc." },
    { kind: "output", q: "users đang có id 1 và 2. Lệnh sau trả gì?", code: "INSERT INTO posts (user_id, body)\nVALUES (7, 'Xin chào');", o: ["Thêm thành công", "Lỗi 1452 vi phạm khoá ngoại", "Tự tạo user 7", "Lỗi cú pháp"], a: 1, why: "fk_posts_user chỉ cho phép user_id đang có trong users." },
    { q: "Vì sao không dùng email làm khoá chính của users?", o: ["Email quá ngắn", "Email có thể đổi; khoá chính nên là số ổn định, vô nghĩa", "MySQL cấm VARCHAR làm khoá", "Email không duy nhất"], a: 1, why: "Đổi khoá chính kéo theo sửa mọi khoá ngoại trỏ tới nó." },
    { kind: "blank", q: "Điền mệnh đề để xoá người dùng thì bài của họ tự xoá theo.", code: "FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE ______", a: "CASCADE", why: "RESTRICT sẽ cấm xoá; SET NULL để bài mồ côi." },
    { q: "Khoá ngoại chỉ có hiệu lực với bộ máy lưu trữ nào?", o: ["MyISAM", "InnoDB", "MEMORY", "CSV"], a: 1, why: "InnoDB hỗ trợ khoá ngoại và giao dịch; là mặc định từ MySQL 5.5." },
    { kind: "bug", q: "Lệnh tạo bảng báo lỗi #1005 khi thêm khoá ngoại. Dòng nào sai?", lines: ["CREATE TABLE likes (", "  user_id INT NOT NULL,", "  post_id INT UNSIGNED NOT NULL,", "  FOREIGN KEY (user_id) REFERENCES users (id)", ") ENGINE=InnoDB;"], a: 1, why: "users.id là INT UNSIGNED; cột khoá ngoại phải cùng kiểu và cùng dấu." },
  ],
};
