# Chống DDoS — 13 tầng

Đo trên prod ngày 27/10/2026. Đường đi của một request API từ web:

```
trình duyệt → Cloudflare (www) → Vercel → Cloudflare (api.) → Render (Node)
                 ^ thấy IP thật           ^ chỉ thấy IP Vercel
```

WebSocket không qua Vercel: trình duyệt nối thẳng `api.` nên Cloudflare thấy IP thật.

| # | Tầng | Nằm ở | Ai làm |
|---|---|---|---|
| 1 | Chống ngập mạng L3/L4 | Cloudflare (tự động) | có sẵn |
| 2 | Công tắc khẩn cấp "Under Attack" chỉ cho trang www | Cloudflare Configuration Rule, khiên tải tự gạt | tạo rule **bấm tay** một lần, bật/tắt tự động |
| 3 | Khoá origin `x-origin-auth` | `middleware/originLock.js` | có sẵn, đã kiểm (403) |
| 4 | WAF chặn dò quét ở edge | Cloudflare Custom Rules | **bấm tay** |
| 5 | IP thật của người dùng | `utils/clientIp.js` + Transform Rule | code ✅ + **bấm tay** |
| 6 | Cache CDN cho API công khai | Cloudflare Cache Rule | **bấm tay** |
| 7 | Trần lượt theo tài khoản/IP, không khoá nhầm (đăng nhập, đọc bài, điểm, quà đếm theo tài khoản) | `config/limiter.js`, `accountOrIpKey` | code ✅ |
| 8 | Trần body 1mb (10mb chỉ cho route upload) + trần thao tác nặng | `server.js`, `config/limiter.js` | code ✅ |
| 9 | Cổng xác thực (`requireMember`, `check:guards`) | server | có sẵn |
| 10 | Trần WebSocket (12/IP, 6/tài khoản, 30 lần upgrade/phút, 120 tin) | `services/websocketServer.js` | có sẵn |
| 11 | DB thất bại nhanh (`waitQueueTimeoutMS`, `maxTimeMS`) + timeout HTTP | `config/database.js`, `server.js` | code ✅ + env |
| 12 | Khiên tải: phát hiện bất thường, cắt khách ẩn danh | `middleware/loadShield.js` | code ✅ |
| 13 | Chốt chặn truy vấn ở tầng Mongoose: cấm `$where`/`$function`/`$accumulator`, khoá prototype | `config/mongooseGuards.js` | code ✅ |

---

## Thứ tự làm (trước sự kiện)

1. Deploy code (push `main` → Render tự build).
2. Đặt **env trên Render** (mục A).
3. Làm **Cloudflare** theo thứ tự mục B → C → D → E.
4. Chạy phần **kiểm tra** (mục F).

## A. Render → service `baogia` → Environment

| Biến | Giá trị | Vì sao |
|---|---|---|
| `EDGE_CLIENT_IP_SECRET` | chạy `openssl rand -hex 32` rồi dán | chữ ký cho tầng 5, phải trùng với mục C |
| `SECURITY_AUTOBLOCK` | `0` | **tạm thời**: khi tầng 5 chưa chạy, 8 lần dò quét là tự chặn nhầm IP Vercel. Xoá biến này sau khi mục F bước 2 đạt |
| `MAX_DB_POOL` | `10` (mặc định từ 27/10) | chỉ đặt khi muốn khác 10 |
| `TRUSTED_IPS` | IP public của wifi sự kiện (xem bên dưới) | 100 người sau một NAT, trước khi đăng nhập là chung một bucket |

Cách lấy IP wifi sự kiện: đứng ở chỗ tổ chức, nối wifi đó, mở `https://ifconfig.me`. Có nhiều đường mạng thì nhập các IP cách nhau bằng dấu phẩy.

Tuỳ chọn cho khiên tải (để trống là dùng mặc định):
`SHIELD_RPS_FLOOR=150` · `SHIELD_MULT=5` · `SHIELD_LAG_MS=250` · `SHIELD_FORCE=1` (bật tay) · `SHIELD=off` (tắt hẳn).

Giữ **Instance Type = Free**. Hệ thống phi lợi nhuận, không nâng gói trả phí (xem `docs/chi-phi-0d.md`); sức chịu tải đến từ các tầng ở trên, không từ CPU mua thêm.

Đổi env xong thì Render tự khởi động lại, khoảng 1 phút.

## B. Cloudflare — tầng 4: WAF chặn dò quét

