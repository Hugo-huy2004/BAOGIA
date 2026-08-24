# `server/routes/` — quy ước chung & cách thêm một service

Mỗi tệp ở đây là **một service**: một `express.Router` gắn vào một prefix, khai
trong [`server/services.manifest.js`](../services.manifest.js). Kiến trúc cổng
API ở [`docs/api-gateway.md`](../../docs/api-gateway.md); tệp này nói về *viết
route*.

---

## Thêm một service mới — 3 bước

**1. Tạo `server/routes/abcRoutes.js`**

```js
import express from 'express';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/abc/state — danh tính lấy từ token đã xác thực
router.get('/state', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;          // KHÔNG BAO GIỜ lấy từ req.query
    res.json({ ok: true, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;                       // bắt buộc: export default
```

**2. Khai một dòng trong `SERVICES`**

```js
{ id: "abc", prefix: "/api/abc", module: "./routes/abcRoutes.js" },
```

**3. Sinh lại cấu hình cổng và kiểm**

```bash
npm run gen:nginx -- --write
npm run check:gateway
```

Không đụng `server.js`. Đường dẫn trong router là **tương đối với prefix**:
`router.get('/state')` ở prefix `/api/abc` → `GET /api/abc/state`.

### Trường khai được

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `id` | ✓ | duy nhất; thành tên upstream nginx và tên container sau này |
| `prefix` | ✓ | phải bắt đầu bằng `/api/` |
| `module` | ✓ | phải trỏ vào `./routes/` |
| `guard` | | **tên** middleware chặn ở cổng vào (vd `"requireAdultMember"`); server.js tra trong bảng `GUARDS` |
| `public` | | ghi chú: route cố ý không cần đăng nhập |
| `cacheable` | | route tự đặt `s-maxage` → nginx được phép cache |
| `mode` / `port` | | `"process"` = chạy process riêng (xem `docs/api-gateway.md`) |

Bản khai là **dữ liệu thuần** — đừng `import` gì vào đó. Bộ sinh nginx phải đọc
được nó mà không kéo theo mongoose, nếu không sinh một tệp cấu hình lại mở kết
nối database.

---

## Chọn cổng xác thực

Từ [`../middleware/authMiddleware.js`](../middleware/authMiddleware.js):

| Middleware | Dùng khi | Gắn vào `req` |
|---|---|---|
| `requireMember` | hầu hết route thành viên | `req.memberEmail`, `req.member` |
| `requireAdultMember` | tính năng 18+ (mảng: `requireMember` + cổng tuổi) | thêm `req.memberAge` |
| `attachMemberAge` | cần biết tuổi nhưng **không** chặn | `req.memberAge` (có thể `null`) |
| `rejectMinorActor` | hành động không cho vị thành niên thực hiện | — |
| `requireAdmin` | route quản trị (cookie `jwt` riêng) | `req.admin` |
| `requireCustomer` | cổng khách hàng dự án (cookie `customer_jwt`) | `req.customer` |
| `requireMemberSession` | chỉ cần phiên, chưa cần hồ sơ đầy đủ | `req.memberEmail` |

`requireMember` làm nhiều hơn là kiểm chữ ký token — nó còn chặn email trong sổ
đen, chặn khi phát hiện vị trí bất thường, và chặn tài khoản chưa chọn đơn vị
JOY (`PROFILE_INCOMPLETE`). Đừng tự verify JWT trong route để "cho nhanh": làm
vậy là bỏ qua cả ba lớp đó.

---

## Sáu luật không được phá

Mỗi luật đều có lý do đã trả giá, và phần lớn có bộ kiểm tự động.

### 1. Danh tính lấy từ token, không lấy từ request

```js
const email = req.memberEmail;             // ✅
const email = req.query.email;             // ❌ ai cũng đổi được thành email người khác
```

Đọc `?email=` để *tra cứu* thì được — miễn nó không quyết định *ai đang hành
động*, **và** dữ liệu trả về đúng là công khai.

Đợt rà 2026-08-24 tìm ra 15 route vi phạm luật này và **đã vá hết**:

| Nơi | Vấn đề |
|---|---|
| `packageRoutes.js` (9 route) | cả tệp không có cổng nào — ai cũng tự cấp gói trả phí, xoá gói, sửa bảng giá |
| `webauthnRoutes.js` (2) | liệt kê và **xoá passkey** của bất kỳ email nào |
| `cinemaRoutes.js /admin/*` (5) | thêm/xoá/đồng bộ phim không cần quyền |
| `chessRoutes.js /history`, `/stats` | đọc lịch sử ván cờ của email bất kỳ |
| `chessRoutes.js /leaderboard` | `.select('-__v')` phát **email mọi người chơi** ra bảng công khai |
| `presenceRoutes.js /status` | dò email tồn tại + theo dõi giờ online |
| `robotRoutes.js /kill-switch` | ngắt camera robot + bắn cảnh báo Telegram cho chủ nhà |
| `coderLessonRoutes.js /ai-mentor-debug` | đốt quota Gemini, không xác thực |
| `dataRoutes.js /psychology-chat` | như trên, lại còn đi vòng qua `aiGateway` |

Bài học: `.select('-__v')` là **danh sách loại trừ** — thêm trường mới vào model
là nó tự lọt ra ngoài. Dùng danh sách cho phép:
`.select('displayName avatar rating wins')`.

`npm run check:guards` giờ canh việc này: mọi route phải có cổng, hoặc có tên
trong `PUBLIC_ROUTES` **kèm lý do**. Không có cửa thứ ba.

### 2. Ghi ví chỉ qua `joyService`

```js
import { awardJoy } from '../utils/joyService.js';
await awardJoy(email, 50, 'arcade_win', 'Thắng ván Arcade');

await Bio.updateOne({ email }, { $inc: { joyBalance: 50 } });   // ❌ cấm
```

