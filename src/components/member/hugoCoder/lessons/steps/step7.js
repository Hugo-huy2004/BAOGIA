export default {
  id: "step7",
  lang: "php",
  file: "nhip/hello.php",
  duration: "120 phút",
  summary: "Cài XAMPP, bật Apache và MySQL, hiểu htdocs và localhost, chạy tệp PHP đầu tiên, làm quen phpMyAdmin và đưa Nhịp vào máy chủ.",
  slides: [
    {
      section: "intro",
      title: "Vì sao Nhịp cần máy chủ",
      body: `Ở chặng 1, mọi bài đăng nằm trong \`localStorage\` của **một** trình duyệt. Bạn đăng bài trên laptop thì điện thoại không thấy; bạn bè không bao giờ thấy.

Một mạng xã hội thật cần một nơi **chung** để giữ dữ liệu và một chương trình **chạy ở nơi chung đó** để nhận bài, kiểm tra, lưu và trả lại cho mọi người. Nơi chung đó là **máy chủ** (server).

Chặng 2 dựng máy chủ ấy ngay trên máy bạn, gọi là **localhost**.`,
    },
    {
      section: "intro",
      title: "Mục tiêu của step",
      body: `Hết step này bạn sẽ:

1. Cài được **XAMPP** và biết bên trong có gì (Apache, MariaDB/MySQL, PHP, phpMyAdmin).
2. Bật/tắt Apache và MySQL, đọc được lỗi khi một dịch vụ không lên.
3. Hiểu **htdocs** và cách một thư mục biến thành một địa chỉ \`http://localhost/...\`.
4. Viết và chạy **tệp PHP đầu tiên**, giải thích vì sao trình duyệt không thấy mã PHP.
5. Mở **phpMyAdmin** và đọc được các thông tin chính trên trang chủ.
6. Chuyển thư mục \`nhip/\` của chặng 1 vào máy chủ.

Thời lượng gợi ý: 120 phút, trong đó 40 phút là cài đặt.`,
    },
    {
      section: "visual",
      title: "Bốn tầng của một trang PHP",
      visual: "lamp-stack",
      body: `Bạn gõ địa chỉ → trình duyệt gửi yêu cầu HTTP tới **Apache** (máy chủ web) → Apache thấy đuôi \`.php\` nên giao tệp cho **PHP** chạy → PHP hỏi **MySQL** lấy dữ liệu khi cần → PHP in ra HTML → Apache gửi HTML về trình duyệt.

Bộ bốn này thường gọi là **LAMP** (Linux, Apache, MySQL, PHP). XAMPP là gói cài sẵn cả bốn cho Windows và macOS — chữ X nghĩa là "chạy trên nhiều hệ điều hành".`,
    },
    {
      section: "visual",
      title: "Bảng điều khiển XAMPP",
      visual: "xampp-panel",
      body: `Sau khi cài, bạn điều khiển máy chủ bằng **XAMPP Control Panel** (Windows) hoặc **manager-osx** (macOS, tab *Manage Servers*). Hai dòng quan trọng:

- **Apache** — máy chủ web, mặc định nghe cổng **80** (và 443 cho HTTPS).
- **MySQL** — thực chất là **MariaDB**, bản phát triển tiếp của MySQL, nghe cổng **3306**.

Dịch vụ bật thành công thì chuyển màu xanh và hiện số PID; không lên được thì đọc ngay khung *Log* ở dưới.`,
    },
    {
      section: "visual",
      title: "Thư mục thành địa chỉ",
      visual: "htdocs-map",
      body: `Apache phục vụ mọi thứ nằm trong thư mục gốc tài liệu (DocumentRoot), với XAMPP là **htdocs**:

| Hệ điều hành | Đường dẫn htdocs |
|---|---|
| Windows | \`C:\\xampp\\htdocs\` |
| macOS | \`/Applications/XAMPP/xamppfiles/htdocs\` |

Tệp \`htdocs/nhip/hello.php\` có địa chỉ \`http://localhost/nhip/hello.php\`. Thư mục nào có \`index.php\` (hoặc \`index.html\`) thì gõ tên thư mục là đủ: \`http://localhost/nhip/\`.`,
    },
    {
      section: "research",
      title: "Mô hình client–server và CGI",
      body: `Từ đầu thập niên 1990, máy chủ web chỉ trả tệp tĩnh. Để trang **thay đổi theo người xem**, người ta cho máy chủ chạy một chương trình và gửi về kết quả của chương trình đó — chuẩn hoá thành **CGI** (Common Gateway Interface, RFC 3875). PHP ra đời năm 1994 chính từ nhu cầu này và ngày nay chạy phía sau phần lớn các website dùng ngôn ngữ phía máy chủ đã biết.

Ý tưởng không đổi: **mã chạy ở máy chủ, chỉ kết quả đi qua mạng.**

> Robinson, D. and Coar, K. (2004) *RFC 3875: The Common Gateway Interface (CGI) Version 1.1*. IETF. Available at: https://www.rfc-editor.org/rfc/rfc3875
>
> The PHP Group (2025) *History of PHP*, PHP Manual. Available at: https://www.php.net/manual/en/history.php.php`,
    },
    {
      section: "research",
      title: "Vì sao học trên localhost trước",
      body: `Các khoá nhập môn lớn như CS50 (Harvard) đều cho người học chạy máy chủ **ngay trên máy mình** trước khi đưa lên Internet. Lý do:

- **Vòng phản hồi ngắn**: sửa tệp, tải lại trang, thấy kết quả trong một giây.
- **An toàn**: lỗi của bạn không lộ ra ngoài, không ai tấn công được máy chủ thử nghiệm.
- **Miễn phí và không cần mạng**.

Chính nhà phát hành XAMPP cũng cảnh báo: cấu hình mặc định *chỉ dành cho phát triển*, không an toàn để mở ra Internet. Bạn sẽ thấy câu này trên trang chào mừng.

> Malan, D.J. (2025) *CS50's Web Programming with Python and JavaScript*. Harvard University. Available at: https://cs50.harvard.edu/web/
>
> Apache Friends (2025) *XAMPP FAQs*. Available at: https://www.apachefriends.org/faq_windows.html`,
    },
    {
      section: "ideate",
      title: "Kế hoạch cho Nhịp",
      body: `Chặng 2 biến Nhịp từ "trang tĩnh + localStorage" thành "trang PHP + cơ sở dữ liệu":

| Step | Nhịp có thêm |
|---|---|
| 7 (bài này) | Máy chủ chạy được, thư mục \`nhip/\` trong htdocs |
| 8 | Trang \`.php\`, phần đầu/chân dùng chung, biểu mẫu đăng bài gửi lên máy chủ |
| 9 | Lược đồ cơ sở dữ liệu \`nhip\` |
| 10 | Truy vấn SQL cho bảng tin và trang cá nhân |
| 11 | PHP đọc/ghi MySQL bằng PDO |

Quy tắc của chặng: **mọi thứ người dùng gửi lên đều được máy chủ kiểm tra lại**, kể cả khi JavaScript đã kiểm rồi.`,
    },
    {
      section: "ideate",
      title: "Chọn bản XAMPP nào",
      body: `- **Windows**: tải bản mới nhất trên trang Apache Friends (năm 2026 là 8.5.x, 8.4.x, 8.3.x — số đầu là phiên bản PHP). Chọn bản **8.4** nếu không có yêu cầu gì khác: đủ mới, đã ổn định.
- **macOS**: Apache Friends đã ngừng ra bản mới cho macOS; bản cuối là **8.2.4** (PHP 8.2), tải ở mục *More Downloads → XAMPP Mac OS X* trên SourceForge. Mọi bài trong khoá này chạy được trên PHP 8.2.
- **Linux**: dùng gói của bản phân phối (\`apache2\`, \`php\`, \`mariadb-server\`, \`phpmyadmin\`).

Thay thế tương đương: **MAMP** (macOS/Windows), **Laragon** (Windows). Tên thư mục gốc có thể khác (\`htdocs\` hoặc \`www\`) nhưng mọi thứ còn lại giống hệt.`,
    },
    {
      section: "core",
      title: "Bước 1 · Tải XAMPP",
      image: {
        src: "/image/coding/steps/s07-xampp-download.webp",
        alt: "Trang Download của Apache Friends liệt kê XAMPP cho Windows các bản 8.5.12, 8.4.27 và 8.3.36 kèm nút Download 64 bit",
        caption: "apachefriends.org/download.html, chụp ngày 27/10/2026. Mỗi dòng là một phiên bản PHP; bấm Download (64 bit).",
      },
      body: `1. Mở **apachefriends.org** → mục **Download**.
2. Chọn đúng hệ điều hành, bấm **Download (64 bit)** ở dòng 8.4.x (khoảng 190 MB).
3. Chỉ tải từ trang chính thức hoặc SourceForge của dự án — bản cài "đóng gói lại" trên trang lạ có thể kèm mã độc.
4. (Nâng cao) So mã **sha1** của tệp tải về với mã trên trang để chắc tệp không bị sửa.`,
    },
    {
      section: "core",
      title: "Bước 2 · Cài đặt",
      body: `**Windows**

1. Chạy tệp \`xampp-windows-x64-...-installer.exe\`. Nếu Windows cảnh báo UAC, bấm *OK*: XAMPP khuyên **không** cài vào \`C:\\Program Files\` vì quyền ghi bị hạn chế.
2. Màn *Select Components*: giữ **Apache, MySQL, PHP, phpMyAdmin**; bỏ chọn FileZilla Server, Mercury, Tomcat, Perl nếu không dùng.
3. Thư mục cài: để mặc định \`C:\\xampp\`.
4. Tường lửa Windows hỏi cho Apache truy cập mạng: chọn **Private networks** (mạng riêng), không chọn Public.

**macOS**

1. Mở tệp \`.dmg\`, kéo **XAMPP** vào *Applications*.
2. Lần đầu mở, macOS có thể chặn vì "không xác minh được nhà phát triển": vào *System Settings → Privacy & Security* → **Open Anyway**.`,
    },
    {
      section: "core",
      title: "Bước 3 · Bật Apache và MySQL",
      body: `- **Windows**: mở *XAMPP Control Panel* → bấm **Start** ở dòng Apache, rồi dòng MySQL. Chữ nền xanh và cột *PID(s)*, *Port(s)* có số là thành công.
- **macOS**: mở \`manager-osx\` → tab **Manage Servers** → chọn *Apache Web Server* → **Start**; làm tương tự với *MySQL Database*. Trạng thái chuyển **Running** với chấm xanh.

Kiểm tra nhanh: mở trình duyệt, gõ \`http://localhost\`. Thấy trang *Welcome to XAMPP* là Apache đã chạy.

Mỗi lần khởi động lại máy, bạn cần bật lại hai dịch vụ này (hoặc tick *Autostart* trong mục *Config* của Control Panel trên Windows).`,
    },
    {
      section: "core",
      title: "Trang chào mừng localhost",
      image: {
        src: "/image/coding/steps/s07-dashboard.webp",
        alt: "Trang Welcome to XAMPP với tiêu đề XAMPP Apache + MariaDB + PHP + Perl và các liên kết FAQs, HOW-TO Guides, PHPInfo, phpMyAdmin",
        caption: "http://localhost/dashboard/ trên máy chạy XAMPP. Dòng thứ hai nhắc: XAMPP chỉ dành cho phát triển.",
      },
      body: `Trang này là \`htdocs/dashboard/index.html\` — chỉ là một tệp trong htdocs như mọi tệp khác. Thanh trên có:

- **PHPInfo**: toàn bộ cấu hình PHP (phiên bản, tiện ích mở rộng, \`php.ini\` đang dùng).
- **phpMyAdmin**: giao diện web quản lý cơ sở dữ liệu.

Khi đưa sản phẩm lên Internet, bạn **không bao giờ** để lộ trang PHPInfo: nó tiết lộ đường dẫn, phiên bản và cấu hình cho kẻ tấn công.`,
    },
    {
      section: "core",
      title: "Khi Apache không chịu chạy",
      body: `Lỗi hay gặp nhất là **cổng đã bị chiếm**. Log báo kiểu \`Port 80 in use by ...\` hoặc *Apache shutdown unexpectedly*.

1. Tìm ai giữ cổng: Windows chạy \`netstat -ano | findstr :80\`; macOS chạy \`sudo lsof -iTCP:80 -sTCP:LISTEN\`.
2. Thường là IIS/World Wide Web Publishing Service, Skype cũ, hoặc một bản Apache khác. Tắt chương trình đó nếu được.
3. Không tắt được thì đổi cổng Apache: Control Panel → Apache → **Config → httpd.conf**, sửa \`Listen 80\` thành \`Listen 8080\`; sửa thêm \`ServerName localhost:8080\`. Từ đó địa chỉ là \`http://localhost:8080/\`.

MySQL không chạy vì cổng **3306** bận thì thường do đã cài một MySQL khác: tắt dịch vụ đó trong *Services* (Windows) hoặc đổi \`port=3306\` trong \`my.ini\`/\`my.cnf\`.`,
    },
    {
      section: "core",
      title: "Tệp PHP đầu tiên",
      body: `Tạo thư mục \`htdocs/nhip/\`, trong đó tạo \`hello.php\`. Những điều cần biết trước khi gõ:

- Mã PHP nằm giữa \`<?php\` và \`?>\`. Phần ngoài cặp thẻ đó được gửi nguyên văn như HTML.
- \`<?= $bien ?>\` là cách viết tắt của \`<?php echo $bien; ?>\` — in giá trị ra trang.
- Mỗi câu lệnh kết thúc bằng dấu \`;\`. Biến luôn bắt đầu bằng \`$\`.
- \`date_default_timezone_set\` đặt múi giờ; thiếu dòng này, giờ in ra có thể là giờ UTC.
- Lưu tệp với mã hoá **UTF-8** (VS Code mặc định đã đúng) để chữ tiếng Việt không vỡ.`,
    },
    {
      section: "core",
      title: "Máy chủ chạy, trình duyệt chỉ thấy kết quả",
      image: {
        src: "/image/coding/steps/s07-hello-source.webp",
        alt: "Cửa sổ xem mã nguồn của hello.php chỉ có HTML: Xin chào, Nhịp! và dòng Máy chủ đang chạy PHP 8.2.4 lúc 08:55, 27/10/2026, không còn thẻ php nào",
        caption: "Chuột phải → Xem nguồn trang (Ctrl/Cmd + U). Mọi thẻ <?php ?> đã biến mất.",
      },
      body: `Mở \`http://localhost/nhip/hello.php\` rồi xem nguồn trang. Bạn chỉ thấy HTML đã có sẵn giờ và phiên bản — không còn \`$name\`, không còn \`date(...)\`.

Đây là khác biệt lớn nhất so với JavaScript ở chặng 1: mã JS gửi tới trình duyệt và **ai cũng đọc được**; mã PHP ở lại máy chủ. Nhờ vậy sau này mật khẩu cơ sở dữ liệu nằm trong PHP mà người dùng không thể xem.

Nếu bạn thấy nguyên mã PHP hiện trên trang, nghĩa là bạn đang mở tệp trực tiếp (\`file:///...\`) chứ không qua \`http://localhost\` — Apache không được dùng tới.`,
    },
    {
      section: "core",
      title: "Làm quen phpMyAdmin",
      image: {
        src: "/image/coding/steps/s07-pma-home.webp",
        alt: "Trang chủ phpMyAdmin 5.2.1 tiếng Việt: cột trái có các cơ sở dữ liệu information_schema, mysql, performance_schema, test; khung phải ghi Máy chủ cơ sở dữ liệu MariaDB 10.4.28, bảng mã máy chủ UTF-8 Unicode utf8mb4",
        caption: "http://localhost/phpmyadmin — giao diện chuyển được sang tiếng Việt ở mục Ngôn ngữ (Language).",
      },
      body: `Ba vùng cần nhớ:

- **Cột trái**: danh sách cơ sở dữ liệu. \`mysql\`, \`information_schema\`, \`performance_schema\` là của hệ thống — **đừng sửa, đừng xoá**.
- **Thanh tab trên**: *Cơ sở dữ liệu* (tạo mới), *SQL* (gõ lệnh), *Xuất/Nhập* (sao lưu, khôi phục), *Các tài khoản người dùng*.
- **Khung "Máy chủ cơ sở dữ liệu"**: phiên bản (MariaDB 10.4 trên XAMPP 8.2), người dùng đang đăng nhập (\`root@localhost\`) và **bảng mã máy chủ phải là utf8mb4** để lưu đủ tiếng Việt và emoji.`,
    },
    {
      section: "core",
      title: "Tài khoản root không mật khẩu",
      body: `XAMPP cài sẵn tài khoản MySQL **\`root\` với mật khẩu rỗng**, và phpMyAdmin tự đăng nhập bằng nó. Trên máy cá nhân, chỉ bạn truy cập được, điều này chấp nhận được để học.

Ghi nhớ ba điều cho các chặng sau:

1. Không bao giờ dùng \`root\` cho ứng dụng thật. Step 24 sẽ tạo tài khoản riêng có mật khẩu mạnh trên hosting.
2. Không bao giờ để Apache của XAMPP nghe ra mạng công cộng (quán cà phê, ký túc xá) — đó là lý do chọn *Private networks* khi tường lửa hỏi.
3. Thông tin kết nối cơ sở dữ liệu sẽ nằm trong **một tệp cấu hình duy nhất** (step 11), không rải khắp mã.`,
    },
    {
      section: "core",
      title: "Cấu trúc thư mục từ bây giờ",
      body: `~~~text
htdocs/
└── nhip/
    ├── hello.php        ← tệp thử, xoá được sau step 8
    ├── index.html       ← từ chặng 1 (đổi thành index.php ở step 8)
    ├── profile.html
    ├── css/style.css
    ├── js/app.js
    └── img/
~~~

Quy ước đặt tên: **chữ thường, không dấu, không khoảng trắng** (\`profile.php\`, không \`Trang Cá Nhân.php\`). Máy chủ Linux phân biệt hoa thường: \`Style.css\` và \`style.css\` là hai tệp khác nhau — chạy được trên Windows nhưng hỏng khi đưa lên hosting ở step 24.`,
    },
    {
      section: "apply",
      title: "Viết hello.php",
      body: "Tạo `htdocs/nhip/hello.php` với nội dung dưới đây, lưu UTF-8, rồi mở `http://localhost/nhip/hello.php`. Tải lại trang vài lần: giờ thay đổi vì PHP chạy lại ở mỗi yêu cầu.",
      code: {
        file: "nhip/hello.php",
        lang: "php",
        content: `<?php
// Tệp PHP đầu tiên: máy chủ chạy đoạn này rồi chỉ gửi KẾT QUẢ về trình duyệt.
date_default_timezone_set('Asia/Ho_Chi_Minh');

$name = 'Nhịp';
$time = date('H:i, d/m/Y');
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Xin chào từ PHP</title>
</head>
<body>
  <h1>Xin chào, <?= $name ?>!</h1>
  <p>Máy chủ đang chạy PHP <?= PHP_VERSION ?> lúc <?= $time ?>.</p>
</body>
</html>`,
      },
    },
    {
      section: "apply",
      title: "Kết quả mong đợi",
      image: {
        src: "/image/coding/steps/s07-hello.webp",
        alt: "Trình duyệt hiện tiêu đề Xin chào, Nhịp! và dòng Máy chủ đang chạy PHP 8.2.4 lúc 08:55, 27/10/2026",
        caption: "Phiên bản PHP và giờ trên máy bạn sẽ khác — đó chính là bằng chứng mã chạy thật.",
      },
      body: `Thử thêm ba thay đổi và tải lại trang sau mỗi lần:

1. Đổi \`$name\` thành tên của bạn.
2. Xoá dấu \`;\` sau \`$name = 'Nhịp'\` → trang báo **Parse error** kèm số dòng. Đọc kỹ thông báo rồi sửa lại.
3. Gõ sai tên biến \`<?= $nam ?>\` → **Warning: Undefined variable $nam**. PHP vẫn chạy tiếp nhưng in rỗng — lỗi kiểu này dễ bị bỏ sót, nên luôn để mắt tới cảnh báo.`,
    },
    {
      section: "apply",
      title: "Đưa Nhịp vào máy chủ",
      body: `1. Chép cả thư mục \`nhip/\` của chặng 1 vào \`htdocs/\` (giữ \`hello.php\` vừa tạo).
2. Mở \`http://localhost/nhip/\` — Apache tự chọn \`index.html\`.
3. Đăng thử một bài: bản mẫu chặng 1 vẫn chạy, vì HTML/CSS/JS chạy được trên mọi máy chủ web.
4. Mở *DevTools → Network*, tải lại trang: mỗi tệp (\`style.css\`, \`app.js\`) là một yêu cầu HTTP có mã **200**. Đây là cùng một luồng bạn học ở step 2, giờ do Apache trên máy bạn trả lời.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu step 7",
      body: `- [ ] \`http://localhost\` hiện trang Welcome to XAMPP.
- [ ] \`http://localhost/phpmyadmin\` mở được, bảng mã máy chủ là utf8mb4.
- [ ] \`hello.php\` in đúng giờ và phiên bản PHP; xem nguồn trang không còn mã PHP.
- [ ] Bạn đã gây và sửa được một *Parse error*.
- [ ] \`http://localhost/nhip/\` mở bản mẫu chặng 1.
- [ ] Bạn biết cách đổi cổng Apache nếu cổng 80 bị chiếm.

Step 8 sẽ đổi \`index.html\` thành \`index.php\` và để PHP tự vẽ bảng tin.`,
    },
  ],
  quiz: [
    { q: "Trong XAMPP, thành phần nào nhận yêu cầu HTTP từ trình duyệt?", o: ["PHP", "Apache", "MariaDB", "phpMyAdmin"], a: 1, why: "Apache là máy chủ web; nó giao tệp .php cho PHP chạy rồi gửi kết quả về." },
    { q: "Tệp htdocs/nhip/hello.php có địa chỉ nào?", o: ["http://localhost/htdocs/nhip/hello.php", "http://localhost/nhip/hello.php", "file:///nhip/hello.php", "http://nhip/hello.php"], a: 1, why: "htdocs là thư mục gốc nên không xuất hiện trong địa chỉ." },
    { kind: "truefalse", q: "Người dùng có thể xem mã PHP của bạn bằng tính năng Xem nguồn trang.", a: false, why: "PHP chạy trên máy chủ; trình duyệt chỉ nhận HTML đầu ra." },
    { q: "Apache báo cổng 80 đang bị chiếm. Cách xử lý đúng là gì?", o: ["Cài lại Windows", "Tìm và tắt chương trình giữ cổng, hoặc đổi Listen sang 8080 trong httpd.conf", "Đổi cổng MySQL", "Xoá thư mục htdocs"], a: 1, why: "Hai máy chủ không thể cùng nghe một cổng; giải phóng cổng hoặc dùng cổng khác." },
    { kind: "output", q: "Trang hiện gì?", code: "<?php $x = 'Nhịp'; ?>\n<p>Xin chào <?= $x ?></p>", o: ["Xin chào $x", "Xin chào Nhịp", "Xin chào <?= $x ?>", "Lỗi"], a: 1, why: "<?= $x ?> là viết tắt của echo $x." },
    { kind: "multi", q: "Những cơ sở dữ liệu nào trong phpMyAdmin là của hệ thống, không được xoá?", o: ["mysql", "information_schema", "performance_schema", "nhip"], a: [0, 1, 2], why: "nhip là cơ sở dữ liệu bạn tự tạo ở step 9." },
    { q: "Bạn mở hello.php và thấy nguyên văn <?php ... ?> trên trang. Nguyên nhân khả dĩ nhất?", o: ["Thiếu dấu chấm phẩy", "Mở tệp bằng file:/// thay vì http://localhost", "MySQL chưa bật", "Sai múi giờ"], a: 1, why: "Không qua Apache thì không có ai chạy PHP; trình duyệt hiện tệp như văn bản." },
    { kind: "blank", q: "Điền tên thư mục gốc tài liệu của XAMPP.", code: "C:\\xampp\\_____\\nhip\\index.php", a: "htdocs", why: "Apache của XAMPP phục vụ mọi thứ trong htdocs." },
    { q: "Vì sao không dùng tài khoản root không mật khẩu cho website thật?", o: ["root chạy chậm hơn", "root có toàn quyền; lộ ra là mất cả máy chủ cơ sở dữ liệu", "Hosting không có root", "phpMyAdmin không hỗ trợ"], a: 1, why: "Nguyên tắc đặc quyền tối thiểu: ứng dụng chỉ nên có đúng quyền nó cần." },
    { kind: "bug", q: "Dòng nào khiến PHP báo Parse error?", lines: ["<?php", "$name = 'Nhịp'", "echo \"Xin chào $name\";", "?>"], a: 1, why: "Thiếu dấu ; cuối câu lệnh gán." },
  ],
};
