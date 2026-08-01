# Push cho bản App Store / CH Play

Web Push (VAPID + service worker) **không chạy** trong WebView của iOS, và bản
native không có service worker để nhận. Vì vậy hai bản dùng hai đường khác nhau:

| Bản | Đường push | Trạng thái |
|---|---|---|
| Web (PWA) | Web Push / VAPID | đang chạy, không đổi |
| Android (Play) | FCM | client + lưu token: xong. Gửi: **cần credential** |
| iOS (App Store) | APNs | client + lưu token: xong. Gửi: **cần credential** |

## Đã có trong repo

- `src/services/pushService.js` — một facade duy nhất. Call site không được tự
  phân nhánh theo nền tảng.
- `src/config/platform.js` — `IS_NATIVE`, đặt lúc build qua `VITE_BUILD_TARGET`.
- `server/models/NativePushDevice.js` — lưu token thiết bị native.
- `POST /api/notifications/native/subscribe` và `/native/unsubscribe`
  (đều qua `requireMember`).

Model để riêng, không gộp vào `NotificationSubscription`, vì schema đó bắt buộc
`subscription.endpoint` và đánh `unique` — thiết bị native không có endpoint,
nên nhiều bản ghi `endpoint: null` sẽ vi phạm unique index. Sửa index đó đồng
nghĩa với việc drop một index đang phục vụ web push.

## Chưa có — cần tài khoản của bạn

Phần **gửi** notification chưa nối, vì nó cần credential không thể tạo hộ:

1. **Android / FCM**
   - Tạo project Firebase, thêm app Android với `applicationId`
     `studio.hugowishpax.app`.
   - Tải `google-services.json` → đặt vào `android/app/`.
   - Server: thêm service account key, dùng `firebase-admin` để gửi.

2. **iOS / APNs**
   - Cần Apple Developer Program ($99/năm).
   - Tạo APNs Auth Key (.p8), ghi lại Key ID và Team ID.
   - Bật capability Push Notifications trong Xcode.
   - Server: dùng `node-apn` hoặc gửi qua FCM (FCM chuyển tiếp được sang APNs,
     đỡ phải nuôi hai đường gửi).

**Gợi ý:** cho cả hai đi qua FCM. Server chỉ cần một thư viện và một luồng gửi,
FCM tự chuyển tiếp sang APNs cho iOS.

## Khi có credential thì nối ở đâu

`server/routes/notificationRoutes.js` hiện gửi web push bằng
`webpush.sendNotification(sub.subscription, payload)`. Chỗ gửi cho native là
truy vấn `NativePushDevice` theo email rồi gửi qua FCM — thêm song song, không
thay thế, vì bản web vẫn phải chạy.
