export default {
  id: "step3",
  lang: "html",
  file: "nhip/index.html",
  duration: "100 phút",
  summary: "Viết HTML đúng nghĩa: khung tài liệu, thẻ ngữ nghĩa, biểu mẫu soạn bài và khung trang cá nhân của Nhịp.",
  slides: [
    {
      section: "intro",
      title: "HTML là bộ xương",
      body: `Mọi trang web có ba lớp: **HTML** là xương (cái gì có trên trang), **CSS** là da (trông thế nào), **JavaScript** là cơ (làm được gì).

Step này chỉ lo bộ xương — và làm cho đúng. Xương lệch thì da đẹp đến mấy cũng đứng không vững.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `- Viết được khung tài liệu HTML chuẩn.
- Chọn đúng thẻ **ngữ nghĩa**: \`header\`, \`nav\`, \`main\`, \`article\`, \`aside\`, \`footer\`.
- Dựng **biểu mẫu** soạn bài có nhãn, giới hạn ký tự.
- Hoàn thành \`index.html\` (bảng tin) và \`profile.html\` (trang cá nhân) của Nhịp.`,
    },
    {
      section: "visual",
      title: "Trang là một cây",
      visual: "dom-tree",
      body: "Thẻ lồng trong thẻ tạo thành một **cây**: `html` là gốc, `head` và `body` là hai nhánh lớn. Trình duyệt dựng cây này (gọi là DOM) từ HTML của bạn — JavaScript ở step 6 sẽ sửa trực tiếp trên cây đó.",
    },
    {
      section: "visual",
      title: "Bố cục ngữ nghĩa của bảng tin",
      visual: "semantic-layout",
      body: "Mỗi vùng của trang có một thẻ mang đúng nghĩa của nó. Trình đọc màn hình, công cụ tìm kiếm và chính bạn sáu tháng sau đều đọc được trang chỉ bằng tên thẻ.",
    },
    {
      section: "visual",
      title: "Giải phẫu một thẻ",
      visual: "tag-anatomy",
      body: "Thẻ mở, thuộc tính (tên=\"giá trị\"), nội dung, thẻ đóng. Một số thẻ không có nội dung nên không có thẻ đóng: `img`, `input`, `meta`, `br`.",
    },
    {
      section: "research",
      title: "Chuẩn HTML là một chuẩn sống",
      body: `HTML hiện do WHATWG duy trì dưới dạng **Living Standard** — chuẩn được cập nhật liên tục thay vì ra phiên bản đánh số. Khi phân vân một thẻ dùng thế nào, nguồn đúng nhất là chuẩn và MDN, không phải blog.

> WHATWG (2025) *HTML Living Standard*. Available at: https://html.spec.whatwg.org/
>
> Mozilla (2025) *HTML: HyperText Markup Language*, MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/HTML`,
    },
    {
      section: "research",
      title: "Khả năng tiếp cận là bắt buộc",
      body: `Khảo sát một triệu trang chủ phổ biến của WebAIM (2024) phát hiện **95,9%** trang có lỗi khả năng tiếp cận tự động phát hiện được; lỗi hay gặp nhất là chữ tương phản thấp, ảnh thiếu chữ thay thế và ô nhập thiếu nhãn.

Ba lỗi đó đều sửa được ngay bằng HTML đúng: \`alt\` cho ảnh, \`label\` cho ô nhập, thẻ ngữ nghĩa cho bố cục.

> WebAIM (2024) *The WebAIM Million*. Available at: https://webaim.org/projects/million/
>
> W3C (2023) *Web Content Accessibility Guidelines (WCAG) 2.2*. Available at: https://www.w3.org/TR/WCAG22/`,
    },
    {
      section: "ideate",
      title: "Một bài đăng gồm những gì",
      visual: "post-anatomy",
      body: `Phân rã một bài đăng của Nhịp:

- **Ảnh đại diện + tên** người viết (liên kết sang trang cá nhân)
- **Thời gian** đăng
- **Nội dung**
- **Hành động**: thả tim, trả lời

Mỗi bài là một \`article\` — vì nó đứng một mình vẫn có nghĩa, chia sẻ riêng được.`,
    },
    {
      section: "ideate",
      title: "Khung trang cá nhân",
      body: `Trang cá nhân gồm hai khối:

1. \`header\` của hồ sơ: ảnh, tên hiển thị, @tên đăng nhập, tiểu sử, số người theo dõi, nút **Theo dõi**.
2. \`section\` danh sách bài của người đó — mỗi bài vẫn là \`article\` giống hệt bảng tin.

Cùng một khối bài đăng dùng ở hai trang: viết một lần cho đúng, dùng lại khắp nơi.`,
    },
    {
      section: "core",
      title: "Khung tài liệu chuẩn",
      body: `~~~html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nhịp</title>
</head>
<body>
  ...
</body>
</html>
~~~

- \`<!DOCTYPE html>\` — bật chế độ chuẩn của trình duyệt.
- \`lang="vi"\` — trình đọc màn hình đọc đúng giọng tiếng Việt.
- \`charset="UTF-8"\` — hiện đúng chữ có dấu.
- \`viewport\` — hiển thị đúng trên điện thoại.`,
    },
    {
      section: "core",
      title: "Thẻ ngữ nghĩa",
      body: `| Thẻ | Nghĩa |
|---|---|
| \`header\` | Phần đầu của trang hoặc của một khối |
| \`nav\` | Nhóm liên kết điều hướng chính |
| \`main\` | Nội dung chính — **chỉ một** mỗi trang |
| \`article\` | Nội dung độc lập: một bài đăng |
| \`section\` | Một phần có tiêu đề riêng |
| \`aside\` | Nội dung phụ: gợi ý theo dõi |
| \`footer\` | Phần cuối |

\`div\` không mang nghĩa gì — chỉ dùng khi không thẻ nào ở trên đúng.`,
    },
    {
      section: "core",
      title: "Tiêu đề, đoạn văn, liên kết, ảnh",
      body: `~~~html
<h1>Bảng tin</h1>              <!-- một h1 mỗi trang -->
<p>Nội dung bài đăng.</p>
<a href="profile.html">lan.code</a>
<img src="img/lan.jpg" alt="Ảnh đại diện của Lan" width="40" height="40">
<time datetime="2026-10-27T09:30">9:30</time>
~~~

- Tiêu đề đi theo thứ bậc h1 → h2 → h3, **không nhảy cấp** để chữ to hơn.
- \`alt\` mô tả ảnh cho người không nhìn thấy; ảnh trang trí thì \`alt=""\`.
- Khai \`width\`/\`height\` để trang không bị giật khi ảnh tải xong.
- \`time\` có \`datetime\` máy đọc được.`,
    },
    {
      section: "core",
      title: "Biểu mẫu",
      body: `~~~html
<form action="#" method="post">
  <label for="content">Có gì mới?</label>
  <textarea id="content" name="content" maxlength="500" required></textarea>
  <button type="submit">Đăng</button>
</form>
~~~

- \`label for\` trỏ đúng \`id\` của ô nhập: bấm vào chữ là con trỏ nhảy vào ô.
- \`name\` là tên field server sẽ nhận (chặng 2).
- \`maxlength\`, \`required\` là kiểm tra tiện lợi ở trình duyệt — **server vẫn phải kiểm lại**.
- \`method="post"\` vì đăng bài là tạo dữ liệu.`,
    },
    {
      section: "core",
      title: "Nút hay liên kết?",
      body: `Quy tắc đơn giản:

- **Đi tới chỗ khác** → \`<a href>\` (sang trang cá nhân).
- **Làm một việc tại chỗ** → \`<button>\` (thả tim, đăng bài).

Dùng \`div\` có sự kiện click thay cho nút là lỗi khả năng tiếp cận: không bấm được bằng bàn phím, trình đọc màn hình không biết đó là nút. \`aria-label\` đặt tên cho nút chỉ có biểu tượng.`,
    },
    {
      section: "core",
      title: "Kiểm tra HTML tự động",
      body: `Trình duyệt **không báo lỗi** khi HTML sai — nó tự đoán và vẽ tiếp. Vì vậy phải dùng công cụ:

- **W3C Markup Validation Service** (validator.w3.org) — dán mã, đọc lỗi.
- **Lighthouse** trong DevTools → mục Accessibility.

Mục tiêu cuối step: validator **0 lỗi**, Lighthouse Accessibility **từ 90 điểm**.`,
    },
    {
      section: "apply",
      title: "Viết bảng tin: phần đầu",
      body: "Mở `index.html`, chép phần khung và thanh điều hướng.",
      code: {
        file: "nhip/index.html",
        lang: "html",
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bảng tin · Nhịp</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="topbar">
    <a href="index.html" class="logo">Nhịp</a>
    <nav aria-label="Điều hướng chính">
      <a href="index.html" aria-current="page">Bảng tin</a>
      <a href="profile.html">Trang cá nhân</a>
    </nav>
  </header>`,
      },
    },
    {
      section: "apply",
      title: "Viết bảng tin: ô soạn bài",
      body: "Ngay dưới `header`, mở `main` và thêm biểu mẫu soạn bài.",
      code: {
        file: "nhip/index.html",
        lang: "html",
        content: `  <main class="feed">
    <h1 class="visually-hidden">Bảng tin</h1>

    <form class="composer" id="composer">
      <label for="content">Có gì mới?</label>
      <textarea id="content" name="content" rows="3"
                maxlength="500" required
                placeholder="Bạn đang nghĩ gì?"></textarea>
      <div class="composer-foot">
        <span id="counter">0/500</span>
        <button type="submit">Đăng</button>
      </div>
    </form>`,
      },
    },
    {
      section: "apply",
      title: "Viết bảng tin: một bài đăng",
      body: "Thêm danh sách bài và một bài mẫu. Ở step 6, JavaScript sẽ tự sinh các `article` giống hệt khối này.",
      code: {
        file: "nhip/index.html",
        lang: "html",
        content: `    <section aria-label="Bài mới nhất" id="posts">
      <article class="post">
        <img class="avatar" src="img/lan.jpg" alt="" width="40" height="40">
        <div class="post-body">
          <header class="post-head">
            <a href="profile.html" class="author">lan.code</a>
            <time datetime="2026-10-27T09:30">9:30</time>
          </header>
          <p>Hôm nay mình bắt đầu học Coding!</p>
          <footer class="post-actions">
            <button type="button" class="like" >Thích <span>0</span></button>
            <button type="button">Trả lời <span>0</span></button>
          </footer>
        </div>
      </article>
    </section>
  </main>
  <script src="js/app.js"></script>
</body>
</html>`,
      },
    },
    {
      section: "apply",
      title: "Viết trang cá nhân",
      body: "Tạo `profile.html` cùng khung `head` và `header.topbar` như bảng tin (đổi `aria-current` sang liên kết Trang cá nhân), rồi thay `main` bằng khối dưới.",
      code: {
        file: "nhip/profile.html",
        lang: "html",
        content: `  <main class="profile">
    <header class="profile-head">
      <div>
        <h1>Lan Nguyễn</h1>
        <p class="handle">@lan.code</p>
        <p class="bio">Học Coding để tự làm mạng xã hội của mình.</p>
        <p class="stats"><strong>128</strong> người theo dõi</p>
      </div>
      <img class="avatar-lg" src="img/lan.jpg" alt="Ảnh đại diện của Lan" width="72" height="72">
      <button type="button" class="follow">Theo dõi</button>
    </header>

    <section aria-labelledby="posts-title">
      <h2 id="posts-title">Bài viết</h2>
      <!-- chép một article.post từ index.html vào đây -->
    </section>
  </main>`,
      },
    },
    {
      section: "apply",
      title: "Kiểm tra và sửa",
      body: `1. Đặt một ảnh vuông bất kỳ vào \`img/lan.jpg\`.
2. Dán từng tệp vào **validator.w3.org/#validate_by_input**, sửa tới khi **0 lỗi**.
3. Mở DevTools → **Lighthouse** → chỉ chọn Accessibility → Analyze. Sửa tới khi **≥ 90**.
4. Thử điều khiển trang **chỉ bằng phím Tab và Enter**: mọi liên kết, ô nhập, nút đều phải tới được.

Trang lúc này trông thô — đúng như mong đợi. CSS ở step 4.`,
    },
  ],
  quiz: [
    { q: "Mỗi bài đăng trên bảng tin nên bọc trong thẻ nào?", o: ["div", "article", "span", "nav"], a: 1, why: "article là nội dung độc lập, đứng riêng vẫn có nghĩa." },
    { q: "Thuộc tính lang=\"vi\" trên thẻ html để làm gì?", o: ["Đổi font", "Trình đọc màn hình và trình duyệt biết trang viết bằng tiếng Việt", "Dịch trang tự động", "Bắt buộc để chạy JavaScript"], a: 1, why: "Ngôn ngữ đúng giúp đọc đúng giọng và gạch chân chính tả đúng." },
    { kind: "blank", q: "Điền thuộc tính để nhãn trỏ đúng vào ô nhập.", code: "<label ___=\"content\">Có gì mới?</label>\n<textarea id=\"content\"></textarea>", a: "for", why: "label for = id của ô nhập; bấm vào nhãn là ô nhận con trỏ." },
    { kind: "truefalse", q: "Đã có maxlength=\"500\" trên textarea thì server không cần kiểm tra độ dài nữa.", a: false, why: "Ai cũng sửa được HTML hoặc gửi request trực tiếp; kiểm tra thật luôn ở server." },
    { kind: "multi", q: "Những thẻ nào là thẻ ngữ nghĩa mô tả vùng của trang?", o: ["header", "main", "div", "nav"], a: [0, 1, 3], why: "div không mang nghĩa, chỉ dùng khi không thẻ ngữ nghĩa nào phù hợp." },
    { q: "Nút thả tim nên viết bằng thẻ gì?", o: ["<div onclick>", "<a href=\"#\">", "<button type=\"button\">", "<span>"], a: 2, why: "Làm một việc tại chỗ là button; bấm được bằng bàn phím và trình đọc màn hình hiểu." },
    { kind: "bug", q: "Dòng nào vi phạm quy tắc thứ bậc tiêu đề?", lines: ["<h1>Bảng tin</h1>", "<section>", "  <h4>Bài mới nhất</h4>", "</section>"], a: 2, why: "Sau h1 phải là h2; nhảy cấp để có chữ nhỏ là dùng sai thẻ — kích cỡ là việc của CSS." },
    { kind: "match", q: "Nối thẻ với vai trò.", pairs: [["main", "Nội dung chính, một lần mỗi trang"], ["aside", "Nội dung phụ"], ["time", "Thời điểm máy đọc được"], ["nav", "Nhóm liên kết điều hướng"]], why: "Chọn thẻ theo nghĩa, không theo hình dáng." },
    { q: "Ảnh chỉ để trang trí nên có alt thế nào?", o: ["Bỏ hẳn alt", "alt=\"\"", "alt=\"ảnh\"", "alt=\"image.jpg\""], a: 1, why: "alt rỗng báo cho trình đọc màn hình bỏ qua; thiếu alt thì nó đọc tên tệp." },
    { q: "Vì sao phải dùng validator thay vì chỉ xem trang trên trình duyệt?", o: ["Trình duyệt không hiện được HTML", "Trình duyệt tự đoán và vẽ tiếp dù HTML sai", "Validator làm trang nhanh hơn", "Bắt buộc theo luật"], a: 1, why: "HTML sai vẫn hiện được nhưng hỏng ở trình đọc màn hình, SEO hoặc trình duyệt khác." },
  ],
};
