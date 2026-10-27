export default {
  id: "step23",
  lang: "php",
  file: "nhip/src/stats.php",
  duration: "150 phút",
  summary: "Phân tích sản phẩm bằng SQL: định nghĩa chỉ số (chỉ số phù phiếm vs chỉ số hành động), viết truy vấn thống kê (theo ngày, top, tỷ lệ tương tác, tín hiệu an ninh), và dựng trang /stats có phân quyền với biểu đồ CSS thuần — tôn trọng CSP.",
  slides: [
    {
      section: "intro",
      title: "Dữ liệu kể câu chuyện gì?",
      body: `Nhịp đã chạy và đẹp. Nhưng làm sao biết nó **có đang tốt lên** không? Người dùng có quay lại? Chủ đề nào được quan tâm? Có ai đang dò mật khẩu?

Mọi câu hỏi đó đã có câu trả lời **nằm sẵn trong cơ sở dữ liệu** — chỉ cần biết hỏi. Step này biến dữ liệu thô thành **chỉ số** và **biểu đồ** giúp ra quyết định: nên làm gì tiếp, sửa gì, cảnh giác gì.

Đây là chặng cuối — "đưa sản phẩm ra đời". Phân tích là kỹ năng phân biệt người "viết xong app" với người "vận hành được sản phẩm".`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Phân biệt **chỉ số phù phiếm** (vanity) và **chỉ số hành động** (actionable).
2. Viết truy vấn thống kê: tổng quan, theo ngày, top N, tỷ lệ tương tác.
3. Điền **đủ ngày** kể cả ngày không có dữ liệu (0) để biểu đồ không "nhảy cóc".
4. Rút **tín hiệu an ninh** từ nhật ký (\`activity_log\`).
5. Dựng trang \`/stats\` **có phân quyền** (chỉ chủ sản phẩm xem).
6. Vẽ biểu đồ cột bằng **CSS thuần** — không thư viện, và **tôn trọng CSP** (không \`style=""\` nội tuyến).`,
    },
    {
      section: "visual",
      title: "Chỉ số phù phiếm vs chỉ số hành động",
      visual: "metrics-types",
      body: `- **Chỉ số phù phiếm**: con số nghe sướng tai nhưng không giúp quyết định. "Tổng số bài từ trước tới nay" chỉ tăng, không bao giờ nói bạn đang làm tốt hay tệ.
- **Chỉ số hành động**: thay đổi theo việc bạn làm và **gợi ý hành động**. "Bài mới **mỗi ngày**" giảm ba ngày liền → có vấn đề, cần tìm hiểu.

Mẹo phân biệt: hỏi *"nếu số này đổi, tôi sẽ làm gì khác đi?"*. Không trả lời được → phù phiếm.

Nhịp theo dõi: bài/ngày, người đăng bài/ngày (DAU), tỷ lệ tương tác (tim/bài), top người đăng, và đăng nhập sai/ngày (an ninh).`,
    },
    {
      section: "visual",
      title: "Từ dữ liệu thô tới quyết định",
      visual: "analytics-pipeline",
      body: `Chuỗi phân tích:

1. **Sự kiện** đã được ghi khi xảy ra: bài (\`posts.created_at\`), tim (\`likes\`), đăng nhập sai (\`activity_log\`).
2. **Truy vấn** gom chúng thành chỉ số: \`GROUP BY DATE(...)\`, \`COUNT\`, \`AVG\`.
3. **Trình bày** thành bảng/biểu đồ dễ đọc.
4. **Quyết định**: thấy gì bất thường thì hành động.

Điều quan trọng đã làm từ trước: **ghi lại thời điểm** (\`created_at\`) cho mọi thứ. Không có dấu thời gian thì không phân tích theo thời gian được — đó là lý do mọi bảng của Nhịp đều có \`created_at\`.`,
    },
    {
      section: "research",
      title: "Chỉ số hành động",
      body: `Khái niệm *actionable metrics vs vanity metrics* được Eric Ries phổ biến trong *The Lean Startup*: chỉ số tốt phải **actionable** (gợi hành động rõ), **accessible** (dễ hiểu), và **auditable** (kiểm chứng được từ dữ liệu gốc). "Tổng lượt xem" là ví dụ kinh điển của chỉ số phù phiếm.

Về đo mức gắn kết, khung **AARRR** (Acquisition, Activation, Retention, Referral, Revenue) của McClure là cách phổ biến để chọn chỉ số theo từng giai đoạn vòng đời người dùng. Với một dự án học tập như Nhịp, ta tập trung vào **Activation** (người dùng đăng bài đầu tiên) và **Retention** (quay lại đăng tiếp).

> Ries, E. (2011) *The Lean Startup*. New York: Crown Business.
>
> McClure, D. (2007) *Startup Metrics for Pirates (AARRR)*. Available at: https://500hats.typepad.com/`,
    },
    {
      section: "research",
      title: "Gom nhóm theo thời gian trong SQL",
      body: `Tài liệu MySQL mô tả các hàm ngày \`DATE()\`, \`DATE_FORMAT()\` để cắt dấu thời gian thành đơn vị gom nhóm (ngày, tuần, tháng), và \`GROUP BY\` để tính tổng theo nhóm. Một lưu ý: **múi giờ** — \`DATE(created_at)\` cắt theo giờ máy chủ; sản phẩm phục vụ nhiều múi giờ phải quyết định cắt theo giờ nào.

Về bảo mật dữ liệu phân tích: trang thống kê để lộ thông tin tổng hợp cũng là một dạng **A01 Broken Access Control** nếu không giới hạn người xem — vì vậy \`/stats\` phải kiểm quyền như mọi trang nhạy cảm.

> Oracle (2025) *MySQL 8.4 Reference Manual: Date and Time Functions; GROUP BY Modifiers*. Available at: https://dev.mysql.com/doc/refman/8.4/en/
>
> OWASP Foundation (2025) *Authorization Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html`,
    },
    {
      section: "ideate",
      title: "Chọn chỉ số cho Nhịp",
      body: `| Chỉ số | Truy vấn | Vì sao |
|---|---|---|
| Bài mới / ngày | \`GROUP BY DATE(created_at)\` | Hoạt động có tăng không? |
| Người đăng bài / ngày | \`COUNT(DISTINCT user_id)\` | Bao nhiêu người thực sự dùng? |
| Tim trung bình / bài | \`likes / posts\` | Nội dung có được hưởng ứng? |
| Top người đăng | \`GROUP BY user ORDER BY count\` | Ai là người dùng nòng cốt? |
| Đăng nhập sai / ngày | \`activity_log WHERE login_failed\` | Có ai đang tấn công? |

Lưu truy vấn vào \`database/analytics.sql\` để chạy tay trong phpMyAdmin, và đóng gói vài chỉ số chính vào trang \`/stats\`.`,
    },
    {
      section: "core",
      title: "Truy vấn tổng quan",
      body: `Nhiều truy vấn con trong một \`SELECT\` cho một hàng tổng quan:

~~~sql
SELECT
  (SELECT COUNT(*) FROM users)                         AS users,
  (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL) AS posts,
  (SELECT COUNT(*) FROM likes)                         AS likes,
  (SELECT COUNT(*) FROM follows)                       AS follows;
~~~

Mỗi truy vấn con chạy một lần, trả một giá trị. Với bảng lớn, \`COUNT(*)\` trên InnoDB phải quét — nếu cần thường xuyên và tức thời, người ta lưu sẵn bộ đếm (đánh đổi: phải cập nhật mỗi lần ghi). Với Nhịp, đếm trực tiếp là đủ.`,
    },
    {
      section: "core",
      title: "Theo ngày — và điền ngày trống",
      body: `~~~sql
SELECT DATE(created_at) AS d, COUNT(*) AS n
FROM posts WHERE created_at > (NOW() - INTERVAL 7 DAY)
GROUP BY DATE(created_at);
~~~

Truy vấn này **chỉ trả ngày có bài**. Nếu ngày 22/10 không ai đăng, nó biến mất — biểu đồ sẽ "nhảy cóc" từ 21 sang 23, gây hiểu nhầm.

Cách chữa gọn (làm trong PHP): lấy kết quả vào mảng theo ngày, rồi **lặp đủ 7 ngày**, ngày nào thiếu thì điền 0:

~~~php
for ($i = 6; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i day"));
    $series[] = ['day' => $d, 'n' => $byDay[$d] ?? 0];
}
~~~`,
    },
    {
      section: "core",
      title: "DISTINCT, AVG và top N",
      body: `~~~sql
-- Người đăng bài mỗi ngày (một dạng DAU)
SELECT DATE(created_at), COUNT(DISTINCT user_id)
FROM posts GROUP BY DATE(created_at);

-- Tỷ lệ tương tác
SELECT (SELECT COUNT(*) FROM likes) /
       NULLIF((SELECT COUNT(*) FROM posts WHERE parent_id IS NULL), 0);

-- Top 5 người đăng nhiều nhất
SELECT u.username, COUNT(*) AS n
FROM posts p JOIN users u ON u.id = p.user_id
WHERE p.parent_id IS NULL
GROUP BY u.id ORDER BY n DESC LIMIT 5;
~~~

- \`COUNT(DISTINCT user_id)\`: đếm **người khác nhau**, không phải số bài.
- \`NULLIF(x, 0)\`: tránh **chia cho 0** khi chưa có bài nào — chia cho NULL ra NULL thay vì lỗi.`,
    },
    {
      section: "core",
      title: "Tín hiệu an ninh từ nhật ký",
      body: `Nhật ký (\`activity_log\`, step 19) không chỉ để truy vết sự cố — nó là nguồn **phân tích an ninh**:

~~~sql
SELECT DATE(created_at) AS ngay, COUNT(*) AS lan_sai
FROM activity_log
WHERE action = 'login_failed' AND created_at > (NOW() - INTERVAL 7 DAY)
GROUP BY DATE(created_at);
~~~

Một ngày bỗng có hàng trăm \`login_failed\` từ ít IP → dấu hiệu dò mật khẩu. Đây chính là loại "phát hiện" mà **A09 Security Logging** nhắm tới: ghi log là chưa đủ, phải **nhìn** vào nó. Trang \`/stats\` hiện con số này và đánh dấu khi vượt ngưỡng.`,
    },
    {
      section: "core",
      title: "Trang /stats có phân quyền",
      body: `Trang thống kê để lộ bức tranh tổng thể của sản phẩm — **không** phải ai cũng được xem:

~~~php
$me = require_login();
if ((int) $me['id'] !== STATS_OWNER_ID) {
    abort(403, 'Chỉ chủ sản phẩm xem được trang này.');
}
~~~

Nhịp không có vai trò "admin" riêng nên tạm lấy **tài khoản đầu tiên** (id 1) làm chủ sản phẩm. Một hệ thống thật sẽ có cột \`role\` trong \`users\` và kiểm \`role = 'admin'\` — nhưng nguyên tắc **kiểm quyền ở máy chủ cho từng trang** là như nhau (step 13, 16).`,
    },
    {
      section: "core",
      title: "Biểu đồ CSS thuần — và CSP",
      image: {
        src: "/image/coding/steps/s23-stats.webp",
        alt: "Trang Thống kê Nhịp: sáu thẻ số (6 người dùng, 103 bài gốc, 6 trả lời, 17 lượt tim, 10 theo dõi, 0.17 tim/bài) và biểu đồ cột Bài mới 7 ngày qua với các cột 0,0,0,1,29,41,38",
        caption: "/stats — thẻ chỉ số và biểu đồ cột vẽ bằng CSS thuần, không thư viện biểu đồ nào.",
      },
      body: `Vẽ biểu đồ không cần thư viện JavaScript (nhớ A03 Supply Chain — mỗi thư viện là một rủi ro). Mỗi cột là một \`<div>\` cao theo tỷ lệ.

**Nhưng** CSP của Nhịp (\`style-src 'self'\`, step 17) **cấm \`style=""\` nội tuyến** — nên **không** đặt được \`style="height: 80px"\` trên từng cột. Cách tôn trọng CSP: định nghĩa sẵn các **lớp chiều cao** trong \`style.css\` (\`.bar-h-0\` … \`.bar-h-100\`) và PHP chọn lớp theo tỷ lệ:

~~~php
$pct = (int) (round($d['n'] / $peak * 20) * 5);   // làm tròn về bội số 5
echo '<div class="bar bar-h-' . $pct . '">';
~~~

Chính sách bảo mật ở chặng 4 vừa định hình cách viết giao diện ở chặng 5 — bảo mật và kiến trúc gắn với nhau.`,
    },
    {
      section: "apply",
      title: "database/analytics.sql",
      body: "Lưu toàn bộ truy vấn phân tích vào một tệp để chạy tay trong phpMyAdmin khi cần đào sâu.",
      code: { file: "nhip/database/analytics.sql", lang: "sql", content: `-- 1. Chỉ số tổng quan.
SELECT
  (SELECT COUNT(*) FROM users)                         AS tong_nguoi_dung,
  (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL) AS tong_bai_goc,
  (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) AS tong_tra_loi,
  (SELECT COUNT(*) FROM likes)                         AS tong_tim,
  (SELECT COUNT(*) FROM follows)                       AS tong_theo_doi;

-- 2. Bài mới theo ngày (7 ngày gần nhất).
SELECT DATE(created_at) AS ngay, COUNT(*) AS so_bai
FROM posts
WHERE created_at > (NOW() - INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY ngay;

-- 3. Người dùng hoạt động theo ngày (DAU: có đăng ít nhất 1 bài).
SELECT DATE(created_at) AS ngay, COUNT(DISTINCT user_id) AS nguoi_dang_bai
FROM posts
WHERE created_at > (NOW() - INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY ngay;

-- 4. Top 5 người đăng nhiều bài gốc nhất.
SELECT u.username, COUNT(*) AS so_bai
FROM posts AS p JOIN users AS u ON u.id = p.user_id
WHERE p.parent_id IS NULL
GROUP BY u.id
ORDER BY so_bai DESC
LIMIT 5;` },
    },
    {
      section: "apply",
      title: "src/stats.php",
      body: "Các hàm phân tích. `posts_per_day` điền đủ ngày trống; `NULLIF`/kiểm 0 tránh chia cho 0.",
      code: { file: "nhip/src/stats.php", lang: "php", content: `function overview_stats(): array
{
    return db()->query('SELECT
        (SELECT COUNT(*) FROM users)                            AS users,
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NULL)    AS posts,
        (SELECT COUNT(*) FROM posts WHERE parent_id IS NOT NULL) AS replies,
        (SELECT COUNT(*) FROM likes)                            AS likes,
        (SELECT COUNT(*) FROM follows)                          AS follows')->fetch();
}

/** Bài mới mỗi ngày trong N ngày gần nhất (điền cả ngày không có bài = 0). */
function posts_per_day(int $days = 7): array
{
    $stmt = db()->prepare('SELECT DATE(created_at) AS d, COUNT(*) AS n
        FROM posts WHERE created_at > (NOW() - INTERVAL :days DAY)
        GROUP BY DATE(created_at)');
    $stmt->bindValue(':days', $days, PDO::PARAM_INT);
    $stmt->execute();
    $byDay = [];
    foreach ($stmt->fetchAll() as $row) {
        $byDay[$row['d']] = (int) $row['n'];
    }
    $series = [];
    for ($i = $days - 1; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i day"));
        $series[] = ['day' => $d, 'n' => $byDay[$d] ?? 0];
    }
    return $series;
}

function top_posters(int $limit = 5): array
{
    $stmt = db()->prepare('SELECT u.username, u.display_name, COUNT(*) AS n
        FROM posts AS p JOIN users AS u ON u.id = p.user_id
        WHERE p.parent_id IS NULL GROUP BY u.id ORDER BY n DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
// … top_posters, failed_logins_7d: xem tệp đầy đủ` },
    },
    {
      section: "apply",
      title: "Controller và biểu đồ",
      body: "`src/pages/stats.php` kiểm quyền rồi dựng thẻ số + biểu đồ bằng lớp `bar-h-NN`. Thêm tuyến `/stats` và nạp `stats.php` trong bootstrap.",
      code: { file: "nhip/src/pages/stats.php", lang: "php", content: `$me = require_login();
if ((int) $me['id'] !== STATS_OWNER_ID) {
    abort(403, 'Chỉ chủ sản phẩm xem được trang này.');
}

$overview = overview_stats();
$daily = posts_per_day(7);
$peak = max(array_map(fn ($d) => $d['n'], $daily)) ?: 1;   // để chia tỉ lệ cột
$posters = top_posters();
$failed = failed_logins_7d();
$engagement = $overview['posts'] > 0 ? round($overview['likes'] / $overview['posts'], 2) : 0;

$title = 'Thống kê';
$active = '';
require view('header');
// … thẻ số + biểu đồ bar-h-NN: xem tệp đầy đủ` },
    },
    {
      section: "apply",
      title: "Bài tập phân tích",
      body: `Viết thêm vào \`analytics.sql\` và chạy:

1. **Giữ chân**: có bao nhiêu người đăng bài ở **cả** tuần này lẫn tuần trước? (gợi ý: hai truy vấn con \`user_id IN (...)\`).
2. **Chủ đề nóng**: 5 hashtag được dùng nhiều nhất (\`post_tags JOIN tags GROUP BY\`).
3. **Giờ vàng**: bài đăng tập trung vào khung giờ nào? (\`GROUP BY HOUR(created_at)\`).
4. **Người im lặng**: bao nhiêu tài khoản **chưa** đăng bài nào? (\`LEFT JOIN ... WHERE p.id IS NULL\`).
5. Thêm chỉ số "hashtag mỗi bài trung bình" vào trang \`/stats\`.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 23",
      body: `- [ ] \`analytics.sql\` có đủ truy vấn, chạy được trong phpMyAdmin.
- [ ] \`/stats\` chỉ chủ sản phẩm xem được (người khác → 403).
- [ ] Biểu đồ bài/ngày điền đủ 7 ngày, ngày trống hiện 0.
- [ ] Trang không vi phạm CSP (Console sạch) — dùng lớp CSS, không \`style=""\`.
- [ ] Phân biệt được chỉ số phù phiếm và chỉ số hành động trên chính các số của Nhịp.
- [ ] Rút được ít nhất một tín hiệu an ninh từ \`activity_log\`.`,
    },
  ],
  quiz: [
    { q: "Đâu là chỉ số hành động (actionable), không phải phù phiếm?", o: ["Tổng số bài từ trước tới nay", "Bài mới mỗi ngày (xu hướng tăng/giảm)", "Tổng lượt xem tích luỹ", "Số dòng mã"], a: 1, why: "Chỉ số hành động thay đổi theo việc bạn làm và gợi ý hành động." },
    { q: "Vì sao cần điền ngày trống (0) khi vẽ biểu đồ theo ngày?", o: ["Cho đẹp", "GROUP BY chỉ trả ngày có dữ liệu; thiếu ngày làm biểu đồ nhảy cóc, gây hiểu nhầm", "MySQL yêu cầu", "Để nhanh hơn"], a: 1, why: "Phải lặp đủ dải ngày trong PHP và điền 0 cho ngày không có." },
    { q: "COUNT(DISTINCT user_id) đếm gì?", o: ["Số bài", "Số người dùng khác nhau", "Số lượt tim", "Số ngày"], a: 1, why: "DISTINCT loại trùng, đếm người khác nhau — dùng cho DAU." },
    { kind: "truefalse", q: "Trang thống kê để lộ thông tin tổng hợp nên ai cũng có thể xem.", a: false, why: "Để lộ không kiểm quyền là một dạng Broken Access Control; /stats phải giới hạn." },
    { q: "NULLIF(x, 0) trong công thức tỷ lệ dùng để làm gì?", o: ["Làm tròn", "Tránh lỗi chia cho 0 (chia cho NULL ra NULL)", "Đổi kiểu", "Sắp xếp"], a: 1, why: "Khi mẫu số bằng 0, NULLIF biến nó thành NULL để không lỗi." },
    { kind: "multi", q: "Phân tích theo thời gian cần điều kiện gì ở dữ liệu?", o: ["Mọi bảng có created_at", "Dấu thời gian được ghi khi sự kiện xảy ra", "Biết múi giờ cắt ngày", "Phải có thư viện biểu đồ"], a: [0, 1, 2], why: "Biểu đồ vẽ được bằng CSS thuần, không cần thư viện." },
    { q: "Vì sao Nhịp vẽ biểu đồ bằng lớp CSS bar-h-NN thay vì style=\"height:..\"?", o: ["Gọn hơn", "CSP style-src 'self' cấm style nội tuyến; lớp trong file CSS mới được phép", "Nhanh hơn", "Bắt buộc của HTML"], a: 1, why: "Chính sách bảo mật chặng 4 định hình cách viết giao diện." },
    { kind: "blank", q: "Điền hàm cắt dấu thời gian thành ngày để gom nhóm.", code: "SELECT ______(created_at) AS ngay, COUNT(*) FROM posts GROUP BY 1;", a: "DATE", why: "DATE() bỏ phần giờ, giữ ngày." },
    { q: "Một ngày bỗng có hàng trăm login_failed từ ít IP nghĩa là gì?", o: ["Người dùng hay quên mật khẩu", "Dấu hiệu dò mật khẩu (tấn công) — cần cảnh giác", "Lỗi cơ sở dữ liệu", "Bình thường"], a: 1, why: "Đây là loại phát hiện mà ghi nhật ký (A09) hướng tới." },
    { q: "Theo The Lean Startup, chỉ số tốt cần ba chữ A nào?", o: ["Accurate, Acceptable, Available", "Actionable, Accessible, Auditable", "Automatic, Analog, Agile", "Atomic, Async, API"], a: 1, why: "Gợi hành động, dễ hiểu, kiểm chứng được từ dữ liệu gốc." },
  ],
};