`awardJoy` kiểm `source` hợp lệ **trước** khi chạm ví (nguồn lạ từng làm tăng
số dư rồi mới lỗi lúc ghi sổ, để lại phần thưởng lặp được), ghi `JoyLedger`, và
là ranh giới để tách `wallet-svc` sau này. Hiện đây là đường ghi ví **duy nhất**
trong toàn bộ `routes/` — đừng là người đầu tiên phá.

### 3. Thông báo qua `notifyMember`, truyền khoá chứ không truyền câu

```js
import { notifyMember } from '../utils/notifyMember.js';
await notifyMember({
  email,
  key: 'event.adminBonus',        // khoá có thật trong NOTIFICATION_TEXT
  params: { amount: 500 },
  type: 'success',
  category: 'joy',
});
```

Viết thẳng câu tiếng Việt vào DB thì người dùng đặt ngôn ngữ khác vẫn nhận tiếng
Việt, và không sửa được vì câu đã nằm trong bản ghi. 62 khoá khai ở [`shared/notificationText.js`](../../shared/notificationText.js)
theo hai nhóm — `source.*` (nguồn cộng JOY) và `event.*` (sự kiện). Khoá lạ ném
`UNKNOWN_NOTIFICATION_KEY` ngay lúc gọi, nên thêm khoá vào tệp đó **trước**.
Tệp có đủ 9 ngôn ngữ; thiếu bản dịch nào thì người dùng ngôn ngữ đó không có gì
để đọc.

### 4. Cache: mặc định là riêng tư

`server.js` tự đặt `Cache-Control: private, no-store` cho mọi response chưa khai
gì. Cloudflare có Cache Rule cho `/api/*`, nên **quên header = có ngày phát dữ
liệu của người này cho người khác**.

Muốn cho cache thì phải nói rõ, và khai `cacheable: true` trong bản khai:

```js
res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
```

Chỉ làm vậy khi response **không đổi theo người đọc**. Kiểm:
`node server/scripts/check-cache-headers.mjs`

### 5. Gọi Gemini qua `aiGateway`

```js
// ✅ qua cổng: quota, cache, retry, hạ model, kill-switch
import { generate, embed, getQuotaStatus } from '../services/aiGateway.js';
const answer = await generate(prompt, { cacheKey, cacheTtlMs: 60_000 });

// ❌ gọi thẳng SDK trong route handler
import { GoogleGenerativeAI } from '@google/generative-ai';
```

### 6. Cổng độ tuổi phải ở server

Ẩn nút trên giao diện là chưa đủ — client gọi thẳng API được. Tính năng 18+ dùng
`requireAdultMember`.

---

## Khuôn xử lý lỗi

Quy ước hiện tại: `try/catch` trong từng handler, trả JSON có khoá `error`.

```js
router.post('/action', requireMember, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount không hợp lệ' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- Không dùng thư viện validate (zod/joi) — kiểm tay ở đầu handler.
- Lỗi lọt ra ngoài sẽ rơi vào global error handler của `server.js`: nó ghi
  Sentry + báo `server_specialist` rồi trả 500 chung. Dùng được, nhưng bắt tại
  chỗ thì thông báo cho người dùng rõ hơn.
- Mã lỗi dạng chuỗi (`PROFILE_INCOMPLETE`, `AGE_RESTRICTED`) dành cho trường hợp
  client cần **phân nhánh** theo lỗi, không chỉ hiển thị.

---

## Trước khi commit

```bash
npm run check:gateway     # bản khai ↔ server.js ↔ nginx.conf
npm run check:guards      # mọi route có cổng, hoặc công khai có lý do
npm run check:all         # gồm cả hai lệnh trên
```

`check:guards` sẽ đỏ nếu:

- route mới **không có cổng** và chưa khai là công khai
- ai đó gỡ cổng của một route đang có (hồi quy)
- `PUBLIC_ROUTES` còn dòng thừa cho route đã vá hoặc đã xoá

`check:gateway` sẽ đỏ nếu:

- tệp `routes/*.js` mới **chưa khai** trong `SERVICES` (hoặc chưa nêu lý do
  trong `UNMOUNTED`) ← lỗi hay gặp nhất
- module không nạp được / không `export default` một Router
- lén `app.use('/api/...')` thẳng trong `server.js`
- `nginx/gateway.conf` lệch với bản khai
- một prefix có nhiều router mà khác `mode`

---

## Bẫy đã gặp thật

- **Nhiều router chung một prefix.** `/api/store` có ba (`cart`, `promo`,
  `plan`). Express cho phép; nginx thì chỉ trỏ được một prefix tới một nơi. Nếu
  tách thì phải tách **cả cụm** cùng lúc.
- **Prefix lồng nhau.** `/api/admin` khai **trước** `/api/admin/brain`. Express
  khớp theo thứ tự mảng, nginx khớp theo prefix dài nhất — thứ tự hiện tại đúng
  cho cả hai, đảo lại là hỏng Express.
- **Đường trần không có gạch chéo.** `GET /api/packages` (không có gì phía sau)
  là lời gọi thật, phục vụ bởi `router.get('/')`. Vì vậy nginx sinh ra dùng
  `location ^~ /api/packages` chứ không phải `/api/packages/`.
- **Import ESM chạy trước `dotenv.config()`.** Đừng khởi động thứ gì cần biến
  môi trường ngay lúc import module — lúc đó `process.env` còn rỗng và nó chết
  im lặng. Gọi tường minh trong `server.js` (xem `initTelegramBot()`).
- **Route mới trả 404 ở dev** thường không phải lỗi code: backend đang chạy bản
  cũ. Dấu hiệu rõ: route có `requireMember` mà trả **404** thay vì **401**.
