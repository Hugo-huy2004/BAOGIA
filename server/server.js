import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { oauthMetadata } from './routes/oauthRoutes.js';
import { isEduEmail } from './utils/eduEmail.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { cachePolicy } from './middleware/cachePolicy.js';
import mongoSanitize from 'express-mongo-sanitize';
import { requireAdultMember } from './middleware/authMiddleware.js';
import { mountServices } from './services.manifest.js';
import { initLifecycleEmailService } from './services/lifecycleEmailService.js';
import {
  requestThreatGuard,
  safeServerErrors,
  securityIpGate,
} from './services/securityEnforcement.js';
import { reportSpecialistIncident } from './services/aiIncidentResponseService.js';
import mongoose from 'mongoose';
import {
  connectDatabase,
  oauthCorsOptions,
  appCorsOptions,
  globalLimiter,
  getRedisStatus,
} from './config/index.js';
import { setupWebSocketServers } from './services/websocketServer.js';

dotenv.config();

const app = express();
app.use(cachePolicy);

// Trust the first proxy in front of the app (Railway/Render/Vercel/Nginx all
// put exactly one).
app.set('trust proxy', 1);

// 8099 chứ không phải 8081: 8081 là cổng mặc định của Metro/Expo, mở bất kỳ dự
// án React Native nào là mất cổng — và Metro trả HTML kèm status 200 cho mọi
// đường dẫn, nên `/api/*` "thành công" với một trang web thay vì JSON.
const PORT = process.env.PORT || 8099;

// CORS — cấu hình tập trung trong config/cors.js (Quy tắc 4)
app.use('/api/oauth', cors(oauthCorsOptions));
app.use(cors(appCorsOptions));

app.use(cookieParser());

// Reject blocked networks before parsing or buffering their request bodies.
app.use(securityIpGate);

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buffer) => {
    // Sentry signs the exact webhook bytes. Preserve them only for this small
    // endpoint instead of retaining a second copy of every JSON request.
    if (req.originalUrl?.split('?')[0] === '/api/ops/sentry-hook') {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));
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
      // API không serve trang HTML nào cần chạy script inline — đừng mở cửa đó.
      scriptSrc: ["'self'", "https://accounts.google.com"],
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
      connectSrc: ["'self'", "wss:", "ws:", "https://api.cloudinary.com", "https://accounts.google.com", "https://api.exchangerate-api.com", "https://*.trycloudflare.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.trycloudflare.com", "https://trycloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
}));

// CDN Edge Cache middleware (Bỏ đi, sẽ set trực tiếp trong route để không bị ghi đè)

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Response Compression (Significantly reduces payload size)
app.use(compression());

// Rate Limiting — cấu hình tập trung trong config/limiter.js (Quy tắc 4)
app.use('/api', globalLimiter);

// MongoDB Connection & Seeds — cấu hình tập trung trong config/database.js (Quy tắc 4)
await connectDatabase();

import { initTelegramBot } from './routes/telegramWebhookRoutes.js';

// ── CỔNG API ────────────────────────────────────────────────────────────────
// 48 dòng `app.use('/api/...')` viết tay đã chuyển vào services.manifest.js.
// Thêm tính năng = thêm một dòng ở BẢN KHAI đó, không sửa tệp này nữa.
//
// `GUARDS` là cầu nối giữa tên middleware trong bản khai và hàm thật. Bản khai
// cố ý không import gì để `gen-nginx.mjs` đọc được nó mà không phải dựng cả
// app; đổi lại, guard phải tra qua bảng này.
const GUARDS = { requireAdultMember };
const mounted = await mountServices(app, GUARDS);
console.log(`🚪 Cổng API: đã mount ${mounted.length} service`);

// Đứng ngoài bản khai: đây là MỘT handler ở đường tuyệt đối, không phải router
// gắn theo prefix — không có gì cho nginx định tuyến.
app.get('/.well-known/oauth-authorization-server', oauthMetadata);
// Bot Telegram của admin (OTP 2FA + điều khiển từ xa). Gọi tường minh ở đây
// thay vì tự khởi động lúc import: import ESM chạy TRƯỚC dotenv.config() nên
// khi đó process.env.TELEGRAM_BOT_TOKEN còn rỗng và bot im lặng chết.
// Cũng chỉ MỘT process: hai nơi cùng long-polling thì Telegram trả 409 mỗi
// phút và bot thật câm tiếng (bẫy đã gặp, xem chú thích ở cuối tệp).
if (process.env.RUN_CRON !== 'false') initTelegramBot();

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
const healthHandler = (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisInfo = getRedisStatus();
  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: { status: dbStatus, name: mongoose.connection.name || 'hugostudio' },
    redis: redisInfo,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    },
    version: '2.0.0',
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Global error handler — persists any uncaught route error to the admin
// System dashboard, then returns a clean 500. Must be after all routes.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err?.status || 500;
  Sentry.captureException(err, {
    tags: { source: 'express', status: String(status) },
    extra: { method: req?.method, path: req?.originalUrl },
  });
  if (status >= 500) {
    reportSpecialistIncident({
      specialist: 'server_specialist',
      event: {
        type: 'server-error',
        name: err?.name,
        message: err?.message || 'Unhandled route error',
        stack: err?.stack,
        method: req?.method,
        path: req?.originalUrl,
        status,
        source: 'express',
      },
    }).catch((incidentError) => console.warn('[server-specialist]', incidentError.message));
  }
  console.error('[Route Error]', req?.originalUrl, err?.message);
  res.status(status).json({ code: status >= 500 ? 'SERVER_ERROR' : 'REQUEST_FAILED', error: 'Đã xảy ra lỗi máy chủ.' });
});

