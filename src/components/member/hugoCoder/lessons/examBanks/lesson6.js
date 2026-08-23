/**
 * Ngân hàng đề — Bài 6: Kiểm tra Kiến thức Web 1 (phạm vi bài 1–5).
 *
 * Semantic HTML · CSS box model · code sạch/BEM · đặt tên file & thư mục ·
 * JavaScript ES6+ và DOM Events.
 *
 * 40 câu: suy luận 10 (4 nhẹ · 4 trung bình · 2 nâng cao), lý thuyết 10,
 * đọc–điền code 10, nâng cao 10.
 *
 * Đáp án ở đây luôn viết đầu tiên (`a: 0`) cho dễ soát bằng mắt — MÁY CHỦ xáo
 * phương án khi ra đề và tự dời chỉ số đáp án theo, nên người thi không bao giờ
 * thấy đáp án đứng cùng một chỗ. Đừng "xáo sẵn" trong file này: làm vậy chỉ khó
 * soát mà không an toàn hơn chút nào.
 */
export default [
  // ── Suy luận · nhẹ ────────────────────────────────────────────────────────
  {
    group: "logic", level: "easy",
    q: "Một hộp có width: 200px, padding: 20px, border: 5px, và KHÔNG đặt box-sizing. Trình duyệt vẽ hộp rộng bao nhiêu?",
    o: ["250px", "200px", "225px", "245px"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Cùng hộp đó nhưng thêm box-sizing: border-box. Bề rộng vẽ ra là bao nhiêu?",
    o: ["200px", "250px", "150px", "160px"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Trang có 3 thẻ <h1>. Hệ quả gần nhất là gì?",
    o: [
      "Máy đọc màn hình và công cụ tìm kiếm không xác định được tiêu đề chính của trang",
      "Trình duyệt báo lỗi và ngừng vẽ trang",
      "CSS không áp dụng được cho h1 nào cả",
      "JavaScript không truy cập được các thẻ đó",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "let x = 5; { let x = 10; } console.log(x) in ra gì?",
    o: ["5", "10", "undefined", "Lỗi cú pháp"],
    a: 0,
  },
  // ── Suy luận · trung bình ────────────────────────────────────────────────
  {
    group: "logic", level: "medium",
    q: "Một danh sách 500 dòng, mỗi dòng gắn một addEventListener('click'). Cách nào giảm số listener xuống 1 mà vẫn bắt được click từng dòng?",
    o: [
      "Gắn listener lên thẻ cha và đọc event.target để biết dòng nào",
      "Dùng querySelectorAll rồi gọi addEventListener trong vòng lặp",
      "Đổi click thành onclick viết thẳng trong HTML",
      "Gọi preventDefault() ở mỗi dòng",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Hai quy tắc cùng nhắm một nút: `.btn { color: blue }` và `#save { color: red }`. Nút mang cả class btn lẫn id save sẽ có màu gì, vì sao?",
    o: [
      "Đỏ — id có độ ưu tiên cao hơn class",
      "Xanh — class viết sau nên thắng",
      "Đỏ — vì red là màu mặc định khi xung đột",
      "Xanh — vì class cụ thể hơn id",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "const arr = [1, 2, 3]; arr.push(4); dòng này chạy được, nhưng arr = [5] thì lỗi. Vì sao?",
    o: [
      "const khoá việc GÁN LẠI biến, không khoá việc thay đổi nội dung mảng",
      "const chỉ dùng được cho số, không dùng cho mảng",
      "push là hàm đặc biệt được phép ghi đè const",
      "Vì mảng phải khai báo bằng let mới thêm được phần tử",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Đặt <script src=\"app.js\"> ngay trong <head> mà không có defer, code gọi document.getElementById('list') trả về null. Lý do?",
    o: [
      "Script chạy trước khi trình duyệt dựng xong phần <body> chứa thẻ đó",
      "getElementById không hoạt động với thẻ danh sách",
      "Phải dùng querySelector mới đọc được id",
      "Thẻ script trong head bị trình duyệt bỏ qua",
    ],
    a: 0,
  },
  // ── Suy luận · nâng cao ──────────────────────────────────────────────────
  {
    group: "logic", level: "hard",
    q: "Một thẻ cha có `display: flex`. Con của nó đặt `margin-top: 20px` và `margin-bottom: 20px`, con kế tiếp cũng vậy. Khoảng cách giữa hai con là bao nhiêu?",
    o: [
      "40px — flex container không gộp lề, khác với luồng thường",
      "20px — hai lề luôn gộp thành một",
      "0px — flex bỏ qua margin của con",
      "60px — cộng thêm lề mặc định",
    ],
    a: 0,
  },
  {
    group: "logic", level: "hard",
    q: "Bấm một nút bên trong thẻ cha, cả hai đều có listener 'click'. Muốn listener của cha KHÔNG chạy khi bấm nút con, phải làm gì trong listener của nút?",
    o: [
      "Gọi event.stopPropagation() để chặn sự kiện nổi lên cha",
      "Gọi event.preventDefault() để huỷ hành vi mặc định",
      "Đặt return false ở cuối hàm là đủ trong mọi trường hợp",
      "Xoá listener của cha rồi gắn lại sau",
    ],
    a: 0,
  },

  // ── Lý thuyết ────────────────────────────────────────────────────────────
  {
    group: "theory",
    q: "Khai báo nào đặt trình duyệt vào chế độ chuẩn (standards mode)?",
    o: ["<!DOCTYPE html>", "<meta charset=\"UTF-8\">", "<html lang=\"vi\">", "<!-- standards -->"],
    a: 0,
  },
  {
    group: "theory",
    q: "Thẻ semantic nào dành cho khối điều hướng chính của trang?",
    o: ["<nav>", "<menu>", "<div class=\"nav\">", "<aside>"],
    a: 0,
  },
  {
    group: "theory",
    q: "Thiếu <meta charset=\"UTF-8\"> thì triệu chứng thường gặp nhất là gì?",
    o: [
      "Tiếng Việt hiện thành ký tự lỗi",
      "Ảnh không tải được",
      "CSS không áp dụng",
      "Trang không cuộn được",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong box model, thứ tự từ trong ra ngoài là gì?",
    o: [
      "content → padding → border → margin",
      "content → border → padding → margin",
      "margin → border → padding → content",
      "padding → content → margin → border",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong BEM, `card__title--active` thì `--active` mang nghĩa gì?",
    o: ["Trạng thái (modifier) của phần tử", "Tên khối cha", "Một phần tử con khác", "Tên file CSS"],
    a: 0,
  },
  {
    group: "theory",
    q: "Thuộc tính alt của thẻ <img> phục vụ mục đích chính nào?",
    o: [
      "Mô tả ảnh cho máy đọc màn hình và hiển thị khi ảnh lỗi",
      "Đặt kích thước ảnh",
      "Chỉ định đường dẫn dự phòng cho ảnh",
      "Khai báo bản quyền ảnh",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Khác biệt cốt lõi giữa `let` và `var` là gì?",
    o: [
      "let giới hạn trong khối {}, var giới hạn trong hàm",
      "let không gán lại được, var thì được",
      "var chỉ dùng cho số, let dùng cho mọi kiểu",
      "Không khác gì, chỉ là cách viết cũ và mới",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Quy ước đặt tên nào phù hợp cho file trên web (ví dụ `user-profile.css`)?",
    o: ["kebab-case", "PascalCase", "snake_case", "SCREAMING_CASE"],
    a: 0,
  },
  {
    group: "theory",
    q: "`===` khác `==` ở điểm nào?",
    o: [
      "=== so sánh cả giá trị lẫn kiểu, == tự ép kiểu trước khi so",
      "=== chỉ dùng cho chuỗi, == dùng cho số",
      "=== so sánh địa chỉ bộ nhớ, == so sánh giá trị",
      "Không khác nhau, === chỉ là cách viết rõ hơn",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Thẻ <label for=\"email\"> gắn với ô nhập nào?",
    o: [
      "Ô nhập có thuộc tính id=\"email\"",
      "Ô nhập có name=\"email\"",
      "Ô nhập có class=\"email\"",
      "Ô nhập đầu tiên trong form",
    ],
    a: 0,
  },

  // ── Đọc & điền code ──────────────────────────────────────────────────────
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy phần tử có id=\"total\":",
    code: "const box = document.____(\"total\");\nbox.textContent = \"120.000đ\";",
    o: ["getElementById", "querySelectorAll", "getElementsByClassName", "createElement"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để nút phản ứng khi người dùng bấm:",
    code: "const btn = document.querySelector(\"#save\");\nbtn.____(\"click\", () => {\n  console.log(\"đã lưu\");\n});",
    o: ["addEventListener", "onEvent", "attachEvent", "listen"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để hộp có bề rộng vẽ ra đúng 300px kể cả padding:",
    code: ".card {\n  width: 300px;\n  padding: 24px;\n  box-sizing: ____;\n}",
    o: ["border-box", "content-box", "padding-box", "inherit"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy MỌI thẻ có class \"row\":",
    code: "const rows = document.____(\".row\");\nrows.forEach((row) => row.classList.add(\"is-ready\"));",
    o: ["querySelectorAll", "getElementById", "querySelector", "getElement"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để in ra \"Chào Hùng\" bằng template literal:",
    code: "const name = \"Hùng\";\nconsole.log(`Chào ____`);",
    o: ["${name}", "$name", "{name}", "+ name +"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để căn các con nằm giữa theo chiều ngang:",
    code: ".toolbar {\n  display: flex;\n  ____: center;\n}",
    o: ["justify-content", "align-items", "text-align", "place-self"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để thêm phần tử vừa tạo vào danh sách:",
    code: "const li = document.createElement(\"li\");\nli.textContent = \"Việc mới\";\nlist.____(li);",
    o: ["appendChild", "addChild", "insert", "push"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để ngăn form nạp lại trang khi gửi:",
    code: "form.addEventListener(\"submit\", (event) => {\n  event.____();\n  luuDuLieu();\n});",
    o: ["preventDefault", "stopPropagation", "cancel", "returnFalse"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để bật/tắt class \"open\" mỗi lần bấm:",
    code: "btn.addEventListener(\"click\", () => {\n  menu.classList.____(\"open\");\n});",
    o: ["toggle", "add", "replace", "switch"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để hàm trả về tổng hai số:",
    code: "const cong = (a, b) => ____;\nconsole.log(cong(2, 3)); // 5",
    o: ["a + b", "return a + b;", "{ a + b }", "sum(a, b)"],
    a: 0,
  },

  // ── Nâng cao ─────────────────────────────────────────────────────────────
  {
    group: "advanced",
    q: "Vì sao nên đặt <script> ngay trước </body> hoặc dùng thuộc tính defer?",
    o: [
      "Để HTML dựng xong trước, script không chặn hiển thị và tìm được phần tử",
      "Để file JS được nén tốt hơn",
      "Vì trình duyệt chỉ chạy script ở cuối trang",
      "Để CSS được tải sau JavaScript",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Khác biệt giữa `null` và `undefined` trong JavaScript là gì?",
    o: [
      "undefined là chưa được gán, null là cố ý gán giá trị rỗng",
      "null là chưa được gán, undefined là cố ý gán rỗng",
      "Hai giá trị hoàn toàn giống nhau",
      "null dùng cho số, undefined dùng cho chuỗi",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao chọn <button> thay vì <div onclick> cho một nút bấm?",
    o: [
      "button có sẵn tiêu điểm bàn phím, phím Enter/Space và vai trò cho máy đọc màn hình",
      "div không gắn được sự kiện click",
      "button tải nhanh hơn div",
      "div không tô màu nền được",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "`textContent` khác `innerHTML` ở điểm quan trọng nào về an toàn?",
    o: [
      "textContent chèn chữ thuần nên không chạy mã, innerHTML dựng HTML nên có thể chạy mã lạ",
      "innerHTML nhanh hơn nên an toàn hơn",
      "textContent chỉ đọc được, không ghi được",
      "Hai cái giống nhau, chỉ khác tên",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Đơn vị `rem` khác `px` thế nào và vì sao nên dùng cho cỡ chữ?",
    o: [
      "rem tính theo cỡ chữ gốc nên co giãn theo thiết lập của người dùng, px thì cố định",
      "rem luôn bằng 10px trên mọi trình duyệt",
      "rem chỉ dùng cho chiều rộng, px chỉ dùng cho chữ",
      "rem tính theo cỡ chữ của thẻ cha gần nhất",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Một trang có 2000 dòng CSS, nhiều selector kiểu `.page .list .item .title span`. Vấn đề chính là gì?",
    o: [
      "Selector quá sâu làm độ ưu tiên cao khó ghi đè và khó tái sử dụng",
      "Trình duyệt không đọc được selector quá 3 cấp",
      "CSS quá 1000 dòng thì bị bỏ qua",
      "Selector sâu làm file CSS không nén được",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao gom cấu trúc thư mục theo tính năng (`user/`, `order/`) thường tốt hơn theo loại file (`css/`, `js/`) khi dự án lớn?",
    o: [
      "Sửa một tính năng chỉ phải mở một thư mục, thay vì nhảy giữa nhiều nơi",
      "Trình duyệt tải thư mục theo tính năng nhanh hơn",
      "Thư mục theo loại file không hợp lệ trên máy chủ",
      "Vì CSS bắt buộc phải nằm cạnh JS",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "`event.target` khác `event.currentTarget` ở điểm nào?",
    o: [
      "target là phần tử bị tác động thật, currentTarget là phần tử đang gắn listener",
      "Hai cái luôn giống nhau",
      "target là phần tử cha, currentTarget là phần tử con",
      "currentTarget chỉ có trong sự kiện bàn phím",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao nên đặt `lang=\"vi\"` trên thẻ <html>?",
    o: [
      "Để máy đọc màn hình phát âm đúng và trình duyệt gợi ý dịch chính xác",
      "Để trình duyệt tự dịch trang sang tiếng Việt",
      "Để font tiếng Việt được tải tự động",
      "Để bảng mã UTF-8 được bật",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Chọn một ô nhập rồi đặt `input.value = \"\"` nhưng giao diện không đổi. Nguyên nhân khả dĩ nhất?",
    o: [
      "Biến input đang trỏ tới phần tử khác hoặc null vì selector sai",
      "value là thuộc tính chỉ đọc",
      "Phải gọi input.refresh() sau khi gán",
      "Trình duyệt chỉ cho xoá ô nhập bằng bàn phím",
    ],
    a: 0,
  },
];
