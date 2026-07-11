// ============================================================
// CHẶNG 3 — CẤU TRÚC DỮ LIỆU, GIẢI THUẬT & MẬT MÃ HỌC (Bài 26-50)
// Trọng tâm: phần "lõi" khoa học máy tính để tối ưu hiệu năng
// và bảo mật hệ thống ở mức độ thấp.
// ============================================================
export const ADVANCED_LESSONS = [
  {
    id: "lesson26",
    title: "26. Cấu trúc dữ liệu: Mảng (Array) & Danh sách liên kết",
    lang: "javascript",
    file: "src/lesson26.js",
    duration: "50 phút",
    overview: {
      description: "Hai cách tổ chức dữ liệu nền tảng nhất và cú đánh đổi kinh điển: mảng truy cập nhanh nhưng chèn chậm, danh sách liên kết chèn nhanh nhưng truy cập chậm.",
      outcomes: [
        "Nêu độ phức tạp truy cập/chèn/xoá của Array và Linked List",
        "Tự cài đặt Node và thao tác nối danh sách liên kết",
        "Chọn đúng cấu trúc theo bài toán (đọc nhiều hay chèn nhiều)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **Array** — phần tử nằm liền kề trong bộ nhớ: truy cập theo chỉ số **O(1)**, nhưng chèn/xoá giữa mảng phải dời cả dãy **O(n)**.
> **Linked List** — mỗi nút (Node) giữ giá trị + con trỏ next: chèn/xoá tại vị trí đã biết **O(1)**, nhưng truy cập phần tử thứ k phải lần theo chuỗi **O(n)**.

\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
\`\`\`

Ứng dụng thật: lịch sử undo/redo, hàng tin nhắn chat dùng danh sách liên kết (kép) để chèn nhanh; bảng điểm, danh sách render dùng mảng để truy cập nhanh.`,
    labSteps: [
      "Mở src/lesson26.js — cài Linked List tối giản.",
      "Viết class Node có this.value và this.next = null.",
      "Tạo 3 nút a, b, c rồi nối: a.next = b; b.next = c; — vẽ mũi tên ra giấy theo đúng code.",
      "Viết hàm printList(head) dùng while (node) { console.log(node.value); node = node.next; }.",
      "Chèn nút mới giữa a và b chỉ bằng 2 phép gán con trỏ — cảm nhận O(1) so với splice của mảng."
    ],
    commonMistakes: [
      { symptom: "Vòng lặp in danh sách chạy vô tận.", cause: "Quên gán node = node.next trong thân while.", fix: "Bước tiến con trỏ là bắt buộc ở cuối mỗi vòng lặp." },
      { symptom: "Chèn nút mới xong mất luôn phần đuôi danh sách.", cause: "Gán a.next = newNode trước khi kịp giữ b.", fix: "Nối newNode.next = a.next TRƯỚC, rồi mới a.next = newNode." },
      { symptom: "Dùng list.indexOf tìm phần tử trong Linked List tự cài.", cause: "Nhầm API mảng với cấu trúc tự viết.", fix: "Linked List phải tự duyệt bằng while theo next." }
    ],
    challenge: "Viết hàm insertAfter(node, value) chèn nút mới sau một nút cho trước và hàm countNodes(head) đếm số nút — cả hai không dùng mảng trung gian.",
    checklist: [
      "Nêu đúng O(1)/O(n) cho truy cập và chèn của cả hai cấu trúc",
      "Tự vẽ được sơ đồ con trỏ trước khi code thao tác chèn",
      "Nói được 1 tình huống thực tế cho mỗi cấu trúc"
    ],
    tasks: ["Cài class Node (value, next), nối 3 nút và viết printList duyệt bằng while."],
    starterCode: `// BÀI 26: Linked List tối giản
// TODO 1: class Node { value, next = null }
// TODO 2: tạo a, b, c và nối a -> b -> c
// TODO 3: printList(head) duyệt while in từng value
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("classnode") && c.includes("this.value") && c.includes("this.next") && c.includes(".next=") && c.includes("while");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Truy cập phần tử theo CHỈ SỐ trong mảng có độ phức tạp bao nhiêu?",
      snippet: "const item = arr[5]; // [ ... ]",
      options: [
        { text: "O(1)", correct: true },
        { text: "O(n)", correct: false },
        { text: "O(log n)", correct: false },
        { text: "O(n²)", correct: false }
      ],
      correctIdx: 0
    },
    miniQuiz: [
      { q: "Ưu điểm chính của Linked List so với Array?", o: ["Truy cập nhanh hơn", "Chèn/xoá tại vị trí đã biết O(1) không phải dời dãy", "Ít tốn RAM hơn", "Sắp xếp sẵn"], a: 1 },
      { q: "Truy cập phần tử thứ k của Linked List mất bao lâu?", o: ["O(1)", "O(n) — phải lần theo từng next", "O(log n)", "O(n²)"], a: 1 },
      { q: "Mỗi Node của danh sách liên kết đơn chứa gì?", o: ["Chỉ giá trị", "Giá trị và con trỏ next", "Chỉ số index", "Giá trị và độ dài"], a: 1 },
      { q: "Ứng dụng nào hợp với Linked List?", o: ["Bảng điểm truy cập ngẫu nhiên", "Lịch sử undo/redo chèn xoá liên tục", "Ma trận ảnh", "Bảng tra cứu theo chỉ số"], a: 1 }
    ]
  },
  {
    id: "lesson27",
    title: "27. Ngăn xếp (Stack), Hàng đợi (Queue) & Bảng băm (Hash Table)",
    lang: "javascript",
    file: "src/lesson27.js",
    duration: "50 phút",
    overview: {
      description: "Bộ ba cấu trúc đứng sau nút Back của trình duyệt, hàng chờ gửi email và tốc độ tra cứu 'thần thánh' của Object/Map.",
      outcomes: [
        "Phân biệt LIFO (Stack) và FIFO (Queue) kèm ví dụ thật",
        "Cài Stack với push/pop và Queue với enqueue/dequeue",
        "Hiểu Hash Table tra cứu O(1) và nó là nền của Object/Map trong JS"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **Stack — LIFO** (Last In First Out): vào sau ra trước. Ứng dụng: nút Back trình duyệt, Call Stack của JS, undo.
> **Queue — FIFO** (First In First Out): vào trước ra trước. Ứng dụng: hàng chờ gửi email, hàng đợi in, message queue backend.
> **Hash Table**: hàm băm biến key thành chỉ số ô nhớ → tra cứu theo key **O(1)** trung bình. Object và Map của JS chính là hash table.

\`\`\`javascript
class Stack {
  items = [];
  push(x) { this.items.push(x); }
  pop() { return this.items.pop(); }
}
\`\`\`
Queue tương tự nhưng lấy ra từ đầu: \`shift()\` (hoặc con trỏ đầu/cuối để tối ưu).`,
    labSteps: [
      "Mở src/lesson27.js — cài cả ba cấu trúc dạng tối giản.",
      "class Stack: push(x) và pop() dựa trên mảng — thử push 1,2,3 rồi pop ra xem thứ tự 3,2,1.",
      "class Queue: enqueue(x) push vào cuối, dequeue() shift từ đầu — thử cùng dữ liệu, thứ tự ra 1,2,3.",
      "Hash: dùng new Map(); set('email', 'a@b.com') rồi get('email') — tra cứu thẳng không cần duyệt.",
      "Viết chú thích: 3 ứng dụng thực tế tương ứng 3 cấu trúc."
    ],
    commonMistakes: [
      { symptom: "Queue lấy phần tử bằng pop() — ra ngược thứ tự.", cause: "pop lấy từ CUỐI (LIFO), Queue phải lấy từ ĐẦU.", fix: "dequeue dùng shift() (hoặc quản lý con trỏ head)." },
      { symptom: "Duyệt cả mảng users để tìm theo email mỗi lần.", cause: "Không tận dụng hash — tìm O(n) lặp lại.", fix: "Xây Map email → user một lần, các lần sau get O(1)." },
      { symptom: "Stack.pop trên stack rỗng trả undefined gây lỗi dây chuyền.", cause: "Không kiểm tra rỗng.", fix: "Thêm isEmpty() và kiểm tra trước khi pop." }
    ],
    challenge: "Dùng Stack viết hàm isBalanced(str) kiểm tra chuỗi ngoặc '({[]})' đóng mở khớp nhau — bài phỏng vấn kinh điển.",
    checklist: [
      "Nói ngay LIFO của cái nào, FIFO của cái nào kèm ví dụ",
      "Cài Stack và Queue chạy đúng thứ tự ra",
      "Giải thích vì sao Map tra cứu O(1)"
    ],
    tasks: ["Cài class Stack (push/pop), class Queue (enqueue/dequeue) và dùng Map set/get."],
    starterCode: `// BÀI 27: Stack, Queue, Hash Table
// TODO 1: class Stack { push, pop }
// TODO 2: class Queue { enqueue, dequeue (shift) }
// TODO 3: const cache = new Map(); set rồi get theo key
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("classstack") && c.includes("push(") && c.includes("pop(") && c.includes("classqueue") && c.includes("shift(") && c.includes("newmap(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Hàng đợi (Queue) hoạt động theo cơ chế nào?",
      snippet: "enqueue(1); enqueue(2); dequeue(); // trả về 1",
      options: [
        { text: "LIFO — vào sau ra trước", correct: false },
        { text: "FIFO — vào trước ra trước", correct: true },
        { text: "Ngẫu nhiên", correct: false },
        { text: "Theo độ ưu tiên", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Nút Back của trình duyệt dùng cấu trúc nào?", o: ["Queue", "Stack", "Hash Table", "Tree"], a: 1 },
      { q: "Hàng chờ gửi email backend dùng cơ chế nào?", o: ["LIFO", "FIFO", "Random", "Ưu tiên chữ cái"], a: 1 },
      { q: "Tra cứu theo key trong Hash Table trung bình mất?", o: ["O(n)", "O(1)", "O(n log n)", "O(n²)"], a: 1 },
      { q: "Object và Map trong JS bản chất là gì?", o: ["Mảng 2 chiều", "Hash Table", "Linked List", "Stack"], a: 1 }
    ]
  },
  {
    id: "lesson28",
    title: "28. Thuật toán tìm kiếm: Nhị phân & Tuyến tính",
    lang: "javascript",
    file: "src/lesson28.js",
    duration: "50 phút",
    overview: {
      description: "Từ duyệt trâu O(n) đến chia đôi O(log n): thuật toán giúp database tìm 1 bản ghi trong hàng triệu dòng chỉ sau ~20 lần so sánh.",
      outcomes: [
        "Cài linear search và binary search chuẩn không nhìn mẫu",
        "Nêu điều kiện tiên quyết của binary search: mảng ĐÃ SẮP XẾP",
        "Ước lượng số bước: 1 triệu phần tử ≈ 20 lần chia đôi"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **Linear Search** — duyệt từng phần tử: **O(n)**, chạy được trên mọi mảng.
> **Binary Search** — so giữa, loại nửa sai, lặp lại: **O(log n)**, BẮT BUỘC mảng đã sắp xếp.

\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`
log₂(1.000.000) ≈ 20 — đây chính là lý do INDEX của database (B-Tree) tra cứu tức thời: mỗi lần so sánh loại được một nửa dữ liệu.`,
    labSteps: [
      "Mở src/lesson28.js — cài cả hai thuật toán để so sánh.",
      "linearSearch(arr, target): vòng for so từng phần tử, đếm số lần so sánh bằng biến counter.",
      "binarySearch(arr, target): khuôn left/right/mid như phần lý thuyết — cũng đếm số lần so sánh.",
      "Tạo mảng 1000 số đã sắp xếp, tìm phần tử cuối: in số lần so sánh của mỗi thuật toán (≈1000 vs ≈10).",
      "Thử binary search trên mảng CHƯA sắp xếp — chứng kiến nó trả sai để khắc cốt điều kiện tiên quyết."
    ],
    commonMistakes: [
      { symptom: "Binary search thỉnh thoảng trả -1 dù phần tử có trong mảng.", cause: "Mảng chưa sắp xếp — vi phạm điều kiện tiên quyết.", fix: "sort mảng trước, hoặc dùng linear search nếu dữ liệu không thể sắp." },
      { symptom: "Vòng while không bao giờ dừng.", cause: "Quên +1/-1 khi thu hẹp: left = mid thay vì mid + 1.", fix: "Luôn left = mid + 1 và right = mid - 1 để khoảng thu hẹp thật sự." },
      { symptom: "Sai kết quả với mảng 2 phần tử.", cause: "Điều kiện while dùng < thay vì <=.", fix: "while (left <= right) — dấu bằng cho phép xét khoảng còn 1 phần tử." }
    ],
    challenge: "Viết binarySearchCount(arr, target) trả về số lần so sánh đã dùng, chạy trên mảng 1.000.000 phần tử và xác nhận ≤ 20 lần.",
    checklist: [
      "Cài binary search một lần chạy đúng, không sửa mò",
      "Nêu được điều kiện tiên quyết và hậu quả khi vi phạm",
      "Giải thích liên hệ binary search ↔ database index"
    ],
    tasks: ["Cài binarySearch có left/right/mid + Math.floor và linearSearch để so sánh số bước."],
    starterCode: `// BÀI 28: Linear vs Binary Search
// TODO 1: linearSearch(arr, target) — vòng for O(n)
// TODO 2: binarySearch(arr, target) — left/right/mid, while (left <= right)
// TODO 3: so sánh số lần so sánh của cả hai trên mảng 1000 phần tử
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("binarysearch") && c.includes("linearsearch") && c.includes("math.floor") && c.includes("left<=right");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Điều kiện BẮT BUỘC để áp dụng tìm kiếm nhị phân là gì?",
      snippet: "binarySearch([ ??? ], target)",
      options: [
        { text: "Mảng phải được sắp xếp", correct: true },
        { text: "Mảng phải toàn số chẵn", correct: false },
        { text: "Mảng dưới 100 phần tử", correct: false },
        { text: "Không cần điều kiện", correct: false }
      ],
      correctIdx: 0
    },
    miniQuiz: [
      { q: "Độ phức tạp của binary search?", o: ["O(n)", "O(log n)", "O(1)", "O(n²)"], a: 1 },
      { q: "Tìm trong 1.000.000 phần tử đã sắp xếp, binary search cần khoảng bao nhiêu lần so sánh?", o: ["1.000.000", "~20", "~500.000", "~1000"], a: 1 },
      { q: "Khi nào buộc phải dùng linear search?", o: ["Mảng quá lớn", "Dữ liệu chưa/không thể sắp xếp", "Tìm số âm", "Mảng chuỗi"], a: 1 },
      { q: "Database index (B-Tree) tra nhanh nhờ nguyên lý nào?", o: ["Đọc song song", "Mỗi lần so sánh loại một nửa dữ liệu (chia để trị)", "Cache RAM", "Nén dữ liệu"], a: 1 }
    ]
  },
  {
    id: "lesson29",
    title: "29. Thuật toán sắp xếp: Quick Sort & Merge Sort",
    lang: "javascript",
    file: "src/lesson29.js",
    duration: "55 phút",
    overview: {
      description: "Chia để trị: hai thuật toán O(n log n) đứng sau Array.prototype.sort — và lý do Bubble Sort O(n²) không bao giờ xuất hiện trong production.",
      outcomes: [
        "Cài Quick Sort đệ quy với pivot",
        "Trình bày ý tưởng Merge Sort: chia đôi – sắp – trộn",
        "So sánh O(n²) và O(n log n) bằng con số cụ thể"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Với n = 100.000: thuật toán **O(n²)** cần ~10 tỷ phép so sánh (treo máy), **O(n log n)** chỉ ~1,7 triệu — khác biệt giữa 'không dùng nổi' và 'tức thời'.

> **Quick Sort**: chọn 1 phần tử làm **pivot**, chia mảng thành nhóm < pivot và ≥ pivot, đệ quy từng nhóm rồi ghép.
> **Merge Sort**: chia đôi đến khi còn 1 phần tử, rồi **trộn (merge)** hai nửa đã sắp — ổn định, luôn O(n log n).

\`\`\`javascript
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [], right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    (arr[i] < pivot ? left : right).push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}
\`\`\`
JS engine dùng biến thể tối ưu (Timsort — họ hàng Merge Sort) cho \`Array.prototype.sort\`.`,
    labSteps: [
      "Mở src/lesson29.js — cài Quick Sort theo khuôn lý thuyết.",
      "Viết điều kiện dừng đệ quy: mảng ≤ 1 phần tử trả về chính nó — QUAN TRỌNG NHẤT.",
      "Chọn pivot là phần tử cuối, chia left/right bằng vòng for.",
      "Ghép kết quả: [...quickSort(left), pivot, ...quickSort(right)].",
      "Test: quickSort([5,1,4,2,8]) phải ra [1,2,4,5,8]; thử thêm mảng rỗng và mảng 1 phần tử.",
      "Chú thích cuối file: mô tả 3 bước Merge Sort bằng lời của bạn."
    ],
    commonMistakes: [
      { symptom: "Maximum call stack size exceeded.", cause: "Thiếu/sai điều kiện dừng đệ quy, hoặc pivot bị đưa lại vào nhóm con.", fix: "if (arr.length <= 1) return arr; và vòng chia phải loại pivot (chạy tới length - 1)." },
      { symptom: "Kết quả bị lặp phần tử pivot.", cause: "Pivot vừa nằm trong right vừa được chèn giữa.", fix: "Không đưa pivot vào left/right — nó chỉ xuất hiện một lần ở giữa khi ghép." },
      { symptom: "sort() mặc định xếp [10, 2, 1] thành [1, 10, 2].", cause: "Array.sort mặc định so sánh CHUỖI.", fix: "Truyền comparator: arr.sort((a, b) => a - b)." }
    ],
    challenge: "Cài mergeSort(arr) hoàn chỉnh với hàm merge(left, right) trộn hai mảng đã sắp — đối chiếu kết quả với quickSort trên cùng dữ liệu ngẫu nhiên.",
    checklist: [
      "Quick Sort chạy đúng cả mảng rỗng, 1 phần tử, có phần tử trùng",
      "Kể được 3 bước của Merge Sort",
      "Nêu con số so sánh O(n²) vs O(n log n) với n = 100.000"
    ],
    tasks: ["Cài quickSort đệ quy: điều kiện dừng, pivot, chia left/right, ghép bằng spread."],
    starterCode: `// BÀI 29: Quick Sort đệ quy
// TODO 1: điều kiện dừng arr.length <= 1
// TODO 2: pivot = phần tử cuối, chia left / right (loại pivot)
// TODO 3: return [...quickSort(left), pivot, ...quickSort(right)]
// TODO 4: test [5,1,4,2,8] -> [1,2,4,5,8]
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("quicksort") && c.includes("pivot") && c.includes("arr.length<=1") && c.includes("...quicksort(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Độ phức tạp trung bình của Quick Sort / Merge Sort là bao nhiêu?",
      snippet: "quickSort(mảng_100000_phần_tử) // ~1,7 triệu phép so sánh",
      options: [
        { text: "O(n²)", correct: false },
        { text: "O(n log n)", correct: true },
        { text: "O(n)", correct: false },
        { text: "O(log n)", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Phần tử 'chốt' để chia mảng trong Quick Sort gọi là gì?", o: ["anchor", "pivot", "root", "median"], a: 1 },
      { q: "Điều kiện dừng đệ quy của Quick Sort?", o: ["Mảng có 10 phần tử", "Mảng còn ≤ 1 phần tử", "Pivot = 0", "Hết RAM"], a: 1 },
      { q: "Merge Sort gồm 3 bước nào?", o: ["Chọn – đổi – lặp", "Chia đôi – sắp từng nửa – trộn lại", "Băm – tra – ghép", "Đảo – lọc – gộp"], a: 1 },
      { q: "Vì sao Bubble Sort không dùng trong production?", o: ["Khó viết", "O(n²) quá chậm với dữ liệu lớn", "Tốn RAM", "Không ổn định"], a: 1 }
    ]
  },
  {
    id: "lesson30",
    title: "30. Phân tích độ phức tạp: Big O Notation",
    lang: "javascript",
    file: "src/lesson30.js",
    duration: "45 phút",
    overview: {
      description: "Ngôn ngữ chung để phán đoán code nhanh hay chậm TRƯỚC khi chạy: đọc Big O của một đoạn code và tự tay tối ưu O(n²) về O(n).",
      outcomes: [
        "Xếp đúng thang O(1) < O(log n) < O(n) < O(n log n) < O(n²)",
        "Nhìn vòng lặp đoán được Big O của đoạn code",
        "Tối ưu bài tìm phần tử trùng từ O(n²) về O(n) bằng Set"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Big O** đo TỐC ĐỘ TĂNG của thời gian chạy khi dữ liệu n tăng — bỏ qua hằng số:

> **O(1)** truy cập mảng, Map.get • **O(log n)** binary search • **O(n)** một vòng lặp • **O(n log n)** sort tốt • **O(n²)** hai vòng lặp LỒNG NHAU.

Mẹo đọc nhanh: một vòng for qua n phần tử = O(n); vòng for lồng trong vòng for = O(n²); chia đôi mỗi bước = O(log n).

Bài tối ưu kinh điển — tìm phần tử trùng:
\`\`\`javascript
// O(n²): so từng cặp
// O(n): nhớ những gì đã gặp bằng Set
function hasDuplicate(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
\`\`\`
Đánh đổi: tốn thêm bộ nhớ O(n) cho Set để mua tốc độ — time-space tradeoff.`,
    labSteps: [
      "Mở src/lesson30.js — có sẵn hasDuplicateSlow dùng 2 vòng for lồng nhau (O(n²)).",
      "Đọc và chú thích Big O ngay trên mỗi hàm có sẵn trong file.",
      "Viết hasDuplicate(arr) phiên bản Set theo khuôn lý thuyết — một vòng lặp duy nhất.",
      "Đo bằng console.time/console.timeEnd trên mảng 20.000 phần tử: chạy cả hai bản, ghi lại chênh lệch.",
      "Chú thích cuối file: bạn đã đánh đổi gì để nhanh hơn? (bộ nhớ cho Set)"
    ],
    commonMistakes: [
      { symptom: "Cho rằng code 1 dòng arr.includes(x) trong vòng for là O(n).", cause: "includes bản thân là O(n) — giấu một vòng lặp bên trong.", fix: "Tổng là O(n²); thay includes bằng Set.has O(1)." },
      { symptom: "Tối ưu vi mô (gộp 2 dòng thành 1) mà nghĩ là giảm Big O.", cause: "Nhầm hằng số với bậc tăng trưởng.", fix: "Big O chỉ đổi khi CẤU TRÚC lặp đổi — ít dòng hơn không có nghĩa bậc thấp hơn." },
      { symptom: "Set đếm phần tử trùng nhưng quên add sau khi has.", cause: "Chỉ kiểm tra mà không ghi nhớ.", fix: "Cặp has → add phải đi cùng nhau trong mỗi vòng." }
    ],
    challenge: "Viết twoSum(arr, target) trả về cặp chỉ số có tổng bằng target ở O(n) bằng Map (bài phỏng vấn số 1 của LeetCode).",
    checklist: [
      "Xếp đúng thang 5 bậc Big O từ nhanh đến chậm",
      "Đo được chênh lệch thật bằng console.time",
      "Giải thích time-space tradeoff bằng ví dụ Set"
    ],
    tasks: ["Viết hasDuplicate dùng Set (new Set, has, add) thay bản 2 vòng lặp và đo bằng console.time."],
    starterCode: `// BÀI 30: Big O — tối ưu O(n²) về O(n)
function hasDuplicateSlow(arr) {           // TODO: chú thích Big O của hàm này
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
// TODO 1: hasDuplicate(arr) dùng new Set() + seen.has + seen.add
// TODO 2: console.time so sánh hai bản trên mảng lớn
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("newset()") && c.includes(".has(") && c.includes(".add(") && c.includes("console.time");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Hai vòng lặp for LỒNG NHAU trên cùng mảng n phần tử cho độ phức tạp nào?",
      snippet: "for (i...n) { for (j...n) { ... } }",
      options: [
        { text: "O(n)", correct: false },
        { text: "O(n²)", correct: true },
        { text: "O(2n)", correct: false },
        { text: "O(log n)", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Tra cứu Set.has(x) có độ phức tạp trung bình?", o: ["O(1)", "O(n)", "O(log n)", "O(n²)"], a: 0 },
      { q: "Thang nào xếp ĐÚNG từ nhanh đến chậm?", o: ["O(n) < O(1) < O(n²)", "O(1) < O(log n) < O(n) < O(n²)", "O(n²) < O(n) < O(1)", "O(log n) < O(1) < O(n)"], a: 1 },
      { q: "arr.includes(x) bên trong vòng for n lần cho tổng độ phức tạp?", o: ["O(n)", "O(n²) — includes giấu một vòng lặp O(n)", "O(1)", "O(log n)"], a: 1 },
      { q: "Time-space tradeoff nghĩa là gì?", o: ["Code ngắn chạy nhanh", "Đổi thêm bộ nhớ lấy tốc độ (như dùng Set/Map)", "Xoá bộ nhớ định kỳ", "Chạy song song"], a: 1 }
    ]
  },
  {
    id: "lesson31",
    title: "31. Mật mã học: Mã hóa Đối xứng (AES) & Bất đối xứng (RSA)",
    lang: "javascript",
    file: "src/lesson31.js",
    duration: "50 phút",
    overview: {
      description: "Hai họ mã hóa gánh toàn bộ Internet: AES một khóa siêu nhanh và RSA cặp khóa công khai/bí mật — và cách HTTPS phối hợp cả hai.",
      outcomes: [
        "Phân biệt mã hóa đối xứng (1 khóa) và bất đối xứng (cặp khóa)",
        "Mô tả bắt tay TLS: RSA trao khóa, AES mã hóa dữ liệu",
        "Dùng Web Crypto API sinh khóa AES thật trong trình duyệt"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **Đối xứng (AES)** — MỘT khóa bí mật dùng chung để mã hóa và giải mã. Siêu nhanh, chuẩn cho dữ liệu lớn. Điểm yếu: làm sao trao khóa an toàn?
> **Bất đối xứng (RSA/ECC)** — CẶP khóa: Public Key ai cũng có (dùng mã hóa), Private Key giữ kín (dùng giải mã). Chậm hơn nhiều nhưng giải bài toán trao khóa.

**HTTPS/TLS phối hợp cả hai**: trình duyệt dùng public key của server (trong chứng chỉ SSL) để trao đổi an toàn một khóa phiên, rồi cả hai chuyển sang **AES** với khóa phiên đó cho toàn bộ dữ liệu — nhanh của AES + an toàn trao khóa của RSA.

Trình duyệt có **Web Crypto API** chuẩn W3C:
\`\`\`javascript
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
);
\`\`\``,
    labSteps: [
      "Mở src/lesson31.js — mô phỏng đủ vòng đời một phiên bảo mật.",
      "Viết hàm async generateAesKey() dùng crypto.subtle.generateKey với AES-GCM 256 (khuôn ở lý thuyết).",
      "Viết mô phỏng trao khóa: exchangeKey(publicKey, sessionKey) — chú thích rõ 'RSA mã hóa khóa phiên'.",
      "Viết decryptData(encryptedText, secretKey): sai khóa → throw new Error('Sai khóa bảo mật!').",
      "Vẽ (bằng chú thích ASCII) sơ đồ 3 bước bắt tay TLS: chứng chỉ → trao khóa phiên → AES."
    ],
    commonMistakes: [
      { symptom: "Nghĩ RSA dùng mã hóa toàn bộ dữ liệu truyền tải.", cause: "Chưa hiểu phân vai: RSA chậm gấp ~1000 lần AES.", fix: "RSA chỉ trao khóa phiên; dữ liệu đi bằng AES." },
      { symptom: "Đưa private key lên frontend/git.", cause: "Chưa phân biệt vai trò cặp khóa.", fix: "Private key CHỈ nằm trên server, không bao giờ rời khỏi đó." },
      { symptom: "crypto.subtle undefined khi chạy.", cause: "Web Crypto yêu cầu secure context (https hoặc localhost).", fix: "Chạy trên localhost hoặc trang https." }
    ],
    challenge: "Dùng crypto.subtle.encrypt/decrypt AES-GCM mã hóa rồi giải mã chuỗi 'HugoCoder' hoàn chỉnh (cần TextEncoder và iv ngẫu nhiên).",
    checklist: [
      "Phân biệt đối xứng/bất đối xứng trong 2 câu",
      "Kể đúng 3 bước phối hợp RSA + AES của HTTPS",
      "Nêu quy tắc: private key không bao giờ rời server"
    ],
    tasks: ["Viết generateAesKey dùng crypto.subtle.generateKey và decryptData kiểm tra khóa bí mật."],
    starterCode: `// BÀI 31: AES & RSA — mô phỏng phiên bảo mật
// TODO 1: async generateAesKey() — crypto.subtle.generateKey AES-GCM 256
// TODO 2: decryptData(encryptedText, secretKey) — sai khóa thì throw Error
// TODO 3: chú thích sơ đồ 3 bước TLS: chứng chỉ -> trao khóa -> AES
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("crypto.subtle.generatekey") && c.includes("aes-gcm") && c.includes("decryptdata") && c.includes("throw");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Mã hóa RSA (bất đối xứng) sử dụng bộ khóa nào?",
      snippet: "encrypt(data, [ ??? ]) ... decrypt(data, [ ??? ])",
      options: [
        { text: "Một khóa bí mật dùng chung", correct: false },
        { text: "Cặp khóa: Public Key và Private Key", correct: true },
        { text: "Không cần khóa", correct: false },
        { text: "Hai khóa bí mật giống nhau", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "AES thuộc họ mã hóa nào?", o: ["Bất đối xứng", "Đối xứng — một khóa dùng chung", "Hàm băm", "Encoding"], a: 1 },
      { q: "Trong HTTPS, RSA đảm nhiệm việc gì?", o: ["Mã hóa toàn bộ dữ liệu", "Trao đổi an toàn khóa phiên AES", "Nén dữ liệu", "Tạo cookie"], a: 1 },
      { q: "Public key dùng để làm gì?", o: ["Giải mã", "Mã hóa (ai cũng có thể dùng)", "Ký tên miền", "Lưu mật khẩu"], a: 1 },
      { q: "Vì sao dữ liệu lớn không mã hóa bằng RSA?", o: ["Không an toàn", "RSA chậm hơn AES rất nhiều", "RSA chỉ cho chữ", "Bị cấm"], a: 1 }
    ]
  },
  {
    id: "lesson32",
    title: "32. Mật mã học: Hàm băm một chiều & Kỹ thuật Salt",
    lang: "php",
    file: "src/lesson32.php",
    duration: "45 phút",
    overview: {
      description: "Băm khác mã hóa: một chiều, không thể dịch ngược — cộng thêm 'muối' ngẫu nhiên để đánh bại bảng cầu vồng Rainbow Table.",
      outcomes: [
        "Phân biệt Hash (một chiều) với Encrypt (hai chiều)",
        "Giải thích Salt chống Rainbow Table thế nào",
        "Dùng hash('sha256') kiểm tra tính toàn vẹn dữ liệu"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Hàm băm (Hash Function)** — SHA-256, bcrypt — biến đầu vào bất kỳ thành chuỗi độ dài cố định:

> Một chiều: KHÔNG THỂ dịch ngược từ mã băm ra dữ liệu gốc (khác Encrypt có thể decrypt).
> Tất định: cùng đầu vào → cùng mã băm. Đổi 1 ký tự → mã băm khác hoàn toàn (avalanche effect).

**Rainbow Table** — bảng tra cứu khổng lồ mật_khẩu_phổ_biến → mã_băm. Hacker có DB rò rỉ chỉ cần tra ngược.

**Salt** — chuỗi ngẫu nhiên riêng cho MỖI người dùng, nối vào mật khẩu trước khi băm:
\`\`\`php
$hash = hash("sha256", $password . $saltNgauNhien);
\`\`\`
Cùng mật khẩu "123456", hai người dùng có 2 mã băm khác nhau → bảng tra sẵn vô dụng.

Ứng dụng thứ hai của hash: **checksum** — so mã băm file tải về với mã công bố để biết file có bị sửa đổi.`,
    labSteps: [
      "Mở src/lesson32.php — thí nghiệm 3 tính chất của hash.",
      "Băm 'HugoCoder' bằng hash('sha256', ...) hai lần — xác nhận 2 kết quả giống hệt (tất định).",
      "Đổi 1 ký tự thành 'hugoCoder' băm lại — chứng kiến mã băm khác hoàn toàn (avalanche).",
      "Sinh salt bằng bin2hex(random_bytes(16)) rồi băm $password . $salt.",
      "Băm '123456' với 2 salt khác nhau — 2 kết quả khác nhau: đây chính là đòn hạ Rainbow Table."
    ],
    commonMistakes: [
      { symptom: "Hỏi 'làm sao giải mã SHA-256 về mật khẩu gốc?'.", cause: "Nhầm hash với encrypt.", fix: "Hash một chiều không giải được; đăng nhập là băm đầu vào mới rồi SO SÁNH hai mã băm." },
      { symptom: "Dùng chung một salt cứng cho mọi người dùng.", cause: "Salt cố định = Rainbow Table chỉ cần tính lại một lần.", fix: "Salt phải ngẫu nhiên RIÊNG cho mỗi user, sinh bằng random_bytes." },
      { symptom: "Dùng md5 cho mật khẩu vì 'ngắn gọn'.", cause: "md5/sha1 đã bị phá và băm quá nhanh (dễ brute-force).", fix: "Mật khẩu dùng bcrypt/Argon2 (bài 33); sha256 chỉ cho checksum dữ liệu." }
    ],
    challenge: "Viết hàm verifyChecksum($content, $expectedHash) trả true/false — mô phỏng kiểm tra file tải về có bị sửa đổi không.",
    checklist: [
      "Nói được 3 tính chất: một chiều, tất định, avalanche",
      "Giải thích Rainbow Table và cách Salt vô hiệu nó",
      "Biết md5/sha1 không được dùng cho mật khẩu"
    ],
    tasks: ["Băm sha256 hai lần chứng minh tất định, băm kèm salt sinh từ random_bytes."],
    starterCode: `<?php
// BÀI 32: Hash một chiều & Salt
// TODO 1: hash("sha256", "HugoCoder") hai lần — so sánh
// TODO 2: đổi 1 ký tự, băm lại — avalanche effect
// TODO 3: $salt = bin2hex(random_bytes(16)); hash sha256 của $password . $salt
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('hash("sha256"') || c.includes("hash('sha256'") ? (c.includes("random_bytes(") && c.includes("$salt")) : false;
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Mục đích chính của kỹ thuật Salting khi băm mật khẩu?",
      snippet: "$hash = hash('sha256', $password . [ $salt ]);",
      options: [
        { text: "Làm mật khẩu ngắn hơn", correct: false },
        { text: "Vô hiệu hóa bảng tra sẵn Rainbow Table", correct: true },
        { text: "Tăng tốc độ băm", correct: false },
        { text: "Cho phép giải mã ngược", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Đặc điểm quan trọng nhất của hàm băm?", o: ["Có thể giải mã", "Một chiều — không dịch ngược được", "Kết quả ngẫu nhiên", "Chỉ nhận số"], a: 1 },
      { q: "Đổi 1 ký tự đầu vào, mã băm thay đổi thế nào?", o: ["Đổi 1 ký tự", "Khác hoàn toàn (avalanche effect)", "Không đổi", "Chỉ đổi độ dài"], a: 1 },
      { q: "Đăng nhập kiểm tra mật khẩu bằng cách nào?", o: ["Giải mã hash trong DB", "Băm mật khẩu nhập vào rồi so hai mã băm", "So chuỗi thô", "Hỏi lại email"], a: 1 },
      { q: "Salt phải như thế nào?", o: ["Cố định toàn hệ thống", "Ngẫu nhiên riêng cho mỗi người dùng", "Giữ bí mật tuyệt đối ở file .env", "Trùng với mật khẩu"], a: 1 }
    ]
  },
  {
    id: "lesson33",
    title: "33. Quản lý mật khẩu & Băm bảo mật phía Backend",
    lang: "php",
    file: "src/lesson33.php",
    duration: "45 phút",
    overview: {
      description: "Chuẩn công nghiệp lưu mật khẩu: password_hash với bcrypt — thuật toán CHẬM CÓ CHỦ ĐÍCH, tự sinh salt, và cách xác thực bằng password_verify.",
      outcomes: [
        "Dùng cặp chuẩn password_hash + password_verify của PHP",
        "Giải thích vì sao bcrypt chậm lại là ưu điểm (chống brute-force)",
        "Nắm quy trình đăng ký/đăng nhập an toàn từ đầu đến cuối"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Theo khuyến nghị **OWASP Password Storage Cheat Sheet**: mật khẩu phải băm bằng thuật toán CHẬM chuyên dụng — **bcrypt** hoặc **Argon2** — không dùng sha256 trần (băm quá nhanh, GPU thử hàng tỷ mật khẩu/giây).

\`\`\`php
// Đăng ký: băm — tự sinh salt, nhúng luôn vào chuỗi kết quả
$hash = password_hash($password, PASSWORD_BCRYPT);

// Đăng nhập: so khớp — tự tách salt ra kiểm tra
if (password_verify($inputPassword, $hash)) { /* đúng mật khẩu */ }
\`\`\`

> bcrypt có **cost factor** (mặc định 10): mỗi +1 là chậm gấp đôi — chỉnh được độ khó theo thời đại phần cứng.
> **Tuyệt đối không**: lưu mật khẩu thô, tự chế thuật toán, so sánh hash bằng == (dùng password_verify).`,
    labSteps: [
      "Mở src/lesson33.php — xây cặp hàm registerUser / loginUser.",
      "registerUser($password): trả về password_hash($password, PASSWORD_BCRYPT) — in thử, để ý chuỗi bắt đầu $2y$10$ (thuật toán + cost + salt nhúng sẵn).",
      "Băm cùng một mật khẩu 2 lần — 2 chuỗi KHÁC nhau (salt tự sinh mỗi lần) nhưng đều verify đúng.",
      "loginUser($input, $hash): return password_verify($input, $hash);",
      "Test đủ 2 nhánh: mật khẩu đúng → true, sai một ký tự → false."
    ],
    commonMistakes: [
      { symptom: "So sánh password_hash($input) == $hashTrongDB luôn ra false.", cause: "Mỗi lần hash sinh salt mới — hai chuỗi không bao giờ trùng.", fix: "Phải dùng password_verify($input, $hash) — nó tự đọc salt từ chuỗi hash." },
      { symptom: "Lưu mật khẩu thô 'để tiện gửi lại cho khách khi quên'.", cause: "Sai quy trình quên mật khẩu.", fix: "Không bao giờ lưu thô; quên mật khẩu = gửi link đặt lại có token hết hạn." },
      { symptom: "Băm mật khẩu ở frontend rồi gửi hash lên server.", cause: "Hash đó trở thành 'mật khẩu' mới — nghe lén được là đăng nhập được.", fix: "Gửi mật khẩu qua HTTPS, băm tại backend." }
    ],
    challenge: "Thêm kiểm tra độ mạnh mật khẩu trước khi băm: tối thiểu 8 ký tự, có chữ và số — trả thông báo lỗi rõ ràng từng trường hợp.",
    checklist: [
      "Thuộc cặp password_hash + password_verify",
      "Giải thích vì sao 2 lần băm cùng mật khẩu ra 2 chuỗi khác nhau",
      "Kể được 3 điều 'tuyệt đối không' khi lưu mật khẩu"
    ],
    tasks: ["Viết registerUser dùng password_hash PASSWORD_BCRYPT và loginUser dùng password_verify."],
    starterCode: `<?php
// BÀI 33: Lưu mật khẩu chuẩn OWASP
// TODO 1: registerUser($password) -> password_hash(..., PASSWORD_BCRYPT)
// TODO 2: loginUser($input, $hash) -> password_verify(...)
// TODO 3: test nhánh đúng và nhánh sai
?>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("password_hash(") && c.includes("password_bcrypt") && c.includes("password_verify(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chọn hàm PHP chuẩn để KIỂM TRA mật khẩu người dùng nhập có khớp hash trong DB:",
      snippet: "if ([ ... ]($inputPassword, $hashedFromDB)) { login(); }",
      options: [
        { text: "password_hash", correct: false },
        { text: "password_verify", correct: true },
        { text: "hash_equals", correct: false },
        { text: "md5_check", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Vì sao bcrypt CHẬM lại là ưu điểm?", o: ["Tiết kiệm điện", "Làm brute-force hàng tỷ lần thử trở nên bất khả thi", "Dễ debug", "Không phải ưu điểm"], a: 1 },
      { q: "Hai lần password_hash cùng một mật khẩu cho kết quả?", o: ["Giống hệt nhau", "Khác nhau vì salt tự sinh mỗi lần", "Lỗi", "Chuỗi rỗng"], a: 1 },
      { q: "Thuật toán nào KHÔNG được dùng cho mật khẩu?", o: ["bcrypt", "Argon2", "md5", "PASSWORD_DEFAULT"], a: 2 },
      { q: "Quy trình quên mật khẩu đúng chuẩn?", o: ["Gửi lại mật khẩu cũ qua email", "Gửi link đặt lại kèm token có hạn", "Đọc mật khẩu qua điện thoại", "Xoá tài khoản tạo lại"], a: 1 }
    ]
  },
  {
    id: "lesson34",
    title: "34. Encoding: Base64, Hex & URL Encode",
    lang: "javascript",
    file: "src/lesson34.js",
    duration: "40 phút",
    overview: {
      description: "Encoding KHÔNG phải bảo mật — chỉ là đổi 'vỏ' dữ liệu để truyền tải an toàn: Base64 cho nhị phân, Hex cho byte, URL encode cho ký tự đặc biệt trên link.",
      outcomes: [
        "Khắc cốt: encode đảo ngược được, không phải mã hóa bảo mật",
        "Dùng btoa/atob (Base64) và encodeURIComponent/decodeURIComponent",
        "Nhận diện dữ liệu Base64 và data URI (data:image/png;base64,...)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Encoding ≠ Encryption**: encoding chỉ ĐỔI ĐỊNH DẠNG, ai cũng decode được — đừng bao giờ 'giấu' mật khẩu bằng Base64.

> **Base64** — biểu diễn nhị phân bằng 64 ký tự chữ/số: nhúng ảnh vào JSON/CSS (\`data:image/png;base64,...\`), phần payload của JWT. JS: \`btoa()\` encode, \`atob()\` decode.
> **Hex** — mỗi byte thành 2 ký tự 0-9a-f: biểu diễn mã băm, màu CSS #0056b3.
> **URL Encoding** — ký tự đặc biệt thành %XX để an toàn trên URL: \`encodeURIComponent("xin chào") → "xin%20ch%C3%A0o"\`.

\`\`\`javascript
const encoded = btoa("HugoCoder");            // SHVnb0NvZGVy
const decoded = atob(encoded);                // HugoCoder
const safe = encodeURIComponent("a=1&b=2");   // a%3D1%26b%3D2
\`\`\``,
    labSteps: [
      "Mở src/lesson34.js — thí nghiệm 3 loại encoding.",
      "Base64: btoa('HugoCoder') rồi atob ngược lại — in cả hai, xác nhận khứ hồi nguyên vẹn.",
      "Tự 'giải mã' chuỗi 'aHVnb0BzdHVkaW8udm4=' bằng atob — thấy ngay vì sao Base64 không phải bảo mật.",
      "URL: encodeURIComponent('tên=Hugo&lớp=12') và decode ngược — để ý các ký tự %.",
      "Hex: chuyển 'Hi' thành hex bằng codePointAt(0).toString(16) từng ký tự.",
      "Chú thích cuối file: 3 chỗ bạn đã từng THẤY Base64/Hex/URL encode ngoài đời."
    ],
    commonMistakes: [
      { symptom: "Lưu token nhạy cảm 'đã Base64' và coi là đã mã hóa.", cause: "Nhầm encoding với encryption.", fix: "Base64 giải ngược 1 giây; bảo mật phải dùng mã hóa (AES) hoặc băm (bcrypt) đúng mục đích." },
      { symptom: "Link ?name=Nguyễn Văn A bị đứt gãy dữ liệu.", cause: "Ký tự có dấu/khoảng trắng chưa được URL encode.", fix: "Luôn encodeURIComponent giá trị trước khi gắn vào query string." },
      { symptom: "btoa tiếng Việt ném lỗi InvalidCharacterError.", cause: "btoa chỉ nhận chuỗi Latin-1.", fix: "Chuyển qua UTF-8 trước: btoa(String.fromCharCode(...new TextEncoder().encode(str)))." }
    ],
    challenge: "Viết hàm buildUrl(base, params) nhận object tham số, trả URL hoàn chỉnh với mọi giá trị đã encodeURIComponent đúng chuẩn.",
    checklist: [
      "Nói được câu: encoding đổi vỏ, ai cũng decode được",
      "Dùng thành thạo btoa/atob và encodeURIComponent",
      "Kể 3 nơi gặp Base64/Hex trong thực tế"
    ],
    tasks: ["Dùng btoa + atob khứ hồi Base64 và encodeURIComponent + decodeURIComponent cho query string."],
    starterCode: `// BÀI 34: Encoding — đổi vỏ, không phải bảo mật
// TODO 1: btoa("HugoCoder") -> atob ngược lại
// TODO 2: atob("aHVnb0BzdHVkaW8udm4=") — đọc được gì?
// TODO 3: encodeURIComponent("tên=Hugo&lớp=12") -> decode ngược
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("btoa(") && c.includes("atob(") && c.includes("encodeuricomponent(") && c.includes("decodeuricomponent(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Hàm nào ENCODE một chuỗi sang Base64 trong trình duyệt?",
      snippet: "const encoded = [ ... ](\"HugoCoder\"); // \"SHVnb0NvZGVy\"",
      options: [
        { text: "atob()", correct: false },
        { text: "btoa()", correct: true },
        { text: "encodeURIComponent()", correct: false },
        { text: "hash()", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Base64 có phải là mã hóa bảo mật không?", o: ["Có, rất an toàn", "Không — chỉ đổi định dạng, ai cũng decode được", "Có nếu chạy 2 lần", "Chỉ an toàn trên HTTPS"], a: 1 },
      { q: "Chuỗi 'data:image/png;base64,...' dùng để làm gì?", o: ["Link ảnh ngoài", "Nhúng thẳng dữ liệu ảnh vào tài liệu/JSON", "Nén ảnh", "Mã hóa ảnh"], a: 1 },
      { q: "encodeURIComponent dùng khi nào?", o: ["Mã hóa mật khẩu", "Đưa giá trị có ký tự đặc biệt vào URL an toàn", "Nén URL", "Đổi tên miền"], a: 1 },
      { q: "Mã màu CSS #0056b3 là kiểu biểu diễn nào?", o: ["Base64", "Hex (thập lục phân)", "URL encode", "Binary"], a: 1 }
    ]
  },
  {
    id: "lesson35",
    title: "35. Nguyên tắc bảo mật thông tin: Mô hình Tam giác CIA",
    lang: "html",
    file: "src/lesson35.html",
    duration: "40 phút",
    overview: {
      description: "Khung tư duy gốc của mọi quyết định bảo mật: Confidentiality – Integrity – Availability, và cách từng kỹ thuật bạn đã học gắn vào ba đỉnh tam giác.",
      outcomes: [
        "Thuộc 3 trụ cột CIA và định nghĩa từng trụ",
        "Gắn đúng kỹ thuật (mã hóa, hash, backup...) vào từng đỉnh",
        "Phân tích một sự cố thực tế bằng lăng kính CIA"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Tam giác CIA** — chuẩn nền của ngành an toàn thông tin (ISO 27001, NIST):

> **Confidentiality (Bảo mật)** — chỉ người có quyền mới đọc được: mã hóa AES/TLS, phân quyền, che dữ liệu nhạy cảm.
> **Integrity (Toàn vẹn)** — dữ liệu không bị sửa trái phép: hash/checksum, chữ ký số, ràng buộc DB, transaction.
> **Availability (Khả dụng)** — hệ thống luôn sẵn sàng phục vụ: backup, load balancing, chống DDoS, giám sát.

Mọi sự cố đều chạm ít nhất một đỉnh: DB rò rỉ (C), hacker sửa điểm số (I), DDoS sập trang (A). Ba đỉnh còn giằng co nhau — mã hóa quá nặng (C) có thể làm chậm dịch vụ (A) — nghề bảo mật là nghệ thuật cân bằng.`,
    labSteps: [
      "Mở src/lesson35.html — dựng 'bản đồ CIA' của chính bạn.",
      "Tạo 3 thẻ <article>, mỗi đỉnh một thẻ: tiêu đề tiếng Anh + định nghĩa 1 câu tiếng Việt.",
      "Dưới mỗi đỉnh: <ul> 3 kỹ thuật đã học ở các bài trước gắn với đỉnh đó (vd: AES → C, sha256 checksum → I, backup → A).",
      "Thêm mục 'Phân tích sự cố': chọn 1 vụ rò rỉ dữ liệu bạn biết, chỉ ra đỉnh nào bị vi phạm.",
      "Đọc lại: mỗi kỹ thuật của bài 31-33 đều phải tìm được chỗ đứng trên bản đồ."
    ],
    commonMistakes: [
      { symptom: "Nghĩ bảo mật = chỉ mã hóa cho kín (đỉnh C).", cause: "Bỏ quên Integrity và Availability.", fix: "Sập trang do DDoS cũng là sự cố bảo mật — kiểm đủ 3 đỉnh khi thiết kế." },
      { symptom: "Xếp hash/checksum vào Confidentiality.", cause: "Nhầm vai trò: hash không giấu dữ liệu, nó phát hiện SỬA ĐỔI.", fix: "Hash/chữ ký số thuộc Integrity; giấu dữ liệu (encryption) mới thuộc C." },
      { symptom: "Bật xác thực 2 lớp cho mọi thao tác khiến người dùng bỏ đi.", cause: "Dồn hết vào C mà quên tính khả dụng/tiện dụng.", fix: "Cân bằng theo mức rủi ro: thao tác nhạy cảm mới cần lớp bảo vệ dày." }
    ],
    challenge: "Phân tích hệ thống HugoCoder JOY wallet theo CIA: liệt kê cho mỗi đỉnh 2 rủi ro và 2 biện pháp tương ứng.",
    checklist: [
      "Đọc thuộc 3 trụ cột kèm định nghĩa 1 câu",
      "Gắn đúng tối thiểu 6 kỹ thuật vào 3 đỉnh",
      "Phân tích được 1 sự cố thật bằng CIA"
    ],
    tasks: ["Dựng trang HTML đủ 3 từ khóa Confidentiality, Integrity, Availability kèm kỹ thuật minh họa."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bài 35: Tam giác CIA</title>
</head>
<body>
    <h1>Tam giác bảo mật CIA</h1>
    <!-- TODO: 3 article — Confidentiality / Integrity / Availability
         mỗi đỉnh: định nghĩa + ul 3 kỹ thuật đã học -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("confidentiality") && c.includes("integrity") && c.includes("availability") && c.includes("<article");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Website bị DDoS đánh sập, người dùng không truy cập được — đỉnh nào của CIA bị vi phạm?",
      snippet: "503 Service Unavailable",
      options: [
        { text: "Confidentiality", correct: false },
        { text: "Integrity", correct: false },
        { text: "Availability", correct: true },
        { text: "Không đỉnh nào", correct: false }
      ],
      correctIdx: 2
    },
    miniQuiz: [
      { q: "Chữ 'I' trong CIA nghĩa là gì?", o: ["Identity", "Integrity — dữ liệu không bị sửa trái phép", "Internet", "Information"], a: 1 },
      { q: "Mã hóa dữ liệu TLS phục vụ đỉnh nào?", o: ["Confidentiality", "Availability", "Cả ba", "Không đỉnh nào"], a: 0 },
      { q: "Checksum/hash file phục vụ đỉnh nào?", o: ["Confidentiality", "Integrity", "Availability", "Authorization"], a: 1 },
      { q: "Backup và load balancing phục vụ đỉnh nào?", o: ["Confidentiality", "Integrity", "Availability", "Audit"], a: 2 }
    ]
  },
  {
    id: "lesson36",
    title: "36. Bất đồng bộ nâng cao: Promises, Async/Await & Event Loop",
    lang: "javascript",
    file: "src/lesson36.js",
    duration: "55 phút",
    overview: {
      description: "JS chạy một luồng duy nhất mà vẫn xử lý được ngàn việc: hiểu Event Loop, thuần thục Promise và async/await kèm bắt lỗi chuẩn.",
      outcomes: [
        "Mô tả Event Loop: Call Stack, Web APIs, hàng đợi Micro/Macrotask",
        "Viết hàm async/await với try/catch đầy đủ",
        "Chạy song song nhiều tác vụ bằng Promise.all"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
JS **đơn luồng** — xử lý bất đồng bộ nhờ **Event Loop**: tác vụ chậm (fetch, timer) được giao cho Web APIs; xong việc, callback xếp vào hàng đợi; Event Loop đẩy vào Call Stack khi stack rỗng.

> **Microtask** (Promise callback) luôn được ưu tiên chạy trước **Macrotask** (setTimeout) — vì vậy Promise.then chạy trước setTimeout 0ms.

\`\`\`javascript
async function fetchLessons() {
  try {
    const res = await fetch("/api/lessons");
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải bài học:", err.message);
  }
}
// Chạy song song thay vì nối đuôi:
const [a, b] = await Promise.all([fetchA(), fetchB()]);
\`\`\``,
    labSteps: [
      "Mở src/lesson36.js — 3 thí nghiệm tăng dần.",
      "Thí nghiệm thứ tự: console.log('1'); setTimeout(()=>log('2'), 0); Promise.resolve().then(()=>log('3')); log('4'); — ĐOÁN trước rồi mới chạy (đáp án 1,4,3,2).",
      "Viết fetchLessons() async/await theo khuôn: try → await fetch → kiểm tra res.ok → await res.json → catch.",
      "Viết 2 hàm giả lập delay bằng new Promise(resolve => setTimeout(resolve, 1000)).",
      "So thời gian: await nối đuôi 2 hàm (≈2s) vs Promise.all (≈1s) bằng console.time."
    ],
    commonMistakes: [
      { symptom: "console.log(data) in ra Promise { <pending> }.", cause: "Quên await trước hàm async.", fix: "Gọi hàm async phải await (hoặc .then) mới nhận giá trị." },
      { symptom: "Dùng await trong hàm thường báo SyntaxError.", cause: "await chỉ hợp lệ trong hàm có từ khóa async.", fix: "Thêm async vào khai báo hàm bao ngoài." },
      { symptom: "fetch lỗi 404 mà catch không bắt.", cause: "fetch chỉ reject khi lỗi MẠNG; HTTP 4xx/5xx vẫn resolve.", fix: "Tự kiểm tra if (!res.ok) throw new Error(...)." },
      { symptom: "Ba lời gọi API độc lập chạy mất 3 giây.", cause: "await nối đuôi từng cái.", fix: "Việc độc lập gom vào Promise.all để chạy song song." }
    ],
    challenge: "Viết fetchWithRetry(url, times) — thất bại thì tự thử lại tối đa `times` lần, mỗi lần chờ gấp đôi (exponential backoff).",
    checklist: [
      "Đoán đúng thứ tự bài thí nghiệm 1,4,3,2 và giải thích được",
      "Hàm async nào cũng có try/catch + kiểm tra res.ok",
      "Biết khi nào dùng Promise.all"
    ],
    tasks: ["Viết fetchLessons async/await có try/catch + res.ok, và so sánh Promise.all với await nối đuôi."],
    starterCode: `// BÀI 36: Event Loop & async/await
// TODO 1: thí nghiệm thứ tự log 1/2/3/4 với setTimeout + Promise
// TODO 2: async fetchLessons() — try/catch + if (!res.ok) throw
// TODO 3: Promise.all so với await nối đuôi (console.time)
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("asyncfunction") && c.includes("await") && c.includes("try{") && c.includes("catch(") && c.includes("promise.all(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Promise callback (microtask) và setTimeout (macrotask) — ai chạy TRƯỚC khi cùng sẵn sàng?",
      snippet: "setTimeout(f, 0); Promise.resolve().then(g); // ai trước?",
      options: [
        { text: "setTimeout (f)", correct: false },
        { text: "Promise.then (g) — microtask ưu tiên hơn", correct: true },
        { text: "Ngẫu nhiên", correct: false },
        { text: "Chạy đồng thời", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "JavaScript chạy bao nhiêu luồng chính?", o: ["Một (single-threaded)", "Hai", "Bốn", "Không giới hạn"], a: 0 },
      { q: "await chỉ dùng được ở đâu?", o: ["Mọi nơi", "Bên trong hàm async (hoặc top-level module)", "Trong vòng for", "Trong catch"], a: 1 },
      { q: "fetch trả về 404 thì Promise thế nào?", o: ["Reject ngay", "Vẫn resolve — phải tự kiểm tra res.ok", "Throw exception", "Trả null"], a: 1 },
      { q: "Promise.all dùng khi nào?", o: ["Việc phụ thuộc nhau", "Nhiều việc độc lập cần chạy song song", "Chỉ 1 promise", "Thay try/catch"], a: 1 }
    ]
  },
  {
    id: "lesson37",
    title: "37. Giao tiếp thời gian thực: WebSockets",
    lang: "javascript",
    file: "src/lesson37.js",
    duration: "50 phút",
    overview: {
      description: "Từ hỏi-đáp HTTP sang kênh nói chuyện hai chiều thường trực: WebSocket — công nghệ đứng sau mọi ứng dụng chat, game online và bảng giá trực tuyến.",
      outcomes: [
        "So sánh HTTP polling và WebSocket về độ trễ/chi phí",
        "Thuộc 4 sự kiện vòng đời: onopen, onmessage, onerror, onclose",
        "Gửi/nhận JSON qua socket đúng khuôn send + JSON.stringify"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**HTTP**: hỏi mới đáp — muốn 'thời gian thực' phải polling (hỏi dồn dập, tốn kém, trễ).
**WebSocket** (chuẩn RFC 6455): bắt tay một lần, giữ **kết nối hai chiều (full-duplex)** — server chủ động đẩy dữ liệu xuống bất cứ lúc nào, độ trễ mili giây.

\`\`\`javascript
const socket = new WebSocket("ws://localhost:3000/chat"); // wss:// khi production
socket.onopen = () => socket.send(JSON.stringify({ type: "hello" }));
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log("Tin mới:", msg);
};
socket.onclose = () => console.log("Mất kết nối — cần tự kết nối lại");
\`\`\`
Dữ liệu qua socket là CHUỖI — object phải JSON.stringify khi gửi, JSON.parse khi nhận.`,
    labSteps: [
      "Mở src/lesson37.js — dựng client chat tối giản.",
      "Khởi tạo new WebSocket(\"ws://localhost:3000/chat\") — chú thích: production dùng wss:// (bọc TLS).",
      "Đăng ký đủ 4 sự kiện onopen / onmessage / onerror / onclose — mỗi cái một console.log rõ ràng.",
      "Viết sendMessage(text): đóng gói { body: text, sentAt: Date.now() } và socket.send(JSON.stringify(...)).",
      "Trong onmessage: JSON.parse(event.data) rồi tạo <div> gắn vào #chat-box bằng appendChild.",
      "Chú thích cuối file: vì sao polling 3 giây/lần vẫn 'thua' WebSocket cả về độ trễ lẫn chi phí."
    ],
    commonMistakes: [
      { symptom: "socket.send ngay sau new WebSocket báo lỗi InvalidStateError.", cause: "Kết nối chưa mở — bắt tay chưa xong.", fix: "Chỉ send bên trong/ sau sự kiện onopen." },
      { symptom: "onmessage nhận '[object Object]' hoặc parse lỗi.", cause: "Gửi object thẳng không stringify.", fix: "Luôn send(JSON.stringify(obj)) và parse ở đầu nhận." },
      { symptom: "Người dùng mất mạng 5 giây là chat chết hẳn.", cause: "Không xử lý onclose để kết nối lại.", fix: "Trong onclose đặt setTimeout kết nối lại (kèm backoff tăng dần)." }
    ],
    challenge: "Thêm cơ chế auto-reconnect: onclose chờ 1s, 2s, 4s... (tối đa 30s) rồi thử kết nối lại, có đếm số lần thử.",
    checklist: [
      "Kể đủ 4 sự kiện vòng đời socket",
      "Thuộc khuôn stringify khi gửi / parse khi nhận",
      "Giải thích được lúc nào chọn WebSocket, lúc nào HTTP thường là đủ"
    ],
    tasks: ["Khởi tạo new WebSocket, đăng ký onopen/onmessage, gửi tin bằng send + JSON.stringify và vẽ tin nhận vào DOM."],
    starterCode: `// BÀI 37: WebSocket chat client
// TODO 1: const socket = new WebSocket("ws://localhost:3000/chat")
// TODO 2: onopen / onmessage / onerror / onclose
// TODO 3: sendMessage(text) — socket.send(JSON.stringify({...}))
// TODO 4: onmessage — JSON.parse + appendChild vào #chat-box
`,
    verify: (code) => {
      const c = code.replace(/\s+/g, "");
      return c.includes("newWebSocket(") && c.includes(".onopen") && c.includes(".onmessage") && c.includes(".send(JSON.stringify") && c.includes("JSON.parse(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Phương thức nào của WebSocket dùng để GỬI dữ liệu lên server?",
      snippet: "socket.[ ... ](JSON.stringify({ body: 'Xin chào' }));",
      options: [
        { text: "post()", correct: false },
        { text: "send()", correct: true },
        { text: "emit()", correct: false },
        { text: "push()", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Lợi thế lớn nhất của WebSocket so với HTTP polling?", o: ["Bảo mật hơn", "Kết nối hai chiều thường trực, độ trễ mili giây, không tốn request lặp", "Dễ code hơn", "Không cần server"], a: 1 },
      { q: "Giao thức WebSocket bảo mật (bọc TLS) có tiền tố nào?", o: ["ws://", "wss://", "https://", "socket://"], a: 1 },
      { q: "Sự kiện nào nhận dữ liệu server đẩy xuống?", o: ["onopen", "onmessage", "onsend", "onreceive"], a: 1 },
      { q: "Vì sao phải JSON.stringify trước khi send?", o: ["Cho gọn", "Socket truyền chuỗi/bytes — object phải chuyển thành chuỗi", "Để mã hóa", "Không cần"], a: 1 }
    ]
  },
  {
    id: "lesson38",
    title: "38. Hiệu năng giao diện: Critical Rendering Path & DOM",
    lang: "javascript",
    file: "src/lesson38.js",
    duration: "50 phút",
    overview: {
      description: "Con đường từ HTML đến pixel trên màn hình — và kỹ thuật gom thao tác DOM (DocumentFragment) để giao diện hết giật lag.",
      outcomes: [
        "Kể được chuỗi CRP: HTML→DOM, CSS→CSSOM, Render Tree → Layout → Paint",
        "Phân biệt Reflow (tính lại layout, đắt) và Repaint (vẽ lại, rẻ hơn)",
        "Gom N lần chèn DOM về 1 lần bằng DocumentFragment"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Critical Rendering Path** (Google Web Fundamentals) — các bước trình duyệt vẽ trang:

> HTML → **DOM** • CSS → **CSSOM** • ghép thành **Render Tree** → **Layout** (tính vị trí/kích thước) → **Paint** (tô pixel).

Sửa DOM là kích hoạt lại phần đuôi chuỗi này:
> **Reflow** — đổi kích thước/vị trí (width, thêm phần tử) → tính lại layout: ĐẮT.
> **Repaint** — chỉ đổi màu sắc → vẽ lại: rẻ hơn. (transform/opacity: rẻ nhất — GPU, đã học bài 20.)

Chèn 100 phần tử = 100 lần Reflow? Không — gom bằng **DocumentFragment**:
\`\`\`javascript
const frag = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement("li");
  li.textContent = "Mục " + i;
  frag.appendChild(li);         // chưa đụng DOM thật
}
list.appendChild(frag);          // MỘT lần Reflow duy nhất
\`\`\``,
    labSteps: [
      "Mở src/lesson38.js — so hai cách chèn 2000 <li>.",
      "Cách chậm: vòng for appendChild thẳng vào #list từng phần tử — đo bằng console.time('slow').",
      "Cách nhanh: dồn vào createDocumentFragment rồi appendChild MỘT lần — đo console.time('fast').",
      "In hai kết quả đo, ghi chú lại tỷ lệ chênh trên máy bạn.",
      "Chú thích: xếp 3 thao tác theo độ đắt — đổi width (Reflow) > đổi màu (Repaint) > transform (GPU)."
    ],
    commonMistakes: [
      { symptom: "Đọc offsetHeight xen giữa các lần ghi DOM khiến chậm gấp bội.", cause: "Đọc kích thước ép trình duyệt Reflow NGAY để trả số đúng (layout thrashing).", fix: "Tách nhóm: đọc hết một lượt, rồi ghi hết một lượt." },
      { symptom: "innerHTML += trong vòng lặp càng chạy càng ì.", cause: "Mỗi += là parse lại toàn bộ HTML của phần tử.", fix: "Gom chuỗi/phần tử trước, gán MỘT lần cuối (hoặc dùng fragment)." },
      { symptom: "Animation width chạy giật trên mobile.", cause: "Đổi width mỗi frame = Reflow mỗi frame.", fix: "Animate bằng transform: scaleX/translate — không đụng layout." }
    ],
    challenge: "Viết renderTable(rows) đổ 5000 dòng dữ liệu ra bảng bằng fragment, đo dưới 100ms — kèm phiên bản chậm để chứng minh chênh lệch.",
    checklist: [
      "Vẽ lại được chuỗi CRP 5 bước",
      "Đo được chênh lệch thật giữa hai cách chèn",
      "Phân loại đúng Reflow/Repaint/GPU cho 3 thao tác bất kỳ"
    ],
    tasks: ["So sánh chèn 2000 phần tử: từng cái vs gom bằng createDocumentFragment, đo bằng console.time."],
    starterCode: `// BÀI 38: Reflow & DocumentFragment
// TODO 1: cách chậm — for 2000 lần appendChild thẳng (console.time('slow'))
// TODO 2: cách nhanh — createDocumentFragment + appendChild 1 lần (console.time('fast'))
// TODO 3: chú thích xếp hạng độ đắt: width / màu / transform
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("createdocumentfragment()") && c.includes("appendchild(") && c.includes("console.time");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Thao tác nào gây REFLOW (tính lại layout) nặng nhất?",
      snippet: "element.style.[ ??? ] = ...",
      options: [
        { text: "Đổi màu chữ (color)", correct: false },
        { text: "Đổi kích thước/vị trí (width, height)", correct: true },
        { text: "transform: translateX", correct: false },
        { text: "console.log", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Render Tree được ghép từ gì?", o: ["HTML + JS", "DOM + CSSOM", "Layout + Paint", "URL + Cookie"], a: 1 },
      { q: "DocumentFragment giúp gì?", o: ["Nén HTML", "Gom nhiều thao tác chèn thành MỘT lần Reflow", "Cache dữ liệu", "Chặn XSS"], a: 1 },
      { q: "Đổi màu chữ gây ra gì?", o: ["Reflow", "Repaint (không tính lại layout)", "Cả hai", "Không gì cả"], a: 1 },
      { q: "Layout thrashing là gì?", o: ["Xoá layout", "Đan xen đọc kích thước và ghi DOM ép Reflow liên tục", "Dùng nhiều CSS", "Lỗi mạng"], a: 1 }
    ]
  },
  {
    id: "lesson39",
    title: "39. Hiệu năng ứng dụng: Core Web Vitals (LCP, INP, CLS)",
    lang: "html",
    file: "src/lesson39.html",
    duration: "45 phút",
    overview: {
      description: "Ba con số Google dùng để xếp hạng trải nghiệm trang của bạn — hiểu, đo bằng Lighthouse, và sửa đúng bệnh từng chỉ số.",
      outcomes: [
        "Thuộc 3 chỉ số + ngưỡng tốt: LCP < 2.5s, INP < 200ms, CLS < 0.1",
        "Chống CLS bằng width/height tường minh cho ảnh",
        "Biết chạy Lighthouse trong Chrome DevTools để đo thật"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Core Web Vitals** — bộ chỉ số trải nghiệm của Google (ảnh hưởng trực tiếp thứ hạng SEO):

> **LCP** (Largest Contentful Paint) — thời điểm phần tử lớn nhất hiện ra. Tốt: **< 2.5s**. Bệnh thường gặp: ảnh hero nặng, font chặn render.
> **INP** (Interaction to Next Paint) — độ trễ phản hồi tương tác. Tốt: **< 200ms**. Bệnh: JS dài chiếm luồng chính.
> **CLS** (Cumulative Layout Shift) — mức giật nhảy layout. Tốt: **< 0.1**. Bệnh: ảnh/quảng cáo không khai báo kích thước, nội dung chen vào sau.

Vũ khí chống CLS rẻ nhất: khai báo **width + height** cho mọi \`<img>\` — trình duyệt chừa sẵn chỗ trước khi ảnh tải xong:
\`\`\`html
<img src="hero.png" alt="Ảnh bìa khóa học" width="1200" height="630" loading="lazy">
\`\`\`
Đo thật: Chrome DevTools → tab **Lighthouse** → Analyze page load.`,
    labSteps: [
      "Mở src/lesson39.html — trang có 3 ảnh KHÔNG khai báo kích thước (thủ phạm CLS).",
      "Thêm width + height đúng tỷ lệ cho cả 3 thẻ img, kèm alt đầy đủ.",
      "Thêm loading=\"lazy\" cho 2 ảnh dưới màn hình đầu (giữ ảnh hero tải ngay để bảo vệ LCP).",
      "Dựng bảng <table> 3 hàng: chỉ số — đo cái gì — ngưỡng tốt, tự gõ từ trí nhớ.",
      "Mở DevTools → Lighthouse → chạy audit và đọc mục Diagnostics."
    ],
    commonMistakes: [
      { symptom: "Đang đọc bài, nội dung nhảy xuống làm bấm nhầm quảng cáo.", cause: "Ảnh/iframe không khai báo kích thước — CLS cao.", fix: "Mọi media có width/height (hoặc aspect-ratio CSS) để giữ chỗ trước." },
      { symptom: "Lazy load cả ảnh hero khiến LCP tệ đi.", cause: "Lazy loading mù quáng mọi ảnh.", fix: "Ảnh trên màn hình đầu (above the fold) phải tải ngay; chỉ lazy phần dưới." },
      { symptom: "Bấm nút mà 1 giây sau giao diện mới phản hồi.", cause: "Hàm JS đồng bộ chạy dài chiếm luồng chính — INP cao.", fix: "Chẻ việc nặng bằng setTimeout/requestIdleCallback hoặc đưa vào Web Worker." }
    ],
    challenge: "Chạy Lighthouse trên trang bất kỳ bạn từng làm, chụp 3 chỉ số và viết 3 dòng kế hoạch sửa cho chỉ số tệ nhất.",
    checklist: [
      "Đọc thuộc 3 chỉ số + 3 ngưỡng tốt",
      "Mọi img trong bài có width/height/alt",
      "Đã tự chạy được một audit Lighthouse"
    ],
    tasks: ["Khai báo width/height/alt cho mọi img, thêm loading=\"lazy\" cho ảnh dưới màn hình đầu, dựng bảng 3 chỉ số."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bài 39: Core Web Vitals</title>
</head>
<body>
  <h1>Đo lường trải nghiệm trang</h1>
  <!-- TODO: thêm width/height/alt cho 3 ảnh; lazy 2 ảnh dưới -->
  <img src="hero.png">
  <img src="chart-1.png">
  <img src="chart-2.png">
  <!-- TODO: bảng 3 hàng LCP / INP / CLS: đo gì — ngưỡng tốt -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      const imgsOk = (c.match(/width=/g) || []).length >= 3 && (c.match(/height=/g) || []).length >= 3 && (c.match(/alt=/g) || []).length >= 3;
      return imgsOk && c.includes('loading="lazy"') && c.includes("lcp") && c.includes("inp") && c.includes("cls");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Chỉ số nào đo độ GIẬT NHẢY layout khiến người dùng bấm nhầm?",
      snippet: "Ngưỡng tốt: < 0.1",
      options: [
        { text: "LCP", correct: false },
        { text: "INP", correct: false },
        { text: "CLS", correct: true },
        { text: "TTFB", correct: false }
      ],
      correctIdx: 2
    },
    miniQuiz: [
      { q: "Ngưỡng LCP tốt theo Google?", o: ["< 1s", "< 2.5s", "< 5s", "< 10s"], a: 1 },
      { q: "INP đo điều gì?", o: ["Tốc độ mạng", "Độ trễ từ tương tác đến khung hình phản hồi kế tiếp", "Kích thước trang", "Số request"], a: 1 },
      { q: "Cách rẻ nhất chống CLS cho ảnh?", o: ["Nén ảnh", "Khai báo width/height để giữ chỗ trước", "Dùng ảnh nhỏ", "Xoá ảnh"], a: 1 },
      { q: "Có nên lazy load ảnh hero đầu trang không?", o: ["Nên, tiết kiệm băng thông", "Không — làm LCP tệ đi, chỉ lazy phần dưới màn hình đầu", "Bắt buộc lazy mọi ảnh", "Không ảnh hưởng"], a: 1 }
    ]
  },
  {
    id: "lesson40",
    title: "40. Hiệu năng bộ nhớ: Memory Leaks & Garbage Collection",
    lang: "javascript",
    file: "src/lesson40.js",
    duration: "50 phút",
    overview: {
      description: "Vì sao tab web mở lâu ngốn cả GB RAM: cơ chế dọn rác Mark-and-Sweep, ba thủ phạm rò rỉ kinh điển và khuôn cleanup chuẩn.",
      outcomes: [
        "Mô tả Garbage Collection theo thuật toán Mark-and-Sweep",
        "Kể 3 thủ phạm rò rỉ: listener quên gỡ, interval quên tắt, biến toàn cục",
        "Viết khuôn setup-trả-về-cleanup cho listener và interval"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Garbage Collector** của JS engine (V8) chạy **Mark-and-Sweep**: xuất phát từ gốc (window, biến đang trong scope), đánh dấu mọi đối tượng còn với tới được — phần KHÔNG với tới được bị quét dọn.

**Rò rỉ = đối tượng vô dụng nhưng vẫn 'với tới được'**, GC không dám dọn. Ba thủ phạm kinh điển:
1. **Event listener quên gỡ** — element bị xoá nhưng listener (và mọi biến nó nắm) vẫn sống.
2. **setInterval quên clear** — chạy ngầm mãi mãi, giữ chặt closure.
3. **Biến toàn cục vô tình** — quên const/let biến rơi vào window, sống trọn đời tab.

Khuôn chuẩn — hàm setup trả về hàm cleanup:
\`\`\`javascript
function setupResizeHandler() {
  const handler = () => console.log(window.innerWidth);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}
const cleanup = setupResizeHandler();
// khi rời trang/tab: cleanup();
\`\`\``,
    labSteps: [
      "Mở src/lesson40.js — có sẵn 3 khối code rò rỉ được đánh dấu LEAK #1..#3.",
      "LEAK #1: listener resize gắn mà không bao giờ gỡ — sửa theo khuôn setup trả về cleanup (removeEventListener).",
      "LEAK #2: setInterval đếm giây không ai tắt — lưu id và viết hàm stop gọi clearInterval(id).",
      "LEAK #3: biến counter không khai báo từ khóa — thêm let/const cho hết rơi vào window.",
      "Chú thích cuối file: mô tả Mark-and-Sweep trong 2 câu của riêng bạn."
    ],
    commonMistakes: [
      { symptom: "removeEventListener gọi rồi mà listener vẫn chạy.", cause: "Truyền vào một arrow function MỚI — khác tham chiếu hàm đã đăng ký.", fix: "Đặt handler vào biến, add và remove CÙNG một tham chiếu." },
      { symptom: "Chuyển trang SPA nhiều lần, tab càng lúc càng ì.", cause: "Mỗi lần vào trang lại đăng ký listener/interval mới chồng lên.", fix: "Mỗi setup phải có cleanup được gọi khi rời trang (unmount)." },
      { symptom: "Tin rằng GC 'tự lo hết' nên không cần cleanup.", cause: "Hiểu sai: GC chỉ dọn thứ KHÔNG với tới được.", fix: "Listener/interval còn đăng ký = còn với tới được = GC bó tay; phải tự gỡ." }
    ],
    challenge: "Mở DevTools → Memory → chụp 2 heap snapshot trước/sau khi chạy khối leak, so kích thước — rồi chụp lại sau khi sửa để chứng minh hết rò.",
    checklist: [
      "Kể đủ 3 thủ phạm rò rỉ kinh điển",
      "Mọi addEventListener/setInterval trong bài đều có đường gỡ",
      "Giải thích được câu: GC chỉ dọn thứ không với tới được"
    ],
    tasks: ["Vá 3 khối rò rỉ: removeEventListener đúng tham chiếu, clearInterval theo id, thêm let/const."],
    starterCode: `// BÀI 40: Săn rò rỉ bộ nhớ
// LEAK #1: listener không bao giờ gỡ
window.addEventListener("resize", () => console.log(window.innerWidth));

// LEAK #2: interval chạy ngầm mãi mãi
setInterval(() => console.log("tick"), 1000);

// LEAK #3: biến toàn cục vô tình
counter = 0;

// TODO: sửa cả 3 theo khuôn setup -> trả về cleanup
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("removeeventlistener") && c.includes("clearinterval(") && (c.includes("letcounter") || c.includes("constcounter"));
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Thuật toán dọn rác của các JS engine hiện đại là gì?",
      snippet: "GC: đánh dấu từ gốc → quét phần không với tới được",
      options: [
        { text: "Reference Counting", correct: false },
        { text: "Mark-and-Sweep", correct: true },
        { text: "FIFO", correct: false },
        { text: "Deep Clean", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "GC dọn được những đối tượng nào?", o: ["Mọi đối tượng cũ", "Đối tượng không còn 'với tới được' từ gốc", "Đối tượng lớn nhất", "Biến toàn cục"], a: 1 },
      { q: "Vì sao removeEventListener với arrow function mới không ăn?", o: ["Cú pháp sai", "Khác tham chiếu với hàm đã đăng ký", "Trình duyệt chặn", "Phải dùng jQuery"], a: 1 },
      { q: "setInterval quên clear gây hậu quả gì?", o: ["Không sao", "Chạy ngầm mãi, giữ chặt bộ nhớ closure — rò rỉ", "Tự dừng sau 1 phút", "Chỉ tốn CPU"], a: 1 },
      { q: "Quên let/const khi gán biến trong hàm (non-strict) thì biến đi đâu?", o: ["Bị xoá", "Rơi vào window thành biến toàn cục sống trọn đời tab", "Vào Set", "Báo lỗi luôn"], a: 1 }
    ]
  },
  {
    id: "lesson41",
    title: "41. Hiệu năng tài nguyên: Bundling & Code Splitting",
    lang: "javascript",
    file: "src/lesson41.js",
    duration: "45 phút",
    overview: {
      description: "Người dùng chỉ nên tải code của trang họ đang xem: gom file bằng bundler rồi chẻ nhỏ bằng dynamic import — cách các SPA lớn tải nhanh gấp nhiều lần.",
      outcomes: [
        "Giải thích bundling (gom) và code splitting (chẻ) bổ trợ nhau thế nào",
        "Viết dynamic import() tải thư viện đúng lúc cần",
        "Phân biệt import tĩnh (đầu file) và import() động (trong hàm)"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Bundling** (Vite/webpack): gom trăm file nhỏ thành ít bundle — bớt số request, minify, tree-shaking bỏ code chết.

Nhưng một bundle khổng lồ = trang đầu tải cả code của những trang chưa mở. **Code Splitting** chẻ bundle theo ranh giới sử dụng, tải bằng **dynamic import**:

\`\`\`javascript
// import tĩnh — nằm đầu file, vào bundle chính
import { format } from "./date-utils.js";

// import động — chỉ tải KHI CHẠY ĐẾN, tách thành chunk riêng
async function openChart() {
  const { renderChart } = await import("./chart-utils.js");
  renderChart();
}
\`\`\`
Khuôn quyết định: thứ màn hình đầu cần → import tĩnh; thứ nặng/hiếm dùng (biểu đồ, editor, modal xuất PDF) → import() động khi người dùng thực sự mở. React.lazy của SPA chính là khuôn này.`,
    labSteps: [
      "Mở src/lesson41.js — mô phỏng trang dashboard có nút 'Xem biểu đồ'.",
      "Viết chartUtils giả lập: export hàm renderChart (có thể để cùng file dạng chú thích module ảo).",
      "Viết async function openChart() dùng await import(\"./chart-utils.js\") rồi gọi renderChart().",
      "Gắn openChart vào sự kiện click của nút — thư viện chỉ tải ở lần bấm đầu tiên.",
      "Chú thích: liệt kê 3 thứ trong app của bạn xứng đáng bị chẻ (nặng + hiếm dùng)."
    ],
    commonMistakes: [
      { symptom: "Chẻ nhỏ mọi thứ, trang phát sinh 40 request lắt nhắt.", cause: "Splitting cực đoan — mất luôn lợi ích của bundling.", fix: "Chỉ chẻ khối NẶNG và HIẾM DÙNG; phần lõi màn hình đầu giữ trong bundle chính." },
      { symptom: "await import(...) báo lỗi cú pháp.", cause: "Dùng trong hàm thường không async.", fix: "Hàm bao ngoài phải async (hoặc dùng .then)." },
      { symptom: "Bấm nút lần nào cũng thấy 'tải lại' thư viện.", cause: "Tưởng vậy — thực ra import() cache module sau lần đầu.", fix: "Không cần tự cache; module chỉ tải và khởi tạo một lần." }
    ],
    challenge: "Chạy npm run build:analyze trên một dự án Vite bất kỳ, mở treemap và chỉ ra chunk lớn nhất đáng chẻ.",
    checklist: [
      "Phân biệt import tĩnh và import() động kèm chỗ đứng của mỗi loại",
      "Viết được khuôn await import trong event handler",
      "Kể 3 ứng viên code-splitting trong dự án thật"
    ],
    tasks: ["Viết async openChart dùng await import() bên trong xử lý sự kiện click."],
    starterCode: `// BÀI 41: Code Splitting bằng dynamic import
// TODO 1: async function openChart() { const { renderChart } = await import("./chart-utils.js"); renderChart(); }
// TODO 2: document.getElementById("btn-chart").addEventListener("click", openChart)
// TODO 3: chú thích 3 ứng viên đáng chẻ trong app thật
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("awaitimport(") && c.includes("async") && c.includes("addeventlistener");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Mục tiêu chính của Code Splitting là gì?",
      snippet: "bundle.js 2.4MB → main.js 300KB + chart.chunk.js (tải khi cần)",
      options: [
        { text: "Giảm dung lượng tải ban đầu — chỉ tải code trang đang xem", correct: true },
        { text: "Mã hóa source code", correct: false },
        { text: "Tăng số request cho vui", correct: false },
        { text: "Đổi tên biến", correct: false }
      ],
      correctIdx: 0
    },
    miniQuiz: [
      { q: "Tree-shaking là gì?", o: ["Xoá cây DOM", "Bundler loại bỏ code không được import/sử dụng", "Nén ảnh", "Chia nhỏ CSS"], a: 1 },
      { q: "import() động khác import tĩnh thế nào?", o: ["Không khác", "Chỉ tải khi chạy đến, tách thành chunk riêng", "Nhanh hơn mọi lúc", "Chỉ dùng cho CSS"], a: 1 },
      { q: "Thành phần nào NÊN được chẻ (split)?", o: ["Nút bấm trang chủ", "Thư viện biểu đồ nặng chỉ mở trong 1 tab hiếm dùng", "CSS reset", "Hàm cộng trừ"], a: 1 },
      { q: "Module đã import() động lần hai sẽ thế nào?", o: ["Tải lại từ mạng", "Dùng lại từ cache module — chỉ tải một lần", "Báo lỗi", "Tạo bản sao mới"], a: 1 }
    ]
  },
  {
    id: "lesson42",
    title: "42. CSDL nâng cao: Tối ưu chỉ mục (Database Indexing)",
    lang: "sql",
    file: "src/lesson42.sql",
    duration: "45 phút",
    overview: {
      description: "Mục lục của cuốn sách triệu trang: INDEX biến truy vấn quét cả bảng thành tra cứu tức thời — và cái giá phải trả khi lạm dụng.",
      outcomes: [
        "Tạo INDEX bằng CREATE INDEX và soi kế hoạch chạy bằng EXPLAIN",
        "Nhận diện cột đáng đánh index: xuất hiện trong WHERE/JOIN/ORDER BY",
        "Nêu cái giá của index: chậm INSERT/UPDATE, tốn dung lượng"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Không có index, \`WHERE email = ...\` phải **Table Scan** — đọc từng dòng trong hàng triệu dòng. **INDEX** (cấu trúc B-Tree — họ hàng binary search bài 28) cho phép nhảy thẳng đến dòng khớp: **O(log n)**.

\`\`\`sql
CREATE INDEX idx_products_category ON products(category);
EXPLAIN SELECT * FROM products WHERE category = 'electronics';
-- type: ref (dùng index) thay vì ALL (quét cả bảng)
\`\`\`

> Đáng đánh index: cột trong **WHERE**, **JOIN ON**, **ORDER BY** của truy vấn chạy thường xuyên. UNIQUE INDEX cho email/username — vừa nhanh vừa chặn trùng.
> Cái giá: mỗi INSERT/UPDATE/DELETE phải cập nhật lại mọi index của bảng — đánh bừa 10 index là tự làm chậm đường ghi; index cũng ngốn dung lượng ngang dữ liệu.`,
    labSteps: [
      "Mở src/lesson42.sql — kịch bản trang thương mại lọc sản phẩm theo category.",
      "Viết CREATE INDEX idx_products_category ON products(category);",
      "Viết EXPLAIN SELECT ... WHERE category = 'electronics'; — chú thích cột type: ref vs ALL nghĩa là gì.",
      "Tạo UNIQUE INDEX cho users(email) — hai công dụng trong một.",
      "Chú thích: 2 cột KHÔNG đáng đánh index trong bảng orders (cột ít lọc, cột ghi nhiều đọc ít) và lý do."
    ],
    commonMistakes: [
      { symptom: "Đánh index mọi cột 'cho chắc'.", cause: "Không hiểu chi phí đường ghi.", fix: "Chỉ index cột thực sự xuất hiện trong WHERE/JOIN/ORDER BY của truy vấn nóng." },
      { symptom: "Có index trên name nhưng WHERE name LIKE '%hugo%' vẫn chậm.", cause: "LIKE bắt đầu bằng % không dùng được B-Tree index.", fix: "Tìm kiếm chứa-chuỗi cần FULLTEXT index hoặc search engine chuyên dụng." },
      { symptom: "Không biết truy vấn có dùng index hay không.", cause: "Đoán mò thay vì đo.", fix: "Tập phản xạ EXPLAIN trước mọi truy vấn chậm — nhìn type và key." }
    ],
    challenge: "Cho truy vấn SELECT * FROM orders WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC — thiết kế composite index tối ưu và giải thích thứ tự cột.",
    checklist: [
      "Viết được CREATE INDEX và UNIQUE INDEX",
      "Đọc hiểu type ALL vs ref trong EXPLAIN",
      "Kể được 2 cái giá của việc lạm dụng index"
    ],
    tasks: ["Viết CREATE INDEX trên products(category) và kiểm chứng bằng EXPLAIN SELECT."],
    starterCode: `-- BÀI 42: Database Indexing
-- TODO 1: CREATE INDEX idx_products_category ON products(category);
-- TODO 2: EXPLAIN SELECT * FROM products WHERE category = 'electronics';
-- TODO 3: CREATE UNIQUE INDEX cho users(email)
-- TODO 4: chú thích 2 cột KHÔNG đáng index và lý do
`,
    verify: (code) => {
      const c = code.toUpperCase().replace(/\s+/g, " ");
      return c.includes("CREATE INDEX") && c.includes("ON PRODUCTS") && c.includes("EXPLAIN") && c.includes("UNIQUE INDEX");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Đánh QUÁ NHIỀU index trên một bảng gây tác hại gì?",
      snippet: "10 INDEX trên bảng orders...",
      options: [
        { text: "SELECT chậm đi", correct: false },
        { text: "INSERT/UPDATE/DELETE chậm đi vì phải cập nhật mọi index", correct: true },
        { text: "Mất dữ liệu", correct: false },
        { text: "Không có tác hại", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Index của database dựa trên cấu trúc nào?", o: ["Mảng thường", "B-Tree — họ hàng của binary search", "Stack", "Chuỗi"], a: 1 },
      { q: "Lệnh nào soi kế hoạch thực thi truy vấn?", o: ["SHOW", "EXPLAIN", "DESCRIBE PLAN", "TRACE"], a: 1 },
      { q: "Cột nào đáng đánh index nhất?", o: ["Cột ghi chú tự do", "Cột xuất hiện trong WHERE/JOIN của truy vấn chạy thường xuyên", "Mọi cột", "Cột mới thêm"], a: 1 },
      { q: "UNIQUE INDEX trên email có 2 công dụng nào?", o: ["Nén + mã hóa", "Tra cứu nhanh + chặn giá trị trùng lặp", "Backup + restore", "Sắp xếp + nhóm"], a: 1 }
    ]
  },
  {
    id: "lesson43",
    title: "43. CSDL nâng cao: Chiến lược Caching toàn diện",
    lang: "javascript",
    file: "src/lesson43.js",
    duration: "50 phút",
    overview: {
      description: "Đọc 1000 lần, đổi 1 lần — thì đừng hỏi database 1000 lần: cache nhiều tầng, chiến lược TTL và bài toán khó nhất ngành: vô hiệu hóa cache.",
      outcomes: [
        "Cài cache-aside pattern: hỏi cache trước, trượt mới hỏi nguồn",
        "Thêm TTL (thời gian sống) cho dữ liệu cache",
        "Kể các tầng cache: trình duyệt → CDN → ứng dụng → Redis → DB"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Cache** — bản sao dữ liệu đọc-nhiều-đổi-ít đặt ở nơi truy xuất nhanh hơn nguồn gốc. Khuôn phổ biến nhất — **cache-aside**:

\`\`\`javascript
const cache = new Map();
async function getCachedData(url, ttlMs = 60000) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;   // cache hit
  const data = await (await fetch(url)).json();               // cache miss
  cache.set(url, { data, at: Date.now() });
  return data;
}
\`\`\`

> **TTL** (time-to-live): dữ liệu cache có hạn dùng — hết hạn tự coi như miss. Chọn TTL = mức 'cũ' chấp nhận được (bảng giá: phút; tỷ giá: giây).
> Câu nói kinh điển ngành (Phil Karlton): *"Chỉ có hai bài toán khó: vô hiệu hóa cache và đặt tên."* — khi dữ liệu nguồn ĐỔI, phải xoá/ghi đè cache tương ứng, nếu không người dùng thấy đồ cũ.`,
    labSteps: [
      "Mở src/lesson43.js — nâng cấp dần một hàm cache.",
      "Bản 1: cache-aside cơ bản với Map — has/get/set như khuôn.",
      "Bản 2: thêm TTL — lưu kèm timestamp, quá hạn coi như miss.",
      "Viết invalidate(url) xoá một khóa — gọi nó ngay sau thao tác cập nhật dữ liệu nguồn.",
      "Đếm hit/miss bằng 2 biến, gọi 5 lần cùng url và in tỷ lệ.",
      "Chú thích: vẽ chuỗi tầng cache từ trình duyệt đến DB."
    ],
    commonMistakes: [
      { symptom: "Người dùng đổi tên xong vẫn thấy tên cũ cả giờ.", cause: "Cập nhật DB nhưng quên vô hiệu cache.", fix: "Mọi đường ghi phải kèm invalidate/ghi đè khóa cache liên quan." },
      { symptom: "Cache số dư ví tiền cho 'nhanh'.", cause: "Cache nhầm dữ liệu yêu cầu chính xác tức thời.", fix: "Dữ liệu giao dịch/không được cũ → đọc thẳng nguồn, đừng cache." },
      { symptom: "Map cache phình vô hạn làm tràn bộ nhớ.", cause: "Không giới hạn kích thước, không dọn khóa hết hạn.", fix: "Đặt max size + chính sách loại bỏ (LRU) hoặc dọn định kỳ." }
    ],
    challenge: "Nâng cấp thành LRU cache: giới hạn 100 khóa, đầy thì loại khóa lâu không dùng nhất (gợi ý: Map giữ thứ tự chèn — delete rồi set lại khi truy cập).",
    checklist: [
      "Thuộc khuôn cache-aside: hit trả ngay, miss hỏi nguồn rồi set",
      "Cache nào cũng có TTL hoặc đường vô hiệu hóa",
      "Nói được loại dữ liệu KHÔNG được cache"
    ],
    tasks: ["Viết getCachedData có Map + TTL + hàm invalidate, đếm hit/miss."],
    starterCode: `// BÀI 43: Cache-aside + TTL
const cache = new Map();
// TODO 1: getCachedData(url, ttlMs) — hit trong hạn trả ngay, miss thì fetch + set {data, at}
// TODO 2: invalidate(url) — xoá khóa khi dữ liệu nguồn thay đổi
// TODO 3: đếm hit/miss qua 5 lần gọi
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("cache.get(") && c.includes("cache.set(") && c.includes("date.now()") && c.includes("invalidate") && c.includes("cache.delete(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Loại dữ liệu nào phù hợp nhất để đưa vào cache?",
      snippet: "cache.set(key, [ ??? ])",
      options: [
        { text: "Số dư ví đang giao dịch", correct: false },
        { text: "Dữ liệu đọc thường xuyên nhưng ít thay đổi (bảng giá, danh mục)", correct: true },
        { text: "Mật khẩu người dùng", correct: false },
        { text: "Mã OTP", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Cache hit nghĩa là gì?", o: ["Cache bị đầy", "Tìm thấy dữ liệu hợp lệ trong cache, khỏi hỏi nguồn", "Cache bị xoá", "Dữ liệu sai"], a: 1 },
      { q: "TTL của cache là gì?", o: ["Kích thước tối đa", "Thời gian sống — quá hạn coi như miss", "Tốc độ đọc", "Số lần truy cập"], a: 1 },
      { q: "Khi dữ liệu nguồn thay đổi, cache phải làm gì?", o: ["Không cần gì", "Vô hiệu hóa/ghi đè khóa liên quan", "Tăng TTL", "Đổi tên khóa"], a: 1 },
      { q: "Hai bài toán khó nhất ngành theo câu nói kinh điển?", o: ["Sort và search", "Vô hiệu hóa cache và đặt tên", "CSS và JS", "Deploy và backup"], a: 1 }
    ]
  },
  {
    id: "lesson44",
    title: "44. SEO nâng cao: Sitemaps, Robots.txt & Structured Data",
    lang: "html",
    file: "src/lesson44.html",
    duration: "45 phút",
    overview: {
      description: "Bộ ba giao tiếp với robot tìm kiếm: sitemap khai báo mọi trang, robots.txt phân luồng thu thập, JSON-LD giúp Google hiện kết quả 'xịn' có sao, giá, ảnh.",
      outcomes: [
        "Viết sitemap.xml và robots.txt đúng cú pháp",
        "Nhúng Structured Data JSON-LD theo schema.org",
        "Phân biệt vai trò: sitemap khai báo — robots điều hướng — schema mô tả"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **sitemap.xml** — danh mục URL của site để robot lập chỉ mục đầy đủ: \`<urlset><url><loc>https://...</loc></url></urlset>\`
> **robots.txt** (đặt ở gốc domain) — luật cho robot: \`User-agent: *\`, \`Disallow: /admin/\`, \`Sitemap: https://.../sitemap.xml\`. Lưu ý: đây là 'biển báo', KHÔNG phải bảo mật.
> **Structured Data (JSON-LD, schema.org)** — mô tả máy-đọc-được nhúng trong thẻ script, giúp Google hiện rich snippets (sao đánh giá, giá, tồn kho):

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Khóa học HugoCoder",
  "offers": { "@type": "Offer", "price": "1500", "priceCurrency": "VND" }
}
</script>
\`\`\``,
    labSteps: [
      "Mở src/lesson44.html — trang sản phẩm cần đủ bộ ba.",
      "Nhúng khối <script type=\"application/ld+json\"> mô tả Product theo khuôn (@context, @type, name, offers).",
      "Viết nội dung robots.txt trong một khối <pre> minh họa: chặn /admin/, khai báo đường dẫn Sitemap.",
      "Viết khung sitemap.xml trong khối <pre> thứ hai: 3 URL chính của site.",
      "Chú thích: vì sao Disallow /admin/ KHÔNG thay được đăng nhập (robots chỉ là biển báo tự nguyện)."
    ],
    commonMistakes: [
      { symptom: "Giấu trang nhạy cảm bằng robots.txt và yên tâm.", cause: "Nhầm biển báo với hàng rào — robots.txt còn chỉ điểm cho kẻ tò mò.", fix: "Trang nhạy cảm phải chặn bằng xác thực; robots chỉ để điều phối crawl." },
      { symptom: "JSON-LD sai một dấu phẩy — Google bỏ qua toàn bộ.", cause: "JSON không hợp lệ.", fix: "Kiểm tra bằng công cụ Rich Results Test của Google trước khi deploy." },
      { symptom: "Khai giá trong schema khác giá hiển thị trên trang.", cause: "Cập nhật giá quên cập nhật schema.", fix: "Schema phải khớp nội dung thật — lệch là có thể bị phạt thứ hạng." }
    ],
    challenge: "Viết thêm khối JSON-LD @type: FAQPage cho 2 câu hỏi thường gặp của khóa học — dạng schema hay được hiện to nhất trên Google.",
    checklist: [
      "Phân biệt rành mạch vai trò bộ ba sitemap/robots/schema",
      "JSON-LD viết ra dán vào validator không lỗi",
      "Thuộc câu: robots.txt là biển báo, không phải bảo mật"
    ],
    tasks: ["Nhúng JSON-LD @type Product và minh họa robots.txt (Disallow, Sitemap) + khung sitemap.xml."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bài 44: SEO kỹ thuật</title>
  <!-- TODO 1: script type="application/ld+json" — @type Product + offers -->
</head>
<body>
  <h1>Khóa học HugoCoder</h1>
  <h2>robots.txt mẫu</h2>
  <pre><!-- TODO 2: User-agent, Disallow /admin/, Sitemap: ... --></pre>
  <h2>sitemap.xml mẫu</h2>
  <pre><!-- TODO 3: urlset với 3 url/loc --></pre>
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('type="application/ld+json"') && c.includes('"@type":"product"') && c.includes("user-agent") && c.includes("disallow") && c.includes("<urlset") && c.includes("<loc>");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "JSON-LD Structured Data giúp Google làm gì?",
      snippet: "<script type=\"application/ld+json\">{ \"@type\": \"Product\", ... }</script>",
      options: [
        { text: "Tăng tốc độ tải trang", correct: false },
        { text: "Hiển thị rich snippets (sao, giá, ảnh) trên kết quả tìm kiếm", correct: true },
        { text: "Chặn robot xấu", correct: false },
        { text: "Mã hóa nội dung", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "File robots.txt đặt ở đâu?", o: ["Thư mục bất kỳ", "Gốc domain (/robots.txt)", "Trong <head>", "Trong sitemap"], a: 1 },
      { q: "robots.txt có phải công cụ bảo mật không?", o: ["Có, chặn tuyệt đối", "Không — chỉ là biển báo tự nguyện cho robot", "Có nếu dùng HTTPS", "Chỉ trên Google"], a: 1 },
      { q: "sitemap.xml dùng để làm gì?", o: ["Trang trí", "Khai báo danh mục URL cho robot lập chỉ mục đầy đủ", "Chặn crawl", "Đo tốc độ"], a: 1 },
      { q: "Schema.org JSON-LD được nhúng bằng thẻ nào?", o: ["<meta>", "<script type=\"application/ld+json\">", "<link>", "<data>"], a: 1 }
    ]
  },
  {
    id: "lesson45",
    title: "45. Chiến lược dựng trang tối ưu SEO: SSR vs SSG vs SPA",
    lang: "html",
    file: "src/lesson45.html",
    duration: "45 phút",
    overview: {
      description: "Ba cách sinh ra HTML và bài toán chọn đúng: SPA mượt cho app, SSR tươi cho nội dung động, SSG thần tốc cho nội dung tĩnh — quyết định ảnh hưởng cả SEO lẫn chi phí server.",
      outcomes: [
        "Trình bày cơ chế + ưu nhược của SPA, SSR, SSG",
        "Chọn đúng chiến lược cho từng loại trang cụ thể",
        "Hiểu hydration: HTML tĩnh 'sống dậy' thành app tương tác"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
> **SPA** (Single Page Application) — server trả khung rỗng, JS vẽ tất cả ở client. Chuyển trang mượt như app; nhưng tải đầu chậm, SEO phụ thuộc khả năng chạy JS của bot.
> **SSR** (Server-Side Rendering) — server dựng HTML hoàn chỉnh cho TỪNG request. Bot thấy nội dung ngay, dữ liệu luôn tươi; đổi lại server tốn công mỗi lượt truy cập.
> **SSG** (Static Site Generation) — dựng sẵn toàn bộ HTML lúc BUILD, deploy như file tĩnh/CDN. Nhanh nhất, rẻ nhất, SEO đẹp nhất; nhược: nội dung đổi phải build lại.

**Hydration**: với SSR/SSG, JS tải xong sẽ 'gắn hồn' vào HTML tĩnh — nút bấm bắt đầu hoạt động. Thực tế thường lai: trang marketing SSG + khu dashboard SPA.`,
    labSteps: [
      "Mở src/lesson45.html — dựng 'bảng quyết định' của kiến trúc sư.",
      "Dựng bảng 3 cột SPA/SSR/SSG × 4 hàng: HTML sinh ở đâu/lúc nào — tải đầu — SEO — chi phí server.",
      "Dưới bảng: 4 tình huống chọn chiến lược: blog công ty (SSG), sàn tin tức realtime (SSR), dashboard nội bộ (SPA), trang docs (SSG) — mỗi câu kèm 1 dòng lý do.",
      "Viết đoạn giải thích hydration bằng lời của bạn (2-3 câu).",
      "Tự kiểm: nhìn 1 website bạn hay dùng, đoán nó thuộc chiến lược nào và vì sao."
    ],
    commonMistakes: [
      { symptom: "Làm blog giới thiệu công ty bằng SPA thuần, Google index chậm/sót.", cause: "Chọn SPA cho nội dung cần SEO.", fix: "Nội dung công khai cần SEO → SSG/SSR; SPA để sau đăng nhập." },
      { symptom: "SSR mọi trang kể cả trang giá tĩnh, server è cổ.", cause: "Không tận dụng SSG cho nội dung ít đổi.", fix: "Ít đổi → build sẵn (SSG); đổi từng giây mới cần SSR." },
      { symptom: "Trang SSG hiện nội dung nhưng bấm nút không phản ứng trong 2 giây đầu.", cause: "Chưa hydrate xong — JS còn đang tải.", fix: "Bình thường của mô hình; giảm JS bundle để hydrate nhanh hơn (bài 41)." }
    ],
    challenge: "Thiết kế kiến trúc cho 'trang bán khóa học HugoCoder': liệt kê 5 loại trang của site và gán chiến lược render + lý do từng loại.",
    checklist: [
      "Kể đúng cơ chế 3 mô hình không nhìn bảng",
      "Gán đúng chiến lược cho 4 tình huống trong bài",
      "Giải thích được hydration trong 1 câu"
    ],
    tasks: ["Dựng bảng so sánh SPA/SSR/SSG và 4 tình huống chọn chiến lược kèm lý do."],
    starterCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Bài 45: SPA vs SSR vs SSG</title>
</head>
<body>
  <h1>Bảng quyết định chiến lược render</h1>
  <!-- TODO 1: table so sánh SPA / SSR / SSG (HTML sinh ở đâu, tải đầu, SEO, chi phí) -->
  <!-- TODO 2: 4 tình huống chọn chiến lược + lý do -->
  <!-- TODO 3: đoạn giải thích hydration -->
</body>
</html>`,
    verify: (code) => {
      const c = code.toLowerCase();
      return c.includes("<table") && c.includes("spa") && c.includes("ssr") && c.includes("ssg") && c.includes("hydration");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Blog nội dung ít thay đổi, cần SEO tốt và tải cực nhanh — chọn chiến lược nào?",
      snippet: "blog.hugo.vn — 200 bài viết, cập nhật 1 lần/tuần",
      options: [
        { text: "SPA", correct: false },
        { text: "SSR", correct: false },
        { text: "SSG — dựng sẵn HTML lúc build, phục vụ tĩnh qua CDN", correct: true },
        { text: "iframe", correct: false }
      ],
      correctIdx: 2
    },
    miniQuiz: [
      { q: "SSR sinh HTML khi nào?", o: ["Lúc build", "Tại server cho TỪNG request", "Tại client", "Không sinh HTML"], a: 1 },
      { q: "Nhược điểm chính của SPA thuần với SEO?", o: ["Không có nhược điểm", "Server trả khung rỗng, bot phải chạy JS mới thấy nội dung", "HTML quá nặng", "Không dùng được CSS"], a: 1 },
      { q: "Hydration là gì?", o: ["Nén HTML", "JS gắn tính tương tác vào HTML tĩnh đã render sẵn", "Tưới dữ liệu vào DB", "Cache CDN"], a: 1 },
      { q: "Dashboard nội bộ sau đăng nhập hợp với mô hình nào?", o: ["SSG", "SPA — không cần SEO, ưu tiên chuyển trang mượt", "SSR bắt buộc", "robots.txt"], a: 1 }
    ]
  },
  {
    id: "lesson46",
    title: "46. PWA: Service Workers & Vòng đời ứng dụng",
    lang: "javascript",
    file: "src/lesson46.js",
    duration: "50 phút",
    overview: {
      description: "Nhân viên gác cổng chạy ngầm giữa web và mạng: Service Worker — nền tảng biến website thành ứng dụng cài được, chạy offline được.",
      outcomes: [
        "Đăng ký Service Worker và mô tả 3 pha: install → activate → fetch",
        "Viết listener install/activate với skipWaiting/clients.claim",
        "Hiểu vì sao SW yêu cầu HTTPS và cập nhật theo từng byte file"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Service Worker** — script chạy ở luồng nền RIÊNG, độc lập với tab, đóng vai proxy giữa trang và mạng. Chỉ chạy trên HTTPS (hoặc localhost).

Vòng đời 3 pha:
> **install** — tải về lần đầu/khi file đổi: nơi cache sẵn tài nguyên.
> **activate** — tiếp quản: nơi dọn cache phiên bản cũ.
> **fetch** — từ đây mọi request của trang đi qua tay SW (bài 47).

\`\`\`javascript
// sw.js
self.addEventListener("install", (event) => {
  self.skipWaiting();               // kích hoạt ngay, khỏi chờ tab cũ đóng
});
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim()); // tiếp quản các tab đang mở
});
// Trang chính đăng ký:
navigator.serviceWorker.register("/sw.js");
\`\`\`
Trình duyệt so từng byte file sw.js — chỉ cần khác 1 byte là chạy lại chu trình install/activate: cơ chế cập nhật phiên bản của PWA.`,
    labSteps: [
      "Mở src/lesson46.js — viết nội dung file sw.js.",
      "Listener install: console.log('SW đang cài đặt') + self.skipWaiting().",
      "Listener activate: console.log('SW đã kích hoạt') + event.waitUntil(clients.claim()).",
      "Viết khối đăng ký từ trang chính: if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').",
      "Chú thích: mô tả bằng lời chuyện gì xảy ra khi bạn sửa 1 dòng sw.js và deploy."
    ],
    commonMistakes: [
      { symptom: "SW không đăng ký được trên trang http:// của công ty.", cause: "SW yêu cầu secure context.", fix: "Chỉ chạy trên HTTPS hoặc localhost khi dev." },
      { symptom: "Sửa code SW, deploy rồi mà người dùng vẫn chạy bản cũ.", cause: "SW mới ở trạng thái waiting chờ mọi tab cũ đóng.", fix: "skipWaiting trong install + clients.claim trong activate (đúng khuôn bài này)." },
      { symptom: "Đăng ký sw.js trong thư mục /js/ nhưng không chặn được request trang chủ.", cause: "Scope của SW giới hạn theo thư mục chứa file.", fix: "Đặt sw.js ở gốc site để scope phủ toàn bộ." }
    ],
    challenge: "Thêm phiên bản: const VERSION = 'v2'; log VERSION ở cả install lẫn activate — deploy thử 2 lần đổi VERSION và quan sát chu trình cập nhật trong DevTools → Application → Service Workers.",
    checklist: [
      "Kể đúng 3 pha vòng đời và việc làm ở từng pha",
      "Thuộc cặp skipWaiting + clients.claim và tác dụng",
      "Nói được vì sao SW bắt buộc HTTPS"
    ],
    tasks: ["Viết listener install (skipWaiting) + activate (clients.claim) và khối đăng ký navigator.serviceWorker.register."],
    starterCode: `// BÀI 46: Service Worker — vòng đời
// TODO 1: self.addEventListener("install", ...) + self.skipWaiting()
// TODO 2: self.addEventListener("activate", ...) + event.waitUntil(clients.claim())
// TODO 3: khối đăng ký: navigator.serviceWorker.register("/sw.js")
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('addeventlistener("install"') && c.includes('addeventlistener("activate"') && c.includes("skipwaiting()") && c.includes("serviceworker.register(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Service Worker chạy ở đâu?",
      snippet: "navigator.serviceWorker.register('/sw.js')",
      options: [
        { text: "Cùng luồng với giao diện trang", correct: false },
        { text: "Luồng nền riêng, độc lập với tab", correct: true },
        { text: "Trên server backend", correct: false },
        { text: "Trong database", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Thứ tự vòng đời Service Worker?", o: ["fetch → install → activate", "install → activate → fetch", "activate → install → fetch", "Ngẫu nhiên"], a: 1 },
      { q: "self.skipWaiting() làm gì?", o: ["Bỏ qua cache", "SW mới kích hoạt ngay, không chờ tab cũ đóng", "Tắt SW", "Xoá dữ liệu"], a: 1 },
      { q: "SW yêu cầu môi trường nào?", o: ["HTTP thường", "HTTPS (hoặc localhost khi dev)", "Chỉ app mobile", "FTP"], a: 1 },
      { q: "Trình duyệt phát hiện SW có bản mới bằng cách nào?", o: ["Hỏi người dùng", "So từng byte file sw.js — khác là chạy lại install", "Theo ngày", "Không bao giờ cập nhật"], a: 1 }
    ]
  },
  {
    id: "lesson47",
    title: "47. PWA: Chiến lược Cache dữ liệu ngoại tuyến (Offline)",
    lang: "javascript",
    file: "src/lesson47.js",
    duration: "50 phút",
    overview: {
      description: "Mất mạng vẫn mở được app: bắt sự kiện fetch trong Service Worker và chọn đúng chiến lược Cache-First hay Network-First cho từng loại tài nguyên.",
      outcomes: [
        "Dùng Cache Storage API: caches.open, cache.addAll, caches.match",
        "Cài Cache-First cho tài nguyên tĩnh, Network-First cho dữ liệu động",
        "Chọn đúng chiến lược theo bảng loại tài nguyên"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Trong pha **install**, cache sẵn 'bộ vỏ' app (app shell); trong pha **fetch**, ra quyết định cho từng request:

> **Cache-First** — tra cache trước, trượt mới ra mạng: cho font, logo, CSS/JS đã băm tên. Nhanh nhất, chấp nhận 'cũ'.
> **Network-First** — thử mạng trước, lỗi mới lấy cache: cho API dữ liệu động. Luôn tươi khi có mạng, vẫn sống khi mất mạng.

\`\`\`javascript
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open("shell-v1").then((c) => c.addAll(["/", "/app.css"])));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))  // Cache-First
  );
});
\`\`\`
Network-First đảo thứ tự: \`fetch(e.request).catch(() => caches.match(e.request))\`.`,
    labSteps: [
      "Mở src/lesson47.js — hoàn thiện sw.js từ bài 46.",
      "install: caches.open('shell-v1') + cache.addAll(['/', '/app.css', '/logo.png']) bọc trong event.waitUntil.",
      "fetch: cài Cache-First theo khuôn caches.match(...).then(hit => hit || fetch(...)).",
      "Viết nhánh Network-First cho URL chứa '/api/': fetch trước, .catch trả caches.match.",
      "Chú thích bảng chọn: font/logo → Cache-First; /api/wallet → Network-First; /api/chat → không cache.",
      "Kiểm thử: DevTools → Network → Offline, tải lại trang — app shell vẫn hiện."
    ],
    commonMistakes: [
      { symptom: "Số dư ví hiển thị số cũ dù đã nạp tiền.", cause: "Cache-First áp cho API dữ liệu động.", fix: "API động dùng Network-First; dữ liệu tiền bạc cân nhắc không cache." },
      { symptom: "Deploy CSS mới, người dùng vẫn thấy giao diện cũ vĩnh viễn.", cause: "Cache-First với tên cache không đổi phiên bản, không dọn cache cũ.", fix: "Đổi tên cache theo phiên bản (shell-v2) + xoá cache cũ trong activate." },
      { symptom: "respondWith báo lỗi 'already responded'.", cause: "Gọi respondWith hai lần hoặc ngoài luồng sự kiện.", fix: "Mỗi fetch event chỉ MỘT respondWith bao trọn logic chọn nguồn." }
    ],
    challenge: "Cài chiến lược thứ ba stale-while-revalidate: trả cache ngay lập tức ĐỒNG THỜI fetch bản mới cập nhật cache cho lần sau.",
    checklist: [
      "Thuộc hai khuôn Cache-First và Network-First",
      "Đã test chế độ Offline trong DevTools",
      "Gán đúng chiến lược cho 4 loại tài nguyên bất kỳ"
    ],
    tasks: ["Cài install cache app shell (addAll) và fetch với Cache-First + nhánh Network-First cho /api/."],
    starterCode: `// BÀI 47: Chiến lược cache offline
// TODO 1: install — caches.open("shell-v1") + addAll(["/", "/app.css", "/logo.png"])
// TODO 2: fetch — Cache-First: caches.match(...) || fetch(...)
// TODO 3: nhánh Network-First cho url chứa "/api/": fetch().catch(() => caches.match())
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("caches.open(") && c.includes("addall(") && c.includes("caches.match(") && c.includes("respondwith(") && c.includes(".catch(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Dữ liệu SỐ DƯ VÍ thay đổi liên tục nên dùng chiến lược cache nào?",
      snippet: "GET /api/wallet/balance",
      options: [
        { text: "Cache-First", correct: false },
        { text: "Network-First (mạng trước, lỗi mới lấy cache)", correct: true },
        { text: "Chỉ đọc cache", correct: false },
        { text: "Cache vĩnh viễn", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Cache-First hợp với loại tài nguyên nào?", o: ["API giao dịch", "Tĩnh ít đổi: font, logo, CSS đã băm tên", "Tin nhắn chat", "Tỷ giá"], a: 1 },
      { q: "API nào của SW dùng để tra cache theo request?", o: ["cache.query", "caches.match", "cache.find", "storage.get"], a: 1 },
      { q: "App shell là gì?", o: ["Vỏ điện thoại", "Bộ khung tối thiểu của app được cache sẵn để mở tức thời", "Terminal", "Database"], a: 1 },
      { q: "Dọn cache phiên bản cũ nên làm ở pha nào?", o: ["install", "activate", "fetch", "close"], a: 1 }
    ]
  },
  {
    id: "lesson48",
    title: "48. PWA: Cấu hình Web App Manifest hoàn chỉnh",
    lang: "json",
    file: "src/manifest.json",
    duration: "40 phút",
    overview: {
      description: "Tấm giấy khai sinh của PWA: manifest.json quyết định tên, icon, màu sắc và tư thế mở app khi người dùng bấm 'Thêm vào màn hình chính'.",
      outcomes: [
        "Viết manifest đủ trường bắt buộc: name, icons, start_url, display",
        "Chọn đúng display mode: standalone cho trải nghiệm như app bản địa",
        "Nắm điều kiện hiện nút cài đặt: HTTPS + manifest + Service Worker"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Web App Manifest** (chuẩn W3C) — file JSON khai báo danh tính app, liên kết bằng \`<link rel="manifest" href="/manifest.json">\`:

\`\`\`json
{
  "name": "HugoCoder Learning IDE",
  "short_name": "HugoCoder",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`

> **display**: \`standalone\` — ẩn thanh địa chỉ, mở như app bản địa (chuẩn PWA); \`fullscreen\` — che cả thanh trạng thái (game); \`browser\` — như tab thường.
> Điều kiện trình duyệt mời cài đặt: **HTTPS + manifest hợp lệ (đủ icon 192 & 512) + có Service Worker**.`,
    labSteps: [
      "Mở src/manifest.json — viết từ đầu theo khuôn.",
      "Khai name (tên đầy đủ) và short_name (dưới 12 ký tự — hiện dưới icon màn hình chính).",
      "start_url: \"/\" và display: \"standalone\".",
      "theme_color (màu thanh hệ thống) + background_color (màu màn hình chờ khởi động).",
      "Mảng icons đủ 2 cỡ 192x192 và 512x512.",
      "Kiểm tra: DevTools → Application → Manifest — mục nào báo đỏ là thiếu."
    ],
    commonMistakes: [
      { symptom: "Không thấy nút 'Cài đặt ứng dụng' xuất hiện.", cause: "Thiếu một trong bộ ba: HTTPS, icon đủ cỡ, Service Worker.", fix: "Soát DevTools → Application → Manifest: sửa mọi cảnh báo, đủ icon 192+512." },
      { symptom: "JSON có dấu phẩy thừa sau phần tử cuối — manifest chết lặng lẽ.", cause: "JSON không cho phép trailing comma (khác JS).", fix: "Xoá dấu phẩy cuối; validate JSON trước khi deploy." },
      { symptom: "Cài xong mở app lại thấy thanh địa chỉ trình duyệt.", cause: "display đang là browser/minimal-ui.", fix: "Đổi display: \"standalone\"." }
    ],
    challenge: "Thêm trường shortcuts: 2 lối tắt (Bài học hôm nay, Ví JOY) hiện khi nhấn giữ icon app trên Android.",
    checklist: [
      "Manifest qua validator không còn cảnh báo",
      "Thuộc bộ 3 điều kiện hiện nút cài đặt",
      "Phân biệt standalone / fullscreen / browser"
    ],
    tasks: ["Viết manifest.json đủ: name, short_name, start_url, display standalone, theme_color, icons 192+512."],
    starterCode: `{
  "_comment": "BÀI 48: TODO — name, short_name, start_url, display standalone, background_color, theme_color, icons 192 & 512"
}`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes('"display":"standalone"') && c.includes('"start_url"') && c.includes('"short_name"') && c.includes("192x192") && c.includes("512x512");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Giá trị display nào ẨN thanh địa chỉ, mở web như app bản địa?",
      snippet: "{ \"display\": \"[ ... ]\" }",
      options: [
        { text: "browser", correct: false },
        { text: "minimal-ui", correct: false },
        { text: "standalone", correct: true },
        { text: "native", correct: false }
      ],
      correctIdx: 2
    },
    miniQuiz: [
      { q: "Manifest liên kết vào trang bằng thẻ nào?", o: ["<script>", "<link rel=\"manifest\">", "<meta manifest>", "<app>"], a: 1 },
      { q: "Bộ 3 điều kiện để trình duyệt mời cài PWA?", o: ["Tên miền .app + logo + CSS", "HTTPS + manifest hợp lệ + Service Worker", "React + Vite + Node", "Đăng ký store"], a: 1 },
      { q: "short_name hiển thị ở đâu?", o: ["Tab trình duyệt", "Dưới icon trên màn hình chính", "Trong footer", "Trên URL"], a: 1 },
      { q: "background_color trong manifest dùng cho gì?", o: ["Nền mọi trang", "Màu màn hình chờ lúc khởi động app", "Màu chữ", "Màu viền"], a: 1 }
    ]
  },
  {
    id: "lesson49",
    title: "49. Kiểm thử: Unit Test & Quy trình Manual Test",
    lang: "javascript",
    file: "src/lesson49.test.js",
    duration: "50 phút",
    overview: {
      description: "Lá chắn cho mọi lần refactor: viết unit test theo khuôn AAA với describe/test/expect, phủ cả ca biên — và quy trình kiểm thử thủ công có kịch bản.",
      outcomes: [
        "Viết unit test khuôn Jest/Vitest: describe, test, expect().toBe()",
        "Áp mô hình AAA: Arrange – Act – Assert",
        "Thiết kế ca kiểm thử biên (edge case): 0, số âm, rỗng, null"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
**Unit Test** kiểm tra từng hàm nhỏ độc lập với đầu vào định sẵn. Khuôn **Jest/Vitest**:

\`\`\`javascript
import { describe, test, expect } from "vitest";
import { calcTotal } from "./fees.js";

describe("calcTotal — phí giao dịch 10%", () => {
  test("cộng đúng 10% phí", () => {
    // Arrange (chuẩn bị) — Act (hành động) — Assert (khẳng định)
    expect(calcTotal(1000)).toBe(1100);
  });
  test("ca biên: 0 JOY", () => expect(calcTotal(0)).toBe(0));
  test("số âm phải ném lỗi", () => expect(() => calcTotal(-5)).toThrow());
});
\`\`\`

Giá trị thật của test lộ ra khi **refactor**: sửa xong chạy lại bộ test — xanh là yên tâm, đỏ là bắt được bug TRƯỚC người dùng. Test tốt phủ ca biên: 0, âm, rỗng, null, cực lớn.

**Manual test** bổ trợ phần máy khó thấy: theo KỊCH BẢN viết sẵn (bước — kỳ vọng — kết quả), đóng vai người dùng mới trên luồng chính.`,
    labSteps: [
      "Mở src/lesson49.test.js — viết hàm calcTotal(amount) (phí 10%, làm tròn lên, âm thì throw) ngay đầu file.",
      "Viết describe bọc nhóm test cho calcTotal.",
      "Test 1 — đường vui: calcTotal(1000) toBe 1100, chú thích 3 chữ A vào 3 phần.",
      "Test 2 — ca biên: calcTotal(0) toBe 0.",
      "Test 3 — ca lỗi: expect(() => calcTotal(-5)).toThrow().",
      "Cuối file: viết kịch bản manual test 4 bước cho luồng 'đăng nhập rồi nạp JOY' dạng chú thích bảng."
    ],
    commonMistakes: [
      { symptom: "Test chỉ có ca đẹp, bug toàn nằm ở ca biên.", cause: "Chỉ test giá trị 'bình thường'.", fix: "Mỗi hàm tối thiểu: 1 ca đẹp + 1 ca biên + 1 ca lỗi." },
      { symptom: "Test hàm ném lỗi viết expect(calcTotal(-5)).toThrow() — nổ ngay khi chạy.", cause: "Gọi hàm trực tiếp thay vì bọc trong hàm.", fix: "Bọc arrow: expect(() => calcTotal(-5)).toThrow()." },
      { symptom: "Một test khẳng định 10 thứ, fail không biết vỡ chỗ nào.", cause: "Nhồi nhiều hành vi vào một test.", fix: "Mỗi test một hành vi, tên test mô tả đúng hành vi đó." }
    ],
    challenge: "Viết hàm validateEmail(email) rồi phủ 5 test: hợp lệ, thiếu @, rỗng, null, có khoảng trắng — chạy toàn bộ xanh.",
    checklist: [
      "Thuộc khuôn describe/test/expect và mô hình AAA",
      "Bộ test có đủ ca đẹp + ca biên + ca lỗi",
      "Viết được kịch bản manual test có kỳ vọng rõ ràng"
    ],
    tasks: ["Viết calcTotal + 3 test (đường vui, ca biên 0, ca lỗi toThrow) theo khuôn describe/test/expect."],
    starterCode: `// BÀI 49: Unit Test khuôn Vitest/Jest
// TODO 1: calcTotal(amount) — phí 10% làm tròn lên; amount < 0 thì throw
// TODO 2: describe("calcTotal", ...) — 3 test: 1000->1100, 0->0, -5 toThrow
// TODO 3: chú thích kịch bản manual test 4 bước (bước — kỳ vọng)
`,
    verify: (code) => {
      const c = code.toLowerCase().replace(/\s+/g, "");
      return c.includes("describe(") && c.includes("test(") && c.includes("expect(") && c.includes(".tobe(") && c.includes(".tothrow(");
    },
    practiceType: "code_challenge",
    mobilePuzzle: {
      prompt: "Mô hình AAA trong unit test gồm ba bước nào?",
      snippet: "test('cộng đúng phí', () => { /* A? A? A? */ })",
      options: [
        { text: "Ask – Answer – Apply", correct: false },
        { text: "Arrange – Act – Assert", correct: true },
        { text: "Add – Alter – Abort", correct: false },
        { text: "Alpha – Beta – Assert", correct: false }
      ],
      correctIdx: 1
    },
    miniQuiz: [
      { q: "Hàm nào gom nhóm các test liên quan?", o: ["group()", "describe()", "suite()", "batch()"], a: 1 },
      { q: "Giá trị lớn nhất của unit test thể hiện khi nào?", o: ["Lúc viết code mới", "Khi refactor — chạy lại là biết có làm vỡ gì không", "Khi deploy", "Khi viết CSS"], a: 1 },
      { q: "Test hàm ném lỗi phải viết thế nào?", o: ["expect(fn(-5)).toThrow()", "expect(() => fn(-5)).toThrow() — bọc trong hàm", "try/catch thủ công", "Không test được"], a: 1 },
      { q: "Ca kiểm thử biên (edge case) là gì?", o: ["Ca chạy nhanh nhất", "Giá trị ở ranh giới: 0, âm, rỗng, null, cực lớn", "Ca của khách VIP", "Test giao diện"], a: 1 }
    ]
  },
  {
    id: "lesson50",
    title: "50. Kiểm Tra Kiến Trúc Web, Mật mã học & Giải thuật",
    lang: "html",
    file: "src/lesson50.html",
    duration: "25 phút",
    overview: {
      description: "Bài thi tổng kết phần lõi khoa học máy tính: CTDL & giải thuật, Big O, mật mã, bất đồng bộ, hiệu năng, PWA và kiểm thử — đạt 60% để mở Chặng 4.",
      outcomes: [
        "Tự đánh giá phần lõi CS trước khi bước vào chuyên đề bảo mật",
        "Đạt tối thiểu 60% (5/8 câu) để mở khóa Chặng 4"
      ]
    },
    theory: `### KIẾN THỨC CỐT LÕI
Đề thi 8 câu chọn ngẫu nhiên, phạm vi **chỉ gồm Bài 26-49**:
- Cấu trúc dữ liệu: Array, Linked List, Stack, Queue, Hash Table.
- Giải thuật: tìm kiếm, sắp xếp, Big O.
- Mật mã: AES/RSA, hash & salt, bcrypt, encoding, CIA.
- Nền tảng nâng cao: Event Loop, WebSockets, CRP, Web Vitals, memory leak, code splitting, index, cache, SEO kỹ thuật, SSR/SSG, PWA, unit test.

### CÁCH THI
Đạt ≥ 60% mở khóa Chặng 4 — Kỹ sư Bảo mật & Tiền đề AI.`,
    labSteps: [
      "Ôn lại checklist 24 bài của chặng — ưu tiên bài nào checklist chưa tick đủ.",
      "Làm 8 câu cẩn thận.",
      "Chưa đạt: quay về đúng bài hổng, làm lại phần thực hành rồi đổi đề thi lại."
    ],
    commonMistakes: [
      { symptom: "Nhầm lẫn giữa các cặp khái niệm gần nhau (hash vs encrypt, reflow vs repaint).", cause: "Học riêng lẻ không so sánh.", fix: "Ôn theo cặp đối lập: mỗi cặp tự viết 1 câu phân biệt." }
    ],
    challenge: "Đạt 8/8 trong một lần thi.",
    checklist: [
      "Đã ôn theo cặp khái niệm đối lập",
      "Đạt tối thiểu 60% và giải thích được từng câu sai"
    ],
    tasks: ["Hoàn thành bài thi 8 câu trắc nghiệm, đạt tối thiểu 60%."],
    starterCode: ``,
    verify: (code) => true,
    practiceType: "quiz",
    quizSize: 8,
    quizPool: [
      { q: "Truy cập arr[i] trong mảng có độ phức tạp?", o: ["O(n)", "O(1)", "O(log n)", "O(n²)"], a: 1 },
      { q: "Stack hoạt động theo cơ chế nào?", o: ["FIFO", "LIFO", "Ưu tiên", "Ngẫu nhiên"], a: 1 },
      { q: "Binary search yêu cầu điều kiện gì?", o: ["Mảng toàn số dương", "Mảng đã sắp xếp", "Mảng ngắn", "Không yêu cầu"], a: 1 },
      { q: "Độ phức tạp trung bình của Quick Sort?", o: ["O(n²)", "O(n log n)", "O(n)", "O(1)"], a: 1 },
      { q: "Hai vòng for lồng nhau trên n phần tử là?", o: ["O(n)", "O(n²)", "O(2n)", "O(log n)"], a: 1 },
      { q: "Trong HTTPS, AES đảm nhiệm gì?", o: ["Trao khóa", "Mã hóa dữ liệu truyền tải bằng khóa phiên", "Ký chứng chỉ", "Nén dữ liệu"], a: 1 },
      { q: "Salt trong băm mật khẩu để làm gì?", o: ["Tăng tốc", "Vô hiệu Rainbow Table", "Nén hash", "Giải mã lại"], a: 1 },
      { q: "Hàm PHP nào so mật khẩu nhập với hash trong DB?", o: ["password_hash", "password_verify", "hash_check", "bcrypt_cmp"], a: 1 },
      { q: "Base64 có phải mã hóa bảo mật không?", o: ["Có", "Không — chỉ đổi định dạng, decode được ngay", "Có nếu 2 lần", "Tuỳ trình duyệt"], a: 1 },
      { q: "Microtask (Promise) so với setTimeout — ai chạy trước?", o: ["setTimeout", "Promise callback", "Ngẫu nhiên", "Cùng lúc"], a: 1 },
      { q: "DocumentFragment giúp gì cho hiệu năng?", o: ["Nén HTML", "Gom N lần chèn DOM thành 1 lần Reflow", "Cache request", "Chặn XSS"], a: 1 },
      { q: "Ngưỡng CLS tốt theo Google?", o: ["< 2.5", "< 0.1", "< 200", "< 1"], a: 1 },
      { q: "setInterval quên clear gây ra gì?", o: ["Không sao", "Rò rỉ bộ nhớ — chạy ngầm giữ closure mãi", "Tự dừng", "Lỗi cú pháp"], a: 1 },
      { q: "Cache-First hợp với tài nguyên nào?", o: ["API số dư", "Font, logo, file tĩnh ít đổi", "Tin nhắn chat", "OTP"], a: 1 },
      { q: "Service Worker chạy trên môi trường nào?", o: ["HTTP thường", "HTTPS hoặc localhost", "Chỉ app store", "FTP"], a: 1 },
      { q: "Mô hình AAA của unit test là?", o: ["Ask-Act-Assert", "Arrange-Act-Assert", "Add-Act-Apply", "Assert-Act-Arrange"], a: 1 }
    ]
  }
];
