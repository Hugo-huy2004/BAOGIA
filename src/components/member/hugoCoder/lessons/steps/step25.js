export default {
  id: "step25",
  lang: "md",
  file: "nhip/README.md",
  duration: "120 phút",
  summary: "Viết tài liệu để người lạ (và chính bạn sau này) tự cài, hiểu và dùng được Nhịp: README theo khung Diátaxis, cú pháp Markdown, hướng dẫn cài đặt chạy được từng lệnh, và tài liệu triển khai + bảo mật.",
  slides: [
    {
      section: "intro",
      title: "Mã không tự giải thích",
      body: `Nhịp đã lên Internet. Nhưng nếu một người lạ (hoặc chính bạn sau sáu tháng) mở kho mã, họ sẽ hỏi: *Đây là gì? Cài sao? Chạy sao? Sửa ở đâu?* Mã nguồn **không** tự trả lời những câu đó.

Tài liệu là phần việc bị xem nhẹ nhất nhưng quyết định dự án có **dùng lại được** không. Step này viết tài liệu cho Nhịp sao cho **người lạ tự cài và dùng được chỉ bằng chữ bạn viết** — đúng yêu cầu của chặng cuối.

Viết tài liệu cũng là một **phép thử thiết kế**: nếu một tính năng khó giải thích, thường vì nó được thiết kế rối.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu bốn loại tài liệu theo khung **Diátaxis** và viết đúng loại cho đúng nhu cầu.
2. Viết **README** đủ: mô tả, tính năng, yêu cầu, cài đặt, cấu trúc, triển khai, giấy phép.
3. Dùng **Markdown** thành thạo: tiêu đề, danh sách, khối mã, bảng, ảnh, liên kết.
4. Viết **hướng dẫn cài đặt chạy được** — copy từng lệnh là chạy, không thiếu bước.
5. Liên kết tài liệu: README → \`DEPLOY.md\`, \`SECURITY.md\`.
6. Hiểu tài liệu là **tài liệu sống**: cập nhật mỗi khi mã đổi.`,
    },
    {
      section: "visual",
      title: "Bốn loại tài liệu (Diátaxis)",
      visual: "diataxis",
      body: `Khung **Diátaxis** chia tài liệu theo nhu cầu người đọc:

- **Tutorial** — *học*: dắt tay người mới làm xong một việc đầu tiên. ("Cài Nhịp và đăng bài đầu tiên.")
- **How-to** — *làm*: các bước giải quyết một việc cụ thể. (\`DEPLOY.md\`)
- **Reference** — *tra cứu*: mô tả chính xác, khô khan. (Danh sách tuyến, lược đồ CSDL.)
- **Explanation** — *hiểu*: vì sao thiết kế thế này. (\`SECURITY.md\`, các slide "research".)

Lỗi phổ biến: trộn lẫn — nhét lý thuyết vào hướng dẫn cài đặt. Mỗi tài liệu phục vụ **một** nhu cầu.`,
    },
    {
      section: "visual",
      title: "README mở cửa dự án",
      image: {
        src: "/image/coding/steps/s25-readme.webp",
        alt: "README.md của Nhịp hiển thị kiểu GitHub: tiêu đề Nhịp, mô tả một dòng, ảnh bảng tin, mục Tính năng với danh sách gạch đầu dòng, mục Yêu cầu",
        caption: "README.md kết xuất kiểu GitHub — thứ đầu tiên người ta thấy khi mở kho mã.",
      },
      body: `README là **trang bìa** của dự án. Trên GitHub/GitLab nó tự hiện ở trang chủ kho mã. Người đọc quét trong 30 giây để quyết định có dùng không, nên thứ tự quan trọng:

1. **Tên + một câu** mô tả (nó là gì).
2. Ảnh/demo (nó trông ra sao).
3. Tính năng (nó làm được gì).
4. Cài đặt (bắt đầu thế nào).
5. Các liên kết sâu hơn.`,
    },
    {
      section: "research",
      title: "Chuẩn viết tài liệu",
      body: `**Diátaxis** (Procida) là khung tổ chức tài liệu kỹ thuật được nhiều dự án lớn (Django, Gatsby…) áp dụng: tách bốn loại theo trục *học/làm* và *thực hành/lý thuyết*.

**Markdown** (Gruber, 2004) là ngôn ngữ đánh dấu nhẹ, chuẩn hoá thành **CommonMark**; GitHub dùng biến thể **GitHub Flavored Markdown** (thêm bảng, checklist, khối mã có tô màu). Nó là định dạng tài liệu mặc định của mọi kho mã.

> Procida, D. (2017) *Diátaxis documentation framework*. Available at: https://diataxis.fr/
>
> MacFarlane, J. et al. (2019) *CommonMark Spec*. Available at: https://spec.commonmark.org/
>
> GitHub (2025) *Basic writing and formatting syntax*. Available at: https://docs.github.com/get-started/writing-on-github`,
    },
    {
      section: "research",
      title: "README tốt gồm gì",
      body: `Trang *Make a README* tổng hợp các mục một README nên có: **tên, mô tả, cài đặt, cách dùng, đóng góp, giấy phép**; và một nguyên tắc: viết cho **người chưa biết gì** về dự án.

Hướng dẫn cài đặt phải **chạy được**: mỗi lệnh copy–dán là chạy, không giả định bước ngầm ("tất nhiên bạn đã có MySQL…"). Cách kiểm tốt nhất: đưa cho một người **chưa từng thấy** dự án làm theo, chỗ nào họ kẹt là chỗ tài liệu thiếu.

> Guo, D. (2023) *Make a README*. Available at: https://www.makeareadme.com/
>
> GitHub (2025) *About READMEs*. Available at: https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes`,
    },
    {
      section: "ideate",
      title: "Bản đồ tài liệu của Nhịp",
      body: `| Tệp | Loại Diátaxis | Cho ai |
|---|---|---|
| \`README.md\` | Tổng quan + cài đặt (tutorial/how-to) | Người mới mở kho mã |
| \`DEPLOY.md\` | How-to | Người đưa lên hosting |
| \`SECURITY.md\` | Explanation | Người quan tâm bảo mật |
| \`database/schema.sql\` (có chú thích) | Reference | Người cần hiểu dữ liệu |
| \`database/analytics.sql\` | Reference | Người phân tích |

Ba tệp \`.md\` ở gốc, liên kết tới nhau. Không viết lại cùng một thứ ở nhiều nơi — mỗi sự thật một chỗ, chỗ khác **liên kết** tới.`,
    },
    {
      section: "core",
      title: "Markdown nền tảng",
      body: `~~~markdown
# Tiêu đề 1    ## Tiêu đề 2    ### Tiêu đề 3

**đậm**   *nghiêng*   \`mã trong dòng\`

- Danh sách      1. Danh sách có số
- gạch đầu dòng   2. ...

> Trích dẫn / ghi chú nổi bật

[Chữ liên kết](DEPLOY.md)      ![Mô tả ảnh](docs/feed.png)
~~~

Dòng trống phân tách đoạn. Markdown cố ý **đơn giản**: đọc được ngay cả khi chưa kết xuất, nên vừa là tài liệu vừa là văn bản thuần.`,
    },
    {
      section: "core",
      title: "Khối mã và bảng",
      body: `Khối mã dùng ba dấu huyền kèm **tên ngôn ngữ** để tô màu:

~~~markdown
\`\`\`bash
php -S localhost:8000 -t public public/router-dev.php
\`\`\`
~~~

Bảng (GitHub Flavored):

~~~markdown
| Tệp | Vai trò |
|---|---|
| public/ | web root |
| src/ | mã nguồn |
~~~

Checklist \`- [ ]\` / \`- [x]\` hữu ích cho danh sách nghiệm thu (bạn đã thấy ở cuối mỗi step). Dùng đúng **tên ngôn ngữ** (\`php\`, \`sql\`, \`bash\`) để người đọc biết đang nhìn gì.`,
    },
    {
      section: "core",
      title: "Hướng dẫn cài đặt chạy được",
      body: `Phần quan trọng nhất của README. Nguyên tắc:

1. **Liệt kê yêu cầu trước** (PHP 8.2+, MySQL, tiện ích \`pdo_mysql\`, \`gd\`…).
2. **Đánh số từng bước**, mỗi bước một mục đích rõ.
3. **Lệnh copy–dán được**, không viết tắt mơ hồ.
4. **Nói kết quả mong đợi**: "Mở http://localhost:8000, tài khoản mẫu \`lan.code\`/\`nhip-demo-2026\`".

~~~bash
cp config.sample.php config.php          # rồi sửa thông tin CSDL
mysql -u root -e "SOURCE database/schema.sql"
php -S localhost:8000 -t public public/router-dev.php
~~~

Có \`config.sample.php\` (step 11) chính là để câu "cp config.sample.php config.php" chạy được.`,
    },
    {
      section: "core",
      title: "Ảnh, demo và liên kết",
      body: `- **Ảnh**: một ảnh chụp bảng tin ở đầu README bằng cả nghìn chữ mô tả. Lưu trong \`docs/\`, dẫn bằng \`![alt](docs/feed.png)\`. \`alt\` mô tả ảnh (khả năng tiếp cận + hiện khi ảnh hỏng).
- **Demo trực tiếp**: nếu đã deploy (step 24), thêm link "Xem thử: https://nhip…".
- **Liên kết chéo**: README **không** lặp lại toàn bộ \`DEPLOY.md\`; nó **trỏ** tới: \`Xem [DEPLOY.md](DEPLOY.md)\`.

Một sự thật chỉ viết một nơi. Lặp lại là nguồn gốc của tài liệu "lệch" — sửa chỗ này quên chỗ kia.`,
    },
    {
      section: "core",
      title: "Tài liệu là tài liệu sống",
      body: `Tài liệu **sai** còn tệ hơn không có: nó làm người đọc mất lòng tin và lãng phí thời gian. Nên:

- Thêm tính năng → cập nhật mục Tính năng trong README.
- Đổi bước cài đặt → sửa hướng dẫn ngay.
- Đổi lược đồ CSDL → sửa chú thích trong \`schema.sql\`.

Mẹo: coi tài liệu là **một phần của việc "xong"**. Một tính năng chưa có tài liệu là tính năng **chưa xong**. Nhiều nhóm đặt luật: pull request đổi hành vi mà không đổi tài liệu thì không được gộp.`,
    },
    {
      section: "apply",
      title: "README.md",
      body: "Viết `README.md` ở gốc dự án. Đây là bản của Nhịp — bạn điều chỉnh theo những gì mình đã làm.",
      code: { file: "nhip/README.md", lang: "md", content: `# Nhịp

> Mạng xã hội chia sẻ bài viết ngắn — dự án học tập của khoá **Coding** (Hugo Studio).

Nhịp cho phép đăng ký, đăng bài, trả lời lồng nhau, thả tim, theo dõi, gắn hashtag,
nhắc tên và nhận thông báo. Xây bằng **PHP thuần + MySQL**, không thư viện ngoài.

![Bảng tin Nhịp](docs/feed.png)

## Tính năng

- Tài khoản: đăng ký, đăng nhập (tên hoặc email), mật khẩu băm bcrypt.
- Bài đăng: tạo / sửa / xoá có kiểm quyền sở hữu.
- Tương tác: thả tim không tải lại trang (Fetch), trả lời lồng nhiều tầng.
- Mạng lưới: trang cá nhân, ảnh đại diện, theo dõi, bảng tin "Đang theo dõi".
- Khám phá: tìm kiếm, hashtag \`#chủ-đề\`, nhắc tên \`@người\`.
- Thông báo: reply / like / follow / mention, huy hiệu chưa đọc.
- Bảo mật: chống SQL Injection, XSS, CSRF; CSP; giới hạn tần suất; nhật ký.
- Vận hành: thống kê sản phẩm (\`/stats\`), phân trang keyset.

## Yêu cầu

- PHP 8.2+ (có các tiện ích \`pdo_mysql\`, \`gd\`, \`mbstring\`, \`fileinfo\`).
- MySQL 8 hoặc MariaDB 10.4+.
- Máy chủ web (Apache + mod_rewrite, hoặc PHP built-in server khi phát triển).

## Cài đặt (localhost)

\`\`\`bash
# 1. Lấy mã
git clone <repo> nhip && cd nhip

# 2. Cấu hình
cp config.sample.php config.php
# sửa config.php: db_host, db_name, db_user, db_pass

# 3. Tạo cơ sở dữ liệu
mysql -u root -e "SOURCE database/schema.sql"
mysql -u root nhip -e "SOURCE database/seed.sql"   # dữ liệu mẫu (tuỳ chọn)

# 4. Chạy (phát triển)
php -S localhost:8000 -t public public/router-dev.php
\`\`\`

Mở http://localhost:8000. Tài khoản mẫu: \`lan.code\` / \`nhip-demo-2026\`.

Với XAMPP: chép thư mục vào \`htdocs/\`, trỏ trình duyệt tới
\`http://localhost/nhip/public/\`.

## Cấu trúc thư mục
...` },
    },
    {
      section: "apply",
      title: "Hướng dẫn cài đặt",
      body: "Phần cài đặt phải chạy được từng lệnh. `router-dev.php` là router cho máy chủ PHP built-in (mô phỏng .htaccess) khi phát triển.",
      code: { file: "nhip/README.md", lang: "md", content: `## Cài đặt (localhost)

\`\`\`bash
# 1. Lấy mã
git clone <repo> nhip && cd nhip

# 2. Cấu hình
cp config.sample.php config.php
# sửa config.php: db_host, db_name, db_user, db_pass

# 3. Tạo cơ sở dữ liệu
mysql -u root -e "SOURCE database/schema.sql"
mysql -u root nhip -e "SOURCE database/seed.sql"   # dữ liệu mẫu (tuỳ chọn)

# 4. Chạy (phát triển)
php -S localhost:8000 -t public public/router-dev.php
\`\`\`

Mở http://localhost:8000. Tài khoản mẫu: \`lan.code\` / \`nhip-demo-2026\`.
...` },
    },
    {
      section: "apply",
      title: "Bài tập viết tài liệu",
      body: `1. Đưa README cho một người **chưa thấy** Nhịp, bảo họ cài theo. Ghi lại mọi chỗ họ kẹt → đó là chỗ tài liệu thiếu. Sửa.
2. Viết một **tutorial** ngắn: "Đăng bài đầu tiên trên Nhịp" (5–7 bước có ảnh).
3. Viết phần **Reference** liệt kê mọi tuyến (\`GET /\`, \`POST /posts\`…) và việc của nó.
4. Thêm **mục Đóng góp** (Contributing): cách báo lỗi, quy ước commit.
5. Chụp ảnh thật của Nhịp đã deploy, thay \`docs/feed.png\`.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 25",
      body: `- [ ] \`README.md\` có: mô tả một câu, ảnh, tính năng, yêu cầu, cài đặt, cấu trúc, liên kết.
- [ ] Hướng dẫn cài đặt chạy được từng lệnh (người lạ tự làm được).
- [ ] Markdown đúng: tiêu đề, danh sách, bảng, khối mã có tên ngôn ngữ.
- [ ] README liên kết tới \`DEPLOY.md\` và \`SECURITY.md\`, không lặp nội dung.
- [ ] Phân biệt được bốn loại tài liệu Diátaxis.
- [ ] Hiểu: tính năng chưa có tài liệu là chưa xong.`,
    },
  ],
  quiz: [
    { q: "Theo Diátaxis, DEPLOY.md (các bước đưa lên hosting) thuộc loại nào?", o: ["Tutorial", "How-to", "Reference", "Explanation"], a: 1, why: "How-to: hướng dẫn làm một việc cụ thể cho người đã biết cơ bản." },
    { q: "Thứ nên xuất hiện đầu README là gì?", o: ["Giấy phép", "Tên dự án + một câu mô tả nó là gì", "Lịch sử phiên bản", "Danh sách lỗi"], a: 1, why: "Người đọc quyết định trong 30 giây; phải biết ngay đây là gì." },
    { kind: "truefalse", q: "Hướng dẫn cài đặt nên giả định người đọc đã quen dự án.", a: false, why: "Viết cho người chưa biết gì; mỗi lệnh phải chạy được, không bước ngầm." },
    { q: "Khối mã Markdown nên ghi gì để được tô màu đúng?", o: ["Số dòng", "Tên ngôn ngữ (php, sql, bash) sau ba dấu huyền", "Tên tệp", "Không cần gì"], a: 1, why: "```php, ```sql… cho trình kết xuất biết cách tô màu." },
    { kind: "multi", q: "README tốt nên có những mục nào?", o: ["Mô tả & tính năng", "Yêu cầu & cài đặt", "Giấy phép", "Toàn bộ mã nguồn dán vào"], a: [0, 1, 2], why: "README mô tả và chỉ đường, không chép lại mã." },
    { q: "Vì sao README nên liên kết tới DEPLOY.md thay vì chép nội dung vào?", o: ["Cho ngắn", "Một sự thật một nơi; chép lại dễ gây tài liệu lệch khi sửa một chỗ quên chỗ kia", "GitHub yêu cầu", "Để nhanh hơn"], a: 1, why: "Trùng lặp là nguồn gốc tài liệu sai." },
    { q: "Thuộc tính alt của ảnh trong Markdown (![alt](...)) để làm gì?", o: ["Cho đẹp", "Mô tả ảnh: cho trình đọc màn hình và hiện khi ảnh hỏng", "Đặt tên tệp", "Không tác dụng"], a: 1, why: "Khả năng tiếp cận và dự phòng khi ảnh không tải được." },
    { kind: "blank", q: "Điền cú pháp Markdown tạo checklist chưa đánh dấu.", code: "___ Chạy schema.sql trên CSDL trống", a: "- [ ]", why: "- [ ] là ô chưa tick; - [x] là đã tick (GitHub Flavored)." },
    { q: "Dấu hiệu tốt nhất cho thấy hướng dẫn cài đặt đủ là gì?", o: ["Dài", "Một người chưa từng thấy dự án làm theo được mà không kẹt", "Có nhiều lệnh", "Có ảnh đẹp"], a: 1, why: "Chỗ người lạ kẹt chính là chỗ tài liệu thiếu." },
    { q: "Vì sao nên coi tài liệu là một phần của 'xong'?", o: ["Để nhiều chữ hơn", "Tính năng không ai hiểu/dùng được thì chưa thực sự hoàn thành", "GitHub tính điểm", "Cho đẹp kho mã"], a: 1, why: "Tài liệu sống cùng mã; đổi hành vi phải đổi tài liệu." },
  ],
};
