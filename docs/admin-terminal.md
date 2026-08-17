# Hướng Dẫn Sử Dụng Lệnh Quản Trị Viên (Hugo Studio Terminal Admin)

Hệ thống quản trị Admin Dashboard hiện hoạt động hoàn toàn bằng dòng lệnh (Command-Line Interface) tích hợp **Trí tuệ nhân tạo (AI)**. Bạn có thể gõ câu lệnh tự do bằng Tiếng Việt hoặc dùng cú pháp lệnh từ dấu nhắc lệnh `admin@hugostudio:~$` và nhấn `Enter` để thực thi. AI sẽ tự động hiểu và chuyển hóa ý định của bạn.

---

## Danh Sách Các Lệnh & Khẩu Lệnh Hỗ Trợ (Supported Intent Actions)

### 1. `/help`
*   **Mô tả:** Hiển thị danh sách tất cả các lệnh quản trị và hướng dẫn.
*   **Khẩu lệnh tự do:** "hướng dẫn", "help", "trợ giúp"

### 2. Tạo mã Voucher JOY (`create-joy-voucher`)
*   **Mô tả:** Tạo mã thẻ quà tặng JOY (Joy Gift Card). Mã sau khi tạo xong sẽ được hiển thị ra màn hình và có sẵn nút sao chép nhanh (copy).
*   **Khẩu lệnh tự do:**
    *   `tạo voucher 1000`
    *   `tạo mã joy card 500`
    *   `/create-joy-voucher 2500 "Tặng sự kiện"`

### 3. Gửi JOY Trực tiếp đến Tài khoản (`send-joy-direct`)
*   **Mô tả:** Cộng trực tiếp điểm JOY vào tài khoản người dùng thông qua email/số điện thoại mà không cần mã Voucher.
*   **Khẩu lệnh tự do:**
    *   `gửi 500 joy trực tiếp đến phucphgcs230327@fpt.edu.vn`
    *   `gửi trực tiếp 2000 joy cho test@gmail.com`

### 4. Tạo yêu cầu chuyển khoản / QR Code thanh toán (`create-payment`)
*   **Mô tả:** Tạo link thanh toán / mã QR qua cổng PayOS. Hỗ trợ tự động nhận diện email hoặc số điện thoại người dùng để gửi thông báo In-App trực tiếp, hoặc tạo link thanh toán chung cho tất cả mọi người.
*   **Khẩu lệnh tự do:**
    *   `tạo link thanh toán 50k`
    *   `tạo mã qr thanh toán 100000 cho phucphgcs230327@fpt.edu.vn`
    *   `tạo yêu cầu chuyển khoản đến phucphgcs230327@fpt.edu.vn 50k`
*   *Lưu ý:* Nếu không nhập lý do chuyển khoản, hệ thống sẽ tự động sinh mã mô tả giao dịch dạng `TXN-[timestamp]`.

### 5. Tạo mẫu gói dịch vụ mới (`create-package-template`)
*   **Mô tả:** Tạo mới một mẫu gói dịch vụ (Package Template) trong cơ sở dữ liệu.
*   **Khẩu lệnh tự do:**
    *   `tạo gói dịch vụ VIP 30 ngày`
    *   `tạo gói mới Sinh Viên 12 tháng`

### 6. Gửi / Gán gói dịch vụ cho thành viên (`send-package-user`)
*   **Mô tả:** Gán trực tiếp một gói dịch vụ cho tài khoản người dùng và tự động kéo dài ngày hết hạn Bio Link của họ.
*   **Khẩu lệnh tự do:**
    *   `gửi gói VIP 30 ngày cho phucphgcs230327@fpt.edu.vn`
    *   `giao gói Premium 12 tháng đến test@gmail.com`

### 7. Các Lệnh Xóa / Thu Hồi (`delete-*`)
*   **Mô tả:** Xóa các tài nguyên ra khỏi hệ thống dựa trên yêu cầu của Admin. AI sẽ tự nhận dạng đối tượng muốn xóa:
    *   **Xóa tài khoản thành viên (`delete-user`):**
        *   `xóa tài khoản phucphgcs230327@fpt.edu.vn`
        *   `xóa user phucphgcs230327@fpt.edu.vn`
    *   **Xóa mẫu gói dịch vụ (`delete-package-template`):**
        *   `xóa gói dịch vụ VIP`
        *   `xóa gói VIP`
    *   **Xóa mã Voucher JOY chưa đổi (`delete-voucher`):**
        *   `xóa voucher BDAY-07-XYZ`
        *   `hủy voucher JOY-XYZ`
    *   **Thu hồi gói dịch vụ đã gán cho user (`delete-user-package`):**
        *   `xóa gói của user phucphgcs230327@fpt.edu.vn`
        *   `xóa gói VIP khỏi test@gmail.com`

