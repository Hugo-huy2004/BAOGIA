# Tách tải khỏi Render — hướng dẫn deploy

Mục tiêu: đưa mức dùng Render free từ **~730h/tháng** (chạm trần 750h, service bị
`suspend`) xuống **~558h/tháng**, đồng thời bỏ Python ra khỏi hộp 512MB và cho
Cloudflare gánh băng thông.

Nguyên tắc: **chia theo nền tảng, không chia theo tài khoản.** Render tính tiền
theo *giờ chạy*, Vercel/Cloudflare tính theo *request*. Thứ gì không cần một
process sống lâu thì không nên nằm trên Render. (Nhân tiện: mở nhiều tài khoản
Render để lách quota free là vi phạm ToS của họ — rủi ro khoá cả hai — và cũng
không chạy được vì server này giữ state trong RAM: WebSocket, node-cache, và 17
cron job sẽ chạy nhân đôi.)

---

## Thay đổi đã có trong code

| Việc | File |
|---|---|
| Bỏ self-ping 24/7 (thủ phạm đốt hết quota giờ) | `server/server.js`, xoá `server/utils/keepAlive.js` |
| Ping từ ngoài, chỉ trong khung 06:00–24:00 VN | `workers/keepalive/` |
| Chốt chặn `Cache-Control: private, no-store` mặc định | `server/server.js` |
| Python FastAPI chạy được trên Vercel | `python-ai-server/api/index.py`, `vercel.json`, `.vercelignore` |
| Bộ nhớ HugoPSY ghi vào thư mục tạm (FS serverless chỉ đọc) | `python-ai-server/services/memory_service.py` |
| Render chỉ còn build/chạy Node | `render.yaml`, `start.sh` (bỏ uvicorn, giữ lại file) |

Kiểm tra chốt chặn cache: `node server/scripts/check-cache-headers.mjs`

---

## Bước 1 — Deploy Python AI lên Vercel ✅ ĐÃ XONG

Project: **`<vercel-team>/hugostudio-ai`** → https://hugostudio-ai.vercel.app

Đã kiểm chứng trên bản production:

| Kiểm tra | Kết quả |
|---|---|
| `GET /health` | `200` — `api_key_count: 3`, model `gemini-2.5-flash` |
| `POST /api/ai/intent/classify` **không** có key | `401` — không phải proxy Gemini mở toang |
| `POST /api/ai/intent/classify` **có** `X-Internal-Key` | `200` trong 3.4s |
| `GET /api/ai/chat/remaining` (đọc MongoDB) | `200` — `{"remaining":20,"max":20}` |

Deploy lại về sau: `cd python-ai-server && npx vercel@latest deploy --prod`
(CLI cài toàn cục đang là 41.4.1, quá cũ so với yêu cầu 47.2.2 của API — dùng
`npx vercel@latest` hoặc `npm i -g vercel@latest`).

Biến môi trường đã nạp sẵn cho scope **Production**:

| Biến | Ghi chú |
|---|---|
| `INTERNAL_API_KEY` | lấy từ `python-ai-server/.env` (trùng với `server/.env`) |
| `GEMINI_API_KEY`, `_2`, `_3` | 3 khoá xoay vòng |
| `MONGODB_URI` | dùng cho rate-limit theo ngày (TTL index) |
| `OPENROUTER_API_KEY` | provider dự phòng |
| `TELEMETRY_SALT` | chưa đặt — fallback về `INTERNAL_API_KEY`, không sao |
| `GROQ_API_KEY`, `CEREBRAS_API_KEY` | chưa có, tuỳ chọn |

### ⚠️ `INTERNAL_API_KEY` — đã phải xoay khoá 31/7

Render **chưa từng có** biến này. Trước đây không sao: Python chạy `localhost:8000`
trong cùng container, cả hai bên đều rỗng nên middleware `verify_internal_key`
tự tắt (`if INTERNAL_API_KEY and ...`). Giờ Python nằm ở URL Vercel công khai,
khoá này là **thứ duy nhất** chặn người lạ gọi thẳng vào và đốt quota Gemini.

Giá trị cũ **không dùng được**: nó trùng đúng với `VITE_INTERNAL_API_KEY`, mà biến
`VITE_*` bị Vite nhúng thẳng vào bundle trình duyệt — tìm thấy trong 4 file
`dist/assets/*.js` đang phục vụ công khai. Ai xem source trang web cũng đọc được.

Đã xử lý: sinh khoá mới bằng `openssl rand -hex 32`, cập nhật `server/.env`,
`python-ai-server/.env` và Vercel production, deploy lại. Kiểm chứng: khoá cũ trả
`401`, khoá mới trả `200`.

**Việc còn lại của bạn: thêm `INTERNAL_API_KEY` (khoá mới) vào Render.** Chưa thêm
thì mọi `/api/ai/*` sẽ trả 401 ngay khi `AI_SERVER_URL` trỏ sang Vercel.

Lấy lại giá trị bất cứ lúc nào:
```bash
grep '^INTERNAL_API_KEY=' server/.env | cut -d= -f2- | tr -d '\n' | pbcopy
```

