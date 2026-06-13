# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Vite) — port 3000
```bash
npm run dev          # Start frontend dev server
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
```

### Backend (Node.js/Express) — port 8081
```bash
cd server && npm start      # Start production server
cd server && npm run dev    # Start with nodemon (hot reload)
```

### Python AI Server (FastAPI) — port 8000
```bash
cd python-ai-server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Full project setup from scratch
```bash
npm run setup   # installs both root and server/node_modules
```

---

## Architecture Overview

Three-tier system with three independent servers:

```
Browser (port 3000, Vite proxy in dev)
    │
    ├── /api/ai, /api/iot, /ws/iot  →  Python FastAPI (port 8000)
    └── /api/*                       →  Node.js Express (port 8081)
                                              │
                                         MongoDB (mongoose)
```

In production, Vite's proxy rules disappear — requests go directly to the domains set via `VITE_API_URL` and `VITE_AI_URL`.

### Frontend (`src/`)

| Path | Purpose |
|---|---|
| `src/App.jsx` | Root router. All pages are `React.lazy()`. Renders `<Navbar>` + `<Footer>` + `<HBot>` only on non-bio/non-portal routes. |
| `src/context/DataContext.jsx` | Global SWR-based data store. Fetches `/api/data` on mount and provides `data` + `mutate` everywhere via `useData()`. Most public-facing content (profile, gallery, links, settings) lives here. |
| `src/services/dataApi.js` | Primary API client (axios-style object). Used by most components. Handles 401/403 by wiping sessions and redirecting to `/login`. |
| `src/services/api.js` | Lighter client used by the sleep + AI features. Adds `X-Internal-Key` header. |
| `src/services/authSession.js` | Session helpers: `isMemberAuthenticated()`, `isAdminAuthenticated()`, `getAdminSession()` — read from `localStorage`. |
| `src/stores/uiStore.js` | Zustand: theme (light/dark), language. |
| `src/stores/wellnessStore.js` | Zustand: companion/IoT data. |
| `src/hooks/useSleepAutoDetect.js` | 8-signal passive sleep tracking (IdleDetector, PageVisibility, Battery, DeviceMotion, inactivity, beforeunload, hourly ticker, PeriodicBackgroundSync). Writes state to both `localStorage` and `CacheStorage` (for the Service Worker). |
| `src/i18n/` | i18next config + `locales/vi.json` and `locales/en.json`. |

**Route groups in App.jsx:**
- Bio/partner/preview/customer routes (`/bio/:slug`, `/s/…`, `/partner/…`, `/preview`, `/customer-portal`, `/pay/…`) — render without Navbar/Footer.
- Standard routes — render with full shell (Navbar, Footer, HBot, banners).

### Member Portal (`src/pages/member/MemberPortalPage.jsx`)

Single-page portal (~2100 lines). Tabs: **Bio (account)** | **Manage (packages)** | **Partner** (opens `hwagfu.dev` externally) | **Utilities** | **History**. Mobile tab bar is `fixed bottom-0 z-[100]`. `HBot` floats above it at `bottom-20`.

`MemberUtilitiesTab` sub-routes: QR Code, vCard, Signature, Psychological companion (Bạn Học Đường), NFC tools.

### Backend (`server/`)

| Path | Key details |
|---|---|
| `server/server.js` | Express entry. Mounts all routes. `CORS` restricted via `CLIENT_URLS` env var (comma-separated). Also hosts a WebSocket server on the same HTTP server (`/ws` path). |
| `server/routes/` | One file per domain: `bioRoutes`, `bookingRoutes`, `companionRoutes`, `iotRoutes`, `sleepRoutes`, `notificationRoutes`, `packageRoutes`, `partnerRoutes`, `payosRoutes`, `adminRoutes`, etc. |
| `server/models/` | Mongoose schemas: `Bio`, `Admin`, `Booking`, `CompanionHistory`, `IoTDevice`, `SleepLog`, `NotificationSubscription`, `Partner`, `Package`, `SupportTicket`, etc. |
| `server/middleware/authMiddleware.js` | JWT verification for protected routes. |
| `server/services/smartNotificationService.js` | Duolingo-style push scheduler — 4 cron windows (21h, 7h, 12h, 19h). Calls Python `/api/notifications/smart-push` then sends via `web-push`. |

**Auth model:** Admin uses JWT (stored in localStorage as `price-doc-admin-session`). Members use email-based sessions (`price-doc-member-session`). No cookies for auth.

### Python AI Server (`python-ai-server/`)

| Path | Purpose |
|---|---|
| `main.py` | FastAPI app. All routes require `X-Internal-Key` header (set via `INTERNAL_API_KEY` env). Single shared `GeminiService` instance. |
| `services/gemini_service.py` | Wraps Google Gemini 2.5 Flash. Methods: `chat_stream` (SSE), `analyze_sleep_health`, `generate_smart_push`, `analyze_iot_vitals`, `generate_weekly_report`. |
| `services/rate_limit_service.py` | MongoDB-backed rate limiting (falls back to in-memory). |
| `middleware/auth.py` | Checks `X-Internal-Key` on all non-health routes. |

---

## Key Env Vars

### `server/.env`
```
MONGODB_URI=
PORT=8081
CLIENT_URLS=https://hugostudio.vn,https://hugowishpax.studio
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=, CLOUDINARY_API_KEY=, CLOUDINARY_API_SECRET=
VAPID_PUBLIC_KEY=, VAPID_PRIVATE_KEY=, VAPID_CONTACT=
PAYOS_CLIENT_ID=, PAYOS_API_KEY=, PAYOS_CHECKSUM_KEY=
INTERNAL_API_KEY=
```

### Frontend (`.env` at root)
```
VITE_API_URL=https://api.hugowishpax.studio/api
VITE_AI_URL=https://ai.hugowishpax.studio
VITE_INTERNAL_API_KEY=
VITE_WS_URL=wss://api.hugowishpax.studio/ws
```

### `python-ai-server/.env`
```
GOOGLE_API_KEY=
INTERNAL_API_KEY=
ALLOWED_ORIGINS=
MONGODB_URI=
```

---

## Build & Bundle Notes

- `vite.config.js` already splits chunks: `vendor` (react/router), `framer` (framer-motion), `ui` (lucide + quill).
- `esbuild.drop` strips all `console.*` and `debugger` in production.
- Gzip + Brotli compression via `vite-plugin-compression` — the VPS must serve `.gz`/`.br` files or configure Nginx to do so.
- PWA via `vite-plugin-pwa` generates `dist/sw.js` + `dist/workbox-*.js`. The custom push notification SW is at `public/sw.js` (separate from the PWA workbox SW).
- `chunkSizeWarningLimit` is raised to 1000 KB — chunks above 500 KB still exist and should be further code-split if bundle size becomes a problem.

---

## Patterns to Follow

- **New API calls** — use `dataApi` (from `src/services/dataApi.js`) for standard CRUD; use `apiFetch`/`aiFetch` (from `src/services/api.js`) for AI or sleep endpoints that need `X-Internal-Key`.
- **Auth guard on server routes** — import and apply `authMiddleware` from `server/middleware/authMiddleware.js`.
- **New public page** — add a `React.lazy()` import and `<Route>` in `App.jsx`; page gets Navbar + Footer automatically unless its path is added to the exclusion list.
- **i18n** — all user-visible strings go through `t("key")` from `useTranslation()`. Keys live in `src/i18n/locales/vi.json` and `en.json`.
- **Theme** — dark/light class on `<html>` managed by `uiStore`. Use Tailwind `dark:` variants.
- **Tailwind CSS** — utility-first; no CSS modules. Custom animations defined in `tailwind.config.js`.
