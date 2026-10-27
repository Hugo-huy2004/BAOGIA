export default {
  id: "step4",
  lang: "css",
  file: "nhip/css/style.css",
  duration: "110 phút",
  summary: "Hiểu cách CSS chọn và xếp phần tử: box model, cascade, flexbox, biến CSS, responsive — rồi khoác giao diện mạng xã hội cho Nhịp.",
  slides: [
    {
      section: "intro",
      title: "Từ bộ xương tới gương mặt",
      body: `HTML ở step 3 đã đúng nghĩa nhưng trông như văn bản năm 1995. CSS quyết định **mọi thứ nhìn thấy được**: màu, cỡ chữ, khoảng cách, bố cục, cách trang co giãn trên điện thoại.

Step này không dạy thuộc lòng thuộc tính — dạy **cách CSS suy nghĩ**, để bạn tự tra được thuộc tính nào cũng hiểu.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `- Viết bộ chọn (selector) và hiểu **cascade**: khi hai luật đánh nhau, luật nào thắng.
- Nắm **box model**: content, padding, border, margin.
- Dựng bố cục bằng **flexbox**.
- Dùng **biến CSS** cho màu và khoảng cách.
- Làm Nhịp **responsive** và đạt tương phản chuẩn WCAG.`,
    },
    {
      section: "visual",
      title: "Box model",
      visual: "box-model",
      body: "Mọi phần tử là một chiếc hộp bốn lớp: **nội dung** → **padding** (đệm trong) → **border** (viền) → **margin** (khoảng cách với hộp khác). Với `box-sizing: border-box`, chiều rộng bạn khai báo đã gồm cả padding và viền — dễ tính hơn hẳn.",
    },
    {
      section: "visual",
      title: "Flexbox: hai trục",
      visual: "flex-axes",
      body: "Flexbox xếp con theo **trục chính** (mặc định ngang) và căn theo **trục phụ**. `justify-content` lo trục chính, `align-items` lo trục phụ, `gap` lo khoảng cách giữa các con.",
    },
    {
      section: "visual",
      title: "Một thẻ bài đăng, đã bóc lớp",
      visual: "post-layout",
      body: "Thẻ bài của Nhịp là hai cột flex: ảnh đại diện cố định bên trái, thân bài co giãn bên phải. Trong thân bài, phần đầu lại là một hàng flex: tên bên trái, giờ bên phải.",
    },
    {
      section: "research",
      title: "Thiết kế đáp ứng",
      body: `Ethan Marcotte (2010) đặt tên cho **responsive web design**: một trang duy nhất co giãn theo màn hình nhờ lưới linh hoạt, ảnh linh hoạt và media query — thay vì làm một trang riêng cho điện thoại.

Ngày nay đa số lượt truy cập web đến từ điện thoại, nên Nhịp thiết kế **điện thoại trước** (mobile-first), rồi mới nới cho màn lớn.

> Marcotte, E. (2010) 'Responsive Web Design', *A List Apart*, 25 May. Available at: https://alistapart.com/article/responsive-web-design/`,
    },
    {
      section: "research",
      title: "Tương phản và vùng chạm theo WCAG",
      body: `Hai con số chuẩn quốc tế bạn phải thuộc:

- **Tương phản 4,5:1** giữa chữ thường và nền (WCAG 2.2, tiêu chí 1.4.3); chữ lớn 3:1.
- **Vùng chạm tối thiểu 24×24 px** (tiêu chí 2.5.8). Nút trên điện thoại nên rộng rãi hơn, khoảng 44 px.

Chữ xám nhạt trên nền trắng trông "tinh tế" nhưng nhiều người không đọc được.

> W3C (2023) *Web Content Accessibility Guidelines (WCAG) 2.2*. Available at: https://www.w3.org/TR/WCAG22/`,
    },
    {
      section: "research",
      title: "Chuẩn CSS",
      body: `CSS do W3C chuẩn hoá thành từng **module** độc lập. Hai module dùng nhiều nhất ở step này:

> W3C (2024) *CSS Box Model Module Level 3*. Available at: https://www.w3.org/TR/css-box-3/
>
> W3C (2018) *CSS Flexible Box Layout Module Level 1*. Available at: https://www.w3.org/TR/css-flexbox-1/
>
> Mozilla (2025) *CSS: Cascading Style Sheets*, MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/CSS`,
    },
    {
      section: "ideate",
      title: "Hệ thống thiết kế tối giản cho Nhịp",
      body: `Trước khi viết CSS, chốt vài quyết định để cả trang nhất quán:

- **Một màu nền, một màu chữ, một màu nhấn** (nút Đăng, tim đã thả).
- **Thang khoảng cách** 4 – 8 – 12 – 16 – 24 px, không dùng số lẻ tuỳ hứng.
- **Cỡ chữ** thân 15–16 px, tên người dùng đậm.
- **Cột nội dung** tối đa 620 px, căn giữa — mắt đọc thoải mái.

Mọi giá trị này thành **biến CSS** ở đầu tệp.`,
    },
    {
      section: "ideate",
      title: "Điện thoại trước",
      body: `Viết CSS cho màn hẹp trước — đó là trường hợp khó nhất. Sau đó chỉ thêm vài luật trong \`@media (min-width: 700px)\` để nới rộng cho máy tính.

Ngược lại (máy tính trước rồi ép xuống điện thoại) thường phải ghi đè rất nhiều luật.`,
    },
    {
      section: "core",
      title: "Bộ chọn và luật",
      body: `~~~css
/* bộ chọn  { thuộc tính: giá trị; } */
.post { padding: 12px; }           /* class */
#composer { margin-bottom: 16px; } /* id */
.post-head a { font-weight: 700; } /* a nằm trong .post-head */
.like:hover { color: crimson; }    /* trạng thái */
~~~

Thói quen tốt: **tạo kiểu bằng class**, tránh id (quá mạnh, khó ghi đè) và tránh tạo kiểu theo tên thẻ trần (ảnh hưởng toàn trang).`,
    },
    {
      section: "core",
      title: "Cascade và độ ưu tiên",
      body: `Khi hai luật cùng đặt một thuộc tính, trình duyệt xét lần lượt:

1. **Độ quan trọng** — \`!important\` thắng (tránh dùng).
2. **Độ ưu tiên** (specificity) — id > class > tên thẻ.
3. **Thứ tự** — cùng độ ưu tiên thì luật viết sau thắng.

~~~css
.post p { color: black; }   /* 1 class + 1 thẻ */
p { color: red; }           /* 1 thẻ — thua dù viết sau */
~~~`,
    },
    {
      section: "core",
      title: "Đơn vị",
      body: `- \`px\` — cố định, dùng cho viền, bóng.
- \`rem\` — bội số cỡ chữ gốc (thường 16 px). Dùng cho cỡ chữ để tôn trọng cài đặt cỡ chữ của người dùng.
- \`%\` — so với phần tử cha.
- \`vw\`, \`vh\` — phần trăm khung nhìn.
- \`max-width: 620px\` + \`width: 100%\` — co theo màn nhỏ, dừng ở 620 px trên màn lớn.`,
    },
    {
      section: "core",
      title: "Flexbox trong ba dòng",
      body: `~~~css
.post {
  display: flex;      /* con xếp thành hàng */
  gap: 12px;          /* khoảng cách giữa các con */
  align-items: flex-start;
}
.post-body { flex: 1; min-width: 0; }  /* chiếm phần còn lại */
~~~

\`min-width: 0\` cho phép thân bài co lại — thiếu nó, một chữ rất dài sẽ đẩy tràn cả trang ra ngoài màn hình.`,
    },
    {
      section: "core",
      title: "Biến CSS",
      body: `~~~css
:root {
  --bg: #ffffff;
  --text: #101010;
  --muted: #5f5f5f;     /* vẫn đạt 4,5:1 trên nền trắng */
  --accent: #0a66ff;
  --line: #e5e5e5;
  --space: 12px;
}
.post { padding: var(--space); border-bottom: 1px solid var(--line); }
~~~

Đổi một biến là đổi cả trang. Bước sau: định nghĩa lại biến trong \`@media (prefers-color-scheme: dark)\` là có ngay chế độ tối.`,
    },
    {
      section: "core",
      title: "Media query",
      body: `~~~css
/* mặc định: điện thoại */
.feed { padding: 0 12px; }

/* từ 700px trở lên: máy tính bảng, máy tính */
@media (min-width: 700px) {
  .feed { padding: 0; }
  .composer { border: 1px solid var(--line); border-radius: 16px; }
}
~~~

Thử bằng DevTools: bấm biểu tượng điện thoại (Toggle device toolbar) để xem trang ở nhiều cỡ màn.`,
    },
    {
      section: "apply",
      title: "Nền tảng và biến",
      body: "Mở `css/style.css`, bắt đầu bằng phần nền tảng. `visually-hidden` giấu chữ khỏi mắt nhưng trình đọc màn hình vẫn đọc — dùng cho `h1` của bảng tin.",
      code: {
        file: "nhip/css/style.css",
        lang: "css",
        content: `:root {
  --bg: #ffffff;
  --text: #101010;
  --muted: #5f5f5f;
  --accent: #0a66ff;
  --line: #e5e5e5;
  --radius: 16px;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #101010; --text: #f3f5f7; --muted: #a0a0a0; --line: #2a2a2a; }
}

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font: 1rem/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
}
a { color: inherit; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}`,
      },
    },
    {
      section: "apply",
      title: "Thanh trên và cột nội dung",
      body: "Thanh trên dính ở đỉnh khi cuộn. Cột nội dung rộng tối đa 620 px và căn giữa.",
      code: {
        file: "nhip/css/style.css",
        lang: "css",
        content: `.topbar {
  position: sticky; top: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
.logo { font-weight: 800; font-size: 1.25rem; text-decoration: none; }
.topbar nav { display: flex; gap: 16px; }
.topbar nav a { text-decoration: none; color: var(--muted); }
.topbar nav a[aria-current="page"] { color: var(--text); font-weight: 700; }

.feed, .profile { width: 100%; max-width: 620px; margin: 0 auto; padding: 0 12px; }`,
      },
    },
    {
      section: "apply",
      title: "Ô soạn bài",
      body: "`:focus-visible` hiện viền khi người dùng đi bằng bàn phím — đừng bao giờ xoá viền focus mà không thay bằng thứ khác.",
      code: {
        file: "nhip/css/style.css",
        lang: "css",
        content: `.composer { padding: 16px 0; border-bottom: 1px solid var(--line); }
.composer label { display: block; font-weight: 700; margin-bottom: 8px; }
.composer textarea {
  width: 100%; resize: vertical;
  font: inherit; color: inherit; background: transparent;
  border: 1px solid var(--line); border-radius: 12px; padding: 12px;
}
.composer textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.composer-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
#counter { color: var(--muted); font-size: .875rem; }
button {
  font: inherit; cursor: pointer; min-height: 44px; padding: 0 16px;
  border-radius: 999px; border: 1px solid var(--line); background: transparent; color: inherit;
}
.composer button[type="submit"] { background: var(--text); color: var(--bg); border: 0; font-weight: 700; }`,
      },
    },
    {
      section: "apply",
      title: "Thẻ bài đăng",
      body: "Hai cột flex như hình minh hoạ. `overflow-wrap: anywhere` chặn chữ dài làm tràn ngang.",
      code: {
        file: "nhip/css/style.css",
        lang: "css",
        content: `.post { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--line); }
.avatar { border-radius: 50%; flex: none; object-fit: cover; }
.post-body { flex: 1; min-width: 0; }
.post-head { display: flex; justify-content: space-between; gap: 8px; }
.author { font-weight: 700; text-decoration: none; }
.post-head time { color: var(--muted); font-size: .875rem; }
.post-body p { margin: 4px 0 8px; overflow-wrap: anywhere; white-space: pre-wrap; }
.post-actions { display: flex; gap: 4px; margin-left: -12px; }
.post-actions button { border: 0; color: var(--muted); }
.like[aria-pressed="true"] { color: #e0245e; }`,
      },
    },
    {
      section: "apply",
      title: "Trang cá nhân và màn rộng",
      body: "Hoàn thiện trang cá nhân, rồi thêm media query cho màn từ 700 px. Kiểm tra lại bằng Lighthouse: Accessibility vẫn phải **≥ 90**, và thử chế độ tối của hệ điều hành.",
      code: {
        file: "nhip/css/style.css",
        lang: "css",
        content: `.profile-head {
  display: grid; grid-template-columns: 1fr auto; gap: 12px;
  padding: 24px 0; border-bottom: 1px solid var(--line);
}
.profile-head h1 { margin: 0; font-size: 1.5rem; }
.handle, .stats { color: var(--muted); margin: 0; }
.avatar-lg { border-radius: 50%; object-fit: cover; }
.follow { grid-column: 1 / -1; background: var(--text); color: var(--bg); border: 0; font-weight: 700; }

@media (min-width: 700px) {
  .feed, .profile { padding: 0; }
  .composer { padding: 16px; margin-top: 16px; border: 1px solid var(--line); border-radius: var(--radius); }
}`,
      },
    },
  ],
  quiz: [
    { kind: "order", q: "Sắp các lớp của box model từ trong ra ngoài.", items: ["Nội dung", "Padding", "Border", "Margin"], a: [0, 1, 2, 3], why: "Nội dung → đệm trong → viền → khoảng cách ngoài." },
    { q: "box-sizing: border-box làm gì?", o: ["Thêm viền cho mọi hộp", "Chiều rộng khai báo đã gồm padding và border", "Bỏ margin", "Làm hộp thành hình vuông"], a: 1, why: "Không phải tự cộng padding và viền vào chiều rộng nữa." },
    { kind: "output", q: "Đoạn văn trong .post có màu gì?", code: ".post p { color: black; }\np { color: red; }", o: ["red — luật viết sau thắng", "black — độ ưu tiên cao hơn", "Không màu", "Trình duyệt báo lỗi"], a: 1, why: "Thứ tự chỉ phân xử khi độ ưu tiên bằng nhau; .post p (class + thẻ) mạnh hơn p." },
    { q: "Trong flexbox mặc định, justify-content căn theo trục nào?", o: ["Trục phụ (dọc)", "Trục chính (ngang)", "Cả hai", "Không trục nào"], a: 1, why: "justify-content lo trục chính, align-items lo trục phụ." },
    { kind: "blank", q: "Điền giá trị để thân bài co lại được, không bị chữ dài đẩy tràn.", code: ".post-body { flex: 1; min-width: ___; }", a: ["0", "0px"], why: "Mặc định min-width của con flex là auto, không co nhỏ hơn nội dung." },
    { q: "Tỉ lệ tương phản tối thiểu cho chữ thường theo WCAG 2.2 (mức AA)?", o: ["2:1", "3:1", "4,5:1", "7:1"], a: 2, why: "Tiêu chí 1.4.3: 4,5:1 cho chữ thường, 3:1 cho chữ lớn." },
    { kind: "truefalse", q: "Nên xoá outline của ô nhập khi focus vì trông xấu.", a: false, why: "Người dùng bàn phím mất dấu vị trí; nếu xoá phải thay bằng chỉ báo khác rõ ràng." },
    { kind: "multi", q: "Những lựa chọn nào giúp Nhịp responsive?", o: ["max-width: 620px với width: 100%", "@media (min-width: 700px)", "Cố định width: 1200px cho body", "meta viewport trong HTML"], a: [0, 1, 3], why: "Chiều rộng cố định lớn làm điện thoại phải cuộn ngang." },
    { q: "Vì sao nên tạo kiểu bằng class thay vì id?", o: ["Class chạy nhanh hơn", "Id có độ ưu tiên quá cao, khó ghi đè và không dùng lại được", "Id bị cấm trong CSS", "Class tự responsive"], a: 1, why: "Class dùng lại được và giữ độ ưu tiên thấp, dễ kiểm soát cascade." },
    { kind: "match", q: "Nối đơn vị với cách dùng hợp lý.", pairs: [["rem", "Cỡ chữ theo cài đặt người dùng"], ["px", "Độ dày viền"], ["%", "So với phần tử cha"], ["vh", "Phần trăm chiều cao khung nhìn"]], why: "Chọn đơn vị theo thứ nó cần bám vào." },
  ],
};
