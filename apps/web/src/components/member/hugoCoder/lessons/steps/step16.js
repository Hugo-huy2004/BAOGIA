export default {
  id: "step16",
  lang: "md",
  file: "nhip/SECURITY.md",
  duration: "120 phút",
  summary: "Nền lý thuyết bảo mật: bộ ba CIA, xác thực – phân quyền – truy vết, nguyên tắc thiết kế an toàn, mô hình mối đe doạ STRIDE, OWASP Top 10:2025 và đạo đức – pháp luật khi kiểm thử. Kết quả: tệp SECURITY.md của Nhịp.",
  slides: [
    {
      section: "intro",
      title: "Nhịp đã chạy — giờ ai sẽ phá nó?",
      body: `Hết chặng 3, Nhịp làm được mọi việc của một mạng xã hội nhỏ. Nhưng "chạy được" chỉ nghĩa là **người dùng tử tế** dùng được. Chặng 4 đổi góc nhìn: bạn đóng vai **kẻ tấn công** với chính sản phẩm của mình, tìm mọi cách làm nó hỏng, rồi vá tận gốc.

Bảo mật không phải một tính năng thêm vào cuối, mà là **một cách suy nghĩ**. Step này chưa viết dòng PHP nào: nó cho bạn bộ khung tư duy và một bản đồ rủi ro của Nhịp — tệp \`SECURITY.md\` mà ba step sau sẽ lần lượt đánh dấu hoàn thành.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `1. Giải thích bộ ba **CIA** và ánh xạ mỗi tài sản của Nhịp vào nó.
2. Phân biệt **xác thực, phân quyền, truy vết** (AAA).
3. Nêu và áp dụng các **nguyên tắc thiết kế an toàn** kinh điển.
4. Lập **mô hình mối đe doạ** bằng STRIDE: tài sản → ranh giới tin cậy → điểm vào → mối đe doạ → biện pháp.
5. Đọc **OWASP Top 10:2025** và chỉ ra mỗi mục ứng với chỗ nào trong Nhịp.
6. Biết ranh giới **đạo đức và pháp luật**: chỉ kiểm thử hệ thống của mình hoặc khi được cho phép bằng văn bản.`,
    },
    {
      section: "visual",
      title: "Bộ ba CIA",
      visual: "cia-triad",
      body: `- **Confidentiality — Bí mật**: chỉ người được phép mới đọc được. *Lộ băm mật khẩu, lộ email* là vi phạm.
- **Integrity — Toàn vẹn**: dữ liệu không bị sửa trái phép. *Người khác sửa bài của Lan* là vi phạm.
- **Availability — Sẵn sàng**: hệ thống dùng được khi cần. *Ai đó gửi một triệu bài làm sập Nhịp* là vi phạm.

Mọi lỗ hổng đều làm hỏng ít nhất một trong ba. Khi đánh giá một lỗi, câu hỏi đầu tiên luôn là: *nó phá chữ nào trong CIA, và phá đến mức nào?*`,
    },
    {
      section: "visual",
      title: "Ranh giới tin cậy của Nhịp",
      visual: "threat-model",
      body: `Sơ đồ luồng dữ liệu (DFD) của Nhịp với các **ranh giới tin cậy** (đường đứt nét):

1. **Trình duyệt ↔ Apache/PHP** — mọi thứ đi qua đây đều do người dùng kiểm soát: tham số, biểu mẫu, cookie, tiêu đề, tệp.
2. **PHP ↔ MySQL** — PHP là bên duy nhất được hỏi cơ sở dữ liệu.
3. **PHP ↔ thư mục tải lên** — nơi duy nhất người dùng gửi được tệp vào máy chủ.

Lỗ hổng gần như luôn nằm **ngay tại ranh giới**: chỗ dữ liệu không tin được bước vào vùng tin được mà không bị kiểm tra.`,
    },
    {
      section: "visual",
      title: "OWASP Top 10:2025",
      image: {
        src: "/image/coding/steps/s16-owasp-2025.webp",
        alt: "Trang OWASP Top 10:2025 liệt kê A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions",
        caption: "top10.owasp.org/2025 — © OWASP Top 10 Team, giấy phép CC BY 3.0. Chụp ngày 27/10/2026.",
      },
      body: "Bản 2025 thay bản 2021. Hai mục mới: **A03 Software Supply Chain Failures** (lỗ hổng từ thư viện, công cụ dựng mã) và **A10 Mishandling of Exceptional Conditions** (xử lý lỗi sai khiến hệ thống \"mở cửa\" khi gặp tình huống bất thường). Injection tụt từ #3 xuống #5, nhưng vẫn có **nhiều CVE nhất** trong mọi nhóm.",
    },
    {
      section: "research",
      title: "Nguyên tắc của Saltzer và Schroeder",
      body: `Năm 1975, Saltzer và Schroeder (MIT) công bố tám nguyên tắc thiết kế hệ thống bảo vệ thông tin — đến nay vẫn là nền của mọi giáo trình bảo mật. Năm nguyên tắc Nhịp dùng trực tiếp:

- **Economy of mechanism** — cơ chế càng đơn giản càng dễ kiểm chứng: một hàm \`e()\`, một hàm \`require_login()\`.
- **Fail-safe defaults** — mặc định là **từ chối**: \`$tab\` không hợp lệ thì về "Mới nhất"; \`action\` lạ thì không làm gì nguy hiểm.
- **Complete mediation** — kiểm quyền ở **mọi** lần truy cập, không chỉ lần đầu.
- **Least privilege** — mỗi phần chỉ có đúng quyền nó cần (tài khoản MySQL riêng ở step 24).
- **Open design** — an toàn không dựa vào việc giấu mã; giả định kẻ tấn công đã đọc hết mã nguồn.

> Saltzer, J.H. and Schroeder, M.D. (1975) 'The protection of information in computer systems', *Proceedings of the IEEE*, 63(9), pp. 1278–1308. doi:10.1109/PROC.1975.9939`,
    },
    {
      section: "research",
      title: "Mô hình hoá mối đe doạ",
      body: `Shostack (Microsoft) hệ thống hoá việc lập mô hình mối đe doạ quanh **bốn câu hỏi**: *Ta đang xây gì? Điều gì có thể hỏng? Ta sẽ làm gì với nó? Ta đã làm đủ tốt chưa?* — và phổ biến bộ khung **STRIDE** để trả lời câu thứ hai một cách có hệ thống.

OWASP Top 10:2025 cho biết trong dữ liệu kiểm thử, **100%** ứng dụng có ít nhất một dạng lỗi phân quyền (A01) và **100%** được kiểm tra Injection (A05); riêng XSS đã có hơn 30 nghìn CVE, SQL Injection hơn 14 nghìn.

> Shostack, A. (2014) *Threat Modeling: Designing for Security*. Indianapolis: Wiley.
>
> OWASP Foundation (2025) *OWASP Top 10:2025*. Available at: https://top10.owasp.org/2025/`,
    },
    {
      section: "research",
      title: "Đạo đức và pháp luật",
      body: `Kỹ thuật trong chặng này là **hai lưỡi**: cùng một chuỗi \`' OR 1=1 --\` dùng để kiểm thử hệ thống của mình hay để xâm nhập hệ thống người khác. Ranh giới là **sự cho phép**.

- Chỉ tấn công thử **Nhịp trên localhost của bạn**, hoặc hệ thống bạn được chủ sở hữu cho phép **bằng văn bản**.
- Tại Việt Nam, xâm nhập trái phép vào mạng máy tính, phương tiện điện tử của người khác là **tội phạm** theo Bộ luật Hình sự 2015 (sửa đổi 2017), và Luật An ninh mạng 2018 nghiêm cấm các hành vi tấn công mạng.
- Phát hiện lỗ hổng ở sản phẩm người khác: báo riêng cho họ (**công bố có trách nhiệm**), không khai thác, không công khai trước khi được vá.

> Quốc hội (2017) *Bộ luật Hình sự số 100/2015/QH13, sửa đổi bổ sung bởi Luật số 12/2017/QH14*. Hà Nội.
>
> Quốc hội (2018) *Luật An ninh mạng số 24/2018/QH14*. Hà Nội.`,
    },
    {
      section: "ideate",
      title: "Bốn câu hỏi cho Nhịp",
      body: `1. **Ta đang xây gì?** Một ứng dụng PHP + MySQL: người dùng đăng ký, đăng bài, sửa/xoá bài của mình, thả tim, trả lời, theo dõi, tải ảnh đại diện, tìm kiếm.
2. **Điều gì có thể hỏng?** Duyệt từng **điểm vào** (12 tệp PHP nhận dữ liệu) qua sáu chữ của STRIDE.
3. **Ta sẽ làm gì?** Mỗi mối đe doạ ghi biện pháp và step thực hiện.
4. **Đã đủ tốt chưa?** Cuối step 19, đi lại từng dòng của bảng, tấn công thử lần nữa.

Kết quả của bốn câu hỏi là \`SECURITY.md\` — một **tài liệu sống**: thêm tính năng mới là thêm dòng vào bảng điểm vào.`,
    },
    {
      section: "core",
      title: "Xác thực, phân quyền, truy vết",
      body: `| | Câu hỏi | Nhịp làm ở đâu |
|---|---|---|
| **Authentication** — xác thực | Bạn là ai? | \`login.php\`, \`password_verify\`, phiên (step 12) |
| **Authorization** — phân quyền | Bạn được làm gì? | \`require_login()\`, \`AND user_id = ?\` (step 13) |
| **Accounting** — truy vết | Ai đã làm gì, khi nào? | Nhật ký thao tác (step 19) |

Nhầm lẫn kinh điển: *"đã đăng nhập rồi thì được làm"*. Đăng nhập chỉ trả lời câu thứ nhất. Lan đã đăng nhập vẫn **không** được xoá bài của Minh — đó là câu thứ hai, phải hỏi riêng ở **mọi** thao tác ghi.

Trong OWASP Top 10:2025, lỗi câu thứ nhất là **A07 Authentication Failures**, lỗi câu thứ hai là **A01 Broken Access Control**, thiếu câu thứ ba là **A09 Security Logging and Alerting Failures**.`,
    },
    {
      section: "core",
      title: "STRIDE: sáu kiểu mối đe doạ",
      body: `| Chữ | Mối đe doạ | Vi phạm | Ví dụ trên Nhịp |
|---|---|---|---|
| **S** | Spoofing — mạo danh | Xác thực | Trộm cookie phiên, dò mật khẩu |
| **T** | Tampering — sửa trái phép | Toàn vẹn | Đổi \`id\` để sửa bài người khác; SQL Injection |
| **R** | Repudiation — chối bỏ | Truy vết | "Tôi không xoá bài đó" — không có nhật ký để đối chứng |
| **I** | Information disclosure — lộ thông tin | Bí mật | Trang lỗi in đường dẫn và tên tài khoản cơ sở dữ liệu |
| **D** | Denial of service — từ chối dịch vụ | Sẵn sàng | Gửi hàng nghìn bài mỗi giây |
| **E** | Elevation of privilege — leo quyền | Phân quyền | Tệp \`.php\` tải lên rồi chạy được |

Cách dùng: với **mỗi điểm vào**, hỏi lần lượt sáu câu "S có thể xảy ra ở đây không? T thì sao?…". Cách này máy móc có chủ đích — để không bỏ sót.`,
    },
    {
      section: "core",
      title: "Bề mặt tấn công của Nhịp",
      body: `Bề mặt tấn công = **mọi chỗ dữ liệu từ bên ngoài đi vào**. Với Nhịp:

- **12 tệp PHP** nhận \`$_GET\`/\`$_POST\` (liệt kê trong \`SECURITY.md\`).
- **1 chỗ nhận tệp**: \`settings.php\`.
- **Cookie** \`nhip_session\`.
- **Tiêu đề HTTP**: \`Accept\` (đọc ở \`like.php\`), \`User-Agent\`, \`Referer\`…
- **phpMyAdmin** trên localhost — đừng bao giờ để nó công khai trên hosting thật.

Mỗi tính năng thêm vào là bề mặt rộng thêm. Nguyên tắc *economy of mechanism* gợi ý: tính năng không cần thì **đừng làm**, điểm vào không dùng thì **xoá** (như \`hello.php\` từ step 7 — đã đến lúc xoá nó).`,
    },
    {
      section: "core",
      title: "Rủi ro = khả năng × tác động",
      body: `Không thể vá mọi thứ cùng lúc. Xếp hạng bằng hai trục:

| | Tác động thấp | Tác động cao |
|---|---|---|
| **Dễ khai thác** | Spam bài | **SQL Injection, XSS lưu trữ, sửa bài người khác** |
| **Khó khai thác** | Đoán được id bài tiếp theo | Đánh cắp phiên qua mạng không mã hoá |

Ô góc trên phải là ưu tiên số 1 — chính là nội dung step 17. Bảng của OWASP cũng theo logic này: mỗi mục có *Avg Weighted Exploit* (độ dễ) và *Avg Weighted Impact* (mức hại).

Ghi điểm rủi ro vào \`SECURITY.md\` giúp cả nhóm thống nhất **làm gì trước**, thay vì vá theo cảm tính.`,
    },
    {
      section: "core",
      title: "Phòng thủ nhiều lớp",
      body: `Không lớp nào hoàn hảo, nên Nhịp xếp nhiều lớp **độc lập** cho cùng một mối đe doạ. Ví dụ với *tệp độc hại tải lên*:

1. \`accept\` trên ô chọn tệp — giúp người dùng tử tế.
2. Giới hạn 2 MB.
3. \`finfo\` + \`getimagesize\` đọc **nội dung**.
4. Tên ngẫu nhiên do máy chủ sinh, đuôi lấy từ danh sách cho phép.
5. \`.htaccess\` cấm chạy \`.php\` trong \`uploads/\`.
6. (Step 18) Vẽ lại ảnh bằng GD để loại mọi dữ liệu thừa giấu trong tệp.

Kẻ tấn công phải xuyên qua **tất cả**; ta chỉ cần **một** lớp giữ được. Chú ý lớp 1 không phải bảo mật — lớp nào chạy trên máy khách đều chỉ là tiện ích.`,
    },
    {
      section: "core",
      title: "Nhịp đang lộ gì?",
      body: `Gõ \`curl -I http://localhost/nhip/index.php\` (hoặc DevTools → Network → bấm yêu cầu → *Headers*):

~~~text
HTTP/1.1 200 OK
X-Powered-By: PHP/8.2.4
Set-Cookie: nhip_session=kb5gvl…; path=/; HttpOnly; SameSite=Lax
Cache-Control: no-store, no-cache, must-revalidate
Content-type: text/html; charset=UTF-8
~~~

Đọc như kẻ tấn công:

- \`X-Powered-By: PHP/8.2.4\` — nói thẳng phiên bản PHP, giúp tra lỗ hổng đã biết của đúng bản đó (*Information disclosure*).
- Không có \`Content-Security-Policy\`, \`X-Content-Type-Options\`, \`Referrer-Policy\` — các lớp phòng thủ trình duyệt đang bị bỏ trống.
- Cookie đã có \`HttpOnly\`, \`SameSite\` (step 12) — tốt.

Step 18 thêm tiêu đề bảo mật; step 24 tắt \`X-Powered-By\` trên hosting (\`expose_php = Off\`).`,
    },
    {
      section: "core",
      title: "OWASP Top 10:2025 trong Nhịp",
      body: `| Mục | Ở Nhịp | Xử lý |
|---|---|---|
| A01 Broken Access Control | Sửa/xoá bài người khác, CSRF | Step 13, 18 |
| A02 Security Misconfiguration | \`debug = true\` trên hosting, lộ \`X-Powered-By\` | Step 19, 24 |
| A03 Software Supply Chain | Thư viện tải từ nguồn lạ | Nhịp không dùng thư viện ngoài; step 20 bàn về Composer |
| A04 Cryptographic Failures | Lưu mật khẩu bằng md5, không HTTPS | Step 12, 24 |
| A05 Injection | SQL Injection, XSS | **Step 17** |
| A06 Insecure Design | Không giới hạn tần suất đăng nhập | Step 19 |
| A07 Authentication Failures | Không đổi mã phiên, báo lỗi lộ tài khoản | Step 12, 18 |
| A08 Data Integrity Failures | Tệp tải lên giả dạng ảnh | Step 14, 18 |
| A09 Logging & Alerting Failures | Không biết ai xoá gì | Step 19 |
| A10 Exceptional Conditions | Lỗi PDO lộ chi tiết, lỗi giữa chừng để dữ liệu dở dang | Step 11, 19 |`,
    },
    {
      section: "apply",
      title: "SECURITY.md",
      body: "Tạo `nhip/SECURITY.md`. Markdown là định dạng tài liệu mặc định của mọi kho mã; GitHub còn tự hiện tệp `SECURITY.md` ở tab *Security* của dự án.",
      code: { file: "nhip/SECURITY.md", lang: "md", content: `# Mô hình mối đe doạ của Nhịp

Phiên bản: chặng 4, step 16. Cập nhật mỗi khi thêm tính năng có nhận dữ liệu từ người dùng.

## 1. Tài sản cần bảo vệ

| Tài sản | Vì sao quý | Thuộc tính cần giữ (CIA) |
|---|---|---|
| Băm mật khẩu (\`users.password_hash\`) | Lộ ra là bị dò mật khẩu ngoại tuyến | Bí mật |
| Email người dùng | Thông tin cá nhân | Bí mật |
| Mã phiên (cookie \`nhip_session\`) | Cầm được là mạo danh được | Bí mật, toàn vẹn |
| Bài đăng, tim, quan hệ theo dõi | Nội dung và danh tiếng của người dùng | Toàn vẹn, sẵn sàng |
| Ảnh đại diện tải lên | Có thể bị lợi dụng để chạy mã | Toàn vẹn |
| \`includes/config.php\` | Chứa tài khoản cơ sở dữ liệu | Bí mật |

## 2. Ranh giới tin cậy

1. Trình duyệt ↔ Apache: mọi thứ đi qua đây là **không tin được** (\`$_GET\`, \`$_POST\`, \`$_FILES\`, \`$_COOKIE\`, tiêu đề HTTP).
2. PHP ↔ MySQL: chỉ PHP được nói chuyện với MySQL, và chỉ qua prepared statement.
3. PHP ↔ hệ thống tệp: chỉ \`uploads/avatars/\` được ghi.

## 3. Điểm vào (bề mặt tấn công)

| Điểm vào | Phương thức | Dữ liệu nhận | Cần đăng nhập |
|---|---|---|---|
| \`register.php\` | POST | username, display_name, email, password | Không |
| \`login.php\` | POST | login, password | Không |
| \`logout.php\` | POST | — | Có |
| \`index.php\` | GET, POST | tab, body | POST: có |
| \`post.php\` | GET, POST | id, body | POST: có |
| \`edit.php\` | GET, POST | id, body | Có, đúng chủ bài |
| \`delete.php\` | POST | id | Có, đúng chủ bài |
| \`like.php\` | POST | post_id | Có |
| \`follow.php\` | POST | user_id, action | Có |
| \`settings.php\` | POST | display_name, bio, avatar (tệp) | Có |
| \`profile.php\` | GET | u | Không |
| \`search.php\` | GET | q | Không |

## 4. STRIDE

| Mối đe doạ | Ví dụ trên Nhịp | Biện pháp | Step |
|---|---|---|---|
| **S**poofing — mạo danh | Đánh cắp cookie phiên, dò mật khẩu | HttpOnly, đổi mã phiên, băm bcrypt, giới hạn số lần đăng nhập | 12, 18, 19 |
| **T**ampering — sửa trái phép | Sửa \`id\` để sửa bài người khác; SQL Injection | Kiểm chủ sở hữu trong SQL, prepared statement | 13, 17 |
| **R**epudiation — chối bỏ | "Tôi không xoá bài đó" | Nhật ký thao tác | 19 |
| **I**nformation disclosure — lộ thông tin | Trang lỗi lộ đường dẫn, tệp cấu hình đọc được | \`debug = false\`, chặn thư mục nhạy cảm | 19, 24 |
| **D**enial of service — từ chối dịch vụ | Gửi hàng nghìn bài/giây, tải tệp khổng lồ | Giới hạn tần suất, giới hạn dung lượng | 14, 19 |
| **E**levation of privilege — leo quyền | Tệp \`.php\` tải lên rồi chạy; XSS chiếm phiên quản trị | Kiểm nội dung tệp, \`.htaccess\`, \`e()\`, CSP | 14, 17, 18 |

## 5. Rủi ro còn mở (cần xử lý ở chặng 4)

- [ ] Biểu mẫu POST chưa có mã chống CSRF (step 18).
- [ ] Chưa có tiêu đề bảo mật (CSP, X-Content-Type-Options…) (step 18).
- [ ] Đăng nhập chưa giới hạn số lần thử (step 19).
- [ ] Chưa có nhật ký thao tác nhạy cảm (step 19).
- [ ] Lỗi PHP hiện chi tiết ra trình duyệt khi \`debug = true\` (step 19).

## 6. Báo cáo lỗ hổng

Phát hiện lỗ hổng trong Nhịp? Gửi mô tả và các bước tái hiện cho người phụ trách dự án. Không thử tấn công tài khoản hay dữ liệu của người khác.` },
    },
    {
      section: "apply",
      title: "Bài tập: tự hoàn thiện mô hình",
      body: `Mở rộng \`SECURITY.md\` của bạn:

1. Chọn **hai** điểm vào bất kỳ (gợi ý: \`follow.php\`, \`search.php\`) và đi qua đủ sáu chữ STRIDE. Ghi cả những chữ bạn kết luận "không áp dụng" kèm lý do.
2. Với \`profile.php?u=\`: kẻ tấn công có liệt kê được **toàn bộ** tên người dùng không? Có sao không? (Gợi ý: tên người dùng vốn công khai; còn email thì sao?)
3. Ghi điểm rủi ro (khả năng 1–3 × tác động 1–3) cho mỗi dòng của bảng STRIDE và sắp xếp lại theo điểm.
4. Xoá \`hello.php\` — một điểm vào không còn dùng.`,
    },
    {
      section: "apply",
      title: "Chuẩn bị cho step 17",
      body: `Step sau bạn sẽ **cố tình** viết mã có lỗ hổng để tấn công thử. Chuẩn bị:

- Sao lưu cơ sở dữ liệu: phpMyAdmin → \`nhip\` → **Xuất** → *Nhanh*, định dạng SQL → **Xuất**. Lưu tệp \`nhip.sql\` ngoài thư mục dự án.
- Đảm bảo XAMPP **không** mở ra mạng ngoài (tường lửa chỉ cho *Private networks*, step 7).
- Tạo thư mục \`nhip/lab/\` — mọi mã cố tình lỗi chỉ nằm trong đó và bị **xoá** khi xong bài.

Quy tắc của phòng thí nghiệm: mã lỗi không bao giờ được chép sang mã thật, và không bao giờ đưa lên hosting.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 16",
      body: `- [ ] Giải thích được C, I, A bằng ví dụ của Nhịp.
- [ ] Phân biệt xác thực / phân quyền / truy vết và chỉ ra chỗ tương ứng trong mã.
- [ ] \`SECURITY.md\` có đủ: tài sản, ranh giới tin cậy, bảng điểm vào, bảng STRIDE, rủi ro còn mở.
- [ ] Đã STRIDE thêm hai điểm vào và chấm điểm rủi ro.
- [ ] Đọc được tiêu đề phản hồi và chỉ ra thông tin bị lộ.
- [ ] Đã sao lưu cơ sở dữ liệu và tạo thư mục \`lab/\`.
- [ ] Hiểu rõ: chỉ kiểm thử hệ thống của mình hoặc khi được phép bằng văn bản.`,
    },
  ],
  quiz: [
    { q: "Người khác sửa được bài của Lan vi phạm thuộc tính nào trong CIA?", o: ["Confidentiality", "Integrity", "Availability", "Không vi phạm"], a: 1, why: "Dữ liệu bị thay đổi trái phép là vi phạm toàn vẹn." },
    { kind: "multi", q: "STRIDE gồm những mối đe doạ nào?", o: ["Spoofing", "Tampering", "Repudiation", "Encryption"], a: [0, 1, 2], why: "S-T-R-I-D-E: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege." },
    { q: "Lan đã đăng nhập. Vì sao Nhịp vẫn phải kiểm quyền khi Lan xoá một bài?", o: ["Phiên có thể hết hạn", "Xác thực trả lời 'bạn là ai', phân quyền mới trả lời 'bạn được làm gì'", "Cho chậm lại", "Không cần kiểm"], a: 1, why: "Đăng nhập không đồng nghĩa với được làm mọi thứ." },
    { kind: "truefalse", q: "Theo nguyên tắc Open design, an toàn của Nhịp không được dựa vào việc giấu mã nguồn.", a: true, why: "Giả định kẻ tấn công biết hết mã; an toàn phải đến từ thiết kế đúng." },
    { q: "Mục nào đứng #1 trong OWASP Top 10:2025?", o: ["Injection", "Broken Access Control", "Cryptographic Failures", "Security Misconfiguration"], a: 1, why: "A01:2025 Broken Access Control giữ vị trí số 1 như bản 2021." },
    { kind: "output", q: "Tiêu đề phản hồi sau lộ thông tin gì cho kẻ tấn công?", code: "X-Powered-By: PHP/8.2.4", o: ["Mật khẩu cơ sở dữ liệu", "Phiên bản PHP chính xác để tra lỗ hổng đã biết", "Mã phiên", "Không lộ gì"], a: 1, why: "Thuộc nhóm Information disclosure; tắt bằng expose_php = Off." },
    { q: "Ranh giới tin cậy quan trọng nhất của Nhịp nằm ở đâu?", o: ["Giữa hai bảng MySQL", "Giữa trình duyệt và PHP — nơi mọi dữ liệu người dùng đi vào", "Giữa CSS và HTML", "Giữa hai tệp PHP"], a: 1, why: "Mọi thứ từ trình duyệt đều do người dùng kiểm soát." },
    { kind: "order", q: "Sắp xếp bốn câu hỏi lập mô hình mối đe doạ của Shostack.", items: ["Ta đang xây gì?", "Điều gì có thể hỏng?", "Ta sẽ làm gì với nó?", "Ta đã làm đủ tốt chưa?"], a: [0, 1, 2, 3], why: "Mô tả hệ thống → tìm mối đe doạ → chọn biện pháp → kiểm lại." },
    { kind: "blank", q: "Điền nguyên tắc: mặc định là từ chối, chỉ cho phép khi đã kiểm rõ.", code: "Fail-______ defaults", a: "safe", why: "Fail-safe defaults của Saltzer và Schroeder (1975)." },
    { q: "Bạn tìm thấy lỗi SQL Injection trên website của một cửa hàng. Việc đúng là gì?", o: ["Thử lấy dữ liệu để chứng minh", "Đăng công khai lên mạng xã hội", "Báo riêng cho chủ website, không khai thác", "Bán thông tin lỗi"], a: 2, why: "Công bố có trách nhiệm; khai thác hệ thống người khác khi chưa được phép là vi phạm pháp luật." },
  ],
};
