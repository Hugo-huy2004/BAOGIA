# Kiến Trúc Hệ Thống: SwiftUI Design System & Tái Cấu Trúc Backend Theo Chuẩn Viblo

Tài liệu này tổng hợp việc áp dụng hai tiêu chuẩn vào hệ thống Hugo Portal:
1. **SwiftUI / iOS Human Interface Guidelines Design System** (lấy cảm hứng từ `@expo/ui/swift-ui` và Apple HIG).
2. **5 Quy Tắc Cơ Bản Xây Dựng Cấu Trúc Dự Án Node.js** (từ bài viết trên Viblo).

---

## Phần 1: SwiftUI Design System (@expo/ui/swift-ui)

### 1. Triết Lý Thiết Kế
Mô phỏng trải nghiệm người dùng tự nhiên của SwiftUI trên nền tảng React + Tailwind CSS:
- **Liquid Glass & Materials**: Phủ lớp mờ kính đa tầng (`backdrop-blur-xl`, `backdrop-blur-2xl`), độ bão hoà màu cao (`saturate-[190%]`), phản xạ ánh sáng (specular highlight ở mép trên `border-t-white/35`) và viền tóc siêu mảnh (`0.5px hairline border`).
- **Phân Cấp Thị Giác (Visual Hierarchy)**:
  - Foreground chính (`.swiftui-fg-primary`): chữ rõ nét, độ tương phản cao.
  - Foreground thứ cấp (`.swiftui-fg-secondary`): nhãn phụ, mô tả.
  - Foreground tam cấp (`.swiftui-fg-tertiary`): chú thích mờ, placeholder.
- **Tương Tác Đàn Hồi (Haptic & Spring)**: Phản hồi chạm nảy nhẹ (`active:scale-[0.98]` và `active:scale-[0.96]`) với đường cong chuyển động vật lý `cubic-bezier(0.32, 0.72, 0, 1)`.

### 2. Các Thành Phần Trong `src/components/ui/swiftui/`
- **`SwiftUIGlass`**: Vỏ container kính mờ Liquid Glass sang trọng với viền phản quang specular highlight.
- **`SwiftUISection`**: Khung nhóm Inset Grouped Section theo phong cách Settings / Form trong iOS, tự động chèn divider hairline giữa các hàng.
- **`SwiftUIRow`**: Dòng hiển thị chuẩn iOS với Icon badge bo góc squircle, Title, Subtitle, Value, Action trailing và Chevron.
- **`SwiftUIButton`**: Nút bấm hỗ trợ 4 biến thể SwiftUI: `prominent`, `tinted`, `bordered`, `plain`, kèm hiệu ứng scale đàn hồi khi bấm.
- **`SwiftUIToggle`**: Công tắc bật/tắt (Toggle Switch) chuẩn kích thước 51x31px của iOS với nút tròn trượt mượt mà.
- **`SwiftUISegmentedControl`**: Dải phân đoạn chuyển tab (Segmented Control) dạng trượt kính với chỉ báo vị trí nổi.

---

## Phần 2: Tái Cấu Trúc Node.js Backend Theo 5 Quy Tắc Viblo

Dựa trên bài viết *"5 quy tắc cơ bản trong xây dựng cấu trúc một project NodeJS"*:

### Quy tắc 1: Cấu trúc thư mục rõ ràng theo tầng trách nhiệm (Layered Architecture)
- Tách bạch rõ các tầng trong `server/`:
  - `config/`: Toàn bộ cấu hình hệ thống (Database, CORS, Limiter).
  - `controllers/`: Tiếp nhận request, xử lý dữ liệu đầu vào và gọi service.
  - `services/`: Nghiệp vụ lõi (business logic, WebSocket dispatcher, OAuth, Joy, v.v.).
  - `routes/`: Định tuyến endpoint API.
  - `models/`: Lược đồ dữ liệu Mongoose / Schema.
  - `middlewares/`: Kiểm tra xác thực, quyền hạn, rate limit.

### Quy tắc 2: Không đặt logic nặng trong Entry File (`server.js`)
- `server/server.js` trước đây dài 553 dòng, chứa cả logic khởi tạo HTTP Server, cấu hình CORS phức tạp, kết nối DB, kiểm tra slug cache, và bộ xử lý WebSocket nâng cấp (WebSocket upgrade dispatcher).
- **Hành động tái cấu trúc**:
  - Tách toàn bộ cơ chế WebSocket sang `server/services/websocketServer.js` (quản lý kết nối `/ws` và `/ws/chess`, theo dõi heartbeat ping/pong, vitals relay).
  - Tách kết nối MongoDB sang `server/config/database.js`.
  - Tách cấu hình CORS sang `server/config/cors.js`.
  - Giảm `server.js` từ 553 dòng xuống còn 297 dòng — chỉ giữ vai trò kết nối middleware, đăng ký route và khởi chạy listen trên cổng **8099**.

### Quy tắc 3: Tránh lồng Callback (Callback Hell) & Quản Lý Async/Await Đồng Bộ
- Mọi hàm trong `server/config/` và `server/services/` đều sử dụng chuẩn `async/await` với `try/catch` có log lỗi chi tiết, không dùng callback lồng nhau.

### Quy tắc 4: Tập trung cấu hình trong thư mục `config/`
- Tạo mới thư mục `server/config/`:
  - `database.js`: Cấu hình kết nối MongoDB, connection pool (`maxPoolSize: 50`), warmup slug cache, và tự động tạo admin khởi tạo nếu thiếu.
  - `cors.js`: Quản lý danh sách origin được phép, regex origin, và hàm tuỳ biến riêng biệt cho `/api/oauth` và API chung.
  - `limiter.js`: Cấu hình rate limit toàn cục bảo vệ máy chủ.
  - `index.js`: Barrel export tập trung toàn bộ cấu hình.

### Quy tắc 5: Tách các script phức tạp hoặc dài ra thư mục `scripts/`
- Trước đây `package.json` chứa chuỗi lệnh `check:all` dài hơn 700 ký tự chạy bằng `&&` nối 33 câu lệnh, và script `cv:pdf` nhúng trực tiếp mã Node.js chạy headless Chrome vào inline string.
- **Hành động tái cấu trúc**:
  - Tạo `scripts/checks/run-all-checks.mjs`: Script điều phối chạy lần lượt 33 bước kiểm tra (lint, imports, route guards, gateway, app-standard, build, budget, seo, csp) có thanh tiến trình `[i/33]` và xử lý thoát mã lỗi chuẩn xác.
  - Tạo `scripts/export-cv-pdfs.mjs`: Module hoá quá trình khởi động puppeteer / headless Chrome in file PDF CV tiếng Việt và tiếng Anh.
  - `package.json` trở nên ngắn gọn, dễ đọc, dễ bảo trì.
