# Khoá 2 · "Quán" — React, Node.js, Express, Supabase, Render, Vercel, Cloudflare

Ghi chú thiết kế (31/10/2026). Chưa soạn nội dung, chưa có code. Khoá 1 (Coding · Nhịp,
HTML/CSS/PHP/MySQL, 26 step) là mẫu: mỗi step **học → làm theo → kiểm tra**, mỗi step thêm
một mảnh cho cùng một web thật; học xong web có địa chỉ công khai.

## Mục tiêu

Người học làm ra **"Quán"** — web thật cho một quán nhỏ / người bán online: thực đơn hoặc
danh mục, giỏ chọn món, đặt trước, trang quản lý đơn cho chủ quán. Làm được cho quán của
nhà mình hoặc người quen. Học xong có bộ kỹ năng nhà tuyển dụng hay hỏi: JavaScript,
Node.js/Express, React, PostgreSQL, triển khai và vận hành.

Đầu vào: đã học xong khoá 1 (biết HTML/CSS, SQL, form, phiên, bảo mật cơ bản). Khoá 2
dạy **chi tiết hơn** khoá 1 nên nhiều chặng hơn, mỗi chặng ngắn và một chủ đề.

## Kiến trúc

```
Trình duyệt ──► Cloudflare (tên miền, DNS, HTTPS, Turnstile, cache ảnh)
                  ├─► Vercel  : React (Vite)           — giao diện
                  └─► Render  : Node.js + Express      — API
                                 └─► Supabase : PostgreSQL · Auth · Storage
```

| Công cụ | Vai trò |
|---|---|
| React (Vite) | Giao diện: trang quán, thực đơn, giỏ, đặt trước, trang quản lý |
| Node.js + Express | API: thực đơn, đơn, phân quyền chủ quán |
| Supabase | PostgreSQL (dữ liệu), Auth (đăng nhập chủ quán), Storage (ảnh món) |
| Vercel | Chạy giao diện, deploy mỗi lần push |
| Render | Chạy máy chủ Express |
| Cloudflare | Tên miền + DNS, Turnstile chống bot, cache ảnh |

Lựa chọn chi tiết:
- SQL **viết tay** từ Express bằng `pg` (nối tiếp PDO ở khoá 1); chưa dạy ORM.
- Kiểm dữ liệu bằng **Zod**, dùng chung form và API.
- JavaScript trước, **TypeScript** một chặng riêng ở cuối.
- CSS thuần trước (đã học ở khoá 1), Tailwind sau.
- Không nối cổng thanh toán — dừng ở ghi đơn (0 đồng + tránh rắc rối pháp lý cho người mới).

## Lộ trình: 12 chặng · 60 step

| Chặng | Chủ đề | Step | Mảnh ghép cho "Quán" |
|---|---|---|---|
| 1 | Bản đồ và công cụ | 1–4 | Bản đồ khoá; VS Code, terminal, Node, Git; thiết kế màn hình + dữ liệu "Quán" |
| 2 | JavaScript hiện đại | 5–10 | Biến/kiểu, hàm, mảng/object, module, lỗi; trang thực đơn tĩnh bằng JS + DOM |
| 3 | Bất đồng bộ và web API | 11–14 | Event loop, Promise, `async/await`, `fetch`, JSON, HTTP sâu hơn (mã trạng thái, header, CORS) |
| 4 | Node.js nền tảng | 15–19 | Tiến trình, npm, `package.json`, đọc/ghi tệp, biến môi trường, log; máy chủ `http` thuần |
| 5 | Express | 20–24 | Route, middleware, lỗi tập trung, kiểm dữ liệu Zod; API thực đơn chạy bằng dữ liệu giả |
| 6 | PostgreSQL và Supabase | 25–30 | Tạo dự án Supabase; MySQL → PostgreSQL; thiết kế bảng; `pg` từ Express; giao dịch; chỉ mục |
| 7 | API hoàn chỉnh | 31–35 | CRUD thực đơn, đặt trước, trạng thái đơn; phân trang; kiểm thử API |
| 8 | Xác thực và tệp | 36–40 | Supabase Auth; Express kiểm JWT; phân quyền chủ quán; RLS; Storage ảnh món |
| 9 | React nền tảng | 41–46 | Vite, JSX, component, props, state, sự kiện, danh sách; giỏ chọn món |
| 10 | React nối API | 47–52 | Gọi API (đang tải/lỗi), định tuyến, form đặt trước + Turnstile, trang quản lý đơn |
| 11 | Lên mạng | 53–57 | Render (Express), Vercel (React), Cloudflare (tên miền, DNS, HTTPS, cache), CORS production |
| 12 | Vận hành và nghiệm thu | 58–60 | Bảo mật (OWASP API, giới hạn tần suất), theo dõi + sao lưu, TypeScript nhập môn, giao web cho chủ quán |

Mỗi step giữ khung khoá 1: giới thiệu → minh hoạ → học thuật (nguồn chuẩn Harvard) →
lên ý tưởng → kiến thức chính → áp dụng vào "Quán" → trắc nghiệm (tối đa 35 slide).

## Điều kiện nước sở tại (slide riêng qua `locales/extra.js`)

- **vi**: web có chức năng đặt hàng → xét thông báo Bộ Công Thương (ranh giới "đặt trước"
  khác "bán hàng có thanh toán"); dữ liệu khách hàng theo Nghị định 13/2023/NĐ-CP.
- **zh**: `*.vercel.app` (và có thể Render, Supabase) khó vào từ đại lục → slide tên miền
  riêng, phương án máy chủ trong nước + ICP 备案; 个人信息保护法.
- **en**: bản chung; ghi chú GDPR cho người học ở EU.

## Phải kiểm chứng trước khi soạn

1. Giới hạn gói free hiện hành: Supabase (tạm dừng dự án khi không hoạt động ~1 tuần?),
   Render (ngủ sau ~15 phút?), Vercel Hobby, Cloudflare. Đề bài không được vượt.
2. Supabase / Render / Vercel có truy cập được từ Trung Quốc đại lục không.
3. Văn bản pháp lý chính xác cho slide vi/zh.
4. Phiên bản hiện hành: React, Vite, Express 5, Node LTS, `@supabase/supabase-js`.

## Hạ tầng trong repo cần mở rộng (khi bắt đầu code)

Hiện mọi thứ gắn với khoá Coding ở `apps/web/src/components/member/hugoCoder/lessons/`:
- `stages.js` / `index.js` (WEB_COURSES), `lessonController.js`, `/api/coder-lessons`.
- `localize.js` + `locales/{en,zh}.json` + `locales/extra.js` — phủ bản dịch và slide riêng.
- `scripts/.translate-edu-lessons.mjs` — máy dịch, có bảng tên nút giao diện.
- `npm run check:coder-content` — kiểm bài và bản dịch.

Khoá 2 cần: tham số "khoá nào" cho bốn chỗ trên (thư mục bài riêng, id step không trùng
khoá 1), tiến độ/chuỗi Lửa Nhỏ tính chung cả hai khoá, và bảng tên nút cho Supabase /
Render / Vercel / Cloudflare dashboard ở en/zh.