**Dọn dẹp nên làm sau:** `VITE_INTERNAL_API_KEY` giờ là giá trị chết. Node **không
hề** kiểm tra header `X-Internal-Key` (đã grep `server/middleware`, `server/server.js`
— không có chỗ nào đọc), nên 4 chỗ ở frontend gửi header này là vô nghĩa:
`src/services/api.js`, `src/services/classes/CompanionBot/AIBot.js`,
`src/components/member/banhocduong/SleepTracker.jsx`, `DepressionCbtTherapy.jsx`.
Xoá cả biến lẫn header đi cho khỏi tưởng nhầm là có bảo mật.

**Lưu ý:** `/ws/iot` trong `main.py` không chạy trên serverless. Nó là code chết —
không có client nào kết nối tới (luồng IoT thật đi qua `POST /api/iot/vitals` của
Node). Chỉ cần biết để sau này đừng dựa vào nó.

## Bước 2 — Render (còn phải làm)

1. Push code lên GitHub (Render deploy từ đó).
2. Dashboard → service → Environment → thêm:
   `AI_SERVER_URL` = `https://hugostudio-ai.vercel.app`
3. Đối chiếu `INTERNAL_API_KEY` với giá trị đã nạp lên Vercel.
4. **Manual Deploy → Clear build cache & deploy.**

Build giờ chỉ còn `npm install --prefix server` — không cài pip, không chạy
uvicorn. Log khởi động sẽ không còn dòng `🐍 Khởi động Python AI server`.

`start.sh` được giữ lại (chỉ còn chạy Node) thay vì xoá: nếu service được tạo tay
chứ không qua Blueprint thì ô **Start Command** trong dashboard vẫn đang lưu
`bash start.sh`, xoá file là deploy kế tiếp chết ngay. Nhớ sửa **Build Command**
trong dashboard thành `npm install --prefix server` (bỏ dòng `pip install`) —
`render.yaml` chỉ có tác dụng với service quản lý bằng Blueprint.

> Hiện service đang `503 / x-render-routing: suspend` vì hết quota giờ của tháng 7.
> Quota reset đầu tháng 8, service tự sống lại — nhưng phải deploy code này thì
> tháng sau mới không chết lại giữa chừng.

## Bước 3 — Cloudflare Worker giữ ấm ✅ ĐÃ XONG

Đã deploy, cron đã gắn, đã bắt được lần chạy thật trong log:
`"*/10 23,0-16 * * *" @ 7/31/2026, 9:30:17 PM - Ok` (21:30 VN = 14:30 UTC ✓).

Xem log thật: `npx wrangler tail hugostudio-keepalive`

```bash
cd workers/keepalive
npx wrangler deploy
```

> **Bẫy đã gặp:** deploy sẽ báo `code: 10063 — You need a workers.dev subdomain`
> và `No targets deployed`, dù `workers_dev = false`. Cloudflare bắt buộc **tài
> khoản** phải có subdomain workers.dev tồn tại thì mới cho gắn bất kỳ trigger
> nào, kể cả cron của worker không hề dùng URL công khai. Vào dashboard →
> **Workers & Pages** đăng ký một lần là xong (tài khoản này là
> `hugowishpax.workers.dev`). Wrangler 4 không có lệnh CLI nào làm việc này.

Trước khi chạy, mở `wrangler.toml` sửa `PING_URL` cho khớp URL `*.onrender.com`
thật của bạn. **Cố ý dùng URL onrender.com chứ không phải `api.hugowishpax.studio`** —
tên miền đó đi qua Cloudflare và có thể bị cache, ping như vậy sẽ không chạm tới
origin để đánh thức.

Cron `*/10 23,0-16 * * *` (UTC) = 06:00–24:00 giờ VN, 18h/ngày ≈ **558h/tháng**.
Muốn tiết kiệm hơn nữa thì thu hẹp khung giờ; đổi ở đây không cần deploy backend.

Khung giờ này đã phủ hết cron hiện có: push 07:00–21:30 VN
(`smartNotificationService`), dọn JoyLedger 00:00 UTC = 07:00 VN (`cronJobs`).
**Nếu sau này thêm cron ngoài 06:00–24:00 VN thì nó sẽ không bao giờ chạy** — nhớ
nới khung giờ hoặc chuyển việc đó sang Worker.

Ngoài khung giờ, Render ngủ sau ~15 phút. Người dùng đầu tiên buổi sáng vẫn đánh
thức được (request thật cũng wake service), chỉ chịu ~30–60s cold start; Worker
lúc 06:00 là để tránh chính chuyện đó.

## Bước 4 — Cloudflare Cache Rule (giảm băng thông Render)

Hiện `cf-cache-status: DYNAMIC` — Cloudflare đang đứng trước `api.hugowishpax.studio`
nhưng **không cache gì cả**, mọi request đập thẳng vào Render.

Dashboard → chọn zone → **Rules → Cache Rules → Create rule**:

