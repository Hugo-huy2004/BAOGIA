# Hugo Wishpax Portal

Nền tảng Biolink + chăm sóc sức khỏe tinh thần cho học sinh sinh viên: Bio cá nhân, ví JOY, HugoArcade (game + cờ vua realtime), Companion AI "Bạn Học Đường", cửa hàng tiện ích, thanh toán PayOS, PWA đầy đủ.

## Kiến trúc

```
├── src/                 # Frontend — React 18 + Vite, Tailwind, Zustand, SWR (port 3000)
├── server/              # Backend — Express + MongoDB (Mongoose), WebSocket (port 8099)
├── python-ai-server/    # AI server — proxy AI, sleep analysis, IoT (port 8000)
└── api/                 # Vercel serverless (redirect /pay)
```

Vite dev server proxy: **mọi** `/api/*` và `/ws*` → Node, giống hệt rewrite của
`vercel.json` trên production. Trình duyệt không bao giờ gọi thẳng Python — chỉ
Node nói chuyện với nó (qua `AI_SERVER_URL` + `INTERNAL_API_KEY`). Xem
[vite.config.js](vite.config.js).

## Chạy dev

```bash
npm run setup          # cài dependencies frontend + server
npm run dev            # frontend (Vite, port 3000)
npm run dev:backend    # backend Node (port 8099) — cần MongoDB chạy sẵn
```

## Biến môi trường

- Root `.env` — frontend (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, …). Xem [.env.example](.env.example).
- `server/.env` — backend. Xem [server/.env.example](server/.env.example). **Bắt buộc ở production**: `JWT_SECRET`, `JOY_QR_SECRET`, `GOOGLE_CLIENT_ID` — server từ chối khởi động nếu thiếu (xem [server/utils/secrets.js](server/utils/secrets.js)).
- Admin đầu tiên: đặt `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`, khởi động server một lần, rồi xóa khỏi env.

## Xác thực

- **Member**: Google Identity Services → gửi ID token lên `POST /api/auth/member/google` → server xác minh với Google (signature/expiry/audience) → phát JWT member (HttpOnly cookie `member_jwt` + Bearer fallback). Mọi route member dùng middleware `requireMember` ([server/middleware/authMiddleware.js](server/middleware/authMiddleware.js)) — danh tính lấy từ token, **không bao giờ** từ `?email=` do client gửi. Frontend gắn Bearer token tự động qua [src/services/apiAuthInterceptor.js](src/services/apiAuthInterceptor.js).
- **WebAuthn** (vân tay/Face ID): cùng cơ chế — `login-verify` phát cùng loại token.
- **Admin**: JWT riêng qua cookie `jwt`, middleware `requireAdmin`.
- **Đăng nhập bằng Hugo Studio**: OAuth 2.0 Authorization Code + PKCE cho app/web bên ngoài; admin quản lý client ở `/admin?tab=oauth`. Xem [hướng dẫn tích hợp](docs/hugo-studio-oauth.md).

## Kiểm tra & CI

```bash
npm run lint            # ESLint frontend
npm run build           # Vite production build
npm run build:analyze   # build + báo cáo kích thước bundle (dist/stats.html)
```

CI chạy lint trên mỗi push; ngân sách hiệu năng chạy build (`.github/workflows/ci.yml`).
