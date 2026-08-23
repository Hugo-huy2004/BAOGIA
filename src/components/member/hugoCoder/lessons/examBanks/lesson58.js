/**
 * Ngân hàng đề — Bài 58: Kiểm tra Tổng hợp số 2 (chặng 1–4).
 *
 * Phủ nửa còn lại so với bài 57: dữ liệu & truy vấn · kiến trúc và API ·
 * hiệu năng và Web Vitals · chất lượng mã, đặt tên, tài liệu, gỡ lỗi —
 * cố ý KHÔNG trùng câu nào với ngân hàng bài 57.
 *
 * Cơ cấu và quy ước đáp án: xem `lesson6.js`.
 */
export default [
  // ── Suy luận · nhẹ ────────────────────────────────────────────────────────
  {
    group: "logic", level: "easy",
    q: "Trang tải 3 giây vì một ảnh nền 8MB. Việc nên làm đầu tiên là gì?",
    o: [
      "Nén ảnh và dùng định dạng hiện đại, đặt kích thước đúng nhu cầu hiển thị",
      "Tăng băng thông máy chủ",
      "Chuyển ảnh sang base64 nhúng vào HTML",
      "Tải ảnh bằng JavaScript thay vì CSS",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "`console.log(typeof [])` in ra gì?",
    o: ["\"object\"", "\"array\"", "\"list\"", "\"undefined\""],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Một hàm dài 400 dòng làm 6 việc khác nhau. Vấn đề rõ nhất khi bảo trì là gì?",
    o: [
      "Sửa một việc dễ làm hỏng năm việc kia, và không thể tái sử dụng phần nào",
      "Trình duyệt không chạy được hàm quá 100 dòng",
      "Hàm dài luôn chạy chậm hơn",
      "Không có vấn đề gì nếu code chạy đúng",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "`[1, 2, 3].map(x => x * 2)` trả về gì, và mảng gốc có đổi không?",
    o: [
      "[2, 4, 6] — mảng gốc giữ nguyên",
      "[2, 4, 6] — mảng gốc bị thay đổi",
      "[1, 2, 3] — map chỉ duyệt chứ không tạo mảng mới",
      "undefined — map cần return tường minh",
    ],
    a: 0,
  },
  // ── Suy luận · trung bình ────────────────────────────────────────────────
  {
    group: "logic", level: "medium",
    q: "Trang danh sách gọi API lấy tác giả cho từng bài viết: 1 truy vấn lấy 100 bài + 100 truy vấn lấy tác giả. Đây là vấn đề gì và sửa thế nào?",
    o: [
      "Truy vấn N+1 — gộp lại bằng JOIN hoặc một truy vấn lấy tác giả theo danh sách id",
      "Rò rỉ bộ nhớ — phải giải phóng kết nối",
      "Race condition — phải dùng transaction",
      "Không phải vấn đề, vì mỗi truy vấn đều nhanh",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Chỉ số CLS của trang rất xấu. Nguyên nhân điển hình nhất là gì?",
    o: [
      "Ảnh và quảng cáo không khai báo kích thước nên nội dung nhảy chỗ khi tải xong",
      "JavaScript quá nặng",
      "Máy chủ phản hồi chậm",
      "Font chữ quá nhỏ",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Một hàm nhận `options = {}` rồi đọc `options.retry.count`. Với `options` rỗng nó ném lỗi. Cách sửa gọn nhất?",
    o: [
      "Dùng optional chaining và giá trị mặc định: options.retry?.count ?? 3",
      "Bọc toàn bộ hàm trong try/catch",
      "Bắt buộc người gọi luôn truyền đủ options",
      "Đổi options thành mảng",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Ứng dụng gọi API mỗi 10 giây để kiểm tra trạng thái thanh toán, chạy suốt ngày. Chi phí ẩn lớn nhất là gì?",
    o: [
      "Băng thông và số lần gọi tăng vọt dù hầu hết lần gọi không có gì mới",
      "Bộ nhớ trình duyệt cạn dần",
      "Máy chủ hết dung lượng đĩa",
      "Trình duyệt chặn sau 100 lần gọi",
    ],
    a: 0,
  },
  // ── Suy luận · nâng cao ──────────────────────────────────────────────────
  {
    group: "logic", level: "hard",
    q: "Hai tiến trình cùng đọc số dư rồi cùng ghi giá trị mới. Kết quả cuối mất một giao dịch. Cách sửa đúng ở tầng dữ liệu là gì?",
    o: [
      "Cập nhật nguyên tử ngay trong câu lệnh (balance = balance + x) hoặc khoá dòng trong transaction",
      "Thêm chỉ mục vào cột balance",
      "Đọc lại số dư một lần nữa trước khi ghi",
      "Tăng mức cô lập lên READ UNCOMMITTED",
    ],
    a: 0,
  },
  {
    group: "logic", level: "hard",
    q: "Một trang render 5.000 dòng cùng lúc và giật khi cuộn. Hướng xử lý căn bản nhất là gì?",
    o: [
      "Chỉ dựng những dòng đang nằm trong khung nhìn (ảo hoá danh sách) thay vì dựng hết",
      "Bỏ CSS transition để đỡ nặng",
      "Chuyển sang dùng bảng thay cho div",
      "Tăng kích thước bộ nhớ đệm của trình duyệt",
    ],
    a: 0,
  },

  // ── Lý thuyết ────────────────────────────────────────────────────────────
  {
    group: "theory",
    q: "Trong BEM, `card__title--active` thì `card__title` là gì?",
    o: ["Phần tử con của khối card", "Một khối độc lập", "Một trạng thái", "Tên file CSS"],
    a: 0,
  },
  {
    group: "theory",
    q: "Thẻ JSDoc nào mô tả giá trị hàm trả về?",
    o: ["@returns", "@param", "@type", "@output"],
    a: 0,
  },
  {
    group: "theory",
    q: "LCP (Largest Contentful Paint) đo điều gì?",
    o: [
      "Thời điểm phần nội dung lớn nhất trong khung nhìn hiển thị xong",
      "Tổng thời gian tải mọi tài nguyên",
      "Độ trễ khi người dùng bấm lần đầu",
      "Mức độ xê dịch bố cục",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "`git revert` khác `git reset` ở điểm nào?",
    o: [
      "revert tạo commit mới hoàn tác thay đổi, reset dời con trỏ nhánh và có thể mất lịch sử",
      "revert xoá commit, reset giữ lại",
      "Hai lệnh giống nhau, chỉ khác tên",
      "revert chỉ dùng cho nhánh main",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Nguyên tắc DRY (Don't Repeat Yourself) khuyên điều gì?",
    o: [
      "Mỗi mẩu tri thức chỉ nên có một nơi định nghĩa duy nhất trong hệ thống",
      "Không được chép code từ Internet",
      "Mỗi hàm chỉ được gọi một lần",
      "Không viết cùng một tên biến hai lần",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "`async/await` thực chất là cách viết gọn của cơ chế nào?",
    o: ["Promise", "Callback lồng nhau", "Web Worker", "setTimeout"],
    a: 0,
  },
  {
    group: "theory",
    q: "Header `Cache-Control: max-age=300` nói gì với trình duyệt?",
    o: [
      "Dùng lại bản đã lưu trong 300 giây mà không hỏi lại máy chủ",
      "Xoá bộ nhớ đệm sau 300 giây",
      "Chỉ lưu đệm tối đa 300 tệp",
      "Tải lại trang sau 300 giây",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong Git, nhánh tính năng (feature branch) phục vụ mục đích gì?",
    o: [
      "Tách công việc đang làm dở khỏi nhánh chính cho tới khi hoàn chỉnh",
      "Sao lưu mã nguồn",
      "Giảm dung lượng kho chứa",
      "Chạy kiểm thử tự động",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Nạp lười (lazy loading) một route trong ứng dụng SPA mang lại lợi ích chính nào?",
    o: [
      "Gói tải lần đầu nhỏ hơn vì mã của route chỉ tải khi người dùng thật sự vào",
      "Route chạy nhanh hơn khi đã mở",
      "Giảm số lần gọi API",
      "Tăng thứ hạng SEO",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "`.gitignore` dùng để làm gì?",
    o: [
      "Khai báo những tệp Git không theo dõi, như node_modules hay .env",
      "Xoá tệp khỏi ổ đĩa",
      "Khoá tệp không cho người khác sửa",
      "Nén tệp trước khi commit",
    ],
    a: 0,
  },

  // ── Đọc & điền code ──────────────────────────────────────────────────────
  {
    group: "code",
    q: "Điền vào chỗ trống để chờ kết quả của một Promise:",
    code: "async function layNguoiDung(id) {\n  const res = ____ fetch(`/api/users/${id}`);\n  return res.json();\n}",
    o: ["await", "async", "yield", "then"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để bắt lỗi mạng mà không làm sập ứng dụng:",
    code: "try {\n  const data = await taiDuLieu();\n  hienThi(data);\n} ____ (error) {\n  notify.error(\"Không tải được dữ liệu\");\n}",
    o: ["catch", "except", "rescue", "finally"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy giá trị mặc định khi biến là null hoặc undefined:",
    code: "const soLuong = duLieu.soLuong ____ 1;",
    o: ["??", "||=", "&&", "?."],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để không lỗi khi `user.address` không tồn tại:",
    code: "const city = user.address____.city;",
    o: ["?.", ".", "!.", "??"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lọc ra các đơn đã thanh toán:",
    code: "const daTra = donHang.____((don) => don.status === \"paid\");",
    o: ["filter", "map", "forEach", "reduce"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để cộng dồn tổng tiền:",
    code: "const tong = donHang.____((sum, don) => sum + don.total, 0);",
    o: ["reduce", "map", "filter", "some"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để ảnh không làm nhảy bố cục khi tải xong:",
    code: "<img src=\"hero.jpg\" ____=\"1200\" height=\"600\" alt=\"Ảnh bìa\" />",
    o: ["width", "size", "max-width", "ratio"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để ảnh dưới màn hình chỉ tải khi người dùng cuộn tới:",
    code: "<img src=\"anh.jpg\" loading=\"____\" alt=\"Sản phẩm\" />",
    o: ["lazy", "defer", "async", "auto"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy 100 người dùng theo id chỉ bằng MỘT truy vấn:",
    code: "SELECT * FROM users WHERE id ____ (1, 2, 3, ...);",
    o: ["IN", "LIKE", "BETWEEN", "EXISTS"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để hoàn tác một commit đã đẩy lên nhánh chung mà giữ lịch sử:",
    code: "git ____ 4f2a91c",
    o: ["revert", "reset --hard", "checkout", "clean -fd"],
    a: 0,
  },

  // ── Nâng cao ─────────────────────────────────────────────────────────────
  {
    group: "advanced",
    q: "Vì sao `SELECT *` trong mã sản phẩm thường bị xem là thói quen xấu?",
    o: [
      "Kéo về cả cột không dùng, và câu lệnh âm thầm đổi kết quả khi bảng thêm cột",
      "Vì cú pháp đó không chuẩn SQL",
      "Vì nó luôn bỏ qua chỉ mục",
      "Vì nó không dùng được với JOIN",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Đánh đổi khi bật bộ nhớ đệm (cache) cho một endpoint là gì?",
    o: [
      "Phản hồi nhanh hơn nhưng dữ liệu có thể cũ; phải chọn thời hạn và cách làm mới",
      "Không có đánh đổi, luôn nên bật cache",
      "Cache làm dữ liệu sai vĩnh viễn",
      "Cache chỉ dùng được cho ảnh",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao nên tách cấu hình (URL máy chủ, khoá) ra biến môi trường thay vì viết thẳng trong mã?",
    o: [
      "Mỗi môi trường dùng giá trị riêng mà không phải sửa mã, và bí mật không lọt vào kho mã nguồn",
      "Vì biến môi trường chạy nhanh hơn",
      "Vì mã nguồn có giới hạn độ dài chuỗi",
      "Vì Git không lưu được ký tự đặc biệt",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Một hàm vừa tính toán vừa ghi cơ sở dữ liệu vừa gửi email. Vì sao nên tách ra?",
    o: [
      "Mỗi phần kiểm thử và tái sử dụng được riêng, và lỗi ở một phần không kéo sập phần khác",
      "Vì hàm dài chạy chậm hơn",
      "Vì JavaScript giới hạn số lệnh trong một hàm",
      "Vì gửi email phải luôn nằm ở tệp riêng theo chuẩn",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao dữ liệu giả (mock/fake data) quy mô lớn lại quan trọng khi kiểm thử?",
    o: [
      "Nhiều lỗi hiệu năng và phân trang chỉ lộ ra khi dữ liệu đủ lớn, không thấy với 10 dòng mẫu",
      "Vì dữ liệu thật không được phép dùng",
      "Vì nó làm bản dựng nhẹ hơn",
      "Vì nó thay thế được kiểm thử tự động",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Nợ kỹ thuật (technical debt) nên hiểu thế nào cho đúng?",
    o: [
      "Lựa chọn nhanh gọn hôm nay đổi lấy chi phí sửa cao hơn về sau — chấp nhận được nếu có chủ đích và trả dần",
      "Mọi đoạn mã viết vội đều là sai và phải viết lại ngay",
      "Chi phí mua thư viện trả phí",
      "Số lỗi còn tồn trong hệ thống",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao thông điệp commit nên nói \"vì sao\" thay vì chỉ \"đã sửa gì\"?",
    o: [
      "Bản thân diff đã cho biết sửa gì; điều không đọc ra được từ mã là lý do và ràng buộc lúc đó",
      "Vì Git giới hạn độ dài dòng đầu",
      "Vì công cụ tự động sinh phần mô tả thay đổi",
      "Vì quy chuẩn bắt buộc phải có từ \"vì\"",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Khi gỡ lỗi, vì sao nên tái hiện lỗi bằng trường hợp nhỏ nhất trước khi sửa?",
    o: [
      "Trường hợp nhỏ nhất chỉ đúng vào nguyên nhân, tránh sửa nhầm triệu chứng ở nơi khác",
      "Vì trình gỡ lỗi chỉ chạy được với dữ liệu nhỏ",
      "Vì lỗi lớn không tái hiện được",
      "Vì như vậy sửa được nhiều lỗi cùng lúc",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao chia nhỏ gói JavaScript theo route thường quan trọng hơn việc rút gọn tên biến?",
    o: [
      "Mã không bao giờ tải mới là mã rẻ nhất; rút gọn tên chỉ tiết kiệm phần trăm nhỏ",
      "Vì rút gọn tên biến làm mã chạy chậm",
      "Vì trình duyệt không hỗ trợ mã đã rút gọn",
      "Vì chia gói giúp SEO tốt hơn",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Một endpoint trả 10.000 bản ghi trong một lần. Vấn đề và hướng sửa là gì?",
    o: [
      "Tốn băng thông và bộ nhớ cả hai đầu — phân trang hoặc trả theo con trỏ (cursor)",
      "Không có vấn đề nếu máy chủ đủ mạnh",
      "Phải nén bằng gzip là đủ",
      "Phải đổi từ JSON sang XML",
    ],
    a: 0,
  },
];
