/**
 * Ngân hàng đề — Bài 25: Kiểm tra Website Programming 2 (phạm vi bài 11–24).
 *
 * Thiết kế schema · JOIN & transaction ACID · MVC & RESTful API · JSON ·
 * UI/UX theo WCAG · CORS/CSP · DRY · SEO kỹ thuật.
 *
 * Cơ cấu và quy ước đáp án: xem `lesson6.js`.
 */
export default [
  // ── Suy luận · nhẹ ────────────────────────────────────────────────────────
  {
    group: "logic", level: "easy",
    q: "Bảng `orders` có 100 dòng, bảng `users` có 20 dòng, mỗi đơn thuộc về một người dùng có thật. `orders INNER JOIN users` trả về bao nhiêu dòng?",
    o: ["100", "20", "120", "2000"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Cũng hai bảng đó, nhưng 15 người dùng chưa từng đặt đơn nào. `users LEFT JOIN orders` trả về bao nhiêu dòng?",
    o: ["115", "100", "20", "85"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Gọi POST /api/orders hai lần với cùng dữ liệu thì tạo ra hai đơn. Đó là biểu hiện của điều gì?",
    o: [
      "POST không idempotent — gọi lại tạo thêm tài nguyên mới",
      "Máy chủ đang bị lỗi",
      "POST luôn phải trả về 200",
      "Cần đổi sang GET để tránh trùng",
    ],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Trình duyệt báo lỗi CORS khi trang ở localhost:3000 gọi API ở localhost:8099. Ai phải sửa?",
    o: [
      "Máy chủ API — nó phải gửi header cho phép nguồn gốc kia",
      "Trình duyệt — phải tắt kiểm tra bảo mật",
      "Trang web — phải đổi cổng về 8099",
      "Không sửa được, phải bỏ CORS",
    ],
    a: 0,
  },
  // ── Suy luận · trung bình ────────────────────────────────────────────────
  {
    group: "logic", level: "medium",
    q: "Chuyển tiền: trừ tài khoản A rồi cộng tài khoản B. Máy chủ sập ngay giữa hai lệnh. Thứ gì đảm bảo tiền không biến mất?",
    o: [
      "Transaction — hai lệnh cùng thành công hoặc cùng bị hoàn tác",
      "Khoá ngoại giữa hai bảng",
      "Chỉ mục trên cột số dư",
      "Sao lưu định kỳ hằng đêm",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Danh sách sản phẩm tải chậm dần khi bảng lớn lên, dù truy vấn chỉ lọc theo `category_id`. Việc nên làm đầu tiên là gì?",
    o: [
      "Tạo chỉ mục (index) trên cột category_id",
      "Tăng RAM cho máy chủ",
      "Chuyển sang SELECT * để lấy sẵn mọi cột",
      "Xoá bớt dữ liệu cũ",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "API trả 200 kèm `{\"error\": \"không tìm thấy\"}` khi người dùng không tồn tại. Vì sao đây là thiết kế sai?",
    o: [
      "Mã trạng thái phải nói đúng kết quả — trường hợp này là 404, để máy khách xử lý được mà không phải đọc thân phản hồi",
      "Vì JSON không được chứa khoá error",
      "Vì 200 chỉ dùng cho phương thức GET",
      "Vì thông báo lỗi phải bằng tiếng Anh",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Cùng một đoạn tính thuế 10% bị chép ở 6 chỗ trong dự án. Rủi ro lớn nhất khi thuế đổi thành 8% là gì?",
    o: [
      "Sửa sót một chỗ, hệ thống tính ra hai kết quả khác nhau mà không báo lỗi",
      "File dự án nặng thêm",
      "Trình duyệt tải chậm hơn",
      "Không có rủi ro gì, chỉ mất công",
    ],
    a: 0,
  },
  // ── Suy luận · nâng cao ──────────────────────────────────────────────────
  {
    group: "logic", level: "hard",
    q: "Hai người cùng đặt mua sản phẩm cuối cùng trong kho. Cả hai đọc `stock = 1` rồi cùng ghi `stock = 0`. Kết quả: bán được hai đơn cho một món. Cách xử lý đúng là gì?",
    o: [
      "Cập nhật có điều kiện trong một câu lệnh (UPDATE ... SET stock = stock - 1 WHERE stock > 0) hoặc khoá dòng trong transaction",
      "Đọc lại kho một lần nữa trước khi ghi",
      "Thêm chỉ mục vào cột stock",
      "Cho người dùng bấm chậm lại",
    ],
    a: 0,
  },
  {
    group: "logic", level: "hard",
    q: "Trang đặt CSP `script-src 'self'` nhưng vẫn còn nhiều `onclick=\"...\"` viết thẳng trong HTML. Điều gì xảy ra?",
    o: [
      "Các onclick đó bị chặn không chạy, vì chúng là mã nội tuyến chứ không phải file cùng nguồn",
      "CSP tự động cho phép onclick vì nó nằm trong HTML của chính trang",
      "Trang bị từ chối tải hoàn toàn",
      "CSP chỉ ảnh hưởng tới ảnh và font",
    ],
    a: 0,
  },

  // ── Lý thuyết ────────────────────────────────────────────────────────────
  {
    group: "theory",
    q: "Khoá ngoại (foreign key) dùng để làm gì?",
    o: [
      "Ràng buộc một cột phải trỏ tới dòng có thật ở bảng khác",
      "Tăng tốc truy vấn sắp xếp",
      "Mã hoá dữ liệu nhạy cảm",
      "Đánh số thứ tự tự động cho dòng mới",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "ACID trong cơ sở dữ liệu là viết tắt của những gì?",
    o: [
      "Atomicity, Consistency, Isolation, Durability",
      "Access, Cache, Index, Data",
      "Atomic, Concurrent, Indexed, Distributed",
      "Authentication, Cookie, Identity, Domain",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong mô hình MVC, tầng Model chịu trách nhiệm gì?",
    o: [
      "Dữ liệu và quy tắc nghiệp vụ",
      "Vẽ giao diện cho người dùng",
      "Nhận request và điều phối",
      "Định tuyến URL",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Mã trạng thái 201 trong REST mang nghĩa gì?",
    o: ["Đã tạo mới tài nguyên thành công", "Yêu cầu sai định dạng", "Chưa xác thực", "Máy chủ lỗi"],
    a: 0,
  },
  {
    group: "theory",
    q: "Mã 401 và 403 khác nhau ở chỗ nào?",
    o: [
      "401 là chưa xác thực danh tính, 403 là đã biết bạn là ai nhưng không đủ quyền",
      "401 là lỗi máy chủ, 403 là lỗi máy khách",
      "401 dùng cho GET, 403 dùng cho POST",
      "Hai mã hoàn toàn tương đương",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Tiêu chuẩn WCAG yêu cầu tỉ lệ tương phản tối thiểu bao nhiêu cho chữ thường (mức AA)?",
    o: ["4.5:1", "2:1", "7:1", "3:1"],
    a: 0,
  },
  {
    group: "theory",
    q: "Header `Content-Security-Policy` dùng để làm gì?",
    o: [
      "Giới hạn nguồn mà trang được phép tải mã, ảnh, style… nhằm chặn mã lạ",
      "Nén nội dung trước khi gửi",
      "Xác thực người dùng",
      "Bật bộ nhớ đệm cho trình duyệt",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Thẻ `<link rel=\"canonical\">` giải quyết vấn đề SEO nào?",
    o: [
      "Chỉ ra bản gốc khi cùng một nội dung truy cập được qua nhiều URL",
      "Khai báo ngôn ngữ của trang",
      "Nén ảnh cho công cụ tìm kiếm",
      "Chặn công cụ tìm kiếm lập chỉ mục",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Trong REST, URL nên đặt theo kiểu nào?",
    o: [
      "Danh từ số nhiều cho tài nguyên: /api/orders/12",
      "Động từ mô tả hành động: /api/getOrder?id=12",
      "Viết hoa toàn bộ: /API/ORDERS/12",
      "Có đuôi file: /api/orders/12.php",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Chuẩn hoá dữ liệu (normalization) nhằm mục đích chính nào?",
    o: [
      "Loại bỏ dữ liệu lặp để tránh mâu thuẫn khi cập nhật",
      "Tăng tốc mọi truy vấn",
      "Giảm số bảng trong cơ sở dữ liệu",
      "Mã hoá dữ liệu người dùng",
    ],
    a: 0,
  },

  // ── Đọc & điền code ──────────────────────────────────────────────────────
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy tên khách kèm theo từng đơn hàng:",
    code: "SELECT o.id, u.name\nFROM orders o\n____ users u ON o.user_id = u.id;",
    o: ["INNER JOIN", "UNION", "GROUP BY", "HAVING"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy CẢ những người chưa có đơn nào:",
    code: "SELECT u.name, o.id\nFROM users u\n____ orders o ON o.user_id = u.id;",
    o: ["LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "CROSS JOIN"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để hoàn tác toàn bộ khi có lỗi:",
    code: "BEGIN;\n  UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 100 WHERE id = 2;\n-- có lỗi xảy ra\n____;",
    o: ["ROLLBACK", "COMMIT", "CANCEL", "UNDO"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để trừ kho an toàn khi nhiều người mua cùng lúc:",
    code: "UPDATE products\nSET stock = stock - 1\nWHERE id = 7 ____;",
    o: ["AND stock > 0", "AND stock = 1", "LIMIT 1", "ORDER BY stock"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để trả về mã trạng thái đúng khi tạo mới xong:",
    code: "router.post(\"/orders\", (req, res) => {\n  const order = createOrder(req.body);\n  res.status(____).json(order);\n});",
    o: ["201", "200", "204", "301"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để chặn truy vấn bị tiêm SQL:",
    code: "const stmt = db.prepare(\"SELECT * FROM users WHERE email = ?\");\nconst user = stmt.get(____);",
    o: ["email", "\"'\" + email + \"'\"", "`${email}`", "email.toString()"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để chỉ cho phép trang tải script từ chính nó:",
    code: "res.setHeader(\n  \"Content-Security-Policy\",\n  \"script-src ____\"\n);",
    o: ["'self'", "*", "'unsafe-inline'", "none"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để ô nhập có nhãn đọc được cho máy đọc màn hình:",
    code: "<label ____=\"email\">Email</label>\n<input id=\"email\" type=\"email\" />",
    o: ["for", "name", "aria", "target"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để đếm số đơn theo từng khách:",
    code: "SELECT user_id, COUNT(*) AS total\nFROM orders\n____ user_id;",
    o: ["GROUP BY", "ORDER BY", "PARTITION BY", "WHERE"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lọc theo kết quả đã gộp nhóm:",
    code: "SELECT user_id, COUNT(*) AS total\nFROM orders\nGROUP BY user_id\n____ COUNT(*) > 5;",
    o: ["HAVING", "WHERE", "FILTER", "AND"],
    a: 0,
  },

  // ── Nâng cao ─────────────────────────────────────────────────────────────
  {
    group: "advanced",
    q: "Vì sao truy vấn tham số hoá (prepared statement) chặn được SQL injection, còn nối chuỗi thì không?",
    o: [
      "Dữ liệu được gửi tách khỏi câu lệnh nên không bao giờ bị đọc như mã SQL",
      "Vì nó tự động loại bỏ dấu nháy đơn",
      "Vì nó mã hoá dữ liệu trước khi gửi",
      "Vì nó giới hạn độ dài chuỗi đầu vào",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Chỉ mục (index) làm truy vấn đọc nhanh hơn nhưng đánh đổi bằng gì?",
    o: [
      "Ghi chậm hơn và tốn thêm dung lượng lưu trữ",
      "Dữ liệu kém chính xác hơn",
      "Không đánh đổi gì, nên đánh chỉ mục mọi cột",
      "Mất khả năng dùng transaction",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "\"Stateless\" trong REST nghĩa là gì?",
    o: [
      "Mỗi request tự mang đủ thông tin; máy chủ không nhớ phiên trước đó",
      "Máy chủ không lưu dữ liệu vào cơ sở dữ liệu",
      "API không dùng cookie bao giờ",
      "Client không được lưu gì cả",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao KHÔNG nên tin `?email=` do máy khách gửi để xác định người đang đăng nhập?",
    o: [
      "Ai cũng sửa được tham số đó, danh tính phải lấy từ token đã xác thực ở máy chủ",
      "Vì URL có giới hạn độ dài",
      "Vì email chứa ký tự @ gây lỗi",
      "Vì tham số GET không mã hoá được",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Mức cô lập (isolation) của transaction ảnh hưởng tới điều gì?",
    o: [
      "Việc một transaction có nhìn thấy thay đổi chưa commit của transaction khác hay không",
      "Tốc độ ghi ra đĩa",
      "Số lượng bảng được phép tạo",
      "Kích thước tối đa của một dòng",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Preflight request (OPTIONS) trong CORS xuất hiện khi nào?",
    o: [
      "Khi request khác nguồn dùng phương thức hoặc header không nằm trong danh sách đơn giản",
      "Với mọi request khác nguồn không trừ trường hợp nào",
      "Chỉ khi gửi cookie",
      "Chỉ khi tải ảnh từ tên miền khác",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao phân trang bằng `LIMIT ... OFFSET ...` chậm dần khi đi tới trang sâu?",
    o: [
      "Cơ sở dữ liệu vẫn phải duyệt và bỏ qua toàn bộ số dòng trước OFFSET",
      "Vì OFFSET có giới hạn 1000",
      "Vì LIMIT không dùng được chỉ mục",
      "Vì mỗi trang mở một kết nối mới",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao nên đưa quy tắc nghiệp vụ (như tính giá) vào máy chủ thay vì để ở giao diện?",
    o: [
      "Máy khách sửa được, nên chỉ máy chủ mới là nơi ra quyết định đáng tin",
      "Vì JavaScript không tính toán chính xác",
      "Vì trình duyệt chạy chậm hơn máy chủ",
      "Vì quy tắc nghiệp vụ không viết được bằng JavaScript",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Điểm khác nhau giữa `PUT` và `PATCH` là gì?",
    o: [
      "PUT thay thế toàn bộ tài nguyên, PATCH sửa một phần",
      "PUT tạo mới, PATCH cập nhật",
      "PUT dùng cho ảnh, PATCH dùng cho văn bản",
      "Không khác nhau, chỉ là tên gọi",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Một API trả về mọi lỗi bằng mã 500 kèm mô tả chi tiết lỗi hệ thống. Rủi ro là gì?",
    o: [
      "Lộ chi tiết nội bộ cho kẻ tấn công, và máy khách không phân biệt được lỗi do mình hay do máy chủ",
      "Không có rủi ro, càng chi tiết càng dễ sửa",
      "Mã 500 làm chậm phản hồi",
      "Trình duyệt sẽ chặn phản hồi 500",
    ],
    a: 0,
  },
];