Dashboard → chọn zone `hugowishpax.studio` → **Security → WAF → Custom rules → Create rule**.

**Rule 1 — "Block scanners"**, Action: **Block**, Expression (bấm *Edit expression*):

```
(http.request.uri.path contains "/.git") or
(http.request.uri.path contains "/.env") or
(http.request.uri.path contains "wp-admin") or
(http.request.uri.path contains "wp-login") or
(http.request.uri.path contains "phpmyadmin") or
(http.request.uri.path contains "xmlrpc.php") or
(http.request.uri.path contains "/actuator") or
(http.request.uri.path contains "/vendor/phpunit") or
(http.request.uri.path contains "/cgi-bin")
```

**Rule 2 — "Block odd methods"**, Action: **Block**:

```
not http.request.method in {"GET" "HEAD" "POST" "PUT" "PATCH" "DELETE" "OPTIONS"}
```

Đừng làm:
- **Bot Fight Mode** (Security → Bots): trên gói free không loại trừ được đường nào. Nó sẽ coi chính Vercel là bot và thách đố, làm hỏng mọi `/api` đi từ www.
- **Rate limiting rule của Cloudflare**: gói free không lọc theo hostname được. Lượt từ Vercel tới `api.` mang chung IP Vercel nên sẽ đập trần và chặn cả web. Trần lượt vẫn do tầng 7 lo, giờ đã đếm theo IP thật.
- **Security Level "I'm Under Attack" cho cả zone**: lý do giống trên. Dùng mục D thay thế.

## C. Cloudflare — tầng 5: chuyển IP thật qua Vercel

**Rules → Transform Rules → Modify Request Header → Create rule**

- Name: `Hugo real client IP (www)`
- If incoming requests match → Custom filter expression:
  ```
  (http.host eq "www.hugowishpax.studio")
  ```
- Then:
  - **Set dynamic** — Header name `x-hugo-client-ip` — Value `ip.src`
  - **Set static** — Header name `x-hugo-edge-auth` — Value: **đúng chuỗi** `EDGE_CLIENT_IP_SECRET` ở mục A
- Deploy.

Vì sao an toàn: Cloudflare **ghi đè** hai header này ở chặng www nên trình duyệt không giả được. Gọi thẳng `api.` thì không có chữ ký, server bỏ qua header và dùng `cf-connecting-ip` như cũ.

## D. Cloudflare — tầng 2: công tắc khẩn cấp (tạo sẵn, để TẮT)

**Rules → Configuration Rules → Create rule**

- Name: `EMERGENCY under attack (www pages)`
- Expression:
  ```
  (http.host eq "www.hugowishpax.studio" and not starts_with(http.request.uri.path, "/api/"))
  ```
- Then: **Security Level → I'm Under Attack**
- Deploy, rồi **gạt rule sang Disabled** ngay.

Không cần gạt tay nữa: khiên tải (tầng 12) bật rule này ngay khi lên bậc 1 và tắt khi hạ khiên (`setEmergencyChallenge` trong `services/cloudflareFirewall.js`, báo Telegram cả hai lần). Token `CLOUDFLARE_API_TOKEN` phải có thêm quyền **Zone → Config Rules: Edit**; thiếu quyền thì Telegram báo và vẫn gạt tay được như cũ. Tắt việc tự gạt bằng `SHIELD_EDGE=off`. Người thật chỉ phải chờ thử thách khoảng 5 giây ở lần mở trang đầu; `/api` không bị đụng tới. Dự phòng thứ hai là Vercel → Project → Settings → Security → **Attack Challenge Mode**.

## E. Cloudflare — tầng 6: cache API công khai

Hiện chỉ `/api/coder-lessons` được cache ở edge. `today/feed`, `arcade/leaderboard`, `legal-docs` vẫn `DYNAMIC` dù server đã gửi `s-maxage`.

**Caching → Cache Rules**: sửa rule đang cache `coder-lessons` (hoặc tạo rule mới):

- Expression:
  ```
  (http.host eq "api.hugowishpax.studio" and (
    http.request.uri.path eq "/api/coder-lessons" or
    starts_with(http.request.uri.path, "/api/today/feed") or
    starts_with(http.request.uri.path, "/api/arcade/leaderboard") or
    starts_with(http.request.uri.path, "/api/arcade/2048/collection-leaderboard") or
    starts_with(http.request.uri.path, "/api/chess/leaderboard") or
    starts_with(http.request.uri.path, "/api/presence/status-by-slug") or
    starts_with(http.request.uri.path, "/api/legal-docs")))
  ```
