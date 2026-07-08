# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup            # install frontend + server deps
npm run dev              # frontend — Vite, port 3000
npm run dev:backend      # Node backend, port 8081 (needs MongoDB running)
npm run lint             # ESLint over src/
npm run build            # production build (also regenerates dist/, which is committed)
npm run build:analyze    # build + bundle treemap at dist/stats.html

npm test                 # frontend Vitest (jsdom, setup in src/test/setup.js)
npm run test:server      # server Vitest (server/tests/)
cd server && npx vitest run tests/authMiddleware.test.js   # single server test file

# Python AI server (port 8000)
cd python-ai-server && source .venv/bin/activate && uvicorn main:app --port 8000
```

CI (`.github/workflows/ci.yml`) runs lint + tests + build on every push.

## Architecture

Three servers behind one Vite dev proxy (see `vite.config.js` — order matters, AI routes are listed before the generic `/api` rule):

- `src/` — React 18 + Vite SPA. Tailwind, Zustand (`src/stores/`), SWR, react-router with lazy route chunks. i18n via i18next with `en`/`vi` locales in `src/i18n/locales/`.
- `server/` — Express + Mongoose + WebSocket (port 8081). Routes in `server/routes/`, one file per domain (bio, joy, arcade, chess, companion, payos…). Realtime: `/ws` (wallet/notifications) and `/ws/chess`.
- `python-ai-server/` — FastAPI (port 8000). Handles `/api/ai`, `/api/iot`, `/api/sleep/analyze`, `/ws/iot`. Node proxies to it via `server/routes/aiProxyRoutes.js`; direct calls require the internal key middleware.
- `api/` — Vercel serverless (only `/pay` redirect).

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
- **JOY wallet/QR**: QR payloads are opaque server-signed HMAC tokens (see `server/tests/joyQrToken.test.js`); the client never constructs or parses them.
