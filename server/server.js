import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes.js';
import bioRoutes from './routes/bioRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminBrainRoutes from './routes/adminBrainRoutes.js';
import coderResourceRoutes from './routes/coderResourceRoutes.js';
import fileToolsRoutes from './routes/fileToolsRoutes.js';
import companionRoutes from './routes/companionRoutes.js';
import aiProxyRoutes from './routes/aiProxyRoutes.js';
import iotRoutes from './routes/iotRoutes.js';
import { isEduEmail } from './utils/eduEmail.js';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './utils/secrets.js';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { requireAdultMember } from './middleware/authMiddleware.js';
import {
  findActiveSecurityBlock,
  recordSecurityViolation,
  requestThreatGuard,
  safeServerErrors,
  securityIpGate,
  sendSecurityBlockResponse,
} from './services/securityEnforcement.js';

dotenv.config();

const app = express();

// Trust the first proxy in front of the app (Railway/Render/Vercel/Nginx all
// put exactly one). Without this, req.ip is the PROXY's IP, so express-rate-
// limit keys EVERY user into a single shared bucket — the whole userbase then
// blows the 1500/15min cap almost instantly and everyone gets 429. Trusting
// one hop makes req.ip the real client (from X-Forwarded-For) so each user gets
// their own bucket. We trust exactly 1 (not `true`) so clients can't spoof
// X-Forwarded-For to dodge the limiter.
app.set('trust proxy', 1);

// 8099 chứ không phải 8081: 8081 là cổng mặc định của Metro/Expo, mở bất kỳ dự
// án React Native nào là mất cổng — và Metro trả HTML kèm status 200 cho mọi
// đường dẫn, nên `/api/*` "thành công" với một trang web thay vì JSON.
const PORT = process.env.PORT || 8099;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

// Middleware
const allowedOrigins = [
  ...((process.env.CLIENT_URLS || "").split(",")),
  "https://www.hugowishpax.studio",
  "https://hugowishpax.studio",
  // The App Store build is not served over http(s): WKWebView loads it from
  // `capacitor://localhost`, and that string is what lands in the Origin
  // header. It is a constant baked into Capacitor, not a host anyone can point
  // DNS at, so listing it literally is the whole check — a web page cannot
  // forge this origin. Without it every request from the app is a CORS
  // rejection, which reaches the client as a network error and reads like the
  // phone is offline.
  // Android is not covered here: with androidScheme "https" its origin is
  // `https://localhost`, which is a real scheme any local server can claim.
  // Give it a distinct `server.hostname` before adding it to this list.
  "capacitor://localhost"
].filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

// Origin lạ đã bị từ chối, ghi nhớ để không lặp lại log. Reset khi restart —
// đủ dùng, và không phình theo thời gian như một bản ghi mỗi request.
const corsRejected = new Set();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (isDev && localOriginRegex.test(origin))) {
      return callback(null, true);
    }
    // KHÔNG ném Error ở đây. CORS là cơ chế của TRÌNH DUYỆT — chặn tại server
    // không ngăn được curl hay bot, chúng bỏ qua CORS hoàn toàn. Nhưng ném Error
    // thì mỗi lượt bot quét thành: một stack trace, một bản ghi ErrorLog trong
    // MongoDB, một console.error, và một 500 sai (đúng ra là 403).
    // Thực tế: 23/23 dòng đầu tiên của error log đều là "Blocked by CORS",
    // nhấn chìm mọi lỗi thật. Trả false = không cấp header, trình duyệt tự chặn.
    if (!corsRejected.has(origin)) {
      corsRejected.add(origin);
      console.warn('[CORS] từ chối origin lạ:', origin);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(cookieParser());

// Reject blocked networks before parsing or buffering their request bodies.
app.use(securityIpGate);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// High-confidence exploit and server-owned JOY-field detection.
app.use(requestThreatGuard);

// Never expose driver paths, query details or stack-like diagnostics in 5xx.
app.use(safeServerErrors);

// Security Headers (Helmet protects against well known web vulnerabilities)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      // CDN ảnh của các toà soạn trong PUBLISHER_FEEDS (studentNewsService).
      // Allowlist đúng domain thay vì mở "https:" — và ảnh tải trực tiếp từ CDN
      // báo, không proxy qua server để khỏi ăn outbound bandwidth của Render.
      imgSrc: [
        "'self'", "data:",
        "https://res.cloudinary.com", "https://img.vietqr.io",
        "https://eduoka.com", "https://static.topcv.vn",
        "https://*.vnecdn.net", "https://*.tuoitre.vn", "https://*.thanhnien.vn",
        "https://ichef.bbci.co.uk", "https://*.bbci.co.uk",
      ],
      connectSrc: ["'self'", "wss:", "ws:", "https://api.cloudinary.com", "https://accounts.google.com", "https://api.exchangerate-api.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false
}));

