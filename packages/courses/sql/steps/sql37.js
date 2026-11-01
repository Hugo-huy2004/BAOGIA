// Step 37 — Tìm kiếm toàn văn. Kết chặng 7.
// Ô SQL dùng FTS4 vì bản SQLite trong trình duyệt (sql.js) không kèm FTS5;
// cú pháp MATCH giống nhau, khác biệt FTS5 được giảng trong bài.
const FTS = "CREATE VIRTUAL TABLE menu_fts USING fts4(name, description, tokenize=unicode61 \"remove_diacritics=2\");\nINSERT INTO menu_fts VALUES\n('Bạc xỉu', 'cà phê sữa đặc nhiều sữa ít cà phê, uống đá'),\n('Trà đào', 'trà đen ủ lạnh, đào ngâm, sả tươi'),\n('Cà phê đen', 'phin truyền thống, robusta rang mộc'),\n('Bánh mì', 'bánh mì que pate, ăn kèm cà phê'),\n('Matcha latte', 'trà xanh Nhật, sữa tươi, ít đường'),\n('Cold brew', 'cà phê ủ lạnh 18 giờ, vị trái cây');";

export default {
  id: "sql37",
  lang: "sql",
  file: "hat/fts.sql",
  duration: "75 phút",
  summary: "Tìm kiếm toàn văn bằng bảng ảo FTS: MATCH, tìm tiền tố, cụm từ, AND/OR/NOT, bỏ dấu tiếng Việt, xếp hạng — và khác biệt FTS4/FTS5.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Step 8 kết luận: `LIKE '%cà phê%'` chậm trên bảng lớn và không hiểu tiếng Việt không dấu. **Full-text search** đánh chỉ mục từng **từ**: gõ \"ca phe\" vẫn ra \"Cà phê\", tức thì.",
    },
    {
      section: "visual",
      title: "FTS trong sơ đồ",
      visual: "perf-mindmap",
      body: "Nhánh **FTS**: chỉ mục ngược — mỗi từ trỏ tới danh sách tài liệu chứa nó, như mục lục cuối sách.",
    },
    {
      section: "research",
      title: "Chỉ mục ngược",
      body: `Mọi công cụ tìm kiếm — từ Google tới Elasticsearch — dựa trên **chỉ mục ngược** (inverted index). Xếp hạng kết quả thường dùng BM25, mô hình xác suất của Robertson và cộng sự. SQLite FTS5 có sẵn hàm \`bm25()\`.

> Manning, C.D., Raghavan, P. and Schütze, H. (2008) *Introduction to Information Retrieval*. Cambridge University Press, ch. 1 & 11.`,
    },
    {
      section: "ideate",
      title: "Ô tìm kiếm thực đơn, bản xịn",
      body: "Gõ \"ca phe lanh\" → Cold brew (\"cà phê ủ lạnh\"). Gõ \"tra\" → mọi món có chữ trà. Gõ \"sua -dac\" → món có sữa nhưng không sữa đặc.",
    },
    {
      section: "core",
      title: "Bảng ảo FTS và MATCH",
      body: "`tokenize=unicode61 \"remove_diacritics=2\"` bỏ dấu tiếng Việt khi đánh chỉ mục và khi tìm.",
      sql: { setup: FTS, query: "SELECT name FROM menu_fts WHERE menu_fts MATCH 'ca phe';" },
    },
    {
      section: "core",
      title: "Tìm tiền tố",
      body: "`tra*` khớp \"trà\", \"trái\". Hữu ích khi người dùng đang gõ dở.",
      sql: { setup: FTS, query: "SELECT name FROM menu_fts WHERE menu_fts MATCH 'tra*';" },
    },
    {
      section: "core",
      title: "Cụm từ và phép logic",
      body: "Ngoặc kép = cụm từ đúng thứ tự. `OR`, và dấu `-` (NOT, FTS4 dạng tiêu chuẩn) loại trừ.",
      sql: { setup: FTS, query: "SELECT name FROM menu_fts WHERE menu_fts MATCH '\"u lanh\"';\n-- thử: MATCH 'sua OR dao'" },
    },
    {
      section: "core",
      title: "Tìm trong một cột và đoạn trích",
      body: "`cột:từ` giới hạn cột; `snippet()` trả đoạn có từ khoá được đánh dấu để hiển thị.",
      sql: { setup: FTS, query: "SELECT name, snippet(menu_fts, '[', ']', '…') AS trich\nFROM menu_fts WHERE menu_fts MATCH 'description:lanh';" },
    },
    {
      section: "core",
      title: "FTS5 khác gì",
      body: `Bản SQLite đầy đủ (Node, Python, Android) có **FTS5**, mới hơn FTS4:

~~~sql
CREATE VIRTUAL TABLE menu_fts USING fts5(name, description, tokenize = 'unicode61 remove_diacritics 2');
SELECT name, bm25(menu_fts) AS diem FROM menu_fts WHERE menu_fts MATCH 'ca phe' ORDER BY diem;
~~~

- Có \`bm25()\` xếp hạng sẵn, \`highlight()\`.
- Cú pháp \`NOT\` rõ ràng, tiền tố bằng chỉ mục riêng (\`prefix='2 3'\`).

PostgreSQL dùng \`tsvector\` + chỉ mục GIN cho cùng mục đích.`,
    },
    {
      section: "apply",
      title: "Bài tập 1: món có sữa",
      body: "Tìm tên các món có từ \"sữa\" (gõ không dấu).",
      sql: { setup: FTS, query: "", solution: "SELECT name FROM menu_fts WHERE menu_fts MATCH 'sua';", hints: ["MATCH 'sua' — FTS đã bỏ dấu.", "SELECT name FROM menu_fts WHERE menu_fts MATCH …"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: chỉ tìm trong tên",
      body: "Tìm món có chữ bắt đầu bằng \"ca\" **trong cột name**.",
      sql: { setup: FTS, query: "", solution: "SELECT name FROM menu_fts WHERE menu_fts MATCH 'name:ca*';", hints: ["Cú pháp cột:từ.", "MATCH 'name:ca*'"] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 7",
      body: "Bạn biết vì sao truy vấn nhanh hay chậm: B-tree, kế hoạch truy vấn, điều kiện sargable, chỉ mục phủ/một phần/biểu thức, JSON có chỉ mục, tìm kiếm toàn văn. Chặng 8: **dự án tốt nghiệp** — báo cáo thật cho quán Hạt.",
    },
  ],
  quiz: [
    { q: "FTS khác LIKE '%x%' ở chỗ?", o: ["Không khác", "Dùng chỉ mục ngược theo từ, nhanh và bỏ dấu được", "Chỉ tìm đầu chuỗi", "Chậm hơn"], a: 1, why: "Inverted index." },
    { kind: "blank", q: "Tìm tiền tố 'tra'.", code: "WHERE menu_fts MATCH '___'", a: "tra*", why: "Dấu * sau từ." },
    { kind: "truefalse", q: "remove_diacritics giúp gõ 'ca phe' tìm ra 'cà phê'.", a: true, why: "Bỏ dấu khi đánh chỉ mục và khi tìm." },
    { q: "Hàm xếp hạng có sẵn trong FTS5?", o: ["rank_score()", "bm25()", "tfidf()", "score()"], a: 1, why: "Robertson et al. — BM25." },
    { q: "PostgreSQL làm tìm kiếm toàn văn bằng?", o: ["LIKE", "tsvector + chỉ mục GIN", "JSON", "B-tree thường"], a: 1, why: "Tương đương FTS của SQLite." },
  ],
};
