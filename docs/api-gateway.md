# Cổng API & tách service

## Ý tưởng

Một **bản khai duy nhất** — `server/services.manifest.js` — nuôi ba thứ:

```
server/services.manifest.js
        │
        ├─► server.js                  mount router (đang chung một process)
        ├─► scripts/gen-nginx.mjs      sinh nginx/gateway.conf
        └─► scripts/check-gateway.mjs  chặn khi ba bên trôi khỏi nhau
```

Thêm tính năng mới:

1. Viết `server/routes/abcRoutes.js`, `export default` một `express.Router`.
2. Thêm một dòng vào `SERVICES`.
3. `npm run gen:nginx -- --write`.

Không đụng `server.js`. Trước đây tệp đó có 48 dòng `app.use('/api/...')` viết
tay và nginx không hề biết danh sách ấy.

> Viết route: xem [`server/routes/README.md`](../server/routes/README.md) —
> khuôn mẫu, chọn middleware xác thực, và sáu luật không được phá.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run check:gateway` | đối chiếu bản khai ↔ server.js ↔ nginx.conf (có trong `check:all`) |
| `npm run gen:nginx` | in cấu hình ra màn hình |
| `npm run gen:nginx -- --write` | ghi `nginx/gateway.conf` + `nginx/snippets/` |

`check:gateway` bắt được (đã thử thật, cả ba đều đỏ đúng lúc cần):

- mount tay `app.use('/api/...')` lọt vào `server.js`
- ai đó sửa tay vào `nginx/gateway.conf` (tệp do máy sinh)
- một prefix có nhiều router mà khác `mode` — nginx chỉ trỏ được một nơi
- module trong bản khai không nạp được / không export `Router`
- kênh WS khai trong bản khai nhưng `server.js` không xử lý upgrade

## Tách một service ra process riêng

Đổi một dòng:

```js
{ id: "radio", prefix: "/api/radio", module: "./routes/radioRoutes.js",
  mode: "process", port: 8102 }
```

Rồi `npm run gen:nginx -- --write`. `server.js` thôi mount router đó; nginx sinh
thêm `upstream svc_radio` và trỏ `/api/radio` sang cổng 8102. Không tệp nào khác
phải sửa.

## Vì sao chưa tách thật ngay

Ba rào cản có thật, không phải quan điểm:

**1. Render free không đủ chỗ.** Quota 750 giờ/tháng dùng chung cả workspace.
Một service hiện ăn ~558h (khung giữ ấm 06:00–24:00, xem `tach-tai-render.md`).
Service thứ hai ≈ +558h → vượt trần giữa tháng. Mở thêm tài khoản Render để lách
là vi phạm ToS.

**2. Render không cho đặt nginx trước service.** `nginx/gateway.conf` sinh ra là
để dành cho VPS. Hôm nay vai trò cổng do Vercel rewrites + Cloudflare đảm nhiệm.

**3. Trạng thái nằm trong RAM.** `global.wsClients` (map email → WebSocket),
`node-cache`, và các cron job. Nhân đôi process là cron chạy nhân đôi — trừ tiền
hai lần, gửi push hai lần. Trước khi tách phải gom cron về **một** worker không
nhận request.

## Bio và ví JOY — quyết định

25/49 route đọc `models/Bio.js` (hồ sơ + ví + quyền gộp làm một). Nhưng đã kiểm:

```
Chỗ GHI ví ngoài utils/joyService.js:  (không có)
```

`joyService.awardJoy()` là **đường ghi ví duy nhất**. Ba chỗ khác chạm
`joyBalance` đều chỉ đọc, trừ `memberAuthRoutes.js` gieo số dư ban đầu lúc tạo
tài khoản.

**Chọn: dùng chung MongoDB, giữ `joyService.js` làm ranh giới ví.**

Lý do — hỏi "dễ bảo trì nhất" thì đây là câu trả lời:

- Ranh giới **đã tồn tại và đang sạch**. Không phải viết lại 25 file.
- Ngày tách `wallet-svc`, chỉ ruột `awardJoy()` đổi từ gọi Mongo sang gọi HTTP.
  25 route gọi nó không đổi một dòng.
- Làm ngược lại (bắt Radio gọi HTTP sang wallet ngay bây giờ) là thêm một chặng
  mạng, thêm retry, thêm idempotency key để khỏi trừ tiền hai lần — đổi lấy số
  không, khi tất cả vẫn đang chung một process.

**Luật cần giữ:** không route nào được `$inc`/`$set` thẳng `joyBalance`. Mọi thay
đổi ví đi qua `joyService`. Vi phạm luật này là phá ranh giới, và ngày tách
service sẽ phải trả bằng một đợt refactor lớn.

## Lối đi tiếp, khi chuyển VPS

Thứ tự này giảm rủi ro dần:

1. Dựng nginx trước Node **một process** (dùng `gateway.conf` sinh sẵn). Được
   TLS, rate-limit, cache ở tầng cổng mà không đụng code.
2. Gom cron ra một worker riêng, không nhận request. Đây là điều kiện bắt buộc
   trước mọi việc tách.
3. Tách `wallet-svc` từ `joyService`. Nó là ranh giới sạch nhất đang có.
4. Tách `realtime-svc` (`/ws`, `/ws/chess`) — cần Redis thay cho
   `global.wsClients`, vì map trong RAM không chia được giữa các process.
5. Tách dần các app lá (`radio`, `arcade`, `cinema`, `stock`): chúng phụ thuộc ít
   nhất, chỉ cần đọc Bio và gọi `wallet-svc`.

## Ghi chú

- `metaWebhookRoutes.js` được import nhưng **chưa từng mount**. Không đưa vào bản
  khai. Xoá hoặc mount hẳn, đừng để lơ lửng.
- `/.well-known/oauth-authorization-server` cố ý đứng ngoài bản khai: nó là một
  handler ở đường tuyệt đối, không phải router gắn theo prefix.
- Cấu hình sinh ra dùng `location ^~ /api/x` chứ không phải `/api/x/`. Có gạch
  chéo cuối thì nginx không khớp `/api/packages` trần — mà đó là lời gọi thật.
