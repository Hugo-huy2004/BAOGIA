// Step 22 — Quan hệ nhiều – nhiều và bảng nối. Kết chặng 4.
const TAGS = "CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);\nCREATE TABLE item_tags (item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE, tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY (item_id, tag_id));\nINSERT INTO tags VALUES (1,'ít đường'),(2,'thuần chay'),(3,'bán chạy'),(4,'mới');\nINSERT INTO item_tags VALUES (1,3),(2,1),(2,2),(2,3),(3,2),(5,4),(5,1),(6,4),(6,2);";

export default {
  id: "sql22",
  lang: "sql",
  file: "hat/many-to-many.sql",
  duration: "75 phút",
  summary: "Cài đặt quan hệ nhiều – nhiều bằng bảng nối, truy vấn hai chiều, và hoàn thiện lược đồ 8 bảng của Hạt.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Một món có nhiều nhãn (\"ít đường\", \"thuần chay\"); một nhãn gắn cho nhiều món. Không thể đặt khoá ngoại ở bên nào — cần **bảng thứ ba**.",
    },
    {
      section: "visual",
      title: "Bảng nối item_tags",
      visual: "erd-hat",
      body: "Góc dưới phải: `menu_items` ← `item_tags` → `tags`. Bảng nối chỉ có hai khoá ngoại, khoá chính là **cặp** của chúng.",
    },
    {
      section: "research",
      title: "Vì sao không lưu danh sách trong một cột",
      body: `Cột \`tags = 'ít đường,thuần chay'\` vi phạm 1NF: không đặt khoá ngoại được, không đếm "bao nhiêu món thuần chay" bằng GROUP BY được, đổi tên nhãn phải sửa chuỗi khắp nơi. Karwin gọi đây là phản mẫu **Jaywalking**.

> Karwin, B. (2010) *SQL Antipatterns*. Raleigh: Pragmatic Bookshelf, ch. 2.`,
    },
    {
      section: "ideate",
      title: "Hai câu hỏi hai chiều",
      body: "\"Trà đào có những nhãn gì?\" (món → nhãn) và \"Món nào thuần chay?\" (nhãn → món). Cả hai đều là **hai JOIN** qua bảng nối.",
    },
    {
      section: "core",
      title: "Món → nhãn",
      body: "Nhãn của Trà đào (id 2): đi từ bảng nối sang bảng nhãn.",
      sql: { setup: TAGS, query: "SELECT t.name\nFROM item_tags it\nJOIN tags t ON t.id = it.tag_id\nWHERE it.item_id = 2;" },
    },
    {
      section: "core",
      title: "Nhãn → món",
      body: "Món thuần chay.",
      sql: { setup: TAGS, query: "SELECT m.name\nFROM tags t\nJOIN item_tags it ON it.tag_id = t.id\nJOIN menu_items m ON m.id = it.item_id\nWHERE t.name = 'thuần chay';" },
    },
    {
      section: "core",
      title: "Gộp nhãn thành một chuỗi khi hiển thị",
      body: "`group_concat` ghép nhãn để **hiển thị** — lưu thì vẫn tách bảng.",
      sql: { setup: TAGS, query: "SELECT m.name, group_concat(t.name, ', ') AS nhan\nFROM menu_items m\nLEFT JOIN item_tags it ON it.item_id = m.id\nLEFT JOIN tags t ON t.id = it.tag_id\nGROUP BY m.id;" },
    },
    {
      section: "core",
      title: "Món có ĐỦ hai nhãn",
      body: "\"Ít đường **và** thuần chay\": lọc hai nhãn rồi giữ món có đủ 2 — phép **chia quan hệ** quen thuộc.",
      sql: { setup: TAGS, query: "SELECT m.name\nFROM menu_items m\nJOIN item_tags it ON it.item_id = m.id\nJOIN tags t ON t.id = it.tag_id\nWHERE t.name IN ('ít đường', 'thuần chay')\nGROUP BY m.id\nHAVING COUNT(*) = 2;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: đếm món theo nhãn",
      body: "Hiện tên nhãn và **số món** mang nhãn đó.",
      sql: { setup: TAGS, query: "", solution: "SELECT t.name, COUNT(*) FROM tags t JOIN item_tags it ON it.tag_id = t.id GROUP BY t.id;", hints: ["JOIN tags với item_tags.", "GROUP BY t.id"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: món mới",
      body: "Hiện tên các món mang nhãn `mới`.",
      sql: { setup: TAGS, query: "", solution: "SELECT m.name FROM tags t JOIN item_tags it ON it.tag_id = t.id JOIN menu_items m ON m.id = it.item_id WHERE t.name = 'mới';", hints: ["Hai JOIN qua bảng nối.", "WHERE t.name = 'mới'"] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 4",
      body: "Bạn đã đi từ lời kể của chủ quán → ERD → CREATE TABLE có khoá, ràng buộc → chuẩn hoá 3NF → quan hệ n–n. Chặng 5: **ghi** dữ liệu an toàn — INSERT, UPDATE, DELETE trong giao dịch, và chặn SQL Injection.",
    },
  ],
  quiz: [
    { q: "Quan hệ n–n cài đặt bằng?", o: ["Khoá ngoại ở một bên", "Bảng nối với hai khoá ngoại", "Cột chứa danh sách", "UNIQUE"], a: 1, why: "item_tags(item_id, tag_id)." },
    { kind: "truefalse", q: "Lưu 'ít đường,thuần chay' trong một cột là thiết kế tốt.", a: false, why: "Phản mẫu Jaywalking, vi phạm 1NF." },
    { kind: "blank", q: "Ghép nhãn để hiển thị.", code: "SELECT ___(t.name, ', ') …", a: "group_concat", why: "PostgreSQL dùng string_agg." },
    { q: "Khoá chính của bảng nối thường là?", o: ["id tự tăng duy nhất", "Cặp hai khoá ngoại", "Tên nhãn", "Không cần khoá"], a: 1, why: "Chặn gắn trùng một nhãn hai lần." },
    { q: "Món có ĐỦ cả hai nhãn: mẫu nào?", o: ["WHERE t.name = 'a' AND t.name = 'b'", "IN (a, b) + GROUP BY + HAVING COUNT(*) = 2", "UNION", "LEFT JOIN"], a: 1, why: "Một dòng chỉ có một tên nhãn; đếm đủ 2." },
  ],
};
