/**
 * Lớp câu hỏi đa dạng — bổ sung vào `miniQuiz` của các bài đã có.
 *
 * Toàn bộ 471 câu trong sáu file giáo trình đều là trắc nghiệm bốn lựa chọn.
 * Học một trăm bài mà lần nào cũng đúng một hình thức thì người học đoán theo
 * phản xạ chứ không nghĩ.
 *
 * Đặt ở file riêng thay vì sửa thẳng sáu file kia: nội dung bài giảng và hình
 * thức kiểm tra là hai thứ đổi theo nhịp khác nhau, và trộn lẫn thì mỗi lần
 * thêm một dạng câu hỏi lại phải mở sáu file dài hai nghìn dòng.
 *
 * Dạng câu hỏi và luật chấm ở `shared/quizKinds.js`.
 */
export const VARIED_QUESTIONS = {
  // ── Chặng 1: phản xạ cơ bản ──────────────────────────────────────────────
  lesson2: [{
    kind: "bug",
    q: "Đoạn CSS này khiến thẻ tràn khỏi khung cha. Dòng nào là nguyên nhân?",
    lines: [
      ".card {",
      "  width: 100%;",
      "  padding: 24px;",
      "  box-sizing: content-box;",
      "}",
    ],
    a: 3,
    why: "content-box khiến padding cộng thêm vào chiều rộng 100%, thành 100% + 48px. Dùng border-box thì padding nằm trong.",
  }],

  lesson3: [{
    kind: "truefalse",
    q: "Thẻ <div> và <section> thay thế được cho nhau vì trình duyệt hiển thị chúng giống hệt nhau.",
    a: false,
    why: "Hiển thị giống nhau nhưng ngữ nghĩa khác: <section> báo cho trình đọc màn hình và bộ máy tìm kiếm rằng đây là một phần nội dung có chủ đề riêng, <div> thì không mang nghĩa gì.",
  }],

  lesson5: [{
    kind: "output",
    q: "Đoạn mã dưới in ra gì?",
    code: "const items = [1, 2, 3];\nconst doubled = items.map(x => x * 2);\nconsole.log(items.length, doubled[2]);",
    o: ["3 6", "6 6", "3 3", "undefined 6"],
    a: 0,
    why: "map trả về mảng mới, không sửa mảng gốc — nên items vẫn có 3 phần tử.",
  }],

  lesson7: [{
    kind: "blank",
    q: "Điền từ khoá còn thiếu để chỉ lấy các giá trị khác nhau.",
    code: "SELECT ___ category FROM books;",
    a: ["DISTINCT", "distinct"],
  }],

  // ── Chặng 2: tư duy kiến trúc ────────────────────────────────────────────
  lesson11: [{
    kind: "match",
    q: "Nối mỗi quan hệ với cách hiện thực đúng trong cơ sở dữ liệu.",
    pairs: [
      ["Một tác giả có nhiều sách", "Khoá ngoại authorId trong bảng books"],
      ["Một sách có nhiều thể loại và ngược lại", "Bảng trung gian book_categories"],
      ["Một người dùng có đúng một hồ sơ", "Khoá ngoại duy nhất userId trong bảng profiles"],
    ],
  }],

  lesson14: [{
    kind: "match",
    q: "Nối mỗi thao tác với phương thức HTTP đúng theo RFC 9110.",
    pairs: [
      ["Tạo mới một bản ghi", "POST"],
      ["Thay thế toàn bộ một bản ghi", "PUT"],
      ["Sửa một vài trường", "PATCH"],
      ["Xoá một bản ghi", "DELETE"],
    ],
  }],

  lesson15: [{
    kind: "multi",
    q: "Những giá trị nào KHÔNG được phép tin khi nhận từ client? Chọn tất cả.",
    o: [
      "Giá tiền của sản phẩm",
      "Vai trò của người dùng",
      "Từ khoá tìm kiếm",
      "Định danh người dùng đang đăng nhập",
    ],
    a: [0, 1, 3],
    why: "Giá, vai trò và danh tính đều phải lấy từ máy chủ. Từ khoá tìm kiếm là dữ liệu người dùng nhập — vẫn phải làm sạch, nhưng bản chất nó đến từ client.",
  }],

  lesson21: [{
    kind: "truefalse",
    q: "Đặt Access-Control-Allow-Origin: * là cách nhanh và an toàn để hết lỗi CORS.",
    a: false,
    why: "Nó mở API cho mọi tên miền. Với endpoint có xác thực thì đây là lỗ hổng — hãy liệt kê đúng những origin được phép.",
  }],

  // ── Chặng 3: giải thuật và mật mã ────────────────────────────────────────
  lesson28: [{
    kind: "order",
    q: "Sắp xếp các bước của thuật toán tìm kiếm nhị phân.",
    items: [
      "So sánh giá trị cần tìm với phần tử giữa",
      "Sắp xếp mảng theo thứ tự tăng dần",
      "Lặp lại trên nửa còn lại cho tới khi tìm thấy hoặc hết phần tử",
      "Xác định phần tử ở giữa khoảng đang xét",
      "Loại bỏ nửa chắc chắn không chứa giá trị cần tìm",
    ],
    a: [1, 3, 0, 4, 2],
  }],

  lesson30: [{
    kind: "match",
    q: "Nối mỗi đoạn mã với độ phức tạp thời gian của nó.",
    pairs: [
      ["Truy cập phần tử theo chỉ số trong mảng", "O(1)"],
      ["Tìm kiếm nhị phân trên mảng đã sắp xếp", "O(log n)"],
      ["Duyệt qua toàn bộ mảng một lần", "O(n)"],
      ["Hai vòng lặp lồng nhau trên cùng mảng", "O(n²)"],
    ],
  }],

  lesson32: [{
    kind: "truefalse",
    q: "Hàm băm dùng cho mật khẩu nên chạy càng nhanh càng tốt để đăng nhập mượt.",
    a: false,
    why: "Ngược lại. Hàm băm mật khẩu được thiết kế để CHẬM có chủ đích, làm cho việc thử hàng tỉ mật khẩu trở nên bất khả thi. Đó là lý do dùng bcrypt chứ không dùng SHA-256.",
  }],

  lesson36: [{
    kind: "output",
    q: "Thứ tự in ra là gì?",
    code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
    o: ["A D C B", "A B C D", "A D B C", "A C D B"],
    a: 0,
    why: "Mã đồng bộ chạy trước (A, D), rồi microtask của Promise (C), cuối cùng mới tới macrotask của setTimeout (B).",
  }],

  // ── Chặng 4: bảo mật ─────────────────────────────────────────────────────
  lesson52: [{
    kind: "bug",
    q: "Đoạn mã hiển thị bình luận này có lỗ hổng XSS. Dòng nào?",
    lines: [
      "const comment = await db.getComment(id);",
      "const box = document.querySelector('#comment');",
      "box.innerHTML = comment.body;",
      "box.classList.add('visible');",
    ],
    a: 2,
    why: "innerHTML thi hành mã HTML trong chuỗi. Nội dung do người dùng nhập phải gán bằng textContent, hoặc làm sạch qua danh sách thẻ cho phép.",
  }],

  lesson53: [{
    kind: "multi",
    q: "Những biện pháp nào thực sự chống được CSRF? Chọn tất cả.",
    o: [
      "Token CSRF gắn theo phiên, kiểm tra ở phía máy chủ",
      "Đặt cookie với thuộc tính SameSite",
      "Kiểm tra header Referer là đủ để yên tâm",
      "Yêu cầu thay đổi dữ liệu chỉ dùng POST/PUT/DELETE",
    ],
    a: [0, 1, 3],
    why: "Referer có thể vắng mặt hoặc bị lược bỏ theo chính sách referrer, nên không được dùng làm chốt chặn duy nhất.",
  }],

  lesson54: [{
    kind: "order",
    q: "Sắp xếp các bước xác thực một yêu cầu có JWT.",
    items: [
      "Kiểm tra thời hạn trong phần payload",
      "Đọc token từ cookie hoặc header Authorization",
      "Gắn danh tính vào req rồi cho đi tiếp",
      "Xác minh chữ ký bằng khoá bí mật của máy chủ",
    ],
    a: [1, 3, 0, 2],
  }],

  lesson33: [{
    kind: "blank",
    q: "Điền hàm còn thiếu để so sánh mật khẩu người dùng nhập với chuỗi băm đã lưu.",
    code: "const ok = await bcrypt.___(matKhauNguoiDungNhap, banGhi.passwordHash);",
    a: ["compare"],
  }],

  // ── Chặng 5: đồ án và AI ─────────────────────────────────────────────────
  lesson62: [{
    kind: "bug",
    q: "Đoạn mã gọi Gemini này có một lỗi bảo mật nghiêm trọng. Dòng nào?",
    lines: [
      "// chạy trong trình duyệt",
      "const key = import.meta.env.VITE_GEMINI_API_KEY;",
      "const res = await fetch(endpoint + '?key=' + key, options);",
      "const data = await res.json();",
    ],
    a: 1,
    why: "Mọi biến VITE_* đều được nhúng vào gói mã gửi tới trình duyệt và ai cũng đọc được. Khoá API chỉ được nằm ở phía máy chủ.",
  }],

  lesson64: [{
    kind: "truefalse",
    q: "Đã ép mô hình trả về JSON đúng schema thì không cần kiểm tra lại nội dung nữa.",
    a: false,
    why: "Schema bảo đảm hình dạng, không bảo đảm sự thật. Mô hình vẫn có thể trả về một mã sản phẩm đúng định dạng nhưng không tồn tại trong kho.",
  }],

  lesson72: [{
    kind: "match",
    q: "Nối mỗi tình huống với mã trạng thái HTTP đúng.",
    pairs: [
      ["Tạo mới thành công", "201"],
      ["Xoá thành công, không trả nội dung", "204"],
      ["Thiếu trường bắt buộc", "400"],
      ["Không tìm thấy bản ghi", "404"],
    ],
  }],

  lesson83: [{
    kind: "multi",
    q: "Giới hạn tần suất nên tính theo những khoá nào cho endpoint đăng nhập? Chọn tất cả.",
    o: [
      "Theo địa chỉ IP",
      "Theo tài khoản đang bị thử đăng nhập",
      "Theo User-Agent của trình duyệt",
      "Theo tổng số yêu cầu trên toàn hệ thống",
    ],
    a: [0, 1],
    why: "Chỉ chặn theo IP thì kẻ tấn công đổi IP là qua; chỉ chặn theo tài khoản thì họ rải đều nhiều tài khoản. User-Agent do client tự khai nên vô nghĩa.",
  }],

  // ── Chặng 6: vận hành ────────────────────────────────────────────────────
  lesson94: [{
    kind: "order",
    q: "Sắp xếp đường đi của một yêu cầu HTTPS tới ứng dụng Node đặt sau Nginx.",
    items: [
      "Nginx chuyển tiếp sang cổng nội bộ của ứng dụng",
      "Trình duyệt phân giải tên miền thành địa chỉ IP",
      "Ứng dụng Node xử lý và trả về phản hồi",
      "Nginx kết thúc phiên TLS và giải mã yêu cầu",
    ],
    a: [1, 3, 0, 2],
  }],

  lesson96: [{
    kind: "blank",
    q: "Điền lệnh còn thiếu để chỉ mở cổng 22, 80 và 443 rồi bật tường lửa.",
    code: "sudo ufw allow 22,80,443/tcp\nsudo ufw ___",
    a: ["enable"],
  }],

  lesson98: [{
    kind: "truefalse",
    q: "Đo Core Web Vitals trên máy của lập trình viên là đủ để kết luận trang nhanh.",
    a: false,
    why: "Máy lập trình viên thường mạnh và dùng mạng tốt hơn người dùng thật. Chỉ số phải đo trên thiết bị và đường truyền tương đương người dùng, hoặc lấy từ dữ liệu thực địa.",
  }],
};

/** Ghép câu hỏi đa dạng vào ngân hàng câu hỏi của từng bài. */
export function withVariedQuestions(courses) {
  return courses.map((course) => {
    const extra = VARIED_QUESTIONS[course.id];
    if (!extra) return course;
    return { ...course, miniQuiz: [...(course.miniQuiz || []), ...extra] };
  });
}
