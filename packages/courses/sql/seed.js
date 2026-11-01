// Cơ sở dữ liệu mẫu của quán Hạt — mọi ô SQL trong khoá chạy trên bản sao mới
// của dữ liệu này (sửa/xoá thoải mái, tải lại slide là về nguyên trạng).
export const HAT_SEED = `
PRAGMA foreign_keys = ON;
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE, joined_at TEXT NOT NULL);
CREATE TABLE menu_items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL CHECK (price > 0));
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), ordered_at TEXT NOT NULL);
CREATE TABLE order_items (order_id INTEGER NOT NULL REFERENCES orders(id), item_id INTEGER NOT NULL REFERENCES menu_items(id), qty INTEGER NOT NULL CHECK (qty > 0), PRIMARY KEY (order_id, item_id));
INSERT INTO customers VALUES (1,'Lan','0901000001','2026-09-01'),(2,'Minh','0901000002','2026-09-03'),(3,'An',NULL,'2026-09-10'),(4,'Vy','0901000004','2026-10-02');
INSERT INTO menu_items VALUES (1,'Bạc xỉu','coffee',29000),(2,'Trà đào','tea',35000),(3,'Cà phê đen','coffee',25000),(4,'Bánh mì','food',20000),(5,'Matcha latte','tea',45000),(6,'Cold brew','coffee',39000);
INSERT INTO orders VALUES (1,1,'2026-10-01 07:50'),(2,NULL,'2026-10-01 08:02'),(3,2,'2026-10-01 08:10'),(4,1,'2026-10-01 08:15'),(5,NULL,'2026-10-01 08:30'),(6,3,'2026-10-02 09:00'),(7,2,'2026-10-02 09:20'),(8,4,'2026-10-03 14:05');
INSERT INTO order_items VALUES (1,1,2),(2,2,1),(3,3,1),(3,4,1),(4,2,1),(5,1,3),(6,5,1),(7,2,1),(7,3,2),(8,6,1),(8,4,2);
`;

// Dữ liệu cả tháng 10 cho các chặng báo cáo (3, 6, 7, 8): thêm khách 5–12 và đơn 9–120,
// sinh tất định bằng CTE đệ quy nên lần chạy nào cũng ra đúng một bộ số.
export const HAT_MONTH = `
INSERT INTO customers VALUES (5,'Khoa','0901000005','2026-09-15'),(6,'Mai','0901000006','2026-09-20'),(7,'Tú',NULL,'2026-10-05'),(8,'Hà','0901000008','2026-10-08'),
  (9,'Nam','0901000009','2026-10-12'),(10,'Linh','0901000010','2026-10-15'),(11,'Phúc',NULL,'2026-10-20'),(12,'Quyên','0901000012','2026-10-25');
WITH RECURSIVE n(i) AS (SELECT 9 UNION ALL SELECT i + 1 FROM n WHERE i < 120)
INSERT INTO orders SELECT i,
  CASE WHEN i % 5 = 0 THEN NULL ELSE 1 + (i * 7) % 12 END,
  datetime('2026-10-01 07:00', '+' || (i / 4) || ' days', '+' || ((i * 37) % 600) || ' minutes')
FROM n;
INSERT INTO order_items SELECT id, 1 + (id * 5) % 6, 1 + id % 3 FROM orders WHERE id >= 9;
INSERT INTO order_items SELECT id, 1 + (id * 5 + 2) % 6, 1 FROM orders WHERE id >= 9 AND id % 2 = 0;
`;

// Chặng 7: bảng lớn để thấy chỉ mục có tác dụng thật (50.000 đơn giả, sinh trong trình duyệt ~0,2 giây).
export const HAT_BIG = `
CREATE TABLE big_orders (id INTEGER PRIMARY KEY, customer_id INTEGER, branch_id INTEGER, total INTEGER, ordered_at TEXT, note TEXT);
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 50000)
INSERT INTO big_orders SELECT i, 1 + (i * 7919) % 5000, 1 + i % 3, 20000 + (i * 37) % 180000,
  datetime('2026-01-01', '+' || (i % 300) || ' days', '+' || (i % 840) || ' minutes'),
  CASE WHEN i % 97 = 0 THEN 'giao gấp' END
FROM n;
`;
