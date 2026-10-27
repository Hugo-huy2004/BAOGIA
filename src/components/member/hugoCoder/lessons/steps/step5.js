export default {
  id: "step5",
  lang: "js",
  file: "nhip/js/app.js",
  duration: "120 phút",
  summary: "JavaScript đủ sâu để làm sản phẩm: kiểu dữ liệu, chuỗi, mảng, đối tượng, hàm, phạm vi và các phương thức map/filter/find — áp vào mô hình dữ liệu bài đăng của Nhịp.",
  slides: [
    {
      section: "intro",
      title: "Ngôn ngữ của trình duyệt",
      body: `JavaScript là ngôn ngữ lập trình duy nhất chạy sẵn trong mọi trình duyệt. Ở step 1 bạn đã dùng biến, điều kiện, vòng lặp, hàm. Step này đi sâu tới mức **làm sản phẩm thật**: mô tả một bài đăng bằng dữ liệu, rồi lọc, đếm, sắp xếp cả danh sách bài.

Chưa đụng tới giao diện — step 6 mới nối dữ liệu này lên trang.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `- Phân biệt các **kiểu dữ liệu** và tránh bẫy ép kiểu.
- Xử lý **chuỗi**: cắt, tìm, ghép bằng template literal.
- Dùng **mảng** và **đối tượng** để mô hình hoá bài đăng.
- Viết **hàm** thuần, hiểu **phạm vi** biến.
- Dùng \`map\`, \`filter\`, \`find\`, \`sort\` thay cho vòng lặp viết tay.`,
    },
    {
      section: "visual",
      title: "Mảng: các ô đánh số từ 0",
      visual: "array-index",
      body: "Mảng là dãy ô liền nhau, ô đầu tiên có chỉ số **0**. `posts.length` là số ô; ô cuối là `posts[posts.length - 1]`. Truy cập ô không tồn tại không báo lỗi — nó trả `undefined`.",
    },
    {
      section: "visual",
      title: "Đối tượng: một bài đăng",
      visual: "object-shape",
      body: "Đối tượng gom các thông tin của **một thứ** dưới dạng cặp khoá–giá trị. Một bài đăng có id, người viết, nội dung, thời gian, số tim. Mảng các đối tượng chính là một bảng dữ liệu — giống hệt bảng MySQL ở chặng 2.",
    },
    {
      section: "visual",
      title: "Dây chuyền filter → sort → map",
      visual: "pipeline",
      body: "Mỗi phương thức nhận một mảng và trả ra **mảng mới**: lọc bớt, sắp lại, biến đổi. Mảng gốc không bị sửa. Nối chúng thành dây chuyền là cách viết rõ ràng nhất để xử lý danh sách.",
    },
    {
      section: "research",
      title: "JavaScript là một chuẩn quốc tế",
      body: `Brendan Eich tạo JavaScript năm 1995 tại Netscape. Ngôn ngữ được chuẩn hoá bởi Ecma International dưới tên **ECMAScript** (chuẩn ECMA-262), mỗi năm một phiên bản. Mọi trình duyệt cài đặt theo cùng chuẩn này, nên mã của bạn chạy giống nhau ở mọi nơi.

> Ecma International (2025) *ECMA-262: ECMAScript 2025 Language Specification*. 16th edn. Geneva: Ecma International.
>
> Mozilla (2025) *JavaScript Guide*, MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide`,
    },
    {
      section: "research",
      title: "Hàm là công cụ trừu tượng hoá",
      body: `Trong giáo trình kinh điển của MIT, Abelson và Sussman coi việc **đặt tên cho một phép tính** là công cụ mạnh nhất để kiểm soát độ phức tạp: dùng hàm mà không cần nhớ bên trong nó làm gì.

Hàm **thuần** (pure) — cùng đầu vào luôn ra cùng đầu ra, không sửa gì bên ngoài — dễ kiểm tra và dễ ghép nối nhất. Các hàm xử lý dữ liệu của Nhịp sẽ viết theo kiểu này.

> Abelson, H. and Sussman, G.J. (1996) *Structure and Interpretation of Computer Programs*. 2nd edn. Cambridge, MA: MIT Press.`,
    },
    {
      section: "ideate",
      title: "Mô hình dữ liệu bài đăng",
      body: `Một bài đăng cần những trường nào? Bắt đầu nhỏ:

| Trường | Kiểu | Ví dụ |
|---|---|---|
| id | số | 1 |
| author | chuỗi | "lan.code" |
| text | chuỗi | "Chào Nhịp" |
| createdAt | chuỗi ISO | "2026-10-27T09:30:00" |
| likes | số | 3 |
| likedByMe | boolean | false |

Bảng này sẽ thành bảng \`posts\` trong MySQL ở chặng 2 — gần như giữ nguyên.`,
    },
    {
      section: "ideate",
      title: "Bảng tin cần những phép tính nào",
      body: `- Sắp bài **mới nhất lên đầu**.
- Lấy **bài của một người** (cho trang cá nhân).
- **Đếm** tổng số tim của một người.
- **Thả tim / bỏ tim** một bài theo id.
- Hiện thời gian kiểu **"5 phút"** thay vì chuỗi ISO.

Mỗi dòng là một hàm. Viết xong năm hàm này, step 6 chỉ còn việc nối chúng vào giao diện.`,
    },
    {
      section: "core",
      title: "Kiểu dữ liệu và bẫy ép kiểu",
      body: `Bảy kiểu nguyên thuỷ hay gặp: \`string\`, \`number\`, \`boolean\`, \`undefined\`, \`null\`, \`bigint\`, \`symbol\`; còn lại là \`object\` (gồm cả mảng, hàm).

~~~js
typeof "5"        // "string"
"5" + 1           // "51"  — ghép chuỗi!
"5" - 1           // 4     — ép sang số
Number("5") + 1   // 6     — ép tường minh: an toàn
"5" === 5         // false
~~~

Dữ liệu từ ô nhập **luôn là chuỗi**. Muốn tính toán thì ép tường minh bằng \`Number()\`.`,
    },
    {
      section: "core",
      title: "Chuỗi và template literal",
      body: `~~~js
const name = "Lan";
const text = "  Học Coding vui lắm  ";

text.trim()                 // "Học Coding vui lắm"
text.includes("Coding")     // true
text.trim().slice(0, 7)     // "Học Cod"
text.toUpperCase()          // "  HỌC CODING VUI LẮM  "
\`Xin chào \${name}!\`        // "Xin chào Lan!"
~~~

Template literal (dấu huyền) nhúng biểu thức bằng \`\${...}\` và viết được nhiều dòng — gọn hơn nối chuỗi bằng \`+\`.`,
    },
    {
      section: "core",
      title: "Mảng: thêm, bớt, tìm",
      body: `~~~js
const tags = ["html", "css"];
tags.push("js");            // thêm cuối → ["html","css","js"]
tags.unshift("intro");      // thêm đầu
tags.includes("css");       // true
tags.indexOf("js");         // 3
const copy = [...tags];     // sao chép (spread)
~~~

\`push\`/\`unshift\` **sửa mảng gốc**. Khi cần giữ nguyên dữ liệu cũ, tạo mảng mới bằng spread: \`[newPost, ...posts]\`.`,
    },
    {
      section: "core",
      title: "Đối tượng: đọc, sửa, sao chép",
      body: `~~~js
const post = { id: 1, author: "lan.code", text: "Chào", likes: 0 };

post.author                       // "lan.code"
post["likes"]                     // 0
const { author, likes } = post;   // tách trường (destructuring)
const liked = { ...post, likes: post.likes + 1 };  // bản sao đã sửa
~~~

Sao chép bằng \`{ ...post }\` rồi đổi trường cần đổi — bản gốc giữ nguyên, dễ kiểm soát hơn sửa trực tiếp.`,
    },
    {
      section: "core",
      title: "Hàm mũi tên và phạm vi",
      body: `~~~js
const add = (a, b) => a + b;          // trả về ngay
const greet = (name) => {
  const message = \`Chào \${name}\`;     // chỉ sống trong hàm
  return message;
};
console.log(message);                 // ReferenceError
~~~

Biến khai báo bằng \`let\`/\`const\` chỉ sống trong cặp ngoặc nhọn gần nhất (**phạm vi khối**). Biến càng sống ngắn càng ít chỗ bị sửa nhầm.`,
    },
    {
      section: "core",
      title: "filter, map, find, sort",
      body: `~~~js
const mine   = posts.filter((p) => p.author === "lan.code");  // lọc
const texts  = posts.map((p) => p.text);                      // biến đổi
const first  = posts.find((p) => p.id === 2);                 // tìm một
const total  = posts.reduce((sum, p) => sum + p.likes, 0);    // gộp
const newest = [...posts].sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
);
~~~

Chú ý: \`sort\` **sửa mảng gốc**, nên sao chép trước bằng \`[...posts]\`.`,
    },
    {
      section: "core",
      title: "Ngày giờ",
      body: `~~~js
const created = new Date("2026-10-27T09:30:00");
const minutes = Math.floor((Date.now() - created) / 60000);
~~~

Trừ hai \`Date\` ra **mili giây**. Chia 60.000 được phút. Để hiện kiểu "5 phút trước" theo đúng ngôn ngữ, dùng thư viện chuẩn có sẵn của trình duyệt — \`Intl.RelativeTimeFormat\` — thay vì tự ghép chữ:

~~~js
const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
rtf.format(-5, "minute");   // "5 phút trước"
~~~`,
    },
    {
      section: "apply",
      title: "Dữ liệu mẫu",
      body: "Mở `js/app.js`. Bắt đầu bằng dữ liệu mẫu — đây là \"cơ sở dữ liệu\" tạm của chặng 1.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `const ME = "lan.code";

const posts = [
  { id: 1, author: "lan.code", text: "Hôm nay mình bắt đầu học Coding!", createdAt: "2026-10-27T08:00:00", likes: 3, likedByMe: false },
  { id: 2, author: "minh.dev", text: "CSS flexbox cứu cả buổi chiều.", createdAt: "2026-10-27T09:10:00", likes: 5, likedByMe: true },
  { id: 3, author: "lan.code", text: "Box model: content, padding, border, margin.", createdAt: "2026-10-27T09:45:00", likes: 1, likedByMe: false },
];`,
      },
    },
    {
      section: "apply",
      title: "Hàm sắp xếp và lọc",
      body: "Hai hàm thuần: không sửa `posts`, luôn trả mảng mới.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `function newestFirst(list) {
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function postsBy(list, author) {
  return list.filter((post) => post.author === author);
}

function totalLikes(list, author) {
  return postsBy(list, author).reduce((sum, post) => sum + post.likes, 0);
}

console.log(newestFirst(posts).map((p) => p.id));   // [3, 2, 1]
console.log(totalLikes(posts, ME));                 // 4`,
      },
    },
    {
      section: "apply",
      title: "Thả tim không sửa dữ liệu cũ",
      body: "`toggleLike` trả về **mảng mới** trong đó đúng một bài được thay bằng bản sao đã cập nhật. Cách này giúp step 6 vẽ lại giao diện an toàn.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `function toggleLike(list, id) {
  return list.map((post) => {
    if (post.id !== id) return post;
    const likedByMe = !post.likedByMe;
    return { ...post, likedByMe, likes: post.likes + (likedByMe ? 1 : -1) };
  });
}

const after = toggleLike(posts, 1);
console.log(after[0].likes, after[0].likedByMe);   // 4 true
console.log(posts[0].likes);                       // 3 — bản gốc không đổi`,
      },
    },
    {
      section: "apply",
      title: "Tạo bài mới và hiện thời gian",
      body: "Dùng lại `checkPost` từ step 1. `Intl.RelativeTimeFormat` là thư viện chuẩn của trình duyệt — không cần cài gì thêm.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `const MAX_LENGTH = 500;

function checkPost(text) {
  const clean = text.trim();
  if (clean.length === 0) return "Hãy viết gì đó";
  if (clean.length > MAX_LENGTH) return \`Tối đa \${MAX_LENGTH} ký tự\`;
  return "ok";
}

function createPost(list, text) {
  const id = Math.max(0, ...list.map((p) => p.id)) + 1;
  const post = { id, author: ME, text: text.trim(), createdAt: new Date().toISOString(), likes: 0, likedByMe: false };
  return [post, ...list];
}

const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
function timeAgo(iso) {
  const minutes = Math.round((new Date(iso) - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}`,
      },
    },
    {
      section: "apply",
      title: "Tự kiểm bằng console.assert",
      body: "Thêm vào cuối tệp. `console.assert` im lặng khi đúng, chỉ báo đỏ khi sai — một cách kiểm thử tối giản có sẵn trong trình duyệt. Mở `index.html`, xem Console: không có dòng đỏ nào là đạt.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `console.assert(checkPost("   ") === "Hãy viết gì đó", "chuỗi trắng phải bị chặn");
console.assert(checkPost("a".repeat(500)) === "ok", "đúng 500 ký tự vẫn hợp lệ");
console.assert(checkPost("a".repeat(501)) !== "ok", "501 ký tự phải bị chặn");
console.assert(createPost(posts, "Mới")[0].text === "Mới", "bài mới nằm đầu");
console.assert(posts.length === 3, "createPost không được sửa mảng gốc");
console.assert(toggleLike(toggleLike(posts, 2), 2)[1].likes === 5, "thả rồi bỏ tim về như cũ");`,
      },
    },
  ],
  quiz: [
    { kind: "output", q: "Cộng một chuỗi với một số cho ra gì?", code: "console.log(\"5\" + 1);", o: ["6", "\"51\"", "NaN", "Lỗi"], a: 1, why: "Toán tử + gặp chuỗi thì ghép chuỗi. Ép tường minh bằng Number() trước khi cộng." },
    { q: "Chỉ số của phần tử đầu tiên trong mảng là?", o: ["1", "0", "-1", "Tuỳ trình duyệt"], a: 1, why: "Mảng JavaScript đánh số từ 0." },
    { kind: "output", q: "posts có 3 bài. Kết quả là gì?", code: "console.log(posts[3]);", o: ["Bài cuối cùng", "undefined", "Lỗi RangeError", "null"], a: 1, why: "Truy cập ô không tồn tại trả undefined, không báo lỗi — nên phải tự kiểm tra." },
    { q: "Phương thức nào lấy ra các bài của một người?", o: ["map", "filter", "find", "push"], a: 1, why: "filter giữ lại các phần tử thoả điều kiện, trả về mảng mới." },
    { kind: "truefalse", q: "posts.sort(...) trả về mảng mới và giữ nguyên posts.", a: false, why: "sort sửa mảng gốc; sao chép bằng [...posts] trước khi sort." },
    { kind: "blank", q: "Điền cú pháp để tạo bản sao bài đăng với số tim mới mà không sửa bản gốc.", code: "const liked = { ___post, likes: post.likes + 1 };", a: "...", why: "Spread sao chép mọi trường, trường viết sau ghi đè." },
    { kind: "output", q: "map trả về mảng nào?", code: "const nums = [1, 2, 3];\nconsole.log(nums.map((n) => n * 2));", o: ["[1, 2, 3]", "[2, 4, 6]", "6", "12"], a: 1, why: "map biến đổi từng phần tử và trả mảng mới cùng độ dài." },
    { kind: "bug", q: "Dòng nào gây ReferenceError?", lines: ["function greet(name) {", "  const message = `Chào ${name}`;", "  return message;", "}", "console.log(message);"], a: 4, why: "message chỉ sống trong phạm vi hàm greet." },
    { kind: "multi", q: "Những hàm nào trong app.js là hàm thuần (không sửa dữ liệu bên ngoài)?", o: ["newestFirst", "postsBy", "toggleLike", "Hàm gọi posts.push(newPost)"], a: [0, 1, 2], why: "push sửa mảng gốc; ba hàm kia đều trả dữ liệu mới." },
    { q: "Để hiện \"5 phút trước\" đúng ngôn ngữ, nên dùng gì?", o: ["Tự ghép chuỗi theo từng ngôn ngữ", "Intl.RelativeTimeFormat có sẵn trong trình duyệt", "Cài một thư viện nặng", "Lưu sẵn chữ trong cơ sở dữ liệu"], a: 1, why: "Ưu tiên thư viện chuẩn của nền tảng: đúng ngữ pháp mọi ngôn ngữ, không thêm tải." },
  ],
};