### 8. Xem chỉ số hệ thống (`stats`)
*   **Mô tả:** In ra thông số CPU, RAM ảo, dung lượng MongoDB, dung lượng Assets và thống kê tài khoản an ninh.
*   **Khẩu lệnh tự do:** `thống kê hệ thống`, `xem thông số`, `stats`

### 9. Tìm kiếm thành viên (`users`)
*   **Mô tả:** Tìm kiếm thành viên hoặc hiển thị danh sách 10 thành viên đăng ký mới nhất.
*   **Khẩu lệnh tự do:** `danh sách user`, `tìm thành viên alice`, `users`

### 10. Khóa / Mở khóa tài khoản (`lock` / `unlock`)
*   **Mô tả:** Khóa hoặc mở khóa quyền truy cập API của thành viên ngay lập tức.
*   **Khẩu lệnh tự do:**
    *   `khóa tài khoản member@example.com`
    *   `unlock member@example.com`

### 11. Bật/tắt AI Bot cộng đồng (`bot`)
*   **Khẩu lệnh tự do:** `bật bot`, `tắt bot`, `bot off`

### 12. Dọn logs sự cố (`clean-logs`)
*   **Khẩu lệnh tự do:** `dọn dẹp logs`, `clean logs`

### 13. Gửi tin nhắn & Email viết bằng AI (`send-ai-notification`)
*   **Mô tả:** Sử dụng AI để tự viết nội dung (tiêu đề email, HTML body email, tin nhắn thông báo push ngắn dưới 200 ký tự) dựa theo chủ đề admin nhập và tự động gửi đồng thời qua kênh email (SendGrid) & thông báo trong ứng dụng (In-App Push).
*   **Khẩu lệnh tự do:**
    *   `Gửi tin nhắn Chào Mừng ngày mới đến tất cả người dùng và mail của người dùng`
    *   `Gửi email chúc mừng năm mới cho phucphgcs230327@fpt.edu.vn`
    *   `Gửi thông báo bảo trì hệ thống tối nay cho tất cả`

### 14. Quản lý ứng viên & thành viên Hugo Team Devs (`hugo-team`)
*   **Mô tả:** Xem danh sách ứng viên, duyệt, từ chối ứng viên, hoặc thực hiện xóa/chặn lập trình viên nếu có hành vi gây hại.
*   **Khẩu lệnh mẫu:**
    *   `/hugo-team list` (Xem các đơn chờ duyệt)
    *   `/hugo-team approve candidate@gmail.com` (Duyệt ứng viên)
    *   `/hugo-team reject candidate@gmail.com` (Từ chối đơn ứng viên)
    *   `xóa lập trình viên candidate@gmail.com` (Xóa hoàn toàn khỏi đội ngũ)
    *   `chặn lập trình viên candidate@gmail.com` (Đình chỉ / Chặn hoạt động và ngược lại)

### 15. Quản lý ticket yêu cầu hỗ trợ (`tickets`)
*   **Mô tả:** Xem danh sách các yêu cầu hỗ trợ đang chờ xử lý và xác nhận giải quyết/đóng ticket.
*   **Khẩu lệnh mẫu:**
    *   `/tickets list`
    *   `/tickets resolve [TICKET_ID]`

### 16. Điều khiển thiết bị IoT thông minh (`iot`)
*   **Mô tả:** Liệt kê danh sách thiết bị IoT trong hệ thống và bật/tắt hoạt động của thiết bị.
*   **Khẩu lệnh mẫu:**
    *   `/iot list`
    *   `/iot toggle den-studio`

### 17. Kiểm duyệt bài viết cộng đồng (`posts`)
*   **Mô tả:** Xem danh sách bài đăng cộng đồng gần đây và gỡ bỏ bài viết vi phạm.
*   **Khẩu lệnh mẫu:**
    *   `/posts list`
    *   `/posts delete [POST_ID]`

### 18. Quản lý đơn hàng Utility Store (`orders`)
*   **Mô tả:** Xem danh sách đơn mua vật phẩm và cập nhật trạng thái đơn hàng (hoàn thành/hủy).
*   **Khẩu lệnh mẫu:**
    *   `/orders list`
    *   `/orders complete [ORDER_ID]`
    *   `/orders cancel [ORDER_ID]`

### 19. Xóa màn hình Terminal (`clear`)
*   **Khẩu lệnh tự do:** `clear`, `xóa màn hình`