import { runBirthdayAutomation } from './utils/birthdayAutomation.js';
import { initCompanionScheduler } from './utils/companionScheduler.js';
import { initProactivePushService } from './services/proactivePushService.js';
import { initSmartNotificationService } from './services/smartNotificationService.js';
import { initChessWS } from './services/chessWS.js';
import { initRealtimeFanout } from './utils/realtime.js';
import { initCronJobs } from './utils/cronJobs.js';
import { initCompanionMemoryCron } from './services/companionMemoryCron.js';
// Safety net: a stray promise rejection (e.g. a background fire-and-forget task)
// must not crash the whole server — log + alert instead.
process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  Sentry.captureException(error, { tags: { source: 'unhandledRejection' } });
  reportSpecialistIncident({
    specialist: 'server_specialist',
    event: {
      type: 'unhandled-rejection',
      name: error.name,
      message: error.message,
      stack: error.stack,
      source: 'node-process',
    },
  }).catch((incidentError) => console.warn('[server-specialist]', incidentError.message));
});

// Create HTTP server so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket servers & upgrade dispatcher — quản lý tập trung trong services/websocketServer.js (Quy tắc 2).
// Phục vụ các kênh WS: '/ws' (realtime) và '/ws/chess' (cờ vua).
setupWebSocketServers(server);

/**
 * CHỈ MỘT process được chạy cron.
 *
 * Mọi việc định kỳ bên dưới đều CÓ TÁC DỤNG PHỤ ra thế giới thật: trừ tiền, gửi
 * push, gửi email, dọn sổ cái. Chạy hai bản song song là trừ hai lần và người
 * dùng nhận hai thông báo. Hôm nay chỉ có một process nên chưa ai thấy, nhưng
 * đây đúng là thứ vỡ đầu tiên khi tách service — nên chốt nó lại ngay bây giờ.
 *
 * Mặc định BẬT, để hành vi hiện tại không đổi. Khi tách:
 *   - process web:   RUN_CRON=false
 *   - đúng MỘT worker: để trống (hoặc RUN_CRON=true)
 */
const RUN_CRON = process.env.RUN_CRON !== 'false';

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}/ws`);
  console.log(`⏰ Cron: ${RUN_CRON ? 'BẬT ở process này' : 'tắt (RUN_CRON=false)'}`);

  // Loan tin realtime giữa các process (chỉ hoạt động khi có REDIS_URL).
  initRealtimeFanout();

  if (!RUN_CRON) return;

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

  // Marketing chỉ gửi cho thành viên đã tự opt-in; lịch chạy ở đây để tuân thủ
  // cùng công tắc RUN_CRON với các tác vụ có tác dụng phụ khác.
  initLifecycleEmailService();

  // Initialize daily cron jobs (e.g. JoyLedger 14-day cleanup)
  initCronJobs();

  // Weekly wellness digest → CompanionHistory.longTermMemories (Sunday 22:00)
  initCompanionMemoryCron();

  // Initialize the HugoCommunication AI auto-poster (every 15m, max 20/day, 7-day TTL)

  // Telegram: chế độ do initTelegramBot() ở trên quyết định (webhook khi có URL
  // công khai, long-polling khi TELEGRAM_ENABLE_POLLING=true, còn lại là chỉ
  // gửi). Trước đây chỗ này gọi thẳng startTelegramLongPolling() không kèm điều
  // kiện nào, nên mọi máy dev đều bật polling bất chấp cấu hình — máy dev gỡ
  // mất webhook của production (bot thật câm) và log dev đầy "getUpdates lỗi
  // 409" mỗi phút.

  // Keep-warm is deliberately NOT done here any more. A self-ping kept the free
  // instance awake 24/7 (~730h of the 750h monthly quota) and could never wake
  // the process back up once Render had actually suspended it. An external
  // pinger does both, on a schedule we control: see workers/keepalive/.
});

// Graceful shutdown handling (SIGTERM, SIGINT) — Chuẩn Node.js an toàn
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Nhận tín hiệu ${signal}: Bắt đầu đóng server an toàn...`);
  server.close(async () => {
    console.log('HTTP & WebSocket server đã ngừng nhận kết nối mới.');
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection đã đóng an toàn.');
      }
    } catch (e) {
      console.warn('⚠️ Lỗi khi đóng MongoDB:', e.message);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Đóng server quá thời gian chờ (10s) — buộc dừng.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

