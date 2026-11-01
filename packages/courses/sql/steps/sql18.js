// Step 18 — Sơ đồ thực thể – quan hệ. Mở chặng 4.
export default {
  id: "sql18",
  lang: "sql",
  file: "hat/erd.md",
  duration: "75 phút",
  summary: "Đọc và vẽ sơ đồ thực thể – quan hệ (ERD): thực thể, thuộc tính, quan hệ và lực lượng 1–1, 1–n, n–n.",
  slides: [
    {
      section: "intro",
      title: "Chặng 4: thiết kế trước, viết sau",
      body: `Quán Hạt mở chi nhánh thứ hai, thêm danh mục món, thêm nhãn "ít đường", "thuần chay". Lược đồ bốn bảng không đủ nữa.

Chặng 4: ERD → CREATE TABLE và khoá → ràng buộc → chuẩn hoá → quan hệ nhiều – nhiều. Kết chặng: lược đồ 8 bảng đạt **3NF**.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 4",
      visual: "design-mindmap",
      body: "Tám nhánh, ba tầng: **mô hình** (ERD, quan hệ n–n), **khoá & ràng buộc**, **chuẩn hoá**. Ba tầng ứng với ba câu hỏi: lưu cái gì, chặn sai thế nào, lưu ở đâu cho khỏi trùng.",
    },
    {
      section: "visual",
      title: "ERD quán Hạt (bản đích)",
      visual: "erd-hat",
      body: "Tám bảng. Mũi tên đi từ khoá ngoại tới khoá chính. Nét đứt: `item_tags` là **bảng nối** của quan hệ nhiều – nhiều giữa món và nhãn (step 22).",
    },
    {
      section: "research",
      title: "Mô hình thực thể – quan hệ của Chen",
      body: `Peter Chen (1976) đề xuất vẽ dữ liệu bằng **thực thể** (hình chữ nhật), **quan hệ** (hình thoi) và **thuộc tính** (hình elip) — trước khi chọn DBMS. Ngày nay phổ biến ký hiệu "chân chim" (crow's foot) của Gordon Everest, gọn hơn.

> Chen, P.P. (1976) 'The entity-relationship model — toward a unified view of data', *ACM TODS*, 1(1), pp. 9–36.`,
    },
    {
      section: "ideate",
      title: "Tìm thực thể từ lời kể",
      body: `Chủ quán kể: "Mỗi **chi nhánh** bán theo cùng **thực đơn**. **Món** thuộc một **danh mục**, có thể gắn nhiều **nhãn**. **Khách** đặt **đơn** ở một chi nhánh; đơn có nhiều món."

Danh từ in đậm là ứng viên thực thể. Động từ ("thuộc", "đặt", "gắn") là quan hệ.`,
    },
    {
      section: "core",
      title: "Ba loại lực lượng",
      body: `| Quan hệ | Ví dụ | Cài đặt |
|---|---|---|
| 1 – 1 | khách – thẻ thành viên | khoá ngoại UNIQUE |
| 1 – n | chi nhánh – đơn | khoá ngoại ở phía n |
| n – n | món – nhãn | bảng nối |

Hỏi hai chiều: "một chi nhánh có **mấy** đơn?" → nhiều. "Một đơn ở **mấy** chi nhánh?" → một. Vậy là 1 – n.`,
    },
    {
      section: "core",
      title: "Thực thể yếu",
      body: "`order_items` không có nghĩa nếu thiếu đơn: nó là **thực thể yếu**, khoá của nó gồm khoá của thực thể cha (`order_id`) + phần riêng (`item_id`). Xoá đơn thì dòng đơn cũng phải đi theo (step 19: ON DELETE CASCADE).",
    },
    {
      section: "core",
      title: "Đọc lược đồ có sẵn",
      body: "SQLite lưu lược đồ trong bảng hệ thống `sqlite_schema`. Đây là cách đọc ERD của một cơ sở dữ liệu bạn chưa từng thấy.",
      sql: { query: "SELECT name, sql FROM sqlite_schema WHERE type = 'table';" },
    },
    {
      section: "core",
      title: "PRAGMA foreign_key_list",
      body: "Liệt kê khoá ngoại của một bảng — chính là các mũi tên trên ERD.",
      sql: { query: "SELECT * FROM pragma_foreign_key_list('order_items');" },
    },
    {
      section: "apply",
      title: "Bài tập: liệt kê bảng",
      body: "Hiện **tên** mọi bảng trong cơ sở dữ liệu (chỉ cột name).",
      sql: { query: "", solution: "SELECT name FROM sqlite_schema WHERE type = 'table';", hints: ["Bảng hệ thống sqlite_schema.", "WHERE type = 'table'"] },
    },
    {
      section: "apply",
      title: "Áp dụng: vẽ ERD trên giấy",
      body: `Vẽ ERD cho tình huống: "Quán có **nhân viên**; mỗi đơn do một nhân viên thu ngân; một nhân viên làm ở một chi nhánh; mỗi chi nhánh có một quản lý (cũng là nhân viên)."

Gợi ý: quan hệ "quản lý" là 1 – 1 từ chi nhánh tới nhân viên, và tạo vòng giữa hai bảng.`,
    },
  ],
  quiz: [
    { q: "Ai đề xuất mô hình thực thể – quan hệ (1976)?", o: ["Codd", "Chen", "Date", "Boyce"], a: 1, why: "Peter Chen, ACM TODS 1976." },
    { kind: "match", q: "Nối quan hệ với cách cài đặt.", pairs: [["1 – n", "khoá ngoại ở phía n"], ["n – n", "bảng nối"], ["1 – 1", "khoá ngoại UNIQUE"]], why: "Ba loại lực lượng." },
    { q: "Món – nhãn (một món nhiều nhãn, một nhãn nhiều món) là?", o: ["1 – 1", "1 – n", "n – n", "Không phải quan hệ"], a: 2, why: "Cần bảng nối item_tags." },
    { kind: "truefalse", q: "Thực thể yếu có khoá chứa khoá của thực thể cha.", a: true, why: "order_items: (order_id, item_id)." },
    { kind: "blank", q: "Bảng hệ thống chứa lược đồ SQLite.", code: "SELECT sql FROM ___ WHERE type = 'table';", a: "sqlite_schema", why: "Tên cũ: sqlite_master." },
  ],
};
