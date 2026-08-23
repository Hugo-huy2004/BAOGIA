/**
 * Ngân hàng đề — Bài 50: Kiến trúc Web, Mật mã học & Giải thuật (phạm vi bài 26–49).
 *
 * Độ phức tạp · mảng/stack/queue/hash/cây · sắp xếp & tìm kiếm · đệ quy ·
 * băm và mã hoá · ký số · kiến trúc tầng.
 *
 * Cơ cấu và quy ước đáp án: xem `lesson6.js`.
 */
export default [
  // ── Suy luận · nhẹ ────────────────────────────────────────────────────────
  {
    group: "logic", level: "easy",
    q: "Mảng 1.000.000 phần tử đã sắp xếp. Tìm kiếm nhị phân cần tối đa bao nhiêu lần so sánh?",
    o: ["Khoảng 20", "Khoảng 1.000", "Khoảng 500.000", "Đúng 1.000.000"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Đẩy 1, 2, 3 vào stack rồi lấy ra một phần tử. Phần tử lấy ra là gì?",
    o: ["3", "1", "2", "Không xác định"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Vòng lặp lồng hai lớp, mỗi lớp chạy n lần. Độ phức tạp là bao nhiêu?",
    o: ["O(n²)", "O(n)", "O(log n)", "O(2n)"],
    a: 0,
  },
  {
    group: "logic", level: "easy",
    q: "Xếp hàng mua vé: ai đến trước được phục vụ trước. Cấu trúc dữ liệu nào mô tả đúng?",
    o: ["Queue (FIFO)", "Stack (LIFO)", "Hash table", "Cây nhị phân"],
    a: 0,
  },
  // ── Suy luận · trung bình ────────────────────────────────────────────────
  {
    group: "logic", level: "medium",
    q: "Cần kiểm tra 100.000 lần xem một email đã tồn tại trong danh sách 100.000 email chưa. Cấu trúc nào cho tổng thời gian tốt nhất?",
    o: [
      "Set/hash table — tra cứu trung bình O(1)",
      "Mảng chưa sắp xếp — duyệt tuần tự O(n)",
      "Danh sách liên kết",
      "Stack",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Hàm đệ quy tính giai thừa chạy với n = 100.000 và báo lỗi \"Maximum call stack size exceeded\". Nguyên nhân?",
    o: [
      "Mỗi lần gọi chiếm một khung trên stack, quá sâu thì tràn stack",
      "Số 100.000 quá lớn để lưu trong biến",
      "Đệ quy không tính được giai thừa",
      "Trình duyệt giới hạn thời gian chạy 5 giây",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Một hàm băm luôn trả về cùng một giá trị cho mọi đầu vào. Hash table dùng nó sẽ hoạt động thế nào?",
    o: [
      "Vẫn đúng kết quả nhưng tra cứu tụt về O(n) vì mọi khoá dồn vào một ô",
      "Báo lỗi ngay khi thêm phần tử thứ hai",
      "Tra cứu nhanh hơn vì chỉ có một ô",
      "Tự động đổi sang hàm băm khác",
    ],
    a: 0,
  },
  {
    group: "logic", level: "medium",
    q: "Cây nhị phân tìm kiếm được chèn dữ liệu đã sắp xếp tăng dần từ 1 đến n. Hình dạng cây và độ phức tạp tìm kiếm ra sao?",
    o: [
      "Cây suy biến thành danh sách một nhánh, tìm kiếm O(n)",
      "Cây vẫn cân bằng, tìm kiếm O(log n)",
      "Cây rỗng vì trùng khoá",
      "Cây tự cân bằng lại sau mỗi lần chèn",
    ],
    a: 0,
  },
  // ── Suy luận · nâng cao ──────────────────────────────────────────────────
  {
    group: "logic", level: "hard",
    q: "Hệ thống lưu mật khẩu bằng SHA-256 không salt. Kẻ tấn công lấy được toàn bộ bảng. Vì sao vẫn nguy hiểm dù mật khẩu \"đã băm\"?",
    o: [
      "SHA-256 rất nhanh và không salt, nên bảng tra sẵn (rainbow table) dò ra mật khẩu phổ biến gần như tức thì",
      "SHA-256 có thể giải ngược về mật khẩu gốc",
      "Vì SHA-256 chỉ dài 256 bit nên dễ trùng",
      "Không nguy hiểm, đã băm là an toàn",
    ],
    a: 0,
  },
  {
    group: "logic", level: "hard",
    q: "So sánh chữ ký HMAC bằng `===` thay vì hàm so sánh thời gian hằng định. Lỗ hổng ở đâu?",
    o: [
      "Thời gian so sánh phụ thuộc số ký tự khớp đầu, kẻ tấn công đo được và dò dần từng ký tự",
      "`===` không so sánh được chuỗi dài",
      "`===` tự động ép kiểu làm sai kết quả",
      "Không có lỗ hổng, `===` là cách đúng",
    ],
    a: 0,
  },

  // ── Lý thuyết ────────────────────────────────────────────────────────────
  {
    group: "theory",
    q: "Truy cập `arr[i]` trong mảng có độ phức tạp là bao nhiêu?",
    o: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    a: 0,
  },
  {
    group: "theory",
    q: "Tìm kiếm nhị phân đòi hỏi điều kiện tiên quyết nào?",
    o: ["Dữ liệu đã được sắp xếp", "Dữ liệu là số nguyên", "Mảng có ít hơn 1000 phần tử", "Không có phần tử trùng"],
    a: 0,
  },
  {
    group: "theory",
    q: "Merge sort có độ phức tạp thời gian trung bình là bao nhiêu?",
    o: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    a: 0,
  },
  {
    group: "theory",
    q: "Khác biệt cốt lõi giữa băm (hashing) và mã hoá (encryption) là gì?",
    o: [
      "Băm là một chiều không khôi phục được, mã hoá là hai chiều có thể giải mã",
      "Băm mạnh hơn mã hoá",
      "Mã hoá nhanh hơn băm",
      "Băm dùng khoá, mã hoá thì không",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "\"Salt\" trong lưu mật khẩu có tác dụng gì?",
    o: [
      "Thêm chuỗi ngẫu nhiên riêng cho mỗi mật khẩu, khiến bảng tra sẵn vô dụng",
      "Rút ngắn chuỗi băm để tiết kiệm dung lượng",
      "Mã hoá mật khẩu để giải ngược khi cần",
      "Tăng tốc quá trình băm",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Vì sao bcrypt/argon2 phù hợp cho mật khẩu hơn SHA-256?",
    o: [
      "Chúng cố ý chậm và điều chỉnh được chi phí, làm dò brute-force tốn kém",
      "Chúng sinh chuỗi ngắn hơn",
      "Chúng có thể giải ngược khi quên mật khẩu",
      "Chúng không cần salt",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Mã hoá đối xứng khác bất đối xứng ở điểm nào?",
    o: [
      "Đối xứng dùng một khoá cho cả mã hoá và giải mã; bất đối xứng dùng cặp khoá công khai – bí mật",
      "Đối xứng an toàn hơn tuyệt đối",
      "Bất đối xứng nhanh hơn nhiều lần",
      "Đối xứng chỉ dùng cho file, bất đối xứng chỉ cho văn bản",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "HMAC dùng để làm gì?",
    o: [
      "Chứng minh dữ liệu không bị sửa và đến từ bên biết khoá bí mật",
      "Mã hoá dữ liệu để giấu nội dung",
      "Nén dữ liệu trước khi gửi",
      "Sinh khoá công khai từ khoá bí mật",
    ],
    a: 0,
  },
  {
    group: "theory",
    q: "Stack hoạt động theo cơ chế nào?",
    o: ["LIFO — vào sau ra trước", "FIFO — vào trước ra trước", "Ngẫu nhiên", "Theo thứ tự ưu tiên"],
    a: 0,
  },
  {
    group: "theory",
    q: "Big-O mô tả điều gì?",
    o: [
      "Cách chi phí tăng lên khi dữ liệu lớn dần, ở trường hợp xấu nhất",
      "Thời gian chạy tính bằng mili giây",
      "Dung lượng file mã nguồn",
      "Số dòng code của thuật toán",
    ],
    a: 0,
  },

  // ── Đọc & điền code ──────────────────────────────────────────────────────
  {
    group: "code",
    q: "Điền vào chỗ trống để thu hẹp khoảng tìm kiếm về nửa phải:",
    code: "while (low <= high) {\n  const mid = Math.floor((low + high) / 2);\n  if (arr[mid] === target) return mid;\n  if (arr[mid] < target) ____;\n  else high = mid - 1;\n}",
    o: ["low = mid + 1", "low = mid", "high = mid + 1", "low = low + 1"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để đệ quy dừng lại:",
    code: "function giaiThua(n) {\n  ____ return 1;\n  return n * giaiThua(n - 1);\n}",
    o: ["if (n <= 1)", "if (n === 0) n = 1;", "while (n > 1)", "if (n > 1)"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy phần tử ra khỏi stack:",
    code: "const stack = [];\nstack.push(1);\nstack.push(2);\nconst top = stack.____(); // 2",
    o: ["pop", "shift", "slice", "peek"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để lấy phần tử ra khỏi queue theo đúng FIFO:",
    code: "const queue = [];\nqueue.push(\"A\");\nqueue.push(\"B\");\nconst next = queue.____(); // \"A\"",
    o: ["shift", "pop", "unshift", "splice"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để kiểm tra một email đã tồn tại với chi phí O(1):",
    code: "const seen = new Set(emails);\nif (seen.____(input)) {\n  throw new Error(\"Email đã dùng\");\n}",
    o: ["has", "includes", "indexOf", "find"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để băm mật khẩu kèm salt bằng bcrypt:",
    code: "const salt = await bcrypt.genSalt(12);\nconst hash = await bcrypt.____(password, salt);",
    o: ["hash", "encrypt", "compare", "digest"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để so sánh chữ ký an toàn trước tấn công đo thời gian:",
    code: "const ok = crypto.____(\n  Buffer.from(expected),\n  Buffer.from(received)\n);",
    o: ["timingSafeEqual", "equals", "compare", "verifyHash"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để tạo chữ ký HMAC SHA-256:",
    code: "const sig = crypto\n  .createHmac(\"sha256\", ____)\n  .update(payload)\n  .digest(\"hex\");",
    o: ["secretKey", "payload", "\"sha256\"", "publicKey"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để duyệt cây theo thứ tự giữa (in-order):",
    code: "function inOrder(node) {\n  if (!node) return;\n  inOrder(node.left);\n  ____;\n  inOrder(node.right);\n}",
    o: ["console.log(node.value)", "return node.value", "inOrder(node)", "node = node.right"],
    a: 0,
  },
  {
    group: "code",
    q: "Điền vào chỗ trống để đếm số lần xuất hiện của mỗi từ:",
    code: "const count = new Map();\nfor (const word of words) {\n  count.set(word, (count.____(word) || 0) + 1);\n}",
    o: ["get", "has", "find", "read"],
    a: 0,
  },

  // ── Nâng cao ─────────────────────────────────────────────────────────────
  {
    group: "advanced",
    q: "Vì sao quicksort trung bình O(n log n) nhưng xấu nhất vẫn O(n²)?",
    o: [
      "Nếu chốt (pivot) luôn rơi vào phần tử nhỏ nhất hoặc lớn nhất, mỗi lần chia chỉ bớt được một phần tử",
      "Vì quicksort phải sao chép mảng mỗi lần chia",
      "Vì đệ quy luôn chậm hơn vòng lặp",
      "Vì nó cần bộ nhớ phụ O(n)",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Đánh đổi chính khi dùng hash table thay cho mảng đã sắp xếp là gì?",
    o: [
      "Mất thứ tự và mất khả năng truy vấn khoảng, đổi lấy tra cứu O(1)",
      "Tốn ít bộ nhớ hơn nhưng chậm hơn",
      "Không đánh đổi gì",
      "Hash table không lưu được chuỗi",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao cây AVL/đỏ-đen tự cân bằng lại đáng công sức so với cây nhị phân thường?",
    o: [
      "Chúng giữ chiều cao ở mức log n nên đảm bảo tìm kiếm O(log n) kể cả với dữ liệu vào đã sắp xếp",
      "Chúng tốn ít bộ nhớ hơn",
      "Chúng chèn nhanh hơn cây thường trong mọi trường hợp",
      "Chúng không cần so sánh khoá",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Memoization cải thiện đệ quy Fibonacci từ O(2ⁿ) xuống bao nhiêu, nhờ điều gì?",
    o: [
      "O(n) — mỗi giá trị chỉ tính một lần rồi lưu lại dùng tiếp",
      "O(log n) — nhờ chia đôi bài toán",
      "O(1) — nhờ công thức đóng",
      "Không cải thiện, chỉ tốn thêm bộ nhớ",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Chữ ký số (digital signature) chứng minh được điều gì mà mã hoá thường không?",
    o: [
      "Nguồn gốc và tính toàn vẹn — ai ký và nội dung chưa bị sửa",
      "Nội dung được giữ bí mật",
      "Dữ liệu được nén nhỏ hơn",
      "Người nhận không đọc được nếu thiếu khoá",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "TLS dùng cả mã hoá bất đối xứng lẫn đối xứng. Vì sao không dùng bất đối xứng cho toàn bộ phiên?",
    o: [
      "Bất đối xứng chậm hơn nhiều lần; nó chỉ dùng để trao đổi khoá phiên rồi chuyển sang đối xứng",
      "Bất đối xứng không mã hoá được dữ liệu nhị phân",
      "Vì trình duyệt không hỗ trợ",
      "Vì khoá công khai hết hạn quá nhanh",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Khi nào O(n²) chấp nhận được hơn O(n log n)?",
    o: [
      "Khi n rất nhỏ và hằng số của thuật toán đơn giản nhỏ hơn nhiều",
      "Không bao giờ, O(n log n) luôn tốt hơn",
      "Khi dữ liệu đã được sắp xếp",
      "Khi chạy trên máy chủ nhiều lõi",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Vì sao không nên tự viết thuật toán mã hoá cho sản phẩm thật?",
    o: [
      "Thuật toán chưa qua nhiều năm phân tích công khai gần như chắc chắn có lỗ hổng chưa thấy",
      "Vì luật cấm tự viết mã hoá",
      "Vì tự viết sẽ chạy chậm hơn",
      "Vì không tương thích với trình duyệt",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Va chạm (collision) trong hash table được xử lý bằng cách nào?",
    o: [
      "Nối chuỗi (chaining) hoặc dò tuyến tính (open addressing)",
      "Báo lỗi và từ chối khoá mới",
      "Ghi đè giá trị cũ",
      "Đổi hàm băm cho toàn bộ bảng",
    ],
    a: 0,
  },
  {
    group: "advanced",
    q: "Duyệt cây theo chiều rộng (BFS) cần cấu trúc dữ liệu phụ nào?",
    o: ["Queue", "Stack", "Hash table", "Không cần cấu trúc phụ"],
    a: 0,
  },
];
