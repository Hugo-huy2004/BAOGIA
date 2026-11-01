// Step 1 — Dữ liệu ở quanh ta. Khối mã trong `body` dùng rào ~~~.
// Ảnh thật: Wikimedia Commons, giấy phép ghi trong caption (xem ../LICENSE.md).
export default {
  id: "sql1",
  lang: "sql",
  file: "hat/notes.sql",
  duration: "60 phút",
  summary: "Phân biệt dữ liệu và thông tin, hiểu cơ sở dữ liệu và hệ quản trị cơ sở dữ liệu, và thấy vì sao SQL là ngôn ngữ chung của ngành dữ liệu.",
  slides: [
    {
      section: "intro",
      title: "Chào mừng tới khoá SQL",
      body: `Trong 40 step, bạn sẽ xây cơ sở dữ liệu cho **Hạt** — một quán cà phê có thực đơn, khách quen, đơn hàng và chi nhánh — từ một cuốn sổ ghi tay tới hệ thống báo cáo dùng **truy vấn nâng cao**: CTE đệ quy, window function, kế hoạch truy vấn, JSON và tìm kiếm toàn văn.

Mỗi step đi theo cùng trình tự: **giới thiệu → minh hoạ → nghiên cứu → lên ý tưởng → kiến thức chính → áp dụng vào Hạt → trắc nghiệm**. Muốn qua step, bài trắc nghiệm cuối phải đạt **từ 60%**.`,
    },
    {
      section: "intro",
      title: "Bản đồ cả khoá",
      visual: "sql-mindmap",
      body: "Tám nhánh là tám chặng. Bốn nhánh đầu là **đọc** dữ liệu, bốn nhánh sau là **thiết kế, ghi và tối ưu**. Quay lại sơ đồ này bất cứ lúc nào bạn thấy lạc.",
    },
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `- **Dữ liệu** khác **thông tin** thế nào.
- **Cơ sở dữ liệu** và **hệ quản trị cơ sở dữ liệu (DBMS)** là gì.
- Vì sao SQL — một ngôn ngữ ra đời từ thập niên 1970 — vẫn là kỹ năng được tuyển nhiều nhất trong ngành dữ liệu.

Chưa cần cài gì. Từ step 3, bạn chạy SQL thật ngay trong trình duyệt.`,
    },
    {
      section: "visual",
      title: "Cuốn sổ của quán",
      visual: "notebook-to-table",
      body: "Bên trái là cách quán ghi đơn khi mới mở: mỗi dòng một kiểu, có dòng thiếu tên khách. Bên phải là **cùng dữ liệu đó** xếp thành bảng: mỗi cột một loại thông tin, mỗi dòng một đơn. Ô không biết thì ghi **NULL** — chứ không bỏ trống tuỳ hứng.",
    },
    {
      section: "visual",
      title: "Trước máy tính: tủ phiếu thư viện",
      image: {
        src: "/image/sql/catalog.webp",
        alt: "Tủ gỗ nhiều ngăn kéo nhỏ đựng phiếu mục lục của một thư viện",
        caption: "Tủ phiếu mục lục — mỗi phiếu một cuốn sách, xếp theo tên tác giả. Ảnh: Grings1, Wikimedia Commons, CC BY-SA 4.0.",
      },
      body: "Thư viện đã \"đánh chỉ mục\" từ trước khi có máy tính: mỗi phiếu ghi cùng các mục (tên, tác giả, năm, vị trí kệ) và được xếp theo một thứ tự để tìm nhanh. Bảng và **chỉ mục** trong SQL (chặng 7) chính là ý tưởng này, chạy trên máy.",
    },
    {
      section: "visual",
      title: "Dữ liệu thật nằm ở đâu",
      image: {
        src: "/image/sql/disk.webp",
        alt: "Ổ cứng laptop đã tháo nắp, thấy đĩa từ và đầu đọc",
        caption: "Ổ cứng tháo nắp: đĩa từ quay, đầu đọc di chuyển. Ảnh: Evan-Amos, Wikimedia Commons, CC BY-SA 3.0.",
      },
      body: "Cuối cùng mọi bảng đều thành các byte trên đĩa (ổ cứng hoặc SSD). Đọc đĩa chậm hơn đọc RAM hàng nghìn lần — vì vậy DBMS tốn rất nhiều công sức để **đọc đúng chỗ, ít lần nhất**. Đó là lý do chặng 7 tồn tại.",
    },
    {
      section: "visual",
      title: "Và ở quy mô lớn",
      image: {
        src: "/image/sql/servers.webp",
        alt: "Dãy tủ máy chủ trong trung tâm dữ liệu, đèn xanh và cáp mạng",
        caption: "Tủ máy chủ của Wikimedia Foundation — nơi lưu cơ sở dữ liệu của Wikipedia. Ảnh: Victorgrigas, Wikimedia Commons, CC BY-SA 3.0.",
      },
      body: "Wikipedia, ngân hàng, sàn thương mại điện tử đều chạy trên những dãy máy như thế này, và gần như tất cả đều nói chuyện với dữ liệu bằng **SQL**. Câu SELECT bạn viết ở step 4 cũng là câu chạy trong những tủ máy đó.",
    },
    {
      section: "visual",
      title: "Ai làm gì",
      visual: "dbms-layers",
      body: "Bạn (hoặc ứng dụng) gửi câu SQL nói **cần gì**. DBMS quyết định **lấy thế nào**: đọc tệp nào, dùng chỉ mục nào, theo thứ tự nào. Tách bạch hai việc này là phát minh lớn nhất của mô hình quan hệ.",
    },
    {
      section: "research",
      title: "Dữ liệu, thông tin, tri thức",
      visual: "data-mindmap",
      body: `Ngành hệ thống thông tin hay dùng **tháp DIKW** (Ackoff, 1989):

- **Dữ liệu**: sự kiện thô — "8:05, trà đào, 1".
- **Thông tin**: dữ liệu đã được tổ chức, có ngữ cảnh — "hôm nay bán 42 ly trà đào".
- **Tri thức**: hiểu biết rút ra — "trà đào bán chạy buổi sáng, nên pha sẵn".

SQL là công cụ biến dữ liệu thành thông tin.

> Ackoff, R.L. (1989) 'From data to wisdom', *Journal of Applied Systems Analysis*, 16, pp. 3–9.`,
    },
    {
      section: "research",
      title: "Mô hình quan hệ của Codd (1970)",
      body: `Năm 1970, Edgar F. Codd (IBM) đề xuất lưu dữ liệu thành các **quan hệ** — ta gọi là bảng — và truy vấn bằng logic toán học, **không cần biết dữ liệu nằm ở đâu trên đĩa**.

Trước đó, lập trình viên phải tự đi theo con trỏ từ bản ghi này sang bản ghi khác; đổi cách lưu là phải viết lại chương trình. Codd gọi tính chất mới là **độc lập dữ liệu**. Ông nhận giải Turing năm 1981 cho công trình này.

> Codd, E.F. (1970) 'A relational model of data for large shared data banks', *Communications of the ACM*, 13(6), pp. 377–387. doi:10.1145/362384.362685`,
    },
    {
      section: "research",
      title: "SQL ra đời thế nào",
      body: `Dựa trên ý của Codd, Donald Chamberlin và Raymond Boyce (IBM) thiết kế **SEQUEL** năm 1974 — một ngôn ngữ đọc gần như tiếng Anh. Tên sau rút thành **SQL**.

- 1986: SQL thành chuẩn ANSI, 1987 thành chuẩn ISO.
- Chuẩn vẫn được cập nhật (SQL:2016 thêm JSON, SQL:2023 thêm kiểu đồ thị).
- Mỗi DBMS (SQLite, PostgreSQL, MySQL…) theo chuẩn ở mức khác nhau và thêm "phương ngữ" riêng.

> Chamberlin, D.D. and Boyce, R.F. (1974) 'SEQUEL: A structured English query language', *Proceedings of the 1974 ACM SIGFIDET Workshop*, pp. 249–264.`,
    },
    {
      section: "research",
      title: "Vì sao khoá này dùng SQLite",
      body: `- **Phạm vi công cộng**: mã nguồn và toàn bộ tài liệu của SQLite thuộc public domain — dùng, chép, dạy không vướng bản quyền.
- **Phổ biến nhất thế giới**: có sẵn trong mọi điện thoại Android, iPhone, trình duyệt và rất nhiều phần mềm.
- **Không cần máy chủ**: cả cơ sở dữ liệu là một tệp; chạy được ngay trong trình duyệt.
- **Đủ sâu**: có CTE, window function, JSON, FTS5 — đủ cho mọi kiến thức nâng cao của khoá.

Chặng 8 chỉ cách mang những gì đã học sang PostgreSQL và MySQL.

> SQLite (2025) *Most Widely Deployed SQL Database Engine*. Available at: https://sqlite.org/mostdeployed.html`,
    },
    {
      section: "ideate",
      title: "Quán Hạt cần biết gì",
      body: `Chủ quán Hạt hỏi bạn năm câu:

1. Hôm nay bán được bao nhiêu tiền?
2. Món nào bán chạy nhất tuần này?
3. Khách nào quay lại nhiều nhất?
4. Giờ nào đông khách nhất?
5. Tháng này so với tháng trước tăng hay giảm?

Với cuốn sổ tay: mất cả buổi tối. Với cơ sở dữ liệu: mỗi câu là **một câu SQL**, chạy dưới một giây. Đến cuối khoá, bạn trả lời được cả năm câu — câu 5 cần window function ở chặng 6.`,
    },
    {
      section: "ideate",
      title: "Phân rã: quán có những \"thứ\" gì",
      body: `Mỗi "thứ" quán cần nhớ sẽ thành một bảng:

- **Món** (menu_items): tên, giá, loại.
- **Khách** (customers): tên, số điện thoại, ngày đăng ký.
- **Đơn hàng** (orders): khi nào, khách nào, chi nhánh nào.
- **Dòng đơn** (order_items): đơn nào, món nào, bao nhiêu ly.

Vì sao tách "đơn hàng" và "dòng đơn"? Một đơn có nhiều món — câu trả lời đầy đủ nằm ở chặng 4 (chuẩn hoá).`,
    },
    {
      section: "core",
      title: "Cơ sở dữ liệu là gì",
      body: `**Cơ sở dữ liệu** là một tập dữ liệu **có tổ chức, có liên quan với nhau**, được lưu để nhiều người, nhiều chương trình cùng dùng lâu dài.

Ba chữ quan trọng:

- **Có tổ chức**: theo cấu trúc định trước (bảng, cột).
- **Có liên quan**: đơn hàng trỏ tới khách, tới món.
- **Dùng chung**: thu ngân, chủ quán, app giao hàng cùng đọc một nguồn.`,
    },
    {
      section: "core",
      title: "DBMS làm những gì",
      body: `**Hệ quản trị cơ sở dữ liệu** (DBMS) là phần mềm đứng giữa bạn và tệp dữ liệu. Nó lo:

1. **Lưu trữ** — sắp xếp byte trên đĩa.
2. **Truy vấn** — hiểu câu SQL, tìm cách chạy nhanh nhất.
3. **Toàn vẹn** — chặn dữ liệu sai (giá âm, đơn trỏ tới khách không tồn tại).
4. **Đồng thời** — hai thu ngân bấm cùng lúc vẫn không mất đơn.
5. **Phục hồi** — mất điện giữa chừng, dữ liệu vẫn nhất quán.

Bảng tính (Excel) chỉ làm tốt việc 1 và một phần việc 2.`,
    },
    {
      section: "core",
      title: "SQL là ngôn ngữ khai báo",
      body: `Ngôn ngữ **mệnh lệnh** (JavaScript, Python) mô tả **từng bước**: mở tệp, lặp từng dòng, nếu giá > 30000 thì giữ lại…

SQL là ngôn ngữ **khai báo**: bạn mô tả **kết quả muốn có**.

~~~sql
SELECT name, price
FROM menu_items
WHERE price > 30000;
~~~

Đọc như một câu: *chọn tên và giá, từ bảng thực đơn, nơi giá trên 30 nghìn*. Bạn không viết vòng lặp nào — DBMS tự chọn cách tìm.`,
    },
    {
      section: "core",
      title: "Bốn nhóm câu lệnh SQL",
      body: `| Nhóm | Viết tắt | Ví dụ | Khoá học dạy ở |
|---|---|---|---|
| Truy vấn | DQL | SELECT | chặng 1–3, 6 |
| Định nghĩa | DDL | CREATE, ALTER, DROP | chặng 4 |
| Thao tác | DML | INSERT, UPDATE, DELETE | chặng 5 |
| Giao dịch | TCL | BEGIN, COMMIT, ROLLBACK | chặng 5 |

Người làm dữ liệu dùng DQL nhiều nhất — vì vậy khoá học bắt đầu từ SELECT.`,
    },
    {
      section: "core",
      title: "SQL và NoSQL",
      body: `Bạn sẽ nghe tới **NoSQL** (MongoDB, Redis…). Chúng hợp với dữ liệu không có cấu trúc cố định hoặc cần tốc độ cực cao ở một kiểu truy cập.

Nhưng khi dữ liệu **có quan hệ** (đơn → khách → món) và cần **đúng tuyệt đối** (tiền, tồn kho), cơ sở dữ liệu quan hệ vẫn là lựa chọn mặc định. Ngay cả nhiều hệ NoSQL lớn cũng đã thêm ngôn ngữ truy vấn giống SQL.

Học SQL trước, bạn hiểu được cả hai thế giới.`,
    },
    {
      section: "apply",
      title: "Áp dụng: ghi đơn của Hạt bằng mắt SQL",
      body: `Mở tệp \`hat/notes.sql\` (một tệp chữ bình thường) và chép lại 5 đơn sau thành dạng bảng, mỗi đơn một dòng với các cột \`giờ | món | số lượng | khách\`:

1. 7h50 Lan lấy 2 bạc xỉu
2. 8h02 một trà đào, khách vãng lai
3. 8h10 Minh 1 cà phê đen, 1 bánh mì
4. 8h15 Lan quay lại thêm 1 trà đào
5. 8h30 3 bạc xỉu mang đi

Đơn 3 có hai món: bạn xếp thế nào? Ghi lại cách bạn chọn — chặng 4 sẽ cho câu trả lời chuẩn.`,
    },
    {
      section: "apply",
      title: "Tự kiểm tra",
      body: `Bảng của bạn ổn nếu:

- Mỗi cột chỉ chứa **một loại** thông tin (cột giờ không lẫn tên khách).
- Mỗi ô chỉ chứa **một giá trị** (không ghi "1 cà phê + 1 bánh mì" trong một ô).
- Khách vãng lai ghi **NULL**, không ghi "không có" ở dòng này và "—" ở dòng khác.

Ba quy tắc này chính là **dạng chuẩn 1 (1NF)** — bạn vừa chuẩn hoá dữ liệu mà chưa cần biết tên gọi.`,
    },
  ],
  quiz: [
    { q: "Câu nào là THÔNG TIN chứ không phải dữ liệu thô?", o: ["8:05, trà đào, 1", "Hôm nay bán 42 ly trà đào", "Lan, 0901xxxxxx", "29000"], a: 1, why: "Thông tin là dữ liệu đã được tổ chức và có ngữ cảnh — ở đây là tổng hợp trong một ngày." },
    { q: "Ai đề xuất mô hình quan hệ năm 1970?", o: ["Tim Berners-Lee", "Edgar F. Codd", "Linus Torvalds", "Donald Knuth"], a: 1, why: "Codd (IBM) công bố mô hình quan hệ năm 1970 trên Communications of the ACM." },
    { kind: "truefalse", q: "Với SQL, bạn phải tự viết vòng lặp đi qua từng dòng của bảng.", a: false, why: "SQL là ngôn ngữ khai báo: mô tả kết quả muốn có, DBMS tự chọn cách lấy." },
    { kind: "match", q: "Nối nhóm lệnh với ví dụ.", pairs: [["DQL", "SELECT"], ["DDL", "CREATE TABLE"], ["DML", "UPDATE"], ["TCL", "COMMIT"]], why: "Truy vấn · định nghĩa · thao tác · giao dịch." },
    { kind: "multi", q: "Những việc nào là việc của DBMS?", o: ["Chặn giá âm", "Thiết kế logo quán", "Giữ dữ liệu nhất quán khi mất điện", "Cho hai thu ngân ghi cùng lúc"], a: [0, 2, 3], why: "Toàn vẹn, phục hồi và đồng thời là ba nhiệm vụ cốt lõi của DBMS." },
    { q: "\"Độc lập dữ liệu\" theo Codd nghĩa là gì?", o: ["Mỗi người có cơ sở dữ liệu riêng", "Chương trình không phụ thuộc cách dữ liệu được lưu trên đĩa", "Dữ liệu không cần sao lưu", "Bảng không có khoá"], a: 1, why: "Đổi cách lưu trữ không buộc phải viết lại truy vấn." },
    { kind: "order", q: "Xếp tháp DIKW từ thấp lên cao.", items: ["Dữ liệu", "Thông tin", "Tri thức"], a: [0, 1, 2], why: "Ackoff (1989): dữ liệu → thông tin → tri thức → trí tuệ." },
    { q: "Khoá học dùng SQLite chủ yếu vì…", o: ["Nó là DBMS duy nhất có SQL", "Thuộc phạm vi công cộng, chạy được ngay trong trình duyệt, đủ tính năng nâng cao", "Nó không hỗ trợ JOIN", "Nó chỉ chạy trên máy chủ"], a: 1, why: "Public domain, không cần máy chủ, có CTE/window/JSON/FTS5." },
    { kind: "bug", q: "Dòng nào vi phạm quy tắc \"mỗi ô một giá trị\"?", lines: ["giờ  | món          | sl | khách", "7:50 | bạc xỉu      | 2  | Lan", "8:10 | cà phê, bánh mì | 2 | Minh", "8:02 | trà đào      | 1  | NULL"], a: 2, why: "Một ô chứa hai món — phải tách thành hai dòng (1NF)." },
    { kind: "truefalse", q: "Khách vãng lai không có tên nên ghi NULL vào cột khách.", a: true, why: "NULL nghĩa là \"không biết / không có\" — thống nhất hơn mọi cách ghi tay." },
  ],
};
