import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes.js';
import bioRoutes from './routes/bioRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fileToolsRoutes from './routes/fileToolsRoutes.js';
import companionRoutes from './routes/companionRoutes.js';
import iotRoutes from './routes/iotRoutes.js';
import { isEduEmail } from './utils/eduEmail.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

// Middleware
const allowedOrigins = [
  ...((process.env.CLIENT_URLS || "").split(",")),
  "https://www.hugowishpax.studio",
  "https://hugowishpax.studio"
].filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (isDev && localOriginRegex.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Security Headers (Helmet protects against well known web vulnerabilities)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://img.vietqr.io"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://accounts.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// CDN Edge Cache middleware (Bỏ đi, sẽ set trực tiếp trong route để không bị ghi đè)

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Response Compression (Significantly reduces payload size)
app.use(compression());

// Rate Limiting (Queue algorithm to prevent DDoS and spam)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Quá nhiều truy cập từ IP này, vui lòng thử lại sau 15 phút.' }
});
app.use('/api', globalLimiter);

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 200, // Tối ưu connection pool cho 1 triệu user
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Khởi chạy Bloom Filter (Tập hợp các slug hợp lệ để chặn O(1))
    try {
      const Bio = (await import('./models/Bio.js')).default;
      const bios = await Bio.find({}, 'slug');
      global.validSlugs = new Set(bios.map(b => b.slug));
      console.log(`🛡️ Bloom Filter initialized with ${global.validSlugs.size} slugs`);
    } catch(err) {
      console.error('Bloom filter error:', err);
    }

    try {
      const Admin = (await import('./models/Admin.js')).default;
      const count = await Admin.countDocuments();
      if (count === 0) {
        await Admin.create({
          username: 'fff54767e0dfd8c560629c4be9bd186ea0682d509128989eccda5c166f295258', // Hashed "HugoStudioAdmin"
          password: 'ac5828f24a8a65e366395faa1d58abe1e2dda05853e45bdb0ae696712e3f1bb3'  // Hashed "Hugo123@"
        });
        console.log('👥 Default admin account seeded successfully in MongoDB');
      }
    } catch (err) {
      console.error('Error seeding admin account:', err);
    }
  })
  .catch(err => console.error(' MongoDB connection failed:', err));

import customerRoutes from './routes/customerRoutes.js';
import vcardRoutes from './routes/vcardRoutes.js';
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
import webauthnRoutes from './routes/webauthnRoutes.js';

// Routes
app.use('/api/data', dataRoutes);
app.use('/api/bios', bioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileToolsRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/customer-projects', customerRoutes);
app.use('/api/vcard', vcardRoutes);
app.use('/api/payos', payosRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/chess', chessRoutes);
app.use('/api/joy', joyRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/utility-store', utilityStoreRoutes);
app.use('/api/joy-gift-cards', joyGiftCardRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/radio', radioRoutes);
app.use('/api/arcade', arcadeRoutes);

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

import { runBirthdayAutomation } from './utils/birthdayAutomation.js';
import { initCompanionScheduler } from './utils/companionScheduler.js';
import { initProactivePushService } from './services/proactivePushService.js';
import { initSmartNotificationService } from './services/smartNotificationService.js';
import { initChessWS } from './services/chessWS.js';
import { initCronJobs } from './utils/cronJobs.js';

// Create HTTP server so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket server for real-time IoT data (path: /ws)
const wss = new WebSocketServer({ noServer: true });

// Chess WebSocket server (path: /ws/chess)
const chessWss = initChessWS({ noServer: true });

// Manual WebSocket upgrade dispatcher
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

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
  const token = url.searchParams.get('token'); // email-based auth token

  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }

  // token is the user's email (simple email-based auth)
  const email = token;

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
});
// Nodemon watch trigger