// CDN Edge Cache middleware (Bỏ đi, sẽ set trực tiếp trong route để không bị ghi đè)

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Response Compression (Significantly reduces payload size)
app.use(compression());

// Mặc định KHÔNG cho cache. Cloudflare đứng trước api.* và có Cache Rule cho
// /api/*; route nào quên đặt Cache-Control mà lại trả dữ liệu của một member cụ
// thể thì CDN có thể cache rồi trả nhầm cho người khác. Chốt chặn ở đây để chỉ
// những route CỐ Ý đặt `public, s-maxage=...` mới được cache.
// Phải hook writeHead: header của route được đặt sau middleware này.
app.use((req, res, next) => {
  const writeHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'private, no-store');
    return writeHead.apply(this, args);
  };
  next();
});

// Rate Limiting — skipped for localhost (Vite proxy collapses all dev requests
// to 127.0.0.1/::1, making the shared IP window hit 429 almost immediately in
// dev with React StrictMode double-invoking effects). Production keeps the cap.
const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 1500, // 0 = unlimited in dev; 1500/15 min (1.67 req/s avg) in prod
  standardHeaders: true,
  legacyHeaders: false,
  // Telemetry (/api/ops/client-event) must NOT count against a user's API
  // budget: it fires on web-vitals + every slow/failed request, so counting it
  // would (a) burn the quota faster and (b) once a 429 storm starts, each 429
  // gets reported as another /api hit — a self-amplifying loop that keeps the
  // user rate-limited. Excluding it breaks that feedback loop.
  skip: (req) => isDev || LOCALHOST_IPS.has(req.ip) || req.originalUrl.startsWith('/api/ops'),
  message: { error: 'Quá nhiều truy cập từ IP này, vui lòng thử lại sau 15 phút.' },
  handler: async (req, res, _next, options) => {
    try {
      // One runaway browser receives 429; a repeated window breach within 24h
      // is treated as an availability attack and blocks the network for 30d.
      const result = await recordSecurityViolation({
        req,
        category: 'availability_attack',
        severity: 'high',
        ruleId: 'global_rate_limit_repeated',
        evidence: `${req.method} ${req.originalUrl}`,
        enforcement: 'threshold',
      });
      if (result.block) return sendSecurityBlockResponse(res, result.block);
    } catch (error) {
      console.error('[rate-limit security event]', error.message);
    }
    return res.status(options.statusCode).json(options.message);
  },
});
app.use('/api', globalLimiter);

// MongoDB Connection (Pool size 25 suited for Render 512MB RAM limits)
mongoose.connect(MONGODB_URI, {
  maxPoolSize: process.env.MAX_DB_POOL ? parseInt(process.env.MAX_DB_POOL, 10) : 25,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // In-memory valid-slug set: O(1) rejection of bogus /bio/:slug hits before
    // they reach MongoDB. Kept in sync by bioRoutes on create/rename/delete.
    // NOTE: per-process — if the API ever runs multiple instances, move this
    // to Redis (redisClient.js already exists).
    try {
      const Bio = (await import('./models/Bio.js')).default;
      // .lean() → plain objects, no Mongoose document hydration for a
      // throwaway boot scan of every slug.
      const bios = await Bio.find({}, 'slug').lean();
      global.validSlugs = new Set(bios.map(b => b.slug));
      console.log(`🛡️ Valid-slug set initialized with ${global.validSlugs.size} slugs`);
    } catch(err) {
      console.error('Valid-slug set error:', err);
    }

    try {
      const Admin = (await import('./models/Admin.js')).default;
      const count = await Admin.countDocuments();
      if (count === 0) {
        // Seed the first admin from env only — never hardcode credentials in a
        // public repo. Set ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD once,
        // start the server, then remove them from the env.
        const seedUser = process.env.ADMIN_SEED_USERNAME;
        const seedPass = process.env.ADMIN_SEED_PASSWORD;
        if (seedUser && seedPass) {
          const cryptoMod = await import('crypto');
          const bcryptMod = (await import('bcryptjs')).default;
          // Username is a lookup hash; password is bcrypt (salted, slow) — never SHA-256.
          const usernameHash = cryptoMod.createHash('sha256').update(seedUser).digest('hex');
          await Admin.create({ username: usernameHash, password: await bcryptMod.hash(seedPass, 12) });
          console.log('👥 Admin account seeded from ADMIN_SEED_* env vars');
        } else {
          console.warn('⚠️  No admin account exists and ADMIN_SEED_USERNAME/ADMIN_SEED_PASSWORD are not set — admin login unavailable until seeded.');
        }
      }
    } catch (err) {
      console.error('Error seeding admin account:', err);
    }
  })
  .catch(err => console.error(' MongoDB connection failed:', err));