- **When incoming requests match** — chọn *Custom filter expression*, dán:

  ```
  (http.host eq "api.hugowishpax.studio" and http.request.method eq "GET" and (
     starts_with(http.request.uri.path, "/api/bios/slug/")
     or starts_with(http.request.uri.path, "/api/bios/certificate/")
     or starts_with(http.request.uri.path, "/api/bios/discover/logo")
     or starts_with(http.request.uri.path, "/api/coder-lessons")
     or http.request.uri.path eq "/api/packages"
     or http.request.uri.path eq "/api/data"
  ))
  ```

- **Cache eligibility**: `Eligible for cache`
- **Edge TTL**: `Use cache-control header from origin` — các route trên đã tự đặt
  `s-maxage` sẵn trong code, để origin quyết định là đúng nhất.
- **Browser TTL**: `Respect origin`

Bật thêm **Speed → Optimization → Brotli** và **Caching → Tiered Cache**.

### Vì sao dùng whitelist chứ không phải `/api/*`

Rule kiểu `starts_with(path, "/api/")` sẽ cache luôn response chứa dữ liệu của
một member cụ thể rồi trả nhầm cho người khác. Chốt chặn `private, no-store` ở
`server/server.js` đã bịt lỗi này, nhưng whitelist là lớp phòng thủ thứ hai —
giữ cả hai.

**Cố ý không cache `/api/today/feed`**: nó đổi nội dung theo header quốc gia
(`cf-ipcountry`), mà cache key mặc định của Cloudflare chỉ tính URL — cache sẽ
phát feed của một nước cho tất cả. Header `max-age` của nó vẫn cho browser cache,
đó là phần lợi ích chính rồi.

---

## Kiểm tra sau khi xong

```bash
curl -sI https://api.hugowishpax.studio/health          # 200, không còn x-render-routing: suspend
curl -sI https://api.hugowishpax.studio/api/packages    # gọi 2 lần → cf-cache-status: MISS rồi HIT
curl -sI https://api.hugowishpax.studio/api/joy/wallet  # cache-control: private, no-store
```

Theo dõi vài ngày ở Render → Metrics: **Instance hours** phải bò lên chậm hơn
hẳn, và **Bandwidth** giảm theo tỉ lệ cache HIT.

---

## Còn nếu vẫn thiếu

Theo thứ tự đáng làm tiếp:

1. **Trỏ frontend thẳng vào API**, bỏ rewrite `/api/:path*` trong `vercel.json`,
   đổi `VITE_API_URL` thành `https://api.hugowishpax.studio/api`.
   Hiện đường đi là `browser → Vercel edge → Cloudflare → Render`: trả băng thông
   Vercel *và* Render cho cùng một byte, cộng một round trip thừa trên mọi request.

   Đã kiểm tra, dễ hơn tưởng:
   - CORS: `server.js` đã hardcode sẵn `https://www.hugowishpax.studio` → không phải sửa server.
   - Cookie: site thật là `www.hugowishpax.studio`, API là `api.hugowishpax.studio`
     → **cùng site** (eTLD+1 `hugowishpax.studio`), nên `sameSite: 'strict'` hiện tại
     vẫn gửi bình thường. Không phải đụng vào auth.

   ⚠️ Phải test: cookie đang là host-only, lưu cho host `www.`. Gọi thẳng sang host
   `api.` thì cookie cũ không được gửi → **user đang đăng nhập bị đăng xuất một lần**.
   Có Bearer token trong localStorage làm dự phòng (`src/services/apiAuthInterceptor.js`)
   nên có thể không ai để ý, nhưng phải thử thật trước khi đẩy production.

   > Ghi chú: `hugostudio.vn` **không có DNS**, không phân giải ra gì. Nó vẫn đang nằm
   > trong `ALLOWED_ORIGINS` trên Render và trong CLAUDE.md như thể là domain chính —
   > dọn đi cho khỏi nhầm. Domain thật đang chạy là `www.hugowishpax.studio`.
2. **Đẩy file ra khỏi Render.** `routes/fileToolsRoutes.js` chạy ffmpeg rồi
   `res.download`, `routes/hugoTeamRoutes.js:261` stream PDF — vừa ăn 0.1 vCPU vừa
   ăn băng thông mỗi lượt tải. Đã có `cloudinary` trong deps: trả signed URL thay
   vì stream qua server. Hoặc Cloudflare R2 (egress miễn phí).
3. **Oracle Cloud Always Free** — VM ARM 4 vCPU / 24GB, chạy 24/7 thật, không đếm
   giờ. Repo đã có sẵn `setup-vps.sh`. Đây là lựa chọn free duy nhất thực sự
   always-on.
4. **Render Starter $7/tháng** — hết giới hạn giờ, hết ngủ. Bước 4 (Cloudflare
   cache) vẫn nên làm dù có trả tiền.

## Quay lui

Mọi thứ nằm trong git. Muốn Python chạy lại trên Render: `git revert` commit này,
hoặc bỏ `AI_SERVER_URL` (Node fallback về `http://localhost:8000`) rồi khôi phục
`buildCommand`/`startCommand` cũ trong `render.yaml`.
