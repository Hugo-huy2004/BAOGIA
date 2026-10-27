# Kế hoạch dọn code — đo ngày 27/10/2026

Đo bằng `knip` (tìm tệp, export và thư viện không ai dùng), xác minh lại từng tệp
bằng `git grep` vì knip không thấy alias của Vite, worker và lazy theo chuỗi.

## Hiện trạng

| Phần | Số tệp | Số dòng |
|---|---|---|
| `src/` (React) | 615 | ~143.700 |
| `server/` (Node) | 291 | ~44.200 |

Tệp to nhất (khó đọc nhất): `server/routes/adminRoutes.js` 2.468 dòng,
`server/routes/bioRoutes.js` 2.220, `server/routes/joyRoutes.js` 1.866,
`src/components/member/shared/ParticleConnectModal.jsx` 1.855,
`src/pages/member/MemberPortalPage.jsx` 1.603.

Backend đang có **ba kiểu tổ chức chồng nhau**: route "béo" tự làm hết (50 tệp
trong `routes/`), một ít `modules/<miền>/` (arcade, auth, chess, coder,
notification, sleep, store), và `controllers/` chỉ còn 1 tệp. Người mới đọc
không biết logic của một tính năng nằm ở đâu — đó là lý do "đọc không hiểu".

## Đã làm (đợt 1, không đổi hành vi)

- Xoá 36 tệp không còn ai dùng: 4 tab admin đã gỡ khỏi bảng điều khiển hôm
  27/10 (AI Workforce, Robot, OAuth Apps, Brain) cùng API client của chúng, bộ
  `ui/swiftui` + `LiquidGlassCard`, cụm EditionMark (và script sinh dữ liệu cho
  nó), 4 hook admin cũ, `joyWalletController` bản trùng trong `modules/joy`, 5
  script server trỏ vào model `VocabCard` đã xoá.
- Gỡ 7 thư viện không còn được import: `@liquidglass/react`,
  `@use-gesture/react`, `@vercel/speed-insights`, `hugo-music`, `img-fx`,
  `metal-fx`, `react-quill-new`. Giữ `patch-package`: không ai import nó nhưng
  bước cài đặt của `@ybouane/liquidglass` gọi lệnh này — knip báo "thừa" là sai.
- Gộp ba bảng tải trước chunk lệch nhau thành mục lục app duy nhất
  `src/components/member/os/appIndex.js`.

## Đợt 2 — xong (PR #10)

Bỏ `export` của 301 khai báo không ai import, xoá 128 khai báo/import chết theo
đó: −1.487 dòng trong 129 tệp.

## Đợt 3 — bước 1 xong: tách ba tệp route lớn nhất theo miền

| Trước | Sau |
|---|---|
| `routes/adminRoutes.js` 2.468 dòng | 21 dòng mục lục + `routes/admin/` (Auth, Users, Commerce, System, `adminShared.js`) |
| `routes/bioRoutes.js` 2.220 dòng | 19 dòng mục lục + `routes/bio/` (Admin, Me, Public, Write, Identity, `bioShared.js`) |
| `routes/joyRoutes.js` 1.866 dòng | 17 dòng mục lục + `routes/joy/` (Wallet, Later, Shop, Rewards, `joyShared.js`) |

Cách làm: tách bằng trình phân tích cú pháp, giữ nguyên từng dòng code; hàm phụ
và limiter vào `*Shared.js` (một bản duy nhất, chung trạng thái). Đã kiểm: bảng
route cũ và mới trùng khớp (admin 62, joy 43, bio 32 — bio trùng cả THỨ TỰ toàn
cục vì có route `/:id` xen giữa), nạp được mọi module, `check:guards` quét đệ
quy thư mục con.

**Bước 2 (còn lại):** chuyển luật nghiệp vụ trong thân route vào class
`XxxService` (không biết Express), route chỉ còn đọc req → gọi service → trả res.
Làm theo từng tệp con, mỗi lần một PR.

## Còn lại (đợt 2–4, làm SAU sự kiện, mỗi đợt một PR)

**(đã làm ở đợt 2)** 460 export trong 169 tệp không ai import (nhiều nhất:
`HugeIcon.jsx` 49, `studentNewsService.js` 19, `joyPrices.js` 11). Bỏ chữ
`export` hoặc xoá hàm nếu trong tệp cũng không dùng. 17 tệp vừa `export const X`
vừa `export default X` — chọn một kiểu.

**Đợt 3 — backend theo miền, hướng đối tượng.** Mỗi miền một thư mục:

```
server/modules/joy/
  joy.routes.js      ← chỉ khai báo đường dẫn + guard, gọi controller
  joy.controller.js  ← đọc req, gọi service, trả res
  JoyService.js      ← class: toàn bộ luật nghiệp vụ, không biết Express
```

Luật nghiệp vụ nằm trong class `XxxService` (một instance dùng chung, nhận
model qua constructor để dễ thay khi kiểm thử). Route không chạm model trực
tiếp. Làm theo thứ tự tệp to nhất trước: admin → bio → joy → telegram. Mỗi
lần tách một miền phải giữ nguyên đường dẫn API và chạy `npm run check:all`.

**Đợt 4 — frontend.** Tách `MemberPortalPage.jsx` (1.603 dòng) thành vỏ portal
+ hook dữ liệu; `ParticleConnectModal.jsx` (1.855) tách theo chế độ
(gửi / mã của tôi / quét). Mỗi app trong `os/appIndex.js` giữ một thư mục riêng
với một `index` duy nhất.

## Luật để không bừa lại

- Thêm app: một dòng manifest ở `shared/appRegistry.js` + một dòng loader ở
  `os/appIndex.js`. Không viết bảng tải trước riêng.
- Thêm route API: một dòng ở `server/services.manifest.js`; luật nghiệp vụ vào
  `XxxService`, không vào tệp route.
- Gỡ tính năng thì gỡ luôn tệp và thư viện của nó trong cùng PR; chạy
  `npx knip` trước khi mở PR, và gỡ thư viện xong thì chạy `npm ci` sạch (thư
  viện có thể chỉ được dùng trong script cài đặt của thư viện khác).