import customerRoutes from './routes/customerRoutes.js';
import payosRoutes from './routes/payosRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js';
import inboxRoutes from './routes/inboxRoutes.js';
import chessRoutes from './routes/chessRoutes.js';
import joyRoutes from './routes/joyRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import utilityStoreRoutes from './routes/utilityStoreRoutes.js';
import joyGiftCardRoutes from './routes/joyGiftCardRoutes.js';
import checkinRoutes from './routes/checkinRoutes.js';
import presenceRoutes from './routes/presenceRoutes.js';
import radioRoutes from './routes/radioRoutes.js';
import arcadeRoutes from './routes/arcadeRoutes.js';
import cinemaRoutes from './routes/cinemaRoutes.js';
import webauthnRoutes from './routes/webauthnRoutes.js';
import memberAuthRoutes from './routes/memberAuthRoutes.js';
import memberProgressRoutes from './routes/memberProgressRoutes.js';
import hugoTeamRoutes from './routes/hugoTeamRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import opsRoutes from './routes/opsRoutes.js';
import otaRoutes from './routes/otaRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import coderLessonRoutes from './routes/coderLessonRoutes.js';
import todayRoutes from './routes/todayRoutes.js';
import storeCartRoutes from './routes/storeCartRoutes.js';
import storePromoRoutes from './routes/storePromoRoutes.js';
import storePlanRoutes from './routes/storePlanRoutes.js';

