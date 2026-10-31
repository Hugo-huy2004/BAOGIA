export default {
  id: "step26",
  lang: "md",
  file: "nhip/README.md",
  duration: "240 phút",
  summary: "Dự án hoàn tất: biến bản mẫu Nhịp thành sản phẩm của riêng bạn với ít nhất 5 tính năng mới và 3 trang liên kết, theo đúng bảng tiêu chí; rồi trình bày, viết tài liệu và bảo vệ để được Hugo Studio công nhận hoàn thành.",
  slides: [
    {
      section: "intro",
      title: "Từ bài học tới sản phẩm của bạn",
      body: `Bạn đã đi hết sáu chặng: từ HTML tĩnh tới một mạng xã hội **an toàn, nhanh, có tài liệu, chạy thật trên Internet**. Nhịp giờ là của bạn để biến thành một sản phẩm mang dấu ấn riêng.

**Dự án hoàn tất** là phần cuối cùng và quan trọng nhất của khoá: bạn tự thêm **ít nhất 5 tính năng mới** và **3 trang liên kết** vào Nhịp, áp dụng mọi thứ đã học — thiết kế CSDL, bảo mật, hiệu năng, MVC, tài liệu.

Đây không phải bài tập chép theo. Đây là lúc chứng minh bạn **tự làm được** một sản phẩm web từ đầu tới cuối.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Hiểu rõ **yêu cầu tối thiểu**: ≥ 5 tính năng mới, ≥ 3 trang liên kết.
2. Chọn tính năng theo giá trị, lập **phạm vi** vừa sức.
3. Áp dụng **mọi chuẩn của khoá** cho mỗi tính năng mới: an toàn, có tài liệu, dễ tiếp cận.
4. Dùng **giao dịch, chỉ mục, kiểm quyền, CSRF** đúng chỗ.
5. **Trình bày** sản phẩm: demo, danh sách tính năng, ảnh.
6. **Bảo vệ** dự án: giải thích được vì sao làm thế, chỉ ra điểm mạnh/hạn chế.`,
    },
    {
      section: "visual",
      title: "Nhịp đã vượt chuẩn ra sao",
      visual: "capstone-map",
      body: `Bản Nhịp bạn dựng qua khoá **đã** có sẵn nhiều thứ vượt khung CRUD cơ bản — dùng chúng làm mẫu tham chiếu cho tính năng/trang của riêng bạn:

**Tính năng** (≥5): theo dõi · thả tim bằng Fetch · trả lời lồng · hashtag · nhắc tên · thông báo · tìm kiếm · thống kê.

**Trang liên kết** (≥3): \`/u/{username}\` (trang cá nhân) · \`/post/{id}\` (chi tiết + trả lời) · \`/tag/{tag}\` (hashtag) · \`/notifications\` · \`/search\` · \`/stats\`.

Dự án hoàn tất là **thêm cái của bạn** vào nền đó — không chỉ đếm cho đủ, mà làm cho Nhịp thành sản phẩm bạn muốn dùng.`,
    },
    {
      section: "visual",
      title: "Vòng đời một tính năng",
      visual: "feature-lifecycle",
      body: `Mỗi tính năng mới đi qua đúng các bước bạn đã học:

1. **Thiết kế dữ liệu** — cần bảng/cột mới nào? Quan hệ gì? (chặng 2)
2. **Model** — hàm SQL có tham số hoá, trong \`src/\`. (chặng 2–3)
3. **Controller + tuyến** — đọc yêu cầu, kiểm quyền. (chặng 5)
4. **View** — HTML dễ tiếp cận, escape đầu ra. (chặng 1, 4)
5. **Bảo mật** — CSRF cho POST, kiểm đầu vào, STRIDE. (chặng 4)
6. **Tài liệu** — thêm vào README, cập nhật SECURITY.md. (chặng 6)

Bỏ bước nào là nợ kỹ thuật. Làm đủ sáu bước cho **một** tính năng tốt hơn làm dở năm tính năng.`,
    },
    {
      section: "research",
      title: "Dự án hoàn tất trong giáo dục",
      body: `**Dự án hoàn tất** (capstone) là hình thức đánh giá tổng hợp được dùng rộng rãi trong giáo dục kỹ thuật: thay vì kiểm tra từng mảnh kiến thức rời, người học **tích hợp** mọi thứ đã học vào một sản phẩm thật. CS50 của Harvard kết thúc bằng một *final project* do sinh viên tự chọn và tự xây — đúng tinh thần này.

Giá trị của capstone nằm ở ba chữ: **integration** (ghép mọi kỹ năng), **ownership** (tự quyết, tự chịu trách nhiệm), và **demonstration** (chứng minh năng lực qua sản phẩm, không qua lý thuyết).

> Malan, D.J. (2025) *CS50 Final Project*. Harvard University. Available at: https://cs50.harvard.edu/x/project/
>
> Association for Computing Machinery and IEEE-CS (2023) *Computer Science Curricula 2023 (CS2023)*. New York: ACM.`,
    },
    {
      section: "research",
      title: "Phạm vi và chất lượng",
      body: `Kinh nghiệm phổ biến trong công nghiệp phần mềm: **phạm vi phình to** (scope creep) giết chết dự án nhiều hơn là thiếu tính năng. Chọn **ít** tính năng nhưng làm **đến nơi** (an toàn, có tài liệu, chạy đúng) hơn là nhiều tính năng dở dang.

Nguyên tắc **MVP** (Minimum Viable Product): làm phiên bản nhỏ nhất **thực sự dùng được** trước, rồi mới thêm. Với dự án hoàn tất: đạt đủ 5 tính năng + 3 trang ở mức **chạy đúng và an toàn** trước, trau chuốt sau nếu còn thời gian.

> Blank, S. (2013) 'Why the Lean Start-Up Changes Everything', *Harvard Business Review*, 91(5), pp. 63–72.`,
    },
    {
      section: "ideate",
      title: "Chọn tính năng của bạn",
      body: `Gợi ý tính năng mới để thêm vào Nhịp (chọn ≥5, hoặc nghĩ của riêng bạn):

| Tính năng | Đụng tới |
|---|---|
| Chỉnh sửa / xoá bình luận | CRUD, kiểm quyền |
| Lưu bài (bookmark) | bảng nối nhiều–nhiều |
| Danh sách người theo dõi / đang theo dõi | truy vấn, phân trang |
| Gợi ý "người bạn có thể biết" | đồ thị theo dõi 2 bước |
| Chế độ tối (dark mode) | CSS biến, lưu localStorage |
| Báo cáo bài vi phạm | bảng mới, quyền kiểm duyệt |
| Trang khám phá hashtag thịnh hành | GROUP BY, ORDER BY COUNT |
| Thống kê cá nhân (bài, tim nhận được) | truy vấn tổng hợp |

Mỗi tính năng phải **thật sự hoạt động**, không phải nút bấm trống.`,
    },
    {
      section: "ideate",
      title: "Lập phạm vi 100%",
      body: `Trước khi code, viết **bản phạm vi** (một tệp \`SCOPE.md\` hoặc mục trong README):

- Danh sách **đúng** các tính năng sẽ làm (không mơ hồ "và nhiều hơn nữa").
- Mỗi tính năng: cần bảng/cột gì, tuyến nào, ai được dùng.
- Ba trang liên kết: địa chỉ và việc của chúng.
- **Ngoài phạm vi**: ghi rõ cái KHÔNG làm, để khỏi phình.

Chốt phạm vi rồi mới bắt đầu. Đổi phạm vi giữa chừng là được, nhưng phải **có ý thức** — cập nhật bản phạm vi, không trôi vô định.`,
    },
    {
      section: "core",
      title: "Thêm một tính năng đúng cách",
      body: `Ví dụ "lưu bài" (bookmark) — đi đủ sáu bước:

1. **Dữ liệu**: bảng nối \`bookmarks(user_id, post_id)\`, khoá chính kép (như \`likes\`).
2. **Model** (\`src/bookmarks.php\`): \`toggle_bookmark\`, \`bookmarked_posts\` — prepared statement.
3. **Tuyến**: \`POST /bookmark\`, \`GET /saved\`.
4. **View**: nút lưu trong thẻ bài, trang \`/saved\`.
5. **Bảo mật**: nút trong \`<form>\` có \`csrf_field()\`; \`require_login()\`.
6. **Tài liệu**: thêm dòng vào README; nếu nhận dữ liệu mới, thêm vào bảng điểm vào của \`SECURITY.md\`.

Tái dùng mọi mẫu đã có: bookmark giống hệt "thả tim", trang \`/saved\` giống \`/tag\`. **Không phát minh lại.**`,
    },
    {
      section: "core",
      title: "Mỗi tính năng qua được STRIDE",
      body: `Với **mỗi** tính năng mới, hỏi lại sáu câu STRIDE (step 16):

- Có điểm vào mới nào? → thêm vào bảng \`SECURITY.md\`.
- Nhận dữ liệu từ người dùng? → kiểm/thoát (SQL tham số hoá, \`e()\`).
- Thao tác ghi? → POST + CSRF + kiểm quyền sở hữu.
- Hiển thị nội dung người dùng? → \`e()\` / \`render_body\`.
- Tải tệp? → kiểm nội dung + GD + đổi tên (step 14, 18).

Một tính năng "chạy được" nhưng mở lỗ hổng là **chưa xong**. Chuẩn bảo mật của chặng 4 áp cho mọi thứ bạn thêm.`,
    },
    {
      section: "core",
      title: "Giữ chất lượng khi lớn lên",
      body: `Dự án lớn dần, giữ ba thói quen:

- **Nhất quán**: tính năng mới viết cùng phong cách (PSR-12, tên hàm, cấu trúc tệp) như phần cũ — mã đọc như một người viết.
- **Tái dùng**: thấy mình chép một đoạn lần thứ hai → tách thành hàm dùng chung.
- **Đo trước khi tối ưu**: tính năng chậm thì \`EXPLAIN\` rồi mới thêm chỉ mục (step 21), đừng đoán.

Và dùng **Git** (step 20): mỗi tính năng một loạt commit có thông điệp rõ. Lịch sử commit chính là câu chuyện bạn kể khi bảo vệ dự án.`,
    },
    {
      section: "core",
      title: "Trình bày sản phẩm",
      body: `Khi xong, chuẩn bị **phần trình bày** (demo 3–5 phút):

1. **Một câu** Nhịp của bạn là gì, khác bản gốc chỗ nào.
2. **Demo trực tiếp** trên bản đã deploy: đi qua 5 tính năng mới và 3 trang.
3. **Điểm bạn tự hào**: một quyết định thiết kế hay, một lỗ hổng bạn vá.
4. **Hạn chế & hướng phát triển**: cái gì chưa làm, sẽ làm gì tiếp.

README là "trình bày tĩnh" của sản phẩm (step 25); demo là "trình bày động". Cả hai cùng kể một câu chuyện: *tôi đã xây cái này, và tôi hiểu nó.*`,
    },
    {
      section: "core",
      title: "Bảo vệ dự án",
      body: `"Bảo vệ" nghĩa là **giải thích được lựa chọn của mình**, không phải phòng thủ. Chuẩn bị trả lời:

- *Vì sao dùng bảng nối cho tính năng X?* → nhiều–nhiều (step 9).
- *Chỗ này chống XSS thế nào?* → thoát đầu ra, CSP (step 17).
- *Nếu có 100.000 người dùng thì sao?* → chỉ mục, phân trang keyset, giới hạn N+1 (step 21).
- *Lỡ ai đó sửa bài người khác?* → kiểm quyền trong SQL (step 13).

Trả lời được những câu này nghĩa là bạn **thật sự hiểu** chứ không chép. Đó là điều Hugo Studio công nhận ở bạn.`,
    },
    {
      section: "core",
      title: "Bảng tiêu chí chấm",
      body: `Dự án hoàn tất đạt khi:

| Tiêu chí | Yêu cầu |
|---|---|
| **Tính năng** | ≥ 5 tính năng mới, **thật sự hoạt động** |
| **Trang** | ≥ 3 trang có địa chỉ riêng, liên kết với nhau |
| **An toàn** | Mọi điểm vào kiểm đầu vào; POST có CSRF; không lỗ hổng SQLi/XSS |
| **Chất lượng** | MVC gọn, prepared statement, không lỗi N+1 rõ ràng |
| **Tiếp cận** | Lighthouse Accessibility ≥ 90 |
| **Tài liệu** | README + DEPLOY + SECURITY cập nhật; cài theo README được |
| **Triển khai** | Chạy thật trên Internet qua HTTPS |
| **Hiểu** | Bảo vệ được mọi quyết định thiết kế |`,
    },
    {
      section: "apply",
      title: "Cập nhật README cho dự án của bạn",
      body: "Mục Tính năng của README phải phản ánh đúng những gì BẠN đã thêm. Đây là nơi người chấm nhìn đầu tiên để thấy bạn đạt ≥5 tính năng, ≥3 trang.",
      code: { file: "nhip/README.md", lang: "md", content: `## Tính năng

- Tài khoản: đăng ký, đăng nhập (tên hoặc email), mật khẩu băm bcrypt.
- Bài đăng: tạo / sửa / xoá có kiểm quyền sở hữu.
- Tương tác: thả tim không tải lại trang (Fetch), trả lời lồng nhiều tầng.
- Mạng lưới: trang cá nhân, ảnh đại diện, theo dõi, bảng tin "Đang theo dõi".
- Khám phá: tìm kiếm, hashtag \`#chủ-đề\`, nhắc tên \`@người\`.
- Thông báo: reply / like / follow / mention, huy hiệu chưa đọc.
- Bảo mật: chống SQL Injection, XSS, CSRF; CSP; giới hạn tần suất; nhật ký.
- Vận hành: thống kê sản phẩm (\`/stats\`), phân trang keyset.

## Yêu cầu` },
    },
    {
      section: "apply",
      title: "Danh sách việc làm dự án",
      body: `Theo thứ tự:

1. Viết \`SCOPE.md\`: liệt kê đúng 5 tính năng + 3 trang sẽ làm, và cái ngoài phạm vi.
2. Với mỗi tính năng: thiết kế dữ liệu → Model → tuyến+controller → view → bảo mật → tài liệu.
3. Chạy \`EXPLAIN\` cho truy vấn mới nặng; thêm chỉ mục nếu cần.
4. Chạy Lighthouse, sửa về Accessibility ≥ 90.
5. Tự tấn công thử (SQLi, XSS, CSRF, IDOR) mọi điểm vào mới.
6. Cập nhật README, DEPLOY.md, SECURITY.md.
7. Deploy lên hosting, kiểm theo danh sách sau triển khai (step 24).
8. Chuẩn bị demo + câu trả lời bảo vệ.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu dự án hoàn tất",
      body: `**Mã nguồn bản hoàn chỉnh:** [tải nhip-hoan-chinh.zip](/downloads/coding/nhip-hoan-chinh.zip) — giải nén để đối chiếu với bài của bạn (code và giáo trình đồng bộ).\n\n- [ ] ≥ 5 tính năng mới, mỗi tính năng hoạt động thật.
- [ ] ≥ 3 trang có địa chỉ riêng, liên kết nhau.
- [ ] Mọi tính năng mới: kiểm đầu vào, POST có CSRF, kiểm quyền; không lỗ hổng.
- [ ] Không lỗi N+1 rõ ràng; truy vấn nặng có chỉ mục.
- [ ] Lighthouse Accessibility ≥ 90.
- [ ] README/DEPLOY/SECURITY cập nhật; cài theo README được.
- [ ] Chạy thật trên Internet qua HTTPS.
- [ ] Bảo vệ được mọi quyết định thiết kế.

Đạt đủ → **4.000 JOY** và được Hugo Studio công nhận hoàn thành khoá. Bạn đã trở thành người tự xây được một sản phẩm web hoàn chỉnh.`,
    },
    {
      section: "apply",
      title: "Lời kết",
      body: `Nhìn lại: bạn khởi đầu từ một trang HTML tĩnh và kết thúc với một mạng xã hội thật — biết thiết kế cơ sở dữ liệu, viết PHP an toàn, chống những lỗ hổng phổ biến nhất, tối ưu hiệu năng, tổ chức mã sạch, và đưa sản phẩm ra thế giới.

Quan trọng hơn mọi dòng mã: bạn học được **cách tư duy** của một lập trình viên — đo trước khi tối ưu, không tin dữ liệu người dùng, tài liệu là một phần của xong, và luôn hỏi "điều gì có thể hỏng?".

Nhịp chỉ là khởi đầu. Mọi ứng dụng web bạn gặp sau này đều xây trên cùng những nguyên lý ấy. Chúc mừng bạn đã hoàn thành khoá Coding — **Độc quyền bởi Hugo Studio**.`,
    },
  ],
  quiz: [
    { q: "Dự án hoàn tất yêu cầu tối thiểu bao nhiêu tính năng mới và trang liên kết?", o: ["3 tính năng, 5 trang", "5 tính năng, 3 trang", "1 tính năng, 1 trang", "10 tính năng, 10 trang"], a: 1, why: "≥ 5 tính năng mới và ≥ 3 trang liên kết, tất cả thật sự hoạt động." },
    { kind: "truefalse", q: "Làm nhiều tính năng dở dang tốt hơn ít tính năng làm đến nơi.", a: false, why: "Phạm vi phình to giết dự án; ít mà chất, an toàn và có tài liệu." },
    { q: "Thêm tính năng 'lưu bài' nên lưu dữ liệu thế nào?", o: ["Một cột chuỗi trong posts", "Bảng nối bookmarks(user_id, post_id) nhiều–nhiều", "Tệp JSON", "Cookie"], a: 1, why: "Giống likes — quan hệ nhiều–nhiều cần bảng nối." },
    { kind: "multi", q: "Mỗi tính năng mới cần làm gì về bảo mật?", o: ["Kiểm đầu vào / tham số hoá SQL", "POST có CSRF", "Kiểm quyền sở hữu", "Bỏ qua vì đã có CSP"], a: [0, 1, 2], why: "CSP là một lớp, không thay được kiểm đầu vào và phân quyền." },
    { q: "Vì sao mỗi tính năng mới phải đi qua STRIDE?", o: ["Cho đủ thủ tục", "Để không bỏ sót điểm vào mới có thể mở lỗ hổng", "MySQL yêu cầu", "Để chậm lại"], a: 1, why: "Tính năng chạy được nhưng mở lỗ hổng là chưa xong." },
    { q: "Truy vấn mới của một tính năng chạy chậm. Làm gì trước?", o: ["Thêm chỉ mục ngay", "Chạy EXPLAIN để hiểu rồi mới quyết", "Viết lại bằng ngôn ngữ khác", "Bỏ tính năng"], a: 1, why: "Đo trước khi tối ưu — đừng đoán (step 21)." },
    { q: "'Bảo vệ dự án' nghĩa là gì?", o: ["Phòng thủ, cãi lại người chấm", "Giải thích được vì sao mình chọn thiết kế đó", "Giấu điểm yếu", "Chỉ nói điểm mạnh"], a: 1, why: "Chứng minh bạn hiểu, kể cả hạn chế của sản phẩm." },
    { kind: "blank", q: "Điền tên tệp nên viết trước khi code để chốt phạm vi dự án.", code: "______ : liệt kê 5 tính năng + 3 trang và cái ngoài phạm vi", a: "SCOPE.md", why: "Chốt phạm vi tránh phình to; đổi thì cập nhật có ý thức." },
    { q: "Điểm Lighthouse Accessibility tối thiểu cho dự án hoàn tất?", o: ["50", "70", "90", "Không cần"], a: 2, why: "≥ 90 — Nhịp gốc đạt 100, giữ chuẩn khi thêm tính năng." },
    { q: "Giá trị cốt lõi của một dự án hoàn tất (capstone) là gì?", o: ["Nhiều dòng mã", "Tích hợp mọi kỹ năng, tự chịu trách nhiệm, chứng minh năng lực qua sản phẩm", "Dùng nhiều thư viện", "Giao diện đẹp nhất"], a: 1, why: "Integration, ownership, demonstration." },
  ],
};