- Cache eligibility: **Eligible for cache**
- Edge TTL: **Use cache-control header if present, bypass cache if not**
- Browser TTL: **Respect origin**

Danh sách này phải khớp `SHARED_CACHE_PATHS` trong `src/services/api/core/authInterceptor.js`. Route nào đọc danh tính thì **không** được thêm vào đây. Server đã tự đánh dấu `private, no-store` khi request có cookie hoặc token, nên dữ liệu riêng không lọt vào cache.

## F. Kiểm tra sau khi làm

```bash
# 1. Origin lock: đánh thẳng Render phải ra 403
curl -s -o /dev/null -w "%{http_code}\n" https://baogia-x9lk.onrender.com/api/bio/public

# 2. IP thật: www và api. phải TRỪ CÙNG MỘT bộ đếm (remaining giảm liền mạch, reset giống nhau)
for u in api www api www; do curl -s -o /dev/null -D - https://$u.hugowishpax.studio/api/health | grep -i ratelimit-remaining; done
#    Đạt → xoá SECURITY_AUTOBLOCK trên Render (về mặc định 8).

# 3. Cache: lần 2 phải ra HIT
for i in 1 2; do curl -s -o /dev/null -D - https://api.hugowishpax.studio/api/legal-docs | grep -i cf-cache-status; done

# 4. Khiên: shield phải là 0 khi yên
curl -s https://api.hugowishpax.studio/api/health
```

---

## Khi đang bị tấn công

Tín hiệu báo động:
- Telegram báo **"Khiên tải: BẬT bậc 1/2"**
- `/api/health` trả `"shield": 1` hoặc `2`
- Biểu đồ CPU trên Render chạm trần

Xử lý theo thứ tự, mỗi bước chờ 1–2 phút xem có hết không:

1. **Không làm gì cả.** Khiên đã tự cắt khách ẩn danh, thành viên đã đăng nhập vẫn dùng được. Khiên tự hạ sau 60 giây yên.
2. Rule khẩn cấp ở mục D đã tự bật. Nếu Telegram báo không gạt được, bật tay.
3. Vào Cloudflare **Security → Events**, tìm IP/ASN đang nện, rồi thêm Custom rule Block `ip.src in {…}` hoặc `ip.src.asnum eq …`. Cách này **chỉ dùng được với lượt đi thẳng `api.`**. Nếu thủ phạm là IP Vercel thì đừng chặn, vì chặn là chặn cả web.
4. Ép khiên luôn bật: đặt `SHIELD_FORCE=1` trên Render.
5. Tạm thời nâng instance Render.

Sau sự cố, gỡ những gì đã bật ở bước 2–4.

## Cách khiên tải quyết định (tầng 12)

Mỗi giây khiên đo hai thứ: số request vào Node và độ trễ p99 của event loop.

- **Bậc 1** khi trong **3 giây liền** có một trong hai điều sau:
  - req/s vượt `max(SHIELD_RPS_FLOOR, mức nền × SHIELD_MULT)`
  - lag vượt `SHIELD_LAG_MS`

  Lúc đó khách ẩn danh nhận 503 kèm `Retry-After: 30`.
- **Bậc 2** khi lag vượt gấp đôi ngưỡng: thao tác nặng của thành viên (AI, upload) cũng bị cắt.
- Luôn được đi qua: thành viên đã đăng nhập, webhook (Telegram, PayOS), `/health`, `/api/auth/member/*` và `/api/ops`.
- Mức nền là trung bình trượt khoảng 5 phút và **chỉ học lúc yên**, để chính cơn lũ không nâng "mức bình thường" lên.
- Hạ khiên sau 60 giây yên liên tục. Khiên báo Telegram cả lúc bật và lúc hạ.

Giới hạn: khiên chỉ đếm trong một tiến trình, và tiến trình chết thì bộ đếm cũng mất.

## Không có Redis

Đã gỡ hẳn ngày 31/10/2026. Cache, trần lượt, online, khoá chống gửi lặp và WebSocket đều chạy trong RAM của tiến trình Node duy nhất: bớt một dịch vụ có thể sập hoặc hết hạn mức. Restart thì bộ đếm trần lượt về 0; khoá tài khoản/IP vẫn nằm trong Mongo nên không mất. Xoá biến `REDIS_URL` trên Render và database Upstash.
