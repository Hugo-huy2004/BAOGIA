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
