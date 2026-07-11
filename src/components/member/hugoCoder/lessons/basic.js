// ============================================================
// CHẶNG 1 — PHẢN XẠ CƠ BẢN & "LÃM NHẢM" CHO THUỘC LÀO (Bài 1-10)
// Trọng tâm: gõ đi gõ lại thẻ, thuộc tính, câu lệnh, cú pháp
// cơ bản cho đến khi thuộc lòng. Chưa cần tư duy cao siêu.
//
// Khung 5 phần mỗi bài: overview (mục tiêu + thời lượng),
// theory (kiến thức cốt lõi), labSteps (thực hành & code mẫu),
// commonMistakes (bẫy lỗi), challenge + checklist (thuộc bài).
// Kiểm tra: 1 thực hành (verify/puzzle) + 3-4 câu miniQuiz.
// ============================================================
export const BASIC_LESSONS = [
  {
    id: "lesson1",
    title: "1. Cú pháp Semantic HTML & Các thẻ cơ bản",
    lang: "html",
    file: "src/lesson1.html",
    duration: "45 phút",
    overview: {
      description: "Gõ nát bộ khung HTML5 chuẩn và các thẻ semantic (header, nav, main, article, footer) cho đến khi tay tự nhớ — đây là bộ xương của mọi trang web bạn sẽ viết.",
      outcomes: [
        "Gõ lại khung HTML5 chuẩn (DOCTYPE, html lang, head, body) không cần nhìn tài liệu",
        "Thuộc lòng 5 thẻ semantic: header, nav, main, article, footer",
        "Giải thích được vì sao dùng thẻ semantic thay cho div vô nghĩa"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo chuẩn **WHATWG HTML Living Standard** (tài liệu hoá tại **MDN Web Docs**), một tài liệu HTML hợp lệ luôn có 4 tầng theo thứ tự:

1. \`<!DOCTYPE html>\` — báo trình duyệt chạy chế độ chuẩn (standards mode).
2. \`<html lang="vi">\` — phần tử gốc, khai báo ngôn ngữ trang.
3. \`<head>\` — siêu dữ liệu: \`<meta charset="UTF-8">\`, \`<title>\`.
4. \`<body>\` — toàn bộ nội dung hiển thị.

**Semantic HTML** là dùng thẻ đúng nghĩa nội dung thay cho \`<div>\`:

> \`<header>\` phần đầu trang • \`<nav>\` khối điều hướng • \`<main>\` nội dung chính (mỗi trang chỉ 1) • \`<article>\` nội dung độc lập • \`<footer>\` chân trang.

Semantic giúp Google hiểu bố cục (SEO) và người khiếm thị điều hướng bằng trình đọc màn hình (chuẩn tiếp cận **WCAG**).`,
    labSteps: [
      "Mở file src/lesson1.html — file đang trống, bạn sẽ tự gõ từ dòng đầu tiên.",
      "Gõ <!DOCTYPE html> rồi cặp <html lang=\"vi\">...</html> — DOCTYPE luôn ở dòng 1, không có thẻ đóng.",
      "Trong <head>: gõ <meta charset=\"UTF-8\"> (chống lỗi font tiếng Việt) và <title> (chữ hiện trên tab trình duyệt).",
      "Trong <body>: dựng đủ 5 vùng semantic theo thứ tự header → nav → main (chứa article) → footer.",
      "Xoá hết và gõ lại toàn bộ ít nhất 2 lần — mục tiêu của chặng này là thuộc tay, không phải copy."
    ],
    commonMistakes: [
      { symptom: "Tiếng Việt hiển thị thành các ký tự lỗi (Ch??o m???ng).", cause: "Thiếu <meta charset=\"UTF-8\"> trong <head>.", fix: "Thêm <meta charset=\"UTF-8\"> làm dòng đầu tiên bên trong <head>." },
      { symptom: "Viết <main> hai lần trong cùng một trang.", cause: "Chưa nắm quy tắc: main đại diện nội dung chính duy nhất của trang.", fix: "Chỉ giữ một <main>; các khối con bên trong dùng <section> hoặc <article>." },
      { symptom: "Quên thẻ đóng </div>, </main> làm bố cục vỡ khó hiểu.", cause: "Gõ thẻ mở xong viết nội dung ngay, quên đóng.", fix: "Tập thói quen: gõ cặp mở–đóng trước, rồi mới đặt con trỏ vào giữa viết nội dung." }
    ],
    challenge: "Thêm một <article> thứ hai giới thiệu sở thích của bạn, bên trong có <h2> và 2 đoạn <p> — không nhìn lại code mẫu.",
    checklist: [
      "Đã tự gõ lại toàn bộ khung HTML5 tối thiểu 2 lần không lỗi",
      "Thuộc lòng thứ tự: DOCTYPE → html → head → body",
      "Kể được đúng nghĩa 5 thẻ: header, nav, main, article, footer mà không nhìn tài liệu"
    ],
    tasks: [
      "Tự gõ khung HTML5 chuẩn: DOCTYPE, html lang, head (charset + title), body.",
      "Dựng đủ 5 thẻ semantic: header, nav, main, article, footer."
    ],
    starterCode: `<!-- BÀI 1: Tự gõ từ đầu, không copy.
Yêu cầu: khung HTML5 chuẩn + đủ header, nav, main, article, footer -->
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("<!doctypehtml>") && c.includes("<html") && c.includes("<head>") && c.includes("<metacharset") && c.includes("<body>")
        && c.includes("<header") && c.includes("<nav") && c.includes("<main") && c.includes("<article") && c.includes("<footer");
    },
    practiceType: "drag_drop_html",
    dragBlocks: [
      { id: "b1", text: "<!DOCTYPE html>" },
      { id: "b2", text: "<html lang=\"vi\">" },
      { id: "b3", text: "<head>" },
      { id: "b4", text: "<body>" }
    ],
    correctOrder: ["b1", "b2", "b3", "b4"],
    miniQuiz: [
      { q: "Khai báo <!DOCTYPE html> có tác dụng gì?", o: ["Khai báo liên kết CSS", "Báo trình duyệt hiển thị theo chế độ chuẩn (standards mode)", "Tăng tốc tải trang", "Bắt buộc để chạy JavaScript"], a: 1 },
      { q: "Mỗi trang chỉ nên có duy nhất một thẻ semantic nào?", o: ["<section>", "<main>", "<article>", "<nav>"], a: 1 },
      { q: "Thiếu <meta charset=\"UTF-8\"> thường gây lỗi gì?", o: ["Trang trắng", "Tiếng Việt có dấu hiển thị sai", "CSS không chạy", "Ảnh không tải"], a: 1 },
      { q: "Vì sao dùng <header>/<footer> thay vì <div>?", o: ["Chạy nhanh hơn", "Mang ý nghĩa cho SEO và trình đọc màn hình (WCAG)", "Đẹp hơn", "Bắt buộc mới hợp lệ"], a: 1 }
    ]
  },
  {
    id: "lesson2",
    title: "2. CSS Fundamentals & Box Model",
    lang: "html",
    file: "src/lesson2.html",
    duration: "45 phút",
    overview: {
      description: "Lãm nhảm về 4 lớp hộp padding – margin – border – content cho đến khi nhắm mắt cũng đọc được thứ tự, và viết quy tắc CSS đầu tiên đạt chuẩn tương phản.",
      outcomes: [
        "Thuộc lòng 4 lớp Box Model từ trong ra ngoài không nhìn tài liệu",
        "Viết được quy tắc CSS: bộ chọn { thuộc tính: giá trị; }",
        "Hiểu và luôn bật box-sizing: border-box trong mọi dự án"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo **MDN Web Docs**, mọi phần tử HTML là một chiếc hộp 4 lớp:

> **Content** (nội dung) → **Padding** (đệm trong) → **Border** (viền) → **Margin** (khoảng cách ngoài)

Một quy tắc CSS gồm: **bộ chọn { thuộc tính: giá trị; }**
- Bộ chọn class \`.card\` (dùng nhiều nhất), bộ chọn thẻ \`p\`, bộ chọn id \`#logo\`.
- Màu chữ \`color\`, màu nền \`background-color\`, mã màu HEX như \`#0056b3\`.

Mặc định \`width\` chỉ tính content nên hộp bị "phình" khi thêm padding/border. Quy ước mọi dự án hiện đại: \`box-sizing: border-box\` để width bao trọn padding + border.

Cặp màu chữ–nền phải đạt tương phản tối thiểu **4.5:1** theo chuẩn **WCAG AA** — nền \`#0056b3\` + chữ \`#ffffff\` là cặp đạt chuẩn.`,
    labSteps: [
      "Mở src/lesson2.html — khung HTML có sẵn, bạn viết CSS trong thẻ <style> ở <head>.",
      "Gõ quy tắc .card: background-color: #0056b3; color: #ffffff; — đọc to tên thuộc tính khi gõ để nhớ.",
      "Thêm đủ 4 lớp hộp: padding: 20px; border: 2px solid #003b7a; margin: 16px;",
      "Bật box-sizing: border-box; rồi đặt width: 300px — quan sát hộp không bị phình.",
      "Xoá khối .card và gõ lại từ đầu 2 lần cho thuộc tay."
    ],
    commonMistakes: [
      { symptom: "Đặt width: 300px nhưng hộp đo ra 344px.", cause: "Chưa bật border-box nên width chỉ tính content, padding + border cộng thêm ra ngoài.", fix: "Thêm box-sizing: border-box; vào quy tắc (hoặc * { box-sizing: border-box; } đầu file)." },
      { symptom: "Muốn 2 card cách nhau nhưng chỉnh padding mãi không được.", cause: "Nhầm padding (đệm TRONG viền) với margin (khoảng cách NGOÀI viền).", fix: "Khoảng cách giữa các hộp dùng margin; khoảng đệm chữ bên trong hộp dùng padding." },
      { symptom: "Viết color: #0056b3 mà chữ không đổi màu.", cause: "Quên dấu chấm phẩy ; ở dòng trên hoặc gõ sai tên bộ chọn.", fix: "Mỗi khai báo kết thúc bằng ; — kiểm tra lại tên class trong HTML khớp với bộ chọn." }
    ],
    challenge: "Đổi màu nền card thành màu chủ đạo hệ thống #0f766e và bo góc 0.375rem (border-radius) — vẫn phải giữ chữ trắng đạt tương phản.",
    checklist: [
      "Đọc thuộc lòng 4 lớp Box Model từ trong ra ngoài không nhìn tài liệu",
      "Đã gõ lại quy tắc .card tối thiểu 2 lần không lỗi",
      "Giải thích được vì sao cần box-sizing: border-box"
    ],
    tasks: [
      "Viết quy tắc .card: nền #0056b3, chữ #ffffff.",
      "Thêm đủ padding, border, margin và box-sizing: border-box."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 2: CSS & Box Model</title>
    <style>
        /* TODO: gõ quy tắc .card tại đây
           - background-color: #0056b3; color: #ffffff;
           - padding, border, margin, box-sizing: border-box */
    </style>
</head>
<body>
    <div class="card">
        <h2>Hộp Box Model đầu tiên</h2>
        <p>Content → Padding → Border → Margin.</p>
    </div>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes(".card") && c.includes("background-color:#0056b3") && c.includes("color:#ffffff")
        && c.includes("padding:") && c.includes("margin:") && c.includes("box-sizing:border-box");
    },
    practiceType: "theme_match",
    themePrompt: "Hãy chọn Nền màu Xanh Dương và Chữ màu Trắng (cặp màu đạt chuẩn WCAG)",
    requiredBg: "#0056b3",
    requiredText: "#ffffff",
    miniQuiz: [
      { q: "Thứ tự 4 lớp Box Model từ trong ra ngoài?", o: ["Margin → Border → Padding → Content", "Content → Padding → Border → Margin", "Content → Margin → Border → Padding", "Padding → Content → Margin → Border"], a: 1 },
      { q: "box-sizing: border-box làm gì?", o: ["Ẩn viền", "width/height bao trọn cả padding và border", "Bo tròn góc", "Đổ bóng hộp"], a: 1 },
      { q: "Tạo khoảng cách GIỮA hai card dùng thuộc tính nào?", o: ["padding", "margin", "border", "gap-inside"], a: 1 },
      { q: "Độ tương phản tối thiểu văn bản thường theo WCAG AA?", o: ["2:1", "3:1", "4.5:1", "10:1"], a: 2 }
    ]
  },
  {
    id: "lesson3",
    title: "3. Quy tắc viết code HTML/CSS chuẩn sạch",
    lang: "html",
    file: "src/lesson3.html",
    duration: "35 phút",
    overview: {
      description: "Tập thói quen viết code đẹp ngay từ đầu: đặt tên class theo BEM, thụt lề đồng nhất, không lạm dụng inline style — vì code bẩn hôm nay là bug của ngày mai.",
      outcomes: [
        "Đặt tên class theo phương pháp BEM (Block__Element--Modifier)",
        "Thụt lề 2/4 khoảng trắng đồng nhất cho mọi thẻ lồng nhau",
        "Bỏ thói quen viết style=\"...\" inline ngay từ bài đầu"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Code sạch giúp đồng nghiệp đọc hiểu và chính bạn của 3 tháng sau không "chửi" bạn của hôm nay. Ba quy tắc cốt lõi:

1. **Phương pháp BEM** (Block–Element–Modifier) đặt tên class:
> \`card\` (Block) • \`card__title\` (Element, 2 gạch dưới) • \`card__button--disabled\` (Modifier, 2 gạch ngang)

2. **Không inline style**: CSS viết trong thẻ \`<style>\` hoặc file .css riêng, không rải \`style="..."\` khắp HTML — inline style có độ ưu tiên cao khó ghi đè và không tái sử dụng được.

3. **Thụt lề đồng nhất**: 2 hoặc 4 khoảng trắng cho mỗi cấp lồng nhau — thẻ con luôn lùi vào 1 cấp so với thẻ cha.

BEM giúp CSS không xung đột độ ưu tiên (specificity conflict) khi dự án phình to — chuẩn được Google HTML/CSS Style Guide và cộng đồng khuyến nghị.`,
    labSteps: [
      "Mở src/lesson3.html — trong file có một News Card viết ẩu: class đặt bừa, style inline, không thụt lề.",
      "Đổi tên class theo BEM: news-card (block), news-card__title, news-card__image, news-card__button.",
      "Chuyển toàn bộ style=\"...\" inline vào thẻ <style> trong head, mỗi khai báo một dòng.",
      "Chỉnh thụt lề: mỗi cấp lồng nhau lùi đều 4 khoảng trắng từ trên xuống dưới.",
      "Đọc lại từ đầu: một người chưa từng thấy file này có hiểu ngay từng class là gì không?"
    ],
    commonMistakes: [
      { symptom: "Class đặt kiểu .div1, .red-text, .box2 — sau 20 dòng không nhớ cái nào là cái nào.", cause: "Đặt tên theo hình thức (màu, số thứ tự) thay vì theo vai trò nội dung.", fix: "Đặt tên theo vai trò: news-card__title, news-card__price — nhìn tên biết ngay nội dung." },
      { symptom: "CSS trong file không ăn, phải viết !important mới thắng.", cause: "Style inline trong HTML có độ ưu tiên cao hơn CSS trong <style>.", fix: "Xoá style inline, chuyển hết vào <style> — không dùng !important để chữa cháy." },
      { symptom: "Nhầm news-card--title (2 gạch ngang) với news-card__title (2 gạch dưới).", cause: "Chưa thuộc quy ước: __ là Element (bộ phận), -- là Modifier (biến thể).", fix: "Ghi nhớ: __Element là bộ phận bên trong, --modifier là trạng thái/biến thể của block." }
    ],
    challenge: "Thêm nút 'Đọc thêm' vào card với 2 biến thể BEM: news-card__button và news-card__button--disabled (màu xám, không bấm được).",
    checklist: [
      "Toàn bộ class trong file đặt theo BEM, không còn tên vô nghĩa",
      "Không còn bất kỳ style inline nào trong HTML",
      "Thụt lề đều tăm tắp từ đầu đến cuối file"
    ],
    tasks: [
      "Đặt tên class News Card theo chuẩn BEM (có class chứa __).",
      "Toàn bộ CSS nằm trong thẻ <style>, không dùng style inline."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 3: Code sạch chuẩn BEM</title>
    <style>
        /* TODO: chuyển CSS inline bên dưới vào đây, đặt tên class BEM */
    </style>
</head>
<body>
<!-- TODO: sửa card viết ẩu này theo chuẩn BEM + thụt lề đều -->
<div class="box1" style="border:1px solid gray">
<h2 style="color:blue">Tin cong nghe</h2>
<p style="font-size:14px">Noi dung tin tuc...</p>
<button style="background:green;color:white">Doc them</button>
</div>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("__") && !c.includes("style=") && c.includes("<style");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Theo phương pháp BEM, chọn tên class ĐÚNG cho tiêu đề nằm bên trong block news-card:",
      snippet: "<h2 class=\"[ ... ]\">Tin công nghệ</h2>",
      options: [
        { text: "news-card--title", correct: false },
        { text: "news-card__title", correct: true },
        { text: "newsCardTitle", correct: false },
        { text: "title1", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Theo BEM, ký hiệu nào phân tách Block và Element?", o: ["Hai gạch ngang (--)", "Hai gạch dưới (__)", "Một dấu chấm (.)", "Dấu gạch chéo (/)"], a: 1 },
      { q: "Vì sao không nên dùng style inline?", o: ["Chạy chậm", "Ưu tiên cao khó ghi đè, không tái sử dụng, khó bảo trì", "Trình duyệt cấm", "Làm nặng file gấp 10 lần"], a: 1 },
      { q: "'card__button--disabled' thì '--disabled' là thành phần gì?", o: ["Block", "Element", "Modifier (biến thể/trạng thái)", "Helper"], a: 2 }
    ]
  },
  {
    id: "lesson4",
    title: "4. Quy tắc đặt tên file & Tổ chức thư mục dự án",
    lang: "html",
    file: "src/lesson4.html",
    duration: "30 phút",
    overview: {
      description: "Không đặt tên file bừa bãi: thuộc lòng 3 kiểu đặt tên chuẩn quốc tế và cấu trúc thư mục tiêu chuẩn — thứ khiến dự án của bạn không sập khi deploy lên Linux.",
      outcomes: [
        "Phân biệt và dùng đúng kebab-case, camelCase, PascalCase",
        "Thuộc cấu trúc thư mục chuẩn: components, pages, assets, services, utils",
        "Hiểu vì sao tên file có dấu/khoảng trắng gây lỗi 404 trên Linux"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Windows không phân biệt hoa–thường trong tên file, nhưng **Linux/Unix (nơi 99% web deploy) thì có** — nên quy tắc đặt tên là chuyện sống còn:

> **kebab-case** \`user-profile-card.jsx\` — phổ biến nhất cho file HTML/CSS/component.
> **camelCase** \`userDataHelper.js\` — file tiện ích, helper.
> **PascalCase** \`UserProfileCard.jsx\` — component class/model.
> **Cấm tuyệt đối**: khoảng trắng và tiếng Việt có dấu trong tên file.

Cấu trúc thư mục tiêu chuẩn của dự án web frontend:
- \`/src/components\` — giao diện dùng chung
- \`/src/pages\` — các trang chính theo routing
- \`/src/assets\` — ảnh, icon, font tĩnh
- \`/src/services\` — code gọi API
- \`/src/utils\` — hàm xử lý chuỗi/ngày tháng dùng chung`,
    labSteps: [
      "Mở src/lesson4.html — bạn sẽ dựng một trang 'bản đồ dự án' mô tả cấu trúc thư mục.",
      "Dùng <ul>/<li> lồng nhau mô phỏng cây thư mục: src bọc ngoài, bên trong là components, pages, assets, services, utils.",
      "Bên cạnh mỗi thư mục, viết 1 ví dụ tên file đúng chuẩn (vd: components/user-profile-card.jsx).",
      "Viết thêm 1 danh sách 'tên file sai' và lý do sai (có dấu cách, có tiếng Việt, viết hoa lộn xộn).",
      "Gõ lại 3 kiểu đặt tên với 3 ví dụ mới của riêng bạn — không nhìn lại phần trên."
    ],
    commonMistakes: [
      { symptom: "Trang chạy ngon ở máy mình, deploy lên hosting thì ảnh 404.", cause: "Tên file 'Ảnh Bìa.PNG' — Linux phân biệt hoa thường và không xử lý dấu cách/dấu tiếng Việt như Windows.", fix: "Đổi thành anh-bia.png (kebab-case, không dấu) và sửa lại đường dẫn trong code." },
      { symptom: "Tìm mãi không thấy hàm formatDate nằm ở file nào.", cause: "Ném mọi file vào một thư mục gốc, không phân loại theo chức năng.", fix: "Hàm dùng chung để vào /src/utils, gọi API vào /src/services — đúng loại đúng chỗ." },
      { symptom: "Hai file UserCard.jsx và usercard.jsx cùng tồn tại gây import loạn.", cause: "Đặt tên tuỳ hứng lúc PascalCase lúc thường.", fix: "Thống nhất 1 quy ước cho cả dự án ngay từ đầu và tuân thủ tuyệt đối." }
    ],
    challenge: "Vẽ (bằng ul/li) cấu trúc thư mục cho dự án 'web bán trà sữa' của riêng bạn: tối thiểu 5 thư mục đúng chuẩn + 8 tên file đúng quy ước.",
    checklist: [
      "Đọc tên bất kỳ file nào cũng nói được nó thuộc kiểu đặt tên gì",
      "Thuộc 5 thư mục chuẩn và vai trò từng thư mục",
      "Nêu được 2 lý do tên file có dấu/khoảng trắng gây lỗi khi deploy"
    ],
    tasks: [
      "Dựng cây thư mục bằng ul/li có đủ: components, pages, assets, services, utils.",
      "Nêu đủ 3 kiểu đặt tên: kebab-case, camelCase, PascalCase."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 4: Đặt tên file & Thư mục</title>
</head>
<body>
    <h1>Bản đồ dự án chuẩn</h1>
    <!-- TODO 1: cây thư mục ul/li: src > components, pages, assets, services, utils -->
    <!-- TODO 2: liệt kê 3 kiểu đặt tên kebab-case, camelCase, PascalCase kèm ví dụ -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("components") && c.includes("pages") && c.includes("assets") && c.includes("services") && c.includes("utils")
        && c.includes("kebab-case") && c.includes("camelcase") && c.includes("pascalcase");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Tên file nào ĐÚNG chuẩn để deploy an toàn lên máy chủ Linux?",
      snippet: "src/components/[ ... ]",
      options: [
        { text: "Thẻ Người Dùng.jsx", correct: false },
        { text: "user-profile-card.jsx", correct: true },
        { text: "USER CARD.JSX", correct: false },
        { text: "thẻ-người-dùng.jsx", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Tên file 'member-portal-page.jsx' theo quy tắc nào?", o: ["PascalCase", "snake_case", "kebab-case", "camelCase"], a: 2 },
      { q: "Vì sao không đặt tên file tiếng Việt có dấu?", o: ["Code chạy chậm", "Gây lỗi đường dẫn 404 khi deploy lên Linux/Unix", "Trình duyệt cấm", "File nặng hơn"], a: 1 },
      { q: "Hàm helper định dạng tiền tệ dùng chung nên đặt ở thư mục nào?", o: ["/src/assets", "/src/utils", "/src/pages", "/src/components"], a: 1 },
      { q: "Thư mục /src/pages thường chứa gì?", o: ["Ảnh tĩnh", "Các trang chính tương ứng định tuyến URL", "File cấu hình database", "Unit test"], a: 1 }
    ]
  },
  {
    id: "lesson5",
    title: "5. JavaScript ES6+ Cú pháp cơ bản & DOM Events",
    lang: "html",
    file: "src/lesson5.html",
    duration: "50 phút",
    overview: {
      description: "Gõ đi gõ lại bộ ba const/let, hàm mũi tên và addEventListener — phản xạ nền tảng để trang web 'động đậy' theo thao tác người dùng.",
      outcomes: [
        "Khai báo biến đúng chỗ với const (mặc định) và let (khi cần gán lại)",
        "Bắt sự kiện click chuẩn bằng document.getElementById + addEventListener",
        "Cập nhật nội dung trang bằng textContent không cần tải lại trang"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo **MDN Web Docs**, JavaScript hiện đại (ES6+) có 3 phản xạ nền tảng:

1. **Khai báo biến**: \`const\` cho giá trị không gán lại (mặc định nên dùng), \`let\` khi cần gán lại. **Không dùng \`var\`** (phạm vi lỏng lẻo gây bug khó lường).

2. **DOM (Document Object Model)**: cây đối tượng đại diện trang HTML. Lấy phần tử bằng \`document.getElementById("btn")\`, đổi nội dung bằng \`.textContent\`.

3. **Sự kiện**: đăng ký bằng \`addEventListener("click", hàm_xử_lý)\` — tách biệt HTML (cấu trúc) và JS (hành vi).

> Tránh viết \`onclick="..."\` inline trong HTML: khó debug, khó gỡ, và vi phạm Content Security Policy (CSP) của các hệ thống bảo mật chuẩn.`,
    labSteps: [
      "Mở src/lesson5.html — có sẵn 1 nút bấm và 1 thẻ hiển thị bộ đếm, phần <script> đang trống.",
      "Gõ const button = document.getElementById(\"btn\"); — const vì biến này không bao giờ gán lại.",
      "Gõ let count = 0; — let vì giá trị sẽ tăng dần.",
      "Đăng ký sự kiện: button.addEventListener(\"click\", () => { ... }) với hàm mũi tên ES6.",
      "Trong hàm: count++ rồi cập nhật document.getElementById(\"result\").textContent = count;",
      "Bấm nút 3 lần xem số nhảy — rồi xoá script gõ lại từ đầu 2 lần cho thuộc."
    ],
    commonMistakes: [
      { symptom: "Console báo: Cannot read properties of null (reading 'addEventListener').", cause: "Script chạy trước khi HTML kịp tạo nút (script đặt trong <head>), hoặc gõ sai id.", fix: "Đặt <script> ở cuối <body> và kiểm tra id trong getElementById khớp 100% với HTML." },
      { symptom: "Gán lại biến báo lỗi: Assignment to constant variable.", cause: "Khai báo const cho biến cần thay đổi giá trị (bộ đếm).", fix: "Biến cần gán lại dùng let; const chỉ cho giá trị cố định." },
      { symptom: "Bấm nút không thấy gì xảy ra, không có lỗi.", cause: "Viết addEventListener(\"onclick\", ...) — tên sự kiện sai.", fix: "Tên sự kiện là \"click\" (không có 'on'). Kiểm tra bằng console.log trong hàm xử lý." }
    ],
    challenge: "Thêm nút 'Reset' thứ hai đưa bộ đếm về 0, và đổi màu số sang đỏ khi count > 5 (dùng element.style.color).",
    checklist: [
      "Phân biệt được khi nào dùng const, khi nào dùng let mà không cần nghĩ",
      "Gõ lại trọn bộ getElementById + addEventListener 2 lần không nhìn mẫu",
      "Biết mở Console (F12) để đọc lỗi khi script không chạy"
    ],
    tasks: [
      "Lấy nút bằng document.getElementById và đăng ký addEventListener(\"click\").",
      "Dùng const/let đúng chỗ và cập nhật textContent của bộ đếm."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 5: JS & DOM Events</title>
</head>
<body>
    <button id="btn">Bấm tôi đi</button>
    <p>Số lần bấm: <span id="result">0</span></p>

    <script>
        // TODO: const button = getElementById... , let count = 0
        // addEventListener("click", ...) tăng count và cập nhật textContent
    </script>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("getelementbyid") && c.includes("addeventlistener") && c.includes("click")
        && c.includes("textcontent") && (c.includes("const") || c.includes("let"));
    },
    practiceType: "js_button",
    miniQuiz: [
      { q: "Khai báo nào cho biến KHÔNG bao giờ gán lại giá trị?", o: ["let", "var", "const", "static"], a: 2 },
      { q: "Vì sao addEventListener tốt hơn onclick inline?", o: ["Chạy nhanh hơn", "Gán được nhiều listener, dễ debug, tuân thủ CSP", "Ngắn hơn", "Tự sửa lỗi"], a: 1 },
      { q: "Thuộc tính nào đổi chữ hiển thị của một phần tử?", o: ["innerColor", "textContent", "value", "label"], a: 1 },
      { q: "Vì sao nên tránh dùng var?", o: ["Bị xoá khỏi JS", "Phạm vi (scope) lỏng lẻo dễ gây bug khó lường", "Chạy chậm", "Không hoạt động với DOM"], a: 1 }
    ]
  },
  {
    id: "lesson6",
    title: "6. Kiểm tra Kiến thức Web 1",
    lang: "html",
    file: "src/lesson6.html",
    duration: "20 phút",
    overview: {
      description: "Hệ thống thi tự động kiểm tra độ 'thuộc bài' của 5 bài đầu: HTML semantic, Box Model, code sạch, đặt tên file và JavaScript DOM.",
      outcomes: [
        "Tự đánh giá độ thuộc cú pháp trước khi học tiếp",
        "Đạt tối thiểu 60% để mở khóa các bài sau"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Bài kiểm tra tự động theo mô hình đánh giá của **freeCodeCamp**: 8 câu trắc nghiệm chọn ngẫu nhiên từ ngân hàng đề, phạm vi **chỉ gồm Bài 1-5**:
- Semantic HTML & khung tài liệu chuẩn.
- CSS Box Model & tương phản WCAG.
- Quy tắc BEM & code sạch.
- Đặt tên file & tổ chức thư mục.
- JavaScript ES6+ & DOM Events.

### CÁCH THI
Mỗi câu có 4 lựa chọn, 1 đáp án đúng. Sai có thể đổi đề thi lại — mục tiêu là thuộc thật, không phải qua bài.`,
    labSteps: [
      "Ôn nhanh 5 checklist của 5 bài trước — mỗi bài 2 phút.",
      "Vào phần thi, đọc kỹ từng câu trước khi chọn.",
      "Nộp bài — đạt từ 60% (5/8 câu) là vượt qua.",
      "Dưới 60%: quay lại đúng bài bị sai, gõ lại phần thực hành rồi thi lại đề mới."
    ],
    commonMistakes: [
      { symptom: "Đọc lướt đề, chọn nhầm đáp án 'gần đúng'.", cause: "Các phương án nhiễu được thiết kế giống đáp án thật.", fix: "Đọc trọn 4 phương án rồi mới chọn, chú ý các từ 'không', 'tối thiểu', 'duy nhất'." },
      { symptom: "Thi lại nhiều lần vẫn sai đúng một chủ đề.", cause: "Học vẹt đáp án thay vì hiểu bản chất.", fix: "Mở lại bài học gốc, tự gõ lại phần thực hành của chủ đề đó rồi mới thi tiếp." }
    ],
    challenge: "Đạt 8/8 câu đúng trong một lần thi — không chỉ 60%.",
    checklist: [
      "Đã ôn lại checklist của cả 5 bài trước khi thi",
      "Đạt tối thiểu 60% và hiểu vì sao từng câu sai (nếu có)"
    ],
    tasks: ["Hoàn thành bài thi 8 câu trắc nghiệm, đạt tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 8,
    quizPool: [
      { q: "Khai báo nào giúp trình duyệt chạy trang ở chế độ chuẩn?", o: ["<html>", "<!DOCTYPE html>", "<meta charset>", "<head>"], a: 1 },
      { q: "Thẻ semantic nào dành cho khối điều hướng chính?", o: ["<menu>", "<nav>", "<aside>", "<links>"], a: 1 },
      { q: "Mỗi trang chỉ nên có một thẻ nào?", o: ["<section>", "<main>", "<article>", "<div>"], a: 1 },
      { q: "Trong Box Model, lớp nào nằm giữa content và border?", o: ["margin", "padding", "outline", "gap"], a: 1 },
      { q: "box-sizing: border-box có tác dụng gì?", o: ["Bo góc hộp", "width bao trọn padding và border", "Ẩn viền", "Tăng margin"], a: 1 },
      { q: "Độ tương phản tối thiểu cho văn bản thường theo WCAG AA?", o: ["2:1", "3:1", "4.5:1", "7:1"], a: 2 },
      { q: "Theo BEM, 'card__title' thì '__title' là gì?", o: ["Block", "Element", "Modifier", "State"], a: 1 },
      { q: "Vì sao tránh style inline trong HTML?", o: ["Trình duyệt cấm", "Ưu tiên cao khó ghi đè và không tái sử dụng", "Chạy chậm", "Sai cú pháp"], a: 1 },
      { q: "Tên file nào an toàn khi deploy lên Linux?", o: ["Trang Chủ.html", "trang-chu.html", "TRANG CHU.HTML", "trangchủ.html"], a: 1 },
      { q: "Hàm gọi API dùng chung nên đặt ở thư mục nào?", o: ["/src/assets", "/src/services", "/src/pages", "/public"], a: 1 },
      { q: "Từ khóa khai báo biến có thể gán lại giá trị, phạm vi block?", o: ["const", "var", "let", "static"], a: 2 },
      { q: "Hàm nào lấy phần tử theo id trong DOM?", o: ["document.querySelectorAll", "document.getElementById", "document.getName", "window.find"], a: 1 },
      { q: "Tên sự kiện đúng khi đăng ký bấm chuột qua addEventListener?", o: ["onclick", "click", "press", "tap"], a: 1 },
      { q: "Thuộc tính nào cập nhật chữ hiển thị của phần tử?", o: ["textContent", "innerColor", "content", "text-style"], a: 0 }
    ]
  },
  {
    id: "lesson7",
    title: "7. Cơ sở dữ liệu SQL & Câu lệnh MySQL Basics",
    lang: "sql",
    file: "src/lesson7.sql",
    duration: "50 phút",
    overview: {
      description: "Gõ nát bộ tứ SELECT – INSERT – UPDATE – DELETE trên MySQL: bốn câu lệnh mà mọi ứng dụng có dữ liệu đều xoay quanh, cần thuộc như bảng cửu chương.",
      outcomes: [
        "Viết trọn bộ 4 câu lệnh CRUD chuẩn cú pháp không nhìn tài liệu",
        "Luôn dùng WHERE khi UPDATE/DELETE — phản xạ chống mất dữ liệu",
        "Giới hạn kết quả bằng LIMIT để bảo vệ hiệu năng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo **W3Schools SQL Tutorial** và chuẩn **ANSI SQL**, dữ liệu quan hệ lưu trong bảng (cột + dòng). Bộ tứ CRUD:

> **SELECT** \`SELECT * FROM users WHERE status = 'active' LIMIT 5;\` — đọc
> **INSERT** \`INSERT INTO users (name, email) VALUES ('Hugo', 'a@b.com');\` — thêm
> **UPDATE** \`UPDATE users SET status = 'banned' WHERE id = 3;\` — sửa
> **DELETE** \`DELETE FROM users WHERE id = 3;\` — xoá

Quy ước: viết **HOA từ khóa SQL**, kết thúc bằng \`;\`.

**Luật sinh tồn số 1**: UPDATE/DELETE **không có WHERE** sẽ sửa/xoá TOÀN BỘ bảng — lỗi kinh điển làm bay dữ liệu production. LIMIT chặn việc kéo hàng triệu dòng làm sập server.`,
    labSteps: [
      "Mở src/lesson7.sql — file trống, gõ lần lượt 4 câu lệnh theo thứ tự SELECT → INSERT → UPDATE → DELETE.",
      "SELECT: lấy người dùng active, giới hạn 5 dòng (WHERE + LIMIT).",
      "INSERT INTO users (name, email) VALUES (...) — số cột phải khớp số giá trị.",
      "UPDATE ... SET ... WHERE id = 1 — gõ WHERE TRƯỚC khi gõ SET để thành phản xạ.",
      "DELETE FROM ... WHERE id = 1 — tự hỏi 'câu này có WHERE chưa?' trước khi chạy.",
      "Chạy thử bằng nút Run (giả lập MySQL) rồi xoá hết, gõ lại cả 4 câu lần nữa."
    ],
    commonMistakes: [
      { symptom: "Chạy UPDATE xong toàn bộ bảng bị đổi giá trị.", cause: "Quên mệnh đề WHERE — SQL hiểu là áp cho mọi dòng.", fix: "Luôn viết WHERE trước khi hoàn thiện câu UPDATE/DELETE; kiểm tra bằng SELECT cùng điều kiện WHERE trước." },
      { symptom: "INSERT báo lỗi Column count doesn't match.", cause: "Số cột khai báo và số VALUES không khớp nhau.", fix: "Đếm lại: (name, email) = 2 cột thì VALUES phải đúng 2 giá trị theo thứ tự." },
      { symptom: "Truy vấn treo lâu khi bảng lớn.", cause: "SELECT * không LIMIT trên bảng hàng trăm nghìn dòng.", fix: "Thêm LIMIT khi thăm dò dữ liệu và chỉ SELECT các cột cần thiết." }
    ],
    challenge: "Viết chuỗi 4 lệnh cho bảng products (id, name, price): thêm 2 sản phẩm, tăng giá sản phẩm id=1 thêm 10%, xoá sản phẩm id=2, đọc lại toàn bộ giới hạn 10 dòng.",
    checklist: [
      "Gõ được cả 4 câu CRUD không nhìn tài liệu",
      "Chưa từng gõ UPDATE/DELETE thiếu WHERE trong bài này",
      "Giải thích được vì sao cần LIMIT"
    ],
    tasks: [
      "Viết đủ 4 câu lệnh: SELECT (có WHERE + LIMIT), INSERT INTO, UPDATE (có WHERE), DELETE (có WHERE)."
    ],
    starterCode: `-- BÀI 7: Gõ bộ tứ CRUD trên bảng users
-- TODO 1: SELECT người dùng active, LIMIT 5
-- TODO 2: INSERT INTO users (name, email) VALUES (...)
-- TODO 3: UPDATE status người dùng id = 1 (nhớ WHERE!)
-- TODO 4: DELETE người dùng id = 2 (nhớ WHERE!)
`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("SELECT") && c.includes("WHERE") && c.includes("LIMIT")
        && c.includes("INSERT INTO") && c.includes("VALUES")
        && c.includes("UPDATE") && c.includes("SET")
        && c.includes("DELETE FROM");
    },
    practiceType: "drag_drop_sql",
    dragBlocks: [
      { id: "s1", text: "SELECT *" },
      { id: "s2", text: "FROM users" },
      { id: "s3", text: "WHERE status = 'active'" },
      { id: "s4", text: "LIMIT 5" }
    ],
    correctOrder: ["s1", "s2", "s3", "s4"],
    miniQuiz: [
      { q: "Câu lệnh nào thêm bản ghi mới vào bảng?", o: ["ADD RECORD", "INSERT INTO", "CREATE ROW", "UPDATE"], a: 1 },
      { q: "UPDATE thiếu WHERE sẽ gây ra điều gì?", o: ["Báo lỗi cú pháp", "Sửa TOÀN BỘ các dòng trong bảng", "Không làm gì", "Chỉ sửa dòng đầu"], a: 1 },
      { q: "LIMIT 5 có ý nghĩa gì?", o: ["Lấy 5 cột", "Trả về tối đa 5 dòng", "Lọc giá trị > 5", "Xoá 5 dòng"], a: 1 },
      { q: "RDBMS lưu dữ liệu dưới dạng nào?", o: ["Cây tự do", "Bảng gồm cột và dòng", "File văn bản thô", "Đồ thị"], a: 1 }
    ]
  },
  {
    id: "lesson8",
    title: "8. Backend PHP & Kết nối MySQL thuần",
    lang: "php",
    file: "src/lesson8.php",
    duration: "50 phút",
    overview: {
      description: "Gõ đi gõ lại hàm kết nối PDO và truy vấn đầu tiên: biến – echo – kết nối database — bộ phản xạ tối thiểu của lập trình viên backend PHP.",
      outcomes: [
        "Thuộc cú pháp PHP: thẻ <?php ?>, biến $, echo, nối chuỗi bằng dấu chấm",
        "Gõ được khối kết nối PDO chuẩn kèm try/catch không nhìn mẫu",
        "Chạy truy vấn qua prepare + execute ngay từ ngày đầu (chưa cần hiểu sâu, cần thuộc)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
PHP chạy **phía máy chủ** (server-side): trình duyệt chỉ nhận HTML kết quả, không thấy code PHP. Cú pháp nền:

> Mã PHP nằm giữa \`<?php\` và \`?>\` • Biến bắt đầu bằng \`$\` • In ra bằng \`echo\` • Nối chuỗi bằng dấu chấm \`.\`

Kết nối MySQL dùng **PDO** (PHP Data Objects) — chuẩn kết nối hướng đối tượng:

\`\`\`php
$pdo = new PDO("mysql:host=localhost;dbname=shop", "root", "");
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
\`\`\`

Cặp \`prepare()\` + \`execute()\` là cách truy vấn an toàn duy nhất (chống SQL Injection — học sâu ở Chặng 4). Ở chặng này: **gõ cho thuộc khuôn**, thành phản xạ mặc định.`,
    labSteps: [
      "Mở src/lesson8.php — gõ thẻ mở <?php ở dòng 1.",
      "Khai báo $title = \"Học Backend PHP\"; rồi echo \"Chào mừng: \" . $title; — chú ý dấu chấm nối chuỗi.",
      "Gõ khối kết nối: $pdo = new PDO(\"mysql:host=localhost;dbname=shop\", \"root\", \"\"); bọc trong try { ... } catch (PDOException $e) { ... }.",
      "Gõ truy vấn khuôn mẫu: $stmt = $pdo->prepare(\"SELECT * FROM users WHERE id = ?\"); $stmt->execute([1]);",
      "Bấm Run (giả lập PHP) xem kết quả — rồi xoá và gõ lại trọn khối kết nối 2 lần."
    ],
    commonMistakes: [
      { symptom: "Trình duyệt hiện nguyên văn code PHP thay vì kết quả.", cause: "Mở file .php trực tiếp bằng trình duyệt, không qua máy chủ PHP (XAMPP/php -S).", fix: "PHP phải chạy qua server: dùng XAMPP hoặc lệnh php -S localhost:8000 rồi truy cập qua http://localhost." },
      { symptom: "Lỗi: syntax error, unexpected token echo.", cause: "Quên dấu chấm phẩy ; kết thúc dòng lệnh phía trên.", fix: "Mỗi lệnh PHP kết thúc bằng ; — đọc kỹ số dòng trong thông báo lỗi, lỗi thường ở dòng NGAY TRƯỚC." },
      { symptom: "Nối chuỗi bằng dấu + ra kết quả 0 hoặc lỗi.", cause: "Thói quen từ JavaScript — PHP nối chuỗi bằng dấu chấm, dấu + là phép cộng số.", fix: "Đổi \"Chào \" + $name thành \"Chào \" . $name." }
    ],
    challenge: "Viết thêm biến $price = 99000 và echo ra dòng 'Giá khoá học: 99,000đ' bằng hàm number_format($price) nối chuỗi.",
    checklist: [
      "Thuộc 4 cú pháp nền: <?php ?>, $bien, echo, nối chuỗi bằng dấu chấm",
      "Gõ lại khối PDO + try/catch 2 lần không nhìn mẫu",
      "Nhớ khuôn prepare() + execute() như một cặp không tách rời"
    ],
    tasks: [
      "Viết thẻ <?php ?>, khai báo biến $, echo nối chuỗi bằng dấu chấm.",
      "Gõ khối kết nối new PDO và truy vấn prepare + execute."
    ],
    starterCode: `<?php
// BÀI 8: Gõ theo các bước trong phần Thực hành
// TODO 1: biến $title và echo nối chuỗi bằng dấu chấm
// TODO 2: try/catch kết nối new PDO("mysql:host=localhost;dbname=shop", "root", "")
// TODO 3: $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?"); $stmt->execute([1]);
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("<?php") && c.includes("$") && c.includes("echo")
        && c.includes("newPDO(") && c.includes("prepare(") && c.includes("execute(");
    },
    practiceType: "php_match",
    matchPairs: [
      { key: "$ (Đô-la)", val: "Khai báo biến" },
      { key: "echo", val: "In dữ liệu ra HTML" },
      { key: "new PDO(...)", val: "Kết nối Cơ sở dữ liệu" },
      { key: ". (Dấu chấm)", val: "Ghép hai chuỗi ký tự" }
    ],
    miniQuiz: [
      { q: "Mã PHP chạy ở đâu?", o: ["Trình duyệt của khách", "Phía máy chủ (server-side)", "Trong file CSS", "Trên GPU"], a: 1 },
      { q: "Toán tử nối chuỗi trong PHP là gì?", o: ["Dấu cộng (+)", "Dấu chấm (.)", "Dấu và (&)", "Dấu phẩy (,)"], a: 1 },
      { q: "Vì sao dùng PDO thay cho mysql_connect kiểu cũ?", o: ["Chạy nhanh gấp 10", "Hỗ trợ Prepared Statements chống SQL Injection", "Dễ gõ hơn", "Chỉ chạy trên Linux"], a: 1 },
      { q: "Cặp hàm truy vấn an toàn của PDO là gì?", o: ["query + fetch", "prepare + execute", "run + get", "select + where"], a: 1 }
    ]
  },
  {
    id: "lesson9",
    title: "9. Bug Hunting & Kỹ thuật Debugging cơ bản",
    lang: "php",
    file: "src/lesson9.php",
    duration: "45 phút",
    overview: {
      description: "Săn 4 con bug kinh điển và luyện bộ công cụ soi lỗi var_dump, print_r (PHP) và console.log (JS) — kỹ năng khiến bạn hết 'sợ lỗi' ngay từ chặng đầu.",
      outcomes: [
        "Phân biệt lỗi cú pháp (sập ngay) và lỗi logic (chạy nhưng sai)",
        "Dùng var_dump/print_r soi giá trị và kiểu dữ liệu biến PHP",
        "Vá 4 bug kinh điển: vượt biên mảng, sai kiểu, biến null, truy vấn nối chuỗi"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo quy trình gỡ lỗi của **MDN** và **The Odin Project**, có 2 họ lỗi:

> **Syntax Error** — sai cú pháp, chương trình sập ngay, thông báo có số dòng.
> **Logic Bug** — chạy bình thường nhưng kết quả sai. Nguy hiểm hơn nhiều.

Bộ công cụ soi lỗi cơ bản:
- PHP: \`var_dump($x)\` in giá trị **kèm kiểu dữ liệu**; \`print_r($arr)\` in mảng dễ đọc.
- JS: \`console.log(x)\` in ra Console trình duyệt (F12).

4 bug kinh điển sẽ vá trong bài:
1. **Vượt biên mảng**: lặp \`<=\` count thay vì \`<\` count.
2. **Sai kiểu dữ liệu**: cộng chuỗi "99" với số — cần ép kiểu \`(int)\`.
3. **Biến chưa tồn tại**: đọc \`$_GET['action']\` khi không có — dùng \`??\` đặt mặc định.
4. **Truy vấn nối chuỗi thô**: thay bằng \`prepare()\` + \`execute()\` (khuôn đã học Bài 8).`,
    labSteps: [
      "Mở src/lesson9.php — trong file có 4 khối code, mỗi khối chứa đúng 1 bug được đánh dấu BUG #1..#4.",
      "BUG #1: chạy thử, dùng var_dump(count($products)) soi độ dài mảng rồi sửa <= thành <.",
      "BUG #2: var_dump($price) thấy string(2) — thêm (int) trước biến để ép kiểu rồi mới cộng.",
      "BUG #3: thêm ?? null (toán tử null coalescing) khi đọc $_GET['action'] để có giá trị mặc định.",
      "BUG #4: xoá câu SQL nối chuỗi, thay bằng khuôn prepare(\"... WHERE id = ?\") + execute([$id]).",
      "Chạy lại toàn file: 4 khối in kết quả đúng, không còn warning."
    ],
    commonMistakes: [
      { symptom: "Sửa bug xong chạy vẫn sai, loay hoay không biết tại đâu.", cause: "Sửa mò không soi giá trị thực tế của biến.", fix: "Nguyên tắc vàng: var_dump biến nghi ngờ TRƯỚC khi sửa — nhìn giá trị thật rồi mới kết luận." },
      { symptom: "echo một mảng ra chữ 'Array' vô dụng.", cause: "echo chỉ in được chuỗi/số, không in được cấu trúc mảng.", fix: "Dùng print_r($arr) hoặc var_dump($arr) cho mảng/đối tượng." },
      { symptom: "Undefined array key 'action' khi mở trang không có tham số.", cause: "Đọc key không tồn tại trong $_GET.", fix: "$action = $_GET['action'] ?? null; — luôn có mặc định cho dữ liệu từ ngoài vào." }
    ],
    challenge: "Tự cài thêm 1 bug thứ 5 (chia cho 0) vào file, rồi dùng var_dump truy ra và vá bằng câu điều kiện kiểm tra mẫu số.",
    checklist: [
      "Phân biệt được lỗi cú pháp và lỗi logic qua triệu chứng",
      "Đã dùng var_dump/print_r ít nhất 3 lần trong bài",
      "Vá đủ 4 bug và giải thích được nguyên nhân từng con"
    ],
    tasks: [
      "Bug #1: sửa điều kiện lặp vượt biên thành < count.",
      "Bug #2: ép kiểu (int) cho biến chuỗi trước khi cộng.",
      "Bug #3: dùng ?? bảo vệ $_GET['action'].",
      "Bug #4: thay truy vấn nối chuỗi bằng prepare + execute."
    ],
    starterCode: `<?php
// BUG #1: Vòng lặp vượt biên mảng — chạy thử sẽ thấy warning
$products = ['A', 'B', 'C', 'D', 'E'];
for ($i = 0; $i <= count($products); $i++) {
  echo $products[$i];
}

// BUG #2: Sai kiểu dữ liệu — "99" là chuỗi, kết quả cộng sai ý đồ
$price = "99";
$newPrice = $price + "10 JOY";
var_dump($newPrice);

// BUG #3: Đọc tham số không tồn tại — Undefined array key
$action = $_GET['action'];
if ($action) { echo "Hành động: " . $action; }

// BUG #4: Truy vấn nối chuỗi thô — nguy hiểm, thay bằng prepare/execute
$id = $_GET['id'] ?? 0;
$stmt = $pdo->query("SELECT * FROM users WHERE id = " . $id);
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const bug1 = c.includes("<count($products)");
      const bug2 = c.includes("(int)$price") || c.includes("intval($price)");
      const bug3 = c.includes("$_get['action']??") || c.includes('$_get["action"]??') || c.includes("isset($_get['action'])");
      const bug4 = c.includes("prepare(") && c.includes("execute(");
      return bug1 && bug2 && bug3 && bug4;
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn toán tử sửa lỗi vòng lặp vượt biên mảng (Bug #1):",
      snippet: "for ($i = 0; $i [ ... ] count($products); $i++) {",
      options: [
        { text: "< (nhỏ hơn số phần tử)", correct: true },
        { text: "<= (nhỏ hơn hoặc bằng)", correct: false },
        { text: "== (so sánh bằng)", correct: false },
        { text: "> (lớn hơn)", correct: false }
      ],
      correctIdx: 0
    },
    hints: [
      "Bug #1: mảng 5 phần tử có chỉ số 0-4, điều kiện <= chạy tới chỉ số 5.",
      "Bug #2: var_dump cho biết kiểu thật của biến trước khi cộng.",
      "Bug #3: toán tử ?? trả vế trái nếu tồn tại và khác null, ngược lại trả vế phải.",
      "Bug #4: dùng lại khuôn prepare + execute đã thuộc ở Bài 8."
    ],
    resources: [
      { title: "PHP var_dump", url: "https://www.php.net/manual/en/function.var-dump.php" },
      { title: "OWASP SQL Injection", url: "https://owasp.org/www-community/attacks/SQL_Injection" }
    ],
    miniQuiz: [
      { q: "Hàm PHP nào in giá trị KÈM kiểu dữ liệu của biến?", o: ["echo", "var_dump", "printf", "die"], a: 1 },
      { q: "Lỗi logic khác lỗi cú pháp thế nào?", o: ["Không khác", "Chương trình vẫn chạy nhưng kết quả sai", "Luôn hiện số dòng lỗi", "Chỉ xảy ra trong CSS"], a: 1 },
      { q: "Toán tử ?? trong PHP dùng để làm gì?", o: ["Phép chia", "Trả vế trái nếu tồn tại và khác null, ngược lại trả vế phải", "So sánh bằng", "Nối chuỗi"], a: 1 },
      { q: "Mảng 5 phần tử có chỉ số từ đâu đến đâu?", o: ["1 đến 5", "0 đến 4", "0 đến 5", "1 đến 4"], a: 1 }
    ]
  },
  {
    id: "lesson10",
    title: "10. CSS Flexbox & Giao diện Responsive cơ bản",
    lang: "html",
    file: "src/lesson10.html",
    duration: "55 phút",
    overview: {
      description: "Kết chặng bằng bố cục thật: dàn menu bằng Flexbox và làm nó tự xếp dọc trên điện thoại bằng media query — nộp ảnh chụp kết quả để hệ thống chấm.",
      outcomes: [
        "Kích hoạt Flexbox bằng display: flex và dàn hàng bằng justify-content",
        "Viết media query @media (max-width: 768px) đổi hướng flex-direction",
        "Hiểu vai trò thẻ meta viewport với hiển thị di động"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo giáo trình **freeCodeCamp Responsive Web Design** và **MDN**:

**Flexbox** — công cụ dàn trang 1 chiều: đặt \`display: flex\` lên phần tử **cha**, các con tự xếp thành hàng.
> \`justify-content\` căn theo trục chính (space-between, center...) • \`align-items\` căn trục phụ • \`flex-direction: row | column\` đổi hướng • \`gap\` tạo khoảng cách giữa các con.

**Responsive** — giao diện tự thích ứng kích thước màn hình:
> Bắt buộc có \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\` trong head.
> \`@media (max-width: 768px) { ... }\` — gói CSS chỉ chạy khi màn hình ≤ 768px (điện thoại/tablet dọc).

Khuôn kinh điển: desktop menu nằm ngang (\`row\`), mobile xếp dọc (\`column\`).`,
    labSteps: [
      "Mở src/lesson10.html — có sẵn nav chứa 4 liên kết chưa dàn trang.",
      "Kiểm tra <meta name=\"viewport\"> đã có trong head chưa — thiếu là responsive vô nghĩa.",
      "Gõ nav { display: flex; justify-content: space-between; gap: 16px; } — F5 xem menu dàn ngang.",
      "Gõ khối @media (max-width: 768px) { nav { flex-direction: column; align-items: center; } }.",
      "Mở DevTools (F12) → biểu tượng điện thoại (Responsive Mode) → kéo chiều rộng qua mốc 768px xem menu tự đổi dọc/ngang.",
      "Chụp màn hình kết quả ở chế độ mobile và tải lên hệ thống chấm điểm."
    ],
    commonMistakes: [
      { symptom: "Viết display: flex lên từng mục con mà menu không dàn hàng.", cause: "Flexbox áp lên phần tử CHA (container), không phải các con.", fix: "Chuyển display: flex lên thẻ nav bọc ngoài; các thẻ a bên trong tự thành flex item." },
      { symptom: "Thu nhỏ trình duyệt mà media query không ăn.", cause: "Thiếu meta viewport hoặc viết sai cú pháp @media (thiếu ngoặc, sai max-width).", fix: "Thêm meta viewport vào head và kiểm tra khối @media (max-width: 768px) { ... } đủ ngoặc." },
      { symptom: "Các mục menu dính sát nhau xấu xí.", cause: "Chưa có khoảng cách giữa các flex item.", fix: "Thêm gap: 16px vào container flex — hiện đại hơn margin từng con." }
    ],
    challenge: "Thêm khối 3 thẻ card sản phẩm dưới menu: desktop 3 cột ngang (flex), mobile xếp dọc 1 cột — dùng lại đúng khuôn @media vừa học.",
    checklist: [
      "Menu dàn ngang trên desktop, tự xếp dọc khi màn hình ≤ 768px",
      "Đã kiểm tra bằng Responsive Mode của DevTools",
      "Thuộc khuôn: display flex trên cha + @media đổi flex-direction"
    ],
    tasks: [
      "Dàn nav bằng display: flex và justify-content.",
      "Viết @media (max-width: 768px) đổi flex-direction thành column.",
      "Chụp màn hình kết quả mobile và tải lên hệ thống."
    ],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bài 10: Flexbox & Responsive</title>
  <style>
    /* TODO 1: nav { display: flex; justify-content: space-between; gap: 16px; } */

    /* TODO 2: @media (max-width: 768px) { nav { flex-direction: column; align-items: center; } } */
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="#">Trang chủ</a>
      <a href="#">Khoá học</a>
      <a href="#">Dự án</a>
      <a href="#">Liên hệ</a>
    </nav>
  </header>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("display:flex") && c.includes("justify-content") && c.includes("@media") && c.includes("flex-direction:column");
    },
    practiceType: "screenshot_upload",
    miniQuiz: [
      { q: "display: flex phải đặt lên phần tử nào?", o: ["Từng phần tử con", "Phần tử cha (container)", "Thẻ body", "Thẻ html"], a: 1 },
      { q: "Thuộc tính nào đổi hướng xếp của các flex item?", o: ["justify-content", "align-items", "flex-direction", "flex-wrap"], a: 2 },
      { q: "@media (max-width: 768px) áp dụng CSS khi nào?", o: ["Màn hình rộng hơn 768px", "Màn hình từ 768px trở xuống", "Chỉ khi in trang", "Mọi lúc"], a: 1 },
      { q: "Thẻ meta viewport có vai trò gì?", o: ["Tối ưu SEO", "Trang hiển thị đúng tỷ lệ trên thiết bị di động", "Nén ảnh", "Chống hack"], a: 1 }
    ]
  }
];
