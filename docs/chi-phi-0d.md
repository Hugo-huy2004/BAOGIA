# Chi phí 0đ — hệ thống phi lợi nhuận

Hugo Studio **không dùng gói trả phí nào**. Mọi dịch vụ chạy ở gói miễn phí; khi
một hạn mức hết, tính năng phải **dừng/rơi về phương án khác**, không bao giờ
bắt đầu tính tiền. Nguyên tắc chung: **không nhập thẻ thanh toán** vào bất kỳ
dịch vụ nào bên dưới — không có thẻ thì không dịch vụ nào trừ tiền được.

| Dịch vụ | Dùng cho | Gói | Hạn mức miễn phí chính | Hết hạn mức thì |
|---|---|---|---|---|
| Render | Node backend | Free (`render.yaml: plan: free`) | 750 giờ/tháng, 0,1 CPU, ngủ khi rảnh | Worker Cloudflare giữ thức; vượt giờ thì dừng tới tháng sau |
| Vercel | Web tĩnh + Python AI (serverless) | Hobby | Băng thông/giờ chạy hàm của Hobby | Vercel tạm dừng, không tính tiền |
| Cloudflare | DNS, WAF, Transform/Cache Rule, Worker keep-alive | Free | 5 WAF rule, 10 rule mỗi loại, Worker 100k req/ngày | Không tính tiền |
| MongoDB Atlas | Cơ sở dữ liệu | M0 | 512MB, không có backup tự động | Ghi bị từ chối khi đầy |
| Gemini (Google AI Studio) | AI | Free tier | Theo model, mỗi khoá | `aiGateway` tự dừng mọi cuộc gọi khi chạm trần ngày |
| Groq / Workers AI | AI dự phòng (Python) | Free | Theo ngày | Lỗi → dùng nhánh khác |
| SendGrid | Email | Free | Theo gói tài khoản | Gửi thất bại, form báo lỗi |
| Cloudinary | Ảnh | Free | Credit/tháng | Upload thất bại |
| Sentry | Theo dõi lỗi | Developer | 5.000 lỗi/tháng | Ngừng nhận lỗi tới tháng sau |
| Telegram, Google OAuth, Web Push | Bot admin, đăng nhập, thông báo | Miễn phí | — | — |
| NewsAPI / GNews / IPinfo | Tin tức, vị trí | Free | Theo ngày | Bản tin trống, không tính tiền |
| OpenStreetMap Nominatim | Đối chiếu điểm ghim địa chỉ với bản đồ (`server/utils/reverseGeocode.js`) | Miễn phí, không khoá | 1 lượt/giây (code tự giãn 1,1 s + cache 24h) | Trả `unchecked`, vẫn lưu, admin thấy cờ |

## Chốt chặn trong code để không vượt gói

- **Gemini**: `server/services/aiGateway.js` dừng **mọi** cuộc gọi (kể cả tương
  tác) khi chạm `GEMINI_RPD_LIMIT`. Kiểm tra trong Google AI Studio rằng các khoá
  thuộc project **chưa bật Billing** — đó là chốt chặn thật; trần trong code là
  lớp phụ.
- **Không còn Redis/Upstash** (gỡ 31/10/2026): cache, trần lượt, online, khoá
  chống gửi lặp đều ở RAM của tiến trình Node duy nhất. Xoá luôn database Upstash
  và biến `REDIS_URL` trên Render.
- **Atlas 512MB**: cảnh báo lặp (ví dụ "AI chạm trần") ghi tối đa một dòng mỗi 5
  phút thay vì một dòng mỗi request.

## Kiểm tra mỗi tháng (5 phút)

1. Render → **Usage**: giờ chạy dưới 750.
2. Atlas → dung lượng dưới 512MB.
3. Google Cloud Console → **Billing**: các project chứa khoá Gemini **không** gắn
   tài khoản thanh toán.
