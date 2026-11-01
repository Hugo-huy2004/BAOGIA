# Khoá học Education Hugo

Mỗi khoá một thư mục, cùng một cấu trúc — web (lazy chunk), máy chủ (chấm bài, phát
bài theo ngôn ngữ) và script đều import thẳng bằng đường dẫn tương đối.

```
packages/courses/<khoá>/
  stages.js        chặng + mục lục (OUTLINE), STEP_IDS, MAX_SLIDES, STEP_PASS_PERCENT
  index.js         WEB_COURSES: ghép mục lục với steps/ đã soạn (chưa soạn = draft)
  steps/stepN.js   một step: summary, slides (tối đa MAX_SLIDES), quiz — tiếng Việt gốc
  localize.js      phủ locales/<lang>.json + slide riêng nước sở tại lên step (chỉ máy chủ)
  locales/
    en.json, zh.json   bản dịch, cùng hình dạng với WEB_COURSES (do script dịch sinh ra)
    extra.js           slide CHỈ có ở một ngôn ngữ (điều kiện nước sở tại), viết tay
```

| Khoá | Thư mục | Trạng thái |
|---|---|---|
| 1 · Coding (Nhịp) — HTML/CSS/PHP/MySQL, 26 step | `coding/` | đang dạy |
| SQL (quán Hạt) — SQLite, từ SELECT tới window function/EXPLAIN/FTS5, 40 step | `sql/` | đang soạn: chặng 1–4 (step 1–22), mở ở /learn (tab SQL) |
| 2 · Quán — React/Node/Express/Supabase/Render/Vercel/Cloudflare, 60 step | `quan/` (chưa tạo) | thiết kế: `docs/khoa-2-quan.md` |

Quy trình cho một step: soạn tiếng Việt trong `steps/` → `npm run check:coder-content`
→ `COURSE=<khoá> npm run course:translate` (đa tiến trình: `WORKER=w1 FROM=0 TO=0.5 LANG_ONLY=zh`)
→ slide riêng nước sở tại vào `locales/extra.js` → kiểm tra lại.

Mở khoá 2 cần thêm: id step không trùng khoá 1, route API theo khoá (hiện
`/api/coder-lessons` chỉ phục vụ `coding/`), `check:coder-content` nhận tham số khoá.
