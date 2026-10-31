# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # MỘT lần cài cho mọi workspace (một package-lock ở gốc)
npm run dev              # frontend + backend cùng lúc — mở http://localhost:3000 (cổng DUY NHẤT)
npm run dev:frontend     # chỉ Vite, port 3000
npm run dev:backend      # chỉ Node backend, port 8099 (needs MongoDB running)
npm run lint             # ESLint over apps/web/src + apps/server + scripts + apps/workers
npm run build            # production build → apps/web/dist (KHÔNG commit)
npm run dev:portfolio    # portfolio độc lập, port 3001, không cần backend
npm run build:portfolio  # portfolio build riêng → apps/web/dist-portfolio (không commit)
npm run check:cv         # ba CV chính phải đúng 1 trang A4; kiểm chữ bản Anh
npm run build:analyze    # build + bundle treemap at apps/web/dist/stats.html

npm run check:all        # lint + import check + build + SEO + performance budget

# Python AI server (port 8000)
cd apps/ai && source .venv/bin/activate && uvicorn main:app --port 8000
```

Repo KHÔNG có test tự động — toàn bộ bộ test cùng vitest đã bị gỡ ngày
2026-08-15 theo yêu cầu. Đừng viết test mới trừ khi được hỏi tới; muốn kiểm
chứng thì chạy `npm run check:all` (lint + import + auth + build + SEO + ngân
sách hiệu năng). CI: `.github/workflows/ci.yml` chạy lint,
`performance-budget.yml` chạy build + ngân sách hiệu năng.

Lưới an toàn đã mất theo: đối chiếu khoá i18n giữa 9 ngôn ngữ, kiểm mọi `t()`
trong portal có bản dịch, và toán tiền/token. Sửa mấy chỗ đó thì phải tự soát
tay.

## Cost: free tiers only (nonprofit)

Hugo Studio is nonprofit: **no paid plan, no service that bills**. Every provider
runs on its free tier and code must stay inside it — see `docs/chi-phi-0d.md` for
the list, limits and guards. Never recommend upgrading a plan, adding a card, or a
new service without a free tier. When a quota runs out the feature must degrade
(fallback, pause, 429), never start billing: e.g. `aiGateway` stops all Gemini
calls at the daily cap, rate limiters and the response cache live in RAM. There is
**no Redis** (removed 2026-10-31): Render free runs one process, so cache, presence,
idempotency and WebSocket fan-out are in-process. Don't add Redis back.

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

Monorepo (npm workspaces, one lockfile at the root):

```
apps/web/          React 18 + Vite SPA (+ Capacitor android/ios, portfolio entry)
apps/server/       Express + Mongoose + WebSocket, port 8099
apps/ai/           FastAPI, port 8000 (own Vercel project, deployed from this folder)
apps/workers/      Cloudflare Workers: keepalive, media-proxy (wrangler, not workspaces)
packages/shared/   pure JS/JSON used by BOTH web and server (app registry, prices, texts…)
packages/nom-data/ chữ Nôm source tables for scripts/build-nom-*
scripts/           repo tooling; scripts/checks = every `npm run check:*`
api/ vercel.json render.yaml start.sh   stay at the root: Vercel and Render read them there
```

Cross-package imports are plain relative paths (`../../../packages/shared/x.js`), not
package names — Vite, Node and the Vercel functions all resolve them with no build step.

- `apps/web/src/` — Tailwind, Zustand (`apps/web/src/stores/`), SWR, react-router with lazy route chunks. i18n via i18next, locales in `apps/web/src/i18n/locales/`. Vite runs with cwd `apps/web` (its config, `index.html`, `public/`, `.env` live there); root scripts call it through `npm run … --workspace apps/web`.
- `apps/web/src/portfolio/main.jsx` — entry riêng cho `portfolio.hugowishpax.studio`, dùng `apps/web/vite.portfolio.config.js` và `apps/web/deploy/portfolio.vercel.json`. `www` mở ServicesPage tại `/`; `/introduction` chuyển sang portfolio. Xem `docs/tach-portfolio-services.md`. Xuất lại PDF trong `apps/web/public/` bằng `npm run cv:pdf` trước build khi sửa CV.
- `apps/web/src/education/` — **Education Hugo** (`education.hugowishpax.studio`): same build, same Vercel project and backend as www, picked by hostname in `App.jsx` (`packages/shared/eduSite.js`; dev: `http://education.localhost:3000`). Own shell, manifest (`public/edu.webmanifest`, swapped at runtime) and clay mascots (`npm run gen:mascots`). Courses are free (6 preview steps without account); the account still follows Hugo Studio rules — 7-day trial, extend with JOY (`POST /api/joy/extend-account`, `ACCOUNT_EXTENSION`), edu verification = 1 year. First pass of a step pays `CODER_JOY_PER_CORRECT` JOY per correct answer. Learning routes use `requireMemberSession` (no profile gate). `/study` redirects here. Push: subscriptions made from the Edu origin get `site: 'edu'` and only receive `sendEduPush` (study reminder at the learner's hour, account expiry 3/1 days, new sign-in); www pushes skip them. Personal settings (`packages/shared/eduPrefs.js`) live in `EduLearner`, ride along on `GET /api/joy/coder-access`, saved with `PUT /api/joy/edu-settings`.
- `apps/server/` — routes in `apps/server/routes/`, one file per domain (bio, joy, arcade, chess, companion, payos…). Realtime: `/ws` (wallet/notifications) and `/ws/chess`. Env in `apps/server/.env`.
- `apps/ai/` — Reached only through Node: `apps/server/routes/aiProxyRoutes.js` (all of `/api/ai/*`) and `apps/server/routes/sleepRoutes.js` (`/analyze`), both injecting `X-Internal-Key` from `process.env.INTERNAL_API_KEY`. A global FastAPI middleware rejects any request without it, so no browser call can reach it directly.
- `api/` — Vercel serverless (only `/pay` redirect).

