// Step 1 — Tư duy lập trình. Khối mã trong `body` dùng rào ~~~ thay cho ```
// để khỏi phải thoát dấu backtick trong template literal.
export default {
  id: "step1",
  lang: "js",
  file: "nhip/hello.html",
  duration: "90 phút",
  summary: "Hiểu máy tính chạy chương trình thế nào, viết thuật toán bằng mã giả và chạy chương trình JavaScript đầu tiên.",
  slides: [
    {
      section: "intro",
      title: "Chào mừng tới Coding",
      body: `Trong 26 step, bạn sẽ tự tay xây **Nhịp** — một mạng xã hội chia sẻ bài viết ngắn có trang đăng bài và trang cá nhân — từ một tệp HTML trống tới sản phẩm PHP + MySQL chạy thật trên Internet.

Mỗi step đi theo cùng một trình tự: **giới thiệu → minh hoạ → học thuật → lên ý tưởng → kiến thức chính → áp dụng vào Nhịp → trắc nghiệm**. Muốn qua step, bài trắc nghiệm cuối phải đạt **từ 60%**.`,
    },
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Trước khi viết một dòng HTML nào, bạn cần biết **lập trình thực chất là gì**:

- Máy tính chỉ làm đúng từng bước được ra lệnh — không đoán ý.
- Một **thuật toán** là dãy bước rõ ràng, hữu hạn, giải được một bài toán.
- **Biến**, **điều kiện**, **vòng lặp** là ba viên gạch dựng nên mọi chương trình.

Cuối step, bạn chạy chương trình JavaScript đầu tiên và viết thuật toán "đăng một bài" cho Nhịp.`,
    },
    {
      section: "intro",
      title: "Chuẩn bị",
      body: `Bạn cần:

1. Một trình duyệt hiện đại (Chrome, Edge hoặc Firefox).
2. **Visual Studio Code** — tải miễn phí tại code.visualstudio.com.
3. Một thư mục tên \`nhip\` trên máy — mọi tệp của dự án sẽ nằm ở đây.

Chưa cần máy chủ hay cơ sở dữ liệu: chặng 1 chạy hoàn toàn trong trình duyệt.`,
    },
    {
      section: "visual",
      title: "Mọi chương trình: vào → xử lý → ra",
      visual: "ipo",
      body: "Bàn phím, chuột, biểu mẫu là **đầu vào**. Mã của bạn là **xử lý**. Màn hình, tệp, dữ liệu gửi đi là **đầu ra**. Bất kỳ ứng dụng nào — kể cả mạng xã hội bạn dùng mỗi ngày — đều chỉ là rất nhiều vòng vào → xử lý → ra nối nhau.",
    },
    {
      section: "visual",
      title: "Thuật toán vẽ thành lưu đồ",
      visual: "flowchart-post",
      body: "Lưu đồ của thao tác **đăng bài**: hình thoi là câu hỏi có/không, hình chữ nhật là việc làm. Đi theo mũi tên là biết chương trình chạy thế nào trước khi viết mã.",
    },
    {
      section: "visual",
      title: "Biến là chiếc hộp có nhãn",
      visual: "variables",
      body: "Biến giữ một giá trị và có một cái tên để gọi lại. Gán giá trị mới là thay đồ trong hộp — nhãn giữ nguyên. Kiểu dữ liệu cho biết trong hộp đựng gì: chữ, số hay đúng/sai.",
    },
    {
      section: "research",
      title: "Tư duy máy tính",
      body: `Jeannette Wing (2006) gọi kỹ năng này là **tư duy máy tính** (computational thinking) và coi nó là kỹ năng nền như đọc, viết, làm toán. Bốn trụ cột:

1. **Phân rã** — chia bài toán lớn thành bài toán nhỏ.
2. **Nhận dạng mẫu** — thấy chỗ lặp lại.
3. **Trừu tượng hoá** — bỏ chi tiết không cần.
4. **Thuật toán** — viết các bước giải.

> Wing, J.M. (2006) 'Computational thinking', *Communications of the ACM*, 49(3), pp. 33–35.`,
    },
    {
      section: "research",
      title: "Bốn bước giải bài toán của Pólya",
      body: `Nhà toán học George Pólya đề xuất một quy trình mà lập trình viên vẫn dùng mỗi ngày:

1. **Hiểu bài toán** — đầu vào là gì, cần ra cái gì?
2. **Lập kế hoạch** — thuật toán, lưu đồ, mã giả.
3. **Thực hiện kế hoạch** — viết mã.
4. **Nhìn lại** — chạy thử, kiểm tra trường hợp biên, rút kinh nghiệm.

> Pólya, G. (1945) *How to Solve It*. Princeton: Princeton University Press.`,
    },
    {
      section: "research",
      title: "Giáo trình này dựa trên chuẩn nào",
      body: `- **CS50 (Harvard)**: giải bài toán thật ngay từ tuần đầu, rồi mới đi sâu lý thuyết.
- **CS2023 (ACM/IEEE-CS/AAAI)**: khung chương trình khoa học máy tính quốc tế; Coding bám các mảng *nền tảng lập trình*, *phát triển web* và *bảo mật*.
- **Tài liệu gốc của chuẩn**: MDN, WHATWG, W3C, IETF, PHP Manual, OWASP — không học qua blog vô danh.

> Malan, D.J. (2025) *CS50's Introduction to Computer Science*. Harvard University. Available at: https://cs50.harvard.edu/x/
>
> Kumar, A.N. and Raj, R.K. et al. (2024) *Computer Science Curricula 2023*. ACM, IEEE Computer Society and AAAI.`,
    },
    {
      section: "ideate",
      title: "Phân rã Nhịp",
      body: `Áp dụng **phân rã** cho cả dự án. Nhịp gồm:

- **Trang bảng tin**: ô soạn bài, danh sách bài mới nhất.
- **Trang cá nhân**: ảnh, tên, tiểu sử, bài của riêng người đó.
- **Mỗi bài đăng**: người viết, nội dung, thời gian, số tim, số trả lời.

Mỗi gạch đầu dòng sẽ thành một phần mã. Bài toán "làm mạng xã hội" đáng sợ; bài toán "hiện một bài đăng" thì làm được ngay hôm nay.`,
    },
    {
      section: "ideate",
      title: "Hiểu bài toán: đăng một bài",
      body: `Theo Pólya, bắt đầu bằng câu hỏi:

- **Đầu vào**: nội dung người dùng gõ.
- **Ràng buộc**: không được trống; tối đa 500 ký tự (giới hạn này giúp bài ngắn gọn, dễ đọc).
- **Đầu ra**: bài mới hiện ở đầu bảng tin, hoặc một thông báo lỗi.

Viết ra được ba dòng này là đã xong phần khó nhất.`,
    },
    {
      section: "core",
      title: "Chương trình là gì",
      body: `**Chương trình** là một dãy lệnh mà máy tính thực hiện **theo thứ tự**, từ trên xuống, từng lệnh một.

Máy tính không hiểu ý định. Lệnh "in tên tôi" mà bạn quên khai báo tên thì máy báo lỗi — nó không tự đi tìm. Lập trình là nghệ thuật viết lệnh **rõ đến mức không thể hiểu sai**.`,
    },
    {
      section: "core",
      title: "Mã giả trước, mã thật sau",
      body: `**Mã giả** (pseudocode) là thuật toán viết bằng ngôn ngữ thường, có cấu trúc như mã:

~~~text
nhận nội dung
nếu nội dung trống:
    báo "Hãy viết gì đó"
ngược lại nếu độ dài > 500:
    báo "Tối đa 500 ký tự"
ngược lại:
    thêm bài vào đầu bảng tin
~~~

Mã giả không chạy được, nhưng nó tách việc **nghĩ** khỏi việc **gõ cú pháp**.`,
    },
    {
      section: "core",
      title: "Biến và kiểu dữ liệu",
      body: `Trong JavaScript, khai báo biến bằng \`let\` (giá trị đổi được) hoặc \`const\` (không gán lại):

~~~js
const author = "lan.code";   // chuỗi (string)
let likes = 0;               // số (number)
const isPublic = true;       // đúng/sai (boolean)
likes = likes + 1;           // likes bây giờ là 1
~~~

Quy tắc dùng mặc định: **luôn dùng \`const\`**, chỉ đổi sang \`let\` khi thật sự cần gán lại.`,
    },
    {
      section: "core",
      title: "Điều kiện: rẽ nhánh",
      body: `\`if / else if / else\` cho chương trình chọn đường:

~~~js
const text = "Xin chào Nhịp";
if (text.length === 0) {
  console.log("Hãy viết gì đó");
} else if (text.length > 500) {
  console.log("Tối đa 500 ký tự");
} else {
  console.log("Đăng được");
}
~~~

\`===\` so sánh **bằng nghiêm ngặt** (cùng giá trị và cùng kiểu). Luôn dùng \`===\`, không dùng \`==\`.`,
    },
    {
      section: "core",
      title: "Vòng lặp: làm lại nhiều lần",
      body: `Bảng tin có 3 bài thì in 3 lần. Không viết tay 3 dòng — dùng vòng lặp:

~~~js
const posts = ["Chào cả nhà", "Hôm nay học HTML", "Ai học Coding không?"];
for (const post of posts) {
  console.log(post);
}
~~~

\`for...of\` đi qua **từng phần tử** của danh sách. 3 bài hay 3.000 bài, mã vẫn chỉ ba dòng.`,
    },
    {
      section: "core",
      title: "Hàm: đặt tên cho một việc",
      body: `Hàm gói một việc thành một cái tên, gọi lại bao nhiêu lần cũng được:

~~~js
function checkPost(text) {
  if (text.length === 0) return "Hãy viết gì đó";
  if (text.length > 500) return "Tối đa 500 ký tự";
  return "ok";
}

console.log(checkPost(""));          // Hãy viết gì đó
console.log(checkPost("Xin chào"));  // ok
~~~

\`text\` là **tham số** — giá trị truyền vào. \`return\` trả kết quả về chỗ gọi hàm.`,
    },
    {
      section: "core",
      title: "Lỗi là chuyện bình thường",
      body: `Có ba loại lỗi:

- **Lỗi cú pháp** — gõ sai luật ngôn ngữ (thiếu ngoặc). Chương trình không chạy.
- **Lỗi khi chạy** — gọi thứ không tồn tại. Chương trình dừng giữa chừng.
- **Lỗi logic** — chạy êm nhưng ra kết quả sai. Khó tìm nhất.

Cách tìm: đọc thông báo lỗi (nó nói số dòng), in giá trị biến bằng \`console.log\`, và thử với đầu vào biên (chuỗi rỗng, đúng 500 ký tự, 501 ký tự).`,
    },
    {
      section: "apply",
      title: "Tạo thư mục dự án",
      body: `Mở VS Code → **File → Open Folder** → chọn thư mục \`nhip\`. Tạo tệp mới tên \`hello.html\` và chép mã bên dưới vào.

Thẻ \`<script>\` cho phép viết JavaScript ngay trong trang HTML.`,
      code: {
        file: "nhip/hello.html",
        lang: "html",
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Nhịp — chương trình đầu tiên</title>
</head>
<body>
  <h1>Mở DevTools (F12) → tab Console</h1>
  <script>
    console.log("Xin chào, Nhịp!");
  </script>
</body>
</html>`,
      },
    },
    {
      section: "apply",
      title: "Chạy và quan sát",
      body: `Bấm đúp vào \`hello.html\` để mở bằng trình duyệt, nhấn **F12**, chọn tab **Console**. Bạn sẽ thấy dòng **Xin chào, Nhịp!**

Đổi chữ trong \`console.log\`, lưu tệp (Ctrl+S), tải lại trang (F5). Vòng **sửa → lưu → tải lại → xem** này bạn sẽ lặp hàng nghìn lần.`,
    },
    {
      section: "apply",
      title: "Viết hàm kiểm tra bài đăng",
      body: "Thay phần `<script>` bằng thuật toán đã viết ở phần mã giả. Mở Console và đọc kết quả của ba lần gọi — mỗi lần thử một trường hợp biên.",
      code: {
        file: "nhip/hello.html",
        lang: "html",
        content: `<script>
  const MAX_LENGTH = 500;

  function checkPost(text) {
    const clean = text.trim();          // bỏ khoảng trắng hai đầu
    if (clean.length === 0) return "Hãy viết gì đó";
    if (clean.length > MAX_LENGTH) return "Tối đa " + MAX_LENGTH + " ký tự";
    return "ok";
  }

  console.log(checkPost("   "));                  // Hãy viết gì đó
  console.log(checkPost("Xin chào Nhịp"));       // ok
  console.log(checkPost("a".repeat(501)));        // Tối đa 500 ký tự
</script>`,
      },
    },
    {
      section: "apply",
      title: "Duyệt danh sách bài",
      body: "Thêm đoạn này vào cuối `<script>`. Nó dùng vòng lặp và hàm vừa viết để kiểm tra cả một danh sách bài — đúng việc bảng tin sẽ làm ở step 6.",
      code: {
        file: "nhip/hello.html",
        lang: "js",
        content: `const drafts = ["Chào Nhịp", "", "Hôm nay học thuật toán"];
let accepted = 0;

for (const draft of drafts) {
  const result = checkPost(draft);
  console.log(draft || "(trống)", "→", result);
  if (result === "ok") accepted = accepted + 1;
}

console.log("Đăng được", accepted, "/", drafts.length, "bài");`,
      },
    },
    {
      section: "apply",
      title: "Tự kiểm tra",
      body: `Trước khi làm trắc nghiệm, tự hỏi:

- Bỏ \`.trim()\` thì \`checkPost("   ")\` trả về gì? Vì sao đó là lỗi logic?
- Đổi \`MAX_LENGTH\` thành 280 — cần sửa mấy chỗ? (Đáp án: một. Đó là lý do đặt hằng số.)
- Console báo \`checkPost is not defined\` — bạn đã gõ sai tên ở đâu?`,
    },
  ],
  quiz: [
    { q: "Thuật toán là gì?", o: ["Một ngôn ngữ lập trình", "Dãy bước rõ ràng, hữu hạn để giải một bài toán", "Một phần cứng của máy tính", "Một loại lỗi"], a: 1, why: "Thuật toán độc lập với ngôn ngữ: cùng một thuật toán viết được bằng JavaScript, PHP hay mã giả." },
    { kind: "truefalse", q: "Máy tính tự hiểu ý định của người viết và sửa lệnh thiếu cho đúng.", a: false, why: "Máy tính làm đúng từng lệnh, không đoán ý — vì vậy lệnh phải rõ đến mức không thể hiểu sai." },
    { kind: "order", q: "Sắp xếp bốn bước giải bài toán của Pólya cho đúng thứ tự.", items: ["Hiểu bài toán", "Lập kế hoạch", "Thực hiện kế hoạch", "Nhìn lại"], a: [0, 1, 2, 3], why: "Hiểu → kế hoạch → làm → nhìn lại (Pólya, 1945)." },
    { kind: "output", q: "Đoạn mã in ra gì?", code: "let likes = 0;\nlikes = likes + 1;\nlikes = likes + 1;\nconsole.log(likes);", o: ["0", "1", "2", "likes"], a: 2, why: "Mỗi lần gán, giá trị mới thay giá trị cũ: 0 → 1 → 2." },
    { q: "Nên khai báo biến bằng gì khi giá trị KHÔNG bao giờ bị gán lại?", o: ["var", "let", "const", "function"], a: 2, why: "const ngăn gán lại nhầm; chỉ dùng let khi thật sự cần đổi giá trị." },
    { kind: "blank", q: "Điền toán tử so sánh bằng nghiêm ngặt.", code: "if (text.length ___ 0) {\n  console.log(\"Hãy viết gì đó\");\n}", a: "===", why: "=== so cả giá trị lẫn kiểu; == tự ép kiểu và gây lỗi khó thấy." },
    { kind: "match", q: "Nối loại lỗi với ví dụ.", pairs: [["Lỗi cú pháp", "Thiếu dấu đóng ngoặc"], ["Lỗi khi chạy", "Gọi hàm chưa khai báo"], ["Lỗi logic", "Chạy êm nhưng đếm sai số bài"]], why: "Lỗi logic khó nhất vì chương trình không báo gì cả." },
    { kind: "bug", q: "Dòng nào làm cho bài toàn khoảng trắng vẫn được đăng?", lines: ["function checkPost(text) {", "  const clean = text;", "  if (clean.length === 0) return \"Hãy viết gì đó\";", "  return \"ok\";", "}"], a: 1, why: "Thiếu .trim(): chuỗi \"   \" dài 3 ký tự nên không bị coi là trống." },
    { kind: "multi", q: "Những gì thuộc bốn trụ cột của tư duy máy tính (Wing, 2006)?", o: ["Phân rã", "Trừu tượng hoá", "Gõ phím nhanh", "Thuật toán"], a: [0, 1, 3], why: "Bốn trụ cột: phân rã, nhận dạng mẫu, trừu tượng hoá, thuật toán." },
    { q: "Vì sao nên đặt hằng MAX_LENGTH thay vì gõ số 500 ở nhiều chỗ?", o: ["Chạy nhanh hơn", "Đổi giới hạn chỉ cần sửa một chỗ", "JavaScript bắt buộc", "Để tiết kiệm bộ nhớ"], a: 1, why: "Một nguồn sự thật: sửa một chỗ, mọi nơi dùng nó đều đổi theo." },
  ],
};
