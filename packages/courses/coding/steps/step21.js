export default {
  id: "step21",
  lang: "php",
  file: "nhip/src/posts.php",
  duration: "180 phút",
  summary: "Làm Nhịp nhanh và dễ dùng cho mọi người: diệt lỗi N+1, thêm chỉ mục và đọc EXPLAIN, phân trang keyset, tối ưu ảnh, và đạt điểm khả năng tiếp cận 100 trên Lighthouse.",
  slides: [
    {
      section: "intro",
      title: "Chạy đúng chưa đủ — phải chạy tốt",
      body: `Nhịp đã đúng và an toàn. Nhưng với 10 bài thì mọi truy vấn đều "nhanh"; với 100.000 bài và nghìn người dùng, mã viết cẩu thả sẽ chậm dần rồi sập.

Step này đo và sửa bốn thứ quyết định một sản phẩm **đáng dùng**:

- **Số truy vấn** — lỗi N+1 biến một trang thành hàng trăm lượt hỏi cơ sở dữ liệu.
- **Chỉ mục** — giúp cơ sở dữ liệu tìm nhanh thay vì quét cả bảng.
- **Phân trang** — không bao giờ tải toàn bộ dữ liệu một lần.
- **Khả năng tiếp cận và ảnh** — để trang dùng được với mọi người và tải nhẹ.

Nguyên tắc xuyên suốt: **đo trước, sửa sau**. Đừng tối ưu theo cảm tính.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Nhận ra và diệt **lỗi N+1** (một truy vấn cho mỗi phần tử danh sách).
2. Đọc **EXPLAIN** để biết truy vấn dùng chỉ mục hay quét bảng.
3. Thêm **chỉ mục tổng hợp** cho bảng tin và hiểu khi nào chỉ mục giúp/không giúp.
4. Phân trang **keyset** (con trỏ) — nhanh ở trang sâu.
5. Tối ưu ảnh: kích thước rõ, \`loading="lazy"\`, định dạng nhẹ.
6. Đạt **Accessibility 100** trên Lighthouse và hiểu từng tiêu chí.`,
    },
    {
      section: "visual",
      title: "Lỗi N+1",
      visual: "n-plus-one",
      body: `Giả sử vẽ 20 bài, mỗi bài hỏi riêng "ai là tác giả?", "bao nhiêu tim?":

- 1 truy vấn lấy 20 bài.
- + 20 truy vấn lấy tác giả.
- + 20 truy vấn đếm tim.

= **41 truy vấn** cho một trang. Với 100 bài là 201. Đây là **lỗi N+1** — số truy vấn tăng theo số phần tử.

Cách chữa: lấy **tất cả trong một (hoặc vài) truy vấn** bằng \`JOIN\` và \`IN (...)\`. Nhịp đã làm đúng từ đầu: \`FEED_SQL\` \`JOIN users\` lấy tác giả, \`mark_liked\` dùng một \`IN\` cho cả danh sách (step 15). Step này **kiểm chứng** điều đó.`,
    },
    {
      section: "visual",
      title: "Chỉ mục: mục lục của bảng",
      visual: "db-index",
      body: `Không có chỉ mục, để tìm "bài của người dùng 5" cơ sở dữ liệu phải đọc **từng dòng** (full scan — \`type: ALL\` trong EXPLAIN). Với bảng lớn, rất chậm.

Chỉ mục giống **mục lục cuốn sách**: một cấu trúc sắp xếp sẵn (B-tree) trỏ thẳng tới dòng cần. Tìm trở thành "tra mục lục" thay vì "đọc hết sách".

Nhưng chỉ mục **không miễn phí**: mỗi lần ghi (INSERT/UPDATE) phải cập nhật cả chỉ mục, và chỉ mục tốn dung lượng. Vì vậy chỉ đánh chỉ mục cho cột **thường xuất hiện trong WHERE, JOIN, ORDER BY** — không đánh bừa mọi cột.`,
    },
    {
      section: "research",
      title: "Tối ưu truy vấn theo MySQL",
      body: `Tài liệu MySQL mô tả \`EXPLAIN\` là công cụ chính để xem **kế hoạch thực thi**: bảng được đọc theo thứ tự nào, dùng chỉ mục nào (\`key\`), ước lượng bao nhiêu dòng (\`rows\`), và các cờ trong \`Extra\` như \`Using filesort\` (phải sắp xếp thêm) hay \`Using index\` (lấy đủ dữ liệu ngay từ chỉ mục, rất nhanh).

Chỉ mục tổng hợp tuân theo quy tắc **tiền tố trái**: thứ tự cột phải khớp cách truy vấn lọc rồi sắp xếp. MySQL cũng nêu \`LIMIT … OFFSET\` lớn chậm vì phải đọc rồi bỏ qua nhiều dòng — nền tảng cho phân trang keyset.

> Oracle (2025) *MySQL 8.4 Reference Manual: Optimizing Queries with EXPLAIN; Multiple-Column Indexes; LIMIT Query Optimization*. Available at: https://dev.mysql.com/doc/refman/8.4/en/
>
> Winand, M. (2012) *SQL Performance Explained*. Vienna: Markus Winand.`,
    },
    {
      section: "research",
      title: "Khả năng tiếp cận: WCAG",
      body: `**WCAG 2.2** của W3C là chuẩn quốc tế về khả năng tiếp cận web, xoay quanh bốn nguyên tắc **POUR**: *Perceivable* (cảm nhận được), *Operable* (thao tác được), *Understandable* (hiểu được), *Robust* (bền vững với công nghệ hỗ trợ).

Lighthouse (Google) tự động kiểm **một phần** các tiêu chí này. Điểm 100 **không** bảo đảm trang hoàn hảo — nhiều tiêu chí (ví dụ thứ tự đọc có hợp lý không) chỉ kiểm được bằng tay — nhưng nó bắt hết các lỗi máy phát hiện được.

Nhịp đã theo WCAG từ chặng 1: nút ≥44px, \`alt\`, \`aria-pressed\`, \`aria-label\`, \`label\` cho mọi ô nhập.

> W3C (2023) *Web Content Accessibility Guidelines (WCAG) 2.2*. Available at: https://www.w3.org/TR/WCAG22/
>
> Google (2025) *Lighthouse Accessibility scoring*. Available at: https://developer.chrome.com/docs/lighthouse/accessibility/scoring`,
    },
    {
      section: "ideate",
      title: "Đo trước khi sửa",
      body: `Thứ tự làm việc của step này:

1. **Đo số truy vấn** một trang bằng cách tạm đếm (hoặc bật log truy vấn). Xác nhận bảng tin **không** N+1.
2. **EXPLAIN** truy vấn bảng tin → thấy \`Using filesort\`.
3. **Thêm chỉ mục** → EXPLAIN lại → thấy \`Using index\`.
4. **Phân trang keyset** thay cho tải hết.
5. **Lighthouse** → sửa các lỗi còn lại → 100.

Quy tắc vàng của tối ưu (Knuth): *"tối ưu sớm là gốc của mọi tai hoạ"*. Chỉ tối ưu chỗ **đo được là chậm**, không đoán.`,
    },
    {
      section: "core",
      title: "Kiểm Nhịp không bị N+1",
      body: `Bật đếm truy vấn tạm trong \`db.php\` (chỉ để đo, xoá sau):

~~~php
// Sau khi tạo PDO, bọc để đếm — chỉ dùng khi đo
$pdo->setAttribute(PDO::ATTR_STATEMENT_CLASS, [CountingStatement::class]);
~~~

Cách gọn hơn: bật **General Query Log** của MySQL một lát, tải bảng tin, rồi đếm dòng \`Query\`. Với Nhịp, một lần tải bảng tin chỉ sinh **ít truy vấn cố định** (feed + mark_liked + phiên), **không** tăng theo số bài.

Nếu bạn lỡ viết vòng lặp gọi \`find_user_by_id($post['user_id'])\` cho mỗi bài — đó chính là N+1. \`FEED_SQL\` đã \`JOIN users\` để tránh.`,
    },
    {
      section: "core",
      title: "Đọc EXPLAIN",
      image: {
        src: "/image/coding/steps/s21-explain.webp",
        alt: "Kết quả EXPLAIN trong phpMyAdmin: type ref, possible_keys idx_posts_parent,idx_posts_feed, key idx_posts_feed, rows 102, Extra Using where; Using index",
        caption: "EXPLAIN truy vấn bảng tin sau khi thêm chỉ mục: key = idx_posts_feed, Extra = Using index (không còn filesort).",
      },
      body: `Thêm \`EXPLAIN\` trước một \`SELECT\` để xem kế hoạch. Các cột quan trọng:

- **type**: \`ALL\` = quét cả bảng (xấu); \`ref\`/\`range\` = dùng chỉ mục (tốt); \`const\`/\`eq_ref\` = rất tốt.
- **key**: chỉ mục thực sự được dùng (\`NULL\` = không dùng).
- **rows**: ước lượng số dòng phải đọc — càng nhỏ càng tốt.
- **Extra**: \`Using filesort\` = phải sắp xếp thêm trong bộ nhớ; \`Using index\` = lấy đủ từ chỉ mục, nhanh nhất.

Trước khi thêm chỉ mục, truy vấn bảng tin hiện \`Using filesort\` — cơ sở dữ liệu phải sắp xếp toàn bộ bài theo thời gian mỗi lần.`,
    },
    {
      section: "core",
      title: "Chỉ mục tổng hợp cho bảng tin",
      body: `Truy vấn bảng tin lọc \`parent_id IS NULL\` rồi sắp \`created_at DESC, id DESC\`. Chỉ mục khớp đúng trình tự đó:

~~~sql
ALTER TABLE posts ADD KEY idx_posts_feed (parent_id, created_at, id);
~~~

Thứ tự cột theo **quy tắc tiền tố trái**: cột lọc bằng (\`parent_id\`) trước, rồi cột sắp xếp (\`created_at\`, \`id\`). Sau khi thêm, EXPLAIN đổi từ \`Using filesort\` sang **\`Using index\`**: cơ sở dữ liệu đọc đúng 20 dòng đầu từ chỉ mục đã sắp sẵn, không sắp xếp lại gì.

Lưu ý: trên bảng **rất nhỏ** (vài chục dòng), MySQL có thể bỏ qua chỉ mục vì quét thẳng còn nhanh hơn — chỉ mục phát huy khi dữ liệu lớn.`,
    },
    {
      section: "core",
      title: "Phân trang keyset",
      body: `\`LIMIT 20 OFFSET 2000\` (trang 101) buộc đọc rồi **bỏ** 2000 dòng — càng sâu càng chậm (step 10). Mạng xã hội dùng **con trỏ keyset**: nhớ bài cuối trang trước, lấy bài **cũ hơn nó**.

~~~php
function feed_posts(int $limit = 20, ?array $before = null): array
{
    $cursor = $before ? 'AND (p.created_at, p.id) < (:before_at, :before_id)' : '';
    $sql = FEED_SQL . " WHERE p.parent_id IS NULL $cursor
                        GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC
                        LIMIT :limit";
    // lấy $limit + 1 để biết CÒN trang sau không
}
~~~

So sánh **cặp** \`(created_at, id) < (…, …)\` xử lý đúng cả khi nhiều bài trùng thời điểm. Chỉ mục \`idx_posts_feed\` khiến bước này nhảy thẳng tới đúng chỗ — nhanh như trang đầu dù ở trang 1000.`,
    },
    {
      section: "core",
      title: "Nút \"Xem thêm\"",
      image: {
        src: "/image/coding/steps/s21-pagination.webp",
        alt: "Cuối bảng tin Nhịp có nút Xem thêm dạng viền tròn",
        caption: "Lấy 21 bài, hiện 20; còn bài thứ 21 thì hiện nút Xem thêm mang con trỏ của bài thứ 20.",
      },
      body: `Controller lấy \`limit + 1\` bài: nếu nhận đủ 21, nghĩa là **còn** trang sau → hiện nút "Xem thêm" với con trỏ là bài thứ 20:

~~~php
$posts = feed_posts(20, $before);
$hasMore = count($posts) > 20;
$posts = array_slice($posts, 0, 20);
// link: url('feed', ['before' => $last['created_at'] . '|' . $last['id']])
~~~

Con trỏ trên địa chỉ được **kiểm bằng regex** trước khi tin (dữ liệu từ máy khách — step 16). URL mang con trỏ nên trang 2 vẫn chia sẻ/đánh dấu được.`,
    },
    {
      section: "core",
      title: "Tối ưu ảnh",
      body: `Ảnh thường là phần **nặng nhất** của trang. Nhịp làm bốn việc:

- **Kích thước rõ**: mọi \`<img>\` có \`width\` và \`height\` → trình duyệt chừa sẵn chỗ, trang không "nhảy" khi ảnh tải (giảm *Cumulative Layout Shift*).
- **\`loading="lazy"\`**: ảnh ngoài màn hình chỉ tải khi cuộn tới.
- **\`alt\`**: mô tả cho trình đọc màn hình; ảnh trang trí để \`alt=""\`.
- **Vẽ lại + nén** (step 18): ảnh đại diện được GD ghi lại ở chất lượng 85 — nhỏ gọn, đồng đều.

Bước xa hơn (ngoài khoá): tạo nhiều kích cỡ (\`srcset\`) và dùng WebP/AVIF cho ảnh lớn.`,
    },
    {
      section: "core",
      title: "Đạt Accessibility 100",
      image: {
        src: "/image/coding/steps/s21-lighthouse.webp",
        alt: "Bảng điểm Lighthouse của Nhịp: Accessibility 100, Best Practices 100, SEO 100, Agentic Browsing 2/2",
        caption: "Lighthouse (mobile) trên bảng tin Nhịp: Accessibility, Best Practices, SEO đều 100.",
      },
      body: `Chạy Lighthouse (DevTools → Lighthouse → Accessibility → *Analyze*). Hai lỗi thường gặp và cách Nhịp sửa:

- **meta description thiếu** → thêm \`<meta name="description">\` vào \`header.php\` (cũng tốt cho tìm kiếm — step 23).
- **nhãn không khớp văn bản hiển thị** (nút tim có \`aria-label="Thích"\` nhưng hiện "♥ 0"): đổi sang **nhãn ẩn** khớp nội dung — \`<span class="visually-hidden">Thích,</span><span>0</span>\`, và \`♥\` đánh \`aria-hidden="true"\`.

Điểm 100 là sàn, không phải trần: vẫn nên **tự kiểm tay** bằng bàn phím (Tab qua mọi nút) và một trình đọc màn hình (VoiceOver/NVDA).`,
    },
    {
      section: "apply",
      title: "Chỉ mục và phân trang",
      body: "Thêm `idx_posts_feed` vào `database/schema.sql` và chạy `ALTER TABLE`. Sửa `feed_posts` nhận con trỏ `$before`.",
      code: { file: "nhip/src/posts.php", lang: "php", content: `-- database/schema.sql: thêm vào bảng posts
  KEY idx_posts_feed (parent_id, created_at, id),

function feed_posts(int $limit = 20, ?array $before = null): array
{
    $cursor = $before
        ? 'AND (p.created_at, p.id) < (:before_at, :before_id)'
        : '';
    $stmt = db()->prepare(FEED_SQL . "
        WHERE p.parent_id IS NULL $cursor
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit");
    if ($before) {
        $stmt->bindValue(':before_at', $before['created_at']);
        $stmt->bindValue(':before_id', (int) $before['id'], PDO::PARAM_INT);
    }
    $stmt->bindValue(':limit', $limit + 1, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}` },
    },
    {
      section: "apply",
      title: "feed.php: nút Xem thêm",
      body: "Đọc con trỏ `?before` (kiểm regex), lấy 21 bài để biết còn trang sau, cắt còn 20, hiện nút.",
      code: { file: "nhip/src/pages/feed.php", lang: "php", content: `const FEED_PER_PAGE = 20;
// Con trỏ keyset "created_at|id" của bài cuối trang trước (nếu có).
$before = null;
if (preg_match('/^(\\d{4}-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d)\\|(\\d+)$/', (string) ($_GET['before'] ?? ''), $m)) {
    $before = ['created_at' => $m[1], 'id' => (int) $m[2]];
}

if ($tab === 'following') {
    $posts = following_feed((int) $me['id']);
    $hasMore = false;
} else {
    $posts = feed_posts(FEED_PER_PAGE, $before);
    $hasMore = count($posts) > FEED_PER_PAGE;         // lấy dư 1 để biết còn trang sau
    $posts = array_slice($posts, 0, FEED_PER_PAGE);
}
$posts = mark_liked($posts, $me);
// … trong phần HTML, sau </section>:
    <?php if (!empty($hasMore)): $last = end($posts); ?>
      <p class="more">
        <a href="<?= url('feed', ['before' => $last['created_at'] . '|' . $last['id']]) ?>">Xem thêm</a>
      </p>
    <?php endif; ?>` },
    },
    {
      section: "apply",
      title: "Sửa a11y cho Lighthouse 100",
      body: "Meta description trong header, và nút tim dùng nhãn ẩn khớp văn bản. `app.js` cập nhật nhãn ẩn thay vì `aria-label`.",
      code: { file: "nhip/src/views/post.php", lang: "php", content: `<!-- header.php: trong <head> -->
<meta name="description" content="Nhịp — mạng xã hội chia sẻ bài viết ngắn. Dự án học tập của khoá Coding.">

      <form method="post" action="<?= url('like') ?>" class="inline like-form">
        <?= csrf_field() ?>
        <input type="hidden" name="post_id" value="<?= (int) $post['id'] ?>">
        <button type="submit" class="like" aria-pressed="<?= $liked ? 'true' : 'false' ?>">
          <span aria-hidden="true">♥</span>
          <span class="visually-hidden"><?= $liked ? 'Bỏ thích,' : 'Thích,' ?></span>
          <span><?= (int) $post['likes'] ?></span>
        </button>
      </form>` },
    },
    {
      section: "apply",
      title: "Bài tập đo và tối ưu",
      body: `1. Bật General Query Log của MySQL (\`SET GLOBAL general_log = 'ON';\`), tải bảng tin, đếm số \`Query\`. Tắt lại sau khi đo.
2. Cố tình viết một vòng lặp N+1 (gọi \`find_user_by_id\` trong vòng \`foreach\`), đo lại, rồi bỏ đi — thấy số truy vấn tăng vọt.
3. \`EXPLAIN\` truy vấn tìm kiếm \`LIKE '%…%'\` — vì sao nó **không** dùng được chỉ mục? (gợi ý: \`%\` ở đầu). Tìm hiểu \`FULLTEXT\`.
4. Thêm \`srcset\` cho ảnh đại diện (hai kích cỡ) và quan sát Network.
5. Chạy Lighthouse ở chế độ mobile, đọc từng tiêu chí trong mục Accessibility.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 21",
      body: `- [ ] Xác nhận bảng tin không N+1: số truy vấn cố định, không tăng theo số bài.
- [ ] Đọc được EXPLAIN; truy vấn bảng tin dùng \`idx_posts_feed\`, hết \`Using filesort\`.
- [ ] Phân trang keyset chạy: nút "Xem thêm" mang con trỏ, trang 2 đúng thứ tự, không lặp/mất bài.
- [ ] Mọi \`<img>\` có \`width/height/alt\` và \`loading="lazy"\` ở ảnh trong danh sách.
- [ ] Lighthouse Accessibility = 100 trên cả mobile; bạn Tab được qua mọi nút.
- [ ] Hiểu: chỉ thêm chỉ mục cho cột dùng trong WHERE/JOIN/ORDER BY, không đánh bừa.`,
    },
  ],
  quiz: [
    { q: "Lỗi N+1 là gì?", o: ["Truy vấn sai cú pháp", "Số truy vấn tăng theo số phần tử: 1 truy vấn danh sách + 1 cho mỗi phần tử", "Chỉ mục bị hỏng", "Quá nhiều cột"], a: 1, why: "Chữa bằng JOIN và IN để lấy tất cả trong vài truy vấn cố định." },
    { q: "Trong EXPLAIN, type: ALL nghĩa là gì?", o: ["Dùng mọi chỉ mục", "Quét toàn bộ bảng (không dùng chỉ mục) — thường là chậm", "Truy vấn hoàn hảo", "Lấy tất cả cột"], a: 1, why: "ALL = full table scan; muốn thấy ref/range/const." },
    { kind: "truefalse", q: "Nên đánh chỉ mục cho mọi cột để chắc chắn nhanh.", a: false, why: "Mỗi chỉ mục làm chậm ghi và tốn chỗ; chỉ đánh cho cột dùng trong WHERE/JOIN/ORDER BY." },
    { q: "Extra: Using filesort trong EXPLAIN nghĩa là gì?", o: ["Đọc từ tệp", "Cơ sở dữ liệu phải sắp xếp thêm — chỉ mục đúng thứ tự sẽ loại bỏ nó", "Truy vấn nhanh nhất", "Lỗi SQL"], a: 1, why: "Chỉ mục khớp ORDER BY cho Using index, không cần sắp xếp lại." },
    { q: "Vì sao phân trang keyset nhanh hơn OFFSET ở trang sâu?", o: ["Dùng ít RAM hơn", "Nhảy thẳng tới đúng chỗ bằng chỉ mục, không đọc rồi bỏ nhiều dòng", "Không cần ORDER BY", "Tải tất cả một lần"], a: 1, why: "OFFSET lớn vẫn phải đọc và bỏ qua mọi dòng trước đó." },
    { kind: "bug", q: "Đoạn nào gây lỗi N+1?", lines: ["foreach ($posts as $post) {", "  $author = find_user_by_id($post['user_id']);", "  echo $author['display_name'];", "}"], a: 1, why: "Một truy vấn find_user_by_id cho mỗi bài; dùng JOIN trong truy vấn lấy bài." },
    { kind: "multi", q: "Cách nào giúp ảnh tải nhẹ và không làm nhảy layout?", o: ["Đặt width và height", "loading=\"lazy\"", "alt mô tả", "Dùng ảnh BMP lớn"], a: [0, 1, 2], why: "BMP không nén; dùng WebP/JPEG. Ba cách kia đều đúng." },
    { kind: "blank", q: "Điền thứ tự cột của chỉ mục bảng tin (lọc rồi sắp).", code: "ALTER TABLE posts ADD KEY idx_posts_feed (________, created_at, id);", a: "parent_id", why: "Quy tắc tiền tố trái: cột lọc bằng (parent_id) đứng trước cột sắp xếp." },
    { q: "Lighthouse Accessibility 100 có nghĩa trang hoàn hảo về tiếp cận không?", o: ["Có, tuyệt đối", "Không — chỉ các tiêu chí máy kiểm được; vẫn cần kiểm tay bằng bàn phím và trình đọc màn hình", "Chỉ đúng trên mobile", "Không liên quan"], a: 1, why: "Nhiều tiêu chí WCAG chỉ kiểm được bằng tay." },
    { q: "Vì sao LIKE '%tu khoa%' không dùng được chỉ mục thường?", o: ["LIKE luôn chậm", "Có % ở đầu nên không thể tra theo tiền tố của chỉ mục", "Thiếu ORDER BY", "Chỉ mục bị hỏng"], a: 1, why: "Chỉ mục B-tree tra theo tiền tố; % đầu phá điều đó. Dùng FULLTEXT cho tìm toàn văn." },
  ],
};
