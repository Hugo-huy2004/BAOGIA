export const ADVANCED_LESSONS = [
  {
    id: "lesson26",
    title: "26. Cấu trúc dữ liệu: Mảng (Array) & Danh sách liên kết (Linked List)",
    lang: "javascript",
    file: "src/lesson26.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Mảng (Array) lưu các phần tử liên tiếp trong bộ nhớ vật lý, truy cập nhanh qua chỉ số (O(1)) nhưng chèn/xóa chậm (O(n)). Danh sách liên kết (Linked List) gồm các nút trỏ đến nhau, chèn/xóa nhanh (O(1)) nhưng truy cập chậm (O(n)).

### ÁP DỤNG HỆ THỐNG
Trong hệ thống chat hoặc lịch sử undo/redo, cấu trúc danh sách liên kết kép (Double Linked List) giúp chèn nhanh tin nhắn mới mà không cần cấp phát lại toàn bộ mảng.

### THỰC HÀNH NHỎ
Định nghĩa một nút (Node) cơ bản của Linked List chứa giá trị và con trỏ trỏ tới phần tử tiếp theo.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã JS định nghĩa class \`Node\` có các thuộc tính \`value\` và \`next\`.`,
    tasks: [
      "Xây dựng cấu trúc Node của Linked List trong JavaScript."
    ],
    starterCode: `class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("this.value") && c.includes("this.next");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Độ phức tạp khi truy cập ngẫu nhiên phần tử trong mảng là bao nhiêu?", o: ["O(1)", "O(n)", "O(log n)", "O(n²)"], a: 0 }
    ]
  },
  {
    id: "lesson27",
    title: "27. Cấu trúc dữ liệu: Ngăn xếp (Stack), Hàng đợi (Queue) & Bảng băm",
    lang: "javascript",
    file: "src/lesson27.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Ngăn xếp (Stack) hoạt động theo cơ chế LIFO (Last In First Out). Hàng đợi (Queue) theo cơ chế FIFO (First In First Out). Bảng băm (Hash Table) ánh xạ key thành index qua hàm băm để lưu trữ cặp key-value truy cập cực nhanh O(1).

### ÁP DỤNG HỆ THỐNG
Trình duyệt quản lý lịch sử chuyển trang qua một Stack (Back/Forward). Hàng đợi gửi email trong backend sử dụng Queue để xử lý lần lượt theo thứ tự gửi.

### THỰC HÀNH NHỎ
Lập trình lớp Stack cơ bản với hai phương thức cốt lõi: \`push()\` và \`pop()\`.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS định nghĩa class \`Stack\` có chứa hai hàm \`push\` và \`pop\`.`,
    tasks: [
      "Xây dựng cấu trúc ngăn xếp Stack trong JavaScript."
    ],
    starterCode: `class Stack {
  constructor() {
    this.items = [];
  }
  push(element) {
    this.items.push(element);
  }
  pop() {
    return this.items.pop();
  }
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("push(") && c.includes("pop(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Cơ chế hoạt động của Hàng đợi (Queue) là gì?", o: ["LIFO", "FIFO", "LILO", "Ngẫu nhiên"], a: 1 }
    ]
  },
  {
    id: "lesson28",
    title: "28. Thuật toán tìm kiếm: Nhị phân (Binary) & Tuyến tính (Linear)",
    lang: "javascript",
    file: "src/lesson28.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Tìm kiếm tuyến tính (Linear Search) duyệt qua từng phần tử (O(n)). Tìm kiếm nhị phân (Binary Search) chia đôi khoảng tìm kiếm trên mảng đã sắp xếp, đạt độ phức tạp tối ưu O(log n).

### ÁP DỤNG HỆ THỐNG
Khi tìm kiếm ID của một bản ghi trong hàng triệu bản ghi đã sắp xếp chỉ mục (Index) của database, hệ thống sử dụng thuật toán tìm kiếm nhị phân để trả về kết quả trong vài mili giây.

### THỰC HÀNH NHỎ
Lập trình thuật toán tìm kiếm nhị phân trên mảng số nguyên đã sắp xếp.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS định nghĩa hàm \`binarySearch\` có tính toán chỉ số trung vị \`Math.floor\` và chia đôi mảng.`,
    tasks: [
      "Viết thuật toán tìm kiếm nhị phân chia đôi mảng đã sắp xếp."
    ],
    starterCode: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("binarysearch") && c.includes("left<=right") && c.includes("math.floor");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Điều kiện bắt buộc để áp dụng tìm kiếm nhị phân là gì?", o: ["Mảng phải được sắp xếp", "Mảng phải rỗng", "Mảng chứa chuỗi", "Không cần điều kiện"], a: 0 }
    ]
  },
  {
    id: "lesson29",
    title: "29. Thuật toán sắp xếp nâng cao: Quick Sort & Merge Sort",
    lang: "javascript",
    file: "src/lesson29.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Sắp xếp nổi bọt (Bubble Sort) rất chậm (O(n²)). Các thuật toán chia để trị như Quick Sort và Merge Sort đạt hiệu năng vượt trội O(n log n), phù hợp sắp xếp tập dữ liệu lớn.

### ÁP DỤNG HỆ THỐNG
Hàm \`Array.prototype.sort()\` trong các trình duyệt JS sử dụng các biến thể tối ưu của Merge Sort (như Timsort) để đảm bảo tốc độ sắp xếp nhanh và ổn định.

### THỰC HÀNH NHỎ
Định nghĩa cấu trúc hàm đệ quy cơ bản của Quick Sort chia mảng qua một phần tử chốt (pivot).

### KIỂM TRA HOÀN TẤT
Kiểm tra mã nguồn có định nghĩa hàm sắp xếp \`quickSort\` chứa phép đệ quy tự gọi lại.`,
    tasks: [
      "Viết hàm Quick Sort đệ quy phân loại phần tử theo pivot."
    ],
    starterCode: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter((x, i) => x < pivot && i < arr.length - 1);
  const right = arr.filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("quicksort") && c.includes("return[...quicksort");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Độ phức tạp trung bình của thuật toán Merge Sort là bao nhiêu?", o: ["O(n²)", "O(n)", "O(n log n)", "O(1)"], a: 2 }
    ]
  },
  {
    id: "lesson30",
    title: "30. Độ phức tạp thuật toán: Big O Notation",
    lang: "javascript",
    file: "src/lesson30.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Độ ký pháp Big O đo lường xu hướng tăng trưởng thời gian chạy (Time Complexity) và không gian bộ nhớ (Space Complexity) của thuật toán khi dữ liệu đầu vào n tăng lên: O(1) hằng số, O(log n) nhị phân, O(n) tuyến tính, O(n²) bình phương.

### ÁP DỤNG HỆ THỐNG
Tránh tối đa việc viết 2 vòng lặp lồng nhau vô điều kiện trên tập dữ liệu lớn (O(n²)), vì khi n = 100,000, số phép tính sẽ lên tới 10 tỷ phép tính làm treo máy chủ.

### THỰC HÀNH NHỎ
Rút gọn một thuật toán lặp tìm kiếm trùng lặp O(n²) sang sử dụng bảng băm Set O(n).

### KIỂM TRA HOÀN TẤT
Kiểm tra mã nguồn sử dụng đối tượng \`Set\` trong JS để tối ưu hóa tìm kiếm trùng lặp từ O(n²) về O(n).`,
    tasks: [
      "Tối ưu hóa thuật toán tìm phần tử trùng lặp sử dụng cấu trúc dữ liệu Set."
    ],
    starterCode: `function hasDuplicate(arr) {
  const seen = new Set();
  for (let x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("newset()") && c.includes("seen.has(") && c.includes("seen.add(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Độ phức tạp của việc truy vấn một phần tử trong cấu trúc Set là bao nhiêu?", o: ["O(1)", "O(n)", "O(log n)", "O(n²)"], a: 0 }
    ]
  },
  {
    id: "lesson31",
    title: "31. Mật mã học: Mã hóa Đối xứng (AES) & Bất đối xứng (RSA)",
    lang: "javascript",
    file: "src/lesson31.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Mã hóa đối xứng (Symmetric Encryption - như AES) dùng chung 1 khóa bí mật để mã hóa và giải mã. Mã hóa bất đối xứng (Asymmetric Encryption - như RSA) dùng cặp khóa: Public Key (Mã hóa công khai) và Private Key (Giải mã bí mật).

### ÁP DỤNG HỆ THỐNG
Khi trình duyệt kết nối HTTPS: RSA được dùng để trao đổi khóa bí mật an toàn, sau đó AES được dùng để mã hóa toàn bộ dữ liệu truyền tải vì tốc độ giải mã AES nhanh hơn nhiều.

### THỰC HÀNH NHỎ
Viết mã giả lập quá trình giải mã dữ liệu đối xứng khi có khóa bí mật đúng.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS định nghĩa hàm có kiểm tra khóa giải mã bí mật khớp.`,
    tasks: [
      "Xây dựng logic mô phỏng quá trình giải mã dữ liệu đối xứng AES."
    ],
    starterCode: `function decryptData(encryptedText, secretKey) {
  if (secretKey !== "my-super-secret-key") {
    throw new Error("Sai khóa bảo mật!");
  }
  return "Dữ liệu gốc giải mã thành công";
}`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("decryptdata") && c.includes("secretkey");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Mã hóa RSA sử dụng cặp khóa nào?", o: ["Cùng một khóa bí mật", "Khóa công khai và Khóa bí mật", "Không cần khóa", "Hai khóa bí mật giống nhau"], a: 1 }
    ]
  },
  {
    id: "lesson32",
    title: "32. Mật mã học: Hàm băm một chiều (Hash Functions) & Salt",
    lang: "php",
    file: "src/lesson32.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Hàm băm một chiều (Hash Function - SHA256, bcrypt) biến đổi chuỗi đầu vào bất kỳ thành một chuỗi mã hóa có độ dài cố định và không thể dịch ngược lại. 'Salt' là chuỗi ngẫu nhiên thêm vào mật khẩu trước khi băm để chống tấn công bảng Rainbow Table.

### ÁP DỤNG HỆ THỐNG
Hệ thống không bao giờ lưu mật khẩu thường. Khi người dùng đăng ký, hệ thống băm mật khẩu kèm salt ngẫu nhiên rồi lưu chuỗi băm vào CSDL. Khi đăng nhập, ta băm mật khẩu nhập vào với salt cũ rồi so khớp hai chuỗi băm.

### THỰC HÀNH NHỎ
Sử dụng hàm băm một chiều SHA-256 (hoặc bcrypt) để băm dữ liệu nhập vào trong PHP.

### KIỂM TRA HOÀN TẤT
Đảm bảo file PHP sử dụng hàm băm mật mã \`hash()\` hoặc \`password_hash()\`.`,
    tasks: [
      "Thực hành viết lệnh băm dữ liệu một chiều an toàn trong PHP."
    ],
    starterCode: `<?php
$password = "123456";
$hash = hash("sha256", $password . "random_salt_123");
echo $hash;
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("hash(") || c.includes("password_hash(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Đặc điểm quan trọng nhất của hàm băm một chiều là gì?", o: ["Dễ dàng giải mã ngược lại", "Không thể dịch ngược lại từ mã băm ra dữ liệu gốc", "Tốc độ chạy chậm", "Có độ dài tùy biến"], a: 1 }
    ]
  },
  {
    id: "lesson33",
    title: "33. Xác thực người dùng nâng cao: JWT & OAuth2",
    lang: "javascript",
    file: "src/lesson33.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
JWT (JSON Web Token) là định dạng token tự chứa thông tin phiên đăng nhập gồm 3 phần: Header, Payload, Signature. OAuth2 là giao thức ủy quyền cho phép ứng dụng truy cập tài nguyên qua bên thứ ba (như Đăng nhập bằng Google, Github).

### ÁP DỤNG HỆ THỐNG
Khi đăng nhập thành công vào portal, backend trả về 1 chuỗi JWT. Frontend lưu JWT này vào Authorization Header (\`Bearer <token>\`) cho mỗi request gửi lên API để xác thực quyền mà không cần truy vấn session trong database.

### THỰC HÀNH NHỎ
Mô phỏng hàm kiểm tra định dạng JWT hợp lệ gồm 3 phần phân cách bởi dấu chấm (\`.\`).

### KIỂM TRA HOÀN TẤT
Kiểm tra mã nguồn JS có phân tách chuỗi token bằng phương thức \`split('.')\` và kiểm tra độ dài bằng 3.`,
    tasks: [
      "Lập trình hàm phân tích định dạng Token JWT bằng JavaScript."
    ],
    starterCode: `function verifyJwtFormat(token) {
  const parts = token.split(".");
  return parts.length === 3;
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("split(\".\")") || c.includes("split('.')");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "JWT gồm mấy phần cấu thành phân tách bởi dấu chấm?", o: ["2 phần", "3 phần", "4 phần", "5 phần"], a: 1 }
    ]
  },
  {
    id: "lesson34",
    title: "34. Giải mã & Mã hóa định dạng: Base64, Hex & URL Encode",
    lang: "javascript",
    file: "src/lesson34.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Mã hóa định dạng (Encoding) không phải là bảo mật, nó chỉ biến đổi dữ liệu sang định dạng khác để truyền tải an toàn: Base64 biểu diễn dữ liệu nhị phân dưới dạng text, Hex dùng hệ cơ số 16, URL Encoding mã hóa các ký tự đặc biệt trong liên kết URL.

### ÁP DỤNG HỆ THỐNG
Khi gửi ảnh đại diện qua JSON API, ta mã hóa file ảnh nhị phân thành chuỗi Base64 (\`data:image/png;base64,...\`) để đính kèm trực tiếp vào payload JSON.

### THỰC HÀNH NHỎ
Viết lệnh JavaScript chuyển đổi chuỗi văn bản thường sang định dạng Base64 và ngược lại.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS sử dụng hàm tích hợp sẵn của trình duyệt: \`btoa()\` (mã hóa Base64) và \`atob()\` (giải mã Base64).`,
    tasks: [
      "Mã hóa và giải mã chuỗi văn bản sang định dạng Base64 trong JavaScript."
    ],
    starterCode: `const text = "HugoCoder";
const encoded = btoa(text);
const decoded = atob(encoded);
console.log(encoded, decoded);`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("btoa(") && c.includes("atob(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Hàm nào dùng để mã hóa một chuỗi ký tự sang Base64 trong trình duyệt?", o: ["atob()", "btoa()", "encodeURIComponent()", "escape()"], a: 1 }
    ]
  },
  {
    id: "lesson35",
    title: "35. Lập trình bất đồng bộ nâng cao: Promises, Async/Await & Event Loop",
    lang: "javascript",
    file: "src/lesson35.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
JS chạy đơn luồng (single-threaded). Nó xử lý bất đồng bộ qua Event Loop: Các tác vụ nặng (gọi mạng, đọc file) được đưa vào Web APIs, khi chạy xong sẽ đẩy callback vào Callback Queue (hoặc Microtask Queue) để thực thi khi Call Stack rỗng.

### ÁP DỤNG HỆ THỐNG
Sử dụng cú pháp \`async/await\` giúp viết code bất đồng bộ trông giống như đồng bộ, tránh lỗi Callback Hell (lồng nhiều hàm callback vô tận) và giúp việc bắt lỗi qua \`try/catch\` trực quan hơn.

### THỰC HÀNH NHỎ
Viết một hàm bất đồng bộ sử dụng \`async/await\` gọi API lấy danh sách bài học và bắt lỗi nếu kết nối thất bại.

### KIỂM TRA HOÀN TẤT
Mã nguồn JS phải có từ khóa \`async\`, \`await\` kết hợp cấu trúc xử lý lỗi \`try\` và \`catch\`.`,
    tasks: [
      "Lập trình hàm bất đồng bộ lấy dữ liệu API sử dụng cấu trúc async/await."
    ],
    starterCode: `async function fetchLessons() {
  try {
    const response = await fetch("/api/lessons");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu bài học:", error);
  }
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("asyncfunction") && c.includes("await") && c.includes("try{") && c.includes("catch(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Tác vụ nào sau đây được ưu tiên chạy trước trong Event Loop?", o: ["Macrotask (setTimeout)", "Microtask (Promise callback)", "Nhấp chuột", "Duyệt ảnh"], a: 1 }
    ]
  },
  {
    id: "lesson36",
    title: "36. Giao tiếp thời gian thực: WebSockets",
    lang: "javascript",
    file: "src/lesson36.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
WebSockets cung cấp kết nối hai chiều (Full-Duplex) liên tục, thời gian thực giữa Client và Server trên một kết nối TCP duy nhất, loại bỏ chi phí HTTP overhead của việc gửi request liên tục (Polling).

### ÁP DỤNG HỆ THỐNG
Tính năng Bạn Học Đường Chat của portal sử dụng WebSockets để tin nhắn của bạn được chuyển đến màn hình của đối phương ngay lập tức mà không cần người dùng tải lại trang.

### THỰC HÀNH NHỎ
Khởi tạo kết nối WebSocket đến server, lắng nghe sự kiện nhận tin nhắn mới và in ra console.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS khởi tạo đối tượng \`new WebSocket\` và định nghĩa hàm callback \`onmessage\`.`,
    tasks: [
      "Viết mã kết nối máy chủ WebSocket và xử lý nhận tin nhắn thời gian thực."
    ],
    starterCode: `const socket = new WebSocket("ws://localhost:3000/chat");
socket.onmessage = function(event) {
  const msg = JSON.parse(event.data);
  console.log("Tin nhắn mới nhận:", msg);
};`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("newWebSocket(") && c.includes(".onmessage=");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Lợi ích lớn nhất của WebSockets so với HTTP Polling là gì?", o: ["Truyền tải chậm hơn", "Kết nối hai chiều thời gian thực với độ trễ cực thấp", "Không cần máy chủ", "Mã hóa sẵn dữ liệu"], a: 1 }
    ]
  },
  {
    id: "lesson37",
    title: "37. Tối ưu hóa hiệu năng: Critical Rendering Path & DOM",
    lang: "html",
    file: "src/lesson37.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Critical Rendering Path (Đường dẫn kết xuất quan trọng) là chuỗi các bước trình duyệt nhận HTML, CSS, JS để dựng layout và vẽ (Paint) pixel lên màn hình. Dựng lại DOM liên tục gây hiện tượng giật lag màn hình (Reflow/Repaint).

### ÁP DỤNG HỆ THỐNG
Để tối ưu hóa hiệu năng render biểu đồ học tập, hệ thống giảm thiểu tối đa số lần đọc/ghi DOM trực tiếp, gom các cập nhật hiển thị vào một đợt duy nhất (Batching DOM Updates).

### THỰC HÀNH NHỎ
Sử dụng \`DocumentFragment\` để chèn nhiều phần tử HTML vào cây DOM cùng một lúc thay vì chèn riêng lẻ từng thẻ.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS sử dụng đối tượng \`document.createDocumentFragment()\` để gom nhóm các phần tử trước khi chèn vào DOM.`,
    tasks: [
      "Sử dụng DocumentFragment để tối ưu số lần ghi DOM trong JavaScript."
    ],
    starterCode: `const list = document.getElementById("list");
const fragment = document.createDocumentFragment();
for (let i = 0; i < 5; i++) {
  const li = document.createElement("li");
  li.textContent = "Mục " + i;
  fragment.appendChild(li);
}
list.appendChild(fragment);`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("createdocumentfragment()") && c.includes("appendchild(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Hành động nào sau đây kích hoạt quá trình Reflow nặng nhất?", o: ["Đổi màu chữ", "Thay đổi kích thước hoặc vị trí phần tử hình học", "Lưu biến", "Gọi console.log"], a: 1 }
    ]
  },
  {
    id: "lesson38",
    title: "38. Tối ưu hóa hiệu năng: Core Web Vitals (LCP, INP, CLS)",
    lang: "html",
    file: "src/lesson38.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Core Web Vitals là bộ chỉ số của Google đo lường trải nghiệm người dùng thực tế: LCP (Largest Contentful Paint - thời gian tải nội dung chính), INP (Interaction to Next Paint - độ trễ phản hồi tương tác), CLS (Cumulative Layout Shift - độ ổn định thị giác).

### ÁP DỤNG HỆ THỐNG
Để cải thiện chỉ số INP cho các nút bấm nộp bài, portal tách các tác vụ nặng ra khỏi luồng xử lý chính bằng \`requestIdleCallback()\` hoặc \`setTimeout()\`, giúp giao diện không bị đơ.

### THỰC HÀNH NHỎ
Định cấu hình kích thước hình ảnh \`width\` và \`height\` cố định để ngăn chặn giật lag giao diện dịch chuyển (CLS) khi ảnh tải xong.

### KIỂM TRA HOÀN TẤT
Đảm bảo thẻ ảnh \`<img>\` định nghĩa rõ ràng cả hai thuộc tính \`width\` và \`height\`.`,
    tasks: [
      "Viết thẻ ảnh có cấu hình kích thước chuẩn hóa để ngăn ngừa Layout Shift."
    ],
    starterCode: `<img src="logo.png" alt="Logo Hugo Studio" width="200" height="80">`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("<img") && c.includes("width=") && c.includes("height=");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Chỉ số CLS đo lường khía cạnh nào của trang web?", o: ["Tốc độ mạng", "Độ ổn định thị giác (tránh dịch chuyển layout đột ngột)", "Độ trễ phản hồi nút bấm", "Bảo mật"], a: 1 }
    ]
  },
  {
    id: "lesson39",
    title: "39. Tối ưu hóa hiệu năng: Rò rỉ bộ nhớ (Memory Leaks) & GC",
    lang: "javascript",
    file: "src/lesson39.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Trình duyệt tự động thu hồi bộ nhớ thông qua bộ dọn rác (Garbage Collector - GC) bằng thuật toán Mark-and-Sweep. Tuy nhiên, rò rỉ bộ nhớ (Memory Leak) vẫn xảy ra do: tham chiếu biến toàn cầu không mong muốn, quên gỡ bỏ Event Listeners, hoặc quên tắt Interval.

### ÁP DỤNG HỆ THỐNG
Khi chuyển tab học tập trong Member Portal, hệ thống tự động hủy toàn bộ các bộ đếm giờ chạy ngầm (\`clearInterval\`) và gỡ bỏ các sự kiện cuộn chuột để giải phóng RAM lập tức.

### THỰC HÀNH NHỎ
Viết hàm thiết lập một listener lắng nghe sự kiện resize của window và trả về một hàm Cleanup để gỡ bỏ listener đó khi không dùng.

### KIỂM TRA HOÀN TẤT
Mã nguồn JS có sử dụng phương thức \`removeEventListener\` để dọn dẹp bộ lắng nghe sự kiện.`,
    tasks: [
      "Viết logic quản lý vòng đời sự kiện và dọn dẹp Event Listener để tránh rò rỉ bộ nhớ."
    ],
    starterCode: `function setupResizeHandler() {
  const handler = () => console.log(window.innerWidth);
  window.addEventListener("resize", handler);
  return () => {
    window.removeEventListener("resize", handler);
  };
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("removeeventlistener");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thuật toán dọn rác phổ biến của các trình duyệt hiện đại là gì?", o: ["Reference Counting", "Mark-and-Sweep", "FIFO", "LIFO"], a: 1 }
    ]
  },
  {
    id: "lesson40",
    title: "40. Tối ưu hóa hiệu năng: Asset Bundling & Code Splitting",
    lang: "javascript",
    file: "src/lesson40.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Asset Bundling gom nhiều file code nhỏ thành bundle lớn. Code Splitting chia nhỏ bundle đó và áp dụng Dynamic Import (\`import()\`) để chỉ tải những trang hoặc thư viện khi người dùng thực sự mở tới.

### ÁP DỤNG HỆ THỐNG
Trang IDE MemberIdeTab rất nặng, do đó hệ thống áp dụng Lazy Loading (\`React.lazy\`) để tách riêng tab IDE ra khỏi trang tổng quan ban đầu, giúp trang chủ Portal tải nhanh gấp 5 lần.

### THỰC HÀNH NHỎ
Sử dụng cú pháp Dynamic Import bất đồng bộ trong JS để tải một thư viện biểu đồ khi nút bấm được click.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS gọi hàm \`import()\` dưới dạng động bất đồng bộ bên trong một hàm xử lý sự kiện.`,
    tasks: [
      "Lập trình tải động thư viện lập biểu đồ bằng Dynamic Import."
    ],
    starterCode: `async function loadChartLibrary() {
  const { renderChart } = await import("./chartUtils.js");
  renderChart();
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("awaitimport(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Mục tiêu chính của Code Splitting là gì?", o: ["Giảm dung lượng bundle ban đầu để tăng tốc độ tải trang", "Tạo nhiều code thừa", "Bảo mật code", "Đổi tên biến"], a: 0 }
    ]
  },
  {
    id: "lesson41",
    title: "41. Cơ sở dữ liệu nâng cao: Tối ưu chỉ mục (Database Indexing)",
    lang: "sql",
    file: "src/lesson41.sql",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chỉ mục cơ sở dữ liệu (Database Index - B-Tree, Hash) hoạt động như mục lục sách, giúp tìm hàng dữ liệu khớp nhanh chóng mà không cần quét toàn bộ bảng (Table Scan). Phân tích hiệu năng câu lệnh bằng \`EXPLAIN\` truy vấn.

### ÁP DỤNG HỆ THỐNG
Cột \`email\` và \`phone\` của bảng thành viên đều được đánh chỉ mục \`INDEX\` độc nhất (UNIQUE) để thao tác đăng nhập và chuyển tiền diễn ra trong chưa đầy 1 mili giây.

### THỰC HÀNH NHỎ
Viết câu lệnh SQL tạo chỉ mục trên cột \`category\` của bảng \`products\` để tăng tốc độ lọc sản phẩm.

### KIỂM TRA HOÀN TẤT
Đảm bảo câu lệnh SQL sử dụng mệnh đề cấu trúc \`CREATE INDEX\` trên bảng \`products\`.`,
    tasks: [
      "Viết lệnh SQL thiết lập INDEX tối ưu hóa tìm kiếm sản phẩm."
    ],
    starterCode: `CREATE INDEX idx_products_category ON products(category);
EXPLAIN SELECT * FROM products WHERE category = 'electronics';`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("CREATE INDEX") && c.includes("ON PRODUCTS");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Đánh quá nhiều chỉ mục (INDEX) sẽ gây tác hại gì?", o: ["Làm truy vấn SELECT chậm đi", "Làm các thao tác INSERT/UPDATE/DELETE chậm đi do phải cập nhật lại mục lục", "Tốn bộ nhớ ram", "Không có tác hại"], a: 1 }
    ]
  },
  {
    id: "lesson42",
    title: "42. Cơ sở dữ liệu nâng cao: Chiến lược Caching",
    lang: "javascript",
    file: "src/lesson42.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Caching lưu trữ các bản sao dữ liệu có tần suất đọc cao nhưng ít thay đổi vào một bộ nhớ tốc độ cao (như RAM - Redis/Memcached) hoặc bộ nhớ đệm ứng dụng để tránh truy vấn trực tiếp vào Database chậm chạp.

### ÁP DỤNG HỆ THỐNG
Thông tin bảng giá dịch vụ và danh sách 50 bài học được hệ thống đưa vào bộ nhớ đệm cache. Thay vì truy vấn MySQL hàng ngàn lần mỗi phút, hệ thống đọc trực tiếp từ cache trong 0.1ms.

### THỰC HÀNH NHỎ
Lập trình một hàm bọc kiểm tra dữ liệu trong bộ nhớ đệm cục bộ (Cache Map) trước khi truy vấn dữ liệu từ API thật.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS kiểm tra sự tồn tại của dữ liệu trong đối tượng cache trước khi gọi fetch.`,
    tasks: [
      "Viết hàm lấy dữ liệu sản phẩm tích hợp bộ nhớ đệm Caching cơ bản."
    ],
    starterCode: `const dataCache = new Map();
async function getCachedData(url) {
  if (dataCache.has(url)) {
    return dataCache.get(url);
  }
  const response = await fetch(url);
  const data = await response.json();
  dataCache.set(url, data);
  return data;
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("datacache.has(") && c.includes("datacache.get(") && c.includes("datacache.set(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Bộ nhớ đệm Cache thích hợp nhất để lưu loại dữ liệu nào?", o: ["Dữ liệu thay đổi liên tục", "Dữ liệu ít thay đổi nhưng được đọc thường xuyên", "Dữ liệu mật khẩu người dùng", "Dữ liệu rác"], a: 1 }
    ]
  },
  {
    id: "lesson43",
    title: "43. Quy tắc SEO nâng cao: Sitemaps, Robots.txt & Structured Data",
    lang: "html",
    file: "src/lesson43.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
SEO nâng cao yêu cầu khai báo tệp \`sitemap.xml\` chứa danh sách toàn bộ liên kết để robot lập chỉ mục đầy đủ, tệp \`robots.txt\` điều hướng robot, và Dữ liệu cấu trúc (Structured Data - JSON-LD Schema) cung cấp thông tin sản phẩm trực quan trên kết quả tìm kiếm Google.

### ÁP DỤNG HỆ THỐNG
Trang thông tin doanh nghiệp được nhúng mã JSON-LD Schema khai báo tên tổ chức, logo, và các liên kết mạng xã hội chính thức để Google hiển thị khung thông tin Knowledge Graph bên cạnh kết quả tìm kiếm.

### THỰC HÀNH NHỎ
Viết một đoạn thẻ script nhúng mã dữ liệu cấu trúc Schema JSON-LD mô tả một sản phẩm.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn HTML chứa thẻ \`<script type=\"application/ld+json\"\` và định nghĩa định dạng JSON.`,
    tasks: [
      "Bổ sung dữ liệu cấu trúc Schema JSON-LD tối ưu hiển thị SEO của trang web."
    ],
    starterCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Khóa học HugoCoder",
  "description": "Học lập trình chuyên nghiệp từ cơ bản đến nâng cao"
}
</script>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('type="application/ld+json"') && c.includes('"@type":"product"');
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Mục đích chính của Schema JSON-LD là gì?", o: ["Làm đẹp giao diện", "Dịch ngôn ngữ", "Cung cấp siêu dữ liệu có cấu trúc giúp Google hiển thị kết quả tìm kiếm chi tiết phong phú (rich snippets)", "Nén trang"], a: 2 }
    ]
  },
  {
    id: "lesson44",
    title: "44. Quy tắc SEO nâng cao: SSR vs SSG vs SPA",
    lang: "html",
    file: "src/lesson44.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Các kiến trúc kết xuất web: SPA (Single Page Application - kết xuất hoàn toàn ở Client qua JS, tải trang đầu chậm, SEO kém), SSR (Server-Side Rendering - kết xuất HTML ở server mỗi request, SEO tốt), SSG (Static Site Generation - biên dịch trước toàn bộ HTML tĩnh khi build, tải cực nhanh, SEO xuất sắc).

### ÁP DỤNG HỆ THỐNG
Phần Bio công khai của các thành viên Portal sử dụng phương án Static Generation (SSG) kết hợp Hydration để đảm bảo các công cụ tìm kiếm cào được nội dung ngay lập tức mà trang vẫn tải nhanh mượt mà.

### THỰC HÀNH NHỎ
Hiểu và phân loại đúng các mô hình kết xuất web thông qua câu hỏi thực hành.

### KIỂM TRA HOÀN TẤT
Vượt qua bài trắc nghiệm học thuật phân tích sâu sự khác biệt và tối ưu hóa SEO của SSR/SSG/SPA.`,
    tasks: [
      "Hoàn thành trắc nghiệm phân tích và lựa chọn mô hình render tối ưu SEO."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 3
  },
  {
    id: "lesson45",
    title: "45. Progressive Web Apps (PWA): Service Workers & Vòng đời",
    lang: "javascript",
    file: "src/lesson45.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
PWA biến website thành ứng dụng có khả năng cài đặt lên màn hình điện thoại và hoạt động ngoại tuyến. Trái tim của PWA là Service Worker - một proxy script chạy ngầm độc lập với tab trang web, quản lý vòng đời gồm các sự kiện: \`install\`, \`activate\`, \`fetch\`.

### ÁP DỤNG HỆ THỐNG
Member Portal được cấu hình PWA đầy đủ. Khi bạn mất mạng, Service Worker sẽ bắt sự kiện \`fetch\` và trả về giao diện học tập lưu trong cache ngoại tuyến thay vì hiển thị màn hình báo lỗi mất mạng của trình duyệt.

### THỰC HÀNH NHỎ
Đăng ký lắng nghe sự kiện \`install\` và \`activate\` bên trong file Service Worker.

### KIỂM TRA HOÀN TẤT
Mã nguồn JS của Service Worker phải có gọi phương thức lắng nghe sự kiện \`addEventListener("install"\` và \`addEventListener("activate"\`.`,
    tasks: [
      "Lập trình lắng nghe sự kiện cài đặt và kích hoạt vòng đời Service Worker."
    ],
    starterCode: `self.addEventListener("install", function(event) {
  console.log("Service Worker đang cài đặt...");
  self.skipWaiting();
});
self.addEventListener("activate", function(event) {
  console.log("Service Worker đã kích hoạt.");
});`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('addeventlistener("install"') && c.includes('addeventlistener("activate"');
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Service Worker chạy ở luồng nào?", o: ["Chạy cùng luồng UI chính", "Chạy ngầm ở luồng nền độc lập (background thread)", "Chạy ở máy chủ backend", "Chạy ở database"], a: 1 }
    ]
  },
  {
    id: "lesson46",
    title: "46. Progressive Web Apps (PWA): Chiến lược Cache ngoại tuyến",
    lang: "javascript",
    file: "src/lesson46.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Để hoạt động ngoại tuyến, Service Worker sử dụng Cache Storage API. Các chiến lược phổ biến: Cache-First (đọc từ cache trước, không có mới gọi mạng - tối ưu cho file tĩnh), Network-First (gọi mạng trước, lỗi mới lấy từ cache - tối ưu cho dữ liệu động).

### ÁP DỤNG HỆ THỐNG
Portal áp dụng chiến lược Cache-First cho toàn bộ font chữ, ảnh đại diện và icon, giúp tiết kiệm dung lượng mạng cho học viên và giúp giao diện tải lên gần như tức thời.

### THỰC HÀNH NHỎ
Viết mã nguồn Service Worker bắt sự kiện \`fetch\` để trả về tài nguyên trong cache nếu có, ngược lại mới tải từ mạng.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn JS có gọi hàm kiểm tra cache \`caches.match(event.request)\` và phản hồi thông tin.`,
    tasks: [
      "Lập trình chiến lược chặn bắt sự kiện mạng và trả dữ liệu từ bộ nhớ đệm Cache Storage."
    ],
    starterCode: `self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("caches.match(") && c.includes("fetch(event.request)");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Chiến lược Caching nào phù hợp nhất cho dữ liệu thay đổi thường xuyên như số dư ví?", o: ["Cache-First", "Network-First", "Chỉ đọc từ Cache", "Không cache"], a: 1 }
    ]
  },
  {
    id: "lesson47",
    title: "47. Progressive Web Apps (PWA): Web App Manifest",
    lang: "json",
    file: "src/manifest.json",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Web App Manifest là một file cấu hình JSON cung cấp các thông tin cần thiết để trình duyệt hiển thị nút cài đặt ứng dụng: tên ứng dụng, biểu tượng (icons), màu chủ đề (theme_color), và chế độ hiển thị (display: standalone - ẩn thanh địa chỉ trình duyệt).

### ÁP DỤNG HỆ THỐNG
File \`manifest.webmanifest\` của portal định nghĩa cấu hình \`standalone\`, cho phép ứng dụng mở lên toàn màn hình như một ứng dụng iOS/Android bản địa thực thụ.

### THỰC HÀNH NHỎ
Cấu hình thuộc tính chế độ hiển thị và đường dẫn khởi chạy trong file cấu hình JSON Manifest.

### KIỂM TRA HOÀN TẤT
Đảm bảo nội dung JSON cấu hình chính xác thuộc tính \`"display": "standalone"\` và thuộc tính \`"start_url"\`.`,
    tasks: [
      "Cấu hình file manifest.json đạt chuẩn cài đặt PWA của trình duyệt."
    ],
    starterCode: `{
  "short_name": "HugoCoder",
  "name": "HugoCoder Learning IDE Portal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('"display":"standalone"') && c.includes('"start_url"');
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Thuộc tính display nào trong Manifest ẩn thanh địa chỉ trình duyệt khi mở ứng dụng?", o: ["browser", "minimal-ui", "standalone", "fullscreen"], a: 2 }
    ]
  },
  {
    id: "lesson48",
    title: "48. Thực hành cao cấp: Xác thực JWT & Phòng chống CSRF",
    lang: "php",
    file: "src/lesson48.php",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
CSRF (Cross-Site Request Forgery) là lỗ hổng kẻ xấu lừa trình duyệt của nạn nhân tự gửi request kèm theo cookie xác thực tự động đến server. Để phòng chống, ta sử dụng JWT lưu ở \`localStorage\` thay vì Cookie, hoặc đính kèm CSRF token bảo vệ.

### ÁP DỤNG HỆ THỐNG
Các API sửa đổi thông tin tài khoản của portal đều yêu cầu xác thực qua Header Authorization. Do mã JS của bên thứ ba không thể đọc được Header của domain khác, cuộc tấn công CSRF hoàn toàn bị vô hiệu hóa.

### THỰC HÀNH NHỎ
Đọc mã JWT gửi lên từ Header Authorization của request và kiểm tra tính hợp lệ bằng PHP.

### KIỂM TRA HOÀN TẤT
Đảm bảo mã nguồn PHP có lấy thông tin từ biến siêu toàn cục \`$_SERVER['HTTP_AUTHORIZATION']\` (hoặc kiểm tra headers) và thực hiện giải mã.`,
    tasks: [
      "Lập trình module xác thực API nhận chuỗi JWT truyền qua HTTP Authorization Header."
    ],
    starterCode: `<?php
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $jwt = $matches[1];
  echo json_encode(["status" => "token_extracted", "token" => $jwt]);
} else {
  http_response_code(401);
  echo json_encode(["error" => "Chưa xác thực"]);
}
?>`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("HTTP_AUTHORIZATION") && c.includes("Bearer");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Tại sao lưu JWT ở Authorization Header giúp chống tấn công CSRF?", o: ["Vì cookie không tự động đính kèm Header chéo nguồn", "Vì Header an toàn hơn", "Vì token dài hơn", "Không liên quan"], a: 0 }
    ]
  },
  {
    id: "lesson49",
    title: "49. Thực hành cao cấp: Xây dựng Module Chat thời gian thực",
    lang: "javascript",
    file: "src/lesson49.js",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Một module chat hoạt động dựa trên sự kết hợp của: Giao diện (HTML/CSS), xử lý sự kiện nút bấm gửi tin, kết nối Websocket gửi tin lên máy chủ và lắng nghe tin nhắn đổ về để vẽ thêm khung hội thoại.

### ÁP DỤNG HỆ THỐNG
Học viên có thể học lập trình, kết nối WebSocket và trao đổi bài học trực tiếp với nhau ngay trên hệ sinh thái Bạn Học Đường.

### THỰC HÀNH NHỎ
Lập trình hoàn chỉnh hàm gửi tin nhắn qua WebSocket và vẽ dòng tin nhắn đó vào giao diện chat.

### KIỂM TRA HOÀN TẤT
Mã nguồn JS phải gọi phương thức \`send()\` của đối tượng WebSocket để truyền dữ liệu dạng chuỗi JSON lên server.`,
    tasks: [
      "Lập trình logic gửi và cập nhật tin nhắn qua WebSocket trong giao diện chat."
    ],
    starterCode: `const ws = new WebSocket("ws://localhost:3000/chat");
function sendMessage(text) {
  const payload = JSON.stringify({ body: text, sentAt: Date.now() });
  ws.send(payload);
}
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const bubble = document.createElement("div");
  bubble.textContent = data.body;
  document.getElementById("chat-box").appendChild(bubble);
};`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("ws.send(") && c.includes("appendchild(");
    },
    practiceType: "code_challenge",
    miniQuiz: [
      { q: "Hàm nào của WebSocket dùng để gửi gói tin lên server?", o: ["post()", "send()", "write()", "emit()"], a: 1 }
    ]
  },
  {
    id: "lesson50",
    title: "50. Kiểm tra Kiến trúc Web & Mật mã học",
    lang: "html",
    file: "src/lesson50.html",
    theory: `### LÝ THUYẾT & ĐỊNH NGHĨA
Chúc mừng bạn đã đi tới cuối chặng đường! Bài thi tốt nghiệp tổng hợp kiến thức nâng cao Phase 3 (Bài 26-49): Cấu trúc dữ liệu & Thuật toán, Mật mã học, Bảo mật nâng cao, Tối ưu hóa hiệu năng chuyên nghiệp và thiết lập ứng dụng PWA.

### ÁP DỤNG HỆ THỐNG
Sau khi vượt qua bài thi này, bạn sẽ nhận được Chứng nhận Coder Tốt Nghiệp Vĩnh Viễn của Hugo Studio, chứng minh năng lực thiết kế và tối ưu hệ thống.

### THỰC HÀNH NHỎ
Hoàn thành đề kiểm tra tốt nghiệp gồm 5 câu trắc nghiệm ngẫu nhiên.

### KIỂM TRA HOÀN TẤT
Đạt tối thiểu 3 trên 5 câu đúng (>= 60%) để vượt qua kỳ thi tốt nghiệp và mở khóa quyền mua gói vĩnh viễn xem lại tài liệu.`,
    tasks: [
      "Hoàn thành bài thi tốt nghiệp lập trình viên chuyên nghiệp đạt tối thiểu 60%."
    ],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 5
  }
];
