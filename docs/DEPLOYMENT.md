# Deployment Guide — Hugo Studio / HugoPsy

## Prerequisites

- **Render.com account** (where the server runs)
- **Vercel account** (where frontend is deployed)
- **GitHub repository** connected to both Render and Vercel

## Student verification expiry migration

`Bio.expiresAt` previously had a MongoDB TTL index, which could delete a profile
without cleaning up the member's related records. The application now removes
expired, unverified accounts through the shared account-lifecycle service. A
request checks the deadline immediately, and a scheduled sweep retries cleanup
every 15 minutes. Deleted email addresses are retained only as keyed hashes so
the old account cannot be recreated by a later login.

Before deploying this change, back up the database and run the migration with
the production `MONGODB_URI` set in `server/.env`:

```bash
npm run migrate:bio-expiry-index
```

The script drops only a TTL index whose sole key is `expiresAt`, ensures a
regular index exists, then caps each existing unverified account's trial at
seven days from the migration run. Earlier deadlines are preserved, and
`expiresAt` is synchronized with the effective trial deadline. Verified
education-email accounts are not changed. The normalization is idempotent.
Confirm the backup and target database before running it; this migration has
not been run against production by the development workflow.

Verification evidence for new submissions is stored in the application
database, is available only to admins while under review, and is removed when
the request is approved or rejected. Members can submit up to two requests;
after the second rejection they can still contact support for a manual review.
The account cleanup removes member-owned profile, notification, credential,
learning, companion, arcade, chess, JOY ledger, stock, device, support, and
verification records. A keyed email hash is retained to prevent the same
expired account from being recreated. Separate customer bookings/projects and
hashed security or debt-enforcement records are not removed merely because
they share an email; those have independent operational/security purposes.

---

## 1. Render Deployment (Backend + AI Server)

### Step 1: Generate Required Secrets

Generate secure random secrets for production:

```bash
# Generate JWT_SECRET (32-char hex)
openssl rand -hex 32

# Generate JOY_QR_SECRET (32-char hex)
openssl rand -hex 32
```

Save these values securely (e.g., in a password manager or secure note).

### Step 2: Configure Render Environment Variables

1. Go to **Render Dashboard** → select the `hugostudio-api` service (or create a new Web Service)
2. Navigate to **Environment** tab
3. Add or update these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `JWT_SECRET` | *(your generated secret)* | **REQUIRED** — server crashes without it |
| `JOY_QR_SECRET` | *(your generated secret)* | **REQUIRED** — server crashes without it |
| `MONGODB_URI` | *(your MongoDB connection string)* | Can be MongoDB Atlas or self-hosted |
| `PAYOS_CLIENT_ID` | *(from PayOS dashboard)* | Payment processor integration |
| `PAYOS_API_KEY` | *(from PayOS dashboard)* | Payment processor integration |
| `PAYOS_CHECKSUM_KEY` | *(from PayOS dashboard)* | Payment processor integration |
| `GOOGLE_CLIENT_ID` | *(your Google OAuth client ID)* | Must match frontend `VITE_GOOGLE_CLIENT_ID` |
| `GEMINI_API_KEY` | *(optional)* | AI provider API key |
| `ALLOWED_ORIGINS` | `https://hugowishpax.studio,https://www.hugowishpax.studio` | CORS-allowed domains |
| `PYTHONUNBUFFERED` | `1` | For logging |

4. Click **Save Changes**
5. Render will redeploy automatically with the new environment variables

### Step 3: Verify Deployment

After redeployment, check:
- Render logs show `✅ MongoDB connected successfully`
- No `FATAL: JWT_SECRET is not set` error
- `/health` endpoint returns `200` OK

```bash
curl -i https://api.hugowishpax.studio/health
```

The health response includes per-process WebSocket counts (`activeConnections`,
`acceptedConnections`, `closedConnections`, `staleConnectionsTerminated`) and
event-loop delay percentiles since process start. Connection counters also
reset when the process restarts. These are operational signals, not a capacity
guarantee: measure them alongside request latency, error rate, CPU/RAM, and
MongoDB connection usage during a staged load test. Do not use production as a
load-test target.

