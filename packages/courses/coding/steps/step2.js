export default {
  id: "step2",
  lang: "html",
  file: "nhip/README.md",
  duration: "90 phút",
  summary: "Hiểu đường đi của một trang web từ lúc gõ địa chỉ tới lúc hiện ra, đọc được request/response và chốt bản mô tả dự án Nhịp.",
  slides: [
    {
      section: "intro",
      title: "Chuyện gì xảy ra khi bạn mở một mạng xã hội?",
      body: `Bạn gõ một địa chỉ, nhấn Enter, và nửa giây sau bảng tin hiện ra. Trong nửa giây đó có ít nhất bốn việc: **tìm địa chỉ máy chủ**, **mở kết nối**, **gửi yêu cầu**, **nhận và vẽ trang**.

Step này mổ xẻ từng việc. Hiểu nó rồi thì mọi thứ về sau — PHP, SQL, bảo mật, triển khai — đều có chỗ để đặt vào.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `Sau step này bạn:

- Phân biệt được **client** và **server**, trang **tĩnh** và trang **động**.
- Đọc được cấu trúc một **URL** và vai trò của **DNS**.
- Đọc được một **HTTP request/response** trong DevTools: method, status code, header, body.
- Có bản mô tả dự án Nhịp và cấu trúc thư mục chuẩn.`,
    },
    {
      section: "visual",
      title: "Client và server",
      visual: "client-server",
      body: "**Client** (trình duyệt) gửi yêu cầu. **Server** (máy chủ) nhận, xử lý, trả về phản hồi. Mỗi lần bấm, mỗi lần tải trang là một vòng hỏi–đáp như thế.",
    },
    {
      section: "visual",
      title: "Giải phẫu một URL",
      visual: "url-anatomy",
      body: "Mỗi phần của URL có một việc: **giao thức** nói cách nói chuyện, **tên miền** nói nói với ai, **đường dẫn** nói xin trang nào, **chuỗi truy vấn** gửi thêm tham số.",
    },
    {
      section: "visual",
      title: "DNS: danh bạ của Internet",
      visual: "dns",
      body: "Máy tính không biết \"nhip.example\" ở đâu — chỉ biết địa chỉ IP. DNS tra tên miền ra IP, giống tra danh bạ ra số điện thoại. Kết quả được lưu đệm để lần sau khỏi tra lại.",
    },
    {
      section: "visual",
      title: "Một request và một response",
      visual: "http-message",
      body: "Request có **method + đường dẫn + header (+ body)**. Response có **status code + header + body**. Body của trang web thường là HTML.",
    },
    {
      section: "research",
      title: "Web ra đời từ một bản đề xuất",
      body: `Năm 1989, Tim Berners-Lee viết bản đề xuất ở CERN về một hệ thống tài liệu liên kết nhau qua mạng. Ba phát minh của ông vẫn là xương sống của web hôm nay: **HTML** (định dạng tài liệu), **URL** (địa chỉ), **HTTP** (giao thức trao đổi).

> Berners-Lee, T. (1989) *Information Management: A Proposal*. Geneva: CERN.`,
    },
    {
      section: "research",
      title: "HTTP là một chuẩn mở",
      body: `HTTP do IETF chuẩn hoá trong các tài liệu RFC. RFC 9110 định nghĩa nghĩa của các method (GET, POST, PUT, DELETE…) và các nhóm status code (2xx thành công, 3xx chuyển hướng, 4xx lỗi phía client, 5xx lỗi phía server).

> Fielding, R., Nottingham, M. and Reschke, J. (2022) *RFC 9110: HTTP Semantics*. IETF. Available at: https://www.rfc-editor.org/rfc/rfc9110
>
> Mockapetris, P. (1987) *RFC 1034: Domain Names — Concepts and Facilities*. IETF.`,
    },
    {
      section: "research",
      title: "Không trạng thái: HTTP không nhớ bạn",
      body: `Theo Fielding (2000), kiến trúc web cố ý **không trạng thái** (stateless): mỗi request phải tự mang đủ thông tin, server không nhớ request trước. Nhờ vậy web mở rộng được tới hàng tỉ người dùng.

Hệ quả cho Nhịp: muốn server biết "ai đang đăng bài", ta phải gửi kèm bằng chứng mỗi lần — đó là **cookie và session** ở chặng 3.

> Fielding, R.T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. PhD thesis. University of California, Irvine.`,
    },
    {
      section: "ideate",
      title: "Nhịp cần những trang nào",
      visual: "app-wireframe",
      body: `Bản phác hai trang chính:

- **Bảng tin** (\`index\`): ô soạn bài ở trên, các bài mới nhất bên dưới.
- **Trang cá nhân** (\`profile\`): ảnh, tên, tiểu sử, số người theo dõi, bài của người đó.

Chặng 1 dựng hai trang này bằng HTML/CSS/JS. Chặng 2 chuyển chúng thành PHP đọc dữ liệu thật.`,
    },
    {
      section: "ideate",
      title: "Trang tĩnh hay động?",
      body: `- **Trang tĩnh**: server gửi đúng tệp có sẵn, ai xem cũng như nhau (trang giới thiệu).
- **Trang động**: server **dựng trang mỗi lần có request**, theo người xem và dữ liệu mới nhất (bảng tin).

Bảng tin Nhịp phải là trang động: mỗi người thấy bài của người mình theo dõi, bài mới nhất ở trên. Vì thế ta sẽ cần PHP và MySQL.`,
    },
    {
      section: "core",
      title: "Đường đi đầy đủ của một trang",
      body: `1. Bạn gõ \`https://nhip.example/profile?u=lan\`.
2. Trình duyệt hỏi **DNS** để có địa chỉ IP.
3. Mở kết nối **TCP**, bắt tay **TLS** (chữ "s" trong https = mã hoá).
4. Gửi **request** \`GET /profile?u=lan\`.
5. Server chạy mã, đọc dữ liệu, trả **response** \`200 OK\` kèm HTML.
6. Trình duyệt đọc HTML, tải thêm CSS, JS, ảnh (mỗi thứ một request nữa), rồi **vẽ** trang.`,
    },
    {
      section: "core",
      title: "Các method chính",
      body: `| Method | Dùng để | Ví dụ ở Nhịp |
|---|---|---|
| GET | Đọc dữ liệu | Xem bảng tin |
| POST | Tạo mới | Đăng bài |
| PUT/PATCH | Sửa | Sửa bài |
| DELETE | Xoá | Xoá bài |

Luật vàng: **GET không bao giờ được thay đổi dữ liệu**. Trình duyệt, công cụ tìm kiếm có thể tự gọi GET bất cứ lúc nào.`,
    },
    {
      section: "core",
      title: "Status code nói gì",
      body: `- **200 OK** — thành công.
- **201 Created** — đã tạo xong (đăng bài thành công).
- **301/302** — chuyển hướng sang địa chỉ khác.
- **400 Bad Request** — dữ liệu gửi lên sai.
- **401 Unauthorized** — chưa đăng nhập.
- **403 Forbidden** — đăng nhập rồi nhưng không có quyền (xoá bài người khác).
- **404 Not Found** — không có trang này.
- **500 Internal Server Error** — mã phía server bị lỗi.`,
    },
    {
      section: "core",
      title: "Header và body",
      body: `**Header** là thông tin đi kèm, dạng \`Tên: giá trị\`:

~~~text
GET /index.html HTTP/1.1
Host: nhip.example
Accept: text/html

HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 1532

<!DOCTYPE html> ...
~~~

\`Content-Type\` nói body là gì (HTML, JSON, ảnh…). Một dòng trống ngăn header với body.`,
    },
    {
      section: "core",
      title: "Frontend và backend",
      body: `- **Frontend** — chạy trên máy người dùng: HTML (cấu trúc), CSS (trình bày), JavaScript (hành vi).
- **Backend** — chạy trên máy chủ: PHP (xử lý), MySQL (lưu dữ liệu).

Luật an toàn quan trọng nhất của cả khoá: **mọi thứ ở frontend người dùng sửa được**. Kiểm tra dữ liệu ở frontend chỉ để tiện; kiểm tra thật **luôn ở backend**.`,
    },
    {
      section: "apply",
      title: "Soi request thật bằng DevTools",
      body: `1. Mở một trang bất kỳ, nhấn **F12** → tab **Network**.
2. Tải lại trang (F5).
3. Bấm dòng đầu tiên (tài liệu HTML). Tìm: **Request Method**, **Status Code**, **Content-Type**.
4. Đếm xem trang tải bao nhiêu request để vẽ xong.

Ghi ba con số này lại — bạn sẽ so với Nhịp ở chặng 5 khi tối ưu hiệu năng.`,
    },
    {
      section: "apply",
      title: "Dựng cấu trúc thư mục",
      body: "Trong thư mục `nhip`, tạo các tệp và thư mục sau (để trống nội dung, step 3–6 sẽ điền). Đặt tên **chữ thường, không dấu, nối bằng gạch ngang** — máy chủ Linux phân biệt hoa thường.",
      code: {
        file: "nhip/",
        lang: "text",
        content: `nhip/
├── index.html        ← bảng tin
├── profile.html      ← trang cá nhân
├── css/
│   └── style.css
├── js/
│   └── app.js
├── img/
└── README.md         ← mô tả dự án`,
      },
    },
    {
      section: "apply",
      title: "Viết bản mô tả dự án",
      body: "Mọi dự án chuyên nghiệp bắt đầu bằng một README. Chép khung này vào `README.md` và điền phần của bạn. Định dạng là Markdown — chính định dạng đang dùng để soạn bài này.",
      code: {
        file: "nhip/README.md",
        lang: "markdown",
        content: `# Nhịp

Mạng xã hội chia sẻ bài viết ngắn mạng xã hội.

## Trang
- Bảng tin: soạn bài, xem bài mới nhất
- Trang cá nhân: thông tin và bài của một người

## Chức năng chặng 1
- Đăng bài (tối đa 500 ký tự)
- Thả tim

## Công nghệ
- Chặng 1: HTML, CSS, JavaScript
- Chặng 2+: PHP 8, MySQL, PDO

## Tác giả
<Tên của bạn>`,
      },
    },
    {
      section: "apply",
      title: "Vẽ quy trình đăng bài",
      body: `Trên giấy, vẽ đường đi của thao tác **đăng bài** khi Nhịp đã có backend:

1. Người dùng bấm "Đăng" → request gì? (method, đường dẫn)
2. Server kiểm tra gì? (đăng nhập chưa, nội dung hợp lệ không)
3. Thành công trả status nào? Chưa đăng nhập trả status nào?

Giữ tờ giấy. Ở chặng 3 bạn sẽ code đúng sơ đồ này.`,
    },
  ],
  quiz: [
    { q: "Trong mô hình client–server, trình duyệt đóng vai gì?", o: ["Server", "Client — gửi yêu cầu", "DNS", "Cơ sở dữ liệu"], a: 1, why: "Trình duyệt gửi request; máy chủ xử lý và trả response." },
    { q: "DNS làm gì?", o: ["Mã hoá dữ liệu", "Tra tên miền ra địa chỉ IP", "Lưu bài đăng", "Vẽ trang web"], a: 1, why: "DNS là danh bạ: tên miền → IP (Mockapetris, 1987)." },
    { kind: "match", q: "Nối phần của URL https://nhip.example/profile?u=lan với tên gọi.", pairs: [["https", "Giao thức"], ["nhip.example", "Tên miền"], ["/profile", "Đường dẫn"], ["u=lan", "Chuỗi truy vấn"]], why: "Mỗi phần của URL làm một việc riêng." },
    { q: "Thao tác đăng bài mới nên dùng method nào?", o: ["GET", "POST", "DELETE", "HEAD"], a: 1, why: "POST để tạo mới. GET không bao giờ được thay đổi dữ liệu." },
    { kind: "truefalse", q: "Dùng GET để xoá bài là chấp nhận được vì đường dẫn ngắn gọn.", a: false, why: "Trình duyệt và bot có thể tự gọi GET (tải trước, thu thập), làm mất dữ liệu ngoài ý muốn." },
    { q: "Người dùng đã đăng nhập nhưng cố xoá bài của người khác. Server nên trả mã nào?", o: ["200", "401", "403", "500"], a: 2, why: "401 là chưa xác thực; 403 là biết bạn là ai nhưng không cho phép." },
    { kind: "multi", q: "Những thứ nào chạy ở backend của Nhịp?", o: ["PHP", "MySQL", "CSS", "Kiểm tra quyền xoá bài"], a: [0, 1, 3], why: "CSS chạy ở trình duyệt; kiểm tra quyền phải ở server vì frontend ai cũng sửa được." },
    { kind: "order", q: "Sắp xếp các việc khi mở một trang https.", items: ["Tra DNS lấy IP", "Kết nối TCP và bắt tay TLS", "Gửi request GET", "Nhận response và vẽ trang"], a: [0, 1, 2, 3], why: "Phải biết IP mới kết nối được; phải kết nối mới gửi được request." },
    { kind: "truefalse", q: "HTTP không trạng thái: server không tự nhớ request trước của bạn.", a: true, why: "Vì vậy cần cookie/session để server nhận ra người dùng (Fielding, 2000)." },
    { q: "Vì sao bảng tin Nhịp phải là trang động?", o: ["Để có màu đẹp", "Nội dung đổi theo người xem và dữ liệu mới nhất", "Trang tĩnh không hiện được chữ", "Để không cần HTML"], a: 1, why: "Trang động được server dựng lại mỗi request từ dữ liệu thật." },
  ],
};
