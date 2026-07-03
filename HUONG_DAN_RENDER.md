# Hướng Dẫn Setup Render (Tiếng Việt)

## Vấn đề hiện tại

Backend server không thể khởi động trên Render vì thiếu 2 biến môi trường bắt buộc:
- `JWT_SECRET` — khóa bí mật để mã hóa token đăng nhập
- `JOY_QR_SECRET` — khóa bí mật cho QR code giao dịch Joy

Khi không có 2 biến này, server sẽ crash ngay lập tức.

## Bước 1: Tạo khóa bí mật (chạy trên máy của bạn)

Mở Terminal/PowerShell và chạy 2 lệnh sau:

```bash
openssl rand -hex 32
```

Kết quả sẽ là một chuỗi 64 ký tự hex, ví dụ:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
```

**Lưu lại chuỗi này → Đây là JWT_SECRET**

Chạy lệnh lại lần 2:

```bash
openssl rand -hex 32
```

Kết quả tiếp theo (khác chuỗi trước) → Đây là JOY_QR_SECRET

## Bước 2: Đăng nhập Render Dashboard

1. Mở trình duyệt
2. Truy cập: https://dashboard.render.com
3. Đăng nhập với tài khoản Render của bạn

## Bước 3: Chọn Service

1. Ở trang chủ Render Dashboard, bạn sẽ thấy danh sách services
2. Tìm service có tên `hugostudio-api` (hoặc tên tương tự)
3. **Click vào service đó**

## Bước 4: Mở Tab Environment

1. Sau khi click vào service, bạn sẽ thấy các tab ở đầu trang
2. Tìm và **click tab "Environment"** (hoặc "Environment Variables")
3. Bạn sẽ thấy một form để thêm biến môi trường

## Bước 5: Thêm JWT_SECRET

1. Click nút **"Add Environment Variable"** (hoặc **"+"**)
2. Nhập:
   - **Key** (tên biến): `JWT_SECRET`
   - **Value** (giá trị): Dán chuỗi 64 ký tự bạn vừa tạo ở bước 1
3. Click **"Save"** hoặc **"Add"**

Ví dụ:
```
Key:   JWT_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
```

## Bước 6: Thêm JOY_QR_SECRET

1. Click nút **"Add Environment Variable"** lần nữa
2. Nhập:
   - **Key**: `JOY_QR_SECRET`
   - **Value**: Dán chuỗi 64 ký tự thứ 2 từ bước 1
3. Click **"Save"**

## Bước 7: Kiểm tra và Redeploy

Sau khi thêm 2 biến xong:

1. Ở phía bên phải, bạn sẽ thấy nút **"Manual Deploy"** hoặc **"Redeploy"**
2. Click nó để Render khởi động lại server với 2 biến môi trường mới
3. **Chờ ~2-3 phút** để server khởi động xong

Bạn sẽ thấy dòng text in ra khi server khởi động:
- Nếu thành công: `✅ MongoDB connected successfully` (màu xanh)
- Nếu lỗi: Sẽ hiện thông báo lỗi (màu đỏ)

## Bước 8: Kiểm tra Server Hoạt Động

Mở Terminal và chạy:

```bash
curl -i https://api.hugowishpax.studio/health
```

Kết quả mong muốn:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"Server is running","timestamp":"2026-07-03T..."}
```

**Nếu còn 404**, service chưa sẵn sàng hoặc tên domain sai. Chờ 1-2 phút rồi thử lại.

## Bước 9: Kiểm tra Google Login

Mở trình duyệt và vào: https://hugowishpax.studio

Thử đăng nhập bằng Google → nếu không còn lỗi 404, là thành công!

---

## Ghi chú quan trọng

### ⚠️ KHÔNG nên

- Không commit/push khóa bí mật vào GitHub (các khóa đó chỉ nên ở Render)
- Không chia sẻ khóa bí mật cho ai
- Không sử dụng cùng 1 khóa cho nhiều environment (dev/staging/production)

### ✅ NÊN

- Giữ khóa bí mật an toàn (lưu vào password manager nếu cần)
- Nếu lo lắng khóa bị rò rỉ, hãy tạo khóa mới bằng lệnh `openssl rand -hex 32` rồi cập nhật lại Render
- Kiểm tra Render logs nếu server vẫn crash

---

## Các Biến Môi Trường Khác (Tùy Chọn)

Ngoài `JWT_SECRET` và `JOY_QR_SECRET`, bạn có thể cần thêm:

| Tên Biến | Giải Thích | Ví Dụ |
|----------|-----------|-------|
| `MONGODB_URI` | Kết nối MongoDB (bắt buộc nếu chưa có) | `mongodb+srv://user:pass@cluster.mongodb.net/hugo_wishpax` |
| `PAYOS_CLIENT_ID` | Client ID từ PayOS | *(lấy từ PayOS dashboard)* |
| `PAYOS_API_KEY` | API Key từ PayOS | *(lấy từ PayOS dashboard)* |
| `PAYOS_CHECKSUM_KEY` | Checksum Key từ PayOS | *(lấy từ PayOS dashboard)* |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | *(phải giống với frontend VITE_GOOGLE_CLIENT_ID)* |
| `GEMINI_API_KEY` | (Tùy chọn) Để dùng AI | *(lấy từ Google AI Studio)* |

---

## Nếu vẫn có vấn đề

1. **Kiểm tra Render logs**:
   - Vào service → tab "Logs"
   - Xem dòng cuối cùng có lỗi gì không

2. **Kiểm tra tên domain**:
   - Đảm bảo tên domain là `api.hugowishpax.studio` (không phải `hugowishpax.studio`)
   - Frontend nên dùng `VITE_API_URL=https://api.hugowishpax.studio/api`

3. **Reset service**:
   - Nếu vẫn lỗi, bạn có thể xóa service rồi tạo lại (nhưng sẽ mất dữ liệu)

---

## Liên hệ hỗ trợ

Nếu cần giúp:
- Kiểm tra Render Status: https://status.render.com
- Render Docs: https://render.com/docs