Keep MongoDB `MAX_DB_POOL` aligned with both observed query concurrency and the
database's connection limit. With multiple app instances, the configured pool
is per instance; verify the total possible connections before scaling out.
WebSocket fanout between instances requires `REDIS_URL`, and every event path
must use the shared realtime broadcaster before enabling multiple instances.

---

## 2. Vercel Deployment (Frontend)

### Step 1: Configure Frontend Environment

Vercel auto-deploys when you push to `main` branch. Set frontend environment variables:

1. Go to **Vercel Project Settings** → **Environment Variables**
2. Add for **Production** environment:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `/api` | Relative path (Vercel proxies to https://api.hugowishpax.studio/api) |
| `VITE_GOOGLE_CLIENT_ID` | *(same as server `GOOGLE_CLIENT_ID`)* | Must match backend |
| `VITE_ENABLE_CLIENT_MONITORING` | `true` | Enable client event reporting (optional) |
| `VITE_AI_URL` | `http://127.0.0.1:8000` | Internal to server (dev-only) |

3. Click **Save**

### Step 2: Verify Build

Push a commit to `main` to trigger Vercel build:
```bash
git commit --allow-empty -m "Trigger Vercel build"
git push origin main
```

Check **Vercel Dashboard** → build should complete without errors.

---

## 3. GitHub Actions CI

The CI workflow automatically:
1. **Builds frontend** — runs `npm run build`, outputs to `dist/`
2. **Validates server** — runs `npm ci` in `server/`
3. **Disables GitHub Pages** — Vercel is the canonical deploy target

Workflow file: `.github/workflows/ci.yml`

**If CI fails:**
- Check the **Details** link on the failed workflow
- Most common: dependency lock file mismatch → run `npm ci && cd server && npm ci` locally and push updated lock files

---

## 4. Troubleshooting

### Issue: `FATAL: JWT_SECRET is not set`
- **Cause:** Environment variable not set in Render
- **Fix:** Go to Render Environment tab and add the secret (see Step 2 above)

### Issue: `/api/ops/client-event` returns 404
- **Cause:** Frontend `VITE_API_URL` pointing to wrong host
- **Fix:** Ensure `VITE_API_URL` matches the deployed backend host in Vercel env vars

### Issue: Workbox service worker errors in browser
- **Cause:** Duplicate precache entries (already fixed in code)
- **Fix:** Clear browser cache and service worker, reload page

### Issue: Build slow or fails on Render
- **Cause:** Node version mismatch or npm cache stale
- **Fix:** 
  - Clear Render build cache: **Render Dashboard** → **Manual Deploy** → Clear build cache
  - Check `render.yaml` specifies correct `buildCommand`

---

## 5. Quick Redeploy Commands

### Redeploy server (Render)
1. Go to Render Dashboard
2. Click **Manual Deploy** (or push a git commit to trigger auto-redeploy)

### Redeploy frontend (Vercel)
1. Go to Vercel Dashboard
2. Click **Redeploy** (or push a git commit to trigger auto-redeploy)

### Redeploy both
```bash
git commit --allow-empty -m "Trigger full redeploy"
git push origin main
```

---

## 6. Production Checklist

Before going live, verify:

- [ ] `JWT_SECRET` set in Render environment
- [ ] `JOY_QR_SECRET` set in Render environment
- [ ] `VITE_API_URL` points to correct backend host in Vercel
- [ ] `GOOGLE_CLIENT_ID` matches between server and frontend
- [ ] MongoDB connection string is valid and reachable
- [ ] PayOS API keys are set (if using payments)
- [ ] SSL certificate is valid (Render/Vercel auto-manage this)
- [ ] `/health` endpoint returns 200 OK
- [ ] CI workflow passes (all checks green on GitHub)

---

## Support

For issues, check:
1. **Render logs** — tail output for errors
2. **Vercel logs** — check build/deployment logs
3. **GitHub Actions** — check CI workflow logs
4. **Browser console** — check for client-side errors
