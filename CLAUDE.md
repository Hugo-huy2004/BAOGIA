# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup            # install frontend + server deps
npm run dev              # frontend + backend cùng lúc — mở http://localhost:3000 (cổng DUY NHẤT)
npm run dev:frontend     # chỉ Vite, port 3000
npm run dev:backend      # chỉ Node backend, port 8099 (needs MongoDB running)
npm run lint             # ESLint over src/
npm run build            # production build (also regenerates dist/, which is committed)
npm run build:analyze    # build + bundle treemap at dist/stats.html

npm run check:all        # lint + import check + build + SEO + performance budget

# Python AI server (port 8000)
cd python-ai-server && source .venv/bin/activate && uvicorn main:app --port 8000
```

Repo KHÔNG có test tự động — toàn bộ bộ test cùng vitest đã bị gỡ ngày
2026-08-15 theo yêu cầu. Đừng viết test mới trừ khi được hỏi tới; muốn kiểm
chứng thì chạy `npm run check:all` (lint + import + auth + build + SEO + ngân
sách hiệu năng). CI: `.github/workflows/ci.yml` chạy lint,
`performance-budget.yml` chạy build + ngân sách hiệu năng.

Lưới an toàn đã mất theo: đối chiếu khoá i18n giữa 9 ngôn ngữ, kiểm mọi `t()`
trong portal có bản dịch, và toán tiền/token. Sửa mấy chỗ đó thì phải tự soát
tay.

## Architecture

Three servers, but the browser only ever talks to **one origin**: every `/api/*`
and `/ws*` goes to Node — in dev via the Vite proxy, in production via
`vercel.json` rewrites. `npm run dev` starts Vite **and** Node together and
points the proxy at the local backend, so the one address you open is
`localhost:3000`. Pass `VITE_DEV_BACKEND_URL=https://baogia-x9lk.onrender.com`
to run the UI against production instead. The backend port is **8099, never
8081** — 8081 is Metro/Expo's default, and Metro answers every path with HTML
and status 200, so `/api/*` "succeeds" with a web page instead of JSON. Python is reachable *only* server-to-server from Node.
Never add a dev-proxy rule that points the browser straight at Python: it
bypasses `requireMember` and needs an internal key the client must not hold.

- `src/` — React 18 + Vite SPA. Tailwind, Zustand (`src/stores/`), SWR, react-router with lazy route chunks. i18n via i18next with `en`/`vi` locales in `src/i18n/locales/`.
- `server/` — Express + Mongoose + WebSocket (port 8099). Routes in `server/routes/`, one file per domain (bio, joy, arcade, chess, companion, payos…). Realtime: `/ws` (wallet/notifications) and `/ws/chess`.
- `python-ai-server/` — FastAPI (port 8000). Reached only through Node: `server/routes/aiProxyRoutes.js` (all of `/api/ai/*`) and `server/routes/sleepRoutes.js` (`/analyze`), both injecting `X-Internal-Key` from `process.env.INTERNAL_API_KEY`. A global FastAPI middleware rejects any request without it, so no browser call can reach it directly.
- `api/` — Vercel serverless (only `/pay` redirect).

Deploy split (see `docs/tach-tai-render.md`): Render runs **only** Node (it bills by
the hour, and one always-on free service already eats 730 of the 750h/month quota);
`python-ai-server/` deploys to Vercel as a serverless function and Node reaches it
over `AI_SERVER_URL`. Keep-warm lives in `workers/keepalive/` (a Cloudflare Worker
cron), never as a self-ping inside the server. Anything new that doesn't need a
long-lived process belongs on Vercel/Cloudflare, not Render.

The app is a PWA: `vite-plugin-pwa` generates `dist/sw.js` and imports the hand-written `public/push-sw.js` (web push + offline arcade score sync) into it. Service-worker changes only reach browsers after a build + deploy.

### Auth (do not bypass)

- **Member**: Google ID token → `POST /api/auth/member/google` → server-verified → member JWT (HttpOnly cookie `member_jwt` + Bearer fallback, auto-attached by `src/services/apiAuthInterceptor.js`). Every member route uses `requireMember` (`server/middleware/authMiddleware.js`) and reads identity from `req.memberEmail` — **never** from a client-supplied `?email=` param. WebAuthn issues the same token type.
- **Admin**: separate JWT in cookie `jwt`, `requireAdmin` middleware.
- Server refuses to start in production without `JWT_SECRET`, `JOY_QR_SECRET`, `GOOGLE_CLIENT_ID` (`server/utils/secrets.js`). Env: root `.env` (frontend `VITE_*`), `server/.env` (backend).

### Conventions

- **Notifications**: one API — `import { notify } from "src/lib/notify"` (`notify.success/error/warning/info/loading/confirm`). Never import `react-hot-toast` directly in components; `notify.confirm()` replaces `window.confirm` and bespoke confirm modals.
- **AI calls**: all Gemini usage on the Node side routes through `server/services/aiGateway.js` (quota, cache, retry, model downgrade, kill-switch). Don't call the Gemini SDK directly from route handlers.
- **Icons**: monochrome Material Symbols only (`bg-muted`, `text-foreground`) on public pages — no emoji, no colorful icon badges.
- **Public portfolio pages** (`src/pages/public/IntroductionPage.jsx`, `ServicesPage.jsx`): prices and copy are author-written — don't change them without asking; UI-only changes are fine.
- **JOY wallet/QR**: QR payloads are opaque server-signed HMAC tokens (`server/utils/joyQrToken.js`); the client never constructs or parses them.
