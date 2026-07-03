# Hugo Wishpax Portal

Nền tảng Biolink + chăm sóc sức khỏe tinh thần cho học sinh sinh viên: Bio cá nhân, ví JOY, HugoArcade (game + cờ vua realtime), Companion AI "Bạn Học Đường", cửa hàng tiện ích, thanh toán PayOS, PWA đầy đủ.

## Kiến trúc

```
├── src/                 # Frontend — React 18 + Vite, Tailwind, Zustand, SWR (port 3000)
├── server/              # Backend — Express + MongoDB (Mongoose), WebSocket (port 8081)
├── python-ai-server/    # AI server — proxy AI, sleep analysis, IoT (port 8000)
└── api/                 # Vercel serverless (redirect /pay)
```

Vite dev server proxy: `/api/ai`, `/api/iot`, `/api/sleep/analyze`, `/ws/iot` → Python (8000); mọi thứ còn lại `/api`, `/ws` → Node (8081). Xem [vite.config.js](vite.config.js).

## Chạy dev

```bash
npm run setup          # cài dependencies frontend + server
npm run dev            # frontend (Vite, port 3000)
npm run dev:backend    # backend Node (port 8081) — cần MongoDB chạy sẵn
```

## Biến môi trường

- Root `.env` — frontend (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, …). Xem [.env.example](.env.example).
- `server/.env` — backend. Xem [server/.env.example](server/.env.example). **Bắt buộc ở production**: `JWT_SECRET`, `JOY_QR_SECRET`, `GOOGLE_CLIENT_ID` — server từ chối khởi động nếu thiếu (xem [server/utils/secrets.js](server/utils/secrets.js)).
- Admin đầu tiên: đặt `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD`, khởi động server một lần, rồi xóa khỏi env.

## Xác thực

- **Member**: Google Identity Services → gửi ID token lên `POST /api/auth/member/google` → server xác minh với Google (signature/expiry/audience) → phát JWT member (HttpOnly cookie `member_jwt` + Bearer fallback). Mọi route member dùng middleware `requireMember` ([server/middleware/authMiddleware.js](server/middleware/authMiddleware.js)) — danh tính lấy từ token, **không bao giờ** từ `?email=` do client gửi. Frontend gắn Bearer token tự động qua [src/services/apiAuthInterceptor.js](src/services/apiAuthInterceptor.js).
- **WebAuthn** (vân tay/Face ID): cùng cơ chế — `login-verify` phát cùng loại token.
- **Admin**: JWT riêng qua cookie `jwt`, middleware `requireAdmin`.

## Test & CI

```bash
cd server && npm test   # Vitest — unit test cho auth middleware + JOY QR token
npm run lint            # ESLint frontend
npm run build           # Vite production build
npm run build:analyze   # build + báo cáo kích thước bundle (dist/stats.html)
```

CI chạy lint + test + build trên mỗi push (`.github/workflows/ci.yml`).