// Routes
app.use('/api/ops', opsRoutes);
app.use('/api/security', securityRoutes);
// Unauthenticated on purpose: the store builds hit this before anyone signs
// in, and it only ever returns the public release pointer.
app.use('/api/ota', otaRoutes);
app.use('/api/auth/member', memberAuthRoutes);
app.use('/api/member/progress', memberProgressRoutes);
app.use('/api/hugoteam', hugoTeamRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/bios', bioRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/brain', adminBrainRoutes);
app.use('/api/coder-resources', coderResourceRoutes);
app.use('/api/coder-lessons', coderLessonRoutes);
app.use('/api/today', todayRoutes);
app.use('/api/files', fileToolsRoutes);
app.use('/api/companion', companionRoutes);
// Toàn bộ /api/ai chỉ phục vụ HugoPSY (chat, trị liệu, phân tích bài test)
// nên cổng 18+ đặt luôn ở mount thay vì rải trong aiProxyRoutes.
app.use('/api/ai', requireAdultMember, aiProxyRoutes);
app.use('/api/customer-projects', customerRoutes);
app.use('/api/payos', payosRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/chess', chessRoutes);
app.use('/api/joy', joyRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/utility-store', utilityStoreRoutes);
app.use('/api/store', storeCartRoutes);
app.use('/api/store', storePromoRoutes);
app.use('/api/store', storePlanRoutes);
app.use('/api/joy-gift-cards', joyGiftCardRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/radio', radioRoutes);
app.use('/api/arcade', arcadeRoutes);
app.use('/api/cinema', cinemaRoutes);
// Educational Email Validation
app.get('/api/auth/verify-edu', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    const isEdu = await isEduEmail(email);
    res.json({ isEduEmail: isEdu });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health checks. Render's web-service healthCheckPath uses /health, while the
// frontend/dev proxy can still call /api/health.
const healthHandler = (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Global error handler — persists any uncaught route error to the admin
// System dashboard, then returns a clean 500. Must be after all routes.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  logError({ level: 'error', source: 'route', message: err?.message || 'Unhandled route error', stack: err?.stack, path: req?.originalUrl, email: req?.memberEmail || '' });
  console.error('[Route Error]', req?.originalUrl, err?.message);
  res.status(err?.status || 500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
});

import { runBirthdayAutomation } from './utils/birthdayAutomation.js';
import { initCompanionScheduler } from './utils/companionScheduler.js';
import { initProactivePushService } from './services/proactivePushService.js';
import { initSmartNotificationService } from './services/smartNotificationService.js';
import { initChessWS } from './services/chessWS.js';
import { initCronJobs } from './utils/cronJobs.js';
import { initCompanionMemoryCron } from './services/companionMemoryCron.js';
import { sendAlert, logError } from './utils/alert.js';

// Safety net: a stray promise rejection (e.g. a background fire-and-forget task)
// must not crash the whole server — log + alert instead.
process.on('unhandledRejection', (reason) => {
  sendAlert('unhandledRejection', { reason: String(reason?.stack || reason?.message || reason).slice(0, 500) });
});

// Create HTTP server so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket server for real-time IoT data (path: /ws)
const wss = new WebSocketServer({ noServer: true });

// Chess WebSocket server (path: /ws/chess)
const chessWss = initChessWS({ noServer: true });

// Manual WebSocket upgrade dispatcher
server.on('upgrade', async (request, socket, head) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const { pathname } = requestUrl;

  try {
    const forwarded = String(request.headers['x-forwarded-for'] || '').split(',').map((item) => item.trim()).filter(Boolean);
    const clientIp = forwarded.at(-1) || request.socket.remoteAddress || '';
    let email = '';
    if (pathname === '/ws') {
      const token = requestUrl.searchParams.get('token');
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.role === 'member') email = decoded.email || '';
        } catch {
          // The connection handler below returns the normal auth close code.
        }
      }
    }
    const block = await findActiveSecurityBlock({ ip: clientIp, email });
    if (block) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Type: application/json\r\nCache-Control: no-store\r\n\r\n{"error":"ACCESS_BLOCKED"}');
      socket.destroy();
      return;
    }
  } catch (error) {
    console.error('[WebSocket security gate]', error.message);
  }

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/chess') {
    chessWss.handleUpgrade(request, socket, head, (ws) => {
      chessWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// global.wsClients maps email -> Set of connected WebSocket clients
global.wsClients = {};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }

  // The channel carries private wallet/notification events, so the subscriber
  // must prove identity: token is a member JWT and the email comes from it —
  // a bare email here would let anyone stream any member's balance updates.
  let email;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'member' || !decoded.email) throw new Error('not a member token');
    email = decoded.email;
  } catch (err) {
    console.error('[WS Auth Error] Verification failed:', err.message);
    ws.close(4001, 'Invalid or expired token');
    return;
  }

  if (!global.wsClients[email]) {
    global.wsClients[email] = new Set();
  }
  global.wsClients[email].add(ws);

  ws.on('message', (data) => {
    // Devices can also push vitals via WebSocket
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'vitals' && msg.data) {
        // Broadcast to all other clients with same email
        for (const client of global.wsClients[email]) {
          if (client !== ws && client.readyState === 1 /* OPEN */) {
            client.send(JSON.stringify(msg));
          }
        }
      }
    } catch (_) {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    if (global.wsClients[email]) {
      global.wsClients[email].delete(ws);
      if (global.wsClients[email].size === 0) {
        delete global.wsClients[email];
      }
    }
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Error:', err.message);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}/ws`);

  // Initialize birthday automation check
  let lastCheckedDay = null;
  setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDate();
    if (lastCheckedDay !== currentDay) {
      lastCheckedDay = currentDay;
      console.log(`[Birthday Automation] Running daily checks at ${now.toLocaleString()}`);
      await runBirthdayAutomation().catch(console.error);
    }
  }, 60000);

  // Initialize companion daily reminder push scheduler (07:30, 15:00, 20:30)
  initCompanionScheduler();

  // Initialize AI Proactive Push Notifications scheduler
  initProactivePushService();

  // Initialize Duolingo-style smart push (sleep, wellness, streak)
  initSmartNotificationService();

  // Initialize daily cron jobs (e.g. JoyLedger 14-day cleanup)
  initCronJobs();

  // Weekly wellness digest → CompanionHistory.longTermMemories (Sunday 22:00)
  initCompanionMemoryCron();

  // Initialize the HugoCommunication AI auto-poster (every 15m, max 20/day, 7-day TTL)

  // Keep-warm is deliberately NOT done here any more. A self-ping kept the free
  // instance awake 24/7 (~730h of the 750h monthly quota) and could never wake
  // the process back up once Render had actually suspended it. An external
  // pinger does both, on a schedule we control: see workers/keepalive/.
});
// Nodemon watch trigger
