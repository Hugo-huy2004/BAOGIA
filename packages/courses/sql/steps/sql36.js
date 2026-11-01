// Step 36 — JSON trong SQL.
const JSON_SEED = "CREATE TABLE events (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL CHECK (json_valid(payload)));\nINSERT INTO events (kind, payload) VALUES\n('order', '{\"order_id\":1,\"items\":[{\"id\":1,\"qty\":2}],\"device\":{\"os\":\"iOS\",\"app\":\"2.1\"}}'),\n('order', '{\"order_id\":3,\"items\":[{\"id\":3,\"qty\":1},{\"id\":4,\"qty\":1}],\"device\":{\"os\":\"Android\",\"app\":\"2.0\"}}'),\n('feedback', '{\"stars\":5,\"text\":\"Bạc xỉu ngon\",\"device\":{\"os\":\"iOS\",\"app\":\"2.1\"}}'),\n('feedback', '{\"stars\":3,\"text\":\"Hơi ngọt\",\"device\":{\"os\":\"Android\",\"app\":\"2.1\"}}');";

export default {
  id: "sql36",
  lang: "sql",
  file: "hat/json.sql",
  duration: "75 phút",
  summary: "Lưu và truy vấn dữ liệu bán cấu trúc bằng JSON: trích trường với ->>, bung mảng với json_each, tạo JSON từ bảng, và biết khi nào KHÔNG nên dùng JSON.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "App của Hạt gửi về sự kiện có hình dạng khác nhau (đặt món, đánh giá, lỗi). Tạo bảng cho từng loại thì cồng kềnh; lưu **JSON** thì linh hoạt — và SQL hiện đại truy vấn JSON được trực tiếp.",
    },
    {
      section: "visual",
      title: "JSON trong sơ đồ",
      visual: "perf-mindmap",
      body: "Nhánh **JSON**: toán tử `->` (lấy JSON con), `->>` (lấy giá trị SQL), hàm `json_each` (bung mảng thành dòng).",
    },
    {
      section: "research",
      title: "JSON trong chuẩn SQL:2016",
      body: `SQL:2016 chuẩn hoá các hàm JSON (JSON_VALUE, JSON_TABLE…). PostgreSQL có kiểu \`jsonb\` nhị phân có chỉ mục GIN; SQLite lưu JSON dạng chữ và có toán tử \`->\` / \`->>\` giống PostgreSQL từ bản 3.38.

> ISO/IEC (2016) *ISO/IEC TR 19075-6:2017 SQL support for JavaScript Object Notation (JSON)*.`,
    },
    {
      section: "ideate",
      title: "Khi nào dùng JSON",
      body: "- **Có**: dữ liệu phụ, hình dạng thay đổi, ít khi lọc (thông tin thiết bị, cấu hình).\n- **Không**: khoá ngoại, tiền, cột hay lọc/JOIN — cần cột thật để có ràng buộc và chỉ mục.",
    },
    {
      section: "core",
      title: "->> lấy giá trị",
      body: "`payload ->> '$.device.os'` đi theo đường dẫn JSON.",
      sql: { setup: JSON_SEED, query: "SELECT id, kind, payload ->> '$.device.os' AS os, payload ->> '$.device.app' AS app\nFROM events;" },
    },
    {
      section: "core",
      title: "Lọc và gom theo trường JSON",
      body: "Điểm đánh giá trung bình theo hệ điều hành.",
      sql: { setup: JSON_SEED, query: "SELECT payload ->> '$.device.os' AS os, AVG(payload ->> '$.stars') AS tb_sao\nFROM events\nWHERE kind = 'feedback'\nGROUP BY os;" },
    },
    {
      section: "core",
      title: "json_each: bung mảng",
      body: "Mỗi phần tử của `items` thành một dòng — biến JSON thành bảng để JOIN.",
      sql: { setup: JSON_SEED, query: "SELECT e.payload ->> '$.order_id' AS don, j.value ->> '$.id' AS mon, j.value ->> '$.qty' AS ly\nFROM events e, json_each(e.payload, '$.items') j\nWHERE e.kind = 'order';" },
    },
    {
      section: "core",
      title: "Tạo JSON từ bảng",
      body: "`json_object` và `json_group_array` dựng JSON trả thẳng cho API.",
      sql: { query: "SELECT json_object('category', category, 'items', json_group_array(name)) AS api\nFROM menu_items\nGROUP BY category;" },
    },
    {
      section: "core",
      title: "Chỉ mục trên trường JSON",
      body: "Chỉ mục biểu thức (step 35) áp được cho JSON.",
      sql: { setup: JSON_SEED, query: "CREATE INDEX idx_os ON events(payload ->> '$.device.os');\nEXPLAIN QUERY PLAN SELECT id FROM events WHERE payload ->> '$.device.os' = 'iOS';" },
    },
    {
      section: "apply",
      title: "Bài tập 1: đánh giá 5 sao",
      body: "Hiện `text` của các đánh giá có `stars = 5`.",
      sql: { setup: JSON_SEED, query: "", solution: "SELECT payload ->> '$.text' FROM events WHERE kind = 'feedback' AND payload ->> '$.stars' = 5;", hints: ["payload ->> '$.stars'", "Lọc kind = 'feedback'."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: tổng ly từ sự kiện",
      body: "Dùng `json_each` tính **tổng số ly** trong mọi sự kiện `order`.",
      sql: { setup: JSON_SEED, query: "", solution: "SELECT SUM(j.value ->> '$.qty') FROM events e, json_each(e.payload, '$.items') j WHERE e.kind = 'order';", hints: ["json_each(e.payload, '$.items')", "SUM(j.value ->> '$.qty')"] },
    },
  ],
  quiz: [
    { q: "-> và ->> khác nhau?", o: ["Như nhau", "-> trả JSON, ->> trả giá trị SQL", "->> trả JSON", "-> chỉ cho mảng"], a: 1, why: "Giống PostgreSQL." },
    { kind: "blank", q: "Bung mảng JSON thành dòng.", code: "FROM events e, ___(e.payload, '$.items') j", a: "json_each", why: "Hàm bảng json_each." },
    { kind: "truefalse", q: "Nên lưu khoá ngoại và tiền trong JSON cho linh hoạt.", a: false, why: "Cần cột thật để ràng buộc và chỉ mục." },
    { q: "Chặn JSON hỏng khi ghi?", o: ["NOT NULL", "CHECK (json_valid(payload))", "UNIQUE", "DEFAULT '{}'"], a: 1, why: "Ràng buộc kiểm tra." },
    { q: "Tăng tốc lọc theo trường JSON?", o: ["Không làm được", "Chỉ mục biểu thức trên payload ->> '$.x'", "VACUUM", "UNION"], a: 1, why: "Chỉ mục biểu thức." },
  ],
};