Deploy split (see `docs/tach-tai-render.md`): Render runs **only** Node (it bills by
the hour, and one always-on free service already eats 730 of the 750h/month quota);
`apps/ai/` deploys to Vercel as a serverless function and Node reaches it
over `AI_SERVER_URL`. Keep-warm lives in `apps/workers/keepalive/` (a Cloudflare Worker
cron), never as a self-ping inside the server. Anything new that doesn't need a
long-lived process belongs on Vercel/Cloudflare, not Render.

The app is a PWA: `vite-plugin-pwa` generates `apps/web/dist/sw.js` and imports the hand-written `apps/web/public/push-sw.js` (web push + offline arcade score sync) into it. Service-worker changes only reach browsers after a build + deploy.

### Auth (do not bypass)

Better Auth (`apps/server/auth/betterAuth.js`), two separate instances — never merge them:

- **Member**: `/api/auth/*`, cookie `hugo.*`, collections `user/session/account/verification/passkey`. Google ID token (`sign-in/social` with `idToken`) and passkey — **no member email OTP** (it was an open email-bombing endpoint the UI never used); `bearer()` for the Capacitor app; `oneTimeToken` carries the Safari session into a freshly installed iOS PWA via `/api/pwa-manifest?handoff=` (`apps/web/src/utils/appHandoff.js`). Login endpoints have tighter `rateLimit.customRules`. Creating a user creates its Bio (`databaseHooks`). Every member route uses `requireMember` (`apps/server/middleware/authMiddleware.js`) and reads identity from `req.memberEmail` — **never** from a client-supplied `?email=` param.
- **Admin**: `/api/admin-auth/*`, cookie `hugo-admin.*`, collections `admin_*`. No passwords, no Telegram: a 6-digit code to the admin's own email (`emailOTP`, sign-up disabled). Roles come from `packages/shared/adminAccess.js` through the admin plugin; one admin may hold several (`"support,finance"`), permissions are their union. `requireAdmin` sets `req.admin`. Only owners manage accounts. First owner: set `ADMIN_SEED_EMAIL` and start the server once.
- Customer portal keeps its own JWT (`customer_jwt`, `requireCustomer`).
- Hot paths (load shield, IP gate) only check the session cookie's signature (`signedSessionRole`), no DB.
- Frontend: keep using `apps/web/src/services/api/core/authSession.js`; the Better Auth clients live in `apps/web/src/lib/authClient.js` (import it dynamically).
- Server refuses to start in production without `JWT_SECRET`, `JOY_QR_SECRET`, `GOOGLE_CLIENT_ID` (`apps/server/utils/secrets.js`). Optional `BETTER_AUTH_SECRET` (falls back to `JWT_SECRET`). Env: `apps/web/.env` (frontend `VITE_*`), `apps/server/.env` (backend).
- `apps/server/.env` points `MONGODB_URI` at the **real Atlas DB**. Run local experiments with `MONGODB_URI=mongodb://localhost:27017/hugo_wishpax`.

### Conventions

- **Notifications**: one API — `import { notify } from "src/lib/notify"` (`notify.success/error/warning/info/loading/confirm`). Never import `react-hot-toast` directly in components; `notify.confirm()` replaces `window.confirm` and bespoke confirm modals.
- **AI calls**: all Gemini usage on the Node side routes through `apps/server/services/aiGateway.js` (quota, cache, retry, model downgrade, kill-switch). Don't call the Gemini SDK directly from route handlers.
- **Buttons / Liquid Glass**: every `<button>`/`[role=button]` already gets the iOS press feel (scale + spring + highlight) from `apps/web/src/lib/liquidGlass/LiquidPressEngine.js`, started once in `main.jsx` — don't add per-button `active:scale-*`. Glass surfaces use `.lg-glass`, `.lg-glass--prominent`, `.lg-glass--clear` (`apps/web/src/styles/liquidGlass.css`). Opt a region out (game boards, drag surfaces) with `data-lg-off`. Default framer-motion transition is an iOS spring set by `MotionConfig` in `App.jsx`.
- **Icons**: monochrome Material Symbols only (`bg-muted`, `text-foreground`) on public pages — no emoji, no colorful icon badges.
- **Public portfolio pages** (`apps/web/src/pages/public/IntroductionPage.jsx`, `ServicesPage.jsx`): prices and copy are author-written — don't change them without asking; UI-only changes are fine.
- **JOY wallet/QR**: QR payloads are opaque server-signed HMAC tokens (`apps/server/utils/joyQrToken.js`); the client never constructs or parses them.

## gstack

Gstack is installed for Codex with namespaced skills (`gstack-*`) so it does
not shadow the repo's existing skills. Use the gstack workflow for substantial
product work:

- Product discovery or a new idea: `gstack-office-hours`
- Strategy and scope: `gstack-plan-ceo-review`
- Architecture and failure modes: `gstack-plan-eng-review`
- Design planning: `gstack-plan-design-review` or `gstack-design-consultation`
- End-to-end planning: `gstack-autoplan`
- Bug investigation: `gstack-investigate`
- Code review: `gstack-review`
- Browser QA: `gstack-qa` or report-only `gstack-qa-only`
- Security audit: `gstack-cso`
- Release: `gstack-ship` or `gstack-land-and-deploy`
- Retrospective: `gstack-retro`

Gstack is the virtual product and engineering team used to build this repo. It
is not imported into the production application. Production AI employees live
behind Node admin routes, use `apps/server/services/aiGateway.js`, and must follow
the approval and audit rules in `docs/ai-workforce.md`.
