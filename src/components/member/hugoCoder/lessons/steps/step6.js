export default {
  id: "step6",
  lang: "js",
  file: "nhip/js/app.js",
  duration: "120 phút",
  summary: "Nối dữ liệu với giao diện: chọn và tạo phần tử DOM, bắt sự kiện, vẽ lại bảng tin, lưu vào localStorage — và lần đầu gặp XSS.",
  slides: [
    {
      section: "intro",
      title: "Cho Nhịp cử động",
      body: `Bạn đã có giao diện (step 3–4) và dữ liệu cùng các hàm xử lý (step 5). Hai thứ đó vẫn sống tách nhau. Step này nối chúng lại: gõ bài → bấm Đăng → bài hiện lên đầu bảng tin; bấm tim → số tim đổi; tải lại trang → bài vẫn còn.

Đây là step cuối của chặng 1: xong step này, Nhịp là một **bản mẫu dùng được**.`,
    },
    {
      section: "intro",
      title: "Mục tiêu",
      body: `- Chọn phần tử bằng \`querySelector\`, tạo phần tử bằng \`createElement\`.
- Bắt sự kiện bằng \`addEventListener\`; dùng **uỷ quyền sự kiện**.
- Viết một hàm \`render()\` vẽ lại bảng tin từ dữ liệu.
- Lưu và đọc dữ liệu bằng \`localStorage\` + JSON.
- Biết vì sao **không** đưa chữ người dùng vào \`innerHTML\`.`,
    },
    {
      section: "visual",
      title: "Vòng lặp của một giao diện",
      visual: "render-cycle",
      body: "Sự kiện (bấm, gõ) → cập nhật **dữ liệu** → gọi **render** vẽ lại giao diện từ dữ liệu. Giao diện không bao giờ là nơi giữ sự thật — dữ liệu mới là. Đây cũng là ý tưởng cốt lõi của React, Vue và mọi thư viện giao diện hiện đại.",
    },
    {
      section: "visual",
      title: "Sự kiện nổi bọt",
      visual: "event-bubble",
      body: "Bấm vào nút tim, sự kiện **nổi bọt** lên từng phần tử cha: nút → article → section → body. Vì vậy chỉ cần **một** bộ nghe đặt ở `section#posts` là bắt được bấm tim của mọi bài, kể cả bài vừa được tạo.",
    },
    {
      section: "visual",
      title: "textContent và innerHTML",
      visual: "xss-compare",
      body: "Cùng một chuỗi người dùng gõ: `textContent` hiện nguyên văn như chữ; `innerHTML` coi nó là **mã HTML** và chạy luôn. Chữ người dùng mà chạy được như mã là lỗ hổng XSS.",
    },
    {
      section: "research",
      title: "DOM là một chuẩn",
      body: `DOM (Document Object Model) là giao diện lập trình mà trình duyệt cung cấp để JavaScript đọc và sửa trang. Nó được WHATWG chuẩn hoá — \`querySelector\`, \`addEventListener\`, \`createElement\` chạy giống nhau ở mọi trình duyệt vì cùng theo chuẩn này.

> WHATWG (2025) *DOM Living Standard*. Available at: https://dom.spec.whatwg.org/
>
> Mozilla (2025) *Introduction to events*, MDN Web Docs. Available at: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events`,
    },
    {
      section: "research",
      title: "XSS theo OWASP",
      body: `OWASP xếp **Injection** (gồm cả Cross-Site Scripting) vào nhóm rủi ro hàng đầu của ứng dụng web. Khuyến nghị đầu tiên của OWASP cho phía trình duyệt: đưa dữ liệu không tin cậy vào trang bằng **thuộc tính an toàn** như \`textContent\`, không bằng \`innerHTML\`.

Chặng 4 sẽ tấn công thử và vá XSS ở phía server. Hôm nay chỉ cần thói quen đúng từ dòng đầu tiên.

> OWASP Foundation (2021) *OWASP Top 10:2021*. Available at: https://owasp.org/Top10/
>
> OWASP Foundation (2025) *Cross Site Scripting Prevention Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html`,
    },
    {
      section: "research",
      title: "Lưu trữ trong trình duyệt",
      body: `\`localStorage\` (thuộc chuẩn Web Storage trong HTML Living Standard) lưu cặp khoá–giá trị **dạng chuỗi**, còn nguyên sau khi tải lại hay tắt trình duyệt, nhưng **chỉ trên máy đó**. Đổi máy là mất; người dùng xoá dữ liệu trình duyệt là mất.

Đó chính là lý do chặng 2 phải có máy chủ và cơ sở dữ liệu.

> WHATWG (2025) 'Web storage', in *HTML Living Standard*. Available at: https://html.spec.whatwg.org/multipage/webstorage.html`,
    },
    {
      section: "ideate",
      title: "Một nguồn sự thật",
      body: `Thiết kế cho bảng tin:

1. Biến \`state\` giữ mảng bài — **nguồn sự thật duy nhất**.
2. Mọi thao tác (đăng, thả tim) chỉ **tạo state mới** bằng các hàm ở step 5.
3. Sau mỗi thao tác: \`save()\` rồi \`render()\`.

Không bao giờ sửa số tim trực tiếp trên nút rồi quên sửa dữ liệu — đó là cách giao diện và dữ liệu lệch nhau.`,
    },
    {
      section: "ideate",
      title: "Một hàm vẽ cho hai trang",
      body: `Bảng tin và trang cá nhân đều hiện danh sách bài, chỉ khác **bài nào**:

- Bảng tin: mọi bài, mới nhất trước.
- Trang cá nhân: chỉ bài của \`ME\`.

Viết một hàm \`renderPosts(container, list)\` dùng cho cả hai. Trang nào có \`#composer\` thì gắn thêm sự kiện đăng bài.`,
    },
    {
      section: "core",
      title: "Chọn phần tử",
      body: `~~~js
const form = document.querySelector("#composer");   // phần tử đầu tiên khớp
const buttons = document.querySelectorAll(".like"); // mọi phần tử khớp
const box = document.getElementById("posts");
~~~

\`querySelector\` nhận **bộ chọn CSS** — đúng những bộ chọn bạn đã viết ở step 4. Không tìm thấy thì trả \`null\`, nên kiểm tra trước khi dùng: \`if (form) { ... }\`.`,
    },
    {
      section: "core",
      title: "Tạo và gắn phần tử",
      body: `~~~js
const p = document.createElement("p");
p.textContent = userText;          // an toàn: luôn là chữ
p.className = "post-text";
container.append(p);               // gắn vào cuối
container.replaceChildren();       // xoá hết con
~~~

\`textContent\` không bao giờ chạy HTML. Với khối phức tạp, dùng thẻ \`<template>\` trong HTML rồi \`cloneNode(true)\` — vừa gọn vừa an toàn.`,
    },
    {
      section: "core",
      title: "Sự kiện",
      body: `~~~js
form.addEventListener("submit", (event) => {
  event.preventDefault();      // chặn tải lại trang
  const text = form.content.value;
  // ...
});

textarea.addEventListener("input", () => {
  counter.textContent = \`\${textarea.value.length}/500\`;
});
~~~

\`submit\` bắt cả bấm nút lẫn nhấn Enter trong biểu mẫu — luôn bắt \`submit\` của form thay vì \`click\` của nút.`,
    },
    {
      section: "core",
      title: "Uỷ quyền sự kiện",
      body: `~~~js
postsBox.addEventListener("click", (event) => {
  const button = event.target.closest(".like");
  if (!button) return;                     // bấm chỗ khác
  const id = Number(button.closest("article").dataset.id);
  // thả tim bài có id này
});
~~~

\`closest\` đi ngược lên tìm phần tử cha khớp bộ chọn. \`data-id\` trên \`article\` đọc qua \`dataset.id\` — nhớ là **chuỗi**, ép sang số bằng \`Number()\`.`,
    },
    {
      section: "core",
      title: "JSON và localStorage",
      body: `~~~js
localStorage.setItem("nhip.posts", JSON.stringify(state));
const saved = JSON.parse(localStorage.getItem("nhip.posts") || "null");
~~~

- \`JSON.stringify\` biến dữ liệu thành chuỗi; \`JSON.parse\` làm ngược lại.
- Dữ liệu đã lưu có thể hỏng hoặc bị người dùng sửa — bọc \`JSON.parse\` trong \`try/catch\` và có giá trị mặc định.
- JSON cũng là định dạng Nhịp sẽ dùng để nói chuyện với server PHP ở chặng 3.`,
    },
    {
      section: "core",
      title: "Trạng thái cho trình đọc màn hình",
      body: `Nút thả tim là nút **bật/tắt**. Báo trạng thái bằng \`aria-pressed\`:

~~~html
<button class="like" aria-pressed="true" aria-label="Bỏ thích">Thích <span>4</span></button>
~~~

CSS ở step 4 đã tô đỏ \`.like[aria-pressed="true"]\` — một thuộc tính vừa lo khả năng tiếp cận vừa lo giao diện.`,
    },
    {
      section: "apply",
      title: "Mẫu bài đăng trong HTML",
      body: "Trong `index.html` và `profile.html`, xoá bài mẫu viết tay trong `#posts` và thêm thẻ `template` này ngay trước `</main>`. JavaScript sẽ nhân bản nó cho mỗi bài.",
      code: {
        file: "nhip/index.html",
        lang: "html",
        content: `<template id="post-template">
  <article class="post">
    <img class="avatar" src="img/lan.jpg" alt="" width="40" height="40">
    <div class="post-body">
      <header class="post-head">
        <a class="author" href="profile.html"></a>
        <time></time>
      </header>
      <p class="post-text"></p>
      <footer class="post-actions">
        <button type="button" class="like" aria-pressed="false">Thích <span></span></button>
      </footer>
    </div>
  </article>
</template>`,
      },
    },
    {
      section: "apply",
      title: "Lưu, nạp và vẽ",
      body: "Thêm vào `js/app.js`, bên dưới các hàm của step 5. Xoá các dòng `console.log` thử nghiệm cũ, giữ lại `console.assert`.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `const STORAGE_KEY = "nhip.posts";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : posts;
  } catch {
    return posts;               // dữ liệu hỏng: quay về dữ liệu mẫu
  }
}

let state = load();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderPosts(container, list) {
  const template = document.querySelector("#post-template");
  container.replaceChildren(...list.map((post) => {
    const node = template.content.cloneNode(true);
    node.querySelector("article").dataset.id = post.id;
    node.querySelector(".author").textContent = post.author;
    node.querySelector("time").textContent = timeAgo(post.createdAt);
    node.querySelector("time").dateTime = post.createdAt;
    node.querySelector(".post-text").textContent = post.text;   // KHÔNG innerHTML
    const like = node.querySelector(".like");
    like.setAttribute("aria-pressed", String(post.likedByMe));
    like.setAttribute("aria-label", post.likedByMe ? "Bỏ thích" : "Thích");
    like.querySelector("span").textContent = post.likes;
    return node;
  }));
}`,
      },
    },
    {
      section: "apply",
      title: "Vẽ đúng trang, bắt bấm tim",
      body: "Trang có `.profile` thì chỉ vẽ bài của `ME`. Một bộ nghe duy nhất trên `#posts` lo mọi nút tim.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `const postsBox = document.querySelector("#posts");
const onProfile = Boolean(document.querySelector(".profile"));

function render() {
  const list = onProfile ? postsBy(state, ME) : state;
  renderPosts(postsBox, newestFirst(list));
}

postsBox.addEventListener("click", (event) => {
  const button = event.target.closest(".like");
  if (!button) return;
  const id = Number(button.closest("article").dataset.id);
  state = toggleLike(state, id);
  save();
  render();
});

render();`,
      },
    },
    {
      section: "apply",
      title: "Đăng bài và bộ đếm ký tự",
      body: "Chỉ bảng tin có ô soạn bài, nên kiểm tra `composer` tồn tại trước khi gắn sự kiện. Lỗi hiện bằng `setCustomValidity` — thông báo lỗi chuẩn của trình duyệt, có sẵn khả năng tiếp cận.",
      code: {
        file: "nhip/js/app.js",
        lang: "js",
        content: `const composer = document.querySelector("#composer");

if (composer) {
  const textarea = composer.querySelector("textarea");
  const counter = document.querySelector("#counter");

  textarea.addEventListener("input", () => {
    counter.textContent = \`\${textarea.value.length}/\${MAX_LENGTH}\`;
    textarea.setCustomValidity("");
  });

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = checkPost(textarea.value);
    if (result !== "ok") {
      textarea.setCustomValidity(result);
      textarea.reportValidity();
      return;
    }
    state = createPost(state, textarea.value);
    save();
    render();
    composer.reset();
    counter.textContent = \`0/\${MAX_LENGTH}\`;
  });
}`,
      },
    },
    {
      section: "apply",
      title: "Thử tấn công chính bạn",
      body: `Đăng một bài có nội dung:

~~~text
<img src=x onerror="alert('XSS')">
~~~

Với \`textContent\`, bài hiện **nguyên văn** chuỗi đó — an toàn. Giờ tạm đổi dòng \`.post-text\` sang \`innerHTML\` và đăng lại: hộp thoại bật lên. Đó là XSS. **Đổi lại về \`textContent\`** rồi mới làm tiếp.`,
    },
    {
      section: "apply",
      title: "Nghiệm thu chặng 1",
      body: `Bản mẫu Nhịp đạt khi:

- [ ] Đăng bài: bài mới hiện đầu bảng tin; bài trống hoặc quá 500 ký tự bị chặn.
- [ ] Thả tim / bỏ tim đổi số và màu; điều khiển được bằng bàn phím.
- [ ] Tải lại trang, dữ liệu còn nguyên.
- [ ] Trang cá nhân chỉ hiện bài của bạn.
- [ ] Console không có lỗi đỏ, mọi \`console.assert\` im lặng.
- [ ] Lighthouse Accessibility ≥ 90 trên cả hai trang.

Đạt đủ sáu dòng thì làm bài trắc nghiệm để mở chặng 2.`,
    },
  ],
  quiz: [
    { q: "querySelector(\"#composer\") trả về gì nếu không có phần tử khớp?", o: ["Mảng rỗng", "null", "undefined", "Báo lỗi"], a: 1, why: "Phải kiểm tra null trước khi gắn sự kiện, như khối if (composer)." },
    { kind: "truefalse", q: "Gán chữ người dùng gõ vào innerHTML là an toàn nếu đã kiểm tra độ dài.", a: false, why: "Độ dài không liên quan; chuỗi ngắn vẫn chứa được thẻ chạy mã. Dùng textContent." },
    { q: "event.preventDefault() trong sự kiện submit để làm gì?", o: ["Xoá biểu mẫu", "Chặn trình duyệt gửi biểu mẫu và tải lại trang", "Chặn người dùng gõ", "Lưu dữ liệu"], a: 1, why: "Bảng tin tự xử lý bằng JavaScript nên không cần trình duyệt tải lại trang." },
    { kind: "order", q: "Sắp xếp vòng xử lý khi bấm thả tim.", items: ["Sự kiện click nổi bọt lên #posts", "Tạo state mới bằng toggleLike", "save() lưu vào localStorage", "render() vẽ lại bảng tin"], a: [0, 1, 2, 3], why: "Sự kiện → dữ liệu → lưu → vẽ. Giao diện luôn được vẽ từ dữ liệu." },
    { q: "Vì sao chỉ cần một bộ nghe trên #posts thay vì gắn cho từng nút tim?", o: ["Nhanh hơn 10 lần", "Sự kiện nổi bọt lên phần tử cha, kể cả từ bài tạo sau", "Trình duyệt chỉ cho một bộ nghe", "Để tránh lỗi CSS"], a: 1, why: "Uỷ quyền sự kiện: bài mới tạo không cần gắn thêm bộ nghe." },
    { kind: "output", q: "article có data-id=\"7\". Kết quả là gì?", code: "const id = article.dataset.id;\nconsole.log(id === 7);", o: ["true", "false", "undefined", "Lỗi"], a: 1, why: "dataset luôn trả chuỗi \"7\"; so === với số 7 là false. Dùng Number()." },
    { kind: "blank", q: "Điền hàm biến dữ liệu thành chuỗi trước khi lưu.", code: "localStorage.setItem(\"nhip.posts\", JSON.___(state));", a: "stringify", why: "localStorage chỉ lưu chuỗi; đọc lại bằng JSON.parse." },
    { kind: "multi", q: "Hạn chế nào của localStorage khiến Nhịp cần máy chủ ở chặng 2?", o: ["Chỉ có trên một máy", "Người dùng xoá dữ liệu trình duyệt là mất", "Người khác không thấy bài của bạn", "Không lưu được chữ có dấu"], a: [0, 1, 2], why: "localStorage lưu được chữ có dấu, nhưng dữ liệu chỉ nằm trong một trình duyệt." },
    { kind: "bug", q: "Dòng nào tạo lỗ hổng XSS?", lines: ["const p = document.createElement(\"p\");", "p.className = \"post-text\";", "p.innerHTML = post.text;", "container.append(p);"], a: 2, why: "innerHTML chạy HTML trong post.text; dùng textContent." },
    { q: "Thuộc tính nào báo trạng thái bật/tắt của nút tim cho trình đọc màn hình?", o: ["aria-hidden", "aria-pressed", "data-like", "role=\"img\""], a: 1, why: "aria-pressed=\"true\"/\"false\" mô tả nút bật/tắt." },
  ],
};
